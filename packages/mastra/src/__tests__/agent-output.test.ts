/**
 * Type tests for agent output schemas
 *
 * These tests validate that the schemas correctly parse agent outputs
 * and that types are properly inferred.
 */

import { describe, expect, it } from "vitest";
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
	transformEditorReview,
	transformEditorSlideAction,
	transformPartnerReview,
	transformPartnerSlideReview,
	transformValidatorClaim,
	transformValidatorReview,
	transformValidatorSlideReview,
	transformWhispererReview,
	transformWhispererSlideNotes,
} from "../transformers/agent-output-transformer";
import {
	ActionBadgeSchema,
	BulletsBlockSchema,
	CalloutBlockSchema,
	createBulletList,
	createBulletsBlock,
	createCalloutBlock,
	createDocument,
	createHeading,
	// Helper functions
	createParagraph,
	createParagraphWithBold,
	createProseBlock,
	EditorReviewOutputSchema,
	EditorSlideActionOutputSchema,
	PartnerReviewOutputSchema,
	PartnerSuggestionOutputSchema,
	PriorityBadgeSchema,
	ProseBlockSchema,
	ScoreCardBlockSchema,
	TipTapBulletListSchema,
	// Schemas
	TipTapDocumentSchema,
	TipTapHeadingSchema,
	TipTapMarkSchema,
	TipTapParagraphSchema,
	ValidatorClaimOutputSchema,
	ValidatorReviewOutputSchema,
	ValidatorSlideOutputSchema,
	VerdictBadgeSchema,
	WhispererReviewOutputSchema,
	WhispererSlideNotesOutputSchema,
} from "../types/agent-output";

describe("TipTap Core Schemas", () => {
	it("validates a simple paragraph", () => {
		const paragraph = createParagraph("Hello, world!");
		const result = TipTapParagraphSchema.safeParse(paragraph);
		expect(result.success).toBe(true);
	});

	it("validates a heading", () => {
		const heading = createHeading("Main Title", 1);
		const result = TipTapHeadingSchema.safeParse(heading);
		expect(result.success).toBe(true);
	});

	it("validates a bullet list", () => {
		const list = createBulletList(["Item 1", "Item 2", "Item 3"]);
		const result = TipTapBulletListSchema.safeParse(list);
		expect(result.success).toBe(true);
	});

	it("validates a full document", () => {
		const doc = createDocument([
			createHeading("Title", 1),
			createParagraph("Some content here."),
			createBulletList(["Point 1", "Point 2"]),
		]);
		const result = TipTapDocumentSchema.safeParse(doc);
		expect(result.success).toBe(true);
	});

	it("validates marks (text formatting)", () => {
		const boldMark = { type: "bold" as const };
		const result = TipTapMarkSchema.safeParse(boldMark);
		expect(result.success).toBe(true);
	});
});

describe("createParagraphWithBold - Regression Tests", () => {
	it("parses markdown bold and produces schema-valid paragraph", () => {
		const paragraph = createParagraphWithBold("**bold**\n");
		const result = TipTapParagraphSchema.safeParse(paragraph);
		expect(result.success).toBe(true);
	});

	it("parses mixed text with bold markers and preserves content", () => {
		const paragraph = createParagraphWithBold(
			"Regular text **bold text** more text",
		);
		const result = TipTapParagraphSchema.safeParse(paragraph);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.content).toBeDefined();
			expect(result.data.content?.length).toBeGreaterThan(0);
			// Verify at least one text node carries a bold mark
			const nodes = result.data.content ?? [];
			const hasBoldMark = nodes.some(
				(n) =>
					"marks" in n &&
					Array.isArray(n.marks) &&
					n.marks.some((m) => m.type === "bold"),
			);
			expect(hasBoldMark).toBe(true);
		}
	});

	it("validates link mark with attrs", () => {
		const linkMark = {
			type: "link" as const,
			attrs: { href: "https://example.com" },
		};
		const result = TipTapMarkSchema.safeParse(linkMark);
		expect(result.success).toBe(true);
	});
});

describe("Suggestion Block Schemas", () => {
	it("validates a score card block", () => {
		const scoreCard = {
			type: "score-card" as const,
			scores: {
				clarity: 4,
				relevance: 5,
				impact: 3,
				audienceAlignment: 4,
			},
			overallScore: 4,
		};
		const result = ScoreCardBlockSchema.safeParse(scoreCard);
		expect(result.success).toBe(true);
	});

	it("rejects invalid scores (out of range)", () => {
		const scoreCard = {
			type: "score-card" as const,
			scores: {
				clarity: 6, // Invalid: max is 5
				relevance: 5,
				impact: 3,
				audienceAlignment: 4,
			},
		};
		const result = ScoreCardBlockSchema.safeParse(scoreCard);
		expect(result.success).toBe(false);
	});

	it("validates a priority badge", () => {
		const badge = {
			type: "priority-badge" as const,
			priority: "critical" as const,
		};
		const result = PriorityBadgeSchema.safeParse(badge);
		expect(result.success).toBe(true);
	});

	it("validates a verdict badge", () => {
		const badge = {
			type: "verdict-badge" as const,
			verdict: "supported" as const,
			confidence: 0.95,
		};
		const result = VerdictBadgeSchema.safeParse(badge);
		expect(result.success).toBe(true);
	});

	it("validates an action badge", () => {
		const badge = {
			type: "action-badge" as const,
			action: "merge" as const,
			mergeWith: "slide-123",
		};
		const result = ActionBadgeSchema.safeParse(badge);
		expect(result.success).toBe(true);
	});

	it("validates a prose block", () => {
		const prose = createProseBlock("This is some rich text content.");
		const result = ProseBlockSchema.safeParse(prose);
		expect(result.success).toBe(true);
	});

	it("validates a bullets block", () => {
		const bullets = createBulletsBlock(["First point", "Second point"]);
		const result = BulletsBlockSchema.safeParse(bullets);
		expect(result.success).toBe(true);
	});

	it("validates a callout block", () => {
		const callout = createCalloutBlock(
			"Important notice!",
			"warning",
			"Warning",
		);
		const result = CalloutBlockSchema.safeParse(callout);
		expect(result.success).toBe(true);
	});
});

describe("Partner Agent Output Schemas", () => {
	it("validates a partner suggestion output", () => {
		const suggestion = {
			slideId: "slide-1",
			headline: createHeading("Improve Clarity", 3),
			scores: {
				type: "score-card" as const,
				scores: {
					clarity: 3,
					relevance: 4,
					impact: 4,
					audienceAlignment: 5,
				},
			},
			priority: {
				type: "priority-badge" as const,
				priority: "important" as const,
			},
			strengths: createBulletsBlock(["Strong data"]),
			weaknesses: createBulletsBlock(["Needs more context"]),
			suggestion: createProseBlock("Add a supporting chart."),
		};
		const result = PartnerSuggestionOutputSchema.safeParse(suggestion);
		expect(result.success).toBe(true);
	});
});

describe("Validator Agent Output Schemas", () => {
	it("validates a validator claim output", () => {
		const claim = {
			claim: "Revenue increased by 25%",
			verdict: {
				type: "verdict-badge" as const,
				verdict: "supported" as const,
				confidence: 0.9,
			},
			evidence: createProseBlock("Q3 earnings report confirms."),
			suggestion: createProseBlock("Add citation."),
		};
		const result = ValidatorClaimOutputSchema.safeParse(claim);
		expect(result.success).toBe(true);
	});

	it("validates a validator slide output", () => {
		const slide = {
			slideId: "slide-1",
			claims: [
				{
					claim: "Market leader",
					verdict: {
						type: "verdict-badge" as const,
						verdict: "unsupported" as const,
						confidence: 0.6,
					},
					evidence: null,
					suggestion: createProseBlock("Add market share data."),
				},
			],
			dataQuality: "adequate" as const,
			recommendation: createProseBlock("Strengthen evidence."),
		};
		const result = ValidatorSlideOutputSchema.safeParse(slide);
		expect(result.success).toBe(true);
	});
});

describe("Whisperer Agent Output Schemas", () => {
	it("validates a whisperer slide notes output", () => {
		const notes = {
			slideId: "slide-1",
			openingLine: createProseBlock("Let's look at the numbers."),
			keyMessages: createBulletsBlock([
				"Growth is strong",
				"Margins are improving",
			]),
			transitionTo: createProseBlock("Now let's see what's driving this."),
			timingSeconds: 120,
			doNot: createBulletsBlock(["Don't read the slide verbatim"]),
			audienceTip: createProseBlock("Pause for emphasis on the key metric."),
		};
		const result = WhispererSlideNotesOutputSchema.safeParse(notes);
		expect(result.success).toBe(true);
	});
});

describe("Editor Agent Output Schemas", () => {
	it("validates an editor slide action output", () => {
		const action = {
			slideId: "slide-1",
			action: {
				type: "action-badge" as const,
				action: "merge" as const,
				mergeWith: "slide-2",
			},
			mergeWith: "slide-2",
			reason: createProseBlock("Both slides cover similar ground."),
			rewriteSuggestion: null,
		};
		const result = EditorSlideActionOutputSchema.safeParse(action);
		expect(result.success).toBe(true);
	});

	it("validates a rewrite action with suggestion", () => {
		const action = {
			slideId: "slide-3",
			action: {
				type: "action-badge" as const,
				action: "rewrite" as const,
			},
			mergeWith: null,
			reason: createProseBlock("Headline is weak."),
			rewriteSuggestion: createProseBlock("Change to: 'Key Drivers of Growth'"),
		};
		const result = EditorSlideActionOutputSchema.safeParse(action);
		expect(result.success).toBe(true);
	});
});

describe("Partner Transformer Conformance", () => {
	const mockSlide: PartnerSlideReview = {
		slideId: "slide-1",
		headline: "Test Headline",
		priority: "important",
		scores: {
			clarity: 4,
			relevance: 3,
			impact: 5,
			audienceAlignment: 4,
		},
		strengths: ["Strong data", "Clear message"],
		weaknesses: ["Needs more context"],
		suggestion: "Add a supporting chart",
	};

	const mockReview: PartnerReview = {
		overallScore: 4,
		executiveSummary: "Overall strong presentation",
		narrativeFlow: "Good progression",
		slides: [mockSlide],
		topIssues: [
			{
				issue: "Data overload",
				affectedSlides: ["slide-1"],
				fix: "Reduce data points",
			},
		],
	};

	it("transformPartnerSlideReview produces schema-valid output", () => {
		const result = transformPartnerSlideReview(mockSlide);
		const parsed = PartnerSuggestionOutputSchema.safeParse(result);
		expect(parsed.success).toBe(true);
	});

	it("transformPartnerReview produces schema-valid output", () => {
		const result = transformPartnerReview(mockReview);
		const parsed = PartnerReviewOutputSchema.safeParse(result);
		expect(parsed.success).toBe(true);
	});

	it("handles empty slides array with neutral default score of 3", () => {
		const emptyReview: PartnerReview = {
			...mockReview,
			slides: [],
		};
		const result = transformPartnerReview(emptyReview);
		const parsed = PartnerReviewOutputSchema.safeParse(result);
		expect(parsed.success).toBe(true);
		if (parsed.success) {
			// Empty slides returns 3 (neutral midpoint of 1-5 range) as schema-valid default
			expect(parsed.data.overallScores.scores.clarity).toBe(3);
			expect(parsed.data.overallScores.scores.relevance).toBe(3);
			expect(parsed.data.overallScores.scores.impact).toBe(3);
			expect(parsed.data.overallScores.scores.audienceAlignment).toBe(3);
		}
	});

	it("rejects output missing required fields", () => {
		// Simulate a broken transformer return (missing scores, priority, etc.)
		const broken = {
			slideId: "slide-1",
			headline: createHeading("Test", 3),
			// Missing: scores, priority, strengths, weaknesses, suggestion
		};
		const parsed = PartnerSuggestionOutputSchema.safeParse(broken);
		expect(parsed.success).toBe(false);
	});
});

describe("Validator Transformer Conformance", () => {
	const mockClaim: ValidatorClaim = {
		claim: "Revenue increased by 25%",
		verdict: "supported",
		confidence: 0.9,
		evidence: "Q3 earnings report",
		suggestion: "Add citation",
	};

	const mockSlide: ValidatorSlideReview = {
		slideId: "slide-1",
		claims: [mockClaim],
		dataQuality: "adequate",
		recommendation: "Strengthen evidence",
	};

	const mockReview: ValidatorReview = {
		overallDataQuality: "adequate",
		summary: "Most claims are well-supported",
		slides: [mockSlide],
		criticalFlags: [
			{
				slideId: "slide-1",
				issue: "Unverified statistic",
				severity: "medium",
			},
		],
	};

	it("transformValidatorClaim produces schema-valid output", () => {
		const result = transformValidatorClaim(mockClaim);
		const parsed = ValidatorClaimOutputSchema.safeParse(result);
		expect(parsed.success).toBe(true);
	});

	it("transformValidatorSlideReview produces schema-valid output", () => {
		const result = transformValidatorSlideReview(mockSlide);
		const parsed = ValidatorSlideOutputSchema.safeParse(result);
		expect(parsed.success).toBe(true);
	});

	it("transformValidatorReview produces schema-valid output", () => {
		const result = transformValidatorReview(mockReview);
		const parsed = ValidatorReviewOutputSchema.safeParse(result);
		expect(parsed.success).toBe(true);
	});

	it("handles null evidence in claim", () => {
		const claimNoEvidence: ValidatorClaim = {
			...mockClaim,
			evidence: null,
		};
		const result = transformValidatorClaim(claimNoEvidence);
		const parsed = ValidatorClaimOutputSchema.safeParse(result);
		expect(parsed.success).toBe(true);
		if (parsed.success) {
			expect(parsed.data.evidence).toBeNull();
		}
	});

	it("rejects output missing required fields", () => {
		// Simulate a broken transformer return (missing verdict, etc.)
		const broken = {
			claim: "Test claim",
			// Missing: verdict, evidence, suggestion
		};
		const parsed = ValidatorClaimOutputSchema.safeParse(broken);
		expect(parsed.success).toBe(false);
	});
});

describe("Whisperer Transformer Conformance", () => {
	const mockNotes: WhispererSlideNotes = {
		slideId: "slide-1",
		openingLine: "Let's look at the numbers",
		keyMessages: ["Growth is strong", "Margins improving"],
		transitionTo: "Now for the details",
		timingSeconds: 90,
		doNot: ["Don't read the slide"],
		audienceTip: "Pause for emphasis",
	};

	const mockReview: WhispererReview = {
		totalTimeMinutes: 15,
		paceNotes: "Good pace overall",
		slides: [mockNotes],
		openingHook: "Start with a question",
		closingStatement: "End with a call to action",
	};

	it("transformWhispererSlideNotes produces schema-valid output", () => {
		const result = transformWhispererSlideNotes(mockNotes);
		const parsed = WhispererSlideNotesOutputSchema.safeParse(result);
		expect(parsed.success).toBe(true);
	});

	it("transformWhispererReview produces schema-valid output", () => {
		const result = transformWhispererReview(mockReview);
		const parsed = WhispererReviewOutputSchema.safeParse(result);
		expect(parsed.success).toBe(true);
	});

	it("handles null audienceTip", () => {
		const notesNoTip: WhispererSlideNotes = {
			...mockNotes,
			audienceTip: null,
		};
		const result = transformWhispererSlideNotes(notesNoTip);
		const parsed = WhispererSlideNotesOutputSchema.safeParse(result);
		expect(parsed.success).toBe(true);
		if (parsed.success) {
			expect(parsed.data.audienceTip).toBeNull();
		}
	});

	it("rejects output missing required fields", () => {
		// Simulate a broken transformer return (missing keyMessages, etc.)
		const broken = {
			slideId: "slide-1",
			openingLine: createProseBlock("Test"),
			// Missing: keyMessages, transitionTo, timingSeconds, doNot
		};
		const parsed = WhispererSlideNotesOutputSchema.safeParse(broken);
		expect(parsed.success).toBe(false);
	});
});

describe("Editor Transformer Conformance", () => {
	const mockAction: EditorSlideAction = {
		slideId: "slide-1",
		action: "merge",
		mergeWith: "slide-2",
		reason: "Both slides cover similar ground",
		rewriteSuggestion: null,
	};

	const mockReview: EditorReview = {
		currentSlideCount: 10,
		recommendedSlideCount: 8,
		summary: "Some redundancy detected",
		slides: [mockAction],
		narrativeImpact: "Merging will improve flow",
		redundancyPairs: [
			{
				slideA: "slide-1",
				slideB: "slide-2",
				overlap: "Both discuss market size",
			},
		],
	};

	it("transformEditorSlideAction produces schema-valid output", () => {
		const result = transformEditorSlideAction(mockAction);
		const parsed = EditorSlideActionOutputSchema.safeParse(result);
		expect(parsed.success).toBe(true);
	});

	it("transformEditorReview produces schema-valid output", () => {
		const result = transformEditorReview(mockReview);
		const parsed = EditorReviewOutputSchema.safeParse(result);
		expect(parsed.success).toBe(true);
	});

	it("handles rewrite action with suggestion", () => {
		const rewriteAction: EditorSlideAction = {
			slideId: "slide-3",
			action: "rewrite",
			mergeWith: null,
			reason: "Headline is weak",
			rewriteSuggestion: "Change to: 'Key Drivers'",
		};
		const result = transformEditorSlideAction(rewriteAction);
		const parsed = EditorSlideActionOutputSchema.safeParse(result);
		expect(parsed.success).toBe(true);
		if (parsed.success) {
			expect(parsed.data.rewriteSuggestion).not.toBeNull();
		}
	});

	it("rejects output missing required fields", () => {
		// Simulate a broken transformer return (missing action, reason, etc.)
		const broken = {
			slideId: "slide-1",
			// Missing: action, mergeWith, reason, rewriteSuggestion
		};
		const parsed = EditorSlideActionOutputSchema.safeParse(broken);
		expect(parsed.success).toBe(false);
	});
});
