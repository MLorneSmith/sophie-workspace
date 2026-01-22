#!/usr/bin/env npx tsx
/**
 * Refine Orchestrator
 *
 * Lightweight orchestrator for post-implementation refinement workflow.
 * Creates or reconnects to a sandbox on the implementation branch,
 * then runs the /alpha:refine command for targeted debugging.
 *
 * Usage:
 *   tsx refine-orchestrator.ts <spec-id> [options]
 *
 * Options:
 *   --issue "description"    Issue description to fix
 *   --feature <S#.I#.F#>     Scope refinement to specific feature
 *   --timeout <seconds>      Sandbox timeout (default: 3600)
 *   --interactive            Keep sandbox alive for iterative fixes
 *   --reconnect              Reconnect to existing sandbox if available
 *   --force-new              Force create new sandbox
 *   --dry-run                Show what would happen without executing
 */

import process from "node:process";

import { Sandbox } from "@e2b/code-interpreter";

import { parseRefineArgs, showRefineHelp } from "./cli/index.js";
import {
	DEV_SERVER_PORT,
	TEMPLATE_ALIAS,
	WORKSPACE_DIR,
} from "./config/index.js";
import {
	E2B_API_KEY,
	checkEnvironment,
	getAllEnvVars,
	GITHUB_TOKEN,
} from "./lib/environment.js";
import { getProjectRoot } from "./lib/lock.js";
import { findSpecDir, loadManifest, saveManifest } from "./lib/manifest.js";
import {
	createRefinementEntry,
	detectIssueType,
	getBranchFromManifest,
	hasActiveSandbox,
	saveRefinementEntry,
	selectSkillsForIssue,
} from "./lib/refine.js";
import {
	connectToSandboxWithVerification,
	getVSCodeUrl,
	setupGitCredentials,
	startDevServer,
} from "./lib/sandbox.js";
import type { SpecManifest } from "./types/index.js";

// ============================================================================
// Main Orchestrator Logic
// ============================================================================

async function main(): Promise<void> {
	console.log("\n══════════════════════════════════════════════════════════");
	console.log("   ALPHA REFINE ORCHESTRATOR");
	console.log("══════════════════════════════════════════════════════════\n");

	// Parse arguments
	const args = process.argv.slice(2);
	if (args.includes("--help") || args.includes("-h")) {
		showRefineHelp();
		process.exit(0);
	}
	const options = parseRefineArgs();

	// Validate spec ID
	if (!options.specId) {
		console.error("ERROR: Spec ID required");
		console.log("Usage: tsx refine-orchestrator.ts <spec-id> [options]");
		process.exit(1);
	}

	// Check environment
	checkEnvironment();

	// Find spec directory
	const projectRoot = getProjectRoot();
	const specIdNum = parseInt(options.specId, 10);
	const specDir = findSpecDir(projectRoot, specIdNum);

	if (!specDir) {
		console.error(`ERROR: Spec directory not found for ID: ${options.specId}`);
		process.exit(1);
	}

	// Load manifest
	const manifest = loadManifest(specDir);
	if (!manifest) {
		console.error(`ERROR: Manifest not found in: ${specDir}`);
		process.exit(1);
	}

	console.log(`📋 Spec: ${manifest.metadata.spec_name}`);
	console.log(`   Branch: ${getBranchFromManifest(manifest)}`);

	// Detect issue type if issue provided
	if (options.issue) {
		const issueType = detectIssueType(options.issue);
		const skills = selectSkillsForIssue(issueType);
		console.log("\n🔍 Issue Analysis:");
		console.log(`   Description: ${options.issue}`);
		console.log(`   Detected Type: ${issueType}`);
		console.log(`   Skills to invoke: ${skills.join(", ")}`);
	}

	if (options.featureId) {
		const feature = manifest.feature_queue.find(
			(f) => f.id === options.featureId,
		);
		if (feature) {
			console.log(`\n🎯 Feature Scope: ${feature.title}`);
		} else {
			console.warn(`⚠️ Feature not found: ${options.featureId}`);
		}
	}

	// Dry run - show what would happen
	if (options.dryRun) {
		console.log("\n🔍 DRY RUN - Would perform these actions:");
		console.log(
			`   1. ${options.reconnect && hasActiveSandbox(manifest) ? "Reconnect to existing sandbox" : "Create new sandbox"}`,
		);
		console.log(`   2. Checkout branch: ${getBranchFromManifest(manifest)}`);
		console.log("   3. Run /alpha:refine command with issue context");
		if (options.interactive) {
			console.log("   4. Keep sandbox alive for interactive debugging");
		}
		console.log("\n✅ Dry run complete - no changes made");
		return;
	}

	// Get or create sandbox
	let sandbox: Sandbox;

	if (options.reconnect && !options.forceNew && hasActiveSandbox(manifest)) {
		// Try to reconnect to existing sandbox
		const sandboxId = manifest.sandbox.sandbox_ids[0];
		console.log(`\n📦 Reconnecting to existing sandbox: ${sandboxId}`);

		const reconnected = sandboxId
			? await connectToSandboxWithVerification(sandboxId)
			: null;
		if (reconnected) {
			sandbox = reconnected;
			console.log("   ✅ Reconnected successfully");
		} else {
			console.log("   ⚠️ Reconnection failed, creating new sandbox...");
			sandbox = await createRefineSandbox(manifest, options.timeout);
		}
	} else {
		// Create new sandbox
		sandbox = await createRefineSandbox(manifest, options.timeout);
	}

	// Display sandbox URLs
	const vscodeUrl = getVSCodeUrl(sandbox);
	console.log("\n🔗 Sandbox URLs:");
	console.log(`   VS Code: ${vscodeUrl}`);

	// Start dev server if needed for visual debugging
	if (options.issue) {
		const issueType = detectIssueType(options.issue);
		if (
			issueType === "visual" ||
			issueType === "responsive" ||
			issueType === "polish"
		) {
			console.log("\n🚀 Starting dev server for visual debugging...");
			try {
				const devServerUrl = await startDevServer(sandbox);
				console.log(`   Dev Server: ${devServerUrl}`);
			} catch (err) {
				console.warn(`   ⚠️ Dev server failed to start: ${err}`);
			}
		}
	}

	// Build the /alpha:refine command
	const refineArgs: string[] = [`S${options.specId}`];
	if (options.issue) {
		refineArgs.push(`--issue "${options.issue}"`);
	}
	if (options.featureId) {
		refineArgs.push(`--feature ${options.featureId}`);
	}

	const refineCommand = `/alpha:refine ${refineArgs.join(" ")}`;
	console.log(`\n🔧 Running: ${refineCommand}`);

	// Run Claude Code with the refine command
	const startTime = Date.now();
	const result = await runClaudeCode(sandbox, refineCommand);

	// Create refinement entry if issue was provided
	if (options.issue) {
		const issueType = detectIssueType(options.issue);
		const entry = createRefinementEntry(
			options.issue,
			issueType,
			options.featureId,
		);
		entry.duration_seconds = Math.round((Date.now() - startTime) / 1000);
		entry.skills_invoked = selectSkillsForIssue(issueType);
		entry.status = result.success ? "completed" : "failed";
		if (!result.success && result.error) {
			entry.error = result.error;
		}
		saveRefinementEntry(specDir, entry);
		console.log(`\n📝 Refinement entry saved: ${entry.id}`);
	}

	// Handle interactive mode
	if (options.interactive) {
		console.log("\n══════════════════════════════════════════════════════════");
		console.log("   INTERACTIVE MODE");
		console.log("══════════════════════════════════════════════════════════");
		console.log("\n🔗 Sandbox URLs (kept alive for interactive debugging):");
		console.log(`   VS Code: ${vscodeUrl}`);
		console.log(`   Dev Server: https://${sandbox.getHost(DEV_SERVER_PORT)}`);
		console.log("\n⚠️ Press Ctrl+C to terminate sandbox when done");

		// Keep process alive
		await new Promise<void>((resolve) => {
			process.on("SIGINT", () => {
				console.log("\n\n🛑 Shutting down sandbox...");
				sandbox.kill().then(() => {
					console.log("✅ Sandbox terminated");
					resolve();
				});
			});
		});
	} else {
		// Clean up
		console.log("\n🛑 Stopping sandbox...");
		await sandbox.kill();
		console.log("✅ Sandbox terminated");
	}

	console.log("\n══════════════════════════════════════════════════════════");
	console.log("   REFINE COMPLETE");
	console.log("══════════════════════════════════════════════════════════\n");
}

// ============================================================================
// Sandbox Creation
// ============================================================================

async function createRefineSandbox(
	manifest: SpecManifest,
	timeout: number,
): Promise<Sandbox> {
	console.log("\n📦 Creating refine sandbox...");

	const sandbox = await Sandbox.create(TEMPLATE_ALIAS, {
		timeoutMs: timeout * 1000,
		apiKey: E2B_API_KEY,
		envs: getAllEnvVars(),
	});

	console.log(`   ID: ${sandbox.sandboxId}`);

	// Setup git credentials
	if (GITHUB_TOKEN) {
		await setupGitCredentials(sandbox);
	}

	// Get branch name from manifest
	const branchName = getBranchFromManifest(manifest);
	console.log(`   Checking out branch: ${branchName}`);

	// Fetch and checkout branch
	await sandbox.commands.run(`cd ${WORKSPACE_DIR} && git fetch origin`, {
		timeoutMs: 120000,
	});

	await sandbox.commands.run(
		`cd ${WORKSPACE_DIR} && git fetch origin "${branchName}" && git checkout -B "${branchName}" FETCH_HEAD`,
		{ timeoutMs: 60000 },
	);

	// Pull latest changes
	await sandbox.commands.run(
		`cd ${WORKSPACE_DIR} && git pull origin "${branchName}"`,
		{ timeoutMs: 60000 },
	);

	console.log("   ✅ Branch checked out");

	// Install dependencies if needed
	const checkResult = await sandbox.commands.run(
		`cd ${WORKSPACE_DIR} && test -d node_modules && echo "exists" || echo "missing"`,
		{ timeoutMs: 10000 },
	);

	if (checkResult.stdout.trim() === "missing") {
		console.log("   Installing dependencies...");
		await sandbox.commands.run(
			`cd ${WORKSPACE_DIR} && pnpm install --frozen-lockfile`,
			{ timeoutMs: 600000 },
		);
	}

	// Build workspace packages
	console.log("   Building workspace packages...");
	const buildResult = await sandbox.commands.run(
		`cd ${WORKSPACE_DIR} && pnpm --filter @kit/shared build`,
		{ timeoutMs: 120000 },
	);
	if (buildResult.exitCode !== 0) {
		console.warn(
			`   ⚠️ Build warning: ${buildResult.stderr || buildResult.stdout}`,
		);
	}

	// Update manifest with sandbox info
	manifest.sandbox.sandbox_ids = [sandbox.sandboxId];
	manifest.sandbox.created_at = new Date().toISOString();
	saveManifest(manifest);

	console.log("   ✅ Sandbox ready");
	return sandbox;
}

// ============================================================================
// Claude Code Execution
// ============================================================================

interface ClaudeCodeResult {
	success: boolean;
	error?: string;
}

async function runClaudeCode(
	sandbox: Sandbox,
	command: string,
): Promise<ClaudeCodeResult> {
	try {
		// Build the claude command
		const claudeCmd = `cd ${WORKSPACE_DIR} && claude --dangerously-skip-permissions "${command}"`;

		console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
		console.log("Claude Code Output:");
		console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

		// Run with streaming output
		const proc = await sandbox.commands.run(claudeCmd, {
			timeoutMs: 30 * 60 * 1000, // 30 minutes
			onStdout: (data: string): void => {
				void process.stdout.write(data);
			},
			onStderr: (data: string): void => {
				void process.stderr.write(data);
			},
		});

		console.log(
			"\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n",
		);

		if (proc.exitCode !== 0) {
			return {
				success: false,
				error: `Claude Code exited with code ${proc.exitCode}`,
			};
		}

		return { success: true };
	} catch (err) {
		const errorMessage = err instanceof Error ? err.message : String(err);
		console.error(`\n❌ Error running Claude Code: ${errorMessage}`);
		return { success: false, error: errorMessage };
	}
}

// ============================================================================
// Entry Point
// ============================================================================

main().catch((err) => {
	console.error("\n❌ Fatal error:", err);
	process.exit(1);
});
