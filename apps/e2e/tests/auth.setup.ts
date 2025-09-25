import { join } from "node:path";
import { cwd } from "node:process";
import { expect, test } from "@playwright/test";
import { config as dotenvConfig } from "dotenv";

import { AuthPageObject } from "./authentication/auth.po";

// Ensure environment variables are loaded with quiet mode
dotenvConfig({
	path: [".env", ".env.local"],
	quiet: true,
});

// Use proper file names for auth state - matching the actual test emails
const testAuthFile = join(cwd(), ".auth/test@slideheroes.com.json");
const ownerAuthFile = join(cwd(), ".auth/owner@slideheroes.com.json");
const superAdminAuthFile = join(
	cwd(),
	".auth/super-admin@slideheroes.com.json",
);

test("authenticate as test user", async ({ page }) => {
	const auth = new AuthPageObject(page);

	// Use the actual test user from the E2E seed data
	const testEmail = process.env.E2E_TEST_USER_EMAIL || "test1@slideheroes.com";
	const testPassword = process.env.E2E_TEST_USER_PASSWORD || "";

	if (!testEmail || !testPassword) {
		throw new Error(
			`Missing E2E test credentials. Email: ${testEmail ? "SET" : "NOT SET"}, Password: ${testPassword ? "SET" : "NOT SET"}`,
		);
	}

	// Use toPass for reliable authentication with retries
	await expect(async () => {
		await auth.loginAsUser({
			email: testEmail,
			password: testPassword,
		});
	}).toPass({
		intervals: [500, 2000, 5000, 10000],
		timeout: 30000,
	});

	await page.context().storageState({ path: testAuthFile });
});

test("authenticate as owner user", async ({ page }) => {
	const auth = new AuthPageObject(page);

	// Use the actual owner user from the E2E seed data
	const ownerEmail = process.env.E2E_OWNER_EMAIL || "test1@slideheroes.com";
	const ownerPassword = process.env.E2E_OWNER_PASSWORD || "";

	if (!ownerEmail || !ownerPassword) {
		throw new Error(
			`Missing E2E owner credentials. Email: ${ownerEmail ? "SET" : "NOT SET"}, Password: ${ownerPassword ? "SET" : "NOT SET"}`,
		);
	}

	// Use toPass for reliable authentication with retries
	await expect(async () => {
		await auth.loginAsUser({
			email: ownerEmail,
			password: ownerPassword,
		});
	}).toPass({
		intervals: [500, 2000, 5000, 10000],
		timeout: 30000,
	});

	await page.context().storageState({ path: ownerAuthFile });
});

test("authenticate as super-admin user", async ({ page }) => {
	const auth = new AuthPageObject(page);

	// Use the actual super-admin user from the E2E seed data
	const adminEmail = process.env.E2E_ADMIN_EMAIL || "michael@slideheroes.com";
	const adminPassword = process.env.E2E_ADMIN_PASSWORD || "";

	if (!adminEmail || !adminPassword) {
		throw new Error(
			`Missing E2E admin credentials. Email: ${adminEmail ? "SET" : "NOT SET"}, Password: ${adminPassword ? "SET" : "NOT SET"}`,
		);
	}

	// Use toPass for reliable authentication with retries
	await expect(async () => {
		await auth.loginAsSuperAdmin({
			email: adminEmail,
			password: adminPassword,
		});
	}).toPass({
		intervals: [500, 2500, 5000, 7500, 10000, 15000],
		timeout: 45000, // Super admin with MFA needs more time
	});

	await page.context().storageState({ path: superAdminAuthFile });
});
