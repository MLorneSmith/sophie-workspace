import { join } from "node:path";
import { cwd } from "node:process";
import { test } from "@playwright/test";

import { AuthPageObject } from "./authentication/auth.po";

const testAuthFile = join(cwd(), ".auth/test@makerkit.dev.json");
const ownerAuthFile = join(cwd(), ".auth/owner@makerkit.dev.json");
const superAdminAuthFile = join(cwd(), ".auth/super-admin@makerkit.dev.json");

test("authenticate as test user", async ({ page }) => {
	const auth = new AuthPageObject(page);

	await auth.loginAsUser({
		email: process.env.E2E_TEST_USER_EMAIL || "test@example.com",
		password: process.env.E2E_TEST_USER_PASSWORD || "testpassword123",
	});

	await page.context().storageState({ path: testAuthFile });
});

test("authenticate as owner user", async ({ page }) => {
	const auth = new AuthPageObject(page);

	await auth.loginAsUser({
		email: process.env.E2E_OWNER_EMAIL || "owner@example.com",
		password: process.env.E2E_OWNER_PASSWORD || "testpassword123",
	});

	await page.context().storageState({ path: ownerAuthFile });
});

test("authenticate as super-admin user", async ({ page }) => {
	const auth = new AuthPageObject(page);

	await auth.loginAsSuperAdmin({
		email: process.env.E2E_ADMIN_EMAIL || "admin@example.com",
		password: process.env.E2E_ADMIN_PASSWORD || "testpassword123",
	});

	await page.context().storageState({ path: superAdminAuthFile });
});
