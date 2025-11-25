/**
 * Supabase Config Loader
 *
 * Dynamically fetches Supabase configuration from `npx supabase status --output json`.
 * Provides fallback to hardcoded demo values if the CLI is unavailable.
 *
 * @module supabase-config-loader
 */

const { execSync } = require("node:child_process");
const path = require("node:path");

/**
 * Default fallback values (demo keys)
 * Used when Supabase CLI is unavailable or returns invalid output
 */
const FALLBACK_CONFIG = {
	API_URL: "http://127.0.0.1:54321",
	ANON_KEY:
		"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0",
	SERVICE_ROLE_KEY:
		"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU",
	DB_URL: "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
	STUDIO_URL: "http://127.0.0.1:54323",
};

/**
 * Cache for Supabase config to avoid repeated shell executions
 * @type {{ config: Object | null, timestamp: number }}
 */
let configCache = {
	config: null,
	timestamp: 0,
};

/**
 * Cache duration in milliseconds (5 minutes)
 */
const CACHE_DURATION_MS = 5 * 60 * 1000;

/**
 * Fetches Supabase configuration dynamically from the CLI.
 *
 * @param {Object} options - Configuration options
 * @param {string} [options.cwd] - Working directory for the supabase command
 * @param {boolean} [options.useCache=true] - Whether to use cached config
 * @param {number} [options.timeout=10000] - Command timeout in milliseconds
 * @returns {Object} Supabase configuration with API_URL, ANON_KEY, SERVICE_ROLE_KEY, DB_URL
 */
function getSupabaseConfig(options = {}) {
	const {
		cwd = path.join(process.cwd(), "apps/web"),
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

		const config = JSON.parse(output.trim());

		// Validate required properties
		const requiredProps = ["API_URL", "ANON_KEY", "SERVICE_ROLE_KEY", "DB_URL"];
		const missingProps = requiredProps.filter((prop) => !config[prop]);

		if (missingProps.length > 0) {
			logWarning(
				`Supabase config missing properties: ${missingProps.join(", ")}. Using fallback values.`,
			);
			// Merge with fallback for missing properties
			const mergedConfig = { ...FALLBACK_CONFIG, ...config };
			configCache = { config: mergedConfig, timestamp: now };
			return mergedConfig;
		}

		// Extract ports from URLs for convenience
		const apiPort = extractPort(config.API_URL);
		const dbPort = extractPort(config.DB_URL);
		const studioPort = config.STUDIO_URL
			? extractPort(config.STUDIO_URL)
			: 54323;

		const enrichedConfig = {
			...config,
			ports: {
				api: apiPort,
				db: dbPort,
				studio: studioPort,
			},
		};

		// Update cache
		configCache = { config: enrichedConfig, timestamp: now };

		logInfo(
			`Loaded Supabase config - API: ${config.API_URL}, DB port: ${dbPort}`,
		);
		return enrichedConfig;
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		logWarning(
			`Failed to fetch Supabase config: ${errorMessage}. Using fallback values.`,
		);
		return FALLBACK_CONFIG;
	}
}

/**
 * Extracts port number from a URL string
 *
 * @param {string} url - URL to extract port from
 * @returns {number} Port number, defaults to 80 for http or 443 for https
 */
function extractPort(url) {
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
 * Clears the configuration cache.
 * Useful for tests or when you need fresh config after Supabase restart.
 */
function clearConfigCache() {
	configCache = { config: null, timestamp: 0 };
}

/**
 * Returns the fallback configuration.
 * Useful for testing or explicit fallback scenarios.
 *
 * @returns {Object} Fallback Supabase configuration
 */
function getFallbackConfig() {
	return { ...FALLBACK_CONFIG };
}

// Simple logging utilities
function logInfo(message) {
	const timestamp = new Date().toISOString();
	process.stdout.write(`[${timestamp}] INFO: ${message}\n`);
}

function logWarning(message) {
	const timestamp = new Date().toISOString();
	process.stderr.write(`[${timestamp}] WARN: ${message}\n`);
}

module.exports = {
	getSupabaseConfig,
	clearConfigCache,
	getFallbackConfig,
	extractPort,
	FALLBACK_CONFIG,
};
