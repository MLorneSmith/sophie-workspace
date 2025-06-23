/**
 * Test helper utilities implementation
 *
 * Provides concrete implementations of the test helpers defined in test-types.d.ts
 */

import { vi } from "vitest";
import type {
	ActionResult,
	EnhancedAction,
	MockSupabaseClient,
} from "./test-types";

/**
 * Cast unknown result to ActionResult with runtime validation
 */
export function castActionResult<T>(result: unknown): ActionResult<T> {
	if (!result || typeof result !== "object") {
		throw new Error("Invalid action result: not an object");
	}

	const r = result as Record<string, unknown>;

	if (!("success" in r) || typeof r.success !== "boolean") {
		throw new Error(
			"Invalid action result: missing or invalid success property",
		);
	}

	if (r.success && "error" in r) {
		throw new Error(
			"Invalid action result: success=true should not have error property",
		);
	}

	if (!r.success && (!("error" in r) || typeof r.error !== "string")) {
		throw new Error(
			"Invalid action result: success=false must have error string",
		);
	}

	return result as ActionResult<T>;
}

/**
 * Create a mock Supabase client with proper typing
 */
export function createMockSupabaseClient(): MockSupabaseClient {
	const mockFrom = vi.fn().mockReturnValue({
		select: vi.fn().mockReturnThis(),
		insert: vi.fn().mockReturnThis(),
		update: vi.fn().mockReturnThis(),
		delete: vi.fn().mockReturnThis(),
		eq: vi.fn().mockReturnThis(),
		neq: vi.fn().mockReturnThis(),
		gt: vi.fn().mockReturnThis(),
		gte: vi.fn().mockReturnThis(),
		lt: vi.fn().mockReturnThis(),
		lte: vi.fn().mockReturnThis(),
		like: vi.fn().mockReturnThis(),
		ilike: vi.fn().mockReturnThis(),
		is: vi.fn().mockReturnThis(),
		in: vi.fn().mockReturnThis(),
		contains: vi.fn().mockReturnThis(),
		containedBy: vi.fn().mockReturnThis(),
		order: vi.fn().mockReturnThis(),
		limit: vi.fn().mockReturnThis(),
		range: vi.fn().mockReturnThis(),
		single: vi.fn().mockReturnThis(),
		maybeSingle: vi.fn().mockReturnThis(),
		throwOnError: vi.fn().mockReturnThis(),
		// Default resolved value
		// biome-ignore lint/suspicious/noThenProperty: This is a mock thenable object for testing
		then: vi.fn((onResolve) => onResolve({ data: null, error: null })),
	});

	const mockAuth = {
		getUser: vi.fn().mockResolvedValue({
			data: {
				user: {
					id: "test-user-id",
					email: "test@example.com",
					aud: "authenticated",
				},
			},
			error: null,
		}),
		getSession: vi.fn().mockResolvedValue({
			data: { session: null },
			error: null,
		}),
		signIn: vi.fn(),
		signOut: vi.fn(),
		signUp: vi.fn(),
	};

	const mockStorage = {
		from: vi.fn().mockReturnValue({
			upload: vi.fn().mockResolvedValue({
				data: { path: "test-path" },
				error: null,
			}),
			download: vi.fn().mockResolvedValue({
				data: new Blob(),
				error: null,
			}),
			remove: vi.fn().mockResolvedValue({
				data: [],
				error: null,
			}),
			getPublicUrl: vi.fn().mockReturnValue({
				data: { publicUrl: "https://example.com/test-file" },
			}),
		}),
	};

	return {
		from: mockFrom,
		auth: mockAuth,
		storage: mockStorage,
	} as unknown as MockSupabaseClient;
}

/**
 * Create a mock enhanced action with proper return types
 */
export function createMockAction<TInput, TOutput>(
	implementation?: (data: TInput) => Promise<ActionResult<TOutput>>,
): EnhancedAction<TInput, TOutput> {
	const defaultImplementation = async (): Promise<ActionResult<TOutput>> => ({
		success: true,
		data: undefined,
	});

	const mockFn = vi.fn(implementation || defaultImplementation);

	return mockFn as EnhancedAction<TInput, TOutput>;
}

/**
 * Create a successful action result
 */
export function successResult<T>(data?: T): ActionResult<T> {
	return { success: true, data };
}

/**
 * Create an error action result
 */
export function errorResult(error: string): ActionResult<never> {
	return { success: false, error };
}

/**
 * Assert that a result is successful and return the data
 */
export function expectSuccess<T>(result: ActionResult<T>): T | undefined {
	if (!result.success) {
		throw new Error(`Expected success but got error: ${result.error}`);
	}
	return result.data;
}

/**
 * Assert that a result is an error and return the error message
 */
export function expectError(result: ActionResult<unknown>): string {
	if (result.success) {
		throw new Error("Expected error but got success");
	}
	return result.error;
}

/**
 * Type helper for asserting action results in tests
 */
export function assertActionResult<T>(
	result: unknown,
): asserts result is ActionResult<T> {
	if (!result || typeof result !== "object") {
		throw new Error("Invalid action result");
	}
	const r = result as Record<string, unknown>;
	if (!("success" in r)) {
		throw new Error("Action result missing success property");
	}
}

/**
 * Type guard for checking if result is successful
 */
export function isSuccessResult<T>(
	result: ActionResult<T>,
): result is { success: true; data?: T } {
	return result.success === true;
}

/**
 * Type guard for checking if result is an error
 */
export function isErrorResult(
	result: ActionResult<unknown>,
): result is { success: false; error: string } {
	return result.success === false;
}

// Make helpers available globally as defined in test-types.d.ts
interface TestHelpersGlobal {
	TestHelpers: {
		castActionResult: typeof castActionResult;
		createMockSupabaseClient: typeof createMockSupabaseClient;
		createMockAction: typeof createMockAction;
	};
}

(globalThis as unknown as TestHelpersGlobal).TestHelpers = {
	castActionResult,
	createMockSupabaseClient,
	createMockAction,
};
