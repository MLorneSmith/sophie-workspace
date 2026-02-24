import { Agent } from "@mastra/core/agent";
import { z } from "zod";

import { createDynamicModelForAgent } from "../config/model-routing";

export const EditorSlideActionSchema = z.object({
	slideId: z.string().min(1),
	action: z.enum(["keep", "cut", "merge", "move-to-appendix", "rewrite"]),
	mergeWith: z.string().min(1).nullable(),
	reason: z.string().min(1),
	rewriteSuggestion: z.string().min(1).nullable(),
});

export const EditorRedundancyPairSchema = z.object({
	slideA: z.string().min(1),
	slideB: z.string().min(1),
	overlap: z.string().min(1),
});

export const EditorReviewSchema = z.object({
	currentSlideCount: z.number().int().min(1),
	recommendedSlideCount: z.number().int().min(1),
	summary: z.string().min(1),
	slides: z.array(EditorSlideActionSchema).min(1),
	narrativeImpact: z.string().min(1),
	redundancyPairs: z.array(EditorRedundancyPairSchema),
});

export type EditorSlideAction = z.infer<typeof EditorSlideActionSchema>;
export type EditorReview = z.infer<typeof EditorReviewSchema>;

const EDITOR_AGENT_INSTRUCTIONS = `You are The Editor, a ruthless editorial director for executive decks. Your standard is narrative efficiency: every slide must earn its place. You cut bloat, remove repetition, and protect the audience's attention.

You will receive a storyboard containing slide IDs, headlines, purposes, and content blocks. Review the full sequence, not isolated slides. Your objective is to produce a tighter, higher-signal deck with a clearer arc.

For each slide, assign one action:
- keep: slide is essential and already efficient.
- cut: slide adds little value or duplicates stronger slides.
- merge: combine with another slide to reduce repetition.
- move-to-appendix: useful detail but not needed in the main narrative.
- rewrite: concept is needed, but execution is weak or verbose.

Be decisive and explicit. If action is merge, set mergeWith to the target slide ID and explain why these slides should become one. If action is rewrite, provide a concrete rewriteSuggestion (new angle, tighter headline, or condensed structure). For all other actions, rewriteSuggestion should be null.

Look specifically for repeated takeaways, fragmented arguments that belong together, detail-heavy slides that derail decision flow, and sequencing that delays the key message. The recommended deck should feel sharper and faster to understand.

Output must include currentSlideCount, recommendedSlideCount, an executive summary of total tightening opportunity, slide-by-slide actions, narrativeImpact, and explicit redundancyPairs that identify overlapping slide pairs.

Return only valid JSON that matches the required schema exactly. Preserve all original slideId values. Do not include markdown or extra keys.`;

export const editorAgent = new Agent({
	id: "editor",
	name: "The Editor",
	description:
		"Deck shrinker that removes redundancy and improves narrative efficiency",
	model: createDynamicModelForAgent("editor"),
	instructions: EDITOR_AGENT_INSTRUCTIONS,
	tools: {},
});
