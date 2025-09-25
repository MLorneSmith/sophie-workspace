/**
 * Phase Coordinator Module
 * Manages phase transitions with timeouts and error recovery
 */

const { EventEmitter } = require("node:events");

// Simple logging utility
function log(message, type = "info") {
	const timestamp = new Date().toISOString();
	process.stdout.write(`[${timestamp}] ${type.toUpperCase()}: ${message}\n`);
}

function logError(message) {
	log(message, "error");
}

class PhaseCoordinator extends EventEmitter {
	constructor(testStatus) {
		super();
		this.testStatus = testStatus;
		this.currentPhase = null;
		this.phaseHistory = [];

		// Default phase timeouts (can be overridden)
		this.phaseTimeouts = {
			initializing: 30000, // 30 seconds
			infrastructure_check: 60000, // 60 seconds
			supabase_setup: 120000, // 2 minutes
			unit_tests: 15 * 60 * 1000, // 15 minutes
			e2e_setup: 60000, // 60 seconds
			e2e_tests: 45 * 60 * 1000, // 45 minutes
			cleanup: 30000, // 30 seconds
			reporting: 30000, // 30 seconds
		};

		// Recovery strategies for each phase
		this.recoveryStrategies = {
			infrastructure_check: this.recoverInfrastructure.bind(this),
			supabase_setup: this.recoverSupabase.bind(this),
			unit_tests: this.recoverUnitTests.bind(this),
			e2e_tests: this.recoverE2ETests.bind(this),
			cleanup: this.recoverCleanup.bind(this),
		};
	}

	/**
	 * Transition to a new phase with timeout protection
	 * @param {string} nextPhase - Name of the next phase
	 * @param {Function} executor - Async function to execute for this phase
	 * @param {Object} options - Additional options
	 * @returns {Promise<Object>} - Result object with success status
	 */
	async transitionTo(nextPhase, executor, options = {}) {
		const timeout = options.timeout || this.phaseTimeouts[nextPhase] || 30000;
		const canRecover = options.canRecover !== false;

		log(`📋 Transitioning to phase: ${nextPhase} (timeout: ${timeout}ms)`);

		// Update status
		this.currentPhase = nextPhase;
		await this.testStatus.setPhase(nextPhase);

		// Record phase start
		const phaseStart = Date.now();
		this.phaseHistory.push({
			phase: nextPhase,
			startTime: new Date(phaseStart).toISOString(),
			status: "running",
		});

		// Create timeout promise
		let timeoutHandle;
		const timeoutPromise = new Promise((_, reject) => {
			timeoutHandle = setTimeout(() => {
				reject(new Error(`Phase '${nextPhase}' timed out after ${timeout}ms`));
			}, timeout);
		});

		try {
			// Race between executor and timeout
			const result = await Promise.race([executor(), timeoutPromise]);

			// Clear timeout if executor completes first
			clearTimeout(timeoutHandle);

			// Record success
			const phaseEnd = Date.now();
			const duration = phaseEnd - phaseStart;

			this.updatePhaseHistory(nextPhase, "success", duration);
			log(`✅ Phase '${nextPhase}' completed successfully in ${duration}ms`);

			this.emit("phase:complete", { phase: nextPhase, duration, result });

			return {
				success: true,
				phase: nextPhase,
				duration,
				result,
			};
		} catch (error) {
			// Clear timeout in case of error
			clearTimeout(timeoutHandle);

			const phaseEnd = Date.now();
			const duration = phaseEnd - phaseStart;

			logError(`❌ Phase '${nextPhase}' failed: ${error.message}`);
			this.updatePhaseHistory(nextPhase, "failed", duration, error.message);

			// Add error to test status
			await this.testStatus.addError({
				phase: nextPhase,
				message: error.message,
				stack: error.stack,
			});

			// Attempt recovery if available and allowed
			if (canRecover && this.recoveryStrategies[nextPhase]) {
				log(`🔧 Attempting recovery for phase '${nextPhase}'...`);
				try {
					const recoveryResult =
						await this.recoveryStrategies[nextPhase](error);
					if (recoveryResult.recovered) {
						log(`✅ Recovery successful for phase '${nextPhase}'`);
						this.emit("phase:recovered", { phase: nextPhase, duration });
						return {
							success: true,
							phase: nextPhase,
							duration,
							recovered: true,
							result: recoveryResult.result,
						};
					}
				} catch (recoveryError) {
					logError(
						`Recovery failed for phase '${nextPhase}': ${recoveryError.message}`,
					);
				}
			}

			this.emit("phase:failed", { phase: nextPhase, duration, error });

			return {
				success: false,
				phase: nextPhase,
				duration,
				error: error.message,
				stack: error.stack,
			};
		}
	}

	/**
	 * Execute multiple phases in sequence
	 * @param {Array} phases - Array of phase definitions
	 * @returns {Promise<Object>} - Overall execution result
	 */
	async executePhases(phases) {
		const results = [];
		let allSuccess = true;

		for (const phase of phases) {
			const result = await this.transitionTo(
				phase.name,
				phase.executor,
				phase.options || {},
			);

			results.push(result);

			if (!result.success) {
				allSuccess = false;

				// Check if we should continue after failure
				if (phase.critical !== false) {
					log(`🛑 Critical phase '${phase.name}' failed. Stopping execution.`);
					break;
				} else {
					log(`⚠️ Non-critical phase '${phase.name}' failed. Continuing...`);
				}
			}
		}

		return {
			success: allSuccess,
			phases: results,
			summary: this.generateSummary(),
		};
	}

	/**
	 * Update phase history record
	 */
	updatePhaseHistory(phase, status, duration, error = null) {
		const phaseRecord = this.phaseHistory.find(
			(p) => p.phase === phase && p.status === "running",
		);

		if (phaseRecord) {
			phaseRecord.status = status;
			phaseRecord.duration = duration;
			phaseRecord.endTime = new Date().toISOString();
			if (error) {
				phaseRecord.error = error;
			}
		}
	}

	/**
	 * Generate execution summary
	 */
	generateSummary() {
		const total = this.phaseHistory.length;
		const successful = this.phaseHistory.filter(
			(p) => p.status === "success",
		).length;
		const failed = this.phaseHistory.filter(
			(p) => p.status === "failed",
		).length;
		const totalDuration = this.phaseHistory.reduce(
			(sum, p) => sum + (p.duration || 0),
			0,
		);

		return {
			totalPhases: total,
			successful,
			failed,
			totalDuration,
			averageDuration: total > 0 ? Math.round(totalDuration / total) : 0,
			history: this.phaseHistory,
		};
	}

	/**
	 * Recovery strategies for different phases
	 */
	async recoverInfrastructure(_error) {
		log("🔧 Attempting to recover infrastructure...");

		// Try to kill stuck processes and restart
		const { exec } = require("node:child_process");
		const { promisify } = require("node:util");
		const execAsync = promisify(exec);

		try {
			// Kill any hanging processes
			await execAsync("pkill -f 'node|playwright|vitest' || true");
			await new Promise((resolve) => setTimeout(resolve, 2000));

			// Clear ports
			const ports = [3000, 3020, 54321];
			for (const port of ports) {
				await execAsync(`lsof -ti:${port} | xargs kill -9 2>/dev/null || true`);
			}

			return { recovered: true, result: "Infrastructure reset" };
		} catch (recoveryError) {
			return { recovered: false, error: recoveryError };
		}
	}

	async recoverSupabase(_error) {
		log("🔧 Attempting to recover Supabase...");

		const { exec } = require("node:child_process");
		const { promisify } = require("node:util");
		const execAsync = promisify(exec);

		try {
			// Try to stop and restart Supabase
			await execAsync("npx supabase stop");
			await new Promise((resolve) => setTimeout(resolve, 3000));
			await execAsync("npx supabase start");

			// Wait for Supabase to be ready
			const { ConditionWaiter } = require("../utilities/condition-waiter.cjs");
			const waiter = new ConditionWaiter();
			await waiter.waitForSupabase({ timeout: 60000 });

			return { recovered: true, result: "Supabase restarted" };
		} catch (recoveryError) {
			return { recovered: false, error: recoveryError };
		}
	}

	async recoverUnitTests(_error) {
		log("🔧 Attempting to recover unit tests...");

		// For unit tests, we might want to retry with cache cleared
		const { exec } = require("node:child_process");
		const { promisify } = require("node:util");
		const execAsync = promisify(exec);

		try {
			// Clear turbo cache
			await execAsync("rm -rf .turbo node_modules/.cache");

			return { recovered: false }; // Don't auto-retry tests, let controller decide
		} catch (recoveryError) {
			return { recovered: false, error: recoveryError };
		}
	}

	async recoverE2ETests(_error) {
		log("🔧 Attempting to recover E2E tests...");

		const { exec } = require("node:child_process");
		const { promisify } = require("node:util");
		const execAsync = promisify(exec);

		try {
			// Kill any hanging Playwright processes
			await execAsync("pkill -f playwright || true");
			await new Promise((resolve) => setTimeout(resolve, 2000));

			// Clear test artifacts
			await execAsync("rm -rf test-results playwright-report");

			return { recovered: false }; // Don't auto-retry tests
		} catch (recoveryError) {
			return { recovered: false, error: recoveryError };
		}
	}

	async recoverCleanup(_error) {
		log("🔧 Forcing cleanup...");

		const { exec } = require("node:child_process");
		const { promisify } = require("node:util");
		const execAsync = promisify(exec);

		try {
			// Force kill all test-related processes
			await execAsync(
				"pkill -f 'node|playwright|vitest|next|supabase' || true",
			);

			// Clear all test ports
			const ports = [3000, 3001, 3020, 54321, 54322];
			for (const port of ports) {
				await execAsync(`lsof -ti:${port} | xargs kill -9 2>/dev/null || true`);
			}

			return { recovered: true, result: "Forced cleanup completed" };
		} catch (recoveryError) {
			// Cleanup errors are not critical
			return { recovered: true, result: "Cleanup attempted" };
		}
	}

	/**
	 * Set custom timeout for a phase
	 */
	setPhaseTimeout(phase, timeout) {
		this.phaseTimeouts[phase] = timeout;
	}

	/**
	 * Add custom recovery strategy
	 */
	addRecoveryStrategy(phase, strategy) {
		this.recoveryStrategies[phase] = strategy;
	}

	/**
	 * Get current phase information
	 */
	getCurrentPhase() {
		return {
			name: this.currentPhase,
			history: this.phaseHistory,
		};
	}

	/**
	 * Check if a phase completed successfully
	 */
	phaseSucceeded(phaseName) {
		const phase = this.phaseHistory.find((p) => p.phase === phaseName);
		return phase && phase.status === "success";
	}

	/**
	 * Get phase duration
	 */
	getPhaseDuration(phaseName) {
		const phase = this.phaseHistory.find((p) => p.phase === phaseName);
		return phase ? phase.duration : null;
	}
}

module.exports = { PhaseCoordinator };
