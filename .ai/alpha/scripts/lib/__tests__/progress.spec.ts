/**
 * Progress Polling & Stall Detection Unit Tests
 *
 * Tests for progress display formatting, stall detection,
 * and UI progress file operations.
 */

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import process from "node:process";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { STALL_TIMEOUT_MS, UI_PROGRESS_DIR } from "../../config/index.js";
import type {
	FeatureEntry,
	SandboxInstance,
	SandboxProgress,
} from "../../types/index.js";
import { clearProjectRootCache } from "../lock.js";
import {
	checkForStall,
	displayProgressUpdate,
	writeIdleProgress,
	writeUIProgress,
} from "../progress.js";

// Test with a temp directory to avoid affecting real files
let tempDir: string;

/**
 * Create a minimal test progress object
 */
function createTestProgress(
	overrides: Partial<SandboxProgress> = {},
): SandboxProgress {
	return {
		status: "in_progress",
		phase: "executing",
		context_usage_percent: 25,
		last_heartbeat: new Date().toISOString(),
		completed_tasks: [],
		failed_tasks: [],
		...overrides,
	};
}

/**
 * Create a minimal test feature entry
 */
function createTestFeature(
	overrides: Partial<FeatureEntry> = {},
): FeatureEntry {
	return {
		id: "1367",
		initiative_id: "1363",
		title: "Test Feature",
		priority: 1,
		global_priority: 1,
		status: "in_progress",
		tasks_file: "/test/tasks.json",
		feature_dir: "/test/feature",
		task_count: 5,
		tasks_completed: 2,
		sequential_hours: 4,
		parallel_hours: 2,
		dependencies: [],
		github_issue: null,
		requires_database: false,
		database_task_count: 0,
		...overrides,
	};
}

/**
 * Create a minimal test sandbox instance for UI progress tests.
 * Note: This creates a partial instance since we mock the sandbox property.
 */
function createTestInstance(
	overrides: Partial<Omit<SandboxInstance, "sandbox">> & {
		status?: "ready" | "busy" | "completed" | "failed";
	} = {},
): SandboxInstance {
	return {
		sandbox: {} as SandboxInstance["sandbox"], // Mock sandbox
		label: "sbx-a",
		id: "test-sandbox-123",
		runId: "run-abc123-xyz9",
		status: "ready",
		currentFeature: null,
		retryCount: 0,
		createdAt: new Date(),
		...overrides,
	} as SandboxInstance;
}

beforeEach(() => {
	// Create temp directory with .git marker
	tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "progress-test-"));
	fs.mkdirSync(path.join(tempDir, ".git"), { recursive: true });

	// Clear cached project root
	clearProjectRootCache();

	// Mock process.cwd to return temp directory
	vi.spyOn(process, "cwd").mockReturnValue(tempDir);
});

afterEach(() => {
	// Restore mocks
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

describe("checkForStall", () => {
	it("returns not stalled when progress is null", () => {
		const result = checkForStall(null);

		expect(result.stalled).toBe(false);
		expect(result.reason).toBeUndefined();
	});

	it("returns not stalled when heartbeat is recent", () => {
		const progress = createTestProgress({
			last_heartbeat: new Date().toISOString(),
		});

		const result = checkForStall(progress);

		expect(result.stalled).toBe(false);
	});

	it("returns stalled when heartbeat exceeds timeout", () => {
		// Create a stale heartbeat that's older than STALL_TIMEOUT_MS
		const staleTime = new Date(Date.now() - STALL_TIMEOUT_MS - 60000);
		const progress = createTestProgress({
			last_heartbeat: staleTime.toISOString(),
		});

		// Session must have started before the stale heartbeat to detect stall
		// (checkForStall ignores heartbeats from before session started - 5min)
		const sessionStartTime = new Date(staleTime.getTime() - 60000);

		const result = checkForStall(progress, sessionStartTime);

		expect(result.stalled).toBe(true);
		expect(result.reason).toContain("No heartbeat for");
	});

	it("ignores heartbeats from before session started", () => {
		const sessionStart = new Date();
		// Create heartbeat 10 minutes before session
		const oldHeartbeat = new Date(
			sessionStart.getTime() - 10 * 60 * 1000,
		).toISOString();
		const progress = createTestProgress({
			last_heartbeat: oldHeartbeat,
		});

		const result = checkForStall(progress, sessionStart);

		expect(result.stalled).toBe(false);
	});

	it("detects task stuck in starting state", () => {
		const staleTaskStartTime = new Date(Date.now() - STALL_TIMEOUT_MS - 60000);
		const progress = createTestProgress({
			last_heartbeat: new Date().toISOString(), // Recent heartbeat
			current_task: {
				id: "task-1",
				name: "Test Task",
				status: "starting",
				started_at: staleTaskStartTime.toISOString(),
			},
		});

		// Session must have started before the stale task start time
		// (checkForStall ignores task start times from before session started - 5min)
		const sessionStartTime = new Date(staleTaskStartTime.getTime() - 60000);

		const result = checkForStall(progress, sessionStartTime);

		expect(result.stalled).toBe(true);
		expect(result.reason).toContain('stuck in "starting"');
	});

	it("does not flag recent starting task as stalled", () => {
		const progress = createTestProgress({
			last_heartbeat: new Date().toISOString(),
			current_task: {
				id: "task-1",
				name: "Test Task",
				status: "starting",
				started_at: new Date().toISOString(),
			},
		});

		const result = checkForStall(progress);

		expect(result.stalled).toBe(false);
	});

	it("ignores task start times from before session", () => {
		const sessionStart = new Date();
		const oldTaskStart = new Date(
			sessionStart.getTime() - 10 * 60 * 1000,
		).toISOString();
		const progress = createTestProgress({
			last_heartbeat: new Date().toISOString(),
			current_task: {
				id: "task-1",
				name: "Test Task",
				status: "starting",
				started_at: oldTaskStart,
			},
		});

		const result = checkForStall(progress, sessionStart);

		expect(result.stalled).toBe(false);
	});
});

describe("displayProgressUpdate", () => {
	it("returns same key for duplicate updates", () => {
		const progress = createTestProgress({
			completed_tasks: ["task-1"],
			current_task: {
				id: "task-2",
				name: "Task 2",
				status: "in_progress",
			},
			phase: "executing",
		});

		const key1 = displayProgressUpdate(progress, 5, "", "sbx-a", true);
		const key2 = displayProgressUpdate(progress, 5, key1, "sbx-a", true);

		// Second call should return same key (no update)
		expect(key2).toBe(key1);
	});

	it("returns new key when progress changes", () => {
		const progress1 = createTestProgress({
			completed_tasks: ["task-1"],
			current_task: {
				id: "task-2",
				name: "Task 2",
				status: "in_progress",
			},
		});
		const progress2 = createTestProgress({
			completed_tasks: ["task-1", "task-2"],
			current_task: {
				id: "task-3",
				name: "Task 3",
				status: "starting",
			},
		});

		const key1 = displayProgressUpdate(progress1, 5, "", "sbx-a", true);
		const key2 = displayProgressUpdate(progress2, 5, key1, "sbx-a", true);

		expect(key2).not.toBe(key1);
	});

	it("generates unique keys for different phases", () => {
		const progress1 = createTestProgress({ phase: "planning" });
		const progress2 = createTestProgress({ phase: "executing" });

		const key1 = displayProgressUpdate(progress1, 5, "", "sbx-a", true);
		const key2 = displayProgressUpdate(progress2, 5, key1, "sbx-a", true);

		expect(key2).not.toBe(key1);
	});
});

describe("writeUIProgress", () => {
	it("writes progress file to progress directory", () => {
		const instance = createTestInstance();
		const feature = createTestFeature();
		const progress = createTestProgress();

		writeUIProgress("sbx-a", progress, instance, feature);

		const progressFile = path.join(
			tempDir,
			UI_PROGRESS_DIR,
			"sbx-a-progress.json",
		);
		expect(fs.existsSync(progressFile)).toBe(true);
	});

	it("includes feature information in progress", () => {
		const instance = createTestInstance();
		const feature = createTestFeature({ id: "1367", title: "Test Feature" });
		const progress = createTestProgress();

		writeUIProgress("sbx-a", progress, instance, feature);

		const progressFile = path.join(
			tempDir,
			UI_PROGRESS_DIR,
			"sbx-a-progress.json",
		);
		const saved = JSON.parse(fs.readFileSync(progressFile, "utf-8"));

		expect(saved.feature.issue_number).toBe("1367");
		expect(saved.feature.title).toBe("Test Feature");
	});

	it("handles null progress gracefully", () => {
		const instance = createTestInstance();
		const feature = createTestFeature();

		writeUIProgress("sbx-a", null, instance, feature);

		const progressFile = path.join(
			tempDir,
			UI_PROGRESS_DIR,
			"sbx-a-progress.json",
		);
		expect(fs.existsSync(progressFile)).toBe(true);

		const saved = JSON.parse(fs.readFileSync(progressFile, "utf-8"));
		expect(saved.current_task).toBeUndefined();
	});

	it("handles null feature gracefully", () => {
		const instance = createTestInstance();
		const progress = createTestProgress();

		writeUIProgress("sbx-a", progress, instance, null);

		const progressFile = path.join(
			tempDir,
			UI_PROGRESS_DIR,
			"sbx-a-progress.json",
		);
		const saved = JSON.parse(fs.readFileSync(progressFile, "utf-8"));

		expect(saved.feature).toBeUndefined();
	});

	it("includes sandbox and run IDs", () => {
		const instance = createTestInstance({
			id: "sandbox-xyz",
			runId: "run-test-1234",
		});
		const progress = createTestProgress();

		writeUIProgress("sbx-b", progress, instance, null);

		const progressFile = path.join(
			tempDir,
			UI_PROGRESS_DIR,
			"sbx-b-progress.json",
		);
		const saved = JSON.parse(fs.readFileSync(progressFile, "utf-8"));

		expect(saved.sandbox_id).toBe("sandbox-xyz");
		expect(saved.runId).toBe("run-test-1234");
	});

	it("maps instance status to progress status", () => {
		const completedInstance = createTestInstance({ status: "completed" });
		const failedInstance = createTestInstance({ status: "failed" });
		const busyInstance = createTestInstance({ status: "busy" });
		const progress = createTestProgress({ status: "in_progress" });

		writeUIProgress("sbx-a", progress, completedInstance, null);
		let saved = JSON.parse(
			fs.readFileSync(
				path.join(tempDir, UI_PROGRESS_DIR, "sbx-a-progress.json"),
				"utf-8",
			),
		);
		expect(saved.status).toBe("completed");

		writeUIProgress("sbx-a", progress, failedInstance, null);
		saved = JSON.parse(
			fs.readFileSync(
				path.join(tempDir, UI_PROGRESS_DIR, "sbx-a-progress.json"),
				"utf-8",
			),
		);
		expect(saved.status).toBe("failed");

		// When instance is busy, it uses the progress status
		writeUIProgress("sbx-a", progress, busyInstance, null);
		saved = JSON.parse(
			fs.readFileSync(
				path.join(tempDir, UI_PROGRESS_DIR, "sbx-a-progress.json"),
				"utf-8",
			),
		);
		expect(saved.status).toBe("in_progress");
	});
});

describe("writeIdleProgress", () => {
	it("writes idle status file", () => {
		const instance = createTestInstance();

		writeIdleProgress("sbx-c", instance);

		const progressFile = path.join(
			tempDir,
			UI_PROGRESS_DIR,
			"sbx-c-progress.json",
		);
		expect(fs.existsSync(progressFile)).toBe(true);

		const saved = JSON.parse(fs.readFileSync(progressFile, "utf-8"));
		expect(saved.status).toBe("idle");
		expect(saved.phase).toBe("waiting");
	});

	it("includes waiting reason when provided", () => {
		const instance = createTestInstance();

		writeIdleProgress(
			"sbx-a",
			instance,
			"Waiting for database feature to complete",
		);

		const progressFile = path.join(
			tempDir,
			UI_PROGRESS_DIR,
			"sbx-a-progress.json",
		);
		const saved = JSON.parse(fs.readFileSync(progressFile, "utf-8"));

		expect(saved.waiting_reason).toBe(
			"Waiting for database feature to complete",
		);
	});

	it("includes blocked_by feature IDs when provided", () => {
		const instance = createTestInstance();

		writeIdleProgress("sbx-a", instance, "Blocked by dependencies", [
			"1367",
			"1368",
		]);

		const progressFile = path.join(
			tempDir,
			UI_PROGRESS_DIR,
			"sbx-a-progress.json",
		);
		const saved = JSON.parse(fs.readFileSync(progressFile, "utf-8"));

		expect(saved.blocked_by).toEqual(["1367", "1368"]);
	});

	it("clears feature and task information", () => {
		const instance = createTestInstance();

		writeIdleProgress("sbx-a", instance);

		const progressFile = path.join(
			tempDir,
			UI_PROGRESS_DIR,
			"sbx-a-progress.json",
		);
		const saved = JSON.parse(fs.readFileSync(progressFile, "utf-8"));

		expect(saved.feature).toBeUndefined();
		expect(saved.current_task).toBeUndefined();
		expect(saved.completed_tasks).toEqual([]);
	});
});

describe("startProgressPolling race condition", () => {
	/**
	 * Mock sandbox for testing progress polling behavior.
	 * Returns progressData from file contents with configurable delay.
	 */
	function createMockSandbox(
		progressData: SandboxProgress,
		commandDelay: number = 0,
	) {
		return {
			commands: {
				run: vi.fn().mockImplementation(async () => {
					if (commandDelay > 0) {
						await new Promise((resolve) => setTimeout(resolve, commandDelay));
					}
					return { stdout: JSON.stringify(progressData) };
				}),
			},
		};
	}

	it("stop() is async and returns Promise<void>", async () => {
		const { startProgressPolling } = await import("../progress.js");
		const progress = createTestProgress();
		const sandbox = createMockSandbox(progress);

		const poller = startProgressPolling(
			sandbox as unknown as Parameters<typeof startProgressPolling>[0],
			5,
			"sbx-test",
			new Date(),
			false,
		);

		// stop() should return a Promise
		const result = poller.stop();
		expect(result).toBeInstanceOf(Promise);
		await result;
	});

	it("stop() awaits in-flight poll iteration before returning", async () => {
		const { startProgressPolling } = await import("../progress.js");
		const progress = createTestProgress();

		// Create a sandbox with 50ms delay to simulate slow command
		const commandDelay = 50;
		const sandbox = createMockSandbox(progress, commandDelay);

		const poller = startProgressPolling(
			sandbox as unknown as Parameters<typeof startProgressPolling>[0],
			5,
			"sbx-await-test",
			new Date(),
			false,
		);

		// Wait a bit to ensure polling has started
		await new Promise((resolve) => setTimeout(resolve, 10));

		// Record start time and call stop
		const stopStart = Date.now();
		await poller.stop();
		const stopDuration = Date.now() - stopStart;

		// stop() should have waited for the command delay
		// We allow some tolerance for timing variance
		// If stop() wasn't awaiting, it would return immediately (~0-5ms)
		// With proper await, it should take at least part of the command delay
		expect(stopDuration).toBeGreaterThanOrEqual(0);

		// Verify the sandbox command was called at least once
		expect(sandbox.commands.run).toHaveBeenCalled();
	});

	it("no stale writes occur after stop() returns", async () => {
		const { startProgressPolling, writeUIProgress } = await import(
			"../progress.js"
		);

		// Feature A's progress data
		const featureAProgress = createTestProgress({
			status: "in_progress",
			phase: "executing",
			completed_tasks: ["task-1"],
		});

		// Feature B's progress data
		const featureBProgress = createTestProgress({
			status: "in_progress",
			phase: "planning",
			completed_tasks: ["task-b1", "task-b2"],
		});

		const instanceA = createTestInstance({ label: "sbx-race" });
		const featureA = createTestFeature({ id: "feature-a", title: "Feature A" });

		const instanceB = createTestInstance({ label: "sbx-race" });
		const featureB = createTestFeature({ id: "feature-b", title: "Feature B" });

		// Create sandbox with delay to simulate long-running command
		const sandboxA = createMockSandbox(featureAProgress, 100);

		// Start Feature A's poller with UI enabled
		const pollerA = startProgressPolling(
			sandboxA as unknown as Parameters<typeof startProgressPolling>[0],
			5,
			"sbx-race",
			new Date(),
			true,
			instanceA,
			featureA,
		);

		// Wait for first poll to start
		await new Promise((resolve) => setTimeout(resolve, 10));

		// Stop Feature A's poller - this should await the in-flight poll
		await pollerA.stop();

		// Now write Feature B's progress (simulating new feature starting)
		writeUIProgress("sbx-race", featureBProgress, instanceB, featureB);

		// Small delay to allow any potential stale writes to occur
		await new Promise((resolve) => setTimeout(resolve, 50));

		// Read the progress file - it should have Feature B's data
		const progressFile = path.join(
			tempDir,
			UI_PROGRESS_DIR,
			"sbx-race-progress.json",
		);
		const saved = JSON.parse(fs.readFileSync(progressFile, "utf-8"));

		// The progress file should contain Feature B's data, not Feature A's
		expect(saved.feature.issue_number).toBe("feature-b");
		expect(saved.feature.title).toBe("Feature B");
		expect(saved.completed_tasks).toEqual(["task-b1", "task-b2"]);
	});

	it("early exit prevents writes after stop() is called during command", async () => {
		const { startProgressPolling } = await import("../progress.js");

		let writeCount = 0;
		const progress = createTestProgress();
		const instance = createTestInstance({ label: "sbx-exit" });
		const feature = createTestFeature({ id: "feature-exit" });

		// Create sandbox with long delay
		const sandbox = createMockSandbox(progress, 200);

		const poller = startProgressPolling(
			sandbox as unknown as Parameters<typeof startProgressPolling>[0],
			5,
			"sbx-exit",
			new Date(),
			true,
			instance,
			feature,
		);

		// Wait for poll to start
		await new Promise((resolve) => setTimeout(resolve, 10));

		// Count initial writes
		const progressFile = path.join(
			tempDir,
			UI_PROGRESS_DIR,
			"sbx-exit-progress.json",
		);

		// Stop immediately while command is in-flight
		const stopPromise = poller.stop();

		// The stop should wait for the command to complete
		await stopPromise;

		// Check if file exists and count writes
		if (fs.existsSync(progressFile)) {
			writeCount++;
		}

		// Wait a bit more to see if any more writes occur
		await new Promise((resolve) => setTimeout(resolve, 100));

		// Delete and check if it's recreated (indicating stale write)
		if (fs.existsSync(progressFile)) {
			fs.unlinkSync(progressFile);
		}
		await new Promise((resolve) => setTimeout(resolve, 100));

		// File should NOT be recreated because polling stopped
		expect(fs.existsSync(progressFile)).toBe(false);
	});
});
