"use server";

import {
	ConfigManager,
	type ChatCompletionOptions,
	type ChatMessage,
	createOpenAIOnlyConfig,
	getChatCompletion,
} from "@kit/ai-gateway";
import { enhanceAction } from "@kit/next/actions";
import { getLogger } from "@kit/shared/logger";
import { getSupabaseServerClient } from "@kit/supabase/server-client";
import { z } from "zod";

import type { StoryboardSlide } from "../../_lib/types/storyboard.types";

interface TiptapNode {
	type: string;
	content?: TiptapNode[];
	attrs?: Record<string, unknown>;
	text?: string;
}

function extractTextFromTiptap(node: unknown): string {
	if (!node || typeof node !== "object") return "";

	const n = node as TiptapNode;

	if (n.text && typeof n.text === "string") return n.text;

	if (Array.isArray(n.content)) {
		return n.content.map((child) => extractTextFromTiptap(child)).join("\n");
	}

	return "";
}

function extractSectionsFromOutlineDoc(
	doc: unknown,
): Array<{ title: string; content: string }> {
	if (!doc || typeof doc !== "object") return [];

	const d = doc as { content?: TiptapNode[] };
	if (!Array.isArray(d.content)) return [];

	const sections: Array<{ title: string; content: string }> = [];
	let currentSection: { title: string; content: string[] } | null = null;

	for (const node of d.content) {
		if (
			node.type === "heading" &&
			node.attrs &&
			(node.attrs.level === 2 || node.attrs.level === 1)
		) {
			// Save previous section
			if (currentSection) {
				sections.push({
					title: currentSection.title,
					content: currentSection.content.filter(Boolean).join("\n"),
				});
			}
			const title = extractTextFromTiptap(node).trim();
			if (title && title !== "Presentation Outline") {
				currentSection = { title, content: [] };
			}
		} else if (currentSection) {
			const text = extractTextFromTiptap(node).trim();
			if (text) {
				currentSection.content.push(text);
			}
		}
	}

	// Save last section
	if (currentSection) {
		sections.push({
			title: currentSection.title,
			content: currentSection.content.filter(Boolean).join("\n"),
		});
	}

	return sections;
}

const GenerateStoryboardSchema = z.object({
	presentationId: z.string().min(1),
	forceRegenerate: z.boolean().default(false),
});

function formatContextForPrompt(value: unknown): string {
	if (value == null) return "";
	if (typeof value === "string") return value;

	try {
		return JSON.stringify(value, null, 2);
	} catch {
		return "";
	}
}

<<<<<<< HEAD
function splitContentForTwoColumns(content: string): {
	left: string;
	right: string;
} {
	if (!content.trim()) {
		return { left: "", right: "" };
	}

	const lines = content
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean);

	if (lines.length <= 1) {
		return { left: content, right: "" };
	}

	const midpoint = Math.ceil(lines.length / 2);
	return {
		left: lines.slice(0, midpoint).join("\n"),
		right: lines.slice(midpoint).join("\n"),
	};
}

=======
>>>>>>> origin/staging
function normalizeGeneratedSlide(
	slide: Partial<StoryboardSlide>,
	index: number,
): StoryboardSlide {
	const content = slide.content ?? "";
	const isTwoColumnLayout =
		slide.layout === "title-two-column" || slide.layout === "comparison";
	const splitFallback = isTwoColumnLayout
		? splitContentForTwoColumns(content)
		: { left: "", right: "" };

	return {
		id: slide.id ?? `slide-${index + 1}`,
		title: slide.title ?? "Untitled slide",
		layout: slide.layout ?? "title-content",
		content,
		content_left: slide.content_left ?? splitFallback.left,
		content_right: slide.content_right ?? splitFallback.right,
		purpose: slide.purpose ?? "",
		takeaway_headline: slide.takeaway_headline ?? "",
		evidence_needed: slide.evidence_needed ?? "",
		speaker_notes:
			slide.speaker_notes ??
			({
				type: "doc",
				content: [{ type: "paragraph", content: [] }],
			} as StoryboardSlide["speaker_notes"]),
		visual_notes: slide.visual_notes ?? "",
		order: slide.order ?? index,
	};
}

export const generateStoryboardAction = enhanceAction(
	async (data, user) => {
		const logger = await getLogger();
		const client = getSupabaseServerClient();

		// Fetch outline_contents for this presentation
		const { data: outlineData, error: outlineError } = await client
			.from("outline_contents")
			.select("sections")
			.eq("presentation_id", data.presentationId)
			.maybeSingle();

		if (outlineError) {
			logger.error("Failed to fetch outline contents", {
				presentationId: data.presentationId,
				error: outlineError,
			});
			throw new Error("Failed to fetch outline contents");
		}

		if (!outlineData) {
			throw new Error("No outline found. Complete the outline step first.");
		}

		// Extract sections from the TipTap outline document
		const outlineSections = extractSectionsFromOutlineDoc(outlineData.sections);

		if (outlineSections.length === 0) {
			throw new Error(
				"Outline has no content. Add content in the outline step first.",
			);
		}

		// Check if storyboard already exists (unless force regenerating)
		if (!data.forceRegenerate) {
			const { data: existing } = await client
				.from("storyboard_contents")
				.select("id, slides")
				.eq("presentation_id", data.presentationId)
				.maybeSingle();

			if (existing) {
				const slides = (
					(existing.slides ?? []) as unknown as StoryboardSlide[]
				).map((slide, idx) => normalizeGeneratedSlide(slide, idx));
				if (slides.length > 0) {
					return { success: true, data: { slides } };
				}
			}
		}

		// Fetch upstream context (if present). Missing records should not block generation.
		const [
			{ data: audienceProfile, error: audienceError },
			{ data: assembleOutput, error: assembleError },
		] = await Promise.all([
			client
				.from("audience_profiles")
				.select("brief_structured, brief_text")
				.eq("presentation_id", data.presentationId)
				.maybeSingle(),
			client
				.from("assemble_outputs")
				.select(
					"presentation_type, question_type, situation, complication, argument_map",
				)
				.eq("presentation_id", data.presentationId)
				.maybeSingle(),
		]);

		if (audienceError) {
			logger.warn("Failed to fetch audience profile for storyboard context", {
				presentationId: data.presentationId,
				error: audienceError,
			});
		}

		if (assembleError) {
			logger.warn("Failed to fetch assemble output for storyboard context", {
				presentationId: data.presentationId,
				error: assembleError,
			});
		}

		// Format outline for the prompt
		const outlineText = outlineSections
			.map((s, i) => `Section ${i + 1} - ${s.title}:\n${s.content}`)
			.join("\n\n");

		const audienceBriefStructured = formatContextForPrompt(
			audienceProfile?.brief_structured,
		);
		const audienceBriefText = audienceProfile?.brief_text?.trim() ?? "";
		const argumentMapText = formatContextForPrompt(
			assembleOutput?.argument_map,
		);
		const scqaContext = [
			assembleOutput?.situation
				? `Situation: ${assembleOutput.situation}`
				: "Situation: Not provided",
			assembleOutput?.complication
				? `Complication: ${assembleOutput.complication}`
				: "Complication: Not provided",
			assembleOutput?.question_type
				? `Question type: ${assembleOutput.question_type}`
				: "Question type: Not provided",
			assembleOutput?.presentation_type
				? `Presentation type: ${assembleOutput.presentation_type}`
				: "Presentation type: Not provided",
		].join("\n");

		// Build AI prompt
		const systemPrompt = `You are a presentation storyboard designer. Given an outline plus upstream workflow context, generate slide layouts with content, speaker notes, and visual suggestions.

Use upstream context when available:
- Audience brief (structured/text): adapt communication style, tone, what to lead with, and data density.
- SCQA context (situation + complication): make the storyline reflect the business context.
- Argument map (pyramid principle tree): align slide purposes and sequence to argument nodes and supporting points.
- Presentation type awareness: tailor slide count, depth, and layout choices to match presentation intent.

If any upstream context is missing, gracefully fall back to strong generic best practices.

Return ONLY valid JSON in this exact format:
{
  "slides": [
    {
      "id": "slide-1",
      "title": "Slide Title",
      "layout": "title-content",
      "content": "Main content text for the slide body",
      "content_left": "Left column content when needed",
      "content_right": "Right column content when needed",
      "purpose": "What this slide does for the narrative",
      "takeaway_headline": "The one sentence the audience should remember",
      "evidence_needed": "Specific data/proof needed to support the claims",
      "speaker_notes": { "type": "doc", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Notes for the presenter" }] }] },
      "visual_notes": "Suggestion for visual element (e.g., 'Chart showing growth trends')",
      "order": 0
    }
  ]
}

Layout options:
- "title-only"
- "title-content"
- "title-two-column"
- "section-divider"
- "image-text"
- "comparison"
- "data-chart"
- "quote"
- "blank"

Layout guidance:
- Section transitions/headings → "section-divider"
- Data/metrics-heavy slides → "data-chart"
- Side-by-side contrasts → "comparison"
- Quotes/key statements → "quote"
- Visual/image-led slides → "image-text"
- Use "title-two-column" for structured two-column lists or arguments

Guidelines:
- Create 1-2 slides per outline section, adjusted for presentation type and narrative complexity
- First slide should be a title slide (layout: "title-only")
- Last slide should be a conclusion/CTA
- Keep content concise - bullet points, not paragraphs
- Takeaway headlines must be audience-specific (e.g., lead with numbers for a data-driven CFO)
- Purpose must clearly state which argument-map node or narrative step the slide advances
- Evidence suggestions must be specific and actionable (metrics, sources, benchmarks, case examples)
- Layout choices must match content type (data → "data-chart", comparisons → "comparison", quotes → "quote", transitions → "section-divider")
<<<<<<< HEAD
- For "title-two-column" and "comparison" layouts, always populate both "content_left" and "content_right" with meaningful text (do not leave them empty or only use "content")
=======
>>>>>>> origin/staging
- Speaker notes should elaborate key points in a style suited to the audience's communication preferences
- Visual notes should suggest concrete charts, images, or diagrams tied to the claim`;

		const userPrompt = `Create a storyboard from this outline:

${outlineText}

Audience brief summary (if available):
${
	audienceBriefText || audienceBriefStructured
		? `${audienceBriefText || "No freeform audience brief text provided."}\n${audienceBriefStructured ? `Structured audience brief:\n${audienceBriefStructured}` : ""}`
		: "Not provided. Use generic audience-aware communication best practices."
}

SCQA context:
${scqaContext}

Argument map (pyramid principle tree):
${argumentMapText || "Not provided."}

Instruction: Use audience preferences (tone, communication style, what to lead with, and data density) to shape headlines, evidence depth, structure, and speaker notes.`;

		const messages: ChatMessage[] = [
			{ role: "system", content: systemPrompt },
			{ role: "user", content: userPrompt },
		];

		const config = createOpenAIOnlyConfig({
			userId: user.id,
			context: "storyboard-generation",
		});
		const normalizedConfig = ConfigManager.normalizeConfig(config);

		if (!normalizedConfig) {
			throw new Error("Failed to normalize AI config");
		}

		const response = await getChatCompletion(messages, {
			config: normalizedConfig,
			userId: user.id,
			feature: "workflow-storyboard-generation",
		} as ChatCompletionOptions);

		// Parse AI response
		let slides: StoryboardSlide[];
		try {
			const jsonMatch = response.content.match(/\{[\s\S]*\}/);
			if (!jsonMatch) {
				throw new Error("No JSON found in AI response");
			}
			const parsed = JSON.parse(jsonMatch[0]);
			slides = Array.isArray(parsed.slides)
				? parsed.slides.map((slide: Partial<StoryboardSlide>, idx: number) =>
						normalizeGeneratedSlide(slide, idx),
					)
				: [];
		} catch (parseError) {
			logger.error("Failed to parse AI storyboard response", {
				presentationId: data.presentationId,
				responseContent: response.content.substring(0, 500),
				error: parseError,
			});
			// Fallback: create basic slides from outline sections
			slides = outlineSections.map((section, idx) =>
				normalizeGeneratedSlide(
					{
						id: `slide-${idx + 1}`,
						title: section.title,
						layout:
							idx === 0 ? ("title-only" as const) : ("title-content" as const),
						content: section.content,
						purpose: `Advance section: ${section.title}`,
						takeaway_headline: section.title,
						evidence_needed: "",
						speaker_notes: {
							type: "doc",
							content: [
								{
									type: "paragraph",
									content: [{ type: "text", text: `Cover: ${section.title}` }],
								},
							],
						},
						visual_notes: "",
						order: idx,
					},
					idx,
				),
			);
		}

		// Fetch presentation for user/account context
		const { data: presentation } = await client
			.from("presentations")
			.select("user_id, account_id")
			.eq("id", data.presentationId)
			.single();

		if (!presentation) {
			throw new Error("Presentation not found");
		}

		// Upsert storyboard_contents
		const { error: upsertError } = await client
			.from("storyboard_contents")
			.upsert(
				{
					presentation_id: data.presentationId,
					user_id: presentation.user_id,
					account_id: presentation.account_id,
					slides: JSON.parse(JSON.stringify(slides)),
				},
				{ onConflict: "presentation_id" },
			);

		if (upsertError) throw upsertError;

		logger.info("Storyboard generated successfully", {
			presentationId: data.presentationId,
			slideCount: slides.length,
			cost: response.metadata.cost,
		});

		return {
			success: true,
			data: { slides },
		};
	},
	{
		schema: GenerateStoryboardSchema,
		auth: true,
	},
);
