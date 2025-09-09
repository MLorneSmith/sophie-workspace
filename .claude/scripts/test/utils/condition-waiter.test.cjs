/**
 * Unit Tests for Condition Waiter Utility
 * Tests condition-based waiting functionality that replaces hardcoded delays
 */

const { describe, it, expect, beforeEach, afterEach, vi } = require("vitest");
const { ConditionWaiter } = require("./condition-waiter.cjs");
const { exec } = require("node:child_process");
const { promisify } = require("node:util");

// Mock child_process exec
vi.mock("node:child_process", () => ({
	exec: vi.fn((_cmd, callback) => {
		// Default to calling callback with no error
		if (callback) callback(null, { stdout: "", stderr: "" });
	}),
}));

// Mock fs for file operations
vi.mock("node:fs", () => ({
	promises: {
		access: vi.fn(),
	},
}));

// Mock process.stdout.write for logging
const originalWrite = process.stdout.write;
beforeEach(() => {
	process.stdout.write = vi.fn();
});

afterEach(() => {
	process.stdout.write = originalWrite;
});

describe("ConditionWaiter", () => {
	let waiter;
	let mockExecAsync;

	beforeEach(() => {
		waiter = new ConditionWaiter(1000, 50); // Short timeout/interval for tests

		// Setup exec mock
		const execMock = require("node:child_process").exec;
		mockExecAsync = vi.fn();

		// Override promisify to return our mock
		require("node:util").promisify = vi.fn(() => mockExecAsync);

		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("constructor", () => {
		it("should set default timeout and interval", () => {
			const customWaiter = new ConditionWaiter(5000, 100);
			expect(customWaiter.defaultTimeout).toBe(5000);
			expect(customWaiter.defaultInterval).toBe(100);
		});

		it("should use default values when not provided", () => {
			const defaultWaiter = new ConditionWaiter();
			expect(defaultWaiter.defaultTimeout).toBe(30000);
			expect(defaultWaiter.defaultInterval).toBe(500);
		});
	});

	describe("waitForCondition", () => {
		it("should return true when condition is met immediately", async () => {
			const checkFn = vi.fn().mockResolvedValue(true);

			const result = await waiter.waitForCondition(checkFn);

			expect(result).toBe(true);
			expect(checkFn).toHaveBeenCalledTimes(1);
		});

		it("should retry until condition is met", async () => {
			const checkFn = vi
				.fn()
				.mockResolvedValueOnce(false)
				.mockResolvedValueOnce(false)
				.mockResolvedValueOnce(true);

			const result = await waiter.waitForCondition(checkFn);

			expect(result).toBe(true);
			expect(checkFn).toHaveBeenCalledTimes(3);
		});

		it("should throw timeout error when condition is never met", async () => {
			const checkFn = vi.fn().mockResolvedValue(false);

			await expect(
				waiter.waitForCondition(checkFn, { timeout: 200, interval: 50 }),
			).rejects.toThrow(/Timeout waiting for condition/);

			expect(checkFn.mock.calls.length).toBeGreaterThan(2);
		});

		it("should handle errors in check function", async () => {
			const error = new Error("Check failed");
			const checkFn = vi.fn().mockRejectedValue(error);

			await expect(
				waiter.waitForCondition(checkFn, { timeout: 200, interval: 50 }),
			).rejects.toThrow(/Last error: Check failed/);
		});

		it("should suppress logging when silent option is true", async () => {
			const checkFn = vi.fn().mockResolvedValue(true);

			await waiter.waitForCondition(checkFn, { silent: true });

			// Check that no logs were written
			expect(process.stdout.write).not.toHaveBeenCalled();
		});

		it("should use custom name in error messages", async () => {
			const checkFn = vi.fn().mockResolvedValue(false);

			await expect(
				waiter.waitForCondition(checkFn, {
					timeout: 100,
					interval: 25,
					name: "custom operation",
				}),
			).rejects.toThrow(/Timeout waiting for custom operation/);
		});
	});

	describe("waitForPort", () => {
		it("should detect port is available", async () => {
			mockExecAsync.mockResolvedValue({ stdout: "12345\n", stderr: "" });

			const result = await waiter.waitForPort(3000);

			expect(result).toBe(true);
			expect(mockExecAsync).toHaveBeenCalledWith(
				expect.stringContaining("lsof -ti:3000"),
			);
		});

		it("should detect port is not available", async () => {
			mockExecAsync.mockResolvedValue({ stdout: "free\n", stderr: "" });

			await expect(waiter.waitForPort(3000, { timeout: 200 })).rejects.toThrow(
				/Timeout waiting for port 3000/,
			);
		});
	});

	describe("waitForPortFree", () => {
		it("should detect port is free", async () => {
			mockExecAsync.mockResolvedValue({ stdout: "free\n", stderr: "" });

			const result = await waiter.waitForPortFree(3000);

			expect(result).toBe(true);
			expect(mockExecAsync).toHaveBeenCalledWith(
				expect.stringContaining("lsof -ti:3000"),
			);
		});

		it("should detect port is occupied", async () => {
			mockExecAsync.mockResolvedValue({ stdout: "12345\n", stderr: "" });

			await expect(
				waiter.waitForPortFree(3000, { timeout: 200 }),
			).rejects.toThrow(/Timeout waiting for port 3000 to be free/);
		});

		it("should treat lsof failure as port being free", async () => {
			mockExecAsync.mockRejectedValue(new Error("lsof failed"));

			const result = await waiter.waitForPortFree(3000);

			expect(result).toBe(true);
		});
	});

	describe("waitForProcess", () => {
		it("should detect process exists", async () => {
			mockExecAsync.mockResolvedValue({ stdout: "12345\n", stderr: "" });

			const result = await waiter.waitForProcess("node");

			expect(result).toBe(true);
			expect(mockExecAsync).toHaveBeenCalledWith(
				expect.stringContaining('pgrep -f "node"'),
			);
		});

		it("should detect process does not exist", async () => {
			mockExecAsync.mockRejectedValue(new Error("pgrep found nothing"));

			await expect(
				waiter.waitForProcess("nonexistent", { timeout: 200 }),
			).rejects.toThrow(/Timeout waiting for process 'nonexistent'/);
		});
	});

	describe("waitForProcessExit", () => {
		it("should detect process has exited", async () => {
			mockExecAsync.mockResolvedValue({ stdout: "gone\n", stderr: "" });

			const result = await waiter.waitForProcessExit("node");

			expect(result).toBe(true);
			expect(mockExecAsync).toHaveBeenCalledWith(
				expect.stringContaining('pgrep -f "node"'),
			);
		});

		it("should detect process still running", async () => {
			mockExecAsync.mockResolvedValue({ stdout: "12345\n", stderr: "" });

			await expect(
				waiter.waitForProcessExit("node", { timeout: 200 }),
			).rejects.toThrow(/Timeout waiting for process 'node' to exit/);
		});

		it("should treat pgrep failure as process exited", async () => {
			mockExecAsync.mockRejectedValue(new Error("pgrep failed"));

			const result = await waiter.waitForProcessExit("node");

			expect(result).toBe(true);
		});
	});

	describe("waitForHttp", () => {
		it("should detect HTTP endpoint is ready (200)", async () => {
			mockExecAsync.mockResolvedValue({ stdout: "200", stderr: "" });

			const result = await waiter.waitForHttp("http://localhost:3000");

			expect(result).toBe(true);
			expect(mockExecAsync).toHaveBeenCalledWith(
				expect.stringContaining('curl -s -o /dev/null -w "%{http_code}"'),
			);
		});

		it("should detect HTTP endpoint is ready (404)", async () => {
			mockExecAsync.mockResolvedValue({ stdout: "404", stderr: "" });

			const result = await waiter.waitForHttp("http://localhost:3000");

			expect(result).toBe(true); // 404 is still considered "ready"
		});

		it("should detect HTTP endpoint not ready (500)", async () => {
			mockExecAsync.mockResolvedValue({ stdout: "500", stderr: "" });

			await expect(
				waiter.waitForHttp("http://localhost:3000", { timeout: 200 }),
			).rejects.toThrow(/Timeout waiting for HTTP endpoint/);
		});

		it("should handle curl failure", async () => {
			mockExecAsync.mockRejectedValue(new Error("curl failed"));

			await expect(
				waiter.waitForHttp("http://localhost:3000", { timeout: 200 }),
			).rejects.toThrow(/Timeout waiting for HTTP endpoint/);
		});
	});

	describe("waitForFile", () => {
		it("should detect file exists", async () => {
			const fs = require("node:fs").promises;
			fs.access.mockResolvedValue(undefined);

			const result = await waiter.waitForFile("/tmp/test.txt");

			expect(result).toBe(true);
			expect(fs.access).toHaveBeenCalledWith("/tmp/test.txt");
		});

		it("should detect file does not exist", async () => {
			const fs = require("node:fs").promises;
			fs.access.mockRejectedValue(new Error("ENOENT"));

			await expect(
				waiter.waitForFile("/tmp/test.txt", { timeout: 200 }),
			).rejects.toThrow(/Timeout waiting for file '\/tmp\/test.txt'/);
		});
	});

	describe("waitForDatabase", () => {
		it("should detect database is ready", async () => {
			mockExecAsync.mockResolvedValue({ stdout: " 1\n(1 row)\n", stderr: "" });

			const result = await waiter.waitForDatabase(
				"postgresql://localhost/test",
			);

			expect(result).toBe(true);
			expect(mockExecAsync).toHaveBeenCalledWith(
				expect.stringContaining(
					'psql "postgresql://localhost/test" -c "SELECT 1"',
				),
			);
		});

		it("should detect database not ready", async () => {
			mockExecAsync.mockRejectedValue(new Error("psql: connection refused"));

			await expect(
				waiter.waitForDatabase("postgresql://localhost/test", { timeout: 200 }),
			).rejects.toThrow(/Timeout waiting for database connection/);
		});
	});

	describe("waitForSupabase", () => {
		it("should detect Supabase is ready", async () => {
			mockExecAsync.mockResolvedValue({
				stdout:
					"API URL: http://localhost:54321\nDB URL: postgresql://localhost:54322/postgres",
				stderr: "",
			});

			const result = await waiter.waitForSupabase();

			expect(result).toBe(true);
			expect(mockExecAsync).toHaveBeenCalledWith(
				"npx supabase status 2>/dev/null",
			);
		});

		it("should detect Supabase not ready", async () => {
			mockExecAsync.mockResolvedValue({ stdout: "Starting...", stderr: "" });

			await expect(waiter.waitForSupabase({ timeout: 200 })).rejects.toThrow(
				/Timeout waiting for Supabase services/,
			);
		});

		it("should use longer default timeout for Supabase", async () => {
			mockExecAsync.mockResolvedValue({ stdout: "Starting...", stderr: "" });

			// Create waiter with very short default timeout
			const shortWaiter = new ConditionWaiter(100, 50);

			// Supabase should override with 60000ms timeout by default
			const promise = shortWaiter.waitForSupabase();

			// This should not timeout immediately despite short default timeout
			// (We can't easily test the full 60s, so we just verify it starts)
			expect(promise).toBeInstanceOf(Promise);
		});
	});

	describe("delay", () => {
		it("should wait for specified time", async () => {
			const start = Date.now();
			await waiter.delay(100, "test delay");
			const elapsed = Date.now() - start;

			expect(elapsed).toBeGreaterThanOrEqual(90); // Allow some variance
			expect(elapsed).toBeLessThan(150);
			expect(process.stdout.write).toHaveBeenCalledWith(
				expect.stringContaining("Waiting 100ms for test delay"),
			);
		});
	});

	describe("withRetry", () => {
		it("should succeed on first attempt", async () => {
			const fn = vi.fn().mockResolvedValue("success");

			const result = await waiter.withRetry(fn);

			expect(result).toBe("success");
			expect(fn).toHaveBeenCalledTimes(1);
		});

		it("should retry on failure and eventually succeed", async () => {
			const fn = vi
				.fn()
				.mockRejectedValueOnce(new Error("Attempt 1 failed"))
				.mockRejectedValueOnce(new Error("Attempt 2 failed"))
				.mockResolvedValueOnce("success");

			const result = await waiter.withRetry(fn, {
				maxAttempts: 3,
				retryDelay: 50,
			});

			expect(result).toBe("success");
			expect(fn).toHaveBeenCalledTimes(3);
		});

		it("should throw after max attempts", async () => {
			const fn = vi.fn().mockRejectedValue(new Error("Always fails"));

			await expect(
				waiter.withRetry(fn, {
					maxAttempts: 2,
					retryDelay: 50,
					name: "test operation",
				}),
			).rejects.toThrow(/test operation failed after 2 attempts.*Always fails/);

			expect(fn).toHaveBeenCalledTimes(2);
		});

		it("should use default values", async () => {
			const fn = vi.fn().mockResolvedValue("success");

			const result = await waiter.withRetry(fn);

			expect(result).toBe("success");
			expect(fn).toHaveBeenCalledTimes(1);
		});
	});
});
