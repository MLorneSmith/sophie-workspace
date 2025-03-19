import { callPayloadAPI } from './payload-api';

/**
 * Get a survey by slug
 * @param slug The slug of the survey
 * @returns The survey data
 */
export async function getSurvey(slug: string) {
  return callPayloadAPI(`surveys?where[slug][equals]=${slug}&depth=2`);
}

/**
 * Get questions for a survey
 * @param surveyId The ID of the survey
 * @returns The survey questions
 */
export async function getSurveyQuestions(surveyId: string) {
  const survey = await callPayloadAPI(`surveys/${surveyId}`);

  if (!survey?.questions?.length) return { docs: [] };

  const questionIds = survey.questions.map((q: any) => q.id).join(',');

  return callPayloadAPI(
    `survey_questions?where[id][in]=${questionIds}&sort=position&limit=100`,
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
