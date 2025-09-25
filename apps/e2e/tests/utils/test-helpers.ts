/**
 * Marks a user as onboarded by updating their user metadata
 * This is useful for tests that need to bypass the onboarding flow
 */
import type { Page } from "@playwright/test";
import { createBrowserClient } from "@supabase/ssr";

export async function markUserAsOnboarded(page: Page, userId: string) {
	// Execute in browser context to update user metadata
	await page.evaluate(async (_uid: string) => {
		const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
		const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

		if (!url || !anonKey) {
			throw new Error("Supabase environment variables are not set");
		}

		const supabase = createBrowserClient(url, anonKey);

		// Update user metadata to mark as onboarded
		const { error } = await supabase.auth.updateUser({
			data: { onboarded: true },
		});

		if (error) {
			console.error("Failed to mark user as onboarded:", error);
			throw error;
		}
	}, userId);
}
