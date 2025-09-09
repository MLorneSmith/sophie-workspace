/**
 * Unit Tests for Phase Coordinator Module
 * Tests phase transitions, timeouts, and error recovery
 */

const { describe, it, expect, beforeEach, afterEach, vi } = require("vitest");
const { PhaseCoordinator } = require("./phase-coordinator.cjs");
const { EventEmitter } = require("node:events");

// Mock child_process for recovery strategies
vi.mock("node:child_process", () => ({
	exec: vi.fn((_cmd, callback) => {
		if (callback) callback(null, { stdout: "", stderr: "" });
	}),
}));

// Mock the ConditionWaiter for Supabase recovery
vi.mock("../utils/condition-waiter.cjs", () => ({
	ConditionWaiter: vi.fn().mockImplementation(() => ({
		waitForSupabase: vi.fn().mockResolvedValue(true),
	})),
}));

// Mock process.stdout.write for logging
const originalWrite = process.stdout.write;
beforeEach(() => {
	process.stdout.write = vi.fn();
});

afterEach(() => {
	process.stdout.write = originalWrite;
});

describe("PhaseCoordinator", () => {
	let coordinator;
	let mockTestStatus;
	let mockExecAsync;

	beforeEach(() => {
		// Create mock test status
		mockTestStatus = {
			setPhase: vi.fn().mockResolvedValue(undefined),
			addError: vi.fn().mockResolvedValue(undefined),
		};

		// Create coordinator with mock
		coordinator = new PhaseCoordinator(mockTestStatus);

		// Setup exec mock
		const { exec } = require("node:child_process");
		mockExecAsync = vi.fn().mockResolvedValue({ stdout: "", stderr: "" });
		require("node:util").promisify = vi.fn(() => mockExecAsync);

		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("constructor", () => {
		it("should initialize with correct defaults", () => {
			expect(coordinator).toBeInstanceOf(EventEmitter);
			expect(coordinator.currentPhase).toBeNull();
			expect(coordinator.phaseHistory).toEqual([]);
			expect(coordinator.testStatus).toBe(mockTestStatus);
		});

		it("should set default phase timeouts", () => {
			expect(coordinator.phaseTimeouts.initializing).toBe(30000);
			expect(coordinator.phaseTimeouts.unit_tests).toBe(15 * 60 * 1000);
			expect(coordinator.phaseTimeouts.e2e_tests).toBe(45 * 60 * 1000);
		});

		it("should register recovery strategies", () => {
			expect(coordinator.recoveryStrategies.infrastructure_check).toBeDefined();
			expect(coordinator.recoveryStrategies.supabase_setup).toBeDefined();
			expect(coordinator.recoveryStrategies.unit_tests).toBeDefined();
			expect(coordinator.recoveryStrategies.e2e_tests).toBeDefined();
			expect(coordinator.recoveryStrategies.cleanup).toBeDefined();
		});
	});

	describe("transitionTo", () => {
		it("should successfully transition to a phase", async () => {
			const executor = vi.fn().mockResolvedValue("test result");

			const result = await coordinator.transitionTo("test_phase", executor);

			expect(result.success).toBe(true);
			expect(result.phase).toBe("test_phase");
			expect(result.result).toBe("test result");
			expect(result.duration).toBeGreaterThanOrEqual(0);

			expect(mockTestStatus.setPhase).toHaveBeenCalledWith("test_phase");
			expect(coordinator.currentPhase).toBe("test_phase");
		});

		it("should emit phase:complete event on success", async () => {
			const executor = vi.fn().mockResolvedValue("success");
			const completeHandler = vi.fn();

			coordinator.on("phase:complete", completeHandler);

			await coordinator.transitionTo("test_phase", executor);

			expect(completeHandler).toHaveBeenCalledWith(
				expect.objectContaining({
					phase: "test_phase",
					result: "success",
				}),
			);
		});

		it("should handle phase timeout", async () => {
			const executor = vi
				.fn()
				.mockImplementation(
					() => new Promise((resolve) => setTimeout(resolve, 1000)),
				);

			const result = await coordinator.transitionTo("test_phase", executor, {
				timeout: 100,
			});

			expect(result.success).toBe(false);
			expect(result.error).toContain("timed out after 100ms");
			expect(mockTestStatus.addError).toHaveBeenCalled();
		});

		it("should handle executor errors", async () => {
			const error = new Error("Executor failed");
			const executor = vi.fn().mockRejectedValue(error);

			const result = await coordinator.transitionTo("test_phase", executor);

			expect(result.success).toBe(false);
			expect(result.error).toBe("Executor failed");
			expect(mockTestStatus.addError).toHaveBeenCalledWith(
				expect.objectContaining({
					phase: "test_phase",
					message: "Executor failed",
				}),
			);
		});

		it("should emit phase:failed event on failure", async () => {
			const executor = vi.fn().mockRejectedValue(new Error("Failed"));
			const failHandler = vi.fn();

			coordinator.on("phase:failed", failHandler);

			await coordinator.transitionTo("test_phase", executor);

			expect(failHandler).toHaveBeenCalledWith(
				expect.objectContaining({
					phase: "test_phase",
					error: expect.any(Error),
				}),
			);
		});

		it("should update phase history", async () => {
			const executor = vi.fn().mockResolvedValue("success");

			await coordinator.transitionTo("test_phase", executor);

			expect(coordinator.phaseHistory).toHaveLength(1);
			expect(coordinator.phaseHistory[0]).toMatchObject({
				phase: "test_phase",
				status: "success",
				duration: expect.any(Number),
			});
		});

		it("should use phase-specific timeout from phaseTimeouts", async () => {
			coordinator.phaseTimeouts.custom_phase = 200;

			const executor = vi
				.fn()
				.mockImplementation(
					() => new Promise((resolve) => setTimeout(resolve, 500)),
				);

			const result = await coordinator.transitionTo("custom_phase", executor);

			expect(result.success).toBe(false);
			expect(result.error).toContain("timed out after 200ms");
		});

		it("should attempt recovery when available", async () => {
			const executor = vi.fn().mockRejectedValue(new Error("Failed"));

			// Mock recovery strategy
			coordinator.recoveryStrategies.test_phase = vi.fn().mockResolvedValue({
				recovered: true,
				result: "recovered",
			});

			const result = await coordinator.transitionTo("test_phase", executor);

			expect(result.success).toBe(true);
			expect(result.recovered).toBe(true);
			expect(result.result).toBe("recovered");
			expect(coordinator.recoveryStrategies.test_phase).toHaveBeenCalled();
		});

		it("should emit phase:recovered event when recovery succeeds", async () => {
			const executor = vi.fn().mockRejectedValue(new Error("Failed"));
			const recoveredHandler = vi.fn();

			coordinator.recoveryStrategies.test_phase = vi.fn().mockResolvedValue({
				recovered: true,
				result: "recovered",
			});

			coordinator.on("phase:recovered", recoveredHandler);

			await coordinator.transitionTo("test_phase", executor);

			expect(recoveredHandler).toHaveBeenCalledWith(
				expect.objectContaining({
					phase: "test_phase",
				}),
			);
		});

		it("should skip recovery when canRecover is false", async () => {
			const executor = vi.fn().mockRejectedValue(new Error("Failed"));

			coordinator.recoveryStrategies.test_phase = vi.fn();

			await coordinator.transitionTo("test_phase", executor, {
				canRecover: false,
			});

			expect(coordinator.recoveryStrategies.test_phase).not.toHaveBeenCalled();
		});
	});

	describe("executePhases", () => {
		it("should execute multiple phases in sequence", async () => {
			const phases = [
				{
					name: "phase1",
					executor: vi.fn().mockResolvedValue("result1"),
				},
				{
					name: "phase2",
					executor: vi.fn().mockResolvedValue("result2"),
				},
				{
					name: "phase3",
					executor: vi.fn().mockResolvedValue("result3"),
				},
			];

			const result = await coordinator.executePhases(phases);

			expect(result.success).toBe(true);
			expect(result.phases).toHaveLength(3);
			expect(phases[0].executor).toHaveBeenCalled();
			expect(phases[1].executor).toHaveBeenCalled();
			expect(phases[2].executor).toHaveBeenCalled();
		});

		it("should stop on critical phase failure", async () => {
			const phases = [
				{
					name: "phase1",
					executor: vi.fn().mockResolvedValue("result1"),
				},
				{
					name: "phase2",
					executor: vi.fn().mockRejectedValue(new Error("Critical failure")),
					critical: true,
				},
				{
					name: "phase3",
					executor: vi.fn().mockResolvedValue("result3"),
				},
			];

			const result = await coordinator.executePhases(phases);

			expect(result.success).toBe(false);
			expect(result.phases).toHaveLength(2);
			expect(phases[2].executor).not.toHaveBeenCalled();
		});

		it("should continue on non-critical phase failure", async () => {
			const phases = [
				{
					name: "phase1",
					executor: vi.fn().mockResolvedValue("result1"),
				},
				{
					name: "phase2",
					executor: vi
						.fn()
						.mockRejectedValue(new Error("Non-critical failure")),
					critical: false,
				},
				{
					name: "phase3",
					executor: vi.fn().mockResolvedValue("result3"),
				},
			];

			const result = await coordinator.executePhases(phases);

			expect(result.success).toBe(false);
			expect(result.phases).toHaveLength(3);
			expect(phases[2].executor).toHaveBeenCalled();
		});

		it("should include summary in result", async () => {
			const phases = [
				{
					name: "phase1",
					executor: vi.fn().mockResolvedValue("result1"),
				},
			];

			const result = await coordinator.executePhases(phases);

			expect(result.summary).toBeDefined();
			expect(result.summary.totalPhases).toBe(1);
			expect(result.summary.successful).toBe(1);
			expect(result.summary.failed).toBe(0);
		});
	});

	describe("recovery strategies", () => {
		describe("recoverInfrastructure", () => {
			it("should attempt to kill processes and clear ports", async () => {
				const result = await coordinator.recoverInfrastructure(
					new Error("Test"),
				);

				expect(mockExecAsync).toHaveBeenCalledWith(
					expect.stringContaining("pkill -f 'node|playwright|vitest'"),
				);
				expect(mockExecAsync).toHaveBeenCalledWith(
					expect.stringContaining("lsof -ti:3000"),
				);
				expect(result.recovered).toBe(true);
			});
		});

		describe("recoverSupabase", () => {
			it("should restart Supabase", async () => {
				const result = await coordinator.recoverSupabase(new Error("Test"));

				expect(mockExecAsync).toHaveBeenCalledWith("npx supabase stop");
				expect(mockExecAsync).toHaveBeenCalledWith("npx supabase start");
				expect(result.recovered).toBe(true);
			});
		});

		describe("recoverCleanup", () => {
			it("should force cleanup and always return recovered", async () => {
				const result = await coordinator.recoverCleanup(new Error("Test"));

				expect(mockExecAsync).toHaveBeenCalledWith(
					expect.stringContaining("pkill -f"),
				);
				expect(result.recovered).toBe(true);
			});

			it("should return recovered even on error", async () => {
				mockExecAsync.mockRejectedValue(new Error("Exec failed"));

				const result = await coordinator.recoverCleanup(new Error("Test"));

				expect(result.recovered).toBe(true);
			});
		});
	});

	describe("utility methods", () => {
		beforeEach(async () => {
			// Execute some phases to populate history
			await coordinator.transitionTo("phase1", vi.fn().mockResolvedValue("r1"));
			await coordinator.transitionTo(
				"phase2",
				vi.fn().mockRejectedValue(new Error("fail")),
			);
		});

		it("should set custom phase timeout", () => {
			coordinator.setPhaseTimeout("custom_phase", 5000);
			expect(coordinator.phaseTimeouts.custom_phase).toBe(5000);
		});

		it("should add custom recovery strategy", () => {
			const strategy = vi.fn();
			coordinator.addRecoveryStrategy("custom_phase", strategy);
			expect(coordinator.recoveryStrategies.custom_phase).toBe(strategy);
		});

		it("should get current phase information", () => {
			const current = coordinator.getCurrentPhase();
			expect(current.name).toBe("phase2");
			expect(current.history).toHaveLength(2);
		});

		it("should check if phase succeeded", () => {
			expect(coordinator.phaseSucceeded("phase1")).toBe(true);
			expect(coordinator.phaseSucceeded("phase2")).toBe(false);
			expect(coordinator.phaseSucceeded("phase3")).toBe(false);
		});

		it("should get phase duration", () => {
			const duration = coordinator.getPhaseDuration("phase1");
			expect(duration).toBeGreaterThanOrEqual(0);

			const noDuration = coordinator.getPhaseDuration("nonexistent");
			expect(noDuration).toBeNull();
		});

		it("should generate correct summary", () => {
			const summary = coordinator.generateSummary();

			expect(summary.totalPhases).toBe(2);
			expect(summary.successful).toBe(1);
			expect(summary.failed).toBe(1);
			expect(summary.totalDuration).toBeGreaterThanOrEqual(0);
			expect(summary.history).toHaveLength(2);
		});
	});

	describe("updatePhaseHistory", () => {
		it("should update running phase record", async () => {
			await coordinator.transitionTo("test", vi.fn().mockResolvedValue("ok"));

			// Manually add a running phase
			coordinator.phaseHistory.push({
				phase: "manual",
				status: "running",
				startTime: new Date().toISOString(),
			});

			coordinator.updatePhaseHistory("manual", "success", 1000);

			const manual = coordinator.phaseHistory.find((p) => p.phase === "manual");
			expect(manual.status).toBe("success");
			expect(manual.duration).toBe(1000);
			expect(manual.endTime).toBeDefined();
		});

		it("should add error to phase record when provided", () => {
			coordinator.phaseHistory.push({
				phase: "error_phase",
				status: "running",
				startTime: new Date().toISOString(),
			});

			coordinator.updatePhaseHistory(
				"error_phase",
				"failed",
				500,
				"Error message",
			);

			const phase = coordinator.phaseHistory.find(
				(p) => p.phase === "error_phase",
			);
			expect(phase.error).toBe("Error message");
		});
	});
});
