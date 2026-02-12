/**

* Type definitions for the Alpha Spec Orchestrator
*
* This module contains all shared types and interfaces used across
* the orchestrator modules.
 */

import type { Sandbox } from "@e2b/code-interpreter";

import type { RefinementEntry } from "./refine.types.js";

// ============================================================================
// Provider-Specific Install Configuration (Bug fix #1924)
// ============================================================================

/**
 * Configuration for provider-specific pnpm install behavior.
 *
 * Different E2B templates may have different cached states, requiring
 * different install strategies. GPT templates may timeout with --frozen-lockfile
 * due to missing dependency cache.
 */
export interface ProviderInstallConfig {
	/** pnpm install flags for this provider */
	installFlags: string[];
	/** Timeout for install command in milliseconds */
	timeoutMs: number;
	/** Maximum retry attempts for install */
	maxRetries: number;
	/** Base delay for exponential backoff in milliseconds */
	retryBaseDelayMs: number;
	/** Whether to skip --frozen-lockfile validation */
	skipFrozenLockfile: boolean;
}

/**
 * Result of sandbox environment validation.
 */
export interface SandboxValidationResult {
	/** Whether the environment is valid for install */
	valid: boolean;
	/** List of validation errors encountered */
	errors: string[];
	/** Node.js version found (if available) */
	nodeVersion?: string;
	/** Whether package.json was found */
	hasPackageJson: boolean;
	/** Whether pnpm-lock.yaml was found */
	hasLockfile: boolean;
}

/**
 * Result of an install attempt with retry logic.
 */
export interface InstallAttemptResult {
	/** Whether the install succeeded */
	success: boolean;
	/** Number of attempts made */
	attemptsMade: number;
	/** Total duration in milliseconds */
	durationMs: number;
	/** Error message if failed */
	error?: string;
	/** Detailed error for diagnostics */
	diagnosticInfo?: {
		provider: AgentProvider;
		flags: string[];
		timeoutMs: number;
		lastExitCode?: number;
		lastStderr?: string;
	};
}

// ============================================================================
// Feature & Initiative Types
// ============================================================================

export interface FeatureEntry {
	id: string; // Semantic ID: S1362.I1.F1 or legacy: 1367
	initiative_id: string; // Semantic ID: S1362.I1 or legacy: 1365
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
	dependencies: string[]; // Feature IDs this is blocked by (semantic or legacy)
	github_issue: number | null;
	assigned_sandbox?: string;
	/** Timestamp when feature was assigned to a sandbox (for race condition detection) */
	assigned_at?: number;
	error?: string;
	requires_database: boolean;
	database_task_count: number;
	/** Number of retry attempts for deadlock recovery (Bug fix #1777) */
	retry_count?: number;
	/** ISO timestamp of the last infrastructure reset (Bug fix #2074) */
	last_reset_at?: string | null;
	/** Reason for the last retry: infrastructure resets don't consume retry budget (Bug fix #2074) */
	retry_reason?: "infrastructure_reset" | "feature_failure";
	/** Number of sandbox extension attempts for this feature (Bug fix #2074) */
	extension_count?: number;
}

export interface InitiativeEntry {
	id: string; // Semantic ID: S1362.I1 or legacy: 1365
	name: string;
	slug: string;
	priority: number;
	status: "pending" | "in_progress" | "completed" | "failed" | "partial";
	initiative_dir: string;
	feature_count: number;
	features_completed: number;
	dependencies: string[]; // Initiative IDs this is blocked by (semantic or legacy)
}

// ============================================================================
// Phase Execution Types
// ============================================================================

/**
 * Definition of a phase within a spec execution.
 * Phases group initiatives into manageable execution units of 7-8 features,
 * enabling sequential execution with branch chaining.
 */
export interface PhaseDefinition {
	/** Phase identifier (e.g., "P1", "P2", "P3") */
	id: string;
	/** Human-readable phase name (e.g., "Foundation", "Widgets", "Polish") */
	name: string;
	/** Initiative IDs included in this phase (e.g., ["S1918.I1", "S1918.I2"]) */
	initiative_ids: string[];
	/** Total feature count across all initiatives in this phase */
	feature_count: number;
	/** Total task count across all initiatives in this phase */
	task_count: number;
}

// ============================================================================
// Manifest Types
// ============================================================================

/**
 * Required environment variable specification.
 * Used to track external service credentials needed by features.
 */
export interface RequiredEnvVar {
	/** Environment variable name (e.g., CAL_OAUTH_CLIENT_ID) */
	name: string;
	/** What this credential is used for */
	description: string;
	/** Where to obtain this credential (URL or instructions) */
	source: string;
	/** If false, feature can degrade gracefully without this */
	required: boolean;
	/** Where variable is used (affects NEXT_PUBLIC_ prefix) */
	scope: "client" | "server" | "both";
	/** Which features need this variable */
	features: string[];
}

export interface SpecManifest {
	metadata: {
		spec_id: string; // Semantic ID: S1362 or legacy: 1362
		spec_name: string;
		generated_at: string;
		spec_dir: string;
		research_dir: string;
		/** Aggregated environment variables required by all features in this spec */
		required_env_vars?: RequiredEnvVar[];
	};
	initiatives: InitiativeEntry[];
	feature_queue: FeatureEntry[];
	progress: {
		status:
			| "pending"
			| "in_progress"
			| "completing"
			| "completed"
			| "failed"
			| "partial";
		/**
		 * Completion status indicating the final state of the orchestration.
		 * Bug fix #1930: Track review sandbox creation success/failure separately.
		 * - "completed": All features completed AND review sandbox created
		 * - "partial_completion": All features completed but review sandbox failed
		 * - "failed": Features failed during implementation
		 */
		completion_status?: "completed" | "partial_completion" | "failed";
		initiatives_completed: number;
		initiatives_total: number;
		features_completed: number;
		features_total: number;
		tasks_completed: number;
		tasks_total: number;
		next_feature_id: string | null; // Semantic ID: S1362.I1.F1 or legacy: 1367
		last_completed_feature_id: string | null;
		started_at: string | null;
		completed_at: string | null;
		last_checkpoint: string | null;
		/**
		 * Error message if review sandbox creation failed.
		 * Bug fix #1931: Persist error details so they survive beyond UI session.
		 */
		review_error?: string;
	};
	sandbox: {
		sandbox_ids: string[];
		branch_name: string | null;
		created_at: string | null;
		/** Count of sandbox restarts during orchestration (for diagnostics) */
		restart_count?: number;
	};
	/** Phase definitions for phased execution (optional, auto-generated if missing) */
	phases?: PhaseDefinition[];
	/** History of refinements applied to this spec (optional) */
	refinements?: RefinementEntry[];
}

// ============================================================================
// Orchestrator Configuration Types
// ============================================================================

export interface OrchestratorOptions {
	specId: number;
	sandboxCount: number;
	timeout: number;
	dryRun: boolean;
	forceUnlock: boolean;
	skipDbReset: boolean;
	skipDbSeed: boolean;
	ui: boolean;
	minimalUi: boolean;
	/** Which coding agent to run inside sandboxes */
	provider: AgentProvider;
	/** Reset manifest state (delete and regenerate) before running */
	reset: boolean;
	/** Skip work loop and jump to completion sequence (for debugging) */
	skipToCompletion: boolean;
	/** Skip interactive pre-flight environment variable check */
	skipPreFlight: boolean;
	/** Generate spec-level documentation after completion using /alpha:document */
	document: boolean;
	/** Run only a specific phase's features (e.g., "P1") */
	phase?: string;
	/** Base branch to fork from (e.g., "alpha/spec-S1918-P1") for branch chaining */
	baseBranch?: string;
}

export type AgentProvider = "claude" | "gpt";

export interface OrchestratorLock {
	spec_id: number;
	started_at: string;
	pid: number;
	hostname: string;
	reset_in_progress?: boolean;
	reset_started_at?: string;
}

// ============================================================================
// Sandbox Types
// ============================================================================

export interface SandboxInstance {
	sandbox: Sandbox;
	id: string;
	label: string;
	status: "ready" | "busy" | "completed" | "failed";
	currentFeature: string | null; // Semantic ID: S1362.I1.F1 or legacy: 1367
	featureStartedAt?: Date;
	lastProgressSeen?: Date;
	lastHeartbeat?: Date;
	retryCount: number;
	claudeProcessId?: number;
	/** Count of output lines received since feature started (for startup detection) */
	outputLineCount?: number;
	/** Whether meaningful output has been received (for startup hang detection) */
	hasReceivedOutput?: boolean;
	/** When the sandbox was created (for max age tracking) */
	createdAt: Date;
	/** Last successful keepalive timestamp */
	lastKeepaliveAt?: Date;
	/** Run ID for this orchestrator session (for log correlation) */
	runId?: string;
}

export interface SandboxProgress {
	feature?: {
		issue_number: string; // Semantic ID: S1362.I1.F1 or legacy: 1367
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
	status?: "in_progress" | "completed" | "failed";
	last_commit?: string;
	last_heartbeat?: string;
	last_tool?: string;
	phase?: string;
	recent_output?: string[];
}

// ============================================================================
// Health Check Types
// ============================================================================

export interface HealthCheckResult {
	healthy: boolean;
	issue?: "no_progress_file" | "stale_heartbeat" | "high_resource_no_progress";
	message?: string;
	timeSinceStart?: number;
	timeSinceProgress?: number;
	timeSinceHeartbeat?: number;
}

// ============================================================================
// UI Manager Types
// ============================================================================

export interface UIManager {
	start: (onExit?: () => void) => void;
	stop: () => void;
	getState: () => unknown;
	waitForExit: () => Promise<void>;
}

// ============================================================================
// Feature Implementation Result
// ============================================================================

export interface FeatureImplementationResult {
	success: boolean;
	tasksCompleted: number;
	error?: string;
}

// ============================================================================
// Review URL Types
// ============================================================================

export interface ReviewUrl {
	label: string;
	vscode: string;
	devServer: string;
}

// ============================================================================
// Startup Monitoring Types
// ============================================================================

/**
 * Result of a startup monitoring check.
 */
export interface StartupMonitorResult {
	/** Whether startup is considered successful */
	success: boolean;
	/** Number of bytes of output received */
	outputBytes: number;
	/** Number of lines of output received */
	outputLines: number;
	/** Time elapsed since startup began (ms) */
	elapsedMs: number;
	/** Error message if startup failed */
	error?: string;
}

/**
 * Configuration for startup timeout and retry behavior.
 */
export interface StartupConfig {
	/** Timeout for startup (ms) */
	timeoutMs: number;
	/** Delays between retry attempts (ms) */
	retryDelays: number[];
	/** Maximum number of retry attempts */
	maxRetries: number;
	/** Minimum bytes of output to consider startup successful */
	minOutputBytes: number;
	/** Minimum lines of output to consider startup successful */
	minOutputLines: number;
}

/**
 * Tracks startup attempts for a feature implementation.
 */
export interface StartupAttemptRecord {
	/** Total number of startup attempts made */
	totalAttempts: number;
	/** Which attempt succeeded (null if all failed) */
	succeededOnAttempt: number | null;
	/** Timestamps of each attempt */
	attemptTimestamps: string[];
	/** Total time spent on startup attempts (ms) */
	totalStartupTimeMs: number;
}
