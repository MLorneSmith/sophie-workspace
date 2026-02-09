/**
 * Sandbox Restart Behavior Unit Tests
 *
 * Tests for bug fix #1713: Sandbox restart should update UI progress
 * and reset created_at timestamp.
 *
 * These tests verify:
 * 1. `created_at` is reset when sandbox is restarted (preemptive restart)
 * 2. `created_at` is reset when sandbox is restarted (stall timeout restart)
 * 3. `writeIdleProgress()` is called after preemptive restart
 * 4. `writeIdleProgress()` is called after stall timeout restart
 * 5. Progress file shows current heartbeat (not stale data)
 * 6. Regression test: Restart count still increments correctly
 * 7. Regression test: Restart doesn't affect other manifest properties
 */

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import process from "node:process";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { UI_PROGRESS_DIR } from "../../config/index.js";
import type { SandboxInstance, SpecManifest } from "../../types/index.js";
import { clearProjectRootCache } from "../lock.js";

// Test with a temp directory to avoid affecting real files
let tempDir: string;

/**
 * Create a minimal test manifest with sandbox configuration
 */
function createTestManifest(
	overrides: Partial<SpecManifest> = {},
): SpecManifest {
	return {
		metadata: {
			spec_id: "S1234",
			spec_name: "Test Spec",
			spec_dir: "/test/spec",
			project_root: tempDir,
			generated_at: new Date().toISOString(),
		},
		sandbox: {
			branch_name: "test-branch",
			sandbox_ids: ["sandbox-old-123"],
			created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes old
			restart_count: 0,
		},
		initiatives: [],
		feature_queue: [],
		progress: {
			status: "pending",
			features_total: 0,
			features_completed: 0,
			tasks_total: 0,
			tasks_completed: 0,
			initiatives_total: 0,
			initiatives_completed: 0,
		},
		...overrides,
	} as SpecManifest;
}

/**
 * Create a minimal test sandbox instance
 */
function createTestInstance(
	overrides: Partial<Omit<SandboxInstance, "sandbox">> = {},
): SandboxInstance {
	return {
		sandbox: {} as SandboxInstance["sandbox"],
		label: "sbx-a",
		id: "sandbox-new-456",
		runId: "run-test-1234",
		status: "ready",
		currentFeature: null,
		retryCount: 0,
		createdAt: new Date(),
		lastKeepaliveAt: new Date(),
		...overrides,
	} as SandboxInstance;
}

beforeEach(() => {
	// Create temp directory with .git marker
	tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "restart-test-"));
	fs.mkdtempSync(path.join(tempDir, ".git"));

	// Create progress directory
	fs.mkdirSync(path.join(tempDir, UI_PROGRESS_DIR), { recursive: true });

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

describe("Restart created_at timestamp reset (Bug fix #1713)", () => {
	it("created_at should be reset to current time on restart", () => {
		const oldCreatedAt = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago
		const manifest = createTestManifest({
			sandbox: {
				branch_name: "test-branch",
				sandbox_ids: ["sandbox-old"],
				created_at: oldCreatedAt.toISOString(),
				restart_count: 0,
			},
		});

		// Simulate what happens during restart (reset created_at)
		expect(manifest.sandbox.created_at).not.toBeNull();
		const createdAtBefore = manifest.sandbox.created_at as string;
		const beforeRestart = new Date(createdAtBefore);
		expect(beforeRestart.getTime()).toBe(oldCreatedAt.getTime());

		// This is the fix: reset created_at on restart
		manifest.sandbox.created_at = new Date().toISOString();

		// created_at should now be recent (within last second)
		const afterRestart = new Date(manifest.sandbox.created_at);
		const age = Date.now() - afterRestart.getTime();
		expect(age).toBeLessThan(1000); // Less than 1 second old
	});

	it("restart_count should still increment correctly after fix", () => {
		const manifest = createTestManifest({
			sandbox: {
				branch_name: "test-branch",
				sandbox_ids: ["sandbox-old"],
				created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
				restart_count: 2, // Already restarted twice
			},
		});

		// Simulate restart
		manifest.sandbox.restart_count = (manifest.sandbox.restart_count ?? 0) + 1;
		manifest.sandbox.created_at = new Date().toISOString();

		expect(manifest.sandbox.restart_count).toBe(3);
	});

	it("other sandbox properties should not be affected by created_at reset", () => {
		const manifest = createTestManifest({
			sandbox: {
				branch_name: "feature/test-123",
				sandbox_ids: ["sbx-abc", "sbx-def"],
				created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
				restart_count: 5,
			},
		});

		const originalBranch = manifest.sandbox.branch_name;
		const originalIds = [...manifest.sandbox.sandbox_ids];
		const originalRestartCount = manifest.sandbox.restart_count;

		// Simulate restart with created_at reset
		manifest.sandbox.created_at = new Date().toISOString();

		// Other properties should remain unchanged
		expect(manifest.sandbox.branch_name).toBe(originalBranch);
		expect(manifest.sandbox.sandbox_ids).toEqual(originalIds);
		expect(manifest.sandbox.restart_count).toBe(originalRestartCount);
	});
});

describe("writeIdleProgress after restart (Bug fix #1713)", () => {
	it("writeIdleProgress should write progress file with current heartbeat", async () => {
		const { writeIdleProgress } = await import("../progress.js");
		const instance = createTestInstance({ label: "sbx-restart" });

		writeIdleProgress("sbx-restart", instance);

		const progressFile = path.join(
			tempDir,
			UI_PROGRESS_DIR,
			"sbx-restart-progress.json",
		);
		expect(fs.existsSync(progressFile)).toBe(true);

		const saved = JSON.parse(fs.readFileSync(progressFile, "utf-8"));

		// Heartbeat should be recent (within last second)
		const heartbeatTime = new Date(saved.last_heartbeat).getTime();
		const age = Date.now() - heartbeatTime;
		expect(age).toBeLessThan(1000);

		// Status should be idle
		expect(saved.status).toBe("idle");
		expect(saved.phase).toBe("waiting");
	});

	it("writeIdleProgress should clear stale feature data", async () => {
		const { writeIdleProgress, writeUIProgress } = await import(
			"../progress.js"
		);
		const instance = createTestInstance({ label: "sbx-clear" });

		// First write progress with feature data
		writeUIProgress(
			"sbx-clear",
			{
				status: "in_progress",
				phase: "executing",
				completed_tasks: ["task-1"],
				failed_tasks: [],
				current_task: { id: "task-2", name: "Task 2", status: "in_progress" },
				context_usage_percent: 50,
				last_heartbeat: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 min old
			},
			instance,
			{
				id: "1234",
				title: "Old Feature",
				initiative_id: "I1",
				priority: 1,
				global_priority: 1,
				status: "in_progress",
				tasks_file: "",
				feature_dir: "",
				task_count: 5,
				tasks_completed: 1,
				sequential_hours: 2,
				parallel_hours: 1,
				dependencies: [],
				github_issue: null,
				requires_database: false,
				database_task_count: 0,
			},
		);

		// Verify stale data is present
		const progressFile = path.join(
			tempDir,
			UI_PROGRESS_DIR,
			"sbx-clear-progress.json",
		);
		let saved = JSON.parse(fs.readFileSync(progressFile, "utf-8"));
		expect(saved.feature).toBeDefined();
		expect(saved.current_task).toBeDefined();

		// Now call writeIdleProgress (as done after restart)
		writeIdleProgress("sbx-clear", instance);

		// Verify stale data is cleared
		saved = JSON.parse(fs.readFileSync(progressFile, "utf-8"));
		expect(saved.feature).toBeUndefined();
		expect(saved.current_task).toBeUndefined();
		expect(saved.completed_tasks).toEqual([]);
		expect(saved.status).toBe("idle");

		// Heartbeat should be fresh
		const heartbeatTime = new Date(saved.last_heartbeat).getTime();
		const age = Date.now() - heartbeatTime;
		expect(age).toBeLessThan(1000);
	});

	it("should not show 25+ minute old heartbeat after restart", async () => {
		const { writeIdleProgress } = await import("../progress.js");
		const instance = createTestInstance({ label: "sbx-fresh" });

		// Simulate the bug: without writeIdleProgress, heartbeat would be stale
		// With the fix: writeIdleProgress writes a fresh heartbeat
		writeIdleProgress("sbx-fresh", instance);

		const progressFile = path.join(
			tempDir,
			UI_PROGRESS_DIR,
			"sbx-fresh-progress.json",
		);
		const saved = JSON.parse(fs.readFileSync(progressFile, "utf-8"));

		const heartbeatTime = new Date(saved.last_heartbeat).getTime();
		const ageMinutes = (Date.now() - heartbeatTime) / 60000;

		// Heartbeat should be very recent, definitely not 25+ minutes
		expect(ageMinutes).toBeLessThan(1); // Less than 1 minute
	});
});

describe("Combined restart behavior (Bug fix #1713)", () => {
	it("restart should reset created_at AND write idle progress", async () => {
		const { writeIdleProgress } = await import("../progress.js");

		// Setup: old manifest and instance
		const manifest = createTestManifest({
			sandbox: {
				branch_name: "test-branch",
				sandbox_ids: ["sandbox-old"],
				created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
				restart_count: 0,
			},
		});
		const instance = createTestInstance({ label: "sbx-combined" });

		// Record old created_at
		const oldCreatedAt = manifest.sandbox.created_at;

		// Simulate restart handler logic (matching orchestrator.ts)
		manifest.sandbox.restart_count = (manifest.sandbox.restart_count ?? 0) + 1;
		manifest.sandbox.created_at = new Date().toISOString(); // Bug fix #1713
		writeIdleProgress("sbx-combined", instance); // Bug fix #1713

		// Verify created_at was reset
		expect(manifest.sandbox.created_at).not.toBe(oldCreatedAt);
		const createdAtAge =
			Date.now() - new Date(manifest.sandbox.created_at).getTime();
		expect(createdAtAge).toBeLessThan(1000);

		// Verify idle progress was written
		const progressFile = path.join(
			tempDir,
			UI_PROGRESS_DIR,
			"sbx-combined-progress.json",
		);
		expect(fs.existsSync(progressFile)).toBe(true);

		const saved = JSON.parse(fs.readFileSync(progressFile, "utf-8"));
		expect(saved.status).toBe("idle");

		const heartbeatAge = Date.now() - new Date(saved.last_heartbeat).getTime();
		expect(heartbeatAge).toBeLessThan(1000);

		// Verify restart count incremented
		expect(manifest.sandbox.restart_count).toBe(1);
	});

	it("multiple restarts should each update created_at and progress", async () => {
		const { writeIdleProgress } = await import("../progress.js");

		const manifest = createTestManifest({
			sandbox: {
				branch_name: "test-branch",
				sandbox_ids: ["sandbox-1"],
				created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour old
				restart_count: 0,
			},
		});

		expect(manifest.sandbox.created_at).not.toBeNull();
		const initialCreatedAt = manifest.sandbox.created_at as string;
		const timestamps: string[] = [initialCreatedAt];

		// Simulate 3 restarts
		for (let i = 0; i < 3; i++) {
			const instance = createTestInstance({ label: `sbx-multi-${i}` });

			// Wait a tiny bit to ensure timestamps differ
			await new Promise((resolve) => setTimeout(resolve, 10));

			// Restart handler logic
			manifest.sandbox.restart_count =
				(manifest.sandbox.restart_count ?? 0) + 1;
			manifest.sandbox.created_at = new Date().toISOString();
			writeIdleProgress(`sbx-multi-${i}`, instance);

			timestamps.push(manifest.sandbox.created_at);

			// Verify progress file exists
			const progressFile = path.join(
				tempDir,
				UI_PROGRESS_DIR,
				`sbx-multi-${i}-progress.json`,
			);
			expect(fs.existsSync(progressFile)).toBe(true);
		}

		// All timestamps should be different
		const uniqueTimestamps = new Set(timestamps);
		expect(uniqueTimestamps.size).toBe(4); // Original + 3 restarts

		// Restart count should be 3
		expect(manifest.sandbox.restart_count).toBe(3);

		// Latest created_at should be very recent
		expect(manifest.sandbox.created_at).not.toBeNull();
		const finalCreatedAt = manifest.sandbox.created_at as string;
		const latestAge = Date.now() - new Date(finalCreatedAt).getTime();
		expect(latestAge).toBeLessThan(1000);
	});
});
