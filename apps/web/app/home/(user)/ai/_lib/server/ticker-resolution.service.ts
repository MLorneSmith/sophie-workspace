import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { distance } from "fastest-levenshtein";
import { getLogger } from "@kit/shared/logger";

import { getSecEdgarCompanies } from "./sec-edgar.service";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Result from resolving a company name to ticker/CIK */
export interface TickerResolution {
	ticker: string;
	cik: string;
	confidence: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CONFIDENCE_THRESHOLD = 0.7;
const MAX_MATCHES_TO_CONSIDER = 10;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Normalize company name for matching:
 * - Convert to lowercase
 * - Remove common suffixes (Inc, Corp, LLC, Ltd, Co, etc.)
 * - Trim whitespace
 */
function normalizeCompanyName(name: string): string {
	return name
		.toLowerCase()
		.replace(/\b(inc\.?|incorporated|corp\.?|corporation|llc|ltd\.?|co\.?|company|plc|holdings?|group|technologies?|systems?|solutions?|international)\b/gi, "")
		.replace(/[^a-z0-9\s]/g, "")
		.replace(/\s+/g, " ")
		.trim();
}

/**
 * Calculate Levenshtein similarity as a score between 0 and 1
 */
function calculateSimilarity(str1: string, str2: string): number {
	const maxLen = Math.max(str1.length, str2.length);
	if (maxLen === 0) return 1;
	const dist = distance(str1, str2);
	return 1 - dist / maxLen;
}

/**
 * Find best matching company in SEC EDGAR list using fuzzy matching
 */
function findBestMatch(
	normalizedName: string,
	companies: Array<{ ticker: string; cik_str: string; title: string }>,
): TickerResolution | null {
	// First try exact match on normalized name
	for (const company of companies) {
		const normalizedTitle = normalizeCompanyName(company.title);
		if (normalizedTitle === normalizedName) {
			return {
				ticker: company.ticker,
				cik: company.cik_str,
				confidence: 1.0,
			};
		}
	}

	// Try fuzzy match - find top candidates by similarity
	const candidates = companies
		.map((company) => ({
			...company,
			normalizedTitle: normalizeCompanyName(company.title),
		}))
		.map((company) => ({
			...company,
			similarity: calculateSimilarity(normalizedName, company.normalizedTitle),
		}))
		.filter((c) => c.similarity > 0.3) // Only consider reasonably similar matches
		.sort((a, b) => b.similarity - a.similarity)
		.slice(0, MAX_MATCHES_TO_CONSIDER);

	if (candidates.length === 0) {
		return null;
	}

	const best = candidates[0];
	if (best && best.similarity >= CONFIDENCE_THRESHOLD) {
		return {
			ticker: best.ticker,
			cik: best.cik_str,
			confidence: best.similarity,
		};
	}

	return null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Resolve a company name to its stock ticker and CIK number.
 *
 * Resolution flow:
 * 1. Normalize the company name
 * 2. Check database cache (ticker_mappings table) for non-expired mapping
 * 3. If cache miss, fetch SEC EDGAR data and fuzzy match
 * 4. If match found with confidence > 0.7, cache to database
 * 5. Return null if no match (indicates private company)
 *
 * @param client - Supabase client
 * @param companyName - Company name to resolve
 * @param userId - User ID for caching (user-spedific mappings)
 * @returns TickerResolution or null if not found
 */
export async function resolveCompanyTicker(
	client: SupabaseClient,
	companyName: string,
	userId: string,
): Promise<TickerResolution | null> {
	const logger = await getLogger();
	const normalizedName = normalizeCompanyName(companyName);

	logger.info({ companyName, normalizedName }, "Resolving company ticker");

	// Use untyped client since ticker_mappings is not in generated types yet
	// biome-ignore lint/suspicious/noExplicitAny: ticker_mappings not in generated types
	const untypedClient = client as any;

	// Step 1: Check database cache for non-expired mapping
	const { data: cachedMapping } = await untypedClient
		.from("ticker_mappings")
		.select("ticker, cik, confidence_score, expires_at")
		.ilike("company_name", normalizedName)
		.eq("user_id", userId)
		.gt("expires_at", new Date().toISOString())
		.limit(1)
		.maybeSingle();

	if (cachedMapping) {
		logger.info(
			{ companyName, ticker: cachedMapping.ticker },
			"Using cached ticker mapping",
		);
		return {
			ticker: cachedMapping.ticker,
			cik: cachedMapping.cik,
			confidence: cachedMapping.confidence_score,
		};
	}

	// Step 2: Fetch SEC EDGAR data and try to match
	const { companies } = await getSecEdgarCompanies();

	if (companies.length === 0) {
		logger.warn({ companyName }, "No SEC EDGAR data available");
		return null;
	}

	const match = findBestMatch(normalizedName, companies);

	if (!match) {
		logger.info({ companyName }, "No ticker match found (likely private company)");
		return null;
	}

	// Step 3: Cache the result to database
	try {
		await untypedClient.from("ticker_mappings").insert({
			company_name: normalizedName,
			ticker: match.ticker,
			cik: match.cik,
			confidence_score: match.confidence,
			user_id: userId,
		});

		logger.info(
			{ companyName, ticker: match.ticker, confidence: match.confidence },
			"Cached ticker mapping",
		);
	} catch (cacheErr) {
		// Non-blocking - log warning but don't fail
		logger.warn({ error: cacheErr }, "Failed to cache ticker mapping");
	}

	return match;
}

/**
 * Check if a company name might be a public company (has potential ticker match)
 * Uses only SEC EDGAR data without database caching.
 * Useful for quick checks before attempting full resolution.
 *
 * @param companyName - Company name to check
 * @returns true if company might be public (has SEC EDGAR entry)
 */
export async function mightBePublicCompany(companyName: string): Promise<boolean> {
	const normalizedName = normalizeCompanyName(companyName);
	const { companies } = await getSecEdgarCompanies();

	// Check for any reasonably similar matches
	for (const company of companies) {
		const normalizedTitle = normalizeCompanyName(company.title);
		const similarity = calculateSimilarity(normalizedName, normalizedTitle);
		if (similarity >= 0.6) {
			return true;
		}
	}

	return false;
}
