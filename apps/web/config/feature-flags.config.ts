import { z } from "zod";

type LanguagePriority = "user" | "application";

const FeatureFlagsSchema = z.object({
	enableThemeToggle: z
		.boolean()
		.describe("Enable theme toggle in the user interface."),
	enableAccountDeletion: z
		.boolean()
		.describe("Enable personal account deletion."),
	enableTeamDeletion: z.boolean().describe("Enable team deletion."),
	enableTeamAccounts: z.boolean().describe("Enable team accounts."),
	enableTeamCreation: z.boolean().describe("Enable team creation."),
	enablePersonalAccountBilling: z
		.boolean()
		.describe("Enable personal account billing."),
	enableTeamAccountBilling: z
		.boolean()
		.describe("Enable team account billing."),
	languagePriority: z
		.enum(["user", "application"])
		.describe(
			`If set to user, use the user's preferred language. If set to application, use the application's default language.`,
		)
		.default("application"),
	enableNotifications: z
		.boolean()
		.describe("Enable notifications functionality"),
	realtimeNotifications: z
		.boolean()
		.describe("Enable realtime for the notifications functionality"),
	enableVersionUpdater: z.boolean().describe("Enable version updater"),
	/**
	 * Enable Course and Assessment features.
	 * Defaults to false for alpha testing - explicitly set to true to show courses.
	 * Can be overridden at runtime via database (public.config.enable_courses).
	 */
	enableCourses: z
		.boolean()
		.describe("Enable Course and Assessment features in the UI."),
});

const featuresFlagConfig = FeatureFlagsSchema.parse({
	enableThemeToggle: getBoolean(
		process.env.NEXT_PUBLIC_ENABLE_THEME_TOGGLE,
		true,
	),
	enableAccountDeletion: getBoolean(
		process.env.NEXT_PUBLIC_ENABLE_PERSONAL_ACCOUNT_DELETION,
		false,
	),
	enableTeamDeletion: getBoolean(
		process.env.NEXT_PUBLIC_ENABLE_TEAM_ACCOUNTS_DELETION,
		false,
	),
	enableTeamAccounts: getBoolean(
		process.env.NEXT_PUBLIC_ENABLE_TEAM_ACCOUNTS,
		true,
	),
	enableTeamCreation: getBoolean(
		process.env.NEXT_PUBLIC_ENABLE_TEAM_ACCOUNTS_CREATION,
		true,
	),
	enablePersonalAccountBilling: getBoolean(
		process.env.NEXT_PUBLIC_ENABLE_PERSONAL_ACCOUNT_BILLING,
		false,
	),
	enableTeamAccountBilling: getBoolean(
		process.env.NEXT_PUBLIC_ENABLE_TEAM_ACCOUNTS_BILLING,
		false,
	),
	languagePriority: process.env
		.NEXT_PUBLIC_LANGUAGE_PRIORITY as LanguagePriority,
	enableNotifications: getBoolean(
		process.env.NEXT_PUBLIC_ENABLE_NOTIFICATIONS,
		true,
	),
	realtimeNotifications: getBoolean(
		process.env.NEXT_PUBLIC_REALTIME_NOTIFICATIONS,
		false,
	),
	enableVersionUpdater: getBoolean(
		process.env.NEXT_PUBLIC_ENABLE_VERSION_UPDATER,
		false,
	),
	enableCourses: getBoolean(process.env.NEXT_PUBLIC_ENABLE_COURSES, false),
} satisfies z.infer<typeof FeatureFlagsSchema>);

export default featuresFlagConfig;

function getBoolean(value: unknown, defaultValue: boolean) {
	if (typeof value === "string") {
		return value === "true";
	}

	return defaultValue;
}
