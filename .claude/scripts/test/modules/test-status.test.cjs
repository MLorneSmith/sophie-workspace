/**
 * Unit Tests for Test Status Module
 * Tests all functionality of the TestStatus class
 */

const { describe, it, expect, beforeEach, afterEach, vi } = require("vitest");
const { TestStatus } = require("./test-status.cjs");
const path = require("node:path");
const os = require("node:os");

// Mock fs module
vi.mock("node:fs", () => ({
	promises: {
		writeFile: vi.fn(),
	},
}));

describe("TestStatus Module", () => {
	let testStatus;
	let config;
	let tempDir;
	let fs;

	beforeEach(async () => {
		// Get mocked fs
		fs = require("node:fs").promises;

		// Create temp directory for test files
		tempDir = path.join(os.tmpdir(), `test-status-test-${Date.now()}`);

		config = {
			resultFile: path.join(tempDir, "test-results.json"),
			statusFile: path.join(tempDir, "test-status.txt"),
		};

		testStatus = new TestStatus(config);

		// Clear mock calls
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("constructor and reset", () => {
		it("should initialize with default status", () => {
			const status = testStatus.getStatus();

			expect(status.phase).toBe("initializing");
			expect(status.status).toBe("running");
			expect(status.startTime).toBeDefined();
			expect(status.unit).toEqual({
				total: 0,
				passed: 0,
				failed: 0,
				skipped: 0,
			});
			expect(status.e2e).toEqual({
				total: 0,
				passed: 0,
				failed: 0,
				skipped: 0,
				intentionalFailures: 0,
				shards: {},
			});
			expect(status.infrastructure).toEqual({
				supabase: "unknown",
				ports: "unknown",
				environment: "unknown",
			});
			expect(status.errors).toEqual([]);
		});

		it("should reset status to initial state", () => {
			// Modify status
			testStatus.status.phase = "testing";
			testStatus.status.unit.total = 10;
			testStatus.status.errors.push({ message: "test error" });

			// Reset
			testStatus.reset();

			const status = testStatus.getStatus();
			expect(status.phase).toBe("initializing");
			expect(status.unit.total).toBe(0);
			expect(status.errors).toEqual([]);
		});
	});

	describe("save", () => {
		it("should save status to result file", async () => {
			await testStatus.save();

			expect(fs.writeFile).toHaveBeenCalledWith(
				config.resultFile,
				JSON.stringify(testStatus.status, null, 2),
			);
		});
	});

	describe("updateStatusLine", () => {
		it("should write status line with correct format", async () => {
			const status = "running";
			const passed = 5;
			const failed = 2;
			const total = 10;

			await testStatus.updateStatusLine(status, passed, failed, total);

			const calls = fs.writeFile.mock.calls;
			const lastCall = calls[calls.length - 1];
			const [filePath, content] = lastCall;

			expect(filePath).toBe(config.statusFile);

			// Parse the content
			const parts = content.split("|");
			expect(parts[0]).toBe(status);
			expect(parts[2]).toBe(String(passed));
			expect(parts[3]).toBe(String(failed));
			expect(parts[4]).toBe(String(total));

			// Check timestamp is reasonable (within last few seconds)
			const timestamp = parseInt(parts[1]);
			const now = Math.floor(Date.now() / 1000);
			expect(Math.abs(timestamp - now)).toBeLessThan(5);
		});
	});

	describe("setPhase", () => {
		it("should update phase and save", async () => {
			await testStatus.setPhase("unit-testing");

			expect(testStatus.status.phase).toBe("unit-testing");
			expect(fs.writeFile).toHaveBeenCalled();
		});
	});

	describe("addError", () => {
		it("should add error with timestamp and current phase", async () => {
			testStatus.status.phase = "e2e-testing";

			const error = new Error("Test error");
			await testStatus.addError(error);

			expect(testStatus.status.errors).toHaveLength(1);
			const addedError = testStatus.status.errors[0];

			expect(addedError.message).toBe("Test error");
			expect(addedError.phase).toBe("e2e-testing");
			expect(addedError.timestamp).toBeDefined();
			expect(addedError.stack).toBeDefined();
			expect(fs.writeFile).toHaveBeenCalled();
		});

		it("should handle string errors", async () => {
			await testStatus.addError("String error message");

			expect(testStatus.status.errors).toHaveLength(1);
			expect(testStatus.status.errors[0].message).toBe("String error message");
		});
	});

	describe("updateInfrastructure", () => {
		it("should update valid infrastructure key", async () => {
			await testStatus.updateInfrastructure("supabase", "running");

			expect(testStatus.status.infrastructure.supabase).toBe("running");
			expect(fs.writeFile).toHaveBeenCalled();
		});

		it("should throw error for invalid infrastructure key", async () => {
			await expect(
				testStatus.updateInfrastructure("invalid", "value"),
			).rejects.toThrow("Unknown infrastructure key: invalid");
		});
	});

	describe("updateUnitTests", () => {
		it("should update unit test statistics", async () => {
			await testStatus.updateUnitTests({
				total: 50,
				passed: 45,
				failed: 3,
				skipped: 2,
			});

			expect(testStatus.status.unit).toEqual({
				total: 50,
				passed: 45,
				failed: 3,
				skipped: 2,
			});
			expect(fs.writeFile).toHaveBeenCalled();
		});

		it("should partially update unit test statistics", async () => {
			testStatus.status.unit = {
				total: 10,
				passed: 8,
				failed: 1,
				skipped: 1,
			};

			await testStatus.updateUnitTests({
				passed: 9,
				failed: 0,
			});

			expect(testStatus.status.unit.total).toBe(10);
			expect(testStatus.status.unit.passed).toBe(9);
			expect(testStatus.status.unit.failed).toBe(0);
			expect(testStatus.status.unit.skipped).toBe(1);
		});
	});

	describe("updateE2ETests", () => {
		it("should update e2e test statistics", async () => {
			await testStatus.updateE2ETests({
				total: 30,
				passed: 25,
				failed: 3,
				skipped: 2,
				intentionalFailures: 1,
			});

			expect(testStatus.status.e2e.total).toBe(30);
			expect(testStatus.status.e2e.passed).toBe(25);
			expect(testStatus.status.e2e.failed).toBe(3);
			expect(testStatus.status.e2e.skipped).toBe(2);
			expect(testStatus.status.e2e.intentionalFailures).toBe(1);
			expect(fs.writeFile).toHaveBeenCalled();
		});
	});

	describe("updateShard", () => {
		it("should create new shard if not exists", async () => {
			await testStatus.updateShard("shard-1", {
				status: "running",
				total: 10,
			});

			expect(testStatus.status.e2e.shards["shard-1"]).toBeDefined();
			expect(testStatus.status.e2e.shards["shard-1"].status).toBe("running");
			expect(testStatus.status.e2e.shards["shard-1"].total).toBe(10);
			expect(testStatus.status.e2e.shards["shard-1"].passed).toBe(0);
			expect(fs.writeFile).toHaveBeenCalled();
		});

		it("should update existing shard", async () => {
			// Create initial shard
			await testStatus.updateShard("shard-1", {
				status: "running",
				total: 10,
			});

			// Update shard
			await testStatus.updateShard("shard-1", {
				status: "completed",
				passed: 8,
				failed: 2,
			});

			const shard = testStatus.status.e2e.shards["shard-1"];
			expect(shard.status).toBe("completed");
			expect(shard.total).toBe(10);
			expect(shard.passed).toBe(8);
			expect(shard.failed).toBe(2);
		});
	});

	describe("getStatus", () => {
		it("should return copy of current status", () => {
			testStatus.status.phase = "testing";
			testStatus.status.unit.total = 5;

			const status = testStatus.getStatus();

			// Verify it's a copy, not the original
			status.phase = "modified";
			status.unit.total = 999;

			expect(testStatus.status.phase).toBe("testing");
			expect(testStatus.status.unit.total).toBe(5);
		});
	});

	describe("getSummary", () => {
		it("should calculate correct summary statistics", () => {
			testStatus.status.unit = {
				total: 50,
				passed: 45,
				failed: 3,
				skipped: 2,
			};

			testStatus.status.e2e = {
				total: 30,
				passed: 25,
				failed: 2,
				skipped: 3,
				intentionalFailures: 0,
				shards: {},
			};

			const summary = testStatus.getSummary();

			expect(summary.total).toBe(80);
			expect(summary.passed).toBe(70);
			expect(summary.failed).toBe(5);
			expect(summary.skipped).toBe(5);
			expect(summary.success).toBe(false);
			expect(summary.duration).toBeGreaterThanOrEqual(0);
		});

		it("should report success when no failures", () => {
			testStatus.status.unit = {
				total: 10,
				passed: 10,
				failed: 0,
				skipped: 0,
			};

			testStatus.status.e2e = {
				total: 5,
				passed: 5,
				failed: 0,
				skipped: 0,
				intentionalFailures: 0,
				shards: {},
			};

			const summary = testStatus.getSummary();
			expect(summary.success).toBe(true);
		});
	});

	describe("calculateDuration", () => {
		it("should calculate duration in seconds", () => {
			// Set start time to 10 seconds ago
			const tenSecondsAgo = new Date(Date.now() - 10000);
			testStatus.status.startTime = tenSecondsAgo.toISOString();

			const duration = testStatus.calculateDuration();

			// Should be approximately 10 seconds (allow for small variance)
			expect(duration).toBeGreaterThanOrEqual(9);
			expect(duration).toBeLessThanOrEqual(11);
		});
	});
});
