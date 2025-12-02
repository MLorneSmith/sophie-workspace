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

	// No beforeAll login needed - tests use pre-authenticated storage state from global-setup.ts
	// Storage state is configured in playwright.config.ts for the "payload" project

	test.beforeEach(async ({ page }) => {
		collectionsPage = new PayloadCollectionsPage(page);
		loginPage = new PayloadLoginPage(page);
		// No login needed - storage state handles authentication
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
	let collectionsPage: PayloadCollectionsPage;

	test.beforeEach(async ({ page }) => {
		collectionsPage = new PayloadCollectionsPage(page);
		// No login needed - storage state handles authentication
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

	test("should edit existing item", async ({ page }) => {
		// Always create a fresh post first to ensure we have valid data
		await collectionsPage.navigateToCollection("posts");
		await collectionsPage.createNewItem();

		const originalTitle = `Post to Edit ${Date.now()}`;
		await collectionsPage.fillRequiredFields({
			title: originalTitle,
			content: "Original content for edit test",
		});
		await collectionsPage.saveItem();

		// Wait for redirect to edit page with UUID
		await page.waitForURL(/\/[0-9a-f-]{36}$/i, { timeout: 10000 });

		// Now edit the post we just created
		const updatedTitle = `Updated Post ${Date.now()}`;
		await page.fill('input[name="title"]', updatedTitle);

		// Save changes
		await collectionsPage.saveItem();

		// Verify success
		await collectionsPage.expectToastMessage("successfully");
	});

	test("should handle validation errors", async ({ page }) => {
		// Navigate to users collection for testing validation
		// Users require email and password, which reliably triggers validation errors
		await collectionsPage.navigateToCollection("users");

		// Try to create without required fields
		await collectionsPage.createNewItem();

		// Try to save without filling required fields (email and password are required)
		// Note: Users collection uses "Save" button, not "Save Draft"
		const saveBtn = page.locator(
			'button:has-text("Save"), #action-save-draft, #action-save',
		);
		await saveBtn.first().click();

		// Wait a bit for validation response
		await page.waitForTimeout(1000);

		// Payload 3.x shows validation errors via:
		// 1. Toast notifications with error messages (e.g., "The following field is invalid: email")
		// 2. Inline field error indicators
		// 3. The page stays on the create form (doesn't redirect to edit page)
		const validationIndicators = [
			// Toast with error message
			'text=/invalid|required|error/i',
			// Toast container visible
			'.payload-toast-container',
			'[class*="toast"]',
			// Field-level errors
			'[aria-invalid="true"]',
			// Stay on create page (URL still has /create)
			async () => page.url().includes('/create'),
			// Page title still shows untitled/new
			'text=/untitled|create new/i',
		];

		let validationDetected = false;
		for (const indicator of validationIndicators) {
			if (typeof indicator === 'function') {
				if (await indicator()) {
					validationDetected = true;
					break;
				}
			} else {
				if (
					await page
						.locator(indicator)
						.first()
						.isVisible({ timeout: 1000 })
						.catch(() => false)
				) {
					validationDetected = true;
					break;
				}
			}
		}

		// If none of the validation indicators were found, but we're still on create page,
		// that also indicates validation prevented the save
		if (!validationDetected && page.url().includes('/create')) {
			validationDetected = true;
		}

		expect(validationDetected).toBeTruthy();
	});

	test.skip("should delete item with confirmation", async ({ page: _page }) => {
		// SKIPPED: Payload 3.x requires clicking a hidden dropdown toggle to reveal
		// the delete button. The toggle button has no accessible name or stable selector.
		// This test needs to be updated when Payload adds data-testid or aria attributes
		// to the actions dropdown trigger.
		// TODO: Re-enable when Payload 3.x adds stable selectors for action dropdown
		// See: https://github.com/payloadcms/payload/issues (report selector issue)

		// First create an item to delete
		await collectionsPage.navigateToCollection("posts");
		await collectionsPage.createNewItem();

		const testTitle = `Post to Delete ${Date.now()}`;
		await collectionsPage.fillRequiredFields({
			title: testTitle,
			content: "Test content for delete test",
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

	test.beforeEach(async ({ page }) => {
		collectionsPage = new PayloadCollectionsPage(page);
		// No login needed - storage state handles authentication
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
		// Navigate to admin first (authenticated via storage state)
		await collectionsPage.navigateToCollection("posts");

		// Simulate network offline
		await page.context().setOffline(true);

		// Try to navigate to another collection
		await collectionsPage.navigateToCollection("users").catch(() => {});

		// Go back online
		await page.context().setOffline(false);

		// Refresh and verify recovery
		await page.reload();
		await collectionsPage.waitForPageLoad();

		// Payload 3.x admin UI elements to verify recovery
		// Use multiple selectors that match actual Payload 3.x DOM structure
		const recoverySelectors = [
			// Navigation elements
			'navigation',
			'complementary',
			'[role="navigation"]',
			// Sidebar navigation links
			'a[href*="/admin/collections/"]',
			// Page heading
			'h1',
			// Table or list content
			'table',
			'tbody',
			// Create new button
			'a:has-text("Create New")',
			// Any visible banner
			'banner',
		];

		let hasContent = false;
		for (const selector of recoverySelectors) {
			if (
				await page
					.locator(selector)
					.first()
					.isVisible({ timeout: 2000 })
					.catch(() => false)
			) {
				hasContent = true;
				break;
			}
		}

		expect(hasContent).toBeTruthy();
	});

	test("should handle session expiry gracefully", async ({ page, context }) => {
		// Navigate to admin (authenticated via storage state)
		await collectionsPage.navigateToCollection("posts");

		// Clear cookies to simulate session expiry
		await context.clearCookies();

		// Try to navigate to protected route
		await collectionsPage.navigateToCollection("users");

		// Should redirect to login
		await expect(page).toHaveURL(/.*\/login/);
	});
});
