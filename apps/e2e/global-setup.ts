import { join } from "node:path";
import { cwd } from "node:process";
import { chromium, type FullConfig } from "@playwright/test";
import { type CookieOptions, createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { config as dotenvConfig } from "dotenv";
import { TOTP } from "totp-generator";

import { CredentialValidator } from "./tests/utils/credential-validator";
import { runPreflightValidations } from "./tests/utils/e2e-validation";

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
	// CRITICAL: Cookie names are derived from the Supabase URL hostname
	// e.g., http://127.0.0.1:54521 -> sb-127-auth-token
	//       http://host.docker.internal:54521 -> sb-host-auth-token
	//
	// When running tests against a Docker server:
	// - The server uses host.docker.internal (required for Docker to reach host)
	// - E2E setup runs on host and can use 127.0.0.1 for authentication
	// - But cookies must use the SAME name the server expects
	//
	// Solution: Use two URLs:
	// - supabaseAuthUrl: For authentication (127.0.0.1 works on host)
	// - supabaseCookieUrl: For cookie naming (must match server's URL)
	const supabaseAuthUrl =
		process.env.E2E_SUPABASE_URL || "http://127.0.0.1:54521";
	// For cookie naming, we need the URL the SERVER uses (not the E2E setup)
	// Three-tier fallback:
	// 1. E2E_SERVER_SUPABASE_URL - explicit override for any environment
	// 2. CI environment (GitHub Actions) - use auth URL (same Supabase instance)
	// 3. Local Docker - use host.docker.internal (for Docker-to-host communication)
	const supabaseCookieUrl =
		process.env.E2E_SERVER_SUPABASE_URL ||
		(process.env.CI === "true"
			? supabaseAuthUrl
			: "http://host.docker.internal:54521");
	const supabaseAnonKey =
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
		process.env.E2E_SUPABASE_ANON_KEY ||
		"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

	// Log the Supabase URLs being used for debugging
	// biome-ignore lint/suspicious/noConsole: Required for test setup configuration visibility
	console.log(`🔗 Using Supabase Auth URL: ${supabaseAuthUrl}`);
	// biome-ignore lint/suspicious/noConsole: Required for test setup configuration visibility
	console.log(
		`🍪 Using Supabase Cookie URL: ${supabaseCookieUrl} (for cookie naming)`,
	);

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
			const domain = new URL(baseURL).hostname;
			await context.addCookies([
				{
					name: "_vercel_jwt",
					value: process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
					domain,
					path: "/",
					httpOnly: true,
					secure: true,
					sameSite: "Lax",
				},
			]);

			// Reload page to ensure bypass cookie is active
			await page.reload({ waitUntil: "domcontentloaded" });
		}

		// Inject Supabase session into cookies using @supabase/ssr for proper encoding
		// CRITICAL: We use @supabase/ssr's createServerClient to set cookies in the exact
		// format the middleware expects. This avoids encoding mismatches.
		// See: https://github.com/supabase/ssr/issues/36
		const domain = new URL(baseURL).hostname;

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
		const normalizeSameSite = (value?: string): "Lax" | "Strict" | "None" => {
			if (!value) return "Lax";
			const lower = value.toLowerCase();
			if (lower === "strict") return "Strict";
			if (lower === "none") return "None";
			return "Lax";
		};

		const cookiesToSet = cookieStore
			.filter((c) => c.value) // Skip removal cookies (empty values)
			.map((c) => ({
				name: c.name,
				value: c.value,
				domain,
				path: c.options.path || "/",
				expires: cookieExpires, // Unix timestamp in seconds
				httpOnly: c.options.httpOnly ?? false,
				secure: baseURL.startsWith("https"),
				sameSite: normalizeSameSite(c.options.sameSite as string),
			}));

		// Log cookie details for debugging
		debugLog("cookies:setting", {
			user: authState.name,
			totalCookies: cookiesToSet.length,
			cookieExpires,
			expiresDate: new Date(cookieExpires * 1000).toISOString(),
			cookies: cookiesToSet.map((c) => ({
				name: c.name,
				valueLength: c.value.length,
				valuePreview: `${c.value.substring(0, 30)}...`,
				domain: c.domain,
				path: c.path,
				expires: c.expires,
				secure: c.secure,
			})),
		});

		await context.addCookies(cookiesToSet);

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

		// Reload page to activate the injected session
		// The Supabase client needs to reinitialize with the new session from localStorage
		await page.reload({ waitUntil: "domcontentloaded" });

		// For Payload admin users, authenticate via Payload's API and inject the token cookie
		// Payload CMS uses its own independent authentication system with payload-token cookies
		if (authState.navigateToPayload) {
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
					console.log(`✅ Payload admin panel loaded for ${authState.name}`);
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
	}

	await browser.close();

	// biome-ignore lint/suspicious/noConsole: Required for test setup progress visibility
	console.log("✅ Global Setup Complete: All auth states created via API\n");
}

export default globalSetup;
