"use server";

import { type ChatMessage, getChatCompletion } from "@kit/ai-gateway";
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

	if (currentSection) {
		sections.push({
			title: currentSection.title,
			content: currentSection.content.filter(Boolean).join("\n"),
		});
	}

	return sections;
}

const RegenerateSlideSchema = z.object({
	presentationId: z.string().min(1),
	slideId: z.string().min(1),
	slideIndex: z.number().int().min(0),
	totalSlides: z.number().int().positive(),
	slideTitle: z.string().min(1),
	slidePurpose: z.string().optional(),
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

function normalizeGeneratedSlide(
	slide: Partial<StoryboardSlide>,
	fallback: StoryboardSlide,
): StoryboardSlide {
	return {
		id: fallback.id,
		title: slide.title ?? fallback.title,
		layout: slide.layout ?? fallback.layout,
		content: slide.content ?? "",
		content_left: slide.content_left ?? "",
		content_right: slide.content_right ?? "",
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
		order: fallback.order,
	};
}

export const regenerateSlideAction = enhanceAction(
	async (data, user) => {
		const logger = await getLogger();
		const client = getSupabaseServerClient();

		const [
			{ data: outlineData, error: outlineError },
			{ data: audienceProfile, error: audienceError },
			{ data: assembleOutput, error: assembleError },
			{ data: storyboardContent, error: storyboardError },
		] = await Promise.all([
			client
				.from("outline_contents")
				.select("sections")
				.eq("presentation_id", data.presentationId)
				.maybeSingle(),
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
			client
				.from("storyboard_contents")
				.select("slides")
				.eq("presentation_id", data.presentationId)
				.maybeSingle(),
		]);

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

		if (storyboardError) {
			logger.error("Failed to fetch storyboard contents", {
				presentationId: data.presentationId,
				error: storyboardError,
			});
			throw new Error("Failed to fetch existing storyboard");
		}

		const existingSlides = (
			(storyboardContent?.slides as StoryboardSlide[] | null) ?? []
		)
			.slice()
			.sort((a, b) => a.order - b.order);
		const fallbackSlide = existingSlides.find(
			(slide) => slide.id === data.slideId,
		);

		if (!fallbackSlide) {
			throw new Error("Slide not found in storyboard");
		}

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

		const outlineSections = extractSectionsFromOutlineDoc(outlineData.sections);
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

		const previousSlide = existingSlides[data.slideIndex - 1];
		const nextSlide = existingSlides[data.slideIndex + 1];

		const systemPrompt = `You are regenerating a single slide in a presentation storyboard. Return ONLY valid JSON for one slide object.

Return JSON in this exact format:
{
  "slide": {
    "id": "slide-3",
    "title": "Slide Title",
    "layout": "title-content",
    "content": "Main content text for the slide body",
    "content_left": "Left column content when needed",
    "content_right": "Right column content when needed",
    "purpose": "What this slide does for the narrative",
    "takeaway_headline": "The one sentence the audience should remember",
    "evidence_needed": "Specific data/proof needed to support the claims",
    "speaker_notes": { "type": "doc", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Notes for the presenter" }] }] },
    "visual_notes": "Suggestion for visual element",
    "order": 2
  }
}

Rules:
- Keep the exact same id and order provided by the user.
- Regenerate only this slide, not the whole deck.
- Make the slide flow naturally between previous and next slides.
- Choose layout based on content type.
- Keep content concise and presentation-ready.`;

		const userPrompt = `Regenerate slide ${data.slideIndex + 1} of ${data.totalSlides}.

Current slide info:
- id: ${data.slideId}
- order: ${fallbackSlide.order}
- title: ${data.slideTitle}
- purpose: ${data.slidePurpose?.trim() || "Not provided"}

Surrounding slide context:
- Previous slide: ${previousSlide ? `${previousSlide.title} (${previousSlide.purpose || "No purpose provided"})` : "None - this is the first slide"}
- Next slide: ${nextSlide ? `${nextSlide.title} (${nextSlide.purpose || "No purpose provided"})` : "None - this is the last slide"}

Presentation outline:
${outlineText || "Not provided."}

Audience brief summary (if available):
${
	audienceBriefText || audienceBriefStructured
		? `${audienceBriefText || "No freeform audience brief text provided."}\n${audienceBriefStructured ? `Structured audience brief:\n${audienceBriefStructured}` : ""}`
		: "Not provided. Use generic audience-aware communication best practices."
}

SCQA context:
${scqaContext}

Argument map:
${argumentMapText || "Not provided."}

Return one regenerated slide that fits the narrative flow and keeps the same id/order.`;

		const messages: ChatMessage[] = [
			{ role: "system", content: systemPrompt },
			{ role: "user", content: userPrompt },
		];

		const response = await getChatCompletion(messages, {
			model: "gpt-4o",
			virtualKey: process.env.BIFROST_VK_WORKFLOW_STORYBOARD,
			userId: user.id,
			feature: "workflow-storyboard-generation",
		});

		let regeneratedSlide: StoryboardSlide;
		try {
			const jsonMatch = response.content.match(/\{[\s\S]*\}/);
			if (!jsonMatch) {
				throw new Error("No JSON found in AI response");
			}
			const parsed = JSON.parse(jsonMatch[0]);
			if (!parsed.slide || typeof parsed.slide !== "object") {
				throw new Error("Invalid slide response");
			}
			regeneratedSlide = normalizeGeneratedSlide(
				parsed.slide as Partial<StoryboardSlide>,
				fallbackSlide,
			);
		} catch (parseError) {
			logger.error("Failed to parse AI single slide response", {
				presentationId: data.presentationId,
				slideId: data.slideId,
				responseContent: response.content.substring(0, 500),
				error: parseError,
			});
			throw new Error("Failed to regenerate slide");
		}

		const updatedSlides = existingSlides.map((slide) =>
			slide.id === data.slideId ? regeneratedSlide : slide,
		);

		const { error: updateError } = await client
			.from("storyboard_contents")
			.update({ slides: JSON.parse(JSON.stringify(updatedSlides)) })
			.eq("presentation_id", data.presentationId);

		if (updateError) {
			throw updateError;
		}

		logger.info("Slide regenerated successfully", {
			presentationId: data.presentationId,
			slideId: data.slideId,
			cost: response.metadata.cost,
		});

		return {
			success: true,
			data: { slide: regeneratedSlide },
		};
	},
	{
		schema: RegenerateSlideSchema,
		auth: true,
	},
);
