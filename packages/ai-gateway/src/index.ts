import { createServiceLogger } from "@kit/shared/logger";
import { OpenAI } from "openai";
import { z } from "zod";
import {
	ConfigManager,
	loadTemplate,
	mergeWithUseCase,
	normalizeConfig,
	overrideWithPortkey,
} from "./configs/config-manager";
import type { Config } from "./configs/types";
import { _createGatewayClient } from "./enhanced-gateway-client";
import { PromptManager } from "./prompts/prompt-manager";
import { initializeAiGatewayDatabase } from "./utils/db-init";
import { getSupabaseClient } from "./utils/supabase-client";
import {
	_calculateCost,
	_checkUsageLimits,
	_extractCostFromHeaders,
	estimateCost,
	recordApiUsage,
} from "./utils/usage-tracking";

// Initialize service logger
const { getLogger } = createServiceLogger("AI-GATEWAY");

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
	config?: string | Config;
	userId?: string;
	teamId?: string;
	feature?: string;
	sessionId?: string;
	checkUsageLimits?: boolean;
	bypassCredits?: boolean;
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
			model = "gpt-3.5-turbo",
			temperature = 0.7,
			userId,
			teamId,
			feature,
			sessionId,
			checkUsageLimits: shouldCheckLimits = true,
			bypassCredits: _bypassCredits = false,
			config,
		} = options;

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
			// Log that we're skipping the check
			(await getLogger()).info("Skipping AI usage limits check:", {
				reason: !checkUsageLimitsFlag
					? "feature disabled by environment"
					: "no user/team ID or disabled by options",
				hasUserId: !!userId,
				hasTeamId: !!teamId,
				feature,
			});
		}

		// Create client with tracking metadata, config, and model info
		const client = await _createGatewayClient({
			userId,
			teamId,
			feature,
			sessionId,
			config, // Pass config to client creation
			model, // Pass model to determine the correct provider
		});

		// Configure request options WITHOUT the config parameter
		const requestOptions: OpenAI.Chat.ChatCompletionCreateParams = {
			messages,
			model,
			temperature,
		};

		// No longer need to add config to requestOptions

		const response = await client.chat.completions.create(requestOptions);

		// Extract response content
		const content = response.choices?.[0]?.message?.content || "";

		// Extract request ID and usage data
		const requestId = response.id;
		const usage = response.usage || {
			prompt_tokens: 0,
			completion_tokens: 0,
			total_tokens: 0,
		};

		// Log and analyze all response headers to debug cost extraction
		// @ts-ignore - Access the headers property
		const headers = response.headers || {};

		// Log all headers to see what Portkey is actually sending
		(await getLogger()).info("All Portkey response headers:", {
			data: {
				headers:
					typeof headers === "object"
						? JSON.stringify(headers)
						: String(headers),
				hasHeaders: Object.keys(headers).length > 0,
				headerKeys: Object.keys(headers),
			},
		});

		// Try to find any header related to cost (might have different naming)
		const costRelatedHeaders = Object.entries(headers)
			.filter(
				([key]) =>
					key.toLowerCase().includes("cost") ||
					key.toLowerCase().includes("token"),
			)
			.reduce(
				(obj, [key, value]) => {
					// Convert value to string to handle unknown type
					obj[key] = typeof value === "string" ? value : String(value ?? "");
					return obj;
				},
				{} as Record<string, string>,
			);

		if (Object.keys(costRelatedHeaders).length > 0) {
			(await getLogger()).info("Found potential cost-related headers:", {
				data: costRelatedHeaders,
			});
		} else {
			(await getLogger()).info("No cost-related headers found in response");
		}

		// Proceed with normal extraction
		let cost = await _extractCostFromHeaders(headers);

		// Log the result of extraction
		(await getLogger()).info("Cost extraction result:", {
			data: {
				extractedCost: cost,
				extractionMethod: cost > 0 ? "from header" : "will use fallback",
				specificHeader:
					typeof headers["x-portkey-cost"] === "string"
						? headers["x-portkey-cost"]
						: String(headers["x-portkey-cost"] || "not found"),
			},
		});

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
						"openai", // For now, assume OpenAI. Could be extracted from headers in future
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
						"openai", // Assume OpenAI as provider if we don't have info
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
						provider: "openai", // Could extract from headers if available
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
				provider: "openai", // Could extract from headers if available
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
			model = "gpt-3.5-turbo",
			temperature = 0.7,
			userId,
			teamId,
			feature,
			sessionId,
			checkUsageLimits: shouldCheckLimits = true,
			bypassCredits: _bypassCredits = false,
			config,
		} = options;

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
			// Log that we're skipping the check
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

		// Create client with tracking metadata, config, and model info
		const client = await _createGatewayClient({
			userId,
			teamId,
			feature,
			sessionId,
			config, // Pass config to client creation
			model, // Pass model to determine the correct provider
		});

		// Configure request options WITHOUT the config parameter
		const requestOptions: OpenAI.Chat.ChatCompletionCreateParams = {
			messages,
			model,
			temperature,
			stream: true,
		};

		// No longer need to add config to requestOptions

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
						"openai", // Assume OpenAI for streaming as well
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
					provider: "openai",
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

// Export config manager functions and classes for external use
export {
	ConfigManager,
	loadTemplate,
	mergeWithUseCase,
	overrideWithPortkey,
	normalizeConfig,
};
export { PromptManager };
