import { join } from "node:path";
import { cwd } from "node:process";
import { test } from "@playwright/test";

import { AuthPageObject } from "./authentication/auth.po";

// Billing tests only need test user authentication, not super-admin
const billingAuthFile = join(cwd(), ".auth/billing-user.json");

test("authenticate as test user for billing", async ({ page }) => {
	const auth = new AuthPageObject(page);

	// Use the actual test user from the E2E seed data
	const email = process.env.E2E_TEST_USER_EMAIL || "test1@slideheroes.com";
	const password = process.env.E2E_TEST_USER_PASSWORD || "";
	if (!password) throw new Error("E2E_TEST_USER_PASSWORD not set");

	console.log("Authenticating as test user for billing tests...");

	// Use the loginAsUser method which properly handles auth flow and waits for navigation
	await auth.loginAsUser({
		email,
		password,
		next: "/home",
	});

	console.log("Authentication complete. Current URL:", page.url());

	// Ensure we're actually authenticated and on the home page
	const currentUrl = page.url();
	if (currentUrl.includes("/auth/sign-in")) {
		throw new Error(
			`Authentication failed - still on sign-in page: ${currentUrl}`,
		);
	}

	// Save the authentication state
	await page.context().storageState({ path: billingAuthFile });
	console.log("Authentication state saved to", billingAuthFile);
});
