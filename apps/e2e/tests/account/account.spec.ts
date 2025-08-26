import { expect, type Page, test } from "@playwright/test";

import { AuthPageObject } from "../authentication/auth.po";
import { AccountPageObject } from "./account.po";

test.describe("Account Settings", () => {
	let page: Page;
	let account: AccountPageObject;
	let testEmail: string;

	test.beforeAll(async ({ browser }) => {
		page = await browser.newPage();
		account = new AccountPageObject(page);

		const setupResult = await account.setup();
		testEmail = setupResult.email;
	});

	test.beforeEach(async () => {
		// Ensure we're on the settings page for each test
		await page.goto("/home/settings");
		await page.waitForLoadState("networkidle");
		await expect(page).toHaveURL(/\/home\/settings/);
	});

	test("user can update their profile name", async () => {
		const name = "John Doe";

		// First, ensure we're on the settings page
		await page.waitForLoadState("networkidle");
		await expect(page).toHaveURL(/\/home\/settings/);

		// Fill and submit the form using the correct data-test attribute
		await page.fill('[data-test="account-display-name"]', name);

		// Click and wait for either navigation or API response
		const responsePromise = page.waitForResponse((resp) => {
			// Look for Supabase REST API response for accounts table
			return resp.url().includes("/rest/v1/accounts") && resp.status() === 204;
		});

		await page.click('[data-test="update-account-name-form"] button');

		// Wait for the API response
		await responsePromise;

		// Wait a bit for UI to update
		await page.waitForTimeout(1000);

		// Verify the name was updated in the form input
		const updatedValue = await page.inputValue(
			'[data-test="account-display-name"]',
		);
		expect(updatedValue).toBe(name);

		// Also check if it's displayed in the account dropdown (if visible)
		const dropdownName = page.locator(
			'[data-test="account-dropdown-display-name"]',
		);
		if (await dropdownName.isVisible({ timeout: 1000 })) {
			await expect(dropdownName).toContainText(name);
		}
	});

	test("user can update their email", async () => {
		const email = account.auth.createRandomEmail();

		await account.updateEmail(email);
	});

	test("user can update their password", async () => {
		const newPassword = `newpass${Math.random() * 100000}!`;

		await account.updatePassword(newPassword);

		// Clear cookies and reload to test new password
		await page.context().clearCookies();
		await page.reload();

		// Wait for redirect to auth page
		await page.waitForURL(/\/auth\/sign-in/, { timeout: 10000 });

		// Sign in with the NEW password using stored email
		const auth = new AuthPageObject(page);
		await auth.signIn({
			email: testEmail,
			password: newPassword, // Use NEW password (this was the bug!)
		});

		// Should successfully navigate to home
		await page.waitForURL(/\/home/, { timeout: 10000 });
	});
});

test.describe("Account Deletion", () => {
	test("user can delete their own account", async ({ page }) => {
		const account = new AccountPageObject(page);
		const auth = new AuthPageObject(page);

		const { email, password } = await account.setup();

		await account.deleteAccount(email);

		// Wait for network to settle after deletion
		await page.waitForLoadState("networkidle");

		// Increase timeout for redirect after account deletion
		await page.waitForURL("/", { timeout: 30000 });

		await page.goto("/auth/sign-in");

		// sign in will now fail - use the actual password from setup
		await auth.signIn({
			email,
			password, // Use actual password from setup, not hardcoded value
		});

		await expect(
			page.locator('[data-test="auth-error-message"]'),
		).toBeVisible();
	});
});
