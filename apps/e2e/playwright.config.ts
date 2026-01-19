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
 *
 * CI: 1 worker (serial execution) to eliminate authentication race conditions.
 * When multiple workers authenticate simultaneously via global-setup, cookies can
 * conflict causing session validation failures in Supabase middleware. This is
 * especially problematic on Vercel preview deployments where cookie domain/SameSite
 * attributes need careful handling.
 *
 * Local: 4 workers with updated .wslconfig (24GB RAM, 16 processors)
 * Each worker spawns a browser instance (~300-500MB RAM each)
 *
 * See Issue #1062, #1063 for diagnosis and fix details.
 * Future improvement: Implement proper worker isolation to re-enable parallel execution.
 */
const CI_WORKERS = 1;
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

		// Add Vercel bypass and configuration headers for E2E tests
		// x-vercel-protection-bypass: For direct API/HTTP requests (deployed environments)
		// x-vercel-set-bypass-cookie: Sets browser cookie for navigation/auth flows (deployed environments)
		// x-vercel-skip-toolbar: Disable Vercel Live toolbar to prevent cross-origin cookie interference (Issue #1078)
		extraHTTPHeaders: {
			// Always disable Vercel Live toolbar - it causes cross-origin cookie issues in Playwright
			"x-vercel-skip-toolbar": "1",
			// Add bypass headers only when secret is configured (deployed environments)
			...(process.env.VERCEL_AUTOMATION_BYPASS_SECRET && {
				"x-vercel-protection-bypass":
					process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
				"x-vercel-set-bypass-cookie": "samesitenone",
			}),
		},

		// Enable request/response interception for debugging cookie transmission
		// This helps diagnose if cookies created in global setup are being sent to the server
		// HAR files include HTTP headers, showing if cookies are being transmitted to server
		// See Issue #1083, #1096 for cookie verification patterns
		...(process.env.RECORD_HAR_LOGS === "true" && {
			recordHar: {
				path: "./test-results/requests.har",
				// Include all content for comprehensive debugging
				omitContent: false,
				// 'minimal' mode excludes bodies to reduce file size
				mode: "minimal" as const,
			},
		}),

		// take a screenshot when a test fails
		screenshot: "only-on-failure",

		/* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
		trace: "on-first-retry",
		// Increased navigation timeout for deployed environments
		// Accounts for: Vercel cold starts, network latency, edge function initialization
		navigationTimeout: process.env.CI ? 90 * 1000 : 45 * 1000,
	},
	// Test timeout - accounts for complex multi-operation tests
	// CI needs significantly more time for deployed environment latency and sub-operation timeouts
	// With CI_TIMEOUTS.element = 90s, individual operations can take that long
	// Multi-operation tests (like account settings updates) need sum of all operations + buffer
	// Formula: test timeout >= (num_operations * element_timeout) + overhead
	// For account tests: 2 operations * 60s per operation + 30s overhead = 150s recommended
	// Fixed at 180s (3 min) to handle worst-case scenarios (Issue #1139, #1140)
	timeout: process.env.CI ? 180 * 1000 : 90 * 1000, // 3 min in CI, 90s local
	expect: {
		// Expect timeout for assertions
		// Increased for CI to handle Vercel cold starts and React hydration delays (Issue #1051)
		timeout: process.env.CI ? 30 * 1000 : 10 * 1000, // 30s in CI, 10s local
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
	// Start both web and Payload servers since this config is used for both projects
	// Web tests use port 3001, Payload tests use port 3021
	// CONDITIONAL: Skip webServer when running against deployed environments (HTTPS URLs)
	// This prevents "Process from config.webServer exited early" errors in CI workflows
	// that test against deployed Vercel environments (e.g., dev-integration-tests)
	// See Issue #1571, #1579 for diagnosis and fix details
	// Use production server (next start) instead of dev server (next dev) in CI.
	// The Setup Test Server job builds the application, so we can simply run the production build.
	// Production server starts in 1-2 seconds vs dev server which may hang with cached build artifacts.
	// See Issue #1583, #1584 for diagnosis and fix details.
	webServer:
		process.env.PLAYWRIGHT_BASE_URL?.startsWith("https://") ||
		process.env.TEST_BASE_URL?.startsWith("https://") ||
		process.env.BASE_URL?.startsWith("https://")
			? undefined
			: [
					{
						cwd: "../../",
						command: "pnpm --filter web start:test",
						url: "http://localhost:3001",
						reuseExistingServer: !process.env.CI,
						timeout: 120 * 1000, // 2 minutes timeout (though production server starts instantly)
						stdout: "ignore", // Reduce noise in logs
						stderr: "pipe", // Still capture errors
					},
					{
						cwd: "../../",
						command: "pnpm --filter payload start:test",
						url: "http://localhost:3021",
						reuseExistingServer: !process.env.CI,
						timeout: 120 * 1000, // 2 minutes timeout (though production server starts instantly)
						stdout: "ignore", // Reduce noise in logs
						stderr: "pipe", // Still capture errors
					},
				],
});
