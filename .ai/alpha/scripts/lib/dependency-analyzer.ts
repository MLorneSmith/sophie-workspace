/**
 * Dependency Analyzer Module
 *
 * Analyzes feature dependencies and recommends optimizations.
 * Supports both feature-level and initiative-level dependency resolution.
 *
 * Created as part of #1820 - Alpha Orchestrator Efficiency Optimization
 */

import type {
	FeatureEntry,
	InitiativeEntry,
	SpecManifest,
} from "../types/index.js";

// ============================================================================
// Types
// ============================================================================

export interface DependencyAnalysis {
	featureId: string;
	currentDeps: string[];
	recommendedDeps: string[];
	removedDeps: string[];
	addedDeps: string[];
	reason: string;
	canStartNow: boolean;
}

export interface DependencyReport {
	specId: string;
	analyses: DependencyAnalysis[];
	featuresUnblockedNow: string[];
	parallelGroupCount: number;
	estimatedSpeedup: string;
}

export interface DependencyCheckResult {
	satisfied: boolean;
	blockingDeps: string[];
	completedDeps: string[];
	reason: string;
}

// ============================================================================
// Dependency Analysis Functions
// ============================================================================

/**
 * Analyze a feature's dependencies and recommend optimizations.
 *
 * This checks if a feature has unnecessary initiative-level dependencies
 * that could be replaced with more specific feature-level dependencies.
 *
 * @param feature - The feature to analyze
 * @param manifest - The spec manifest for context
 * @returns Analysis with recommendations
 */
export function analyzeFeatureDependencies(
	feature: FeatureEntry,
	manifest: SpecManifest,
): DependencyAnalysis {
	const currentDeps = [...feature.dependencies];
	const recommendedDeps: string[] = [];
	const removedDeps: string[] = [];
	const addedDeps: string[] = [];
	const reasons: string[] = [];

	// Get completed features and initiatives for comparison
	const completedFeatureIds = new Set(
		manifest.feature_queue
			.filter((f) => f.status === "completed")
			.map((f) => f.id),
	);

	const completedInitiativeIds = new Set(
		manifest.initiatives
			.filter((i) => i.status === "completed")
			.map((i) => i.id),
	);

	for (const dep of currentDeps) {
		// Check if this is an initiative-level dependency
		if (isInitiativeDep(dep, manifest.initiatives)) {
			// Find the initiative
			const initiative = manifest.initiatives.find((i) => i.id === dep);
			if (!initiative) {
				recommendedDeps.push(dep);
				continue;
			}

			// Get features from this initiative
			const initFeatures = manifest.feature_queue.filter(
				(f) => f.initiative_id === dep,
			);

			// Check if all features in the initiative are completed
			const allComplete = initFeatures.every((f) => f.status === "completed");

			if (allComplete) {
				// Initiative is complete, keep the dependency as-is (it's satisfied)
				recommendedDeps.push(dep);
			} else {
				// Initiative is NOT complete - check which specific features are needed
				// For now, recommend the completed features from that initiative
				const completedFromInit = initFeatures.filter(
					(f) => f.status === "completed",
				);

				if (completedFromInit.length > 0) {
					// Replace initiative dep with specific completed features
					for (const completedFeature of completedFromInit) {
						if (!recommendedDeps.includes(completedFeature.id)) {
							recommendedDeps.push(completedFeature.id);
							addedDeps.push(completedFeature.id);
						}
					}
					removedDeps.push(dep);
					reasons.push(
						`Replaced ${dep} with ${completedFromInit.length} specific features`,
					);
				} else {
					// No features completed yet, keep the first feature as dep
					const firstFeature = initFeatures[0];
					if (firstFeature) {
						recommendedDeps.push(firstFeature.id);
						addedDeps.push(firstFeature.id);
						removedDeps.push(dep);
						reasons.push(
							`Replaced ${dep} with first feature ${firstFeature.id}`,
						);
					}
				}
			}
		} else {
			// Feature-level dependency, keep it
			recommendedDeps.push(dep);
		}
	}

	// Check if feature can start now with recommended deps
	const canStartNow = recommendedDeps.every(
		(depId) =>
			completedFeatureIds.has(depId) || completedInitiativeIds.has(depId),
	);

	return {
		featureId: feature.id,
		currentDeps,
		recommendedDeps,
		removedDeps,
		addedDeps,
		reason: reasons.length > 0 ? reasons.join("; ") : "No changes needed",
		canStartNow,
	};
}

/**
 * Check if a dependency ID refers to an initiative (vs a feature).
 */
function isInitiativeDep(
	depId: string,
	initiatives: InitiativeEntry[],
): boolean {
	// Initiative IDs are like S1815.I1, feature IDs are like S1815.I1.F1
	// Count the dots - initiatives have 1 dot, features have 2
	const dotCount = (depId.match(/\./g) || []).length;

	if (dotCount === 1) {
		// Could be initiative - verify it exists
		return initiatives.some((i) => i.id === depId);
	}

	return false;
}

/**
 * Generate a full dependency report for a spec manifest.
 *
 * @param manifest - The spec manifest to analyze
 * @returns Complete dependency analysis report
 */
export function generateDependencyReport(
	manifest: SpecManifest,
): DependencyReport {
	const analyses: DependencyAnalysis[] = [];
	const featuresUnblockedNow: string[] = [];

	// Analyze each pending feature
	for (const feature of manifest.feature_queue) {
		if (feature.status !== "pending") continue;

		const analysis = analyzeFeatureDependencies(feature, manifest);
		analyses.push(analysis);

		if (
			analysis.canStartNow &&
			!analysis.currentDeps.every((d) => {
				const completedFeatureIds = new Set(
					manifest.feature_queue
						.filter((f) => f.status === "completed")
						.map((f) => f.id),
				);
				const completedInitiativeIds = new Set(
					manifest.initiatives
						.filter((i) => i.status === "completed")
						.map((i) => i.id),
				);
				return completedFeatureIds.has(d) || completedInitiativeIds.has(d);
			})
		) {
			// Feature would be unblocked with optimized deps
			featuresUnblockedNow.push(feature.id);
		}
	}

	// Calculate parallel groups
	const parallelGroupCount = calculateParallelGroups(manifest);

	// Estimate speedup
	const currentBlocked = manifest.feature_queue.filter(
		(f) => f.status === "pending",
	).length;
	const estimatedSpeedup =
		featuresUnblockedNow.length > 0
			? `${featuresUnblockedNow.length} features can start immediately (${Math.round((featuresUnblockedNow.length / currentBlocked) * 100)}% of blocked)`
			: "No immediate improvement available";

	return {
		specId: manifest.metadata.spec_id,
		analyses,
		featuresUnblockedNow,
		parallelGroupCount,
		estimatedSpeedup,
	};
}

/**
 * Calculate how many parallel execution groups exist.
 */
function calculateParallelGroups(manifest: SpecManifest): number {
	const completedIds = new Set(
		manifest.feature_queue
			.filter((f) => f.status === "completed")
			.map((f) => f.id),
	);

	let groups = 0;
	const remaining = new Set(
		manifest.feature_queue
			.filter((f) => f.status !== "completed")
			.map((f) => f.id),
	);

	while (remaining.size > 0) {
		groups++;
		const canStart: string[] = [];

		for (const featureId of remaining) {
			const feature = manifest.feature_queue.find((f) => f.id === featureId);
			if (!feature) continue;

			const depsComplete = feature.dependencies.every(
				(depId) => completedIds.has(depId) || !remaining.has(depId),
			);
			if (depsComplete) {
				canStart.push(featureId);
			}
		}

		if (canStart.length === 0) {
			// Circular dependency or stuck - break to avoid infinite loop
			break;
		}

		for (const id of canStart) {
			remaining.delete(id);
			completedIds.add(id);
		}
	}

	return groups;
}

// ============================================================================
// Dependency Resolution (for work queue)
// ============================================================================

/**
 * Check if all dependencies for a feature are satisfied.
 *
 * Supports both feature-level and initiative-level dependencies:
 * - Feature-level (S1815.I1.F1): Checks if specific feature is completed
 * - Initiative-level (S1815.I1): Checks if ALL features in initiative are completed
 *
 * @param feature - The feature to check
 * @param manifest - The spec manifest
 * @param debugLog - Optional debug logging function
 * @returns Result with satisfaction status and blocking deps
 */
export function checkDependenciesSatisfied(
	feature: FeatureEntry,
	manifest: SpecManifest,
	debugLog?: (...args: unknown[]) => void,
): DependencyCheckResult {
	const log = debugLog ?? (() => {});

	if (feature.dependencies.length === 0) {
		return {
			satisfied: true,
			blockingDeps: [],
			completedDeps: [],
			reason: "No dependencies",
		};
	}

	const completedFeatureIds = new Set(
		manifest.feature_queue
			.filter((f) => f.status === "completed")
			.map((f) => f.id),
	);

	const completedInitiativeIds = new Set(
		manifest.initiatives
			.filter((i) => i.status === "completed")
			.map((i) => i.id),
	);

	const blockingDeps: string[] = [];
	const completedDeps: string[] = [];

	for (const depId of feature.dependencies) {
		// Check if it's a completed feature
		if (completedFeatureIds.has(depId)) {
			completedDeps.push(depId);
			log(`   ✓ Feature dep ${depId} satisfied (feature completed)`);
			continue;
		}

		// Check if it's a completed initiative
		if (completedInitiativeIds.has(depId)) {
			completedDeps.push(depId);
			log(`   ✓ Initiative dep ${depId} satisfied (initiative completed)`);
			continue;
		}

		// Dependency not satisfied
		blockingDeps.push(depId);
		log(`   ✗ Dep ${depId} NOT satisfied`);
	}

	const satisfied = blockingDeps.length === 0;
	const reason = satisfied
		? `All ${completedDeps.length} dependencies satisfied`
		: `Blocked by ${blockingDeps.length} dependencies: ${blockingDeps.join(", ")}`;

	return {
		satisfied,
		blockingDeps,
		completedDeps,
		reason,
	};
}

// ============================================================================
// Circular Dependency Detection
// ============================================================================

/**
 * Detect circular dependencies in the manifest.
 *
 * @param manifest - The spec manifest to check
 * @returns Array of feature IDs involved in circular dependencies
 */
export function detectCircularDependencies(manifest: SpecManifest): string[][] {
	const cycles: string[][] = [];
	const visited = new Set<string>();
	const recursionStack = new Set<string>();

	function dfs(featureId: string, path: string[]): boolean {
		if (recursionStack.has(featureId)) {
			// Found a cycle - extract the cycle from the path
			const cycleStart = path.indexOf(featureId);
			const cycle = [...path.slice(cycleStart), featureId];
			cycles.push(cycle);
			return true;
		}

		if (visited.has(featureId)) {
			return false;
		}

		visited.add(featureId);
		recursionStack.add(featureId);

		const feature = manifest.feature_queue.find((f) => f.id === featureId);
		if (feature) {
			for (const depId of feature.dependencies) {
				// Only follow feature-level dependencies for cycle detection
				if (manifest.feature_queue.some((f) => f.id === depId)) {
					dfs(depId, [...path, featureId]);
				}
			}
		}

		recursionStack.delete(featureId);
		return false;
	}

	for (const feature of manifest.feature_queue) {
		if (!visited.has(feature.id)) {
			dfs(feature.id, []);
		}
	}

	return cycles;
}
