import { join } from "node:path";
import { cwd } from "node:process";
import { expect, test } from "@playwright/test";
import { config as dotenvConfig } from "dotenv";

import { AuthPageObject } from "./authentication/auth.po";
import { CredentialValidator } from "./utils/credential-validator";
import { testConfig } from "./utils/test-config";

// Ensure environment variables are loaded with quiet mode
dotenvConfig({
	path: [".env", ".env.local"],
	quiet: true,
});

// Log environment configuration for debugging
testConfig.logEnvironmentInfo();

// Use proper file names for auth state - matching the actual test emails
const testAuthFile = join(cwd(), ".auth/test@slideheroes.com.json");
const ownerAuthFile = join(cwd(), ".auth/owner@slideheroes.com.json");
const superAdminAuthFile = join(
	cwd(),
	".auth/super-admin@slideheroes.com.json",
);

test("authenticate as test user", async ({ page }) => {
	const auth = new AuthPageObject(page);

	// Get and validate credentials using the enhanced validator
	const credentials = CredentialValidator.validateAndGet("test");

	console.log(`🔐 Authenticating test user: ${credentials.email}`);

	// Use toPass for reliable authentication with retries
	try {
		await expect(async () => {
			await auth.loginAsUser({
				email: credentials.email,
				password: credentials.password,
			});
		}).toPass({
			intervals: testConfig.getRetryIntervals("auth"),
			timeout: testConfig.getTimeout("medium"),
		});
	} catch (error) {
		// Capture diagnostics on failure
		await page.screenshot({
			path: `./test-results/auth-failure-${credentials.email}-${Date.now()}.png`,
			fullPage: true,
		});

		console.error(`❌ Authentication failed for ${credentials.email}`);
		console.error(`Current URL: ${page.url()}`);

		// Log available inputs for debugging selector issues
		try {
			const inputs = await page.$$eval("input", (els) =>
				els.map((el) => ({
					name: el.getAttribute("name"),
					id: el.id,
					type: el.type,
					dataTest: el.dataset.test,
					dataTestId: el.dataset.testid,
				})),
			);
			console.error("Available inputs:", JSON.stringify(inputs, null, 2));
		} catch (e) {
			console.error("Could not enumerate inputs");
		}

		throw error;
	}

	await page.context().storageState({ path: testAuthFile });
});

test("authenticate as owner user", async ({ page }) => {
	const auth = new AuthPageObject(page);

	// Get and validate credentials using the enhanced validator
	const credentials = CredentialValidator.validateAndGet("owner");

	console.log(`🔐 Authenticating owner user: ${credentials.email}`);

	// Use toPass for reliable authentication with retries
	try {
		await expect(async () => {
			await auth.loginAsUser({
				email: credentials.email,
				password: credentials.password,
			});
		}).toPass({
			intervals: testConfig.getRetryIntervals("auth"),
			timeout: testConfig.getTimeout("medium"),
		});
	} catch (error) {
		// Capture diagnostics on failure
		await page.screenshot({
			path: `./test-results/auth-failure-${credentials.email}-${Date.now()}.png`,
			fullPage: true,
		});

		console.error(`❌ Authentication failed for ${credentials.email}`);
		console.error(`Current URL: ${page.url()}`);

		// Log available inputs for debugging selector issues
		try {
			const inputs = await page.$$eval("input", (els) =>
				els.map((el) => ({
					name: el.getAttribute("name"),
					id: el.id,
					type: el.type,
					dataTest: el.dataset.test,
					dataTestId: el.dataset.testid,
				})),
			);
			console.error("Available inputs:", JSON.stringify(inputs, null, 2));
		} catch (e) {
			console.error("Could not enumerate inputs");
		}

		throw error;
	}

	await page.context().storageState({ path: ownerAuthFile });
});

test("authenticate as super-admin user", async ({ page }) => {
	const auth = new AuthPageObject(page);

	// Get and validate credentials using the enhanced validator
	const credentials = CredentialValidator.validateAndGet("admin");

	console.log(`🔐 Authenticating super-admin user: ${credentials.email}`);

	// Use toPass for reliable authentication with retries
	try {
		await expect(async () => {
			await auth.loginAsSuperAdmin({
				email: credentials.email,
				password: credentials.password,
			});
		}).toPass({
			intervals: testConfig.getRetryIntervals("auth"),
			timeout: testConfig.getTimeout("long"), // Super admin with MFA needs more time
		});
	} catch (error) {
		// Capture diagnostics on failure
		await page.screenshot({
			path: `./test-results/auth-failure-${credentials.email}-${Date.now()}.png`,
			fullPage: true,
		});

		console.error(`❌ Authentication failed for ${credentials.email}`);
		console.error(`Current URL: ${page.url()}`);

		// Log available inputs for debugging selector issues
		try {
			const inputs = await page.$$eval("input", (els) =>
				els.map((el) => ({
					name: el.getAttribute("name"),
					id: el.id,
					type: el.type,
					dataTest: el.dataset.test,
					dataTestId: el.dataset.testid,
				})),
			);
			console.error("Available inputs:", JSON.stringify(inputs, null, 2));
		} catch (e) {
			console.error("Could not enumerate inputs");
		}

		throw error;
	}

	await page.context().storageState({ path: superAdminAuthFile });
});
