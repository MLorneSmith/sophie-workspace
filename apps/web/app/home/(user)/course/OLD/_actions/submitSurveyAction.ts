'use server';

import { Database } from '@kit/supabase/database.types';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

export async function submitSurveyAction(
  surveySlug: string,
  responses: { [key: string]: string },
) {
  const client = getSupabaseServerClient<Database>();

  try {
    const {
      data: { user },
      error: userError,
    } = await client.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { data: surveyData, error: surveyError } = await client
      .from('surveys')
      .select('id')
      .eq('slug', surveySlug)
      .single();

    if (surveyError || !surveyData) {
      throw new Error(`Survey ${surveySlug} not found`);
    }

    const { data, error } = await client
      .from('survey_responses')
      .insert({
        user_id: user.id,
        survey_id: surveyData.id,
        responses: responses,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error submitting survey:', error);
      throw new Error('Failed to submit survey');
    }

    return { success: true, responseId: data.id };
  } catch (error) {
    console.error('Error in submitSurveyAction:', error);
    throw new Error('Failed to submit survey');
  }
}
