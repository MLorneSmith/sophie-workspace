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

		// Create browser context and inject the session
		const context = await browser.newContext({ baseURL });
		const page = await context.newPage();

		// Navigate to the app first to set the domain
		await page.goto("/");

		// Inject Supabase session into local storage
		await page.evaluate((session) => {
			const key = `sb-${window.location.host.split(".")[0]}-auth-token`;
			localStorage.setItem(key, JSON.stringify(session));
		}, data.session);

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
