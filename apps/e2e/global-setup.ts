import { join } from "node:path";
import { cwd } from "node:process";
import { chromium, type FullConfig } from "@playwright/test";
import { type CookieOptions, createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { config as dotenvConfig } from "dotenv";
import { TOTP } from "totp-generator";
import {
	logCookieDetails,
	verifyCookieAttributes,
	verifyCookiesPresent,
} from "./tests/helpers/cookie-verification";
import { CredentialValidator } from "./tests/utils/credential-validator";
import { runPreflightValidations } from "./tests/utils/e2e-validation";
import {
	checkNextJsHealth,
	checkPayloadHealth,
	checkSupabaseHealth,
	logHealthCheckResults,
} from "./tests/utils/server-health-check";

// Ensure environment variables are loaded
dotenvConfig({
	path: [".env", ".env.local"],
	quiet: true,
});

// Debug logging flag for E2E auth session troubleshooting (matches middleware flag)
const DEBUG_E2E_AUTH = process.env.DEBUG_E2E_AUTH === "true";

// MFA TOTP key for super admin verification (matches AuthPageObject)
const MFA_KEY = "NHOHJVGPO3R3LKVPRMNIYLCDMBHUM2SE";

/**
 * Determine the appropriate cookie domain for a given base URL.
 * Handles Vercel preview deployments, localhost, and custom domains.
 *
 * For Vercel preview deployments, we set an EXPLICIT domain (the hostname).
 * This ensures Playwright's cookie API properly associates cookies with the
 * preview URL hostname, which is required for cookies to be sent with requests.
 *
 * See: Issue #1494 - Team accounts tests fail in CI due to cookie domain mismatch
 * Note: This changes the approach from Issue #1096 which used domain: undefined.
 * The explicit domain works correctly with Playwright's addCookies() API.
 *
 * @param baseURL - The base URL of the application
 * @returns Object with optional domain and isVercelPreview flag
 */
function getCookieDomainConfig(baseURL: string): {
	domain: string | undefined;
	isVercelPreview: boolean;
	sameSite: "Lax" | "None";
} {
	try {
		const url = new URL(baseURL);
		const hostname = url.hostname;

		// Vercel preview deployments: *.vercel.app
		// Set EXPLICIT domain for Playwright's cookie API to properly associate cookies
		// This ensures cookies are sent with requests in CI environment
		// See: Issue #1494 - Team accounts tests fail due to cookie domain mismatch
		if (hostname.endsWith(".vercel.app")) {
			debugLog("cookie:vercel_preview_detected", {
				hostname,
				baseURL,
				domain: hostname,
			});
			return {
				domain: hostname, // Explicit domain for Playwright cookie API
				isVercelPreview: true,
				sameSite: "Lax", // Vercel protection bypass handles cross-origin
			};
		}

		// Localhost: Use explicit hostname for consistency
		if (hostname === "localhost" || hostname === "127.0.0.1") {
			return {
				domain: hostname,
				isVercelPreview: false,
				sameSite: "Lax",
			};
		}

		// Custom domains: Use the hostname directly
		return {
			domain: hostname,
			isVercelPreview: false,
			sameSite: "Lax",
		};
	} catch (error) {
		debugLog("cookie:domain_parse_error", {
			baseURL,
			error: (error as Error).message,
		});
		// Fallback to localhost behavior
		return {
			domain: "localhost",
			isVercelPreview: false,
			sameSite: "Lax",
		};
	}
}

/**
 * Payload login response type from /api/users/login endpoint
 */
interface PayloadLoginResponse {
	message?: string;
	user?: {
		id: string;
		email: string;
	};
	token?: string;
	exp?: number;
}

/**
 * Log in to Payload CMS via the /api/users/login endpoint.
 * Returns the JWT token on success, null on failure.
 *
 * @param payloadUrl - Base URL of the Payload CMS server
 * @param email - User email for authentication
 * @param password - User password for authentication
 * @returns JWT token string or null if login failed
 */
async function loginToPayloadViaAPI(
	payloadUrl: string,
	email: string,
	password: string,
): Promise<string | null> {
	try {
		const response = await fetch(`${payloadUrl}/api/users/login`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ email, password }),
		});

		if (!response.ok) {
			debugLog("payload:api_login_failed", {
				status: response.status,
				statusText: response.statusText,
			});
			return null;
		}

		const data = (await response.json()) as PayloadLoginResponse;

		if (!data.token) {
			debugLog("payload:api_login_no_token", {
				message: data.message || "No token in response",
				hasUser: !!data.user,
			});
			return null;
		}

		debugLog("payload:api_login_success", {
			userId: data.user?.id?.slice(0, 8),
			email: data.user?.email,
			tokenLength: data.token.length,
			tokenExp: data.exp,
		});

		return data.token;
	} catch (error) {
		debugLog("payload:api_login_error", {
			error: (error as Error).message,
		});
		return null;
	}
}

/**
 * Log in to Payload CMS with retry logic and exponential backoff.
 * Throws an error after all retries are exhausted for clear failure visibility.
 *
 * @param payloadUrl - Base URL of the Payload CMS server
 * @param email - User email for authentication
 * @param password - User password for authentication
 * @param maxAttempts - Maximum number of login attempts (default: 3)
 * @returns JWT token string
 * @throws Error if all login attempts fail
 */
async function loginToPayloadWithRetry(
	payloadUrl: string,
	email: string,
	password: string,
	maxAttempts = 3,
): Promise<string> {
	// Exponential backoff delays: 500ms, 1000ms, 2000ms
	const backoffDelays = [500, 1000, 2000];
	let lastError: string | null = null;

	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		// biome-ignore lint/suspicious/noConsole: Required for setup progress visibility
		console.log(`   Payload login attempt ${attempt}/${maxAttempts}...`);

		const token = await loginToPayloadViaAPI(payloadUrl, email, password);

		if (token) {
			if (attempt > 1) {
				// biome-ignore lint/suspicious/noConsole: Required for setup progress visibility
				console.log(`   ✅ Payload login succeeded on attempt ${attempt}`);
			}
			return token;
		}

		lastError = `Attempt ${attempt} failed: no token received`;
		debugLog("payload:retry_attempt_failed", {
			attempt,
			maxAttempts,
			willRetry: attempt < maxAttempts,
		});

		// Wait before next attempt (except on last attempt)
		if (attempt < maxAttempts) {
			const delay = backoffDelays[attempt - 1] ?? 2000;
			debugLog("payload:retry_backoff", { delay, nextAttempt: attempt + 1 });
			await new Promise((resolve) => setTimeout(resolve, delay));
		}
	}

	// All retries exhausted - throw clear error for visibility
	throw new Error(
		`Payload CMS login failed after ${maxAttempts} attempts. ` +
			`Last error: ${lastError}. ` +
			`Check that Payload server is running at ${payloadUrl} and credentials are valid.`,
	);
}

/**
 * Clean up billing test data before test suite execution.
 * This prevents duplicate subscription records from accumulating across test runs.
 *
 * Deletes: subscription_items → subscriptions → billing_customers (respecting foreign keys)
 * Scope: Only test accounts (emails ending with @slideheroes.com or @makerkit.dev)
 *
 * @see Issue #1461 - E2E Shard 10 Duplicate Subscription Records
 */
async function cleanupBillingTestData() {
	// biome-ignore lint/suspicious/noConsole: Required for test setup progress visibility
	console.log("🧹 Cleaning up billing test data...");

	try {
		const { Client } = await import("pg");
		const client = new Client({
			host: "127.0.0.1",
			port: 54522,
			user: "postgres",
			password: "postgres",
			database: "postgres",
		});

		await client.connect();

		// Delete in order: subscription_items → subscriptions → billing_customers
		// This respects foreign key constraints
		// Scope to test accounts only (safety check)
		const queries = [
			{
				name: "subscription_items",
				sql: `DELETE FROM subscription_items WHERE subscription_id IN (
					SELECT s.id FROM subscriptions s
					JOIN accounts a ON s.account_id = a.id
					WHERE a.email LIKE '%@slideheroes.com' OR a.email LIKE '%@makerkit.dev'
				)`,
			},
			{
				name: "subscriptions",
				sql: `DELETE FROM subscriptions WHERE account_id IN (
					SELECT id FROM accounts
					WHERE email LIKE '%@slideheroes.com' OR email LIKE '%@makerkit.dev'
				)`,
			},
			{
				name: "billing_customers",
				sql: `DELETE FROM billing_customers WHERE account_id IN (
					SELECT id FROM accounts
					WHERE email LIKE '%@slideheroes.com' OR email LIKE '%@makerkit.dev'
				)`,
			},
		];

		for (const query of queries) {
			const result = await client.query(query.sql);
			if (result.rowCount && result.rowCount > 0) {
				// biome-ignore lint/suspicious/noConsole: Required for test setup progress visibility
				console.log(`   Cleaned ${result.rowCount} ${query.name} record(s)`);
			}
		}

		await client.end();

		// biome-ignore lint/suspicious/noConsole: Required for test setup progress visibility
		console.log("✅ Billing test data cleanup complete\n");
	} catch (error) {
		// biome-ignore lint/suspicious/noConsole: Required for error reporting in test setup
		console.warn(
			`⚠️  Failed to cleanup billing test data: ${(error as Error).message}`,
		);
		// Don't fail test suite on cleanup errors - log and continue
		// This allows tests to run even if database cleanup fails
	}
}

/**
 * Log global setup debug info for E2E auth troubleshooting.
 * Only logs when DEBUG_E2E_AUTH=true.
 */
function debugLog(context: string, data: Record<string, unknown>) {
	if (DEBUG_E2E_AUTH) {
		// biome-ignore lint/suspicious/noConsole: Debug logging for E2E auth troubleshooting
		console.log(
			`[DEBUG_E2E_AUTH:global-setup:${context}]`,
			JSON.stringify(data, null, 2),
		);
	}
}

/**
 * Global setup runs ONCE before all tests (not per-worker).
 * This creates authenticated browser states using API-based authentication.
 *
 * Benefits:
 * - 3-5x faster than UI-based per-test authentication
 * - No race conditions from multiple workers authenticating simultaneously
 * - Bypasses UI timing issues entirely
 * - Production-proven Playwright pattern
 * - Scales efficiently to 4+ workers
 */
async function globalSetup(config: FullConfig) {
	// biome-ignore lint/suspicious/noConsole: Required for test setup progress visibility
	console.log(
		"\n🔧 Global Setup: Creating authenticated browser states via API...\n",
	);

	// Run pre-flight validations before proceeding
	const { allValid } = await runPreflightValidations();

	if (!allValid) {
		throw new Error(
			"❌ Pre-flight validation failed. See details above. Please ensure Supabase is running and environment variables are configured correctly.",
		);
	}

	// Clean up billing test data before creating auth states
	// This prevents duplicate subscription records from accumulating across test runs
	// See: Issue #1461 - E2E Shard 10 Duplicate Subscription Records
	await cleanupBillingTestData();

	// PHASE 2 FIX: Run health checks before auth setup
	// This provides early warning if services are unhealthy
	// See: Issue #992 - E2E Test Infrastructure Systemic Architecture Problems
	// biome-ignore lint/suspicious/noConsole: Required for test setup health check visibility
	console.log("\n🏥 Running server health checks...\n");
	const [supabaseHealth, nextJsHealth, payloadHealth] = await Promise.all([
		checkSupabaseHealth(),
		checkNextJsHealth(),
		checkPayloadHealth(),
	]);

	logHealthCheckResults({
		supabase: supabaseHealth,
		nextjs: nextJsHealth,
		payload: payloadHealth,
	});

	// Supabase and Next.js are required for tests
	if (!supabaseHealth.healthy) {
		throw new Error(
			`❌ Supabase health check failed: ${supabaseHealth.message}. Cannot proceed with auth setup.`,
		);
	}

	if (!nextJsHealth.healthy) {
		throw new Error(
			`❌ Next.js health check failed: ${nextJsHealth.message}. Cannot proceed with tests.`,
		);
	}

	// Payload is optional - only warn if unhealthy
	// Payload tests will be skipped if Payload is unavailable
	const skipPayloadAuth = !payloadHealth.healthy;
	if (skipPayloadAuth) {
		// biome-ignore lint/suspicious/noConsole: Required for warning visibility
		console.warn(
			"⚠️  Payload is unhealthy - Payload auth will be skipped. Payload tests may fail.",
		);
	}

	const baseURL = config.projects[0]?.use?.baseURL || "http://localhost:3001";

	// Validate baseURL in CI environment to prevent localhost URL usage
	// biome-ignore lint/suspicious/noConsole: Required for test setup configuration visibility
	console.log(`🌐 Using BASE_URL: ${baseURL}`);

	if (baseURL?.includes("localhost") && process.env.CI === "true") {
		throw new Error(
			"❌ CI environment detected but BASE_URL points to localhost! Check PLAYWRIGHT_BASE_URL environment variable.",
		);
	}

	// ⚠️ Validate Docker environment for E2E tests
	// Auth cookies are generated based on Supabase URL hostname:
	// - Docker test environment uses host.docker.internal → sb-host-auth-token
	// - Dev server uses 127.0.0.1 → sb-127-auth-token
	// Running against dev server (port 3000) will cause cookie mismatch failures
	if (baseURL?.includes(":3000") && !process.env.SKIP_DOCKER_WARNING) {
		// biome-ignore lint/suspicious/noConsole: Required for warning visibility
		console.warn(`
╔════════════════════════════════════════════════════════════════════════════╗
║  ⚠️  WARNING: E2E Tests Running Against Dev Server (Port 3000)            ║
╠════════════════════════════════════════════════════════════════════════════╣
║                                                                            ║
║  Authentication cookies may not match between E2E setup and dev server!   ║
║                                                                            ║
║  The E2E auth setup generates cookies named 'sb-host-auth-token' but      ║
║  the dev server expects 'sb-127-auth-token'.                              ║
║                                                                            ║
║  RECOMMENDED: Use Docker test environment (port 3001) for E2E tests:      ║
║                                                                            ║
║    docker-compose -f docker-compose.test.yml up -d                        ║
║    curl http://localhost:3001/api/health  # Wait for ready                ║
║    pnpm --filter e2e test                                                 ║
║                                                                            ║
║  Set SKIP_DOCKER_WARNING=true to suppress this warning.                   ║
║                                                                            ║
╚════════════════════════════════════════════════════════════════════════════╝
`);
	}

	// Initialize Supabase client
	// CRITICAL: JWT issuer URL and cookie names are derived from the Supabase URL hostname
	// e.g., http://127.0.0.1:54521 -> JWT iss: http://127.0.0.1:54521/auth/v1, cookie: sb-127-auth-token
	//       http://host.docker.internal:54521 -> JWT iss: http://host.docker.internal:54521/auth/v1, cookie: sb-host-auth-token
	//
	// When running tests against a Docker server:
	// - The server uses host.docker.internal (required for Docker to reach host)
	// - E2E global setup MUST also use host.docker.internal for authentication
	// - This ensures JWT tokens have matching issuer URLs (required for session validation)
	// - See: Issue #1143 - E2E Password Update Test Fails - Supabase URL Mismatch
	//
	// Solution: Use the SAME URL for both authentication and cookie naming:
	// - Local Docker tests: host.docker.internal (resolves to host from containers AND host system)
	// - CI environment: 127.0.0.1 (GitHub Actions runs Supabase locally without Docker networking)
	const supabaseUrl =
		process.env.E2E_SUPABASE_URL ||
		(process.env.CI === "true"
			? "http://127.0.0.1:54521"
			: "http://host.docker.internal:54521");
	// supabaseAuthUrl and supabaseCookieUrl use the same URL to ensure JWT issuer matches
	const supabaseAuthUrl = supabaseUrl;
	const supabaseCookieUrl = supabaseUrl;
	const supabaseAnonKey =
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
		process.env.E2E_SUPABASE_ANON_KEY ||
		"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

	// Log the Supabase URL being used for debugging
	// biome-ignore lint/suspicious/noConsole: Required for test setup configuration visibility
	console.log(`🔗 Using Supabase URL: ${supabaseUrl} (auth + cookie naming)`);

	// Create auth state directory if it doesn't exist
	const authDir = join(cwd(), ".auth");
	const { mkdirSync } = await import("node:fs");
	try {
		mkdirSync(authDir, { recursive: true });
	} catch (_e) {
		// Directory already exists
	}

	// Define auth states to create
	const authStates = [
		{
			name: "test user",
			role: "test" as const,
			filePath: join(authDir, "test1@slideheroes.com.json"),
			navigateToPayload: false,
		},
		{
			name: "owner user",
			role: "owner" as const,
			filePath: join(authDir, "test2@slideheroes.com.json"),
			navigateToPayload: false,
		},
		{
			name: "super-admin user",
			role: "admin" as const,
			filePath: join(authDir, "michael@slideheroes.com.json"),
			navigateToPayload: false,
		},
		{
			name: "payload-admin user",
			role: "payload-admin" as const,
			filePath: join(authDir, "payload-admin.json"),
			navigateToPayload: true,
		},
	];

	const browser = await chromium.launch();

	// Authenticate all users sequentially via API (happens once, so performance is acceptable)
	for (const authState of authStates) {
		try {
			// biome-ignore lint/suspicious/noConsole: Required for test setup progress visibility
			console.log(`🔐 Authenticating ${authState.name} via Supabase API...`);

			const credentials = CredentialValidator.validateAndGet(authState.role);

			// Create a fresh Supabase client for each user (uses auth URL for actual auth)
			const supabase = createClient(supabaseAuthUrl, supabaseAnonKey);

			// Sign in via API
			const { data, error } = await supabase.auth.signInWithPassword({
				email: credentials.email,
				password: credentials.password,
			});

			if (error || !data.session) {
				// biome-ignore lint/suspicious/noConsole: Required for error reporting in test setup
				console.error(
					`❌ Failed to authenticate ${authState.name}: ${error?.message || "No session returned"}`,
				);

				// Provide detailed diagnostics for debugging
				// biome-ignore lint/suspicious/noConsole: Required for error diagnostics
				console.error(`
📋 Authentication Failure Diagnostics:
  User: ${authState.name}
  Role: ${authState.role}
  Email: ${credentials.email}
  Supabase URL: ${supabaseAuthUrl}
  Error: ${error?.message || "No error message"}
  Error Code: ${error?.code || "unknown"}
  Has Session: ${!!data?.session}

🔧 Troubleshooting:
  1. Verify Supabase is running: curl ${supabaseAuthUrl}/api/health
  2. Check credentials are correct in credential-validator.ts
  3. Verify user exists in Supabase auth_users table
  4. Check Supabase logs for auth errors
  5. Run: DEBUG_E2E_AUTH=true pnpm --filter e2e test for more details
				`);

				throw error || new Error("No session returned from Supabase");
			}

			// biome-ignore lint/suspicious/noConsole: Required for test setup progress visibility
			console.log(`✅ API authentication successful for ${authState.name}`);

			// For super admin user, verify MFA to get AAL2 session
			if (authState.role === "admin") {
				debugLog("mfa:challenge_start", {
					user: authState.name,
					userId: data.session?.user?.id?.slice(0, 8),
				});

				// Get MFA factors for this user
				const { data: factorsData, error: factorsError } =
					await supabase.auth.mfa.listFactors();

				if (factorsError) {
					// biome-ignore lint/suspicious/noConsole: Required for error reporting in test setup
					console.error(
						`⚠️  MFA factor retrieval failed for ${authState.name}: ${factorsError.message}`,
					);
					// Don't throw - continue without AAL2 (non-admin users don't need MFA)
				} else if (factorsData?.totp && factorsData.totp.length > 0) {
					const totpFactor = factorsData.totp[0];

					debugLog("mfa:factor_found", {
						user: authState.name,
						factorId: totpFactor.id,
						factorStatus: totpFactor.status,
					});

					// Generate TOTP code
					const { otp } = await TOTP.generate(MFA_KEY, { period: 30 });

					debugLog("mfa:otp_generated", { user: authState.name, otpLength: 6 });

					// Challenge and verify MFA in one step
					const { data: verifyData, error: verifyError } =
						await supabase.auth.mfa.challengeAndVerify({
							factorId: totpFactor.id,
							code: otp,
						});

					if (verifyError) {
						// biome-ignore lint/suspicious/noConsole: Required for error reporting in test setup
						console.error(
							`⚠️  MFA verification failed for ${authState.name}: ${verifyError.message}`,
						);
					} else if (verifyData) {
						// Get the updated session with AAL2
						const { data: sessionData } = await supabase.auth.getSession();
						if (sessionData?.session) {
							data.session = sessionData.session;

							debugLog("mfa:verified_success", {
								user: authState.name,
								newAal: sessionData.session.user.app_metadata?.aal || "unknown",
								userId: data.session?.user?.id?.slice(0, 8),
							});

							// biome-ignore lint/suspicious/noConsole: Required for test setup progress visibility
							console.log(`✅ MFA verified (AAL2) for ${authState.name}`);
						}
					}
				} else {
					// biome-ignore lint/suspicious/noConsole: Required for test setup progress visibility
					console.log(
						`ℹ️  No TOTP factors found for ${authState.name}, skipping MFA`,
					);
				}
			}

			// Create browser context with Vercel bypass headers and inject the session
			const context = await browser.newContext({
				baseURL,
				extraHTTPHeaders: process.env.VERCEL_AUTOMATION_BYPASS_SECRET
					? {
							"x-vercel-protection-bypass":
								process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
							"x-vercel-set-bypass-cookie": "samesitenone",
						}
					: {},
			});
			const page = await context.newPage();

			// Navigate to the app with Vercel bypass query parameters to avoid redirect
			// The query parameters set the bypass cookie, allowing subsequent navigations to work
			// Use domcontentloaded for reliable setup with analytics scripts
			const initialUrl = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
				? `/?x-vercel-protection-bypass=${process.env.VERCEL_AUTOMATION_BYPASS_SECRET}&x-vercel-set-bypass-cookie=samesitenone`
				: "/";

			await page.goto(initialUrl, { waitUntil: "domcontentloaded" });

			// Explicitly set Vercel bypass cookie if secret is available
			// This ensures the bypass persists in the saved storage state
			if (process.env.VERCEL_AUTOMATION_BYPASS_SECRET) {
				const hostname = new URL(baseURL).hostname;
				const isVercelPreview = hostname.endsWith(".vercel.app");

				// For Vercel preview deployments, don't set explicit domain
				// to match auth cookie behavior and ensure proper transmission
				// See: Issue #1096 - consistent domain handling for all cookies
				const vercelCookie: {
					name: string;
					value: string;
					path: string;
					httpOnly: boolean;
					secure: boolean;
					sameSite: "Lax" | "Strict" | "None";
					domain?: string;
				} = {
					name: "_vercel_jwt",
					value: process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
					path: "/",
					httpOnly: true,
					secure: true,
					sameSite: "Lax",
				};

				// Only set domain for non-Vercel preview deployments
				if (!isVercelPreview) {
					vercelCookie.domain = hostname;
				}

				// For Vercel preview deployments, use url property instead of domain
				// to satisfy Playwright's cookie API validation requirements
				// Playwright's addCookies() requires: url OR (domain AND path)
				// When using url, we omit path to avoid conflicts
				// See: Issue #1485 - Vercel Bypass Cookie Missing URL Property
				if (isVercelPreview) {
					await context.addCookies([
						{
							name: vercelCookie.name,
							value: vercelCookie.value,
							url: baseURL,
							httpOnly: vercelCookie.httpOnly,
							secure: vercelCookie.secure,
							sameSite: vercelCookie.sameSite,
						},
					]);
				} else {
					await context.addCookies([vercelCookie]);
				}

				// Reload page to ensure bypass cookie is active
				await page.reload({ waitUntil: "domcontentloaded" });
			}

			// Inject Supabase session into cookies using @supabase/ssr for proper encoding
			// CRITICAL: We use @supabase/ssr's createServerClient to set cookies in the exact
			// format the middleware expects. This avoids encoding mismatches.
			// See: https://github.com/supabase/ssr/issues/36
			//
			// Get domain configuration for cookies based on deployment type
			// Handles Vercel preview URLs, localhost, and custom domains appropriately
			// See Issue #1062, #1063 for context on cookie domain handling
			const cookieConfig = getCookieDomainConfig(baseURL);
			const domain = cookieConfig.domain;

			// Log cookie domain configuration for visibility
			// biome-ignore lint/suspicious/noConsole: Required for test setup configuration visibility
			console.log(
				`🍪 Cookie domain config: ${domain || "(browser default)"} (isVercelPreview: ${cookieConfig.isVercelPreview})`,
			);

			// Cookie store that captures what @supabase/ssr wants to set
			// Use the same getAll/setAll pattern as the middleware for consistency
			interface StoredCookie {
				name: string;
				value: string;
				options: CookieOptions;
			}
			const cookieStore: StoredCookie[] = [];

			// Create an @supabase/ssr client with a custom cookie store
			// IMPORTANT: Use supabaseCookieUrl here - this determines the cookie name
			// The cookie name is derived from the URL (e.g., host.docker.internal -> sb-host-auth-token)
			// This must match what the server expects
			const ssrClient = createServerClient(supabaseCookieUrl, supabaseAnonKey, {
				cookies: {
					getAll() {
						// Return all captured cookies in the format expected by @supabase/ssr
						return cookieStore.map((c) => ({ name: c.name, value: c.value }));
					},
					setAll(cookiesToSet) {
						// Clear and replace with new cookies
						cookieStore.length = 0;
						for (const cookie of cookiesToSet) {
							cookieStore.push({
								name: cookie.name,
								value: cookie.value,
								options: cookie.options,
							});
						}
					},
				},
			});

			// Set the session using @supabase/ssr's internal encoding
			// This will call our cookie store's setAll() method with the properly encoded cookies
			const { error: setSessionError } = await ssrClient.auth.setSession({
				access_token: data.session.access_token,
				refresh_token: data.session.refresh_token,
			});

			if (setSessionError) {
				// biome-ignore lint/suspicious/noConsole: Required for error reporting in test setup
				console.error(
					`❌ Failed to set session for ${authState.name}: ${setSessionError.message}`,
				);
				throw setSessionError;
			}

			// Log session info for debugging
			const projectRef = new URL(supabaseCookieUrl).hostname.split(".")[0];
			const cookieName = `sb-${projectRef}-auth-token`;
			debugLog("session:created", {
				user: authState.name,
				projectRef,
				cookieName,
				domain,
				userId: data.session?.user?.id
					? `${data.session.user.id.slice(0, 8)}...`
					: null,
				accessTokenLength: data.session?.access_token?.length ?? 0,
				refreshTokenLength: data.session?.refresh_token?.length ?? 0,
				cookiesCreated: cookieStore.length,
			});

			// Set cookie expiration - use session's expires_at or default to 1 hour
			const cookieExpires =
				data.session.expires_at ?? Math.floor(Date.now() / 1000) + 3600;

			// Convert captured cookies to Playwright's cookie format
			// Note: Playwright expects sameSite to be capitalized (Lax, Strict, None)
			// but @supabase/ssr returns lowercase (lax, strict, none)
			const normalizeSameSite = (
				value?: string,
				defaultValue: "Lax" | "Strict" | "None" = "Lax",
			): "Lax" | "Strict" | "None" => {
				if (!value) return defaultValue;
				const lower = value.toLowerCase();
				if (lower === "strict") return "Strict";
				if (lower === "none") return "None";
				return "Lax";
			};

			const cookiesToSet = cookieStore
				.filter((c) => c.value) // Skip removal cookies (empty values)
				.map((c) => {
					const isVercelCookie = c.name === "_vercel_jwt";

					// Build cookie object, conditionally including domain
					// For Vercel preview deployments, domain is undefined to let browser use defaults
					// See: Issue #1096 - domain-less cookies fix server-side middleware cookie reception
					const cookieBase = {
						name: c.name,
						value: c.value,
						path: c.options.path || "/",
						expires: cookieExpires, // Unix timestamp in seconds
						// CRITICAL: Do NOT force httpOnly for auth cookies!
						// The @supabase/ssr browser client reads cookies via document.cookie
						// If cookies are httpOnly, JavaScript can't read them and getSession() returns null
						// See: Issue #1143 - E2E Password Update Test Fails - Supabase URL Mismatch
						// The Supabase SSR library sets httpOnly appropriately - trust its defaults
						// Only force httpOnly for Vercel bypass cookie which is truly server-only
						httpOnly: isVercelCookie ? true : (c.options.httpOnly ?? false),
						// Use HTTPS requirement based on deployment type
						// IMPORTANT: Vercel deployments require secure: true
						secure: baseURL.startsWith("https"),
						// Use domain-specific sameSite default (important for Vercel preview deployments)
						// Vercel requires Lax or None, we default to Lax for security
						sameSite: normalizeSameSite(
							c.options.sameSite as string,
							cookieConfig.sameSite,
						),
					};

					// Cookie domain/url strategy based on environment:
					// - Local/Docker: Use explicit domain (e.g., "localhost")
					// - Vercel preview: Use url property (domain is undefined)
					//
					// Playwright's addCookies() API requires: url OR (domain AND path)
					// See: Issue #1109 - E2E Local Test Regression After Vercel Preview Cookie Fixes
					//
					// IMPORTANT: We explicitly check isVercelPreview to ensure local tests
					// NEVER accidentally get the url property, which can cause cookie
					// transmission issues with Docker-based test infrastructure.
					if (domain) {
						// Local development, Docker tests, or production with explicit domain
						return { ...cookieBase, domain };
					}

					// Only use url property for Vercel preview deployments
					// This is required because Vercel preview URLs are dynamic and
					// we cannot set an explicit domain
					// When using url, we must omit path to avoid Playwright cookie API conflicts
					// See: Issue #1485 - Vercel Bypass Cookie Missing URL Property
					if (cookieConfig.isVercelPreview) {
						return {
							name: cookieBase.name,
							value: cookieBase.value,
							url: baseURL,
							expires: cookieBase.expires,
							httpOnly: cookieBase.httpOnly,
							secure: cookieBase.secure,
							sameSite: cookieBase.sameSite,
						};
					}

					// Fallback: If domain is undefined but NOT Vercel preview,
					// default to localhost for safety (prevents test failures)
					debugLog("cookie:fallback_domain", {
						name: c.name,
						reason: "domain undefined but not Vercel preview",
						fallback: "localhost",
					});
					return { ...cookieBase, domain: "localhost" };
				});

			// Log cookie details for debugging
			// Note: domain may be undefined for Vercel preview deployments (browser uses default)
			debugLog("cookies:setting", {
				user: authState.name,
				totalCookies: cookiesToSet.length,
				cookieExpires,
				expiresDate: new Date(cookieExpires * 1000).toISOString(),
				domainStrategy: domain
					? `explicit: ${domain}`
					: "browser default (Vercel preview)",
				cookies: cookiesToSet.map((c) => ({
					name: c.name,
					valueLength: c.value.length,
					valuePreview: `${c.value.substring(0, 30)}...`,
					domain: "domain" in c ? c.domain : "(browser default)",
					path: "path" in c ? c.path : "(derived from url)",
					expires: c.expires,
					secure: c.secure,
				})),
			});

			await context.addCookies(cookiesToSet);

			// Log cookie summary for visibility (especially useful for Vercel preview debugging)
			// This helps diagnose Issue #1096 - Auth session lost in Vercel preview deployments
			for (const cookie of cookiesToSet) {
				// biome-ignore lint/suspicious/noConsole: Required for test setup visibility
				console.log(`   🍪 ${cookie.name}:`);
				// biome-ignore lint/suspicious/noConsole: Required for test setup visibility
				console.log(
					`      Domain: ${"domain" in cookie ? cookie.domain : "(browser default)"}`,
				);
				// biome-ignore lint/suspicious/noConsole: Required for test setup visibility
				console.log(`      SameSite: ${cookie.sameSite}`);
				// biome-ignore lint/suspicious/noConsole: Required for test setup visibility
				console.log(`      Secure: ${cookie.secure}`);
				// biome-ignore lint/suspicious/noConsole: Required for test setup visibility
				console.log(`      HttpOnly: ${cookie.httpOnly}`);
			}

			// Also set in localStorage for any client-side code that might read from there
			await page.evaluate(
				({ session, key }) => {
					localStorage.setItem(key, JSON.stringify(session));
				},
				{ session: data.session, key: cookieName },
			);

			// biome-ignore lint/suspicious/noConsole: Required for test setup progress visibility
			console.log(
				`✅ Session injected into cookies and localStorage for ${authState.name}`,
			);

			// Verify cookies were actually set and have correct attributes
			// This diagnostic is crucial for debugging Vercel preview deployment issues
			try {
				const cookieVerification = await verifyCookiesPresent(
					context,
					cookieName,
				);

				if (!cookieVerification.success) {
					// biome-ignore lint/suspicious/noConsole: Required for error reporting in test setup
					console.warn(
						`⚠️  Cookie verification warning for ${authState.name}: ${cookieVerification.message}`,
					);
					// Log all cookies for debugging
					await logCookieDetails(context, `Cookies for ${authState.name}`);
				} else {
					debugLog("cookies:verified", {
						user: authState.name,
						cookieCount: cookieVerification.cookieCount,
						cookieName,
					});
				}

				// Verify cookie attributes are correct
				// Note: We do NOT require httpOnly for Supabase auth cookies because
				// the @supabase/ssr browser client needs to read them via document.cookie
				// See: Issue #1143 - E2E Password Update Test Fails
				const attributeVerification = await verifyCookieAttributes(context, {
					requireHttpOnly: false,
					expectedSameSite: cookieConfig.sameSite,
				});

				if (!attributeVerification.success) {
					// biome-ignore lint/suspicious/noConsole: Required for warning visibility
					console.warn(
						`⚠️  Cookie attribute verification warning for ${authState.name}: ${attributeVerification.message}`,
					);
				} else {
					debugLog("cookies:attributes_valid", {
						user: authState.name,
						sameSite: cookieConfig.sameSite,
					});
				}
			} catch (verificationError) {
				// biome-ignore lint/suspicious/noConsole: Required for warning visibility
				console.warn(
					`⚠️  Cookie verification encountered an error for ${authState.name}: ${(verificationError as Error).message}`,
				);
				// Continue anyway - verification is diagnostic, not blocking
			}

			// Reload page to activate the injected session
			// The Supabase client needs to reinitialize with the new session from localStorage
			await page.reload({ waitUntil: "domcontentloaded" });

			// For Payload admin users, authenticate via Payload's API and inject the token cookie
			// Payload CMS uses its own independent authentication system with payload-token cookies
			// PHASE 2 FIX: Skip Payload auth if health check failed (prevents cascade failures)
			// See: Issue #992 - E2E Test Infrastructure Systemic Architecture Problems
			if (authState.navigateToPayload) {
				if (skipPayloadAuth) {
					// biome-ignore lint/suspicious/noConsole: Required for test setup progress visibility
					console.log(
						`⏭️  Skipping Payload auth for ${authState.name} (Payload server unhealthy)`,
					);
					// Still save the Supabase auth state - Payload tests will be skipped at runtime
				} else {
					const payloadUrl =
						process.env.PAYLOAD_PUBLIC_SERVER_URL || "http://localhost:3021";
					// biome-ignore lint/suspicious/noConsole: Required for test setup progress visibility
					console.log(
						`🔄 Authenticating to Payload CMS via API for ${authState.name}...`,
					);

					try {
						// Use Payload's login API with retry logic to handle transient failures
						// This throws an error after 3 failed attempts for clear failure visibility
						const payloadToken = await loginToPayloadWithRetry(
							payloadUrl,
							credentials.email,
							credentials.password,
						);

						// Inject the payload-token cookie into the browser context
						const payloadDomain = new URL(payloadUrl).hostname;
						await context.addCookies([
							{
								name: "payload-token",
								value: payloadToken,
								domain: payloadDomain,
								path: "/",
								httpOnly: true,
								secure: payloadUrl.startsWith("https"),
								sameSite: "Lax",
								// Token expires in 2 hours (standard Payload JWT lifetime)
								expires: Math.floor(Date.now() / 1000) + 7200,
							},
						]);

						// biome-ignore lint/suspicious/noConsole: Required for test setup progress visibility
						console.log(
							`✅ Payload API login successful, payload-token cookie injected for ${authState.name}`,
						);

						debugLog("payload:cookie_injected", {
							user: authState.name,
							domain: payloadDomain,
							tokenLength: payloadToken.length,
							expires: Math.floor(Date.now() / 1000) + 7200,
						});

						// Navigate to Payload admin to verify authentication works
						await page.goto(`${payloadUrl}/admin`, {
							waitUntil: "domcontentloaded",
							timeout: 30000,
						});

						// Give it a moment for the page to settle
						await page.waitForTimeout(1000);

						// Final verification: ensure we're authenticated (not on login page)
						const adminNav = await page
							.locator(".nav, .sidebar, .template-default")
							.first()
							.isVisible({ timeout: 5000 })
							.catch(() => false);

						if (adminNav) {
							// biome-ignore lint/suspicious/noConsole: Required for test setup progress visibility
							console.log(
								`✅ Payload admin panel loaded for ${authState.name}`,
							);
						} else {
							// biome-ignore lint/suspicious/noConsole: Required for test setup progress visibility
							console.log(
								`⚠️  Could not verify Payload admin access for ${authState.name} (token was set)`,
							);
						}
					} catch (error) {
						// Payload authentication is optional - only needed for Payload-specific test shards (7-8)
						// When Payload server isn't running (batches 1, 3, etc.), we log a warning and continue
						// This allows non-Payload test batches to run successfully without the Payload server
						// biome-ignore lint/suspicious/noConsole: Required for warning visibility in test setup
						console.warn(
							`⚠️  Payload authentication skipped for ${authState.name}: ${(error as Error).message}`,
						);
						// biome-ignore lint/suspicious/noConsole: Required for warning visibility in test setup
						console.warn(
							"   (This is expected if Payload server is not running - Payload tests will start it when needed)",
						);
					}
				}
			}

			// Save authenticated state
			await context.storageState({ path: authState.filePath });
			// biome-ignore lint/suspicious/noConsole: Required for test setup progress visibility
			console.log(`✅ ${authState.name} auth state saved successfully\n`);

			// Log saved state summary for debugging
			debugLog("state:saved", {
				user: authState.name,
				filePath: authState.filePath,
				cookieName,
			});

			await context.close();
		} catch (setupError) {
			// Comprehensive error handling for entire auth setup flow
			const error = setupError as Error;

			// biome-ignore lint/suspicious/noConsole: Required for error reporting in test setup
			console.error(`
❌ Global Setup Failed for ${authState.name}

Error Details:
  Message: ${error.message}
  Stack: ${error.stack}

🔧 Troubleshooting:
  1. Check Supabase health: curl http://127.0.0.1:54521/api/health
  2. Verify credentials in credential-validator.ts
  3. Check environment variables (E2E_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)
  4. Run with DEBUG_E2E_AUTH=true for verbose logging
  5. Check that all required services are running:
     - Supabase (port 54521)
     - Next.js dev server (port 3001 for Docker, 3000 for local)
     - Payload CMS (port 3021, optional)

📝 Common Issues:
  - Network connectivity to Supabase
  - Cookie domain/hostname mismatch (check Supabase URL config)
  - Stale browser context or session
  - Port conflicts with existing services
			`);

			// Re-throw after providing diagnostics
			throw new Error(
				`Global setup failed for ${authState.name}: ${error.message}`,
			);
		}
	}

	await browser.close();

	// biome-ignore lint/suspicious/noConsole: Required for test setup progress visibility
	console.log("✅ Global Setup Complete: All auth states created via API\n");
}

export default globalSetup;
