/**
 * Unit tests for the startup monitoring module.
 *
 * Tests cover:
 * - Startup hang detection logic
 * - Retry delay calculations
 * - Output tracking
 * - Log formatting
 */

import { describe, expect, it } from "vitest";
import {
	checkStartupStatus,
	createStartupOutputTracker,
	DEFAULT_STARTUP_CONFIG,
	detectStartupHang,
	formatStartupAttemptLog,
	formatStartupFailureLog,
	formatStartupSuccessLog,
	getElapsedTime,
	getRetryDelay,
	shouldRetry,
	updateOutputTracker,
} from "../startup-monitor.js";

describe("startup-monitor", () => {
	describe("detectStartupHang", () => {
		it("should return success when within timeout period", () => {
			const result = detectStartupHang(
				0, // outputLineCount
				0, // outputByteCount
				30 * 1000, // 30 seconds - within timeout
				60 * 1000, // 60 second timeout
			);

			expect(result.success).toBe(true);
			expect(result.error).toBeUndefined();
		});

		it("should return success when enough output lines received", () => {
			const result = detectStartupHang(
				10, // outputLineCount - more than minimum
				50, // outputByteCount
				120 * 1000, // 2 minutes - past timeout
				60 * 1000, // 60 second timeout
			);

			expect(result.success).toBe(true);
			expect(result.outputLines).toBe(10);
		});

		it("should return success when enough output bytes received", () => {
			const result = detectStartupHang(
				2, // outputLineCount - less than minimum
				150, // outputByteCount - more than minimum
				120 * 1000, // 2 minutes - past timeout
				60 * 1000, // 60 second timeout
			);

			expect(result.success).toBe(true);
			expect(result.outputBytes).toBe(150);
		});

		it("should detect hang when no meaningful output after timeout", () => {
			const result = detectStartupHang(
				2, // outputLineCount - less than minimum
				50, // outputByteCount - less than minimum
				120 * 1000, // 2 minutes - past timeout
				60 * 1000, // 60 second timeout
			);

			expect(result.success).toBe(false);
			expect(result.error).toBeDefined();
			expect(result.error).toContain("Startup hung");
		});

		it("should include metrics in result", () => {
			const result = detectStartupHang(5, 100, 30000, 60000);

			expect(result.outputLines).toBe(5);
			expect(result.outputBytes).toBe(100);
			expect(result.elapsedMs).toBe(30000);
		});
	});

	describe("getRetryDelay", () => {
		const defaultDelays = [5000, 10000, 30000];

		it("should return first delay for attempt 1", () => {
			const delay = getRetryDelay(1, defaultDelays);
			expect(delay).toBe(5000);
		});

		it("should return second delay for attempt 2", () => {
			const delay = getRetryDelay(2, defaultDelays);
			expect(delay).toBe(10000);
		});

		it("should return third delay for attempt 3", () => {
			const delay = getRetryDelay(3, defaultDelays);
			expect(delay).toBe(30000);
		});

		it("should return null when max retries exceeded", () => {
			const delay = getRetryDelay(4, defaultDelays);
			expect(delay).toBeNull();
		});

		it("should return null for empty delay array", () => {
			const delay = getRetryDelay(1, []);
			expect(delay).toBeNull();
		});
	});

	describe("shouldRetry", () => {
		it("should return true when attempts under max", () => {
			expect(shouldRetry(1, 3)).toBe(true);
			expect(shouldRetry(2, 3)).toBe(true);
			expect(shouldRetry(3, 3)).toBe(true);
		});

		it("should return false when attempts exceed max", () => {
			expect(shouldRetry(4, 3)).toBe(false);
			expect(shouldRetry(5, 3)).toBe(false);
		});
	});

	describe("formatStartupAttemptLog", () => {
		it("should format first attempt log", () => {
			const log = formatStartupAttemptLog(1, 3, "sbx-a");
			expect(log).toContain("[STARTUP_ATTEMPT_1]");
			expect(log).toContain("sbx-a");
			expect(log).toContain("attempt 1/4");
		});

		it("should format retry attempt log with delay", () => {
			const log = formatStartupAttemptLog(2, 3, "sbx-b", 5000);
			expect(log).toContain("[STARTUP_ATTEMPT_2]");
			expect(log).toContain("sbx-b");
			expect(log).toContain("Retrying");
			expect(log).toContain("5s delay");
		});
	});

	describe("formatStartupSuccessLog", () => {
		it("should format success log with metrics", () => {
			const result = {
				success: true,
				outputLines: 15,
				outputBytes: 500,
				elapsedMs: 45000,
			};
			const log = formatStartupSuccessLog("sbx-a", result, 2);

			expect(log).toContain("[STARTUP_SUCCESS]");
			expect(log).toContain("sbx-a");
			expect(log).toContain("attempt 2");
			expect(log).toContain("15 lines");
			expect(log).toContain("500 bytes");
		});
	});

	describe("formatStartupFailureLog", () => {
		it("should format failure log with error", () => {
			const result = {
				success: false,
				outputLines: 2,
				outputBytes: 50,
				elapsedMs: 65000,
				error: "No meaningful output",
			};
			const log = formatStartupFailureLog("sbx-a", result, 1);

			expect(log).toContain("[STARTUP_FAILURE]");
			expect(log).toContain("sbx-a");
			expect(log).toContain("Attempt 1 failed");
			expect(log).toContain("No meaningful output");
		});
	});

	describe("StartupOutputTracker", () => {
		describe("createStartupOutputTracker", () => {
			it("should create tracker with initial values", () => {
				const tracker = createStartupOutputTracker();

				expect(tracker.lineCount).toBe(0);
				expect(tracker.byteCount).toBe(0);
				expect(tracker.startTime).toBeInstanceOf(Date);
				expect(tracker.lastOutputTime).toBeNull();
			});
		});

		describe("updateOutputTracker", () => {
			it("should update byte count", () => {
				const tracker = createStartupOutputTracker();
				updateOutputTracker(tracker, "Hello, World!");

				expect(tracker.byteCount).toBe(13);
			});

			it("should count non-empty lines", () => {
				const tracker = createStartupOutputTracker();
				updateOutputTracker(tracker, "Line 1\n\nLine 2\n   \nLine 3");

				expect(tracker.lineCount).toBe(3);
			});

			it("should update lastOutputTime when lines received", () => {
				const tracker = createStartupOutputTracker();
				expect(tracker.lastOutputTime).toBeNull();

				updateOutputTracker(tracker, "Some output");

				expect(tracker.lastOutputTime).toBeInstanceOf(Date);
			});

			it("should accumulate across multiple updates", () => {
				const tracker = createStartupOutputTracker();
				updateOutputTracker(tracker, "First\n");
				updateOutputTracker(tracker, "Second\n");
				updateOutputTracker(tracker, "Third\n");

				expect(tracker.lineCount).toBe(3);
				expect(tracker.byteCount).toBeGreaterThan(15);
			});
		});

		describe("getElapsedTime", () => {
			it("should return elapsed milliseconds", async () => {
				const tracker = createStartupOutputTracker();

				// Wait a small amount of time
				await new Promise((resolve) => setTimeout(resolve, 50));

				const elapsed = getElapsedTime(tracker);
				expect(elapsed).toBeGreaterThanOrEqual(50);
				expect(elapsed).toBeLessThan(200);
			});
		});

		describe("checkStartupStatus", () => {
			it("should return success for healthy tracker within timeout", () => {
				const tracker = createStartupOutputTracker();
				updateOutputTracker(tracker, "Line 1\nLine 2\nLine 3\nLine 4\nLine 5");

				const result = checkStartupStatus(tracker, 60000);

				expect(result.success).toBe(true);
			});
		});
	});

	describe("DEFAULT_STARTUP_CONFIG", () => {
		it("should have reasonable defaults", () => {
			expect(DEFAULT_STARTUP_CONFIG.timeoutMs).toBe(60 * 1000); // 60 seconds
			expect(DEFAULT_STARTUP_CONFIG.retryDelays).toEqual([5000, 10000, 30000]);
			expect(DEFAULT_STARTUP_CONFIG.maxRetries).toBe(3);
			expect(DEFAULT_STARTUP_CONFIG.minOutputBytes).toBe(100);
			expect(DEFAULT_STARTUP_CONFIG.minOutputLines).toBe(5);
		});
	});
});
