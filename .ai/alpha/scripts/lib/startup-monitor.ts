/**
 * Startup Monitoring Module
 *
 * Provides utilities for detecting startup hangs in Claude Code CLI
 * and managing retry logic with exponential backoff.
 */

import {
	MIN_STARTUP_OUTPUT_BYTES,
	MIN_STARTUP_OUTPUT_LINES,
	STARTUP_RETRY_DELAYS_MS,
	STARTUP_TIMEOUT_MS,
} from "../config/index.js";
import type { StartupConfig, StartupMonitorResult } from "../types/index.js";

// ============================================================================
// Startup Configuration
// ============================================================================

/**
 * Default startup configuration for Claude Code CLI.
 */
export const DEFAULT_STARTUP_CONFIG: StartupConfig = {
	timeoutMs: STARTUP_TIMEOUT_MS,
	retryDelays: STARTUP_RETRY_DELAYS_MS,
	maxRetries: STARTUP_RETRY_DELAYS_MS.length,
	minOutputBytes: MIN_STARTUP_OUTPUT_BYTES,
	minOutputLines: MIN_STARTUP_OUTPUT_LINES,
};

// ============================================================================
// Startup Detection
// ============================================================================

/**
 * Detect if a startup is hung based on output metrics.
 *
 * A startup is considered hung if:
 * - Less than MIN_STARTUP_OUTPUT_LINES lines received
 * - Less than MIN_STARTUP_OUTPUT_BYTES bytes received
 * - AND time since start exceeds the timeout threshold
 *
 * @param outputLineCount - Number of output lines received
 * @param outputByteCount - Number of output bytes received
 * @param timeSinceStartMs - Time since startup began (ms)
 * @param timeoutMs - Timeout threshold (ms)
 * @returns Object indicating if startup is hung and reason
 */
export function detectStartupHang(
	outputLineCount: number,
	outputByteCount: number,
	timeSinceStartMs: number,
	timeoutMs: number = STARTUP_TIMEOUT_MS,
): StartupMonitorResult {
	// If we haven't exceeded the timeout, startup is still in progress
	if (timeSinceStartMs < timeoutMs) {
		return {
			success: true,
			outputBytes: outputByteCount,
			outputLines: outputLineCount,
			elapsedMs: timeSinceStartMs,
		};
	}

	// Check if we have enough output to consider startup successful
	const hasEnoughLines = outputLineCount >= MIN_STARTUP_OUTPUT_LINES;
	const hasEnoughBytes = outputByteCount >= MIN_STARTUP_OUTPUT_BYTES;

	if (hasEnoughLines || hasEnoughBytes) {
		return {
			success: true,
			outputBytes: outputByteCount,
			outputLines: outputLineCount,
			elapsedMs: timeSinceStartMs,
		};
	}

	// Startup is hung - not enough output within timeout period
	return {
		success: false,
		outputBytes: outputByteCount,
		outputLines: outputLineCount,
		elapsedMs: timeSinceStartMs,
		error: `Startup hung: only ${outputLineCount} lines / ${outputByteCount} bytes after ${Math.round(timeSinceStartMs / 1000)}s (expected at least ${MIN_STARTUP_OUTPUT_LINES} lines or ${MIN_STARTUP_OUTPUT_BYTES} bytes)`,
	};
}

// ============================================================================
// Retry Logic
// ============================================================================

/**
 * Calculate the delay before the next retry attempt.
 *
 * @param attemptNumber - Current attempt number (1-based)
 * @param retryDelays - Array of retry delays (ms)
 * @returns Delay in milliseconds, or null if max retries exceeded
 */
export function getRetryDelay(
	attemptNumber: number,
	retryDelays: number[] = STARTUP_RETRY_DELAYS_MS,
): number | null {
	// attemptNumber is 1-based, so attempt 1 means first failure
	// Index into retryDelays is attemptNumber - 1
	const index = attemptNumber - 1;

	if (index >= retryDelays.length) {
		return null; // Max retries exceeded
	}

	return retryDelays[index] ?? null;
}

/**
 * Check if we should retry after a startup failure.
 *
 * @param attemptNumber - Current attempt number (1-based)
 * @param maxRetries - Maximum number of retry attempts
 * @returns Whether to retry
 */
export function shouldRetry(
	attemptNumber: number,
	maxRetries: number = STARTUP_RETRY_DELAYS_MS.length,
): boolean {
	return attemptNumber <= maxRetries;
}

/**
 * Format a startup attempt log message.
 *
 * @param attemptNumber - Current attempt number (1-based)
 * @param maxRetries - Maximum number of retry attempts
 * @param sandboxLabel - Label of the sandbox
 * @param delayMs - Delay before retry (ms), if retrying
 * @returns Formatted log message
 */
export function formatStartupAttemptLog(
	attemptNumber: number,
	maxRetries: number,
	sandboxLabel: string,
	delayMs?: number,
): string {
	if (attemptNumber === 1) {
		return `[STARTUP_ATTEMPT_1] ${sandboxLabel}: Starting Claude CLI (attempt ${attemptNumber}/${maxRetries + 1})`;
	}

	const delayInfo = delayMs ? ` after ${delayMs / 1000}s delay` : "";
	return `[STARTUP_ATTEMPT_${attemptNumber}] ${sandboxLabel}: Retrying Claude CLI${delayInfo} (attempt ${attemptNumber}/${maxRetries + 1})`;
}

/**
 * Format a startup success log message.
 *
 * @param sandboxLabel - Label of the sandbox
 * @param result - Startup monitor result
 * @param attemptNumber - Which attempt succeeded
 * @returns Formatted log message
 */
export function formatStartupSuccessLog(
	sandboxLabel: string,
	result: StartupMonitorResult,
	attemptNumber: number,
): string {
	return `[STARTUP_SUCCESS] ${sandboxLabel}: Claude CLI started successfully on attempt ${attemptNumber} (${result.outputLines} lines, ${result.outputBytes} bytes in ${Math.round(result.elapsedMs / 1000)}s)`;
}

/**
 * Format a startup failure log message.
 *
 * @param sandboxLabel - Label of the sandbox
 * @param result - Startup monitor result
 * @param attemptNumber - Which attempt failed
 * @returns Formatted log message
 */
export function formatStartupFailureLog(
	sandboxLabel: string,
	result: StartupMonitorResult,
	attemptNumber: number,
): string {
	return `[STARTUP_FAILURE] ${sandboxLabel}: Attempt ${attemptNumber} failed - ${result.error || "Unknown error"}`;
}

// ============================================================================
// Output Tracking
// ============================================================================

/**
 * Create an output tracker for monitoring startup progress.
 */
export interface StartupOutputTracker {
	lineCount: number;
	byteCount: number;
	startTime: Date;
	lastOutputTime: Date | null;
}

/**
 * Create a new startup output tracker.
 *
 * @returns New output tracker
 */
export function createStartupOutputTracker(): StartupOutputTracker {
	return {
		lineCount: 0,
		byteCount: 0,
		startTime: new Date(),
		lastOutputTime: null,
	};
}

/**
 * Update an output tracker with new data.
 *
 * @param tracker - The tracker to update
 * @param data - The new output data
 */
export function updateOutputTracker(
	tracker: StartupOutputTracker,
	data: string,
): void {
	tracker.byteCount += Buffer.byteLength(data, "utf8");

	// Count non-empty lines
	const lines = data.split("\n").filter((line) => line.trim().length > 0);
	tracker.lineCount += lines.length;

	if (lines.length > 0) {
		tracker.lastOutputTime = new Date();
	}
}

/**
 * Get the elapsed time since startup began.
 *
 * @param tracker - The output tracker
 * @returns Elapsed time in milliseconds
 */
export function getElapsedTime(tracker: StartupOutputTracker): number {
	return Date.now() - tracker.startTime.getTime();
}

/**
 * Check the startup status based on tracked output.
 *
 * @param tracker - The output tracker
 * @param timeoutMs - Timeout threshold (ms)
 * @returns Startup monitor result
 */
export function checkStartupStatus(
	tracker: StartupOutputTracker,
	timeoutMs: number = STARTUP_TIMEOUT_MS,
): StartupMonitorResult {
	return detectStartupHang(
		tracker.lineCount,
		tracker.byteCount,
		getElapsedTime(tracker),
		timeoutMs,
	);
}
