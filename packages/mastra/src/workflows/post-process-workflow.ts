import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";

import { partnerAgent } from "../agents/partner-agent";
import { validatorAgent } from "../agents/validator-agent";
import { getModelForAgent } from "../config/model-routing";
import {
	finalizeRunTrace,
	recordModelUsageSpan,
} from "../config/spike-tracing";
import {
	StoryboardContentSchema,
	type StoryboardContent,
} from "../schemas/presentation-artifacts";

const PREPARE_CONTEXT_OUTPUT_SCHEMA = z.object({
	storyboard: StoryboardContentSchema,
	agentPrompt: z.string().min(1),
});

const PARTNER_REVIEW_OUTPUT_SCHEMA = z.object({
	reviewer: z.literal("partner"),
	slides: z.array(
		z.object({
			slideId: z.string().min(1),
			narrativeStrength: z.string().min(1),
			improvement: z.string().min(1),
		}),
	),
});

const VALIDATOR_REVIEW_OUTPUT_SCHEMA = z.object({
	reviewer: z.literal("validator"),
	slides: z.array(
		z.object({
			slideId: z.string().min(1),
			claim: z.string().min(1),
			verdict: z.enum(["supported", "unsupported", "unverifiable"]),
			confidence: z.number().min(0).max(1),
			source: z.string().min(1).optional(),
			suggestion: z.string().min(1),
		}),
	),
});

const MERGED_SUGGESTION_SCHEMA = z.object({
	slideId: z.string().min(1),
	source: z.enum(["partner", "validator"]),
	summary: z.string().min(1),
	priority: z.enum(["high", "medium", "low"]),
});

const PARALLEL_REVIEWS_SCHEMA = z.object({
	"partner-review": PARTNER_REVIEW_OUTPUT_SCHEMA,
	"validator-review": VALIDATOR_REVIEW_OUTPUT_SCHEMA,
});

const POST_PROCESS_OUTPUT_SCHEMA = z.object({
	partnerReview: PARTNER_REVIEW_OUTPUT_SCHEMA,
	validatorReview: VALIDATOR_REVIEW_OUTPUT_SCHEMA,
	suggestions: z.array(MERGED_SUGGESTION_SCHEMA),
});

type ModelUsage = {
	inputTokens?: number;
	outputTokens?: number;
	promptTokens?: number;
	completionTokens?: number;
	totalTokens?: number;
};

type AgentReviewResult<TReview> = {
	review: TReview;
	usage?: ModelUsage;
	model?: string;
};

type PartnerReview = z.infer<typeof PARTNER_REVIEW_OUTPUT_SCHEMA>;
type ValidatorReview = z.infer<typeof VALIDATOR_REVIEW_OUTPUT_SCHEMA>;

export type PostProcessWorkflowDependencies = {
	runPartnerReview?: (input: {
		storyboard: StoryboardContent;
		agentPrompt: string;
	}) => Promise<AgentReviewResult<PartnerReview>>;
	runValidatorReview?: (input: {
		storyboard: StoryboardContent;
		agentPrompt: string;
	}) => Promise<AgentReviewResult<ValidatorReview>>;
};

const POST_PROCESS_WORKFLOW_ID = "post-process-workflow";

function hasLlmCredentials(): boolean {
	return Boolean(
		process.env.OPENAI_API_KEY ??
			process.env.ANTHROPIC_API_KEY ??
			process.env.GOOGLE_API_KEY,
	);
}

function mockPartnerReview(storyboard: StoryboardContent): PartnerReview {
	return PARTNER_REVIEW_OUTPUT_SCHEMA.parse({
		reviewer: "partner",
		slides: storyboard.slides.map((slide) => ({
			slideId: slide.id,
			narrativeStrength:
				"Clear storyline progression and executive-level framing.",
			improvement:
				"Lead with the business consequence earlier and make the decision ask explicit.",
		})),
	});
}

function mockValidatorReview(storyboard: StoryboardContent): ValidatorReview {
	return VALIDATOR_REVIEW_OUTPUT_SCHEMA.parse({
		reviewer: "validator",
		slides: storyboard.slides.map((slide, index) => ({
			slideId: slide.id,
			claim: slide.takeawayHeadline,
			verdict: index % 2 === 0 ? "unverifiable" : "unsupported",
			confidence: index % 2 === 0 ? 0.64 : 0.78,
			suggestion:
				index % 2 === 0
					? "Add a cited source or internal metric to make this claim testable."
					: "Replace the assertion with quantified evidence and a referenced data point.",
		})),
	});
}

async function defaultRunPartnerReview(input: {
	storyboard: StoryboardContent;
	agentPrompt: string;
}): Promise<AgentReviewResult<PartnerReview>> {
	if (!hasLlmCredentials()) {
		return {
			review: mockPartnerReview(input.storyboard),
			usage: {
				promptTokens: 180,
				completionTokens: 110,
				totalTokens: 290,
			},
			model: "mock/partner-review",
		};
	}

	const result = await partnerAgent.generate(
		[
			{
				role: "user",
				content: input.agentPrompt,
			},
		],
		{
			structuredOutput: {
				schema: PARTNER_REVIEW_OUTPUT_SCHEMA,
			},
		},
	);

	return {
		review: PARTNER_REVIEW_OUTPUT_SCHEMA.parse(result.object),
		usage: await result.totalUsage,
		model: getModelForAgent("partner"),
	};
}

async function defaultRunValidatorReview(input: {
	storyboard: StoryboardContent;
	agentPrompt: string;
}): Promise<AgentReviewResult<ValidatorReview>> {
	if (!hasLlmCredentials()) {
		return {
			review: mockValidatorReview(input.storyboard),
			usage: {
				promptTokens: 150,
				completionTokens: 130,
				totalTokens: 280,
			},
			model: "mock/validator-review",
		};
	}

	const result = await validatorAgent.generate(
		[
			{
				role: "user",
				content: input.agentPrompt,
			},
		],
		{
			structuredOutput: {
				schema: VALIDATOR_REVIEW_OUTPUT_SCHEMA,
			},
		},
	);

	return {
		review: VALIDATOR_REVIEW_OUTPUT_SCHEMA.parse(result.object),
		usage: await result.totalUsage,
		model: getModelForAgent("validator"),
	};
}

export function createPostProcessWorkflow(
	deps: PostProcessWorkflowDependencies = {},
) {
	const runPartnerReview = deps.runPartnerReview ?? defaultRunPartnerReview;
	const runValidatorReview =
		deps.runValidatorReview ?? defaultRunValidatorReview;

	const prepareContextStep = createStep({
		id: "prepare-context",
		inputSchema: StoryboardContentSchema,
		outputSchema: PREPARE_CONTEXT_OUTPUT_SCHEMA,
		execute: async ({ inputData }) => {
			const context = inputData.slides
				.map(
					(slide) =>
						`Slide ${slide.order + 1}: ${slide.takeawayHeadline}\nPurpose: ${slide.purpose}`,
				)
				.join("\n\n");

			return {
				storyboard: inputData,
				agentPrompt: [
					"Review this storyboard and return structured slide feedback.",
					context,
				].join("\n\n"),
			};
		},
	});

	const partnerReviewStep = createStep({
		id: "partner-review",
		inputSchema: PREPARE_CONTEXT_OUTPUT_SCHEMA,
		outputSchema: PARTNER_REVIEW_OUTPUT_SCHEMA,
		execute: async ({ inputData, mastra, runId }) => {
			const result = await runPartnerReview({
				storyboard: inputData.storyboard,
				agentPrompt: inputData.agentPrompt,
			});

			if (result.usage) {
				await recordModelUsageSpan({
					mastra,
					runId,
					workflowId: POST_PROCESS_WORKFLOW_ID,
					stepId: "partner-review",
					model: result.model ?? getModelForAgent("partner"),
					usage: result.usage,
				});
			}

			return result.review;
		},
	});

	const validatorReviewStep = createStep({
		id: "validator-review",
		inputSchema: PREPARE_CONTEXT_OUTPUT_SCHEMA,
		outputSchema: VALIDATOR_REVIEW_OUTPUT_SCHEMA,
		execute: async ({ inputData, mastra, runId }) => {
			const result = await runValidatorReview({
				storyboard: inputData.storyboard,
				agentPrompt: inputData.agentPrompt,
			});

			if (result.usage) {
				await recordModelUsageSpan({
					mastra,
					runId,
					workflowId: POST_PROCESS_WORKFLOW_ID,
					stepId: "validator-review",
					model: result.model ?? getModelForAgent("validator"),
					usage: result.usage,
				});
			}

			return result.review;
		},
	});

	const mergeSuggestionsStep = createStep({
		id: "merge-suggestions",
		inputSchema: PARALLEL_REVIEWS_SCHEMA,
		outputSchema: POST_PROCESS_OUTPUT_SCHEMA,
		execute: async ({ inputData, mastra, runId }) => {
			const suggestions = [
				...inputData["partner-review"].slides.map((slide) => ({
					slideId: slide.slideId,
					source: "partner" as const,
					summary: `${slide.narrativeStrength} ${slide.improvement}`,
					priority: "medium" as const,
				})),
				...inputData["validator-review"].slides.map((slide) => ({
					slideId: slide.slideId,
					source: "validator" as const,
					summary: [
						`Claim: ${slide.claim}`,
						`Verdict: ${slide.verdict} (${Math.round(slide.confidence * 100)}% confidence).`,
						slide.source ? `Source: ${slide.source}.` : null,
						slide.suggestion,
					]
						.filter(Boolean)
						.join(" "),
					priority:
						slide.verdict === "unsupported"
							? ("high" as const)
							: slide.verdict === "unverifiable"
								? ("medium" as const)
								: ("low" as const),
				})),
			];

			await finalizeRunTrace({
				mastra,
				runId,
				workflowId: POST_PROCESS_WORKFLOW_ID,
			});

			return {
				partnerReview: inputData["partner-review"],
				validatorReview: inputData["validator-review"],
				suggestions,
			};
		},
	});

	return createWorkflow({
		id: POST_PROCESS_WORKFLOW_ID,
		inputSchema: StoryboardContentSchema,
		outputSchema: POST_PROCESS_OUTPUT_SCHEMA,
	})
		.then(prepareContextStep)
		.parallel([partnerReviewStep, validatorReviewStep])
		.then(mergeSuggestionsStep)
		.commit();
}

export const postProcessWorkflow = createPostProcessWorkflow();

export const postProcessSchemas = {
	input: StoryboardContentSchema,
	output: POST_PROCESS_OUTPUT_SCHEMA,
	partnerReview: PARTNER_REVIEW_OUTPUT_SCHEMA,
	validatorReview: VALIDATOR_REVIEW_OUTPUT_SCHEMA,
};
