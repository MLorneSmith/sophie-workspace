#!/usr/bin/env node

/**
 * Test Cache Manager
 * Implements intelligent test result caching with hash-based change detection
 */

const crypto = require("node:crypto");
const fs = require("node:fs").promises;
const path = require("node:path");
const { execSync } = require("node:child_process");

/**
 * Stringify JSON with tab indentation for Biome compatibility
 * @param {*} data - Data to stringify
 * @returns {string} JSON string with tab indentation
 */
function stringifyWithTabs(data) {
	return JSON.stringify(data, null, "\t");
}

// Helper function to glob files
async function glob(pattern) {
	try {
		if (pattern?.includes("**/*.spec.ts")) {
			const result = execSync(
				`find apps/e2e/tests -name "*.spec.ts" 2>/dev/null`,
				{ encoding: "utf8" },
			);
			return result.split("\n").filter(Boolean);
		}
		// For other patterns, just return empty for now
		return [];
	} catch (_error) {
		return [];
	}
}

class TestCacheManager {
	constructor() {
		this.cacheDir = path.join(process.cwd(), ".claude/cache/test-results");
		this.hashFile = path.join(this.cacheDir, "file-hashes.json");
		this.resultCache = path.join(this.cacheDir, "test-results.json");
		this.dependencyMap = path.join(this.cacheDir, "dependency-map.json");
		this.cache = null;
		this.hashes = {};
		this.dependencies = {};
		this.cacheValidityMinutes = 5; // Default cache validity
	}

	/**
	 * Initialize cache system
	 */
	async init() {
		// Create cache directory
		await fs.mkdir(this.cacheDir, { recursive: true });

		// Load existing cache
		await this.loadCache();
		await this.loadHashes();
		await this.loadDependencies();
		return true;
	}

	/**
	 * Load cache from disk
	 */
	async loadCache() {
		try {
			const data = await fs.readFile(this.resultCache, "utf8");
			this.cache = JSON.parse(data);
		} catch (_error) {
			// Initialize empty cache
			this.cache = {
				results: {},
				metadata: {
					created: new Date().toISOString(),
					lastUpdated: new Date().toISOString(),
					version: "1.0.0",
				},
			};
		}
	}

	/**
	 * Load file hashes from disk
	 */
	async loadHashes() {
		try {
			const data = await fs.readFile(this.hashFile, "utf8");
			this.hashes = JSON.parse(data);
		} catch (_error) {
			this.hashes = {};
		}
	}

	/**
	 * Load dependency map
	 */
	async loadDependencies() {
		try {
			const data = await fs.readFile(this.dependencyMap, "utf8");
			this.dependencies = JSON.parse(data);
		} catch (_error) {
			this.dependencies = {};
		}
	}

	/**
	 * Save all cache data to disk
	 */
	async saveCache() {
		this.cache.metadata.lastUpdated = new Date().toISOString();
		await fs.writeFile(this.resultCache, stringifyWithTabs(this.cache));
		await fs.writeFile(this.hashFile, stringifyWithTabs(this.hashes));
		await fs.writeFile(
			this.dependencyMap,
			stringifyWithTabs(this.dependencies),
		);
	}

	/**
	 * Calculate hash for a file
	 */
	async calculateFileHash(filePath) {
		try {
			const content = await fs.readFile(filePath, "utf8");
			return crypto.createHash("sha256").update(content).digest("hex");
		} catch (_error) {
			return null;
		}
	}

	/**
	 * Calculate hash for multiple files (composite hash)
	 */
	async calculateCompositeHash(filePaths) {
		const hashes = [];
		for (const filePath of filePaths) {
			const hash = await this.calculateFileHash(filePath);
			if (hash) hashes.push(hash);
		}

		if (hashes.length === 0) return null;

		// Create composite hash from individual hashes
		return crypto.createHash("sha256").update(hashes.join("")).digest("hex");
	}

	/**
	 * Check if a test file has changed
	 */
	async hasFileChanged(filePath) {
		const currentHash = await this.calculateFileHash(filePath);
		const previousHash = this.hashes[filePath];

		if (!previousHash) {
			// New file or first run
			this.hashes[filePath] = currentHash;
			return true;
		}

		if (currentHash !== previousHash) {
			// File has changed
			this.hashes[filePath] = currentHash;
			return true;
		}

		return false;
	}

	/**
	 * Check if any dependencies of a test have changed
	 */
	async haveDependenciesChanged(testFile) {
		const deps = this.dependencies[testFile] || [];

		for (const dep of deps) {
			if (await this.hasFileChanged(dep)) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Analyze test file to discover dependencies
	 */
	async analyzeDependencies(testFile) {
		const dependencies = new Set();

		try {
			const content = await fs.readFile(testFile, "utf8");

			// Extract import statements
			const importRegex = /import\s+.*?\s+from\s+['"](.+?)['"]/g;
			let match;

			while ((match = importRegex.exec(content)) !== null) {
				const importPath = match[1];

				// Resolve relative imports
				if (importPath.startsWith(".")) {
					const resolvedPath = path.resolve(path.dirname(testFile), importPath);

					// Try different extensions
					const extensions = [
						".ts",
						".tsx",
						".js",
						".jsx",
						"/index.ts",
						"/index.tsx",
					];
					for (const ext of extensions) {
						const fullPath =
							resolvedPath.endsWith(".ts") || resolvedPath.endsWith(".tsx")
								? resolvedPath
								: resolvedPath + ext;

						try {
							await fs.access(fullPath);
							dependencies.add(fullPath);
							break;
						} catch (_error) {
							// Try next extension
						}
					}
				}
			}

			// Also check for page object models and helpers
			if (content.includes("page.goto")) {
				// This test navigates to pages, mark common app dependencies
				// In a real implementation, this would track actual route files
				dependencies.add("apps/web/app/layout.tsx");
			}
		} catch (_error) {}

		this.dependencies[testFile] = Array.from(dependencies);
		return dependencies;
	}

	/**
	 * Get cached results for a test
	 */
	getCachedResult(testFile) {
		const cached = this.cache.results[testFile];

		if (!cached) return null;

		// Check if cache is still valid
		const cacheAge = Date.now() - new Date(cached.timestamp).getTime();
		const maxAge = this.cacheValidityMinutes * 60 * 1000;

		if (cacheAge > maxAge) {
			// Cache expired
			delete this.cache.results[testFile];
			return null;
		}

		return cached;
	}

	/**
	 * Store test results in cache
	 */
	cacheTestResult(testFile, result) {
		this.cache.results[testFile] = {
			...result,
			timestamp: new Date().toISOString(),
			hash: this.hashes[testFile],
		};
	}

	/**
	 * Determine which tests need to be run
	 */
	async determineTestsToRun(requestedTests) {
		const testsToRun = [];
		const cachedTests = [];
		const _skippedTests = [];

		for (const testFile of requestedTests) {
			// Check if test file itself has changed
			const fileChanged = await this.hasFileChanged(testFile);

			// Analyze and check dependencies
			await this.analyzeDependencies(testFile);
			const depsChanged = await this.haveDependenciesChanged(testFile);

			// Check for cached results
			const cachedResult = this.getCachedResult(testFile);

			if (!fileChanged && !depsChanged && cachedResult && cachedResult.passed) {
				// Use cached result
				cachedTests.push({
					file: testFile,
					result: cachedResult,
				});
			} else if (
				!fileChanged &&
				!depsChanged &&
				cachedResult &&
				!cachedResult.passed
			) {
				// Previous failure, should rerun
				testsToRun.push({
					file: testFile,
					reason: "previous_failure",
					lastResult: cachedResult,
				});
			} else if (fileChanged) {
				testsToRun.push({
					file: testFile,
					reason: "file_changed",
				});
			} else if (depsChanged) {
				testsToRun.push({
					file: testFile,
					reason: "dependencies_changed",
				});
			} else {
				// No cached result, need to run
				testsToRun.push({
					file: testFile,
					reason: "no_cache",
				});
			}
		}

		// Save current state
		await this.saveCache();

		const summary = {
			total: requestedTests.length,
			toRun: testsToRun.length,
			cached: cachedTests.length,
			testsToRun,
			cachedTests,
		};

		if (testsToRun.length > 0) {
			const reasons = {};
			for (const test of testsToRun) {
				reasons[test.reason] = (reasons[test.reason] || 0) + 1;
			}
			for (const [_reason, _count] of Object.entries(reasons)) {
			}
		}

		return summary;
	}

	/**
	 * Invalidate cache for specific files or patterns
	 */
	async invalidateCache(patterns = []) {
		if (patterns.length === 0) {
			// Clear entire cache
			this.cache.results = {};
			this.hashes = {};
		} else {
			// Clear specific patterns
			let _cleared = 0;
			for (const pattern of patterns) {
				const files = await glob(pattern);
				for (const file of files) {
					if (this.cache.results[file]) {
						delete this.cache.results[file];
						delete this.hashes[file];
						_cleared++;
					}
				}
			}
		}

		await this.saveCache();
	}

	/**
	 * Generate cache statistics
	 */
	async getCacheStats() {
		const stats = {
			totalCached: Object.keys(this.cache.results).length,
			totalHashes: Object.keys(this.hashes).length,
			cacheSize: 0,
			oldestEntry: null,
			newestEntry: null,
			hitRate: 0,
			successRate: 0,
		};

		// Calculate cache size
		try {
			const cacheFiles = await fs.readdir(this.cacheDir);
			for (const file of cacheFiles) {
				const filePath = path.join(this.cacheDir, file);
				const stat = await fs.stat(filePath);
				stats.cacheSize += stat.size;
			}
		} catch (_error) {
			// Ignore
		}

		// Find oldest and newest entries
		let oldest = Infinity;
		let newest = 0;
		let totalTests = 0;
		let passedTests = 0;

		for (const result of Object.values(this.cache.results)) {
			const timestamp = new Date(result.timestamp).getTime();
			if (timestamp < oldest) {
				oldest = timestamp;
				stats.oldestEntry = result.timestamp;
			}
			if (timestamp > newest) {
				newest = timestamp;
				stats.newestEntry = result.timestamp;
			}

			totalTests++;
			if (result.passed) passedTests++;
		}

		if (totalTests > 0) {
			stats.successRate = Number(((passedTests / totalTests) * 100).toFixed(1));
		}

		// Format cache size
		const cacheSizeBytes = stats.cacheSize;
		if (cacheSizeBytes > 1024 * 1024) {
			stats.cacheSizeFormatted = `${(cacheSizeBytes / (1024 * 1024)).toFixed(2)} MB`;
		} else if (cacheSizeBytes > 1024) {
			stats.cacheSizeFormatted = `${(cacheSizeBytes / 1024).toFixed(2)} KB`;
		} else {
			stats.cacheSizeFormatted = `${cacheSizeBytes} bytes`;
		}

		return stats;
	}

	/**
	 * Prune old cache entries
	 */
	async pruneCache(maxAgeDays = 7) {
		const maxAge = maxAgeDays * 24 * 60 * 60 * 1000;
		const now = Date.now();
		let pruned = 0;

		for (const [file, result] of Object.entries(this.cache.results)) {
			const age = now - new Date(result.timestamp).getTime();
			if (age > maxAge) {
				delete this.cache.results[file];
				pruned++;
			}
		}

		if (pruned > 0) {
			await this.saveCache();
		}

		return pruned;
	}

	/**
	 * Export cache for analysis
	 */
	async exportCache(outputPath) {
		const exportData = {
			metadata: this.cache.metadata,
			statistics: await this.getCacheStats(),
			results: this.cache.results,
			hashes: this.hashes,
			dependencies: this.dependencies,
		};

		await fs.writeFile(outputPath, stringifyWithTabs(exportData));
		return exportData;
	}
}

// CLI interface
async function main() {
	const manager = new TestCacheManager();
	const args = process.argv.slice(2);
	const command = args[0] || "status";

	await manager.init();

	switch (command) {
		case "status": {
			// Show cache status
			const stats = await manager.getCacheStats();
			if (stats.oldestEntry) {
			}
			if (stats.newestEntry) {
			}
			break;
		}

		case "check": {
			// Check which tests need to run
			const pattern = args[1] || "apps/e2e/tests/**/*.spec.ts";
			const testFiles = await glob(pattern);
			const summary = await manager.determineTestsToRun(testFiles);

			if (summary.toRun > 0) {
				for (const _test of summary.testsToRun.slice(0, 10)) {
				}
				if (summary.testsToRun.length > 10) {
				}
			}

			if (summary.cached > 0) {
				for (const _test of summary.cachedTests.slice(0, 5)) {
				}
				if (summary.cachedTests.length > 5) {
				}
			}
			break;
		}

		case "invalidate": {
			// Invalidate cache
			const patterns = args.slice(1);
			await manager.invalidateCache(patterns);
			break;
		}

		case "prune": {
			// Prune old entries
			const days = parseInt(args[1], 10) || 7;
			const _pruned = await manager.pruneCache(days);
			break;
		}

		case "export": {
			// Export cache
			const outputPath = args[1] || "/tmp/test-cache-export.json";
			await manager.exportCache(outputPath);
			break;
		}

		case "set-validity": {
			// Set cache validity period
			const minutes = parseInt(args[1], 10) || 5;
			manager.cacheValidityMinutes = minutes;
			await manager.saveCache();
			break;
		}

		default:
	}
}

// Run if executed directly
if (require.main === module) {
	main().catch(console.error);
}

module.exports = { TestCacheManager };
