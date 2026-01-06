#!/usr/bin/env tsx

/**
 * Alpha Initiative Orchestrator
 *
 * Manages E2B sandboxes and Claude Code sessions to implement all tasks
 * across all features in an initiative using the Claude Agent SDK.
 *
 * Usage:
 *   tsx alpha-orchestrator.ts <initiative-id> [options]
 *
 * Options:
 *   --parallel <n>    Max parallel features (default: 2)
 *   --resume          Resume from previous state
 *   --timeout <s>     Sandbox timeout in seconds (default: 7200 = 2 hours)
 *   --dry-run         Show plan without executing
 *
 * Examples:
 *   tsx alpha-orchestrator.ts 1363
 *   tsx alpha-orchestrator.ts 1363 --parallel 3 --resume
 *
 * Requirements:
 *   - E2B_API_KEY environment variable
 *   - ANTHROPIC_API_KEY or CLAUDE_CODE_OAUTH_TOKEN
 *   - GITHUB_TOKEN for git operations
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { Sandbox } from "@e2b/code-interpreter";

// Template constants - canonical values for SlideHeroes E2B template
// Available templates: slideheroes-claude-agent (4 vCPU, 4GB), slideheroes-claude-agent-dev (4 vCPU, 4GB)
const TEMPLATE_ALIAS = "slideheroes-claude-agent-dev";
const WORKSPACE_DIR = "/home/user/project";

// ============================================================================
// Types
// ============================================================================

interface FeatureEntry {
	id: number;
	title: string;
	slug?: string;
	priority: number;
	status:
		| "pending"
		| "in_progress"
		| "completed"
		| "failed"
		| "blocked"
		| "partial";
	tasks_file: string;
	feature_dir: string;
	task_count: number;
	tasks_completed: number;
	sequential_hours: number;
	parallel_hours: number;
	dependencies: number[];
	github_issue: number | null;
	error?: string;
}

interface InitiativeManifest {
	metadata: {
		initiative_id: number;
		spec_id: number;
		initiative_name: string;
		generated_at: string;
		spec_dir: string;
		init_dir: string;
		research_dir: string;
	};
	features: FeatureEntry[];
	execution_plan: {
		parallel_groups: Array<{
			group: number;
			feature_ids: number[];
			description: string;
		}>;
		total_tasks: number;
		total_features: number;
		duration: {
			sequential_hours: number;
			parallel_hours: number;
			time_saved_percent: number;
		};
	};
	progress: {
		status: "pending" | "in_progress" | "completed" | "failed" | "partial";
		features_completed: number;
		features_total: number;
		tasks_completed: number;
		tasks_total: number;
		current_feature: number | null;
		current_group: number;
		started_at: string | null;
		completed_at: string | null;
		last_checkpoint: string | null;
	};
	sandbox: {
		sandbox_id: string | null;
		branch_name: string | null;
		vscode_url: string | null;
		dev_server_url: string | null;
		created_at: string | null;
	};
}

interface OrchestratorOptions {
	initiativeId: number;
	maxParallel: number;
	resume: boolean;
	timeout: number;
	dryRun: boolean;
}

interface ProgressReport {
	feature_id: number;
	status: string;
	tasks_completed: number;
	tasks_total: number;
	context_usage_percent: number;
	error?: string;
}

// ============================================================================
// Environment & Configuration
// ============================================================================

const E2B_API_KEY = process.env.E2B_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const VSCODE_PORT = 8080;
const DEV_SERVER_PORT = 3000;
const PROGRESS_FILE = ".initiative-progress.json";

/**
 * Read OAuth token from Claude Code credentials file.
 * Falls back to environment variable if file doesn't exist.
 */
function getClaudeOAuthToken(): string | undefined {
	// First check environment variable
	if (process.env.CLAUDE_CODE_OAUTH_TOKEN) {
		return process.env.CLAUDE_CODE_OAUTH_TOKEN;
	}

	// Try to read from Claude Code credentials file
	const homeDir = process.env.HOME || process.env.USERPROFILE;
	if (!homeDir) return undefined;

	const credentialsPath = path.join(homeDir, ".claude", ".credentials.json");

	try {
		if (fs.existsSync(credentialsPath)) {
			const content = fs.readFileSync(credentialsPath, "utf-8");
			const credentials = JSON.parse(content);
			const token = credentials?.claudeAiOauth?.accessToken;
			if (token) {
				console.log("   ✓ Loaded OAuth token from ~/.claude/.credentials.json");
				return token;
			}
		}
	} catch (error) {
		// Silently fail - will be caught by checkEnvironment
	}

	return undefined;
}

// Lazy-loaded OAuth token
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
		console.error("Get your API key from: https://e2b.dev/dashboard");
		process.exit(1);
	}

	const oauthToken = getCachedOAuthToken();
	if (!ANTHROPIC_API_KEY && !oauthToken) {
		console.error("ERROR: No Claude authentication found");
		console.error("Options:");
		console.error(
			"  1. Log in to Claude Code (oauth token auto-detected from ~/.claude/.credentials.json)",
		);
		console.error("  2. Set CLAUDE_CODE_OAUTH_TOKEN environment variable");
		console.error("  3. Set ANTHROPIC_API_KEY environment variable");
		process.exit(1);
	}

	if (!GITHUB_TOKEN) {
		console.warn("WARNING: GITHUB_TOKEN not set - git push will not work");
	}
}

function getClaudeEnvVars(): Record<string, string> {
	const oauthToken = getCachedOAuthToken();
	if (oauthToken) {
		return { CLAUDE_CODE_OAUTH_TOKEN: oauthToken };
	}
	if (ANTHROPIC_API_KEY) {
		return { ANTHROPIC_API_KEY };
	}
	return {};
}

function getAllEnvVars(): Record<string, string> {
	const envs: Record<string, string> = {
		...getClaudeEnvVars(),
	};
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

function findInitiativeDir(
	projectRoot: string,
	initiativeId: number,
): string | null {
	const specsDir = path.join(projectRoot, ".ai", "alpha", "specs");

	if (!fs.existsSync(specsDir)) {
		return null;
	}

	const specDirs = fs.readdirSync(specsDir);

	for (const specDir of specDirs) {
		const specPath = path.join(specsDir, specDir);
		if (!fs.statSync(specPath).isDirectory()) continue;

		const contents = fs.readdirSync(specPath);
		for (const item of contents) {
			const match = item.match(/^(\d+)-Initiative-/);
			if (match && parseInt(match[1], 10) === initiativeId) {
				return path.join(specPath, item);
			}
		}
	}

	return null;
}

function loadManifest(initDir: string): InitiativeManifest | null {
	const manifestPath = path.join(initDir, "initiative-manifest.json");

	if (!fs.existsSync(manifestPath)) {
		return null;
	}

	try {
		const content = fs.readFileSync(manifestPath, "utf-8");
		return JSON.parse(content) as InitiativeManifest;
	} catch (error) {
		console.error(`Failed to load manifest: ${error}`);
		return null;
	}
}

function saveManifest(manifest: InitiativeManifest): void {
	const manifestPath = path.join(
		manifest.metadata.init_dir,
		"initiative-manifest.json",
	);
	manifest.progress.last_checkpoint = new Date().toISOString();
	fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, "\t"));
}

// ============================================================================
// Sandbox Management
// ============================================================================

async function createSandbox(
	manifest: InitiativeManifest,
	timeout: number,
): Promise<Sandbox> {
	console.log(`\n📦 Creating E2B sandbox (timeout: ${timeout}s)...`);

	const sandbox = await Sandbox.create(TEMPLATE_ALIAS, {
		timeoutMs: timeout * 1000,
		apiKey: E2B_API_KEY,
		envs: getAllEnvVars(),
	});

	console.log(`   Sandbox ID: ${sandbox.sandboxId}`);

	// Setup git credentials
	if (GITHUB_TOKEN) {
		console.log("   Configuring git credentials...");
		await setupGitCredentials(sandbox);
	}

	// Pull latest code from origin
	const branchName = `alpha/initiative-${manifest.metadata.initiative_id}`;
	console.log("   Pulling latest code from origin...");

	const pullResult = await sandbox.commands.run(
		`cd ${WORKSPACE_DIR} && git fetch origin && git checkout dev && git pull origin dev`,
		{ timeoutMs: 120000 },
	);

	// Show what was pulled
	const logResult = await sandbox.commands.run(
		`cd ${WORKSPACE_DIR} && git log --oneline -3`,
		{ timeoutMs: 10000 },
	);
	console.log(
		`   Latest commits:\n${logResult.stdout
			.split("\n")
			.map((l) => `      ${l}`)
			.join("\n")}`,
	);

	// Skip pnpm install - template has pre-installed dependencies
	// Only verify node_modules exists
	console.log("   Verifying dependencies...");
	const checkResult = await sandbox.commands.run(
		`cd ${WORKSPACE_DIR} && test -d node_modules && echo "exists" || echo "missing"`,
		{ timeoutMs: 10000 },
	);

	if (checkResult.stdout.trim() === "missing") {
		console.warn(
			"   ⚠️ WARNING: node_modules missing - template may need rebuilding",
		);
		console.log("   Attempting to install dependencies...");
		await sandbox.commands.run(
			`cd ${WORKSPACE_DIR} && pnpm install --frozen-lockfile`,
			{ timeoutMs: 600000 },
		);
	} else {
		console.log("   ✓ Dependencies pre-installed in template");
	}

	// Create feature branch
	console.log(`   Creating branch: ${branchName}`);
	await sandbox.commands.run(
		`cd ${WORKSPACE_DIR} && git checkout -b "${branchName}"`,
		{ timeoutMs: 30000 },
	);

	// Update manifest with sandbox info
	manifest.sandbox.sandbox_id = sandbox.sandboxId;
	manifest.sandbox.branch_name = branchName;
	manifest.sandbox.created_at = new Date().toISOString();

	return sandbox;
}

async function resumeSandbox(
	manifest: InitiativeManifest,
): Promise<Sandbox | null> {
	const sandboxId = manifest.sandbox.sandbox_id;

	if (!sandboxId) {
		return null;
	}

	console.log(`\n📦 Attempting to resume sandbox: ${sandboxId}`);

	try {
		const sandbox = await Sandbox.connect(sandboxId, {
			apiKey: E2B_API_KEY,
		});

		const isRunning = await sandbox.isRunning();
		if (isRunning) {
			console.log("   ✅ Sandbox is still running");
			return sandbox;
		} else {
			console.log("   ⚠️ Sandbox is no longer running");
			return null;
		}
	} catch (error) {
		console.log(`   ⚠️ Could not connect: ${error}`);
		return null;
	}
}

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

	// Setup gh CLI
	try {
		await sandbox.commands.run(
			`echo "${GITHUB_TOKEN}" | gh auth login --with-token`,
			{ timeoutMs: 30000 },
		);
	} catch {
		// Non-fatal
	}
}

async function startServices(sandbox: Sandbox): Promise<{
	vscodeUrl: string;
	devServerUrl: string;
}> {
	console.log("\n🚀 Starting services...");

	// Start VS Code Web (fire and forget - don't wait for completion)
	console.log("   Starting VS Code Web...");
	sandbox.commands
		.run("nohup start-vscode > /tmp/vscode.log 2>&1 &", { timeoutMs: 5000 })
		.catch(() => {
			/* fire and forget */
		});
	await new Promise((resolve) => setTimeout(resolve, 5000));

	const vscodeHost = sandbox.getHost(VSCODE_PORT);
	const vscodeUrl = `https://${vscodeHost}`;

	// Start dev server (fire and forget - don't wait for completion)
	console.log("   Starting dev server...");
	sandbox.commands
		.run("nohup start-dev > /tmp/devserver.log 2>&1 &", { timeoutMs: 5000 })
		.catch(() => {
			/* fire and forget */
		});
	await new Promise((resolve) => setTimeout(resolve, 10000));

	const devServerHost = sandbox.getHost(DEV_SERVER_PORT);
	const devServerUrl = `https://${devServerHost}`;

	return { vscodeUrl, devServerUrl };
}

// ============================================================================
// Feature Implementation
// ============================================================================

async function runFeatureImplementation(
	sandbox: Sandbox,
	manifest: InitiativeManifest,
	featureId: number,
): Promise<ProgressReport> {
	const feature = manifest.features.find((f) => f.id === featureId);

	if (!feature) {
		return {
			feature_id: featureId,
			status: "failed",
			tasks_completed: 0,
			tasks_total: 0,
			context_usage_percent: 0,
			error: "Feature not found in manifest",
		};
	}

	console.log(`\n📋 Implementing Feature #${featureId}: ${feature.title}`);
	console.log(`   Tasks: ${feature.task_count}`);
	console.log(`   Estimated hours: ${feature.parallel_hours}`);

	// Update feature status
	feature.status = "in_progress";
	manifest.progress.current_feature = featureId;
	saveManifest(manifest);

	// Run Claude Code with /alpha:implement command
	const prompt = `/alpha:implement ${featureId}`;

	console.log(`   Running: ${prompt}`);
	console.log("   " + "─".repeat(60));

	try {
		const result = await sandbox.commands.run(
			`run-claude "${prompt.replace(/"/g, '\\"')}"`,
			{
				timeoutMs: 0, // No timeout for long-running tasks
				envs: getAllEnvVars(),
				onStdout: (data) => {
					// Stream output with prefix
					const lines = data.split("\n");
					for (const line of lines) {
						if (line.trim()) {
							process.stdout.write(`   │ ${line}\n`);
						}
					}
				},
				onStderr: (data) => {
					process.stderr.write(`   │ [ERR] ${data}`);
				},
			},
		);

		console.log("   " + "─".repeat(60));
		console.log(`   Exit code: ${result.exitCode}`);

		// Read progress file from sandbox
		const progressResult = await sandbox.commands.run(
			`cat ${WORKSPACE_DIR}/${PROGRESS_FILE} 2>/dev/null || echo '{}'`,
			{ timeoutMs: 10000 },
		);

		let progress: Partial<ProgressReport> = {};
		try {
			const parsed = JSON.parse(progressResult.stdout || "{}");
			progress = {
				tasks_completed: parsed.completed_tasks?.length || 0,
				tasks_total: feature.task_count,
				context_usage_percent: parsed.context_usage_percent || 0,
				status:
					parsed.status || (result.exitCode === 0 ? "completed" : "failed"),
			};
		} catch {
			progress = {
				tasks_completed: 0,
				tasks_total: feature.task_count,
				context_usage_percent: 0,
				status: result.exitCode === 0 ? "completed" : "failed",
			};
		}

		// Determine final status
		let status: FeatureEntry["status"];
		if (progress.status === "completed" || result.exitCode === 0) {
			status = "completed";
		} else if (progress.status === "context_limit") {
			status = "partial";
		} else if (progress.status === "blocked") {
			status = "blocked";
		} else {
			status = "failed";
		}

		// Update feature
		feature.status = status;
		feature.tasks_completed = progress.tasks_completed || 0;

		if (status === "completed") {
			manifest.progress.features_completed++;
		}

		manifest.progress.tasks_completed += progress.tasks_completed || 0;
		saveManifest(manifest);

		return {
			feature_id: featureId,
			status,
			tasks_completed: progress.tasks_completed || 0,
			tasks_total: feature.task_count,
			context_usage_percent: progress.context_usage_percent || 0,
		};
	} catch (error) {
		feature.status = "failed";
		feature.error = error instanceof Error ? error.message : String(error);
		saveManifest(manifest);

		return {
			feature_id: featureId,
			status: "failed",
			tasks_completed: 0,
			tasks_total: feature.task_count,
			context_usage_percent: 0,
			error: feature.error,
		};
	}
}

async function handlePartialFeature(
	sandbox: Sandbox,
	manifest: InitiativeManifest,
	featureId: number,
): Promise<ProgressReport> {
	// Feature hit context limit - restart implementation
	console.log(`\n🔄 Resuming partial feature #${featureId}...`);
	return runFeatureImplementation(sandbox, manifest, featureId);
}

// ============================================================================
// Main Orchestration
// ============================================================================

async function orchestrate(options: OrchestratorOptions): Promise<void> {
	// Skip environment check for dry-run (no sandbox needed)
	if (!options.dryRun) {
		checkEnvironment();
	}

	const projectRoot = findProjectRoot();
	const initDir = findInitiativeDir(projectRoot, options.initiativeId);

	if (!initDir) {
		console.error(`Initiative #${options.initiativeId} not found`);
		console.error("Run generate-initiative-manifest.ts first");
		process.exit(1);
	}

	// Load manifest
	const manifest = loadManifest(initDir);

	if (!manifest) {
		console.error("Initiative manifest not found");
		console.error(
			"Run: tsx generate-initiative-manifest.ts " + options.initiativeId,
		);
		process.exit(1);
	}

	// Print header
	console.log("═".repeat(70));
	console.log("   ALPHA INITIATIVE ORCHESTRATOR");
	console.log("═".repeat(70));
	console.log(
		`\n📊 Initiative #${manifest.metadata.initiative_id}: ${manifest.metadata.initiative_name}`,
	);
	console.log(`   Spec: #${manifest.metadata.spec_id}`);
	console.log(`   Features: ${manifest.execution_plan.total_features}`);
	console.log(`   Tasks: ${manifest.execution_plan.total_tasks}`);
	console.log(
		`   Estimated Hours: ${manifest.execution_plan.duration.parallel_hours} (parallel)`,
	);

	if (options.dryRun) {
		console.log("\n🔍 DRY RUN - showing execution plan:");
		for (const group of manifest.execution_plan.parallel_groups) {
			console.log(`\n   Group ${group.group}: ${group.description}`);
			for (const featureId of group.feature_ids) {
				const feature = manifest.features.find((f) => f.id === featureId);
				if (feature) {
					console.log(
						`      #${feature.id}: ${feature.title} (${feature.task_count} tasks)`,
					);
				}
			}
		}
		return;
	}

	// Resume or create sandbox
	let sandbox: Sandbox | null = null;

	if (options.resume) {
		sandbox = await resumeSandbox(manifest);
	}

	if (!sandbox) {
		sandbox = await createSandbox(manifest, options.timeout);
	}

	// Start services and get URLs
	const { vscodeUrl, devServerUrl } = await startServices(sandbox);
	manifest.sandbox.vscode_url = vscodeUrl;
	manifest.sandbox.dev_server_url = devServerUrl;
	saveManifest(manifest);

	// Print review URLs
	console.log("\n" + "═".repeat(70));
	console.log("   REVIEW URLS");
	console.log("═".repeat(70));
	console.log("\n   📝 VS Code Web (view/edit code):");
	console.log(`      ${vscodeUrl}`);
	console.log("\n   🌐 Dev Server (test application):");
	console.log(`      ${devServerUrl}`);
	console.log(`\n   📦 Sandbox ID: ${sandbox.sandboxId}`);
	console.log(`   🌿 Branch: ${manifest.sandbox.branch_name}`);

	// Start implementation
	console.log("\n" + "═".repeat(70));
	console.log("   IMPLEMENTATION");
	console.log("═".repeat(70));

	manifest.progress.status = "in_progress";
	manifest.progress.started_at =
		manifest.progress.started_at || new Date().toISOString();
	saveManifest(manifest);

	// Execute parallel groups
	for (const group of manifest.execution_plan.parallel_groups) {
		if (group.group < manifest.progress.current_group) {
			console.log(`\n⏭️ Skipping completed group ${group.group}`);
			continue;
		}

		console.log(`\n📦 Executing Group ${group.group}: ${group.description}`);

		// Get features that need implementation
		const pendingFeatures = group.feature_ids.filter((id) => {
			const feature = manifest.features.find((f) => f.id === id);
			return feature && feature.status !== "completed";
		});

		if (pendingFeatures.length === 0) {
			console.log("   All features in group already completed");
			continue;
		}

		// Execute features in batches
		const batches = chunk(pendingFeatures, options.maxParallel);

		for (const batch of batches) {
			console.log(`\n   🔄 Batch: ${batch.map((id) => `#${id}`).join(", ")}`);

			// Run features (sequentially for now - can be parallelized later)
			for (const featureId of batch) {
				let result = await runFeatureImplementation(
					sandbox,
					manifest,
					featureId,
				);

				// Handle partial completion (context limit)
				let retries = 0;
				while (result.status === "partial" && retries < 3) {
					console.log(
						`   ⚠️ Feature #${featureId} hit context limit, resuming...`,
					);
					result = await handlePartialFeature(sandbox, manifest, featureId);
					retries++;
				}

				// Log result
				const icon =
					result.status === "completed"
						? "✅"
						: result.status === "partial"
							? "⚠️"
							: result.status === "blocked"
								? "🚫"
								: "❌";
				console.log(
					`   ${icon} Feature #${featureId}: ${result.status} (${result.tasks_completed}/${result.tasks_total} tasks)`,
				);
			}
		}

		// Update current group
		manifest.progress.current_group = group.group + 1;
		saveManifest(manifest);
	}

	// Final validation
	console.log("\n" + "═".repeat(70));
	console.log("   FINAL VALIDATION");
	console.log("═".repeat(70));

	console.log("\n   Running code quality checks...");
	// Run checks directly to avoid wrapper script permission issues
	const validationResult = await sandbox.commands.run(
		`cd ${WORKSPACE_DIR} && pnpm typecheck && pnpm lint && pnpm format`,
		{ timeoutMs: 300000 },
	);

	if (validationResult.exitCode === 0) {
		console.log("   ✅ Code quality checks passed");
	} else {
		console.log("   ⚠️ Code quality issues found");
	}

	// Push changes
	if (GITHUB_TOKEN) {
		console.log("\n   Pushing changes to GitHub...");
		await sandbox.commands.run(
			`cd ${WORKSPACE_DIR} && git push -u origin "${manifest.sandbox.branch_name}"`,
			{ timeoutMs: 120000 },
		);
		console.log(`   ✅ Pushed to branch: ${manifest.sandbox.branch_name}`);
	}

	// Final summary
	const completedFeatures = manifest.features.filter(
		(f) => f.status === "completed",
	).length;
	const failedFeatures = manifest.features.filter(
		(f) => f.status === "failed",
	).length;

	manifest.progress.status = failedFeatures === 0 ? "completed" : "partial";
	manifest.progress.completed_at = new Date().toISOString();
	saveManifest(manifest);

	console.log("\n" + "═".repeat(70));
	console.log("   SUMMARY");
	console.log("═".repeat(70));
	console.log("\n   📊 Results:");
	console.log(
		`      Features: ${completedFeatures}/${manifest.execution_plan.total_features} completed`,
	);
	console.log(`      Failed: ${failedFeatures}`);
	console.log(
		`      Tasks: ${manifest.progress.tasks_completed}/${manifest.progress.tasks_total}`,
	);

	console.log("\n   🔗 Review URLs:");
	console.log(`      VS Code: ${vscodeUrl}`);
	console.log(`      Dev Server: ${devServerUrl}`);

	console.log("\n   📁 Files:");
	console.log(
		`      Manifest: ${path.join(initDir, "initiative-manifest.json")}`,
	);
	console.log(`      Branch: ${manifest.sandbox.branch_name}`);

	console.log("\n   ⏱️ Duration:");
	if (manifest.progress.started_at && manifest.progress.completed_at) {
		const startTime = new Date(manifest.progress.started_at).getTime();
		const endTime = new Date(manifest.progress.completed_at).getTime();
		const durationMs = endTime - startTime;
		const durationMin = Math.round(durationMs / 60000);
		console.log(`      ${durationMin} minutes`);
	}

	console.log("\n" + "═".repeat(70));

	if (failedFeatures > 0) {
		console.log("\n   ⚠️ Some features failed. Review and re-run with --resume");
		process.exit(1);
	}

	console.log("\n   ✅ Initiative implementation complete!");
}

// ============================================================================
// Utilities
// ============================================================================

function chunk<T>(array: T[], size: number): T[][] {
	const chunks: T[][] = [];
	for (let i = 0; i < array.length; i += size) {
		chunks.push(array.slice(i, i + size));
	}
	return chunks;
}

// ============================================================================
// CLI
// ============================================================================

function parseArgs(): OrchestratorOptions {
	const args = process.argv.slice(2);
	const options: OrchestratorOptions = {
		initiativeId: 0,
		maxParallel: 2,
		resume: false,
		timeout: 3600, // 1 hour (max for Hobby tier)
		dryRun: false,
	};

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];

		if (arg === "--parallel" && args[i + 1]) {
			options.maxParallel = parseInt(args[i + 1], 10);
			i++;
		} else if (arg === "--resume") {
			options.resume = true;
		} else if (arg === "--timeout" && args[i + 1]) {
			options.timeout = parseInt(args[i + 1], 10);
			i++;
		} else if (arg === "--dry-run") {
			options.dryRun = true;
		} else if (!arg.startsWith("--") && !options.initiativeId) {
			options.initiativeId = parseInt(arg, 10);
		}
	}

	return options;
}

function showHelp(): void {
	console.log(`
Alpha Initiative Orchestrator

Usage:
  tsx alpha-orchestrator.ts <initiative-id> [options]

Options:
  --parallel <n>    Max parallel features (default: 2)
  --resume          Resume from previous state
  --timeout <s>     Sandbox timeout in seconds (default: 7200)
  --dry-run         Show execution plan without running

Examples:
  tsx alpha-orchestrator.ts 1363
  tsx alpha-orchestrator.ts 1363 --parallel 3
  tsx alpha-orchestrator.ts 1363 --resume
  tsx alpha-orchestrator.ts 1363 --dry-run

Prerequisites:
  1. Run task decomposition:
     /alpha:task-decompose <initiative-id>

  2. Generate manifest:
     tsx generate-initiative-manifest.ts <initiative-id>

  3. Set environment variables:
     - E2B_API_KEY
     - ANTHROPIC_API_KEY or CLAUDE_CODE_OAUTH_TOKEN
     - GITHUB_TOKEN (optional, for git push)
`);
}

// Main
async function main(): Promise<void> {
	const options = parseArgs();

	if (!options.initiativeId) {
		showHelp();
		process.exit(1);
	}

	await orchestrate(options);
}

main().catch((error) => {
	console.error("\n❌ Orchestrator error:", error);
	process.exit(1);
});
