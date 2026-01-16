/**

* Environment & Authentication Module
*
* Handles environment variable management, OAuth token retrieval,
* and environment validation for the orchestrator.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import process from "node:process";

// ============================================================================
// Environment Variables
// ============================================================================

export const E2B_API_KEY = process.env.E2B_API_KEY;
export const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
export const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// Dynamic runtime environment (set by orchestrator)
let _orchestratorUrl: string | undefined;

/**
 * Set the orchestrator URL for event streaming.
 * This is set by the orchestrator after starting the event server.
 */
export function setOrchestratorUrl(url: string | undefined): void {
	_orchestratorUrl = url;
}

/**
 * Get the orchestrator URL for event streaming.
 */
export function getOrchestratorUrl(): string | undefined {
	return _orchestratorUrl;
}

// ============================================================================
// OAuth Token Management
// ============================================================================

let _cachedOAuthToken: string | undefined;

/**

* Get Claude OAuth token from environment or credentials file.
* Checks CLAUDE_CODE_OAUTH_TOKEN env var first, then falls back to
* ~/.claude/.credentials.json
 */
export function getClaudeOAuthToken(): string | undefined {
	if (process.env.CLAUDE_CODE_OAUTH_TOKEN) {
		return process.env.CLAUDE_CODE_OAUTH_TOKEN;
	}

	const homeDir = process.env.HOME || process.env.USERPROFILE;
	if (!homeDir) return undefined;

	const credentialsPath = path.join(homeDir, ".claude", ".credentials.json");

	try {
		if (fs.existsSync(credentialsPath)) {
			const content = fs.readFileSync(credentialsPath, "utf-8");
			const credentials = JSON.parse(content);
			return credentials?.claudeAiOauth?.accessToken;
		}
	} catch {
		// Silently fail
	}

	return undefined;
}

/**

* Get cached OAuth token (avoids repeated file reads).
 */
export function getCachedOAuthToken(): string | undefined {
	if (_cachedOAuthToken === undefined) {
		_cachedOAuthToken = getClaudeOAuthToken() || "";
	}
	return _cachedOAuthToken || undefined;
}

/**

* Clear the cached OAuth token (useful for testing).
 */
export function clearOAuthTokenCache(): void {
	_cachedOAuthToken = undefined;
}

// ============================================================================
// Supabase Token Management
// ============================================================================

/**
 * Get the Supabase access token.
 *
 * IMPORTANT: We use a getter function instead of a const export to avoid
 * ESM import hoisting issues. When this module is imported, ES modules
 * execute all imports BEFORE top-level code like `loadEnvFile()`.
 * A const would capture `undefined` at import time. A getter reads
 * `process.env` at call time, after the environment is properly loaded.
 */
export function getSupabaseAccessToken(): string | undefined {
	return process.env.SUPABASE_ACCESS_TOKEN;
}

/**
 * Get the Supabase sandbox project reference.
 *
 * IMPORTANT: We use a getter function to avoid ESM import hoisting issues.
 * See `getSupabaseAccessToken()` for detailed explanation.
 */
export function getSupabaseProjectRef(): string | undefined {
	return process.env.SUPABASE_SANDBOX_PROJECT_REF;
}

/**
 * Check if Supabase authentication is configured for database operations.
 * Returns true if token and project ref are set, false otherwise.
 * Does not fail - database operations are optional.
 */
export function hasSupabaseAuth(): boolean {
	return !!(getSupabaseAccessToken() && getSupabaseProjectRef());
}

/**
 * Validate Supabase configuration and return status.
 * Provides clear feedback about what's missing.
 */
export function validateSupabaseConfig(): {
	valid: boolean;
	hasToken: boolean;
	hasProjectRef: boolean;
	message: string;
} {
	const hasToken = !!getSupabaseAccessToken();
	const hasProjectRef = !!getSupabaseProjectRef();
	const valid = hasToken && hasProjectRef;

	let message: string;
	if (valid) {
		message = "Supabase CLI authentication configured";
	} else if (!hasToken && !hasProjectRef) {
		message =
			"Supabase CLI not configured (missing SUPABASE_ACCESS_TOKEN and SUPABASE_SANDBOX_PROJECT_REF)";
	} else if (!hasToken) {
		message =
			"Supabase CLI partially configured (missing SUPABASE_ACCESS_TOKEN - get from https://supabase.com/dashboard/account/tokens)";
	} else {
		message =
			"Supabase CLI partially configured (missing SUPABASE_SANDBOX_PROJECT_REF)";
	}

	return { valid, hasToken, hasProjectRef, message };
}

/**
 * Validate that required Supabase tokens are present for database operations.
 * Use this for fail-fast validation when Supabase operations are required.
 *
 * Unlike hasSupabaseAuth() which returns a boolean, this provides detailed
 * error messages with actionable instructions for fixing configuration issues.
 */
export function validateSupabaseTokensRequired(): {
	isValid: boolean;
	message: string;
} {
	const token = getSupabaseAccessToken();
	const projectRef = getSupabaseProjectRef();

	if (!token || !projectRef) {
		const missing: string[] = [];
		if (!token) missing.push("SUPABASE_ACCESS_TOKEN");
		if (!projectRef) missing.push("SUPABASE_SANDBOX_PROJECT_REF");

		return {
			isValid: false,
			message:
				`Missing required Supabase configuration: ${missing.join(", ")}.\n` +
				"   To fix:\n" +
				"   1. Get SUPABASE_ACCESS_TOKEN from https://supabase.com/dashboard/account/tokens\n" +
				"   2. Get SUPABASE_SANDBOX_PROJECT_REF from your Supabase project settings\n" +
				"   3. Add both to your .env file or environment",
		};
	}

	return { isValid: true, message: "" };
}

// ============================================================================
// Python Dependency Validation
// ============================================================================

/**
 * Validate that required Python packages are installed.
 * Attempts to install them if missing.
 *
 * @param log - Logger function
 * @returns true if packages are available (either already installed or just installed)
 */
export async function validatePythonDependencies(
	log: (...args: unknown[]) => void,
): Promise<boolean> {
	const { execSync } = await import("node:child_process");

	const packages = ["fastapi", "uvicorn", "websockets"];
	const missingPackages: string[] = [];

	// Check which packages are missing
	for (const pkg of packages) {
		try {
			execSync(`python3 -c "import ${pkg}"`, { stdio: "ignore" });
		} catch {
			missingPackages.push(pkg);
		}
	}

	// If all packages present, we're good
	if (missingPackages.length === 0) {
		log("   ✅ Python dependencies verified");
		return true;
	}

	// Try to install missing packages
	log(`   ⚠️ Missing Python packages: ${missingPackages.join(", ")}`);
	log("   📦 Attempting to install via pip...");

	try {
		// Get project root to locate requirements file
		const projectRoot =
			process.env.PROJECT_ROOT ||
			path.resolve(
				path.dirname(new URL(import.meta.url).pathname),
				"../../../..",
			);
		const requirementsPath = path.join(
			projectRoot,
			".ai/alpha/scripts/python-requirements.txt",
		);

		// Check if requirements file exists
		if (!fs.existsSync(requirementsPath)) {
			log(`   ❌ Requirements file not found: ${requirementsPath}`);
			log("   📖 Manual installation:");
			log("      pip install fastapi uvicorn websockets");
			return false;
		}

		execSync(`pip install -q -r "${requirementsPath}"`, {
			stdio: ["pipe", "pipe", "pipe"],
		});
		log("   ✅ Python dependencies installed successfully");
		return true;
	} catch (err) {
		const errorMessage = err instanceof Error ? err.message : String(err);
		log(`   ❌ Failed to install Python dependencies: ${errorMessage}`);
		log("   📖 Manual installation:");
		log("      pip install -r .ai/alpha/scripts/python-requirements.txt");
		return false;
	}
}

// ============================================================================
// Environment Validation
// ============================================================================

/**

* Check that required environment variables are set.
* Exits process with error if not.
 */
export function checkEnvironment(): void {
	if (!E2B_API_KEY) {
		console.error("ERROR: E2B_API_KEY environment variable not set");
		process.exit(1);
	}

	const oauthToken = getCachedOAuthToken();
	if (!ANTHROPIC_API_KEY && !oauthToken) {
		console.error("ERROR: No Claude authentication found");
		process.exit(1);
	}

	// Check Supabase config (non-fatal - just informational)
	const supabaseStatus = validateSupabaseConfig();
	if (!supabaseStatus.valid) {
		console.warn(`⚠️ ${supabaseStatus.message}`);
		console.warn("   Database migration sync after features will be skipped");
	}
}

// ============================================================================
// Environment Variables for Sandbox
// ============================================================================

/**

* Get all environment variables to inject into E2B sandboxes.
* Includes Claude auth, GitHub, Supabase, Payload CMS, and R2 credentials.
 */
/**
 * Get the authentication method being used for Claude CLI.
 * Returns "api_key" if ANTHROPIC_API_KEY is set, "oauth" if only OAuth token available, or "none".
 */
export function getAuthMethod(): "api_key" | "oauth" | "none" {
	if (ANTHROPIC_API_KEY) {
		return "api_key";
	}
	const oauthToken = getCachedOAuthToken();
	if (oauthToken) {
		return "oauth";
	}
	return "none";
}

export function getAllEnvVars(): Record<string, string> {
	const envs: Record<string, string> = {};

	// Claude authentication - Prefer API key over OAuth for automated systems
	// API key is simpler, more reliable, and avoids OAuth session limits.
	// See bug fix #1449 for details.
	if (ANTHROPIC_API_KEY) {
		envs.ANTHROPIC_API_KEY = ANTHROPIC_API_KEY;
	}
	// Also inject OAuth token as fallback if API key is not set
	const oauthToken = getCachedOAuthToken();
	if (oauthToken) {
		envs.CLAUDE_CODE_OAUTH_TOKEN = oauthToken;
	}

	// GitHub
	if (GITHUB_TOKEN) {
		envs.GITHUB_TOKEN = GITHUB_TOKEN;
	}

	// Supabase credentials for dev server and runtime operations
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
	const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
	const databaseUrl = process.env.DATABASE_URL;

	if (supabaseUrl) {
		envs.NEXT_PUBLIC_SUPABASE_URL = supabaseUrl;
		envs.SUPABASE_URL = supabaseUrl;
	}
	if (supabaseAnonKey) {
		envs.NEXT_PUBLIC_SUPABASE_ANON_KEY = supabaseAnonKey;
		envs.SUPABASE_ANON_KEY = supabaseAnonKey;
	}
	if (supabaseServiceKey) {
		envs.SUPABASE_SERVICE_ROLE_KEY = supabaseServiceKey;
	}
	if (databaseUrl) {
		envs.DATABASE_URL = databaseUrl;
	}

	// Sandbox Supabase credentials (for DB operations in E2B)
	const sandboxProjectRef = process.env.SUPABASE_SANDBOX_PROJECT_REF;
	const sandboxUrl = process.env.SUPABASE_SANDBOX_URL;
	const sandboxAnonKey = process.env.SUPABASE_SANDBOX_ANON_KEY;
	const sandboxServiceKey = process.env.SUPABASE_SANDBOX_SERVICE_ROLE_KEY;
	const sandboxDbUrl = process.env.SUPABASE_SANDBOX_DB_URL;
	const supabaseAccessToken = process.env.SUPABASE_ACCESS_TOKEN;

	if (sandboxProjectRef) {
		envs.SUPABASE_SANDBOX_PROJECT_REF = sandboxProjectRef;
	}
	if (sandboxUrl) {
		envs.NEXT_PUBLIC_SUPABASE_URL = sandboxUrl;
		envs.SUPABASE_URL = sandboxUrl;
	}
	if (sandboxAnonKey) {
		envs.NEXT_PUBLIC_SUPABASE_ANON_KEY = sandboxAnonKey;
		envs.SUPABASE_ANON_KEY = sandboxAnonKey;
	}
	if (sandboxServiceKey) {
		envs.SUPABASE_SERVICE_ROLE_KEY = sandboxServiceKey;
	}
	if (sandboxDbUrl) {
		envs.DATABASE_URL = sandboxDbUrl;
		envs.SUPABASE_SANDBOX_DB_URL = sandboxDbUrl;
		// Payload uses DATABASE_URI with sslmode=require for remote connections
		const dbUriWithSsl = sandboxDbUrl.includes("?")
			? `${sandboxDbUrl}&sslmode=require`
			: `${sandboxDbUrl}?sslmode=require`;
		envs.DATABASE_URI = dbUriWithSsl;
	}
	if (supabaseAccessToken) {
		envs.SUPABASE_ACCESS_TOKEN = supabaseAccessToken;
	}

	// Payload CMS credentials for seeding
	const payloadSecret = process.env.PAYLOAD_SECRET;
	const seedUserPassword = process.env.SEED_USER_PASSWORD;

	if (payloadSecret) {
		envs.PAYLOAD_SECRET = payloadSecret;
	}
	if (seedUserPassword) {
		envs.SEED_USER_PASSWORD = seedUserPassword;
	}

	// R2 Storage credentials for seeding media files
	const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID;
	const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
	const r2AccountId = process.env.R2_ACCOUNT_ID;
	const r2MediaBucket = process.env.R2_MEDIA_BUCKET;
	const r2DownloadsBucket = process.env.R2_DOWNLOADS_BUCKET;
	const r2Region = process.env.R2_REGION;
	const mediaBaseUrl = process.env.PAYLOAD_PUBLIC_MEDIA_BASE_URL;
	const downloadsBaseUrl = process.env.PAYLOAD_PUBLIC_DOWNLOADS_BASE_URL;

	if (r2AccessKeyId) envs.R2_ACCESS_KEY_ID = r2AccessKeyId;
	if (r2SecretAccessKey) envs.R2_SECRET_ACCESS_KEY = r2SecretAccessKey;
	if (r2AccountId) envs.R2_ACCOUNT_ID = r2AccountId;
	if (r2MediaBucket) envs.R2_MEDIA_BUCKET = r2MediaBucket;
	if (r2DownloadsBucket) envs.R2_DOWNLOADS_BUCKET = r2DownloadsBucket;
	if (r2Region) envs.R2_REGION = r2Region;
	if (mediaBaseUrl) envs.PAYLOAD_PUBLIC_MEDIA_BASE_URL = mediaBaseUrl;
	if (downloadsBaseUrl)
		envs.PAYLOAD_PUBLIC_DOWNLOADS_BASE_URL = downloadsBaseUrl;

	// Orchestrator URL for event streaming (set dynamically by orchestrator)
	if (_orchestratorUrl) {
		envs.ORCHESTRATOR_URL = _orchestratorUrl;
	}

	return envs;
}
