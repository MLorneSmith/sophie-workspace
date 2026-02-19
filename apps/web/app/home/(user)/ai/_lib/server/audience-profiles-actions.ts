"use server";

import { enhanceAction } from "@kit/next/actions";
import { getSupabaseServerClient } from "@kit/supabase/server-client";
import { z } from "zod";

import {
	AudienceBriefAdaptiveAnswerSchema,
	AudienceBriefSchema,
} from "../schemas/presentation-artifacts";

import {
	createAudienceProfile,
	deleteAudienceProfile,
	updateAudienceProfile,
} from "./audience-profiles.service";

const CreateAudienceProfileSchema = z.object({
	accountId: z.string().uuid(),
	// Nullable so profiles can live in a library and be reused.
	presentationId: z.string().uuid().nullable().optional(),
	personName: AudienceBriefSchema.shape.personName,
	company: AudienceBriefSchema.shape.company.optional(),
	title: AudienceBriefSchema.shape.title.optional(),
	linkedinUrl: AudienceBriefSchema.shape.linkedinUrl.optional(),
	enrichmentData: AudienceBriefSchema.shape.enrichmentData.optional(),
	adaptiveAnswers: z
		.array(AudienceBriefAdaptiveAnswerSchema)
		.optional()
		.default([]),
	briefText: AudienceBriefSchema.shape.briefText.optional().default(""),
	briefStructured: AudienceBriefSchema.shape.briefStructured.optional(),
});

const UpdateAudienceProfileSchema = z.object({
	profileId: z.string().uuid(),
	data: CreateAudienceProfileSchema.omit({ accountId: true }).partial(),
});

const DeleteAudienceProfileSchema = z.object({
	profileId: z.string().uuid(),
});

export const createAudienceProfileAction = enhanceAction(
	async (data, user) => {
		const supabase = getSupabaseServerClient();

		return createAudienceProfile(supabase, {
			userId: user.id,
			accountId: data.accountId,
			presentationId: data.presentationId ?? null,
			personName: data.personName,
			company: data.company ?? null,
			title: data.title ?? null,
			linkedinUrl: data.linkedinUrl ?? null,
			enrichmentData: data.enrichmentData ?? {},
			adaptiveAnswers: data.adaptiveAnswers ?? [],
			briefText: data.briefText,
			briefStructured: data.briefStructured ?? {},
		});
	},
	{
		auth: true,
		schema: CreateAudienceProfileSchema,
	},
);

export const updateAudienceProfileAction = enhanceAction(
	async (input, _user) => {
		const supabase = getSupabaseServerClient();

		return updateAudienceProfile(supabase, input.profileId, {
			presentationId: input.data.presentationId,
			personName: input.data.personName,
			company: input.data.company,
			title: input.data.title,
			linkedinUrl: input.data.linkedinUrl,
			enrichmentData: input.data.enrichmentData,
			adaptiveAnswers: input.data.adaptiveAnswers,
			briefText: input.data.briefText,
			briefStructured: input.data.briefStructured,
		});
	},
	{
		auth: true,
		schema: UpdateAudienceProfileSchema,
	},
);

export const deleteAudienceProfileAction = enhanceAction(
	async (data, _user) => {
		const supabase = getSupabaseServerClient();
		return deleteAudienceProfile(supabase, data.profileId);
	},
	{
		auth: true,
		schema: DeleteAudienceProfileSchema,
	},
);
