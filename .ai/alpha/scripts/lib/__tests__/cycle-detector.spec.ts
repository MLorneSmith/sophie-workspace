/**
 * Cycle Detector Unit Tests
 *
 * Tests for circular dependency detection functions.
 * Bug fix #1916: Alpha Orchestrator Circular Dependency Hang
 */

import { describe, expect, it } from "vitest";

import type { FeatureEntry, InitiativeEntry } from "../../types/index.js";
import {
	detectAllCycles,
	detectDirectCycles,
	detectIndirectCycles,
	detectSelfReferences,
	formatCycleError,
	hasSelfReference,
	validateDependencyGraph,
	validateInitiativeDependencies,
} from "../cycle-detector.js";

// ============================================================================
// Test Fixtures
// ============================================================================

/**
 * Create a mock FeatureEntry for testing.
 */
function createFeature(id: string, dependencies: string[] = []): FeatureEntry {
	return {
		id,
		initiative_id: id.split(".").slice(0, 2).join("."),
		title: `Feature ${id}`,
		priority: 1,
		global_priority: 1,
		status: "pending",
		tasks_file: `${id}/tasks.json`,
		feature_dir: `/path/to/${id}`,
		task_count: 3,
		tasks_completed: 0,
		sequential_hours: 1,
		parallel_hours: 0.5,
		dependencies,
		github_issue: null,
		requires_database: false,
		database_task_count: 0,
	};
}

/**
 * Create a mock InitiativeEntry for testing.
 */
function createInitiative(
	id: string,
	dependencies: string[] = [],
): InitiativeEntry {
	return {
		id,
		name: `Initiative ${id}`,
		slug: id.toLowerCase().replace(/\./g, "-"),
		priority: 1,
		status: "pending",
		initiative_dir: `/path/to/${id}`,
		feature_count: 3,
		features_completed: 0,
		dependencies,
	};
}

// ============================================================================
// Self-Reference Detection Tests
// ============================================================================

describe("detectSelfReferences", () => {
	it("should detect a feature that depends on itself", () => {
		const features = [
			createFeature("S1890.I5.F2", [
				"S1890.I1.F1",
				"S1890.I2.F1",
				"S1890.I5.F2", // Self-reference
			]),
		];

		const cycles = detectSelfReferences(features);

		expect(cycles).toHaveLength(1);
		expect(cycles[0]).toMatchObject({
			type: "self-reference",
			path: ["S1890.I5.F2"],
		});
	});

	it("should detect multiple self-references in different features", () => {
		const features = [
			createFeature("S1890.I1.F1", ["S1890.I1.F1"]), // Self-reference
			createFeature("S1890.I1.F2", []),
			createFeature("S1890.I2.F1", ["S1890.I1.F1", "S1890.I2.F1"]), // Self-reference
		];

		const cycles = detectSelfReferences(features);

		expect(cycles).toHaveLength(2);
		expect(cycles.map((c) => c.path[0]).sort()).toEqual([
			"S1890.I1.F1",
			"S1890.I2.F1",
		]);
	});

	it("should return empty array when no self-references exist", () => {
		const features = [
			createFeature("S1890.I1.F1", []),
			createFeature("S1890.I1.F2", ["S1890.I1.F1"]),
			createFeature("S1890.I2.F1", ["S1890.I1.F1", "S1890.I1.F2"]),
		];

		const cycles = detectSelfReferences(features);

		expect(cycles).toHaveLength(0);
	});

	it("should handle features with empty dependencies", () => {
		const features = [
			createFeature("S1890.I1.F1", []),
			createFeature("S1890.I1.F2", []),
		];

		const cycles = detectSelfReferences(features);

		expect(cycles).toHaveLength(0);
	});
});

// ============================================================================
// hasSelfReference Quick Check Tests
// ============================================================================

describe("hasSelfReference", () => {
	it("should return true for self-referential feature", () => {
		const feature = createFeature("S1890.I5.F2", [
			"S1890.I1.F1",
			"S1890.I5.F2",
		]);
		expect(hasSelfReference(feature)).toBe(true);
	});

	it("should return false for non-self-referential feature", () => {
		const feature = createFeature("S1890.I5.F2", [
			"S1890.I1.F1",
			"S1890.I2.F1",
		]);
		expect(hasSelfReference(feature)).toBe(false);
	});

	it("should return false for feature with no dependencies", () => {
		const feature = createFeature("S1890.I1.F1", []);
		expect(hasSelfReference(feature)).toBe(false);
	});
});

// ============================================================================
// Direct Cycle Detection Tests
// ============================================================================

describe("detectDirectCycles", () => {
	it("should detect bidirectional dependency (A ↔ B)", () => {
		const features = [
			createFeature("S1890.I1.F1", ["S1890.I1.F2"]),
			createFeature("S1890.I1.F2", ["S1890.I1.F1"]),
		];

		const cycles = detectDirectCycles(features);

		expect(cycles).toHaveLength(1);
		const cycle = cycles[0];
		expect(cycle).toBeDefined();
		expect(cycle).toMatchObject({
			type: "direct-cycle",
		});
		expect(cycle!.path).toContain("S1890.I1.F1");
		expect(cycle!.path).toContain("S1890.I1.F2");
	});

	it("should detect multiple direct cycles", () => {
		const features = [
			createFeature("S1890.I1.F1", ["S1890.I1.F2"]),
			createFeature("S1890.I1.F2", ["S1890.I1.F1"]),
			createFeature("S1890.I2.F1", ["S1890.I2.F2"]),
			createFeature("S1890.I2.F2", ["S1890.I2.F1"]),
		];

		const cycles = detectDirectCycles(features);

		expect(cycles).toHaveLength(2);
	});

	it("should not report direct cycles for self-references", () => {
		const features = [
			createFeature("S1890.I1.F1", ["S1890.I1.F1"]), // Self-reference, not direct cycle
		];

		const cycles = detectDirectCycles(features);

		expect(cycles).toHaveLength(0);
	});

	it("should return empty array when no direct cycles exist", () => {
		const features = [
			createFeature("S1890.I1.F1", []),
			createFeature("S1890.I1.F2", ["S1890.I1.F1"]),
			createFeature("S1890.I1.F3", ["S1890.I1.F2"]),
		];

		const cycles = detectDirectCycles(features);

		expect(cycles).toHaveLength(0);
	});

	it("should handle one-way dependencies correctly", () => {
		const features = [
			createFeature("S1890.I1.F1", ["S1890.I1.F2"]),
			createFeature("S1890.I1.F2", []), // F2 does NOT depend on F1
		];

		const cycles = detectDirectCycles(features);

		expect(cycles).toHaveLength(0);
	});
});

// ============================================================================
// Indirect Cycle Detection Tests
// ============================================================================

describe("detectIndirectCycles", () => {
	it("should detect 3-node cycle (A → B → C → A)", () => {
		const features = [
			createFeature("S1890.I1.F1", ["S1890.I1.F3"]),
			createFeature("S1890.I1.F2", ["S1890.I1.F1"]),
			createFeature("S1890.I1.F3", ["S1890.I1.F2"]),
		];

		const cycles = detectIndirectCycles(features);

		// Should find at least one indirect cycle
		expect(cycles.length).toBeGreaterThanOrEqual(1);
		expect(cycles[0]?.type).toBe("indirect-cycle");
	});

	it("should detect 4-node cycle (A → B → C → D → A)", () => {
		const features = [
			createFeature("S1890.I1.F1", ["S1890.I1.F4"]),
			createFeature("S1890.I1.F2", ["S1890.I1.F1"]),
			createFeature("S1890.I1.F3", ["S1890.I1.F2"]),
			createFeature("S1890.I1.F4", ["S1890.I1.F3"]),
		];

		const cycles = detectIndirectCycles(features);

		expect(cycles.length).toBeGreaterThanOrEqual(1);
	});

	it("should not report self-references as indirect cycles", () => {
		const features = [createFeature("S1890.I1.F1", ["S1890.I1.F1"])];

		const cycles = detectIndirectCycles(features);

		// Self-references should be caught by detectSelfReferences, not here
		expect(cycles).toHaveLength(0);
	});

	it("should not report direct cycles as indirect cycles", () => {
		const features = [
			createFeature("S1890.I1.F1", ["S1890.I1.F2"]),
			createFeature("S1890.I1.F2", ["S1890.I1.F1"]),
		];

		const cycles = detectIndirectCycles(features);

		// 2-node cycles are direct cycles, not indirect
		expect(cycles).toHaveLength(0);
	});

	it("should return empty array for valid DAG", () => {
		const features = [
			createFeature("S1890.I1.F1", []),
			createFeature("S1890.I1.F2", ["S1890.I1.F1"]),
			createFeature("S1890.I1.F3", ["S1890.I1.F1", "S1890.I1.F2"]),
			createFeature("S1890.I2.F1", ["S1890.I1.F3"]),
		];

		const cycles = detectIndirectCycles(features);

		expect(cycles).toHaveLength(0);
	});

	it("should handle external dependencies gracefully", () => {
		// External dependency (S1889.I1.F1) doesn't exist in the feature set
		const features = [
			createFeature("S1890.I1.F1", ["S1889.I1.F1"]), // External dep
			createFeature("S1890.I1.F2", ["S1890.I1.F1"]),
		];

		// Should not crash or treat external dep as a cycle
		const cycles = detectIndirectCycles(features);
		expect(cycles).toHaveLength(0);
	});
});

// ============================================================================
// Combined Detection Tests
// ============================================================================

describe("detectAllCycles", () => {
	it("should detect all types of cycles in one pass", () => {
		const features = [
			createFeature("S1890.I1.F1", ["S1890.I1.F1"]), // Self-reference
			createFeature("S1890.I2.F1", ["S1890.I2.F2"]), // Part of direct cycle
			createFeature("S1890.I2.F2", ["S1890.I2.F1"]), // Part of direct cycle
			createFeature("S1890.I3.F1", ["S1890.I3.F3"]), // Part of indirect cycle
			createFeature("S1890.I3.F2", ["S1890.I3.F1"]),
			createFeature("S1890.I3.F3", ["S1890.I3.F2"]),
		];

		const result = detectAllCycles(features);

		expect(result.hasCycles).toBe(true);
		expect(result.cycles.length).toBeGreaterThanOrEqual(3); // At least 1 self + 1 direct + 1 indirect
		expect(result.errorMessage).not.toBeNull();
	});

	it("should return hasCycles: false for valid graph", () => {
		const features = [
			createFeature("S1890.I1.F1", []),
			createFeature("S1890.I1.F2", ["S1890.I1.F1"]),
			createFeature("S1890.I1.F3", ["S1890.I1.F2"]),
		];

		const result = detectAllCycles(features);

		expect(result.hasCycles).toBe(false);
		expect(result.cycles).toHaveLength(0);
		expect(result.errorMessage).toBeNull();
	});

	it("should handle empty feature array", () => {
		const result = detectAllCycles([]);

		expect(result.hasCycles).toBe(false);
		expect(result.cycles).toHaveLength(0);
	});
});

// ============================================================================
// Error Formatting Tests
// ============================================================================

describe("formatCycleError", () => {
	it("should format self-reference errors clearly", () => {
		const cycles = [
			{
				type: "self-reference" as const,
				path: ["S1890.I5.F2"],
				description: "Feature S1890.I5.F2 depends on itself",
			},
		];

		const message = formatCycleError(cycles);

		expect(message).toContain("CIRCULAR DEPENDENCY DETECTED");
		expect(message).toContain("Self-References");
		expect(message).toContain("S1890.I5.F2");
		expect(message).toContain("HOW TO FIX");
	});

	it("should format direct cycle errors clearly", () => {
		const cycles = [
			{
				type: "direct-cycle" as const,
				path: ["S1890.I1.F1", "S1890.I1.F2", "S1890.I1.F1"],
				description: "S1890.I1.F1 ↔ S1890.I1.F2 (bidirectional dependency)",
			},
		];

		const message = formatCycleError(cycles);

		expect(message).toContain("Direct Cycles");
		expect(message).toContain("bidirectional");
	});

	it("should format indirect cycle errors clearly", () => {
		const cycles = [
			{
				type: "indirect-cycle" as const,
				path: ["S1890.I1.F1", "S1890.I1.F2", "S1890.I1.F3", "S1890.I1.F1"],
				description:
					"Cycle: S1890.I1.F1 → S1890.I1.F2 → S1890.I1.F3 → S1890.I1.F1",
			},
		];

		const message = formatCycleError(cycles);

		expect(message).toContain("Indirect Cycles");
		expect(message).toContain("→");
	});

	it("should return empty string for no cycles", () => {
		const message = formatCycleError([]);
		expect(message).toBe("");
	});

	it("should include fix instructions", () => {
		const cycles = [
			{
				type: "self-reference" as const,
				path: ["S1890.I5.F2"],
				description: "Feature S1890.I5.F2 depends on itself",
			},
		];

		const message = formatCycleError(cycles);

		expect(message).toContain("regenerate the manifest");
		expect(message).toContain("generate-spec-manifest.ts");
	});
});

// ============================================================================
// Validation Function Tests
// ============================================================================

describe("validateDependencyGraph", () => {
	it("should return hasCycles: false for valid graph", () => {
		const features = [
			createFeature("S1890.I1.F1", []),
			createFeature("S1890.I1.F2", ["S1890.I1.F1"]),
		];

		// Use silent logger for tests
		const result = validateDependencyGraph(features, () => {});

		expect(result.hasCycles).toBe(false);
	});

	it("should detect S1890.I5.F2 bug scenario", () => {
		// Recreate the exact bug scenario from #1916
		const features = [
			createFeature("S1890.I1.F1", []),
			createFeature("S1890.I2.F1", ["S1890.I1.F1"]),
			createFeature("S1890.I2.F2", ["S1890.I2.F1"]),
			createFeature("S1890.I5.F1", ["S1890.I2.F1"]),
			createFeature("S1890.I5.F2", [
				"S1890.I1.F1",
				"S1890.I2.F1",
				"S1890.I2.F2",
				"S1890.I5.F1",
				"S1890.I5.F2", // THE BUG: Self-reference
			]),
		];

		const result = validateDependencyGraph(features, () => {});

		expect(result.hasCycles).toBe(true);
		expect(result.cycles.some((c) => c.type === "self-reference")).toBe(true);
		expect(result.cycles.some((c) => c.path.includes("S1890.I5.F2"))).toBe(
			true,
		);
	});
});

// ============================================================================
// Initiative Dependency Validation Tests
// ============================================================================

describe("validateInitiativeDependencies", () => {
	it("should detect initiative self-reference", () => {
		const initiatives = [
			createInitiative("S1890.I1", ["S1890.I1"]), // Self-reference
		];

		const cycles = validateInitiativeDependencies(initiatives);

		expect(cycles).toHaveLength(1);
		expect(cycles[0]?.type).toBe("self-reference");
	});

	it("should detect initiative direct cycle", () => {
		const initiatives = [
			createInitiative("S1890.I1", ["S1890.I2"]),
			createInitiative("S1890.I2", ["S1890.I1"]),
		];

		const cycles = validateInitiativeDependencies(initiatives);

		expect(cycles).toHaveLength(1);
		expect(cycles[0]?.type).toBe("direct-cycle");
	});

	it("should return empty for valid initiative graph", () => {
		const initiatives = [
			createInitiative("S1890.I1", []),
			createInitiative("S1890.I2", ["S1890.I1"]),
			createInitiative("S1890.I3", ["S1890.I1", "S1890.I2"]),
		];

		const cycles = validateInitiativeDependencies(initiatives);

		expect(cycles).toHaveLength(0);
	});
});

// ============================================================================
// Edge Case Tests
// ============================================================================

describe("edge cases", () => {
	it("should handle feature with only self-reference as dependency", () => {
		const features = [createFeature("S1890.I1.F1", ["S1890.I1.F1"])];

		const result = detectAllCycles(features);

		expect(result.hasCycles).toBe(true);
		expect(result.cycles).toHaveLength(1);
		expect(result.cycles[0]?.type).toBe("self-reference");
	});

	it("should handle disconnected components", () => {
		// Two separate chains with no connection
		const features = [
			// Chain 1
			createFeature("S1890.I1.F1", []),
			createFeature("S1890.I1.F2", ["S1890.I1.F1"]),
			// Chain 2 (disconnected)
			createFeature("S1890.I2.F1", []),
			createFeature("S1890.I2.F2", ["S1890.I2.F1"]),
		];

		const result = detectAllCycles(features);

		expect(result.hasCycles).toBe(false);
	});

	it("should handle complex valid DAG", () => {
		// Diamond pattern: F3 depends on F1 and F2, both depend on nothing
		const features = [
			createFeature("S1890.I1.F1", []),
			createFeature("S1890.I1.F2", []),
			createFeature("S1890.I1.F3", ["S1890.I1.F1", "S1890.I1.F2"]),
			createFeature("S1890.I1.F4", ["S1890.I1.F3"]),
		];

		const result = detectAllCycles(features);

		expect(result.hasCycles).toBe(false);
	});

	it("should handle feature with many dependencies but no cycles", () => {
		const features = [
			createFeature("S1890.I1.F1", []),
			createFeature("S1890.I1.F2", []),
			createFeature("S1890.I1.F3", []),
			createFeature("S1890.I1.F4", [
				"S1890.I1.F1",
				"S1890.I1.F2",
				"S1890.I1.F3",
			]),
		];

		const result = detectAllCycles(features);

		expect(result.hasCycles).toBe(false);
	});

	it("should handle numeric legacy IDs correctly", () => {
		// Legacy format uses numeric IDs
		const features = [
			{ ...createFeature("1367", []), initiative_id: "1365" },
			{ ...createFeature("1368", ["1367"]), initiative_id: "1365" },
			{ ...createFeature("1369", ["1368", "1369"]), initiative_id: "1365" }, // Self-reference
		];

		const result = detectAllCycles(features);

		expect(result.hasCycles).toBe(true);
		expect(result.cycles.some((c) => c.path.includes("1369"))).toBe(true);
	});
});
