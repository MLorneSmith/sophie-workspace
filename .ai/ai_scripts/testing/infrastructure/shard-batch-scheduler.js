#!/usr/bin/env node

/**
 * Shard Batch Scheduler
 * Manages adaptive parallelism for E2E test shards
 *
 * Problem: Running 10 shards in parallel creates 30+ concurrent browser instances,
 * exhausting system resources (memory, file descriptors, CPU).
 *
 * Solution: Batch sequential execution with adaptive parallelism:
 * - Run 4-5 shards concurrently per batch
 * - Wait for batch completion before starting next batch
 * - Allows system resources to recover between batches
 * - Monitor resource usage to validate sustainability
 *
 * Result: All shards complete successfully without SIGTERM or browser closure errors
 */

const { spawn } = require("node:child_process");
const os = require("node:os");
const fs = require("node:fs");
const path = require("node:path");

// Color codes for terminal output
const COLORS = {
	reset: "\x1b[0m",
	green: "\x1b[32m",
	red: "\x1b[31m",
	yellow: "\x1b[33m",
	blue: "\x1b[34m",
	cyan: "\x1b[36m",
};

function log(message, color = "reset") {
	const timestamp = new Date().toISOString();
	console.log(`${COLORS[color]}[${timestamp}] ${message}${COLORS.reset}`);
}

function logPhase(message) {
	log(`🚀 ${message}`, "cyan");
}

function logSuccess(message) {
	log(`✅ ${message}`, "green");
}

function logError(message) {
	log(`❌ ${message}`, "red");
}

function logWarning(message) {
	log(`⚠️  ${message}`, "yellow");
}

/**
 * Resource Monitor
 * Tracks system resource usage for sustainability validation
 */
class ResourceMonitor {
	constructor() {
		this.initialMemory = this.getMemoryUsage();
		this.peakMemory = this.initialMemory;
		this.startTime = Date.now();
		this.samples = [];
	}

	getMemoryUsage() {
		try {
			const totalMemory = os.totalmem();
			const freeMemory = os.freemem();
			const usedMemory = totalMemory - freeMemory;
			return {
				used: Math.round(usedMemory / (1024 * 1024)), // MB
				free: Math.round(freeMemory / (1024 * 1024)), // MB
				total: Math.round(totalMemory / (1024 * 1024)), // MB
				percentUsed: Math.round((usedMemory / totalMemory) * 100),
			};
		} catch (error) {
			return { used: 0, free: 0, total: 0, percentUsed: 0 };
		}
	}

	getFileDescriptorCount() {
		try {
			const { execSync } = require("node:child_process");
			const fdPath = `/proc/${process.pid}/fd`;
			if (fs.existsSync(fdPath)) {
				return fs.readdirSync(fdPath).length;
			}
			return -1; // Not available (macOS or Windows)
		} catch (error) {
			return -1;
		}
	}

	getSystemLoad() {
		const loadAvg = os.loadavg();
		const cpuCount = os.cpus().length;
		return {
			oneMin: loadAvg[0].toFixed(2),
			fiveMin: loadAvg[1].toFixed(2),
			fifteenMin: loadAvg[2].toFixed(2),
			cpuCount,
			normalized: (loadAvg[0] / cpuCount).toFixed(2),
		};
	}

	checkMemory() {
		const memory = this.getMemoryUsage();
		const minRequiredMB = 500;

		if (memory.free < minRequiredMB) {
			logWarning(
				`Low memory warning: ${memory.free}MB free (minimum: ${minRequiredMB}MB)`,
			);
			return false;
		}
		return true;
	}

	checkFileDescriptors() {
		const fdCount = this.getFileDescriptorCount();
		if (fdCount === -1) return true; // Not available, skip check

		const minRequiredFD = 1000;
		const { execSync } = require("node:child_process");
		try {
			const limitStr = execSync("ulimit -n", { encoding: "utf8" }).trim();
			const limit = parseInt(limitStr, 10);
			const available = limit - fdCount;

			if (available < minRequiredFD) {
				logWarning(
					`Low file descriptors: ${available} available (minimum: ${minRequiredFD})`,
				);
				return false;
			}
		} catch (error) {
			// Unable to check, proceed anyway
		}
		return true;
	}

	preflight() {
		logPhase("Resource Pre-flight Check");
		const memOk = this.checkMemory();
		const fdOk = this.checkFileDescriptors();

		const memory = this.getMemoryUsage();
		const load = this.getSystemLoad();

		log(
			`  Memory: ${memory.used}MB / ${memory.total}MB (${memory.percentUsed}%)`,
			"blue",
		);
		log(
			`  CPU Load: ${load.oneMin} (1min avg, normalized: ${load.normalized})`,
			"blue",
		);

		return memOk && fdOk;
	}

	sample() {
		const memory = this.getMemoryUsage();
		const load = this.getSystemLoad();
		const fdCount = this.getFileDescriptorCount();

		this.peakMemory = Math.max(this.peakMemory, memory.used);
		this.samples.push({ timestamp: Date.now(), memory, load, fdCount });

		if (memory.used > this.peakMemory * 0.9) {
			logWarning(
				`High memory usage: ${memory.used}MB / ${memory.total}MB (${memory.percentUsed}%)`,
			);
		}
	}

	summary() {
		const duration = ((Date.now() - this.startTime) / 1000).toFixed(1);
		const currentMemory = this.getMemoryUsage();
		const load = this.getSystemLoad();

		log("\n📊 Resource Summary", "blue");
		log(`  Duration: ${duration}s`, "blue");
		log(
			`  Peak Memory: ${this.peakMemory}MB (current: ${currentMemory.used}MB)`,
			"blue",
		);
		log(
			`  Final Load: ${load.oneMin} (normalized: ${load.normalized})`,
			"blue",
		);

		if (this.samples.length > 0) {
			const avgLoad = (
				this.samples.reduce((sum, s) => sum + parseFloat(s.load.oneMin), 0) /
				this.samples.length
			).toFixed(2);
			log(`  Avg Load: ${avgLoad}`, "blue");
		}
	}
}

/**
 * Shard Batch Queue
 * Organizes shards into batches for sequential execution
 */
class ShardBatchQueue {
	constructor(shards, batchSize = 4) {
		this.allShards = shards;
		this.batchSize = batchSize;
		this.batches = this.organizeBatches();
		this.currentBatchIndex = 0;
		this.results = {};
		this.shardResults = {};
	}

	organizeBatches() {
		const batches = [];
		for (let i = 0; i < this.allShards.length; i += this.batchSize) {
			batches.push(this.allShards.slice(i, i + this.batchSize));
		}
		return batches;
	}

	getCurrentBatch() {
		if (this.currentBatchIndex >= this.batches.length) {
			return null;
		}
		return this.batches[this.currentBatchIndex];
	}

	moveToNextBatch() {
		this.currentBatchIndex++;
	}

	recordShardResult(shardName, result) {
		this.shardResults[shardName] = result;
	}

	recordBatchResult(batchIndex, result) {
		this.results[batchIndex] = result;
	}

	isComplete() {
		return this.currentBatchIndex >= this.batches.length;
	}

	getProgress() {
		const totalShards = this.allShards.length;
		const completedShards = Object.keys(this.shardResults).length;
		return {
			totalBatches: this.batches.length,
			currentBatch: this.currentBatchIndex + 1,
			totalShards,
			completedShards,
			percentComplete: Math.round((completedShards / totalShards) * 100),
		};
	}
}

/**
 * Shard Executor
 * Runs individual shards and handles result parsing
 */
class ShardExecutor {
	constructor(projectRoot) {
		this.projectRoot = projectRoot;
	}

	async executeShardSync(shardName) {
		return new Promise((resolve) => {
			const startTime = Date.now();
			const npm = process.platform === "win32" ? "npm.cmd" : "npm";

			log(`  Starting ${shardName}...`, "blue");

			const child = spawn(npm, ["run", shardName], {
				cwd: path.join(this.projectRoot, "apps/e2e"),
				stdio: ["ignore", "pipe", "pipe"],
			});

			let stdout = "";
			let stderr = "";

			child.stdout.on("data", (data) => {
				stdout += data.toString();
			});

			child.stderr.on("data", (data) => {
				stderr += data.toString();
			});

			child.on("close", (code) => {
				const duration = ((Date.now() - startTime) / 1000).toFixed(1);
				const success = code === 0;
				const status = success ? "✓" : "✗";

				log(
					`  ${status} ${shardName} completed in ${duration}s (exit code: ${code})`,
					success ? "green" : "red",
				);

				resolve({
					shardName,
					success,
					code,
					duration: parseFloat(duration),
					stdout,
					stderr,
				});
			});
		});
	}

	async executeBatchConcurrent(shards) {
		// Run multiple shards concurrently within a batch
		const promises = shards.map((shard) => this.executeShardSync(shard));
		return Promise.all(promises);
	}
}

/**
 * Batch Scheduler
 * Main orchestrator for batch-based shard execution
 */
class BatchScheduler {
	constructor(options = {}) {
		this.projectRoot =
			options.projectRoot || path.resolve(__dirname, "../../../..");
		this.batchSize = parseInt(process.env.E2E_SHARD_BATCH_SIZE || "4", 10);
		this.enableBatching =
			(process.env.E2E_ENABLE_BATCH_SCHEDULING ?? "true") === "true";
		this.enableResourceCheck =
			(process.env.E2E_RESOURCE_CHECK_ENABLED ?? "true") === "true";

		this.shards = this.discoverShards();
		this.queue = new ShardBatchQueue(this.shards, this.batchSize);
		this.executor = new ShardExecutor(this.projectRoot);
		this.resourceMonitor = new ResourceMonitor();
		this.failedShards = [];
		this.totalDuration = 0;
	}

	discoverShards() {
		// Discover shard scripts from package.json
		const pkgPath = path.join(this.projectRoot, "apps/e2e/package.json");
		try {
			const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
			const scripts = pkg.scripts || {};
			const shards = Object.keys(scripts)
				.filter((name) => name.startsWith("test:shard"))
				.sort((a, b) => {
					const numA = parseInt(a.match(/\d+/)[0], 10);
					const numB = parseInt(b.match(/\d+/)[0], 10);
					return numA - numB;
				});

			return shards;
		} catch (error) {
			logError(`Failed to discover shards: ${error.message}`);
			process.exit(1);
		}
	}

	async runBatch(batch, batchIndex) {
		const batchNum = batchIndex + 1;
		const totalBatches = this.queue.batches.length;

		logPhase(`Batch ${batchNum}/${totalBatches}: ${batch.join(", ")}`);
		this.resourceMonitor.sample();

		const results = await this.executor.executeBatchConcurrent(batch);

		// Record results
		results.forEach((result) => {
			this.queue.recordShardResult(result.shardName, result);
			if (!result.success) {
				this.failedShards.push(result.shardName);
			}
		});

		this.queue.recordBatchResult(batchIndex, results);

		const passed = results.filter((r) => r.success).length;
		const failed = results.filter((r) => !r.success).length;

		logSuccess(
			`Batch ${batchNum} complete: ${passed} passed, ${failed} failed`,
		);
		this.resourceMonitor.sample();
	}

	async run() {
		const startTime = Date.now();

		logPhase("Shard Batch Scheduler");
		log(`  Total shards: ${this.shards.length}`, "blue");
		log(`  Batch size: ${this.batchSize}`, "blue");
		log(`  Total batches: ${this.queue.batches.length}`, "blue");
		log(`  Batching enabled: ${this.enableBatching}`, "blue");
		log("");

		// Preflight resource check
		if (this.enableResourceCheck) {
			const resourcesOk = this.resourceMonitor.preflight();
			if (!resourcesOk) {
				logWarning(
					"Resource check failed, but proceeding anyway (override with E2E_RESOURCE_CHECK_ENABLED=false)",
				);
			}
			log("");
		}

		// Run batches sequentially
		let batchIndex = 0;
		while (!this.queue.isComplete()) {
			const batch = this.queue.getCurrentBatch();
			if (batch) {
				await this.runBatch(batch, batchIndex);
				this.queue.moveToNextBatch();
				batchIndex++;
				log(""); // Spacing between batches
			}
		}

		this.totalDuration = (Date.now() - startTime) / 1000;

		// Generate summary
		this.printSummary();
		this.resourceMonitor.summary();

		// Exit with error if any shards failed
		const hasFailures = this.failedShards.length > 0;
		process.exit(hasFailures ? 1 : 0);
	}

	printSummary() {
		const totalShards = this.shards.length;
		const passedShards = totalShards - this.failedShards.length;
		const passRate = ((passedShards / totalShards) * 100).toFixed(1);

		log("\n📋 Test Summary", "blue");
		log(`  Total Shards: ${totalShards}`, "blue");
		log(`  Passed: ${passedShards}`, "green");
		if (this.failedShards.length > 0) {
			log(`  Failed: ${this.failedShards.length}`, "red");
			log(`  Failed Shards: ${this.failedShards.join(", ")}`, "red");
		}
		log(
			`  Pass Rate: ${passRate}%`,
			passedShards === totalShards ? "green" : "red",
		);
		log(`  Total Duration: ${this.totalDuration.toFixed(1)}s`, "blue");
	}
}

// Main execution
async function main() {
	try {
		const scheduler = new BatchScheduler();
		await scheduler.run();
	} catch (error) {
		logError(`Scheduler error: ${error.message}`);
		console.error(error);
		process.exit(1);
	}
}

if (require.main === module) {
	main();
}

module.exports = {
	BatchScheduler,
	ShardBatchQueue,
	ShardExecutor,
	ResourceMonitor,
};
