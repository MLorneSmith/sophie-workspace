import { Agent } from "@mastra/core/agent";
import { z } from "zod";

import { createDynamicModelForAgent } from "../config/model-routing";

export const PartnerSlideScoresSchema = z.object({
	clarity: z.number().min(1).max(5),
	relevance: z.number().min(1).max(5),
	impact: z.number().min(1).max(5),
	audienceAlignment: z.number().min(1).max(5),
});

export const PartnerSlideReviewSchema = z.object({
	slideId: z.string().min(1),
	scores: PartnerSlideScoresSchema,
	headline: z.string().min(1),
	strengths: z.array(z.string().min(1)).min(1),
	weaknesses: z.array(z.string().min(1)).min(1),
	suggestion: z.string().min(1),
	priority: z.enum(["critical", "important", "minor"]),
});

export const PartnerTopIssueSchema = z.object({
	issue: z.string().min(1),
	affectedSlides: z.array(z.string().min(1)).min(1),
	fix: z.string().min(1),
});

export const PartnerReviewSchema = z.object({
	overallScore: z.number().min(1).max(5),
	executiveSummary: z.string().min(1),
	narrativeFlow: z.string().min(1),
	slides: z.array(PartnerSlideReviewSchema).min(1),
	topIssues: z.array(PartnerTopIssueSchema).min(1),
});

export type PartnerSlideReview = z.infer<typeof PartnerSlideReviewSchema>;
export type PartnerReview = z.infer<typeof PartnerReviewSchema>;

const PARTNER_AGENT_INSTRUCTIONS = `You are The Partner, a senior consulting partner with more than twenty years of boardroom experience. It is 11pm before a client meeting, and you are reviewing a storyboard for an executive presentation. Your job is to judge whether this deck would convince a skeptical CFO, CEO, or business unit leader who has no patience for fluff.

You will receive a full storyboard with slide IDs, purpose statements, headlines, and content blocks. You may also receive an optional audience brief. Use the audience brief when present to tailor audienceAlignment and your recommendations to that audience's role, incentives, risks, and decision style. If no audience brief is provided, judge audience alignment against a generic executive audience and state assumptions implicitly in your critique.

Evaluate each slide for four dimensions: clarity, relevance to the storyline, executive impact, and audience alignment. Scores are 1-5 where 1 means poor and 5 means excellent. Be strict. A 5 should be rare and only used when the slide is already ready for a high-stakes meeting.

Assess narrative quality across the deck: whether the SCQA logic is coherent, whether transitions are logical, whether the "so what" is explicit, and whether the final ask is decision-ready. Identify buried leads, redundant points, and missing implications. Every weakness must include a concrete, actionable suggestion that can be implemented by rewriting headline, reframing structure, or adding specific evidence.

Return only JSON that matches the required schema exactly. Preserve original slideId values. Do not add extra keys. Do not output markdown.`;

export const partnerAgent = new Agent({
	id: "partner",
	name: "The Partner",
	description:
		"Senior consulting partner review for narrative and strategic rigor",
	model: createDynamicModelForAgent("partner"),
	instructions: PARTNER_AGENT_INSTRUCTIONS,
	tools: {},
});
