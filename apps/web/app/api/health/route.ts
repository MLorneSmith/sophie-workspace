import { getLogger } from "@kit/shared/logger";
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
		status: "ready", // Changed from "ok" to "ready" for consistency with test controller expectations
		timestamp: new Date().toISOString(),
		services: {
			database: isDbHealthy,
			// add other services here
		},
	});
}

/**
 * Quick check to see if the database is healthy by querying the accounts table
 * @returns true if the database is healthy, false otherwise
 */
async function getSupabaseHealthCheck() {
	const logger = await getLogger();
	const ctx = { name: "health-check" };

	try {
		const client = getSupabaseServerAdminClient();

		// Simple connectivity check - just verify we can query the database
		// Using accounts table as it's guaranteed to exist (core table)
		// No .single() constraint - works with 0, 1, or many rows
		const { error } = await client.from("accounts").select("id").limit(1);

		// Health check passes if query executes without error
		if (error) {
			logger.error({ ...ctx, error: error.message }, "Database query failed");
			return false;
		}

		return true;
	} catch (error) {
		logger.error({ ...ctx, error }, "Database connection failed");
		return false;
	}
}
