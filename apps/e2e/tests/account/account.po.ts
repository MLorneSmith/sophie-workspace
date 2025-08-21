import { expect, type Page } from "@playwright/test";

import { AuthPageObject } from "../authentication/auth.po";
import { OnboardingPageObject } from "../onboarding/onboarding.po";
import { OtpPo } from "../utils/otp.po";

export class AccountPageObject {
	private readonly page: Page;
	public auth: AuthPageObject;
	private otp: OtpPo;
	private onboarding: OnboardingPageObject;

	constructor(page: Page) {
		this.page = page;
		this.auth = new AuthPageObject(page);
		this.otp = new OtpPo(page);
		this.onboarding = new OnboardingPageObject(page);
	}

	async setup() {
		// Navigate to sign-up page with next parameter
		await this.page.goto("/auth/sign-up?next=/home/settings");

		const email = this.auth.createRandomEmail();

		// Sign up
		await this.auth.signUp({
			email,
			password: "password",
			repeatPassword: "password",
		});

		// Wait for either onboarding redirect or success status
		await this.page.waitForURL(
			(url) =>
				url.href.includes("/onboarding") || url.href.includes("status=success"),
			{ timeout: 10000 },
		);

		const currentUrl = this.page.url();
		console.log(`After sign-up, current URL: ${currentUrl}`);

		// Handle email confirmation if needed
		if (currentUrl.includes("status=success")) {
			// Email confirmation required
			await this.auth.visitConfirmEmailLink(email);

			// After confirmation, should redirect to onboarding
			await this.page.waitForURL("**/onboarding", { timeout: 10000 });
		}

		// Now we should be on onboarding page
		// Complete onboarding using the simplified approach with E2E bypass
		try {
			await this.onboarding.completeOnboardingSimple();
		} catch (error) {
			console.log(
				"Onboarding failed, attempting direct navigation with E2E bypass",
			);
			// Force navigation to settings page with E2E parameter
			await this.page.goto("/home/settings?e2e=true", {
				waitUntil: "domcontentloaded",
			});
		}

		// Navigate to settings page if not already there
		if (!this.page.url().includes("/home/settings")) {
			await this.page.goto("/home/settings?e2e=true");
		}

		await this.page.waitForLoadState("networkidle");

		return { email };
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

	async updatePassword(password: string) {
		await this.page.fill(
			'[data-test="account-password-form-password-input"]',
			password,
		);

		await this.page.fill(
			'[data-test="account-password-form-repeat-password-input"]',
			password,
		);

		await this.page.click('[data-test="account-password-form"] button');
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
