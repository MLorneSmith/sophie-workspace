#!/usr/bin/env tsx
/**
 * E2B Sandbox CLI - TypeScript CLI for managing E2B cloud sandboxes
 *
 * Usage:
 *   tsx sandbox-cli.ts create [--timeout 300] [--template TEMPLATE]
 *   tsx sandbox-cli.ts list [--json]
 *   tsx sandbox-cli.ts status <sandbox-id>
 *   tsx sandbox-cli.ts kill <sandbox-id>
 *   tsx sandbox-cli.ts kill-all
 *   tsx sandbox-cli.ts diff <sandbox-id>
 *   tsx sandbox-cli.ts pr <sandbox-id> "<commit-message>" [--branch NAME]
 *   tsx sandbox-cli.ts feature "<description>" [--timeout 1800]
 *
 * Requires:
 *   E2B_API_KEY environment variable
 *   GITHUB_TOKEN for git operations (pr, feature commands)
 */

import { Sandbox } from "@e2b/code-interpreter";

const API_KEY = process.env.E2B_API_KEY;

// Claude authentication - OAuth token takes precedence (for Max plan users)
// Generate OAuth token with: claude setup-token
const CLAUDE_CODE_OAUTH_TOKEN = process.env.CLAUDE_CODE_OAUTH_TOKEN;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// GitHub authentication for git operations
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// Default template for SlideHeroes project
const DEFAULT_TEMPLATE = "slideheroes-claude-agent";

// Repository configuration
const REPO_OWNER = "slideheroes";
const REPO_NAME = "2025slideheroes";
const WORKSPACE_DIR = "/home/user/slideheroes";

function checkApiKey(): void {
	if (!API_KEY) {
		console.error("ERROR: E2B_API_KEY environment variable not set");
		console.error("Get your API key from: https://e2b.dev/dashboard");
		process.exit(1);
	}
}

function checkClaudeAuth(): void {
	if (!CLAUDE_CODE_OAUTH_TOKEN && !ANTHROPIC_API_KEY) {
		console.error("ERROR: No Claude authentication found");
		console.error("Set one of:");
		console.error(
			"  - CLAUDE_CODE_OAUTH_TOKEN (for Max plan - generate with: claude setup-token)",
		);
		console.error("  - ANTHROPIC_API_KEY (for API access)");
		process.exit(1);
	}
}

function getClaudeEnvVars(): Record<string, string> {
	// OAuth token takes precedence (for Max plan users)
	if (CLAUDE_CODE_OAUTH_TOKEN) {
		return { CLAUDE_CODE_OAUTH_TOKEN };
	}
	if (ANTHROPIC_API_KEY) {
		return { ANTHROPIC_API_KEY };
	}
	return {};
}

function getClaudeAuthType(): string {
	if (CLAUDE_CODE_OAUTH_TOKEN) return "OAuth (Max plan)";
	if (ANTHROPIC_API_KEY) return "API Key";
	return "None";
}

function checkGitHubToken(): void {
	if (!GITHUB_TOKEN) {
		console.error("ERROR: GITHUB_TOKEN environment variable not set");
		console.error("Required for git operations (pr, feature commands)");
		console.error("Create a token at: https://github.com/settings/tokens");
		process.exit(1);
	}
}

function getGitEnvVars(): Record<string, string> {
	const envs: Record<string, string> = {};
	if (GITHUB_TOKEN) {
		envs.GITHUB_TOKEN = GITHUB_TOKEN;
	}
	return envs;
}

function getAllEnvVars(): Record<string, string> {
	return {
		...getClaudeEnvVars(),
		...getGitEnvVars(),
	};
}

/**
 * Setup git credentials in the sandbox using GITHUB_TOKEN
 * Configures git to use token-based auth for push operations
 */
async function setupGitCredentials(sandbox: Sandbox): Promise<void> {
	if (!GITHUB_TOKEN) {
		console.log("Warning: GITHUB_TOKEN not set, git push will not work");
		return;
	}

	console.log("Configuring git credentials...");

	// Configure git credential helper to use the token
	const commands = [
		// Set git user info
		'git config --global user.name "SlideHeroes Sandbox"',
		'git config --global user.email "sandbox@slideheroes.dev"',
		// Configure credential helper to use the token from environment
		"git config --global credential.helper store",
		// Store credentials for GitHub
		`echo "https://x-access-token:${GITHUB_TOKEN}@github.com" > ~/.git-credentials`,
		"chmod 600 ~/.git-credentials",
		// Configure push behavior
		"git config --global push.default current",
		"git config --global push.autoSetupRemote true",
	];

	for (const cmd of commands) {
		await sandbox.commands.run(cmd, { timeoutMs: 10000 });
	}

	console.log("Git credentials configured");
}

/**
 * Generate a branch name from description
 */
function generateBranchName(description: string): string {
	const timestamp = Date.now().toString(36);
	const slug = description
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "")
		.slice(0, 40);
	return `sandbox/${slug}-${timestamp}`;
}

async function createSandbox(
	timeout: number = 300,
	template: string = DEFAULT_TEMPLATE,
	setupGit: boolean = true,
): Promise<Sandbox> {
	checkApiKey();

	const allEnvVars = getAllEnvVars();
	const hasEnvVars = Object.keys(allEnvVars).length > 0;

	console.log(
		`Creating sandbox (timeout: ${timeout}s, template: ${template})...`,
	);
	console.log(`Claude auth: ${getClaudeAuthType()}`);
	console.log(`GitHub auth: ${GITHUB_TOKEN ? "Configured" : "Not set"}`);

	try {
		const opts = {
			timeoutMs: timeout * 1000,
			apiKey: API_KEY,
			envs: hasEnvVars ? allEnvVars : undefined,
		};

		const sandbox = await Sandbox.create(template, opts);

		// Setup git credentials if token is available
		if (setupGit && GITHUB_TOKEN) {
			await setupGitCredentials(sandbox);
		}

		console.log("\n=== Sandbox Created ===");
		console.log(`ID:       ${sandbox.sandboxId}`);
		console.log(`Timeout:  ${timeout} seconds`);
		console.log(`Template: ${template}`);
		console.log(`Git:      ${GITHUB_TOKEN ? "Configured" : "Not configured"}`);
		console.log("\nTo connect: /sandbox status " + sandbox.sandboxId);
		console.log("To kill:    /sandbox kill " + sandbox.sandboxId);

		return sandbox;
	} catch (error) {
		console.error(
			"Failed to create sandbox:",
			error instanceof Error ? error.message : error,
		);
		process.exit(1);
	}
}

async function runClaude(
	prompt: string,
	sandboxId?: string,
	timeout: number = 600,
): Promise<void> {
	checkApiKey();
	checkClaudeAuth();

	let sandbox: Sandbox;
	let createdSandbox = false;

	try {
		if (sandboxId) {
			console.log(`Connecting to sandbox ${sandboxId}...`);
			sandbox = await Sandbox.connect(sandboxId, { apiKey: API_KEY });
		} else {
			sandbox = await createSandbox(timeout);
			createdSandbox = true;
		}

		console.log(`\nRunning Claude Code with prompt: "${prompt}"`);
		console.log(`Authentication: ${getClaudeAuthType()}`);
		console.log("=== Claude Code Output ===\n");

		// Run Claude Code in the sandbox with streaming output
		const result = await sandbox.commands.run(
			`run-claude "${prompt.replace(/"/g, '\\"')}"`,
			{
				timeoutMs: 0, // No timeout for long-running Claude tasks
				envs: getClaudeEnvVars(),
				onStdout: (data) => process.stdout.write(data),
				onStderr: (data) => process.stderr.write(data),
			},
		);

		console.log(`\n\nExit code: ${result.exitCode}`);

		if (createdSandbox) {
			console.log(`\nSandbox ${sandbox.sandboxId} is still running.`);
			console.log(
				"To continue using it: /sandbox run-claude --sandbox " +
					sandbox.sandboxId +
					' "your prompt"',
			);
			console.log("To kill it: /sandbox kill " + sandbox.sandboxId);
		}
	} catch (error) {
		console.error(
			"Failed to run Claude:",
			error instanceof Error ? error.message : error,
		);
		process.exit(1);
	}
}

async function listSandboxes(jsonOutput: boolean = false): Promise<void> {
	checkApiKey();

	try {
		const sandboxes = await Sandbox.list({ apiKey: API_KEY });

		if (sandboxes.length === 0) {
			console.log("No running sandboxes found");
			return;
		}

		if (jsonOutput) {
			const output = sandboxes.map((s) => ({
				id: s.sandboxId,
				templateId: s.templateId,
				startedAt: s.startedAt?.toISOString(),
				metadata: s.metadata,
			}));
			console.log(JSON.stringify(output, null, 2));
		} else {
			console.log(`Found ${sandboxes.length} sandbox(es):\n`);
			console.log(
				`${"ID".padEnd(40)} ${"Template".padEnd(20)} ${"Started".padEnd(25)}`,
			);
			console.log("-".repeat(90));

			for (const s of sandboxes) {
				const started = s.startedAt
					? s.startedAt.toISOString().replace("T", " ").slice(0, 19)
					: "N/A";
				const template = s.templateId || "default";
				console.log(
					`${s.sandboxId.padEnd(40)} ${template.padEnd(20)} ${started.padEnd(25)}`,
				);
			}
		}
	} catch (error) {
		console.error(
			"Failed to list sandboxes:",
			error instanceof Error ? error.message : error,
		);
		process.exit(1);
	}
}

async function checkStatus(sandboxId: string): Promise<void> {
	checkApiKey();

	try {
		const sandbox = await Sandbox.connect(sandboxId, { apiKey: API_KEY });
		const isRunning = await sandbox.isRunning();

		console.log(`Sandbox ${sandboxId}: ${isRunning ? "RUNNING" : "STOPPED"}`);
	} catch (error) {
		console.error(
			`Failed to check sandbox ${sandboxId}:`,
			error instanceof Error ? error.message : error,
		);
		process.exit(1);
	}
}

async function killSandbox(sandboxId: string): Promise<void> {
	checkApiKey();

	try {
		const sandbox = await Sandbox.connect(sandboxId, { apiKey: API_KEY });
		await sandbox.kill();
		console.log(`Killed sandbox: ${sandboxId}`);
	} catch (error) {
		console.error(
			`Failed to kill sandbox ${sandboxId}:`,
			error instanceof Error ? error.message : error,
		);
		process.exit(1);
	}
}

async function killAllSandboxes(): Promise<void> {
	checkApiKey();

	try {
		const sandboxes = await Sandbox.list({ apiKey: API_KEY });

		if (sandboxes.length === 0) {
			console.log("No running sandboxes to kill");
			return;
		}

		console.log(`Killing ${sandboxes.length} sandbox(es)...`);

		let killed = 0;
		for (const s of sandboxes) {
			try {
				const sandbox = await Sandbox.connect(s.sandboxId, { apiKey: API_KEY });
				await sandbox.kill();
				console.log(`  Killed: ${s.sandboxId}`);
				killed++;
			} catch {
				console.log(`  Failed: ${s.sandboxId}`);
			}
		}

		console.log(`\nKilled ${killed}/${sandboxes.length} sandboxes`);
	} catch (error) {
		console.error(
			"Failed to kill sandboxes:",
			error instanceof Error ? error.message : error,
		);
		process.exit(1);
	}
}

// ============================================================================
// Review Server & URL Generation
// ============================================================================

const REVIEW_SERVER_PORT = 8080;

/**
 * Start a simple HTTP server for reviewing sandbox files
 * Returns the publicly accessible review URL
 */
async function startReviewServer(sandbox: Sandbox): Promise<string> {
	console.log("Starting review server...");

	// Start Python HTTP server in background
	await sandbox.commands.run(
		`cd ${WORKSPACE_DIR} && python3 -m http.server ${REVIEW_SERVER_PORT} > /tmp/review-server.log 2>&1 &`,
		{ timeoutMs: 10000 },
	);

	// Give server a moment to start
	await new Promise((resolve) => setTimeout(resolve, 1000));

	// Get the public URL
	const host = sandbox.getHost(REVIEW_SERVER_PORT);
	const reviewURL = `https://${host}`;

	console.log(`Review server started at: ${reviewURL}`);
	return reviewURL;
}

/**
 * Get git diff summary for review output
 */
async function getReviewSummary(sandbox: Sandbox): Promise<{
	status: string;
	diffStat: string;
	changedFiles: string[];
}> {
	const statusResult = await sandbox.commands.run(
		`cd ${WORKSPACE_DIR} && git status --porcelain`,
		{ timeoutMs: 30000 },
	);

	const diffStatResult = await sandbox.commands.run(
		`cd ${WORKSPACE_DIR} && git diff HEAD --stat`,
		{ timeoutMs: 30000 },
	);

	const changedFiles = (statusResult.stdout || "")
		.split("\n")
		.filter((line) => line.trim())
		.map((line) => line.substring(3));

	return {
		status: statusResult.stdout || "",
		diffStat: diffStatResult.stdout || "",
		changedFiles,
	};
}

// ============================================================================
// Phase 2: Git Operations (diff, pr)
// ============================================================================

/**
 * Show git diff of changes in a sandbox
 */
async function showDiff(sandboxId: string): Promise<void> {
	checkApiKey();

	try {
		console.log(`Connecting to sandbox ${sandboxId}...`);
		const sandbox = await Sandbox.connect(sandboxId, { apiKey: API_KEY });

		console.log("\n=== Git Status ===\n");

		// Show git status
		const statusResult = await sandbox.commands.run(
			`cd ${WORKSPACE_DIR} && git status --short`,
			{ timeoutMs: 30000 },
		);
		if (statusResult.stdout) {
			console.log(statusResult.stdout);
		} else {
			console.log("No changes detected");
		}

		console.log("\n=== Git Diff ===\n");

		// Show git diff (staged and unstaged)
		const diffResult = await sandbox.commands.run(
			`cd ${WORKSPACE_DIR} && git diff HEAD --stat`,
			{ timeoutMs: 30000 },
		);
		if (diffResult.stdout) {
			console.log(diffResult.stdout);
		}

		// Show detailed diff
		const detailedDiff = await sandbox.commands.run(
			`cd ${WORKSPACE_DIR} && git diff HEAD`,
			{ timeoutMs: 60000 },
		);
		if (detailedDiff.stdout) {
			console.log("\n=== Detailed Changes ===\n");
			console.log(detailedDiff.stdout);
		}
	} catch (error) {
		console.error(
			"Failed to get diff:",
			error instanceof Error ? error.message : error,
		);
		process.exit(1);
	}
}

/**
 * Create a PR from sandbox changes
 */
async function createPR(
	sandboxId: string,
	commitMessage: string,
	branchName?: string,
): Promise<void> {
	checkApiKey();
	checkGitHubToken();

	try {
		console.log(`Connecting to sandbox ${sandboxId}...`);
		const sandbox = await Sandbox.connect(sandboxId, {
			apiKey: API_KEY,
			envs: getGitEnvVars(),
		});

		// Setup git credentials
		await setupGitCredentials(sandbox);

		// Check for changes
		console.log("\nChecking for changes...");
		const statusResult = await sandbox.commands.run(
			`cd ${WORKSPACE_DIR} && git status --porcelain`,
			{ timeoutMs: 30000 },
		);

		if (!statusResult.stdout?.trim()) {
			console.log("No changes to commit");
			return;
		}

		console.log("Changes detected:");
		console.log(statusResult.stdout);

		// Generate branch name if not provided
		const branch = branchName || generateBranchName(commitMessage);
		console.log(`\nCreating branch: ${branch}`);

		// Create and checkout new branch
		const branchResult = await sandbox.commands.run(
			`cd ${WORKSPACE_DIR} && git checkout -b "${branch}"`,
			{ timeoutMs: 30000 },
		);
		if (branchResult.exitCode !== 0) {
			console.error("Failed to create branch:", branchResult.stderr);
			process.exit(1);
		}

		// Stage all changes
		console.log("Staging changes...");
		await sandbox.commands.run(`cd ${WORKSPACE_DIR} && git add -A`, {
			timeoutMs: 30000,
		});

		// Commit changes
		console.log("Committing changes...");
		const fullMessage = `${commitMessage}

🤖 Generated with Claude Code in E2B Sandbox

Co-Authored-By: Claude <noreply@anthropic.com>`;

		const commitResult = await sandbox.commands.run(
			`cd ${WORKSPACE_DIR} && git commit -m "${fullMessage.replace(/"/g, '\\"')}"`,
			{ timeoutMs: 30000 },
		);

		if (commitResult.exitCode !== 0) {
			console.error("Failed to commit:", commitResult.stderr);
			process.exit(1);
		}

		// Push to remote
		console.log("Pushing to remote...");
		const pushResult = await sandbox.commands.run(
			`cd ${WORKSPACE_DIR} && git push -u origin "${branch}"`,
			{
				timeoutMs: 120000,
				envs: getGitEnvVars(),
			},
		);

		if (pushResult.exitCode !== 0) {
			console.error("Failed to push:", pushResult.stderr);
			process.exit(1);
		}

		// Create PR using GitHub CLI or API
		console.log("\nCreating Pull Request...");
		const prBody = `## Summary

${commitMessage}

## Changes

\`\`\`
${statusResult.stdout}
\`\`\`

---
🤖 Generated with Claude Code in E2B Sandbox
Sandbox ID: ${sandboxId}`;

		// Use gh CLI to create PR
		if (!GITHUB_TOKEN) {
			checkGitHubToken();
		}
		const prResult = await sandbox.commands.run(
			`cd ${WORKSPACE_DIR} && gh pr create --title "${commitMessage.replace(/"/g, '\\"')}" --body "${prBody.replace(/"/g, '\\"')}" --base dev`,
			{
				timeoutMs: 60000,
				envs: { ...getGitEnvVars(), GH_TOKEN: GITHUB_TOKEN },
			},
		);

		if (prResult.exitCode === 0 && prResult.stdout) {
			console.log("\n=== Pull Request Created ===");
			console.log(prResult.stdout);
		} else {
			// Fallback: just show the branch URL
			console.log("\n=== Branch Pushed ===");
			console.log(`Branch: ${branch}`);
			console.log(
				`Create PR at: https://github.com/${REPO_OWNER}/${REPO_NAME}/compare/dev...${branch}`,
			);
			if (prResult.stderr) {
				console.log("\nNote: gh CLI not available, manual PR creation needed");
			}
		}
	} catch (error) {
		console.error(
			"Failed to create PR:",
			error instanceof Error ? error.message : error,
		);
		process.exit(1);
	}
}

// ============================================================================
// Phase 3: Full Feature Workflow
// ============================================================================

/**
 * Full feature workflow: create sandbox, run feature, pause for review (default)
 * Use --no-review to skip the review step and auto-push
 */
async function runFeatureWorkflow(
	description: string,
	timeout: number = 1800,
	skipReview: boolean = false,
): Promise<void> {
	checkApiKey();
	checkClaudeAuth();

	// Only require GitHub token if skipping review (auto-push mode)
	if (skipReview) {
		checkGitHubToken();
	}

	console.log("=== SlideHeroes Feature Workflow ===\n");
	console.log(`Feature: ${description}`);
	console.log(`Timeout: ${timeout}s`);
	console.log(
		`Review: ${skipReview ? "DISABLED (auto-push)" : "ENABLED (default)"}`,
	);
	console.log("");

	let sandbox: Sandbox | null = null;

	try {
		// Step 1: Create sandbox with git configured
		console.log("Step 1/4: Creating sandbox...");
		sandbox = await createSandbox(timeout, DEFAULT_TEMPLATE, true);
		const sandboxId = sandbox.sandboxId;

		// Step 2: Create feature branch
		console.log("\nStep 2/4: Creating feature branch...");
		const branchName = generateBranchName(description);
		const branchResult = await sandbox.commands.run(
			`cd ${WORKSPACE_DIR} && git checkout -b "${branchName}"`,
			{ timeoutMs: 30000 },
		);

		if (branchResult.exitCode !== 0) {
			throw new Error(`Failed to create branch: ${branchResult.stderr}`);
		}
		console.log(`Branch created: ${branchName}`);

		// Store branch name in sandbox metadata file for later use
		await sandbox.commands.run(
			`echo '${JSON.stringify({ branchName, description })}' > ${WORKSPACE_DIR}/.sandbox-metadata.json`,
			{ timeoutMs: 10000 },
		);

		// Step 3: Run Claude Code with /feature command
		console.log("\nStep 3/4: Running Claude Code /feature command...");
		console.log("=== Claude Code Output ===\n");

		const featurePrompt = `/feature ${description}`;
		const claudeResult = await sandbox.commands.run(
			`run-claude "${featurePrompt.replace(/"/g, '\\"')}"`,
			{
				timeoutMs: 0, // No timeout for long-running Claude tasks
				envs: getAllEnvVars(),
				onStdout: (data) => process.stdout.write(data),
				onStderr: (data) => process.stderr.write(data),
			},
		);

		console.log(`\n\nClaude Code exit code: ${claudeResult.exitCode}`);

		// Step 4: Check for changes
		console.log("\nStep 4/4: Checking for changes...");
		const reviewSummary = await getReviewSummary(sandbox);

		if (!reviewSummary.status.trim()) {
			console.log("No changes were made by Claude Code");
			console.log(`Sandbox ${sandboxId} is still running for manual work`);
			console.log("To kill: /sandbox kill " + sandboxId);
			return;
		}

		console.log("Changes detected:");
		console.log(reviewSummary.status);

		if (skipReview) {
			// Auto-push mode: commit, push, create PR immediately
			await pushAndCreatePR(
				sandbox,
				sandboxId,
				branchName,
				description,
				reviewSummary.status,
			);
		} else {
			// Review mode (default): pause for human review
			await pauseForReview(
				sandbox,
				sandboxId,
				branchName,
				description,
				reviewSummary,
			);
		}
	} catch (error) {
		console.error(
			"\nFeature workflow failed:",
			error instanceof Error ? error.message : error,
		);

		if (sandbox) {
			console.log(
				`\nSandbox ${sandbox.sandboxId} is still running for debugging.`,
			);
			console.log("To kill: /sandbox kill " + sandbox.sandboxId);
		}

		process.exit(1);
	}
}

/**
 * Pause the workflow for human review
 */
async function pauseForReview(
	sandbox: Sandbox,
	sandboxId: string,
	branchName: string,
	description: string,
	reviewSummary: { status: string; diffStat: string; changedFiles: string[] },
): Promise<void> {
	// Stage changes (but don't commit yet)
	await sandbox.commands.run(`cd ${WORKSPACE_DIR} && git add -A`, {
		timeoutMs: 30000,
	});

	// Start review server
	const reviewURL = await startReviewServer(sandbox);

	console.log("\n" + "=".repeat(60));
	console.log("=== READY FOR REVIEW ===");
	console.log("=".repeat(60));
	console.log("");
	console.log(`Sandbox ID:   ${sandboxId}`);
	console.log(`Branch:       ${branchName}`);
	console.log(`Description:  ${description}`);
	console.log("");
	console.log("📁 Browse Files:");
	console.log(`   ${reviewURL}`);
	console.log("");
	console.log("📊 Changes Summary:");
	if (reviewSummary.diffStat) {
		console.log(reviewSummary.diffStat);
	}
	console.log("");
	console.log("📋 Changed Files:");
	for (const file of reviewSummary.changedFiles) {
		console.log(`   - ${file}`);
	}
	console.log("");
	console.log("=".repeat(60));
	console.log("NEXT STEPS:");
	console.log("=".repeat(60));
	console.log("");
	console.log("1. Review the changes using the URL above or:");
	console.log(`   /sandbox diff ${sandboxId}`);
	console.log("");
	console.log("2. Optionally run /review in the sandbox:");
	console.log(`   /sandbox review ${sandboxId}`);
	console.log("");
	console.log("3. When satisfied, approve to push and create PR:");
	console.log(`   /sandbox approve ${sandboxId}`);
	console.log("");
	console.log("4. Or reject to discard changes and cleanup:");
	console.log(`   /sandbox reject ${sandboxId}`);
	console.log("");
	console.log("=".repeat(60));
}

/**
 * Push changes and create PR (used by both auto-push and approve)
 */
async function pushAndCreatePR(
	sandbox: Sandbox,
	sandboxId: string,
	branchName: string,
	description: string,
	statusOutput: string,
): Promise<void> {
	checkGitHubToken();

	// Stage and commit
	await sandbox.commands.run(`cd ${WORKSPACE_DIR} && git add -A`, {
		timeoutMs: 30000,
	});

	const commitMessage = `feat: ${description}`;
	const fullCommitMessage = `${commitMessage}

🤖 Generated with Claude Code in E2B Sandbox

Co-Authored-By: Claude <noreply@anthropic.com>`;

	const commitResult = await sandbox.commands.run(
		`cd ${WORKSPACE_DIR} && git commit -m "${fullCommitMessage.replace(/"/g, '\\"')}"`,
		{ timeoutMs: 30000 },
	);

	if (commitResult.exitCode !== 0) {
		throw new Error(`Failed to commit: ${commitResult.stderr}`);
	}
	console.log("Changes committed");

	// Push to remote
	console.log("Pushing to remote...");
	const pushResult = await sandbox.commands.run(
		`cd ${WORKSPACE_DIR} && git push -u origin "${branchName}"`,
		{
			timeoutMs: 120000,
			envs: getGitEnvVars(),
		},
	);

	if (pushResult.exitCode !== 0) {
		throw new Error(`Failed to push: ${pushResult.stderr}`);
	}

	// Create PR
	console.log("Creating Pull Request...");
	const prBody = `## Summary

${description}

## Changes

\`\`\`
${statusOutput}
\`\`\`

## Generated By

- **Tool**: Claude Code in E2B Sandbox
- **Sandbox ID**: ${sandboxId}
- **Branch**: ${branchName}

---
🤖 Generated with Claude Code in E2B Sandbox`;

	const prResult = await sandbox.commands.run(
		`cd ${WORKSPACE_DIR} && gh pr create --title "${commitMessage.replace(/"/g, '\\"')}" --body "${prBody.replace(/"/g, '\\"')}" --base dev`,
		{
			timeoutMs: 60000,
			envs: { ...getGitEnvVars(), GH_TOKEN: GITHUB_TOKEN! },
		},
	);

	console.log("\n=== Feature Workflow Complete ===\n");

	if (prResult.exitCode === 0 && prResult.stdout) {
		console.log("Pull Request created:");
		console.log(prResult.stdout);
	} else {
		console.log(`Branch pushed: ${branchName}`);
		console.log(
			`Create PR at: https://github.com/${REPO_OWNER}/${REPO_NAME}/compare/dev...${branchName}`,
		);
		if (!GITHUB_TOKEN) {
			checkGitHubToken();
		}
	}

	console.log(`\nSandbox ${sandboxId} is still running.`);
	console.log(
		"To continue working: /sandbox run-claude --sandbox " +
			sandboxId +
			' "your prompt"',
	);
	console.log("To kill: /sandbox kill " + sandboxId);
}

/**
 * Create a branch in a sandbox
 */
async function createBranch(
	sandboxId: string,
	branchName: string,
): Promise<void> {
	checkApiKey();

	try {
		console.log(`Connecting to sandbox ${sandboxId}...`);
		const sandbox = await Sandbox.connect(sandboxId, { apiKey: API_KEY });

		console.log(`Creating branch: ${branchName}`);
		const result = await sandbox.commands.run(
			`cd ${WORKSPACE_DIR} && git checkout -b "${branchName}"`,
			{ timeoutMs: 30000 },
		);

		if (result.exitCode === 0) {
			console.log(`Branch '${branchName}' created and checked out`);
		} else {
			console.error("Failed to create branch:", result.stderr);
			process.exit(1);
		}
	} catch (error) {
		console.error(
			"Failed to create branch:",
			error instanceof Error ? error.message : error,
		);
		process.exit(1);
	}
}

// ============================================================================
// Phase 4: Review Workflow Commands (review, approve, reject)
// ============================================================================

/**
 * Get sandbox metadata (branch name, description) stored during feature workflow
 */
async function getSandboxMetadata(
	sandbox: Sandbox,
): Promise<{ branchName: string; description: string } | null> {
	try {
		const result = await sandbox.commands.run(
			`cat ${WORKSPACE_DIR}/.sandbox-metadata.json 2>/dev/null || echo ""`,
			{ timeoutMs: 10000 },
		);
		if (result.stdout?.trim()) {
			return JSON.parse(result.stdout.trim());
		}
	} catch {
		// Metadata file doesn't exist or is invalid
	}
	return null;
}

/**
 * Run /review command in sandbox to review changes
 */
async function runReview(sandboxId: string): Promise<void> {
	checkApiKey();
	checkClaudeAuth();

	try {
		console.log(`Connecting to sandbox ${sandboxId}...`);
		const sandbox = await Sandbox.connect(sandboxId, { apiKey: API_KEY });

		// Get current changes summary
		const reviewSummary = await getReviewSummary(sandbox);

		if (!reviewSummary.status.trim()) {
			console.log("No changes to review in this sandbox");
			return;
		}

		console.log("=== Current Changes ===\n");
		console.log(reviewSummary.status);
		console.log("");
		if (reviewSummary.diffStat) {
			console.log(reviewSummary.diffStat);
		}

		console.log("\n=== Running Claude Code /review ===\n");

		// Run /review command
		const result = await sandbox.commands.run(`run-claude "/review"`, {
			timeoutMs: 0,
			envs: getClaudeEnvVars(),
			onStdout: (data) => process.stdout.write(data),
			onStderr: (data) => process.stderr.write(data),
		});

		console.log(`\n\nReview exit code: ${result.exitCode}`);
		console.log("");
		console.log("=".repeat(60));
		console.log("NEXT STEPS:");
		console.log("=".repeat(60));
		console.log("");
		console.log("If satisfied with the review, approve to push:");
		console.log(`  /sandbox approve ${sandboxId}`);
		console.log("");
		console.log("Or reject to discard changes:");
		console.log(`  /sandbox reject ${sandboxId}`);
		console.log("");
	} catch (error) {
		console.error(
			"Failed to run review:",
			error instanceof Error ? error.message : error,
		);
		process.exit(1);
	}
}

/**
 * Approve changes in sandbox: commit, push, create PR
 */
async function approveChanges(
	sandboxId: string,
	customMessage?: string,
): Promise<void> {
	checkApiKey();
	checkGitHubToken();

	try {
		console.log(`Connecting to sandbox ${sandboxId}...`);
		const sandbox = await Sandbox.connect(sandboxId, {
			apiKey: API_KEY,
			envs: getGitEnvVars(),
		});

		// Setup git credentials
		await setupGitCredentials(sandbox);

		// Get metadata from feature workflow
		const metadata = await getSandboxMetadata(sandbox);
		let branchName: string;
		let description: string;

		if (metadata) {
			branchName = metadata.branchName;
			description = customMessage || metadata.description;
			console.log(`Found metadata - Branch: ${branchName}`);
		} else {
			// Get current branch name if no metadata
			const branchResult = await sandbox.commands.run(
				`cd ${WORKSPACE_DIR} && git branch --show-current`,
				{ timeoutMs: 10000 },
			);
			branchName = branchResult.stdout?.trim() || "";

			if (!branchName || branchName === "dev" || branchName === "main") {
				// Need to create a new branch
				branchName = generateBranchName(customMessage || "sandbox-changes");
				console.log(`Creating new branch: ${branchName}`);
				await sandbox.commands.run(
					`cd ${WORKSPACE_DIR} && git checkout -b "${branchName}"`,
					{ timeoutMs: 30000 },
				);
			}

			description = customMessage || "Sandbox changes";
		}

		// Get changes summary
		const reviewSummary = await getReviewSummary(sandbox);

		if (!reviewSummary.status.trim()) {
			console.log("No changes to approve");
			return;
		}

		console.log("\n=== Approving Changes ===\n");
		console.log(`Branch: ${branchName}`);
		console.log(`Description: ${description}`);
		console.log("");
		console.log("Changes:");
		console.log(reviewSummary.status);

		// Push and create PR
		await pushAndCreatePR(
			sandbox,
			sandboxId,
			branchName,
			description,
			reviewSummary.status,
		);

		console.log("\n=== Changes Approved and Pushed ===\n");
	} catch (error) {
		console.error(
			"Failed to approve changes:",
			error instanceof Error ? error.message : error,
		);
		process.exit(1);
	}
}

/**
 * Reject changes: discard all changes and kill sandbox
 */
async function rejectChanges(
	sandboxId: string,
	keepSandbox: boolean = false,
): Promise<void> {
	checkApiKey();

	try {
		console.log(`Connecting to sandbox ${sandboxId}...`);
		const sandbox = await Sandbox.connect(sandboxId, { apiKey: API_KEY });

		// Get changes summary before discarding
		const reviewSummary = await getReviewSummary(sandbox);

		if (reviewSummary.status.trim()) {
			console.log("\n=== Discarding Changes ===\n");
			console.log("The following changes will be discarded:");
			console.log(reviewSummary.status);
			console.log("");

			// Reset all changes
			await sandbox.commands.run(
				`cd ${WORKSPACE_DIR} && git checkout -- . && git clean -fd`,
				{ timeoutMs: 30000 },
			);
			console.log("Changes discarded");
		} else {
			console.log("No changes to discard");
		}

		if (keepSandbox) {
			console.log(`\nSandbox ${sandboxId} is still running.`);
			console.log("To kill: /sandbox kill " + sandboxId);
		} else {
			// Kill the sandbox
			console.log("\nKilling sandbox...");
			await sandbox.kill();
			console.log(`Sandbox ${sandboxId} terminated`);
		}

		console.log("\n=== Changes Rejected ===\n");
	} catch (error) {
		console.error(
			"Failed to reject changes:",
			error instanceof Error ? error.message : error,
		);
		process.exit(1);
	}
}

function showHelp(): void {
	console.log(`
E2B Sandbox Manager - Commands:

  BASIC OPERATIONS:
  create [--timeout 300] [--template NAME]  Create a new sandbox
                                            (default template: ${DEFAULT_TEMPLATE})
  list [--json]                             List running sandboxes
  status <sandbox-id>                       Check sandbox status
  kill <sandbox-id>                         Kill a specific sandbox
  kill-all                                  Kill all sandboxes

  CLAUDE CODE:
  run-claude "<prompt>" [--sandbox ID]      Run Claude Code with a prompt
              [--timeout 600]

  GIT OPERATIONS:
  diff <sandbox-id>                         Show git diff in sandbox
  branch <sandbox-id> "<name>"              Create a new branch
  pr <sandbox-id> "<message>"               Create PR from sandbox changes
              [--branch NAME]

  FEATURE WORKFLOW (with review by default):
  feature "<description>"                   Full workflow: create sandbox,
              [--timeout 1800]              run /feature, PAUSE for review
              [--no-review]                 Add --no-review to auto-push

  REVIEW COMMANDS:
  review <sandbox-id>                       Run /review command in sandbox
  approve <sandbox-id> ["message"]          Approve changes: commit, push, create PR
  reject <sandbox-id> [--keep]              Reject changes: discard and kill sandbox
                                            Use --keep to keep sandbox alive

Examples:
  # Basic operations
  /sandbox create                           Create sandbox with slideheroes template
  /sandbox list                             List running sandboxes
  /sandbox kill abc123                      Kill sandbox abc123

  # Run Claude Code
  /sandbox run-claude "/test 1"             Run /test 1 in new sandbox
  /sandbox run-claude "Fix auth" --sandbox abc123

  # Git operations
  /sandbox diff abc123                      View changes in sandbox
  /sandbox pr abc123 "Fix auth bug"         Create PR from sandbox changes

  # Feature workflow (DEFAULT: pauses for review)
  /sandbox feature "Add dark mode toggle"   Creates sandbox, runs /feature,
                                            PAUSES for review (review URL provided)

  # After review, approve or reject:
  /sandbox review abc123                    Run /review in sandbox
  /sandbox approve abc123                   Approve: commit, push, create PR
  /sandbox reject abc123                    Reject: discard changes, kill sandbox

  # Skip review (auto-push like before)
  /sandbox feature "Quick fix" --no-review  Creates sandbox, runs /feature,
                                            auto-commits, pushes, creates PR

Requirements:
  - E2B_API_KEY: Required for all operations
  - CLAUDE_CODE_OAUTH_TOKEN or ANTHROPIC_API_KEY: For Claude Code operations
  - GITHUB_TOKEN: For git operations (pr, approve, feature --no-review)

Get E2B API key: https://e2b.dev/dashboard
Create GitHub token: https://github.com/settings/tokens
`);
}

// Parse arguments
async function main(): Promise<void> {
	const args = process.argv.slice(2);
	const command = args[0];

	switch (command) {
		case "create": {
			let timeout = 300;
			let template: string | undefined;

			for (let i = 1; i < args.length; i++) {
				if (args[i] === "--timeout" && args[i + 1]) {
					timeout = parseInt(args[i + 1], 10);
					i++;
				} else if (args[i] === "--template" && args[i + 1]) {
					template = args[i + 1];
					i++;
				}
			}

			await createSandbox(timeout, template);
			break;
		}

		case "list": {
			const jsonOutput = args.includes("--json");
			await listSandboxes(jsonOutput);
			break;
		}

		case "status": {
			const sandboxId = args[1];
			if (!sandboxId) {
				console.error("Usage: sandbox-cli.ts status <sandbox-id>");
				process.exit(1);
			}
			await checkStatus(sandboxId);
			break;
		}

		case "kill": {
			const sandboxId = args[1];
			if (!sandboxId) {
				console.error("Usage: sandbox-cli.ts kill <sandbox-id>");
				process.exit(1);
			}
			await killSandbox(sandboxId);
			break;
		}

		case "kill-all":
			await killAllSandboxes();
			break;

		case "run-claude": {
			let prompt: string | undefined;
			let sandboxId: string | undefined;
			let timeout = 600;

			for (let i = 1; i < args.length; i++) {
				if (args[i] === "--sandbox" && args[i + 1]) {
					sandboxId = args[i + 1];
					i++;
				} else if (args[i] === "--timeout" && args[i + 1]) {
					timeout = parseInt(args[i + 1], 10);
					i++;
				} else if (!args[i].startsWith("--") && !prompt) {
					prompt = args[i];
				}
			}

			if (!prompt) {
				console.error(
					'Usage: sandbox run-claude "<prompt>" [--sandbox ID] [--timeout 600]',
				);
				console.error('Example: sandbox run-claude "/test 1"');
				console.error(
					'Example: sandbox run-claude "Fix the auth bug" --sandbox abc123',
				);
				process.exit(1);
			}

			await runClaude(prompt, sandboxId, timeout);
			break;
		}

		// Phase 2: Git Operations
		case "diff": {
			const sandboxId = args[1];
			if (!sandboxId) {
				console.error("Usage: sandbox diff <sandbox-id>");
				process.exit(1);
			}
			await showDiff(sandboxId);
			break;
		}

		case "branch": {
			const sandboxId = args[1];
			const branchName = args[2];
			if (!sandboxId || !branchName) {
				console.error('Usage: sandbox branch <sandbox-id> "<branch-name>"');
				process.exit(1);
			}
			await createBranch(sandboxId, branchName);
			break;
		}

		case "pr": {
			const sandboxId = args[1];
			let commitMessage: string | undefined;
			let branchName: string | undefined;

			for (let i = 2; i < args.length; i++) {
				if (args[i] === "--branch" && args[i + 1]) {
					branchName = args[i + 1];
					i++;
				} else if (!args[i].startsWith("--") && !commitMessage) {
					commitMessage = args[i];
				}
			}

			if (!sandboxId || !commitMessage) {
				console.error(
					'Usage: sandbox pr <sandbox-id> "<commit-message>" [--branch NAME]',
				);
				console.error('Example: sandbox pr abc123 "Fix authentication bug"');
				process.exit(1);
			}

			await createPR(sandboxId, commitMessage, branchName);
			break;
		}

		// Phase 3: Full Feature Workflow
		case "feature": {
			let description: string | undefined;
			let timeout = 1800;
			let skipReview = false;

			for (let i = 1; i < args.length; i++) {
				if (args[i] === "--timeout" && args[i + 1]) {
					timeout = parseInt(args[i + 1], 10);
					i++;
				} else if (args[i] === "--no-review") {
					skipReview = true;
				} else if (!args[i].startsWith("--") && !description) {
					description = args[i];
				}
			}

			if (!description) {
				console.error(
					'Usage: sandbox feature "<description>" [--timeout 1800] [--no-review]',
				);
				console.error('Example: sandbox feature "Add dark mode toggle"');
				console.error('Example: sandbox feature "Quick fix" --no-review');
				process.exit(1);
			}

			await runFeatureWorkflow(description, timeout, skipReview);
			break;
		}

		// Phase 4: Review Workflow Commands
		case "review": {
			const sandboxId = args[1];
			if (!sandboxId) {
				console.error("Usage: sandbox review <sandbox-id>");
				console.error("Example: sandbox review abc123");
				process.exit(1);
			}
			await runReview(sandboxId);
			break;
		}

		case "approve": {
			const sandboxId = args[1];
			let customMessage: string | undefined;

			for (let i = 2; i < args.length; i++) {
				if (!args[i].startsWith("--") && !customMessage) {
					customMessage = args[i];
				}
			}

			if (!sandboxId) {
				console.error('Usage: sandbox approve <sandbox-id> ["message"]');
				console.error("Example: sandbox approve abc123");
				console.error(
					'Example: sandbox approve abc123 "Custom commit message"',
				);
				process.exit(1);
			}
			await approveChanges(sandboxId, customMessage);
			break;
		}

		case "reject": {
			const sandboxId = args[1];
			const keepSandbox = args.includes("--keep");

			if (!sandboxId) {
				console.error("Usage: sandbox reject <sandbox-id> [--keep]");
				console.error("Example: sandbox reject abc123");
				console.error("Example: sandbox reject abc123 --keep");
				process.exit(1);
			}
			await rejectChanges(sandboxId, keepSandbox);
			break;
		}

		default:
			showHelp();
			break;
	}
}

main().catch((error) => {
	console.error("Unexpected error:", error);
	process.exit(1);
});
