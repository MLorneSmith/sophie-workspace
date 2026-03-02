/**
 * Completion Phase Module
 *
 * Handles the post-implementation completion phase including:
 * - Killing implementation sandboxes
 * - Creating review sandbox
 * - Starting dev server
 * - Documentation generation
 *
 * Extracted from orchestrator.ts as part of refactoring #1816.
 */

import type { Sandbox } from "@e2b/code-interpreter";

import type {
	AgentProvider,
	ReviewUrl,
	SandboxInstance,
	SpecManifest,
} from "../types/index.js";
import { emitOrchestratorEvent } from "./event-emitter.js";
import { saveManifest } from "./manifest.js";
import {
	buildDocumentationCommand,
	buildDocumentationPrompt,
} from "./provider.js";
import {
	createReviewSandbox,
	getVSCodeUrl,
	startDevServer,
} from "./sandbox.js";
import { speakCompletion } from "./tts.js";
import { withTimeout } from "./utils.js";

// ============================================================================
// Types
// ============================================================================

export interface CompletionPhaseOptions {
	manifest: SpecManifest;
	instances: SandboxInstance[];
	timeout: number;
	uiEnabled: boolean;
	runId: string;
	document?: boolean;
	provider: AgentProvider;
}

export interface CompletionPhaseResult {
	reviewUrls: ReviewUrl[];
	reviewSandbox: Sandbox | null;
	failedFeatureCount: number;
	/**
	 * Completion status indicating the final state of the orchestration.
	 * Bug fix #1930: Track review sandbox creation success/failure separately.
	 */
	completionStatus: "completed" | "partial_completion" | "failed";
}

// ============================================================================
// Kill Implementation Sandboxes
// ============================================================================

/**
 * Kill all implementation sandboxes and clean up manifest.
 *
 * Bug fix #1727: Don't keep any implementation sandbox alive - they have
 * resource pressure from 110+ tasks.
 *
 * @param instances - Array of sandbox instances to kill
 * @param manifest - The spec manifest to update
 * @param log - Logger function
 * @returns Array of killed sandbox IDs
 */
export async function killImplementationSandboxes(
	instances: SandboxInstance[],
	manifest: SpecManifest,
	log: (...args: unknown[]) => void,
): Promise<string[]> {
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

	return killedSandboxIds;
}

// ============================================================================
// Review Sandbox Setup
// ============================================================================

/**
 * Result type for review sandbox creation.
 * Bug fix #1924: Surface error details instead of silently returning null.
 */
export interface ReviewSandboxResult {
	/** The review sandbox if creation succeeded */
	sandbox: Sandbox | null;
	/** Error message if creation failed */
	error?: string;
	/** Provider used for sandbox creation */
	provider: AgentProvider;
}

/**
 * Result from setupReviewSandbox including error details.
 * Bug fix #1931: Return error details so they can be stored in manifest.
 */
export interface SetupReviewSandboxResult {
	sandbox: Sandbox | null;
	error?: string;
}

/**
 * Create and configure the review sandbox.
 *
 * Bug fix #1924: Improved error handling with detailed logging and event emission.
 * Bug fix #1931: Use console.error for critical failures (visible even in UI mode),
 * and return error details so they can be stored in the manifest.
 *
 * @param branchName - Git branch to checkout
 * @param timeout - Sandbox timeout in seconds
 * @param uiEnabled - Whether UI mode is enabled
 * @param log - Logger function (for debug-level messages)
 * @param provider - Agent provider (claude or gpt)
 * @returns Result object with sandbox (or null) and error details
 */
export async function setupReviewSandbox(
	branchName: string,
	timeout: number,
	uiEnabled: boolean,
	log: (...args: unknown[]) => void,
	provider: AgentProvider,
): Promise<SetupReviewSandboxResult> {
	const providerDisplayName = provider === "gpt" ? "GPT (Codex)" : "Claude";

	try {
		log(
			`\n   Creating dedicated review sandbox for dev server (${providerDisplayName})...`,
		);
		emitOrchestratorEvent(
			"review_sandbox_creating",
			`Creating fresh review sandbox for dev server (${providerDisplayName})`,
			{ branchName, provider },
		);

		// Wrap with 15-minute timeout as safety net (Bug fix #1760)
		// Inner pnpm install has configurable timeout (default 20 min), git operations can take 2-4 minutes
		// Bug fix #1924: GPT provider may need retries, so allow extra time
		// Typical case: 2-3 minutes (git + build only)
		// Worst case: 15-20 minutes (full install with retries for GPT)
		// See: #1739, #1742, #1760, #1924 for timeout history
		const reviewSandbox = await withTimeout(
			createReviewSandbox(branchName, timeout, uiEnabled, provider),
			1200000, // 20 minutes to accommodate GPT retry logic
			"Review sandbox creation",
		);

		log(`   ✅ Review sandbox created successfully (${providerDisplayName})`);
		emitOrchestratorEvent(
			"review_sandbox_created",
			`Review sandbox created successfully (${providerDisplayName})`,
			{ sandboxId: reviewSandbox.sandboxId, provider },
		);
		return { sandbox: reviewSandbox };
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		const errorStack = error instanceof Error ? error.stack : undefined;

		// Bug fix #1931: Use console.error so message is ALWAYS visible, even in UI mode
		// The previous `log()` function is suppressed when uiEnabled=true, making errors invisible
		console.error(
			`\n❌ ERROR: Failed to create review sandbox (${providerDisplayName})`,
		);
		console.error(`   Error message: ${errorMessage}`);
		if (errorStack) {
			// Log truncated stack trace for debugging
			const truncatedStack = errorStack.split("\n").slice(0, 5).join("\n");
			console.error(`   Stack trace:\n${truncatedStack}`);
		}

		// Bug fix #1883, #1924: Emit failure event with full context
		emitOrchestratorEvent(
			"review_sandbox_failed",
			`Failed to create review sandbox (${providerDisplayName}): ${errorMessage}`,
			{
				error: errorMessage,
				provider,
				branchName,
				// Include stack for diagnostic events (truncated for readability)
				stack: errorStack?.slice(0, 500),
			},
		);

		// Bug fix #1931: Return error so caller can store it in manifest
		return { sandbox: null, error: errorMessage };
	}
}

// ============================================================================
// Dev Server Startup
// ============================================================================

/**
 * Start dev server on review sandbox and collect URLs.
 *
 * @param reviewSandbox - The review sandbox to start dev server on
 * @param log - Logger function
 * @returns Review URL object or null if failed
 */
export async function startReviewDevServer(
	reviewSandbox: Sandbox,
	log: (...args: unknown[]) => void,
): Promise<ReviewUrl | null> {
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

		log("   ✅ Dev server ready on review sandbox");
		emitOrchestratorEvent(
			"dev_server_ready",
			"Dev server is running and accessible",
			{ url: devServerUrl },
		);

		return {
			label: "sbx-review",
			vscode: devServerVscodeUrl,
			devServer: devServerUrl,
		};
	} catch (error) {
		log(
			`   ⚠️ Dev server failed to start: ${error instanceof Error ? error.message : error}`,
		);
		emitOrchestratorEvent(
			"dev_server_failed",
			`Dev server failed to start: ${error instanceof Error ? error.message : error}`,
			{ error: error instanceof Error ? error.message : String(error) },
		);

		// Still return VS Code URL for code review even if dev server fails
		return {
			label: "sbx-review",
			vscode: devServerVscodeUrl,
			devServer: "(failed to start)",
		};
	}
}

// ============================================================================
// Orphaned Sandbox Cleanup
// ============================================================================

/**
 * Clean up orphaned sandbox IDs from manifest.
 *
 * @param manifest - The spec manifest
 * @param runningSandboxIds - Set of currently running sandbox IDs
 * @param log - Logger function
 * @returns Number of orphaned IDs removed
 */
export function cleanupOrphanedSandboxIds(
	manifest: SpecManifest,
	runningSandboxIds: Set<string>,
	log: (...args: unknown[]) => void,
): number {
	log("\n📋 Manifest sandbox state:");
	log(
		`   Sandbox IDs in manifest: [${manifest.sandbox.sandbox_ids.join(", ")}]`,
	);
	log(`   Running sandbox IDs: [${Array.from(runningSandboxIds).join(", ")}]`);

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

	return orphanedIds.length;
}

// ============================================================================
// Documentation Generation
// ============================================================================

/**
 * Generate documentation if enabled and all features completed.
 *
 * @param sandbox - The sandbox to run documentation in
 * @param manifest - The spec manifest
 * @param log - Logger function
 * @returns true if documentation was generated successfully
 */
export async function generateDocumentation(
	sandbox: Sandbox,
	manifest: SpecManifest,
	log: (...args: unknown[]) => void,
	provider: AgentProvider,
): Promise<boolean> {
	const allFeaturesCompleted =
		manifest.progress.features_completed === manifest.progress.features_total;

	if (!allFeaturesCompleted) {
		log(
			`\n📚 Skipping documentation: ${manifest.progress.features_completed}/${manifest.progress.features_total} features completed (not all complete)`,
		);
		return false;
	}

	log("\n📚 Generating spec documentation (--document flag enabled)...");
	emitOrchestratorEvent(
		"documentation_start",
		"Starting spec documentation generation via /alpha:document",
		{ specId: manifest.metadata.spec_id },
	);

	try {
		const specIdArg = manifest.metadata.spec_id.replace(/^S/, "");
		const docPrompt = buildDocumentationPrompt(provider, specIdArg);
		const command = buildDocumentationCommand(provider, docPrompt);
		const docResult = await withTimeout(
			sandbox.commands.run(
				`cd /home/user/project && ${command}`,
				{ timeoutMs: 600000 }, // 10 minute timeout for documentation generation
			),
			660000, // 11 minute outer timeout
			"Documentation generation",
		);

		if (docResult.exitCode === 0) {
			log("   ✅ Spec documentation generated successfully");
			emitOrchestratorEvent(
				"documentation_complete",
				"Spec documentation generated successfully",
				{ specId: manifest.metadata.spec_id },
			);

			// Push the documentation changes
			log("   📤 Pushing documentation changes...");
			try {
				await sandbox.commands.run(
					`cd /home/user/project && git add -A && git commit -m "docs(alpha): add spec documentation for S${specIdArg} [agent: alpha-orchestrator]" && git push`,
					{ timeoutMs: 120000 },
				);
				log("   ✅ Documentation pushed to branch");
			} catch (pushError) {
				// Non-fatal: documentation was generated but push failed
				log(
					`   ⚠️ Documentation push failed: ${pushError instanceof Error ? pushError.message : pushError}`,
				);
			}
			return true;
		} else {
			log(
				`   ⚠️ Documentation generation failed (exit code: ${docResult.exitCode})`,
			);
			if (docResult.stderr) {
				log(`   Stderr: ${docResult.stderr.slice(0, 500)}`);
			}
			emitOrchestratorEvent(
				"documentation_failed",
				`Documentation generation failed with exit code ${docResult.exitCode}`,
				{
					specId: manifest.metadata.spec_id,
					exitCode: docResult.exitCode,
				},
			);
			return false;
		}
	} catch (docError) {
		// Non-fatal: documentation is optional, don't fail the whole orchestration
		log(
			`   ⚠️ Documentation generation error: ${docError instanceof Error ? docError.message : docError}`,
		);
		emitOrchestratorEvent(
			"documentation_failed",
			`Documentation generation error: ${docError instanceof Error ? docError.message : docError}`,
			{ specId: manifest.metadata.spec_id },
		);
		return false;
	}
}

// ============================================================================
// TTS Completion Notification
// ============================================================================

/**
 * Speak completion notification.
 *
 * @param failedFeatureCount - Number of failed features
 * @param completedCount - Number of completed features
 * @param totalCount - Total number of features
 */
export function notifyCompletion(
	failedFeatureCount: number,
	completedCount: number,
	totalCount: number,
): void {
	// Issue #1761: Audio notification when orchestrator completes
	speakCompletion(
		failedFeatureCount === 0 ? "completed" : "partial",
		completedCount,
		totalCount,
	);
}

// ============================================================================
// Main Completion Phase Executor
// ============================================================================

/**
 * Execute the completion phase after all features are implemented.
 *
 * This function orchestrates:
 * 1. Killing all implementation sandboxes
 * 2. Creating a fresh review sandbox
 * 3. Starting the dev server
 * 4. Cleaning up orphaned sandbox IDs
 *
 * @param options - Completion phase options
 * @param log - Logger function
 * @returns Completion phase result
 */
export async function executeCompletionPhase(
	options: CompletionPhaseOptions,
	log: (...args: unknown[]) => void,
): Promise<CompletionPhaseResult> {
	const { manifest, instances, timeout, uiEnabled, runId, provider } = options;

	// Count failed features for status determination
	const failedFeatureCount = manifest.feature_queue.filter(
		(f) => f.status === "failed",
	).length;

	// Phase 1: Set "completing" status
	// Bug fix #1746, #1754: Use intermediate status for proper UI feedback
	manifest.progress.status = "completing";
	manifest.progress.completed_at = new Date().toISOString();
	saveManifest(manifest, [], runId);

	log("\n🔄 Starting completion phase...");
	emitOrchestratorEvent(
		"completion_phase_start",
		"Completion phase started - cleaning up implementation sandboxes",
		{ sandboxCount: instances.length },
	);

	// Kill all implementation sandboxes
	await killImplementationSandboxes(instances, manifest, log);

	// Create review sandbox
	const branchName = manifest.sandbox.branch_name;
	let reviewSandbox: Sandbox | null = null;
	let reviewError: string | undefined;
	const reviewUrls: ReviewUrl[] = [];

	if (branchName) {
		const result = await setupReviewSandbox(
			branchName,
			timeout,
			uiEnabled,
			log,
			provider,
		);
		reviewSandbox = result.sandbox;
		reviewError = result.error;

		// Bug fix #1931: Store error in manifest so it persists for diagnostics
		if (reviewError) {
			manifest.progress.review_error = reviewError;
		}

		// Track review sandbox ID in manifest
		if (
			reviewSandbox &&
			!manifest.sandbox.sandbox_ids.includes(reviewSandbox.sandboxId)
		) {
			manifest.sandbox.sandbox_ids.push(reviewSandbox.sandboxId);
			log(`   📋 Tracking review sandbox ID: ${reviewSandbox.sandboxId}`);
		}
	}

	// Start dev server on review sandbox
	if (reviewSandbox) {
		const reviewUrl = await startReviewDevServer(reviewSandbox, log);
		if (reviewUrl) {
			reviewUrls.push(reviewUrl);
		}
	} else {
		log("   ⚠️ No review sandbox available - dev server not started");
		emitOrchestratorEvent(
			"dev_server_failed",
			"No review sandbox available - could not start dev server",
		);
	}

	// Clean up orphaned sandbox IDs
	const runningSandboxIds = new Set<string>();
	if (reviewSandbox) {
		runningSandboxIds.add(reviewSandbox.sandboxId);
	}
	cleanupOrphanedSandboxIds(manifest, runningSandboxIds, log);

	// Bug fix #1930: Determine completion status based on features AND review sandbox
	// - "completed": All features completed AND review sandbox created
	// - "partial_completion": All features completed but review sandbox failed
	// - "failed": Features failed during implementation
	let completionStatus: "completed" | "partial_completion" | "failed";
	if (failedFeatureCount > 0) {
		completionStatus = "failed";
	} else if (!reviewSandbox) {
		completionStatus = "partial_completion";
	} else {
		completionStatus = "completed";
	}

	// Phase 2: Set final status
	manifest.progress.status = failedFeatureCount === 0 ? "completed" : "partial";
	manifest.progress.completion_status = completionStatus;
	saveManifest(manifest, reviewUrls, runId);

	// Bug fix #1930: Add prominent completion summary with clear status reporting
	log("\n" + "═".repeat(60));
	log("📊 COMPLETION SUMMARY");
	log("═".repeat(60));
	log(
		`   Features: ${manifest.progress.features_completed}/${manifest.progress.features_total} completed`,
	);
	log(
		`   Tasks: ${manifest.progress.tasks_completed}/${manifest.progress.tasks_total} completed`,
	);
	log(`   Failed features: ${failedFeatureCount}`);
	log(`   Review sandbox: ${reviewSandbox ? "✅ Created" : "❌ FAILED"}`);
	log(`   Completion status: ${completionStatus.toUpperCase()}`);

	if (!reviewSandbox) {
		// Bug fix #1931: Use console.error so warning is ALWAYS visible, even in UI mode
		console.error("\n⚠️  WARNING: Review sandbox creation FAILED");
		console.error("   - Dev server could not be started for visual review");
		if (reviewError) {
			console.error(`   - Error: ${reviewError}`);
			console.error(
				"   - See spec-manifest.json progress.review_error for details",
			);
		}
		console.error(
			"   - Features are implemented but manual review is required",
		);
	}

	if (failedFeatureCount > 0) {
		log(`\n⚠️  WARNING: ${failedFeatureCount} feature(s) FAILED`);
		log("   - Check feature error fields in spec-manifest.json");
		log("   - Review failure reasons before retry");
	}

	log("═".repeat(60) + "\n");

	// TTS notification
	notifyCompletion(
		failedFeatureCount,
		manifest.progress.features_completed,
		manifest.progress.features_total,
	);

	return {
		reviewUrls,
		reviewSandbox,
		failedFeatureCount,
		completionStatus,
	};
}
