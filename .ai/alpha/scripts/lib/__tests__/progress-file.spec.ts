/**
 * Progress File Validation Unit Tests
 *
 * Tests for validateProgressStatus() which prevents invalid status values
 * from propagating into orchestrator state. Bug fix #1952, #2048.
 */

import { describe, expect, it, vi } from "vitest";

import { validateProgressStatus } from "../progress-file.js";

describe("validateProgressStatus", () => {
	it("passes through valid statuses unchanged", () => {
		expect(validateProgressStatus("in_progress")).toBe("in_progress");
		expect(validateProgressStatus("completed")).toBe("completed");
		expect(validateProgressStatus("failed")).toBe("failed");
	});

	it('remaps "blocked" to "failed"', () => {
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
		expect(validateProgressStatus("blocked")).toBe("failed");
		expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("Remapping"));
		warnSpy.mockRestore();
	});

	it('remaps "context_limit" to "completed" (Bug fix #2048)', () => {
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
		expect(validateProgressStatus("context_limit")).toBe("completed");
		expect(warnSpy).toHaveBeenCalledWith(
			expect.stringContaining('Remapping "context_limit" -> "completed"'),
		);
		warnSpy.mockRestore();
	});

	it("remaps known terminal statuses correctly", () => {
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

		// Terminal statuses that map to "completed"
		expect(validateProgressStatus("partial")).toBe("completed");
		expect(validateProgressStatus("context_exceeded")).toBe("completed");
		expect(validateProgressStatus("done")).toBe("completed");

		// Terminal statuses that map to "failed"
		expect(validateProgressStatus("error")).toBe("failed");
		expect(validateProgressStatus("aborted")).toBe("failed");
		expect(validateProgressStatus("timed_out")).toBe("failed");

		warnSpy.mockRestore();
	});

	it("defaults unknown strings to 'failed' (Bug fix #2048: was 'in_progress')", () => {
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
		expect(validateProgressStatus("unknown")).toBe("failed");
		expect(validateProgressStatus("running")).toBe("failed");
		expect(validateProgressStatus("")).toBe("failed");
		warnSpy.mockRestore();
	});

	it("handles non-string values", () => {
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
		expect(validateProgressStatus(undefined)).toBe("failed");
		expect(validateProgressStatus(null)).toBe("failed");
		expect(validateProgressStatus(42)).toBe("failed");
		warnSpy.mockRestore();
	});
});
