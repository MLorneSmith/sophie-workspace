import { defineConfig, devices } from "@playwright/test";
import { config as dotenvConfig } from "dotenv";

dotenvConfig({
	path: [".env", ".env.local"],
	quiet: true, // Suppress dotenv logging
	override: false,
});

/**
 * Billing tests configuration - uses API-based global setup for authentication
 * This eliminates race conditions and enables parallel execution
 */
export default defineConfig({
	testDir: "./tests",
	fullyParallel: true, // Can now run in parallel with global setup
	globalSetup: "./global-setup.ts", // Use API-based authentication
	forbidOnly: !!process.env.CI,
	retries: 2,
	workers: process.env.CI ? 2 : undefined, // Can use multiple workers safely
	reporter: "list",
	testIgnore: /.*\.setup\.ts/, // Skip setup files - handled by global setup
	use: {
		baseURL:
			process.env.PLAYWRIGHT_BASE_URL ||
			process.env.TEST_BASE_URL ||
			process.env.BASE_URL ||
			"http://localhost:3000",
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
	timeout: 120 * 1000,
	expect: {
		timeout: 10 * 1000,
	},
	projects: [
		{
			name: "chromium",
			use: {
				...devices["Desktop Chrome"],
				// Use pre-authenticated state from global setup
				storageState: ".auth/test1@slideheroes.com.json",
			},
			testMatch: /billing\.spec\.ts/,
		},
	],
});
