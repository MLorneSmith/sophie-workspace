/**
 * Infrastructure Manager Module
 * Handles infrastructure validation, setup, and health checks
 */

const { exec } = require("node:child_process");
const fs = require("node:fs").promises;
const path = require("node:path");
const { promisify } = require("node:util");
const execAsync = promisify(exec);
const { ConditionWaiter } = require("../utils/condition-waiter.cjs");

// Simple logging utility
function log(message, type = "info") {
	const timestamp = new Date().toISOString();
	process.stdout.write(`[${timestamp}] ${type.toUpperCase()}: ${message}\n`);
}

function logError(message) {
	log(message, "error");
}

class InfrastructureManager {
	constructor(config, testStatus) {
		this.config = config;
		this.testStatus = testStatus;
		this.waiter = new ConditionWaiter();
	}

	/**
	 * Main infrastructure check and setup
	 */
	async checkAll() {
		log("🔍 Running smart pre-flight infrastructure validation...");

		// Phase 1: Quick health checks (< 2 seconds)
		const healthResults = await this.runHealthChecks();

		// Phase 2: Only run startup procedures if health checks fail
		const results = await this.runConditionalSetup(healthResults);

		return results;
	}

	/**
	 * Fast health checks to determine if infrastructure is already running correctly
	 */
	async runHealthChecks() {
		log("⚡ Running fast health checks...");
		const results = {
			supabase: await this.healthCheckSupabase(),
			environment: await this.healthCheckEnvironment(),
			database: await this.healthCheckDatabase(),
			testUsers: await this.healthCheckTestUsers(),
			build: await this.healthCheckBuild(),
			dependencies: await this.healthCheckDependencies(),
		};

		const healthyCount = Object.values(results).filter(
			(r) => r === "healthy",
		).length;
		const totalChecks = Object.keys(results).length;

		if (healthyCount === totalChecks) {
			log(
				`✅ All infrastructure healthy (${healthyCount}/${totalChecks}) - skipping setup`,
			);
		} else {
			log(
				`⚠️ Infrastructure needs setup (${healthyCount}/${totalChecks} healthy)`,
			);
		}

		return results;
	}

	/**
	 * Conditionally run setup procedures only for unhealthy services
	 */
	async runConditionalSetup(healthResults) {
		const setupResults = { ...healthResults };
		let needsVerification = false;

		// Only fix services that failed health checks
		if (healthResults.supabase !== "healthy") {
			log("🚀 Setting up Supabase...");
			setupResults.supabase = await this.setupSupabase();
			needsVerification = true;
		}

		if (healthResults.environment !== "healthy") {
			log("🔧 Setting up environment...");
			setupResults.environment = await this.setupEnvironment();
			needsVerification = true;
		}

		if (healthResults.database !== "healthy") {
			log("🗄️ Setting up database...");
			setupResults.database = await this.setupDatabase();
			needsVerification = true;
		}

		if (healthResults.testUsers !== "healthy") {
			log("👤 Setting up test users...");
			setupResults.testUsers = await this.setupTestUsers();
			needsVerification = true;
		}

		// Always clean ports as this is lightweight and prevents conflicts
		setupResults.ports = await this.cleanupPorts();

		// Re-verify health after setup
		if (needsVerification) {
			log("\n🔍 Verifying infrastructure after setup...");
			const verificationResults = await this.runHealthChecks();

			const criticalServices = [
				"supabase",
				"environment",
				"database",
				"testUsers",
			];
			const allHealthy = criticalServices.every(
				(service) => verificationResults[service] === "healthy",
			);

			if (!allHealthy) {
				logError("⚠️ Some services failed to start properly:");
				for (const service of criticalServices) {
					if (verificationResults[service] !== "healthy") {
						logError(`  ❌ ${service}: ${verificationResults[service]}`);
					}
				}
			}

			// Merge verification results
			Object.assign(setupResults, verificationResults);
		}

		return setupResults;
	}

	/**
	 * Health check for Supabase
	 */
	async healthCheckSupabase() {
		try {
			// First check if database is responding on E2E port
			const response = await fetch(
				`http://127.0.0.1:${this.config.ports.supabase.api}/rest/v1/`,
				{
					signal: AbortSignal.timeout(2000),
					headers: {
						apikey:
							"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0",
					},
				},
			);

			// 200 means API is running, 401 means auth is required but API is responsive
			if (response.status === 200 || response.status === 401) {
				// Also check if we can get status (non-critical if it fails)
				try {
					const { stdout } = await execAsync(
						"cd apps/e2e && npx supabase status 2>&1 | head -1",
						{ timeout: 2000 },
					);
					if (stdout.includes("running")) {
						return "healthy";
					}
				} catch {
					// CLI check failed but API is responsive
				}
				return "healthy";
			}

			return "not_running";
		} catch {
			return "not_running";
		}
	}

	/**
	 * Health check for environment
	 */
	async healthCheckEnvironment() {
		try {
			const envPath = path.join(process.cwd(), "apps/web/.env.test");
			await fs.access(envPath);

			// Quick validation of critical env vars
			const content = await fs.readFile(envPath, "utf8");
			const requiredVars = [
				"NEXT_PUBLIC_AUTH_PASSWORD",
				"NEXT_PUBLIC_PRODUCT_NAME",
			];
			const hasRequired = requiredVars.every((v) => content.includes(v));

			if (hasRequired) {
				return "healthy";
			}

			return "missing";
		} catch {
			return "missing";
		}
	}

	/**
	 * Health check for database connection
	 */
	async healthCheckDatabase() {
		try {
			// Quick connectivity test to Supabase E2E instance (same as original)
			const response = await fetch(
				`http://127.0.0.1:${this.config.ports.supabase.api}/rest/v1/`,
				{
					signal: AbortSignal.timeout(2000),
					headers: {
						apikey:
							"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0",
					},
				},
			);

			if (response.status === 401 || response.status === 200) {
				// 401 is expected without proper auth, means DB is responding
				return "healthy";
			}

			return "connection_failed";
		} catch (error) {
			return "not_accessible";
		}
	}

	/**
	 * Health check for test users
	 */
	async healthCheckTestUsers() {
		try {
			// Query the onboarding table which has entries for our test users (same as original)
			const response = await fetch(
				`http://127.0.0.1:${this.config.ports.supabase.api}/rest/v1/onboarding?select=user_id`,
				{
					signal: AbortSignal.timeout(3000),
					headers: {
						apikey:
							"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU",
						Authorization:
							"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU",
						"Content-Type": "application/json",
					},
				},
			);

			if (response.status === 200) {
				const onboardingRecords = await response.json();
				const expectedUserIds = [
					"f47ac10b-58cc-4372-a567-0e02b2c3d479", // test2@slideheroes.com
					"31a03e74-1639-45b6-bfa7-77447f1a4762", // test1@slideheroes.com
					"5c064f1b-78ee-4e1c-ac3b-e99aa97c99bf", // michael@slideheroes.com
				];

				const foundUserIds = onboardingRecords.map((r) => r.user_id);
				const missingUsers = expectedUserIds.filter(
					(id) => !foundUserIds.includes(id),
				);

				if (missingUsers.length === 0) {
					return "healthy";
				}
				return "missing";
			}
			return "cannot_check";
		} catch {
			return "cannot_check";
		}
	}

	/**
	 * Health check for build
	 */
	async healthCheckBuild() {
		try {
			const buildPath = path.join(process.cwd(), "apps/web/.next");
			await fs.access(buildPath);

			// Check if build is recent
			const stats = await fs.stat(buildPath);
			const hoursSinceModified =
				(Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60);

			if (hoursSinceModified < 24) {
				return "healthy";
			}
			return "stale";
		} catch {
			return "missing";
		}
	}

	/**
	 * Health check for dependencies
	 */
	async healthCheckDependencies() {
		try {
			const nodeModulesPath = path.join(process.cwd(), "node_modules");
			const packageLockPath = path.join(process.cwd(), "pnpm-lock.yaml");

			await fs.access(nodeModulesPath);
			const lockStats = await fs.stat(packageLockPath);
			const nodeStats = await fs.stat(nodeModulesPath);

			if (nodeStats.mtime >= lockStats.mtime) {
				return "healthy";
			}
			return "outdated";
		} catch {
			return "missing";
		}
	}

	/**
	 * Setup Supabase
	 */
	async setupSupabase() {
		try {
			// First check if Supabase is running
			const status = await this.healthCheckSupabase();

			if (status === "not_running") {
				log("Starting Supabase...");
				const proc = exec("npx supabase start");

				// Wait for Supabase to be ready using ConditionWaiter
				await this.waiter.waitForSupabase({
					timeout: 120000,
					name: "Supabase startup",
				});

				return "started";
			} else if (status === "needs_restart") {
				log("Restarting Supabase...");
				await execAsync("npx supabase stop");
				await this.waiter.delay(3000, "Supabase shutdown");

				const proc = exec("npx supabase start");
				await this.waiter.waitForSupabase({
					timeout: 120000,
					name: "Supabase restart",
				});

				return "restarted";
			}

			return "already_running";
		} catch (error) {
			logError(`Failed to setup Supabase: ${error.message}`);
			return "failed";
		}
	}

	/**
	 * Setup environment variables
	 */
	async setupEnvironment() {
		try {
			// Load environment variables from .env file
			const envPath = path.join(process.cwd(), "apps/web/.env");

			try {
				const envContent = await fs.readFile(envPath, "utf-8");
				const lines = envContent.split("\n");

				for (const line of lines) {
					const trimmed = line.trim();
					if (trimmed && !trimmed.startsWith("#")) {
						const [key, ...valueParts] = trimmed.split("=");
						if (key) {
							process.env[key.trim()] = valueParts.join("=").trim();
						}
					}
				}

				return "loaded";
			} catch {
				// Create default .env file
				log("Creating default .env file...");
				const defaultEnv = `
NEXT_PUBLIC_APP_URL=http://localhost:3000
SUPABASE_URL=http://localhost:55321
SUPABASE_ANON_KEY=test-anon-key
SUPABASE_SERVICE_ROLE_KEY=test-service-key
DATABASE_URL=postgresql://postgres:postgres@localhost:55322/postgres
				`.trim();

				await fs.writeFile(envPath, defaultEnv);

				// Set environment variables
				for (const line of defaultEnv.split("\n")) {
					const [key, value] = line.split("=");
					if (key && value) {
						process.env[key.trim()] = value.trim();
					}
				}

				return "created";
			}
		} catch (error) {
			logError(`Failed to setup environment: ${error.message}`);
			return "failed";
		}
	}

	/**
	 * Setup database
	 */
	async setupDatabase() {
		try {
			// Wait for Supabase API to be accessible
			const apiUrl =
				this.config.environment.SUPABASE_URL ||
				`http://localhost:${this.config.ports.supabase.api}`;
			await this.waiter.waitForHttp(apiUrl, {
				timeout: 60000,
				name: "Supabase API",
			});

			// Run migrations if needed
			try {
				await execAsync("npx supabase db push");
				log("✅ Database migrations applied");
			} catch {
				log("⚠️ Migrations may already be applied");
			}

			return "ready";
		} catch (error) {
			logError(`Failed to setup database: ${error.message}`);
			return "failed";
		}
	}

	/**
	 * Setup test users
	 */
	async setupTestUsers() {
		try {
			// Skip test user creation - tests should handle their own auth
			log("⚠️ Test user creation skipped - tests will handle auth");
			return "skipped";
		} catch (error) {
			logError(`Failed to setup test users: ${error.message}`);
			return "failed";
		}
	}

	/**
	 * Cleanup ports
	 */
	async cleanupPorts() {
		try {
			log("🧹 Cleaning up test ports...");

			const portsToClean = [
				this.config.ports.web,
				this.config.ports.webTest,
				this.config.ports.payload,
			];

			for (const port of portsToClean) {
				try {
					const { stdout } = await execAsync(
						`lsof -ti:${port} 2>/dev/null || echo "free"`,
					);
					if (stdout.trim() !== "free") {
						await execAsync(
							`lsof -ti:${port} | xargs kill -9 2>/dev/null || true`,
						);
						log(`  ✅ Cleared port ${port}`);
					}
				} catch {
					// Port already free
				}
			}

			return "cleaned";
		} catch (error) {
			logError(`Failed to cleanup ports: ${error.message}`);
			return "failed";
		}
	}

	/**
	 * Generate diagnostics report
	 */
	async generateDiagnostics() {
		const diagnostics = {
			timestamp: new Date().toISOString(),
			platform: process.platform,
			nodeVersion: process.version,
			cwd: process.cwd(),
			environment: {
				NODE_ENV: process.env.NODE_ENV,
				CI: process.env.CI,
			},
			services: {},
			recommendations: [],
		};

		// Check each service
		diagnostics.services.supabase = await this.healthCheckSupabase();
		diagnostics.services.database = await this.healthCheckDatabase();
		diagnostics.services.environment = await this.healthCheckEnvironment();
		diagnostics.services.testUsers = await this.healthCheckTestUsers();
		diagnostics.services.build = await this.healthCheckBuild();
		diagnostics.services.dependencies = await this.healthCheckDependencies();

		// Generate recommendations
		diagnostics.recommendations = await this.generateRecommendations(
			diagnostics.services,
		);

		return diagnostics;
	}

	/**
	 * Generate recommendations based on diagnostics
	 */
	async generateRecommendations(services) {
		const recommendations = [];

		if (services.supabase !== "healthy") {
			recommendations.push({
				issue: "Supabase is not running",
				command: "npx supabase start",
				severity: "critical",
			});
		}

		if (services.database !== "healthy") {
			recommendations.push({
				issue: "Database connection failed",
				command: "npx supabase db reset",
				severity: "critical",
			});
		}

		if (services.environment !== "healthy") {
			recommendations.push({
				issue: "Environment variables missing",
				command: "cp apps/web/.env.example apps/web/.env",
				severity: "warning",
			});
		}

		if (services.dependencies !== "healthy") {
			recommendations.push({
				issue: "Dependencies outdated",
				command: "pnpm install",
				severity: "warning",
			});
		}

		if (services.build === "missing") {
			recommendations.push({
				issue: "No Next.js build found",
				command: "pnpm --filter web build",
				severity: "info",
			});
		}

		return recommendations;
	}

	/**
	 * Helper to check if file exists
	 */
	async fileExists(filepath) {
		try {
			await fs.access(filepath);
			return true;
		} catch {
			return false;
		}
	}

	/**
	 * Kill all test-related processes
	 */
	async killAllProcesses() {
		const patterns = this.config.cleanup.processPatterns;

		for (const pattern of patterns) {
			try {
				await execAsync(`pkill -f "${pattern}" || true`);
			} catch {
				// Process not found
			}
		}

		await this.waiter.delay(2000, "process cleanup");
	}

	/**
	 * Full infrastructure reset
	 */
	async reset() {
		log("🔄 Performing full infrastructure reset...");

		// Kill all processes
		await this.killAllProcesses();

		// Clear all ports
		await this.cleanupPorts();

		// Stop Supabase
		try {
			await execAsync("npx supabase stop");
		} catch {
			// Already stopped
		}

		// Wait for everything to settle
		await this.waiter.delay(3000, "infrastructure reset");

		log("✅ Infrastructure reset complete");
	}
}

module.exports = { InfrastructureManager };
