/**

* Sandbox Health Monitoring Module
*
* Monitors sandbox health during feature implementation.
* Detects stalled sandboxes and handles recovery.
 */

import {
	HEARTBEAT_STALE_TIMEOUT_MS,
	MAX_SANDBOX_RETRIES,
	MIN_STARTUP_OUTPUT_LINES,
	PROGRESS_FILE,
	PROGRESS_FILE_TIMEOUT_MS,
	WORKSPACE_DIR,
} from "../config/index.js";
import type {
	AgentProvider,
	HealthCheckResult,
	SandboxInstance,
	SandboxProgress,
	SpecManifest,
} from "../types/index.js";
import { transitionFeatureStatus } from "./feature-transitions.js";
import { createLogger } from "./logger.js";
import { saveManifest } from "./manifest.js";
import { getForceKillCommand, getProviderDisplayName } from "./provider.js";
import { sleep } from "./utils.js";

// ============================================================================
// Startup Timeout Configuration
// ============================================================================
// Uses centralized constants from config/index.ts:
// - STARTUP_TIMEOUT_MS: Initial startup timeout (60s for early detection)
// - MIN_STARTUP_OUTPUT_LINES: Minimum output lines to consider startup successful
// - MIN_STARTUP_OUTPUT_BYTES: Minimum output bytes to consider startup successful

/**
 * Time to wait for Claude process to start producing meaningful output (ms).
 * This is longer than STARTUP_TIMEOUT_MS to allow for slower startups while
 * still catching complete hangs. Uses 5 minutes for health check (vs 60s for
 * early detection in feature.ts).
 *
 * IMPORTANT: This timeout must be longer than the startup retry loop in feature.ts
 * (~4 minutes total: 60s timeout × 3 retries + delays). Setting it to 5 minutes
 * ensures the health check doesn't kill processes while feature.ts is still
 * handling retry logic. See issue #1465 for the race condition this fixes.
 */
const STARTUP_OUTPUT_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

// ============================================================================
// Health Check
// ============================================================================

/**

* Check the health of a sandbox that's working on a feature.
* Returns unhealthy if:
* * No meaningful output within STARTUP_OUTPUT_TIMEOUT_MS (startup hung)
* * No progress file created within PROGRESS_FILE_TIMEOUT_MS of starting
* * Heartbeat is stale (older than HEARTBEAT_STALE_TIMEOUT_MS)
*
* @param instance - The sandbox instance to check
* @returns Health check result
 */
export async function checkSandboxHealth(
	instance: SandboxInstance,
	_manifest: SpecManifest,
	uiEnabled: boolean = false,
): Promise<HealthCheckResult> {
	const { log } = createLogger(uiEnabled);

	if (instance.status !== "busy" || !instance.featureStartedAt) {
		return { healthy: true };
	}

	const now = Date.now();
	const timeSinceStart = now - instance.featureStartedAt.getTime();

	// Early startup hung detection: check if we've received meaningful output
	// This catches the case where Claude CLI starts but doesn't do anything useful
	if (timeSinceStart > STARTUP_OUTPUT_TIMEOUT_MS) {
		const outputLines = instance.outputLineCount ?? 0;
		if (outputLines < MIN_STARTUP_OUTPUT_LINES && !instance.hasReceivedOutput) {
			return {
				healthy: false,
				issue: "no_progress_file", // Using existing issue type
				message: `Startup hung: only ${outputLines} output lines after ${Math.round(timeSinceStart / 60000)} minutes`,
				timeSinceStart,
			};
		}
	}

	// Try to read progress file
	try {
		const result = await instance.sandbox.commands.run(
			`cat ${WORKSPACE_DIR}/${PROGRESS_FILE} 2>/dev/null`,
			{ timeoutMs: 5000 },
		);

		if (!result.stdout || !result.stdout.trim()) {
			// No progress file yet
			if (timeSinceStart > PROGRESS_FILE_TIMEOUT_MS) {
				return {
					healthy: false,
					issue: "no_progress_file",
					message: `No progress file after ${Math.round(timeSinceStart / 60000)} minutes`,
					timeSinceStart,
				};
			}
			// Still within grace period
			return { healthy: true, timeSinceStart };
		}

		// Parse progress file
		const progress: SandboxProgress = JSON.parse(result.stdout);
		instance.lastProgressSeen = new Date();

		// Check heartbeat
		if (progress.last_heartbeat) {
			const heartbeatTime = new Date(progress.last_heartbeat).getTime();
			const featureStartTime = instance.featureStartedAt?.getTime() || now;

			// CRITICAL: Ignore heartbeats from before this feature session started
			const graceWindow = 5 * 60 * 1000; // 5 minute grace period
			if (heartbeatTime < featureStartTime - graceWindow) {
				// Heartbeat is from a previous session - don't flag as stale
				const heartbeatAgeMin = Math.round((now - heartbeatTime) / 60000);
				const sessionAgeMin = Math.round(timeSinceStart / 60000);
				log(
					`   │   ℹ️ [${instance.label}] Ignoring stale heartbeat (${heartbeatAgeMin}m old, session started ${sessionAgeMin}m ago)`,
				);
				return { healthy: true, timeSinceStart };
			}

			instance.lastHeartbeat = new Date(heartbeatTime);
			const timeSinceHeartbeat = now - heartbeatTime;

			if (timeSinceHeartbeat > HEARTBEAT_STALE_TIMEOUT_MS) {
				return {
					healthy: false,
					issue: "stale_heartbeat",
					message: `Heartbeat stale for ${Math.round(timeSinceHeartbeat / 60000)} minutes`,
					timeSinceStart,
					timeSinceHeartbeat,
				};
			}
		}

		return {
			healthy: true,
			timeSinceStart,
			timeSinceProgress: instance.lastProgressSeen
				? now - instance.lastProgressSeen.getTime()
				: undefined,
			timeSinceHeartbeat: instance.lastHeartbeat
				? now - instance.lastHeartbeat.getTime()
				: undefined,
		};
	} catch {
		// Failed to read progress - check if we're past timeout
		if (timeSinceStart > PROGRESS_FILE_TIMEOUT_MS) {
			return {
				healthy: false,
				issue: "no_progress_file",
				message: `Cannot read progress file after ${Math.round(timeSinceStart / 60000)} minutes`,
				timeSinceStart,
			};
		}
		return { healthy: true, timeSinceStart };
	}
}

// ============================================================================
// Process Recovery
// ============================================================================

/**

* Kill the Claude Code process in a sandbox and prepare for retry.
*
* @param instance - The sandbox instance
* @returns true if kill succeeded
 */
export async function killClaudeProcess(
	instance: SandboxInstance,
	uiEnabled: boolean = false,
	provider: AgentProvider = "claude",
): Promise<boolean> {
	const { log } = createLogger(uiEnabled);
	log(
		`│   🔪 Killing ${getProviderDisplayName(provider)} process on ${instance.label}...`,
	);

	let killSucceeded = false;
	let clearSucceeded = false;

	try {
		// Kill any running agent processes
		await instance.sandbox.commands.run(getForceKillCommand(provider), {
			timeoutMs: 10000,
		});
		killSucceeded = true;
	} catch (error) {
		log(
			`│   ⚠ Kill command failed: ${error instanceof Error ? error.message : error}`,
		);
	}

	// ALWAYS try to clear progress file, even if kill failed
	try {
		await instance.sandbox.commands.run(
			`rm -f ${WORKSPACE_DIR}/${PROGRESS_FILE}`,
			{ timeoutMs: 5000 },
		);
		clearSucceeded = true;
	} catch (error) {
		log(
			`│   ⚠ Failed to clear progress file: ${error instanceof Error ? error.message : error}`,
		);
	}

	// Small delay to ensure process is fully terminated
	await sleep(2000);

	if (killSucceeded && clearSucceeded) {
		log(`│   ✓ Process killed and progress cleared on ${instance.label}`);
		return true;
	} else if (killSucceeded) {
		log(
			`│   ⚠ Process killed but progress file not cleared on ${instance.label}`,
		);
		return true;
	} else {
		log(`│   ✗ Recovery failed on ${instance.label}`);
		return false;
	}
}

// ============================================================================
// Health Check Loop
// ============================================================================

/**

* Run health checks on all busy sandboxes and handle unhealthy ones.
* Returns list of sandboxes that need feature reassignment.
*
* @param instances - All sandbox instances
* @param manifest - The spec manifest
* @returns List of sandboxes that need reassignment
 */
export async function runHealthChecks(
	instances: SandboxInstance[],
	manifest: SpecManifest,
	uiEnabled: boolean = false,
	provider: AgentProvider = "claude",
): Promise<SandboxInstance[]> {
	const { log } = createLogger(uiEnabled);
	const needsReassignment: SandboxInstance[] = [];

	for (const instance of instances) {
		if (instance.status !== "busy") {
			continue;
		}

		const health = await checkSandboxHealth(instance, manifest, uiEnabled);

		if (!health.healthy) {
			log(`\n   ⚠️ HEALTH CHECK FAILED [${instance.label}]: ${health.message}`);

			// Check if we can retry
			if (instance.retryCount < MAX_SANDBOX_RETRIES) {
				log(
					`   │   Attempting recovery (retry ${instance.retryCount + 1}/${MAX_SANDBOX_RETRIES})...`,
				);

				const killed = await killClaudeProcess(instance, uiEnabled, provider);
				if (killed) {
					instance.retryCount++;
					instance.featureStartedAt = undefined;
					instance.lastProgressSeen = undefined;
					instance.lastHeartbeat = undefined;

					// Reset feature to pending so it can be retried
					const feature = manifest.feature_queue.find(
						(f) => f.id === instance.currentFeature,
					);
					if (feature) {
						transitionFeatureStatus(feature, manifest, "pending", {
							reason: "health check recovery - retrying",
							skipSave: true,
						});
					}

					instance.currentFeature = null;
					instance.status = "ready";
					instance.outputLineCount = 0;
					instance.hasReceivedOutput = false;
					saveManifest(manifest);

					log(`   │   ✓ ${instance.label} ready for retry`);
				} else {
					// Kill failed - mark sandbox as failed
					log("   │   ✗ Recovery failed, marking sandbox as failed");
					instance.status = "failed";
					needsReassignment.push(instance);
				}
			} else {
				log(
					`   │   ✗ Max retries (${MAX_SANDBOX_RETRIES}) exceeded, marking feature as failed`,
				);

				// Mark feature as failed
				const feature = manifest.feature_queue.find(
					(f) => f.id === instance.currentFeature,
				);
				if (feature) {
					feature.error = `Health check failed: ${health.message}`;
					transitionFeatureStatus(feature, manifest, "failed", {
						reason: "health check failed - max retries exceeded",
						skipSave: true,
					});
				}

				instance.currentFeature = null;
				instance.status = "ready"; // Allow sandbox to take new work
				instance.retryCount = 0; // Reset for next feature
				instance.outputLineCount = 0;
				instance.hasReceivedOutput = false;
				saveManifest(manifest);
			}
		}
	}

	return needsReassignment;
}
