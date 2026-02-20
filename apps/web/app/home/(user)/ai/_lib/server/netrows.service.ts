import "server-only";

// ---------------------------------------------------------------------------
// Netrows API – server-only service for LinkedIn/company enrichment
// https://api.netrows.com
// ---------------------------------------------------------------------------

const BASE_URL = "https://api.netrows.com";
const TIMEOUT_MS = 10_000;

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

/** Minimal person search result item */
export interface NetrowsPersonSearchItem {
	id: number;
	urn: string;
	username: string;
	firstName: string;
	lastName: string;
	headline: string;
	profilePicture: string | null;
	linkedinURL?: string;
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

	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

	try {
		const res = await fetch(url.toString(), {
			method: "GET",
			headers: { "x-api-key": getApiKey() },
			signal: controller.signal,
		});

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
	} finally {
		clearTimeout(timer);
	}
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Search for a person on LinkedIn by name and company.
 * Returns an array of matching profiles, or null if none found.
 */
export async function searchPerson(
	name: string,
	company: string,
): Promise<NetrowsPersonSearchItem[] | null> {
	const result = await netrowsFetch<{
		success: boolean;
		data: { items: NetrowsPersonSearchItem[] };
	}>("/v1/people/search", { name, company });

	if (!result) return null;
	return result.data?.items ?? null;
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
 * Returns combined enrichment data for use in audience profiling.
 */
export async function researchPerson(
	name: string,
	company: string,
): Promise<NetrowsEnrichmentResult> {
	// Step 1: Search for the person
	const personSearchResults = await searchPerson(name, company);

	// Step 2: Get full profile of the first match (if any)
	let personProfile: NetrowsPersonProfile | null = null;
	if (personSearchResults && personSearchResults.length > 0) {
		const firstMatch = personSearchResults[0];
		// Construct LinkedIn URL from username if not provided directly
		const profileUrl =
			firstMatch?.linkedinURL ??
			(firstMatch?.username
				? `https://www.linkedin.com/in/${firstMatch.username}/`
				: null);

		if (profileUrl) {
			personProfile = await getPersonProfile(profileUrl);
		}
	}

	// Step 3: Search for the company
	const companySearchResults = await searchCompany(company);

	// Step 4: Get full company details from first match
	let companyDetails: NetrowsCompanyDetails | null = null;
	if (companySearchResults && companySearchResults.length > 0) {
		const firstCompany = companySearchResults[0];
		if (firstCompany?.linkedinURL) {
			companyDetails = await getCompanyDetails(firstCompany.linkedinURL);
		}
	}

	return {
		personSearchResults,
		personProfile,
		companySearchResults,
		companyDetails,
	};
}
