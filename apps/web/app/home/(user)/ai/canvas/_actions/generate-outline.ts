"use server";

import { enhanceAction } from "@kit/next/actions";
import { getSupabaseServerClient } from "@kit/supabase/server-client";
import { z } from "zod";

import { lexicalToTiptap } from "../_components/editor/tiptap/utils/format-conversion";

import { createServiceLogger } from "@kit/shared/logger";

// Initialize service logger
const { getLogger } = createServiceLogger("HOME-(USER)");

// Server-side normalization functions (no 'use client' directive)
function normalizeOutlineContent(content: TiptapDocument): TiptapDocument {
	// Deep clone to avoid mutation issues
	const result = JSON.parse(JSON.stringify(content));

	// Helper function to normalize node structures
	function normalizeNode(node: TiptapNode): TiptapNode {
		// Fix empty text nodes
		if (node.type === "text" && (!node.text || node.text === "")) {
			node.text = " ";
		}

		// Fix paragraphs without content
		if (
			node.type === "paragraph" &&
			(!node.content || node.content.length === 0)
		) {
			node.content = [{ type: "text", text: " " }];
		}

		// Fix list structures
		if (node.type === "bulletList" || node.type === "orderedList") {
			if (!node.content || node.content.length === 0) {
				node.content = [
					{
						type: "listItem",
						content: [
							{
								type: "paragraph",
								content: [{ type: "text", text: " " }],
							},
						],
					},
				];
			} else {
				node.content = node.content.map((item) => {
					if (!item || item.type !== "listItem") {
						return {
							type: "listItem",
							content: [
								{
									type: "paragraph",
									content: [{ type: "text", text: " " }],
								},
							],
						};
					}
					return normalizeNode(item);
				});
			}
		}

		// Ensure listItems have paragraph content
		if (node.type === "listItem") {
			if (!node.content || node.content.length === 0) {
				node.content = [
					{
						type: "paragraph",
						content: [{ type: "text", text: " " }],
					},
				];
			} else if (node.content[0] && node.content[0].type !== "paragraph") {
				// Ensure we have a valid node before checking its type
				node.content = [
					{
						type: "paragraph",
						content: [node.content[0] || { type: "text", text: " " }],
					},
				];
			}
		}

		// Recursively normalize content
		if (node.content && Array.isArray(node.content)) {
			node.content = node.content.map((childNode) =>
				childNode
					? normalizeNode(childNode)
					: {
							type: "paragraph",
							content: [{ type: "text", text: " " }],
						},
			);
		}

		return node;
	}

	if (result.content && Array.isArray(result.content)) {
		result.content = result.content.map((node: TiptapNode | undefined) =>
			node
				? normalizeNode(node)
				: {
						type: "paragraph",
						content: [{ type: "text", text: " " }],
					},
		);
	}

	return result;
}

interface TiptapNode {
	type: string;
	content?: TiptapNode[];
	attrs?: Record<string, unknown>;
	marks?: { type: string }[];
	text?: string;
}

interface TiptapDocument {
	type: string;
	content: TiptapNode[];
}

const EMPTY_TIPTAP_DOCUMENT: TiptapDocument = {
	type: "doc",
	content: [],
};

const SPACER_PARAGRAPH: TiptapNode = {
	type: "paragraph",
	content: [
		{
			type: "text",
			text: " ", // Use a space instead of an empty string, as TipTap doesn't allow empty text nodes
		},
	],
};

function parseTiptapDocument(content: string | null): TiptapDocument {
	if (!content) return EMPTY_TIPTAP_DOCUMENT;
	try {
		// Try to parse as Tiptap first
		const parsed = JSON.parse(content);

		// Check if it's already in Tiptap format
		if (parsed.type === "doc" && Array.isArray(parsed.content)) {
			return parsed as TiptapDocument;
		}

		// If not, try to convert from Lexical format
		return lexicalToTiptap(content);
	} catch {
		return EMPTY_TIPTAP_DOCUMENT;
	}
}

function hasValidText(node: TiptapNode): boolean {
	// Check for direct text content (paragraphs, headings)
	if (
		(node.type === "paragraph" || node.type === "heading") &&
		node.content &&
		node.content.length > 0
	) {
		return node.content.some(
			(child) =>
				child.type === "text" &&
				typeof child.text === "string" &&
				child.text.trim().length > 0,
		);
	}

	// Check for bullet lists, ordered lists, and list items
	if (
		node.type === "bulletList" ||
		node.type === "orderedList" ||
		node.type === "listItem"
	) {
		return true; // Always include list structures
	}

	// Also include blockquotes, code blocks, and tables
	if (
		node.type === "blockquote" ||
		node.type === "codeBlock" ||
		node.type === "table"
	) {
		return true;
	}

	return false;
}

// Define explicit type for the action parameters
interface GenerateOutlineParams {
	submissionId: string;
	forceRegenerate: boolean;
}

const GenerateOutlineSchema = z.object({
	submissionId: z.string().min(1, "Submission ID is required"),
	forceRegenerate: z.boolean().optional(),
});

export const generateOutlineAction = enhanceAction(
	async (data: z.infer<typeof GenerateOutlineSchema>, _user) => {
		const logger = getLogger();

		try {
			const supabase = getSupabaseServerClient();
			const { submissionId, forceRegenerate } = data;
			logger.info("Generate outline action called with:", {
				submissionId,
				forceRegenerate,
			});

			// Check if outline exists and we don't need to force regenerate
			if (!forceRegenerate) {
				const { data: existingOutline, error: outlineError } = await supabase
					.from("building_blocks_submissions")
					.select("outline")
					.eq("id", submissionId)
					.single();

				if (!outlineError && existingOutline && existingOutline.outline) {
					try {
						// Try to parse the existing outline
						const parsedOutline = JSON.parse(existingOutline.outline);
						if (
							typeof parsedOutline === "object" &&
							parsedOutline !== null &&
							parsedOutline.type === "doc" &&
							Array.isArray(parsedOutline.content) &&
							parsedOutline.content.length > 1
						) {
							logger.info({
								message:
									"Valid outline exists and force regenerate is false, returning existing outline",
							});
							return { success: true, data: parsedOutline };
						}
					} catch (_e) {
						// If parsing fails, continue to regeneration
						logger.info("Failed to parse existing outline, will regenerate");
					}
				}
			}

			// Fetch the submission data
			const { data: submission, error } = await supabase
				.from("building_blocks_submissions")
				.select("situation, complication, answer")
				.eq("id", submissionId)
				.single();

			if (error || !submission) {
				throw new Error("Failed to fetch submission data");
			}

			logger.info("Generating outline for submission:", {
				data: data.submissionId,
			});
			logger.info("Raw data:", {
				situation: submission.situation
					? `${submission.situation.substring(0, 50)}...`
					: "null",
				complication: submission.complication
					? `${submission.complication.substring(0, 50)}...`
					: "null",
				answer: submission.answer
					? `${submission.answer.substring(0, 50)}...`
					: "null",
			});

			// Parse each section's content
			const situationDoc = parseTiptapDocument(submission.situation);
			const complicationDoc = parseTiptapDocument(submission.complication);
			const answerDoc = parseTiptapDocument(submission.answer);

			logger.info("Parsed documents:", {
				situationHasContent: situationDoc.content.some(hasValidText),
				complicationHasContent: complicationDoc.content.some(hasValidText),
				answerHasContent: answerDoc.content.some(hasValidText),
			});

			// Create a combined Tiptap document with a clear title
			// Create a heading to clearly identify this as an outline
			const outlineHeading: TiptapNode = {
				type: "heading",
				attrs: { level: 1 },
				content: [
					{
						type: "text",
						text: "Presentation Outline",
					},
				],
			};

			// Create outline content with proper structure
			const outlineContent: TiptapDocument = {
				type: "doc",
				content: [
					// Add outline heading first
					outlineHeading,
					SPACER_PARAGRAPH,

					// Add a situation heading if there's content
					...(situationDoc.content.some(hasValidText)
						? [
								{
									type: "heading",
									attrs: { level: 2 },
									content: [{ type: "text", text: "Situation" }],
								},
								SPACER_PARAGRAPH,
							]
						: []),

					// Situation paragraphs - don't filter, just include everything
					...situationDoc.content,
					// Add spacing if there was content
					...(situationDoc.content.length > 0 ? [SPACER_PARAGRAPH] : []),

					// Add a complication heading if there's content
					...(complicationDoc.content.some(hasValidText)
						? [
								{
									type: "heading",
									attrs: { level: 2 },
									content: [{ type: "text", text: "Complication" }],
								},
								SPACER_PARAGRAPH,
							]
						: []),

					// Complication paragraphs - don't filter, just include everything
					...complicationDoc.content,
					// Add spacing if there was content
					...(complicationDoc.content.length > 0 ? [SPACER_PARAGRAPH] : []),

					// Add an answer heading if there's content
					...(answerDoc.content.some(hasValidText)
						? [
								{
									type: "heading",
									attrs: { level: 2 },
									content: [{ type: "text", text: "Answer" }],
								},
								SPACER_PARAGRAPH,
							]
						: []),

					// Answer paragraphs (including all lists and nested content)
					...answerDoc.content, // Include all content without filtering to preserve lists
				],
			};

			// Normalize the outline content using server-safe function
			const normalizedOutlineContent = normalizeOutlineContent(outlineContent);

			// Add metadata
			const finalOutlineContent = {
				...normalizedOutlineContent,
				meta: {
					sectionType: "outline",
					timestamp: new Date().toISOString(),
					version: "1.0",
				},
			};

			logger.info("Generated outline content with sections:", {
				totalNodes: outlineContent.content.length,
				firstNodeType:
					outlineContent.content.length > 0 && outlineContent.content[0]
						? outlineContent.content[0].type
						: "none",
			});

			// Update the outline field in the database with stringified Tiptap document
			const outlineString = JSON.stringify(finalOutlineContent);
			logger.info("Outline JSON length:", { data: outlineString.length });

			const { error: updateError } = await supabase
				.from("building_blocks_submissions")
				.update({ outline: outlineString })
				.eq("id", data.submissionId);

			if (updateError) {
				logger.error("Failed to update outline:", { data: updateError });
				throw new Error("Failed to update outline");
			}

			logger.info("Successfully updated outline in database");

			return {
				success: true,
				data: finalOutlineContent,
			};
		} catch (error) {
			logger.error("Error in generate outline action:", { data: error });

			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	},
	{
		schema: GenerateOutlineSchema,
		auth: true,
		typeCheck: (data: unknown): GenerateOutlineParams => {
			// The typecheck option helps with Zod optional field handling
			const typedData = data as any;
			return {
				submissionId: typedData.submissionId,
				forceRegenerate: typedData.forceRegenerate === true,
			};
		},
	},
);
