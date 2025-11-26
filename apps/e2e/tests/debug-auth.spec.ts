import { expect, test } from "@playwright/test";

test.describe("Debug Auth @debug", () => {
	test("check storage state cookies", async ({ page, context }) => {
		// Get all cookies before navigation
		const cookies = await context.cookies();
		// biome-ignore lint/suspicious/noConsole: Debug test
		console.log("=== COOKIES BEFORE NAVIGATION ===");
		// biome-ignore lint/suspicious/noConsole: Debug test
		console.log("Total cookies:", cookies.length);
		const authCookies = cookies.filter(
			(c) => c.name.includes("sb-") || c.name.includes("auth"),
		);
		// biome-ignore lint/suspicious/noConsole: Debug test
		console.log(
			"Auth cookies:",
			JSON.stringify(
				authCookies.map((c) => ({
					name: c.name,
					domain: c.domain,
					path: c.path,
					expires: c.expires,
					valueLength: c.value.length,
					valuePreview: `${c.value.substring(0, 50)}...`,
				})),
				null,
				2,
			),
		);

		// Navigate to home
		// biome-ignore lint/suspicious/noConsole: Debug test
		console.log("\n=== NAVIGATING TO /home ===");
		const response = await page.goto("/home", {
			waitUntil: "networkidle",
			timeout: 30000,
		});
		// biome-ignore lint/suspicious/noConsole: Debug test
		console.log("Response status:", response?.status());
		// biome-ignore lint/suspicious/noConsole: Debug test
		console.log("Final URL:", page.url());

		// Check if we were redirected to sign-in
		if (page.url().includes("/auth/sign-in")) {
			// biome-ignore lint/suspicious/noConsole: Debug test
			console.log("❌ REDIRECTED TO SIGN-IN - Auth not recognized!");
		} else {
			// biome-ignore lint/suspicious/noConsole: Debug test
			console.log("✅ Successfully accessed /home without redirect");
		}

		// Check cookies after navigation
		const cookiesAfter = await context.cookies();
		const authCookiesAfter = cookiesAfter.filter(
			(c) => c.name.includes("sb-") || c.name.includes("auth"),
		);
		// biome-ignore lint/suspicious/noConsole: Debug test
		console.log("\n=== COOKIES AFTER NAVIGATION ===");
		// biome-ignore lint/suspicious/noConsole: Debug test
		console.log(
			"Auth cookies:",
			JSON.stringify(
				authCookiesAfter.map((c) => ({
					name: c.name,
					domain: c.domain,
					expires: c.expires,
					valueLength: c.value.length,
				})),
				null,
				2,
			),
		);

		expect(page.url()).not.toContain("/auth/sign-in");
	});

	test("debug manual authentication", async ({ page }) => {
		// biome-ignore lint/suspicious/noConsole: Debug test
		console.log("1. Navigating to sign-in page...");
		await page.goto("/auth/sign-in");

		// biome-ignore lint/suspicious/noConsole: Debug test
		console.log("2. Filling email...");
		await page.fill('input[name="email"]', "test1@slideheroes.com");

		// biome-ignore lint/suspicious/noConsole: Debug test
		console.log("3. Filling password...");
		await page.fill('input[name="password"]', "aiesec1992");

		// biome-ignore lint/suspicious/noConsole: Debug test
		console.log("4. Clicking submit button...");
		await page.click('button[type="submit"]');

		// biome-ignore lint/suspicious/noConsole: Debug test
		console.log("5. Waiting for navigation...");
		try {
			await page.waitForURL("/home", { timeout: 10000 });
			// biome-ignore lint/suspicious/noConsole: Debug test
			console.log("✅ Successfully navigated to /home");
		} catch (error) {
			// biome-ignore lint/suspicious/noConsole: Debug test
			console.log("❌ Failed to navigate to /home");
			// biome-ignore lint/suspicious/noConsole: Debug test
			console.log("Current URL:", page.url());

			// Check for error messages
			const errorMessage = await page
				.locator('[data-test="auth-error-message"]')
				.textContent()
				.catch(() => null);
			if (errorMessage) {
				// biome-ignore lint/suspicious/noConsole: Debug test
				console.log("Error message:", errorMessage);
			}

			// Check if we're stuck on sign-in page
			if (page.url().includes("/auth/sign-in")) {
				// biome-ignore lint/suspicious/noConsole: Debug test
				console.log("Still on sign-in page");
			}

			throw error;
		}

		expect(page.url()).toContain("/home");
	});
});
