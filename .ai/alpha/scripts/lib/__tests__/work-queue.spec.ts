/**
 * Work Queue Unit Tests
 *
 * Tests for race condition prevention and error field handling.
 * These tests verify the fixes for GitHub issue #1431.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FeatureEntry, SpecManifest } from "../../types/index.js";

// Mock the manifest module before importing work-queue
vi.mock("../manifest.js", () => ({
	saveManifest: vi.fn(),
}));

// Import after mocking
import {
	assignFeatureToSandbox,
	getNextAvailableFeature,
	getPhantomCompletedFeatures,
} from "../work-queue.js";

/**
 * Helper to get feature at index with assertion
 */
function getFeatureAt(manifest: SpecManifest, index: number): FeatureEntry {
	const feature = manifest.feature_queue[index];
	if (!feature) {
		throw new Error(`No feature at index ${index}`);
	}
	return feature;
}

/**
 * Create a minimal test manifest
 */
function createTestManifest(
	features: Partial<FeatureEntry>[] = [],
): SpecManifest {
	return {
		metadata: {
			spec_id: "1362",
			spec_name: "Test Spec",
			generated_at: new Date().toISOString(),
			spec_dir: "/test/spec",
			research_dir: "/test/research",
		},
		initiatives: [],
		feature_queue: features.map((f, i) => ({
			id: f.id ?? String(1000 + i),
			initiative_id: f.initiative_id ?? "1",
			title: f.title ?? `Test Feature ${i}`,
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

describe("assignFeatureToSandbox", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("clears previous error when assigning feature", () => {
		const manifest = createTestManifest([
			{
				id: "1367",
				status: "pending",
				error: "Previous error message from failed attempt",
			},
		]);
		const feature = getFeatureAt(manifest, 0);

		const result = assignFeatureToSandbox(feature, "sbx-a", manifest);

		expect(result).toBe(true);
		expect(feature.error).toBeUndefined();
		expect(feature.status).toBe("in_progress");
		expect(feature.assigned_sandbox).toBe("sbx-a");
	});

	it("sets assigned_at timestamp on assignment", () => {
		const beforeAssignment = Date.now();
		const manifest = createTestManifest([{ id: "1367", status: "pending" }]);
		const feature = getFeatureAt(manifest, 0);

		assignFeatureToSandbox(feature, "sbx-a", manifest);

		expect(feature.assigned_at).toBeDefined();
		expect(feature.assigned_at).toBeGreaterThanOrEqual(beforeAssignment);
		expect(feature.assigned_at).toBeLessThanOrEqual(Date.now());
	});

	it("prevents race when feature was recently assigned", () => {
		const manifest = createTestManifest([
			{
				id: "1367",
				status: "pending",
				assigned_at: Date.now() - 10_000, // 10 seconds ago
			},
		]);
		const feature = getFeatureAt(manifest, 0);

		const result = assignFeatureToSandbox(feature, "sbx-b", manifest);

		expect(result).toBe(false); // Should fail due to recent assignment
	});

	it("allows assignment when previous assignment is stale", () => {
		const manifest = createTestManifest([
			{
				id: "1367",
				status: "pending",
				assigned_at: Date.now() - 60_000, // 60 seconds ago (stale)
			},
		]);
		const feature = getFeatureAt(manifest, 0);

		const result = assignFeatureToSandbox(feature, "sbx-b", manifest);

		expect(result).toBe(true);
		expect(feature.assigned_sandbox).toBe("sbx-b");
	});

	it("prevents race when feature already claimed by another sandbox", () => {
		const manifest = createTestManifest([
			{
				id: "1367",
				status: "in_progress",
				assigned_sandbox: "sbx-a",
				assigned_at: Date.now() - 5_000,
			},
		]);
		const feature = getFeatureAt(manifest, 0);

		const result = assignFeatureToSandbox(feature, "sbx-b", manifest);

		expect(result).toBe(false);
		expect(feature.assigned_sandbox).toBe("sbx-a"); // Unchanged
	});
});

describe("getNextAvailableFeature - inconsistent state handler", () => {
	it("does NOT reset inconsistent state if assignment is recent (<60s)", () => {
		const manifest = createTestManifest([
			{
				id: "1367",
				status: "in_progress",
				error: "Some error from previous run",
				assigned_sandbox: "sbx-a",
				assigned_at: Date.now() - 30_000, // 30 seconds ago
			},
		]);

		const feature = getNextAvailableFeature(manifest);
		const originalFeature = getFeatureAt(manifest, 0);

		// Feature should NOT be reset and returned (it's recently assigned)
		expect(feature).toBeNull();
		// Feature should still be in_progress (not reset to failed)
		expect(originalFeature.status).toBe("in_progress");
		expect(originalFeature.assigned_sandbox).toBe("sbx-a");
	});

	it("resets inconsistent state if assignment is old (>60s)", () => {
		const manifest = createTestManifest([
			{
				id: "1367",
				status: "in_progress",
				error: "Some error from previous run",
				assigned_sandbox: "sbx-a",
				assigned_at: Date.now() - 120_000, // 2 minutes ago
			},
		]);

		const feature = getNextAvailableFeature(manifest);
		const originalFeature = getFeatureAt(manifest, 0);

		// Feature should be reset to failed
		expect(originalFeature.status).toBe("failed");
		expect(originalFeature.assigned_sandbox).toBeUndefined();
		// And then returned as next available (failed features are retried)
		expect(feature?.id).toBe("1367");
	});

	it("resets inconsistent state immediately if no assigned_at", () => {
		const manifest = createTestManifest([
			{
				id: "1367",
				status: "in_progress",
				error: "Some error from previous run",
				// No assigned_at - legacy state
			},
		]);

		const feature = getNextAvailableFeature(manifest);
		const originalFeature = getFeatureAt(manifest, 0);

		// Should reset immediately since we can't tell how old it is
		expect(originalFeature.status).toBe("failed");
		expect(feature?.id).toBe("1367");
	});

	it("returns pending features normally", () => {
		const manifest = createTestManifest([
			{ id: "1367", status: "pending" },
			{ id: "1368", status: "pending" },
		]);

		const feature = getNextAvailableFeature(manifest);

		expect(feature?.id).toBe("1367");
		expect(feature?.status).toBe("pending");
	});

	it("skips features already assigned to another sandbox", () => {
		const manifest = createTestManifest([
			{
				id: "1367",
				status: "in_progress",
				assigned_sandbox: "sbx-a",
				assigned_at: Date.now() - 5_000,
			},
			{ id: "1368", status: "pending" },
		]);

		const feature = getNextAvailableFeature(manifest);

		expect(feature?.id).toBe("1368"); // Skips 1367, returns 1368
	});

	it("skips features recently assigned (race window)", () => {
		const manifest = createTestManifest([
			{
				id: "1367",
				status: "pending",
				assigned_at: Date.now() - 10_000, // 10 seconds ago (within race window)
			},
			{ id: "1368", status: "pending" },
		]);

		const feature = getNextAvailableFeature(manifest);

		expect(feature?.id).toBe("1368"); // Skips 1367 due to race window
	});
});

describe("race condition regression tests", () => {
	it("prevents multiple sandboxes from claiming same feature", () => {
		const manifest = createTestManifest([{ id: "1367", status: "pending" }]);
		const feature = getFeatureAt(manifest, 0);

		// First sandbox claims feature
		const result1 = assignFeatureToSandbox(feature, "sbx-a", manifest);
		expect(result1).toBe(true);
		expect(feature.assigned_sandbox).toBe("sbx-a");

		// Second sandbox tries to claim same feature
		const result2 = assignFeatureToSandbox(feature, "sbx-b", manifest);
		expect(result2).toBe(false);
		expect(feature.assigned_sandbox).toBe("sbx-a"); // Still assigned to first
	});

	it("does not create race loop with error+in_progress state", () => {
		// This test verifies the fix for #1431 - the race condition where
		// error field persists through re-assignment, causing inconsistent
		// state handler to reset actively-assigned features

		const manifest = createTestManifest([
			{
				id: "1367",
				status: "failed",
				error: "Previous sandbox expired",
			},
		]);
		const feature = getFeatureAt(manifest, 0);

		// Get the feature for re-assignment
		const nextFeature = getNextAvailableFeature(manifest);
		expect(nextFeature?.id).toBe("1367");

		// Assign to new sandbox - this should clear the error
		const result = assignFeatureToSandbox(feature, "sbx-b", manifest);
		expect(result).toBe(true);
		expect(feature.error).toBeUndefined(); // Critical: error is cleared!
		expect(feature.status).toBe("in_progress");

		// Now getNextAvailableFeature should NOT reset this feature
		// because it doesn't have both in_progress AND error
		const shouldBeNull = getNextAvailableFeature(manifest);
		expect(shouldBeNull).toBeNull(); // No features available (1367 is in_progress)
		expect(feature.status).toBe("in_progress"); // Still in_progress, not reset
	});
});

// ============================================================================
// Phantom Completion Detection Tests (Bug fix #1782)
// ============================================================================

describe("getPhantomCompletedFeatures", () => {
	it("detects feature with all tasks completed but status in_progress", () => {
		const manifest = createTestManifest([
			{
				id: "1367",
				status: "in_progress",
				task_count: 4,
				tasks_completed: 4,
				assigned_sandbox: "sbx-a",
			},
		]);

		const phantomFeatures = getPhantomCompletedFeatures(
			manifest,
			new Set(), // No busy sandboxes
		);

		expect(phantomFeatures).toHaveLength(1);
		expect(phantomFeatures[0]?.id).toBe("1367");
	});

	it("detects feature with more tasks completed than task_count", () => {
		// Edge case - shouldn't happen but handle gracefully
		const manifest = createTestManifest([
			{
				id: "1367",
				status: "in_progress",
				task_count: 4,
				tasks_completed: 5, // More than task_count
				assigned_sandbox: "sbx-a",
			},
		]);

		const phantomFeatures = getPhantomCompletedFeatures(manifest, new Set());

		expect(phantomFeatures).toHaveLength(1);
	});

	it("does NOT detect feature where tasks are incomplete", () => {
		const manifest = createTestManifest([
			{
				id: "1367",
				status: "in_progress",
				task_count: 4,
				tasks_completed: 3, // One task remaining
				assigned_sandbox: "sbx-a",
			},
		]);

		const phantomFeatures = getPhantomCompletedFeatures(manifest, new Set());

		expect(phantomFeatures).toHaveLength(0);
	});

	it("does NOT detect feature with status completed", () => {
		const manifest = createTestManifest([
			{
				id: "1367",
				status: "completed",
				task_count: 4,
				tasks_completed: 4,
			},
		]);

		const phantomFeatures = getPhantomCompletedFeatures(manifest, new Set());

		expect(phantomFeatures).toHaveLength(0);
	});

	it("does NOT detect feature with status pending", () => {
		const manifest = createTestManifest([
			{
				id: "1367",
				status: "pending",
				task_count: 4,
				tasks_completed: 0,
			},
		]);

		const phantomFeatures = getPhantomCompletedFeatures(manifest, new Set());

		expect(phantomFeatures).toHaveLength(0);
	});

	it("does NOT detect feature with status failed", () => {
		const manifest = createTestManifest([
			{
				id: "1367",
				status: "failed",
				task_count: 4,
				tasks_completed: 2,
			},
		]);

		const phantomFeatures = getPhantomCompletedFeatures(manifest, new Set());

		expect(phantomFeatures).toHaveLength(0);
	});

	it("does NOT detect feature if assigned sandbox is busy", () => {
		const manifest = createTestManifest([
			{
				id: "1367",
				status: "in_progress",
				task_count: 4,
				tasks_completed: 4,
				assigned_sandbox: "sbx-a",
			},
		]);

		const phantomFeatures = getPhantomCompletedFeatures(
			manifest,
			new Set(["sbx-a"]), // sbx-a is busy
		);

		expect(phantomFeatures).toHaveLength(0);
	});

	it("detects feature with no assigned sandbox (orphaned)", () => {
		const manifest = createTestManifest([
			{
				id: "1367",
				status: "in_progress",
				task_count: 4,
				tasks_completed: 4,
				// No assigned_sandbox - orphaned state
			},
		]);

		const phantomFeatures = getPhantomCompletedFeatures(manifest, new Set());

		expect(phantomFeatures).toHaveLength(1);
	});

	it("detects multiple phantom-completed features", () => {
		const manifest = createTestManifest([
			{
				id: "1367",
				status: "in_progress",
				task_count: 4,
				tasks_completed: 4,
			},
			{
				id: "1368",
				status: "in_progress",
				task_count: 3,
				tasks_completed: 3,
			},
			{
				id: "1369",
				status: "in_progress",
				task_count: 5,
				tasks_completed: 2, // Not phantom-completed
			},
		]);

		const phantomFeatures = getPhantomCompletedFeatures(manifest, new Set());

		expect(phantomFeatures).toHaveLength(2);
		expect(phantomFeatures.map((f) => f.id)).toEqual(["1367", "1368"]);
	});

	it("handles tasks_completed being undefined (defaults to 0)", () => {
		const manifest = createTestManifest([
			{
				id: "1367",
				status: "in_progress",
				task_count: 4,
				// tasks_completed undefined - should default to 0
			},
		]);

		const phantomFeatures = getPhantomCompletedFeatures(manifest, new Set());

		expect(phantomFeatures).toHaveLength(0); // 0 < 4, not phantom-completed
	});

	it("detects feature with task_count 0 and tasks_completed 0", () => {
		// Edge case - feature with no tasks should be detectable
		const manifest = createTestManifest([
			{
				id: "1367",
				status: "in_progress",
				task_count: 0,
				tasks_completed: 0,
			},
		]);

		const phantomFeatures = getPhantomCompletedFeatures(manifest, new Set());

		expect(phantomFeatures).toHaveLength(1);
	});
});
