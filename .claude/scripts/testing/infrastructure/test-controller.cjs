#!/usr/bin/env node

/**
 * Modular Test Controller
 * Orchestrates test execution using specialized modules
 *
 * This refactored version addresses:
 * - Monolithic code structure (3700+ lines → < 500 lines)
 * - Hardcoded delays (replaced with condition-based waiting)
 * - Missing phase timeouts (30-second timeouts for all phases)
 * - No error recovery (automatic recovery mechanisms)
 * - Untestable infrastructure (modular design enables testing)
 */

// Import modules
const { CONFIG, validateConfig } = require("../config/test-config.cjs");
const { TestStatus } = require("../utilities/test-status.cjs");
const { PhaseCoordinator } = require("./phase-coordinator.cjs");
const { InfrastructureManager } = require("./infrastructure-manager.cjs");
const { UnitTestRunner } = require("../runners/unit-test-runner.cjs");
const { E2ETestRunner } = require("../runners/e2e-test-runner.cjs");
const { ProcessManager } = require("../utilities/process-manager.cjs");
const { TestReporter } = require("../utilities/test-reporter.cjs");
const { ConditionWaiter } = require("../utilities/condition-waiter.cjs");
const { ResourceLock } = require("../resource-lock.cjs");
const { TestCleanupGuard } = require("../utilities/test-cleanup-guard.cjs");
const { TestHealthMonitor } = require("../utilities/test-health-monitor.cjs");

// Simple logging utility
function log(message, type = "info") {
	const timestamp = new Date().toISOString();
	process.stdout.write(`[${timestamp}] ${type.toUpperCase()}: ${message}\n`);
}

function logError(message) {
	log(message, "error");
}

/**
 * Main Test Controller Class
 * Orchestrates all test phases using specialized modules
 */
class TestController {
	constructor(options = {}) {
		// Override config if needed
		if (options.config) {
			Object.assign(CONFIG, options.config);
		}

		// Validate configuration
		try {
			validateConfig();
		} catch (error) {
			logError(`Configuration validation failed: ${error.message}`);
			process.exit(1);
		}

		// Initialize cleanup coordinator to prevent race conditions
		this.cleanupCoordinator = {
			portsCleared: new Set(),
			processesCleaned: new Set(),

			async clearPort(port, processManager) {
				if (this.portsCleared.has(port)) {
					log(`Port ${port} already cleared in this session`);
					return true;
				}

				// Perform actual cleanup with enhanced options
				const cleared = await processManager.killPort(port, {
					maxRetries: 3,
					waitTime: 2000,
				});

				if (cleared) {
					this.portsCleared.add(port);
				}
				return cleared;
			},

			async cleanProcess(pattern, execAsync) {
				if (this.processesCleaned.has(pattern)) {
					log(`Process pattern '${pattern}' already cleaned`);
					return true;
				}

				await execAsync(`pkill -f "${pattern}" 2>/dev/null || true`);
				this.processesCleaned.add(pattern);
				return true;
			},

			reset() {
				this.portsCleared.clear();
				this.processesCleaned.clear();
			},
		};

		// Initialize modules
		this.testStatus = new TestStatus({
			resultFile: CONFIG.paths.resultFile,
			statusFile: CONFIG.paths.statusFile,
		});
		this.phaseCoordinator = new PhaseCoordinator(this.testStatus);
		this.processManager = new ProcessManager(CONFIG);

		// Pass cleanup coordinator to infrastructure manager
		this.infrastructureManager = new InfrastructureManager(
			CONFIG,
			this.testStatus,
			this.cleanupCoordinator,
			this.processManager,
		);

		this.testReporter = new TestReporter(CONFIG, this.testStatus);
		this.waiter = new ConditionWaiter();
		this.healthMonitor = new TestHealthMonitor(CONFIG);

		// Initialize resource management
		this.resourceLock = new ResourceLock();
		this.cleanupGuard = new TestCleanupGuard();

		// Initialize test runners
		this.unitTestRunner = new UnitTestRunner(
			CONFIG,
			this.testStatus,
			this.phaseCoordinator,
		);

		this.e2eTestRunner = new E2ETestRunner(
			CONFIG,
			this.testStatus,
			this.phaseCoordinator,
			this.resourceLock,
		);

		// Parse command line arguments
		this.options = this.parseArguments(process.argv.slice(2));
	}

	/**
	 * Parse command line arguments
	 */
	parseArguments(args) {
		const options = {
			skipUnit: false,
			skipE2E: false,
			quickCheck: false,
			debug: false,
			verbose: false,
			unitOnly: false,
		};

		for (const arg of args) {
			switch (arg) {
				case "--skip-unit":
					options.skipUnit = true;
					break;
				case "--skip-e2e":
					options.skipE2E = true;
					break;
				case "--unit":
					options.unitOnly = true;
					options.skipE2E = true;
					break;
				case "--quick":
					options.quickCheck = true;
					break;
				case "--debug":
					options.debug = true;
					CONFIG.execution.debug = true;
					break;
				case "--verbose":
					options.verbose = true;
					CONFIG.execution.verbose = true;
					break;
				case "--help":
					this.showHelp();
					process.exit(0);
			}
		}

		return options;
	}

	/**
	 * Validate E2E test readiness with comprehensive checks
	 */
	async validateE2EReadiness() {
		const readinessResult = {
			ready: false,
			reason: "Unknown validation error",
			suggestions: [],
			checks: {
				serverHealth: false,
				containerHealth: false,
				applicationResponse: false,
				authEndpoints: false,
			},
		};

		try {
			log("🔍 Validating E2E test readiness...");

			// Check 1: Test server availability
			const testUrl = process.env.TEST_BASE_URL || "http://localhost:3001";
			log(`  🔍 Checking server at ${testUrl}...`);

			try {
				const response = await fetch(`${testUrl}/api/health`, {
					signal: AbortSignal.timeout(5000),
				});

				if (response.status === 200) {
					readinessResult.checks.serverHealth = true;
					log("  ✅ Server health check passed");
				} else if (response.status === 503) {
					readinessResult.reason =
						"Server is starting up (503 Service Unavailable)";
					readinessResult.suggestions.push(
						"Wait a few minutes for the server to fully start up",
						"Check container logs: docker logs slideheroes-app-test",
					);
					return readinessResult;
				} else {
					readinessResult.reason = `Server health check failed (${response.status})`;
					readinessResult.suggestions.push(
						"Check server logs for errors",
						"Verify the application is running correctly",
						"Try restarting the container: docker restart slideheroes-app-test",
					);
					return readinessResult;
				}
			} catch (fetchError) {
				readinessResult.reason = `Cannot reach test server: ${fetchError.message}`;
				readinessResult.suggestions.push(
					"Ensure the test server is running",
					"Check if port 3001 is accessible",
					"Verify Docker container is running: docker ps | grep slideheroes",
				);
				return readinessResult;
			}

			// Check 2: Container-specific health (if using Docker)
			const dockerAvailable =
				await this.infrastructureManager.checkDockerContainer();
			if (dockerAvailable) {
				readinessResult.checks.containerHealth = true;
				log("  ✅ Docker container is healthy");
			}

			// Check 3: Application response with content
			log("  🔍 Checking application content...");
			try {
				const homeResponse = await fetch(testUrl, {
					signal: AbortSignal.timeout(10000),
					headers: { Accept: "text/html" },
				});

				if (homeResponse.status === 200) {
					const htmlContent = await homeResponse.text();
					if (
						htmlContent.includes("SlideHeroes") &&
						htmlContent.length > 1000
					) {
						readinessResult.checks.applicationResponse = true;
						log("  ✅ Application serving content correctly");
					} else {
						readinessResult.reason =
							"Application loads but content is missing or incomplete";
						readinessResult.suggestions.push(
							"Check application build and deployment",
							"Verify environment variables are set correctly",
							"Check browser console for JavaScript errors",
						);
						return readinessResult;
					}
				} else {
					readinessResult.reason = `Home page returned ${homeResponse.status}`;
					readinessResult.suggestions.push(
						"Check application routing configuration",
						"Verify the Next.js application is built correctly",
					);
					return readinessResult;
				}
			} catch (contentError) {
				readinessResult.reason = `Application content check failed: ${contentError.message}`;
				readinessResult.suggestions.push(
					"Application may be slow to respond - increase timeout",
					"Check for application startup issues",
				);
				return readinessResult;
			}

			// Check 4: Authentication endpoints (critical for most E2E tests)
			log("  🔍 Checking authentication endpoints...");
			try {
				const signInResponse = await fetch(`${testUrl}/auth/sign-in`, {
					signal: AbortSignal.timeout(5000),
					headers: { Accept: "text/html" },
				});

				if (signInResponse.status === 200) {
					const signInContent = await signInResponse.text();
					if (
						signInContent.includes("sign-in") ||
						signInContent.includes("email") ||
						signInContent.includes("password")
					) {
						readinessResult.checks.authEndpoints = true;
						log("  ✅ Authentication endpoints accessible");
					}
				}
			} catch (authError) {
				log("  ⚠️ Auth endpoint check failed but continuing");
			}

			// Final assessment
			const criticalChecks = [
				readinessResult.checks.serverHealth,
				readinessResult.checks.applicationResponse,
			];

			if (criticalChecks.every((check) => check)) {
				readinessResult.ready = true;
				readinessResult.reason = "All critical checks passed";
				log("  ✅ E2E infrastructure is ready for testing");
			} else {
				readinessResult.reason = "Critical infrastructure checks failed";
				readinessResult.suggestions.push(
					"Fix the server and application issues above",
					"Consider running with --skip-e2e to run only unit tests",
				);
			}

			return readinessResult;
		} catch (error) {
			readinessResult.reason = `E2E validation error: ${error.message}`;
			readinessResult.suggestions.push(
				"Check system resources and network connectivity",
				"Try restarting the test infrastructure",
			);
			return readinessResult;
		}
	}

	/**
	 * Show help message
	 */
	showHelp() {
		console.log(
			`
Modular Test Controller

Usage: node test-controller.cjs [options]

Options:
  --skip-unit     Skip unit tests
  --skip-e2e      Skip E2E tests
  --quick         Quick infrastructure check only
  --debug         Enable debug output
  --verbose       Enable verbose logging
  --help          Show this help message

Examples:
  node test-controller.cjs                    # Run all tests
  node test-controller.cjs --skip-e2e         # Run unit tests only
  node test-controller.cjs --quick            # Quick infrastructure check
		`.trim(),
		);
	}

	/**
	 * Main execution entry point
	 */
	async run() {
		const startTime = Date.now();

		try {
			log("🚀 Starting Modular Test Controller");
			log(
				`📋 Configuration: Unit=${!this.options.skipUnit}, E2E=${!this.options.skipE2E}`,
			);

			// Acquire resource lock
			const lockAcquired = await this.resourceLock.acquire("main", 5000);
			if (!lockAcquired) {
				logError(
					"Failed to acquire resource lock - another test may be running",
				);
				process.exit(1);
			}

			// Pre-test cleanup to ensure clean state
			await this.cleanupGuard.preTestCleanup();

			// Register cleanup handler for resource lock
			this.cleanupGuard.addCleanupHandler(async () => {
				await this.resourceLock.release("main");
			});

			// Define test phases
			const phases = this.definePhases();

			// Execute phases with coordinator
			const result = await this.phaseCoordinator.executePhases(phases);

			// Generate report
			const report = await this.testReporter.generateReport();

			// Update statusline with final results
			const summary = this.testStatus.getSummary();
			const statusValue = summary.failed === 0 ? "success" : "failed";
			await this.testStatus.updateStatusLine(
				statusValue,
				summary.passed,
				summary.failed,
				summary.total,
			);

			// Determine exit code
			const exitCode = result.success ? 0 : 1;
			const duration = Math.round((Date.now() - startTime) / 1000);

			log(`\n✨ Test execution completed in ${duration}s`);
			log(`📊 Final status: ${result.success ? "✅ SUCCESS" : "❌ FAILED"}`);

			// Cleanup and exit
			await this.cleanup();
			process.exit(exitCode);
		} catch (error) {
			logError(`Fatal error: ${error.message}`);

			// Update statusline to indicate failure
			try {
				await this.testStatus.updateStatusLine("failed", 0, 1, 1);
			} catch (statusError) {
				// Don't let status update errors prevent cleanup
				logError(`Failed to update status: ${statusError.message}`);
			}

			// Emergency cleanup
			await this.emergencyCleanup();
			process.exit(1);
		}
	}

	/**
	 * Define test execution phases
	 */
	definePhases() {
		const phases = [];

		// Phase 1: Initialization
		phases.push({
			name: "initialization",
			critical: true,
			executor: async () => {
				log("📋 Initializing test environment...");
				await this.testStatus.reset();
				await this.testStatus.save();
				return { success: true };
			},
			options: {
				timeout: CONFIG.timeouts.initialization,
			},
		});

		// Phase 2: Infrastructure Check
		phases.push({
			name: "infrastructure_check",
			critical: true,
			executor: async () => {
				const results = await this.infrastructureManager.checkAll(
					this.options.unitOnly,
				);

				// Update status
				for (const [key, value] of Object.entries(results)) {
					if (CONFIG.paths.infrastructure?.[key]) {
						await this.testStatus.updateInfrastructure(key, value);
					}
				}

				// Check if all critical services are healthy
				const criticalServices = ["supabase", "database", "environment"];

				// Only require devServer for E2E tests
				if (!this.options.unitOnly) {
					criticalServices.push("devServer");
				}

				const allHealthy = criticalServices.every(
					(service) =>
						results[service] === "healthy" ||
						results[service] === "ready" ||
						results[service] === "started" ||
						results[service] === "already_running" ||
						results[service] === "docker_container",
				);

				if (!allHealthy) {
					throw new Error("Critical infrastructure services are not healthy");
				}

				return { success: true, results };
			},
			options: {
				timeout: CONFIG.timeouts.infrastructureCheck,
				canRecover: true,
			},
		});

		// Quick check mode - stop here
		if (this.options.quickCheck) {
			log("⚡ Quick check mode - skipping tests");
			return phases;
		}

		// Phase 3: Unit Tests
		if (!this.options.skipUnit) {
			phases.push({
				name: "unit_tests",
				critical: false, // Continue even if unit tests fail
				executor: async () => {
					const result = await this.unitTestRunner.run();
					return result;
				},
				options: {
					timeout: CONFIG.timeouts.unitTests,
					canRecover: false,
				},
			});
		}

		// Phase 4: E2E Tests with intelligent skipping
		if (!this.options.skipE2E) {
			phases.push({
				name: "e2e_tests",
				critical: false,
				executor: async () => {
					// Pre-flight check for E2E infrastructure
					const e2eReadiness = await this.validateE2EReadiness();

					if (!e2eReadiness.ready) {
						log(`⚠️ E2E tests skipped: ${e2eReadiness.reason}`);
						log(
							"💡 Suggestion: Fix the infrastructure issues and re-run tests",
						);

						return {
							success: false,
							skipped: true,
							reason: e2eReadiness.reason,
							suggestions: e2eReadiness.suggestions,
							testsRun: 0,
							testsPassed: 0,
							testsFailed: 0,
						};
					}

					// Infrastructure is healthy, run E2E tests
					const result = await this.e2eTestRunner.run();
					return result;
				},
				options: {
					timeout: CONFIG.timeouts.e2eTests,
					canRecover: true, // Enable recovery for E2E tests
				},
			});
		}

		// Phase 5: Cleanup
		phases.push({
			name: "cleanup",
			critical: false,
			executor: async () => {
				await this.cleanup();
				return { success: true };
			},
			options: {
				timeout: CONFIG.timeouts.cleanup,
				canRecover: true,
			},
		});

		// Phase 6: Reporting
		phases.push({
			name: "reporting",
			critical: false,
			executor: async () => {
				await this.testReporter.generateReport();
				return { success: true };
			},
			options: {
				timeout: CONFIG.timeouts.reporting,
			},
		});

		return phases;
	}

	/**
	 * Normal cleanup with enhanced options
	 */
	async cleanup() {
		log("\n🧹 Starting cleanup...");

		try {
			// Reset cleanup coordinator for next run
			if (this.cleanupCoordinator) {
				this.cleanupCoordinator.reset();
			}

			// Kill managed processes
			await this.processManager.killAll();

			// Clear ports with enhanced retry logic - only if ports are actually in use
			let portsToCheck = [
				CONFIG.ports.web,
				CONFIG.ports.webTest,
				CONFIG.ports.payload,
			];

			// Skip Docker container ports to avoid signal conflicts
			const dockerAvailable =
				await this.infrastructureManager.checkDockerContainer();
			if (dockerAvailable) {
				log("🐳 Skipping Docker container port (3001) from final cleanup");
				portsToCheck = portsToCheck.filter((port) => port !== 3001);
			}

			const portsInUse = [];

			// Check which ports actually have processes before trying to clear them
			for (const port of portsToCheck) {
				try {
					const { exec } = require("node:child_process");
					const { promisify } = require("node:util");
					const execAsync = promisify(exec);
					const { stdout } = await execAsync(
						`lsof -ti:${port} 2>/dev/null || echo ""`,
					);
					if (stdout.trim()) {
						portsInUse.push(port);
					}
				} catch {
					// Port is free
				}
			}

			if (portsInUse.length > 0) {
				log(`🔧 Clearing ports in use: ${portsInUse.join(", ")}`);
				const portsCleared = await this.processManager.clearPorts(portsInUse, {
					maxRetries: 3,
					waitTime: 2000,
				});

				if (!portsCleared) {
					logError("Some ports could not be cleared completely");
				}
			} else {
				log("✅ No ports need clearing");
			}

			// Release locks
			await this.resourceLock.release("main");

			// Cleanup health monitor
			if (this.healthMonitor) {
				this.healthMonitor.cleanup();
			}

			// Final cleanup guard
			await this.cleanupGuard.executeCleanup();

			log("✅ Cleanup completed");
		} catch (error) {
			logError(`Cleanup error: ${error.message}`);
		}
	}

	/**
	 * Emergency cleanup (for fatal errors)
	 */
	async emergencyCleanup() {
		logError("🚨 Emergency cleanup initiated");

		try {
			// Force kill all processes
			this.processManager.killAllSync();

			// Force clear all test ports
			const { exec } = require("node:child_process");
			const { promisify } = require("node:util");
			const execAsync = promisify(exec);

			for (
				let port = CONFIG.ports.testRangeStart;
				port <= CONFIG.ports.testRangeEnd;
				port++
			) {
				try {
					await execAsync(
						`lsof -ti:${port} | xargs kill -9 2>/dev/null || true`,
					);
				} catch {
					// Ignore errors
				}
			}

			// Kill test processes by pattern
			const patterns = ["playwright", "vitest", "jest", "next-server"];
			for (const pattern of patterns) {
				try {
					await execAsync(`pkill -f "${pattern}" || true`);
				} catch {
					// Ignore errors
				}
			}

			log("✅ Emergency cleanup completed");
		} catch (error) {
			logError(`Emergency cleanup failed: ${error.message}`);
		}
	}

	/**
	 * Handle process signals
	 */
	setupSignalHandlers() {
		const handleSignal = async (signal) => {
			log(`\n🛑 Received ${signal}, shutting down gracefully...`);

			// Update status
			this.testStatus.status.status = "interrupted";
			await this.testStatus.save();

			// Update statusline to indicate interruption (treat as failure)
			try {
				await this.testStatus.updateStatusLine("failed", 0, 1, 1);
			} catch (statusError) {
				// Don't let status update errors prevent cleanup
				logError(`Failed to update status: ${statusError.message}`);
			}

			// Cleanup
			await this.cleanup();

			process.exit(130); // Standard exit code for SIGINT
		};

		process.on("SIGINT", () => handleSignal("SIGINT"));
		process.on("SIGTERM", () => handleSignal("SIGTERM"));

		// Handle uncaught exceptions
		process.on("uncaughtException", async (error) => {
			logError(`Uncaught exception: ${error.message}`);
			console.error(error.stack);

			// Update statusline to indicate failure
			try {
				await this.testStatus.updateStatusLine("failed", 0, 1, 1);
			} catch (statusError) {
				// Don't let status update errors prevent cleanup
			}

			await this.emergencyCleanup();
			process.exit(1);
		});

		// Handle unhandled rejections
		process.on("unhandledRejection", async (reason, promise) => {
			logError(`Unhandled rejection at: ${promise}`);
			console.error(reason);

			// Update statusline to indicate failure
			try {
				await this.testStatus.updateStatusLine("failed", 0, 1, 1);
			} catch (statusError) {
				// Don't let status update errors prevent cleanup
			}

			await this.emergencyCleanup();
			process.exit(1);
		});
	}
}

// Main entry point
if (require.main === module) {
	const controller = new TestController();

	// Setup signal handlers
	controller.setupSignalHandlers();

	// Run tests
	controller.run().catch((error) => {
		logError(`Failed to run tests: ${error.message}`);
		process.exit(1);
	});
}

module.exports = { TestController };
