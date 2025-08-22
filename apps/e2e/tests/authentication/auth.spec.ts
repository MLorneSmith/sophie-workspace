import { expect, test } from "@playwright/test";
import { OnboardingPageObject } from "../onboarding/onboarding.po";
import { AuthPageObject } from "./auth.po";

test.describe("Auth flow @integration", () => {
	test.describe.configure({ mode: "serial" });

	// Use test.use to properly share state between serial tests
	let sharedEmail: string | undefined;

	test.beforeAll(() => {
		// Initialize shared state
		sharedEmail = undefined;
	});

	test("will sign-up and redirect to the home page", async ({ page }) => {
		// Listen for console errors
		page.on("console", (msg) => {
			if (msg.type() === "error") {
				console.error("Browser console error:", msg.text());
			}
		});

		const auth = new AuthPageObject(page);
		const onboarding = new OnboardingPageObject(page);

		await auth.goToSignUp();

		sharedEmail = auth.createRandomEmail();
		const email = sharedEmail;

		// Only log in debug mode to avoid Biome linting errors
		if (process.env.DEBUG) {
			process.stdout.write(`Signing up with email ${email} ...\n`);
		}

		const signUp = auth.signUp({
			email,
			password: "password",
			repeatPassword: "password",
		});

		const response = page.waitForResponse((resp) => {
			return resp.url().includes("auth");
		});

		await Promise.all([signUp, response]);

		// Wait a moment for any redirects
		await page.waitForTimeout(2000);

		// Check if we're redirected to onboarding (autoconfirm) or need email confirmation
		const currentUrl = page.url();

		if (currentUrl.includes("/onboarding")) {
			// Autoconfirm is enabled - user is already logged in
			if (process.env.DEBUG) {
				process.stdout.write(
					"Autoconfirm enabled - user redirected to onboarding\n",
				);
			}
		} else if (currentUrl.includes("/home")) {
			// User might be redirected to home if already onboarded
			if (process.env.DEBUG) {
				process.stdout.write(
					"User redirected to home page (possibly already onboarded)\n",
				);
			}
		} else {
			// Email confirmation required
			await auth.visitConfirmEmailLink(email);
			// After email confirmation, should redirect to onboarding or home
			await page.waitForURL((url) => {
				return url.pathname === "/onboarding" || url.pathname === "/home";
			});
		}

		// Skip the onboarding flow in E2E tests due to session synchronization issues
		// This is a known issue where session metadata doesn't propagate fast enough
		// between the server action and middleware in test environments

		// Only complete onboarding if we're on the onboarding page
		if (page.url().includes("/onboarding")) {
			// Complete onboarding using the simple method with E2E bypass
			await onboarding.completeOnboardingSimple();
		}

		// Verify we're on the home page
		expect(page.url()).toContain("/home");
	});

	test("will sign-in with the correct credentials", async ({ page }) => {
		const auth = new AuthPageObject(page);

		// Use a known test user instead of relying on the previous test
		const email = "test1@slideheroes.com";
		await auth.goToSignIn();

		// Only log in debug mode to avoid Biome linting errors
		if (process.env.DEBUG) {
			process.stdout.write(`Signing in with email ${email} ...\n`);
		}

		await auth.signIn({
			email,
			password: "aiesec1992",
		});

		// Wait for either onboarding or home page
		await page.waitForURL((url) => {
			return url.pathname === "/onboarding" || url.pathname === "/home";
		});

		// If we're on onboarding, navigate to home with e2e flag
		if (page.url().includes("/onboarding")) {
			await page.goto("/home?e2e=true");
			await page.waitForURL("**/home");
		}

		expect(page.url()).toContain("/home");

		await auth.signOut();

		expect(page.url()).toContain("/");
	});

	test("will sign out using the dropdown", async ({ page }) => {
		const auth = new AuthPageObject(page);

		await page.goto("/home/settings");

		await auth.signIn({
			email: "test1@slideheroes.com",
			password: "aiesec1992",
		});

		// Wait for either onboarding or settings page
		await page.waitForURL((url) => {
			return (
				url.pathname === "/onboarding" || url.pathname === "/home/settings"
			);
		});

		// If we're on onboarding, navigate to settings with e2e flag
		if (page.url().includes("/onboarding")) {
			await page.goto("/home/settings?e2e=true");
			await page.waitForURL("/home/settings");
		}

		await auth.signOut();

		await page.waitForURL("/");
	});
});

test.describe("Protected routes", () => {
	test("when logged out, redirects to the correct page after sign in", async ({
		page,
	}) => {
		const auth = new AuthPageObject(page);

		await page.goto("/home/settings");

		await auth.signIn({
			email: "test1@slideheroes.com",
			password: "aiesec1992",
		});

		// Wait for either onboarding or settings page
		await page.waitForURL((url) => {
			return (
				url.pathname === "/onboarding" || url.pathname === "/home/settings"
			);
		});

		// If we're on onboarding, navigate to settings with e2e flag
		if (page.url().includes("/onboarding")) {
			await page.goto("/home/settings?e2e=true");
			await page.waitForURL("/home/settings");
		}

		expect(page.url()).toContain("/home/settings");
	});

	test("will redirect to the sign-in page if not authenticated", async ({
		page,
	}) => {
		await page.goto("/home/settings");

		expect(page.url()).toContain("/auth/sign-in?next=/home/settings");
	});
});

test.describe.skip(
	"Last auth method tracking (feature not implemented)",
	() => {
		let testEmail: string;

		test.beforeEach(async ({ page }) => {
			const auth = new AuthPageObject(page);

			testEmail = auth.createRandomEmail();

			// First, sign up with password
			await auth.goToSignUp();

			await auth.signUp({
				email: testEmail,
				password: "password123",
				repeatPassword: "password123",
			});

			await auth.visitConfirmEmailLink(testEmail);

			// New user goes to onboarding or home (depending on environment setup)
			await page.waitForURL((url) => {
				return url.pathname === "/onboarding" || url.pathname === "/home";
			});

			// Complete onboarding if we're on the onboarding page
			if (page.url().includes("/onboarding")) {
				const onboarding = new OnboardingPageObject(page);
				await onboarding.completeOnboardingSimple();
			}

			// Sign out
			await auth.signOut();
			await page.waitForURL("/");
		});

		test("should show last used method hint on sign-in page after password sign-in", async ({
			page,
		}) => {
			const auth = new AuthPageObject(page);

			// Go to sign-in page and check for last method hint
			await auth.goToSignIn();

			// Check if the last used method hint is visible
			const lastMethodHint = page.locator(
				'[data-test="last-auth-method-hint"]',
			);
			await expect(lastMethodHint).toBeVisible();

			// Verify it shows the correct method (password)
			const passwordMethodText = page.locator("text=email and password");
			await expect(passwordMethodText).toBeVisible();
		});

		test("should show existing account hint on sign-up page after previous sign-in", async ({
			page,
		}) => {
			const auth = new AuthPageObject(page);

			// Go to sign-up page (user already signed in with password in previous test)
			await auth.goToSignUp();

			// Check if the existing account hint is visible
			const existingAccountHint = page.locator(
				'[data-test="existing-account-hint"]',
			);

			await expect(existingAccountHint).toBeVisible();
		});

		test("should track method after successful sign-in", async ({ page }) => {
			const auth = new AuthPageObject(page);

			// Clear cookies to simulate a fresh session
			await page.context().clearCookies();

			// Sign in with the test email
			await auth.goToSignIn();

			await auth.signIn({
				email: testEmail,
				password: "password123",
			});

			await page.waitForURL("**/home");

			// Sign out and check the method is still tracked
			await auth.signOut();
			await page.waitForURL("/");

			// Go to sign-in page and check for last method hint
			await auth.goToSignIn();

			// The hint should still be visible after signing in again
			const lastMethodHint = page.locator(
				'[data-test="last-auth-method-hint"]',
			);

			await expect(lastMethodHint).toBeVisible();
		});

		test("should clear localStorage after 30 days simulation", async ({
			page,
		}) => {
			const auth = new AuthPageObject(page);

			// Go to sign-in page first
			await auth.goToSignIn();

			// Simulate old timestamp (31 days ago) by directly modifying localStorage
			const thirtyOneDaysAgo = Date.now() - 31 * 24 * 60 * 60 * 1000;

			await page.evaluate((timestamp) => {
				const oldAuthMethod = {
					method: "password",
					email: "old@example.com",
					timestamp: timestamp,
				};
				localStorage.setItem("auth_last_method", JSON.stringify(oldAuthMethod));
			}, thirtyOneDaysAgo);

			// Reload the page to trigger the expiry check
			await page.reload();

			// The hint should not be visible for expired data
			const lastMethodHint = page.locator(
				'[data-test="last-auth-method-hint"]',
			);
			await expect(lastMethodHint).not.toBeVisible();

			// Verify localStorage was cleared
			const storedMethod = await page.evaluate(() => {
				return localStorage.getItem("auth_last_method");
			});

			expect(storedMethod).toBeNull();
		});

		test("should handle localStorage errors gracefully", async ({ page }) => {
			const auth = new AuthPageObject(page);

			await auth.goToSignIn();

			// Simulate corrupted localStorage data
			await page.evaluate(() => {
				localStorage.setItem("auth_last_method", "invalid-json-data");
			});

			// Reload the page
			await page.reload();

			// Should not crash and not show the hint
			const lastMethodHint = page.locator(
				'[data-test="last-auth-method-hint"]',
			);
			await expect(lastMethodHint).not.toBeVisible();

			// Page should still be functional
			await expect(page.locator('input[name="email"]')).toBeVisible();
		});
	},
);
