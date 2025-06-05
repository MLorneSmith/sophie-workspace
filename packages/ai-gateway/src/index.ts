import { OpenAI } from "openai";
import { z } from "zod";

import { createGatewayClient } from "./enhanced-gateway-client";
import { initializeAiGatewayDatabase } from "./utils/db-init";
import { getSupabaseClient } from "./utils/supabase-client";
import {
	calculateCost,
	checkUsageLimits,
	estimateCost,
	extractCostFromHeaders,
	recordApiUsage,
} from "./utils/usage-tracking";

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
				console.log("AI Gateway database successfully initialized");
			} else {
				console.warn(
					"AI Gateway database initialization had some issues, check logs for details",
				);
			}
		} catch (error) {
			console.error("Error initializing AI Gateway database:", error);
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
		console.log("AI usage limits check disabled by environment variable");
		return false;
	}

	try {
		const supabase = await getSupabaseClient();

		// Validate the Supabase client has required methods
		if (!supabase || typeof supabase.rpc !== "function") {
			console.warn("Invalid Supabase client, skipping usage limit check");
			return false;
		}

		// Try with regular client first
		try {
			const limitExceeded = await checkUsageLimits(supabase, userId, teamId);
			if (limitExceeded) {
				console.log("AI usage limit exceeded for user/team:", {
					userId,
					teamId,
				});
				return true;
			}
			return false;
		} catch (regularClientError) {
			console.error(
				"Error checking usage limits with regular client:",
				regularClientError,
			);

			// If it's a permission error, try with admin client
			if (
				regularClientError instanceof Error &&
				regularClientError.message?.includes("permission denied")
			) {
				console.log("Attempting usage limits check with admin client...");
				try {
					// Get admin client for privileged operations
					const adminClient = await getSupabaseClient({ admin: true });
					return await checkUsageLimits(adminClient, userId, teamId);
				} catch (adminClientError) {
					console.error(
						"Error checking usage limits with admin client:",
						adminClientError,
					);
					return false;
				}
			}
			return false;
		}
	} catch (error) {
		console.error("Fatal error checking usage limits:", error);
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
	config?: any;
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
			bypassCredits = false,
			config,
		} = options;

		// Read environment variable to determine if we should check usage limits
		const checkUsageLimitsFlag = process.env.CHECK_AI_USAGE_LIMITS === "true";

		// Only check usage limits if explicitly enabled via environment variable
		if (checkUsageLimitsFlag && shouldCheckLimits && (userId || teamId)) {
			console.log("Checking AI usage limits for:", { userId, teamId, feature });
			const limitExceeded = await checkUserLimits(userId, teamId);
			if (limitExceeded) {
				console.warn("AI usage limit exceeded for:", {
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
			console.log("Skipping AI usage limits check:", {
				reason: !checkUsageLimitsFlag
					? "feature disabled by environment"
					: "no user/team ID or disabled by options",
				hasUserId: !!userId,
				hasTeamId: !!teamId,
				feature,
			});
		}

		// Create client with tracking metadata, config, and model info
		const client = createGatewayClient({
			userId,
			teamId,
			feature,
			sessionId,
			config, // Pass config to client creation
			model, // Pass model to determine the correct provider
		});

		// Configure request options WITHOUT the config parameter
		const requestOptions: any = {
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
		console.log("All Portkey response headers:", {
			headers:
				typeof headers === "object" ? JSON.stringify(headers) : String(headers),
			hasHeaders: Object.keys(headers).length > 0,
			headerKeys: Object.keys(headers),
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
			console.log("Found potential cost-related headers:", costRelatedHeaders);
		} else {
			console.log("No cost-related headers found in response");
		}

		// Proceed with normal extraction
		let cost = extractCostFromHeaders(headers);

		// Log the result of extraction
		console.log("Cost extraction result:", {
			extractedCost: cost,
			extractionMethod: cost > 0 ? "from header" : "will use fallback",
			specificHeader:
				typeof headers["x-portkey-cost"] === "string"
					? headers["x-portkey-cost"]
					: String(headers["x-portkey-cost"] || "not found"),
		});

		// Track usage if database access is available (fail gracefully on permission issues)
		try {
			// Get the Supabase client for recording usage
			const supabase = await getSupabaseClient();

			// If no cost in headers, calculate based on token usage
			if (cost === 0) {
				try {
					// Calculate cost based on token usage and model pricing
					cost = await calculateCost(
						supabase,
						"openai", // For now, assume OpenAI. Could be extracted from headers in future
						model,
						usage.prompt_tokens,
						usage.completion_tokens,
					);
				} catch (costError) {
					console.error("Error calculating AI cost:", costError);
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

					console.log("AI credits system status:", {
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
					console.error("Error recording API usage:", usageError);
					// Continue without failing - usage tracking is secondary to the main functionality
				}
			}
		} catch (dbError) {
			console.error("Database access error:", dbError);
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
			console.error("OpenAI API Error:", {
				status: error.status,
				message: error.message,
				code: error.code,
				type: error.type,
			});
		} else {
			console.error("Error in getChatCompletion:", error);
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
			bypassCredits = false,
			config,
		} = options;

		// Read environment variable to determine if we should check usage limits
		const checkUsageLimitsFlag = process.env.CHECK_AI_USAGE_LIMITS === "true";

		// Only check usage limits if explicitly enabled via environment variable
		if (checkUsageLimitsFlag && shouldCheckLimits && (userId || teamId)) {
			console.log("Checking AI usage limits for streaming:", {
				userId,
				teamId,
				feature,
			});
			const limitExceeded = await checkUserLimits(userId, teamId);
			if (limitExceeded) {
				console.warn("AI usage limit exceeded for streaming:", {
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
			console.log("Skipping AI usage limits check for streaming:", {
				reason: !checkUsageLimitsFlag
					? "feature disabled by environment"
					: "no user/team ID or disabled by options",
				hasUserId: !!userId,
				hasTeamId: !!teamId,
				feature,
			});
		}

		// Create client with tracking metadata, config, and model info
		const client = createGatewayClient({
			userId,
			teamId,
			feature,
			sessionId,
			config, // Pass config to client creation
			model, // Pass model to determine the correct provider
		});

		// Configure request options WITHOUT the config parameter
		const requestOptions: any = {
			messages,
			model,
			temperature,
			stream: true,
		};

		// No longer need to add config to requestOptions

		// Get the streaming response
		// Using any type to avoid TypeScript errors with streaming
		const stream = (await client.chat.completions.create(
			requestOptions,
		)) as any;

		// We'll collect token counts as they stream to calculate total usage
		let promptTokens = 0;
		let completionTokens = 0;
		let responseId = "";

		// Try to extract and log any headers from the streaming response
		try {
			// @ts-ignore - Access the headers property if available
			if (stream.headers) {
				console.log("Streaming response headers:", {
					headers:
						typeof stream.headers === "object"
							? JSON.stringify(stream.headers)
							: "Headers not available as an object",
					hasHeaders: stream.headers && Object.keys(stream.headers).length > 0,
				});
			} else {
				console.log("No headers available in streaming response");
			}
		} catch (headerError) {
			console.error(
				"Error accessing headers in streaming response:",
				headerError,
			);
		}

		// Process the stream - use a try catch to handle any streaming errors
		try {
			// Handle both types of streaming responses from OpenAI
			if (typeof stream[Symbol.asyncIterator] === "function") {
				// Standard async iterator
				for await (const chunk of stream) {
					// Extract usage information when available
					if (chunk.usage) {
						promptTokens = chunk.usage.prompt_tokens;
						completionTokens = chunk.usage.completion_tokens;
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
			} else if (stream.toReadableStream) {
				// Legacy streaming with ReadableStream
				const reader = stream.toReadableStream().getReader();
				try {
					while (true) {
						const { done, value } = await reader.read();
						if (done) break;

						const chunk = JSON.parse(new TextDecoder().decode(value));

						// Extract usage information when available
						if (chunk.usage) {
							promptTokens = chunk.usage.prompt_tokens;
							completionTokens = chunk.usage.completion_tokens;
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
				} finally {
					reader.releaseLock();
				}
			} else {
				// Fallback for unknown streaming format
				console.warn("Unknown streaming format, unable to process stream");
				yield "Unable to process stream response";
			}
		} catch (streamError) {
			console.error("Error processing stream:", streamError);
			yield "[Error processing stream]";
		}

		const totalTokens = promptTokens + completionTokens;

		// Record usage after streaming completes
		if ((userId || teamId) && responseId) {
			try {
				// Get the Supabase client for recording usage
				const supabase = await getSupabaseClient();

				// Calculate cost based on token usage with proper parameters
				let cost;
				try {
					cost = await calculateCost(
						supabase,
						"openai",
						model,
						promptTokens,
						completionTokens,
					);
				} catch (costError) {
					console.error("Error calculating streaming cost:", costError);
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

				console.log("AI credits system status (streaming):", {
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
				console.error("Error recording usage data:", error);
				// Continue without failing the response delivery
			}
		}
	} catch (error) {
		if (error instanceof AiUsageLimitError) {
			throw error; // Re-throw usage limit errors to handle them specifically
		}

		if (error instanceof OpenAI.APIError) {
			console.error("OpenAI API Error:", {
				status: error.status,
				message: error.message,
				code: error.code,
				type: error.type,
			});
		} else {
			console.error("Error in getStreamingChatCompletion:", error);
		}
		throw error;
	}
}
