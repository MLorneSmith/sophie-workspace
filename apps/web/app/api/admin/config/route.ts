import { isSuperAdmin } from "@kit/admin";
import { getSupabaseServerClient } from "@kit/supabase/server-client";
import { NextResponse } from "next/server";

/**
 * GET /api/admin/config
 * Fetches the current feature flag configuration.
 * Only accessible by super admins.
 */
export async function GET() {
	const client = getSupabaseServerClient();

	// Verify user is a super admin
	const isAdmin = await isSuperAdmin(client);
	if (!isAdmin) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
	}

	const { data, error } = await client
		.from("config")
		.select("enable_courses")
		.limit(1)
		.single();

	if (error) {
		return NextResponse.json(
			{ error: `Failed to load config: ${error.message}` },
			{ status: 500 },
		);
	}

	return NextResponse.json({
		enableCourses: data.enable_courses,
	});
}
