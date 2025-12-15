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

			console.log(`Inviting ${invite.email} with role ${invite.role}...`);

			const nth = index + 1;

			await this.page.fill(
				`[data-testid="invite-member-form-item"]:nth-child(${nth}) [data-testid="invite-email-input"]`,
				invite.email,
			);

			// Click role selector and wait for options to appear
			// Note: This may fail if the browser client cannot authenticate with Supabase
			// due to cookie name mismatch or host.docker.internal DNS resolution issues
			await expect(async () => {
				await this.page.click(
					`[data-testid="invite-member-form-item"]:nth-child(${nth}) [data-testid="role-selector-trigger"]`,
				);

				const roleOption = this.page.locator(
					`[data-testid="role-option-${invite.role}"]`,
				);
				await expect(roleOption).toBeVisible({ timeout: 5000 });
				await roleOption.click();
			}).toPass({
				timeout: 30000,
				intervals: [1000, 2000, 5000],
			});

			if (index < invites.length - 1) {
				await form.locator('[data-testid="add-new-invite-button"]').click();
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
		}).toPass();
	}

	async openInviteForm() {
		await expect(async () => {
			await this.page.click('[data-testid="invite-members-form-trigger"]');

			return await expect(this.getInviteForm()).toBeVisible();
		}).toPass();
	}

	getInvitations() {
		return this.page.locator('[data-testid="invitation-email"]');
	}

	async deleteInvitation(email: string) {
		const actions = this.getInvitationRow(email).getByRole("button");

		await actions.click();

		await this.page
			.locator('[data-testid="remove-invitation-trigger"]')
			.click();

		// Wait for dialog to be visible
		await this.page.waitForSelector('[data-testid="delete-invitation-form"]', {
			state: "visible",
		});

		await this.page.click(
			'[data-testid="delete-invitation-form"] button[type="submit"]',
		);

		// Wait for dialog to close (indicates action completed)
		await this.page.waitForSelector('[data-testid="delete-invitation-form"]', {
			state: "hidden",
			timeout: 30000,
		});
	}

	getInvitationRow(email: string) {
		return this.page.getByRole("row", { name: email });
	}

	async updateInvitation(email: string, role: string) {
		const row = this.getInvitationRow(email);
		const actions = row.getByRole("button");

		await actions.click();

		await this.page
			.locator('[data-testid="update-invitation-trigger"]')
			.click();

		// Wait for dialog to be visible
		await this.page.waitForSelector('[data-testid="update-invitation-form"]', {
			state: "visible",
		});

		await this.page.click(`[data-testid="role-selector-trigger"]`);
		await this.page.click(`[data-testid="role-option-${role}"]`);

		await this.page.click(
			'[data-testid="update-invitation-form"] button[type="submit"]',
		);

		// Wait for dialog to close (indicates action completed)
		await this.page.waitForSelector('[data-testid="update-invitation-form"]', {
			state: "hidden",
			timeout: 30000,
		});
	}

	async acceptInvitation() {
		console.log("Accepting invitation...");

		const click = this.page
			.locator('[data-testid="join-team-form"] button[type="submit"]')
			.click();

		const response = this.page.waitForResponse((response) => {
			return (
				response.url().includes("/join") &&
				response.request().method() === "POST"
			);
		});

		await Promise.all([click, response]);

		console.log("Invitation accepted");
	}

	private getInviteForm() {
		return this.page.locator('[data-testid="invite-members-form"]');
	}
}
