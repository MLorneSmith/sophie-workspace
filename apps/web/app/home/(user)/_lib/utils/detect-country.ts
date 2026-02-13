const TIMEZONE_COUNTRY_MAP: Record<string, string> = {
	// United States
	"America/New_York": "US",
	"America/Chicago": "US",
	"America/Denver": "US",
	"America/Los_Angeles": "US",
	"America/Anchorage": "US",
	"Pacific/Honolulu": "US",
	// United Kingdom
	"Europe/London": "GB",
	// Ireland
	"Europe/Dublin": "IE",
	// Canada
	"America/Toronto": "CA",
	"America/Vancouver": "CA",
	"America/Edmonton": "CA",
	"America/Halifax": "CA",
	"America/Winnipeg": "CA",
	// Australia
	"Australia/Sydney": "AU",
	"Australia/Melbourne": "AU",
	"Australia/Brisbane": "AU",
	"Australia/Perth": "AU",
	"Australia/Adelaide": "AU",
	"Australia/Hobart": "AU",
};

/**
 * Detect user's country code using browser APIs.
 *
 * Strategy:
 * 1. Parse navigator.languages for a locale with a region subtag
 * 2. Fall back to timezone-to-country mapping
 * 3. Default to "US"
 */
export function detectUserCountry(): string {
	// Strategy 1: locale region subtag
	const locales =
		typeof navigator !== "undefined"
			? (navigator.languages ?? [navigator.language])
			: [];

	for (const locale of locales) {
		try {
			const region = new Intl.Locale(locale.trim()).region;
			if (region) return region.toUpperCase();
		} catch {}
	}

	// Strategy 2: timezone mapping
	try {
		const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
		const mapped = TIMEZONE_COUNTRY_MAP[tz];
		if (mapped) return mapped;
	} catch {
		// Intl not available
	}

	return "US";
}

/** Returns today's date as "MM-DD" using client-side Date. */
export function getLocalDateKey(): string {
	const now = new Date();
	const month = String(now.getMonth() + 1).padStart(2, "0");
	const day = String(now.getDate()).padStart(2, "0");
	return `${month}-${day}`;
}
