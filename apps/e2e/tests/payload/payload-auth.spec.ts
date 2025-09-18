import { expect, test } from "@playwright/test";
import { PayloadLoginPage } from "./pages/PayloadLoginPage";

test.describe("Payload CMS - Authentication & First User Creation", () => {
	let loginPage: PayloadLoginPage;

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
		// This test will handle the first user creation flow
		const testEmail = `admin-${Date.now()}@test.com`;
		const testPassword = "Test123!@#";
		const testName = "Test Admin";

		await loginPage.createFirstUser(testEmail, testPassword, testName);

		// Verify successful creation and login
		await loginPage.expectLoginSuccess();

		// Verify we can access the admin dashboard
		await expect(page).toHaveURL(/.*\/admin(?!\/login)/);
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
		// Use environment variables or test credentials
		const email = process.env.PAYLOAD_TEST_EMAIL || "admin@example.com";
		const password = process.env.PAYLOAD_TEST_PASSWORD || "Admin123!";

		await loginPage.login(email, password);

		// Check if login was successful or if we need to create first user
		const isLoggedIn = await loginPage.checkAuthenticationState();

		if (!isLoggedIn) {
			// Try to create first user if login failed
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
		const email = process.env.PAYLOAD_TEST_EMAIL || "admin@example.com";
		const password = process.env.PAYLOAD_TEST_PASSWORD || "Admin123!";

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
		const email = process.env.PAYLOAD_TEST_EMAIL || "admin@example.com";
		const password = process.env.PAYLOAD_TEST_PASSWORD || "Admin123!";

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
		const email = process.env.PAYLOAD_TEST_EMAIL || "admin@example.com";
		const password = process.env.PAYLOAD_TEST_PASSWORD || "Admin123!";

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
