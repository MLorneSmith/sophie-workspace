import "server-only";

import { getSupabaseServerClient } from "@kit/supabase/server-client";

/**
 * Load settings data for the admin settings page.
 * Fetches the current feature flag configuration from the database.
 */
export async function loadSettingsPageData() {
	const client = getSupabaseServerClient();

	const { data, error } = await client
		.from("config")
		.select("enable_courses")
		.limit(1)
		.single();

	if (error) {
		throw new Error(`Failed to load config: ${error.message}`);
	}

	return {
		enableCourses: data.enable_courses,
	};
}
