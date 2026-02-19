"use server";

import { enhanceAction } from "@kit/next/actions";
import { getSupabaseServerClient } from "@kit/supabase/server-client";
import type { Database } from "~/lib/database.types";
import { SubmitBuildingBlocksSchema } from "../_lib/schemas/submit-building-blocks.schema";
import { createTiptapFromText } from "./tiptap-format-utils";

function argumentMapToAnswerText(argumentMapJson: string): string {
	try {
		const parsed = JSON.parse(argumentMapJson) as unknown;
		if (typeof parsed !== "object" || parsed === null) return "";

		type Node = { text?: unknown; children?: unknown };
		const root = parsed as Node;
		const claim = typeof root.text === "string" ? root.text.trim() : "";
		const children = Array.isArray(root.children) ? (root.children as Node[]) : [];

		const supports = children
			.map((c) => (typeof c.text === "string" ? c.text.trim() : ""))
			.filter((t) => t.length > 0);

		if (supports.length === 0) return claim;

		return [claim, "", "Supporting arguments:", ...supports.map((s) => `- ${s}`)].join(
			"\n",
		);
	} catch {
		return "";
	}
}

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

		const answerText = argumentMapToAnswerText(data.argument_map);

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
				answer: createTiptapFromText(answerText),
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
				answer: createTiptapFromText(answerText),
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
