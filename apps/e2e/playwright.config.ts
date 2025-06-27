import { defineConfig, devices } from "@playwright/test";
import { config as dotenvConfig } from "dotenv";

dotenvConfig();
dotenvConfig({ path: ".env.local" });

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
	/* Run tests in files in parallel */
	fullyParallel: true,
	/* Fail the build on CI if you accidentally left test.only in the source code. */
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 3 : 1,
	/* Configure parallel execution - optimize for CI vs local */
	workers: process.env.CI ? 2 : undefined, // Increased for better CI performance
	/* Enhanced reporting for matrix testing */
	reporter: [
		["html", { outputFolder: "playwright-report", open: "never" }],
		["junit", { outputFile: "test-results/junit.xml" }],
		["github"], // GitHub Actions integration
		...(process.env.CI ? [["blob"]] : []), // Blob reporter for CI artifacts
	],
	/* Ignore billing tests if the environment variable is not set. */
	testIgnore,
	/* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
	use: {
		/* Base URL to use in actions like `await page.goto('/')`. */
		baseURL: "http://localhost:3000",

		/* Enhanced screenshot configuration for matrix testing */
		screenshot: {
			mode: "only-on-failure",
			fullPage: true,
		},

		/* Enhanced video recording for CI debugging */
		video: process.env.CI ? "retain-on-failure" : "off",

		/* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
		trace: "on-first-retry",

		/* Increase timeouts for matrix testing across different devices */
		navigationTimeout: 10000, // Increased for slower mobile devices
		actionTimeout: 8000, // More time for interactions
	},
	// test timeout set to 1 minutes
	timeout: 60 * 1000,
	expect: {
		// expect timeout set to 10 seconds
		timeout: 10 * 1000,
	},
	/* Configure projects for major browsers */
	projects: [
		// Desktop browsers
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

		// Mobile viewports
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

		// Tablet viewports
		{
			name: "Tablet Chrome",
			use: { ...devices["iPad Pro"] },
		},
		{
			name: "Tablet Safari",
			use: { ...devices["iPad Pro"], browserName: "webkit" },
		},

		// Accessibility testing (existing)
		{
			name: "accessibility",
			use: {
				...devices["Desktop Chrome"],
				// Optimize for accessibility testing
				colorScheme: "light",
				reduceMotion: "reduce",
			},
			testMatch: /.*accessibility.*\.spec\.ts/,
		},
	],

	/* Run your local dev server before starting the tests */
	webServer: {
		cwd: "../../",
		command:
			process.env.PLAYWRIGHT_SERVER_COMMAND ||
			"pnpm dev --filter=web --filter=payload",
		url: "http://localhost:3000",
		reuseExistingServer: !process.env.CI,
		timeout: 120 * 1000, // 2 minutes for server startup
		stdout: "pipe",
		stderr: "pipe",
	},
});
