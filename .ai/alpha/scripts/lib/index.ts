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
	isProcessRunning,
	readLock,
	releaseLock,
	terminateProcess,
	updateLockResetState,
	writeLock,
} from "./lock.js";

// Manifest management
export {
	archiveAndClearPreviousRun,
	clearUIProgress,
	ensureUIProgressDir,
	findSpecDir,
	generateSpecManifest,
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
export type { RunMetadata } from "./run-id.js";
// Run ID generation
export {
	createSessionHeader,
	formatArchiveDirectory,
	generateRunId,
	isValidRunId,
	parseRunIdTimestamp,
} from "./run-id.js";

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

// Port health checks
export { isPortOpen, waitForDevServer, waitForPort } from "./port-health.js";

// TTS (Text-to-Speech) notifications
export { isTTSAvailable, speak, speakCompletion } from "./tts.js";

// Work queue
export {
	cleanupStaleState,
	getBlockedFeatures,
	getNextAvailableFeature,
	updateNextFeatureId,
} from "./work-queue.js";

// State machine (Bug fix #1786: Event-driven architecture)
export {
	createDefaultContext,
	featureStateMachine,
	FeatureStateMachine,
	isActiveState,
	isAssignableState,
	isTerminalState,
	STATE_TRANSITIONS,
} from "./state-machine.js";
export type {
	FeatureContext,
	FeatureState,
	StateTransition,
	TransitionListener,
	TransitionResult,
} from "./state-machine.js";

// Heartbeat monitor (Bug fix #1786: Event-driven architecture)
export {
	DEFAULT_HEARTBEAT_CONFIG,
	formatHeartbeatStatus,
	heartbeatMonitor,
	HeartbeatMonitor,
} from "./heartbeat-monitor.js";
export type {
	HeartbeatConfig,
	HeartbeatStatus,
	HeartbeatStatusType,
} from "./heartbeat-monitor.js";

// Recovery manager (Bug fix #1786: Event-driven architecture)
export {
	DEFAULT_RECOVERY_CONFIG,
	formatRecoveryResult,
	quickCleanup,
	recoveryManager,
	RecoveryManager,
} from "./recovery-manager.js";
export type {
	RecoveryConfig,
	RecoveryResult,
	RecoveryTelemetry,
} from "./recovery-manager.js";
