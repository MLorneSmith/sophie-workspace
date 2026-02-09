/**

* Lib barrel export
*
* Re-exports all modules from the lib directory
 */

export type {
	CompletionPhaseOptions,
	CompletionPhaseResult,
	SetupReviewSandboxResult,
} from "./completion-phase.js";
// Completion phase
export {
	cleanupOrphanedSandboxIds,
	executeCompletionPhase,
	generateDocumentation,
	killImplementationSandboxes,
	notifyCompletion,
	setupReviewSandbox,
	startReviewDevServer,
} from "./completion-phase.js";
// Database operations
export {
	checkDatabaseCapacity,
	isDatabaseSeeded,
	resetSandboxDatabase,
	seedSandboxDatabase,
} from "./database.js";
export type {
	DeadlockResult,
	PhantomRecoveryResult,
} from "./deadlock-handler.js";
// Deadlock detection and recovery
export {
	detectAndHandleDeadlock,
	handleBlockingFailedFeatures,
	recoverPhantomCompletedFeatures,
} from "./deadlock-handler.js";
export type { MissingEnvVar, RawEnvVar } from "./env-requirements.js";
// Environment requirements (pre-flight checks)
export {
	aggregateRequiredEnvVars,
	extractEnvRequirementsFromResearch,
	extractEnvRequirementsFromTasks,
	getEnvVarStatusSummary,
	hasAllRequiredEnvVars,
	validateRequiredEnvVars,
} from "./env-requirements.js";
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
	getOpenAIAccessToken,
	getOpenAIApiKey,
	getOpenAIAuthMethod,
	OPENAI_API_KEY,
} from "./environment.js";
// Event server management
export {
	isEventServerRunning,
	startEventServer,
	stopEventServer,
	waitForUIReady,
} from "./event-server.js";
// Feature implementation
export { runFeatureImplementation } from "./feature.js";
// Health monitoring
export {
	checkSandboxHealth,
	killClaudeProcess,
	runHealthChecks,
} from "./health.js";
// Feature status transitions (centralized state management - #1955)
export type {
	TransitionOptions,
	TransitionResult,
} from "./feature-transitions.js";
export {
	transitionFeatureStatus,
	transitionInitiativeStatus,
	updateInitiativeStatusFromFeatures,
	VALID_FEATURE_TRANSITIONS,
	VALID_INITIATIVE_TRANSITIONS,
} from "./feature-transitions.js";

// Shared logger
export { createLogger } from "./logger.js";

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
export { orchestrate, printDryRun, printSummary } from "./orchestrator.js";
export type { WorkLoopOptions, WorkLoopResult } from "./work-loop.js";
// Work loop (refactored from orchestrator.ts - Phase 4 of #1816)
export { runWorkLoop, WorkLoop } from "./work-loop.js";
// Port health checks
export { isPortOpen, waitForDevServer, waitForPort } from "./port-health.js";
export type { PreFlightResult } from "./pre-flight.js";
// Pre-flight checks
export {
	checkPreFlightSilent,
	formatPreFlightForDryRun,
	runPreFlightCheck,
} from "./pre-flight.js";
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
// TTS (Text-to-Speech) notifications
export { isTTSAvailable, speak, speakCompletion } from "./tts.js";
// Utilities
export { sleep } from "./utils.js";
// Provider utilities
export {
	buildDocumentationPrompt,
	buildDocumentationCommand,
	buildImplementationPrompt,
	buildProviderCommand,
	getForceKillCommand,
	getGracefulShutdownCommand,
	getProcessCountCommand,
	getProviderDisplayName,
	getTemplateAlias,
} from "./provider.js";
// Work queue
export {
	cleanupStaleState,
	getBlockedFeatures,
	getNextAvailableFeature,
	updateNextFeatureId,
} from "./work-queue.js";
