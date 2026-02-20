import "server-only";

// ---------------------------------------------------------------------------
// Company Research Service – web search for company news, industry context
// Uses Brave Search API for web results
// ---------------------------------------------------------------------------

const BRAVE_BASE_URL = "https://api.search.brave.com/res/v1/web/search";
const TIMEOUT_MS = 10_000;

function getBraveApiKey(): string {
	const key = process.env.BRAVE_API_KEY;
	if (!key) {
		throw new Error("BRAVE_API_KEY is not configured");
	}
	return key;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WebSearchResult {
	title: string;
	url: string;
	snippet: string;
	publishedDate?: string;
}

export interface CompanyResearchResult {
	companyName: string;
	searchedAt: Date;
	newsResults: WebSearchResult[];
	industryResults: WebSearchResult[];
	websiteContent: string | null;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function braveSearch(
	query: string,
	count = 5,
): Promise<WebSearchResult[]> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

	try {
		const url = new URL(BRAVE_BASE_URL);
		url.searchParams.set("q", query);
		url.searchParams.set("count", String(count));

		const res = await fetch(url.toString(), {
			headers: {
				"X-Subscription-Token": getBraveApiKey(),
				Accept: "application/json",
			},
			signal: controller.signal,
		});

		if (!res.ok) return [];

		const data = (await res.json()) as {
			web?: {
				results?: Array<{
					title?: string;
					url?: string;
					description?: string;
					age?: string;
					page_age?: string;
				}>;
			};
		};

		const webResults = data.web?.results ?? [];
		return webResults.slice(0, count).map((r) => ({
			title: r.title ?? "",
			url: r.url ?? "",
			snippet: r.description ?? "",
			publishedDate: r.age ?? r.page_age ?? undefined,
		}));
	} catch {
		return [];
	} finally {
		clearTimeout(timer);
	}
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Search for recent company news and strategy updates.
 */
export async function searchCompanyNews(
	companyName: string,
	industry?: string,
): Promise<WebSearchResult[]> {
	const year = new Date().getFullYear();
	const q = industry
		? `${companyName} ${industry} recent news strategy ${year}`
		: `${companyName} recent news strategy ${year}`;
	return braveSearch(q);
}

/**
 * Search for industry context, trends, and challenges related to a company.
 */
export async function searchIndustryContext(
	companyName: string,
	industry: string,
): Promise<WebSearchResult[]> {
	return braveSearch(`${companyName} ${industry} trends challenges`);
}

/**
 * Fetch and extract text from a company's website.
 * Returns truncated plain text or null on failure (non-blocking).
 */
export async function fetchCompanyWebsite(
	domain: string,
): Promise<string | null> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

	try {
		const res = await fetch(`https://${domain}`, {
			signal: controller.signal,
		});
		if (!res.ok) return null;

		const html = await res.text();
		// Strip HTML tags, collapse whitespace, truncate
		const text = html
			.replace(/<[^>]*>/g, " ")
			.replace(/\s+/g, " ")
			.trim();
		return text.substring(0, 3000) || null;
	} catch {
		return null;
	} finally {
		clearTimeout(timer);
	}
}

/**
 * Full company research flow: news search + industry context + website fetch.
 * All three run in parallel. Individual failures are non-blocking.
 */
export async function researchCompany(
	companyName: string,
	industry?: string,
	domain?: string,
): Promise<CompanyResearchResult> {
	const [newsResults, industryResults, websiteContent] = await Promise.all([
		searchCompanyNews(companyName, industry),
		industry
			? searchIndustryContext(companyName, industry)
			: Promise.resolve([]),
		domain ? fetchCompanyWebsite(domain) : Promise.resolve(null),
	]);

	return {
		companyName,
		searchedAt: new Date(),
		newsResults,
		industryResults,
		websiteContent,
	};
}
