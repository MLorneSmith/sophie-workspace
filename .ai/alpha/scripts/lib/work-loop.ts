/**
 * Work Loop Module
 *
 * Manages the main orchestration loop that assigns features to sandboxes.
 * Handles health checks, keepalive, stuck task detection, and deadlock recovery.
 *
 * Extracted from orchestrator.ts as part of refactoring (#1816).
 */

import {
	HEALTH_CHECK_INTERVAL_MS,
	SANDBOX_KEEPALIVE_INTERVAL_MS,
	SANDBOX_KEEPALIVE_STAGGER_MS,
	SANDBOX_MAX_AGE_MS,
} from "../config/index.js";
import type {
	FeatureEntry,
	SandboxInstance,
	SpecManifest,
} from "../types/index.js";
import {
	detectAndHandleDeadlock,
	recoverPhantomCompletedFeatures,
} from "./deadlock-handler.js";
import { runFeatureImplementation } from "./feature.js";
import { runHealthChecks } from "./health.js";
import { saveManifest } from "./manifest.js";
import { writeIdleProgress } from "./progress.js";
import {
	isFeatureCompleted,
	isProgressFileStale,
	readProgressFile,
} from "./progress-file.js";
import {
	createSandbox,
	getSandboxesNeedingRestart,
	keepAliveSandboxes,
} from "./sandbox.js";
import { sleep } from "./utils.js";
import {
	assignFeatureToSandbox,
	getBlockedFeatures,
	getNextAvailableFeature,
} from "./work-queue.js";

// ============================================================================
// Types
// ============================================================================

export interface WorkLoopOptions {
	instances: SandboxInstance[];
	manifest: SpecManifest;
	uiEnabled: boolean;
	timeoutSeconds: number;
	runId?: string;
}

export interface WorkLoopResult {
	completed: boolean;
	featuresCompleted: number;
	featuresFailed: number;
	deadlockDetected: boolean;
}

type Logger = (...args: unknown[]) => void;

// ============================================================================
// Constants
// ============================================================================

/** Threshold for detecting stuck tasks (60 seconds without progress) */
const STUCK_TASK_THRESHOLD_MS = 60_000;

// ============================================================================
// WorkLoop Class
// ============================================================================

/**
 * WorkLoop manages the main orchestration loop.
 *
 * Responsibilities:
 * - Health check management: Periodic sandbox health verification
 * - Keepalive management: Prevent sandbox timeout expiration
 * - Work assignment: Assign available features to idle sandboxes
 * - Stuck task detection: Detect and recover from stuck features
 * - Deadlock handling: Detect and resolve deadlock conditions
 * - Phantom completion: Recover features completed but not marked
 */
export class WorkLoop {
	private instances: SandboxInstance[];
	private manifest: SpecManifest;
	private uiEnabled: boolean;
	private timeoutSeconds: number;
	private runId?: string;

	private activeWork: Map<string, Promise<void>>;
	private healthCheckInterval: ReturnType<typeof setInterval> | null = null;
	private keepaliveInterval: ReturnType<typeof setInterval> | null = null;
	private isRunning = false;
	private log: Logger;

	constructor(options: WorkLoopOptions, log?: Logger) {
		this.instances = options.instances;
		this.manifest = options.manifest;
		this.uiEnabled = options.uiEnabled;
		this.timeoutSeconds = options.timeoutSeconds;
		this.runId = options.runId;
		this.activeWork = new Map();
		this.log = log ?? ((..._args: unknown[]) => {});
	}

	/**
	 * Run the main work loop until all features are complete.
	 */
	async run(): Promise<WorkLoopResult> {
		this.isRunning = true;
		this.startHealthChecks();
		this.startKeepalive();

		let deadlockDetected = false;

		try {
			deadlockDetected = await this.mainLoop();
		} finally {
			this.cleanup();
		}

		const featuresCompleted = this.manifest.feature_queue.filter(
			(f) => f.status === "completed",
		).length;
		const featuresFailed = this.manifest.feature_queue.filter(
			(f) => f.status === "failed",
		).length;

		return {
			completed: !deadlockDetected && featuresFailed === 0,
			featuresCompleted,
			featuresFailed,
			deadlockDetected,
		};
	}

	/**
	 * Stop the work loop gracefully.
	 */
	stop(): void {
		this.isRunning = false;
	}

	// ==========================================================================
	// Health Check Management
	// ==========================================================================

	/**
	 * Start periodic health checks for all sandboxes.
	 */
	private startHealthChecks(): void {
		let healthCheckRunning = false;

		this.healthCheckInterval = setInterval(async () => {
			if (healthCheckRunning) return;
			healthCheckRunning = true;

			try {
				const needsRestart = await runHealthChecks(
					this.instances,
					this.manifest,
					this.uiEnabled,
				);

				for (const instance of needsRestart) {
					if (instance.status === "failed") {
						await this.restartFailedSandbox(instance);
					}
				}
			} catch (error) {
				this.log(
					`   ⚠️ Health check error: ${error instanceof Error ? error.message : error}`,
				);
			} finally {
				healthCheckRunning = false;
			}
		}, HEALTH_CHECK_INTERVAL_MS);
	}

	/**
	 * Restart a sandbox that failed health checks.
	 */
	private async restartFailedSandbox(instance: SandboxInstance): Promise<void> {
		this.log(`   🔄 Attempting to restart failed sandbox ${instance.label}...`);

		try {
			// Kill the old sandbox before creating new one
			try {
				await instance.sandbox.kill();
			} catch {
				// Ignore kill errors - sandbox may already be dead
			}

			const oldSandboxId = instance.id;

			const newInstance = await createSandbox(
				this.manifest,
				instance.label,
				this.timeoutSeconds,
				this.uiEnabled,
				this.runId,
			);

			// Replace the old sandbox with the new one
			this.updateInstanceFromNew(instance, newInstance);

			// Update manifest
			this.updateManifestAfterRestart(oldSandboxId, newInstance.id);

			this.log(
				`   ✅ Sandbox ${instance.label} restarted successfully (restart #${this.manifest.sandbox.restart_count})`,
			);
		} catch (restartError) {
			this.log(
				`   ❌ Failed to restart sandbox ${instance.label}: ${restartError instanceof Error ? restartError.message : restartError}`,
			);
		}
	}

	// ==========================================================================
	// Keepalive Management
	// ==========================================================================

	/**
	 * Start periodic keepalive to prevent sandbox timeout expiration.
	 */
	private startKeepalive(): void {
		let keepaliveRunning = false;

		this.keepaliveInterval = setInterval(async () => {
			if (keepaliveRunning) return;
			keepaliveRunning = true;

			try {
				// First, check for sandboxes approaching max age (preemptive restart)
				await this.handlePreemptiveRestarts();

				// Now do regular keepalive with staggered timing
				const timeoutMs = this.timeoutSeconds * 1000;
				const failed = await keepAliveSandboxes(
					this.instances,
					timeoutMs,
					this.uiEnabled,
					SANDBOX_KEEPALIVE_STAGGER_MS,
				);

				// Handle failed sandboxes - attempt restart
				for (const label of failed) {
					await this.handleExpiredSandbox(label);
				}
			} catch (error) {
				this.log(
					`   ⚠️ Keepalive error: ${error instanceof Error ? error.message : error}`,
				);
			} finally {
				keepaliveRunning = false;
			}
		}, SANDBOX_KEEPALIVE_INTERVAL_MS);
	}

	/**
	 * Handle preemptive restarts for sandboxes approaching max age.
	 */
	private async handlePreemptiveRestarts(): Promise<void> {
		const needsPreemptiveRestart = getSandboxesNeedingRestart(
			this.instances,
			SANDBOX_MAX_AGE_MS,
		);

		for (const label of needsPreemptiveRestart) {
			const instance = this.instances.find((i) => i.label === label);
			if (!instance || instance.status === "failed") continue;

			const ageMinutes = Math.round(
				(Date.now() - instance.createdAt.getTime()) / 60000,
			);

			// Check if feature is almost done (80%+ tasks completed)
			const feature = this.manifest.feature_queue.find(
				(f) => f.assigned_sandbox === label && f.status === "in_progress",
			);

			if (feature && feature.task_count > 0) {
				const percentDone =
					feature.task_count > 0
						? (feature.tasks_completed / feature.task_count) * 100
						: 0;

				if (percentDone >= 80) {
					this.log(
						`   ⏰ Sandbox ${label} is ${ageMinutes}min old, but feature #${feature.id} is ${Math.round(percentDone)}% done - skipping preemptive restart`,
					);
					continue;
				}
			}

			this.log(
				`   ⏰ Sandbox ${label} is ${ageMinutes}min old, performing preemptive restart...`,
			);

			// Reset any in-progress feature assigned to this sandbox
			if (feature) {
				await this.gracefulShutdownClaude(instance);
				this.resetFeatureForReassignment(
					feature,
					"Preemptive restart before expiration",
				);
			}

			await this.restartSandbox(instance, label);
		}
	}

	/**
	 * Handle a sandbox that has expired during keepalive.
	 */
	private async handleExpiredSandbox(label: string): Promise<void> {
		const instance = this.instances.find((i) => i.label === label);
		if (!instance || instance.status === "failed") return;

		this.log(`   ⚠️ Sandbox ${label} expired, attempting restart...`);

		// Reset any in-progress feature assigned to this sandbox
		const feature = this.manifest.feature_queue.find(
			(f) => f.assigned_sandbox === label && f.status === "in_progress",
		);
		if (feature) {
			this.resetFeatureForReassignment(feature, "Sandbox expired - restarting");
		}

		await this.restartSandbox(instance, label);
	}

	/**
	 * Attempt graceful shutdown of Claude Code before restart.
	 */
	private async gracefulShutdownClaude(
		instance: SandboxInstance,
	): Promise<void> {
		try {
			this.log("   🔄 Attempting graceful shutdown of Claude Code...");
			await instance.sandbox.commands.run(
				"pkill -TERM run-claude 2>/dev/null || true",
				{ timeoutMs: 5000 },
			);
			await sleep(2000);
		} catch {
			this.log("   ⚠️ Graceful shutdown failed, proceeding with force restart");
		}
	}

	/**
	 * Restart a sandbox (used by both preemptive and expired restart).
	 */
	private async restartSandbox(
		instance: SandboxInstance,
		label: string,
	): Promise<void> {
		try {
			await instance.sandbox.kill();
		} catch {
			// Ignore kill errors - sandbox may already be dead
		}

		try {
			const oldSandboxId = instance.id;

			const newInstance = await createSandbox(
				this.manifest,
				label,
				this.timeoutSeconds,
				this.uiEnabled,
				this.runId,
			);

			// Replace the old sandbox with the new one
			this.updateInstanceFromNew(instance, newInstance);

			// Update manifest
			this.updateManifestAfterRestart(oldSandboxId, newInstance.id);

			// Write idle progress immediately after restart (Bug fix #1713)
			writeIdleProgress(label, instance);

			this.log(
				`   ✅ Sandbox ${label} restarted successfully (${newInstance.id}) - restart #${this.manifest.sandbox.restart_count}`,
			);
		} catch (restartError) {
			this.log(
				`   ❌ Failed to restart sandbox ${label}: ${restartError instanceof Error ? restartError.message : restartError}`,
			);
			instance.status = "failed";
		}
	}

	// ==========================================================================
	// Main Loop
	// ==========================================================================

	/**
	 * Main work loop implementation.
	 * @returns true if deadlock was detected, false otherwise
	 */
	private async mainLoop(): Promise<boolean> {
		while (this.isRunning) {
			// Check if we're done
			const workableFeatures = this.manifest.feature_queue.filter(
				(f) =>
					f.status === "pending" ||
					f.status === "in_progress" ||
					f.status === "failed",
			);

			if (workableFeatures.length === 0) {
				if (this.activeWork.size > 0) {
					await Promise.all(this.activeWork.values());
				}
				break;
			}

			// Assign work to idle sandboxes
			await this.assignWorkToIdleSandboxes();

			// If no work is active, check for deadlock or continue waiting
			if (this.activeWork.size === 0) {
				const shouldExit = await this.handleIdleState();
				if (shouldExit) {
					return true; // Deadlock detected
				}
				continue;
			}

			// Detect stuck tasks and recover (Bug fix #1688, #1767)
			await this.detectAndRecoverStuckTasks();

			// Recover phantom-completed features (Bug fix #1782)
			this.recoverPhantomCompletions();

			// Wait for at least one sandbox to finish OR health check interval
			await Promise.race([
				...this.activeWork.values(),
				sleep(HEALTH_CHECK_INTERVAL_MS),
			]);
		}

		return false;
	}

	/**
	 * Assign available work to idle sandboxes.
	 */
	private async assignWorkToIdleSandboxes(): Promise<void> {
		for (const instance of this.instances) {
			if (instance.status !== "ready") continue;

			const feature = getNextAvailableFeature(this.manifest, this.uiEnabled);
			if (!feature) {
				// No work available - write idle status
				if (this.uiEnabled) {
					const blockedFeatures = getBlockedFeatures(this.manifest);
					const blockedIds = blockedFeatures
						.slice(0, 3)
						.map((bf) => bf.feature.id);
					const waitingReason =
						blockedFeatures.length > 0
							? `Waiting for dependencies (${blockedFeatures.length} features blocked)`
							: "No available features";
					writeIdleProgress(
						instance.label,
						instance,
						waitingReason,
						blockedIds,
					);
				}
				continue;
			}

			// Use atomic assignment with timestamp-based conflict detection
			const assigned = assignFeatureToSandbox(
				feature,
				instance.label,
				this.manifest,
				this.uiEnabled,
			);
			if (!assigned) {
				this.log(
					`   ⚠️ ${instance.label}: Lost race for #${feature.id}, will retry`,
				);
				continue;
			}

			// Set sandbox status to "busy" SYNCHRONOUSLY before async Promise
			instance.status = "busy";
			instance.currentFeature = feature.id;
			instance.featureStartedAt = new Date();

			// Start work on this sandbox
			const workPromise = this.runFeatureWork(instance, feature);
			this.activeWork.set(instance.label, workPromise);
		}
	}

	/**
	 * Run feature implementation work for a sandbox.
	 */
	private async runFeatureWork(
		instance: SandboxInstance,
		feature: FeatureEntry,
	): Promise<void> {
		try {
			await runFeatureImplementation(
				instance,
				this.manifest,
				feature,
				this.uiEnabled,
			);
		} catch (error) {
			this.log(
				`│   ❌ Feature #${feature.id} implementation error: ${error instanceof Error ? error.message : String(error)}`,
			);
			// Mark sandbox as ready for next feature
			instance.status = "ready";
			instance.currentFeature = null;
			// Mark feature as failed so it can be retried
			feature.status = "failed";
			feature.error = error instanceof Error ? error.message : String(error);
			feature.assigned_sandbox = undefined;
			feature.assigned_at = undefined;
			saveManifest(this.manifest);
		} finally {
			this.activeWork.delete(instance.label);
		}
	}

	/**
	 * Handle the idle state when no work is active.
	 * @returns true if should exit (deadlock), false to continue
	 */
	private async handleIdleState(): Promise<boolean> {
		// Check for deadlock condition (Bug fix #1777)
		const deadlockResult = detectAndHandleDeadlock(
			this.instances,
			this.manifest,
			this.uiEnabled,
		);

		if (deadlockResult.shouldExit) {
			this.log(
				"\n❌ Orchestration incomplete: deadlock detected with no recovery possible",
			);
			if (deadlockResult.failedInitiatives.length > 0) {
				this.log(
					`   Failed initiatives: ${deadlockResult.failedInitiatives.join(", ")}`,
				);
			}
			return true;
		}

		// If features were retried, continue to let them be picked up
		if (deadlockResult.retriedCount > 0) {
			this.log(
				`   ✅ Deadlock resolved: ${deadlockResult.retriedCount} feature(s) retried`,
			);
			return false;
		}

		// Check for ANY retryable features
		const retryableFeatures = this.manifest.feature_queue.filter(
			(f) => f.status === "pending" || f.status === "failed",
		);

		// Exit only if no retryable features exist
		if (retryableFeatures.length === 0) {
			return true;
		}

		// Log blocked features for visibility
		const blockedFeatures = retryableFeatures.filter(
			(f) => f.dependencies.length > 0,
		);
		if (blockedFeatures.length > 0) {
			this.log("\n⚠️ Features blocked by incomplete dependencies:");
			for (const f of blockedFeatures.slice(0, 5)) {
				this.log(
					`   #${f.id}: blocked by ${f.dependencies.map((d) => `#${d}`).join(", ")}`,
				);
			}
		}

		return false;
	}

	/**
	 * Detect stuck tasks and attempt recovery.
	 * Bug fixes: #1688, #1767
	 */
	private async detectAndRecoverStuckTasks(): Promise<void> {
		const now = Date.now();

		for (const feature of this.manifest.feature_queue) {
			// Only check in-progress features with an assigned sandbox
			if (feature.status !== "in_progress" || !feature.assigned_sandbox) {
				continue;
			}

			const sandboxInstance = this.instances.find(
				(i) => i.label === feature.assigned_sandbox,
			);
			if (!sandboxInstance) continue;

			// Bug fix #1767: Check if PTY timed out but progress file shows completion
			if (sandboxInstance.status === "busy") {
				const recovered = await this.checkPTYFallbackRecovery(
					feature,
					sandboxInstance,
				);
				if (recovered) continue;
			}

			// Check for stuck tasks
			const tasksRemaining =
				feature.task_count - (feature.tasks_completed || 0);
			const assignedDuration = feature.assigned_at
				? now - feature.assigned_at
				: 0;

			if (
				tasksRemaining > 0 &&
				sandboxInstance.status !== "busy" &&
				assignedDuration > STUCK_TASK_THRESHOLD_MS
			) {
				this.log(
					`   ⚠️ Stuck task detected: Feature #${feature.id} on ${sandboxInstance.label} has ${tasksRemaining} tasks remaining but sandbox is ${sandboxInstance.status}`,
				);

				// Reset the feature to pending for reassignment
				this.resetFeatureForReassignment(
					feature,
					`Stuck: ${tasksRemaining} tasks remaining but sandbox idle for ${Math.round(assignedDuration / 1000)}s`,
				);

				// Mark sandbox as ready
				sandboxInstance.status = "ready";
				sandboxInstance.currentFeature = null;

				this.log(
					`   🔄 Feature #${feature.id} reset to pending for reassignment`,
				);
			}
		}
	}

	/**
	 * Check and recover feature via progress file when PTY times out.
	 * Bug fix #1767
	 */
	private async checkPTYFallbackRecovery(
		feature: FeatureEntry,
		sandboxInstance: SandboxInstance,
	): Promise<boolean> {
		try {
			const progressResult = await readProgressFile(sandboxInstance.sandbox);
			if (
				progressResult.success &&
				progressResult.data &&
				!isProgressFileStale(progressResult.data) &&
				isFeatureCompleted(progressResult.data)
			) {
				this.log(
					`   🔄 [PTY_FALLBACK] Feature #${feature.id} on ${sandboxInstance.label}: PTY stuck but progress file shows completed`,
				);

				// Force manifest update to mark feature as completed
				feature.status = "completed";
				feature.tasks_completed =
					progressResult.data.completed_tasks?.length || feature.task_count;
				feature.assigned_sandbox = undefined;
				feature.assigned_at = undefined;

				// Update initiative status
				this.updateInitiativeStatus(feature);

				// Update progress tracking
				this.manifest.progress.last_completed_feature_id = feature.id;
				saveManifest(this.manifest);

				// Mark sandbox as ready
				sandboxInstance.status = "ready";
				sandboxInstance.currentFeature = null;

				this.log(
					`   ✅ [PTY_FALLBACK] Feature #${feature.id} recovered - manifest updated, dependents unblocked`,
				);
				return true;
			}
		} catch (progressError) {
			this.log(
				`   ⚠️ [PTY_FALLBACK] Progress file check failed for ${sandboxInstance.label}: ${progressError instanceof Error ? progressError.message : progressError}`,
			);
		}
		return false;
	}

	/**
	 * Recover phantom-completed features.
	 * Bug fix #1782
	 */
	private recoverPhantomCompletions(): void {
		const busySandboxLabels = new Set(
			this.instances.filter((i) => i.status === "busy").map((i) => i.label),
		);
		recoverPhantomCompletedFeatures(
			this.manifest,
			busySandboxLabels,
			this.instances,
			this.log,
			"work_loop",
		);
	}

	// ==========================================================================
	// Helper Methods
	// ==========================================================================

	/**
	 * Update instance properties from a newly created sandbox.
	 */
	private updateInstanceFromNew(
		instance: SandboxInstance,
		newInstance: SandboxInstance,
	): void {
		instance.sandbox = newInstance.sandbox;
		instance.id = newInstance.id;
		instance.status = "ready";
		instance.currentFeature = null;
		instance.retryCount = 0;
		instance.featureStartedAt = undefined;
		instance.lastProgressSeen = undefined;
		instance.lastHeartbeat = undefined;
		instance.outputLineCount = 0;
		instance.hasReceivedOutput = false;
		instance.createdAt = newInstance.createdAt;
		instance.lastKeepaliveAt = newInstance.lastKeepaliveAt;
		instance.runId = this.runId;
	}

	/**
	 * Update manifest after a sandbox restart.
	 */
	private updateManifestAfterRestart(
		oldSandboxId: string,
		newSandboxId: string,
	): void {
		// Track restart count for diagnostics (Diagnosis #1567)
		this.manifest.sandbox.restart_count =
			(this.manifest.sandbox.restart_count ?? 0) + 1;

		// Clean up old sandbox ID
		const oldIdIndex = this.manifest.sandbox.sandbox_ids.indexOf(oldSandboxId);
		if (oldIdIndex !== -1) {
			this.manifest.sandbox.sandbox_ids.splice(oldIdIndex, 1);
		}
		if (!this.manifest.sandbox.sandbox_ids.includes(newSandboxId)) {
			this.manifest.sandbox.sandbox_ids.push(newSandboxId);
		}

		// Reset created_at timestamp (Bug fix #1713)
		this.manifest.sandbox.created_at = new Date().toISOString();
		saveManifest(this.manifest);
	}

	/**
	 * Reset a feature for reassignment.
	 */
	private resetFeatureForReassignment(
		feature: FeatureEntry,
		errorMessage: string,
	): void {
		feature.status = "pending";
		feature.assigned_sandbox = undefined;
		feature.assigned_at = undefined;
		feature.error = errorMessage;
		saveManifest(this.manifest);
	}

	/**
	 * Update initiative status after feature completion.
	 */
	private updateInitiativeStatus(feature: FeatureEntry): void {
		const initiative = this.manifest.initiatives.find(
			(i) => i.id === feature.initiative_id,
		);
		if (initiative) {
			const initFeatures = this.manifest.feature_queue.filter(
				(f) => f.initiative_id === initiative.id,
			);
			initiative.features_completed = initFeatures.filter(
				(f) => f.status === "completed",
			).length;

			if (initFeatures.every((f) => f.status === "completed")) {
				initiative.status = "completed";
			} else {
				initiative.status = "in_progress";
			}
		}
	}

	/**
	 * Clean up intervals on exit.
	 */
	private cleanup(): void {
		if (this.healthCheckInterval) {
			clearInterval(this.healthCheckInterval);
			this.healthCheckInterval = null;
		}
		if (this.keepaliveInterval) {
			clearInterval(this.keepaliveInterval);
			this.keepaliveInterval = null;
		}
	}
}

// ============================================================================
// Convenience Function (Backward Compatibility)
// ============================================================================

/**
 * Run the work loop (convenience function for backward compatibility).
 *
 * @param instances - All sandbox instances
 * @param manifest - The spec manifest
 * @param uiEnabled - Whether UI mode is enabled
 * @param timeoutSeconds - Sandbox timeout in seconds
 * @param runId - Run ID for this orchestrator session
 */
export async function runWorkLoop(
	instances: SandboxInstance[],
	manifest: SpecManifest,
	uiEnabled: boolean = false,
	timeoutSeconds: number = 7200,
	runId?: string,
): Promise<void> {
	// Create conditional logger
	const log = uiEnabled
		? (..._args: unknown[]) => {}
		: (...args: unknown[]) => console.log(...args);

	const workLoop = new WorkLoop(
		{
			instances,
			manifest,
			uiEnabled,
			timeoutSeconds,
			runId,
		},
		log,
	);

	await workLoop.run();
}
