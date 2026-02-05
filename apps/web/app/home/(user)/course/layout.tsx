import { redirect } from "next/navigation";

import pathsConfig from "~/config/paths.config";
import { getEnableCourses } from "~/lib/server/feature-flags.server";

/**
 * Course layout with feature flag protection.
 * Fetches the live database value for the enableCourses flag.
 * When the flag is disabled, redirects to /home dashboard.
 * This provides a friendly UX for users who may have bookmarked course pages.
 */
export default async function CourseLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const enableCourses = await getEnableCourses();

	if (!enableCourses) {
		redirect(pathsConfig.app.home);
	}

	return <>{children}</>;
}
