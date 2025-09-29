/**
 * Environment-aware test configuration utility
 * Provides centralized configuration management for different environments
 */

export interface TestEnvironment {
	name: "CI" | "LOCAL" | "DEV" | "STAGING";
	isCI: boolean;
	skipEmailVerification: boolean;
	enableVerboseLogging: boolean;
	credentialValidation: "STRICT" | "LENIENT";
	retryStrategy: {
		maxRetries: number;
		baseDelay: number;
		timeouts: {
			short: number;
			medium: number;
			long: number;
		};
	};
}

export class TestConfigManager {
	private static instance: TestConfigManager;
	private config: TestEnvironment;

	private constructor() {
		this.config = this.detectEnvironment();
	}

	static getInstance(): TestConfigManager {
		if (!TestConfigManager.instance) {
			TestConfigManager.instance = new TestConfigManager();
		}
		return TestConfigManager.instance;
	}

	getConfig(): TestEnvironment {
		return this.config;
	}

	private detectEnvironment(): TestEnvironment {
		const isCI = process.env.CI === "true";
		const isDev =
			process.env.NODE_ENV === "development" ||
			process.env.PLAYWRIGHT_BASE_URL?.includes("dev.");
		const isStaging = process.env.PLAYWRIGHT_BASE_URL?.includes("staging.");

		// Determine environment name
		let name: TestEnvironment["name"];
		if (isCI) {
			name = "CI";
		} else if (isStaging) {
			name = "STAGING";
		} else if (isDev) {
			name = "DEV";
		} else {
			name = "LOCAL";
		}

		// Configure based on environment
		const baseConfig: TestEnvironment = {
			name,
			isCI,
			skipEmailVerification:
				isCI || process.env.SKIP_EMAIL_VERIFICATION === "true",
			enableVerboseLogging: process.env.E2E_VERBOSE_CREDENTIALS === "true",
			credentialValidation: isCI ? "STRICT" : "LENIENT",
			retryStrategy: {
				maxRetries: isCI ? 3 : 2,
				baseDelay: isCI ? 2000 : 1000,
				timeouts: {
					short: isCI ? 15000 : 10000,
					medium: isCI ? 45000 : 20000, // Increased from 30s to 45s for CI
					long: isCI ? 90000 : 45000, // Increased from 60s to 90s for CI
				},
			},
		};

		console.log("🔧 Test Environment Configuration:");
		console.log(`   Environment: ${name}`);
		console.log(`   CI Mode: ${isCI}`);
		console.log(
			`   Skip Email Verification: ${baseConfig.skipEmailVerification}`,
		);
		console.log(`   Credential Validation: ${baseConfig.credentialValidation}`);
		console.log(`   Max Retries: ${baseConfig.retryStrategy.maxRetries}`);

		return baseConfig;
	}

	/**
	 * Get retry intervals based on environment and operation type
	 */
	getRetryIntervals(type: "auth" | "navigation" | "api" = "auth"): number[] {
		const config = this.config;
		const { baseDelay, maxRetries } = config.retryStrategy;

		switch (type) {
			case "auth":
				// Authentication operations need more time in CI
				if (config.isCI) {
					return [500, 1000, 2500, 5000, 8000, 12000].slice(0, maxRetries + 2);
				}
				return [500, 1500, 3000, 6000].slice(0, maxRetries + 1);

			case "navigation":
				// Page navigation retries
				if (config.isCI) {
					return [baseDelay, baseDelay * 2, baseDelay * 4].slice(0, maxRetries);
				}
				return [baseDelay, baseDelay * 2].slice(0, maxRetries);

			case "api":
				// API call retries
				return Array(maxRetries)
					.fill(0)
					.map((_, i) => baseDelay * 2 ** i);

			default:
				return [baseDelay];
		}
	}

	/**
	 * Get timeout based on environment and operation type
	 */
	getTimeout(type: "short" | "medium" | "long" = "medium"): number {
		return this.config.retryStrategy.timeouts[type];
	}

	/**
	 * Check if we should skip a test based on environment constraints
	 */
	shouldSkipTest(
		testType: "billing" | "team" | "admin" | "mfa" | "email",
	): boolean {
		const config = this.config;

		// Skip certain tests in CI if credentials/environment not available
		if (config.isCI) {
			switch (testType) {
				case "billing":
					return process.env.ENABLE_BILLING_TESTS !== "true";
				case "team":
					return process.env.ENABLE_TEAM_ACCOUNT_TESTS !== "true";
				case "email":
					return config.skipEmailVerification;
				default:
					return false;
			}
		}

		return false;
	}

	/**
	 * Get environment-specific base URL with fallbacks
	 */
	getBaseUrl(): string {
		return (
			process.env.PLAYWRIGHT_BASE_URL ||
			process.env.BASE_URL ||
			process.env.TEST_BASE_URL ||
			"http://localhost:3000"
		);
	}

	/**
	 * Log environment information for debugging
	 */
	logEnvironmentInfo(): void {
		const config = this.config;
		const baseUrl = this.getBaseUrl();

		console.log("\n🌍 Test Environment Information:");
		console.log(`   Environment: ${config.name}`);
		console.log(`   Base URL: ${baseUrl}`);
		console.log(`   CI Mode: ${config.isCI}`);
		console.log(`   Skip Email Verification: ${config.skipEmailVerification}`);
		console.log(`   Verbose Logging: ${config.enableVerboseLogging}`);
		console.log(`   Credential Validation: ${config.credentialValidation}`);
		console.log(`   Auth Timeout: ${config.retryStrategy.timeouts.medium}ms`);
		console.log(`   Max Retries: ${config.retryStrategy.maxRetries}\n`);
	}
}

// Convenience export for easy access
export const testConfig = TestConfigManager.getInstance();
