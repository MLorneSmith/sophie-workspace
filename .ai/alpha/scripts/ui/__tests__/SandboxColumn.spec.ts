/**
 * SandboxColumn Component Tests
 *
 * Tests for the SandboxColumn component and its helper functions.
 */

import { render } from "ink-testing-library";
import React from "react";
import { describe, expect, it } from "vitest";

import {
	CompactSandboxColumn,
	computeHealthStatus,
	SandboxColumn,
	SandboxStatusLine,
} from "../components/SandboxColumn.js";
import type { SandboxState } from "../types.js";
import {
	HEARTBEAT_STALL_THRESHOLD_MS,
	HEARTBEAT_WARNING_THRESHOLD_MS,
} from "../types.js";

/**
 * Create a minimal valid SandboxState for testing
 */
function createSandboxState(
	overrides: Partial<SandboxState> = {},
): SandboxState {
	return {
		sandboxId: "sbx-12345678901234567890",
		label: "sbx-a",
		status: "busy",
		currentFeature: null,
		currentTask: null,
		currentGroup: null,
		phase: "idle",
		tasksCompleted: 0,
		tasksTotal: 0,
		contextUsage: 0,
		lastHeartbeat: null,
		lastTool: null,
		toolCount: 0,
		retryCount: 0,
		error: undefined,
		waitingReason: undefined,
		blockedBy: undefined,
		recentOutput: [],
		...overrides,
	};
}

describe("computeHealthStatus", () => {
	it("returns 'completed' when status is completed", () => {
		const state = createSandboxState({ status: "completed" });
		expect(computeHealthStatus(state)).toBe("completed");
	});

	it("returns 'failed' when status is failed", () => {
		const state = createSandboxState({ status: "failed" });
		expect(computeHealthStatus(state)).toBe("failed");
	});

	it("returns 'idle' when no feature and no waiting reason", () => {
		const state = createSandboxState({
			status: "ready",
			currentFeature: null,
			waitingReason: undefined,
		});
		expect(computeHealthStatus(state)).toBe("idle");
	});

	it("returns 'idle' when no feature but has waiting reason", () => {
		const state = createSandboxState({
			status: "ready",
			currentFeature: null,
			waitingReason: "Waiting for dependencies",
		});
		expect(computeHealthStatus(state)).toBe("idle");
	});

	it("returns 'warning' when has feature but no heartbeat", () => {
		const state = createSandboxState({
			status: "busy",
			currentFeature: { id: "1", title: "Test Feature" },
			lastHeartbeat: null,
		});
		expect(computeHealthStatus(state)).toBe("warning");
	});

	it("returns 'running' when heartbeat is recent", () => {
		const state = createSandboxState({
			status: "busy",
			currentFeature: { id: "1", title: "Test Feature" },
			lastHeartbeat: new Date(), // Just now
		});
		expect(computeHealthStatus(state)).toBe("running");
	});

	it("returns 'warning' when heartbeat exceeds warning threshold", () => {
		const state = createSandboxState({
			status: "busy",
			currentFeature: { id: "1", title: "Test Feature" },
			lastHeartbeat: new Date(
				Date.now() - HEARTBEAT_WARNING_THRESHOLD_MS - 1000,
			),
		});
		expect(computeHealthStatus(state)).toBe("warning");
	});

	it("returns 'stalled' when heartbeat exceeds stall threshold", () => {
		const state = createSandboxState({
			status: "busy",
			currentFeature: { id: "1", title: "Test Feature" },
			lastHeartbeat: new Date(Date.now() - HEARTBEAT_STALL_THRESHOLD_MS - 1000),
		});
		expect(computeHealthStatus(state)).toBe("stalled");
	});
});

describe("SandboxColumn component", () => {
	it("renders sandbox label", () => {
		const state = createSandboxState({ label: "sbx-a" });
		const { lastFrame } = render(React.createElement(SandboxColumn, { state }));

		expect(lastFrame()).toContain("sbx-a");
	});

	it("renders truncated sandbox ID", () => {
		const state = createSandboxState({ sandboxId: "sbx-12345678901234567890" });
		const { lastFrame } = render(React.createElement(SandboxColumn, { state }));

		expect(lastFrame()).toContain("ID: sbx-123456");
	});

	it("shows 'Waiting for work...' when no feature assigned", () => {
		const state = createSandboxState({
			status: "ready",
			currentFeature: null,
		});
		const { lastFrame } = render(React.createElement(SandboxColumn, { state }));

		expect(lastFrame()).toContain("Waiting for work...");
	});

	it("shows 'All work complete' when status is completed", () => {
		const state = createSandboxState({
			status: "completed",
			currentFeature: null,
		});
		const { lastFrame } = render(React.createElement(SandboxColumn, { state }));

		expect(lastFrame()).toContain("All work complete");
	});

	it("renders current feature ID and title", () => {
		const state = createSandboxState({
			currentFeature: { id: "42", title: "Test Feature" },
			tasksCompleted: 3,
			tasksTotal: 5,
		});
		const { lastFrame } = render(React.createElement(SandboxColumn, { state }));

		expect(lastFrame()).toContain("#42");
		expect(lastFrame()).toContain("Test Feature");
	});

	it("renders waiting reason when provided", () => {
		const state = createSandboxState({
			status: "ready",
			currentFeature: null,
			waitingReason: "Waiting for dependencies",
		});
		const { lastFrame } = render(React.createElement(SandboxColumn, { state }));

		expect(lastFrame()).toContain("Waiting for dependencies");
	});

	it("renders blocked features when provided", () => {
		const state = createSandboxState({
			status: "ready",
			currentFeature: null,
			blockedBy: [10, 20, 30],
		});
		const { lastFrame } = render(React.createElement(SandboxColumn, { state }));

		expect(lastFrame()).toContain("Blocked:");
		expect(lastFrame()).toContain("#10");
		expect(lastFrame()).toContain("#20");
		expect(lastFrame()).toContain("#30");
	});

	it("renders error message when provided", () => {
		const state = createSandboxState({
			error: "Something went wrong",
		});
		const { lastFrame } = render(React.createElement(SandboxColumn, { state }));

		expect(lastFrame()).toContain("Something went wrong");
	});

	it("renders task ID when currentTask has id", () => {
		const state = createSandboxState({
			currentFeature: { id: "1", title: "Test Feature" },
			currentTask: {
				id: "T5",
				name: "Implement feature",
				status: "in_progress",
			},
			lastHeartbeat: new Date(),
		});
		const { lastFrame } = render(React.createElement(SandboxColumn, { state }));

		expect(lastFrame()).toContain("T5");
		expect(lastFrame()).toContain("Implement feature");
	});

	it("renders 'Working...' fallback when currentTask has empty id", () => {
		const state = createSandboxState({
			currentFeature: { id: "1", title: "Test Feature" },
			currentTask: {
				id: "", // Empty ID should trigger fallback
				name: "Loading context",
				status: "in_progress",
			},
			lastHeartbeat: new Date(),
		});
		const { lastFrame } = render(React.createElement(SandboxColumn, { state }));

		expect(lastFrame()).toContain("Working...");
		expect(lastFrame()).toContain("Loading context");
	});

	it("renders task verification retry count when greater than 1", () => {
		const state = createSandboxState({
			currentFeature: { id: "1", title: "Test Feature" },
			currentTask: {
				id: "T3",
				name: "Run tests",
				status: "in_progress",
				verificationAttempts: 3,
			},
			lastHeartbeat: new Date(),
		});
		const { lastFrame } = render(React.createElement(SandboxColumn, { state }));

		expect(lastFrame()).toContain("T3");
		expect(lastFrame()).toContain("Retry 3");
	});

	it("renders context usage when greater than 0", () => {
		const state = createSandboxState({
			currentFeature: { id: "1", title: "Test" },
			contextUsage: 75,
			lastHeartbeat: new Date(),
		});
		const { lastFrame } = render(React.createElement(SandboxColumn, { state }));

		expect(lastFrame()).toContain("Context:");
		expect(lastFrame()).toContain("75%");
	});

	it("renders recent output lines", () => {
		const state = createSandboxState({
			recentOutput: ["Line 1", "Line 2", "Line 3"],
		});
		const { lastFrame } = render(React.createElement(SandboxColumn, { state }));

		expect(lastFrame()).toContain("Output:");
		expect(lastFrame()).toContain("Line 1");
		expect(lastFrame()).toContain("Line 2");
		expect(lastFrame()).toContain("Line 3");
	});

	it("limits recent output to 6 lines", () => {
		const state = createSandboxState({
			recentOutput: [
				"Line 1",
				"Line 2",
				"Line 3",
				"Line 4",
				"Line 5",
				"Line 6",
				"Line 7",
				"Line 8",
			],
		});
		const { lastFrame } = render(React.createElement(SandboxColumn, { state }));

		expect(lastFrame()).toContain("Line 1");
		expect(lastFrame()).toContain("Line 2");
		expect(lastFrame()).toContain("Line 3");
		expect(lastFrame()).toContain("Line 4");
		expect(lastFrame()).toContain("Line 5");
		expect(lastFrame()).toContain("Line 6");
		expect(lastFrame()).not.toContain("Line 7");
		expect(lastFrame()).not.toContain("Line 8");
	});
});

describe("CompactSandboxColumn component", () => {
	it("renders sandbox label", () => {
		const state = createSandboxState({ label: "sbx-b" });
		const { lastFrame } = render(
			React.createElement(CompactSandboxColumn, { state }),
		);

		expect(lastFrame()).toContain("sbx-b");
	});

	it("renders feature progress when feature assigned", () => {
		const state = createSandboxState({
			currentFeature: { id: "99", title: "Test" },
			tasksCompleted: 5,
			tasksTotal: 10,
		});
		const { lastFrame } = render(
			React.createElement(CompactSandboxColumn, { state }),
		);

		expect(lastFrame()).toContain("#99");
		expect(lastFrame()).toContain("(5/10)");
	});

	it("does not render feature info when no feature assigned", () => {
		const state = createSandboxState({
			currentFeature: null,
		});
		const { lastFrame } = render(
			React.createElement(CompactSandboxColumn, { state }),
		);

		expect(lastFrame()).not.toContain("#");
	});
});

describe("SandboxStatusLine component", () => {
	it("renders sandbox label", () => {
		const state = createSandboxState({ label: "sbx-c" });
		const { lastFrame } = render(
			React.createElement(SandboxStatusLine, { state }),
		);

		expect(lastFrame()).toContain("sbx-c");
	});

	it("shows idle when no feature", () => {
		const state = createSandboxState({
			currentFeature: null,
		});
		const { lastFrame } = render(
			React.createElement(SandboxStatusLine, { state }),
		);

		expect(lastFrame()).toContain("idle");
	});

	it("shows feature progress when feature assigned", () => {
		const state = createSandboxState({
			currentFeature: { id: "77", title: "Test" },
			tasksCompleted: 2,
			tasksTotal: 8,
		});
		const { lastFrame } = render(
			React.createElement(SandboxStatusLine, { state }),
		);

		expect(lastFrame()).toContain("#77");
		expect(lastFrame()).toContain("[2/8]");
	});
});
