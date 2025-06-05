"use server";

import type { Config } from "@kit/ai-gateway/src/configs/types";
import { requireUser } from "@kit/supabase/require-user";
import { getSupabaseServerClient } from "@kit/supabase/server-client";

export type AIGatewayContext = {
	userId: string;
	config: Config;
};

/**
 * Provides the AI Gateway configuration and user context for AI features.
 * This is used across blocks, canvas, and publisher features for AI integration.
 */
export async function getAIGatewayContext(): Promise<AIGatewayContext> {
	const client = getSupabaseServerClient();
	const auth = await requireUser(client);

	if (auth.error) {
		throw new Error("Unauthorized");
	}

	if (!process.env.PORTKEY_API_KEY) {
		throw new Error("PORTKEY_API_KEY environment variable is not set");
	}

	if (!process.env.PORTKEY_VIRTUAL_KEY) {
		throw new Error("PORTKEY_VIRTUAL_KEY environment variable is not set");
	}

	return {
		userId: auth.data.id,
		config: {
			// Base configuration that can be extended by feature-specific configs
			baseURL: "https://api.portkey.ai/v1",
			headers: {
				"x-portkey-api-key": process.env.PORTKEY_API_KEY,
				"x-portkey-virtual-key": process.env.PORTKEY_VIRTUAL_KEY,
			},
			// Default settings that can be overridden by feature-specific configs
			cache: {
				enabled: true,
				ttl: 3600, // 1 hour
			},
			retry: {
				attempts: 3,
				statusCodes: [429, 500, 502, 503, 504],
			},
		},
	};
}
