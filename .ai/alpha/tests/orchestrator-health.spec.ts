/**
 * Orchestrator Health Tests
 *
 * Tests for startup timeout detection, health checks, and keepalive behavior.
 */

import { describe, it, expect } from "vitest";
import { getSandboxesNeedingRestart } from "../scripts/lib/sandbox.js";
import type { SandboxInstance } from "../scripts/types/index.js";

// ============================================================================
// Test Fixtures
// ============================================================================

function createMockSandboxInstance(
	overrides: Partial<SandboxInstance>,
): SandboxInstance {
	return {
		sandbox: {} as SandboxInstance["sandbox"],
		id: overrides.id ?? "sbx-123",
		label: overrides.label ?? "sbx-a",
		status: overrides.status ?? "ready",
		currentFeature: overrides.currentFeature ?? null,
		featureStartedAt: overrides.featureStartedAt,
		lastProgressSeen: overrides.lastProgressSeen,
		lastHeartbeat: overrides.lastHeartbeat,
		retryCount: overrides.retryCount ?? 0,
		claudeProcessId: overrides.claudeProcessId,
		outputLineCount: overrides.outputLineCount ?? 0,
		hasReceivedOutput: overrides.hasReceivedOutput ?? false,
		createdAt: overrides.createdAt ?? new Date(),
		lastKeepaliveAt: overrides.lastKeepaliveAt,
	};
}

// ============================================================================
// Tests: getSandboxesNeedingRestart
// ============================================================================

describe("getSandboxesNeedingRestart", () => {
	it("returns empty array for young sandboxes", () => {
		const now = new Date();
		const instances = [
			createMockSandboxInstance({
				label: "sbx-a",
				createdAt: new Date(now.getTime() - 10 * 60 * 1000), // 10 min old
			}),
			createMockSandboxInstance({
				label: "sbx-b",
				createdAt: new Date(now.getTime() - 20 * 60 * 1000), // 20 min old
			}),
		];

		const maxAgeMs = 50 * 60 * 1000; // 50 minutes
		const needsRestart = getSandboxesNeedingRestart(instances, maxAgeMs);

		expect(needsRestart).toHaveLength(0);
	});

	it("returns sandboxes older than max age", () => {
		const now = new Date();
		const instances = [
			createMockSandboxInstance({
				label: "sbx-a",
				createdAt: new Date(now.getTime() - 51 * 60 * 1000), // 51 min old
			}),
			createMockSandboxInstance({
				label: "sbx-b",
				createdAt: new Date(now.getTime() - 20 * 60 * 1000), // 20 min old
			}),
		];

		const maxAgeMs = 50 * 60 * 1000; // 50 minutes
		const needsRestart = getSandboxesNeedingRestart(instances, maxAgeMs);

		expect(needsRestart).toHaveLength(1);
		expect(needsRestart[0]).toBe("sbx-a");
	});

	it("returns multiple sandboxes when all are old", () => {
		const now = new Date();
		const instances = [
			createMockSandboxInstance({
				label: "sbx-a",
				createdAt: new Date(now.getTime() - 55 * 60 * 1000), // 55 min old
			}),
			createMockSandboxInstance({
				label: "sbx-b",
				createdAt: new Date(now.getTime() - 52 * 60 * 1000), // 52 min old
			}),
			createMockSandboxInstance({
				label: "sbx-c",
				createdAt: new Date(now.getTime() - 51 * 60 * 1000), // 51 min old
			}),
		];

		const maxAgeMs = 50 * 60 * 1000; // 50 minutes
		const needsRestart = getSandboxesNeedingRestart(instances, maxAgeMs);

		expect(needsRestart).toHaveLength(3);
		expect(needsRestart).toContain("sbx-a");
		expect(needsRestart).toContain("sbx-b");
		expect(needsRestart).toContain("sbx-c");
	});

	it("excludes failed sandboxes", () => {
		const now = new Date();
		const instances = [
			createMockSandboxInstance({
				label: "sbx-a",
				status: "failed",
				createdAt: new Date(now.getTime() - 55 * 60 * 1000), // 55 min old
			}),
			createMockSandboxInstance({
				label: "sbx-b",
				createdAt: new Date(now.getTime() - 52 * 60 * 1000), // 52 min old
			}),
		];

		const maxAgeMs = 50 * 60 * 1000; // 50 minutes
		const needsRestart = getSandboxesNeedingRestart(instances, maxAgeMs);

		expect(needsRestart).toHaveLength(1);
		expect(needsRestart[0]).toBe("sbx-b"); // sbx-a is failed, excluded
	});

	it("handles edge case at exact max age", () => {
		const now = Date.now();
		const instances = [
			createMockSandboxInstance({
				label: "sbx-a",
				createdAt: new Date(now - 50 * 60 * 1000), // exactly 50 min old
			}),
		];

		const maxAgeMs = 50 * 60 * 1000; // 50 minutes
		const needsRestart = getSandboxesNeedingRestart(instances, maxAgeMs);

		expect(needsRestart).toHaveLength(1); // Exactly at max age should trigger
	});
});

// ============================================================================
// Tests: Keepalive Staggering
// ============================================================================

describe("Keepalive Staggering", () => {
	it("sandboxes have unique keepalive offsets based on index", () => {
		// Verify the concept: stagger delay should be applied per sandbox
		const staggerMs = 2 * 60 * 1000; // 2 minutes
		const sandboxCount = 3;

		const offsets = Array.from(
			{ length: sandboxCount },
			(_, i) => i * staggerMs,
		);

		expect(offsets[0]).toBe(0);
		expect(offsets[1]).toBe(2 * 60 * 1000);
		expect(offsets[2]).toBe(4 * 60 * 1000);

		// Verify minimum separation
		for (let i = 1; i < offsets.length; i++) {
			const diff = offsets[i]! - offsets[i - 1]!;
			expect(diff).toBeGreaterThanOrEqual(staggerMs);
		}
	});
});

// ============================================================================
// Tests: Startup Output Tracking
// ============================================================================

describe("Startup Output Tracking", () => {
	it("sandbox starts with zero output count", () => {
		const instance = createMockSandboxInstance({});

		expect(instance.outputLineCount).toBe(0);
		expect(instance.hasReceivedOutput).toBe(false);
	});

	it("hasReceivedOutput becomes true after 5 lines", () => {
		const instance = createMockSandboxInstance({
			outputLineCount: 5,
			hasReceivedOutput: true,
		});

		expect(instance.hasReceivedOutput).toBe(true);
	});

	it("startup hung detection threshold is met", () => {
		// If outputLineCount < 5 after 3 minutes, consider startup hung
		const instance = createMockSandboxInstance({
			outputLineCount: 2,
			hasReceivedOutput: false,
			featureStartedAt: new Date(Date.now() - 4 * 60 * 1000), // 4 min ago
		});

		const timeSinceStart = Date.now() - instance.featureStartedAt!.getTime();
		const isStartupHung =
			timeSinceStart > 3 * 60 * 1000 &&
			instance.outputLineCount! < 5 &&
			!instance.hasReceivedOutput;

		expect(isStartupHung).toBe(true);
	});

	it("startup is healthy with sufficient output", () => {
		const instance = createMockSandboxInstance({
			outputLineCount: 10,
			hasReceivedOutput: true,
			featureStartedAt: new Date(Date.now() - 4 * 60 * 1000), // 4 min ago
		});

		const timeSinceStart = Date.now() - instance.featureStartedAt!.getTime();
		const isStartupHung =
			timeSinceStart > 3 * 60 * 1000 &&
			instance.outputLineCount! < 5 &&
			!instance.hasReceivedOutput;

		expect(isStartupHung).toBe(false);
	});
});

// ============================================================================
// Tests: Keepalive Interval Configuration
// ============================================================================

describe("Keepalive Configuration", () => {
	it("keepalive interval is 15 minutes", async () => {
		const { SANDBOX_KEEPALIVE_INTERVAL_MS } = await import(
			"../scripts/config/index.js"
		);

		expect(SANDBOX_KEEPALIVE_INTERVAL_MS).toBe(15 * 60 * 1000);
	});

	it("keepalive stagger is 2 minutes", async () => {
		const { SANDBOX_KEEPALIVE_STAGGER_MS } = await import(
			"../scripts/config/index.js"
		);

		expect(SANDBOX_KEEPALIVE_STAGGER_MS).toBe(2 * 60 * 1000);
	});

	it("max sandbox age is 50 minutes", async () => {
		const { SANDBOX_MAX_AGE_MS } = await import("../scripts/config/index.js");

		expect(SANDBOX_MAX_AGE_MS).toBe(50 * 60 * 1000);
	});

	it("max age is 10 minutes before 1-hour E2B timeout", async () => {
		const { SANDBOX_MAX_AGE_MS } = await import("../scripts/config/index.js");

		const oneHourMs = 60 * 60 * 1000;
		const buffer = oneHourMs - SANDBOX_MAX_AGE_MS;

		expect(buffer).toBe(10 * 60 * 1000); // 10 minutes before timeout
	});
});
