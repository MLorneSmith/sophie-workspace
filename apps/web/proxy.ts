import { isSuperAdmin } from "@kit/admin";
import { checkRequiresMultiFactorAuthentication } from "@kit/supabase/check-requires-mfa";
import { createMiddlewareClient } from "@kit/supabase/middleware-client";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import "urlpattern-polyfill";

// Debug logging flag for E2E auth session troubleshooting
const DEBUG_E2E_AUTH = process.env.DEBUG_E2E_AUTH === "true";

/**
 * Log middleware debug info for E2E auth troubleshooting.
 * Only logs when DEBUG_E2E_AUTH=true.
 */
function debugLog(context: string, data: Record<string, unknown>) {
	if (DEBUG_E2E_AUTH) {
		// biome-ignore lint/suspicious/noConsole: Debug logging for E2E auth troubleshooting
		console.log(`[DEBUG_E2E_AUTH:${context}]`, JSON.stringify(data, null, 2));
	}
}

/**
 * Decode and extract basic info from a JWT without verification.
 * Used for debugging to see what's in the token.
 * Returns null if the value is not a valid JWT format.
 */
function decodeJwtPayload(jwt: string): Record<string, unknown> | null {
	try {
		// JWT format: header.payload.signature
		const parts = jwt.split(".");
		if (parts.length !== 3) return null;

		// Decode the payload (middle part)
		const payload = parts[1];
		if (!payload) return null;

		// Base64url decode
		const decoded = Buffer.from(payload, "base64url").toString("utf-8");
		return JSON.parse(decoded) as Record<string, unknown>;
	} catch {
		return null;
	}
}

/**
 * Get the expected Supabase cookie name based on the configured URL.
 * Cookie name format: sb-{project-ref}-auth-token
 * where project-ref is the first part of the Supabase URL hostname.
 */
function getExpectedCookieName(): string {
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
	try {
		const hostname = new URL(supabaseUrl).hostname;
		const projectRef = hostname.split(".")[0];
		return `sb-${projectRef}-auth-token`;
	} catch {
		return "sb-unknown-auth-token";
	}
}

/**
 * Log cookies from request for debugging.
 * Truncates cookie values to avoid exposing sensitive data.
 * Enhanced for Issue #1507 - shows expected vs actual cookie names.
 */
function logRequestCookies(request: NextRequest, context: string) {
	if (!DEBUG_E2E_AUTH) return;

	const allCookies = request.cookies.getAll();
	const expectedCookieName = getExpectedCookieName();

	// Find the auth cookie (exact match or chunked versions)
	const authCookies = allCookies.filter(
		(c) =>
			c.name === expectedCookieName ||
			c.name.startsWith(`${expectedCookieName}.`),
	);

	// Also find any other Supabase-looking cookies for comparison
	const otherSupabaseCookies = allCookies.filter(
		(c) =>
			(c.name.includes("sb-") || c.name.includes("auth-token")) &&
			c.name !== expectedCookieName &&
			!c.name.startsWith(`${expectedCookieName}.`),
	);

	const cookieSummary = authCookies.map((c) => {
		// Try to decode JWT payload for debugging
		const jwtPayload = decodeJwtPayload(c.value);

		return {
			name: c.name,
			valueLength: c.value?.length ?? 0,
			valuePreview: c.value
				? `${c.value.slice(0, 30)}...${c.value.slice(-10)}`
				: "empty",
			isChunked: /\.\d+$/.test(c.name),
			isValidJwt: jwtPayload !== null,
			jwtIssuer: jwtPayload?.iss ?? null,
			jwtSubject: jwtPayload?.sub
				? `${String(jwtPayload.sub).slice(0, 8)}...`
				: null,
			jwtExpiry: jwtPayload?.exp
				? new Date(Number(jwtPayload.exp) * 1000).toISOString()
				: null,
			jwtIsExpired: jwtPayload?.exp
				? Number(jwtPayload.exp) * 1000 < Date.now()
				: null,
		};
	});

	debugLog(context, {
		path: request.nextUrl.pathname,
		supabaseUrl:
			process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 50) ?? "not set",
		expectedCookieName,
		expectedCookieFound: authCookies.length > 0,
		authCookieCount: authCookies.length,
		otherSupabaseCookieNames: otherSupabaseCookies.map((c) => c.name),
		totalCookies: allCookies.length,
		authCookies: cookieSummary,
		allCookieNames: allCookies.map((c) => c.name),
	});

	// Log a clear warning if expected cookie is not found but other auth cookies exist
	if (authCookies.length === 0 && otherSupabaseCookies.length > 0) {
		// biome-ignore lint/suspicious/noConsole: Critical diagnostic for auth debugging
		console.warn(
			`[DEBUG_E2E_AUTH:COOKIE_NAME_MISMATCH] Expected cookie '${expectedCookieName}' not found, but found: ${otherSupabaseCookies.map((c) => c.name).join(", ")}`,
		);
	}
}

// URLPattern is now available globally via polyfill
const URLPattern = globalThis.URLPattern;

import pathsConfig from "~/config/paths.config";

const NEXT_ACTION_HEADER = "next-action";

export const config = {
	matcher: ["/((?!_next/static|_next/image|images|locales|assets|api/*).*)"],
};

const getUser = async (request: NextRequest, response: NextResponse) => {
	// Log cookies before creating client (only when DEBUG_E2E_AUTH=true)
	logRequestCookies(request, "getUser:before");

	const supabase = createMiddlewareClient(request, response);

	// First call getSession() to trigger session restoration from cookies
	// Without this, getClaims() may return null even with valid cookies
	// See: https://github.com/supabase/ssr/issues/36
	const sessionResult = await supabase.auth.getSession();

	const result = await supabase.auth.getClaims();

	// Log claims and session validation result (only when DEBUG_E2E_AUTH=true)
	// Enhanced logging for Issue #1062, #1063, #1518 debugging
	if (DEBUG_E2E_AUTH) {
		const session = sessionResult.data?.session;
		const now = Math.floor(Date.now() / 1000);
		const expiresAt = session?.expires_at ?? 0;
		const isExpired = expiresAt > 0 && expiresAt < now;

		debugLog("getUser:session_validation", {
			path: request.nextUrl.pathname,
			hasSession: !!session,
			sessionError: sessionResult.error?.message ?? null,
			expiresAt:
				expiresAt > 0 ? new Date(expiresAt * 1000).toISOString() : null,
			isExpired,
			timeUntilExpiry: expiresAt > 0 ? expiresAt - now : null,
		});

		debugLog("getUser:claims", {
			path: request.nextUrl.pathname,
			hasClaims: !!result.data?.claims,
			claimsKeys: result.data?.claims ? Object.keys(result.data.claims) : [],
			error: result.error?.message ?? null,
			sub: result.data?.claims?.sub
				? `${String(result.data.claims.sub).slice(0, 8)}...`
				: null,
		});

		// Issue #1518: Log JWT issuer validation for debugging URL mismatches
		// The JWT iss claim must match the Supabase URL for validation to succeed
		const jwtIssuer = result.data?.claims?.iss;
		const expectedSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

		if (jwtIssuer && expectedSupabaseUrl) {
			// JWT issuer format is typically: https://xxx.supabase.co/auth/v1
			// Extract the base URL for comparison
			const jwtBaseUrl = String(jwtIssuer).replace("/auth/v1", "");
			const expectedBaseUrl = expectedSupabaseUrl.replace(/\/+$/, "");
			const issuerMatches =
				jwtBaseUrl === expectedBaseUrl || jwtBaseUrl === `${expectedBaseUrl}/`;

			debugLog("getUser:jwt_issuer_validation", {
				path: request.nextUrl.pathname,
				jwtIssuer,
				jwtBaseUrl,
				expectedSupabaseUrl: expectedBaseUrl,
				issuerMatches,
			});

			// Log warning if issuer doesn't match (likely cause of auth failures)
			if (!issuerMatches && !result.data?.claims) {
				// biome-ignore lint/suspicious/noConsole: Critical diagnostic for JWT issuer mismatch
				console.warn(
					`[DEBUG_E2E_AUTH:JWT_ISSUER_MISMATCH] JWT issuer '${jwtBaseUrl}' does not match expected '${expectedBaseUrl}'. This may cause session validation failure.`,
				);
			}
		} else if (!result.data?.claims && sessionResult.data?.session) {
			// We have a session but no claims - this suggests JWT validation failed
			debugLog("getUser:jwt_validation_failure", {
				path: request.nextUrl.pathname,
				hasSession: true,
				hasClaims: false,
				expectedSupabaseUrl,
				possibleCause:
					"JWT validation may have failed due to issuer URL mismatch",
			});
		}
	}

	return result;
};

export async function proxy(request: NextRequest) {
	const secureHeaders = await createResponseWithSecureHeaders();
	const response = NextResponse.next(secureHeaders);

	// set a unique request ID for each request
	// this helps us log and trace requests
	setRequestId(request);

	// handle patterns for specific routes
	const handlePattern = matchUrlPattern(request.url);

	// if a pattern handler exists, call it
	if (handlePattern) {
		const patternHandlerResponse = await handlePattern(request, response);

		// if a pattern handler returns a response, return it
		if (patternHandlerResponse) {
			return patternHandlerResponse;
		}
	}

	// append the action path to the request headers
	// which is useful for knowing the action path in server actions
	if (isServerAction(request)) {
		response.headers.set("x-action-path", request.nextUrl.pathname);
	}

	// if no pattern handler returned a response,
	// return the response
	return response;
}

function isServerAction(request: NextRequest) {
	const headers = new Headers(request.headers);

	return headers.has(NEXT_ACTION_HEADER);
}

async function adminMiddleware(request: NextRequest, response: NextResponse) {
	const isAdminPath = request.nextUrl.pathname.startsWith("/admin");

	if (!isAdminPath) {
		return;
	}

	const { data, error } = await getUser(request, response);

	// If user is not logged in, redirect to sign in page.
	// This should never happen, but just in case.
	if (!data?.claims || error) {
		return NextResponse.redirect(
			new URL(pathsConfig.auth.signIn, request.nextUrl.origin).href,
		);
	}

	const client = createMiddlewareClient(request, response);
	const userIsSuperAdmin = await isSuperAdmin(client);

	// If user is not an admin, redirect to 404 page.
	if (!userIsSuperAdmin) {
		return NextResponse.redirect(new URL("/404", request.nextUrl.origin).href);
	}

	// in all other cases, return the response
	return response;
}

/**
 * Define URL patterns and their corresponding handlers.
 */
function getPatterns() {
	return [
		{
			pattern: new URLPattern({ pathname: "/admin/*?" }),
			handler: adminMiddleware,
		},
		{
			pattern: new URLPattern({ pathname: "/auth/*?" }),
			handler: async (req: NextRequest, res: NextResponse) => {
				const { data } = await getUser(req, res);

				// the user is logged out, so we don't need to do anything
				if (!data?.claims) {
					return;
				}

				// check if we need to verify MFA (user is authenticated but needs to verify MFA)
				const isVerifyMfa = req.nextUrl.pathname === pathsConfig.auth.verifyMfa;

				// If user is logged in and does not need to verify MFA,
				// check onboarding status and redirect appropriately
				if (!isVerifyMfa) {
					const supabase = createMiddlewareClient(req, res);
					const { data: userData } = await supabase.auth.getUser();
					const isOnboarded = userData?.user?.user_metadata?.onboarded === true;

					// Determine the redirect path
					let nextPath = req.nextUrl.searchParams.get("next");

					// If no explicit next path or if not onboarded, handle accordingly
					if (!isOnboarded) {
						// New users should go to onboarding
						nextPath = "/onboarding";
					} else if (!nextPath) {
						// Onboarded users without a next path go to home
						nextPath = pathsConfig.app.home;
					}

					return NextResponse.redirect(
						new URL(nextPath, req.nextUrl.origin).href,
					);
				}
			},
		},
		{
			pattern: new URLPattern({ pathname: "/home/*?" }),
			handler: async (req: NextRequest, res: NextResponse) => {
				// Log entry into /home/* handler
				if (DEBUG_E2E_AUTH) {
					debugLog("home:entry", {
						path: req.nextUrl.pathname,
						origin: req.nextUrl.origin,
					});
				}

				const { data } = await getUser(req, res);

				const origin = req.nextUrl.origin;
				const next = req.nextUrl.pathname;

				// If user is not logged in, redirect to sign in page.
				if (!data?.claims) {
					// Log redirect decision
					if (DEBUG_E2E_AUTH) {
						debugLog("home:redirect", {
							reason: "no claims",
							path: next,
							redirectTo: pathsConfig.auth.signIn,
							dataReceived: !!data,
							claimsReceived: data?.claims,
						});
					}

					const signIn = pathsConfig.auth.signIn;
					const redirectPath = `${signIn}?next=${next}`;

					return NextResponse.redirect(new URL(redirectPath, origin).href);
				}

				// Log successful authentication
				if (DEBUG_E2E_AUTH) {
					debugLog("home:authenticated", {
						path: next,
						sub: data.claims?.sub
							? `${String(data.claims.sub).slice(0, 8)}...`
							: null,
					});
				}

				const supabase = createMiddlewareClient(req, res);

				// Check if user has completed onboarding
				const { data: userData } = await supabase.auth.getUser();
				const isOnboarded = userData?.user?.user_metadata?.onboarded === true;

				// If user hasn't completed onboarding, redirect to onboarding page
				if (!isOnboarded) {
					return NextResponse.redirect(new URL("/onboarding", origin).href);
				}

				const requiresMultiFactorAuthentication =
					await checkRequiresMultiFactorAuthentication(supabase);

				// If user requires multi-factor authentication, redirect to MFA page.
				if (requiresMultiFactorAuthentication) {
					return NextResponse.redirect(
						new URL(pathsConfig.auth.verifyMfa, origin).href,
					);
				}
			},
		},
		{
			pattern: new URLPattern({ pathname: "/onboarding" }),
			handler: async (req: NextRequest, res: NextResponse) => {
				const { data } = await getUser(req, res);
				const origin = req.nextUrl.origin;

				// If user is not logged in, redirect to sign in page.
				if (!data?.claims) {
					const signIn = pathsConfig.auth.signIn;
					return NextResponse.redirect(new URL(signIn, origin).href);
				}

				// Check if user has already completed onboarding
				const supabase = createMiddlewareClient(req, res);
				const { data: userData } = await supabase.auth.getUser();
				const isOnboarded = userData?.user?.user_metadata?.onboarded === true;

				// If user has already completed onboarding, redirect to home
				if (isOnboarded) {
					return NextResponse.redirect(
						new URL(pathsConfig.app.home, origin).href,
					);
				}

				// User is logged in and needs onboarding - allow access to onboarding page
				return res;
			},
		},
	];
}

/**
 * Match URL patterns to specific handlers.
 * @param url
 */
function matchUrlPattern(url: string) {
	const patterns = getPatterns();
	const input = url.split("?")[0];

	for (const pattern of patterns) {
		const patternResult = pattern.pattern.exec(input);

		if (patternResult !== null && "pathname" in patternResult) {
			return pattern.handler;
		}
	}
}

/**
 * Set a unique request ID for each request.
 * @param request
 */
function setRequestId(request: Request) {
	request.headers.set("x-correlation-id", crypto.randomUUID());
}

/**
 * @name createResponseWithSecureHeaders
 * @description Create a middleware with enhanced headers applied (if applied).
 * This is disabled by default. To enable set ENABLE_STRICT_CSP=true
 */
async function createResponseWithSecureHeaders() {
	const enableStrictCsp = process.env.ENABLE_STRICT_CSP ?? "false";

	// we disable ENABLE_STRICT_CSP by default
	if (enableStrictCsp === "false") {
		return {};
	}

	const { createCspResponse } = await import("./lib/create-csp-response");

	return createCspResponse();
}
