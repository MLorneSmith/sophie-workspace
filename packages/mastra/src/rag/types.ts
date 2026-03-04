"use server";

/**
 * RAG (Retrieval-Augmented Generation) Types
 *
 * Type definitions for multi-tenant RAG with account-scoped retrieval.
 * These types ensure consistent metadata structure across embedding storage and retrieval.
 */

import type { ContentType } from "./parsers/types";

/**
 * Filter options for RAG queries.
 * Allows filtering by account, user, and content type.
 */
export interface RAGFilterOptions {
	/** Filter by account ID for tenant isolation */
	accountId?: string;
	/** Filter by user ID for personal content */
	userId?: string;
	/** Filter by content types */
	contentType?: ContentType[];
}

/**
 * Metadata structure stored with each embedding.
 * This schema ensures consistent metadata for filtering and retrieval.
 */
export interface EmbeddingMetadata {
	/** Account ID for multi-tenant isolation (required for non-global content) */
	accountId: string;
	/** User ID who created the content */
	userId: string;
	/** Type of content embedded */
	contentType: ContentType;
	/** Original text that was embedded */
	text: string;
	/** Index of this chunk within the original document */
	chunkIndex: number;
	/** Optional: filename of the source document */
	filename?: string;
	/** Optional: slide number for PPTX documents */
	slideNumber?: number;
	/** Optional: page number for PDF documents */
	pageNumber?: number;
	/** Optional: slide title for PPTX documents */
	slideTitle?: string;
	/** Optional: section title for PDF documents */
	sectionTitle?: string;
	/** Optional: speaker notes from PPTX */
	speakerNotes?: string;
	/** Optional: document format */
	documentFormat?: string;
	/** Optional: document page count */
	documentPageCount?: number;
	/** Optional: parser used */
	parserUsed?: string;
	/** Optional: document title */
	documentTitle?: string;
	/** Optional: document author */
	documentAuthor?: string;
}

/**
 * Authorized query context passed to RAG queries.
 * Contains validated user context for access control.
 */
export interface AuthorizedQueryContext {
	/** The user ID making the query */
	userId: string;
	/** The account ID (if any) to scope the query to */
	accountId?: string;
	/** Whether the user has access to global content (e.g., playbooks) */
	hasGlobalAccess?: boolean;
}
