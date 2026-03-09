/**
 * Agent instructions helper with Langfuse override capability
 *
 * This module provides a helper function that Mastra agents can use to
 * optionally fetch their instructions from Langfuse at startup, while
 * falling back to local constants when Langfuse is unavailable.
 *
 * Usage in agent files:
 *   import { getAgentInstructions } from "@kit/ai-gateway/langfuse/agent-instructions";
 *   import { EDITOR_AGENT_INSTRUCTIONS } from "./local-instructions";
 *
 *   const instructions = await getAgentInstructions("agent-editor", EDITOR_AGENT_INSTRUCTIONS);
 */

import { createServiceLogger } from "@kit/shared/logger";
import { isLangfuseConfigured } from "./langfuse-client";
import { getPrompt } from "./prompt-service";

const { getLogger } = createServiceLogger("agent-instructions");

/**
 * Gets agent instructions, optionally from Langfuse with local fallback
 *
 * @param agentName - The name of the agent (e.g., "agent-editor")
 * @param localInstructions - The default local instructions to use as fallback
 * @returns The instructions string (either from Langfuse or local)
 */
export async function getAgentInstructions(
	agentName: string,
	localInstructions: string,
): Promise<string> {
	const logger = await getLogger();

	// If Langfuse is not configured, use local instructions
	if (!isLangfuseConfigured()) {
		logger.debug("Langfuse not configured, using local agent instructions", {
			agentName,
		});
		return localInstructions;
	}

	try {
		// Try to fetch from Langfuse
		const langfuseMessages = await getPrompt(agentName, {});

		if (langfuseMessages && langfuseMessages.length > 0) {
			// For agent instructions, we expect a single system message
			const systemMessage = langfuseMessages.find((m) => m.role === "system");
			if (systemMessage) {
				logger.info("Using Langfuse instructions for agent", { agentName });
				return systemMessage.content;
			}
		}

		// If we got here but no messages, fall back to local
		logger.debug("No Langfuse prompt found, using local instructions", {
			agentName,
		});
		return localInstructions;
	} catch (error) {
		// On any error, fall back to local instructions
		logger.warn("Error fetching from Langfuse, using local instructions", {
			agentName,
			error: error instanceof Error ? error.message : String(error),
		});
		return localInstructions;
	}
}

/**
 * Preloads agent instructions at application startup
 *
 * This can be called during app initialization to warm up the Langfuse cache
 * for agent instructions.
 *
 * @param agents - Array of { name, localInstructions } objects
 * @returns Map of agent name to instructions
 */
export async function preloadAgentInstructions<
	T extends { name: string; localInstructions: string },
>(agents: T[]): Promise<Record<string, string>> {
	const logger = await getLogger();
	const results: Record<string, string> = {};

	logger.info("Preloading agent instructions", {
		agentCount: agents.length,
	});

	await Promise.all(
		agents.map(async (agent) => {
			const instructions = await getAgentInstructions(
				agent.name,
				agent.localInstructions,
			);
			results[agent.name] = instructions;
		}),
	);

	logger.info("Agent instructions preloaded", {
		loadedCount: Object.keys(results).length,
	});

	return results;
}
