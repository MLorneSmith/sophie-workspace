"use server";

import { enhanceAction } from "@kit/next/actions";
import { getLogger } from "@kit/shared/logger";
import { getSupabaseServerClient } from "@kit/supabase/server-client";
import { z } from "zod";

import { saveGenerateOutput } from "../_lib/server/generate-outputs-db.service";

const SaveGenerateSchema = z.object({
	presentationId: z.string().min(1),
	templateId: z.string().min(1),
	exportFormat: z.enum(["pptx", "pdf"]).nullish(),
	exportUrl: z.string().nullish(),
	generatedAt: z.string().nullish(),
});

export const saveGenerateAction = enhanceAction(
	async (data, user) => {
		const client = getSupabaseServerClient();
		const logger = await getLogger();
		const ctx = {
			name: "saveGenerateAction",
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

		// Save generate output using upsert
		try {
			await saveGenerateOutput(client, {
				presentationId: data.presentationId,
				userId: user.id,
				accountId: presentation.account_id,
				templateId: data.templateId,
				exportFormat: data.exportFormat ?? null,
				exportUrl: data.exportUrl ?? null,
				generatedAt: data.generatedAt ?? null,
			});
		} catch (error) {
			logger.error(ctx, "Failed to save generate output: %o", error);
			throw error;
		}

		// Update presentation workflow state
		const completedSteps = Array.isArray(presentation.completed_steps)
			? [...presentation.completed_steps]
			: [];

		if (!completedSteps.includes("generate")) {
			completedSteps.push("generate");
		}

		const { error: updatePresentationError } = await client
			.from("presentations")
			.update({
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

		logger.info(ctx, "Generate output saved successfully");

		return { success: true };
	},
	{
		schema: SaveGenerateSchema,
		auth: true,
	},
);
