import { getSupabaseServerClient } from "@kit/supabase/server-client";
import { notFound } from "next/navigation";

import { isSuperAdmin } from "./is-super-admin";

/**
 * Higher-order function that wraps a server action to enforce super-admin access control.
 *
 * This utility ensures that only users with super-admin privileges can execute the wrapped
 * function. Non-admin users receive a 404 response (not found) to avoid revealing the
 * existence of admin endpoints.
 *
 * @template Args - The type of arguments the wrapped function accepts
 * @template Response - The return type of the wrapped function
 * @param {(params: Args) => Response} fn - The server action function to protect with admin authentication
 * @returns {(params: Args) => Promise<Response>} An async function that checks admin status before executing
 *
 * @example
 * ```typescript
 * import { adminAction } from '@kit/admin/utils/admin-action';
 *
 * // Create an admin-only server action
 * const deleteAllUsers = adminAction(async (params: { confirm: boolean }) => {
 *   if (!params.confirm) {
 *     throw new Error('Confirmation required');
 *   }
 *
 *   // This code only runs if user is super-admin
 *   await deleteUsers();
 *   return { success: true };
 * });
 *
 * // Usage - non-admins get 404
 * await deleteAllUsers({ confirm: true });
 * ```
 */
export function adminAction<Args, Response>(fn: (params: Args) => Response) {
	return async (params: Args) => {
		const isAdmin = await isSuperAdmin(getSupabaseServerClient());

		if (!isAdmin) {
			notFound();
		}

		return fn(params);
	};
}
