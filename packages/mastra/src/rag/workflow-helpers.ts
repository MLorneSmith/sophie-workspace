import type { Agent } from "@mastra/core/agent";

import {
	buildUserMessageWithContext,
	getRAGContextProvider,
	type RAGAgentName,
} from "./context-provider";

/**
 * Options for running an agent with RAG context.
 */
export interface RunAgentWithRAGOptions {
	/** The Mastra agent to run */
	agent: Agent;
	/** User query */
	query: string;
	/** Account ID for tenant isolation */
	accountId: string;
	/** Agent name for retrieval config */
	agentName: RAGAgentName;
	/** Additional system prompt (optional) */
	systemPrompt?: string;
	/** Generation options */
	generationOptions?: Record<string, unknown>;
}

/**
 * Run an agent with RAG context injected into the user message.
 *
 * This helper retrieves relevant context from the knowledge base and injects it
 * into the user message before calling the agent. It follows the pattern of
 * injecting context into user messages as established in the codebase.
 *
 * @param options - Options for running the agent with RAG
 * @returns Agent generation result
 */
export async function runAgentWithRAG(
	options: RunAgentWithRAGOptions,
): Promise<{
	text?: unknown;
	object?: unknown;
	totalUsage?: Promise<unknown>;
}> {
	const {
		agent,
		query,
		accountId,
		agentName,
		systemPrompt,
		generationOptions = {},
	} = options;

	// Retrieve RAG context
	const ragProvider = getRAGContextProvider();
	const ragContext = await ragProvider.getContext({
		agentName,
		query,
		accountId,
	});

	// Build user message with injected context
	const userContent = buildUserMessageWithContext(query, ragContext);

	// Build messages array using the correct type for Mastra agents
	const messages: Array<{ role: "user" | "system"; content: string }> = [];

	// Add system prompt if provided
	if (systemPrompt) {
		messages.push({ role: "system", content: systemPrompt });
	}

	// Add user message with RAG context
	messages.push({ role: "user", content: userContent });

	// Generate with agent - use type assertion to handle complex Mastra types
	// biome-ignore lint/suspicious/noExplicitAny: Mastra agent.generate has complex overloaded types
	return agent.generate(messages as any, generationOptions as any) as any;
}

/**
 * Run an agent with RAG context, returning structured output.
 *
 * @param options - Options including schema for structured output
 * @returns Parsed structured output
 */
export async function runAgentWithRAGStructured<
	T extends Record<string, unknown>,
>(
	options: RunAgentWithRAGOptions & {
		/** Zod schema for structured output */
		schema: { parse: (value: unknown) => T };
	},
): Promise<{ data: T; usage?: unknown; model?: string }> {
	const output = await runAgentWithRAG(options);

	const data = options.schema.parse(output.object ?? {});

	return {
		data,
		usage: output.totalUsage,
	};
}
