import { expect, test } from "@playwright/test";

import { InvitationsPageObject } from "./invitations.po";

test.describe("Invitations", () => {
	let invitations: InvitationsPageObject;
	let slug: string;

	test.beforeEach(async ({ page }) => {
		invitations = new InvitationsPageObject(page);

		// Use pre-existing test user instead of bootstrapUser
		const email = process.env.E2E_TEST_USER_EMAIL || "test1@slideheroes.com";
		const password = process.env.E2E_TEST_USER_PASSWORD || "";
		if (!password) throw new Error("E2E_TEST_USER_PASSWORD not set");

		await invitations.auth.loginAsUser({ email, password });

		// Create a team for the test
		const teamName = `test-${Math.random().toString(36).substring(2, 15)}`;
		slug = teamName.toLowerCase().replace(/ /g, "-");

		await invitations.teamAccounts.createTeam({
			teamName,
			slug,
		});
	});

	test("users can delete invites", async () => {
		await invitations.navigateToMembers();
		await invitations.openInviteForm();

		const email = invitations.auth.createRandomEmail();

		const invites = [
			{
				email,
				role: "member",
			},
		];

		await invitations.inviteMembers(invites);

		await expect(invitations.getInvitations()).toHaveCount(1);

		await invitations.deleteInvitation(email);

		await expect(invitations.getInvitations()).toHaveCount(0);
	});

	test("users can update invites", async () => {
		await invitations.navigateToMembers();
		await invitations.openInviteForm();

		const email = invitations.auth.createRandomEmail();

		const invites = [
			{
				email,
				role: "member",
			},
		];

		await invitations.inviteMembers(invites);

		await expect(invitations.getInvitations()).toHaveCount(1);

		await invitations.updateInvitation(email, "owner");

		const row = invitations.getInvitationRow(email);

		await expect(row.locator('[data-test="member-role-badge"]')).toHaveText(
			"Owner",
		);
	});

	test("user cannot invite a member of the team again", async ({ page }) => {
		await invitations.navigateToMembers();

		const email = invitations.auth.createRandomEmail();

		const invites = [
			{
				email,
				role: "member",
			},
		];

		await invitations.openInviteForm();
		await invitations.inviteMembers(invites);

		await expect(invitations.getInvitations()).toHaveCount(1);

		// Try to invite the same member again
		// This should fail
		await invitations.openInviteForm();
		await invitations.inviteMembers(invites);
		await page.waitForTimeout(500);
		await expect(invitations.getInvitations()).toHaveCount(1);
	});
});

test.describe("Full Invitation Flow", () => {
	test("should invite users and let users accept an invite", async ({
		page,
	}) => {
		const invitations = new InvitationsPageObject(page);

		// Use pre-existing test user instead of bootstrapUser
		const email = process.env.E2E_TEST_USER_EMAIL || "test1@slideheroes.com";
		const password = process.env.E2E_TEST_USER_PASSWORD || "";
		if (!password) throw new Error("E2E_TEST_USER_PASSWORD not set");

		await invitations.auth.loginAsUser({ email, password });

		// Create a team for the test
		const teamName = `test-${Math.random().toString(36).substring(2, 15)}`;
		const slug = teamName.toLowerCase().replace(/ /g, "-");

		await invitations.teamAccounts.createTeam({
			teamName,
			slug,
		});

		await invitations.navigateToMembers();

		const invites = [
			{
				email: invitations.auth.createRandomEmail(),
				role: "member",
			},
			{
				email: invitations.auth.createRandomEmail(),
				role: "member",
			},
		];

		await invitations.openInviteForm();
		await invitations.inviteMembers(invites);

		const firstEmail = invites[0]?.email;

		await expect(invitations.getInvitations()).toHaveCount(2);

		// sign out and sign in with the first email
		await page.context().clearCookies();
		await page.reload();

		console.log(`Finding email to ${firstEmail} ...`);

		await invitations.auth.visitConfirmEmailLink(firstEmail);

		console.log(`Signing up with ${firstEmail} ...`);

		await invitations.auth.signUp({
			email: firstEmail,
			password: "password",
			repeatPassword: "password",
		});

		await invitations.auth.visitConfirmEmailLink(firstEmail);

		console.log(`Accepting invitation as ${firstEmail}`);

		await invitations.acceptInvitation();

		await invitations.teamAccounts.openAccountsSelector();

		await expect(invitations.teamAccounts.getTeams()).toHaveCount(1);
	});
});
