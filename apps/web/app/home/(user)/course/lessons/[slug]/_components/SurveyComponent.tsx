"use client";

import { useEffect, useState, useTransition } from "react";

import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { useSupabase } from "@kit/supabase/hooks/use-supabase";
import { Card } from "@kit/ui/card";
import { Progress } from "@kit/ui/progress";

import { saveResponseAction } from "../../../../assessment/_lib/server/server-actions";
import { QuestionCard } from "../../../../assessment/survey/_components/question-card";
import { SurveySummary } from "../../../../assessment/survey/_components/survey-summary";

type SurveyComponentProps = {
	survey: any;
	surveyResponses?: any[];
	userId: string;
	onComplete: () => void;
};

export function SurveyComponent({
	survey,
	surveyResponses = [],
	userId,
	onComplete,
}: SurveyComponentProps) {
	const [isPending, startTransition] = useTransition();
	const supabase = useSupabase();

	const [questions, setQuestions] = useState<any[]>([]);
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [responses, setResponses] = useState<Record<string, any>>({});
	const [showSummary, setShowSummary] = useState(false);

	// Fetch survey questions - with improved handling for pre-fetched questions
	const { data: questionsData, isLoading: isQuestionsLoading } = useQuery({
		queryKey: ["survey-questions", survey?.id],
		queryFn: async () => {
			console.log(`Processing questions for survey ID: ${survey?.id}`);

			// First check if questions are already included in the survey object
			if (
				survey?.questions &&
				Array.isArray(survey.questions) &&
				survey.questions.length > 0
			) {
				console.log(
					`Survey already contains ${survey.questions.length} questions`,
				);

				// Check if questions are fully populated with text
				const hasFullyPopulatedQuestions = survey.questions.some(
					(q: any) => q.text || q.question,
				);

				if (hasFullyPopulatedQuestions) {
					console.log("Questions are fully populated in survey object");
					return survey.questions;
				}
				console.log("Questions are references only, need to fetch full data");
			}

			// If questions aren't already available or are just references, fetch them
			try {
				// If we don't have a survey ID, we can't fetch questions
				if (!survey?.id) {
					console.warn("No survey ID available to fetch questions");
					return [];
				}

				const { getSurveyQuestions } = await import("@kit/cms/payload");
				console.log(`Fetching questions via API for survey ID: ${survey.id}`);

				const data = await getSurveyQuestions(survey.id);
				console.log(`API returned ${data.docs?.length || 0} questions`);

				// If we got questions, return them
				if (data.docs?.length > 0) {
					return data.docs;
				}

				// If we didn't get questions but have references, try to use those
				if (survey?.questions?.length && !data.docs?.length) {
					console.log("Using question references from survey as fallback");
					return survey.questions;
				}

				return [];
			} catch (error) {
				console.error("Error fetching survey questions:", error);

				// If we have any questions in the survey object, use those as fallback
				if (survey?.questions?.length) {
					console.log(
						"Using question references from survey as fallback after error",
					);
					return survey.questions;
				}

				return [];
			}
		},
		enabled: !!survey,
	});

	// Set questions when data is loaded
	useEffect(() => {
		if (questionsData && questionsData.length > 0) {
			console.log("Processing questionsData:", questionsData);

			// Transform questions to ensure they have the right format
			const transformedQuestions = questionsData.map((q: any) => {
				console.log("Processing question:", q);

				// Ensure each question has the required properties
				const question: {
					id: string;
					text: string;
					type: string;
					category: string;
					position: number;
					options: Array<{ id: string; text: string; score?: number }>;
				} = {
					id: q.id,
					text: q.text || q.question || "",
					type: q.type || "multiple_choice",
					category: q.category || "general",
					position: q.position || 0,
					options: [],
				};

				// Special handling for scale questions
				if (q.type === "scale") {
					// Create default scale options if none exist
					if (!Array.isArray(q.options) || q.options.length === 0) {
						question.options = [
							{ id: `${q.id}_option_1`, text: "1 - Very inexperienced" },
							{ id: `${q.id}_option_2`, text: "2 - Somewhat inexperienced" },
							{ id: `${q.id}_option_3`, text: "3 - Neutral" },
							{ id: `${q.id}_option_4`, text: "4 - Somewhat experienced" },
							{ id: `${q.id}_option_5`, text: "5 - Very experienced" },
						];
					}
				}

				// Handle options based on different possible formats
				else if (Array.isArray(q.options)) {
					question.options = q.options.map((opt: any, index: number) => {
						if (typeof opt === "string") {
							return { id: `${q.id}_option_${index}`, text: opt };
						}
						if (typeof opt === "object") {
							return {
								id: `${q.id}_option_${index}`,
								text: opt.option || opt.text || `Option ${index + 1}`,
							};
						}
						return {
							id: `${q.id}_option_${index}`,
							text: `Option ${index + 1}`,
						};
					});
				}

				// Special handling for text_field questions
				if (q.type === "text_field") {
					// Text field questions don't need options
					question.options = [];
				}

				console.log("Transformed question:", question);
				return question;
			});

			// Sort questions by position
			const sortedQuestions = [...transformedQuestions].sort(
				(a, b) => (a.position || 0) - (b.position || 0),
			);

			console.log(
				`Survey ${survey?.id} (${survey?.title || survey?.slug}): Processed ${sortedQuestions.length} questions`,
			);

			// Log each question for debugging
			sortedQuestions.forEach((q, index) => {
				console.log(
					`Question ${index + 1}: ${q.text} (ID: ${q.id}), Type: ${q.type}, Options: ${q.options.length}`,
				);
			});

			setQuestions(sortedQuestions);
		} else {
			console.warn(`Survey ${survey?.id}: No questions found in questionsData`);

			// Special handling for Three Quick Questions survey
			if (survey?.id === "6f463bef-d7a0-4e5a-b0fa-a789b5d6f0e0") {
				console.log(
					"Applying hardcoded questions for Three Quick Questions survey",
				);

				// Create hardcoded questions based on database query
				const hardcodedQuestions = [
					{
						id: "61a8e0b5-c600-49cc-9b18-6ba0f158bed3",
						text: "Fill in the blank: After taking this course, I will be able to ________________________.",
						type: "text_field",
						category: "goals",
						position: 0,
						options: [],
					},
					{
						id: "e0a592e6-d96a-4b62-ad11-3d6e16b2175d",
						text: "How experienced do you feel in this course's subject matter?",
						type: "scale",
						category: "experience",
						position: 1,
						options: [
							{
								id: "e0a592e6-d96a-4b62-ad11-3d6e16b2175d_option_1",
								text: "1 - Very inexperienced",
							},
							{
								id: "e0a592e6-d96a-4b62-ad11-3d6e16b2175d_option_2",
								text: "2 - Somewhat inexperienced",
							},
							{
								id: "e0a592e6-d96a-4b62-ad11-3d6e16b2175d_option_3",
								text: "3 - Neutral",
							},
							{
								id: "e0a592e6-d96a-4b62-ad11-3d6e16b2175d_option_4",
								text: "4 - Somewhat experienced",
							},
							{
								id: "e0a592e6-d96a-4b62-ad11-3d6e16b2175d_option_5",
								text: "5 - Very experienced",
							},
						],
					},
					{
						id: "e0b335b6-dde9-4117-963b-c482b3ae5595",
						text: "What's the biggest roadblock you have with this course's subject matter right now?",
						type: "text_field",
						category: "roadblocks",
						position: 2,
						options: [],
					},
				];

				console.log("Setting hardcoded questions:", hardcodedQuestions);
				setQuestions(hardcodedQuestions);
			}
		}
	}, [questionsData, survey]);

	// Check if user has already completed this survey
	useEffect(() => {
		if (surveyResponses && surveyResponses.length > 0) {
			const response = surveyResponses[0];
			if (response.completed) {
				setShowSummary(true);
			}
		}
	}, [surveyResponses]);

	// Calculate progress
	const progress =
		questions.length > 0 ? (currentQuestionIndex / questions.length) * 100 : 0;
	const isLastQuestion = currentQuestionIndex === questions.length - 1;
	const currentQuestion = questions[currentQuestionIndex];

	// Handle answer submission
	const handleAnswer = (questionId: string, answer: string, score: number) => {
		// Save the response
		const category = currentQuestion.category || "general";

		// Save the response locally
		setResponses({
			...responses,
			[questionId]: { answer, score, category },
		});

		// Save the response to the server
		startTransition(async () => {
			try {
				await saveResponseAction({
					surveyId: survey.id,
					questionId,
					questionIndex: currentQuestionIndex,
					response: answer,
					category,
					score,
					totalQuestions: questions.length,
				});

				// Move to the next question or complete the survey
				if (isLastQuestion) {
					setShowSummary(true);
					onComplete();
				} else {
					setCurrentQuestionIndex(currentQuestionIndex + 1);
				}
			} catch (error) {
				toast.error("Failed to save response. Please try again.");
			}
		});
	};

	// Loading state
	if (isQuestionsLoading) {
		return <div>Loading survey...</div>;
	}

	// No questions found
	if (!questions || questions.length === 0) {
		return <div>No questions found for this survey.</div>;
	}

	// Show summary
	if (showSummary) {
		return (
			<div className="p-8 text-center">
				<h2 className="mb-4 text-2xl font-bold">
					Thank you for completing the survey!
				</h2>
				<p className="mb-6">Your responses have been recorded.</p>
			</div>
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

					{currentQuestion && (
						<QuestionCard
							key={currentQuestion.id}
							question={currentQuestion}
							onAnswer={handleAnswer}
							isLoading={isPending}
						/>
					)}
				</div>
			</Card>
		</div>
	);
}
