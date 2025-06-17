"use client";

import type {
import { createServiceLogger } from "@kit/shared/logger";

// Initialize service logger
const { getLogger } = createServiceLogger("HOME-(USER)");

	EditorContentTypes,
	TiptapDocument,
	TiptapNode,
} from "../../_types/editor-types";

// Default safe empty content when normalization fails
const EMPTY_DOCUMENT: TiptapDocument = {
	type: "doc",
	content: [
		{
			type: "paragraph",
			content: [{ type: "text", text: " " }],
		},
	],
};

/**
 * Main normalization function that process editor content
 * to ensure compatibility with the editor
 */
export function normalizeEditorContent(
	content: unknown,
	sectionType: EditorContentTypes,
): TiptapDocument {
	// Parse input content safely
	let parsedContent = parseContent(content);

	// Apply section-specific transformations
	if (sectionType === "outline") {
		parsedContent = applyOutlineSpecificTransformations(parsedContent);
	}

	// Normalize all node structures
	parsedContent = normalizeNodeStructures(parsedContent);

	// Add source metadata for debugging
	parsedContent = addSourceMetadata(parsedContent, sectionType);

	// Validate against schema (with safe fallback)
	try {
		validateAgainstSchema(parsedContent);
	} catch (error) {
		// TODO: Async logger needed
		// TODO: Fix logger call - was: error
		// Use safe fallback content if validation fails
		return createSafeContent();
	}

	return parsedContent;
}

/**
 * Safely parse content from various input formats
 */
function parseContent(content: unknown): TiptapDocument {
	if (!content) {
		return createSafeContent();
	}

	// Handle string content (JSON)
	if (typeof content === "string") {
		try {
			return JSON.parse(content);
		} catch (e) {
			// TODO: Async logger needed
		// TODO: Fix logger call - was: error
			return createSafeContent();
		}
	}

	// If already an object, deep clone to avoid reference issues
	if (content && typeof content === "object") {
		return JSON.parse(JSON.stringify(content));
	}

	return createSafeContent();
}

/**
 * Create safe default content when parsing fails
 */
function createSafeContent(): TiptapDocument {
	return JSON.parse(JSON.stringify(EMPTY_DOCUMENT));
}

/**
 * Normalize node structures to ensure they're valid for ProseMirror
 */
function normalizeNodeStructures(content: TiptapDocument): TiptapDocument {
	// Deep clone to avoid mutation issues
	const result = JSON.parse(JSON.stringify(content));

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

/**
 * Add metadata to help trace content origins
 */
function addSourceMetadata(
	content: TiptapDocument,
	sectionType: EditorContentTypes,
): TiptapDocument {
	return {
		...content,
		meta: {
			sectionType,
			timestamp: new Date().toISOString(),
			version: "1.0",
		},
	};
}

/**
 * Validate document against schema rules
 */
function validateAgainstSchema(content: TiptapDocument): void {
	// Basic validation checks
	if (content.type !== "doc") {
		throw new Error('Root node must be of type "doc"');
	}

	if (!content.content || !Array.isArray(content.content)) {
		throw new Error("Root node must have content array");
	}

	// Validate each node has required properties
	function validateNode(node: TiptapNode): void {
		if (!node.type) {
			throw new Error("Node missing required type property");
		}

		// Text nodes must have text property
		if (node.type === "text" && typeof node.text !== "string") {
			throw new Error("Text node must have text property");
		}

		// Validate child nodes recursively
		if (node.content && Array.isArray(node.content)) {
			for (const childNode of node.content) {
				validateNode(childNode);
			}
		}
	}

	// Validate all top-level nodes
	for (const node of content.content) {
		validateNode(node);
	}
}

/**
 * Apply special transformations specifically for outline content
 */
function applyOutlineSpecificTransformations(
	content: TiptapDocument,
): TiptapDocument {
	// Deep clone to avoid mutation issues
	const result = JSON.parse(JSON.stringify(content));

	// Ensure the outline has a title heading if missing
	let hasOutlineHeading = false;

	if (result.content && result.content.length > 0) {
		// Check if the first node is a level 1 heading with "Presentation Outline" or similar
		if (
			result.content[0].type === "heading" &&
			result.content[0].attrs?.level === 1 &&
			result.content[0].content &&
			result.content[0].content.some(
				(node: TiptapNode) =>
					node.type === "text" &&
					node.text &&
					node.text.toLowerCase().includes("outline"),
			)
		) {
			hasOutlineHeading = true;
		}
	}

	// Add outline heading if missing
	if (!hasOutlineHeading) {
		result.content = [
			{
				type: "heading",
				attrs: { level: 1 },
				content: [{ type: "text", text: "Presentation Outline" }],
			},
			{
				type: "paragraph",
				content: [{ type: "text", text: " " }],
			},
			...result.content,
		];
	}

	return result;
}
