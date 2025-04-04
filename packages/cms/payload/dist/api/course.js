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
    return callPayloadAPI(`course_lessons?where[course_id][equals]=${courseId}&sort=lesson_number&depth=2&limit=100`, {}, supabaseClient);
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
 * @param quizId The ID of the quiz (can be a string or an object with value property)
 * @param options Additional options for the API call
 * @param supabaseClient Optional Supabase client (for client-side usage)
 * @returns The quiz data with questions
 */
export async function getQuiz(quizId, options = {}, supabaseClient) {
    var _a;
    if (!quizId) {
        console.error('getQuiz called with empty quizId');
        throw new Error('Quiz ID is required');
    }
    // Extract the actual ID value
    let actualQuizId;
    if (typeof quizId === 'string') {
        actualQuizId = quizId;
    }
    else if (quizId && typeof quizId === 'object') {
        // Handle relationship object format
        if (quizId.value && typeof quizId.value === 'string') {
            actualQuizId = quizId.value;
        }
        else if (quizId.id && typeof quizId.id === 'string') {
            actualQuizId = quizId.id;
        }
        else {
            console.error('getQuiz: Invalid quiz ID format:', quizId);
            throw new Error(`Invalid quiz ID format: ${JSON.stringify(quizId)}`);
        }
    }
    else {
        console.error('getQuiz: Invalid quiz ID type:', typeof quizId);
        throw new Error(`Invalid quiz ID type: ${typeof quizId}`);
    }
    // Log the quiz ID for debugging
    console.log(`getQuiz: Fetching quiz with ID: ${actualQuizId} (original: ${JSON.stringify(quizId)})`);
    try {
        // Get the quiz metadata
        const quiz = await callPayloadAPI(`course_quizzes/${actualQuizId}`, {}, supabaseClient);
        if (!quiz || !quiz.id) {
            console.error(`getQuiz: Quiz not found for ID: ${actualQuizId}`);
            throw new Error(`Quiz not found for ID: ${actualQuizId}`);
        }
        console.log(`getQuiz: Successfully fetched quiz: ${quiz.title}`);
        try {
            // Get the questions for this quiz
            const questionsResponse = await callPayloadAPI(`quiz_questions?where[quiz_id][equals]=${actualQuizId}&sort=order&depth=0`, {}, supabaseClient);
            console.log(`getQuiz: Fetched ${((_a = questionsResponse.docs) === null || _a === void 0 ? void 0 : _a.length) || 0} questions for quiz`);
            // Combine the data
            return Object.assign(Object.assign({}, quiz), { questions: questionsResponse.docs || [] });
        }
        catch (error) {
            console.error(`getQuiz: Error fetching questions for quiz ${actualQuizId}:`, error);
            // Return the quiz without questions if there's an error fetching questions
            return Object.assign(Object.assign({}, quiz), { questions: [] });
        }
    }
    catch (error) {
        console.error(`getQuiz: Error fetching quiz ${actualQuizId}:`, error);
        throw error;
    }
}
