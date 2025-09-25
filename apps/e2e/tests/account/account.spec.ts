import { expect, test } from "@playwright/test";

import { AuthPageObject } from "../authentication/auth.po";
import { AccountPageObject } from "./account.po";

test.describe("Account Settings", () => {
	let account: AccountPageObject;
	let email: string;

	test.beforeEach(async ({ page }) => {
		const auth = new AuthPageObject(page);

		// Use pre-existing test user from seed data
		email = process.env.E2E_TEST_USER_EMAIL || "test1@slideheroes.com";
		const password = process.env.E2E_TEST_USER_PASSWORD || "";
		if (!password) throw new Error("E2E_TEST_USER_PASSWORD not set");

		account = new AccountPageObject(page);

		await auth.loginAsUser({
			email,
			password,
			next: "/home/settings",
		});
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

		await auth.loginAsUser({ email, next: "/home/settings" });

		await account.deleteAccount(email);

		await page.waitForURL("/");

		await page.goto("/auth/sign-in");

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
