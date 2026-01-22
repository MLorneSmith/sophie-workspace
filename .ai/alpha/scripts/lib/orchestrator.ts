/**

* Main Orchestration Module
*
* Orchestrates feature implementation across multiple E2B sandboxes.
* Manages the work loop, dry run output, and summary generation.
 */

import { type ChildProcess, spawn } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import process from "node:process";

import type { Sandbox } from "@e2b/code-interpreter";

import {
	EVENT_SERVER_PORT,
	HEALTH_CHECK_INTERVAL_MS,
	LOGS_DIR,
	SANDBOX_KEEPALIVE_INTERVAL_MS,
	SANDBOX_KEEPALIVE_STAGGER_MS,
	SANDBOX_MAX_AGE_MS,
	SANDBOX_STAGGER_DELAY_MS,
	UI_PROGRESS_DIR,
} from "../config/index.js";
import type {
	OrchestratorOptions,
	ReviewUrl,
	SandboxInstance,
	SpecManifest,
	UIManager,
} from "../types/index.js";
import {
	checkDatabaseCapacity,
	isDatabaseSeeded,
	resetSandboxDatabase,
	seedSandboxDatabase,
} from "./database.js";
import {
	checkEnvironment,
	GITHUB_TOKEN,
	setOrchestratorUrl,
	validatePythonDependencies,
} from "./environment.js";
import { emitOrchestratorEvent } from "./event-emitter.js";
import { runFeatureImplementation } from "./feature.js";
import { runHealthChecks } from "./health.js";
import { acquireLock, getProjectRoot, releaseLock } from "./lock.js";
import {
	archiveAndClearPreviousRun,
	findSpecDir,
	generateSpecManifest,
	loadManifest,
	saveManifest,
} from "./manifest.js";
import { writeIdleProgress } from "./progress.js";
import { generateRunId } from "./run-id.js";
import {
	clearStaleSandboxData,
	createReviewSandbox,
	createSandbox,
	getSandboxAgeMinutes,
	getSandboxesNeedingRestart,
	getVSCodeUrl,
	isSandboxExpired,
	keepAliveSandboxes,
	reconnectToStoredSandboxes,
	startDevServer,
} from "./sandbox.js";
import { sleep, withTimeout } from "./utils.js";
import {
	assignFeatureToSandbox,
	cleanupStaleState,
	getBlockedFeatures,
	getNextAvailableFeature,
} from "./work-queue.js";

// ============================================================================
// Logging Helper
// ============================================================================

/**

* Create a conditional logger that only outputs when UI is disabled.
* When UI is enabled, all console output is suppressed to avoid interfering
* with the Ink-based dashboard.
 */
function createLogger(uiEnabled: boolean) {
	return {
		log: (...args: unknown[]) => {
			if (!uiEnabled) console.log(...args);
		},
		error: (...args: unknown[]) => {
			// Always log errors, even in UI mode
			console.error(...args);
		},
	};
}

// ============================================================================
// Event Server Management
// ============================================================================

let eventServerProcess: ChildProcess | null = null;

/**
 * Start the event server for WebSocket streaming.
 *
 * @param projectRoot - Project root directory
 * @param log - Logger function
 * @returns The orchestrator URL to pass to sandboxes, or null if startup fails
 */
async function startEventServer(
	projectRoot: string,
	log: (...args: unknown[]) => void,
): Promise<string | null> {
	const scriptPath = path.join(
		projectRoot,
		".ai/alpha/scripts/event-server.py",
	);

	try {
		// Check if port is already in use (previous server still running)
		const { execSync } = await import("node:child_process");
		try {
			// Try to kill any existing process on the port
			execSync(`lsof -ti:${EVENT_SERVER_PORT} | xargs kill -9 2>/dev/null`, {
				stdio: "ignore",
			});
			// Wait a bit for port to be released
			await sleep(500);
		} catch {
			// No existing process, that's fine
		}

		// Start the event server
		eventServerProcess = spawn("python3", [scriptPath], {
			cwd: projectRoot,
			stdio: ["ignore", "pipe", "pipe"],
			detached: false,
		});

		// Wait for server to start
		await new Promise<void>((resolve, reject) => {
			const timeout = setTimeout(() => {
				reject(new Error("Event server startup timeout"));
			}, 10000);

			eventServerProcess?.stdout?.on("data", (data: Buffer) => {
				const output = data.toString();
				if (output.includes("Starting Alpha Event Server")) {
					clearTimeout(timeout);
					resolve();
				}
			});

			eventServerProcess?.stderr?.on("data", (data: Buffer) => {
				const output = data.toString();
				// FastAPI/uvicorn often logs to stderr
				if (
					output.includes("Uvicorn running") ||
					output.includes("Started server")
				) {
					clearTimeout(timeout);
					resolve();
				}
			});

			eventServerProcess?.on("error", (err) => {
				clearTimeout(timeout);
				reject(err);
			});

			eventServerProcess?.on("exit", (code) => {
				if (code !== 0 && code !== null) {
					clearTimeout(timeout);
					reject(new Error(`Event server exited with code ${code}`));
				}
			});
		});

		log(`   Started event server on port ${EVENT_SERVER_PORT}`);
		return `http://localhost:${EVENT_SERVER_PORT}`;
	} catch (error) {
		log(`   ⚠️ Failed to start event server: ${error}`);
		return null;
	}
}

/**
 * Stop the event server if running.
 */
function stopEventServer(log: (...args: unknown[]) => void): void {
	if (eventServerProcess) {
		log("   Stopping event server...");
		eventServerProcess.kill("SIGTERM");
		eventServerProcess = null;
	}
}

/**
 * Wait for UI to be ready to receive events.
 *
 * Polls the event server's /api/ui-status endpoint to check if UI has
 * connected and sent its ready signal. This prevents events from being
 * emitted before the UI can receive them.
 *
 * @param maxWait - Maximum time to wait in ms (default: 30000)
 * @param pollInterval - How often to poll in ms (default: 500)
 * @param log - Logger function
 * @returns true if UI became ready, false if timeout
 */
async function waitForUIReady(
	maxWait: number = 30000,
	pollInterval: number = 500,
	log: (...args: unknown[]) => void = console.log,
): Promise<boolean> {
	const startTime = Date.now();
	const statusUrl = `http://localhost:${EVENT_SERVER_PORT}/api/ui-status`;

	log("   ⏳ Waiting for UI to connect...");

	while (Date.now() - startTime < maxWait) {
		try {
			const response = await fetch(statusUrl);
			if (response.ok) {
				const data = (await response.json()) as { ui_ready?: boolean };
				if (data.ui_ready === true) {
					log("   ✅ UI ready, proceeding with database operations");
					return true;
				}
			}
		} catch {
			// Event server not ready yet, continue polling
		}

		await sleep(pollInterval);
	}

	// Timeout reached - proceed anyway (non-blocking)
	log("   ⚠️ UI ready timeout, proceeding without confirmation");
	return false;
}

// ============================================================================
// Dry Run Output
// ============================================================================

/**

* Print dry run execution plan.
*
* @param manifest - The spec manifest
 */
export function printDryRun(manifest: SpecManifest): void {
	console.log("\n🔍 DRY RUN - Execution Plan:\n");

	const completedIds = new Set(
		manifest.feature_queue
			.filter((f) => f.status === "completed")
			.map((f) => f.id),
	);
	const completedInitIds = new Set(
		manifest.initiatives
			.filter((i) => i.status === "completed")
			.map((i) => i.id),
	);

	console.log("Feature Queue (in execution order):");
	for (const feature of manifest.feature_queue) {
		const statusIcon =
			feature.status === "completed"
				? "✅"
				: feature.status === "in_progress"
					? "🔄"
					: "⏳";

		const depsComplete = feature.dependencies.every(
			(d) => completedIds.has(d) || completedInitIds.has(d),
		);
		const blockedStr =
			feature.dependencies.length > 0 && !depsComplete
				? ` [BLOCKED by: ${feature.dependencies
						.filter((d) => !completedIds.has(d) && !completedInitIds.has(d))
						.map((d) => `#${d}`)
						.join(", ")}]`
				: "";

		console.log(
			`   ${statusIcon} #${feature.id}: ${feature.title} (${feature.task_count} tasks)${blockedStr}`,
		);
	}

	// Estimate
	const pendingFeatures = manifest.feature_queue.filter(
		(f) => f.status === "pending",
	);
	const totalHours = pendingFeatures.reduce(
		(sum, f) => sum + f.parallel_hours,
		0,
	);

	console.log("\n📊 Remaining Work:");
	console.log(`Features: ${pendingFeatures.length}`);
	console.log(`Estimated Hours: ${totalHours}`);
}

// ============================================================================
// Summary Output
// ============================================================================

/**

* Print final summary after orchestration.
*
* @param manifest - The spec manifest
* @param instances - Sandbox instances
* @param reviewUrls - Review URLs for sandboxes
 */
export function printSummary(
	manifest: SpecManifest,
	instances: SandboxInstance[],
	reviewUrls: ReviewUrl[],
): void {
	const completed = manifest.feature_queue.filter(
		(f) => f.status === "completed",
	).length;
	const failed = manifest.feature_queue.filter(
		(f) => f.status === "failed",
	).length;

	console.log("\n" + "═".repeat(70));
	console.log("   SUMMARY");
	console.log("═".repeat(70));

	console.log("\n📊 Results:");
	console.log(
		`Initiatives: ${manifest.progress.initiatives_completed}/${manifest.progress.initiatives_total}`,
	);
	console.log(`Features: ${completed}/${manifest.progress.features_total}`);
	console.log(`Failed: ${failed}`);
	console.log(
		`Tasks: ${manifest.progress.tasks_completed}/${manifest.progress.tasks_total}`,
	);

	console.log(`\n🌿 Branch: ${manifest.sandbox.branch_name}`);

	if (manifest.progress.started_at) {
		const duration = Math.round(
			(Date.now() - new Date(manifest.progress.started_at).getTime()) / 60000,
		);
		console.log(`⏱️ Duration: ${duration} minutes`);
	}

	// Print review URLs
	if (reviewUrls.length > 0) {
		console.log("\n" + "═".repeat(70));
		console.log("   REVIEW YOUR WORK");
		console.log("═".repeat(70));
		console.log("\n🔗 Review URLs (sandboxes kept alive for review):\n");

		for (const { label, vscode, devServer } of reviewUrls) {
			console.log(`   ${label}:`);
			console.log(`      VS Code:    ${vscode}`);
			console.log(`      Dev Server: ${devServer}`);
		}

		console.log("\n" + "─".repeat(70));
		console.log("⚠️  IMPORTANT: Sandboxes are still running!");
		console.log("   When done reviewing, manually kill them with:\n");
		for (const instance of instances) {
			console.log(`   npx e2b sandbox kill ${instance.id}`);
		}
		console.log("\n   Or kill all at once:");
		console.log(
			`   npx e2b sandbox kill ${instances.map((i) => i.id).join(" ")}`,
		);
		console.log("─".repeat(70));
	}

	console.log("\n" + "═".repeat(70));

	if (failed > 0) {
		console.log("\n⚠️ Some features failed. Re-run to continue.");
	} else {
		console.log("\n✅ Spec implementation complete!");
	}
}

// ============================================================================
// Work Loop
// ============================================================================

/**

* Main work loop - sandboxes pull features from queue until done.
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
	const { log } = createLogger(uiEnabled);

	// Track active work
	const activeWork = new Map<string, Promise<void>>();

	// Start periodic health checks
	let healthCheckRunning = false;
	const healthCheckInterval = setInterval(async () => {
		if (healthCheckRunning) return;
		healthCheckRunning = true;

		try {
			const needsRestart = await runHealthChecks(
				instances,
				manifest,
				uiEnabled,
			);

			// Attempt to restart sandboxes that failed health checks
			for (const instance of needsRestart) {
				if (instance.status === "failed") {
					log(
						`   🔄 Attempting to restart failed sandbox ${instance.label}...`,
					);
					try {
						// CRITICAL: Kill the old sandbox before creating new one
						try {
							await instance.sandbox.kill();
						} catch {
							// Ignore kill errors - sandbox may already be dead
						}

						// Capture old ID before reassignment for cleanup
						const oldSandboxId = instance.id;

						const newInstance = await createSandbox(
							manifest,
							instance.label,
							timeoutSeconds,
							uiEnabled,
							runId,
						);

						// Replace the old sandbox with the new one
						instance.sandbox = newInstance.sandbox;
						instance.id = newInstance.id;
						instance.status = "ready";
						instance.currentFeature = null;
						instance.retryCount = 0;
						instance.featureStartedAt = undefined;
						instance.lastProgressSeen = undefined;
						instance.runId = runId;
						instance.lastHeartbeat = undefined;

						// Track restart count for diagnostics
						// Diagnosis #1567: This helps track sandbox recovery patterns
						manifest.sandbox.restart_count =
							(manifest.sandbox.restart_count ?? 0) + 1;

						// Clean up old sandbox ID before adding new one
						// This prevents sandbox_ids from accumulating beyond the sandbox count
						const oldIdIndex =
							manifest.sandbox.sandbox_ids.indexOf(oldSandboxId);
						if (oldIdIndex !== -1) {
							manifest.sandbox.sandbox_ids.splice(oldIdIndex, 1);
						}
						if (!manifest.sandbox.sandbox_ids.includes(newInstance.id)) {
							manifest.sandbox.sandbox_ids.push(newInstance.id);
						}
						saveManifest(manifest);
						log(
							`   ✅ Sandbox ${instance.label} restarted successfully (restart #${manifest.sandbox.restart_count})`,
						);
					} catch (restartError) {
						log(
							`   ❌ Failed to restart sandbox ${instance.label}: ${restartError instanceof Error ? restartError.message : restartError}`,
						);
					}
				}
			}
		} catch (error) {
			log(
				`   ⚠️ Health check error: ${error instanceof Error ? error.message : error}`,
			);
		} finally {
			healthCheckRunning = false;
		}
	}, HEALTH_CHECK_INTERVAL_MS);

	// Start periodic sandbox keepalive to prevent timeout expiration
	// Uses staggered timing to prevent simultaneous expirations
	let keepaliveRunning = false;
	const keepaliveInterval = setInterval(async () => {
		if (keepaliveRunning) return;
		keepaliveRunning = true;

		try {
			// First, check for sandboxes approaching max age (60 min = preemptive restart)
			// This prevents the edge case where keepalive and expiration happen simultaneously
			const needsPreemptiveRestart = getSandboxesNeedingRestart(
				instances,
				SANDBOX_MAX_AGE_MS,
			);

			for (const label of needsPreemptiveRestart) {
				const instance = instances.find((i) => i.label === label);
				if (instance && instance.status !== "failed") {
					const ageMinutes = Math.round(
						(Date.now() - instance.createdAt.getTime()) / 60000,
					);

					// Find the in-progress feature assigned to this sandbox
					const feature = manifest.feature_queue.find(
						(f) => f.assigned_sandbox === label && f.status === "in_progress",
					);

					// Check if feature is almost done (80%+ tasks completed)
					// If so, skip preemptive restart to avoid feature cycling (diagnosis #1567)
					if (feature && feature.task_count > 0) {
						const tasksCompleted = feature.tasks_completed;
						const totalTasks = feature.task_count;
						const percentDone =
							totalTasks > 0 ? (tasksCompleted / totalTasks) * 100 : 0;

						if (percentDone >= 80) {
							log(
								`   ⏰ Sandbox ${label} is ${ageMinutes}min old, but feature #${feature.id} is ${Math.round(percentDone)}% done - skipping preemptive restart`,
							);
							continue; // Skip restart for this feature
						}
					}

					log(
						`   ⏰ Sandbox ${label} is ${ageMinutes}min old, performing preemptive restart...`,
					);

					// Reset any in-progress feature assigned to this sandbox
					if (feature) {
						// Try graceful shutdown first before force-killing
						// This gives Claude Code a chance to save state
						try {
							log("   🔄 Attempting graceful shutdown of Claude Code...");
							await instance.sandbox.commands.run(
								"pkill -TERM run-claude 2>/dev/null || true",
								{ timeoutMs: 5000 },
							);
							await sleep(2000); // Wait for graceful shutdown
						} catch {
							// Graceful shutdown failed, proceed with force restart
							log(
								"   ⚠️ Graceful shutdown failed, proceeding with force restart",
							);
						}

						feature.status = "pending";
						feature.assigned_sandbox = undefined;
						feature.assigned_at = undefined;
						feature.error = "Preemptive restart before expiration";
						saveManifest(manifest);
					}

					try {
						// Kill the old sandbox
						await instance.sandbox.kill();
					} catch {
						// Ignore kill errors - sandbox may already be dead
					}

					// Create a fresh sandbox
					try {
						// Capture old ID before reassignment for cleanup
						const oldSandboxId = instance.id;

						const newInstance = await createSandbox(
							manifest,
							label,
							timeoutSeconds,
							uiEnabled,
							runId,
						);

						// Replace the old sandbox with the new one
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
						instance.runId = runId;

						// Track restart count for diagnostics
						// Diagnosis #1567: This helps track sandbox recovery patterns
						manifest.sandbox.restart_count =
							(manifest.sandbox.restart_count ?? 0) + 1;

						// Clean up old sandbox ID before adding new one
						// This prevents sandbox_ids from accumulating beyond the sandbox count
						const oldIdIndex =
							manifest.sandbox.sandbox_ids.indexOf(oldSandboxId);
						if (oldIdIndex !== -1) {
							manifest.sandbox.sandbox_ids.splice(oldIdIndex, 1);
						}
						if (!manifest.sandbox.sandbox_ids.includes(newInstance.id)) {
							manifest.sandbox.sandbox_ids.push(newInstance.id);
						}

						// Bug fix #1713: Reset created_at timestamp on restart
						// Without this, the UI shows stale timestamps suggesting the sandbox
						// has been running much longer than it actually has
						manifest.sandbox.created_at = new Date().toISOString();
						saveManifest(manifest);

						// Bug fix #1713: Write idle progress immediately after restart
						// This ensures UI shows current heartbeat timestamp instead of stale data
						writeIdleProgress(label, instance);

						log(
							`   ✅ Sandbox ${label} preemptively restarted (${newInstance.id}) - restart #${manifest.sandbox.restart_count}`,
						);
					} catch (restartError) {
						log(
							`   ❌ Failed to restart sandbox ${label}: ${restartError instanceof Error ? restartError.message : restartError}`,
						);
						instance.status = "failed";
					}
				}
			}

			// Now do regular keepalive with staggered timing
			// Stagger prevents all sandboxes from extending timeout at the exact same time
			const timeoutMs = timeoutSeconds * 1000;
			const failed = await keepAliveSandboxes(
				instances,
				timeoutMs,
				uiEnabled,
				SANDBOX_KEEPALIVE_STAGGER_MS,
			);

			// Handle failed sandboxes - attempt restart
			for (const label of failed) {
				const instance = instances.find((i) => i.label === label);
				if (instance && instance.status !== "failed") {
					log(`   ⚠️ Sandbox ${label} expired, attempting restart...`);

					// Reset any in-progress feature assigned to this sandbox
					const feature = manifest.feature_queue.find(
						(f) => f.assigned_sandbox === label && f.status === "in_progress",
					);
					if (feature) {
						feature.status = "pending";
						feature.assigned_sandbox = undefined;
						feature.assigned_at = undefined;
						feature.error = "Sandbox expired - restarting";
						saveManifest(manifest);
					}

					// Attempt to restart the sandbox
					try {
						log(`   🔄 Restarting sandbox ${label}...`);

						// CRITICAL: Kill the old sandbox before creating new one
						try {
							await instance.sandbox.kill();
						} catch {
							// Ignore kill errors - sandbox may already be dead
						}

						// Capture old ID before reassignment for cleanup
						const oldSandboxId = instance.id;

						const newInstance = await createSandbox(
							manifest,
							label,
							timeoutSeconds,
							uiEnabled,
							runId,
						);

						// Replace the old sandbox with the new one
						instance.sandbox = newInstance.sandbox;
						instance.id = newInstance.id;
						instance.status = "ready";
						instance.currentFeature = null;
						instance.retryCount = 0;
						instance.featureStartedAt = undefined;
						instance.lastProgressSeen = undefined;
						instance.lastHeartbeat = undefined;
						instance.outputLineCount = 0;
						instance.runId = runId;
						instance.hasReceivedOutput = false;
						instance.createdAt = newInstance.createdAt;
						instance.lastKeepaliveAt = newInstance.lastKeepaliveAt;

						// Track restart count for diagnostics
						// Diagnosis #1567: This helps track sandbox recovery patterns
						manifest.sandbox.restart_count =
							(manifest.sandbox.restart_count ?? 0) + 1;

						// Clean up old sandbox ID before adding new one
						// This prevents sandbox_ids from accumulating beyond the sandbox count
						const oldIdIndex =
							manifest.sandbox.sandbox_ids.indexOf(oldSandboxId);
						if (oldIdIndex !== -1) {
							manifest.sandbox.sandbox_ids.splice(oldIdIndex, 1);
						}
						if (!manifest.sandbox.sandbox_ids.includes(newInstance.id)) {
							manifest.sandbox.sandbox_ids.push(newInstance.id);
						}

						// Bug fix #1713: Reset created_at timestamp on restart
						// Without this, the UI shows stale timestamps suggesting the sandbox
						// has been running much longer than it actually has
						manifest.sandbox.created_at = new Date().toISOString();
						saveManifest(manifest);

						// Bug fix #1713: Write idle progress immediately after restart
						// This ensures UI shows current heartbeat timestamp instead of stale data
						writeIdleProgress(label, instance);

						log(
							`   ✅ Sandbox ${label} restarted successfully (${newInstance.id}) - restart #${manifest.sandbox.restart_count}`,
						);
					} catch (restartError) {
						log(
							`   ❌ Failed to restart sandbox ${label}: ${restartError instanceof Error ? restartError.message : restartError}`,
						);
						instance.status = "failed";
					}
				}
			}
		} catch (error) {
			log(
				`   ⚠️ Keepalive error: ${error instanceof Error ? error.message : error}`,
			);
		} finally {
			keepaliveRunning = false;
		}
	}, SANDBOX_KEEPALIVE_INTERVAL_MS);

	try {
		while (true) {
			// Check if we're done
			// Include "failed" features since they should be retried
			const workableFeatures = manifest.feature_queue.filter(
				(f) =>
					f.status === "pending" ||
					f.status === "in_progress" ||
					f.status === "failed",
			);

			if (workableFeatures.length === 0) {
				if (activeWork.size > 0) {
					await Promise.all(activeWork.values());
				}
				break;
			}

			// Find idle sandboxes and assign work
			for (const instance of instances) {
				if (instance.status !== "ready") {
					continue;
				}

				const feature = getNextAvailableFeature(manifest, uiEnabled);
				if (!feature) {
					// No work available - write idle status for this sandbox
					if (uiEnabled) {
						const blockedFeatures = getBlockedFeatures(manifest);
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

				// CRITICAL: Use atomic assignment with timestamp-based conflict detection
				// This prevents race conditions where multiple sandboxes get the same feature
				// The assignment function now saves the manifest atomically to prevent races
				const assigned = assignFeatureToSandbox(
					feature,
					instance.label,
					manifest,
					uiEnabled,
				);
				if (!assigned) {
					// Lost the race - another sandbox claimed this feature, try again
					log(
						`   ⚠️ ${instance.label}: Lost race for #${feature.id}, will retry`,
					);
					continue;
				}
				// NOTE: saveManifest is now called inside assignFeatureToSandbox for atomicity

				// RACE CONDITION FIX: Set sandbox status to "busy" SYNCHRONOUSLY before async Promise
				// This prevents the work loop from seeing the sandbox as "ready" on the next iteration
				// and calling writeIdleProgress() before runFeatureImplementation() sets status.
				// NOTE: feature.ts:166-169 will redundantly set these again when it runs.
				// That's intentional - this synchronous set prevents the race condition
				// by ensuring status is "busy" before async code executes. The feature.ts
				// code provides defensive duplication in case of unusual error paths.
				instance.status = "busy";
				instance.currentFeature = feature.id;
				instance.featureStartedAt = new Date();

				// Start work on this sandbox
				// Wrapped in try-catch to prevent unhandled rejections from breaking Promise.race()
				const workPromise = (async () => {
					try {
						await runFeatureImplementation(
							instance,
							manifest,
							feature,
							uiEnabled,
						);
					} catch (error) {
						// Log error but don't rethrow - let main error handler deal with it
						// This prevents Promise.race() from immediately rejecting
						log(
							`│   ❌ Feature #${feature.id} implementation error: ${error instanceof Error ? error.message : String(error)}`,
						);
						// Mark sandbox as ready for next feature
						instance.status = "ready";
						instance.currentFeature = null;
						// Mark feature as failed so it can be retried
						feature.status = "failed";
						feature.error =
							error instanceof Error ? error.message : String(error);
						// Clear sandbox assignment to prevent stall when features fail with errors
						// that bypass feature.ts handler (e.g., PTY SIGTERM). Mirrors feature.ts:678-679.
						feature.assigned_sandbox = undefined;
						feature.assigned_at = undefined;
						saveManifest(manifest);
					} finally {
						activeWork.delete(instance.label);
					}
				})();

				activeWork.set(instance.label, workPromise);
			}

			// If no work is active, check if we should exit or continue waiting
			if (activeWork.size === 0) {
				// Check for ANY retryable features (pending or failed), regardless of dependencies
				const retryableFeatures = manifest.feature_queue.filter(
					(f) => f.status === "pending" || f.status === "failed",
				);

				// Exit only if no retryable features exist
				if (retryableFeatures.length === 0) {
					break;
				}

				// Log blocked features for visibility (features with unmet dependencies)
				const blockedFeatures = retryableFeatures.filter(
					(f) => f.dependencies.length > 0,
				);
				if (blockedFeatures.length > 0) {
					log("\n⚠️ Features blocked by incomplete dependencies:");
					for (const f of blockedFeatures.slice(0, 5)) {
						log(
							`   #${f.id}: blocked by ${f.dependencies.map((d) => `#${d}`).join(", ")}`,
						);
					}
				}

				// Continue loop to retry features when sandboxes become available
				continue;
			}

			// Fix for issue #1688: Detect stuck features where sandbox has no current task
			// but feature still has uncompleted tasks. This prevents indefinite stalls.
			// Check runs after work assignment and before sleep to catch stalls quickly.
			const STUCK_TASK_THRESHOLD_MS = 60_000; // 60 seconds without progress
			const now = Date.now();

			for (const feature of manifest.feature_queue) {
				// Only check in-progress features with an assigned sandbox
				if (feature.status !== "in_progress" || !feature.assigned_sandbox) {
					continue;
				}

				// Find the sandbox assigned to this feature
				const sandbox = instances.find(
					(i) => i.label === feature.assigned_sandbox,
				);
				if (!sandbox) {
					continue;
				}

				// Check if sandbox appears idle but feature has incomplete tasks
				// Conditions for stuck detection:
				// 1. Feature has fewer completed tasks than total
				// 2. Sandbox status is not "busy" (idle or failed)
				// 3. Feature assignment is old enough (avoid false positives during transitions)
				const tasksRemaining =
					feature.task_count - (feature.tasks_completed || 0);
				const assignedDuration = feature.assigned_at
					? now - feature.assigned_at
					: 0;

				if (
					tasksRemaining > 0 &&
					sandbox.status !== "busy" &&
					assignedDuration > STUCK_TASK_THRESHOLD_MS
				) {
					log(
						`   ⚠️ Stuck task detected: Feature #${feature.id} on ${sandbox.label} has ${tasksRemaining} tasks remaining but sandbox is ${sandbox.status}`,
					);

					// Reset the feature to pending so it can be reassigned
					// This allows another sandbox (or the same one after restart) to pick it up
					feature.status = "pending";
					feature.assigned_sandbox = undefined;
					feature.assigned_at = undefined;
					feature.error = `Stuck: ${tasksRemaining} tasks remaining but sandbox idle for ${Math.round(assignedDuration / 1000)}s`;
					saveManifest(manifest);

					// Mark sandbox as ready to pick up new work
					sandbox.status = "ready";
					sandbox.currentFeature = null;

					log(`   🔄 Feature #${feature.id} reset to pending for reassignment`);
				}
			}

			// Wait for at least one sandbox to finish OR health check interval
			await Promise.race([
				...activeWork.values(),
				sleep(HEALTH_CHECK_INTERVAL_MS),
			]);
		}
	} finally {
		clearInterval(healthCheckInterval);
		clearInterval(keepaliveInterval);
	}
}

// ============================================================================
// Main Orchestration
// ============================================================================

/**

* Main orchestration function.
*
* @param options - Orchestrator options
 */
export async function orchestrate(options: OrchestratorOptions): Promise<void> {
	// Create conditional logger - suppresses output when UI is enabled
	const { log } = createLogger(options.ui);

	// =========================================================================
	// Generate Run ID - unique identifier for this orchestrator session
	// =========================================================================
	const runId = generateRunId();

	if (!options.dryRun) {
		checkEnvironment();
	}

	const projectRoot = getProjectRoot();
	const specDirOrNull = findSpecDir(projectRoot, options.specId);

	if (!specDirOrNull) {
		console.error(`Spec #${options.specId} not found`);
		process.exit(1);
	}

	const specDir = specDirOrNull as string;

	// Handle --reset flag: delete manifest to force regeneration
	if (options.reset) {
		const manifestPath = path.join(specDir, "spec-manifest.json");
		if (fs.existsSync(manifestPath)) {
			log("🔄 Resetting manifest as requested (--reset flag)...");
			fs.unlinkSync(manifestPath);
			log("   ✅ Manifest deleted, will regenerate from feature directories");
		} else {
			log("🔄 Reset requested but no manifest found, will generate fresh");
		}
	}

	let manifestOrNull = loadManifest(specDir);

	// Auto-generate manifest if missing
	if (!manifestOrNull) {
		log("\n📋 Spec manifest not found, generating automatically...");
		manifestOrNull = generateSpecManifest(
			projectRoot,
			options.specId,
			specDir,
			options.ui, // silent when UI is enabled
		);

		if (!manifestOrNull) {
			console.error(
				"❌ Failed to generate spec manifest. Ensure initiatives and features are decomposed.",
			);
			process.exit(1);
		}
		log("   ✅ Manifest generated successfully");
	}

	const manifest = manifestOrNull as SpecManifest;

	// =========================================================================
	// Validate Python Dependencies (before event server)
	// =========================================================================
	if (options.ui && !options.dryRun) {
		log("\n🔍 Validating Python dependencies...");
		const depsOk = await validatePythonDependencies(log);
		if (!depsOk) {
			console.error(
				"❌ Python dependencies are required for the event server.",
			);
			console.error(
				"   Install with: pip install -r .ai/alpha/scripts/python-requirements.txt",
			);
			process.exit(1);
		}
	}

	// =========================================================================
	// Start Event Server for real-time streaming (before UI)
	// =========================================================================
	let orchestratorUrl: string | null = null;
	if (options.ui && !options.dryRun) {
		orchestratorUrl = await startEventServer(projectRoot, log);
		// Set orchestrator URL for sandbox environment injection
		setOrchestratorUrl(orchestratorUrl ?? undefined);
	}

	// =========================================================================
	// Start UI EARLY - before any console output
	// =========================================================================
	let uiManager: UIManager | null = null;
	if (options.ui && !options.dryRun) {
		// Archive old progress/log files and clear for new run
		archiveAndClearPreviousRun(runId);

		// CRITICAL: Write initial manifest progress BEFORE starting UI
		// This ensures the UI poller finds overall-progress.json with correct totals
		// instead of falling back to hardcoded defaults (0/1 instead of actual values)
		saveManifest(manifest);

		// Generate sandbox labels for UI
		const sandboxLabels = Array.from(
			{ length: options.sandboxCount },
			(_, i) => `sbx-${String.fromCharCode(97 + i)}`,
		);

		try {
			const progressDir = path.join(getProjectRoot(), UI_PROGRESS_DIR);
			const logsDir = path.join(getProjectRoot(), LOGS_DIR);
			const { startOrchestratorUI } = await import("../ui/index.js");
			uiManager = startOrchestratorUI(
				{
					specId: manifest.metadata.spec_id,
					specName: manifest.metadata.spec_name,
					progressDir,
					logsDir,
					sandboxLabels,
					pollInterval: HEALTH_CHECK_INTERVAL_MS,
					minimal: options.minimalUi,
					// Enable event streaming if server started successfully
					eventServerUrl: orchestratorUrl
						? `ws://localhost:${EVENT_SERVER_PORT}/ws`
						: undefined,
					eventStreamEnabled: !!orchestratorUrl,
				},
				() => {
					// UI closed callback - only log if not in UI mode
					if (!options.ui) {
						console.log("\n⚠️ UI closed by user");
					}
				},
			);
		} catch (uiError) {
			console.error("⚠️ Failed to start UI dashboard:", uiError);
			console.log("   Continuing without UI...");
			// Disable UI mode since it failed
			options.ui = false;
		}
	}

	// Print header (only when UI is disabled)
	log("═".repeat(70));
	log("   ALPHA SPEC ORCHESTRATOR");
	log(`   Run ID: ${runId}`);
	log("═".repeat(70));

	// Acquire orchestrator lock (handles force unlock with process termination if needed)
	if (!options.dryRun) {
		const lockAcquired = await acquireLock(
			options.specId,
			options.ui,
			options.forceUnlock,
		);
		if (!lockAcquired) {
			if (uiManager) uiManager.stop();
			process.exit(1);
		}
	}

	// Track if lock was acquired (for finally block)
	const lockAcquired = !options.dryRun;

	// Register cleanup handler
	const cleanupAndExit = (code: number) => {
		if (uiManager) uiManager.stop();
		if (lockAcquired) {
			releaseLock(options.ui);
		}
		process.exit(code);
	};

	process.on("SIGINT", () => {
		log("\n\n⚠️ Interrupted, releasing lock...");
		cleanupAndExit(130);
	});

	process.on("SIGTERM", () => {
		log("\n\n⚠️ Terminated, releasing lock...");
		cleanupAndExit(143);
	});

	// =========================================================================
	// Main Orchestration Logic - wrapped in try-finally for guaranteed cleanup
	// =========================================================================
	try {
		// Set flag for event-emitter to know if UI mode is enabled
		// This prevents error logging when event server is not running (non-UI mode)
		if (options.ui) process.env.ORCHESTRATOR_UI_ENABLED = "true";

		// Wait for UI to be ready before emitting database events
		// This prevents timing race conditions where events are emitted before UI connects
		// Optimization: Reduced timeout from 30s/500ms to 10s/200ms (PR #1707)
		if (options.ui && orchestratorUrl) {
			await waitForUIReady(10000, 200, log);
		}

		// =========================================================================
		// Startup Optimization (PR #1707)
		// =========================================================================
		// Performance optimizations to reduce startup time:
		// 1. Check isDatabaseSeeded() BEFORE sandbox creation (saves 5-15 min on warm starts)
		// 2. Parallelize DB reset and first sandbox creation (saves 30-60s)
		// 3. Reduced UI ready timeout from 30s to 10s
		// =========================================================================
		const startupStartTime = Date.now();

		// Check sandbox database capacity and seeding status early
		let databaseAlreadySeeded = false;
		let needsDatabaseReset = false;
		if (!options.dryRun && process.env.SUPABASE_SANDBOX_DB_URL) {
			log("\n📊 Checking sandbox database...");
			const hasCapacity = await checkDatabaseCapacity(options.ui);
			if (!hasCapacity) {
				if (uiManager) uiManager.stop();
				releaseLock(options.ui);
				process.exit(1);
			}

			// Check if database is already seeded BEFORE sandbox creation
			// This is a key optimization: on warm starts, we can skip seeding entirely
			if (!options.skipDbReset && !options.skipDbSeed) {
				databaseAlreadySeeded = await isDatabaseSeeded(options.ui);
				if (databaseAlreadySeeded) {
					log("   ✅ Database already seeded (warm start detected)");
				}
			}

			// Determine if DB reset is needed (will be parallelized with sandbox creation)
			if (!options.skipDbReset && !databaseAlreadySeeded) {
				needsDatabaseReset = true;
				log("   📋 Database reset will be parallelized with sandbox creation");
			} else if (options.skipDbReset) {
				log("   ⏭️ Skipping database reset (--skip-db-reset)");
			}
		}

		// Clean up stale state
		const cleanedCount = cleanupStaleState(manifest, options.ui);
		if (cleanedCount > 0) {
			log(`\n🧹 Cleaned up ${cleanedCount} stale feature(s)`);
			saveManifest(manifest);
		}

		log(
			`\n📊 Spec #${manifest.metadata.spec_id}: ${manifest.metadata.spec_name}`,
		);
		log(`Initiatives: ${manifest.initiatives.length}`);
		log(`Features: ${manifest.progress.features_total}`);
		log(`Tasks: ${manifest.progress.tasks_total}`);
		log(
			`Progress: ${manifest.progress.features_completed}/${manifest.progress.features_total} features`,
		);
		log(`Sandboxes: ${options.sandboxCount}`);

		// Check what's next
		const nextFeature = getNextAvailableFeature(manifest, options.ui);
		if (nextFeature) {
			log(`\n🎯 Next feature: #${nextFeature.id} - ${nextFeature.title}`);
		} else if (
			manifest.progress.features_completed === manifest.progress.features_total
		) {
			log("\n🎉 All features already completed!");
			if (uiManager) uiManager.stop();
			return;
		} else {
			log("\n⚠️ No features available (check dependencies)");
			if (uiManager) uiManager.stop();
			return;
		}

		// Handle dry-run
		if (options.dryRun) {
			printDryRun(manifest);
			return;
		}

		// =========================================================================
		// Sandbox Initialization with Reconnection Support
		// =========================================================================
		// Bug fix #1634: Handle expired E2B sandboxes on restart
		//
		// When the orchestrator restarts, it attempts to reconnect to stored
		// sandbox IDs from the manifest. This prevents the hang that occurred
		// when trying to reconnect to expired sandboxes (1-hour E2B limit).
		//
		// The reconnection logic:
		// 1. Checks if stored sandboxes are too old (>55 minutes)
		// 2. Attempts connection with a 30-second timeout
		// 3. Verifies liveness with a health check command
		// 4. Falls back to creating fresh sandboxes if reconnection fails
		// =========================================================================

		const instances: SandboxInstance[] = [];
		let reconnectedCount = 0;

		// Step 1: Check for stored sandbox IDs and attempt reconnection
		if (manifest.sandbox.sandbox_ids.length > 0) {
			log("\n🔄 Found stored sandbox IDs, checking if reusable...");

			// Check expiration first (avoids hanging on connection)
			if (isSandboxExpired(manifest.sandbox.created_at)) {
				const age = getSandboxAgeMinutes(manifest.sandbox.created_at);
				log(
					`   ⚠️ Stored sandboxes are ${age ?? "unknown"} minutes old (max: 55 min)`,
				);
				log("   Clearing stale sandbox data and creating fresh sandboxes...");
				clearStaleSandboxData(manifest);
				saveManifest(manifest);
			} else {
				// Attempt reconnection with timeout and liveness verification
				log(
					`   Sandboxes are ${getSandboxAgeMinutes(manifest.sandbox.created_at) ?? "?"} minutes old, attempting reconnection...`,
				);
				const reconnected = await reconnectToStoredSandboxes(
					manifest,
					options.ui,
				);

				// Add successfully reconnected sandboxes
				for (const instance of reconnected) {
					// Update runId for this session
					instance.runId = runId;
					instances.push(instance);
					reconnectedCount++;
				}

				if (reconnected.length > 0) {
					log(
						`   ✅ Reconnected to ${reconnected.length} existing sandbox(es)`,
					);
					saveManifest(manifest);
				} else {
					log("   ⚠️ Could not reconnect to any stored sandboxes");
					clearStaleSandboxData(manifest);
					saveManifest(manifest);
				}
			}
		}

		// Step 2: Create any additional sandboxes needed
		// Optimization (PR #1707): Parallelize DB reset with first sandbox creation
		const sandboxesNeeded = options.sandboxCount - instances.length;

		if (sandboxesNeeded > 0) {
			log(
				`\n📦 ${reconnectedCount > 0 ? "Creating" : "Creating"} ${sandboxesNeeded} sandbox(es)...`,
			);

			const startIndex = instances.length;

			// Parallelize DB reset with first sandbox creation (saves 30-60s on cold starts)
			if (needsDatabaseReset && startIndex === 0) {
				log("   ⚡ Parallelizing DB reset with first sandbox creation...");
				const firstLabel = `sbx-${String.fromCharCode(97 + startIndex)}`;

				const [, firstInstance] = await Promise.all([
					resetSandboxDatabase(options.ui).catch((error) => {
						console.error("Failed to reset sandbox database:", error);
						if (uiManager) uiManager.stop();
						process.exit(1);
					}),
					createSandbox(
						manifest,
						firstLabel,
						options.timeout,
						options.ui,
						runId,
					),
				]);

				instances.push(firstInstance);

				// Create remaining sandboxes sequentially (with stagger delay)
				for (let i = 1; i < sandboxesNeeded; i++) {
					const label = `sbx-${String.fromCharCode(97 + startIndex + i)}`;
					log(
						`\n   ⏳ Waiting ${SANDBOX_STAGGER_DELAY_MS / 1000}s before next sandbox...`,
					);
					await sleep(SANDBOX_STAGGER_DELAY_MS);
					const instance = await createSandbox(
						manifest,
						label,
						options.timeout,
						options.ui,
						runId,
					);
					instances.push(instance);
				}
			} else {
				// Sequential creation (no DB reset needed or reconnecting)
				for (let i = 0; i < sandboxesNeeded; i++) {
					const label = `sbx-${String.fromCharCode(97 + startIndex + i)}`;

					// Stagger delay for sandboxes after the first
					if (i > 0 || startIndex > 0) {
						log(
							`\n   ⏳ Waiting ${SANDBOX_STAGGER_DELAY_MS / 1000}s before next sandbox...`,
						);
						await sleep(SANDBOX_STAGGER_DELAY_MS);
					}

					const instance = await createSandbox(
						manifest,
						label,
						options.timeout,
						options.ui,
						runId,
					);
					instances.push(instance);
				}
			}
		} else if (needsDatabaseReset) {
			// No new sandboxes needed but DB reset is required (reconnection case)
			try {
				await resetSandboxDatabase(options.ui);
			} catch (error) {
				console.error("Failed to reset sandbox database:", error);
				if (uiManager) uiManager.stop();
				process.exit(1);
			}
		}

		// Get the first instance for seeding (either reconnected or newly created)
		const firstInstance = instances[0];

		// Seed database via first sandbox (only if not already seeded)
		// We checked isDatabaseSeeded() earlier to enable this optimization
		if (
			!options.skipDbReset &&
			!options.skipDbSeed &&
			process.env.SUPABASE_SANDBOX_DB_URL
		) {
			// Use the pre-checked seeding status (optimization: avoid redundant check)
			if (databaseAlreadySeeded) {
				log("   ℹ️ Database already seeded, skipping seeding step");
			} else if (firstInstance) {
				const seedSuccess = await seedSandboxDatabase(
					firstInstance.sandbox,
					options.ui,
				);
				if (!seedSuccess) {
					console.error("❌ Database seeding failed, aborting orchestration");
					await firstInstance.sandbox.kill();
					if (uiManager) uiManager.stop();
					releaseLock(options.ui);
					process.exit(1);
				}
			}
		} else if (options.skipDbSeed) {
			log("   ⏭️ Skipping database seeding (--skip-db-seed)");
		}

		saveManifest(manifest);

		// Print sandbox info
		log("\n" + "═".repeat(70));
		log("   SANDBOXES READY");
		log("═".repeat(70));
		for (const instance of instances) {
			log(`${instance.label}: ${instance.id}`);
		}
		log(`Branch: ${manifest.sandbox.branch_name}`);

		// Log startup timing (PR #1707 optimization)
		const startupDurationSec = ((Date.now() - startupStartTime) / 1000).toFixed(
			1,
		);
		log(`⏱️  Startup completed in ${startupDurationSec}s`);

		// Start implementation
		log("\n" + "═".repeat(70));
		log("   IMPLEMENTATION");
		log("═".repeat(70));

		manifest.progress.status = "in_progress";
		manifest.progress.started_at =
			manifest.progress.started_at || new Date().toISOString();
		saveManifest(manifest);

		// Main work loop (or skip for debugging)
		if (options.skipToCompletion) {
			log("⏭️  DEBUG MODE: Skipping work loop (--skip-to-completion)");
			log("   Marking all features as completed for testing...");

			// Mark all pending/in_progress features as completed
			for (const feature of manifest.feature_queue) {
				if (feature.status !== "completed" && feature.status !== "failed") {
					feature.status = "completed";
					feature.tasks_completed = feature.task_count;
				}
			}

			// Update progress counters
			manifest.progress.features_completed = manifest.feature_queue.filter(
				(f) => f.status === "completed",
			).length;
			manifest.progress.tasks_completed = manifest.feature_queue.reduce(
				(sum, f) => sum + (f.status === "completed" ? f.task_count : 0),
				0,
			);

			// Update initiative statuses
			for (const initiative of manifest.initiatives) {
				const initFeatures = manifest.feature_queue.filter(
					(f) => f.initiative_id === initiative.id,
				);
				const completedCount = initFeatures.filter(
					(f) => f.status === "completed",
				).length;
				initiative.features_completed = completedCount;
				if (completedCount === initiative.feature_count) {
					initiative.status = "completed";
				}
			}
			manifest.progress.initiatives_completed = manifest.initiatives.filter(
				(i) => i.status === "completed",
			).length;

			saveManifest(manifest);
		} else {
			await runWorkLoop(
				instances,
				manifest,
				options.ui,
				options.timeout,
				runId,
			);
		}

		// Push final changes
		const pushInstance = instances[0];
		if (GITHUB_TOKEN && pushInstance) {
			log("\n📤 Pushing final changes...");
			try {
				await pushInstance.sandbox.commands.run(
					`cd /home/user/project && git push -u origin "${manifest.sandbox.branch_name}"`,
					{ timeoutMs: 120000 },
				);
				log(`✅ Pushed to ${manifest.sandbox.branch_name}`);
			} catch (error) {
				log(`⚠️ Push failed: ${error}`);
			}
		}

		// Set completion status EARLY to prevent frozen UI if sandbox creation hangs.
		// Bug fix #1720: Status was previously set AFTER createReviewSandbox() and startDevServer().
		// If either operation hangs, the status would never update, leaving the UI frozen.
		// Now we set status first, then attempt sandbox operations. saveManifest() is still called
		// AFTER reviewUrls are populated to ensure they're available when the manifest is written.
		const failedFeatures = manifest.feature_queue.filter(
			(f) => f.status === "failed",
		).length;
		manifest.progress.status = failedFeatures === 0 ? "completed" : "partial";
		manifest.progress.completed_at = new Date().toISOString();

		// =======================================================================
		// Bug fix #1727: Complete lifecycle redesign for completion phase
		// - Kill ALL implementation sandboxes (not just sbx-b, sbx-c)
		// - Emit events for all completion phase transitions
		// - Create fresh review sandbox with clean resources
		// =======================================================================

		log("\n🔄 Starting completion phase...");
		emitOrchestratorEvent(
			"completion_phase_start",
			"Completion phase started - cleaning up implementation sandboxes",
			{ sandboxCount: instances.length },
		);

		const reviewUrls: ReviewUrl[] = [];

		// Kill ALL implementation sandboxes (sbx-a, sbx-b, sbx-c, etc.)
		// Bug fix #1727: Don't keep sbx-a alive - it has resource pressure from 110+ tasks
		const killedSandboxIds: string[] = [];
		for (const instance of instances) {
			try {
				log(`   ${instance.label}: Stopping...`);
				emitOrchestratorEvent(
					"sandbox_killing",
					`Killing implementation sandbox ${instance.label}`,
					{ sandboxId: instance.id, label: instance.label },
				);
				killedSandboxIds.push(instance.id);
				await instance.sandbox.kill();
				log(`   ${instance.label}: ✅ Stopped`);
			} catch (error) {
				// Log error but still track as killed
				log(
					`   ${instance.label}: ⚠️ Kill failed: ${error instanceof Error ? error.message : error}`,
				);
			}
		}

		// Clean up killed sandbox IDs from manifest
		if (killedSandboxIds.length > 0) {
			const previousCount = manifest.sandbox.sandbox_ids.length;
			manifest.sandbox.sandbox_ids = manifest.sandbox.sandbox_ids.filter(
				(id) => !killedSandboxIds.includes(id),
			);
			const cleanedCount = previousCount - manifest.sandbox.sandbox_ids.length;
			if (cleanedCount > 0) {
				log(
					`   🧹 Cleaned up ${cleanedCount} killed sandbox ID(s) from manifest`,
				);
			}
		}

		// Create a fresh review sandbox for the dev server
		let reviewSandbox: Sandbox | null = null;
		const branchName = manifest.sandbox.branch_name;

		if (branchName) {
			try {
				log("\n   Creating dedicated review sandbox for dev server...");
				emitOrchestratorEvent(
					"review_sandbox_creating",
					"Creating fresh review sandbox for dev server",
					{ branchName },
				);
				// Wrap with 60-second timeout to prevent indefinite hangs
				reviewSandbox = await withTimeout(
					createReviewSandbox(branchName, options.timeout, options.ui),
					60000,
					"Review sandbox creation",
				);
				log("   ✅ Review sandbox created successfully");

				// Track review sandbox ID in manifest immediately
				if (
					reviewSandbox &&
					!manifest.sandbox.sandbox_ids.includes(reviewSandbox.sandboxId)
				) {
					manifest.sandbox.sandbox_ids.push(reviewSandbox.sandboxId);
					log(`   📋 Tracking review sandbox ID: ${reviewSandbox.sandboxId}`);
				}
			} catch (error) {
				log(
					`   ⚠️ Failed to create review sandbox: ${error instanceof Error ? error.message : error}`,
				);
				// No fallback - all implementation sandboxes are killed
			}
		}

		// Start dev server on review sandbox
		if (reviewSandbox) {
			log("\n🚀 Starting dev server for review...");
			emitOrchestratorEvent(
				"dev_server_starting",
				"Starting dev server on review sandbox",
				{ sandboxId: reviewSandbox.sandboxId },
			);

			const devServerVscodeUrl = getVSCodeUrl(reviewSandbox);

			try {
				// Use default timeout (180 attempts = 180s) for review sandbox
				// Next.js cold-start on fresh E2B sandbox can take 90-120s
				// Wrap with 200-second timeout to prevent indefinite hangs
				const devServerUrl = await withTimeout(
					startDevServer(reviewSandbox),
					200000,
					"Dev server startup",
				);
				reviewUrls.push({
					label: "sbx-review",
					vscode: devServerVscodeUrl,
					devServer: devServerUrl,
				});
				log("   ✅ Dev server ready on review sandbox");
				emitOrchestratorEvent(
					"dev_server_ready",
					"Dev server is running and accessible",
					{ url: devServerUrl },
				);
			} catch (error) {
				log(
					`   ⚠️ Dev server failed to start: ${error instanceof Error ? error.message : error}`,
				);
				emitOrchestratorEvent(
					"dev_server_failed",
					`Dev server failed to start: ${error instanceof Error ? error.message : error}`,
					{ error: error instanceof Error ? error.message : String(error) },
				);
				// Still add VS Code URL for code review even if dev server fails
				reviewUrls.push({
					label: "sbx-review",
					vscode: devServerVscodeUrl,
					devServer: "(failed to start)",
				});
			}
		} else {
			log("   ⚠️ No review sandbox available - dev server not started");
			emitOrchestratorEvent(
				"dev_server_failed",
				"No review sandbox available - could not start dev server",
			);
		}

		// Only the review sandbox should remain running
		const runningSandboxIds = new Set<string>();
		if (reviewSandbox) {
			runningSandboxIds.add(reviewSandbox.sandboxId);
		}

		// Log manifest state for debugging
		log("\n📋 Manifest sandbox state:");
		log(
			`   Sandbox IDs in manifest: [${manifest.sandbox.sandbox_ids.join(", ")}]`,
		);
		log(
			`   Running sandbox IDs: [${Array.from(runningSandboxIds).join(", ")}]`,
		);

		// Warn if there are orphaned IDs (IDs in manifest but not running)
		const orphanedIds = manifest.sandbox.sandbox_ids.filter(
			(id) => !runningSandboxIds.has(id),
		);
		if (orphanedIds.length > 0) {
			log(`   ⚠️ Orphaned sandbox IDs detected: [${orphanedIds.join(", ")}]`);
			// Remove orphaned IDs to maintain integrity
			manifest.sandbox.sandbox_ids = manifest.sandbox.sandbox_ids.filter((id) =>
				runningSandboxIds.has(id),
			);
			log(
				`   🧹 Removed orphaned IDs, manifest now has: [${manifest.sandbox.sandbox_ids.join(", ")}]`,
			);
		} else {
			log("   ✅ Manifest integrity verified (no orphaned sandbox IDs)");
		}

		// Save manifest with reviewUrls - this writes both the manifest file and
		// overall-progress.json atomically with reviewUrls included.
		// Note: Status was set earlier (before sandbox operations) to prevent frozen UI,
		// but saveManifest() is called here to ensure reviewUrls are available when written.
		saveManifest(manifest, reviewUrls, runId);

		// Print summary (always shown - handles its own output)
		// Bug fix #1727: No implementation sandboxes remain - all were killed
		if (!options.ui) {
			printSummary(manifest, [], reviewUrls);
		}

		// Add sandbox database review URL
		if (process.env.SUPABASE_SANDBOX_PROJECT_REF) {
			log("\n📊 Database Review:");
			log(
				`Supabase Studio: https://supabase.com/dashboard/project/${process.env.SUPABASE_SANDBOX_PROJECT_REF}`,
			);
		}

		// Wait for user to exit the UI (allows time to view preview URLs)
		if (uiManager) {
			await uiManager.waitForExit();
		}

		// Stop the event server
		stopEventServer(log);

		// Note: Lock release moved to finally block for guaranteed cleanup

		if (failedFeatures > 0) {
			process.exit(1);
		}
	} finally {
		// =========================================================================
		// Guaranteed Cleanup - always releases lock, even on error
		// =========================================================================
		if (lockAcquired) {
			log("🔓 Releasing orchestrator lock (finally block)...");
			try {
				releaseLock(options.ui);
			} catch (releaseError) {
				// Log but don't rethrow - we don't want to mask the original error
				console.error(
					`⚠️ Error releasing lock: ${releaseError instanceof Error ? releaseError.message : releaseError}`,
				);
			}
		}
	}
}
