import "server-only";

import { CircuitBreaker, RateLimiter } from "@kit/mastra";
import { getLogger } from "@kit/shared/logger";

// ---------------------------------------------------------------------------
// Alpha Vantage API – server-only service for financial data
// Uses OVERVIEW endpoint (free tier: 25 req/day, 5/min)
// ---------------------------------------------------------------------------

const BASE_URL = "https://www.alphavantage.co/query";
const TIMEOUT_MS = 10_000;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const DAILY_QUOTA_LIMIT = 25; // Free tier: 25 requests per day

/** Alpha Vantage API function types */
const FUNCTION_OVERVIEW = "OVERVIEW";

function getApiKey(): string | null {
	return process.env.ALPHA_VANTAGE_API_KEY ?? null;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Alpha Vantage OVERVIEW response */
export interface AlphaVantageOverview {
	Symbol: string;
	Name: string;
	Description: string;
	Exchange: string;
	Currency: string;
	Country: string;
	Sector: string;
	Industry: string;
	MarketCapitalization: string;
	EBITDA: string;
	PERatio: string;
	PEGRatio: string;
	BookValue: string;
	DividendPerShare: string;
	DividendYield: string;
	EPS: string;
	RevenueTTM: string;
	GrossProfitTTM: string;
	ProfitMargin: string;
	OperatingMargin: string;
	ReturnOnAssetsTTM: string;
	ReturnOnEquityTTM: string;
	"52WeekHigh": string;
	"52WeekLow": string;
	"50DayMovingAverage": string;
	"200DayMovingAverage": string;
	Beta: string;
	AnalystTargetPrice: string;
	AnalystRatingStrongBuy: string;
	AnalystRatingBuy: string;
	AnalystRatingHold: string;
	AnalystRatingSell: string;
	AnalystRatingStrongSell: string;
	FiscalYearEnd: string;
	LatestQuarterlyReportDate: string;
	LatestQuarterlyEarningsDate: string;
}

/** Result from enriching company with Alpha Vantage data */
export interface AlphaVantageEnrichmentResult {
	configured: boolean;
	data: AlphaVantageData | null;
	success: boolean;
	error?: string;
}

/** Normalized financial data for CompanyResearchInput */
export interface AlphaVantageData {
	// Company overview
	revenue: number | null;
	grossMargin: number | null;
	operatingMargin: number | null;
	profitMargin: number | null;
	stockPrice: number | null;
	week52High: number | null;
	week52Low: number | null;

	// Market data
	marketCap: number | null;
	ebitda: number | null;
	eps: number | null;
	dividendYield: number | null;
	movingAvg50: number | null;
	movingAvg200: number | null;
	fiscalYearEnd: string | null;

	// Analyst ratings
	analystConsensus: string | null;
	analystBuyCount: number | null;
	analystHoldCount: number | null;
	analystSellCount: number | null;

	// Valuation
	peRatio: number | null;
	industryAvgPeRatio: number | null;
	beta: number | null;
}

// ---------------------------------------------------------------------------
// Rate Limiting and Circuit Breaker (using shared @mastra/resilience)
// ---------------------------------------------------------------------------

// Rate limiter: 5 requests per minute for Alpha Vantage free tier
const rateLimiter = new RateLimiter({
	maxRequestsPerMinute: 5,
});

// Circuit breaker to prevent cascading failures
const circuitBreaker = new CircuitBreaker("alpha-vantage", {
	failureThreshold: 3,
	resetTimeMs: 60_000,
});

// Daily quota tracking (in-memory, resets on server restart)
let dailyRequestCount = 0;
let dailyQuotaResetAt = getNextMidnightUTC();

function getNextMidnightUTC(): number {
	const now = new Date();
	const midnight = new Date(now);
	midnight.setUTCHours(24, 0, 0, 0);
	return midnight.getTime();
}

function isWithinDailyQuota(): boolean {
	const now = Date.now();
	if (now >= dailyQuotaResetAt) {
		// Reset for new day
		dailyRequestCount = 0;
		dailyQuotaResetAt = getNextMidnightUTC();
	}
	return dailyRequestCount < DAILY_QUOTA_LIMIT;
}

function incrementDailyQuota(): void {
	dailyRequestCount++;
}

// ---------------------------------------------------------------------------
// 24-hour ticker-keyed caching
// ---------------------------------------------------------------------------

/** Cache entry with TTL */
interface CacheEntry {
	result: AlphaVantageEnrichmentResult;
	expiresAt: number;
}

/** In-memory cache for financial snapshots (24-hour TTL) */
const financialSnapshotCache = new Map<string, CacheEntry>();

/**
 * Get cached result if not expired
 */
function getCachedSnapshot(
	ticker: string,
): AlphaVantageEnrichmentResult | null {
	const entry = financialSnapshotCache.get(ticker.toUpperCase());
	if (!entry) return null;

	if (Date.now() > entry.expiresAt) {
		financialSnapshotCache.delete(ticker.toUpperCase());
		return null;
	}

	return entry.result;
}

/**
 * Cache a financial snapshot result
 */
function cacheSnapshot(
	ticker: string,
	result: AlphaVantageEnrichmentResult,
): void {
	financialSnapshotCache.set(ticker.toUpperCase(), {
		result,
		expiresAt: Date.now() + CACHE_TTL_MS,
	});
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Discriminated result from alphaVantageFetch */
type AlphaVantageFetchResult<T> =
	| { kind: "no-key" }
	| { kind: "rate-limited" }
	| { kind: "success"; data: T }
	| { kind: "error"; message: string };

/** Custom error classes for circuit breaker to catch */
class RateLimitError extends Error {
	constructor(message = "Alpha Vantage rate limit exceeded") {
		super(message);
		this.name = "RateLimitError";
	}
}

class ApiError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "ApiError";
	}
}

async function alphaVantageFetch<T>(
	ticker: string,
	functionType: string,
): Promise<AlphaVantageFetchResult<T>> {
	const apiKey = getApiKey();

	// If no API key, return distinct result (Alpha Vantage is optional)
	if (!apiKey) {
		return { kind: "no-key" };
	}

	// Check daily quota before making request
	if (!isWithinDailyQuota()) {
		throw new RateLimitError("Alpha Vantage daily quota exceeded");
	}

	const url = new URL(BASE_URL);
	url.searchParams.set("function", functionType);
	url.searchParams.set("symbol", ticker);
	url.searchParams.set("apikey", apiKey);

	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

	try {
		// Use circuit breaker to wrap the external API call
		return await circuitBreaker.execute(async () => {
			// Wait for rate limit slot (shared RateLimiter)
			await rateLimiter.acquire(0);

			// Increment daily quota counter
			incrementDailyQuota();

			const res = await fetch(url.toString(), {
				method: "GET",
				headers: {
					Accept: "application/json",
				},
				signal: controller.signal,
				cache: "no-store" as RequestCache,
			});

			// Handle rate limiting (HTTP 429) - throw to trigger circuit breaker
			if (res.status === 429) {
				throw new RateLimitError("Alpha Vantage HTTP 429 rate limit");
			}

			const data = (await res.json()) as Record<string, unknown>;

			// Check for Alpha Vantage error messages - throw to trigger circuit breaker
			if ("Note" in data || "Information" in data) {
				throw new RateLimitError("Alpha Vantage API note: rate limit warning");
			}

			if (!res.ok) {
				throw new ApiError(`Alpha Vantage API error ${res.status}`);
			}

			// Return the full response - empty object means "not found"
			return { kind: "success", data: data as T };
		});
	} catch (err) {
		if (err instanceof DOMException && err.name === "AbortError") {
			return {
				kind: "error",
				message: `Alpha Vantage API request timed out: ${ticker}`,
			};
		}
		// Re-throw circuit breaker errors
		throw err;
	} finally {
		clearTimeout(timer);
	}
}

/**
 * Parse Alpha Vantage OVERVIEW response into normalized format
 */
function parseOverviewResponse(data: AlphaVantageOverview): AlphaVantageData {
	const parseNumber = (val: string | undefined | null): number | null => {
		if (!val) return null;
		const num = parseFloat(val.replace(/,/g, ""));
		return Number.isNaN(num) ? null : num;
	};

	const parseIntValue = (val: string | undefined | null): number | null => {
		if (!val) return null;
		const num = Number.parseInt(val, 10);
		return Number.isNaN(num) ? null : num;
	};

	// Determine analyst consensus
	const strongBuy = parseIntValue(data.AnalystRatingStrongBuy) ?? 0;
	const buy = parseIntValue(data.AnalystRatingBuy) ?? 0;
	const hold = parseIntValue(data.AnalystRatingHold) ?? 0;
	const sell = parseIntValue(data.AnalystRatingSell) ?? 0;
	const strongSell = parseIntValue(data.AnalystRatingStrongSell) ?? 0;

	let analystConsensus: string | null = null;
	const totalRatings = strongBuy + buy + hold + sell + strongSell;
	if (totalRatings > 0) {
		if (strongBuy + buy > hold + sell + strongSell) {
			analystConsensus = "Buy";
		} else if (hold > strongBuy + buy && hold > sell + strongSell) {
			analystConsensus = "Hold";
		} else if (sell + strongSell > strongBuy + buy) {
			analystConsensus = "Sell";
		} else {
			analystConsensus = "Hold";
		}
	}

	return {
		// Company overview
		revenue: parseNumber(data.RevenueTTM),
		grossMargin: (() => {
			const grossProfit = parseNumber(data.GrossProfitTTM);
			const revenue = parseNumber(data.RevenueTTM);
			// Explicit null checks to handle zero values correctly
			if (grossProfit === null || revenue === null || revenue === 0) {
				return null;
			}
			return (grossProfit / revenue) * 100;
		})(),
		operatingMargin: parseNumber(data.OperatingMargin),
		profitMargin: parseNumber(data.ProfitMargin),
		stockPrice: parseNumber(data.AnalystTargetPrice), // Use target price as proxy
		week52High: parseNumber(data["52WeekHigh"]),
		week52Low: parseNumber(data["52WeekLow"]),

		// Market data
		marketCap: parseNumber(data.MarketCapitalization),
		ebitda: parseNumber(data.EBITDA),
		eps: parseNumber(data.EPS),
		dividendYield: parseNumber(data.DividendYield),
		movingAvg50: parseNumber(data["50DayMovingAverage"]),
		movingAvg200: parseNumber(data["200DayMovingAverage"]),
		fiscalYearEnd: data.FiscalYearEnd ?? null,

		// Analyst ratings
		analystConsensus,
		analystBuyCount: strongBuy + buy,
		analystHoldCount: hold,
		analystSellCount: sell + strongSell,

		// Valuation
		peRatio: parseNumber(data.PERatio),
		industryAvgPeRatio: null, // Not provided in OVERVIEW
		beta: parseNumber(data.Beta),
	};
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get financial snapshot for a public company using Alpha Vantage OVERVIEW.
 * Uses 24-hour caching to preserve API quota.
 *
 * @param ticker - Stock ticker symbol (e.g., "MSFT", "AAPL", "BRK.B")
 * @returns AlphaVantageEnrichmentResult with financial data or null if unavailable
 */
export async function getFinancialSnapshot(
	ticker: string,
): Promise<AlphaVantageEnrichmentResult> {
	const logger = await getLogger();

	// Validate ticker format - allow uppercase letters, digits, dots, and hyphens
	// This supports exchange-suffixed symbols like "TSCO.LON", "BRK.B", "AW-UN.TRT"
	if (!ticker || ticker.length > 20 || !/^[A-Z0-9.-]+$/.test(ticker)) {
		return {
			data: null,
			success: false,
			configured: true,
			error: "Invalid ticker format",
		};
	}

	const upperTicker = ticker.toUpperCase();

	// Check cache first
	const cached = getCachedSnapshot(upperTicker);
	if (cached) {
		logger.info({ ticker: upperTicker }, "Returning cached financial snapshot");
		return cached;
	}

	try {
		const result = await alphaVantageFetch<AlphaVantageOverview>(
			upperTicker,
			FUNCTION_OVERVIEW,
		);

		let finalResult: AlphaVantageEnrichmentResult;

		switch (result.kind) {
			case "no-key":
				finalResult = {
					data: null,
					success: true,
					configured: false,
					error: "Alpha Vantage API key not configured",
				};
				break;
			case "rate-limited":
				// Don't cache rate limit errors - transient
				finalResult = {
					data: null,
					success: false,
					configured: true,
					error: "Alpha Vantage API rate limit exceeded",
				};
				break;
			case "error":
				// Don't cache transient errors
				finalResult = {
					data: null,
					success: false,
					configured: true,
					error: result.message,
				};
				break;
			case "success": {
				// Check if response is empty (no data for this ticker)
				if (!result.data || Object.keys(result.data).length === 0) {
					logger.info(
						{ ticker: upperTicker },
						"No Alpha Vantage data found for ticker",
					);
					// Cache "no data" responses too (private company, no longer traded, etc.)
					finalResult = {
						data: null,
						success: true,
						configured: true,
						error: "No data available for ticker",
					};
					cacheSnapshot(upperTicker, finalResult);
					return finalResult;
				}

				const normalizedData = parseOverviewResponse(result.data);
				logger.info(
					{
						ticker: upperTicker,
						revenue: normalizedData.revenue,
						peRatio: normalizedData.peRatio,
					},
					"Alpha Vantage enrichment success",
				);

				finalResult = {
					data: normalizedData,
					success: true,
					configured: true,
				};
				break;
			}
			default:
				finalResult = {
					data: null,
					success: false,
					configured: true,
					error: "Unknown error",
				};
		}

		// Cache successful results with data OR "no data" responses
		// Don't cache "no-key" (configured: false) since it may change if API key is added later
		if (finalResult.success && finalResult.configured) {
			cacheSnapshot(upperTicker, finalResult);
		}

		return finalResult;
	} catch (err) {
		const message =
			err instanceof Error ? err.message : "Unknown Alpha Vantage error";
		logger.error(
			{ ticker: upperTicker, error: err },
			"Alpha Vantage enrichment failed: %s",
			message,
		);
		return {
			data: null,
			success: false,
			configured: true,
			error: message,
		};
	}
}
