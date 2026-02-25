/**
 * Tests for RecoveryCoordinator
 *
 * Bug fix #2077: Validates centralized recovery coordination with per-feature
 * mutex, idempotent recovery, retry budget management, and telemetry.
 *
 * Regression tests for:
 * - #2073: Retry count inflation from concurrent recovery handlers
 * - #2075: Cross-run retry state leak
 * - #2062: Stale progress file race condition
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type {
	FeatureEntry,
	SandboxInstance,
	SpecManifest,
} from "../../types/index.js";

// Mock dependencies
vi.mock("../feature-transitions.js", () => ({
	transitionFeatureStatus: vi.fn(),
}));

vi.mock("../health.js", () => ({
	killClaudeProcess: vi.fn().mockResolvedValue(true),
}));

vi.mock("../manifest.js", () => ({
	saveManifest: vi.fn(),
}));

vi.mock("../work-queue.js", () => ({
	DEFAULT_MAX_RETRIES: 3,
	shouldRetryFailedFeature: vi.fn(),
}));

import { transitionFeatureStatus } from "../feature-transitions.js";
import { killClaudeProcess } from "../health.js";
import { saveManifest } from "../manifest.js";
import { RecoveryCoordinator } from "../recovery-coordinator.js";
import { shouldRetryFailedFeature } from "../work-queue.js";

// ============================================================================
// Helpers
// ============================================================================

function createTestFeature(
	id: string,
	overrides: Partial<FeatureEntry> = {},
): FeatureEntry {
	return {
		id,
		initiative_id: "I1",
		title: `Feature ${id}`,
		priority: 1,
		global_priority: 1,
		status: "in_progress",
		tasks_file: `/tmp/${id}/tasks.json`,
		feature_dir: `/tmp/${id}`,
		task_count: 10,
		tasks_completed: 0,
		sequential_hours: 1,
		parallel_hours: 0.5,
		dependencies: [],
		github_issue: null,
		requires_database: false,
		database_task_count: 0,
		assigned_sandbox: "sandbox-1",
		retry_count: 0,
		...overrides,
	};
}

function createTestSandbox(
	label: string,
	overrides: Partial<SandboxInstance> = {},
): SandboxInstance {
	return {
		id: `sbx-${label}`,
		label,
		sandbox: {
			commands: { run: vi.fn().mockResolvedValue({ stdout: "", exitCode: 0 }) },
			kill: vi.fn().mockResolvedValue(undefined),
		} as unknown as SandboxInstance["sandbox"],
		status: "busy",
		createdAt: new Date(),
		lastKeepaliveAt: new Date(),
		retryCount: 0,
		currentFeature: null,
		outputLineCount: 0,
		hasReceivedOutput: false,
		...overrides,
	};
}

function createTestManifest(features: FeatureEntry[]): SpecManifest {
	return {
		spec_id: "S2077",
		title: "Test Spec",
		feature_queue: features,
		initiatives: [
			{
				id: "I1",
				name: "Test Initiative",
				slug: "test",
				priority: 1,
				status: "in_progress",
				initiative_dir: "/tmp/I1",
				feature_count: features.length,
				features_completed: 0,
				dependencies: [],
			},
		],
		sandbox: {
			sandbox_ids: ["sbx-sandbox-1"],
			restart_count: 0,
			created_at: new Date().toISOString(),
		},
		progress: {
			total_features: features.length,
			completed_features: 0,
			failed_features: 0,
			next_feature_id: null,
			last_completed_feature_id: null,
		},
	} as unknown as SpecManifest;
}

// ============================================================================
// Tests
// ============================================================================

describe("RecoveryCoordinator", () => {
	let coordinator: RecoveryCoordinator;
	let manifest: SpecManifest;
	let instances: SandboxInstance[];

	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(shouldRetryFailedFeature).mockReturnValue(true);

		const feature = createTestFeature("F1", {
			status: "in_progress",
			assigned_sandbox: "sandbox-1",
			retry_count: 0,
		});
		manifest = createTestManifest([feature]);
		instances = [
			createTestSandbox("sandbox-1", {
				status: "busy",
				currentFeature: "F1",
			}),
		];

		coordinator = new RecoveryCoordinator(manifest, instances, false, "claude");
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	// ==========================================================================
	// Basic Recovery
	// ==========================================================================

	describe("recoverFeature", () => {
		it("should recover a feature and increment retry count", async () => {
			const result = await coordinator.recoverFeature(
				"F1",
				"test failure",
				"health_check",
			);

			expect(result.executed).toBe(true);
			expect(result.willRetry).toBe(true);
			expect(result.retryCount).toBe(1);
			expect(result.source).toBe("health_check");

			// Verify kill was called
			expect(killClaudeProcess).toHaveBeenCalledWith(
				instances[0],
				false,
				"claude",
			);

			// Verify transition to pending
			expect(transitionFeatureStatus).toHaveBeenCalledWith(
				manifest.feature_queue[0],
				manifest,
				"pending",
				expect.objectContaining({
					reason: expect.stringContaining("health_check"),
				}),
			);

			// Verify manifest saved
			expect(saveManifest).toHaveBeenCalledWith(manifest);

			// Verify sandbox reset
			expect(instances[0]!.status).toBe("ready");
			expect(instances[0]!.currentFeature).toBeNull();
		});

		it("should mark feature as failed when retry budget exhausted", async () => {
			vi.mocked(shouldRetryFailedFeature).mockReturnValue(false);

			const result = await coordinator.recoverFeature(
				"F1",
				"test failure",
				"promise_timeout",
			);

			expect(result.executed).toBe(true);
			expect(result.willRetry).toBe(false);

			// Verify transition to failed
			expect(transitionFeatureStatus).toHaveBeenCalledWith(
				manifest.feature_queue[0],
				manifest,
				"failed",
				expect.objectContaining({
					reason: expect.stringContaining("max retries exceeded"),
				}),
			);
		});

		it("should skip kill when skipKill option is set", async () => {
			await coordinator.recoverFeature(
				"F1",
				"sandbox already dead",
				"sandbox_death",
				{ skipKill: true },
			);

			expect(killClaudeProcess).not.toHaveBeenCalled();
		});

		it("should not increment retry for infrastructure resets", async () => {
			const feature = manifest.feature_queue[0]!;

			await coordinator.recoverFeature(
				"F1",
				"preemptive restart",
				"preemptive_restart",
				{ skipRetryIncrement: true },
			);

			expect(feature.retry_count).toBe(0);
			expect(feature.retry_reason).toBe("infrastructure_reset");

			// Verify transition to pending (not failed)
			expect(transitionFeatureStatus).toHaveBeenCalledWith(
				feature,
				manifest,
				"pending",
				expect.any(Object),
			);
		});

		it("should skip recovery for completed features", async () => {
			manifest.feature_queue[0]!.status = "completed";

			const result = await coordinator.recoverFeature(
				"F1",
				"test",
				"health_check",
			);

			expect(result.executed).toBe(true);
			expect(result.willRetry).toBe(false);
			expect(killClaudeProcess).not.toHaveBeenCalled();
			expect(transitionFeatureStatus).not.toHaveBeenCalled();
		});

		it("should handle missing feature gracefully", async () => {
			const result = await coordinator.recoverFeature(
				"NONEXISTENT",
				"test",
				"health_check",
			);

			expect(result.executed).toBe(true);
			expect(result.willRetry).toBe(false);
			expect(result.retryCount).toBe(0);
		});
	});

	// ==========================================================================
	// Mutex / Idempotency
	// ==========================================================================

	describe("mutex behavior", () => {
		it("should prevent concurrent recovery of the same feature", async () => {
			// Make killClaudeProcess slow to create a window for concurrent calls
			vi.mocked(killClaudeProcess).mockImplementation(
				() =>
					new Promise<boolean>((resolve) =>
						setTimeout(() => resolve(true), 50),
					),
			);

			// Fire two recovery calls concurrently
			const [result1, result2] = await Promise.all([
				coordinator.recoverFeature("F1", "first caller", "health_check"),
				coordinator.recoverFeature("F1", "second caller", "promise_timeout"),
			]);

			// First caller should execute, second should return early
			expect(result1.executed).toBe(true);
			expect(result2.executed).toBe(false);

			// Kill should only be called ONCE (not twice)
			expect(killClaudeProcess).toHaveBeenCalledTimes(1);

			// Retry count should increment exactly once
			expect(manifest.feature_queue[0]!.retry_count).toBe(1);
		});

		it("should allow sequential recovery of the same feature", async () => {
			await coordinator.recoverFeature("F1", "first call", "health_check");

			// Reset feature to in_progress for second recovery
			manifest.feature_queue[0]!.status = "in_progress";
			manifest.feature_queue[0]!.assigned_sandbox = "sandbox-1";
			instances[0]!.status = "busy";
			instances[0]!.currentFeature = "F1";

			const result2 = await coordinator.recoverFeature(
				"F1",
				"second call",
				"sandbox_death",
			);

			expect(result2.executed).toBe(true);
			expect(manifest.feature_queue[0]!.retry_count).toBe(2);
		});

		it("should allow concurrent recovery of DIFFERENT features", async () => {
			const feature2 = createTestFeature("F2", {
				assigned_sandbox: "sandbox-2",
			});
			manifest.feature_queue.push(feature2);

			const sandbox2 = createTestSandbox("sandbox-2", {
				status: "busy",
				currentFeature: "F2",
			});
			instances.push(sandbox2);

			const [result1, result2] = await Promise.all([
				coordinator.recoverFeature("F1", "failure", "health_check"),
				coordinator.recoverFeature("F2", "failure", "sandbox_death", {
					skipKill: true,
				}),
			]);

			// Both should execute (different features)
			expect(result1.executed).toBe(true);
			expect(result2.executed).toBe(true);

			expect(manifest.feature_queue[0]!.retry_count).toBe(1);
			expect(manifest.feature_queue[1]!.retry_count).toBe(1);
		});
	});

	// ==========================================================================
	// Telemetry
	// ==========================================================================

	describe("telemetry", () => {
		it("should track recovery source and count", async () => {
			await coordinator.recoverFeature("F1", "test", "health_check");

			// Reset for second call
			manifest.feature_queue[0]!.status = "in_progress";
			manifest.feature_queue[0]!.assigned_sandbox = "sandbox-1";
			instances[0]!.status = "busy";
			instances[0]!.currentFeature = "F1";

			await coordinator.recoverFeature("F1", "test2", "promise_timeout");

			const telemetry = coordinator.getTelemetry();

			expect(telemetry.totalRecoveries).toBe(2);
			expect(telemetry.bySource.health_check).toBe(1);
			expect(telemetry.bySource.promise_timeout).toBe(1);
			expect(telemetry.entries).toHaveLength(2);
			expect(telemetry.entries[0]!.source).toBe("health_check");
			expect(telemetry.entries[1]!.source).toBe("promise_timeout");
		});
	});

	// ==========================================================================
	// Regression Tests
	// ==========================================================================

	describe("regression: #2073 retry inflation", () => {
		it("should increment retry_count exactly once even with concurrent handlers", async () => {
			// Simulate the bug scenario: sandbox dies, triggering both
			// keepalive and error catch handlers concurrently
			vi.mocked(killClaudeProcess).mockImplementation(
				() =>
					new Promise<boolean>((resolve) =>
						setTimeout(() => resolve(true), 30),
					),
			);

			const initialRetryCount = manifest.feature_queue[0]!.retry_count ?? 0;

			// Fire 3 concurrent recovery calls (simulating health_check + sandbox_death + promise_timeout)
			const results = await Promise.all([
				coordinator.recoverFeature("F1", "keepalive", "preemptive_restart"),
				coordinator.recoverFeature("F1", "error catch", "sandbox_death"),
				coordinator.recoverFeature("F1", "timeout", "promise_timeout"),
			]);

			// Only the first should execute
			const executedCount = results.filter((r) => r.executed).length;
			expect(executedCount).toBe(1);

			// Retry count should be exactly initialRetryCount + 1 (not +3)
			expect(manifest.feature_queue[0]!.retry_count).toBe(
				initialRetryCount + 1,
			);
		});
	});

	describe("regression: #2075 cross-run retry reset", () => {
		it("should work correctly with features that have retry_count=0 after cleanupStaleState", async () => {
			// Simulate a feature that was failed with retry_count=2, then
			// cleanupStaleState reset it to retry_count=0 for fresh retry
			const feature = manifest.feature_queue[0]!;
			feature.retry_count = 0;
			feature.status = "in_progress";

			const result = await coordinator.recoverFeature(
				"F1",
				"first failure in new run",
				"health_check",
			);

			expect(result.executed).toBe(true);
			expect(result.willRetry).toBe(true);
			expect(result.retryCount).toBe(1);
			expect(feature.retry_count).toBe(1);
		});
	});

	describe("regression: #2062 stale progress file race", () => {
		it("should prevent concurrent recovery from different detection systems", async () => {
			// Simulate the bug: health check and PTY fallback both detect
			// the same stale state and fire recovery concurrently
			vi.mocked(killClaudeProcess).mockImplementation(
				() =>
					new Promise<boolean>((resolve) =>
						setTimeout(() => resolve(true), 20),
					),
			);

			const [healthResult, ptyResult] = await Promise.all([
				coordinator.recoverFeature("F1", "health check", "health_check"),
				coordinator.recoverFeature("F1", "stuck task", "stuck_task"),
			]);

			// Only one should execute
			const executedCount = [healthResult, ptyResult].filter(
				(r) => r.executed,
			).length;
			expect(executedCount).toBe(1);

			// Feature should be in a consistent state
			expect(manifest.feature_queue[0]!.retry_count).toBe(1);
		});
	});
});
