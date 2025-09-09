/**
 * Integration Tests for Test Controller Modules
 * Verifies that modules work correctly together
 */

const { describe, it, expect, beforeEach, afterEach, vi } = require("vitest");
const { TestStatus } = require("./modules/test-status.cjs");
const { PhaseCoordinator } = require("./modules/phase-coordinator.cjs");
const { ConditionWaiter } = require("./utils/condition-waiter.cjs");
const path = require("node:path");
const os = require("node:os");

// Mock fs for file operations
vi.mock("node:fs", () => ({
	promises: {
		writeFile: vi.fn(),
		access: vi.fn(),
	},
}));

// Mock child_process
vi.mock("node:child_process", () => ({
	exec: vi.fn((_cmd, callback) => {
		if (callback) callback(null, { stdout: "", stderr: "" });
	}),
}));

// Mock process.stdout.write
const originalWrite = process.stdout.write;
beforeEach(() => {
	process.stdout.write = vi.fn();
});

afterEach(() => {
	process.stdout.write = originalWrite;
});

describe("Module Integration Tests", () => {
	let testStatus;
	let phaseCoordinator;
	let conditionWaiter;
	let tempDir;
	let mockExecAsync;

	beforeEach(() => {
		// Setup temp directory
		tempDir = path.join(os.tmpdir(), `integration-test-${Date.now()}`);

		// Initialize modules
		const config = {
			resultFile: path.join(tempDir, "test-results.json"),
			statusFile: path.join(tempDir, "test-status.txt"),
		};

		testStatus = new TestStatus(config);
		phaseCoordinator = new PhaseCoordinator(testStatus);
		conditionWaiter = new ConditionWaiter(1000, 50); // Short timeouts for tests

		// Setup exec mock
		mockExecAsync = vi.fn().mockResolvedValue({ stdout: "", stderr: "" });
		require("node:util").promisify = vi.fn(() => mockExecAsync);

		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("PhaseCoordinator with TestStatus", () => {
		it("should update test status when transitioning phases", async () => {
			const executor = vi.fn().mockResolvedValue("success");

			await phaseCoordinator.transitionTo("unit_tests", executor);

			const status = testStatus.getStatus();
			expect(status.phase).toBe("unit_tests");
		});

		it("should record errors in test status on phase failure", async () => {
			const error = new Error("Test failure");
			const executor = vi.fn().mockRejectedValue(error);

			await phaseCoordinator.transitionTo("e2e_tests", executor);

			const status = testStatus.getStatus();
			expect(status.errors).toHaveLength(1);
			expect(status.errors[0].phase).toBe("e2e_tests");
			expect(status.errors[0].message).toContain("Test failure");
		});

		it("should track multiple phase executions in test status", async () => {
			const phases = [
				{
					name: "infrastructure_check",
					executor: vi.fn().mockResolvedValue("ok"),
				},
				{
					name: "unit_tests",
					executor: vi.fn().mockResolvedValue("passed"),
				},
				{
					name: "e2e_tests",
					executor: vi.fn().mockResolvedValue("passed"),
				},
			];

			await phaseCoordinator.executePhases(phases);

			const status = testStatus.getStatus();
			expect(status.phase).toBe("e2e_tests");
			expect(phaseCoordinator.phaseHistory).toHaveLength(3);
		});
	});

	describe("PhaseCoordinator with ConditionWaiter", () => {
		it("should use condition waiter in phase executor", async () => {
			const executor = async () => {
				// Simulate waiting for port
				mockExecAsync
					.mockResolvedValueOnce({ stdout: "free\n" })
					.mockResolvedValueOnce({ stdout: "12345\n" });

				const result = await conditionWaiter.waitForPort(3000, {
					timeout: 200,
					interval: 50,
				});
				return result;
			};

			const result = await phaseCoordinator.transitionTo(
				"port_check",
				executor,
			);

			expect(result.success).toBe(true);
			expect(result.result).toBe(true);
			expect(mockExecAsync).toHaveBeenCalledWith(
				expect.stringContaining("lsof -ti:3000"),
			);
		});

		it("should handle condition waiter timeout in phase", async () => {
			const executor = async () => {
				// Port never becomes available
				mockExecAsync.mockResolvedValue({ stdout: "free\n" });

				await conditionWaiter.waitForPort(3000, {
					timeout: 100,
					interval: 25,
				});
			};

			const result = await phaseCoordinator.transitionTo(
				"port_check",
				executor,
			);

			expect(result.success).toBe(false);
			expect(result.error).toContain("Timeout waiting for port 3000");
		});
	});

	describe("Complete Test Flow Simulation", () => {
		it("should execute a complete test workflow", async () => {
			// Simulate infrastructure check
			await testStatus.updateInfrastructure("supabase", "running");
			await testStatus.updateInfrastructure("ports", "available");

			// Define test phases
			const phases = [
				{
					name: "infrastructure_check",
					executor: async () => {
						await testStatus.updateInfrastructure("environment", "ready");
						return "infrastructure ready";
					},
				},
				{
					name: "unit_tests",
					executor: async () => {
						await testStatus.updateUnitTests({
							total: 50,
							passed: 48,
							failed: 2,
							skipped: 0,
						});
						return "unit tests complete";
					},
				},
				{
					name: "e2e_tests",
					executor: async () => {
						// Simulate shard updates
						await testStatus.updateShard("shard-1", {
							status: "completed",
							total: 10,
							passed: 9,
							failed: 1,
						});

						await testStatus.updateE2ETests({
							total: 10,
							passed: 9,
							failed: 1,
							skipped: 0,
						});

						return "e2e tests complete";
					},
				},
			];

			// Execute phases
			const result = await phaseCoordinator.executePhases(phases);

			// Verify overall result
			expect(result.success).toBe(true);
			expect(result.phases).toHaveLength(3);

			// Verify test status summary
			const summary = testStatus.getSummary();
			expect(summary.total).toBe(60); // 50 unit + 10 e2e
			expect(summary.passed).toBe(57); // 48 unit + 9 e2e
			expect(summary.failed).toBe(3); // 2 unit + 1 e2e
			expect(summary.success).toBe(false); // Has failures

			// Verify phase history
			expect(phaseCoordinator.phaseSucceeded("infrastructure_check")).toBe(
				true,
			);
			expect(phaseCoordinator.phaseSucceeded("unit_tests")).toBe(true);
			expect(phaseCoordinator.phaseSucceeded("e2e_tests")).toBe(true);
		});

		it("should handle partial failure with recovery", async () => {
			// Mock recovery to succeed
			phaseCoordinator.recoveryStrategies.failing_phase = vi
				.fn()
				.mockResolvedValue({ recovered: true, result: "recovered" });

			const phases = [
				{
					name: "setup",
					executor: vi.fn().mockResolvedValue("setup done"),
				},
				{
					name: "failing_phase",
					executor: vi
						.fn()
						.mockRejectedValueOnce(new Error("Initial failure"))
						.mockResolvedValue("success after recovery"),
				},
				{
					name: "cleanup",
					executor: vi.fn().mockResolvedValue("cleanup done"),
				},
			];

			const result = await phaseCoordinator.executePhases(phases);

			// Should continue after recovery
			expect(result.success).toBe(true);
			expect(result.phases).toHaveLength(3);

			// Verify recovery was attempted
			expect(
				phaseCoordinator.recoveryStrategies.failing_phase,
			).toHaveBeenCalled();

			// Check phase history shows recovery
			const failingPhase = result.phases.find(
				(p) => p.phase === "failing_phase",
			);
			expect(failingPhase.recovered).toBe(true);
		});
	});

	describe("Event Flow", () => {
		it("should emit correct events during phase execution", async () => {
			const events = [];

			phaseCoordinator.on("phase:complete", (data) => {
				events.push({ type: "complete", ...data });
			});

			phaseCoordinator.on("phase:failed", (data) => {
				events.push({ type: "failed", ...data });
			});

			phaseCoordinator.on("phase:recovered", (data) => {
				events.push({ type: "recovered", ...data });
			});

			// Execute mixed success/failure phases
			await phaseCoordinator.transitionTo(
				"success_phase",
				vi.fn().mockResolvedValue("ok"),
			);

			await phaseCoordinator.transitionTo(
				"fail_phase",
				vi.fn().mockRejectedValue(new Error("fail")),
			);

			// Check events were emitted
			expect(events).toHaveLength(2);
			expect(events[0].type).toBe("complete");
			expect(events[0].phase).toBe("success_phase");
			expect(events[1].type).toBe("failed");
			expect(events[1].phase).toBe("fail_phase");
		});
	});

	describe("Retry Logic with ConditionWaiter", () => {
		it("should integrate retry logic in phases", async () => {
			let attempts = 0;

			const executor = async () => {
				const fn = vi.fn().mockImplementation(() => {
					attempts++;
					if (attempts < 3) {
						throw new Error(`Attempt ${attempts} failed`);
					}
					return "success";
				});

				return await conditionWaiter.withRetry(fn, {
					maxAttempts: 3,
					retryDelay: 10,
					name: "test operation",
				});
			};

			const result = await phaseCoordinator.transitionTo(
				"retry_phase",
				executor,
			);

			expect(result.success).toBe(true);
			expect(result.result).toBe("success");
			expect(attempts).toBe(3);
		});
	});

	describe("Status File Updates", () => {
		it("should update status files during execution", async () => {
			const fs = require("node:fs").promises;

			// Execute a phase that updates status
			await phaseCoordinator.transitionTo("test_phase", async () => {
				await testStatus.updateStatusLine("running", 5, 1, 10);
				return "done";
			});

			// Verify status file was written
			expect(fs.writeFile).toHaveBeenCalledWith(
				expect.stringContaining("test-status.txt"),
				expect.stringMatching(/running\|\d+\|5\|1\|10/),
			);

			// Verify result file was written
			expect(fs.writeFile).toHaveBeenCalledWith(
				expect.stringContaining("test-results.json"),
				expect.stringContaining('"phase": "test_phase"'),
			);
		});
	});

	describe("Error Aggregation", () => {
		it("should aggregate errors from multiple failed phases", async () => {
			const phases = [
				{
					name: "phase1",
					executor: vi.fn().mockRejectedValue(new Error("Error 1")),
					critical: false,
				},
				{
					name: "phase2",
					executor: vi.fn().mockRejectedValue(new Error("Error 2")),
					critical: false,
				},
				{
					name: "phase3",
					executor: vi.fn().mockResolvedValue("success"),
				},
			];

			await phaseCoordinator.executePhases(phases);

			const status = testStatus.getStatus();
			expect(status.errors).toHaveLength(2);
			expect(status.errors[0].message).toContain("Error 1");
			expect(status.errors[1].message).toContain("Error 2");
		});
	});
});
