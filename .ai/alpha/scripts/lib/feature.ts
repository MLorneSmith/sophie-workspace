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
	AgentProvider,
	FeatureEntry,
	FeatureImplementationResult,
	SandboxInstance,
	SpecManifest,
	StartupAttemptRecord,
} from "../types/index.js";
import { syncFeatureMigrations } from "./database.js";
import {
	getAllEnvVars,
	getAuthMethod,
	getOpenAIAuthMethod,
} from "./environment.js";
import { transitionFeatureStatus } from "./feature-transitions.js";
import { killClaudeProcess } from "./health.js";
import { getProjectRoot } from "./lock.js";
import { saveManifest } from "./manifest.js";
import {
	buildImplementationPrompt,
	buildProviderCommand,
	getProviderDisplayName,
} from "./provider.js";
import {
	checkForStall,
	type OutputTracker,
	startProgressPolling,
	writeUIProgress,
} from "./progress.js";
import {
	PTYTimeoutError,
	type WaitWithTimeoutResult,
	waitWithTimeout,
} from "./pty-wrapper.js";
import {
	createStartupOutputTracker,
	formatStartupFailureLog,
	formatStartupSuccessLog,
	getRetryDelay,
	updateOutputTracker,
} from "./startup-monitor.js";
import { stripAnsiCodes } from "./utils.js";
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
 * @param specId - Optional spec ID for session header (semantic or legacy string format)
 * @returns Object with stream and file path
 */
function createLogStream(
	sandboxLabel: string,
	runId?: string,
	specId?: string,
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
	provider: AgentProvider = "claude",
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
		feature.assigned_sandbox = instance.label;
		transitionFeatureStatus(feature, manifest, "in_progress", {
			reason: "feature execution starting",
		});
	}

	// Update instance state
	// Defensive: set these here as well in case orchestrator didn't (rare edge case).
	// Orchestrator now sets status/currentFeature/featureStartedAt synchronously before
	// calling this function, but this defensive code handles unusual error paths.
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
	// Initialize progress file immediately to avoid PTY recovery failures
	try {
		await instance.sandbox.commands.run(
			`cd ${WORKSPACE_DIR} && python3 - <<'PY'\n` +
				"import json\n" +
				"from datetime import datetime, timezone\n" +
				"progress = {\n" +
				`  "status": "in_progress",\n` +
				`  "phase": "starting",\n` +
				`  "completed_tasks": [],\n` +
				`  "failed_tasks": [],\n` +
				`  "context_usage_percent": 0,\n` +
				`  "last_heartbeat": datetime.now(timezone.utc).isoformat().replace("+00:00","Z")\n` +
				"}\n" +
				`with open("${PROGRESS_FILE}", "w", encoding="utf-8") as f:\n` +
				"  json.dump(progress, f, indent=2)\n" +
				"PY",
			{ timeoutMs: 5000 },
		);
	} catch {
		// Ignore - progress file creation is best effort
	}

	const prompt = buildImplementationPrompt(provider, feature.id);
	const authMethod =
		provider === "gpt" ? getOpenAIAuthMethod() : getAuthMethod();
	const providerLabel = getProviderDisplayName(provider);

	log(
		`│   Running (${providerLabel}): ${provider === "gpt" ? "codex exec" : prompt}`,
	);
	log(
		`│   Auth: ${authMethod === "api_key" ? "API key" : authMethod === "oauth" ? "OAuth" : "none"}`,
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
			log(`│   🔪 Killing ${providerLabel} process for recovery...`);

			// Kill the agent process to trigger early exit
			await killClaudeProcess(instance, uiEnabled, provider);
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

			// Kill the agent process to trigger retry
			await killClaudeProcess(instance, uiEnabled, provider);
		}
	}, 10000); // Check every 10 seconds during startup

	// ============================================================================
	// Retry Loop for Startup Hang Recovery
	// ============================================================================
	// When the agent CLI hangs during startup (no output within 60s), the startup
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
				`   │   🔄 [STARTUP_ATTEMPT_${attemptNumber}] ${instance.label}: Retrying agent CLI (attempt ${attemptNumber}/${MAX_STARTUP_RETRIES})`,
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
			//
			// CRITICAL: E2B PTY Timeout Configuration (Issue #1699, #1701)
			// The E2B SDK has a default PTY timeout of 60 seconds (timeoutMs: 60_000).
			// This causes the PTY stream to silently disconnect after 60 seconds without
			// firing error events, resulting in UI hangs during long-running features.
			// Setting timeoutMs to FEATURE_TIMEOUT_MS ensures PTY stays alive for the
			// entire feature execution duration.
			// See: E2B GitHub issues #727, #879, #921 for upstream documentation.
			log(
				`   │   🖥️  [PTY_CREATE] ${instance.label}: Creating PTY (cols=120, rows=40, timeout=${FEATURE_TIMEOUT_MS}ms)`,
			);
			logStream.write(
				`[PTY] Creating PTY session at ${new Date().toISOString()}\n`,
			);

			const ptyHandle = await instance.sandbox.pty.create({
				cols: 120,
				rows: 40,
				// CRITICAL: Set timeoutMs to feature timeout to prevent default 60-second disconnect
				// E2B SDK default is 60_000ms (60s), which causes silent PTY stream stoppage
				// See: #1699, #1701 - Alpha Orchestrator Progress Count Mismatch & UI Hang
				timeoutMs: FEATURE_TIMEOUT_MS,
				onData: (output: Uint8Array) => {
					// Decode output data from Uint8Array to string
					const data = new TextDecoder().decode(output);

					capturedStdout += data;

					// Always write to log file (persisted on orchestrator machine)
					// Guard against writing to closed stream (race condition with cleanup)
					if (!logStream.writableEnded) {
						logStream.write(data);
					}

					// Track output in startup tracker for early hang detection
					updateOutputTracker(startupTracker, data);

					// Track recent output lines for UI
					const lines = data.split("\n");
					for (const line of lines) {
						if (line.trim()) {
							// Strip ANSI escape codes before storing for clean UI display
							const cleanLine = stripAnsiCodes(line);
							recentOutput.push(cleanLine);
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
			});

			log(
				`   │   🖥️  [PTY_READY] ${instance.label}: PTY created (PID=${ptyHandle.pid})`,
			);
			logStream.write(`[PTY] PTY created with PID ${ptyHandle.pid}\n`);

			// Send the command to the PTY shell
			// PTY creates an interactive shell, so we send the command followed by exit
			// to ensure the shell exits when the command completes (preserving exit code)
			const command = buildProviderCommand(provider, prompt);

			log(`   │   📤 [PTY_INPUT] ${instance.label}: Sending command to PTY`);
			logStream.write(`[PTY] Sending command: ${command.split("\n")[0]}\n`);

			await instance.sandbox.pty.sendInput(
				ptyHandle.pid,
				new TextEncoder().encode(command),
			);

			// Wait for PTY command to complete
			// Bug fix #1767: Use timeout wrapper with progress file fallback
			// If PTY disconnects silently, the wrapper checks progress file for completion
			// Bug fix #1786: Loop while feature is still running (has recent heartbeat)
			log(
				`   │   ⏳ [PTY_WAIT] ${instance.label}: Waiting for PTY to complete...`,
			);

			let ptyWaitResult: WaitWithTimeoutResult;
			let stillRunningIterations = 0;
			const MAX_STILL_RUNNING_ITERATIONS = 120; // 120 * 30s = 60 minutes max

			try {
				// Loop while feature is still running (heartbeat is recent)
				// This prevents killing healthy features due to PTY timeout
				do {
					ptyWaitResult = await waitWithTimeout(ptyHandle, instance.sandbox);

					if (ptyWaitResult.stillRunning) {
						stillRunningIterations++;
						// Feature is still running with recent heartbeat - continue waiting
						log(
							`   │   ⏳ [PTY_STILL_RUNNING] ${instance.label}: Feature still running (heartbeat recent), continuing wait... (iteration ${stillRunningIterations})`,
						);
						logStream.write(
							`[PTY] Feature still running with recent heartbeat, continuing wait (iteration ${stillRunningIterations})\n`,
						);

						// Safety: prevent infinite loop
						if (stillRunningIterations >= MAX_STILL_RUNNING_ITERATIONS) {
							log(
								`   │   ⚠️ [PTY_MAX_ITERATIONS] ${instance.label}: Max wait iterations reached (${MAX_STILL_RUNNING_ITERATIONS})`,
							);
							logStream.write(
								`[PTY] Max wait iterations reached (${MAX_STILL_RUNNING_ITERATIONS}), treating as stuck\n`,
							);
							throw new PTYTimeoutError(
								instance.sandbox.sandboxId,
								ptyWaitResult.progressData ?? null,
								FEATURE_TIMEOUT_MS,
								`Feature exceeded max wait time (${MAX_STILL_RUNNING_ITERATIONS} iterations)`,
							);
						}
					}
				} while (ptyWaitResult.stillRunning);

				if (ptyWaitResult.recoveredViaProgressFile) {
					log(
						`   │   🔄 [PTY_RECOVERED] ${instance.label}: PTY timeout but recovered via progress file`,
					);
					logStream.write(
						"[PTY] PTY timeout - recovered via progress file (status: completed)\n",
					);
				}
			} catch (ptyError) {
				// Handle PTY timeout errors specifically
				if (ptyError instanceof PTYTimeoutError) {
					log(`   │   ⚠️ [PTY_TIMEOUT] ${instance.label}: ${ptyError.message}`);
					logStream.write(`[PTY] PTY timeout error: ${ptyError.message}\n`);
					// Re-throw to be handled by outer error handler
					throw ptyError;
				}
				throw ptyError;
			}

			executionResult = {
				exitCode: ptyWaitResult.exitCode,
				stdout: capturedStdout,
				stderr: "",
				error: undefined,
			};

			log(
				`   │   ✅ [PTY_DONE] ${instance.label}: PTY completed (exitCode=${executionResult.exitCode}${ptyWaitResult.recoveredViaProgressFile ? ", recovered" : ""})`,
			);
			logStream.write(
				`[PTY] PTY completed with exit code ${executionResult.exitCode}\n`,
			);

			// Success - record which attempt succeeded and break out of retry loop
			startupAttemptRecord.succeededOnAttempt = attemptNumber;
			if (attemptNumber > 1) {
				log(
					`   │   ✅ [STARTUP_SUCCESS] ${instance.label}: Agent CLI started successfully on attempt ${attemptNumber}`,
				);
			}
			break; // Exit retry loop on success
		} catch (retryError) {
			// Check if this was a startup hang that we should retry
			if (startupHangDetected && attemptNumber < MAX_STARTUP_RETRIES) {
				// Bug fix #1786: CRITICAL - Kill ALL agent processes before retry
				// This prevents zombie processes from accumulating when retrying
				log(
					`   │   🔪 [RETRY_CLEANUP] ${instance.label}: Killing agent processes before retry...`,
				);
				logStream.write("\n=== CLEANUP BEFORE RETRY ===\n");
				await killClaudeProcess(instance, uiEnabled, provider);
				log(`   │   ✓ [RETRY_CLEANUP] ${instance.label}: Cleanup complete`);
				logStream.write(
					"[CLEANUP] Processes killed and progress file cleared\n",
				);

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
				continue; // Retry with clean slate
			}

			// Max retries exceeded OR different error - propagate to outer catch
			throw retryError;
		}
	}

	// At this point, executionResult should be set from successful attempt
	// If all retries failed, we would have thrown in the catch block above
	if (!executionResult) {
		throw new Error("Execution result not set - this should never happen");
	}
	const result = executionResult;

	try {
		// Stop polling, stall detection, startup monitoring, and UI progress updates
		// Await stop() to ensure no stale poll writes occur after new features start
		await progressPoller.stop();
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
		// Bug fix #1938: Don't default to "completed" - require evidence
		let status: FeatureEntry["status"] = "pending";
		let progressFileStatus: string | undefined;

		try {
			const parsed = JSON.parse(progressResult.stdout || "{}");
			tasksCompleted = parsed.completed_tasks?.length || 0;
			progressFileStatus = parsed.status;

			// Bug fix #1938: Only trust explicit "completed" status from progress file
			// Exit code 0 alone is NOT sufficient evidence of completion
			if (parsed.status === "completed") {
				status = "completed";
			} else if (parsed.status === "blocked") {
				status = "blocked";
			} else if (parsed.status === "failed" || result.exitCode !== 0) {
				status = "failed";
			} else {
				// Progress file exists but status is not "completed"
				// Keep as pending for retry
				status = "pending";
			}
		} catch {
			// No valid progress file - check exit code but be conservative
			status = result.exitCode === 0 ? "pending" : "failed";
		}

		// Fallback: Use last polled progress if available
		if (tasksCompleted === 0 && lastPolledProgress?.completed_tasks) {
			tasksCompleted = lastPolledProgress.completed_tasks.length;
		}

		// Bug fix #1938: Try to extract task count from output, but NEVER assume all tasks done
		// The previous code would set tasksCompleted = feature.task_count which caused
		// features to be marked "completed" with inflated task counts
		if (tasksCompleted === 0) {
			const taskMatch = capturedStdout.match(
				/Tasks?:?\s*(\d+)\s*\/\s*(\d+)\s*(?:completed|complete|\(100%\))/i,
			);
			const taskCountStr = taskMatch?.[1];
			if (taskCountStr) {
				tasksCompleted = parseInt(taskCountStr, 10);
			}
			// DO NOT fallback to feature.task_count - that's the bug we're fixing
		}

		// Bug fix #1938: Require meaningful evidence before marking completed
		// A feature is only "completed" if:
		// 1. Progress file explicitly says status: "completed", OR
		// 2. At least 50% of tasks were completed (indicates real progress)
		const completionThreshold = Math.ceil(feature.task_count * 0.5);
		if (status === "completed" && tasksCompleted < completionThreshold) {
			// Progress file said completed but we have no evidence of task completion
			// This likely means the agent exited without doing the work
			log(
				`   │   ⚠️ [COMPLETION_VALIDATION] Progress file claimed completed but only ${tasksCompleted}/${feature.task_count} tasks verified`,
			);
			if (progressFileStatus === "completed" && tasksCompleted === 0) {
				// Explicit completion claim with zero tasks - suspicious, mark for retry
				status = "pending";
				log(
					"   │   ⚠️ [COMPLETION_VALIDATION] Marking as pending for retry (zero tasks completed)",
				);
			}
		}

		// If we're marking as pending (for retry), add a note about why
		if (status === "pending" && result.exitCode === 0) {
			log(
				"   │   ℹ️ [COMPLETION_VALIDATION] Exit code 0 but insufficient completion evidence - will retry",
			);
		}

		// Update feature
		feature.tasks_completed = tasksCompleted;
		instance.currentFeature = null;
		instance.status = "ready";
		instance.outputLineCount = 0;
		instance.hasReceivedOutput = false;

		// Transition feature status (handles initiative cascade and manifest save)
		transitionFeatureStatus(feature, manifest, status, {
			reason: "feature completion finalization",
			skipSave: true, // We save below after all updates
		});

		// Update progress
		if (status === "completed") {
			// NOTE: features_completed is now calculated from manifest state in writeOverallProgress()
			// This prevents counts from exceeding totals when features are retried
			manifest.progress.last_completed_feature_id = feature.id;

			// CRITICAL: Push after completing feature
			try {
				await instance.sandbox.commands.run(
					`cd ${WORKSPACE_DIR} && git push origin "${manifest.sandbox.branch_name}"`,
					{ timeoutMs: 120000 },
				);
			} catch (pushError) {
				log(`   │   ⚠ Push failed: ${pushError}`);
			}

			// Sync migrations to remote database after feature completes
			// This captures any database migrations created by the feature
			// See bug fix #1506 for details
			try {
				await syncFeatureMigrations(
					instance.sandbox,
					`feature #${feature.id}`,
					uiEnabled,
				);
			} catch (syncError) {
				log(`   │   ⚠ Migration sync failed (non-blocking): ${syncError}`);
			}
		}

		// NOTE: tasks_completed is now calculated from manifest state in writeOverallProgress()
		// This prevents counts from exceeding totals when features are retried
		updateNextFeatureId(manifest);
		saveManifest(manifest);

		// Write final UI progress to ensure UI reflects completion status
		// This fixes stale UI after session recovery (see #1499, #1495)
		if (uiEnabled) {
			writeUIProgress(
				instance.label,
				{
					status,
					phase: status === "completed" ? "completed" : "finished",
					completed_tasks: Array.from(
						{ length: tasksCompleted },
						(_, i) => `task-${i + 1}`,
					),
					failed_tasks: [],
					last_heartbeat: new Date().toISOString(),
					context_usage_percent: 0,
				},
				instance,
				feature,
				outputTracker,
			);
		}

		// Bug fix #1938: Add icon for pending status (retry)
		const icon =
			status === "completed"
				? "✅"
				: status === "blocked"
					? "🚫"
					: status === "pending"
						? "🔄"
						: "❌";
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
		// Await stop() to ensure no stale poll writes occur after new features start
		await progressPoller.stop();
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

		feature.error = finalError;
		instance.currentFeature = null;
		instance.status = "ready";
		instance.outputLineCount = 0;
		instance.hasReceivedOutput = false;
		updateNextFeatureId(manifest);
		transitionFeatureStatus(feature, manifest, "failed", {
			reason: "unhandled exception in feature execution",
		});

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
