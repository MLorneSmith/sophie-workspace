import OpenAI from "openai";

import { createServiceLogger } from "@kit/shared/logger";

// Initialize service logger
const { getLogger } = createServiceLogger("AI-GATEWAY");

// Define the Portkey Gateway URL
const PORTKEY_GATEWAY_URL = "https://api.portkey.ai/v1/proxy";

/**
 * Determines the correct provider based on the model name
 *
 * @param model The model name to use
 * @returns The appropriate provider for the model
 */
function getProviderForModel(model: string): string {
	// Add additional model mappings as needed
	if (model.toLowerCase().startsWith("llama-")) {
		/* TODO: Async logger needed */ logger.info(`Using provider 'groq' for model: ${model}`);
		return "groq";
	}
	if (model.toLowerCase().startsWith("claude-")) {
		/* TODO: Async logger needed */ logger.info(`Using provider 'anthropic' for model: ${model}`);
		return "anthropic";
	}
	/* TODO: Async logger needed */ logger.info(`Using provider 'openai' for model: ${model}`);
	return "openai"; // Default for gpt models
}

/**
 * Creates headers for the Portkey API with tracking metadata and config
 *
 * @param options Portkey configuration options
 * @returns Record<string, string> Headers object
 */
function createPortkeyConfigHeaders(options: {
	provider: string;
	apiKey: string;
	config?: string | Record<string, unknown>;
}) {
	const { provider, apiKey, config } = options;

	const headers: Record<string, string> = {
		"x-portkey-api-key": apiKey,
		"x-portkey-virtual-key": process.env.PORTKEY_VIRTUAL_KEY || "",
		"x-portkey-provider": provider,
	};

	// Add config as a header if provided
	if (config) {
		try {
			headers["x-portkey-config"] =
				typeof config === "string" ? config : JSON.stringify(config);

			// Add debugging information about the configuration
			/* TODO: Async logger needed */ logger.info("Portkey config structure:", { arg1: JSON.stringify(config, arg2: null, arg3: 2 }));
			/* TODO: Async logger needed */ logger.info("Portkey config header value:", { data: headers["x-portkey-config"] });
		} catch (error) {
			/* TODO: Async logger needed */ logger.error("Error serializing Portkey config:", { data: error });
			// If serialization fails, provide a minimal valid config
			headers["x-portkey-config"] = JSON.stringify({
				strategy: { mode: "single" },
				targets: [{ provider: provider }],
			});
		}
	}

	return headers;
}

interface PortkeyClientOptions {
	userId?: string;
	teamId?: string;
	feature?: string;
	sessionId?: string;
	config?: string | Record<string, unknown>; // The config object or ID
	model?: string; // Added model parameter to determine provider
}

/**
 * Creates an OpenAI client configured to use Portkey with tracking metadata
 *
 * @param options Tracking metadata and config options
 * @returns OpenAI Configured OpenAI client
 */
export function createGatewayClient(options: PortkeyClientOptions = {}) {
	const {
		userId,
		teamId,
		feature,
		sessionId,
		config,
		model = "gpt-3.5-turbo",
	} = options;

	// Determine the correct provider based on the model
	const provider = getProviderForModel(model);

	/* TODO: Async logger needed */ logger.info(`Creating gateway client for model: ${model}, { arg1: provider: ${provider}`, arg2:  });

	// Create headers using our Portkey config headers function
	const headers = createPortkeyConfigHeaders({
		provider,
		apiKey: process.env.PORTKEY_API_KEY || "",
		// Include the configuration properly as a header parameter
		config: config,
	});

	// Add our custom tracking metadata
	if (userId) headers["x-portkey-request-metadata-user-id"] = userId;
	if (teamId) headers["x-portkey-request-metadata-team-id"] = teamId;
	if (feature) headers["x-portkey-request-metadata-feature"] = feature;
	if (sessionId) headers["x-portkey-trace-id"] = sessionId;

	// Log the complete headers for debugging
	/* TODO: Async logger needed */ logger.info("Complete Portkey headers:", { data: headers });

	const client = new OpenAI({
		apiKey: process.env.OPENAI_API_KEY || "", // Can be empty when using virtual keys
		baseURL: PORTKEY_GATEWAY_URL,
		defaultHeaders: headers,
	});

	return client;
}
