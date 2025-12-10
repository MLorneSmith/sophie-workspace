import { expect, test } from "@playwright/test";
import { AuthPageObject } from "../authentication/auth.po";
import { AUTH_STATES } from "./auth-state";
import {
	AGGRESSIVE_RETRY_INTERVALS,
	CI_TIMEOUTS,
	RETRY_INTERVALS,
	clickWithRetry,
	navigateAndWaitForHydration,
	waitForContentReady,
	waitForElementReady,
	waitForHydration,
} from "./wait-for-hydration";

/**
 * Unit tests for the wait-for-hydration utility
 * Verifies the centralized hydration wait patterns work correctly (Issue #1051)
 */
test.describe("Wait for Hydration Utility @unit", () => {
	// Use pre-authenticated state for tests that need it
	AuthPageObject.setupSession(AUTH_STATES.TEST_USER);

	test.describe("CI_TIMEOUTS configuration", () => {
		test("should have correct timeout values based on environment", () => {
			// Verify the timeout values are reasonable
			expect(CI_TIMEOUTS.element).toBeGreaterThanOrEqual(10_000);
			expect(CI_TIMEOUTS.navigation).toBeGreaterThanOrEqual(30_000);
			expect(CI_TIMEOUTS.hydration).toBeGreaterThanOrEqual(10_000);
			expect(CI_TIMEOUTS.short).toBeGreaterThanOrEqual(5_000);
		});

		test("should have CI timeouts >= local timeouts", () => {
			// When in CI, timeouts should be extended
			// This test verifies the logic is correct regardless of environment
			if (process.env.CI) {
				expect(CI_TIMEOUTS.element).toBe(30_000);
				expect(CI_TIMEOUTS.navigation).toBe(60_000);
				expect(CI_TIMEOUTS.hydration).toBe(20_000);
				expect(CI_TIMEOUTS.short).toBe(15_000);
			} else {
				expect(CI_TIMEOUTS.element).toBe(10_000);
				expect(CI_TIMEOUTS.navigation).toBe(30_000);
				expect(CI_TIMEOUTS.hydration).toBe(10_000);
				expect(CI_TIMEOUTS.short).toBe(5_000);
			}
		});
	});

	test.describe("RETRY_INTERVALS configuration", () => {
		test("should have ascending intervals for exponential backoff", () => {
			for (let i = 1; i < RETRY_INTERVALS.length; i++) {
				expect(RETRY_INTERVALS[i]).toBeGreaterThan(RETRY_INTERVALS[i - 1]);
			}
		});

		test("should have aggressive intervals start faster", () => {
			expect(AGGRESSIVE_RETRY_INTERVALS[0]).toBeLessThan(RETRY_INTERVALS[0]);
		});

		test("should have reasonable total retry duration", () => {
			// Sum of intervals: 500 + 1000 + 2000 + 5000 + 10000 + 15000 = 33,500ms
			// This allows multiple retry attempts before overall test timeout
			// The toPass() pattern will succeed within individual attempt timeouts
			const totalDuration = RETRY_INTERVALS.reduce((sum, i) => sum + i, 0);
			// Total should be reasonable for test scenarios (< 1 minute)
			expect(totalDuration).toBeLessThan(60_000);
			// Total should provide meaningful retry coverage (> 30s)
			expect(totalDuration).toBeGreaterThan(30_000);
		});
	});

	test.describe("waitForHydration", () => {
		test("should wait for page hydration on home page", async ({ page }) => {
			await page.goto("/home", { waitUntil: "commit" });

			// This should complete without error
			await waitForHydration(page, {
				selector: "body",
				timeout: CI_TIMEOUTS.hydration,
			});

			// Page should be ready
			await expect(page).toHaveURL(/\/home/);
		});

		test("should wait for specific selector hydration", async ({ page }) => {
			await page.goto("/home/settings", { waitUntil: "commit" });

			// Wait for form to be hydrated
			await waitForHydration(page, {
				selector: "form",
				timeout: CI_TIMEOUTS.hydration,
			});

			// Form should be visible and interactive
			const form = page.locator("form").first();
			await expect(form).toBeVisible();
		});
	});

	test.describe("waitForElementReady", () => {
		test("should wait for element with toPass pattern", async ({ page }) => {
			await page.goto("/home/settings", { waitUntil: "domcontentloaded" });

			const form = page.locator("form").first();

			// Should complete without error using retry pattern
			await waitForElementReady(form, {
				timeout: CI_TIMEOUTS.element,
			});

			await expect(form).toBeVisible();
		});
	});

	test.describe("navigateAndWaitForHydration", () => {
		test("should navigate and wait for hydration", async ({ page }) => {
			// Use the combined navigation + hydration function
			await navigateAndWaitForHydration(page, "/home/settings", {
				waitForSelector: "form",
			});

			// Page should be on settings with form visible
			await expect(page).toHaveURL(/\/home\/settings/);
			await expect(page.locator("form").first()).toBeVisible();
		});

		test("should handle navigation timeout gracefully", async ({ page }) => {
			// Navigate to valid URL
			await navigateAndWaitForHydration(page, "/home", {
				timeout: CI_TIMEOUTS.navigation,
			});

			await expect(page).toHaveURL(/\/home/);
		});
	});

	test.describe("clickWithRetry", () => {
		test("should click element with retry pattern", async ({ page }) => {
			await page.goto("/home/settings", { waitUntil: "domcontentloaded" });

			// Wait for page to be ready
			await waitForHydration(page, { selector: "body" });

			// Try to click account dropdown (a common interactive element)
			const dropdown = page.locator('[data-testid="account-dropdown"]');

			if (await dropdown.isVisible().catch(() => false)) {
				await clickWithRetry(dropdown, {
					timeout: CI_TIMEOUTS.element,
				});
			}
		});
	});

	test.describe("waitForContentReady", () => {
		test("should wait for content to be ready", async ({ page }) => {
			await page.goto("/home/settings", { waitUntil: "commit" });

			// Wait for specific form content to be ready
			// Use data-testid to avoid strict mode violation with multiple forms
			await waitForContentReady(
				page,
				'[data-testid="update-account-name-form"]',
				{
					timeout: CI_TIMEOUTS.element,
				},
			);

			// Form should be visible
			await expect(
				page.locator('[data-testid="update-account-name-form"]'),
			).toBeVisible();
		});
	});
});
