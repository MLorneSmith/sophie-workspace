/**
 * Heartbeat Monitor Module for Alpha Orchestrator
 *
 * Replaces 6 competing detection systems with ONE unified heartbeat monitor.
 * This is the single source of truth for determining if a feature is healthy,
 * stalled, or completed.
 *
 * Bug fix #1786: Event-driven architecture refactor
 *
 * Previously, these systems operated independently and caused conflicts:
 * 1. Startup Hang Detection (startup-monitor.ts, feature.ts)
 * 2. PTY Wait Timeout (pty-wrapper.ts)
 * 3. Stall Detection (progress.ts, feature.ts)
 * 4. Progress Polling (progress.ts)
 * 5. Deadlock Detection (work-queue.ts, orchestrator.ts)
 * 6. Phantom Completion Detection (work-queue.ts, orchestrator.ts)
 *
 * Now, the heartbeat monitor is the ONLY authority on feature health.
 */

import type { Sandbox } from "@e2b/code-interpreter";

import {
	PROGRESS_FILE,
	PROGRESS_FILE_STALE_THRESHOLD_MS,
	WORKSPACE_DIR,
} from "../config/index.js";
import type { ProgressFileData } from "./progress-file.js";

// ============================================================================
// Types
// ============================================================================

/**
 * Configuration for the heartbeat monitor.
 */
export interface HeartbeatConfig {
	/** How often to check heartbeat (ms) - default: 5000 */
	checkIntervalMs: number;

	/** Max age of heartbeat before considering stale (ms) - default: 60000 */
	staleThresholdMs: number;

	/** Grace period for startup (no heartbeat expected) (ms) - default: 30000 */
	startupGracePeriodMs: number;

	/** Number of stale heartbeats before triggering recovery - default: 3 */
	staleCountThreshold: number;
}

/**
 * Status returned by heartbeat check.
 */
export type HeartbeatStatusType =
	| "healthy" // Heartbeat is recent, feature is running normally
	| "warning" // Heartbeat is getting old, may become stale
	| "stale" // Heartbeat is too old, feature may be stuck
	| "completed" // Feature has completed successfully
	| "failed" // Feature has failed
	| "blocked" // Feature is blocked
	| "unavailable" // Progress file missing or unreadable
	| "startup"; // Within startup grace period

/**
 * Result of checking a heartbeat.
 */
export interface HeartbeatStatus {
	/** Status category */
	status: HeartbeatStatusType;

	/** Reason for the status (human readable) */
	reason: string;

	/** Age of the heartbeat in milliseconds (null if unavailable) */
	heartbeatAgeMs: number | null;

	/** Feature status from progress file */
	featureStatus?: ProgressFileData["status"];

	/** Number of completed tasks */
	tasksCompleted: number;

	/** Total tasks (if known) */
	totalTasks?: number;

	/** Whether recovery is needed */
	needsRecovery: boolean;

	/** Consecutive stale count */
	staleCount: number;

	/** Raw progress data (if available) */
	progressData?: ProgressFileData;
}

// ============================================================================
// Default Configuration
// ============================================================================

/**
 * Default heartbeat monitor configuration.
 * These values provide a good balance between responsiveness and stability.
 */
export const DEFAULT_HEARTBEAT_CONFIG: HeartbeatConfig = {
	checkIntervalMs: 5000, // Check every 5 seconds
	staleThresholdMs: PROGRESS_FILE_STALE_THRESHOLD_MS, // Use configured threshold (5 min)
	startupGracePeriodMs: 30000, // 30 seconds for startup
	staleCountThreshold: 3, // 3 consecutive stale checks before recovery
};

// ============================================================================
// Heartbeat Monitor Class
// ============================================================================

/**
 * Heartbeat Monitor
 *
 * Single source of truth for feature health monitoring.
 * Replaces all competing detection systems with one unified approach.
 */
export class HeartbeatMonitor {
	private config: HeartbeatConfig;
	private staleCountByFeature: Map<string, number> = new Map();
	private featureStartTimes: Map<string, Date> = new Map();

	constructor(config: Partial<HeartbeatConfig> = {}) {
		this.config = { ...DEFAULT_HEARTBEAT_CONFIG, ...config };
	}

	/**
	 * Register a feature's start time for grace period calculation.
	 */
	registerFeatureStart(featureId: string): void {
		this.featureStartTimes.set(featureId, new Date());
		this.staleCountByFeature.set(featureId, 0);
	}

	/**
	 * Unregister a feature (cleanup after completion/failure).
	 */
	unregisterFeature(featureId: string): void {
		this.featureStartTimes.delete(featureId);
		this.staleCountByFeature.delete(featureId);
	}

	/**
	 * Get the stale count for a feature.
	 */
	getStaleCount(featureId: string): number {
		return this.staleCountByFeature.get(featureId) ?? 0;
	}

	/**
	 * Reset the stale count for a feature (called when heartbeat recovers).
	 */
	resetStaleCount(featureId: string): void {
		this.staleCountByFeature.set(featureId, 0);
	}

	/**
	 * Check the heartbeat for a feature in a sandbox.
	 *
	 * This is the ONLY method that should be used to determine feature health.
	 *
	 * @param sandbox - The E2B sandbox instance
	 * @param featureId - The feature ID for tracking
	 * @returns HeartbeatStatus indicating health and any needed actions
	 */
	async checkHeartbeat(
		sandbox: Sandbox,
		featureId: string,
	): Promise<HeartbeatStatus> {
		const now = Date.now();
		const featureStartTime = this.featureStartTimes.get(featureId);
		const elapsedSinceStart = featureStartTime
			? now - featureStartTime.getTime()
			: Number.POSITIVE_INFINITY;

		// Check if we're within startup grace period
		const inStartupGrace = elapsedSinceStart < this.config.startupGracePeriodMs;

		// Try to read the progress file
		let progressData: ProgressFileData | undefined;
		try {
			const result = await sandbox.commands.run(
				`cat ${WORKSPACE_DIR}/${PROGRESS_FILE} 2>/dev/null`,
				{ timeoutMs: 5000 },
			);

			if (result.stdout?.trim()) {
				progressData = JSON.parse(result.stdout) as ProgressFileData;
			}
		} catch {
			// Progress file unavailable
		}

		// Case 1: Progress file unavailable
		if (!progressData) {
			if (inStartupGrace) {
				return {
					status: "startup",
					reason: `Within startup grace period (${Math.round(elapsedSinceStart / 1000)}s / ${Math.round(this.config.startupGracePeriodMs / 1000)}s)`,
					heartbeatAgeMs: null,
					tasksCompleted: 0,
					needsRecovery: false,
					staleCount: 0,
				};
			}

			const staleCount = (this.staleCountByFeature.get(featureId) ?? 0) + 1;
			this.staleCountByFeature.set(featureId, staleCount);

			return {
				status: "unavailable",
				reason: "Progress file missing or unreadable",
				heartbeatAgeMs: null,
				tasksCompleted: 0,
				needsRecovery: staleCount >= this.config.staleCountThreshold,
				staleCount,
			};
		}

		// Calculate heartbeat age
		const heartbeatTime = progressData.last_heartbeat
			? new Date(progressData.last_heartbeat).getTime()
			: null;
		const heartbeatAgeMs =
			heartbeatTime !== null && !Number.isNaN(heartbeatTime)
				? now - heartbeatTime
				: null;

		const tasksCompleted = progressData.completed_tasks?.length ?? 0;
		const totalTasks = progressData.total_tasks;

		// Case 2: Feature completed
		if (progressData.status === "completed") {
			this.resetStaleCount(featureId);
			return {
				status: "completed",
				reason: "Feature completed successfully",
				heartbeatAgeMs,
				featureStatus: "completed",
				tasksCompleted,
				totalTasks,
				needsRecovery: false,
				staleCount: 0,
				progressData,
			};
		}

		// Case 3: Feature failed
		if (progressData.status === "failed") {
			this.resetStaleCount(featureId);
			return {
				status: "failed",
				reason: "Feature reported failure",
				heartbeatAgeMs,
				featureStatus: "failed",
				tasksCompleted,
				totalTasks,
				needsRecovery: false,
				staleCount: 0,
				progressData,
			};
		}

		// Case 4: Feature blocked
		if (progressData.status === "blocked") {
			this.resetStaleCount(featureId);
			return {
				status: "blocked",
				reason: "Feature is blocked",
				heartbeatAgeMs,
				featureStatus: "blocked",
				tasksCompleted,
				totalTasks,
				needsRecovery: false,
				staleCount: 0,
				progressData,
			};
		}

		// Case 5: Feature in progress - check heartbeat age
		if (heartbeatAgeMs === null) {
			// Invalid or missing heartbeat timestamp
			if (inStartupGrace) {
				return {
					status: "startup",
					reason:
						"Heartbeat timestamp invalid, but within startup grace period",
					heartbeatAgeMs: null,
					featureStatus: "in_progress",
					tasksCompleted,
					totalTasks,
					needsRecovery: false,
					staleCount: 0,
					progressData,
				};
			}

			const staleCount = (this.staleCountByFeature.get(featureId) ?? 0) + 1;
			this.staleCountByFeature.set(featureId, staleCount);

			return {
				status: "stale",
				reason: "Heartbeat timestamp invalid or missing",
				heartbeatAgeMs: null,
				featureStatus: "in_progress",
				tasksCompleted,
				totalTasks,
				needsRecovery: staleCount >= this.config.staleCountThreshold,
				staleCount,
				progressData,
			};
		}

		// Case 6: Heartbeat is recent - healthy
		if (heartbeatAgeMs < this.config.staleThresholdMs) {
			this.resetStaleCount(featureId);

			// Check if heartbeat is getting old (warning threshold: 50% of stale)
			if (heartbeatAgeMs > this.config.staleThresholdMs * 0.5) {
				return {
					status: "warning",
					reason: `Heartbeat is ${Math.round(heartbeatAgeMs / 1000)}s old (approaching stale threshold)`,
					heartbeatAgeMs,
					featureStatus: "in_progress",
					tasksCompleted,
					totalTasks,
					needsRecovery: false,
					staleCount: 0,
					progressData,
				};
			}

			return {
				status: "healthy",
				reason: `Heartbeat is ${Math.round(heartbeatAgeMs / 1000)}s old`,
				heartbeatAgeMs,
				featureStatus: "in_progress",
				tasksCompleted,
				totalTasks,
				needsRecovery: false,
				staleCount: 0,
				progressData,
			};
		}

		// Case 7: Heartbeat is stale
		const staleCount = (this.staleCountByFeature.get(featureId) ?? 0) + 1;
		this.staleCountByFeature.set(featureId, staleCount);

		return {
			status: "stale",
			reason: `Heartbeat is ${Math.round(heartbeatAgeMs / 1000)}s old (stale threshold: ${Math.round(this.config.staleThresholdMs / 1000)}s)`,
			heartbeatAgeMs,
			featureStatus: "in_progress",
			tasksCompleted,
			totalTasks,
			needsRecovery: staleCount >= this.config.staleCountThreshold,
			staleCount,
			progressData,
		};
	}

	/**
	 * Check if a heartbeat status indicates the feature is healthy.
	 */
	isHealthy(status: HeartbeatStatus): boolean {
		return ["healthy", "startup", "warning"].includes(status.status);
	}

	/**
	 * Check if a heartbeat status indicates the feature is done (completed/failed/blocked).
	 */
	isDone(status: HeartbeatStatus): boolean {
		return ["completed", "failed", "blocked"].includes(status.status);
	}

	/**
	 * Check if a heartbeat status indicates recovery is needed.
	 */
	shouldRecover(status: HeartbeatStatus): boolean {
		return status.needsRecovery;
	}

	/**
	 * Get the current configuration.
	 */
	getConfig(): HeartbeatConfig {
		return { ...this.config };
	}

	/**
	 * Update configuration.
	 */
	updateConfig(config: Partial<HeartbeatConfig>): void {
		this.config = { ...this.config, ...config };
	}

	/**
	 * Clear all tracking state.
	 */
	clear(): void {
		this.staleCountByFeature.clear();
		this.featureStartTimes.clear();
	}
}

// ============================================================================
// Singleton Instance
// ============================================================================

/**
 * Global heartbeat monitor instance for the orchestrator.
 */
export const heartbeatMonitor = new HeartbeatMonitor();

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format a heartbeat status for logging.
 */
export function formatHeartbeatStatus(
	featureId: string,
	status: HeartbeatStatus,
): string {
	const icon =
		status.status === "healthy"
			? "💓"
			: status.status === "warning"
				? "⚠️"
				: status.status === "stale"
					? "💀"
					: status.status === "completed"
						? "✅"
						: status.status === "failed"
							? "❌"
							: status.status === "blocked"
								? "🚫"
								: status.status === "startup"
									? "🚀"
									: "❓";

	const taskProgress =
		status.totalTasks !== undefined
			? `${status.tasksCompleted}/${status.totalTasks}`
			: `${status.tasksCompleted}`;

	return `${icon} [${featureId}] ${status.status.toUpperCase()}: ${status.reason} (tasks: ${taskProgress})`;
}
