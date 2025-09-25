import { expect, type Locator, type Page } from "@playwright/test";

export abstract class PayloadBasePage {
	readonly page: Page;
	readonly baseURL: string;

	// Common elements across all Payload pages
	readonly navSidebar: Locator;
	readonly navToggle: Locator;
	readonly userMenu: Locator;
	readonly logoutButton: Locator;
	readonly toastNotification: Locator;
	readonly loadingIndicator: Locator;
	readonly saveButton: Locator;
	readonly publishButton: Locator;

	constructor(page: Page) {
		this.page = page;
		this.baseURL =
			process.env.PAYLOAD_PUBLIC_SERVER_URL || "http://localhost:3021";

		// Navigation elements
		this.navSidebar = page.locator(".nav");
		this.navToggle = page.locator('button[aria-label="Open Menu"]');
		this.userMenu = page.locator(".account");
		this.logoutButton = page.locator('button:has-text("Log Out")');

		// Common UI elements
		this.toastNotification = page.locator(".payload-toast-container");
		this.loadingIndicator = page.locator(".loading-overlay");
		this.saveButton = page.locator('button[type="submit"]:has-text("Save")');
		this.publishButton = page.locator('button:has-text("Publish")');
	}

	async waitForPageLoad() {
		await this.page.waitForLoadState("networkidle");
		await this.loadingIndicator
			.waitFor({ state: "hidden", timeout: 30000 })
			.catch(() => {});
	}

	async expectToastMessage(message: string) {
		await expect(this.toastNotification).toContainText(message);
	}

	async expectNoErrors() {
		// Check for common error indicators
		const errorSelectors = [
			".error-message",
			".error",
			'[role="alert"]',
			"text=/error|failed|unable|cannot/i",
		];

		for (const selector of errorSelectors) {
			const errors = await this.page.locator(selector).count();
			if (errors > 0) {
				const errorText = await this.page
					.locator(selector)
					.first()
					.textContent();
				throw new Error(`Found error on page: ${errorText}`);
			}
		}
	}

	async navigateToCollection(collectionSlug: string) {
		await this.page.goto(`${this.baseURL}/admin/collections/${collectionSlug}`);
		await this.waitForPageLoad();
	}

	async logout() {
		await this.userMenu.click();
		await this.logoutButton.click();
		await this.page.waitForURL("**/login");
	}

	async checkDatabaseConnection() {
		// Verify database is connected by checking if page loads without errors
		const response = await this.page.request.get(`${this.baseURL}/api/health`);
		expect(response.ok()).toBeTruthy();
	}
}
