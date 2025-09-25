import { defineConfig, devices } from "@playwright/test";
import { config as dotenvConfig } from "dotenv";

dotenvConfig({
	path: [".env", ".env.local"],
	quiet: true, // Suppress dotenv logging
	override: false,
});

/**
 * Billing tests configuration - runs with single worker to avoid auth conflicts
 */
export default defineConfig({
	testDir: "./tests",
	fullyParallel: false,
	forbidOnly: !!process.env.CI,
	retries: 2,
	workers: 1,
	reporter: "list",
	use: {
		baseURL: process.env.TEST_BASE_URL || "http://localhost:3000",
		screenshot: "only-on-failure",
		trace: "on-first-retry",
		navigationTimeout: 15 * 1000,
	},
	timeout: 120 * 1000,
	expect: {
		timeout: 10 * 1000,
	},
	projects: [
		{ name: "billing-setup", testMatch: /billing\.setup\.ts/ },
		{
			name: "chromium",
			use: {
				...devices["Desktop Chrome"],
				storageState: ".auth/billing-user.json",
			},
			dependencies: ["billing-setup"],
			testMatch: /billing\.spec\.ts/,
		},
	],
});
