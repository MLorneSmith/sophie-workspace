/**
 * Test Health Monitor
 * Monitors test execution health and detects hanging/stuck processes
 */

const { exec } = require("node:child_process");
const { promisify } = require("node:util");
const execAsync = promisify(exec);

class TestHealthMonitor {
	constructor(config) {
		this.config = config;
		this.activeMonitors = new Map();
		this.healthChecks = [];
	}

	/**
	 * Start monitoring a test process
	 */
	startMonitoring(processId, name, options = {}) {
		const monitor = {
			pid: processId,
			name,
			startTime: Date.now(),
			lastActivity: Date.now(),
			checks: [],
			options: {
				checkInterval: options.checkInterval || 30000, // 30 seconds
				inactivityThreshold: options.inactivityThreshold || 120000, // 2 minutes
				memoryThreshold: options.memoryThreshold || 500 * 1024 * 1024, // 500MB
				...options,
			},
		};

		// Set up periodic health checks
		const intervalId = setInterval(
			() => this.performHealthCheck(processId),
			monitor.options.checkInterval,
		);

		monitor.intervalId = intervalId;
		this.activeMonitors.set(processId, monitor);

		return monitor;
	}

	/**
	 * Stop monitoring a process
	 */
	stopMonitoring(processId) {
		const monitor = this.activeMonitors.get(processId);
		if (monitor) {
			clearInterval(monitor.intervalId);
			this.activeMonitors.delete(processId);
		}
	}

	/**
	 * Perform health check on a process
	 */
	async performHealthCheck(processId) {
		const monitor = this.activeMonitors.get(processId);
		if (!monitor) return;

		const healthCheck = {
			timestamp: Date.now(),
			pid: processId,
			name: monitor.name,
			issues: [],
			metrics: {},
		};

		try {
			// Check if process is still running
			const isRunning = await this.isProcessRunning(processId);
			if (!isRunning) {
				healthCheck.issues.push("Process is not running");
				this.stopMonitoring(processId);
				return;
			}

			// Check CPU and memory usage
			const processStats = await this.getProcessStats(processId);
			healthCheck.metrics = processStats;

			// Check for high memory usage
			if (processStats.memory > monitor.options.memoryThreshold) {
				healthCheck.issues.push(
					`High memory usage: ${Math.round(processStats.memory / 1024 / 1024)}MB`,
				);
			}

			// Check for CPU hang (0% CPU for extended period)
			if (processStats.cpu === 0) {
				const inactivityDuration = Date.now() - monitor.lastActivity;
				if (inactivityDuration > monitor.options.inactivityThreshold) {
					healthCheck.issues.push(
						`Process appears inactive for ${Math.round(inactivityDuration / 1000)}s`,
					);
				}
			} else {
				monitor.lastActivity = Date.now();
			}

			// Check for zombie child processes
			const zombieCount = await this.checkForZombieProcesses(processId);
			if (zombieCount > 0) {
				healthCheck.issues.push(
					`${zombieCount} zombie child processes detected`,
				);
			}

			// Store health check
			monitor.checks.push(healthCheck);
			if (monitor.checks.length > 10) {
				monitor.checks.shift(); // Keep only last 10 checks
			}

			// Report issues
			if (healthCheck.issues.length > 0) {
				this.reportHealthIssues(monitor, healthCheck);
			}
		} catch (error) {
			healthCheck.issues.push(`Health check error: ${error.message}`);
		}

		this.healthChecks.push(healthCheck);
	}

	/**
	 * Check if a process is running
	 */
	async isProcessRunning(pid) {
		try {
			const { stdout } = await execAsync(
				`ps -p ${pid} -o pid= 2>/dev/null || echo ""`,
			);
			return stdout.trim() !== "";
		} catch {
			return false;
		}
	}

	/**
	 * Get process statistics
	 */
	async getProcessStats(pid) {
		try {
			// Get CPU and memory usage
			const { stdout: psOutput } = await execAsync(
				`ps -p ${pid} -o pid,%cpu,%mem,rss,vsz,state 2>/dev/null | tail -n 1`,
			);

			if (!psOutput.trim()) {
				return { cpu: 0, memory: 0, state: "unknown" };
			}

			const parts = psOutput.trim().split(/\s+/);
			return {
				cpu: parseFloat(parts[1]) || 0,
				memoryPercent: parseFloat(parts[2]) || 0,
				memory: parseInt(parts[3]) * 1024 || 0, // RSS in bytes
				virtualMemory: parseInt(parts[4]) * 1024 || 0, // VSZ in bytes
				state: parts[5] || "unknown",
			};
		} catch (_error) {
			return { cpu: 0, memory: 0, state: "error" };
		}
	}

	/**
	 * Check for zombie processes
	 */
	async checkForZombieProcesses(parentPid) {
		try {
			const { stdout } = await execAsync(
				`ps --ppid ${parentPid} -o state --no-headers 2>/dev/null | grep -c "Z" || echo "0"`,
			);
			return parseInt(stdout.trim()) || 0;
		} catch {
			return 0;
		}
	}

	/**
	 * Report health issues
	 */
	reportHealthIssues(_monitor, healthCheck) {
		for (const _issue of healthCheck.issues) {
		}

		if (healthCheck.metrics.cpu !== undefined) {
		}
		if (healthCheck.metrics.memory) {
		}
	}

	/**
	 * Check for hanging Playwright processes
	 */
	async checkForHangingPlaywright() {
		try {
			// Look for Playwright processes that have been running too long
			const { stdout } = await execAsync(
				`ps aux | grep -E "playwright|chromium" | grep -v grep || echo ""`,
			);

			const processes = stdout
				.trim()
				.split("\n")
				.filter(Boolean)
				.map((line) => {
					const parts = line.split(/\s+/);
					return {
						pid: parts[1],
						cpu: parseFloat(parts[2]),
						mem: parseFloat(parts[3]),
						time: parts[9],
						command: parts.slice(10).join(" "),
					};
				});

			const hanging = processes.filter((p) => {
				// Check if process has been running for more than 10 minutes
				const timeParts = p.time.split(":");
				const minutes = parseInt(timeParts[0]) * 60 + parseInt(timeParts[1]);
				return minutes > 10;
			});

			return hanging;
		} catch {
			return [];
		}
	}

	/**
	 * Generate health report
	 */
	generateHealthReport() {
		const report = {
			timestamp: new Date().toISOString(),
			activeMonitors: Array.from(this.activeMonitors.values()).map((m) => ({
				name: m.name,
				pid: m.pid,
				runningTime: Math.round((Date.now() - m.startTime) / 1000),
				lastActivity: Math.round((Date.now() - m.lastActivity) / 1000),
				recentIssues: m.checks
					.filter((c) => c.issues.length > 0)
					.slice(-3)
					.flatMap((c) => c.issues),
			})),
			recentHealthChecks: this.healthChecks.slice(-10),
		};

		return report;
	}

	/**
	 * Kill hanging processes
	 */
	async killHangingProcesses(options = {}) {
		const killed = [];

		try {
			// Kill old Playwright processes
			const hanging = await this.checkForHangingPlaywright();
			for (const proc of hanging) {
				try {
					await execAsync(`kill -9 ${proc.pid} 2>/dev/null`);
					killed.push({ pid: proc.pid, command: proc.command });
				} catch {
					// Process might have already exited
				}
			}

			// Kill monitored processes that are unresponsive
			for (const [pid, monitor] of this.activeMonitors) {
				const inactivityDuration = Date.now() - monitor.lastActivity;
				if (inactivityDuration > (options.killThreshold || 300000)) {
					try {
						await execAsync(`kill -9 ${pid} 2>/dev/null`);
						killed.push({ pid, name: monitor.name });
						this.stopMonitoring(pid);
					} catch {
						// Process might have already exited
					}
				}
			}
		} catch (_error) {}

		return killed;
	}

	/**
	 * Clean up all monitors
	 */
	cleanup() {
		for (const [_pid, monitor] of this.activeMonitors) {
			clearInterval(monitor.intervalId);
		}
		this.activeMonitors.clear();
		this.healthChecks = [];
	}
}

module.exports = { TestHealthMonitor };
