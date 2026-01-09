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
 */
export function acquireLock(specId: number): boolean {
	const existingLock = readLock();

	if (existingLock) {
		const lockAge = Date.now() - new Date(existingLock.started_at).getTime();

		// Check for stale reset operation
		if (existingLock.reset_in_progress && existingLock.reset_started_at) {
			const resetAge =
				Date.now() - new Date(existingLock.reset_started_at).getTime();
			if (resetAge > MAX_RESET_AGE_MS) {
				console.log(
					`⚠️ Stale reset detected (${Math.round(resetAge / 60000)}m old), overriding lock...`,
				);
				// Fall through to acquire new lock
			} else {
				console.error("❌ Another orchestration run is resetting the database");
				console.error(`   Started: ${existingLock.reset_started_at}`);
				console.error("\n   To force override, use: --force-unlock");
				return false;
			}
		} else if (lockAge < MAX_LOCK_AGE_MS) {
			console.error("❌ Another orchestration run is active:");
			console.error(`   Spec: #${existingLock.spec_id}`);
			console.error(`   Started: ${existingLock.started_at}`);
			console.error(`   Host: ${existingLock.hostname}`);
			console.error(`   PID: ${existingLock.pid}`);
			console.error("\n   To force override, use: --force-unlock");
			return false;
		} else {
			console.log(
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
	console.log("🔒 Acquired orchestrator lock");
	return true;
}

/**

* Release the orchestrator lock.
 */
export function releaseLock(): void {
	const lockPath = getLockPath();
	if (fs.existsSync(lockPath)) {
		fs.unlinkSync(lockPath);
		console.log("🔓 Released orchestrator lock");
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
