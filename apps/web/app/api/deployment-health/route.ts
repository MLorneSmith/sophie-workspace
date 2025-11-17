import { createClient } from "@supabase/supabase-js";
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
		environment: false,
		database: false,
		ready: false,
		details: {} as Record<string, string>,
	};

	try {
		// Check environment variables are set
		const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
		const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

		if (!supabaseUrl || !supabaseAnonKey) {
			checks.details.environment = "Missing Supabase configuration";
			return NextResponse.json(checks, {
				status: 503,
				headers: {
					"Cache-Control": "no-cache, no-store, must-revalidate",
					"Content-Type": "application/json",
				},
			});
		}

		checks.environment = true;

		// Create a fresh Supabase client without session context
		const client = createClient(supabaseUrl, supabaseAnonKey, {
			auth: {
				persistSession: false,
				autoRefreshToken: false,
			},
		});

		// Simple database connectivity check
		// Query accounts table with limit 0 (doesn't return data, just checks connection)
		const { error: dbError } = await client
			.from("accounts")
			.select("id")
			.limit(0);

		if (dbError) {
			checks.details.database = dbError.message;
		} else {
			checks.database = true;
		}

		// Overall readiness
		checks.ready = checks.environment && checks.database;

		return NextResponse.json(checks, {
			status: checks.ready ? 200 : 503,
			headers: {
				"Cache-Control": "no-cache, no-store, must-revalidate",
				"Content-Type": "application/json",
			},
		});
	} catch (error) {
		checks.details.error =
			error instanceof Error ? error.message : String(error);
		return NextResponse.json(checks, {
			status: 503,
			headers: {
				"Cache-Control": "no-cache, no-store, must-revalidate",
				"Content-Type": "application/json",
			},
		});
	}
}
