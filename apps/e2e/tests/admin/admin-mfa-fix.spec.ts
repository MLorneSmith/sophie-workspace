import { expect, test } from "@playwright/test";
import { TOTP } from "totp-generator";

const ADMIN_EMAIL = "michael@slideheroes.com";
const ADMIN_PASSWORD = "aiesec1992";
const MFA_KEY = "NHOHJVGPO3R3LKVPRMNIYLCDMBHUM2SE";

test("admin access with forced MFA", async ({ page }) => {
	// Step 1: Sign in as admin
	await page.goto("http://localhost:3001/auth/sign-in");
	await page.fill('input[name="email"]', ADMIN_EMAIL);
	await page.fill('input[name="password"]', ADMIN_PASSWORD);
	await page.click('button[type="submit"]');

	// Step 2: Check where we land after login
	await page.waitForURL(
		(url) => {
			return url.pathname === "/home" || url.pathname === "/auth/verify";
		},
		{ timeout: 10000 },
	);

	const currentPath = page.url();
	console.log(`After login, redirected to: ${currentPath}`);

	// Step 3: If we're on /home (no MFA required), manually navigate to verify
	if (currentPath.includes("/home")) {
		console.log(
			"MFA not automatically required, manually navigating to /auth/verify",
		);
		// Navigate to MFA verify page with admin as next destination
		await page.goto("http://localhost:3001/auth/verify?next=/admin");

		// Check if we're allowed to access the verify page
		await page.waitForLoadState("networkidle");

		// Check if MFA form is present
		const hasMfaForm = await page
			.locator("[data-input-otp]")
			.isVisible()
			.catch(() => false);

		if (!hasMfaForm) {
			console.log(
				"MFA form not available - may need to trigger MFA challenge first",
			);
			// Try to trigger MFA challenge by accessing admin directly
			await page.goto("http://localhost:3001/admin");
			await page.waitForLoadState("networkidle");

			// Check if we got redirected to verify page
			if (page.url().includes("/auth/verify")) {
				console.log("Successfully triggered MFA challenge by accessing admin");
			}
		}
	}

	// Step 4: If we're on the verify page, complete MFA
	if (page.url().includes("/auth/verify")) {
		console.log("On MFA verification page, submitting OTP");

		// Generate and submit OTP
		const { otp } = TOTP.generate(MFA_KEY, { period: 30 });
		console.log(`Generated OTP: ${otp}`);

		await page.fill("[data-input-otp]", otp);
		await page.click('[data-test="submit-mfa-button"]');

		// Wait for redirect after MFA
		await page.waitForURL(
			(url) => {
				return !url.includes("/auth/verify");
			},
			{ timeout: 10000 },
		);

		console.log(`After MFA, redirected to: ${page.url()}`);
	}

	// Step 5: Now try to access admin
	await page.goto("http://localhost:3001/admin");
	await page.waitForLoadState("networkidle");

	// Step 6: Check if we're on admin page or 404
	const finalUrl = page.url();
	const heading = await page.locator("h1").first().textContent();

	console.log(`Final URL: ${finalUrl}`);
	console.log(`Page heading: ${heading}`);

	const has404 =
		heading?.includes("not exist") ||
		heading?.includes("Ouch") ||
		heading?.includes("404");
	const isOnAdminPage =
		finalUrl.includes("/admin") && !finalUrl.includes("/404");

	if (has404) {
		console.log("❌ Still getting 404 on admin page after MFA");
		// Take a screenshot for debugging
		await page.screenshot({ path: "admin-404-after-mfa.png" });
	} else if (isOnAdminPage) {
		console.log("✅ Successfully accessed admin page with MFA");
	}

	expect(has404).toBe(false);
});
