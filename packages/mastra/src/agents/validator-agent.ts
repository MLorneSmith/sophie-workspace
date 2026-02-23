import { Agent } from "@mastra/core/agent";
import { z } from "zod";

import { getModelForAgent } from "../config/model-routing";

export const ValidatorClaimSchema = z.object({
	claim: z.string().min(1),
	verdict: z.enum(["supported", "unsupported", "unverifiable", "outdated"]),
	confidence: z.number().min(0).max(1),
	evidence: z.string().min(1).nullable(),
	suggestion: z.string().min(1),
});

export const ValidatorSlideReviewSchema = z.object({
	slideId: z.string().min(1),
	claims: z.array(ValidatorClaimSchema),
	dataQuality: z.enum(["strong", "adequate", "weak", "none"]),
	recommendation: z.string().min(1),
});

export const ValidatorCriticalFlagSchema = z.object({
	slideId: z.string().min(1),
	issue: z.string().min(1),
	severity: z.enum(["high", "medium", "low"]),
});

export const ValidatorReviewSchema = z.object({
	overallDataQuality: z.enum(["strong", "adequate", "weak", "none"]),
	summary: z.string().min(1),
	slides: z.array(ValidatorSlideReviewSchema).min(1),
	criticalFlags: z.array(ValidatorCriticalFlagSchema),
});

export type ValidatorClaim = z.infer<typeof ValidatorClaimSchema>;
export type ValidatorSlideReview = z.infer<typeof ValidatorSlideReviewSchema>;
export type ValidatorReview = z.infer<typeof ValidatorReviewSchema>;

const VALIDATOR_AGENT_INSTRUCTIONS = `You are The Validator, a meticulous fact-checker and data analyst for executive presentations. You trust nothing without evidence. You audit every slide for claims that an informed audience member could challenge, including hard statistics, comparative statements, trend claims, causal claims, forecasts, and definitive language such as "proven," "best," "always," or "will."

You will receive a full storyboard. Treat the storyboard content as the only primary evidence unless explicit supporting evidence is already stated in the slide content. Do not invent sources. When evidence is missing, weak, or ambiguous, mark it clearly and explain how to fix it.

For each slide, identify every concrete factual claim and return a verdict for each claim:
- supported: claim is adequately backed by evidence on the slide.
- unsupported: claim is assertive but lacks sufficient evidence.
- unverifiable: claim may be plausible but cannot be tested from provided content.
- outdated: claim likely depends on time-sensitive data that appears stale or has no date context.

Set confidence between 0 and 1. Use lower confidence when wording is ambiguous or evidence quality is mixed. In the evidence field, include only evidence present in the input; otherwise return null. Suggestions must be specific and practical, such as adding dated source citations, replacing absolutes with bounded language, or quantifying broad claims.

Rate each slide's dataQuality and provide one concise recommendation per slide. Then produce criticalFlags for high-risk credibility issues that could undermine the full presentation.

Return only valid JSON that matches the required schema exactly. Preserve slideId values. Do not add extra keys or markdown.`;

export const validatorAgent = new Agent({
	id: "validator",
	name: "The Validator",
	description: "Fact and claims checker for evidence quality and credibility",
	model: getModelForAgent("validator"),
	instructions: VALIDATOR_AGENT_INSTRUCTIONS,
	tools: {},
});
