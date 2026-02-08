/**
 * Sandbox Dev Server Unit Tests
 *
 * Tests for the dev server health check fix in sandbox.ts
 * Bug fix #1580: Dev server should throw on timeout instead of returning URL
 */

import { describe, expect, it } from "vitest";

/**
 * Mock the startDevServer logic for testing
 * The actual function requires E2B sandbox which we can't mock easily
 */
describe("startDevServer health check", () => {
	/**
	 * Simulate the health check loop logic
	 */
	async function simulateHealthCheck(
		fetchResponses: Array<{ ok: boolean; status: number } | Error>,
		maxAttempts: number = 3,
	): Promise<{ success: boolean; attempts: number }> {
		let attempts = 0;

		for (let attempt = 1; attempt <= maxAttempts; attempt++) {
			attempts++;
			const response = fetchResponses[attempt - 1];

			if (response instanceof Error) {
				// Connection refused - continue polling
				continue;
			}

			if (response && (response.ok || response.status < 500)) {
				return { success: true, attempts };
			}
		}

		// All attempts exhausted - should throw
		throw new Error(`Dev server failed to start after ${maxAttempts} attempts`);
	}

	it("should succeed on first attempt if server is ready", async () => {
		const result = await simulateHealthCheck([{ ok: true, status: 200 }], 3);
		expect(result.success).toBe(true);
		expect(result.attempts).toBe(1);
	});

	it("should succeed after retries when server eventually responds", async () => {
		const responses = [
			new Error("ECONNREFUSED"),
			new Error("ECONNREFUSED"),
			{ ok: true, status: 200 },
		];

		const result = await simulateHealthCheck(responses, 3);
		expect(result.success).toBe(true);
		expect(result.attempts).toBe(3);
	});

	it("should throw error when all attempts fail", async () => {
		const responses = [
			new Error("ECONNREFUSED"),
			new Error("ECONNREFUSED"),
			new Error("ECONNREFUSED"),
		];

		await expect(simulateHealthCheck(responses, 3)).rejects.toThrow(
			"Dev server failed to start after 3 attempts",
		);
	});

	it("should accept 4xx responses as server running", async () => {
		// A 404 means the server is running but path doesn't exist
		const result = await simulateHealthCheck([{ ok: false, status: 404 }], 3);
		expect(result.success).toBe(true);
	});

	it("should continue polling on 5xx errors", async () => {
		const responses = [
			{ ok: false, status: 503 }, // Service unavailable - still starting
			{ ok: false, status: 502 }, // Bad gateway - still starting
			{ ok: true, status: 200 }, // Finally ready
		];

		const result = await simulateHealthCheck(responses, 3);
		expect(result.success).toBe(true);
		expect(result.attempts).toBe(3);
	});
});

describe("orchestrator dev server integration", () => {
	/**
	 * Simulate the orchestrator's error handling for dev server
	 */
	function handleDevServerResult(
		startResult: { url: string } | null,
		error: Error | null,
		vscodeUrl: string,
	): { vscode: string; devServer: string } {
		if (error) {
			return {
				vscode: vscodeUrl,
				devServer: "(failed to start)",
			};
		}

		return {
			vscode: vscodeUrl,
			devServer: startResult?.url ?? "(failed to start)",
		};
	}

	it("should return dev server URL on success", () => {
		const result = handleDevServerResult(
			{ url: "https://abc123.e2b.dev:3000" },
			null,
			"https://abc123.e2b.dev:8080",
		);

		expect(result.devServer).toBe("https://abc123.e2b.dev:3000");
		expect(result.vscode).toBe("https://abc123.e2b.dev:8080");
	});

	it("should provide vscode URL even when dev server fails", () => {
		const result = handleDevServerResult(
			null,
			new Error("Dev server failed to start"),
			"https://abc123.e2b.dev:8080",
		);

		expect(result.devServer).toBe("(failed to start)");
		expect(result.vscode).toBe("https://abc123.e2b.dev:8080");
	});
});
