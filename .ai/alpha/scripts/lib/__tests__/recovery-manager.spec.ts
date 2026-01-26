/**
 * Recovery Manager Unit Tests
 *
 * Tests for the RecoveryManager class which handles atomic recovery
 * of stuck features with guaranteed process cleanup.
 *
 * Bug fix #1786: Event-driven architecture refactor
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
	FeatureEntry,
	SandboxInstance,
	SpecManifest,
} from "../../types/index.js";
import {
	DEFAULT_RECOVERY_CONFIG,
	formatRecoveryResult,
	quickCleanup,
	RecoveryManager,
	type RecoveryResult,
} from "../recovery-manager.js";

// Mock the manifest save function
vi.mock("../manifest.js", () => ({
	saveManifest: vi.fn(),
}));

// Mock sandbox for testing
function createMockSandbox(
	options: {
		killSuccess?: boolean;
		processCount?: number;
		clearSuccess?: boolean;
	} = {},
) {
	const { killSuccess = true, processCount = 0, clearSuccess = true } = options;

	return {
		sandboxId: "test-sandbox",
		commands: {
			run: vi.fn().mockImplementation(async (cmd: string) => {
				if (cmd.includes("pkill")) {
					if (!killSuccess) {
						throw new Error("Kill failed");
					}
					return { stdout: "" };
				}
				if (cmd.includes("pgrep")) {
					return { stdout: String(processCount) };
				}
				if (cmd.includes("rm -f")) {
					if (!clearSuccess) {
						throw new Error("Clear failed");
					}
					return { stdout: "" };
				}
				return { stdout: "" };
			}),
		},
	} as unknown as Parameters<
		InstanceType<typeof RecoveryManager>["recoverFeature"]
	>[0];
}

function createMockSandboxInstance(
	overrides: Partial<SandboxInstance> = {},
): SandboxInstance {
	return {
		id: "sbx-1",
		label: "sbx-a",
		sandbox: {} as SandboxInstance["sandbox"],
		status: "busy",
		currentFeature: "F1",
		retryCount: 0,
		createdAt: new Date(),
		featureStartedAt: new Date(),
		lastProgressSeen: new Date(),
		lastHeartbeat: new Date(),
		outputLineCount: 100,
		hasReceivedOutput: true,
		...overrides,
	};
}

function createMockFeature(
	overrides: Partial<FeatureEntry> = {},
): FeatureEntry {
	return {
		id: "F1",
		initiative_id: "I1",
		title: "Test Feature",
		priority: 1,
		global_priority: 1,
		status: "in_progress",
		tasks_file: "/test/tasks.json",
		feature_dir: "/test/features/F1",
		task_count: 5,
		tasks_completed: 2,
		sequential_hours: 2,
		parallel_hours: 1,
		dependencies: [],
		github_issue: null,
		requires_database: false,
		database_task_count: 0,
		retry_count: 0,
		...overrides,
	};
}

function createMockManifest(features: FeatureEntry[]): SpecManifest {
	return {
		feature_queue: features,
		initiatives: [],
		progress: {
			features_completed: 0,
			features_total: features.length,
			tasks_completed: 0,
			tasks_total: 10,
		},
		sandbox: {
			branch_name: "test-branch",
		},
		metadata: {
			spec_id: "S1",
		},
	} as unknown as SpecManifest;
}

describe("recovery-manager", () => {
	let recoveryManager: RecoveryManager;

	beforeEach(() => {
		recoveryManager = new RecoveryManager();
		vi.clearAllMocks();
	});

	describe("RecoveryManager - Process Cleanup", () => {
		it("should kill all Claude processes", async () => {
			const sandbox = createMockSandbox();

			const result = await recoveryManager.killAllClaudeProcesses(sandbox);

			expect(result.success).toBe(true);
			expect(sandbox.commands.run).toHaveBeenCalledWith(
				expect.stringContaining("pkill"),
				expect.any(Object),
			);
		});

		it("should handle kill failure gracefully", async () => {
			const sandbox = createMockSandbox({ killSuccess: false });

			const result = await recoveryManager.killAllClaudeProcesses(sandbox);

			expect(result.success).toBe(false);
			expect(result.error).toBeDefined();
		});

		it("should wait for process termination", async () => {
			const sandbox = createMockSandbox({ processCount: 0 });

			const terminated =
				await recoveryManager.waitForProcessTermination(sandbox);

			expect(terminated).toBe(true);
		});

		it("should clear progress file", async () => {
			const sandbox = createMockSandbox();

			const cleared = await recoveryManager.clearProgressFile(sandbox);

			expect(cleared).toBe(true);
			expect(sandbox.commands.run).toHaveBeenCalledWith(
				expect.stringContaining("rm -f"),
				expect.any(Object),
			);
		});

		it("should handle clear failure gracefully", async () => {
			const sandbox = createMockSandbox({ clearSuccess: false });

			const cleared = await recoveryManager.clearProgressFile(sandbox);

			expect(cleared).toBe(false);
		});
	});

	describe("RecoveryManager - Feature Recovery", () => {
		it("should queue feature for retry when under max retries", async () => {
			const sandbox = createMockSandbox();
			const sandboxInstance = createMockSandboxInstance();
			const feature = createMockFeature({ retry_count: 0 });
			const manifest = createMockManifest([feature]);

			const result = await recoveryManager.recoverFeature(
				sandbox,
				sandboxInstance,
				feature,
				manifest,
			);

			expect(result.success).toBe(true);
			expect(result.willRetry).toBe(true);
			expect(result.retryCount).toBe(1);
			expect(feature.status).toBe("pending");
			expect(feature.retry_count).toBe(1);
			expect(sandboxInstance.status).toBe("ready");
			expect(sandboxInstance.currentFeature).toBeNull();
		});

		it("should mark feature as failed when max retries exceeded", async () => {
			const sandbox = createMockSandbox();
			const sandboxInstance = createMockSandboxInstance();
			const feature = createMockFeature({ retry_count: 2 }); // Already at 2
			const manifest = createMockManifest([feature]);

			const result = await recoveryManager.recoverFeature(
				sandbox,
				sandboxInstance,
				feature,
				manifest,
			);

			expect(result.success).toBe(true);
			expect(result.willRetry).toBe(false);
			expect(result.reason).toBe("max_retries_exceeded");
			expect(feature.status).toBe("failed");
			expect(feature.error).toContain("Max retries");
		});

		it("should reset sandbox instance state on recovery", async () => {
			const sandbox = createMockSandbox();
			const sandboxInstance = createMockSandboxInstance({
				outputLineCount: 500,
				hasReceivedOutput: true,
				featureStartedAt: new Date(),
			});
			const feature = createMockFeature();
			const manifest = createMockManifest([feature]);

			await recoveryManager.recoverFeature(
				sandbox,
				sandboxInstance,
				feature,
				manifest,
			);

			expect(sandboxInstance.outputLineCount).toBe(0);
			expect(sandboxInstance.hasReceivedOutput).toBe(false);
			expect(sandboxInstance.featureStartedAt).toBeUndefined();
			expect(sandboxInstance.lastProgressSeen).toBeUndefined();
			expect(sandboxInstance.lastHeartbeat).toBeUndefined();
		});

		it("should track recovery telemetry", async () => {
			const sandbox = createMockSandbox();
			const sandboxInstance = createMockSandboxInstance();
			const feature = createMockFeature();
			const manifest = createMockManifest([feature]);

			await recoveryManager.recoverFeature(
				sandbox,
				sandboxInstance,
				feature,
				manifest,
			);

			const telemetry = recoveryManager.getTelemetry();
			expect(telemetry.totalRecoveries).toBe(1);
			expect(telemetry.successfulRecoveries).toBe(1);
			expect(telemetry.retriesTriggered).toBe(1);
		});

		it("should track failed recovery telemetry", async () => {
			const sandbox = createMockSandbox();
			const sandboxInstance = createMockSandboxInstance();
			const feature = createMockFeature({ retry_count: 2 });
			const manifest = createMockManifest([feature]);

			await recoveryManager.recoverFeature(
				sandbox,
				sandboxInstance,
				feature,
				manifest,
			);

			const telemetry = recoveryManager.getTelemetry();
			expect(telemetry.totalRecoveries).toBe(1);
			expect(telemetry.failedRecoveries).toBe(1);
			expect(telemetry.featuresMarkedFailed).toBe(1);
		});
	});

	describe("RecoveryManager - Configuration", () => {
		it("should use default configuration", () => {
			const config = recoveryManager.getConfig();
			expect(config.killTimeoutMs).toBe(DEFAULT_RECOVERY_CONFIG.killTimeoutMs);
			expect(config.maxRetries).toBe(DEFAULT_RECOVERY_CONFIG.maxRetries);
		});

		it("should allow custom configuration", () => {
			const customManager = new RecoveryManager({
				maxRetries: 5,
				killTimeoutMs: 5000,
			});
			const config = customManager.getConfig();
			expect(config.maxRetries).toBe(5);
			expect(config.killTimeoutMs).toBe(5000);
		});

		it("should allow updating configuration", () => {
			recoveryManager.updateConfig({ maxRetries: 10 });
			expect(recoveryManager.getConfig().maxRetries).toBe(10);
		});
	});

	describe("RecoveryManager - Telemetry", () => {
		it("should reset telemetry", async () => {
			const sandbox = createMockSandbox();
			const sandboxInstance = createMockSandboxInstance();
			const feature = createMockFeature();
			const manifest = createMockManifest([feature]);

			await recoveryManager.recoverFeature(
				sandbox,
				sandboxInstance,
				feature,
				manifest,
			);

			expect(recoveryManager.getTelemetry().totalRecoveries).toBe(1);

			recoveryManager.resetTelemetry();

			expect(recoveryManager.getTelemetry().totalRecoveries).toBe(0);
		});
	});

	describe("formatRecoveryResult", () => {
		it("should format retry result", () => {
			const result: RecoveryResult = {
				success: true,
				reason: "queued_for_retry",
				willRetry: true,
				retryCount: 1,
				processesKilled: true,
				progressCleared: true,
			};

			const formatted = formatRecoveryResult("F1", result);

			expect(formatted).toContain("🔄");
			expect(formatted).toContain("F1");
			expect(formatted).toContain("will retry");
			expect(formatted).toContain("attempt 2");
		});

		it("should format max retries exceeded result", () => {
			const result: RecoveryResult = {
				success: true,
				reason: "max_retries_exceeded",
				willRetry: false,
				retryCount: 3,
				processesKilled: true,
				progressCleared: true,
			};

			const formatted = formatRecoveryResult("F1", result);

			expect(formatted).toContain("❌");
			expect(formatted).toContain("FAILED");
			expect(formatted).toContain("max retries");
		});

		it("should format failed recovery result", () => {
			const result: RecoveryResult = {
				success: false,
				reason: "kill_failed",
				willRetry: false,
				retryCount: 0,
				processesKilled: false,
				progressCleared: false,
				error: "Process kill timed out",
			};

			const formatted = formatRecoveryResult("F1", result);

			expect(formatted).toContain("⚠️");
			expect(formatted).toContain("failed");
		});
	});

	describe("quickCleanup", () => {
		it("should perform quick cleanup", async () => {
			const sandbox = createMockSandbox();

			const success = await quickCleanup(sandbox);

			expect(success).toBe(true);
			// Should have called both kill and clear
			expect(sandbox.commands.run).toHaveBeenCalledWith(
				expect.stringContaining("pkill"),
				expect.any(Object),
			);
			expect(sandbox.commands.run).toHaveBeenCalledWith(
				expect.stringContaining("rm -f"),
				expect.any(Object),
			);
		});
	});
});
