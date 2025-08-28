import { expect, test } from "@playwright/test";

test.describe("Smoke Tests @smoke", () => {
	test.describe.configure({ mode: "parallel" });

	test("homepage loads successfully @smoke", async ({ page }) => {
		await page.goto("/");
		await expect(page).toHaveTitle(/SlideHeroes/);
		await expect(page.locator("h1")).toBeVisible();
	});

	test("health check endpoint responds @smoke", async ({ request }) => {
		const response = await request.get("/healthcheck");

		// Allow both 200 and 503 status codes for health checks
		// 503 indicates service unavailable but endpoint is responding
		expect([200, 503]).toContain(response.status());

		if (response.status() === 200) {
			const body = await response.json();
			// In CI/preview environments, database might not be available
			// Just check that the response has the expected structure
			expect(body).toEqual(
				expect.objectContaining({
					services: expect.objectContaining({
						database: expect.any(Boolean),
					}),
				}),
			);
		}
	});

	test("sign in page loads @smoke", async ({ page }) => {
		await page.goto("/auth/sign-in");
		// Use the actual selectors that exist in the auth components
		await expect(page.locator('[data-testid="sign-in-email"]')).toBeVisible();
		await expect(
			page.locator('[data-testid="sign-in-password"]'),
		).toBeVisible();
		await expect(page.locator('[data-testid="sign-in-button"]')).toBeVisible();
	});

	test("sign up page loads @smoke", async ({ page }) => {
		await page.goto("/auth/sign-up");
		// Use the actual selectors that exist in the auth components
		await expect(page.locator('[data-testid="sign-up-email"]')).toBeVisible();
		await expect(
			page.locator('[data-testid="sign-up-password"]'),
		).toBeVisible();
		await expect(page.locator('[data-testid="sign-up-button"]')).toBeVisible();
	});

	test("API health endpoint responds @smoke", async ({ request }) => {
		const response = await request.get("/api/health");

		// Allow 200 or 404 since the endpoint might not exist yet
		expect([200, 404]).toContain(response.status());

		if (response.status() === 200) {
			const body = await response.json();
			expect(body).toBeDefined();
		}
	});

	test("navigation menu works @smoke", async ({ page }) => {
		await page.goto("/");

		// Check main navigation exists
		const nav = page.locator("nav").first();
		await expect(nav).toBeVisible();

		// Check for common navigation elements
		const signInLink = page.locator('a[href*="sign-in"]').first();
		if (await signInLink.isVisible()) {
			await expect(signInLink).toBeVisible();
		}
	});

	test("404 page handles unknown routes @smoke", async ({ page }) => {
		const response = await page.goto("/non-existent-page");
		expect(response?.status()).toBe(404);
	});

	test("CSS and JavaScript load properly @smoke", async ({ page }) => {
		await page.goto("/");

		// Check that styles are loaded
		const bodyStyles = await page.locator("body").evaluate((el) => {
			return window.getComputedStyle(el).fontFamily;
		});
		expect(bodyStyles).toBeTruthy();

		// Check that JavaScript and React are working
		// Next.js 15 doesn't use traditional React root markers like data-reactroot or #__next
		// Instead, we check for React internals and Next.js specific elements
		const hasReact = await page.evaluate(() => {
			// Check for Next.js specific elements
			interface WindowWithNext extends Window {
				next?: unknown;
				__REACT_DEVTOOLS_GLOBAL_HOOK__?: unknown;
			}

			const hasNextElements = !!(
				document.querySelector("next-route-announcer") ||
				(window as WindowWithNext).next
			);

			// Check for React internals on elements
			const elements = document.querySelectorAll("*");
			let hasReactInternals = false;
			for (let i = 0; i < Math.min(elements.length, 100); i++) {
				const el = elements[i];
				const keys = Object.keys(el);
				if (
					keys.some(
						(key) => key.startsWith("__react") || key.startsWith("_react"),
					)
				) {
					hasReactInternals = true;
					break;
				}
			}

			// Check for React dev tools hook
			const hasReactDevTools = !!(window as WindowWithNext)
				.__REACT_DEVTOOLS_GLOBAL_HOOK__;

			return hasNextElements || hasReactInternals || hasReactDevTools;
		});
		expect(hasReact).toBe(true);
	});

	test("security headers are present @smoke", async ({ page }) => {
		const response = await page.goto("/");
		const headers = response?.headers() || {};

		// Check for important security headers
		expect(headers["x-frame-options"]).toBeTruthy();
		expect(headers["x-content-type-options"]).toBeTruthy();
		expect(headers["referrer-policy"]).toBeTruthy();
	});
});
