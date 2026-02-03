/**
 * Work Loop Promise Timeout Integration Tests
 *
 * Tests for promise timeout detection and recovery in the work loop.
 * Bug fix #1841: Promise timeout monitor for work loop recovery.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { FeatureEntry, SpecManifest } from "../../types/index.js";

// Mock dependencies
vi.mock("../manifest.js", () => ({
	saveManifest: vi.fn(),
}));

vi.mock("../event-emitter.js", () => ({
	emitOrchestratorEvent: vi.fn(),
}));

vi.mock("../progress-file.js", () => ({
	readProgressFile: vi.fn(),
	getProgressFileAge: vi.fn(),
	isProgressFileStale: vi.fn(),
	isFeatureCompleted: vi.fn(),
}));

vi.mock("../feature.js", () => ({
	runFeatureImplementation: vi.fn(),
}));

vi.mock("../health.js", () => ({
	runHealthChecks: vi.fn().mockResolvedValue([]),
}));

vi.mock("../sandbox.js", () => ({
	createSandbox: vi.fn(),
	getSandboxesNeedingRestart: vi.fn().mockReturnValue([]),
	keepAliveSandboxes: vi.fn().mockResolvedValue([]),
}));

vi.mock("../progress.js", () => ({
	writeIdleProgress: vi.fn(),
}));

vi.mock("../deadlock-handler.js", () => ({
	detectAndHandleDeadlock: vi.fn().mockReturnValue({
		shouldExit: false,
		retriedCount: 0,
		failedInitiatives: [],
	}),
	recoverPhantomCompletedFeatures: vi.fn().mockReturnValue({
		recoveredCount: 0,
		recoveredFeatureIds: [],
		completedInitiativeIds: [],
	}),
}));

vi.mock("../work-queue.js", async (importOriginal) => {
	const actual = await importOriginal<typeof import("../work-queue.js")>();
	return {
		...actual,
		assignFeatureToSandbox: vi.fn().mockReturnValue(true),
		getBlockedFeatures: vi.fn().mockReturnValue([]),
	};
});

// Import after mocking
import { emitOrchestratorEvent } from "../event-emitter.js";
import { readProgressFile, getProgressFileAge } from "../progress-file.js";
import { saveManifest } from "../manifest.js";
import { WorkLoop, type WorkLoopOptions } from "../work-loop.js";
import { runFeatureImplementation } from "../feature.js";

// ============================================================================
// Test Constants
// ============================================================================

const TEST_PROMISE_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

// ============================================================================
// Helpers
// ============================================================================

/**
 * Create a minimal test manifest
 */
function createTestManifest(
	features: Partial<FeatureEntry>[] = [],
): SpecManifest {
	return {
		metadata: {
			spec_id: "S1823",
			spec_name: "Test Spec",
			generated_at: new Date().toISOString(),
			spec_dir: "/test/spec",
			research_dir: "/test/research",
		},
		initiatives: [
			{
				id: "S1823.I1",
				name: "Test Initiative",
				slug: "test-initiative",
				priority: 1,
				status: "pending",
				initiative_dir: "/test/initiative",
				feature_count: features.length,
				features_completed: 0,
				dependencies: [],
			},
		],
		feature_queue: features.map((f, i) => ({
			id: f.id ?? `S1823.I1.F${i + 1}`,
			initiative_id: f.initiative_id ?? "S1823.I1",
			title: f.title ?? `Test Feature ${i + 1}`,
			priority: f.priority ?? 1,
			global_priority: f.global_priority ?? i + 1,
			status: f.status ?? "pending",
			tasks_file: f.tasks_file ?? `/test/tasks-${i}.json`,
			feature_dir: f.feature_dir ?? `/test/feature-${i}`,
			task_count: f.task_count ?? 5,
			tasks_completed: f.tasks_completed ?? 0,
			sequential_hours: f.sequential_hours ?? 4,
			parallel_hours: f.parallel_hours ?? 2,
			dependencies: f.dependencies ?? [],
			github_issue: f.github_issue ?? null,
			assigned_sandbox: f.assigned_sandbox,
			assigned_at: f.assigned_at,
			error: f.error,
			requires_database: f.requires_database ?? false,
			database_task_count: f.database_task_count ?? 0,
			retry_count: f.retry_count,
		})),
		progress: {
			status: "pending",
			initiatives_completed: 0,
			initiatives_total: 1,
			features_completed: 0,
			features_total: features.length,
			tasks_completed: 0,
			tasks_total: 0,
			next_feature_id: null,
			last_completed_feature_id: null,
			started_at: null,
			completed_at: null,
			last_checkpoint: null,
		},
		sandbox: {
			sandbox_ids: [],
			branch_name: null,
			created_at: null,
		},
	};
}

/**
 * Create a mock sandbox instance
 */
function createMockSandboxInstance(
	label: string,
	status: "ready" | "busy" = "ready",
) {
	return {
		sandbox: {
			commands: {
				run: vi.fn().mockResolvedValue({ stdout: "{}" }),
			},
		},
		id: `sbx-id-${label}`,
		label,
		status,
		currentFeature: null,
		retryCount: 0,
		createdAt: new Date(),
		lastKeepaliveAt: new Date(),
	};
}

// ============================================================================
// Tests
// ============================================================================

describe("WorkLoop Promise Timeout Monitor", () => {
	const baseTime = new Date("2026-01-26T12:00:00.000Z").getTime();

	beforeEach(() => {
		vi.clearAllMocks();
		vi.useFakeTimers();
		vi.setSystemTime(baseTime);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe("monitorPromiseAges integration", () => {
		it("does not timeout healthy promises with fresh heartbeat", async () => {
			const manifest = createTestManifest([
				{ id: "S1823.I1.F1", status: "in_progress", assigned_sandbox: "sbx-a" },
			]);
			const instances = [createMockSandboxInstance("sbx-a", "busy")];

			// Mock progress file with fresh heartbeat
			vi.mocked(readProgressFile).mockResolvedValue({
				success: true,
				data: {
					status: "in_progress",
					phase: "implementing",
					completed_tasks: ["task-1"],
					last_heartbeat: new Date(baseTime).toISOString(),
				},
			});
			vi.mocked(getProgressFileAge).mockReturnValue(60_000); // 1 minute old

			// Mock feature implementation that never resolves (simulating work in progress)
			vi.mocked(runFeatureImplementation).mockImplementation(
				() => new Promise(() => {}), // Never resolves
			);

			const options: WorkLoopOptions = {
				instances: instances as never,
				manifest,
				uiEnabled: false,
				timeoutSeconds: 3600,
				provider: "claude" as const,
			};

			const workLoop = new WorkLoop(options);

			// Start the work loop and let it run for a bit
			workLoop.run();

			// Advance time to trigger a health check cycle (30 seconds)
			await vi.advanceTimersByTimeAsync(31000);

			// Stop the work loop
			workLoop.stop();
			await vi.runAllTimersAsync();

			// Promise timeout should NOT be emitted for healthy work
			expect(emitOrchestratorEvent).not.toHaveBeenCalledWith(
				"promise_timeout",
				expect.any(String),
				expect.any(Object),
			);
		});

		it("times out stuck promises with stale heartbeat", async () => {
			const manifest = createTestManifest([
				{ id: "S1823.I1.F1", status: "pending" },
			]);
			const instances = [createMockSandboxInstance("sbx-a", "ready")];

			// Mock progress file with stale heartbeat
			vi.mocked(readProgressFile).mockResolvedValue({
				success: true,
				data: {
					status: "in_progress",
					phase: "implementing",
					completed_tasks: [],
					last_heartbeat: new Date(baseTime - 6 * 60 * 1000).toISOString(), // 6 min ago
				},
			});
			vi.mocked(getProgressFileAge).mockReturnValue(6 * 60 * 1000); // 6 minutes stale

			// Mock feature implementation that never resolves (stuck promise)
			vi.mocked(runFeatureImplementation).mockImplementation(
				() => new Promise(() => {}),
			);

			const options: WorkLoopOptions = {
				instances: instances as never,
				manifest,
				uiEnabled: false,
				timeoutSeconds: 3600,
				provider: "claude" as const,
			};

			const workLoop = new WorkLoop(options);
			workLoop.run();

			// Advance time past promise timeout (10+ minutes)
			await vi.advanceTimersByTimeAsync(TEST_PROMISE_TIMEOUT_MS + 60000);

			// Stop work loop
			workLoop.stop();
			await vi.runAllTimersAsync();

			// Promise timeout should be emitted
			expect(emitOrchestratorEvent).toHaveBeenCalledWith(
				"promise_timeout",
				expect.stringContaining("S1823.I1.F1"),
				expect.objectContaining({
					featureId: "S1823.I1.F1",
					sandboxLabel: "sbx-a",
				}),
			);

			// Feature should be reset to pending
			const feature = manifest.feature_queue[0];
			expect(feature?.status).toBe("pending");
			expect(feature?.assigned_sandbox).toBeUndefined();
		});

		it("resets feature to pending for reassignment after timeout", async () => {
			const manifest = createTestManifest([
				{ id: "S1823.I1.F1", status: "pending" },
			]);
			const instances = [createMockSandboxInstance("sbx-a", "ready")];

			// Mock stale progress file
			vi.mocked(readProgressFile).mockResolvedValue({
				success: false,
				data: null,
				error: "File not found",
			});
			vi.mocked(getProgressFileAge).mockReturnValue(null);

			// Mock stuck promise
			vi.mocked(runFeatureImplementation).mockImplementation(
				() => new Promise(() => {}),
			);

			const options: WorkLoopOptions = {
				instances: instances as never,
				manifest,
				uiEnabled: false,
				timeoutSeconds: 3600,
				provider: "claude" as const,
			};

			const workLoop = new WorkLoop(options);
			workLoop.run();

			// Advance past timeout
			await vi.advanceTimersByTimeAsync(TEST_PROMISE_TIMEOUT_MS + 60000);

			workLoop.stop();
			await vi.runAllTimersAsync();

			// Feature should be reset
			const feature = manifest.feature_queue[0];
			expect(feature?.status).toBe("pending");
			expect(feature?.error).toContain("Promise timeout");

			// Manifest should be saved
			expect(saveManifest).toHaveBeenCalled();
		});

		it("handles multiple stale promises in one cycle", async () => {
			const manifest = createTestManifest([
				{ id: "S1823.I1.F1", status: "pending" },
				{ id: "S1823.I1.F2", status: "pending" },
			]);
			const instances = [
				createMockSandboxInstance("sbx-a", "ready"),
				createMockSandboxInstance("sbx-b", "ready"),
			];

			// Mock stale progress files
			vi.mocked(readProgressFile).mockResolvedValue({
				success: false,
				data: null,
				error: "File not found",
			});
			vi.mocked(getProgressFileAge).mockReturnValue(null);

			// Mock stuck promises
			vi.mocked(runFeatureImplementation).mockImplementation(
				() => new Promise(() => {}),
			);

			const options: WorkLoopOptions = {
				instances: instances as never,
				manifest,
				uiEnabled: false,
				timeoutSeconds: 3600,
				provider: "claude" as const,
			};

			const workLoop = new WorkLoop(options);
			workLoop.run();

			// Advance past timeout
			await vi.advanceTimersByTimeAsync(TEST_PROMISE_TIMEOUT_MS + 60000);

			workLoop.stop();
			await vi.runAllTimersAsync();

			// Both features should be reset
			expect(manifest.feature_queue[0]?.status).toBe("pending");
			expect(manifest.feature_queue[1]?.status).toBe("pending");

			// Both should emit timeout events
			const timeoutCalls = vi
				.mocked(emitOrchestratorEvent)
				.mock.calls.filter((call) => call[0] === "promise_timeout");
			expect(timeoutCalls.length).toBe(2);
		});
	});

	describe("regression test for #1840 scenario", () => {
		it("recovers from stuck promise with retry counting", async () => {
			// Original bug scenario: Promise hangs, sandbox status stays "busy",
			// deadlock detection skipped because activeWork.size > 0,
			// stuck task recovery skipped because status !== "busy" check fails
			//
			// The work loop must assign the feature and create the promise for
			// the timeout monitor to track it. We start with "pending" status.

			const manifest = createTestManifest([
				{
					id: "S1823.I4.F3",
					status: "pending", // Start pending so work loop assigns it
					task_count: 4,
					tasks_completed: 0,
				},
			]);
			const sbxA = createMockSandboxInstance("sbx-a", "ready");
			// Cast through unknown to properly type the instances array
			const instances = [sbxA] as unknown as WorkLoopOptions["instances"];

			// Mock progress file that becomes stale over time
			vi.mocked(readProgressFile).mockResolvedValue({
				success: true,
				data: {
					status: "in_progress",
					phase: "implementing",
					completed_tasks: ["task-1", "task-2"],
					last_heartbeat: new Date(baseTime).toISOString(),
				},
			});

			// Heartbeat age increases with each check (simulating stale progress)
			let heartbeatAge = 0;
			vi.mocked(getProgressFileAge).mockImplementation(() => {
				heartbeatAge += 60000; // Add 1 minute each call
				return heartbeatAge;
			});

			// Mock stuck promise that never resolves (simulating PTY hang)
			vi.mocked(runFeatureImplementation).mockImplementation(
				() => new Promise(() => {}),
			);

			const options: WorkLoopOptions = {
				instances,
				manifest,
				uiEnabled: false,
				timeoutSeconds: 3600,
				provider: "claude" as const,
			};

			const workLoop = new WorkLoop(options);
			workLoop.run();

			// Advance past the timeout threshold (10+ minutes + heartbeat stale)
			await vi.advanceTimersByTimeAsync(
				TEST_PROMISE_TIMEOUT_MS + 2 * 60 * 1000,
			);

			workLoop.stop();
			await vi.runAllTimersAsync();

			// The feature should be recovered - either reset to pending (retry) or
			// marked as failed (max retries). Check that retry_count was incremented.
			const feature = manifest.feature_queue[0];
			expect(feature?.retry_count).toBeGreaterThan(0);
			expect(feature?.assigned_sandbox).toBeUndefined();
			expect(feature?.error).toContain("Promise timeout");

			// Event should be emitted with retry information
			expect(emitOrchestratorEvent).toHaveBeenCalledWith(
				"promise_timeout",
				expect.stringContaining("S1823.I4.F3"),
				expect.objectContaining({
					featureId: "S1823.I4.F3",
					retryCount: expect.any(Number),
					maxRetries: 3, // DEFAULT_MAX_RETRIES
				}),
			);
		});
	});

	describe("retry limit behavior", () => {
		it("marks feature as failed after max retries exceeded", async () => {
			// Feature already has 3 retries (at max), next timeout should mark as failed
			// DEFAULT_MAX_RETRIES = 3, so retry_count >= 3 means no more retries allowed
			const manifest = createTestManifest([
				{
					id: "S1823.I4.F3",
					status: "pending",
					task_count: 4,
					tasks_completed: 0,
					retry_count: 3, // Already at max retries
				},
			]);
			const sbxA = createMockSandboxInstance("sbx-a", "ready");
			const instances = [sbxA] as unknown as WorkLoopOptions["instances"];

			// Mock progress file that becomes stale over time (same pattern as passing test)
			vi.mocked(readProgressFile).mockResolvedValue({
				success: true,
				data: {
					status: "in_progress",
					phase: "implementing",
					completed_tasks: [],
					last_heartbeat: new Date(baseTime).toISOString(),
				},
			});

			// Heartbeat age increases with each check (simulating stale progress)
			let heartbeatAge = 0;
			vi.mocked(getProgressFileAge).mockImplementation(() => {
				heartbeatAge += 60000; // Add 1 minute each call
				return heartbeatAge;
			});

			// Mock stuck promise
			vi.mocked(runFeatureImplementation).mockImplementation(
				() => new Promise(() => {}),
			);

			const options: WorkLoopOptions = {
				instances,
				manifest,
				uiEnabled: false,
				timeoutSeconds: 3600,
				provider: "claude" as const,
			};

			const workLoop = new WorkLoop(options);
			workLoop.run();

			// Advance past timeout (same as passing test)
			await vi.advanceTimersByTimeAsync(
				TEST_PROMISE_TIMEOUT_MS + 2 * 60 * 1000,
			);

			workLoop.stop();
			await vi.runAllTimersAsync();

			// Feature should be marked as failed (not pending) after max retries
			const feature = manifest.feature_queue[0];
			expect(feature?.status).toBe("failed");
			expect(feature?.error).toContain("Max retries");

			// Event should indicate failure
			expect(emitOrchestratorEvent).toHaveBeenCalledWith(
				"promise_timeout",
				expect.stringContaining("S1823.I4.F3"),
				expect.objectContaining({
					markedAsFailed: true,
				}),
			);
		});
	});
});
