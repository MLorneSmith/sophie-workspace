import { join } from "node:path";
import { cwd } from "node:process";
import { chromium, type FullConfig } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { config as dotenvConfig } from "dotenv";

import { CredentialValidator } from "./tests/utils/credential-validator";

// Ensure environment variables are loaded
dotenvConfig({
	path: [".env", ".env.local"],
	quiet: true,
});

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
	const supabaseUrl = process.env.E2E_SUPABASE_URL || "http://127.0.0.1:54321";
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
			filePath: join(authDir, "test@slideheroes.com.json"),
		},
		{
			name: "owner user",
			role: "owner" as const,
			filePath: join(authDir, "owner@slideheroes.com.json"),
		},
		{
			name: "super-admin user",
			role: "admin" as const,
			filePath: join(authDir, "super-admin@slideheroes.com.json"),
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

		// Navigate to the app first to set the domain
		await page.goto("/");

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
			await page.reload({ waitUntil: "load" });
		}

		// Inject Supabase session into local storage
		// CRITICAL: Use Supabase URL (not deployment URL) to match what Supabase client expects
		// Supabase creates key as: sb-{project_ref}-auth-token where project_ref is from supabaseUrl
		await page.evaluate(
			({ session, supabaseUrl }) => {
				// Extract project ref from Supabase URL (e.g., "abcdefgh" from "https://abcdefgh.supabase.co")
				const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
				const key = `sb-${projectRef}-auth-token`;
				localStorage.setItem(key, JSON.stringify(session));
			},
			{ session: data.session, supabaseUrl },
		);

		// biome-ignore lint/suspicious/noConsole: Required for test setup progress visibility
		console.log(
			`✅ Session injected into browser storage for ${authState.name}`,
		);

		// Navigate to home to verify authentication
		await page.goto("/home");
		await page.waitForURL("**/home**", { timeout: 10000 });

		// Save authenticated state
		await context.storageState({ path: authState.filePath });
		// biome-ignore lint/suspicious/noConsole: Required for test setup progress visibility
		console.log(`✅ ${authState.name} auth state saved successfully\n`);

		await context.close();
	}

	await browser.close();

	// biome-ignore lint/suspicious/noConsole: Required for test setup progress visibility
	console.log("✅ Global Setup Complete: All auth states created via API\n");
}

export default globalSetup;
