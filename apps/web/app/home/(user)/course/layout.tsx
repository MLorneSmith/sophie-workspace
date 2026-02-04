import { redirect } from "next/navigation";

import featureFlagsConfig from "~/config/feature-flags.config";
import pathsConfig from "~/config/paths.config";

/**
 * Course layout with feature flag protection.
 * When the enableCourses flag is disabled, redirects to /home dashboard.
 * This provides a friendly UX for users who may have bookmarked course pages.
 */
export default function CourseLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	if (!featureFlagsConfig.enableCourses) {
		redirect(pathsConfig.app.home);
	}

	return <>{children}</>;
}
