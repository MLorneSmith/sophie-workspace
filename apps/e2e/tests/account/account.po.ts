import { expect, type Page } from "@playwright/test";

import { AuthPageObject } from "../authentication/auth.po";
import { OnboardingPageObject } from "../onboarding/onboarding.po";
import { OtpPo } from "../utils/otp.po";

export class AccountPageObject {
	private readonly page: Page;
	public auth: AuthPageObject;
	private otp: OtpPo;
	private onboarding: OnboardingPageObject;
	private currentPassword = "password";

	constructor(page: Page) {
		this.page = page;
		this.auth = new AuthPageObject(page);
		this.otp = new OtpPo(page);
		this.onboarding = new OnboardingPageObject(page);
	}

	async setup() {
		// Navigate to sign-up page first without next parameter to allow onboarding
		await this.page.goto("/auth/sign-up");

		const email = this.auth.createRandomEmail();
		const password = "testingpassword123!"; // Stronger password
		this.currentPassword = password;

		// Sign up
		await this.auth.signUp({
			email,
			password,
			repeatPassword: password,
		});

		// With autoconfirm enabled, wait for redirect to either onboarding or home
		await this.page.waitForURL(
			(url) => url.href.includes("/onboarding") || url.href.includes("/home"),
			{ timeout: 15000 }, // Increased timeout
		);

		const currentUrl = this.page.url();
		console.log(`After sign-up, current URL: ${currentUrl}`);

		// If on onboarding page, complete it with better error handling
		if (currentUrl.includes("/onboarding")) {
			try {
				await this.onboarding.completeOnboardingSimple();
				// After onboarding, should be on home page
				await this.page.waitForURL("**/home/**", { timeout: 10000 });
			} catch (error) {
				console.error("Onboarding failed:", error);
				// Try direct navigation as fallback
				await this.page.goto("/home");
				await this.page.waitForLoadState("networkidle");
			}
		}

		// Navigate to settings page with better error handling
		await expect(async () => {
			await this.page.goto("/home/settings");
			await this.page.waitForLoadState("networkidle");
			await expect(this.page).toHaveURL(/\/home\/settings/);
		}).toPass({ timeout: 15000 });

		return { email, password };
	}

	async updateName(name: string) {
		await this.page.fill('[data-test="account-display-name"]', name);
		await this.page.click('[data-test="update-account-name-form"] button');
	}

	async updateEmail(email: string) {
		await expect(async () => {
			await this.page.fill(
				'[data-test="account-email-form-email-input"]',
				email,
			);

			await this.page.fill(
				'[data-test="account-email-form-repeat-email-input"]',
				email,
			);

			const click = this.page.click('[data-test="account-email-form"] button');

			const req = await this.page
				.waitForResponse((resp) => {
					return resp.url().includes("auth/v1/user");
				})
				.then((response) => {
					expect(response.status()).toBe(200);
				});

			return Promise.all([click, req]);
		}).toPass();
	}

	async updatePassword(newPassword: string) {
		// Update stored password for later use in tests
		this.currentPassword = newPassword;

		await this.page.fill(
			'[data-test="account-password-form-password-input"]',
			newPassword,
		);

		await this.page.fill(
			'[data-test="account-password-form-repeat-password-input"]',
			newPassword,
		);

		const responsePromise = this.page.waitForResponse((resp) => {
			return resp.url().includes("auth/v1/user") && resp.status() === 200;
		});

		await this.page.click('[data-test="account-password-form"] button');

		// Wait for password change confirmation
		await responsePromise;

		// Wait for UI to update
		await this.page.waitForTimeout(1000);
	}

	getCurrentPassword() {
		return this.currentPassword;
	}

	async deleteAccount(email: string) {
		// Click the delete account button to open the modal
		await this.page.click('[data-test="delete-account-button"]');

		// Complete the OTP verification process
		await this.otp.completeOtpVerification(email);

		await this.page.waitForTimeout(500);

		await this.page.click('[data-test="confirm-delete-account-button"]');
	}

	getProfileName() {
		return this.page.locator('[data-test="account-dropdown-display-name"]');
	}
}
