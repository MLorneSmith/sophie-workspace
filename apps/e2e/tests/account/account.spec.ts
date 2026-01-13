import { AuthPageObject } from "../authentication/auth.po";
import { AUTH_STATES } from "../utils/auth-state";
import { expect, test } from "../utils/base-test";
import { restoreOriginalPassword } from "../utils/database-utilities";
import { AccountPageObject } from "./account.po";

test.describe("Account Settings", () => {
	// Explicitly use global test timeout from playwright.config.ts (180s for CI)
	// This ensures multi-operation tests (profile name + password updates) have enough time
	// Each operation requires ~60s, plus setup/cleanup overhead
	// Reference: Issue #1139 (diagnosis), Issue #1140 (timeout fix)
	// Note: Do NOT set timeout here - let playwright.config.ts handle it globally

	// Use pre-authenticated state from global setup
	AuthPageObject.setupSession(AUTH_STATES.TEST_USER);

	let account: AccountPageObject;

	test.beforeEach(async ({ page }) => {
		account = new AccountPageObject(page);

		// Navigate to settings page
		await page.goto("/home/settings", { waitUntil: "domcontentloaded" });

		// Wait for form to be loaded
		await page.waitForSelector("form", { timeout: 10000 });
	});

	// Restore test user password after each test to ensure idempotent test runs
	// This is critical for the password update test which changes the password
	test.afterEach(async () => {
		try {
			const restored = await restoreOriginalPassword("test1@slideheroes.com");
			if (restored) {
				console.log(
					"[account.spec.ts] Password restored for test1@slideheroes.com",
				);
			}
		} catch (error) {
			// Log warning but don't fail the test - the restoration is best-effort
			console.warn(
				"[account.spec.ts] Failed to restore password:",
				error instanceof Error ? error.message : error,
			);
		}
	});

	test("user can update their profile name", async ({ page }) => {
		// Increase test timeout to 150s for this complex operation
		// The profile update involves: hydration (20s) + input (10s) + API wait (30s) + validation (30s)
		// Total: ~90s needed, plus buffer = 150s
		// Reference: Issue #1140 - timeout architecture fix
		test.setTimeout(150000);

		const name = "John Doe";

		// Set up response listener BEFORE triggering the action
		// Note: no explicit timeout - inherits from test.setTimeout()
		const responsePromise = page.waitForResponse((resp) => {
			return (
				resp.url().includes("accounts") && resp.request().method() === "PATCH"
			);
		});

		// Trigger the update
		await account.updateName(name);

		// Wait for the API response
		const response = await responsePromise;
		// Supabase returns 200 with data or 204 (No Content) for successful updates
		expect([200, 204]).toContain(response.status());

		// Wait for the dropdown to update with the new name
		await expect(account.getProfileName()).toHaveText(name, {
			timeout: 10000,
		});
	});

	test.skip("user can update their email", async ({ page: _page }) => {
		// SKIPPED: Requires email confirmation which tests can't access
		const email = account.auth.createRandomEmail();

		await account.updateEmail(email);
	});

	test("user can update their password", async ({ page }) => {
		// Increase test timeout to 180s for this complex operation
		// The password update involves: hydration (20s) + input (10s) + API wait (30s) + validation (30s) + reload (30s)
		// Total: ~120s needed, plus buffer = 180s
		// Reference: Issue #1140 - timeout architecture fix
		test.setTimeout(180000);

		// Generate a valid password (at least 8 characters)
		const password = `Test${Math.random().toString(36).substring(2, 10)}!`;

		// Set up response listener BEFORE triggering the action
		// Note: no explicit timeout - inherits from test.setTimeout()
		const responsePromise = page.waitForResponse((resp) => {
			return (
				resp.url().includes("auth/v1/user") && resp.request().method() === "PUT"
			);
		});

		// Trigger the update
		await account.updatePassword(password);

		// Wait for the API response
		const response = await responsePromise;
		expect(response.status()).toBe(200);

		await page.context().clearCookies();

		await page.reload();
	});
});

test.describe("Account Deletion", () => {
	test.skip("user can delete their own account", async ({ page }) => {
		// SKIPPED: Requires OTP verification which doesn't complete in test mode
		// Create a fresh user for this test since we'll be deleting it
		const auth = new AuthPageObject(page);
		const account = new AccountPageObject(page);

		const email = auth.createRandomEmail();

		await auth.bootstrapUser({
			email,
			password: process.env.E2E_TEST_USER_PASSWORD || "",
			name: "Test User",
		});

		await auth.loginAsUser({
			email,
			password: process.env.E2E_TEST_USER_PASSWORD || "",
			next: "/home/settings",
		});

		await account.deleteAccount(email);

		await page.waitForURL("/");

		await page.goto("/auth/sign-in", { waitUntil: "domcontentloaded" });

		// Wait for form to be loaded
		await page.waitForSelector('[data-testid="sign-in-email"]', {
			state: "visible",
			timeout: 10000,
		});

		// sign in will now fail
		await auth.signIn({
			email,
			password: process.env.E2E_TEST_USER_PASSWORD || "",
		});

		await expect(
			page.locator('[data-testid="auth-error-message"]'),
		).toBeVisible();
	});
});
