"use client";

import { toast } from "@kit/ui/sonner";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
	type BuildingBlocksSubmission,
	type LayoutTemplate,
	PRESET_LAYOUTS,
	type Slide,
	type StoryboardData,
	type StoryboardSlide,
	type TipTapDocument,
	type TipTapNode,
	type TipTapTextNode,
} from "../types/index";

/**
 * StoryboardService - Handles data operations for the storyboard system
 * Responsible for fetching, saving, and transforming presentation data
 */
export class StoryboardService {
	/**
	 * Constructor for the StoryboardService
	 * @param supabase Supabase client for database operations
	 */
	constructor(private supabase: SupabaseClient) {}

	/**
	 * Fetch a presentation's storyboard data or generate one from its outline
	 * @param submissionId The ID of the presentation to fetch
	 * @returns Promise resolving to the storyboard data
	 */
	async getStoryboard(submissionId: string): Promise<StoryboardData> {
		// First try fetching with the storyboard column
		const { data, error } = await this.supabase
			.from("building_blocks_submissions")
			.select("id, outline, storyboard, title")
			.eq("id", submissionId)
			.single();

		if (error) {
			// If there's an error related to the storyboard column not existing,
			// try without that column
			if (error.message.includes("column 'storyboard' does not exist")) {
				const { data: fallbackData, error: fallbackError } = await this.supabase
					.from("building_blocks_submissions")
					.select("id, outline, title")
					.eq("id", submissionId)
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

					const storyboard = this.generateStoryboardFromOutline(
						outline,
						fallbackData.title || "Untitled Presentation",
					);

					// Save the generated storyboard if possible (will silently fail if column doesn't exist yet)
					try {
						await this.saveStoryboard(submissionId, storyboard);
					} catch (_saveError) {
						// TODO: Async logger needed
						// TODO: Fix logger call - was: warn
					}

					return storyboard;
				} catch (_err) {
					// TODO: Async logger needed
					// TODO: Fix logger call - was: error
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

			const storyboard = this.generateStoryboardFromOutline(
				outline,
				typedData.title || "Untitled Presentation",
			);

			// Save the generated storyboard
			await this.saveStoryboard(submissionId, storyboard);

			return storyboard;
		} catch (_err) {
			// TODO: Async logger needed
			// TODO: Fix logger call - was: error
			throw new Error("Failed to generate storyboard from outline");
		}
	}

	/**
	 * Save storyboard data for a presentation
	 * @param submissionId The ID of the presentation to update
	 * @param storyboardData The storyboard data to save
	 * @returns Promise resolving to boolean indicating success
	 */
	async saveStoryboard(
		submissionId: string,
		storyboardData: StoryboardData,
	): Promise<boolean> {
		try {
			// Try to update with storyboard
			const result = await this.supabase
				.from("building_blocks_submissions")
				.update({
					// Use a type assertion to tell TypeScript we know what we're doing
					storyboard: storyboardData,
				} as Partial<BuildingBlocksSubmission>)
				.eq("id", submissionId);

			if (result.error) {
				// If the storyboard column doesn't exist, the schema migration may not have run yet
				if (
					result.error.message.includes("column 'storyboard' does not exist")
				) {
					toast.error(
						"Storyboard feature is not fully set up yet. Database migration needed.",
					);
					// TODO: Async logger needed
					// TODO: Fix logger call - was: error
					return false;
				}
				throw result.error;
			}

			return true;
		} catch (_error) {
			// TODO: Async logger needed
			// TODO: Fix logger call - was: error
			toast.error("Failed to save storyboard");
			return false;
		}
	}

	/**
	 * List all presentations available to the user
	 * @returns Promise resolving to an array of presentation summaries
	 */
	async listPresentations(): Promise<BuildingBlocksSubmission[]> {
		try {
			const { data, error } = await this.supabase
				.from("building_blocks_submissions")
				.select("id, title, created_at")
				.order("created_at", { ascending: false });

			if (error) {
				throw error;
			}

			return data as BuildingBlocksSubmission[];
		} catch (_error) {
			// TODO: Async logger needed
			// TODO: Fix logger call - was: error
			throw new Error("Failed to list presentations");
		}
	}

	/**
	 * Generate a PowerPoint file from storyboard data
	 * @param storyboardData The storyboard data to generate from
	 * @returns Promise resolving to ArrayBuffer containing the PowerPoint file
	 */
	async generatePowerPoint(
		_storyboardData: StoryboardData,
	): Promise<ArrayBuffer> {
		try {
			// In the real implementation, this would use PptxGenJS
			// For now, we'll return a placeholder implementation
			throw new Error("PowerPoint generation not implemented yet");
		} catch (_error) {
			// TODO: Async logger needed
			// TODO: Fix logger call - was: error
			throw new Error("Failed to generate PowerPoint");
		}
	}

	/**
	 * Transform a TipTap JSON document into storyboard format
	 * @param outline The TipTap JSON document
	 * @param title Optional title for the presentation
	 * @returns StoryboardData representing the presentation
	 */
	private generateStoryboardFromOutline(
		outline: TipTapDocument | unknown,
		title = "Untitled Presentation",
	): StoryboardData {
		let slideCount = 0;
		const slides: StoryboardSlide[] = []; // Change type to StoryboardSlide[]
		const extractedTitle = this.extractTitle(outline) || title;

		// Process the content to extract slides
		if (outline && (outline as TipTapDocument).content) {
			let currentStoryboardSlide: StoryboardSlide | null = null;

			for (const node of (outline as TipTapDocument).content as TipTapNode[]) {
				// If it's a heading, create a new slide
				if (node.type === "heading") {
					const headingLevel = node.attrs?.level || 1;
					const headingText = this.extractTextFromNode(node);

					// Level 1 and 2 headings typically define slides
					if (headingLevel <= 2) {
						// Save the previous slide if we have one
						if (currentStoryboardSlide) {
							slides.push(currentStoryboardSlide);
						}

						// Determine initial layout based on heading level
						const initialLayoutId = headingLevel === 1 ? "title" : "content";
						const layoutTemplate = PRESET_LAYOUTS.find(
							(layout: LayoutTemplate) => layout.id === initialLayoutId,
						);

						// Create a new StoryboardSlide
						currentStoryboardSlide = {
							id: `slide-${Date.now()}-${slideCount++}`,
							headline: headingText, // Use headline instead of title
							order: slides.length,
							storyboard: {
								layoutId: initialLayoutId,
								subHeadlines: [], // Initialize subheadlines array
								contentAreas: layoutTemplate ? layoutTemplate.contentAreas : [], // Use content areas from layout template
								settings: {
									chartTypes: {},
									imageSettings: {},
									tableSettings: {},
								},
							},
						};
					} else if (currentStoryboardSlide) {
						// Add subheadline if it's a lower level heading (Level 3)
						if (headingLevel === 3) {
							currentStoryboardSlide.storyboard.subHeadlines.push(headingText);
						}
						// Note: Paragraphs, lists, etc. from the outline are *not* stored directly in the storyboard JSONB.
						// The storyboard only defines the *structure* (layout, content areas) and *settings*.
						// The actual content (text, bullet points) is fetched from the original 'outline' JSON when needed for display or generation.
						// So, we don't need to process paragraphs, lists, etc. here into `contentAreas`.
						// The `contentAreas` are defined by the selected `layoutId`.
					}
				}
				// Ignore other node types (paragraph, list, etc.) as their content is not stored in the storyboard JSONB
			}

			// Add the last slide if we have one
			if (currentStoryboardSlide) {
				slides.push(currentStoryboardSlide);
			}
		}

		// Create a default title slide if no slides were created
		if (slides.length === 0) {
			const titleLayout = PRESET_LAYOUTS.find(
				(layout: LayoutTemplate) => layout.id === "title",
			);
			slides.push({
				id: `slide-${Date.now()}-0`,
				headline: extractedTitle,
				order: 0,
				storyboard: {
					layoutId: "title",
					subHeadlines: [],
					contentAreas: titleLayout ? titleLayout.contentAreas : [],
					settings: {
						chartTypes: {},
						imageSettings: {},
						tableSettings: {},
					},
				},
			});
		}

		// Transform StoryboardSlide[] to Slide[] to match expected type
		const transformedSlides: Slide[] = slides.map((slide) => ({
			id: slide.id,
			slideType:
				slide.storyboard.layoutId === "title" ? "title" : ("content" as const),
			title: slide.headline,
			subheadlines: slide.storyboard.subHeadlines,
			layoutId: slide.storyboard.layoutId,
			content: slide.storyboard.contentAreas.map((area) => ({
				type: area.type as
					| "text"
					| "bullet"
					| "subbullet"
					| "chart"
					| "image"
					| "table",
				columnIndex: area.columnIndex,
				text: "", // ContentArea doesn't have content - this is layout only
			})),
			order: slide.order,
		}));

		return {
			title: extractedTitle, // The overall presentation title
			slides: transformedSlides, // Array of Slide objects
		};
	}

	/**
	 * Extract the title from a TipTap document
	 * @param outline The TipTap JSON document
	 * @returns The extracted title or null if not found
	 */
	private extractTitle(outline: TipTapDocument | unknown): string | null {
		// Try to find the first level 1 heading
		if (outline && (outline as TipTapDocument).content) {
			for (const node of (outline as TipTapDocument).content as TipTapNode[]) {
				if (node.type === "heading" && node.attrs?.level === 1) {
					return this.extractTextFromNode(node);
				}
			}
		}
		return null;
	}

	/**
	 * Extract text content from a TipTap node
	 * @param node The TipTap node to extract text from
	 * @returns The extracted text content
	 */
	private extractTextFromNode(node: TipTapNode): string {
		if (!node.content) return "";

		return (node.content as (TipTapNode | TipTapTextNode)[])
			.map((contentNode: TipTapNode | TipTapTextNode) => {
				if (contentNode.type === "text") {
					return (contentNode as TipTapTextNode).text || "";
				}
				return this.extractTextFromNode(contentNode as TipTapNode);
			})
			.join("");
	}

	/**
	 * Process a list node into content items
	 * @param node The list node to process
	 * @param slide The slide to add content to
	 * @param type The type of list item to create
	 */
	private processList(
		node: TipTapNode | unknown,
		slide: Slide,
		type: "bullet" | "subbullet",
	): void {
		const typedNode = node as TipTapNode;
		if (!typedNode.content) return;

		for (const item of typedNode.content as TipTapNode[]) {
			if (item.type === "listItem" && item.content) {
				for (const itemContent of item.content as (
					| TipTapNode
					| TipTapTextNode
				)[]) {
					if (itemContent.type === "paragraph") {
						slide.content.push({
							type,
							text: this.extractTextFromNode(itemContent as TipTapNode),
							columnIndex: 0,
						});
					} else if (
						itemContent.type === "bulletList" ||
						itemContent.type === "orderedList"
					) {
						this.processList(itemContent, slide, "subbullet");
					}
				}
			}
		}
	}
}
