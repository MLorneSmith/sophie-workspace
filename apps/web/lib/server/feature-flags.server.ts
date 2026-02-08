import "server-only";

import { createServiceLogger } from "@kit/shared/logger";
import { getSupabaseServerClient } from "@kit/supabase/server-client";
import { cache } from "react";

import featureFlagsConfig from "~/config/feature-flags.config";

const { getLogger } = createServiceLogger("FEATURE-FLAGS");

/**
 * Fetch the current value of the enableCourses feature flag from the database.
 * Falls back to the static config value if the database query fails.
 *
 * This function is cached per request using React's cache() to prevent
 * multiple database queries within the same request.
 *
 * @returns Promise<boolean> - Whether courses are enabled
 */
export const getEnableCourses = cache(async (): Promise<boolean> => {
	try {
		const client = getSupabaseServerClient();

		const { data, error } = await client
			.from("config")
			.select("enable_courses")
			.limit(1)
			.single();

		if (error) {
			// Log error but don't throw - fall back to static config
			const logger = getLogger();
			logger.warn(
				"Failed to fetch enable_courses from database, falling back to static config",
				{
					name: "feature-flags",
					error: error.message,
				},
			);
			return featureFlagsConfig.enableCourses;
		}

		return data.enable_courses;
	} catch (error) {
		// Catch any unexpected errors and fall back to static config
		const logger = getLogger();
		logger.error(
			"Unexpected error fetching enable_courses, falling back to static config",
			{
				name: "feature-flags",
				error: error instanceof Error ? error.message : String(error),
			},
		);
		return featureFlagsConfig.enableCourses;
	}
});
