import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export type AssembleOutputUpsert = {
	userId: string;
	accountId: string;
	presentationId: string;
	presentationType: "general" | "sales" | "consulting" | "fundraising";
	situation?: string | null;
	complication?: string | null;
	questionType:
		| "strategy"
		| "assessment"
		| "implementation"
		| "diagnostic"
		| "alternatives"
		| "postmortem";
	argumentMap?: Record<string, unknown> | null;
};

function assembleOutputsTable(client: SupabaseClient) {
	// NOTE: We intentionally keep the client untyped here so this code does not
	// depend on running `supabase typegen` locally for new tables.
	return client.from("assemble_outputs");
}

export async function getAssembleOutput(
	client: SupabaseClient,
	presentationId: string,
) {
	const { data, error } = await assembleOutputsTable(client)
		.select("*")
		.eq("presentation_id", presentationId)
		.maybeSingle();

	if (error) throw error;
	return data ?? null;
}

export async function saveAssembleOutput(
	client: SupabaseClient,
	data: AssembleOutputUpsert,
) {
	const payload = {
		presentation_id: data.presentationId,
		user_id: data.userId,
		account_id: data.accountId,
		presentation_type: data.presentationType,
		situation: data.situation ?? "",
		complication: data.complication ?? "",
		question_type: data.questionType,
		argument_map: data.argumentMap ?? {},
		updated_at: new Date().toISOString(),
	};

	const { data: saved, error } = await assembleOutputsTable(client)
		.upsert(payload, { onConflict: "presentation_id" })
		.select("*")
		.single();

	if (error) throw error;
	return saved;
}
