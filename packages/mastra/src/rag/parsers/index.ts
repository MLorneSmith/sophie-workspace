/**
 * Document Parsers for RAG
 *
 * This module provides document parsing capabilities for PPTX and PDF files,
 * with LlamaParse fallback for complex documents.
 */

// Types and interfaces
export {
	type DocumentChunk,
	type DocumentMetadata,
	type EmbedDocumentMetadata,
	type ParseOptions,
	type ParseResult,
	type ParserStrategy,
	type SupportedFormat,
	type ContentType,
	type ParserType,
	ContentTypeSchema,
	DocumentChunkSchema,
	DocumentMetadataSchema,
	EmbedDocumentMetadataSchema,
	ParseOptionsSchema,
	ParseResultSchema,
	ParserTypeSchema,
	SupportedFormatSchema,
	MIN_CHARS_PER_PAGE,
} from "./types";

// Service factory and main class
export {
	createDocumentParserService,
	DocumentParserService,
} from "./document-parser";

// LlamaParse fallback
export {
	LlamaParseParserStrategy,
	createLlamaParseParser,
} from "./llamaparse-fallback";
