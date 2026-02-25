/**
 * RAG utilities for document embedding and similarity search.
 *
 * This is a deep-import module to avoid bundling RAG dependencies
 * in client-side code. Import via "@kit/mastra/rag".
 */

export {
	embedDocument,
	querySimilar,
	SLIDEHEROES_EMBEDDINGS_INDEX,
} from "./rag/index";
