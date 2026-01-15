/**

* Orchestrator Lock Management Module
*
* Prevents concurrent orchestration runs by managing a lock file.
* Handles stale lock detection and force unlock capabilities.
 */

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import process from "node:process";

import {
	MAX_LOCK_AGE_MS,
	MAX_RESET_AGE_MS,
	ORCHESTRATOR_LOCK_FILE,
} from "../config/index.js";
import type { OrchestratorLock } from "../types/index.js";

// ============================================================================
// Process Termination Constants
// ============================================================================

/** Time to wait for graceful shutdown (ms) */
const GRACEFUL_SHUTDOWN_TIMEOUT_MS = 2000;

/** Short delay after SIGKILL to ensure process is fully terminated (ms) */
const POST_KILL_DELAY_MS = 100;

// ============================================================================
// Logging Helper
// ============================================================================

/**
 * Create a conditional logger that only outputs when UI is disabled.
 * When UI is enabled, all console output is suppressed to avoid interfering
 * with the Ink-based dashboard.
 */
function createLogger(uiEnabled: boolean) {
	return {
		log: (...args: unknown[]) => {
			if (!uiEnabled) console.log(...args);
		},
		error: (...args: unknown[]) => {
			// Always log errors, even in UI mode
			console.error(...args);
		},
	};
}

// ============================================================================
// Project Root Detection
// ============================================================================

let _projectRoot: string | null = null;

/**

* Get the project root directory (cached).
* Searches upward from cwd for a directory containing .git
 */
export function getProjectRoot(): string {
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

/**

* Clear the cached project root (useful for testing).
 */
export function clearProjectRootCache(): void {
	_projectRoot = null;
}

// ============================================================================
// Process Termination Helpers
// ============================================================================

/**
 * Check if a process with the given PID is currently running.
 *
 * @param pid - Process ID to check
 * @returns true if process exists and is running, false otherwise
 */
export function isProcessRunning(pid: number): boolean {
	try {
		// process.kill(pid, 0) checks if process exists without sending a signal
		// On Unix, signal 0 is used to check process existence
		process.kill(pid, 0);
		return true;
	} catch (error) {
		// ESRCH = No such process, EPERM = Permission denied (process exists but owned by other user)
		if (error && typeof error === "object" && "code" in error) {
			return (error as { code: string }).code === "EPERM";
		}
		return false;
	}
}

/**
 * Sleep for specified duration.
 *
 * @param ms - Milliseconds to sleep
 */
function sleepMs(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Attempt to terminate a process gracefully, falling back to force kill.
 *
 * Strategy:
 * 1. Send SIGTERM (graceful shutdown signal)
 * 2. Wait up to GRACEFUL_SHUTDOWN_TIMEOUT_MS for process to exit
 * 3. If still running, send SIGKILL (force kill)
 * 4. Wait brief period for kernel to clean up
 *
 * @param pid - Process ID to terminate
 * @param uiEnabled - Whether UI mode is enabled (affects logging)
 * @returns true if process was successfully terminated (or wasn't running), false on error
 */
export async function terminateProcess(
	pid: number,
	uiEnabled = false,
): Promise<boolean> {
	const { log, error } = createLogger(uiEnabled);

	// Check if process is running
	if (!isProcessRunning(pid)) {
		log(`   Process ${pid} is not running (may have already exited)`);
		return true;
	}

	log(`   Sending SIGTERM to process ${pid}...`);

	try {
		// Send graceful shutdown signal
		process.kill(pid, "SIGTERM");
	} catch (err) {
		// Process may have exited between check and kill
		if (err && typeof err === "object" && "code" in err) {
			const code = (err as { code: string }).code;
			if (code === "ESRCH") {
				log(`   Process ${pid} already exited`);
				return true;
			}
			error(`   Failed to send SIGTERM: ${code}`);
		}
		return false;
	}

	// Wait for graceful shutdown
	log(`   Waiting up to ${GRACEFUL_SHUTDOWN_TIMEOUT_MS / 1000}s for graceful shutdown...`);

	const startTime = Date.now();
	while (Date.now() - startTime < GRACEFUL_SHUTDOWN_TIMEOUT_MS) {
		await sleepMs(100);
		if (!isProcessRunning(pid)) {
			log(`   Process ${pid} terminated gracefully`);
			return true;
		}
	}

	// Process still running, escalate to SIGKILL
	log(`   Process ${pid} did not exit, sending SIGKILL...`);

	try {
		process.kill(pid, "SIGKILL");
	} catch (err) {
		// Process may have exited during our wait loop
		if (err && typeof err === "object" && "code" in err) {
			const code = (err as { code: string }).code;
			if (code === "ESRCH") {
				log(`   Process ${pid} exited during shutdown`);
				return true;
			}
			error(`   Failed to send SIGKILL: ${code}`);
		}
		return false;
	}

	// Brief wait for kernel to clean up
	await sleepMs(POST_KILL_DELAY_MS);

	// Final verification
	if (isProcessRunning(pid)) {
		error(`   WARNING: Process ${pid} may still be running after SIGKILL`);
		return false;
	}

	log(`   Process ${pid} terminated via SIGKILL`);
	return true;
}

// ============================================================================
// Lock File Management
// ============================================================================

/**

* Get the full path to the lock file.
 */
export function getLockPath(): string {
	return path.join(getProjectRoot(), ORCHESTRATOR_LOCK_FILE);
}

/**

* Read the current lock file contents.
* Returns null if lock doesn't exist or is invalid.
 */
export function readLock(): OrchestratorLock | null {
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

/**

* Write a lock to the lock file.
* Creates the lock directory if it doesn't exist.
 */
export function writeLock(lock: OrchestratorLock): void {
	const lockPath = getLockPath();
	const lockDir = path.dirname(lockPath);
	if (!fs.existsSync(lockDir)) {
		fs.mkdirSync(lockDir, { recursive: true });
	}
	fs.writeFileSync(lockPath, JSON.stringify(lock, null, 2));
}

/**

* Attempt to acquire the orchestrator lock.
* Returns true if lock was acquired, false if another orchestration is running.
*
* Will override stale locks (>24h old) and stale reset operations (>10m old).
*
* When forceUnlock is true and an existing lock has a PID:
* 1. Attempt graceful termination (SIGTERM) of the existing process
* 2. Wait up to 2 seconds for graceful shutdown
* 3. If still running, force kill (SIGKILL)
* 4. Only then acquire the new lock
*
* @param specId - The spec ID being orchestrated
* @param uiEnabled - Whether UI mode is enabled (suppresses console output)
* @param forceUnlock - Force unlock by terminating existing orchestrator process
 */
export async function acquireLock(
	specId: number,
	uiEnabled = false,
	forceUnlock = false,
): Promise<boolean> {
	const { log, error } = createLogger(uiEnabled);
	const existingLock = readLock();

	if (existingLock) {
		const lockAge = Date.now() - new Date(existingLock.started_at).getTime();

		// Handle force unlock - terminate existing process before acquiring lock
		if (forceUnlock) {
			log(`\n🔓 Force unlock requested, terminating existing orchestrator...`);
			log(`   Existing lock: Spec #${existingLock.spec_id}, PID ${existingLock.pid}`);
			log(`   Hostname: ${existingLock.hostname}, Started: ${existingLock.started_at}`);

			// Only terminate if running on same host (can't kill remote processes)
			if (existingLock.hostname !== os.hostname()) {
				log(`\n   ⚠️ WARNING: Lock held by different host (${existingLock.hostname})`);
				log(`   Cannot terminate remote process, proceeding with lock override only`);
			} else {
				// Attempt to terminate the existing process
				const terminated = await terminateProcess(existingLock.pid, uiEnabled);
				if (terminated) {
					log(`   ✅ Existing orchestrator process terminated`);
				} else {
					error(`   ❌ Failed to terminate existing process (PID ${existingLock.pid})`);
					error(`   Manual intervention may be required: kill ${existingLock.pid}`);
					// Continue anyway - the lock will be overwritten
				}
			}

			// Remove existing lock file before acquiring new one
			releaseLock(uiEnabled);
		} else {
			// Check for stale reset operation
			if (existingLock.reset_in_progress && existingLock.reset_started_at) {
				const resetAge =
					Date.now() - new Date(existingLock.reset_started_at).getTime();
				if (resetAge > MAX_RESET_AGE_MS) {
					log(
						`⚠️ Stale reset detected (${Math.round(resetAge / 60000)}m old), overriding lock...`,
					);
					// Fall through to acquire new lock
				} else {
					error("❌ Another orchestration run is resetting the database");
					error(`   Started: ${existingLock.reset_started_at}`);
					error("\n   To force override, use: --force-unlock");
					return false;
				}
			} else if (lockAge < MAX_LOCK_AGE_MS) {
				error("❌ Another orchestration run is active:");
				error(`   Spec: #${existingLock.spec_id}`);
				error(`   Started: ${existingLock.started_at}`);
				error(`   Host: ${existingLock.hostname}`);
				error(`   PID: ${existingLock.pid}`);
				error("\n   To force override, use: --force-unlock");
				return false;
			} else {
				log(
					`⚠️ Stale lock detected (${Math.round(lockAge / 3600000)}h old), overriding...`,
				);
			}
		}
	}

	const lock: OrchestratorLock = {
		spec_id: specId,
		started_at: new Date().toISOString(),
		pid: process.pid,
		hostname: os.hostname(),
	};

	writeLock(lock);
	log("🔒 Acquired orchestrator lock");
	return true;
}

/**

* Release the orchestrator lock.
*
* @param uiEnabled - Whether UI mode is enabled (suppresses console output)
 */
export function releaseLock(uiEnabled = false): void {
	const { log } = createLogger(uiEnabled);
	const lockPath = getLockPath();
	if (fs.existsSync(lockPath)) {
		fs.unlinkSync(lockPath);
		log("🔓 Released orchestrator lock");
	}
}

/**

* Update the lock's reset state.
* Used to track database reset operations in progress.
 */
export function updateLockResetState(inProgress: boolean): void {
	const lock = readLock();
	if (lock) {
		lock.reset_in_progress = inProgress;
		lock.reset_started_at = inProgress ? new Date().toISOString() : undefined;
		writeLock(lock);
	}
}
