/**
 * TypeScript type definitions for the @kit/admin package
 */

import type { Database } from "@kit/supabase/database";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Parameters for user ban action
 */
export interface BanUserParams {
	/** The UUID of the user to ban */
	userId: string;
}

/**
 * Parameters for user reactivation action
 */
export interface ReactivateUserParams {
	/** The UUID of the user to reactivate */
	userId: string;
}

/**
 * Parameters for user impersonation action
 */
export interface ImpersonateUserParams {
	/** The UUID of the user to impersonate */
	userId: string;
}

/**
 * Parameters for user deletion action
 */
export interface DeleteUserParams {
	/** The UUID of the user to delete */
	userId: string;
}

/**
 * Parameters for account deletion action
 */
export interface DeleteAccountParams {
	/** The UUID of the account to delete */
	accountId: string;
}

/**
 * Parameters for user creation action
 */
export interface CreateUserParams {
	/** The email address for the new user */
	email: string;
	/** The password for the new user account */
	password: string;
	/** Whether to auto-confirm the email address */
	emailConfirm: boolean;
}

/**
 * Parameters for password reset action
 */
export interface ResetPasswordParams {
	/** The UUID of the user whose password should be reset */
	userId: string;
}

/**
 * Result returned from successful admin actions
 */
export interface AdminActionResult {
	/** Whether the action completed successfully */
	success: boolean;
}

/**
 * Result returned from user creation action
 */
export interface CreateUserResult extends AdminActionResult {
	/** The created user object */
	user: {
		id: string;
		email?: string;
		created_at?: string;
	};
}

/**
 * Admin dashboard metrics data
 */
export interface AdminDashboardData {
	/** Total number of personal accounts */
	accounts: number;
	/** Total number of team accounts */
	teamAccounts: number;
	/** Number of active paid subscriptions */
	subscriptions: number;
	/** Number of active trial subscriptions */
	trials: number;
}

/**
 * Generic admin action wrapper function type
 */
export type AdminAction<TParams, TResult> = (
	params: TParams,
) => Promise<TResult>;

/**
 * Supabase client type with database schema
 */
export type AdminSupabaseClient = SupabaseClient<Database>;

/**
 * Component props type for admin-protected components
 */
export interface AdminComponentProps {
	/** Optional children to render */
	children?: React.ReactNode;
}

/**
 * HOC type for AdminGuard wrapper
 */
export type AdminGuardComponent<P = object> = React.ComponentType<P>;
