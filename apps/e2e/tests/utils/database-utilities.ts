/**
 * Database Utilities for E2E Tests
 *
 * Provides direct database access utilities for test cleanup and state restoration.
 * Uses the Supabase config loader to dynamically fetch database connection details.
 *
 * @module database-utilities
 */

import { getSupabaseConfig } from "./supabase-config-loader";

// Original password hash from seed file: apps/web/supabase/seeds/01_main_seed.sql
// Password: aiesec1992
// Hash generated with: SELECT crypt('aiesec1992', gen_salt('bf', 10))
const ORIGINAL_PASSWORD_HASH =
	"$2a$10$HnRa4VckSRWnYpgTXkrd4.x.IGVeYdqJ8V3nlwECk8cnDvIWBBjl6";

/**
 * Retrieves the current password hash for a user from the auth.users table.
 *
 * @param email - The email of the user to query
 * @returns The encrypted password hash, or null if user not found
 */
export async function getPasswordHashFromDatabase(
	email: string,
): Promise<string | null> {
	const { Client } = await import("pg");
	const config = getSupabaseConfig();

	const client = new Client({
		connectionString: config.DB_URL,
	});

	try {
		await client.connect();

		const result = await client.query<{ encrypted_password: string }>(
			"SELECT encrypted_password FROM auth.users WHERE email = $1",
			[email],
		);

		if (result.rows.length === 0) {
			return null;
		}

		return result.rows[0].encrypted_password;
	} finally {
		await client.end();
	}
}

/**
 * Updates the password hash for a user directly in the auth.users table.
 * Use this for restoring original password state after tests.
 *
 * @param email - The email of the user to update
 * @param hash - The password hash to set
 * @returns True if update was successful, false if user not found
 */
export async function updatePasswordHashInDatabase(
	email: string,
	hash: string,
): Promise<boolean> {
	const { Client } = await import("pg");
	const config = getSupabaseConfig();

	const client = new Client({
		connectionString: config.DB_URL,
	});

	try {
		await client.connect();

		const result = await client.query(
			"UPDATE auth.users SET encrypted_password = $1, updated_at = now() WHERE email = $2",
			[hash, email],
		);

		return (result.rowCount ?? 0) > 0;
	} finally {
		await client.end();
	}
}

/**
 * Restores the original password hash for a test user.
 * This is the hash from the seed file (password: aiesec1992).
 *
 * @param email - The email of the user to restore (default: test1@slideheroes.com)
 * @returns True if restoration was successful
 */
export async function restoreOriginalPassword(
	email = "test1@slideheroes.com",
): Promise<boolean> {
	return updatePasswordHashInDatabase(email, ORIGINAL_PASSWORD_HASH);
}

/**
 * Gets the original password hash constant.
 * Useful for comparison in tests.
 */
export function getOriginalPasswordHash(): string {
	return ORIGINAL_PASSWORD_HASH;
}

/**
 * Unbans a user by setting their banned_until to null.
 * Used for test cleanup after ban user flow tests.
 *
 * @param email - The email of the user to unban
 * @returns True if the user was found and unbanned, false otherwise
 */
export async function unbanUser(email: string): Promise<boolean> {
	const { Client } = await import("pg");
	const config = getSupabaseConfig();

	const client = new Client({
		connectionString: config.DB_URL,
	});

	try {
		await client.connect();

		const result = await client.query(
			"UPDATE auth.users SET banned_until = NULL, updated_at = now() WHERE email = $1",
			[email],
		);

		return (result.rowCount ?? 0) > 0;
	} finally {
		await client.end();
	}
}

/**
 * Removes test team memberships for a user.
 * This is used before deleting a user to avoid referential integrity errors.
 * Keeps the user's membership in SlideHeroes Team (the seeded team).
 *
 * @param email - The email of the user whose test teams should be removed
 * @returns Object with number of memberships removed and teams deleted
 */
export async function removeTestTeamMemberships(
	email: string,
): Promise<{ membershipsRemoved: number; teamsDeleted: number }> {
	const { Client } = await import("pg");
	const config = getSupabaseConfig();

	const client = new Client({
		connectionString: config.DB_URL,
	});

	try {
		await client.connect();

		// First, get the user's ID
		const userResult = await client.query<{ id: string }>(
			"SELECT id FROM auth.users WHERE email = $1",
			[email],
		);

		if (userResult.rows.length === 0) {
			return { membershipsRemoved: 0, teamsDeleted: 0 };
		}

		const userId = userResult.rows[0].id;

		// Find all test teams where the user is a member (teams starting with 'test-')
		// Exclude the SlideHeroes Team which is the seeded team
		const testTeamsResult = await client.query<{ account_id: string }>(
			`SELECT am.account_id
       FROM public.accounts_memberships am
       JOIN public.accounts a ON am.account_id = a.id
       WHERE am.user_id = $1
       AND a.is_personal_account = false
       AND a.name LIKE 'test-%'`,
			[userId],
		);

		const testTeamIds = testTeamsResult.rows.map((row) => row.account_id);

		if (testTeamIds.length === 0) {
			return { membershipsRemoved: 0, teamsDeleted: 0 };
		}

		// Remove memberships
		const membershipResult = await client.query(
			`DELETE FROM public.accounts_memberships
       WHERE account_id = ANY($1::uuid[])`,
			[testTeamIds],
		);
		const membershipsRemoved = membershipResult.rowCount ?? 0;

		// Delete the test team accounts
		// The accounts table has ON DELETE CASCADE for related records
		const accountResult = await client.query(
			`DELETE FROM public.accounts
       WHERE id = ANY($1::uuid[])`,
			[testTeamIds],
		);
		const teamsDeleted = accountResult.rowCount ?? 0;

		return { membershipsRemoved, teamsDeleted };
	} finally {
		await client.end();
	}
}

/**
 * Removes ALL team memberships for a user (except personal account).
 * This is a more aggressive cleanup used when you need to delete a user completely.
 * WARNING: This will remove the user from ALL teams including SlideHeroes Team.
 *
 * @param email - The email of the user whose team memberships should be removed
 * @returns Object with number of memberships removed and orphan teams deleted
 */
export async function removeAllTeamMemberships(
	email: string,
): Promise<{ membershipsRemoved: number; teamsDeleted: number }> {
	const { Client } = await import("pg");
	const config = getSupabaseConfig();

	const client = new Client({
		connectionString: config.DB_URL,
	});

	try {
		await client.connect();

		// First, get the user's ID
		const userResult = await client.query<{ id: string }>(
			"SELECT id FROM auth.users WHERE email = $1",
			[email],
		);

		if (userResult.rows.length === 0) {
			return { membershipsRemoved: 0, teamsDeleted: 0 };
		}

		const userId = userResult.rows[0].id;

		// Find all team accounts (non-personal) where the user is a member
		const teamsResult = await client.query<{
			account_id: string;
			member_count: string;
		}>(
			`SELECT am.account_id,
              (SELECT COUNT(*) FROM public.accounts_memberships
               WHERE account_id = am.account_id) as member_count
       FROM public.accounts_memberships am
       JOIN public.accounts a ON am.account_id = a.id
       WHERE am.user_id = $1
       AND a.is_personal_account = false`,
			[userId],
		);

		const teamIds = teamsResult.rows.map((row) => row.account_id);

		if (teamIds.length === 0) {
			return { membershipsRemoved: 0, teamsDeleted: 0 };
		}

		// Remove user's memberships from all teams
		const membershipResult = await client.query(
			`DELETE FROM public.accounts_memberships
       WHERE user_id = $1 AND account_id = ANY($2::uuid[])`,
			[userId, teamIds],
		);
		const membershipsRemoved = membershipResult.rowCount ?? 0;

		// Delete teams where user was the only member (orphaned teams)
		// Re-check member counts after removal
		const orphanedTeamsResult = await client.query(
			`DELETE FROM public.accounts
       WHERE id = ANY($1::uuid[])
       AND id NOT IN (
         SELECT DISTINCT account_id FROM public.accounts_memberships
       )
       RETURNING id`,
			[teamIds],
		);
		const teamsDeleted = orphanedTeamsResult.rowCount ?? 0;

		return { membershipsRemoved, teamsDeleted };
	} finally {
		await client.end();
	}
}

/**
 * Get user ID by email from auth.users table.
 *
 * @param email - The email of the user
 * @returns The user ID or null if not found
 */
export async function getUserIdByEmail(email: string): Promise<string | null> {
	const { Client } = await import("pg");
	const config = getSupabaseConfig();

	const client = new Client({
		connectionString: config.DB_URL,
	});

	try {
		await client.connect();

		const result = await client.query<{ id: string }>(
			"SELECT id FROM auth.users WHERE email = $1",
			[email],
		);

		if (result.rows.length === 0) {
			return null;
		}

		return result.rows[0].id;
	} finally {
		await client.end();
	}
}

/**
 * Unlocks a Payload CMS user by clearing their lockUntil timestamp and resetting login attempts.
 * Use this before auth tests to prevent lockout from accumulated failed attempts.
 *
 * @param email - The email of the Payload user to unlock
 * @returns True if a user was found and updated, false if user not found
 */
export async function unlockPayloadUser(email: string): Promise<boolean> {
	const { Client } = await import("pg");
	const config = getSupabaseConfig();

	const client = new Client({
		connectionString: config.DB_URL,
	});

	try {
		await client.connect();

		const result = await client.query(
			`UPDATE payload.users
			 SET lock_until = NULL, login_attempts = 0, updated_at = NOW()
			 WHERE email = $1`,
			[email],
		);

		const updated = (result.rowCount ?? 0) > 0;
		if (updated) {
			console.log(`[database-utilities] Unlocked Payload user: ${email}`);
		}

		return updated;
	} finally {
		await client.end();
	}
}
