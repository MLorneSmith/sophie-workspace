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
		| "partial"
		| "resource_exhausted";
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
// Multi-Sandbox Types (Phase 1: Dual Sandbox)
// ============================================================================

interface SandboxInstance {
	sandbox: Sandbox;
	id: string;
	branch: string;
	status: "creating" | "ready" | "busy" | "completed" | "failed";
	assignedFeatures: number[];
	completedFeatures: number[];
	error?: string;
}

interface FeatureAssignment {
	featureId: number;
	sandboxId: string;
	estimatedHours: number;
}

interface SandboxPoolState {
	instances: Map<string, SandboxInstance>;
	specId: number;
	initiativeId: number;
	baseBranch: string;
}

interface ParallelExecutionResult {
	sandboxId: string;
	featureResults: ProgressReport[];
	branch: string;
	success: boolean;
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
const PROGRESS_POLL_INTERVAL_MS = 30000; // Poll progress file every 30 seconds
const STALL_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes with no progress = stalled (increased from 5min)
const STALL_CHECK_INTERVAL_MS = 30000; // Check for stalls every 30 seconds

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

	// Supabase credentials for dev server and runtime operations
	// These are injected at runtime to keep secrets out of the template image
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
	const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
	const databaseUrl = process.env.DATABASE_URL;

	if (supabaseUrl) {
		envs.NEXT_PUBLIC_SUPABASE_URL = supabaseUrl;
		envs.SUPABASE_URL = supabaseUrl;
	}
	if (supabaseAnonKey) {
		envs.NEXT_PUBLIC_SUPABASE_ANON_KEY = supabaseAnonKey;
		envs.SUPABASE_ANON_KEY = supabaseAnonKey;
	}
	if (supabaseServiceKey) {
		envs.SUPABASE_SERVICE_ROLE_KEY = supabaseServiceKey;
	}
	if (databaseUrl) {
		envs.DATABASE_URL = databaseUrl;
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
	const branchName = `alpha/spec-${manifest.metadata.spec_id}`;
	console.log("   Pulling latest code from origin...");

	await sandbox.commands.run(`cd ${WORKSPACE_DIR} && git fetch origin`, {
		timeoutMs: 120000,
	});

	// Check if spec branch already exists (for multi-initiative continuity)
	const branchExistsResult = await sandbox.commands.run(
		`cd ${WORKSPACE_DIR} && git ls-remote --heads origin "${branchName}" | wc -l`,
		{ timeoutMs: 30000 },
	);
	const branchExists = branchExistsResult.stdout.trim() === "1";

	if (branchExists) {
		console.log(`   Found existing branch: ${branchName}`);
		console.log("   Checking out and pulling latest changes...");
		await sandbox.commands.run(
			`cd ${WORKSPACE_DIR} && git checkout "${branchName}" && git pull origin "${branchName}"`,
			{ timeoutMs: 60000 },
		);
	} else {
		console.log("   Starting from dev branch...");
		await sandbox.commands.run(
			`cd ${WORKSPACE_DIR} && git checkout dev && git pull origin dev`,
			{ timeoutMs: 60000 },
		);
	}

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

	// Create spec branch if it doesn't already exist
	if (!branchExists) {
		console.log(`   Creating branch: ${branchName}`);
		await sandbox.commands.run(
			`cd ${WORKSPACE_DIR} && git checkout -b "${branchName}"`,
			{ timeoutMs: 30000 },
		);
	} else {
		console.log(`   Using existing branch: ${branchName}`);
	}

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

async function startVSCodeWeb(sandbox: Sandbox): Promise<string> {
	console.log("\n🚀 Starting VS Code Web...");

	sandbox.commands
		.run("nohup start-vscode > /tmp/vscode.log 2>&1 &", { timeoutMs: 5000 })
		.catch(() => {
			/* fire and forget */
		});
	await new Promise((resolve) => setTimeout(resolve, 5000));

	const vscodeHost = sandbox.getHost(VSCODE_PORT);
	const vscodeUrl = `https://${vscodeHost}`;

	console.log(`   ✓ VS Code Web: ${vscodeUrl}`);
	return vscodeUrl;
}

async function startDevServer(sandbox: Sandbox): Promise<string> {
	console.log("\n🚀 Starting dev server for review...");

	// Start the dev server
	sandbox.commands
		.run("nohup start-dev > /tmp/devserver.log 2>&1 &", { timeoutMs: 5000 })
		.catch(() => {
			/* fire and forget */
		});

	const devServerHost = sandbox.getHost(DEV_SERVER_PORT);
	const devServerUrl = `https://${devServerHost}`;

	// Wait and verify the server is actually running
	console.log("   Waiting for dev server to start...");
	let serverReady = false;
	for (let attempt = 1; attempt <= 6; attempt++) {
		await new Promise((resolve) => setTimeout(resolve, 10000));

		try {
			const result = await sandbox.commands.run(
				`curl -s -o /dev/null -w "%{http_code}" http://localhost:${DEV_SERVER_PORT} 2>/dev/null || echo "000"`,
				{ timeoutMs: 5000 },
			);
			const statusCode = result.stdout.trim();
			if (statusCode !== "000" && statusCode !== "") {
				serverReady = true;
				console.log(`   ✓ Dev server ready (HTTP ${statusCode})`);
				break;
			}
			console.log(`   ⏳ Waiting... (attempt ${attempt}/6)`);
		} catch {
			console.log(`   ⏳ Waiting... (attempt ${attempt}/6)`);
		}
	}

	if (!serverReady) {
		console.log("   ⚠️ Dev server may still be starting - check logs if needed");
	}

	return devServerUrl;
}

// ============================================================================
// Feature Implementation
// ============================================================================

interface SandboxProgress {
	feature?: {
		issue_number: number;
		title: string;
	};
	current_task?: {
		id: string;
		name: string;
		status: string;
		started_at?: string;
	};
	completed_tasks?: string[];
	failed_tasks?: string[];
	current_group?: {
		id: number;
		name: string;
		tasks_total: number;
		tasks_completed: number;
	};
	context_usage_percent?: number;
	status?: string;
	last_commit?: string;
	last_update?: string;
}

/**
 * Display a structured progress update from the sandbox progress file.
 * @param sandboxLabel Optional label to identify which sandbox (e.g., "sbx-a", "sbx-b")
 */
function displayProgressUpdate(
	progress: SandboxProgress,
	featureTaskCount: number,
	lastDisplayed: string,
	sandboxLabel?: string,
): string {
	const completed = progress.completed_tasks?.length || 0;
	const total = featureTaskCount;
	const current = progress.current_task;
	const contextPercent = progress.context_usage_percent || 0;

	// Create a unique key to avoid duplicate displays
	const updateKey = `${completed}-${current?.id}-${current?.status}`;
	if (updateKey === lastDisplayed) {
		return lastDisplayed; // No change
	}

	// Build progress bar
	const progressPercent = Math.round((completed / total) * 100);
	const barLength = 20;
	const filledLength = Math.round((progressPercent / 100) * barLength);
	const progressBar =
		"█".repeat(filledLength) + "░".repeat(barLength - filledLength);

	// Include sandbox label in header if provided
	const sandboxInfo = sandboxLabel ? ` [${sandboxLabel}]` : "";
	console.log(
		`\n   ┌─ 📊 Progress Update${sandboxInfo} ${"─".repeat(Math.max(0, 40 - sandboxInfo.length))}`,
	);
	console.log(
		`   │ Tasks: [${progressBar}] ${completed}/${total} (${progressPercent}%)`,
	);

	if (current) {
		const statusIcon =
			current.status === "in_progress"
				? "🔄"
				: current.status === "completed"
					? "✅"
					: current.status === "starting"
						? "⏳"
						: "📋";
		console.log(`   │ Current: ${statusIcon} [${current.id}] ${current.name}`);
	}

	if (progress.current_group) {
		console.log(
			`   │ Group: ${progress.current_group.name} (${progress.current_group.tasks_completed}/${progress.current_group.tasks_total})`,
		);
	}

	if (contextPercent > 0) {
		const contextIcon = contextPercent > 50 ? "⚠️" : "📈";
		console.log(`   │ Context: ${contextIcon} ${contextPercent}%`);
	}

	if (progress.last_commit) {
		console.log(`   │ Last commit: ${progress.last_commit.substring(0, 7)}`);
	}

	console.log(`   └${"─".repeat(52)}\n`);

	return updateKey;
}

/**
 * Start polling the progress file in the sandbox.
 * Returns a cleanup function to stop polling.
 * @param sandboxLabel Optional label to identify which sandbox (e.g., "sbx-a", "sbx-b")
 */
function startProgressPolling(
	sandbox: Sandbox,
	featureTaskCount: number,
	sandboxLabel?: string,
): { stop: () => void } {
	let lastDisplayed = "";
	let isPolling = true;

	const poll = async () => {
		while (isPolling) {
			try {
				const result = await sandbox.commands.run(
					`cat ${WORKSPACE_DIR}/${PROGRESS_FILE} 2>/dev/null`,
					{ timeoutMs: 5000 },
				);

				if (result.stdout && result.stdout.trim()) {
					const progress: SandboxProgress = JSON.parse(result.stdout);
					lastDisplayed = displayProgressUpdate(
						progress,
						featureTaskCount,
						lastDisplayed,
						sandboxLabel,
					);
				}
			} catch {
				// Ignore polling errors - sandbox may be busy
			}

			// Wait for next poll interval
			if (isPolling) {
				await sleep(PROGRESS_POLL_INTERVAL_MS);
			}
		}
	};

	// Start polling in background
	poll();

	return {
		stop: () => {
			isPolling = false;
		},
	};
}

async function runFeatureImplementation(
	sandbox: Sandbox,
	manifest: InitiativeManifest,
	featureId: number,
	resumeFromTask?: string,
	sandboxLabel?: string,
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

	// Check for partial progress from previous run
	if (!resumeFromTask) {
		const partialProgress = await getPartialProgress(sandbox, featureId);
		if (partialProgress && partialProgress.completedTasks.length > 0) {
			console.log(
				`   📋 Found partial progress: ${partialProgress.completedTasks.length} tasks completed`,
			);
			console.log(
				`   📋 Completed tasks: ${partialProgress.completedTasks.join(", ")}`,
			);
			if (partialProgress.currentTask) {
				resumeFromTask = partialProgress.currentTask;
				console.log(`   📋 Will resume from task: ${resumeFromTask}`);
			}
		}
	}

	// Update feature status
	feature.status = "in_progress";
	manifest.progress.current_feature = featureId;
	saveManifest(manifest);

	// Run Claude Code with /alpha:implement command
	let prompt = `/alpha:implement ${featureId}`;
	if (resumeFromTask) {
		prompt += ` --resume-from=${resumeFromTask}`;
	}

	console.log(`   Running: ${prompt}`);
	console.log("   " + "─".repeat(60));

	// Test streaming with a simple command first
	console.log("   │ Testing sandbox connectivity...");
	const testResult = await sandbox.commands.run(
		"echo 'Sandbox OK' && which claude",
		{
			timeoutMs: 10000,
		},
	);
	console.log(`   │ Test result: ${testResult.stdout.trim()}`);

	// Capture stdout/stderr for error analysis
	let capturedStdout = "";
	let capturedStderr = "";

	// Start progress polling (every 30 seconds)
	const labelInfo = sandboxLabel ? ` for ${sandboxLabel}` : "";
	console.log(
		`   │ Starting progress polling${labelInfo} (every ${PROGRESS_POLL_INTERVAL_MS / 1000}s)...`,
	);
	const progressPoller = startProgressPolling(
		sandbox,
		feature.task_count,
		sandboxLabel,
	);

	try {
		// Run claude with unbuffered output
		const result = await sandbox.commands.run(
			`stdbuf -oL -eL run-claude "${prompt.replace(/"/g, '\\"')}"`,
			{
				timeoutMs: 1800000, // 30 min timeout per feature
				envs: getAllEnvVars(),
				onStdout: (data) => {
					capturedStdout += data;
					// Stream output with prefix
					const lines = data.split("\n");
					for (const line of lines) {
						if (line.trim()) {
							process.stdout.write(`   │ ${line}\n`);
						}
					}
				},
				onStderr: (data) => {
					capturedStderr += data;
					process.stderr.write(`   │ [ERR] ${data}`);
				},
			},
		);

		// Stop polling once command completes
		progressPoller.stop();

		console.log("   " + "─".repeat(60));
		console.log(`   Exit code: ${result.exitCode}`);

		// Check for resource exhaustion FIRST (before reading progress)
		if (
			result.exitCode !== 0 &&
			isResourceExhausted(result.exitCode, capturedStdout, capturedStderr)
		) {
			console.log("   🔥 Detected resource exhaustion (OOM/CPU/healthcheck)");

			// Try to read any partial progress that was saved
			const progressResult = await sandbox.commands.run(
				`cat ${WORKSPACE_DIR}/${PROGRESS_FILE} 2>/dev/null || echo '{}'`,
				{ timeoutMs: 10000 },
			);

			let tasksCompleted = 0;
			try {
				const parsed = JSON.parse(progressResult.stdout || "{}");
				tasksCompleted = parsed.completed_tasks?.length || 0;
			} catch {
				// Ignore parse errors
			}

			feature.status = "resource_exhausted";
			feature.error = "Resource exhaustion - sandbox healthcheck failure";
			feature.tasks_completed = tasksCompleted;
			saveManifest(manifest);

			return {
				feature_id: featureId,
				status: "resource_exhausted",
				tasks_completed: tasksCompleted,
				tasks_total: feature.task_count,
				context_usage_percent: 0,
				error: "Resource exhaustion - will retry after recovery",
			};
		}

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
		// Stop polling on error
		progressPoller.stop();

		const errorMessage = error instanceof Error ? error.message : String(error);

		// Check if the caught exception indicates resource exhaustion
		if (isResourceExhausted(0, capturedStdout, capturedStderr, errorMessage)) {
			console.log(
				"   🔥 Detected resource exhaustion from exception (OOM/CPU/healthcheck)",
			);

			feature.status = "resource_exhausted";
			feature.error = "Resource exhaustion - sandbox healthcheck failure";
			saveManifest(manifest);

			return {
				feature_id: featureId,
				status: "resource_exhausted",
				tasks_completed: feature.tasks_completed || 0,
				tasks_total: feature.task_count,
				context_usage_percent: 0,
				error: "Resource exhaustion - will retry after recovery",
			};
		}

		feature.status = "failed";
		feature.error = errorMessage;
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

/**
 * Handle resource exhaustion by waiting for recovery and retrying.
 * Uses exponential backoff and checks sandbox health before retrying.
 */
async function handleResourceExhaustion(
	sandbox: Sandbox,
	manifest: InitiativeManifest,
	featureId: number,
	attempt: number = 1,
	maxAttempts: number = 3,
): Promise<ProgressReport> {
	console.log(
		`\n🔥 Handling resource exhaustion for feature #${featureId} (attempt ${attempt}/${maxAttempts})`,
	);

	// Wait for sandbox to recover
	const recovered = await waitForSandboxRecovery(sandbox);

	if (!recovered) {
		console.log("   ❌ Sandbox did not recover - marking feature as failed");
		const feature = manifest.features.find((f) => f.id === featureId);
		if (feature) {
			feature.status = "failed";
			feature.error = "Sandbox resource exhaustion - did not recover";
			saveManifest(manifest);
		}

		return {
			feature_id: featureId,
			status: "failed",
			tasks_completed: feature?.tasks_completed || 0,
			tasks_total: feature?.task_count || 0,
			context_usage_percent: 0,
			error: "Sandbox resource exhaustion - did not recover",
		};
	}

	// Retry the implementation
	console.log("   🔄 Retrying feature implementation...");
	const result = await runFeatureImplementation(sandbox, manifest, featureId);

	// If still resource exhausted and we have attempts left, recurse
	if (result.status === "resource_exhausted" && attempt < maxAttempts) {
		return handleResourceExhaustion(
			sandbox,
			manifest,
			featureId,
			attempt + 1,
			maxAttempts,
		);
	}

	return result;
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

	// Determine sandbox count (Phase 1: max 2)
	const sandboxCount = Math.min(options.maxParallel, 2);
	const isDualSandbox = sandboxCount > 1;

	// Print header
	console.log("═".repeat(70));
	console.log(
		isDualSandbox
			? "   ALPHA INITIATIVE ORCHESTRATOR (Dual Sandbox)"
			: "   ALPHA INITIATIVE ORCHESTRATOR (Single Sandbox)",
	);
	console.log("═".repeat(70));
	console.log(
		`\n📊 Initiative #${manifest.metadata.initiative_id}: ${manifest.metadata.initiative_name}`,
	);
	console.log(`   Spec: #${manifest.metadata.spec_id}`);
	console.log(`   Features: ${manifest.execution_plan.total_features}`);
	console.log(`   Tasks: ${manifest.execution_plan.total_tasks}`);
	console.log(
		`   Mode: ${sandboxCount} sandbox${sandboxCount > 1 ? "es" : ""}`,
	);
	console.log(
		`   Estimated Hours: ${manifest.execution_plan.duration.parallel_hours} (parallel)`,
	);

	// Handle dry-run mode
	if (options.dryRun) {
		printDryRunPlan(manifest, sandboxCount);
		return;
	}

	// =========================================================================
	// DUAL SANDBOX MODE
	// =========================================================================
	if (isDualSandbox) {
		await orchestrateDualSandbox(manifest, options, projectRoot);
		return;
	}

	// =========================================================================
	// SINGLE SANDBOX MODE (Original behavior)
	// =========================================================================
	await orchestrateSingleSandbox(manifest, options, initDir);
}

/**
 * Orchestrate implementation using dual sandboxes in parallel.
 */
async function orchestrateDualSandbox(
	manifest: InitiativeManifest,
	options: OrchestratorOptions,
	projectRoot: string,
): Promise<void> {
	const sandboxCount = Math.min(options.maxParallel, 2);

	// Create sandbox pool
	const pool = new SandboxPoolManager(manifest, options.timeout);
	await pool.createPool(sandboxCount);

	// VS Code Web disabled to save memory (~200-500MB per sandbox)
	// Can be started manually if needed for debugging

	// Print sandbox info
	console.log("\n" + "═".repeat(70));
	console.log("   SANDBOXES READY");
	console.log("═".repeat(70));
	const urls = pool.getReviewUrls();
	for (const { sandboxId } of urls) {
		console.log(`   ${sandboxId}: Ready`);
	}

	// Start implementation
	console.log("\n" + "═".repeat(70));
	console.log("   IMPLEMENTATION");
	console.log("═".repeat(70));

	manifest.progress.status = "in_progress";
	manifest.progress.started_at =
		manifest.progress.started_at || new Date().toISOString();
	saveManifest(manifest);

	// Process each parallel group
	for (const group of manifest.execution_plan.parallel_groups) {
		if (group.group < manifest.progress.current_group) {
			console.log(`\n⏭️ Skipping completed group ${group.group}`);
			continue;
		}

		console.log(`\n📦 Group ${group.group}: ${group.description}`);

		// Get pending features in this group
		const pendingFeatures = manifest.features.filter(
			(f) => group.feature_ids.includes(f.id) && f.status !== "completed",
		);

		if (pendingFeatures.length === 0) {
			console.log("   All features completed");
			continue;
		}

		// Assign features to sandboxes
		pool.assignFeatures(pendingFeatures);

		// Execute in parallel across sandboxes
		const results = await pool.executeInParallel();

		// Update manifest with results
		for (const result of results) {
			for (const featureResult of result.featureResults) {
				const feature = manifest.features.find(
					(f) => f.id === featureResult.feature_id,
				);
				if (feature) {
					feature.status = featureResult.status as FeatureEntry["status"];
					feature.tasks_completed = featureResult.tasks_completed;
					if (featureResult.status === "completed") {
						manifest.progress.features_completed++;
					}
					manifest.progress.tasks_completed += featureResult.tasks_completed;
				}
			}
		}

		saveManifest(manifest);
		manifest.progress.current_group = group.group + 1;
	}

	// Merge all sandbox branches into the main spec branch
	const branches = pool.getBranches();
	if (branches.length > 0) {
		const targetBranch = `alpha/spec-${manifest.metadata.spec_id}`;
		const mergeResult = await mergeAllBranches(
			branches,
			targetBranch,
			projectRoot,
		);

		if (!mergeResult.success) {
			console.log("\n   ⚠️ Merge conflicts detected:");
			for (const conflict of mergeResult.conflicts) {
				console.log(`      - ${conflict}`);
			}
			console.log("   Manual merge required. Individual branches preserved.");
		} else {
			manifest.sandbox.branch_name = targetBranch;
		}
		saveManifest(manifest);
	}

	// Update final status
	const failedFeatures = manifest.features.filter(
		(f) => f.status === "failed",
	).length;
	manifest.progress.status = failedFeatures === 0 ? "completed" : "partial";
	manifest.progress.completed_at = new Date().toISOString();
	saveManifest(manifest);

	// Print summary
	printFinalSummary(manifest, urls, projectRoot);

	// Cleanup sandboxes
	await pool.cleanup();

	if (failedFeatures > 0) {
		process.exit(1);
	}
}

/**
 * Orchestrate implementation using a single sandbox (original behavior).
 */
async function orchestrateSingleSandbox(
	manifest: InitiativeManifest,
	options: OrchestratorOptions,
	initDir: string,
): Promise<void> {
	// Resume or create sandbox
	let sandbox: Sandbox | null = null;

	if (options.resume) {
		sandbox = await resumeSandbox(manifest);
	}

	if (!sandbox) {
		sandbox = await createSandbox(manifest, options.timeout);
	}

	// VS Code Web disabled to save memory (~200-500MB)
	// Can be started manually if needed for debugging
	saveManifest(manifest);

	// Print sandbox info
	console.log("\n" + "═".repeat(70));
	console.log("   SANDBOX READY");
	console.log("═".repeat(70));
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

		// Execute features sequentially in single sandbox
		for (const featureId of pendingFeatures) {
			console.log(`\n   🔄 Feature #${featureId}`);

			let result = await runFeatureImplementation(sandbox, manifest, featureId);

			// Handle resource exhaustion (OOM/CPU/healthcheck failure)
			if (result.status === "resource_exhausted") {
				console.log(
					`   🔥 Feature #${featureId} hit resource exhaustion, waiting for recovery...`,
				);
				result = await handleResourceExhaustion(sandbox, manifest, featureId);
			}

			// Handle partial completion (context limit)
			let retries = 0;
			while (result.status === "partial" && retries < 3) {
				console.log(
					`   ⚠️ Feature #${featureId} hit context limit, resuming...`,
				);
				result = await handlePartialFeature(sandbox, manifest, featureId);
				retries++;

				// Check if partial retry caused resource exhaustion
				if (result.status === "resource_exhausted") {
					console.log(
						`   🔥 Feature #${featureId} hit resource exhaustion during partial retry...`,
					);
					result = await handleResourceExhaustion(sandbox, manifest, featureId);
				}
			}

			// Log result
			const icon =
				result.status === "completed"
					? "✅"
					: result.status === "partial"
						? "⚠️"
						: result.status === "blocked"
							? "🚫"
							: result.status === "resource_exhausted"
								? "🔥"
								: "❌";
			console.log(
				`   ${icon} Feature #${featureId}: ${result.status} (${result.tasks_completed}/${result.tasks_total} tasks)`,
			);
		}

		// Update current group
		manifest.progress.current_group = group.group + 1;
		saveManifest(manifest);
	}

	// Final validation
	console.log("\n" + "═".repeat(70));
	console.log("   FINAL VALIDATION");
	console.log("═".repeat(70));

	const validationWarnings: string[] = [];

	// Run validation steps separately with OOM recovery
	const validationSteps = [
		{
			name: "typecheck",
			cmd: `cd ${WORKSPACE_DIR} && pnpm --filter web typecheck`,
			timeout: 180000,
			critical: false,
		},
		{
			name: "lint",
			cmd: `cd ${WORKSPACE_DIR} && pnpm --filter web lint`,
			timeout: 120000,
			critical: false,
		},
		{
			name: "format",
			cmd: `cd ${WORKSPACE_DIR} && pnpm --filter web format`,
			timeout: 60000,
			critical: false,
		},
	];

	for (const step of validationSteps) {
		console.log(`\n   Running ${step.name}...`);

		try {
			const result = await sandbox.commands.run(step.cmd, {
				timeoutMs: step.timeout,
			});

			if (result.exitCode === 0) {
				console.log(`   ✅ ${step.name} passed`);
			} else if (result.exitCode === 137) {
				console.log(
					`   ⚠️ ${step.name} was killed (OOM) - skipping, code already pushed`,
				);
				validationWarnings.push(`${step.name}: OOM killed (exit 137)`);
				console.log("   ⏳ Waiting for sandbox to recover...");
				await waitForSandboxRecovery(sandbox, 2);
			} else {
				console.log(`   ⚠️ ${step.name} had issues (exit ${result.exitCode})`);
				validationWarnings.push(`${step.name}: exit code ${result.exitCode}`);
			}
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);

			if (
				isResourceExhausted(0, "", "", errorMessage) ||
				errorMessage.includes("137")
			) {
				console.log(`   ⚠️ ${step.name} crashed (likely OOM) - skipping`);
				validationWarnings.push(`${step.name}: crashed (OOM)`);
				console.log("   ⏳ Waiting for sandbox to recover...");
				await waitForSandboxRecovery(sandbox, 2);
			} else {
				console.log(`   ❌ ${step.name} error: ${errorMessage}`);
				validationWarnings.push(`${step.name}: ${errorMessage}`);
			}
		}
	}

	// Summary of validation
	if (validationWarnings.length === 0) {
		console.log("\n   ✅ All code quality checks passed");
	} else {
		console.log("\n   ⚠️ Validation completed with warnings:");
		for (const warning of validationWarnings) {
			console.log(`      - ${warning}`);
		}
		console.log("   📝 Code was pushed - run validation locally to verify");
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

	// Start dev server NOW - after all implementation is complete
	const devServerUrl = await startDevServer(sandbox);
	manifest.sandbox.dev_server_url = devServerUrl;
	saveManifest(manifest);

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
	console.log("   REVIEW YOUR WORK");
	console.log("═".repeat(70));
	console.log("\n   🔗 Review URLs:");
	console.log(`      VS Code: ${vscodeUrl}`);
	console.log(`      Dev Server: ${devServerUrl}`);

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

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// Resource Exhaustion Detection & Recovery
// ============================================================================

/**
 * Detect if a failure was due to resource exhaustion (OOM, CPU throttling, healthcheck failure).
 * These failures are recoverable by waiting for resources to free up.
 */
function isResourceExhausted(
	exitCode: number,
	stdout: string,
	stderr: string,
	errorMessage?: string,
): boolean {
	// Exit code 137 = SIGKILL (typically OOM killer)
	// Exit code 2 with "context canceled" = E2B healthcheck killed the process
	if (exitCode === 137) {
		return true;
	}

	const combinedOutput =
		`${stdout} ${stderr} ${errorMessage || ""}`.toLowerCase();

	// Check for resource-related error patterns
	const resourcePatterns = [
		"context canceled",
		"context cancelled",
		"healthcheck",
		"out of memory",
		"oom",
		"killed",
		"memory limit",
		"cpu limit",
		"resource exhausted",
	];

	return resourcePatterns.some((pattern) => combinedOutput.includes(pattern));
}

/**
 * Check sandbox health by examining system load.
 * Returns healthy if load average is below threshold (3.5 for 4 cores).
 */
async function checkSandboxHealth(
	sandbox: Sandbox,
): Promise<{ healthy: boolean; load: number; memUsedPercent: number }> {
	try {
		const result = await sandbox.commands.run(
			`cat /proc/loadavg && free | grep Mem | awk '{print $3/$2 * 100}'`,
			{ timeoutMs: 5000 },
		);

		const lines = result.stdout.trim().split("\n");
		const loadAvg = parseFloat(lines[0]?.split(" ")[0] || "0");
		const memUsedPercent = parseFloat(lines[1] || "0");

		// 4 cores, so load < 3.5 is healthy; memory < 85% is healthy
		const healthy = loadAvg < 3.5 && memUsedPercent < 85;

		return { healthy, load: loadAvg, memUsedPercent };
	} catch {
		// If we can't check health, assume unhealthy
		return { healthy: false, load: 999, memUsedPercent: 100 };
	}
}

/**
 * Wait for sandbox to recover from resource exhaustion with exponential backoff.
 * Returns true if sandbox recovered, false if max attempts exceeded.
 */
async function waitForSandboxRecovery(
	sandbox: Sandbox,
	maxAttempts: number = 5,
): Promise<boolean> {
	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		// Exponential backoff: 30s, 60s, 90s, 120s, 120s
		const backoffMs = Math.min(30000 * attempt, 120000);

		console.log(
			`   ⏳ Waiting ${backoffMs / 1000}s for sandbox to recover (attempt ${attempt}/${maxAttempts})...`,
		);
		await sleep(backoffMs);

		const health = await checkSandboxHealth(sandbox);
		console.log(
			`   📊 Health check: load=${health.load.toFixed(2)}, mem=${health.memUsedPercent.toFixed(1)}%`,
		);

		if (health.healthy) {
			console.log("   ✅ Sandbox recovered");
			return true;
		}
	}

	console.log("   ❌ Sandbox did not recover after max attempts");
	return false;
}

/**
 * Read partial progress from the sandbox to enable resuming from last checkpoint.
 */
async function getPartialProgress(
	sandbox: Sandbox,
	featureId: number,
): Promise<{
	completedTasks: string[];
	currentTask: string | null;
	lastCommit: string | null;
} | null> {
	try {
		const result = await sandbox.commands.run(
			`cat ${WORKSPACE_DIR}/${PROGRESS_FILE} 2>/dev/null || echo "null"`,
			{ timeoutMs: 10000 },
		);

		if (result.stdout.trim() === "null") {
			return null;
		}

		const progress = JSON.parse(result.stdout);

		// Verify it's for the right feature
		if (progress?.feature?.issue_number !== featureId) {
			return null;
		}

		return {
			completedTasks: progress.completed_tasks || [],
			currentTask: progress.current_task?.id || null,
			lastCommit: progress.last_commit || null,
		};
	} catch {
		return null;
	}
}

/**
 * Run feature implementation with stall detection.
 * Monitors progress and kills/restarts if no progress for STALL_TIMEOUT_MS.
 * @param sandboxLabel Optional label to identify which sandbox (e.g., "sbx-a", "sbx-b")
 */
async function runFeatureWithStallDetection(
	sandbox: Sandbox,
	manifest: InitiativeManifest,
	featureId: number,
	sandboxLabel?: string,
): Promise<ProgressReport> {
	let lastProgressSnapshot: {
		completedTasks: string[];
		currentTask: string | null;
	} | null = null;
	let lastChangeTime = Date.now();
	let isStalled = false;

	// Start monitoring in background
	const monitorInterval = setInterval(async () => {
		try {
			const currentProgress = await getPartialProgress(sandbox, featureId);

			if (currentProgress) {
				const hasProgress =
					!lastProgressSnapshot ||
					currentProgress.completedTasks.length >
						lastProgressSnapshot.completedTasks.length ||
					currentProgress.currentTask !== lastProgressSnapshot.currentTask;

				if (hasProgress) {
					lastChangeTime = Date.now();
					lastProgressSnapshot = {
						completedTasks: currentProgress.completedTasks,
						currentTask: currentProgress.currentTask,
					};
				}
			}

			// Check for stall
			if (Date.now() - lastChangeTime > STALL_TIMEOUT_MS) {
				isStalled = true;
				const labelPrefix = sandboxLabel ? `[${sandboxLabel}] ` : "";
				console.log(
					`   ⚠️ ${labelPrefix}Feature #${featureId} stalled - no progress for ${STALL_TIMEOUT_MS / 60000} minutes`,
				);
			}
		} catch {
			// Ignore monitoring errors
		}
	}, STALL_CHECK_INTERVAL_MS);

	try {
		// Run the implementation with a race against stall detection
		const implementationPromise = runFeatureImplementation(
			sandbox,
			manifest,
			featureId,
			undefined, // resumeFromTask
			sandboxLabel,
		);

		// Check periodically if we've stalled
		const result = await new Promise<ProgressReport>((resolve, reject) => {
			implementationPromise.then(resolve).catch(reject);

			// Check stall status every second
			const stallChecker = setInterval(() => {
				if (isStalled) {
					clearInterval(stallChecker);
					// Don't reject - let it continue but mark as resource_exhausted for retry
					resolve({
						feature_id: featureId,
						status: "resource_exhausted",
						tasks_completed: lastProgressSnapshot?.completedTasks.length || 0,
						tasks_total:
							manifest.features.find((f) => f.id === featureId)?.task_count ||
							0,
						context_usage_percent: 0,
						error: `Stalled - no progress for ${STALL_TIMEOUT_MS / 60000} minutes`,
					});
				}
			}, 1000);

			// Clean up stall checker when implementation completes
			implementationPromise.finally(() => clearInterval(stallChecker));
		});

		return result;
	} finally {
		clearInterval(monitorInterval);
	}
}

// ============================================================================
// Sandbox Pool Management (Phase 1: Dual Sandbox)
// ============================================================================

class SandboxPoolManager {
	private pool: SandboxPoolState;
	private manifest: InitiativeManifest;
	private timeout: number;

	constructor(manifest: InitiativeManifest, timeout: number) {
		this.manifest = manifest;
		this.timeout = timeout;
		this.pool = {
			instances: new Map(),
			specId: manifest.metadata.spec_id,
			initiativeId: manifest.metadata.initiative_id,
			baseBranch: "dev",
		};
	}

	/**
	 * Create N sandboxes with staggered startup to avoid concurrent memory spikes.
	 * Each sandbox is created sequentially with a 90-second delay between them.
	 */
	async createPool(count: number = 2): Promise<void> {
		console.log(
			`\n📦 Creating sandbox pool (${count} sandboxes, staggered)...`,
		);

		const STAGGER_DELAY_MS = 90000; // 90 seconds between sandbox startups
		let successCount = 0;

		for (let i = 0; i < count; i++) {
			const suffix = `sbx-${String.fromCharCode(97 + i)}`;

			// Stagger startup to avoid concurrent memory spikes during Claude Code initialization
			if (i > 0) {
				console.log(
					`   ⏳ Waiting ${STAGGER_DELAY_MS / 1000}s before creating next sandbox...`,
				);
				await sleep(STAGGER_DELAY_MS);
			}

			try {
				await this.createSandboxInstance(suffix);
				successCount++;
			} catch (error) {
				console.error(`   ❌ Failed to create sandbox ${suffix}: ${error}`);
			}
		}

		console.log(`   ✅ Created ${successCount}/${count} sandboxes`);

		if (successCount === 0) {
			throw new Error("Failed to create any sandboxes");
		}
	}

	/**
	 * Create a single sandbox instance with its own branch.
	 * Uses spec-based branch naming for multi-initiative continuity.
	 */
	private async createSandboxInstance(
		suffix: string,
	): Promise<SandboxInstance> {
		const branchName = `alpha/spec-${this.pool.specId}-${suffix}`;
		const mainSpecBranch = `alpha/spec-${this.pool.specId}`;

		console.log(`   Creating sandbox ${suffix}...`);

		const sandbox = await Sandbox.create(TEMPLATE_ALIAS, {
			timeoutMs: this.timeout * 1000,
			apiKey: E2B_API_KEY,
			envs: getAllEnvVars(),
		});

		console.log(`   ${suffix}: ID=${sandbox.sandboxId}`);

		// Setup git
		if (GITHUB_TOKEN) {
			await setupGitCredentials(sandbox);
		}

		// Fetch all branches
		await sandbox.commands.run(`cd ${WORKSPACE_DIR} && git fetch origin`, {
			timeoutMs: 120000,
		});

		// Check if main spec branch exists (from previous initiative runs)
		const mainBranchExistsResult = await sandbox.commands.run(
			`cd ${WORKSPACE_DIR} && git ls-remote --heads origin "${mainSpecBranch}" | wc -l`,
			{ timeoutMs: 30000 },
		);
		const mainBranchExists = mainBranchExistsResult.stdout.trim() === "1";

		if (mainBranchExists) {
			// Branch from existing spec branch (multi-initiative continuity)
			console.log(
				`   ${suffix}: Found existing spec branch, branching from ${mainSpecBranch}`,
			);
			await sandbox.commands.run(
				`cd ${WORKSPACE_DIR} && git checkout "${mainSpecBranch}" && git pull origin "${mainSpecBranch}"`,
				{ timeoutMs: 60000 },
			);
		} else {
			// Start from dev branch
			console.log(`   ${suffix}: Starting from dev branch`);
			await sandbox.commands.run(
				`cd ${WORKSPACE_DIR} && git checkout dev && git pull origin dev`,
				{ timeoutMs: 60000 },
			);
		}

		// Create sandbox-specific branch for parallel work
		await sandbox.commands.run(
			`cd ${WORKSPACE_DIR} && git checkout -b "${branchName}"`,
			{ timeoutMs: 30000 },
		);

		// Verify dependencies
		const checkResult = await sandbox.commands.run(
			`cd ${WORKSPACE_DIR} && test -d node_modules && echo "exists" || echo "missing"`,
			{ timeoutMs: 10000 },
		);

		if (checkResult.stdout.trim() === "missing") {
			console.log(`   ${suffix}: Installing dependencies...`);
			await sandbox.commands.run(
				`cd ${WORKSPACE_DIR} && pnpm install --frozen-lockfile`,
				{ timeoutMs: 600000 },
			);
		}

		const instance: SandboxInstance = {
			sandbox,
			id: suffix,
			branch: branchName,
			status: "ready",
			assignedFeatures: [],
			completedFeatures: [],
		};

		this.pool.instances.set(suffix, instance);
		return instance;
	}

	/**
	 * Assign features to sandboxes using load balancing by estimated hours.
	 */
	assignFeatures(features: FeatureEntry[]): FeatureAssignment[] {
		const assignments: FeatureAssignment[] = [];
		const sandboxLoads = new Map<string, number>();

		// Initialize loads
		for (const id of this.pool.instances.keys()) {
			sandboxLoads.set(id, 0);
		}

		// Sort features by hours descending (assign largest first for better balance)
		const sortedFeatures = [...features].sort(
			(a, b) => b.parallel_hours - a.parallel_hours,
		);

		for (const feature of sortedFeatures) {
			// Find sandbox with lowest current load
			let minLoad = Number.POSITIVE_INFINITY;
			let targetSandbox = "";

			for (const [sandboxId, load] of sandboxLoads) {
				if (load < minLoad) {
					minLoad = load;
					targetSandbox = sandboxId;
				}
			}

			// Assign feature
			assignments.push({
				featureId: feature.id,
				sandboxId: targetSandbox,
				estimatedHours: feature.parallel_hours,
			});

			// Update load
			sandboxLoads.set(
				targetSandbox,
				(sandboxLoads.get(targetSandbox) || 0) + feature.parallel_hours,
			);

			// Update instance
			const instance = this.pool.instances.get(targetSandbox);
			if (instance) {
				instance.assignedFeatures.push(feature.id);
			}
		}

		// Log assignments
		console.log("\n📋 Feature Assignments:");
		for (const [sandboxId, instance] of this.pool.instances) {
			const load = sandboxLoads.get(sandboxId) || 0;
			console.log(
				`   ${sandboxId}: Features ${instance.assignedFeatures.join(", ")} (${load}h)`,
			);
		}

		return assignments;
	}

	/**
	 * Execute features in parallel across all sandboxes.
	 */
	async executeInParallel(): Promise<ParallelExecutionResult[]> {
		console.log("\n🚀 Starting parallel execution across sandboxes...");

		const executionPromises: Promise<ParallelExecutionResult>[] = [];

		for (const [_sandboxId, instance] of this.pool.instances) {
			if (instance.assignedFeatures.length === 0) continue;

			executionPromises.push(this.executeSandboxFeatures(instance));
		}

		const results = await Promise.all(executionPromises);
		return results;
	}

	/**
	 * Execute all assigned features in a single sandbox sequentially.
	 * Uses stall detection to automatically recover from hung Claude sessions.
	 */
	private async executeSandboxFeatures(
		instance: SandboxInstance,
	): Promise<ParallelExecutionResult> {
		instance.status = "busy";
		const featureResults: ProgressReport[] = [];

		console.log(
			`\n   ┌── Sandbox ${instance.id} starting ──────────────────────`,
		);
		console.log(
			`   │ Features: ${instance.assignedFeatures.map((f) => `#${f}`).join(", ")}`,
		);

		for (const featureId of instance.assignedFeatures) {
			console.log("   │");
			console.log(`   │ 📋 [${instance.id}] Starting Feature #${featureId}`);

			// Use stall detection wrapper to catch hung Claude sessions
			let result = await runFeatureWithStallDetection(
				instance.sandbox,
				this.manifest,
				featureId,
				instance.id, // Pass sandbox label for progress reporting
			);

			// Handle resource exhaustion (includes stall detection)
			if (result.status === "resource_exhausted") {
				console.log(
					`   │ 🔥 [${instance.id}] Feature #${featureId} hit OOM/stall, recovering...`,
				);
				const recovered = await waitForSandboxRecovery(instance.sandbox);
				if (recovered) {
					result = await runFeatureWithStallDetection(
						instance.sandbox,
						this.manifest,
						featureId,
						instance.id, // Pass sandbox label for progress reporting
					);
				}
			}

			// Handle partial completion (context limit)
			let retries = 0;
			while (result.status === "partial" && retries < 3) {
				console.log(
					`   │ ⚠️ [${instance.id}] Feature #${featureId} hit context limit, resuming...`,
				);
				result = await runFeatureWithStallDetection(
					instance.sandbox,
					this.manifest,
					featureId,
					instance.id, // Pass sandbox label for progress reporting
				);
				retries++;
			}

			featureResults.push(result);

			if (result.status === "completed") {
				instance.completedFeatures.push(featureId);
				console.log(
					`   │ ✅ [${instance.id}] Feature #${featureId} completed (${result.tasks_completed}/${result.tasks_total} tasks)`,
				);
			} else {
				console.log(
					`   │ ❌ [${instance.id}] Feature #${featureId} ${result.status} (${result.tasks_completed}/${result.tasks_total} tasks)`,
				);
			}
		}

		// Push branch
		console.log("   │");
		console.log(`   │ 📤 Pushing branch ${instance.branch}...`);
		try {
			await instance.sandbox.commands.run(
				`cd ${WORKSPACE_DIR} && git push -u origin "${instance.branch}"`,
				{ timeoutMs: 120000 },
			);
			console.log("   │ ✅ Branch pushed successfully");
		} catch (error) {
			console.log(`   │ ⚠️ Failed to push branch: ${error}`);
		}

		instance.status = "completed";
		console.log(
			`   └── Sandbox ${instance.id} completed ──────────────────────\n`,
		);

		return {
			sandboxId: instance.id,
			featureResults,
			branch: instance.branch,
			success: featureResults.every((r) => r.status === "completed"),
		};
	}

	/**
	 * Get URLs for all sandboxes.
	 */
	getReviewUrls(): { sandboxId: string; vscode: string; devServer: string }[] {
		const urls: { sandboxId: string; vscode: string; devServer: string }[] = [];

		for (const [sandboxId, instance] of this.pool.instances) {
			const vscodeHost = instance.sandbox.getHost(VSCODE_PORT);
			const devServerHost = instance.sandbox.getHost(DEV_SERVER_PORT);

			urls.push({
				sandboxId,
				vscode: `https://${vscodeHost}`,
				devServer: `https://${devServerHost}`,
			});
		}

		return urls;
	}

	/**
	 * Start VS Code Web on all sandboxes.
	 */
	async startVSCodeOnAll(): Promise<void> {
		console.log("\n🚀 Starting VS Code Web on all sandboxes...");

		for (const [_sandboxId, instance] of this.pool.instances) {
			instance.sandbox.commands
				.run("nohup start-vscode > /tmp/vscode.log 2>&1 &", { timeoutMs: 5000 })
				.catch(() => {});
		}

		await sleep(5000);

		for (const [sandboxId, instance] of this.pool.instances) {
			const host = instance.sandbox.getHost(VSCODE_PORT);
			console.log(`   ${sandboxId}: https://${host}`);
		}
	}

	/**
	 * Get all sandbox branches that need to be merged.
	 */
	getBranches(): string[] {
		return Array.from(this.pool.instances.values())
			.filter((i) => i.status === "completed")
			.map((i) => i.branch);
	}

	/**
	 * Get number of active sandboxes.
	 */
	getActiveCount(): number {
		return this.pool.instances.size;
	}

	/**
	 * Cleanup all sandboxes.
	 */
	async cleanup(): Promise<void> {
		console.log("\n🧹 Cleaning up sandboxes...");
		for (const [sandboxId, instance] of this.pool.instances) {
			try {
				await instance.sandbox.kill();
				console.log(`   ${sandboxId}: killed`);
			} catch {
				console.log(`   ${sandboxId}: already stopped`);
			}
		}
	}
}

// ============================================================================
// Local Git Merge Coordinator
// ============================================================================

/**
 * Merge all sandbox branches into a single target branch.
 * Runs on the local machine (orchestrator), not in sandboxes.
 */
async function mergeAllBranches(
	branches: string[],
	targetBranch: string,
	projectRoot: string,
): Promise<{ success: boolean; conflicts: string[] }> {
	console.log(
		`\n🔀 Merging ${branches.length} branches into ${targetBranch}...`,
	);

	const { execSync } = await import("node:child_process");
	const conflicts: string[] = [];

	try {
		// Fetch all remote branches
		console.log("   Fetching remote branches...");
		execSync("git fetch origin", { cwd: projectRoot, stdio: "pipe" });

		// Create target branch from dev
		console.log(`   Creating target branch: ${targetBranch}`);
		try {
			execSync(`git branch -D ${targetBranch}`, {
				cwd: projectRoot,
				stdio: "pipe",
			});
		} catch {
			// Branch doesn't exist, that's fine
		}
		execSync(`git checkout -b ${targetBranch} origin/dev`, {
			cwd: projectRoot,
			stdio: "pipe",
		});

		// Merge each sandbox branch
		for (const branch of branches) {
			console.log(`   Merging ${branch}...`);
			try {
				execSync(
					`git merge origin/${branch} --no-edit -m "Merge ${branch} into ${targetBranch}"`,
					{ cwd: projectRoot, stdio: "pipe" },
				);
				console.log(`   ✅ ${branch} merged successfully`);
			} catch {
				// Check if it's a conflict
				const status = execSync("git status --porcelain", {
					cwd: projectRoot,
					encoding: "utf-8",
				});
				if (
					status.includes("UU ") ||
					status.includes("AA ") ||
					status.includes("DD ")
				) {
					console.log(`   ⚠️ ${branch} has conflicts`);
					conflicts.push(branch);
					// Abort this merge
					execSync("git merge --abort", { cwd: projectRoot, stdio: "pipe" });
				} else {
					throw new Error(`Merge failed for ${branch}`);
				}
			}
		}

		// Push if no conflicts
		if (conflicts.length === 0) {
			console.log(`   Pushing ${targetBranch} to origin...`);
			execSync(`git push -u origin ${targetBranch}`, {
				cwd: projectRoot,
				stdio: "pipe",
			});
			console.log("   ✅ All branches merged and pushed");
		}

		// Return to dev
		execSync("git checkout dev", { cwd: projectRoot, stdio: "pipe" });

		return { success: conflicts.length === 0, conflicts };
	} catch (error) {
		console.error(`   ❌ Merge failed: ${error}`);
		// Try to recover
		try {
			execSync("git merge --abort", { cwd: projectRoot, stdio: "pipe" });
		} catch {}
		try {
			execSync("git checkout dev", { cwd: projectRoot, stdio: "pipe" });
		} catch {}
		return { success: false, conflicts: ["FATAL_ERROR"] };
	}
}

/**
 * Print dry-run execution plan showing feature assignments.
 */
function printDryRunPlan(
	manifest: InitiativeManifest,
	sandboxCount: number,
): void {
	console.log("\n🔍 DRY RUN - Execution Plan:");

	// Simulate assignment
	const features = [...manifest.features].sort(
		(a, b) => b.parallel_hours - a.parallel_hours,
	);
	const sandboxLoads = Array.from({ length: sandboxCount }, () => ({
		features: [] as number[],
		hours: 0,
	}));

	for (const feature of features) {
		// Find sandbox with lowest load
		let minIdx = 0;
		for (let i = 1; i < sandboxLoads.length; i++) {
			if (sandboxLoads[i].hours < sandboxLoads[minIdx].hours) {
				minIdx = i;
			}
		}
		sandboxLoads[minIdx].features.push(feature.id);
		sandboxLoads[minIdx].hours += feature.parallel_hours;
	}

	for (let i = 0; i < sandboxLoads.length; i++) {
		const id = String.fromCharCode(97 + i);
		console.log(`\n   Sandbox ${id} (${sandboxLoads[i].hours}h):`);
		for (const featureId of sandboxLoads[i].features) {
			const feature = manifest.features.find((f) => f.id === featureId);
			if (feature) {
				console.log(
					`      #${feature.id}: ${feature.title} (${feature.parallel_hours}h, ${feature.task_count} tasks)`,
				);
			}
		}
	}

	const maxHours = Math.max(...sandboxLoads.map((s) => s.hours));
	const sequentialHours = sandboxLoads.reduce((sum, s) => sum + s.hours, 0);
	const savings = Math.round((1 - maxHours / sequentialHours) * 100);

	console.log("\n   📊 Estimated Duration:");
	console.log(`      Sequential: ${sequentialHours}h`);
	console.log(`      Parallel (${sandboxCount} sandboxes): ${maxHours}h`);
	console.log(`      Time saved: ${savings}%`);
}

/**
 * Print final summary with results and URLs.
 */
function printFinalSummary(
	manifest: InitiativeManifest,
	urls: { sandboxId: string; vscode: string; devServer: string }[],
	projectRoot: string,
): void {
	const completed = manifest.features.filter(
		(f) => f.status === "completed",
	).length;
	const failed = manifest.features.filter((f) => f.status === "failed").length;

	console.log("\n" + "═".repeat(70));
	console.log("   SUMMARY");
	console.log("═".repeat(70));

	console.log("\n   📊 Results:");
	console.log(
		`      Features: ${completed}/${manifest.execution_plan.total_features} completed`,
	);
	console.log(`      Failed: ${failed}`);
	console.log(
		`      Tasks: ${manifest.progress.tasks_completed}/${manifest.progress.tasks_total}`,
	);

	console.log("\n   🔗 Review URLs:");
	for (const { sandboxId, vscode } of urls) {
		console.log(`      ${sandboxId}: ${vscode}`);
	}

	console.log(`\n   🌿 Merged Branch: ${manifest.sandbox.branch_name}`);

	if (manifest.progress.started_at) {
		const duration = Math.round(
			(Date.now() - new Date(manifest.progress.started_at).getTime()) / 60000,
		);
		console.log(`\n   ⏱️ Duration: ${duration} minutes`);
	}

	console.log("\n   📁 Files:");
	console.log(
		`      Manifest: ${path.join(projectRoot, manifest.metadata.init_dir, "initiative-manifest.json")}`,
	);

	console.log("\n" + "═".repeat(70));

	if (failed > 0) {
		console.log(
			"\n   ⚠️ Some features failed. Review branches and re-run with --resume",
		);
	} else {
		console.log("\n   ✅ Initiative implementation complete!");
	}
}

// ============================================================================
// CLI
// ============================================================================

function parseArgs(): OrchestratorOptions {
	const args = process.argv.slice(2);
	const options: OrchestratorOptions = {
		initiativeId: 0,
		maxParallel: 2, // Default to 2 sandboxes (dual sandbox mode)
		resume: false,
		timeout: 3600, // 1 hour (max for Hobby tier)
		dryRun: false,
	};

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];

		if ((arg === "--parallel" || arg === "-p") && args[i + 1]) {
			// Cap at 2 for Phase 1
			options.maxParallel = Math.min(parseInt(args[i + 1], 10), 2);
			i++;
		} else if (arg === "--single") {
			// Force single sandbox mode
			options.maxParallel = 1;
		} else if (arg === "--resume") {
			options.resume = true;
		} else if (arg === "--timeout" && args[i + 1]) {
			options.timeout = parseInt(args[i + 1], 10);
			i++;
		} else if (arg === "--dry-run") {
			options.dryRun = true;
		} else if (
			!arg.startsWith("--") &&
			!arg.startsWith("-") &&
			!options.initiativeId
		) {
			options.initiativeId = parseInt(arg, 10);
		}
	}

	return options;
}

function showHelp(): void {
	console.log(`
Alpha Initiative Orchestrator (Phase 1: Dual Sandbox)

Usage:
  tsx alpha-orchestrator.ts <initiative-id> [options]

Options:
  --parallel <n>, -p  Number of parallel sandboxes (default: 2, max: 2)
  --single            Force single sandbox mode (equivalent to -p 1)
  --resume            Resume from previous state
  --timeout <s>       Sandbox timeout in seconds (default: 3600)
  --dry-run           Show execution plan without running

Modes:
  Dual sandbox (default):
    - Creates 2 E2B sandboxes in parallel
    - Assigns features to sandboxes by load balancing
    - Merges branches locally after completion
    - ~50% faster for independent features

  Single sandbox (--single):
    - Original behavior with 1 sandbox
    - Sequential feature execution
    - Useful for debugging or when features conflict

Examples:
  tsx alpha-orchestrator.ts 1363              # Dual sandbox (default)
  tsx alpha-orchestrator.ts 1363 --dry-run    # Preview feature assignment
  tsx alpha-orchestrator.ts 1363 --single     # Single sandbox mode
  tsx alpha-orchestrator.ts 1363 -p 1         # Same as --single
  tsx alpha-orchestrator.ts 1363 --resume     # Resume interrupted run

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
