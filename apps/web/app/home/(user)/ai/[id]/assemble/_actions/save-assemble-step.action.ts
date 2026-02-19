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
import { saveAssembleOutput } from "../../../_lib/server/assemble-outputs.service";

const SaveAssembleStepSchema = z.object({
	presentationId: z.string().min(1),
	// These come from the multistep form. Title + audience persist elsewhere.
	title: z.string().optional(),
	audience: z.string().optional(),
	presentationType: z.enum(["general", "sales", "consulting", "fundraising"]),
	questionType: z.enum([
		"strategy",
		"assessment",
		"implementation",
		"diagnostic",
		"alternatives",
		"postmortem",
	]),
	situation: z.string().optional(),
	complication: z.string().optional(),
	// NOTE: The Argument Map step may not be present yet on this branch.
	argumentMap: z.unknown().optional(),
});

export const saveAssembleStepAction = enhanceAction(
	async (data, user) => {
		const client = getSupabaseServerClient<Database>();
		const logger = await getLogger();
		const ctx = {
			name: "saveAssembleStepAction",
			presentationId: data.presentationId,
		};

		const auth = await requireUser(client);

		if (auth.error) {
			throw new Error("Unauthorized");
		}

		// Verify the user has access to this presentation.
		const { data: presentation, error: presentationError } = await client
			.from("presentations")
			.select("id, completed_steps, audience_profile_id")
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

		const normalizedTitle = data.title?.trim();
		const normalizedAudience = data.audience?.trim();

		// Persist title onto presentations (if provided).
		if (normalizedTitle && normalizedTitle.length > 0) {
			const { error: titleError } = await client
				.from("presentations")
				.update({
					title: normalizedTitle,
					updated_at: new Date().toISOString(),
				})
				.eq("id", data.presentationId);

			if (titleError) {
				logger.error(ctx, "Failed to save title: %o", titleError);
				throw titleError;
			}
		}

		// Persist audience onto audience_profiles (if provided).
		if (normalizedAudience && normalizedAudience.length > 0) {
			const existing = await getProfileByPresentationId(
				client,
				data.presentationId,
			);

			if (existing) {
				await updateAudienceProfile(client, existing.id, {
					personName: normalizedAudience,
				});
			} else {
				await createAudienceProfile(client, {
					userId: user.id,
					accountId,
					presentationId: data.presentationId,
					personName: normalizedAudience,
				});
			}
		}

		const argumentMap =
			data.argumentMap && typeof data.argumentMap === "object"
				? JSON.parse(JSON.stringify(data.argumentMap))
				: {};

		await saveAssembleOutput(client, {
			userId: user.id,
			accountId,
			presentationId: data.presentationId,
			presentationType: data.presentationType,
			questionType: data.questionType,
			situation: data.situation?.trim() ?? "",
			complication: data.complication?.trim() ?? "",
			argumentMap: argumentMap as Record<string, unknown>,
		});

		const completedSteps = Array.isArray(presentation.completed_steps)
			? [...presentation.completed_steps]
			: [];

		if (!completedSteps.includes("assemble")) {
			completedSteps.push("assemble");
		}

		const { error: updatePresentationError } = await client
			.from("presentations")
			.update({
				current_step: "outline",
				completed_steps: completedSteps,
				updated_at: new Date().toISOString(),
			})
			.eq("id", data.presentationId);

		if (updatePresentationError) {
			logger.error(
				ctx,
				"Failed to update presentation workflow state: %o",
				updatePresentationError,
			);
			throw updatePresentationError;
		}

		return { success: true };
	},
	{
		schema: SaveAssembleStepSchema,
		auth: true,
	},
);
