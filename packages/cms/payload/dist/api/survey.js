import { callPayloadAPI } from './payload-api';
/**
 * Get a survey by slug
 * @param slug The slug of the survey
 * @param supabaseClient Optional Supabase client (for client-side usage)
 * @returns The survey data
 */
export async function getSurvey(slug, supabaseClient) {
    return callPayloadAPI(`surveys?where[slug][equals]=${slug}&depth=2`, {}, supabaseClient);
}
/**
 * Get questions for a survey
 * @param surveyId The ID of the survey
 * @param supabaseClient Optional Supabase client (for client-side usage)
 * @returns The survey questions
 */
export async function getSurveyQuestions(surveyId, supabaseClient) {
    var _a;
    const survey = await callPayloadAPI(`surveys/${surveyId}`, {}, supabaseClient);
    if (!((_a = survey === null || survey === void 0 ? void 0 : survey.questions) === null || _a === void 0 ? void 0 : _a.length))
        return { docs: [] };
    const questionIds = survey.questions.map((q) => q.id).join(',');
    return callPayloadAPI(`survey_questions?where[id][in]=${questionIds}&sort=position&limit=100`, {}, supabaseClient);
}
// The following functions are deprecated as we now use Supabase directly
// They are kept here for backwards compatibility but will be removed in a future version
/**
 * @deprecated Use Supabase directly instead
 */
export async function getUserSurveyResponse(userId, surveyId) {
    console.warn('getUserSurveyResponse is deprecated. Use Supabase directly instead.');
    return { docs: [] };
}
/**
 * @deprecated Use Supabase directly instead
 */
export async function createSurveyResponse(data) {
    console.warn('createSurveyResponse is deprecated. Use Supabase directly instead.');
    return { id: null };
}
/**
 * @deprecated Use Supabase directly instead
 */
export async function updateSurveyResponse(id, data) {
    console.warn('updateSurveyResponse is deprecated. Use Supabase directly instead.');
    return { id };
}
/**
 * @deprecated Use Supabase directly instead
 */
export async function completeSurvey(id, data) {
    console.warn('completeSurvey is deprecated. Use Supabase directly instead.');
    return { id };
}
