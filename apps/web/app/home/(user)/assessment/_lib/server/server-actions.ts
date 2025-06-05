"use server";

import { z } from "zod";

import { enhanceAction } from "@kit/next/actions";
// We no longer need to import from Payload for survey responses
import { getSupabaseServerClient } from "@kit/supabase/server-client";

/**
 * Schema for saving a survey response
 */
const SaveResponseSchema = z.object({
	surveyId: z.string(),
	questionId: z.string(),
	questionIndex: z.number(),
	response: z.string(),
	category: z.string(),
	score: z.number(),
	totalQuestions: z.number(),
});

/**
 * Save a survey response
 */
export const saveResponseAction = enhanceAction(
	async (data, user) => {
		const supabase = getSupabaseServerClient();

		try {
			// Validate total_questions by fetching the actual count from the database
			const { getSurveyQuestions } = await import("@kit/cms/payload");
			const questionsData = await getSurveyQuestions(data.surveyId);
			const actualTotalQuestions = questionsData.docs?.length || 0;

			console.log(
				`Actual question count for survey ${data.surveyId}: ${actualTotalQuestions}`,
			);
			console.log(`Client-provided question count: ${data.totalQuestions}`);

			// Use the actual count instead of the provided one
			const totalQuestions =
				actualTotalQuestions > 0 ? actualTotalQuestions : data.totalQuestions;

			// Calculate progress percentage
			const progressPercentage =
				((data.questionIndex + 1) / totalQuestions) * 100;

			// Format the new response
			const newResponse = {
				questionId: data.questionId,
				response: data.response,
				score: data.score,
				category: data.category,
				answeredAt: new Date().toISOString(),
			};

			// Check if user already has a response entry in Supabase
			const { data: existingResponseData, error: selectError } = await supabase
				.from("survey_responses")
				.select("id, responses, category_scores")
				.eq("user_id", user.id)
				.eq("survey_id", data.surveyId)
				.maybeSingle();

			if (selectError && selectError.code !== "PGRST116") {
				throw new Error(
					`Error checking for existing response: ${selectError.message}`,
				);
			}

			// Update category scores
			let categoryScores: Record<string, number> = {};

			// If we have existing category scores, use them as a base
			if (
				existingResponseData?.category_scores &&
				typeof existingResponseData.category_scores === "object"
			) {
				categoryScores = {
					...(existingResponseData.category_scores as Record<string, number>),
				};
			}

			// Add the current question's score to the appropriate category
			const category = data.category || "general";
			if (!categoryScores[category]) {
				categoryScores[category] = 0;
			}
			categoryScores[category] += data.score;

			if (existingResponseData?.id) {
				// Get existing responses from Supabase
				const existingResponses = Array.isArray(existingResponseData.responses)
					? existingResponseData.responses
					: [];

				// Update existing record in Supabase
				const { error: updateError } = await supabase
					.from("survey_responses")
					.update({
						responses: [...existingResponses, newResponse],
						category_scores: categoryScores,
						completed: progressPercentage === 100,
						updated_at: new Date().toISOString(),
					})
					.eq("id", existingResponseData.id);

				if (updateError) {
					throw new Error(
						`Error updating survey response: ${updateError.message}`,
					);
				}
			} else {
				// Create new record in Supabase
				const { error: insertError } = await supabase
					.from("survey_responses")
					.insert({
						user_id: user.id,
						survey_id: data.surveyId,
						responses: [newResponse],
						category_scores: categoryScores,
						completed: false,
					});

				if (insertError) {
					throw new Error(
						`Error inserting survey response: ${insertError.message}`,
					);
				}
			}

			// Update progress in Supabase
			const { error: upsertError } = await supabase
				.from("survey_progress")
				.upsert(
					{
						user_id: user.id,
						survey_id: data.surveyId,
						current_question_index: data.questionIndex + 1,
						total_questions: totalQuestions, // Use the validated count
						progress_percentage: progressPercentage,
						last_answered_at: new Date().toISOString(),
					},
					{ onConflict: "user_id,survey_id" },
				);

			if (upsertError) {
				throw new Error(
					`Error updating survey progress: ${upsertError.message}`,
				);
			}

			return { success: true };
		} catch (error) {
			console.error("Error in saveResponseAction:", error);

			// Log more detailed information for debugging
			if (error instanceof Error) {
				console.error("Error details:", {
					message: error.message,
					stack: error.stack,
					name: error.name,
				});
			}

			return {
				success: false,
				error:
					error instanceof Error ? error.message : "An unknown error occurred",
			};
		}
	},
	{
		auth: true,
		schema: SaveResponseSchema,
	},
);

/**
 * Schema for completing a survey
 */
const CompleteSurveySchema = z.object({
	surveyId: z.string(),
	responseId: z.string(),
	categoryScores: z.record(z.string(), z.number()),
	highestScoringCategory: z.string(),
	lowestScoringCategory: z.string(),
});

/**
 * Complete a survey
 */
export const completeSurveyAction = enhanceAction(
	async (data, user) => {
		const supabase = getSupabaseServerClient();

		try {
			console.log("Completing survey with data:", {
				responseId: data.responseId,
				surveyId: data.surveyId,
				highestCategory: data.highestScoringCategory,
				lowestCategory: data.lowestScoringCategory,
			});

			// Update the survey response in Supabase
			const { error: updateError } = await supabase
				.from("survey_responses")
				.update({
					completed: true,
					category_scores: data.categoryScores,
					highest_scoring_category: data.highestScoringCategory,
					lowest_scoring_category: data.lowestScoringCategory,
					updated_at: new Date().toISOString(),
				})
				.eq("id", data.responseId);

			if (updateError) {
				throw new Error(`Error completing survey: ${updateError.message}`);
			}

			return { success: true };
		} catch (error) {
			console.error("Error in completeSurveyAction:", error);

			// Log more detailed information for debugging
			if (error instanceof Error) {
				console.error("Error details:", {
					message: error.message,
					stack: error.stack,
					name: error.name,
				});
			}

			return {
				success: false,
				error:
					error instanceof Error ? error.message : "An unknown error occurred",
			};
		}
	},
	{
		auth: true,
		schema: CompleteSurveySchema,
	},
);
