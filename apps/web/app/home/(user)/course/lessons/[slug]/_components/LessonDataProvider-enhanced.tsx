import type { Database } from "~/lib/database.types";
// Import the server client using dynamic import to avoid issues with next/headers
import { updateLessonProgressAction } from "../../../_lib/server/server-actions";
import { createServiceLogger } from "@kit/shared/logger";

// Create service-scoped logger
const { getLogger } = createServiceLogger("LESSON-DATA-PROVIDER");

// Define proper types for Payload CMS data structures
type PayloadLesson = Database["payload"]["Tables"]["course_lessons"]["Row"];
type PayloadQuiz = {
	id: string;
	questions: Array<{
		question: string;
		questiontype: "single-answer" | "multi-answer";
		options: Array<{
			text: string;
			iscorrect: boolean;
		}>;
	}>;
	passingScore: number;
};
type PayloadSurvey = {
	id: string;
	title?: string;
	slug?: string;
	questions?: Array<{
		id: string;
		text?: string;
		question?: string;
		type?: string;
		category?: string;
		position?: number;
		options?: Array<{
			id?: string;
			text?: string;
			option?: string;
			score?: number;
		}>;
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
	// biome-ignore lint/correctness/noUnusedFunctionParameters: Parameter required by interface
	slug,
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
	slug: string;
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

	// Check for quiz relationship using quiz_id_id (correct column name)
	const quizId = lesson.quiz_id_id;

	if (quizId) {
		try {
			// Update import path to use course.ts instead of explicit folder paths
			// This avoids TypeScript errors with package resolution
			const { getQuiz } = await import("@kit/cms/payload");

			// Extract the actual quiz ID to avoid [object Object] issues in error messages
			let quizIdStr = "";
			if (typeof quizId === "object" && quizId !== null) {
				const quizObj = quizId as unknown as { id?: string; value?: string };
				quizIdStr = quizObj.id || quizObj.value || JSON.stringify(quizId);
			} else {
				quizIdStr = String(quizId || "");
			}

			// Skip empty or clearly invalid quiz IDs
			if (
				!quizIdStr ||
				quizIdStr === "{}" ||
				quizIdStr === "null" ||
				quizIdStr === "undefined"
			) {
				// Continue without the quiz data
			} else {
				try {
					// Add debug logging

					// Use enhanced quiz loader with depth=2 to ensure questions are included
					// This explicitly requests a higher depth to include questions in the response
					quiz = await getQuiz(quizId, { depth: 2 });

					// Log results for debugging
					if (quiz) {
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
									undefined,
								);

								if (questionsResponse?.docs?.length > 0) {
									const logger = await getLogger();
									logger.info("Fetched full question details", {
										questionCount: questionsResponse.docs.length,
									});
									quiz.questions = questionsResponse.docs;
								}
							}
						}
					} else {
					}
				} catch (_error) {
					// Log the error with context but continue without the quiz data
					// Continue without the quiz data - no placeholder quizzes
				}
			}

			// Get user's quiz attempts for this quiz (even if quiz fetch failed)
			// Extract the actual quiz ID for the database query
			let actualQuizId = "";
			if (typeof quizId === "object" && quizId !== null) {
				const quizObj = quizId as unknown as { id?: string; value?: string };
				actualQuizId = quizObj.value || quizObj.id || "";
			} else {
				actualQuizId = String(quizId || "");
			}

			try {
				const { data: attempts } = await supabase
					.from("quiz_attempts")
					.select("*")
					.eq("user_id", user.id)
					.eq("quiz_id", actualQuizId)
					.order("completed_at", { ascending: false });

				quizAttempts = attempts || [];
			} catch (_error) {
				// Continue with empty quiz attempts
				const logger = await getLogger();
				logger.error("Failed to fetch quiz attempts", {
					error: _error,
					quizId: actualQuizId,
					userId: user.id,
				});
			}
		} catch (_error) {
			// Continue without quiz data
			const logger = await getLogger();
			logger.error("Failed to process quiz data", {
				error: _error,
				lessonId,
			});
		}
	}

	// Get survey data if lesson has a survey
	let survey: PayloadSurvey | null = null;
	let surveyResponses: SurveyResponse[] = [];

	// Check for survey relationship - use survey_id_id (correct column name)
	const surveyId = lesson.survey_id_id;

	if (surveyId) {
		try {
			const logger = await getLogger();
			logger.info(
				`Lesson ${lesson.title} (${lessonId}) has survey ID: ${String(surveyId)}`,
			);

			// Get survey data directly using the ID
			try {
				// Import both functions we need
				const { getSurvey, getSurveyQuestions } = await import(
					"@kit/cms/payload"
				);

				// First try to get the survey by ID using a direct API call
				const logger = await getLogger();
				logger.info("Attempting to fetch survey", {
					surveyId,
					lessonNumber: lesson.lesson_number,
				});

				// Determine slug based on lesson number as a fallback
				let surveySlug = "";
				if (lesson.lesson_number === 103) {
					surveySlug = "three-quick-questions";
					logger.info("Using survey slug for lesson 103", {
						surveySlug,
					});
				} else if (lesson.lesson_number === 802) {
					surveySlug = "feedback";
					logger.info("Using survey slug for lesson 802", {
						surveySlug,
					});
				}

				// Try to get the survey by slug if we have one
				if (surveySlug) {
					logger.info("Fetching survey by slug", {
						surveySlug,
					});
					const surveyData = await getSurvey(surveySlug);

					if (surveyData?.docs && surveyData.docs.length > 0) {
						survey = surveyData.docs[0];
						logger.info(
							`Found survey by slug: ${survey?.title} (${survey?.id})`,
						);

						// Pre-fetch questions to ensure they're available
						logger.info("Pre-fetching survey questions", {
							surveyId: survey?.id,
						});
						const questionsData = survey?.id
							? await getSurveyQuestions(survey.id)
							: null;

						if (questionsData?.docs && questionsData.docs.length > 0) {
							// Add questions to the survey object directly
							if (survey) {
								survey.questions = questionsData.docs;
							}
							logger.info("Survey questions fetched successfully", {
								questionCount: questionsData.docs.length,
							});
						} else {
							logger.info("No survey questions found", {
								surveyId: survey?.id,
							});
						}
					} else {
						logger.info("No survey found for slug", {
							surveySlug,
						});
					}
				}
			} catch (_error) {
				const logger = await getLogger();
				logger.error("Failed to fetch survey data", {
					error: _error,
					surveyId,
					lessonId,
				});
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
