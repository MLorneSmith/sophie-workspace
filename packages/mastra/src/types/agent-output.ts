/**
 * Agent Output Types for TipTap Editor Compatibility
 *
 * These schemas define how agent outputs map to TipTap document structure,
 * enabling rich formatting in the AgentSuggestionsPanel.
 *
 * @see TipTapTransformer service for conversion utilities
 */

import { z } from "zod";

// =============================================================================
// TipTap Core Types (re-exported for convenience)
// =============================================================================

/**
 * Base TipTap mark (text formatting)
 */
export const TipTapMarkSchema = z.object({
	type: z.enum(["bold", "italic", "underline", "strike", "code", "link"]),
	attrs: z.record(z.string(), z.unknown()).optional(),
});

export type TipTapMark = z.infer<typeof TipTapMarkSchema>;

/**
 * TipTap text node
 */
export const TipTapTextNodeSchema = z.object({
	type: z.literal("text"),
	text: z.string(),
	marks: z.array(TipTapMarkSchema).optional(),
});

export type TipTapTextNode = z.infer<typeof TipTapTextNodeSchema>;

/**
 * TipTap paragraph node
 */
export const TipTapParagraphSchema = z.object({
	type: z.literal("paragraph"),
	content: z.array(TipTapTextNodeSchema).optional(),
});

export type TipTapParagraph = z.infer<typeof TipTapParagraphSchema>;

/**
 * TipTap heading node
 */
export const TipTapHeadingSchema = z.object({
	type: z.literal("heading"),
	attrs: z.object({
		level: z.number().int().min(1).max(6),
	}),
	content: z.array(TipTapTextNodeSchema).optional(),
});

export type TipTapHeading = z.infer<typeof TipTapHeadingSchema>;

/**
 * TipTap list item node (shared between bullet and ordered lists)
 */
export const TipTapListItemSchema = z.object({
	type: z.literal("listItem"),
	content: z.array(TipTapParagraphSchema),
});

export type TipTapListItem = z.infer<typeof TipTapListItemSchema>;

/**
 * TipTap bullet list node
 */
export const TipTapBulletListSchema = z.object({
	type: z.literal("bulletList"),
	content: z.array(TipTapListItemSchema),
});

export type TipTapBulletList = z.infer<typeof TipTapBulletListSchema>;

/**
 * TipTap ordered list node
 */
export const TipTapOrderedListSchema = z.object({
	type: z.literal("orderedList"),
	attrs: z
		.object({
			start: z.number().int().optional(),
		})
		.optional(),
	content: z.array(TipTapListItemSchema),
});

export type TipTapOrderedList = z.infer<typeof TipTapOrderedListSchema>;

/**
 * Union of all TipTap content nodes
 */
export const TipTapContentNodeSchema = z.discriminatedUnion("type", [
	TipTapParagraphSchema,
	TipTapHeadingSchema,
	TipTapBulletListSchema,
	TipTapOrderedListSchema,
]);

export type TipTapContentNode = z.infer<typeof TipTapContentNodeSchema>;

/**
 * Full TipTap document structure
 */
export const TipTapDocumentSchema = z.object({
	type: z.literal("doc"),
	content: z.array(TipTapContentNodeSchema),
});

export type TipTapDocument = z.infer<typeof TipTapDocumentSchema>;

// =============================================================================
// Agent Suggestion Block Types
// =============================================================================

/**
 * Suggestion block types for different agent outputs
 */
export const SuggestionBlockTypeSchema = z.enum([
	"score-card", // Partner scores (clarity, relevance, etc.)
	"priority-badge", // Priority indicator (critical, important, minor)
	"verdict-badge", // Validator verdict (supported, unsupported, etc.)
	"action-badge", // Editor action (keep, cut, merge, etc.)
	"prose", // Rich text content
	"bullets", // Bullet list
	"callout", // Highlighted callout box
	"code", // Code snippet
]);

export type SuggestionBlockType = z.infer<typeof SuggestionBlockTypeSchema>;

/**
 * Score card block for Partner agent scores
 */
export const ScoreCardBlockSchema = z.object({
	type: z.literal("score-card"),
	scores: z.object({
		clarity: z.number().min(1).max(5).nullable(),
		relevance: z.number().min(1).max(5).nullable(),
		impact: z.number().min(1).max(5).nullable(),
		audienceAlignment: z.number().min(1).max(5).nullable(),
	}),
	overallScore: z.number().min(1).max(5).optional(),
});

export type ScoreCardBlock = z.infer<typeof ScoreCardBlockSchema>;

/**
 * Priority badge for Partner suggestions
 */
export const PriorityBadgeSchema = z.object({
	type: z.literal("priority-badge"),
	priority: z.enum(["critical", "important", "minor"]),
	label: z.string().optional(),
});

export type PriorityBadge = z.infer<typeof PriorityBadgeSchema>;

/**
 * Verdict badge for Validator claims
 */
export const VerdictBadgeSchema = z.object({
	type: z.literal("verdict-badge"),
	verdict: z.enum(["supported", "unsupported", "unverifiable", "outdated"]),
	confidence: z.number().min(0).max(1),
});

export type VerdictBadge = z.infer<typeof VerdictBadgeSchema>;

/**
 * Action badge for Editor recommendations
 */
export const ActionBadgeSchema = z.object({
	type: z.literal("action-badge"),
	action: z.enum(["keep", "cut", "merge", "move-to-appendix", "rewrite"]),
	mergeWith: z.string().optional(),
});

export type ActionBadge = z.infer<typeof ActionBadgeSchema>;

/**
 * Prose block - TipTap-formatted rich text
 */
export const ProseBlockSchema = z.object({
	type: z.literal("prose"),
	content: TipTapDocumentSchema,
});

export type ProseBlock = z.infer<typeof ProseBlockSchema>;

/**
 * Bullet list block
 */
export const BulletsBlockSchema = z.object({
	type: z.literal("bullets"),
	items: z.array(z.string()),
	ordered: z.boolean().optional().default(false),
});

export type BulletsBlock = z.infer<typeof BulletsBlockSchema>;

/**
 * Callout block for highlighted content
 */
export const CalloutBlockSchema = z.object({
	type: z.literal("callout"),
	variant: z.enum(["info", "warning", "success", "error"]),
	title: z.string().optional(),
	content: TipTapDocumentSchema,
});

export type CalloutBlock = z.infer<typeof CalloutBlockSchema>;

/**
 * Code block for technical content
 */
export const CodeBlockSchema = z.object({
	type: z.literal("code"),
	language: z.string().optional(),
	code: z.string(),
});

export type CodeBlock = z.infer<typeof CodeBlockSchema>;

/**
 * Union of all suggestion blocks
 */
export const SuggestionBlockSchema = z.discriminatedUnion("type", [
	ScoreCardBlockSchema,
	PriorityBadgeSchema,
	VerdictBadgeSchema,
	ActionBadgeSchema,
	ProseBlockSchema,
	BulletsBlockSchema,
	CalloutBlockSchema,
	CodeBlockSchema,
]);

export type SuggestionBlock = z.infer<typeof SuggestionBlockSchema>;

// =============================================================================
// Agent Output Schemas (TipTap-Compatible)
// =============================================================================

/**
 * Partner Agent Suggestion Output
 *
 * Maps PartnerReview to TipTap-compatible blocks for display in AgentSuggestionsPanel.
 */
export const PartnerSuggestionOutputSchema = z.object({
	slideId: z.string(),
	/** Headline as TipTap heading */
	headline: TipTapHeadingSchema,
	/** Score visualization block */
	scores: ScoreCardBlockSchema,
	/** Priority indicator */
	priority: PriorityBadgeSchema,
	/** Strengths as bullet list */
	strengths: BulletsBlockSchema,
	/** Weaknesses as bullet list */
	weaknesses: BulletsBlockSchema,
	/** Main suggestion as rich prose */
	suggestion: ProseBlockSchema,
});

export type PartnerSuggestionOutput = z.infer<
	typeof PartnerSuggestionOutputSchema
>;

/**
 * Partner Full Review Output (deck-level)
 */
export const PartnerReviewOutputSchema = z.object({
	/** Overall score card */
	overallScores: ScoreCardBlockSchema,
	/** Executive summary as rich prose */
	executiveSummary: ProseBlockSchema,
	/** Narrative flow analysis */
	narrativeFlow: ProseBlockSchema,
	/** Per-slide suggestions */
	slideSuggestions: z.array(PartnerSuggestionOutputSchema),
	/** Top issues as callouts */
	topIssues: z.array(CalloutBlockSchema),
});

export type PartnerReviewOutput = z.infer<typeof PartnerReviewOutputSchema>;

/**
 * Validator Claim Output
 *
 * Maps individual claim verification to TipTap-compatible blocks.
 */
export const ValidatorClaimOutputSchema = z.object({
	claim: z.string(),
	/** Verdict visualization */
	verdict: VerdictBadgeSchema,
	/** Evidence as rich prose (or null if unavailable) */
	evidence: ProseBlockSchema.nullable(),
	/** Suggestion for improvement */
	suggestion: ProseBlockSchema,
});

export type ValidatorClaimOutput = z.infer<typeof ValidatorClaimOutputSchema>;

/**
 * Validator Slide Review Output
 */
export const ValidatorSlideOutputSchema = z.object({
	slideId: z.string(),
	/** Claims analyzed on this slide */
	claims: z.array(ValidatorClaimOutputSchema),
	/** Data quality indicator */
	dataQuality: z.enum(["strong", "adequate", "weak", "none"]),
	/** Recommendation as rich prose */
	recommendation: ProseBlockSchema,
});

export type ValidatorSlideOutput = z.infer<typeof ValidatorSlideOutputSchema>;

/**
 * Validator Full Review Output
 */
export const ValidatorReviewOutputSchema = z.object({
	/** Overall data quality */
	overallDataQuality: z.enum(["strong", "adequate", "weak", "none"]),
	/** Summary as rich prose */
	summary: ProseBlockSchema,
	/** Per-slide reviews */
	slides: z.array(ValidatorSlideOutputSchema),
	/** Critical flags as callouts */
	criticalFlags: z.array(CalloutBlockSchema),
});

export type ValidatorReviewOutput = z.infer<typeof ValidatorReviewOutputSchema>;

/**
 * Whisperer Slide Notes Output
 *
 * Maps speaker notes to TipTap-compatible blocks.
 */
export const WhispererSlideNotesOutputSchema = z.object({
	slideId: z.string(),
	/** Opening line as paragraph */
	openingLine: ProseBlockSchema,
	/** Key messages as bullet list */
	keyMessages: BulletsBlockSchema,
	/** Transition phrase */
	transitionTo: ProseBlockSchema,
	/** Timing in seconds */
	timingSeconds: z.number().int().min(10).max(600),
	/** Pitfalls to avoid */
	doNot: BulletsBlockSchema,
	/** Optional audience tip */
	audienceTip: ProseBlockSchema.nullable(),
});

export type WhispererSlideNotesOutput = z.infer<
	typeof WhispererSlideNotesOutputSchema
>;

/**
 * Whisperer Full Review Output
 */
export const WhispererReviewOutputSchema = z.object({
	/** Total presentation time */
	totalTimeMinutes: z.number().min(1).max(240),
	/** Pacing notes as rich prose */
	paceNotes: ProseBlockSchema,
	/** Per-slide speaker notes */
	slides: z.array(WhispererSlideNotesOutputSchema),
	/** Opening hook as callout */
	openingHook: CalloutBlockSchema,
	/** Closing statement as callout */
	closingStatement: CalloutBlockSchema,
});

export type WhispererReviewOutput = z.infer<typeof WhispererReviewOutputSchema>;

/**
 * Editor Slide Action Output
 *
 * Maps editorial recommendations to TipTap-compatible blocks.
 */
export const EditorSlideActionOutputSchema = z.object({
	slideId: z.string(),
	/** Action indicator */
	action: ActionBadgeSchema,
	/** Merge target (if action is merge) */
	mergeWith: z.string().nullable(),
	/** Reason as rich prose */
	reason: ProseBlockSchema,
	/** Rewrite suggestion (if action is rewrite) */
	rewriteSuggestion: ProseBlockSchema.nullable(),
});

export type EditorSlideActionOutput = z.infer<
	typeof EditorSlideActionOutputSchema
>;

/**
 * Editor Full Review Output
 */
export const EditorReviewOutputSchema = z.object({
	/** Current slide count */
	currentSlideCount: z.number().int().min(1),
	/** Recommended slide count */
	recommendedSlideCount: z.number().int().min(1),
	/** Summary as rich prose */
	summary: ProseBlockSchema,
	/** Per-slide actions */
	slides: z.array(EditorSlideActionOutputSchema),
	/** Narrative impact analysis */
	narrativeImpact: ProseBlockSchema,
	/** Redundancy pairs as callouts */
	redundancyPairs: z.array(CalloutBlockSchema),
});

export type EditorReviewOutput = z.infer<typeof EditorReviewOutputSchema>;

// =============================================================================
// Union of All Agent Outputs
// =============================================================================

/**
 * Union type for any agent output
 */
export const AgentOutputSchema = z.union([
	PartnerReviewOutputSchema,
	ValidatorReviewOutputSchema,
	WhispererReviewOutputSchema,
	EditorReviewOutputSchema,
]);

export type AgentOutput = z.infer<typeof AgentOutputSchema>;

// =============================================================================
// Helper Functions for Creating TipTap Content
// =============================================================================

/**
 * Creates a simple TipTap paragraph from text
 */
export function createParagraph(text: string): TipTapParagraph {
	return {
		type: "paragraph",
		content: [{ type: "text", text }],
	};
}

/**
 * Creates a TipTap paragraph with bold marks parsed from **text** patterns
 * Converts markdown-style bold syntax to proper TipTap marks
 */
export function createParagraphWithBold(text: string): TipTapParagraph {
	const content: TipTapTextNode[] = [];
	const parts = text.split(/(\*\*[^*]+\*\*)/g);

	for (const part of parts) {
		if (!part) continue;

		if (part.startsWith("**") && part.endsWith("**")) {
			// Bold text - strip the ** markers and add bold mark
			const boldText = part.slice(2, -2);
			if (boldText) {
				content.push({
					type: "text",
					text: boldText,
					marks: [{ type: "bold" }],
				});
			}
		} else {
			// Regular text
			if (part) {
				content.push({ type: "text", text: part });
			}
		}
	}

	// Handle newlines by splitting into multiple paragraphs if needed
	// For now, just replace \n\n with space to keep single paragraph
	const combinedText = text.replace(/\n+/g, " ");
	if (content.length === 0 || combinedText !== text) {
		// If there were newlines, rebuild more carefully
		content.length = 0;
		const newlineParts = combinedText.split(/(\*\*[^*]+\*\*)/g);
		for (const part of newlineParts) {
			if (!part) continue;

			if (part.startsWith("**") && part.endsWith("**")) {
				const boldText = part.slice(2, -2);
				if (boldText) {
					content.push({
						type: "text",
						text: boldText,
						marks: [{ type: "bold" }],
					});
				}
			} else {
				if (part) {
					content.push({ type: "text", text: part });
				}
			}
		}
	}

	return { type: "paragraph", content };
}

/**
 * Creates a TipTap heading from text
 */
export function createHeading(
	text: string,
	level: 1 | 2 | 3 | 4 | 5 | 6 = 2,
): TipTapHeading {
	return {
		type: "heading",
		attrs: { level },
		content: [{ type: "text", text }],
	};
}

/**
 * Creates a TipTap bullet list from items
 */
export function createBulletList(items: string[]): TipTapBulletList {
	return {
		type: "bulletList",
		content: items.map((item) => ({
			type: "listItem",
			content: [{ type: "paragraph", content: [{ type: "text", text: item }] }],
		})),
	};
}

/**
 * Creates a TipTap document from an array of content nodes
 */
export function createDocument(content: TipTapContentNode[]): TipTapDocument {
	return {
		type: "doc",
		content,
	};
}

/**
 * Creates a prose block from plain text
 */
export function createProseBlock(text: string): ProseBlock {
	return {
		type: "prose",
		content: createDocument([createParagraph(text)]),
	};
}

/**
 * Creates a bullets block from items
 */
export function createBulletsBlock(
	items: string[],
	ordered = false,
): BulletsBlock {
	return {
		type: "bullets",
		items,
		ordered,
	};
}

/**
 * Creates a callout block
 */
export function createCalloutBlock(
	content: string,
	variant: "info" | "warning" | "success" | "error" = "info",
	title?: string,
): CalloutBlock {
	return {
		type: "callout",
		variant,
		title,
		content: createDocument([createParagraphWithBold(content)]),
	};
}
