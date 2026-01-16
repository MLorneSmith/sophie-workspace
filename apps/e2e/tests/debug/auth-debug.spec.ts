import { test } from "../utils/base-test";

/**
 * Debug test to identify what selectors are actually available on the sign-in page
 */
test.describe("Auth Debug", () => {
	test("debug sign-in page selectors", async ({ page }) => {
		// Navigate to sign-in page
		await page.goto("/auth/sign-in");

		// Wait for page to load
		await page.waitForLoadState("domcontentloaded");

		// Get all form inputs
		const inputs = await page.locator("input").all();
		console.log(`Found ${inputs.length} input elements`);

		// Log details about each input
		for (let i = 0; i < inputs.length; i++) {
			const input = inputs[i];
			const type = await input.getAttribute("type");
			const name = await input.getAttribute("name");
			const placeholder = await input.getAttribute("placeholder");
			const id = await input.getAttribute("id");
			const dataTestId = await input.getAttribute("data-testid");
			const dataTest = await input.getAttribute("data-test");

			console.log(`Input ${i}:`);
			console.log(`  type: ${type}`);
			console.log(`  name: ${name}`);
			console.log(`  placeholder: ${placeholder}`);
			console.log(`  id: ${id}`);
			console.log(`  data-testid: ${dataTestId}`);
			console.log(`  data-test: ${dataTest}`);
		}

		// Get all buttons
		const buttons = await page.locator("button").all();
		console.log(`\nFound ${buttons.length} button elements`);

		// Log details about each button
		for (let i = 0; i < buttons.length; i++) {
			const button = buttons[i];
			const text = await button.textContent();
			const type = await button.getAttribute("type");
			const dataTestId = await button.getAttribute("data-testid");
			const dataTest = await button.getAttribute("data-test");

			console.log(`Button ${i}:`);
			console.log(`  text: ${text}`);
			console.log(`  type: ${type}`);
			console.log(`  data-testid: ${dataTestId}`);
			console.log(`  data-test: ${dataTest}`);
		}

		// Get all links
		const links = await page.locator("a").all();
		console.log(`\nFound ${links.length} link elements`);

		// Log hrefs of links
		for (let i = 0; i < links.length; i++) {
			const link = links[i];
			const href = await link.getAttribute("href");
			const text = await link.textContent();
			console.log(`Link ${i}: ${text} -> ${href}`);
		}

		// Take a screenshot for visual inspection
		await page.screenshot({ path: "sign-in-debug.png" });
		console.log("\nScreenshot saved as sign-in-debug.png");
	});
});
