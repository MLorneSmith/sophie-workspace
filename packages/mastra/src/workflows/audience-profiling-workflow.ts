import { randomUUID } from "node:crypto";

import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";

import { researchAgent } from "../agents/research-agent";
import { getModelForAgent } from "../config/model-routing";
import {
	finalizeRunTrace,
	recordModelUsageSpan,
} from "../config/spike-tracing";
import {
	AudienceBriefSchema,
	type AudienceBrief,
} from "../schemas/presentation-artifacts";

const PERSON_RESEARCH_OUTPUT_SCHEMA = z.object({
	personName: z.string().min(1),
	company: z.string().min(1),
	linkedinSignals: z.array(z.string()),
	companySignals: z.array(z.string()),
	notes: z.string(),
});

const AUDIENCE_PROFILING_INPUT_SCHEMA = z.object({
	presentationId: z.string().min(1),
	personName: z.string().min(1),
	company: z.string().min(1),
	title: z.string().min(1).nullable().optional(),
	linkedinUrl: z.string().url().nullable().optional(),
});

const AUDIENCE_PROFILING_OUTPUT_SCHEMA = z.object({
	brief: AudienceBriefSchema,
});

const AUDIENCE_PROFILING_STATE_SCHEMA = z.object({
	rawResearch: PERSON_RESEARCH_OUTPUT_SCHEMA.optional(),
	workingBrief: AudienceBriefSchema.optional(),
});

const REVIEW_RESUME_SCHEMA = z.object({
	approved: z.boolean(),
	edits: AudienceBriefSchema.partial().optional(),
});

type AudienceProfilingInput = z.infer<typeof AUDIENCE_PROFILING_INPUT_SCHEMA>;
type PersonResearchOutput = z.infer<typeof PERSON_RESEARCH_OUTPUT_SCHEMA>;

type ModelUsage = {
	inputTokens?: number;
	outputTokens?: number;
	promptTokens?: number;
	completionTokens?: number;
	totalTokens?: number;
};

type SynthesizedBriefResult = {
	brief: AudienceBrief;
	usage?: ModelUsage;
	model?: string;
};

export type AudienceProfilingWorkflowDependencies = {
	researchPerson?: (input: {
		personName: string;
		company: string;
	}) => Promise<PersonResearchOutput>;
	synthesizeBrief?: (input: {
		presentationId: string;
		personName: string;
		company: string;
		title: string | null;
		linkedinUrl: string | null;
		rawResearch: PersonResearchOutput;
	}) => Promise<SynthesizedBriefResult>;
};

const AUDIENCE_PROFILING_WORKFLOW_ID = "audience-profiling-workflow";

function hasLlmCredentials(): boolean {
	return Boolean(
		process.env.OPENAI_API_KEY ??
			process.env.ANTHROPIC_API_KEY ??
			process.env.GOOGLE_API_KEY,
	);
}

function buildMockAudienceBrief(input: {
	presentationId: string;
	personName: string;
	company: string;
	title: string | null;
	linkedinUrl: string | null;
	rawResearch: PersonResearchOutput;
}): AudienceBrief {
	const now = new Date().toISOString();

	return AudienceBriefSchema.parse({
		id: randomUUID(),
		presentationId: input.presentationId,
		personName: input.personName,
		company: input.company,
		title: input.title,
		linkedinUrl: input.linkedinUrl,
		enrichmentData: {
			linkedinSignals: input.rawResearch.linkedinSignals,
			companySignals: input.rawResearch.companySignals,
		},
		adaptiveAnswers: [],
		briefText: [
			`${input.personName} appears to prioritize outcome clarity and concise narratives.`,
			`${input.company} is in an execution-heavy phase, so recommendations should be specific and measurable.`,
			"Lead with business impact and keep the storyline direct.",
		].join("\n"),
		briefStructured: {
			communicationProfile: {
				decisionMakingStyle: "metrics-driven with practical bias",
				attentionSpan: "high pressure, prefers concise updates",
				whatTheyTrust: "evidence with clear implementation steps",
				careerContext: input.rawResearch.linkedinSignals.join("; "),
			},
			strategicRecommendations: {
				leadWith: "business impact and near-term execution value",
				frameAs: "risk-managed acceleration with measurable outcomes",
				avoid: "theoretical discussion without concrete next steps",
				include: "proof points, timelines, and implementation owners",
			},
		},
		createdAt: now,
		updatedAt: now,
	});
}

function applyAudienceBriefEdits(
	brief: AudienceBrief,
	edits: Partial<AudienceBrief> | undefined,
): AudienceBrief {
	if (!edits) {
		return brief;
	}

	return AudienceBriefSchema.parse({
		...brief,
		...edits,
		enrichmentData: {
			...brief.enrichmentData,
			...(edits.enrichmentData ?? {}),
		},
		briefStructured: {
			...brief.briefStructured,
			...(edits.briefStructured ?? {}),
		},
		adaptiveAnswers: edits.adaptiveAnswers ?? brief.adaptiveAnswers,
		updatedAt: new Date().toISOString(),
	});
}

async function defaultResearchPerson(input: {
	personName: string;
	company: string;
}): Promise<PersonResearchOutput> {
	return PERSON_RESEARCH_OUTPUT_SCHEMA.parse({
		personName: input.personName,
		company: input.company,
		linkedinSignals: [
			"Led cross-functional product launches",
			"Publishes short tactical posts focused on execution",
			"Background in revenue operations",
		],
		companySignals: [
			"Expanding enterprise segment",
			"Recent focus on process standardization",
			"Pressure to improve forecast predictability",
		],
		notes:
			"Mocked research payload for Mastra workflow spike validation (Netrows + company research stand-in).",
	});
}

async function defaultSynthesizeBrief(input: {
	presentationId: string;
	personName: string;
	company: string;
	title: string | null;
	linkedinUrl: string | null;
	rawResearch: PersonResearchOutput;
}): Promise<SynthesizedBriefResult> {
	if (!hasLlmCredentials()) {
		return {
			brief: buildMockAudienceBrief(input),
			usage: {
				promptTokens: 220,
				completionTokens: 140,
				totalTokens: 360,
			},
			model: "mock/audience-brief-generator",
		};
	}

	const result = await researchAgent.generate(
		[
			{
				role: "user",
				content: [
					"Generate an AudienceBrief JSON object using the provided research data.",
					"Return only valid JSON matching the schema.",
					JSON.stringify(input),
				].join("\n\n"),
			},
		],
		{
			structuredOutput: {
				schema: AudienceBriefSchema,
			},
		},
	);

	return {
		brief: AudienceBriefSchema.parse(result.object),
		usage: await result.totalUsage,
		model: getModelForAgent("brief-generator"),
	};
}

export function createAudienceProfilingWorkflow(
	deps: AudienceProfilingWorkflowDependencies = {},
) {
	const researchPerson = deps.researchPerson ?? defaultResearchPerson;
	const synthesizeBrief = deps.synthesizeBrief ?? defaultSynthesizeBrief;

	const researchPersonStep = createStep({
		id: "research-person",
		stateSchema: AUDIENCE_PROFILING_STATE_SCHEMA,
		inputSchema: AUDIENCE_PROFILING_INPUT_SCHEMA,
		outputSchema: z.object({
			personName: z.string().min(1),
			company: z.string().min(1),
			rawResearch: PERSON_RESEARCH_OUTPUT_SCHEMA,
		}),
		execute: async ({ inputData, state, setState }) => {
			const rawResearch = await researchPerson({
				personName: inputData.personName,
				company: inputData.company,
			});

			await setState({
				...state,
				rawResearch,
			});

			return {
				personName: inputData.personName,
				company: inputData.company,
				rawResearch,
			};
		},
	});

	const synthesizeBriefStep = createStep({
		id: "synthesize-brief",
		stateSchema: AUDIENCE_PROFILING_STATE_SCHEMA,
		inputSchema: z.object({
			personName: z.string().min(1),
			company: z.string().min(1),
			rawResearch: PERSON_RESEARCH_OUTPUT_SCHEMA,
		}),
		outputSchema: AUDIENCE_PROFILING_OUTPUT_SCHEMA,
		execute: async ({
			inputData,
			state,
			setState,
			getInitData,
			mastra,
			runId,
		}) => {
			const initData = getInitData<AudienceProfilingInput>();

			const synthesis = await synthesizeBrief({
				presentationId: initData.presentationId,
				personName: inputData.personName,
				company: inputData.company,
				title: initData.title ?? null,
				linkedinUrl: initData.linkedinUrl ?? null,
				rawResearch: inputData.rawResearch,
			});

			await setState({
				...state,
				workingBrief: synthesis.brief,
			});

			if (synthesis.usage) {
				await recordModelUsageSpan({
					mastra,
					runId,
					workflowId: AUDIENCE_PROFILING_WORKFLOW_ID,
					stepId: "synthesize-brief",
					model: synthesis.model ?? getModelForAgent("brief-generator"),
					usage: synthesis.usage,
				});
			}

			return {
				brief: synthesis.brief,
			};
		},
	});

	const reviewBriefStep = createStep({
		id: "review-brief",
		stateSchema: AUDIENCE_PROFILING_STATE_SCHEMA,
		inputSchema: AUDIENCE_PROFILING_OUTPUT_SCHEMA,
		outputSchema: AUDIENCE_PROFILING_OUTPUT_SCHEMA,
		resumeSchema: REVIEW_RESUME_SCHEMA,
		suspendSchema: AUDIENCE_PROFILING_OUTPUT_SCHEMA,
		execute: async ({
			inputData,
			resumeData,
			state,
			setState,
			suspend,
			mastra,
			runId,
		}) => {
			const baselineBrief = state.workingBrief ?? inputData.brief;
			const revisedBrief = applyAudienceBriefEdits(
				baselineBrief,
				resumeData?.edits,
			);

			await setState({
				...state,
				workingBrief: revisedBrief,
			});

			if (!resumeData || !resumeData.approved) {
				return suspend({
					brief: revisedBrief,
				});
			}

			await finalizeRunTrace({
				mastra,
				runId,
				workflowId: AUDIENCE_PROFILING_WORKFLOW_ID,
			});

			return {
				brief: revisedBrief,
			};
		},
	});

	return createWorkflow({
		id: AUDIENCE_PROFILING_WORKFLOW_ID,
		inputSchema: AUDIENCE_PROFILING_INPUT_SCHEMA,
		outputSchema: AUDIENCE_PROFILING_OUTPUT_SCHEMA,
		stateSchema: AUDIENCE_PROFILING_STATE_SCHEMA,
	})
		.then(researchPersonStep)
		.then(synthesizeBriefStep)
		.then(reviewBriefStep)
		.commit();
}

export const audienceProfilingWorkflow = createAudienceProfilingWorkflow();

export const audienceProfilingSchemas = {
	input: AUDIENCE_PROFILING_INPUT_SCHEMA,
	output: AUDIENCE_PROFILING_OUTPUT_SCHEMA,
	state: AUDIENCE_PROFILING_STATE_SCHEMA,
};
