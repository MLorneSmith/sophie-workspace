import { expect, test } from "@playwright/test";

test("debug authentication", async ({ page }) => {
	console.log("1. Navigating to sign-in page...");
	await page.goto("/auth/sign-in");

	console.log("2. Filling email...");
	await page.fill('input[name="email"]', "test1@slideheroes.com");

	console.log("3. Filling password...");
	await page.fill('input[name="password"]', "aiesec1992");

	console.log("4. Clicking submit button...");
	await page.click('button[type="submit"]');

	console.log("5. Waiting for navigation...");
	try {
		await page.waitForURL("/home", { timeout: 10000 });
		console.log("✅ Successfully navigated to /home");
	} catch (error) {
		console.log("❌ Failed to navigate to /home");
		console.log("Current URL:", page.url());

		// Check for error messages
		const errorMessage = await page
			.locator('[data-test="auth-error-message"]')
			.textContent()
			.catch(() => null);
		if (errorMessage) {
			console.log("Error message:", errorMessage);
		}

		// Check if we're stuck on sign-in page
		if (page.url().includes("/auth/sign-in")) {
			console.log("Still on sign-in page");
		}

		throw error;
	}

	expect(page.url()).toContain("/home");
});
