/**
 * Work Queue Tests
 *
 * Tests for atomic feature assignment and race condition prevention.
 */

import { describe, it, expect } from "vitest";
import {
	getNextAvailableFeature,
	assignFeatureToSandbox,
	cleanupStaleState,
} from "../scripts/lib/work-queue.js";
import type { FeatureEntry, SpecManifest } from "../scripts/types/index.js";

// ============================================================================
// Test Fixtures
// ============================================================================

function createMockManifest(features: Partial<FeatureEntry>[]): SpecManifest {
	return {
		metadata: {
			spec_id: 1,
			spec_name: "Test Spec",
			generated_at: new Date().toISOString(),
			spec_dir: "/test/spec",
			research_dir: "/test/research",
		},
		initiatives: [
			{
				id: 1,
				name: "Test Initiative",
				slug: "test-init",
				priority: 1,
				status: "pending",
				initiative_dir: "/test/init",
				feature_count: features.length,
				features_completed: 0,
				dependencies: [],
			},
		],
		feature_queue: features.map((f, i) => ({
			id: f.id ?? i + 1,
			initiative_id: 1,
			title: f.title ?? `Feature ${i + 1}`,
			priority: f.priority ?? 1,
			global_priority: f.global_priority ?? 1,
			status: f.status ?? "pending",
			tasks_file: "/test/tasks.json",
			feature_dir: "/test/feature",
			task_count: f.task_count ?? 5,
			tasks_completed: f.tasks_completed ?? 0,
			sequential_hours: f.sequential_hours ?? 2,
			parallel_hours: f.parallel_hours ?? 1,
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
			tasks_total: features.reduce((sum, f) => sum + (f.task_count ?? 5), 0),
			next_feature_id: null,
			last_completed_feature_id: null,
			started_at: null,
			completed_at: null,
			last_checkpoint: null,
		},
		sandbox: {
			sandbox_ids: [],
			branch_name: "alpha/test",
			created_at: null,
		},
	};
}

// ============================================================================
// Tests: getNextAvailableFeature
// ============================================================================

describe("getNextAvailableFeature", () => {
	it("returns first pending feature with no dependencies", () => {
		const manifest = createMockManifest([
			{ id: 1, status: "pending" },
			{ id: 2, status: "pending" },
		]);

		const next = getNextAvailableFeature(manifest);
		expect(next).not.toBeNull();
		expect(next?.id).toBe(1);
	});

	it("skips completed features", () => {
		const manifest = createMockManifest([
			{ id: 1, status: "completed" },
			{ id: 2, status: "pending" },
		]);

		const next = getNextAvailableFeature(manifest);
		expect(next?.id).toBe(2);
	});

	it("skips in_progress features", () => {
		const manifest = createMockManifest([
			{ id: 1, status: "in_progress", assigned_sandbox: "sbx-a" },
			{ id: 2, status: "pending" },
		]);

		const next = getNextAvailableFeature(manifest);
		expect(next?.id).toBe(2);
	});

	it("includes failed features for retry", () => {
		const manifest = createMockManifest([
			{ id: 1, status: "failed" },
			{ id: 2, status: "pending" },
		]);

		const next = getNextAvailableFeature(manifest);
		expect(next?.id).toBe(1); // Failed feature should be eligible for retry
	});

	it("skips features with incomplete dependencies", () => {
		const manifest = createMockManifest([
			{ id: 1, status: "pending", dependencies: [2] },
			{ id: 2, status: "pending" },
		]);

		const next = getNextAvailableFeature(manifest);
		expect(next?.id).toBe(2); // Feature 1 depends on 2, so 2 is selected first
	});

	it("allows features with completed dependencies", () => {
		const manifest = createMockManifest([
			{ id: 1, status: "pending", dependencies: [2] },
			{ id: 2, status: "completed" },
		]);

		const next = getNextAvailableFeature(manifest);
		expect(next?.id).toBe(1); // Feature 2 is complete, so 1 can proceed
	});

	it("skips features already assigned to a sandbox", () => {
		const manifest = createMockManifest([
			{ id: 1, status: "pending", assigned_sandbox: "sbx-a" },
			{ id: 2, status: "pending" },
		]);

		const next = getNextAvailableFeature(manifest);
		expect(next?.id).toBe(2);
	});

	it("skips features recently assigned (race condition prevention)", () => {
		const now = Date.now();
		const manifest = createMockManifest([
			{ id: 1, status: "pending", assigned_at: now - 10000 }, // 10 seconds ago
			{ id: 2, status: "pending" },
		]);

		const next = getNextAvailableFeature(manifest);
		expect(next?.id).toBe(2); // Feature 1 was recently assigned, skip it
	});

	it("allows features assigned more than 30 seconds ago", () => {
		const now = Date.now();
		const manifest = createMockManifest([
			{ id: 1, status: "pending", assigned_at: now - 35000 }, // 35 seconds ago
			{ id: 2, status: "pending" },
		]);

		const next = getNextAvailableFeature(manifest);
		expect(next?.id).toBe(1); // 35 seconds is past the conflict window
	});

	it("serializes database features", () => {
		const manifest = createMockManifest([
			{
				id: 1,
				status: "in_progress",
				assigned_sandbox: "sbx-a",
				requires_database: true,
			},
			{ id: 2, status: "pending", requires_database: true },
			{ id: 3, status: "pending", requires_database: false },
		]);

		const next = getNextAvailableFeature(manifest);
		expect(next?.id).toBe(3); // DB feature 2 skipped because 1 is running
	});

	it("returns null when no features available", () => {
		const manifest = createMockManifest([
			{ id: 1, status: "completed" },
			{ id: 2, status: "completed" },
		]);

		const next = getNextAvailableFeature(manifest);
		expect(next).toBeNull();
	});
});

// ============================================================================
// Tests: assignFeatureToSandbox
// ============================================================================

describe("assignFeatureToSandbox", () => {
	it("assigns feature to sandbox successfully", () => {
		const manifest = createMockManifest([{ id: 1, status: "pending" }]);
		const feature = manifest.feature_queue[0]!;

		const result = assignFeatureToSandbox(feature, "sbx-a");

		expect(result).toBe(true);
		expect(feature.status).toBe("in_progress");
		expect(feature.assigned_sandbox).toBe("sbx-a");
		expect(feature.assigned_at).toBeDefined();
		expect(typeof feature.assigned_at).toBe("number");
	});

	it("rejects assignment if feature already assigned to another sandbox", () => {
		const manifest = createMockManifest([
			{ id: 1, status: "pending", assigned_sandbox: "sbx-b" },
		]);
		const feature = manifest.feature_queue[0]!;

		const result = assignFeatureToSandbox(feature, "sbx-a");

		expect(result).toBe(false);
		expect(feature.assigned_sandbox).toBe("sbx-b"); // Unchanged
	});

	it("rejects assignment if feature was recently assigned", () => {
		const now = Date.now();
		const manifest = createMockManifest([
			{ id: 1, status: "pending", assigned_at: now - 10000 }, // 10 seconds ago
		]);
		const feature = manifest.feature_queue[0]!;

		const result = assignFeatureToSandbox(feature, "sbx-a");

		expect(result).toBe(false);
	});

	it("allows re-assignment by the same sandbox", () => {
		const manifest = createMockManifest([
			{ id: 1, status: "pending", assigned_sandbox: "sbx-a" },
		]);
		const feature = manifest.feature_queue[0]!;

		const result = assignFeatureToSandbox(feature, "sbx-a");

		expect(result).toBe(true);
		expect(feature.assigned_sandbox).toBe("sbx-a");
	});

	it("sets timestamp monotonically", () => {
		const manifest = createMockManifest([{ id: 1, status: "pending" }]);
		const feature = manifest.feature_queue[0]!;

		const before = Date.now();
		assignFeatureToSandbox(feature, "sbx-a");
		const after = Date.now();

		expect(feature.assigned_at).toBeGreaterThanOrEqual(before);
		expect(feature.assigned_at).toBeLessThanOrEqual(after);
	});
});

// ============================================================================
// Tests: cleanupStaleState
// ============================================================================

describe("cleanupStaleState", () => {
	it("resets in_progress features with stale sandbox assignments", () => {
		const manifest = createMockManifest([
			{ id: 1, status: "in_progress", assigned_sandbox: "sbx-dead" },
		]);

		const cleaned = cleanupStaleState(manifest);

		expect(cleaned).toBe(1);
		expect(manifest.feature_queue[0]?.status).toBe("pending");
		expect(manifest.feature_queue[0]?.assigned_sandbox).toBeUndefined();
		expect(manifest.feature_queue[0]?.assigned_at).toBeUndefined();
	});

	it("clears stale sandbox assignments from pending features", () => {
		const manifest = createMockManifest([
			{ id: 1, status: "pending", assigned_sandbox: "sbx-dead" },
		]);

		const cleaned = cleanupStaleState(manifest);

		expect(cleaned).toBe(1);
		expect(manifest.feature_queue[0]?.assigned_sandbox).toBeUndefined();
		expect(manifest.feature_queue[0]?.assigned_at).toBeUndefined();
	});

	it("clears error messages from failed features for retry", () => {
		const manifest = createMockManifest([
			{ id: 1, status: "failed", error: "Previous error" },
		]);

		cleanupStaleState(manifest);

		expect(manifest.feature_queue[0]?.error).toBeUndefined();
	});

	it("clears orphaned assigned_at without assigned_sandbox", () => {
		const now = Date.now();
		const manifest = createMockManifest([
			{ id: 1, status: "pending", assigned_at: now - 60000 }, // orphaned timestamp
		]);

		cleanupStaleState(manifest);

		expect(manifest.feature_queue[0]?.assigned_at).toBeUndefined();
	});

	it("preserves completed features", () => {
		const manifest = createMockManifest([{ id: 1, status: "completed" }]);

		const cleaned = cleanupStaleState(manifest);

		expect(cleaned).toBe(0);
		expect(manifest.feature_queue[0]?.status).toBe("completed");
	});
});

// ============================================================================
// Tests: Race Condition Simulation
// ============================================================================

describe("Race Condition Prevention", () => {
	it("prevents duplicate feature assignment when two sandboxes race", () => {
		// Simulate: sbx-a and sbx-b both try to claim feature 1 at the same time
		const manifest = createMockManifest([
			{ id: 1, status: "pending" },
			{ id: 2, status: "pending" },
		]);

		const feature = manifest.feature_queue[0]!;

		// sbx-a wins the race
		const aResult = assignFeatureToSandbox(feature, "sbx-a");
		expect(aResult).toBe(true);
		expect(feature.assigned_sandbox).toBe("sbx-a");

		// sbx-b tries to claim the same feature
		const bResult = assignFeatureToSandbox(feature, "sbx-b");
		expect(bResult).toBe(false);
		expect(feature.assigned_sandbox).toBe("sbx-a"); // Still sbx-a
	});

	it("prevents assignment during conflict window", () => {
		const manifest = createMockManifest([{ id: 1, status: "pending" }]);
		const feature = manifest.feature_queue[0]!;

		// First assignment succeeds
		assignFeatureToSandbox(feature, "sbx-a");
		const assignedAt = feature.assigned_at!;

		// Simulate: sbx-b reads manifest, sees no assigned_sandbox yet
		// But feature has assigned_at set
		feature.assigned_sandbox = undefined; // Simulating race timing

		// sbx-b tries to assign - should fail due to recent assigned_at
		const result = assignFeatureToSandbox(feature, "sbx-b");

		// The timestamp should prevent sbx-b from claiming
		expect(result).toBe(false);
		expect(feature.assigned_at).toBe(assignedAt); // Unchanged
	});
});
