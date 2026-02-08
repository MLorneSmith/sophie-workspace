/**
 * Heartbeat Monitor Unit Tests
 *
 * Tests for the HeartbeatMonitor class which is the single source of truth
 * for feature health monitoring.
 *
 * Bug fix #1786: Event-driven architecture refactor
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
	DEFAULT_HEARTBEAT_CONFIG,
	formatHeartbeatStatus,
	HeartbeatMonitor,
	type HeartbeatStatus,
} from "../heartbeat-monitor.js";

// Mock sandbox for testing
function createMockSandbox(progressFileContent: string | null) {
	return {
		sandboxId: "test-sandbox",
		commands: {
			run: vi.fn().mockResolvedValue({
				stdout: progressFileContent ?? "",
			}),
		},
	} as unknown as Parameters<
		InstanceType<typeof HeartbeatMonitor>["checkHeartbeat"]
	>[0];
}

describe("heartbeat-monitor", () => {
	let monitor: HeartbeatMonitor;

	beforeEach(() => {
		monitor = new HeartbeatMonitor();
		vi.useFakeTimers();
	});

	describe("HeartbeatMonitor - Feature Registration", () => {
		it("should register feature start time", () => {
			monitor.registerFeatureStart("F1");
			expect(monitor.getStaleCount("F1")).toBe(0);
		});

		it("should unregister feature", () => {
			monitor.registerFeatureStart("F1");
			monitor.unregisterFeature("F1");
			expect(monitor.getStaleCount("F1")).toBe(0);
		});

		it("should reset stale count", async () => {
			monitor.registerFeatureStart("F1");
			// Manually set stale count by checking an unavailable progress file
			const sandbox = createMockSandbox(null);
			// Skip startup grace period
			vi.advanceTimersByTime(60000);
			await monitor.checkHeartbeat(sandbox, "F1");

			expect(monitor.getStaleCount("F1")).toBeGreaterThan(0);
			monitor.resetStaleCount("F1");
			expect(monitor.getStaleCount("F1")).toBe(0);
		});

		it("should clear all tracking state", () => {
			monitor.registerFeatureStart("F1");
			monitor.registerFeatureStart("F2");
			monitor.clear();
			expect(monitor.getStaleCount("F1")).toBe(0);
			expect(monitor.getStaleCount("F2")).toBe(0);
		});
	});

	describe("HeartbeatMonitor - Heartbeat Checking", () => {
		it("should return startup status within grace period", async () => {
			monitor.registerFeatureStart("F1");
			const sandbox = createMockSandbox(null); // No progress file

			const status = await monitor.checkHeartbeat(sandbox, "F1");

			expect(status.status).toBe("startup");
			expect(status.needsRecovery).toBe(false);
		});

		it("should return unavailable status after grace period with no progress file", async () => {
			monitor.registerFeatureStart("F1");
			const sandbox = createMockSandbox(null);

			// Skip past startup grace period
			vi.advanceTimersByTime(60000);

			const status = await monitor.checkHeartbeat(sandbox, "F1");

			expect(status.status).toBe("unavailable");
			expect(status.reason).toContain("missing");
		});

		it("should return completed status when progress file shows completed", async () => {
			monitor.registerFeatureStart("F1");
			const progressData = JSON.stringify({
				status: "completed",
				completed_tasks: ["task1", "task2"],
				total_tasks: 2,
				last_heartbeat: new Date().toISOString(),
			});
			const sandbox = createMockSandbox(progressData);

			const status = await monitor.checkHeartbeat(sandbox, "F1");

			expect(status.status).toBe("completed");
			expect(status.tasksCompleted).toBe(2);
			expect(status.needsRecovery).toBe(false);
		});

		it("should return failed status when progress file shows failed", async () => {
			monitor.registerFeatureStart("F1");
			const progressData = JSON.stringify({
				status: "failed",
				completed_tasks: ["task1"],
				last_heartbeat: new Date().toISOString(),
			});
			const sandbox = createMockSandbox(progressData);

			const status = await monitor.checkHeartbeat(sandbox, "F1");

			expect(status.status).toBe("failed");
			expect(status.needsRecovery).toBe(false);
		});

		it("should return blocked status when progress file shows blocked", async () => {
			monitor.registerFeatureStart("F1");
			const progressData = JSON.stringify({
				status: "blocked",
				completed_tasks: [],
				last_heartbeat: new Date().toISOString(),
			});
			const sandbox = createMockSandbox(progressData);

			const status = await monitor.checkHeartbeat(sandbox, "F1");

			expect(status.status).toBe("blocked");
			expect(status.needsRecovery).toBe(false);
		});

		it("should return healthy status with recent heartbeat", async () => {
			monitor.registerFeatureStart("F1");
			const progressData = JSON.stringify({
				status: "in_progress",
				completed_tasks: ["task1"],
				total_tasks: 3,
				last_heartbeat: new Date().toISOString(),
			});
			const sandbox = createMockSandbox(progressData);

			const status = await monitor.checkHeartbeat(sandbox, "F1");

			expect(status.status).toBe("healthy");
			expect(status.tasksCompleted).toBe(1);
			expect(status.totalTasks).toBe(3);
			expect(status.needsRecovery).toBe(false);
			expect(status.staleCount).toBe(0);
		});

		it("should return warning status when heartbeat is getting old", async () => {
			monitor.registerFeatureStart("F1");
			// Heartbeat from 3 minutes ago (50% of 5 min threshold)
			const threeMinAgo = new Date(Date.now() - 3 * 60 * 1000);
			const progressData = JSON.stringify({
				status: "in_progress",
				completed_tasks: [],
				last_heartbeat: threeMinAgo.toISOString(),
			});
			const sandbox = createMockSandbox(progressData);

			const status = await monitor.checkHeartbeat(sandbox, "F1");

			expect(status.status).toBe("warning");
			expect(status.needsRecovery).toBe(false);
		});

		it("should return stale status when heartbeat is too old", async () => {
			monitor.registerFeatureStart("F1");
			// Heartbeat from 6 minutes ago (past 5 min threshold)
			const sixMinAgo = new Date(Date.now() - 6 * 60 * 1000);
			const progressData = JSON.stringify({
				status: "in_progress",
				completed_tasks: [],
				last_heartbeat: sixMinAgo.toISOString(),
			});
			const sandbox = createMockSandbox(progressData);

			const status = await monitor.checkHeartbeat(sandbox, "F1");

			expect(status.status).toBe("stale");
			expect(status.staleCount).toBe(1);
		});

		it("should trigger recovery after stale count threshold", async () => {
			monitor.registerFeatureStart("F1");
			const sixMinAgo = new Date(Date.now() - 6 * 60 * 1000);
			const progressData = JSON.stringify({
				status: "in_progress",
				completed_tasks: [],
				last_heartbeat: sixMinAgo.toISOString(),
			});
			const sandbox = createMockSandbox(progressData);

			// Check multiple times to exceed threshold
			await monitor.checkHeartbeat(sandbox, "F1"); // staleCount = 1
			await monitor.checkHeartbeat(sandbox, "F1"); // staleCount = 2
			const status = await monitor.checkHeartbeat(sandbox, "F1"); // staleCount = 3

			expect(status.status).toBe("stale");
			expect(status.staleCount).toBe(3);
			expect(status.needsRecovery).toBe(true);
		});

		it("should reset stale count on healthy heartbeat", async () => {
			monitor.registerFeatureStart("F1");

			// First, get stale
			const sixMinAgo = new Date(Date.now() - 6 * 60 * 1000);
			const staleData = JSON.stringify({
				status: "in_progress",
				completed_tasks: [],
				last_heartbeat: sixMinAgo.toISOString(),
			});
			const staleSandbox = createMockSandbox(staleData);
			await monitor.checkHeartbeat(staleSandbox, "F1");
			expect(monitor.getStaleCount("F1")).toBe(1);

			// Then, get healthy heartbeat
			const recentData = JSON.stringify({
				status: "in_progress",
				completed_tasks: [],
				last_heartbeat: new Date().toISOString(),
			});
			const healthySandbox = createMockSandbox(recentData);
			await monitor.checkHeartbeat(healthySandbox, "F1");

			expect(monitor.getStaleCount("F1")).toBe(0);
		});
	});

	describe("HeartbeatMonitor - Helper Methods", () => {
		it("isHealthy should return true for healthy, startup, and warning", () => {
			expect(monitor.isHealthy({ status: "healthy" } as HeartbeatStatus)).toBe(
				true,
			);
			expect(monitor.isHealthy({ status: "startup" } as HeartbeatStatus)).toBe(
				true,
			);
			expect(monitor.isHealthy({ status: "warning" } as HeartbeatStatus)).toBe(
				true,
			);
			expect(monitor.isHealthy({ status: "stale" } as HeartbeatStatus)).toBe(
				false,
			);
		});

		it("isDone should return true for completed, failed, and blocked", () => {
			expect(monitor.isDone({ status: "completed" } as HeartbeatStatus)).toBe(
				true,
			);
			expect(monitor.isDone({ status: "failed" } as HeartbeatStatus)).toBe(
				true,
			);
			expect(monitor.isDone({ status: "blocked" } as HeartbeatStatus)).toBe(
				true,
			);
			expect(monitor.isDone({ status: "healthy" } as HeartbeatStatus)).toBe(
				false,
			);
		});

		it("shouldRecover should check needsRecovery flag", () => {
			expect(
				monitor.shouldRecover({ needsRecovery: true } as HeartbeatStatus),
			).toBe(true);
			expect(
				monitor.shouldRecover({ needsRecovery: false } as HeartbeatStatus),
			).toBe(false);
		});
	});

	describe("HeartbeatMonitor - Configuration", () => {
		it("should use default configuration", () => {
			const config = monitor.getConfig();
			expect(config.checkIntervalMs).toBe(
				DEFAULT_HEARTBEAT_CONFIG.checkIntervalMs,
			);
			expect(config.staleThresholdMs).toBe(
				DEFAULT_HEARTBEAT_CONFIG.staleThresholdMs,
			);
		});

		it("should allow custom configuration", () => {
			const customMonitor = new HeartbeatMonitor({
				checkIntervalMs: 1000,
				staleThresholdMs: 30000,
			});
			const config = customMonitor.getConfig();
			expect(config.checkIntervalMs).toBe(1000);
			expect(config.staleThresholdMs).toBe(30000);
		});

		it("should allow updating configuration", () => {
			monitor.updateConfig({ checkIntervalMs: 2000 });
			expect(monitor.getConfig().checkIntervalMs).toBe(2000);
		});
	});

	describe("formatHeartbeatStatus", () => {
		it("should format healthy status", () => {
			const status: HeartbeatStatus = {
				status: "healthy",
				reason: "Heartbeat is 5s old",
				heartbeatAgeMs: 5000,
				tasksCompleted: 2,
				totalTasks: 5,
				needsRecovery: false,
				staleCount: 0,
			};

			const formatted = formatHeartbeatStatus("F1", status);

			expect(formatted).toContain("💓");
			expect(formatted).toContain("F1");
			expect(formatted).toContain("HEALTHY");
			expect(formatted).toContain("2/5");
		});

		it("should format stale status", () => {
			const status: HeartbeatStatus = {
				status: "stale",
				reason: "Heartbeat is 360s old",
				heartbeatAgeMs: 360000,
				tasksCompleted: 1,
				needsRecovery: true,
				staleCount: 3,
			};

			const formatted = formatHeartbeatStatus("F1", status);

			expect(formatted).toContain("💀");
			expect(formatted).toContain("STALE");
		});

		it("should format completed status", () => {
			const status: HeartbeatStatus = {
				status: "completed",
				reason: "Feature completed",
				heartbeatAgeMs: null,
				tasksCompleted: 5,
				totalTasks: 5,
				needsRecovery: false,
				staleCount: 0,
			};

			const formatted = formatHeartbeatStatus("F1", status);

			expect(formatted).toContain("✅");
			expect(formatted).toContain("COMPLETED");
			expect(formatted).toContain("5/5");
		});
	});
});
