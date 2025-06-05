"use server";

import { revalidatePath } from "next/cache";

import { z } from "zod";

import { enhanceAction } from "@kit/next/actions";
import { getLogger } from "@kit/shared/logger";
import { getSupabaseServerClient } from "@kit/supabase/server-client";

import type { StoryboardData } from "../types";
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

// Interface for building blocks submission
interface BuildingBlocksSubmission {
	id?: string;
	title?: string;
	outline?: any;
	storyboard?: StoryboardData;
	[key: string]: any;
}

// Action to get presentation data by ID
export const getPresentationAction = enhanceAction(
	async (data, user) => {
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
				logger.error(
					{ error: error.message, presentationId: data.presentationId },
					"Error fetching presentation from Supabase",
				);
				// If storyboard column doesn't exist, try without it
				if (error.message.includes("column 'storyboard' does not exist")) {
					const { data: fallbackData, error: fallbackError } = await supabase
						.from("building_blocks_submissions")
						.select("id, title, outline")
						.eq("id", data.presentationId)
						.single();

					if (fallbackError) {
						logger.error(
							{
								error: fallbackError.message,
								presentationId: data.presentationId,
							},
							"Error fetching presentation without storyboard column",
						);
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
						console.error(
							"Error transforming outline to storyboard:",
							transformError,
						);
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
								// Use explicit typing to handle adding the storyboard property
								...({ storyboard: storyboard } as any),
							})
							.eq("id", data.presentationId);
					} catch (saveError) {
						// Log but continue if saving fails
						console.warn("Could not save generated storyboard:", saveError);
					}

					// Return with the generated storyboard
					return {
						...typedPresentation,
						storyboard,
					};
				} catch (transformError) {
					console.error(
						"Error transforming outline to storyboard:",
						transformError,
					);
					// Return without storyboard if transformation fails
					return typedPresentation;
				}
			}

			return typedPresentation;
		} catch (error) {
			const logger = await getLogger();
			logger.error(
				{ error, presentationId: data.presentationId },
				"Error fetching presentation",
			);
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
	async (data, user) => {
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
			logger.error({ error }, "Error fetching presentations");
			throw new Error("Failed to fetch presentations");
		}
	},
	{
		auth: true,
	},
);

/**
 * Generate a storyboard from an outline using the TipTapTransformer
 * @param outline The TipTap outline data
 * @param title The presentation title
 * @returns A storyboard data structure
 */
async function generateStoryboardFromOutline(
	outline: any,
	title = "Untitled Presentation",
): Promise<StoryboardData> {
	try {
		// Parse outline if it's a string
		const outlineData =
			typeof outline === "string" ? JSON.parse(outline) : outline;

		// Use the TipTapTransformer to transform the outline to storyboard format
		return TipTapTransformer.transform(
			outlineData,
			title,
		) as unknown as StoryboardData;
	} catch (error) {
		const logger = await getLogger();
		logger.error({ error }, "Error generating storyboard from outline");
		throw new Error("Failed to generate storyboard from outline");
	}
}

// Action to save storyboard data
export const saveStoryboardAction = enhanceAction(
	async (data, user) => {
		const supabase = getSupabaseServerClient();
		const logger = await getLogger();

		try {
			// Try updating with storyboard
			const { error } = await supabase
				.from("building_blocks_submissions")
				.update({
					// Cast to any to handle the case where the column doesn't exist yet
					storyboard: data.storyboard as any,
				} as any)
				.eq("id", data.presentationId);

			if (error) {
				// Log the specific Supabase error
				logger.error(
					{ presentationId: data.presentationId, error: error.message },
					"Error saving storyboard to Supabase",
				);
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
			logger.error(
				{ presentationId: data.presentationId, error: errorMessage },
				"Unexpected error in saveStoryboardAction",
			);
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
