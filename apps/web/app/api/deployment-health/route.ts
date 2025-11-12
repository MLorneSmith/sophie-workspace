import { getSupabaseServerClient } from "@kit/supabase/server-client";
import { NextResponse } from "next/server";

/**
 * Deployment Health Check Endpoint
 *
 * Performs comprehensive readiness checks beyond simple HTTP 200.
 * Verifies critical systems are initialized and ready to serve requests.
 *
 * Use case: CI/CD integration tests should wait for this to return 200
 * before starting test execution to prevent false failures from premature starts.
 *
 * @returns JSON response with health status and HTTP status code
 */
export async function GET() {
	const checks = {
		timestamp: new Date().toISOString(),
		database: false,
		authentication: false,
		ready: false,
	};

	try {
		// Database connectivity check
		// Verifies Supabase client can connect and query
		const client = getSupabaseServerClient();
		const { error: dbError } = await client
			.from("config")
			.select("billing_provider")
			.limit(1)
			.single();

		checks.database = !dbError;

		// Authentication system check
		// Verifies auth module is initialized and functional
		try {
			await client.auth.getSession();
			checks.authentication = true;
		} catch {
			checks.authentication = false;
		}

		// Overall readiness
		checks.ready = checks.database && checks.authentication;

		return NextResponse.json(checks, {
			status: checks.ready ? 200 : 503,
			headers: {
				"Cache-Control": "no-cache, no-store, must-revalidate",
				"Content-Type": "application/json",
			},
		});
	} catch (error) {
		return NextResponse.json(
			{
				...checks,
				error: error instanceof Error ? error.message : String(error),
			},
			{ status: 503 },
		);
	}
}
