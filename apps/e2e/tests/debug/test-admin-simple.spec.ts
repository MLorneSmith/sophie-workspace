import { TOTP } from "totp-generator";
import { expect, test } from "../utils/base-test";

const ADMIN_EMAIL = "michael@slideheroes.com";
const ADMIN_PASSWORD = "aiesec1992";
const MFA_KEY = "NHOHJVGPO3R3LKVPRMNIYLCDMBHUM2SE";

test("debug admin access", async ({ page }) => {
	// Sign in as admin
	await page.goto("http://localhost:3001/auth/sign-in");
	await page.fill('input[name="email"]', ADMIN_EMAIL);
	await page.fill('input[name="password"]', ADMIN_PASSWORD);
	await page.click('button[type="submit"]');

	// Wait for MFA page
	await page.waitForURL("**/auth/verify", { timeout: 10000 });
	console.log("✓ Redirected to MFA verification");

	// Generate and submit OTP
	const { otp } = await TOTP.generate(MFA_KEY, { period: 30 });
	console.log(`✓ Generated OTP: ${otp}`);

	await page.fill("[data-input-otp]", otp);
	await page.click('[data-testid="submit-mfa-button"]');

	// Wait for redirect after MFA
	await page.waitForURL("**/home", { timeout: 10000 });
	console.log("✓ MFA successful, redirected to /home");

	// Try to access admin
	await page.goto("http://localhost:3001/admin");
	await page.waitForLoadState("networkidle");

	// Check if we're on admin page or 404
	const url = page.url();
	const title = await page.title();
	const heading = await page.locator("h1").first().textContent();

	console.log(`Current URL: ${url}`);
	console.log(`Page title: ${title}`);
	console.log(`First h1: ${heading}`);

	// Check for admin dashboard elements
	const isOnAdminPage = url.includes("/admin") && !url.includes("/404");
	const has404 =
		heading?.includes("not exist") ||
		heading?.includes("Ouch") ||
		heading?.includes("404");

	if (has404) {
		console.log("❌ Got 404 on admin page");
	} else if (isOnAdminPage) {
		console.log("✓ Successfully accessed admin page");
	} else {
		console.log(`❓ Unexpected state: URL=${url}, heading=${heading}`);
	}

	expect(has404).toBe(false);
});
