import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export type GenerateOutputUpsert = {
	presentationId: string;
	userId: string;
	accountId: string;
	templateId: string;
	exportFormat?: string | null;
	exportUrl?: string | null;
	generatedAt?: string | null;
};

function generateOutputsTable(client: SupabaseClient) {
	// NOTE: We intentionally keep the client untyped here so this code does not
	// depend on running `supabase typegen` locally for new tables.
	return client.from("generate_outputs");
}

export async function getGenerateOutput(
	client: SupabaseClient,
	presentationId: string,
) {
	const { data, error } = await generateOutputsTable(client)
		.select("*")
		.eq("presentation_id", presentationId)
		.maybeSingle();

	if (error) throw error;
	return data ?? null;
}

export async function saveGenerateOutput(
	client: SupabaseClient,
	data: GenerateOutputUpsert,
) {
	const payload: Record<string, unknown> = {
		presentation_id: data.presentationId,
		user_id: data.userId,
		account_id: data.accountId,
		template_id: data.templateId,
		updated_at: new Date().toISOString(),
	};

	if (data.exportFormat !== undefined) {
		payload.export_format = data.exportFormat;
	}

	if (data.exportUrl !== undefined) {
		payload.export_url = data.exportUrl;
	}

	if (data.generatedAt !== undefined) {
		payload.generated_at = data.generatedAt;
	}

	const { data: saved, error } = await generateOutputsTable(client)
		.upsert(payload, { onConflict: "presentation_id" })
		.select("*")
		.single();

	if (error) throw error;
	return saved;
}
