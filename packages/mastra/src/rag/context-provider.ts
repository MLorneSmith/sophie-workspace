import { querySimilarFiltered } from "./index";
import type { RAGFilterOptions } from "./types";
import {
	CONTENT_TYPES,
	type ContentType,
	DEFAULT_CONTENT_TYPES,
} from "./content-types";

/**
 * Simple console logger for RAG operations.
 * TODO: Migrate to Langfuse once Bifrost integration is available.
 */
const logger = {
	debug: (message: string, meta?: Record<string, unknown>) => {
		// biome-ignore lint/suspicious/noConsole: RAG logger - intentional console usage until Langfuse migration
		console.debug(`[RAG] ${message}`, meta ?? "");
	},
	info: (message: string, meta?: Record<string, unknown>) => {
		// biome-ignore lint/suspicious/noConsole: RAG logger - intentional console usage until Langfuse migration
		console.info(`[RAG] ${message}`, meta ?? "");
	},
	error: (message: string, meta?: Record<string, unknown>) => {
		// biome-ignore lint/suspicious/noConsole: RAG logger - intentional console usage until Langfuse migration
		console.error(`[RAG] ${message}`, meta ?? "");
	},
};

/**
 * Agent names that can receive RAG context.
 */
export type RAGAgentName =
	| "research"
	| "brief-generator"
	| "storyboard-generator"
	| "partner"
	| "validator"
	| "whisperer"
	| "editor";

/**
 * Configuration for RAG retrieval for a specific agent.
 */
export type AgentRetrievalConfig = {
	/** Content types to retrieve for this agent */
	contentTypes: ContentType[];
	/** Maximum number of chunks to retrieve */
	topK: number;
	/** Minimum similarity score threshold */
	minScore: number;
	/** Custom query modification (optional) */
	transformQuery?: (query: string) => string;
};

/**
 * Default retrieval configs per agent type.
 * Maps agents to their appropriate content types and retrieval settings.
 */
const DEFAULT_RETRIEVAL_CONFIGS: Record<RAGAgentName, AgentRetrievalConfig> = {
	research: {
		contentTypes: [
			CONTENT_TYPES.RESEARCH_CORPUS,
			CONTENT_TYPES.USER_UPLOAD,
			CONTENT_TYPES.PLAYBOOK,
		],
		topK: 5,
		minScore: 0.1,
	},
	"brief-generator": {
		contentTypes: [
			CONTENT_TYPES.USER_UPLOAD,
			CONTENT_TYPES.DECK_HISTORY,
			CONTENT_TYPES.PLAYBOOK,
		],
		topK: 5,
		minScore: 0.1,
	},
	"storyboard-generator": {
		contentTypes: [
			CONTENT_TYPES.USER_UPLOAD,
			CONTENT_TYPES.DECK_HISTORY,
			CONTENT_TYPES.PLAYBOOK,
		],
		topK: 5,
		minScore: 0.1,
	},
	partner: {
		contentTypes: DEFAULT_CONTENT_TYPES,
		topK: 5,
		minScore: 0.1,
	},
	validator: {
		contentTypes: [CONTENT_TYPES.PLAYBOOK, CONTENT_TYPES.USER_UPLOAD],
		topK: 3,
		minScore: 0.2,
	},
	whisperer: {
		contentTypes: [CONTENT_TYPES.USER_UPLOAD, CONTENT_TYPES.DECK_HISTORY],
		topK: 5,
		minScore: 0.1,
	},
	editor: {
		contentTypes: [
			CONTENT_TYPES.USER_UPLOAD,
			CONTENT_TYPES.DECK_HISTORY,
			CONTENT_TYPES.PLAYBOOK,
		],
		topK: 5,
		minScore: 0.1,
	},
};

/**
 * RAG context retrieved for an agent query.
 */
export type RAGContext = {
	/** Formatted context string for injection into prompts */
	contextText: string;
	/** Raw retrieved chunks */
	chunks: RAGChunk[];
	/** Content types retrieved */
	contentTypes: ContentType[];
	/** Whether retrieval succeeded */
	success: boolean;
	/** Error message if retrieval failed */
	error?: string;
};

/**
 * A single chunk retrieved from RAG.
 */
export type RAGChunk = {
	/** Chunk text content */
	text: string;
	/** Source identifier (e.g., filename) */
	source?: string;
	/** Content type of the chunk */
	contentType: ContentType;
	/** Similarity score */
	score: number;
	/** Additional metadata */
	metadata?: Record<string, unknown>;
};

/**
 * Options for retrieving RAG context.
 */
export type GetRAGContextOptions = {
	/** Agent requesting context */
	agentName: RAGAgentName;
	/** User query to find relevant context */
	query: string;
	/** Account ID for tenant isolation */
	accountId: string;
	/** Override default content types */
	contentTypes?: ContentType[];
	/** Override default topK */
	topK?: number;
	/** Override default minScore */
	minScore?: number;
};

/**
 * RAG Context Provider.
 *
 * Provides RAG retrieval capabilities with:
 * - Per-agent retrieval strategies
 * - Multi-tenant isolation
 * - Graceful degradation on failure
 * - Observability logging
 */
export class RAGContextProvider {
	/**
	 * Get RAG context for an agent query.
	 *
	 * @param options - Retrieval options
	 * @returns RAG context for injection into agent prompts
	 */
	async getContext(options: GetRAGContextOptions): Promise<RAGContext> {
		const { agentName, query, accountId, contentTypes, topK, minScore } =
			options;

		const startTime = Date.now();

		try {
			// Get agent's retrieval config (with overrides)
			const config = this.getRetrievalConfig(agentName, {
				contentTypes,
				topK,
				minScore,
			});

			// Build query filters
			const filters: RAGFilterOptions = {
				accountId,
				contentType: config.contentTypes,
			};

			// Optionally transform query
			const searchQuery = config.transformQuery
				? config.transformQuery(query)
				: query;

			// Execute similarity search
			const results = await querySimilarFiltered(
				searchQuery,
				config.topK,
				filters,
			);

			// Process results into chunks
			const chunks: RAGChunk[] = results.map((result, index): RAGChunk => {
				const metadata = result.metadata ?? {};
				return {
					text: typeof metadata.text === "string" ? metadata.text : "",
					source:
						typeof metadata.filename === "string"
							? metadata.filename
							: undefined,
					contentType:
						(metadata.contentType as ContentType) ?? CONTENT_TYPES.USER_UPLOAD,
					score: Math.max(0, 1 - index * 0.1),
					metadata,
				};
			});

			// Format context text
			const contextText = this.formatContext(chunks);
			const retrievedTypes = [...new Set(chunks.map((c) => c.contentType))];

			const durationMs = Date.now() - startTime;

			logger.debug("rag-context-retrieved", {
				agentName,
				accountId,
				chunksFound: chunks.length,
				durationMs,
				contentTypes: retrievedTypes,
			});

			return {
				contextText,
				chunks,
				contentTypes: retrievedTypes,
				success: true,
			};
		} catch (error) {
			const durationMs = Date.now() - startTime;
			const errorMessage =
				error instanceof Error ? error.message : String(error);

			logger.error("rag-context-retrieval-failed", {
				agentName,
				accountId,
				error: errorMessage,
				durationMs,
			});

			// Graceful degradation - return empty context on failure
			return {
				contextText: "",
				chunks: [],
				contentTypes: [],
				success: false,
				error: errorMessage,
			};
		}
	}

	/**
	 * Get retrieval config for an agent, with optional overrides.
	 */
	private getRetrievalConfig(
		agentName: RAGAgentName,
		overrides?: Partial<AgentRetrievalConfig>,
	): AgentRetrievalConfig {
		const defaultConfig = DEFAULT_RETRIEVAL_CONFIGS[agentName];

		return {
			...defaultConfig,
			...overrides,
			contentTypes: overrides?.contentTypes ?? defaultConfig.contentTypes,
		};
	}

	/**
	 * Format retrieved chunks into a context string for prompt injection.
	 */
	private formatContext(chunks: RAGChunk[]): string {
		if (chunks.length === 0) {
			return "";
		}

		const sections: string[] = [];

		// Group chunks by source
		const bySource = new Map<string, RAGChunk[]>();
		for (const chunk of chunks) {
			const source = chunk.source ?? "unknown";
			const existing = bySource.get(source);
			if (existing) {
				existing.push(chunk);
			} else {
				bySource.set(source, [chunk]);
			}
		}

		// Format each source
		for (const [source, sourceChunks] of bySource) {
			const contentTypes = [...new Set(sourceChunks.map((c) => c.contentType))];
			sections.push(`## ${source} (${contentTypes.join(", ")})`);

			for (const chunk of sourceChunks) {
				sections.push(`\n${chunk.text}\n`);
			}
		}

		return sections.join("\n");
	}
}

/**
 * Singleton instance of RAGContextProvider.
 */
let _ragContextProvider: RAGContextProvider | null = null;

/**
 * Get the RAGContextProvider singleton.
 */
export function getRAGContextProvider(): RAGContextProvider {
	if (!_ragContextProvider) {
		_ragContextProvider = new RAGContextProvider();
	}
	return _ragContextProvider;
}

/**
 * Build a user message with RAG context injected.
 *
 * @param query - The user's query
 * @param ragContext - Retrieved RAG context
 * @returns Formatted user message with context
 */
export function buildUserMessageWithContext(
	query: string,
	ragContext: RAGContext,
): string {
	if (!ragContext.success || !ragContext.contextText) {
		return query;
	}

	return [
		"## Context (from knowledge base)",
		ragContext.contextText,
		"",
		"## User Query",
		query,
	].join("\n\n");
}
