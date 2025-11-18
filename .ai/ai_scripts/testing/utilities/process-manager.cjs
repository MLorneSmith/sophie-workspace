/**
 * Process Manager Module
 * Handles process lifecycle management for test infrastructure
 */

const { spawn, exec } = require("node:child_process");
const { promisify } = require("node:util");
const execAsync = promisify(exec);
const { ConditionWaiter } = require("./condition-waiter.cjs");

// Simple logging utility
function log(message, type = "info") {
	const timestamp = new Date().toISOString();
	process.stdout.write(`[${timestamp}] ${type.toUpperCase()}: ${message}\n`);
}

function logError(message) {
	log(message, "error");
}

class ProcessManager {
	constructor(config) {
		this.config = config;
		this.processes = new Map();
		this.waiter = new ConditionWaiter();
		this.shuttingDown = false;

		// Register cleanup handlers
		this.registerCleanupHandlers();
	}

	/**
	 * Register process cleanup handlers
	 */
	registerCleanupHandlers() {
		const cleanup = async (signal) => {
			if (this.shuttingDown) return;
			this.shuttingDown = true;

			log(`\n🛑 Received ${signal}, cleaning up processes...`);
			await this.killAll();
			process.exit(0);
		};

		process.on("SIGINT", () => cleanup("SIGINT"));
		process.on("SIGTERM", () => cleanup("SIGTERM"));
		process.on("exit", () => {
			if (!this.shuttingDown) {
				this.killAllSync();
			}
		});
	}

	/**
	 * Start a managed process
	 */
	async startProcess(name, command, args = [], options = {}) {
		// Check if process already exists
		if (this.processes.has(name)) {
			const existing = this.processes.get(name);
			if (!existing.killed) {
				log(`⚠️ Process '${name}' is already running`);
				return existing;
			}
		}

		log(`🚀 Starting process: ${name}`);

		const proc = spawn(command, args, {
			cwd: options.cwd || process.cwd(),
			stdio: options.stdio || ["pipe", "pipe", "pipe"],
			shell: options.shell !== false,
			env: {
				...process.env,
				...options.env,
			},
		});

		// Store process info
		const processInfo = {
			name,
			command,
			args,
			proc,
			pid: proc.pid,
			startTime: Date.now(),
			killed: false,
			output: "",
			errors: "",
		};

		// Handle output
		if (proc.stdout) {
			proc.stdout.on("data", (data) => {
				processInfo.output += data.toString();
				if (options.onStdout) {
					options.onStdout(data);
				}
			});
		}

		// Handle errors
		if (proc.stderr) {
			proc.stderr.on("data", (data) => {
				processInfo.errors += data.toString();
				if (options.onStderr) {
					options.onStderr(data);
				}
			});
		}

		// Handle process exit
		proc.on("exit", (code, signal) => {
			processInfo.killed = true;
			processInfo.exitCode = code;
			processInfo.exitSignal = signal;
			processInfo.endTime = Date.now();

			const duration = Math.round(
				(processInfo.endTime - processInfo.startTime) / 1000,
			);

			if (!this.shuttingDown) {
				if (code !== 0 && code !== null) {
					logError(
						`Process '${name}' exited with code ${code} after ${duration}s`,
					);
				} else {
					log(`Process '${name}' exited normally after ${duration}s`);
				}
			}

			if (options.onExit) {
				options.onExit(code, signal);
			}
		});

		// Handle process errors
		proc.on("error", (error) => {
			logError(`Process '${name}' error: ${error.message}`);
			processInfo.error = error;
			processInfo.killed = true;

			if (options.onError) {
				options.onError(error);
			}
		});

		this.processes.set(name, processInfo);

		// Wait for process to be ready if condition provided
		if (options.readyCondition) {
			try {
				await this.waiter.waitForCondition(options.readyCondition, {
					timeout: options.readyTimeout || 30000,
					name: `${name} ready`,
				});
				log(`✅ Process '${name}' is ready`);
			} catch (error) {
				logError(`Process '${name}' failed to become ready: ${error.message}`);
				await this.killProcess(name);
				throw error;
			}
		}

		return processInfo;
	}

	/**
	 * Kill a specific process
	 */
	async killProcess(name, signal = "SIGTERM") {
		const processInfo = this.processes.get(name);

		if (!processInfo || processInfo.killed) {
			return false;
		}

		log(`🛑 Killing process: ${name}`);

		try {
			processInfo.proc.kill(signal);
			processInfo.killed = true;

			// Wait for process to exit
			await this.waiter.waitForCondition(
				async () => !this.isProcessRunning(processInfo.pid),
				{
					timeout: 5000,
					name: `${name} termination`,
					silent: true,
				},
			);

			return true;
		} catch (_error) {
			// Force kill if graceful shutdown failed
			try {
				processInfo.proc.kill("SIGKILL");
				await this.waiter.delay(1000, "force kill completion");
				return true;
			} catch {
				return false;
			}
		}
	}

	/**
	 * Kill all managed processes
	 */
	async killAll() {
		const promises = [];

		for (const [name, processInfo] of this.processes) {
			if (!processInfo.killed) {
				promises.push(this.killProcess(name));
			}
		}

		await Promise.allSettled(promises);
		this.processes.clear();

		log("✅ All managed processes terminated");
	}

	/**
	 * Synchronous kill all (for exit handler)
	 */
	killAllSync() {
		for (const [_name, processInfo] of this.processes) {
			if (!processInfo.killed) {
				try {
					processInfo.proc.kill("SIGKILL");
				} catch {
					// Ignore errors
				}
			}
		}
	}

	/**
	 * Check if a process is running
	 */
	async isProcessRunning(pid) {
		try {
			const { stdout } = await execAsync(
				`ps -p ${pid} -o pid= 2>/dev/null || echo ""`,
			);
			return stdout.trim().length > 0;
		} catch {
			return false;
		}
	}

	/**
	 * Get process info
	 */
	getProcess(name) {
		return this.processes.get(name);
	}

	/**
	 * Get all processes
	 */
	getAllProcesses() {
		return Array.from(this.processes.values());
	}

	/**
	 * Get running processes
	 */
	getRunningProcesses() {
		return Array.from(this.processes.values()).filter((p) => !p.killed);
	}

	/**
	 * Kill processes by pattern
	 */
	async killByPattern(pattern) {
		try {
			await execAsync(`pkill -f "${pattern}" || true`);
			log(`✅ Killed processes matching pattern: ${pattern}`);
		} catch (error) {
			logError(`Failed to kill processes by pattern: ${error.message}`);
		}
	}

	/**
	 * Kill process on port with retry logic and verification
	 */
	async killPort(port, options = {}) {
		const maxRetries = options.maxRetries || 3;
		const waitTime = options.waitTime || 2000;

		for (let attempt = 1; attempt <= maxRetries; attempt++) {
			try {
				log(`🔧 Clearing port ${port} (attempt ${attempt}/${maxRetries})...`);

				// First attempt: graceful termination (SIGTERM)
				await execAsync(`lsof -ti:${port} | xargs -r kill 2>/dev/null || true`);
				await this.waiter.delay(500, "graceful termination");

				// Check if port is still in use
				const { stdout } = await execAsync(
					`lsof -ti:${port} 2>/dev/null || true`,
				);
				if (!stdout.trim()) {
					log(`✅ Port ${port} cleared successfully (graceful)`);
					return true;
				}

				// Force kill if still in use (SIGKILL)
				log(`   Force killing processes on port ${port}...`);
				await execAsync(
					`lsof -ti:${port} | xargs -r kill -9 2>/dev/null || true`,
				);

				// Try fuser as fallback
				await execAsync(`fuser -k ${port}/tcp 2>/dev/null || true`);

				// Wait progressively longer between attempts
				const delay = Math.min(waitTime * attempt, 5000);
				await this.waiter.delay(delay, `port ${port} release`);

				// Verify port is free
				const { stdout: check } = await execAsync(
					`lsof -ti:${port} 2>/dev/null || true`,
				);
				if (!check.trim()) {
					log(`✅ Port ${port} cleared after ${attempt} attempt(s)`);
					return true;
				}

				// Check for TIME_WAIT sockets
				const { stdout: timeWait } = await execAsync(
					`netstat -an 2>/dev/null | grep :${port}.*TIME_WAIT | wc -l || echo "0"`,
				);
				const timeWaitCount = parseInt(timeWait.trim(), 10) || 0;
				if (timeWaitCount > 0) {
					log(`   ⚠️ ${timeWaitCount} sockets in TIME_WAIT on port ${port}`);
				}
			} catch (error) {
				logError(
					`   Attempt ${attempt} failed for port ${port}: ${error.message}`,
				);
			}
		}

		logError(`Failed to clear port ${port} after ${maxRetries} attempts`);
		return false;
	}

	/**
	 * Clear multiple ports with enhanced options
	 */
	async clearPorts(ports, options = {}) {
		const promises = ports.map((port) => this.killPort(port, options));
		const results = await Promise.allSettled(promises);

		// Log any failures
		results.forEach((result, index) => {
			if (result.status === "rejected" || result.value === false) {
				logError(`Failed to clear port ${ports[index]}`);
			}
		});

		return results.every((r) => r.status === "fulfilled" && r.value === true);
	}

	/**
	 * Monitor process health
	 */
	async monitorProcess(name, healthCheck, options = {}) {
		const processInfo = this.processes.get(name);

		if (!processInfo || processInfo.killed) {
			return false;
		}

		const interval = options.interval || 5000;
		const maxFailures = options.maxFailures || 3;
		let failures = 0;

		const monitor = setInterval(async () => {
			if (processInfo.killed || this.shuttingDown) {
				clearInterval(monitor);
				return;
			}

			try {
				const healthy = await healthCheck();
				if (!healthy) {
					failures++;
					log(
						`⚠️ Process '${name}' health check failed (${failures}/${maxFailures})`,
					);

					if (failures >= maxFailures) {
						logError(`Process '${name}' is unhealthy, restarting...`);
						clearInterval(monitor);

						if (options.onUnhealthy) {
							await options.onUnhealthy(processInfo);
						}
					}
				} else {
					failures = 0;
				}
			} catch (error) {
				failures++;
				logError(`Health check error for '${name}': ${error.message}`);
			}
		}, interval);

		processInfo.monitor = monitor;
		return true;
	}

	/**
	 * Restart a process
	 */
	async restartProcess(name) {
		const processInfo = this.processes.get(name);

		if (!processInfo) {
			throw new Error(`Process '${name}' not found`);
		}

		log(`🔄 Restarting process: ${name}`);

		// Kill existing process
		await this.killProcess(name);

		// Wait a bit for cleanup
		await this.waiter.delay(2000, "restart delay");

		// Start new process with same config
		return await this.startProcess(
			name,
			processInfo.command,
			processInfo.args,
			{
				cwd: processInfo.cwd,
				env: processInfo.env,
			},
		);
	}

	/**
	 * Get process statistics
	 */
	getStatistics() {
		const stats = {
			total: this.processes.size,
			running: 0,
			killed: 0,
			failed: 0,
			totalRuntime: 0,
		};

		for (const processInfo of this.processes.values()) {
			if (processInfo.killed) {
				stats.killed++;
				if (processInfo.exitCode && processInfo.exitCode !== 0) {
					stats.failed++;
				}
			} else {
				stats.running++;
			}

			if (processInfo.startTime) {
				const endTime = processInfo.endTime || Date.now();
				stats.totalRuntime += endTime - processInfo.startTime;
			}
		}

		return stats;
	}

	/**
	 * Clean up zombie processes
	 */
	async cleanupZombies() {
		const patterns = this.config.cleanup.processPatterns;

		for (const pattern of patterns) {
			await this.killByPattern(pattern);
		}

		log("✅ Cleaned up zombie processes");
	}
}

module.exports = { ProcessManager };
