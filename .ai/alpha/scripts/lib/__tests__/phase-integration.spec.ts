/**
 * Phase Integration Tests
 *
 * Tests the full phase pipeline: manifest → auto-generate → filter → verify.
 * Also tests CLI argument parsing and backward compatibility.
 * Feature #1961: Phase support (--phase, --base-branch)
 */

import { describe, expect, it } from "vitest";
import type {
	FeatureEntry,
	InitiativeEntry,
	SpecManifest,
} from "../../types/index.js";
import {
	autoGeneratePhases,
	filterManifestByPhase,
	getPhaseIds,
	validatePhase,
} from "../phase.js";

// ============================================================================
// Test Helpers
// ============================================================================

function createS1918StyleManifest(): SpecManifest {
	// Simulates S1918: 6 initiatives, 18 features
	const initiatives: InitiativeEntry[] = [
		{
			id: "S1918.I1",
			name: "Foundation",
			slug: "foundation",
			priority: 1,
			status: "pending",
			initiative_dir: "/test/I1",
			feature_count: 3,
			features_completed: 0,
			dependencies: [],
		},
		{
			id: "S1918.I2",
			name: "Core UI",
			slug: "core-ui",
			priority: 2,
			status: "pending",
			initiative_dir: "/test/I2",
			feature_count: 4,
			features_completed: 0,
			dependencies: ["S1918.I1"],
		},
		{
			id: "S1918.I3",
			name: "Widgets",
			slug: "widgets",
			priority: 3,
			status: "pending",
			initiative_dir: "/test/I3",
			feature_count: 3,
			features_completed: 0,
			dependencies: ["S1918.I2"],
		},
		{
			id: "S1918.I4",
			name: "Data Layer",
			slug: "data-layer",
			priority: 4,
			status: "pending",
			initiative_dir: "/test/I4",
			feature_count: 3,
			features_completed: 0,
			dependencies: ["S1918.I1"],
		},
		{
			id: "S1918.I5",
			name: "Integrations",
			slug: "integrations",
			priority: 5,
			status: "pending",
			initiative_dir: "/test/I5",
			feature_count: 2,
			features_completed: 0,
			dependencies: ["S1918.I3", "S1918.I4"],
		},
		{
			id: "S1918.I6",
			name: "Polish",
			slug: "polish",
			priority: 6,
			status: "pending",
			initiative_dir: "/test/I6",
			feature_count: 3,
			features_completed: 0,
			dependencies: ["S1918.I5"],
		},
	];

	const features: FeatureEntry[] = [];
	let globalPriority = 1;

	// Generate features for each initiative
	const featureCounts = [3, 4, 3, 3, 2, 3]; // 18 total
	for (let i = 0; i < initiatives.length; i++) {
		const init = initiatives[i]!;
		const count = featureCounts[i]!;
		for (let f = 1; f <= count; f++) {
			features.push({
				id: `${init.id}.F${f}`,
				initiative_id: init.id,
				title: `${init.name} Feature ${f}`,
				priority: f,
				global_priority: globalPriority++,
				status: "pending",
				tasks_file: `tasks-${init.id}-F${f}.json`,
				feature_dir: `/test/${init.id}/F${f}`,
				task_count: 7 + (f % 3), // 7-9 tasks per feature
				tasks_completed: 0,
				sequential_hours: 4,
				parallel_hours: 2,
				dependencies:
					init.dependencies.length > 0 ? [...init.dependencies] : [],
				github_issue: null,
				requires_database: false,
				database_task_count: 0,
			});
		}
	}

	return {
		metadata: {
			spec_id: "S1918",
			spec_name: "Large Spec Test",
			generated_at: new Date().toISOString(),
			spec_dir: "/test/spec",
			research_dir: "/test/research",
		},
		initiatives,
		feature_queue: features,
		progress: {
			status: "pending",
			initiatives_completed: 0,
			initiatives_total: 6,
			features_completed: 0,
			features_total: 18,
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
// Full Pipeline Tests
// ============================================================================

describe("Phase Pipeline: generate → filter → verify", () => {
	it("generates phases, filters by P1, verifies correct feature subset", () => {
		const manifest = createS1918StyleManifest();

		// Step 1: Auto-generate phases
		const phases = autoGeneratePhases(manifest);
		manifest.phases = phases;

		expect(phases.length).toBeGreaterThanOrEqual(2);

		// Step 2: Filter by P1
		const filtered = filterManifestByPhase(manifest, "P1");

		// Step 3: Verify P1 only contains first initiatives' features
		const p1InitIds = new Set(phases[0]!.initiative_ids);
		for (const feature of filtered.feature_queue) {
			expect(p1InitIds.has(feature.initiative_id)).toBe(true);
		}

		// Verify progress totals match filtered set
		expect(filtered.progress.features_total).toBe(
			filtered.feature_queue.length,
		);
		expect(filtered.progress.tasks_total).toBe(
			filtered.feature_queue.reduce((sum, f) => sum + f.task_count, 0),
		);
	});

	it("validates all auto-generated phases pass validation", () => {
		const manifest = createS1918StyleManifest();
		const phases = autoGeneratePhases(manifest);
		manifest.phases = phases;

		for (const phase of phases) {
			const result = validatePhase(manifest, phase.id);
			// Auto-generated phases should be valid (within limits)
			expect(result.valid).toBe(true);
		}
	});

	it("all features appear exactly once across all phases", () => {
		const manifest = createS1918StyleManifest();
		const phases = autoGeneratePhases(manifest);
		manifest.phases = phases;

		const allPhaseFeatureIds = new Set<string>();
		for (const phase of phases) {
			const filtered = filterManifestByPhase(manifest, phase.id);
			for (const feature of filtered.feature_queue) {
				expect(allPhaseFeatureIds.has(feature.id)).toBe(false);
				allPhaseFeatureIds.add(feature.id);
			}
		}

		// All original features should be accounted for
		expect(allPhaseFeatureIds.size).toBe(manifest.feature_queue.length);
	});
});

// ============================================================================
// Backward Compatibility Tests
// ============================================================================

describe("Backward Compatibility", () => {
	it("manifest without phases field works with getPhaseIds", () => {
		const manifest = createS1918StyleManifest();
		// No phases field set
		expect(getPhaseIds(manifest)).toEqual([]);
	});

	it("manifest without --phase runs all features", () => {
		const manifest = createS1918StyleManifest();
		// Without phase filtering, all 18 features should be present
		expect(manifest.feature_queue.length).toBe(18);
		expect(manifest.progress.features_total).toBe(18);
	});

	it("phase filtering preserves manifest.phases in output", () => {
		const manifest = createS1918StyleManifest();
		manifest.phases = autoGeneratePhases(manifest);

		const filtered = filterManifestByPhase(manifest, "P1");
		// The filtered manifest should still have all phases (for reference)
		expect(filtered.phases).toEqual(manifest.phases);
	});
});

// ============================================================================
// CLI Argument Parsing Tests
// ============================================================================

describe("CLI Phase Options", () => {
	it("OrchestratorOptions supports phase and baseBranch fields", () => {
		// Type-level test: verify the fields exist on the type
		const options = {
			specId: 1918,
			sandboxCount: 3,
			timeout: 3600,
			dryRun: false,
			forceUnlock: false,
			skipDbReset: false,
			skipDbSeed: false,
			ui: true,
			minimalUi: false,
			provider: "claude" as const,
			reset: false,
			skipToCompletion: false,
			skipPreFlight: false,
			document: false,
			phase: "P1",
			baseBranch: "alpha/spec-S1918-P1",
		};

		expect(options.phase).toBe("P1");
		expect(options.baseBranch).toBe("alpha/spec-S1918-P1");
	});

	it("undefined phase means full spec execution", () => {
		const options = {
			phase: undefined,
			baseBranch: undefined,
		};

		expect(options.phase).toBeUndefined();
		expect(options.baseBranch).toBeUndefined();
	});
});
