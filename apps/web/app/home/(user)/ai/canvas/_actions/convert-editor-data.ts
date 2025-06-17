"use server";

import { getSupabaseServerClient } from "@kit/supabase/server-client";

import type { Database } from "~/lib/database.types";

import { lexicalToTiptap } from "../_components/editor/tiptap/utils/format-conversion";


/**
 * Server action to convert existing records from Lexical format to Tiptap format
 * This is a one-time migration script
 */
export async function convertExistingRecordsToTiptap() {
	const client = getSupabaseServerClient<Database>();

	// Fetch all records
	const { data: submissions, error } = await client
		.from("building_blocks_submissions")
		.select("*");

	if (error || !submissions) {
		// TODO: Async logger needed
		// TODO: Fix logger call - was: error
		return { success: false, error: error?.message };
	}

	const results = {
		total: submissions.length,
		converted: 0,
		failed: 0,
		errors: [] as string[],
	};

	// Convert and update each record
	for (const submission of submissions) {
		try {
			// Convert each field that contains editor content
			const convertedData = {
				situation: submission.situation
					? JSON.stringify(lexicalToTiptap(submission.situation))
					: null,
				complication: submission.complication
					? JSON.stringify(lexicalToTiptap(submission.complication))
					: null,
				answer: submission.answer
					? JSON.stringify(lexicalToTiptap(submission.answer))
					: null,
				outline: submission.outline
					? JSON.stringify(lexicalToTiptap(submission.outline))
					: null,
			};

			// Update the record
			const { error: updateError } = await client
				.from("building_blocks_submissions")
				.update(convertedData)
				.eq("id", submission.id);

			if (updateError) {
				logger.error({
					submissionId: submission.id,
					error: updateError,
					message: `Error updating submission ${submission.id}`,
				// });
				results.failed++;
				results.errors.push(`ID ${submission.id}: ${updateError.message}`);
			} else {
				results.converted++;
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			// TODO: Async logger needed
			// TODO: Fix logger call - was: error
			results.failed++;
			results.errors.push(`ID ${submission.id}: ${message}`);
		}
	}

	return { success: results.failed === 0, results };
}
