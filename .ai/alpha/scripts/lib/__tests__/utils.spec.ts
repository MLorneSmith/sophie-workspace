/**
 * Utils Unit Tests
 *
 * Tests for utility functions including timeout wrappers and ANSI code stripping.
 */

import { describe, expect, it } from "vitest";

import { sleep, stripAnsiCodes, withTimeout } from "../utils.js";

describe("sleep", () => {
	it("should resolve after the specified delay", async () => {
		const start = Date.now();
		await sleep(50);
		const elapsed = Date.now() - start;
		expect(elapsed).toBeGreaterThanOrEqual(40); // Allow some margin
		expect(elapsed).toBeLessThan(150);
	});
});

describe("withTimeout", () => {
	it("should resolve with the promise value if it completes before timeout", async () => {
		const promise = Promise.resolve("success");
		const result = await withTimeout(promise, 1000, "test operation");
		expect(result).toBe("success");
	});

	it("should resolve with async operation result before timeout", async () => {
		const promise = new Promise<string>((resolve) => {
			setTimeout(() => resolve("async success"), 50);
		});
		const result = await withTimeout(promise, 1000, "async operation");
		expect(result).toBe("async success");
	});

	it("should reject with timeout error if promise takes too long", async () => {
		const promise = new Promise<string>((resolve) => {
			setTimeout(() => resolve("too late"), 500);
		});

		await expect(withTimeout(promise, 50, "slow operation")).rejects.toThrow(
			"Timeout after 50ms: slow operation",
		);
	});

	it("should include the label in timeout error message", async () => {
		const promise = new Promise<never>(() => {
			// Never resolves
		});

		await expect(withTimeout(promise, 10, "my custom label")).rejects.toThrow(
			"my custom label",
		);
	});

	it("should propagate errors from the original promise", async () => {
		const promise = Promise.reject(new Error("original error"));

		await expect(withTimeout(promise, 1000, "error test")).rejects.toThrow(
			"original error",
		);
	});

	it("should handle promises that reject before timeout", async () => {
		const promise = new Promise<never>((_, reject) => {
			setTimeout(() => reject(new Error("rejected early")), 20);
		});

		await expect(withTimeout(promise, 1000, "reject test")).rejects.toThrow(
			"rejected early",
		);
	});
});

describe("stripAnsiCodes", () => {
	it("should return text unchanged if no ANSI codes present", () => {
		const input = "Hello, World!";
		expect(stripAnsiCodes(input)).toBe("Hello, World!");
	});

	it("should strip standard ANSI color codes", () => {
		// Red text
		const red = "\x1b[31mError\x1b[0m";
		expect(stripAnsiCodes(red)).toBe("Error");

		// Green text
		const green = "\x1b[32mSuccess\x1b[0m";
		expect(stripAnsiCodes(green)).toBe("Success");

		// Bold yellow
		const boldYellow = "\x1b[1;33mWarning\x1b[0m";
		expect(stripAnsiCodes(boldYellow)).toBe("Warning");
	});

	it("should strip multiple color codes in one string", () => {
		const mixed = "\x1b[32m✓\x1b[0m Test passed \x1b[31m✗\x1b[0m Test failed";
		expect(stripAnsiCodes(mixed)).toBe("✓ Test passed ✗ Test failed");
	});

	it("should strip cursor movement codes", () => {
		// Cursor up
		const cursorUp = "Line 1\x1b[1ALine 2";
		expect(stripAnsiCodes(cursorUp)).toBe("Line 1Line 2");

		// Cursor down
		const cursorDown = "Line 1\x1b[2BLine 2";
		expect(stripAnsiCodes(cursorDown)).toBe("Line 1Line 2");
	});

	it("should strip escaped bracket sequences from JSON output", () => {
		// Common pattern from JSON-escaped terminal output
		const escaped = "^[[01;32mSuccess^[[0m";
		expect(stripAnsiCodes(escaped)).toBe("Success");
	});

	it("should strip private mode sequences", () => {
		// Application cursor keys mode
		const privateMode = "\x1b[?1hContent\x1b[?1l";
		expect(stripAnsiCodes(privateMode)).toBe("Content");
	});

	it("should handle empty string", () => {
		expect(stripAnsiCodes("")).toBe("");
	});

	it("should handle strings with only ANSI codes", () => {
		const onlyCodes = "\x1b[31m\x1b[0m";
		expect(stripAnsiCodes(onlyCodes)).toBe("");
	});

	it("should preserve multiline text structure", () => {
		const multiline = "\x1b[32mLine 1\x1b[0m\n\x1b[33mLine 2\x1b[0m";
		expect(stripAnsiCodes(multiline)).toBe("Line 1\nLine 2");
	});

	it("should strip 256-color codes", () => {
		// 256 color foreground (color 196 = red)
		const color256 = "\x1b[38;5;196mRed text\x1b[0m";
		expect(stripAnsiCodes(color256)).toBe("Red text");
	});

	it("should strip RGB color codes", () => {
		// 24-bit RGB foreground
		const rgb = "\x1b[38;2;255;100;50mOrange text\x1b[0m";
		expect(stripAnsiCodes(rgb)).toBe("Orange text");
	});

	it("should handle real sandbox output patterns", () => {
		// Example from actual sandbox output
		const sandboxOutput =
			"^[[?2004huser@sandbox:~$ pnpm dev^[[?2004l\r\n^[[01;32mReady^[[0m";
		const result = stripAnsiCodes(sandboxOutput);
		// Should remove escape codes but preserve meaningful text
		expect(result).not.toContain("^[[");
		expect(result).not.toContain("\x1b[");
		expect(result).toContain("Ready");
	});
});
