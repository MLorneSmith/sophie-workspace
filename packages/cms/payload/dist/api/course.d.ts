/**
 * Get all published courses
 * @param options Additional options for the API call
 * @param supabaseClient Optional Supabase client (for client-side usage)
 * @returns The courses data
 */
export declare function getCourses(_options?: {}, supabaseClient?: any): Promise<any>;
/**
 * Get a course by slug
 * @param slug The slug of the course
 * @param options Additional options for the API call
 * @param supabaseClient Optional Supabase client (for client-side usage)
 * @returns The course data
 */
export declare function getCourseBySlug(slug: string, _options?: {}, supabaseClient?: any): Promise<any>;
/**
 * Get lessons for a course
 * @param courseId The ID of the course
 * @param options Additional options for the API call
 * @param supabaseClient Optional Supabase client (for client-side usage)
 * @returns The course lessons
 */
export declare function getCourseLessons(courseId: string, _options?: {}, supabaseClient?: any): Promise<any>;
/**
 * Get a lesson by slug
 * @param slug The slug of the lesson
 * @param options Additional options for the API call
 * @param supabaseClient Optional Supabase client (for client-side usage)
 * @returns The lesson data
 */
export declare function getLessonBySlug(slug: string, _options?: {}, supabaseClient?: any): Promise<any>;
/**
 * Get a quiz by ID with its questions
 * @param quizId The ID of the quiz (can be a string or an object with value property)
 * @param options Additional options for the API call
 * @param supabaseClient Optional Supabase client (for client-side usage)
 * @returns The quiz data with questions
 */
export declare function getQuiz(quizId: string | {
    value: string;
    relationTo?: string;
} | any, _options?: {}, supabaseClient?: any): Promise<any>;
