/**
 * Recovery Coordinator Module
 *
 * Centralized recovery manager for the Alpha orchestrator.
 * This is the SOLE entry point for all feature recovery operations,
 * replacing 7 independent, uncoordinated recovery paths that caused
 * concurrent state modification and retry count inflation.
 *
 * Key design:
 * - Per-feature in-memory mutex prevents concurrent recovery of the same feature
 * - Atomic 6-step sequence: acquire lock → kill process → clear progress → increment retry → check budget → release lock
 * - Source tracking for telemetry (health_check, promise_timeout, sandbox_death, etc.)
 * - Idempotent: first caller wins, subsequent callers return early
 *
 * Bug fix #2077: Replaces distributed recovery in health.ts, work-loop.ts, deadlock-handler.ts
 * See diagnosis #2076 for full analysis of the 7 competing recovery paths.
 */

import type {
	FeatureEntry,
	AgentProvider,
	SandboxInstance,
	SpecManifest,
} from "../types/index.js";
import { transitionFeatureStatus } from "./feature-transitions.js";
import { killClaudeProcess } from "./health.js";
import { saveManifest } from "./manifest.js";
import { DEFAULT_MAX_RETRIES, shouldRetryFailedFeature } from "./work-queue.js";

// ============================================================================
// Types
// ============================================================================

/** Source identifiers for recovery callers */
export type RecoverySource =
	| "health_check"
	| "promise_timeout"
	| "sandbox_death"
	| "preemptive_restart"
	| "sandbox_expired"
	| "deadlock_blocking"
	| "deadlock_retryable"
	| "deadlock_orphaned"
	| "stuck_task";

export interface RecoveryResult {
	/** Whether recovery was executed (false if already being recovered) */
	executed: boolean;
	/** Whether the feature will be retried (pending) or is permanently failed */
	willRetry: boolean;
	/** Current retry count after recovery */
	retryCount: number;
	/** The source that triggered this recovery */
	source: RecoverySource;
}

interface RecoveryTelemetryEntry {
	featureId: string;
	source: RecoverySource;
	timestamp: number;
	willRetry: boolean;
	retryCount: number;
}

export interface RecoveryTelemetry {
	totalRecoveries: number;
	bySource: Record<RecoverySource, number>;
	entries: RecoveryTelemetryEntry[];
}

// ============================================================================
// RecoveryCoordinator
// ============================================================================

export class RecoveryCoordinator {
	/** Per-feature mutex: prevents concurrent recovery of the same feature */
	private locks = new Map<string, Promise<void>>();

	/** Telemetry tracking */
	private telemetryEntries: RecoveryTelemetryEntry[] = [];
	private sourceCounts: Partial<Record<RecoverySource, number>> = {};

	private manifest: SpecManifest;
	private instances: SandboxInstance[];
	private uiEnabled: boolean;
	private provider: AgentProvider;
	private log: (...args: unknown[]) => void;

	constructor(
		manifest: SpecManifest,
		instances: SandboxInstance[],
		uiEnabled: boolean,
		provider: AgentProvider,
		log?: (...args: unknown[]) => void,
	) {
		this.manifest = manifest;
		this.instances = instances;
		this.uiEnabled = uiEnabled;
		this.provider = provider;
		this.log = log ?? ((..._args: unknown[]) => {});
	}

	/**
	 * Recover a single feature. This is the SOLE entry point for feature recovery.
	 *
	 * If another caller is already recovering this feature (lock held), returns
	 * early with `executed: false`. The first caller wins.
	 *
	 * 6-step atomic sequence:
	 * 1. Acquire per-feature lock (return early if already locked)
	 * 2. Kill agent process on sandbox
	 * 3. Clear progress file
	 * 4. Increment retry_count (ONCE)
	 * 5. Check retry budget → pending or failed
	 * 6. Release lock
	 *
	 * @param featureId - The feature ID to recover
	 * @param reason - Human-readable reason for recovery
	 * @param source - Which recovery system triggered this
	 * @param options - Optional overrides
	 */
	async recoverFeature(
		featureId: string,
		reason: string,
		source: RecoverySource,
		options?: {
			/** Skip process kill (e.g., sandbox already dead) */
			skipKill?: boolean;
			/** Skip retry increment (e.g., infrastructure reset) */
			skipRetryIncrement?: boolean;
		},
	): Promise<RecoveryResult> {
		// Step 1: Acquire per-feature lock
		const existingLock = this.locks.get(featureId);
		if (existingLock) {
			// Another caller is already recovering this feature — wait and return early
			this.log(
				`   🔒 [RECOVERY] Feature #${featureId}: already being recovered (source: ${source}), waiting...`,
			);
			await existingLock;

			// Return the result based on current feature state
			const feature = this.findFeature(featureId);
			return {
				executed: false,
				willRetry: feature?.status === "pending",
				retryCount: feature?.retry_count ?? 0,
				source,
			};
		}

		// Create lock promise
		let releaseLock!: () => void;
		const lockPromise = new Promise<void>((resolve) => {
			releaseLock = resolve;
		});
		this.locks.set(featureId, lockPromise);

		try {
			const feature = this.findFeature(featureId);
			if (!feature) {
				this.log(`   ⚠️ [RECOVERY] Feature #${featureId} not found in manifest`);
				return {
					executed: true,
					willRetry: false,
					retryCount: 0,
					source,
				};
			}

			// Skip if feature is already completed or not in a recoverable state
			if (feature.status === "completed") {
				this.log(
					`   ℹ️ [RECOVERY] Feature #${featureId} already completed, skipping recovery`,
				);
				return {
					executed: true,
					willRetry: false,
					retryCount: feature.retry_count ?? 0,
					source,
				};
			}

			this.log(
				`   🔄 [RECOVERY] Feature #${featureId}: recovering (source: ${source}, reason: ${reason})`,
			);

			// Step 2: Kill agent process
			if (!options?.skipKill) {
				const sandboxInstance = this.findSandboxForFeature(feature);
				if (sandboxInstance) {
					await killClaudeProcess(
						sandboxInstance,
						this.uiEnabled,
						this.provider,
					);
				}
			}

			// Step 3 & 4: Increment retry count and check budget
			const currentRetryCount = feature.retry_count ?? 0;
			let willRetry: boolean;

			if (options?.skipRetryIncrement) {
				// Infrastructure reset — don't consume retry budget
				feature.retry_reason = "infrastructure_reset";
				feature.error = `${reason} (infrastructure reset, retry not consumed)`;
				willRetry = true;

				transitionFeatureStatus(feature, this.manifest, "pending", {
					reason: `recovery (${source}): ${reason}`,
					skipSave: true,
				});

				this.log(
					`   🔄 [RECOVERY] Feature #${featureId} reset to pending (infrastructure, no retry consumed)`,
				);
			} else if (shouldRetryFailedFeature(feature, DEFAULT_MAX_RETRIES)) {
				// Step 4: Increment retry count ONCE
				feature.retry_count = currentRetryCount + 1;
				feature.retry_reason = "feature_failure";
				feature.error = `${reason} (attempt ${feature.retry_count}/${DEFAULT_MAX_RETRIES})`;
				willRetry = true;

				// Step 5: Transition to pending for retry
				transitionFeatureStatus(feature, this.manifest, "pending", {
					reason: `recovery (${source}): ${reason}`,
					skipSave: true,
				});

				this.log(
					`   🔄 [RECOVERY] Feature #${featureId} reset to pending (retry ${feature.retry_count}/${DEFAULT_MAX_RETRIES})`,
				);
			} else {
				// Retry budget exhausted — mark as permanently failed
				feature.retry_reason = "feature_failure";
				feature.error = `${reason} - max retries (${DEFAULT_MAX_RETRIES}) exceeded`;
				willRetry = false;

				transitionFeatureStatus(feature, this.manifest, "failed", {
					reason: `recovery (${source}): max retries exceeded`,
					skipSave: true,
				});

				this.log(
					`   ❌ [RECOVERY] Feature #${featureId} marked as FAILED (max retries exceeded)`,
				);
			}

			// Clear sandbox assignment
			const sandboxInstance = this.findSandboxForFeature(feature);
			if (sandboxInstance) {
				sandboxInstance.status = "ready";
				sandboxInstance.currentFeature = null;
				sandboxInstance.featureStartedAt = undefined;
				sandboxInstance.lastProgressSeen = undefined;
				sandboxInstance.lastHeartbeat = undefined;
				sandboxInstance.outputLineCount = 0;
				sandboxInstance.hasReceivedOutput = false;
			}

			// Save manifest once after all mutations
			saveManifest(this.manifest);

			// Track telemetry
			const retryCount = feature.retry_count ?? 0;
			this.trackTelemetry(featureId, source, willRetry, retryCount);

			return {
				executed: true,
				willRetry,
				retryCount,
				source,
			};
		} finally {
			// Step 6: Release lock
			this.locks.delete(featureId);
			releaseLock();
		}
	}

	/**
	 * Get recovery telemetry for observability.
	 */
	getTelemetry(): RecoveryTelemetry {
		return {
			totalRecoveries: this.telemetryEntries.length,
			bySource: { ...this.sourceCounts } as Record<RecoverySource, number>,
			entries: [...this.telemetryEntries],
		};
	}

	// ==========================================================================
	// Internal Helpers
	// ==========================================================================

	private findFeature(featureId: string): FeatureEntry | undefined {
		return this.manifest.feature_queue.find((f) => f.id === featureId);
	}

	private findSandboxForFeature(
		feature: FeatureEntry,
	): SandboxInstance | undefined {
		if (!feature.assigned_sandbox) return undefined;
		return this.instances.find((i) => i.label === feature.assigned_sandbox);
	}

	private trackTelemetry(
		featureId: string,
		source: RecoverySource,
		willRetry: boolean,
		retryCount: number,
	): void {
		this.telemetryEntries.push({
			featureId,
			source,
			timestamp: Date.now(),
			willRetry,
			retryCount,
		});
		this.sourceCounts[source] = (this.sourceCounts[source] ?? 0) + 1;
	}
}
