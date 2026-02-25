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
	type CompanyBrief,
	CompanyBriefSchema,
} from "../schemas/company-brief";
import {
	type AudienceBrief,
	AudienceBriefSchema,
} from "../schemas/presentation-artifacts";

const PERSON_RESEARCH_OUTPUT_SCHEMA = z.object({
	personName: z.string().min(1),
	company: z.string().min(1),
	linkedinSignals: z.array(z.string()),
	communicationSignals: z.array(z.string()),
	decisionSignals: z.array(z.string()),
	notes: z.string(),
});

const COMPANY_RESEARCH_OUTPUT_SCHEMA = z.object({
	company: z.string().min(1),
	strategySignals: z.array(z.string()),
	performanceSignals: z.array(z.string()),
	competitorSignals: z.array(z.string()),
	challenges: z.array(z.string()),
	recentNews: z.array(z.string()),
	industryTrends: z.array(z.string()),
	regulatoryContext: z.string(),
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
	audienceBrief: AudienceBriefSchema,
	companyBrief: CompanyBriefSchema,
});

const AUDIENCE_PROFILING_STATE_SCHEMA = z.object({
	rawPersonResearch: PERSON_RESEARCH_OUTPUT_SCHEMA.optional(),
	rawCompanyResearch: COMPANY_RESEARCH_OUTPUT_SCHEMA.optional(),
	workingAudienceBrief: AudienceBriefSchema.optional(),
	workingCompanyBrief: CompanyBriefSchema.optional(),
});

const COMPANY_BRIEF_EDITS_SCHEMA = z.object({
	companySnapshot: CompanyBriefSchema.shape.companySnapshot
		.partial()
		.optional(),
	currentSituation: CompanyBriefSchema.shape.currentSituation
		.partial()
		.optional(),
	industryContext: CompanyBriefSchema.shape.industryContext
		.partial()
		.optional(),
	presentationImplications: CompanyBriefSchema.shape.presentationImplications
		.partial()
		.optional(),
});

const REVIEW_RESUME_SCHEMA = z.object({
	approved: z.boolean(),
	edits: z
		.object({
			audienceBrief: AudienceBriefSchema.partial().optional(),
			companyBrief: COMPANY_BRIEF_EDITS_SCHEMA.optional(),
		})
		.optional(),
});

type AudienceProfilingInput = z.infer<typeof AUDIENCE_PROFILING_INPUT_SCHEMA>;
type PersonResearchOutput = z.infer<typeof PERSON_RESEARCH_OUTPUT_SCHEMA>;
type CompanyResearchOutput = z.infer<typeof COMPANY_RESEARCH_OUTPUT_SCHEMA>;
type CompanyBriefEdits = z.infer<typeof COMPANY_BRIEF_EDITS_SCHEMA>;

type ModelUsage = {
	inputTokens?: number;
	outputTokens?: number;
	promptTokens?: number;
	completionTokens?: number;
	totalTokens?: number;
};

type SynthesizedAudienceBriefResult = {
	audienceBrief: AudienceBrief;
	usage?: ModelUsage;
	model?: string;
};

type SynthesizedCompanyBriefResult = {
	companyBrief: CompanyBrief;
	usage?: ModelUsage;
	model?: string;
};

export type AudienceProfilingWorkflowDependencies = {
	researchPerson?: (input: {
		personName: string;
		company: string;
	}) => Promise<PersonResearchOutput>;
	researchCompany?: (input: {
		company: string;
	}) => Promise<CompanyResearchOutput>;
	synthesizeAudienceBrief?: (input: {
		presentationId: string;
		personName: string;
		company: string;
		title: string | null;
		linkedinUrl: string | null;
		rawPersonResearch: PersonResearchOutput;
	}) => Promise<SynthesizedAudienceBriefResult>;
	synthesizeCompanyBrief?: (input: {
		presentationId: string;
		company: string;
		rawCompanyResearch: CompanyResearchOutput;
	}) => Promise<SynthesizedCompanyBriefResult>;
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
	rawPersonResearch: PersonResearchOutput;
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
			linkedinSignals: input.rawPersonResearch.linkedinSignals,
			communicationSignals: input.rawPersonResearch.communicationSignals,
			decisionSignals: input.rawPersonResearch.decisionSignals,
		},
		adaptiveAnswers: [],
		briefText: [
			`${input.personName} values concise executive communication with clear tradeoffs.`,
			"Lead with implications for business outcomes and direct decision asks.",
			"Use concrete evidence and implementation ownership to build confidence.",
		].join("\n"),
		briefStructured: {
			communicationProfile: {
				decisionMakingStyle: input.rawPersonResearch.decisionSignals.join("; "),
				attentionSpan: "time-constrained, executive-level synthesis",
				whatTheyTrust: "quantified evidence and realistic execution plans",
				careerContext: input.rawPersonResearch.linkedinSignals.join("; "),
			},
			strategicRecommendations: {
				leadWith: "business impact and risk-managed path to execution",
				frameAs: "clear choices with measurable upside and downside",
				avoid: "feature detail before strategic relevance is established",
				include: "decision points, owners, timeline, and expected outcomes",
			},
		},
		createdAt: now,
		updatedAt: now,
	});
}

function buildMockCompanyBrief(input: {
	company: string;
	rawCompanyResearch: CompanyResearchOutput;
}): CompanyBrief {
	return CompanyBriefSchema.parse({
		companySnapshot: {
			name: input.company,
			industry: "B2B software",
			size: "Enterprise-scale organization",
			marketPosition: "Established player under competitive pressure",
		},
		currentSituation: {
			summary:
				"The company is balancing growth ambitions with tighter performance accountability.",
			recentNews: input.rawCompanyResearch.recentNews,
			strategicFocus: input.rawCompanyResearch.strategySignals.join("; "),
			challenges: input.rawCompanyResearch.challenges,
			archetype: "in-transformation",
		},
		industryContext: {
			trends: input.rawCompanyResearch.industryTrends,
			regulatory: input.rawCompanyResearch.regulatoryContext,
			competitors: input.rawCompanyResearch.competitorSignals,
		},
		presentationImplications: {
			framingAdvice:
				"Anchor recommendations in near-term measurable outcomes and change-management realism.",
			topicsToAcknowledge: [
				"execution risk",
				"resource constraints",
				"competitive differentiation",
			],
			relevantBenchmarks: input.rawCompanyResearch.performanceSignals,
			avoidTopics: [
				"speculative upside without evidence",
				"generic best practices detached from company context",
			],
		},
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

function applyCompanyBriefEdits(
	brief: CompanyBrief,
	edits: CompanyBriefEdits | undefined,
): CompanyBrief {
	if (!edits) {
		return brief;
	}

	return CompanyBriefSchema.parse({
		...brief,
		companySnapshot: {
			...brief.companySnapshot,
			...(edits.companySnapshot ?? {}),
		},
		currentSituation: {
			...brief.currentSituation,
			...(edits.currentSituation ?? {}),
		},
		industryContext: {
			...brief.industryContext,
			...(edits.industryContext ?? {}),
		},
		presentationImplications: {
			...brief.presentationImplications,
			...(edits.presentationImplications ?? {}),
		},
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
			"Publishes concise posts focused on operating discipline",
			"Background in revenue operations",
		],
		communicationSignals: [
			"Prefers concise status communication",
			"Responds to structured narratives with explicit tradeoffs",
		],
		decisionSignals: [
			"Metrics-driven with practical bias",
			"Prioritizes recommendations with clear owner accountability",
		],
		notes:
			"Mocked person research payload for Mastra workflow spike validation.",
	});
}

async function defaultResearchCompany(input: {
	company: string;
}): Promise<CompanyResearchOutput> {
	return COMPANY_RESEARCH_OUTPUT_SCHEMA.parse({
		company: input.company,
		strategySignals: [
			"Enterprise expansion with tighter margin discipline",
			"Operational standardization across business units",
		],
		performanceSignals: [
			"Revenue growth decelerated relative to prior year",
			"Customer retention remains above peer median",
		],
		competitorSignals: [
			"Aggressive pricing moves from top competitor",
			"New entrants positioning around AI-enabled workflows",
		],
		challenges: [
			"Execution complexity across multiple initiatives",
			"Pressure to prove ROI on strategic investments",
		],
		recentNews: [
			"Announced multi-quarter transformation program",
			"Leadership emphasized profitability and focus in latest earnings call",
		],
		industryTrends: [
			"Buyers demanding faster measurable payback",
			"Vendor consolidation accelerating in procurement cycles",
		],
		regulatoryContext:
			"Increasing reporting expectations around AI governance and data handling.",
		notes:
			"Mocked company research payload for Mastra workflow spike validation.",
	});
}

async function defaultSynthesizeAudienceBrief(input: {
	presentationId: string;
	personName: string;
	company: string;
	title: string | null;
	linkedinUrl: string | null;
	rawPersonResearch: PersonResearchOutput;
}): Promise<SynthesizedAudienceBriefResult> {
	if (!hasLlmCredentials()) {
		return {
			audienceBrief: buildMockAudienceBrief(input),
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
					"Generate an AudienceBrief JSON object using the provided person research data.",
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
		audienceBrief: AudienceBriefSchema.parse(result.object),
		usage: await result.totalUsage,
		model: getModelForAgent("brief-generator"),
	};
}

async function defaultSynthesizeCompanyBrief(input: {
	presentationId: string;
	company: string;
	rawCompanyResearch: CompanyResearchOutput;
}): Promise<SynthesizedCompanyBriefResult> {
	if (!hasLlmCredentials()) {
		return {
			companyBrief: buildMockCompanyBrief(input),
			usage: {
				promptTokens: 260,
				completionTokens: 150,
				totalTokens: 410,
			},
			model: "mock/company-brief-generator",
		};
	}

	const result = await researchAgent.generate(
		[
			{
				role: "user",
				content: [
					"Generate a CompanyBrief JSON object using the provided company research data.",
					"Return only valid JSON matching the schema.",
					JSON.stringify(input),
				].join("\n\n"),
			},
		],
		{
			structuredOutput: {
				schema: CompanyBriefSchema,
			},
		},
	);

	return {
		companyBrief: CompanyBriefSchema.parse(result.object),
		usage: await result.totalUsage,
		model: getModelForAgent("brief-generator"),
	};
}

export function createAudienceProfilingWorkflow(
	deps: AudienceProfilingWorkflowDependencies = {},
) {
	const researchPerson = deps.researchPerson ?? defaultResearchPerson;
	const researchCompany = deps.researchCompany ?? defaultResearchCompany;
	const synthesizeAudienceBrief =
		deps.synthesizeAudienceBrief ?? defaultSynthesizeAudienceBrief;
	const synthesizeCompanyBrief =
		deps.synthesizeCompanyBrief ?? defaultSynthesizeCompanyBrief;

	const researchPersonStep = createStep({
		id: "research-person",
		stateSchema: AUDIENCE_PROFILING_STATE_SCHEMA,
		inputSchema: AUDIENCE_PROFILING_INPUT_SCHEMA,
		outputSchema: z.object({
			rawPersonResearch: PERSON_RESEARCH_OUTPUT_SCHEMA,
		}),
		execute: async ({ inputData, state, setState }) => {
			const rawPersonResearch = await researchPerson({
				personName: inputData.personName,
				company: inputData.company,
			});

			await setState({
				...state,
				rawPersonResearch,
			});

			return {
				rawPersonResearch,
			};
		},
	});

	const researchCompanyStep = createStep({
		id: "research-company",
		stateSchema: AUDIENCE_PROFILING_STATE_SCHEMA,
		inputSchema: AUDIENCE_PROFILING_INPUT_SCHEMA,
		outputSchema: z.object({
			rawCompanyResearch: COMPANY_RESEARCH_OUTPUT_SCHEMA,
		}),
		execute: async ({ inputData, state, setState }) => {
			const rawCompanyResearch = await researchCompany({
				company: inputData.company,
			});

			await setState({
				...state,
				rawCompanyResearch,
			});

			return {
				rawCompanyResearch,
			};
		},
	});

	const PARALLEL_RESEARCH_SCHEMA = z.object({
		"research-person": z.object({
			rawPersonResearch: PERSON_RESEARCH_OUTPUT_SCHEMA,
		}),
		"research-company": z.object({
			rawCompanyResearch: COMPANY_RESEARCH_OUTPUT_SCHEMA,
		}),
	});

	const synthesizeAudienceBriefStep = createStep({
		id: "synthesize-audience-brief",
		stateSchema: AUDIENCE_PROFILING_STATE_SCHEMA,
		inputSchema: PARALLEL_RESEARCH_SCHEMA,
		outputSchema: z.object({
			audienceBrief: AudienceBriefSchema,
		}),
		execute: async ({
			inputData,
			state,
			setState,
			getInitData,
			mastra,
			runId,
		}) => {
			const initData = getInitData<AudienceProfilingInput>();
			const rawPersonResearch = inputData["research-person"].rawPersonResearch;

			const synthesis = await synthesizeAudienceBrief({
				presentationId: initData.presentationId,
				personName: initData.personName,
				company: initData.company,
				title: initData.title ?? null,
				linkedinUrl: initData.linkedinUrl ?? null,
				rawPersonResearch,
			});

			await setState({
				...state,
				rawPersonResearch,
				workingAudienceBrief: synthesis.audienceBrief,
			});

			if (synthesis.usage) {
				await recordModelUsageSpan({
					mastra,
					runId,
					workflowId: AUDIENCE_PROFILING_WORKFLOW_ID,
					stepId: "synthesize-audience-brief",
					model: synthesis.model ?? getModelForAgent("brief-generator"),
					usage: synthesis.usage,
				});
			}

			return {
				audienceBrief: synthesis.audienceBrief,
			};
		},
	});

	const synthesizeCompanyBriefStep = createStep({
		id: "synthesize-company-brief",
		stateSchema: AUDIENCE_PROFILING_STATE_SCHEMA,
		inputSchema: PARALLEL_RESEARCH_SCHEMA,
		outputSchema: z.object({
			companyBrief: CompanyBriefSchema,
		}),
		execute: async ({
			inputData,
			state,
			setState,
			getInitData,
			mastra,
			runId,
		}) => {
			const initData = getInitData<AudienceProfilingInput>();
			const rawCompanyResearch =
				inputData["research-company"].rawCompanyResearch;

			const synthesis = await synthesizeCompanyBrief({
				presentationId: initData.presentationId,
				company: initData.company,
				rawCompanyResearch,
			});

			await setState({
				...state,
				rawCompanyResearch,
				workingCompanyBrief: synthesis.companyBrief,
			});

			if (synthesis.usage) {
				await recordModelUsageSpan({
					mastra,
					runId,
					workflowId: AUDIENCE_PROFILING_WORKFLOW_ID,
					stepId: "synthesize-company-brief",
					model: synthesis.model ?? getModelForAgent("brief-generator"),
					usage: synthesis.usage,
				});
			}

			return {
				companyBrief: synthesis.companyBrief,
			};
		},
	});

	const PARALLEL_SYNTHESIS_SCHEMA = z.object({
		"synthesize-audience-brief": z.object({
			audienceBrief: AudienceBriefSchema,
		}),
		"synthesize-company-brief": z.object({
			companyBrief: CompanyBriefSchema,
		}),
	});

	const reviewBriefsStep = createStep({
		id: "review-briefs",
		stateSchema: AUDIENCE_PROFILING_STATE_SCHEMA,
		inputSchema: PARALLEL_SYNTHESIS_SCHEMA,
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
			const baselineAudienceBrief =
				state.workingAudienceBrief ??
				inputData["synthesize-audience-brief"].audienceBrief;
			const baselineCompanyBrief =
				state.workingCompanyBrief ??
				inputData["synthesize-company-brief"].companyBrief;

			const revisedAudienceBrief = applyAudienceBriefEdits(
				baselineAudienceBrief,
				resumeData?.edits?.audienceBrief,
			);
			const revisedCompanyBrief = applyCompanyBriefEdits(
				baselineCompanyBrief,
				resumeData?.edits?.companyBrief,
			);

			await setState({
				...state,
				workingAudienceBrief: revisedAudienceBrief,
				workingCompanyBrief: revisedCompanyBrief,
			});

			if (!resumeData || !resumeData.approved) {
				return suspend({
					audienceBrief: revisedAudienceBrief,
					companyBrief: revisedCompanyBrief,
				});
			}

			await finalizeRunTrace({
				mastra,
				runId,
				workflowId: AUDIENCE_PROFILING_WORKFLOW_ID,
			});

			return {
				audienceBrief: revisedAudienceBrief,
				companyBrief: revisedCompanyBrief,
			};
		},
	});

	return createWorkflow({
		id: AUDIENCE_PROFILING_WORKFLOW_ID,
		inputSchema: AUDIENCE_PROFILING_INPUT_SCHEMA,
		outputSchema: AUDIENCE_PROFILING_OUTPUT_SCHEMA,
		stateSchema: AUDIENCE_PROFILING_STATE_SCHEMA,
	})
		.parallel([researchPersonStep, researchCompanyStep])
		.parallel([synthesizeAudienceBriefStep, synthesizeCompanyBriefStep])
		.then(reviewBriefsStep)
		.commit();
}

export const audienceProfilingWorkflow = createAudienceProfilingWorkflow();

export const audienceProfilingSchemas = {
	input: AUDIENCE_PROFILING_INPUT_SCHEMA,
	output: AUDIENCE_PROFILING_OUTPUT_SCHEMA,
	state: AUDIENCE_PROFILING_STATE_SCHEMA,
};
