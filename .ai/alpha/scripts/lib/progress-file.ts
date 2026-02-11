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
import {
	ProgressFileDataSchema,
	safeParseProgress,
} from "./schemas/index.js";

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
 * Known terminal statuses that agents may write to the progress file.
 * These indicate the agent has finished (successfully or partially) and
 * should NOT be treated as "in_progress".
 *
 * Maps non-standard status -> valid orchestrator status.
 */
const TERMINAL_STATUS_REMAPPING: Record<string, ValidProgressStatus> = {
	// Bug fix #1952: GPT agents write "blocked" when a task is blocked
	blocked: "failed",
	// Bug fix #2048: GPT agents write "context_limit" when context window exhausted
	// Treat as completed since the agent exited cleanly with partial work committed
	context_limit: "completed",
	// Other known terminal statuses that GPT or future agents might write
	partial: "completed",
	context_exceeded: "completed",
	done: "completed",
	error: "failed",
	aborted: "failed",
	timed_out: "failed",
};

/**
 * Validate and normalize a progress file status value.
 *
 * TypeScript unions are erased at runtime. External agents can write any
 * string to the progress file. This function ensures only valid statuses
 * propagate into the orchestrator.
 *
 * Remapping rules:
 * - Known terminal statuses -> mapped to appropriate valid status (see TERMINAL_STATUS_REMAPPING)
 * - Unknown values -> "failed" (safe fallback; "in_progress" is dangerous as it causes retry loops)
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

	if (typeof rawStatus === "string" && rawStatus in TERMINAL_STATUS_REMAPPING) {
		const mapped = TERMINAL_STATUS_REMAPPING[rawStatus]!;
		console.warn(
			`[STATUS_VALIDATION] Remapping "${rawStatus}" -> "${mapped}" (agent wrote non-orchestrator status)`,
		);
		return mapped;
	}

	// Bug fix #2048: Default to "failed" instead of "in_progress"
	// "in_progress" default caused infinite retry loops when agents wrote unknown statuses
	// "failed" is safer: feature gets retried rather than waiting forever
	console.warn(
		`[STATUS_VALIDATION] Unknown progress status "${String(rawStatus)}" -> defaulting to "failed"`,
	);
	return "failed";
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
	/** Feature ID for recovery validation (Bug fix #2063) */
	feature_id?: string;
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
		const validated = safeParseProgress(
			ProgressFileDataSchema,
			raw,
			"readProgressFile",
		);
		const data: ProgressFileData = {
			...validated,
			status: validateProgressStatus(validated.status),
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
