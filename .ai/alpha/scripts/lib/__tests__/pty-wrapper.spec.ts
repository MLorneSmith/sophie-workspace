/**
 * PTY Timeout Wrapper Unit Tests
 *
 * Tests for the waitWithTimeout function which provides timeout-aware
 * PTY handling with progress file fallback recovery.
 *
 * Bug fix #1767: Dual-channel completion detection with timeout
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
	PROGRESS_FILE_STALE_THRESHOLD_MS,
	PTY_WAIT_TIMEOUT_MS,
} from "../../config/index.js";
import type { ProgressFileData } from "../progress-file.js";
import {
	PTYTimeoutError,
	ptyTelemetry,
	resetPtyTelemetry,
	waitWithTimeout,
	type PTYHandle,
} from "../pty-wrapper.js";

// ============================================================================
// Mock Setup
// ============================================================================

// Mock the progress-file module
vi.mock("../progress-file.js", () => ({
	readProgressFile: vi.fn(),
	isProgressFileStale: vi.fn(),
	isFeatureCompleted: vi.fn(),
}));

// Import mocked functions after vi.mock
import {
	readProgressFile,
	isProgressFileStale,
	isFeatureCompleted,
} from "../progress-file.js";

/**
 * Create a mock PTY handle with configurable behavior.
 */
function createMockPtyHandle(options: {
	waitResolveMs?: number;
	waitRejectMs?: number;
	waitRejectError?: Error;
	exitCode?: number;
}): PTYHandle {
	return {
		pid: 12345,
		wait: vi.fn().mockImplementation(async () => {
			if (options.waitRejectMs !== undefined) {
				await new Promise((resolve) =>
					setTimeout(resolve, options.waitRejectMs),
				);
				throw options.waitRejectError || new Error("PTY wait failed");
			}
			if (options.waitResolveMs !== undefined) {
				await new Promise((resolve) =>
					setTimeout(resolve, options.waitResolveMs),
				);
			}
			return {
				exitCode: options.exitCode ?? 0,
				stdout: "",
				stderr: "",
			};
		}),
	};
}

/**
 * Create a mock sandbox for progress file access.
 */
function createMockSandbox() {
	return {
		sandboxId: "test-sandbox-123",
		commands: {
			run: vi.fn().mockResolvedValue({ stdout: "{}" }),
		},
	} as unknown as Parameters<typeof waitWithTimeout>[1];
}

/**
 * Create mock progress file data.
 */
function createMockProgressData(
	overrides: Partial<ProgressFileData> = {},
): ProgressFileData {
	return {
		status: "in_progress",
		phase: "executing",
		completed_tasks: [],
		last_heartbeat: new Date().toISOString(),
		...overrides,
	};
}

// ============================================================================
// Tests
// ============================================================================

describe("pty-wrapper", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		resetPtyTelemetry();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe("waitWithTimeout - Normal Completion", () => {
		it("should complete normally when PTY finishes before timeout", async () => {
			const ptyHandle = createMockPtyHandle({ waitResolveMs: 10, exitCode: 0 });
			const sandbox = createMockSandbox();

			const result = await waitWithTimeout(
				ptyHandle,
				sandbox,
				5000, // 5 second timeout
			);

			expect(result.normalCompletion).toBe(true);
			expect(result.recoveredViaProgressFile).toBe(false);
			expect(result.exitCode).toBe(0);
			expect(ptyTelemetry.normalCompletions).toBe(1);
			expect(ptyTelemetry.timeouts).toBe(0);
		});

		it("should return non-zero exit code when PTY fails", async () => {
			const ptyHandle = createMockPtyHandle({ waitResolveMs: 10, exitCode: 1 });
			const sandbox = createMockSandbox();

			const result = await waitWithTimeout(ptyHandle, sandbox, 5000);

			expect(result.normalCompletion).toBe(true);
			expect(result.exitCode).toBe(1);
		});

		it("should track telemetry for normal completions", async () => {
			const ptyHandle = createMockPtyHandle({ waitResolveMs: 5 });
			const sandbox = createMockSandbox();

			await waitWithTimeout(ptyHandle, sandbox, 5000);

			expect(ptyTelemetry.totalWaits).toBe(1);
			expect(ptyTelemetry.normalCompletions).toBe(1);
			expect(ptyTelemetry.timeouts).toBe(0);
			expect(ptyTelemetry.recoveredViaProgressFile).toBe(0);
		});
	});

	describe("waitWithTimeout - Timeout with Progress File Recovery", () => {
		it("should recover when PTY times out but progress file shows completed", async () => {
			vi.useFakeTimers();

			const ptyHandle = createMockPtyHandle({});
			// Make wait() never resolve
			vi.mocked(ptyHandle.wait).mockImplementation(
				() => new Promise(() => {}), // Never resolves
			);

			const sandbox = createMockSandbox();
			const completedProgress = createMockProgressData({ status: "completed" });

			vi.mocked(readProgressFile).mockResolvedValue({
				success: true,
				data: completedProgress,
			});
			vi.mocked(isProgressFileStale).mockReturnValue(false);
			vi.mocked(isFeatureCompleted).mockReturnValue(true);

			// Start the wait with a short timeout
			const waitPromise = waitWithTimeout(
				ptyHandle,
				sandbox,
				100, // 100ms timeout
			);

			// Advance timers to trigger timeout
			await vi.advanceTimersByTimeAsync(100);

			// Advance past the recovery poll interval
			await vi.advanceTimersByTimeAsync(600);

			const result = await waitPromise;

			expect(result.normalCompletion).toBe(false);
			expect(result.recoveredViaProgressFile).toBe(true);
			expect(result.exitCode).toBe(0);
			expect(result.progressData).toEqual(completedProgress);
			expect(ptyTelemetry.recoveredViaProgressFile).toBe(1);
		});

		it("should return stillRunning=true when progress file shows in_progress with recent heartbeat", async () => {
			// Bug fix #1786: When heartbeat is recent, feature is actively working - don't throw
			vi.useFakeTimers();

			const ptyHandle = createMockPtyHandle({});
			vi.mocked(ptyHandle.wait).mockImplementation(() => new Promise(() => {}));

			const sandbox = createMockSandbox();
			const inProgressData = createMockProgressData({ status: "in_progress" });

			vi.mocked(readProgressFile).mockResolvedValue({
				success: true,
				data: inProgressData,
			});
			vi.mocked(isProgressFileStale).mockReturnValue(false); // Heartbeat is RECENT
			vi.mocked(isFeatureCompleted).mockReturnValue(false);

			const waitPromise = waitWithTimeout(ptyHandle, sandbox, 100);

			await vi.advanceTimersByTimeAsync(100);
			await vi.advanceTimersByTimeAsync(600);

			const result = await waitPromise;

			// Should return stillRunning=true instead of throwing
			expect(result.stillRunning).toBe(true);
			expect(result.normalCompletion).toBe(false);
			expect(result.recoveredViaProgressFile).toBe(false);
			expect(result.exitCode).toBe(-1); // Signal "still running"
			expect(result.progressData).toEqual(inProgressData);
			expect(ptyTelemetry.recoveryFailed).toBe(0); // No failure - feature is working
		});

		it("should throw PTYTimeoutError when progress file is stale", async () => {
			vi.useFakeTimers();

			const ptyHandle = createMockPtyHandle({});
			vi.mocked(ptyHandle.wait).mockImplementation(() => new Promise(() => {}));

			const sandbox = createMockSandbox();
			const staleProgress = createMockProgressData({
				status: "completed",
				last_heartbeat: new Date(
					Date.now() - PROGRESS_FILE_STALE_THRESHOLD_MS - 60000,
				).toISOString(),
			});

			vi.mocked(readProgressFile).mockResolvedValue({
				success: true,
				data: staleProgress,
			});
			vi.mocked(isProgressFileStale).mockReturnValue(true);
			vi.mocked(isFeatureCompleted).mockReturnValue(true);

			const waitPromise = waitWithTimeout(ptyHandle, sandbox, 100);
			// Prevent unhandled rejection warning by catching temporarily
			let caughtError: Error | null = null;
			waitPromise.catch((e) => {
				caughtError = e;
			});

			await vi.advanceTimersByTimeAsync(100);
			await vi.advanceTimersByTimeAsync(600);
			// Let the catch handler run
			await vi.runAllTimersAsync();

			expect(caughtError).toBeInstanceOf(PTYTimeoutError);
			expect(ptyTelemetry.recoveryFailed).toBe(1);
		});

		it("should throw PTYTimeoutError when progress file is unavailable", async () => {
			vi.useFakeTimers();

			const ptyHandle = createMockPtyHandle({});
			vi.mocked(ptyHandle.wait).mockImplementation(() => new Promise(() => {}));

			const sandbox = createMockSandbox();

			vi.mocked(readProgressFile).mockResolvedValue({
				success: false,
				data: null,
				error: "File not found",
			});

			const waitPromise = waitWithTimeout(ptyHandle, sandbox, 100);
			// Prevent unhandled rejection warning by catching temporarily
			let caughtError: Error | null = null;
			waitPromise.catch((e) => {
				caughtError = e;
			});

			await vi.advanceTimersByTimeAsync(100);
			await vi.advanceTimersByTimeAsync(600);
			// Let the catch handler run
			await vi.runAllTimersAsync();

			expect(caughtError).toBeInstanceOf(PTYTimeoutError);
			expect(ptyTelemetry.recoveryFailed).toBe(1);
		});
	});

	describe("waitWithTimeout - Error Handling", () => {
		it("should propagate non-timeout errors from PTY", async () => {
			const customError = new Error("Connection lost");
			const ptyHandle = createMockPtyHandle({
				waitRejectMs: 10,
				waitRejectError: customError,
			});
			const sandbox = createMockSandbox();

			await expect(waitWithTimeout(ptyHandle, sandbox, 5000)).rejects.toThrow(
				"Connection lost",
			);
		});

		it("should use default timeout when not specified", async () => {
			vi.useFakeTimers();

			const ptyHandle = createMockPtyHandle({});
			vi.mocked(ptyHandle.wait).mockImplementation(() => new Promise(() => {}));

			const sandbox = createMockSandbox();

			vi.mocked(readProgressFile).mockResolvedValue({
				success: false,
				data: null,
				error: "File not found",
			});

			// Don't pass timeout - should use PTY_WAIT_TIMEOUT_MS
			const waitPromise = waitWithTimeout(ptyHandle, sandbox);
			// Prevent unhandled rejection warning by catching temporarily
			let caughtError: Error | null = null;
			waitPromise.catch((e) => {
				caughtError = e;
			});

			// Advance to default timeout
			await vi.advanceTimersByTimeAsync(PTY_WAIT_TIMEOUT_MS);
			await vi.advanceTimersByTimeAsync(600);
			// Let the catch handler run
			await vi.runAllTimersAsync();

			expect(caughtError).toBeInstanceOf(PTYTimeoutError);
		});
	});

	describe("PTYTimeoutError", () => {
		it("should contain sandbox ID and progress state", () => {
			const progressState = createMockProgressData({ status: "in_progress" });
			const error = new PTYTimeoutError(
				"sandbox-123",
				progressState,
				30000,
				"Feature not completed",
			);

			expect(error.sandboxId).toBe("sandbox-123");
			expect(error.progressState).toEqual(progressState);
			expect(error.timeoutMs).toBe(30000);
			expect(error.message).toContain("sandbox-123");
			expect(error.message).toContain("Feature not completed");
		});

		it("should have PTYTimeoutError name", () => {
			const error = new PTYTimeoutError("sandbox", null, 1000, "test");
			expect(error.name).toBe("PTYTimeoutError");
		});

		it("should be instanceof Error", () => {
			const error = new PTYTimeoutError("sandbox", null, 1000, "test");
			expect(error).toBeInstanceOf(Error);
		});
	});

	describe("Telemetry", () => {
		it("resetPtyTelemetry should reset all counters", () => {
			// Set some values
			ptyTelemetry.totalWaits = 10;
			ptyTelemetry.normalCompletions = 8;
			ptyTelemetry.timeouts = 2;
			ptyTelemetry.recoveredViaProgressFile = 1;
			ptyTelemetry.recoveryFailed = 1;

			resetPtyTelemetry();

			expect(ptyTelemetry.totalWaits).toBe(0);
			expect(ptyTelemetry.normalCompletions).toBe(0);
			expect(ptyTelemetry.timeouts).toBe(0);
			expect(ptyTelemetry.recoveredViaProgressFile).toBe(0);
			expect(ptyTelemetry.recoveryFailed).toBe(0);
		});

		it("should increment totalWaits on each call", async () => {
			const sandbox = createMockSandbox();

			// Normal completion
			const normalHandle = createMockPtyHandle({ waitResolveMs: 5 });
			await waitWithTimeout(normalHandle, sandbox, 5000);

			expect(ptyTelemetry.totalWaits).toBe(1);
			expect(ptyTelemetry.normalCompletions).toBe(1);

			// Second call
			const normalHandle2 = createMockPtyHandle({ waitResolveMs: 5 });
			await waitWithTimeout(normalHandle2, sandbox, 5000);

			expect(ptyTelemetry.totalWaits).toBe(2);
			expect(ptyTelemetry.normalCompletions).toBe(2);
		});
	});
});
