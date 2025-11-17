#!/usr/bin/env node

/**
 * Resource Lock Manager for Test Infrastructure
 * Provides exclusive locks on ports and other shared resources
 * to prevent test conflicts during parallel execution
 * @fileoverview TypeScript-checked CommonJS module
 */

// @ts-check
const fs = require("node:fs").promises;
const path = require("node:path");
const os = require("node:os");

class ResourceLock {
	/**
	 * @param {string} [lockDir] - Directory for lock files
	 */
	constructor(lockDir = "/tmp/.claude_test_locks") {
		this.lockDir = lockDir;
		this.locks = new Map();
		this.pid = process.pid;
		this.hostname = os.hostname();
	}

	/**
	 * Initialize the lock manager
	 * @returns {Promise<void>}
	 */
	async init() {
		try {
			await fs.mkdir(this.lockDir, { recursive: true });
			// Clean up stale locks on initialization
			await this.cleanStaleLocks();
		} catch (_error) {}
	}

	/**
	 * Acquire a lock on a resource (e.g., port)
	 * @param {string} resource - Resource identifier (e.g., "port:3000")
	 * @param {number} [timeout] - Timeout in ms to wait for lock
	 * @returns {Promise<boolean>} - True if lock acquired, false otherwise
	 */
	async acquire(resource, timeout = 30000) {
		const lockFile = path.join(
			this.lockDir,
			`${resource.replace(/:/g, "_")}.lock`,
		);
		const startTime = Date.now();

		while (Date.now() - startTime < timeout) {
			try {
				// Try to create lock file exclusively
				const lockData = {
					pid: this.pid,
					hostname: this.hostname,
					timestamp: Date.now(),
					resource: resource,
				};

				// Use exclusive write flag to prevent race conditions
				await fs.writeFile(lockFile, JSON.stringify(lockData), { flag: "wx" });

				this.locks.set(resource, lockFile);
				return true;
			} catch (error) {
				if (
					error &&
					typeof error === "object" &&
					"code" in error &&
					error.code === "EEXIST"
				) {
					// Lock file exists, check if it's stale
					const isStale = await this.isLockStale(lockFile);
					if (isStale) {
						await this.removeLock(lockFile);
						continue;
					}

					// Wait and retry
					await new Promise((/** @type {(value: unknown) => void} */ resolve) =>
						setTimeout(resolve, 1000),
					);
				} else {
					return false;
				}
			}
		}
		return false;
	}

	/**
	 * Release a lock on a resource
	 * @param {string} resource - Resource identifier
	 */
	async release(resource) {
		const lockFile = this.locks.get(resource);
		if (!lockFile) {
			return;
		}

		try {
			await fs.unlink(lockFile);
			this.locks.delete(resource);
		} catch (error) {
			if (error.code !== "ENOENT") {
			}
		}
	}

	/**
	 * Release all locks held by this process
	 */
	async releaseAll() {
		for (const resource of this.locks.keys()) {
			await this.release(resource);
		}
	}

	/**
	 * Check if a lock is stale (process no longer exists)
	 * @param {string} lockFile - Path to lock file
	 * @returns {Promise<boolean>} - True if lock is stale
	 */
	async isLockStale(lockFile) {
		try {
			const data = await fs.readFile(lockFile, "utf8");
			const lockData = JSON.parse(data);

			// Check if lock is older than 10 minutes
			if (Date.now() - lockData.timestamp > 10 * 60 * 1000) {
				return true;
			}

			// Check if process is still alive (only works on same host)
			if (lockData.hostname === this.hostname) {
				try {
					process.kill(lockData.pid, 0);
					return false; // Process exists
				} catch (_error) {
					return true; // Process doesn't exist
				}
			}

			return false;
		} catch (_error) {
			return true; // Assume stale if can't read/parse
		}
	}

	/**
	 * Remove a lock file
	 * @param {string} lockFile - Path to lock file
	 */
	async removeLock(lockFile) {
		try {
			await fs.unlink(lockFile);
		} catch (error) {
			if (error.code !== "ENOENT") {
			}
		}
	}

	/**
	 * Clean up stale locks from crashed processes
	 */
	async cleanStaleLocks() {
		try {
			const files = await fs.readdir(this.lockDir);
			const lockFiles = files.filter((f) => f.endsWith(".lock"));

			for (const file of lockFiles) {
				const lockFile = path.join(this.lockDir, file);
				const isStale = await this.isLockStale(lockFile);
				if (isStale) {
					await this.removeLock(lockFile);
				}
			}
		} catch (_error) {}
	}

	/**
	 * Wait for a resource to become available
	 * @param {string} resource - Resource identifier
	 * @param {number} timeout - Timeout in ms
	 * @returns {Promise<boolean>} - True if resource became available
	 */
	async waitForResource(resource, timeout = 30000) {
		const lockFile = path.join(
			this.lockDir,
			`${resource.replace(/:/g, "_")}.lock`,
		);
		const startTime = Date.now();

		while (Date.now() - startTime < timeout) {
			try {
				await fs.access(lockFile);
				// Lock exists, wait
				await new Promise((resolve) => setTimeout(resolve, 1000));
			} catch (_error) {
				// Lock doesn't exist, resource is available
				return true;
			}
		}

		return false;
	}

	/**
	 * Get all currently held locks
	 * @returns {Promise<Array>} - Array of lock information
	 */
	async getCurrentLocks() {
		const locks = [];
		try {
			const files = await fs.readdir(this.lockDir);
			const lockFiles = files.filter((f) => f.endsWith(".lock"));

			for (const file of lockFiles) {
				const lockFile = path.join(this.lockDir, file);
				try {
					const data = await fs.readFile(lockFile, "utf8");
					locks.push(JSON.parse(data));
				} catch (_error) {
					// Skip if can't read
				}
			}
		} catch (_error) {}
		return locks;
	}
}

// Export for use in other modules
module.exports = { ResourceLock };

// CLI interface for testing/debugging
if (require.main === module) {
	const command = process.argv[2];
	const resource = process.argv[3];

	const lockManager = new ResourceLock();

	(async () => {
		await lockManager.init();

		switch (command) {
			case "acquire": {
				if (!resource) {
					process.exit(1);
				}
				const acquired = await lockManager.acquire(resource);
				process.exit(acquired ? 0 : 1);
				break;
			}

			case "release":
				if (!resource) {
					process.exit(1);
				}
				await lockManager.release(resource);
				break;

			case "clean":
				await lockManager.cleanStaleLocks();
				break;

			case "list": {
				const locks = await lockManager.getCurrentLocks();
				locks.forEach((lock) => {
					const _age = Math.round((Date.now() - lock.timestamp) / 1000);
				});
				break;
			}

			default:
		}
	})();
}
