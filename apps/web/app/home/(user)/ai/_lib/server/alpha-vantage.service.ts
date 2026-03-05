import "server-only";

import { getLogger } from "@kit/shared/logger";

// ---------------------------------------------------------------------------
// Alpha Vantage API – server-only service for financial data
// Uses OVERVIEW endpoint (free tier: 25 req/day, 5/min)
// ---------------------------------------------------------------------------

const BASE_URL = "https://www.alphavantage.co/query";
const TIMEOUT_MS = 10_000;

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
	stockPrice: number | null;
	week52High: number | null;
	week52Low: number | null;

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
// Rate Limiting (simple in-memory)
// ---------------------------------------------------------------------------

/** Simple rate limiter: 5 requests per minute for Alpha Vantage free tier */
class RateLimiter {
	private requestTimestamps: number[] = [];
	private readonly maxRequests: number;
	private readonly windowMs: number;

	constructor(maxRequests: number = 5, windowMs: number = 60_000) {
		this.maxRequests = maxRequests;
		this.windowMs = windowMs;
	}

	/** Check if we can make a request without waiting */
	canProceed(): boolean {
		this.pruneOldRequests();
		return this.requestTimestamps.length < this.maxRequests;
	}

	/** Wait until we can proceed (or throw if too long) */
	async waitForSlot(maxWaitMs: number = 60_000): Promise<void> {
		const startTime = Date.now();

		while (true) {
			this.pruneOldRequests();

			if (this.requestTimestamps.length < this.maxRequests) {
				this.requestTimestamps.push(Date.now());
				return;
			}

			// Calculate wait time
			const oldestRequest = this.requestTimestamps[0];
			if (!oldestRequest) {
				// Should not happen but safety check
				await new Promise((resolve) => setTimeout(resolve, 1000));
				continue;
			}
			const waitTime = oldestRequest + this.windowMs - Date.now();

			if (waitTime > maxWaitMs) {
				throw new Error(
					`Rate limit: would need to wait ${waitTime}ms, exceeding max ${maxWaitMs}ms`,
				);
			}

			if (Date.now() - startTime >= maxWaitMs) {
				throw new Error(`Rate limit: waited ${maxWaitMs}ms but still at limit`);
			}

			// Wait briefly and retry
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}
	}

	private pruneOldRequests(): void {
		const now = Date.now();
		this.requestTimestamps = this.requestTimestamps.filter(
			(ts) => now - ts < this.windowMs,
		);
	}
}

// Module-level rate limiter instance
const rateLimiter = new RateLimiter(5, 60_000);

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Discriminated result from alphaVantageFetch */
type AlphaVantageFetchResult<T> =
	| { kind: "no-key" }
	| { kind: "rate-limited" }
	| { kind: "success"; data: T }
	| { kind: "error"; message: string };

async function alphaVantageFetch<T>(
	ticker: string,
	functionType: string,
): Promise<AlphaVantageFetchResult<T>> {
	const apiKey = getApiKey();

	// If no API key, return distinct result (Alpha Vantage is optional)
	if (!apiKey) {
		return { kind: "no-key" };
	}

	// Check rate limit before proceeding
	if (!rateLimiter.canProceed()) {
		return { kind: "rate-limited" };
	}

	const url = new URL(BASE_URL);
	url.searchParams.set("function", functionType);
	url.searchParams.set("symbol", ticker);
	url.searchParams.set("apikey", apiKey);

	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

	try {
		// Wait for rate limit slot
		await rateLimiter.waitForSlot(60_000);

		const res = await fetch(url.toString(), {
			method: "GET",
			headers: {
				Accept: "application/json",
			},
			signal: controller.signal,
			cache: "no-store" as RequestCache,
		});

		// Handle rate limiting (HTTP 429)
		if (res.status === 429) {
			return { kind: "rate-limited" };
		}

		const data = (await res.json()) as Record<string, unknown>;

		// Check for Alpha Vantage error messages
		if ("Note" in data || "Information" in data) {
			return { kind: "rate-limited" };
		}

		if (!res.ok) {
			const msg = `Alpha Vantage API error ${res.status}`;
			return { kind: "error", message: msg };
		}

		// Return the full response - empty object means "not found"
		return { kind: "success", data: data as T };
	} catch (err) {
		if (err instanceof DOMException && err.name === "AbortError") {
			return {
				kind: "error",
				message: `Alpha Vantage API request timed out: ${ticker}`,
			};
		}
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
			return grossProfit && revenue ? (grossProfit / revenue) * 100 : null;
		})(),
		operatingMargin: parseNumber(data.OperatingMargin),
		stockPrice: parseNumber(data.AnalystTargetPrice), // Use target price as proxy
		week52High: parseNumber(data["52WeekHigh"]),
		week52Low: parseNumber(data["52WeekLow"]),

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
 *
 * @param ticker - Stock ticker symbol (e.g., "MSFT", "AAPL")
 * @returns AlphaVantageEnrichmentResult with financial data or null if unavailable
 */
export async function getFinancialSnapshot(
	ticker: string,
): Promise<AlphaVantageEnrichmentResult> {
	const logger = await getLogger();

	// Validate ticker format
	if (!ticker || ticker.length > 5 || !/^[A-Z]+$/.test(ticker)) {
		return {
			data: null,
			success: false,
			configured: true,
			error: "Invalid ticker format",
		};
	}

	try {
		const result = await alphaVantageFetch<AlphaVantageOverview>(
			ticker,
			FUNCTION_OVERVIEW,
		);

		switch (result.kind) {
			case "no-key":
				return {
					data: null,
					success: true,
					configured: false,
					error: "Alpha Vantage API key not configured",
				};
			case "rate-limited":
				return {
					data: null,
					success: false,
					configured: true,
					error: "Alpha Vantage API rate limit exceeded",
				};
			case "error":
				return {
					data: null,
					success: false,
					configured: true,
					error: result.message,
				};
			case "success": {
				// Check if response is empty (no data for this ticker)
				if (!result.data || Object.keys(result.data).length === 0) {
					logger.info({ ticker }, "No Alpha Vantage data found for ticker");
					return {
						data: null,
						success: true,
						configured: true,
						error: "No data available for ticker",
					};
				}

				const normalizedData = parseOverviewResponse(result.data);
				logger.info(
					{
						ticker,
						revenue: normalizedData.revenue,
						peRatio: normalizedData.peRatio,
					},
					"Alpha Vantage enrichment success",
				);

				return {
					data: normalizedData,
					success: true,
					configured: true,
				};
			}
		}
	} catch (err) {
		const message =
			err instanceof Error ? err.message : "Unknown Alpha Vantage error";
		logger.error(
			{ ticker, error: err },
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
