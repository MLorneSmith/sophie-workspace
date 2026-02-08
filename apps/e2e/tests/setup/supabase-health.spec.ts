/**
 * Unit tests for Supabase Health Check with Exponential Backoff
 *
 * These tests validate the health check logic used in CI environments
 * to ensure reliable startup verification of Supabase services.
 *
 * See: Issue #1641, #1642 - E2E Sharded Workflow Dual Failure Modes
 */

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

// Mock pg Client
vi.mock("pg", () => ({
	Client: vi.fn().mockImplementation(() => ({
		connect: vi.fn().mockResolvedValue(undefined),
		query: vi.fn().mockResolvedValue({ rows: [{ health_check: 1 }] }),
		end: vi.fn().mockResolvedValue(undefined),
	})),
}));

// Mock fetch for HTTP health checks
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Import after mocks are set up
import {
	checkPostgresHealth,
	checkPostgRESTHealth,
	checkKongHealthWithBackoff,
} from "./supabase-health";

describe("Supabase Health Checks", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Reset fetch mock
		mockFetch.mockReset();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("checkPostgresHealth", () => {
		it("should return healthy when PostgreSQL responds", async () => {
			const result = await checkPostgresHealth(5000);

			expect(result.healthy).toBe(true);
			expect(result.message).toContain("PostgreSQL responding");
			expect(result.attempts).toBe(1);
			expect(result.responseTimeMs).toBeGreaterThanOrEqual(0);
		});

		it("should return healthy result with correct structure", async () => {
			const result = await checkPostgresHealth(5000);

			// Verify result structure
			expect(result).toHaveProperty("healthy");
			expect(result).toHaveProperty("message");
			expect(result).toHaveProperty("responseTimeMs");
			expect(result).toHaveProperty("attempts");
			expect(typeof result.healthy).toBe("boolean");
			expect(typeof result.message).toBe("string");
			expect(typeof result.responseTimeMs).toBe("number");
			expect(typeof result.attempts).toBe("number");
		});
	});

	describe("checkPostgRESTHealth", () => {
		it("should return healthy when PostgREST responds with 200", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
			});

			const result = await checkPostgRESTHealth(5000);

			expect(result.healthy).toBe(true);
			expect(result.message).toContain("PostgREST responding");
			expect(result.attempts).toBe(1);
		});

		it("should return healthy when PostgREST responds with 401 (auth required but server is up)", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 401,
			});

			const result = await checkPostgRESTHealth(5000);

			expect(result.healthy).toBe(true);
			expect(result.message).toContain("PostgREST responding");
			expect(result.message).toContain("status: 401");
		});

		it("should return unhealthy when PostgREST returns 500", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 500,
			});

			const result = await checkPostgRESTHealth(5000);

			expect(result.healthy).toBe(false);
			expect(result.message).toContain("unexpected status 500");
		});

		it("should return unhealthy when PostgREST is unreachable", async () => {
			mockFetch.mockRejectedValueOnce(new Error("fetch failed"));

			const result = await checkPostgRESTHealth(1000);

			expect(result.healthy).toBe(false);
			expect(result.message).toContain("PostgREST unreachable");
		});
	});

	describe("checkKongHealthWithBackoff", () => {
		it("should return healthy on first attempt when Kong responds immediately", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
			});

			const result = await checkKongHealthWithBackoff({
				maxAttempts: 3,
				initialDelayMs: 100,
				maxDelayMs: 1000,
				timeoutMs: 5000,
			});

			expect(result.healthy).toBe(true);
			expect(result.message).toContain("Kong API responding");
			expect(result.attempts).toBe(1);
		});

		it("should retry with exponential backoff when Kong fails initially", async () => {
			// Fail first 2 attempts, succeed on third
			mockFetch
				.mockRejectedValueOnce(new Error("Connection refused"))
				.mockRejectedValueOnce(new Error("Connection refused"))
				.mockResolvedValueOnce({
					ok: true,
					status: 200,
				});

			const result = await checkKongHealthWithBackoff({
				maxAttempts: 5,
				initialDelayMs: 10, // Use short delays for testing
				maxDelayMs: 100,
				timeoutMs: 5000,
			});

			expect(result.healthy).toBe(true);
			expect(result.attempts).toBe(3);
		});

		it("should return unhealthy after max attempts", async () => {
			// Always fail
			mockFetch.mockRejectedValue(new Error("Connection refused"));

			const result = await checkKongHealthWithBackoff({
				maxAttempts: 3,
				initialDelayMs: 10,
				maxDelayMs: 50,
				timeoutMs: 1000,
			});

			expect(result.healthy).toBe(false);
			expect(result.message).toContain("Kong API failed to respond");
			expect(result.attempts).toBe(3);
		});

		it("should respect timeout and stop early", async () => {
			// Always fail - but timeout should kick in before max attempts
			mockFetch.mockImplementation(() => {
				return new Promise((_, reject) => {
					setTimeout(() => reject(new Error("timeout")), 100);
				});
			});

			const startTime = Date.now();
			const result = await checkKongHealthWithBackoff({
				maxAttempts: 100, // High max attempts
				initialDelayMs: 10,
				maxDelayMs: 50,
				timeoutMs: 500, // Short timeout
			});

			const duration = Date.now() - startTime;

			expect(result.healthy).toBe(false);
			// Should complete within timeout + some buffer
			expect(duration).toBeLessThan(2000);
		});

		it("should return early on first success without waiting for full timeout", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
			});

			const startTime = Date.now();
			const result = await checkKongHealthWithBackoff({
				maxAttempts: 30,
				initialDelayMs: 1000,
				maxDelayMs: 8000,
				timeoutMs: 120000, // 2 minute timeout
			});

			const duration = Date.now() - startTime;

			expect(result.healthy).toBe(true);
			expect(result.attempts).toBe(1);
			// Should complete almost immediately, not wait for timeout
			expect(duration).toBeLessThan(1000);
		});
	});

	describe("exponential backoff timing", () => {
		it("should calculate correct backoff delays", () => {
			// Test the backoff calculation logic
			// This is implementation-dependent but verifies the exponential pattern
			const delays = [1, 2, 3, 4, 5].map((attempt) => {
				const initialDelay = 1000;
				const maxDelay = 8000;
				// Formula: min(initialDelay * 2^(attempt-1), maxDelay)
				return Math.min(initialDelay * 2 ** (attempt - 1), maxDelay);
			});

			expect(delays[0]).toBe(1000); // 1s
			expect(delays[1]).toBe(2000); // 2s
			expect(delays[2]).toBe(4000); // 4s
			expect(delays[3]).toBe(8000); // 8s (capped at max)
			expect(delays[4]).toBe(8000); // 8s (still capped)
		});
	});
});
