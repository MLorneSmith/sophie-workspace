import { expect, type Locator, type Page } from "@playwright/test";

/**
 * Centralized hydration wait utility for CI reliability.
 * Addresses intermittent element visibility timeouts (Issue #1051) by providing:
 * - Environment-aware timeouts (longer for CI)
 * - Aggressive retry intervals with exponential backoff
 * - toPass() patterns for automatic retries
 * - Consistent hydration waiting across all tests
 */

/**
 * Environment-aware timeout configuration.
 * CI environments need longer timeouts due to:
 * - Vercel serverless cold starts
 * - React hydration delays on deployed environments
 * - Network latency variance
 *
 * **TIMEOUT HIERARCHY ARCHITECTURE** (Issue #1139, #1140)
 *
 * Test Suite (120s global test timeout in playwright.config.ts)
 * │
 * ├─ Test with multiple operations
 * │  ├─ Operation 1: API call + UI update (~60s)
 * │  │  ├─ Setup & hydration (20s)
 * │  │  ├─ User interactions (10s)
 * │  │  ├─ API response wait (20s)
 * │  │  └─ State update & assertions (10s)
 * │  │
 * │  └─ Operation 2: API call + UI update (~60s)
 * │     └─ (same breakdown)
 * │
 * └─ Test cannot timeout if sub-operations sum > test timeout
 *
 * **Formula: Test Timeout ≥ Sum of All Sub-Operation Timeouts**
 *
 * The CI_TIMEOUTS.element value (90s) ensures:
 * - Individual operations within a test can complete
 * - Test timeout (120s) is sufficient for multi-operation tests
 * - Adequate buffer for network variance and CI overhead
 *
 * **Rule**: Never set element timeout > test timeout
 * Violating this creates mathematical impossibility (test times out
 * waiting for operation that itself will timeout first).
 *
 * Reference: Playwright test architecture best practices
 * - global test timeout: 120s (from playwright.config.ts)
 * - element visibility timeout: 90s (CI_TIMEOUTS.element)
 * - expect timeout: 30s (from playwright.config.ts)
 */
export const CI_TIMEOUTS = {
	/** Base element visibility timeout - CRITICAL: must be <= test timeout */
	element: process.env.CI ? 90_000 : 10_000,
	/** Navigation timeout */
	navigation: process.env.CI ? 60_000 : 30_000,
	/** Hydration wait timeout */
	hydration: process.env.CI ? 20_000 : 10_000,
	/** Short operation timeout */
	short: process.env.CI ? 15_000 : 5_000,
} as const;

/**
 * Retry intervals for toPass() operations.
 * Starts aggressive, then backs off to avoid overwhelming the server.
 * Total duration: ~45 seconds which fits within CI_TIMEOUTS.element
 */
export const RETRY_INTERVALS = [500, 1000, 2000, 5000, 10_000, 15_000] as const;

/**
 * Aggressive retry intervals for critical operations.
 * Used when we need faster initial retries.
 */
export const AGGRESSIVE_RETRY_INTERVALS = [
	100, 250, 500, 1000, 2000, 5000,
] as const;

/**
 * Wait for React hydration to complete on the page.
 * Checks for common hydration indicators:
 * - Form elements are interactive
 * - Submit buttons are enabled
 * - Page has loaded DOM content
 *
 * @param page - Playwright Page object
 * @param options - Configuration options
 */
export async function waitForHydration(
	page: Page,
	options: {
		/** Optional selector to wait for (e.g., 'form', '[data-testid="app"]') */
		selector?: string;
		/** Timeout in milliseconds (default: CI_TIMEOUTS.hydration) */
		timeout?: number;
		/** Enable debug logging */
		debug?: boolean;
	} = {},
): Promise<void> {
	const {
		selector = "body",
		timeout = CI_TIMEOUTS.hydration,
		debug = process.env.DEBUG === "true",
	} = options;

	if (debug) {
		console.log(`[Hydration] Waiting for hydration on ${selector}...`);
	}

	// Wait for DOM content loaded first
	await page.waitForLoadState("domcontentloaded", {
		timeout: CI_TIMEOUTS.short,
	});

	// Wait for the target element to be visible
	await page.waitForSelector(selector, { state: "visible", timeout });

	// Check for React hydration markers
	// React attaches event listeners and sets up state during hydration
	await page.waitForFunction(
		(sel) => {
			const element = document.querySelector(sel);
			if (!element) return false;

			// Check if there are any interactive elements that should be ready
			const buttons = element.querySelectorAll("button:not([disabled])");
			const inputs = element.querySelectorAll("input, textarea, select");
			const links = element.querySelectorAll("a[href]");

			// If there are interactive elements, verify at least one is in the DOM
			const hasInteractiveElements =
				buttons.length > 0 || inputs.length > 0 || links.length > 0;

			// If no interactive elements, just check the element exists
			if (!hasInteractiveElements) return true;

			// Check that at least one button is not disabled (indicates hydration complete)
			const hasEnabledButton =
				buttons.length > 0 ||
				element.querySelector('button[type="submit"]') !== null;

			return hasEnabledButton;
		},
		selector,
		{ timeout },
	);

	if (debug) {
		console.log(`[Hydration] Hydration complete for ${selector}`);
	}
}

/**
 * Wait for an element to be ready with toPass() retry pattern.
 * This is the recommended way to wait for elements in CI environments.
 *
 * @param locator - Playwright Locator for the element
 * @param options - Configuration options
 */
export async function waitForElementReady(
	locator: Locator,
	options: {
		/** Timeout in milliseconds (default: CI_TIMEOUTS.element) */
		timeout?: number;
		/** Retry intervals (default: RETRY_INTERVALS) */
		intervals?: readonly number[];
		/** Enable debug logging */
		debug?: boolean;
	} = {},
): Promise<void> {
	const {
		timeout = CI_TIMEOUTS.element,
		intervals = RETRY_INTERVALS,
		debug = process.env.DEBUG === "true",
	} = options;

	if (debug) {
		console.log("[ElementReady] Waiting for element with toPass()...");
	}

	await expect(async () => {
		await expect(locator).toBeVisible({ timeout: CI_TIMEOUTS.short });
	}).toPass({
		timeout,
		intervals: intervals as number[],
	});

	if (debug) {
		console.log("[ElementReady] Element is ready");
	}
}

/**
 * Navigate to a URL and wait for React hydration to complete.
 * Combines goto with hydration waiting for reliable navigation.
 *
 * @param page - Playwright Page object
 * @param url - URL to navigate to (relative or absolute)
 * @param options - Configuration options
 */
export async function navigateAndWaitForHydration(
	page: Page,
	url: string,
	options: {
		/** Optional selector to wait for after navigation */
		waitForSelector?: string;
		/** Navigation timeout (default: CI_TIMEOUTS.navigation) */
		timeout?: number;
		/** Enable debug logging */
		debug?: boolean;
	} = {},
): Promise<void> {
	const {
		waitForSelector = "body",
		timeout = CI_TIMEOUTS.navigation,
		debug = process.env.DEBUG === "true",
	} = options;

	if (debug) {
		console.log(`[Navigate] Navigating to ${url}...`);
	}

	// Navigate with domcontentloaded to avoid networkidle hangs
	await page.goto(url, {
		waitUntil: "domcontentloaded",
		timeout,
	});

	// Wait for hydration
	await waitForHydration(page, {
		selector: waitForSelector,
		timeout: CI_TIMEOUTS.hydration,
		debug,
	});

	if (debug) {
		console.log(`[Navigate] Navigation complete to ${url}`);
	}
}

/**
 * Wait for a click operation to succeed with retry pattern.
 * Useful for buttons that may not be immediately interactive after hydration.
 *
 * @param locator - Playwright Locator for the clickable element
 * @param options - Configuration options
 */
export async function clickWithRetry(
	locator: Locator,
	options: {
		/** Timeout in milliseconds (default: CI_TIMEOUTS.element) */
		timeout?: number;
		/** Retry intervals (default: RETRY_INTERVALS) */
		intervals?: readonly number[];
		/** Enable debug logging */
		debug?: boolean;
	} = {},
): Promise<void> {
	const {
		timeout = CI_TIMEOUTS.element,
		intervals = RETRY_INTERVALS,
		debug = process.env.DEBUG === "true",
	} = options;

	if (debug) {
		console.log("[ClickRetry] Attempting click with toPass()...");
	}

	await expect(async () => {
		// First ensure element is visible
		await expect(locator).toBeVisible({ timeout: CI_TIMEOUTS.short });
		// Then click
		await locator.click();
	}).toPass({
		timeout,
		intervals: intervals as number[],
	});

	if (debug) {
		console.log("[ClickRetry] Click successful");
	}
}

/**
 * Wait for page content to be visible and interactive.
 * This is a convenience wrapper that combines common wait patterns.
 *
 * @param page - Playwright Page object
 * @param selector - CSS selector for the content to wait for
 * @param options - Configuration options
 */
export async function waitForContentReady(
	page: Page,
	selector: string,
	options: {
		/** Timeout in milliseconds (default: CI_TIMEOUTS.element) */
		timeout?: number;
		/** Retry intervals (default: RETRY_INTERVALS) */
		intervals?: readonly number[];
		/** Enable debug logging */
		debug?: boolean;
	} = {},
): Promise<void> {
	const {
		timeout = CI_TIMEOUTS.element,
		intervals = RETRY_INTERVALS,
		debug = process.env.DEBUG === "true",
	} = options;

	if (debug) {
		console.log(`[ContentReady] Waiting for ${selector}...`);
	}

	await expect(async () => {
		// Wait for DOM content loaded
		await page.waitForLoadState("domcontentloaded");

		// Wait for element
		const locator = page.locator(selector);
		await expect(locator).toBeVisible({ timeout: CI_TIMEOUTS.short });
	}).toPass({
		timeout,
		intervals: intervals as number[],
	});

	if (debug) {
		console.log(`[ContentReady] Content is ready for ${selector}`);
	}
}
