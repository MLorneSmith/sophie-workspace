"use server";

import { enhanceAction } from "@kit/next/actions";
import { getLogger } from "@kit/shared/logger";
import { getSupabaseServerClient } from "@kit/supabase/server-client";
import { z } from "zod";

import { saveStoryboardContent } from "../_lib/server/storyboard-contents-db.service";

const SaveStoryboardSchema = z.object({
	presentationId: z.string().min(1),
	slides: z.unknown(),
});

export const saveStoryboardAction = enhanceAction(
	async (data, user) => {
		const client = getSupabaseServerClient();
		const logger = await getLogger();
		const ctx = {
			name: "saveStoryboardAction",
			presentationId: data.presentationId,
		};

		// Fetch presentation to get account_id and current workflow state
		const { data: presentation, error: presentationError } = await client
			.from("presentations")
			.select("id, user_id, account_id, completed_steps")
			.eq("id", data.presentationId)
			.eq("user_id", user.id)
			.single();

		if (presentationError || !presentation) {
			logger.error(ctx, "Failed to load presentation: %o", presentationError);
			throw new Error("Presentation not found");
		}

		// Save storyboard content using upsert
		try {
			await saveStoryboardContent(client, {
				presentationId: data.presentationId,
				userId: user.id,
				accountId: presentation.account_id,
				slides: JSON.parse(JSON.stringify(data.slides)),
			});
		} catch (error) {
			logger.error(ctx, "Failed to save storyboard content: %o", error);
			throw error;
		}

		// Update presentation workflow state
		const completedSteps = Array.isArray(presentation.completed_steps)
			? [...presentation.completed_steps]
			: [];

		if (!completedSteps.includes("storyboard")) {
			completedSteps.push("storyboard");
		}

		const { error: updatePresentationError } = await client
			.from("presentations")
			.update({
				current_step: "generate",
				completed_steps: completedSteps,
				updated_at: new Date().toISOString(),
			})
			.eq("id", data.presentationId);

		if (updatePresentationError) {
			logger.error(
				ctx,
				"Failed to update presentation workflow state: %o",
				updatePresentationError,
			);
			throw updatePresentationError;
		}

		logger.info(ctx, "Storyboard saved successfully");

		return { success: true };
	},
	{
		schema: SaveStoryboardSchema,
		auth: true,
	},
);
