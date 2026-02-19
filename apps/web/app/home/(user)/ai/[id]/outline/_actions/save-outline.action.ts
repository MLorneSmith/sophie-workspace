"use server";

import { enhanceAction } from "@kit/next/actions";
import { getLogger } from "@kit/shared/logger";
import { getSupabaseServerClient } from "@kit/supabase/server-client";
import { z } from "zod";

const SaveOutlineSchema = z.object({
	presentationId: z.string().min(1),
	content: z.unknown(),
});

export const saveOutlineAction = enhanceAction(
	async (data, _user) => {
		const client = getSupabaseServerClient();

		const { error } = await client
			.from("outline_contents")
			.update({
				sections: JSON.parse(JSON.stringify(data.content)),
				updated_at: new Date().toISOString(),
			})
			.eq("presentation_id", data.presentationId);

		if (error) {
			const logger = await getLogger();
			logger.error("Failed to save outline", {
				presentationId: data.presentationId,
				error,
			});
			throw error;
		}

		return { success: true };
	},
	{
		schema: SaveOutlineSchema,
		auth: true,
	},
);
