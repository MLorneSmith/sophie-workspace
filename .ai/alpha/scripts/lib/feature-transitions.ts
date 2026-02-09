/**
 * Feature Transitions Module
 *
 * Centralized state transition management for features and initiatives.
 * This is the ONLY place where feature.status and initiative.status mutations
 * should occur (outside of test fixtures).
 *
 * Replaces 20+ distributed `feature.status = "string"` mutations that were
 * the root cause of 8+ recurring bugs (#1777, #1782, #1786, #1841, #1858,
 * #1938, #1948, #1952).
 *
 * Chore #1955: Centralize feature status transitions
 */

import type {
	FeatureEntry,
	InitiativeEntry,
	SpecManifest,
} from "../types/index.js";
import { saveManifest } from "./manifest.js";

// ============================================================================
// Types
// ============================================================================

export type FeatureStatus = FeatureEntry["status"];
export type InitiativeStatus = InitiativeEntry["status"];

export interface TransitionOptions {
	/** Human-readable reason for the transition (for logging/debugging) */
	reason: string;
	/** Skip saving manifest after transition (caller will save) */
	skipSave?: boolean;
	/** Skip initiative status cascade (caller will handle) */
	skipInitiativeCascade?: boolean;
}

export interface TransitionResult {
	success: boolean;
	previousStatus: string;
	newStatus: string;
	warning?: string;
}

// ============================================================================
// Valid Transition Maps
// ============================================================================

/**
 * Valid feature status transitions.
 *
 * Design decisions:
 * - `completed` is terminal: no transitions out (prevents completed -> pending bugs)
 * - `blocked` can only transition to `failed` or `pending` (fixes #1952 GPT agent bug)
 * - `in_progress -> pending` is allowed for retry/reassignment paths
 * - `failed -> pending` is the only retry path
 */
export const VALID_FEATURE_TRANSITIONS: Record<FeatureStatus, FeatureStatus[]> =
	{
		pending: ["in_progress", "failed"],
		in_progress: ["pending", "completed", "failed"],
		completed: [], // terminal state
		failed: ["pending", "in_progress"], // retry or direct re-assignment
		blocked: ["failed", "pending"], // remap path for agent-written status
	};

export const VALID_INITIATIVE_TRANSITIONS: Record<
	InitiativeStatus,
	InitiativeStatus[]
> = {
	pending: ["in_progress", "completed", "failed"],
	in_progress: ["completed", "failed", "partial", "pending"],
	completed: [], // terminal state
	failed: ["pending"], // retry path
	partial: ["in_progress", "completed", "failed"],
};

// ============================================================================
// Feature Transitions
// ============================================================================

/**
 * Transition a feature to a new status with validation, side effects,
 * initiative cascade, and atomic manifest persistence.
 *
 * @param feature - The feature entry to transition
 * @param manifest - The spec manifest (mutated and saved)
 * @param newStatus - The target status
 * @param options - Transition options (reason, skipSave, etc.)
 * @returns TransitionResult with success/failure and previous/new status
 */
export function transitionFeatureStatus(
	feature: FeatureEntry,
	manifest: SpecManifest,
	newStatus: FeatureStatus,
	options: TransitionOptions,
): TransitionResult {
	const previousStatus = feature.status;

	// Reject transitions TO "blocked" — only allow transitions FROM "blocked"
	if (newStatus === "blocked") {
		console.warn(
			`[TRANSITION_WARN] Rejecting transition to "blocked" for feature ${feature.id} (reason: ${options.reason}). Remapping to "failed". See #1952.`,
		);
		newStatus = "failed";
	}

	// Validate the transition
	const validTargets = VALID_FEATURE_TRANSITIONS[previousStatus];
	if (!validTargets || !validTargets.includes(newStatus)) {
		console.warn(
			`[TRANSITION_WARN] Invalid feature transition: ${feature.id} ${previousStatus} -> ${newStatus} (reason: ${options.reason}). Ignoring.`,
		);
		return {
			success: false,
			previousStatus,
			newStatus: previousStatus,
			warning: `Invalid transition: ${previousStatus} -> ${newStatus}`,
		};
	}

	// Apply the status change
	feature.status = newStatus;

	// Apply side effects based on new status
	if (newStatus === "pending" || newStatus === "failed") {
		feature.assigned_sandbox = undefined;
		feature.assigned_at = undefined;
	}

	if (newStatus === "in_progress" && !feature.assigned_at) {
		feature.assigned_at = Date.now();
	}

	// Cascade initiative status update
	if (!options.skipInitiativeCascade) {
		updateInitiativeStatusFromFeatures(
			feature.initiative_id,
			manifest,
			true, // skipSave — we'll save once at the end
		);
	}

	// Save manifest atomically (once, after all mutations)
	if (!options.skipSave) {
		saveManifest(manifest);
	}

	return {
		success: true,
		previousStatus,
		newStatus,
	};
}

// ============================================================================
// Initiative Transitions
// ============================================================================

/**
 * Transition an initiative to a new status with validation.
 *
 * Use this for direct initiative status changes (e.g., deadlock handler
 * marking an initiative as failed). For status changes derived from
 * feature completions, use updateInitiativeStatusFromFeatures() instead.
 *
 * @param initiative - The initiative entry to transition
 * @param manifest - The spec manifest
 * @param newStatus - The target status
 * @param options - Transition options
 * @returns TransitionResult
 */
export function transitionInitiativeStatus(
	initiative: InitiativeEntry,
	manifest: SpecManifest,
	newStatus: InitiativeStatus,
	options: TransitionOptions,
): TransitionResult {
	const previousStatus = initiative.status;

	const validTargets = VALID_INITIATIVE_TRANSITIONS[previousStatus];
	if (!validTargets || !validTargets.includes(newStatus)) {
		console.warn(
			`[TRANSITION_WARN] Invalid initiative transition: ${initiative.id} ${previousStatus} -> ${newStatus} (reason: ${options.reason}). Ignoring.`,
		);
		return {
			success: false,
			previousStatus,
			newStatus: previousStatus,
			warning: `Invalid transition: ${previousStatus} -> ${newStatus}`,
		};
	}

	initiative.status = newStatus;

	if (!options.skipSave) {
		saveManifest(manifest);
	}

	return {
		success: true,
		previousStatus,
		newStatus,
	};
}

/**
 * Update an initiative's status based on its features' current states.
 *
 * This replaces the 5+ duplicate implementations of initiative status
 * cascade logic scattered across the codebase.
 *
 * @param initiativeId - The initiative ID to update
 * @param manifest - The spec manifest
 * @param skipSave - If true, caller is responsible for saving
 */
export function updateInitiativeStatusFromFeatures(
	initiativeId: string,
	manifest: SpecManifest,
	skipSave = false,
): void {
	const initiative = manifest.initiatives.find((i) => i.id === initiativeId);
	if (!initiative) return;

	const initFeatures = manifest.feature_queue.filter(
		(f) => f.initiative_id === initiativeId,
	);
	if (initFeatures.length === 0) return;

	const completedCount = initFeatures.filter(
		(f) => f.status === "completed",
	).length;
	const failedCount = initFeatures.filter((f) => f.status === "failed").length;

	initiative.features_completed = completedCount;

	if (initFeatures.every((f) => f.status === "completed")) {
		initiative.status = "completed";
	} else if (completedCount > 0 || failedCount > 0) {
		initiative.status = "in_progress";
	} else {
		// All pending — keep as pending (or don't change if already in_progress)
		if (initiative.status === "completed" || initiative.status === "failed") {
			// Don't regress from terminal states via cascade
		} else if (initiative.status !== "in_progress") {
			initiative.status = "pending";
		}
	}

	if (!skipSave) {
		saveManifest(manifest);
	}
}
