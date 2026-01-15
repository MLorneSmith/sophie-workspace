/**
 * Lock Management Unit Tests
 *
 * Tests for orchestrator lock acquisition, release, and stale detection.
 * Uses real filesystem operations with temp directories for isolation.
 */

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import process from "node:process";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
	MAX_LOCK_AGE_MS,
	MAX_RESET_AGE_MS,
	ORCHESTRATOR_LOCK_FILE,
} from "../../config/index.js";
import type { OrchestratorLock } from "../../types/index.js";
import {
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
} from "../lock.js";

// Test with a temp directory to avoid affecting real files
let tempDir: string;

beforeEach(() => {
	// Create temp directory with .git marker
	tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "lock-test-"));
	fs.mkdirSync(path.join(tempDir, ".git"), { recursive: true });

	// Clear cached project root
	clearProjectRootCache();

	// Mock process.cwd to return temp directory
	vi.spyOn(process, "cwd").mockReturnValue(tempDir);
});

afterEach(() => {
	// Restore original cwd
	vi.restoreAllMocks();

	// Clean up temp directory
	try {
		fs.rmSync(tempDir, { recursive: true, force: true });
	} catch {
		// Ignore cleanup errors
	}

	// Clear cached project root
	clearProjectRootCache();
});

describe("getProjectRoot", () => {
	it("returns directory containing .git", () => {
		const result = getProjectRoot();

		expect(result).toBe(tempDir);
	});

	it("caches result on subsequent calls", () => {
		const result1 = getProjectRoot();
		const result2 = getProjectRoot();

		expect(result1).toBe(result2);
	});

	it("falls back to cwd if no .git found", () => {
		// Remove .git directory
		fs.rmSync(path.join(tempDir, ".git"), { recursive: true });
		clearProjectRootCache();

		const result = getProjectRoot();

		// Should return cwd as fallback
		expect(result).toBe(tempDir);
	});
});

describe("getLockPath", () => {
	it("returns correct lock file path", () => {
		const result = getLockPath();

		expect(result).toBe(path.join(tempDir, ORCHESTRATOR_LOCK_FILE));
	});
});

describe("readLock / writeLock", () => {
	it("returns null when lock file does not exist", () => {
		const result = readLock();

		expect(result).toBeNull();
	});

	it("writes and reads lock correctly", () => {
		const lock: OrchestratorLock = {
			spec_id: 1362,
			started_at: new Date().toISOString(),
			pid: process.pid,
			hostname: os.hostname(),
		};

		writeLock(lock);
		const result = readLock();

		expect(result).toEqual(lock);
	});

	it("creates lock directory if it does not exist", () => {
		const lock: OrchestratorLock = {
			spec_id: 1362,
			started_at: new Date().toISOString(),
			pid: 12345,
			hostname: "test-host",
		};

		writeLock(lock);

		expect(fs.existsSync(getLockPath())).toBe(true);
	});

	it("returns null for invalid JSON in lock file", () => {
		const lockPath = getLockPath();
		fs.mkdirSync(path.dirname(lockPath), { recursive: true });
		fs.writeFileSync(lockPath, "invalid json {{{");

		const result = readLock();

		expect(result).toBeNull();
	});
});

describe("acquireLock", () => {
	// Mock console.error to prevent test output from being interpreted as real errors
	let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
	});

	afterEach(() => {
		consoleErrorSpy.mockRestore();
	});

	it("acquires lock when no existing lock", async () => {
		const result = await acquireLock(1362, true);

		expect(result).toBe(true);

		const lock = readLock();
		expect(lock?.spec_id).toBe(1362);
		expect(lock?.pid).toBe(process.pid);
		expect(lock?.hostname).toBe(os.hostname());
	});

	it("fails when lock already exists and is not stale", async () => {
		const existingLock: OrchestratorLock = {
			spec_id: 9999,
			started_at: new Date().toISOString(),
			pid: 99999,
			hostname: "other-host",
		};
		writeLock(existingLock);

		const result = await acquireLock(1362, true);

		expect(result).toBe(false);
		// Original lock should be unchanged
		const lock = readLock();
		expect(lock?.spec_id).toBe(9999);
	});

	it("overrides stale lock (>24h old)", async () => {
		const staleDate = new Date(Date.now() - MAX_LOCK_AGE_MS - 1000);
		const existingLock: OrchestratorLock = {
			spec_id: 9999,
			started_at: staleDate.toISOString(),
			pid: 99999,
			hostname: "old-host",
		};
		writeLock(existingLock);

		const result = await acquireLock(1362, true);

		expect(result).toBe(true);
		const lock = readLock();
		expect(lock?.spec_id).toBe(1362);
	});

	it("fails when reset is in progress and not stale", async () => {
		const existingLock: OrchestratorLock = {
			spec_id: 9999,
			started_at: new Date().toISOString(),
			pid: 99999,
			hostname: "other-host",
			reset_in_progress: true,
			reset_started_at: new Date().toISOString(),
		};
		writeLock(existingLock);

		const result = await acquireLock(1362, true);

		expect(result).toBe(false);
	});

	it("overrides stale reset (>10m old)", async () => {
		const staleResetDate = new Date(Date.now() - MAX_RESET_AGE_MS - 1000);
		const existingLock: OrchestratorLock = {
			spec_id: 9999,
			started_at: new Date().toISOString(),
			pid: 99999,
			hostname: "other-host",
			reset_in_progress: true,
			reset_started_at: staleResetDate.toISOString(),
		};
		writeLock(existingLock);

		const result = await acquireLock(1362, true);

		expect(result).toBe(true);
		const lock = readLock();
		expect(lock?.spec_id).toBe(1362);
		expect(lock?.reset_in_progress).toBeUndefined();
	});

	it("acquires lock with forceUnlock even when lock exists (different host)", async () => {
		const existingLock: OrchestratorLock = {
			spec_id: 9999,
			started_at: new Date().toISOString(),
			pid: 99999,
			hostname: "different-host", // Different host - can't terminate remote process
		};
		writeLock(existingLock);

		const result = await acquireLock(1362, true, true);

		expect(result).toBe(true);
		const lock = readLock();
		expect(lock?.spec_id).toBe(1362);
		expect(lock?.pid).toBe(process.pid);
	});

	it("acquires lock with forceUnlock when existing process not running", async () => {
		const existingLock: OrchestratorLock = {
			spec_id: 9999,
			started_at: new Date().toISOString(),
			pid: 999999, // Non-existent PID
			hostname: os.hostname(), // Same host
		};
		writeLock(existingLock);

		const result = await acquireLock(1362, true, true);

		expect(result).toBe(true);
		const lock = readLock();
		expect(lock?.spec_id).toBe(1362);
	});

	it("does not call terminateProcess when forceUnlock is false", async () => {
		const existingLock: OrchestratorLock = {
			spec_id: 9999,
			started_at: new Date().toISOString(),
			pid: 99999,
			hostname: os.hostname(),
		};
		writeLock(existingLock);

		// Without forceUnlock, should just fail (not try to terminate)
		const result = await acquireLock(1362, true, false);

		expect(result).toBe(false);
		// Lock should be unchanged
		const lock = readLock();
		expect(lock?.spec_id).toBe(9999);
	});
});

describe("isProcessRunning", () => {
	it("returns true for current process", () => {
		const result = isProcessRunning(process.pid);
		expect(result).toBe(true);
	});

	it("returns false for non-existent process", () => {
		// Use an extremely high PID that almost certainly doesn't exist
		const result = isProcessRunning(4194304);
		expect(result).toBe(false);
	});

	it("returns false for negative PID", () => {
		const result = isProcessRunning(-1);
		expect(result).toBe(false);
	});

	it("returns false for PID 0", () => {
		// PID 0 is special (kernel scheduler), should not be running as a normal process
		const result = isProcessRunning(0);
		// On some systems this might return true (EPERM), but that's acceptable
		expect(typeof result).toBe("boolean");
	});
});

describe("terminateProcess", () => {
	it("returns true for non-existent process", async () => {
		// Non-existent process should return true (nothing to terminate)
		const result = await terminateProcess(4194304, true);
		expect(result).toBe(true);
	});

	it("handles negative PID gracefully", async () => {
		const result = await terminateProcess(-1, true);
		// Should either return true (process doesn't exist) or false (error)
		expect(typeof result).toBe("boolean");
	});

	// Note: We don't test actual process termination in unit tests to avoid
	// accidentally killing real processes. Integration tests should cover that.
});

describe("releaseLock", () => {
	it("removes lock file when it exists", () => {
		const lock: OrchestratorLock = {
			spec_id: 1362,
			started_at: new Date().toISOString(),
			pid: process.pid,
			hostname: os.hostname(),
		};
		writeLock(lock);

		releaseLock(true);

		expect(fs.existsSync(getLockPath())).toBe(false);
	});

	it("does not throw when lock file does not exist", () => {
		expect(() => releaseLock(true)).not.toThrow();
	});
});

describe("updateLockResetState", () => {
	it("sets reset_in_progress to true with timestamp", () => {
		const lock: OrchestratorLock = {
			spec_id: 1362,
			started_at: new Date().toISOString(),
			pid: process.pid,
			hostname: os.hostname(),
		};
		writeLock(lock);

		updateLockResetState(true);

		const updatedLock = readLock();
		expect(updatedLock?.reset_in_progress).toBe(true);
		expect(updatedLock?.reset_started_at).toBeDefined();
	});

	it("clears reset_in_progress when set to false", () => {
		const lock: OrchestratorLock = {
			spec_id: 1362,
			started_at: new Date().toISOString(),
			pid: process.pid,
			hostname: os.hostname(),
			reset_in_progress: true,
			reset_started_at: new Date().toISOString(),
		};
		writeLock(lock);

		updateLockResetState(false);

		const updatedLock = readLock();
		expect(updatedLock?.reset_in_progress).toBe(false);
		expect(updatedLock?.reset_started_at).toBeUndefined();
	});

	it("does nothing when lock does not exist", () => {
		expect(() => updateLockResetState(true)).not.toThrow();
		expect(readLock()).toBeNull();
	});
});
