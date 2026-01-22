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
	SANDBOX_MAX_AGE_MS,
	TEMPLATE_ALIAS,
	VSCODE_PORT,
	WORKSPACE_DIR,
} from "../config/index.js";
import type { SandboxInstance, SpecManifest } from "../types/index.js";
import {
	E2B_API_KEY,
	getAllEnvVars,
	GITHUB_TOKEN,
	validateSupabaseTokensRequired,
} from "./environment.js";

// ============================================================================
// Timeout Configuration
// ============================================================================

/** Timeout for sandbox connection attempts (ms) - 30 seconds */
const SANDBOX_CONNECT_TIMEOUT_MS = 30 * 1000;

/** Timeout for sandbox liveness health check (ms) - 5 seconds */
const SANDBOX_LIVENESS_CHECK_TIMEOUT_MS = 5 * 1000;

/** Safety buffer before sandbox expiration (ms) - 5 minutes
 * If a sandbox is older than (MAX_AGE - BUFFER), consider it expired
 * to avoid race conditions where we connect just before expiration
 */
const SANDBOX_EXPIRATION_BUFFER_MS = 5 * 60 * 1000;

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
// Timeout Wrapper Utilities
// ============================================================================

/**
 * Wraps a promise with a timeout.
 *
 * @param promise - The promise to wrap
 * @param timeoutMs - Timeout in milliseconds
 * @param errorMessage - Error message to throw on timeout
 * @returns The result of the promise, or throws on timeout
 */
async function withTimeout<T>(
	promise: Promise<T>,
	timeoutMs: number,
	errorMessage: string,
): Promise<T> {
	let timeoutId: ReturnType<typeof setTimeout> | undefined;

	const timeoutPromise = new Promise<never>((_, reject) => {
		timeoutId = setTimeout(() => {
			reject(new Error(errorMessage));
		}, timeoutMs);
	});

	try {
		const result = await Promise.race([promise, timeoutPromise]);
		clearTimeout(timeoutId);
		return result;
	} catch (error) {
		clearTimeout(timeoutId);
		throw error;
	}
}

// ============================================================================
// Sandbox Expiration Checks
// ============================================================================

/**
 * Check if a sandbox is too old (approaching or past expiration).
 *
 * E2B sandboxes have a 1-hour lifetime limit. This function checks if a
 * sandbox's created_at timestamp indicates it's too old to be usable.
 *
 * @param createdAt - ISO timestamp when the sandbox was created
 * @returns true if the sandbox is expired or approaching expiration
 */
export function isSandboxExpired(createdAt: string | null): boolean {
	if (!createdAt) return true; // No timestamp = consider expired

	const createdTime = new Date(createdAt).getTime();
	const now = Date.now();
	const age = now - createdTime;

	// Use MAX_AGE - BUFFER to catch sandboxes that are about to expire
	const maxUsableAge = SANDBOX_MAX_AGE_MS - SANDBOX_EXPIRATION_BUFFER_MS;
	return age >= maxUsableAge;
}

/**
 * Get the age of a sandbox in minutes.
 *
 * @param createdAt - ISO timestamp when the sandbox was created
 * @returns Age in minutes, or null if no timestamp
 */
export function getSandboxAgeMinutes(createdAt: string | null): number | null {
	if (!createdAt) return null;

	const createdTime = new Date(createdAt).getTime();
	const now = Date.now();
	return Math.round((now - createdTime) / 60000);
}

// ============================================================================
// Sandbox Connection with Liveness Check
// ============================================================================

/**
 * Attempt to connect to an existing sandbox by ID with timeout and liveness verification.
 *
 * This function:
 * 1. Connects to the sandbox with a 30-second timeout (prevents hanging)
 * 2. Runs a liveness health check (echo command with 5-second timeout)
 * 3. Returns the sandbox only if both checks pass
 *
 * @param sandboxId - The E2B sandbox ID to connect to
 * @param uiEnabled - Whether UI mode is enabled
 * @returns The connected Sandbox instance, or null if connection fails
 */
export async function connectToSandboxWithVerification(
	sandboxId: string,
	uiEnabled: boolean = false,
): Promise<Sandbox | null> {
	const { log } = createLogger(uiEnabled);

	try {
		// Step 1: Connect with timeout
		log(`   Connecting to sandbox ${sandboxId}...`);
		const sandbox = await withTimeout(
			Sandbox.connect(sandboxId, { apiKey: E2B_API_KEY }),
			SANDBOX_CONNECT_TIMEOUT_MS,
			`Sandbox.connect() timed out after ${SANDBOX_CONNECT_TIMEOUT_MS / 1000}s (sandbox may be expired)`,
		);

		// Step 2: Verify liveness with a simple command
		log(`   Verifying sandbox ${sandboxId} is alive...`);
		const alive = await isSandboxAliveWithTimeout(
			sandbox,
			SANDBOX_LIVENESS_CHECK_TIMEOUT_MS,
		);

		if (!alive) {
			log(`   ⚠️ Sandbox ${sandboxId} failed liveness check (not responding)`);
			return null;
		}

		log(`   ✅ Sandbox ${sandboxId} connected and verified`);
		return sandbox;
	} catch (error) {
		log(
			`   ⚠️ Failed to connect to sandbox ${sandboxId}: ${error instanceof Error ? error.message : error}`,
		);
		return null;
	}
}

/**
 * Check if a sandbox is alive with a specific timeout.
 *
 * @param sandbox - The E2B sandbox instance
 * @param timeoutMs - Timeout for the liveness check
 * @returns true if sandbox responds within timeout, false otherwise
 */
async function isSandboxAliveWithTimeout(
	sandbox: Sandbox,
	timeoutMs: number,
): Promise<boolean> {
	try {
		const result = await withTimeout(
			sandbox.commands.run("echo alive", { timeoutMs }),
			timeoutMs + 1000, // Extra buffer for the outer timeout
			"Liveness check timed out",
		);
		return result.exitCode === 0;
	} catch {
		return false;
	}
}

/**
 * Attempt to reconnect to stored sandbox IDs from the manifest.
 *
 * This function validates stored sandbox IDs and attempts to reconnect:
 * 1. Checks if sandbox.created_at is too old (>55 minutes)
 * 2. Attempts to connect to each stored ID with timeout and liveness check
 * 3. Returns successfully connected sandboxes
 *
 * Use this when restarting the orchestrator to resume with existing sandboxes.
 *
 * @param manifest - The spec manifest containing sandbox IDs
 * @param uiEnabled - Whether UI mode is enabled
 * @returns Array of reconnected SandboxInstance objects (may be empty if all expired)
 */
export async function reconnectToStoredSandboxes(
	manifest: SpecManifest,
	uiEnabled: boolean = false,
): Promise<SandboxInstance[]> {
	const { log } = createLogger(uiEnabled);
	const reconnectedInstances: SandboxInstance[] = [];

	const { sandbox_ids, created_at } = manifest.sandbox;

	// Check if any stored sandboxes exist
	if (!sandbox_ids || sandbox_ids.length === 0) {
		log("   No stored sandbox IDs to reconnect");
		return [];
	}

	// Check expiration before attempting connection
	if (isSandboxExpired(created_at)) {
		const age = getSandboxAgeMinutes(created_at);
		log(
			`   ⚠️ Stored sandboxes are too old (${age ?? "unknown"} minutes) - will create fresh sandboxes`,
		);

		// Clear stale sandbox IDs from manifest
		manifest.sandbox.sandbox_ids = [];
		manifest.sandbox.created_at = null;
		return [];
	}

	log(
		`   Attempting to reconnect to ${sandbox_ids.length} stored sandbox(es)...`,
	);

	// Attempt to reconnect to each sandbox
	for (let i = 0; i < sandbox_ids.length; i++) {
		const sandboxId = sandbox_ids[i];
		if (!sandboxId) continue;

		const label = `sbx-${String.fromCharCode(97 + i)}`;
		const sandbox = await connectToSandboxWithVerification(
			sandboxId,
			uiEnabled,
		);

		if (sandbox) {
			reconnectedInstances.push({
				sandbox,
				id: sandboxId,
				label,
				status: "ready",
				currentFeature: null,
				retryCount: 0,
				createdAt: new Date(created_at ?? Date.now()),
				lastKeepaliveAt: new Date(),
			});
		} else {
			log(`   ⚠️ Could not reconnect to sandbox ${sandboxId} (${label})`);
		}
	}

	// Update manifest with only the successfully reconnected sandboxes
	if (reconnectedInstances.length < sandbox_ids.length) {
		manifest.sandbox.sandbox_ids = reconnectedInstances.map((i) => i.id);
		log(
			`   Reconnected to ${reconnectedInstances.length}/${sandbox_ids.length} sandboxes`,
		);
	} else {
		log(
			`   ✅ Successfully reconnected to all ${sandbox_ids.length} sandboxes`,
		);
	}

	return reconnectedInstances;
}

/**
 * Clear all stale sandbox data from manifest.
 *
 * Call this when stored sandboxes are detected as expired or unreachable.
 * This prevents the orchestrator from repeatedly trying to connect to dead sandboxes.
 *
 * @param manifest - The spec manifest to clear
 */
export function clearStaleSandboxData(manifest: SpecManifest): void {
	manifest.sandbox.sandbox_ids = [];
	manifest.sandbox.created_at = null;
	// Keep branch_name - it's still valid for new sandboxes
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

	// Validate Supabase tokens are configured (fail-fast)
	// This prevents mysterious downstream errors when migrations can't be synced
	const supabaseValidation = validateSupabaseTokensRequired();
	if (!supabaseValidation.isValid) {
		throw new Error(
			`Cannot create sandbox: ${supabaseValidation.message}\n` +
				"   Database operations require valid Supabase credentials.",
		);
	}

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
		// Force reset local dev to match remote state (template may have stale/diverged dev branch)
		await sandbox.commands.run(
			`cd ${WORKSPACE_DIR} && git fetch origin dev && git reset --hard origin/dev && git checkout -b "${branchName}"`,
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

	// Build workspace packages to ensure dist directories exist
	// Required for Payload commands that import @kit/shared/logger
	log("   Building workspace packages...");
	const buildResult = await sandbox.commands.run(
		`cd ${WORKSPACE_DIR} && pnpm --filter @kit/shared build`,
		{ timeoutMs: 120000 },
	);
	if (buildResult.exitCode !== 0) {
		throw new Error(
			`Failed to build workspace packages: ${buildResult.stderr || buildResult.stdout}`,
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
 * Start the dev server in the sandbox and wait for it to be accessible.
 *
 * This function starts the dev server process and performs health checks
 * to verify the port is responding before returning the URL.
 *
 * Bug fix #1724: Increased timeout from 60s to 180s (3 minutes) to handle
 * Next.js cold-start on fresh E2B sandboxes, which can take 90-120s.
 * Added HTTP 200 early success detection to stop polling immediately
 * when the server is confirmed ready.
 *
 * @param sandbox - The E2B sandbox instance
 * @param maxAttempts - Maximum health check attempts (default: 180 = 180s)
 * @param intervalMs - Interval between health checks in ms (default: 1000)
 * @returns The dev server URL
 * @throws Error if dev server fails to start within the timeout
 */
export async function startDevServer(
	sandbox: Sandbox,
	maxAttempts: number = 180,
	intervalMs: number = 1000,
): Promise<string> {
	// Start the dev server
	sandbox.commands
		.run("nohup start-dev > /tmp/devserver.log 2>&1 &", { timeoutMs: 5000 })
		.catch(() => {
			/* fire and forget */
		});

	const devServerHost = sandbox.getHost(DEV_SERVER_PORT);
	const devServerUrl = `https://${devServerHost}`;

	// Wait for dev server to start by checking if port is responding
	// Note: For E2B sandboxes, we check via HTTP request to the public URL
	// since the port is proxied through E2B's infrastructure
	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		try {
			// Check if the dev server is responding via HTTP
			const response = await fetch(devServerUrl, {
				method: "HEAD",
				signal: AbortSignal.timeout(2000),
			});

			// Early success detection: If we get HTTP 200, server is fully ready
			// This allows us to exit early rather than waiting the full timeout
			if (response.ok) {
				return devServerUrl;
			}

			// Any response (even errors like 404) means the server is running
			// But for non-200 responses, we continue polling a few more times
			// to give the server a chance to fully initialize
			if (response.status < 500) {
				return devServerUrl;
			}
		} catch {
			// Server not ready yet, continue polling
		}

		// Wait before next attempt
		await new Promise((resolve) => setTimeout(resolve, intervalMs));
	}

	// Throw error on timeout so caller can handle the failure appropriately
	throw new Error(
		`Dev server failed to start on port ${DEV_SERVER_PORT} after ${maxAttempts} attempts (${(maxAttempts * intervalMs) / 1000}s)`,
	);
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

// ============================================================================
// Review Sandbox Creation
// ============================================================================

/**
 * Create a lightweight review sandbox optimized for dev server startup.
 *
 * Unlike the full `createSandbox()`, this function creates a minimal sandbox
 * that just needs to clone the branch and start the dev server. It skips:
 * - Supabase CLI setup (not needed for review)
 * - Full workspace package build (only builds @kit/shared)
 * - Progress file cleanup (no implementation happening)
 *
 * This provides a clean environment for the dev server without resource
 * contention from prior implementation work.
 *
 * Bug fix #1590: Fresh sandbox for review after spec implementation.
 *
 * @param branchName - The branch to checkout (e.g., "alpha/spec-1362")
 * @param timeout - Sandbox timeout in seconds
 * @param uiEnabled - Whether UI mode is enabled
 * @returns The review sandbox instance (Sandbox object, not SandboxInstance)
 */
export async function createReviewSandbox(
	branchName: string,
	timeout: number,
	uiEnabled: boolean = false,
): Promise<Sandbox> {
	const { log } = createLogger(uiEnabled);

	log("\n📦 Creating fresh review sandbox...");

	const sandbox = await Sandbox.create(TEMPLATE_ALIAS, {
		timeoutMs: timeout * 1000,
		apiKey: E2B_API_KEY,
		envs: getAllEnvVars(),
	});

	log(`   Review sandbox ID: ${sandbox.sandboxId}`);

	// Setup git credentials
	if (GITHUB_TOKEN) {
		await setupGitCredentials(sandbox);
	}

	// Fetch and checkout the branch
	log(`   Checking out branch: ${branchName}`);
	await sandbox.commands.run(`cd ${WORKSPACE_DIR} && git fetch origin`, {
		timeoutMs: 120000,
	});

	// Checkout the branch - force reset to match remote
	await sandbox.commands.run(
		`cd ${WORKSPACE_DIR} && git fetch origin "${branchName}" && git checkout -B "${branchName}" FETCH_HEAD`,
		{ timeoutMs: 60000 },
	);

	// Pull latest to ensure we have all commits
	await sandbox.commands.run(
		`cd ${WORKSPACE_DIR} && git pull origin "${branchName}"`,
		{ timeoutMs: 60000 },
	);

	log("   ✅ Branch checked out");

	// Sync dependencies with branch lockfile
	// Always run pnpm install after branch checkout to ensure dependencies match
	// the branch's lockfile. When deps are already synced, pnpm completes in <1s.
	log("   Syncing dependencies with branch lockfile...");
	await sandbox.commands.run(
		`cd ${WORKSPACE_DIR} && pnpm install --frozen-lockfile`,
		{ timeoutMs: 600000 },
	);

	// Build workspace packages (required for dev server)
	log("   Building workspace packages...");
	const buildResult = await sandbox.commands.run(
		`cd ${WORKSPACE_DIR} && pnpm --filter @kit/shared build`,
		{ timeoutMs: 120000 },
	);
	if (buildResult.exitCode !== 0) {
		throw new Error(
			`Failed to build workspace packages: ${buildResult.stderr || buildResult.stdout}`,
		);
	}

	log("   ✅ Review sandbox ready");
	return sandbox;
}
