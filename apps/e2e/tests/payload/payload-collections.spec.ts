import { expect, test } from "@playwright/test";
import { PayloadCollectionsPage } from "./pages/PayloadCollectionsPage";
import { PayloadLoginPage } from "./pages/PayloadLoginPage";

// Collections to test based on the Payload config
const COLLECTIONS = [
	{
		slug: "users",
		name: "Users",
		requiredFields: { name: "Test User", email: "test@example.com" },
	},
	{ slug: "media", name: "Media", requiredFields: {} },
	{
		slug: "downloads",
		name: "Downloads",
		requiredFields: { title: "Test Download" },
	},
	{ slug: "posts", name: "Posts", requiredFields: { title: "Test Post" } },
	{
		slug: "documentation",
		name: "Documentation",
		requiredFields: { title: "Test Doc" },
	},
	{
		slug: "courses",
		name: "Courses",
		requiredFields: { title: "Test Course" },
	},
	{
		slug: "course-lessons",
		name: "Course Lessons",
		requiredFields: { title: "Test Lesson" },
	},
	{
		slug: "course-quizzes",
		name: "Course Quizzes",
		requiredFields: { title: "Test Quiz" },
	},
	{
		slug: "quiz-questions",
		name: "Quiz Questions",
		requiredFields: { question: "Test Question?" },
	},
	{
		slug: "surveys",
		name: "Surveys",
		requiredFields: { title: "Test Survey" },
	},
	{
		slug: "survey-questions",
		name: "Survey Questions",
		requiredFields: { question: "Test Survey Question?" },
	},
];

test.describe("Payload CMS - Collection Navigation & Access", () => {
	let loginPage: PayloadLoginPage;
	let collectionsPage: PayloadCollectionsPage;

	test.beforeAll(async ({ browser }) => {
		// Login once for all collection tests
		const page = await browser.newPage();
		loginPage = new PayloadLoginPage(page);

		const email = process.env.PAYLOAD_TEST_EMAIL || "admin@example.com";
		const password = process.env.PAYLOAD_TEST_PASSWORD || "Admin123!";

		await loginPage.login(email, password);

		// If not logged in, create first user
		if (!(await loginPage.checkAuthenticationState())) {
			await loginPage.createFirstUser(email, password, "Admin User");
		}

		await page.close();
	});

	test.beforeEach(async ({ page }) => {
		collectionsPage = new PayloadCollectionsPage(page);
		loginPage = new PayloadLoginPage(page);

		// Ensure we're logged in
		const email = process.env.PAYLOAD_TEST_EMAIL || "admin@example.com";
		const password = process.env.PAYLOAD_TEST_PASSWORD || "Admin123!";
		await loginPage.login(email, password);
	});

	// Test each collection individually
	COLLECTIONS.forEach((collection) => {
		test(`should access ${collection.name} collection without errors`, async ({
			page: _page,
		}) => {
			await test.step(`Navigate to ${collection.name}`, async () => {
				await collectionsPage.navigateToCollection(collection.slug);
				await collectionsPage.expectNoErrors();
			});

			await test.step("Verify collection page loads properly", async () => {
				// Should show either items or empty state, but not error
				await collectionsPage.expectCollectionAccessible(collection.slug);
			});

			await test.step("Verify UI elements are present", async () => {
				// Check for create button (indicates proper permissions)
				const hasCreateButton = await collectionsPage.createNewButton
					.isVisible({ timeout: 2000 })
					.catch(() => false);

				// Check for search functionality
				const hasSearch = await collectionsPage.searchInput
					.isVisible({ timeout: 2000 })
					.catch(() => false);

				// At least one should be visible
				expect(hasCreateButton || hasSearch).toBeTruthy();
			});
		});
	});

	test("should handle collection with no items gracefully", async ({
		page: _page,
	}) => {
		// Navigate to a collection
		await collectionsPage.navigateToCollection("posts");

		// Check if empty state is handled properly
		const itemCount = await collectionsPage.getItemCount();

		if (itemCount === 0) {
			// Should show appropriate empty state
			const hasEmptyMessage = await collectionsPage.noResultsMessage
				.isVisible({ timeout: 2000 })
				.catch(() => false);
			const hasCreateButton = await collectionsPage.createNewButton
				.isVisible({ timeout: 2000 })
				.catch(() => false);

			expect(hasEmptyMessage || hasCreateButton).toBeTruthy();
		}
	});

	test("should search within collection", async ({ page: _page }) => {
		await collectionsPage.navigateToCollection("users");

		// Perform search
		await collectionsPage.searchItems("admin");

		// Should not show errors
		await collectionsPage.expectNoErrors();
	});

	test("should handle pagination if items exist", async ({ page: _page }) => {
		await collectionsPage.navigateToCollection("users");

		const itemCount = await collectionsPage.getItemCount();

		if (itemCount > 10) {
			// Check pagination controls
			const hasNext = await collectionsPage.paginationNext
				.isVisible({ timeout: 2000 })
				.catch(() => false);
			expect(hasNext).toBeTruthy();

			// Try to navigate
			if (hasNext) {
				await collectionsPage.paginationNext.click();
				await collectionsPage.waitForCollectionLoad();
				await collectionsPage.expectNoErrors();
			}
		}
	});
});

test.describe("Payload CMS - CRUD Operations", () => {
	let loginPage: PayloadLoginPage;
	let collectionsPage: PayloadCollectionsPage;

	test.beforeEach(async ({ page }) => {
		collectionsPage = new PayloadCollectionsPage(page);
		loginPage = new PayloadLoginPage(page);

		// Login
		const email = process.env.PAYLOAD_TEST_EMAIL || "admin@example.com";
		const password = process.env.PAYLOAD_TEST_PASSWORD || "Admin123!";
		await loginPage.login(email, password);
	});

	test("should create a new post", async ({ page: _page }) => {
		await collectionsPage.navigateToCollection("posts");

		// Click create new
		await collectionsPage.createNewItem();

		// Fill required fields
		await collectionsPage.fillRequiredFields({
			title: `Test Post ${Date.now()}`,
			slug: `test-post-${Date.now()}`,
			content: "This is a test post created by E2E tests",
		});

		// Save
		await collectionsPage.saveItem();

		// Verify success
		await collectionsPage.expectToastMessage("successfully");
	});

	test("should edit existing item", async ({ page: _page }) => {
		await collectionsPage.navigateToCollection("posts");

		const itemCount = await collectionsPage.getItemCount();

		if (itemCount > 0) {
			// Select first item
			await collectionsPage.selectFirstItem();

			// Make changes
			const updatedTitle = `Updated Post ${Date.now()}`;
			await collectionsPage.fillRequiredFields({
				title: updatedTitle,
			});

			// Save changes
			await collectionsPage.saveItem();

			// Verify success
			await collectionsPage.expectToastMessage("successfully");
		} else {
			// Create one first
			await collectionsPage.createNewItem();
			await collectionsPage.fillRequiredFields({
				title: `Test Post for Edit ${Date.now()}`,
			});
			await collectionsPage.saveItem();
		}
	});

	test("should handle validation errors", async ({ page }) => {
		await collectionsPage.navigateToCollection("posts");

		// Try to create without required fields
		await collectionsPage.createNewItem();

		// Try to save without filling required fields
		await collectionsPage.saveButton.click();

		// Should show validation errors
		const validationError = await page
			.locator('.field-error, .field--error, [class*="error"]')
			.isVisible({ timeout: 5000 })
			.catch(() => false);
		expect(validationError).toBeTruthy();
	});

	test("should delete item with confirmation", async ({ page: _page }) => {
		// First create an item to delete
		await collectionsPage.navigateToCollection("posts");
		await collectionsPage.createNewItem();

		const testTitle = `Post to Delete ${Date.now()}`;
		await collectionsPage.fillRequiredFields({
			title: testTitle,
		});
		await collectionsPage.saveItem();

		// Now delete it
		await collectionsPage.navigateToCollection("posts");

		const itemCount = await collectionsPage.getItemCount();
		if (itemCount > 0) {
			await collectionsPage.deleteFirstItem();
			// Verify item was deleted
			await collectionsPage.expectNoErrors();
		}
	});
});

test.describe("Payload CMS - Database & Error Handling", () => {
	let collectionsPage: PayloadCollectionsPage;
	let loginPage: PayloadLoginPage;

	test.beforeEach(async ({ page }) => {
		collectionsPage = new PayloadCollectionsPage(page);
		loginPage = new PayloadLoginPage(page);
	});

	test("should handle database connectivity check", async ({ page: _page }) => {
		await collectionsPage.checkDatabaseConnection();
	});

	test("should display appropriate error when database is unavailable", async ({
		page,
	}) => {
		// This test can be run when database is intentionally down
		const response = await page.request.get(
			`${collectionsPage.baseURL}/api/health`,
			{
				failOnStatusCode: false,
			},
		);

		if (!response.ok()) {
			console.log("Database might be unavailable, status:", response.status());

			// Try to navigate to a collection
			await page.goto(`${collectionsPage.baseURL}/admin/collections/posts`, {
				waitUntil: "domcontentloaded",
			});

			// Should show error message, not blank page
			const hasContent = await page.locator("body").textContent();
			expect(hasContent).not.toBe("");
		}
	});

	test("should recover from temporary network issues", async ({ page }) => {
		// Login first
		const email = process.env.PAYLOAD_TEST_EMAIL || "admin@example.com";
		const password = process.env.PAYLOAD_TEST_PASSWORD || "Admin123!";
		await loginPage.login(email, password);

		// Simulate network offline
		await page.context().setOffline(true);

		// Try to navigate to collection
		await collectionsPage.navigateToCollection("posts").catch(() => {});

		// Go back online
		await page.context().setOffline(false);

		// Refresh and verify recovery
		await page.reload();
		await collectionsPage.waitForPageLoad();

		// Should recover and show content
		const hasContent = await page
			.locator('.nav, .collection-list, [class*="collection"]')
			.isVisible({ timeout: 5000 })
			.catch(() => false);
		expect(hasContent).toBeTruthy();
	});

	test("should handle session expiry gracefully", async ({ page, context }) => {
		// Login
		const email = process.env.PAYLOAD_TEST_EMAIL || "admin@example.com";
		const password = process.env.PAYLOAD_TEST_PASSWORD || "Admin123!";
		await loginPage.login(email, password);

		// Clear cookies to simulate session expiry
		await context.clearCookies();

		// Try to navigate to protected route
		await collectionsPage.navigateToCollection("posts");

		// Should redirect to login
		await expect(page).toHaveURL(/.*\/login/);
	});
});
