/**
 * URL normalization utilities for Supabase URL handling.
 *
 * These utilities ensure consistent URL comparison across the stack,
 * preventing JWT validation failures due to URL format mismatches.
 *
 * Common issues this addresses:
 * - Trailing slashes: "https://example.supabase.co/" vs "https://example.supabase.co"
 * - Protocol variations: "http" vs "https"
 * - Port handling: "http://localhost:54521" vs "http://localhost:54521/"
 *
 * @see Issue #1518 - Dev Integration Tests Fail - Cookies Not Recognized
 */

/**
 * Normalize a Supabase URL by removing trailing slashes and ensuring consistent format.
 *
 * @param url - The URL to normalize (can be with or without trailing slash)
 * @returns Normalized URL without trailing slash, or empty string if invalid
 *
 * @example
 * normalizeUrl("https://example.supabase.co/") // "https://example.supabase.co"
 * normalizeUrl("https://example.supabase.co")  // "https://example.supabase.co"
 * normalizeUrl("http://127.0.0.1:54521/")      // "http://127.0.0.1:54521"
 */
export function normalizeUrl(url: string | undefined | null): string {
	if (!url) return "";

	try {
		// Use URL constructor to ensure valid URL and get consistent format
		const parsed = new URL(url);

		// Reconstruct URL without pathname (which could be just "/")
		// Keep protocol, hostname, and port
		let normalized = `${parsed.protocol}//${parsed.hostname}`;

		// Include port if not default for the protocol
		if (parsed.port) {
			normalized += `:${parsed.port}`;
		}

		return normalized;
	} catch {
		// If URL parsing fails, try basic string manipulation as fallback
		return url.replace(/\/+$/, "");
	}
}

/**
 * Compare two URLs for equality after normalization.
 *
 * @param url1 - First URL to compare
 * @param url2 - Second URL to compare
 * @returns true if URLs are equal after normalization
 *
 * @example
 * urlsMatch("https://example.supabase.co/", "https://example.supabase.co") // true
 * urlsMatch("http://127.0.0.1:54521", "http://127.0.0.1:54521/")          // true
 * urlsMatch("http://127.0.0.1:54521", "http://localhost:54521")           // false
 */
export function urlsMatch(
	url1: string | undefined | null,
	url2: string | undefined | null,
): boolean {
	const normalized1 = normalizeUrl(url1);
	const normalized2 = normalizeUrl(url2);

	// Both empty or both the same normalized value
	return normalized1 === normalized2;
}

/**
 * Extract the project reference (hostname prefix) from a Supabase URL.
 * This is used to derive cookie names: sb-{projectRef}-auth-token
 *
 * @param url - Supabase URL
 * @returns Project reference string, or null if invalid
 *
 * @example
 * getProjectRefFromUrl("http://127.0.0.1:54521")           // "127"
 * getProjectRefFromUrl("http://host.docker.internal:54521") // "host"
 * getProjectRefFromUrl("https://abc123.supabase.co")       // "abc123"
 */
export function getProjectRefFromUrl(
	url: string | undefined | null,
): string | null {
	if (!url) return null;

	try {
		const hostname = new URL(url).hostname;
		return hostname.split(".")[0] || null;
	} catch {
		return null;
	}
}

/**
 * Get the expected auth cookie name from a Supabase URL.
 * Cookie names follow the format: sb-{projectRef}-auth-token
 *
 * @param url - Supabase URL
 * @returns Cookie name string
 *
 * @example
 * getCookieNameFromUrl("http://127.0.0.1:54521")           // "sb-127-auth-token"
 * getCookieNameFromUrl("http://host.docker.internal:54521") // "sb-host-auth-token"
 * getCookieNameFromUrl("https://abc123.supabase.co")       // "sb-abc123-auth-token"
 */
export function getCookieNameFromUrl(url: string | undefined | null): string {
	const projectRef = getProjectRefFromUrl(url);
	return `sb-${projectRef || "unknown"}-auth-token`;
}

/**
 * Validate that two Supabase URLs will produce matching JWT issuers and cookie names.
 * Returns detailed information about any mismatches found.
 *
 * @param e2eUrl - The Supabase URL used by E2E test setup
 * @param appUrl - The Supabase URL used by the deployed application
 * @returns Validation result with details about any mismatches
 */
export function validateSupabaseUrls(
	e2eUrl: string | undefined | null,
	appUrl: string | undefined | null,
): {
	isValid: boolean;
	e2eNormalized: string;
	appNormalized: string;
	e2eProjectRef: string | null;
	appProjectRef: string | null;
	e2eCookieName: string;
	appCookieName: string;
	mismatchReason: string | null;
} {
	const e2eNormalized = normalizeUrl(e2eUrl);
	const appNormalized = normalizeUrl(appUrl);
	const e2eProjectRef = getProjectRefFromUrl(e2eUrl);
	const appProjectRef = getProjectRefFromUrl(appUrl);
	const e2eCookieName = getCookieNameFromUrl(e2eUrl);
	const appCookieName = getCookieNameFromUrl(appUrl);

	let mismatchReason: string | null = null;

	if (!e2eUrl) {
		mismatchReason = "E2E Supabase URL is not configured";
	} else if (!appUrl) {
		mismatchReason =
			"App Supabase URL (NEXT_PUBLIC_SUPABASE_URL) is not configured";
	} else if (e2eProjectRef !== appProjectRef) {
		mismatchReason = `Project ref mismatch: E2E uses '${e2eProjectRef}' but app uses '${appProjectRef}'. This will cause cookie name mismatch.`;
	} else if (!urlsMatch(e2eUrl, appUrl)) {
		mismatchReason = `URL mismatch: E2E uses '${e2eNormalized}' but app uses '${appNormalized}'. This may cause JWT issuer validation failure.`;
	}

	return {
		isValid: mismatchReason === null,
		e2eNormalized,
		appNormalized,
		e2eProjectRef,
		appProjectRef,
		e2eCookieName,
		appCookieName,
		mismatchReason,
	};
}
