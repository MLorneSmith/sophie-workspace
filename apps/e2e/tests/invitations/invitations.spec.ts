import { expect, test } from "@playwright/test";
import { AuthPageObject } from "../authentication/auth.po";
import { AUTH_STATES } from "../utils/auth-state";
import { unbanUser } from "../utils/database-utilities";
import { InvitationsPageObject } from "./invitations.po";

test.describe("Invitations", () => {
	// Use pre-authenticated state from global setup
	AuthPageObject.setupSession(AUTH_STATES.TEST_USER);

	// Ensure test user is in clean state before tests run
	// This prevents state corruption from previous test runs (e.g., if user was banned)
	test.beforeAll(async () => {
		const testUserEmail = "test1@slideheroes.com";
		try {
			const restored = await unbanUser(testUserEmail);
			if (restored) {
				console.log(
					`[invitations.spec.ts beforeAll] Test user ${testUserEmail} was banned, now restored`,
				);
			}
		} catch (error) {
			console.warn(
				"[invitations.spec.ts beforeAll] Failed to ensure test user state:",
				error instanceof Error ? error.message : error,
			);
		}
	});

	let invitations: InvitationsPageObject;
	let slug: string;

	test.beforeEach(async ({ page }) => {
		invitations = new InvitationsPageObject(page);

		// Navigate to home first - required because Playwright starts with blank page
		// even when using pre-authenticated storage state
		await page.goto("/home");

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

		await expect(row.locator('[data-testid="member-role-badge"]')).toHaveText(
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
	// Use pre-authenticated OWNER_USER state to avoid fresh login timeouts
	test.use({ storageState: AUTH_STATES.OWNER_USER });

	test("should invite users and let users accept an invite", async ({
		page,
	}) => {
		const invitations = new InvitationsPageObject(page);

		// Already authenticated via OWNER_USER storage state (test2@slideheroes.com)
		// Skip loginAsUser and go directly to home
		await page.goto("/home");

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
