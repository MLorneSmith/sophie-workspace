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
export const STALL_TIMEOUT_MS = 5* 60 * 1000;

/** Warning threshold for heartbeat age (ms) */
export const HEARTBEAT_WARNING_MS = 2* 60 * 1000;

// ============================================================================
// Orchestrator Lock
// ============================================================================

/** Lock file path (relative to project root) */
export const ORCHESTRATOR_LOCK_FILE = ".ai/alpha/.orchestrator-lock";

/** Maximum age for a lock before considered stale (ms) - 24 hours */
export const MAX_LOCK_AGE_MS = 24* 60 *60* 1000;

/** Maximum age for reset operations before considered stale (ms) - 10 minutes */
export const MAX_RESET_AGE_MS = 10* 60 * 1000;

// ============================================================================
// UI Progress
// ============================================================================

/** Directory for UI progress files (relative to project root) */
export const UI_PROGRESS_DIR = ".ai/alpha/progress";

// ============================================================================
// Health Check Configuration
// ============================================================================

/** Interval between health checks (ms) */
export const HEALTH_CHECK_INTERVAL_MS = 30000;

/** Timeout for progress file to be created (ms) - 5 minutes */
export const PROGRESS_FILE_TIMEOUT_MS = 5* 60 * 1000;

/** Timeout for heartbeat to be considered stale (ms) - 5 minutes */
export const HEARTBEAT_STALE_TIMEOUT_MS = 5* 60 * 1000;

/** Maximum retry attempts for a sandbox */
export const MAX_SANDBOX_RETRIES = 2;

// ============================================================================
// Server Ports
// ============================================================================

/** VS Code Server port in sandbox */
export const VSCODE_PORT = 8080;

/** Dev server port in sandbox */
export const DEV_SERVER_PORT = 3000;

// ============================================================================
// Timeouts
// ============================================================================

/** Default timeout for feature implementation (ms) - 30 minutes */
export const FEATURE_TIMEOUT_MS = 1800000;

/** Sandbox creation timeout (multiplier for options.timeout) */
export const SANDBOX_TIMEOUT_MULTIPLIER = 1000;

/** Stagger delay between sandbox creation (ms) */
export const SANDBOX_STAGGER_DELAY_MS = 20000;
