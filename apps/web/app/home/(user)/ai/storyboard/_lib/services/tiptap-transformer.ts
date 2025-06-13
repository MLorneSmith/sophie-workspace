"use client";

import type { Slide, StoryboardData, StoryboardSlide } from "../types/index";

/**
 * Helper function to generate UUID since we don't have access to @kit/shared/utils/uuid
 */
function generateUUID(): string {
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
		const r = (Math.random() * 16) | 0;
		const v = c === "x" ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}

/**
 * Interfaces for TipTap document structure
 */
interface TipTapDocument {
	type: "doc";
	content: TipTapNode[];
	meta?: {
		sectionType: string;
		timestamp: string;
		version: string;
	};
}

interface TipTapNode {
	type: string;
	attrs?: {
		level?: number; // For heading nodes (1-6)
		indent?: number; // Indentation level
	};
	content?: TipTapNode[];
}

interface TipTapTextNode extends TipTapNode {
	type: "text";
	text: string;
	marks?: { type: string; attrs?: Record<string, unknown> }[];
}

/**
 * TipTapTransformer - Responsible for converting TipTap JSON documents to Storyboard format
 * Implements the logic defined in Task #4 of the Storyboard System
 */
export namespace TipTapTransformer {
	/**
	 * Transform a TipTap JSON document into storyboard format
	 * @param tipTapDocument The TipTap JSON document or string
	 * @param title Optional title for the presentation (used if no title found in document)
	 * @returns StoryboardData representing the presentation
	 */
	export function transform(
		tipTapDocument: string | TipTapDocument,
		title = "Untitled Presentation",
	): StoryboardData {
		// Parse document if it's a string
		const document = parseDocument(tipTapDocument);

		// Extract presentation title from the document or use provided title
		const presentationTitle = extractTitle(document) || title;

		// Identify slide boundaries and create slide structure
		const slides = identifySlides(document);

		// Convert Slide[] to StoryboardSlide[]
		const storyboardSlides: StoryboardSlide[] = slides.map((slide) => {
			return {
				id: slide.id,
				headline: slide.title,
				order: slide.order,
				storyboard: {
					layoutId: slide.layoutId,
					subHeadlines: slide.subheadlines,
					contentAreas: [],
					settings: {
						chartTypes: {},
						imageSettings: {},
						tableSettings: {},
					},
				},
			};
		});

		return {
			title: presentationTitle,
			slides: storyboardSlides,
		};
	}

	/**
	 * Parse the TipTap document if it's a string
	 * @param document The TipTap document or string
	 * @returns Parsed TipTapDocument
	 */
	function parseDocument(document: string | TipTapDocument): TipTapDocument {
		if (typeof document === "string") {
			try {
				return JSON.parse(document) as TipTapDocument;
			} catch (error) {
				console.error("Error parsing TipTap document:", error);
				// Return empty document if parsing fails
				return { type: "doc", content: [] };
			}
		}
		return document;
	}

	/**
	 * Extract the title from a TipTap document (first level 1 heading)
	 * @param document The TipTap document
	 * @returns The extracted title or null if not found
	 */
	function extractTitle(document: TipTapDocument): string | null {
		if (!document.content || document.content.length === 0) {
			return null;
		}

		// Look for the first level 1 heading
		for (const node of document.content) {
			if (node.type === "heading" && node.attrs?.level === 1) {
				return extractTextFromNode(node);
			}
		}

		return null;
	}

	/**
	 * Identify slide boundaries and create slide objects
	 * @param document The TipTap document
	 * @returns Array of Slide objects
	 */
	function identifySlides(document: TipTapDocument): Slide[] {
		const slides: Slide[] = [];
		let currentSlide: Slide | null = null;
		const _slideCount = 0;
		let currentColumnIndex = 0;

		// Process each node in the document
		if (document.content && document.content.length > 0) {
			let currentLevel3Headings: string[] = [];

			for (let i = 0; i < document.content.length; i++) {
				const node = document.content[i];
				if (!node) continue;

				// Handle heading nodes (potential slide boundaries)
				if (node.type === "heading") {
					const headingLevel = node.attrs?.level || 1;
					const headingText = extractTextFromNode(node);

					// Level 1 and 2 headings become new slides
					if (headingLevel <= 2) {
						// Determine slide type and layout based on heading level
						const slideType = headingLevel === 1 ? "title" : "section";
						const layoutId = determineInitialLayout(
							headingLevel,
							node,
							document.content.slice(i + 1).filter(Boolean),
						);

						// Save the previous slide if we have one
						if (currentSlide) {
							// Set final subheadlines before saving
							if (currentLevel3Headings.length > 0) {
								currentSlide.subheadlines = currentLevel3Headings;
							}
							slides.push(currentSlide);
						}

						// Create a new slide
						currentSlide = {
							id: generateUUID(),
							slideType: slideType as
								| "title"
								| "section"
								| "content"
								| "bullet"
								| "chart"
								| "comparison",
							title: headingText,
							subheadlines: [],
							layoutId,
							content: [],
							order: slides.length,
						};

						// Reset for new slide
						currentLevel3Headings = [];
						currentColumnIndex = 0;
					}
					// Level 3 headings become subheadlines or column headers
					else if (headingLevel === 3 && currentSlide) {
						currentLevel3Headings.push(headingText);

						// Update layout if we have multiple level 3 headings
						if (currentLevel3Headings.length > 1) {
							// Adjust layout based on number of subheadlines
							if (currentLevel3Headings.length === 2) {
								currentSlide.layoutId = "two-column";
							} else if (currentLevel3Headings.length === 3) {
								currentSlide.layoutId = "three-column";
							}

							// Switch to the next column for content
							currentColumnIndex = currentLevel3Headings.length - 1;
						}
					}
					// Level 4+ headings become content items
					else if (currentSlide) {
						currentSlide.content.push({
							type: "text",
							text: headingText,
							columnIndex: currentColumnIndex,
							formatting: { bold: true },
						});
					}
				}
				// Handle paragraph nodes
				else if (node.type === "paragraph" && currentSlide) {
					const text = extractTextFromNode(node);
					if (text.trim().length > 0) {
						currentSlide.content.push({
							type: "text",
							text,
							columnIndex: currentColumnIndex,
						});

						// Check if this paragraph contains data that might be better as a chart
						if (mightBeChartData(text)) {
							suggestChartTypeForSlide(currentSlide, text);
						}
					}
				}
				// Handle bullet lists
				else if (node.type === "bulletList" && currentSlide) {
					// Process list items
					processList(node, currentSlide, "bullet", currentColumnIndex);

					// Update layout if mostly bullets
					if (
						currentSlide.content.filter(
							(c) => c.type === "bullet" || c.type === "subbullet",
						).length > 3 &&
						currentSlide.layoutId !== "bullet-list"
					) {
						currentSlide.layoutId = "bullet-list";
					}
				}
				// Handle ordered lists
				else if (node.type === "orderedList" && currentSlide) {
					processList(node, currentSlide, "bullet", currentColumnIndex);
				}
			}

			// Add the last slide if we have one
			if (currentSlide) {
				// Set final subheadlines before saving
				if (currentLevel3Headings.length > 0) {
					currentSlide.subheadlines = currentLevel3Headings;
				}
				slides.push(currentSlide);
			}
		}

		// Create a default title slide if no slides were created
		if (slides.length === 0) {
			slides.push({
				id: generateUUID(),
				slideType: "title",
				title: document.meta?.sectionType || "Untitled Presentation",
				subheadlines: [],
				layoutId: "title",
				content: [],
				order: 0,
			});
		}

		// Ensure all slides have correct subheadlines arrays based on their layouts
		normalizeSlideSubheadlines(slides);

		return slides;
	}

	/**
	 * Determine the initial layout for a slide based on content analysis
	 * @param headingLevel The heading level of the slide
	 * @param headingNode The heading node
	 * @param followingNodes The nodes that follow this heading
	 * @returns Layout ID string
	 */
	function determineInitialLayout(
		headingLevel: number,
		_headingNode: TipTapNode,
		followingNodes: TipTapNode[],
	): string {
		// Title slide for level 1 headings
		if (headingLevel === 1) {
			return "title";
		}

		// Default to section header for level 2
		const layoutId = "section";

		// Look ahead to determine best layout
		let bulletListCount = 0;
		let paragraphCount = 0;
		let level3HeadingCount = 0;
		let hasNumericalContent = false;

		// Analyze the next few nodes or until we hit another level 1-2 heading
		for (let i = 0; i < Math.min(followingNodes.length, 10); i++) {
			const node = followingNodes[i];
			if (!node) continue;

			// Stop at the next slide boundary
			if (
				node.type === "heading" &&
				(node.attrs?.level === 1 || node.attrs?.level === 2)
			) {
				break;
			}

			// Count content types
			if (node.type === "bulletList" || node.type === "orderedList") {
				bulletListCount++;
			} else if (node.type === "paragraph") {
				paragraphCount++;

				// Check for numerical content
				const text = extractTextFromNode(node);
				if (TipTapTransformer.mightBeChartData(text)) {
					hasNumericalContent = true;
				}
			} else if (node.type === "heading" && node.attrs?.level === 3) {
				level3HeadingCount++;
			}
		}

		// Determine layout based on content analysis
		if (level3HeadingCount >= 3) {
			return "three-column";
		}
		if (level3HeadingCount === 2) {
			return "two-column";
		}
		if (bulletListCount > paragraphCount) {
			return "bullet-list";
		}
		if (hasNumericalContent) {
			return "chart";
		}
		if (paragraphCount > 0) {
			return "content";
		}

		return layoutId;
	}

	/**
	 * Process a list node into content items
	 * @param node The list node to process
	 * @param slide The slide to add content to
	 * @param type The type of list item to create
	 * @param columnIndex The column index for the content
	 */
	function processList(
		node: TipTapNode,
		slide: Slide,
		type: "bullet" | "subbullet",
		columnIndex = 0,
	): void {
		if (!node.content) return;

		for (const item of node.content) {
			if (!item) continue;
			if (item.type === "listItem" && item.content) {
				for (const itemContent of item.content) {
					if (!itemContent) continue;
					if (itemContent.type === "paragraph") {
						slide.content.push({
							type,
							text: extractTextFromNode(itemContent),
							columnIndex,
						});
					} else if (
						itemContent.type === "bulletList" ||
						itemContent.type === "orderedList"
					) {
						processList(itemContent, slide, "subbullet", columnIndex);
					}
				}
			}
		}
	}

	/**
	 * Check if text might contain data suitable for a chart
	 * @param text The text to analyze
	 * @returns Boolean indicating if this might be chart data
	 */
	function mightBeChartData(text: string): boolean {
		// Check for percentage patterns
		const percentagePattern = /\b\d+(\.\d+)?%\b/;
		if (percentagePattern.test(text)) return true;

		// Check for numerical patterns that suggest data
		const numericalPattern = /\b\d+(\.\d+)?\s*(\w+\s*){1,3}:\s*\d+(\.\d+)?\b/;
		if (numericalPattern.test(text)) return true;

		// Check for comparison language
		const comparisonTerms = [
			"increase",
			"decrease",
			"growth",
			"decline",
			"comparison",
			"versus",
			"vs",
		];
		if (comparisonTerms.some((term) => text.toLowerCase().includes(term)))
			return true;

		// Check if text contains multiple numbers (potential data points)
		const numberMatches = text.match(/\b\d+(\.\d+)?\b/g);
		if (numberMatches && numberMatches.length >= 3) return true;

		return false;
	}

	/**
	 * Suggest an appropriate chart type for a slide based on content analysis
	 * @param slide The slide to modify
	 * @param text Text containing potential chart data
	 */
	function suggestChartTypeForSlide(slide: Slide, text: string): void {
		// Analyze text to determine best chart type
		let chartType: "bar" | "line" | "pie" | "area" = "bar";

		// Simple heuristics for chart type selection
		if (
			text.toLowerCase().includes("over time") ||
			text.toLowerCase().includes("trend") ||
			text.toLowerCase().includes("growth")
		) {
			chartType = "line";
		} else if (
			text.toLowerCase().includes("percentage") ||
			text.toLowerCase().includes("proportion") ||
			text.toLowerCase().includes("market share")
		) {
			chartType = "pie";
		} else if (
			text.toLowerCase().includes("cumulative") ||
			text.toLowerCase().includes("total") ||
			text.toLowerCase().includes("volume")
		) {
			chartType = "area";
		}

		// Only update layout if it's not already chart or comparison
		if (slide.layoutId !== "chart" && slide.layoutId !== "comparison") {
			slide.layoutId = "chart";
		}

		// Add a chart content item if one doesn't exist
		const hasChartContent = slide.content.some((c) => c.type === "chart");
		if (!hasChartContent) {
			slide.content.push({
				type: "chart",
				columnIndex: 0,
				chartType,
				// Create placeholder chart data
				chartData: {
					labels: ["Item 1", "Item 2", "Item 3"],
					datasets: [{ values: [30, 50, 20] }],
				},
			});
		}
	}

	/**
	 * Extract text content from a TipTap node
	 * @param node The TipTap node to extract text from
	 * @returns The extracted text content
	 */
	function extractTextFromNode(node: TipTapNode): string {
		if (!node.content) return "";

		return node.content
			.map((contentNode: TipTapNode) => {
				if ((contentNode as TipTapTextNode).text !== undefined) {
					return (contentNode as TipTapTextNode).text;
				}
				return extractTextFromNode(contentNode);
			})
			.join("");
	}

	/**
	 * Ensure all slides have appropriate subheadlines arrays based on their layouts
	 * @param slides Array of slides to normalize
	 */
	function normalizeSlideSubheadlines(slides: Slide[]): void {
		for (const slide of slides) {
			// Determine expected number of subheadlines based on layout
			let expectedCount = 1;

			switch (slide.layoutId) {
				case "two-column":
					expectedCount = 2;
					break;
				case "three-column":
					expectedCount = 3;
					break;
				case "image-text":
				case "text-image":
				case "comparison":
					expectedCount = 2;
					break;
				default:
					expectedCount = 1;
					break;
			}

			// Ensure we have the right number of subheadlines
			while (slide.subheadlines.length < expectedCount) {
				slide.subheadlines.push("");
			}

			// Truncate if too many
			if (slide.subheadlines.length > expectedCount) {
				slide.subheadlines = slide.subheadlines.slice(0, expectedCount);
			}
		}
	}
}
