import { useCallback, useEffect, useRef, useState } from "react";
import {
	OverallProgressFileSchema,
	SandboxProgressFileSchema,
	safeParseProgress,
} from "../../lib/schemas/index.js";
import type {
	GroupInfo,
	OrchestratorEvent,
	OverallProgress,
	Phase,
	SandboxProgressFile,
	SandboxState,
	TaskInfo,
	UIState,
} from "../types.js";
import { HEARTBEAT_STALL_THRESHOLD_MS, POLL_INTERVAL_MS } from "../types.js";

/**

* Deep equality check for SandboxState to prevent unnecessary re-renders
 */
function sandboxStateEqual(a: SandboxState, b: SandboxState): boolean {
	if (a.status !== b.status) return false;
	if (a.phase !== b.phase) return false;
	if (a.contextUsage !== b.contextUsage) return false;
	if (a.tasksCompleted !== b.tasksCompleted) return false;
	if (a.tasksTotal !== b.tasksTotal) return false;
	if (a.toolCount !== b.toolCount) return false;
	if (a.lastTool !== b.lastTool) return false;
	if (a.error !== b.error) return false;
	if (a.lastCommit !== b.lastCommit) return false;

	// Compare feature
	if (!a.currentFeature && !b.currentFeature) {
		// Both null, ok
	} else if (!a.currentFeature || !b.currentFeature) {
		return false;
	} else if (a.currentFeature.id !== b.currentFeature.id) {
		return false;
	}

	// Compare task
	if (!a.currentTask && !b.currentTask) {
		// Both null, ok
	} else if (!a.currentTask || !b.currentTask) {
		return false;
	} else if (
		a.currentTask.id !== b.currentTask.id ||
		a.currentTask.status !== b.currentTask.status ||
		a.currentTask.verificationAttempts !== b.currentTask.verificationAttempts
	) {
		return false;
	}

	// Compare group
	if (!a.currentGroup && !b.currentGroup) {
		// Both null, ok
	} else if (!a.currentGroup || !b.currentGroup) {
		return false;
	} else if (
		a.currentGroup.id !== b.currentGroup.id ||
		a.currentGroup.tasksCompleted !== b.currentGroup.tasksCompleted
	) {
		return false;
	}

	// Compare heartbeat (allow small timing differences)
	const aHb = a.lastHeartbeat?.getTime() ?? 0;
	const bHb = b.lastHeartbeat?.getTime() ?? 0;
	if (Math.abs(aHb - bHb) > 1000) return false;

	// Compare recent output
	const aOutput = a.recentOutput ?? [];
	const bOutput = b.recentOutput ?? [];
	if (aOutput.length !== bOutput.length) return false;
	for (let i = 0; i < aOutput.length; i++) {
		if (aOutput[i] !== bOutput[i]) return false;
	}

	return true;
}

/**

* Check if sandbox maps have changed meaningfully
 */
function sandboxMapsEqual(
	a: Map<string, SandboxState>,
	b: Map<string, SandboxState>,
): boolean {
	if (a.size !== b.size) return false;
	for (const [key, aState] of a) {
		const bState = b.get(key);
		if (!bState || !sandboxStateEqual(aState, bState)) {
			return false;
		}
	}
	return true;
}

/**

* Check if overall progress has changed
 */
function progressEqual(a: OverallProgress, b: OverallProgress): boolean {
	return (
		a.status === b.status &&
		a.featuresCompleted === b.featuresCompleted &&
		a.featuresTotal === b.featuresTotal &&
		a.tasksCompleted === b.tasksCompleted &&
		a.tasksTotal === b.tasksTotal &&
		a.initiativesCompleted === b.initiativesCompleted &&
		a.initiativesTotal === b.initiativesTotal &&
		a.branchName === b.branchName &&
		// Review URLs changing triggers update
		(a.reviewUrls?.length ?? 0) === (b.reviewUrls?.length ?? 0)
	);
}

/**

* Configuration for the progress poller
 */
export interface ProgressPollerConfig {
	/**Spec ID being orchestrated (semantic S1362 or legacy 1362) */
	specId: string;
	/** Spec name for display */
	specName: string;
	/**Directory containing sandbox progress files */
	progressDir: string;
	/** Directory containing sandbox log files */
	logsDir: string;
	/** Sandbox labels to monitor */
	sandboxLabels: string[];
	/**Polling interval in ms (default: 15000) */
	pollInterval?: number;
	/** Callback when state changes */
	onStateChange?: (state: UIState) => void;
	/**Callback when error occurs*/
	onError?: (error: Error) => void;
}

/**

* Result of reading a progress file
 */
interface ProgressFileResult {
	label: string;
	data: SandboxProgressFile | null;
	error: string | null;
}

/**

* Review URL from overall progress file
 */
interface ReviewUrlFile {
	label: string;
	vscode: string;
	devServer: string;
}

/**
 * Structure of overall-progress.json file written by orchestrator
 */
interface OverallProgressFile {
	specId: string;
	specName: string;
	status: string;
	initiativesCompleted: number;
	initiativesTotal: number;
	featuresCompleted: number;
	featuresTotal: number;
	tasksCompleted: number;
	tasksTotal: number;
	lastCheckpoint: string;
	branchName?: string;
	reviewUrls?: ReviewUrlFile[];
}

/**

* Sandbox progress reader interface (injected for testability)
 */
export interface ProgressReader {
	readProgressFile: (
		label: string,
		progressDir: string,
	) => Promise<ProgressFileResult>;
	readOverallProgress: (
		progressDir: string,
	) => Promise<OverallProgressFile | null>;
	readRecentLogs: (
		label: string,
		logsDir: string,
		lineCount?: number,
	) => Promise<string[]>;
}

/**

* Default progress reader using fs
 */
export const createFsProgressReader = (): ProgressReader => {
	return {
		readProgressFile: async (
			label: string,
			progressDir: string,
		): Promise<ProgressFileResult> => {
			try {
				// Dynamic import to work in both Node and browser contexts
				const fs = await import("node:fs/promises");
				const path = await import("node:path");

				const filePath = path.join(progressDir, `${label}-progress.json`);
				const content = await fs.readFile(filePath, "utf-8");
				const raw = JSON.parse(content);
				const data = safeParseProgress(
					SandboxProgressFileSchema,
					raw,
					`ui-progress-${label}`,
				) as SandboxProgressFile;

				return { label, data, error: null };
			} catch (err) {
				const error = err instanceof Error ? err.message : String(err);
				return { label, data: null, error };
			}
		},
		readOverallProgress: async (
			progressDir: string,
		): Promise<OverallProgressFile | null> => {
			try {
				const fs = await import("node:fs/promises");
				const path = await import("node:path");

				const filePath = path.join(progressDir, "overall-progress.json");
				const content = await fs.readFile(filePath, "utf-8");
				const raw = JSON.parse(content);
				return safeParseProgress(
					OverallProgressFileSchema,
					raw,
					"ui-overall-progress",
				) as OverallProgressFile;
			} catch {
				// File may not exist yet
				return null;
			}
		},
		readRecentLogs: async (
			label: string,
			logsDir: string,
			lineCount = 3,
		): Promise<string[]> => {
			try {
				const fs = await import("node:fs/promises");
				const path = await import("node:path");

				// List all log files for this sandbox
				const files = await fs.readdir(logsDir);
				const logFiles = files
					.filter((f) => f.startsWith(`${label}-`) && f.endsWith(".log"))
					.sort()
					.reverse(); // Most recent first (timestamp in filename)

				const latestFile = logFiles[0];
				if (!latestFile) {
					return [];
				}

				// Read the most recent log file
				const latestLog = path.join(logsDir, latestFile);
				const content = await fs.readFile(latestLog, "utf-8");

				// Get last N non-empty lines
				const lines = content
					.split("\n")
					.filter((line) => line.trim().length > 0)
					.slice(-lineCount);

				return lines;
			} catch {
				// Log file may not exist yet
				return [];
			}
		},
	};
};

/**

* Map task status from progress file to TaskInfo status
 */
function mapTaskStatus(
	status: string,
): "starting" | "in_progress" | "completed" | "failed" | "blocked" {
	switch (status) {
		case "pending":
			return "starting";
		case "in_progress":
			return "in_progress";
		case "completed":
			return "completed";
		case "failed":
			return "failed";
		case "blocked":
			return "blocked";
		default:
			return "starting";
	}
}

/**

* Convert progress file data to sandbox state
 */
function progressToSandboxState(
	label: string,
	sandboxId: string,
	progress: SandboxProgressFile | null,
	previousState: SandboxState | undefined,
	recentOutput?: string[],
): SandboxState {
	if (!progress) {
		// No progress file yet - sandbox may be initializing
		return {
			sandboxId,
			label,
			status: "ready",
			currentFeature: null,
			currentTask: null,
			currentGroup: null,
			tasksCompleted: 0,
			tasksTotal: 0,
			phase: "idle",
			contextUsage: 0,
			lastHeartbeat: previousState?.lastHeartbeat ?? null,
			lastTool: null,
			toolCount: 0,
			retryCount: 0,
			error: undefined,
			recentOutput,
		};
	}

	// Parse heartbeat timestamp
	let lastHeartbeat: Date | null = null;
	if (progress.last_heartbeat) {
		lastHeartbeat = new Date(progress.last_heartbeat);
	}

	// Determine status from progress data
	let status: SandboxState["status"] = "busy";
	if (progress.status === "idle") {
		// Explicitly idle - waiting for work
		status = "ready";
	} else if (progress.status === "completed") {
		status = "completed";
	} else if (progress.status === "failed") {
		status = "failed";
	} else if (!progress.feature) {
		status = "ready";
	}

	// Map current feature - defensively default fields from untrusted JSON
	const currentFeature = progress.feature
		? {
				id: progress.feature.issue_number || "Unknown",
				title: progress.feature.title || "Feature",
			}
		: null;

	// Map current task - require valid task ID
	// Fix for issue #1688: Removed fallback ID generation (`T${completedCount + 1}`)
	// that created misleading task references like "T21". Tasks without explicit IDs
	// now use "Unknown" to clearly indicate missing metadata.
	// Fix for crash: GPT/Codex agents may write current_task without `name` field.
	// All fields from untrusted JSON are now defensively defaulted.
	let currentTask: TaskInfo | null = null;
	if (progress.current_task) {
		// Use explicit task ID or "Unknown" - never generate fallback IDs
		const taskId = progress.current_task.id || "Unknown";

		currentTask = {
			id: taskId,
			name: progress.current_task.name || "Working...",
			status: mapTaskStatus(progress.current_task.status || "in_progress"),
			verificationAttempts: progress.current_task.verification_attempts,
			startedAt: progress.current_task.started_at
				? new Date(progress.current_task.started_at)
				: undefined,
		};
	}

	// Map current group
	let currentGroup: GroupInfo | null = null;
	if (progress.current_group) {
		currentGroup = {
			id: progress.current_group.id,
			name: progress.current_group.name,
			tasksTotal: progress.current_group.tasks_total,
			tasksCompleted: progress.current_group.tasks_completed,
		};
	}

	// Calculate tasks completed/total
	// Fix for issue #1688: Use authoritative task count from current_group when available.
	// Previously calculated from visible state (completed + failed + current) which missed
	// pending tasks, causing displays like "18/19" when actual total was different.
	const tasksCompleted = progress.completed_tasks?.length ?? 0;

	// Prefer authoritative total from current_group (represents actual feature task count)
	// Fall back to visible state calculation for backward compatibility
	let tasksTotal: number;
	if (
		progress.current_group?.tasks_total &&
		progress.current_group.tasks_total > 0
	) {
		// Use authoritative task count from feature's tasks.json (via current_group)
		tasksTotal = progress.current_group.tasks_total;
	} else {
		// Fallback: Calculate from visible state (less accurate, misses pending)
		const failedCount = progress.failed_tasks?.length ?? 0;
		const calculatedTotal =
			tasksCompleted + failedCount + (progress.current_task ? 1 : 0);

		// Preserve previous tasksTotal if it was higher (prevents flicker)
		const previousTotal = previousState?.tasksTotal ?? 0;
		tasksTotal =
			calculatedTotal > 0
				? Math.max(calculatedTotal, previousTotal)
				: previousTotal;
	}

	return {
		sandboxId,
		label,
		status,
		currentFeature,
		currentTask,
		currentGroup,
		tasksCompleted,
		tasksTotal,
		phase: (progress.phase as Phase) ?? "idle",
		contextUsage: progress.context_usage_percent ?? 0,
		lastHeartbeat,
		lastTool: progress.last_tool ?? null,
		toolCount: progress.tool_count ?? 0,
		retryCount: previousState?.retryCount ?? 0,
		error: undefined,
		lastCommit: progress.last_commit,
		waitingReason: progress.waiting_reason,
		blockedBy: progress.blocked_by,
		recentOutput,
	};
}

/**

* Aggregate sandbox states into overall progress
 */
function aggregateProgress(
	specId: string,
	specName: string,
	sandboxes: Map<string, SandboxState>,
	previousProgress: OverallProgress | null,
): OverallProgress {
	let featuresTotal = 0;
	let featuresCompleted = 0;
	let tasksTotal = 0;
	let tasksCompleted = 0;
	let activeFeatures = 0;

	// Count unique features across all sandboxes
	const seenFeatures = new Set<string>();

	for (const sandbox of sandboxes.values()) {
		if (
			sandbox.currentFeature &&
			!seenFeatures.has(sandbox.currentFeature.id)
		) {
			seenFeatures.add(sandbox.currentFeature.id);
			if (sandbox.status === "completed") {
				featuresCompleted++;
			} else {
				activeFeatures++;
			}
		}

		tasksTotal += sandbox.tasksTotal;
		tasksCompleted += sandbox.tasksCompleted;
	}

	// Use previous totals if we haven't discovered all features yet
	if (previousProgress && previousProgress.featuresTotal > seenFeatures.size) {
		featuresTotal = previousProgress.featuresTotal;
	} else {
		featuresTotal = seenFeatures.size;
	}

	// Determine overall status
	let status: OverallProgress["status"] = "in_progress";
	const allCompleted = Array.from(sandboxes.values()).every(
		(s) => s.status === "completed" || s.status === "ready",
	);
	const anyFailed = Array.from(sandboxes.values()).some(
		(s) => s.status === "failed",
	);

	if (anyFailed) {
		status = "failed";
	} else if (
		allCompleted &&
		featuresCompleted === featuresTotal &&
		featuresTotal > 0
	) {
		status = "completed";
	} else if (activeFeatures === 0 && featuresCompleted === 0) {
		status = "pending";
	}

	return {
		specId,
		specName,
		status,
		initiativesTotal: 1, // Specs have one initiative by design
		initiativesCompleted: status === "completed" ? 1 : 0,
		featuresTotal,
		featuresCompleted,
		tasksTotal,
		tasksCompleted,
	};
}

/**

* Generate events from state changes
 */
function generateEvents(
	previousState: UIState | null,
	newState: UIState,
): OrchestratorEvent[] {
	const events: OrchestratorEvent[] = [];
	const now = new Date();

	if (!previousState) {
		// Initial event - use first sandbox label or 'system'
		const firstLabel = Array.from(newState.sandboxes.keys())[0] ?? "sbx-a";
		events.push({
			id: `init-${now.getTime()}`,
			timestamp: now,
			type: "feature_start",
			sandboxLabel: firstLabel,
			message: `Spec #${newState.overallProgress.specId} started`,
		});

		// Generate initial events for all sandboxes on startup
		for (const [label, sandbox] of newState.sandboxes) {
			events.push({
				id: `sandbox-init-${label}-${now.getTime()}`,
				timestamp: now,
				type: "feature_start",
				sandboxLabel: label,
				message: `Sandbox ${label} initializing`,
			});

			// If sandbox already has a feature assigned, emit feature_start
			if (sandbox.currentFeature) {
				events.push({
					id: `feature-start-${sandbox.currentFeature.id}-${now.getTime()}`,
					timestamp: now,
					type: "feature_start",
					sandboxLabel: label,
					message: `Feature #${sandbox.currentFeature.id} started on ${label}`,
					details: { featureId: sandbox.currentFeature.id },
				});
			}
		}

		return events;
	}

	// Check each sandbox for changes
	for (const [label, sandbox] of newState.sandboxes) {
		const prevSandbox = previousState.sandboxes.get(label);

		// New sandbox
		if (!prevSandbox) {
			events.push({
				id: `sandbox-new-${label}-${now.getTime()}`,
				timestamp: now,
				type: "feature_start",
				sandboxLabel: label,
				message: `Sandbox ${label} started`,
			});
			continue;
		}

		// Feature started
		if (
			sandbox.currentFeature &&
			(!prevSandbox.currentFeature ||
				sandbox.currentFeature.id !== prevSandbox.currentFeature.id)
		) {
			events.push({
				id: `feature-start-${sandbox.currentFeature.id}-${now.getTime()}`,
				timestamp: now,
				type: "feature_start",
				sandboxLabel: label,
				message: `Feature #${sandbox.currentFeature.id} started on ${label}`,
				details: { featureId: sandbox.currentFeature.id },
			});
		}

		// Task started - only emit if task has a valid ID
		if (
			sandbox.currentTask?.id &&
			(!prevSandbox.currentTask ||
				sandbox.currentTask.id !== prevSandbox.currentTask.id)
		) {
			events.push({
				id: `task-start-${sandbox.currentTask.id}-${now.getTime()}`,
				timestamp: now,
				type: "task_start",
				sandboxLabel: label,
				message: `Task ${sandbox.currentTask.id} started`,
				details: { taskId: sandbox.currentTask.id },
			});
		}

		// Task completed - detect by tasksCompleted count increasing
		// When a task completes, it moves from currentTask to completed_tasks array,
		// so we can't rely on currentTask.status changing to "completed"
		if (sandbox.tasksCompleted > prevSandbox.tasksCompleted) {
			// A task was completed - use the previous currentTask if available
			const completedTaskId = prevSandbox.currentTask?.id ?? "unknown";
			const completedTaskName = prevSandbox.currentTask?.name ?? "Task";
			events.push({
				id: `task-done-${completedTaskId}-${now.getTime()}`,
				timestamp: now,
				type: "task_complete",
				sandboxLabel: label,
				message: `${completedTaskName} completed`,
				details: { taskId: completedTaskId },
			});
		}

		// Feature completed (status changed to completed)
		if (prevSandbox.status === "busy" && sandbox.status === "completed") {
			events.push({
				id: `feature-done-${label}-${now.getTime()}`,
				timestamp: now,
				type: "feature_complete",
				sandboxLabel: label,
				message: `Feature completed on ${label}`,
				details: { featureId: sandbox.currentFeature?.id },
			});
		}

		// Sandbox became idle (had feature, now doesn't, and not completed)
		if (
			prevSandbox.currentFeature &&
			!sandbox.currentFeature &&
			sandbox.status === "ready" &&
			sandbox.waitingReason
		) {
			events.push({
				id: `sandbox-idle-${label}-${now.getTime()}`,
				timestamp: now,
				type: "sandbox_idle",
				sandboxLabel: label,
				message: `Idle: ${sandbox.waitingReason}`,
				details: { blockedBy: sandbox.blockedBy },
			});
		}

		// Sandbox unblocked (was idle with waiting reason, now has feature)
		if (
			!prevSandbox.currentFeature &&
			prevSandbox.waitingReason &&
			sandbox.currentFeature
		) {
			events.push({
				id: `sandbox-unblocked-${label}-${now.getTime()}`,
				timestamp: now,
				type: "sandbox_unblocked",
				sandboxLabel: label,
				message: `Unblocked: starting #${sandbox.currentFeature.id}`,
				details: { featureId: sandbox.currentFeature.id },
			});
		}

		// Stall detected
		if (sandbox.lastHeartbeat) {
			const heartbeatAge = now.getTime() - sandbox.lastHeartbeat.getTime();
			const prevAge = prevSandbox.lastHeartbeat
				? now.getTime() - prevSandbox.lastHeartbeat.getTime()
				: 0;

			if (
				heartbeatAge > HEARTBEAT_STALL_THRESHOLD_MS &&
				prevAge <= HEARTBEAT_STALL_THRESHOLD_MS
			) {
				events.push({
					id: `stall-${label}-${now.getTime()}`,
					timestamp: now,
					type: "stall_detected",
					sandboxLabel: label,
					message: `Stall detected on ${label}`,
				});
			}
		}

		// Error occurred
		if (sandbox.error && sandbox.error !== prevSandbox.error) {
			events.push({
				id: `error-${label}-${now.getTime()}`,
				timestamp: now,
				type: "error",
				sandboxLabel: label,
				message: sandbox.error,
			});
		}
	}

	// Spec completed
	if (
		previousState.overallProgress.status === "in_progress" &&
		newState.overallProgress.status === "completed"
	) {
		const firstLabel = Array.from(newState.sandboxes.keys())[0] ?? "sbx-a";
		events.push({
			id: `spec-done-${now.getTime()}`,
			timestamp: now,
			type: "feature_complete",
			sandboxLabel: firstLabel,
			message: `Spec #${newState.overallProgress.specId} completed!`,
		});
	}

	return events;
}

/**

* Custom hook for polling sandbox progress files
*
* Polls progress files at regular intervals and maintains
* orchestrator state with sandbox statuses, overall progress,
* and event log.
 */
export function useProgressPoller(
	config: ProgressPollerConfig,
	reader: ProgressReader = createFsProgressReader(),
): {
	state: UIState;
	isPolling: boolean;
	lastPollTime: Date | null;
	error: Error | null;
	startPolling: () => void;
	stopPolling: () => void;
	pollNow: () => Promise<void>;
} {
	const {
		specId,
		specName,
		progressDir,
		logsDir,
		sandboxLabels,
		pollInterval = POLL_INTERVAL_MS,
		onStateChange,
		onError,
	} = config;

	// State
	const [state, setState] = useState<UIState>(() => ({
		sandboxes: new Map(),
		overallProgress: {
			specId,
			specName,
			status: "pending",
			initiativesTotal: 1,
			initiativesCompleted: 0,
			featuresTotal: 0,
			featuresCompleted: 0,
			tasksTotal: 0,
			tasksCompleted: 0,
		},
		events: [],
		sessionStartTime: new Date(),
		uiMode: "dashboard",
	}));

	const [isPolling, setIsPolling] = useState(false);
	const [lastPollTime, setLastPollTime] = useState<Date | null>(null);
	const [error, setError] = useState<Error | null>(null);

	// Refs for interval management
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const previousStateRef = useRef<UIState | null>(null);
	const sandboxIdsRef = useRef<Map<string, string>>(new Map());

	/**
	 * Perform a single poll of all sandbox progress files
	 */
	const pollNow = useCallback(async () => {
		try {
			// Read all progress files, logs, and overall progress in parallel
			const [overallProgressFile, ...results] = await Promise.all([
				reader.readOverallProgress(progressDir),
				...sandboxLabels.map((label) =>
					reader.readProgressFile(label, progressDir),
				),
			]);

			// Build new sandbox states
			const newSandboxes = new Map<string, SandboxState>();

			// Track which sandboxes need log file fallback (no recent_output in JSON)
			const needsLogFallback: { index: number; label: string }[] = [];

			for (let i = 0; i < results.length; i++) {
				const result = results[i];
				if (!result) continue;

				// Prefer recent_output from JSON progress file (real-time)
				// Fall back to log files only if JSON doesn't have recent_output
				let recentOutput: string[] = [];
				if (
					result.data?.recent_output &&
					Array.isArray(result.data.recent_output) &&
					result.data.recent_output.length > 0
				) {
					// Use real-time output from JSON (last 3 lines for display)
					recentOutput = result.data.recent_output.slice(-3);
				} else {
					// Mark for log file fallback
					needsLogFallback.push({ index: i, label: result.label });
				}

				// Get or generate sandbox ID
				let sandboxId = sandboxIdsRef.current.get(result.label);
				if (!sandboxId) {
					sandboxId =
						result.data?.session_id ?? `${result.label}-${Date.now()}`;
					sandboxIdsRef.current.set(result.label, sandboxId);
				}

				const previousSandbox = previousStateRef.current?.sandboxes.get(
					result.label,
				);

				const sandboxState = progressToSandboxState(
					result.label,
					sandboxId,
					result.data,
					previousSandbox,
					recentOutput,
				);

				newSandboxes.set(result.label, sandboxState);
			}

			// Fallback: Read logs for sandboxes without recent_output in JSON
			// This maintains backward compatibility during transition
			if (needsLogFallback.length > 0) {
				const logsResults = await Promise.all(
					needsLogFallback.map(({ label }) =>
						reader.readRecentLogs(label, logsDir, 3),
					),
				);

				// Update sandbox states with log-based output
				for (let i = 0; i < needsLogFallback.length; i++) {
					const fallbackEntry = needsLogFallback[i];
					if (!fallbackEntry) continue;
					const { label } = fallbackEntry;
					const logOutput = logsResults[i] ?? [];
					const existingState = newSandboxes.get(label);
					if (existingState && logOutput.length > 0) {
						// Create updated state with log-based output
						newSandboxes.set(label, {
							...existingState,
							recentOutput: logOutput,
						});
					}
				}
			}

			// Use overall progress from file for manifest-level data
			// FIXED (Issue #1699, #1701): The manifest's writeOverallProgress() now calculates
			// tasksCompleted by summing tasks_completed from ALL features (completed + in-progress).
			// Previously, we added sandbox inProgressTasks on top, causing double-counting.
			// Now we use the manifest's authoritative counts directly.
			// See: manifest.ts writeOverallProgress() fix for issue #1688
			let newProgress: OverallProgress;
			if (overallProgressFile) {
				newProgress = {
					specId: overallProgressFile.specId,
					specName: overallProgressFile.specName,
					status: overallProgressFile.status as OverallProgress["status"],
					initiativesCompleted: overallProgressFile.initiativesCompleted,
					initiativesTotal: overallProgressFile.initiativesTotal,
					featuresCompleted: overallProgressFile.featuresCompleted,
					featuresTotal: overallProgressFile.featuresTotal,
					// Use manifest's authoritative task count (includes all features)
					// No longer adding sandbox inProgressTasks to avoid double-counting
					tasksCompleted: overallProgressFile.tasksCompleted,
					tasksTotal: overallProgressFile.tasksTotal,
					branchName: overallProgressFile.branchName,
					reviewUrls: overallProgressFile.reviewUrls,
				};
			} else {
				// Fallback: aggregate from sandbox states (less accurate)
				newProgress = aggregateProgress(
					specId,
					specName,
					newSandboxes,
					previousStateRef.current?.overallProgress ?? null,
				);
			}

			// Generate events from state changes
			const newEvents = generateEvents(previousStateRef.current, {
				sandboxes: newSandboxes,
				overallProgress: newProgress,
				events: [],
				sessionStartTime: state.sessionStartTime,
				uiMode: "dashboard",
			});

			// Build new state
			const newState: UIState = {
				sandboxes: newSandboxes,
				overallProgress: newProgress,
				events: [
					...newEvents,
					...(previousStateRef.current?.events ?? []),
				].slice(0, 100), // Keep last 100 events
				sessionStartTime: state.sessionStartTime,
				uiMode: "dashboard",
			};

			// Smart diffing: Only update state if something meaningful changed
			// This prevents unnecessary re-renders when polling returns the same data
			const prevState = previousStateRef.current;
			const sandboxesChanged =
				!prevState || !sandboxMapsEqual(newSandboxes, prevState.sandboxes);
			const progressChanged =
				!prevState || !progressEqual(newProgress, prevState.overallProgress);
			const hasNewEvents = newEvents.length > 0;

			// Only update state when something meaningful changed to prevent flickering
			if (sandboxesChanged || progressChanged || hasNewEvents) {
				setState(newState);
				setLastPollTime(new Date());
				onStateChange?.(newState);
			}

			// Always update ref for next comparison
			previousStateRef.current = newState;

			// Only clear error if it was previously set
			if (error !== null) {
				setError(null);
			}
		} catch (err) {
			const pollError = err instanceof Error ? err : new Error(String(err));
			setError(pollError);
			onError?.(pollError);
		}
	}, [
		sandboxLabels,
		progressDir,
		logsDir,
		reader,
		specId,
		specName,
		state.sessionStartTime,
		onStateChange,
		onError,
		error,
	]);

	/**
	 * Start polling at regular intervals
	 */
	const startPolling = useCallback(() => {
		if (intervalRef.current) return; // Already polling

		setIsPolling(true);
		pollNow(); // Poll immediately

		intervalRef.current = setInterval(() => {
			pollNow();
		}, pollInterval);
	}, [pollNow, pollInterval]);

	/**
	 * Stop polling
	 */
	const stopPolling = useCallback(() => {
		if (intervalRef.current) {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
		}
		setIsPolling(false);
	}, []);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
		};
	}, []);

	return {
		state,
		isPolling,
		lastPollTime,
		error,
		startPolling,
		stopPolling,
		pollNow,
	};
}

/**

* Create initial UI state
 */
export function createInitialState(specId: string, specName: string): UIState {
	return {
		sandboxes: new Map(),
		overallProgress: {
			specId,
			specName,
			status: "pending",
			initiativesTotal: 1,
			initiativesCompleted: 0,
			featuresTotal: 0,
			featuresCompleted: 0,
			tasksTotal: 0,
			tasksCompleted: 0,
		},
		events: [],
		sessionStartTime: new Date(),
		uiMode: "dashboard",
	};
}
