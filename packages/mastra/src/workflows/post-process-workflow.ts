import { randomUUID } from "node:crypto";

import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";

import {
	type EditorReview,
	EditorReviewSchema,
	type EditorSlideAction,
	editorAgent,
} from "../agents/editor-agent";
import {
	type PartnerReview,
	PartnerReviewSchema,
	partnerAgent,
} from "../agents/partner-agent";
import {
	type ValidatorClaim,
	type ValidatorReview,
	ValidatorReviewSchema,
	validatorAgent,
} from "../agents/validator-agent";
import {
	type WhispererReview,
	WhispererReviewSchema,
	whispererAgent,
} from "../agents/whisperer-agent";
import { getModelForAgent } from "../config/model-routing";
import {
	finalizeRunTrace,
	recordModelUsageSpan,
} from "../config/spike-tracing";
import {
	type StoryboardContent,
	StoryboardContentSchema,
} from "../schemas/presentation-artifacts";

const PREPARE_CONTEXT_OUTPUT_SCHEMA = z.object({
	storyboard: StoryboardContentSchema,
	agentPrompt: z.string().min(1),
});

const PARTNER_REVIEW_OUTPUT_SCHEMA = PartnerReviewSchema;
const VALIDATOR_REVIEW_OUTPUT_SCHEMA = ValidatorReviewSchema;
const WHISPERER_REVIEW_OUTPUT_SCHEMA = WhispererReviewSchema;
const EDITOR_REVIEW_OUTPUT_SCHEMA = EditorReviewSchema;

const POST_PROCESS_SUGGESTION_SCHEMA = z.object({
	id: z.uuid(),
	slideId: z.string().min(1),
	agentId: z.enum(["partner", "validator", "whisperer", "editor"]),
	type: z.enum(["narrative", "factual", "delivery", "structural"]),
	summary: z.string().min(1),
	priority: z.enum(["high", "medium", "low"]),
	status: z.literal("pending"),
	detail: z.record(z.string(), z.unknown()).optional(),
});

const PARALLEL_REVIEWS_SCHEMA = z.object({
	"partner-review": PARTNER_REVIEW_OUTPUT_SCHEMA,
	"validator-review": VALIDATOR_REVIEW_OUTPUT_SCHEMA,
	"whisperer-review": WHISPERER_REVIEW_OUTPUT_SCHEMA,
	"editor-review": EDITOR_REVIEW_OUTPUT_SCHEMA,
});

const POST_PROCESS_OUTPUT_SCHEMA = z.object({
	partnerReview: PARTNER_REVIEW_OUTPUT_SCHEMA,
	validatorReview: VALIDATOR_REVIEW_OUTPUT_SCHEMA,
	whispererReview: WHISPERER_REVIEW_OUTPUT_SCHEMA,
	editorReview: EDITOR_REVIEW_OUTPUT_SCHEMA,
	suggestions: z.array(POST_PROCESS_SUGGESTION_SCHEMA),
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

type SuggestionPriority = z.infer<
	typeof POST_PROCESS_SUGGESTION_SCHEMA.shape.priority
>;
type ValidatorClaimVerdict = ValidatorClaim["verdict"];
type EditorAction = EditorSlideAction["action"];
type PostProcessSuggestionInput = Omit<
	z.infer<typeof POST_PROCESS_SUGGESTION_SCHEMA>,
	"id" | "status"
>;

export type PostProcessSuggestion = z.infer<
	typeof POST_PROCESS_SUGGESTION_SCHEMA
>;
export type PostProcessOutput = z.infer<typeof POST_PROCESS_OUTPUT_SCHEMA>;

export type PostProcessWorkflowDependencies = {
	runPartnerReview?: (input: {
		storyboard: StoryboardContent;
		agentPrompt: string;
	}) => Promise<AgentReviewResult<PartnerReview>>;
	runValidatorReview?: (input: {
		storyboard: StoryboardContent;
		agentPrompt: string;
	}) => Promise<AgentReviewResult<ValidatorReview>>;
	runWhispererReview?: (input: {
		storyboard: StoryboardContent;
		agentPrompt: string;
	}) => Promise<AgentReviewResult<WhispererReview>>;
	runEditorReview?: (input: {
		storyboard: StoryboardContent;
		agentPrompt: string;
	}) => Promise<AgentReviewResult<EditorReview>>;
};

const POST_PROCESS_WORKFLOW_ID = "post-process-workflow";

function hasLlmCredentials(): boolean {
	return Boolean(
		process.env.OPENAI_API_KEY ??
			process.env.ANTHROPIC_API_KEY ??
			process.env.GOOGLE_API_KEY,
	);
}

function createSuggestion(
	suggestion: PostProcessSuggestionInput,
): PostProcessSuggestion {
	return POST_PROCESS_SUGGESTION_SCHEMA.parse({
		...suggestion,
		id: randomUUID(),
		status: "pending",
	});
}

function mapPartnerPriority(
	priority: "critical" | "important" | "minor",
): SuggestionPriority {
	switch (priority) {
		case "critical":
			return "high" as const;
		case "important":
			return "medium" as const;
		case "minor":
			return "low" as const;
	}
}

function mapValidatorPriority(
	verdict: ValidatorClaimVerdict,
): SuggestionPriority {
	switch (verdict) {
		case "unsupported":
		case "outdated":
			return "high";
		case "unverifiable":
			return "medium";
		case "supported":
			return "low";
	}
}

function mapWhispererPriority(timingSeconds: number): SuggestionPriority {
	if (timingSeconds >= 120) {
		return "high";
	}

	if (timingSeconds >= 75) {
		return "medium";
	}

	return "low";
}

function mapEditorPriority(action: EditorAction): SuggestionPriority {
	switch (action) {
		case "cut":
		case "merge":
		case "rewrite":
			return "high";
		case "move-to-appendix":
			return "medium";
		case "keep":
			return "low";
	}
}

function mockPartnerReview(storyboard: StoryboardContent): PartnerReview {
	const slideIds = storyboard.slides.map((slide) => slide.id);

	return PARTNER_REVIEW_OUTPUT_SCHEMA.parse({
		overallScore: 3.6,
		executiveSummary:
			"Core message is strong, but opening impact and decision ask need sharper framing.",
		narrativeFlow:
			"Sequence is logical overall, though business consequences should appear earlier.",
		slides: storyboard.slides.map((slide) => ({
			slideId: slide.id,
			scores: {
				clarity: 4,
				relevance: 4,
				impact: 3,
				audienceAlignment: 3,
			},
			headline: slide.takeawayHeadline,
			strengths: [
				"Takeaway is clear and easy to scan.",
				"Purpose aligns to the broader storyline.",
			],
			weaknesses: [
				"Business consequence is implied rather than explicit.",
				"Decision ask is not yet stated directly.",
			],
			suggestion:
				"Rewrite the headline to lead with quantified business impact and close with a direct executive decision ask.",
			priority: "important",
		})),
		topIssues: [
			{
				issue: "Executive decision ask appears too late in the narrative.",
				affectedSlides: slideIds.length > 0 ? slideIds : ["slide-unknown"],
				fix: "State the decision, expected impact, and ownership in the first two slides.",
			},
		],
	});
}

function mockValidatorReview(storyboard: StoryboardContent): ValidatorReview {
	const criticalFlags = storyboard.slides.slice(0, 1).map((slide) => ({
		slideId: slide.id,
		issue: "Primary claim lacks explicit citation and date context.",
		severity: "high" as const,
	}));

	return VALIDATOR_REVIEW_OUTPUT_SCHEMA.parse({
		overallDataQuality: "weak",
		summary:
			"Several claims are directionally plausible but require clear evidence and citation metadata.",
		slides: storyboard.slides.map((slide, index) => ({
			slideId: slide.id,
			claims: [
				{
					claim: slide.takeawayHeadline,
					verdict: index % 2 === 0 ? "unsupported" : "unverifiable",
					confidence: index % 2 === 0 ? 0.82 : 0.66,
					evidence: null,
					suggestion:
						index % 2 === 0
							? "Add an auditable metric and cited source directly on the slide."
							: "Bound the claim with timeframe and include source date for verification.",
				},
			],
			dataQuality: index % 2 === 0 ? "weak" : "adequate",
			recommendation:
				"Pair every headline claim with a dated source and one quantitative datapoint.",
		})),
		criticalFlags,
	});
}

function mockWhispererReview(storyboard: StoryboardContent): WhispererReview {
	const slides = storyboard.slides.map((slide, index, allSlides) => ({
		slideId: slide.id,
		openingLine:
			index === 0
				? "Let me start with the risk we need to resolve this quarter."
				: "This slide shows how we reduce execution risk while preserving speed.",
		keyMessages: [
			"Lead with the single business implication before details.",
			"Anchor each point to expected outcome and owner accountability.",
			"Close with the decision needed from this audience.",
		],
		transitionTo:
			index === allSlides.length - 1
				? "I will close with the decision and next step."
				: "With that context, let me move to the execution path.",
		timingSeconds: index === 0 ? 80 : 70,
		doNot: [
			"Do not read slide text verbatim.",
			"Do not over-explain implementation detail before the decision point.",
		],
		audienceTip:
			index === 0
				? "Frame tradeoffs in terms of ROI and execution risk."
				: null,
	}));

	const totalTimeMinutes = Math.max(
		1,
		Math.ceil(
			slides.reduce((total, slide) => total + slide.timingSeconds, 0) / 60,
		),
	);

	return WHISPERER_REVIEW_OUTPUT_SCHEMA.parse({
		totalTimeMinutes,
		paceNotes:
			"Keep momentum high by making one point per breath and pausing before each decision ask.",
		slides,
		openingHook:
			"The current plan leaves value on the table; this deck shows the fastest credible fix.",
		closingStatement:
			"If we align on this direction today, we can lock owners and start execution this week.",
	});
}

function mockEditorReview(storyboard: StoryboardContent): EditorReview {
	const currentSlideCount = storyboard.slides.length;
	const recommendedSlideCount = Math.max(1, currentSlideCount - 1);
	const hasAtLeastTwoSlides = storyboard.slides.length >= 2;

	return EDITOR_REVIEW_OUTPUT_SCHEMA.parse({
		currentSlideCount,
		recommendedSlideCount,
		summary:
			"Deck can be tightened by reducing repetitive setup language and sharpening action framing.",
		slides: storyboard.slides.map((slide, index) => ({
			slideId: slide.id,
			action:
				index === 0
					? "rewrite"
					: index === 1 && hasAtLeastTwoSlides
						? "merge"
						: "keep",
			mergeWith:
				index === 1 && hasAtLeastTwoSlides
					? (storyboard.slides[0]?.id ?? null)
					: null,
			reason:
				index === 0
					? "Headline is directionally correct but too abstract for executive decision speed."
					: index === 1 && hasAtLeastTwoSlides
						? "Content overlaps with the framing from slide 1 and can be collapsed."
						: "Slide carries unique supporting context worth preserving.",
			rewriteSuggestion:
				index === 0
					? "Rewrite headline to quantify downside risk and state the decision needed."
					: null,
		})),
		narrativeImpact:
			"Recommended changes make the story faster to process and more decision oriented.",
		redundancyPairs:
			hasAtLeastTwoSlides && storyboard.slides[0] && storyboard.slides[1]
				? [
						{
							slideA: storyboard.slides[0].id,
							slideB: storyboard.slides[1].id,
							overlap:
								"Both slides introduce execution risk framing with similar context.",
						},
					]
				: [],
	});
}

function createDefaultRunReview<TReview>(opts: {
	agent: {
		// biome-ignore lint/suspicious/noExplicitAny: agent.generate signature requires flexible args
		generate: (...args: any[]) => Promise<{
			object: unknown;
			totalUsage: ModelUsage | Promise<ModelUsage>;
		}>;
	};
	schema: z.ZodType<TReview>;
	mockFn: (storyboard: StoryboardContent) => TReview;
	mockUsage: ModelUsage;
	mockModel: string;
	agentName: Parameters<typeof getModelForAgent>[0];
}): (input: {
	storyboard: StoryboardContent;
	agentPrompt: string;
}) => Promise<AgentReviewResult<TReview>> {
	return async (input) => {
		if (!hasLlmCredentials()) {
			return {
				review: opts.mockFn(input.storyboard),
				usage: opts.mockUsage,
				model: opts.mockModel,
			};
		}

		try {
			const result = await opts.agent.generate(
				[{ role: "user", content: input.agentPrompt }],
				{ structuredOutput: { schema: opts.schema } },
			);

			return {
				review: opts.schema.parse(result.object),
				usage: await result.totalUsage,
				model: getModelForAgent(opts.agentName),
			};
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			throw new Error(`Agent "${opts.agentName}" failed: ${message}`, {
				cause: error,
			});
		}
	};
}

const defaultRunPartnerReview = createDefaultRunReview({
	agent: partnerAgent,
	schema: PARTNER_REVIEW_OUTPUT_SCHEMA,
	mockFn: mockPartnerReview,
	mockUsage: { promptTokens: 180, completionTokens: 110, totalTokens: 290 },
	mockModel: "mock/partner-review",
	agentName: "partner",
});

const defaultRunValidatorReview = createDefaultRunReview({
	agent: validatorAgent,
	schema: VALIDATOR_REVIEW_OUTPUT_SCHEMA,
	mockFn: mockValidatorReview,
	mockUsage: { promptTokens: 150, completionTokens: 130, totalTokens: 280 },
	mockModel: "mock/validator-review",
	agentName: "validator",
});

const defaultRunWhispererReview = createDefaultRunReview({
	agent: whispererAgent,
	schema: WHISPERER_REVIEW_OUTPUT_SCHEMA,
	mockFn: mockWhispererReview,
	mockUsage: { promptTokens: 130, completionTokens: 140, totalTokens: 270 },
	mockModel: "mock/whisperer-review",
	agentName: "whisperer",
});

const defaultRunEditorReview = createDefaultRunReview({
	agent: editorAgent,
	schema: EDITOR_REVIEW_OUTPUT_SCHEMA,
	mockFn: mockEditorReview,
	mockUsage: { promptTokens: 110, completionTokens: 90, totalTokens: 200 },
	mockModel: "mock/editor-review",
	agentName: "editor",
});

export function createPostProcessWorkflow(
	deps: PostProcessWorkflowDependencies = {},
) {
	const runPartnerReview = deps.runPartnerReview ?? defaultRunPartnerReview;
	const runValidatorReview =
		deps.runValidatorReview ?? defaultRunValidatorReview;
	const runWhispererReview =
		deps.runWhispererReview ?? defaultRunWhispererReview;
	const runEditorReview = deps.runEditorReview ?? defaultRunEditorReview;

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

	const whispererReviewStep = createStep({
		id: "whisperer-review",
		inputSchema: PREPARE_CONTEXT_OUTPUT_SCHEMA,
		outputSchema: WHISPERER_REVIEW_OUTPUT_SCHEMA,
		execute: async ({ inputData, mastra, runId }) => {
			const result = await runWhispererReview({
				storyboard: inputData.storyboard,
				agentPrompt: inputData.agentPrompt,
			});

			if (result.usage) {
				await recordModelUsageSpan({
					mastra,
					runId,
					workflowId: POST_PROCESS_WORKFLOW_ID,
					stepId: "whisperer-review",
					model: result.model ?? getModelForAgent("whisperer"),
					usage: result.usage,
				});
			}

			return result.review;
		},
	});

	const editorReviewStep = createStep({
		id: "editor-review",
		inputSchema: PREPARE_CONTEXT_OUTPUT_SCHEMA,
		outputSchema: EDITOR_REVIEW_OUTPUT_SCHEMA,
		execute: async ({ inputData, mastra, runId }) => {
			const result = await runEditorReview({
				storyboard: inputData.storyboard,
				agentPrompt: inputData.agentPrompt,
			});

			if (result.usage) {
				await recordModelUsageSpan({
					mastra,
					runId,
					workflowId: POST_PROCESS_WORKFLOW_ID,
					stepId: "editor-review",
					model: result.model ?? getModelForAgent("editor"),
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
			const partnerSuggestions = inputData["partner-review"].slides.map(
				(slide) =>
					createSuggestion({
						slideId: slide.slideId,
						agentId: "partner",
						type: "narrative",
						summary: `${slide.headline}: ${slide.suggestion}`,
						priority: mapPartnerPriority(slide.priority),
						detail: {
							scores: slide.scores,
							strengths: slide.strengths,
							weaknesses: slide.weaknesses,
						},
					}),
			);

			const validatorClaimSuggestions = inputData[
				"validator-review"
			].slides.flatMap((slide) =>
				slide.claims.map((claim) =>
					createSuggestion({
						slideId: slide.slideId,
						agentId: "validator",
						type: "factual",
						summary: `Claim "${claim.claim}" is ${claim.verdict}. ${claim.suggestion}`,
						priority: mapValidatorPriority(claim.verdict),
						detail: {
							claim: claim.claim,
							verdict: claim.verdict,
							confidence: claim.confidence,
							evidence: claim.evidence,
							dataQuality: slide.dataQuality,
							recommendation: slide.recommendation,
						},
					}),
				),
			);

			const validatorFlagSuggestions = inputData[
				"validator-review"
			].criticalFlags.map((flag) =>
				createSuggestion({
					slideId: flag.slideId,
					agentId: "validator",
					type: "factual",
					summary: `Critical flag: ${flag.issue}`,
					priority: flag.severity,
					detail: {
						issue: flag.issue,
						severity: flag.severity,
					},
				}),
			);

			const whispererSuggestions = inputData["whisperer-review"].slides.map(
				(slide) =>
					createSuggestion({
						slideId: slide.slideId,
						agentId: "whisperer",
						type: "delivery",
						summary: `Open with "${slide.openingLine}" then transition with "${slide.transitionTo}".`,
						priority: mapWhispererPriority(slide.timingSeconds),
						detail: {
							keyMessages: slide.keyMessages,
							timingSeconds: slide.timingSeconds,
							doNot: slide.doNot,
							audienceTip: slide.audienceTip,
						},
					}),
			);

			const editorSuggestions = inputData["editor-review"].slides.map((slide) =>
				createSuggestion({
					slideId: slide.slideId,
					agentId: "editor",
					type: "structural",
					summary:
						slide.rewriteSuggestion !== null
							? `${slide.reason} Rewrite: ${slide.rewriteSuggestion}`
							: slide.reason,
					priority: mapEditorPriority(slide.action),
					detail: {
						action: slide.action,
						mergeWith: slide.mergeWith,
						rewriteSuggestion: slide.rewriteSuggestion,
					},
				}),
			);

			const suggestions = [
				...partnerSuggestions,
				...validatorClaimSuggestions,
				...validatorFlagSuggestions,
				...whispererSuggestions,
				...editorSuggestions,
			];

			await finalizeRunTrace({
				mastra,
				runId,
				workflowId: POST_PROCESS_WORKFLOW_ID,
			});

			return {
				partnerReview: inputData["partner-review"],
				validatorReview: inputData["validator-review"],
				whispererReview: inputData["whisperer-review"],
				editorReview: inputData["editor-review"],
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
		.parallel([
			partnerReviewStep,
			validatorReviewStep,
			whispererReviewStep,
			editorReviewStep,
		])
		.then(mergeSuggestionsStep)
		.commit();
}

export const postProcessWorkflow = createPostProcessWorkflow();

export const postProcessSchemas = {
	input: StoryboardContentSchema,
	output: POST_PROCESS_OUTPUT_SCHEMA,
	suggestion: POST_PROCESS_SUGGESTION_SCHEMA,
	partnerReview: PARTNER_REVIEW_OUTPUT_SCHEMA,
	validatorReview: VALIDATOR_REVIEW_OUTPUT_SCHEMA,
	whispererReview: WHISPERER_REVIEW_OUTPUT_SCHEMA,
	editorReview: EDITOR_REVIEW_OUTPUT_SCHEMA,
};
