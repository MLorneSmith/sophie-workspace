/**

* Sandbox Management Module
*
* Handles E2B sandbox creation, git credentials setup, and branch management.
 */

import process from "node:process";
import { Sandbox } from "@e2b/code-interpreter";

import {
	DEV_SERVER_PORT,
	PROGRESS_FILE,
	TEMPLATE_ALIAS,
	VSCODE_PORT,
	WORKSPACE_DIR,
} from "../config/index.js";
import type { SandboxInstance, SpecManifest } from "../types/index.js";
import { E2B_API_KEY, GITHUB_TOKEN, getAllEnvVars } from "./environment.js";

// ============================================================================
// Logging Helper
// ============================================================================

/**

* Create a conditional logger that only outputs when UI is disabled.
 */
function createLogger(uiEnabled: boolean) {
	return {
		log: (...args: unknown[]) => {
			if (!uiEnabled) console.log(...args);
		},
	};
}

// ============================================================================
// Git Credentials
// ============================================================================

/**

* Setup git credentials in the sandbox for GitHub operations.
*
* @param sandbox - The E2B sandbox instance
 */
export async function setupGitCredentials(sandbox: Sandbox): Promise<void> {
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
			{ timeoutMs: 30000 },
		);
	} catch {
		// Non-fatal
	}
}

// ============================================================================
// Sandbox Creation
// ============================================================================

/**

* Create and configure an E2B sandbox for feature implementation.
*
* @param manifest - The spec manifest
* @param label - Human-readable label for the sandbox (e.g., "sbx-a")
* @param timeout - Sandbox timeout in seconds
* @param uiEnabled - Whether UI mode is enabled (suppresses console output)
* @returns Configured sandbox instance
 */
export async function createSandbox(
	manifest: SpecManifest,
	label: string,
	timeout: number,
	uiEnabled: boolean = false,
	runId?: string,
): Promise<SandboxInstance> {
	// Create conditional logger
	const { log } = createLogger(uiEnabled);

	log(`\n📦 Creating sandbox ${label}...`);

	const sandbox = await Sandbox.create(TEMPLATE_ALIAS, {
		timeoutMs: timeout * 1000,
		apiKey: E2B_API_KEY,
		envs: getAllEnvVars(),
	});

	log(`ID: ${sandbox.sandboxId}`);

	// Set E2B_SANDBOX_ID environment variable for event streaming hooks
	await sandbox.commands.run(
		`echo 'export E2B_SANDBOX_ID="${sandbox.sandboxId}"' >> ~/.bashrc`,
		{ timeoutMs: 5000 },
	);

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
		{ timeoutMs: 30000 },
	);
	const branchExists = branchExistsResult.stdout.trim() === "1";

	if (branchExists) {
		log(`Checking out existing branch: ${branchName}`);
		await sandbox.commands.run(
			`cd ${WORKSPACE_DIR} && git fetch origin "${branchName}" && git checkout -B "${branchName}" FETCH_HEAD`,
			{ timeoutMs: 60000 },
		);
	} else {
		log(`Creating new branch from dev: ${branchName}`);
		await sandbox.commands.run(
			`cd ${WORKSPACE_DIR} && git checkout dev && git pull origin dev && git checkout -b "${branchName}"`,
			{ timeoutMs: 60000 },
		);
		// Push new branch to remote so other sandboxes can pull from it
		if (GITHUB_TOKEN) {
			log("   Pushing new branch to remote...");
			try {
				await sandbox.commands.run(
					`cd ${WORKSPACE_DIR} && git push -u origin "${branchName}"`,
					{ timeoutMs: 60000 },
				);
			} catch {
				log("   ⚠ Initial push failed (will retry after first feature)");
			}
		}
	}

	// Clear any stale progress file from template or previous runs
	await sandbox.commands.run(`cd ${WORKSPACE_DIR} && rm -f ${PROGRESS_FILE}`, {
		timeoutMs: 5000,
	});

	// Verify dependencies
	const checkResult = await sandbox.commands.run(
		`cd ${WORKSPACE_DIR} && test -d node_modules && echo "exists" || echo "missing"`,
		{ timeoutMs: 10000 },
	);

	if (checkResult.stdout.trim() === "missing") {
		log("   Installing dependencies...");
		await sandbox.commands.run(
			`cd ${WORKSPACE_DIR} && pnpm install --frozen-lockfile`,
			{ timeoutMs: 600000 },
		);
	}

	// Setup Supabase CLI if sandbox project is configured
	const sandboxProjectRef = process.env.SUPABASE_SANDBOX_PROJECT_REF;
	const supabaseAccessToken = process.env.SUPABASE_ACCESS_TOKEN;

	if (sandboxProjectRef && supabaseAccessToken) {
		log("   Setting up Supabase CLI...");

		// Verify supabase CLI is available via pnpm
		const cliCheck = await sandbox.commands.run(
			`cd ${WORKSPACE_DIR} && pnpm exec supabase --version 2>/dev/null || echo 'not found'`,
			{ timeoutMs: 30000 },
		);

		if (cliCheck.stdout.includes("not found") || cliCheck.exitCode !== 0) {
			log(
				"   ⚠️ Supabase CLI not found in project dependencies, DB features may fail",
			);
		} else {
			log(`   Found Supabase CLI: ${cliCheck.stdout.trim()}`);

			// Link to sandbox project (from apps/web which has supabase config)
			log(`   Linking to sandbox project: ${sandboxProjectRef}`);
			try {
				const linkResult = await sandbox.commands.run(
					`cd ${WORKSPACE_DIR}/apps/web && pnpm exec supabase link --project-ref ${sandboxProjectRef}`,
					{
						timeoutMs: 60000,
						envs: { SUPABASE_ACCESS_TOKEN: supabaseAccessToken },
					},
				);

				if (linkResult.exitCode === 0) {
					log("   ✅ Supabase CLI linked to sandbox project");
				} else {
					log(
						`   ⚠️ Supabase link failed (code ${linkResult.exitCode}): ${linkResult.stderr}`,
					);
				}
			} catch (linkError) {
				log(`   ⚠️ Supabase link failed (non-fatal): ${linkError}`);
			}
		}
	} else if (sandboxProjectRef && !supabaseAccessToken) {
		log("   ⚠️ SUPABASE_ACCESS_TOKEN not set, skipping Supabase CLI setup");
	}

	// Update manifest
	if (!manifest.sandbox.sandbox_ids.includes(sandbox.sandboxId)) {
		manifest.sandbox.sandbox_ids.push(sandbox.sandboxId);
	}
	manifest.sandbox.branch_name = branchName;
	manifest.sandbox.created_at =
		manifest.sandbox.created_at || new Date().toISOString();

	const now = new Date();
	return {
		sandbox,
		id: sandbox.sandboxId,
		label,
		status: "ready",
		currentFeature: null,
		retryCount: 0,
		createdAt: now,
		lastKeepaliveAt: now,
		runId,
	};
}

// ============================================================================
// Dev Server & URLs
// ============================================================================

/**

* Start the dev server in the sandbox.
*
* @param sandbox - The E2B sandbox instance
* @returns The dev server URL
 */
export async function startDevServer(sandbox: Sandbox): Promise<string> {
	// Start the dev server
	sandbox.commands
		.run("nohup start-dev > /tmp/devserver.log 2>&1 &", { timeoutMs: 5000 })
		.catch(() => {
			/* fire and forget */
		});

	const devServerHost = sandbox.getHost(DEV_SERVER_PORT);
	return `https://${devServerHost}`;
}

/**

* Get the VS Code URL for a sandbox.
*
* @param sandbox - The E2B sandbox instance
* @returns The VS Code URL
 */
export function getVSCodeUrl(sandbox: Sandbox): string {
	const vscodeHost = sandbox.getHost(VSCODE_PORT);
	return `https://${vscodeHost}`;
}

// ============================================================================
// Sandbox Keepalive & Health
// ============================================================================

/**

* Extend sandbox timeout to prevent expiration.
*
* @param sandbox - The E2B sandbox instance
* @param timeoutMs - New timeout in milliseconds
* @returns true if successful, false if sandbox is dead
 */
export async function extendSandboxTimeout(
	sandbox: Sandbox,
	timeoutMs: number,
): Promise<boolean> {
	try {
		await sandbox.setTimeout(timeoutMs);
		return true;
	} catch {
		return false;
	}
}

/**

* Check if a sandbox is still running.
*
* @param sandbox - The E2B sandbox instance
* @returns true if running, false if dead/expired
 */
export async function isSandboxAlive(sandbox: Sandbox): Promise<boolean> {
	try {
		// Try to run a simple command to check if sandbox is responsive
		const result = await sandbox.commands.run("echo alive", {
			timeoutMs: 5000,
		});
		return result.exitCode === 0;
	} catch {
		return false;
	}
}

/**

* Extend timeouts for all sandboxes (keepalive) with staggering and verification.
*
* @param instances - Array of sandbox instances
* @param timeoutMs - New timeout in milliseconds
* @param uiEnabled - Whether UI mode is enabled
* @param staggerMs - Delay between keepalive calls (default: 0)
* @returns Array of sandbox labels that failed (expired)
 */
export async function keepAliveSandboxes(
	instances: SandboxInstance[],
	timeoutMs: number,
	uiEnabled: boolean = false,
	staggerMs: number = 0,
): Promise<string[]> {
	const { log } = createLogger(uiEnabled);
	const failed: string[] = [];

	for (let i = 0; i < instances.length; i++) {
		const instance = instances[i];
		if (!instance || instance.status === "failed") continue;

		// Apply stagger delay for subsequent sandboxes
		if (staggerMs > 0 && i > 0) {
			await new Promise((resolve) => setTimeout(resolve, staggerMs));
		}

		// Step 1: Verify sandbox is still responsive before extending timeout
		const alive = await isSandboxAlive(instance.sandbox);
		if (!alive) {
			log(
				`   ⚠️ Sandbox ${instance.label} not responding to health check (expired?)`,
			);
			failed.push(instance.label);
			continue;
		}

		// Step 2: Extend the timeout
		const extended = await extendSandboxTimeout(instance.sandbox, timeoutMs);
		if (!extended) {
			log(`   ⚠️ Sandbox ${instance.label} failed to extend timeout (expired?)`);
			failed.push(instance.label);
			continue;
		}

		// Success - update last keepalive timestamp
		instance.lastKeepaliveAt = new Date();
	}

	return failed;
}

/**
 * Check if any sandbox is approaching max age and needs preemptive restart.
 *
 * @param instances - Array of sandbox instances
 * @param maxAgeMs - Maximum sandbox age before restart (default: 50 min)
 * @returns Array of sandbox labels that need restart due to age
 */
export function getSandboxesNeedingRestart(
	instances: SandboxInstance[],
	maxAgeMs: number,
): string[] {
	const now = Date.now();
	const needsRestart: string[] = [];

	for (const instance of instances) {
		if (instance.status === "failed") continue;

		const age = now - instance.createdAt.getTime();
		if (age >= maxAgeMs) {
			needsRestart.push(instance.label);
		}
	}

	return needsRestart;
}
