/**

* Constants for the Alpha Spec Orchestrator
*
* Central configuration for timeouts, intervals, and paths.
 */

// ============================================================================
// E2B Template & Workspace
// ============================================================================

/** E2B sandbox template alias for SlideHeroes Claude agent */
export const TEMPLATE_ALIAS = "slideheroes-claude-agent-dev";

/** Optional E2B sandbox template alias for GPT/Codex agent */
export const GPT_TEMPLATE_ALIAS =
	process.env.ALPHA_GPT_TEMPLATE_ALIAS || "slideheroes-gpt-agent-dev";

export const DEFAULT_PROVIDER = "claude";

/** Workspace directory inside the E2B sandbox */
export const WORKSPACE_DIR = "/home/user/project";

/** Progress file location (relative to workspace) */
export const PROGRESS_FILE = ".initiative-progress.json";

// ============================================================================
// Progress Polling & Stall Detection
// ============================================================================

/** Interval for polling progress file from sandbox (ms) - reduced from 15s to 5s for more responsive updates */
export const PROGRESS_POLL_INTERVAL_MS = 5000;

/** Time without heartbeat before marking as stalled (ms) */
export const STALL_TIMEOUT_MS = 5 * 60 * 1000;

/** Warning threshold for heartbeat age (ms) */
export const HEARTBEAT_WARNING_MS = 2 * 60 * 1000;

// ============================================================================
// Orchestrator Lock
// ============================================================================

/** Lock file path (relative to project root) */
export const ORCHESTRATOR_LOCK_FILE = ".ai/alpha/.orchestrator-lock";

/** Maximum age for a lock before considered stale (ms) - 24 hours */
export const MAX_LOCK_AGE_MS = 24 * 60 * 60 * 1000;

/** Maximum age for reset operations before considered stale (ms) - 10 minutes */
export const MAX_RESET_AGE_MS = 10 * 60 * 1000;

// ============================================================================
// UI Progress
// ============================================================================

/** Directory for UI progress files (relative to project root) */
export const UI_PROGRESS_DIR = ".ai/alpha/progress";

/** Directory for sandbox output logs (relative to project root) */
export const LOGS_DIR = ".ai/alpha/logs";

/** Number of recent output lines to include in UI progress */
export const RECENT_OUTPUT_LINES = 20;

/** Directory for archived runs (relative to project root) */
export const ARCHIVE_DIR = ".ai/alpha/archive";

/** Maximum number of archived runs to keep */
export const MAX_ARCHIVED_RUNS = 10;

// ============================================================================
// Health Check Configuration
// ============================================================================

/** Interval between health checks (ms) */
export const HEALTH_CHECK_INTERVAL_MS = 30000;

/** Timeout for progress file to be created (ms) - 5 minutes */
export const PROGRESS_FILE_TIMEOUT_MS = 5 * 60 * 1000;

/** Timeout for heartbeat to be considered stale (ms) - 5 minutes */
export const HEARTBEAT_STALE_TIMEOUT_MS = 5 * 60 * 1000;

/** Maximum retry attempts for a sandbox */
export const MAX_SANDBOX_RETRIES = 2;

// ============================================================================
// Server Ports
// ============================================================================

/** VS Code Server port in sandbox */
export const VSCODE_PORT = 8080;

/** Dev server port in sandbox */
export const DEV_SERVER_PORT = 3000;

/** Event server port for WebSocket streaming (local orchestrator) */
export const EVENT_SERVER_PORT = 9000;

// ============================================================================
// Timeouts
// ============================================================================

/** Default timeout for feature implementation (ms) - 30 minutes */
export const FEATURE_TIMEOUT_MS = 1800000;

/** Sandbox creation timeout (multiplier for options.timeout) */
export const SANDBOX_TIMEOUT_MULTIPLIER = 1000;

/** Stagger delay between sandbox creation (ms)
 * Reduced from 60s to 30s after E2B hardware upgrade to 4 vCPU / 4 GB RAM (Q1).
 * Original 60s was conservative prevention for OAuth session limits (#1449).
 * Now relies on targeted retry backoff (createSandboxWithRetry) instead of
 * blanket delay for handling creation failures.
 * Can be overridden via ALPHA_SANDBOX_STAGGER_MS environment variable.
 * See chore #1959 for details.
 */
export const SANDBOX_STAGGER_DELAY_MS = Number.parseInt(
	process.env.ALPHA_SANDBOX_STAGGER_MS ?? "30000",
	10,
);

/** Maximum retry attempts for sandbox creation failures.
 * On creation failure (OAuth session limits, rate limiting, E2B API errors),
 * the orchestrator retries with exponential backoff before giving up.
 * See chore #1959 for details.
 */
export const SANDBOX_CREATION_MAX_RETRIES = 2;

/** Base delay for sandbox creation retry backoff (ms).
 * Retry delays use linear backoff: base * attempt (10s, 20s).
 * See chore #1959 for details.
 */
export const SANDBOX_CREATION_RETRY_BASE_DELAY_MS = 10000;

/** Interval for extending sandbox timeouts (keepalive) - 15 minutes
 * Reduced from 30 minutes to provide better overlap with 1-hour sandbox lifetime
 */
export const SANDBOX_KEEPALIVE_INTERVAL_MS = 15 * 60 * 1000;

/** Stagger delay between sandbox keepalive calls (ms) - 2 minutes per sandbox */
export const SANDBOX_KEEPALIVE_STAGGER_MS = 2 * 60 * 1000;

/** Maximum sandbox age before forced restart (ms) - 60 minutes
 * Increased from 50 to 60 minutes to allow long-running features to complete.
 * The E2B sandbox timeout is 1 hour, so this gives features the full hour.
 * If a sandbox expires at exactly 60 min, the keepalive mechanism will handle
 * the restart gracefully.
 * See diagnosis #1567 for rationale.
 */
export const SANDBOX_MAX_AGE_MS = 60 * 60 * 1000;

// ============================================================================
// Sandbox Extension Configuration (Bug fix #2074)
// ============================================================================

/** Duration to extend sandbox timeout when features are actively executing (ms) - 15 minutes
 * Same as keepalive interval. This gives the in-progress feature another 15 minutes
 * to complete instead of being killed by the preemptive restart.
 * See bug fix #2074 for rationale.
 */
export const SANDBOX_EXTENSION_MS = 15 * 60 * 1000;

/** Maximum number of sandbox extension attempts before forcing restart.
 * Prevents infinite extension loops where a feature never completes.
 * After this many extensions, the sandbox is killed and the feature retried.
 */
export const SANDBOX_MAX_EXTENSION_ATTEMPTS = 3;

// ============================================================================
// Startup Retry Configuration
// ============================================================================

/** Timeout for Claude CLI startup (ms) - 60 seconds
 * If no meaningful output is received within this time, consider startup hung.
 */
export const STARTUP_TIMEOUT_MS = 60 * 1000;

/** Retry delays for startup failures (ms) - exponential backoff: 5s, 10s, 30s
 * These delays are applied between retry attempts after startup timeouts.
 */
export const STARTUP_RETRY_DELAYS_MS = [5 * 1000, 10 * 1000, 30 * 1000];

/** Maximum startup retry attempts
 * After this many attempts, the feature is marked as failed.
 */
export const MAX_STARTUP_RETRIES = 3;

/** Minimum output bytes to consider startup successful
 * Successful Claude CLI runs produce >500 bytes immediately.
 */
export const MIN_STARTUP_OUTPUT_BYTES = 100;

/** Minimum output lines expected within startup timeout
 * If fewer than this, startup may be hung.
 */
export const MIN_STARTUP_OUTPUT_LINES = 5;

// ============================================================================
// PTY Timeout & Recovery Configuration
// ============================================================================

/** Timeout for ptyHandle.wait() before checking progress file fallback (ms)
 * When PTY disconnects silently, this timeout triggers the fallback mechanism
 * that checks the sandbox's progress file for completion status.
 * Default: 30 seconds - long enough for normal operations, short enough for quick recovery.
 * Can be overridden via PTY_TIMEOUT_MS environment variable.
 * See bug fix #1767 for rationale.
 */
export const PTY_WAIT_TIMEOUT_MS = Number.parseInt(
	process.env.PTY_TIMEOUT_MS ?? "30000",
	10,
);

/** Interval for polling progress file during PTY timeout recovery (ms)
 * When PTY times out, we poll the progress file at this interval
 * to check if the sandbox completed successfully.
 */
export const PTY_RECOVERY_POLL_INTERVAL_MS = 500;

/** Maximum age for progress file heartbeat to be considered valid (ms)
 * If the progress file's last_heartbeat is older than this, the file
 * is considered stale and recovery will not succeed.
 * Default: 5 minutes
 */
export const PROGRESS_FILE_STALE_THRESHOLD_MS = 5 * 60 * 1000;

// ============================================================================
// Promise Timeout Monitor Configuration (Bug fix #1841)
// ============================================================================

/**
 * Maximum age for a work loop promise before it's considered timed out (ms).
 * When a promise exceeds this threshold AND the heartbeat is stale,
 * the promise will be forcibly rejected and the feature reset to pending.
 *
 * Default: 10 minutes - generous for slow features.
 * Rationale: Most features complete in 5-10 minutes. PTY disconnects from
 * previous issues (#1767, #1786) occur within this window. This threshold
 * ensures we catch hung promises without killing healthy slow work.
 *
 * Can be overridden via PROMISE_TIMEOUT_MS environment variable.
 */
export const PROMISE_TIMEOUT_MS = Number.parseInt(
	process.env.PROMISE_TIMEOUT_MS ?? String(10 * 60 * 1000),
	10,
);

/**
 * Maximum age for sandbox heartbeat before promise is considered stale (ms).
 * Used in conjunction with PROMISE_TIMEOUT_MS - both conditions must be met.
 *
 * Default: 5 minutes - matches PROGRESS_FILE_STALE_THRESHOLD_MS.
 * A healthy sandbox updates its progress file heartbeat every few seconds.
 * If heartbeat is older than this AND promise is old, the sandbox is stuck.
 *
 * Can be overridden via HEARTBEAT_TIMEOUT_MS environment variable.
 */
export const HEARTBEAT_TIMEOUT_MS = Number.parseInt(
	process.env.HEARTBEAT_TIMEOUT_MS ?? String(5 * 60 * 1000),
	10,
);

// ============================================================================
// Phase Execution Limits
// ============================================================================

/** Maximum features per phase (recommended: 7-8, hard max: 10).
 * Industry consensus (SWE-bench, Devin, Cursor, PARC) recommends 7-10 features
 * per execution unit for optimal completion rates.
 * See assessment report: .ai/reports/research-reports/2026-02-06/alpha-orchestrator-comprehensive-assessment.md
 */
export const MAX_FEATURES_PER_PHASE = 10;

/** Maximum tasks per phase.
 * Keeps total work volume manageable within a single orchestration run.
 */
export const MAX_TASKS_PER_PHASE = 100;

/** Maximum dependency depth within a phase.
 * Deep dependency chains create long critical paths that exceed sandbox lifetimes.
 */
export const MAX_DEPENDENCY_DEPTH = 5;

// ============================================================================
// Recovery Guard Configuration (Bug fix #2063)
// ============================================================================

/**
 * Minimum feature age before PTY fallback recovery checks are allowed (ms).
 * Prevents reading stale progress files from the previous feature during the
 * async gap between feature assignment and progress file initialization.
 *
 * Diagnosis (#2062) measured a 34-second race window. A 90-second guard provides
 * a 2.6x safety margin. Can be tuned based on actual execution data.
 *
 * See bug fix #2063 for rationale.
 */
export const MIN_FEATURE_AGE_FOR_RECOVERY_MS = 90_000;
