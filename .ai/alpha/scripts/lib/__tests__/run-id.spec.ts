/**
 * Run ID Generation Unit Tests
 *
 * Tests for run ID generation, parsing, and validation.
 * These are pure functions with no external dependencies.
 */

import { describe, expect, it } from "vitest";

import {
	createSessionHeader,
	formatArchiveDirectory,
	generateRunId,
	isValidRunId,
	parseRunIdTimestamp,
} from "../run-id.js";

describe("generateRunId", () => {
	it("generates a run ID with correct format", () => {
		const runId = generateRunId();

		expect(runId).toMatch(/^run-[a-z0-9]+-[a-z0-9]{4}$/);
	});

	it("generates unique IDs on successive calls", () => {
		const ids = new Set<string>();

		for (let i = 0; i < 100; i++) {
			ids.add(generateRunId());
		}

		// All 100 should be unique
		expect(ids.size).toBe(100);
	});

	it("generates IDs that start with run- prefix", () => {
		const runId = generateRunId();

		expect(runId.startsWith("run-")).toBe(true);
	});

	it("generates IDs with parseable timestamps", () => {
		const runId = generateRunId();
		const timestamp = parseRunIdTimestamp(runId);

		expect(timestamp).toBeInstanceOf(Date);
		expect(timestamp).not.toBeNull();
		if (!timestamp) throw new Error("Timestamp is null");
		// Timestamp should be within last second
		expect(Date.now() - timestamp.getTime()).toBeLessThan(1000);
	});
});

describe("formatArchiveDirectory", () => {
	it("formats date in ISO format without colons", () => {
		const date = new Date("2024-03-15T10:30:45.123Z");
		const result = formatArchiveDirectory(date);

		expect(result).toBe("2024-03-15T10-30-45");
	});

	it("uses current date when no argument provided", () => {
		const before = new Date();
		const result = formatArchiveDirectory();

		// Verify format is correct (YYYY-MM-DDTHH-MM-SS)
		expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}$/);

		// Check that the date portion matches
		const expectedDatePrefix = before.toISOString().slice(0, 10);
		expect(result.startsWith(expectedDatePrefix)).toBe(true);
	});

	it("produces filesystem-safe names (no colons or periods)", () => {
		const result = formatArchiveDirectory(new Date());

		expect(result).not.toContain(":");
		expect(result).not.toContain(".");
	});

	it("produces exactly 19 characters", () => {
		const result = formatArchiveDirectory(new Date());

		// Format: YYYY-MM-DDTHH-MM-SS = 19 chars
		expect(result.length).toBe(19);
	});
});

describe("createSessionHeader", () => {
	it("creates header with all required fields", () => {
		const header = createSessionHeader("run-abc123-xyz9", 1362, "sbx-a");

		expect(header).toContain("run-abc123-xyz9");
		expect(header).toContain("1362");
		expect(header).toContain("sbx-a");
		expect(header).toContain("Alpha Orchestrator Log");
	});

	it("includes separator lines", () => {
		const header = createSessionHeader("run-test-1234", 100, "sbx-b");

		// Should contain lines of = characters (80 chars)
		expect(header).toContain("=".repeat(80));
	});

	it("includes ISO timestamp", () => {
		const before = new Date().toISOString().slice(0, 10);
		const header = createSessionHeader("run-test-1234", 100, "sbx-a");

		// Header should contain today's date in ISO format
		expect(header).toContain(before);
	});

	it("formats correctly with different sandbox labels", () => {
		const headerA = createSessionHeader("run-test-1234", 100, "sbx-a");
		const headerB = createSessionHeader("run-test-1234", 100, "sbx-b");
		const headerC = createSessionHeader("run-test-1234", 100, "sbx-c");

		expect(headerA).toContain("Sandbox: sbx-a");
		expect(headerB).toContain("Sandbox: sbx-b");
		expect(headerC).toContain("Sandbox: sbx-c");
	});
});

describe("parseRunIdTimestamp", () => {
	it("parses valid run ID to Date", () => {
		const timestamp = Date.now();
		const timestampBase36 = timestamp.toString(36);
		const runId = `run-${timestampBase36}-abcd`;

		const result = parseRunIdTimestamp(runId);

		expect(result).toBeInstanceOf(Date);
		if (!result) throw new Error("Result is null");
		expect(result.getTime()).toBe(timestamp);
	});

	it("returns null for invalid format - missing prefix", () => {
		const result = parseRunIdTimestamp("abc-123-abcd");

		expect(result).toBeNull();
	});

	it("parses run IDs with different random lengths", () => {
		// parseRunIdTimestamp allows variable-length random portions
		// Only the format matters: run-{timestamp}-{random}
		const result = parseRunIdTimestamp("run-abc123-ab");

		// This is valid because the regex doesn't enforce 4-char random
		// The timestamp "abc123" is valid base36
		expect(result).toBeInstanceOf(Date);
	});

	it("returns null for invalid format - wrong separator count", () => {
		const result = parseRunIdTimestamp("run-abc123");

		expect(result).toBeNull();
	});

	it("returns null for empty string", () => {
		const result = parseRunIdTimestamp("");

		expect(result).toBeNull();
	});

	it("returns null for malformed timestamp portion", () => {
		// Invalid base36 characters (uppercase not allowed in our format)
		const result = parseRunIdTimestamp("run-ABC123-abcd");

		expect(result).toBeNull();
	});

	it("correctly parses timestamps from generateRunId", () => {
		const before = Date.now();
		const runId = generateRunId();
		const after = Date.now();

		const parsed = parseRunIdTimestamp(runId);

		expect(parsed).not.toBeNull();
		if (!parsed) throw new Error("Parsed timestamp is null");
		expect(parsed.getTime()).toBeGreaterThanOrEqual(before);
		expect(parsed.getTime()).toBeLessThanOrEqual(after);
	});
});

describe("isValidRunId", () => {
	it("returns true for valid run IDs", () => {
		expect(isValidRunId("run-abc123-abcd")).toBe(true);
		expect(isValidRunId("run-m5x7k2-a3b9")).toBe(true);
		expect(isValidRunId("run-0-0000")).toBe(true);
	});

	it("returns true for generated run IDs", () => {
		for (let i = 0; i < 10; i++) {
			const runId = generateRunId();
			expect(isValidRunId(runId)).toBe(true);
		}
	});

	it("returns false for missing prefix", () => {
		expect(isValidRunId("abc-123-abcd")).toBe(false);
	});

	it("returns false for wrong random portion length", () => {
		expect(isValidRunId("run-abc123-abc")).toBe(false); // 3 chars instead of 4
		expect(isValidRunId("run-abc123-abcde")).toBe(false); // 5 chars instead of 4
	});

	it("returns false for uppercase characters", () => {
		expect(isValidRunId("run-ABC123-abcd")).toBe(false);
		expect(isValidRunId("run-abc123-ABCD")).toBe(false);
	});

	it("returns false for empty string", () => {
		expect(isValidRunId("")).toBe(false);
	});

	it("returns false for invalid separators", () => {
		expect(isValidRunId("run_abc123_abcd")).toBe(false);
		expect(isValidRunId("run.abc123.abcd")).toBe(false);
	});

	it("returns false for missing timestamp portion", () => {
		expect(isValidRunId("run--abcd")).toBe(false);
	});
});
