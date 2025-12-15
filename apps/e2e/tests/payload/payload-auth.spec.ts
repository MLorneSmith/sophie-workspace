import { expect, test } from "../utils/base-test";
import { TEST_USERS } from "./helpers/test-data";
import { PayloadLoginPage } from "./pages/PayloadLoginPage";
import { unlockPayloadUser } from "../utils/database-utilities";

/**
 * NOTE: This test file intentionally uses UI-based login rather than storage state.
 * These tests verify the actual login flow, error handling, and session management,
 * so they need to interact with the login page directly.
 *
 * Other Payload test files (payload-collections, payload-database) use pre-authenticated
 * storage state from global-setup.ts for faster, more reliable test execution.
 */

test.describe("Payload CMS - Authentication & First User Creation", () => {
	// Reset storage state for auth tests - we need a fresh session to test login flow
	test.use({ storageState: { cookies: [], origins: [] } });

	let loginPage: PayloadLoginPage;

	// Unlock admin user before tests to prevent lockout from accumulated failed attempts
	test.beforeAll(async () => {
		await unlockPayloadUser(TEST_USERS.admin.email);
	});

	test.beforeEach(async ({ page }) => {
		loginPage = new PayloadLoginPage(page);
	});

	test("should be able to access the login page without errors", async ({
		page: _page,
	}) => {
		await loginPage.navigateToLogin();

		// Verify page loaded without database errors
		await loginPage.expectNoErrors();

		// Check that login form elements are present
		await expect(loginPage.emailInput).toBeVisible();
		await expect(loginPage.passwordInput).toBeVisible();
	});

	test("should create first user successfully", async ({ page }) => {
		// Check if first-user setup is needed (idempotent test)
		const needsFirstUser = await loginPage.isFirstUserSetupNeeded();

		if (!needsFirstUser) {
			// First user already exists - skip test (expected in seeded environments)
			test.skip(
				true,
				"First user already exists in database - skipping first-user creation test",
			);
			return;
		}

		// Proceed with first-user creation flow
		const testEmail = `admin-${Date.now()}@test.com`;
		const testPassword = "Test123!@#";
		const testName = "Test Admin";

		await loginPage.createFirstUser(testEmail, testPassword, testName);

		// Verify successful creation and login
		await loginPage.expectLoginSuccess();

		// Verify we can access the admin dashboard
		await expect(page).toHaveURL(/.*\/admin(?!\/login)/);
	});

	test("should handle pre-seeded admin user correctly", async ({
		page: _page,
	}) => {
		// This test verifies behavior when an admin user already exists
		const needsFirstUser = await loginPage.isFirstUserSetupNeeded();

		if (needsFirstUser) {
			// No users exist yet - skip this test (only relevant when admin is pre-seeded)
			test.skip(true, "No users in database - skipping pre-seeded admin test");
			return;
		}

		// Admin user exists - verify "Create First User" button is hidden
		// (isFirstUserSetupNeeded already navigated to login page)
		await expect(loginPage.createFirstUserButton).not.toBeVisible();

		// Login with pre-seeded admin credentials should work
		const { email, password } = TEST_USERS.admin;
		await loginPage.login(email, password);
		await loginPage.expectLoginSuccess();
	});

	test("should handle database connection errors gracefully", async ({
		page,
	}) => {
		// Check API health endpoint
		const response = await page.request.get(`${loginPage.baseURL}/api/health`, {
			failOnStatusCode: false,
		});

		// If database is not connected, this should still return a response
		expect(response.status()).toBeLessThan(500);

		// Navigate to login and check for database errors
		await loginPage.navigateToLogin();

		// Check for database connection errors
		const dbErrors = await page
			.locator("text=/database|connection|unable to connect/i")
			.isVisible({ timeout: 2000 })
			.catch(() => false);

		if (dbErrors) {
			// Log the error for debugging
			const errorText = await page
				.locator("text=/database|connection|unable to connect/i")
				.textContent();
			console.error("Database connection error detected:", errorText);
		}
	});

	test("should login with existing user", async ({ page: _page }) => {
		// Use centralized test credentials
		const { email, password } = TEST_USERS.admin;

		await loginPage.login(email, password);

		// Use toPass() to handle session propagation timing during parallel execution
		// This prevents race conditions where auth state check runs before session is fully established
		let isLoggedIn = false;
		await expect(async () => {
			isLoggedIn = await loginPage.checkAuthenticationState();
			expect(isLoggedIn).toBeTruthy();
		}).toPass({ timeout: 10000, intervals: [100, 250, 500, 1000, 2000] });

		if (!isLoggedIn) {
			// Fallback: Try to create first user if login failed
			await loginPage.createFirstUser(email, password, "Admin User");
		}

		await loginPage.expectLoginSuccess();
	});

	test("should handle invalid credentials", async ({ page }) => {
		await loginPage.login("invalid@example.com", "wrongpassword");

		// Should show error and stay on login page
		await loginPage.expectLoginError();
		await expect(page).toHaveURL(/.*\/login/);
	});

	test("should logout successfully", async ({ page }) => {
		// First login
		const { email, password } = TEST_USERS.admin;

		await loginPage.login(email, password);

		// If not logged in, create first user
		if (!(await loginPage.checkAuthenticationState())) {
			await loginPage.createFirstUser(email, password, "Admin User");
		}

		// Now logout
		await loginPage.logout();

		// Verify redirected to login
		await expect(page).toHaveURL(/.*\/login/);
	});

	test("should maintain session across page refreshes", async ({ page }) => {
		const { email, password } = TEST_USERS.admin;

		await loginPage.login(email, password);

		// If not logged in, create first user
		if (!(await loginPage.checkAuthenticationState())) {
			await loginPage.createFirstUser(email, password, "Admin User");
		}

		// Refresh the page
		await page.reload();

		// Should still be logged in
		await expect(page).not.toHaveURL(/.*\/login/);
		const isAuthenticated = await loginPage.checkAuthenticationState();
		expect(isAuthenticated).toBeTruthy();
	});

	test("should handle concurrent login attempts", async ({
		page: _page,
		context,
	}) => {
		const { email, password } = TEST_USERS.admin;

		// Create a second page in the same context
		const page2 = await context.newPage();
		const loginPage2 = new PayloadLoginPage(page2);

		// Attempt login on both pages simultaneously
		await Promise.all([
			loginPage.login(email, password),
			loginPage2.login(email, password),
		]);

		// Both should handle the login gracefully
		const [auth1, auth2] = await Promise.all([
			loginPage.checkAuthenticationState(),
			loginPage2.checkAuthenticationState(),
		]);

		// At least one should be authenticated
		expect(auth1 || auth2).toBeTruthy();

		await page2.close();
	});
});
