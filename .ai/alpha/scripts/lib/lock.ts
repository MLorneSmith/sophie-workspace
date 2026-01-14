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
* @param specId - The spec ID being orchestrated
* @param uiEnabled - Whether UI mode is enabled (suppresses console output)
 */
export function acquireLock(specId: number, uiEnabled = false): boolean {
	const { log, error } = createLogger(uiEnabled);
	const existingLock = readLock();

	if (existingLock) {
		const lockAge = Date.now() - new Date(existingLock.started_at).getTime();

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
