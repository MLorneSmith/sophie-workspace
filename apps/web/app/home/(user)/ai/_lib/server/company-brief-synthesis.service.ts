import "server-only";

import { type ChatMessage, getChatCompletion } from "@kit/ai-gateway";
import { getLogger } from "@kit/shared/logger";
import type { z } from "zod";

import {
	AlphaVantageDataSchema,
	SecEdgarDataSchema,
} from "../schemas/external-data.schema";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CompanyBrief {
	companySnapshot: {
		name: string;
		industry: string;
		size: string;
		marketPosition: string;
	};
	currentSituation: {
		summary: string;
		recentNews: string[];
		strategicFocus: string;
		challenges: string[];
		archetype:
			| "in-trouble"
			| "growing-fast"
			| "in-transformation"
			| "stable-mature"
			| "industry-disruption";
	};
	industryContext: {
		trends: string[];
		regulatory: string;
		competitors: string[];
	};
	presentationImplications: {
		framingAdvice: string;
		topicsToAcknowledge: string[];
		relevantBenchmarks: string[];
		avoidTopics: string[];
	};
	/**
	 * List of data sources that contributed to this brief.
	 * Expected values: "apollo", "netrows", "braveSearch", "websiteContent", "websiteDeepScrape", "alphaVantage", "secEdgar"
	 */
	dataSourcesUsed: string[];
}

export interface ApolloDataInput {
	estimatedRevenue?: string | null;
	employeeCount?: string | null;
	employeeGrowth?: number | null;
	fundingStage?: string | null;
	fundingTotal?: number | null;
	techStack?: string[];
	keyIndustries?: string[];
	keyExecutives?: Array<{ name: string; title: string }>;
}

export interface WebsiteDeepScrapeInput {
	aboutContent: string | null;
	newsroomContent: string | null;
	careersContent: string | null;
	blogContent: string | null;
	investorsContent: string | null;
	jobPostings: string[];
	recentPressReleases: string[];
}

/**
 * Financial data from Alpha Vantage API for public companies.
 * All fields optional to handle partial API responses.
 */
export type AlphaVantageDataInput = z.infer<typeof AlphaVantageDataSchema>;

/**
 * Regulatory filing data from SEC EDGAR.
 * All fields optional since not all companies have recent filings.
 */
export type SecEdgarDataInput = z.infer<typeof SecEdgarDataSchema>;

export interface CompanyResearchInput {
	companyName: string;
	industry?: string;
	apolloData?: ApolloDataInput;
	netrowsData?: {
		description?: string;
		industries?: string[];
		specialities?: string[];
		staffCount?: number;
		website?: string;
		headquarter?: { city?: string; country?: string };
		founded?: number | null;
	};
	newsResults?: Array<{ title: string; url: string; snippet: string }>;
	industryResults?: Array<{ title: string; url: string; snippet: string }>;
	websiteContent?: string | null;
	websiteDeepScrape?: WebsiteDeepScrapeInput;
	/** Financial data from Alpha Vantage API (for public companies) */
	alphaVantageData?: AlphaVantageDataInput;
	/** Regulatory filing data from SEC EDGAR */
	secEdgarData?: SecEdgarDataInput;
}

// ---------------------------------------------------------------------------
// Semantic emptiness helpers - determine if data sources have meaningful content
// ---------------------------------------------------------------------------

/**
 * Check if a value is a non-blank string (not empty after trimming).
 */
function hasNonBlankString(value: unknown): value is string {
	return typeof value === "string" && value.trim().length > 0;
}

/**
 * Check if Alpha Vantage data has at least one non-null/non-empty field.
 */
function hasAlphaVantageData(data: AlphaVantageDataInput | undefined): boolean {
	if (!data) return false;
	const fields: (keyof AlphaVantageDataInput)[] = [
		"revenue",
		"grossMargin",
		"operatingMargin",
		"stockPrice",
		"week52High",
		"week52Low",
		"analystConsensus",
		"analystBuyCount",
		"analystHoldCount",
		"analystSellCount",
		"peRatio",
		"industryAvgPeRatio",
		"beta",
	];
	return fields.some((field) => {
		const value = data[field];
		return typeof value === "string" ? value.trim().length > 0 : value != null;
	});
}

/**
 * Check if SEC EDGAR data has meaningful content.
 */
function hasSecEdgarData(data: SecEdgarDataInput | undefined): boolean {
	if (!data) return false;
	const hasRiskFactors =
		Array.isArray(data.riskFactors) &&
		data.riskFactors.some((risk) => hasNonBlankString(risk));
	const hasMdaSummary =
		typeof data.mdaSummary === "string" && data.mdaSummary.trim().length > 0;
	const hasRevenueByYear =
		Array.isArray(data.revenueByYear) &&
		data.revenueByYear.some(
			(revenue) => revenue.year != null && revenue.amount != null,
		);
	const hasEightKEvents =
		Array.isArray(data.recentEightKEvents) &&
		data.recentEightKEvents.some(
			(event) =>
				hasNonBlankString(event.date) ||
				hasNonBlankString(event.type) ||
				hasNonBlankString(event.summary),
		);
	return hasRiskFactors || hasMdaSummary || hasRevenueByYear || hasEightKEvents;
}

/**
 * Check if Apollo data has at least one meaningful field.
 */
function hasApolloData(data: ApolloDataInput | undefined): boolean {
	if (!data) return false;
	const hasRevenue =
		typeof data.estimatedRevenue === "string" &&
		data.estimatedRevenue.trim().length > 0;
	const hasEmployees =
		typeof data.employeeCount === "string" &&
		data.employeeCount.trim().length > 0;
	const hasEmployeeGrowth = typeof data.employeeGrowth === "number";
	const hasFundingStage =
		typeof data.fundingStage === "string" &&
		data.fundingStage.trim().length > 0;
	const hasFunding =
		typeof data.fundingTotal === "number" && Number.isFinite(data.fundingTotal);
	const hasKeyIndustries =
		Array.isArray(data.keyIndustries) &&
		data.keyIndustries.some(
			(industry) => typeof industry === "string" && industry.trim().length > 0,
		);
	const hasTechStack =
		Array.isArray(data.techStack) &&
		data.techStack.some(
			(tech) => typeof tech === "string" && tech.trim().length > 0,
		);
	const hasExecutives =
		Array.isArray(data.keyExecutives) &&
		data.keyExecutives.some(
			(executive) =>
				hasNonBlankString(executive.name) || hasNonBlankString(executive.title),
		);
	return (
		hasRevenue ||
		hasEmployees ||
		hasEmployeeGrowth ||
		hasFundingStage ||
		hasFunding ||
		hasKeyIndustries ||
		hasTechStack ||
		hasExecutives
	);
}

/**
 * Check if Netrows data has at least one meaningful field.
 */
function hasNetrowsData(data: CompanyResearchInput["netrowsData"]): boolean {
	if (!data) return false;
	const hasDescription =
		typeof data.description === "string" && data.description.trim().length > 0;
	const hasIndustries =
		Array.isArray(data.industries) &&
		data.industries.some(
			(industry) => typeof industry === "string" && industry.trim().length > 0,
		);
	const hasSpecialities =
		Array.isArray(data.specialities) &&
		data.specialities.some(
			(speciality) =>
				typeof speciality === "string" && speciality.trim().length > 0,
		);
	const hasStaffCount =
		typeof data.staffCount === "number" && data.staffCount > 0;
	const hasWebsite =
		typeof data.website === "string" && data.website.trim().length > 0;
	const hasHeadquarter =
		hasNonBlankString(data.headquarter?.city) ||
		hasNonBlankString(data.headquarter?.country);
	const hasFounded = typeof data.founded === "number" && data.founded > 0;
	return (
		hasDescription ||
		hasIndustries ||
		hasSpecialities ||
		hasStaffCount ||
		hasWebsite ||
		hasHeadquarter ||
		hasFounded
	);
}

/**
 * Check if website deep scrape data has meaningful content.
 */
function hasWebsiteDeepScrapeData(
	data: WebsiteDeepScrapeInput | undefined,
): boolean {
	if (!data) return false;

	const textFields = [
		data.aboutContent,
		data.newsroomContent,
		data.careersContent,
		data.blogContent,
		data.investorsContent,
	];

	return (
		textFields.some(
			(value) => typeof value === "string" && value.trim().length > 0,
		) ||
		data.jobPostings.some((value) => value.trim().length > 0) ||
		data.recentPressReleases.some((value) => value.trim().length > 0)
	);
}

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------

function buildCompanyBriefPrompt(input: CompanyResearchInput): ChatMessage[] {
	const apolloSection = input.apolloData
		? `
## Company Data (Apollo.io)
- Estimated Revenue: ${input.apolloData.estimatedRevenue ?? "N/A"}
- Employee Count: ${input.apolloData.employeeCount ?? "N/A"}
- Employee Growth: ${input.apolloData.employeeGrowth != null ? `${input.apolloData.employeeGrowth}%` : "N/A"}
- Funding Stage: ${input.apolloData.fundingStage ?? "N/A"}
- Total Funding: ${input.apolloData.fundingTotal != null ? `$${input.apolloData.fundingTotal.toLocaleString()}` : "N/A"}
- Tech Stack: ${input.apolloData.techStack?.slice(0, 15).join(", ") ?? "N/A"}
- Industries: ${input.apolloData.keyIndustries?.join(", ") ?? "N/A"}
- Key Executives: ${input.apolloData.keyExecutives?.map((e) => `${e.name} (${e.title})`).join("; ") ?? "N/A"}`
		: "";

	const netrowsSection = input.netrowsData
		? `
## Company Data (LinkedIn)
- Description: ${input.netrowsData.description?.substring(0, 500) ?? "N/A"}
- Industries: ${input.netrowsData.industries?.join(", ") ?? "N/A"}
- Specialities: ${input.netrowsData.specialities?.slice(0, 10).join(", ") ?? "N/A"}
- Staff Count: ${input.netrowsData.staffCount ?? "N/A"}
- HQ: ${input.netrowsData.headquarter?.city ?? "N/A"}, ${input.netrowsData.headquarter?.country ?? "N/A"}
- Website: ${input.netrowsData.website ?? "N/A"}
- Founded: ${input.netrowsData.founded ?? "N/A"}`
		: "## Company Data (LinkedIn)\nNo LinkedIn company data available.";

	const newsSection =
		input.newsResults && input.newsResults.length > 0
			? `
## Recent News & Strategy
${input.newsResults.map((r) => `- **${r.title}**: ${r.snippet}`).join("\n")}`
			: "## Recent News & Strategy\nNo recent news found.";

	const industrySection =
		input.industryResults && input.industryResults.length > 0
			? `
## Industry Context
${input.industryResults.map((r) => `- **${r.title}**: ${r.snippet}`).join("\n")}`
			: "## Industry Context\nNo industry data found.";

	const websiteSection = input.websiteContent
		? `
## Company Website Content
${input.websiteContent.substring(0, 2000)}`
		: "";

	// Website Deep Scrape sections
	const deepScrapeSections: string[] = [];

	if (input.websiteDeepScrape) {
		const {
			aboutContent,
			newsroomContent,
			careersContent,
			blogContent,
			investorsContent,
			jobPostings,
			recentPressReleases,
		} = input.websiteDeepScrape;

		if (aboutContent) {
			deepScrapeSections.push(`
## About Page Content
${aboutContent.substring(0, 1000)}`);
		}

		if (careersContent || jobPostings.length > 0) {
			const careersSection = `
## Careers Page & Job Postings
${careersContent ? `Page Content: ${careersContent.substring(0, 800)}` : ""}
${jobPostings.length > 0 ? `Open Positions: ${jobPostings.slice(0, 10).join("; ")}` : ""}`;
			deepScrapeSections.push(careersSection);
		}

		if (newsroomContent || recentPressReleases.length > 0) {
			const newsroomSection = `
## Newsroom & Press Releases
${newsroomContent ? `Page Content: ${newsroomContent.substring(0, 800)}` : ""}
${recentPressReleases.length > 0 ? `Recent Press: ${recentPressReleases.slice(0, 8).join("; ")}` : ""}`;
			deepScrapeSections.push(newsroomSection);
		}

		if (blogContent) {
			deepScrapeSections.push(`
## Blog / Insights
${blogContent.substring(0, 800)}`);
		}

		if (investorsContent) {
			deepScrapeSections.push(`
## Investor Relations
${investorsContent.substring(0, 800)}`);
		}
	}

	const deepScrapeSection =
		deepScrapeSections.length > 0 ? deepScrapeSections.join("\n") : "";

	// Alpha Vantage financial data section
	const alphaVantageSection = input.alphaVantageData
		? `
## Financial Data (Alpha Vantage)
- Revenue: ${input.alphaVantageData.revenue != null ? `$${input.alphaVantageData.revenue.toLocaleString()}` : "N/A"}
- Gross Margin: ${input.alphaVantageData.grossMargin != null ? `${input.alphaVantageData.grossMargin}%` : "N/A"}
- Operating Margin: ${input.alphaVantageData.operatingMargin != null ? `${input.alphaVantageData.operatingMargin}%` : "N/A"}
- Stock Price: ${input.alphaVantageData.stockPrice != null ? `$${input.alphaVantageData.stockPrice}` : "N/A"}
- 52-Week Range: ${input.alphaVantageData.week52Low != null && input.alphaVantageData.week52High != null ? `$${input.alphaVantageData.week52Low} - $${input.alphaVantageData.week52High}` : "N/A"}
- Analyst Consensus: ${input.alphaVantageData.analystConsensus ?? "N/A"}
  - Buy: ${input.alphaVantageData.analystBuyCount ?? "N/A"}, Hold: ${input.alphaVantageData.analystHoldCount ?? "N/A"}, Sell: ${input.alphaVantageData.analystSellCount ?? "N/A"}
- P/E Ratio: ${input.alphaVantageData.peRatio ?? "N/A"} (Industry Avg: ${input.alphaVantageData.industryAvgPeRatio ?? "N/A"})
- Beta: ${input.alphaVantageData.beta ?? "N/A"}`
		: "";

	// SEC EDGAR filing data section
	const secEdgarSection = input.secEdgarData
		? `
## SEC Filings (EDGAR)
${
	input.secEdgarData.riskFactors && input.secEdgarData.riskFactors.length > 0
		? `### Key Risk Factors
${input.secEdgarData.riskFactors
	.slice(0, 5)
	.map((r) => `- ${r}`)
	.join("\n")}`
		: ""
}
${
	input.secEdgarData.mdaSummary
		? `### Management Discussion & Analysis
${input.secEdgarData.mdaSummary.substring(0, 800)}`
		: ""
}
${
	input.secEdgarData.revenueByYear &&
	input.secEdgarData.revenueByYear.length > 0
		? `### Historical Revenue
${input.secEdgarData.revenueByYear
	.map((r) => `- ${r.year}: $${r.amount.toLocaleString()}`)
	.join("\n")}`
		: ""
}
${
	input.secEdgarData.recentEightKEvents &&
	input.secEdgarData.recentEightKEvents.length > 0
		? `### Recent 8-K Events
${input.secEdgarData.recentEightKEvents
	.slice(0, 5)
	.map((e) => `- **${e.date}** [${e.type}]: ${e.summary.substring(0, 150)}`)
	.join("\n")}`
		: ""
}`
		: "";

	const systemPrompt = `You are an expert business analyst specializing in presentation strategy. Given research data about a company, generate a structured Company Brief that helps a presenter understand the organizational context.

When interpreting website deep scrape data:
- About page content reveals company positioning, values, and culture signals
- Job postings are strategic signals — heavy hiring in AI/ML suggests technology transformation focus, sales expansion indicates market capture, R&D investment signals innovation priority
- Newsroom/press releases are the PRIMARY source for recent company developments (prefer over Brave Search snippets)
- Blog content shows thought leadership topics and public narrative
- Investor relations content reveals strategic priorities and financial health

When interpreting financial data (Alpha Vantage):
- Use revenue trends and margins to assess company growth and profitability
- Stock price and 52-week range indicate market confidence and volatility
- Analyst consensus and P/E ratio help gauge market expectations relative to fundamentals
- Beta measures stock volatility relative to the market — high beta = higher risk/reward

When interpreting SEC filings (EDGAR):
- Risk factors reveal what the company considers its biggest threats
- MD&A provides management's perspective on performance and strategy
- 8-K events show recent material developments requiring disclosure

Synthesize across all available sources:
- Cross-reference financial health from Alpha Vantage with strategic priorities from EDGAR filings
- Look for corroborating signals (e.g., strong revenue + aggressive hiring = growth phase)
- Flag disconnects (e.g., declining revenue but positive forward guidance)

Output valid JSON matching this exact schema:
{
  "companySnapshot": {
    "name": "string — company name",
    "industry": "string — primary industry",
    "size": "string — e.g. 'Enterprise (50,000+ employees)' or 'Mid-market (500-5000 employees)'",
    "marketPosition": "string — brief market position description"
  },
  "currentSituation": {
    "summary": "string — 2-3 sentence overview of what the company is going through right now",
    "recentNews": ["string — key recent development", "..."],
    "strategicFocus": "string — what the company is focused on right now",
    "challenges": ["string — known challenge or headwind", "..."],
    "archetype": "in-trouble | growing-fast | in-transformation | stable-mature | industry-disruption"
  },
  "industryContext": {
    "trends": ["string — relevant industry trend", "..."],
    "regulatory": "string — regulatory environment summary",
    "competitors": ["string — key competitor name", "..."]
  },
  "presentationImplications": {
    "framingAdvice": "string — how to frame your message given company context",
    "topicsToAcknowledge": ["string — things the audience already knows about", "..."],
    "relevantBenchmarks": ["string — data points worth referencing", "..."],
    "avoidTopics": ["string — sensitive areas to steer clear of", "..."]
  },
  "dataSourcesUsed": ["string — source identifiers: 'apollo', 'netrows', 'braveSearch', 'websiteContent', 'websiteDeepScrape', 'alphaVantage', 'secEdgar'"]
}

Be specific and actionable. Draw inferences from the data available. If information is sparse, make reasonable inferences based on what you know and note them. Focus on what matters for someone preparing a presentation to people at this company.`;

	const userPrompt = `Generate a Company Brief for:

**Company:** ${input.companyName}
${input.industry ? `**Industry:** ${input.industry}` : ""}

${apolloSection}
${netrowsSection}
${newsSection}
${industrySection}
${websiteSection}
${deepScrapeSection}
${alphaVantageSection}
${secEdgarSection}

Respond with ONLY the JSON object, no markdown fences.`;

	return [
		{ role: "system" as const, content: systemPrompt },
		{ role: "user" as const, content: userPrompt },
	];
}

// ---------------------------------------------------------------------------
// Timeout helper
// ---------------------------------------------------------------------------

function withTimeout<T>(
	promise: Promise<T>,
	ms: number,
	label: string,
): Promise<T> {
	return Promise.race([
		promise,
		new Promise<never>((_, reject) =>
			setTimeout(
				() => reject(new Error(`${label} timed out after ${ms}ms`)),
				ms,
			),
		),
	]);
}

// ---------------------------------------------------------------------------
// Main synthesis function
// ---------------------------------------------------------------------------

/**
 * Takes raw company research data and synthesizes it into a structured
 * CompanyBrief via LLM. Returns the brief or throws on failure.
 */
export async function synthesizeCompanyBrief(
	input: CompanyResearchInput,
	userId: string,
): Promise<CompanyBrief> {
	const logger = await getLogger();
	const ctx = {
		name: "synthesizeCompanyBrief",
		company: input.companyName,
	};

	logger.info(ctx, "Synthesizing company brief for %s", input.companyName);

	// Validate external data inputs with Zod - treat invalid data as unavailable
	const validatedAlphaVantage = input.alphaVantageData
		? AlphaVantageDataSchema.safeParse(input.alphaVantageData)
		: { success: true as const, data: undefined };
	const validatedSecEdgar = input.secEdgarData
		? SecEdgarDataSchema.safeParse(input.secEdgarData)
		: { success: true as const, data: undefined };

	// If validation fails, treat the data as unavailable
	const alphaVantageData = validatedAlphaVantage.success
		? validatedAlphaVantage.data
		: undefined;
	const secEdgarData = validatedSecEdgar.success
		? validatedSecEdgar.data
		: undefined;

	if (!validatedAlphaVantage.success) {
		logger.warn(
			{ ...ctx, error: validatedAlphaVantage.error.format() },
			"Alpha Vantage data failed validation",
		);
	}
	if (!validatedSecEdgar.success) {
		logger.warn(
			{ ...ctx, error: validatedSecEdgar.error.format() },
			"SEC EDGAR data failed validation",
		);
	}

	// Use validated data for prompt building
	const messages = buildCompanyBriefPrompt({
		...input,
		alphaVantageData,
		secEdgarData,
	});

	const synthesisAbort = new AbortController();
	const synthesisTimeoutId = setTimeout(
		() => synthesisAbort.abort("Company brief synthesis timed out after 90s"),
		90_000,
	);

	let response: Awaited<ReturnType<typeof getChatCompletion>>;
	try {
		response = await withTimeout(
			getChatCompletion(messages, {
				model: process.env.BIFROST_MODEL_WORKFLOW_RESEARCH,
				virtualKey: process.env.BIFROST_VK_WORKFLOW_RESEARCH,
				userId,
				feature: "workflow-company-research",
				timeout: 90_000,
				signal: synthesisAbort.signal,
			}),
			90_000,
			"Company brief synthesis",
		);
	} finally {
		clearTimeout(synthesisTimeoutId);
	}

	const jsonMatch = response.content.match(/\{[\s\S]*\}/);
	if (!jsonMatch) {
		logger.error(ctx, "No JSON found in AI response for company brief");
		throw new Error("No JSON found in AI response");
	}

	const brief = JSON.parse(jsonMatch[0]) as CompanyBrief;

	// Populate dataSourcesUsed based on which input data was provided
	// Use semantic emptiness helpers to only count sources with meaningful data
	const dataSourcesUsed: string[] = [];

	if (hasApolloData(input.apolloData)) {
		dataSourcesUsed.push("apollo");
	}
	if (hasNetrowsData(input.netrowsData)) {
		dataSourcesUsed.push("netrows");
	}
	if (
		(input.newsResults && input.newsResults.length > 0) ||
		(input.industryResults && input.industryResults.length > 0)
	) {
		dataSourcesUsed.push("braveSearch");
	}
	if (input.websiteContent?.trim()) {
		dataSourcesUsed.push("websiteContent");
	}
	if (hasWebsiteDeepScrapeData(input.websiteDeepScrape)) {
		dataSourcesUsed.push("websiteDeepScrape");
	}
	if (hasAlphaVantageData(alphaVantageData)) {
		dataSourcesUsed.push("alphaVantage");
	}
	if (hasSecEdgarData(secEdgarData)) {
		dataSourcesUsed.push("secEdgar");
	}

	brief.dataSourcesUsed = dataSourcesUsed;

	logger.info(
		ctx,
		"Company brief synthesized — archetype: %s",
		brief.currentSituation?.archetype,
	);

	return brief;
}
