// Import the server client using dynamic import to avoid issues with next/headers
import { updateLessonProgressAction } from "../../../_lib/server/server-actions";

// Import types without the actual implementations (for type checking)
type QuizType = any;
type LessonType = any;

/**
 * Enhanced Server component responsible for data fetching
 * This updates the data fetching logic to work with the unidirectional relationship model
 */
export async function LessonDataProviderEnhanced({
	children,
	slug,
	lessonId,
	courseId,
	lesson,
}: {
	children: (data: any) => React.ReactNode;
	slug: string;
	lessonId: string;
	courseId: string;
	lesson: any;
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
	let quiz: QuizType = null;
	let quizAttempts: any[] = [];

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
				console.log(`Skipping invalid quiz ID format: ${quizIdStr}`);
				// Continue without the quiz data
			} else {
				try {
					// Add debug logging
					console.log(
						`Attempting to fetch quiz with enhanced API: ${quizIdStr}`,
					);

					// Use enhanced quiz loader with depth=2 to ensure questions are included
					// This explicitly requests a higher depth to include questions in the response
					quiz = await getQuiz(quizId, { depth: 2 });

					// Log results for debugging
					if (quiz) {
						console.log(`Successfully loaded quiz: ${quiz.title}`);
						console.log(`Quiz has ${quiz.questions?.length || 0} questions`);

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
							console.log(
								`Quiz has ${quiz.questions.length} question IDs, fetching details...`,
							);

							const { callPayloadAPI } = await import("@kit/cms/payload");

							// Get the question IDs
							const questionIds = quiz.questions.map((q: any) =>
								typeof q === "string" ? q : q.id || q.value || q,
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
									console.log(
										`Found ${questionsResponse.docs.length} questions with details`,
									);
									quiz.questions = questionsResponse.docs;
								}
							}
						}
					} else {
						console.warn(`No quiz found with ID: ${quizIdStr}`);
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
			} catch (error) {
				// Continue with empty quiz attempts
				console.error(
					`Error fetching quiz attempts: ${error instanceof Error ? error.message : "Unknown error"}`,
				);
			}
		} catch (error) {
			// Continue without quiz data
			console.error(
				`Error during quiz handling: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	}

	// Get survey data if lesson has a survey
	let survey = null;
	let surveyResponses: any[] = [];

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
