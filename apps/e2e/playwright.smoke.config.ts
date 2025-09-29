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
 */
export default defineConfig({
	testDir: "./tests",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: 3,
	reporter: "html",
	use: {
		baseURL:
			process.env.PLAYWRIGHT_BASE_URL ||
			process.env.TEST_BASE_URL ||
			process.env.BASE_URL ||
			"http://localhost:3001",
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
			// NO dependencies - smoke tests run without authentication
		},
	],
});
