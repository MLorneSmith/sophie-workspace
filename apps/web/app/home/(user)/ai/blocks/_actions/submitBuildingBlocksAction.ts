'use server';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { Database } from '~/lib/database.types';

export type SubmitFormData = {
  title: string;
  audience: string;
  presentation_type: string;
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
        situation: data.situation,
        complication: data.complication,
        answer: data.answer,
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
        situation: data.situation,
        complication: data.complication,
        answer: data.answer,
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
