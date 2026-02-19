/**
 * Progress File Validation Unit Tests
 *
 * Tests for validateProgressStatus() which prevents invalid status values
 * from propagating into orchestrator state. Bug fix #1952.
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

	it("defaults unknown strings to 'in_progress'", () => {
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
		expect(validateProgressStatus("unknown")).toBe("in_progress");
		expect(validateProgressStatus("running")).toBe("in_progress");
		expect(validateProgressStatus("")).toBe("in_progress");
		warnSpy.mockRestore();
	});

	it("handles non-string values", () => {
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
		expect(validateProgressStatus(undefined)).toBe("in_progress");
		expect(validateProgressStatus(null)).toBe("in_progress");
		expect(validateProgressStatus(42)).toBe("in_progress");
		warnSpy.mockRestore();
	});
});
