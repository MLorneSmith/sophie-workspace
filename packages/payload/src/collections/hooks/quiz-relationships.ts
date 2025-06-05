/**
 * Quiz Relationship Hooks
 *
 * These hooks ensure quiz questions are always properly formatted
 * for Payload UI display and maintain consistency when edits are made.
 *
 * This is a critical component for maintaining relationship integrity
 * between quizzes and quiz questions.
 */
import type { AfterReadHook, BeforeChangeHook } from "payload/types";

// Define the expected structure of quiz questions for type safety
interface QuizQuestion {
	id: string;
	relationTo: string;
	value: {
		id: string;
	};
}

interface QuizDocument {
	id?: string;
	questions?: any[] | any;
	[key: string]: any;
}

/**
 * Ensures quiz questions array is always properly formatted for Payload UI
 * This runs after reading a document from the database and ensures the format
 * matches what Payload UI expects, even if the database format is inconsistent.
 *
 * It handles multiple formats that might be stored in the database:
 * 1. Simple string arrays ["id1", "id2"]
 * 2. Partial objects [{ id: "id1" }, { id: "id2" }]
 * 3. Various other formats
 */
export const formatQuizQuestionsOnRead: AfterReadHook = async ({
	doc,
	req,
}: {
	doc: QuizDocument;
	req: any;
}) => {
	// Skip if no document or no questions field
	if (!doc || !doc.questions) {
		return doc;
	}

	try {
		// If questions is already properly formatted (has relationTo and value), return as is
		if (
			Array.isArray(doc.questions) &&
			doc.questions.length > 0 &&
			doc.questions[0].relationTo === "quiz_questions" &&
			doc.questions[0].value &&
			doc.questions[0].value.id
		) {
			// Already in the correct format
			return doc;
		}

		// Otherwise, transform the questions array into the proper format
		if (Array.isArray(doc.questions)) {
			const formattedQuestions = doc.questions.map((question: any) => {
				// Get the ID from various possible formats
				const questionId =
					typeof question === "object"
						? question.id || question.questionId || question
						: question;

				// Create properly formatted object
				return {
					id: questionId,
					relationTo: "quiz_questions",
					value: {
						id: questionId,
					},
				};
			});

			// Log the transformation for debugging purposes
			if (req.payload?.logger) {
				req.payload.logger.info({
					message: `Formatted quiz questions for quiz ${doc.id}`,
					collection: "course_quizzes",
					before: JSON.stringify(doc.questions.slice(0, 2)),
					after: JSON.stringify(formattedQuestions.slice(0, 2)),
				});
			}

			// Return document with formatted questions
			return {
				...doc,
				questions: formattedQuestions,
			};
		}
		// If questions is not an array but has a value, convert to array
		if (req.payload?.logger) {
			req.payload.logger.warn({
				message: `Quiz ${doc.id} has non-array questions: ${typeof doc.questions}`,
				collection: "course_quizzes",
			});
		}

		// Return document with empty questions array
		return {
			...doc,
			questions: [],
		};
	} catch (error) {
		// Log error but don't crash the request
		if (req.payload?.logger) {
			req.payload.logger.error({
				message: `Error formatting quiz questions for quiz ${doc.id}`,
				collection: "course_quizzes",
				error,
			});
		}

		// Return document unchanged to avoid blocking access
		return doc;
	}
};

/**
 * Ensures relationship tables stay in sync with questions array and
 * ensures question data is properly formatted before saving to database.
 *
 * This is a critical safety net to ensure data consistency when edits
 * are made through the Payload UI or API calls.
 */
export const syncQuizQuestionRelationships: BeforeChangeHook = async ({
	data,
	req,
	operation,
}: {
	data: QuizDocument;
	req: any;
	operation: string;
}) => {
	// Skip if no questions data
	if (!data || !data.questions) {
		return data;
	}

	try {
		// Ensure questions is always an array with proper format
		if (!Array.isArray(data.questions)) {
			// If not an array, convert to empty array
			data.questions = [];

			if (req.payload?.logger) {
				req.payload.logger.warn({
					message: `Converting non-array questions to empty array for quiz ${data.id || "new"}`,
					collection: "course_quizzes",
					operation,
				});
			}
		} else {
			// Format each question to ensure it has the proper structure
			data.questions = data.questions
				.map((question: any) => {
					// If already properly formatted, return as is
					if (
						question &&
						typeof question === "object" &&
						question.relationTo === "quiz_questions" &&
						question.value &&
						typeof question.value === "object" &&
						question.value.id
					) {
						return question;
					}

					// Extract the ID from whatever format we have
					const questionId =
						typeof question === "object"
							? question.id || question.value?.id || question
							: question;

					// Return properly formatted object
					return {
						id: questionId,
						relationTo: "quiz_questions",
						value: {
							id: questionId,
						},
					};
				})
				.filter(Boolean); // Remove any null/undefined entries
		}

		// Log operation for monitoring
		if (req.payload?.logger) {
			req.payload.logger.info({
				message: `Quiz questions formatted for ${operation} operation on quiz ${data.id || "new"}`,
				collection: "course_quizzes",
				questionCount: data.questions.length,
			});
		}
	} catch (error) {
		// Log error but don't crash the request
		if (req.payload?.logger) {
			req.payload.logger.error({
				message: `Error formatting quiz questions during ${operation} operation`,
				collection: "course_quizzes",
				error,
			});
		}
	}

	return data;
};
