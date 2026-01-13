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
	GITHUB_TOKEN,
	getAllEnvVars,
	getCachedOAuthToken,
	getClaudeOAuthToken,
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
export type { ProgressPoller, StallCheckResult } from "./progress.js";
// Progress polling & display
export {
	checkForStall,
	displayProgressUpdate,
	startProgressPolling,
	writeIdleProgress,
	writeUIProgress,
} from "./progress.js";

// Sandbox management
export {
	createSandbox,
	getVSCodeUrl,
	setupGitCredentials,
	startDevServer,
} from "./sandbox.js";

// Startup monitoring
export {
	checkStartupStatus,
	createStartupOutputTracker,
	DEFAULT_STARTUP_CONFIG,
	detectStartupHang,
	formatStartupAttemptLog,
	formatStartupFailureLog,
	formatStartupSuccessLog,
	getElapsedTime,
	getRetryDelay,
	shouldRetry,
	updateOutputTracker,
} from "./startup-monitor.js";

// Utilities
export { sleep } from "./utils.js";

// Work queue
export {
	cleanupStaleState,
	getBlockedFeatures,
	getNextAvailableFeature,
	updateNextFeatureId,
} from "./work-queue.js";
