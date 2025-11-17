import * as path from "node:path";
import { defineConfig, devices } from "@playwright/test";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({
	path: [
		path.resolve(__dirname, "../../.env.test"),
		path.resolve(__dirname, "../../../../apps/payload/.env.test"),
	],
	quiet: true, // Suppress dotenv logging
	override: false,
});

const PAYLOAD_URL =
	process.env.PAYLOAD_PUBLIC_SERVER_URL || "http://localhost:3021";

export default defineConfig({
	testDir: "./",
	testMatch: ["**/*.spec.ts"],
	fullyParallel: false, // Run tests sequentially to avoid database conflicts
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	workers: process.env.CI ? 1 : 1, // Single worker to avoid database conflicts
	reporter: [
		["html", { open: "never" }],
		["list"],
		["json", { outputFile: "test-results.json" }],
	],

	timeout: 60000, // 60 seconds per test
	expect: {
		timeout: 10000, // 10 seconds for assertions
	},

	use: {
		baseURL: PAYLOAD_URL,
		trace: "on-first-retry",
		screenshot: "only-on-failure",
		video: "retain-on-failure",
		actionTimeout: 15000,
		navigationTimeout: 30000,

		// Extra HTTP headers
		extraHTTPHeaders: {
			Accept: "application/json, text/plain, */*",
			"Accept-Language": "en-US,en;q=0.9",
		},
	},

	projects: [
		{
			name: "setup",
			testMatch: /.*setup\.ts/,
			teardown: "cleanup",
		},
		{
			name: "cleanup",
			testMatch: /.*teardown\.ts/,
		},
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
			dependencies: ["setup"],
		},
		{
			name: "firefox",
			use: { ...devices["Desktop Firefox"] },
			dependencies: ["setup"],
		},
		{
			name: "webkit",
			use: { ...devices["Desktop Safari"] },
			dependencies: ["setup"],
		},
		{
			name: "mobile",
			use: { ...devices["Pixel 5"] },
			dependencies: ["setup"],
		},
	],

	webServer: {
		// Use the Docker container instead of starting a new server
		command: `echo "Using existing server at ${PAYLOAD_URL}"`,
		url: PAYLOAD_URL,
		reuseExistingServer: true,
		timeout: 5000,
	},
});
