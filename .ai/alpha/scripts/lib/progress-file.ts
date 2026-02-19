/**
 * Progress File Utilities Module
 *
 * Provides utilities for reading and validating sandbox progress files.
 * Used for PTY timeout recovery when ptyHandle.wait() hangs but the
 * sandbox has actually completed its work.
 *
 * Bug fix #1767: Dual-channel completion detection with timeout
 */

import type { Sandbox } from "@e2b/code-interpreter";

import {
	PROGRESS_FILE,
	PROGRESS_FILE_STALE_THRESHOLD_MS,
	WORKSPACE_DIR,
} from "../config/index.js";

// ============================================================================
// Status Validation
// ============================================================================

/** Valid status values that the orchestrator recognizes from progress files. */
export const VALID_PROGRESS_STATUSES = new Set([
	"in_progress",
	"completed",
	"failed",
] as const);

export type ValidProgressStatus = "in_progress" | "completed" | "failed";

/**
 * Validate and normalize a progress file status value.
 *
 * TypeScript unions are erased at runtime. External agents can write any
 * string to the progress file. This function ensures only valid statuses
 * propagate into the orchestrator.
 *
 * Remapping rules:
 * - "blocked" -> "failed" (Bug fix #1952: prevents unrecoverable state)
 * - Unknown values -> "in_progress" (safe fallback, health checks will catch stuck features)
 */
export function validateProgressStatus(
	rawStatus: unknown,
): ValidProgressStatus {
	if (
		typeof rawStatus === "string" &&
		VALID_PROGRESS_STATUSES.has(rawStatus as ValidProgressStatus)
	) {
		return rawStatus as ValidProgressStatus;
	}

	if (rawStatus === "blocked") {
		console.warn(
			'[STATUS_VALIDATION] Remapping "blocked" -> "failed" (agent wrote non-orchestrator status)',
		);
		return "failed";
	}

	console.warn(
		`[STATUS_VALIDATION] Unknown progress status "${String(rawStatus)}" -> defaulting to "in_progress"`,
	);
	return "in_progress";
}

// ============================================================================
// Types
// ============================================================================

/**
 * Progress file data structure.
 * This represents the sandbox's progress file (.initiative-progress.json)
 * which is the source of truth for feature completion status.
 */
export interface ProgressFileData {
	status: ValidProgressStatus;
	phase: string;
	completed_tasks: string[];
	failed_tasks?: string[];
	total_tasks?: number;
	last_heartbeat: string;
	context_usage_percent?: number;
	current_task?: {
		id: string;
		name: string;
		status: string;
		started_at?: string;
	};
}

/**
 * Result of reading a progress file.
 */
export interface ProgressFileResult {
	success: boolean;
	data: ProgressFileData | null;
	error?: string;
}

// ============================================================================
// Progress File Reading
// ============================================================================

/**
 * Read and parse the progress file from a sandbox.
 *
 * @param sandbox - The E2B sandbox instance
 * @returns The progress file data or null if unavailable
 */
export async function readProgressFile(
	sandbox: Sandbox,
): Promise<ProgressFileResult> {
	try {
		const result = await sandbox.commands.run(
			`cat ${WORKSPACE_DIR}/${PROGRESS_FILE} 2>/dev/null`,
			{ timeoutMs: 5000 },
		);

		if (!result.stdout?.trim()) {
			return {
				success: false,
				data: null,
				error: "Progress file is empty or does not exist",
			};
		}

		const raw = JSON.parse(result.stdout);
		const data: ProgressFileData = {
			...raw,
			status: validateProgressStatus(raw.status),
		};
		return { success: true, data };
	} catch (error) {
		return {
			success: false,
			data: null,
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}

// ============================================================================
// Staleness Detection
// ============================================================================

/**
 * Check if a progress file's heartbeat is stale.
 *
 * A progress file is considered stale if its last_heartbeat is older than
 * PROGRESS_FILE_STALE_THRESHOLD_MS (default: 5 minutes). Stale progress
 * files indicate the sandbox may have crashed or become unresponsive.
 *
 * @param progressData - The progress file data
 * @returns true if the progress file is stale
 */
export function isProgressFileStale(progressData: ProgressFileData): boolean {
	if (!progressData.last_heartbeat) {
		return true; // No heartbeat = stale
	}

	const heartbeatTime = new Date(progressData.last_heartbeat).getTime();
	if (Number.isNaN(heartbeatTime)) {
		return true; // Invalid timestamp = stale
	}

	const age = Date.now() - heartbeatTime;
	return age > PROGRESS_FILE_STALE_THRESHOLD_MS;
}

/**
 * Get the age of the progress file heartbeat in milliseconds.
 *
 * @param progressData - The progress file data
 * @returns Age in milliseconds, or null if heartbeat is invalid
 */
export function getProgressFileAge(
	progressData: ProgressFileData,
): number | null {
	if (!progressData.last_heartbeat) {
		return null;
	}

	const heartbeatTime = new Date(progressData.last_heartbeat).getTime();
	if (Number.isNaN(heartbeatTime)) {
		return null;
	}

	return Date.now() - heartbeatTime;
}

// ============================================================================
// Completion Detection
// ============================================================================

/**
 * Check if the progress file indicates successful completion.
 *
 * This is used for PTY timeout recovery: if ptyHandle.wait() times out
 * but the progress file shows status: "completed", we can safely treat
 * the feature as completed.
 *
 * @param progressData - The progress file data
 * @returns true if the feature completed successfully
 */
export function isFeatureCompleted(progressData: ProgressFileData): boolean {
	return progressData.status === "completed";
}

/**
 * Check if the progress file indicates the feature is still in progress.
 *
 * @param progressData - The progress file data
 * @returns true if the feature is still running
 */
export function isFeatureInProgress(progressData: ProgressFileData): boolean {
	return progressData.status === "in_progress";
}

/**
 * Check if the progress file indicates failure.
 *
 * @param progressData - The progress file data
 * @returns true if the feature failed
 */
export function isFeatureFailed(progressData: ProgressFileData): boolean {
	return progressData.status === "failed";
}
