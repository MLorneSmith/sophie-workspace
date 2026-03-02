/**
 * Deadlock Handler Module
 *
 * Detects and recovers from deadlock conditions in the orchestrator.
 * Handles phantom completion detection and failed feature retry logic.
 * Extracted from orchestrator.ts as part of refactoring #1816.
 */

import type { SandboxInstance, SpecManifest } from "../types/index.js";
import { emitOrchestratorEvent } from "./event-emitter.js";
import {
	transitionFeatureStatus,
	transitionInitiativeStatus,
} from "./feature-transitions.js";
import { createLogger } from "./logger.js";
import { saveManifest } from "./manifest.js";
import {
	DEFAULT_MAX_RETRIES,
	getBlockingFailedFeatures,
	getNextAvailableFeature,
	getPhantomCompletedFeatures,
	resetFailedFeatureForRetry,
	shouldRetryFailedFeature,
} from "./work-queue.js";

// ============================================================================
// Types
// ============================================================================

export interface DeadlockResult {
	shouldExit: boolean;
	retriedCount: number;
	failedInitiatives: string[];
}

export interface PhantomRecoveryResult {
	recoveredCount: number;
	recoveredFeatureIds: string[];
	completedInitiativeIds: string[];
}

// ============================================================================
// Phantom Completion Recovery
// ============================================================================

/**
 * Recover phantom-completed features.
 *
 * These are features where tasks_completed >= task_count but status is still "in_progress".
 * This can happen when PTY disconnects after completion or manifest save fails.
 *
 * @param manifest - The spec manifest
 * @param busySandboxLabels - Set of labels for currently busy sandboxes
 * @param instances - Optional array of sandbox instances to update status
 * @param log - Logger function
 * @param context - Context string for logging (e.g., "deadlock_detection", "work_loop")
 * @returns Object with recovery statistics
 */
export function recoverPhantomCompletedFeatures(
	manifest: SpecManifest,
	busySandboxLabels: Set<string>,
	instances?: SandboxInstance[],
	log: (...args: unknown[]) => void = console.log,
	context: string = "work_loop",
): PhantomRecoveryResult {
	const phantomCompletedFeatures = getPhantomCompletedFeatures(
		manifest,
		busySandboxLabels,
	);

	if (phantomCompletedFeatures.length === 0) {
		return {
			recoveredCount: 0,
			recoveredFeatureIds: [],
			completedInitiativeIds: [],
		};
	}

	const recoveredFeatureIds: string[] = [];
	const completedInitiativeIds: string[] = [];

	for (const feature of phantomCompletedFeatures) {
		const sandboxInstance = instances?.find(
			(i) => i.label === feature.assigned_sandbox,
		);

		log(
			`   🔮 [PHANTOM_COMPLETION] Detected: Feature #${feature.id} has ${feature.tasks_completed}/${feature.task_count} tasks completed but status is "${feature.status}"`,
		);

		// Transition feature to completed (handles initiative cascade)
		transitionFeatureStatus(feature, manifest, "completed", {
			reason: "phantom completion detected - tasks_completed >= task_count",
			skipSave: true, // batch save below
		});

		// Check if initiative was completed by this transition
		const initiative = manifest.initiatives.find(
			(i) => i.id === feature.initiative_id,
		);
		if (initiative?.status === "completed") {
			completedInitiativeIds.push(initiative.id);
			log(
				`   🔮 [PHANTOM_COMPLETION] Initiative ${initiative.id} now complete (all ${initiative.feature_count} features done)`,
			);
		}

		// Update progress tracking
		manifest.progress.last_completed_feature_id = feature.id;
		recoveredFeatureIds.push(feature.id);

		// Mark sandbox as ready for next feature if it exists
		if (sandboxInstance) {
			sandboxInstance.status = "ready";
			sandboxInstance.currentFeature = null;
		}

		log(
			`   ✅ [PHANTOM_COMPLETION] Feature #${feature.id} recovered - dependents unblocked`,
		);

		// Emit event for UI visibility
		emitOrchestratorEvent(
			"phantom_completion_detected",
			`Feature #${feature.id} phantom completion recovered`,
			{
				featureId: feature.id,
				tasksCompleted: feature.tasks_completed,
				taskCount: feature.task_count,
				initiativeId: feature.initiative_id,
				context,
			},
		);
	}

	// Save manifest with updates
	saveManifest(manifest);

	return {
		recoveredCount: recoveredFeatureIds.length,
		recoveredFeatureIds,
		completedInitiativeIds,
	};
}

// ============================================================================
// Failed Feature Handling
// ============================================================================

/**
 * Handle failed features that are blocking the queue.
 *
 * @param manifest - The spec manifest
 * @param log - Logger function
 * @returns Object with retry count and list of failed initiatives
 */
export function handleBlockingFailedFeatures(
	manifest: SpecManifest,
	log: (...args: unknown[]) => void = console.log,
): { retriedCount: number; failedInitiatives: string[] } {
	const blockingFailedFeatures = getBlockingFailedFeatures(manifest);

	if (blockingFailedFeatures.length === 0) {
		return { retriedCount: 0, failedInitiatives: [] };
	}

	let retriedCount = 0;
	const failedInitiatives: string[] = [];

	// Process each blocking failed feature
	for (const feature of blockingFailedFeatures) {
		if (shouldRetryFailedFeature(feature, DEFAULT_MAX_RETRIES)) {
			// Retry this feature
			const newRetryCount = (feature.retry_count ?? 0) + 1;
			log(
				`\n🔄 Retrying failed feature #${feature.id} (attempt ${newRetryCount}/${DEFAULT_MAX_RETRIES})`,
			);

			resetFailedFeatureForRetry(feature, manifest);
			retriedCount++;

			// Emit event for UI visibility
			emitOrchestratorEvent(
				"feature_retry",
				`Retrying feature #${feature.id} after deadlock detection`,
				{
					featureId: feature.id,
					retryCount: newRetryCount,
					maxRetries: DEFAULT_MAX_RETRIES,
				},
			);
		} else {
			// Max retries exceeded - mark initiative as failed
			const initiative = manifest.initiatives.find(
				(i) => i.id === feature.initiative_id,
			);
			if (initiative && initiative.status !== "failed") {
				log(
					`\n❌ Max retries exceeded for feature #${feature.id} - marking initiative ${initiative.id} as failed`,
				);
				transitionInitiativeStatus(initiative, manifest, "failed", {
					reason: `deadlock recovery: max retries exceeded for feature #${feature.id}`,
					skipSave: true, // batch save by caller
				});
				failedInitiatives.push(initiative.id);

				// Emit event for UI visibility
				emitOrchestratorEvent(
					"initiative_failed",
					`Initiative ${initiative.id} marked as failed due to feature #${feature.id} exhausting retries`,
					{
						initiativeId: initiative.id,
						featureId: feature.id,
						retryCount: feature.retry_count ?? 0,
					},
				);
			}
		}
	}

	return { retriedCount, failedInitiatives };
}

// ============================================================================
// Deadlock Detection
// ============================================================================

/**
 * Detect and handle deadlock conditions in the orchestrator.
 *
 * A deadlock occurs when:
 * 1. All sandboxes are idle (not busy)
 * 2. No features can be assigned (getNextAvailableFeature returns null)
 * 3. Failed features exist that are blocking other features
 *
 * When deadlock is detected, this function will:
 * - Identify failed features that are blocking the queue
 * - Retry failed features up to DEFAULT_MAX_RETRIES times
 * - On max retries exceeded: mark the initiative as failed
 *
 * @param instances - All sandbox instances
 * @param manifest - The spec manifest
 * @param uiEnabled - Whether UI mode is enabled
 * @returns Object with { shouldExit: boolean, retriedCount: number, failedInitiatives: string[] }
 */
export function detectAndHandleDeadlock(
	instances: SandboxInstance[],
	manifest: SpecManifest,
	uiEnabled: boolean,
): DeadlockResult {
	const { log } = createLogger(uiEnabled);

	// Check condition 1: All sandboxes are idle (not busy)
	const busySandboxes = instances.filter((i) => i.status === "busy");
	if (busySandboxes.length > 0) {
		// Not a deadlock - work is still in progress
		return { shouldExit: false, retriedCount: 0, failedInitiatives: [] };
	}

	// Check condition 2: No features can be assigned
	const nextFeature = getNextAvailableFeature(manifest, uiEnabled);
	if (nextFeature !== null) {
		// Not a deadlock - there's work available
		return { shouldExit: false, retriedCount: 0, failedInitiatives: [] };
	}

	// Bug fix #1782: Check for phantom-completed features first
	// These are features where tasks_completed >= task_count but status is still "in_progress"
	// Recovering these can unblock dependents and prevent false deadlocks
	const busySandboxLabels = new Set(
		instances.filter((i) => i.status === "busy").map((i) => i.label),
	);

	const phantomResult = recoverPhantomCompletedFeatures(
		manifest,
		busySandboxLabels,
		instances,
		log,
		"deadlock_detection",
	);

	if (phantomResult.recoveredCount > 0) {
		log(
			`\n✅ [DEADLOCK_RECOVERY] Recovered ${phantomResult.recoveredCount} phantom-completed feature(s) - continuing work loop`,
		);

		// Return early - recovering phantom completions may unblock other features
		return {
			shouldExit: false,
			retriedCount: phantomResult.recoveredCount,
			failedInitiatives: [],
		};
	}

	// Bug fix #1948: Check for orphaned in_progress features
	// These are features stuck in in_progress with assigned_sandbox set
	// but the sandbox is idle/not actually running them
	const orphanedFeatures = manifest.feature_queue.filter((f) => {
		if (f.status !== "in_progress" || !f.assigned_sandbox) return false;

		const assignedSandbox = instances.find(
			(i) => i.label === f.assigned_sandbox,
		);
		if (!assignedSandbox) return true; // Sandbox doesn't exist at all

		// Feature is orphaned if sandbox is not busy or running a different feature
		return (
			assignedSandbox.status !== "busy" ||
			assignedSandbox.currentFeature !== f.id
		);
	});

	if (orphanedFeatures.length > 0) {
		log(
			`\n🔮 [ORPHANED_FEATURE] Detected ${orphanedFeatures.length} orphaned in_progress feature(s):`,
		);

		let resetCount = 0;

		for (const feature of orphanedFeatures) {
			log(
				`   #${feature.id}: assigned to ${feature.assigned_sandbox} but not running`,
			);

			if (shouldRetryFailedFeature(feature, DEFAULT_MAX_RETRIES)) {
				feature.retry_count = (feature.retry_count ?? 0) + 1;
				feature.error = `Orphaned in_progress feature reset (attempt ${feature.retry_count}/${DEFAULT_MAX_RETRIES})`;
				const previousSandbox = feature.assigned_sandbox;
				transitionFeatureStatus(feature, manifest, "pending", {
					reason: "orphaned in_progress feature reset",
					skipSave: true, // batch save below
				});
				resetCount++;

				log(
					`   ✅ Reset to pending for reassignment (retry ${feature.retry_count}/${DEFAULT_MAX_RETRIES})`,
				);

				emitOrchestratorEvent(
					"orphaned_feature_reset",
					`Feature #${feature.id} orphaned in_progress reset to pending`,
					{
						featureId: feature.id,
						retryCount: feature.retry_count,
						maxRetries: DEFAULT_MAX_RETRIES,
						previousSandbox,
					},
				);
			} else {
				feature.error = `Orphaned in_progress feature - max retries (${DEFAULT_MAX_RETRIES}) exceeded`;
				transitionFeatureStatus(feature, manifest, "failed", {
					reason: "orphaned feature max retries exceeded",
					skipSave: true, // batch save below
				});

				log("   ❌ Max retries exceeded - marked as failed");

				emitOrchestratorEvent(
					"orphaned_feature_failed",
					`Feature #${feature.id} orphaned - max retries exceeded`,
					{
						featureId: feature.id,
						retryCount: feature.retry_count ?? 0,
						maxRetries: DEFAULT_MAX_RETRIES,
					},
				);
			}
		}

		saveManifest(manifest);

		return {
			shouldExit: false,
			retriedCount: resetCount,
			failedInitiatives: [],
		};
	}

	// Check condition 3: Failed features exist
	const failedFeatures = manifest.feature_queue.filter(
		(f) => f.status === "failed",
	);
	if (failedFeatures.length === 0) {
		// Not a deadlock - no failed features, just blocked or completed
		return { shouldExit: false, retriedCount: 0, failedInitiatives: [] };
	}

	// Get failed features that are blocking assignable features
	const blockingFailedFeatures = getBlockingFailedFeatures(manifest);

	// Bug fix #1858: Even if no features are explicitly "blocking", we should
	// still retry ANY failed features with retries remaining when there's no work.
	// This breaks deadlock cycles where sandboxes are idle with retryable failed features.
	if (blockingFailedFeatures.length === 0) {
		// Check if any failed features can be retried
		const retryableFailedFeatures = failedFeatures.filter((f) =>
			shouldRetryFailedFeature(f, DEFAULT_MAX_RETRIES),
		);

		if (retryableFailedFeatures.length > 0) {
			log(
				`\n⚠️ No blocking failed features, but ${retryableFailedFeatures.length} failed feature(s) can be retried:`,
			);
			let retriedCount = 0;

			for (const feature of retryableFailedFeatures) {
				const newRetryCount = (feature.retry_count ?? 0) + 1;
				log(
					`   🔄 Retrying feature #${feature.id} (attempt ${newRetryCount}/${DEFAULT_MAX_RETRIES})`,
				);
				resetFailedFeatureForRetry(feature, manifest);
				retriedCount++;

				// Emit event for UI visibility
				emitOrchestratorEvent(
					"feature_retry",
					`Retrying feature #${feature.id} from deadlock recovery`,
					{
						featureId: feature.id,
						retryCount: newRetryCount,
						maxRetries: DEFAULT_MAX_RETRIES,
					},
				);
			}

			saveManifest(manifest);
			log(`\n✅ Retried ${retriedCount} feature(s) - continuing work loop`);
			return { shouldExit: false, retriedCount, failedInitiatives: [] };
		}

		// Failed features exist but none can be retried - not a critical deadlock
		log(
			"\n⚠️ Deadlock check: Failed features exist but none can be retried (max retries exceeded)",
		);
		return { shouldExit: false, retriedCount: 0, failedInitiatives: [] };
	}

	// Deadlock detected! Log and handle it.
	log("\n🚨 Deadlock detected!");
	log(`   All ${instances.length} sandboxes are idle`);
	log("   No features can be assigned");
	log(`   ${blockingFailedFeatures.length} failed feature(s) blocking queue:`);
	for (const feature of blockingFailedFeatures) {
		const retryCount = feature.retry_count ?? 0;
		log(
			`   - #${feature.id}: ${feature.title} (retries: ${retryCount}/${DEFAULT_MAX_RETRIES})`,
		);
	}

	// Handle blocking failed features
	const { retriedCount, failedInitiatives } = handleBlockingFailedFeatures(
		manifest,
		log,
	);

	// Save manifest with updates
	saveManifest(manifest);

	// Determine if we should exit
	// Exit if: all blocking features have exhausted retries (no features were retried)
	const shouldExit = retriedCount === 0;

	if (shouldExit) {
		log("\n❌ All blocking features have exhausted retries - exiting");
		log(`   Failed initiatives: ${failedInitiatives.join(", ") || "(none)"}`);
	} else {
		log(`\n✅ Retried ${retriedCount} feature(s) - continuing work loop`);
	}

	return { shouldExit, retriedCount, failedInitiatives };
}
