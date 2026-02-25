/**
 * Feature Transitions Unit Tests
 *
 * Tests for the centralized state transition functions introduced in #1955.
 * Verifies transition validation, side effects, initiative cascade,
 * and manifest persistence.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
	FeatureEntry,
	InitiativeEntry,
	SpecManifest,
} from "../../types/index.js";

// Mock the manifest module
vi.mock("../manifest.js", () => ({
	saveManifest: vi.fn(),
}));

import {
	transitionFeatureStatus,
	transitionInitiativeStatus,
	updateInitiativeStatusFromFeatures,
	VALID_FEATURE_TRANSITIONS,
	VALID_INITIATIVE_TRANSITIONS,
} from "../feature-transitions.js";
import { saveManifest } from "../manifest.js";

function createFeature(overrides: Partial<FeatureEntry> = {}): FeatureEntry {
	return {
		id: "S1.I1.F1",
		initiative_id: "S1.I1",
		title: "Test Feature",
		priority: 1,
		global_priority: 1,
		status: "pending",
		tasks_file: "/test/tasks.json",
		feature_dir: "/test/feature",
		task_count: 5,
		tasks_completed: 0,
		sequential_hours: 4,
		parallel_hours: 2,
		dependencies: [],
		github_issue: null,
		requires_database: false,
		database_task_count: 0,
		...overrides,
	};
}

function createManifest(
	features: FeatureEntry[] = [],
	initiatives: Partial<InitiativeEntry>[] = [],
): SpecManifest {
	return {
		metadata: {
			spec_id: "1",
			spec_name: "Test",
			generated_at: new Date().toISOString(),
			spec_dir: "/test",
			research_dir: "/test/research",
		},
		initiatives: initiatives.map((i, idx) => ({
			id: i.id ?? `S1.I${idx + 1}`,
			name: i.name ?? `Initiative ${idx + 1}`,
			slug: i.slug ?? `initiative-${idx + 1}`,
			priority: i.priority ?? 1,
			status: i.status ?? "pending",
			initiative_dir: i.initiative_dir ?? `/test/init-${idx + 1}`,
			feature_count: i.feature_count ?? 3,
			features_completed: i.features_completed ?? 0,
			dependencies: i.dependencies ?? [],
		})),
		feature_queue: features,
		progress: {
			status: "in_progress",
			initiatives_completed: 0,
			initiatives_total: initiatives.length || 1,
			features_completed: 0,
			features_total: features.length,
			tasks_completed: 0,
			tasks_total: features.reduce((sum, f) => sum + f.task_count, 0),
			next_feature_id: null,
			last_completed_feature_id: null,
			started_at: new Date().toISOString(),
			completed_at: null,
			last_checkpoint: null,
		},
		sandbox: {
			sandbox_ids: [],
			branch_name: null,
			created_at: null,
		},
	} as SpecManifest;
}

describe("transitionFeatureStatus", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("applies valid pending -> in_progress transition", () => {
		const feature = createFeature({ status: "pending" });
		const manifest = createManifest([feature]);

		const result = transitionFeatureStatus(feature, manifest, "in_progress", {
			reason: "test",
		});

		expect(result.success).toBe(true);
		expect(result.previousStatus).toBe("pending");
		expect(result.newStatus).toBe("in_progress");
		expect(feature.status).toBe("in_progress");
	});

	it("applies valid in_progress -> completed transition", () => {
		const feature = createFeature({ status: "in_progress" });
		const manifest = createManifest([feature]);

		const result = transitionFeatureStatus(feature, manifest, "completed", {
			reason: "test",
		});

		expect(result.success).toBe(true);
		expect(feature.status).toBe("completed");
	});

	it("rejects invalid completed -> pending transition", () => {
		const feature = createFeature({ status: "completed" });
		const manifest = createManifest([feature]);

		const result = transitionFeatureStatus(feature, manifest, "pending", {
			reason: "test",
		});

		expect(result.success).toBe(false);
		expect(feature.status).toBe("completed"); // unchanged
		expect(result.warning).toContain("Invalid transition");
	});

	it("remaps 'blocked' target to 'failed' (#1952)", () => {
		const feature = createFeature({ status: "in_progress" });
		const manifest = createManifest([feature]);

		const result = transitionFeatureStatus(feature, manifest, "blocked", {
			reason: "GPT agent wrote blocked status",
		});

		expect(result.success).toBe(true);
		expect(feature.status).toBe("failed");
		expect(result.newStatus).toBe("failed");
	});

	it("allows blocked -> failed transition from existing blocked state", () => {
		const feature = createFeature({ status: "blocked" });
		const manifest = createManifest([feature]);

		const result = transitionFeatureStatus(feature, manifest, "failed", {
			reason: "test",
		});

		expect(result.success).toBe(true);
		expect(feature.status).toBe("failed");
	});

	it("clears assignment on pending transition", () => {
		const feature = createFeature({
			status: "in_progress",
			assigned_sandbox: "sbx-a",
			assigned_at: Date.now(),
		});
		const manifest = createManifest([feature]);

		transitionFeatureStatus(feature, manifest, "pending", {
			reason: "reset",
		});

		expect(feature.assigned_sandbox).toBeUndefined();
		expect(feature.assigned_at).toBeUndefined();
	});

	it("sets assigned_at on in_progress if not already set", () => {
		const feature = createFeature({ status: "pending" });
		const manifest = createManifest([feature]);

		transitionFeatureStatus(feature, manifest, "in_progress", {
			reason: "test",
		});

		expect(feature.assigned_at).toBeDefined();
		expect(typeof feature.assigned_at).toBe("number");
	});

	it("preserves existing assigned_at on in_progress transition", () => {
		const existingAt = Date.now() - 5000;
		const feature = createFeature({
			status: "pending",
			assigned_at: existingAt,
		});
		const manifest = createManifest([feature]);

		transitionFeatureStatus(feature, manifest, "in_progress", {
			reason: "test",
		});

		expect(feature.assigned_at).toBe(existingAt);
	});

	it("calls saveManifest by default", () => {
		const feature = createFeature({ status: "pending" });
		const manifest = createManifest([feature]);

		transitionFeatureStatus(feature, manifest, "in_progress", {
			reason: "test",
		});

		expect(saveManifest).toHaveBeenCalledWith(manifest);
	});

	it("skips saveManifest when skipSave is true", () => {
		const feature = createFeature({ status: "pending" });
		const manifest = createManifest([feature]);

		transitionFeatureStatus(feature, manifest, "in_progress", {
			reason: "test",
			skipSave: true,
		});

		expect(saveManifest).not.toHaveBeenCalled();
	});

	it("cascades initiative status on feature completion", () => {
		const features = [
			createFeature({
				id: "S1.I1.F1",
				initiative_id: "S1.I1",
				status: "completed",
			}),
			createFeature({
				id: "S1.I1.F2",
				initiative_id: "S1.I1",
				status: "in_progress",
			}),
		];
		const manifest = createManifest(features, [
			{ id: "S1.I1", feature_count: 2, status: "in_progress" },
		]);

		transitionFeatureStatus(manifest.feature_queue[1]!, manifest, "completed", {
			reason: "test",
		});

		expect(manifest.initiatives[0]!.status).toBe("completed");
		expect(manifest.initiatives[0]!.features_completed).toBe(2);
	});

	it("skips initiative cascade when skipInitiativeCascade is true", () => {
		const feature = createFeature({
			status: "in_progress",
			initiative_id: "S1.I1",
		});
		const manifest = createManifest(
			[feature],
			[{ id: "S1.I1", status: "in_progress" }],
		);

		transitionFeatureStatus(feature, manifest, "completed", {
			reason: "test",
			skipSave: true,
			skipInitiativeCascade: true,
		});

		// Initiative should NOT have been updated to completed
		// (it has 3 features by default, only 1 completed)
		expect(manifest.initiatives[0]!.status).toBe("in_progress");
	});
});

describe("transitionInitiativeStatus", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("applies valid pending -> in_progress transition", () => {
		const manifest = createManifest([], [{ id: "S1.I1", status: "pending" }]);
		const initiative = manifest.initiatives[0]!;

		const result = transitionInitiativeStatus(
			initiative,
			manifest,
			"in_progress",
			{ reason: "test" },
		);

		expect(result.success).toBe(true);
		expect(initiative.status).toBe("in_progress");
	});

	it("rejects invalid completed -> pending transition", () => {
		const manifest = createManifest([], [{ id: "S1.I1", status: "completed" }]);
		const initiative = manifest.initiatives[0]!;

		const result = transitionInitiativeStatus(initiative, manifest, "pending", {
			reason: "test",
		});

		expect(result.success).toBe(false);
		expect(initiative.status).toBe("completed");
	});

	it("calls saveManifest by default", () => {
		const manifest = createManifest([], [{ id: "S1.I1", status: "pending" }]);
		const initiative = manifest.initiatives[0]!;

		transitionInitiativeStatus(initiative, manifest, "in_progress", {
			reason: "test",
		});

		expect(saveManifest).toHaveBeenCalledWith(manifest);
	});
});

describe("updateInitiativeStatusFromFeatures", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("sets initiative to completed when all features are completed", () => {
		const features = [
			createFeature({
				id: "S1.I1.F1",
				initiative_id: "S1.I1",
				status: "completed",
			}),
			createFeature({
				id: "S1.I1.F2",
				initiative_id: "S1.I1",
				status: "completed",
			}),
		];
		const manifest = createManifest(features, [
			{ id: "S1.I1", feature_count: 2, status: "in_progress" },
		]);

		updateInitiativeStatusFromFeatures("S1.I1", manifest);

		expect(manifest.initiatives[0]!.status).toBe("completed");
		expect(manifest.initiatives[0]!.features_completed).toBe(2);
	});

	it("sets initiative to in_progress when some features completed", () => {
		const features = [
			createFeature({
				id: "S1.I1.F1",
				initiative_id: "S1.I1",
				status: "completed",
			}),
			createFeature({
				id: "S1.I1.F2",
				initiative_id: "S1.I1",
				status: "pending",
			}),
		];
		const manifest = createManifest(features, [
			{ id: "S1.I1", feature_count: 2, status: "pending" },
		]);

		updateInitiativeStatusFromFeatures("S1.I1", manifest);

		expect(manifest.initiatives[0]!.status).toBe("in_progress");
		expect(manifest.initiatives[0]!.features_completed).toBe(1);
	});

	it("does nothing for unknown initiative ID", () => {
		const manifest = createManifest([], [{ id: "S1.I1" }]);

		updateInitiativeStatusFromFeatures("S1.I99", manifest);

		expect(manifest.initiatives[0]!.status).toBe("pending");
	});

	it("skips save when skipSave is true", () => {
		const features = [
			createFeature({
				id: "S1.I1.F1",
				initiative_id: "S1.I1",
				status: "completed",
			}),
		];
		const manifest = createManifest(features, [
			{ id: "S1.I1", feature_count: 1, status: "in_progress" },
		]);

		updateInitiativeStatusFromFeatures("S1.I1", manifest, true);

		expect(saveManifest).not.toHaveBeenCalled();
	});
});

describe("VALID_FEATURE_TRANSITIONS", () => {
	it("has no transitions out of completed (terminal)", () => {
		expect(VALID_FEATURE_TRANSITIONS.completed).toEqual([]);
	});

	it("allows failed -> pending (retry path)", () => {
		expect(VALID_FEATURE_TRANSITIONS.failed).toContain("pending");
	});

	it("allows blocked -> failed and blocked -> pending", () => {
		expect(VALID_FEATURE_TRANSITIONS.blocked).toContain("failed");
		expect(VALID_FEATURE_TRANSITIONS.blocked).toContain("pending");
	});
});

describe("VALID_INITIATIVE_TRANSITIONS", () => {
	it("has no transitions out of completed (terminal)", () => {
		expect(VALID_INITIATIVE_TRANSITIONS.completed).toEqual([]);
	});

	it("allows partial -> completed", () => {
		expect(VALID_INITIATIVE_TRANSITIONS.partial).toContain("completed");
	});
});
