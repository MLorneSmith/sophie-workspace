import OpenAI from "openai";
import * as Portkey from "portkey-ai";

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
		console.log(`Using provider 'groq' for model: ${model}`);
		return "groq";
	}
	if (model.toLowerCase().startsWith("claude-")) {
		console.log(`Using provider 'anthropic' for model: ${model}`);
		return "anthropic";
	}
	console.log(`Using provider 'openai' for model: ${model}`);
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
	config?: any;
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
			console.log("Portkey config structure:", JSON.stringify(config, null, 2));
			console.log("Portkey config header value:", headers["x-portkey-config"]);
		} catch (error) {
			console.error("Error serializing Portkey config:", error);
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
	config?: any; // The config object or ID
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

	console.log(
		`Creating gateway client for model: ${model}, provider: ${provider}`,
	);

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
	console.log("Complete Portkey headers:", headers);

	const client = new OpenAI({
		apiKey: process.env.OPENAI_API_KEY || "", // Can be empty when using virtual keys
		baseURL: PORTKEY_GATEWAY_URL,
		defaultHeaders: headers,
	});

	return client;
}
