import { CsrfError, createCsrfProtect } from "@edge-csrf/nextjs";
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
 * Log cookies from request for debugging.
 * Truncates cookie values to avoid exposing sensitive data.
 */
function logRequestCookies(request: NextRequest, context: string) {
	if (!DEBUG_E2E_AUTH) return;

	const allCookies = request.cookies.getAll();
	const supabaseCookies = allCookies.filter(
		(c) =>
			c.name.includes("sb-") ||
			c.name.includes("supabase") ||
			c.name.includes("auth"),
	);

	const cookieSummary = supabaseCookies.map((c) => ({
		name: c.name,
		valueLength: c.value?.length ?? 0,
		valuePreview: c.value
			? `${c.value.slice(0, 20)}...${c.value.slice(-10)}`
			: "empty",
		isChunked: /\.\d+$/.test(c.name),
	}));

	debugLog(context, {
		path: request.nextUrl.pathname,
		totalCookies: allCookies.length,
		supabaseCookies: cookieSummary.length,
		cookies: cookieSummary,
		allCookieNames: allCookies.map((c) => c.name),
	});
}

// URLPattern is now available globally via polyfill
const URLPattern = globalThis.URLPattern;

import appConfig from "~/config/app.config";
import pathsConfig from "~/config/paths.config";

const CSRF_SECRET_COOKIE = "csrfSecret";
const NEXT_ACTION_HEADER = "next-action";

export const config = {
	matcher: ["/((?!_next/static|_next/image|images|locales|assets|api/*).*)"],
};

const getUser = async (request: NextRequest, response: NextResponse) => {
	// Log cookies before creating client
	logRequestCookies(request, "getUser:before");

	// TEMP: Always log cookies for debugging
	const allCookies = request.cookies.getAll();
	const sbCookies = allCookies.filter((c) => c.name.includes("sb-"));
	// biome-ignore lint/suspicious/noConsole: Temporary debug logging
	console.log(
		`[MIDDLEWARE] Path: ${request.nextUrl.pathname}, SB Cookies: ${sbCookies.length}, Names: ${sbCookies.map((c) => c.name).join(", ")}`,
	);
	if (sbCookies.length > 0) {
		// biome-ignore lint/suspicious/noConsole: Temporary debug logging
		console.log(
			`[MIDDLEWARE] First SB cookie value preview: ${sbCookies[0]?.value.substring(0, 30)}...`,
		);
	}

	const supabase = createMiddlewareClient(request, response);

	// First call getSession() to trigger session restoration from cookies
	// Without this, getClaims() may return null even with valid cookies
	// See: https://github.com/supabase/ssr/issues/36
	const sessionResult = await supabase.auth.getSession();

	// TEMP: Debug session result
	// biome-ignore lint/suspicious/noConsole: Temporary debug logging
	console.log(
		`[MIDDLEWARE] getSession result - hasSession: ${!!sessionResult.data?.session}, error: ${sessionResult.error?.message ?? "none"}`,
	);

	const result = await supabase.auth.getClaims();

	// TEMP: Always log getClaims result for debugging
	// biome-ignore lint/suspicious/noConsole: Temporary debug logging
	console.log(
		`[MIDDLEWARE] getClaims result - hasClaims: ${!!result.data?.claims}, error: ${result.error?.message ?? "none"}`,
	);

	// Log claims result
	if (DEBUG_E2E_AUTH) {
		debugLog("getUser:claims", {
			path: request.nextUrl.pathname,
			hasClaims: !!result.data?.claims,
			claimsKeys: result.data?.claims ? Object.keys(result.data.claims) : [],
			error: result.error?.message ?? null,
			sub: result.data?.claims?.sub
				? `${String(result.data.claims.sub).slice(0, 8)}...`
				: null,
		});
	}

	return result;
};

export async function proxy(request: NextRequest) {
	const secureHeaders = await createResponseWithSecureHeaders();
	const response = NextResponse.next(secureHeaders);

	// set a unique request ID for each request
	// this helps us log and trace requests
	setRequestId(request);

	// apply CSRF protection for mutating requests
	const csrfResponse = await withCsrfMiddleware(request, response);

	// handle patterns for specific routes
	const handlePattern = matchUrlPattern(request.url);

	// if a pattern handler exists, call it
	if (handlePattern) {
		const patternHandlerResponse = await handlePattern(request, csrfResponse);

		// if a pattern handler returns a response, return it
		if (patternHandlerResponse) {
			return patternHandlerResponse;
		}
	}

	// append the action path to the request headers
	// which is useful for knowing the action path in server actions
	if (isServerAction(request)) {
		csrfResponse.headers.set("x-action-path", request.nextUrl.pathname);
	}

	// if no pattern handler returned a response,
	// return the session response
	return csrfResponse;
}

async function withCsrfMiddleware(
	request: NextRequest,
	response: NextResponse,
) {
	// set up CSRF protection
	const csrfProtect = createCsrfProtect({
		cookie: {
			secure: appConfig.production,
			name: CSRF_SECRET_COOKIE,
		},
		// ignore CSRF errors for server actions since protection is built-in
		ignoreMethods: isServerAction(request)
			? ["POST"]
			: // always ignore GET, HEAD, and OPTIONS requests
				["GET", "HEAD", "OPTIONS"],
	});

	try {
		await csrfProtect(request, response);

		return response;
	} catch (error) {
		// if there is a CSRF error, return a 403 response
		if (error instanceof CsrfError) {
			return NextResponse.json("Invalid CSRF token", {
				status: 401,
			});
		}

		throw error;
	}
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
