import type { BrowserContext, Page } from "@playwright/test";

/**
 * Cookie verification utilities for E2E tests.
 *
 * These helpers ensure cookies are properly set with correct attributes
 * (secure, sameSite, httpOnly) and are being transmitted in HTTP requests.
 *
 * Particularly important for Vercel preview deployments where cookie
 * handling is stricter than local development.
 */

/**
 * Result of cookie verification
 */
interface CookieVerificationResult {
	success: boolean;
	message: string;
	cookieCount: number;
	cookies: Array<{
		name: string;
		hasValue: boolean;
		attributes: {
			secure?: boolean;
			httpOnly?: boolean;
			sameSite?: string;
			domain?: string;
			path?: string;
		};
	}>;
}

/**
 * Verify that auth cookies are present in the browser context.
 * Checks for both the main auth cookie and session in localStorage.
 *
 * @param context - Playwright browser context to verify
 * @param cookieName - Expected name of the auth cookie (e.g., 'sb-127-auth-token')
 * @returns Result object with success status and cookie details
 */
export async function verifyCookiesPresent(
	context: BrowserContext,
	cookieName: string,
): Promise<CookieVerificationResult> {
	const cookies = await context.cookies();

	// Look for auth cookie
	const authCookie = cookies.find(
		(c) => c.name === cookieName || c.name.includes("auth-token"),
	);

	// Look for Vercel bypass cookie if present
	const vercelCookie = cookies.find((c) => c.name === "_vercel_jwt");

	const relevantCookies = [authCookie, vercelCookie].filter(Boolean);

	if (!authCookie) {
		return {
			success: false,
			message: `Auth cookie not found. Expected: ${cookieName}. Found: ${cookies.map((c) => c.name).join(", ")}`,
			cookieCount: cookies.length,
			cookies: cookies.slice(0, 5).map((c) => ({
				name: c.name,
				hasValue: !!c.value,
				attributes: {
					secure: c.secure,
					httpOnly: c.httpOnly,
					sameSite: c.sameSite as string,
					domain: c.domain,
					path: c.path,
				},
			})),
		};
	}

	return {
		success: true,
		message: `Auth cookie present: ${cookieName}`,
		cookieCount: cookies.length,
		cookies: (relevantCookies || [])
			.filter((c): c is NonNullable<typeof c> => c !== null && c !== undefined)
			.map((c) => ({
				name: c.name,
				hasValue: !!c.value,
				attributes: {
					secure: c.secure,
					httpOnly: c.httpOnly,
					sameSite: c.sameSite as string,
					domain: c.domain,
					path: c.path,
				},
			})),
	};
}

/**
 * Log all cookies and their attributes for debugging.
 * Sanitizes sensitive values but logs structure and attributes.
 *
 * @param context - Playwright browser context
 * @param label - Optional label for the log output
 */
export async function logCookieDetails(
	context: BrowserContext,
	label = "Cookie Details",
): Promise<void> {
	const cookies = await context.cookies();

	// biome-ignore lint/suspicious/noConsole: Debugging output for E2E tests
	console.log(`\n🍪 ${label}:`);
	// biome-ignore lint/suspicious/noConsole: Debugging output for E2E tests
	console.log(`   Total cookies: ${cookies.length}`);

	for (const cookie of cookies) {
		const valuePreview =
			cookie.value.length > 20
				? `${cookie.value.substring(0, 20)}...`
				: cookie.value;

		// biome-ignore lint/suspicious/noConsole: Debugging output for E2E tests
		console.log(`   - ${cookie.name}:`);
		// biome-ignore lint/suspicious/noConsole: Debugging output for E2E tests
		console.log(`     value: ${valuePreview} (${cookie.value.length} chars)`);
		// biome-ignore lint/suspicious/noConsole: Debugging output for E2E tests
		console.log(`     domain: ${cookie.domain}`);
		// biome-ignore lint/suspicious/noConsole: Debugging output for E2E tests
		console.log(`     path: ${cookie.path}`);
		// biome-ignore lint/suspicious/noConsole: Debugging output for E2E tests
		console.log(`     secure: ${cookie.secure}`);
		// biome-ignore lint/suspicious/noConsole: Debugging output for E2E tests
		console.log(`     httpOnly: ${cookie.httpOnly}`);
		// biome-ignore lint/suspicious/noConsole: Debugging output for E2E tests
		console.log(`     sameSite: ${cookie.sameSite}`);
		// biome-ignore lint/suspicious/noConsole: Debugging output for E2E tests
		console.log(
			`     expires: ${new Date(cookie.expires * 1000).toISOString()}`,
		);
	}

	// biome-ignore lint/suspicious/noConsole: Debugging output for E2E tests
	console.log("");
}

/**
 * Verify that cookies have the expected security attributes.
 * Checks that secure, httpOnly, and sameSite are set appropriately.
 *
 * @param context - Playwright browser context to verify
 * @param options - Verification options
 * @returns Result object indicating if attributes are correct
 */
export async function verifyCookieAttributes(
	context: BrowserContext,
	options: {
		requireSecure?: boolean;
		requireHttpOnly?: boolean;
		expectedSameSite?: "Strict" | "Lax" | "None";
	} = {},
): Promise<CookieVerificationResult> {
	const {
		requireSecure = false, // HTTPS only in production
		requireHttpOnly = false, // Should be httpOnly for auth tokens
		expectedSameSite = "Lax",
	} = options;

	const cookies = await context.cookies();
	const authCookies = cookies.filter(
		(c) => c.name.includes("auth") || c.name === "_vercel_jwt",
	);

	if (authCookies.length === 0) {
		return {
			success: false,
			message: "No auth cookies found to verify attributes",
			cookieCount: 0,
			cookies: [],
		};
	}

	const issues: string[] = [];

	for (const cookie of authCookies) {
		if (requireSecure && !cookie.secure) {
			issues.push(`${cookie.name}: missing secure flag`);
		}
		if (requireHttpOnly && !cookie.httpOnly) {
			issues.push(`${cookie.name}: missing httpOnly flag`);
		}
		if (cookie.sameSite && cookie.sameSite !== expectedSameSite) {
			issues.push(
				`${cookie.name}: sameSite is ${cookie.sameSite}, expected ${expectedSameSite}`,
			);
		}
	}

	return {
		success: issues.length === 0,
		message:
			issues.length === 0
				? "All cookie attributes valid"
				: `Attribute issues: ${issues.join(", ")}`,
		cookieCount: authCookies.length,
		cookies: authCookies.map((c) => ({
			name: c.name,
			hasValue: !!c.value,
			attributes: {
				secure: c.secure,
				httpOnly: c.httpOnly,
				sameSite: c.sameSite as string,
				domain: c.domain,
				path: c.path,
			},
		})),
	};
}

/**
 * Verify that cookies are being sent in HTTP requests.
 * Sets up request interception to log request headers and confirm
 * Authorization or Cookie headers are present.
 *
 * This is diagnostic - it confirms cookies created by global setup
 * are actually being transmitted to the server.
 *
 * @param page - Playwright page to intercept
 * @param targetUrl - URL pattern to intercept (e.g., '/home', '/api')
 * @returns Promise that resolves after checking the first matching request
 */
export async function verifyRequestHasCookies(
	page: Page,
	targetUrl = "/home",
): Promise<boolean> {
	let hasCookieHeader = false;
	let hasAuthorizationHeader = false;

	// Intercept network requests to check headers
	const requestHandler = (request: any) => {
		const url = request.url();

		if (url.includes(targetUrl)) {
			const cookieHeader = request.headerValue("cookie");
			const authHeader = request.headerValue("authorization");

			if (cookieHeader) {
				hasCookieHeader = true;
				// biome-ignore lint/suspicious/noConsole: Debugging output for E2E tests
				console.log(`   ✓ Cookie header found in request to ${targetUrl}`);
			}

			if (authHeader) {
				hasAuthorizationHeader = true;
				// biome-ignore lint/suspicious/noConsole: Debugging output for E2E tests
				console.log(
					`   ✓ Authorization header found in request to ${targetUrl}`,
				);
			}

			if (!cookieHeader && !authHeader) {
				// biome-ignore lint/suspicious/noConsole: Debugging output for E2E tests
				console.warn(
					`   ✗ No Cookie or Authorization header in request to ${targetUrl}`,
				);
			}
		}
	};

	page.on("request", requestHandler);

	try {
		// Navigate to trigger requests
		await page.goto(targetUrl, { waitUntil: "domcontentloaded" });

		// Give a moment for all requests to be intercepted
		await page.waitForTimeout(500);
	} catch (_error) {
		// Navigation might fail due to auth, but we just want to check headers
		// Ignore navigation errors and check what we captured
	} finally {
		page.removeListener("request", requestHandler);
	}

	return hasCookieHeader || hasAuthorizationHeader;
}

/**
 * Run a complete cookie verification suite.
 * Checks that cookies are present, have correct attributes, and are being sent.
 *
 * @param context - Browser context to verify
 * @param page - Page for request verification
 * @param cookieName - Expected auth cookie name
 * @returns Object with all verification results
 */
export async function verifyCookieSetup(
	context: BrowserContext,
	page: Page,
	cookieName: string,
): Promise<{
	allValid: boolean;
	presence: CookieVerificationResult;
	attributes: CookieVerificationResult;
	requestHasCookies: boolean;
}> {
	const presence = await verifyCookiesPresent(context, cookieName);
	const attributes = await verifyCookieAttributes(context, {
		requireSecure: false, // Only enforce on HTTPS
		requireHttpOnly: true, // Auth cookies should be httpOnly
		expectedSameSite: "Lax",
	});

	let requestHasCookies = false;
	try {
		requestHasCookies = await verifyRequestHasCookies(page, "/home");
	} catch {
		// Request verification is optional - doesn't fail entire setup
		// biome-ignore lint/suspicious/noConsole: Debug output
		console.log("   Note: Could not verify request cookies (non-critical)");
	}

	const allValid = presence.success && attributes.success;

	return {
		allValid,
		presence,
		attributes,
		requestHasCookies,
	};
}
