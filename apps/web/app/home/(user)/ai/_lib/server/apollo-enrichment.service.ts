import "server-only";

// ---------------------------------------------------------------------------
// Apollo.io API – server-only service for company enrichment
// https://apollo.io/api/v1/organizations/enrich
// ---------------------------------------------------------------------------

const BASE_URL = "https://api.apollo.io";
const TIMEOUT_MS = 10_000;

function getApiKey(): string | null {
	return process.env.APOLLO_API_KEY ?? null;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Apollo organization enrichment response */
export interface ApolloOrganization {
	id: string;
	name: string;
	website_url: string;
	linkedin_url: string | null;
	facebook_url: string | null;
	twitter_url: string | null;
	crunchbase_url: string | null;
	description: string | null;
	logo_url: string | null;
	industry: string | null;
	industries: string[];
	keywords: string[];
	estimated_revenue_range: string | null;
	annual_revenue_printed: string | null;
	annual_revenue: number | null;
	total_funding: number | null;
	funding_stage: string | null;
	headquarters_location: {
		name: string;
		street_address: string | null;
		city: string;
		state: string | null;
		country: string;
		postal_code: string | null;
		linkedin_sdk_metro: string | null;
	} | null;
	employee_count_range: string | null;
	employee_count: number | null;
	employee_growth_rate: number | null;
	year_founded: number | null;
	technology_names: string[];
	organization_domains: string[];
	current_technologies: Array<{
		name: string;
		category: string;
	}>;
	people: Array<{
		id: string;
		name: string;
		title: string;
		linkedin_url: string | null;
		email: string | null;
	}>;
}

/** Apollo API response wrapper */
interface ApolloEnrichResponse {
	organization: ApolloOrganization | null;
}

/** Combined enrichment result returned by enrichCompany */
export interface ApolloEnrichmentResult {
	organization: ApolloOrganization | null;
	success: boolean;
	error?: string;
}

// ---------------------------------------------------------------------------
// Internal fetch helper
// ---------------------------------------------------------------------------

async function apolloFetch<T>(
	path: string,
	body: Record<string, unknown>,
): Promise<T | null> {
	const apiKey = getApiKey();

	// If no API key, return null gracefully (Apollo is optional)
	if (!apiKey) {
		return null;
	}

	const url = new URL(path, BASE_URL);

	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

	try {
		const res = await fetch(url.toString(), {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-api-key": apiKey,
			},
			body: JSON.stringify(body),
			signal: controller.signal,
		});

		const data = (await res.json()) as Record<string, unknown>;

		// Apollo returns { organization: null } for missing domains
		if (data.organization === null) {
			return null;
		}

		// Handle rate limiting (HTTP 429)
		if (res.status === 429) {
			throw new Error("Apollo API rate limit exceeded");
		}

		if (!res.ok) {
			const msg =
				typeof data.error === "string"
					? data.error
					: `Apollo API error ${res.status}`;
			throw new Error(msg);
		}

		return data as T;
	} catch (err) {
		if (err instanceof DOMException && err.name === "AbortError") {
			throw new Error(`Apollo API request timed out: ${path}`);
		}
		throw err;
	} finally {
		clearTimeout(timer);
	}
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Enrich a company by domain using Apollo's Organization Enrichment API.
 * Returns enrichment data including revenue, employees, tech stack, and funding.
 *
 * @param domain - Company domain (e.g., "stripe.com")
 * @returns ApolloEnrichmentResult with organization data or null if unavailable
 */
export async function enrichCompany(
	domain: string,
): Promise<ApolloEnrichmentResult> {
	// Validate domain format
	if (!domain || !domain.includes(".")) {
		return {
			organization: null,
			success: false,
			error: "Invalid domain format",
		};
	}

	try {
		const response = await apolloFetch<ApolloEnrichResponse>(
			"/api/v1/organizations/enrich",
			{
				domain,
				// Request specific fields to reduce response size
				// If you need more fields, remove this or add to the array
			},
		);

		if (!response) {
			// No API key configured
			return {
				organization: null,
				success: true,
				error: "Apollo API key not configured",
			};
		}

		return {
			organization: response.organization ?? null,
			success: true,
		};
	} catch (err) {
		const message =
			err instanceof Error ? err.message : "Unknown Apollo API error";
		return {
			organization: null,
			success: false,
			error: message,
		};
	}
}

/**
 * Extract domain from a company website URL.
 * Handles various formats like "https://stripe.com", "stripe.com", "www.stripe.com"
 */
export function extractDomain(websiteUrl: string | null | undefined): string | null {
	if (!websiteUrl) return null;

	// Remove protocol and www prefix
	let domain = websiteUrl
		.replace(/^https?:\/\//, "")
		.replace(/^www\./, "")
		.replace(/\/.*$/, "");

	// Basic validation
	if (!domain || !domain.includes(".")) {
		return null;
	}

	return domain;
}
