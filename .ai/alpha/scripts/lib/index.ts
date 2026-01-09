/**

* Lib barrel export
*
* Re-exports all modules from the lib directory
 */

// Database operations
export {
 checkDatabaseCapacity,
 isDatabaseSeeded,
 resetSandboxDatabase,
 seedSandboxDatabase,
} from "./database.js";

// Environment & authentication
export {
 ANTHROPIC_API_KEY,
 checkEnvironment,
 clearOAuthTokenCache,
 E2B_API_KEY,
 getAllEnvVars,
 getCachedOAuthToken,
 getClaudeOAuthToken,
 GITHUB_TOKEN,
} from "./environment.js";

// Feature implementation
export { runFeatureImplementation } from "./feature.js";

// Health monitoring
export {
 checkSandboxHealth,
 killClaudeProcess,
 runHealthChecks,
} from "./health.js";

// Lock management
export {
 acquireLock,
 clearProjectRootCache,
 getLockPath,
 getProjectRoot,
 readLock,
 releaseLock,
 updateLockResetState,
 writeLock,
} from "./lock.js";

// Manifest management
export {
 clearUIProgress,
 ensureUIProgressDir,
 findSpecDir,
 loadManifest,
 saveManifest,
 writeOverallProgress,
} from "./manifest.js";

// Main orchestration
export {
 orchestrate,
 printDryRun,
 printSummary,
 runWorkLoop,
} from "./orchestrator.js";

// Progress polling & display
export {
 checkForStall,
 displayProgressUpdate,
 startProgressPolling,
 writeUIProgress,
} from "./progress.js";
export type { ProgressPoller, StallCheckResult } from "./progress.js";

// Sandbox management
export {
 createSandbox,
 getVSCodeUrl,
 setupGitCredentials,
 startDevServer,
} from "./sandbox.js";

// Utilities
export { sleep } from "./utils.js";

// Work queue
export {
 cleanupStaleState,
 getBlockedFeatures,
 getNextAvailableFeature,
 updateNextFeatureId,
} from "./work-queue.js";
