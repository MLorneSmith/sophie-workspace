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
		shardTimeout: 30 * 60 * 1000, // 30 minutes per shard
		fileTimeout: 3 * 60 * 1000, // 3 minutes per test file
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
			api: 55321,
			db: 55322,
			studio: 55323,
			inbucket: 55324,
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
		maxConcurrentShards: process.env.TEST_MAX_CONCURRENT_SHARDS
			? parseInt(process.env.TEST_MAX_CONCURRENT_SHARDS)
			: os.cpus().length > 4
				? 4
				: 2, // Limit to 4 shards max, or 2 for smaller machines

		// Test retry settings
		maxTestRetries: 2,
		retryFailedTests: true,

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

	// Environment variables for test execution
	environment: {
		NODE_ENV: "test",
		NEXT_PUBLIC_APP_URL: "http://localhost:3001",
		SUPABASE_URL: "http://localhost:55321",
		SUPABASE_SERVICE_ROLE_KEY:
			process.env.SUPABASE_SERVICE_ROLE_KEY || "test-service-key",
		TURBO_FORCE: "true", // Always bypass cache for comprehensive testing
		CI: process.env.CI || "false",
	},

	// Database configuration
	database: {
		connectionString:
			process.env.DATABASE_URL ||
			"postgresql://postgres:postgres@localhost:55322/postgres",
		maxConnections: 20,
		testUserEmail: "test@example.com",
		testUserPassword: "testpassword123",
		seedScript: path.join(PROJECT_ROOT, "supabase/seed.sql"),
	},

	// Commands
	commands: {
		// Package manager
		packageManager: "pnpm",

		// Test commands
		unitTest: ["pnpm", "test:unit", "--force"],
		e2eTest: ["pnpm", "--filter", "web-e2e", "test:e2e"],

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
