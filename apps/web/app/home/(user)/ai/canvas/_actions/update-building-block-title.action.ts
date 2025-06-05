"use server";

import { z } from "zod";

import { enhanceAction } from "@kit/next/actions";
import { getSupabaseServerClient } from "@kit/supabase/server-client";

export const updateBuildingBlockTitleAction = enhanceAction(
	async (data: { id: string; title: string }, _user) => {
		const client = getSupabaseServerClient();
		const { error } = await client
			.from("building_blocks_submissions")
			.update({ title: data.title })
			.eq("id", data.id);

		if (error) throw error;
		return { success: true };
	},
	{
		auth: true,
		schema: z.object({
			id: z.string(),
			title: z.string(),
		}),
	},
);
