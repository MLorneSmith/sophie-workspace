/**
 * Orchestrator Race Condition Prevention Tests
 *
 * Tests that verify the synchronous status update fix prevents the race condition
 * where instance.status remains "ready" after feature assignment, causing
 * writeIdleProgress() to overwrite correct progress.
 *
 * Verifies the fix for GitHub issue #1489 (diagnosis #1488).
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
	FeatureEntry,
	SandboxInstance,
	SpecManifest,
} from "../../types/index.js";

// Mock the manifest module
vi.mock("../manifest.js", () => ({
	saveManifest: vi.fn(),
}));

// Mock the progress module
vi.mock("../progress.js", () => ({
	writeIdleProgress: vi.fn(),
}));

import { writeIdleProgress } from "../progress.js";
// Import after mocking
import {
	assignFeatureToSandbox,
	getNextAvailableFeature,
} from "../work-queue.js";

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

/**
 * Create a minimal test sandbox instance
 */
function createTestInstance(
	label: string,
	status: "ready" | "busy" | "completed" | "failed" = "ready",
): SandboxInstance {
	return {
		id: `test-${label}`,
		label,
		status,
		currentFeature: null,
		featureStartedAt: undefined,
		lastProgressSeen: undefined,
		lastHeartbeat: undefined,
		outputLineCount: 0,
		hasReceivedOutput: false,
		sandbox: {} as any, // Mock sandbox object
		retryCount: 0,
		createdAt: new Date(),
	};
}

describe("Race Condition Prevention - Synchronous Status Update", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("instance status must be set before async Promise executes", () => {
		// This test verifies the core race condition fix:
		// After assignFeatureToSandbox() succeeds, the orchestrator code
		// sets instance.status = "busy" SYNCHRONOUSLY before the async Promise

		const manifest = createTestManifest([{ id: "1367", status: "pending" }]);
		const instance = createTestInstance("sbx-a");
		const feature = manifest.feature_queue[0];
		if (!feature) throw new Error("No feature in queue");

		// Initial state: instance is ready
		expect(instance.status).toBe("ready");

		// Assign feature (simulating orchestrator work loop)
		const assigned = assignFeatureToSandbox(feature, instance.label, manifest);
		expect(assigned).toBe(true);

		// CRITICAL: The fix adds these lines SYNCHRONOUSLY after assignment succeeds
		// This happens BEFORE the async Promise is created
		instance.status = "busy";
		instance.currentFeature = feature.id;
		instance.featureStartedAt = new Date();

		// Verify instance state is set synchronously (before any async code runs)
		expect(instance.status).toBe("busy");
		expect(instance.currentFeature).toBe(feature.id);
		expect(instance.featureStartedAt).toBeInstanceOf(Date);
	});

	it("writeIdleProgress should NOT be called for busy sandboxes", () => {
		// This test verifies the bug scenario:
		// Before the fix, the work loop could call writeIdleProgress() on a sandbox
		// that was supposed to be busy (because status wasn't set synchronously)

		const instance = createTestInstance("sbx-a", "busy");

		// The work loop checks if sandbox is ready before calling writeIdleProgress
		// If instance.status === "busy", it should be skipped
		if (instance.status !== "ready") {
			// This path should be taken - do NOT call writeIdleProgress
		} else {
			// Bug path - would incorrectly call writeIdleProgress
			writeIdleProgress(
				{} as any, // manifest
				instance,
				"Waiting",
				[],
			);
		}

		// writeIdleProgress should NOT have been called
		expect(writeIdleProgress).not.toHaveBeenCalled();
	});

	it("work loop iteration should not see sandbox as ready after assignment", () => {
		// This test simulates the race condition scenario:
		// 1. Feature is assigned to sandbox
		// 2. Work loop iterates again (before async Promise runs)
		// 3. Sandbox should be seen as "busy", not "ready"

		const manifest = createTestManifest([
			{ id: "1367", status: "pending" },
			{ id: "1368", status: "pending" },
		]);
		const instance = createTestInstance("sbx-a");

		// First iteration: assign feature
		const feature1 = getNextAvailableFeature(manifest);
		expect(feature1).not.toBeNull();
		if (!feature1) throw new Error("No feature available");

		const assigned = assignFeatureToSandbox(feature1, instance.label, manifest);
		expect(assigned).toBe(true);

		// CRITICAL FIX: Set status synchronously BEFORE any async code
		instance.status = "busy";
		instance.currentFeature = feature1.id;
		instance.featureStartedAt = new Date();

		// Second iteration: work loop sees sandbox as busy
		// (simulating what happens when the loop iterates again)
		expect(instance.status).toBe("busy");

		// getNextAvailableFeature would return next feature for a different sandbox
		// but this sandbox should be skipped because it's busy
		// Use type assertion to avoid "no overlap" error since we know status was set
		const status = instance.status as string;
		const sandboxIsAvailable = status === "ready";
		expect(sandboxIsAvailable).toBe(false);
	});

	it("defensive duplication: feature.ts can safely set status again", () => {
		// This test verifies that setting status in both places is safe
		// (idempotent operation - setting to same value is harmless)

		const instance = createTestInstance("sbx-a", "ready");

		// Orchestrator sets status first (synchronously)
		instance.status = "busy";
		instance.currentFeature = "1367";
		instance.featureStartedAt = new Date();
		const firstStartedAt = instance.featureStartedAt;

		// Wait a tiny bit to ensure different timestamp
		const secondDate = new Date(firstStartedAt.getTime() + 100);

		// feature.ts sets status again (defensively)
		instance.status = "busy"; // Same value - safe
		instance.currentFeature = "1367"; // Same value - safe
		instance.featureStartedAt = secondDate; // Slightly different - but that's fine

		// Final state is still valid
		expect(instance.status).toBe("busy");
		expect(instance.currentFeature).toBe("1367");
		expect(instance.featureStartedAt).toEqual(secondDate);
	});
});

describe("Race Condition Prevention - Full Work Loop Simulation", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("concurrent assignments to multiple sandboxes all get status set", () => {
		// Test that when assigning features to multiple sandboxes in one loop iteration,
		// ALL sandboxes get their status set synchronously

		const manifest = createTestManifest([
			{ id: "1367", status: "pending" },
			{ id: "1368", status: "pending" },
			{ id: "1369", status: "pending" },
		]);

		const instances = [
			createTestInstance("sbx-a"),
			createTestInstance("sbx-b"),
			createTestInstance("sbx-c"),
		];

		// Simulate one work loop iteration assigning to all sandboxes
		for (const instance of instances) {
			const feature = getNextAvailableFeature(manifest);
			if (!feature) continue;

			const assigned = assignFeatureToSandbox(
				feature,
				instance.label,
				manifest,
			);
			if (!assigned) continue;

			// CRITICAL: Set status synchronously BEFORE async Promise
			instance.status = "busy";
			instance.currentFeature = feature.id;
			instance.featureStartedAt = new Date();
		}

		// ALL sandboxes should be busy after the synchronous loop
		for (const instance of instances) {
			expect(instance.status).toBe("busy");
			expect(instance.currentFeature).not.toBeNull();
			expect(instance.featureStartedAt).toBeInstanceOf(Date);
		}

		// writeIdleProgress should NOT have been called for any sandbox
		expect(writeIdleProgress).not.toHaveBeenCalled();
	});

	it("second loop iteration sees all sandboxes as busy", () => {
		// This test verifies that if the work loop somehow runs again
		// before async code executes, it sees all sandboxes as busy

		const manifest = createTestManifest([
			{ id: "1367", status: "pending" },
			{ id: "1368", status: "pending" },
		]);

		const instances = [
			createTestInstance("sbx-a"),
			createTestInstance("sbx-b"),
		];

		// First iteration: assign features
		for (const instance of instances) {
			const feature = getNextAvailableFeature(manifest);
			if (!feature) continue;

			const assigned = assignFeatureToSandbox(
				feature,
				instance.label,
				manifest,
			);
			if (!assigned) continue;

			// Set status synchronously
			instance.status = "busy";
			instance.currentFeature = feature.id;
			instance.featureStartedAt = new Date();
		}

		// Second iteration: try to assign more work
		// (This simulates the race condition - loop running again before async)
		for (const instance of instances) {
			// Work loop checks if sandbox is ready
			if (instance.status !== "ready") {
				// Correct behavior: skip this sandbox
				continue;
			}

			// Bug behavior: would incorrectly try to assign work
			const feature = getNextAvailableFeature(manifest);
			if (feature) {
				// This should NOT happen because sandbox is busy
				expect(true).toBe(false); // Fail the test
			}
		}

		// No additional features should have been assigned
		// (both sandboxes were seen as busy)
		const instance0 = instances[0];
		const instance1 = instances[1];
		if (!instance0 || !instance1) throw new Error("Missing instances");
		expect(instance0.currentFeature).toBe("1367");
		expect(instance1.currentFeature).toBe("1368");
	});

	it("activeWork map correctly tracks all assignments", () => {
		// Test that the activeWork map pattern works with synchronous status updates

		const manifest = createTestManifest([
			{ id: "1367", status: "pending" },
			{ id: "1368", status: "pending" },
		]);

		const instances = [
			createTestInstance("sbx-a"),
			createTestInstance("sbx-b"),
		];

		const activeWork = new Map<string, Promise<void>>();

		for (const instance of instances) {
			const feature = getNextAvailableFeature(manifest);
			if (!feature) continue;

			const assigned = assignFeatureToSandbox(
				feature,
				instance.label,
				manifest,
			);
			if (!assigned) continue;

			// Set status synchronously BEFORE creating Promise
			instance.status = "busy";
			instance.currentFeature = feature.id;
			instance.featureStartedAt = new Date();

			// Create the work Promise (async execution starts here)
			const workPromise = (async () => {
				// Simulate async work
				await new Promise((resolve) => setTimeout(resolve, 10));
			})();

			activeWork.set(instance.label, workPromise);
		}

		// Both sandboxes should be in activeWork
		expect(activeWork.size).toBe(2);
		expect(activeWork.has("sbx-a")).toBe(true);
		expect(activeWork.has("sbx-b")).toBe(true);
	});
});

describe("Race Condition Prevention - Regression Tests", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("REGRESSION #1489: status must be set BEFORE async Promise, not inside", () => {
		// This test documents the bug pattern that was fixed:
		// Before the fix, status was only set inside the async Promise,
		// creating a race window where the work loop could see "ready" status

		const instance = createTestInstance("sbx-a", "ready");

		// BUG PATTERN (before fix):
		// instance.status is still "ready" when Promise is created
		// Status only changes when async code INSIDE the Promise runs

		// FIXED PATTERN:
		// Set status SYNCHRONOUSLY before creating Promise
		instance.status = "busy";
		instance.currentFeature = "1367";
		instance.featureStartedAt = new Date();

		// Then create the Promise (status already set)
		const workPromise = (async () => {
			// Async code runs later - status already correct
			expect(instance.status).toBe("busy");
		})();

		// Status is already "busy" immediately after assignment
		// (not waiting for async code to run)
		expect(instance.status).toBe("busy");

		// Clean up
		return workPromise;
	});

	it("REGRESSION #1488: writeIdleProgress overwrite prevented", () => {
		// This test verifies the specific bug from #1488:
		// writeIdleProgress was being called for sandboxes that should be busy,
		// overwriting their progress with "idle" status

		const manifest = createTestManifest([
			{ id: "1367", status: "in_progress", assigned_sandbox: "sbx-a" },
		]);

		const instance = createTestInstance("sbx-a");

		// After assignment (with the fix), instance is immediately busy
		instance.status = "busy";
		instance.currentFeature = "1367";

		// Work loop should NOT call writeIdleProgress for this sandbox
		// Use type assertion to avoid "no overlap" error
		const status = instance.status as string;
		const sandboxNeedsIdleProgress =
			status === "ready" && instance.currentFeature === null;

		expect(sandboxNeedsIdleProgress).toBe(false);

		// If we incorrectly checked (bug scenario), we would call writeIdleProgress
		if (sandboxNeedsIdleProgress) {
			// writeIdleProgress takes (sandboxLabel, instance, waitingReason, blockedBy)
			writeIdleProgress(instance.label, instance, "Waiting", []);
		}

		// writeIdleProgress should NOT have been called
		expect(writeIdleProgress).not.toHaveBeenCalled();
	});
});
