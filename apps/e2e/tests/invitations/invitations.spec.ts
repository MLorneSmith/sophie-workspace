import { AuthPageObject } from "../authentication/auth.po";
import { AUTH_STATES } from "../utils/auth-state";
import { expect, test } from "../utils/base-test";
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

		// Wait for invitation to appear
		await expect(invitations.getInvitations()).toHaveCount(1, {
			timeout: 15000,
		});

		await invitations.deleteInvitation(email);

		// Wait for invitation to be removed after server revalidation
		await expect(invitations.getInvitations()).toHaveCount(0, {
			timeout: 15000,
		});
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

		// Wait for invitation to appear
		await expect(invitations.getInvitations()).toHaveCount(1, {
			timeout: 15000,
		});

		await invitations.updateInvitation(email, "owner");

		const row = invitations.getInvitationRow(email);

		// Wait for role badge to update after server revalidation
		await expect(row.locator('[data-testid="member-role-badge"]')).toHaveText(
			"Owner",
			{ timeout: 15000 },
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

		// Wait for invitation to appear
		await expect(invitations.getInvitations()).toHaveCount(1, {
			timeout: 15000,
		});

		// Try to invite the same member again - this should fail due to unique constraint
		await invitations.openInviteForm();
		await invitations.inviteMembers(invites);

		// Wait a bit for any potential server response
		await page.waitForTimeout(1000);

		// Verify we still only have 1 invitation (duplicate was prevented)
		await expect(invitations.getInvitations()).toHaveCount(1, {
			timeout: 15000,
		});
	});
});

test.describe("Full Invitation Flow", () => {
	// Use pre-authenticated OWNER_USER state to avoid fresh login timeouts
	test.use({ storageState: AUTH_STATES.OWNER_USER });

	// SKIP: This test has complex timing issues with email confirmation and invitation acceptance.
	// The test flow requires:
	// 1. Creating a team as OWNER_USER
	// 2. Inviting random emails
	// 3. Clearing cookies and visiting invitation link
	// 4. Signing up as invited user
	// 5. Accepting the invitation
	//
	// Issues:
	// - Email delivery timing is unpredictable in test environment
	// - Invitation link parsing from email is fragile
	// - Session state transitions (owner → anonymous → new user) cause race conditions
	// - Test passes individually but fails in suite due to session token expiration
	//
	// To fix properly, this needs:
	// 1. Direct database access to create invitations (bypass email)
	// 2. A dedicated test endpoint for invitation acceptance
	// 3. Or move to a separate shard with fresh storage state
	test.skip("should invite users and let users accept an invite", async ({
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

		console.log(`Finding invitation email for ${firstEmail} ...`);

		// Visit the invitation link from the email
		// This should take the user to the signup/join page
		await invitations.auth.visitConfirmEmailLink(firstEmail);

		console.log(`Signing up with ${firstEmail} ...`);

		// Create account via signup form
		await invitations.auth.signUp({
			email: firstEmail,
			password: "password",
			repeatPassword: "password",
		});

		// Note: With enable_confirmations = false in Supabase config,
		// no confirmation email is sent after signup. The user is already confirmed.
		// We skip the second visitConfirmEmailLink call.
		// If email confirmation is required, uncomment the line below:
		// await invitations.auth.visitConfirmEmailLink(firstEmail);

		// After signup, the user should be redirected to the invitation acceptance page
		// or we need to navigate there explicitly
		await page.waitForURL(/.*/, { timeout: 10000 }); // Wait for any navigation to complete

		console.log(`Accepting invitation as ${firstEmail}`);

		await invitations.acceptInvitation();

		await invitations.teamAccounts.openAccountsSelector();

		await expect(invitations.teamAccounts.getTeams()).toHaveCount(1);
	});
});
