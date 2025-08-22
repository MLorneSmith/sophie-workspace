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
	/* Run tests in files in parallel - disabled for local stability */
	fullyParallel: !!process.env.CI,
	/* Fail the build on CI if you accidentally left test.only in the source code. */
	forbidOnly: !!process.env.CI,
	/* Reduced retries to speed up CI - only retry truly flaky tests */
	retries: process.env.CI ? 1 : 0,
	/* Increase max failures for debugging */
	maxFailures: process.env.CI ? 10 : 50,
	/* Configure parallel execution - increased for better CI performance */
	workers: process.env.CI ? 4 : 1, // Increased to 4 workers for CI (8-core runners)
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
		
		/* Optimized timeouts for faster test execution */
		navigationTimeout:
			Number(process.env.PLAYWRIGHT_NAVIGATION_TIMEOUT) || 20000, // Balanced for CI performance
		actionTimeout: Number(process.env.PLAYWRIGHT_ACTION_TIMEOUT) || 10000, // Faster failure detection
	},
	// test timeout set to 2 minutes
	timeout: 120 * 1000,
	expect: {
		// expect timeout set to 5 seconds
		timeout: 5 * 1000,
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
	// Skip webServer when testing against deployed environment
	webServer: process.env.PLAYWRIGHT_BASE_URL
		? undefined
		: [
				{
					cwd: "../../",
					command:
						process.env.PLAYWRIGHT_WEB_COMMAND || "pnpm --filter=web dev:test",
					url: "http://localhost:3000",
					name: "Frontend",
					timeout: 90 * 1000, // Increased timeout for initial compilation
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
					timeout: 90 * 1000, // Increased timeout for initial compilation
					reuseExistingServer: !process.env.CI,
					stdout: "pipe",
					stderr: "pipe",
				},
			],
});
