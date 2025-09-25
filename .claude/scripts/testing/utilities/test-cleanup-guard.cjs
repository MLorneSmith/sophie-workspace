#!/usr/bin/env node

/**
 * Test Cleanup Guard
 * Ensures proper cleanup of test processes even on unexpected exits
 */

const { exec } = require("node:child_process");
const { promisify } = require("node:util");
const execAsync = promisify(exec);

class TestCleanupGuard {
	constructor() {
		this.registeredProcesses = new Set();
		this.cleanupHandlers = [];
		this.isCleaningUp = false;

		// Register exit handlers
		this.registerExitHandlers();
	}

	/**
	 * Register all possible exit handlers to ensure cleanup
	 */
	registerExitHandlers() {
		const events = [
			"exit",
			"SIGINT",
			"SIGTERM",
			"SIGQUIT",
			"uncaughtException",
			"unhandledRejection",
		];

		events.forEach((event) => {
			process.on(event, async (codeOrSignal) => {
				if (!this.isCleaningUp) {
					this.isCleaningUp = true;
					console.log(`\n🧹 Cleanup guard triggered by ${event}`);
					await this.executeCleanup();

					// Exit with appropriate code
					if (event === "uncaughtException" || event === "unhandledRejection") {
						console.error(`Fatal error: ${codeOrSignal}`);
						process.exit(1);
					} else if (event !== "exit") {
						process.exit(0);
					}
				}
			});
		});
	}

	/**
	 * Register a process to be tracked and cleaned up
	 * @param {number} pid - Process ID
	 * @param {string} name - Process name for logging
	 */
	registerProcess(pid, name) {
		this.registeredProcesses.add({ pid, name });
		console.log(`📝 Registered process: ${name} (PID: ${pid})`);
	}

	/**
	 * Add a custom cleanup handler
	 * @param {Function} handler - Async cleanup function
	 */
	addCleanupHandler(handler) {
		this.cleanupHandlers.push(handler);
	}

	/**
	 * Execute all cleanup operations
	 */
	async executeCleanup() {
		console.log("🧹 Executing comprehensive test cleanup...");

		// Execute custom cleanup handlers
		for (const handler of this.cleanupHandlers) {
			try {
				await handler();
			} catch (error) {
				console.error(`Cleanup handler failed: ${error.message}`);
			}
		}

		// Kill registered processes
		for (const proc of this.registeredProcesses) {
			try {
				process.kill(proc.pid, "SIGTERM");
				console.log(`✅ Killed process: ${proc.name} (PID: ${proc.pid})`);
			} catch (error) {
				if (error.code !== "ESRCH") {
					// Process doesn't exist
					console.error(`Failed to kill ${proc.name}: ${error.message}`);
				}
			}
		}

		// General cleanup commands
		const cleanupCommands = [
			// Kill test-related processes
			'pkill -f "playwright" || true',
			'pkill -f "vitest" || true',
			'pkill -f "next-server" || true',
			'pkill -f "dev:test" || true',
			'pkill -f "test:shard" || true',

			// Clean up ports
			"lsof -ti:3000-3020 | xargs kill -9 2>/dev/null || true",
			"lsof -ti:54321-54327 | xargs kill -9 2>/dev/null || true",

			// Clean up zombie processes
			'pkill -f "zombie" || true',
			'pkill -f "defunct" || true',

			// Clean up lock files
			"rm -rf /tmp/.claude_test_locks/* 2>/dev/null || true",

			// Clean up temp test files
			"rm -f /tmp/.claude_test_status_* 2>/dev/null || true",
			"rm -f /tmp/.claude_test_results.json 2>/dev/null || true",
		];

		for (const cmd of cleanupCommands) {
			try {
				await execAsync(cmd);
			} catch (error) {
				// Ignore errors in cleanup
			}
		}

		console.log("✅ Cleanup completed");
	}

	/**
	 * Perform a health check and cleanup if needed
	 */
	async healthCheck() {
		try {
			// Check for stuck processes
			const { stdout: playwrightProcs } = await execAsync(
				"pgrep -f playwright || true",
			);
			const { stdout: vitestProcs } = await execAsync(
				"pgrep -f vitest || true",
			);

			if (playwrightProcs || vitestProcs) {
				console.log("⚠️ Found stuck test processes, cleaning up...");
				await this.executeCleanup();
				return false;
			}

			// Check for blocked ports
			const criticalPorts = [3000, 3020];
			for (const port of criticalPorts) {
				try {
					const { stdout } = await execAsync(`lsof -ti:${port}`);
					if (stdout.trim()) {
						console.log(`⚠️ Port ${port} is blocked, cleaning up...`);
						await execAsync(
							`lsof -ti:${port} | xargs kill -9 2>/dev/null || true`,
						);
						return false;
					}
				} catch (e) {
					// Port is free
				}
			}

			return true;
		} catch (error) {
			console.error(`Health check failed: ${error.message}`);
			return false;
		}
	}

	/**
	 * Comprehensive cleanup of test ports
	 */
	async cleanupTestPorts() {
		// Skip ports 3001 and 3021 if using external test servers
		const skipTestPorts = process.env.SKIP_DEV_SERVER === "true";
		let testPorts = [3000, 3001, 3010, 3020];

		if (skipTestPorts) {
			// Remove test server ports when using containerized testing
			testPorts = [3000, 3010, 3020];
			console.log("🔧 Cleaning up test ports:", testPorts.join(", "));
			console.log("   (Skipping ports 3001, 3021 - external test servers)");
		} else {
			console.log("🔧 Cleaning up test ports:", testPorts.join(", "));
		}

		for (const port of testPorts) {
			try {
				// Get PIDs using the port
				const { stdout: pids } = await execAsync(
					`lsof -ti:${port} 2>/dev/null || true`,
				);

				if (pids.trim()) {
					console.log(`   Found process on port ${port}, terminating...`);

					// Try graceful termination first (SIGTERM)
					await execAsync(
						`lsof -ti:${port} | xargs -r kill -15 2>/dev/null || true`,
					);
					await new Promise((resolve) => setTimeout(resolve, 500));

					// Check if still running and force kill if needed
					const { stdout: stillRunning } = await execAsync(
						`lsof -ti:${port} 2>/dev/null || true`,
					);

					if (stillRunning.trim()) {
						console.log(`   Force killing process on port ${port}...`);
						await execAsync(
							`lsof -ti:${port} | xargs -r kill -9 2>/dev/null || true`,
						);
					}
				}
			} catch (e) {
				// Port might already be free
			}
		}

		// Wait for ports to be released
		await new Promise((resolve) => setTimeout(resolve, 1000));
	}

	/**
	 * Pre-test cleanup to ensure clean state with enhanced verification
	 */
	async preTestCleanup() {
		console.log("🔧 Pre-test cleanup starting...");

		// Skip ports 3001 and 3021 if using external test servers
		const skipTestPorts = process.env.SKIP_DEV_SERVER === "true";
		let testPorts = [3000, 3001, 3010, 3020];

		if (skipTestPorts) {
			// Remove test server ports when using containerized testing
			testPorts = [3000, 3010, 3020];
			console.log("🔧 Cleaning up test ports:", testPorts.join(", "));
			console.log("   (Skipping ports 3001, 3021 - external test servers)");
		} else {
			console.log("🔧 Cleaning up test ports:", testPorts.join(", "));
		}

		for (const port of testPorts) {
			try {
				// Check if port is in use
				const { stdout: initialCheck } = await execAsync(
					`lsof -ti:${port} 2>/dev/null || true`,
				);

				if (initialCheck.trim()) {
					console.log(`   Found process on port ${port}, terminating...`);

					// Step 1: Graceful termination (SIGTERM)
					await execAsync(
						`lsof -ti:${port} | xargs -r kill 2>/dev/null || true`,
					);
					await new Promise((resolve) => setTimeout(resolve, 1000));

					// Step 2: Check if still running
					const { stdout: secondCheck } = await execAsync(
						`lsof -ti:${port} 2>/dev/null || true`,
					);

					if (secondCheck.trim()) {
						console.log(`   Force killing process on port ${port}...`);
						// Force kill (SIGKILL)
						await execAsync(
							`lsof -ti:${port} | xargs -r kill -9 2>/dev/null || true`,
						);

						// Also try fuser as fallback
						await execAsync(`fuser -k ${port}/tcp 2>/dev/null || true`);

						// Wait longer for force kill
						await new Promise((resolve) => setTimeout(resolve, 2000));
					}

					// Step 3: Final verification
					const { stdout: finalCheck } = await execAsync(
						`lsof -ti:${port} 2>/dev/null || true`,
					);

					if (finalCheck.trim()) {
						console.log(`   ⚠️ Port ${port} still in use after cleanup`);
					} else {
						console.log(`   ✅ Port ${port} cleared successfully`);
					}
				}
			} catch (e) {
				// Port is likely free if commands fail
			}
		}

		// Kill any existing test processes by pattern
		const processPatterns = [
			"playwright",
			"vitest",
			"next-server",
			"next.*dev.*3000",
			"dev:test",
			"test:shard",
		];

		for (const pattern of processPatterns) {
			try {
				await execAsync(`pkill -f "${pattern}" 2>/dev/null || true`);
			} catch {
				// Ignore errors
			}
		}

		// Clean up old lock files and temp files
		await execAsync(
			'find /tmp -name ".claude_test_*" -mtime +1 -delete 2>/dev/null || true',
		).catch(() => {});

		await execAsync(
			"rm -rf /tmp/.claude_test_locks/* 2>/dev/null || true",
		).catch(() => {});

		// Wait for all processes to fully terminate
		await new Promise((resolve) => setTimeout(resolve, 3000));

		// Final port verification
		let allPortsFree = true;
		for (const port of testPorts) {
			const { stdout } = await execAsync(
				`lsof -ti:${port} 2>/dev/null || true`,
			);
			if (stdout.trim()) {
				console.log(
					`   ⚠️ Warning: Port ${port} still has processes after cleanup`,
				);
				allPortsFree = false;
			}
		}

		if (allPortsFree) {
			console.log("✅ Pre-test cleanup completed - all ports free");
		} else {
			console.log("⚠️ Pre-test cleanup completed with warnings");
		}
	}

	/**
	 * Monitor and restart stuck processes
	 */
	async monitorProcesses() {
		const checkInterval = 30000; // 30 seconds

		setInterval(async () => {
			const healthy = await this.healthCheck();
			if (!healthy) {
				console.log("🔄 Restarting unhealthy test infrastructure...");
			}
		}, checkInterval);
	}
}

// Export for use in other modules
module.exports = { TestCleanupGuard };

// CLI interface
if (require.main === module) {
	const command = process.argv[2];
	const guard = new TestCleanupGuard();

	(async () => {
		switch (command) {
			case "clean":
				await guard.executeCleanup();
				break;

			case "pre-test":
				await guard.preTestCleanup();
				break;

			case "health": {
				const healthy = await guard.healthCheck();
				console.log(
					healthy ? "✅ System is healthy" : "⚠️ System needs cleanup",
				);
				process.exit(healthy ? 0 : 1);
				break;
			}

			case "monitor":
				console.log("👁️ Starting process monitor...");
				guard.monitorProcesses();
				// Keep process alive
				setInterval(() => {}, 1000);
				break;

			default:
				console.log("Usage: test-cleanup-guard.cjs <command>");
				console.log("Commands:");
				console.log("  clean     - Execute full cleanup");
				console.log("  pre-test  - Pre-test cleanup");
				console.log("  health    - Check system health");
				console.log("  monitor   - Start process monitor");
		}
	})();
}
