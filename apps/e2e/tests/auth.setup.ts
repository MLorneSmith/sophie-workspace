import { join } from "node:path";
import { cwd } from "node:process";
import { test } from "@playwright/test";

import { AuthPageObject } from "./authentication/auth.po";

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
	await auth.loginAsUser({
		email: process.env.E2E_TEST_USER_EMAIL || "test1@slideheroes.com",
		password: process.env.E2E_TEST_USER_PASSWORD || "aiesec1992",
	});

	await page.context().storageState({ path: testAuthFile });
});

test("authenticate as owner user", async ({ page }) => {
	const auth = new AuthPageObject(page);

	// Use the actual owner user from the E2E seed data
	await auth.loginAsUser({
		email: process.env.E2E_OWNER_EMAIL || "test1@slideheroes.com",
		password: process.env.E2E_OWNER_PASSWORD || "aiesec1992",
	});

	await page.context().storageState({ path: ownerAuthFile });
});

test("authenticate as super-admin user", async ({ page }) => {
	const auth = new AuthPageObject(page);

	// Use the actual super-admin user from the E2E seed data
	await auth.loginAsSuperAdmin({
		email: process.env.E2E_ADMIN_EMAIL || "michael@slideheroes.com",
		password: process.env.E2E_ADMIN_PASSWORD || "aiesec1992",
	});

	await page.context().storageState({ path: superAdminAuthFile });
});
