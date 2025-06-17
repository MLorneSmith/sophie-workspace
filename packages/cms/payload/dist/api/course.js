import { callPayloadAPI } from "./payload-api";
import { createServiceLogger } from "@kit/shared/logger";
// Initialize service logger
const { getLogger } = createServiceLogger("CMS-PAYLOAD");
/**
 * Get all published courses
 * @param options Additional options for the API call
 * @param supabaseClient Optional Supabase client (for client-side usage)
 * @returns The courses data
 */
export async function getCourses(_options = {}, supabaseClient) {
    return callPayloadAPI("courses?where[status][equals]=published&depth=1", {}, supabaseClient);
}
/**
 * Get a course by slug
 * @param slug The slug of the course
 * @param options Additional options for the API call
 * @param supabaseClient Optional Supabase client (for client-side usage)
 * @returns The course data
 */
export async function getCourseBySlug(slug, _options = {}, supabaseClient) {
    return callPayloadAPI(`courses?where[slug][equals]=${slug}&depth=1`, {}, supabaseClient);
}
/**
 * Get lessons for a course
 * @param courseId The ID of the course
 * @param options Additional options for the API call
 * @param supabaseClient Optional Supabase client (for client-side usage)
 * @returns The course lessons
 */
export async function getCourseLessons(courseId, _options = {}, supabaseClient) {
    return callPayloadAPI(`course_lessons?where[course_id][equals]=${courseId}&sort=lesson_number&depth=2&limit=100`, {}, supabaseClient);
}
/**
 * Get a lesson by slug
 * @param slug The slug of the lesson
 * @param options Additional options for the API call
 * @param supabaseClient Optional Supabase client (for client-side usage)
 * @returns The lesson data
 */
export async function getLessonBySlug(slug, _options = {}, supabaseClient) {
    return callPayloadAPI(`course_lessons?where[slug][equals]=${slug}&depth=2`, {}, supabaseClient);
}
/**
 * Get a quiz by ID with its questions
 * @param quizId The ID of the quiz (can be a string or an object with value property)
 * @param options Additional options for the API call
 * @param supabaseClient Optional Supabase client (for client-side usage)
 * @returns The quiz data with questions
 */
export async function getQuiz(quizId, _options = {}, supabaseClient) {
    var _a;
    if (!quizId) {
        /* TODO: Async logger needed */ logger.error("getQuiz called with empty quizId");
        throw new Error("Quiz ID is required");
    }
    // Extract the actual ID value
    let actualQuizId;
    const originalQuizId = quizId;
    try {
        if (typeof quizId === "string") {
            actualQuizId = quizId;
        }
        else if (quizId && typeof quizId === "object") {
            // Handle relationship object format
            if (quizId.value && typeof quizId.value === "string") {
                actualQuizId = quizId.value;
            }
            else if (quizId.id && typeof quizId.id === "string") {
                actualQuizId = quizId.id;
            }
            else if (quizId.relationTo === "course_quizzes" && quizId.value) {
                // Handle special case for specific relationship format
                actualQuizId = String(quizId.value);
            }
            else {
                // Try to extract any UUID-like string from the object
                const objStr = JSON.stringify(quizId);
                const uuidMatch = objStr.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
                if (uuidMatch) {
                    actualQuizId = uuidMatch[0];
                    /* TODO: Async logger needed */ logger.info(`Extracted UUID ${actualQuizId} from complex object`);
                }
                else {
                    /* TODO: Async logger needed */ logger.error("getQuiz: Invalid quiz ID format:", { data: quizId });
                    throw new Error(`Invalid quiz ID format: ${JSON.stringify(quizId)}`);
                }
            }
        }
        else {
            /* TODO: Async logger needed */ logger.error("getQuiz: Invalid quiz ID type:", { data: typeof quizId });
            throw new Error(`Invalid quiz ID type: ${typeof quizId}`);
        }
        // Validate the extracted ID looks like a UUID
        if (!actualQuizId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
            /* TODO: Async logger needed */ logger.warn(`getQuiz: Quiz ID does not appear to be a valid UUID: ${actualQuizId}`, { data:  });
            // Continue anyway, as it might be a valid ID in a different format
        }
    }
    catch (error) {
        /* TODO: Async logger needed */ logger.error(`getQuiz: Error extracting quiz ID from ${JSON.stringify(originalQuizId)}:`, error);
        throw new Error(`Failed to extract valid quiz ID: ${error instanceof Error ? error.message : String(error)}`);
    }
    // Log the quiz ID for debugging
    /* TODO: Async logger needed */ logger.info(`getQuiz: Fetching quiz with ID: ${actualQuizId} (original: ${JSON.stringify(quizId)})`);
    try {
        // Get the quiz WITH its questions using depth parameter
        // This utilizes the unidirectional relationship
        const quiz = await callPayloadAPI(`course_quizzes/${actualQuizId}?depth=1`, {}, supabaseClient);
        if (!quiz || !quiz.id) {
            /* TODO: Async logger needed */ logger.error(`getQuiz: Quiz not found for ID: ${actualQuizId}`);
            throw new Error(`Quiz not found for ID: ${actualQuizId}`);
        }
        /* TODO: Async logger needed */ logger.info(`getQuiz: Successfully fetched quiz: ${quiz.title}`);
        // Check if we have the questions from the depth=1 query
        if (!quiz.questions ||
            !Array.isArray(quiz.questions) ||
            quiz.questions.length === 0) {
            /* TODO: Async logger needed */ logger.info(`Quiz has no questions: ${quiz.title}`);
            return Object.assign(Object.assign({}, quiz), { questions: [] });
        }
        // If we have question IDs but need the full details, fetch them
        // This handles the case where questions are just IDs and not full objects
        if (typeof quiz.questions[0] === "string" || !quiz.questions[0].options) {
            try {
                // Get the question IDs
                const questionIds = quiz.questions.map((q) => typeof q === "string" ? q : q.id || q.value || q);
                // Get full question details using their IDs
                const idQueryParams = questionIds
                    .map((id) => `id[]=${id}`)
                    .join("&");
                const questionsResponse = await callPayloadAPI(`quiz_questions?${idQueryParams}&sort=order`, {}, supabaseClient);
                /* TODO: Async logger needed */ logger.info(`getQuiz: Fetched ${((_a = questionsResponse.docs) === null || _a === void 0 ? void 0 : _a.length) || 0} detailed questions for quiz`, { data:  });
                // Replace the questions array with the full details
                return Object.assign(Object.assign({}, quiz), { questions: questionsResponse.docs || [] });
            }
            catch (error) {
                /* TODO: Async logger needed */ logger.error(`getQuiz: Error fetching detailed questions for quiz ${actualQuizId}:`, { arg1: error, arg2:  });
                // Return what we have even if we couldn't get full details
                return quiz;
            }
        }
        // If we already have the full question objects, return as is
        return quiz;
    }
    catch (error) {
        /* TODO: Async logger needed */ logger.error(`getQuiz: Error fetching quiz ${actualQuizId}:`, { data: error });
        throw error;
    }
}
