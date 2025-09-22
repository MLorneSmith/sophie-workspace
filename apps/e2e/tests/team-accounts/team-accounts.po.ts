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

		// On team account pages, the account selector is in the sidebar
		// We need to make sure the sidebar is visible first
		const sidebarTrigger = this.page.locator('[data-sidebar="trigger"]');
		const sidebarTriggerCount = await sidebarTrigger.count();

		// If we find a sidebar trigger (mobile/collapsed view), click it first
		if (sidebarTriggerCount > 0) {
			const isSidebarTriggerVisible = await sidebarTrigger.isVisible();
			if (isSidebarTriggerVisible) {
				console.log("Opening sidebar first...");
				await sidebarTrigger.click();
				await this.page.waitForTimeout(500); // Wait for sidebar animation
			}
		}

		// Now look for the account selector trigger
		const trigger = this.page.locator('[data-test="account-selector-trigger"]');

		// Wait for the trigger to be present in the DOM
		try {
			await trigger.waitFor({ state: "attached", timeout: 10000 });
		} catch (error) {
			console.error("Account selector trigger not found on page");
			console.log("Current URL:", this.page.url());
			// Take a screenshot for debugging
			await this.page.screenshot({
				path: "test-results/no-account-selector-trigger.png",
			});
			throw new Error("Account selector trigger not found on current page");
		}

		// Check if the trigger is visible, if not it might be in a collapsed sidebar
		const isVisible = await trigger.isVisible();
		if (!isVisible) {
			console.log(
				"Account selector trigger is not visible, checking for sidebar state...",
			);

			// Try to expand the sidebar if it's collapsed
			const sidebar = this.page.locator('[data-sidebar="sidebar"]');
			const sidebarState = await sidebar.getAttribute("data-state");

			if (sidebarState === "collapsed") {
				console.log("Sidebar is collapsed, expanding it...");
				// Click the sidebar trigger to expand it
				const expandButton = this.page.locator('[data-sidebar="trigger"]');
				if (await expandButton.isVisible()) {
					await expandButton.click();
					await this.page.waitForTimeout(500);
				}
			}
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
		// Fill in the new team name
		await this.page.fill(
			'[data-test="update-team-account-name-form"] input',
			name,
		);

		// Click the update button
		await this.page.click('[data-test="update-team-account-name-form"] button');

		// Wait for redirect with updated slug with reasonable timeout
		await this.page.waitForURL(`**/home/${slug}/settings`, { timeout: 30000 });
	}

	async deleteAccount(email: string) {
		// Click delete trigger
		await this.page.click('[data-test="delete-team-trigger"]');

		// Complete OTP verification
		await this.otp.completeOtpVerification(email);

		// Click confirm delete button and wait for navigation
		await this.page.click('[data-test="delete-team-form-confirm-button"]');

		// Wait for redirect to home page with reasonable timeout
		await this.page.waitForURL("**/home", { timeout: 30000 });
	}

	async updateMemberRole(memberEmail: string, newRole: string) {
		// Find the member row and click the actions button
		const memberRow = this.page.getByRole("row", { name: memberEmail });
		await memberRow.getByRole("button").click();

		// Click the update role option in the dropdown menu
		await this.page.getByText("Update Role").click();

		// Select the new role
		await this.page.click('[data-test="role-selector-trigger"]');
		await this.page.click(`[data-test="role-option-${newRole}"]`);

		// Click the confirm button
		await this.page.click('[data-test="confirm-update-member-role"]');

		// Wait for the update to complete with reasonable timeout
		await this.page.waitForURL("**/home/*/members", { timeout: 30000 });
	}

	async transferOwnership(memberEmail: string, ownerEmail: string) {
		// Find the member row and click the actions button
		const memberRow = this.page.getByRole("row", { name: memberEmail });
		await memberRow.getByRole("button").click();

		// Click the transfer ownership option in the dropdown menu
		await this.page.getByText("Transfer Ownership").click();

		// Complete OTP verification
		await this.otp.completeOtpVerification(ownerEmail);

		// Click the confirm button
		await this.page.click('[data-test="confirm-transfer-ownership-button"]');

		// Wait for the transfer to complete with reasonable timeout
		await this.page.waitForURL("**/home/*/members", { timeout: 30000 });
	}

	createTeamName() {
		const random = (Math.random() * 100000000).toFixed(0);

		const teamName = `Team-Name-${random}`;
		const slug = `team-name-${random}`;

		return { teamName, slug };
	}
}
