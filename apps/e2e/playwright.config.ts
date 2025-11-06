import { defineConfig, devices } from "@playwright/test";
import { config as dotenvConfig } from "dotenv";

// Load environment variables with quiet mode to suppress logging
dotenvConfig({
	path: [".env", ".env.local"],
	quiet: true, // Suppress dotenv logging
	override: false,
});

/**

* Number of workers to use in CI. Tweak based on your CI provider's resources.
* Reduced from 4 to 2 to prevent resource contention and authentication conflicts
* This improves stability at the cost of slightly increased test duration
 */
const CI_WORKERS = 2;

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
	/* Limit parallel tests on CI. */
	workers: process.env.CI ? CI_WORKERS : undefined,
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
			"<http://localhost:3000>",

		// Add Vercel protection bypass headers for deployed environments
		// x-vercel-protection-bypass: For direct API/HTTP requests
		// x-vercel-set-bypass-cookie: Sets browser cookie for navigation/auth flows
		extraHTTPHeaders: process.env.VERCEL_AUTOMATION_BYPASS_SECRET
			? {
					"x-vercel-protection-bypass":
						process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
					"x-vercel-set-bypass-cookie":
						process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
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
	// Test timeout increased for CI to handle deployed environment latency
	// Setup tests (auth.setup.ts) need more time for authentication flows
	timeout: process.env.CI ? 180 * 1000 : 120 * 1000, // 3 min in CI, 2 min local
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
				storageState: ".auth/test@slideheroes.com.json",
			},
			testIgnore: /.*\.setup\.ts/, // Skip setup files - handled by global setup
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
				url: "<http://localhost:3000>",
				reuseExistingServer: !process.env.CI,
				stdout: "pipe",
				stderr: "pipe",
			}
		: undefined,
});
