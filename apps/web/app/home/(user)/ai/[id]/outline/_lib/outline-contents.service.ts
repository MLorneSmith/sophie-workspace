import "server-only";

import { getLogger } from "@kit/shared/logger";
import { getSupabaseServerClient } from "@kit/supabase/server-client";

import type {
	OutlineContentsRow,
	OutlineSection,
} from "../../_lib/types/outline.types";

export async function fetchOutlineContents(
	presentationId: string,
): Promise<OutlineContentsRow | null> {
	const client = getSupabaseServerClient();

	const { data, error } = await client
		.from("outline_contents")
		.select("*")
		.eq("presentation_id", presentationId)
		.maybeSingle();

	if (error) {
		const logger = await getLogger();
		logger.error("Failed to fetch outline contents", {
			presentationId,
			error,
		});
		throw error;
	}

	if (!data) return null;

	return {
		...data,
		sections: (data.sections ?? []) as unknown as OutlineSection[],
	};
}

export async function createOutlineContents(
	presentationId: string,
	userId: string,
	accountId: string,
	sections: OutlineSection[] = [],
): Promise<OutlineContentsRow> {
	const client = getSupabaseServerClient();

	const { data, error } = await client
		.from("outline_contents")
		.insert({
			presentation_id: presentationId,
			user_id: userId,
			account_id: accountId,
			sections: JSON.parse(JSON.stringify(sections)),
		})
		.select()
		.single();

	if (error) {
		const logger = await getLogger();
		logger.error("Failed to create outline contents", {
			presentationId,
			error,
		});
		throw error;
	}

	return {
		...data,
		sections: (data.sections ?? []) as unknown as OutlineSection[],
	};
}

export async function updateOutlineSections(
	presentationId: string,
	sections: OutlineSection[],
): Promise<OutlineContentsRow> {
	const client = getSupabaseServerClient();

	const { data, error } = await client
		.from("outline_contents")
		.update({
			sections: JSON.parse(JSON.stringify(sections)),
			updated_at: new Date().toISOString(),
		})
		.eq("presentation_id", presentationId)
		.select()
		.single();

	if (error) {
		const logger = await getLogger();
		logger.error("Failed to update outline sections", {
			presentationId,
			error,
		});
		throw error;
	}

	return {
		...data,
		sections: (data.sections ?? []) as unknown as OutlineSection[],
	};
}
