import type { SupabaseClient } from "@supabase/supabase-js";
type QuizId = string | {
    value: string;
    relationTo?: string;
    id?: string;
};
/**
 * Get all published courses
 * @param options Additional options for the API call
 * @param supabaseClient Optional Supabase client (for client-side usage)
 * @returns The courses data
 */
export declare function getCourses(_options?: {}, supabaseClient?: SupabaseClient): Promise<void>;
/**
 * Get a course by slug
 * @param slug The slug of the course
 * @param options Additional options for the API call
 * @param supabaseClient Optional Supabase client (for client-side usage)
 * @returns The course data
 */
export declare function getCourseBySlug(slug: string, _options?: {}, supabaseClient?: SupabaseClient): Promise<void>;
/**
 * Get lessons for a course
 * @param courseId The ID of the course
 * @param options Additional options for the API call
 * @param supabaseClient Optional Supabase client (for client-side usage)
 * @returns The course lessons
 */
export declare function getCourseLessons(courseId: string, _options?: {}, supabaseClient?: SupabaseClient): Promise<void>;
/**
 * Get a lesson by slug
 * @param slug The slug of the lesson
 * @param options Additional options for the API call
 * @param supabaseClient Optional Supabase client (for client-side usage)
 * @returns The lesson data
 */
export declare function getLessonBySlug(slug: string, _options?: {}, supabaseClient?: SupabaseClient): Promise<void>;
/**
 * Get a quiz by ID with its questions
 * @param quizId The ID of the quiz (can be a string or an object with value property)
 * @param options Additional options for the API call
 * @param supabaseClient Optional Supabase client (for client-side usage)
 * @returns The quiz data with questions
 */
export declare function getQuiz(quizId: QuizId, _options?: {}, supabaseClient?: SupabaseClient): Promise<any>;
export {};
