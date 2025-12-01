import { expect, type Locator, type Page } from "@playwright/test";
import { PayloadBasePage } from "./PayloadBasePage";

export class PayloadLoginPage extends PayloadBasePage {
	readonly emailInput: Locator;
	readonly passwordInput: Locator;
	readonly loginButton: Locator;
	readonly createFirstUserButton: Locator;
	readonly confirmPasswordInput: Locator;
	readonly nameInput: Locator;
	readonly errorMessage: Locator;
	readonly forgotPasswordLink: Locator;

	constructor(page: Page) {
		super(page);

		// Login form elements
		this.emailInput = page.locator('input[name="email"]');
		this.passwordInput = page.locator('input[name="password"]');
		this.loginButton = page.locator('button[type="submit"]:has-text("Login")');

		// First user creation elements
		this.createFirstUserButton = page.locator(
			'button:has-text("Create First User")',
		);
		this.confirmPasswordInput = page.locator('input[name="confirm-password"]');
		this.nameInput = page.locator('input[name="name"]');

		// Error handling - Payload CMS uses various error display patterns
		this.errorMessage = page.locator(
			".field-error, .form-submit-error, .toast-error, [class*='error'], .banner--error, [data-testid='toast-error']",
		);
		this.forgotPasswordLink = page.locator('a:has-text("Forgot Password")');
	}

	async navigateToLogin() {
		await this.page.goto(`${this.baseURL}/admin/login`);
		await this.waitForPageLoad();
	}

	async login(email: string, password: string) {
		await this.navigateToLogin();
		await this.emailInput.fill(email);
		await this.passwordInput.fill(password);
		await this.loginButton.click();

		// Wait for either success (redirect) or error
		await Promise.race([
			this.page.waitForURL("**/admin", { timeout: 10000 }),
			this.errorMessage.waitFor({ state: "visible", timeout: 10000 }),
		]).catch(() => {});
	}

	async createFirstUser(
		email: string,
		password: string,
		name: string = "Admin User",
	) {
		await this.navigateToLogin();

		// Check if first user setup is needed
		const needsFirstUser = await this.createFirstUserButton
			.isVisible({ timeout: 5000 })
			.catch(() => false);

		if (needsFirstUser) {
			await this.createFirstUserButton.click();
			await this.nameInput.fill(name);
			await this.emailInput.fill(email);
			await this.passwordInput.fill(password);
			await this.confirmPasswordInput.fill(password);

			// Submit the form
			await this.page.locator('button[type="submit"]').click();

			// Wait for success or error
			await Promise.race([
				this.page.waitForURL("**/admin", { timeout: 15000 }),
				this.errorMessage.waitFor({ state: "visible", timeout: 15000 }),
			]);
		} else {
			// First user already exists, just login
			await this.login(email, password);
		}
	}

	async expectLoginSuccess() {
		await expect(this.page).toHaveURL(/.*\/admin(?!\/login)/);
		await this.expectNoErrors();
	}

	async expectLoginError(errorText?: string) {
		await expect(this.errorMessage).toBeVisible();
		if (errorText) {
			await expect(this.errorMessage).toContainText(errorText);
		}
	}

	async checkAuthenticationState() {
		const response = await this.page.request.get(
			`${this.baseURL}/api/users/me`,
			{
				failOnStatusCode: false,
			},
		);
		return response.ok();
	}

	async isFirstUserSetupNeeded(): Promise<boolean> {
		await this.navigateToLogin();
		return await this.createFirstUserButton
			.isVisible({ timeout: 5000 })
			.catch(() => false);
	}
}
