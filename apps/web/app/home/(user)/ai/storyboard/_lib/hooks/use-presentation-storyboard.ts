"use client";

import type { Json } from "@kit/supabase/database";
import { useSupabase } from "@kit/supabase/hooks/use-supabase";
import { toast } from "@kit/ui/sonner";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";

// Client-safe logger wrapper
const logger = {
	error: (...args: unknown[]) => {
		if (process.env.NODE_ENV === "development") {
			// biome-ignore lint/suspicious/noConsole: Development logging is allowed
			console.error(...args);
		}
	},
};

import type {
	BuildingBlocksSubmission,
	Slide,
	StoryboardData,
	TipTapDocument,
	TipTapNode,
} from "../types";

// Basic transformer from TipTap document to storyboard format
function _generateStoryboardFromOutline(
	outline: TipTapDocument | unknown,
): StoryboardData {
	let slideCount = 0;
	const slides: Slide[] = [];
	const title = extractTitle(outline) || "Untitled Presentation";

	// Process the content to extract slides
	if (
		outline &&
		typeof outline === "object" &&
		"content" in outline &&
		Array.isArray(outline.content)
	) {
		let currentSlide: Slide | null = null;

		for (const node of outline.content) {
			// If it's a heading, create a new slide
			if (node.type === "heading") {
				const headingLevel = node.attrs?.level || 1;
				const headingText = extractTextFromNode(node);

				// Level 1 and 2 headings become slides
				if (headingLevel <= 2) {
					// Save the previous slide if we have one
					if (currentSlide) {
						slides.push(currentSlide);
					}

					// Create a new slide
					currentSlide = {
						id: `slide-${Date.now()}-${slideCount++}`,
						title: headingText,
						headline: headingText, // Add required headline property
						layoutId: headingLevel === 1 ? "title" : "content",
						content: [],
						order: slides.length,
					};
				} else if (currentSlide) {
					// Add lower-level headings as content to the current slide
					currentSlide.content.push({
						id: `content-${Date.now()}-${Math.random()}`,
						area: "content1",
						type: "text",
						text: headingText,
						columnIndex: 0,
					});
				}
			} else if (node.type === "paragraph" && currentSlide) {
				// Add paragraphs as text content
				currentSlide.content.push({
					id: `content-${Date.now()}-${Math.random()}`,
					area: "content1",
					type: "text",
					text: extractTextFromNode(node),
					columnIndex: 0,
				});
			} else if (
				(node.type === "bulletList" || node.type === "orderedList") &&
				currentSlide
			) {
				// Process list items
				_processList(node, currentSlide, "bullet");
			}
		}

		// Add the last slide if we have one
		if (currentSlide) {
			slides.push(currentSlide);
		}
	}

	return {
		title,
		slides,
	};
}

function extractTitle(outline: unknown): string | null {
	// Try to find the first level 1 heading
	if (
		outline &&
		typeof outline === "object" &&
		"content" in outline &&
		Array.isArray(outline.content)
	) {
		for (const node of outline.content) {
			if (
				node &&
				typeof node === "object" &&
				"type" in node &&
				node.type === "heading" &&
				"attrs" in node &&
				node.attrs &&
				typeof node.attrs === "object" &&
				"level" in node.attrs &&
				node.attrs.level === 1
			) {
				return extractTextFromNode(node as TipTapNode);
			}
		}
	}
	return null;
}

function extractTextFromNode(node: TipTapNode): string {
	if (!node.content) return "";

	return node.content
		.map((contentNode: TipTapNode) => {
			if (contentNode.type === "text") {
				return contentNode.text;
			}
			return extractTextFromNode(contentNode);
		})
		.join("");
}

function _processList(node: TipTapNode, slide: Slide, type: string) {
	if (!node.content) return;

	for (const item of node.content) {
		if (item.type === "listItem" && item.content) {
			for (const itemContent of item.content) {
				if (itemContent.type === "paragraph") {
					slide.content.push({
						id: `content-${Date.now()}-${Math.random()}`,
						area: "content1",
						type: type as
							| "text"
							| "bullet"
							| "subbullet"
							| "image"
							| "chart"
							| "table",
						text: extractTextFromNode(itemContent),
						columnIndex: 0,
					});
				} else if (
					itemContent.type === "bulletList" ||
					itemContent.type === "orderedList"
				) {
					_processList(itemContent, slide, "subbullet");
				}
			}
		}
	}
}

export function usePresentationStoryboard(presentationId: string) {
	const supabase = useSupabase();
	const [isUpdating, setIsUpdating] = useState(false);

	const fetchStoryboard = useCallback(async () => {
		// First try fetching with the storyboard column
		const { data, error } = await supabase
			.from("building_blocks_submissions")
			.select("id, outline, storyboard, title")
			.eq("id", presentationId)
			.single();

		if (error) {
			// If there's an error related to the storyboard column not existing,
			// try without that column
			if (error.message.includes("column 'storyboard' does not exist")) {
				const { data: fallbackData, error: fallbackError } = await supabase
					.from("building_blocks_submissions")
					.select("id, outline, title")
					.eq("id", presentationId)
					.single();

				if (fallbackError) {
					throw new Error(
						`Error fetching presentation: ${fallbackError.message}`,
					);
				}

				// Generate a storyboard from the outline since we don't have storyboard data
				try {
					const outline =
						typeof fallbackData.outline === "string"
							? JSON.parse(fallbackData.outline)
							: fallbackData.outline;

					return _generateStoryboardFromOutline(outline);
				} catch (err) {
					logger.error("Failed to generate storyboard from outline:", {
						error: err,
						presentationId,
						operation: "generate_storyboard_fallback",
					});
					throw new Error("Failed to generate storyboard from outline");
				}
			} else {
				// If it's a different error, throw it
				throw new Error(`Error fetching presentation: ${error.message}`);
			}
		}

		// Cast data to our interface
		const typedData = data as unknown as BuildingBlocksSubmission;

		// If we have storyboard data, return it
		if (typedData.storyboard) {
			return typedData.storyboard;
		}

		// Otherwise, generate a storyboard from the outline
		try {
			const outline =
				typeof typedData.outline === "string"
					? JSON.parse(typedData.outline)
					: typedData.outline;

			return _generateStoryboardFromOutline(outline);
		} catch (err) {
			logger.error("Failed to generate storyboard from outline:", {
				error: err,
				presentationId,
				operation: "generate_storyboard_main",
			});
			throw new Error("Failed to generate storyboard from outline");
		}
	}, [presentationId, supabase]);

	const { data, isLoading, isError, refetch } = useQuery({
		queryKey: ["presentation-storyboard", presentationId],
		queryFn: fetchStoryboard,
		enabled: !!presentationId,
	});

	const saveStoryboard = useCallback(
		async (storyboardData: StoryboardData) => {
			try {
				setIsUpdating(true);

				// Try to update with storyboard
				const result = await supabase
					.from("building_blocks_submissions")
					.update({
						// Use a type assertion to tell TypeScript we know what we're doing
						storyboard: storyboardData as unknown as Json,
					})
					.eq("id", presentationId);

				if (result.error) {
					// If the storyboard column doesn't exist, the schema migration may not have run yet
					if (
						result.error.message.includes("column 'storyboard' does not exist")
					) {
						toast.error(
							"Storyboard feature is not fully set up yet. Database migration needed.",
						);
						logger.error("Storyboard column missing from database:", {
							error: result.error,
							presentationId,
							operation: "save_storyboard",
						});
					} else {
						throw result.error;
					}
				}

				// Refetch to ensure we have the latest data
				await refetch();
				return true;
			} catch (error) {
				logger.error("Failed to save storyboard:", {
					error,
					presentationId,
					operation: "save_storyboard",
				});
				toast.error("Failed to save storyboard");
				return false;
			} finally {
				setIsUpdating(false);
			}
		},
		[presentationId, supabase, refetch],
	);

	return {
		data,
		isLoading,
		isError,
		saveStoryboard,
		isUpdating,
	};
}
