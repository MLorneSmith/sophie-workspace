/**
 * Phase Execution Module
 *
 * Handles phase-based execution for the Alpha Spec Orchestrator.
 * Phases group initiatives into manageable execution units of 7-8 features,
 * enabling sequential execution with branch chaining.
 *
 * Feature #1961: Phase support (--phase, --base-branch)
 */

import {
	MAX_DEPENDENCY_DEPTH,
	MAX_FEATURES_PER_PHASE,
	MAX_TASKS_PER_PHASE,
} from "../config/index.js";
import type {
	FeatureEntry,
	InitiativeEntry,
	PhaseDefinition,
	SpecManifest,
} from "../types/index.js";

// ============================================================================
// Phase Auto-Generation
// ============================================================================

/**
 * Auto-generate phases by grouping initiatives in priority order.
 *
 * Algorithm: Iterate initiatives in priority order, accumulating features
 * until the next initiative would exceed MAX_FEATURES_PER_PHASE. This respects
 * initiative boundaries (no splitting an initiative across phases) and
 * dependency order (initiatives are already priority-sorted by their dependencies).
 *
 * @param manifest - The spec manifest with initiatives and feature queue
 * @returns Array of phase definitions
 */
export function autoGeneratePhases(manifest: SpecManifest): PhaseDefinition[] {
	const phases: PhaseDefinition[] = [];
	const sortedInitiatives = [...manifest.initiatives].sort(
		(a, b) => a.priority - b.priority,
	);

	let currentPhase: {
		initiative_ids: string[];
		feature_count: number;
		task_count: number;
	} = { initiative_ids: [], feature_count: 0, task_count: 0 };

	for (const initiative of sortedInitiatives) {
		const initFeatures = manifest.feature_queue.filter(
			(f) => f.initiative_id === initiative.id,
		);
		const initTaskCount = initFeatures.reduce(
			(sum, f) => sum + f.task_count,
			0,
		);

		// If adding this initiative would exceed the limit AND the current phase
		// already has features, start a new phase
		if (
			currentPhase.feature_count > 0 &&
			currentPhase.feature_count + initFeatures.length > MAX_FEATURES_PER_PHASE
		) {
			phases.push(buildPhaseDefinition(phases.length + 1, currentPhase));
			currentPhase = { initiative_ids: [], feature_count: 0, task_count: 0 };
		}

		currentPhase.initiative_ids.push(initiative.id);
		currentPhase.feature_count += initFeatures.length;
		currentPhase.task_count += initTaskCount;
	}

	// Push the last phase if it has any initiatives
	if (currentPhase.initiative_ids.length > 0) {
		phases.push(buildPhaseDefinition(phases.length + 1, currentPhase));
	}

	return phases;
}

/**
 * Build a PhaseDefinition from accumulated initiative data.
 */
function buildPhaseDefinition(
	phaseNumber: number,
	data: {
		initiative_ids: string[];
		feature_count: number;
		task_count: number;
	},
): PhaseDefinition {
	return {
		id: `P${phaseNumber}`,
		name: `Phase ${phaseNumber}`,
		initiative_ids: data.initiative_ids,
		feature_count: data.feature_count,
		task_count: data.task_count,
	};
}

// ============================================================================
// Phase Filtering
// ============================================================================

/**
 * Filter a manifest to only include features from a specific phase's initiatives.
 *
 * Returns a deep copy of the manifest with:
 * - feature_queue filtered to only phase's initiatives
 * - initiatives filtered to only phase's initiatives
 * - progress.features_total and progress.tasks_total updated
 * - Dependencies on earlier-phase initiatives treated as "satisfied" (removed)
 *
 * @param manifest - The full spec manifest
 * @param phaseId - The phase ID to filter by (e.g., "P1")
 * @returns A filtered copy of the manifest
 * @throws Error if phaseId is not found
 */
export function filterManifestByPhase(
	manifest: SpecManifest,
	phaseId: string,
): SpecManifest {
	const phases = manifest.phases;
	if (!phases || phases.length === 0) {
		throw new Error(
			`No phases defined in manifest. Run autoGeneratePhases() first.`,
		);
	}

	const phase = phases.find((p) => p.id === phaseId);
	if (!phase) {
		const available = phases.map((p) => p.id).join(", ");
		throw new Error(
			`Phase "${phaseId}" not found. Available phases: ${available}`,
		);
	}

	const phaseInitiativeIds = new Set(phase.initiative_ids);

	// Determine which initiative IDs are from EARLIER phases (already completed)
	const earlierInitiativeIds = new Set<string>();
	for (const p of phases) {
		if (p.id === phaseId) break;
		for (const initId of p.initiative_ids) {
			earlierInitiativeIds.add(initId);
		}
	}

	// Filter features to only include this phase's initiatives
	const filteredFeatures: FeatureEntry[] = manifest.feature_queue
		.filter((f) => phaseInitiativeIds.has(f.initiative_id))
		.map((f) => ({
			...f,
			// Remove dependencies on features/initiatives from earlier phases
			// (they're already completed in the base branch)
			dependencies: f.dependencies.filter((depId) => {
				// If the dependency is an initiative ID from an earlier phase, remove it
				if (earlierInitiativeIds.has(depId)) return false;

				// If the dependency is a feature from an earlier phase's initiative, remove it
				const depFeature = manifest.feature_queue.find(
					(df) => df.id === depId,
				);
				if (depFeature && earlierInitiativeIds.has(depFeature.initiative_id)) {
					return false;
				}

				return true;
			}),
		}));

	// Filter initiatives
	const filteredInitiatives: InitiativeEntry[] = manifest.initiatives
		.filter((i) => phaseInitiativeIds.has(i.id))
		.map((i) => ({
			...i,
			// Remove dependencies on earlier-phase initiatives
			dependencies: i.dependencies.filter(
				(depId) => !earlierInitiativeIds.has(depId),
			),
		}));

	// Calculate totals for the filtered set
	const featuresTotal = filteredFeatures.length;
	const tasksTotal = filteredFeatures.reduce(
		(sum, f) => sum + f.task_count,
		0,
	);
	const featuresCompleted = filteredFeatures.filter(
		(f) => f.status === "completed",
	).length;
	const tasksCompleted = filteredFeatures.reduce(
		(sum, f) => sum + f.tasks_completed,
		0,
	);
	const initiativesCompleted = filteredInitiatives.filter(
		(i) => i.status === "completed",
	).length;

	return {
		...manifest,
		initiatives: filteredInitiatives,
		feature_queue: filteredFeatures,
		phases: manifest.phases,
		progress: {
			...manifest.progress,
			features_total: featuresTotal,
			tasks_total: tasksTotal,
			features_completed: featuresCompleted,
			tasks_completed: tasksCompleted,
			initiatives_total: filteredInitiatives.length,
			initiatives_completed: initiativesCompleted,
		},
	};
}

// ============================================================================
// Phase Validation
// ============================================================================

/**
 * Validate a phase against size limits and dependency constraints.
 *
 * Checks:
 * - Feature count <= MAX_FEATURES_PER_PHASE
 * - Task count <= MAX_TASKS_PER_PHASE
 * - Dependency depth <= MAX_DEPENDENCY_DEPTH
 * - No features depend on features in a later phase
 *
 * @param manifest - The spec manifest (must have phases defined)
 * @param phaseId - The phase ID to validate
 * @returns Validation result with errors if any
 */
export function validatePhase(
	manifest: SpecManifest,
	phaseId: string,
): { valid: boolean; errors: string[] } {
	const errors: string[] = [];
	const phases = manifest.phases;

	if (!phases || phases.length === 0) {
		return { valid: false, errors: ["No phases defined in manifest"] };
	}

	const phase = phases.find((p) => p.id === phaseId);
	if (!phase) {
		return {
			valid: false,
			errors: [`Phase "${phaseId}" not found`],
		};
	}

	// Check feature count
	if (phase.feature_count > MAX_FEATURES_PER_PHASE) {
		errors.push(
			`Phase ${phaseId} has ${phase.feature_count} features (max: ${MAX_FEATURES_PER_PHASE})`,
		);
	}

	// Check task count
	if (phase.task_count > MAX_TASKS_PER_PHASE) {
		errors.push(
			`Phase ${phaseId} has ${phase.task_count} tasks (max: ${MAX_TASKS_PER_PHASE})`,
		);
	}

	// Check dependency depth
	const phaseInitiativeIds = new Set(phase.initiative_ids);
	const phaseFeatures = manifest.feature_queue.filter((f) =>
		phaseInitiativeIds.has(f.initiative_id),
	);
	const depth = calculateDependencyDepth(phaseFeatures);
	if (depth > MAX_DEPENDENCY_DEPTH) {
		errors.push(
			`Phase ${phaseId} has dependency depth ${depth} (max: ${MAX_DEPENDENCY_DEPTH})`,
		);
	}

	// Check for dependencies on later phases
	const phaseIndex = phases.findIndex((p) => p.id === phaseId);
	const laterInitiativeIds = new Set<string>();
	for (let i = phaseIndex + 1; i < phases.length; i++) {
		const laterPhase = phases[i];
		if (laterPhase) {
			for (const initId of laterPhase.initiative_ids) {
				laterInitiativeIds.add(initId);
			}
		}
	}

	for (const feature of phaseFeatures) {
		for (const depId of feature.dependencies) {
			const depFeature = manifest.feature_queue.find(
				(f) => f.id === depId,
			);
			if (depFeature && laterInitiativeIds.has(depFeature.initiative_id)) {
				errors.push(
					`Feature ${feature.id} depends on ${depId} which is in a later phase`,
				);
			}
		}
	}

	return { valid: errors.length === 0, errors };
}

// ============================================================================
// Phase Utilities
// ============================================================================

/**
 * Get available phase IDs from a manifest.
 *
 * @param manifest - The spec manifest
 * @returns Array of phase IDs (e.g., ["P1", "P2", "P3"]), empty if no phases
 */
export function getPhaseIds(manifest: SpecManifest): string[] {
	return manifest.phases?.map((p) => p.id) ?? [];
}

/**
 * Get the branch name for a specific phase.
 *
 * @param specId - The spec ID (e.g., "S1918" or "1918")
 * @param phaseId - The phase ID (e.g., "P1")
 * @returns Branch name (e.g., "alpha/spec-S1918-P1")
 */
export function getPhaseBranchName(specId: string, phaseId: string): string {
	return `alpha/spec-${specId}-${phaseId}`;
}

/**
 * Calculate the maximum dependency depth in a feature queue.
 *
 * Uses BFS to find the longest dependency chain. Only considers
 * dependencies within the provided feature set.
 *
 * @param featureQueue - Array of features to analyze
 * @returns Maximum dependency chain depth (0 if no dependencies)
 */
export function calculateDependencyDepth(
	featureQueue: FeatureEntry[],
): number {
	const featureIds = new Set(featureQueue.map((f) => f.id));
	const depMap = new Map<string, string[]>();

	for (const feature of featureQueue) {
		// Only include dependencies that exist in this feature set
		const internalDeps = feature.dependencies.filter((d) =>
			featureIds.has(d),
		);
		depMap.set(feature.id, internalDeps);
	}

	// Memoized DFS to find max depth from each node
	const depthCache = new Map<string, number>();
	const visiting = new Set<string>();

	function getDepth(featureId: string): number {
		if (depthCache.has(featureId)) {
			return depthCache.get(featureId)!;
		}

		// Cycle detection
		if (visiting.has(featureId)) {
			return 0;
		}

		visiting.add(featureId);

		const deps = depMap.get(featureId) ?? [];
		let maxChildDepth = 0;
		for (const depId of deps) {
			maxChildDepth = Math.max(maxChildDepth, getDepth(depId) + 1);
		}

		visiting.delete(featureId);
		depthCache.set(featureId, maxChildDepth);
		return maxChildDepth;
	}

	let maxDepth = 0;
	for (const feature of featureQueue) {
		maxDepth = Math.max(maxDepth, getDepth(feature.id));
	}

	return maxDepth;
}
