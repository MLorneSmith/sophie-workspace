import { createServiceLogger } from "@kit/shared/logger";
import { getLangfuseClient, isLangfuseConfigured } from "./langfuse-client";
import type { ChatMessage } from "../index";

const { getLogger } = createServiceLogger("langfuse-prompt-service");

/**
 * Maps local template names to Langfuse prompt names
 * as per the coding plan design choice
 */
const TEMPLATE_NAME_MAPPING: Record<string, string> = {
	"title-creator": "title-creator",
	"audience-creator": "audience-creator",
	"ideas-creator": "ideas-creator",
	"situation-improvements": "situation-improvements",
	"text-simplifier": "text-simplifier",
	"test-outline-creator": "test-outline-creator",
	"title-suggestions": "title-creator",
	"audience-suggestions": "audience-creator",
	"test-outline": "test-outline-creator",
};

/**
 * Converts a Langfuse prompt message to our ChatMessage format
 * @param langfuseMessage The message from Langfuse
 * @returns ChatMessage in our format
 */
function convertToChatMessage(langfuseMessage: {
	role: string;
	content: string;
}): ChatMessage {
	// Map Langfuse roles to our roles
	// Langfuse uses: "system", "user", "assistant", "tool"
	// We support: "system", "user", "assistant"
	// Default to "user" for unknown roles like "tool"
	let role: ChatMessage["role"] = "user";
	if (
		langfuseMessage.role === "system" ||
		langfuseMessage.role === "user" ||
		langfuseMessage.role === "assistant"
	) {
		role = langfuseMessage.role;
	}

	return {
		role,
		content: langfuseMessage.content,
	};
}

/**
 * Fetches a prompt from Langfuse Cloud by name
 * @param promptName The name of the prompt to fetch
 * @returns ChatMessage[] format or null if not found/not configured
 */
export async function fetchPromptFromLangfuse(
	promptName: string,
): Promise<ChatMessage[] | null> {
	const logger = await getLogger();

	if (!isLangfuseConfigured()) {
		logger.debug("Langfuse not configured, skipping prompt fetch", {
			promptName,
		});
		return null;
	}

	const langfuse = getLangfuseClient();
	if (!langfuse) {
		logger.warn("Langfuse client unavailable", { promptName });
		return null;
	}

	// Map local template name to Langfuse prompt name
	const langfusePromptName = TEMPLATE_NAME_MAPPING[promptName] || promptName;

	try {
		logger.info("Fetching prompt from Langfuse", {
			localName: promptName,
			langfuseName: langfusePromptName,
		});

		// Fetch the prompt from Langfuse using the API
		// biome-ignore lint/suspicious/noExplicitAny: Langfuse SDK types are complex, using any for flexibility
		const prompt: any = await langfuse.api.promptsGet({
			promptName: langfusePromptName,
		});

		if (!prompt) {
			logger.warn("Prompt not found in Langfuse", {
				promptName: langfusePromptName,
			});
			return null;
		}

		// Handle different prompt types from Langfuse
		// Langfuse stores prompts as "chat" or "text" type
		if (prompt.type === "chat") {
			// For chat type, the messages are in the "prompt" field
			// biome-ignore lint/suspicious/noExplicitAny: Langfuse SDK types are complex
			const chatMessages = (prompt as any).prompt || [];
			const messages = chatMessages.map(convertToChatMessage);
			logger.info("Fetched chat prompt from Langfuse", {
				promptName: langfusePromptName,
				messageCount: messages.length,
			});
			return messages;
		} else if (prompt.type === "text") {
			// Text prompt - wrap in a system message
			// biome-ignore lint/suspicious/noExplicitAny: Langfuse SDK types are complex
			const textContent = (prompt as any).prompt || "";
			const message: ChatMessage = {
				role: "system",
				content: textContent,
			};
			logger.info("Fetched text prompt from Langfuse", {
				promptName: langfusePromptName,
			});
			return [message];
		}

		logger.warn("Unknown prompt type from Langfuse", {
			promptName: langfusePromptName,
			type: prompt.type,
		});
		return null;
	} catch (error) {
		logger.error("Error fetching prompt from Langfuse", {
			promptName: langfusePromptName,
			error: error instanceof Error ? error.message : String(error),
		});
		return null;
	}
}

/**
 * Checks if a prompt exists in Langfuse
 * @param promptName The name of the prompt to check
 * @returns true if the prompt exists in Langfuse
 */
export async function hasPromptInLangfuse(
	promptName: string,
): Promise<boolean> {
	const logger = await getLogger();

	if (!isLangfuseConfigured()) {
		return false;
	}

	const langfuse = getLangfuseClient();
	if (!langfuse) {
		return false;
	}

	const langfusePromptName = TEMPLATE_NAME_MAPPING[promptName] || promptName;

	try {
		const prompt = await langfuse.api.promptsGet({
			promptName: langfusePromptName,
		});
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const typedPrompt = prompt as unknown as { type?: string };
		return typedPrompt !== null && typedPrompt !== undefined;
	} catch (error) {
		logger.debug("Error checking prompt existence in Langfuse", {
			promptName: langfusePromptName,
			error: error instanceof Error ? error.message : String(error),
		});
		return false;
	}
}
