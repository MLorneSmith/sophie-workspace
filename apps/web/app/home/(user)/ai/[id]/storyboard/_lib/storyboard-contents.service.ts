import "server-only";

import { getLogger } from "@kit/shared/logger";
import { getSupabaseServerClient } from "@kit/supabase/server-client";

import type {
	StoryboardContentsRow,
	StoryboardSlide,
} from "../../_lib/types/storyboard.types";

export async function fetchStoryboardContents(
	presentationId: string,
): Promise<StoryboardContentsRow | null> {
	const client = getSupabaseServerClient();

	const { data, error } = await client
		.from("storyboard_contents")
		.select("*")
		.eq("presentation_id", presentationId)
		.maybeSingle();

	if (error) {
		const logger = await getLogger();
		logger.error("Failed to fetch storyboard contents", {
			presentationId,
			error,
		});
		throw error;
	}

	if (!data) return null;

	return {
		...data,
		slides: (data.slides ?? []) as unknown as StoryboardSlide[],
	};
}

export async function createStoryboardContents(
	presentationId: string,
	userId: string,
	accountId: string,
	slides: StoryboardSlide[] = [],
): Promise<StoryboardContentsRow> {
	const client = getSupabaseServerClient();

	const { data, error } = await client
		.from("storyboard_contents")
		.insert({
			presentation_id: presentationId,
			user_id: userId,
			account_id: accountId,
			slides: JSON.parse(JSON.stringify(slides)),
		})
		.select()
		.single();

	if (error) {
		const logger = await getLogger();
		logger.error("Failed to create storyboard contents", {
			presentationId,
			error,
		});
		throw error;
	}

	return {
		...data,
		slides: (data.slides ?? []) as unknown as StoryboardSlide[],
	};
}

export async function updateStoryboardSlides(
	presentationId: string,
	slides: StoryboardSlide[],
): Promise<StoryboardContentsRow> {
	const client = getSupabaseServerClient();

	const { data, error } = await client
		.from("storyboard_contents")
		.update({
			slides: JSON.parse(JSON.stringify(slides)),
			updated_at: new Date().toISOString(),
		})
		.eq("presentation_id", presentationId)
		.select()
		.single();

	if (error) {
		const logger = await getLogger();
		logger.error("Failed to update storyboard slides", {
			presentationId,
			error,
		});
		throw error;
	}

	return {
		...data,
		slides: (data.slides ?? []) as unknown as StoryboardSlide[],
	};
}
