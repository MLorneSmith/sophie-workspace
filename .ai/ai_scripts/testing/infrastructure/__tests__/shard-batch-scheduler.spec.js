/**
 * Unit Tests for Shard Batch Scheduler
 * Tests batch organization, sequential execution, and result aggregation
 */

const {
	BatchScheduler,
	ShardBatchQueue,
	ShardExecutor,
	ResourceMonitor,
} = require("../shard-batch-scheduler.js");

describe("ShardBatchQueue", () => {
	describe("organizeBatches", () => {
		test("should organize 10 shards into batches of 4", () => {
			const shards = [
				"test:shard1",
				"test:shard2",
				"test:shard3",
				"test:shard4",
				"test:shard5",
				"test:shard6",
				"test:shard7",
				"test:shard8",
				"test:shard9",
				"test:shard10",
			];
			const queue = new ShardBatchQueue(shards, 4);

			expect(queue.batches.length).toBe(3); // 10 shards / 4 batch size = 3 batches
			expect(queue.batches[0].length).toBe(4);
			expect(queue.batches[1].length).toBe(4);
			expect(queue.batches[2].length).toBe(2);
		});

		test("should handle single shard batch", () => {
			const shards = ["test:shard1"];
			const queue = new ShardBatchQueue(shards, 4);

			expect(queue.batches.length).toBe(1);
			expect(queue.batches[0].length).toBe(1);
		});

		test("should handle empty batch (edge case)", () => {
			const shards = [];
			const queue = new ShardBatchQueue(shards, 4);

			expect(queue.batches.length).toBe(0);
			expect(queue.isComplete()).toBe(true);
		});

		test("should organize shards evenly with exact division", () => {
			const shards = Array.from({ length: 8 }, (_, i) => `test:shard${i + 1}`);
			const queue = new ShardBatchQueue(shards, 4);

			expect(queue.batches.length).toBe(2);
			expect(queue.batches[0].length).toBe(4);
			expect(queue.batches[1].length).toBe(4);
		});

		test("should respect custom batch size", () => {
			const shards = Array.from({ length: 10 }, (_, i) => `test:shard${i + 1}`);
			const queue = new ShardBatchQueue(shards, 3);

			expect(queue.batches.length).toBe(4); // 10 shards / 3 batch size = 4 batches
			expect(queue.batches[0].length).toBe(3);
			expect(queue.batches[3].length).toBe(1);
		});
	});

	describe("batch execution tracking", () => {
		test("should track current batch correctly", () => {
			const shards = Array.from({ length: 8 }, (_, i) => `test:shard${i + 1}`);
			const queue = new ShardBatchQueue(shards, 4);

			expect(queue.currentBatchIndex).toBe(0);
			expect(queue.getCurrentBatch()).toEqual([
				"test:shard1",
				"test:shard2",
				"test:shard3",
				"test:shard4",
			]);

			queue.moveToNextBatch();
			expect(queue.currentBatchIndex).toBe(1);
			expect(queue.getCurrentBatch()).toEqual([
				"test:shard5",
				"test:shard6",
				"test:shard7",
				"test:shard8",
			]);

			queue.moveToNextBatch();
			expect(queue.isComplete()).toBe(true);
			expect(queue.getCurrentBatch()).toBeNull();
		});

		test("should track progress correctly", () => {
			const shards = Array.from({ length: 10 }, (_, i) => `test:shard${i + 1}`);
			const queue = new ShardBatchQueue(shards, 4);

			const progress = queue.getProgress();
			expect(progress.totalBatches).toBe(3);
			expect(progress.currentBatch).toBe(1);
			expect(progress.totalShards).toBe(10);
			expect(progress.completedShards).toBe(0);
			expect(progress.percentComplete).toBe(0);

			queue.recordShardResult("test:shard1", { success: true });
			queue.recordShardResult("test:shard2", { success: true });

			const updatedProgress = queue.getProgress();
			expect(updatedProgress.completedShards).toBe(2);
			expect(updatedProgress.percentComplete).toBe(20);
		});
	});

	describe("result recording", () => {
		test("should record individual shard results", () => {
			const shards = Array.from({ length: 4 }, (_, i) => `test:shard${i + 1}`);
			const queue = new ShardBatchQueue(shards, 4);

			const result1 = { shardName: "test:shard1", success: true, code: 0 };
			const result2 = { shardName: "test:shard2", success: false, code: 1 };

			queue.recordShardResult(result1.shardName, result1);
			queue.recordShardResult(result2.shardName, result2);

			expect(queue.shardResults["test:shard1"]).toEqual(result1);
			expect(queue.shardResults["test:shard2"]).toEqual(result2);
		});

		test("should record batch results", () => {
			const shards = Array.from({ length: 8 }, (_, i) => `test:shard${i + 1}`);
			const queue = new ShardBatchQueue(shards, 4);

			const batchResults = [
				{ shardName: "test:shard1", success: true },
				{ shardName: "test:shard2", success: true },
				{ shardName: "test:shard3", success: false },
				{ shardName: "test:shard4", success: true },
			];

			queue.recordBatchResult(0, batchResults);
			expect(queue.results[0]).toEqual(batchResults);
		});
	});

	describe("edge cases", () => {
		test("should handle large batch size", () => {
			const shards = Array.from({ length: 10 }, (_, i) => `test:shard${i + 1}`);
			const queue = new ShardBatchQueue(shards, 20); // Larger than shard count

			expect(queue.batches.length).toBe(1);
			expect(queue.batches[0].length).toBe(10);
		});

		test("should handle batch size of 1 (sequential execution)", () => {
			const shards = Array.from({ length: 5 }, (_, i) => `test:shard${i + 1}`);
			const queue = new ShardBatchQueue(shards, 1);

			expect(queue.batches.length).toBe(5);
			queue.batches.forEach((batch) => {
				expect(batch.length).toBe(1);
			});
		});
	});
});

describe("ResourceMonitor", () => {
	describe("memory checks", () => {
		test("should report memory usage", () => {
			const monitor = new ResourceMonitor();
			const memory = monitor.getMemoryUsage();

			expect(memory).toHaveProperty("used");
			expect(memory).toHaveProperty("free");
			expect(memory).toHaveProperty("total");
			expect(memory).toHaveProperty("percentUsed");

			expect(memory.used).toBeGreaterThanOrEqual(0);
			expect(memory.free).toBeGreaterThanOrEqual(0);
			expect(memory.total).toBeGreaterThan(0);
			expect(memory.percentUsed).toBeGreaterThanOrEqual(0);
			expect(memory.percentUsed).toBeLessThanOrEqual(100);
		});

		test("should track peak memory", () => {
			const monitor = new ResourceMonitor();
			const initialPeak = monitor.peakMemory;

			monitor.sample();
			const postSamplePeak = monitor.peakMemory;

			expect(postSamplePeak).toBeGreaterThanOrEqual(initialPeak);
		});
	});

	describe("file descriptor checks", () => {
		test("should return file descriptor count or -1 if unavailable", () => {
			const monitor = new ResourceMonitor();
			const fdCount = monitor.getFileDescriptorCount();

			// On macOS/Windows, this might be -1 (unavailable)
			// On Linux, this should be a positive number
			expect(typeof fdCount).toBe("number");
			expect(fdCount).toBeGreaterThanOrEqual(-1);
		});
	});

	describe("system load", () => {
		test("should report system load correctly", () => {
			const monitor = new ResourceMonitor();
			const load = monitor.getSystemLoad();

			expect(load).toHaveProperty("oneMin");
			expect(load).toHaveProperty("fiveMin");
			expect(load).toHaveProperty("fifteenMin");
			expect(load).toHaveProperty("cpuCount");
			expect(load).toHaveProperty("normalized");

			expect(load.cpuCount).toBeGreaterThan(0);
			expect(parseFloat(load.normalized)).toBeGreaterThanOrEqual(0);
		});
	});

	describe("sampling", () => {
		test("should collect resource samples", () => {
			const monitor = new ResourceMonitor();

			expect(monitor.samples.length).toBe(0);

			monitor.sample();
			expect(monitor.samples.length).toBe(1);

			monitor.sample();
			expect(monitor.samples.length).toBe(2);

			monitor.samples.forEach((sample) => {
				expect(sample).toHaveProperty("timestamp");
				expect(sample).toHaveProperty("memory");
				expect(sample).toHaveProperty("load");
			});
		});
	});
});

// Note: Test utilities are available via require() in integration tests
