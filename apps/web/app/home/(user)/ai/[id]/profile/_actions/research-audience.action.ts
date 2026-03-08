"use server";

import { type ChatMessage, getChatCompletion } from "@kit/ai-gateway";
import { enhanceAction } from "@kit/next/actions";
import { getLogger } from "@kit/shared/logger";
import { getSupabaseServerClient } from "@kit/supabase/server-client";
import { z } from "zod";

import type { Database } from "~/lib/database.types";
import { getFinancialSnapshot } from "../../../_lib/server/alpha-vantage.service";
import {
	type ApolloEnrichmentResult,
	enrichCompany,
	extractDomain,
} from "../../../_lib/server/apollo-enrichment.service";
import {
	createAudienceProfile,
	getProfileByPresentationId,
	updateAudienceProfile,
} from "../../../_lib/server/audience-profiles.service";
import {
	type CompanyBrief,
	type CompanyResearchInput,
	synthesizeCompanyBrief,
} from "../../../_lib/server/company-brief-synthesis.service";
import { researchCompany } from "../../../_lib/server/company-research.service";
import { scrapeWebsiteDeep } from "../../../_lib/server/website-deep-scrape.service";
import {
	getCompanyDetails,
	getPersonProfile,
	type NetrowsEnrichmentResult,
	researchPerson,
	searchCompany,
	searchPersonFuzzy,
} from "../../../_lib/server/netrows.service";
import { resolveCompanyTicker } from "../../../_lib/server/ticker-resolution.service";
<<<<<<< HEAD
import { scrapeWebsiteDeep } from "../../../_lib/server/website-deep-scrape.service";
=======
import { getFinancialSnapshot } from "../../../_lib/server/alpha-vantage.service";
>>>>>>> origin/staging

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const SearchAudienceSchema = z.object({
	personName: z.string().min(1, "Person name is required"),
	company: z.string().min(1, "Company is required"),
	context: z.string().optional(),
});

const ResearchAudienceSchema = z.object({
	presentationId: z.string().min(1),
	personName: z.string().min(1, "Person name is required"),
	company: z.string().min(1, "Company is required"),
	context: z.string().optional(),
	selectedLinkedinUrl: z.string().optional(),
});

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
// Brief generation prompt
// ---------------------------------------------------------------------------

function buildBriefPrompt(
	enrichment: NetrowsEnrichmentResult,
	personName: string,
	company: string,
	context?: string,
	companyBrief?: CompanyBrief | null,
): ChatMessage[] {
	const { personProfile, companyDetails } = enrichment;

	const personSection = personProfile
		? `
## Person: ${personProfile.firstName} ${personProfile.lastName}
- Headline: ${personProfile.headline}
- Summary: ${personProfile.summary || "N/A"}
- Location: ${personProfile.geo?.city}, ${personProfile.geo?.country}
- Education: ${personProfile.educations?.map((e) => `${e.schoolName} (${e.degree || e.fieldOfStudy || ""})`).join("; ") || "N/A"}
- Experience: ${
				personProfile.positions
					?.slice(0, 5)
					.map((p) => `${p.title} at ${p.companyName}`)
					.join("; ") || "N/A"
			}
- Top Voice: ${personProfile.isTopVoice ? "Yes" : "No"}
- Creator: ${personProfile.isCreator ? "Yes" : "No"}`
		: `## Person: ${personName}\nNo LinkedIn profile data available.`;

	const companySection = companyDetails
		? `
## Company: ${companyDetails.name}
- Description: ${companyDetails.description?.substring(0, 500) || "N/A"}
- Industry: ${companyDetails.industries?.join(", ") || "N/A"}
- Specialities: ${companyDetails.specialities?.slice(0, 10).join(", ") || "N/A"}
- Staff Count: ${companyDetails.staffCount || "N/A"}
- HQ: ${companyDetails.headquarter?.city}, ${companyDetails.headquarter?.country}
- Website: ${companyDetails.website || "N/A"}`
		: `## Company: ${company}\nNo company data available.`;

	const companyBriefSection = companyBrief
		? `
## Company Brief (Deep Research)
- Situation: ${companyBrief.currentSituation.summary}
- Archetype: ${companyBrief.currentSituation.archetype}
- Strategic Focus: ${companyBrief.currentSituation.strategicFocus}
- Challenges: ${companyBrief.currentSituation.challenges.join("; ")}
- Recent News: ${companyBrief.currentSituation.recentNews.slice(0, 3).join("; ")}
- Industry Trends: ${companyBrief.industryContext.trends.slice(0, 3).join("; ")}
- Competitors: ${companyBrief.industryContext.competitors.slice(0, 5).join(", ")}
- Framing Advice: ${companyBrief.presentationImplications.framingAdvice}
- Topics to Acknowledge: ${companyBrief.presentationImplications.topicsToAcknowledge.join("; ")}
- Avoid: ${companyBrief.presentationImplications.avoidTopics.join("; ")}`
		: "";

	const contextSection = context ? `\n## Additional Context\n${context}` : "";

	const systemPrompt = `You are an expert presentation strategist. Given research data about a person and their company, generate a structured Audience Brief that helps craft a targeted presentation.

Output valid JSON matching this exact schema:
{
  "communicationProfile": {
    "decisionMakingStyle": "string — how they make decisions (data-driven, intuition-led, consensus-based, etc.)",
    "attentionSpan": "string — their likely attention span and schedule constraints",
    "whatTheyTrust": "string — what kinds of evidence and arguments resonate with them",
    "careerContext": "string — relevant career background that shapes how they think"
  },
  "strategicRecommendations": {
    "leadWith": "string — what to lead the presentation with",
    "frameAs": "string — how to frame the overall narrative",
    "avoid": "string — what to avoid saying or doing",
    "include": "string — specific elements to include"
  },
  "presentationFormat": {
    "structure": "string — recommended presentation structure",
    "executiveSummary": "string — where to place the exec summary",
    "dataDensity": "string — low, medium, or high",
    "tone": "string — formal, conversational, technical, etc.",
    "frameworksTheyRecognize": "string — frameworks or methodologies they'd know",
    "lengthRecommendation": "string — recommended number of slides"
  },
  "briefSummary": "string — 2-3 sentence summary of the key insight about this audience"
}

Be specific and actionable. Draw inferences from their background, industry, and seniority. If data is sparse, make reasonable inferences and note them.`;

	const userPrompt = `Generate an Audience Brief for the following person:

${personSection}
${companySection}
${companyBriefSection}
${contextSection}

Respond with ONLY the JSON object, no markdown fences.`;

	return [
		{ role: "system" as const, content: systemPrompt },
		{ role: "user" as const, content: userPrompt },
	];
}

// ---------------------------------------------------------------------------
// Search Action (returns candidates for user selection)
// ---------------------------------------------------------------------------

export const searchAudienceAction = enhanceAction(
	async (data, user) => {
		const [personSettled, companySettled] = await Promise.allSettled([
			searchPersonFuzzy(data.personName, data.company, user.id, data.context),
			searchCompany(data.company),
		]);

		const personResults =
			personSettled.status === "fulfilled" ? (personSettled.value ?? []) : [];
		const companyResults =
			companySettled.status === "fulfilled" ? (companySettled.value ?? []) : [];

		return {
			success: true as const,
			personResults,
			companyResults,
		};
	},
	{
		schema: SearchAudienceSchema,
		auth: true,
	},
);

// ---------------------------------------------------------------------------
// Research Action (generates brief for selected person)
// ---------------------------------------------------------------------------

export const researchAudienceAction = enhanceAction(
	async (data, user) => {
		const client = getSupabaseServerClient<Database>();
		const logger = await getLogger();
		const ctx = {
			name: "researchAudienceAction",
			presentationId: data.presentationId,
		};

		// Verify presentation ownership
		const { data: presentation, error: presentationError } = await client
			.from("presentations")
			.select("id, completed_steps")
			.eq("id", data.presentationId)
			.eq("user_id", user.id)
			.maybeSingle();

		if (presentationError) {
			logger.error(ctx, "Failed to load presentation: %o", presentationError);
			throw presentationError;
		}

		if (!presentation) {
			throw new Error("Presentation not found");
		}

		// Step 1: Research via Netrows
		// If a selectedLinkedinUrl was provided (user picked from search results),
		// skip search and go directly to profile fetch
		logger.info(
			ctx,
			"Starting Netrows research for %s at %s (selectedUrl: %s)",
			data.personName,
			data.company,
			data.selectedLinkedinUrl ?? "none",
		);

		let enrichment: NetrowsEnrichmentResult;
		let companyDetailsDeferred: Promise<
			NetrowsEnrichmentResult["companyDetails"]
		> = Promise.resolve(null);

		try {
			if (data.selectedLinkedinUrl) {
				// User selected a specific person — fetch their profile directly
				const [personProfile, companySearchResults] = await Promise.all([
					getPersonProfile(data.selectedLinkedinUrl),
					searchCompany(data.company),
				]);

				// Start company details fetch non-blocking — will be awaited
				// in the parallel Promise.all alongside Apollo/ticker/web research
				if (companySearchResults && companySearchResults.length > 0) {
					const firstCompany = companySearchResults[0];
					if (firstCompany?.linkedinURL) {
						companyDetailsDeferred = getCompanyDetails(
							firstCompany.linkedinURL,
						);
					}
				}

				enrichment = {
					personSearchResults: null,
					personProfile,
					companySearchResults,
					companyDetails: null, // filled after companyDetailsDeferred resolves
				};
			} else {
				// No selection — use original full search flow
				enrichment = await researchPerson(data.personName, data.company);
			}
		} catch (err) {
			logger.error(ctx, "Netrows research failed: %o", err);
			// Return partial result — allow user to proceed with manual entry
			enrichment = {
				personSearchResults: null,
				personProfile: null,
				companySearchResults: null,
				companyDetails: null,
			};
		}

		// Resolve deferred company details (runs concurrently with person profile fetch)
		try {
			const deferredDetails = await companyDetailsDeferred;
			if (deferredDetails) {
				enrichment.companyDetails = deferredDetails;
			}
		} catch (detailsErr) {
			logger.warn(
				ctx,
				"Company details fetch failed (non-blocking): %o",
				detailsErr,
			);
		}

		// Step 1.5: Start Apollo company enrichment (non-blocking, runs parallel with Step 2)
		const companyDomain = enrichment.companyDetails?.website
			? extractDomain(enrichment.companyDetails.website)
			: null;

		let apolloEnrichment: ApolloEnrichmentResult | null = null;
		const apolloPromise: Promise<ApolloEnrichmentResult | null> = companyDomain
			? (async () => {
					logger.info(ctx, "Enriching company via Apollo: %s", companyDomain);
					return enrichCompany(companyDomain);
				})()
			: Promise.resolve(null);

		// Step 1.6: Ticker resolution (non-blocking)
		// Resolve company name to ticker for financial data enrichment
		let tickerResolution: {
			ticker: string;
			cik: string;
			confidence: number;
		} | null = null;
		const tickerPromise: Promise<{
			ticker: string;
			cik: string;
			confidence: number;
		} | null> = (async () => {
			try {
				logger.info(ctx, "Resolving ticker for: %s", data.company);
				const resolution = await resolveCompanyTicker(
					client,
					data.company,
					user.id,
				);
				if (resolution) {
					logger.info(
						ctx,
						"Ticker resolved: %s (CIK: %s, confidence: %s)",
						resolution.ticker,
						resolution.cik,
						resolution.confidence,
					);
				}
				return resolution;
			} catch (tickerErr) {
				logger.warn(
					ctx,
					"Ticker resolution failed (non-blocking): %o",
					tickerErr,
				);
				return null;
			}
		})();

		// Step 2: Company web research + brief synthesis (parallel with step 1)
		// Uses Brave Search API + LLM to build a structured CompanyBrief
		let companyBrief: CompanyBrief | null = null;
		let companyBriefPromise: Promise<CompanyBrief | null> =
			Promise.resolve(null);

		try {
			// Check for a cached (non-expired) company brief first
			// company_briefs table exists via migration but isn't in generated
			// Database types yet — use untyped client for this table.
			// biome-ignore lint/suspicious/noExplicitAny: company_briefs not in generated types
			const untypedClient = client as any;
			const { data: cachedBrief } = await untypedClient
				.from("company_briefs")
				.select("brief_structured, expires_at")
				.ilike("company_name", data.company)
				.gt("expires_at", new Date().toISOString())
				.order("created_at", { ascending: false })
				.limit(1)
				.maybeSingle();

			if (cachedBrief?.brief_structured) {
				companyBrief = cachedBrief.brief_structured as CompanyBrief;
				logger.info(ctx, "Using cached company brief for %s", data.company);
			} else {
				// Run web research
				const industry =
					enrichment.companyDetails?.industries?.[0] ?? undefined;
				const domain =
					enrichment.companyDetails?.website
						?.replace(/^https?:\/\//, "")
						.replace(/\/.*$/, "") ?? undefined;

				// Start independent promises early - they run in parallel with ticker resolution
				const websiteDeepScrapePromise = domain
					? withTimeout(
							scrapeWebsiteDeep(domain),
							15_000,
							"Website deep scrape",
						)
					: Promise.resolve(null);

				// Start web research early (independent of ticker)
				const webResearchPromise = withTimeout(
					researchCompany(data.company, industry, domain),
					15_000,
					"Company web research",
				);

				// Await ticker resolution first (needed for Alpha Vantage)
				const tickerResult = await tickerPromise.catch((tickerErr) => {
					logger.warn(
						ctx,
						"Ticker resolution failed (non-blocking): %o",
						tickerErr,
					);
					return null;
				});
				tickerResolution = tickerResult;

				// Create Alpha Vantage promise (only if we have a ticker)
				const alphaVantagePromise = tickerResolution
					? (async () => {
							try {
								logger.info(
									ctx,
									"Fetching Alpha Vantage data for: %s",
									tickerResolution?.ticker,
								);
								const result = tickerResolution?.ticker
									? await getFinancialSnapshot(tickerResolution.ticker)
									: null;
								if (result?.success && result.data) {
									logger.info(
										ctx,
										"Alpha Vantage success: revenue=%s, peRatio=%s",
										result.data.revenue,
										result.data.peRatio,
									);
								}
								return result;
							} catch (avErr) {
								logger.warn(
									ctx,
									"Alpha Vantage enrichment failed (non-blocking): %o",
									avErr,
								);
								return null;
							}
						})()
					: Promise.resolve(null);

				const [
					webResearch,
					apolloResult,
					websiteDeepScrape,
					alphaVantageResult,
				] = await Promise.all([
					webResearchPromise,
					apolloPromise.catch((apolloErr) => {
						logger.warn(
							ctx,
							"Apollo enrichment failed (non-blocking): %o",
							apolloErr,
						);
						return null;
					}),
					websiteDeepScrapePromise.catch((deepScrapeErr) => {
						logger.warn(
							ctx,
							"Website deep scrape failed (non-blocking): %o",
							deepScrapeErr,
						);
						return null;
					}),
					alphaVantagePromise.catch((avErr) => {
						logger.warn(
							ctx,
							"Alpha Vantage enrichment failed (non-blocking): %o",
							avErr,
						);
						return null;
					}),
				]);

				apolloEnrichment = apolloResult;
				if (apolloEnrichment?.success && apolloEnrichment.organization) {
					logger.info(
						ctx,
						"Apollo enrichment success: revenue=%s, employees=%s",
						apolloEnrichment.organization.annual_revenue_printed,
						apolloEnrichment.organization.employee_count_range,
					);
				}

				// Synthesize into CompanyBrief via LLM
				const synthesisInput: CompanyResearchInput = {
					companyName: data.company,
					industry,
					apolloData: apolloEnrichment?.organization
						? {
								estimatedRevenue:
									apolloEnrichment.organization.annual_revenue_printed ??
									apolloEnrichment.organization.estimated_revenue_range ??
									undefined,
								employeeCount:
									apolloEnrichment.organization.employee_count_range ??
									undefined,
								employeeGrowth:
									apolloEnrichment.organization.employee_growth_rate ??
									undefined,
								fundingStage:
									apolloEnrichment.organization.funding_stage ?? undefined,
								fundingTotal:
									apolloEnrichment.organization.total_funding ?? undefined,
								techStack:
									apolloEnrichment.organization.technology_names ?? undefined,
								keyIndustries:
									apolloEnrichment.organization.industries ?? undefined,
								keyExecutives:
									apolloEnrichment.organization.people
										?.slice(0, 5)
										.map((p: { name: string; title: string }) => ({
											name: p.name,
											title: p.title,
										}))
										.filter(
											(p: { name: string; title: string }) => p.name && p.title,
										) ?? undefined,
							}
						: undefined,
					netrowsData: enrichment.companyDetails
						? {
								description: enrichment.companyDetails.description ?? undefined,
								industries: enrichment.companyDetails.industries ?? undefined,
								specialities:
									enrichment.companyDetails.specialities ?? undefined,
								staffCount: enrichment.companyDetails.staffCount ?? undefined,
								website: enrichment.companyDetails.website ?? undefined,
								headquarter: enrichment.companyDetails.headquarter ?? undefined,
								founded: enrichment.companyDetails.founded ?? null,
							}
						: undefined,
					newsResults: webResearch.newsResults,
					industryResults: webResearch.industryResults,
					websiteContent: webResearch.websiteContent,
					websiteDeepScrape: websiteDeepScrape
						? {
								aboutContent: websiteDeepScrape.pages.about,
								newsroomContent: websiteDeepScrape.pages.newsroom,
								careersContent: websiteDeepScrape.pages.careers,
								blogContent: websiteDeepScrape.pages.blog,
								investorsContent: websiteDeepScrape.pages.investors,
								jobPostings: websiteDeepScrape.jobPostings,
								recentPressReleases: websiteDeepScrape.recentPressReleases,
							}
						: undefined,
					alphaVantageData:
						alphaVantageResult?.success && alphaVantageResult?.data
							? {
									revenue: alphaVantageResult.data.revenue,
									grossMargin: alphaVantageResult.data.grossMargin,
									operatingMargin: alphaVantageResult.data.operatingMargin,
									profitMargin: alphaVantageResult.data.profitMargin,
									stockPrice: alphaVantageResult.data.stockPrice,
									week52High: alphaVantageResult.data.week52High,
									week52Low: alphaVantageResult.data.week52Low,
									marketCap: alphaVantageResult.data.marketCap,
									ebitda: alphaVantageResult.data.ebitda,
									eps: alphaVantageResult.data.eps,
									dividendYield: alphaVantageResult.data.dividendYield,
									movingAvg50: alphaVantageResult.data.movingAvg50,
									movingAvg200: alphaVantageResult.data.movingAvg200,
									fiscalYearEnd: alphaVantageResult.data.fiscalYearEnd,
									analystConsensus: alphaVantageResult.data.analystConsensus,
									analystBuyCount: alphaVantageResult.data.analystBuyCount,
									analystHoldCount: alphaVantageResult.data.analystHoldCount,
									analystSellCount: alphaVantageResult.data.analystSellCount,
									peRatio: alphaVantageResult.data.peRatio,
									industryAvgPeRatio:
										alphaVantageResult.data.industryAvgPeRatio,
									beta: alphaVantageResult.data.beta,
								}
							: undefined,
				};

				// Fire company brief synthesis as a non-blocking promise (35s timeout)
				companyBriefPromise = withTimeout(
					synthesizeCompanyBrief(synthesisInput, user.id),
					120_000,
					"Company brief synthesis",
				).then(async (brief) => {
					// Cache on success
					await untypedClient.from("company_briefs").insert({
						company_name: data.company,
						company_domain: domain ?? null,
						netrows_data: enrichment.companyDetails ?? null,
						web_research: webResearch as unknown as Record<string, unknown>,
						brief_structured: brief as unknown as Record<string, unknown>,
						created_by: user.id,
					});
					logger.info(
						ctx,
						"Company brief synthesized and cached — archetype: %s",
						brief.currentSituation?.archetype,
					);
					return brief;
				});
			}
		} catch (companyErr) {
			const compErrMsg =
				companyErr instanceof Error ? companyErr.message : String(companyErr);
			logger.warn(
				ctx,
				"Company brief research failed (non-blocking): %s",
				compErrMsg,
			);
		}

		// Step 3: Generate audience brief via LLM (fast path, parallel with company brief)
		// Use the fastest available model: haiku > fast > research.
		// Audience brief is structured JSON extraction — doesn't need heavy reasoning.
		const audienceBriefModel =
			process.env.BIFROST_MODEL_WORKFLOW_RESEARCH_HAIKU ??
			process.env.BIFROST_MODEL_WORKFLOW_RESEARCH_FAST ??
			process.env.BIFROST_MODEL_WORKFLOW_RESEARCH;
		const audienceBriefVK =
			process.env.BIFROST_VK_WORKFLOW_RESEARCH_HAIKU ??
			process.env.BIFROST_VK_WORKFLOW_RESEARCH_FAST ??
			process.env.BIFROST_VK_WORKFLOW_RESEARCH;

		logger.info(
			ctx,
			"Generating audience brief (model=%s, parallel with company brief)",
			audienceBriefModel,
		);

		const messages = buildBriefPrompt(
			enrichment,
			data.personName,
			data.company,
			data.context,
			// Use cached company brief if available, otherwise null (company brief synthesis is still running)
			companyBrief,
		);

		let briefStructured: Record<string, unknown> = {};
		let briefText = "";

<<<<<<< HEAD
		// Run audience brief generation and company brief synthesis in parallel
		const audienceBriefPromise = (async () => {
			try {
				const briefAbort = new AbortController();
				const briefTimeoutId = setTimeout(
					() => briefAbort.abort("AI brief generation timed out after 45s"),
					45_000,
				);

				const response = await withTimeout(
					getChatCompletion(messages, {
						model: audienceBriefModel,
						virtualKey: audienceBriefVK,
						userId: user.id,
						feature: "workflow-audience-research",
						timeout: 45_000,
						signal: briefAbort.signal,
					}),
					45_000,
					"AI brief generation",
				);

				clearTimeout(briefTimeoutId);

				const jsonMatch = response.content.match(/\{[\s\S]*\}/);
				if (!jsonMatch) {
					throw new Error("No JSON found in AI response");
				}
				const parsed = JSON.parse(jsonMatch[0]);
				return {
					briefStructured: parsed as Record<string, unknown>,
					briefText: (parsed.briefSummary as string) ?? "",
				};
			} catch (aiError) {
				const errMsg =
					aiError instanceof Error ? aiError.message : String(aiError);
				logger.error(ctx, "AI brief generation failed: %s", errMsg);
				logger.error(ctx, "AI brief error details: %o", {
					name: aiError instanceof Error ? aiError.name : "unknown",
					message: errMsg,
					stack: (aiError instanceof Error ? aiError.stack : "")?.substring(
						0,
						500,
					),
					virtualKey: audienceBriefVK ? "SET" : "NOT_SET",
					model: audienceBriefModel,
					bifrostUrl:
						process.env.BIFROST_GATEWAY_URL ||
						process.env.BIFROST_BASE_URL ||
						"DEFAULT",
				});
				return {
					briefStructured: {} as Record<string, unknown>,
					briefText: enrichment.personProfile
						? `${enrichment.personProfile.headline ?? ""} — ${enrichment.personProfile.summary?.substring(0, 200) ?? ""}`
						: "",
				};
			}
		})();

		// Await only the audience brief — don't block on company brief.
		// Company brief saves asynchronously; the client polls via pollCompanyBriefAction.
		const audienceBriefResult = await audienceBriefPromise;

		briefStructured = audienceBriefResult.briefStructured;
		briefText = audienceBriefResult.briefText;
=======
		try {
			const briefAbort = new AbortController();
			const briefTimeoutId = setTimeout(
				() => briefAbort.abort("AI brief generation timed out after 90s"),
				90_000,
			);

			const response = await withTimeout(
				getChatCompletion(messages, {
					model: process.env.BIFROST_MODEL_WORKFLOW_RESEARCH,
					virtualKey: process.env.BIFROST_VK_WORKFLOW_RESEARCH,
					userId: user.id,
					feature: "workflow-audience-research",
					timeout: 90_000,
					signal: briefAbort.signal,
				}),
				90_000,
				"AI brief generation",
			);

			clearTimeout(briefTimeoutId);

			const jsonMatch = response.content.match(/\{[\s\S]*\}/);
			if (!jsonMatch) {
				throw new Error("No JSON found in AI response");
			}
			briefStructured = JSON.parse(jsonMatch[0]);
			briefText = (briefStructured.briefSummary as string) ?? "";
		} catch (aiError) {
			const errMsg =
				aiError instanceof Error ? aiError.message : String(aiError);
			logger.error(ctx, "AI brief generation failed: %s", errMsg);
			logger.error(ctx, "AI brief error details: %o", {
				name: aiError instanceof Error ? aiError.name : "unknown",
				message: errMsg,
				stack: (aiError instanceof Error ? aiError.stack : "")?.substring(
					0,
					500,
				),
				virtualKey: process.env.BIFROST_VK_WORKFLOW_RESEARCH
					? "SET"
					: "NOT_SET",
				bifrostUrl:
					process.env.BIFROST_GATEWAY_URL ||
					process.env.BIFROST_BASE_URL ||
					"DEFAULT",
			});
			// Still save enrichment data — user can regenerate the brief later
			briefText = enrichment.personProfile
				? `${enrichment.personProfile.headline ?? ""} — ${enrichment.personProfile.summary?.substring(0, 200) ?? ""}`
				: "";
		}
>>>>>>> origin/staging

		// Ensure Apollo promise is settled (may already be awaited in synthesis path)
		if (!apolloEnrichment) {
			try {
				apolloEnrichment = await withTimeout(
					apolloPromise,
					15_000,
					"Apollo enrichment (final await)",
				);
			} catch (apolloErr) {
				logger.warn(
					ctx,
					"Apollo enrichment failed (non-blocking): %o",
					apolloErr,
				);
			}
		}

		// Step 4: Save to audience_profiles (without company brief — it arrives async)
		// Only store allowed non-PII fields from Apollo enrichment
		const sanitizedApolloData = apolloEnrichment?.organization
			? {
					configured: apolloEnrichment.configured,
					success: apolloEnrichment.success,
					organization: {
						revenueRange: apolloEnrichment.organization.estimated_revenue_range,
						employeeRange: apolloEnrichment.organization.employee_count_range,
						fundingStage: apolloEnrichment.organization.funding_stage,
						techStack: apolloEnrichment.organization.technology_names,
						// Only store names and titles, omit emails/phones/PII
						keyExecutives:
							apolloEnrichment.organization.people
								?.slice(0, 5)
								.map((p) => ({
									name: p.name,
									title: p.title,
								}))
								.filter((p) => p.name && p.title) ?? [],
					},
				}
			: null;

		const enrichmentData = {
			netrows: {
				personProfile: enrichment.personProfile,
				companyDetails: enrichment.companyDetails,
				personSearchResults: enrichment.personSearchResults,
				companySearchResults: enrichment.companySearchResults,
			},
			apollo: sanitizedApolloData,
			companyBrief: companyBrief ?? null,
			researchedAt: new Date().toISOString(),
		};

		const existing = await getProfileByPresentationId(
			client,
			data.presentationId,
		);

		const profile = existing
			? await updateAudienceProfile(client, existing.id, {
					personName: data.personName,
					company: data.company,
					enrichmentData,
					briefText,
					briefStructured,
				})
			: await createAudienceProfile(client, {
					userId: user.id,
					accountId: user.id,
					presentationId: data.presentationId,
					personName: data.personName,
					company: data.company,
					enrichmentData,
					briefText,
					briefStructured,
				});

		// Update presentation completed_steps
		const completedSteps = Array.isArray(presentation.completed_steps)
			? [...presentation.completed_steps]
			: [];

		if (!completedSteps.includes("profile")) {
			completedSteps.push("profile");
		}

		await client
			.from("presentations")
			.update({
				audience_profile_id: profile.id,
				current_step: "assemble",
				completed_steps: completedSteps,
				updated_at: new Date().toISOString(),
			})
			.eq("id", data.presentationId);

		logger.info(
			ctx,
			"Audience research complete, profile %s saved",
			profile.id,
		);

		// Fire-and-forget: company brief saves to profile when it completes.
		// The client polls via pollCompanyBriefAction to pick it up.
		companyBriefPromise
			.then(async (brief) => {
				if (!brief) return;
				try {
					const currentProfile = await getProfileByPresentationId(
						client,
						data.presentationId,
					);
					if (!currentProfile) return;

					const currentEnrichment =
						(currentProfile.enrichment_data as Record<string, unknown>) ?? {};
					await updateAudienceProfile(client, currentProfile.id, {
						enrichmentData: {
							...currentEnrichment,
							companyBrief: brief,
						},
					});
					logger.info(
						ctx,
						"Company brief async update saved to profile %s",
						currentProfile.id,
					);
				} catch (updateErr) {
					logger.warn(
						ctx,
						"Failed to async-save company brief to profile: %o",
						updateErr,
					);
				}
			})
			.catch((compBriefErr: unknown) => {
				const errMsg =
					compBriefErr instanceof Error
						? compBriefErr.message
						: String(compBriefErr);
				logger.warn(
					ctx,
					"Company brief synthesis failed (non-blocking): %s",
					errMsg,
				);
			});

		return {
			success: true,
			profile,
			hasPersonData: !!enrichment.personProfile,
			hasCompanyData: !!enrichment.companyDetails,
			hasCompanyBrief: !!companyBrief,
		};
	},
	{
		schema: ResearchAudienceSchema,
		auth: true,
	},
);

// ---------------------------------------------------------------------------
// Poll Action — lightweight check for background company brief
// ---------------------------------------------------------------------------

const PollCompanyBriefSchema = z.object({
	presentationId: z.string().min(1),
});

/**
 * Returns the company brief from the audience profile if the background
 * synthesis has completed. Called by the client on a short poll interval.
 */
export const pollCompanyBriefAction = enhanceAction(
	async (data) => {
		const client = getSupabaseServerClient<Database>();
		const profile = await getProfileByPresentationId(
			client,
			data.presentationId,
		);

		if (!profile) {
			return { ready: false as const };
		}

		const enrichment = profile.enrichment_data as Record<
			string,
			unknown
		> | null;
		const brief = enrichment?.companyBrief as Record<string, unknown> | null;

		if (!brief) {
			return { ready: false as const };
		}

		return { ready: true as const, companyBrief: brief };
	},
	{
		schema: PollCompanyBriefSchema,
		auth: true,
	},
);
