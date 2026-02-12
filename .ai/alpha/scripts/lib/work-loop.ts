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
	HEARTBEAT_TIMEOUT_MS,
	MIN_FEATURE_AGE_FOR_RECOVERY_MS,
	PROMISE_TIMEOUT_MS,
	SANDBOX_EXTENSION_MS,
	SANDBOX_KEEPALIVE_INTERVAL_MS,
	SANDBOX_KEEPALIVE_STAGGER_MS,
	SANDBOX_MAX_AGE_MS,
	SANDBOX_MAX_EXTENSION_ATTEMPTS,
} from "../config/index.js";
import type {
	FeatureEntry,
	AgentProvider,
	SandboxInstance,
	SpecManifest,
} from "../types/index.js";
import {
	detectAndHandleDeadlock,
	recoverPhantomCompletedFeatures,
} from "./deadlock-handler.js";
import { emitOrchestratorEvent } from "./event-emitter.js";
import { runFeatureImplementation } from "./feature.js";
import { transitionFeatureStatus } from "./feature-transitions.js";
import { getGracefulShutdownCommand } from "./provider.js";
import {
	type PromiseAgeTracker,
	createPromiseAgeTracker,
} from "./promise-age-tracker.js";
import { runHealthChecks } from "./health.js";
import { saveManifest, writeOverallProgress } from "./manifest.js";
import { writeIdleProgress } from "./progress.js";
import {
	isFeatureCompleted,
	isProgressFileStale,
	readProgressFile,
} from "./progress-file.js";
import { RecoveryCoordinator } from "./recovery-coordinator.js";
import {
	createSandbox,
	extendSandboxTimeout,
	getSandboxesNeedingRestart,
	keepAliveSandboxes,
} from "./sandbox.js";
import { sleep } from "./utils.js";
import {
	DEFAULT_MAX_RETRIES,
	assignFeatureToSandbox,
	getBlockedFeatures,
	shouldRetryFailedFeature,
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
	provider: AgentProvider;
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
	private provider: AgentProvider;

	private activeWork: Map<string, Promise<void>>;
	private healthCheckInterval: ReturnType<typeof setInterval> | null = null;
	private keepaliveInterval: ReturnType<typeof setInterval> | null = null;
	private isRunning = false;
	private log: Logger;
	private promiseTracker!: PromiseAgeTracker;
	private coordinator: RecoveryCoordinator;

	constructor(options: WorkLoopOptions, log?: Logger) {
		this.instances = options.instances;
		this.manifest = options.manifest;
		this.uiEnabled = options.uiEnabled;
		this.timeoutSeconds = options.timeoutSeconds;
		this.runId = options.runId;
		this.provider = options.provider;
		this.activeWork = new Map();
		this.log = log ?? ((..._args: unknown[]) => {});
		this.promiseTracker = createPromiseAgeTracker(
			PROMISE_TIMEOUT_MS,
			HEARTBEAT_TIMEOUT_MS,
		);
		this.coordinator = new RecoveryCoordinator(
			this.manifest,
			this.instances,
			this.uiEnabled,
			this.provider,
			this.log,
		);
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
					this.provider,
					this.coordinator,
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
	 *
	 * Bug fix #1858: Also resets any in-progress features on the failing sandbox
	 * to pending for reassignment to another sandbox.
	 */
	private async restartFailedSandbox(instance: SandboxInstance): Promise<void> {
		this.log(`   🔄 Attempting to restart failed sandbox ${instance.label}...`);

		// Bug fix #2064: Clean up old promise from activeWork BEFORE creating new sandbox
		// Without this, the old promise's finally block deletes the new promise from activeWork,
		// causing the new promise to become orphaned (running but untracked)
		this.activeWork.delete(instance.label);
		this.promiseTracker.remove(instance.label);

		// Bug fix #1858, #2077: Reset any in-progress features on this sandbox to pending
		// Recovery delegated to coordinator for mutex protection and centralized retry tracking
		const featureOnSandbox = this.manifest.feature_queue.find(
			(f) =>
				f.assigned_sandbox === instance.label && f.status === "in_progress",
		);
		if (featureOnSandbox) {
			await this.coordinator.recoverFeature(
				featureOnSandbox.id,
				`Sandbox ${instance.label} died - retrying on another sandbox`,
				"sandbox_death",
				{ skipKill: true }, // sandbox is already dead
			);
		}

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
				this.provider,
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
	 *
	 * Bug fix #2074: Instead of killing sandboxes that are actively executing
	 * features, attempt to extend the sandbox timeout via the E2B API. Only
	 * kill if: (1) no features are running, (2) extension fails, or (3) max
	 * extension attempts exceeded.
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

			// Check if a feature is actively running on this sandbox
			const feature = this.manifest.feature_queue.find(
				(f) => f.assigned_sandbox === label && f.status === "in_progress",
			);

			if (feature && feature.task_count > 0) {
				const percentDone =
					feature.task_count > 0
						? (feature.tasks_completed / feature.task_count) * 100
						: 0;

				// Bug fix #2074: For ANY in-progress feature (not just >80%), attempt
				// to extend the sandbox lifetime instead of killing it mid-execution.
				const extensionCount = feature.extension_count ?? 0;

				if (extensionCount >= SANDBOX_MAX_EXTENSION_ATTEMPTS) {
					this.log(
						`   ⏰ Sandbox ${label} is ${ageMinutes}min old, feature #${feature.id} at ${Math.round(percentDone)}% - max extensions (${SANDBOX_MAX_EXTENSION_ATTEMPTS}) reached, forcing restart`,
					);
				} else {
					// Attempt to extend sandbox lifetime
					this.log(
						`   ⏰ [SANDBOX_EXTEND] Sandbox ${label} is ${ageMinutes}min old, feature #${feature.id} at ${Math.round(percentDone)}% - extending sandbox (attempt ${extensionCount + 1}/${SANDBOX_MAX_EXTENSION_ATTEMPTS})`,
					);

					const extended = await extendSandboxTimeout(
						instance.sandbox,
						SANDBOX_EXTENSION_MS,
					);

					if (extended) {
						feature.extension_count = extensionCount + 1;
						// Reset createdAt to prevent immediate re-triggering
						instance.createdAt = new Date();
						instance.lastKeepaliveAt = new Date();
						this.log(
							`   ✅ [SANDBOX_EXTEND] Sandbox ${label} extended by ${SANDBOX_EXTENSION_MS / 60000}min for feature #${feature.id}`,
						);
						continue;
					}

					this.log(
						`   ⚠️ [SANDBOX_EXTEND] Failed to extend sandbox ${label} (sandbox may be dead) - proceeding with restart`,
					);
				}
			}

			this.log(
				`   ⏰ Sandbox ${label} is ${ageMinutes}min old, performing preemptive restart...`,
			);

			// Reset any in-progress feature assigned to this sandbox
			// Bug fix #2077: Use coordinator for infrastructure reset (no retry consumed)
			if (feature) {
				await this.gracefulShutdownClaude(instance);
				await this.coordinator.recoverFeature(
					feature.id,
					"Preemptive restart before expiration",
					"preemptive_restart",
					{ skipKill: true, skipRetryIncrement: true },
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
		// Bug fix #2077: Use coordinator for infrastructure reset (no retry consumed)
		const feature = this.manifest.feature_queue.find(
			(f) => f.assigned_sandbox === label && f.status === "in_progress",
		);
		if (feature) {
			await this.coordinator.recoverFeature(
				feature.id,
				"Sandbox expired - restarting",
				"sandbox_expired",
				{ skipKill: true, skipRetryIncrement: true },
			);
		}

		await this.restartSandbox(instance, label);
	}

	/**
	 * Attempt graceful shutdown of agent before restart.
	 */
	private async gracefulShutdownClaude(
		instance: SandboxInstance,
	): Promise<void> {
		try {
			this.log("   🔄 Attempting graceful shutdown of agent...");
			await instance.sandbox.commands.run(
				getGracefulShutdownCommand(this.provider),
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
				this.provider,
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
			// Bug fix #2064: Exclude permanently-failed features (retry_count >= max)
			// from workable set so the loop can exit when only exhausted features remain
			const workableFeatures = this.manifest.feature_queue.filter(
				(f) =>
					f.status === "pending" ||
					f.status === "in_progress" ||
					(f.status === "failed" &&
						shouldRetryFailedFeature(f, DEFAULT_MAX_RETRIES)),
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

			// Bug fix #2054: Update overall progress periodically during execution.
			// writeOverallProgress() calls syncSandboxProgressToManifest() (#2050)
			// which reads real-time task counts from sandbox progress files.
			// Without this, overall progress only updates on state transitions
			// (feature start/complete/fail), staying at 0 during execution.
			writeOverallProgress(this.manifest);

			// Monitor promise ages and recover stuck promises (Bug fix #1841)
			await this.monitorPromiseAges();

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
	 *
	 * Optimized (#1820): Batch-collects all available features first,
	 * sorts by priority, then assigns to idle sandboxes. This maximizes
	 * parallelism when multiple features become available simultaneously.
	 */
	private async assignWorkToIdleSandboxes(): Promise<void> {
		// Collect all idle sandboxes
		const idleSandboxes = this.instances.filter((i) => i.status === "ready");
		if (idleSandboxes.length === 0) return;

		// Batch-collect all available features (#1820 optimization)
		const availableFeatures: typeof this.manifest.feature_queue = [];
		const assignedInThisRound = new Set<string>();

		// Get all features that can start (deps satisfied, not assigned)
		for (const feature of this.manifest.feature_queue) {
			if (feature.status !== "pending" && feature.status !== "failed") continue;
			if (feature.assigned_sandbox) continue;

			// Bug fix #2064: Skip permanently-failed features that exceeded max retries
			if (
				feature.status === "failed" &&
				!shouldRetryFailedFeature(feature, DEFAULT_MAX_RETRIES)
			) {
				continue;
			}

			// Check if deps are satisfied
			const completedFeatureIds = new Set(
				this.manifest.feature_queue
					.filter((f) => f.status === "completed")
					.map((f) => f.id),
			);
			const completedInitiativeIds = new Set(
				this.manifest.initiatives
					.filter((i) => i.status === "completed")
					.map((i) => i.id),
			);

			const depsComplete = feature.dependencies.every(
				(depId) =>
					completedFeatureIds.has(depId) || completedInitiativeIds.has(depId),
			);

			if (depsComplete) {
				availableFeatures.push(feature);
			}
		}

		// Sort by global_priority (lower = higher priority)
		availableFeatures.sort((a, b) => a.global_priority - b.global_priority);

		// Log batch assignment opportunity (#1820)
		if (availableFeatures.length > 1 && idleSandboxes.length > 1) {
			this.log(
				`   📦 Batch assignment: ${availableFeatures.length} features available, ${idleSandboxes.length} sandboxes idle`,
			);
		}

		// Assign features to sandboxes
		let featuresAssigned = 0;
		for (const instance of idleSandboxes) {
			// Find next unassigned feature
			const feature = availableFeatures.find(
				(f) => !assignedInThisRound.has(f.id),
			);
			if (!feature) {
				// No more work available - write idle status
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

			// Mark as assigned in this round to prevent double-assignment
			assignedInThisRound.add(feature.id);

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

			featuresAssigned++;

			// Set sandbox status to "busy" SYNCHRONOUSLY before async Promise
			instance.status = "busy";
			instance.currentFeature = feature.id;
			instance.featureStartedAt = new Date();

			// Start work on this sandbox
			// Track promise for timeout detection (Bug fix #1841)
			this.promiseTracker.track(instance.label, feature.id);
			const workPromise = this.runFeatureWork(instance, feature);
			this.activeWork.set(instance.label, workPromise);
		}

		// Log batch assignment result (#1820)
		if (featuresAssigned > 1) {
			this.log(`   ✅ Batch assigned ${featuresAssigned} features in parallel`);
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
				this.provider,
			);
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			this.log(
				`│   ❌ Feature #${feature.id} implementation error: ${errorMessage}`,
			);

			// Bug fix #1858, #2077: Delegate recovery to coordinator
			// Coordinator handles mutex, retry budget, and sandbox cleanup
			await this.coordinator.recoverFeature(
				feature.id,
				`Implementation error: ${errorMessage}`,
				"sandbox_death",
				{ skipKill: true }, // process already exited
			);
		} finally {
			this.activeWork.delete(instance.label);
			// Remove from promise tracker (Bug fix #1841)
			this.promiseTracker.remove(instance.label);
		}
	}

	/**
	 * Handle the idle state when no work is active.
	 * @returns true if should exit (deadlock), false to continue
	 */
	private async handleIdleState(): Promise<boolean> {
		// Check for deadlock condition (Bug fix #1777, #2077)
		const deadlockResult = await detectAndHandleDeadlock(
			this.instances,
			this.manifest,
			this.uiEnabled,
			this.coordinator,
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

				// Bug fix #2077: Delegate recovery to coordinator
				await this.coordinator.recoverFeature(
					feature.id,
					`Stuck: ${tasksRemaining} tasks remaining but sandbox idle for ${Math.round(assignedDuration / 1000)}s`,
					"stuck_task",
					{ skipKill: true, skipRetryIncrement: true }, // sandbox already idle, infrastructure issue
				);

				this.log(
					`   🔄 Feature #${feature.id} reset to pending for reassignment`,
				);
			}
		}
	}

	/**
	 * Monitor promise ages and recover stuck promises.
	 * Bug fix #1841: Promise timeout detection for work loop recovery.
	 *
	 * When promises hang indefinitely (PTY timeout, Claude process crash),
	 * this method detects them via dual signals:
	 * 1. Promise age exceeds PROMISE_TIMEOUT_MS (10 minutes default)
	 * 2. Heartbeat age exceeds HEARTBEAT_TIMEOUT_MS (5 minutes default)
	 *
	 * Both conditions must be met to trigger recovery, which prevents
	 * false positives on slow-but-healthy features.
	 */
	private async monitorPromiseAges(): Promise<void> {
		// Update heartbeat ages from progress files
		await this.promiseTracker.updateHeartbeatAges((label) => {
			const instance = this.instances.find((i) => i.label === label);
			return instance?.sandbox;
		});

		// Find all stale promises
		const stalePromises = this.promiseTracker.findStalePromises();

		for (const staleInfo of stalePromises) {
			this.log(
				`   ⏰ [PROMISE_TIMEOUT] Feature #${staleInfo.featureId} on ${staleInfo.sandboxLabel} timed out:`,
			);
			this.log(
				`      Promise age: ${Math.round(staleInfo.promiseAgeMs / 1000 / 60)}min`,
			);
			this.log(
				`      Heartbeat age: ${staleInfo.heartbeatAgeMs !== null ? `${Math.round(staleInfo.heartbeatAgeMs / 1000 / 60)}min` : "unknown"}`,
			);
			this.log(`      Reason: ${staleInfo.reason}`);

			if (!staleInfo.featureId) {
				this.log("   ⚠️ [PROMISE_TIMEOUT] No feature ID for recovery");
				continue;
			}

			// Bug fix #2077: Delegate recovery to coordinator
			const result = await this.coordinator.recoverFeature(
				staleInfo.featureId,
				`Promise timeout: ${Math.round(staleInfo.promiseAgeMs / 1000 / 60)}min elapsed, heartbeat stale`,
				"promise_timeout",
			);

			// Remove from activeWork (the promise is stuck, so we abandon it)
			this.activeWork.delete(staleInfo.sandboxLabel);

			// Remove from tracker
			this.promiseTracker.remove(staleInfo.sandboxLabel);

			// Emit event for UI visibility
			emitOrchestratorEvent(
				"promise_timeout",
				`Feature #${staleInfo.featureId} promise timed out after ${Math.round(staleInfo.promiseAgeMs / 1000 / 60)} minutes`,
				{
					featureId: staleInfo.featureId,
					sandboxLabel: staleInfo.sandboxLabel,
					promiseAgeMs: staleInfo.promiseAgeMs,
					heartbeatAgeMs: staleInfo.heartbeatAgeMs,
					reason: staleInfo.reason,
					retryCount: result.retryCount,
					maxRetries: DEFAULT_MAX_RETRIES,
					markedAsFailed: !result.willRetry,
				},
			);
		}
	}

	/**
	 * Check and recover feature via progress file when PTY times out.
	 * Bug fix #1767, #2063
	 *
	 * Three-layer defense against stale progress file race condition (#2063):
	 * 1. Time-based guard: Skip recovery for features < 90s old
	 * 2. Feature ID validation: Reject progress files from other features
	 * 3. Completion threshold: Require 80% task completion for recovery
	 */
	private async checkPTYFallbackRecovery(
		feature: FeatureEntry,
		sandboxInstance: SandboxInstance,
	): Promise<boolean> {
		try {
			// Layer 1: Time-based guard (Bug fix #2063)
			// Skip recovery for recently-assigned features to prevent reading
			// stale progress files from the previous feature.
			const featureAge = Date.now() - (feature.assigned_at ?? 0);
			if (featureAge < MIN_FEATURE_AGE_FOR_RECOVERY_MS) {
				this.log(
					`   ⏳ [PTY_FALLBACK] Skipping recovery for feature #${feature.id} (age: ${Math.round(featureAge / 1000)}s < ${MIN_FEATURE_AGE_FOR_RECOVERY_MS / 1000}s threshold)`,
				);
				return false;
			}

			const progressResult = await readProgressFile(sandboxInstance.sandbox);
			if (
				progressResult.success &&
				progressResult.data &&
				!isProgressFileStale(progressResult.data) &&
				isFeatureCompleted(progressResult.data)
			) {
				// Layer 2: Feature ID validation (Bug fix #2063)
				// Reject progress files that don't match the current feature.
				if (
					progressResult.data.feature_id &&
					progressResult.data.feature_id !== feature.id
				) {
					this.log(
						`   ⚠️ [PTY_FALLBACK] Feature ID mismatch: expected ${feature.id}, got ${progressResult.data.feature_id}. Skipping recovery.`,
					);
					return false;
				}

				// Layer 3: Completion threshold (Bug fix #2063)
				// Require at least 80% task completion before marking as recovered.
				const completedCount = progressResult.data.completed_tasks?.length ?? 0;
				const completionPercent =
					feature.task_count > 0
						? (completedCount / feature.task_count) * 100
						: 0;
				if (completionPercent < 80) {
					this.log(
						`   ⚠️ [PTY_FALLBACK] Feature #${feature.id}: ${Math.round(completionPercent)}% complete (${completedCount}/${feature.task_count} tasks, needs 80% for recovery)`,
					);
					return false;
				}

				this.log(
					`   🔄 [PTY_FALLBACK] Feature #${feature.id} on ${sandboxInstance.label}: PTY stuck but progress file shows completed (${completedCount}/${feature.task_count} tasks)`,
				);

				// Force manifest update to mark feature as completed
				feature.tasks_completed = completedCount || feature.task_count;

				// Update progress tracking
				this.manifest.progress.last_completed_feature_id = feature.id;
				transitionFeatureStatus(feature, this.manifest, "completed", {
					reason: "PTY fallback - progress file shows completed",
				});

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

	// NOTE: resetFeatureForReassignment() and resetFeatureForRetryOnSandboxDeath()
	// were removed in bug fix #2077. All recovery paths now use RecoveryCoordinator.

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
	provider: AgentProvider = "claude",
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
			provider,
		},
		log,
	);

	await workLoop.run();
}
