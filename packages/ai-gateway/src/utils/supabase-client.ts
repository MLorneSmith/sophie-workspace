/**
 * Supabase client utilities for AI Gateway
 *
 * This module provides a centralized approach to getting a Supabase client
 * for AI Gateway operations, with proper error handling and fallbacks.
 * Enhanced with more comprehensive mock client implementation.
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
 */
export async function getSupabaseClient(): Promise<SupabaseClient> {
  try {
    // Dynamically import to avoid circular dependencies and TypeScript errors
    const { getSupabaseServerClient } = await import(
      '@kit/supabase/server-client'
    );

    const client = getSupabaseServerClient();

    // Verify the client has minimal required functions before returning
    if (
      !client ||
      typeof client.from !== 'function' ||
      typeof client.rpc !== 'function'
    ) {
      console.warn(
        'Invalid Supabase client received, using mock client instead',
      );
      return createMockClient();
    }

    return client;
  } catch (error) {
    console.error('Error getting Supabase client:', error);
    // Return a more comprehensive mock client for environments where Supabase isn't available
    return createMockClient();
  }
}
