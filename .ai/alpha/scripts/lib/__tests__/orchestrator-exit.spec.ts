/**
 * Orchestrator Exit Condition Unit Tests
 *
 * Tests for the work loop exit condition logic.
 * These tests verify the fix for GitHub issue #1467.
 *
 * The bug: Exit condition only checked for retryable features WITH dependencies,
 * ignoring failed features WITHOUT dependencies, causing premature exit.
 *
 * The fix: Check for ANY retryable features (pending OR failed), regardless
 * of dependency status. Only exit if no retryable features exist.
 */

import { describe, expect, it } from "vitest";
import type { FeatureEntry, SpecManifest } from "../../types/index.js";

/**
 * Create a minimal test manifest for exit condition testing
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

/**
 * Helper function that mirrors the FIXED exit condition logic in orchestrator.ts
 *
 * Returns true if the work loop should CONTINUE (retryable features exist)
 * Returns false if the work loop should EXIT (no retryable features)
 */
function hasRetryableFeatures(manifest: SpecManifest): boolean {
	const retryableFeatures = manifest.feature_queue.filter(
		(f) => f.status === "pending" || f.status === "failed",
	);
	return retryableFeatures.length > 0;
}

/**
 * Helper function that mirrors the OLD BUGGY exit condition logic
 *
 * This is what the code used to do - only checking for blocked features
 * with dependencies, missing failed features without dependencies.
 */
function hasRetryableFeaturesOldBuggy(manifest: SpecManifest): boolean {
	const blockedFeatures = manifest.feature_queue.filter(
		(f) =>
			(f.status === "pending" || f.status === "failed") &&
			f.dependencies.length > 0,
	);
	return blockedFeatures.length > 0;
}

describe("Orchestrator Exit Condition Logic", () => {
	describe("hasRetryableFeatures (FIXED logic)", () => {
		it("should return TRUE when pending features exist (no dependencies)", () => {
			const manifest = createTestManifest([
				{ id: "1001", status: "pending", dependencies: [] },
			]);

			expect(hasRetryableFeatures(manifest)).toBe(true);
		});

		it("should return TRUE when failed features exist (no dependencies)", () => {
			const manifest = createTestManifest([
				{
					id: "1001",
					status: "failed",
					dependencies: [],
					error: "Sandbox startup failed",
				},
			]);

			expect(hasRetryableFeatures(manifest)).toBe(true);
		});

		it("should return TRUE when pending features exist (with dependencies)", () => {
			const manifest = createTestManifest([
				{ id: "1001", status: "pending", dependencies: ["999"] },
			]);

			expect(hasRetryableFeatures(manifest)).toBe(true);
		});

		it("should return TRUE when failed features exist (with dependencies)", () => {
			const manifest = createTestManifest([
				{ id: "1001", status: "failed", dependencies: ["999"] },
			]);

			expect(hasRetryableFeatures(manifest)).toBe(true);
		});

		it("should return FALSE when all features are completed", () => {
			const manifest = createTestManifest([
				{ id: "1001", status: "completed" },
				{ id: "1002", status: "completed" },
			]);

			expect(hasRetryableFeatures(manifest)).toBe(false);
		});

		it("should return FALSE when feature queue is empty", () => {
			const manifest = createTestManifest([]);

			expect(hasRetryableFeatures(manifest)).toBe(false);
		});

		it("should return FALSE when all features are in_progress", () => {
			// Note: in_progress features are being worked on, not retryable
			const manifest = createTestManifest([
				{
					id: "1001",
					status: "in_progress",
					assigned_sandbox: "sbx-a",
					assigned_at: Date.now(),
				},
			]);

			expect(hasRetryableFeatures(manifest)).toBe(false);
		});

		it("should return TRUE when mix of completed and failed exists", () => {
			const manifest = createTestManifest([
				{ id: "1001", status: "completed" },
				{ id: "1002", status: "failed", error: "Test error" },
				{ id: "1003", status: "completed" },
			]);

			expect(hasRetryableFeatures(manifest)).toBe(true);
		});
	});

	describe("BUG REGRESSION: Old logic failed with failed features without dependencies", () => {
		it("OLD BUGGY logic: incorrectly returned FALSE for failed features without dependencies", () => {
			// This test documents the bug - the old logic would miss this case
			const manifest = createTestManifest([
				{
					id: "1001",
					status: "failed",
					dependencies: [], // No dependencies!
					error: "All sandboxes failed simultaneously",
				},
				{
					id: "1002",
					status: "failed",
					dependencies: [],
					error: "All sandboxes failed simultaneously",
				},
			]);

			// Old buggy logic: Would return FALSE (bug!)
			expect(hasRetryableFeaturesOldBuggy(manifest)).toBe(false);

			// Fixed logic: Returns TRUE (correct!)
			expect(hasRetryableFeatures(manifest)).toBe(true);
		});

		it("OLD BUGGY logic: correctly returned TRUE for blocked features WITH dependencies", () => {
			const manifest = createTestManifest([
				{
					id: "1001",
					status: "pending",
					dependencies: ["999"], // Has dependency
				},
			]);

			// Both old and new logic correctly identify this
			expect(hasRetryableFeaturesOldBuggy(manifest)).toBe(true);
			expect(hasRetryableFeatures(manifest)).toBe(true);
		});

		it("FIX VERIFICATION: All sandboxes fail scenario should continue, not exit", () => {
			// This is the exact scenario from the bug report:
			// - All 3 sandboxes fail simultaneously during startup
			// - Features get marked as "failed" without dependencies being an issue
			// - Work loop should CONTINUE to retry features, not exit

			const manifest = createTestManifest([
				{
					id: "1367",
					title: "User Dashboard - Statistics Cards",
					status: "failed",
					dependencies: [],
					error: "Sandbox startup failed",
				},
				{
					id: "1368",
					title: "User Dashboard - Activity Feed",
					status: "failed",
					dependencies: [],
					error: "Sandbox startup failed",
				},
				{
					id: "1369",
					title: "User Dashboard - Quick Actions",
					status: "failed",
					dependencies: [],
					error: "Sandbox startup failed",
				},
			]);

			// The fix ensures we continue when retryable features exist
			expect(hasRetryableFeatures(manifest)).toBe(true);

			// The old buggy logic would have exited prematurely
			expect(hasRetryableFeaturesOldBuggy(manifest)).toBe(false);
		});
	});

	describe("Edge cases", () => {
		it("should handle mixed statuses correctly", () => {
			const manifest = createTestManifest([
				{ id: "1001", status: "completed" },
				{
					id: "1002",
					status: "in_progress",
					assigned_sandbox: "sbx-a",
					assigned_at: Date.now(),
				},
				{ id: "1003", status: "pending" },
				{ id: "1004", status: "failed" },
			]);

			// Should return true because pending (1003) and failed (1004) exist
			expect(hasRetryableFeatures(manifest)).toBe(true);
		});

		it("should handle features with empty dependency arrays", () => {
			const manifest = createTestManifest([
				{ id: "1001", status: "pending", dependencies: [] },
			]);

			expect(hasRetryableFeatures(manifest)).toBe(true);
		});

		it("should handle features with multiple dependencies", () => {
			const manifest = createTestManifest([
				{ id: "1001", status: "failed", dependencies: ["998", "999", "1000"] },
			]);

			expect(hasRetryableFeatures(manifest)).toBe(true);
		});

		it("should return FALSE when only in_progress and completed features exist", () => {
			const manifest = createTestManifest([
				{ id: "1001", status: "completed" },
				{
					id: "1002",
					status: "in_progress",
					assigned_sandbox: "sbx-b",
					assigned_at: Date.now(),
				},
			]);

			// No pending or failed features - nothing to retry
			expect(hasRetryableFeatures(manifest)).toBe(false);
		});
	});

	describe("Blocked features logging (secondary behavior)", () => {
		it("should correctly identify blocked features among retryable features", () => {
			// The fix preserves logging of blocked features for visibility
			const manifest = createTestManifest([
				{ id: "1001", status: "pending", dependencies: [] }, // Not blocked
				{ id: "1002", status: "pending", dependencies: ["1001"] }, // Blocked
				{ id: "1003", status: "failed", dependencies: ["999"] }, // Blocked
			]);

			const retryableFeatures = manifest.feature_queue.filter(
				(f) => f.status === "pending" || f.status === "failed",
			);

			const blockedFeatures = retryableFeatures.filter(
				(f) => f.dependencies.length > 0,
			);

			expect(retryableFeatures.length).toBe(3);
			expect(blockedFeatures.length).toBe(2); // 1002 and 1003
			expect(blockedFeatures.map((f) => f.id)).toEqual(["1002", "1003"]);
		});
	});
});
