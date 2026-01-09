/**

* Main Orchestration Module
*
* Orchestrates feature implementation across multiple E2B sandboxes.
* Manages the work loop, dry run output, and summary generation.
 */

import * as path from "node:path";
import process from "node:process";

import {
	HEALTH_CHECK_INTERVAL_MS,
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
import { checkEnvironment, GITHUB_TOKEN } from "./environment.js";
import { runFeatureImplementation } from "./feature.js";
import { runHealthChecks } from "./health.js";
import { acquireLock, getProjectRoot, releaseLock } from "./lock.js";
import {
	clearUIProgress,
	findSpecDir,
	loadManifest,
	saveManifest,
} from "./manifest.js";
import { createSandbox, getVSCodeUrl, startDevServer } from "./sandbox.js";
import { sleep } from "./utils.js";
import { cleanupStaleState, getNextAvailableFeature } from "./work-queue.js";

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
			await runHealthChecks(instances, manifest);
		} catch (error) {
			log(
				`   ⚠️ Health check error: ${error instanceof Error ? error.message : error}`,
			);
		} finally {
			healthCheckRunning = false;
		}
	}, HEALTH_CHECK_INTERVAL_MS);

	try {
		while (true) {
			// Check if we're done
			const pendingFeatures = manifest.feature_queue.filter(
				(f) => f.status === "pending" || f.status === "in_progress",
			);

			if (pendingFeatures.length === 0) {
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
					continue;
				}

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
					(f) => f.status === "pending" && f.dependencies.length > 0,
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
			const { startOrchestratorUI } = await import("../ui/index.js");
			uiManager = startOrchestratorUI(
				{
					specId: manifest.metadata.spec_id,
					specName: manifest.metadata.spec_name,
					progressDir,
					sandboxLabels,
					pollInterval: HEALTH_CHECK_INTERVAL_MS,
					minimal: options.minimalUi,
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
	await runWorkLoop(instances, manifest, options.ui);

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

	// Release lock
	releaseLock();

	if (failedFeatures > 0) {
		process.exit(1);
	}
}
