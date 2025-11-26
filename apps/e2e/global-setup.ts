import { join } from "node:path";
import { cwd } from "node:process";
import { chromium, type FullConfig } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { config as dotenvConfig } from "dotenv";

import { CredentialValidator } from "./tests/utils/credential-validator";
import { runPreflightValidations } from "./tests/utils/e2e-validation";

// Ensure environment variables are loaded
dotenvConfig({
	path: [".env", ".env.local"],
	quiet: true,
});

// Debug logging flag for E2E auth session troubleshooting (matches middleware flag)
const DEBUG_E2E_AUTH = process.env.DEBUG_E2E_AUTH === "true";

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

	// Initialize Supabase client
	// NOTE: Port 54521 is used for WSL2 compatibility (avoiding Windows port conflicts)
	const supabaseUrl = process.env.E2E_SUPABASE_URL || "http://127.0.0.1:54521";
	const supabaseAnonKey =
		process.env.E2E_SUPABASE_ANON_KEY ||
		"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

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
		},
		{
			name: "owner user",
			role: "owner" as const,
			filePath: join(authDir, "test2@slideheroes.com.json"),
		},
		{
			name: "super-admin user",
			role: "admin" as const,
			filePath: join(authDir, "michael@slideheroes.com.json"),
		},
	];

	const browser = await chromium.launch();

	// Authenticate all users sequentially via API (happens once, so performance is acceptable)
	for (const authState of authStates) {
		// biome-ignore lint/suspicious/noConsole: Required for test setup progress visibility
		console.log(`🔐 Authenticating ${authState.name} via Supabase API...`);

		const credentials = CredentialValidator.validateAndGet(authState.role);

		// Create a fresh Supabase client for each user
		const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
		interface StoredCookie {
			name: string;
			value: string;
			options: CookieOptions;
		}
		const cookieStore: StoredCookie[] = [];
		const cookieMap = new Map<string, string>();

		// Create an @supabase/ssr client with a custom cookie store
		// This lets us capture the cookies in the exact format @supabase/ssr uses
		const ssrClient = createServerClient(supabaseUrl, supabaseAnonKey, {
			cookies: {
				get(name: string) {
					return cookieMap.get(name);
				},
				set(name: string, value: string, options: CookieOptions) {
					cookieMap.set(name, value);
					cookieStore.push({ name, value, options });
				},
				remove(name: string, options: CookieOptions) {
					cookieMap.delete(name);
					// Also add a removal cookie (empty value with past expiry)
					cookieStore.push({
						name,
						value: "",
						options: { ...options, maxAge: 0 },
					});
				},
			},
		});

		// Set the session using @supabase/ssr's internal encoding
		// This will call our cookie store's set() method with the properly encoded cookies
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
		const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
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
