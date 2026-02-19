import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "~/lib/database.types";

type Client = SupabaseClient<Database>;

type BuildingBlocksSubmission =
	Database["public"]["Tables"]["building_blocks_submissions"]["Row"];

export type PresentationRow = Pick<
	BuildingBlocksSubmission,
	"id" | "title" | "created_at" | "storyboard"
>;

export async function getPresentationsForDashboard(client: Client) {
	const { data, error } = await client
		.from("building_blocks_submissions")
		.select("id, title, created_at, storyboard")
		.order("created_at", { ascending: false });

	if (error) {
		throw error;
	}

	return data ?? [];
}
