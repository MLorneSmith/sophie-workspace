import {
	type Browser,
	type BrowserContext,
	expect,
	type Page,
} from "@playwright/test";
import { AuthPageObject } from "../authentication/auth.po";
import { InvitationsPageObject } from "../invitations/invitations.po";
import { TeamAccountsPageObject } from "../team-accounts/team-accounts.po";

/**
 * Pre-defined test users for E2E testing
 * These should be created in the test database seed or via database migration
 */
export const TEST_USERS = {
	owner1: {
		email: "test-owner-1@slideheroes.test",
		password: "password123",
	},
	owner2: {
		email: "test-owner-2@slideheroes.test",
		password: "password123",
	},
	member1: {
		email: "test-member-1@slideheroes.test",
		password: "password123",
	},
	member2: {
		email: "test-member-2@slideheroes.test",
		password: "password123",
	},
	mfaUser: {
		email: "test-mfa-user@slideheroes.test",
		password: "password123",
		mfaKey: "NHOHJVGPO3R3LKVPRMNIYLCDMBHUM2SE",
	},
} as const;

/**
 * Creates a new browser context for isolated user sessions
 */
export async function createUserContext(
	browser: Browser,
): Promise<BrowserContext> {
	return browser.newContext({
		// Clear all cookies and storage for a fresh session
		storageState: undefined,
	});
}

/**
 * Signs in a test user directly without email confirmation
 */
export async function signInUser(
	page: Page,
	user: { email: string; password: string },
): Promise<void> {
	const auth = new AuthPageObject(page);

	// Navigate to sign-in page
	await page.goto("/auth/sign-in");
	await page.waitForLoadState("domcontentloaded");

	// Sign in with credentials
	await auth.signIn(user);

	// Wait for navigation to home page
	await page.waitForURL("/home", { timeout: 10000 });
}

/**
 * Creates a test user directly in the database (bypasses email confirmation)
 * This should be called once during test setup, not for each test
 */
export async function createTestUser(
	page: Page,
	email: string,
	password = "password123",
): Promise<void> {
	const auth = new AuthPageObject(page);

	// Go to sign-up page
	await page.goto("/auth/sign-up");
	await page.waitForLoadState("domcontentloaded");

	// Sign up with credentials
	await auth.signUp({
		email,
		password,
		repeatPassword: password,
	});

	// Since enable_confirmations = false in config, user should be auto-confirmed
	// Wait for redirect to onboarding or home
	await expect(async () => {
		const currentUrl = page.url();
		expect(
			currentUrl.includes("/onboarding") || currentUrl.includes("/home"),
		).toBe(true);
	}).toPass({ timeout: 10000 });
}

/**
 * Sets up a team with owner and optional members using separate browser contexts
 */
export async function setupTeamWithMembers(
	browser: Browser,
	options: {
		teamName?: string;
		ownerUser?: keyof typeof TEST_USERS;
		memberUsers?: Array<{
			user: keyof typeof TEST_USERS;
			role: "member" | "owner";
		}>;
	} = {},
): Promise<{
	ownerContext: BrowserContext;
	ownerPage: Page;
	memberContexts: Array<{
		context: BrowserContext;
		page: Page;
		email: string;
	}>;
	teamName: string;
	teamSlug: string;
}> {
	const random = Math.random().toString(36).substring(2, 15);
	const teamName = options.teamName || `test-team-${random}`;
	const teamSlug = teamName.toLowerCase().replace(/ /g, "-");

	// Create owner context and sign in
	const ownerContext = await browser.newContext();
	const ownerPage = await ownerContext.newPage();
	const ownerUser = TEST_USERS[options.ownerUser || "owner1"];

	await signInUser(ownerPage, ownerUser);

	// Create team
	const teamAccounts = new TeamAccountsPageObject(ownerPage);
	await teamAccounts.createTeam({ teamName, slug: teamSlug });

	// Setup members if provided
	const memberContexts: Array<{
		context: BrowserContext;
		page: Page;
		email: string;
	}> = [];

	if (options.memberUsers) {
		const invitations = new InvitationsPageObject(ownerPage);

		// Navigate to members page
		await ownerPage.goto(`/home/${teamSlug}/members`);
		await ownerPage.waitForLoadState("networkidle");

		// Invite all members
		await invitations.openInviteForm();
		const invites = options.memberUsers.map((member) => ({
			email: TEST_USERS[member.user].email,
			role: member.role,
		}));
		await invitations.inviteMembers(invites);

		// Sign in as each member and accept invitation in separate contexts
		for (const member of options.memberUsers) {
			const memberContext = await browser.newContext();
			const memberPage = await memberContext.newPage();
			const memberUser = TEST_USERS[member.user];

			await signInUser(memberPage, memberUser);

			// Accept invitation
			await invitations.acceptInvitation();

			// Verify team membership
			await memberPage.waitForURL(`/home/${teamSlug}`, { timeout: 10000 });

			memberContexts.push({
				context: memberContext,
				page: memberPage,
				email: memberUser.email,
			});
		}
	}

	return {
		ownerContext,
		ownerPage,
		memberContexts,
		teamName,
		teamSlug,
	};
}

/**
 * Quick team setup for simple tests
 */
export async function quickTeamSetup(page: Page): Promise<{
	teamName: string;
	teamSlug: string;
	ownerEmail: string;
}> {
	const teamAccounts = new TeamAccountsPageObject(page);

	// Use a pre-defined test user
	const owner = TEST_USERS.owner1;
	await signInUser(page, owner);

	// Create team
	const random = Math.random().toString(36).substring(2, 15);
	const teamName = `quick-team-${random}`;
	const teamSlug = teamName.toLowerCase().replace(/ /g, "-");

	await teamAccounts.createTeam({ teamName, slug: teamSlug });

	return {
		teamName,
		teamSlug,
		ownerEmail: owner.email,
	};
}

/**
 * Cleanup helper to close all contexts
 */
export async function cleanup(contexts: BrowserContext[]): Promise<void> {
	for (const context of contexts) {
		await context.close();
	}
}
