import { getSupabaseServerAdminClient } from "@kit/supabase/server-admin-client";
import { type NextRequest, NextResponse } from "next/server";
import {
	getCookieNameFromUrl,
	normalizeUrl,
	validateSupabaseUrls,
} from "~/lib/auth/url-normalization";

/**
 * Healthcheck endpoint for the web app. If this endpoint returns a 200, the web app will be considered healthy.
 * If this endpoint returns a 500, the web app will be considered unhealthy.
 * This endpoint can be used by Docker to determine if the web app is healthy and should be restarted.
 *
 * Also exposes Supabase URL information for E2E test configuration validation.
 * See: Issue #1507 - Cookie name mismatch causes auth failures in CI
 * See: Issue #1518 - Dev Integration Tests Fail - Cookies Not Recognized
 *
 * Query parameters:
 * - e2e_supabase_url: Optional. If provided, validates that this URL matches
 *   NEXT_PUBLIC_SUPABASE_URL. Returns 400 if there's a mismatch.
 */
export async function GET(request: NextRequest) {
	const isDbHealthy = await getSupabaseHealthCheck();

	// Extract Supabase project reference from URL for E2E config validation
	// Cookie names are derived from this: sb-{projectRef}-auth-token
	// E2E tests use this to verify they're using the same Supabase URL as the deployed app
	const supabaseProjectRef = getSupabaseProjectRef();
	const appSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const appCookieName = getCookieNameFromUrl(appSupabaseUrl);

	// Check if E2E validation is requested via query parameter
	// This allows E2E global-setup to validate URL configuration before proceeding
	const e2eSupabaseUrl = request.nextUrl.searchParams.get("e2e_supabase_url");

	if (e2eSupabaseUrl) {
		const validation = validateSupabaseUrls(e2eSupabaseUrl, appSupabaseUrl);

		if (!validation.isValid) {
			// Return 400 with detailed mismatch information
			// This allows E2E setup to fail fast with clear error message
			return NextResponse.json(
				{
					error: "Supabase URL mismatch detected",
					details: {
						reason: validation.mismatchReason,
						e2e: {
							url: validation.e2eNormalized,
							projectRef: validation.e2eProjectRef,
							cookieName: validation.e2eCookieName,
						},
						app: {
							url: validation.appNormalized,
							projectRef: validation.appProjectRef,
							cookieName: validation.appCookieName,
						},
					},
					recommendation:
						"Ensure E2E_SUPABASE_URL matches NEXT_PUBLIC_SUPABASE_URL exactly",
				},
				{ status: 400 },
			);
		}

		// URLs match - return success with validation details
		return NextResponse.json({
			services: {
				database: isDbHealthy,
			},
			supabaseProjectRef,
			supabaseUrl: normalizeUrl(appSupabaseUrl),
			expectedCookieName: appCookieName,
			urlValidation: {
				isValid: true,
				e2eUrl: validation.e2eNormalized,
				appUrl: validation.appNormalized,
				projectRef: validation.appProjectRef,
			},
		});
	}

	// Standard healthcheck response (no E2E validation)
	return NextResponse.json({
		services: {
			database: isDbHealthy,
			// add other services here
		},
		// Expose for E2E test configuration validation (Issue #1507, #1518)
		supabaseProjectRef,
		supabaseUrl: normalizeUrl(appSupabaseUrl),
		expectedCookieName: appCookieName,
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
