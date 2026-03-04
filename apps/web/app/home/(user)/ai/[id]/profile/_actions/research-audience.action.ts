"use server";

import { type ChatMessage, getChatCompletion } from "@kit/ai-gateway";
import { enhanceAction } from "@kit/next/actions";
import { getLogger } from "@kit/shared/logger";
import { getSupabaseServerClient } from "@kit/supabase/server-client";
import { z } from "zod";

import type { Database } from "~/lib/database.types";

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
	enrichCompany,
	extractDomain,
	type ApolloEnrichmentResult,
} from "../../../_lib/server/apollo-enrichment.service";
import {
	getCompanyDetails,
	getPersonProfile,
	type NetrowsEnrichmentResult,
	researchPerson,
	searchCompany,
	searchPersonFuzzy,
} from "../../../_lib/server/netrows.service";

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
		try {
			if (data.selectedLinkedinUrl) {
				// User selected a specific person — fetch their profile directly
				const [personProfile, companySearchResults] = await Promise.all([
					getPersonProfile(data.selectedLinkedinUrl),
					searchCompany(data.company),
				]);

				let companyDetailsResult = null;
				if (companySearchResults && companySearchResults.length > 0) {
					const firstCompany = companySearchResults[0];
					if (firstCompany?.linkedinURL) {
						companyDetailsResult = await getCompanyDetails(
							firstCompany.linkedinURL,
						);
					}
				}

				enrichment = {
					personSearchResults: null,
					personProfile,
					companySearchResults,
					companyDetails: companyDetailsResult,
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

		// Step 2: Company web research + brief synthesis (parallel with step 1)
		// Uses Brave Search API + LLM to build a structured CompanyBrief
		let companyBrief: CompanyBrief | null = null;

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

				// Run web research, Apollo enrichment, and website deep scrape in parallel
				const websiteDeepScrapePromise = domain
					? withTimeout(
							scrapeWebsiteDeep(domain),
							15_000,
							"Website deep scrape",
						)
					: Promise.resolve(null);

				const [webResearch, apolloResult, websiteDeepScrape] =
					await Promise.all([
						withTimeout(
							researchCompany(data.company, industry, domain),
							15_000,
							"Company web research",
						),
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
				};

				companyBrief = await withTimeout(
					synthesizeCompanyBrief(synthesisInput, user.id),
					120_000,
					"Company brief synthesis",
				);

				// Cache the company brief
				await untypedClient.from("company_briefs").insert({
					company_name: data.company,
					company_domain: domain ?? null,
					netrows_data: enrichment.companyDetails ?? null,
					web_research: webResearch as unknown as Record<string, unknown>,
					brief_structured: companyBrief as unknown as Record<string, unknown>,
					created_by: user.id,
				});

				logger.info(
					ctx,
					"Company brief synthesized and cached — archetype: %s",
					companyBrief.currentSituation?.archetype,
				);
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

		// Step 3: Generate Audience Brief via AI (now with company brief context)
		logger.info(ctx, "Generating Audience Brief via AI");

		const messages = buildBriefPrompt(
			enrichment,
			data.personName,
			data.company,
			data.context,
			companyBrief,
		);

		let briefStructured: Record<string, unknown> = {};
		let briefText = "";

		try {
			const response = await withTimeout(
				getChatCompletion(messages, {
					model: process.env.BIFROST_MODEL_WORKFLOW_RESEARCH,
					virtualKey: process.env.BIFROST_VK_WORKFLOW_RESEARCH,
					userId: user.id,
					feature: "workflow-audience-research",
				}),
				90_000,
				"AI brief generation",
			);

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

		// Ensure Apollo promise is settled (may already be awaited in synthesis path)
		if (!apolloEnrichment) {
			try {
				apolloEnrichment = await apolloPromise;
			} catch (apolloErr) {
				logger.warn(
					ctx,
					"Apollo enrichment failed (non-blocking): %o",
					apolloErr,
				);
			}
		}

		// Step 4: Save to audience_profiles
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
