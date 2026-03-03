/**
 * Bifrost Gateway for Mastra.
 *
 * Routes all Mastra agent LLM calls through Bifrost AI Gateway with:
 * - Cloudflare Access authentication
 *
 * Registered as default gateway in Mastra singleton so all model strings
 * route through Bifrost automatically.
 */

import type { ProviderConfig } from "@mastra/core/llm";
import OpenAI from "openai";

const DEFAULT_BIFROST_URL = "https://gateway.slideheroes.com/v1";

/**
 * Provider configuration for supported providers.
 */
const PROVIDER_CONFIGS: Record<string, ProviderConfig> = {};

/**
 * Check if Bifrost gateway is properly configured with all required env vars.
 */
export function isBifrostConfigured(): boolean {
	return Boolean(
		process.env.BIFROST_GATEWAY_URL ||
			(process.env.BIFROST_CF_ACCESS_CLIENT_ID &&
				process.env.BIFROST_CF_ACCESS_CLIENT_SECRET),
	);
}

/**
 * Get the Bifrost gateway URL with fallback to default.
 */
export function getBifrostUrl(): string {
	return process.env.BIFROST_GATEWAY_URL ?? DEFAULT_BIFROST_URL;
}

/**
 * Get the appropriate API key for a model based on its provider prefix.
 *
 * @param modelId - Model ID in format "provider/model" (e.g., "openai/gpt-4o", "anthropic/claude-sonnet-4-20250514")
 * @returns API key for the provider
 */
function getApiKey(modelId: string): string {
	const [provider] = modelId.split("/");

	switch (provider) {
		case "anthropic":
			return process.env.ANTHROPIC_API_KEY ?? "";
		case "openai":
		default:
			return process.env.OPENAI_API_KEY ?? "";
	}
}

/**
 * Create Cloudflare Access headers for Bifrost authentication.
 */
function getCFAccessHeaders(): Record<string, string> {
	const headers: Record<string, string> = {};

	const clientId = process.env.BIFROST_CF_ACCESS_CLIENT_ID;
	const clientSecret = process.env.BIFROST_CF_ACCESS_CLIENT_SECRET;

	if (clientId && clientSecret) {
		headers["CF-Access-Client-Id"] = clientId;
		headers["CF-Access-Client-Secret"] = clientSecret;
	}

	return headers;
}

/**
 * BifrostGateway - Custom Mastra gateway that routes LLM calls through Bifrost.
 *
 * This gateway:
 * 1. Routes all model requests through the Bifrost AI Gateway
 * 2. Adds Cloudflare Access authentication headers
 *
 * Registered as default gateway so all model strings ("openai/gpt-4o", etc.)
 * automatically route through Bifrost without requiring prefix changes.
 *
 * Uses type assertions to handle Mastra's complex type requirements.
 */
export class BifrostGateway {
	id = "bifrost";
	name = "bifrost";

	getId(): string {
		return this.id;
	}

	/**
	 * Get the API key for a model based on its provider prefix.
	 */
	async getApiKey(modelId: string): Promise<string> {
		return getApiKey(modelId);
	}

	/**
	 * List of supported providers.
	 * Mastra uses this to validate model strings.
	 */
	async fetchProviders(): Promise<Record<string, ProviderConfig>> {
		return PROVIDER_CONFIGS;
	}

	/**
	 * Resolve a language model for the given model ID.
	 *
	 * Creates an OpenAI-compatible client configured with:
	 * - Base URL pointing to Bifrost gateway
	 * - Cloudflare Access authentication headers
	 */
	async resolveLanguageModel(args: {
		modelId: string;
		providerId: string;
		apiKey: string;
		headers?: Record<string, string>;
	}): Promise<unknown> {
		const baseUrl = this.buildUrl();

		// Build headers: CF Access + existing headers
		const headers: Record<string, string> = {
			...getCFAccessHeaders(),
			...(args.headers ?? {}),
		};

		// Create OpenAI-compatible client pointing at Bifrost
		// Use the API key from args (passed by Mastra)
		const client = new OpenAI({
			apiKey: args.apiKey,
			baseURL: baseUrl,
			defaultHeaders: headers,
		});

		// Return the OpenAI client as the language model
		// Type assertion needed due to Mastra's complex generic types
		return client as unknown as unknown;
	}

	/**
	 * Build the URL for the Bifrost gateway.
	 * Uses environment variable with fallback to default.
	 */
	buildUrl(): string {
		return getBifrostUrl();
	}
}

/**
 * Singleton instance of BifrostGateway.
 */
export const bifrostGateway = new BifrostGateway();

/**
 * Helper to check if Bifrost gateway should be used.
 * Returns true if BIFROST_GATEWAY_URL is explicitly set (not just defaults).
 *
 * For development without Bifrost, don't set BIFROST_GATEWAY_URL.
 * Agents will then call providers directly.
 */
export function isBifrostEnabled(): boolean {
	// Bifrost is enabled if URL is explicitly set OR
	// if CF Access credentials are available
	return Boolean(
		process.env.BIFROST_GATEWAY_URL ||
			(process.env.BIFROST_CF_ACCESS_CLIENT_ID &&
				process.env.BIFROST_CF_ACCESS_CLIENT_SECRET),
	);
}
