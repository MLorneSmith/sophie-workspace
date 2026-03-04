/**
 * Content type taxonomy for RAG embeddings.
 *
 * These content types provide semantic categorization of embedded documents,
 * independent of their storage format. Each embedding can be tagged with
 * one or more content types to enable filtered retrieval.
 */

import { ContentTypeSchema, type ContentType } from "./parsers/types";

/**
 * Content types for semantic categorization of embedded documents.
 */
export const CONTENT_TYPES = {
	/** User-uploaded documents (PPTX, PDF) */
	USER_UPLOAD: "user-upload",
	/** Research corpus documents */
	RESEARCH_CORPUS: "research-corpus",
	/** Playbook content (best practices, templates) */
	PLAYBOOK: "playbook",
	/** Deck history - previous presentation versions */
	DECK_HISTORY: "deck-history",
} as const;

// Re-export ContentType from parsers/types
export type { ContentType };

/**
 * Zod schema for content type validation.
 */
export { ContentTypeSchema };

/**
 * Check if a value is a valid ContentType.
 *
 * @param value - The value to validate
 * @returns true if the value is a valid ContentType
 */
export function isValidContentType(value: unknown): value is ContentType {
	if (typeof value !== "string") {
		return false;
	}
	const result = ContentTypeSchema.safeParse(value);
	return result.success;
}

/**
 * Validate and coerce a value to ContentType.
 * Returns undefined if the value is not valid.
 *
 * @param value - The value to validate
 * @returns The ContentType if valid, undefined otherwise
 */
export function validateContentType(value: unknown): ContentType | undefined {
	if (isValidContentType(value)) {
		return value;
	}
	return undefined;
}

/**
 * Get all valid content types as an array.
 */
export function getAllContentTypes(): ContentType[] {
	return [
		CONTENT_TYPES.USER_UPLOAD,
		CONTENT_TYPES.RESEARCH_CORPUS,
		CONTENT_TYPES.PLAYBOOK,
		CONTENT_TYPES.DECK_HISTORY,
	];
}

/**
 * Default content types to retrieve for agent context.
 * These types are commonly useful for general agent tasks.
 */
export const DEFAULT_CONTENT_TYPES: ContentType[] = [
	CONTENT_TYPES.PLAYBOOK,
	CONTENT_TYPES.USER_UPLOAD,
];
