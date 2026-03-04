"use server";

/**
 * RAG Authorization Service
 *
 * Provides authorization checks for multi-tenant RAG queries.
 * Validates user access to accounts and determines appropriate filters.
 */

import { createClient } from "@supabase/supabase-js";

/**
 * Authorization result containing validated query context
 */
export interface RAGAuthorizationResult {
	/** Whether the user is authorized */
	authorized: boolean;
	/** Error message if not authorized */
	error?: string;
	/** The account ID to filter by (if user has access) */
	accountId?: string;
	/** The user ID making the query */
	userId: string;
	/** Whether the user has access to global content (playbooks) */
	hasGlobalAccess: boolean;
}

/**
 * Get Supabase client for authorization checks
 */
function getSupabaseClient() {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

	if (!url || !anonKey) {
		throw new Error(
			"Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
		);
	}

	return createClient(url, anonKey);
}

/**
 * Check if a user has any role on an account
 * Uses the database function has_role_on_account
 *
 * @param userId - The user ID to check
 * @param accountId - The account ID to check access for
 * @returns Promise resolving to true if user has access
 */
async function userHasRoleOnAccount(
	userId: string,
	accountId: string,
): Promise<boolean> {
	const supabase = getSupabaseClient();

	const { data, error } = await supabase.rpc("has_role_on_account", {
		account_id: accountId,
		account_role: null, // Any role
	});

	if (error) {
		// Log error appropriately in production
		return false;
	}

	return data ?? false;
}

/**
 * Check if a user is the primary owner of an account
 *
 * @param userId - The user ID to check
 * @param accountId - The account ID to check
 * @returns Promise resolving to true if user is primary owner
 */
async function userIsAccountOwner(
	userId: string,
	accountId: string,
): Promise<boolean> {
	const supabase = getSupabaseClient();

	const { data: account, error } = await supabase
		.from("accounts")
		.select("primary_owner_user_id")
		.eq("id", accountId)
		.single();

	if (error || !account) {
		return false;
	}

	return account.primary_owner_user_id === userId;
}

/**
 * Check if a user has access to global content (playbooks)
 * For now, all authenticated users have access to playbooks
 *
 * @param userId - The user ID to check
 * @returns Promise resolving to true if user has global access
 */
async function userHasGlobalAccess(_userId: string): Promise<boolean> {
	// TODO: Implement actual global content access logic
	// For now, all authenticated users can access playbooks
	return true;
}

/**
 * Authorize a RAG query request
 *
 * Validates that the user has appropriate access to perform a RAG query.
 * Returns the authorized context to use for filtering.
 *
 * @param userId - The ID of the user making the query
 * @param requestedAccountId - The account ID to scope the query to (optional)
 * @returns Promise resolving to authorization result with context for filtering
 */
export async function authorizeRAGQuery(
	userId: string,
	requestedAccountId?: string,
): Promise<RAGAuthorizationResult> {
	// If no account specified, user can query their own content
	// and global content (playbooks)
	if (!requestedAccountId) {
		return {
			authorized: true,
			userId,
			hasGlobalAccess: await userHasGlobalAccess(userId),
		};
	}

	// Check if user has access to the requested account
	const hasRole = await userHasRoleOnAccount(userId, requestedAccountId);
	const isOwner = await userIsAccountOwner(userId, requestedAccountId);

	if (!hasRole && !isOwner) {
		return {
			authorized: false,
			error: `User does not have access to account ${requestedAccountId}`,
			userId,
			hasGlobalAccess: await userHasGlobalAccess(userId),
		};
	}

	// User has access to the account
	return {
		authorized: true,
		accountId: requestedAccountId,
		userId,
		hasGlobalAccess: await userHasGlobalAccess(userId),
	};
}

/**
 * Get filter options for a RAG query based on user authorization
 *
 * @param userId - The ID of the user making the query
 * @param requestedAccountId - The account ID to scope the query to (optional)
 * @param contentTypes - Optional content types to filter by
 * @returns Promise resolving to filter options and authorization result
 */
export async function getRAGFilters(
	userId: string,
	requestedAccountId?: string,
	contentTypes?: string[],
): Promise<{
	filters: {
		accountId?: string;
		userId?: string;
		contentType?: string[];
	};
	authorization: RAGAuthorizationResult;
}> {
	const authorization = await authorizeRAGQuery(userId, requestedAccountId);

	if (!authorization.authorized) {
		return {
			filters: {},
			authorization,
		};
	}

	// Build filter options based on authorization
	const filters: {
		accountId?: string;
		userId?: string;
		contentType?: string[];
	} = {};

	// Add account filter if user has account access
	if (authorization.accountId) {
		filters.accountId = authorization.accountId;
	}

	// Add user ID for personal content
	filters.userId = userId;

	// Add content type filter if specified
	if (contentTypes && contentTypes.length > 0) {
		filters.contentType = contentTypes;
	}

	return {
		filters,
		authorization,
	};
}
