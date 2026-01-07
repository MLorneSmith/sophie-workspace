#!/usr/bin/env tsx

/**
 * Alpha Spec Orchestrator
 *
 * Manages E2B sandboxes and Claude Code sessions to implement all features
 * across all initiatives in a spec.
 *
 * Key features:
 * - Takes Spec ID (not Initiative ID)
 * - Work queue pattern: sandboxes dynamically pull next available feature
 * - Dependency-aware: features only assigned when dependencies are complete
 * - Auto-resume: reads progress on startup, continues where left off
 *
 * Usage:
 *   tsx spec-orchestrator.ts <spec-id> [options]
 *
 * Options:
 *   --sandboxes <n>   Number of sandboxes (default: 2, max: 2)
 *   --timeout <s>     Sandbox timeout in seconds (default: 3600)
 *   --dry-run         Show plan without executing
 *
 * Examples:
 *   tsx spec-orchestrator.ts 1362
 *   tsx spec-orchestrator.ts 1362 --sandboxes 1
 *   tsx spec-orchestrator.ts 1362 --dry-run
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { Sandbox } from "@e2b/code-interpreter";

// ============================================================================
// Constants
// ============================================================================

const TEMPLATE_ALIAS = "slideheroes-claude-agent-dev";
const WORKSPACE_DIR = "/home/user/project";
const PROGRESS_FILE = ".initiative-progress.json";
const PROGRESS_POLL_INTERVAL_MS = 30000;
const STALL_TIMEOUT_MS = 10 * 60 * 1000;

// ============================================================================
// Types
// ============================================================================

interface FeatureEntry {
	id: number;
	initiative_id: number;
	title: string;
	slug?: string;
	priority: number;
	global_priority: number;
	status: "pending" | "in_progress" | "completed" | "failed" | "blocked";
	tasks_file: string;
	feature_dir: string;
	task_count: number;
	tasks_completed: number;
	sequential_hours: number;
	parallel_hours: number;
	dependencies: number[];
	github_issue: number | null;
	assigned_sandbox?: string;
	error?: string;
}

interface InitiativeEntry {
	id: number;
	name: string;
	slug: string;
	priority: number;
	status: "pending" | "in_progress" | "completed" | "failed" | "partial";
	initiative_dir: string;
	feature_count: number;
	features_completed: number;
	dependencies: number[];
}

interface SpecManifest {
	metadata: {
		spec_id: number;
		spec_name: string;
		generated_at: string;
		spec_dir: string;
		research_dir: string;
	};
	initiatives: InitiativeEntry[];
	feature_queue: FeatureEntry[];
	progress: {
		status: "pending" | "in_progress" | "completed" | "failed" | "partial";
		initiatives_completed: number;
		initiatives_total: number;
		features_completed: number;
		features_total: number;
		tasks_completed: number;
		tasks_total: number;
		next_feature_id: number | null;
		last_completed_feature_id: number | null;
		started_at: string | null;
		completed_at: string | null;
		last_checkpoint: string | null;
	};
	sandbox: {
		sandbox_ids: string[];
		branch_name: string | null;
		created_at: string | null;
	};
}

interface OrchestratorOptions {
	specId: number;
	sandboxCount: number;
	timeout: number;
	dryRun: boolean;
}

interface SandboxInstance {
	sandbox: Sandbox;
	id: string;
	label: string;
	status: "ready" | "busy" | "completed" | "failed";
	currentFeature: number | null;
}

// ============================================================================
// Environment
// ============================================================================

const E2B_API_KEY = process.env.E2B_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

function getClaudeOAuthToken(): string | undefined {
	if (process.env.CLAUDE_CODE_OAUTH_TOKEN) {
		return process.env.CLAUDE_CODE_OAUTH_TOKEN;
	}

	const homeDir = process.env.HOME || process.env.USERPROFILE;
	if (!homeDir) return undefined;

	const credentialsPath = path.join(homeDir, ".claude", ".credentials.json");

	try {
		if (fs.existsSync(credentialsPath)) {
			const content = fs.readFileSync(credentialsPath, "utf-8");
			const credentials = JSON.parse(content);
			return credentials?.claudeAiOauth?.accessToken;
		}
	} catch {
		// Silently fail
	}

	return undefined;
}

let _cachedOAuthToken: string | undefined;
function getCachedOAuthToken(): string | undefined {
	if (_cachedOAuthToken === undefined) {
		_cachedOAuthToken = getClaudeOAuthToken() || "";
	}
	return _cachedOAuthToken || undefined;
}

function checkEnvironment(): void {
	if (!E2B_API_KEY) {
		console.error("ERROR: E2B_API_KEY environment variable not set");
		process.exit(1);
	}

	const oauthToken = getCachedOAuthToken();
	if (!ANTHROPIC_API_KEY && !oauthToken) {
		console.error("ERROR: No Claude authentication found");
		process.exit(1);
	}
}

function getAllEnvVars(): Record<string, string> {
	const envs: Record<string, string> = {};

	const oauthToken = getCachedOAuthToken();
	if (oauthToken) {
		envs.CLAUDE_CODE_OAUTH_TOKEN = oauthToken;
	} else if (ANTHROPIC_API_KEY) {
		envs.ANTHROPIC_API_KEY = ANTHROPIC_API_KEY;
	}

	if (GITHUB_TOKEN) {
		envs.GITHUB_TOKEN = GITHUB_TOKEN;
	}

	return envs;
}

// ============================================================================
// Manifest Management
// ============================================================================

function findProjectRoot(): string {
	let dir = process.cwd();
	while (dir !== "/") {
		if (fs.existsSync(path.join(dir, ".git"))) {
			return dir;
		}
		dir = path.dirname(dir);
	}
	return process.cwd();
}

function findSpecDir(projectRoot: string, specId: number): string | null {
	const specsDir = path.join(projectRoot, ".ai", "alpha", "specs");

	if (!fs.existsSync(specsDir)) {
		return null;
	}

	const specDirs = fs.readdirSync(specsDir);

	for (const specDir of specDirs) {
		const match = specDir.match(/^(\d+)-Spec-/);
		if (match && parseInt(match[1], 10) === specId) {
			return path.join(specsDir, specDir);
		}
	}

	return null;
}

function loadManifest(specDir: string): SpecManifest | null {
	const manifestPath = path.join(specDir, "spec-manifest.json");

	if (!fs.existsSync(manifestPath)) {
		return null;
	}

	try {
		const content = fs.readFileSync(manifestPath, "utf-8");
		return JSON.parse(content) as SpecManifest;
	} catch (error) {
		console.error(`Failed to load manifest: ${error}`);
		return null;
	}
}

function saveManifest(manifest: SpecManifest): void {
	const manifestPath = path.join(manifest.metadata.spec_dir, "spec-manifest.json");
	manifest.progress.last_checkpoint = new Date().toISOString();
	fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, "\t"));
}

// ============================================================================
// Work Queue
// ============================================================================

/**
 * Get the next available feature that:
 * 1. Is pending (not in_progress, completed, or failed)
 * 2. Has all dependencies completed
 * 3. Is not assigned to another sandbox
 */
function getNextAvailableFeature(manifest: SpecManifest): FeatureEntry | null {
	const completedFeatureIds = new Set(
		manifest.feature_queue
			.filter((f) => f.status === "completed")
			.map((f) => f.id)
	);

	// Also consider completed initiatives for initiative-level dependencies
	const completedInitiativeIds = new Set(
		manifest.initiatives
			.filter((i) => i.status === "completed")
			.map((i) => i.id)
	);

	for (const feature of manifest.feature_queue) {
		// Skip if not pending
		if (feature.status !== "pending") {
			continue;
		}

		// Skip if already assigned to a sandbox
		if (feature.assigned_sandbox) {
			continue;
		}

		// Check if all dependencies are satisfied
		const depsComplete = feature.dependencies.every((depId) => {
			// Check if it's a completed feature
			if (completedFeatureIds.has(depId)) {
				return true;
			}
			// Check if it's a completed initiative
			if (completedInitiativeIds.has(depId)) {
				return true;
			}
			return false;
		});

		if (depsComplete) {
			return feature;
		}
	}

	return null;
}

/**
 * Update the next_feature_id in progress based on current state.
 */
function updateNextFeatureId(manifest: SpecManifest): void {
	const nextFeature = getNextAvailableFeature(manifest);
	manifest.progress.next_feature_id = nextFeature?.id || null;
}

// ============================================================================
// Sandbox Management
// ============================================================================

async function setupGitCredentials(sandbox: Sandbox): Promise<void> {
	if (!GITHUB_TOKEN) return;

	const commands = [
		'git config --global user.name "SlideHeroes Alpha"',
		'git config --global user.email "alpha@slideheroes.dev"',
		"git config --global credential.helper store",
		`echo "https://x-access-token:${GITHUB_TOKEN}@github.com" > ~/.git-credentials`,
		"chmod 600 ~/.git-credentials",
		"git config --global push.default current",
		"git config --global push.autoSetupRemote true",
	];

	for (const cmd of commands) {
		await sandbox.commands.run(cmd, { timeoutMs: 10000 });
	}

	try {
		await sandbox.commands.run(
			`echo "${GITHUB_TOKEN}" | gh auth login --with-token`,
			{ timeoutMs: 30000 }
		);
	} catch {
		// Non-fatal
	}
}

async function createSandbox(
	manifest: SpecManifest,
	label: string,
	timeout: number
): Promise<SandboxInstance> {
	console.log(`\n📦 Creating sandbox ${label}...`);

	const sandbox = await Sandbox.create(TEMPLATE_ALIAS, {
		timeoutMs: timeout * 1000,
		apiKey: E2B_API_KEY,
		envs: getAllEnvVars(),
	});

	console.log(`   ID: ${sandbox.sandboxId}`);

	// Setup git
	if (GITHUB_TOKEN) {
		await setupGitCredentials(sandbox);
	}

	// Fetch and setup branch
	const branchName = `alpha/spec-${manifest.metadata.spec_id}`;

	await sandbox.commands.run(`cd ${WORKSPACE_DIR} && git fetch origin`, {
		timeoutMs: 120000,
	});

	// Check if spec branch exists
	const branchExistsResult = await sandbox.commands.run(
		`cd ${WORKSPACE_DIR} && git ls-remote --heads origin "${branchName}" | wc -l`,
		{ timeoutMs: 30000 }
	);
	const branchExists = branchExistsResult.stdout.trim() === "1";

	if (branchExists) {
		console.log(`   Checking out existing branch: ${branchName}`);
		await sandbox.commands.run(
			`cd ${WORKSPACE_DIR} && git checkout "${branchName}" && git pull origin "${branchName}"`,
			{ timeoutMs: 60000 }
		);
	} else {
		console.log(`   Creating new branch from dev: ${branchName}`);
		await sandbox.commands.run(
			`cd ${WORKSPACE_DIR} && git checkout dev && git pull origin dev && git checkout -b "${branchName}"`,
			{ timeoutMs: 60000 }
		);
	}

	// Verify dependencies
	const checkResult = await sandbox.commands.run(
		`cd ${WORKSPACE_DIR} && test -d node_modules && echo "exists" || echo "missing"`,
		{ timeoutMs: 10000 }
	);

	if (checkResult.stdout.trim() === "missing") {
		console.log(`   Installing dependencies...`);
		await sandbox.commands.run(
			`cd ${WORKSPACE_DIR} && pnpm install --frozen-lockfile`,
			{ timeoutMs: 600000 }
		);
	}

	// Update manifest
	if (!manifest.sandbox.sandbox_ids.includes(sandbox.sandboxId)) {
		manifest.sandbox.sandbox_ids.push(sandbox.sandboxId);
	}
	manifest.sandbox.branch_name = branchName;
	manifest.sandbox.created_at = manifest.sandbox.created_at || new Date().toISOString();

	return {
		sandbox,
		id: sandbox.sandboxId,
		label,
		status: "ready",
		currentFeature: null,
	};
}

// ============================================================================
// Feature Implementation
// ============================================================================

async function runFeatureImplementation(
	instance: SandboxInstance,
	manifest: SpecManifest,
	feature: FeatureEntry
): Promise<{ success: boolean; tasksCompleted: number; error?: string }> {
	console.log(`\n   ┌── [${instance.label}] Feature #${feature.id}: ${feature.title}`);
	console.log(`   │   Tasks: ${feature.task_count}`);

	// Mark feature as in_progress
	feature.status = "in_progress";
	feature.assigned_sandbox = instance.label;
	instance.currentFeature = feature.id;
	instance.status = "busy";
	saveManifest(manifest);

	// CRITICAL: Pull latest code before starting feature
	// This ensures we have code from features implemented by OTHER sandboxes
	// Without this, features with dependencies would fail (missing imports, types, etc.)
	console.log(`   │   Pulling latest code...`);
	try {
		await instance.sandbox.commands.run(
			`cd ${WORKSPACE_DIR} && git pull origin "${manifest.sandbox.branch_name}" --rebase`,
			{ timeoutMs: 60000 }
		);
		console.log(`   │   ✓ Code synced`);
	} catch (pullError) {
		console.log(`   │   ⚠ Pull failed (continuing anyway): ${pullError}`);
	}

	const prompt = `/alpha:implement ${feature.id}`;
	console.log(`   │   Running: ${prompt}`);

	let capturedStdout = "";
	let capturedStderr = "";

	try {
		const result = await instance.sandbox.commands.run(
			`stdbuf -oL -eL run-claude "${prompt.replace(/"/g, '\\"')}"`,
			{
				timeoutMs: 1800000, // 30 min per feature
				envs: getAllEnvVars(),
				onStdout: (data) => {
					capturedStdout += data;
					const lines = data.split("\n");
					for (const line of lines) {
						if (line.trim()) {
							process.stdout.write(`   │   ${line}\n`);
						}
					}
				},
				onStderr: (data) => {
					capturedStderr += data;
				},
			}
		);

		// Read progress file
		const progressResult = await instance.sandbox.commands.run(
			`cat ${WORKSPACE_DIR}/${PROGRESS_FILE} 2>/dev/null || echo '{}'`,
			{ timeoutMs: 10000 }
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

		// Update feature
		feature.status = status;
		feature.tasks_completed = tasksCompleted;
		feature.assigned_sandbox = undefined;
		instance.currentFeature = null;
		instance.status = "ready";

		// Update progress
		if (status === "completed") {
			manifest.progress.features_completed++;
			manifest.progress.last_completed_feature_id = feature.id;

			// Update initiative status
			const initiative = manifest.initiatives.find((i) => i.id === feature.initiative_id);
			if (initiative) {
				initiative.features_completed++;
				const initFeatures = manifest.feature_queue.filter(
					(f) => f.initiative_id === initiative.id
				);
				if (initFeatures.every((f) => f.status === "completed")) {
					initiative.status = "completed";
					manifest.progress.initiatives_completed++;
				} else {
					initiative.status = "in_progress";
				}
			}

			// CRITICAL: Push after completing feature so other sandboxes can pull this code
			// This enables the pull-before-feature pattern to work correctly
			try {
				await instance.sandbox.commands.run(
					`cd ${WORKSPACE_DIR} && git push origin "${manifest.sandbox.branch_name}"`,
					{ timeoutMs: 120000 }
				);
			} catch (pushError) {
				console.log(`   │   ⚠ Push failed: ${pushError}`);
			}
		}

		manifest.progress.tasks_completed += tasksCompleted;
		updateNextFeatureId(manifest);
		saveManifest(manifest);

		const icon = status === "completed" ? "✅" : status === "blocked" ? "🚫" : "❌";
		console.log(`   └── ${icon} ${status} (${tasksCompleted}/${feature.task_count} tasks)`);

		return {
			success: status === "completed",
			tasksCompleted,
			error: status !== "completed" ? `Feature ${status}` : undefined,
		};
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);

		feature.status = "failed";
		feature.error = errorMessage;
		feature.assigned_sandbox = undefined;
		instance.currentFeature = null;
		instance.status = "ready";
		updateNextFeatureId(manifest);
		saveManifest(manifest);

		console.log(`   └── ❌ Error: ${errorMessage}`);

		return {
			success: false,
			tasksCompleted: 0,
			error: errorMessage,
		};
	}
}

// ============================================================================
// Main Orchestration
// ============================================================================

async function orchestrate(options: OrchestratorOptions): Promise<void> {
	if (!options.dryRun) {
		checkEnvironment();
	}

	const projectRoot = findProjectRoot();
	const specDir = findSpecDir(projectRoot, options.specId);

	if (!specDir) {
		console.error(`Spec #${options.specId} not found`);
		process.exit(1);
	}

	const manifest = loadManifest(specDir);

	if (!manifest) {
		console.error("Spec manifest not found. Run generate-spec-manifest.ts first.");
		process.exit(1);
	}

	// Print header
	console.log("═".repeat(70));
	console.log(`   ALPHA SPEC ORCHESTRATOR`);
	console.log("═".repeat(70));
	console.log(`\n📊 Spec #${manifest.metadata.spec_id}: ${manifest.metadata.spec_name}`);
	console.log(`   Initiatives: ${manifest.initiatives.length}`);
	console.log(`   Features: ${manifest.progress.features_total}`);
	console.log(`   Tasks: ${manifest.progress.tasks_total}`);
	console.log(`   Progress: ${manifest.progress.features_completed}/${manifest.progress.features_total} features`);
	console.log(`   Sandboxes: ${options.sandboxCount}`);

	// Check what's next
	const nextFeature = getNextAvailableFeature(manifest);
	if (nextFeature) {
		console.log(`\n🎯 Next feature: #${nextFeature.id} - ${nextFeature.title}`);
	} else if (manifest.progress.features_completed === manifest.progress.features_total) {
		console.log("\n🎉 All features already completed!");
		return;
	} else {
		console.log("\n⚠️ No features available (check dependencies)");
		return;
	}

	// Handle dry-run
	if (options.dryRun) {
		printDryRun(manifest);
		return;
	}

	// Create sandboxes
	const instances: SandboxInstance[] = [];
	const STAGGER_DELAY_MS = 90000;

	for (let i = 0; i < options.sandboxCount; i++) {
		const label = `sbx-${String.fromCharCode(97 + i)}`;

		if (i > 0) {
			console.log(`\n   ⏳ Waiting ${STAGGER_DELAY_MS / 1000}s before next sandbox...`);
			await sleep(STAGGER_DELAY_MS);
		}

		const instance = await createSandbox(manifest, label, options.timeout);
		instances.push(instance);
	}

	saveManifest(manifest);

	// Print sandbox info
	console.log("\n" + "═".repeat(70));
	console.log("   SANDBOXES READY");
	console.log("═".repeat(70));
	for (const instance of instances) {
		console.log(`   ${instance.label}: ${instance.id}`);
	}
	console.log(`   Branch: ${manifest.sandbox.branch_name}`);

	// Start implementation
	console.log("\n" + "═".repeat(70));
	console.log("   IMPLEMENTATION");
	console.log("═".repeat(70));

	manifest.progress.status = "in_progress";
	manifest.progress.started_at = manifest.progress.started_at || new Date().toISOString();
	saveManifest(manifest);

	// Main work loop
	await runWorkLoop(instances, manifest);

	// Push final changes
	if (GITHUB_TOKEN && instances.length > 0) {
		console.log("\n📤 Pushing final changes...");
		try {
			await instances[0].sandbox.commands.run(
				`cd ${WORKSPACE_DIR} && git push -u origin "${manifest.sandbox.branch_name}"`,
				{ timeoutMs: 120000 }
			);
			console.log(`   ✅ Pushed to ${manifest.sandbox.branch_name}`);
		} catch (error) {
			console.log(`   ⚠️ Push failed: ${error}`);
		}
	}

	// Final status
	const failedFeatures = manifest.feature_queue.filter((f) => f.status === "failed").length;
	manifest.progress.status = failedFeatures === 0 ? "completed" : "partial";
	manifest.progress.completed_at = new Date().toISOString();
	saveManifest(manifest);

	// Prepare one sandbox for complete review
	// With multiple sandboxes, each only has partial code. We need to:
	// 1. Have one sandbox pull the final branch (gets all changes)
	// 2. Start dev server on that sandbox
	// 3. Kill the other sandboxes (they have partial code anyway)

	console.log("\n🔄 Preparing sandbox for complete review...");
	const reviewInstance = instances[0]; // Use first sandbox for review
	const otherInstances = instances.slice(1);

	// Pull latest to get all changes from all sandboxes
	try {
		console.log(`   ${reviewInstance.label}: Pulling latest changes...`);
		await reviewInstance.sandbox.commands.run(
			`cd ${WORKSPACE_DIR} && git pull origin "${manifest.sandbox.branch_name}"`,
			{ timeoutMs: 60000 }
		);
		console.log(`   ${reviewInstance.label}: ✅ Has complete code`);
	} catch (error) {
		console.log(`   ${reviewInstance.label}: ⚠️ Pull failed: ${error}`);
	}

	// Kill other sandboxes (they only have partial code)
	for (const instance of otherInstances) {
		try {
			console.log(`   ${instance.label}: Stopping (partial code only)...`);
			await instance.sandbox.kill();
		} catch {
			// Ignore
		}
	}

	// Start dev server on the review sandbox
	console.log("\n🚀 Starting dev server for review...");
	const reviewUrls: Array<{ label: string; vscode: string; devServer: string }> = [];

	try {
		const devServerUrl = await startDevServer(reviewInstance.sandbox);
		const vscodeUrl = getVSCodeUrl(reviewInstance.sandbox);
		reviewUrls.push({
			label: reviewInstance.label,
			vscode: vscodeUrl,
			devServer: devServerUrl,
		});
		console.log(`   ${reviewInstance.label}: Dev server starting...`);

		// Wait for dev server to be ready
		console.log("   Waiting for dev server to start (30s)...");
		await sleep(30000);
	} catch (error) {
		console.log(`   Failed to start dev server: ${error}`);
	}

	// Print summary with review URL (single sandbox with complete code)
	printSummary(manifest, [reviewInstance], reviewUrls);

	// NOTE: Sandboxes are intentionally NOT killed here.
	// User should manually kill them after reviewing with:
	//   npx e2b sandbox kill <sandbox-id>

	if (failedFeatures > 0) {
		process.exit(1);
	}
}

/**
 * Main work loop - sandboxes pull features from queue until done.
 */
async function runWorkLoop(
	instances: SandboxInstance[],
	manifest: SpecManifest
): Promise<void> {
	// Track active work
	const activeWork = new Map<string, Promise<void>>();

	while (true) {
		// Check if we're done
		const pendingFeatures = manifest.feature_queue.filter(
			(f) => f.status === "pending" || f.status === "in_progress"
		);

		if (pendingFeatures.length === 0) {
			// Wait for any in-flight work
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
				// No work available - might be waiting for dependencies
				continue;
			}

			// Start work on this sandbox
			const workPromise = (async () => {
				await runFeatureImplementation(instance, manifest, feature);
				activeWork.delete(instance.label);
			})();

			activeWork.set(instance.label, workPromise);
		}

		// If no work is active and no features available, we might be stuck
		if (activeWork.size === 0) {
			const blockedFeatures = manifest.feature_queue.filter(
				(f) => f.status === "pending" && f.dependencies.length > 0
			);

			if (blockedFeatures.length > 0) {
				console.log("\n⚠️ Features blocked by incomplete dependencies:");
				for (const f of blockedFeatures.slice(0, 5)) {
					console.log(`   #${f.id}: blocked by ${f.dependencies.map((d) => `#${d}`).join(", ")}`);
				}
			}
			break;
		}

		// Wait for at least one sandbox to finish
		await Promise.race(activeWork.values());
	}
}

// ============================================================================
// Dev Server & Review URLs
// ============================================================================

const VSCODE_PORT = 8080;
const DEV_SERVER_PORT = 3000;

async function startDevServer(sandbox: Sandbox): Promise<string> {
	// Start the dev server
	sandbox.commands
		.run("nohup start-dev > /tmp/devserver.log 2>&1 &", { timeoutMs: 5000 })
		.catch(() => {
			/* fire and forget */
		});

	const devServerHost = sandbox.getHost(DEV_SERVER_PORT);
	return `https://${devServerHost}`;
}

function getVSCodeUrl(sandbox: Sandbox): string {
	const vscodeHost = sandbox.getHost(VSCODE_PORT);
	return `https://${vscodeHost}`;
}

// ============================================================================
// Output
// ============================================================================

function printDryRun(manifest: SpecManifest): void {
	console.log("\n🔍 DRY RUN - Execution Plan:\n");

	const completedIds = new Set(
		manifest.feature_queue.filter((f) => f.status === "completed").map((f) => f.id)
	);
	const completedInitIds = new Set(
		manifest.initiatives.filter((i) => i.status === "completed").map((i) => i.id)
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
			(d) => completedIds.has(d) || completedInitIds.has(d)
		);
		const blockedStr =
			feature.dependencies.length > 0 && !depsComplete
				? ` [BLOCKED by: ${feature.dependencies.filter((d) => !completedIds.has(d) && !completedInitIds.has(d)).map((d) => `#${d}`).join(", ")}]`
				: "";

		console.log(
			`   ${statusIcon} #${feature.id}: ${feature.title} (${feature.task_count} tasks)${blockedStr}`
		);
	}

	// Estimate
	const pendingFeatures = manifest.feature_queue.filter((f) => f.status === "pending");
	const totalHours = pendingFeatures.reduce((sum, f) => sum + f.parallel_hours, 0);

	console.log(`\n📊 Remaining Work:`);
	console.log(`   Features: ${pendingFeatures.length}`);
	console.log(`   Estimated Hours: ${totalHours}`);
}

function printSummary(
	manifest: SpecManifest,
	instances: SandboxInstance[],
	reviewUrls: Array<{ label: string; vscode: string; devServer: string }>
): void {
	const completed = manifest.feature_queue.filter((f) => f.status === "completed").length;
	const failed = manifest.feature_queue.filter((f) => f.status === "failed").length;

	console.log("\n" + "═".repeat(70));
	console.log("   SUMMARY");
	console.log("═".repeat(70));

	console.log("\n📊 Results:");
	console.log(`   Initiatives: ${manifest.progress.initiatives_completed}/${manifest.progress.initiatives_total}`);
	console.log(`   Features: ${completed}/${manifest.progress.features_total}`);
	console.log(`   Failed: ${failed}`);
	console.log(`   Tasks: ${manifest.progress.tasks_completed}/${manifest.progress.tasks_total}`);

	console.log(`\n🌿 Branch: ${manifest.sandbox.branch_name}`);

	if (manifest.progress.started_at) {
		const duration = Math.round(
			(Date.now() - new Date(manifest.progress.started_at).getTime()) / 60000
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
		console.log(`   npx e2b sandbox kill ${instances.map((i) => i.id).join(" ")}`);
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
// Utilities
// ============================================================================

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// CLI
// ============================================================================

function parseArgs(): OrchestratorOptions {
	const args = process.argv.slice(2);
	const options: OrchestratorOptions = {
		specId: 0,
		sandboxCount: 2,
		timeout: 3600,
		dryRun: false,
	};

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];

		if ((arg === "--sandboxes" || arg === "-s") && args[i + 1]) {
			options.sandboxCount = Math.min(parseInt(args[i + 1], 10), 2);
			i++;
		} else if (arg === "--timeout" && args[i + 1]) {
			options.timeout = parseInt(args[i + 1], 10);
			i++;
		} else if (arg === "--dry-run") {
			options.dryRun = true;
		} else if (!arg.startsWith("--") && !arg.startsWith("-") && !options.specId) {
			options.specId = parseInt(arg, 10);
		}
	}

	return options;
}

function showHelp(): void {
	console.log(`
Alpha Spec Orchestrator

Usage:
  tsx spec-orchestrator.ts <spec-id> [options]

Options:
  --sandboxes <n>, -s   Number of sandboxes (default: 2, max: 2)
  --timeout <s>         Sandbox timeout in seconds (default: 3600)
  --dry-run             Show execution plan without running

Features:
  - Takes Spec ID (not Initiative ID)
  - Work queue: sandboxes dynamically pull next available feature
  - Dependency-aware: respects feature and initiative dependencies
  - Auto-resume: continues from where it left off

Examples:
  tsx spec-orchestrator.ts 1362              # Run with 2 sandboxes
  tsx spec-orchestrator.ts 1362 --dry-run    # Preview execution plan
  tsx spec-orchestrator.ts 1362 -s 1         # Single sandbox mode

Prerequisites:
  1. Complete task decomposition for all features
  2. Generate spec manifest:
     tsx generate-spec-manifest.ts <spec-id>
`);
}

// Main
async function main(): Promise<void> {
	const options = parseArgs();

	if (!options.specId) {
		showHelp();
		process.exit(1);
	}

	await orchestrate(options);
}

main().catch((error) => {
	console.error("\n❌ Orchestrator error:", error);
	process.exit(1);
});
