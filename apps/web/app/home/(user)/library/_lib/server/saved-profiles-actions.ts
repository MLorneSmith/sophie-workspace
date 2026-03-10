"use server";

import { enhanceAction } from "@kit/next/actions";
import { getSupabaseServerClient } from "@kit/supabase/server-client";
import { z } from "zod";

import type { Database } from "~/lib/database.types";

import {
	createSavedProfile,
	deleteSavedProfile,
	getSavedProfile,
	getSavedProfiles,
	recordProfileUsage,
	updateSavedProfile,
} from "./saved-profiles.service";

import {
	CreateSavedProfileSchema,
	DeleteSavedProfileSchema,
	UpdateSavedProfileSchema,
} from "../schemas/saved-profiles.schema";

/**
 * Get all saved profiles for the current user within an account.
 */
export const getSavedProfilesAction = enhanceAction(
	async (data, user) => {
		const supabase = getSupabaseServerClient<Database>();

		return getSavedProfiles(supabase, user.id, data.accountId);
	},
	{
		auth: true,
		schema: z.object({
			accountId: z.string().uuid(),
		}),
	},
);

/**
 * Get a single saved profile by ID.
 */
export const getSavedProfileAction = enhanceAction(
	async (data, _user) => {
		const supabase = getSupabaseServerClient<Database>();

		return getSavedProfile(supabase, data.profileId);
	},
	{
		auth: true,
		schema: z.object({
			profileId: z.string().uuid(),
		}),
	},
);

/**
 * Create a new saved profile from an existing audience profile.
 */
export const createSavedProfileAction = enhanceAction(
	async (data, user) => {
		const supabase = getSupabaseServerClient<Database>();

		// First, get the source audience profile to copy data from
		const sourceProfile = await getSourceAudienceProfile(
			supabase,
			data.sourceProfileId,
		);

		if (!sourceProfile) {
			throw new Error("Source audience profile not found");
		}

		// Generate default name if not provided
		const profileName =
			data.name ??
			`${sourceProfile.company ?? sourceProfile.person_name} - ${new Date().toLocaleDateString()}`;

		// Extract enrichment inputs for refresh capability
		const enrichmentInputs = extractEnrichmentInputs(sourceProfile);

		return createSavedProfile(supabase, {
			userId: user.id,
			accountId: data.accountId,
			name: profileName,
			personName: sourceProfile.person_name,
			company: sourceProfile.company,
			linkedinUrl: sourceProfile.linkedin_url,
			audienceData: sourceProfile.brief_structured as
				| Record<string, unknown>
				| undefined,
			companyBrief: sourceProfile.enrichment_data as
				| Record<string, unknown>
				| undefined,
			enrichmentInputs,
			lastRefreshedAt: sourceProfile.updated_at,
		});
	},
	{
		auth: true,
		schema: CreateSavedProfileSchema,
	},
);

/**
 * Update a saved profile.
 */
export const updateSavedProfileAction = enhanceAction(
	async (input, _user) => {
		const supabase = getSupabaseServerClient<Database>();

		return updateSavedProfile(supabase, input.profileId, {
			name: input.name,
			audienceData: input.audienceData,
			companyBrief: input.companyBrief,
			enrichmentInputs: input.enrichmentInputs,
			lastRefreshedAt: input.audienceData
				? new Date().toISOString()
				: undefined,
		});
	},
	{
		auth: true,
		schema: UpdateSavedProfileSchema,
	},
);

/**
 * Delete a saved profile.
 */
export const deleteSavedProfileAction = enhanceAction(
	async (data, _user) => {
		const supabase = getSupabaseServerClient<Database>();

		return deleteSavedProfile(supabase, data.profileId);
	},
	{
		auth: true,
		schema: DeleteSavedProfileSchema,
	},
);

/**
 * Record usage of a saved profile when creating a presentation.
 */
export const useSavedProfileAction = enhanceAction(
	async (data, _user) => {
		const supabase = getSupabaseServerClient<Database>();

		// Record the usage and return the full profile for use in the presentation
		return recordProfileUsage(supabase, data.profileId);
	},
	{
		auth: true,
		schema: z.object({
			profileId: z.string().uuid(),
		}),
	},
);

// Helper functions

interface AudienceProfileRow {
	id: string;
	person_name: string;
	company: string | null;
	linkedin_url: string | null;
	brief_structured: Record<string, unknown> | null;
	enrichment_data: Record<string, unknown> | null;
	updated_at: string;
}

async function getSourceAudienceProfile(
	supabase: ReturnType<typeof getSupabaseServerClient<Database>>,
	profileId: string,
) {
	const { data, error } = await supabase
		.from("audience_profiles")
		.select("*")
		.eq("id", profileId)
		.maybeSingle();

	if (error) throw error;
	if (!data) throw new Error("Source audience profile not found");

	return data as AudienceProfileRow;
}

function extractEnrichmentInputs(profile: AudienceProfileRow) {
	// Extract relevant inputs for future refresh
	const inputs: Record<string, unknown> = {
		personName: profile.person_name,
		company: profile.company,
	};

	// Try to extract selected LinkedIn URL from enrichment data
	if (profile.enrichment_data && typeof profile.enrichment_data === "object") {
		const enrichment = profile.enrichment_data;
		if (enrichment.selectedLinkedinUrl) {
			inputs.selectedLinkedinUrl = enrichment.selectedLinkedinUrl;
		}
		if (enrichment.linkedinUrl) {
			inputs.linkedinUrl = enrichment.linkedinUrl;
		}
	}

	// Include the LinkedIn URL directly if available
	if (profile.linkedin_url) {
		inputs.linkedinUrl = profile.linkedin_url;
	}

	return inputs;
}
