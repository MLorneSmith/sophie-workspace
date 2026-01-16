import { defineConfig, devices } from "@playwright/test";
import { config as dotenvConfig } from "dotenv";

// Load environment variables with quiet mode to suppress logging
dotenvConfig({
	path: [".env", ".env.local"],
	quiet: true, // Suppress dotenv logging
	override: false,
});

/**
 * Smoke test configuration - runs without authentication setup
 * Tests basic functionality that doesn't require login
 */
export default defineConfig({
	testDir: "./tests",
	fullyParallel: true,
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
	timeout: 30 * 1000, // Reduced timeout for smoke tests
	expect: {
		timeout: 10 * 1000,
	},
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
			// NO storageState - smoke tests validate public pages
		},
	],

	/*Run your local dev server before starting the tests*/
	webServer: {
		cwd: "../../",
		command: "pnpm --filter web dev:test",
		url: "http://localhost:3001",
		reuseExistingServer: !process.env.CI,
		timeout: 120 * 1000, // 2 minutes for build compilation
		stdout: "pipe",
		stderr: "pipe",
	},
});
