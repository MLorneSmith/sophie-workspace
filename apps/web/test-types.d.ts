/**
 * Test type definitions for resolving TypeScript compilation errors
 */

// Common action result types for test files
export type ActionResult<T = unknown> =
	| { success: true; data?: T }
	| { success: false; error: string };

export type SimpleActionResult = { success: true } | { error: string };

export type OutlineActionResult =
	| { success: true; data: { message: string } }
	| { error: string };

export type SimplifyTextResult =
	| { success: true; response: unknown }
	| { success: false; error: string };

// Global test helper to cast action results
declare global {
	namespace TestHelpers {
		function castActionResult<T>(result: unknown): ActionResult<T>;
		function castSimpleResult(result: unknown): SimpleActionResult;
	}
}
