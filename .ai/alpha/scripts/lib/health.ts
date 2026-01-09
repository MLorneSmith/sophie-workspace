/**

* Sandbox Health Monitoring Module
*
* Monitors sandbox health during feature implementation.
* Detects stalled sandboxes and handles recovery.
 */

import {
	HEARTBEAT_STALE_TIMEOUT_MS,
	MAX_SANDBOX_RETRIES,
	PROGRESS_FILE,
	PROGRESS_FILE_TIMEOUT_MS,
	WORKSPACE_DIR,
} from "../config/index.js";
import type {
	HealthCheckResult,
	SandboxInstance,
	SandboxProgress,
	SpecManifest,
} from "../types/index.js";
import { saveManifest } from "./manifest.js";
import { sleep } from "./utils.js";

// ============================================================================
// Health Check
// ============================================================================

/**

* Check the health of a sandbox that's working on a feature.
* Returns unhealthy if:
* * No progress file created within PROGRESS_FILE_TIMEOUT_MS of starting
* * Heartbeat is stale (older than HEARTBEAT_STALE_TIMEOUT_MS)
*
* @param instance - The sandbox instance to check
* @returns Health check result
 */
export async function checkSandboxHealth(
	instance: SandboxInstance,
): Promise<HealthCheckResult> {
	if (instance.status !== "busy" || !instance.featureStartedAt) {
		return { healthy: true };
	}

	const now = Date.now();
	const timeSinceStart = now - instance.featureStartedAt.getTime();

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
				console.log(
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
): Promise<boolean> {
	console.log(`│   🔪 Killing Claude Code process on ${instance.label}...`);

	let killSucceeded = false;
	let clearSucceeded = false;

	try {
		// Kill any running claude processes
		await instance.sandbox.commands.run(
			"pkill -f 'claude' || pkill -f 'run-claude' || true",
			{ timeoutMs: 10000 },
		);
		killSucceeded = true;
	} catch (error) {
		console.log(
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
		console.log(
			`│   ⚠ Failed to clear progress file: ${error instanceof Error ? error.message : error}`,
		);
	}

	// Small delay to ensure process is fully terminated
	await sleep(2000);

	if (killSucceeded && clearSucceeded) {
		console.log(
			`│   ✓ Process killed and progress cleared on ${instance.label}`,
		);
		return true;
	} else if (killSucceeded) {
		console.log(
			`│   ⚠ Process killed but progress file not cleared on ${instance.label}`,
		);
		return true;
	} else {
		console.log(`│   ✗ Recovery failed on ${instance.label}`);
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
): Promise<SandboxInstance[]> {
	const needsReassignment: SandboxInstance[] = [];

	for (const instance of instances) {
		if (instance.status !== "busy") {
			continue;
		}

		const health = await checkSandboxHealth(instance);

		if (!health.healthy) {
			console.log(
				`\n   ⚠️ HEALTH CHECK FAILED [${instance.label}]: ${health.message}`,
			);

			// Check if we can retry
			if (instance.retryCount < MAX_SANDBOX_RETRIES) {
				console.log(
					`   │   Attempting recovery (retry ${instance.retryCount + 1}/${MAX_SANDBOX_RETRIES})...`,
				);

				const killed = await killClaudeProcess(instance);
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
						feature.status = "pending";
						feature.assigned_sandbox = undefined;
					}

					instance.currentFeature = null;
					instance.status = "ready";
					saveManifest(manifest);

					console.log(`   │   ✓ ${instance.label} ready for retry`);
				} else {
					// Kill failed - mark sandbox as failed
					console.log("   │   ✗ Recovery failed, marking sandbox as failed");
					instance.status = "failed";
					needsReassignment.push(instance);
				}
			} else {
				console.log(
					`   │   ✗ Max retries (${MAX_SANDBOX_RETRIES}) exceeded, marking feature as failed`,
				);

				// Mark feature as failed
				const feature = manifest.feature_queue.find(
					(f) => f.id === instance.currentFeature,
				);
				if (feature) {
					feature.status = "failed";
					feature.error = `Health check failed: ${health.message}`;
					feature.assigned_sandbox = undefined;
				}

				instance.currentFeature = null;
				instance.status = "ready"; // Allow sandbox to take new work
				instance.retryCount = 0; // Reset for next feature
				saveManifest(manifest);
			}
		}
	}

	return needsReassignment;
}
