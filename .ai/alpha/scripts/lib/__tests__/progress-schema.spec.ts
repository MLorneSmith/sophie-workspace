/**
 * Tests for Zod runtime validation schemas at I/O boundaries.
 *
 * Feature #2066: Validates that malformed JSON from GPT/Codex agents
 * is caught and defaulted instead of crashing the orchestrator.
 *
 * Covers the 5 historical crash scenarios:
 * - #1927: Raw number rendering (missing name field)
 * - #1937: GPT provider multiple issues (non-standard data)
 * - #1952: GPT writes "blocked" status
 * - #2048: GPT writes "context_limit" status
 * - #2065: truncate() crash from missing name/title fields
 */

import { describe, expect, it, vi } from "vitest";

import {
	OverallProgressFileSchema,
	ProgressFileDataSchema,
	SandboxProgressFileSchema,
	SandboxProgressSchema,
	safeParseProgress,
} from "../schemas/index.js";

// ============================================================================
// ProgressFileDataSchema Tests
// ============================================================================

describe("ProgressFileDataSchema", () => {
	it("validates a complete valid progress file", () => {
		const input = {
			status: "in_progress",
			phase: "executing",
			completed_tasks: ["T1", "T2"],
			total_tasks: 5,
			last_heartbeat: "2026-02-11T10:00:00Z",
			context_usage_percent: 45,
			feature_id: "S2045.I1.F1",
			current_task: {
				id: "T3",
				name: "Implement login form",
				status: "in_progress",
				started_at: "2026-02-11T10:05:00Z",
			},
		};

		const result = ProgressFileDataSchema.safeParse(input);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.status).toBe("in_progress");
			expect(result.data.completed_tasks).toEqual(["T1", "T2"]);
			expect(result.data.current_task?.name).toBe("Implement login form");
		}
	});

	it("applies defaults for empty object (crash #2065 scenario)", () => {
		const result = ProgressFileDataSchema.safeParse({});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.status).toBe("in_progress");
			expect(result.data.phase).toBe("executing");
			expect(result.data.completed_tasks).toEqual([]);
		}
	});

	it("defaults current_task.name when missing (crash #2065)", () => {
		const input = {
			status: "in_progress",
			current_task: { id: "T1", status: "in_progress" },
		};

		const result = ProgressFileDataSchema.safeParse(input);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.current_task?.name).toBe("Working...");
		}
	});

	it("defaults current_task.id when missing (crash #1927)", () => {
		const input = {
			status: "in_progress",
			current_task: { name: "Some task", status: "in_progress" },
		};

		const result = ProgressFileDataSchema.safeParse(input);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.current_task?.id).toBe("Unknown");
		}
	});

	it("preserves unknown fields via loose mode", () => {
		const input = {
			status: "completed",
			phase: "done",
			completed_tasks: [],
			last_heartbeat: "2026-02-11T10:00:00Z",
			extra_gpt_field: "GPT agents often add extra fields",
		};

		const result = ProgressFileDataSchema.safeParse(input);
		expect(result.success).toBe(true);
		if (result.success) {
			expect((result.data as Record<string, unknown>).extra_gpt_field).toBe(
				"GPT agents often add extra fields",
			);
		}
	});
});

// ============================================================================
// SandboxProgressSchema Tests
// ============================================================================

describe("SandboxProgressSchema", () => {
	it("validates complete sandbox progress", () => {
		const input = {
			feature: { issue_number: "S2045.I1.F1", title: "User Dashboard" },
			current_task: {
				id: "T3",
				name: "Create API route",
				status: "in_progress",
			},
			completed_tasks: ["T1", "T2"],
			context_usage_percent: 30,
			status: "in_progress",
			last_heartbeat: "2026-02-11T10:00:00Z",
			phase: "executing",
		};

		const result = SandboxProgressSchema.safeParse(input);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.feature?.title).toBe("User Dashboard");
		}
	});

	it("defaults feature fields when partially missing", () => {
		const input = {
			feature: { title: "Test Feature" },
			status: "in_progress",
		};

		const result = SandboxProgressSchema.safeParse(input);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.feature?.issue_number).toBe("Unknown");
			expect(result.data.feature?.title).toBe("Test Feature");
		}
	});

	it("accepts non-standard status strings (for validateProgressStatus remapping)", () => {
		// GPT agents may write "blocked", "context_limit", etc.
		// The schema accepts any string; validateProgressStatus() handles remapping
		const input = { status: "blocked" };
		const result = SandboxProgressSchema.safeParse(input);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.status).toBe("blocked");
		}
	});

	it("handles context_limit status (#2048)", () => {
		const input = { status: "context_limit", context_usage_percent: 95 };
		const result = SandboxProgressSchema.safeParse(input);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.status).toBe("context_limit");
		}
	});

	it("handles empty object gracefully", () => {
		const result = SandboxProgressSchema.safeParse({});
		expect(result.success).toBe(true);
	});
});

// ============================================================================
// SandboxProgressFileSchema Tests
// ============================================================================

describe("SandboxProgressFileSchema", () => {
	it("validates complete UI progress file", () => {
		const input = {
			feature: { issue_number: "S2045.I1.F3", title: "Settings Page" },
			current_task: {
				id: "T5",
				name: "Add form validation",
				status: "in_progress",
				verification_attempts: 2,
			},
			current_group: {
				id: 2,
				name: "Group 2: UI Components",
				tasks_total: 5,
				tasks_completed: 3,
			},
			completed_tasks: ["T1", "T2", "T3"],
			context_usage_percent: 55,
			status: "in_progress",
			phase: "executing",
			last_heartbeat: "2026-02-11T10:00:00Z",
			tool_count: 42,
			session_id: "session-123",
			recent_output: ["Building...", "Tests passing", "Committing..."],
		};

		const result = SandboxProgressFileSchema.safeParse(input);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.tool_count).toBe(42);
			expect(result.data.recent_output).toHaveLength(3);
		}
	});

	it("handles missing feature.title (crash #2065)", () => {
		const input = {
			feature: { issue_number: "123" },
			current_task: { id: "T1" },
		};

		const result = SandboxProgressFileSchema.safeParse(input);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.feature?.title).toBe("Feature");
			expect(result.data.current_task?.name).toBe("Working...");
		}
	});

	it("handles GPT agent with no feature object (#1937)", () => {
		const input = {
			status: "in_progress",
			phase: "executing",
			completed_tasks: ["T1"],
		};

		const result = SandboxProgressFileSchema.safeParse(input);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.feature).toBeUndefined();
		}
	});
});

// ============================================================================
// OverallProgressFileSchema Tests
// ============================================================================

describe("OverallProgressFileSchema", () => {
	it("validates complete overall progress", () => {
		const input = {
			specId: "S2045",
			specName: "User Dashboard",
			status: "in_progress",
			initiativesCompleted: 1,
			initiativesTotal: 3,
			featuresCompleted: 5,
			featuresTotal: 14,
			tasksCompleted: 50,
			tasksTotal: 136,
			lastCheckpoint: "2026-02-11T10:00:00Z",
			branchName: "alpha/spec-S2045",
		};

		const result = OverallProgressFileSchema.safeParse(input);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.featuresCompleted).toBe(5);
		}
	});

	it("applies defaults for empty object", () => {
		const result = OverallProgressFileSchema.safeParse({});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.specId).toBe("");
			expect(result.data.status).toBe("pending");
			expect(result.data.tasksTotal).toBe(0);
		}
	});
});

// ============================================================================
// safeParseProgress Tests
// ============================================================================

describe("safeParseProgress", () => {
	it("returns validated data on success", () => {
		const input = { status: "completed", phase: "done", completed_tasks: [] };
		const result = safeParseProgress(ProgressFileDataSchema, input, "test");
		expect(result.status).toBe("completed");
	});

	it("returns defaults and warns on invalid data", () => {
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

		// completed_tasks should be an array, not a number
		const input = { completed_tasks: 42 };
		const result = safeParseProgress(
			ProgressFileDataSchema,
			input,
			"test-invalid",
		);

		// Should get defaults since the array field failed
		expect(result.status).toBe("in_progress");
		expect(Array.isArray(result.completed_tasks)).toBe(true);

		// Should have logged a warning
		expect(warnSpy).toHaveBeenCalledWith(
			expect.stringContaining("[VALIDATION_WARN] test-invalid"),
		);

		warnSpy.mockRestore();
	});

	it("logs validation details for debugging", () => {
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

		// current_task as string instead of object
		const input = { current_task: "not an object" };
		safeParseProgress(ProgressFileDataSchema, input, "debug-test");

		expect(warnSpy).toHaveBeenCalled();
		const message = warnSpy.mock.calls[0]?.[0] as string;
		expect(message).toContain("[VALIDATION_WARN]");
		expect(message).toContain("debug-test");

		warnSpy.mockRestore();
	});

	it("handles null input gracefully", () => {
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

		const result = safeParseProgress(SandboxProgressSchema, null, "null-test");

		// Should return defaults
		expect(result).toBeDefined();
		warnSpy.mockRestore();
	});

	it("handles undefined input gracefully", () => {
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

		const result = safeParseProgress(
			SandboxProgressSchema,
			undefined,
			"undefined-test",
		);

		expect(result).toBeDefined();
		warnSpy.mockRestore();
	});
});

// ============================================================================
// Historical Crash Scenario Tests
// ============================================================================

describe("Historical crash scenarios", () => {
	it("#1927: GPT renders raw number instead of name", () => {
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

		// GPT agent wrote current_task with numeric id (not string)
		const input = {
			status: "in_progress",
			current_task: { id: 5, status: "in_progress" },
		};

		const result = safeParseProgress(
			SandboxProgressFileSchema,
			input,
			"crash-1927",
		);

		// Zod rejects the invalid current_task (id should be string),
		// so the fallback defaults don't include current_task (it's optional).
		// The key point: it doesn't crash. The warn log alerts operators.
		expect(warnSpy).toHaveBeenCalledWith(
			expect.stringContaining("[VALIDATION_WARN] crash-1927"),
		);
		// Result should still be a valid object (fallback from schema.parse({}))
		expect(result).toBeDefined();
		expect(typeof result).toBe("object");

		warnSpy.mockRestore();
	});

	it("#1937: GPT provider writes non-standard progress data", () => {
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

		// GPT agent writes a progress file with mixed types
		const input = {
			status: "running",
			phase: 3, // number instead of string
			completed_tasks: "T1,T2", // string instead of array
		};

		const result = safeParseProgress(
			SandboxProgressFileSchema,
			input,
			"crash-1937",
		);

		// Should still produce a valid result
		expect(result).toBeDefined();
		warnSpy.mockRestore();
	});

	it("#1952: GPT writes 'blocked' status", () => {
		const input = {
			status: "blocked",
			feature: { issue_number: "S1918.I1.F3", title: "Feature" },
		};

		const result = SandboxProgressSchema.safeParse(input);
		expect(result.success).toBe(true);
		// The schema accepts any string; validateProgressStatus remaps it
		if (result.success) {
			expect(result.data.status).toBe("blocked");
		}
	});

	it("#2048: GPT writes 'context_limit' status", () => {
		const input = {
			status: "context_limit",
			context_usage_percent: 98,
			completed_tasks: ["T1", "T2", "T3"],
		};

		const result = SandboxProgressSchema.safeParse(input);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.status).toBe("context_limit");
		}
	});

	it("#2065: Missing name/title causes truncate() crash", () => {
		const input = {
			feature: {},
			current_task: {},
		};

		const result = safeParseProgress(
			SandboxProgressFileSchema,
			input,
			"crash-2065",
		);

		// All fields should have safe defaults
		expect(result.feature?.issue_number).toBe("Unknown");
		expect(result.feature?.title).toBe("Feature");
		expect(result.current_task?.id).toBe("Unknown");
		expect(result.current_task?.name).toBe("Working...");
	});
});
