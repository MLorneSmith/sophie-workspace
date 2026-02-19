"use server";

import { enhanceAction } from "@kit/next/actions";
import { getLogger } from "@kit/shared/logger";
import { getSupabaseServerClient } from "@kit/supabase/server-client";
import { z } from "zod";

import { saveOutlineContent } from "../_lib/server/outline-contents-db.service";

const SaveOutlineSchema = z.object({
	presentationId: z.string().min(1),
	content: z.unknown(),
});

export const saveOutlineAction = enhanceAction(
	async (data, user) => {
		const client = getSupabaseServerClient();
		const logger = await getLogger();
		const ctx = {
			name: "saveOutlineAction",
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

		// Save outline content using upsert
		try {
			await saveOutlineContent(client, {
				presentationId: data.presentationId,
				userId: user.id,
				accountId: presentation.account_id,
				sections: JSON.parse(JSON.stringify(data.content)),
			});
		} catch (error) {
			logger.error(ctx, "Failed to save outline content: %o", error);
			throw error;
		}

		// Update presentation workflow state
		const completedSteps = Array.isArray(presentation.completed_steps)
			? [...presentation.completed_steps]
			: [];

		if (!completedSteps.includes("outline")) {
			completedSteps.push("outline");
		}

		const { error: updatePresentationError } = await client
			.from("presentations")
			.update({
				current_step: "storyboard",
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

		logger.info(ctx, "Outline saved successfully");

		return { success: true };
	},
	{
		schema: SaveOutlineSchema,
		auth: true,
	},
);
