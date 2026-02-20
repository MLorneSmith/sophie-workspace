"use server";

import { enhanceAction } from "@kit/next/actions";
import { getLogger } from "@kit/shared/logger";
import { requireUser } from "@kit/supabase/require-user";
import { getSupabaseServerClient } from "@kit/supabase/server-client";
import { z } from "zod";

import type { Database } from "~/lib/database.types";

import {
	createAudienceProfile,
	getProfileByPresentationId,
	updateAudienceProfile,
} from "../../../_lib/server/audience-profiles.service";

const AdaptiveAnswerSchema = z.object({
	questionId: z.string().min(1),
	question: z.string().min(1),
	answer: z.string().min(1),
});

const SaveProfileStepSchema = z.object({
	presentationId: z.string().min(1),
	personName: z.string().min(1, "Person name is required"),
	company: z.string().optional(),
	title: z.string().optional(),
	linkedinUrl: z
		.string()
		.optional()
		.refine(
			(v) => !v || v.length === 0 || /^https?:\/\//.test(v),
			"LinkedIn URL must start with http:// or https://",
		),
	briefText: z.string().optional(),
	adaptiveAnswers: z.array(AdaptiveAnswerSchema).optional(),
});

export const saveProfileStepAction = enhanceAction(
	async (data, user) => {
		const client = getSupabaseServerClient<Database>();
		const logger = await getLogger();
		const ctx = {
			name: "saveProfileStepAction",
			presentationId: data.presentationId,
		};

		const auth = await requireUser(client);

		if (auth.error) {
			throw new Error("Unauthorized");
		}

		// Verify the user has access to this presentation.
		const { data: presentation, error: presentationError } = await client
			.from("presentations")
			.select("id, completed_steps")
			.eq("id", data.presentationId)
			.eq("user_id", auth.data.id)
			.maybeSingle();

		if (presentationError) {
			logger.error(ctx, "Failed to load presentation: %o", presentationError);
			throw presentationError;
		}

		if (!presentation) {
			throw new Error("Presentation not found");
		}

		const accountId = auth.data.id;

		const normalized = {
			personName: data.personName.trim(),
			company: data.company?.trim() || null,
			title: data.title?.trim() || null,
			linkedinUrl: data.linkedinUrl?.trim() || null,
			briefText: data.briefText?.trim() || null,
		};

		const existing = await getProfileByPresentationId(
			client,
			data.presentationId,
		);

		const profile = existing
			? await updateAudienceProfile(client, existing.id, {
					personName: normalized.personName,
					company: normalized.company,
					title: normalized.title,
					linkedinUrl: normalized.linkedinUrl,
					briefText: normalized.briefText,
					...(data.adaptiveAnswers
						? { adaptiveAnswers: data.adaptiveAnswers }
						: {}),
				})
			: await createAudienceProfile(client, {
					userId: user.id,
					accountId,
					presentationId: data.presentationId,
					personName: normalized.personName,
					company: normalized.company,
					title: normalized.title,
					linkedinUrl: normalized.linkedinUrl,
					briefText: normalized.briefText,
					adaptiveAnswers: data.adaptiveAnswers ?? [],
				});

		const completedSteps = Array.isArray(presentation.completed_steps)
			? [...presentation.completed_steps]
			: [];

		if (!completedSteps.includes("profile")) {
			completedSteps.push("profile");
		}

		const { error: updatePresentationError } = await client
			.from("presentations")
			.update({
				audience_profile_id: profile.id,
				current_step: "assemble",
				completed_steps: completedSteps,
				updated_at: new Date().toISOString(),
			})
			.eq("id", data.presentationId);

		if (updatePresentationError) {
			logger.error(
				ctx,
				"Failed to link profile to presentation: %o",
				updatePresentationError,
			);
			throw updatePresentationError;
		}

		return { success: true, profile };
	},
	{
		schema: SaveProfileStepSchema,
		auth: true,
	},
);
