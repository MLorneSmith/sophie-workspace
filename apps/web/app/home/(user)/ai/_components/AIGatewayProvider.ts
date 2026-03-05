"use server";

import { requireUser } from "@kit/supabase/require-user";
import { getSupabaseServerClient } from "@kit/supabase/server-client";

export type AIGatewayContext = {
	userId: string;
};

/**
 * Provides the AI Gateway user context for AI features.
 * Model routing and config are now handled by Bifrost virtual keys.
 */
export async function getAIGatewayContext(): Promise<AIGatewayContext> {
	const client = getSupabaseServerClient();
	const auth = await requireUser(client);

	if (auth.error) {
		throw new Error("Unauthorized");
	}

	return {
		userId: auth.data.id,
	};
}
