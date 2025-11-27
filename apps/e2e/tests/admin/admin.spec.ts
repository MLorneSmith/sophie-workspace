import { expect, type Page, test } from "@playwright/test";

import { AuthPageObject } from "../authentication/auth.po";
import { TeamAccountsPageObject } from "../team-accounts/team-accounts.po";
import { AUTH_STATES } from "../utils/auth-state";

test.describe("Admin Auth flow without MFA", () => {
	AuthPageObject.setupSession(AUTH_STATES.OWNER_USER);

	test("will return a 404 for non-admin users", async ({ page }) => {
		await page.goto("/admin");

		expect(page.url()).toContain("/404");
	});
});

test.describe("Admin Auth flow with Super Admin but without MFA", () => {
	AuthPageObject.setupSession(AUTH_STATES.TEST_USER);

	test("will redirect to 404 for admin users without MFA", async ({ page }) => {
		await page.goto("/admin");

		expect(page.url()).toContain("/404");
	});
});

test.describe("Admin", () => {
	test.describe.configure({ mode: "serial" });

	test.describe("Admin Dashboard", () => {
		AuthPageObject.setupSession(AUTH_STATES.SUPER_ADMIN);

		test("displays all stat cards", async ({ page }) => {
			await page.goto("/admin");

			// Check all stat cards are present
			await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();

			await expect(
				page.getByRole("heading", { name: "Team Accounts" }),
			).toBeVisible();

			await expect(
				page.getByRole("heading", { name: "Paying Customers" }),
			).toBeVisible();

			await expect(page.getByRole("heading", { name: "Trials" })).toBeVisible();

			// Verify stat values are numbers
			const stats = await page.$$(".text-3xl.font-bold");

			for (const stat of stats) {
				const value = await stat.textContent();
				expect(Number.isInteger(Number(value))).toBeTruthy();
			}
		});
	});

	test.describe("Personal Account Management", () => {
		AuthPageObject.setupSession(AUTH_STATES.SUPER_ADMIN);

		let testUserEmail: string;

		test.beforeEach(async ({ page }) => {
			// Use pre-existing test user
			testUserEmail = await createUser(page);

			await page.goto("/admin/accounts");

			// use the email as the filter text
			const filterText = testUserEmail;

			await filterAccounts(page, filterText);
			await selectAccount(page, filterText);
		});

		test("displays personal account details", async ({ page }) => {
			// Wait for page to fully load
			await expect(page.getByText("Personal Account")).toBeVisible();

			// Wait for buttons to appear with a more reliable approach
			await expect(async () => {
				const banButton = await page
					.getByTestId("admin-ban-account-button")
					.isVisible();
				const impersonateButton = await page
					.getByTestId("admin-impersonate-button")
					.isVisible();
				const deleteButton = await page
					.getByTestId("admin-delete-account-button")
					.isVisible();

				expect(banButton).toBe(true);
				expect(impersonateButton).toBe(true);
				expect(deleteButton).toBe(true);
			}).toPass({
				timeout: 15000,
				intervals: [500, 1000, 2000],
			});
		});

		test("ban user flow", async ({ page }) => {
			await page.getByTestId("admin-ban-account-button").click();

			await expect(
				page.getByRole("heading", { name: "Ban User" }),
			).toBeVisible();

			// Try with invalid confirmation
			await page.fill('[placeholder="Type CONFIRM to confirm"]', "WRONG");
			await page.getByRole("button", { name: "Ban User" }).click();

			await expect(
				page.getByRole("heading", { name: "Ban User" }),
			).toBeVisible(); // Dialog should still be open

			// Confirm with correct text
			await page.fill('[placeholder="Type CONFIRM to confirm"]', "CONFIRM");

			await Promise.all([
				page.getByRole("button", { name: "Ban User" }).click(),
				page.waitForResponse(
					(response) =>
						response.url().includes("/admin/accounts") &&
						response.request().method() === "POST",
				),
			]);

			await expect(page.getByText("Banned").first()).toBeVisible();

			await page.context().clearCookies();

			// Verify user can't log in
			await page.goto("/auth/sign-in");

			const auth = new AuthPageObject(page);

			await auth.signIn({
				email: testUserEmail,
				password: process.env.E2E_TEST_USER_PASSWORD || "",
			});

			// Should show an error message
			await expect(
				page.locator('[data-testid="auth-error-message"]'),
			).toBeVisible();
		});

		test("reactivate user flow", async ({ page }) => {
			// First ban the user
			await page.getByTestId("admin-ban-account-button").click();
			await page.fill('[placeholder="Type CONFIRM to confirm"]', "CONFIRM");
			await page.getByRole("button", { name: "Ban User" }).click();

			await expect(page.getByText("Banned").first()).toBeVisible();

			// Now reactivate
			await page.getByTestId("admin-reactivate-account-button").click();

			await expect(
				page.getByRole("heading", { name: "Reactivate User" }),
			).toBeVisible();

			await page.fill('[placeholder="Type CONFIRM to confirm"]', "CONFIRM");

			await Promise.all([
				page.getByRole("button", { name: "Reactivate User" }).click(),
				page.waitForResponse(
					(response) =>
						response.url().includes("/admin/accounts") &&
						response.request().method() === "POST",
				),
			]);

			await page.waitForTimeout(250);

			// Verify ban badge is removed
			await expect(page.getByText("Banned")).not.toBeVisible();

			// Log out
			await page.context().clearCookies();

			// Verify user can log in again
			await page.goto("/auth/sign-in");

			const auth = new AuthPageObject(page);

			await auth.loginAsUser({
				email: testUserEmail,
				password: process.env.E2E_TEST_USER_PASSWORD || "",
			});
		});

		test("delete user flow", async ({ page }) => {
			const auth = new AuthPageObject(page);

			await page.getByTestId("admin-delete-account-button").click();

			await expect(
				page.getByRole("heading", { name: "Delete User" }),
			).toBeVisible();

			// Try with invalid confirmation
			await page.fill('[placeholder="Type CONFIRM to confirm"]', "WRONG");

			await page.getByRole("button", { name: "Delete" }).click();

			await expect(
				page.getByRole("heading", { name: "Delete User" }),
			).toBeVisible(); // Dialog should still be open

			// Confirm with correct text
			await page.fill('[placeholder="Type CONFIRM to confirm"]', "CONFIRM");

			await page.getByRole("button", { name: "Delete" }).click();

			// Should redirect to admin dashboard
			await page.waitForURL("/admin/accounts");

			// Log out
			await auth.signOut();
			await page.waitForURL("/");

			await auth.goToSignIn();

			await auth.signIn({
				email: testUserEmail,
				password: process.env.E2E_TEST_USER_PASSWORD || "",
			});

			// Should show an error message
			await expect(
				page.locator('[data-testid="auth-error-message"]'),
			).toBeVisible();
		});
	});

	test.describe("Impersonation", () => {
		// Use pre-authenticated super admin session - no login needed
		AuthPageObject.setupSession(AUTH_STATES.SUPER_ADMIN);

		test("can sign in as a user", async ({ page }) => {
			const filterText = await createUser(page);

			await page.goto("/admin/accounts");

			await filterAccounts(page, filterText);
			await selectAccount(page, filterText);

			await page.getByTestId("admin-impersonate-button").click();

			await expect(
				page.getByRole("heading", { name: "Impersonate User" }),
			).toBeVisible();

			await page.fill('[placeholder="Type CONFIRM to confirm"]', "CONFIRM");
			await page.getByRole("button", { name: "Impersonate User" }).click();

			// Should redirect to home and be logged in as the user
			await page.waitForURL("/home");
		});
	});
});

test.describe("Team Account Management", () => {
	test.describe.configure({ mode: "serial" });

	// Use pre-authenticated OWNER_USER state to avoid fresh login timeouts
	test.use({ storageState: AUTH_STATES.OWNER_USER });

	test.skip(
		process.env.ENABLE_TEAM_ACCOUNT_TESTS !== "true",
		"Team account tests are disabled",
	);

	let testUserEmail: string;
	let teamName: string;
	let slug: string;

	test.beforeEach(async ({ page }) => {
		const auth = new AuthPageObject(page);

		// Use pre-existing test user (already authenticated via OWNER_USER storage state)
		testUserEmail = await createUser(page);

		teamName = `test-${Math.random().toString(36).substring(2, 15)}`;

		// Already logged in as OWNER_USER (test2@slideheroes.com), skip loginAsUser
		// Go directly to home to ensure we're on the right page
		await page.goto("/home");

		const teamAccountPo = new TeamAccountsPageObject(page);
		const teamSlug = teamName.toLowerCase().replace(/ /g, "-");

		slug = teamSlug;

		await teamAccountPo.createTeam({
			teamName,
			slug,
		});

		await page.waitForTimeout(250);

		await auth.signOut();
		await page.waitForURL("/");

		await auth.loginAsSuperAdmin({
			email: process.env.E2E_ADMIN_EMAIL || "michael@slideheroes.com",
			password: process.env.E2E_ADMIN_PASSWORD || "",
		});

		await page.goto("/admin/accounts");

		await filterAccounts(page, teamName);
		await selectAccount(page, teamName);
	});

	test("delete team account flow", async ({ page }) => {
		await expect(page.getByText("Team Account")).toBeVisible();

		await page.getByTestId("admin-delete-account-button").click();

		await expect(
			page.getByRole("heading", { name: "Delete Account" }),
		).toBeVisible();

		// Try with invalid confirmation
		await page.fill('[placeholder="Type CONFIRM to confirm"]', "WRONG");
		await page.getByRole("button", { name: "Delete" }).click();
		await expect(
			page.getByRole("heading", { name: "Delete Account" }),
		).toBeVisible(); // Dialog should still be open

		// Confirm with correct text
		await page.fill('[placeholder="Type CONFIRM to confirm"]', "CONFIRM");
		await page.getByRole("button", { name: "Delete" }).click();

		// Should redirect to admin dashboard after deletion
		await expect(page).toHaveURL("/admin/accounts");
	});
});

async function createUser(_page: Page) {
	// Use pre-existing test user from seed data
	// test2@slideheroes.com is a regular user without super-admin privileges
	return "test2@slideheroes.com";
}

async function filterAccounts(page: Page, email: string) {
	await page
		.locator('[data-testid="admin-accounts-table-filter-input"]')
		.first()
		.fill(email);

	await page.keyboard.press("Enter");
	await page.waitForTimeout(250);
}

async function selectAccount(page: Page, email: string) {
	await expect(async () => {
		const link = page
			.locator("tr", { hasText: email.split("@")[0] })
			.locator("a");

		await expect(link).toBeVisible();

		await link.click();

		await page.waitForURL(/\/admin\/accounts\/[^/]+/);
	}).toPass();
}
