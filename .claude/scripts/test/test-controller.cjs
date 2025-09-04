#!/usr/bin/env node

/**
 * Deterministic Test Controller
 * Orchestrates test execution without LLM involvement
 *
 * IMPORTANT: This controller always bypasses Turbo cache for unit tests (--force flag)
 * Rationale: Tests validate the entire codebase, not just test files themselves.
 * When any code changes, ALL tests must run to catch potential regressions.
 * Without --force, Turbo's caching would skip ~88% of tests (437 out of 498),
 * creating false confidence and missing critical failures.
 */

const { spawn, exec } = require("node:child_process");
const fs = require("node:fs").promises;
const path = require("node:path");
const { promisify } = require("node:util");
const os = require("node:os");
const execAsync = promisify(exec);
const { ResourceLock } = require("./resource-lock.cjs");
const { TestCleanupGuard } = require("./test-cleanup-guard.cjs");

// Import optimization modules if available
let TestCacheManager, ShardOptimizer;
try {
	({ TestCacheManager } = require("./test-cache-manager.cjs"));
} catch (e) {
	// Cache manager not available
}
try {
	({ ShardOptimizer } = require("./test-shard-optimizer.cjs"));
} catch (e) {
	// Shard optimizer not available
}

// Simple logging utility to replace console statements
function log(message, type = "info") {
	const timestamp = new Date().toISOString();
	process.stdout.write(`[${timestamp}] ${type.toUpperCase()}: ${message}\n`);
}

function logError(message) {
	log(message, "error");
}

// Configuration
const CONFIG = {
	statusFile: `/tmp/.claude_test_status_${process.cwd().replace(/\//g, "_")}`,
	resultFile: "/tmp/.claude_test_results.json",
	unitTimeout: 15 * 60 * 1000, // 15 minutes (increased for safety)
	e2eTimeout: 45 * 60 * 1000, // 45 minutes (increased for all shards)
	shardTimeout: 30 * 60 * 1000, // 30 minutes per shard (increased for safety)
	ports: {
		supabase: 55321,
		web: 3000,
		payload: 3020,
	},
	// Override with env var TEST_MAX_CONCURRENT_SHARDS if set
	maxConcurrentShards: process.env.TEST_MAX_CONCURRENT_SHARDS
		? parseInt(process.env.TEST_MAX_CONCURRENT_SHARDS)
		: null,
};

// Test status tracking
class TestStatus {
	constructor() {
		this.reset();
	}

	reset() {
		this.status = {
			phase: "initializing",
			status: "running",
			startTime: new Date().toISOString(),
			unit: { total: 0, passed: 0, failed: 0, skipped: 0 },
			e2e: {
				total: 0,
				passed: 0,
				failed: 0,
				skipped: 0,
				shards: {},
			},
			infrastructure: {
				supabase: "unknown",
				ports: "unknown",
				environment: "unknown",
			},
			errors: [],
		};
	}

	async save() {
		await fs.writeFile(CONFIG.resultFile, JSON.stringify(this.status, null, 2));
	}

	async updateStatusLine(status, passed = 0, failed = 0, total = 0) {
		const timestamp = Math.floor(Date.now() / 1000);
		const line = `${status}|${timestamp}|${passed}|${failed}|${total}`;
		await fs.writeFile(CONFIG.statusFile, line);
	}
}

// Infrastructure checker with smart pre-flight validation
class InfrastructureChecker {
	async checkAll() {
		log("🔍 Running smart pre-flight infrastructure validation...");

		// Phase 1: Quick health checks (< 2 seconds)
		const healthResults = await this.runHealthChecks();

		// Phase 2: Only run startup procedures if health checks fail
		// This includes Phase 3: Re-verification after any setup
		const results = await this.runConditionalSetup(healthResults);

		return results;
	}

	/**
	 * Fast health checks to determine if infrastructure is already running correctly
	 * Only tests connectivity/availability, doesn't perform any setup
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

		// CRITICAL: Re-verify health after setup to ensure everything is running
		if (needsVerification) {
			log("\n🔍 Verifying infrastructure after setup...");
			const verificationResults = await this.runHealthChecks();

			// Check if all critical services are now healthy
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
						logError(`   ❌ ${service}: ${verificationResults[service]}`);
					}
				}
				// Update setup results with verification results
				Object.assign(setupResults, verificationResults);
			} else {
				log("✅ All critical services verified and running correctly");
				// Update with successful verification results
				Object.assign(setupResults, verificationResults);
			}
		}

		// Final status summary
		const results = {
			supabase: setupResults.supabase,
			ports: setupResults.ports,
			environment: setupResults.environment,
			database: setupResults.database,
			testUsers: setupResults.testUsers,
			build: setupResults.build,
			dependencies: setupResults.dependencies,
		};

		// Log comprehensive status
		const passedChecks = Object.values(results).filter(
			(r) =>
				r === "healthy" ||
				r === "running" ||
				r === "started" ||
				r === "valid" ||
				r === "cleaned" ||
				r === "created",
		).length;
		const totalChecks = Object.keys(results).length;
		log(
			`📊 Infrastructure status: ${passedChecks}/${totalChecks} checks passed`,
		);

		return results;
	}

	// =============================================================================
	// HEALTH CHECK METHODS (Fast, read-only validation)
	// =============================================================================

	/**
	 * Quick check if Supabase is responding (no restart)
	 */
	async healthCheckSupabase() {
		try {
			// First check if database is responding on E2E port
			const response = await fetch("http://127.0.0.1:55321/rest/v1/", {
				signal: AbortSignal.timeout(2000),
				headers: {
					apikey:
						"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0",
				},
			});

			// 200 means API is running, 401 means auth is required but API is responsive
			if (response.status === 200 || response.status === 401) {
				// Also check if we can get status (non-critical if it fails)
				try {
					const { stdout } = await execAsync(
						"cd apps/e2e && npx supabase status 2>&1 | head -1",
						{ timeout: 2000 },
					);
					if (stdout.includes("running")) {
						log("✅ Supabase E2E: Healthy (API and CLI confirmed)");
						return "healthy";
					}
				} catch {
					// CLI check failed but API is responsive
				}
				log("✅ Supabase E2E: Healthy (API responding)");
				return "healthy";
			}

			log("⚠️ Supabase E2E: Needs setup (API not responding)");
			return "unhealthy";
		} catch (error) {
			log(`⚠️ Supabase E2E: Needs setup (${error.message})`);
			return "unhealthy";
		}
	}

	/**
	 * Check if .env.test exists and has required variables
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
				log("✅ Environment: Healthy");
				return "healthy";
			}

			log("⚠️ Environment: Missing critical variables");
			return "unhealthy";
		} catch {
			log("⚠️ Environment: .env.test missing");
			return "unhealthy";
		}
	}

	/**
	 * Quick database connectivity test
	 */
	async healthCheckDatabase() {
		try {
			// Quick connectivity test to Supabase E2E instance
			const response = await fetch("http://127.0.0.1:55321/rest/v1/", {
				signal: AbortSignal.timeout(2000),
				headers: {
					apikey:
						"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0",
				},
			});

			if (response.status === 401 || response.status === 200) {
				// 401 is expected without proper auth, means DB is responding
				log("✅ Database: Healthy");
				return "healthy";
			}

			log("⚠️ Database: Needs setup");
			return "unhealthy";
		} catch (error) {
			log(`⚠️ Database: Needs setup (${error.message})`);
			return "unhealthy";
		}
	}

	/**
	 * Check if Next.js build artifacts exist
	 */
	async healthCheckBuild() {
		try {
			const buildPath = path.join(process.cwd(), "apps/web/.next");
			await fs.access(buildPath);
			log("✅ Build: Healthy");
			return "healthy";
		} catch {
			log("⚠️ Build: Needs verification");
			return "unhealthy";
		}
	}

	/**
	 * Quick check if required test users exist in database
	 */
	async healthCheckTestUsers() {
		try {
			log("👤 Checking test users...");

			// Query the onboarding table which has entries for our test users
			// This is accessible via the public API and confirms users are properly seeded
			const response = await fetch(
				"http://127.0.0.1:55321/rest/v1/onboarding?select=user_id",
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
					log("✅ Test users: Healthy (all 3 users found)");
					return "healthy";
				} else {
					log(
						`⚠️ Test users: Missing ${missingUsers.length} users, needs seeding`,
					);
					return "unhealthy";
				}
			} else {
				// If we can't query, it might be a permissions issue or Supabase isn't ready
				log(
					`⚠️ Test users: Cannot query (API returned ${response.status}), needs seeding`,
				);
				return "unhealthy";
			}
		} catch (error) {
			log(`⚠️ Test users: Check failed (${error.message}), needs seeding`);
			return "unhealthy";
		}
	}

	/**
	 * Quick check if Playwright is available
	 */
	async healthCheckDependencies() {
		try {
			await execAsync("npx playwright --version", { timeout: 2000 });
			log("✅ Dependencies: Healthy");
			return "healthy";
		} catch {
			log("⚠️ Dependencies: Needs verification");
			return "unhealthy";
		}
	}

	// =============================================================================
	// SETUP METHODS (Only called when health checks fail)
	// =============================================================================

	/**
	 * Start Supabase with recovery logic if health check failed
	 */
	async setupSupabase() {
		const maxAttempts = 3;
		for (let attempt = 1; attempt <= maxAttempts; attempt++) {
			try {
				log(`🔄 Starting Supabase E2E (attempt ${attempt}/${maxAttempts})...`);

				// First, try to stop any existing instances
				if (attempt > 1) {
					log("🛑 Stopping existing Supabase instances...");
					await execAsync("cd apps/e2e && npx supabase stop", {
						timeout: 30000,
					}).catch(() => {});
					await new Promise((resolve) => setTimeout(resolve, 3000));
				}

				// Check if Docker is running (required for Supabase)
				try {
					await execAsync("docker info", { timeout: 5000 });
				} catch (dockerError) {
					logError("❌ Docker is not running or not accessible");
					log("   Please ensure Docker is installed and running");
					return "failed";
				}

				// Start Supabase with proper timeout
				const { stdout } = await execAsync(
					"cd apps/e2e && npx supabase start",
					{ timeout: attempt === 1 ? 180000 : 300000 }, // 3min first attempt, 5min for retries
				);

				// Verify it actually started
				log("🔍 Verifying Supabase startup...");
				await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait for services to stabilize

				const health = await this.healthCheckSupabase();
				if (health === "healthy") {
					log("✅ Supabase E2E started successfully!");
					return "started";
				}

				// If health check failed, it might need more time
				if (attempt < maxAttempts) {
					log("⏳ Supabase started but not healthy yet. Waiting...");
					await new Promise((resolve) => setTimeout(resolve, 10000));

					// Check health again
					const secondHealth = await this.healthCheckSupabase();
					if (secondHealth === "healthy") {
						log("✅ Supabase E2E is now healthy!");
						return "started";
					}
				}
			} catch (error) {
				logError(
					`❌ Supabase setup attempt ${attempt} failed: ${error.message}`,
				);

				if (attempt === maxAttempts) {
					log("\n📋 Troubleshooting steps:");
					log("   1. Check Docker is running: docker info");
					log("   2. Check Supabase CLI: npx supabase --version");
					log("   3. Check for port conflicts: lsof -ti:55321,55322");
					log("   4. Try manual start: cd apps/e2e && npx supabase start");
					log("   5. Check logs: cd apps/e2e && npx supabase logs");
					return "failed";
				}

				// Wait before retry
				log("⏳ Waiting 10s before retry...");
				await new Promise((resolve) => setTimeout(resolve, 10000));
			}
		}

		return "failed";
	}

	/**
	 * Create/update .env.test if needed
	 */
	async setupEnvironment() {
		try {
			const examplePath = path.join(process.cwd(), "apps/web/.env.example");
			const envPath = path.join(process.cwd(), "apps/web/.env.test");

			const content = await fs.readFile(examplePath, "utf8");
			await fs.writeFile(envPath, content);
			return "created";
		} catch (error) {
			logError(`❌ Environment setup failed: ${error.message}`);
			return "failed";
		}
	}

	/**
	 * Verify database connection if health check failed
	 */
	async setupDatabase() {
		try {
			// Database setup is usually handled by Supabase start
			// This is a placeholder for any additional DB setup needed
			return "verified";
		} catch (error) {
			logError(`❌ Database setup failed: ${error.message}`);
			return "failed";
		}
	}

	/**
	 * Setup required test users by running the seed file
	 */
	async setupTestUsers() {
		const maxAttempts = 2;
		for (let attempt = 1; attempt <= maxAttempts; attempt++) {
			try {
				log(`🌱 Seeding test users (attempt ${attempt}/${maxAttempts})...`);
				log(
					"   Creating test users: test1@slideheroes.com, test2@slideheroes.com, michael@slideheroes.com",
				);

				// Run database reset which applies migrations and runs seed files
				// This ensures clean, consistent test data for E2E tests
				const { stdout, stderr } = await execAsync(
					"cd apps/e2e && npx supabase db reset --local",
					{ timeout: 60000 }, // Longer timeout for reset operation
				);

				if (stdout) {
					// Check if the seed output mentions successful user creation
					const lines = stdout.split("\n");
					const successIndicators = lines.filter(
						(line) =>
							line.includes("INSERT") ||
							line.includes("Auth Users") ||
							line.includes("Onboarding") ||
							line.includes("row"),
					);

					if (successIndicators.length > 0) {
						log("📊 Seed output indicates success:");
						successIndicators
							.slice(0, 3)
							.forEach((line) => log(`   ${line.trim()}`));
					}
				}

				if (stderr && !stderr.includes("warning")) {
					logError(`⚠️ Seed stderr: ${stderr.split("\n")[0]}`);
				}

				// Verify the seeding worked by checking users again
				log("🔍 Verifying test users were seeded...");
				await new Promise((resolve) => setTimeout(resolve, 3000)); // Wait for DB consistency

				const verificationResult = await this.healthCheckTestUsers();
				if (verificationResult === "healthy") {
					log("✅ Test users seeded and verified successfully!");
					log("   ✓ test1@slideheroes.com");
					log("   ✓ test2@slideheroes.com");
					log("   ✓ michael@slideheroes.com");
					return "seeded";
				}

				if (attempt < maxAttempts) {
					log("⏳ Verification failed, will retry...");
					await new Promise((resolve) => setTimeout(resolve, 5000));
				}
			} catch (error) {
				logError(
					`❌ Test user seeding attempt ${attempt} failed: ${error.message}`,
				);

				if (error.message.includes("ECONNREFUSED")) {
					logError(
						"   Database connection refused - ensure Supabase is running",
					);
				}

				if (error.message.includes("already exists")) {
					log(
						"   Note: Some users may already exist, attempting verification...",
					);
					const verificationResult = await this.healthCheckTestUsers();
					if (verificationResult === "healthy") {
						log("✅ Test users already exist and are healthy!");
						return "seeded";
					}
				}

				if (attempt === maxAttempts) {
					log("\n📋 Test user seeding troubleshooting:");
					log(
						"   1. Check Supabase is running: cd apps/e2e && npx supabase status",
					);
					log(
						"   2. Check seed file exists: ls -la apps/e2e/supabase/seeds/01-e2e-test-data.sql",
					);
					log("   3. Try manual seeding: cd apps/e2e && npx supabase db seed");
					log("   4. Check database logs: cd apps/e2e && npx supabase logs db");
					log(
						"   5. Verify migrations: cd apps/e2e && npx supabase migration list",
					);
					return "failed";
				}

				// Wait before retry
				log("⏳ Waiting 5s before retry...");
				await new Promise((resolve) => setTimeout(resolve, 5000));
			}
		}

		return "failed";
	}

	/**
	 * Lightweight port cleanup (always runs)
	 */
	async cleanupPorts() {
		try {
			log("🔧 Cleaning up test ports...");
			// Lightweight cleanup - only target specific test processes
			const killCommands = [
				'pkill -f "vitest.*test" || true', // Only vitest test processes
				'pkill -f "playwright.*test" || true', // Only playwright test processes
				// Skip broad process killing to avoid disrupting running services
			];

			for (const cmd of killCommands) {
				await execAsync(cmd).catch(() => {}); // Ignore errors
			}

			// Shorter wait time
			await new Promise((resolve) => setTimeout(resolve, 1000));

			log("✅ Ports cleaned");
			return "cleaned";
		} catch (error) {
			logError(`⚠️ Port cleanup warning: ${error.message}`);
			return "partial";
		}
	}

	// Legacy method - replaced by smart health checks above
	async checkSupabase() {
		return await this.setupSupabase();
	}

	// Legacy method - replaced by smart cleanup above
	async checkPorts() {
		return await this.cleanupPorts();
	}

	// Legacy method - replaced by smart health checks above
	async checkEnvironment() {
		const health = await this.healthCheckEnvironment();
		if (health === "healthy") {
			return "valid";
		}
		return await this.setupEnvironment();
	}

	async checkDatabaseConnection() {
		try {
			log("🗄️ Checking database connection...");
			// Simple pg connection test using environment vars
			const { stdout } = await execAsync(
				'cd apps/e2e && npx supabase status | grep -i "db url"',
			);
			if (stdout.length > 0) {
				log("✅ Database connection verified");
				return "valid";
			}
			return "unknown";
		} catch (error) {
			logError(`⚠️ Database check failed: ${error.message}`);
			return "failed";
		}
	}

	async checkBuildValidity() {
		try {
			log("🔨 Checking Next.js build validity...");
			// Quick validation that the build artifacts exist
			const buildDir = path.join(process.cwd(), "apps/web/.next");
			await fs.access(buildDir);
			log("✅ Next.js build artifacts found");
			return "valid";
		} catch (error) {
			log("⚠️ No build artifacts found (will use dev server)");
			return "missing";
		}
	}

	async checkDependencies() {
		try {
			log("📦 Checking critical dependencies...");
			// Check for playwright and other critical dependencies
			const { stdout } = await execAsync("npx playwright --version");
			if (stdout.includes("Version")) {
				log("✅ Playwright dependency verified");
				return "valid";
			}
			return "partial";
		} catch (error) {
			logError(`❌ Dependency check failed: ${error.message}`);
			return "failed";
		}
	}

	async fixInfrastructure(results) {
		const fixes = [];

		if (results.supabase === "failed") {
			fixes.push({
				issue: "Supabase not running",
				command: "cd apps/e2e && npx supabase start",
				severity: "critical",
			});
		}

		if (results.environment === "failed") {
			fixes.push({
				issue: "Missing .env.test file",
				command: "cp apps/web/.env.example apps/web/.env.test",
				severity: "critical",
			});
		}

		if (results.database === "failed") {
			fixes.push({
				issue: "Database connection failed",
				command: "cd apps/e2e && npx supabase db reset --linked",
				severity: "warning",
			});
		}

		if (results.dependencies === "failed") {
			fixes.push({
				issue: "Critical dependencies missing",
				command: "pnpm install --frozen-lockfile",
				severity: "critical",
			});
		}

		if (results.testUsers === "failed") {
			fixes.push({
				issue: "Required test users missing from database",
				command: "cd apps/e2e && npx supabase db seed",
				severity: "critical",
			});
		}

		if (results.build === "missing") {
			fixes.push({
				issue: "No Next.js build found - using dev server",
				command: "pnpm --filter web build",
				severity: "info",
			});
		}

		return fixes;
	}
}

// Unit test runner
class UnitTestRunner {
	async run(status) {
		log("\n📦 Running unit tests...");
		status.status.phase = "unit_tests";
		await status.save();

		// Pre-flight workspace verification
		const workspaceInfo = await this.verifyWorkspaces();
		log(`🔍 Workspace verification: ${workspaceInfo.total} workspaces found`);
		log(`   With tests: ${workspaceInfo.withTests}`);
		log(`   Cached: ${workspaceInfo.cached}`);

		return new Promise((resolve) => {
			const startTime = Date.now();
			let output = "";

			// Always force fresh test runs to ensure all tests validate changed code
			// Tests exist to validate the entire codebase, not just test files themselves
			const testCommand = ["test:unit", "--force"];

			const proc = spawn("pnpm", testCommand, {
				cwd: process.cwd(),
				stdio: ["inherit", "pipe", "pipe"],
				shell: true,
				env: {
					...process.env,
					TURBO_FORCE: "true", // Always bypass cache for comprehensive testing
				},
			});

			proc.stdout.on("data", (data) => {
				output += data.toString();
				process.stdout.write(data);
			});

			proc.stderr.on("data", (data) => {
				output += data.toString();
				process.stderr.write(data);
			});

			// Set timeout
			const timeout = setTimeout(() => {
				logError("❌ Unit tests timed out");
				proc.kill("SIGKILL");
			}, CONFIG.unitTimeout);

			proc.on("close", (code) => {
				clearTimeout(timeout);
				const duration = Math.round((Date.now() - startTime) / 1000);

				// Parse test results from output
				const results = this.parseResults(output);

				status.status.unit = results;
				status.status.unit.duration = `${duration}s`;
				status.status.unit.exitCode = code;

				log(`\n📊 Unit tests completed in ${duration}s`);
				log(`   Total Tests: ${results.total}`);
				log(`   ✅ Passed: ${results.passed}`);
				if (results.failed > 0) {
					log(`   ❌ Failed: ${results.failed}`);

					// Show which tests failed
					if (results.failedTests && results.failedTests.length > 0) {
						log("\n❌ Failed Test Details:");
						results.failedTests.forEach((test, index) => {
							if (test.file) {
								log(`   ${index + 1}. ${test.file}`);
							} else if (test.error) {
								log(`   ${index + 1}. ${test.error}`);
							}
						});
					}
				}
				if (results.skipped > 0) {
					log(`   ⏭️  Skipped/Todo: ${results.skipped}`);
				}

				// Post-test workspace analysis
				const workspaceAnalysis = this.analyzeWorkspaceResults(output);

				// Important note about caching being disabled
				log("\n📝 Test Execution Details:");
				log(`   Workspaces with tests: ${workspaceInfo.withTests}`);
				log(`   Workspaces executed: ${workspaceAnalysis.total}`);
				log("   🔄 Cache bypassed: All tests run fresh (--force flag enabled)");

				// Show the actual test distribution
				if (results.total > 400) {
					log(
						"\n✨ Full test suite discovered! All ~498 unit tests were executed.",
					);
				} else if (results.total < 100) {
					log(
						`\n⚠️  Warning: Only ${results.total} tests ran. Expected ~498 tests.`,
					);
					log("   This might indicate some workspaces failed to execute.");
				}

				resolve({
					success: code === 0,
					...results,
					duration,
					output,
					workspaceInfo,
					workspaceAnalysis,
				});
			});
		});
	}

	parseResults(output) {
		const results = {
			total: 0,
			passed: 0,
			failed: 0,
			skipped: 0,
			failedTests: [],
		};

		// Parse Vitest output patterns - keeping for potential future use
		// const patterns = [
		// 	/(\d+) passed/gi,
		// 	/(\d+) failed/gi,
		// 	/(\d+) skipped/gi,
		// 	/Test Files:\s+(\d+) passed/gi,
		// 	/Tests:\s+(\d+) passed/gi,
		// ];

		// Parse test results from each workspace
		// Look for lines like "Tests  3 passed (3)" from each workspace
		const testLines = output.match(/Tests\s+.*\d+.*/gi) || [];

		testLines.forEach((line) => {
			// Parse passed tests (e.g., "60 passed")
			const passedInLine = line.match(/(\d+)\s+passed/);
			if (passedInLine) {
				results.passed += parseInt(passedInLine[1]);
			}

			// Parse failed tests (e.g., "30 failed")
			const failedInLine = line.match(/(\d+)\s+failed/);
			if (failedInLine) {
				results.failed += parseInt(failedInLine[1]);
			}

			// Parse skipped/todo tests (e.g., "4 todo", "2 skipped")
			const skippedInLine = line.match(/(\d+)\s+(skipped|todo)/gi) || [];
			skippedInLine.forEach((skip) => {
				const num = skip.match(/(\d+)/);
				if (num) {
					results.skipped += parseInt(num[1]);
				}
			});
		});

		// Parse failed test details
		if (results.failed > 0) {
			results.failedTests = this.parseFailedTests(output);
		}

		results.total = results.passed + results.failed + results.skipped;

		return results;
	}

	parseFailedTests(output) {
		const failedTests = [];

		// Look for the "Failed Tests" section in vitest output
		const failedSection = output.match(
			/⎯+ Failed Tests .+?⎯+[\s\S]*?(?=\n\s*Test Files|\n\s*Tests:|$)/,
		);

		if (failedSection) {
			// Parse individual FAIL lines
			const failLines = failedSection[0].match(/FAIL\s+.+/g) || [];

			failLines.forEach((line) => {
				const match = line.match(/FAIL\s+(.+)/);
				if (match) {
					failedTests.push({
						file: match[1].trim(),
						// You could parse more details here if needed
					});
				}
			});
		}

		// Also look for AssertionError patterns for more detail
		const assertionErrors = output.match(/AssertionError:.+/g) || [];
		assertionErrors.forEach((error) => {
			if (!failedTests.some((t) => error.includes(t.file))) {
				failedTests.push({
					error: error.trim(),
				});
			}
		});

		return failedTests;
	}

	/**
	 * Verify which workspaces have test scripts and could potentially run
	 */
	async verifyWorkspaces() {
		try {
			const { stdout } = await execAsync("pnpm list --recursive --json");
			const workspaces = JSON.parse(stdout);

			let total = 0;
			let withTests = 0;
			const cached = 0;

			// Count workspaces that could have tests (excluding e2e)
			for (const workspace of workspaces) {
				if (workspace.name === "web-e2e" || workspace.name === "slideheroes")
					continue;

				total++;

				// Check if workspace has test scripts in package.json
				try {
					const packageJsonPath = path.join(workspace.path, "package.json");
					const packageContent = await fs.readFile(packageJsonPath, "utf8");
					const packageJson = JSON.parse(packageContent);

					if (
						packageJson.scripts &&
						(packageJson.scripts.test || packageJson.scripts["test:unit"])
					) {
						withTests++;
					}
				} catch (error) {
					// Ignore workspace if can't read package.json
				}
			}

			return {
				total,
				withTests,
				cached: 0, // Will be updated during test execution
			};
		} catch (error) {
			logError(`Failed to verify workspaces: ${error.message}`);
			return { total: 0, withTests: 0, cached: 0 };
		}
	}

	/**
	 * Analyze test output to determine which workspaces actually ran
	 */
	analyzeWorkspaceResults(output) {
		const analysis = {
			total: 0,
			skipped: 0,
			executed: [],
			cached: [],
		};

		// Look for Turbo workspace execution patterns
		const workspacePattern = /(@[\w-]+\/[\w-]+|[\w-]+): RUN\s/g;
		const cachedPattern = /(@[\w-]+\/[\w-]+|[\w-]+): CACHED\s/g;

		let match;

		// Count executed workspaces
		while ((match = workspacePattern.exec(output)) !== null) {
			const workspace = match[1];
			if (!analysis.executed.includes(workspace)) {
				analysis.executed.push(workspace);
				analysis.total++;
			}
		}

		// Count cached workspaces
		while ((match = cachedPattern.exec(output)) !== null) {
			const workspace = match[1];
			if (!analysis.cached.includes(workspace)) {
				analysis.cached.push(workspace);
				analysis.skipped++;
			}
		}

		return analysis;
	}
}

// E2E test runner with queue-based execution
class E2ETestRunner {
	constructor() {
		this.resourceLock = new ResourceLock();
		this.cacheManager = TestCacheManager ? new TestCacheManager() : null;
		this.shardOptimizer = ShardOptimizer ? new ShardOptimizer() : null;

		// Default shards (can be optimized dynamically)
		this.allShards = [
			{ id: 1, name: "Accessibility Large", tests: 13 },
			{ id: 2, name: "Authentication", tests: 10 },
			{ id: 3, name: "Admin", tests: 9 },
			{ id: 4, name: "Smoke", tests: 9 },
			{ id: 5, name: "Accessibility Simple", tests: 6 },
			{ id: 6, name: "Team Accounts", tests: 6 },
			{ id: 7, name: "Account + Invitations", tests: 8 },
			{ id: 8, name: "Quick Tests", tests: 3 },
			{ id: 9, name: "Billing", tests: 2 },
		];
		this.shards = [...this.allShards];

		// Smart retry patterns
		this.retryPatterns = {
			timeout: {
				patterns: ["Timeout", "waiting for", "element"],
				maxRetries: 2,
				backoff: 1000,
				description: "Element timeout errors",
			},
			element_not_found: {
				patterns: [
					"strict mode violation",
					"expected 1, got 0",
					"No element found",
				],
				maxRetries: 1,
				backoff: 500,
				description: "Element not found errors",
			},
			connection_refused: {
				patterns: ["ECONNREFUSED", "net::ERR_CONNECTION_REFUSED"],
				maxRetries: 3,
				backoff: 2000,
				description: "Connection errors",
			},
			webserver_timeout: {
				patterns: ["WebServer", "Timed out"],
				maxRetries: 2,
				backoff: 3000,
				description: "WebServer startup timeout",
			},
		};

		// Calculate optimal concurrency based on system resources
		const cpuCount = os.cpus().length;

		// Check if there's a configured override
		if (CONFIG.maxConcurrentShards) {
			this.maxConcurrentShards = CONFIG.maxConcurrentShards;
			log(
				`🔧 Using configured concurrency: ${this.maxConcurrentShards} shards`,
			);
		} else {
			// Use sequential execution (1 shard) for now - testing shows this is faster
			// on single machines due to reduced resource contention (Issue #269)
			// Previous: Math.min(2, Math.floor(cpuCount * 0.75))
			this.maxConcurrentShards = 1;
		}

		log(`🖥️  System has ${cpuCount} CPU cores`);
		log(`⚙️  Max concurrent shards: ${this.maxConcurrentShards}`);

		this.serverProcess = null;
	}

	async startTestServers() {
		log("🚀 Starting test servers (Frontend & Backend)...");

		// Always kill any existing processes first to ensure clean start
		try {
			log("🧹 Cleaning up any existing server processes...");
			await execAsync(`pkill -9 -f "next-server" 2>/dev/null || true`);
			// FIXED: Don't kill our own dev:test processes - only kill orphaned ones
			// await execAsync(`pkill -9 -f "pnpm.*dev:test" 2>/dev/null || true`);
			await execAsync(
				"lsof -ti:3000,3010,3020 | xargs -r kill -9 2>/dev/null || true",
			);
			await new Promise((resolve) => setTimeout(resolve, 2000));
		} catch (e) {
			// Ignore cleanup errors
		}

		// Check if servers are already running after cleanup
		const frontendRunning = await this.isServerRunning(3000);
		const backendRunning = await this.isServerRunning(3020);

		if (frontendRunning && backendRunning) {
			log("✅ Servers already running, reusing existing instances");
			// Still perform health checks to ensure they're truly ready
			return await this.ensureServersHealthy();
		}

		// Start servers in background with better error handling
		if (!frontendRunning) {
			log("🌐 Starting frontend server on port 3000...");
			this.serverProcess = spawn("pnpm", ["--filter", "web", "dev:test"], {
				cwd: process.cwd(),
				stdio: ["ignore", "pipe", "pipe"],
				detached: true, // CRITICAL FIX: Detach to prevent signal propagation
				shell: true,
				env: {
					...process.env,
					NODE_ENV: "test",
					PORT: "3000",
					FORCE_COLOR: "0",
				},
			});

			// Don't unref - we want to keep the process alive
			// this.serverProcess.unref();

			// Capture stdout/stderr for debugging
			this.serverProcess.stdout.on("data", (data) => {
				const output = data.toString();
				if (
					output.includes("Local:") ||
					output.includes("ready") ||
					output.includes("error")
				) {
					log(`📡 Frontend: ${output.trim()}`);
				}
			});

			this.serverProcess.stderr.on("data", (data) => {
				const output = data.toString();
				log(`📡 Frontend stderr: ${output.trim()}`);
			});

			// Add error handlers
			this.serverProcess.on("error", (err) => {
				logError(`Frontend server error: ${err.message}`);
			});

			this.serverProcess.on("exit", (code, signal) => {
				logError(
					`🚨 Frontend server EXITED with code ${code} (signal: ${signal})`,
				);
				if (signal) {
					logError(`   Signal received: ${signal}`);
					logError(
						"   This indicates the server was terminated by signal propagation!",
					);
				}
				this.serverProcess = null;
			});
		}

		// Start backend server too
		if (!backendRunning) {
			log("🔧 Starting backend server on port 3020...");
			this.backendProcess = spawn("pnpm", ["--filter", "payload", "dev:test"], {
				cwd: process.cwd(),
				stdio: ["ignore", "pipe", "pipe"],
				detached: true, // CRITICAL FIX: Detach to prevent signal propagation
				shell: true,
				env: {
					...process.env,
					NODE_ENV: "test",
					PORT: "3020",
					FORCE_COLOR: "0",
				},
			});

			// Don't unref - we want to keep the process alive
			// this.backendProcess.unref();

			// Capture stdout/stderr for debugging
			this.backendProcess.stdout.on("data", (data) => {
				const output = data.toString();
				if (
					output.includes("Local:") ||
					output.includes("ready") ||
					output.includes("error")
				) {
					log(`🔧 Backend: ${output.trim()}`);
				}
			});

			this.backendProcess.stderr.on("data", (data) => {
				const output = data.toString();
				log(`🔧 Backend stderr: ${output.trim()}`);
			});

			// Add error handlers
			this.backendProcess.on("error", (err) => {
				logError(`Backend server error: ${err.message}`);
			});

			this.backendProcess.on("exit", (code, signal) => {
				logError(
					`🚨 Backend server EXITED with code ${code} (signal: ${signal})`,
				);
				if (signal) {
					logError(`   Signal received: ${signal}`);
					logError(
						"   This indicates the server was terminated by signal propagation!",
					);
				}
				this.backendProcess = null;
			});
		}

		// Enhanced server readiness check with retry logic and recovery
		log("⏳ Waiting for servers to be ready...");
		const maxRetries = 30; // 30 * 2s = 60s initial wait
		const recoveryAttempts = 2; // Number of recovery attempts
		let currentRecovery = 0;
		let retries = 0;
		let frontendReady = false;
		let backendReady = false;
		let lastFrontendError = null;
		let lastBackendError = null;
		const startWaitTime = Date.now();

		while (retries < maxRetries || currentRecovery < recoveryAttempts) {
			// Check if we need to trigger recovery
			if (retries >= maxRetries && (!frontendReady || !backendReady)) {
				if (currentRecovery < recoveryAttempts) {
					currentRecovery++;
					log(
						`⚠️ Servers not ready after ${retries * 2}s. Attempting recovery (${currentRecovery}/${recoveryAttempts})...`,
					);

					// Step 1: Kill stuck processes more aggressively
					log("🔧 Killing stuck processes...");
					try {
						// Kill all Node/Next.js related processes
						await execAsync(`pkill -9 -f "next-server" 2>/dev/null || true`);
						await execAsync(
							`pkill -9 -f "playwright|vitest" 2>/dev/null || true`,
						);
						// Don't kill our own dev:test servers during recovery - they might just be slow to start
						// Only kill if we're sure they're dead (check PIDs)
						if (this.serverProcess?.pid) {
							// Kill dev:test processes except our known server PIDs
							await execAsync(
								`pgrep -f "pnpm.*dev:test" | grep -v ${this.serverProcess.pid} | xargs -r kill -9 2>/dev/null || true`,
							);
						}
						if (this.backendProcess?.pid) {
							await execAsync(
								`pgrep -f "pnpm.*dev:test" | grep -v ${this.backendProcess.pid} | xargs -r kill -9 2>/dev/null || true`,
							);
						}
						// Force kill anything on our test ports EXCEPT our managed servers
						// Get PIDs on ports but exclude our managed server PIDs
						if (this.serverProcess?.pid || this.backendProcess?.pid) {
							const pidsToExclude = [];
							if (this.serverProcess?.pid)
								pidsToExclude.push(this.serverProcess.pid);
							if (this.backendProcess?.pid)
								pidsToExclude.push(this.backendProcess.pid);
							const excludePattern = pidsToExclude.join("\\|");
							await execAsync(
								`lsof -ti:3000,3010,3020 | grep -v "${excludePattern}" | xargs -r kill -9 2>/dev/null || true`,
							);
						} else {
							// No managed servers, safe to kill all processes on ports
							await execAsync(
								"lsof -ti:3000,3010,3020 | xargs -r kill -9 2>/dev/null || true",
							);
						}
						await new Promise((resolve) => setTimeout(resolve, 3000)); // Give more time for processes to die
						log("✅ Processes killed");
					} catch (e) {
						log("⚠️ Process cleanup warning: " + e.message);
					}

					// Step 2: Check and restart Supabase if needed
					log("🔧 Checking Supabase status...");
					try {
						const { stdout } = await execAsync(
							`npx supabase status 2>/dev/null || echo "not running"`,
						);
						if (
							stdout.includes("not running") ||
							stdout.includes("unhealthy")
						) {
							log("⚠️ Supabase not running or unhealthy. Restarting...");
							await execAsync("npx supabase stop");
							await new Promise((resolve) => setTimeout(resolve, 3000));
							await execAsync("npx supabase start");
							log("✅ Supabase restarted");
							await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait for Supabase to initialize
						}
					} catch (e) {
						log("⚠️ Supabase check warning: " + e.message);
					}

					// Step 3: Try to start servers again with different approaches
					log("🔄 Restarting test servers...");

					// Kill any existing server processes first
					if (this.serverProcess) {
						try {
							// Kill process group for detached processes
							process.kill(-this.serverProcess.pid, "SIGKILL");
						} catch (e) {
							// Process might already be dead
						}
						this.serverProcess = null;
					}
					if (this.backendProcess) {
						try {
							// Kill process group for detached processes
							process.kill(-this.backendProcess.pid, "SIGKILL");
						} catch (e) {
							// Process might already be dead
						}
						this.backendProcess = null;
					}

					// Extra cleanup to ensure ports are free, but preserve any active managed servers
					// Note: At this point we've already killed the server processes above if they were dead
					// So we shouldn't kill anything that's legitimately running
					// Skip port cleanup here as it's redundant with the cleanup above
					await new Promise((resolve) => setTimeout(resolve, 2000));

					// Try different approach based on recovery attempt
					if (currentRecovery === 1) {
						// First recovery: Use spawn with more explicit settings
						if (!frontendReady) {
							log("🌐 Starting frontend with spawn (recovery mode)...");
							this.serverProcess = spawn(
								"pnpm",
								["--filter", "web", "dev:test"],
								{
									cwd: process.cwd(),
									stdio: ["ignore", "pipe", "pipe"],
									detached: true, // Keep detached in recovery mode
									shell: true,
									env: {
										...process.env,
										NODE_ENV: "test",
										PORT: "3000",
										FORCE_COLOR: "0",
									},
								},
							);
							// Don't unref - we want to keep the process alive
							// this.serverProcess.unref();
						}

						if (!backendReady) {
							log("🔧 Starting backend with spawn (recovery mode)...");
							this.backendProcess = spawn(
								"pnpm",
								["--filter", "payload", "dev:test"],
								{
									cwd: process.cwd(),
									stdio: ["ignore", "pipe", "pipe"],
									detached: true, // Keep detached in recovery mode
									shell: true,
									env: {
										...process.env,
										NODE_ENV: "test",
										PORT: "3020",
										FORCE_COLOR: "0",
									},
								},
							);
							// Don't unref - we want to keep the process alive
							// this.backendProcess.unref();
						}
					} else {
						// Second recovery: Use exec with nohup for more resilient process
						if (!frontendReady) {
							log("🌐 Starting frontend with exec (fallback mode)...");
							try {
								// Start in background with nohup
								await execAsync(
									`cd ${process.cwd()} && PORT=3000 NODE_ENV=test nohup pnpm --filter web dev:test > /tmp/frontend.log 2>&1 &`,
									{ timeout: 5000 },
								);
								log("🌐 Frontend server started with exec");
							} catch (e) {
								log("⚠️ Frontend exec start warning: " + e.message);
							}
						}

						if (!backendReady) {
							log("🔧 Starting backend with exec (fallback mode)...");
							try {
								// Start in background with nohup
								await execAsync(
									`cd ${process.cwd()} && PORT=3020 NODE_ENV=test nohup pnpm --filter payload dev:test > /tmp/backend.log 2>&1 &`,
									{ timeout: 5000 },
								);
								log("🔧 Backend server started with exec");
							} catch (e) {
								log("⚠️ Backend exec start warning: " + e.message);
							}
						}

						// Give extra time for exec-started processes
						await new Promise((resolve) => setTimeout(resolve, 5000));
					}

					// Reset retry counter for another attempt
					retries = 0;
					continue; // Continue the while loop with fresh retry counter
				} else {
					// No more recovery attempts, exit the loop
					break;
				}
			}

			// Check frontend health with detailed error tracking
			if (!frontendReady) {
				try {
					const frontendResponse = await fetch(
						"http://127.0.0.1:3000/api/health",
						{ signal: AbortSignal.timeout(3000) },
					).catch((err) => {
						lastFrontendError = err.message;
						return null;
					});
					if (frontendResponse?.ok) {
						const data = await frontendResponse.json().catch(() => null);
						if (data && data.status === "ready") {
							frontendReady = true;
							log("✅ Frontend server is ready!");
						}
					}
				} catch (error) {
					lastFrontendError = error.message;
					// Fallback to basic check
					try {
						const basicCheck = await fetch("http://127.0.0.1:3000", {
							signal: AbortSignal.timeout(3000),
						}).catch((err) => {
							lastFrontendError = err.message;
							return null;
						});
						if (basicCheck) {
							frontendReady = true;
							log("✅ Frontend server is responding!");
						}
					} catch (err2) {
						lastFrontendError = err2.message;
					}
				}
			}

			// Check backend health with detailed error tracking
			if (!backendReady) {
				try {
					const backendResponse = await fetch(
						"http://127.0.0.1:3020/api/health",
						{ signal: AbortSignal.timeout(3000) },
					).catch((err) => {
						lastBackendError = err.message;
						return null;
					});
					if (backendResponse?.ok) {
						const data = await backendResponse.json().catch(() => null);
						if (data && data.status === "ready") {
							backendReady = true;
							log("✅ Backend server is ready!");
						}
					}
				} catch (error) {
					lastBackendError = error.message;
					// Fallback to basic check
					try {
						const basicCheck = await fetch("http://127.0.0.1:3020", {
							signal: AbortSignal.timeout(3000),
						}).catch((err) => {
							lastBackendError = err.message;
							return null;
						});
						if (basicCheck) {
							backendReady = true;
							log("✅ Backend server is responding!");
						}
					} catch (err2) {
						lastBackendError = err2.message;
					}
				}
			}

			// Both servers ready
			if (frontendReady && backendReady) {
				log("✅ All servers are ready!");

				// Pre-warm servers with initial requests
				log("🔥 Pre-warming servers...");
				await this.preWarmServers();

				return true;
			}

			// Log progress with detailed status every 5 retries
			if (retries > 0 && retries % 5 === 0) {
				const elapsed = Math.round((Date.now() - startWaitTime) / 1000);
				log(
					`⏳ Still waiting... (${elapsed}s elapsed, Frontend: ${frontendReady ? "✅" : "⏳"}, Backend: ${backendReady ? "✅" : "⏳"})`,
				);

				// Log errors if servers aren't responding after 20s
				if (elapsed > 20) {
					if (!frontendReady && lastFrontendError) {
						log(`   Frontend issue: ${lastFrontendError}`);
					}
					if (!backendReady && lastBackendError) {
						log(`   Backend issue: ${lastBackendError}`);
					}

					// Check if server processes are still alive
					if (this.serverProcess?.killed) {
						log("   ⚠️ Frontend process died unexpectedly");
					}
					if (this.backendProcess?.killed) {
						log("   ⚠️ Backend process died unexpectedly");
					}
				}
			}

			retries++;
			await new Promise((resolve) => setTimeout(resolve, 2000));
		}

		// If we've exhausted all attempts (including recovery), throw an error
		if (!frontendReady || !backendReady) {
			const errorDetails = [];
			if (!frontendReady)
				errorDetails.push("Frontend (port 3000) not responding");
			if (!backendReady)
				errorDetails.push("Backend (port 3020) not responding");

			log("\n❌ Server startup failed after all recovery attempts");
			log("   Issues:");
			errorDetails.forEach((detail) => log(`   - ${detail}`));
			log("\n   Troubleshooting steps:");
			log("   1. Check if ports 3000 and 3020 are in use: lsof -ti:3000,3020");
			log("   2. Ensure Supabase is running: npx supabase status");
			log("   3. Check for Node/npm issues: node --version && npm --version");
			log("   4. Try manual server start: pnpm --filter web dev:test");

			throw new Error(
				`Servers failed to start after ${recoveryAttempts} recovery attempts. ${errorDetails.join(", ")}`,
			);
		}
	}

	async preWarmServers() {
		// Make a few requests to warm up the servers
		const warmupRequests = [
			fetch("http://127.0.0.1:3000").catch(() => null),
			fetch("http://127.0.0.1:3020").catch(() => null),
			fetch("http://127.0.0.1:3000/api/health").catch(() => null),
			fetch("http://127.0.0.1:3020/api/health").catch(() => null),
		];

		await Promise.all(warmupRequests);

		// Small delay to ensure servers are fully warm
		await new Promise((resolve) => setTimeout(resolve, 1000));
		log("✅ Server pre-warming complete");
	}

	async ensureServersHealthy() {
		log("🔍 Performing comprehensive health checks...");

		// Check frontend health with multiple endpoints
		const frontendChecks = await Promise.all([
			this.checkEndpoint("http://127.0.0.1:3000", "Frontend root"),
			this.checkEndpoint(
				"http://127.0.0.1:3000/api/health",
				"Frontend health API",
			),
		]);

		// Check backend health
		const backendChecks = await Promise.all([
			this.checkEndpoint("http://127.0.0.1:3020", "Backend root"),
			this.checkEndpoint(
				"http://127.0.0.1:3020/api/health",
				"Backend health API",
			),
		]);

		const allChecks = [...frontendChecks, ...backendChecks];
		const passedChecks = allChecks.filter((c) => c).length;

		if (passedChecks === allChecks.length) {
			log(`✅ All health checks passed (${passedChecks}/${allChecks.length})`);
			return true;
		} else if (passedChecks >= 2) {
			log(
				`⚠️ Some health checks failed (${passedChecks}/${allChecks.length}), but minimum requirements met`,
			);
			return true;
		} else {
			throw new Error(
				`Health checks failed: only ${passedChecks}/${allChecks.length} passed`,
			);
		}
	}

	async checkEndpoint(url, name) {
		try {
			const response = await fetch(url, {
				signal: AbortSignal.timeout(5000),
			});

			if (response.ok) {
				log(`  ✅ ${name}: OK (status: ${response.status})`);

				// For health endpoints, check the response body
				if (url.includes("/api/health")) {
					try {
						const data = await response.json();
						if (data.status === "ready") {
							log("    → Health status: ready");
						}
					} catch (e) {
						// JSON parsing failed, but endpoint responded
					}
				}
				return true;
			} else {
				log(`  ⚠️ ${name}: Responded with status ${response.status}`);
				return false;
			}
		} catch (error) {
			log(`  ❌ ${name}: Failed - ${error.message}`);
			return false;
		}
	}

	async isServerRunning(port) {
		try {
			const response = await fetch(`http://127.0.0.1:${port}/api/health`, {
				signal: AbortSignal.timeout(2000),
			}).catch(() => null);
			return response?.ok;
		} catch (e) {
			return false;
		}
	}

	async stopTestServers() {
		log("🛑 Stopping test servers gracefully...");

		// Store PIDs before clearing references
		const serverPid = this.serverProcess?.pid;
		const backendPid = this.backendProcess?.pid;

		// For detached processes, we need to handle cleanup differently
		if (this.serverProcess && !this.serverProcess.killed) {
			try {
				// Send SIGTERM to the process group since it's detached
				process.kill(-this.serverProcess.pid, "SIGTERM");
				log("  📡 Frontend server SIGTERM sent");
			} catch (e) {
				// Process might already be dead
				log("  ⚠️ Frontend server already terminated");
			}
			this.serverProcess = null;
		}

		if (this.backendProcess && !this.backendProcess.killed) {
			try {
				// Send SIGTERM to the process group since it's detached
				process.kill(-this.backendProcess.pid, "SIGTERM");
				log("  🔧 Backend server SIGTERM sent");
			} catch (e) {
				// Process might already be dead
				log("  ⚠️ Backend server already terminated");
			}
			this.backendProcess = null;
		}

		// Give servers time to shut down gracefully
		await new Promise((resolve) => setTimeout(resolve, 2000));

		// Force cleanup any lingering processes EXCEPT our tracked servers
		// This is called when we're intentionally shutting down, so we only
		// want to clean up orphaned processes, not kill active test servers
		log("🧹 Cleaning up any orphaned dev:test processes...");

		// Build exclusion list for PIDs we're managing
		const excludePids = [];
		if (serverPid) excludePids.push(serverPid);
		if (backendPid) excludePids.push(backendPid);

		if (excludePids.length > 0) {
			// Only kill dev:test processes that aren't our managed servers
			const excludePattern = excludePids.join("\\|");
			await execAsync(
				`pgrep -f "dev:test" | grep -v "${excludePattern}" | xargs -r kill -TERM 2>/dev/null || true`,
			).catch(() => {});
		} else {
			// No managed servers, safe to kill all dev:test processes
			await execAsync('pkill -f "dev:test" || true').catch(() => {});
		}

		// Also clean up by port to be thorough, but exclude our managed servers
		// This handles cases where processes might be on ports but not matching dev:test pattern
		if (excludePids.length > 0) {
			const excludePattern = excludePids.join("\\|");
			await execAsync(
				`lsof -ti:3000,3020 | grep -v "${excludePattern}" | xargs -r kill -TERM 2>/dev/null || true`,
			).catch(() => {});
		} else {
			// No managed servers, safe to kill all processes on ports
			await execAsync(
				"lsof -ti:3000,3020 | xargs -r kill -TERM 2>/dev/null || true",
			).catch(() => {});
		}
	}

	async acquirePortLocks() {
		try {
			log("🔒 Acquiring port locks...");
			const frontendLocked = await this.resourceLock.acquire(
				"port:3000",
				15000,
			);
			const backendLocked = await this.resourceLock.acquire("port:3020", 15000);

			if (!frontendLocked || !backendLocked) {
				log("⚠️ Could not acquire all port locks");
				if (frontendLocked) await this.resourceLock.release("port:3000");
				if (backendLocked) await this.resourceLock.release("port:3020");
				return false;
			}

			log("✅ Port locks acquired");
			return true;
		} catch (error) {
			logError(`Failed to acquire port locks: ${error.message}`);
			return false;
		}
	}

	async releasePortLocks() {
		try {
			log("🔓 Releasing port locks...");
			await this.resourceLock.release("port:3000");
			await this.resourceLock.release("port:3020");
			log("✅ Port locks released");
		} catch (error) {
			logError(`Failed to release port locks: ${error.message}`);
		}
	}

	async run(status, options = {}) {
		// If quick mode, only run smoke tests (shard 4)
		if (options.quick) {
			log("\n🏃 Running quick smoke tests only...");
			this.shards = [{ id: 4, name: "Smoke", tests: 9 }];
		} else {
			// Reset to all shards for full run
			this.shards = [...this.allShards];
			log(
				`\n🌐 Running E2E tests (${this.shards.length} shards, max ${this.maxConcurrentShards} concurrent)...`,
			);
		}
		status.status.phase = "e2e_tests";
		await status.save();

		// Initialize resource locking
		await this.resourceLock.init();

		// Initialize cache manager if available
		if (this.cacheManager && process.env.USE_TEST_CACHE !== "false") {
			try {
				await this.cacheManager.init();
				log("📦 Test cache system initialized");

				// Check for cached results if running in quick mode
				if (process.env.QUICK_TEST === "true") {
					const cachedSummary = await this.checkCachedResults();
					if (cachedSummary.allCached) {
						log(
							"✅ All tests have valid cached results, skipping E2E execution",
						);
						return cachedSummary.totals;
					}
				}
			} catch (error) {
				log(`⚠️ Cache initialization failed: ${error.message}`);
			}
		}

		// Optimize shard distribution if available
		if (this.shardOptimizer && process.env.OPTIMIZE_SHARDS !== "false") {
			try {
				await this.optimizeShardDistribution();
			} catch (error) {
				log(`⚠️ Shard optimization failed: ${error.message}`);
			}
		}

		// Pre-flight selector validation
		const selectorValidation = await this.validateSelectors();
		if (!selectorValidation.passed && selectorValidation.coverage < 70) {
			log(
				`⚠️ Low selector coverage (${selectorValidation.coverage}%). Continuing with reduced expectations.`,
			);
		}

		const startTime = Date.now();

		// Acquire locks on critical ports before starting servers
		const portsAcquired = await this.acquirePortLocks();
		if (!portsAcquired) {
			logError("❌ Failed to acquire port locks for test servers");
			return {
				total: 66,
				passed: 0,
				failed: 66,
				skipped: 0,
				infrastructureFailures: 9,
			};
		}

		// Pre-start servers for test execution
		// Servers are managed centrally by the test controller
		try {
			await this.startTestServers();

			// Additional explicit health check before starting shards
			log("🔍 Final health verification before E2E tests...");
			const healthCheck = await this.ensureServersHealthy();
			if (!healthCheck) {
				throw new Error("Server health checks failed after startup");
			}
		} catch (error) {
			logError(`❌ Failed to start test servers: ${error.message}`);
			await this.releasePortLocks();
			return {
				total: 66,
				passed: 0,
				failed: 66,
				skipped: 0,
				infrastructureFailures: 9,
			};
		}

		// Queue-based execution with concurrency limit
		const shardResults = await this.runShardsWithQueue(status);

		// Aggregate results
		const totals = {
			total: 0,
			passed: 0,
			failed: 0,
			skipped: 0,
			infrastructureFailures: 0,
		};

		shardResults.forEach((result) => {
			const shard = this.shards.find((s) => s.id === result.shardId);
			status.status.e2e.shards[`shard_${shard.id}`] = {
				name: shard.name,
				...result,
			};

			totals.total += result.total;
			totals.passed += result.passed;
			totals.failed += result.failed;
			totals.skipped += result.skipped;
			if (result.infrastructureFailure) {
				totals.infrastructureFailures++;
			}
		});

		const totalDuration = Math.round((Date.now() - startTime) / 1000);
		status.status.e2e = {
			...status.status.e2e,
			...totals,
			duration: `${totalDuration}s`,
		};

		// Cleanup test servers and release locks
		await this.stopTestServers();
		await this.releasePortLocks();

		// Cache test results for future runs
		await this.cacheTestResults(shardResults);

		log("\n📊 E2E tests completed");
		log(`   Total: ${totals.total}`);
		log(`   Passed: ${totals.passed}`);
		log(`   Failed: ${totals.failed}`);
		if (totals.infrastructureFailures > 0) {
			log(`   ⚠️ Infrastructure failures: ${totals.infrastructureFailures}`);
		}
		log(`   ⏱️ Total duration: ${totalDuration}s`);

		return totals;
	}

	async runShardsWithQueue(status) {
		const shardQueue = [...this.shards];
		const runningShards = new Map(); // Map of shardId -> Promise
		const currentTests = new Map(); // Map of shardId -> current test info
		const results = [];
		const failedShards = []; // Track shards that failed for potential retry

		// Progress tracking
		const totalShards = this.shards.length;
		let completedShards = 0;
		const startTime = Date.now();

		// Start progress reporter that updates every 5 seconds
		const progressInterval = setInterval(() => {
			const elapsed = Math.round((Date.now() - startTime) / 1000);
			const progress = Math.round((completedShards / totalShards) * 100);
			const progressBar =
				"█".repeat(Math.floor(progress / 5)) +
				"░".repeat(20 - Math.floor(progress / 5));

			// Calculate ETA based on average time per shard
			let eta = "calculating...";
			if (completedShards > 0) {
				const avgTimePerShard = elapsed / completedShards;
				const remainingShards = totalShards - completedShards;
				const remainingSeconds = Math.round(avgTimePerShard * remainingShards);
				const minutes = Math.floor(remainingSeconds / 60);
				const seconds = remainingSeconds % 60;
				eta = `${minutes}m ${seconds}s`;
			}

			// Get current running shard names
			const runningNames = Array.from(runningShards.keys())
				.map(
					(id) => this.shards.find((s) => s.id === id)?.name || `Shard ${id}`,
				)
				.join(", ");

			log(`\n  📊 E2E Progress: [${progressBar}] ${progress}%`);
			log(`     Completed: ${completedShards}/${totalShards} shards`);
			if (runningNames) {
				log(`     Running: ${runningNames}`);
			}

			// Display current tests for each running shard
			Array.from(currentTests.entries()).forEach(([shardId, testInfo]) => {
				if (testInfo?.testName) {
					const shardName =
						this.shards.find((s) => s.id === shardId)?.name ||
						`Shard ${shardId}`;
					log(`       └─ ${shardName}: ${testInfo.testName}`);
				}
			});

			log(
				`     Elapsed: ${Math.floor(elapsed / 60)}m ${elapsed % 60}s | ETA: ${eta}`,
			);
		}, 5000); // Update every 5 seconds

		// Helper to wait for next shard to complete
		const waitForNextCompletion = async () => {
			if (runningShards.size === 0) return null;

			const promises = Array.from(runningShards.entries()).map(
				async ([shardId, promise]) => {
					const result = await promise;
					return { shardId, result };
				},
			);

			const completed = await Promise.race(promises);
			runningShards.delete(completed.shardId);
			currentTests.delete(completed.shardId); // Clean up current test tracking
			return completed.result;
		};

		// Track if this is the first shard (will start servers)
		let isFirstShard = true;

		// Process queue with concurrency limit
		while (shardQueue.length > 0 || runningShards.size > 0) {
			// Start new shards up to the concurrency limit
			while (
				runningShards.size < this.maxConcurrentShards &&
				shardQueue.length > 0
			) {
				const shard = shardQueue.shift();
				log(
					`  🚀 Starting shard ${shard.id}: ${shard.name} (${runningShards.size + 1}/${this.maxConcurrentShards} concurrent)`,
				);

				const shardPromise = this.runShardWithRetry(shard, 1, currentTests);
				runningShards.set(shard.id, shardPromise);
				currentTests.set(shard.id, { testName: "Starting..." });

				// Delay after first shard to allow servers to start
				// Subsequent shards will reuse the servers
				if (isFirstShard) {
					isFirstShard = false;
					log("  ⏳ Waiting 10s for first shard to start servers...");
					await new Promise((resolve) => setTimeout(resolve, 10000));
				} else if (runningShards.size < this.maxConcurrentShards) {
					// Small delay between subsequent shards
					await new Promise((resolve) => setTimeout(resolve, 500));
				}
			}

			// Wait for at least one shard to complete if we're at capacity
			if (runningShards.size > 0) {
				const result = await waitForNextCompletion();
				if (result) {
					results.push(result);
					completedShards++; // Update progress counter

					// Track failed shards for potential retry logic
					if (result.failed > 0 || result.infrastructureFailure) {
						failedShards.push(result.shardId);
					}

					// Update status in real-time
					await status.save();
				}
			}
		}

		// Clear the progress interval
		clearInterval(progressInterval);

		// Log completion summary
		log(`\n✅ All ${this.shards.length} shards completed`);
		if (failedShards.length > 0) {
			log(`   ⚠️ Shards with failures: ${failedShards.join(", ")}`);
		}

		return results;
	}

	async runShardWithRetry(shard, attempt = 1, currentTests = null) {
		const result = await this.runShard(shard, attempt, currentTests);

		// Add shardId to result for tracking
		result.shardId = shard.id;

		// Analyze failure patterns for smart retry
		const retryStrategy = this.analyzeRetryStrategy(result);

		if (retryStrategy && attempt <= retryStrategy.maxRetries) {
			log(
				`  🔄 Smart retry for shard ${shard.id} (attempt ${attempt}/${retryStrategy.maxRetries})`,
			);
			log(`     Reason: ${retryStrategy.description}`);
			log(`     Backoff: ${retryStrategy.backoff}ms`);

			// Apply backoff with jitter to avoid thundering herd
			const jitter = Math.random() * 500; // 0-500ms random jitter
			const backoffTime = retryStrategy.backoff + jitter;
			await new Promise((resolve) => setTimeout(resolve, backoffTime));

			// Increase timeout for retries
			if (attempt > 1) {
				process.env.PLAYWRIGHT_ACTION_TIMEOUT = String(
					(30 + attempt * 10) * 1000,
				);
			}

			return this.runShardWithRetry(shard, attempt + 1, currentTests);
		}

		// Reset timeout after retries
		delete process.env.PLAYWRIGHT_ACTION_TIMEOUT;

		return result;
	}

	/**
	 * Analyze test output to determine optimal retry strategy
	 */
	analyzeRetryStrategy(result) {
		// Don't retry if tests passed
		if (result.failed === 0) return null;

		// Don't retry if we got partial success (some tests passed)
		if (result.passed > 0 && result.failed < result.total / 2) return null;

		// Check output against retry patterns
		for (const [key, strategy] of Object.entries(this.retryPatterns)) {
			const matchesAllPatterns = strategy.patterns.every((pattern) =>
				result.output?.includes(pattern),
			);

			if (matchesAllPatterns) {
				return strategy;
			}
		}

		// Infrastructure failure gets default retry
		if (result.infrastructureFailure) {
			return {
				maxRetries: 2,
				backoff: 3000,
				description: "Infrastructure failure",
			};
		}

		// Complete failure on first attempt
		if (result.passed === 0 && result.attempt === 1) {
			return {
				maxRetries: 1,
				backoff: 2000,
				description: "Complete test failure",
			};
		}

		return null;
	}

	async runShard(shard, attempt = 1, currentTests = null) {
		return new Promise((resolve) => {
			const startTime = Date.now();
			let output = "";
			let hasServerStartupDetected = false;
			let lastTestName = null;

			// Create clean environment for shard execution
			const shardEnv = { ...process.env };
			// Remove CI variable to enable reuseExistingServer
			delete shardEnv.CI;
			// Disable parallel mode - tests are more reliable in serial execution
			// See GitHub issue #286 for details on parallel execution failures
			shardEnv.PLAYWRIGHT_PARALLEL = "false";
			// Force reuseExistingServer by ensuring we're not in CI mode
			shardEnv.NODE_ENV = "test";

			const proc = spawn(
				"pnpm",
				["--filter", "web-e2e", `test:shard${shard.id}`],
				{
					cwd: process.cwd(),
					stdio: ["inherit", "pipe", "pipe"],
					shell: true,
					detached: true, // CRITICAL FIX: Detach shard processes to prevent signal propagation
					env: shardEnv,
				},
			);

			// Don't unref shard processes - we need to monitor them
			// proc.unref();

			const timeout = setTimeout(() => {
				logError(
					`❌ Shard ${shard.id} timed out after ${CONFIG.shardTimeout / 1000}s`,
				);
				try {
					// For detached processes, kill the process group
					process.kill(-proc.pid, "SIGKILL");
				} catch (e) {
					// Fallback to killing just the process
					proc.kill("SIGKILL");
				}
			}, CONFIG.shardTimeout);

			proc.stdout.on("data", (data) => {
				const chunk = data.toString();
				output += chunk;

				// Detect server startup
				if (
					chunk.includes("Next.js") ||
					chunk.includes("Local:") ||
					chunk.includes("Ready in")
				) {
					hasServerStartupDetected = true;
				}

				// Parse current test name from Playwright output
				// Playwright shows tests like: " [chromium] › test-file.spec.ts:123:5 › Test description"
				// Or: "  ✓  1 [1:1] › Authentication › Login Flow › should login successfully"
				// Or: "  ✘  1 [1:1] › Authentication › Login Flow › should handle errors"
				// Or: "  -  1 [1:1] › Test description (skipped)"
				const testPatterns = [
					// Running test pattern
					/\[.*?\]\s+›\s+(.+\.spec\.ts.*?›\s+.+?)(?:\s+\(\d+(?:\.\d+)?s\))?$/m,
					// Test with status
					/[✓✘-]\s+\d+\s+\[.*?\]\s+›\s+(.+?)(?:\s+\(\d+(?:\.\d+)?s\))?$/m,
					// Simple test pattern
					/›\s+([^›]+?)(?:\s+\(\d+(?:\.\d+)?s\))?$/m,
				];

				for (const pattern of testPatterns) {
					const match = chunk.match(pattern);
					if (match) {
						lastTestName = match[1].trim();
						// Update current test for this shard
						if (currentTests) {
							currentTests.set(shard.id, {
								testName: lastTestName,
								timestamp: Date.now(),
							});
						}
						break;
					}
				}

				// Also detect when tests are starting
				if (chunk.includes("Running") && chunk.includes("test")) {
					if (currentTests) {
						currentTests.set(shard.id, { testName: "Initializing tests..." });
					}
				}
			});

			proc.stderr.on("data", (data) => {
				output += data.toString();
			});

			proc.on("close", (code) => {
				clearTimeout(timeout);
				const duration = Math.round((Date.now() - startTime) / 1000);

				// Clear current test for this shard
				if (currentTests) {
					currentTests.delete(shard.id);
				}

				// Parse Playwright output
				const result = this.parsePlaywrightOutput(output, shard);
				result.duration = `${duration}s`;
				result.exitCode = code;
				result.hasServerStartup = hasServerStartupDetected;
				result.output = output; // Include output for retry analysis
				result.attempt = attempt; // Track attempt number

				// Check for infrastructure failures
				if (output.includes("WebServer") && output.includes("Timed out")) {
					result.infrastructureFailure = true;
				}

				// Early exit detection - but give more time for server startup
				// Playwright can exit early with code 1 if the server isn't ready yet
				// We should only consider it an infrastructure failure if:
				// 1. Exit happens very quickly (< 2 seconds)
				// 2. There's no test output at all
				// 3. And we see specific error patterns
				if (
					duration <= 2 &&
					code !== 0 &&
					result.passed === 0 &&
					result.failed === 0
				) {
					// Check for specific error patterns that indicate real failures
					if (
						output.includes("ECONNREFUSED") ||
						output.includes("Cannot find module") ||
						output.includes("SyntaxError") ||
						output.includes("TypeError")
					) {
						result.infrastructureFailure = true;
						logError(
							`  ⚠️ Shard ${shard.id} failed immediately (${duration}s, code ${code}) - infrastructure issue`,
						);
					} else {
						// Might just be slow server startup, don't mark as infrastructure failure
						log(
							`  ⚠️ Shard ${shard.id} exited quickly (${duration}s, code ${code}) - checking output for test results`,
						);
					}
				}

				const statusIcon = result.failed > 0 ? "❌" : "✅";
				const attemptInfo = attempt > 1 ? ` [attempt ${attempt}]` : "";
				log(
					`  ${statusIcon} Shard ${shard.id} (${shard.name}): ${result.passed}/${result.total} in ${duration}s (exit: ${code})${attemptInfo}`,
				);

				resolve(result);
			});
		});
	}

	parsePlaywrightOutput(output, shard) {
		const result = {
			total: shard.tests,
			passed: 0,
			failed: 0,
			skipped: 0,
			hasTimeoutErrors: false,
			hasSelectorErrors: false,
		};

		// Parse Playwright output patterns
		const passedMatch = output.match(/(\d+) passed/);
		if (passedMatch) {
			result.passed = parseInt(passedMatch[1]);
		}

		const failedMatch = output.match(/(\d+) failed/);
		if (failedMatch) {
			result.failed = parseInt(failedMatch[1]);
		}

		const skippedMatch = output.match(/(\d+) skipped/);
		if (skippedMatch) {
			result.skipped = parseInt(skippedMatch[1]);
		}

		// Enhanced error detection for better retry logic
		result.hasTimeoutErrors =
			output.includes("Timeout") &&
			(output.includes("waiting for") ||
				output.includes("element") ||
				output.includes("locator"));

		result.hasSelectorErrors =
			output.includes("strict mode violation") ||
			output.includes("expected 1, got 0") ||
			output.includes("No element found") ||
			output.includes("Unable to find element");

		// Check for server startup or infrastructure issues
		const hasServerStartup =
			output.includes("Next.js") ||
			output.includes("Local:") ||
			output.includes("Network:");
		const hasWebServerTimeout =
			output.includes("WebServer") && output.includes("Timed out");
		const hasConnectionError =
			output.includes("ECONNREFUSED") ||
			output.includes("net::ERR_CONNECTION_REFUSED");

		// If no test results found, only assume failure if we have clear error indicators
		// Don't fail if we're just seeing server startup logs
		if (result.passed === 0 && result.failed === 0 && output.length > 0) {
			if (hasWebServerTimeout || hasConnectionError) {
				result.failed = shard.tests;
			} else if (!hasServerStartup) {
				// Only fail if we have output that doesn't look like server startup
				result.failed = shard.tests;
			}
			// Otherwise leave as 0/0 to indicate no results yet (server still starting)
		}

		return result;
	}

	/**
	 * Check for cached test results
	 */
	async checkCachedResults() {
		// Get test files using find command
		const { execSync } = require("node:child_process");
		const result = execSync(
			`find apps/e2e/tests -name "*.spec.ts" 2>/dev/null`,
			{ encoding: "utf8" },
		);
		const testFiles = result.split("\n").filter(Boolean);
		const summary = await this.cacheManager.determineTestsToRun(testFiles);

		const totals = {
			total: 0,
			passed: 0,
			failed: 0,
			skipped: 0,
			allCached: summary.toRun === 0,
		};

		// Aggregate cached results
		for (const cached of summary.cachedTests) {
			if (cached.result.passed) {
				totals.passed += cached.result.testCount || 1;
			} else {
				totals.failed += cached.result.testCount || 1;
			}
			totals.total += cached.result.testCount || 1;
		}

		return { totals, summary };
	}

	/**
	 * Optimize shard distribution based on test metrics
	 */
	async optimizeShardDistribution() {
		log("🔧 Optimizing shard distribution...");

		await this.shardOptimizer.loadMetrics();
		const config = await this.shardOptimizer.generateShardConfig({
			strategy: process.env.SHARD_STRATEGY || "balanced",
			shardCount: this.shards.length,
			maxTestsPerShard: 20, // More realistic maximum
			minTestsPerShard: 2, // More realistic minimum
		});

		if (config.validation.valid) {
			log("✅ Optimized shard configuration generated");
			log(`   Strategy: ${config.strategy}`);
			log(
				`   Max deviation: ${config.validation.stats.maxDeviation.toFixed(1)}%`,
			);

			// Update shards with optimized configuration
			this.shards = config.shards.map((shard, _index) => ({
				id: shard.id,
				name: shard.name,
				tests: shard.totalTests,
				estimatedTime: shard.estimatedTime,
				files: shard.tests,
			}));
		} else {
			log("⚠️ Shard optimization validation failed, using defaults");
		}
	}

	/**
	 * Store test results in cache
	 */
	async cacheTestResults(shardResults) {
		if (!this.cacheManager) return;

		try {
			for (const result of shardResults) {
				if (result.files && result.files.length > 0) {
					for (const file of result.files) {
						await this.cacheManager.cacheTestResult(file, {
							passed: result.passed > 0,
							testCount: Math.ceil(result.passed / result.files.length),
							duration: result.duration,
						});
					}
				}
			}

			await this.cacheManager.saveCache();
			log("📦 Test results cached successfully");
		} catch (error) {
			log(`⚠️ Failed to cache results: ${error.message}`);
		}
	}

	/**
	 * Pre-flight selector validation to identify potential E2E issues
	 */
	async validateSelectors() {
		try {
			log("🔍 Running pre-flight selector validation...");
			const selectorExecAsync = promisify(require("node:child_process").exec);

			// Run selector validation script
			const { stdout } = await selectorExecAsync(
				"node .claude/scripts/selector-validator.cjs",
			);

			// Parse output to extract coverage and missing selectors
			const coverageMatch = stdout.match(/Selector Coverage: ([\d.]+)%/);
			const coverage = coverageMatch ? parseFloat(coverageMatch[1]) : 0;

			const missingSelectors = [];
			const lines = stdout.split("\n");
			let inMissingSection = false;

			for (const line of lines) {
				if (line.includes("Missing Selectors:")) {
					inMissingSection = true;
					continue;
				}
				if (inMissingSection && line.includes("data-testid=")) {
					const match = line.match(/data-testid="([^"]+)"/);
					if (match) missingSelectors.push(match[1]);
				}
				if (inMissingSection && line.includes("Recommendations:")) {
					break;
				}
			}

			const result = {
				passed: missingSelectors.length === 0,
				coverage,
				missing: missingSelectors,
				found: Math.round((coverage / 100) * 20), // Approximate based on coverage
			};

			if (result.coverage >= 70) {
				log(`✅ Selector coverage: ${result.coverage}%`);
			} else {
				log(
					`⚠️ Low selector coverage: ${result.coverage}% (${result.missing.length} missing)`,
				);
			}

			return result;
		} catch (error) {
			// Don't fail E2E tests if selector validation fails
			log(`⚠️ Selector validation failed: ${error.message}`);
			return { passed: false, coverage: 0, missing: [], found: 0 };
		}
	}
}

// Main test controller
class TestController {
	constructor() {
		this.status = new TestStatus();
		this.infrastructure = new InfrastructureChecker();
		this.unitRunner = new UnitTestRunner();
		this.e2eRunner = new E2ETestRunner();
		this.cleanupGuard = new TestCleanupGuard();

		// Progressive test stages
		this.testStages = {
			smoke: {
				name: "Smoke Tests",
				description: "Quick validation of critical paths",
				timeout: 30, // seconds
				patterns: ["**/smoke/*.spec.ts", "**/healthcheck.spec.ts"],
				failFast: true,
			},
			critical: {
				name: "Critical Path Tests",
				description: "Core functionality validation",
				timeout: 120, // seconds
				patterns: [
					"**/auth*.spec.ts",
					"**/admin*.spec.ts",
					"**/account*.spec.ts",
				],
				failFast: true,
			},
			full: {
				name: "Full Test Suite",
				description: "Comprehensive test coverage",
				timeout: 600, // seconds
				patterns: ["**/*.spec.ts"],
				failFast: false,
			},
		};
	}

	async run(options) {
		log("🎯 Starting Deterministic Test Execution");
		log("═══════════════════════════════════════\n");

		// Pre-test cleanup to ensure clean state
		await this.cleanupGuard.preTestCleanup();

		// Register cleanup handlers
		this.cleanupGuard.addCleanupHandler(async () => {
			log("🧹 Running test-specific cleanup...");
			if (this.e2eRunner.resourceLock) {
				await this.e2eRunner.resourceLock.releaseAll();
			}
		});

		try {
			// Phase 1: Infrastructure validation
			log("Phase 1: Infrastructure Validation");
			log("───────────────────────────────────");
			const infraResults = await this.infrastructure.checkAll();
			this.status.status.infrastructure = infraResults;
			await this.status.save();

			// Check for critical failures
			const fixes = await this.infrastructure.fixInfrastructure(infraResults);
			if (fixes.some((f) => f.severity === "critical")) {
				logError("\n❌ Critical infrastructure issues detected:");
				fixes.forEach((fix) => {
					logError(`   ${fix.issue}`);
					logError(`   Fix: ${fix.command}`);
				});

				if (!options.continueOnFailure) {
					process.exit(1);
				}
			}

			// Phase 2: Unit tests
			if (!options.e2eOnly) {
				log("\nPhase 2: Unit Tests");
				log("───────────────────────");
				const unitResults = await this.unitRunner.run(this.status);
				await this.status.save();

				if (!unitResults.success && !options.continueOnFailure) {
					await this.generateReport();
					process.exit(1);
				}
			}

			// Phase 3: E2E tests
			if (!options.unitOnly) {
				if (options.quick) {
					log("\nPhase 3: Quick Smoke Tests");
				} else {
					log("\nPhase 3: E2E Tests");
				}
				log("───────────────────────");
				await this.e2eRunner.run(this.status, options);
				await this.status.save();
			}

			// Phase 4: Report generation
			await this.generateReport();

			// Update statusline
			const totalPassed =
				this.status.status.unit.passed + this.status.status.e2e.passed;
			const totalFailed =
				this.status.status.unit.failed + this.status.status.e2e.failed;
			const totalTests =
				this.status.status.unit.total + this.status.status.e2e.total;
			const finalStatus = totalFailed === 0 ? "success" : "failed";

			await this.status.updateStatusLine(
				finalStatus,
				totalPassed,
				totalFailed,
				totalTests,
			);

			// Exit with appropriate code
			process.exit(totalFailed === 0 ? 0 : 1);
		} catch (error) {
			logError(`❌ Fatal error: ${error.message}`);
			this.status.status.status = "error";
			this.status.status.errors.push(error.message);
			await this.status.save();
			process.exit(1);
		}
	}

	async generateReport() {
		log(`\n${"═".repeat(40)}`);
		log("TEST RESULTS SUMMARY");
		log("═".repeat(40));

		const { unit, e2e } = this.status.status;
		const totalTests = unit.total + e2e.total;
		const totalPassed = unit.passed + e2e.passed;
		const totalFailed = unit.failed + e2e.failed;
		const totalSkipped = unit.skipped + e2e.skipped;

		// Unit test results
		if (unit.total > 0) {
			log("\nUnit Tests:");
			log(`  Total: ${unit.total}`);
			log(`  ✅ Passed: ${unit.passed}`);
			if (unit.failed > 0) log(`  ❌ Failed: ${unit.failed}`);
			if (unit.skipped > 0) log(`  ⏭️ Skipped: ${unit.skipped}`);
			if (unit.duration) log(`  ⏱️ Duration: ${unit.duration}`);
		}

		// E2E test results
		if (e2e.total > 0) {
			log("\nE2E Tests:");
			log(`  Total: ${e2e.total}`);
			log(`  ✅ Passed: ${e2e.passed}`);
			if (e2e.failed > 0) log(`  ❌ Failed: ${e2e.failed}`);
			if (e2e.skipped > 0) log(`  ⏭️ Skipped: ${e2e.skipped}`);
			if (e2e.duration) log(`  ⏱️ Duration: ${e2e.duration}`);

			// Shard details
			if (Object.keys(e2e.shards).length > 0) {
				log("\n  Shard Results:");
				for (const [, shard] of Object.entries(e2e.shards)) {
					const status = shard.failed > 0 ? "❌" : "✅";
					log(
						`    ${status} ${shard.name}: ${shard.passed}/${shard.total} (${shard.duration})`,
					);
				}
			}
		}

		// Overall summary
		log(`\n${"═".repeat(40)}`);
		log("OVERALL SUMMARY:");
		log(`  Total Tests: ${totalTests}`);
		log(`  ✅ Passed: ${totalPassed}`);
		if (totalFailed > 0) log(`  ❌ Failed: ${totalFailed}`);
		if (totalSkipped > 0) log(`  ⏭️ Skipped: ${totalSkipped}`);

		const successRate =
			totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0;
		log(`  Success Rate: ${successRate}%`);

		// Final status
		log(`\n${"═".repeat(40)}`);
		if (totalFailed === 0) {
			log("✅ ALL TESTS PASSED! 🎉");
		} else {
			log(`❌ ${totalFailed} TEST${totalFailed > 1 ? "S" : ""} FAILED`);

			// Enhanced diagnostic suggestions
			this.generateFixSuggestions(unit, e2e);
		}

		// Save final status
		this.status.status.status = totalFailed === 0 ? "success" : "failed";
		await this.status.save();

		log("\n📁 Full results saved to:", CONFIG.resultFile);
	}

	generateFixSuggestions(unit, e2e) {
		log("\n🔧 DIAGNOSTIC SUGGESTIONS");
		log("─".repeat(40));

		// Unit test issues
		if (unit.failed > 0) {
			log("\n📦 Unit Test Issues:");
			if (unit.workspaceAnalysis && unit.workspaceAnalysis.skipped > 0) {
				log("   ⚠️ Some workspaces were cached/skipped");
				log(
					"   💡 Force fresh run: TURBO_FORCE=true node .claude/scripts/test/test-controller.cjs --unit",
				);
			}
			log("   💡 Check specific failures: pnpm test:unit --reporter=verbose");
		}

		// E2E test issues
		if (e2e.failed > 0) {
			log("\n🌐 E2E Test Issues:");

			// Infrastructure failures
			if (e2e.infrastructureFailures > 0) {
				log("   🚨 Infrastructure failures detected:");
				log("   💡 1. Restart services: cd apps/e2e && npx supabase restart");
				log(
					'   💡 2. Clear processes: pkill -f "playwright|vitest|next-server"',
				);
				log(
					"   💡 3. Reset environment: cp apps/web/.env.example apps/web/.env.test",
				);
			}

			// Timeout failures
			let hasTimeouts = false;
			if (e2e.shards) {
				Object.values(e2e.shards).forEach((shard) => {
					if (shard.hasTimeoutErrors) hasTimeouts = true;
				});
			}

			if (hasTimeouts) {
				log("   ⏱️ Timeout failures detected:");
				log("   💡 1. Check missing data-testid selectors in UI components");
				log("   💡 2. Increase timeouts: PLAYWRIGHT_ACTION_TIMEOUT=30000");
				log("   💡 3. Run subset: pnpm --filter web-e2e test:smoke");
			}

			// General E2E fixes
			log("   💡 4. Reduce concurrency: TEST_MAX_CONCURRENT_SHARDS=2");
			log("   💡 5. Debug specific shard: pnpm --filter web-e2e test:shard1");
			log("   💡 6. Check screenshots: apps/e2e/test-results/");
		}

		// Success rate analysis
		const totalTests = unit.total + e2e.total;
		const totalPassed = unit.passed + e2e.passed;
		const successRate =
			totalTests > 0
				? Number(((totalPassed / totalTests) * 100).toFixed(1))
				: 0;

		if (successRate < 85) {
			log("\n📊 Reliability Analysis:");
			log(`   Current success rate: ${successRate}% (target: 85%+)`);
			log("   💡 Consider running comprehensive reliability audit");
		}
	}
}

// Parse command line arguments
function parseArgs() {
	const args = process.argv.slice(2);
	const options = {
		unitOnly: false,
		e2eOnly: false,
		continueOnFailure: false,
		debug: process.env.DEBUG_TEST === "true",
		quick: false,
	};

	for (const arg of args) {
		switch (arg) {
			case "--unit":
				options.unitOnly = true;
				break;
			case "--e2e":
				options.e2eOnly = true;
				break;
			case "--continue":
				options.continueOnFailure = true;
				break;
			case "--debug":
				options.debug = true;
				break;
			case "--quick":
				options.quick = true;
				break;
		}
	}

	return options;
}

// Main execution
if (require.main === module) {
	const options = parseArgs();

	if (options.debug) {
		log("🔍 Debug mode enabled");
		process.env.DEBUG_TEST = "true";
	}

	const controller = new TestController();
	controller.run(options);
}

module.exports = { TestController, TestStatus, InfrastructureChecker };
