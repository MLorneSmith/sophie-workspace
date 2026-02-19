import "server-only";

import { cache } from "react";

import type { SupabaseClient } from "@supabase/supabase-js";

import { requireUser } from "@kit/supabase/require-user";
import { getSupabaseServerClient } from "@kit/supabase/server-client";

import type { Database } from "~/lib/database.types";

type Client = SupabaseClient<Database>;
export type PresentationRow =
	Database["public"]["Tables"]["presentations"]["Row"];

export const loadPresentations = cache(listPresentationsLoader);

async function listPresentationsLoader(): Promise<PresentationRow[]> {
	const client = getSupabaseServerClient<Database>();
	const auth = await requireUser(client);

	if (auth.error) {
		throw new Error("Unauthorized");
	}

	return listPresentations(client, auth.data.id);
}

async function listPresentations(
	client: Client,
	userId: string,
): Promise<PresentationRow[]> {
	const { data, error } = await client
		.from("presentations")
		.select(
			"id, user_id, account_id, title, current_step, completed_steps, template_id, audience_profile_id, created_at, updated_at",
		)
		.eq("user_id", userId)
		.order("updated_at", { ascending: false });

	if (error) {
		throw error;
	}

	return data ?? [];
}
