import { createMiddlewareClient } from "@kit/supabase/middleware-client";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Decode base64url string (matches @supabase/ssr format)
 */
function decodeBase64Url(str: string): string | null {
	try {
		// Add padding if needed
		const padded = str + "=".repeat((4 - (str.length % 4)) % 4);
		// Convert base64url to base64
		const base64 = padded.replace(/-/g, "+").replace(/_/g, "/");
		// Decode
		return Buffer.from(base64, "base64").toString("utf-8");
	} catch {
		return null;
	}
}

/**
 * DEBUG API endpoint to inspect cookies as seen by the server.
 * This helps diagnose E2E auth session recognition issues.
 */
export async function GET(request: NextRequest) {
	const response = NextResponse.next();

	// Get all cookies
	const allCookies = request.cookies.getAll();
	const sbCookies = allCookies.filter((c) => c.name.includes("sb-"));

	// Try to manually decode the sb cookie to verify format
	let manualDecode: {
		success: boolean;
		error?: string;
		sessionKeys?: string[];
		accessTokenLength?: number;
		hasUser?: boolean;
	} = { success: false };

	const authCookie = sbCookies.find((c) => c.name.includes("auth-token"));
	if (authCookie) {
		const value = authCookie.value;
		if (value.startsWith("base64-")) {
			const encoded = value.substring(7); // Remove 'base64-' prefix
			const decoded = decodeBase64Url(encoded);
			if (decoded) {
				try {
					const session = JSON.parse(decoded);
					manualDecode = {
						success: true,
						sessionKeys: Object.keys(session),
						accessTokenLength: session.access_token?.length ?? 0,
						hasUser: !!session.user,
					};
				} catch (e) {
					manualDecode = {
						success: false,
						error: `JSON parse error: ${e instanceof Error ? e.message : String(e)}`,
					};
				}
			} else {
				manualDecode = { success: false, error: "Base64 decode failed" };
			}
		} else {
			manualDecode = {
				success: false,
				error: `Cookie doesn't start with 'base64-', starts with: ${value.substring(0, 10)}`,
			};
		}
	}

	// Create Supabase client and try to get claims
	const supabase = createMiddlewareClient(request, response);

	// First call getSession() to trigger session restoration
	const sessionResult = await supabase.auth.getSession();
	const claimsResult = await supabase.auth.getClaims();
	const userResult = await supabase.auth.getUser();

	// Get the configured Supabase URL for comparison
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "not-set";
	const expectedCookiePrefix = `sb-${new URL(supabaseUrl).hostname.split(".")[0]}`;

	return NextResponse.json({
		debug: {
			totalCookies: allCookies.length,
			sbCookieCount: sbCookies.length,
			sbCookieNames: sbCookies.map((c) => c.name),
			sbCookiePreviews: sbCookies.map((c) => ({
				name: c.name,
				length: c.value.length,
				preview: `${c.value.substring(0, 40)}...`,
				startsWithBase64: c.value.startsWith("base64-"),
			})),
			allCookieNames: allCookies.map((c) => c.name),
		},
		config: {
			supabaseUrl,
			expectedCookiePrefix,
			expectedCookieName: `${expectedCookiePrefix}-auth-token`,
		},
		manualDecode,
		auth: {
			hasSession: !!sessionResult.data?.session,
			sessionError: sessionResult.error?.message ?? null,
			hasClaims: !!claimsResult.data?.claims,
			claimsError: claimsResult.error?.message ?? null,
			claimsSub: claimsResult.data?.claims?.sub
				? `${String(claimsResult.data.claims.sub).substring(0, 8)}...`
				: null,
			hasUser: !!userResult.data?.user,
			userError: userResult.error?.message ?? null,
			userId: userResult.data?.user?.id
				? `${userResult.data.user.id.substring(0, 8)}...`
				: null,
		},
	});
}
