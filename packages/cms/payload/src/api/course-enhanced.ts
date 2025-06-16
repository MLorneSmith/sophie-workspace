import { callPayloadAPI } from "./payload-api";
import type { SupabaseClient } from "@supabase/supabase-js";

// Types for quiz and question relationships
type QuizId = string | { value: string; relationTo?: string; id?: string };
type QuizQuestion = string | { id?: string; value?: string; options?: unknown };
type QuestionRow = { question_id: string; quiz_questions_id: string; order: number };

/**
 * Enhanced getQuiz function with improved unidirectional relationship handling
 *
 * This version properly handles the unidirectional relationship model:
 * 1. Uses proper depth parameter to include questions
 * 2. Uses direct lookup via relationship for quiz questions
 * 3. Provides fallback mechanisms to ensure questions are loaded
 *
 * @param quizId The ID of the quiz
 * @param depth The query depth (default: 1)
 * @param supabaseClient Optional Supabase client
 * @returns The quiz with its questions, or null if not found
 */
export async function getQuizEnhanced(
	quizId: QuizId,
	depth = 1,
	supabaseClient?: SupabaseClient,
) {
	if (!quizId) {
		console.error("getQuizEnhanced called with empty quizId");
		return null;
	}

	// Extract the actual ID value
	let actualQuizId: string;

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
				actualQuizId = String(quizId.value);
			} else {
				// Try to extract any UUID-like string from the object
				const objStr = JSON.stringify(quizId);
				const uuidMatch = objStr.match(
					/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
				);

				if (uuidMatch) {
					actualQuizId = uuidMatch[0];
					console.log(
						`getQuizEnhanced: Extracted UUID ${actualQuizId} from complex object`,
					);
				} else {
					console.error("getQuizEnhanced: Invalid quiz ID format:", quizId);
					throw new Error(`Invalid quiz ID format: ${JSON.stringify(quizId)}`);
				}
			}
		} else {
			console.error("getQuizEnhanced: Invalid quiz ID type:", typeof quizId);
			throw new Error(`Invalid quiz ID type: ${typeof quizId}`);
		}
	} catch (error) {
		console.error(
			`getQuizEnhanced: Error extracting quiz ID from ${JSON.stringify(quizId)}:`,
			error,
		);
		throw new Error(
			`Failed to extract valid quiz ID: ${error instanceof Error ? error.message : String(error)}`,
		);
	}

	// Log the quiz ID for debugging
	console.log(`getQuizEnhanced: Fetching quiz with ID: ${actualQuizId}`);

	try {
		// First attempt: Get the quiz with appropriate depth parameter
		try {
			const quiz = await callPayloadAPI(
				`course_quizzes/${actualQuizId}?depth=${depth}`,
				{},
				supabaseClient,
			);

			if (!quiz || !quiz.id) {
				console.error(
					`getQuizEnhanced: Quiz not found for ID: ${actualQuizId}`,
				);
				throw new Error(`Quiz not found for ID: ${actualQuizId}`);
			}

			console.log(`getQuizEnhanced: Successfully fetched quiz: ${quiz.title}`);

			// Check if we have questions from the depth parameter
			if (
				quiz.questions &&
				Array.isArray(quiz.questions) &&
				quiz.questions.length > 0 &&
				typeof quiz.questions[0] !== "string" &&
				quiz.questions[0].options
			) {
				console.log(
					`getQuizEnhanced: Quiz has ${quiz.questions.length} questions with full details`,
				);
				return quiz;
			}

			// If we have question IDs but not full details, fetch them
			if (
				quiz.questions &&
				Array.isArray(quiz.questions) &&
				quiz.questions.length > 0
			) {
				console.log(
					`getQuizEnhanced: Quiz has ${quiz.questions.length} question IDs, fetching details`,
				);

				// Get the question IDs
				const questionIds = quiz.questions.map((q: QuizQuestion) =>
					typeof q === "string" ? q : q.id || q.value || q,
				);

				// Get full question details using their IDs
				const queryParams = questionIds
					.map((id: string) => `id[]=${id}`)
					.join("&");
				const questionsResponse = await callPayloadAPI(
					`quiz_questions?${queryParams}&sort=order`,
					{},
					supabaseClient,
				);

				console.log(
					`getQuizEnhanced: Fetched ${questionsResponse.docs?.length || 0} detailed questions for quiz ${quiz.title}`,
				);

				return {
					...quiz,
					questions: questionsResponse.docs || [],
				};
			}

			// If we still don't have questions, try the database fallback
			console.log(
				`getQuizEnhanced: Quiz ${quiz.title} has no questions, trying database fallback`,
			);
			const dbQuestions = await getQuestionsForQuizFromDatabase(actualQuizId);

			if (dbQuestions && dbQuestions.length > 0) {
				console.log(
					`getQuizEnhanced: Found ${dbQuestions.length} questions via database fallback`,
				);

				// Fetch full question details using their IDs
				const questionIds = dbQuestions.map((q: QuestionRow) => q.question_id);
				const queryParams = questionIds
					.map((id: string) => `id[]=${id}`)
					.join("&");
				const questionsResponse = await callPayloadAPI(
					`quiz_questions?${queryParams}&sort=order`,
					{},
					supabaseClient,
				);

				console.log(
					`getQuizEnhanced: Fetched ${questionsResponse.docs?.length || 0} detailed questions from database fallback`,
				);

				return {
					...quiz,
					questions: questionsResponse.docs || [],
				};
			}

			console.log(
				`getQuizEnhanced: No questions found for quiz ${quiz.title} using any method`,
			);
			return quiz;
		} catch (fetchError) {
			console.error(
				"getQuizEnhanced: Error in primary fetch method:",
				fetchError,
			);
			// Continue to fallback mechanism
		}

		// Second attempt: Use the direct API route
		const quiz = await callPayloadAPI(
			`course_quizzes/${actualQuizId}`,
			{},
			supabaseClient,
		);

		if (!quiz || !quiz.id) {
			throw new Error(`Quiz not found for ID: ${actualQuizId}`);
		}

		console.log(
			`getQuizEnhanced: Successfully fetched quiz (fallback): ${quiz.title}`,
		);

		// Try to get questions via database for fallback
		const dbQuestions = await getQuestionsForQuizFromDatabase(actualQuizId);

		if (dbQuestions && dbQuestions.length > 0) {
			console.log(
				`getQuizEnhanced: Found ${dbQuestions.length} questions via database fallback`,
			);

			// Fetch full question details
			const questionIds = dbQuestions.map((q: QuestionRow) => q.question_id);

			if (questionIds.length > 0) {
				try {
					const queryParams = questionIds
						.map((id: string) => `id[]=${id}`)
						.join("&");
					const questionsResponse = await callPayloadAPI(
						`quiz_questions?${queryParams}&sort=order`,
						{},
						supabaseClient,
					);

					console.log(
						`getQuizEnhanced: Fetched ${questionsResponse.docs?.length || 0} detailed questions from fallback`,
					);

					return {
						...quiz,
						questions: questionsResponse.docs || [],
					};
				} catch (error) {
					console.error(
						"getQuizEnhanced: Error fetching question details:",
						error,
					);
					// Return quiz with just the question IDs
					return {
						...quiz,
						questions: questionIds.map((id: string) => ({ id })),
					};
				}
			}
		}

		// Return what we have, even if empty
		return {
			...quiz,
			questions: [],
		};
	} catch (error) {
		console.error(
			`getQuizEnhanced: Error fetching quiz ${actualQuizId}:`,
			error,
		);
		throw error;
	}
}

/**
 * Database fallback to get questions for a quiz from the relationship table
 *
 * Note: This function uses dynamic imports for database connectivity,
 * which only works on the server side.
 *
 * @param quizId The quiz ID
 * @returns Array of question details with order
 */
async function getQuestionsForQuizFromDatabase(quizId: string): Promise<QuestionRow[]> {
	try {
		// Safe dynamic import that will only happen server-side
		// We need to use any for the dynamic require to avoid TypeScript errors
		const getPgClient = async (): Promise<{ Client: unknown } | null> => {
			// @ts-ignore - Dynamic require is only supported in server context
			if (typeof window === "undefined") {
				try {
					// @ts-ignore - Using dynamic import syntax
					return await import("pg").catch(() => null);
				} catch (e) {
					console.error("Failed to import pg module:", e);
					return null;
				}
			}
			return null;
		};

		const pg = await getPgClient();
		if (!pg || !pg.Client) {
			console.error("pg module not available (expected on server side only)");
			return [];
		}

		const connectionString =
			process.env.DATABASE_URI ||
			"postgresql://postgres:postgres@localhost:54322/postgres";

		const client = new pg.Client({ connectionString });
		await client.connect();

		try {
			// Query the relationship table to get questions for this quiz
			const result = await client.query(
				`
        SELECT 
          value as question_id,
          quiz_questions_id,
          "order"
        FROM 
          payload.course_quizzes_rels 
        WHERE 
          _parent_id = $1 AND 
          field = 'questions'
        ORDER BY 
          "order" ASC NULLS LAST, 
          created_at ASC
        `,
				[quizId],
			);

			return result.rows;
		} finally {
			await client.end();
		}
	} catch (error) {
		console.error("Error fetching questions from database:", error);
		return [];
	}
}

// Re-export the original function for backwards compatibility
export { getQuiz } from "./course";

// Export a new function that's easier to use and is the preferred option
export function getQuiz2(quizId: QuizId, _options = {}, supabaseClient?: SupabaseClient) {
	return getQuizEnhanced(quizId, 2, supabaseClient);
}
