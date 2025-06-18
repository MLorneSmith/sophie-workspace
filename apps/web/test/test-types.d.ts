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
  input: TInput
) => Promise<ActionResult<TOutput>>;

/**
 * Mock implementation of enhanceAction for tests
 * This matches the behavior of the actual enhanceAction wrapper
 */
export type MockEnhanceAction = <TInput = unknown, TOutput = unknown>(
  fn: (data: TInput, user?: any) => Promise<ActionResult<TOutput>>,
  options?: { schema?: any }
) => EnhancedAction<TInput, TOutput>;

/**
 * Type helper for asserting action results in tests
 */
export function assertActionResult<T>(
  result: unknown
): asserts result is ActionResult<T> {
  if (!result || typeof result !== 'object') {
    throw new Error('Invalid action result');
  }
  const r = result as Record<string, unknown>;
  if (!('success' in r)) {
    throw new Error('Action result missing success property');
  }
}

/**
 * Type guard for checking if result is successful
 */
export function isSuccessResult<T>(
  result: ActionResult<T>
): result is { success: true; data?: T } {
  return result.success === true;
}

/**
 * Type guard for checking if result is an error
 */
export function isErrorResult(
  result: ActionResult<any>
): result is { success: false; error: string } {
  return result.success === false;
}

/**
 * Utility type for extracting data type from action result
 */
export type ExtractActionData<T> = T extends ActionResult<infer D> ? D : never;

/**
 * Mock Supabase client type helper
 */
export type MockSupabaseClient = {
  from: import('vitest').Mock<any, any>;
  auth: {
    getUser: import('vitest').Mock<any, any>;
  };
  storage: {
    from: import('vitest').Mock<any, any>;
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
      implementation?: (data: TInput) => Promise<ActionResult<TOutput>>
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
import type { Mock } from 'vitest';

export type MockFunction<T extends (...args: any[]) => any> = Mock<T>;
export type MockedFunction<T extends (...args: any[]) => any> = MockFunction<T> & T;

/**
 * Type for mocked modules
 */
export type DeepMocked<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any
    ? MockedFunction<T[K]>
    : T[K] extends object
    ? DeepMocked<T[K]>
    : T[K];
};