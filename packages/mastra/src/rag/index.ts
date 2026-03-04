import { randomUUID } from "node:crypto";

import type { QueryResult } from "@mastra/core/vector";
import { MDocument } from "@mastra/rag";

import { getMastraMemory, getPgVector } from "../mastra";
import { createDocumentParserService } from "./parsers";
import type { EmbedDocumentMetadata, SupportedFormat } from "./parsers/types";

export const SLIDEHEROES_EMBEDDINGS_INDEX = "slideheroes-embeddings";

const DEFAULT_TOP_K = 5;
const DEFAULT_CHUNK_SIZE = 700;
const DEFAULT_CHUNK_OVERLAP = 100;

let _indexReady = false;

type EmbedderResult = {
	embeddings: number[][];
};

type Embedder = {
	doEmbed: (input: { values: string[] }) => Promise<EmbedderResult>;
};

function toEmbedder(value: unknown): Embedder {
	if (
		typeof value === "object" &&
		value !== null &&
		"doEmbed" in value &&
		typeof value.doEmbed === "function"
	) {
		return value as Embedder;
	}

	throw new Error("Mastra embedder is not configured for RAG operations");
}

async function embedValues(values: string[]): Promise<number[][]> {
	const embedder = toEmbedder(getMastraMemory().embedder);
	const result = await embedder.doEmbed({ values });

	if (!Array.isArray(result.embeddings) || result.embeddings.length === 0) {
		throw new Error("Embedding model returned no vectors");
	}

	return result.embeddings;
}

async function ensureEmbeddingsIndex(dimension: number): Promise<void> {
	if (_indexReady) {
		return;
	}

	const vector = getPgVector();

	try {
		await vector.describeIndex({ indexName: SLIDEHEROES_EMBEDDINGS_INDEX });
		_indexReady = true;
		return;
	} catch {
		await vector.createIndex({
			indexName: SLIDEHEROES_EMBEDDINGS_INDEX,
			dimension,
			metric: "dotproduct",
		});
		_indexReady = true;
	}
}

export async function embedDocument(
	text: string,
	metadata?: Record<string, unknown>,
): Promise<{ ids: string[]; chunks: number }> {
	const normalizedText = text.trim();

	if (!normalizedText) {
		return { ids: [], chunks: 0 };
	}

	const document = MDocument.fromText(normalizedText);
	const chunks = await document.chunk({
		strategy: "recursive",
		maxSize: DEFAULT_CHUNK_SIZE,
		overlap: DEFAULT_CHUNK_OVERLAP,
		separators: ["\n\n", "\n", " "],
	});

	if (chunks.length === 0) {
		return { ids: [], chunks: 0 };
	}

	const chunkTexts = chunks.map((chunk) => chunk.text);
	const embeddings = await embedValues(chunkTexts);
	const firstVector = embeddings[0];

	if (!firstVector || firstVector.length === 0) {
		throw new Error("Embedding model returned empty vectors");
	}

	await ensureEmbeddingsIndex(firstVector.length);

	const ids = chunkTexts.map(() => randomUUID());
	const chunkMetadata = chunks.map((chunk, index) => ({
		...(metadata ?? {}),
		text: chunk.text,
		chunkIndex: index,
	}));

	await getPgVector().upsert({
		indexName: SLIDEHEROES_EMBEDDINGS_INDEX,
		ids,
		vectors: embeddings,
		metadata: chunkMetadata,
	});

	return {
		ids,
		chunks: chunkTexts.length,
	};
}

/**
 * Embed an uploaded document (PPTX or PDF) into the vector store.
 * Parses the document into chunks and embeds each chunk with rich metadata.
 *
 * @param fileBuffer - The document file buffer
 * @param format - Document format ("pptx" or "pdf")
 * @param metadata - Embedding metadata (accountId, userId, contentType, filename)
 * @returns Promise resolving to embedded document result with IDs and chunk count
 */
export async function embedUploadedDocument(
	fileBuffer: Buffer,
	format: SupportedFormat,
	metadata: EmbedDocumentMetadata,
): Promise<{ ids: string[]; chunks: number }> {
	const parser = createDocumentParserService();
	const parseResult = await parser.parseDocument(fileBuffer, format);

	if (parseResult.chunks.length === 0) {
		return { ids: [], chunks: 0 };
	}

	// Filter out empty chunks
	const nonEmptyChunks = parseResult.chunks.filter(
		(chunk) => chunk.text.trim().length > 0,
	);

	if (nonEmptyChunks.length === 0) {
		return { ids: [], chunks: 0 };
	}

	const chunkTexts = nonEmptyChunks.map((chunk) => chunk.text);
	const embeddings = await embedValues(chunkTexts);
	const firstVector = embeddings[0];

	if (!firstVector || firstVector.length === 0) {
		throw new Error("Embedding model returned empty vectors");
	}

	await ensureEmbeddingsIndex(firstVector.length);

	// Build chunk metadata with rich information for filtering
	const chunkMetadata = nonEmptyChunks.map((chunk, index) => ({
		// Base metadata from upload
		accountId: metadata.accountId,
		userId: metadata.userId,
		contentType: metadata.contentType,
		filename: metadata.filename,

		// Parsed document metadata
		text: chunk.text,
		chunkIndex: index,

		// Slide/page information
		slideNumber: format === "pptx" ? chunk.pageOrSlide : undefined,
		pageNumber: format === "pdf" ? chunk.pageOrSlide : undefined,

		// Slide/page title
		slideTitle: format === "pptx" ? chunk.title : undefined,
		sectionTitle: format === "pdf" ? chunk.title : undefined,

		// Speaker notes (PPTX only)
		speakerNotes: format === "pptx" ? chunk.speakerNotes : undefined,

		// Document info
		documentFormat: parseResult.metadata.format,
		documentPageCount: parseResult.metadata.pageCount,
		parserUsed: parseResult.metadata.parsedBy,
		documentTitle: parseResult.metadata.title,
		documentAuthor: parseResult.metadata.author,
	}));

	const ids = chunkTexts.map(() => randomUUID());

	await getPgVector().upsert({
		indexName: SLIDEHEROES_EMBEDDINGS_INDEX,
		ids,
		vectors: embeddings,
		metadata: chunkMetadata,
	});

	return {
		ids,
		chunks: nonEmptyChunks.length,
	};
}

export async function querySimilar(
	query: string,
	topK: number = DEFAULT_TOP_K,
): Promise<QueryResult[]> {
	const normalizedQuery = query.trim();

	if (!normalizedQuery) {
		return [];
	}

	const [queryVector] = await embedValues([normalizedQuery]);

	if (!queryVector || queryVector.length === 0) {
		return [];
	}

	await ensureEmbeddingsIndex(queryVector.length);

	return getPgVector().query({
		indexName: SLIDEHEROES_EMBEDDINGS_INDEX,
		queryVector,
		topK,
	});
}
