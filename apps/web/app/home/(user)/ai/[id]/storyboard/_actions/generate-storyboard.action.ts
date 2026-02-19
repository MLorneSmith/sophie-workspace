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
				const slides = (existing.slides ?? []) as unknown as StoryboardSlide[];
				if (slides.length > 0) {
					return { success: true, data: { slides } };
				}
			}
		}

		// Fetch assemble_outputs for additional context
		const { data: assembleOutput } = await client
			.from("assemble_outputs")
			.select("presentation_type, question_type")
			.eq("presentation_id", data.presentationId)
			.maybeSingle();

		// Format outline for the prompt
		const outlineText = outlineSections
			.map((s, i) => `Section ${i + 1} - ${s.title}:\n${s.content}`)
			.join("\n\n");

		// Build AI prompt
		const systemPrompt = `You are a presentation storyboard designer. Given a presentation outline, generate slide layouts with content, speaker notes, and visual suggestions.

Return ONLY valid JSON in this exact format:
{
  "slides": [
    {
      "id": "slide-1",
      "title": "Slide Title",
      "layout": "title-content",
      "content": "Main content text for the slide body",
      "speaker_notes": { "type": "doc", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Notes for the presenter" }] }] },
      "visual_notes": "Suggestion for visual element (e.g., 'Chart showing growth trends')",
      "order": 0
    }
  ]
}

Layout options: "title-only", "title-content", "title-two-column"

Guidelines:
- Create 1-2 slides per outline section
- First slide should be a title slide (layout: "title-only")
- Last slide should be a conclusion/CTA
- Keep content concise - bullet points, not paragraphs
- Speaker notes should elaborate on key points
- Visual notes suggest charts, images, or diagrams`;

		const userPrompt = `Create a storyboard from this outline:

${outlineText}

${assembleOutput ? `Presentation type: ${assembleOutput.presentation_type}\nQuestion type: ${assembleOutput.question_type}` : ""}

Generate slides that bring this outline to life with clear layouts and content.`;

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
			slides = parsed.slides;
		} catch (parseError) {
			logger.error("Failed to parse AI storyboard response", {
				presentationId: data.presentationId,
				responseContent: response.content.substring(0, 500),
				error: parseError,
			});
			// Fallback: create basic slides from outline sections
			slides = outlineSections.map((section, idx) => ({
				id: `slide-${idx + 1}`,
				title: section.title,
				layout:
					idx === 0 ? ("title-only" as const) : ("title-content" as const),
				content: section.content,
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
			}));
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
