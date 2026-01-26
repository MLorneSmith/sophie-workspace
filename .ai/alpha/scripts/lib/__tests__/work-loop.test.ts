/**
 * Unit tests for work-loop module.
 *
 * Tests the WorkLoop class which was extracted from orchestrator.ts
 * as part of the refactoring (#1816 Phase 4).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SandboxInstance, SpecManifest } from "../../types/index.js";
import {
	runWorkLoop,
	WorkLoop,
	type WorkLoopOptions,
} from "../work-loop.js";

// Mock dependencies
vi.mock("../deadlock-handler.js", () => ({
	detectAndHandleDeadlock: vi.fn().mockReturnValue({
		shouldExit: false,
		retriedCount: 0,
		failedInitiatives: [],
	}),
	recoverPhantomCompletedFeatures: vi.fn(),
}));

vi.mock("../feature.js", () => ({
	runFeatureImplementation: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../health.js", () => ({
	runHealthChecks: vi.fn().mockResolvedValue([]),
}));

vi.mock("../manifest.js", () => ({
	saveManifest: vi.fn(),
}));

vi.mock("../progress.js", () => ({
	writeIdleProgress: vi.fn(),
}));

vi.mock("../progress-file.js", () => ({
	readProgressFile: vi.fn().mockResolvedValue({ success: false }),
	isProgressFileStale: vi.fn().mockReturnValue(true),
	isFeatureCompleted: vi.fn().mockReturnValue(false),
}));

vi.mock("../sandbox.js", () => ({
	createSandbox: vi.fn(),
	getSandboxesNeedingRestart: vi.fn().mockReturnValue([]),
	keepAliveSandboxes: vi.fn().mockResolvedValue([]),
}));

vi.mock("../utils.js", () => ({
	sleep: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../work-queue.js", () => ({
	assignFeatureToSandbox: vi.fn().mockReturnValue(true),
	getBlockedFeatures: vi.fn().mockReturnValue([]),
	getNextAvailableFeature: vi.fn().mockReturnValue(null),
}));

import type { FeatureEntry } from "../../types/index.js";

// Helper to create a minimal feature entry for testing
function createTestFeature(
	id: string,
	overrides: Partial<FeatureEntry> = {},
): FeatureEntry {
	return {
		id,
		initiative_id: "I1",
		title: `Feature ${id}`,
		priority: 1,
		global_priority: 1,
		status: "pending",
		tasks_file: `/tmp/${id}/tasks.json`,
		feature_dir: `/tmp/${id}`,
		task_count: 3,
		tasks_completed: 0,
		sequential_hours: 1,
		parallel_hours: 1,
		dependencies: [],
		github_issue: null,
		requires_database: false,
		database_task_count: 0,
		...overrides,
	};
}

// Helper to create a minimal spec manifest for testing
function createTestManifest(
	overrides: Partial<SpecManifest> = {},
): SpecManifest {
	return {
		metadata: {
			spec_id: "S1234",
			spec_name: "Test Spec",
			generated_at: new Date().toISOString(),
			spec_dir: "/tmp/test-spec",
			research_dir: "/tmp/test-spec/research-library",
		},
		initiatives: [],
		feature_queue: [],
		progress: {
			status: "pending",
			initiatives_total: 0,
			initiatives_completed: 0,
			features_total: 0,
			features_completed: 0,
			tasks_total: 0,
			tasks_completed: 0,
			next_feature_id: null,
			last_completed_feature_id: null,
			started_at: null,
			completed_at: null,
			last_checkpoint: null,
		},
		sandbox: {
			sandbox_ids: [],
			branch_name: "test-branch",
			created_at: null,
		},
		...overrides,
	};
}

// Helper to create a minimal sandbox instance for testing
function createTestInstance(
	label: string,
	overrides: Partial<SandboxInstance> = {},
): SandboxInstance {
	return {
		id: `sbx-${label}`,
		label,
		sandbox: {
			commands: {
				run: vi.fn().mockResolvedValue({ exitCode: 0, stdout: "", stderr: "" }),
			},
			kill: vi.fn().mockResolvedValue(undefined),
		} as unknown as SandboxInstance["sandbox"],
		status: "ready",
		currentFeature: null,
		retryCount: 0,
		createdAt: new Date(),
		lastKeepaliveAt: new Date(),
		...overrides,
	} as SandboxInstance;
}

describe("WorkLoop", () => {
	beforeEach(() => {
		vi.resetAllMocks();
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.restoreAllMocks();
		vi.useRealTimers();
	});

	describe("constructor", () => {
		it("creates WorkLoop instance with required options", () => {
			const manifest = createTestManifest();
			const instances = [createTestInstance("sbx-a")];

			const options: WorkLoopOptions = {
				instances,
				manifest,
				uiEnabled: false,
				timeoutSeconds: 7200,
			};

			const workLoop = new WorkLoop(options);
			expect(workLoop).toBeInstanceOf(WorkLoop);
		});

		it("accepts optional runId", () => {
			const manifest = createTestManifest();
			const instances = [createTestInstance("sbx-a")];

			const options: WorkLoopOptions = {
				instances,
				manifest,
				uiEnabled: false,
				timeoutSeconds: 7200,
				runId: "test-run-123",
			};

			const workLoop = new WorkLoop(options);
			expect(workLoop).toBeInstanceOf(WorkLoop);
		});

		it("accepts custom logger function", () => {
			const manifest = createTestManifest();
			const instances = [createTestInstance("sbx-a")];
			const customLogger = vi.fn();

			const options: WorkLoopOptions = {
				instances,
				manifest,
				uiEnabled: false,
				timeoutSeconds: 7200,
			};

			const workLoop = new WorkLoop(options, customLogger);
			expect(workLoop).toBeInstanceOf(WorkLoop);
		});
	});

	describe("run", () => {
		it("returns result with completed=true when no workable features", async () => {
			const manifest = createTestManifest({
				feature_queue: [],
			});
			const instances = [createTestInstance("sbx-a")];

			const options: WorkLoopOptions = {
				instances,
				manifest,
				uiEnabled: false,
				timeoutSeconds: 7200,
			};

			const workLoop = new WorkLoop(options);

			// Run with immediate timer advancement
			const runPromise = workLoop.run();
			await vi.runAllTimersAsync();
			const result = await runPromise;

			expect(result).toMatchObject({
				completed: true,
				featuresCompleted: 0,
				featuresFailed: 0,
				deadlockDetected: false,
			});
		});

		it("returns result with correct counts for completed features", async () => {
			const manifest = createTestManifest({
				feature_queue: [
					createTestFeature("F1", {
						status: "completed",
						task_count: 3,
						tasks_completed: 3,
					}),
					createTestFeature("F2", {
						status: "completed",
						task_count: 2,
						tasks_completed: 2,
					}),
				],
			});
			const instances = [createTestInstance("sbx-a")];

			const options: WorkLoopOptions = {
				instances,
				manifest,
				uiEnabled: false,
				timeoutSeconds: 7200,
			};

			const workLoop = new WorkLoop(options);

			const runPromise = workLoop.run();
			await vi.runAllTimersAsync();
			const result = await runPromise;

			expect(result.featuresCompleted).toBe(2);
			expect(result.featuresFailed).toBe(0);
		});

		it("counts failed features correctly", async () => {
			const manifest = createTestManifest({
				feature_queue: [
					createTestFeature("F1", {
						status: "completed",
						task_count: 3,
						tasks_completed: 3,
					}),
					createTestFeature("F2", {
						status: "failed",
						task_count: 2,
						tasks_completed: 0,
						error: "Test failure",
					}),
				],
			});
			const instances = [createTestInstance("sbx-a")];

			const options: WorkLoopOptions = {
				instances,
				manifest,
				uiEnabled: false,
				timeoutSeconds: 7200,
			};

			// Mock detectAndHandleDeadlock to return shouldExit: true to exit the loop
			const { detectAndHandleDeadlock } = await import("../deadlock-handler.js");
			vi.mocked(detectAndHandleDeadlock).mockReturnValue({
				shouldExit: true,
				retriedCount: 0,
				failedInitiatives: ["I1"],
			});

			const workLoop = new WorkLoop(options);

			const runPromise = workLoop.run();
			await vi.runAllTimersAsync();
			const result = await runPromise;

			expect(result.featuresCompleted).toBe(1);
			expect(result.featuresFailed).toBe(1);
			expect(result.completed).toBe(false);
		});
	});

	describe("stop", () => {
		it("stops the work loop gracefully", async () => {
			const manifest = createTestManifest({
				feature_queue: [createTestFeature("F1", { status: "pending" })],
			});
			const instances = [createTestInstance("sbx-a")];

			// Ensure mock returns proper value for this test
			const { detectAndHandleDeadlock } = await import("../deadlock-handler.js");
			vi.mocked(detectAndHandleDeadlock).mockReturnValue({
				shouldExit: true, // Force exit to avoid infinite loop
				retriedCount: 0,
				failedInitiatives: [],
			});

			const options: WorkLoopOptions = {
				instances,
				manifest,
				uiEnabled: false,
				timeoutSeconds: 7200,
			};

			const workLoop = new WorkLoop(options);

			// Start the loop
			const runPromise = workLoop.run();

			// Stop it immediately
			workLoop.stop();

			// Let timers advance
			await vi.runAllTimersAsync();

			const result = await runPromise;

			// The deadlock mock forces exit, which is expected
			expect(result).toBeDefined();
		});
	});
});

describe("runWorkLoop (backward compatibility function)", () => {
	beforeEach(() => {
		vi.resetAllMocks();
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.restoreAllMocks();
		vi.useRealTimers();
	});

	it("is a function that wraps WorkLoop class", () => {
		expect(typeof runWorkLoop).toBe("function");
	});

	it("completes with empty feature queue", async () => {
		const manifest = createTestManifest();
		const instances = [createTestInstance("sbx-a")];

		const runPromise = runWorkLoop(instances, manifest, false, 7200);
		await vi.runAllTimersAsync();
		await runPromise;

		// Should complete without throwing
		expect(true).toBe(true);
	});

	it("accepts optional runId parameter", async () => {
		const manifest = createTestManifest();
		const instances = [createTestInstance("sbx-a")];

		const runPromise = runWorkLoop(
			instances,
			manifest,
			false,
			7200,
			"test-run-456",
		);
		await vi.runAllTimersAsync();
		await runPromise;

		expect(true).toBe(true);
	});
});
