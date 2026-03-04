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
 * @param useServiceRole - If true, uses service role key for admin access
 */
function getSupabaseClient(useServiceRole: boolean = false) {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

	if (!url) {
		throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
	}

	if (useServiceRole) {
		const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
		if (!serviceKey) {
			throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
		}
		return createClient(url, serviceKey, {
			auth: {
				autoRefreshToken: false,
				persistSession: false,
			},
		});
	}

	const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
	if (!anonKey) {
		throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY");
	}

	return createClient(url, anonKey);
}

/**
 * Check if a user has any role on an account
 * Queries the account_user table directly using service role for explicit authorization
 *
 * @param userId - The user ID to check
 * @param accountId - The account ID to check access for
 * @returns Promise resolving to true if user has access
 */
async function userHasRoleOnAccount(
	userId: string,
	accountId: string,
): Promise<boolean> {
	// Use service role client to query account_user table directly
	const supabase = getSupabaseClient(true);

	const { data, error } = await supabase
		.from("account_user")
		.select("id")
		.eq("account_id", accountId)
		.eq("user_id", userId)
		.limit(1);

	if (error) {
		// biome-ignore lint/suspicious/noConsole: RAG authorization - intentional console usage
		console.error("[RAG Auth] Account membership check failed", {
			accountId,
			userId,
			error,
		});
		return false;
	}

	return (data?.length ?? 0) > 0;
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

	// Add user ID filter for personal content types or when no content types specified.
	// Personal content types require userId filtering: user-upload, deck-history
	// Account-scoped content (research-corpus) and global content (playbook) should not be filtered by userId.
	// When contentTypes is undefined/null, we MUST apply userId filter as a safety default
	// to prevent unfiltered cross-tenant queries.
	const personalContentTypes = ["user-upload", "deck-history"];
	const hasExplicitTypes =
		contentTypes !== undefined &&
		contentTypes !== null &&
		contentTypes.length > 0;
	const includesPersonalType = hasExplicitTypes
		? contentTypes.some((type) => personalContentTypes.includes(type))
		: true; // Treat unspecified content types as potentially personal

	// Set userId filter when content types are unspecified or include personal types
	if (includesPersonalType) {
		filters.userId = userId;
	}

	// Add content type filter if specified
	if (contentTypes && contentTypes.length > 0) {
		filters.contentType = contentTypes;
	}

	return {
		filters,
		authorization,
	};
}
