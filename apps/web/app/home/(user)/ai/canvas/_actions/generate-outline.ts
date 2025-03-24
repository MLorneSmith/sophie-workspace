'use server';

import { z } from 'zod';

import { enhanceAction } from '@kit/next/actions';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { lexicalToTiptap } from '../_components/editor/tiptap/utils/format-conversion';

interface TiptapNode {
  type: string;
  content?: TiptapNode[];
  attrs?: Record<string, any>;
  marks?: { type: string }[];
  text?: string;
}

interface TiptapDocument {
  type: string;
  content: TiptapNode[];
}

const EMPTY_TIPTAP_DOCUMENT: TiptapDocument = {
  type: 'doc',
  content: [],
};

const SPACER_PARAGRAPH: TiptapNode = {
  type: 'paragraph',
  content: [
    {
      type: 'text',
      text: '',
    },
  ],
};

function parseTiptapDocument(content: string | null): TiptapDocument {
  if (!content) return EMPTY_TIPTAP_DOCUMENT;
  try {
    // Try to parse as Tiptap first
    const parsed = JSON.parse(content);

    // Check if it's already in Tiptap format
    if (parsed.type === 'doc' && Array.isArray(parsed.content)) {
      return parsed as TiptapDocument;
    }

    // If not, try to convert from Lexical format
    return lexicalToTiptap(content);
  } catch {
    return EMPTY_TIPTAP_DOCUMENT;
  }
}

function hasValidText(node: TiptapNode): boolean {
  if (node.type !== 'paragraph' && node.type !== 'heading') return false;
  if (!node.content || node.content.length === 0) return false;

  return node.content.some(
    (child) =>
      child.type === 'text' &&
      typeof child.text === 'string' &&
      child.text.trim().length > 0,
  );
}

const GenerateOutlineSchema = z.object({
  submissionId: z.string().min(1, 'Submission ID is required'),
});

export const generateOutlineAction = enhanceAction(
  async function (data: z.infer<typeof GenerateOutlineSchema>, _user) {
    try {
      const supabase = getSupabaseServerClient();

      // Fetch the submission data
      const { data: submission, error } = await supabase
        .from('building_blocks_submissions')
        .select('situation, complication, answer')
        .eq('id', data.submissionId)
        .single();

      if (error || !submission) {
        throw new Error('Failed to fetch submission data');
      }

      // Parse each section's content
      const situationDoc = parseTiptapDocument(submission.situation);
      const complicationDoc = parseTiptapDocument(submission.complication);
      const answerDoc = parseTiptapDocument(submission.answer);

      // Create a combined Tiptap document
      const outlineContent: TiptapDocument = {
        type: 'doc',
        content: [
          // Situation paragraphs
          ...situationDoc.content.filter(hasValidText),
          // Add spacing if there was content
          ...(situationDoc.content.some(hasValidText)
            ? [SPACER_PARAGRAPH]
            : []),

          // Complication paragraphs
          ...complicationDoc.content.filter(hasValidText),
          // Add spacing if there was content
          ...(complicationDoc.content.some(hasValidText)
            ? [SPACER_PARAGRAPH]
            : []),

          // Answer paragraphs
          ...answerDoc.content.filter(hasValidText),
        ],
      };

      // Update the outline field in the database with stringified Tiptap document
      const { error: updateError } = await supabase
        .from('building_blocks_submissions')
        .update({ outline: JSON.stringify(outlineContent) })
        .eq('id', data.submissionId);

      if (updateError) {
        throw new Error('Failed to update outline');
      }

      return {
        success: true,
        data: outlineContent,
      };
    } catch (error) {
      console.error('Error in generate outline action:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
  {
    schema: GenerateOutlineSchema,
    auth: true,
  },
);
