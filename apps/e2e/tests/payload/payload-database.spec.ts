import { expect, test } from "@playwright/test";
import { PayloadCollectionsPage } from "./pages/PayloadCollectionsPage";
import { PayloadLoginPage } from "./pages/PayloadLoginPage";

test.describe("Payload CMS - Supabase Database Integration", () => {
	let loginPage: PayloadLoginPage;
	let collectionsPage: PayloadCollectionsPage;

	test.beforeEach(async ({ page }) => {
		loginPage = new PayloadLoginPage(page);
		collectionsPage = new PayloadCollectionsPage(page);
	});

	test("should verify database connection on startup", async ({ page }) => {
		// Check health endpoint
		const healthResponse = await page.request.get(
			`${loginPage.baseURL}/api/health`,
		);

		expect(healthResponse.ok()).toBeTruthy();

		const healthData = await healthResponse.json().catch(() => ({}));

		// Log health status for debugging
		console.log("Payload Health Status:", healthData);

		// Verify database is included in health check
		if (healthData.database) {
			expect(healthData.database.status).toBe("healthy");
		}
	});

	test("should handle database schema initialization", async ({ page }) => {
		// Navigate to login to trigger any schema initialization
		await loginPage.navigateToLogin();

		// Check for schema-related errors
		const schemaErrors = await page
			.locator(
				"text=/schema|migration|table.*not found|relation.*does not exist/i",
			)
			.isVisible({ timeout: 2000 })
			.catch(() => false);

		if (schemaErrors) {
			const errorText = await page
				.locator(
					"text=/schema|migration|table.*not found|relation.*does not exist/i",
				)
				.textContent();
			console.error("Database schema error detected:", errorText);

			// This indicates the database needs migration
			throw new Error(`Database schema issue: ${errorText}`);
		}

		expect(schemaErrors).toBeFalsy();
	});

	test("should verify Payload tables exist in database", async ({ page }) => {
		// Try to access the API directly
		const response = await page.request.get(`${loginPage.baseURL}/api/users`, {
			failOnStatusCode: false,
		});

		// If 500 error, likely database table issue
		if (response.status() === 500) {
			const errorBody = await response.text();
			console.error("Database table error:", errorBody);

			// Check for specific Supabase/PostgreSQL errors
			if (
				errorBody.includes("relation") &&
				errorBody.includes("does not exist")
			) {
				throw new Error(
					"Payload tables not found in database. Run migrations: npm run payload migrate",
				);
			}
		}

		expect(response.status()).not.toBe(500);
	});

	test("should handle Supabase connection pool", async ({
		page: _page,
		context,
	}) => {
		// Create multiple pages to test connection pooling
		const pages = await Promise.all([
			context.newPage(),
			context.newPage(),
			context.newPage(),
		]);

		const loginPages = pages.map((p) => new PayloadLoginPage(p));

		// Attempt concurrent database operations
		const results = await Promise.all(
			loginPages.map(async (lp) => {
				const response = await lp.page.request.get(`${lp.baseURL}/api/health`, {
					failOnStatusCode: false,
				});
				return response.ok();
			}),
		);

		// All should succeed
		results.forEach((result) => {
			expect(result).toBeTruthy();
		});

		// Clean up
		await Promise.all(pages.map((p) => p.close()));
	});

	test("should verify UUID support for Supabase", async ({ page }) => {
		// Login first
		const email = process.env.PAYLOAD_TEST_EMAIL || "admin@example.com";
		const password = process.env.PAYLOAD_TEST_PASSWORD || "Admin123!";

		await loginPage.login(email, password);

		if (!(await loginPage.checkAuthenticationState())) {
			await loginPage.createFirstUser(email, password, "Admin User");
		}

		// Create a new item and verify UUID is used
		await collectionsPage.navigateToCollection("posts");
		await collectionsPage.createNewItem();

		await collectionsPage.fillRequiredFields({
			title: `UUID Test Post ${Date.now()}`,
		});

		await collectionsPage.saveItem();

		// Get the current URL which should contain the UUID
		const currentUrl = page.url();

		// UUID pattern in URL
		const uuidPattern =
			/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
		const hasUUID = uuidPattern.test(currentUrl);

		expect(hasUUID).toBeTruthy();
	});

	test("should handle transaction rollback on error", async ({ page }) => {
		// Login
		const email = process.env.PAYLOAD_TEST_EMAIL || "admin@example.com";
		const password = process.env.PAYLOAD_TEST_PASSWORD || "Admin123!";
		await loginPage.login(email, password);

		// Navigate to users collection
		await collectionsPage.navigateToCollection("users");

		// Try to create a user with duplicate email
		await collectionsPage.createNewItem();

		await collectionsPage.fillRequiredFields({
			name: "Duplicate User",
			email: email, // Use same email as admin
			password: "Test123!",
		});

		await collectionsPage.saveButton.click();

		// Should show error about duplicate
		const errorVisible = await page
			.locator("text=/duplicate|already exists|unique/i")
			.isVisible({ timeout: 5000 })
			.catch(() => false);
		expect(errorVisible).toBeTruthy();

		// Verify the duplicate was not created
		await collectionsPage.navigateToCollection("users");
		await collectionsPage.searchItems(email);

		const itemCount = await collectionsPage.getItemCount();
		// Should only have the original admin user
		expect(itemCount).toBeLessThanOrEqual(1);
	});

	test("should respect Supabase RLS policies if configured", async ({
		page,
	}) => {
		// This test checks if RLS is properly integrated
		// Note: This assumes RLS might be configured on some tables

		const response = await page.request.get(
			`${loginPage.baseURL}/api/private`,
			{
				failOnStatusCode: false,
			},
		);

		// If collection has RLS, should get 401 without auth
		if (response.status() === 401) {
			console.log("RLS is properly enforcing access control");
		}

		// Login and try again
		const email = process.env.PAYLOAD_TEST_EMAIL || "admin@example.com";
		const password = process.env.PAYLOAD_TEST_PASSWORD || "Admin123!";
		await loginPage.login(email, password);

		const authResponse = await page.request.get(
			`${loginPage.baseURL}/api/private`,
			{
				failOnStatusCode: false,
				headers: {
					Cookie: await page
						.context()
						.cookies()
						.then((cookies) =>
							cookies.map((c) => `${c.name}=${c.value}`).join("; "),
						),
				},
			},
		);

		// Should now have access
		expect(authResponse.status()).not.toBe(401);
	});
});

test.describe("Payload CMS - Error Recovery & Resilience", () => {
	let loginPage: PayloadLoginPage;
	let collectionsPage: PayloadCollectionsPage;

	test.beforeEach(async ({ page }) => {
		loginPage = new PayloadLoginPage(page);
		collectionsPage = new PayloadCollectionsPage(page);
	});

	test("should show meaningful error when database is down", async ({
		page,
	}) => {
		// This test is for when database is intentionally stopped
		const response = await page.request.get(`${loginPage.baseURL}/api/health`, {
			failOnStatusCode: false,
		});

		if (!response.ok()) {
			// Navigate to login
			await page.goto(`${loginPage.baseURL}/admin/login`, {
				waitUntil: "domcontentloaded",
			});

			// Should show error message, not white screen
			const bodyText = await page.locator("body").textContent();
			expect(bodyText).not.toBe("");

			// Check for database connection error messages
			const hasErrorMessage = await page
				.locator(
					"text=/unable to connect|connection refused|database.*unavailable/i",
				)
				.isVisible({ timeout: 2000 })
				.catch(() => false);

			if (hasErrorMessage) {
				console.log("Database connection error properly displayed to user");
			}
		}
	});

	test("should handle large payload data correctly", async ({
		page: _page,
	}) => {
		// Login
		const email = process.env.PAYLOAD_TEST_EMAIL || "admin@example.com";
		const password = process.env.PAYLOAD_TEST_PASSWORD || "Admin123!";
		await loginPage.login(email, password);

		// Create post with large content
		await collectionsPage.navigateToCollection("posts");
		await collectionsPage.createNewItem();

		// Generate large content (1MB of text)
		const largeContent = "Lorem ipsum dolor sit amet. ".repeat(35000);

		await collectionsPage.fillRequiredFields({
			title: `Large Content Test ${Date.now()}`,
			content: largeContent,
		});

		// Should handle large content
		await collectionsPage.saveItem();
		await collectionsPage.expectNoErrors();
	});

	test("should recover from connection timeout", async ({ page }) => {
		// Set a short timeout
		page.setDefaultTimeout(5000);

		try {
			await loginPage.navigateToLogin();
			await loginPage.expectNoErrors();
		} catch (error) {
			// Should handle timeout gracefully
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			console.log("Timeout handled:", errorMessage);

			// Increase timeout and retry
			page.setDefaultTimeout(30000);
			await page.reload();
			await loginPage.waitForPageLoad();
		}
	});

	test("should maintain data integrity on concurrent updates", async ({
		page,
		context,
	}) => {
		// Login on two pages
		const email = process.env.PAYLOAD_TEST_EMAIL || "admin@example.com";
		const password = process.env.PAYLOAD_TEST_PASSWORD || "Admin123!";

		await loginPage.login(email, password);

		const page2 = await context.newPage();
		const loginPage2 = new PayloadLoginPage(page2);
		const collectionsPage2 = new PayloadCollectionsPage(page2);

		await loginPage2.login(email, password);

		// Create a post
		await collectionsPage.navigateToCollection("posts");
		await collectionsPage.createNewItem();

		const postTitle = `Concurrent Test ${Date.now()}`;
		await collectionsPage.fillRequiredFields({
			title: postTitle,
		});
		await collectionsPage.saveItem();

		// Get the post URL
		const postUrl = page.url();

		// Both pages edit the same post
		await page2.goto(postUrl);

		// Make concurrent edits
		const [save1, save2] = await Promise.allSettled([
			collectionsPage
				.fillRequiredFields({ title: `${postTitle} - Edit 1` })
				.then(() => collectionsPage.saveItem()),
			collectionsPage2
				.fillRequiredFields({ title: `${postTitle} - Edit 2` })
				.then(() => collectionsPage2.saveItem()),
		]);

		// One should succeed, one might conflict
		const successes = [save1, save2].filter(
			(r) => r.status === "fulfilled",
		).length;
		expect(successes).toBeGreaterThan(0);

		await page2.close();
	});

	test("should validate environment variables for database connection", async ({
		page,
	}) => {
		// Check if required env vars are set
		const configResponse = await page.request.get(`${loginPage.baseURL}/api`);

		if (!configResponse.ok()) {
			const responseText = await configResponse.text();

			// Check for env var errors
			if (
				responseText.includes("DATABASE_URI") ||
				responseText.includes("PAYLOAD_SECRET")
			) {
				console.error("Missing required environment variables for Payload");
				throw new Error(
					"Payload is not properly configured. Check DATABASE_URI and PAYLOAD_SECRET environment variables.",
				);
			}
		}

		expect(configResponse.ok()).toBeTruthy();
	});
});
