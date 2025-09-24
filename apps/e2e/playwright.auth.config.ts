import { defineConfig, devices } from "@playwright/test";
import { config as dotenvConfig } from "dotenv";

dotenvConfig({
	path: [".env", ".env.local"],
	quiet: true, // Suppress dotenv logging
	override: false,
});

/**
 * Authentication test configuration - runs without pre-authentication setup
 */
export default defineConfig({
	testDir: "./tests",
	fullyParallel: false, // Auth tests should run sequentially for reliability
	forbidOnly: !!process.env.CI,
	retries: 3,
	reporter: "html",
	use: {
		baseURL: process.env.TEST_BASE_URL || "http://localhost:3001",
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
			// NO dependencies - auth tests don't need pre-authentication
		},
	],
});
