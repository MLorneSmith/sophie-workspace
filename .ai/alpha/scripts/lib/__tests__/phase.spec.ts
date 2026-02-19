/**
 * Phase Module Unit Tests
 *
 * Tests for phase auto-generation, filtering, validation, and utility functions.
 * Feature #1961: Phase support (--phase, --base-branch)
 */

import { describe, expect, it } from "vitest";
import type {
	FeatureEntry,
	InitiativeEntry,
	PhaseDefinition,
	SpecManifest,
} from "../../types/index.js";
import {
	autoGeneratePhases,
	calculateDependencyDepth,
	filterManifestByPhase,
	getPhaseBranchName,
	getPhaseIds,
	validatePhase,
} from "../phase.js";

// ============================================================================
// Test Helpers
// ============================================================================

function createTestFeature(
	overrides: Partial<FeatureEntry> = {},
): FeatureEntry {
	return {
		id: overrides.id ?? "S1.I1.F1",
		initiative_id: overrides.initiative_id ?? "S1.I1",
		title: overrides.title ?? "Test Feature",
		priority: overrides.priority ?? 1,
		global_priority: overrides.global_priority ?? 1,
		status: overrides.status ?? "pending",
		tasks_file: overrides.tasks_file ?? "tasks.json",
		feature_dir: overrides.feature_dir ?? "/test",
		task_count: overrides.task_count ?? 5,
		tasks_completed: overrides.tasks_completed ?? 0,
		sequential_hours: overrides.sequential_hours ?? 4,
		parallel_hours: overrides.parallel_hours ?? 2,
		dependencies: overrides.dependencies ?? [],
		github_issue: overrides.github_issue ?? null,
		requires_database: overrides.requires_database ?? false,
		database_task_count: overrides.database_task_count ?? 0,
	};
}

function createTestInitiative(
	overrides: Partial<InitiativeEntry> = {},
): InitiativeEntry {
	return {
		id: overrides.id ?? "S1.I1",
		name: overrides.name ?? "Test Initiative",
		slug: overrides.slug ?? "test-initiative",
		priority: overrides.priority ?? 1,
		status: overrides.status ?? "pending",
		initiative_dir: overrides.initiative_dir ?? "/test",
		feature_count: overrides.feature_count ?? 3,
		features_completed: overrides.features_completed ?? 0,
		dependencies: overrides.dependencies ?? [],
	};
}

function createTestManifest(
	initiatives: InitiativeEntry[],
	features: FeatureEntry[],
	phases?: PhaseDefinition[],
): SpecManifest {
	return {
		metadata: {
			spec_id: "S1918",
			spec_name: "Test Spec",
			generated_at: new Date().toISOString(),
			spec_dir: "/test/spec",
			research_dir: "/test/research",
		},
		initiatives,
		feature_queue: features,
		phases,
		progress: {
			status: "pending",
			initiatives_completed: 0,
			initiatives_total: initiatives.length,
			features_completed: 0,
			features_total: features.length,
			tasks_completed: 0,
			tasks_total: features.reduce((sum, f) => sum + f.task_count, 0),
			next_feature_id: features[0]?.id ?? null,
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

// ============================================================================
// autoGeneratePhases Tests
// ============================================================================

describe("autoGeneratePhases", () => {
	it("groups 6 initiatives into phases respecting MAX_FEATURES_PER_PHASE", () => {
		// 6 initiatives: I1 (3 features), I2 (4 features), I3 (3 features),
		// I4 (3 features), I5 (2 features), I6 (3 features) = 18 total
		const initiatives = [
			createTestInitiative({ id: "S1918.I1", priority: 1, feature_count: 3 }),
			createTestInitiative({ id: "S1918.I2", priority: 2, feature_count: 4 }),
			createTestInitiative({ id: "S1918.I3", priority: 3, feature_count: 3 }),
			createTestInitiative({ id: "S1918.I4", priority: 4, feature_count: 3 }),
			createTestInitiative({ id: "S1918.I5", priority: 5, feature_count: 2 }),
			createTestInitiative({ id: "S1918.I6", priority: 6, feature_count: 3 }),
		];

		const features: FeatureEntry[] = [];
		// I1: 3 features
		for (let f = 1; f <= 3; f++) {
			features.push(
				createTestFeature({
					id: `S1918.I1.F${f}`,
					initiative_id: "S1918.I1",
					task_count: 5,
				}),
			);
		}
		// I2: 4 features
		for (let f = 1; f <= 4; f++) {
			features.push(
				createTestFeature({
					id: `S1918.I2.F${f}`,
					initiative_id: "S1918.I2",
					task_count: 5,
				}),
			);
		}
		// I3: 3 features
		for (let f = 1; f <= 3; f++) {
			features.push(
				createTestFeature({
					id: `S1918.I3.F${f}`,
					initiative_id: "S1918.I3",
					task_count: 5,
				}),
			);
		}
		// I4: 3 features
		for (let f = 1; f <= 3; f++) {
			features.push(
				createTestFeature({
					id: `S1918.I4.F${f}`,
					initiative_id: "S1918.I4",
					task_count: 5,
				}),
			);
		}
		// I5: 2 features
		for (let f = 1; f <= 2; f++) {
			features.push(
				createTestFeature({
					id: `S1918.I5.F${f}`,
					initiative_id: "S1918.I5",
					task_count: 5,
				}),
			);
		}
		// I6: 3 features
		for (let f = 1; f <= 3; f++) {
			features.push(
				createTestFeature({
					id: `S1918.I6.F${f}`,
					initiative_id: "S1918.I6",
					task_count: 5,
				}),
			);
		}

		const manifest = createTestManifest(initiatives, features);
		const phases = autoGeneratePhases(manifest);

		// Should produce 2-3 phases, each with <= 10 features
		expect(phases.length).toBeGreaterThanOrEqual(2);
		for (const phase of phases) {
			expect(phase.feature_count).toBeLessThanOrEqual(10);
		}

		// Total features across all phases should equal 18
		const totalFeatures = phases.reduce(
			(sum, p) => sum + p.feature_count,
			0,
		);
		expect(totalFeatures).toBe(18);

		// Phase IDs should be P1, P2, ...
		expect(phases[0]?.id).toBe("P1");
		expect(phases[1]?.id).toBe("P2");
	});

	it("single initiative produces single phase", () => {
		const initiatives = [
			createTestInitiative({ id: "S1.I1", priority: 1, feature_count: 3 }),
		];
		const features = [
			createTestFeature({ id: "S1.I1.F1", initiative_id: "S1.I1" }),
			createTestFeature({ id: "S1.I1.F2", initiative_id: "S1.I1" }),
			createTestFeature({ id: "S1.I1.F3", initiative_id: "S1.I1" }),
		];

		const manifest = createTestManifest(initiatives, features);
		const phases = autoGeneratePhases(manifest);

		expect(phases).toHaveLength(1);
		expect(phases[0]?.id).toBe("P1");
		expect(phases[0]?.feature_count).toBe(3);
		expect(phases[0]?.initiative_ids).toEqual(["S1.I1"]);
	});

	it("all initiatives fit in one phase when under limit", () => {
		const initiatives = [
			createTestInitiative({ id: "S1.I1", priority: 1 }),
			createTestInitiative({ id: "S1.I2", priority: 2 }),
		];
		const features = [
			createTestFeature({ id: "S1.I1.F1", initiative_id: "S1.I1" }),
			createTestFeature({ id: "S1.I2.F1", initiative_id: "S1.I2" }),
		];

		const manifest = createTestManifest(initiatives, features);
		const phases = autoGeneratePhases(manifest);

		expect(phases).toHaveLength(1);
		expect(phases[0]?.initiative_ids).toEqual(["S1.I1", "S1.I2"]);
	});

	it("splits when initiative would exceed feature limit", () => {
		// I1 has 8 features, I2 has 4 features → must split
		const initiatives = [
			createTestInitiative({ id: "S1.I1", priority: 1 }),
			createTestInitiative({ id: "S1.I2", priority: 2 }),
		];
		const features: FeatureEntry[] = [];
		for (let f = 1; f <= 8; f++) {
			features.push(
				createTestFeature({ id: `S1.I1.F${f}`, initiative_id: "S1.I1" }),
			);
		}
		for (let f = 1; f <= 4; f++) {
			features.push(
				createTestFeature({ id: `S1.I2.F${f}`, initiative_id: "S1.I2" }),
			);
		}

		const manifest = createTestManifest(initiatives, features);
		const phases = autoGeneratePhases(manifest);

		expect(phases).toHaveLength(2);
		expect(phases[0]?.initiative_ids).toEqual(["S1.I1"]);
		expect(phases[0]?.feature_count).toBe(8);
		expect(phases[1]?.initiative_ids).toEqual(["S1.I2"]);
		expect(phases[1]?.feature_count).toBe(4);
	});

	it("handles empty manifest gracefully", () => {
		const manifest = createTestManifest([], []);
		const phases = autoGeneratePhases(manifest);
		expect(phases).toHaveLength(0);
	});
});

// ============================================================================
// filterManifestByPhase Tests
// ============================================================================

describe("filterManifestByPhase", () => {
	const initiatives = [
		createTestInitiative({ id: "S1.I1", priority: 1 }),
		createTestInitiative({ id: "S1.I2", priority: 2 }),
		createTestInitiative({ id: "S1.I3", priority: 3 }),
	];

	const features = [
		createTestFeature({
			id: "S1.I1.F1",
			initiative_id: "S1.I1",
			task_count: 5,
		}),
		createTestFeature({
			id: "S1.I1.F2",
			initiative_id: "S1.I1",
			task_count: 3,
		}),
		createTestFeature({
			id: "S1.I2.F1",
			initiative_id: "S1.I2",
			task_count: 4,
			dependencies: ["S1.I1"],
		}),
		createTestFeature({
			id: "S1.I3.F1",
			initiative_id: "S1.I3",
			task_count: 6,
			dependencies: ["S1.I2.F1"],
		}),
	];

	const phases: PhaseDefinition[] = [
		{
			id: "P1",
			name: "Phase 1",
			initiative_ids: ["S1.I1"],
			feature_count: 2,
			task_count: 8,
		},
		{
			id: "P2",
			name: "Phase 2",
			initiative_ids: ["S1.I2"],
			feature_count: 1,
			task_count: 4,
		},
		{
			id: "P3",
			name: "Phase 3",
			initiative_ids: ["S1.I3"],
			feature_count: 1,
			task_count: 6,
		},
	];

	it("P1 filter returns only I1 features", () => {
		const manifest = createTestManifest(initiatives, features, phases);
		const filtered = filterManifestByPhase(manifest, "P1");

		expect(filtered.feature_queue).toHaveLength(2);
		expect(filtered.feature_queue.map((f) => f.id)).toEqual([
			"S1.I1.F1",
			"S1.I1.F2",
		]);
		expect(filtered.initiatives).toHaveLength(1);
		expect(filtered.progress.features_total).toBe(2);
		expect(filtered.progress.tasks_total).toBe(8);
	});

	it("P2 filter returns only I2 features with earlier deps removed", () => {
		const manifest = createTestManifest(initiatives, features, phases);
		const filtered = filterManifestByPhase(manifest, "P2");

		expect(filtered.feature_queue).toHaveLength(1);
		expect(filtered.feature_queue[0]?.id).toBe("S1.I2.F1");
		// Dependency on S1.I1 (earlier phase) should be removed
		expect(filtered.feature_queue[0]?.dependencies).toEqual([]);
	});

	it("P3 filter removes cross-phase feature dependencies", () => {
		const manifest = createTestManifest(initiatives, features, phases);
		const filtered = filterManifestByPhase(manifest, "P3");

		expect(filtered.feature_queue).toHaveLength(1);
		expect(filtered.feature_queue[0]?.id).toBe("S1.I3.F1");
		// Dependency on S1.I2.F1 (earlier phase) should be removed
		expect(filtered.feature_queue[0]?.dependencies).toEqual([]);
	});

	it("throws error for invalid phase", () => {
		const manifest = createTestManifest(initiatives, features, phases);
		expect(() => filterManifestByPhase(manifest, "P99")).toThrow(
			'Phase "P99" not found',
		);
	});

	it("throws error when no phases defined", () => {
		const manifest = createTestManifest(initiatives, features);
		expect(() => filterManifestByPhase(manifest, "P1")).toThrow(
			"No phases defined",
		);
	});
});

// ============================================================================
// validatePhase Tests
// ============================================================================

describe("validatePhase", () => {
	it("valid phase passes validation", () => {
		const initiatives = [
			createTestInitiative({ id: "S1.I1", priority: 1 }),
		];
		const features = [
			createTestFeature({
				id: "S1.I1.F1",
				initiative_id: "S1.I1",
				task_count: 5,
			}),
			createTestFeature({
				id: "S1.I1.F2",
				initiative_id: "S1.I1",
				task_count: 3,
			}),
		];
		const phases: PhaseDefinition[] = [
			{
				id: "P1",
				name: "Phase 1",
				initiative_ids: ["S1.I1"],
				feature_count: 2,
				task_count: 8,
			},
		];

		const manifest = createTestManifest(initiatives, features, phases);
		const result = validatePhase(manifest, "P1");

		expect(result.valid).toBe(true);
		expect(result.errors).toHaveLength(0);
	});

	it("rejects phase exceeding feature count", () => {
		const initiatives = [
			createTestInitiative({ id: "S1.I1", priority: 1 }),
		];
		const features: FeatureEntry[] = [];
		for (let f = 1; f <= 12; f++) {
			features.push(
				createTestFeature({
					id: `S1.I1.F${f}`,
					initiative_id: "S1.I1",
					task_count: 5,
				}),
			);
		}
		const phases: PhaseDefinition[] = [
			{
				id: "P1",
				name: "Phase 1",
				initiative_ids: ["S1.I1"],
				feature_count: 12,
				task_count: 60,
			},
		];

		const manifest = createTestManifest(initiatives, features, phases);
		const result = validatePhase(manifest, "P1");

		expect(result.valid).toBe(false);
		expect(result.errors.some((e) => e.includes("12 features"))).toBe(true);
	});

	it("rejects phase exceeding task count", () => {
		const initiatives = [
			createTestInitiative({ id: "S1.I1", priority: 1 }),
		];
		const features = [
			createTestFeature({
				id: "S1.I1.F1",
				initiative_id: "S1.I1",
				task_count: 60,
			}),
			createTestFeature({
				id: "S1.I1.F2",
				initiative_id: "S1.I1",
				task_count: 50,
			}),
		];
		const phases: PhaseDefinition[] = [
			{
				id: "P1",
				name: "Phase 1",
				initiative_ids: ["S1.I1"],
				feature_count: 2,
				task_count: 110,
			},
		];

		const manifest = createTestManifest(initiatives, features, phases);
		const result = validatePhase(manifest, "P1");

		expect(result.valid).toBe(false);
		expect(result.errors.some((e) => e.includes("110 tasks"))).toBe(true);
	});

	it("rejects phase exceeding dependency depth", () => {
		const initiatives = [
			createTestInitiative({ id: "S1.I1", priority: 1 }),
		];
		// Create a chain of 7 features (depth 6, exceeds MAX_DEPENDENCY_DEPTH=5)
		const features: FeatureEntry[] = [];
		for (let f = 1; f <= 7; f++) {
			features.push(
				createTestFeature({
					id: `S1.I1.F${f}`,
					initiative_id: "S1.I1",
					task_count: 3,
					dependencies: f > 1 ? [`S1.I1.F${f - 1}`] : [],
				}),
			);
		}
		const phases: PhaseDefinition[] = [
			{
				id: "P1",
				name: "Phase 1",
				initiative_ids: ["S1.I1"],
				feature_count: 7,
				task_count: 21,
			},
		];

		const manifest = createTestManifest(initiatives, features, phases);
		const result = validatePhase(manifest, "P1");

		expect(result.valid).toBe(false);
		expect(result.errors.some((e) => e.includes("dependency depth"))).toBe(
			true,
		);
	});

	it("rejects dependencies on later phase", () => {
		const initiatives = [
			createTestInitiative({ id: "S1.I1", priority: 1 }),
			createTestInitiative({ id: "S1.I2", priority: 2 }),
		];
		const features = [
			createTestFeature({
				id: "S1.I1.F1",
				initiative_id: "S1.I1",
				task_count: 3,
				dependencies: ["S1.I2.F1"], // Depends on later phase!
			}),
			createTestFeature({
				id: "S1.I2.F1",
				initiative_id: "S1.I2",
				task_count: 3,
			}),
		];
		const phases: PhaseDefinition[] = [
			{
				id: "P1",
				name: "Phase 1",
				initiative_ids: ["S1.I1"],
				feature_count: 1,
				task_count: 3,
			},
			{
				id: "P2",
				name: "Phase 2",
				initiative_ids: ["S1.I2"],
				feature_count: 1,
				task_count: 3,
			},
		];

		const manifest = createTestManifest(initiatives, features, phases);
		const result = validatePhase(manifest, "P1");

		expect(result.valid).toBe(false);
		expect(result.errors.some((e) => e.includes("later phase"))).toBe(true);
	});

	it("returns error for non-existent phase", () => {
		const manifest = createTestManifest([], [], []);
		const result = validatePhase(manifest, "P99");

		expect(result.valid).toBe(false);
	});
});

// ============================================================================
// getPhaseBranchName Tests
// ============================================================================

describe("getPhaseBranchName", () => {
	it("returns standard phase branch name", () => {
		expect(getPhaseBranchName("S1918", "P1")).toBe("alpha/spec-S1918-P1");
	});

	it("handles numeric spec IDs", () => {
		expect(getPhaseBranchName("1918", "P2")).toBe("alpha/spec-1918-P2");
	});
});

// ============================================================================
// getPhaseIds Tests
// ============================================================================

describe("getPhaseIds", () => {
	it("returns phase IDs from manifest", () => {
		const phases: PhaseDefinition[] = [
			{
				id: "P1",
				name: "Phase 1",
				initiative_ids: [],
				feature_count: 0,
				task_count: 0,
			},
			{
				id: "P2",
				name: "Phase 2",
				initiative_ids: [],
				feature_count: 0,
				task_count: 0,
			},
		];
		const manifest = createTestManifest([], [], phases);
		expect(getPhaseIds(manifest)).toEqual(["P1", "P2"]);
	});

	it("returns empty array when no phases", () => {
		const manifest = createTestManifest([], []);
		expect(getPhaseIds(manifest)).toEqual([]);
	});
});

// ============================================================================
// calculateDependencyDepth Tests
// ============================================================================

describe("calculateDependencyDepth", () => {
	it("returns 0 for no dependencies", () => {
		const features = [
			createTestFeature({ id: "F1" }),
			createTestFeature({ id: "F2" }),
		];
		expect(calculateDependencyDepth(features)).toBe(0);
	});

	it("returns correct depth for linear chain", () => {
		// F1 -> F2 -> F3 -> F4 (depth = 3)
		const features = [
			createTestFeature({ id: "F1", dependencies: [] }),
			createTestFeature({ id: "F2", dependencies: ["F1"] }),
			createTestFeature({ id: "F3", dependencies: ["F2"] }),
			createTestFeature({ id: "F4", dependencies: ["F3"] }),
		];
		expect(calculateDependencyDepth(features)).toBe(3);
	});

	it("returns correct depth for diamond pattern", () => {
		// F1 -> F2, F1 -> F3, F2 -> F4, F3 -> F4 (depth = 2)
		const features = [
			createTestFeature({ id: "F1", dependencies: [] }),
			createTestFeature({ id: "F2", dependencies: ["F1"] }),
			createTestFeature({ id: "F3", dependencies: ["F1"] }),
			createTestFeature({ id: "F4", dependencies: ["F2", "F3"] }),
		];
		expect(calculateDependencyDepth(features)).toBe(2);
	});

	it("ignores dependencies outside the feature set", () => {
		const features = [
			createTestFeature({ id: "F1", dependencies: ["EXTERNAL"] }),
			createTestFeature({ id: "F2", dependencies: ["F1"] }),
		];
		expect(calculateDependencyDepth(features)).toBe(1);
	});

	it("handles single feature with no deps", () => {
		const features = [createTestFeature({ id: "F1" })];
		expect(calculateDependencyDepth(features)).toBe(0);
	});

	it("handles empty feature queue", () => {
		expect(calculateDependencyDepth([])).toBe(0);
	});
});
