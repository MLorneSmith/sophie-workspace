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
			process.on(event, async (_codeOrSignal) => {
				if (!this.isCleaningUp) {
					this.isCleaningUp = true;
					await this.executeCleanup();

					// Exit with appropriate code
					if (event === "uncaughtException" || event === "unhandledRejection") {
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
		// Execute custom cleanup handlers
		for (const handler of this.cleanupHandlers) {
			try {
				await handler();
			} catch (_error) {}
		}

		// Kill registered processes
		for (const proc of this.registeredProcesses) {
			try {
				process.kill(proc.pid, "SIGTERM");
			} catch (error) {
				if (error.code !== "ESRCH") {
				}
			}
		}

		// Intelligent cleanup - only kill processes when actually needed
		const currentPid = process.pid;

		// First, check if there are actually stuck processes before attempting to kill anything
		const processPatterns = ["playwright", "vitest", "next-server"];
		const stuckProcesses = [];

		for (const pattern of processPatterns) {
			try {
				const { stdout } = await execAsync(
					`pgrep -f "${pattern}" | grep -v ${currentPid} || true`,
				);
				if (stdout.trim()) {
					stuckProcesses.push(pattern);
				}
			} catch {
				// No processes found
			}
		}

		// Only run aggressive cleanup if there are actually stuck processes
		if (stuckProcesses.length > 0) {
			for (const pattern of stuckProcesses) {
				try {
					// Use more precise cleanup to avoid signal conflicts
					await execAsync(
						`pgrep -f "${pattern}" | grep -v ${currentPid} | xargs -r kill -TERM 2>/dev/null || true`,
					);
					// Wait briefly for graceful shutdown
					await new Promise((resolve) => setTimeout(resolve, 1000));
					// Force kill only if still running
					await execAsync(
						`pgrep -f "${pattern}" | grep -v ${currentPid} | xargs -r kill -KILL 2>/dev/null || true`,
					);
				} catch {
					// Ignore cleanup errors
				}
			}
		} else {
		}

		// Safe cleanup commands (no process killing)
		const safeCleanupCommands = [
			// Clean up lock files
			"rm -rf /tmp/.claude_test_locks/* 2>/dev/null || true",

			// Clean up temp test files (but preserve status file for Claude Code statusline)
			// Status file should persist: /tmp/.claude_test_status_*
			"rm -f /tmp/.claude_test_results.json 2>/dev/null || true",
		];

		for (const cmd of safeCleanupCommands) {
			try {
				await execAsync(cmd);
			} catch (_error) {
				// Ignore errors in cleanup
			}
		}
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
				await this.executeCleanup();
				return false;
			}

			// Check for blocked ports
			const criticalPorts = [3000, 3020];
			for (const port of criticalPorts) {
				try {
					const { stdout } = await execAsync(`lsof -ti:${port}`);
					if (stdout.trim()) {
						await execAsync(
							`lsof -ti:${port} | xargs kill -9 2>/dev/null || true`,
						);
						return false;
					}
				} catch (_e) {
					// Port is free
				}
			}

			return true;
		} catch (_error) {
			return false;
		}
	}

	/**
	 * Comprehensive cleanup of test ports
	 */
	async cleanupTestPorts() {
		// Skip ports 3001 and 3021 if using external test servers
		const skipTestPorts = process.env.SKIP_DEV_SERVER === "true";
		// Note: Port 3000 is for development only and should never be managed by test infrastructure
		let testPorts = [3001, 3010, 3020];

		if (skipTestPorts) {
			// Remove test server ports when using containerized testing
			testPorts = [3010, 3020];
		} else {
		}

		for (const port of testPorts) {
			try {
				// Get PIDs using the port
				const { stdout: pids } = await execAsync(
					`lsof -ti:${port} 2>/dev/null || true`,
				);

				if (pids.trim()) {
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
						await execAsync(
							`lsof -ti:${port} | xargs -r kill -9 2>/dev/null || true`,
						);
					}
				}
			} catch (_e) {
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
		// Skip ports 3001 and 3021 if using external test servers
		const skipTestPorts = process.env.SKIP_DEV_SERVER === "true";
		// Note: Port 3000 is for development only and should never be managed by test infrastructure
		let testPorts = [3001, 3010, 3020];

		if (skipTestPorts) {
			// Remove test server ports when using containerized testing
			testPorts = [3010, 3020];
		} else {
		}

		for (const port of testPorts) {
			try {
				// Check if port is in use
				const { stdout: initialCheck } = await execAsync(
					`lsof -ti:${port} 2>/dev/null || true`,
				);

				if (initialCheck.trim()) {
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
					} else {
					}
				}
			} catch (_e) {
				// Port is likely free if commands fail
			}
		}

		// Kill any existing test processes by pattern - exclude current process
		const currentPid = process.pid;
		const processPatterns = [
			"playwright",
			"vitest",
			"next-server",
			"next.*dev.*3000",
			// Skip patterns that might match test controller:
			// - "dev:test"
			// - "test:shard"
		];

		for (const pattern of processPatterns) {
			try {
				// Use pgrep + grep to exclude current process, then kill
				await execAsync(
					`pgrep -f "${pattern}" | grep -v ${currentPid} | xargs -r kill 2>/dev/null || true`,
				);
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
				allPortsFree = false;
			}
		}

		if (allPortsFree) {
		} else {
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
				process.exit(healthy ? 0 : 1);
				break;
			}

			case "monitor":
				guard.monitorProcesses();
				// Keep process alive
				setInterval(() => {}, 1000);
				break;

			default:
		}
	})();
}
