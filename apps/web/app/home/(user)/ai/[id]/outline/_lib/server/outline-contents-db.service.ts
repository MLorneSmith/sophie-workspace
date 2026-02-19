import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export type OutlineContentUpsert = {
	presentationId: string;
	userId: string;
	accountId: string;
	sections: unknown;
};

function outlineContentsTable(client: SupabaseClient) {
	// NOTE: We intentionally keep the client untyped here so this code does not
	// depend on running `supabase typegen` locally for new tables.
	return client.from("outline_contents");
}

export async function getOutlineContent(
	client: SupabaseClient,
	presentationId: string,
) {
	const { data, error } = await outlineContentsTable(client)
		.select("*")
		.eq("presentation_id", presentationId)
		.maybeSingle();

	if (error) throw error;
	return data ?? null;
}

export async function saveOutlineContent(
	client: SupabaseClient,
	data: OutlineContentUpsert,
) {
	const payload = {
		presentation_id: data.presentationId,
		user_id: data.userId,
		account_id: data.accountId,
		sections: data.sections,
		updated_at: new Date().toISOString(),
	};

	const { data: saved, error } = await outlineContentsTable(client)
		.upsert(payload, { onConflict: "presentation_id" })
		.select("*")
		.single();

	if (error) throw error;
	return saved;
}
