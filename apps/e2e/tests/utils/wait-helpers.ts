import type { Page } from "@playwright/test";

/**
 * Waits for network idle with a fallback to domcontentloaded if network never settles.
 * This is useful for CI environments where network conditions may be unreliable.
 *
 * @param page - The Playwright page object
 * @param options - Optional configuration
 * @returns Promise that resolves when load state is reached
 */
export async function waitForNetworkIdleWithFallback(
	page: Page,
	options: {
		timeout?: number;
		fallbackToDOM?: boolean;
	} = {},
): Promise<void> {
	const { timeout = process.env.CI ? 30000 : 20000, fallbackToDOM = true } =
		options;

	try {
		await page.waitForLoadState("networkidle", { timeout });
	} catch (error) {
		if (fallbackToDOM) {
			if (process.env.DEBUG) {
				process.stdout.write(
					`Network idle timeout after ${timeout}ms, falling back to domcontentloaded\n`,
				);
			}
			await page.waitForLoadState("domcontentloaded", {
				timeout: Math.min(timeout / 2, 10000),
			});
		} else {
			throw error;
		}
	}
}

/**
 * Waits for page navigation with resilient timeout handling.
 *
 * @param page - The Playwright page object
 * @param url - URL pattern to wait for
 * @param options - Optional configuration
 * @returns Promise that resolves when navigation is complete
 */
export async function waitForNavigationWithRetry(
	page: Page,
	url: string | RegExp | ((url: URL) => boolean),
	options: {
		timeout?: number;
		maxAttempts?: number;
	} = {},
): Promise<void> {
	const { timeout = process.env.CI ? 30000 : 15000, maxAttempts = 2 } = options;

	let lastError: Error | undefined;

	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		try {
			await page.waitForURL(url, { timeout });
			return;
		} catch (error) {
			lastError = error as Error;
			if (attempt < maxAttempts) {
				if (process.env.DEBUG) {
					process.stdout.write(
						`Navigation attempt ${attempt} failed, retrying... (${lastError.message})\n`,
					);
				}
				// Wait a bit before retry
				await page.waitForTimeout(1000);
			}
		}
	}

	// If all attempts failed, throw the last error
	throw lastError;
}
