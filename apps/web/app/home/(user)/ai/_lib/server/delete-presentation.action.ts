"use server";

import { enhanceAction } from "@kit/next/actions";
import { getLogger } from "@kit/shared/logger";
import { getSupabaseServerClient } from "@kit/supabase/server-client";
import { z } from "zod";

const DeletePresentationSchema = z.object({
	id: z.string().uuid(),
});

export const deletePresentationAction = enhanceAction(
	async (data, user) => {
		const client = getSupabaseServerClient();
		const logger = await getLogger();
		const ctx = { name: "deletePresentationAction" };

		const { error } = await client
			.from("presentations")
			.delete()
			.eq("id", data.id)
			.eq("user_id", user.id);

		if (error) {
			logger.error(ctx, "Failed to delete presentation: %o", error);
			throw error;
		}

		return { success: true };
	},
	{
		schema: DeletePresentationSchema,
		auth: true,
	},
);
