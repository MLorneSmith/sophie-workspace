/**

* Progress Polling & Display Module
*
* Handles progress file polling from sandboxes, console display,
* and UI progress file management.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import type { Sandbox } from "@e2b/code-interpreter";

import {
	PROGRESS_FILE,
	PROGRESS_POLL_INTERVAL_MS,
	STALL_TIMEOUT_MS,
	UI_PROGRESS_DIR,
	WORKSPACE_DIR,
} from "../config/index.js";
import type {
	FeatureEntry,
	SandboxInstance,
	SandboxProgress,
} from "../types/index.js";
import { createLogger } from "./logger.js";
import { getProjectRoot } from "./lock.js";
import { validateProgressStatus } from "./progress-file.js";
import { ensureUIProgressDir } from "./manifest.js";
import { sleep } from "./utils.js";

// ============================================================================
// Progress Display
// ============================================================================

/**

* Display a structured progress update from the sandbox progress file.
* Returns a unique key to avoid duplicate displays.
*
* @param progress - The progress data to display
* @param featureTaskCount - Total tasks in the feature
* @param lastDisplayed - Key of last displayed update
* @param sandboxLabel - Label of the sandbox
* @returns New unique key for this update
 */
export function displayProgressUpdate(
	progress: SandboxProgress,
	featureTaskCount: number,
	lastDisplayed: string,
	sandboxLabel: string,
	uiEnabled: boolean = false,
): string {
	const { log } = createLogger(uiEnabled);
	const completed = progress.completed_tasks?.length || 0;
	const total = featureTaskCount;
	const current = progress.current_task;
	const contextPercent = progress.context_usage_percent || 0;

	// Create a unique key to avoid duplicate displays
	const updateKey = `${completed}-${current?.id}-${current?.status}-${progress.phase}`;
	if (updateKey === lastDisplayed) {
		return lastDisplayed; // No change
	}

	// Build progress bar
	const progressPercent = Math.round((completed / total) * 100);
	const barLength = 20;
	const filledLength = Math.round((progressPercent / 100) * barLength);
	const progressBar =
		"█".repeat(filledLength) + "░".repeat(barLength - filledLength);

	log(`\n   ┌─ 📊 [${sandboxLabel}] Progress Update ${"─".repeat(35)}`);
	log(`│ Tasks: [${progressBar}] ${completed}/${total} (${progressPercent}%)`);

	if (progress.phase) {
		log(`│ Phase: ${progress.phase}`);
	}

	if (current) {
		const statusIcon =
			current.status === "in_progress"
				? "🔄"
				: current.status === "completed"
					? "✅"
					: current.status === "starting"
						? "⏳"
						: "📋";
		log(`│ Current: ${statusIcon} [${current.id}] ${current.name}`);

		if (current.verification_attempts && current.verification_attempts > 1) {
			log(`   │ Verification: attempt ${current.verification_attempts}`);
		}
	}

	if (progress.current_group) {
		log(
			`│ Group: ${progress.current_group.name} (${progress.current_group.tasks_completed}/${progress.current_group.tasks_total})`,
		);
	}

	// Always show context usage (even if 0) for visibility
	if (typeof contextPercent === "number" && !Number.isNaN(contextPercent)) {
		const contextIcon = contextPercent > 50 ? "⚠️" : "📈";
		log(`│ Context: ${contextIcon} ${contextPercent}%`);
	}

	if (progress.last_commit) {
		log(`│ Last commit: ${progress.last_commit.substring(0, 7)}`);
	}

	// Validate heartbeat timestamp before calculating age
	if (progress.last_heartbeat && typeof progress.last_heartbeat === "string") {
		const heartbeatDate = new Date(progress.last_heartbeat);
		const heartbeatTime = heartbeatDate.getTime();

		// Only display if we got a valid date (not NaN)
		if (!Number.isNaN(heartbeatTime)) {
			const heartbeatAge = Math.round((Date.now() - heartbeatTime) / 1000);
			const heartbeatIcon = heartbeatAge > 120 ? "⚠️" : "💓";
			log(`   │ Heartbeat: ${heartbeatIcon} ${heartbeatAge}s ago`);
		}
	}

	log(`└${"─".repeat(55)}\n`);

	return updateKey;
}

// ============================================================================
// UI Progress Files
// ============================================================================

/**

* Output tracker interface for sharing recent output between callback and polling.
 */
export interface OutputTracker {
	recentOutput: string[];
}

/**

* Write sandbox progress to local file for UI consumption.
*
* @param sandboxLabel - Label of the sandbox
* @param progress - Progress data from sandbox
* @param instance - Sandbox instance
* @param feature - Feature being implemented
* @param outputTracker - Optional output tracker with recent stdout lines
 */
export function writeUIProgress(
	sandboxLabel: string,
	progress: SandboxProgress | null,
	instance: SandboxInstance,
	feature: FeatureEntry | null,
	outputTracker?: OutputTracker,
): void {
	const progressDir = ensureUIProgressDir();
	const filePath = path.join(progressDir, `${sandboxLabel}-progress.json`);

	const uiProgress = {
		sandbox_id: instance.id,
		runId: instance.runId,
		feature: feature
			? {
					issue_number: feature.id,
					title: feature.title,
				}
			: undefined,
		current_task: progress?.current_task,
		current_group: progress?.current_group,
		completed_tasks: progress?.completed_tasks,
		failed_tasks: progress?.failed_tasks,
		context_usage_percent: progress?.context_usage_percent,
		status:
			instance.status === "completed"
				? "completed"
				: instance.status === "failed"
					? "failed"
					: progress?.status || "running",
		phase: progress?.phase || "executing",
		last_heartbeat: progress?.last_heartbeat || new Date().toISOString(),
		last_tool: progress?.last_tool,
		last_commit: progress?.last_commit,
		session_id: instance.id,
		// Include recent output for UI visibility
		// Prefer hook-generated tool events from sandbox file, fallback to stdout capture
		recent_output:
			progress?.recent_output?.slice(-20) ||
			outputTracker?.recentOutput?.slice(-20) ||
			[],
	};

	try {
		fs.writeFileSync(filePath, JSON.stringify(uiProgress, null, "\t"));
	} catch {
		// Ignore write errors
	}
}

/**

* Write idle/waiting status to UI progress file.
* Called when sandbox has no work assigned (waiting for dependencies).
*
* @param sandboxLabel - Label of the sandbox
* @param instance - Sandbox instance
* @param waitingReason - Human-readable reason for waiting
* @param blockedBy - Feature IDs that are blocking (semantic or legacy string format)
 */
export function writeIdleProgress(
	sandboxLabel: string,
	instance: SandboxInstance,
	waitingReason?: string,
	blockedBy?: string[],
): void {
	const progressDir = ensureUIProgressDir();
	const filePath = path.join(progressDir, `${sandboxLabel}-progress.json`);

	const idleProgress = {
		sandbox_id: instance.id,
		runId: instance.runId,
		feature: undefined,
		current_task: undefined,
		current_group: undefined,
		completed_tasks: [],
		failed_tasks: [],
		context_usage_percent: 0,
		status: "idle",
		phase: "waiting",
		last_heartbeat: new Date().toISOString(),
		last_tool: undefined,
		last_commit: undefined,
		session_id: instance.id,
		waiting_reason: waitingReason,
		blocked_by: blockedBy,
	};

	try {
		fs.writeFileSync(filePath, JSON.stringify(idleProgress, null, "\t"));
	} catch {
		// Ignore write errors
	}
}

/**

* Clear all UI progress files.
* Called at orchestration start to clean up stale data.
* NOTE: The canonical implementation is in manifest.ts which also clears log files.
 */
export function clearUIProgress(): void {
	const progressDir = path.join(getProjectRoot(), UI_PROGRESS_DIR);
	if (fs.existsSync(progressDir)) {
		for (const file of fs.readdirSync(progressDir)) {
			if (file.endsWith("-progress.json")) {
				try {
					fs.unlinkSync(path.join(progressDir, file));
				} catch {
					// Ignore
				}
			}
		}
	}
}

// ============================================================================
// Progress Polling
// ============================================================================

export interface ProgressPoller {
	stop: () => Promise<void>;
	getLastProgress: () => SandboxProgress | null;
}

/**

* Start polling the progress file in the sandbox.
* Returns a cleanup function to stop polling.
*
* @param sandbox - The E2B sandbox instance
* @param featureTaskCount - Total tasks in the feature
* @param sandboxLabel - Label of the sandbox
* @param sessionStartTime - When this feature session started
* @param uiEnabled - Whether to write progress to UI files
* @param instance - Sandbox instance (needed for UI progress)
* @param feature - Feature being implemented (needed for UI progress)
* @param outputTracker - Optional output tracker for recent stdout lines
* @returns Object with stop function and getLastProgress function
 */
export function startProgressPolling(
	sandbox: Sandbox,
	featureTaskCount: number,
	sandboxLabel: string,
	sessionStartTime: Date = new Date(),
	uiEnabled: boolean = false,
	instance?: SandboxInstance,
	feature?: FeatureEntry,
	outputTracker?: OutputTracker,
): ProgressPoller {
	let lastDisplayed = "";
	let isPolling = true;
	let lastProgress: SandboxProgress | null = null;
	// Track current poll iteration to allow stop() to await completion
	// This prevents race conditions where stale data overwrites new feature data
	let currentPollPromise: Promise<void> | null = null;

	const poll = async () => {
		while (isPolling) {
			// Wrap the poll iteration in a tracked promise
			// This allows stop() to await any in-flight async operations
			currentPollPromise = (async () => {
				try {
					const result = await sandbox.commands.run(
						`cat ${WORKSPACE_DIR}/${PROGRESS_FILE} 2>/dev/null`,
						{ timeoutMs: 5000 },
					);

					// Early exit if stop() was called during the async operation
					// This prevents writing stale data after a new poller has started
					if (!isPolling) return;

					if (result.stdout?.trim()) {
						const raw = JSON.parse(result.stdout);
						const progress: SandboxProgress = {
							...raw,
							status: raw.status
								? validateProgressStatus(raw.status)
								: undefined,
						};

						// Handle stale progress data from previous sessions
						if (progress.last_heartbeat) {
							const heartbeatTime = new Date(progress.last_heartbeat).getTime();
							const sessionStart = sessionStartTime.getTime() - 5 * 60 * 1000;
							if (heartbeatTime < sessionStart) {
								// Write recovery status to UI before skipping stale data
								// This prevents UI from showing permanently stale information
								if (uiEnabled && instance) {
									writeUIProgress(
										sandboxLabel,
										{
											...progress,
											status: "in_progress",
											phase: "recovering",
											last_heartbeat: new Date().toISOString(),
										},
										instance,
										feature ?? null,
										outputTracker,
									);
								}
								return;
							}
						}

						// Another early exit check before writing progress
						if (!isPolling) return;

						lastProgress = progress;

						// Write progress to UI files if enabled (includes recent output)
						if (uiEnabled && instance) {
							writeUIProgress(
								sandboxLabel,
								progress,
								instance,
								feature ?? null,
								outputTracker,
							);
						}

						// Only display console updates if UI is not enabled
						if (!uiEnabled) {
							lastDisplayed = displayProgressUpdate(
								progress,
								featureTaskCount,
								lastDisplayed,
								sandboxLabel,
							);
						}
					}
				} catch {
					// Ignore polling errors - sandbox may be busy
				}
			})();

			// Wait for the current poll iteration to complete
			await currentPollPromise;
			currentPollPromise = null;

			if (isPolling) {
				await sleep(PROGRESS_POLL_INTERVAL_MS);
			}
		}
	};

	// Start polling in background
	poll();

	return {
		stop: async () => {
			isPolling = false;
			// Wait for any in-flight poll iteration to complete
			// This ensures no stale writes occur after stop() returns
			if (currentPollPromise) {
				await currentPollPromise;
			}
		},
		getLastProgress: () => lastProgress,
	};
}

// ============================================================================
// Stall Detection
// ============================================================================

export interface StallCheckResult {
	stalled: boolean;
	reason?: string;
}

/**

* Check if a feature has stalled (no heartbeat or progress for STALL_TIMEOUT_MS).
*
* @param progress - The last progress data received
* @param sessionStartTime - When this session started
* @returns Object indicating if stalled and reason
 */
export function checkForStall(
	progress: SandboxProgress | null,
	sessionStartTime: Date = new Date(),
): StallCheckResult {
	if (!progress) {
		// Bug fix #2056: When progress is null (no data for this session yet),
		// check elapsed time since session start. If enough time has passed
		// without any progress data, that itself indicates a stall.
		const timeSinceSessionStart = Date.now() - sessionStartTime.getTime();
		if (timeSinceSessionStart > STALL_TIMEOUT_MS) {
			return {
				stalled: true,
				reason: `No progress data received for ${Math.round(timeSinceSessionStart / 60000)} minutes since session start`,
			};
		}
		return { stalled: false };
	}

	const now = Date.now();
	const sessionStart = sessionStartTime.getTime();

	// Check heartbeat age
	if (progress.last_heartbeat) {
		const heartbeatTime = new Date(progress.last_heartbeat).getTime();

		// Ignore heartbeats from before this session started (stale data)
		if (heartbeatTime < sessionStart - 5 * 60 * 1000) {
			return { stalled: false };
		}

		const heartbeatAge = now - heartbeatTime;
		if (heartbeatAge > STALL_TIMEOUT_MS) {
			return {
				stalled: true,
				reason: `No heartbeat for ${Math.round(heartbeatAge / 60000)} minutes`,
			};
		}
	}

	// Check if task has been "starting" for too long
	if (
		progress.current_task?.status === "starting" &&
		progress.current_task.started_at
	) {
		const taskStartTime = new Date(progress.current_task.started_at).getTime();

		// Ignore task start times from before this session
		if (taskStartTime < sessionStart - 5 * 60 * 1000) {
			return { stalled: false };
		}

		const taskAge = now - taskStartTime;
		if (taskAge > STALL_TIMEOUT_MS) {
			return {
				stalled: true,
				reason: `Task ${progress.current_task.id} stuck in "starting" for ${Math.round(taskAge / 60000)} minutes`,
			};
		}
	}

	return { stalled: false };
}
