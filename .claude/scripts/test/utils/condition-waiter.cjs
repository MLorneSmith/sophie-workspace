/**
 * Condition Waiter Utility
 * Replaces hardcoded delays with condition-based waiting
 */

const { exec } = require("node:child_process");
const { promisify } = require("node:util");
const execAsync = promisify(exec);

// Simple logging utility
function log(message, type = "info") {
	const timestamp = new Date().toISOString();
	process.stdout.write(`[${timestamp}] ${type.toUpperCase()}: ${message}\n`);
}

class ConditionWaiter {
	constructor(defaultTimeout = 30000, defaultInterval = 500) {
		this.defaultTimeout = defaultTimeout;
		this.defaultInterval = defaultInterval;
	}

	/**
	 * Wait for a condition to be true
	 * @param {Function} checkFn - Async function that returns true when condition is met
	 * @param {Object} options - Configuration options
	 * @param {number} options.timeout - Maximum time to wait (ms)
	 * @param {number} options.interval - Check interval (ms)
	 * @param {string} options.name - Condition name for logging
	 * @param {boolean} options.silent - Suppress logging
	 * @returns {Promise<boolean>} - True if condition met, throws on timeout
	 */
	async waitForCondition(checkFn, options = {}) {
		const {
			timeout = this.defaultTimeout,
			interval = this.defaultInterval,
			name = "condition",
			silent = false,
		} = options;

		const startTime = Date.now();
		let lastError = null;
		let attempts = 0;

		if (!silent) {
			log(`⏳ Waiting for ${name} (timeout: ${timeout}ms)`);
		}

		while (Date.now() - startTime < timeout) {
			attempts++;
			try {
				const result = await checkFn();
				if (result) {
					if (!silent) {
						const elapsed = Date.now() - startTime;
						log(`✅ ${name} met after ${elapsed}ms (${attempts} attempts)`);
					}
					return true;
				}
			} catch (error) {
				lastError = error;
			}

			await new Promise((resolve) => setTimeout(resolve, interval));
		}

		const elapsed = Date.now() - startTime;
		const errorMsg = `Timeout waiting for ${name} after ${elapsed}ms (${attempts} attempts)`;

		if (lastError) {
			throw new Error(`${errorMsg}. Last error: ${lastError.message}`);
		}
		throw new Error(errorMsg);
	}

	/**
	 * Wait for a port to be available
	 * @param {number} port - Port number to check
	 * @param {Object} options - Configuration options
	 * @returns {Promise<boolean>}
	 */
	async waitForPort(port, options = {}) {
		return this.waitForCondition(
			async () => {
				try {
					const { stdout } = await execAsync(
						`lsof -ti:${port} 2>/dev/null || echo "free"`,
					);
					return stdout.trim() !== "free";
				} catch {
					return false;
				}
			},
			{
				...options,
				name: options.name || `port ${port} to be available`,
			},
		);
	}

	/**
	 * Wait for a port to be free
	 * @param {number} port - Port number to check
	 * @param {Object} options - Configuration options
	 * @returns {Promise<boolean>}
	 */
	async waitForPortFree(port, options = {}) {
		return this.waitForCondition(
			async () => {
				try {
					const { stdout } = await execAsync(
						`lsof -ti:${port} 2>/dev/null || echo "free"`,
					);
					return stdout.trim() === "free";
				} catch {
					return true; // Port is free if lsof fails
				}
			},
			{
				...options,
				name: options.name || `port ${port} to be free`,
			},
		);
	}

	/**
	 * Wait for a process to exist
	 * @param {string} processName - Process name or pattern
	 * @param {Object} options - Configuration options
	 * @returns {Promise<boolean>}
	 */
	async waitForProcess(processName, options = {}) {
		return this.waitForCondition(
			async () => {
				try {
					const { stdout } = await execAsync(
						`pgrep -f "${processName}" 2>/dev/null`,
					);
					return stdout.trim().length > 0;
				} catch {
					return false;
				}
			},
			{
				...options,
				name: options.name || `process '${processName}' to start`,
			},
		);
	}

	/**
	 * Wait for a process to exit
	 * @param {string} processName - Process name or pattern
	 * @param {Object} options - Configuration options
	 * @returns {Promise<boolean>}
	 */
	async waitForProcessExit(processName, options = {}) {
		return this.waitForCondition(
			async () => {
				try {
					const { stdout } = await execAsync(
						`pgrep -f "${processName}" 2>/dev/null || echo "gone"`,
					);
					return stdout.trim() === "gone";
				} catch {
					return true; // Process is gone if pgrep fails
				}
			},
			{
				...options,
				name: options.name || `process '${processName}' to exit`,
			},
		);
	}

	/**
	 * Wait for HTTP endpoint to be ready
	 * @param {string} url - URL to check
	 * @param {Object} options - Configuration options
	 * @returns {Promise<boolean>}
	 */
	async waitForHttp(url, options = {}) {
		return this.waitForCondition(
			async () => {
				try {
					const { stdout } = await execAsync(
						`curl -s -o /dev/null -w "%{http_code}" "${url}" 2>/dev/null`,
					);
					const statusCode = parseInt(stdout.trim());
					return statusCode >= 200 && statusCode < 500;
				} catch {
					return false;
				}
			},
			{
				...options,
				name: options.name || `HTTP endpoint ${url}`,
			},
		);
	}

	/**
	 * Wait for file to exist
	 * @param {string} filepath - Path to file
	 * @param {Object} options - Configuration options
	 * @returns {Promise<boolean>}
	 */
	async waitForFile(filepath, options = {}) {
		const fs = require("node:fs").promises;
		return this.waitForCondition(
			async () => {
				try {
					await fs.access(filepath);
					return true;
				} catch {
					return false;
				}
			},
			{
				...options,
				name: options.name || `file '${filepath}' to exist`,
			},
		);
	}

	/**
	 * Wait for database connection
	 * @param {string} connectionString - Database connection string
	 * @param {Object} options - Configuration options
	 * @returns {Promise<boolean>}
	 */
	async waitForDatabase(connectionString, options = {}) {
		return this.waitForCondition(
			async () => {
				try {
					// Try to connect using psql
					const { stdout } = await execAsync(
						`psql "${connectionString}" -c "SELECT 1" 2>/dev/null`,
					);
					return stdout.includes("1");
				} catch {
					return false;
				}
			},
			{
				...options,
				name: options.name || "database connection",
			},
		);
	}

	/**
	 * Wait for Supabase to be ready
	 * @param {Object} options - Configuration options
	 * @returns {Promise<boolean>}
	 */
	async waitForSupabase(options = {}) {
		return this.waitForCondition(
			async () => {
				try {
					const { stdout } = await execAsync("npx supabase status 2>/dev/null");
					return stdout.includes("API URL") && stdout.includes("DB URL");
				} catch {
					return false;
				}
			},
			{
				timeout: 60000, // Supabase can take longer to start
				...options,
				name: options.name || "Supabase services",
			},
		);
	}

	/**
	 * Wait with a simple delay (use sparingly, only when no condition is available)
	 * @param {number} ms - Milliseconds to wait
	 * @param {string} reason - Reason for the delay (for logging)
	 */
	async delay(ms, reason = "unspecified reason") {
		log(`⏱️ Waiting ${ms}ms for ${reason}`);
		await new Promise((resolve) => setTimeout(resolve, ms));
	}

	/**
	 * Execute function with retry logic
	 * @param {Function} fn - Async function to execute
	 * @param {Object} options - Configuration options
	 * @param {number} options.maxAttempts - Maximum retry attempts
	 * @param {number} options.retryDelay - Delay between retries (ms)
	 * @param {string} options.name - Operation name for logging
	 * @returns {Promise<any>} - Result of the function
	 */
	async withRetry(fn, options = {}) {
		const { maxAttempts = 3, retryDelay = 1000, name = "operation" } = options;

		let lastError;
		for (let attempt = 1; attempt <= maxAttempts; attempt++) {
			try {
				log(`🔄 Attempt ${attempt}/${maxAttempts} for ${name}`);
				const result = await fn();
				log(`✅ ${name} succeeded on attempt ${attempt}`);
				return result;
			} catch (error) {
				lastError = error;
				if (attempt < maxAttempts) {
					log(
						`⚠️ ${name} failed on attempt ${attempt}, retrying in ${retryDelay}ms...`,
					);
					await this.delay(retryDelay, `retry delay for ${name}`);
				}
			}
		}

		throw new Error(
			`${name} failed after ${maxAttempts} attempts. Last error: ${lastError.message}`,
		);
	}
}

module.exports = { ConditionWaiter };
