/**
 * Promise Age Tracker Unit Tests
 *
 * Tests for promise timeout detection and recovery.
 * Bug fix #1841: Promise timeout monitor for work loop recovery.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	createPromiseAgeTracker,
	PromiseAgeTracker,
} from "../promise-age-tracker.js";

// ============================================================================
// Test Constants
// ============================================================================

const TEST_PROMISE_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
const TEST_HEARTBEAT_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

// ============================================================================
// Helpers
// ============================================================================

/**
 * Advance the mocked Date.now() by a specified amount of milliseconds.
 */
function advanceTime(ms: number): void {
	const now = Date.now();
	vi.setSystemTime(now + ms);
}

// ============================================================================
// Tests
// ============================================================================

describe("PromiseAgeTracker", () => {
	let tracker: PromiseAgeTracker;
	const baseTime = new Date("2026-01-26T12:00:00.000Z").getTime();

	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(baseTime);
		tracker = new PromiseAgeTracker(
			TEST_PROMISE_TIMEOUT_MS,
			TEST_HEARTBEAT_TIMEOUT_MS,
		);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe("track()", () => {
		it("stores promise metadata correctly", () => {
			tracker.track("sbx-a", "S1823.I4.F3");

			const metadata = tracker.get("sbx-a");
			expect(metadata).toBeDefined();
			expect(metadata?.featureId).toBe("S1823.I4.F3");
			expect(metadata?.sandboxLabel).toBe("sbx-a");
			expect(metadata?.createdAt).toBe(baseTime);
		});

		it("overwrites existing entry for same sandbox", () => {
			tracker.track("sbx-a", "S1823.I4.F1");
			advanceTime(1000);
			tracker.track("sbx-a", "S1823.I4.F2");

			const metadata = tracker.get("sbx-a");
			expect(metadata?.featureId).toBe("S1823.I4.F2");
			expect(metadata?.createdAt).toBe(baseTime + 1000);
		});

		it("tracks multiple sandboxes simultaneously", () => {
			tracker.track("sbx-a", "S1823.I4.F1");
			tracker.track("sbx-b", "S1823.I4.F2");
			tracker.track("sbx-c", "S1823.I4.F3");

			expect(tracker.size).toBe(3);
			expect(tracker.has("sbx-a")).toBe(true);
			expect(tracker.has("sbx-b")).toBe(true);
			expect(tracker.has("sbx-c")).toBe(true);
		});
	});

	describe("remove()", () => {
		it("removes tracked promise", () => {
			tracker.track("sbx-a", "S1823.I4.F1");
			expect(tracker.has("sbx-a")).toBe(true);

			tracker.remove("sbx-a");
			expect(tracker.has("sbx-a")).toBe(false);
		});

		it("does not error when removing non-existent promise", () => {
			expect(() => tracker.remove("non-existent")).not.toThrow();
		});
	});

	describe("getPromiseAge()", () => {
		it("returns correct age for tracked promise", () => {
			tracker.track("sbx-a", "S1823.I4.F1");
			advanceTime(5000);

			const age = tracker.getPromiseAge("sbx-a");
			expect(age).toBe(5000);
		});

		it("returns null for non-tracked promise", () => {
			const age = tracker.getPromiseAge("non-existent");
			expect(age).toBeNull();
		});
	});

	describe("updateHeartbeatAge()", () => {
		it("updates heartbeat age for tracked promise", () => {
			tracker.track("sbx-a", "S1823.I4.F1");
			tracker.updateHeartbeatAge("sbx-a", 30000);

			const metadata = tracker.get("sbx-a");
			expect(metadata?.lastHeartbeatAge).toBe(30000);
			expect(metadata?.lastHeartbeatCheckAt).toBe(baseTime);
		});

		it("does not error when updating non-existent promise", () => {
			expect(() =>
				tracker.updateHeartbeatAge("non-existent", 30000),
			).not.toThrow();
		});
	});

	describe("isStale()", () => {
		it("returns null for non-tracked promise", () => {
			const stale = tracker.isStale("non-existent");
			expect(stale).toBeNull();
		});

		it("returns null when promise is not old enough", () => {
			tracker.track("sbx-a", "S1823.I4.F1");
			advanceTime(5 * 60 * 1000); // 5 minutes

			const stale = tracker.isStale("sbx-a");
			expect(stale).toBeNull();
		});

		it("returns null when promise is old but heartbeat is fresh", () => {
			tracker.track("sbx-a", "S1823.I4.F1");
			advanceTime(TEST_PROMISE_TIMEOUT_MS + 1000); // Just over 10 minutes

			// Fresh heartbeat (2 minutes old)
			tracker.updateHeartbeatAge("sbx-a", 2 * 60 * 1000);

			const stale = tracker.isStale("sbx-a");
			expect(stale).toBeNull();
		});

		it("returns stale info when both promise and heartbeat are old", () => {
			tracker.track("sbx-a", "S1823.I4.F3");
			advanceTime(TEST_PROMISE_TIMEOUT_MS + 1000); // Just over 10 minutes

			// Stale heartbeat (6 minutes old)
			tracker.updateHeartbeatAge("sbx-a", 6 * 60 * 1000);

			const stale = tracker.isStale("sbx-a");
			expect(stale).not.toBeNull();
			expect(stale?.featureId).toBe("S1823.I4.F3");
			expect(stale?.sandboxLabel).toBe("sbx-a");
			expect(stale?.promiseAgeMs).toBe(TEST_PROMISE_TIMEOUT_MS + 1000);
			expect(stale?.heartbeatAgeMs).toBe(6 * 60 * 1000);
			expect(stale?.reason).toBe("both");
		});

		it("returns stale info when heartbeat was never updated (unknown)", () => {
			tracker.track("sbx-a", "S1823.I4.F3");
			advanceTime(TEST_PROMISE_TIMEOUT_MS + 1000); // Just over 10 minutes

			// No heartbeat update - treated as stale

			const stale = tracker.isStale("sbx-a");
			expect(stale).not.toBeNull();
			expect(stale?.heartbeatAgeMs).toBeNull();
			expect(stale?.reason).toBe("promise_timeout");
		});

		it("handles boundary condition: exactly at timeout", () => {
			tracker.track("sbx-a", "S1823.I4.F3");
			advanceTime(TEST_PROMISE_TIMEOUT_MS); // Exactly 10 minutes

			// Not stale yet - must exceed threshold
			const stale = tracker.isStale("sbx-a");
			expect(stale).toBeNull();
		});
	});

	describe("findStalePromises()", () => {
		it("returns empty array when no promises are tracked", () => {
			const stale = tracker.findStalePromises();
			expect(stale).toEqual([]);
		});

		it("returns empty array when no promises are stale", () => {
			tracker.track("sbx-a", "S1823.I4.F1");
			tracker.track("sbx-b", "S1823.I4.F2");
			advanceTime(5 * 60 * 1000); // 5 minutes

			const stale = tracker.findStalePromises();
			expect(stale).toEqual([]);
		});

		it("returns all stale promises", () => {
			tracker.track("sbx-a", "S1823.I4.F1");
			tracker.track("sbx-b", "S1823.I4.F2");
			tracker.track("sbx-c", "S1823.I4.F3");

			advanceTime(TEST_PROMISE_TIMEOUT_MS + 1000);

			// sbx-a has fresh heartbeat
			tracker.updateHeartbeatAge("sbx-a", 1 * 60 * 1000);
			// sbx-b has stale heartbeat
			tracker.updateHeartbeatAge("sbx-b", 6 * 60 * 1000);
			// sbx-c has no heartbeat

			const stale = tracker.findStalePromises();
			expect(stale).toHaveLength(2);
			expect(stale.map((s) => s.sandboxLabel).sort()).toEqual([
				"sbx-b",
				"sbx-c",
			]);
		});

		it("handles multiple stale promises in one cycle", () => {
			tracker.track("sbx-a", "S1823.I4.F1");
			tracker.track("sbx-b", "S1823.I4.F2");
			tracker.track("sbx-c", "S1823.I4.F3");

			advanceTime(TEST_PROMISE_TIMEOUT_MS + 60000); // 11 minutes

			const stale = tracker.findStalePromises();
			expect(stale).toHaveLength(3);
		});
	});

	describe("clear()", () => {
		it("removes all tracked promises", () => {
			tracker.track("sbx-a", "S1823.I4.F1");
			tracker.track("sbx-b", "S1823.I4.F2");
			expect(tracker.size).toBe(2);

			tracker.clear();
			expect(tracker.size).toBe(0);
		});
	});
});

describe("createPromiseAgeTracker", () => {
	it("creates tracker with default timeouts", () => {
		const tracker = createPromiseAgeTracker();
		expect(tracker).toBeInstanceOf(PromiseAgeTracker);
	});

	it("creates tracker with custom timeouts", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-01-26T12:00:00.000Z"));

		const customPromiseTimeout = 5 * 60 * 1000;
		const customHeartbeatTimeout = 2 * 60 * 1000;
		const tracker = createPromiseAgeTracker(
			customPromiseTimeout,
			customHeartbeatTimeout,
		);

		// Track a promise and advance time past custom timeout
		tracker.track("sbx-a", "test");
		vi.advanceTimersByTime(customPromiseTimeout + 1000);

		// Should be stale with custom timeout (no heartbeat = stale)
		const stale = tracker.isStale("sbx-a");
		expect(stale).not.toBeNull();

		vi.useRealTimers();
	});
});

describe("edge cases", () => {
	let tracker: PromiseAgeTracker;

	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-01-26T12:00:00.000Z"));
		tracker = new PromiseAgeTracker(
			TEST_PROMISE_TIMEOUT_MS,
			TEST_HEARTBEAT_TIMEOUT_MS,
		);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("handles promise removed before timeout check", () => {
		tracker.track("sbx-a", "S1823.I4.F1");
		tracker.remove("sbx-a");

		vi.advanceTimersByTime(TEST_PROMISE_TIMEOUT_MS + 1000);

		const stale = tracker.findStalePromises();
		expect(stale).toHaveLength(0);
	});

	it("handles rapid track/remove cycles", () => {
		for (let i = 0; i < 100; i++) {
			tracker.track("sbx-a", `feature-${i}`);
			tracker.remove("sbx-a");
		}

		expect(tracker.size).toBe(0);
	});

	it("handles heartbeat update after promise removed", () => {
		tracker.track("sbx-a", "S1823.I4.F1");
		tracker.remove("sbx-a");

		// Should not error
		tracker.updateHeartbeatAge("sbx-a", 1000);
		expect(tracker.get("sbx-a")).toBeUndefined();
	});
});
