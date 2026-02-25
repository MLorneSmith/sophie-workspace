/**
 * Agent Output Transformer
 *
 * Transforms raw agent outputs (PartnerReview, ValidatorReview, etc.)
 * into TipTap-compatible formats for display in AgentSuggestionsPanel.
 *
 * @see TipTapTransformer service for storyboard conversion
 */

import type {
	EditorReview,
	EditorSlideAction,
	PartnerReview,
	PartnerSlideReview,
	ValidatorClaim,
	ValidatorReview,
	ValidatorSlideReview,
	WhispererReview,
	WhispererSlideNotes,
} from "../agents";

import {
	ActionBadgeSchema,
	createBulletsBlock,
	createCalloutBlock,
	createDocument,
	createHeading,
	// Helper functions
	createParagraph,
	createProseBlock,
	type EditorReviewOutput,
	EditorReviewOutputSchema,
	type EditorSlideActionOutput,
	EditorSlideActionOutputSchema,
	type PartnerReviewOutput,
	// Output schemas for runtime validation
	PartnerReviewOutputSchema,
	type PartnerSuggestionOutput,
	PartnerSuggestionOutputSchema,
	// Schemas for validation
	PriorityBadgeSchema,
	type TipTapContentNode,
	// Types
	type TipTapDocument,
	type ValidatorClaimOutput,
	ValidatorClaimOutputSchema,
	type ValidatorReviewOutput,
	ValidatorReviewOutputSchema,
	type ValidatorSlideOutput,
	ValidatorSlideOutputSchema,
	type WhispererReviewOutput,
	WhispererReviewOutputSchema,
	type WhispererSlideNotesOutput,
	WhispererSlideNotesOutputSchema,
} from "../types/agent-output";

// =============================================================================
// Partner Agent Transformer
// =============================================================================

/**
 * Transforms PartnerReview to TipTap-compatible PartnerReviewOutput
 */
export function transformPartnerReview(
	review: PartnerReview,
): PartnerReviewOutput {
	return PartnerReviewOutputSchema.parse({
		overallScores: {
			type: "score-card",
			scores: {
				clarity: calculateAverageScore(review.slides, "clarity"),
				relevance: calculateAverageScore(review.slides, "relevance"),
				impact: calculateAverageScore(review.slides, "impact"),
				audienceAlignment: calculateAverageScore(
					review.slides,
					"audienceAlignment",
				),
			},
			overallScore: review.overallScore,
		},
		executiveSummary: createProseBlock(review.executiveSummary),
		narrativeFlow: createProseBlock(review.narrativeFlow),
		slideSuggestions: review.slides.map(transformPartnerSlideReview),
		topIssues: review.topIssues.map((issue) =>
			createCalloutBlock(
				`${issue.issue}\n\n**Affected slides:** ${issue.affectedSlides.join(", ")}\n\n**Fix:** ${issue.fix}`,
				"warning",
				"Top Issue",
			),
		),
	});
}

/**
 * Transforms a single PartnerSlideReview to TipTap-compatible format
 */
export function transformPartnerSlideReview(
	slide: PartnerSlideReview,
): PartnerSuggestionOutput {
	// Validate priority with Zod, fallback to "minor" for invalid values
	const validatedPriority = PriorityBadgeSchema.shape.priority
		.catch("minor")
		.parse(slide.priority);

	return PartnerSuggestionOutputSchema.parse({
		slideId: slide.slideId,
		headline: createHeading(slide.headline, 3),
		scores: {
			type: "score-card",
			scores: slide.scores,
		},
		priority: {
			type: "priority-badge",
			priority: validatedPriority,
		},
		strengths: createBulletsBlock(slide.strengths),
		weaknesses: createBulletsBlock(slide.weaknesses),
		suggestion: createProseBlock(slide.suggestion),
	});
}

/**
 * Calculate average score across slides for a dimension
 * Returns 3 (neutral midpoint of 1-5 range) for empty arrays as schema-valid default
 */
function calculateAverageScore(
	slides: PartnerSlideReview[],
	dimension: "clarity" | "relevance" | "impact" | "audienceAlignment",
): number {
	if (slides.length === 0) return 3; // Valid default
	const sum = slides.reduce((acc, slide) => acc + slide.scores[dimension], 0);
	const avg = sum / slides.length;
	// Clamp to 1-5 range per schema constraints
	return Math.min(5, Math.max(1, Math.round(avg * 10) / 10));
}

// =============================================================================
// Validator Agent Transformer
// =============================================================================

/**
 * Transforms ValidatorReview to TipTap-compatible ValidatorReviewOutput
 */
export function transformValidatorReview(
	review: ValidatorReview,
): ValidatorReviewOutput {
	return ValidatorReviewOutputSchema.parse({
		overallDataQuality: review.overallDataQuality,
		summary: createProseBlock(review.summary),
		slides: review.slides.map(transformValidatorSlideReview),
		criticalFlags: review.criticalFlags.map((flag) =>
			createCalloutBlock(
				`**Slide:** ${flag.slideId}\n\n${flag.issue}`,
				flag.severity === "high"
					? "error"
					: flag.severity === "medium"
						? "warning"
						: "info",
				"Critical Flag",
			),
		),
	});
}

/**
 * Transforms a single ValidatorSlideReview to TipTap-compatible format
 */
export function transformValidatorSlideReview(
	slide: ValidatorSlideReview,
): ValidatorSlideOutput {
	return ValidatorSlideOutputSchema.parse({
		slideId: slide.slideId,
		claims: slide.claims.map(transformValidatorClaim),
		dataQuality: slide.dataQuality,
		recommendation: createProseBlock(slide.recommendation),
	});
}

/**
 * Transforms a single claim to TipTap-compatible format
 */
export function transformValidatorClaim(
	claim: ValidatorClaim,
): ValidatorClaimOutput {
	return ValidatorClaimOutputSchema.parse({
		claim: claim.claim,
		verdict: {
			type: "verdict-badge",
			verdict: claim.verdict,
			confidence: claim.confidence,
		},
		evidence: claim.evidence ? createProseBlock(claim.evidence) : null,
		suggestion: createProseBlock(claim.suggestion),
	});
}

// =============================================================================
// Whisperer Agent Transformer
// =============================================================================

/**
 * Transforms WhispererReview to TipTap-compatible WhispererReviewOutput
 */
export function transformWhispererReview(
	review: WhispererReview,
): WhispererReviewOutput {
	return WhispererReviewOutputSchema.parse({
		totalTimeMinutes: review.totalTimeMinutes,
		paceNotes: createProseBlock(review.paceNotes),
		slides: review.slides.map(transformWhispererSlideNotes),
		openingHook: createCalloutBlock(
			review.openingHook,
			"success",
			"Opening Hook",
		),
		closingStatement: createCalloutBlock(
			review.closingStatement,
			"info",
			"Closing Statement",
		),
	});
}

/**
 * Transforms a single WhispererSlideNotes to TipTap-compatible format
 */
export function transformWhispererSlideNotes(
	notes: WhispererSlideNotes,
): WhispererSlideNotesOutput {
	return WhispererSlideNotesOutputSchema.parse({
		slideId: notes.slideId,
		openingLine: createProseBlock(notes.openingLine),
		keyMessages: createBulletsBlock(notes.keyMessages),
		transitionTo: createProseBlock(notes.transitionTo),
		timingSeconds: notes.timingSeconds,
		doNot: createBulletsBlock(notes.doNot),
		audienceTip: notes.audienceTip ? createProseBlock(notes.audienceTip) : null,
	});
}

// =============================================================================
// Editor Agent Transformer
// =============================================================================

/**
 * Transforms EditorReview to TipTap-compatible EditorReviewOutput
 */
export function transformEditorReview(
	review: EditorReview,
): EditorReviewOutput {
	return EditorReviewOutputSchema.parse({
		currentSlideCount: review.currentSlideCount,
		recommendedSlideCount: review.recommendedSlideCount,
		summary: createProseBlock(review.summary),
		slides: review.slides.map(transformEditorSlideAction),
		narrativeImpact: createProseBlock(review.narrativeImpact),
		redundancyPairs: review.redundancyPairs.map((pair) =>
			createCalloutBlock(
				`**Overlap:** ${pair.overlap}\n\n**Slides:** ${pair.slideA} ↔ ${pair.slideB}`,
				"warning",
				"Redundancy Detected",
			),
		),
	});
}

/**
 * Transforms a single EditorSlideAction to TipTap-compatible format
 */
export function transformEditorSlideAction(
	action: EditorSlideAction,
): EditorSlideActionOutput {
	// Validate action with Zod, fallback to "keep" for invalid values
	const validatedAction = ActionBadgeSchema.shape.action
		.catch("keep")
		.parse(action.action);

	return EditorSlideActionOutputSchema.parse({
		slideId: action.slideId,
		action: {
			type: "action-badge",
			action: validatedAction,
			mergeWith: action.mergeWith ?? undefined,
		},
		mergeWith: action.mergeWith,
		reason: createProseBlock(action.reason),
		rewriteSuggestion: action.rewriteSuggestion
			? createProseBlock(action.rewriteSuggestion)
			: null,
	});
}

// =============================================================================
// Generic TipTap Document Builder
// =============================================================================

/**
 * Options for building a TipTap document from agent output
 */
export interface BuildDocumentOptions {
	/** Include a header section with title */
	title?: string;
	/** Include a timestamp */
	timestamp?: string;
	/** Add section separators */
	addSeparators?: boolean;
}

/**
 * Builds a complete TipTap document from an array of content nodes
 */
export function buildTipTapDocument(
	nodes: TipTapContentNode[],
	options: BuildDocumentOptions = {},
): TipTapDocument {
	const content: TipTapContentNode[] = [];

	// Add title if provided
	if (options.title) {
		content.push(createHeading(options.title, 1));
	}

	// Add timestamp if provided
	if (options.timestamp) {
		content.push(createParagraph(`Generated: ${options.timestamp}`));
	}

	// Add separator if we have a title and content
	if (options.addSeparators && content.length > 0 && nodes.length > 0) {
		content.push(createParagraph("—"));
	}

	// Add all content nodes
	content.push(...nodes);

	return createDocument(content);
}
