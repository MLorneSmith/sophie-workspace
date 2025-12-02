import { expect, type Locator, type Page } from "@playwright/test";

export abstract class PayloadBasePage {
	readonly page: Page;
	readonly baseURL: string;

	// Common elements across all Payload pages
	readonly navSidebar: Locator;
	readonly navToggle: Locator;
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

		// Common UI elements
		this.toastNotification = page.locator(".payload-toast-container");
		this.loadingIndicator = page.locator(".loading-overlay");
		this.saveButton = page.locator("#action-save-draft");
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
		// Check for specific error indicators (not generic alerts)
		const errorSelectors = [
			".error-message",
			".error",
			".form-submit-error",
			".field-error",
		];

		for (const selector of errorSelectors) {
			const elements = this.page.locator(selector);
			const count = await elements.count();

			for (let i = 0; i < count; i++) {
				const element = elements.nth(i);
				const errorText = (await element.textContent())?.trim();

				// Only throw if the element has actual error content
				if (errorText && errorText.length > 0) {
					throw new Error(`Found error on page: ${errorText}`);
				}
			}
		}

		// Check for specific error text patterns (more targeted)
		const errorTextPatterns = [
			"text=/connection.*failed/i",
			"text=/unable to connect/i",
			"text=/database.*error/i",
			"text=/server.*error/i",
		];

		for (const pattern of errorTextPatterns) {
			const errorElement = this.page.locator(pattern).first();
			if (await errorElement.isVisible({ timeout: 1000 }).catch(() => false)) {
				const errorText = await errorElement.textContent();
				throw new Error(`Found error on page: ${errorText}`);
			}
		}
	}

	async navigateToCollection(collectionSlug: string) {
		await this.page.goto(`${this.baseURL}/admin/collections/${collectionSlug}`);
		await this.waitForPageLoad();
	}

	async logout() {
		// Navigate directly to logout URL to avoid Next.js dev overlay interception
		await this.page.goto(`${this.baseURL}/admin/logout`);
		await this.page.waitForURL("**/login");
	}

	async checkDatabaseConnection() {
		// Verify database is connected by checking if page loads without errors
		const response = await this.page.request.get(`${this.baseURL}/api/health`);
		expect(response.ok()).toBeTruthy();
	}
}
