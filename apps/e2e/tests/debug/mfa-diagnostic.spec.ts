import { test } from "../utils/base-test";
import { TOTP } from "totp-generator";

const MFA_KEY = "NHOHJVGPO3R3LKVPRMNIYLCDMBHUM2SE";

test("MFA page diagnostic", async ({ page }) => {
	// Login as michael@slideheroes.com
	await page.goto("/auth/sign-in?next=/auth/verify");

	console.log("Filling credentials for michael@slideheroes.com...");
	await page.fill('[name="email"]', "michael@slideheroes.com");
	await page.fill('[name="password"]', "aiesec1992");
	await page.click('button[type="submit"]');

	console.log("Waiting for navigation to /auth/verify...");
	await page.waitForURL("**/auth/verify", { timeout: 15000 });
	console.log("✅ Successfully navigated to:", page.url());

	// Take screenshot
	await page.screenshot({
		path: "./test-results/mfa-page-initial.png",
		fullPage: true,
	});

	// Check for MFA input
	const mfaInput = page.locator("[data-input-otp]");
	const mfaInputCount = await mfaInput.count();
	console.log("MFA input count:", mfaInputCount);

	if (mfaInputCount > 0) {
		const isVisible = await mfaInput.isVisible();
		console.log("MFA input visible:", isVisible);

		// Check if it's focused
		const isFocused = await mfaInput.evaluate((el) => el.matches(":focus"));
		console.log("MFA input focused:", isFocused);
	} else {
		console.log("❌ MFA input NOT FOUND");
		// Dump all inputs on the page
		const allInputs = await page.$$eval("input", (inputs) =>
			inputs.map((input) => ({
				type: input.type,
				name: input.getAttribute("name"),
				id: input.id,
				className: input.className,
				placeholder: input.placeholder,
			})),
		);
		console.log("All inputs found:", JSON.stringify(allInputs, null, 2));
	}

	// Check for submit button
	const submitButton = page.locator('[data-testid="submit-mfa-button"]');
	const buttonCount = await submitButton.count();
	console.log("Submit button count:", buttonCount);

	if (buttonCount > 0) {
		const isVisible = await submitButton.isVisible();
		console.log("Submit button visible:", isVisible);
		const isDisabled = await submitButton.isDisabled();
		console.log("Submit button disabled:", isDisabled);
	} else {
		console.log("❌ Submit button NOT FOUND");
		// Dump all buttons
		const allButtons = await page.$$eval("button", (buttons) =>
			buttons.map((btn) => ({
				type: btn.type,
				text: btn.textContent?.trim(),
				dataTest: btn.getAttribute("data-test"),
				disabled: btn.disabled,
				className: btn.className,
			})),
		);
		console.log("All buttons found:", JSON.stringify(allButtons, null, 2));
	}

	// Check page title and heading
	const title = await page.title();
	console.log("Page title:", title);

	const h1 = await page.locator("h1").first().textContent();
	console.log("H1 heading:", h1);

	// Generate and enter OTP if input exists
	if (mfaInputCount > 0) {
		console.log("Generating TOTP code...");
		const { otp } = await TOTP.generate(MFA_KEY, { period: 30 });
		console.log("Generated OTP:", otp);

		console.log("Entering OTP...");
		await mfaInput.pressSequentially(otp, { delay: 50 });

		// Wait a bit for validation
		await page.waitForTimeout(2000);

		// Take screenshot after entering OTP
		await page.screenshot({
			path: "./test-results/mfa-page-after-otp.png",
			fullPage: true,
		});

		// Check button state again
		if (buttonCount > 0) {
			const isDisabledAfter = await submitButton.isDisabled();
			console.log("Submit button disabled after OTP:", isDisabledAfter);

			// Check using waitForFunction
			console.log("Checking button enable state with waitForFunction...");
			try {
				await page.waitForFunction(
					() => {
						const button = document.querySelector(
							'[data-testid="submit-mfa-button"]',
						);
						console.log("Button found in function:", !!button);
						if (button) {
							console.log(
								"Button disabled attribute:",
								button.hasAttribute("disabled"),
							);
						}
						return button && !button.hasAttribute("disabled");
					},
					{ timeout: 5000 },
				);
				console.log("✅ Button became enabled!");
			} catch (e) {
				console.log(
					"❌ Button did not become enabled:",
					e instanceof Error ? e.message : String(e),
				);
			}
		}
	}

	// Wait a bit to see final state
	await page.waitForTimeout(2000);

	// Final screenshot
	await page.screenshot({
		path: "./test-results/mfa-page-final.png",
		fullPage: true,
	});
});
