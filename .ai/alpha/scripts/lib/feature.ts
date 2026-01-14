/**

* Feature Implementation Module
*
* Handles running feature implementations in E2B sandboxes.
* Manages progress polling, git operations, and result tracking.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import process from "node:process";

import {
	FEATURE_TIMEOUT_MS,
	LOGS_DIR,
	MAX_STARTUP_RETRIES,
	PROGRESS_FILE,
	RECENT_OUTPUT_LINES,
	STARTUP_TIMEOUT_MS,
	WORKSPACE_DIR,
} from "../config/index.js";
import type {
	FeatureEntry,
	FeatureImplementationResult,
	SandboxInstance,
	SpecManifest,
	StartupAttemptRecord,
} from "../types/index.js";
import { getAllEnvVars, getAuthMethod } from "./environment.js";
import { killClaudeProcess } from "./health.js";
import { getProjectRoot } from "./lock.js";
import { saveManifest } from "./manifest.js";
import {
	checkForStall,
	type OutputTracker,
	startProgressPolling,
	writeUIProgress,
} from "./progress.js";
import {
	createStartupOutputTracker,
	formatStartupFailureLog,
	formatStartupSuccessLog,
	getRetryDelay,
	updateOutputTracker,
} from "./startup-monitor.js";
import { updateNextFeatureId } from "./work-queue.js";

// ============================================================================
// Logging Helper
// ============================================================================

/**

* Create a conditional logger that only outputs when UI is disabled.
 */
function createLogger(uiEnabled: boolean) {
	return {
		log: (...args: unknown[]) => {
			if (!uiEnabled) console.log(...args);
		},
	};
}

// ============================================================================
// Log File Management
// ============================================================================

/**
 * Ensure the logs directory exists for a specific run.
 *
 * @param runId - Optional run ID for run-specific directory
 * @returns The logs directory path
 */
function ensureLogsDir(runId?: string): string {
	const baseLogsDir = path.join(getProjectRoot(), LOGS_DIR);
	const logsDir = runId ? path.join(baseLogsDir, runId) : baseLogsDir;
	if (!fs.existsSync(logsDir)) {
		fs.mkdirSync(logsDir, { recursive: true });
	}
	return logsDir;
}

/**
 * Create a write stream for sandbox output logs.
 * Returns the stream and file path.
 *
 * @param sandboxLabel - The sandbox label (e.g., "sbx-a")
 * @param runId - Optional run ID for organizing logs by run
 * @param specId - Optional spec ID for session header
 * @returns Object with stream and file path
 */
function createLogStream(
	sandboxLabel: string,
	runId?: string,
	specId?: number,
): {
	stream: fs.WriteStream;
	filePath: string;
} {
	const logsDir = ensureLogsDir(runId);

	// Use simple filename when run ID is provided (logs are already in run-specific dir)
	// Fall back to timestamp format for backward compatibility
	const filename = runId
		? `${sandboxLabel}.log`
		: `${sandboxLabel}-${new Date().toISOString().replace(/[:.]/g, "-")}.log`;

	const filePath = path.join(logsDir, filename);
	const stream = fs.createWriteStream(filePath, { flags: "a" });

	// Write session header if we have run ID and spec ID
	if (runId && specId !== undefined) {
		const separator = "=".repeat(80);
		const now = new Date().toISOString();
		const header = `${separator}
Alpha Orchestrator Log
Run ID: ${runId}
Spec ID: ${specId}
Sandbox: ${sandboxLabel}
Started: ${now}
${separator}
`;
		stream.write(header);
	}

	return { stream, filePath };
}

// ============================================================================
// Feature Implementation
// ============================================================================

/**

* Run feature implementation in a sandbox.
*
* @param instance - The sandbox instance
* @param manifest - The spec manifest
* @param feature - The feature to implement
* @param uiEnabled - Whether UI mode is enabled
* @returns Result with success status, tasks completed, and error if any
 */
export async function runFeatureImplementation(
	instance: SandboxInstance,
	manifest: SpecManifest,
	feature: FeatureEntry,
	uiEnabled: boolean = false,
): Promise<FeatureImplementationResult> {
	// Create conditional logger
	const { log } = createLogger(uiEnabled);

	log(`\n   ┌── [${instance.label}] Feature #${feature.id}: ${feature.title}`);
	log(`│   Tasks: ${feature.task_count}`);

	// Mark feature as in_progress (may already be set by orchestrator to prevent race condition)
	if (
		feature.status !== "in_progress" ||
		feature.assigned_sandbox !== instance.label
	) {
		feature.status = "in_progress";
		feature.assigned_sandbox = instance.label;
		saveManifest(manifest);
	}

	// Update instance state
	instance.currentFeature = feature.id;
	instance.status = "busy";
	instance.featureStartedAt = new Date();
	instance.lastProgressSeen = undefined;
	instance.lastHeartbeat = undefined;
	instance.outputLineCount = 0;
	instance.hasReceivedOutput = false;

	// CRITICAL: Pull latest code before starting feature
	const branchName = manifest.sandbox.branch_name;

	// Check if remote branch exists before attempting pull
	const remoteBranchCheck = await instance.sandbox.commands.run(
		`cd ${WORKSPACE_DIR} && git ls-remote --heads origin "${branchName}" | wc -l`,
		{ timeoutMs: 30000 },
	);
	const remoteBranchExists = remoteBranchCheck.stdout.trim() === "1";

	if (!remoteBranchExists) {
		log("   │   ℹ️ Remote branch not yet pushed - skipping pull");
	} else {
		log("   │   Pulling latest code...");
		try {
			await instance.sandbox.commands.run(
				`cd ${WORKSPACE_DIR} && git fetch origin "${branchName}" && git reset --hard FETCH_HEAD`,
				{ timeoutMs: 60000 },
			);
			log("   │   ✓ Code synced");
		} catch (pullError) {
			log(`│   ⚠ Pull failed (continuing anyway): ${pullError}`);
		}
	}

	// CRITICAL: Clear stale progress file AFTER git pull
	// This must happen after git operations because git reset --hard may restore
	// a stale .initiative-progress.json from the remote branch
	try {
		await instance.sandbox.commands.run(
			`cd ${WORKSPACE_DIR} && rm -f ${PROGRESS_FILE}`,
			{ timeoutMs: 5000 },
		);
	} catch {
		// Ignore - file may not exist
	}

	const prompt = `/alpha:implement ${feature.id}`;
	const authMethod = getAuthMethod();
	log(`│   Running: ${prompt}`);
	log(
		`│   Auth: ${authMethod === "api_key" ? "API key (preferred)" : authMethod === "oauth" ? "OAuth" : "none"}`,
	);

	let capturedStdout = "";
	// Note: PTY combines stdout/stderr through the terminal, so we don't track stderr separately
	const recentOutput: string[] = []; // Track last N lines for UI

	// Create log file for this feature run
	// Use run ID to organize logs in run-specific directory
	const { stream: logStream, filePath: logFilePath } = createLogStream(
		instance.label,
		instance.runId,
		manifest.metadata.spec_id,
	);
	log(`│   Log file: ${logFilePath}`);

	// Track when this session started
	const sessionStartTime = new Date();

	// Create output tracker for sharing between callback and polling
	const outputTracker: OutputTracker = { recentOutput };

	// Start progress polling with output tracker for UI
	const progressPoller = startProgressPolling(
		instance.sandbox,
		feature.task_count,
		instance.label,
		sessionStartTime,
		uiEnabled,
		instance,
		feature,
		outputTracker,
	);

	// Write UI progress at regular intervals to show real-time output
	// This ensures the UI stays updated even when progress polling is slow or fails
	let uiProgressInterval: ReturnType<typeof setInterval> | null = null;
	if (uiEnabled) {
		uiProgressInterval = setInterval(() => {
			writeUIProgress(
				instance.label,
				progressPoller.getLastProgress(),
				instance,
				feature,
				outputTracker,
			);
		}, 2000); // Every 2 seconds
	}

	// Start stall detection interval with ACTIONABLE recovery
	let stallDetected = false;
	let stallRecoveryInProgress = false;
	const stallCheckInterval = setInterval(async () => {
		if (stallRecoveryInProgress) return;

		const lastProgress = progressPoller.getLastProgress();
		const stallCheck = checkForStall(lastProgress, sessionStartTime);
		if (stallCheck.stalled && !stallDetected) {
			stallDetected = true;
			stallRecoveryInProgress = true;
			log(`│   ⚠️ STALL DETECTED: ${stallCheck.reason}`);
			log("│   🔪 Killing Claude process for recovery...");

			// Kill the Claude process to trigger early exit
			await killClaudeProcess(instance, uiEnabled);
		}
	}, 60000);

	// Track startup attempts for this feature (for diagnostics and retry logic)
	const startupAttemptRecord: StartupAttemptRecord = {
		totalAttempts: 1,
		succeededOnAttempt: null,
		attemptTimestamps: [new Date().toISOString()],
		totalStartupTimeMs: 0,
	};

	// Create startup output tracker for early hang detection
	// NOTE: This tracker is reset at the start of each retry attempt
	let startupTracker = createStartupOutputTracker();
	let startupHangDetected = false;
	let startupRecoveryInProgress = false;

	// Startup hang detection - checks in the first 60 seconds if we're receiving output
	// This is separate from the general stall detection which kicks in after 5 minutes
	const startupCheckInterval = setInterval(async () => {
		if (startupRecoveryInProgress || startupHangDetected) return;

		const elapsedMs = Date.now() - startupTracker.startTime.getTime();

		// Only check during startup window (first 60 seconds)
		if (elapsedMs > STARTUP_TIMEOUT_MS) {
			// If we've passed the startup window and have meaningful output, we're good
			if (startupTracker.lineCount >= 5 || startupTracker.byteCount >= 100) {
				clearInterval(startupCheckInterval);
				startupAttemptRecord.succeededOnAttempt =
					startupAttemptRecord.totalAttempts;
				startupAttemptRecord.totalStartupTimeMs = elapsedMs;
				log(
					`   │   ${formatStartupSuccessLog(instance.label, { success: true, outputLines: startupTracker.lineCount, outputBytes: startupTracker.byteCount, elapsedMs }, startupAttemptRecord.totalAttempts)}`,
				);
				return;
			}

			// Startup hung - not enough output within timeout
			startupHangDetected = true;
			startupRecoveryInProgress = true;

			log(
				`   │   ${formatStartupFailureLog(instance.label, { success: false, outputLines: startupTracker.lineCount, outputBytes: startupTracker.byteCount, elapsedMs, error: `No meaningful output after ${Math.round(elapsedMs / 1000)}s` }, startupAttemptRecord.totalAttempts)}`,
			);

			// Check if we should retry
			if (startupAttemptRecord.totalAttempts < MAX_STARTUP_RETRIES) {
				const retryDelay = getRetryDelay(startupAttemptRecord.totalAttempts);
				if (retryDelay !== null) {
					log(
						`   │   🔄 Will retry startup (attempt ${startupAttemptRecord.totalAttempts + 1}/${MAX_STARTUP_RETRIES}) after ${retryDelay / 1000}s delay`,
					);
				}
			} else {
				log(
					`   │   ❌ Max startup retries (${MAX_STARTUP_RETRIES}) exceeded - marking feature as failed`,
				);
			}

			// Kill the Claude process to trigger retry
			await killClaudeProcess(instance, uiEnabled);
		}
	}, 10000); // Check every 10 seconds during startup

	// ============================================================================
	// Retry Loop for Startup Hang Recovery
	// ============================================================================
	// When Claude CLI hangs during startup (no output within 60s), the startup
	// check interval detects it, sets startupHangDetected=true, and kills the process.
	// This retry loop catches that error and retries with exponential backoff.
	// CommandResult type from E2B SDK - compatible with both commands.run() and pty.wait()
	let executionResult: {
		exitCode: number;
		error?: string;
		stdout: string;
		stderr: string;
	} | null = null;

	for (
		let attemptNumber = 1;
		attemptNumber <= MAX_STARTUP_RETRIES;
		attemptNumber++
	) {
		// Track this attempt in the startup record
		startupAttemptRecord.totalAttempts = attemptNumber;
		if (attemptNumber > 1) {
			startupAttemptRecord.attemptTimestamps.push(new Date().toISOString());
		}

		// CRITICAL: Reset startup tracking state for this attempt
		// This ensures fresh tracking for each retry
		startupTracker = createStartupOutputTracker();
		startupHangDetected = false;
		startupRecoveryInProgress = false;

		// Reset output tracking on retry (but keep log file stream open)
		if (attemptNumber > 1) {
			capturedStdout = "";
			recentOutput.length = 0;
			instance.outputLineCount = 0;
			instance.hasReceivedOutput = false;
			log(
				`   │   🔄 [STARTUP_ATTEMPT_${attemptNumber}] ${instance.label}: Retrying Claude CLI (attempt ${attemptNumber}/${MAX_STARTUP_RETRIES})`,
			);
			logStream.write(
				`\n=== RETRY ATTEMPT ${attemptNumber}/${MAX_STARTUP_RETRIES} ===\n`,
			);
		}

		try {
			// Use PTY (pseudo-terminal) instead of commands.run() to fix buffering issue
			// PTY allocates a real TTY, forcing Node.js CLI tools to use line-buffering
			// instead of block-buffering, enabling real-time output streaming.
			// See: #1472, #1469 for diagnosis and fix details
			log(
				`   │   🖥️  [PTY_CREATE] ${instance.label}: Creating PTY (cols=120, rows=40, timeout=${FEATURE_TIMEOUT_MS}ms)`,
			);
			logStream.write(
				`[PTY] Creating PTY session at ${new Date().toISOString()}\n`,
			);

			const ptyHandle = await instance.sandbox.pty.create({
				cols: 120,
				rows: 40,
				onData: (output: Uint8Array) => {
					// Decode output data from Uint8Array to string
					const data = new TextDecoder().decode(output);

					capturedStdout += data;

					// Always write to log file (persisted on orchestrator machine)
					logStream.write(data);

					// Track output in startup tracker for early hang detection
					updateOutputTracker(startupTracker, data);

					// Track recent output lines for UI
					const lines = data.split("\n");
					for (const line of lines) {
						if (line.trim()) {
							recentOutput.push(line);
							// Keep only last N lines
							if (recentOutput.length > RECENT_OUTPUT_LINES) {
								recentOutput.shift();
							}
							// Track output for startup hung detection
							instance.outputLineCount = (instance.outputLineCount ?? 0) + 1;
							// Mark as having received meaningful output
							// (more than just startup banner)
							if ((instance.outputLineCount ?? 0) >= 5) {
								instance.hasReceivedOutput = true;
							}
						}
					}

					// Only output to console when UI is disabled
					if (!uiEnabled) {
						for (const line of lines) {
							if (line.trim()) {
								process.stdout.write(`│   ${line}\n`);
							}
						}
					}
				},
				cwd: WORKSPACE_DIR,
				envs: {
					...getAllEnvVars(),
					// PTY environment variables for proper terminal behavior
					TERM: "xterm-256color",
					FORCE_COLOR: "1",
					CI: "false",
				},
				timeoutMs: FEATURE_TIMEOUT_MS,
			});

			log(
				`   │   🖥️  [PTY_READY] ${instance.label}: PTY created (PID=${ptyHandle.pid})`,
			);
			logStream.write(`[PTY] PTY created with PID ${ptyHandle.pid}\n`);

			// Send the command to the PTY shell
			// PTY creates an interactive shell, so we send the command followed by exit
			// to ensure the shell exits when the command completes (preserving exit code)
			const command = `run-claude "${prompt.replace(/"/g, '\\"')}"\nexit $?\n`;

			log(`   │   📤 [PTY_INPUT] ${instance.label}: Sending command to PTY`);
			logStream.write(`[PTY] Sending command: ${command.split("\n")[0]}\n`);

			await instance.sandbox.pty.sendInput(
				ptyHandle.pid,
				new TextEncoder().encode(command),
			);

			// Wait for PTY command to complete
			log(
				`   │   ⏳ [PTY_WAIT] ${instance.label}: Waiting for PTY to complete...`,
			);
			executionResult = await ptyHandle.wait();

			log(
				`   │   ✅ [PTY_DONE] ${instance.label}: PTY completed (exitCode=${executionResult.exitCode})`,
			);
			logStream.write(
				`[PTY] PTY completed with exit code ${executionResult.exitCode}\n`,
			);

			// Success - record which attempt succeeded and break out of retry loop
			startupAttemptRecord.succeededOnAttempt = attemptNumber;
			if (attemptNumber > 1) {
				log(
					`   │   ✅ [STARTUP_SUCCESS] ${instance.label}: Claude CLI started successfully on attempt ${attemptNumber}`,
				);
			}
			break; // Exit retry loop on success
		} catch (retryError) {
			// Check if this was a startup hang that we should retry
			if (startupHangDetected && attemptNumber < MAX_STARTUP_RETRIES) {
				// Startup hang detected - wait with exponential backoff then retry
				const retryDelay = getRetryDelay(attemptNumber);
				if (retryDelay !== null) {
					log(
						`   │   ⏳ Waiting ${retryDelay / 1000}s before retry attempt ${attemptNumber + 1}/${MAX_STARTUP_RETRIES}...`,
					);
					logStream.write(
						`\n=== WAITING ${retryDelay / 1000}s BEFORE RETRY ===\n`,
					);
					await new Promise((resolve) => setTimeout(resolve, retryDelay));
				}
				continue; // Retry
			}

			// Max retries exceeded OR different error - propagate to outer catch
			throw retryError;
		}
	}

	// At this point, executionResult should be set from successful attempt
	// If all retries failed, we would have thrown in the catch block above
	const result = executionResult!;

	try {
		// Stop polling, stall detection, startup monitoring, and UI progress updates
		progressPoller.stop();
		clearInterval(stallCheckInterval);
		clearInterval(startupCheckInterval);
		if (uiProgressInterval) clearInterval(uiProgressInterval);

		// Close the log stream
		logStream.end();

		// Get last progress from poller as a fallback
		const lastPolledProgress = progressPoller.getLastProgress();

		// Read progress file
		const progressResult = await instance.sandbox.commands.run(
			`cat ${WORKSPACE_DIR}/${PROGRESS_FILE} 2>/dev/null || echo '{}'`,
			{ timeoutMs: 10000 },
		);

		let tasksCompleted = 0;
		let status: FeatureEntry["status"] = "completed";

		try {
			const parsed = JSON.parse(progressResult.stdout || "{}");
			tasksCompleted = parsed.completed_tasks?.length || 0;

			if (parsed.status === "completed" || result.exitCode === 0) {
				status = "completed";
			} else if (parsed.status === "blocked") {
				status = "blocked";
			} else {
				status = "failed";
			}
		} catch {
			status = result.exitCode === 0 ? "completed" : "failed";
		}

		// Fallback: Use last polled progress if available
		if (tasksCompleted === 0 && lastPolledProgress?.completed_tasks) {
			tasksCompleted = lastPolledProgress.completed_tasks.length;
		}

		// Fallback: If completed, try to extract from output or assume all tasks done
		if (
			status === "completed" &&
			result.exitCode === 0 &&
			tasksCompleted === 0
		) {
			const taskMatch = capturedStdout.match(
				/Tasks?:?\s*(\d+)\s*\/\s*(\d+)\s*(?:completed|complete|\(100%\))/i,
			);
			const taskCountStr = taskMatch?.[1];
			if (taskCountStr) {
				tasksCompleted = parseInt(taskCountStr, 10);
			} else {
				tasksCompleted = feature.task_count;
			}
		}

		// Update feature
		feature.status = status;
		feature.tasks_completed = tasksCompleted;
		feature.assigned_sandbox = undefined;
		feature.assigned_at = undefined;
		instance.currentFeature = null;
		instance.status = "ready";
		instance.outputLineCount = 0;
		instance.hasReceivedOutput = false;

		// Update progress
		if (status === "completed") {
			// NOTE: features_completed is now calculated from manifest state in writeOverallProgress()
			// This prevents counts from exceeding totals when features are retried
			manifest.progress.last_completed_feature_id = feature.id;

			// Update initiative status
			const initiative = manifest.initiatives.find(
				(i) => i.id === feature.initiative_id,
			);
			if (initiative) {
				// Calculate features_completed from state instead of incrementing
				// This prevents counts from exceeding totals when features are retried
				const initFeatures = manifest.feature_queue.filter(
					(f) => f.initiative_id === initiative.id,
				);
				initiative.features_completed = initFeatures.filter(
					(f) => f.status === "completed",
				).length;

				if (initFeatures.every((f) => f.status === "completed")) {
					initiative.status = "completed";
					// NOTE: initiatives_completed is calculated from manifest state in writeOverallProgress()
				} else {
					initiative.status = "in_progress";
				}
			}

			// CRITICAL: Push after completing feature
			try {
				await instance.sandbox.commands.run(
					`cd ${WORKSPACE_DIR} && git push origin "${manifest.sandbox.branch_name}"`,
					{ timeoutMs: 120000 },
				);
			} catch (pushError) {
				log(`   │   ⚠ Push failed: ${pushError}`);
			}
		}

		// NOTE: tasks_completed is now calculated from manifest state in writeOverallProgress()
		// This prevents counts from exceeding totals when features are retried
		updateNextFeatureId(manifest);
		saveManifest(manifest);

		const icon =
			status === "completed" ? "✅" : status === "blocked" ? "🚫" : "❌";
		log(
			`   └── ${icon} ${status} (${tasksCompleted}/${feature.task_count} tasks)`,
		);

		return {
			success: status === "completed",
			tasksCompleted,
			error: status !== "completed" ? `Feature ${status}` : undefined,
		};
	} catch (error) {
		// Stop polling, stall detection, startup monitoring, and UI progress updates on error
		progressPoller.stop();
		clearInterval(stallCheckInterval);
		clearInterval(startupCheckInterval);
		if (uiProgressInterval) clearInterval(uiProgressInterval);

		// Close the log stream
		logStream.end();

		const errorMessage = error instanceof Error ? error.message : String(error);

		// Check if this was a stall-triggered kill or startup hang recovery
		const wasStallRecovery = stallDetected;
		const wasStartupHang = startupHangDetected;
		const maxRetriesExhausted =
			wasStartupHang &&
			startupAttemptRecord.totalAttempts >= MAX_STARTUP_RETRIES;

		// Construct error message with retry information
		let finalError: string;
		if (wasStartupHang && maxRetriesExhausted) {
			finalError = `Startup hang detected after ${MAX_STARTUP_RETRIES} retries: ${errorMessage}`;
		} else if (wasStartupHang) {
			finalError = `Startup hang detected: ${errorMessage}`;
		} else if (wasStallRecovery) {
			finalError = `Stall detected and recovered: ${errorMessage}`;
		} else {
			finalError = errorMessage;
		}

		feature.status = "failed";
		feature.error = finalError;
		feature.assigned_sandbox = undefined;
		feature.assigned_at = undefined;
		instance.currentFeature = null;
		instance.status = "ready";
		instance.outputLineCount = 0;
		instance.hasReceivedOutput = false;
		updateNextFeatureId(manifest);
		saveManifest(manifest);

		log(`   └── ❌ Error: ${finalError}`);

		// Log additional diagnostic information for startup failures
		if (wasStartupHang) {
			log(
				`   │   📊 Startup attempts: ${startupAttemptRecord.totalAttempts}/${MAX_STARTUP_RETRIES}`,
			);
			log(
				`   │   ⏱️  Attempt timestamps: ${startupAttemptRecord.attemptTimestamps.join(", ")}`,
			);
		}

		if (wasStallRecovery || (wasStartupHang && !maxRetriesExhausted)) {
			log("   │   Feature will be retried by another sandbox");
		}

		return {
			success: false,
			tasksCompleted: 0,
			error: finalError,
		};
	}
}
