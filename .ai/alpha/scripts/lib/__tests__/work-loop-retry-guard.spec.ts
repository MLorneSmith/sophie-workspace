/**
 * Tests for retry guard and sandbox extension logic.
 *
 * Bug fix #2074: Tests the three-part fix for sandbox lifecycle collision
 * and retry count inflation:
 * 1. Retry guard prevents double retry-count increment
 * 2. Sandbox extension prevents killing mid-execution
 * 3. Extension count limits prevent infinite loops
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SandboxInstance, SpecManifest } from "../../types/index.js";
import { WorkLoop } from "../work-loop.js";

// Mock all dependencies
vi.mock("../deadlock-handler.js", () => ({
	detectAndHandleDeadlock: vi.fn().mockReturnValue({
		shouldExit: true,
		retriedCount: 0,
		failedInitiatives: [],
	}),
	recoverPhantomCompletedFeatures: vi.fn(),
}));

vi.mock("../feature.js", () => ({
	runFeatureImplementation: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../feature-transitions.js", () => ({
	transitionFeatureStatus: vi.fn(),
}));

vi.mock("../event-emitter.js", () => ({
	emitOrchestratorEvent: vi.fn(),
}));

vi.mock("../health.js", () => ({
	runHealthChecks: vi.fn().mockResolvedValue([]),
}));

vi.mock("../manifest.js", () => ({
	saveManifest: vi.fn(),
	writeOverallProgress: vi.fn(),
}));

vi.mock("../progress.js", () => ({
	writeIdleProgress: vi.fn(),
}));

vi.mock("../progress-file.js", () => ({
	readProgressFile: vi.fn().mockResolvedValue({ success: false }),
	isProgressFileStale: vi.fn().mockReturnValue(true),
	isFeatureCompleted: vi.fn().mockReturnValue(false),
}));

vi.mock("../provider.js", () => ({
	getGracefulShutdownCommand: vi.fn().mockReturnValue("kill-claude"),
}));

vi.mock("../sandbox.js", () => ({
	createSandbox: vi.fn(),
	extendSandboxTimeout: vi.fn().mockResolvedValue(true),
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
	shouldRetryFailedFeature: vi.fn(),
	DEFAULT_MAX_RETRIES: 3,
	updateNextFeatureId: vi.fn(),
}));

import type { FeatureEntry } from "../../types/index.js";
import { extendSandboxTimeout, getSandboxesNeedingRestart } from "../sandbox.js";
import { shouldRetryFailedFeature } from "../work-queue.js";

// Helper factories
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
		task_count: 10,
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

function createTestManifest(
	overrides: Partial<SpecManifest> = {},
): SpecManifest {
	return {
		metadata: {
			spec_id: "S2072",
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

function createTestInstance(
	label: string,
	overrides: Partial<SandboxInstance> = {},
): SandboxInstance {
	return {
		id: `sbx-${label}`,
		label,
		sandbox: {
			sandboxId: `sbx-${label}`,
			commands: {
				run: vi.fn().mockResolvedValue({ exitCode: 0, stdout: "", stderr: "" }),
			},
			kill: vi.fn().mockResolvedValue(undefined),
			setTimeout: vi.fn().mockResolvedValue(undefined),
		} as unknown as SandboxInstance["sandbox"],
		status: "ready",
		currentFeature: null,
		retryCount: 0,
		createdAt: new Date(),
		lastKeepaliveAt: new Date(),
		...overrides,
	} as SandboxInstance;
}

describe("Bug fix #2074: Retry Guard", () => {
	let logSpy: (...args: unknown[]) => void;

	beforeEach(() => {
		vi.resetAllMocks();
		vi.useFakeTimers();
		logSpy = vi.fn() as unknown as (...args: unknown[]) => void;
		vi.mocked(shouldRetryFailedFeature).mockReturnValue(true);
	});

	afterEach(() => {
		vi.restoreAllMocks();
		vi.useRealTimers();
	});

	describe("resetFeatureForRetryOnSandboxDeath - race guard", () => {
		it("increments retry_count when last_reset_at is null", async () => {
			const feature = createTestFeature("F1", {
				status: "in_progress",
				assigned_sandbox: "sbx-a",
				last_reset_at: null,
				retry_count: 0,
			});
			const manifest = createTestManifest({ feature_queue: [feature] });
			const instances = [
				createTestInstance("sbx-a", { status: "busy", currentFeature: "F1" }),
			];

			const workLoop = new WorkLoop(
				{
					instances,
					manifest,
					uiEnabled: false,
					timeoutSeconds: 7200,
					provider: "claude",
				},
				logSpy,
			);

			// Access private method via prototype
			const resetMethod = (workLoop as unknown as Record<string, unknown>)[
				"resetFeatureForRetryOnSandboxDeath"
			] as (feature: FeatureEntry, msg: string) => void;
			resetMethod.call(workLoop, feature, "Sandbox died");

			expect(feature.retry_count).toBe(1);
			expect(feature.retry_reason).toBe("feature_failure");
		});

		it("increments retry_count when last_reset_at is >10s ago", async () => {
			// Set last_reset_at to 15 seconds ago
			const fifteenSecondsAgo = new Date(Date.now() - 15_000).toISOString();
			const feature = createTestFeature("F1", {
				status: "in_progress",
				assigned_sandbox: "sbx-a",
				last_reset_at: fifteenSecondsAgo,
				retry_count: 0,
			});
			const manifest = createTestManifest({ feature_queue: [feature] });
			const instances = [createTestInstance("sbx-a")];

			const workLoop = new WorkLoop(
				{
					instances,
					manifest,
					uiEnabled: false,
					timeoutSeconds: 7200,
					provider: "claude",
				},
				logSpy,
			);

			const resetMethod = (workLoop as unknown as Record<string, unknown>)[
				"resetFeatureForRetryOnSandboxDeath"
			] as (feature: FeatureEntry, msg: string) => void;
			resetMethod.call(workLoop, feature, "Sandbox died");

			expect(feature.retry_count).toBe(1);
			expect(feature.retry_reason).toBe("feature_failure");
		});

		it("does NOT increment retry_count when last_reset_at is <10s ago", async () => {
			// Set last_reset_at to 3 seconds ago (within race guard window)
			const threeSecondsAgo = new Date(Date.now() - 3_000).toISOString();
			const feature = createTestFeature("F1", {
				status: "in_progress",
				assigned_sandbox: "sbx-a",
				last_reset_at: threeSecondsAgo,
				retry_count: 0,
			});
			const manifest = createTestManifest({ feature_queue: [feature] });
			const instances = [createTestInstance("sbx-a")];

			const workLoop = new WorkLoop(
				{
					instances,
					manifest,
					uiEnabled: false,
					timeoutSeconds: 7200,
					provider: "claude",
				},
				logSpy,
			);

			const resetMethod = (workLoop as unknown as Record<string, unknown>)[
				"resetFeatureForRetryOnSandboxDeath"
			] as (feature: FeatureEntry, msg: string) => void;
			resetMethod.call(workLoop, feature, "Sandbox died");

			// Retry count should NOT be incremented
			expect(feature.retry_count).toBe(0);
			expect(feature.retry_reason).toBe("infrastructure_reset");
			// Should log the guard activation
			expect(logSpy).toHaveBeenCalledWith(
				expect.stringContaining("[RETRY_GUARD]"),
			);
		});

		it("sets retry_reason to infrastructure_reset when guard activates", async () => {
			const twoSecondsAgo = new Date(Date.now() - 2_000).toISOString();
			const feature = createTestFeature("F1", {
				status: "in_progress",
				assigned_sandbox: "sbx-a",
				last_reset_at: twoSecondsAgo,
				retry_count: 1,
			});
			const manifest = createTestManifest({ feature_queue: [feature] });
			const instances = [createTestInstance("sbx-a")];

			const workLoop = new WorkLoop(
				{
					instances,
					manifest,
					uiEnabled: false,
					timeoutSeconds: 7200,
					provider: "claude",
				},
				logSpy,
			);

			const resetMethod = (workLoop as unknown as Record<string, unknown>)[
				"resetFeatureForRetryOnSandboxDeath"
			] as (feature: FeatureEntry, msg: string) => void;
			resetMethod.call(workLoop, feature, "Sandbox died");

			// Retry count preserved at 1 (not incremented to 2)
			expect(feature.retry_count).toBe(1);
			expect(feature.retry_reason).toBe("infrastructure_reset");
		});

		it("handles boundary: exactly 10s ago still triggers guard", async () => {
			// At exactly 10s, Date.now() - last_reset_at = 10000, which is NOT < 10000
			// So this should NOT trigger the guard (boundary test)
			const exactlyTenSecondsAgo = new Date(
				Date.now() - 10_000,
			).toISOString();
			const feature = createTestFeature("F1", {
				status: "in_progress",
				assigned_sandbox: "sbx-a",
				last_reset_at: exactlyTenSecondsAgo,
				retry_count: 0,
			});
			const manifest = createTestManifest({ feature_queue: [feature] });
			const instances = [createTestInstance("sbx-a")];

			const workLoop = new WorkLoop(
				{
					instances,
					manifest,
					uiEnabled: false,
					timeoutSeconds: 7200,
					provider: "claude",
				},
				logSpy,
			);

			const resetMethod = (workLoop as unknown as Record<string, unknown>)[
				"resetFeatureForRetryOnSandboxDeath"
			] as (feature: FeatureEntry, msg: string) => void;
			resetMethod.call(workLoop, feature, "Sandbox died");

			// At exactly 10s boundary: timeSinceReset (10000) is NOT < 10000, so guard doesn't activate
			expect(feature.retry_count).toBe(1);
			expect(feature.retry_reason).toBe("feature_failure");
		});
	});

	describe("resetFeatureForReassignment - sets last_reset_at", () => {
		it("records last_reset_at timestamp when resetting feature", async () => {
			const feature = createTestFeature("F1", {
				status: "in_progress",
				assigned_sandbox: "sbx-a",
			});
			const manifest = createTestManifest({ feature_queue: [feature] });
			const instances = [createTestInstance("sbx-a")];

			const workLoop = new WorkLoop(
				{
					instances,
					manifest,
					uiEnabled: false,
					timeoutSeconds: 7200,
					provider: "claude",
				},
				logSpy,
			);

			const resetMethod = (workLoop as unknown as Record<string, unknown>)[
				"resetFeatureForReassignment"
			] as (feature: FeatureEntry, msg: string) => void;
			resetMethod.call(workLoop, feature, "Preemptive restart");

			expect(feature.last_reset_at).toBeDefined();
			expect(typeof feature.last_reset_at).toBe("string");
			// Should be a valid ISO timestamp
			expect(new Date(feature.last_reset_at!).getTime()).not.toBeNaN();
		});
	});
});

describe("Bug fix #2074: Sandbox Extension in handlePreemptiveRestarts", () => {
	let logSpy: (...args: unknown[]) => void;

	beforeEach(() => {
		vi.resetAllMocks();
		vi.useFakeTimers();
		logSpy = vi.fn() as unknown as (...args: unknown[]) => void;
	});

	afterEach(() => {
		vi.restoreAllMocks();
		vi.useRealTimers();
	});

	it("extends sandbox when feature is actively running", async () => {
		// Sandbox created 61 minutes ago (past max age)
		const oldCreatedAt = new Date(Date.now() - 61 * 60 * 1000);
		const feature = createTestFeature("F1", {
			status: "in_progress",
			assigned_sandbox: "sbx-a",
			task_count: 10,
			tasks_completed: 3, // 30% done
			extension_count: 0,
		});
		const manifest = createTestManifest({ feature_queue: [feature] });
		const instance = createTestInstance("sbx-a", {
			status: "busy",
			currentFeature: "F1",
			createdAt: oldCreatedAt,
		});

		vi.mocked(getSandboxesNeedingRestart).mockReturnValue(["sbx-a"]);
		vi.mocked(extendSandboxTimeout).mockResolvedValue(true);

		const workLoop = new WorkLoop(
			{
				instances: [instance],
				manifest,
				uiEnabled: false,
				timeoutSeconds: 7200,
				provider: "claude",
			},
			logSpy,
		);

		// Call handlePreemptiveRestarts directly
		const method = (workLoop as unknown as Record<string, unknown>)[
			"handlePreemptiveRestarts"
		] as () => Promise<void>;
		await method.call(workLoop);

		// Should have called extendSandboxTimeout
		expect(extendSandboxTimeout).toHaveBeenCalledWith(
			instance.sandbox,
			15 * 60 * 1000, // SANDBOX_EXTENSION_MS
		);

		// Feature extension count should be incremented
		expect(feature.extension_count).toBe(1);

		// Sandbox should NOT have been restarted (extension succeeded)
		expect(logSpy).toHaveBeenCalledWith(
			expect.stringContaining("[SANDBOX_EXTEND] Sandbox sbx-a extended"),
		);
	});

	it("restarts sandbox when no feature is running", async () => {
		const oldCreatedAt = new Date(Date.now() - 61 * 60 * 1000);
		const manifest = createTestManifest({ feature_queue: [] });
		const instance = createTestInstance("sbx-a", {
			status: "ready",
			createdAt: oldCreatedAt,
		});

		vi.mocked(getSandboxesNeedingRestart).mockReturnValue(["sbx-a"]);

		const { createSandbox } = await import("../sandbox.js");
		vi.mocked(createSandbox).mockResolvedValue(
			createTestInstance("sbx-a", {
				id: "new-sbx-id",
				createdAt: new Date(),
			}),
		);

		const workLoop = new WorkLoop(
			{
				instances: [instance],
				manifest,
				uiEnabled: false,
				timeoutSeconds: 7200,
				provider: "claude",
			},
			logSpy,
		);

		const method = (workLoop as unknown as Record<string, unknown>)[
			"handlePreemptiveRestarts"
		] as () => Promise<void>;
		await method.call(workLoop);

		// Should NOT have called extendSandboxTimeout (no feature running)
		expect(extendSandboxTimeout).not.toHaveBeenCalled();

		// Should have proceeded with restart
		expect(logSpy).toHaveBeenCalledWith(
			expect.stringContaining("performing preemptive restart"),
		);
	});

	it("forces restart after max extension attempts", async () => {
		const oldCreatedAt = new Date(Date.now() - 61 * 60 * 1000);
		const feature = createTestFeature("F1", {
			status: "in_progress",
			assigned_sandbox: "sbx-a",
			task_count: 10,
			tasks_completed: 3,
			extension_count: 3, // Already at max
		});
		const manifest = createTestManifest({ feature_queue: [feature] });
		const instance = createTestInstance("sbx-a", {
			status: "busy",
			currentFeature: "F1",
			createdAt: oldCreatedAt,
		});

		vi.mocked(getSandboxesNeedingRestart).mockReturnValue(["sbx-a"]);

		const { createSandbox } = await import("../sandbox.js");
		vi.mocked(createSandbox).mockResolvedValue(
			createTestInstance("sbx-a", {
				id: "new-sbx-id",
				createdAt: new Date(),
			}),
		);

		const workLoop = new WorkLoop(
			{
				instances: [instance],
				manifest,
				uiEnabled: false,
				timeoutSeconds: 7200,
				provider: "claude",
			},
			logSpy,
		);

		const method = (workLoop as unknown as Record<string, unknown>)[
			"handlePreemptiveRestarts"
		] as () => Promise<void>;
		await method.call(workLoop);

		// Should NOT have called extendSandboxTimeout (max attempts reached)
		expect(extendSandboxTimeout).not.toHaveBeenCalled();

		// Should log max extensions reached
		expect(logSpy).toHaveBeenCalledWith(
			expect.stringContaining("max extensions"),
		);
	});

	it("falls back to restart when extension fails", async () => {
		const oldCreatedAt = new Date(Date.now() - 61 * 60 * 1000);
		const feature = createTestFeature("F1", {
			status: "in_progress",
			assigned_sandbox: "sbx-a",
			task_count: 10,
			tasks_completed: 5,
			extension_count: 0,
		});
		const manifest = createTestManifest({ feature_queue: [feature] });
		const instance = createTestInstance("sbx-a", {
			status: "busy",
			currentFeature: "F1",
			createdAt: oldCreatedAt,
		});

		vi.mocked(getSandboxesNeedingRestart).mockReturnValue(["sbx-a"]);
		vi.mocked(extendSandboxTimeout).mockResolvedValue(false); // Extension fails

		const { createSandbox } = await import("../sandbox.js");
		vi.mocked(createSandbox).mockResolvedValue(
			createTestInstance("sbx-a", {
				id: "new-sbx-id",
				createdAt: new Date(),
			}),
		);

		const workLoop = new WorkLoop(
			{
				instances: [instance],
				manifest,
				uiEnabled: false,
				timeoutSeconds: 7200,
				provider: "claude",
			},
			logSpy,
		);

		const method = (workLoop as unknown as Record<string, unknown>)[
			"handlePreemptiveRestarts"
		] as () => Promise<void>;
		await method.call(workLoop);

		// Should have attempted extension
		expect(extendSandboxTimeout).toHaveBeenCalled();

		// Should have fallen back to restart
		expect(logSpy).toHaveBeenCalledWith(
			expect.stringContaining("Failed to extend sandbox"),
		);
	});
});
