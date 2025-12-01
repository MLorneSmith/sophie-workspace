/**
 * Infrastructure Manager Module
 * Handles infrastructure validation, setup, and health checks
 */

const { exec } = require("node:child_process");
const fs = require("node:fs").promises;
const path = require("node:path");
const { promisify } = require("node:util");
const execAsync = promisify(exec);
const { ConditionWaiter } = require("../utilities/condition-waiter.cjs");
const { ProcessManager } = require("../utilities/process-manager.cjs");
const {
	verifyPortBindings,
	formatDiagnosticMessage,
} = require("./port-binding-verifier.cjs");
const { getSupabaseConfig } = require("./supabase-config-loader.cjs");

// Simple logging utility
function log(message, type = "info") {
	const timestamp = new Date().toISOString();
	process.stdout.write(`[${timestamp}] ${type.toUpperCase()}: ${message}\n`);
}

function logError(message) {
	log(message, "error");
}

class InfrastructureManager {
	constructor(
		config,
		testStatus,
		cleanupCoordinator = null,
		processManager = null,
	) {
		this.config = config;
		this.testStatus = testStatus;
		this.waiter = new ConditionWaiter();
		this.cleanupCoordinator = cleanupCoordinator;
		this.processManager = processManager || new ProcessManager(config);
	}

	/**
	 * Main infrastructure check and setup
	 */
	async checkAll(unitOnly = false) {
		log("🔍 Running smart pre-flight infrastructure validation...");

		// Phase 1: Quick health checks (< 2 seconds)
		const healthResults = await this.runHealthChecks(unitOnly);

		// Phase 2: Only run startup procedures if health checks fail
		const results = await this.runConditionalSetup(healthResults, unitOnly);

		return results;
	}

	/**
	 * Fast health checks to determine if infrastructure is already running correctly
	 */
	async runHealthChecks(unitOnly = false) {
		log("⚡ Running fast health checks...");
		const results = {
			supabase: await this.healthCheckSupabase(),
			portBindings: await this.healthCheckPortBindings(),
			environment: await this.healthCheckEnvironment(),
			database: await this.healthCheckDatabase(),
			testUsers: await this.healthCheckTestUsers(),
			build: await this.healthCheckBuild(),
			dependencies: await this.healthCheckDependencies(),
		};

		// Only check devServer for E2E tests
		if (!unitOnly) {
			results.devServer = await this.healthCheckDevServer();
		} else {
			results.devServer = "healthy"; // Skip devServer for unit tests
		}

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
	async runConditionalSetup(healthResults, unitOnly = false) {
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

		if (healthResults.devServer !== "healthy" && !unitOnly) {
			// Check if we have Docker containers available before trying to setup dev server
			const dockerAvailable = await this.checkDockerContainer();
			if (dockerAvailable) {
				log("🐳 Docker container detected - skipping dev server setup");
				setupResults.devServer = "docker_container";
			} else {
				log("🌐 Setting up dev server...");
				setupResults.devServer = await this.setupDevServer();
				needsVerification = true;
			}
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
				"devServer",
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
			// Get dynamic Supabase configuration
			const supabaseConfig = getSupabaseConfig();
			const apiUrl =
				supabaseConfig.API_URL ||
				`http://127.0.0.1:${this.config.ports.supabase.api}`;
			const anonKey =
				process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || supabaseConfig.ANON_KEY;

			const response = await fetch(`${apiUrl}/rest/v1/`, {
				signal: AbortSignal.timeout(2000),
				headers: {
					apikey: anonKey,
				},
			});

			// 200 means API is running, 401 means auth is required but API is responsive
			if (response.status === 200 || response.status === 401) {
				// Also check if we can get status (non-critical if it fails)
				try {
					const { stdout } = await execAsync(
						"cd apps/web && npx supabase status 2>&1 | head -1", // Updated to use Web Supabase
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
	 * Health check for Docker port bindings (WSL2 specific)
	 * Detects port binding proxy failures before they cause long timeouts
	 */
	async healthCheckPortBindings() {
		try {
			// Only check if Supabase is running
			const supabaseStatus = await execAsync(
				"cd apps/web && npx supabase status 2>&1 | head -1",
				{ timeout: 2000 },
			).catch(() => ({ stdout: "" }));

			if (!supabaseStatus.stdout.includes("running")) {
				return "not_running"; // Skip if Supabase not running yet
			}

			// Verify port bindings for critical Supabase containers
			const containerName = "supabase_kong_2025slideheroes-db";
			const report = await verifyPortBindings(
				containerName,
				[54521, 54522, 54523],
				{
					retries: 1,
					throwOnFailure: false,
				},
			);

			if (report.isHealthy) {
				return "healthy";
			}

			// Port binding failure detected - log diagnostic info
			const message = formatDiagnosticMessage(report);
			logError(message);

			return "port_binding_failed";
		} catch (error) {
			// If verification itself fails, don't block - could be transient
			return "cannot_verify";
		}
	}

	/**
	 * Health check for environment
	 */
	async healthCheckEnvironment() {
		try {
			// Check for locked test environment first (unified architecture)
			const lockedEnvPath = path.join(
				process.cwd(),
				"apps/web/.env.test.locked",
			);
			const testEnvPath = path.join(process.cwd(), "apps/web/.env.test");

			// Prefer locked environment if it exists
			let envPath = null;
			if (await this.fileExists(lockedEnvPath)) {
				envPath = lockedEnvPath;
			} else if (await this.fileExists(testEnvPath)) {
				envPath = testEnvPath;
			} else {
				return "missing";
			}

			// Quick validation of critical env vars
			const content = await fs.readFile(envPath, "utf8");
			const requiredVars = [
				"NEXT_PUBLIC_AUTH_PASSWORD",
				"NEXT_PUBLIC_SUPABASE_URL",
				"NEXT_PUBLIC_SUPABASE_ANON_KEY",
			];
			const hasRequired = requiredVars.every((v) => content.includes(v));

			if (hasRequired) {
				return "healthy";
			}

			return "incomplete";
		} catch {
			return "missing";
		}
	}

	/**
	 * Health check for database connection
	 */
	async healthCheckDatabase() {
		try {
			// Get dynamic Supabase configuration
			const supabaseConfig = getSupabaseConfig();
			const apiUrl =
				supabaseConfig.API_URL ||
				`http://127.0.0.1:${this.config.ports.supabase.api}`;
			const anonKey =
				process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || supabaseConfig.ANON_KEY;

			const response = await fetch(`${apiUrl}/rest/v1/`, {
				signal: AbortSignal.timeout(2000),
				headers: {
					apikey: anonKey,
				},
			});

			if (response.status === 401 || response.status === 200) {
				// 401 is expected without proper auth, means DB is responding
				return "healthy";
			}

			return "connection_failed";
		} catch (_error) {
			return "not_accessible";
		}
	}

	/**
	 * Health check for test users
	 */
	async healthCheckTestUsers() {
		try {
			// Get dynamic Supabase configuration
			const supabaseConfig = getSupabaseConfig();
			const apiUrl =
				supabaseConfig.API_URL ||
				`http://127.0.0.1:${this.config.ports.supabase.api}`;
			const serviceRoleKey =
				process.env.SUPABASE_SERVICE_ROLE_KEY ||
				supabaseConfig.SERVICE_ROLE_KEY;

			// Query the onboarding table in unified Web database for our test users
			const response = await fetch(
				`${apiUrl}/rest/v1/onboarding?select=user_id`,
				{
					signal: AbortSignal.timeout(3000),
					headers: {
						apikey: serviceRoleKey,
						Authorization: `Bearer ${serviceRoleKey}`,
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
	 * Check if Docker container is available and healthy
	 */
	async checkDockerContainer() {
		try {
			const { stdout: dockerCheck } = await execAsync(
				'docker ps --format "{{.Names}}:{{.State}}:{{.Ports}}" | grep -E "slideheroes-app-test" || echo ""',
			);

			if (
				dockerCheck.includes("slideheroes-app-test") &&
				dockerCheck.includes("3001")
			) {
				// Comprehensive container health check
				const healthStatus = await this.validateContainerHealth();
				if (healthStatus.healthy) {
					// Set environment variables for E2E tests to use port 3001
					process.env.TEST_BASE_URL = "http://localhost:3001";
					process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3001";
					return true;
				} else {
					log(`⚠️ Docker container unhealthy: ${healthStatus.reason}`);
					return false;
				}
			}
			return false;
		} catch {
			return false;
		}
	}

	/**
	 * Comprehensive container health validation
	 */
	async validateContainerHealth() {
		const baseUrl = "http://localhost:3001";
		const healthStatus = {
			healthy: false,
			reason: "Unknown error",
			checks: {
				healthEndpoint: false,
				homePage: false,
				apiResponse: false,
				applicationReady: false,
			},
		};

		try {
			// Check 1: Health endpoint
			log("  🔍 Checking health endpoint...");
			const healthResponse = await fetch(`${baseUrl}/api/health`, {
				signal: AbortSignal.timeout(5000),
			});

			if (healthResponse.status === 200) {
				healthStatus.checks.healthEndpoint = true;
				log("  ✅ Health endpoint responding");
			} else {
				healthStatus.reason = `Health endpoint returned ${healthResponse.status}`;
				log(`  ❌ Health endpoint failed: ${healthResponse.status}`);
				return healthStatus;
			}

			// Check 2: Home page loads with content
			log("  🔍 Checking home page content...");
			const homeResponse = await fetch(baseUrl, {
				signal: AbortSignal.timeout(10000),
				headers: { Accept: "text/html" },
			});

			if (homeResponse.status === 200) {
				const htmlContent = await homeResponse.text();
				if (htmlContent.includes("SlideHeroes") && htmlContent.length > 1000) {
					healthStatus.checks.homePage = true;
					log("  ✅ Home page loads with content");
				} else {
					healthStatus.reason =
						"Home page loads but missing content or too small";
					log("  ❌ Home page content insufficient");
					return healthStatus;
				}
			} else {
				healthStatus.reason = `Home page returned ${homeResponse.status}`;
				log(`  ❌ Home page failed: ${homeResponse.status}`);
				return healthStatus;
			}

			// Check 3: API functionality
			log("  🔍 Checking API responsiveness...");
			try {
				const apiResponse = await fetch(`${baseUrl}/api/health`, {
					signal: AbortSignal.timeout(3000),
				});
				const apiData = await apiResponse.json();
				if (apiData && typeof apiData === "object") {
					healthStatus.checks.apiResponse = true;
					log("  ✅ API responding with valid JSON");
				}
			} catch (_apiError) {
				log("  ⚠️ API check failed but continuing");
			}

			// Check 4: Application readiness (check for common Next.js indicators)
			if (healthStatus.checks.healthEndpoint && healthStatus.checks.homePage) {
				healthStatus.checks.applicationReady = true;
				healthStatus.healthy = true;
				healthStatus.reason = "All checks passed";
				log("  ✅ Container application is fully healthy");
			}

			return healthStatus;
		} catch (error) {
			healthStatus.reason = `Container validation error: ${error.message}`;
			log(`  ❌ Container validation failed: ${error.message}`);
			return healthStatus;
		}
	}

	/**
	 * Health check for dev server
	 */
	async healthCheckDevServer() {
		try {
			// First check if we're using Docker container on port 3001
			const { stdout: dockerCheck } = await execAsync(
				'docker ps --format "{{.Names}}:{{.State}}:{{.Ports}}" | grep -E "slideheroes-app-test" || echo ""',
			);

			if (
				dockerCheck.includes("slideheroes-app-test") &&
				dockerCheck.includes("3001")
			) {
				// Check Docker container health
				try {
					const response = await fetch("http://localhost:3001/api/health", {
						signal: AbortSignal.timeout(5000),
					});

					if (response.ok) {
						// Set environment variables for E2E tests
						process.env.TEST_BASE_URL = "http://localhost:3001";
						process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3001";
						return "healthy";
					}
				} catch (_error) {
					return "docker_unhealthy";
				}
			}

			// Check if external server is configured
			if (
				process.env.TEST_BASE_URL &&
				process.env.TEST_BASE_URL !== "http://localhost:3000"
			) {
				try {
					const response = await fetch(
						`${process.env.TEST_BASE_URL}/api/health`,
						{
							signal: AbortSignal.timeout(5000),
						},
					);

					if (response.ok) {
						return "healthy";
					}
				} catch (_error) {
					return "external_unhealthy";
				}
			}

			// Default check for port 3000
			const { stdout: portCheck } = await execAsync(
				"lsof -ti:3000 2>/dev/null || echo 'none'",
				{ timeout: 1000 },
			);

			if (portCheck.trim() === "none") {
				return "not_running";
			}

			// Try to actually fetch from the server with a longer timeout
			// Next.js dev server can be slow to respond initially
			try {
				const controller = new AbortController();
				const timeoutId = setTimeout(() => controller.abort(), 5000);

				const response = await fetch("http://localhost:3000", {
					signal: controller.signal,
					headers: {
						Accept: "text/html",
					},
				});

				clearTimeout(timeoutId);

				// Any successful response (200, 301, 302, 304) means server is running
				if (response.status >= 200 && response.status < 400) {
					return "healthy";
				}
			} catch (fetchError) {
				// Fetch failed, but process exists, server might be starting
				if (fetchError.name === "AbortError") {
					// Timeout - server is probably still starting
					return "starting";
				}
			}

			// Final fallback - try curl with a redirect follow
			try {
				const { stdout } = await execAsync(
					'curl -s -o /dev/null -w "%{http_code}" -L http://localhost:3000 2>/dev/null || echo "000"',
					{ timeout: 3000 },
				);
				const statusCode = stdout.trim();
				if (
					statusCode === "200" ||
					statusCode === "301" ||
					statusCode === "302"
				) {
					return "healthy";
				}
			} catch {
				// Curl also failed
			}

			return "not_running";
		} catch {
			return "not_running";
		}
	}

	/**
	 * Health check for Payload CMS server (used by shards 7 and 8)
	 * Payload runs on port 3021 in test mode (dev:test script)
	 */
	async healthCheckPayloadServer() {
		const payloadPort = 3021; // Test port from apps/payload/package.json dev:test
		const payloadUrl = `http://localhost:${payloadPort}`;

		try {
			// Check if process is running on the port
			const { stdout: portCheck } = await execAsync(
				`lsof -ti:${payloadPort} 2>/dev/null || echo 'none'`,
				{ timeout: 1000 },
			);

			if (portCheck.trim() === "none") {
				return "not_running";
			}

			// Try to fetch from the Payload health endpoint
			try {
				const response = await fetch(`${payloadUrl}/api/health`, {
					signal: AbortSignal.timeout(5000),
				});

				if (response.ok) {
					log(`✅ Payload CMS server healthy on port ${payloadPort}`);
					return "healthy";
				}
			} catch (fetchError) {
				if (fetchError.name === "AbortError") {
					return "starting";
				}
			}

			// Try the admin login page as fallback
			try {
				const response = await fetch(`${payloadUrl}/admin/login`, {
					signal: AbortSignal.timeout(5000),
				});

				if (response.status >= 200 && response.status < 400) {
					log(`✅ Payload CMS server responding on port ${payloadPort}`);
					return "healthy";
				}
			} catch {
				// Admin page also failed
			}

			return "not_running";
		} catch {
			return "not_running";
		}
	}

	/**
	 * Setup Payload CMS server for E2E tests (shards 7 and 8)
	 * Uses dev:test script which runs on port 3021
	 */
	async setupPayloadServer() {
		const payloadPort = 3021;

		try {
			// Check if already running
			const status = await this.healthCheckPayloadServer();
			if (status === "healthy") {
				log("✅ Payload CMS server already running on port 3021");
				return "already_running";
			}

			log("🚀 Starting Payload CMS server on port 3021...");

			// Clear port if something is stuck - more aggressive approach
			try {
				const { stdout: pids } = await execAsync(
					`lsof -ti:${payloadPort} 2>/dev/null || echo ""`,
				);
				if (pids.trim()) {
					log(`  🧹 Clearing existing processes on port ${payloadPort}...`);
					await execAsync(`kill -9 ${pids.trim().split('\n').join(' ')} 2>/dev/null || true`);
					await new Promise((resolve) => setTimeout(resolve, 2000));
				}
			} catch {
				// Port is likely free
			}

			// Also kill any existing payload dev processes
			try {
				await execAsync('pkill -f "payload.*dev" 2>/dev/null || true');
			} catch {
				// Process might not exist - this is expected
			}
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// Start Payload with dev:test script (uses port 3021)
			const payloadProcess = exec("pnpm --filter payload dev:test", {
				cwd: process.cwd(),
				env: {
					...process.env,
					NODE_ENV: "test",
					FORCE_COLOR: "0",
				},
			});

			// Store reference for cleanup (on this instance)
			this.payloadProcess = payloadProcess;

			// Log output for debugging
			payloadProcess.stdout?.on("data", (data) => {
				const output = data.toString().trim();
				if (output.includes("Ready") || output.includes("Local:") || output.includes("error")) {
					log(`  📦 Payload: ${output}`);
				}
			});

			payloadProcess.stderr?.on("data", (data) => {
				const output = data.toString().trim();
				if (output && !output.includes("ExperimentalWarning")) {
					log(`  📦 Payload stderr: ${output}`);
				}
			});

			// Wait for Payload to be ready
			log("⏳ Waiting for Payload CMS to be ready...");
			const maxWaitTime = 60000; // 60 seconds
			const startTime = Date.now();
			const checkInterval = 2000;

			while (Date.now() - startTime < maxWaitTime) {
				const checkStatus = await this.healthCheckPayloadServer();
				if (checkStatus === "healthy") {
					log("✅ Payload CMS server is ready");
					return "started";
				}
				await new Promise((resolve) => setTimeout(resolve, checkInterval));
			}

			logError("❌ Payload CMS server failed to start within timeout");
			return "failed";
		} catch (error) {
			logError(`Failed to setup Payload server: ${error.message}`);
			return "failed";
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
				log("Starting Web Supabase...");
				const _proc = exec("cd apps/web && npx supabase start"); // Use Web Supabase

				// Wait for Supabase to be ready using ConditionWaiter
				await this.waiter.waitForSupabase({
					timeout: 120000,
					name: "Web Supabase startup",
				});

				return "started";
			} else if (status === "needs_restart") {
				log("Restarting Web Supabase...");
				await execAsync("cd apps/web && npx supabase stop"); // Use Web Supabase
				await this.waiter.delay(3000, "Supabase shutdown");

				const _proc = exec("cd apps/web && npx supabase start"); // Use Web Supabase
				await this.waiter.waitForSupabase({
					timeout: 120000,
					name: "Web Supabase restart",
				});

				return "restarted";
			}

			return "already_running";
		} catch (error) {
			logError(`Failed to setup Web Supabase: ${error.message}`);
			return "failed";
		}
	}

	/**
	 * Setup environment variables
	 */
	async setupEnvironment() {
		try {
			// Check for locked test environment first (unified architecture)
			const lockedEnvPath = path.join(
				process.cwd(),
				"apps/web/.env.test.locked",
			);
			const testEnvPath = path.join(process.cwd(), "apps/web/.env.test");
			const envPath = path.join(process.cwd(), "apps/web/.env");

			// Prefer locked environment if it exists
			let targetEnvPath = null;
			if (await this.fileExists(lockedEnvPath)) {
				targetEnvPath = lockedEnvPath;
				log("Using locked test environment (.env.test.locked)");
			} else if (await this.fileExists(testEnvPath)) {
				targetEnvPath = testEnvPath;
				log("Using test environment (.env.test)");
			} else if (await this.fileExists(envPath)) {
				targetEnvPath = envPath;
				log("Using default environment (.env)");
			}

			if (targetEnvPath) {
				const envContent = await fs.readFile(targetEnvPath, "utf-8");
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
			} else {
				// Create default .env.test file with unified architecture settings
				log("Creating default test environment file...");
				// Note: Passwords should be configured in .env.test.locked for security
				// Get dynamic Supabase configuration for default env
				const supabaseConfig = getSupabaseConfig();
				const supabaseUrl = supabaseConfig.API_URL || "http://localhost:54521";
				const anonKey = supabaseConfig.ANON_KEY;
				const serviceRoleKey = supabaseConfig.SERVICE_ROLE_KEY;
				const dbUrl =
					supabaseConfig.DB_URL ||
					"postgresql://postgres:postgres@localhost:54522/postgres";

				log(`Using dynamic Supabase config - URL: ${supabaseUrl}`);

				const defaultEnv = `
# Unified Web Supabase Configuration (dynamically detected)
NEXT_PUBLIC_APP_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${anonKey}
SUPABASE_SERVICE_ROLE_KEY=${serviceRoleKey}
DATABASE_URL=${dbUrl}

# Test User Configuration - IMPORTANT: Configure passwords in .env.test.locked
E2E_TEST_USER_EMAIL=test1@slideheroes.com
E2E_OWNER_EMAIL=test1@slideheroes.com
E2E_ADMIN_EMAIL=michael@slideheroes.com
# Passwords must be set in .env.test.locked for security
				`.trim();

				await fs.writeFile(testEnvPath, defaultEnv);

				// Set environment variables
				for (const line of defaultEnv.split("\n")) {
					if (!line.startsWith("#") && line.includes("=")) {
						const [key, ...valueParts] = line.split("=");
						if (key) {
							process.env[key.trim()] = valueParts.join("=").trim();
						}
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
			// Wait for Web Supabase API to be accessible
			const apiUrl =
				this.config.environment.SUPABASE_URL ||
				`http://localhost:${this.config.ports.supabase.api}`;
			await this.waiter.waitForHttp(apiUrl, {
				timeout: 60000,
				name: "Web Supabase API",
			});

			// Run migrations from Web Supabase if needed
			try {
				await execAsync("cd apps/web && npx supabase db push");
				log("✅ Database migrations applied from apps/web");
			} catch {
				log("⚠️ Migrations may already be applied");
			}

			// Reset database with seed data if specified
			if (process.env.RESET_DATABASE === "true") {
				try {
					await execAsync("cd apps/web && npx supabase db reset");
					log("✅ Database reset with seed data from apps/web/supabase/seeds/");
				} catch (error) {
					logError(`⚠️ Database reset failed: ${error.message}`);
				}
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
	 * Setup dev server for E2E tests with enhanced cleanup
	 */
	async setupDevServer() {
		try {
			// First, check if we have a Docker container running the test server
			const { stdout: dockerCheck } = await execAsync(
				'docker ps --format "{{.Names}}:{{.State}}:{{.Ports}}" | grep -E "slideheroes-app-test" || echo ""',
			);

			if (
				dockerCheck.includes("slideheroes-app-test") &&
				dockerCheck.includes("3001")
			) {
				log("🐳 Docker test container detected on port 3001");

				// Verify the container server is healthy
				const testUrl = "http://localhost:3001";
				try {
					const response = await fetch(`${testUrl}/api/health`, {
						signal: AbortSignal.timeout(5000),
					});

					if (response.ok) {
						log("✅ Docker test server is healthy on port 3001");
						// Set environment variables for E2E tests to use port 3001
						process.env.TEST_BASE_URL = testUrl;
						process.env.NEXT_PUBLIC_APP_URL = testUrl;
						return "docker_container";
					}
				} catch (_error) {
					log("⚠️ Docker test server not responding, will try to restart");
				}
			}

			// Skip dev server setup if using external server (e.g., containerized)
			if (process.env.SKIP_DEV_SERVER === "true") {
				const testUrl = process.env.TEST_BASE_URL || "http://localhost:3001";
				log(`⚙️ Using external test server at ${testUrl}`);

				// Verify external server is healthy
				try {
					const response = await fetch(`${testUrl}/api/health`);
					const data = await response.json();
					if (data.status === "ready") {
						log("✅ External test server is healthy");
						return "external_server";
					}
				} catch (error) {
					logError(`External test server not responding: ${error.message}`);
					throw new Error("External test server is not available");
				}
			}

			// Check if server is already running on port 3000
			const status = await this.healthCheckDevServer();
			if (status === "healthy") {
				log("✅ Dev server already running on port 3000");
				return "already_running";
			}

			// Enhanced port cleanup with verification
			log("🧹 Clearing port 3000...");

			// Use cleanup coordinator if available, otherwise direct cleanup
			let portCleared;
			if (this.cleanupCoordinator) {
				portCleared = await this.cleanupCoordinator.clearPort(
					3000,
					this.processManager,
				);
			} else {
				portCleared = await this.processManager.killPort(3000, {
					maxRetries: 3,
					waitTime: 2000,
				});
			}

			if (!portCleared) {
				logError("⚠️ Failed to clear port 3000 completely");
			}

			// Additional cleanup for Next.js specific processes
			try {
				await execAsync('pkill -f "next.*dev.*3000" 2>/dev/null || true');
			} catch {
				// Process might not exist - this is expected
			}
			try {
				await execAsync('pkill -f "node.*next.*3000" 2>/dev/null || true');
			} catch {
				// Process might not exist - this is expected
			}

			// Wait for OS to fully release the port
			log("⏱️ Waiting 3s for port cleanup...");
			await this.waiter.delay(3000, "Port release");

			// Verify port is actually free before starting
			try {
				const portFree = await this.waiter.waitForCondition(
					async () => {
						const { stdout } = await execAsync(
							"lsof -ti:3000 2>/dev/null || true",
						);
						return !stdout.trim();
					},
					{ timeout: 10000, interval: 500, name: "port 3000 to be free" },
				);

				if (!portFree) {
					throw new Error("Port 3000 still in use after cleanup");
				}
			} catch (error) {
				logError(`Port verification failed: ${error.message}`);
				// Try one more aggressive cleanup
				try {
					await execAsync("fuser -k 3000/tcp 2>/dev/null || true");
				} catch {
					// Port might already be free - this is expected
				}
				await this.waiter.delay(2000, "Final port cleanup");
			}

			// Start the dev server
			log("🚀 Starting dev server on port 3000...");
			const { spawn } = require("node:child_process");
			const devServer = spawn("pnpm", ["--filter", "web", "dev:test"], {
				cwd: process.cwd(),
				stdio: ["ignore", "pipe", "pipe"],
				shell: true,
				detached: true, // CRITICAL: Detach to prevent signal propagation
				env: {
					...process.env,
					PORT: "3000",
					NODE_ENV: "test",
					NEXT_PUBLIC_APP_URL: "http://localhost:3000",
					FORCE_COLOR: "0",
				},
			});

			// Store reference for cleanup
			if (!global.devServerProcess) {
				global.devServerProcess = devServer;
			}

			// Handle stdout/stderr to detect startup issues
			let _serverReady = false;
			devServer.stdout.on("data", (data) => {
				const output = data.toString();
				if (output.includes("ready") || output.includes("started on")) {
					_serverReady = true;
				}
				if (this.config.execution?.debug) {
					log(`[dev-server]: ${output.trim()}`);
				}
			});

			devServer.stderr.on("data", (data) => {
				const output = data.toString();
				// Ignore common warnings
				if (!output.includes("Warning") && !output.includes("Deprecation")) {
					logError(`[dev-server error]: ${output.trim()}`);
				}
			});

			devServer.on("error", (error) => {
				logError(`Failed to start dev server: ${error.message}`);
			});

			// Wait for server to be ready
			log("⏳ Waiting for dev server to be ready...");
			await this.waiter.waitForHttp("http://localhost:3000", {
				timeout: 60000,
				interval: 2000,
				name: "dev server startup",
			});

			// Verify it's actually working
			const verifyStatus = await this.healthCheckDevServer();
			if (verifyStatus === "healthy") {
				log("✅ Dev server started successfully on port 3000");
				return "started";
			} else {
				logError("⚠️ Dev server started but health check failed");
				return "unhealthy";
			}
		} catch (error) {
			logError(`Failed to setup dev server: ${error.message}`);
			return "failed";
		}
	}

	/**
	 * Cleanup ports
	 */
	async cleanupPorts() {
		try {
			log("🧹 Cleaning up test ports...");

			let portsToClean = [
				this.config.ports.web,
				this.config.ports.webTest,
				this.config.ports.payload,
			];

			// Skip Docker container ports to avoid signal propagation issues
			const dockerAvailable = await this.checkDockerContainer();
			if (dockerAvailable) {
				log(
					"🐳 Skipping Docker container port cleanup (3001) to avoid signal conflicts",
				);
				portsToClean = portsToClean.filter((port) => port !== 3001);
			}

			let portsCleared = 0;
			for (const port of portsToClean) {
				try {
					const { stdout } = await execAsync(
						`lsof -ti:${port} 2>/dev/null || echo "free"`,
					);
					if (stdout.trim() !== "free") {
						log(`  🔧 Clearing port ${port}...`);
						// Use more gentle approach - SIGTERM first, then SIGKILL if needed
						await execAsync(
							`lsof -ti:${port} | xargs -r kill 2>/dev/null || true`,
						);
						// Wait briefly for graceful shutdown
						await new Promise((resolve) => setTimeout(resolve, 500));

						// Check if still in use, force kill if needed
						const { stdout: stillUsed } = await execAsync(
							`lsof -ti:${port} 2>/dev/null || echo "free"`,
						);
						if (stillUsed.trim() !== "free") {
							await execAsync(
								`lsof -ti:${port} | xargs -r kill -9 2>/dev/null || true`,
							);
						}
						log(`  ✅ Cleared port ${port}`);
						portsCleared++;
					}
				} catch {
					// Port already free or error clearing
				}
			}

			if (portsCleared === 0) {
				log("  ✅ All ports already free");
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

		// Stop Web Supabase
		try {
			await execAsync("cd apps/web && npx supabase stop");
			log("✅ Web Supabase stopped");
		} catch {
			// Already stopped
			log("⚠️ Web Supabase was not running");
		}

		// Wait for everything to settle
		await this.waiter.delay(3000, "infrastructure reset");

		log("✅ Infrastructure reset complete");
	}
}

module.exports = { InfrastructureManager };
