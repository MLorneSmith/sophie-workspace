import { randomUUID } from "node:crypto";

import { Mastra } from "@mastra/core";
import { InMemoryStore } from "@mastra/core/storage";
import { describe, expect, it } from "vitest";

import { getRunTokenUsage } from "../config/spike-tracing";
import { CompanyBriefSchema } from "../schemas/company-brief";
import {
	AudienceBriefSchema,
	type StoryboardContent,
} from "../schemas/presentation-artifacts";
import {
	createAudienceProfilingWorkflow,
	createPostProcessWorkflow,
} from "../workflows";

function buildStoryboardInput(): StoryboardContent {
	const now = new Date().toISOString();

	return {
		presentationId: "presentation-spike-473",
		updatedAt: now,
		slides: [
			{
				id: "9d7ed36e-3522-4d5f-9f80-27b1676c86ab",
				order: 0,
				purpose: "Set executive context",
				takeawayHeadline: "Market pressure requires a sharper growth thesis",
				layout: "title-and-points",
				speakerNotes: null,
				outlineSectionId: null,
				contentBlocks: [
					{
						id: "1e2fc0ef-0a4f-4b54-b84f-e089cc5df95a",
						type: "text",
						content: "Summarize the strategic context and urgency.",
						order: 0,
					},
				],
			},
			{
				id: "7a6d3c40-a0e5-4f38-a9b0-0b7bc04ee612",
				order: 1,
				purpose: "Show path to execution",
				takeawayHeadline:
					"Execution roadmap reduces risk while preserving speed",
				layout: "two-column",
				speakerNotes: null,
				outlineSectionId: null,
				contentBlocks: [
					{
						id: "4ce2ddc2-8b9f-4d85-a633-5ad02efef0f4",
						type: "text",
						content: "Timeline, owners, and measurable milestones.",
						order: 0,
					},
				],
			},
		],
	};
}

describe("Mastra validation spike", () => {
	it("runs audienceProfilingWorkflow with two briefs, HITL edits, and token usage", async () => {
		const audienceUsage = {
			promptTokens: 120,
			completionTokens: 60,
			totalTokens: 180,
		};
		const companyUsage = {
			promptTokens: 80,
			completionTokens: 50,
			totalTokens: 130,
		};

		const audienceWorkflow = createAudienceProfilingWorkflow({
			researchPerson: async ({ personName, company }) => ({
				personName,
				company,
				linkedinSignals: ["Mocked leadership signal"],
				communicationSignals: ["Prefers concise executive summaries"],
				decisionSignals: ["Metrics-first with risk framing"],
				notes: "Mocked person research payload for spike test",
			}),
			researchCompany: async ({ company }) => ({
				company,
				strategySignals: ["Focus on operating margin expansion"],
				performanceSignals: ["Growth has slowed quarter-over-quarter"],
				competitorSignals: ["Primary rival launched pricing disruption"],
				challenges: ["Need to improve execution consistency"],
				recentNews: ["Announced enterprise transformation initiative"],
				industryTrends: ["Procurement cycles emphasizing ROI proof"],
				regulatoryContext: "No material change in regulatory environment",
				notes: "Mocked company research payload for spike test",
			}),
			synthesizeAudienceBrief: async ({
				presentationId,
				personName,
				company,
				title,
				linkedinUrl,
			}) => {
				const now = new Date().toISOString();
				return {
					audienceBrief: AudienceBriefSchema.parse({
						id: "fbcbf67a-b4bc-4f09-9110-2f8d990823fe",
						presentationId,
						personName,
						company,
						title,
						linkedinUrl,
						enrichmentData: {
							source: "mocked-person-research",
						},
						adaptiveAnswers: [],
						briefText: "Initial synthesized audience brief text.",
						briefStructured: {
							focus: "executive decision framing",
						},
						createdAt: now,
						updatedAt: now,
					}),
					usage: audienceUsage,
					model: "mock/audience-synthesizer",
				};
			},
			synthesizeCompanyBrief: async ({ company }) => ({
				companyBrief: CompanyBriefSchema.parse({
					companySnapshot: {
						name: company,
						industry: "B2B SaaS",
						size: "Enterprise",
						marketPosition: "Top-3 incumbent",
					},
					currentSituation: {
						summary: "Company is in a margin-focused transformation.",
						recentNews: [
							"CEO announced strategic reset with cost discipline goals",
						],
						strategicFocus: "Margin expansion with selective growth bets",
						challenges: [
							"Aligning execution across regions",
							"Proving impact of strategic investments",
						],
						archetype: "in-transformation",
					},
					industryContext: {
						trends: ["ROI scrutiny in enterprise buying decisions"],
						regulatory: "Routine compliance expectations",
						competitors: ["Rival A", "Rival B"],
					},
					presentationImplications: {
						framingAdvice:
							"Lead with measurable business impact and execution realism.",
						topicsToAcknowledge: ["resource constraints", "execution risk"],
						relevantBenchmarks: ["Gross margin trajectory", "Retention"],
						avoidTopics: ["speculative outcomes"],
					},
				}),
				usage: companyUsage,
				model: "mock/company-synthesizer",
			}),
		});

		const postProcessWorkflow = createPostProcessWorkflow();
		const mastra = new Mastra({
			storage: new InMemoryStore({ id: "mastra-spike-audience-test" }),
			workflows: {
				audienceWorkflow,
				postProcessWorkflow,
			},
		});

		expect(mastra.getWorkflow("audienceWorkflow")).toBeDefined();

		const run = await audienceWorkflow.createRun({
			runId: `audience-run-${randomUUID()}`,
		});

		const initialResult = await run.start({
			inputData: {
				presentationId: "presentation-spike-473",
				personName: "Dana Chen",
				company: "Acme Corp",
				title: "VP Strategy",
				linkedinUrl: null,
			},
		});

		expect(initialResult.status).toBe("suspended");
		if (initialResult.status !== "suspended") {
			throw new Error("Expected workflow to suspend at briefs review step");
		}

		const initialSuspendPayload =
			(initialResult.steps["review-briefs"]?.suspendPayload as
				| { audienceBrief?: unknown; companyBrief?: unknown }
				| undefined) ??
			(initialResult.suspendPayload as
				| { audienceBrief?: unknown; companyBrief?: unknown }
				| undefined);

		expect(
			AudienceBriefSchema.safeParse(initialSuspendPayload?.audienceBrief)
				.success,
		).toBe(true);
		expect(
			CompanyBriefSchema.safeParse(initialSuspendPayload?.companyBrief).success,
		).toBe(true);

		const editedResult = await run.resume({
			step: "review-briefs",
			resumeData: {
				approved: false,
				edits: {
					audienceBrief: {
						briefText: "Edited audience brief text from reviewer.",
					},
					companyBrief: {
						currentSituation: {
							summary: "Edited company situation summary focused on urgency.",
						},
						presentationImplications: {
							framingAdvice:
								"Edited framing: lead with quantified downside risk.",
						},
					},
				},
			},
		});

		expect(editedResult.status).toBe("suspended");
		if (editedResult.status !== "suspended") {
			throw new Error(
				"Expected workflow to suspend again after unapproved briefs review",
			);
		}

		const editedSuspendPayload =
			(editedResult.steps["review-briefs"]?.suspendPayload as
				| {
						audienceBrief?: { briefText?: string };
						companyBrief?: {
							currentSituation?: { summary?: string };
							presentationImplications?: { framingAdvice?: string };
						};
				  }
				| undefined) ??
			(editedResult.suspendPayload as
				| {
						audienceBrief?: { briefText?: string };
						companyBrief?: {
							currentSituation?: { summary?: string };
							presentationImplications?: { framingAdvice?: string };
						};
				  }
				| undefined);

		expect(editedSuspendPayload?.audienceBrief?.briefText).toBe(
			"Edited audience brief text from reviewer.",
		);
		expect(editedSuspendPayload?.companyBrief?.currentSituation?.summary).toBe(
			"Edited company situation summary focused on urgency.",
		);
		expect(
			editedSuspendPayload?.companyBrief?.presentationImplications
				?.framingAdvice,
		).toBe("Edited framing: lead with quantified downside risk.");

		const finalResult = await run.resume({
			step: "review-briefs",
			resumeData: {
				approved: true,
			},
		});

		expect(finalResult.status).toBe("success");
		if (finalResult.status !== "success") {
			throw new Error("Expected workflow to complete after briefs approval");
		}

		expect(finalResult.result.audienceBrief.briefText).toBe(
			"Edited audience brief text from reviewer.",
		);
		expect(finalResult.result.companyBrief.currentSituation.summary).toBe(
			"Edited company situation summary focused on urgency.",
		);

		const usage = await getRunTokenUsage(run.runId, mastra);
		expect(usage.promptTokens).toBe(200);
		expect(usage.completionTokens).toBe(110);
		expect(usage.totalTokens).toBe(310);
		expect(usage.estimatedCost).toBeGreaterThan(0);
	});

	it("runs postProcessWorkflow with all 4 agent reviews and merges output", async () => {
		const partnerUsage = {
			promptTokens: 90,
			completionTokens: 30,
			totalTokens: 120,
		};
		const validatorUsage = {
			promptTokens: 70,
			completionTokens: 50,
			totalTokens: 120,
		};
		const whispererUsage = {
			promptTokens: 60,
			completionTokens: 40,
			totalTokens: 100,
		};
		const editorUsage = {
			promptTokens: 40,
			completionTokens: 20,
			totalTokens: 60,
		};

		const postProcessWorkflow = createPostProcessWorkflow({
			runPartnerReview: async ({ storyboard }) => ({
				review: {
					overallScore: 4.1,
					executiveSummary:
						"Narrative is compelling but can tighten action framing.",
					narrativeFlow: "Flow is coherent and mostly decision-ready.",
					slides: storyboard.slides.map((slide) => ({
						slideId: slide.id,
						scores: {
							clarity: 4,
							relevance: 4,
							impact: 4,
							audienceAlignment: 3,
						},
						headline: slide.takeawayHeadline,
						strengths: ["Strong storyline linkage", "Clear executive framing"],
						weaknesses: ["Could increase urgency", "Decision ask is implied"],
						suggestion: "Make business impact explicit in the first sentence.",
						priority: "important",
					})),
					topIssues: [
						{
							issue: "Decision ask should appear earlier",
							affectedSlides: [storyboard.slides[0]?.id ?? "unknown-slide"],
							fix: "Move explicit ask to opening context slide",
						},
					],
				},
				usage: partnerUsage,
				model: "mock/partner",
			}),
			runValidatorReview: async ({ storyboard }) => ({
				review: {
					overallDataQuality: "adequate",
					summary:
						"Most claims are directionally sound but one needs explicit sourcing.",
					slides: storyboard.slides.map((slide, index) => ({
						slideId: slide.id,
						claims: [
							{
								claim: slide.takeawayHeadline,
								verdict: index === 0 ? "unsupported" : "supported",
								confidence: index === 0 ? 0.86 : 0.74,
								evidence:
									index === 0
										? null
										: "Internal KPI dashboard Q4 2025 trendline",
								suggestion:
									index === 0
										? "Add data evidence from an audited source for this claim."
										: "Keep the claim but attach citation in speaker notes.",
							},
						],
						dataQuality: index === 0 ? "weak" : "strong",
						recommendation:
							index === 0
								? "Add source date and metric definition."
								: "Retain and cite in footnote.",
					})),
					criticalFlags: [
						{
							slideId: storyboard.slides[0]?.id ?? "unknown-slide",
							issue: "Top-line claim has no source citation.",
							severity: "high",
						},
					],
				},
				usage: validatorUsage,
				model: "mock/validator",
			}),
			runWhispererReview: async ({ storyboard }) => ({
				review: {
					totalTimeMinutes: 3,
					paceNotes:
						"Keep each slide under 90 seconds and pause before the ask.",
					slides: storyboard.slides.map((slide, index) => ({
						slideId: slide.id,
						openingLine:
							index === 0
								? "Let me frame the risk and the opportunity."
								: "Here is the execution path that controls risk.",
						keyMessages: [
							"State the business implication first.",
							"Support with one metric and one owner.",
						],
						transitionTo:
							index === storyboard.slides.length - 1
								? "I will close with the decision request."
								: "Now let me walk through execution.",
						timingSeconds: index === 0 ? 85 : 70,
						doNot: ["Do not read slide text directly."],
						audienceTip: index === 0 ? "Keep tradeoffs explicit." : null,
					})),
					openingHook:
						"The current plan leaves avoidable risk; this story shows how to reduce it quickly.",
					closingStatement:
						"If you approve this path now, we can begin execution this week.",
				},
				usage: whispererUsage,
				model: "mock/whisperer",
			}),
			runEditorReview: async ({ storyboard }) => ({
				review: {
					currentSlideCount: storyboard.slides.length,
					recommendedSlideCount: Math.max(1, storyboard.slides.length - 1),
					summary:
						"Deck can be tighter by rewriting setup and merging overlap.",
					slides: storyboard.slides.map((slide, index) => ({
						slideId: slide.id,
						action: index === 0 ? "rewrite" : "merge",
						mergeWith:
							index === 0
								? null
								: (storyboard.slides[0]?.id ?? "unknown-slide"),
						reason:
							index === 0
								? "Opening is clear but not decisive enough."
								: "Execution detail overlaps with the context slide.",
						rewriteSuggestion:
							index === 0
								? "Lead with quantified impact and explicit decision ask."
								: null,
					})),
					narrativeImpact:
						"Changes shorten time-to-understanding and strengthen executive focus.",
					redundancyPairs:
						storyboard.slides.length >= 2 &&
						storyboard.slides[0] &&
						storyboard.slides[1]
							? [
									{
										slideA: storyboard.slides[0].id,
										slideB: storyboard.slides[1].id,
										overlap: "Both describe execution risk context.",
									},
								]
							: [],
				},
				usage: editorUsage,
				model: "mock/editor",
			}),
		});

		const audienceWorkflow = createAudienceProfilingWorkflow();
		const mastra = new Mastra({
			storage: new InMemoryStore({ id: "mastra-spike-postprocess-test" }),
			workflows: {
				audienceWorkflow,
				postProcessWorkflow,
			},
		});

		expect(mastra.getWorkflow("postProcessWorkflow")).toBeDefined();

		const run = await postProcessWorkflow.createRun({
			runId: `postprocess-run-${randomUUID()}`,
		});

		const result = await run.start({
			inputData: buildStoryboardInput(),
		});

		expect(result.status).toBe("success");
		if (result.status !== "success") {
			throw new Error("Expected post-process workflow to succeed");
		}

		expect(result.steps["partner-review"]?.status).toBe("success");
		expect(result.steps["validator-review"]?.status).toBe("success");
		expect(result.steps["whisperer-review"]?.status).toBe("success");
		expect(result.steps["editor-review"]?.status).toBe("success");

		expect(result.result.partnerReview.overallScore).toBeGreaterThan(0);
		expect(result.result.validatorReview.slides.length).toBe(2);
		expect(result.result.whispererReview.slides.length).toBe(2);
		expect(result.result.editorReview.slides.length).toBe(2);
		expect(
			result.result.validatorReview.slides.every(
				(slide) =>
					slide.claims[0]?.verdict === "supported" ||
					slide.claims[0]?.verdict === "unsupported" ||
					slide.claims[0]?.verdict === "unverifiable" ||
					slide.claims[0]?.verdict === "outdated",
			),
		).toBe(true);
		expect(
			result.result.validatorReview.slides.every(
				(slide) =>
					(slide.claims[0]?.confidence ?? -1) >= 0 &&
					(slide.claims[0]?.confidence ?? 2) <= 1,
			),
		).toBe(true);

		expect(result.result.suggestions.length).toBe(9);
		expect(result.result.suggestions.every((suggestion) => suggestion.id)).toBe(
			true,
		);
		expect(
			result.result.suggestions.every(
				(suggestion) => suggestion.status === "pending",
			),
		).toBe(true);
		expect(
			result.result.suggestions.some(
				(suggestion) => suggestion.agentId === "partner",
			),
		).toBe(true);
		expect(
			result.result.suggestions.some(
				(suggestion) => suggestion.agentId === "validator",
			),
		).toBe(true);
		expect(
			result.result.suggestions.some(
				(suggestion) => suggestion.agentId === "whisperer",
			),
		).toBe(true);
		expect(
			result.result.suggestions.some(
				(suggestion) => suggestion.agentId === "editor",
			),
		).toBe(true);

		const usage = await getRunTokenUsage(run.runId, mastra);
		expect(usage.promptTokens).toBe(260);
		expect(usage.completionTokens).toBe(140);
		expect(usage.totalTokens).toBe(400);
		expect(usage.estimatedCost).toBeGreaterThan(0);
	});
});
