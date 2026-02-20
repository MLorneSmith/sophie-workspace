"use server";

import {
	ConfigManager,
	type ChatCompletionOptions,
	type ChatMessage,
	createOpenAIOnlyConfig,
	getChatCompletion,
} from "@kit/ai-gateway";
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
	type NetrowsEnrichmentResult,
	researchPerson,
} from "../../../_lib/server/netrows.service";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const ResearchAudienceSchema = z.object({
	presentationId: z.string().min(1),
	personName: z.string().min(1, "Person name is required"),
	company: z.string().min(1, "Company is required"),
	context: z.string().optional(),
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
${contextSection}

Respond with ONLY the JSON object, no markdown fences.`;

	return [
		{ role: "system" as const, content: systemPrompt },
		{ role: "user" as const, content: userPrompt },
	];
}

// ---------------------------------------------------------------------------
// Action
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
		logger.info(
			ctx,
			"Starting Netrows research for %s at %s",
			data.personName,
			data.company,
		);

		let enrichment: NetrowsEnrichmentResult;
		try {
			enrichment = await researchPerson(data.personName, data.company);
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

		// Step 2: Generate Audience Brief via AI
		logger.info(ctx, "Generating Audience Brief via AI");

		const messages = buildBriefPrompt(
			enrichment,
			data.personName,
			data.company,
			data.context,
		);

		const config = createOpenAIOnlyConfig({
			userId: user.id,
			context: "audience-brief-generation",
		});
		const normalizedConfig = ConfigManager.normalizeConfig(config);

		if (!normalizedConfig) {
			throw new Error("Failed to normalize AI config");
		}

		let briefStructured: Record<string, unknown> = {};
		let briefText = "";

		try {
			const response = await withTimeout(
				getChatCompletion(messages, {
					config: normalizedConfig,
					userId: user.id,
					feature: "workflow-audience-research",
				} as ChatCompletionOptions),
				30_000,
				"AI brief generation",
			);

			const jsonMatch = response.content.match(/\{[\s\S]*\}/);
			if (!jsonMatch) {
				throw new Error("No JSON found in AI response");
			}
			briefStructured = JSON.parse(jsonMatch[0]);
			briefText = (briefStructured.briefSummary as string) ?? "";
		} catch (aiError) {
			logger.error(ctx, "AI brief generation failed: %o", aiError);
			// Still save enrichment data — user can regenerate the brief later
			briefText = enrichment.personProfile
				? `${enrichment.personProfile.headline ?? ""} — ${enrichment.personProfile.summary?.substring(0, 200) ?? ""}`
				: "";
		}

		// Step 3: Save to audience_profiles
		const enrichmentData = {
			netrows: {
				personProfile: enrichment.personProfile,
				companyDetails: enrichment.companyDetails,
				personSearchResults: enrichment.personSearchResults,
				companySearchResults: enrichment.companySearchResults,
			},
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
		};
	},
	{
		schema: ResearchAudienceSchema,
		auth: true,
	},
);
