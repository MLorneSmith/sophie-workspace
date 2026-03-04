/**
 * RAG utilities for document embedding and similarity search.
 *
 * This is a deep-import module to avoid bundling RAG dependencies
 * in client-side code. Import via "@kit/mastra/rag".
 */

export {
	embedDocument,
	querySimilar,
	embedUploadedDocument,
	SLIDEHEROES_EMBEDDINGS_INDEX,
} from "./rag/index";

// Re-export filter types for multi-tenant RAG
export type {
	RAGFilterOptions,
	AuthorizedQueryContext,
	EmbeddingMetadata,
} from "./rag/types";

// Re-export parser types and services for deep imports
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
	createDocumentParserService,
	DocumentParserService,
	LlamaParseParserStrategy,
	createLlamaParseParser,
} from "./rag/parsers";

// Re-export playbook seeding functions
export {
	seedPlaybooks,
	reseedPlaybooks,
	type PlaybookMetadata,
} from "./rag/seed-playbooks";
