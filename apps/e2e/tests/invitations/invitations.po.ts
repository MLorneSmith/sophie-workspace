import { expect, type Page } from "@playwright/test";

import { AuthPageObject } from "../authentication/auth.po";
import { TeamAccountsPageObject } from "../team-accounts/team-accounts.po";

export class InvitationsPageObject {
	private readonly page: Page;
	public auth: AuthPageObject;
	public teamAccounts: TeamAccountsPageObject;

	constructor(page: Page) {
		this.page = page;
		this.auth = new AuthPageObject(page);
		this.teamAccounts = new TeamAccountsPageObject(page);
	}

	setup() {
		return this.teamAccounts.setup();
	}

	public async inviteMembers(
		invites: Array<{
			email: string;
			role: string;
		}>,
	) {
		const form = this.getInviteForm();

		for (let index = 0; index < invites.length; index++) {
			const invite = invites[index];

			if (!invite) {
				continue;
			}

			// Only log in debug mode to avoid Biome linting errors
			if (process.env.DEBUG) {
				process.stdout.write(
					`Inviting ${invite.email} with role ${invite.role}...\n`,
				);
			}

			const nth = index + 1;

			await this.page.fill(
				`[data-test="invite-member-form-item"]:nth-child(${nth}) [data-test="invite-email-input"]`,
				invite.email,
			);

			await this.page.click(
				`[data-test="invite-member-form-item"]:nth-child(${nth}) [data-test="role-selector-trigger"]`,
			);

			await this.page.click(`[data-test="role-option-${invite.role}"]`);

			if (index < invites.length - 1) {
				await form.locator('[data-test="add-new-invite-button"]').click();
			}
		}

		await form.locator('button[type="submit"]').click();
	}

	navigateToMembers() {
		return expect(async () => {
			await this.page
				.locator("a", {
					hasText: "Members",
				})
				.click();

			await this.page.waitForURL("**/home/*/members");
		}).toPass({ timeout: 15000 });
	}

	async openInviteForm() {
		await expect(async () => {
			await this.page.click('[data-test="invite-members-form-trigger"]');

			return await expect(this.getInviteForm()).toBeVisible();
		}).toPass({ timeout: 15000 });
	}

	getInvitations() {
		return this.page.locator('[data-test="invitation-email"]');
	}

	async deleteInvitation(email: string) {
		const actions = this.getInvitationRow(email).getByRole("button");

		await actions.click();

		await this.page.locator('[data-test="remove-invitation-trigger"]').click();

		await this.page.click(
			'[data-test="delete-invitation-form"] button[type="submit"]',
		);
	}

	getInvitationRow(email: string) {
		return this.page.getByRole("row", { name: email });
	}

	async updateInvitation(email: string, role: string) {
		const row = this.getInvitationRow(email);
		const actions = row.getByRole("button");

		await actions.click();

		await this.page.locator('[data-test="update-invitation-trigger"]').click();

		await this.page.click(`[data-test="role-selector-trigger"]`);
		await this.page.click(`[data-test="role-option-${role}"]`);

		await this.page.click(
			'[data-test="update-invitation-form"] button[type="submit"]',
		);
	}

	async acceptInvitation() {
		// Only log in debug mode to avoid Biome linting errors
		if (process.env.DEBUG) {
			process.stdout.write("Accepting invitation...\n");
		}

		// Wait for page to be fully loaded before interaction
		await this.page.waitForLoadState("networkidle");
		await this.page.waitForSelector('[data-test="join-team-form"]', {
			state: "visible",
			timeout: 10000,
		});

		const submitButton = this.page.locator(
			'[data-test="join-team-form"] button[type="submit"]',
		);

		// Ensure button is enabled before clicking
		await expect(submitButton).toBeEnabled({ timeout: 5000 });

		// Use Promise.all with proper error handling
		const [response] = await Promise.all([
			this.page.waitForResponse((response) => {
				return (
					response.url().includes("/join") &&
					response.request().method() === "POST" &&
					response.status() === 200
				);
			}),
			submitButton.click(),
		]);

		// Wait for redirect after successful join
		await this.page.waitForURL("**/home/**", { timeout: 10000 });

		if (process.env.DEBUG) {
			process.stdout.write(`Join response status: ${response.status()}\n`);
		}
	}

	private getInviteForm() {
		return this.page.locator('[data-test="invite-members-form"]');
	}
}
