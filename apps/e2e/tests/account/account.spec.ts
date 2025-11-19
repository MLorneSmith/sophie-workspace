import { expect, test } from "@playwright/test";

import { AuthPageObject } from "../authentication/auth.po";
import { AUTH_STATES } from "../utils/auth-state";
import { AccountPageObject } from "./account.po";

test.describe("Account Settings", () => {
	// Use pre-authenticated state from global setup
	AuthPageObject.setupSession(AUTH_STATES.TEST_USER);

	let account: AccountPageObject;

	test.beforeEach(async ({ page }) => {
		account = new AccountPageObject(page);

		// Navigate to settings page
		await page.goto("/home/settings", { waitUntil: "networkidle" });
	});

	test("user can update their profile name", async ({ page }) => {
		const name = "John Doe";

		const request = account.updateName(name);

		const response = page.waitForResponse((resp) => {
			return resp.url().includes("accounts");
		});

		await Promise.all([request, response]);

		await expect(account.getProfileName()).toHaveText(name);
	});

	test.skip("user can update their email", async ({ page: _page }) => {
		// SKIPPED: Requires email confirmation which tests can't access
		const email = account.auth.createRandomEmail();

		await account.updateEmail(email);
	});

	test("user can update their password", async ({ page }) => {
		const password = (Math.random() * 100000).toString();

		const request = account.updatePassword(password);

		const response = page.waitForResponse((resp) => {
			return resp.url().includes("auth/v1/user");
		});

		await Promise.all([request, response]);

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

		await page.goto("/auth/sign-in", { waitUntil: "networkidle" });

		// sign in will now fail
		await auth.signIn({
			email,
			password: process.env.E2E_TEST_USER_PASSWORD || "",
		});

		await expect(
			page.locator('[data-test="auth-error-message"]'),
		).toBeVisible();
	});
});
