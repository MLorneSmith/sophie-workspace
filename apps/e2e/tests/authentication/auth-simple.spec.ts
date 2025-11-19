import { expect, test } from "@playwright/test";
import { TEST_USERS } from "../helpers/test-users";
import { AuthPageObject } from "./auth.po";

/**
 * Simplified authentication tests that avoid portal UI issues
 * These tests focus on core authentication functionality without
 * triggering the problematic dropdown components
 */
test.describe("Authentication - Simple Tests @auth @integration", () => {
	test.describe.configure({ mode: "serial", timeout: 30000 });

	test("sign in page loads with correct elements", async ({ page }) => {
		await page.goto("/auth/sign-in", { waitUntil: "domcontentloaded" });

		// Wait for the email input to be visible first (indicates form is loaded)
		await page.waitForSelector('[data-testid="sign-in-email"]', {
			state: "visible",
			timeout: 10000,
		});

		// Verify all sign-in form elements are present
		await expect(page.locator('[data-testid="sign-in-email"]')).toBeVisible();
		await expect(
			page.locator('[data-testid="sign-in-password"]'),
		).toBeVisible();
		await expect(page.locator('[data-testid="sign-in-button"]')).toBeVisible();

		// Check for forgot password link (actual href is /auth/password-reset)
		await expect(page.locator('a[href*="password-reset"]')).toBeVisible();

		// Check for sign up link
		await expect(page.locator('a[href*="sign-up"]')).toBeVisible();
	});

	test("sign up page loads with correct elements", async ({ page }) => {
		await page.goto("/auth/sign-up", { waitUntil: "domcontentloaded" });

		// Wait for form to be loaded
		await page.waitForSelector('[data-testid="sign-up-email"]', {
			state: "visible",
			timeout: 10000,
		});

		// Verify all sign-up form elements are present
		await expect(page.locator('[data-testid="sign-up-email"]')).toBeVisible();
		await expect(
			page.locator('[data-testid="sign-up-password"]'),
		).toBeVisible();
		await expect(page.locator('[data-testid="sign-up-button"]')).toBeVisible();

		// Check for sign in link
		await expect(page.locator('a[href*="sign-in"]')).toBeVisible();
	});

	test("user can sign in with valid credentials", async ({ page }) => {
		const auth = new AuthPageObject(page);

		// Navigate to sign-in page
		await auth.goToSignIn();
		await page.waitForLoadState("domcontentloaded");

		// Sign in with test user credentials
		await auth.signIn({
			email: TEST_USERS.user1.email,
			password: TEST_USERS.user1.password,
		});

		// Wait for navigation after successful sign-in
		// We should be redirected to /home or onboarding
		await page.waitForURL(
			(url) => {
				const pathname = url.pathname;
				return pathname.includes("/home") || pathname.includes("/onboarding");
			},
			{ timeout: 30000 },
		);

		// Verify we're logged in by checking for authenticated elements
		const currentUrl = page.url();
		expect(currentUrl).toMatch(/\/(home|onboarding)/);
	});

	test("invalid credentials show error message", async ({ page }) => {
		const auth = new AuthPageObject(page);

		// Navigate to sign-in page
		await auth.goToSignIn();
		await page.waitForLoadState("domcontentloaded");

		// Try to sign in with invalid credentials
		await auth.signIn({
			email: "invalid@example.com",
			password: "wrongpassword",
		});

		// Wait for error message to appear
		await page.waitForSelector(
			'[role="alert"], .error-message, [data-testid*="error"]',
			{
				timeout: 10000,
			},
		);

		// Verify we're still on sign-in page
		await expect(page).toHaveURL(/\/auth\/sign-in/);

		// Verify error message is visible
		const errorElement = page
			.locator('[role="alert"], .error-message, [data-testid*="error"]')
			.first();
		await expect(errorElement).toBeVisible();
	});

	test("sign out clears session", async ({ page }) => {
		const auth = new AuthPageObject(page);

		// First sign in
		await auth.goToSignIn();
		await auth.signIn({
			email: TEST_USERS.user1.email,
			password: TEST_USERS.user1.password,
		});

		// Wait for successful sign-in
		await page.waitForURL(
			(url) => {
				const pathname = url.pathname;
				return pathname.includes("/home") || pathname.includes("/onboarding");
			},
			{ timeout: 30000 },
		);

		// Now sign out using the simplified method (avoiding portal UI)
		await auth.signOut();

		// Wait for sign out to complete and redirect
		await page.waitForURL("/", { timeout: 10000 });

		// Verify we're on the homepage (not authenticated)
		await expect(page).toHaveURL("/");

		// Verify sign in link is visible (indicates logged out state)
		await expect(page.getByRole("link", { name: /sign in/i })).toBeVisible();
	});

	test("password reset link navigates correctly", async ({ page }) => {
		await page.goto("/auth/sign-in", { waitUntil: "domcontentloaded" });

		// Wait for form to be loaded
		await page.waitForSelector('[data-testid="sign-in-email"]', {
			state: "visible",
			timeout: 10000,
		});

		// Click forgot password link (actual href is /auth/password-reset)
		const forgotPasswordLink = page.locator('a[href*="password-reset"]');
		await expect(forgotPasswordLink).toBeVisible();
		await forgotPasswordLink.click();

		// Should navigate to password reset page
		await page.waitForURL(/\/auth\/password-reset/, { timeout: 10000 });
		await expect(page).toHaveURL(/\/auth\/password-reset/);

		// Verify password reset form is present
		await expect(
			page.locator('input[type="email"], [data-testid*="email"]').first(),
		).toBeVisible();
		await expect(
			page.locator('button[type="submit"], [data-testid*="submit"]').first(),
		).toBeVisible();
	});

	test("sign up link navigates from sign in page", async ({ page }) => {
		await page.goto("/auth/sign-in", { waitUntil: "domcontentloaded" });

		// Wait for form to be loaded
		await page.waitForSelector('[data-testid="sign-in-email"]', {
			state: "visible",
			timeout: 10000,
		});

		// Click sign up link
		const signUpLink = page.locator('a[href*="sign-up"]');
		await expect(signUpLink).toBeVisible();
		await signUpLink.click();

		// Should navigate to sign up page
		await page.waitForURL(/\/auth\/sign-up/, { timeout: 10000 });
		await expect(page).toHaveURL(/\/auth\/sign-up/);
	});

	test("sign in link navigates from sign up page", async ({ page }) => {
		await page.goto("/auth/sign-up", { waitUntil: "domcontentloaded" });

		// Wait for form to be loaded
		await page.waitForSelector('[data-testid="sign-up-email"]', {
			state: "visible",
			timeout: 10000,
		});

		// Click sign in link
		const signInLink = page.locator('a[href*="sign-in"]');
		await expect(signInLink).toBeVisible();
		await signInLink.click();

		// Should navigate to sign in page
		await page.waitForURL(/\/auth\/sign-in/, { timeout: 10000 });
		await expect(page).toHaveURL(/\/auth\/sign-in/);
	});

	test("protected routes redirect to sign-in when not authenticated", async ({
		page,
		context,
	}) => {
		// Clear any existing session
		// Note: clearCookies() is sufficient - auth state is stored in cookies
		// Attempting to clear localStorage before navigating causes SecurityError
		await context.clearCookies();
		await context.clearPermissions();

		// Try to access protected routes
		const protectedRoutes = [
			"/home",
			"/home/settings",
			"/home/team",
			"/home/billing",
		];

		for (const route of protectedRoutes) {
			// Navigate with waitUntil domcontentloaded for reliable testing
			await page.goto(route, { waitUntil: "domcontentloaded" });

			// Should be redirected to sign-in page
			// Use toPass() for reliability with proxy redirects
			await expect(async () => {
				const url = page.url();
				expect(url).toMatch(/\/auth\/sign-in/);
			}).toPass({ timeout: 15000, intervals: [500, 1000, 2000, 3000] });
		}
	});

	test("session persists across page navigation", async ({ page }) => {
		const auth = new AuthPageObject(page);

		// Sign in
		await auth.goToSignIn();
		await auth.signIn({
			email: TEST_USERS.user1.email,
			password: TEST_USERS.user1.password,
		});

		// Wait for successful sign-in
		await page.waitForURL(
			(url) => {
				const pathname = url.pathname;
				return pathname.includes("/home") || pathname.includes("/onboarding");
			},
			{ timeout: 30000 },
		);

		// Navigate to different protected pages
		await page.goto("/home", { waitUntil: "domcontentloaded" });
		await expect(page).toHaveURL(/\/home/);

		// Session should persist - no redirect to sign-in
		await page.goto("/home/settings", { waitUntil: "domcontentloaded" });
		await expect(page).toHaveURL(/\/home\/settings/);
	});
});
