/**
 * Global type definitions for test files
 *
 * This file provides standardized type definitions for testing patterns
 * used throughout the application, particularly for server actions and
 * mock utilities.
 */

/**
 * Standard action result type used across all server actions
 * Following the established pattern in the codebase
 */
export type ActionResult<TData = unknown> =
	| { success: true; data?: TData }
	| { success: false; error: string };

/**
 * Enhanced action function type that matches the actual enhanceAction behavior
 */
export type EnhancedAction<TInput = unknown, TOutput = unknown> = (
	input: TInput,
) => Promise<ActionResult<TOutput>>;

/**
 * Mock implementation of enhanceAction for tests
 * This matches the behavior of the actual enhanceAction wrapper
 */
export type MockEnhanceAction = <TInput = unknown, TOutput = unknown>(
	fn: (data: TInput, user?: unknown) => Promise<ActionResult<TOutput>>,
	options?: { schema?: unknown },
) => EnhancedAction<TInput, TOutput>;

/**
 * Type helper for asserting action results in tests
 */
export declare function assertActionResult<T>(
	result: unknown,
): asserts result is ActionResult<T>;

/**
 * Type guard for checking if result is successful
 */
export declare function isSuccessResult<T>(
	result: ActionResult<T>,
): result is { success: true; data?: T };

/**
 * Type guard for checking if result is an error
 */
export declare function isErrorResult(
	result: ActionResult<unknown>,
): result is { success: false; error: string };

/**
 * Utility type for extracting data type from action result
 */
export type ExtractActionData<T> = T extends ActionResult<infer D> ? D : never;

/**
 * Mock Supabase client type helper
 */
export type MockSupabaseClient = {
	from: import("vitest").Mock<unknown[], unknown>;
	auth: {
		getUser: import("vitest").Mock<unknown[], unknown>;
	};
	storage: {
		from: import("vitest").Mock<unknown[], unknown>;
	};
};

/**
 * Global test helpers namespace
 */
declare global {
	namespace TestHelpers {
		/**
		 * Cast unknown result to ActionResult with type safety
		 */
		function castActionResult<T>(result: unknown): ActionResult<T>;

		/**
		 * Create a mock Supabase client with proper typing
		 */
		function createMockSupabaseClient(): MockSupabaseClient;

		/**
		 * Create a mock enhanced action with proper return types
		 */
		function createMockAction<TInput, TOutput>(
			implementation?: (data: TInput) => Promise<ActionResult<TOutput>>,
		): EnhancedAction<TInput, TOutput>;
	}
}

/**
 * Common test data types
 */
export interface TestUser {
	id: string;
	email: string;
	aud?: string;
}

/**
 * Vitest mock type extensions
 */
import type { Mock } from "vitest";

export type MockFunction<T extends (...args: unknown[]) => unknown> = Mock<T>;
export type MockedFunction<T extends (...args: unknown[]) => unknown> =
	MockFunction<T> & T;

/**
 * Type for mocked modules
 */
export type DeepMocked<T> = {
	[K in keyof T]: T[K] extends (...args: unknown[]) => unknown
		? MockedFunction<T[K]>
		: T[K] extends object
			? DeepMocked<T[K]>
			: T[K];
};
