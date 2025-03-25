/**
 * Get a survey by slug
 * @param slug The slug of the survey
 * @param supabaseClient Optional Supabase client (for client-side usage)
 * @returns The survey data
 */
export declare function getSurvey(slug: string, supabaseClient?: any): Promise<any>;
/**
 * Get questions for a survey
 * @param surveyId The ID of the survey
 * @param supabaseClient Optional Supabase client (for client-side usage)
 * @returns The survey questions
 */
export declare function getSurveyQuestions(surveyId: string, supabaseClient?: any): Promise<any>;
/**
 * @deprecated Use Supabase directly instead
 */
export declare function getUserSurveyResponse(userId: string, surveyId: string): Promise<{
    docs: never[];
}>;
/**
 * @deprecated Use Supabase directly instead
 */
export declare function createSurveyResponse(data: any): Promise<{
    id: null;
}>;
/**
 * @deprecated Use Supabase directly instead
 */
export declare function updateSurveyResponse(id: string, data: any): Promise<{
    id: string;
}>;
/**
 * @deprecated Use Supabase directly instead
 */
export declare function completeSurvey(id: string, data: any): Promise<{
    id: string;
}>;
