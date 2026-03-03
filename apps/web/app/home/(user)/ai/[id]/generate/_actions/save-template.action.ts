"use server";

import { enhanceAction } from "@kit/next/actions";
import { getLogger } from "@kit/shared/logger";
import { getSupabaseServerClient } from "@kit/supabase/server-client";
import { z } from "zod";

const SaveTemplateSchema = z.object({
	presentationId: z.string().min(1),
	templateId: z.string().min(1),
});

export const saveTemplateAction = enhanceAction(
	async (data, _user) => {
		const logger = await getLogger();
		const client = getSupabaseServerClient();

		const { error } = await client
			.from("presentations")
			.update({ template_id: data.templateId })
			.eq("id", data.presentationId);

		if (error) {
			logger.error("Failed to save template selection", {
				presentationId: data.presentationId,
				templateId: data.templateId,
				error: error.message,
			});
			throw new Error("Failed to save template selection");
		}

		logger.info("Template selection saved", {
			presentationId: data.presentationId,
			templateId: data.templateId,
		});

		return {
			success: true,
		};
	},
	{
		schema: SaveTemplateSchema,
		auth: true,
	},
);
