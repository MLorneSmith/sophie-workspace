import { test, expect } from "@playwright/test";
import { AUTH_STATES } from "../utils/auth-state";
import { CI_TIMEOUTS } from "../utils/wait-for-hydration";

// Use pre-authenticated storage state
test.use({ storageState: AUTH_STATES.TEST_USER });

test("debug storage state auth - simulating team-accounts flow", async ({
	page,
	context,
}) => {
	// Log cookies before navigation
	console.log("=== Cookies BEFORE navigation ===");
	const cookiesBefore = await context.cookies();
	console.log(
		"Cookies:",
		JSON.stringify(
			cookiesBefore.map((c) => ({
				name: c.name,
				domain: c.domain,
				path: c.path,
			})),
			null,
			2,
		),
	);

	// Navigate to /home and capture all redirects
	console.log("\n=== Navigating to /home ===");

	// Track redirects
	const redirects: string[] = [];
	page.on("response", (response) => {
		const status = response.status();
		if (status >= 300 && status < 400) {
			redirects.push(
				`${response.url()} -> ${response.headers().location || "no location"} (${status})`,
			);
		}
	});

	const response = await page.goto("/home", {
		waitUntil: "domcontentloaded",
		timeout: CI_TIMEOUTS.navigation,
	});
	console.log("Initial response status:", response?.status());
	console.log("Initial response URL:", response?.url());
	console.log("Page URL after goto:", page.url());
	console.log("Redirects observed:", JSON.stringify(redirects, null, 2));

	// Also check what cookies the server received
	const requestHeaders = await page.evaluate(() => {
		return {
			documentCookie: document.cookie,
		};
	});
	console.log("Document cookie:", requestHeaders.documentCookie);

	// Log cookies after navigation
	console.log("\n=== Cookies AFTER navigation ===");
	const cookiesAfter = await context.cookies();
	console.log(
		"Cookies:",
		JSON.stringify(
			cookiesAfter.map((c) => ({
				name: c.name,
				domain: c.domain,
				path: c.path,
			})),
			null,
			2,
		),
	);

	// Take screenshot
	await page.screenshot({ path: "/tmp/debug-storage-state.png" });
	console.log("Screenshot saved to /tmp/debug-storage-state.png");

	// Check if we're authenticated - look for team selector
	console.log("\n=== Checking for team-selector ===");
	const teamSelector = page.locator('[data-testid="team-selector"]');
	const hasTeamSelector = await teamSelector.isVisible().catch(() => false);
	console.log("Has team-selector:", hasTeamSelector);

	// Debug: print all data-testid elements
	const allTestIds = await page.evaluate(() => {
		const elements = document.querySelectorAll("[data-testid]");
		return Array.from(elements).map((el) => ({
			testId: el.getAttribute("data-testid"),
			tagName: el.tagName,
			visible:
				el.getBoundingClientRect().width > 0 &&
				el.getBoundingClientRect().height > 0,
		}));
	});
	console.log("All data-testid elements:", JSON.stringify(allTestIds, null, 2));

	// Check if we're on the right page
	const isOnHome = page.url().includes("/home");
	const isOnMarketing =
		!isOnHome &&
		(page.url() === "http://localhost:3001/" || page.url().includes("/auth/"));
	console.log("Is on /home:", isOnHome);
	console.log("Is on marketing/auth:", isOnMarketing);

	// Verify we're authenticated
	expect(isOnHome).toBe(true);
	expect(hasTeamSelector).toBe(true);
});
