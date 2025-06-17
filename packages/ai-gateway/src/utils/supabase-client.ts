import { createServiceLogger } from "@kit/shared/logger";

// Initialize service logger
const { getLogger } = createServiceLogger("AI-GATEWAY");

/**
 * Supabase client utilities for AI Gateway
 *
 * This module provides a centralized approach to getting a Supabase client
 * for AI Gateway operations, with proper error handling and fallbacks.
 * Enhanced with more comprehensive mock client implementation and admin support.
 */

// Type definition for the Supabase client
type SupabaseResponse<T = unknown> = {
	data: T | null;
	error: { message: string; code?: string; details?: string } | null;
};

type SupabaseQueryBuilder = {
	select: (columns?: string) => SupabaseQueryBuilder;
	eq: (column: string, value: unknown) => SupabaseQueryBuilder;
	single: () => SupabaseResponse;
	order: (column?: string) => SupabaseQueryBuilder;
	limit: (count: number) => SupabaseResponse;
	data: unknown;
	error: unknown;
};

type SupabaseClient = {
	from: (table: string) => {
		insert: (data: Record<string, unknown>) => {
			select: (columns: string) => {
				single: () => SupabaseResponse;
			};
		};
		select: (columns?: string) => SupabaseQueryBuilder;
		update: (data: Record<string, unknown>) => SupabaseQueryBuilder;
		delete: () => SupabaseQueryBuilder;
	};
	rpc: (func: string, params?: Record<string, unknown>) => SupabaseResponse;
	schema: (schema: string) => {
		from: (table: string) => {
			select: (columns?: string) => SupabaseResponse;
			insert: (data: Record<string, unknown>) => SupabaseResponse;
			update: (data: Record<string, unknown>) => SupabaseResponse;
			delete: () => SupabaseResponse;
		};
	};
	auth: {
		getUser: () => Promise<SupabaseResponse>;
		getSession: () => Promise<SupabaseResponse>;
	};
};

export type { SupabaseClient };

/**
 * Create a mock Supabase client with all necessary methods implemented
 * This is used as a fallback when the real client can't be initialized
 */
function createMockClient(): SupabaseClient {
	return {
		// Table operations
		from: (_table: string) => ({
			// Insert operations
			insert: (_data: Record<string, unknown>) => ({
				select: (_columns: string) => ({
					single: () => ({ data: null, error: null }),
				}),
			}),
			// Select operations
			select: (_columns?: string) => ({
				eq: (_column: string, _value: unknown) => ({
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
			update: (_data: Record<string, unknown>) => ({
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
		rpc: (_func: string, _params?: Record<string, unknown>) => ({
			data: null,
			error: null,
		}),
		// Schema operations
		schema: (_schema: string) => ({
			from: (_table: string) => ({
				select: (_columns?: string) => ({ data: null, error: null }),
				insert: (_data: Record<string, unknown>) => ({
					data: null,
					error: null,
				}),
				update: (_data: Record<string, unknown>) => ({
					data: null,
					error: null,
				}),
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

				(await getLogger()).info(
					"Getting Supabase admin client for privileged AI gateway operations",
				);

				const adminClient = getSupabaseServerAdminClient();

				// Verify the admin client has minimal required functions
				if (
					!adminClient ||
					typeof adminClient.from !== "function" ||
					typeof adminClient.rpc !== "function"
				) {
					(await getLogger()).warn(
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
						(await getLogger()).error(
							"Supabase admin client connection test failed:",
							{
								error,
								errorMessage: error.message,
								errorCode: error.code,
								details: error.details,
							},
						);
						return createMockClient();
					}

					(await getLogger()).info(
						"Supabase admin client successfully connected",
					);
					return adminClient;
				} catch (adminConnectionError) {
					(await getLogger()).error(
						"Error testing Supabase admin connection:",
						{ data: adminConnectionError },
					);
					return createMockClient();
				}
			} catch (adminImportError) {
				(await getLogger()).error("Error importing Supabase admin client:", {
					data: adminImportError,
				});
				return createMockClient();
			}
		}

		// Use the regular server client for normal operations
		const { getSupabaseServerClient } = await import(
			"@kit/supabase/server-client"
		);

		// Log authentication context for debugging
		(await getLogger()).info(
			"Getting Supabase client for AI gateway usage tracking",
		);

		const client = getSupabaseServerClient();

		// Verify the client has minimal required functions before returning
		if (
			!client ||
			typeof client.from !== "function" ||
			typeof client.rpc !== "function"
		) {
			(await getLogger()).warn(
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
				(await getLogger()).error("Supabase client connection test failed:", {
					error,
					errorMessage: error.message,
					errorCode: error.code,
					details: error.details,
				});
				return createMockClient();
			}

			(await getLogger()).info("Supabase client successfully connected");
			return client;
		} catch (connectionError) {
			(await getLogger()).error("Error testing Supabase connection:", {
				data: connectionError,
			});
			return createMockClient();
		}
	} catch (error) {
		(await getLogger()).error("Error getting Supabase client:", {
			data: error,
		});
		// Return a more comprehensive mock client for environments where Supabase isn't available
		return createMockClient();
	}
}
