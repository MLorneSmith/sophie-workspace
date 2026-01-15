import { getSupabaseServerAdminClient } from "@kit/supabase/server-admin-client";
import { NextResponse } from "next/server";

/**
 * Healthcheck endpoint for the web app. If this endpoint returns a 200, the web app will be considered healthy.
 * If this endpoint returns a 500, the web app will be considered unhealthy.
 * This endpoint can be used by Docker to determine if the web app is healthy and should be restarted.
 *
 * Also exposes Supabase project reference for E2E test configuration validation.
 * See: Issue #1507 - Cookie name mismatch causes auth failures in CI
 */
export async function GET() {
	const isDbHealthy = await getSupabaseHealthCheck();

	// Extract Supabase project reference from URL for E2E config validation
	// Cookie names are derived from this: sb-{projectRef}-auth-token
	// E2E tests use this to verify they're using the same Supabase URL as the deployed app
	const supabaseProjectRef = getSupabaseProjectRef();

	return NextResponse.json({
		services: {
			database: isDbHealthy,
			// add other services here
		},
		// Expose for E2E test configuration validation (Issue #1507)
		supabaseProjectRef,
	});
}

/**
 * Get the Supabase project reference from the configured URL.
 * This is used to validate E2E test configuration matches the deployed app.
 * Returns null if the URL is not configured or invalid.
 */
function getSupabaseProjectRef(): string | null {
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
	if (!supabaseUrl) return null;

	try {
		const hostname = new URL(supabaseUrl).hostname;
		return hostname.split(".")[0] || null;
	} catch {
		return null;
	}
}

/**
 * Quick check to see if the database is healthy by querying the accounts table
 * @returns true if the database is healthy, false otherwise
 */
async function getSupabaseHealthCheck() {
	try {
		const client = getSupabaseServerAdminClient();

		// Simple connectivity check - just verify we can query the database
		// Using accounts table as it's guaranteed to exist (core table)
		const { error } = await client.from("accounts").select("id").limit(1);

		return !error;
	} catch {
		return false;
	}
}
