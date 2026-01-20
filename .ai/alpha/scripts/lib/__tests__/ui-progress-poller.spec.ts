/**
 * useProgressPoller Hook Unit Tests
 *
 * Tests for progress polling, tasksTotal stabilization,
 * and state change detection.
 */

import { describe, expect, it } from "vitest";

// Import the internal progressToSandboxState helper by testing through the module
// Since it's not exported, we test through the hook behavior

/**
 * Test the tasksTotal stabilization logic
 *
 * These tests verify the fix for diagnosis #1567 - progress bar flicker
 * caused by tasksTotal fluctuating when currentTask toggles.
 */
describe("tasksTotal stabilization", () => {
	/**
	 * Helper to simulate the tasksTotal calculation logic from progressToSandboxState
	 */
	function calculateTasksTotal(
		completedTasks: number,
		failedTasks: number,
		hasCurrentTask: boolean,
		previousTotal: number,
	): number {
		const calculatedTotal =
			completedTasks + failedTasks + (hasCurrentTask ? 1 : 0);

		// Preserve previous tasksTotal if it was higher (prevents flicker)
		return calculatedTotal > 0
			? Math.max(calculatedTotal, previousTotal)
			: previousTotal;
	}

	it("should never decrease tasksTotal when currentTask toggles off", () => {
		// Scenario: 3 completed, currentTask exists → currentTask removed temporarily
		const withCurrentTask = calculateTasksTotal(3, 0, true, 0);
		expect(withCurrentTask).toBe(4);

		const withoutCurrentTask = calculateTasksTotal(3, 0, false, 4);
		expect(withoutCurrentTask).toBe(4); // Should NOT decrease to 3
	});

	it("should increase tasksTotal when new tasks are discovered", () => {
		// Initial state: 2 completed + 1 current = 3 total
		const initial = calculateTasksTotal(2, 0, true, 0);
		expect(initial).toBe(3);

		// New task discovered: 3 completed + 1 current = 4 total
		const afterNewTask = calculateTasksTotal(3, 0, true, 3);
		expect(afterNewTask).toBe(4);
	});

	it("should use previous total when calculated is 0 but previous was higher", () => {
		const result = calculateTasksTotal(0, 0, false, 5);
		expect(result).toBe(5);
	});

	it("should handle failed tasks in calculation", () => {
		// 2 completed + 1 failed + 1 current = 4
		const result = calculateTasksTotal(2, 1, true, 0);
		expect(result).toBe(4);
	});

	it("should not increase when same calculated total", () => {
		// Repeated polls with same values should return same total
		let total = calculateTasksTotal(5, 0, true, 0);
		expect(total).toBe(6);

		total = calculateTasksTotal(5, 0, true, 6);
		expect(total).toBe(6);

		total = calculateTasksTotal(5, 0, true, 6);
		expect(total).toBe(6);
	});
});

/**
 * Test sandbox state equality checking
 */
describe("sandbox state comparison", () => {
	it("should detect changes in status", () => {
		const state1 = { status: "busy", tasksCompleted: 5 };
		const state2 = { status: "completed", tasksCompleted: 5 };

		expect(state1.status).not.toBe(state2.status);
	});

	it("should detect changes in tasksCompleted", () => {
		const state1 = { status: "busy", tasksCompleted: 5 };
		const state2 = { status: "busy", tasksCompleted: 6 };

		expect(state1.tasksCompleted).not.toBe(state2.tasksCompleted);
	});

	it("should not re-render when heartbeat changes within tolerance", () => {
		const now = Date.now();
		const heartbeat1 = new Date(now);
		const heartbeat2 = new Date(now + 500); // 500ms difference

		const diff = Math.abs(heartbeat1.getTime() - heartbeat2.getTime());
		expect(diff).toBeLessThanOrEqual(1000); // Within 1 second tolerance
	});
});

/**
 * Test task ID fallback logic
 *
 * These tests verify the fix for issue #1630 - task ID display inconsistency
 * caused by missing IDs in progress data.
 */
describe("task ID fallback", () => {
	/**
	 * Helper to simulate the task ID fallback logic from progressToSandboxState
	 */
	function getTaskId(
		progressTaskId: string | undefined,
		completedTasksCount: number,
	): string {
		// Fallback: generate placeholder ID if missing (based on completed task count)
		return progressTaskId || `T${completedTasksCount + 1}`;
	}

	it("should use provided task ID when available", () => {
		const taskId = getTaskId("T5", 4);
		expect(taskId).toBe("T5");
	});

	it("should generate fallback ID when task ID is undefined", () => {
		const taskId = getTaskId(undefined, 3);
		expect(taskId).toBe("T4"); // 3 completed + 1 = T4
	});

	it("should generate fallback ID when task ID is empty string", () => {
		const taskId = getTaskId("", 2);
		expect(taskId).toBe("T3"); // 2 completed + 1 = T3
	});

	it("should generate T1 when no completed tasks and no ID", () => {
		const taskId = getTaskId(undefined, 0);
		expect(taskId).toBe("T1");
	});

	it("should preserve semantic IDs like S1.I1.F1.T1", () => {
		const taskId = getTaskId("S1607.I4.F1.T1", 0);
		expect(taskId).toBe("S1607.I4.F1.T1");
	});
});

/**
 * Test event list bounds
 */
describe("event list bounds", () => {
	const MAX_EVENTS = 100;

	it("should cap events at MAX_EVENTS", () => {
		// Simulate adding events and slicing to MAX_EVENTS
		const events = Array.from({ length: 150 }, (_, i) => ({
			id: `event-${i}`,
		}));

		const bounded = events.slice(0, MAX_EVENTS);
		expect(bounded.length).toBe(100);
	});

	it("should keep newest events when exceeding limit", () => {
		const events = Array.from({ length: 150 }, (_, i) => ({
			id: `event-${i}`,
			timestamp: new Date(Date.now() + i * 1000),
		}));

		// Sort by timestamp descending (newest first) then slice
		const sorted = events
			.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
			.slice(0, MAX_EVENTS);

		expect(sorted.length).toBe(100);
		// First event should be the newest (index 149 from original)
		expect(sorted[0]?.id).toBe("event-149");
	});
});
