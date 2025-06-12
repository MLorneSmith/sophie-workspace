"use client";

/**
 * Type definitions for the Canvas editor
 */

// Valid section types in the Canvas application
export type EditorContentTypes =
	| "situation"
	| "complication"
	| "answer"
	| "outline";

// Tiptap node structure
export interface TiptapNode {
	type: string;
	content?: TiptapNode[];
	attrs?: Record<string, unknown>;
	marks?: { type: string; attrs?: Record<string, unknown> }[];
	text?: string;
}

// Tiptap document structure (root level)
export interface TiptapDocument {
	type: string;
	content: TiptapNode[];
	meta?: Record<string, unknown>;
}
