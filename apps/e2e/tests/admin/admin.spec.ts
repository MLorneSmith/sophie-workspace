import { expect, type Page, selectors, test } from "@playwright/test";

import { AuthPageObject } from "../authentication/auth.po";
import { TeamAccountsPageObject } from "../team-accounts/team-accounts.po";

const MFA_KEY = "NHOHJVGPO3R3LKVPRMNIYLCDMBHUM2SE";

test.describe("Admin Auth flow without MFA", () => {
	test("will return a 404 for non-admin users", async ({ page }) => {
		const auth = new AuthPageObject(page);
		const password = "aiesec1992";
		const email = auth.createRandomEmail();

		// Sign up a regular user
		await page.goto("/auth/sign-up");
		await auth.signUp({
			email,
			password,
			repeatPassword: password,
		});

		// Confirm email
		await auth.visitConfirmEmailLink(email);

		// Wait for redirect to home or onboarding
		await page.waitForURL((url) => {
			return url.pathname === "/onboarding" || url.pathname === "/home";
		});

		// Navigate to admin - should get 404
		await page.goto("/admin");

		expect(page.url()).toContain("/404");
	});

	test.skip("will allow admin users to access admin without MFA", async () => {
		// Skip this test as it requires admin user setup
		// This would need a seed script or admin user creation capability
	});
});

test.describe("Admin", () => {
	// must be serial because OTP verification is not working in parallel
	test.describe.configure({ mode: "serial" });

	test.describe("Admin Dashboard", () => {
		test("displays all stat cards", async ({ page }) => {
			await goToAdmin(page);

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
		let testUserEmail: string;

		test.beforeEach(async ({ page }) => {
			selectors.setTestIdAttribute("data-test");

			// Create a new test user before each test
			testUserEmail = await createUser(page);

			await goToAdmin(page);

			// Navigate to the newly created user's account page
			// Note: We need to get the user's ID from the email - this might need adjustment
			// based on your URL structure
			await page.goto("/admin/accounts");

			// use the email as the filter text
			const filterText = testUserEmail;

			await filterAccounts(page, filterText);
			await selectAccount(page, filterText);
		});

		test("displays personal account details", async ({ page }) => {
			await expect(page.getByText("Personal Account")).toBeVisible();
			await expect(page.getByTestId("admin-ban-account-button")).toBeVisible();
			await expect(page.getByTestId("admin-impersonate-button")).toBeVisible();
			await expect(
				page.getByTestId("admin-delete-account-button"),
			).toBeVisible();
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
						response.status() === 200,
				),
			]);

			await expect(page.getByText("Banned")).toBeVisible();

			await page.context().clearCookies();

			// Verify user can't log in
			await page.goto("/auth/sign-in");

			const auth = new AuthPageObject(page);

			await auth.signIn({
				email: testUserEmail,
				password: "aiesec1992",
			});

			// Should show an error message
			await expect(
				page.locator('[data-test="auth-error-message"]'),
			).toBeVisible();
		});

		test("reactivate user flow", async ({ page }) => {
			// First ban the user
			await page.getByTestId("admin-ban-account-button").click();
			await page.fill('[placeholder="Type CONFIRM to confirm"]', "CONFIRM");
			await page.getByRole("button", { name: "Ban User" }).click();

			await expect(page.getByText("Banned")).toBeVisible();

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
						response.status() === 200,
				),
			]);

			// Verify ban badge is removed
			await expect(page.getByText("Banned")).not.toBeVisible();

			// Log out
			await page.context().clearCookies();

			// Verify user can log in again
			await page.goto("/auth/sign-in");

			const auth = new AuthPageObject(page);

			await auth.signIn({
				email: testUserEmail,
				password: "aiesec1992",
			});

			await page.waitForURL("/home");
		});

		test("impersonate user flow", async ({ page }) => {
			await page.getByTestId("admin-impersonate-button").click();
			await expect(
				page.getByRole("heading", { name: "Impersonate User" }),
			).toBeVisible();

			await page.fill('[placeholder="Type CONFIRM to confirm"]', "CONFIRM");
			await page.getByRole("button", { name: "Impersonate User" }).click();

			// Should redirect to home and be logged in as the user
			await page.waitForURL("/home");
		});

		test("delete user flow", async ({ page }) => {
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
			await page.context().clearCookies();
			await page.waitForURL("/");

			// Verify user can't log in
			await page.goto("/auth/sign-in");

			const auth = new AuthPageObject(page);

			await auth.signIn({
				email: testUserEmail,
				password: "aiesec1992",
			});

			// Should show an error message
			await expect(
				page.locator('[data-test="auth-error-message"]'),
			).toBeVisible();
		});
	});

	test.describe("Team Account Management", () => {
		test.skip(
			process.env.ENABLE_TEAM_ACCOUNT_TESTS !== "true",
			"Team account tests are disabled",
		);

		let _testUserEmail: string;
		let teamName: string;
		let slug: string;

		test.beforeEach(async ({ page }) => {
			selectors.setTestIdAttribute("data-test");

			// Create a new test user and team account
			_testUserEmail = await createUser(page, {
				afterSignIn: async () => {
					teamName = `test-${Math.random().toString(36).substring(2, 15)}`;

					const teamAccountPo = new TeamAccountsPageObject(page);
					const teamSlug = teamName.toLowerCase().replace(/ /g, "-");

					slug = teamSlug;

					await teamAccountPo.createTeam({
						teamName,
						slug,
					});
				},
			});

			await goToAdmin(page);

			await page.goto("/admin/accounts");

			await filterAccounts(page, teamName);
			await selectAccount(page, teamName);
		});

		test("displays team account details", async ({ page }) => {
			await expect(page.getByText("Team Account")).toBeVisible();
			await expect(
				page.getByTestId("admin-delete-account-button"),
			).toBeVisible();
		});

		test("delete team account flow", async ({ page }) => {
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
});

async function goToAdmin(page: Page) {
	const auth = new AuthPageObject(page);

	await page.goto("/auth/sign-in");

	await auth.signIn({
		email: "michael@slideheroes.com",
		password: "aiesec1992",
	});

	// Wait for either MFA verification or direct home redirect
	await page.waitForURL(
		(url) => {
			return url.pathname === "/auth/verify" || url.pathname === "/home";
		},
		{ timeout: 15000 }, // Increased timeout for slower environments
	);

	// If MFA is required, handle it with better error handling
	if (page.url().includes("/auth/verify")) {
		// Wait for MFA form to be fully loaded
		await page.waitForSelector("[data-input-otp]", { timeout: 5000 });
		await page.waitForTimeout(500); // Small delay to ensure form is ready

		await expect(async () => {
			await auth.submitMFAVerification(MFA_KEY);
			// Wait for response after submitting MFA
			await page
				.waitForResponse(
					(response) =>
						response.url().includes("auth") && response.status() === 200,
					{ timeout: 10000 },
				)
				.catch(() => {
					// If no response, still try to wait for navigation
				});
			await page.waitForURL("/home", { timeout: 10000 });
		}).toPass({
			timeout: 60000, // Increased timeout for MFA retries
			intervals: [
				500, 1000, 2000, 3000, 5000, 7500, 10_000, 15_000, 20_000, 25_000,
				30_000,
			],
		});
	}

	// Ensure we're on home before navigating to admin
	await page.waitForLoadState("networkidle");
	await page.goto("/admin");
	// Wait for admin page to load
	await page.waitForSelector('[data-test="admin-dashboard"], h1', {
		timeout: 10000,
	});
}

async function createUser(
	page: Page,
	params: {
		afterSignIn?: () => Promise<void>;
	} = {},
) {
	const auth = new AuthPageObject(page);
	const password = "aiesec1992";
	const email = auth.createRandomEmail();

	// sign up
	await page.goto("/auth/sign-up");

	await auth.signUp({
		email,
		password,
		repeatPassword: password,
	});

	// confirm email
	await auth.visitConfirmEmailLink(email);

	if (params.afterSignIn) {
		await params.afterSignIn();
	}

	// sign out
	await auth.signOut();
	await page.waitForURL("/");

	// return the email
	return email;
}

async function filterAccounts(page: Page, email: string) {
	await page
		.locator('[data-test="admin-accounts-table-filter-input"]')
		.first()
		.fill(email);

	await page.keyboard.press("Enter");
	await page.waitForTimeout(250);
}

async function selectAccount(page: Page, email: string) {
	await page.getByRole("link", { name: email.split("@")[0] }).click();
	await page.waitForURL(/\/admin\/accounts\/[a-z0-9-]+/);
	await page.waitForTimeout(500);
}
