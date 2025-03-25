import { callPayloadAPI } from './payload-api';

/**
 * Get a survey by slug
 * @param slug The slug of the survey
 * @param supabaseClient Optional Supabase client (for client-side usage)
 * @returns The survey data
 */
export async function getSurvey(slug: string, supabaseClient?: any) {
  return callPayloadAPI(
    `surveys?where[slug][equals]=${slug}&depth=2`,
    {},
    supabaseClient,
  );
}

/**
 * Get questions for a survey
 * @param surveyId The ID of the survey
 * @param supabaseClient Optional Supabase client (for client-side usage)
 * @returns The survey questions
 */
export async function getSurveyQuestions(
  surveyId: string,
  supabaseClient?: any,
) {
  const survey = await callPayloadAPI(
    `surveys/${surveyId}`,
    {},
    supabaseClient,
  );

  if (!survey?.questions?.length) return { docs: [] };

  const questionIds = survey.questions.map((q: any) => q.id).join(',');

  return callPayloadAPI(
    `survey_questions?where[id][in]=${questionIds}&sort=position&limit=100`,
    {},
    supabaseClient,
  );
}

// The following functions are deprecated as we now use Supabase directly
// They are kept here for backwards compatibility but will be removed in a future version

/**
 * @deprecated Use Supabase directly instead
 */
export async function getUserSurveyResponse(userId: string, surveyId: string) {
  console.warn(
    'getUserSurveyResponse is deprecated. Use Supabase directly instead.',
  );
  return { docs: [] };
}

/**
 * @deprecated Use Supabase directly instead
 */
export async function createSurveyResponse(data: any) {
  console.warn(
    'createSurveyResponse is deprecated. Use Supabase directly instead.',
  );
  return { id: null };
}

/**
 * @deprecated Use Supabase directly instead
 */
export async function updateSurveyResponse(id: string, data: any) {
  console.warn(
    'updateSurveyResponse is deprecated. Use Supabase directly instead.',
  );
  return { id };
}

/**
 * @deprecated Use Supabase directly instead
 */
export async function completeSurvey(id: string, data: any) {
  console.warn('completeSurvey is deprecated. Use Supabase directly instead.');
  return { id };
}
