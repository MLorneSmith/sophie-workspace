import { defineConfig, devices } from "@playwright/test";
import { config as dotenvConfig } from "dotenv";

dotenvConfig();
dotenvConfig({ path: ".env.local" });

// Load E2E specific environment variables
process.env.SUPABASE_URL =
	process.env.E2E_SUPABASE_URL || "http://localhost:55321";
process.env.SUPABASE_ANON_KEY = process.env.E2E_SUPABASE_ANON_KEY || "";
process.env.SUPABASE_SERVICE_ROLE_KEY =
	process.env.E2E_SUPABASE_SERVICE_ROLE_KEY || "";
process.env.DATABASE_URL =
	process.env.E2E_DATABASE_URL ||
	"postgresql://postgres:postgres@localhost:55322/postgres";

const enableBillingTests = process.env.ENABLE_BILLING_TESTS === "true";
const enableTeamAccountTests =
	(process.env.ENABLE_TEAM_ACCOUNT_TESTS ?? "true") === "true";

const testIgnore: string[] = [];

if (!enableBillingTests) {
	// Only log in debug mode to avoid Biome linting errors
	if (process.env.DEBUG) {
		process.stdout.write(
			`Billing tests are disabled. To enable them, set the environment variable ENABLE_BILLING_TESTS=true. Current value: "${process.env.ENABLE_BILLING_TESTS}"\n`,
		);
	}

	testIgnore.push("*-billing.spec.ts");
}

if (!enableTeamAccountTests) {
	// Only log in debug mode to avoid Biome linting errors
	if (process.env.DEBUG) {
		process.stdout.write(
			`Team account tests are disabled. To enable them, set the environment variable ENABLE_TEAM_ACCOUNT_TESTS=true. Current value: "${process.env.ENABLE_TEAM_ACCOUNT_TESTS}"\n`,
		);
	}

	testIgnore.push("*team-accounts.spec.ts");
	testIgnore.push("*invitations.spec.ts");
	testIgnore.push("*team-billing.spec.ts");
}

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
	testDir: "./tests",
	/* Run tests in files in parallel - enabled for test runner */
	fullyParallel: !!process.env.CI || process.env.PLAYWRIGHT_PARALLEL === "true",
	/* Fail the build on CI if you accidentally left test.only in the source code. */
	forbidOnly: !!process.env.CI,
	/* Reduced retries to speed up CI - only retry truly flaky tests */
	retries: process.env.CI ? 1 : 0,
	/* Increase max failures for debugging */
	maxFailures: process.env.CI ? 10 : 50,
	/* Configure parallel execution - balanced for Issue #267 resource contention fix */
	workers: process.env.CI
		? 4
		: process.env.PLAYWRIGHT_PARALLEL === "true"
			? 3 // Reduced from 4 to 3 workers per shard to prevent resource contention
			: 1, // Sequential for local development
	/* Enhanced reporting for matrix testing */
	reporter: [
		["html", { outputFolder: "playwright-report", open: "never" }],
		["junit", { outputFile: "test-results/junit.xml" }],
		["github"], // GitHub Actions integration
		...(process.env.CI ? [["blob"] as const] : []), // Blob reporter for CI artifacts
	],
	/* Ignore billing tests if the environment variable is not set. */
	testIgnore,
	/* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
	use: {
		/* Base URL to use in actions like `await page.goto('/')`. */
		baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",

		/* Extra HTTP headers for Vercel preview protection bypass */
		extraHTTPHeaders: process.env.VERCEL_AUTOMATION_BYPASS_SECRET
			? {
					"x-vercel-protection-bypass":
						process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
				}
			: undefined,

		/* Enhanced screenshot configuration for matrix testing */
		screenshot: {
			mode: "only-on-failure",
			fullPage: true,
		},

		/* Enhanced video recording for CI debugging */
		video: process.env.CI ? "retain-on-failure" : "off",

		/* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
		trace: "on-first-retry",

		/* Enhanced timeouts for element detection reliability
		   Increased timeouts for complex E2E flows with concurrent execution */
		navigationTimeout:
			Number(process.env.PLAYWRIGHT_NAVIGATION_TIMEOUT) ||
			(process.env.CI ? 45000 : 30000), // Increased for concurrent shard execution
		actionTimeout:
			Number(process.env.PLAYWRIGHT_ACTION_TIMEOUT) ||
			(process.env.CI ? 30000 : 30000), // Increased to 30s for complex team operations
	},
	// Test timeout increased for Issue #267 fix (resource contention)
	// Individual test timeout increased from 2 to 5 minutes to handle server delays
	timeout: Number(process.env.PLAYWRIGHT_TIMEOUT) || 300 * 1000, // 5 minutes per test
	expect: {
		// expect timeout increased to 45s to handle concurrent shard execution delays
		timeout: Number(process.env.PLAYWRIGHT_EXPECT_TIMEOUT) || 45 * 1000,
	},
	/* Configure projects for major browsers - reduced for local development */
	projects: process.env.CI
		? [
				// Full matrix for CI
				{
					name: "chromium",
					use: { ...devices["Desktop Chrome"] },
				},
				{
					name: "firefox",
					use: { ...devices["Desktop Firefox"] },
				},
				{
					name: "webkit",
					use: { ...devices["Desktop Safari"] },
				},
				{
					name: "Mobile Chrome",
					use: { ...devices["Pixel 5"] },
				},
				{
					name: "Mobile Safari",
					use: { ...devices["iPhone 12"] },
				},
				{
					name: "Mobile Firefox",
					use: { ...devices["Pixel 5"], browserName: "firefox" },
				},
				{
					name: "Tablet Chrome",
					use: { ...devices["iPad Pro"] },
				},
				{
					name: "Tablet Safari",
					use: { ...devices["iPad Pro"], browserName: "webkit" },
				},
				{
					name: "accessibility",
					use: {
						...devices["Desktop Chrome"],
						colorScheme: "light",
					},
					testMatch: /.*accessibility.*\.spec\.ts/,
				},
			]
		: [
				// Minimal set for local development
				{
					name: "chromium",
					use: { ...devices["Desktop Chrome"] },
				},
				{
					name: "accessibility",
					use: {
						...devices["Desktop Chrome"],
						colorScheme: "light",
					},
					testMatch: /.*accessibility.*\.spec\.ts/,
				},
			],

	/* Run your local dev server before starting the tests */
	// Skip webServer when testing against deployed environment or for local sharding
	webServer: process.env.PLAYWRIGHT_BASE_URL
		? undefined
		: process.env.PLAYWRIGHT_PARALLEL === "true"
			? undefined // Disable webServer for sharded runs to avoid coordination issues
			: [
					{
						cwd: "../../",
						command:
							process.env.PLAYWRIGHT_WEB_COMMAND ||
							"pnpm --filter=web dev:test",
						url: "http://localhost:3000",
						name: "Frontend",
						timeout: 180 * 1000, // Increased to 180s for Issue #267 (resource contention during batch execution)
						reuseExistingServer: !process.env.CI,
						stdout: "pipe",
						stderr: "pipe",
					},
					{
						cwd: "../../",
						command:
							process.env.PLAYWRIGHT_PAYLOAD_COMMAND ||
							"pnpm --filter=payload dev:test",
						url: "http://localhost:3020",
						name: "Backend",
						timeout: 180 * 1000, // Increased to 180s for Issue #267 (resource contention during batch execution)
						reuseExistingServer: !process.env.CI,
						stdout: "pipe",
						stderr: "pipe",
					},
				],
});
