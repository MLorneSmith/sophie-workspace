import { expect, type Page } from "@playwright/test";

import { AuthPageObject } from "../authentication/auth.po";
import { OtpPo } from "../utils/otp.po";
import {
	CI_TIMEOUTS,
	RETRY_INTERVALS,
	waitForHydration,
} from "../utils/wait-for-hydration";

export class TeamAccountsPageObject {
	private readonly page: Page;
	public auth: AuthPageObject;
	public otp: OtpPo;

	constructor(page: Page) {
		this.page = page;
		this.auth = new AuthPageObject(page);
		this.otp = new OtpPo(page);
	}

	async setup(params = this.createTeamName()) {
		const auth = new AuthPageObject(this.page);

		// Use pre-existing test user from seed data with environment variables
		const email = process.env.E2E_TEST_USER_EMAIL || "test1@slideheroes.com";
		const password = process.env.E2E_TEST_USER_PASSWORD || "";
		if (!password) throw new Error("E2E_TEST_USER_PASSWORD not set");

		await auth.loginAsUser({ email, password });

		await this.createTeam(params);

		return {
			email: email,
			teamName: params.teamName,
			slug: params.slug,
		};
	}

	getTeamFromSelector(teamName: string) {
		return this.page.locator(`[data-testid="account-selector-team"]`, {
			hasText: teamName,
		});
	}

	getTeams() {
		return this.page.locator('[data-testid="account-selector-team"]');
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

	openAccountsSelector() {
		return expect(async () => {
			// Wait for React hydration to complete before interacting
			// This addresses CI flakiness due to Vercel cold starts (Issue #1051)
			await waitForHydration(this.page, {
				selector: '[data-testid="team-selector"]',
				timeout: CI_TIMEOUTS.hydration,
			});

			// Ensure the team selector is visible and ready before clicking
			const teamSelector = this.page.locator('[data-testid="team-selector"]');
			await expect(teamSelector).toBeVisible({ timeout: CI_TIMEOUTS.element });

			await teamSelector.click();

			return expect(
				this.page.locator('[data-testid="account-selector-content"]'),
			).toBeVisible({ timeout: CI_TIMEOUTS.element });
		}).toPass({
			timeout: CI_TIMEOUTS.element,
			intervals: RETRY_INTERVALS as unknown as number[],
		});
	}

	async tryCreateTeam(teamName: string) {
		await this.page.locator('[data-testid="create-team-form"] input').fill("");
		await this.page.waitForTimeout(200);

		await this.page
			.locator('[data-testid="create-team-form"] input')
			.fill(teamName);

		return this.page.click(
			'[data-testid="create-team-form"] button:last-child',
		);
	}

	async createTeam({ teamName, slug } = this.createTeamName()) {
		await this.openAccountsSelector();

		await this.page.click('[data-testid="create-team-account-trigger"]');
		await this.page.fill('[data-testid="create-team-form"] input', teamName);

		const click = this.page.click(
			'[data-testid="create-team-form"] button:last-child',
		);

		const response = this.page.waitForURL(`/home/${slug}`);

		await Promise.all([click, response]);
	}

	async updateName(name: string, slug: string) {
		await expect(async () => {
			await this.page.fill(
				'[data-testid="update-team-account-name-form"] input',
				name,
			);

			const click = this.page.click(
				'[data-testid="update-team-account-name-form"] button',
			);

			// the slug should be updated to match the new team name
			const response = this.page.waitForURL(`**/home/${slug}/settings`);

			return Promise.all([click, response]);
		}).toPass();
	}

	async deleteAccount(email: string) {
		await expect(async () => {
			await this.page.click('[data-testid="delete-team-trigger"]');

			await this.otp.completeOtpVerification(email);

			const click = this.page.click(
				'[data-testid="delete-team-form-confirm-button"]',
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
			await this.page.click('[data-testid="role-selector-trigger"]');
			await this.page.click(`[data-testid="role-option-${newRole}"]`);

			// Wait for the update to complete and page to reload
			const response = this.page.waitForResponse("**/members");

			return Promise.all([
				this.page.click('[data-testid="confirm-update-member-role"]'),
				response,
			]);
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

			// Wait for the transfer to complete and page to reload
			const response = this.page.waitForResponse("**/members");

			return Promise.all([
				this.page.click('[data-testid="confirm-transfer-ownership-button"]'),
				response,
			]);
		}).toPass();
	}

	createTeamName() {
		const random = (Math.random() * 100000000).toFixed(0);

		const teamName = `Team-Name-${random}`;
		const slug = `team-name-${random}`;

		return { teamName, slug };
	}
}
