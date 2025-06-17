import { callPayloadAPI } from "./payload-api";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createServiceLogger } from "@kit/shared/logger";

// Initialize service logger
const { getLogger } = createServiceLogger("CMS-PAYLOAD");

// Types for quiz and lesson relationships
type QuizId = string | { value: string; relationTo?: string; id?: string };
type QuizQuestion = string | { id?: string; value?: string; options?: unknown };

/**
 * Get all published courses
 * @param options Additional options for the API call
 * @param supabaseClient Optional Supabase client (for client-side usage)
 * @returns The courses data
 */
export async function getCourses(_options = {}, supabaseClient?: SupabaseClient) {
	return callPayloadAPI(
		"courses?where[status][equals]=published&depth=1",
		{},
		supabaseClient,
	);
}

/**
 * Get a course by slug
 * @param slug The slug of the course
 * @param options Additional options for the API call
 * @param supabaseClient Optional Supabase client (for client-side usage)
 * @returns The course data
 */
export async function getCourseBySlug(
	slug: string,
	_options = {},
	supabaseClient?: SupabaseClient,
) {
	return callPayloadAPI(
		`courses?where[slug][equals]=${slug}&depth=1`,
		{},
		supabaseClient,
	);
}

/**
 * Get lessons for a course
 * @param courseId The ID of the course
 * @param options Additional options for the API call
 * @param supabaseClient Optional Supabase client (for client-side usage)
 * @returns The course lessons
 */
export async function getCourseLessons(
	courseId: string,
	_options = {},
	supabaseClient?: SupabaseClient,
) {
	return callPayloadAPI(
		`course_lessons?where[course_id][equals]=${courseId}&sort=lesson_number&depth=2&limit=100`,
		{},
		supabaseClient,
	);
}

/**
 * Get a lesson by slug
 * @param slug The slug of the lesson
 * @param options Additional options for the API call
 * @param supabaseClient Optional Supabase client (for client-side usage)
 * @returns The lesson data
 */
export async function getLessonBySlug(
	slug: string,
	_options = {},
	supabaseClient?: SupabaseClient,
) {
	return callPayloadAPI(
		`course_lessons?where[slug][equals]=${slug}&depth=2`,
		{},
		supabaseClient,
	);
}

/**
 * Get a quiz by ID with its questions
 * @param quizId The ID of the quiz (can be a string or an object with value property)
 * @param options Additional options for the API call
 * @param supabaseClient Optional Supabase client (for client-side usage)
 * @returns The quiz data with questions
 */
export async function getQuiz(
	quizId: QuizId,
	_options = {},
	supabaseClient?: SupabaseClient,
) {
	if (!quizId) {
		// TODO: Async logger needed
		// (await getLogger()).error("getQuiz called with empty quizId");
		throw new Error("Quiz ID is required");
	}

	// Extract the actual ID value
	let actualQuizId: string;
	const originalQuizId = quizId;

	try {
		if (typeof quizId === "string") {
			actualQuizId = quizId;
		} else if (quizId && typeof quizId === "object") {
			// Handle relationship object format
			if (quizId.value && typeof quizId.value === "string") {
				actualQuizId = quizId.value;
			} else if (quizId.id && typeof quizId.id === "string") {
				actualQuizId = quizId.id;
			} else if (quizId.relationTo === "course_quizzes" && quizId.value) {
				// Handle special case for specific relationship format
				actualQuizId = String(quizId.value);
			} else {
				// Try to extract any UUID-like string from the object
				const objStr = JSON.stringify(quizId);
				const uuidMatch = objStr.match(
					/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
				);

				if (uuidMatch) {
					actualQuizId = uuidMatch[0];
					// TODO: Async logger needed
		// (await getLogger()).info(`Extracted UUID ${actualQuizId} from complex object`);
				} else {
					// TODO: Async logger needed
		// (await getLogger()).error("getQuiz: Invalid quiz ID format:", { data: quizId });
					throw new Error(`Invalid quiz ID format: ${JSON.stringify(quizId)}`);
				}
			}
		} else {
			// TODO: Async logger needed
		// (await getLogger()).error("getQuiz: Invalid quiz ID type:", { data: typeof quizId });
			throw new Error(`Invalid quiz ID type: ${typeof quizId}`);
		}

		// Validate the extracted ID looks like a UUID
		if (
			!actualQuizId.match(
				/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
			)
		) {
			// TODO: Async logger needed
		// (await getLogger()).warn(`getQuiz: Quiz ID does not appear to be a valid UUID: ${actualQuizId}`, { data: { actualQuizId } });
			// Continue anyway, as it might be a valid ID in a different format
		}
	} catch (error) {
		// TODO: Async logger needed
		// (await getLogger()).error(
			`getQuiz: Error extracting quiz ID from ${JSON.stringify(originalQuizId)}:`,
			error,
		);
		throw new Error(
			`Failed to extract valid quiz ID: ${error instanceof Error ? error.message : String(error)}`,
		);
	}

	// Log the quiz ID for debugging
	// TODO: Async logger needed
		// (await getLogger()).info(
		`getQuiz: Fetching quiz with ID: ${actualQuizId} (original: ${JSON.stringify(quizId)})`,
	);

	try {
		// Get the quiz WITH its questions using depth parameter
		// This utilizes the unidirectional relationship
		const quiz = await callPayloadAPI(
			`course_quizzes/${actualQuizId}?depth=1`,
			{},
			supabaseClient,
		);

		if (!quiz || !quiz.id) {
			// TODO: Async logger needed
		// (await getLogger()).error(`getQuiz: Quiz not found for ID: ${actualQuizId}`);
			throw new Error(`Quiz not found for ID: ${actualQuizId}`);
		}

		// TODO: Async logger needed
		// (await getLogger()).info(`getQuiz: Successfully fetched quiz: ${quiz.title}`);

		// Check if we have the questions from the depth=1 query
		if (
			!quiz.questions ||
			!Array.isArray(quiz.questions) ||
			quiz.questions.length === 0
		) {
			// TODO: Async logger needed
		// (await getLogger()).info(`Quiz has no questions: ${quiz.title}`);
			return {
				...quiz,
				questions: [],
			};
		}

		// If we have question IDs but need the full details, fetch them
		// This handles the case where questions are just IDs and not full objects
		if (typeof quiz.questions[0] === "string" || !quiz.questions[0].options) {
			try {
				// Get the question IDs
				const questionIds = quiz.questions.map((q: QuizQuestion) =>
					typeof q === "string" ? q : q.id || q.value || q,
				);

				// Get full question details using their IDs
				const idQueryParams = questionIds
					.map((id: string) => `id[]=${id}`)
					.join("&");
				const questionsResponse = await callPayloadAPI(
					`quiz_questions?${idQueryParams}&sort=order`,
					{},
					supabaseClient,
				);

				// TODO: Async logger needed
		// (await getLogger()).info(`getQuiz: Fetched ${questionsResponse.docs?.length || 0} detailed questions for quiz`, { data:  });

				// Replace the questions array with the full details
				return {
					...quiz,
					questions: questionsResponse.docs || [],
				};
			} catch (error) {
				// TODO: Async logger needed
		// (await getLogger()).error(`getQuiz: Error fetching detailed questions for quiz ${actualQuizId}:`, { arg1: error, arg2:  });
				// Return what we have even if we couldn't get full details
				return quiz;
			}
		}

		// If we already have the full question objects, return as is
		return quiz;
	} catch (error) {
		// TODO: Async logger needed
		// (await getLogger()).error(`getQuiz: Error fetching quiz ${actualQuizId}:`, { data: error });
		throw error;
	}
}
