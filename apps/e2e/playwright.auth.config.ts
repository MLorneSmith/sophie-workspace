import { defineConfig, devices } from "@playwright/test";
import { config as dotenvConfig } from "dotenv";

dotenvConfig({
	path: [".env", ".env.local"],
	quiet: true, // Suppress dotenv logging
	override: false,
});

/**
 * Authentication test configuration - runs without pre-authentication setup
 * These tests validate authentication flows themselves, so they start fresh
 */
export default defineConfig({
	testDir: "./tests",
	fullyParallel: false, // Auth tests should run sequentially for reliability
	forbidOnly: !!process.env.CI,
	retries: 3,
	reporter: "html",
	testIgnore: /.*\.setup\.ts/, // Skip setup files for consistency
	use: {
		baseURL:
			process.env.PLAYWRIGHT_BASE_URL ||
			process.env.TEST_BASE_URL ||
			process.env.BASE_URL ||
			"http://localhost:3001",
		extraHTTPHeaders: process.env.VERCEL_AUTOMATION_BYPASS_SECRET
			? {
					"x-vercel-protection-bypass":
						process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
				}
			: undefined,
		screenshot: "only-on-failure",
		trace: "on-first-retry",
		navigationTimeout: 15 * 1000,
	},
	timeout: 60 * 1000, // Auth tests may need more time
	expect: {
		timeout: 10 * 1000,
	},
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
			// NO storageState - auth tests validate authentication flows
		},
	],

	// Use production server (next start) instead of dev server (next dev) in CI.
	// The Setup Test Server job builds the application, so we can simply run the production build.
	// Production server starts in 1-2 seconds vs dev server which may hang with cached build artifacts.
	// See Issue #1583, #1584 for diagnosis and fix details.
	webServer: {
		cwd: "../../",
		command: "pnpm --filter web start:test",
		url: "http://localhost:3001",
		reuseExistingServer: !process.env.CI,
		timeout: 120 * 1000, // 2 minutes timeout (though production server starts instantly)
		stdout: "pipe",
		stderr: "pipe",
	},
});
