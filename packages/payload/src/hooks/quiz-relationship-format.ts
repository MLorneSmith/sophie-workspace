/**
 * Quiz Relationship Format Hooks
 *
 * This module provides collection hooks for the course_quizzes collection
 * to ensure that the quiz-question relationships are always properly formatted,
 * regardless of how they were stored in the database.
 *
 * It handles formatting during both read and write operations to ensure consistency.
 */
import type { CollectionAfterReadHook } from "@payloadcms/payload/types";

// Define the expected structure of quiz questions for type safety
type QuizQuestion = {
	id: string;
	relationTo: string;
	value: {
		id: string;
	};
};

interface QuizDocument {
	id?: string;
	questions?: any[] | any;
	[key: string]: any;
}

/**
 * Ensures quiz question relationships are properly formatted
 * by transforming any format of relationship data to the expected structure.
 */
export const ensureProperQuizQuestionFormat: CollectionAfterReadHook = async ({
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
			doc.questions = doc.questions.map((question) => {
				// Get the ID from various possible formats
				const questionId =
					typeof question === "object" ? question.id || question : question;

				// Create properly formatted object
				return {
					id: questionId,
					relationTo: "quiz_questions",
					value: {
						id: questionId,
					},
				};
			});
		} else {
			// If questions is not an array but has a value, convert to array
			console.warn(
				`Quiz ${doc.id} has non-array questions: ${typeof doc.questions}`,
			);
			doc.questions = [];
		}

		return doc;
	} catch (error) {
		console.error(
			`Error in ensureProperQuizQuestionFormat hook for quiz ${doc.id}:`,
			error,
		);
		// Return the document as is to avoid blocking access completely
		return doc;
	}
};

/**
 * Export all quiz relationship hooks for easy import
 */
export const quizRelationshipHooks = {
	afterRead: [ensureProperQuizQuestionFormat],
};
