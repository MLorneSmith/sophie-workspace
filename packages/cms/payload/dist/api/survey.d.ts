import type { SupabaseClient } from "@supabase/supabase-js";
/**
 * Get a survey by slug
 * @param slug The slug of the survey
 * @param supabaseClient Optional Supabase client (for client-side usage)
 * @returns The survey data
 */
export declare function getSurvey(slug: string, supabaseClient?: SupabaseClient): Promise<void>;
/**
 * Get questions for a survey
 * @param surveyId The ID of the survey
 * @param supabaseClient Optional Supabase client (for client-side usage)
 * @returns The survey questions
 */
export declare function getSurveyQuestions(surveyId: string, supabaseClient?: SupabaseClient): Promise<any>;
/**
 * @deprecated Use Supabase directly instead
 */
export declare function getUserSurveyResponse(_userId: string, _surveyId: string): Promise<{
    docs: never[];
}>;
/**
 * @deprecated Use Supabase directly instead
 */
export declare function createSurveyResponse(_data: unknown): Promise<{
    id: null;
}>;
/**
 * @deprecated Use Supabase directly instead
 */
export declare function updateSurveyResponse(id: string, _data: unknown): Promise<{
    id: string;
}>;
/**
 * @deprecated Use Supabase directly instead
 */
export declare function completeSurvey(id: string, _data: unknown): Promise<{
    id: string;
}>;
