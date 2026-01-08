#!/usr/bin/env tsx
/// <reference types="node" />

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
 *   --sandboxes <n>   Number of sandboxes (default: 3, max: 3)
 *   --timeout <s>     Sandbox timeout in seconds (default: 3600)
 *   --dry-run         Show plan without executing
 *
 * Examples:
 *   tsx spec-orchestrator.ts 1362
 *   tsx spec-orchestrator.ts 1362 --sandboxes 1
 *   tsx spec-orchestrator.ts 1362 --dry-run
 */

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import process from "node:process";
import { execSync } from "node:child_process";
import { Sandbox } from "@e2b/code-interpreter";

// ============================================================================
// Constants
// ============================================================================

const TEMPLATE_ALIAS = "slideheroes-claude-agent-dev";
const WORKSPACE_DIR = "/home/user/project";
const PROGRESS_FILE = ".initiative-progress.json";
const PROGRESS_POLL_INTERVAL_MS = 30000;
const STALL_TIMEOUT_MS = 10 * 60 * 1000;

// Lock file for preventing concurrent orchestration runs
const ORCHESTRATOR_LOCK_FILE = ".ai/alpha/.orchestrator-lock";
const MAX_LOCK_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_RESET_AGE_MS = 10 * 60 * 1000; // 10 minutes for reset operations

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
	requires_database: boolean; // True if any task requires DB access
	database_task_count: number; // Count of tasks requiring DB access
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
	forceUnlock: boolean;
	skipDbReset: boolean;
	skipDbSeed: boolean;
}

interface OrchestratorLock {
	spec_id: number;
	started_at: string;
	pid: number;
	hostname: string;
	reset_in_progress?: boolean;
	reset_started_at?: string;
}

interface SandboxInstance {
	sandbox: Sandbox;
	id: string;
	label: string;
	status: "ready" | "busy" | "completed" | "failed";
	currentFeature: number | null;
}

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
		verification_attempts?: number;
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
	last_heartbeat?: string;
	phase?: string;
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

	// Sandbox Supabase credentials (for DB operations in E2B)
	// These override the main credentials when sandbox project is configured
	const sandboxProjectRef = process.env.SUPABASE_SANDBOX_PROJECT_REF;
	const sandboxUrl = process.env.SUPABASE_SANDBOX_URL;
	const sandboxAnonKey = process.env.SUPABASE_SANDBOX_ANON_KEY;
	const sandboxServiceKey = process.env.SUPABASE_SANDBOX_SERVICE_ROLE_KEY;
	const sandboxDbUrl = process.env.SUPABASE_SANDBOX_DB_URL;
	const supabaseAccessToken = process.env.SUPABASE_ACCESS_TOKEN;

	if (sandboxProjectRef) {
		envs.SUPABASE_SANDBOX_PROJECT_REF = sandboxProjectRef;
	}
	if (sandboxUrl) {
		// Override main Supabase URL with sandbox URL
		envs.NEXT_PUBLIC_SUPABASE_URL = sandboxUrl;
		envs.SUPABASE_URL = sandboxUrl;
	}
	if (sandboxAnonKey) {
		envs.NEXT_PUBLIC_SUPABASE_ANON_KEY = sandboxAnonKey;
		envs.SUPABASE_ANON_KEY = sandboxAnonKey;
	}
	if (sandboxServiceKey) {
		envs.SUPABASE_SERVICE_ROLE_KEY = sandboxServiceKey;
	}
	if (sandboxDbUrl) {
		envs.DATABASE_URL = sandboxDbUrl;
		envs.SUPABASE_SANDBOX_DB_URL = sandboxDbUrl;
		// Payload uses DATABASE_URI instead of DATABASE_URL
		// Add sslmode=require for remote Supabase connections
		const dbUriWithSsl = sandboxDbUrl.includes("?")
			? `${sandboxDbUrl}&sslmode=require`
			: `${sandboxDbUrl}?sslmode=require`;
		envs.DATABASE_URI = dbUriWithSsl;
	}
	if (supabaseAccessToken) {
		envs.SUPABASE_ACCESS_TOKEN = supabaseAccessToken;
	}

	// Payload CMS credentials for seeding
	const payloadSecret = process.env.PAYLOAD_SECRET;
	const seedUserPassword = process.env.SEED_USER_PASSWORD;

	if (payloadSecret) {
		envs.PAYLOAD_SECRET = payloadSecret;
	}
	if (seedUserPassword) {
		envs.SEED_USER_PASSWORD = seedUserPassword;
	}

	// R2 Storage credentials for seeding media files
	// These are needed for the seed engine to reference R2-hosted media URLs
	const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID;
	const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
	const r2AccountId = process.env.R2_ACCOUNT_ID;
	const r2MediaBucket = process.env.R2_MEDIA_BUCKET;
	const r2DownloadsBucket = process.env.R2_DOWNLOADS_BUCKET;
	const r2Region = process.env.R2_REGION;
	const mediaBaseUrl = process.env.PAYLOAD_PUBLIC_MEDIA_BASE_URL;
	const downloadsBaseUrl = process.env.PAYLOAD_PUBLIC_DOWNLOADS_BASE_URL;

	if (r2AccessKeyId) envs.R2_ACCESS_KEY_ID = r2AccessKeyId;
	if (r2SecretAccessKey) envs.R2_SECRET_ACCESS_KEY = r2SecretAccessKey;
	if (r2AccountId) envs.R2_ACCOUNT_ID = r2AccountId;
	if (r2MediaBucket) envs.R2_MEDIA_BUCKET = r2MediaBucket;
	if (r2DownloadsBucket) envs.R2_DOWNLOADS_BUCKET = r2DownloadsBucket;
	if (r2Region) envs.R2_REGION = r2Region;
	if (mediaBaseUrl) envs.PAYLOAD_PUBLIC_MEDIA_BASE_URL = mediaBaseUrl;
	if (downloadsBaseUrl)
		envs.PAYLOAD_PUBLIC_DOWNLOADS_BASE_URL = downloadsBaseUrl;

	return envs;
}

// ============================================================================
// Orchestrator Lock Management
// ============================================================================

let _projectRoot: string | null = null;

function getProjectRoot(): string {
	if (_projectRoot === null) {
		let dir = process.cwd();
		while (dir !== "/") {
			if (fs.existsSync(path.join(dir, ".git"))) {
				_projectRoot = dir;
				return dir;
			}
			dir = path.dirname(dir);
		}
		_projectRoot = process.cwd();
	}
	return _projectRoot ?? process.cwd();
}

function getLockPath(): string {
	return path.join(getProjectRoot(), ORCHESTRATOR_LOCK_FILE);
}

function readLock(): OrchestratorLock | null {
	const lockPath = getLockPath();
	if (!fs.existsSync(lockPath)) {
		return null;
	}
	try {
		const content = fs.readFileSync(lockPath, "utf-8");
		return JSON.parse(content) as OrchestratorLock;
	} catch {
		return null;
	}
}

function writeLock(lock: OrchestratorLock): void {
	const lockPath = getLockPath();
	const lockDir = path.dirname(lockPath);
	if (!fs.existsSync(lockDir)) {
		fs.mkdirSync(lockDir, { recursive: true });
	}
	fs.writeFileSync(lockPath, JSON.stringify(lock, null, 2));
}

function acquireLock(specId: number): boolean {
	const existingLock = readLock();

	if (existingLock) {
		const lockAge = Date.now() - new Date(existingLock.started_at).getTime();

		// Check for stale reset operation
		if (existingLock.reset_in_progress && existingLock.reset_started_at) {
			const resetAge =
				Date.now() - new Date(existingLock.reset_started_at).getTime();
			if (resetAge > MAX_RESET_AGE_MS) {
				console.log(
					`⚠️ Stale reset detected (${Math.round(resetAge / 60000)}m old), overriding lock...`,
				);
				// Fall through to acquire new lock
			} else {
				console.error("❌ Another orchestration run is resetting the database");
				console.error(`   Started: ${existingLock.reset_started_at}`);
				console.error("\n   To force override, use: --force-unlock");
				return false;
			}
		} else if (lockAge < MAX_LOCK_AGE_MS) {
			console.error("❌ Another orchestration run is active:");
			console.error(`   Spec: #${existingLock.spec_id}`);
			console.error(`   Started: ${existingLock.started_at}`);
			console.error(`   Host: ${existingLock.hostname}`);
			console.error(`   PID: ${existingLock.pid}`);
			console.error("\n   To force override, use: --force-unlock");
			return false;
		} else {
			console.log(
				`⚠️ Stale lock detected (${Math.round(lockAge / 3600000)}h old), overriding...`,
			);
		}
	}

	const lock: OrchestratorLock = {
		spec_id: specId,
		started_at: new Date().toISOString(),
		pid: process.pid,
		hostname: os.hostname(),
	};

	writeLock(lock);
	console.log("🔒 Acquired orchestrator lock");
	return true;
}

function releaseLock(): void {
	const lockPath = getLockPath();
	if (fs.existsSync(lockPath)) {
		fs.unlinkSync(lockPath);
		console.log("🔓 Released orchestrator lock");
	}
}

function updateLockResetState(inProgress: boolean): void {
	const lock = readLock();
	if (lock) {
		lock.reset_in_progress = inProgress;
		lock.reset_started_at = inProgress ? new Date().toISOString() : undefined;
		writeLock(lock);
	}
}

// ============================================================================
// Sandbox Database Management
// ============================================================================

async function checkDatabaseCapacity(): Promise<boolean> {
	const dbUrl = process.env.SUPABASE_SANDBOX_DB_URL;
	if (!dbUrl) {
		console.log("   ℹ️ No sandbox database configured, skipping capacity check");
		return true;
	}

	try {
		const result = execSync(
			`psql "${dbUrl}" -t -c "SELECT pg_database_size('postgres')"`,
			{ encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] },
		);

		const sizeBytes = parseInt(result.trim(), 10);
		const sizeMB = sizeBytes / (1024 * 1024);
		const limitMB = 500;
		const warningThreshold = 450;

		console.log(
			`   📊 Sandbox database size: ${sizeMB.toFixed(1)}MB / ${limitMB}MB`,
		);

		if (sizeMB > warningThreshold) {
			console.warn(
				`   ⚠️ Database near capacity (${sizeMB.toFixed(1)}MB / ${limitMB}MB)`,
			);

			if (sizeMB > limitMB * 0.95) {
				console.error(
					"   ❌ Database at capacity. Reset required before orchestration.",
				);
				return false;
			}
		}

		return true;
	} catch (error) {
		// psql might not be installed locally - that's OK, we'll check in sandbox
		console.log(
			"   ℹ️ Could not check database size locally (psql not available)",
		);
		return true;
	}
}

async function resetSandboxDatabase(): Promise<void> {
	const dbUrl = process.env.SUPABASE_SANDBOX_DB_URL;
	if (!dbUrl) {
		console.log("   ℹ️ No sandbox database configured, skipping reset");
		return;
	}

	console.log("🔄 Resetting sandbox database...");

	// Mark reset in progress
	updateLockResetState(true);

	const resetScript = `
-- Reset public schema (preserves auth, storage managed by Supabase)
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
COMMENT ON SCHEMA public IS 'standard public schema';
`;

	try {
		// Execute reset via psql
		execSync(`psql "${dbUrl}" -c "${resetScript.replace(/"/g, '\\"')}"`, {
			encoding: "utf-8",
			stdio: ["pipe", "pipe", "pipe"],
		});
		console.log("   ✅ Database schema reset");

		// Apply base migrations from local project
		const projectRoot = getProjectRoot();
		const webDir = path.join(projectRoot, "apps", "web");

		if (fs.existsSync(path.join(webDir, "supabase", "migrations"))) {
			console.log("   📦 Applying base migrations...");
			try {
				execSync(`supabase db push --db-url "${dbUrl}"`, {
					cwd: webDir,
					encoding: "utf-8",
					stdio: ["pipe", "pipe", "pipe"],
				});
				console.log("   ✅ Base migrations applied");
			} catch (migrationError) {
				console.warn("   ⚠️ Migration push failed (may be OK if no migrations)");
			}
		}

		// Mark reset complete
		updateLockResetState(false);
	} catch (error) {
		// On failure, release lock entirely so next run can retry
		console.error(`   ❌ Database reset failed: ${error}`);
		updateLockResetState(false);
		releaseLock();
		throw error;
	}
}

/**
 * Seed the sandbox database with Payload CMS data.
 * This runs Payload migrations and seeding via a sandbox instance.
 *
 * @param sandbox - The sandbox to use for seeding
 * @returns Promise<boolean> - true if seeding succeeded
 */
async function seedSandboxDatabase(sandbox: Sandbox): Promise<boolean> {
	const dbUrl = process.env.SUPABASE_SANDBOX_DB_URL;
	if (!dbUrl) {
		console.log("   ℹ️ No sandbox database configured, skipping seeding");
		return true;
	}

	console.log("🌱 Seeding sandbox database...");

	try {
		// Step 1: Run Payload migrations
		console.log("   📦 Running Payload migrations...");
		const migrateResult = await sandbox.commands.run(
			`cd ${WORKSPACE_DIR}/apps/payload && ` +
				"NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm run payload migrate --forceAcceptWarning",
			{
				timeoutMs: 300000, // 5 minutes for migrations
				envs: getAllEnvVars(),
			},
		);

		if (migrateResult.exitCode !== 0) {
			console.error(`   ❌ Payload migration failed: ${migrateResult.stderr}`);
			return false;
		}
		console.log("   ✅ Payload migrations complete");

		// Step 2: Run Payload seeding
		console.log("   🌱 Running Payload seeding...");
		const seedResult = await sandbox.commands.run(
			`cd ${WORKSPACE_DIR}/apps/payload && ` +
				"NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm run seed:run --force",
			{
				timeoutMs: 600000, // 10 minutes for seeding
				envs: getAllEnvVars(),
			},
		);

		if (seedResult.exitCode !== 0) {
			console.error(`   ❌ Payload seeding failed: ${seedResult.stderr}`);
			return false;
		}
		console.log("   ✅ Payload seeding complete");

		// Step 3: Quick verification
		console.log("   🔍 Verifying seeded data...");
		const verifyResult = await sandbox.commands.run(
			`psql "${dbUrl}" -t -c "SELECT COUNT(*) FROM payload.users" 2>/dev/null || echo "0"`,
			{ timeoutMs: 30000 },
		);

		const userCount = parseInt(verifyResult.stdout.trim(), 10);
		if (userCount > 0) {
			console.log(`   ✅ Verified: ${userCount} user(s) seeded`);
		} else {
			console.warn(
				"   ⚠️ No users found after seeding (may be normal for some configs)",
			);
		}

		return true;
	} catch (error) {
		console.error(`   ❌ Seeding failed: ${error}`);
		return false;
	}
}

/**
 * Verify that the sandbox database has been seeded.
 * Quick check to avoid re-seeding on resume.
 *
 * @returns Promise<boolean> - true if database appears to be seeded
 */
async function isDatabaseSeeded(): Promise<boolean> {
	const dbUrl = process.env.SUPABASE_SANDBOX_DB_URL;
	if (!dbUrl) {
		return false;
	}

	try {
		// Check if payload.users table exists and has data
		const result = execSync(
			`psql "${dbUrl}" -t -c "SELECT COUNT(*) FROM payload.users" 2>/dev/null || echo "0"`,
			{ encoding: "utf-8" },
		);
		const count = parseInt(result.trim(), 10);
		return count > 0;
	} catch {
		return false;
	}
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
	const manifestPath = path.join(
		manifest.metadata.spec_dir,
		"spec-manifest.json",
	);
	manifest.progress.last_checkpoint = new Date().toISOString();
	fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, "\t"));
}

// ============================================================================
// Work Queue
// ============================================================================

/**
 * Get the next available feature that:
 * 1. Is pending OR failed (failed features are retried on re-run)
 * 2. Has all dependencies completed
 * 3. Is not assigned to another sandbox
 * 4. Database features are serialized (only one DB feature at a time)
 */
function getNextAvailableFeature(manifest: SpecManifest): FeatureEntry | null {
	const completedFeatureIds = new Set(
		manifest.feature_queue
			.filter((f) => f.status === "completed")
			.map((f) => f.id),
	);

	// Also consider completed initiatives for initiative-level dependencies
	const completedInitiativeIds = new Set(
		manifest.initiatives
			.filter((i) => i.status === "completed")
			.map((i) => i.id),
	);

	// Check if a database feature is currently running
	// Database features must be serialized to prevent migration conflicts
	const dbFeatureRunning = manifest.feature_queue.some(
		(f) =>
			f.requires_database &&
			f.status === "in_progress" &&
			f.assigned_sandbox !== undefined,
	);

	for (const feature of manifest.feature_queue) {
		// Skip if completed or currently in_progress (with active sandbox)
		// Allow pending AND failed features (failed features are retried)
		if (feature.status !== "pending" && feature.status !== "failed") {
			continue;
		}

		// Skip if already assigned to a sandbox
		if (feature.assigned_sandbox) {
			continue;
		}

		// Serialize database features: skip DB features if one is already running
		// This prevents migration conflicts when multiple sandboxes try to modify the schema
		if (feature.requires_database && dbFeatureRunning) {
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

/**
 * Clean up stale state from previous runs.
 * This handles:
 * - Features stuck as "in_progress" from crashed/killed sandboxes
 * - Stale sandbox assignments that no longer exist
 * - Failed features that need retry (clear error for fresh attempt)
 */
function cleanupStaleState(manifest: SpecManifest): number {
	let cleanedCount = 0;

	for (const feature of manifest.feature_queue) {
		// Reset in_progress features with stale sandbox assignments
		// When we restart, the old sandboxes are gone
		if (feature.status === "in_progress" && feature.assigned_sandbox) {
			console.log(
				`   🧹 Resetting stale in_progress: #${feature.id} (was ${feature.assigned_sandbox})`,
			);
			feature.status = "pending";
			feature.assigned_sandbox = undefined;
			cleanedCount++;
		}

		// Clear stale sandbox assignments from pending/failed features
		if (
			feature.assigned_sandbox &&
			(feature.status === "pending" || feature.status === "failed")
		) {
			feature.assigned_sandbox = undefined;
			cleanedCount++;
		}

		// Clear error messages from failed features (they'll be retried fresh)
		if (feature.status === "failed" && feature.error) {
			console.log(`   🔄 Marking for retry: #${feature.id} - ${feature.title}`);
			feature.error = undefined;
		}
	}

	// Update initiative statuses based on feature cleanup
	for (const initiative of manifest.initiatives) {
		const initFeatures = manifest.feature_queue.filter(
			(f) => f.initiative_id === initiative.id,
		);
		const completedCount = initFeatures.filter(
			(f) => f.status === "completed",
		).length;
		const inProgressCount = initFeatures.filter(
			(f) => f.status === "in_progress",
		).length;

		initiative.features_completed = completedCount;

		if (completedCount === initiative.feature_count) {
			initiative.status = "completed";
		} else if (inProgressCount > 0 || completedCount > 0) {
			initiative.status = "in_progress";
		} else {
			initiative.status = "pending";
		}
	}

	return cleanedCount;
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
			{ timeoutMs: 30000 },
		);
	} catch {
		// Non-fatal
	}
}

async function createSandbox(
	manifest: SpecManifest,
	label: string,
	timeout: number,
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
		{ timeoutMs: 30000 },
	);
	const branchExists = branchExistsResult.stdout.trim() === "1";

	if (branchExists) {
		console.log(`   Checking out existing branch: ${branchName}`);
		// Fetch the specific branch and checkout using FETCH_HEAD
		// Note: We use FETCH_HEAD instead of origin/branchName because:
		// - git fetch origin "branchName" updates FETCH_HEAD but doesn't create origin/branchName ref
		// - This happens when the branch was just created by another sandbox and our template doesn't know about it
		// IMPORTANT: Also set upstream tracking to enable future fetch/reset operations
		await sandbox.commands.run(
			`cd ${WORKSPACE_DIR} && git fetch origin "${branchName}" && git checkout -B "${branchName}" FETCH_HEAD && git branch --set-upstream-to=origin/"${branchName}"`,
			{ timeoutMs: 60000 },
		);
	} else {
		console.log(`   Creating new branch from dev: ${branchName}`);
		await sandbox.commands.run(
			`cd ${WORKSPACE_DIR} && git checkout dev && git pull origin dev && git checkout -b "${branchName}"`,
			{ timeoutMs: 60000 },
		);
		// Push new branch to remote so other sandboxes can pull from it
		if (GITHUB_TOKEN) {
			console.log("   Pushing new branch to remote...");
			try {
				await sandbox.commands.run(
					`cd ${WORKSPACE_DIR} && git push -u origin "${branchName}"`,
					{ timeoutMs: 60000 },
				);
			} catch {
				console.log(
					"   ⚠ Initial push failed (will retry after first feature)",
				);
			}
		}
	}

	// Clear any stale progress file from template or previous runs
	// This MUST happen before feature implementation to prevent false stall detection
	await sandbox.commands.run(`cd ${WORKSPACE_DIR} && rm -f ${PROGRESS_FILE}`, {
		timeoutMs: 5000,
	});

	// Verify dependencies
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

	// Setup Supabase CLI if sandbox project is configured
	// Note: Supabase CLI is available via project dependencies (pnpm exec supabase)
	const sandboxProjectRef = process.env.SUPABASE_SANDBOX_PROJECT_REF;
	const supabaseAccessToken = process.env.SUPABASE_ACCESS_TOKEN;

	if (sandboxProjectRef && supabaseAccessToken) {
		console.log("   Setting up Supabase CLI...");

		// Verify supabase CLI is available via pnpm
		const cliCheck = await sandbox.commands.run(
			`cd ${WORKSPACE_DIR} && pnpm exec supabase --version 2>/dev/null || echo 'not found'`,
			{ timeoutMs: 30000 },
		);

		if (cliCheck.stdout.includes("not found") || cliCheck.exitCode !== 0) {
			console.log(
				"   ⚠️ Supabase CLI not found in project dependencies, DB features may fail",
			);
		} else {
			console.log(`   Found Supabase CLI: ${cliCheck.stdout.trim()}`);

			// Link to sandbox project (from apps/web which has supabase config)
			console.log(`   Linking to sandbox project: ${sandboxProjectRef}`);
			try {
				const linkResult = await sandbox.commands.run(
					`cd ${WORKSPACE_DIR}/apps/web && pnpm exec supabase link --project-ref ${sandboxProjectRef}`,
					{
						timeoutMs: 60000,
						envs: { SUPABASE_ACCESS_TOKEN: supabaseAccessToken },
					},
				);

				if (linkResult.exitCode === 0) {
					console.log("   ✅ Supabase CLI linked to sandbox project");
				} else {
					console.log(
						`   ⚠️ Supabase link failed (code ${linkResult.exitCode}): ${linkResult.stderr}`,
					);
				}
			} catch (linkError) {
				console.log(`   ⚠️ Supabase link failed (non-fatal): ${linkError}`);
				// Non-fatal - DB features will fail but non-DB features can proceed
			}
		}
	} else if (sandboxProjectRef && !supabaseAccessToken) {
		console.log(
			"   ⚠️ SUPABASE_ACCESS_TOKEN not set, skipping Supabase CLI setup",
		);
	}

	// Update manifest
	if (!manifest.sandbox.sandbox_ids.includes(sandbox.sandboxId)) {
		manifest.sandbox.sandbox_ids.push(sandbox.sandboxId);
	}
	manifest.sandbox.branch_name = branchName;
	manifest.sandbox.created_at =
		manifest.sandbox.created_at || new Date().toISOString();

	return {
		sandbox,
		id: sandbox.sandboxId,
		label,
		status: "ready",
		currentFeature: null,
	};
}

// ============================================================================
// Progress Polling & Display
// ============================================================================

/**
 * Display a structured progress update from the sandbox progress file.
 * Returns a unique key to avoid duplicate displays.
 */
function displayProgressUpdate(
	progress: SandboxProgress,
	featureTaskCount: number,
	lastDisplayed: string,
	sandboxLabel: string,
): string {
	const completed = progress.completed_tasks?.length || 0;
	const total = featureTaskCount;
	const current = progress.current_task;
	const contextPercent = progress.context_usage_percent || 0;

	// Create a unique key to avoid duplicate displays
	const updateKey = `${completed}-${current?.id}-${current?.status}-${progress.phase}`;
	if (updateKey === lastDisplayed) {
		return lastDisplayed; // No change
	}

	// Build progress bar
	const progressPercent = Math.round((completed / total) * 100);
	const barLength = 20;
	const filledLength = Math.round((progressPercent / 100) * barLength);
	const progressBar =
		"█".repeat(filledLength) + "░".repeat(barLength - filledLength);

	console.log(`\n   ┌─ 📊 [${sandboxLabel}] Progress Update ${"─".repeat(35)}`);
	console.log(
		`   │ Tasks: [${progressBar}] ${completed}/${total} (${progressPercent}%)`,
	);

	if (progress.phase) {
		console.log(`   │ Phase: ${progress.phase}`);
	}

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

		if (current.verification_attempts && current.verification_attempts > 1) {
			console.log(
				`   │ Verification: attempt ${current.verification_attempts}`,
			);
		}
	}

	if (progress.current_group) {
		console.log(
			`   │ Group: ${progress.current_group.name} (${progress.current_group.tasks_completed}/${progress.current_group.tasks_total})`,
		);
	}

	// Always show context usage (even if 0) for visibility
	if (typeof contextPercent === "number" && !Number.isNaN(contextPercent)) {
		const contextIcon = contextPercent > 50 ? "⚠️" : "📈";
		console.log(`   │ Context: ${contextIcon} ${contextPercent}%`);
	}

	if (progress.last_commit) {
		console.log(`   │ Last commit: ${progress.last_commit.substring(0, 7)}`);
	}

	// Validate heartbeat timestamp before calculating age
	if (progress.last_heartbeat && typeof progress.last_heartbeat === "string") {
		const heartbeatDate = new Date(progress.last_heartbeat);
		const heartbeatTime = heartbeatDate.getTime();

		// Only display if we got a valid date (not NaN)
		if (!Number.isNaN(heartbeatTime)) {
			const heartbeatAge = Math.round((Date.now() - heartbeatTime) / 1000);
			const heartbeatIcon = heartbeatAge > 120 ? "⚠️" : "💓";
			console.log(`   │ Heartbeat: ${heartbeatIcon} ${heartbeatAge}s ago`);
		}
	}

	console.log(`   └${"─".repeat(55)}\n`);

	return updateKey;
}

/**
 * Start polling the progress file in the sandbox.
 * Returns a cleanup function to stop polling.
 *
 * @param sessionStartTime - When this feature implementation session started.
 *   Progress with heartbeats before this time is considered stale and ignored.
 */
function startProgressPolling(
	sandbox: Sandbox,
	featureTaskCount: number,
	sandboxLabel: string,
	sessionStartTime: Date = new Date(),
): { stop: () => void; getLastProgress: () => SandboxProgress | null } {
	let lastDisplayed = "";
	let isPolling = true;
	let lastProgress: SandboxProgress | null = null;

	const poll = async () => {
		while (isPolling) {
			try {
				const result = await sandbox.commands.run(
					`cat ${WORKSPACE_DIR}/${PROGRESS_FILE} 2>/dev/null`,
					{ timeoutMs: 5000 },
				);

				if (result.stdout && result.stdout.trim()) {
					const progress: SandboxProgress = JSON.parse(result.stdout);

					// Skip stale progress data from previous sessions
					// A heartbeat more than 5 minutes before our session started is definitely stale
					if (progress.last_heartbeat) {
						const heartbeatTime = new Date(progress.last_heartbeat).getTime();
						const sessionStart = sessionStartTime.getTime() - 5 * 60 * 1000; // 5 min grace
						if (heartbeatTime < sessionStart) {
							// Stale data from previous run - ignore and wait for fresh data
							continue;
						}
					}

					lastProgress = progress;
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
		getLastProgress: () => lastProgress,
	};
}

/**
 * Check if a feature has stalled (no heartbeat or progress for STALL_TIMEOUT_MS).
 *
 * @param progress - The last progress data received
 * @param sessionStartTime - When this session started (to filter stale data)
 */
function checkForStall(
	progress: SandboxProgress | null,
	sessionStartTime: Date = new Date(),
): {
	stalled: boolean;
	reason?: string;
} {
	if (!progress) {
		return { stalled: false };
	}

	const now = Date.now();
	const sessionStart = sessionStartTime.getTime();

	// Check heartbeat age
	if (progress.last_heartbeat) {
		const heartbeatTime = new Date(progress.last_heartbeat).getTime();

		// Ignore heartbeats from before this session started (stale data)
		if (heartbeatTime < sessionStart - 5 * 60 * 1000) {
			return { stalled: false }; // Don't flag stale data as stalled
		}

		const heartbeatAge = now - heartbeatTime;
		if (heartbeatAge > STALL_TIMEOUT_MS) {
			return {
				stalled: true,
				reason: `No heartbeat for ${Math.round(heartbeatAge / 60000)} minutes`,
			};
		}
	}

	// Check if task has been "starting" for too long
	if (
		progress.current_task?.status === "starting" &&
		progress.current_task.started_at
	) {
		const taskStartTime = new Date(progress.current_task.started_at).getTime();

		// Ignore task start times from before this session
		if (taskStartTime < sessionStart - 5 * 60 * 1000) {
			return { stalled: false };
		}

		const taskAge = now - taskStartTime;
		if (taskAge > STALL_TIMEOUT_MS) {
			return {
				stalled: true,
				reason: `Task ${progress.current_task.id} stuck in "starting" for ${Math.round(taskAge / 60000)} minutes`,
			};
		}
	}

	return { stalled: false };
}

// ============================================================================
// Feature Implementation
// ============================================================================

async function runFeatureImplementation(
	instance: SandboxInstance,
	manifest: SpecManifest,
	feature: FeatureEntry,
): Promise<{ success: boolean; tasksCompleted: number; error?: string }> {
	console.log(
		`\n   ┌── [${instance.label}] Feature #${feature.id}: ${feature.title}`,
	);
	console.log(`   │   Tasks: ${feature.task_count}`);

	// Mark feature as in_progress
	feature.status = "in_progress";
	feature.assigned_sandbox = instance.label;
	instance.currentFeature = feature.id;
	instance.status = "busy";
	saveManifest(manifest);

	// Clear stale progress file from previous runs
	// This prevents the orchestrator from reading old heartbeat timestamps
	try {
		await instance.sandbox.commands.run(
			`cd ${WORKSPACE_DIR} && rm -f ${PROGRESS_FILE}`,
			{ timeoutMs: 5000 },
		);
	} catch {
		// Ignore - file may not exist
	}

	// CRITICAL: Pull latest code before starting feature
	// This ensures we have code from features implemented by OTHER sandboxes
	// Without this, features with dependencies would fail (missing imports, types, etc.)
	const branchName = manifest.sandbox.branch_name;

	// Check if remote branch exists before attempting pull
	const remoteBranchCheck = await instance.sandbox.commands.run(
		`cd ${WORKSPACE_DIR} && git ls-remote --heads origin "${branchName}" | wc -l`,
		{ timeoutMs: 30000 },
	);
	const remoteBranchExists = remoteBranchCheck.stdout.trim() === "1";

	if (!remoteBranchExists) {
		console.log("   │   ℹ️ Remote branch not yet pushed - skipping pull");
	} else {
		console.log("   │   Pulling latest code...");
		try {
			// Use fetch + reset instead of pull --rebase to avoid conflicts when branches diverge
			// This is safe because:
			// 1. Each sandbox commits and pushes after completing a feature
			// 2. Before starting a new feature, we want to sync with whatever is on remote
			// 3. Any uncommitted local changes are from a previous failed run and should be discarded
			await instance.sandbox.commands.run(
				`cd ${WORKSPACE_DIR} && git fetch origin "${branchName}" && git reset --hard origin/"${branchName}"`,
				{ timeoutMs: 60000 },
			);
			console.log("   │   ✓ Code synced");
		} catch (pullError) {
			console.log(`   │   ⚠ Pull failed (continuing anyway): ${pullError}`);
		}
	}

	const prompt = `/alpha:implement ${feature.id}`;
	console.log(`   │   Running: ${prompt}`);
	console.log(
		`   │   Progress polling every ${PROGRESS_POLL_INTERVAL_MS / 1000}s...`,
	);

	let capturedStdout = "";
	let capturedStderr = "";

	// Track when this session started (for filtering stale progress data)
	const sessionStartTime = new Date();

	// Start progress polling
	const progressPoller = startProgressPolling(
		instance.sandbox,
		feature.task_count,
		instance.label,
		sessionStartTime,
	);

	// Start stall detection interval
	let stallDetected = false;
	const stallCheckInterval = setInterval(() => {
		const lastProgress = progressPoller.getLastProgress();
		const stallCheck = checkForStall(lastProgress, sessionStartTime);
		if (stallCheck.stalled && !stallDetected) {
			stallDetected = true;
			console.log(`   │   ⚠️ STALL DETECTED: ${stallCheck.reason}`);
		}
	}, 60000); // Check every minute

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
			},
		);

		// Stop polling and stall detection
		progressPoller.stop();
		clearInterval(stallCheckInterval);

		// Get last progress from poller as a fallback
		const lastPolledProgress = progressPoller.getLastProgress();

		// Read progress file
		const progressResult = await instance.sandbox.commands.run(
			`cat ${WORKSPACE_DIR}/${PROGRESS_FILE} 2>/dev/null || echo '{}'`,
			{ timeoutMs: 10000 },
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

		// Fallback: Use last polled progress if available and more accurate
		if (tasksCompleted === 0 && lastPolledProgress?.completed_tasks) {
			tasksCompleted = lastPolledProgress.completed_tasks.length;
		}

		// Fallback: If status is completed and exit code is 0, but tasksCompleted is still 0,
		// try to extract from Claude output or assume all tasks completed
		if (
			status === "completed" &&
			result.exitCode === 0 &&
			tasksCompleted === 0
		) {
			// Try to extract task count from captured output (e.g., "Tasks: 8/8 completed")
			const taskMatch = capturedStdout.match(
				/Tasks?:?\s*(\d+)\s*\/\s*(\d+)\s*(?:completed|complete|\(100%\))/i,
			);
			if (taskMatch) {
				tasksCompleted = parseInt(taskMatch[1], 10);
			} else {
				// Last resort: assume all tasks completed if feature marked as complete
				tasksCompleted = feature.task_count;
			}
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
			const initiative = manifest.initiatives.find(
				(i) => i.id === feature.initiative_id,
			);
			if (initiative) {
				initiative.features_completed++;
				const initFeatures = manifest.feature_queue.filter(
					(f) => f.initiative_id === initiative.id,
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
					{ timeoutMs: 120000 },
				);
			} catch (pushError) {
				console.log(`   │   ⚠ Push failed: ${pushError}`);
			}
		}

		manifest.progress.tasks_completed += tasksCompleted;
		updateNextFeatureId(manifest);
		saveManifest(manifest);

		const icon =
			status === "completed" ? "✅" : status === "blocked" ? "🚫" : "❌";
		console.log(
			`   └── ${icon} ${status} (${tasksCompleted}/${feature.task_count} tasks)`,
		);

		return {
			success: status === "completed",
			tasksCompleted,
			error: status !== "completed" ? `Feature ${status}` : undefined,
		};
	} catch (error) {
		// Stop polling and stall detection on error
		progressPoller.stop();
		clearInterval(stallCheckInterval);

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
	const specDirOrNull = findSpecDir(projectRoot, options.specId);

	if (!specDirOrNull) {
		console.error(`Spec #${options.specId} not found`);
		process.exit(1);
	}

	const specDir: string = specDirOrNull!;

	const manifestOrNull = loadManifest(specDir);

	if (!manifestOrNull) {
		console.error(
			"Spec manifest not found. Run generate-spec-manifest.ts first.",
		);
		process.exit(1);
	}

	const manifest: SpecManifest = manifestOrNull!;

	// Print header
	console.log("═".repeat(70));
	console.log("   ALPHA SPEC ORCHESTRATOR");
	console.log("═".repeat(70));

	// Handle force unlock
	if (options.forceUnlock) {
		console.log("\n🔓 Force releasing orchestrator lock...");
		releaseLock();
	}

	// Acquire orchestrator lock (skip for dry-run)
	if (!options.dryRun) {
		if (!acquireLock(options.specId)) {
			process.exit(1);
		}
	}

	// Register cleanup handler for lock release
	const cleanupAndExit = (code: number) => {
		if (!options.dryRun) {
			releaseLock();
		}
		process.exit(code);
	};

	process.on("SIGINT", () => {
		console.log("\n\n⚠️ Interrupted, releasing lock...");
		cleanupAndExit(130);
	});

	process.on("SIGTERM", () => {
		console.log("\n\n⚠️ Terminated, releasing lock...");
		cleanupAndExit(143);
	});

	// Check sandbox database capacity (skip for dry-run)
	if (!options.dryRun && process.env.SUPABASE_SANDBOX_DB_URL) {
		console.log("\n📊 Checking sandbox database...");
		const hasCapacity = await checkDatabaseCapacity();
		if (!hasCapacity) {
			releaseLock();
			process.exit(1);
		}

		// Reset sandbox database (unless skipped)
		if (!options.skipDbReset) {
			try {
				await resetSandboxDatabase();
			} catch (error) {
				console.error("Failed to reset sandbox database:", error);
				process.exit(1);
			}
		} else {
			console.log("   ⏭️ Skipping database reset (--skip-db-reset)");
		}
	}

	// Clean up stale state from previous runs
	// This resets in_progress features with dead sandboxes and prepares failed features for retry
	const cleanedCount = cleanupStaleState(manifest);
	if (cleanedCount > 0) {
		console.log(`\n🧹 Cleaned up ${cleanedCount} stale feature(s)`);
		saveManifest(manifest);
	}
	console.log(
		`\n📊 Spec #${manifest.metadata.spec_id}: ${manifest.metadata.spec_name}`,
	);
	console.log(`   Initiatives: ${manifest.initiatives.length}`);
	console.log(`   Features: ${manifest.progress.features_total}`);
	console.log(`   Tasks: ${manifest.progress.tasks_total}`);
	console.log(
		`   Progress: ${manifest.progress.features_completed}/${manifest.progress.features_total} features`,
	);
	console.log(`   Sandboxes: ${options.sandboxCount}`);

	// Check what's next
	const nextFeature = getNextAvailableFeature(manifest);
	if (nextFeature) {
		console.log(`\n🎯 Next feature: #${nextFeature.id} - ${nextFeature.title}`);
	} else if (
		manifest.progress.features_completed === manifest.progress.features_total
	) {
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
	const STAGGER_DELAY_MS = 20000;

	// Create FIRST sandbox (needed for seeding)
	console.log("\n📦 Creating first sandbox...");
	const firstInstance = await createSandbox(manifest, "sbx-a", options.timeout);
	instances.push(firstInstance);

	// Seed database via first sandbox (unless skipped or already seeded)
	if (
		!options.skipDbReset &&
		!options.skipDbSeed &&
		process.env.SUPABASE_SANDBOX_DB_URL
	) {
		// Check if database is already seeded (for resume scenarios)
		const alreadySeeded = await isDatabaseSeeded();
		if (alreadySeeded) {
			console.log("   ℹ️ Database already seeded, skipping seeding step");
		} else {
			const seedSuccess = await seedSandboxDatabase(firstInstance.sandbox);
			if (!seedSuccess) {
				console.error("❌ Database seeding failed, aborting orchestration");
				await firstInstance.sandbox.kill();
				releaseLock();
				process.exit(1);
			}
		}
	} else if (options.skipDbSeed) {
		console.log("   ⏭️ Skipping database seeding (--skip-db-seed)");
	}

	// Create remaining sandboxes
	for (let i = 1; i < options.sandboxCount; i++) {
		const label = `sbx-${String.fromCharCode(97 + i)}`;

		console.log(
			`\n   ⏳ Waiting ${STAGGER_DELAY_MS / 1000}s before next sandbox...`,
		);
		await sleep(STAGGER_DELAY_MS);

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
	manifest.progress.started_at =
		manifest.progress.started_at || new Date().toISOString();
	saveManifest(manifest);

	// Main work loop
	await runWorkLoop(instances, manifest);

	// Push final changes
	if (GITHUB_TOKEN && instances.length > 0) {
		console.log("\n📤 Pushing final changes...");
		try {
			await instances[0].sandbox.commands.run(
				`cd ${WORKSPACE_DIR} && git push -u origin "${manifest.sandbox.branch_name}"`,
				{ timeoutMs: 120000 },
			);
			console.log(`   ✅ Pushed to ${manifest.sandbox.branch_name}`);
		} catch (error) {
			console.log(`   ⚠️ Push failed: ${error}`);
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
			{ timeoutMs: 60000 },
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
	const reviewUrls: Array<{
		label: string;
		vscode: string;
		devServer: string;
	}> = [];

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

	// Add sandbox database review URL if configured
	if (process.env.SUPABASE_SANDBOX_PROJECT_REF) {
		console.log("\n📊 Database Review:");
		console.log(
			`   Supabase Studio: https://supabase.com/dashboard/project/${process.env.SUPABASE_SANDBOX_PROJECT_REF}`,
		);
	}

	// Release the orchestrator lock
	releaseLock();

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
	manifest: SpecManifest,
): Promise<void> {
	// Track active work
	const activeWork = new Map<string, Promise<void>>();

	while (true) {
		// Check if we're done
		const pendingFeatures = manifest.feature_queue.filter(
			(f) => f.status === "pending" || f.status === "in_progress",
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
				(f) => f.status === "pending" && f.dependencies.length > 0,
			);

			if (blockedFeatures.length > 0) {
				console.log("\n⚠️ Features blocked by incomplete dependencies:");
				for (const f of blockedFeatures.slice(0, 5)) {
					console.log(
						`   #${f.id}: blocked by ${f.dependencies.map((d) => `#${d}`).join(", ")}`,
					);
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
	console.log(`   Features: ${pendingFeatures.length}`);
	console.log(`   Estimated Hours: ${totalHours}`);
}

function printSummary(
	manifest: SpecManifest,
	instances: SandboxInstance[],
	reviewUrls: Array<{ label: string; vscode: string; devServer: string }>,
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
		`   Initiatives: ${manifest.progress.initiatives_completed}/${manifest.progress.initiatives_total}`,
	);
	console.log(`   Features: ${completed}/${manifest.progress.features_total}`);
	console.log(`   Failed: ${failed}`);
	console.log(
		`   Tasks: ${manifest.progress.tasks_completed}/${manifest.progress.tasks_total}`,
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
		sandboxCount: 3,
		timeout: 3600,
		dryRun: false,
		forceUnlock: false,
		skipDbReset: false,
		skipDbSeed: false,
	};

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];

		if ((arg === "--sandboxes" || arg === "-s") && args[i + 1]) {
			options.sandboxCount = Math.min(parseInt(args[i + 1], 10), 3);
			i++;
		} else if (arg === "--timeout" && args[i + 1]) {
			options.timeout = parseInt(args[i + 1], 10);
			i++;
		} else if (arg === "--dry-run") {
			options.dryRun = true;
		} else if (arg === "--force-unlock") {
			options.forceUnlock = true;
		} else if (arg === "--skip-db-reset") {
			options.skipDbReset = true;
		} else if (arg === "--skip-db-seed") {
			options.skipDbSeed = true;
		} else if (
			!arg.startsWith("--") &&
			!arg.startsWith("-") &&
			!options.specId
		) {
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
  --sandboxes <n>, -s   Number of sandboxes (default: 3, max: 3)
  --timeout <s>         Sandbox timeout in seconds (default: 3600)
  --dry-run             Show execution plan without running
  --force-unlock        Force release any existing orchestrator lock
  --skip-db-reset       Skip sandbox database reset at startup
  --skip-db-seed        Skip Payload CMS seeding after reset

Features:
  - Takes Spec ID (not Initiative ID)
  - Work queue: sandboxes dynamically pull next available feature
  - Dependency-aware: respects feature and initiative dependencies
  - Auto-resume: continues from where it left off
  - Progress polling: real-time visibility during feature execution
  - Stall detection: auto-detects hung Claude sessions
  - Sandbox database: resets dedicated Supabase project per run
  - Database seeding: auto-seeds Payload CMS with test data
  - Orchestrator lock: prevents concurrent runs

Examples:
  tsx spec-orchestrator.ts 1362              # Run with 3 sandboxes
  tsx spec-orchestrator.ts 1362 --dry-run    # Preview execution plan
  tsx spec-orchestrator.ts 1362 -s 1         # Single sandbox mode
  tsx spec-orchestrator.ts 1362 -s 2         # Two sandbox mode
  tsx spec-orchestrator.ts 1362 --force-unlock  # Override stale lock
  tsx spec-orchestrator.ts 1362 --skip-db-seed  # Resume without re-seeding

Environment Variables (for sandbox database):
  SUPABASE_SANDBOX_PROJECT_REF   Sandbox project reference ID
  SUPABASE_SANDBOX_URL           Sandbox project URL
  SUPABASE_SANDBOX_ANON_KEY      Sandbox anon key
  SUPABASE_SANDBOX_SERVICE_ROLE_KEY  Sandbox service role key
  SUPABASE_SANDBOX_DB_URL        Sandbox database connection URL
  SUPABASE_ACCESS_TOKEN          CLI access token for linking

Environment Variables (for Payload CMS seeding):
  PAYLOAD_SECRET                 Payload CMS secret key
  SEED_USER_PASSWORD             Password for seeded test users
  R2_ACCESS_KEY_ID               Cloudflare R2 access key
  R2_SECRET_ACCESS_KEY           Cloudflare R2 secret key
  R2_ACCOUNT_ID                  Cloudflare R2 account ID
  PAYLOAD_PUBLIC_MEDIA_BASE_URL  R2 media bucket URL
  PAYLOAD_PUBLIC_DOWNLOADS_BASE_URL  R2 downloads bucket URL

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
