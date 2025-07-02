import type { Page } from "@playwright/test";

/**
 * Helper functions for authentication and onboarding in E2E tests
 */

/**
 * Marks a user as onboarded directly in the database
 * This is useful for tests that don't need to test the onboarding flow
 * @param email - The email of the user to mark as onboarded
 */
export async function markUserAsOnboarded(_email: string) {
	// This would require server-side access which isn't available in Playwright tests
	// Instead, we'll need to use the UI approach or a test API endpoint
	throw new Error(
		"Direct database access not available in E2E tests. Use completeOnboardingQuickly instead.",
	);
}

/**
 * Completes onboarding quickly with minimal interaction
 * @param page - The Playwright page object
 * @param options - Optional onboarding data
 */
export async function completeOnboardingQuickly(
	page: Page,
	options?: {
		name?: string;
		primaryGoal?: "work" | "personal" | "school";
		theme?: "light" | "dark";
	},
) {
	const defaults = {
		name: "Test User",
		primaryGoal: "work" as const,
		theme: "light" as const,
	};

	const config = { ...defaults, ...options };

	// Wait for onboarding page
	await page.waitForURL("**/onboarding", { timeout: 10000 });

	// Welcome step - just click continue
	await page.getByRole("button", { name: "Continue" }).click();

	// Profile step - enter name
	await page.fill('input[name="profile.name"]', config.name);
	await page.getByRole("button", { name: "Continue" }).click();

	// Goals step - select primary goal and required fields
	await page.selectOption('select[name="goals.primary"]', config.primaryGoal);

	// Fill required fields based on goal
	if (config.primaryGoal === "work") {
		await page.fill('input[name="goals.workDetails.role"]', "Engineer");
		await page.fill('input[name="goals.workDetails.industry"]', "Software");
	} else if (config.primaryGoal === "personal") {
		await page.fill(
			'input[name="goals.personalDetails.project"]',
			"Personal Project",
		);
	} else if (config.primaryGoal === "school") {
		await page.fill(
			'input[name="goals.schoolDetails.major"]',
			"Computer Science",
		);
	}

	// Select at least one secondary goal
	await page.getByRole("checkbox", { name: /learn/i }).check();

	await page.getByRole("button", { name: "Continue" }).click();

	// Theme step - select theme
	await page.locator(`[data-theme-option="${config.theme}"]`).click();
	await page.getByRole("button", { name: "Continue" }).click();

	// Complete step - click Get Started
	await page.getByRole("button", { name: "Get Started" }).click();

	// Wait for redirect to home with increased timeout for metadata propagation
	await page.waitForURL("**/home", { timeout: 15000 });
}

/**
 * Creates a test user that's already onboarded
 * This requires a test API endpoint to be implemented
 */
export async function createOnboardedUser(_email: string, _password: string) {
	// This would require a special test API endpoint
	throw new Error(
		"Test API endpoint for creating onboarded users not yet implemented",
	);
}

/**
 * Waits for the onboarding redirect with proper error handling
 */
export async function waitForOnboardingRedirect(
	page: Page,
	options?: { timeout?: number },
) {
	const timeout = options?.timeout ?? 10000;

	try {
		await page.waitForURL("**/onboarding", { timeout });
		return true;
	} catch (error) {
		// Check if we're already on the home page (user might be onboarded)
		if (page.url().includes("/home")) {
			return false;
		}
		throw error;
	}
}

/**
 * Helper to handle the authentication flow with onboarding
 */
export async function signUpAndOnboard(
	_page: Page,
	_options: {
		email: string;
		password: string;
		onboardingData?: {
			name?: string;
			primaryGoal?: "work" | "personal" | "school";
			theme?: "light" | "dark";
		};
	},
) {
	// This would be implemented using the auth page object
	// and the onboarding helpers above
	throw new Error(
		"Not implemented - use AuthPageObject and OnboardingPageObject",
	);
}
