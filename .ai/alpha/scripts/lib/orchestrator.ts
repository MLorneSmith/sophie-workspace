/**

* Main Orchestration Module
*
* Orchestrates feature implementation across multiple E2B sandboxes.
* Manages the work loop, dry run output, and summary generation.
 */

import { spawn, type ChildProcess } from "node:child_process";
import * as path from "node:path";
import process from "node:process";

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
} from "./environment.js";
import { runFeatureImplementation } from "./feature.js";
import { runHealthChecks } from "./health.js";
import { acquireLock, getProjectRoot, releaseLock } from "./lock.js";
import {
	clearUIProgress,
	findSpecDir,
	loadManifest,
	saveManifest,
	writeOverallProgress,
} from "./manifest.js";
import { writeIdleProgress } from "./progress.js";
import {
	createSandbox,
	getSandboxesNeedingRestart,
	getVSCodeUrl,
	keepAliveSandboxes,
	startDevServer,
} from "./sandbox.js";
import { sleep } from "./utils.js";
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
 */
export async function runWorkLoop(
	instances: SandboxInstance[],
	manifest: SpecManifest,
	uiEnabled: boolean = false,
	timeoutSeconds: number = 7200,
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
			const needsRestart = await runHealthChecks(instances, manifest);

			// Attempt to restart sandboxes that failed health checks
			for (const instance of needsRestart) {
				if (instance.status === "failed") {
					log(
						`   🔄 Attempting to restart failed sandbox ${instance.label}...`,
					);
					try {
						// Capture old ID before reassignment for cleanup
						const oldSandboxId = instance.id;

						const newInstance = await createSandbox(
							manifest,
							instance.label,
							timeoutSeconds,
							uiEnabled,
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
						log(`   ✅ Sandbox ${instance.label} restarted successfully`);
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
			// First, check for sandboxes approaching max age (50 min = preemptive restart)
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
					log(
						`   ⏰ Sandbox ${label} is ${ageMinutes}min old, performing preemptive restart...`,
					);

					// Reset any in-progress feature assigned to this sandbox
					const feature = manifest.feature_queue.find(
						(f) => f.assigned_sandbox === label && f.status === "in_progress",
					);
					if (feature) {
						feature.status = "pending";
						feature.assigned_sandbox = undefined;
						feature.assigned_at = undefined;
						feature.error = "Preemptive restart before expiration";
						saveManifest(manifest);
					}

					try {
						// Kill the old sandbox first
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
							`   ✅ Sandbox ${label} preemptively restarted (${newInstance.id})`,
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

						// Capture old ID before reassignment for cleanup
						const oldSandboxId = instance.id;

						const newInstance = await createSandbox(
							manifest,
							label,
							timeoutSeconds,
							uiEnabled,
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
							`   ✅ Sandbox ${label} restarted successfully (${newInstance.id})`,
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

				const feature = getNextAvailableFeature(manifest);
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
				);
				if (!assigned) {
					// Lost the race - another sandbox claimed this feature, try again
					log(
						`   ⚠️ ${instance.label}: Lost race for #${feature.id}, will retry`,
					);
					continue;
				}
				// NOTE: saveManifest is now called inside assignFeatureToSandbox for atomicity

				// Start work on this sandbox
				const workPromise = (async () => {
					await runFeatureImplementation(
						instance,
						manifest,
						feature,
						uiEnabled,
					);
					activeWork.delete(instance.label);
				})();

				activeWork.set(instance.label, workPromise);
			}

			// If no work is active and no features available, we might be stuck
			if (activeWork.size === 0) {
				const blockedFeatures = manifest.feature_queue.filter(
					(f) =>
						(f.status === "pending" || f.status === "failed") &&
						f.dependencies.length > 0,
				);

				if (blockedFeatures.length > 0) {
					log("\n⚠️ Features blocked by incomplete dependencies:");
					for (const f of blockedFeatures.slice(0, 5)) {
						log(
							`   #${f.id}: blocked by ${f.dependencies.map((d) => `#${d}`).join(", ")}`,
						);
					}
				}
				break;
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
	const manifestOrNull = loadManifest(specDir);

	if (!manifestOrNull) {
		console.error(
			"Spec manifest not found. Run generate-spec-manifest.ts first.",
		);
		process.exit(1);
	}

	const manifest = manifestOrNull as SpecManifest;

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
		// Clear old UI progress files before starting UI
		clearUIProgress();

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
	log("═".repeat(70));

	// Handle force unlock
	if (options.forceUnlock) {
		log("\n🔓 Force releasing orchestrator lock...");
		releaseLock();
	}

	// Acquire orchestrator lock
	if (!options.dryRun) {
		if (!acquireLock(options.specId)) {
			if (uiManager) uiManager.stop();
			process.exit(1);
		}
	}

	// Register cleanup handler
	const cleanupAndExit = (code: number) => {
		if (uiManager) uiManager.stop();
		if (!options.dryRun) {
			releaseLock();
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

	// Check sandbox database capacity
	if (!options.dryRun && process.env.SUPABASE_SANDBOX_DB_URL) {
		log("\n📊 Checking sandbox database...");
		const hasCapacity = await checkDatabaseCapacity();
		if (!hasCapacity) {
			if (uiManager) uiManager.stop();
			releaseLock();
			process.exit(1);
		}

		// Reset sandbox database
		if (!options.skipDbReset) {
			try {
				await resetSandboxDatabase();
			} catch (error) {
				console.error("Failed to reset sandbox database:", error);
				if (uiManager) uiManager.stop();
				process.exit(1);
			}
		} else {
			log("   ⏭️ Skipping database reset (--skip-db-reset)");
		}
	}

	// Clean up stale state
	const cleanedCount = cleanupStaleState(manifest);
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
	const nextFeature = getNextAvailableFeature(manifest);
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

	// Create sandboxes
	const instances: SandboxInstance[] = [];

	// Create FIRST sandbox (needed for seeding)
	log("\n📦 Creating first sandbox...");
	const firstInstance = await createSandbox(
		manifest,
		"sbx-a",
		options.timeout,
		options.ui,
	);
	instances.push(firstInstance);

	// Seed database via first sandbox
	if (
		!options.skipDbReset &&
		!options.skipDbSeed &&
		process.env.SUPABASE_SANDBOX_DB_URL
	) {
		const alreadySeeded = await isDatabaseSeeded();
		if (alreadySeeded) {
			log("   ℹ️ Database already seeded, skipping seeding step");
		} else {
			const seedSuccess = await seedSandboxDatabase(firstInstance.sandbox);
			if (!seedSuccess) {
				console.error("❌ Database seeding failed, aborting orchestration");
				await firstInstance.sandbox.kill();
				if (uiManager) uiManager.stop();
				releaseLock();
				process.exit(1);
			}
		}
	} else if (options.skipDbSeed) {
		log("   ⏭️ Skipping database seeding (--skip-db-seed)");
	}

	// Create remaining sandboxes
	for (let i = 1; i < options.sandboxCount; i++) {
		const label = `sbx-${String.fromCharCode(97 + i)}`;

		log(
			`\n   ⏳ Waiting ${SANDBOX_STAGGER_DELAY_MS / 1000}s before next sandbox...`,
		);
		await sleep(SANDBOX_STAGGER_DELAY_MS);

		const instance = await createSandbox(
			manifest,
			label,
			options.timeout,
			options.ui,
		);
		instances.push(instance);
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

	// Start implementation
	log("\n" + "═".repeat(70));
	log("   IMPLEMENTATION");
	log("═".repeat(70));

	manifest.progress.status = "in_progress";
	manifest.progress.started_at =
		manifest.progress.started_at || new Date().toISOString();
	saveManifest(manifest);

	// Main work loop
	await runWorkLoop(instances, manifest, options.ui, options.timeout);

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

	// Final status
	const failedFeatures = manifest.feature_queue.filter(
		(f) => f.status === "failed",
	).length;
	manifest.progress.status = failedFeatures === 0 ? "completed" : "partial";
	manifest.progress.completed_at = new Date().toISOString();
	saveManifest(manifest);

	// Prepare one sandbox for complete review
	log("\n🔄 Preparing sandbox for complete review...");
	const reviewInstance = instances[0];
	const otherInstances = instances.slice(1);

	// Pull latest to get all changes
	if (reviewInstance) {
		try {
			log(`${reviewInstance.label}: Pulling latest changes...`);
			await reviewInstance.sandbox.commands.run(
				`cd /home/user/project && git pull origin "${manifest.sandbox.branch_name}"`,
				{ timeoutMs: 60000 },
			);
			log(`${reviewInstance.label}: ✅ Has complete code`);
		} catch (error) {
			log(`${reviewInstance.label}: ⚠️ Pull failed: ${error}`);
		}
	}

	// Kill other sandboxes
	for (const instance of otherInstances) {
		try {
			log(`${instance.label}: Stopping (partial code only)...`);
			await instance.sandbox.kill();
		} catch {
			// Ignore
		}
	}

	// Start dev server on review sandbox
	log("\n🚀 Starting dev server for review...");
	const reviewUrls: ReviewUrl[] = [];

	if (reviewInstance) {
		try {
			const devServerUrl = await startDevServer(reviewInstance.sandbox);
			const vscodeUrl = getVSCodeUrl(reviewInstance.sandbox);
			reviewUrls.push({
				label: reviewInstance.label,
				vscode: vscodeUrl,
				devServer: devServerUrl,
			});
			log(`${reviewInstance.label}: Dev server starting...`);

			log("   Waiting for dev server to start (30s)...");
			await sleep(30000);
		} catch (error) {
			log(`   Failed to start dev server: ${error}`);
		}
	}

	// Write review URLs to progress file for UI to display
	if (reviewUrls.length > 0) {
		writeOverallProgress(manifest, reviewUrls);
		// Give UI time to pick up the updated progress file
		await sleep(1000);
	}

	// Print summary (always shown - handles its own output)
	if (!options.ui) {
		const reviewInstancesForSummary = reviewInstance ? [reviewInstance] : [];
		printSummary(manifest, reviewInstancesForSummary, reviewUrls);
	}

	// Add sandbox database review URL
	if (process.env.SUPABASE_SANDBOX_PROJECT_REF) {
		log("\n📊 Database Review:");
		log(
			`Supabase Studio: https://supabase.com/dashboard/project/${process.env.SUPABASE_SANDBOX_PROJECT_REF}`,
		);
	}

	// Stop the UI
	if (uiManager) {
		uiManager.stop();
	}

	// Stop the event server
	stopEventServer(log);

	// Release lock
	releaseLock();

	if (failedFeatures > 0) {
		process.exit(1);
	}
}
