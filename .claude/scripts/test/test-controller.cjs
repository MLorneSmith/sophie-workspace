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
const { CONFIG, validateConfig } = require("./config/test-config.cjs");
const { TestStatus } = require("./modules/test-status.cjs");
const { PhaseCoordinator } = require("./modules/phase-coordinator.cjs");
const {
	InfrastructureManager,
} = require("./modules/infrastructure-manager.cjs");
const { UnitTestRunner } = require("./modules/unit-test-runner.cjs");
const { E2ETestRunner } = require("./modules/e2e-test-runner.cjs");
const { ProcessManager } = require("./modules/process-manager.cjs");
const { TestReporter } = require("./modules/test-reporter.cjs");
const { ConditionWaiter } = require("./utils/condition-waiter.cjs");
const { ResourceLock } = require("./resource-lock.cjs");
const { TestCleanupGuard } = require("./test-cleanup-guard.cjs");

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

		// Initialize modules
		this.testStatus = new TestStatus({
			resultFile: CONFIG.paths.resultFile,
			statusFile: CONFIG.paths.statusFile,
		});
		this.phaseCoordinator = new PhaseCoordinator(this.testStatus);
		this.infrastructureManager = new InfrastructureManager(
			CONFIG,
			this.testStatus,
		);
		this.processManager = new ProcessManager(CONFIG);
		this.testReporter = new TestReporter(CONFIG, this.testStatus);
		this.waiter = new ConditionWaiter();

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
		};

		for (const arg of args) {
			switch (arg) {
				case "--skip-unit":
					options.skipUnit = true;
					break;
				case "--skip-e2e":
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
				const results = await this.infrastructureManager.checkAll();

				// Update status
				for (const [key, value] of Object.entries(results)) {
					if (CONFIG.paths.infrastructure?.[key]) {
						await this.testStatus.updateInfrastructure(key, value);
					}
				}

				// Check if all critical services are healthy
				const criticalServices = ["supabase", "database", "environment"];
				const allHealthy = criticalServices.every(
					(service) =>
						results[service] === "healthy" ||
						results[service] === "ready" ||
						results[service] === "started",
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

		// Phase 4: E2E Tests
		if (!this.options.skipE2E) {
			phases.push({
				name: "e2e_tests",
				critical: false,
				executor: async () => {
					const result = await this.e2eTestRunner.run();
					return result;
				},
				options: {
					timeout: CONFIG.timeouts.e2eTests,
					canRecover: false,
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
	 * Normal cleanup
	 */
	async cleanup() {
		log("\n🧹 Starting cleanup...");

		try {
			// Kill managed processes
			await this.processManager.killAll();

			// Clear ports
			await this.processManager.clearPorts([
				CONFIG.ports.web,
				CONFIG.ports.webTest,
				CONFIG.ports.payload,
			]);

			// Release locks
			await this.resourceLock.release("main");

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

			await this.emergencyCleanup();
			process.exit(1);
		});

		// Handle unhandled rejections
		process.on("unhandledRejection", async (reason, promise) => {
			logError(`Unhandled rejection at: ${promise}`);
			console.error(reason);

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
