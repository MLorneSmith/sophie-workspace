/**
 * Supabase Config Loader for E2E Tests
 *
 * Dynamically fetches Supabase configuration from `npx supabase status --output json`.
 * Provides fallback to hardcoded demo values if the CLI is unavailable.
 *
 * @module supabase-config-loader
 */

import { execSync } from "node:child_process";
import { join } from "node:path";

export interface SupabaseConfig {
	API_URL: string;
	ANON_KEY: string;
	SERVICE_ROLE_KEY: string;
	DB_URL: string;
	STUDIO_URL?: string;
	ports?: {
		api: number;
		db: number;
		studio: number;
	};
}

/**
 * Default fallback values (demo keys)
 * Used when Supabase CLI is unavailable or returns invalid output
 */
export const FALLBACK_CONFIG: SupabaseConfig = {
	API_URL: "http://127.0.0.1:54521",
	ANON_KEY:
		"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0",
	SERVICE_ROLE_KEY:
		"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU",
	DB_URL: "postgresql://postgres:postgres@127.0.0.1:54522/postgres",
	STUDIO_URL: "http://127.0.0.1:54523",
};

/**
 * Cache for Supabase config to avoid repeated shell executions
 */
let configCache: { config: SupabaseConfig | null; timestamp: number } = {
	config: null,
	timestamp: 0,
};

/**
 * Cache duration in milliseconds (5 minutes)
 */
const CACHE_DURATION_MS = 5 * 60 * 1000;

interface GetSupabaseConfigOptions {
	cwd?: string;
	useCache?: boolean;
	timeout?: number;
}

/**
 * Extracts port number from a URL string
 */
function extractPort(url: string): number {
	try {
		const parsed = new URL(url);
		if (parsed.port) {
			return parseInt(parsed.port, 10);
		}
		// Default ports
		return parsed.protocol === "https:" ? 443 : 80;
	} catch {
		// Try regex fallback for non-standard URLs like postgresql://
		const match = url.match(/:(\d+)(?:\/|$)/);
		if (match) {
			return parseInt(match[1], 10);
		}
		return 80;
	}
}

/**
 * Fetches Supabase configuration dynamically from the CLI.
 *
 * @param options - Configuration options
 * @returns Supabase configuration with API_URL, ANON_KEY, SERVICE_ROLE_KEY, DB_URL
 */
export function getSupabaseConfig(
	options: GetSupabaseConfigOptions = {},
): SupabaseConfig {
	const {
		cwd = join(process.cwd(), "apps/web"),
		useCache = true,
		timeout = 10000,
	} = options;

	// Return cached config if still valid
	const now = Date.now();
	if (
		useCache &&
		configCache.config &&
		now - configCache.timestamp < CACHE_DURATION_MS
	) {
		return configCache.config;
	}

	try {
		const output = execSync("npx supabase status --output json", {
			encoding: "utf-8",
			cwd,
			timeout,
			stdio: ["pipe", "pipe", "pipe"],
		});

		const config = JSON.parse(output.trim()) as Record<string, unknown>;

		// Validate required properties
		const requiredProps = ["API_URL", "ANON_KEY", "SERVICE_ROLE_KEY", "DB_URL"];
		const missingProps = requiredProps.filter((prop) => !config[prop]);

		if (missingProps.length > 0) {
			console.warn(
				`[supabase-config-loader] Missing properties: ${missingProps.join(", ")}. Using fallback values.`,
			);
			// Merge with fallback for missing properties
			const mergedConfig = { ...FALLBACK_CONFIG, ...config } as SupabaseConfig;
			configCache = { config: mergedConfig, timestamp: now };
			return mergedConfig;
		}

		// Extract ports from URLs for convenience
		const apiPort = extractPort(config.API_URL as string);
		const dbPort = extractPort(config.DB_URL as string);
		const studioPort = config.STUDIO_URL
			? extractPort(config.STUDIO_URL as string)
			: 54523;

		const enrichedConfig: SupabaseConfig = {
			API_URL: config.API_URL as string,
			ANON_KEY: config.ANON_KEY as string,
			SERVICE_ROLE_KEY: config.SERVICE_ROLE_KEY as string,
			DB_URL: config.DB_URL as string,
			STUDIO_URL: config.STUDIO_URL as string,
			ports: {
				api: apiPort,
				db: dbPort,
				studio: studioPort,
			},
		};

		// Update cache
		configCache = { config: enrichedConfig, timestamp: now };

		console.log(
			`[supabase-config-loader] Loaded config - API: ${enrichedConfig.API_URL}, DB port: ${dbPort}`,
		);
		return enrichedConfig;
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.warn(
			`[supabase-config-loader] Failed to fetch config: ${errorMessage}. Using fallback values.`,
		);
		return FALLBACK_CONFIG;
	}
}

/**
 * Clears the configuration cache.
 * Useful for tests or when you need fresh config after Supabase restart.
 */
export function clearConfigCache(): void {
	configCache = { config: null, timestamp: 0 };
}

/**
 * Returns the fallback configuration.
 * Useful for testing or explicit fallback scenarios.
 */
export function getFallbackConfig(): SupabaseConfig {
	return { ...FALLBACK_CONFIG };
}
