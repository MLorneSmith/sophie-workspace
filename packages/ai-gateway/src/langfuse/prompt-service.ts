import { createServiceLogger } from "@kit/shared/logger";
import { getLangfuseClient, isLangfuseConfigured } from "./langfuse-client";
import type { ChatMessage } from "../index";
import { loadTemplate, compileTemplate } from "../prompts/prompt-manager";

const { getLogger } = createServiceLogger("langfuse-prompt-service");

/**
 * Options for fetching a prompt from Langfuse
 */
export interface PromptOptions {
	/** The label of the prompt version to fetch (default: "production") */
	label?: string;
	/** The specific version number to fetch (optional) */
	version?: number;
	/** Cache TTL in seconds (default: 60) */
	cacheTTL?: number;
}

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
 * Loads a local template and compiles it with variables
 * Used as fallback when Langfuse is unavailable
 * @param promptName The name of the prompt to load
 * @param variables The variables to compile into the template
 * @returns Compiled ChatMessage[]
 */
async function loadAndCompileLocalTemplate(
	promptName: string,
	variables: Record<string, string>,
): Promise<ChatMessage[]> {
	const logger = getLogger();

	// Map the prompt name to local template name
	const localTemplateName =
		Object.entries(TEMPLATE_NAME_MAPPING).find(
			([, langfuseName]) => langfuseName === promptName,
		)?.[0] || promptName;

	try {
		const template = loadTemplate(localTemplateName);
		const compiled = template.map((message) => ({
			...message,
			content: compileTemplate(message.content, variables),
		}));

		logger.info("Loaded local template as fallback", {
			promptName,
			localTemplateName,
			messageCount: compiled.length,
		});

		return compiled;
	} catch (error) {
		logger.error("Failed to load local template fallback", {
			promptName,
			localTemplateName,
			error: error instanceof Error ? error.message : String(error),
		});
		throw error;
	}
}

/**
 * Fetches a prompt from Langfuse Cloud by name and compiles it with variables
 * @param promptName The name of the prompt to fetch
 * @param variables The variables to compile into the prompt template
 * @param options Optional configuration for the prompt fetch
 * @returns Compiled ChatMessage[] or falls back to local template on error
 */
export async function getPrompt(
	promptName: string,
	variables: Record<string, string>,
	options?: PromptOptions,
): Promise<ChatMessage[]> {
	const logger = getLogger();

	if (!isLangfuseConfigured()) {
		logger.debug("Langfuse not configured, using local template", {
			promptName,
		});
		return loadAndCompileLocalTemplate(promptName, variables);
	}

	const langfuse = getLangfuseClient();
	if (!langfuse) {
		logger.warn("Langfuse client unavailable, using local template", {
			promptName,
		});
		return loadAndCompileLocalTemplate(promptName, variables);
	}

	// Map local template name to Langfuse prompt name
	const langfusePromptName = TEMPLATE_NAME_MAPPING[promptName] || promptName;

	try {
		logger.info("Fetching prompt from Langfuse", {
			localName: promptName,
			langfuseName: langfusePromptName,
			label: options?.label ?? "production",
			version: options?.version,
		});

		// Fetch the prompt from Langfuse using the SDK
		// biome-ignore lint/suspicious/noExplicitAny: Langfuse SDK types are complex
		const langfusePrompt: any = await langfuse.getPrompt(
			langfusePromptName,
			options?.version,
			{
				type: "chat",
				label: options?.label ?? "production",
				cacheTtlSeconds: options?.cacheTTL ?? 60,
			},
		);

		if (!langfusePrompt) {
			logger.warn("Prompt not found in Langfuse, using local template", {
				promptName: langfusePromptName,
			});
			return loadAndCompileLocalTemplate(promptName, variables);
		}

		// Compile the prompt with variables
		// biome-ignore lint/suspicious/noExplicitAny: Langfuse SDK compile returns compiled messages
		const compiled: any = langfusePrompt.compile(variables);

		// Convert to our ChatMessage format
		const messages = compiled.map(convertToChatMessage);

		logger.info("Fetched and compiled prompt from Langfuse", {
			promptName: langfusePromptName,
			messageCount: messages.length,
			variableCount: Object.keys(variables).length,
		});

		return messages;
	} catch (error) {
		logger.warn(
			"Langfuse prompt fetch failed, falling back to local template",
			{
				promptName: langfusePromptName,
				error: error instanceof Error ? error.message : String(error),
			},
		);
		return loadAndCompileLocalTemplate(promptName, variables);
	}
}

/**
 * Fetches a prompt from Langfuse Cloud by name (legacy function)
 * @param promptName The name of the prompt to fetch
 * @returns ChatMessage[] format or null if not found/not configured
 * @deprecated Use getPrompt() instead which handles variable compilation
 */
export async function fetchPromptFromLangfuse(
	promptName: string,
): Promise<ChatMessage[] | null> {
	const logger = getLogger();

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
		logger.info("Fetching prompt from Langfuse (legacy)", {
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
	const logger = getLogger();

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
