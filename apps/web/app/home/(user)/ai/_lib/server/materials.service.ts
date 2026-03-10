import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "~/lib/database.types";

export type MaterialUpsert = {
	presentationId: string;
	userId: string;
	accountId: string;
	type: "upload" | "braindump" | "link";
	name: string;
	content?: string | null;
	mimeType?: string | null;
	fileUrl?: string | null;
};

function materialsTable(client: SupabaseClient<Database>) {
	return client.from("materials");
}

export async function createMaterial(
	client: SupabaseClient<Database>,
	data: MaterialUpsert,
) {
	const payload = {
		presentation_id: data.presentationId,
		user_id: data.userId,
		account_id: data.accountId,
		type: data.type,
		name: data.name,
		content: data.content ?? null,
		mime_type: data.mimeType ?? null,
		file_url: data.fileUrl ?? null,
	};

	const { data: saved, error } = await materialsTable(client)
		.insert(payload)
		.select("*")
		.single();

	if (error) throw error;
	return saved;
}

export async function getMaterialsByPresentation(
	client: SupabaseClient<Database>,
	presentationId: string,
) {
	const { data, error } = await materialsTable(client)
		.select("*")
		.eq("presentation_id", presentationId)
		.order("created_at", { ascending: true });

	if (error) throw error;
	return data ?? [];
}

export async function getMaterialById(
	client: SupabaseClient<Database>,
	materialId: string,
) {
	const { data, error } = await materialsTable(client)
		.select("*")
		.eq("id", materialId)
		.maybeSingle();

	if (error) throw error;
	return data ?? null;
}

export async function deleteMaterial(
	client: SupabaseClient<Database>,
	materialId: string,
	userId: string,
) {
	// First, check if the material exists and belongs to the user
	const { data: material, error: fetchError } = await materialsTable(client)
		.select("id, file_url, type")
		.eq("id", materialId)
		.eq("user_id", userId)
		.maybeSingle();

	if (fetchError) throw fetchError;

	// If no material found, return false (no-op)
	if (!material) {
		return { success: false, material: null };
	}

	// Proceed with delete
	const { error: deleteError } = await materialsTable(client)
		.delete()
		.eq("id", materialId);

	if (deleteError) throw deleteError;

	return { success: true, material };
}
