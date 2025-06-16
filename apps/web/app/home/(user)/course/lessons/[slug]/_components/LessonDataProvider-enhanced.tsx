import type { Database } from "~/lib/database.types";
// Import the server client using dynamic import to avoid issues with next/headers
import { updateLessonProgressAction } from "../../../_lib/server/server-actions";

import { createServiceLogger } from "@kit/shared/logger";

// Initialize service logger
const { getLogger } = createServiceLogger("HOME-(USER)");

// Define proper types for Payload CMS data structures
type PayloadLesson = Database["payload"]["Tables"]["course_lessons"]["Row"];
type PayloadQuiz = {
	id: string;
	title: string;
	questions: Array<{
		id: string;
		text: string;
		options?: Array<{ id: string; text: string; isCorrect?: boolean }>;
		[key: string]: unknown;
	}>;
	[key: string]: unknown;
};
type PayloadSurvey = {
	id: string;
	title: string;
	questions?: Array<{
		id: string;
		text: string;
		type: string;
		[key: string]: unknown;
	}>;
	[key: string]: unknown;
};

// Define Supabase database types
type QuizAttempt = Database["public"]["Tables"]["quiz_attempts"]["Row"];
type LessonProgress = Database["public"]["Tables"]["lesson_progress"]["Row"];
type SurveyResponse = Database["public"]["Tables"]["survey_responses"]["Row"];

/**
 * Enhanced Server component responsible for data fetching
 * This updates the data fetching logic to work with the unidirectional relationship model
 */
export async function LessonDataProviderEnhanced({
	children,
	_slug,
	lessonId,
	courseId,
	lesson,
}: {
	children: (data: {
		quiz: PayloadQuiz | null;
		quizAttempts: QuizAttempt[];
		lessonProgress: LessonProgress | null;
		userId: string;
		survey: PayloadSurvey | null;
		surveyResponses: SurveyResponse[];
	}) => React.ReactNode;
	_slug: string;
	lessonId: string;
	courseId: string;
	lesson: PayloadLesson;
}) {
	// Dynamically import the server client to avoid issues with next/headers
	const { getSupabaseServerClient } = await import(
		"@kit/supabase/server-client"
	);
	const supabase = getSupabaseServerClient();

	// Get user - should be authenticated by middleware
	const { data } = await supabase.auth.getUser();
	const user = data.user;

	if (!user) {
		throw new Error("User not authenticated");
	}

	// Get user's progress for this lesson
	const { data: lessonProgress } = await supabase
		.from("lesson_progress")
		.select("*")
		.eq("user_id", user.id)
		.eq("lesson_id", lessonId)
		.single();

	// If no progress record exists, create one
	if (!lessonProgress) {
		await updateLessonProgressAction({
			courseId,
			lessonId,
			completionPercentage: 0,
			completed: false,
		});
	}

	// Get quiz data if lesson has a quiz
	let quiz: PayloadQuiz | null = null;
	let quizAttempts: QuizAttempt[] = [];

	// Check for quiz relationship using quiz_id or quiz_id_id
	const quizId = lesson.quiz_id || lesson.quiz_id_id;

	if (quizId) {
		try {
			// Update import path to use course.ts instead of explicit folder paths
			// This avoids TypeScript errors with package resolution
			const { getQuiz } = await import("@kit/cms/payload");

			// Extract the actual quiz ID to avoid [object Object] issues in error messages
			const quizIdStr =
				typeof quizId === "object"
					? quizId?.id || quizId?.value || JSON.stringify(quizId)
					: String(quizId || "");

			// Skip empty or clearly invalid quiz IDs
			if (
				!quizIdStr ||
				quizIdStr === "{}" ||
				quizIdStr === "null" ||
				quizIdStr === "undefined"
			) {
				/* TODO: Async logger needed */ logger.info(`Skipping invalid quiz ID format: ${quizIdStr}`);
				// Continue without the quiz data
			} else {
				try {
					// Add debug logging
					/* TODO: Async logger needed */ logger.info(`Attempting to fetch quiz with enhanced API: ${quizIdStr}`, { data:  });

					// Use enhanced quiz loader with depth=2 to ensure questions are included
					// This explicitly requests a higher depth to include questions in the response
					quiz = await getQuiz(quizId, { depth: 2 });

					// Log results for debugging
					if (quiz) {
						/* TODO: Async logger needed */ logger.info(`Successfully loaded quiz: ${quiz.title}`);
						/* TODO: Async logger needed */ logger.info(`Quiz has ${quiz.questions?.length || 0} questions`);

						// If we have questions array but it doesn't contain full objects
						// this means we have IDs but not the full question details
						if (
							quiz.questions &&
							Array.isArray(quiz.questions) &&
							quiz.questions.length > 0 &&
							(typeof quiz.questions[0] === "string" ||
								!quiz.questions[0]?.options)
						) {
							// We need to fetch the full question details
							/* TODO: Async logger needed */ logger.info(`Quiz has ${quiz.questions.length} question IDs, { arg1: fetching details...`, arg2:  });

							const { callPayloadAPI } = await import("@kit/cms/payload");

							// Get the question IDs
							const questionIds = quiz.questions.map(
								(q: string | Record<string, unknown>) =>
									typeof q === "string"
										? q
										: (q.id as string) || (q.value as string) || String(q),
							);

							if (questionIds.length > 0) {
								// Build query parameters
								const queryParams = questionIds
									.map((id: string) => `id[]=${id}`)
									.join("&");

								// Fetch full question details
								const questionsResponse = await callPayloadAPI(
									`quiz_questions?${queryParams}&sort=order`,
									{},
									null,
								);

								if (questionsResponse?.docs?.length > 0) {
									/* TODO: Async logger needed */ logger.info(`Found ${questionsResponse.docs.length} questions with details`, { data:  });
									quiz.questions = questionsResponse.docs;
								}
							}
						}
					} else {
						/* TODO: Async logger needed */ logger.warn(`No quiz found with ID: ${quizIdStr}`);
					}
				} catch (error) {
					// Log the error with context but continue without the quiz data
					/* TODO: Async logger needed */ logger.error(`Error fetching quiz with ID ${quizIdStr}: ${error instanceof Error ? error.message : "Unknown error"}`, { data:  });
					// Continue without the quiz data - no placeholder quizzes
				}
			}

			// Get user's quiz attempts for this quiz (even if quiz fetch failed)
			try {
				// Extract the actual quiz ID for the database query
				const actualQuizId =
					typeof quizId === "object" && quizId.value
						? quizId.value
						: typeof quizId === "object" && quizId.id
							? quizId.id
							: quizId;

				const { data: attempts } = await supabase
					.from("quiz_attempts")
					.select("*")
					.eq("user_id", user.id)
					.eq("quiz_id", actualQuizId)
					.order("completed_at", { ascending: false });

				quizAttempts = attempts || [];
			} catch (error) {
				// Continue with empty quiz attempts
				/* TODO: Async logger needed */ logger.error(`Error fetching quiz attempts: ${error instanceof Error ? error.message : "Unknown error"}`, { data:  });
			}
		} catch (error) {
			// Continue without quiz data
			/* TODO: Async logger needed */ logger.error(`Error during quiz handling: ${error instanceof Error ? error.message : "Unknown error"}`, { data:  });
		}
	}

	// Get survey data if lesson has a survey
	let survey: PayloadSurvey | null = null;
	let surveyResponses: SurveyResponse[] = [];

	// Check for survey relationship - Payload might use either survey_id or survey_id_id
	const surveyId = lesson.survey_id || lesson.survey_id_id;

	if (surveyId) {
		try {
			// Extract the actual survey ID, handling different possible formats
			const actualSurveyId =
				typeof surveyId === "object" ? surveyId.id || surveyId.value : surveyId;

			/* TODO: Async logger needed */ logger.info(
				`Lesson ${lesson.title} (${lessonId}) has survey ID: ${actualSurveyId}`,
			);
			/* TODO: Async logger needed */ logger.info(`Lesson number: ${lesson.lesson_number}`);

			// Get survey data directly using the ID
			try {
				// Import both functions we need
				const { getSurvey, getSurveyQuestions } = await import(
					"@kit/cms/payload"
				);

				// First try to get the survey by ID using a direct API call
				/* TODO: Async logger needed */ logger.info(`Fetching survey with ID: ${actualSurveyId}`);

				// Determine slug based on lesson number as a fallback
				let surveySlug = "";
				if (lesson.lesson_number === 103) {
					surveySlug = "three-quick-questions";
					/* TODO: Async logger needed */ logger.info(`Lesson 103: Using survey slug '${surveySlug}' as fallback`, { data:  });
				} else if (lesson.lesson_number === 802) {
					surveySlug = "feedback";
					/* TODO: Async logger needed */ logger.info(`Lesson 802: Using survey slug '${surveySlug}' as fallback`, { data:  });
				}

				// Try to get the survey by slug if we have one
				if (surveySlug) {
					/* TODO: Async logger needed */ logger.info(`Trying to get survey by slug: ${surveySlug}`);
					const surveyData = await getSurvey(surveySlug);

					if (surveyData?.docs && surveyData.docs.length > 0) {
						survey = surveyData.docs[0];
						/* TODO: Async logger needed */ logger.info(`Found survey by slug: ${survey.title} (${survey.id})`);

						// Pre-fetch questions to ensure they're available
						/* TODO: Async logger needed */ logger.info(`Pre-fetching questions for survey ID: ${survey.id}`);
						const questionsData = await getSurveyQuestions(survey.id);

						if (questionsData?.docs && questionsData.docs.length > 0) {
							// Add questions to the survey object directly
							survey.questions = questionsData.docs;
							/* TODO: Async logger needed */ logger.info(`Added ${questionsData.docs.length} questions to survey object`, { data:  });
						} else {
							/* TODO: Async logger needed */ logger.info(`No questions found for survey ID: ${survey.id}`);
						}
					} else {
						/* TODO: Async logger needed */ logger.info(`No survey found with slug: ${surveySlug}`);
					}
				}
			} catch (error) {
				/* TODO: Async logger needed */ logger.error(`Error fetching survey with ID ${actualSurveyId}:`, { arg1: error, arg2:  });
				// Continue without the survey data
			}

			// Get user's survey responses for this survey
			try {
				const { data: responses } = await supabase
					.from("survey_responses")
					.select("*")
					.eq("user_id", user.id)
					.eq("survey_id", String(surveyId))
					.single();

				if (responses) {
					surveyResponses = [responses];
				}
			} catch (_error) {
				// Continue with empty survey responses
			}
		} catch (_error) {
			// Continue without survey data
		}
	}

	return children({
		quiz,
		quizAttempts,
		lessonProgress: lessonProgress || null,
		userId: user.id,
		survey,
		surveyResponses,
	});
}
