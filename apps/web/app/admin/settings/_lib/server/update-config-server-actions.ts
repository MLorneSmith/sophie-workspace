"use server";

import { enhanceAction } from "@kit/next/actions";
import { getSupabaseServerClient } from "@kit/supabase/server-client";
import { revalidatePath } from "next/cache";

import { AdminSettingsSchema } from "../schemas/settings.schema";

/**
 * Server action to update the config table.
 * Only accessible by super admins (enforced by RLS policy).
 */
export const updateConfigAction = enhanceAction(
	async (data) => {
		const client = getSupabaseServerClient();

		// The config table has a single row - update it using a filter that always matches
		const { error } = await client
			.from("config")
			.update({
				enable_courses: data.enableCourses,
			})
			.not("enable_team_accounts", "is", null);

		if (error) {
			return {
				success: false,
				error: `Failed to update config: ${error.message}`,
			};
		}

		// Revalidate the admin settings page and any pages that depend on config
		revalidatePath("/admin/settings");
		revalidatePath("/home");

		return {
			success: true,
			data: {
				enableCourses: data.enableCourses,
			},
		};
	},
	{
		auth: true,
		schema: AdminSettingsSchema,
	},
);
