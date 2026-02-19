"use server";

import { enhanceAction } from "@kit/next/actions";
import { getLogger } from "@kit/shared/logger";
import { getSupabaseServerClient } from "@kit/supabase/server-client";
import pptxgen from "pptxgenjs";
import { z } from "zod";

import type { StoryboardSlide } from "../../_lib/types/storyboard.types";

const ExportSchema = z.object({
	presentationId: z.string().min(1),
});

export const exportPowerPointAction = enhanceAction(
	async (data, _user) => {
		const logger = await getLogger();
		const client = getSupabaseServerClient();

		// Fetch storyboard contents
		const { data: storyboard, error: storyboardError } = await client
			.from("storyboard_contents")
			.select("slides")
			.eq("presentation_id", data.presentationId)
			.single();

		if (storyboardError || !storyboard) {
			throw new Error("No storyboard found for this presentation");
		}

		// Fetch presentation title
		const { data: presentation } = await client
			.from("presentations")
			.select("title")
			.eq("id", data.presentationId)
			.single();

		const slides = (storyboard.slides ?? []) as unknown as StoryboardSlide[];

		if (slides.length === 0) {
			throw new Error("Storyboard has no slides to export");
		}

		// Generate PPTX
		const pptx = new pptxgen();
		pptx.title = presentation?.title ?? "Presentation";

		for (const [index, slide] of slides.entries()) {
			const pptxSlide = pptx.addSlide();
			const baseContent = slide.content || "";
			const bulletContent = formatSlideContentAsBullets(baseContent);
			const addStandardTitle = () => {
				pptxSlide.addText(slide.title, {
					x: "5%",
					y: "5%",
					w: "90%",
					h: "15%",
					fontSize: 24,
					bold: true,
					color: "1a1a2e",
				});
			};

			if (slide.layout === "title-only" || slide.layout === "section-divider") {
				pptxSlide.addText(slide.title, {
					x: "10%",
					y: "35%",
					w: "80%",
					h: "30%",
					fontSize: 36,
					bold: true,
					align: "center",
					color: "1a1a2e",
				});
			} else if (
				slide.layout === "title-two-column" ||
				slide.layout === "comparison"
			) {
				addStandardTitle();
				const leftContent = formatSlideContentAsBullets(
					slide.content_left || baseContent,
				);
				const rightContent = formatSlideContentAsBullets(
					slide.content_right || slide.visual_notes || "",
				);
				pptxSlide.addText(leftContent, {
					x: "5%",
					y: "25%",
					w: "42%",
					h: "65%",
					fontSize: 14,
					color: "333333",
				});
				pptxSlide.addText(rightContent, {
					x: "53%",
					y: "25%",
					w: "42%",
					h: "65%",
					fontSize: 14,
					color: "333333",
				});
			} else if (slide.layout === "blank") {
				if (baseContent) {
					pptxSlide.addText(bulletContent, {
						x: "8%",
						y: "10%",
						w: "84%",
						h: "80%",
						fontSize: 16,
						color: "333333",
					});
				}
			} else {
				addStandardTitle();
				let contentText = bulletContent;
				if (slide.layout === "image-text" && slide.visual_notes) {
					contentText = `${contentText}${contentText ? "\n\n" : ""}[Image placeholder: ${slide.visual_notes}]`;
				}
				if (slide.layout === "data-chart" && slide.evidence_needed) {
					contentText = `${contentText}${contentText ? "\n\n" : ""}[Chart placeholder: ${slide.evidence_needed}]`;
				}
				if (slide.layout === "quote") {
					const quoteText = baseContent ? `“${baseContent}”` : "";
					pptxSlide.addText(quoteText, {
						x: "10%",
						y: "35%",
						w: "80%",
						h: "30%",
						fontSize: 28,
						italic: true,
						align: "center",
						color: "1a1a2e",
					});
					if (slide.visual_notes) {
						pptxSlide.addText(`— ${slide.visual_notes}`, {
							x: "10%",
							y: "68%",
							w: "80%",
							h: "10%",
							fontSize: 14,
							align: "right",
							color: "666666",
						});
					}
				} else {
					pptxSlide.addText(contentText, {
						x: "5%",
						y: "25%",
						w: "90%",
						h: "65%",
						fontSize: 14,
						color: "333333",
					});
				}
			}

			addSlideNumberFooter(pptxSlide, index + 1, slides.length);

			// Add speaker notes
			if (slide.speaker_notes) {
				const notesText = extractTextFromTipTap(slide.speaker_notes);
				if (notesText) {
					pptxSlide.addNotes(notesText);
				}
			}
		}

		const buffer = (await pptx.write({ outputType: "nodebuffer" })) as Buffer;
		const base64Data = buffer.toString("base64");

		logger.info("PowerPoint exported", {
			presentationId: data.presentationId,
			slideCount: slides.length,
		});

		return {
			success: true,
			data: {
				base64: base64Data,
				filename: `${presentation?.title ?? "presentation"}.pptx`,
			},
		};
	},
	{
		schema: ExportSchema,
		auth: true,
	},
);

function formatSlideContentAsBullets(content: string): string {
	if (!content) return "";

	return content
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean)
		.map((line) => `• ${line}`)
		.join("\n");
}

function addSlideNumberFooter(
	slide: { addText: (text: string, options: Record<string, unknown>) => void },
	current: number,
	total: number,
) {
	slide.addText(`${current}/${total}`, {
		x: "90%",
		y: "94%",
		w: "8%",
		h: "4%",
		fontSize: 10,
		color: "666666",
		align: "right",
	});
}

function extractTextFromTipTap(json: unknown): string {
	if (!json || typeof json !== "object") return "";

	const node = json as Record<string, unknown>;

	if (node.text && typeof node.text === "string") {
		return node.text;
	}

	if (Array.isArray(node.content)) {
		return node.content
			.map((child: unknown) => extractTextFromTipTap(child))
			.filter(Boolean)
			.join("\n");
	}

	return "";
}
