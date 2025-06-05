/**
 * Supabase client utilities for AI Gateway
 *
 * This module provides a centralized approach to getting a Supabase client
 * for AI Gateway operations, with proper error handling and fallbacks.
 * Enhanced with more comprehensive mock client implementation and admin support.
 */

// Type definition for the Supabase client
export type SupabaseClient = any;

/**
 * Create a mock Supabase client with all necessary methods implemented
 * This is used as a fallback when the real client can't be initialized
 */
function createMockClient(): SupabaseClient {
	return {
		// Table operations
		from: (table: string) => ({
			// Insert operations
			insert: (data: any) => ({
				select: (columns: string) => ({
					single: () => ({ data: null, error: null }),
				}),
			}),
			// Select operations
			select: (columns?: string) => ({
				eq: (column: string, value: any) => ({
					single: () => ({ data: null, error: null }),
					order: () => ({ limit: () => ({ data: null, error: null }) }),
				}),
				order: () => ({ limit: () => ({ data: null, error: null }) }),
				limit: () => ({ data: null, error: null }),
				single: () => ({ data: null, error: null }),
				data: null,
				error: null,
			}),
			// Update operations
			update: (data: any) => ({
				eq: () => ({ data: null, error: null }),
				match: () => ({ data: null, error: null }),
				data: null,
				error: null,
			}),
			// Delete operations
			delete: () => ({
				eq: () => ({ data: null, error: null }),
				match: () => ({ data: null, error: null }),
				data: null,
				error: null,
			}),
		}),
		// RPC calls
		rpc: (func: string, params?: any) => ({ data: null, error: null }),
		// Schema operations
		schema: (schema: string) => ({
			from: (table: string) => ({
				select: (columns?: string) => ({ data: null, error: null }),
				insert: (data: any) => ({ data: null, error: null }),
				update: (data: any) => ({ data: null, error: null }),
				delete: () => ({ data: null, error: null }),
			}),
		}),
		// Auth related methods (minimal implementation)
		auth: {
			getUser: () => Promise.resolve({ data: { user: null }, error: null }),
			getSession: () =>
				Promise.resolve({ data: { session: null }, error: null }),
		},
	};
}

/**
 * Get a Supabase client for server operations
 * Uses dynamic import to avoid circular dependencies and module resolution issues
 * Enhanced with admin client support
 *
 * @param options Configuration options
 * @returns Promise<SupabaseClient> A Supabase client instance
 */
export async function getSupabaseClient(
	options: { admin?: boolean } = {},
): Promise<SupabaseClient> {
	try {
		// Determine whether to use the admin client based on options
		if (options.admin) {
			// Use the admin client for privileged operations
			try {
				const { getSupabaseServerAdminClient } = await import(
					"@kit/supabase/server-admin-client"
				);

				console.log(
					"Getting Supabase admin client for privileged AI gateway operations",
				);

				const adminClient = getSupabaseServerAdminClient();

				// Verify the admin client has minimal required functions
				if (
					!adminClient ||
					typeof adminClient.from !== "function" ||
					typeof adminClient.rpc !== "function"
				) {
					console.warn(
						"Invalid Supabase admin client received, using mock client instead",
					);
					return createMockClient();
				}

				// Test admin client connection
				try {
					const { error } = await adminClient
						.from("ai_cost_configuration")
						.select("id")
						.limit(1);

					if (error) {
						console.error("Supabase admin client connection test failed:", {
							error,
							errorMessage: error.message,
							errorCode: error.code,
							details: error.details,
						});
						return createMockClient();
					}

					console.log("Supabase admin client successfully connected");
					return adminClient;
				} catch (adminConnectionError) {
					console.error(
						"Error testing Supabase admin connection:",
						adminConnectionError,
					);
					return createMockClient();
				}
			} catch (adminImportError) {
				console.error(
					"Error importing Supabase admin client:",
					adminImportError,
				);
				return createMockClient();
			}
		}

		// Use the regular server client for normal operations
		const { getSupabaseServerClient } = await import(
			"@kit/supabase/server-client"
		);

		// Log authentication context for debugging
		console.log("Getting Supabase client for AI gateway usage tracking");

		const client = getSupabaseServerClient();

		// Verify the client has minimal required functions before returning
		if (
			!client ||
			typeof client.from !== "function" ||
			typeof client.rpc !== "function"
		) {
			console.warn(
				"Invalid Supabase client received, using mock client instead",
			);
			return createMockClient();
		}

		// Test connection with a simple query
		try {
			const { data, error } = await client
				.from("ai_cost_configuration")
				.select("id")
				.limit(1);

			if (error) {
				console.error("Supabase client connection test failed:", {
					error,
					errorMessage: error.message,
					errorCode: error.code,
					details: error.details,
				});
				return createMockClient();
			}

			console.log("Supabase client successfully connected");
			return client;
		} catch (connectionError) {
			console.error("Error testing Supabase connection:", connectionError);
			return createMockClient();
		}
	} catch (error) {
		console.error("Error getting Supabase client:", error);
		// Return a more comprehensive mock client for environments where Supabase isn't available
		return createMockClient();
	}
}
