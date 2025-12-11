"use server";

import { enhanceAction } from "@kit/next/actions";
import { getSupabaseServerClient } from "@kit/supabase/server-client";
import type { Database } from "~/lib/database.types";
import { SubmitBuildingBlocksSchema } from "../_lib/schemas/submit-building-blocks.schema";
import { createTiptapFromText } from "./tiptap-format-utils";

export const submitBuildingBlocksAction = enhanceAction(
	async (data) => {
		const client = getSupabaseServerClient<Database>();

		const {
			data: { user },
			error: userError,
		} = await client.auth.getUser();

		if (userError || !user) {
			return {
				success: false,
				error: "User not authenticated",
			};
		}

		// Check if a submission already exists with the same data
		const { data: existingSubmission } = await client
			.from("building_blocks_submissions")
			.select("id")
			.match({
				user_id: user.id,
				title: data.title,
				audience: data.audience,
				presentation_type: data.presentation_type,
				question_type: data.question_type,
				situation: createTiptapFromText(data.situation),
				complication: createTiptapFromText(data.complication),
				answer: createTiptapFromText(data.answer),
			})
			.maybeSingle();

		// If a submission exists, return it instead of creating a new one
		if (existingSubmission) {
			return { success: true, submissionId: existingSubmission.id };
		}

		// Create new submission if none exists
		const { data: result, error } = await client
			.from("building_blocks_submissions")
			.insert({
				user_id: user.id,
				title: data.title,
				audience: data.audience,
				presentation_type: data.presentation_type,
				question_type: data.question_type,
				situation: createTiptapFromText(data.situation),
				complication: createTiptapFromText(data.complication),
				answer: createTiptapFromText(data.answer),
			})
			.select("id")
			.single();

		if (error) {
			return {
				success: false,
				error: "Failed to submit building blocks",
			};
		}

		return { success: true, submissionId: result.id };
	},
	{
		schema: SubmitBuildingBlocksSchema,
		auth: true,
	},
);
