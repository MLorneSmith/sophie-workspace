import type { Database } from "@kit/supabase/database";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Checks if the current authenticated user has super-admin privileges.
 *
 * This function calls the `is_super_admin` RPC function in the database to determine
 * if the authenticated user has administrative access. It safely handles errors by
 * returning false if the check fails.
 *
 * @param {SupabaseClient<Database>} client - An initialized Supabase client with an authenticated session
 * @returns {Promise<boolean>} True if the user is a super-admin, false otherwise
 * @throws Never - Errors are caught and return false
 *
 * @example
 * ```typescript
 * import { isSuperAdmin } from '@kit/admin';
 * import { getSupabaseServerClient } from '@kit/supabase/server-client';
 *
 * const client = getSupabaseServerClient();
 * const isAdmin = await isSuperAdmin(client);
 *
 * if (!isAdmin) {
 *   throw new Error('Unauthorized: Admin access required');
 * }
 * ```
 */
export async function isSuperAdmin(client: SupabaseClient<Database>) {
	try {
		const { data, error } = await client.rpc("is_super_admin");

		if (error) {
			throw error;
		}

		return data;
	} catch {
		return false;
	}
}
