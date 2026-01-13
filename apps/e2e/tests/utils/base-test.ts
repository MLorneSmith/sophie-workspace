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
