/**
 * Cycle Detection Utility
 *
 * Provides cycle detection functions for validating dependency graphs
 * in spec manifests. Used by manifest generation, orchestrator pre-flight,
 * and work queue runtime guards to prevent circular dependencies.
 *
 * Bug fix for #1916: Alpha Orchestrator Circular Dependency Hang
 */

import type { FeatureEntry, InitiativeEntry } from "../types/index.js";

// ============================================================================
// Types
// ============================================================================

/**
 * Represents a detected dependency cycle.
 */
export interface DependencyCycle {
	/** Type of cycle detected */
	type: "self-reference" | "direct-cycle" | "indirect-cycle";
	/** IDs of features involved in the cycle, in order */
	path: string[];
	/** Human-readable description of the cycle */
	description: string;
}

/**
 * Result of cycle detection analysis.
 */
export interface CycleDetectionResult {
	/** Whether any cycles were detected */
	hasCycles: boolean;
	/** All detected cycles */
	cycles: DependencyCycle[];
	/** Formatted error message for user display */
	errorMessage: string | null;
}

// ============================================================================
// Self-Reference Detection
// ============================================================================

/**
 * Detect features that depend on themselves (self-references).
 *
 * This is the simplest form of circular dependency where a feature
 * lists itself in its own dependencies array.
 *
 * Example: S1890.I5.F2 depends on [S1890.I1.F1, S1890.I5.F2]
 *          ^^^^^^^^^^^^^^^^^ self-reference
 *
 * @param features - Array of feature entries to check
 * @returns Array of detected self-reference cycles
 */
export function detectSelfReferences(
	features: FeatureEntry[],
): DependencyCycle[] {
	const cycles: DependencyCycle[] = [];

	for (const feature of features) {
		if (feature.dependencies.includes(feature.id)) {
			cycles.push({
				type: "self-reference",
				path: [feature.id],
				description: `Feature ${feature.id} depends on itself`,
			});
		}
	}

	return cycles;
}

// ============================================================================
// Direct Cycle Detection
// ============================================================================

/**
 * Detect direct/bidirectional cycles between two features.
 *
 * A direct cycle occurs when two features depend on each other:
 * - Feature A depends on Feature B
 * - Feature B depends on Feature A
 *
 * Example: S1890.I1.F1 → S1890.I1.F2 → S1890.I1.F1
 *
 * @param features - Array of feature entries to check
 * @returns Array of detected direct cycles
 */
export function detectDirectCycles(
	features: FeatureEntry[],
): DependencyCycle[] {
	const cycles: DependencyCycle[] = [];
	const checked = new Set<string>();

	// Build a map of feature ID to feature for quick lookup
	const featureMap = new Map<string, FeatureEntry>();
	for (const feature of features) {
		featureMap.set(feature.id, feature);
	}

	for (const featureA of features) {
		for (const depId of featureA.dependencies) {
			// Skip if we've already checked this pair in reverse
			const pairKey = [featureA.id, depId].sort().join("->");
			if (checked.has(pairKey)) continue;
			checked.add(pairKey);

			// Skip self-references (handled separately)
			if (depId === featureA.id) continue;

			// Check if the dependency also depends on this feature
			const featureB = featureMap.get(depId);
			if (featureB && featureB.dependencies.includes(featureA.id)) {
				cycles.push({
					type: "direct-cycle",
					path: [featureA.id, depId, featureA.id],
					description: `${featureA.id} ↔ ${depId} (bidirectional dependency)`,
				});
			}
		}
	}

	return cycles;
}

// ============================================================================
// Indirect Cycle Detection (DFS)
// ============================================================================

/**
 * Detect indirect/multi-step cycles using Depth-First Search (DFS).
 *
 * An indirect cycle involves 3 or more features in a chain:
 * - Feature A depends on Feature B
 * - Feature B depends on Feature C
 * - Feature C depends on Feature A
 *
 * Example: S1890.I1.F1 → S1890.I2.F1 → S1890.I3.F1 → S1890.I1.F1
 *
 * This implementation uses the standard DFS cycle detection algorithm
 * with three states: unvisited (white), in-progress (gray), completed (black).
 *
 * Time complexity: O(V + E) where V = features, E = dependencies
 * Space complexity: O(V) for visited set
 *
 * @param features - Array of feature entries to check
 * @returns Array of detected indirect cycles (3+ nodes only, excludes self-refs and direct cycles)
 */
export function detectIndirectCycles(
	features: FeatureEntry[],
): DependencyCycle[] {
	const cycles: DependencyCycle[] = [];

	// Build adjacency map for efficient lookup
	const adjacency = new Map<string, string[]>();
	const validIds = new Set<string>();

	for (const feature of features) {
		validIds.add(feature.id);
		adjacency.set(
			feature.id,
			feature.dependencies.filter((d) => d !== feature.id),
		);
	}

	// Track visited state: 'white' = unvisited, 'gray' = in-progress, 'black' = completed
	const color = new Map<string, "white" | "gray" | "black">();
	// Track parent in DFS tree for path reconstruction
	const parent = new Map<string, string | null>();

	// Initialize all nodes as unvisited
	for (const feature of features) {
		color.set(feature.id, "white");
		parent.set(feature.id, null);
	}

	// DFS function to detect cycles
	function dfs(nodeId: string, path: string[]): boolean {
		color.set(nodeId, "gray");

		const deps = adjacency.get(nodeId) || [];
		for (const depId of deps) {
			// Skip dependencies that don't exist in our feature set
			// (external references, not cycles)
			if (!validIds.has(depId)) continue;

			const depColor = color.get(depId);

			if (depColor === "gray") {
				// Found a cycle! Reconstruct the cycle path
				const cycleStartIndex = path.indexOf(depId);
				if (cycleStartIndex !== -1) {
					const cyclePath = [...path.slice(cycleStartIndex), depId];

					// Only report if it's a true indirect cycle (3+ unique nodes)
					// Self-references and direct cycles are handled separately
					const uniqueNodes = new Set(cyclePath.slice(0, -1)); // Exclude closing node
					if (uniqueNodes.size >= 3) {
						cycles.push({
							type: "indirect-cycle",
							path: cyclePath,
							description: `Cycle: ${cyclePath.join(" → ")}`,
						});
					}
				}
				return true;
			}

			if (depColor === "white") {
				parent.set(depId, nodeId);
				dfs(depId, [...path, depId]);
			}
		}

		color.set(nodeId, "black");
		return false;
	}

	// Run DFS from each unvisited node
	for (const feature of features) {
		if (color.get(feature.id) === "white") {
			dfs(feature.id, [feature.id]);
		}
	}

	return cycles;
}

// ============================================================================
// Combined Detection
// ============================================================================

/**
 * Run all cycle detection checks and return combined results.
 *
 * Checks in order of severity:
 * 1. Self-references (most severe - feature can never complete)
 * 2. Direct cycles (severe - two features mutually blocked)
 * 3. Indirect cycles (severe - chain of features mutually blocked)
 *
 * @param features - Array of feature entries to check
 * @returns Combined cycle detection result
 */
export function detectAllCycles(
	features: FeatureEntry[],
): CycleDetectionResult {
	const selfRefs = detectSelfReferences(features);
	const directCycles = detectDirectCycles(features);
	const indirectCycles = detectIndirectCycles(features);

	const allCycles = [...selfRefs, ...directCycles, ...indirectCycles];
	const hasCycles = allCycles.length > 0;

	return {
		hasCycles,
		cycles: allCycles,
		errorMessage: hasCycles ? formatCycleError(allCycles) : null,
	};
}

/**
 * Quick check for self-references only.
 *
 * This is a lightweight check suitable for runtime guards where
 * we only need to catch the most common case (self-references).
 *
 * @param feature - Single feature to check
 * @returns true if the feature has a self-reference
 */
export function hasSelfReference(feature: FeatureEntry): boolean {
	return feature.dependencies.includes(feature.id);
}

// ============================================================================
// Error Formatting
// ============================================================================

/**
 * Format detected cycles into a user-friendly error message.
 *
 * @param cycles - Array of detected cycles
 * @returns Formatted error message with guidance on how to fix
 */
export function formatCycleError(cycles: DependencyCycle[]): string {
	if (cycles.length === 0) {
		return "";
	}

	const lines: string[] = [];

	lines.push("");
	lines.push("═".repeat(70));
	lines.push("   ❌ CIRCULAR DEPENDENCY DETECTED");
	lines.push("═".repeat(70));
	lines.push("");

	// Group cycles by type
	const selfRefs = cycles.filter((c) => c.type === "self-reference");
	const directCycles = cycles.filter((c) => c.type === "direct-cycle");
	const indirectCycles = cycles.filter((c) => c.type === "indirect-cycle");

	if (selfRefs.length > 0) {
		lines.push("🔴 Self-References (feature depends on itself):");
		for (const cycle of selfRefs) {
			lines.push(`   • ${cycle.path[0]}`);
		}
		lines.push("");
	}

	if (directCycles.length > 0) {
		lines.push("🔴 Direct Cycles (two features depend on each other):");
		for (const cycle of directCycles) {
			lines.push(`   • ${cycle.description}`);
		}
		lines.push("");
	}

	if (indirectCycles.length > 0) {
		lines.push("🔴 Indirect Cycles (chain of dependencies forms a loop):");
		for (const cycle of indirectCycles) {
			lines.push(`   • ${cycle.description}`);
		}
		lines.push("");
	}

	lines.push("─".repeat(70));
	lines.push("HOW TO FIX:");
	lines.push("");

	if (selfRefs.length > 0) {
		lines.push(
			"1. Self-references: Remove the feature ID from its own dependencies.",
		);
		lines.push(
			"   Edit the feature.md file and remove the self-reference from",
		);
		lines.push('   the "Blocked By" section.');
		lines.push("");
	}

	if (directCycles.length > 0 || indirectCycles.length > 0) {
		lines.push(
			"2. Dependency cycles: Review the dependency chain and remove one",
		);
		lines.push(
			"   of the dependencies to break the cycle. Consider which feature",
		);
		lines.push("   should logically come first.");
		lines.push("");
	}

	lines.push("After fixing, regenerate the manifest:");
	lines.push("   tsx .ai/alpha/scripts/generate-spec-manifest.ts <spec-id>");
	lines.push("");
	lines.push("═".repeat(70));

	return lines.join("\n");
}

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Validate a manifest's feature queue for circular dependencies.
 *
 * This is the main entry point for manifest validation, used by:
 * - generate-spec-manifest.ts (Pass 2b)
 * - orchestrator.ts (pre-flight check)
 *
 * @param features - Array of feature entries from the manifest
 * @param log - Optional logger function for output
 * @returns CycleDetectionResult with all detected cycles
 */
export function validateDependencyGraph(
	features: FeatureEntry[],
	log?: (...args: unknown[]) => void,
): CycleDetectionResult {
	const logger = log || console.log;
	const result = detectAllCycles(features);

	if (result.hasCycles) {
		logger(result.errorMessage);
	}

	return result;
}

/**
 * Validate initiative-level dependencies for cycles.
 *
 * Checks for cycles in initiative dependencies, which are separate
 * from feature-level dependencies.
 *
 * @param initiatives - Array of initiative entries to check
 * @returns Array of detected cycles (similar format to feature cycles)
 */
export function validateInitiativeDependencies(
	initiatives: InitiativeEntry[],
): DependencyCycle[] {
	const cycles: DependencyCycle[] = [];

	// Build adjacency map
	const adjacency = new Map<string, string[]>();
	const validIds = new Set<string>();

	for (const init of initiatives) {
		validIds.add(init.id);
		adjacency.set(init.id, init.dependencies);
	}

	// Check for self-references
	for (const init of initiatives) {
		if (init.dependencies.includes(init.id)) {
			cycles.push({
				type: "self-reference",
				path: [init.id],
				description: `Initiative ${init.id} depends on itself`,
			});
		}
	}

	// Check for direct cycles
	const checked = new Set<string>();
	for (const initA of initiatives) {
		for (const depId of initA.dependencies) {
			const pairKey = [initA.id, depId].sort().join("->");
			if (checked.has(pairKey)) continue;
			checked.add(pairKey);

			if (depId === initA.id) continue;

			const initB = initiatives.find((i) => i.id === depId);
			if (initB?.dependencies.includes(initA.id)) {
				cycles.push({
					type: "direct-cycle",
					path: [initA.id, depId, initA.id],
					description: `${initA.id} ↔ ${depId} (bidirectional dependency)`,
				});
			}
		}
	}

	return cycles;
}
