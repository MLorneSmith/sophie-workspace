import { redirect } from "next/navigation";

import featureFlagsConfig from "~/config/feature-flags.config";
import pathsConfig from "~/config/paths.config";

/**
 * Assessment layout with feature flag protection.
 * When the enableCourses flag is disabled, redirects to /home dashboard.
 * This provides a friendly UX for users who may have bookmarked assessment pages.
 */
export default function AssessmentLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	if (!featureFlagsConfig.enableCourses) {
		redirect(pathsConfig.app.home);
	}

	return <>{children}</>;
}
