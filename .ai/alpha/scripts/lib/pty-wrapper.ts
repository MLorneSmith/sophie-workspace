/**
 * PTY Timeout Wrapper Module
 *
 * Provides a timeout-aware wrapper for ptyHandle.wait() with progress file
 * fallback recovery. When the PTY connection to an E2B sandbox disconnects
 * or times out, this module checks the sandbox's progress file to determine
 * if the feature actually completed successfully.
 *
 * Bug fix #1767: Dual-channel completion detection with timeout
 *
 * Problem: PTY wait() hangs indefinitely after sandbox completes, leaving
 * manifest stale and blocking dependent features.
 *
 * Solution: Wrap ptyHandle.wait() with configurable timeout. On timeout,
 * check progress file as source of truth for completion status.
 */

import type { Sandbox } from "@e2b/code-interpreter";

import {
	PTY_RECOVERY_POLL_INTERVAL_MS,
	PTY_WAIT_TIMEOUT_MS,
} from "../config/index.js";
import {
	isFeatureCompleted,
	isProgressFileStale,
	readProgressFile,
	type ProgressFileData,
} from "./progress-file.js";

// ============================================================================
// Types
// ============================================================================

/**
 * PTY handle interface - matches the E2B SDK PTY handle.
 */
export interface PTYHandle {
	pid: number;
	wait: () => Promise<{
		exitCode: number;
		error?: string;
		stdout: string;
		stderr: string;
	}>;
}

/**
 * Error thrown when PTY times out and recovery fails.
 */
export class PTYTimeoutError extends Error {
	public readonly sandboxId: string;
	public readonly progressState: ProgressFileData | null;
	public readonly timeoutMs: number;

	constructor(
		sandboxId: string,
		progressState: ProgressFileData | null,
		timeoutMs: number,
		reason: string,
	) {
		super(`PTY timeout on sandbox ${sandboxId}: ${reason}`);
		this.name = "PTYTimeoutError";
		this.sandboxId = sandboxId;
		this.progressState = progressState;
		this.timeoutMs = timeoutMs;
	}
}

/**
 * Result of waitWithTimeout indicating whether recovery was used.
 */
export interface WaitWithTimeoutResult {
	/** Exit code from PTY or simulated from recovery */
	exitCode: number;
	/** Whether PTY wait completed normally */
	normalCompletion: boolean;
	/** Whether recovery via progress file was triggered */
	recoveredViaProgressFile: boolean;
	/** Progress file data if recovery was used */
	progressData?: ProgressFileData;
	/** Whether the feature is still running (heartbeat is recent) */
	stillRunning?: boolean;
}

// ============================================================================
// Telemetry Tracking
// ============================================================================

/**
 * Simple telemetry counters for monitoring PTY timeout behavior.
 * In a production environment, these would be sent to a metrics system.
 */
export const ptyTelemetry = {
	totalWaits: 0,
	normalCompletions: 0,
	timeouts: 0,
	recoveredViaProgressFile: 0,
	recoveryFailed: 0,
};

/**
 * Reset telemetry counters (primarily for testing).
 */
export function resetPtyTelemetry(): void {
	ptyTelemetry.totalWaits = 0;
	ptyTelemetry.normalCompletions = 0;
	ptyTelemetry.timeouts = 0;
	ptyTelemetry.recoveredViaProgressFile = 0;
	ptyTelemetry.recoveryFailed = 0;
}

// ============================================================================
// PTY Wait with Timeout
// ============================================================================

/**
 * Wait for PTY to complete with timeout and progress file fallback.
 *
 * This function wraps ptyHandle.wait() with a configurable timeout. When the
 * timeout fires, it checks the sandbox's progress file to determine if the
 * feature actually completed successfully:
 *
 * - If progress file shows status: "completed" → Treat as successful
 * - If progress file shows status: "in_progress" → Throw error (stuck)
 * - If progress file is stale or missing → Throw error (sandbox crashed)
 *
 * @param ptyHandle - The PTY handle from E2B sandbox.pty.create()
 * @param sandbox - The E2B sandbox instance for progress file access
 * @param timeoutMs - Timeout in milliseconds (default: PTY_WAIT_TIMEOUT_MS)
 * @returns Result indicating completion status and whether recovery was used
 * @throws PTYTimeoutError if timeout fires and recovery fails
 */
export async function waitWithTimeout(
	ptyHandle: PTYHandle,
	sandbox: Sandbox,
	timeoutMs: number = PTY_WAIT_TIMEOUT_MS,
): Promise<WaitWithTimeoutResult> {
	ptyTelemetry.totalWaits++;

	// Create timeout promise
	const timeoutPromise = new Promise<never>((_resolve, reject) => {
		setTimeout(() => {
			reject(new Error("PTY_WAIT_TIMEOUT"));
		}, timeoutMs);
	});

	try {
		// Race PTY wait against timeout
		const result = await Promise.race([ptyHandle.wait(), timeoutPromise]);

		// Normal completion - PTY finished before timeout
		ptyTelemetry.normalCompletions++;
		return {
			exitCode: result.exitCode,
			normalCompletion: true,
			recoveredViaProgressFile: false,
		};
	} catch (error) {
		// Check if this is our timeout error
		if (error instanceof Error && error.message === "PTY_WAIT_TIMEOUT") {
			ptyTelemetry.timeouts++;
			return await attemptProgressFileRecovery(sandbox, timeoutMs);
		}

		// Re-throw other errors
		throw error;
	}
}

// ============================================================================
// Progress File Recovery
// ============================================================================

/**
 * Attempt to recover from PTY timeout using progress file.
 *
 * When PTY times out, this function checks the sandbox's progress file
 * to determine the actual completion status. This is the fallback mechanism
 * that prevents manifest stalls when PTY disconnects after completion.
 *
 * @param sandbox - The E2B sandbox instance
 * @param timeoutMs - The timeout that was used (for error reporting)
 * @returns Result if recovery succeeds
 * @throws PTYTimeoutError if recovery fails
 */
async function attemptProgressFileRecovery(
	sandbox: Sandbox,
	timeoutMs: number,
): Promise<WaitWithTimeoutResult> {
	const sandboxId = sandbox.sandboxId;

	// Poll progress file (allow brief delay for final write)
	await sleep(PTY_RECOVERY_POLL_INTERVAL_MS);

	const progressResult = await readProgressFile(sandbox);

	// Case 1: Progress file doesn't exist or can't be read
	if (!progressResult.success || !progressResult.data) {
		ptyTelemetry.recoveryFailed++;
		throw new PTYTimeoutError(
			sandboxId,
			null,
			timeoutMs,
			`Progress file unavailable: ${progressResult.error}`,
		);
	}

	const progressData = progressResult.data;

	// Case 2: Progress file is stale (sandbox may have crashed)
	if (isProgressFileStale(progressData)) {
		ptyTelemetry.recoveryFailed++;
		throw new PTYTimeoutError(
			sandboxId,
			progressData,
			timeoutMs,
			`Progress file heartbeat is stale (last: ${progressData.last_heartbeat})`,
		);
	}

	// Case 3: Feature completed successfully - recover!
	if (isFeatureCompleted(progressData)) {
		ptyTelemetry.recoveredViaProgressFile++;
		return {
			exitCode: 0, // Simulate successful exit
			normalCompletion: false,
			recoveredViaProgressFile: true,
			progressData,
		};
	}

	// Case 4: Feature is still in progress with recent heartbeat - NOT stuck, still running
	// Bug fix #1786: Don't throw error when heartbeat is recent - feature is actively working
	// The caller should handle stillRunning=true by continuing to wait or extending timeout
	// Note: At this point, we already know heartbeat is NOT stale (checked in Case 2 above)
	// So this is a feature actively working with recent heartbeats - we should NOT interrupt it
	// Heartbeat is recent - Claude is still working, don't interrupt
	// Return a result indicating the feature is still running
	return {
		exitCode: -1, // Signal "still running"
		normalCompletion: false,
		recoveredViaProgressFile: false,
		progressData,
		stillRunning: true,
	};
}

// ============================================================================
// Utility
// ============================================================================

/**
 * Sleep utility for recovery polling delay.
 */
function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
