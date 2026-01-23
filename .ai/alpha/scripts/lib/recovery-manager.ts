/**
 * Recovery Manager Module for Alpha Orchestrator
 *
 * Provides atomic recovery with guaranteed process cleanup before retry.
 * This is the ONLY module responsible for recovering stuck features.
 *
 * Bug fix #1786: Event-driven architecture refactor
 *
 * Recovery Sequence (MUST be followed in order):
 * 1. Kill ALL Claude processes FIRST
 * 2. Wait for processes to fully terminate
 * 3. Clear stale progress file
 * 4. Reset feature state atomically
 * 5. Check retry count
 * 6. Queue for reassignment (if retries remain)
 *
 * The previous code often skipped step 1-2, causing zombie processes to
 * accumulate and sandboxes to hit resource limits.
 */

import type { Sandbox } from "@e2b/code-interpreter";

import { PROGRESS_FILE, WORKSPACE_DIR } from "../config/index.js";
import type {
	FeatureEntry,
	SandboxInstance,
	SpecManifest,
} from "../types/index.js";
import { saveManifest } from "./manifest.js";
import { sleep } from "./utils.js";

// ============================================================================
// Types
// ============================================================================

/**
 * Configuration for the recovery manager.
 */
export interface RecoveryConfig {
	/** Timeout for kill command (ms) - default: 10000 */
	killTimeoutMs: number;

	/** Timeout for process termination wait (ms) - default: 10000 */
	terminationWaitMs: number;

	/** Interval for checking process termination (ms) - default: 1000 */
	terminationCheckIntervalMs: number;

	/** Maximum retry attempts - default: 3 */
	maxRetries: number;

	/** Delay between recovery steps (ms) - default: 2000 */
	recoveryDelayMs: number;
}

/**
 * Result of a recovery attempt.
 */
export interface RecoveryResult {
	/** Whether recovery was successful */
	success: boolean;

	/** Reason for success/failure */
	reason: string;

	/** Whether the feature will be retried */
	willRetry: boolean;

	/** Current retry count */
	retryCount: number;

	/** Whether processes were killed */
	processesKilled: boolean;

	/** Whether progress file was cleared */
	progressCleared: boolean;

	/** Error message if recovery failed */
	error?: string;
}

/**
 * Telemetry for recovery operations.
 */
export interface RecoveryTelemetry {
	/** Total recovery attempts */
	totalRecoveries: number;

	/** Successful recoveries */
	successfulRecoveries: number;

	/** Failed recoveries */
	failedRecoveries: number;

	/** Retries triggered */
	retriesTriggered: number;

	/** Features marked as failed (max retries) */
	featuresMarkedFailed: number;

	/** Process kill failures */
	killFailures: number;
}

// ============================================================================
// Default Configuration
// ============================================================================

/**
 * Default recovery manager configuration.
 */
export const DEFAULT_RECOVERY_CONFIG: RecoveryConfig = {
	killTimeoutMs: 10000,
	terminationWaitMs: 10000,
	terminationCheckIntervalMs: 1000,
	maxRetries: 3,
	recoveryDelayMs: 2000,
};

// ============================================================================
// Recovery Manager Class
// ============================================================================

/**
 * Recovery Manager
 *
 * Handles atomic recovery of stuck features with guaranteed process cleanup.
 * This is the ONLY authority for recovering features in the orchestrator.
 */
export class RecoveryManager {
	private config: RecoveryConfig;
	private telemetry: RecoveryTelemetry = {
		totalRecoveries: 0,
		successfulRecoveries: 0,
		failedRecoveries: 0,
		retriesTriggered: 0,
		featuresMarkedFailed: 0,
		killFailures: 0,
	};

	constructor(config: Partial<RecoveryConfig> = {}) {
		this.config = { ...DEFAULT_RECOVERY_CONFIG, ...config };
	}

	/**
	 * Recover a stuck feature.
	 *
	 * This is the main entry point for recovery. It handles the complete
	 * recovery sequence atomically.
	 *
	 * @param sandbox - The sandbox instance (E2B sandbox)
	 * @param sandboxInstance - The SandboxInstance tracking object
	 * @param feature - The feature to recover
	 * @param manifest - The spec manifest
	 * @returns Recovery result
	 */
	async recoverFeature(
		sandbox: Sandbox,
		sandboxInstance: SandboxInstance,
		feature: FeatureEntry,
		manifest: SpecManifest,
	): Promise<RecoveryResult> {
		this.telemetry.totalRecoveries++;

		const currentRetryCount = feature.retry_count ?? 0;

		// STEP 1: Always kill existing processes FIRST
		const killResult = await this.killAllClaudeProcesses(sandbox);
		if (!killResult.success) {
			this.telemetry.killFailures++;
			// Continue anyway - process might already be dead
		}

		// STEP 2: Wait for processes to fully terminate
		await this.waitForProcessTermination(sandbox);

		// STEP 3: Clear stale progress file
		const clearResult = await this.clearProgressFile(sandbox);

		// STEP 4: Reset feature state atomically
		const newRetryCount = currentRetryCount + 1;
		feature.retry_count = newRetryCount;

		// STEP 5: Check retry count
		if (newRetryCount >= this.config.maxRetries) {
			// Max retries exceeded - mark as permanently failed
			feature.status = "failed";
			feature.error = `Max retries (${this.config.maxRetries}) exceeded during recovery`;
			feature.assigned_sandbox = undefined;
			feature.assigned_at = undefined;

			// Reset sandbox instance
			sandboxInstance.currentFeature = null;
			sandboxInstance.status = "ready";
			sandboxInstance.outputLineCount = 0;
			sandboxInstance.hasReceivedOutput = false;

			saveManifest(manifest);

			this.telemetry.failedRecoveries++;
			this.telemetry.featuresMarkedFailed++;

			return {
				success: true, // Recovery operation completed (feature marked as failed)
				reason: "max_retries_exceeded",
				willRetry: false,
				retryCount: newRetryCount,
				processesKilled: killResult.success,
				progressCleared: clearResult,
			};
		}

		// STEP 6: Queue for reassignment
		feature.status = "pending";
		feature.assigned_sandbox = undefined;
		feature.assigned_at = undefined;
		feature.error = undefined;

		// Reset sandbox instance
		sandboxInstance.currentFeature = null;
		sandboxInstance.status = "ready";
		sandboxInstance.retryCount = (sandboxInstance.retryCount ?? 0) + 1;
		sandboxInstance.featureStartedAt = undefined;
		sandboxInstance.lastProgressSeen = undefined;
		sandboxInstance.lastHeartbeat = undefined;
		sandboxInstance.outputLineCount = 0;
		sandboxInstance.hasReceivedOutput = false;

		saveManifest(manifest);

		this.telemetry.successfulRecoveries++;
		this.telemetry.retriesTriggered++;

		return {
			success: true,
			reason: "queued_for_retry",
			willRetry: true,
			retryCount: newRetryCount,
			processesKilled: killResult.success,
			progressCleared: clearResult,
		};
	}

	/**
	 * Kill ALL Claude processes in a sandbox.
	 *
	 * This kills by name (not PID) to catch all instances including
	 * any zombie processes from previous failed runs.
	 */
	async killAllClaudeProcesses(
		sandbox: Sandbox,
	): Promise<{ success: boolean; error?: string }> {
		try {
			// Kill by name, not PID (catches all instances)
			await sandbox.commands.run(
				"pkill -9 -f 'claude|run-claude' 2>/dev/null || true",
				{ timeoutMs: this.config.killTimeoutMs },
			);

			// Also kill any stuck node processes related to Claude
			await sandbox.commands.run(
				"pkill -9 -f 'node.*claude' 2>/dev/null || true",
				{ timeoutMs: this.config.killTimeoutMs },
			);

			// Small delay to allow signals to be processed
			await sleep(500);

			return { success: true };
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : String(error),
			};
		}
	}

	/**
	 * Wait for all Claude processes to terminate.
	 *
	 * Polls the process list until no Claude processes remain,
	 * up to the configured timeout.
	 */
	async waitForProcessTermination(sandbox: Sandbox): Promise<boolean> {
		const startTime = Date.now();
		const maxWait = this.config.terminationWaitMs;
		const checkInterval = this.config.terminationCheckIntervalMs;

		while (Date.now() - startTime < maxWait) {
			try {
				const result = await sandbox.commands.run(
					"pgrep -f 'claude|run-claude' | wc -l",
					{ timeoutMs: 5000 },
				);

				const count = parseInt(result.stdout.trim(), 10);
				if (count === 0 || Number.isNaN(count)) {
					return true; // All processes terminated
				}
			} catch {
				// Error checking processes - assume terminated
				return true;
			}

			await sleep(checkInterval);
		}

		// Timeout - force kill any remaining processes
		try {
			await sandbox.commands.run(
				"pkill -9 -f 'claude|run-claude' 2>/dev/null || true",
				{ timeoutMs: 5000 },
			);
		} catch {
			// Ignore
		}

		return false;
	}

	/**
	 * Clear the progress file from the sandbox.
	 */
	async clearProgressFile(sandbox: Sandbox): Promise<boolean> {
		try {
			await sandbox.commands.run(`rm -f ${WORKSPACE_DIR}/${PROGRESS_FILE}`, {
				timeoutMs: 5000,
			});
			return true;
		} catch {
			return false;
		}
	}

	/**
	 * Get recovery telemetry.
	 */
	getTelemetry(): RecoveryTelemetry {
		return { ...this.telemetry };
	}

	/**
	 * Reset recovery telemetry.
	 */
	resetTelemetry(): void {
		this.telemetry = {
			totalRecoveries: 0,
			successfulRecoveries: 0,
			failedRecoveries: 0,
			retriesTriggered: 0,
			featuresMarkedFailed: 0,
			killFailures: 0,
		};
	}

	/**
	 * Get the current configuration.
	 */
	getConfig(): RecoveryConfig {
		return { ...this.config };
	}

	/**
	 * Update configuration.
	 */
	updateConfig(config: Partial<RecoveryConfig>): void {
		this.config = { ...this.config, ...config };
	}
}

// ============================================================================
// Singleton Instance
// ============================================================================

/**
 * Global recovery manager instance for the orchestrator.
 */
export const recoveryManager = new RecoveryManager();

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format a recovery result for logging.
 */
export function formatRecoveryResult(
	featureId: string,
	result: RecoveryResult,
): string {
	const icon = result.success ? (result.willRetry ? "🔄" : "❌") : "⚠️";

	if (result.willRetry) {
		return `${icon} [${featureId}] Recovery successful - will retry (attempt ${result.retryCount + 1})`;
	} else if (result.reason === "max_retries_exceeded") {
		return `${icon} [${featureId}] Recovery complete - marked as FAILED (max retries: ${result.retryCount})`;
	} else {
		return `${icon} [${featureId}] Recovery failed: ${result.error || result.reason}`;
	}
}

/**
 * Quick recovery helper - kills processes and clears progress file.
 * Use this for simple cleanup without full state management.
 */
export async function quickCleanup(sandbox: Sandbox): Promise<boolean> {
	const manager = new RecoveryManager();
	const killResult = await manager.killAllClaudeProcesses(sandbox);
	await manager.waitForProcessTermination(sandbox);
	const clearResult = await manager.clearProgressFile(sandbox);
	return killResult.success && clearResult;
}
