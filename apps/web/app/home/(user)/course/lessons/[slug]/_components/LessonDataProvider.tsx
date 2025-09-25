import { createServiceLogger } from "@kit/shared/logger";
import type { Database } from "@kit/supabase/database";
/**
 * LessonDataProvider - Server component for fetching lesson-related data
 * Handles quiz, survey, and progress data for lesson display
 */
import { updateLessonProgressAction } from "../../../_lib/server/server-actions";

// Create service-scoped logger
const { getLogger } = createServiceLogger("LESSON-DATA-PROVIDER");

// Type definitions for Payload CMS data structures
interface PayloadLesson {
	id: string;
	title: string;
	lesson_number: number;
	quiz_id?: string | { id: string; value: string };
	quiz_id_id?: string | { id: string; value: string };
	survey_id?: string | { id: string; value: string };
	survey_id_id?: string | { id: string; value: string };
}

interface PayloadQuiz {
	id: string;
	title: string;
	questions?: PayloadQuizQuestion[];
}

interface PayloadQuizQuestion {
	id: string;
	question: string;
	answers: string[];
	correct_answer: number;
}

interface PayloadSurvey {
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
}

// Database types
type QuizAttempt = Database["public"]["Tables"]["quiz_attempts"]["Row"];
type LessonProgress = Database["public"]["Tables"]["lesson_progress"]["Row"];
type SurveyResponse = Database["public"]["Tables"]["survey_responses"]["Row"];

// Props interface
interface LessonDataProviderProps {
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
}

/**
 * Server component responsible for data fetching
 * This isolates data fetching logic from the page component
 */
export async function LessonDataProvider({
	children,
	slug: _slug,
	lessonId,
	courseId,
	lesson,
}: LessonDataProviderProps) {
	// Get logger instance
	const logger = await getLogger();

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
			// Get quiz data
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
				logger.info("Skipping empty or invalid quiz ID", {
					quizId: quizIdStr,
					lessonId,
				});
				// Continue without the quiz data
			} else {
				try {
					// Add debug logging
					logger.info("Attempting to fetch quiz data", {
						quizId: quizIdStr,
						lessonId,
					});
					quiz = await getQuiz(quizId);

					// Verify quiz questions are loaded
					if (quiz && (!quiz.questions || quiz.questions.length === 0)) {
						logger.info(
							"Quiz loaded but questions missing, fetching separately",
							{
								quizId: quiz.id,
							},
						);

						// If quiz exists but questions aren't loaded, try to fetch questions directly
						try {
							const { callPayloadAPI } = await import("@kit/cms/payload");
							const questionsResponse = await callPayloadAPI(
								`quiz_questions?where[quiz_id][equals]=${quiz.id}&sort=order&depth=0`,
							);

							if (
								questionsResponse?.docs &&
								questionsResponse.docs.length > 0
							) {
								quiz.questions = questionsResponse.docs;
								logger.info("Successfully loaded quiz questions separately", {
									quizId: quiz.id,
									questionCount: quiz.questions?.length,
								});
							} else {
								logger.warn("No quiz questions found", {
									quizId: quiz.id,
								});
							}
						} catch (_questionsError) {
							logger.error("Failed to fetch quiz questions separately", {
								error: _questionsError,
								quizId: quiz?.id,
							});
						}
					}
				} catch (_error) {
					// Log the error with context but continue without the quiz data
					logger.error("Failed to fetch quiz data", {
						error: _error,
						quizId: quizIdStr,
						lessonId,
					});
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
							: String(quizId || "");

				const { data: attempts } = await supabase
					.from("quiz_attempts")
					.select("*")
					.eq("user_id", user.id)
					.eq("quiz_id", actualQuizId)
					.order("completed_at", { ascending: false });

				quizAttempts = attempts || [];
			} catch (_error) {
				// Continue with empty quiz attempts
			}
		} catch (_error) {
			// Continue without quiz data
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
			const _actualSurveyId =
				typeof surveyId === "object" ? surveyId.id || surveyId.value : surveyId;

			logger.info(
				`Lesson ${lesson.title} (${lessonId}) has survey ID: ${_actualSurveyId}`,
			);

			// Get survey data directly using the ID
			try {
				// Import both functions we need
				const { getSurvey, getSurveyQuestions } = await import(
					"@kit/cms/payload"
				);

				// First try to get the survey by ID using a direct API call
				logger.info("Attempting to fetch survey", {
					surveyId: _actualSurveyId,
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
							logger.info("Successfully loaded survey questions", {
								surveyId: survey?.id,
								questionCount: questionsData.docs.length,
							});
						} else {
							logger.info("No survey questions found", {
								surveyId: survey?.id,
							});
						}
					} else {
						logger.info("No survey found by slug", {
							surveySlug,
							lessonNumber: lesson.lesson_number,
						});
					}
				}
			} catch (_error) {
				logger.error("Failed to fetch survey data", {
					error: _error,
					surveyId: _actualSurveyId,
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
