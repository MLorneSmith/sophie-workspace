import "server-only";

import { getLogger } from "@kit/shared/logger";

// ---------------------------------------------------------------------------
// SEC EDGAR Company Tickers – server-only service
// Fetches and caches SEC EDGAR's company_tickers.json with 7-day TTL
// ---------------------------------------------------------------------------

const SEC_EDGAR_URL = "https://www.sec.gov/files/company_tickers.json";
const TIMEOUT_MS = 15_000;
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const SHORT_RETRY_MS = 60 * 60 * 1000; // 1 hour retry on transient failure

/** SEC EDGAR company ticker entry */
export interface SecEdgarCompany {
	cik_str: string;
	ticker: string;
	title: string;
}

/** Parsed SEC EDGAR company_tickers.json response */
export interface SecEdgarCompaniesResponse {
	companies: SecEdgarCompany[];
	lastUpdated: Date;
}

/** Module-level cache */
let cachedData: SecEdgarCompaniesResponse | null = null;
let cacheTimestamp: number = 0;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Check if cache is still valid (7-day TTL)
 */
function isCacheValid(): boolean {
	if (!cachedData || !cacheTimestamp) return false;
	return Date.now() - cacheTimestamp < CACHE_TTL_MS;
}

/**
 * Fetch SEC EDGAR company_tickers.json
 * Returns parsed companies array or empty array on failure
 */
async function fetchSecEdgarCompanies(): Promise<SecEdgarCompany[]> {
	const logger = await getLogger();

	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

	try {
		const res = await fetch(SEC_EDGAR_URL, {
			headers: {
				"User-Agent": "SlideHeroes (research@slideheroes.com)",
				Accept: "application/json",
			},
			signal: controller.signal,
			cache: "no-store",
		});

		if (!res.ok) {
			logger.warn(
				{ status: res.status, statusText: res.statusText },
				"SEC EDGAR fetch failed",
			);
			return [];
		}

		const data = (await res.json()) as Record<
			string,
			{ cik_str: number; ticker: string; title: string }
		>;

		// Parse the response into our format
		// SEC EDGAR returns { "0": { cik_str: 1, ticker: "A", title: "Agilent" }, ... }
		const companies: SecEdgarCompany[] = Object.values(data).map((entry) => ({
			cik_str: String(entry.cik_str).padStart(10, "0"), // Pad CIK to 10 digits
			ticker: entry.ticker,
			title: entry.title,
		}));

		logger.info(
			{ count: companies.length },
			"Fetched SEC EDGAR company tickers",
		);
		return companies;
	} catch (err) {
		if (err instanceof DOMException && err.name === "AbortError") {
			logger.warn("SEC EDGAR fetch timed out");
		} else {
			logger.error({ error: err }, "SEC EDGAR fetch failed");
		}
		return [];
	} finally {
		clearTimeout(timer);
	}
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get SEC EDGAR company list with process-level caching.
 * Returns cached data if still valid, otherwise fetches fresh data.
 * On transient failure, keeps existing cache and sets shorter retry window.
 *
 * @returns Promise<SecEdgarCompaniesResponse> with companies array and lastUpdated timestamp
 */
export async function getSecEdgarCompanies(): Promise<SecEdgarCompaniesResponse> {
	// Return cached data if valid (including short retry window)
	if (isCacheValid() && cachedData && cachedData.companies.length > 0) {
		return cachedData;
	}

	// Fetch fresh data
	const companies = await fetchSecEdgarCompanies();

	// Only update cache if we got valid data
	if (companies && companies.length > 0) {
		cachedData = {
			companies,
			lastUpdated: new Date(),
		};
		cacheTimestamp = Date.now();
	} else if (cachedData && cachedData.companies.length > 0) {
		// Keep existing cache but set shorter retry window
		cacheTimestamp = Date.now() - CACHE_TTL_MS + SHORT_RETRY_MS;
	}

	return cachedData ?? { companies: [], lastUpdated: new Date() };
}

/**
 * Clear the cache (useful for testing or manual refresh)
 */
export function clearSecEdgarCache(): void {
	cachedData = null;
	cacheTimestamp = 0;
}
