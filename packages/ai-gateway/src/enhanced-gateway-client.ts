import { createServiceLogger } from "@kit/shared/logger";
import OpenAI from "openai";

// Initialize service logger
const { getLogger } = createServiceLogger("AI-GATEWAY");

// Define the Bifrost Gateway URL
const BIFROST_GATEWAY_URL =
	process.env.BIFROST_GATEWAY_URL ||
	process.env.BIFROST_BASE_URL ||
	"https://bifrost.slideheroes.com/v1";
const OPENAI_DIRECT_URL = "https://api.openai.com/v1";

function isBifrostConfigured(): boolean {
	return Boolean(
		process.env.BIFROST_CF_ACCESS_CLIENT_ID &&
			process.env.BIFROST_CF_ACCESS_CLIENT_SECRET,
	);
}

/**
 * Transforms a model name to Bifrost's provider-prefixed format
 * e.g., "gpt-4o" -> "openai/gpt-4o", "claude-3.5-sonnet" -> "anthropic/claude-3.5-sonnet"
 *
 * @param model The model name to transform
 * @returns The Bifrost-formatted model name with provider prefix
 */
function transformModelForBifrost(model: string): string {
	// If already in Bifrost format (contains "/"), pass through unchanged
	if (model.includes("/")) {
		return model;
	}

	// Transform to provider-prefixed format
	if (model.toLowerCase().startsWith("claude-")) {
		return `anthropic/${model}`;
	}
	if (model.toLowerCase().startsWith("llama-")) {
		return `groq/${model}`;
	}
	if (model.toLowerCase().startsWith("gemini-")) {
		return `google/${model}`;
	}

	// Default to openai for gpt models and unknown models
	return `openai/${model}`;
}

/**
 * Determines the correct provider based on the model name (for tracking purposes)
 *
 * @param model The model name to use
 * @returns The appropriate provider for the model
 */
async function getProviderForModel(
	model: string,
): Promise<{ provider: string; bifrostModel: string }> {
	// Get the Bifrost-formatted model name
	const bifrostModel = transformModelForBifrost(model);

	// Extract provider from the Bifrost format for tracking
	const provider = bifrostModel.split("/")[0] || "openai";

	(await getLogger()).info(`Using provider '${provider}' for model: ${model}`, {
		bifrostModel,
	});

	return { provider, bifrostModel };
}

/**
 * Creates headers for the Bifrost API with tracking metadata
 *
 * @param options Bifrost configuration options
 * @returns Record<string, string> Headers object
 */
async function _createBifrostHeaders(options: {
	userId?: string;
	teamId?: string;
	feature?: string;
	sessionId?: string;
	virtualKey?: string;
}) {
	const { userId, teamId, feature, sessionId, virtualKey } = options;

	const headers: Record<string, string> = {
		"CF-Access-Client-Id": process.env.BIFROST_CF_ACCESS_CLIENT_ID || "",
		"CF-Access-Client-Secret":
			process.env.BIFROST_CF_ACCESS_CLIENT_SECRET || "",
	};

	// Add virtual key header if provided
	if (virtualKey) headers["x-bf-vk"] = virtualKey;

	// Add tracking metadata as custom headers
	if (userId) headers["x-bifrost-user-id"] = userId;
	if (teamId) headers["x-bifrost-team-id"] = teamId;
	if (feature) headers["x-bifrost-feature"] = feature;
	if (sessionId) headers["x-bifrost-session-id"] = sessionId;

	return headers;
}

interface BifrostClientOptions {
	userId?: string;
	teamId?: string;
	feature?: string;
	sessionId?: string;
	virtualKey?: string;
	model?: string;
}

/**
 * Creates an OpenAI client configured to use Bifrost with tracking metadata
 *
 * @param options Tracking metadata and config options
 * @returns OpenAI Configured OpenAI client
 */
export async function _createGatewayClient(options: BifrostClientOptions = {}) {
	const {
		userId,
		teamId,
		feature,
		sessionId,
		virtualKey,
		model = "gpt-3.5-turbo",
	} = options;

	// Determine the correct provider based on the model and get Bifrost-formatted model
	const { provider, bifrostModel } = await getProviderForModel(model);

	// When using virtual keys, Bifrost expects plain model names (e.g. "gpt-4o")
	// because the VK config already defines provider routing.
	// Without virtual keys, Bifrost needs provider-prefixed names (e.g. "openai/gpt-4o").
	const resolvedModel = virtualKey ? model : bifrostModel;

	(await getLogger()).info(`Creating gateway client for model: ${model}`, {
		provider,
		resolvedModel,
		hasVirtualKey: !!virtualKey,
	});

	// When Bifrost is not configured, call providers directly
	if (!isBifrostConfigured()) {
		(await getLogger()).info(
			"Bifrost not configured — using direct provider API",
			{ provider },
		);

		if (provider === "anthropic") {
			// Anthropic uses OpenAI-compatible API via their proxy
			const client = new OpenAI({
				apiKey: process.env.ANTHROPIC_API_KEY || "",
				baseURL: "https://api.anthropic.com/v1",
				defaultHeaders: {
					"anthropic-version": "2023-06-01",
				},
			});
			return { client, bifrostModel: model }; // Return original model for direct calls
		}

		// Default: direct OpenAI
		const client = new OpenAI({
			apiKey: process.env.OPENAI_API_KEY || "",
			baseURL: OPENAI_DIRECT_URL,
		});
		return { client, bifrostModel: model }; // Return original model for direct calls
	}

	// Create headers using our Bifrost headers function
	const headers = await _createBifrostHeaders({
		userId,
		teamId,
		feature,
		sessionId,
		virtualKey,
	});

	// Log the complete headers for debugging
	(await getLogger()).info("Complete Bifrost headers:", { data: headers });

	// When a virtual key is provided, use it as the apiKey so the SDK sends
	// "Authorization: Bearer sk-bf-..." which Bifrost recognizes natively.
	// An empty apiKey causes "Authorization: Bearer " which Bifrost rejects.
	const client = new OpenAI({
		apiKey: virtualKey || "bifrost-proxy",
		baseURL: BIFROST_GATEWAY_URL,
		defaultHeaders: headers,
	});

	// Return both client and resolved model name
	return { client, bifrostModel: resolvedModel };
}
