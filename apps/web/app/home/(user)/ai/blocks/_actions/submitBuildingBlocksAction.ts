'use server';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { Database } from '~/lib/database.types';

// Utility function to convert plain text to Lexical JSON
function createInitialEditorState(text: string) {
  // Split text into paragraphs and remove empty lines
  const paragraphs = text.split('\n').filter((line) => line.trim());

  // Convert each paragraph into a Lexical node
  const children = paragraphs.map((paragraph) => {
    // Check if the line is a bullet point
    const trimmedParagraph = paragraph.trim();
    const isBulletPoint =
      trimmedParagraph.startsWith('-') || trimmedParagraph.startsWith('•');

    // Remove the bullet point character and trim whitespace
    const textContent = isBulletPoint
      ? trimmedParagraph.substring(1).trim()
      : trimmedParagraph;

    // Calculate indentation level based on leading spaces (for nested bullets)
    const leadingSpaces = paragraph.match(/^\s*/)?.[0].length ?? 0;
    const indentLevel = isBulletPoint ? Math.floor(leadingSpaces / 2) + 1 : 0;

    return {
      children: [
        {
          detail: 0,
          format: 0,
          mode: 'normal',
          style: '',
          text: textContent,
          type: 'text',
          version: 1,
        },
      ],
      direction: 'ltr',
      format: '',
      indent: indentLevel,
      type: 'paragraph',
      version: 1,
    };
  });

  return JSON.stringify({
    root: {
      children,
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  });
}

export type SubmitFormData = {
  title: string;
  audience: string;
  presentation_type: string;
  question_type: string;
  situation: string;
  complication: string;
  answer: string;
};

export async function submitBuildingBlocksAction(data: SubmitFormData) {
  const client = getSupabaseServerClient<Database>();

  try {
    const {
      data: { user },
      error: userError,
    } = await client.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Check if a submission already exists with the same data
    const { data: existingSubmission } = await client
      .from('building_blocks_submissions')
      .select('id')
      .match({
        user_id: user.id,
        title: data.title,
        audience: data.audience,
        presentation_type: data.presentation_type,
        question_type: data.question_type,
        situation: createInitialEditorState(data.situation),
        complication: createInitialEditorState(data.complication),
        answer: createInitialEditorState(data.answer),
      })
      .maybeSingle();

    // If a submission exists, return it instead of creating a new one
    if (existingSubmission) {
      return { success: true, submissionId: existingSubmission.id };
    }

    // Create new submission if none exists
    const { data: result, error } = await client
      .from('building_blocks_submissions')
      .insert({
        user_id: user.id,
        title: data.title,
        audience: data.audience,
        presentation_type: data.presentation_type,
        question_type: data.question_type,
        situation: createInitialEditorState(data.situation),
        complication: createInitialEditorState(data.complication),
        answer: createInitialEditorState(data.answer),
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error submitting building blocks:', error);
      throw new Error('Failed to submit building blocks');
    }

    return { success: true, submissionId: result.id };
  } catch (error) {
    console.error('Error in submitBuildingBlocksAction:', error);
    throw new Error('Failed to submit building blocks');
  }
}
