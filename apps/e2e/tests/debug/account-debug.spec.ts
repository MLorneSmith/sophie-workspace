import { AuthPageObject } from "../authentication/auth.po";
import { TEST_USERS } from "../helpers/test-users";
import { test } from "../utils/base-test";

/**
 * Debug test to identify what elements are actually available on the settings page
 */
test.describe("Account Settings Debug", () => {
	test("debug settings page elements", async ({ page }) => {
		const auth = new AuthPageObject(page);

		// Sign in first
		await auth.goToSignIn();
		await auth.signIn({
			email: TEST_USERS.user1.email,
			password: TEST_USERS.user1.password,
		});

		// Wait for successful sign-in
		await page.waitForURL(
			(url) => {
				const pathname = url.pathname;
				return pathname.includes("/home") || pathname.includes("/onboarding");
			},
			{ timeout: 15000 },
		);

		// Navigate to settings page
		await page.goto("/home/settings", { waitUntil: "domcontentloaded" });
		await page.waitForTimeout(2000); // Give page time to load

		// Get all text content on the page
		const pageText = await page.textContent("body");
		console.log(
			"Page contains test email?",
			pageText?.includes(TEST_USERS.user1.email),
		);

		// Look for email in various ways
		console.log("\nSearching for email displays:");

		// Check for email in any text element
		const emailTexts = await page
			.locator(`text="${TEST_USERS.user1.email}"`)
			.count();
		console.log(`Text elements with email: ${emailTexts}`);

		// Check for email in input values
		const emailInputs = await page
			.locator(`input[value="${TEST_USERS.user1.email}"]`)
			.count();
		console.log(`Input elements with email value: ${emailInputs}`);

		// Check for any input with email type
		const emailTypeInputs = await page.locator('input[type="email"]').all();
		console.log(`Email type inputs found: ${emailTypeInputs.length}`);
		for (let i = 0; i < emailTypeInputs.length; i++) {
			const value = await emailTypeInputs[i].inputValue();
			console.log(`  Email input ${i} value: ${value}`);
		}

		// Check for any element containing the email as text
		const elementsWithEmail = await page
			.locator(`*:has-text("${TEST_USERS.user1.email}")`)
			.count();
		console.log(`Elements containing email text: ${elementsWithEmail}`);

		// Get all inputs on the page
		const allInputs = await page.locator("input").all();
		console.log(`\nAll inputs on page: ${allInputs.length}`);
		for (let i = 0; i < allInputs.length; i++) {
			const input = allInputs[i];
			const name = await input.getAttribute("name");
			const value = await input.inputValue();
			const type = await input.getAttribute("type");
			const placeholder = await input.getAttribute("placeholder");
			const disabled = await input.isDisabled();
			const readonly = await input.getAttribute("readonly");

			console.log(`Input ${i}:`);
			console.log(`  name: ${name}`);
			console.log(`  type: ${type}`);
			console.log(`  value: ${value || "(empty)"}`);
			console.log(`  placeholder: ${placeholder}`);
			console.log(`  disabled: ${disabled}`);
			console.log(`  readonly: ${readonly}`);
		}

		// Check for sign out buttons/links
		console.log("\nSign out elements:");
		const signOutButtons = await page
			.locator(
				'button:has-text("sign out"), button:has-text("logout"), a:has-text("sign out"), a:has-text("logout")',
			)
			.count();
		console.log(`Sign out buttons/links found: ${signOutButtons}`);

		// Look for any dropdown or menu buttons
		const dropdownButtons = await page
			.locator(
				'button[aria-haspopup], button[data-state], button[role="combobox"]',
			)
			.count();
		console.log(`Dropdown/menu buttons found: ${dropdownButtons}`);

		// Take screenshot
		await page.screenshot({ path: "settings-debug.png", fullPage: true });
		console.log("\nScreenshot saved as settings-debug.png");
	});
});
