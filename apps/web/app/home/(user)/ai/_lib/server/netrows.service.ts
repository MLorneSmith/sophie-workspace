import "server-only";

import { getChatCompletion } from "@kit/ai-gateway";
import { getLogger } from "@kit/shared/logger";

import { nativeFetch } from "./fetch-native";

// ---------------------------------------------------------------------------
// Netrows API – server-only service for LinkedIn/company enrichment
// https://api.netrows.com
// ---------------------------------------------------------------------------

const BASE_URL = "https://api.netrows.com";
const TIMEOUT_MS = 15_000;

function getApiKey(): string {
	const key = process.env.NETROWS_API_KEY;
	if (!key) {
		throw new Error("NETROWS_API_KEY is not configured");
	}
	return key;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Person search result item from /v1/people/search */
export interface NetrowsPersonSearchItem {
	fullName: string;
	headline: string;
	summary: string | null;
	profilePicture: string | null;
	location: string | null;
	profileURL: string;
	username: string;
	[key: string]: unknown;
}

/** Geo info on a person profile */
export interface NetrowsGeo {
	country: string;
	city: string;
	countryCode: string;
}

/** Education entry */
export interface NetrowsEducation {
	schoolName: string;
	degree: string;
	fieldOfStudy: string;
	start: { year: number; month: number; day: number };
	end: { year: number; month: number; day: number };
	description: string;
	logo: string | null;
	[key: string]: unknown;
}

/** Position / experience entry */
export interface NetrowsPosition {
	title: string;
	companyName: string;
	description: string;
	start: { year: number; month: number; day: number };
	end: { year: number; month: number; day: number };
	companyLogo: string | null;
	[key: string]: unknown;
}

/** Full person profile from /v1/people/profile */
export interface NetrowsPersonProfile {
	id: number;
	urn: string;
	username: string;
	firstName: string;
	lastName: string;
	headline: string;
	summary: string;
	profilePicture: string | null;
	backgroundImage: string | null;
	geo: NetrowsGeo;
	educations: NetrowsEducation[];
	positions?: NetrowsPosition[];
	skills?: Array<{ name: string; [key: string]: unknown }>;
	isTopVoice?: boolean;
	isCreator?: boolean;
	isPremium?: boolean;
	[key: string]: unknown;
}

/** Company search result item */
export interface NetrowsCompanySearchItem {
	id: number;
	name: string;
	universalName: string;
	tagline: string;
	logo: string | null;
	linkedinURL: string;
}

/** Headquarter / location */
export interface NetrowsLocation {
	countryCode: string;
	country: string;
	city: string;
	postalCode?: string;
	line1?: string;
	line2?: string;
	headquarter?: boolean;
	[key: string]: unknown;
}

/** Full company details from /v1/companies/details */
export interface NetrowsCompanyDetails {
	id: string;
	name: string;
	universalName: string;
	linkedinUrl: string;
	description: string;
	tagline: string;
	type: string;
	website: string;
	staffCount: number;
	industries: string[];
	specialities: string[];
	headquarter: NetrowsLocation | null;
	locations: NetrowsLocation[];
	founded: number | null;
	followerCount: number;
	logos: string | null;
	[key: string]: unknown;
}

/** Combined enrichment result returned by researchPerson */
export interface NetrowsEnrichmentResult {
	personSearchResults: NetrowsPersonSearchItem[] | null;
	personProfile: NetrowsPersonProfile | null;
	companySearchResults: NetrowsCompanySearchItem[] | null;
	companyDetails: NetrowsCompanyDetails | null;
}

// ---------------------------------------------------------------------------
// Internal fetch helper
// ---------------------------------------------------------------------------

async function netrowsFetch<T>(
	path: string,
	params: Record<string, string>,
): Promise<T | null> {
	const url = new URL(path, BASE_URL);
	for (const [k, v] of Object.entries(params)) {
		if (v) url.searchParams.set(k, v);
	}

	try {
		const res = await nativeFetch(
			url.toString(),
			{
				method: "GET",
				headers: { "x-api-key": getApiKey() },
			},
			TIMEOUT_MS,
		);

		const body = (await res.json()) as Record<string, unknown>;

		// Netrows returns { code: "NOT_FOUND" } for missing data
		if (body.code === "NOT_FOUND") {
			return null;
		}

		if (!res.ok) {
			const msg =
				typeof body.message === "string"
					? body.message
					: `Netrows API error ${res.status}`;
			throw new Error(msg);
		}

		return body as T;
	} catch (err) {
		if (err instanceof DOMException && err.name === "AbortError") {
			throw new Error(`Netrows API request timed out: ${path}`);
		}
		throw err;
	}
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Search for a person on LinkedIn using the Netrows API parameters.
 * Accepts firstName, lastName, keywords, and company as separate fields.
 */
export async function searchPerson(params: {
	firstName?: string;
	lastName?: string;
	keywords?: string;
	company?: string;
}): Promise<NetrowsPersonSearchItem[] | null> {
	const searchParams: Record<string, string> = {};
	if (params.firstName) searchParams.firstName = params.firstName;
	if (params.lastName) searchParams.lastName = params.lastName;
	if (params.keywords) searchParams.keywords = params.keywords;
	if (params.company) searchParams.company = params.company;

	const result = await netrowsFetch<{
		success: boolean;
		data: { items: NetrowsPersonSearchItem[] };
	}>("/v1/people/search", searchParams);

	if (!result) return null;
	return result.data?.items ?? null;
}

// ---------------------------------------------------------------------------
// LLM-powered name expansion
// ---------------------------------------------------------------------------

interface SearchVariant {
	firstName?: string;
	lastName?: string;
	keywords?: string;
}

/**
 * Use a fast LLM to expand a person's name into search variants.
 * Handles nicknames → formal names (e.g. "Ajay" → "Ajaypal").
 * Falls back to simple first/last split on failure.
 */
async function expandSearchTerms(
	name: string,
	company: string,
	userId?: string,
	context?: string,
): Promise<SearchVariant[]> {
	const logger = await getLogger();
	const ctx = { name: "expandSearchTerms" };

	const parts = name.trim().split(/\s+/);
	const simpleFallback: SearchVariant[] = [
		{
			firstName: parts[0] ?? "",
			lastName: parts.length > 1 ? parts[parts.length - 1] : "",
		},
	];

	try {
		const response = await getChatCompletion(
			[
				{
					role: "system",
					content: `You generate search variations for finding a person on LinkedIn. Given a name, company, and optional context hints (role, location, background), return a JSON array of 2-3 objects with optional fields: firstName, lastName, keywords. Your MOST IMPORTANT job is to correct likely misspellings using your knowledge of well-known people at the given company. Also include formal/full name versions and the original spelling. Use context hints (title, location, etc.) in the keywords field to help disambiguate. For example: "Michael Meibach" at "Mastercard" → [{"firstName":"Michael","lastName":"Miebach"},{"firstName":"Michael","lastName":"Meibach"}]. "Ajay Banga" at "World Bank" → [{"firstName":"Ajaypal","lastName":"Banga"},{"firstName":"Ajay","lastName":"Banga"}]. "Sarah Chen" at "TD Bank" with context "VP of Engineering, Toronto" → [{"firstName":"Sarah","lastName":"Chen","keywords":"VP Engineering Toronto"}]. Put the most likely correct spelling FIRST. Only return the JSON array, nothing else.`,
				},
				{
					role: "user",
					content: `Name: "${name}"\nCompany: "${company}"${context ? `\nContext: "${context}"` : ""}`,
				},
			],
			{
				model:
					process.env.BIFROST_MODEL_WORKFLOW_RESEARCH_FAST ??
					process.env.BIFROST_MODEL_WORKFLOW_RESEARCH,
				virtualKey: process.env.BIFROST_MODEL_WORKFLOW_RESEARCH_FAST
					? (process.env.BIFROST_VK_WORKFLOW_RESEARCH_FAST ??
						process.env.BIFROST_VK_WORKFLOW_RESEARCH)
					: process.env.BIFROST_VK_WORKFLOW_RESEARCH,
				userId,
				feature: "workflow-name-expansion",
				temperature: 0.3,
				timeout: 4_000,
			},
		);

		const jsonMatch = response.content.match(/\[[\s\S]*\]/);
		if (!jsonMatch) {
			logger.warn(ctx, "No JSON array in LLM response, using fallback");
			return simpleFallback;
		}

		const parsed = JSON.parse(jsonMatch[0]) as SearchVariant[];
		if (!Array.isArray(parsed) || parsed.length === 0) {
			return simpleFallback;
		}

		logger.info(
			ctx,
			"Expanded '%s' into %d variants: %o",
			name,
			parsed.length,
			parsed,
		);
		return parsed.slice(0, 3);
	} catch (err) {
		logger.warn(ctx, "Name expansion failed, using fallback: %o", err);
		return simpleFallback;
	}
}

// ---------------------------------------------------------------------------
// Client-side relevance scoring
// ---------------------------------------------------------------------------

interface ScoredResult {
	item: NetrowsPersonSearchItem;
	score: number;
}

/**
 * Score and sort search results by relevance to the original query.
 * Name token overlap (60%) + company mention in headline (40%).
 */
function scoreResults(
	results: NetrowsPersonSearchItem[],
	name: string,
	company: string,
): NetrowsPersonSearchItem[] {
	const nameTokens = name
		.toLowerCase()
		.split(/\s+/)
		.filter((t) => t.length > 0);
	const companyLower = company.toLowerCase();

	const scored: ScoredResult[] = results.map((item) => {
		// Name score: token overlap
		const resultTokens = (item.fullName ?? "")
			.toLowerCase()
			.split(/\s+/)
			.filter((t) => t.length > 0);
		const matchCount = nameTokens.filter((t) =>
			resultTokens.includes(t),
		).length;
		const nameScore =
			nameTokens.length > 0 ? matchCount / nameTokens.length : 0;

		// Company score: substring match in headline
		const headlineLower = (item.headline ?? "").toLowerCase();
		const companyScore = headlineLower.includes(companyLower) ? 1.0 : 0.0;

		return { item, score: nameScore * 0.6 + companyScore * 0.4 };
	});

	scored.sort((a, b) => b.score - a.score);
	return scored.map((s) => s.item);
}

/**
 * Hybrid person search: LLM name expansion → 2 Netrows calls max → relevance scoring.
 * Handles nicknames (e.g. "Ajay" → "Ajaypal") while reducing API calls from 6 to 2.
 */
export async function searchPersonFuzzy(
	name: string,
	company: string,
	userId?: string,
	context?: string,
): Promise<NetrowsPersonSearchItem[]> {
	const logger = await getLogger();
	const ctx = { name: "searchPersonFuzzy" };

	// Phase 1: LLM name expansion
	const variants = await expandSearchTerms(name, company, userId, context);
	logger.info(ctx, "Search variants for '%s': %o", name, variants);

	const seen = new Set<string>();
	const allResults: NetrowsPersonSearchItem[] = [];

	const collect = (items: NetrowsPersonSearchItem[] | null) => {
		if (!items) return;
		for (const item of items) {
			const key = item.username || item.profileURL;
			if (key && !seen.has(key)) {
				seen.add(key);
				allResults.push(item);
			}
		}
	};

	// Phase 2: Netrows calls (max 3, sequential to avoid rate-limiting)
	// Each call is wrapped in try/catch so a single timeout doesn't lose
	// results from earlier successful calls.
	const best = variants[0];
	const expandedName = best
		? [best.firstName, best.lastName].filter(Boolean).join(" ")
		: name;
	const nameChanged = expandedName.toLowerCase() !== name.toLowerCase();

	// Call 1: Expanded name as keywords + company filter
	try {
		const params = { keywords: expandedName, company };
		logger.info(ctx, "Call 1 (expanded+company): %o", params);
		const r = await searchPerson(params);
		const names =
			r?.slice(0, 5).map((p) => `${p.fullName} (${p.username})`) ?? [];
		logger.info(ctx, "Call 1: %d results — %o", r?.length ?? 0, names);
		collect(r);
	} catch (err) {
		logger.warn(
			ctx,
			"Call 1 failed: %s",
			err instanceof Error ? err.message : String(err),
		);
	}

	// Call 2: Expanded name as keywords WITHOUT company (catches company name mismatches)
	if (nameChanged) {
		try {
			const params = { keywords: expandedName };
			logger.info(ctx, "Call 2 (expanded-only): %o", params);
			const r = await searchPerson(params);
			const names =
				r?.slice(0, 5).map((p) => `${p.fullName} (${p.username})`) ?? [];
			logger.info(ctx, "Call 2: %d results — %o", r?.length ?? 0, names);
			collect(r);
		} catch (err) {
			logger.warn(
				ctx,
				"Call 2 failed: %s",
				err instanceof Error ? err.message : String(err),
			);
		}
	}

	// Call 3: Original name as keywords (no company, broad fallback)
	try {
		const params = { keywords: name };
		logger.info(
			ctx,
			"Call %d (original-keywords): %o",
			nameChanged ? 3 : 2,
			params,
		);
		const r = await searchPerson(params);
		const names =
			r?.slice(0, 5).map((p) => `${p.fullName} (${p.username})`) ?? [];
		logger.info(
			ctx,
			"Call %d: %d results — %o",
			nameChanged ? 3 : 2,
			r?.length ?? 0,
			names,
		);
		collect(r);
	} catch (err) {
		logger.warn(
			ctx,
			"Call %d failed: %s",
			nameChanged ? 3 : 2,
			err instanceof Error ? err.message : String(err),
		);
	}

	if (allResults.length === 0) {
		logger.warn(ctx, "No results for '%s' at '%s'", name, company);
		return [];
	}

	// Phase 3: Score and sort by relevance
	const sorted = scoreResults(allResults, name, company);
	logger.info(
		ctx,
		"Returning %d scored candidates (top: %s)",
		sorted.length,
		sorted[0]?.fullName ?? "none",
	);
	return sorted;
}

/**
 * Get a full person profile from a LinkedIn URL.
 * Returns the profile, or null if not found.
 */
export async function getPersonProfile(
	linkedinUrl: string,
): Promise<NetrowsPersonProfile | null> {
	return netrowsFetch<NetrowsPersonProfile>("/v1/people/profile", {
		url: linkedinUrl,
	});
}

/**
 * Search for companies by keyword.
 * Returns an array of matching companies, or null if none found.
 */
export async function searchCompany(
	keyword: string,
): Promise<NetrowsCompanySearchItem[] | null> {
	const result = await netrowsFetch<{
		success: boolean;
		data: { items: NetrowsCompanySearchItem[] };
	}>("/v1/companies/search", { keyword });

	if (!result) return null;
	return result.data?.items ?? null;
}

/**
 * Get full company details from a LinkedIn company URL.
 * Returns company details, or null if not found.
 */
export async function getCompanyDetails(
	linkedinUrl: string,
): Promise<NetrowsCompanyDetails | null> {
	const result = await netrowsFetch<{
		success: boolean;
		data: NetrowsCompanyDetails;
	}>("/v1/companies/details", { url: linkedinUrl });

	if (!result) return null;
	return result.data ?? null;
}

/**
 * Full research flow: search person → get profile → search company → get company details.
 * Person chain and company chain run in parallel since they're independent.
 */
export async function researchPerson(
	name: string,
	company: string,
): Promise<NetrowsEnrichmentResult> {
	const parts = name.trim().split(/\s+/);
	const firstName = parts[0] ?? "";
	const lastName = parts.length > 1 ? parts[parts.length - 1] : "";

	// Run person chain and company chain in parallel
	const [personResult, companyResult] = await Promise.all([
		// Person chain: search → profile
		(async () => {
			const searchResults = await searchPerson({
				firstName,
				lastName,
				company,
			});

			let profile: NetrowsPersonProfile | null = null;
			if (searchResults && searchResults.length > 0) {
				const firstMatch = searchResults[0];
				const profileUrl =
					firstMatch?.profileURL ??
					(firstMatch?.username
						? `https://www.linkedin.com/in/${firstMatch.username}/`
						: null);

				if (profileUrl) {
					profile = await getPersonProfile(profileUrl);
				}
			}

			return { searchResults, profile };
		})(),

		// Company chain: search → details
		(async () => {
			const searchResults = await searchCompany(company);

			let details: NetrowsCompanyDetails | null = null;
			if (searchResults && searchResults.length > 0) {
				const firstCompany = searchResults[0];
				if (firstCompany?.linkedinURL) {
					details = await getCompanyDetails(firstCompany.linkedinURL);
				}
			}

			return { searchResults, details };
		})(),
	]);

	return {
		personSearchResults: personResult.searchResults,
		personProfile: personResult.profile,
		companySearchResults: companyResult.searchResults,
		companyDetails: companyResult.details,
	};
}
