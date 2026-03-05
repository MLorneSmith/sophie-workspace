import { z } from "zod";

/**
 * Supported document formats for parsing
 */
export const SupportedFormatSchema = z.enum(["pptx", "pdf"]);
export type SupportedFormat = z.infer<typeof SupportedFormatSchema>;

/**
 * Content type metadata for filtering embedded chunks
 */
export const ContentTypeSchema = z.enum([
	"user-upload",
	"research-corpus",
	"playbook",
	"deck-history",
]);
export type ContentType = z.infer<typeof ContentTypeSchema>;

/**
 * Parser that was used to extract the document
 */
export const ParserTypeSchema = z.enum([
	"officeparser",
	"pdf.js-extract",
	"llamaparse",
]);
export type ParserType = z.infer<typeof ParserTypeSchema>;

/**
 * Metadata for a single document chunk (slide or page)
 */
export const DocumentChunkSchema = z.object({
	text: z.string().min(0),
	pageOrSlide: z.number().int().positive(),
	title: z.string().optional(),
	speakerNotes: z.string().optional(),
});

export type DocumentChunk = z.infer<typeof DocumentChunkSchema>;

/**
 * Document-level metadata
 */
export const DocumentMetadataSchema = z.object({
	format: SupportedFormatSchema,
	pageCount: z.number().int().nonnegative(),
	title: z.string().optional(),
	author: z.string().optional(),
	parsedBy: ParserTypeSchema,
	filename: z.string().optional(),
});

export type DocumentMetadata = z.infer<typeof DocumentMetadataSchema>;

/**
 * Result of parsing a document
 */
export const ParseResultSchema = z.object({
	chunks: z.array(DocumentChunkSchema),
	metadata: DocumentMetadataSchema,
});

export type ParseResult = z.infer<typeof ParseResultSchema>;

/**
 * Options for parsing a document
 */
export const ParseOptionsSchema = z.object({
	/** Skip quality gate and use local parser only */
	skipQualityGate: z.boolean().optional().default(false),
	/** Force using LlamaParse regardless of quality */
	forceLlamaParse: z.boolean().optional().default(false),
});

export type ParseOptions = z.infer<typeof ParseOptionsSchema>;

/**
 * Metadata passed when embedding a document
 */
export const EmbedDocumentMetadataSchema = z.object({
	accountId: z.string().uuid(),
	userId: z.string().uuid(),
	contentType: ContentTypeSchema,
	filename: z.string(),
});

export type EmbedDocumentMetadata = z.infer<typeof EmbedDocumentMetadataSchema>;

/**
 * Parser strategy interface for format-specific implementations
 */
export interface ParserStrategy {
	/**
	 * Parse a document buffer into chunks
	 * @param buffer - The document file buffer
	 * @returns Promise resolving to parsed chunks and metadata
	 */
	parse(buffer: Buffer): Promise<ParseResult>;
}

/**
 * Result of embedding an uploaded document
 */
export interface EmbedDocumentResult {
	ids: string[];
	chunks: number;
}

/**
 * Quality gate threshold configuration
 * Default: 50 chars per page - below this, escalate to LlamaParse
 */
export const MIN_CHARS_PER_PAGE = 50;
