import "server-only";

import { getLogger } from "@kit/shared/logger";
import { z } from "zod";

// ---------------------------------------------------------------------------
// SEC EDGAR API – server-only service for company SEC filing enrichment
// https://www.sec.gov/cgi-bin/browse-edgar
// ---------------------------------------------------------------------------

const SEC_BASE_URL = "https://data.sec.gov";
const SEC_WWW_BASE_URL = "https://www.sec.gov";
const TIMEOUT_MS = 10_000;

/**
 * Get SEC API contact email from environment.
 * Required by SEC API guidelines for User-Agent header.
 */
function getUserAgent(): string {
	// Use configured contact email or fall back to generic app identifier
	return (
		process.env.SEC_EDGAR_CONTACT_EMAIL ??
		"SlideHeroes Research <research@slideheroes.ai>"
	);
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Single extracted section from a filing */
export interface FilingSection {
	type: string;
	content: string;
	truncated: boolean;
}

/** Time-series financial data point */
export interface FinancialDataPoint {
	period: string;
	value: number;
}

/** XBRL financial facts extracted from filings */
export interface XbrlFinancialFacts {
	revenue: FinancialDataPoint[];
	netIncome: FinancialDataPoint[];
	totalAssets: FinancialDataPoint[];
	totalDebt: FinancialDataPoint[];
}

/** Material event (8-K) summary */
export interface MaterialEvent {
	date: string;
	formType: string;
	summary: string;
}

/** SEC EDGAR submissions response from SEC API */
export interface SubmissionsResponse {
	cik: number;
	name: string;
	filings: {
		recent: {
			form: string[];
			accessionNumber: string[];
			filingDate: string[];
			primaryDocument: string[];
		};
	};
}

/** SEC EDGAR company facts response */
export interface CompanyFactsResponse {
	entityName: string;
	ciks: string[];
	facts: {
		"us-gaap": {
			RevenueFromContractWithCustomerExcludingAssessedTax?: {
				units: {
					USD: { val: number; end: string; start?: string; form: string }[];
				};
			};
			NetIncomeLoss?: {
				units: {
					USD: { val: number; end: string; start?: string; form: string }[];
				};
			};
			Assets?: {
				units: {
					USD: { val: number; end: string; start?: string; form: string }[];
				};
			};
			Liabilities?: {
				units: {
					USD: { val: number; end: string; start?: string; form: string }[];
				};
			};
		};
	};
}

/** Combined SEC EDGAR enrichment result */
export interface SecEdgarResult {
	/** Whether SEC EDGAR is configured (always true - SEC is public data) */
	configured: boolean;
	/** Whether the enrichment was successful */
	success: boolean;
	/** CIK if resolved */
	cik: string | null;
	/** Company name from SEC */
	companyName: string | null;
	/** Most recent 10-K filing */
	latest10K: {
		date: string;
		accessionNumber: string;
		document: string;
		businessSection: string | null;
		riskFactorsSection: string | null;
		mdaSection: string | null;
	} | null;
	/** Most recent 10-Q filing */
	latest10Q: {
		date: string;
		accessionNumber: string;
		document: string;
	} | null;
	/** Recent 8-K material events */
	materialEvents: MaterialEvent[];
	/** Financial facts from XBRL */
	financialFacts: XbrlFinancialFacts | null;
	/** Error message if failed */
	error?: string;
}

// ---------------------------------------------------------------------------
// Internal fetch helper
// ---------------------------------------------------------------------------

/** Discriminated result from secFetch */
type SecFetchResult<T> =
	| { kind: "success"; data: T }
	| { kind: "error"; message: string }
	| { kind: "not-found" }
	| { kind: "rate-limited" };

// ---------------------------------------------------------------------------
// Rate Limiting (10 req/sec sliding window)
// ---------------------------------------------------------------------------

const RATE_LIMIT_REQUESTS = 10;
const RATE_LIMIT_WINDOW_MS = 1000;

let rateLimitWindowStart = Date.now();
let rateLimitRequestCount = 0;

/**
 * Wait if rate limit would be exceeded.
 */
async function enforceRateLimit(): Promise<void> {
	const now = Date.now();

	// Reset window if expired
	if (now - rateLimitWindowStart >= RATE_LIMIT_WINDOW_MS) {
		rateLimitWindowStart = now;
		rateLimitRequestCount = 0;
	}

	// Wait if at limit
	if (rateLimitRequestCount >= RATE_LIMIT_REQUESTS) {
		const waitTime = RATE_LIMIT_WINDOW_MS - (now - rateLimitWindowStart);
		if (waitTime > 0) {
			await new Promise((resolve) => setTimeout(resolve, waitTime));
		}
		rateLimitWindowStart = Date.now();
		rateLimitRequestCount = 0;
	}

	rateLimitRequestCount++;
}

// ---------------------------------------------------------------------------
// Fetch Helper
// ---------------------------------------------------------------------------

/**
 * Internal fetch helper for SEC EDGAR API.
 * Follows SEC API guidelines with proper headers and rate limiting.
 */
async function secFetch<T>(
	path: string,
	options: {
		method?: "GET" | "POST";
		body?: Record<string, unknown>;
		responseType?: "json" | "text";
	} = {},
): Promise<SecFetchResult<T>> {
	// Use appropriate base URL based on path
	const isJsonApi = path.startsWith("/api/") || path.startsWith("/files/");
	const baseUrl = isJsonApi ? SEC_BASE_URL : SEC_WWW_BASE_URL;
	const url = new URL(path, baseUrl);

	// Enforce rate limit
	await enforceRateLimit();

	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

	const responseType = options.responseType ?? "json";

	try {
		const res = await fetch(url.toString(), {
			method: options.method ?? "GET",
			headers: {
				"User-Agent": getUserAgent(),
				Accept: responseType === "text" ? "text/html,*/*" : "application/json",
				"Content-Type": "application/json",
			},
			body: options.body ? JSON.stringify(options.body) : undefined,
			signal: controller.signal,
			cache: "no-store" as RequestCache,
		});

		// Handle rate limiting (HTTP 429)
		if (res.status === 429) {
			return { kind: "rate-limited" };
		}

		// Handle not found (HTTP 404)
		if (res.status === 404) {
			return { kind: "not-found" };
		}

		if (!res.ok) {
			return {
				kind: "error",
				message: `SEC API error ${res.status}: ${res.statusText}`,
			};
		}

		const data =
			responseType === "text"
				? ((await res.text()) as T)
				: ((await res.json()) as T);
		return { kind: "success", data };
	} catch (err) {
		if (err instanceof DOMException && err.name === "AbortError") {
			return {
				kind: "error",
				message: `SEC API request timed out: ${path}`,
			};
		}
		throw err;
	} finally {
		clearTimeout(timer);
	}
}

// ---------------------------------------------------------------------------
// CIK Resolution
// ---------------------------------------------------------------------------

/** In-memory cache for company tickers */
let companyTickerCache: Map<string, string> | null = null;
let tickerCacheLoaded = false;

/**
 * Load SEC's company_tickers.json mapping file.
 * This is cached in memory as it changes infrequently.
 */
async function loadCompanyTickers(): Promise<Map<string, string>> {
	if (tickerCacheLoaded && companyTickerCache) {
		return companyTickerCache;
	}

	const logger = await getLogger();
	const ctx = { name: "loadCompanyTickers" };

	const result = await secFetch<
		Record<string, { ticker: string; title: string; cik: number }>
	>("/files/company_tickers.json");

	if (result.kind !== "success") {
		const errorMsg = result.kind === "error" ? result.message : result.kind;
		logger.warn(ctx, "Failed to load company tickers: %s", errorMsg);
		const emptyCache = new Map<string, string>();
		tickerCacheLoaded = true;
		return emptyCache;
	}

	// Build lookup maps
	const tickerToCik = new Map<string, string>();
	const titleToCik = new Map<string, string>();

	for (const [key, value] of Object.entries(result.data)) {
		if (key === "count") continue; // Skip metadata

		const cikStr = String(value.cik).padStart(10, "0");
		const ticker = value.ticker?.toLowerCase();
		const title = value.title?.toLowerCase();

		if (ticker) {
			tickerToCik.set(ticker, cikStr);
		}
		if (title) {
			// Store first match for each title (may have duplicates)
			if (!titleToCik.has(title)) {
				titleToCik.set(title, cikStr);
			}
		}
	}

	// Combined map with ticker priority (ticker overwrites title)
	companyTickerCache = new Map([...titleToCik, ...tickerToCik]);
	tickerCacheLoaded = true;

	logger.info(ctx, "Loaded %d company tickers", companyTickerCache.size);
	return companyTickerCache;
}

/**
 * Normalize company name for matching.
 * Strips common suffixes and normalizes whitespace.
 */
function normalizeCompanyName(name: string): string {
	return name
		.toLowerCase()
		.replace(
			/\s+(inc\.?|corporation|corp\.?|llc|ltd\.?|co\.?|limited)\.?\s*$/i,
			"",
		)
		.replace(/[^\w\s]/g, "")
		.replace(/\s+/g, " ")
		.trim();
}

/**
 * Resolve CIK from company name or domain.
 * Uses SEC's published ticker mapping with fuzzy matching.
 *
 * @param companyName - Company name or ticker symbol
 * @param domain - Optional company domain for inference
 * @returns 10-digit zero-padded CIK string or null if not found
 */
export async function resolveCik(
	companyName: string,
	domain?: string,
): Promise<string | null> {
	const logger = await getLogger();
	const ctx = { name: "resolveCik", companyName, domain };

	const tickers = await loadCompanyTickers();

	// Try exact ticker match first (if companyName looks like a ticker)
	const _normalizedName = normalizeCompanyName(companyName);
	const nameLower = companyName.toLowerCase();

	// Direct ticker match
	const cikFromTicker = tickers.get(nameLower);
	if (cikFromTicker) {
		logger.info(
			ctx,
			"Resolved via ticker: %s -> CIK %s",
			companyName,
			cikFromTicker,
		);
		return cikFromTicker;
	}

	// Try title/company name match (normalized)
	const normalizedForMatch = normalizeCompanyName(companyName);
	for (const [key, cik] of tickers) {
		// Skip ticker-only entries for title matching
		if (key.length <= 5 && !key.includes(" ")) continue;

		if (key.includes(normalizedForMatch) || normalizedForMatch.includes(key)) {
			logger.info(ctx, "Resolved via title: %s -> CIK %s", companyName, cik);
			return cik;
		}
	}

	// Try domain-based inference if provided
	if (domain) {
		// Extract company name from domain (e.g., "stripe.com" -> "stripe")
		const domainName = domain
			.replace(/^https?:\/\//, "")
			.replace(/^www\./, "")
			.replace(/\..*$/, "")
			.toLowerCase();

		// Search for domain name in titles
		for (const [key, cik] of tickers) {
			if (key.includes(domainName) || domainName.includes(key)) {
				logger.info(ctx, "Resolved via domain: %s -> CIK %s", companyName, cik);
				return cik;
			}
		}
	}

	logger.warn(ctx, "Could not resolve CIK for: %s", companyName);
	return null;
}

// ---------------------------------------------------------------------------
// Submissions API
// ---------------------------------------------------------------------------

/**
 * Pad CIK to 10 digits with leading zeros.
 */
function padCik(cik: string | number): string {
	return String(cik).padStart(10, "0");
}

/**
 * Fetch company submissions from SEC EDGAR.
 *
 * @param cik - 10-digit CIK (with leading zeros)
 * @returns Submissions response or null on failure
 */
export async function fetchSubmissions(
	cik: string,
): Promise<SubmissionsResponse | null> {
	const paddedCik = padCik(cik);
	const result = await secFetch<SubmissionsResponse>(
		`/submissions/CIK${paddedCik}.json`,
	);

	if (result.kind === "success") {
		return result.data;
	}

	return null;
}

/**
 * Find the most recent 10-K filing.
 * Returns null if no 10-K found or if it's older than 6 months.
 */
export function findLatest10K(
	submissions: SubmissionsResponse,
): { date: string; accessionNumber: string; document: string } | null {
	const filings = submissions.filings?.recent;
	if (!filings) return null;

	const formTypes = filings.form;
	const dates = filings.filingDate;
	const accessions = filings.accessionNumber;
	const documents = filings.primaryDocument;

	const sixMonthsAgo = new Date();
	sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

	for (let i = 0; i < formTypes.length; i++) {
		if (formTypes[i] === "10-K") {
			const dateStr = dates[i];
			if (!dateStr) continue;
			const filingDate = new Date(dateStr);
			// First check for invalid date, then check recency
			if (Number.isNaN(filingDate.getTime())) continue;
			if (filingDate >= sixMonthsAgo) {
				return {
					date: dateStr,
					accessionNumber: accessions[i] ?? "",
					document: documents[i] ?? "",
				};
			}
		}
	}

	return null;
}

/**
 * Find the most recent 10-Q filing.
 */
export function findLatest10Q(
	submissions: SubmissionsResponse,
): { date: string; accessionNumber: string; document: string } | null {
	const filings = submissions.filings?.recent;
	if (!filings) return null;

	const formTypes = filings.form;
	const dates = filings.filingDate;
	const accessions = filings.accessionNumber;
	const documents = filings.primaryDocument;

	for (let i = 0; i < formTypes.length; i++) {
		if (formTypes[i] === "10-Q") {
			return {
				date: dates[i] ?? "",
				accessionNumber: accessions[i] ?? "",
				document: documents[i] ?? "",
			};
		}
	}

	return null;
}

/**
 * Find recent 8-K material event filings.
 *
 * @param submissions - Submissions response
 * @param count - Number of recent 8-Ks to return (default 3)
 */
export function findRecent8Ks(
	submissions: SubmissionsResponse,
	count = 3,
): Array<{
	date: string;
	accessionNumber: string;
	document: string;
	formType: string;
}> {
	const filings = submissions.filings?.recent;
	if (!filings) return [];

	const formTypes = filings.form;
	const dates = filings.filingDate;
	const accessions = filings.accessionNumber;
	const documents = filings.primaryDocument;

	const results: Array<{
		date: string;
		accessionNumber: string;
		document: string;
		formType: string;
	}> = [];

	for (let i = 0; i < formTypes.length && results.length < count; i++) {
		if (formTypes[i] === "8-K") {
			results.push({
				date: dates[i] ?? "",
				accessionNumber: accessions[i] ?? "",
				document: documents[i] ?? "",
				formType: "8-K",
			});
		}
	}

	return results;
}

// ---------------------------------------------------------------------------
// Filing Document Extraction
// ---------------------------------------------------------------------------

/**
 * Fetch a filing document from SEC EDGAR.
 *
 * @param cik - 10-digit CIK
 * @param accessionNumber - Accession number (with dashes)
 * @param primaryDocument - Primary document path
 * @returns HTML content or null on failure
 */
export async function fetchFilingDocument(
	cik: string,
	accessionNumber: string,
	primaryDocument: string,
): Promise<string | null> {
	// Archives URLs use unpadded integer CIK
	const unpaddedCik = String(Number.parseInt(cik, 10));
	// Remove dashes from accession number for the URL path
	const accessionNoDashes = accessionNumber.replace(/-/g, "");

	const url = `/Archives/edgar/data/${unpaddedCik}/${accessionNoDashes}/${primaryDocument}`;

	const result = await secFetch<string>(url, { responseType: "text" });

	if (result.kind === "success") {
		return result.data;
	}

	return null;
}

/**
 * Strip HTML tags from text content.
 */
function stripHtml(html: string): string {
	return html
		.replace(/<[^>]*>/g, " ")
		.replace(/&nbsp;/g, " ")
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/\s+/g, " ")
		.trim();
}

/**
 * Escape special regex characters in a string.
 */
function escapeRegex(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Extract a section from filing HTML using regex patterns.
 * Falls back to null if section not found.
 *
 * @param html - Filing HTML content
 * @param itemNumber - Item number (e.g., "1", "1A", "7")
 * @param maxChars - Maximum characters to extract
 */
export function extractSection(
	html: string,
	itemNumber: string,
	maxChars = 5000,
): string | null {
	// Escape special regex characters in itemNumber
	const escapedItemNumber = escapeRegex(itemNumber);
	// Build regex pattern for the section
	// Matches: "Item 1." followed by "Business" OR just "Item 1A" etc.
	const itemPattern = escapedItemNumber.replace("A", "A?").replace("B", "B?");
	const startRegex = new RegExp(
		`(?:Item\\s*${itemPattern})(?:\\s*\\.?\\s*[A-Z][a-zA-Z]*)?(?:<[^>]*>)*\\s*(.*?)`,
		"i",
	);

	// Find the start of the section
	const startMatch = html.match(startRegex);
	if (!startMatch || startMatch.index === undefined) return null;

	// Find the end (next Item or end of document)
	const contentStart = startMatch.index + startMatch[0].length;
	const remaining = html.slice(contentStart);

	// Next item pattern (Item 1A, Item 2, etc.)
	const nextItemRegex = /<[^>]*>*(?:Item\s*\d+[A-Z]?|PART\s+[IVX])/i;
	const endMatch = remaining.match(nextItemRegex);

	let sectionContent: string;
	if (endMatch) {
		sectionContent = remaining.slice(0, endMatch.index);
	} else {
		sectionContent = remaining;
	}

	// Strip HTML and truncate
	const plainText = stripHtml(sectionContent);
	if (plainText.length <= maxChars) {
		return plainText;
	}

	// Return truncated with indicator
	return `${plainText.slice(0, maxChars)}...`;
}

/**
 * Extract key sections from a 10-K filing.
 */
export async function extract10KSections(html: string): Promise<{
	business: string | null;
	riskFactors: string | null;
	mda: string | null;
}> {
	// Item 1 - Business
	const business = extractSection(html, "1", 8000);

	// Item 1A - Risk Factors
	const riskFactors = extractSection(html, "1A", 5000);

	// Item 7 - MD&A
	const mda = extractSection(html, "7", 8000);

	return { business, riskFactors, mda };
}

// ---------------------------------------------------------------------------
// XBRL Financial Facts
// ---------------------------------------------------------------------------

/**
 * Fetch company facts (XBRL financial data) from SEC.
 *
 * @param cik - 10-digit CIK
 * @returns Company facts response or null on failure
 */
export async function fetchCompanyFacts(
	cik: string,
): Promise<CompanyFactsResponse | null> {
	const paddedCik = padCik(cik);
	const result = await secFetch<CompanyFactsResponse>(
		`/api/xbrl/companyfacts/CIK${paddedCik}.json`,
	);

	if (result.kind === "success") {
		return result.data;
	}

	return null;
}

/**
 * Extract financial data points from company facts.
 */
export function extractFinancialFacts(
	facts: CompanyFactsResponse,
): XbrlFinancialFacts {
	const gaap = facts.facts?.["us-gaap"];

	type XbrlUsdValue = {
		val: number;
		end: string;
		start?: string;
		form: string;
	};
	type XbrlConcept = { units: { USD: XbrlUsdValue[] } };

	const extractDataPoints = (
		concept: XbrlConcept | undefined,
	): FinancialDataPoint[] => {
		if (!concept) return [];

		// Access USD values directly from units
		const values = concept.units?.USD;
		if (!values || !Array.isArray(values)) return [];

		// Filter for 10-K forms, sort by end date desc, take top 4
		const tenKValues = values
			.filter((v) => v.form === "10-K" && v.val !== undefined && v.end)
			.sort((a, b) => new Date(b.end).getTime() - new Date(a.end).getTime())
			.slice(0, 4);

		return tenKValues.map((v) => ({
			period: v.start ? `${v.start} to ${v.end}` : v.end,
			value: v.val ?? 0,
		}));
	};

	return {
		revenue: extractDataPoints(
			gaap?.RevenueFromContractWithCustomerExcludingAssessedTax as
				| XbrlConcept
				| undefined,
		),
		netIncome: extractDataPoints(
			gaap?.NetIncomeLoss as XbrlConcept | undefined,
		),
		totalAssets: extractDataPoints(gaap?.Assets as XbrlConcept | undefined),
		totalDebt: extractDataPoints(gaap?.Liabilities as XbrlConcept | undefined),
	};
}

// ---------------------------------------------------------------------------
// Input Validation
// ---------------------------------------------------------------------------

const enrichCompanyWithSecEdgarSchema = z.object({
	companyName: z.string().min(1).max(500),
	domain: z.string().url().optional(),
	existingCik: z
		.string()
		.regex(/^\d{10}$/)
		.optional(),
});

// ---------------------------------------------------------------------------
// Main Enrichment Function
// ---------------------------------------------------------------------------

/**
 * Enrich company with SEC EDGAR data.
 * Resolves CIK, fetches filings, extracts sections, and parses XBRL facts.
 *
 * @param companyName - Company name or ticker
 * @param domain - Optional domain for CIK resolution
 * @param existingCik - Optional pre-resolved CIK (from #2251)
 */
export async function enrichCompanyWithSecEdgar(
	companyName: string,
	domain?: string,
	existingCik?: string,
): Promise<SecEdgarResult> {
	const logger = await getLogger();
	const ctx = { name: "enrichCompanyWithSecEdgar", companyName, domain };

	// Validate inputs
	const validationResult = enrichCompanyWithSecEdgarSchema.safeParse({
		companyName,
		domain,
		existingCik,
	});

	if (!validationResult.success) {
		const errorMessages = validationResult.error.issues
			.map((e: import("zod").ZodIssue) => `${e.path.join(".")}: ${e.message}`)
			.join("; ");

		return {
			configured: true,
			success: false,
			cik: null,
			companyName: null,
			latest10K: null,
			latest10Q: null,
			materialEvents: [],
			financialFacts: null,
			error: `Validation failed: ${errorMessages}`,
		};
	}

	try {
		// Step 1: Resolve CIK
		const cik = existingCik ?? (await resolveCik(companyName, domain));

		if (!cik) {
			return {
				configured: true,
				success: false,
				cik: null,
				companyName: null,
				latest10K: null,
				latest10Q: null,
				materialEvents: [],
				financialFacts: null,
				error: `Could not resolve CIK for company: ${companyName}`,
			};
		}

		logger.info(ctx, "Resolved CIK: %s", cik);

		// Step 2: Fetch submissions
		const submissions = await fetchSubmissions(cik);
		if (!submissions) {
			return {
				configured: true,
				success: false,
				cik,
				companyName: null,
				latest10K: null,
				latest10Q: null,
				materialEvents: [],
				financialFacts: null,
				error: `Could not fetch submissions for CIK: ${cik}`,
			};
		}

		const companyNameFromSec = submissions.name;

		// Step 3: Find latest 10-K
		const latest10K = findLatest10K(submissions);

		let businessSection: string | null = null;
		let riskFactorsSection: string | null = null;
		let mdaSection: string | null = null;

		if (latest10K) {
			logger.info(ctx, "Found 10-K: %s", latest10K.date);

			// Fetch and extract sections from 10-K
			const filingHtml = await fetchFilingDocument(
				cik,
				latest10K.accessionNumber,
				latest10K.document,
			);

			if (filingHtml) {
				const sections = await extract10KSections(filingHtml);
				businessSection = sections.business;
				riskFactorsSection = sections.riskFactors;
				mdaSection = sections.mda;

				// LLM fallback for missing sections (10s timeout)
				const _llmTimeout = 10_000;
				if (!businessSection || !riskFactorsSection || !mdaSection) {
					logger.info(ctx, "Using LLM fallback for missing 10-K sections");
					// TODO: Implement LLM fallback - call AI to extract missing sections
					// This would use the filingHtml and request extraction of missing sections
					// Example: const llmResult = await callLLMWithTimeout({ prompt, timeout: llmTimeout });
				}
			}
		}

		// Step 4: Find latest 10-Q (fallback)
		const latest10Q = findLatest10Q(submissions);

		// Step 5: Find recent 8-Ks with summaries
		const recent8Ks = findRecent8Ks(submissions, 3);

		// Extract summaries from 8-K filings
		const materialEvents: MaterialEvent[] = [];
		for (const filing of recent8Ks) {
			const filingHtml = await fetchFilingDocument(
				cik,
				filing.accessionNumber,
				filing.document,
			);

			let summary = "";
			if (filingHtml) {
				// Try to extract Item 2.02 (Results of Operations) or Item 1.01 (Entry into Material Agreement)
				const item202 = extractSection(filingHtml, "2.02", 2000);
				const item101 = extractSection(filingHtml, "1.01", 2000);
				summary = item202 || item101 || "";

				// If still empty, try LLM fallback for summary extraction
				if (!summary) {
					logger.info(ctx, "Using LLM fallback for 8-K summary extraction");
					// TODO: Implement LLM fallback - extract summary from filingHtml
				}
			}

			materialEvents.push({
				date: filing.date,
				formType: filing.formType,
				summary,
			});
		}

		// Step 6: Fetch company facts for XBRL data
		const companyFacts = await fetchCompanyFacts(cik);
		const financialFacts = companyFacts
			? extractFinancialFacts(companyFacts)
			: null;

		return {
			configured: true,
			success: true,
			cik,
			companyName: companyNameFromSec,
			latest10K: latest10K
				? {
						date: latest10K.date,
						accessionNumber: latest10K.accessionNumber,
						document: latest10K.document,
						businessSection,
						riskFactorsSection,
						mdaSection,
					}
				: null,
			latest10Q: latest10Q
				? {
						date: latest10Q.date,
						accessionNumber: latest10Q.accessionNumber,
						document: latest10Q.document,
					}
				: null,
			materialEvents,
			financialFacts,
		};
	} catch (err) {
		const message = err instanceof Error ? err.message : "Unknown error";
		logger.error(ctx, "SEC EDGAR enrichment failed: %s", message);

		return {
			configured: true,
			success: false,
			cik: null,
			companyName: null,
			latest10K: null,
			latest10Q: null,
			materialEvents: [],
			financialFacts: null,
			error: message,
		};
	}
}
