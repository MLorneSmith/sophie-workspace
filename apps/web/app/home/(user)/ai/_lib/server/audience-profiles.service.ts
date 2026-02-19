import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export type AudienceProfileInsert = {
	userId: string;
	accountId: string;
	presentationId?: string | null;
	personName: string;
	company?: string | null;
	title?: string | null;
	linkedinUrl?: string | null;
	enrichmentData?: Record<string, unknown>;
	adaptiveAnswers?: Array<{
		questionId: string;
		question: string;
		answer: string;
	}>;
	briefText?: string | null;
	briefStructured?: Record<string, unknown>;
};

export type AudienceProfileUpdate = Partial<
	Omit<AudienceProfileInsert, "userId" | "accountId">
>;

function audienceProfilesTable(client: SupabaseClient) {
	// NOTE: We intentionally keep the client untyped here so this code does not
	// depend on running `supabase typegen` locally for new tables.
	return client.from("audience_profiles");
}

export async function getAudienceProfiles(
	client: SupabaseClient,
	userId: string,
	accountId: string,
) {
	const { data, error } = await audienceProfilesTable(client)
		.select("*")
		.eq("user_id", userId)
		.eq("account_id", accountId)
		.order("updated_at", { ascending: false });

	if (error) throw error;
	return data ?? [];
}

export async function getAudienceProfile(
	client: SupabaseClient,
	profileId: string,
) {
	const { data, error } = await audienceProfilesTable(client)
		.select("*")
		.eq("id", profileId)
		.single();

	if (error) throw error;
	return data;
}

export async function getProfileByPresentationId(
	client: SupabaseClient,
	presentationId: string,
) {
	const { data, error } = await audienceProfilesTable(client)
		.select("*")
		.eq("presentation_id", presentationId)
		.maybeSingle();

	if (error) throw error;
	return data ?? null;
}

export async function createAudienceProfile(
	client: SupabaseClient,
	data: AudienceProfileInsert,
) {
	const { data: created, error } = await audienceProfilesTable(client)
		.insert({
			user_id: data.userId,
			account_id: data.accountId,
			presentation_id: data.presentationId ?? null,
			person_name: data.personName,
			company: data.company ?? null,
			title: data.title ?? null,
			linkedin_url: data.linkedinUrl ?? null,
			enrichment_data: data.enrichmentData ?? {},
			adaptive_answers: data.adaptiveAnswers ?? [],
			brief_text: data.briefText ?? null,
			brief_structured: data.briefStructured ?? {},
		})
		.select("*")
		.single();

	if (error) throw error;
	return created;
}

export async function updateAudienceProfile(
	client: SupabaseClient,
	profileId: string,
	data: AudienceProfileUpdate,
) {
	const payload: Record<string, unknown> = {};

	if (data.presentationId !== undefined)
		payload.presentation_id = data.presentationId;
	if (data.personName !== undefined) payload.person_name = data.personName;
	if (data.company !== undefined) payload.company = data.company;
	if (data.title !== undefined) payload.title = data.title;
	if (data.linkedinUrl !== undefined) payload.linkedin_url = data.linkedinUrl;
	if (data.enrichmentData !== undefined)
		payload.enrichment_data = data.enrichmentData;
	if (data.adaptiveAnswers !== undefined)
		payload.adaptive_answers = data.adaptiveAnswers;
	if (data.briefText !== undefined) payload.brief_text = data.briefText;
	if (data.briefStructured !== undefined)
		payload.brief_structured = data.briefStructured;

	const { data: updated, error } = await audienceProfilesTable(client)
		.update(payload)
		.eq("id", profileId)
		.select("*")
		.single();

	if (error) throw error;
	return updated;
}

export async function deleteAudienceProfile(
	client: SupabaseClient,
	profileId: string,
) {
	const { error } = await audienceProfilesTable(client)
		.delete()
		.eq("id", profileId);

	if (error) throw error;
	return { success: true };
}
