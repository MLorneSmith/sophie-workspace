import { NavigationConfigSchema } from "@kit/ui/navigation-schema";
import {
	BookCheck,
	BookOpen,
	BrainIcon,
	CreditCard,
	GraduationCap,
	Home,
	Kanban,
	MessageCircle,
	User,
} from "lucide-react";
import type { z } from "zod";

import featureFlagsConfig from "~/config/feature-flags.config";
import pathsConfig from "~/config/paths.config";

const iconClasses = "w-4";

/**
 * Build navigation routes with the given enableCourses flag value.
 * This is extracted to allow dynamic route generation based on database flags.
 */
function buildRoutes(enableCourses: boolean) {
	return [
		{
			label: "common:routes.application",
			children: [
				{
					label: "common:routes.home",
					path: pathsConfig.app.home,
					Icon: <Home className={iconClasses} />,
					end: true,
				},
				enableCourses
					? {
							label: "common:routes.course",
							path: pathsConfig.app.course,
							Icon: <GraduationCap className={iconClasses} />,
						}
					: undefined,
				{
					label: "common:routes.ai",
					path: pathsConfig.app.ai,
					Icon: <BrainIcon className={iconClasses} />,
				},
				{
					label: "common:routes.kanban",
					path: pathsConfig.app.kanban,
					Icon: <Kanban className={iconClasses} />,
				},
				{
					label: "common:routes.coaching",
					path: pathsConfig.app.coaching,
					Icon: <MessageCircle className={iconClasses} />,
				},
				enableCourses
					? {
							label: "common:routes.assessment",
							path: pathsConfig.app.assessment,
							Icon: <BookCheck className={iconClasses} />,
						}
					: undefined,
				{
					label: "common:routes.library",
					path: pathsConfig.app.library,
					Icon: <BookOpen className={iconClasses} />,
				},
			].filter((route) => !!route),
		},
		{
			label: "common:routes.settings",
			children: [
				{
					label: "common:routes.profile",
					path: pathsConfig.app.personalAccountSettings,
					Icon: <User className={iconClasses} />,
				},
				featureFlagsConfig.enablePersonalAccountBilling
					? {
							label: "common:routes.billing",
							path: pathsConfig.app.personalAccountBilling,
							Icon: <CreditCard className={iconClasses} />,
						}
					: undefined,
			].filter((route) => !!route),
		},
	] satisfies z.infer<typeof NavigationConfigSchema>["routes"];
}

/**
 * Static navigation config - uses environment variable value only.
 * Use getPersonalAccountNavigationConfig() for dynamic database-aware config.
 */
export const personalAccountNavigationConfig = NavigationConfigSchema.parse({
	routes: buildRoutes(featureFlagsConfig.enableCourses),
	style: process.env.NEXT_PUBLIC_USER_NAVIGATION_STYLE,
	sidebarCollapsed: process.env.NEXT_PUBLIC_HOME_SIDEBAR_COLLAPSED,
	sidebarCollapsedStyle: process.env.NEXT_PUBLIC_SIDEBAR_COLLAPSED_STYLE,
});

/**
 * Get dynamic navigation config with database-aware feature flags.
 * Call this from Server Components to get live feature flag values.
 *
 * @param enableCourses - The live database value for the courses feature flag
 * @returns The parsed navigation config with dynamic routes
 */
export function getPersonalAccountNavigationConfig(enableCourses: boolean) {
	return NavigationConfigSchema.parse({
		routes: buildRoutes(enableCourses),
		style: process.env.NEXT_PUBLIC_USER_NAVIGATION_STYLE,
		sidebarCollapsed: process.env.NEXT_PUBLIC_HOME_SIDEBAR_COLLAPSED,
		sidebarCollapsedStyle: process.env.NEXT_PUBLIC_SIDEBAR_COLLAPSED_STYLE,
	});
}
