/**

* Work Queue Module
*
* Manages the feature queue, dependency checking, and stale state cleanup.
* Implements work distribution logic for parallel sandbox execution.
 */

import type { FeatureEntry, SpecManifest } from "../types/index.js";

// ============================================================================
// Feature Selection
// ============================================================================

/**

* Get the next available feature that:
* 1. Is pending OR failed (failed features are retried on re-run)
* 1. Has all dependencies completed
* 1. Is not assigned to another sandbox
* 1. Database features are serialized (only one DB feature at a time)
*
* @param manifest - The spec manifest containing the feature queue
* @returns The next available feature, or null if none available
 */
export function getNextAvailableFeature(
	manifest: SpecManifest,
): FeatureEntry | null {
	const completedFeatureIds = new Set(
		manifest.feature_queue
			.filter((f) => f.status === "completed")
			.map((f) => f.id),
	);

	// Also consider completed initiatives for initiative-level dependencies
	const completedInitiativeIds = new Set(
		manifest.initiatives
			.filter((i) => i.status === "completed")
			.map((i) => i.id),
	);

	// Check if a database feature is currently running
	// Database features must be serialized to prevent migration conflicts
	const dbFeatureRunning = manifest.feature_queue.some(
		(f) =>
			f.requires_database &&
			f.status === "in_progress" &&
			f.assigned_sandbox !== undefined,
	);

	for (const feature of manifest.feature_queue) {
		// Handle inconsistent state: in_progress with error
		// This happens when a feature fails (signal: terminated) but manifest wasn't fully updated
		if (feature.status === "in_progress" && feature.error) {
			// Reset to failed so it can be retried
			console.log(
				`🔧 Fixing inconsistent state: #${feature.id} was in_progress with error "${feature.error}", resetting to failed`,
			);
			feature.status = "failed";
			feature.assigned_sandbox = undefined;
		}

		// Skip if completed or currently in_progress (with active sandbox)
		// Allow pending AND failed features (failed features are retried)
		if (feature.status !== "pending" && feature.status !== "failed") {
			continue;
		}

		// Skip if already assigned to a sandbox
		if (feature.assigned_sandbox) {
			continue;
		}

		// Serialize database features: skip DB features if one is already running
		// This prevents migration conflicts when multiple sandboxes try to modify the schema
		if (feature.requires_database && dbFeatureRunning) {
			continue;
		}

		// Check if all dependencies are satisfied
		const depsComplete = feature.dependencies.every((depId) => {
			// Check if it's a completed feature
			if (completedFeatureIds.has(depId)) {
				return true;
			}
			// Check if it's a completed initiative
			if (completedInitiativeIds.has(depId)) {
				return true;
			}
			return false;
		});

		if (depsComplete) {
			return feature;
		}
	}

	return null;
}

// ============================================================================
// Progress Tracking
// ============================================================================

/**

* Update the next_feature_id in progress based on current state.
*
* @param manifest - The manifest to update
 */
export function updateNextFeatureId(manifest: SpecManifest): void {
	const nextFeature = getNextAvailableFeature(manifest);
	manifest.progress.next_feature_id = nextFeature?.id || null;
}

// ============================================================================
// Stale State Cleanup
// ============================================================================

/**

* Clean up stale state from previous runs.
* This handles:
* * Features stuck as "in_progress" from crashed/killed sandboxes
* * Stale sandbox assignments that no longer exist
* * Failed features that need retry (clear error for fresh attempt)
*
* @param manifest - The manifest to clean up
* @returns Number of features that were cleaned up
 */
export function cleanupStaleState(manifest: SpecManifest): number {
	let cleanedCount = 0;

	for (const feature of manifest.feature_queue) {
		// Reset in_progress features with stale sandbox assignments
		// When we restart, the old sandboxes are gone
		if (feature.status === "in_progress" && feature.assigned_sandbox) {
			console.log(
				`🧹 Resetting stale in_progress: #${feature.id} (was ${feature.assigned_sandbox})`,
			);
			feature.status = "pending";
			feature.assigned_sandbox = undefined;
			cleanedCount++;
		}

		// Clear stale sandbox assignments from pending/failed features
		if (
			feature.assigned_sandbox &&
			(feature.status === "pending" || feature.status === "failed")
		) {
			feature.assigned_sandbox = undefined;
			cleanedCount++;
		}

		// Clear error messages from failed features (they'll be retried fresh)
		if (feature.status === "failed" && feature.error) {
			console.log(`   🔄 Marking for retry: #${feature.id} - ${feature.title}`);
			feature.error = undefined;
		}
	}

	// Update initiative statuses based on feature cleanup
	for (const initiative of manifest.initiatives) {
		const initFeatures = manifest.feature_queue.filter(
			(f) => f.initiative_id === initiative.id,
		);
		const completedCount = initFeatures.filter(
			(f) => f.status === "completed",
		).length;
		const inProgressCount = initFeatures.filter(
			(f) => f.status === "in_progress",
		).length;

		initiative.features_completed = completedCount;

		if (completedCount === initiative.feature_count) {
			initiative.status = "completed";
		} else if (inProgressCount > 0 || completedCount > 0) {
			initiative.status = "in_progress";
		} else {
			initiative.status = "pending";
		}
	}

	return cleanedCount;
}

// ============================================================================
// Queue Status
// ============================================================================

/**

* Get features that are blocked by incomplete dependencies.
*
* @param manifest - The manifest to check
* @returns Array of blocked features with their blocking dependency IDs
 */
export function getBlockedFeatures(
	manifest: SpecManifest,
): Array<{ feature: FeatureEntry; blockingDeps: number[] }> {
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

	const blocked: Array<{ feature: FeatureEntry; blockingDeps: number[] }> = [];

	for (const feature of manifest.feature_queue) {
		if (feature.status !== "pending") continue;
		if (feature.dependencies.length === 0) continue;

		const blockingDeps = feature.dependencies.filter(
			(depId) =>
				!completedFeatureIds.has(depId) && !completedInitiativeIds.has(depId),
		);

		if (blockingDeps.length > 0) {
			blocked.push({ feature, blockingDeps });
		}
	}

	return blocked;
}
