import { SupabaseClient } from '@supabase/supabase-js';

export const SURVEY_IDS = {
  SELF_ASSESSMENT: '550e8400-e29b-41d4-a716-446655440000',
};

export const SURVEY_SLUGS = {
  SELF_ASSESSMENT: 'self-assessment',
};

export async function ensureSurveyExists(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('surveys')
    .select('id')
    .eq('id', SURVEY_IDS.SELF_ASSESSMENT)
    .single();

  if (error || !data) {
    const { error: insertError } = await supabase.from('surveys').insert({
      id: SURVEY_IDS.SELF_ASSESSMENT,
      title: 'Self-Assessment Survey',
      slug: SURVEY_SLUGS.SELF_ASSESSMENT,
    });

    if (insertError) {
      console.error('Error inserting survey:', insertError);
      throw insertError;
    }
  }
}
