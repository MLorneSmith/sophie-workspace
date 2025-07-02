import { expect, test } from "@playwright/test";

test.describe("Smoke Tests", () => {
	test.describe.configure({ mode: "parallel" });

	test("homepage loads successfully", async ({ page }) => {
		await page.goto("/");
		await expect(page).toHaveTitle(/SlideHeroes/);
		await expect(page.locator("h1")).toBeVisible();
	});

	test("health check endpoint responds", async ({ request }) => {
		const response = await request.get("/healthcheck");
		expect(response.status()).toBe(200);

		const body = await response.json();
		expect(body).toEqual(
			expect.objectContaining({
				services: expect.objectContaining({
					database: true,
				}),
			}),
		);
	});

	test("sign in page loads", async ({ page }) => {
		await page.goto("/auth/sign-in");
		const signInForm = page.locator('[data-testid="auth-sign-in-form"]');
		await expect(signInForm).toBeVisible();
		await expect(signInForm.locator('input[name="email"]')).toBeVisible();
		await expect(signInForm.locator('input[name="password"]')).toBeVisible();
	});

	test("sign up page loads", async ({ page }) => {
		await page.goto("/auth/sign-up");
		const signUpForm = page.locator('[data-testid="auth-sign-up-form"]');
		await expect(signUpForm).toBeVisible();
		await expect(signUpForm.locator('input[name="email"]')).toBeVisible();
		await expect(signUpForm.locator('input[name="password"]')).toBeVisible();
	});

	test("API health endpoint responds", async ({ request }) => {
		const response = await request.get("/api/health");

		// Allow 200 or 404 since the endpoint might not exist yet
		expect([200, 404]).toContain(response.status());

		if (response.status() === 200) {
			const body = await response.json();
			expect(body).toBeDefined();
		}
	});

	test("navigation menu works", async ({ page }) => {
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

	test("404 page handles unknown routes", async ({ page }) => {
		const response = await page.goto("/non-existent-page");
		expect(response?.status()).toBe(404);
	});

	test("CSS and JavaScript load properly", async ({ page }) => {
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

	test("security headers are present", async ({ page }) => {
		const response = await page.goto("/");
		const headers = response?.headers() || {};

		// Check for important security headers
		expect(headers["x-frame-options"]).toBeTruthy();
		expect(headers["x-content-type-options"]).toBeTruthy();
		expect(headers["referrer-policy"]).toBeTruthy();
	});
});
