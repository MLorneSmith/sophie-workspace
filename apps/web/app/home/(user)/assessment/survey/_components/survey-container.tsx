"use client";

import { useSupabase } from "@kit/supabase/hooks/use-supabase";
import { Card } from "@kit/ui/card";
import { Progress } from "@kit/ui/progress";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
// @ts-ignore - payload types path issue
import type { Survey, SurveyQuestion } from "@/../payload/payload-types";
import {
	completeSurveyAction,
	saveResponseAction,
} from "../../_lib/server/server-actions";
// Import from the same directory
import { QuestionCard } from "./question-card";
import { SurveySummary } from "./survey-summary";

import { createServiceLogger } from "@kit/shared/logger";

// Initialize service logger
const { getLogger } = createServiceLogger("HOME-(USER)");

type SurveyContainerProps = {
	survey: Survey;
	questions: SurveyQuestion[];
	userId: string;
	initialProgress: number;
};

export function SurveyContainer({
	survey,
	questions,
	userId,
	initialProgress,
}: SurveyContainerProps) {
	const _router = useRouter();
	const supabase = useSupabase();
	const [isPending, startTransition] = useTransition();

	// Log the initial progress for debugging
	/* TODO: Async logger needed */ logger.info("Initial progress:", { data: initialProgress });
	/* TODO: Async logger needed */ logger.info("Survey ID:", { data: survey.id });
	/* TODO: Async logger needed */ logger.info("User ID:", { data: userId });

	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(
		initialProgress < questions.length ? initialProgress : 0,
	);

	const [responses, setResponses] = useState<Record<string, unknown>>({});
	const [categoryScores, setCategoryScores] = useState<Record<string, number>>(
		{},
	);

	// Load existing category scores from the database on component mount
	useEffect(() => {
		async function loadExistingScores() {
			try {
				const { data, error } = await supabase
					.from("survey_responses")
					.select("category_scores")
					.eq("user_id", userId)
					.eq("survey_id", String(survey.id))
					.maybeSingle();

				if (error) {
					/* TODO: Async logger needed */ logger.error("Error loading existing category scores:", { data: error });
					return;
				}

				if (data?.category_scores && typeof data.category_scores === "object") {
					/* TODO: Async logger needed */ logger.info("Loaded existing category scores:", { data: data.category_scores });
					setCategoryScores(data.category_scores as Record<string, number>);
				}
			} catch (error) {
				/* TODO: Async logger needed */ logger.error("Error in loadExistingScores:", { data: error });
			}
		}

		loadExistingScores();
	}, [userId, survey.id, supabase]);

	const isLastQuestion = currentQuestionIndex === questions.length - 1;
	const currentQuestion = questions[currentQuestionIndex];
	// Calculate progress based on completed questions (not including current question)
	const progress = (currentQuestionIndex / questions.length) * 100;

	const handleAnswer = (questionId: string, answer: string, score: number) => {
		// Save the response
		const category = currentQuestion.category || "general";

		// Update category scores
		const newCategoryScores = { ...categoryScores };
		if (!newCategoryScores[category]) {
			newCategoryScores[category] = 0;
		}
		newCategoryScores[category] += score;

		// Save the response locally
		setResponses({
			...responses,
			[questionId]: { answer, score, category },
		});

		// Save the response to the server
		startTransition(async () => {
			try {
				// Convert IDs to strings to match the schema
				await saveResponseAction({
					surveyId: String(survey.id),
					questionId: String(questionId),
					questionIndex: currentQuestionIndex,
					response: answer,
					category,
					score,
					totalQuestions: questions.length,
				});

				// Move to the next question or complete the survey
				if (isLastQuestion) {
					// Calculate highest and lowest scoring categories
					const sortedCategories = Object.entries(newCategoryScores).sort(
						([, a], [, b]) => b - a,
					);

					const _highestCategory = sortedCategories[0]?.[0] || "";
					const _lowestCategory =
						sortedCategories[sortedCategories.length - 1]?.[0] || "";

					// We'll show the summary regardless of whether we can complete the survey in Payload
					// This ensures the user can see their results even if there's an error
					try {
						// First, make sure we've saved the current response
						await saveResponseAction({
							surveyId: String(survey.id),
							questionId: String(questionId),
							questionIndex: currentQuestionIndex,
							response: answer,
							category,
							score,
							totalQuestions: questions.length,
						});

						// Then try to get the response record and latest category scores from Supabase
						const { data: responseData, error } = await supabase
							.from("survey_responses")
							.select("id, category_scores")
							.eq("user_id", userId)
							.eq("survey_id", String(survey.id))
							.single();

						if (error) {
							/* TODO: Async logger needed */ logger.error("Error fetching survey response record:", { data: error });
							// Continue to show summary even if there's an error
						} else if (responseData?.id) {
							// Get the latest category scores from the database
							let finalCategoryScores = { ...newCategoryScores };

							// If we have category scores in the database, use them as the source of truth
							if (
								responseData.category_scores &&
								typeof responseData.category_scores === "object"
							) {
								/* TODO: Async logger needed */ logger.info("Using database category scores for completion:", { arg1: responseData.category_scores, arg2:  });
								finalCategoryScores = responseData.category_scores as Record<
									string,
									number
								>;
							}

							// Recalculate highest and lowest categories based on final scores
							const finalSortedCategories = Object.entries(
								finalCategoryScores,
							).sort(([, a], [, b]) => b - a);

							const finalHighestCategory = finalSortedCategories[0]?.[0] || "";
							const finalLowestCategory =
								finalSortedCategories[finalSortedCategories.length - 1]?.[0] ||
								"";

							// Complete the survey with the record's ID and final category scores
							try {
								await completeSurveyAction({
									surveyId: String(survey.id),
									responseId: responseData.id,
									categoryScores: finalCategoryScores,
									highestScoringCategory: finalHighestCategory,
									lowestScoringCategory: finalLowestCategory,
								});

								// Update local state with final scores for the summary view
								setCategoryScores(finalCategoryScores);
							} catch (completionError) {
								/* TODO: Async logger needed */ logger.error("Error completing survey:", { data: completionError });
								// Continue to show summary even if there's an error
							}
						} else {
							/* TODO: Async logger needed */ logger.error("Could not find survey response record for completion", { data:  });
							// Continue to show summary even if there's no record ID
						}
					} catch (error) {
						/* TODO: Async logger needed */ logger.error("Error in final survey step:", { data: error });
						// Continue to show summary even if there's an error
					}

					// Show summary regardless of whether completeSurveyAction succeeded
					setCurrentQuestionIndex(questions.length);
				} else {
					setCurrentQuestionIndex(currentQuestionIndex + 1);
				}
			} catch (error) {
				/* TODO: Async logger needed */ logger.error("Error saving response:", { data: error });
			}
		});
	};

	// If we've gone through all questions, show the summary
	if (currentQuestionIndex >= questions.length) {
		return (
			<SurveySummary
				survey={survey}
				categoryScores={categoryScores}
				totalQuestions={questions.length}
			/>
		);
	}

	return (
		<div className="container mx-auto max-w-3xl px-4">
			<Card className="bg-card mb-8 overflow-hidden shadow-lg">
				<div className="p-1">
					<Progress value={progress} className="h-2 w-full" />
				</div>

				<div className="p-6">
					<div className="text-muted-foreground mb-2 flex justify-between text-sm">
						<span>
							Question {currentQuestionIndex + 1} of {questions.length}
						</span>
						<span>
							{currentQuestionIndex === 0 ? "0" : Math.round(progress)}%
							Complete
						</span>
					</div>

					<QuestionCard
						key={currentQuestion.id}
						question={currentQuestion}
						onAnswer={handleAnswer}
						isLoading={isPending}
					/>
				</div>
			</Card>
		</div>
	);
}
