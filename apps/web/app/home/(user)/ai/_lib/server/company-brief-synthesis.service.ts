import "server-only";

import {
	type ChatCompletionOptions,
	type ChatMessage,
	ConfigManager,
	createOpenAIOnlyConfig,
	getChatCompletion,
} from "@kit/ai-gateway";
import { getLogger } from "@kit/shared/logger";

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
- Employee Growth: ${input.apolloData.employeeGrowth ? `${input.apolloData.employeeGrowth}%` : "N/A"}
- Funding Stage: ${input.apolloData.fundingStage ?? "N/A"}
- Total Funding: ${input.apolloData.fundingTotal ? `$${input.apolloData.fundingTotal.toLocaleString()}` : "N/A"}
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

	const systemPrompt = `You are an expert business analyst specializing in presentation strategy. Given research data about a company, generate a structured Company Brief that helps a presenter understand the organizational context.

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
  }
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

	const messages = buildCompanyBriefPrompt(input);

	const config = createOpenAIOnlyConfig({
		userId,
		context: "company-brief-synthesis",
	});
	const normalizedConfig = ConfigManager.normalizeConfig(config);

	if (!normalizedConfig) {
		throw new Error("Failed to normalize AI config");
	}

	const response = await withTimeout(
		getChatCompletion(messages, {
			config: normalizedConfig,
			userId,
			feature: "workflow-company-research",
		} as ChatCompletionOptions),
		30_000,
		"Company brief synthesis",
	);

	const jsonMatch = response.content.match(/\{[\s\S]*\}/);
	if (!jsonMatch) {
		logger.error(ctx, "No JSON found in AI response for company brief");
		throw new Error("No JSON found in AI response");
	}

	const brief = JSON.parse(jsonMatch[0]) as CompanyBrief;

	logger.info(
		ctx,
		"Company brief synthesized — archetype: %s",
		brief.currentSituation?.archetype,
	);

	return brief;
}
