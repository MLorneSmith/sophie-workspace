import type { Database } from "@kit/supabase/database";
/**
 * LessonDataProvider - Server component for fetching lesson-related data
 * Handles quiz, survey, and progress data for lesson display
 */
import { updateLessonProgressAction } from "../../../_lib/server/server-actions";

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
	title: string;
	questions?: PayloadSurveyQuestion[];
}

interface PayloadSurveyQuestion {
	id: string;
	question: string;
	type: string;
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
				console.log(`Skipping invalid quiz ID format: ${quizIdStr}`);
				// Continue without the quiz data
			} else {
				try {
					// Add debug logging
					console.log(`Attempting to fetch quiz: ${quizIdStr}`);
					quiz = await getQuiz(quizId);

					// Verify quiz questions are loaded
					if (quiz && (!quiz.questions || quiz.questions.length === 0)) {
						console.log(
							`Quiz ${quizIdStr} found but has no questions - fetching questions separately`,
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
								console.log(
									`Successfully loaded ${questionsResponse.docs.length} questions for quiz ${quiz.id}`,
								);
							} else {
								console.warn(`No questions found for quiz ${quiz.id}`);
							}
						} catch (questionsError) {
							console.error(
								`Error fetching questions separately: ${questionsError instanceof Error ? questionsError.message : "Unknown error"}`,
							);
						}
					}
				} catch (error) {
					// Log the error with context but continue without the quiz data
					console.error(
						`Error fetching quiz with ID ${quizIdStr}: ${error instanceof Error ? error.message : "Unknown error"}`,
					);
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
			const actualSurveyId =
				typeof surveyId === "object" ? surveyId.id || surveyId.value : surveyId;

			console.log(
				`Lesson ${lesson.title} (${lessonId}) has survey ID: ${actualSurveyId}`,
			);
			console.log(`Lesson number: ${lesson.lesson_number}`);

			// Get survey data directly using the ID
			try {
				// Import both functions we need
				const { getSurvey, getSurveyQuestions } = await import(
					"@kit/cms/payload"
				);

				// First try to get the survey by ID using a direct API call
				console.log(`Fetching survey with ID: ${actualSurveyId}`);

				// Determine slug based on lesson number as a fallback
				let surveySlug = "";
				if (lesson.lesson_number === 103) {
					surveySlug = "three-quick-questions";
					console.log(
						`Lesson 103: Using survey slug '${surveySlug}' as fallback`,
					);
				} else if (lesson.lesson_number === 802) {
					surveySlug = "feedback";
					console.log(
						`Lesson 802: Using survey slug '${surveySlug}' as fallback`,
					);
				}

				// Try to get the survey by slug if we have one
				if (surveySlug) {
					console.log(`Trying to get survey by slug: ${surveySlug}`);
					const surveyData = await getSurvey(surveySlug);

					if (surveyData?.docs && surveyData.docs.length > 0) {
						survey = surveyData.docs[0];
						console.log(`Found survey by slug: ${survey.title} (${survey.id})`);

						// Pre-fetch questions to ensure they're available
						console.log(`Pre-fetching questions for survey ID: ${survey.id}`);
						const questionsData = await getSurveyQuestions(survey.id);

						if (questionsData?.docs && questionsData.docs.length > 0) {
							// Add questions to the survey object directly
							survey.questions = questionsData.docs;
							console.log(
								`Added ${questionsData.docs.length} questions to survey object`,
							);
						} else {
							console.log(`No questions found for survey ID: ${survey.id}`);
						}
					} else {
						console.log(`No survey found with slug: ${surveySlug}`);
					}
				}
			} catch (error) {
				console.error(
					`Error fetching survey with ID ${actualSurveyId}:`,
					error,
				);
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
