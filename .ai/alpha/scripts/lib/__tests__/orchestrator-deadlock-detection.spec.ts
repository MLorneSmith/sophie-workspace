/**
 * Deadlock Detection Unit Tests
 *
 * Tests for the deadlock detection and recovery mechanism added in Bug fix #1777.
 * Verifies that:
 * - Failed features blocking the queue are correctly identified
 * - Features are retried up to max_retries times
 * - Initiatives are marked as failed when retries are exhausted
 * - Normal operation is not affected by deadlock detection
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
	FeatureEntry,
	InitiativeEntry,
	SandboxInstance,
	SpecManifest,
} from "../../types/index.js";

// Mock the manifest module before importing
vi.mock("../manifest.js", () => ({
	saveManifest: vi.fn(),
}));

// Mock the event-emitter module
vi.mock("../event-emitter.js", () => ({
	emitOrchestratorEvent: vi.fn(),
}));

// Import after mocking
import {
	DEFAULT_MAX_RETRIES,
	getBlockingFailedFeatures,
	getPhantomCompletedFeatures,
	shouldRetryFailedFeature,
} from "../work-queue.js";
import { detectAndHandleDeadlock } from "../deadlock-handler.js";
import { emitOrchestratorEvent } from "../event-emitter.js";

/**
 * Helper to create a minimal test manifest
 */
function createTestManifest(
	features: Partial<FeatureEntry>[] = [],
	initiatives: Partial<InitiativeEntry>[] = [],
): SpecManifest {
	return {
		metadata: {
			spec_id: "1692",
			spec_name: "Test Spec",
			generated_at: new Date().toISOString(),
			spec_dir: "/test/spec",
			research_dir: "/test/research",
		},
		initiatives: initiatives.map((i, idx) => ({
			id: i.id ?? `S1692.I${idx + 1}`,
			name: i.name ?? `Test Initiative ${idx + 1}`,
			slug: i.slug ?? `test-initiative-${idx + 1}`,
			priority: i.priority ?? 1,
			status: i.status ?? "pending",
			initiative_dir: i.initiative_dir ?? `/test/initiative-${idx + 1}`,
			feature_count: i.feature_count ?? 3,
			features_completed: i.features_completed ?? 0,
			dependencies: i.dependencies ?? [],
		})),
		feature_queue: features.map((f, i) => ({
			id: f.id ?? `S1692.I1.F${i + 1}`,
			initiative_id: f.initiative_id ?? "S1692.I1",
			title: f.title ?? `Test Feature ${i + 1}`,
			priority: f.priority ?? 1,
			global_priority: f.global_priority ?? 1,
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
			status: "in_progress",
			initiatives_completed: 0,
			initiatives_total: initiatives.length || 1,
			features_completed: 0,
			features_total: features.length,
			tasks_completed: 0,
			tasks_total: features.reduce((sum, f) => sum + (f.task_count ?? 5), 0),
			next_feature_id: null,
			last_completed_feature_id: null,
			started_at: new Date().toISOString(),
			completed_at: null,
			last_checkpoint: null,
		},
		sandbox: {
			sandbox_ids: [],
			branch_name: "alpha/S1692-test",
			created_at: new Date().toISOString(),
		},
	};
}

/**
 * Helper to create a mock sandbox instance
 */
function createMockSandboxInstance(
	label: string,
	status: "ready" | "busy" | "completed" | "failed" = "ready",
): SandboxInstance {
	return {
		sandbox: {} as SandboxInstance["sandbox"],
		id: `sandbox-${label}`,
		label,
		status,
		currentFeature: null,
		retryCount: 0,
		createdAt: new Date(),
	};
}

describe("getBlockingFailedFeatures", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns empty array when no failed features exist", () => {
		const manifest = createTestManifest(
			[
				{ id: "S1692.I1.F1", status: "completed" },
				{ id: "S1692.I1.F2", status: "pending" },
				{ id: "S1692.I1.F3", status: "in_progress" },
			],
			[{ id: "S1692.I1", status: "in_progress" }],
		);

		const blocking = getBlockingFailedFeatures(manifest);

		expect(blocking).toHaveLength(0);
	});

	it("returns failed features that block other features via initiative dependencies", () => {
		const manifest = createTestManifest(
			[
				// Feature in I1 failed
				{
					id: "S1692.I1.F1",
					initiative_id: "S1692.I1",
					status: "failed",
					error: "PTY timeout",
				},
				{
					id: "S1692.I1.F2",
					initiative_id: "S1692.I1",
					status: "completed",
				},
				// Feature in I2 depends on I1 completing
				{
					id: "S1692.I2.F1",
					initiative_id: "S1692.I2",
					status: "pending",
					dependencies: ["S1692.I1"],
				},
			],
			[
				{ id: "S1692.I1", status: "in_progress" },
				{ id: "S1692.I2", status: "pending", dependencies: ["S1692.I1"] },
			],
		);

		const blocking = getBlockingFailedFeatures(manifest);

		expect(blocking).toHaveLength(1);
		expect(blocking[0]?.id).toBe("S1692.I1.F1");
	});

	it("ignores failed features not in critical path", () => {
		const manifest = createTestManifest(
			[
				// Feature in I1 failed but nothing depends on I1
				{
					id: "S1692.I1.F1",
					initiative_id: "S1692.I1",
					status: "failed",
					error: "Some error",
				},
				// Feature in I2 is pending but doesn't depend on I1
				{
					id: "S1692.I2.F1",
					initiative_id: "S1692.I2",
					status: "pending",
					dependencies: [],
				},
			],
			[
				{ id: "S1692.I1", status: "in_progress" },
				{ id: "S1692.I2", status: "pending" },
			],
		);

		const blocking = getBlockingFailedFeatures(manifest);

		// F1 failed but F2 doesn't depend on I1, so no blocking features
		expect(blocking).toHaveLength(0);
	});

	it("returns multiple failed features when multiple block the queue", () => {
		const manifest = createTestManifest(
			[
				{
					id: "S1692.I1.F1",
					initiative_id: "S1692.I1",
					status: "failed",
					error: "Error 1",
				},
				{
					id: "S1692.I1.F2",
					initiative_id: "S1692.I1",
					status: "failed",
					error: "Error 2",
				},
				{
					id: "S1692.I2.F1",
					initiative_id: "S1692.I2",
					status: "pending",
					dependencies: ["S1692.I1"],
				},
			],
			[
				{ id: "S1692.I1", status: "in_progress" },
				{ id: "S1692.I2", status: "pending" },
			],
		);

		const blocking = getBlockingFailedFeatures(manifest);

		expect(blocking).toHaveLength(2);
		expect(blocking.map((f) => f.id).sort()).toEqual([
			"S1692.I1.F1",
			"S1692.I1.F2",
		]);
	});
});

describe("shouldRetryFailedFeature", () => {
	it("returns true when retry_count is undefined (first failure)", () => {
		const feature: FeatureEntry = {
			id: "S1692.I1.F1",
			initiative_id: "S1692.I1",
			title: "Test",
			priority: 1,
			global_priority: 1,
			status: "failed",
			tasks_file: "/test",
			feature_dir: "/test",
			task_count: 5,
			tasks_completed: 0,
			sequential_hours: 4,
			parallel_hours: 2,
			dependencies: [],
			github_issue: null,
			requires_database: false,
			database_task_count: 0,
			// retry_count is undefined
		};

		expect(shouldRetryFailedFeature(feature)).toBe(true);
	});

	it("returns true when retry_count is below max retries", () => {
		const feature: FeatureEntry = {
			id: "S1692.I1.F1",
			initiative_id: "S1692.I1",
			title: "Test",
			priority: 1,
			global_priority: 1,
			status: "failed",
			tasks_file: "/test",
			feature_dir: "/test",
			task_count: 5,
			tasks_completed: 0,
			sequential_hours: 4,
			parallel_hours: 2,
			dependencies: [],
			github_issue: null,
			requires_database: false,
			database_task_count: 0,
			retry_count: 2,
		};

		expect(shouldRetryFailedFeature(feature, 3)).toBe(true);
	});

	it("returns false when retry_count equals max retries", () => {
		const feature: FeatureEntry = {
			id: "S1692.I1.F1",
			initiative_id: "S1692.I1",
			title: "Test",
			priority: 1,
			global_priority: 1,
			status: "failed",
			tasks_file: "/test",
			feature_dir: "/test",
			task_count: 5,
			tasks_completed: 0,
			sequential_hours: 4,
			parallel_hours: 2,
			dependencies: [],
			github_issue: null,
			requires_database: false,
			database_task_count: 0,
			retry_count: 3,
		};

		expect(shouldRetryFailedFeature(feature, 3)).toBe(false);
	});

	it("returns false when retry_count exceeds max retries", () => {
		const feature: FeatureEntry = {
			id: "S1692.I1.F1",
			initiative_id: "S1692.I1",
			title: "Test",
			priority: 1,
			global_priority: 1,
			status: "failed",
			tasks_file: "/test",
			feature_dir: "/test",
			task_count: 5,
			tasks_completed: 0,
			sequential_hours: 4,
			parallel_hours: 2,
			dependencies: [],
			github_issue: null,
			requires_database: false,
			database_task_count: 0,
			retry_count: 5,
		};

		expect(shouldRetryFailedFeature(feature, 3)).toBe(false);
	});

	it("uses DEFAULT_MAX_RETRIES when maxRetries not specified", () => {
		const feature: FeatureEntry = {
			id: "S1692.I1.F1",
			initiative_id: "S1692.I1",
			title: "Test",
			priority: 1,
			global_priority: 1,
			status: "failed",
			tasks_file: "/test",
			feature_dir: "/test",
			task_count: 5,
			tasks_completed: 0,
			sequential_hours: 4,
			parallel_hours: 2,
			dependencies: [],
			github_issue: null,
			requires_database: false,
			database_task_count: 0,
			retry_count: DEFAULT_MAX_RETRIES - 1,
		};

		expect(shouldRetryFailedFeature(feature)).toBe(true);

		feature.retry_count = DEFAULT_MAX_RETRIES;
		expect(shouldRetryFailedFeature(feature)).toBe(false);
	});
});

describe("detectAndHandleDeadlock", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns shouldExit=false when sandboxes are busy", async () => {
		const manifest = createTestManifest(
			[
				{
					id: "S1692.I1.F1",
					status: "failed",
					error: "Error",
				},
			],
			[{ id: "S1692.I1", status: "in_progress" }],
		);

		const instances = [createMockSandboxInstance("sbx-a", "busy")];

		const result = await detectAndHandleDeadlock(instances, manifest, true);

		expect(result.shouldExit).toBe(false);
		expect(result.retriedCount).toBe(0);
		expect(result.failedInitiatives).toHaveLength(0);
	});

	it("returns shouldExit=false when features can be assigned", async () => {
		const manifest = createTestManifest(
			[
				{ id: "S1692.I1.F1", status: "pending" }, // Available feature
				{
					id: "S1692.I1.F2",
					status: "failed",
					error: "Error",
				},
			],
			[{ id: "S1692.I1", status: "in_progress" }],
		);

		const instances = [createMockSandboxInstance("sbx-a", "ready")];

		const result = await detectAndHandleDeadlock(instances, manifest, true);

		expect(result.shouldExit).toBe(false);
		expect(result.retriedCount).toBe(0);
	});

	it("returns shouldExit=false when no failed features exist", async () => {
		const manifest = createTestManifest(
			[
				{ id: "S1692.I1.F1", status: "completed" },
				{
					id: "S1692.I1.F2",
					status: "pending",
					dependencies: ["S1692.I1.F1"],
				},
			],
			[{ id: "S1692.I1", status: "in_progress" }],
		);

		const instances = [createMockSandboxInstance("sbx-a", "ready")];

		const result = await detectAndHandleDeadlock(instances, manifest, true);

		expect(result.shouldExit).toBe(false);
	});

	it("retries failed features and returns shouldExit=false when retries available", async () => {
		// True deadlock scenario:
		// - F1 in I1 completed
		// - F2 in I1 failed (but has no blocking deps of its own - it just failed during execution)
		// - F3 in I2 depends on I1 being completed (blocked because I1 has failed feature)
		// - getNextAvailableFeature returns F2 (failed feature can be retried)
		// - BUT sandbox is busy (simulating the feature was just picked up and failed)
		// - Then sandbox becomes idle, getNextAvailableFeature returns F2 again
		//
		// Actually, let's model the REAL deadlock:
		// - All sandboxes are idle
		// - F1 is failed but its OWN dependencies are not met
		// - F2 depends on I1 (which can't complete due to F1 failing)
		// - getNextAvailableFeature returns null
		const manifest = createTestManifest(
			[
				{
					id: "S1692.I1.F1",
					initiative_id: "S1692.I1",
					status: "failed",
					error: "PTY timeout",
					retry_count: 0,
					// F1's own dependency is not met - this makes it unassignable
					dependencies: ["S1692.I0.F1"],
				},
				{
					id: "S1692.I2.F1",
					initiative_id: "S1692.I2",
					status: "pending",
					dependencies: ["S1692.I1"],
				},
			],
			[
				{ id: "S1692.I0", status: "in_progress" }, // Not completed, blocks F1
				{ id: "S1692.I1", status: "in_progress" },
				{ id: "S1692.I2", status: "pending" },
			],
		);

		const instances = [createMockSandboxInstance("sbx-a", "ready")];

		const result = await detectAndHandleDeadlock(instances, manifest, true);

		// Deadlock detected: F1 is failed and blocking I2.F1
		// F1 should be retried
		expect(result.shouldExit).toBe(false);
		expect(result.retriedCount).toBe(1);
		expect(result.failedInitiatives).toHaveLength(0);

		// Verify feature was reset
		const feature = manifest.feature_queue[0];
		expect(feature?.status).toBe("pending");
		expect(feature?.error).toBeUndefined();
		expect(feature?.retry_count).toBe(1);

		// Verify event was emitted
		expect(emitOrchestratorEvent).toHaveBeenCalledWith(
			"feature_retry",
			expect.stringContaining("S1692.I1.F1"),
			expect.objectContaining({ featureId: "S1692.I1.F1", retryCount: 1 }),
		);
	});

	it("marks initiative as failed and returns shouldExit=true when max retries exceeded", async () => {
		// Similar to retry test but with max retries already exceeded
		const manifest = createTestManifest(
			[
				{
					id: "S1692.I1.F1",
					initiative_id: "S1692.I1",
					status: "failed",
					error: "PTY timeout",
					retry_count: 3, // Max retries already reached
					// F1's own dependency blocks it from being assigned
					dependencies: ["S1692.I0.F1"],
				},
				{
					id: "S1692.I2.F1",
					initiative_id: "S1692.I2",
					status: "pending",
					dependencies: ["S1692.I1"],
				},
			],
			[
				{ id: "S1692.I0", status: "in_progress" }, // Not completed, blocks F1
				{ id: "S1692.I1", status: "in_progress" },
				{ id: "S1692.I2", status: "pending" },
			],
		);

		const instances = [createMockSandboxInstance("sbx-a", "ready")];

		const result = await detectAndHandleDeadlock(instances, manifest, true);

		expect(result.shouldExit).toBe(true);
		expect(result.retriedCount).toBe(0);
		expect(result.failedInitiatives).toContain("S1692.I1");

		// Verify initiative was marked as failed
		const initiative = manifest.initiatives.find((i) => i.id === "S1692.I1");
		expect(initiative?.status).toBe("failed");

		// Verify event was emitted
		expect(emitOrchestratorEvent).toHaveBeenCalledWith(
			"initiative_failed",
			expect.stringContaining("S1692.I1"),
			expect.objectContaining({ initiativeId: "S1692.I1" }),
		);
	});

	it("handles multiple failed features with different retry counts", async () => {
		// Two failed features in I1, both blocked by unmet dependency
		// F1 can retry (retry_count: 2), F2 exhausted retries (retry_count: 3)
		const manifest = createTestManifest(
			[
				{
					id: "S1692.I1.F1",
					initiative_id: "S1692.I1",
					status: "failed",
					error: "Error 1",
					retry_count: 2, // Can retry
					dependencies: ["S1692.I0.F1"], // Blocked by unmet dependency
				},
				{
					id: "S1692.I1.F2",
					initiative_id: "S1692.I1",
					status: "failed",
					error: "Error 2",
					retry_count: 3, // Max retries
					dependencies: ["S1692.I0.F1"], // Blocked by unmet dependency
				},
				{
					id: "S1692.I2.F1",
					initiative_id: "S1692.I2",
					status: "pending",
					dependencies: ["S1692.I1"],
				},
			],
			[
				{ id: "S1692.I0", status: "in_progress" }, // Not completed, blocks F1 and F2
				{ id: "S1692.I1", status: "in_progress" },
				{ id: "S1692.I2", status: "pending" },
			],
		);

		const instances = [createMockSandboxInstance("sbx-a", "ready")];

		const result = await detectAndHandleDeadlock(instances, manifest, true);

		// F1 can be retried, so shouldExit should be false
		expect(result.shouldExit).toBe(false);
		expect(result.retriedCount).toBe(1);
		// F2 exhausted retries, initiative marked as failed
		expect(result.failedInitiatives).toContain("S1692.I1");
	});

	it("does not double-mark initiative as failed", async () => {
		const manifest = createTestManifest(
			[
				{
					id: "S1692.I1.F1",
					initiative_id: "S1692.I1",
					status: "failed",
					error: "Error",
					retry_count: 3,
					dependencies: ["S1692.I0.F1"], // Blocked
				},
				{
					id: "S1692.I2.F1",
					initiative_id: "S1692.I2",
					status: "pending",
					dependencies: ["S1692.I1"],
				},
			],
			[
				{ id: "S1692.I0", status: "in_progress" }, // Blocks F1
				{ id: "S1692.I1", status: "failed" }, // Already failed
				{ id: "S1692.I2", status: "pending" },
			],
		);

		const instances = [createMockSandboxInstance("sbx-a", "ready")];

		const result = await detectAndHandleDeadlock(instances, manifest, true);

		// Should not double-add the initiative to failedInitiatives
		expect(result.failedInitiatives).toHaveLength(0);
	});
});

describe("regression: normal operation not affected", () => {
	it("does not detect deadlock during normal feature completion", async () => {
		const manifest = createTestManifest(
			[
				{ id: "S1692.I1.F1", status: "completed" },
				{ id: "S1692.I1.F2", status: "completed" },
				{ id: "S1692.I1.F3", status: "pending" },
			],
			[{ id: "S1692.I1", status: "in_progress" }],
		);

		const instances = [createMockSandboxInstance("sbx-a", "ready")];

		const result = await detectAndHandleDeadlock(instances, manifest, true);

		// F3 is available, so no deadlock
		expect(result.shouldExit).toBe(false);
		expect(result.retriedCount).toBe(0);
		expect(result.failedInitiatives).toHaveLength(0);
	});

	it("does not detect deadlock when all features are completed", async () => {
		const manifest = createTestManifest(
			[
				{ id: "S1692.I1.F1", status: "completed" },
				{ id: "S1692.I1.F2", status: "completed" },
				{ id: "S1692.I1.F3", status: "completed" },
			],
			[{ id: "S1692.I1", status: "completed" }],
		);

		const instances = [createMockSandboxInstance("sbx-a", "ready")];

		const result = await detectAndHandleDeadlock(instances, manifest, true);

		expect(result.shouldExit).toBe(false);
		expect(result.retriedCount).toBe(0);
	});

	it("does not detect deadlock when features are blocked by incomplete dependencies", async () => {
		// Scenario: F2 depends on F1 which is in_progress (not failed)
		// This is normal operation - not a deadlock
		const manifest = createTestManifest(
			[
				{
					id: "S1692.I1.F1",
					status: "in_progress",
					assigned_sandbox: "sbx-a",
				},
				{
					id: "S1692.I1.F2",
					status: "pending",
					dependencies: ["S1692.I1.F1"],
				},
			],
			[{ id: "S1692.I1", status: "in_progress" }],
		);

		const instances = [createMockSandboxInstance("sbx-a", "busy")];

		const result = await detectAndHandleDeadlock(instances, manifest, true);

		// Sandbox is busy, so no deadlock check performed
		expect(result.shouldExit).toBe(false);
	});
});

// ============================================================================
// Phantom Completion Detection in Deadlock Recovery (Bug fix #1782)
// ============================================================================

describe("getPhantomCompletedFeatures", () => {
	it("detects features with tasks_completed >= task_count but status in_progress", () => {
		const manifest = createTestManifest(
			[
				{
					id: "S1692.I1.F1",
					status: "in_progress",
					task_count: 4,
					tasks_completed: 4,
					assigned_sandbox: "sbx-a",
				},
			],
			[{ id: "S1692.I1", status: "in_progress" }],
		);

		const phantomFeatures = getPhantomCompletedFeatures(
			manifest,
			new Set(), // No busy sandboxes
		);

		expect(phantomFeatures).toHaveLength(1);
		expect(phantomFeatures[0]?.id).toBe("S1692.I1.F1");
	});

	it("does NOT detect phantom completion when sandbox is busy", () => {
		const manifest = createTestManifest(
			[
				{
					id: "S1692.I1.F1",
					status: "in_progress",
					task_count: 4,
					tasks_completed: 4,
					assigned_sandbox: "sbx-a",
				},
			],
			[{ id: "S1692.I1", status: "in_progress" }],
		);

		const phantomFeatures = getPhantomCompletedFeatures(
			manifest,
			new Set(["sbx-a"]), // sbx-a is busy
		);

		expect(phantomFeatures).toHaveLength(0);
	});

	it("does NOT detect phantom completion when tasks are incomplete", () => {
		const manifest = createTestManifest(
			[
				{
					id: "S1692.I1.F1",
					status: "in_progress",
					task_count: 4,
					tasks_completed: 3, // Not all tasks done
					assigned_sandbox: "sbx-a",
				},
			],
			[{ id: "S1692.I1", status: "in_progress" }],
		);

		const phantomFeatures = getPhantomCompletedFeatures(manifest, new Set());

		expect(phantomFeatures).toHaveLength(0);
	});
});

describe("detectAndHandleDeadlock - phantom completion recovery", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("recovers phantom-completed features before checking for failed features", async () => {
		// Scenario: Feature has all tasks done but status is in_progress
		// This should be recovered as phantom completion, not treated as failed
		const manifest = createTestManifest(
			[
				{
					id: "S1692.I1.F1",
					initiative_id: "S1692.I1",
					status: "in_progress",
					task_count: 4,
					tasks_completed: 4,
					assigned_sandbox: "sbx-a",
				},
				{
					id: "S1692.I2.F1",
					initiative_id: "S1692.I2",
					status: "pending",
					dependencies: ["S1692.I1"],
				},
			],
			[
				{ id: "S1692.I1", status: "in_progress", feature_count: 1 },
				{ id: "S1692.I2", status: "pending" },
			],
		);

		const instances = [createMockSandboxInstance("sbx-a", "ready")];

		const result = await detectAndHandleDeadlock(instances, manifest, true);

		// Phantom completion should be detected and recovered
		expect(result.shouldExit).toBe(false);
		expect(result.retriedCount).toBe(1); // recoveredCount returned as retriedCount

		// Verify feature was transitioned to completed
		const feature = manifest.feature_queue.find((f) => f.id === "S1692.I1.F1");
		expect(feature?.status).toBe("completed");

		// Verify event was emitted
		expect(emitOrchestratorEvent).toHaveBeenCalledWith(
			"phantom_completion_detected",
			expect.stringContaining("S1692.I1.F1"),
			expect.objectContaining({
				featureId: "S1692.I1.F1",
				tasksCompleted: 4,
				taskCount: 4,
				context: "deadlock_detection",
			}),
		);
	});

	it("updates initiative status when phantom completion makes initiative complete", async () => {
		// All features in initiative are either completed or phantom-completed
		const manifest = createTestManifest(
			[
				{
					id: "S1692.I1.F1",
					initiative_id: "S1692.I1",
					status: "completed",
					task_count: 3,
					tasks_completed: 3,
				},
				{
					id: "S1692.I1.F2",
					initiative_id: "S1692.I1",
					status: "in_progress", // Phantom completed
					task_count: 4,
					tasks_completed: 4,
				},
			],
			[{ id: "S1692.I1", status: "in_progress", feature_count: 2 }],
		);

		const instances = [createMockSandboxInstance("sbx-a", "ready")];

		await detectAndHandleDeadlock(instances, manifest, true);

		// Initiative should now be completed
		const initiative = manifest.initiatives.find((i) => i.id === "S1692.I1");
		expect(initiative?.status).toBe("completed");
	});

	it("processes multiple phantom-completed features", async () => {
		const manifest = createTestManifest(
			[
				{
					id: "S1692.I1.F1",
					initiative_id: "S1692.I1",
					status: "in_progress",
					task_count: 4,
					tasks_completed: 4,
				},
				{
					id: "S1692.I1.F2",
					initiative_id: "S1692.I1",
					status: "in_progress",
					task_count: 3,
					tasks_completed: 3,
				},
			],
			[{ id: "S1692.I1", status: "in_progress", feature_count: 2 }],
		);

		const instances = [createMockSandboxInstance("sbx-a", "ready")];

		const result = await detectAndHandleDeadlock(instances, manifest, true);

		// Both phantom completions should be recovered
		expect(result.retriedCount).toBe(2);

		// Both features should be completed
		expect(manifest.feature_queue[0]?.status).toBe("completed");
		expect(manifest.feature_queue[1]?.status).toBe("completed");
	});

	it("does not process phantom completion when sandboxes are busy", async () => {
		const manifest = createTestManifest(
			[
				{
					id: "S1692.I1.F1",
					initiative_id: "S1692.I1",
					status: "in_progress",
					task_count: 4,
					tasks_completed: 4,
					assigned_sandbox: "sbx-a",
				},
			],
			[{ id: "S1692.I1", status: "in_progress" }],
		);

		const instances = [createMockSandboxInstance("sbx-a", "busy")];

		const result = await detectAndHandleDeadlock(instances, manifest, true);

		// Sandbox is busy - no deadlock detection runs
		expect(result.shouldExit).toBe(false);
		expect(result.retriedCount).toBe(0);

		// Feature should NOT be changed
		expect(manifest.feature_queue[0]?.status).toBe("in_progress");
	});

	it("recovers phantom completion even when failed features also exist", async () => {
		// Scenario: All features have blocked dependencies OR are phantom/failed
		// - F1 in I1 is phantom completed (tasks done, status in_progress)
		// - F2 in I1 failed, with unmet dependency (blocked, can't be picked up)
		// - F3 in I2 depends on I1 completing (blocked)
		// getNextAvailableFeature returns null (no assignable work)
		// Deadlock detection triggers, finds phantom completion first
		const manifest = createTestManifest(
			[
				{
					id: "S1692.I1.F1",
					initiative_id: "S1692.I1",
					status: "in_progress", // Phantom completed
					task_count: 4,
					tasks_completed: 4,
				},
				{
					id: "S1692.I1.F2",
					initiative_id: "S1692.I1",
					status: "failed", // Failed feature
					error: "PTY timeout",
					retry_count: 0,
					dependencies: ["S1692.I0.F1"], // Blocked by unmet dependency
				},
				{
					id: "S1692.I2.F1",
					initiative_id: "S1692.I2",
					status: "pending",
					dependencies: ["S1692.I1"], // Blocked by I1 not completed
				},
			],
			[
				{ id: "S1692.I0", status: "in_progress" }, // Not completed, blocks F2
				{ id: "S1692.I1", status: "in_progress", feature_count: 2 },
				{ id: "S1692.I2", status: "pending" },
			],
		);

		const instances = [createMockSandboxInstance("sbx-a", "ready")];

		const result = await detectAndHandleDeadlock(instances, manifest, true);

		// Phantom completion should be recovered first
		expect(manifest.feature_queue[0]?.status).toBe("completed");

		// The function returns early after recovering phantom completions
		// Failed feature should not be processed in this call
		expect(result.retriedCount).toBe(1);
		expect(result.failedInitiatives).toHaveLength(0);
	});
});
