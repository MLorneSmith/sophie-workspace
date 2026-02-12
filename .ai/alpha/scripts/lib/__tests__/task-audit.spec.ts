/**
 * Task Audit Unit Tests
 *
 * Tests for auditTaskCompletion() which detects phantom overcounts
 * and silently dropped tasks from agent progress reports.
 * Bug fix #2060.
 */

import { describe, expect, it } from "vitest";

import { auditTaskCompletion } from "../feature.js";

describe("auditTaskCompletion", () => {
	it("passes through correct counts unchanged", () => {
		const result = auditTaskCompletion(10, 0, 10);
		expect(result.adjustedCompleted).toBe(10);
		expect(result.adjustedFailed).toBe(0);
		expect(result.droppedTasks).toBe(0);
		expect(result.hasOvercount).toBe(false);
		expect(result.hasAnomalies).toBe(false);
	});

	it("caps phantom overcounts to task_count", () => {
		// Agent claims 15 completed but only 10 tasks exist
		const result = auditTaskCompletion(15, 0, 10);
		expect(result.adjustedCompleted).toBe(10);
		expect(result.reportedCompleted).toBe(15);
		expect(result.hasOvercount).toBe(true);
		expect(result.hasAnomalies).toBe(true);
		expect(result.droppedTasks).toBe(0);
	});

	it("detects silently dropped tasks", () => {
		// 10 tasks total, 6 completed, 0 failed = 4 dropped
		const result = auditTaskCompletion(6, 0, 10);
		expect(result.adjustedCompleted).toBe(6);
		expect(result.droppedTasks).toBe(4);
		expect(result.hasAnomalies).toBe(true);
	});

	it("accounts for failed tasks when calculating dropped", () => {
		// 10 tasks, 6 completed, 2 failed = 2 dropped
		const result = auditTaskCompletion(6, 2, 10);
		expect(result.adjustedCompleted).toBe(6);
		expect(result.adjustedFailed).toBe(2);
		expect(result.droppedTasks).toBe(2);
		expect(result.hasAnomalies).toBe(true);
	});

	it("caps failed count to remaining after completed", () => {
		// 10 tasks, 8 completed, 5 failed (impossible: 13 > 10)
		const result = auditTaskCompletion(8, 5, 10);
		expect(result.adjustedCompleted).toBe(8);
		expect(result.adjustedFailed).toBe(2); // capped to 10 - 8
		expect(result.droppedTasks).toBe(0);
	});

	it("handles all tasks completed with no anomalies", () => {
		const result = auditTaskCompletion(7, 0, 7);
		expect(result.adjustedCompleted).toBe(7);
		expect(result.droppedTasks).toBe(0);
		expect(result.hasOvercount).toBe(false);
		expect(result.hasAnomalies).toBe(false);
	});

	it("handles zero completed tasks", () => {
		const result = auditTaskCompletion(0, 0, 5);
		expect(result.adjustedCompleted).toBe(0);
		expect(result.droppedTasks).toBe(5);
		expect(result.hasAnomalies).toBe(true);
	});

	it("handles all tasks failed", () => {
		const result = auditTaskCompletion(0, 5, 5);
		expect(result.adjustedCompleted).toBe(0);
		expect(result.adjustedFailed).toBe(5);
		expect(result.droppedTasks).toBe(0);
		expect(result.hasAnomalies).toBe(false);
	});

	it("handles combined overcount and failed cap", () => {
		// 10 tasks, 12 completed (overcounted), 3 failed
		// After cap: 10 completed, 0 failed (no room), 0 dropped
		const result = auditTaskCompletion(12, 3, 10);
		expect(result.adjustedCompleted).toBe(10);
		expect(result.adjustedFailed).toBe(0);
		expect(result.droppedTasks).toBe(0);
		expect(result.hasOvercount).toBe(true);
		expect(result.reportedCompleted).toBe(12);
	});

	it("matches S2045 real-world scenario", () => {
		// S2045.I4.F1: 12 tasks, GPT reported 14 completed (phantom)
		const result = auditTaskCompletion(14, 0, 12);
		expect(result.adjustedCompleted).toBe(12);
		expect(result.hasOvercount).toBe(true);
		expect(result.droppedTasks).toBe(0);
	});

	it("matches S2045 dropped task scenario", () => {
		// Feature with 8 tasks, 5 completed, 0 failed = 3 dropped
		const result = auditTaskCompletion(5, 0, 8);
		expect(result.adjustedCompleted).toBe(5);
		expect(result.droppedTasks).toBe(3);
		expect(result.hasAnomalies).toBe(true);
	});

	it("handles single-task feature", () => {
		const result = auditTaskCompletion(1, 0, 1);
		expect(result.adjustedCompleted).toBe(1);
		expect(result.droppedTasks).toBe(0);
		expect(result.hasAnomalies).toBe(false);
	});
});
