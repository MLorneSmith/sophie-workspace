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
