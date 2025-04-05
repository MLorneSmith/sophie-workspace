import { callPayloadAPI } from './payload-api';

/**
 * Get a survey by slug
 * @param slug The slug of the survey
 * @param supabaseClient Optional Supabase client (for client-side usage)
 * @returns The survey data
 */
export async function getSurvey(slug: string, supabaseClient?: any) {
  console.log(`Getting survey with slug: ${slug}`);

  const result = await callPayloadAPI(
    `surveys?where[slug][equals]=${slug}&depth=3`,
    {},
    supabaseClient,
  );

  console.log(
    `Survey result for slug ${slug}:`,
    JSON.stringify(result, null, 2),
  );

  return result;
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
  console.log(`Getting survey questions for survey ID: ${surveyId}`);

  // First, try to get the survey with its questions
  const survey = await callPayloadAPI(
    `surveys/${surveyId}?depth=2`,
    {},
    supabaseClient,
  );

  console.log('Survey data:', JSON.stringify(survey, null, 2));

  // If the survey has questions, use them
  if (survey?.questions?.length) {
    console.log(`Found ${survey.questions.length} questions in survey data`);

    // If the questions are already populated with full data, return them directly
    if (survey.questions[0].text) {
      console.log('Questions are fully populated, returning directly');
      return { docs: survey.questions };
    }

    // Otherwise, get the question IDs and fetch the full question data
    const questionIds = survey.questions.map((q: any) => q.id).join(',');
    console.log(`Question IDs: ${questionIds}`);

    return callPayloadAPI(
      `survey_questions?where[id][in]=${questionIds}&sort=position&limit=100`,
      {},
      supabaseClient,
    );
  }

  console.log('No questions found in survey data');
  console.log('Trying to get all questions and filter by survey ID');

  // Get all questions and filter them on the client side
  const allQuestionsResponse = await callPayloadAPI(
    'survey_questions?limit=100',
    {},
    supabaseClient,
  );

  console.log(
    'All questions response:',
    JSON.stringify(allQuestionsResponse, null, 2),
  );

  // Filter questions by survey ID if possible
  if (allQuestionsResponse?.docs?.length) {
    // Payload might append _id to relationship fields, so check both
    const filteredQuestions = allQuestionsResponse.docs.filter(
      (q: any) => q.surveys_id === surveyId || q.surveys_id_id === surveyId,
    );

    console.log(
      `Filtered ${filteredQuestions.length} questions for survey ID ${surveyId}`,
    );

    // If we still don't have any questions, just return all of them
    // This is a fallback to ensure the survey works even if the relationship is broken
    if (filteredQuestions.length === 0) {
      console.log(
        'No questions found after filtering, returning all questions',
      );
      return allQuestionsResponse;
    }

    return {
      ...allQuestionsResponse,
      docs: filteredQuestions,
    };
  }

  // If all else fails, return an empty result
  console.log('No questions found after all attempts');
  return { docs: [] };
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
