import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export type StoryboardContentUpsert = {
	presentationId: string;
	userId: string;
	accountId: string;
	slides: unknown;
};

function storyboardContentsTable(client: SupabaseClient) {
	// NOTE: We intentionally keep the client untyped here so this code does not
	// depend on running `supabase typegen` locally for new tables.
	return client.from("storyboard_contents");
}

export async function getStoryboardContent(
	client: SupabaseClient,
	presentationId: string,
) {
	const { data, error } = await storyboardContentsTable(client)
		.select("*")
		.eq("presentation_id", presentationId)
		.maybeSingle();

	if (error) throw error;
	return data ?? null;
}

export async function saveStoryboardContent(
	client: SupabaseClient,
	data: StoryboardContentUpsert,
) {
	const payload = {
		presentation_id: data.presentationId,
		user_id: data.userId,
		account_id: data.accountId,
		slides: data.slides,
		updated_at: new Date().toISOString(),
	};

	const { data: saved, error } = await storyboardContentsTable(client)
		.upsert(payload, { onConflict: "presentation_id" })
		.select("*")
		.single();

	if (error) throw error;
	return saved;
}
