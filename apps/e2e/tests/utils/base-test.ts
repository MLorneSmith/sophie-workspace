/**
 * Base test fixture with Docker hostname resolution fix
 *
 * This fixture extends the default Playwright test to add route interception
 * that rewrites requests from `host.docker.internal` to `127.0.0.1`.
 *
 * Problem:
 * - Server-side: Docker containers resolve `host.docker.internal` to reach Supabase on host
 * - Browser-side: Browsers cannot resolve `host.docker.internal` (Docker-specific hostname)
 * - Result: E2E tests timeout when browser makes requests to Supabase
 *
 * Solution:
 * Transparently rewrite all browser requests from `host.docker.internal` to `127.0.0.1`
 * using Playwright's route interception API.
 *
 * Usage:
 * Import { test, expect } from '../utils/base-test' instead of '@playwright/test'
 *
 * @see Issue #1133 - E2E Browser-Server URL Conflict diagnosis
 * @see Issue #1134 - Bug fix implementation
 */

import { readFileSync } from "node:fs";
import { test as baseTest, expect } from "@playwright/test";

/**
 * Debug logging flag for Docker URL rewriting
 * Set DEBUG_E2E_DOCKER=true to see rewrite logs
 */
const DEBUG_E2E_DOCKER = process.env.DEBUG_E2E_DOCKER === "true";

/**
 * Log Docker URL rewriting debug info
 */
function debugLog(context: string, data: Record<string, unknown>) {
	if (DEBUG_E2E_DOCKER) {
		console.log(`[DEBUG_E2E_DOCKER:${context}]`, JSON.stringify(data, null, 2));
	}
}

/**
 * Custom test fixture that adds route interception for Docker hostname resolution
 *
 * This fixture automatically rewrites browser requests to `host.docker.internal`
 * to `127.0.0.1`, allowing browsers to reach services that are configured with
 * Docker-specific hostnames.
 */
export const test = baseTest.extend({
	// Override the page fixture to add route interception
	page: async ({ page }, use) => {
		// Set up route interception for host.docker.internal URLs
		// Using a more explicit URL pattern to ensure matching
		// The pattern matches any request to host.docker.internal on any port
		await page.route(/host\.docker\.internal/, async (route) => {
			const request = route.request();
			const originalUrl = request.url();

			// Rewrite host.docker.internal to 127.0.0.1
			const rewrittenUrl = originalUrl.replace(
				/host\.docker\.internal/g,
				"127.0.0.1",
			);

			debugLog("route:rewrite", {
				original: originalUrl,
				rewritten: rewrittenUrl,
				method: request.method(),
				resourceType: request.resourceType(),
			});

			// Continue the request with the rewritten URL
			try {
				await route.continue({
					url: rewrittenUrl,
				});
			} catch (error) {
				// If route.continue fails (e.g., request already handled), log and ignore
				debugLog("route:continue_error", {
					url: originalUrl,
					error: (error as Error).message,
				});
			}
		});

		debugLog("route:setup", {
			message: "Docker hostname route interception enabled",
			pattern: "regex: /host\\.docker\\.internal/",
			rewrite: "host.docker.internal → 127.0.0.1",
		});

		// Use the page with route interception active
		await use(page);
	},
});

// Re-export expect and types for convenience
export { expect };
export type { BrowserContext, Page, Request, Response } from "@playwright/test";

/**
 * Helper to ensure storage state is restored when tests retry or when
 * Playwright transitions between storage states.
 *
 * When Playwright retries a test or transitions between test files with
 * different storage states, it may clear cookies. This helper reads cookies
 * directly from the storage state file (source of truth) rather than the
 * current context, ensuring authenticated cookies are always available.
 *
 * Addresses:
 * - Issue #1492: Storage state lost when Playwright retries
 * - Issue #1531/#1532: Storage state lost during state transitions
 *
 * Usage in beforeEach (after navigation):
 *   await restoreAuthStorageState(page, AUTH_STATES.TEST_USER);
 *
 * Note: This function only restores cookies. localStorage restoration is not
 * needed because Supabase auth tokens are stored in cookies (handled by
 * @supabase/ssr), not localStorage.
 *
 * @param page - Playwright Page object
 * @param storageStatePath - Path to the storage state JSON file (e.g., AUTH_STATES.TEST_USER)
 */
export async function restoreAuthStorageState(
	page: import("@playwright/test").Page,
	storageStatePath: string,
): Promise<void> {
	try {
		const storageStateContent = readFileSync(storageStatePath, "utf-8");
		const storageState = JSON.parse(storageStateContent) as {
			cookies?: Array<{
				name: string;
				value: string;
				domain: string;
				path: string;
				expires: number;
				httpOnly: boolean;
				secure: boolean;
				sameSite: "Strict" | "Lax" | "None";
			}>;
		};

		if (!storageState.cookies || storageState.cookies.length === 0) {
			return; // No auth cookies to restore
		}

		// Add cookies from the storage state file
		await page.context().addCookies(storageState.cookies);
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		throw new Error(
			`Failed to restore auth storage state from ${storageStatePath}: ${errorMessage}`,
		);
	}
}
