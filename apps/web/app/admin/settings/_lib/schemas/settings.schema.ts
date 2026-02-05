import { z } from "zod";

/**
 * Schema for admin settings form validation.
 * Used to validate feature flag updates from the admin settings page.
 */
export const AdminSettingsSchema = z.object({
	enableCourses: z
		.boolean()
		.describe("Show Course and Assessment features in the UI"),
});

export type AdminSettingsInput = z.infer<typeof AdminSettingsSchema>;
