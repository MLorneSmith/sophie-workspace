import * as path from "node:path";
import { defineConfig, devices } from "@playwright/test";
import { config as dotenvConfig } from "dotenv";

// Load environment variables from .env files
// IMPORTANT: override: false (default) ensures shell/CI environment variables
// take precedence over .env file values. This allows CI workflows to control
// flags like ENABLE_BILLING_TESTS via env: directives.
dotenvConfig({
	path: [
		".env",
		".env.local",
		// Load Payload test environment for shard 7/8 tests
		// This sets PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3021 (test port)
		// vs development port 3020. The dev:test script runs Payload on 3021.
		path.resolve(__dirname, "../../apps/payload/.env.test"),
	],
	quiet: true, // Suppress dotenv logging
	// override: false (default) - shell/CI env vars take precedence over .env files
});

/**
 * Number of workers to use for test execution.
 * CI: 3 workers for 4-core runners (1 core reserved for OS/overhead)
 * Local: 4 workers with updated .wslconfig (24GB RAM, 16 processors)
 * Each worker spawns a browser instance (~300-500MB RAM each)
 */
const CI_WORKERS = 3;
const LOCAL_WORKERS = 4;

const enableBillingTests = process.env.ENABLE_BILLING_TESTS === "true";
const enableTeamAccountTests =
	(process.env.ENABLE_TEAM_ACCOUNT_TESTS ?? "true") === "true";

const testIgnore: string[] = [];

if (!enableBillingTests) {
	testIgnore.push("*-billing.spec.ts");
}

if (!enableTeamAccountTests) {
	testIgnore.push("*team-accounts.spec.ts");
	testIgnore.push("*invitations.spec.ts");
	testIgnore.push("*team-billing.spec.ts");
}

/**

* Read environment variables from file.
* <https://github.com/motdotla/dotenv>
 */
// require('dotenv').config();

/**

* See <https://playwright.dev/docs/test-configuration>.
 */
export default defineConfig({
	testDir: "./tests",
	/* Run tests in files in parallel */
	fullyParallel: true,
	/* Global setup runs once before all tests to create authenticated browser states */
	globalSetup: "./global-setup.ts",
	/* Fail the build on CI if you accidentally left test.only in the source code. */
	forbidOnly: !!process.env.CI,
	retries: 1,
	/* Configure workers for parallel test execution */
	workers: process.env.CI ? CI_WORKERS : LOCAL_WORKERS,
	/* Reporter to use. See <https://playwright.dev/docs/test-reporters> */
	reporter: "html",
	/* Ignore billing tests if the environment variable is not set. */
	testIgnore,
	/* Shared settings for all the projects below. See <https://playwright.dev/docs/api/class-testoptions>. */
	use: {
		/* Base URL to use in actions like `await page.goto('/')`. */
		baseURL:
			process.env.PLAYWRIGHT_BASE_URL ||
			process.env.TEST_BASE_URL ||
			process.env.BASE_URL ||
			"http://localhost:3001",

		// Add Vercel protection bypass headers for deployed environments
		// x-vercel-protection-bypass: For direct API/HTTP requests
		// x-vercel-set-bypass-cookie: Sets browser cookie for navigation/auth flows
		extraHTTPHeaders: process.env.VERCEL_AUTOMATION_BYPASS_SECRET
			? {
					"x-vercel-protection-bypass":
						process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
					"x-vercel-set-bypass-cookie": "samesitenone",
				}
			: {},

		// take a screenshot when a test fails
		screenshot: "only-on-failure",

		/* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
		trace: "on-first-retry",
		// Increased navigation timeout for deployed environments
		// Accounts for: Vercel cold starts, network latency, edge function initialization
		navigationTimeout: process.env.CI ? 90 * 1000 : 45 * 1000,
	},
	// Test timeout - reduced for faster failure detection
	// CI needs more time for deployed environment latency
	timeout: process.env.CI ? 120 * 1000 : 90 * 1000, // 2 min in CI, 90s local (reduced from 3min/2min)
	expect: {
		// Expect timeout for assertions
		timeout: process.env.CI ? 15 * 1000 : 10 * 1000, // 15s in CI, 10s local
	},
	/*Configure projects for major browsers */
	projects: [
		{
			name: "chromium",
			use: {
				...devices["Desktop Chrome"],
				// Use pre-authenticated state from global setup
				// This eliminates per-test authentication and enables true parallel execution
				storageState: ".auth/test1@slideheroes.com.json",
			},
			// Exclude Payload tests from the default project - they use a separate project
			testIgnore: [/.*\.setup\.ts/, /.*payload.*/],
		},
		{
			name: "payload",
			use: {
				...devices["Desktop Chrome"],
				// Use Payload-specific pre-authenticated storage state
				// Created in global-setup.ts with navigation to Payload admin panel
				storageState: ".auth/payload-admin.json",
				// Use Payload's base URL for all tests in this project
				baseURL:
					process.env.PAYLOAD_PUBLIC_SERVER_URL || "http://localhost:3021",
			},
			// Only run Payload tests in this project
			testMatch: /.*payload.*\.spec\.ts/,
			testIgnore: /.*\.setup\.ts/,
		},
		/* Test against mobile viewports. */
		// {
		//   name: 'Mobile Chrome',
		//   use: { ...devices['Pixel 5'] },
		// },
		// {
		//   name: 'Mobile Safari',
		//   use: { ...devices['iPhone 12'] },
		// },

		/* Test against branded browsers. */
		// {
		//   name: 'Microsoft Edge',
		//   use: { ...devices['Desktop Edge'], channel: 'msedge' },
		// },
		// {
		//   name: 'Google Chrome',
		//   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
		// },
	],

	/*Run your local dev server before starting the tests*/
	webServer: process.env.PLAYWRIGHT_SERVER_COMMAND
		? {
				cwd: "../../",
				command: process.env.PLAYWRIGHT_SERVER_COMMAND,
				url: "http://localhost:3001",
				reuseExistingServer: !process.env.CI,
				stdout: "pipe",
				stderr: "pipe",
			}
		: undefined,
});
