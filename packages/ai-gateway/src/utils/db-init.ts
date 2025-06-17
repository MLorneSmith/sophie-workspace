/**
 * Database initialization utilities for AI Gateway
 *
 * This module provides functions to initialize and verify database tables
 * and data required for the AI Gateway functionality.
 */


import { createServiceLogger } from "@kit/shared/logger";
import type { SupabaseClient } from "./supabase-client";

// Initialize service logger
const { getLogger } = createServiceLogger("AI-GATEWAY");

/**
 * Initializes cost configuration data if the table is empty
 * This ensures we have pricing data for all supported models
 *
 * @param supabase SupabaseClient instance (preferably admin)
 * @returns Promise<boolean> Success status
 */
export async function initializeCostConfiguration(
	supabase: SupabaseClient,
): Promise<boolean> {
	try {
		(await getLogger()).info("Checking AI cost configuration data...");

		// Check if we already have cost configuration data
		const { count, error: countError } = await supabase
			.from("ai_cost_configuration")
			.select("*", { count: "exact", head: true });

		if (countError) {
			(await getLogger()).error("Error checking cost configuration:", {
				error: countError,
				message: countError.message,
				hint: countError.hint,
			// });
			return false;
		}

		if (count && count > 0) {
			(await getLogger()).info(`AI cost configuration already exists (${count} entries)`);
			return true;
		}

		(await getLogger()).info("No cost configuration found, seeding initial data...");

		// Insert default pricing data for common models
		const { error: insertError } = await supabase
			.from("ai_cost_configuration")
			.insert([
				// OpenAI models
				{
					provider: "openai",
					model: "gpt-3.5-turbo",
					input_cost_per_1k_tokens: 0.0015,
					output_cost_per_1k_tokens: 0.002,
					markup_percentage: 10,
					is_active: true,
				},
				{
					provider: "openai",
					model: "gpt-4",
					input_cost_per_1k_tokens: 0.03,
					output_cost_per_1k_tokens: 0.06,
					markup_percentage: 10,
					is_active: true,
				},
				{
					provider: "openai",
					model: "gpt-4-turbo",
					input_cost_per_1k_tokens: 0.01,
					output_cost_per_1k_tokens: 0.03,
					markup_percentage: 10,
					is_active: true,
				},
				{
					provider: "openai",
					model: "gpt-4o",
					input_cost_per_1k_tokens: 0.01,
					output_cost_per_1k_tokens: 0.03,
					markup_percentage: 10,
					is_active: true,
				},

				// Anthropic models
				{
					provider: "anthropic",
					model: "claude-3-opus",
					input_cost_per_1k_tokens: 0.015,
					output_cost_per_1k_tokens: 0.075,
					markup_percentage: 10,
					is_active: true,
				},
				{
					provider: "anthropic",
					model: "claude-3-sonnet",
					input_cost_per_1k_tokens: 0.003,
					output_cost_per_1k_tokens: 0.015,
					markup_percentage: 10,
					is_active: true,
				},
				{
					provider: "anthropic",
					model: "claude-3-haiku",
					input_cost_per_1k_tokens: 0.00025,
					output_cost_per_1k_tokens: 0.00125,
					markup_percentage: 10,
					is_active: true,
				},

				// Mistral models
				{
					provider: "mistral",
					model: "mistral-large",
					input_cost_per_1k_tokens: 0.008,
					output_cost_per_1k_tokens: 0.024,
					markup_percentage: 10,
					is_active: true,
				},
				{
					provider: "mistral",
					model: "mistral-medium",
					input_cost_per_1k_tokens: 0.002,
					output_cost_per_1k_tokens: 0.006,
					markup_percentage: 10,
					is_active: true,
				},
				{
					provider: "mistral",
					model: "mistral-small",
					input_cost_per_1k_tokens: 0.0008,
					output_cost_per_1k_tokens: 0.0024,
					markup_percentage: 10,
					is_active: true,
				},

				// Google models
				{
					provider: "google",
					model: "gemini-pro",
					input_cost_per_1k_tokens: 0.00025,
					output_cost_per_1k_tokens: 0.00125,
					markup_percentage: 10,
					is_active: true,
				},
				{
					provider: "google",
					model: "gemini-1.5-pro",
					input_cost_per_1k_tokens: 0.0005,
					output_cost_per_1k_tokens: 0.0015,
					markup_percentage: 10,
					is_active: true,
				},
			]);

		if (insertError) {
			(await getLogger()).error("Error seeding cost configuration data:", {
				error: insertError,
				message: insertError.message,
				hint: insertError.hint,
			// });
			return false;
		}

		(await getLogger()).info("Successfully seeded AI cost configuration data");
		return true;
	} catch (error) {
		(await getLogger()).error("Fatal error initializing cost configuration:", { data: error });
		return false;
	}
}

/**
 * Runs a test insert to verify database permissions
 *
 * @param supabase SupabaseClient instance
 * @returns Promise<boolean> Success status
 */
export async function testDatabasePermissions(
	supabase: SupabaseClient,
): Promise<boolean> {
	try {
		(await getLogger()).info("Testing database permissions with a test insert...");

		// Generate a unique test ID
		const testId = `test-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

		// Attempt to insert a test record
		const { data, error } = await supabase
			.from("ai_request_logs")
			.insert({
				user_id: null,
				team_id: null,
				request_id: testId,
				provider: "test",
				model: "test-model",
				prompt_tokens: 1,
				completion_tokens: 1,
				total_tokens: 2,
				cost: 0,
				feature: "system-test",
				status: "test",
			// })
			.select("id")
			.single();

		if (error) {
			(await getLogger()).error("Database permission test failed:", {
				error,
				message: error.message,
				details: error.details,
				hint: error.hint,
				code: error.code,
			// });
			return false;
		}

		(await getLogger()).info("Database permission test successful:", {
			recordId: data?.id,
			testId,
		});
		return true;
	} catch (error) {
		(await getLogger()).error("Fatal error testing database permissions:", { data: error });
		return false;
	}
}

/**
 * Verify that the database functions can be executed
 *
 * @param supabase SupabaseClient instance
 * @returns Promise<boolean> Success status
 */
export async function testDatabaseFunctions(
	supabase: SupabaseClient,
): Promise<boolean> {
	try {
		(await getLogger()).info("Testing database function permissions...");

		// Test the calculate_ai_cost function
		const { data, error } = await supabase.rpc("calculate_ai_cost", {
			p_provider: "openai",
			p_model: "gpt-3.5-turbo",
			p_prompt_tokens: 100,
			p_completion_tokens: 50,
		// });

		if (error) {
			(await getLogger()).error("Database function test failed:", {
				error,
				message: error.message,
				details: error.details,
				hint: error.hint,
				code: error.code,
			// });
			return false;
		}

		(await _getLogger()).info("Database function test successful:", {
			calculatedCost: data,
		// });
		return true;
	} catch (error) {
		(await getLogger()).error("Fatal error testing database functions:", { data: error });
		return false;
	}
}

/**
 * Main initialization function for AI Gateway database requirements
 *
 * @param supabase SupabaseClient instance (preferably admin)
 * @returns Promise<boolean> Success status
 */
export async function initializeAiGatewayDatabase(
	supabase: SupabaseClient,
): Promise<boolean> {
	try {
		(await getLogger()).info("Initializing AI Gateway database...");

		// Test basic permissions first
		const permissionsOk = await testDatabasePermissions(supabase);
		if (!permissionsOk) {
			(await getLogger()).warn(
				"Database permission test failed, continuing with initialization anyway...",
			);
		}

		// Test function permissions
		const functionsOk = await testDatabaseFunctions(supabase);
		if (!functionsOk) {
			(await getLogger()).warn("Database function test failed, continuing with initialization anyway...");
		}

		// Initialize cost configuration
		const costConfigOk = await initializeCostConfiguration(supabase);
		if (!costConfigOk) {
			(await getLogger()).warn("Cost configuration initialization failed");
		}

		// Return overall success status
		return permissionsOk && functionsOk && costConfigOk;
	} catch (error) {
		(await getLogger()).error("Fatal error initializing AI Gateway database:", { data: error });
		return false;
	}
}
