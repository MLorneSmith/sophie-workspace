import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";

import { partnerAgent } from "../agents/partner-agent";
import { skepticAgent } from "../agents/skeptic-agent";
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

const SKEPTIC_REVIEW_OUTPUT_SCHEMA = z.object({
	reviewer: z.literal("skeptic"),
	slides: z.array(
		z.object({
			slideId: z.string().min(1),
			weakness: z.string().min(1),
			toughQuestion: z.string().min(1),
		}),
	),
});

const MERGED_SUGGESTION_SCHEMA = z.object({
	slideId: z.string().min(1),
	source: z.enum(["partner", "skeptic"]),
	summary: z.string().min(1),
	priority: z.enum(["high", "medium", "low"]),
});

const PARALLEL_REVIEWS_SCHEMA = z.object({
	"partner-review": PARTNER_REVIEW_OUTPUT_SCHEMA,
	"skeptic-review": SKEPTIC_REVIEW_OUTPUT_SCHEMA,
});

const POST_PROCESS_OUTPUT_SCHEMA = z.object({
	partnerReview: PARTNER_REVIEW_OUTPUT_SCHEMA,
	skepticReview: SKEPTIC_REVIEW_OUTPUT_SCHEMA,
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
type SkepticReview = z.infer<typeof SKEPTIC_REVIEW_OUTPUT_SCHEMA>;

export type PostProcessWorkflowDependencies = {
	runPartnerReview?: (input: {
		storyboard: StoryboardContent;
		agentPrompt: string;
	}) => Promise<AgentReviewResult<PartnerReview>>;
	runSkepticReview?: (input: {
		storyboard: StoryboardContent;
		agentPrompt: string;
	}) => Promise<AgentReviewResult<SkepticReview>>;
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
				"Clear storyline progression and strong executive framing.",
			improvement:
				"Tighten the headline to emphasize business outcome in the first 5 seconds.",
		})),
	});
}

function mockSkepticReview(storyboard: StoryboardContent): SkepticReview {
	return SKEPTIC_REVIEW_OUTPUT_SCHEMA.parse({
		reviewer: "skeptic",
		slides: storyboard.slides.map((slide) => ({
			slideId: slide.id,
			weakness: "Evidence depth may not fully justify the recommendation.",
			toughQuestion:
				"What concrete proof shows this approach will outperform alternatives?",
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

async function defaultRunSkepticReview(input: {
	storyboard: StoryboardContent;
	agentPrompt: string;
}): Promise<AgentReviewResult<SkepticReview>> {
	if (!hasLlmCredentials()) {
		return {
			review: mockSkepticReview(input.storyboard),
			usage: {
				promptTokens: 150,
				completionTokens: 130,
				totalTokens: 280,
			},
			model: "mock/skeptic-review",
		};
	}

	const result = await skepticAgent.generate(
		[
			{
				role: "user",
				content: input.agentPrompt,
			},
		],
		{
			structuredOutput: {
				schema: SKEPTIC_REVIEW_OUTPUT_SCHEMA,
			},
		},
	);

	return {
		review: SKEPTIC_REVIEW_OUTPUT_SCHEMA.parse(result.object),
		usage: await result.totalUsage,
		model: getModelForAgent("skeptic"),
	};
}

export function createPostProcessWorkflow(
	deps: PostProcessWorkflowDependencies = {},
) {
	const runPartnerReview = deps.runPartnerReview ?? defaultRunPartnerReview;
	const runSkepticReview = deps.runSkepticReview ?? defaultRunSkepticReview;

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

	const skepticReviewStep = createStep({
		id: "skeptic-review",
		inputSchema: PREPARE_CONTEXT_OUTPUT_SCHEMA,
		outputSchema: SKEPTIC_REVIEW_OUTPUT_SCHEMA,
		execute: async ({ inputData, mastra, runId }) => {
			const result = await runSkepticReview({
				storyboard: inputData.storyboard,
				agentPrompt: inputData.agentPrompt,
			});

			if (result.usage) {
				await recordModelUsageSpan({
					mastra,
					runId,
					workflowId: POST_PROCESS_WORKFLOW_ID,
					stepId: "skeptic-review",
					model: result.model ?? getModelForAgent("skeptic"),
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
				...inputData["skeptic-review"].slides.map((slide) => ({
					slideId: slide.slideId,
					source: "skeptic" as const,
					summary: `${slide.weakness} ${slide.toughQuestion}`,
					priority: "high" as const,
				})),
			];

			await finalizeRunTrace({
				mastra,
				runId,
				workflowId: POST_PROCESS_WORKFLOW_ID,
			});

			return {
				partnerReview: inputData["partner-review"],
				skepticReview: inputData["skeptic-review"],
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
		.parallel([partnerReviewStep, skepticReviewStep])
		.then(mergeSuggestionsStep)
		.commit();
}

export const postProcessWorkflow = createPostProcessWorkflow();

export const postProcessSchemas = {
	input: StoryboardContentSchema,
	output: POST_PROCESS_OUTPUT_SCHEMA,
	partnerReview: PARTNER_REVIEW_OUTPUT_SCHEMA,
	skepticReview: SKEPTIC_REVIEW_OUTPUT_SCHEMA,
};
