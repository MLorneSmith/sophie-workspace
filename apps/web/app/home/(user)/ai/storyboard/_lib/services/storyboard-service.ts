"use server";

import { enhanceAction } from "@kit/next/actions";
import { getLogger } from "@kit/shared/logger";
import { getSupabaseServerClient } from "@kit/supabase/server-client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { BuildingBlocksSubmission, StoryboardData } from "../types";
import { TipTapTransformer } from "./tiptap-transformer";

// Schema for validation
const StoryboardDataSchema = z.object({
	title: z.string(),
	slides: z.array(
		z.object({
			id: z.string(),
			title: z.string(),
			slideType: z
				.enum(["title", "section", "content", "bullet", "chart", "comparison"])
				.optional(),
			subheadlines: z.array(z.string()).optional(),
			layoutId: z.string(),
			content: z.array(
				z.object({
					type: z.enum([
						"text",
						"bullet",
						"subbullet",
						"image",
						"chart",
						"table",
					]),
					text: z.string().optional(),
					columnIndex: z.number(),
					imageUrl: z.string().optional(),
					chartType: z
						.enum([
							"bar",
							"line",
							"pie",
							"area",
							"scatter",
							"bubble",
							"radar",
							"doughnut",
						])
						.optional(),
					chartData: z.any().optional(),
					formatting: z
						.object({
							bold: z.boolean().optional(),
							italic: z.boolean().optional(),
							color: z.string().optional(),
							fontSize: z.number().optional(),
						})
						.optional(),
				}),
			),
			order: z.number(),
		}),
	),
});

// Action to get presentation data by ID
export const getPresentationAction = enhanceAction(
	async (data, _user) => {
		const supabase = getSupabaseServerClient();

		try {
			// First try to include storyboard
			const { data: presentation, error } = await supabase
				.from("building_blocks_submissions")
				.select("id, title, outline, storyboard")
				.eq("id", data.presentationId)
				.single();

			if (error) {
				const logger = await getLogger();
				logger.error({ error: error.message, { arg1: presentationId: data.presentationId }, arg2: "Error fetching presentation from Supabase", arg3:  });
				// If storyboard column doesn't exist, try without it
				if (error.message.includes("column 'storyboard' does not exist")) {
					const { data: fallbackData, error: fallbackError } = await supabase
						.from("building_blocks_submissions")
						.select("id, title, outline")
						.eq("id", data.presentationId)
						.single();

					if (fallbackError) {
						logger.error({
								error: fallbackError.message, { arg1: presentationId: data.presentationId, arg2: }, arg3: "Error fetching presentation without storyboard column", arg4:  });
						throw new Error(
							`Failed to load presentation data. Please check your connection and try again. Details: ${fallbackError.message}`,
						);
					}

					// Type-cast the fallback data to our known type
					const typedFallbackData = fallbackData as BuildingBlocksSubmission;

					// Generate storyboard from outline using our transformer
					try {
						const outline =
							typeof typedFallbackData.outline === "string"
								? JSON.parse(typedFallbackData.outline)
								: typedFallbackData.outline;

						// Use the TipTapTransformer to create a storyboard and cast to the correct type
						const storyboard = TipTapTransformer.transform(
							outline,
							typedFallbackData.title || "Untitled Presentation",
						) as unknown as StoryboardData;

						// Return with the generated storyboard
						return {
							...typedFallbackData,
							storyboard,
						};
					} catch (transformError) {
						// TODO: Async logger needed
		// TODO: Fix logger call - was: error
						// Return the data without storyboard if transformation fails
						return typedFallbackData;
					}
				}
				throw error;
			}

			// Type-cast the presentation data to our known type
			const typedPresentation = presentation as BuildingBlocksSubmission;

			// If we have a presentation but no storyboard, generate one
			if (
				typedPresentation &&
				!typedPresentation.storyboard &&
				typedPresentation.outline
			) {
				try {
					const outline =
						typeof typedPresentation.outline === "string"
							? JSON.parse(typedPresentation.outline)
							: typedPresentation.outline;

					// Use the TipTapTransformer to create a storyboard and cast to the correct type
					const storyboard = TipTapTransformer.transform(
						outline,
						typedPresentation.title || "Untitled Presentation",
					) as unknown as StoryboardData;

					// Try to save the generated storyboard
					try {
						await supabase
							.from("building_blocks_submissions")
							.update({
								storyboard:
									storyboard as DatabaseBuildingBlocksUpdate["storyboard"],
							})
							.eq("id", data.presentationId);
					} catch (saveError) {
						// Log but continue if saving fails
						// TODO: Async logger needed
		// TODO: Fix logger call - was: warn
					}

					// Return with the generated storyboard
					return {
						...typedPresentation,
						storyboard,
					};
				} catch (transformError) {
					// TODO: Async logger needed
		// TODO: Fix logger call - was: error
					// Return without storyboard if transformation fails
					return typedPresentation;
				}
			}

			return typedPresentation;
		} catch (error) {
			const logger = await getLogger();
			logger.error({ error, { arg1: presentationId: data.presentationId }, arg2: "Error fetching presentation", arg3:  });
			throw new Error("Failed to load presentation data.");
		}
	},
	{
		auth: true,
		schema: z.object({
			presentationId: z.string(),
		}),
	},
);

// Action to get all presentations
export const getPresentationsAction = enhanceAction(
	async (_data, _user) => {
		const supabase = getSupabaseServerClient();

		try {
			const { data: presentations, error } = await supabase
				.from("building_blocks_submissions")
				.select("id, title, created_at")
				.order("created_at", { ascending: false });

			if (error) {
				throw error;
			}

			return presentations;
		} catch (error) {
			const logger = await getLogger();
			logger.error({ error }, { data: "Error fetching presentations" });
			throw new Error("Failed to fetch presentations");
		}
	},
	{
		auth: true,
	},
);

// Action to save storyboard data
export const saveStoryboardAction = enhanceAction(
	async (data, _user) => {
		const supabase = getSupabaseServerClient();
		const logger = await getLogger();

		try {
			// Try updating with storyboard
			const { error } = await supabase
				.from("building_blocks_submissions")
				.update({
					storyboard:
						data.storyboard as DatabaseBuildingBlocksUpdate["storyboard"],
				} satisfies DatabaseBuildingBlocksUpdate)
				.eq("id", data.presentationId);

			if (error) {
				// Log the specific Supabase error
				logger.error({ presentationId: data.presentationId, error: error.message, message: "Error saving storyboard to Supabase" });
				// If storyboard column doesn't exist, inform the client
				if (error.message.includes("column 'storyboard' does not exist")) {
					throw new Error(
						"Storyboard feature is not fully set up yet. Please run the latest database migrations.",
					);
				}
				// Throw a more user-friendly error message for other Supabase errors
				throw new Error(
					`Failed to save storyboard data. Please try again. Details: ${error.message}`,
				);
			}

			// If no error, save was successful
			// Revalidate path to ensure fresh data
			revalidatePath("/home/(user)/ai/storyboard");

			return { success: true };
		} catch (error) {
			// Catch any unexpected errors during the process
			const errorMessage =
				error instanceof Error ? error.message : "An unknown error occurred";
			logger.error({ presentationId: data.presentationId, error: errorMessage, message: "Unexpected error in saveStoryboardAction" });
			// Throw a more user-friendly error message for unexpected errors
			throw new Error(
				`An unexpected error occurred while saving the storyboard. Please try again. Details: ${errorMessage}`,
			);
		}
	},
	{
		auth: true,
		schema: z.object({
			presentationId: z.string(),
			storyboard: StoryboardDataSchema,
		}),
	},
);
