import { getSupabaseServerAdminClient } from "@kit/supabase/server-admin-client";
import { NextResponse } from "next/server";

/**
 * API health endpoint for integration tests and monitoring.
 * This endpoint provides the same health check as /healthcheck but under /api/health
 * for compatibility with integration test expectations.
 */
export async function GET() {
	const isDbHealthy = await getSupabaseHealthCheck();

	return NextResponse.json({
		status: "ok",
		timestamp: new Date().toISOString(),
		services: {
			database: isDbHealthy,
			// add other services here
		},
	});
}

/**
 * Quick check to see if the database is healthy by querying the config table
 * @returns true if the database is healthy, false otherwise
 */
async function getSupabaseHealthCheck() {
	try {
		const client = getSupabaseServerAdminClient();

		const { data, error } = await client
			.from("config")
			.select("billing_provider")
			.single();

		return !error && Boolean(data?.billing_provider);
	} catch {
		return false;
	}
}
