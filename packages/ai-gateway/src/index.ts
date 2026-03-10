import { createServiceLogger } from "@kit/shared/logger";
import { OpenAI } from "openai";
import { z } from "zod";
import { _createGatewayClient } from "./enhanced-gateway-client";
import { initializeAiGatewayDatabase } from "./utils/db-init";
import { getSupabaseClient } from "./utils/supabase-client";
import {
	_calculateCost,
	_checkUsageLimits,
	estimateCost,
	recordApiUsage,
} from "./utils/usage-tracking";

// Initialize service logger
const { getLogger } = createServiceLogger("AI-GATEWAY");

/**
 * Derives the provider name from a model name
 * @param model The model name (e.g., "gpt-4o", "claude-3.5-sonnet", "openai/gpt-4o")
 * @returns The provider name ("openai", "anthropic", "groq", etc.)
 */
function deriveProviderFromModel(model: string): string {
	// Handle Bifrost format (provider/model)
	if (model.includes("/")) {
		return model.split("/")[0] ?? "openai";
	}
	// Handle model name prefixes
	if (model.toLowerCase().startsWith("claude-")) return "anthropic";
	if (model.toLowerCase().startsWith("llama-")) return "groq";
	if (model.toLowerCase().startsWith("gemini-")) return "google";
	// Default to openai for gpt models
	return "openai";
}

// Define available environment variables for feature flags
const ENV = {
	BYPASS_AI_CREDITS: process.env.BYPASS_AI_CREDITS !== "false", // Default to true unless explicitly set to false
	CHECK_AI_USAGE_LIMITS: process.env.CHECK_AI_USAGE_LIMITS === "true", // Default to false unless explicitly set to true
	AI_USAGE_DEBUG: process.env.AI_USAGE_DEBUG === "true", // Enable more verbose debug logging
	INITIALIZE_DATABASE: process.env.INITIALIZE_DATABASE !== "false", // Default to true
};

// Attempt to initialize the database on module load if enabled
if (ENV.INITIALIZE_DATABASE) {
	(async () => {
		try {
			// Get admin client for database initialization
			const adminClient = await getSupabaseClient({ admin: true });

			// Initialize the database
			const success = await initializeAiGatewayDatabase(adminClient);
			if (success) {
				(await getLogger()).info(
					"AI Gateway database successfully initialized",
				);
			} else {
				(await getLogger()).warn(
					"AI Gateway database initialization had some issues, check logs for details",
				);
			}
		} catch (error) {
			(await getLogger()).error("Error initializing AI Gateway database:", {
				data: error,
			});
			// Continue module loading despite initialization error
		}
	})();
}

/**
 * Helper function to check usage limits with improved error handling
 *
 * @param userId Optional user ID
 * @param teamId Optional team ID
 * @returns Promise<boolean> True if the user/team has exceeded their usage limits
 */
async function checkUserLimits(
	userId?: string,
	teamId?: string,
): Promise<boolean> {
	if (!userId && !teamId) return false;

	// Skip check if disabled by environment variable
	if (!ENV.CHECK_AI_USAGE_LIMITS) {
		(await getLogger()).info(
			"AI usage limits check disabled by environment variable",
		);
		return false;
	}

	try {
		const supabase = await getSupabaseClient();

		// Validate the Supabase client has required methods
		if (!supabase || typeof supabase.rpc !== "function") {
			(await getLogger()).warn(
				"Invalid Supabase client, skipping usage limit check",
			);
			return false;
		}

		// Try with regular client first
		try {
			const limitExceeded = await _checkUsageLimits(supabase, userId, teamId);
			if (limitExceeded) {
				(await getLogger()).info("AI usage limit exceeded for user/team:", {
					userId,
					teamId,
				});
				return true;
			}
			return false;
		} catch (regularClientError) {
			(await getLogger()).error(
				"Error checking usage limits with regular client:",
				{ error: regularClientError },
			);

			// If it's a permission error, try with admin client
			if (
				regularClientError instanceof Error &&
				regularClientError.message?.includes("permission denied")
			) {
				(await getLogger()).info(
					"Attempting usage limits check with admin client...",
				);
				try {
					// Get admin client for privileged operations
					const adminClient = await getSupabaseClient({ admin: true });
					return await _checkUsageLimits(adminClient, userId, teamId);
				} catch (adminClientError) {
					(await getLogger()).error(
						"Error checking usage limits with admin client:",
						{ error: adminClientError },
					);
					return false;
				}
			}
			return false;
		}
	} catch (error) {
		(await getLogger()).error("Fatal error checking usage limits:", {
			data: error,
		});
		return false;
	}
}

// Types for chat messages
export type Role = "system" | "user" | "assistant";

export interface ChatMessage {
	role: Role;
	content: string;
}

// Zod schema for validation
const ChatMessageSchema = z.object({
	role: z.enum(["system", "user", "assistant"]),
	content: z.string(),
});

const ChatMessagesSchema = z.array(ChatMessageSchema);

export interface ChatCompletionOptions {
	model?: string;
	temperature?: number;
	virtualKey?: string;
	userId?: string;
	teamId?: string;
	feature?: string;
	sessionId?: string;
	checkUsageLimits?: boolean;
	bypassCredits?: boolean;
	/** Per-request timeout in ms. Applied at the HTTP client level. */
	timeout?: number;
	/** AbortSignal to cancel the request externally (e.g. from a timeout wrapper). */
	signal?: AbortSignal;
	/** Prompt name for Langfuse observability linkage */
	promptName?: string;
	/** Prompt version for Langfuse observability linkage */
	promptVersion?: number;
}

export interface CompletionResult {
	content: string;
	metadata: {
		requestId: string;
		cost: number;
		tokens: {
			prompt: number;
			completion: number;
			total: number;
		};
		provider: string;
		model: string;
		feature?: string;
		userId?: string;
		teamId?: string;
		usageLimitExceeded?: boolean;
	};
}

export class AiUsageLimitError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "AiUsageLimitError";
	}
}

/**
 * Get a chat completion from the AI model with cost tracking
 * @param messages Array of chat messages
 * @param options Configuration options for the chat completion
 * @returns The AI model's response text and usage metadata
 */
export async function getChatCompletion(
	messages: ChatMessage[],
	options: ChatCompletionOptions = {},
): Promise<CompletionResult> {
	try {
		// Validate messages
		ChatMessagesSchema.parse(messages);

		const {
			userId,
			teamId,
			feature,
			sessionId,
			virtualKey,
			checkUsageLimits: shouldCheckLimits = true,
			timeout: requestTimeout,
			signal,
		} = options;

		const model = options.model ?? "openai/gpt-5";

		// Reasoning models (o-series, gpt-5) only support temperature=1
		const isReasoningModel = /\b(o1|o3|o4|gpt-5)\b/i.test(model);
		const temperature = isReasoningModel
			? undefined
			: (options.temperature ?? 0.7);

		// Read environment variable to determine if we should check usage limits
		const checkUsageLimitsFlag = process.env.CHECK_AI_USAGE_LIMITS === "true";

		// Only check usage limits if explicitly enabled via environment variable
		if (checkUsageLimitsFlag && shouldCheckLimits && (userId || teamId)) {
			(await getLogger()).info("Checking AI usage limits for:", {
				userId,
				teamId,
				feature,
			});
			const limitExceeded = await checkUserLimits(userId, teamId);
			if (limitExceeded) {
				(await getLogger()).warn("AI usage limit exceeded for:", {
					userId,
					teamId,
					feature,
				});
				throw new AiUsageLimitError(
					"Usage limit exceeded. Please contact support to increase your limit.",
				);
			}
		} else {
			(await getLogger()).info("Skipping AI usage limits check:", {
				reason: !checkUsageLimitsFlag
					? "feature disabled by environment"
					: "no user/team ID or disabled by options",
				hasUserId: !!userId,
				hasTeamId: !!teamId,
				feature,
			});
		}

		// Create client with tracking metadata and virtual key
		const { client, bifrostModel } = await _createGatewayClient({
			userId,
			teamId,
			feature,
			sessionId,
			virtualKey,
			model,
			timeout: requestTimeout,
			promptName: options.promptName,
			promptVersion: options.promptVersion,
		});

		// Configure request options
		const requestOptions: OpenAI.Chat.ChatCompletionCreateParams = {
			messages,
			model: bifrostModel,
			...(temperature !== undefined && { temperature }),
		};

		const response = await client.chat.completions.create(requestOptions, {
			...(signal && { signal }),
		});

		// Validate gateway response — empty responses indicate gateway misconfiguration
		if (!response.choices?.length || !response.choices[0]?.message?.content) {
			(await getLogger()).warn(
				"Gateway returned empty response — no choices or content",
				{
					hasId: !!response.id,
					choicesLength: response.choices?.length ?? 0,
					model: bifrostModel,
					feature,
				},
			);
		}

		// Extract response content
		const content = response.choices?.[0]?.message?.content || "";

		// Extract request ID and usage data
		const requestId = response.id;
		const usage = response.usage || {
			prompt_tokens: 0,
			completion_tokens: 0,
			total_tokens: 0,
		};

		let cost = 0;

		// Track usage if database access is available (fail gracefully on permission issues)
		try {
			// Get the Supabase client for recording usage
			const supabase = await getSupabaseClient();

			// If no cost in headers, calculate based on token usage
			if (cost === 0) {
				try {
					// Calculate cost based on token usage and model pricing
					cost = await _calculateCost(
						supabase,
						deriveProviderFromModel(model),
						model,
						usage.prompt_tokens,
						usage.completion_tokens,
					);
				} catch (costError) {
					(await getLogger()).error("Error calculating AI cost:", {
						data: costError,
					});
					// Use our local fallback pricing for cost calculation
					cost = estimateCost(
						deriveProviderFromModel(model),
						model,
						usage.prompt_tokens,
						usage.completion_tokens,
					);
				}
			}

			// Record usage
			if (userId || teamId) {
				try {
					// Read environment variable to determine if credits should be bypassed
					const bypassCreditsFlag = process.env.BYPASS_AI_CREDITS !== "false"; // Default to true unless explicitly set to false

					(await getLogger()).info("AI credits system status:", {
						bypassCredits: bypassCreditsFlag,
						reason: bypassCreditsFlag
							? "Bypassing credits due to configuration"
							: "Credits system enabled",
					});

					await recordApiUsage(supabase, {
						userId,
						teamId,
						requestId,
						provider: deriveProviderFromModel(model),
						model,
						promptTokens: usage.prompt_tokens,
						completionTokens: usage.completion_tokens,
						totalTokens: usage.total_tokens,
						cost,
						feature,
						sessionId,
						bypassCredits: bypassCreditsFlag, // Use environment variable instead of hardcoding
					});
				} catch (usageError) {
					(await getLogger()).error("Error recording API usage:", {
						data: usageError,
					});
					// Continue without failing - usage tracking is secondary to the main functionality
				}
			}
		} catch (dbError) {
			(await getLogger()).error("Database access error:", { data: dbError });
			// Continue without failing - the AI response is still valid
		}

		return {
			content,
			metadata: {
				requestId,
				cost,
				tokens: {
					prompt: usage.prompt_tokens,
					completion: usage.completion_tokens,
					total: usage.total_tokens,
				},
				provider: deriveProviderFromModel(model),
				model,
				feature,
				userId,
				teamId,
			},
		};
	} catch (error) {
		if (error instanceof AiUsageLimitError) {
			throw error; // Re-throw usage limit errors to handle them specifically
		}

		if (error instanceof OpenAI.APIError) {
			(await getLogger()).error("OpenAI API Error:", {
				status: error.status,
				message: error.message,
				code: error.code,
				type: error.type,
			});
		} else {
			(await getLogger()).error("Error in getChatCompletion:", { data: error });
		}
		throw error;
	}
}

/**
 * Get a chat completion with streaming enabled
 * @param messages Array of chat messages
 * @param options Configuration options for the chat completion
 * @returns AsyncGenerator that yields chunks of the response
 */
export async function* getStreamingChatCompletion(
	messages: ChatMessage[],
	options: ChatCompletionOptions = {},
): AsyncGenerator<string> {
	try {
		// Validate messages
		ChatMessagesSchema.parse(messages);

		const {
			userId,
			teamId,
			feature,
			sessionId,
			virtualKey,
			checkUsageLimits: shouldCheckLimits = true,
		} = options;

		const model = options.model ?? "openai/gpt-5";

		// Reasoning models (o-series, gpt-5) only support temperature=1
		const isReasoningModel = /\b(o1|o3|o4|gpt-5)\b/i.test(model);
		const temperature = isReasoningModel
			? undefined
			: (options.temperature ?? 0.7);

		// Read environment variable to determine if we should check usage limits
		const checkUsageLimitsFlag = process.env.CHECK_AI_USAGE_LIMITS === "true";

		// Only check usage limits if explicitly enabled via environment variable
		if (checkUsageLimitsFlag && shouldCheckLimits && (userId || teamId)) {
			(await getLogger()).info("Checking AI usage limits for streaming:", {
				userId,
				teamId,
				feature,
			});
			const limitExceeded = await checkUserLimits(userId, teamId);
			if (limitExceeded) {
				(await getLogger()).warn("AI usage limit exceeded for streaming:", {
					userId,
					teamId,
					feature,
				});
				throw new AiUsageLimitError(
					"Usage limit exceeded. Please contact support to increase your limit.",
				);
			}
		} else {
			(await getLogger()).info(
				"Skipping AI usage limits check for streaming:",
				{
					reason: !checkUsageLimitsFlag
						? "feature disabled by environment"
						: "no user/team ID or disabled by options",
					hasUserId: !!userId,
					hasTeamId: !!teamId,
					feature,
				},
			);
		}

		// Create client with tracking metadata and virtual key
		const { client, bifrostModel } = await _createGatewayClient({
			userId,
			teamId,
			feature,
			sessionId,
			virtualKey,
			model,
			promptName: options.promptName,
			promptVersion: options.promptVersion,
		});

		// Configure request options
		const requestOptions: OpenAI.Chat.ChatCompletionCreateParams = {
			messages,
			model: bifrostModel,
			...(temperature !== undefined && { temperature }),
			stream: true,
		};

		// Get the streaming response
		// Using unknown type to avoid TypeScript errors with streaming
		const stream = (await client.chat.completions.create(
			requestOptions,
		)) as unknown as AsyncIterable<{
			choices: Array<{ delta: { content?: string } }>;
			id?: string;
			usage?: { prompt_tokens?: number; completion_tokens?: number };
		}>;

		// We'll collect token counts as they stream to calculate total usage
		let promptTokens = 0;
		let completionTokens = 0;
		let responseId = "";

		// Note: Headers are not available on AsyncIterable streams
		(await getLogger()).info(
			"Streaming response initiated - headers not available on AsyncIterable",
		);

		// Process the stream - use a try catch to handle any streaming errors
		try {
			// Handle both types of streaming responses from OpenAI
			// Process the async iterable stream
			for await (const chunk of stream) {
				// Extract usage information when available
				if (chunk.usage) {
					promptTokens = chunk.usage.prompt_tokens ?? 0;
					completionTokens = chunk.usage.completion_tokens ?? 0;
				}

				// Try to get request ID
				if (!responseId && chunk.id) {
					responseId = chunk.id;
				}

				// Yield the delta content
				const content = chunk.choices?.[0]?.delta?.content;
				if (content) {
					yield content;
				}
			}
		} catch (streamError) {
			(await getLogger()).error("Error processing stream:", {
				data: streamError,
			});
			yield "[Error processing stream]";
		}

		const totalTokens = promptTokens + completionTokens;

		// Record usage after streaming completes
		if ((userId || teamId) && responseId) {
			try {
				// Get the Supabase client for recording usage
				const supabase = await getSupabaseClient();

				// Calculate cost based on token usage with proper parameters
				let cost: number;
				try {
					cost = await _calculateCost(
						supabase,
						"openai",
						model,
						promptTokens,
						completionTokens,
					);
				} catch (costError) {
					(await getLogger()).error("Error calculating streaming cost:", {
						data: costError,
					});
					// Use our local fallback pricing for cost calculation
					cost = estimateCost(
						deriveProviderFromModel(model),
						model,
						promptTokens,
						completionTokens,
					);
				}

				// Read environment variable to determine if credits should be bypassed
				const bypassCreditsFlag = process.env.BYPASS_AI_CREDITS !== "false"; // Default to true unless explicitly set to false

				(await getLogger()).info("AI credits system status (streaming):", {
					bypassCredits: bypassCreditsFlag,
					reason: bypassCreditsFlag
						? "Bypassing credits due to configuration"
						: "Credits system enabled",
					feature,
					model,
				});

				// Record usage with proper Supabase client parameter
				await recordApiUsage(supabase, {
					userId,
					teamId,
					requestId: responseId,
					provider: deriveProviderFromModel(model),
					model,
					promptTokens,
					completionTokens,
					totalTokens,
					cost,
					feature,
					sessionId,
					bypassCredits: bypassCreditsFlag, // Use environment variable instead of hardcoding
				});
			} catch (error) {
				(await getLogger()).error("Error recording usage data:", {
					data: error,
				});
				// Continue without failing the response delivery
			}
		}
	} catch (error) {
		if (error instanceof AiUsageLimitError) {
			throw error; // Re-throw usage limit errors to handle them specifically
		}

		if (error instanceof OpenAI.APIError) {
			(await getLogger()).error("OpenAI API Error:", {
				status: error.status,
				message: error.message,
				code: error.code,
				type: error.type,
			});
		} else {
			(await getLogger()).error("Error in getStreamingChatCompletion:", {
				data: error,
			});
		}
		throw error;
	}
}

// Export messages
export { ideasCreatorSystem } from "./prompts/messages/system/ideas-creator";
// Export prompt partials
export { baseInstructions } from "./prompts/partials/base-instructions";
export { improvementFormat } from "./prompts/partials/improvement-format";
export { improvementProcess } from "./prompts/partials/improvement-process";
export { outlineRewriteInstructions } from "./prompts/partials/outline-rewrite";
export { sectionAnalysis } from "./prompts/partials/section-analysis";
export { simplifiedFormat } from "./prompts/partials/simplified-format";
// Export context curation (includes backward-compatible presentationContext)
export {
	curatePresentationContext,
	type CurationInput,
	presentationContext,
} from "./prompts/partials/curate-presentation-context";
// Export stage types
export type {
	PresentationStage,
	ContextDataSource,
} from "./prompts/types/context-stages";
// Export prompt manager
export {
	compileTemplate,
	getAvailableTemplates,
	loadTemplate,
	PromptManager,
} from "./prompts/prompt-manager";
// Export prompt service and agent instructions
export {
	getPrompt,
	fetchPromptFromLangfuse,
	hasPromptInLangfuse,
	type PromptOptions,
} from "./langfuse/prompt-service";
export {
	getAgentInstructions,
	preloadAgentInstructions,
} from "./langfuse/agent-instructions";
// Export templates
export { textSimplificationTemplate } from "./prompts/templates/text-simplification";
// Export types from prompts
export type { Improvement } from "./prompts/types/improvements";
export * from "./prompts/types/improvements";
// Export utils
export { parseImprovements } from "./utils/parse-improvements";
export type {
	SimplifiedContent,
	SimplifiedSection,
} from "./utils/parse-simplified";
export { parseSimplified } from "./utils/parse-simplified";
