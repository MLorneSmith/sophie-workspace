import { callPayloadAPI } from './payload-api';
/**
 * Get all published courses
 * @param options Additional options for the API call
 * @param supabaseClient Optional Supabase client (for client-side usage)
 * @returns The courses data
 */
export async function getCourses(options = {}, supabaseClient) {
    return callPayloadAPI(`courses?where[status][equals]=published&depth=1`, {}, supabaseClient);
}
/**
 * Get a course by slug
 * @param slug The slug of the course
 * @param options Additional options for the API call
 * @param supabaseClient Optional Supabase client (for client-side usage)
 * @returns The course data
 */
export async function getCourseBySlug(slug, options = {}, supabaseClient) {
    return callPayloadAPI(`courses?where[slug][equals]=${slug}&depth=1`, {}, supabaseClient);
}
/**
 * Get lessons for a course
 * @param courseId The ID of the course
 * @param options Additional options for the API call
 * @param supabaseClient Optional Supabase client (for client-side usage)
 * @returns The course lessons
 */
export async function getCourseLessons(courseId, options = {}, supabaseClient) {
    return callPayloadAPI(`course_lessons?where[course_id][equals]=${courseId}&sort=lesson_number&depth=0&limit=100`, {}, supabaseClient);
}
/**
 * Get a lesson by slug
 * @param slug The slug of the lesson
 * @param options Additional options for the API call
 * @param supabaseClient Optional Supabase client (for client-side usage)
 * @returns The lesson data
 */
export async function getLessonBySlug(slug, options = {}, supabaseClient) {
    return callPayloadAPI(`course_lessons?where[slug][equals]=${slug}&depth=2`, {}, supabaseClient);
}
/**
 * Get a quiz by ID with its questions
 * @param quizId The ID of the quiz
 * @param options Additional options for the API call
 * @param supabaseClient Optional Supabase client (for client-side usage)
 * @returns The quiz data with questions
 */
export async function getQuiz(quizId, options = {}, supabaseClient) {
    // Get the quiz metadata
    const quiz = await callPayloadAPI(`course_quizzes/${quizId}`, {}, supabaseClient);
    // Get the questions for this quiz
    const questionsResponse = await callPayloadAPI(`quiz_questions?where[quiz_id][equals]=${quizId}&sort=order&depth=0`, {}, supabaseClient);
    // Combine the data
    return Object.assign(Object.assign({}, quiz), { questions: questionsResponse.docs || [] });
}
