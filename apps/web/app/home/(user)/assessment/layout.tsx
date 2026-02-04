import { redirect } from "next/navigation";

import pathsConfig from "~/config/paths.config";
import { getEnableCourses } from "~/lib/server/feature-flags.server";

/**
 * Assessment layout with feature flag protection.
 * Fetches the live database value for the enableCourses flag.
 * When the flag is disabled, redirects to /home dashboard.
 * This provides a friendly UX for users who may have bookmarked assessment pages.
 */
export default async function AssessmentLayout({
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
