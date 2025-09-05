import { expect, type Page } from "@playwright/test";

import { AuthPageObject } from "../authentication/auth.po";
import { OnboardingPageObject } from "../onboarding/onboarding.po";
import { OtpPo } from "../utils/otp.po";

export class TeamAccountsPageObject {
	private readonly page: Page;
	public auth: AuthPageObject;
	public otp: OtpPo;
	private onboarding: OnboardingPageObject;

	constructor(page: Page) {
		this.page = page;
		this.auth = new AuthPageObject(page);
		this.otp = new OtpPo(page);
		this.onboarding = new OnboardingPageObject(page);
	}

	async setup(params = this.createTeamName()) {
		const { email } = await this.auth.signUpFlow("/home");

		// Wait for the page to be ready after sign up
		// Check if we're on an onboarding page and complete it if necessary
		const currentUrl = this.page.url();
		if (currentUrl.includes("/onboarding")) {
			console.log("Detected onboarding page, completing onboarding flow...");
			// Complete the onboarding flow properly
			await this.onboarding.completeOnboardingSimple();
			console.log("Onboarding completed, now on home page");
		}

		// Verify we're on the home page before trying to create a team
		if (!this.page.url().includes("/home")) {
			console.log(`Not on home page, current URL: ${this.page.url()}`);
			// Try to navigate to home if we're not there
			await this.page.goto("/home");
			await this.page.waitForURL("**/home/**", { timeout: 10000 });
		}

		await this.createTeam(params);

		return { email, teamName: params.teamName, slug: params.slug };
	}

	getTeamFromSelector(teamName: string) {
		return this.page.locator(`[data-test="account-selector-team"]`, {
			hasText: teamName,
		});
	}

	getTeams() {
		return this.page.locator('[data-test="account-selector-team"]');
	}

	goToSettings() {
		return expect(async () => {
			await this.page
				.locator("a", {
					hasText: "Settings",
				})
				.click();

			await this.page.waitForURL("**/home/*/settings");
		}).toPass();
	}

	goToMembers() {
		return expect(async () => {
			await this.page
				.locator("a", {
					hasText: "Members",
				})
				.click();

			await this.page.waitForURL("**/home/*/members");
		}).toPass();
	}

	goToBilling() {
		return expect(async () => {
			await this.page
				.locator("a", {
					hasText: "Billing",
				})
				.click();

			return await this.page.waitForURL("**/home/*/billing");
		}).toPass();
	}

	async openAccountsSelector() {
		// Wait for the page to be fully loaded
		await this.page
			.waitForLoadState("networkidle", { timeout: 5000 })
			.catch(() => {
				console.log("Network idle timeout, continuing...");
			});

		// First check if the trigger exists
		const trigger = this.page.locator('[data-test="account-selector-trigger"]');

		// Check if the trigger is already visible, if not, it might be behind a menu
		const triggerCount = await trigger.count();
		if (triggerCount === 0) {
			console.error("Account selector trigger not found on page");
			console.log("Current URL:", this.page.url());
			// Take a screenshot for debugging
			await this.page.screenshot({
				path: "test-results/no-account-selector-trigger.png",
			});
			throw new Error("Account selector trigger not found on current page");
		}

		try {
			// Wait for the trigger to be visible with a reasonable timeout
			await trigger.waitFor({ state: "visible", timeout: 5000 });
			await trigger.click();

			// Wait for the content to appear with a shorter timeout
			const content = this.page.locator(
				'[data-test="account-selector-content"]',
			);
			await content.waitFor({ state: "visible", timeout: 5000 });
		} catch (error) {
			// Provide better error context
			console.error("Failed to open account selector:", error.message);
			console.log("Current page URL:", this.page.url());
			// Take a screenshot for debugging
			await this.page.screenshot({
				path: "test-results/account-selector-error.png",
			});
			throw new Error(`Account selector failed to open: ${error.message}`);
		}
	}

	async tryCreateTeam(teamName: string) {
		await this.page.locator('[data-test="create-team-form"] input').fill("");
		await this.page.waitForTimeout(200);
		await this.page
			.locator('[data-test="create-team-form"] input')
			.fill(teamName);

		return this.page.click('[data-test="create-team-form"] button:last-child');
	}

	async createTeam({ teamName, slug } = this.createTeamName()) {
		await this.openAccountsSelector();

		await this.page.click('[data-test="create-team-account-trigger"]');
		await this.page.fill('[data-test="create-team-form"] input', teamName);

		const click = this.page.click(
			'[data-test="create-team-form"] button:last-child',
		);

		const response = this.page.waitForURL(`/home/${slug}`);

		await Promise.all([click, response]);
	}

	async updateName(name: string, slug: string) {
		await expect(async () => {
			await this.page.fill(
				'[data-test="update-team-account-name-form"] input',
				name,
			);

			const click = this.page.click(
				'[data-test="update-team-account-name-form"] button',
			);

			// the slug should be updated to match the new team name
			const response = this.page.waitForURL(`**/home/${slug}/settings`);

			return Promise.all([click, response]);
		}).toPass();
	}

	async deleteAccount(email: string) {
		await expect(async () => {
			await this.page.click('[data-test="delete-team-trigger"]');

			await this.otp.completeOtpVerification(email);

			const click = this.page.click(
				'[data-test="delete-team-form-confirm-button"]',
			);

			const response = this.page.waitForURL("**/home");

			return Promise.all([click, response]);
		}).toPass();
	}

	async updateMemberRole(memberEmail: string, newRole: string) {
		await expect(async () => {
			// Find the member row and click the actions button
			const memberRow = this.page.getByRole("row", { name: memberEmail });
			await memberRow.getByRole("button").click();

			// Click the update role option in the dropdown menu
			await this.page.getByText("Update Role").click();

			// Select the new role
			await this.page.click('[data-test="role-selector-trigger"]');
			await this.page.click(`[data-test="role-option-${newRole}"]`);

			// Click the confirm button
			const click = this.page.click('[data-test="confirm-update-member-role"]');

			// Wait for the update to complete and page to reload
			const response = this.page.waitForURL("**/home/*/members");

			return Promise.all([click, response]);
		}).toPass();
	}

	async transferOwnership(memberEmail: string, ownerEmail: string) {
		await expect(async () => {
			// Find the member row and click the actions button
			const memberRow = this.page.getByRole("row", { name: memberEmail });
			await memberRow.getByRole("button").click();

			// Click the transfer ownership option in the dropdown menu
			await this.page.getByText("Transfer Ownership").click();

			// Complete OTP verification
			await this.otp.completeOtpVerification(ownerEmail);

			// Click the confirm button
			const click = this.page.click(
				'[data-test="confirm-transfer-ownership-button"]',
			);

			// Wait for the transfer to complete and page to reload
			const response = this.page.waitForURL("**/home/*/members");

			return Promise.all([click, response]);
		}).toPass();
	}

	createTeamName() {
		const random = (Math.random() * 100000000).toFixed(0);

		const teamName = `Team-Name-${random}`;
		const slug = `team-name-${random}`;

		return { teamName, slug };
	}
}
