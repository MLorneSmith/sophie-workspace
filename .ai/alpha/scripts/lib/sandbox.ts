/**

* Sandbox Management Module
*
* Handles E2B sandbox creation, git credentials setup, and branch management.
 */

import process from "node:process";
import { Sandbox, type SandboxInfo } from "@e2b/code-interpreter";

import {
	DEV_SERVER_PORT,
	PROGRESS_FILE,
	SANDBOX_MAX_AGE_MS,
	VSCODE_PORT,
	WORKSPACE_DIR,
} from "../config/index.js";
import type {
	AgentProvider,
	InstallAttemptResult,
	ProviderInstallConfig,
	SandboxInstance,
	SandboxValidationResult,
	SpecManifest,
} from "../types/index.js";
import { createLogger } from "./logger.js";
import {
	E2B_API_KEY,
	GITHUB_TOKEN,
	getAllEnvVars,
	validateSupabaseTokensRequired,
} from "./environment.js";
import { getProviderDisplayName, getTemplateAlias } from "./provider.js";

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
// Provider-Specific Install Configuration (Bug fix #1924)
// ============================================================================

/**
 * Default install timeout in milliseconds (20 minutes).
 * Can be overridden via ALPHA_SANDBOX_INSTALL_TIMEOUT_MS environment variable.
 */
const DEFAULT_INSTALL_TIMEOUT_MS = 20 * 60 * 1000;

/**
 * Default maximum retry attempts for install.
 * Can be overridden via ALPHA_SANDBOX_INSTALL_MAX_RETRIES environment variable.
 */
const DEFAULT_INSTALL_MAX_RETRIES = 3;

/**
 * Base delay for exponential backoff (ms).
 * Retry delays: 3s, 9s, 27s (3^n * base)
 */
const RETRY_BASE_DELAY_MS = 3000;

/**
 * Get install timeout from environment or default.
 */
function getInstallTimeoutMs(): number {
	const envTimeout = process.env.ALPHA_SANDBOX_INSTALL_TIMEOUT_MS;
	if (envTimeout) {
		const parsed = Number.parseInt(envTimeout, 10);
		if (!Number.isNaN(parsed) && parsed > 0) {
			return parsed;
		}
	}
	return DEFAULT_INSTALL_TIMEOUT_MS;
}

/**
 * Get max retries from environment or default.
 */
function getInstallMaxRetries(): number {
	const envRetries = process.env.ALPHA_SANDBOX_INSTALL_MAX_RETRIES;
	if (envRetries) {
		const parsed = Number.parseInt(envRetries, 10);
		if (!Number.isNaN(parsed) && parsed >= 0) {
			return parsed;
		}
	}
	return DEFAULT_INSTALL_MAX_RETRIES;
}

/**
 * Provider-specific install configurations.
 *
 * Claude templates typically have cached dependencies, so --frozen-lockfile works reliably.
 * GPT templates may have empty/stale caches, requiring --no-frozen-lockfile to succeed.
 *
 * Bug fix #1924: GPT provider review sandbox failures due to install timeout.
 */
export function getProviderInstallConfig(
	provider: AgentProvider,
): ProviderInstallConfig {
	const timeoutMs = getInstallTimeoutMs();
	const maxRetries = getInstallMaxRetries();

	if (provider === "gpt") {
		return {
			// GPT templates may have stale lockfile state; skip frozen validation
			installFlags: ["--no-frozen-lockfile"],
			timeoutMs,
			maxRetries,
			retryBaseDelayMs: RETRY_BASE_DELAY_MS,
			skipFrozenLockfile: true,
		};
	}

	// Claude provider: use strict frozen-lockfile validation
	return {
		installFlags: ["--frozen-lockfile"],
		timeoutMs,
		maxRetries,
		retryBaseDelayMs: RETRY_BASE_DELAY_MS,
		skipFrozenLockfile: false,
	};
}

// ============================================================================
// Pre-Install Validation (Bug fix #1924)
// ============================================================================

/**
 * Validate sandbox environment before attempting pnpm install.
 *
 * This catches template issues early, providing clear error messages
 * instead of mysterious install timeouts.
 *
 * Bug fix #1924: Pre-install validation to detect template issues.
 *
 * @param sandbox - The E2B sandbox instance
 * @param workspaceDir - The workspace directory to validate
 * @param log - Logger function
 * @returns Validation result with errors if any
 */
export async function validateSandboxEnvironment(
	sandbox: Sandbox,
	workspaceDir: string,
	log: (...args: unknown[]) => void,
): Promise<SandboxValidationResult> {
	const errors: string[] = [];
	let nodeVersion: string | undefined;
	let hasPackageJson = false;
	let hasLockfile = false;

	log("   Pre-install validation...");

	// Check 1: Workspace directory exists
	const dirCheck = await sandbox.commands.run(
		`test -d "${workspaceDir}" && echo "exists" || echo "missing"`,
		{ timeoutMs: 10000 },
	);
	if (dirCheck.stdout.trim() !== "exists") {
		errors.push(`Workspace directory does not exist: ${workspaceDir}`);
		return { valid: false, errors, hasPackageJson, hasLockfile };
	}

	// Check 2: package.json exists
	const packageJsonCheck = await sandbox.commands.run(
		`test -f "${workspaceDir}/package.json" && echo "exists" || echo "missing"`,
		{ timeoutMs: 10000 },
	);
	hasPackageJson = packageJsonCheck.stdout.trim() === "exists";
	if (!hasPackageJson) {
		errors.push(`package.json not found in ${workspaceDir}`);
	}

	// Check 3: pnpm-lock.yaml exists
	const lockfileCheck = await sandbox.commands.run(
		`test -f "${workspaceDir}/pnpm-lock.yaml" && echo "exists" || echo "missing"`,
		{ timeoutMs: 10000 },
	);
	hasLockfile = lockfileCheck.stdout.trim() === "exists";
	if (!hasLockfile) {
		errors.push(`pnpm-lock.yaml not found in ${workspaceDir}`);
	}

	// Check 4: Node.js version
	try {
		const nodeCheck = await sandbox.commands.run("node --version", {
			timeoutMs: 10000,
		});
		if (nodeCheck.exitCode === 0) {
			nodeVersion = nodeCheck.stdout.trim();
			log(`   Node.js version: ${nodeVersion}`);
		} else {
			errors.push("Node.js not available or not working");
		}
	} catch {
		errors.push("Failed to check Node.js version");
	}

	// Check 5: pnpm available
	try {
		const pnpmCheck = await sandbox.commands.run("pnpm --version", {
			timeoutMs: 10000,
		});
		if (pnpmCheck.exitCode !== 0) {
			errors.push("pnpm not available or not working");
		}
	} catch {
		errors.push("Failed to check pnpm availability");
	}

	const valid = errors.length === 0;
	if (valid) {
		log("   ✅ Pre-install validation passed");
	} else {
		log(`   ❌ Pre-install validation failed: ${errors.join(", ")}`);
	}

	return { valid, errors, nodeVersion, hasPackageJson, hasLockfile };
}

// ============================================================================
// Provider-Aware Install with Retry (Bug fix #1924)
// ============================================================================

/**
 * Sleep for a given number of milliseconds.
 */
function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute pnpm install with provider-specific flags and exponential backoff retry.
 *
 * This function:
 * 1. Uses provider-specific install flags (Claude: --frozen-lockfile, GPT: --no-frozen-lockfile)
 * 2. Implements exponential backoff retry on timeout/failure
 * 3. Logs detailed diagnostics for each attempt
 * 4. Returns structured result for error surfacing
 *
 * Bug fix #1924: GPT provider install timeouts with frozen-lockfile.
 *
 * @param sandbox - The E2B sandbox instance
 * @param workspaceDir - The workspace directory
 * @param provider - The agent provider (claude or gpt)
 * @param log - Logger function
 * @returns Install attempt result with success status and diagnostics
 */
export async function executeInstallWithRetry(
	sandbox: Sandbox,
	workspaceDir: string,
	provider: AgentProvider,
	log: (...args: unknown[]) => void,
): Promise<InstallAttemptResult> {
	const config = getProviderInstallConfig(provider);
	const startTime = Date.now();
	let lastExitCode: number | undefined;
	let lastStderr: string | undefined;

	const flags = config.installFlags.join(" ");
	log(
		`   Installing dependencies with provider: ${provider}, flags: ${flags || "(none)"}`,
	);

	for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
		const attemptStart = Date.now();

		// Calculate delay for this attempt (exponential backoff)
		if (attempt > 1) {
			const delay = config.retryBaseDelayMs * 3 ** (attempt - 2);
			log(
				`   Retry ${attempt}/${config.maxRetries} after ${delay / 1000}s delay...`,
			);
			await sleep(delay);
		}

		log(`   Install attempt ${attempt}/${config.maxRetries}...`);

		try {
			const installCommand = flags
				? `cd ${workspaceDir} && pnpm install ${flags}`
				: `cd ${workspaceDir} && pnpm install`;

			const result = await sandbox.commands.run(installCommand, {
				timeoutMs: config.timeoutMs,
			});

			lastExitCode = result.exitCode;
			lastStderr = result.stderr;

			if (result.exitCode === 0) {
				const duration = Date.now() - startTime;
				log(
					`   ✅ Install successful on attempt ${attempt} (${Math.round(duration / 1000)}s)`,
				);
				return {
					success: true,
					attemptsMade: attempt,
					durationMs: duration,
				};
			}

			// Non-zero exit code - log error and retry
			log(
				`   ⚠️ Install attempt ${attempt} failed (exit code: ${result.exitCode})`,
			);
			if (result.stderr) {
				// Truncate long error messages for readability
				const truncatedStderr = result.stderr.slice(0, 500);
				log(`   Stderr: ${truncatedStderr}`);
			}
		} catch (error) {
			// Timeout or other error
			const errorMsg = error instanceof Error ? error.message : String(error);
			log(`   ⚠️ Install attempt ${attempt} error: ${errorMsg}`);
			lastStderr = errorMsg;
		}

		const attemptDuration = Date.now() - attemptStart;
		log(`   Attempt ${attempt} took ${Math.round(attemptDuration / 1000)}s`);
	}

	// All retries exhausted
	const totalDuration = Date.now() - startTime;
	const errorMessage =
		`Install failed after ${config.maxRetries} attempts. ` +
		`Provider: ${provider}, Flags: ${flags || "(none)"}, ` +
		`Total time: ${Math.round(totalDuration / 1000)}s`;

	log(`   ❌ ${errorMessage}`);

	return {
		success: false,
		attemptsMade: config.maxRetries,
		durationMs: totalDuration,
		error: errorMessage,
		diagnosticInfo: {
			provider,
			flags: config.installFlags,
			timeoutMs: config.timeoutMs,
			lastExitCode,
			lastStderr: lastStderr?.slice(0, 1000), // Truncate for manifest storage
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
// E2B Sandbox Verification (Bug fix #1858)
// ============================================================================

/**
 * Get list of active sandbox IDs from E2B.
 *
 * Bug fix #1858: This function queries the E2B API to get all currently
 * running sandboxes. Used to validate stored sandbox IDs before reconnection.
 *
 * @param uiEnabled - Whether UI mode is enabled
 * @returns Set of active sandbox IDs, or null if API call fails
 */
export async function getActiveSandboxIds(
	uiEnabled: boolean = false,
): Promise<Set<string> | null> {
	const { log } = createLogger(uiEnabled);

	try {
		// E2B SDK returns a paginator - iterate through all pages to get complete list
		const paginator = Sandbox.list({ apiKey: E2B_API_KEY });
		const allSandboxes: SandboxInfo[] = [];

		// Fetch first page
		if (paginator.hasNext) {
			const items = await paginator.nextItems();
			allSandboxes.push(...items);
		}

		// Fetch remaining pages if any
		while (paginator.hasNext) {
			const items = await paginator.nextItems();
			allSandboxes.push(...items);
		}

		const activeIds = new Set(allSandboxes.map((s) => s.sandboxId));
		log(`   Found ${activeIds.size} active sandboxes in E2B`);
		return activeIds;
	} catch (error) {
		log(
			`   ⚠️ Failed to list E2B sandboxes: ${error instanceof Error ? error.message : error}`,
		);
		return null;
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
 * 2. Bug fix #1858: Verifies sandbox IDs exist in E2B before attempting connection
 * 3. Attempts to connect to each verified ID with timeout and liveness check
 * 4. Returns successfully connected sandboxes
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

	// Bug fix #1858: Verify sandbox IDs exist in E2B before attempting connection
	// This prevents wasting time trying to connect to dead sandboxes and ensures
	// we correctly identify which sandboxes have died and need their features reset
	const activeSandboxIds = await getActiveSandboxIds(uiEnabled);
	const verifiedIds: string[] = [];
	const staleSandboxIds: string[] = [];

	if (activeSandboxIds !== null) {
		for (const id of sandbox_ids) {
			if (id && activeSandboxIds.has(id)) {
				verifiedIds.push(id);
			} else if (id) {
				staleSandboxIds.push(id);
				log(`   ⚠️ Sandbox ${id} not found in E2B (sandbox died or expired)`);
			}
		}

		if (staleSandboxIds.length > 0) {
			log(
				`   Detected ${staleSandboxIds.length} dead sandbox(es) - will skip reconnection attempt`,
			);
		}
	} else {
		// If E2B API call failed, fall back to attempting all stored IDs
		// This preserves backward compatibility
		log(
			"   ⚠️ Could not verify sandbox IDs with E2B, attempting all stored IDs",
		);
		verifiedIds.push(...sandbox_ids.filter((id): id is string => !!id));
	}

	// If no verified IDs remain, clear manifest and return
	if (verifiedIds.length === 0) {
		log("   No verified sandboxes to reconnect - will create fresh sandboxes");
		manifest.sandbox.sandbox_ids = [];
		manifest.sandbox.created_at = null;
		return [];
	}

	// Attempt to reconnect to each verified sandbox
	for (let i = 0; i < verifiedIds.length; i++) {
		const sandboxId = verifiedIds[i];
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
// Provider CLI Setup
// ============================================================================

async function ensureCodexInstalled(
	sandbox: Sandbox,
	log: (...args: unknown[]) => void,
): Promise<void> {
	try {
		const check = await sandbox.commands.run("command -v codex", {
			timeoutMs: 10000,
		});
		if (check.exitCode === 0) {
			log("   ✅ Codex CLI available");
		} else {
			log("   📦 Installing Codex CLI (missing)...");
			await sandbox.commands.run("npm install -g @openai/codex", {
				timeoutMs: 300000,
			});
			log("   ✅ Codex CLI installed");
		}
	} catch {
		log("   📦 Installing Codex CLI (missing)...");
		await sandbox.commands.run("npm install -g @openai/codex", {
			timeoutMs: 300000,
		});
		log("   ✅ Codex CLI installed");
	}

	// Setup Codex authentication
	await setupCodexAuth(sandbox, log);
}

/**
 * Setup Codex (OpenAI) authentication in the sandbox.
 * Copies the local ~/.codex/auth.json to the sandbox.
 */
async function setupCodexAuth(
	sandbox: Sandbox,
	log: (...args: unknown[]) => void,
): Promise<void> {
	const fs = await import("node:fs");
	const path = await import("node:path");

	const homeDir = process.env.HOME || process.env.USERPROFILE;
	if (!homeDir) {
		log("   ⚠️ Cannot find home directory for Codex auth");
		return;
	}

	const localAuthPath = path.join(homeDir, ".codex", "auth.json");

	// Check if local auth.json exists
	if (!fs.existsSync(localAuthPath)) {
		log(
			"   ⚠️ No local ~/.codex/auth.json found - run 'codex auth' locally first",
		);
		return;
	}

	// Read and copy the auth file to sandbox
	try {
		const authContent = fs.readFileSync(localAuthPath, "utf-8");

		// Create ~/.codex directory in sandbox
		await sandbox.commands.run("mkdir -p ~/.codex", { timeoutMs: 5000 });

		// Write auth.json to sandbox using base64 to avoid escaping issues
		const authBase64 = Buffer.from(authContent).toString("base64");
		await sandbox.commands.run(
			`echo '${authBase64}' | base64 -d > ~/.codex/auth.json`,
			{ timeoutMs: 5000 },
		);
		await sandbox.commands.run("chmod 600 ~/.codex/auth.json", {
			timeoutMs: 5000,
		});

		log("   ✅ Codex authentication copied to sandbox");
	} catch (err) {
		log(
			`   ⚠️ Failed to copy Codex auth: ${err instanceof Error ? err.message : String(err)}`,
		);
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
	provider: AgentProvider = "claude",
	baseBranch?: string,
	phase?: string,
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

	log(
		`\n📦 Creating sandbox ${label} (${getProviderDisplayName(provider)})...`,
	);

	const sandbox = await Sandbox.create(getTemplateAlias(provider), {
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

	// Ensure Codex CLI is available when using GPT provider
	if (provider === "gpt") {
		await ensureCodexInstalled(sandbox, log);
	}

	// Fetch and setup branch
	// Phase-aware branch naming: alpha/spec-{specId}-{phaseId} when phase is set
	const branchName = phase
		? `alpha/spec-${manifest.metadata.spec_id}-${phase}`
		: `alpha/spec-${manifest.metadata.spec_id}`;

	// Check if origin remote exists (GPT templates may have empty git repos)
	const remoteCheck = await sandbox.commands.run(
		`cd ${WORKSPACE_DIR} && git remote get-url origin 2>/dev/null || echo "NO_REMOTE"`,
		{ timeoutMs: 10000 },
	);
	const hasRemote = !remoteCheck.stdout.trim().includes("NO_REMOTE");

	if (!hasRemote) {
		log("   Adding git remote origin...");
		await sandbox.commands.run(
			`cd ${WORKSPACE_DIR} && git remote add origin https://github.com/slideheroes/2025slideheroes.git`,
			{ timeoutMs: 10000 },
		);
	}

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
		// Determine fork point: baseBranch (for phase chaining) or dev (default)
		const forkRef = baseBranch ? `origin/${baseBranch}` : "origin/dev";
		const forkSource = baseBranch ?? "dev";
		log(`Creating new branch from ${forkSource}: ${branchName}`);
		// Force reset local to match remote state (template may have stale/diverged branch)
		await sandbox.commands.run(
			`cd ${WORKSPACE_DIR} && git fetch origin ${forkSource} && git reset --hard ${forkRef} && git checkout -b "${branchName}"`,
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

	// Check if lockfile changed compared to fork point (Bug fix #1803)
	// If the branch added new dependencies, we need to run pnpm install (not --frozen-lockfile)
	// to sync those dependencies into the sandbox's node_modules
	const diffRef = baseBranch ? `origin/${baseBranch}` : "origin/dev";
	const lockfileChanged = await sandbox.commands.run(
		`cd ${WORKSPACE_DIR} && git diff ${diffRef} -- pnpm-lock.yaml | head -1`,
		{ timeoutMs: 30000 },
	);

	const hasLockfileChanges = lockfileChanged.stdout.trim() !== "";

	// Verify dependencies
	const checkResult = await sandbox.commands.run(
		`cd ${WORKSPACE_DIR} && test -d node_modules && echo "exists" || echo "missing"`,
		{ timeoutMs: 10000 },
	);

	if (checkResult.stdout.trim() === "missing") {
		log("   Installing dependencies (node_modules missing)...");
		// Use pnpm install without --frozen-lockfile for fresh clones (GPT templates)
		// because patchedDependencies in lockfile may not match when starting from empty repo
		try {
			await sandbox.commands.run(
				`cd ${WORKSPACE_DIR} && pnpm install --frozen-lockfile`,
				{ timeoutMs: 1200000 },
			);
		} catch {
			log("   ⚠ Frozen lockfile failed, retrying with pnpm install...");
			await sandbox.commands.run(`cd ${WORKSPACE_DIR} && pnpm install`, {
				timeoutMs: 1200000,
			});
		}
	} else if (hasLockfileChanges) {
		// Lockfile changed - sync dependencies with branch lockfile
		// Bug fix #1803: Use `pnpm install` without --frozen-lockfile because the branch
		// may have added new dependencies that aren't in the E2B template's node_modules
		log("   Syncing dependencies (lockfile changed)...");
		await sandbox.commands.run(`cd ${WORKSPACE_DIR} && pnpm install`, {
			timeoutMs: 1200000,
		});
	} else {
		log("   ✅ Dependencies already installed");
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
 * Bug fix #1749: Use E2B's `background: true` option instead of shell
 * backgrounding (`nohup ... &`) which doesn't work reliably in E2B.
 * Also start only the web app (`pnpm --filter web dev`) instead of all
 * apps via turbo, which can fail due to unrelated script issues.
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
	// Start the dev server using E2B's background option
	// Bug fix #1749: Use `background: true` instead of shell backgrounding
	// Only start the web app to avoid failures from unrelated apps (scripts, payload)
	sandbox.commands.run(`cd ${WORKSPACE_DIR} && pnpm --filter web dev`, {
		background: true,
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
// Sandbox Destruction
// ============================================================================

/**
 * Result of a sandbox destruction attempt.
 */
export interface DestroySandboxResult {
	/** Whether the sandbox was successfully destroyed */
	success: boolean;
	/** The sandbox ID that was destroyed */
	sandboxId: string;
	/** Error message if destruction failed */
	error?: string;
}

/**
 * Destroy a sandbox gracefully, handling errors non-blocking.
 *
 * Bug fix #1727: Reusable helper for destroying sandboxes with proper
 * error handling. Returns success/failure status rather than throwing.
 *
 * @param sandbox - The E2B sandbox instance to destroy
 * @returns Result object indicating success/failure
 */
export async function destroySandbox(
	sandbox: Sandbox,
): Promise<DestroySandboxResult> {
	const sandboxId = sandbox.sandboxId;

	try {
		await sandbox.kill();
		return {
			success: true,
			sandboxId,
		};
	} catch (error) {
		return {
			success: false,
			sandboxId,
			error: error instanceof Error ? error.message : String(error),
		};
	}
}

/**
 * Destroy multiple sandboxes in parallel, collecting results.
 *
 * @param sandboxes - Array of sandbox instances to destroy
 * @returns Array of results for each sandbox
 */
export async function destroySandboxes(
	sandboxes: Sandbox[],
): Promise<DestroySandboxResult[]> {
	return Promise.all(sandboxes.map(destroySandbox));
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
 * Bug fix #1924: Provider-specific install handling with retry logic for GPT.
 *
 * @param branchName - The branch to checkout (e.g., "alpha/spec-1362")
 * @param timeout - Sandbox timeout in seconds
 * @param uiEnabled - Whether UI mode is enabled
 * @param provider - The agent provider (claude or gpt)
 * @returns The review sandbox instance (Sandbox object, not SandboxInstance)
 */
export async function createReviewSandbox(
	branchName: string,
	timeout: number,
	uiEnabled: boolean = false,
	provider: AgentProvider = "claude",
): Promise<Sandbox> {
	const { log } = createLogger(uiEnabled);
	const providerDisplayName = getProviderDisplayName(provider);

	log(`\n📦 Creating fresh review sandbox (${providerDisplayName})...`);

	const sandbox = await Sandbox.create(getTemplateAlias(provider), {
		timeoutMs: timeout * 1000,
		apiKey: E2B_API_KEY,
		envs: getAllEnvVars(),
	});

	log(`   Review sandbox ID: ${sandbox.sandboxId}`);
	log(`   Provider: ${providerDisplayName}`);

	// Setup git credentials
	if (GITHUB_TOKEN) {
		await setupGitCredentials(sandbox);
	}

	// Bug fix #1937: Check if origin remote exists (GPT templates may have empty git repos)
	// This mirrors the same check in createSandbox() to prevent "exit status 128" errors
	log(`   Checking out branch: ${branchName}`);
	const remoteCheck = await sandbox.commands.run(
		`cd ${WORKSPACE_DIR} && git remote get-url origin 2>/dev/null || echo "NO_REMOTE"`,
		{ timeoutMs: 10000 },
	);
	const hasRemote = !remoteCheck.stdout.trim().includes("NO_REMOTE");

	if (!hasRemote) {
		log("   Adding git remote origin...");
		const addRemoteResult = await sandbox.commands.run(
			`cd ${WORKSPACE_DIR} && git remote add origin https://github.com/slideheroes/2025slideheroes.git 2>&1`,
			{ timeoutMs: 10000 },
		);
		if (addRemoteResult.exitCode !== 0) {
			throw new Error(
				`Review sandbox failed to add git remote (exit ${addRemoteResult.exitCode}):\n${addRemoteResult.stdout}\n${addRemoteResult.stderr}`,
			);
		}
	}

	// Fetch and checkout the branch
	const fetchResult = await sandbox.commands.run(
		`cd ${WORKSPACE_DIR} && git fetch origin 2>&1`,
		{ timeoutMs: 120000 },
	);
	if (fetchResult.exitCode !== 0) {
		throw new Error(
			`Review sandbox git fetch failed (exit ${fetchResult.exitCode}):\n${fetchResult.stdout}\n${fetchResult.stderr}`,
		);
	}

	// Bug fix #2067: Check if branch exists on remote before fetching
	// Matches the pattern from createSandbox() — if branch was deleted or
	// never pushed, push local state first so fetch/checkout succeeds.
	const branchExistsResult = await sandbox.commands.run(
		`cd ${WORKSPACE_DIR} && git ls-remote --heads origin "${branchName}" | wc -l`,
		{ timeoutMs: 30000 },
	);
	const branchExists = branchExistsResult.stdout.trim() === "1";

	if (!branchExists) {
		log(
			`   ⚠️ Branch ${branchName} not found on remote, pushing local state...`,
		);
		const pushResult = await sandbox.commands.run(
			`cd ${WORKSPACE_DIR} && git push origin HEAD:refs/heads/${branchName} 2>&1`,
			{ timeoutMs: 60000 },
		);
		if (pushResult.exitCode !== 0) {
			throw new Error(
				`Review sandbox failed to push branch (exit ${pushResult.exitCode}):\n` +
					`Branch: ${branchName}\n${pushResult.stdout}\n${pushResult.stderr}`,
			);
		}
	}

	// Checkout the branch - force reset to match remote
	const checkoutResult = await sandbox.commands.run(
		`cd ${WORKSPACE_DIR} && git fetch origin "${branchName}" 2>&1 && git checkout -B "${branchName}" FETCH_HEAD 2>&1`,
		{ timeoutMs: 60000 },
	);
	if (checkoutResult.exitCode !== 0) {
		throw new Error(
			`Review sandbox branch checkout failed (exit ${checkoutResult.exitCode}):\n` +
				`Branch: ${branchName}\n${checkoutResult.stdout}\n${checkoutResult.stderr}`,
		);
	}

	// Pull latest to ensure we have all commits
	const pullResult = await sandbox.commands.run(
		`cd ${WORKSPACE_DIR} && git pull origin "${branchName}" 2>&1`,
		{ timeoutMs: 60000 },
	);
	if (pullResult.exitCode !== 0) {
		throw new Error(
			`Review sandbox git pull failed (exit ${pullResult.exitCode}):\n` +
				`Branch: ${branchName}\n${pullResult.stdout}\n${pullResult.stderr}`,
		);
	}

	log("   ✅ Branch checked out");

	// Bug fix #1924: Pre-install validation to catch template issues early
	const validation = await validateSandboxEnvironment(
		sandbox,
		WORKSPACE_DIR,
		log,
	);
	if (!validation.valid) {
		throw new Error(
			`Review sandbox pre-install validation failed:\n${validation.errors.join("\n")}\n` +
				`Provider: ${providerDisplayName}, Sandbox ID: ${sandbox.sandboxId}`,
		);
	}

	// Fresh-clone validation (Bug fix #1803, improved #2067)
	// Validates lockfile consistency without deleting node_modules first.
	// Previous approach: rm -rf node_modules + reinstall — fragile in E2B due to DNS failures.
	// New approach: run pnpm install --frozen-lockfile first (no network if deps are cached).
	// Only fall back to full rm + reinstall if lockfile validation fails.
	log("   Running fresh-clone validation...");

	const lockfileCheck = await sandbox.commands.run(
		`cd ${WORKSPACE_DIR} && pnpm install --frozen-lockfile`,
		{ timeoutMs: 300000 },
	);

	if (lockfileCheck.exitCode !== 0) {
		// Lockfile inconsistent — need full reinstall
		log("   Lockfile validation failed, running full reinstall...");
		await sandbox.commands.run(
			`cd ${WORKSPACE_DIR} && rm -rf node_modules apps/*/node_modules packages/*/node_modules`,
			{ timeoutMs: 60000 },
		);

		const installResult = await executeInstallWithRetry(
			sandbox,
			WORKSPACE_DIR,
			provider,
			log,
		);

		if (!installResult.success) {
			const diagnosticStr = installResult.diagnosticInfo
				? `\nDiagnostics: ${JSON.stringify(installResult.diagnosticInfo, null, 2)}`
				: "";

			throw new Error(
				`Fresh-clone validation failed: Dependencies don't install cleanly.\n` +
					`Provider: ${providerDisplayName}\n` +
					`Error: ${installResult.error}${diagnosticStr}`,
			);
		}
	} else {
		log("   ✅ Lockfile validation passed (dependencies consistent)");
	}

	// Verify TypeScript compiles with clean dependencies
	log("   Running typecheck...");
	const typecheckResult = await sandbox.commands.run(
		`cd ${WORKSPACE_DIR} && pnpm --filter web typecheck`,
		{ timeoutMs: 300000 },
	);

	if (typecheckResult.exitCode !== 0) {
		throw new Error(
			"Fresh-clone validation failed: TypeScript errors on clean install.\n" +
				`Provider: ${providerDisplayName}\n` +
				`Error: ${typecheckResult.stderr || typecheckResult.stdout}`,
		);
	}

	log("   ✅ Fresh-clone validation passed");

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

	log(`   ✅ Review sandbox ready (${providerDisplayName})`);
	return sandbox;
}
