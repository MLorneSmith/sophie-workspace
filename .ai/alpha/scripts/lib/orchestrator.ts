/**

* Main Orchestration Module
*
* Orchestrates feature implementation across multiple E2B sandboxes.
* Manages the work loop, dry run output, and summary generation.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import process from "node:process";

import {
	EVENT_SERVER_PORT,
	HEALTH_CHECK_INTERVAL_MS,
	LOGS_DIR,
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
	executeCompletionPhase,
	generateDocumentation,
} from "./completion-phase.js";
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
import {
	startEventServer,
	stopEventServer,
	waitForUIReady,
} from "./event-server.js";
import { acquireLock, getProjectRoot, releaseLock } from "./lock.js";
import {
	archiveAndClearPreviousRun,
	findSpecDir,
	generateSpecManifest,
	loadManifest,
	saveManifest,
} from "./manifest.js";
import {
	checkDependencyCycles,
	checkPreFlightSilent,
	formatPreFlightForDryRun,
	runPreFlightCheck,
} from "./pre-flight.js";
import { generateRunId } from "./run-id.js";
import {
	clearStaleSandboxData,
	createSandbox,
	getSandboxAgeMinutes,
	isSandboxExpired,
	reconnectToStoredSandboxes,
} from "./sandbox.js";
import { sleep } from "./utils.js";
import { cleanupStaleState, getNextAvailableFeature } from "./work-queue.js";
import { runWorkLoop } from "./work-loop.js";

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

	// Environment requirements
	console.log("\n🔑 Environment Requirements:");
	console.log(formatPreFlightForDryRun(manifest));
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
// Work Loop (Re-exported from work-loop.ts)
// ============================================================================

// Work loop logic is now in work-loop.ts for better separation of concerns
export { runWorkLoop, WorkLoop } from "./work-loop.js";
export type { WorkLoopOptions, WorkLoopResult } from "./work-loop.js";

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
	// Pre-Flight Environment Variable Check
	// =========================================================================
	if (!options.skipPreFlight && !options.dryRun) {
		log("\n🔍 Running pre-flight environment check...");

		// For interactive terminals, run the full interactive check
		// For non-interactive (piped/scripted), run silent check
		const isInteractive = process.stdin.isTTY && process.stdout.isTTY;

		if (isInteractive) {
			const preFlightResult = await runPreFlightCheck(manifest, log);
			if (!preFlightResult.proceed) {
				log("❌ Pre-flight check failed. Exiting.");
				process.exit(1);
			}
		} else {
			// Non-interactive mode: just check and warn
			checkPreFlightSilent(manifest, log);
		}
	}

	// =========================================================================
	// Validate Dependency Graph for Circular Dependencies
	// Bug fix #1916: Catch circular dependencies before wasting resources
	// =========================================================================
	if (!options.dryRun) {
		log("\n🔍 Running dependency cycle validation...");
		const cycleCheckResult = checkDependencyCycles(manifest, log);
		if (!cycleCheckResult.proceed) {
			console.error(
				"❌ Circular dependencies detected. Fix and regenerate manifest.",
			);
			process.exit(1);
		}
	}

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
		// Bug fix #1799: Track when all features are already complete to skip to completion phase
		let allFeaturesAlreadyComplete = false;
		const nextFeature = getNextAvailableFeature(manifest, options.ui);
		if (nextFeature) {
			log(`\n🎯 Next feature: #${nextFeature.id} - ${nextFeature.title}`);
		} else if (
			manifest.progress.features_completed === manifest.progress.features_total
		) {
			log("\n🎉 All features already completed!");
			log("   Proceeding to completion phase to create review sandbox...");
			allFeaturesAlreadyComplete = true;
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

		// Bug fix #1799: Declare instances array outside conditional so it's available in completion phase
		const instances: SandboxInstance[] = [];

		// Skip sandbox initialization and work loop if all features already complete
		// This allows re-running the orchestrator to create review sandbox without wasting resources
		if (allFeaturesAlreadyComplete) {
			log(
				"\n⏭️  Skipping sandbox initialization (all features already complete)",
			);
		} else {
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
			const startupDurationSec = (
				(Date.now() - startupStartTime) /
				1000
			).toFixed(1);
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

			// Documentation Generation (opt-in via --document flag)
			// Uses extracted generateDocumentation function from completion-phase.ts
			if (options.document && pushInstance) {
				await generateDocumentation(pushInstance.sandbox, manifest, log);
			}
		} // End of else block for !allFeaturesAlreadyComplete (Bug fix #1799)

		// =======================================================================
		// Completion Phase - extracted to completion-phase.ts
		// Handles: killing sandboxes, creating review sandbox, starting dev server,
		// cleaning up orphaned IDs, TTS notification
		// =======================================================================
		const completionResult = await executeCompletionPhase(
			{
				manifest,
				instances,
				timeout: options.timeout,
				uiEnabled: options.ui,
				runId,
			},
			log,
		);

		const { reviewUrls, failedFeatureCount } = completionResult;

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

		if (failedFeatureCount > 0) {
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
