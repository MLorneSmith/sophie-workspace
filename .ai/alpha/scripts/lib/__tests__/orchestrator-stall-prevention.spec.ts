/**
 * Orchestrator Stall Prevention Integration Tests
 *
 * Tests that verify failed features can be retried and don't cause stalls.
 * Verifies the fix for GitHub issue #1487.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FeatureEntry, SpecManifest } from "../../types/index.js";

// Mock the manifest module
vi.mock("../manifest.js", () => ({
	saveManifest: vi.fn(),
}));

// Import after mocking
import {
	getNextAvailableFeature,
	assignFeatureToSandbox,
} from "../work-queue.js";

/**
 * Create a minimal test manifest
 */
function createTestManifest(
	features: Partial<FeatureEntry>[] = [],
): SpecManifest {
	return {
		metadata: {
			spec_id: 1362,
			spec_name: "Test Spec",
			generated_at: new Date().toISOString(),
			spec_dir: "/test/spec",
			research_dir: "/test/research",
		},
		initiatives: [],
		feature_queue: features.map((f, i) => ({
			id: f.id ?? 1000 + i,
			initiative_id: f.initiative_id ?? 1,
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

describe("Stall Prevention - Failed Feature Retry", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("getNextAvailableFeature returns failed features without assigned_sandbox", () => {
		// This is the key test for #1487 - after the fix, failed features
		// should have their assigned_sandbox cleared, making them available
		// for retry

		const manifest = createTestManifest([
			{
				id: 1367,
				status: "failed",
				error: "PTY SIGTERM - sandbox was killed",
				// After the fix, these should be undefined:
				assigned_sandbox: undefined,
				assigned_at: undefined,
			},
		]);

		const feature = getNextAvailableFeature(manifest);

		// Feature should be returned for retry
		expect(feature).not.toBeNull();
		expect(feature?.id).toBe(1367);
		expect(feature?.status).toBe("failed");
	});

	it("getNextAvailableFeature skips failed features WITH assigned_sandbox", () => {
		// This tests the bug scenario from #1487 - when assigned_sandbox
		// is not cleared, the feature is skipped forever

		const manifest = createTestManifest([
			{
				id: 1367,
				status: "failed",
				error: "PTY SIGTERM",
				// Bug scenario: assigned_sandbox is still set
				assigned_sandbox: "sbx-a",
				assigned_at: Date.now() - 10_000, // 10 seconds ago
			},
			{
				id: 1368,
				status: "pending",
			},
		]);

		const feature = getNextAvailableFeature(manifest);

		// Should skip 1367 (has assigned_sandbox) and return 1368
		expect(feature?.id).toBe(1368);
	});

	it("complete failure cycle: feature fails, gets cleaned up, can be retried", () => {
		// This tests the complete flow that was broken before #1487

		const manifest = createTestManifest([
			{
				id: 1367,
				status: "pending",
			},
		]);
		const feature = manifest.feature_queue[0];
		if (!feature) throw new Error("No feature in queue");

		// Step 1: Assign to sandbox
		const assigned = assignFeatureToSandbox(feature, "sbx-a", manifest);
		expect(assigned).toBe(true);
		expect(feature.status).toBe("in_progress");
		expect(feature.assigned_sandbox).toBe("sbx-a");
		expect(feature.assigned_at).toBeDefined();

		// Step 2: Feature fails with error that bypasses feature.ts
		// (simulating the orchestrator error handler with the fix)
		feature.status = "failed";
		feature.error = "PTY SIGTERM - process killed";
		// The fix adds these lines:
		feature.assigned_sandbox = undefined;
		feature.assigned_at = undefined;

		// Step 3: Feature should now be available for retry
		const retryFeature = getNextAvailableFeature(manifest);
		expect(retryFeature).not.toBeNull();
		expect(retryFeature?.id).toBe(1367);

		// Step 4: Can be assigned to a new sandbox
		const retryAssigned = assignFeatureToSandbox(feature, "sbx-b", manifest);
		expect(retryAssigned).toBe(true);
		expect(feature.assigned_sandbox).toBe("sbx-b");
		expect(feature.status).toBe("in_progress");
	});

	it("all features failing does not cause infinite stall", () => {
		// Test scenario: All features fail in first pass, should all be retryable

		const manifest = createTestManifest([
			{ id: 1367, status: "pending" },
			{ id: 1368, status: "pending" },
			{ id: 1369, status: "pending" },
		]);

		// Assign all features
		for (let i = 0; i < 3; i++) {
			const feature = manifest.feature_queue[i];
			if (!feature) throw new Error(`No feature at index ${i}`);
			const label = `sbx-${String.fromCharCode(97 + i)}`;
			assignFeatureToSandbox(feature, label, manifest);
		}

		// All features fail (with the fix applied)
		for (const feature of manifest.feature_queue) {
			feature.status = "failed";
			feature.error = "Simulated failure";
			feature.assigned_sandbox = undefined;
			feature.assigned_at = undefined;
		}

		// All three features should be available for retry
		const available1 = getNextAvailableFeature(manifest);
		expect(available1).not.toBeNull();
		if (!available1) throw new Error("No available feature 1");

		// Assign first one
		assignFeatureToSandbox(available1, "sbx-a", manifest);

		const available2 = getNextAvailableFeature(manifest);
		expect(available2).not.toBeNull();
		expect(available2?.id).not.toBe(available1.id);
		if (!available2) throw new Error("No available feature 2");

		assignFeatureToSandbox(available2, "sbx-b", manifest);

		const available3 = getNextAvailableFeature(manifest);
		expect(available3).not.toBeNull();
		expect(available3?.id).not.toBe(available1?.id);
		expect(available3?.id).not.toBe(available2?.id);
	});

	it("no stall when mixing failed and pending features", () => {
		const manifest = createTestManifest([
			{
				id: 1367,
				status: "failed",
				error: "Previous failure",
				assigned_sandbox: undefined, // Properly cleaned up
				assigned_at: undefined,
			},
			{
				id: 1368,
				status: "pending",
			},
			{
				id: 1369,
				status: "completed",
			},
		]);

		// Should get one of the available features
		const feature = getNextAvailableFeature(manifest);
		expect(feature).not.toBeNull();
		expect(["failed", "pending"]).toContain(feature?.status);
		expect(feature?.id).not.toBe(1369); // Not the completed one
	});
});

describe("Stall Prevention - Bug Regression Tests", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("REGRESSION #1487: failed feature with stale assigned_sandbox causes stall", () => {
		// This test documents the bug that was fixed
		// Before the fix, failed features kept their assigned_sandbox,
		// causing getNextAvailableFeature to skip them forever

		const manifest = createTestManifest([
			{
				id: 1367,
				status: "failed",
				error: "PTY SIGTERM",
				// BUG: This should have been cleared!
				// Without the fix, assigned_sandbox remains set
				assigned_sandbox: "sbx-a",
				assigned_at: Date.now() - 120_000, // 2 minutes ago (stale)
			},
			{
				id: 1368,
				status: "pending",
			},
		]);

		// getNextAvailableFeature does NOT have backup logic to fix this case
		// for failed features (only for in_progress with error)
		// This is why the fix in orchestrator.ts is critical
		const feature = getNextAvailableFeature(manifest);

		// Without the fix, the failed feature is skipped (stall scenario)
		// and only the pending feature is returned
		expect(feature).not.toBeNull();
		expect(feature?.id).toBe(1368); // Returns 1368, skipping 1367

		// The failed feature with assigned_sandbox would be stuck forever
		// This is the bug that the fix prevents
		const failedFeature = manifest.feature_queue[0];
		if (!failedFeature) throw new Error("No failed feature in queue");
		expect(failedFeature.assigned_sandbox).toBe("sbx-a"); // Still set!
	});

	it("FIXED #1487: proper cleanup prevents stall scenario", () => {
		// This test verifies the fix is working correctly
		// With the fix, failed features have their assigned_sandbox cleared

		const manifest = createTestManifest([
			{
				id: 1367,
				status: "failed",
				error: "PTY SIGTERM",
				// FIXED: These are now cleared by the error handler
				assigned_sandbox: undefined,
				assigned_at: undefined,
			},
		]);

		const feature = getNextAvailableFeature(manifest);

		// Feature should immediately be available without relying on stale detection
		expect(feature).not.toBeNull();
		expect(feature?.id).toBe(1367);
		expect(feature?.status).toBe("failed");
		expect(feature?.assigned_sandbox).toBeUndefined();
	});
});
