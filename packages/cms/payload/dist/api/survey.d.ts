import type { SupabaseClient } from "@supabase/supabase-js";
/**
 * Get a survey by slug
 * @param slug The slug of the survey
 * @param supabaseClient Optional Supabase client (for client-side usage)
 * @returns The survey data
 */
export declare function getSurvey(slug: string, supabaseClient?: SupabaseClient): Promise<any>;
/**
 * Get questions for a survey
 * @param surveyId The ID of the survey
 * @param supabaseClient Optional Supabase client (for client-side usage)
 * @returns The survey questions
 */
export declare function getSurveyQuestions(surveyId: string, supabaseClient?: SupabaseClient): Promise<any>;
