// Import the SupabaseClient type from our utility module

import { createServiceLogger } from "@kit/shared/logger";
import { initializeCostConfiguration } from "./db-init";
import type { SupabaseClient } from "./supabase-client";

// Initialize service logger
const { getLogger } = createServiceLogger("AI-USAGE-TRACKING");

// Define available environment variables for feature flags
const ENV = {
	BYPASS_AI_CREDITS: process.env.BYPASS_AI_CREDITS !== "false", // Default to true unless explicitly set to false
	CHECK_AI_USAGE_LIMITS: process.env.CHECK_AI_USAGE_LIMITS === "true", // Default to false unless explicitly set to true
	AI_USAGE_DEBUG: process.env.AI_USAGE_DEBUG === "true", // Enable more verbose debug logging
};

interface UsageTrackingParams {
	userId?: string;
	teamId?: string;
	requestId: string;
	provider: string;
	model: string;
	promptTokens: number;
	completionTokens: number;
	totalTokens: number;
	cost: number;
	feature?: string;
	sessionId?: string;
	bypassCredits?: boolean;
}

/**
 * Records API usage in the database for cost tracking and analytics
 * Enhanced with better error handling, validation, and diagnostic logging
 *
 * @param supabase Supabase client instance
 * @param params UsageTrackingParams
 * @returns Promise<boolean> Success status
 */
export async function recordApiUsage(
	supabase: SupabaseClient,
	params: UsageTrackingParams,
): Promise<boolean> {
	const logger = await getLogger();
	const {
		userId,
		teamId,
		requestId,
		provider,
		model,
		promptTokens,
		completionTokens,
		totalTokens,
		cost,
		feature,
		sessionId,
		bypassCredits = ENV.BYPASS_AI_CREDITS, // Use environment variable as default
	} = params;

	// Return marker whether operation succeeded
	let success = false;

	try {
		// Validate the Supabase client has required methods
		if (!supabase || typeof supabase.from !== "function") {
			logger.warn("Invalid Supabase client, skipping usage recording");
			return false;
		}

		// Log the attempt to record usage
		logger.info("Recording AI API usage", {
			requestId,
			provider,
			model,
			feature,
			hasUserId: !!userId,
			hasTeamId: !!teamId,
			totalTokens,
		});

		// Make sure cost configuration exists (initialize if needed)
		try {
			const costConfigCheck = await supabase
				.from("ai_cost_configuration")
				.select("id")
				.limit(1);

			if (
				costConfigCheck.error ||
				(costConfigCheck.data && costConfigCheck.data.length === 0)
			) {
				logger.info("No cost configuration found, attempting to initialize");
				// Try to initialize with admin client if available
				const adminClient = await import("./supabase-client").then((module) =>
					module.getSupabaseClient({ admin: true }),
				);
				await initializeCostConfiguration(adminClient);
			}
		} catch (costConfigError) {
			logger.warn("Error checking cost configuration", { error: costConfigError });
			// Continue anyway as this is just a preflight check
		}

		// 1. Record the request in ai_request_logs
		try {
			// Prepare the record to insert
			const record = {
				user_id: userId,
				team_id: teamId,
				request_id: requestId,
				provider,
				model,
				prompt_tokens: promptTokens,
				completion_tokens: completionTokens,
				total_tokens: totalTokens,
				cost,
				feature,
				session_id: sessionId,
				status: "completed", // Default status
			};

			if (ENV.AI_USAGE_DEBUG) {
				logger.debug("Inserting record into ai_request_logs", { record });
			}

			const { data, error: logError } = await supabase
				.from("ai_request_logs")
				.insert(record)
				.select("id")
				.single();

			if (logError) {
				logger.error("Error recording AI request log", {
					error: logError,
					errorMessage: logError.message,
					errorDetails: logError.details,
					errorCode: logError.code,
					errorHint: logError.hint,
					table: "ai_request_logs",
					record,
				});

				// If we get a foreign key violation or permission error, try with admin client
				if (
					logError.code === "23503" || // Foreign key violation
					logError.code === "42501" || // Permission denied
					logError.message?.includes("permission denied") ||
					logError.message?.includes("violates foreign key constraint")
				) {
					logger.info("Attempting retry with admin client");
					try {
						// Get admin client for privileged operations
						const adminClient = await import("./supabase-client").then(
							(module) => module.getSupabaseClient({ admin: true }),
						);

						const { data: adminData, error: adminError } = await adminClient
							.from("ai_request_logs")
							.insert(record)
							.select("id")
							.single();

						if (adminError) {
							logger.error("Admin client retry also failed", {
								error: adminError,
								errorMessage: adminError.message,
								errorCode: adminError.code,
		});
						} else {
							logger.info("Successfully recorded AI request log with admin client", {
								id: adminData?.id,
		});
							success = true;
						}
					} catch (adminRetryError) {
						logger.error("Error during admin client retry", { error: adminRetryError });
					}
				}
			} else {
				logger.info("Successfully recorded AI request log", { id: data?.id });
				success = true;
			}
		} catch (insertError) {
			// Type assertion for error object
			const error = insertError as Error;
			logger.error("Exception in AI request log insertion", {
				error: insertError,
				stack: error.stack,
				message: error.message,
				name: error.name,
		});
		}

		// 2. Skip credit deduction if bypassing credits
		if (bypassCredits) {
			logger.info("Bypassing AI credits system as configured");
			return success;
		}

		// 3. Deduct credits if a user or team is specified
		if (userId || teamId) {
			try {
				// Determine whether to use user or team credits
				const entityType = userId ? "user" : "team";
				const entityId = userId || teamId;

				if (entityId && typeof supabase.rpc === "function") {
					logger.info("Deducting AI credits", {
						entityType,
						entityId,
						cost,
						feature,
					});

					// Call the stored procedure to deduct credits
					const { data: creditData, error: deductError } = await supabase.rpc(
						"deduct_ai_credits",
						{
							p_entity_type: entityType,
							p_entity_id: entityId,
							p_amount: cost,
							p_feature: feature || "unknown",
							p_request_id: requestId,
						},
					);

					if (deductError) {
						logger.error("Error deducting AI credits", {
							error: deductError,
							errorMessage: deductError.message,
							errorCode: deductError.code,
							errorHint: deductError.hint,
							entityType,
							entityId,
							cost,
						});

						// Try with admin client if it's a permission error
						if (
							deductError.code === "42501" || // Permission denied
							deductError.message?.includes("permission denied")
						) {
							logger.info("Attempting credit deduction with admin client");
							try {
								// Get admin client for privileged operations
								const adminClient = await import("./supabase-client").then(
									(module) => module.getSupabaseClient({ admin: true }),
								);

								const { data: adminCreditData, error: adminDeductError } =
									await adminClient.rpc("deduct_ai_credits", {
										p_entity_type: entityType,
										p_entity_id: entityId,
										p_amount: cost,
										p_feature: feature || "unknown",
										p_request_id: requestId,
		});

								if (adminDeductError) {
									logger.error("Admin client credit deduction also failed", {
										error: adminDeductError,
										errorMessage: adminDeductError.message,
										errorCode: adminDeductError.code,
		});
								} else {
									logger.info("Successfully deducted AI credits with admin client");
								}
							} catch (adminCreditError) {
								logger.error("Error during admin client credit deduction", {
									error: adminCreditError,
		});
							}
						}
					} else {
						logger.info("Successfully deducted AI credits", { creditData });
					}
				}
			} catch (_deductError) 
				logger.error("Exception in credit deduction", 
					error: deductError,
					message:
						deductError instanceof Error
							? deductError.message
							: String(deductError),
					stack: deductError instanceof Error ? deductError.stack : undefined,);

		return success;
	} catch (error) 
		logger.error("Fatal error in recordApiUsage", 
			error,
			message: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,);
		// Continue execution to prevent breaking the main functionality
		return false;
}

/**
 * Extracts cost information from Portkey response headers
 * Enhanced with better error handling and detailed logging
 *
 * @param headers Response headers from Portkey
 * @returns number Cost value or 0 if not found
 */
export function _extractCostFromHeaders(
	headers: Record<string, string>,
): number {
	const logger = getLogger();
	
	if (!headers) {
		logger.then(l => l.warn("No headers provided to extractCostFromHeaders"));
		return 0;
	}

	// Check for all possible cost-related headers
	const costHeaders = [
		"x-portkey-cost",
		"x-portkey-usage-cost",
		"x-usage-cost",
		"x-openai-cost",
	];

	// Log all available headers in debug mode
	if (ENV.AI_USAGE_DEBUG) {
		logger.then(l => l.debug("Available headers for cost extraction", {
			headers: Object.keys(headers),
		}));
	}

	// Try each possible header
	for (const headerName of costHeaders) {
		const costHeader = headers[headerName];
		if (costHeader) {
			try {
				const cost = Number.parseFloat(costHeader);
				if (Number.isNaN(cost) || cost < 0) {
					logger.then(l => l.warn("Invalid cost value in header", {
						headerName,
						value: costHeader,
					}));
					continue;
				}
				logger.then(l => l.info("Extracted cost from header", {
					cost,
					headerName,
				}));
				return cost;
			} catch (e) {
				logger.then(l => l.error("Error parsing cost header", {
					headerName,
					error: e,
				}));
			}
		}
	}

	// If we reach here, no valid cost was found
	logger.then(l => l.info("No valid cost found in headers, will use calculated cost"));
	return 0;
}

/**
 * Calculates the cost based on token usage and model pricing
 * Enhanced with better error handling and validation
 *
 * @param supabase Supabase client instance
 * @param provider AI provider (e.g., 'openai', 'anthropic')
 * @param model Model name (e.g., 'gpt-4', 'claude-3-opus')
 * @param promptTokens Number of prompt tokens
 * @param completionTokens Number of completion tokens
 * @returns Promise<number> Calculated cost
 */
export async function _calculateCost(
	supabase: SupabaseClient,
	provider: string,
	model: string,
	promptTokens: number,
	completionTokens: number,
): Promise<number> {
	const logger = await getLogger();
	
	// Validate inputs
	if (!provider || !model) {
		logger.warn("Missing provider or model in calculateCost", {
			provider,
			model,
		});
		return estimateCost(
			provider || "openai",
			model || "gpt-3.5-turbo",
			promptTokens,
			completionTokens,
		);
	}

	if (promptTokens < 0 || completionTokens < 0) {
		logger.warn("Invalid token counts", {
			promptTokens,
			completionTokens,
		});
		return 0;
	}

	try {
		// Validate Supabase client
		if (!supabase || typeof supabase.rpc !== "function") {
			logger.warn("Invalid Supabase client in calculateCost, using estimate");
			return estimateCost(provider, model, promptTokens, completionTokens);
		}

		// Call the database function to calculate cost
		const { data, error } = await supabase.rpc("calculate_ai_cost", {
			p_provider: provider,
			p_model: model,
			p_prompt_tokens: promptTokens,
			p_completion_tokens: completionTokens,
		});

		if (error) {
			logger.error("Error calculating AI cost", { error });
			return estimateCost(provider, model, promptTokens, completionTokens);
		}

		// Validate the returned cost
		const cost = data as number;
		if (typeof cost !== "number" || Number.isNaN(cost) || cost < 0) {
			logger.warn("Invalid cost returned from database", { cost });
			return estimateCost(provider, model, promptTokens, completionTokens);
		}

		return cost;
	} catch (error) {
		logger.error("Exception in calculateCost", { error });
		return estimateCost(provider, model, promptTokens, completionTokens);
	}
}

/**
 * Estimates cost based on token usage when the database function is unavailable
 * Enhanced with additional model pricing and better validation
 *
 * @param provider AI provider
 * @param model Model name
 * @param promptTokens Number of prompt tokens
 * @param completionTokens Number of completion tokens
 * @returns number Estimated cost
 */
export function estimateCost(
	_provider: string,
	model: string,
	promptTokens: number,
	completionTokens: number,
): number {
	// Validate inputs
	if (promptTokens < 0) promptTokens = 0;
	if (completionTokens < 0) completionTokens = 0;

	// Default pricing (per 1K tokens)
	const pricing: Record<string, { input: number; output: number }> = {
		// OpenAI models
		"gpt-3.5-turbo": { input: 0.0015, output: 0.002 },
		"gpt-4": { input: 0.03, output: 0.06 },
		"gpt-4-turbo": { input: 0.01, output: 0.03 },
		"gpt-4o": { input: 0.01, output: 0.03 },

		// Anthropic models
		"claude-3-opus": { input: 0.015, output: 0.075 },
		"claude-3-sonnet": { input: 0.003, output: 0.015 },
		"claude-3-haiku": { input: 0.00025, output: 0.00125 },

		// Mistral models
		"mistral-large": { input: 0.008, output: 0.024 },
		"mistral-medium": { input: 0.002, output: 0.006 },
		"mistral-small": { input: 0.0008, output: 0.0024 },

		// Google models
		"gemini-pro": { input: 0.00025, output: 0.00125 },
		"gemini-1.5-pro": { input: 0.0005, output: 0.0015 },
	};

	let modelKey = model.toLowerCase();

	// Normalize model names for pricing lookup
	if (modelKey.includes("gpt-3.5")) modelKey = "gpt-3.5-turbo";
	if (modelKey.includes("gpt-4-turbo")) modelKey = "gpt-4-turbo";
	if (modelKey.includes("gpt-4o")) modelKey = "gpt-4o";
	if (modelKey.includes("claude-3-opus")) modelKey = "claude-3-opus";
	if (modelKey.includes("claude-3-sonnet")) modelKey = "claude-3-sonnet";
	if (modelKey.includes("claude-3-haiku")) modelKey = "claude-3-haiku";

	// Get pricing for the model, or use GPT-3.5 Turbo as default
	const modelPricing = pricing[modelKey] ||
		pricing["gpt-3.5-turbo"] || { input: 0.0015, output: 0.002 };

	// Calculate cost
	const inputCost = (promptTokens / 1000) * modelPricing.input;
	const outputCost = (completionTokens / 1000) * modelPricing.output;

	// Add 10% markup (matching our database configuration)
	return (inputCost + outputCost) * 1.1;
}

/**
 * Checks if user has exceeded usage limits
 * Enhanced with better error handling and validation
 *
 * @param supabase Supabase client instance
 * @param userId User ID
 * @param teamId Team ID
 * @returns Promise<boolean> True if limits exceeded
 */
export async function _checkUsageLimits(
	supabase: SupabaseClient,
	userId?: string,
	teamId?: string,
): Promise<boolean> {
	const logger = await getLogger();
	
	// Validate inputs
	if (!userId && !teamId) return false;

	const entityType = userId ? "user" : "team";
	const entityId = userId || teamId;

	if (!entityId) return false;

	try {
		// Validate Supabase client
		if (!supabase || typeof supabase.rpc !== "function") {
			logger.warn("Invalid Supabase client in checkUsageLimits");
			return false;
		}

		try {
			const { data, error } = await supabase.rpc("check_ai_usage_limits", {
				p_entity_type: entityType,
				p_entity_id: entityId,
				p_cost: 0, // We're just checking if any limits are already exceeded
				p_tokens: 0,
		});

			if (error) {
				logger.error("Error checking usage limits", { error });
				return false;
			}

			return data && data.length > 0 && data[0].limit_exceeded;
		} catch (rpcError) {
			logger.error("Exception in RPC call to check usage limits", { error: rpcError });
			return false;
		}
	} catch (error) {
		logger.error("Fatal error in checkUsageLimits", { error });
		return false;
	}
}