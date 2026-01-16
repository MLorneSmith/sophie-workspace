/**
 * Port Health Check Unit Tests
 *
 * Tests for isPortOpen and waitForPort functions.
 */

import * as net from "node:net";
import { afterEach, describe, expect, it } from "vitest";

import { isPortOpen, waitForDevServer, waitForPort } from "../port-health.js";

describe("port-health", () => {
	describe("isPortOpen", () => {
		let testServer: net.Server | null = null;
		const testPort = 19999;

		afterEach(async () => {
			if (testServer) {
				await new Promise<void>((resolve) => {
					testServer?.close(() => resolve());
				});
				testServer = null;
			}
		});

		it("should return false for a closed port", async () => {
			const result = await isPortOpen(19998, "localhost", 500);
			expect(result).toBe(false);
		});

		it("should return true for an open port", async () => {
			// Start a test server
			testServer = net.createServer().listen(testPort);

			// Wait for server to be ready
			await new Promise<void>((resolve) => {
				testServer?.once("listening", resolve);
			});

			const result = await isPortOpen(testPort, "localhost", 1000);
			expect(result).toBe(true);
		});

		it("should return false on connection timeout", async () => {
			// Use a very short timeout to test timeout behavior
			const result = await isPortOpen(19997, "localhost", 1);
			expect(result).toBe(false);
		});
	});

	describe("waitForPort", () => {
		it("should return false if port never opens within timeout", async () => {
			const result = await waitForPort(19996, 500, 100);
			expect(result).toBe(false);
		});

		it("should return true immediately if port is already open", async () => {
			const server = net.createServer().listen(19995);

			await new Promise<void>((resolve) => {
				server.once("listening", resolve);
			});

			const result = await waitForPort(19995, 5000, 100);
			expect(result).toBe(true);

			server.close();
		});

		it("should poll at regular intervals", async () => {
			const startTime = Date.now();
			await waitForPort(19994, 400, 100);
			const elapsed = Date.now() - startTime;

			// Should have waited close to the timeout
			expect(elapsed).toBeGreaterThanOrEqual(350);
			expect(elapsed).toBeLessThan(600);
		});
	});

	describe("waitForDevServer", () => {
		it("should be exported and callable", () => {
			expect(typeof waitForDevServer).toBe("function");
		});

		it("should return false if dev server not running", async () => {
			// This test assumes no dev server is running on port 3000
			const result = await waitForDevServer(500);
			expect(result).toBe(false);
		});
	});
});
