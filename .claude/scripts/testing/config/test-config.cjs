/**
 * Test Configuration Module
 * Centralized configuration for all test modules
 */

const path = require("node:path");
const os = require("node:os");

// Get project root
const PROJECT_ROOT = process.cwd();

// Configuration object
const CONFIG = {
	// File paths
	paths: {
		projectRoot: PROJECT_ROOT,
		statusFile: `/tmp/.claude_test_status_${PROJECT_ROOT.replace(/\//g, "_")}`,
		resultFile: "/tmp/.claude_test_results.json",
		lockFile: "/tmp/.test-resource-lock",
		cleanupGuardFile: "/tmp/.test-cleanup-guard",
		cacheDir: path.join(PROJECT_ROOT, ".test-cache"),
		testReports: path.join(PROJECT_ROOT, "test-results"),
		coverageDir: path.join(PROJECT_ROOT, "coverage"),
	},

	// Timeouts (all in milliseconds)
	timeouts: {
		// Phase timeouts
		initialization: 30000, // 30 seconds
		infrastructureCheck: 60000, // 1 minute
		supabaseSetup: 120000, // 2 minutes
		unitTests: 15 * 60 * 1000, // 15 minutes
		e2eSetup: 60000, // 1 minute
		e2eTests: 45 * 60 * 1000, // 45 minutes
		shardTimeout: 5 * 60 * 1000, // 5 minutes per shard
		fileTimeout: 2 * 60 * 1000, // 2 minutes per test file
		cleanup: 30000, // 30 seconds
		reporting: 30000, // 30 seconds

		// Operation timeouts
		portWait: 30000, // 30 seconds
		processWait: 30000, // 30 seconds
		httpWait: 30000, // 30 seconds
		databaseWait: 60000, // 1 minute

		// Retry delays
		retryDelay: 1000, // 1 second
		stabilizationDelay: 2000, // 2 seconds
	},

	// Port configuration
	ports: {
		supabase: {
			api: 54321, // Updated to unified Web Supabase port
			db: 54322, // Updated to unified Web Supabase DB port
			studio: 54323,
			inbucket: 54324,
		},
		web: 3000,
		webTest: 3001,
		payload: 3020,
		testRangeStart: 3000,
		testRangeEnd: 3020,
	},

	// Test execution settings
	execution: {
		// Override with env var TEST_MAX_CONCURRENT_SHARDS if set
		// IMPORTANT: Set to 1 to disable parallel E2E test execution
		// The local infrastructure cannot handle parallel E2E tests
		maxConcurrentShards: process.env.TEST_MAX_CONCURRENT_SHARDS
			? parseInt(process.env.TEST_MAX_CONCURRENT_SHARDS)
			: 1, // Force sequential execution - parallel E2E tests cause system instability

		// Test retry settings
		maxTestRetries: 1,
		retryFailedTests: true,
		continueOnFailure: true, // Continue running tests even if some fail
		continueOnTimeout: true, // Continue running tests even if some timeout

		// Cache settings
		useCache: process.env.TEST_USE_CACHE !== "false",
		forceFresh: process.env.TURBO_FORCE === "true",

		// Debugging
		verbose: process.env.TEST_VERBOSE === "true",
		debug: process.env.TEST_DEBUG === "true",
		keepAlive: process.env.TEST_KEEP_ALIVE === "true",

		// Coverage
		collectCoverage: process.env.TEST_COVERAGE === "true",
		coverageThreshold: {
			global: {
				branches: 60,
				functions: 60,
				lines: 60,
				statements: 60,
			},
		},
	},

	// Output control settings (prevents Claude Code crashes from buffer overflow)
	output: {
		// Output mode: 'full', 'summary', 'quiet', 'file'
		mode: process.env.TEST_OUTPUT_MODE || "summary", // Default to summary to prevent crashes

		// Stream control
		streaming: {
			enabled: true, // Enable real-time streaming
			maxBufferSize: 50 * 1024, // 50KB buffer limit per stream
			flushInterval: 100, // Flush every 100ms
			lineBufferSize: 1000, // Keep last 1000 lines in memory
		},

		// Output filtering
		filter: {
			// Show only critical output in summary mode
			showProgress: true, // Show test progress
			showPassed: false, // Hide passed tests in summary mode
			showFailed: true, // Always show failures
			showSkipped: false, // Hide skipped tests
			showErrors: true, // Always show errors
			showWarnings: true, // Show warnings
			showTimings: true, // Show timing information
			showCoverage: true, // Show coverage summary
		},

		// File output (when mode is 'file' or for backups)
		file: {
			enabled: process.env.TEST_OUTPUT_FILE !== "false", // Always log to file by default
			path: process.env.TEST_OUTPUT_FILE || "/tmp/test-output.log",
			maxSize: 10 * 1024 * 1024, // 10MB max file size
			rotation: true, // Rotate when max size reached
			keepBackups: 3, // Keep last 3 backup files
		},

		// Performance metrics
		metrics: {
			trackMemory: true, // Track memory usage
			trackCpu: false, // Don't track CPU by default (expensive)
			warnThreshold: 100 * 1024 * 1024, // Warn if memory exceeds 100MB
			errorThreshold: 200 * 1024 * 1024, // Error if memory exceeds 200MB
		},

		// Console output limits
		console: {
			maxLinesPerTest: 10, // Max lines per test in summary mode
			maxTotalLines: 300, // HARD max total lines in summary mode (prevents Claude Code crash)
			truncateAt: 200, // Truncate long lines at 200 chars
			showEllipsis: true, // Show ... when truncating
		},
	},

	// Environment variables for test execution
	environment: {
		NODE_ENV: "test",
		NEXT_PUBLIC_APP_URL: process.env.TEST_BASE_URL || "http://localhost:3001",
		SUPABASE_URL: "http://localhost:54321", // Updated to unified Web Supabase port
		SUPABASE_SERVICE_ROLE_KEY:
			process.env.SUPABASE_SERVICE_ROLE_KEY ||
			"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU", // Standard local dev key
		TURBO_FORCE: "true", // Always bypass cache for comprehensive testing
		CI: process.env.CI || "false",
		// Use Docker container if available
		TEST_BASE_URL: process.env.TEST_BASE_URL || "http://localhost:3001",
	},

	// Database configuration
	database: {
		connectionString:
			process.env.DATABASE_URL ||
			"postgresql://postgres:postgres@localhost:54322/postgres", // Updated to unified Web Supabase DB port
		maxConnections: 20,
		testUserEmail: process.env.E2E_TEST_USER_EMAIL || "test1@slideheroes.com", // Use environment variable
		testUserPassword: process.env.E2E_TEST_USER_PASSWORD, // Use environment variable, no fallback for security
		ownerEmail: process.env.E2E_OWNER_EMAIL || "test1@slideheroes.com", // Use environment variable
		ownerPassword: process.env.E2E_OWNER_PASSWORD, // Use environment variable
		adminEmail: process.env.E2E_ADMIN_EMAIL || "michael@slideheroes.com", // Use environment variable
		adminPassword: process.env.E2E_ADMIN_PASSWORD, // Use environment variable
		seedScript: path.join(
			PROJECT_ROOT,
			"apps/web/supabase/seeds/01_main_seed.sql",
		), // Updated to Web seed location
	},

	// Commands
	commands: {
		// Package manager
		packageManager: "pnpm",

		// Test commands
		unitTest: ["pnpm", "test:unit"],
		unitTestCoverage: ["pnpm", "test:coverage"],
		e2eTest: ["pnpm", "--filter", "web-e2e", "test"],

		// Server commands
		startWeb: ["pnpm", "--filter", "web", "dev:test"],
		startSupabase: ["npx", "supabase", "start"],
		stopSupabase: ["npx", "supabase", "stop"],

		// Utility commands
		checkPort: (port) => `lsof -ti:${port} 2>/dev/null || echo "free"`,
		killPort: (port) => `lsof -ti:${port} | xargs kill -9 2>/dev/null || true`,
		killProcess: (pattern) => `pkill -f "${pattern}" || true`,
		checkProcess: (pattern) => `pgrep -f "${pattern}" 2>/dev/null`,
	},

	// Test file patterns
	patterns: {
		unitTests: [
			"**/*.test.ts",
			"**/*.test.tsx",
			"**/*.spec.ts",
			"**/*.spec.tsx",
		],
		e2eTests: [
			"apps/web-e2e/tests/**/*.spec.ts",
			"apps/web-e2e/tests/**/*.test.ts",
		],
		ignorePatterns: [
			"**/node_modules/**",
			"**/dist/**",
			"**/build/**",
			"**/.next/**",
			"**/.turbo/**",
		],
	},

	// Reporting configuration
	reporting: {
		formats: ["console", "json", "html"],
		outputDir: path.join(PROJECT_ROOT, "test-reports"),
		includePassedTests: false,
		includeSkippedTests: true,
		generateSummary: true,
		timestamps: true,
		// Shard reporting configuration for E2E tests
		generateShardReports: process.env.E2E_SHARD_REPORTS !== "false", // Default true, disable with E2E_SHARD_REPORTS=false
		shardReportDir: path.join(PROJECT_ROOT, "reports", "testing"),
		retentionDays: 30,
		includeRawOutput: true,
		maxOutputSize: 5120, // 5KB of raw output per report
	},

	// Cleanup settings
	cleanup: {
		killProcesses: true,
		clearPorts: true,
		removeTempFiles: true,
		stopServices: true,
		processPatterns: [
			"node",
			"playwright",
			"vitest",
			"next",
			"supabase",
			"postgres",
		],
		tempPaths: ["/tmp/.claude_test_*", "/tmp/.test-*"],
	},
};

/**
 * Get configuration value by path
 * @param {string} path - Dot-separated path to config value
 * @param {any} defaultValue - Default value if path not found
 * @returns {any} - Configuration value
 */
function getConfig(path, defaultValue = undefined) {
	const keys = path.split(".");
	let value = CONFIG;

	for (const key of keys) {
		if (value && typeof value === "object" && key in value) {
			value = value[key];
		} else {
			return defaultValue;
		}
	}

	return value;
}

/**
 * Override configuration values
 * @param {Object} overrides - Configuration overrides
 */
function overrideConfig(overrides) {
	deepMerge(CONFIG, overrides);
}

/**
 * Deep merge helper
 */
function deepMerge(target, source) {
	for (const key in source) {
		if (Object.hasOwn(source, key)) {
			if (
				typeof source[key] === "object" &&
				source[key] !== null &&
				!Array.isArray(source[key])
			) {
				if (!target[key]) {
					target[key] = {};
				}
				deepMerge(target[key], source[key]);
			} else {
				target[key] = source[key];
			}
		}
	}
}

/**
 * Get environment-specific configuration
 */
function getEnvironmentConfig() {
	const env = process.env.NODE_ENV || "development";

	const envConfigs = {
		test: {
			execution: {
				forceFresh: true,
				useCache: false,
			},
		},
		ci: {
			execution: {
				maxConcurrentShards: 2,
				keepAlive: false,
			},
			timeouts: {
				unitTests: 20 * 60 * 1000, // 20 minutes in CI
				e2eTests: 60 * 60 * 1000, // 60 minutes in CI
			},
		},
		development: {
			execution: {
				verbose: true,
				debug: true,
			},
		},
	};

	if (process.env.CI === "true") {
		deepMerge(CONFIG, envConfigs.ci);
	} else if (envConfigs[env]) {
		deepMerge(CONFIG, envConfigs[env]);
	}

	return CONFIG;
}

/**
 * Validate configuration
 */
function validateConfig() {
	const errors = [];

	// Check required paths exist
	const fs = require("node:fs");
	if (!fs.existsSync(CONFIG.paths.projectRoot)) {
		errors.push(`Project root does not exist: ${CONFIG.paths.projectRoot}`);
	}

	// Validate port ranges
	if (CONFIG.ports.testRangeStart >= CONFIG.ports.testRangeEnd) {
		errors.push("Invalid port range configuration");
	}

	// Validate timeouts
	for (const [key, value] of Object.entries(CONFIG.timeouts)) {
		if (typeof value !== "number" || value <= 0) {
			errors.push(`Invalid timeout value for ${key}: ${value}`);
		}
	}

	if (errors.length > 0) {
		throw new Error(`Configuration validation failed:\n${errors.join("\n")}`);
	}

	return true;
}

module.exports = {
	CONFIG: getEnvironmentConfig(),
	getConfig,
	overrideConfig,
	validateConfig,
};
