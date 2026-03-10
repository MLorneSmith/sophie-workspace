import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Type definition for inserting a saved profile.
 */
export type SavedProfileInsert = {
	userId: string;
	accountId: string;
	name: string;
	personName: string;
	company?: string | null;
	linkedinUrl?: string | null;
	audienceData?: Record<string, unknown>;
	companyBrief?: Record<string, unknown>;
	enrichmentInputs?: Record<string, unknown>;
	lastRefreshedAt?: string | null;
};

/**
 * Type definition for updating a saved profile.
 */
export type SavedProfileUpdate = Partial<
	Omit<SavedProfileInsert, "userId" | "accountId">
>;

/**
 * Saved profile row from the database.
 */
export type SavedProfileRow = {
	id: string;
	user_id: string;
	account_id: string;
	name: string;
	person_name: string;
	company: string | null;
	linkedin_url: string | null;
	audience_data: Record<string, unknown> | null;
	company_brief: Record<string, unknown> | null;
	enrichment_inputs: Record<string, unknown> | null;
	created_at: string;
	updated_at: string;
	last_used_at: string | null;
	last_refreshed_at: string | null;
};

function savedProfilesTable(client: SupabaseClient) {
	// NOTE: We intentionally keep the client untyped here so this code does not
	// depend on running `supabase typegen` locally for new tables.
	return client.from("saved_profiles");
}

/**
 * Get all saved profiles for a user within an account.
 */
export async function getSavedProfiles(
	client: SupabaseClient,
	userId: string,
	accountId: string,
) {
	const { data, error } = await savedProfilesTable(client)
		.select("*")
		.eq("user_id", userId)
		.eq("account_id", accountId)
		.order("updated_at", { ascending: false });

	if (error) throw error;
	return (data ?? []) as SavedProfileRow[];
}

/**
 * Get a single saved profile by ID.
 */
export async function getSavedProfile(
	client: SupabaseClient,
	profileId: string,
) {
	const { data, error } = await savedProfilesTable(client)
		.select("*")
		.eq("id", profileId)
		.maybeSingle();

	if (error) throw error;
	return data as SavedProfileRow | null;
}

/**
 * Create a new saved profile from an audience profile snapshot.
 */
export async function createSavedProfile(
	client: SupabaseClient,
	data: SavedProfileInsert,
) {
	const { data: created, error } = await savedProfilesTable(client)
		.insert({
			user_id: data.userId,
			account_id: data.accountId,
			name: data.name,
			person_name: data.personName,
			company: data.company ?? null,
			linkedin_url: data.linkedinUrl ?? null,
			audience_data: data.audienceData ?? {},
			company_brief: data.companyBrief ?? {},
			enrichment_inputs: data.enrichmentInputs ?? {},
			last_refreshed_at: data.lastRefreshedAt ?? null,
		})
		.select("*")
		.single();

	if (error) throw error;
	return created as SavedProfileRow;
}

/**
 * Update a saved profile's data.
 */
export async function updateSavedProfile(
	client: SupabaseClient,
	profileId: string,
	data: SavedProfileUpdate,
) {
	const payload: Record<string, unknown> = {};

	if (data.name !== undefined) payload.name = data.name;
	if (data.personName !== undefined) payload.person_name = data.personName;
	if (data.company !== undefined) payload.company = data.company;
	if (data.linkedinUrl !== undefined) payload.linkedin_url = data.linkedinUrl;
	if (data.audienceData !== undefined)
		payload.audience_data = data.audienceData;
	if (data.companyBrief !== undefined)
		payload.company_brief = data.companyBrief;
	if (data.enrichmentInputs !== undefined)
		payload.enrichment_inputs = data.enrichmentInputs;
	if (data.lastRefreshedAt !== undefined)
		payload.last_refreshed_at = data.lastRefreshedAt;

	if (Object.keys(payload).length === 0) {
		throw new Error("No fields provided for update");
	}

	const { data: updated, error } = await savedProfilesTable(client)
		.update(payload)
		.eq("id", profileId)
		.select("*")
		.single();

	if (error) throw error;
	return updated as SavedProfileRow;
}

/**
 * Delete a saved profile.
 */
export async function deleteSavedProfile(
	client: SupabaseClient,
	profileId: string,
) {
	// First check if the profile exists
	const { data: existing, error: checkError } = await savedProfilesTable(client)
		.select("id")
		.eq("id", profileId)
		.maybeSingle();

	if (checkError) throw checkError;
	if (!existing) {
		throw new Error("Saved profile not found");
	}

	// Now delete the profile
	const { error } = await savedProfilesTable(client)
		.delete()
		.eq("id", profileId);

	if (error) throw error;
	return { success: true };
}

/**
 * Record when a saved profile was last used to create a presentation.
 */
export async function recordProfileUsage(
	client: SupabaseClient,
	profileId: string,
) {
	const { data, error } = await savedProfilesTable(client)
		.update({
			last_used_at: new Date().toISOString(),
		})
		.eq("id", profileId)
		.select("*")
		.single();

	if (error) throw error;
	return data as SavedProfileRow;
}
