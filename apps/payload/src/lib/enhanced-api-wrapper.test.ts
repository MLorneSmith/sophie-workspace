/**
 * Unit tests for enhanced-api-wrapper.ts
 * Tests the EnhancedAPIManager class and related functionality
 */

import type { EnvironmentLogger } from "@kit/shared/logger";
import { type NextRequest, NextResponse } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock dependencies
vi.mock("@kit/shared/logger", () => ({
	createEnvironmentLogger: vi.fn(() => ({
		info: vi.fn(),
		error: vi.fn(),
		warn: vi.fn(),
		debug: vi.fn(),
	})),
}));

vi.mock("@payloadcms/next/routes", () => ({
	REST_GET: vi.fn(),
	REST_POST: vi.fn(),
	REST_DELETE: vi.fn(),
	REST_PATCH: vi.fn(),
	REST_PUT: vi.fn(),
	REST_OPTIONS: vi.fn(),
}));

import { createEnvironmentLogger } from "@kit/shared/logger";
import {
	REST_DELETE,
	REST_GET,
	REST_OPTIONS,
	REST_PATCH,
	REST_POST,
	REST_PUT,
} from "@payloadcms/next/routes";
// Import after mocks
import {
	clearAPIErrorLog,
	createEnhancedPayloadHandlers,
	getAPIMetrics,
	getEnhancedAPIManager,
	getRecentAPIErrors,
} from "./enhanced-api-wrapper";

// Types for mocked values
class MockEnvironmentLogger {
	config = {
		enableLogging: true,
		logLevel: "info" as const,
		environment: "test",
		serviceName: "test-service",
	};
	levels = { debug: 0, info: 1, warn: 2, error: 3 };
	info = vi.fn();
	error = vi.fn();
	warn = vi.fn();
	debug = vi.fn();
	log = vi.fn();
	sanitizeData = vi.fn((data: unknown) => data);
}

type OriginalDateNow = typeof Date.now;
type OriginalMathRandom = typeof Math.random;

describe("EnhancedAPIManager", () => {
	let mockLogger: MockEnvironmentLogger;
	let originalDateNow: OriginalDateNow;
	let originalMathRandom: OriginalMathRandom;
	let mockDate: Date;

	beforeEach(() => {
		// Clear global singleton
		globalThis.__enhanced_api_manager = undefined;

		// Reset all mocks
		vi.clearAllMocks();

		// Mock logger
		mockLogger = new MockEnvironmentLogger();
		vi.mocked(createEnvironmentLogger).mockReturnValue(
			mockLogger as unknown as EnvironmentLogger,
		);

		// Mock Date.now for consistent timing
		mockDate = new Date("2023-01-01T12:00:00.000Z");
		originalDateNow = Date.now;
		Date.now = vi.fn(() => mockDate.getTime());

		// Mock Math.random for predictable request IDs
		originalMathRandom = Math.random;
		let counter = 0;
		Math.random = vi.fn(() => {
			counter++;
			return 0.123456789 + counter * 0.001; // Make each call slightly different
		});
	});

	afterEach(() => {
		// Restore original functions
		Date.now = originalDateNow;
		Math.random = originalMathRandom;
		globalThis.__enhanced_api_manager = undefined;
	});

	describe("Constructor and Initialization", () => {
		it("should initialize metrics correctly", () => {
			const manager = getEnhancedAPIManager();
			const metrics = manager.getMetrics();

			expect(metrics.totalRequests).toBe(0);
			expect(metrics.successfulRequests).toBe(0);
			expect(metrics.failedRequests).toBe(0);
			expect(metrics.averageResponseTime).toBe(0);
			expect(metrics.deduplicatedRequests).toBe(0);
			expect(metrics.lastRequestTime).toBeInstanceOf(Date);
		});

		it("should create environment logger with correct namespace", () => {
			getEnhancedAPIManager();

			expect(createEnvironmentLogger).toHaveBeenCalledWith("ENHANCED-API");
			expect(mockLogger.info).toHaveBeenCalledWith(
				"Enhanced API Manager initialized",
			);
		});
	});

	describe("Request ID Generation", () => {
		it("should generate unique request IDs with correct format", async () => {
			vi.stubEnv("NODE_ENV", "development");

			try {
				const manager = getEnhancedAPIManager();
				const mockHandler = vi.fn().mockResolvedValue(new Response("OK"));
				const enhancedHandler = manager.createEnhancedHandler(
					mockHandler,
					"GET",
				);

				// Make two requests to test uniqueness
				const request1 = new Request(
					"https://example.com/api/test1",
				) as NextRequest;
				const request2 = new Request(
					"https://example.com/api/test2",
				) as NextRequest;

				const response1 = await enhancedHandler(request1);
				const response2 = await enhancedHandler(request2);

				const id1 = response1.headers.get("X-Request-ID");
				const id2 = response2.headers.get("X-Request-ID");

				expect(typeof id1).toBe("string");
				expect(typeof id2).toBe("string");
				expect(id1).toMatch(/^req_\d+_[a-z0-9]+$/);
				expect(id2).toMatch(/^req_\d+_[a-z0-9]+$/);
				expect(id1).not.toBe(id2);
			} finally {
				vi.unstubAllEnvs();
			}
		});
	});

	describe("Client Information Handling", () => {
		const createMockRequest = (headers: Record<string, string> = {}) => {
			const mockHeaders = new Map(Object.entries(headers));
			return {
				headers: {
					get: vi.fn((name: string) => mockHeaders.get(name) || null),
				},
				url: "https://example.com/api/test",
			} as unknown as NextRequest;
		};

		it("should handle requests with various client headers", async () => {
			const manager = getEnhancedAPIManager();
			const mockHandler = vi.fn().mockResolvedValue(new Response("OK"));
			const enhancedHandler = manager.createEnhancedHandler(mockHandler, "GET");

			// Test that the handler processes requests with client info headers
			const request = createMockRequest({
				"x-forwarded-for": "192.168.1.1",
				"user-agent": "Test Browser",
				referer: "https://example.com",
			});

			const response = await enhancedHandler(request);

			// The handler should process the request successfully
			expect(response.status).toBe(200);
			expect(mockHandler).toHaveBeenCalledWith(request, expect.any(Object));
		});

		it("should handle requests without client headers", async () => {
			const manager = getEnhancedAPIManager();
			const mockHandler = vi.fn().mockResolvedValue(new Response("OK"));
			const enhancedHandler = manager.createEnhancedHandler(mockHandler, "GET");

			// Test with minimal headers
			const request = createMockRequest({});
			const response = await enhancedHandler(request);

			// The handler should still process the request successfully
			expect(response.status).toBe(200);
			expect(mockHandler).toHaveBeenCalledWith(request, expect.any(Object));
		});
	});

	describe("Enhanced Handler Creation - Successful Flow", () => {
		const createMockRequest = (
			url = "https://example.com/api/test",
			_method = "GET",
		) => {
			return {
				url,
				headers: {
					get: vi.fn(() => null),
				},
			} as unknown as NextRequest;
		};

		it("should wrap original handler successfully", async () => {
			const manager = getEnhancedAPIManager();
			const mockOriginalHandler = vi.fn().mockResolvedValue(
				new Response('{"success": true}', {
					status: 200,
					headers: { "Content-Type": "application/json" },
				}),
			);

			const enhancedHandler = manager.createEnhancedHandler(
				mockOriginalHandler,
				"GET",
			);
			const request = createMockRequest();

			const response = await enhancedHandler(request, { collection: "test" });

			expect(mockOriginalHandler).toHaveBeenCalledWith(request, {
				collection: "test",
			});
			expect(response).toBeInstanceOf(NextResponse);
			expect(response.status).toBe(200);
		});

		it("should update metrics for successful requests", async () => {
			const manager = getEnhancedAPIManager();
			const mockOriginalHandler = vi
				.fn()
				.mockResolvedValue(new Response("OK", { status: 200 }));

			const enhancedHandler = manager.createEnhancedHandler(
				mockOriginalHandler,
				"GET",
			);
			const request = createMockRequest();

			await enhancedHandler(request);

			const metrics = manager.getMetrics();
			expect(metrics.totalRequests).toBe(1);
			expect(metrics.successfulRequests).toBe(1);
			expect(metrics.failedRequests).toBe(0);
		});

		it("should log incoming requests", async () => {
			const manager = getEnhancedAPIManager();
			const mockOriginalHandler = vi
				.fn()
				.mockResolvedValue(new Response("OK", { status: 200 }));

			const enhancedHandler = manager.createEnhancedHandler(
				mockOriginalHandler,
				"GET",
			);
			const request = createMockRequest(
				"https://example.com/api/test?param=value",
			);

			await enhancedHandler(request);

			// Verify the logger was called with the incoming request
			expect(mockLogger.info).toHaveBeenCalled();
			const infoCall = mockLogger.info.mock.calls.find(
				(call) =>
					typeof call[0] === "string" && call[0].includes("GET /api/test"),
			);
			expect(infoCall).toBeDefined();
			expect(infoCall?.[1]).toMatchObject({
				requestId: expect.stringMatching(/^req_\d+_/),
				method: "GET",
				pathname: "/api/test",
				search: "?param=value",
				clientInfo: expect.any(Object),
			});
		});

		it("should log successful responses with timing", async () => {
			const manager = getEnhancedAPIManager();
			const mockOriginalHandler = vi
				.fn()
				.mockResolvedValue(new Response("OK", { status: 200 }));

			const enhancedHandler = manager.createEnhancedHandler(
				mockOriginalHandler,
				"GET",
			);
			const request = createMockRequest();

			await enhancedHandler(request);

			// Verify the logger was called with the response
			expect(mockLogger.info).toHaveBeenCalled();
			const responseCall = mockLogger.info.mock.calls.find(
				(call) =>
					typeof call[0] === "string" &&
					call[0].includes("200") &&
					call[0].includes("ms"),
			);
			expect(responseCall).toBeDefined();
			expect(responseCall?.[1]).toMatchObject({
				requestId: expect.stringMatching(/^req_\d+_/),
				status: 200,
				responseTime: expect.any(Number),
			});
		});

		it("should add debug headers in development environment", async () => {
			vi.stubEnv("NODE_ENV", "development");

			try {
				const manager = getEnhancedAPIManager();
				const mockOriginalHandler = vi
					.fn()
					.mockResolvedValue(new Response("OK", { status: 200 }));

				const enhancedHandler = manager.createEnhancedHandler(
					mockOriginalHandler,
					"GET",
				);
				const request = createMockRequest();

				const response = await enhancedHandler(request);

				expect(response.headers.get("X-Request-ID")).toMatch(/^req_\d+_/);
				expect(response.headers.get("X-Response-Time")).toBe("0ms");
			} finally {
				vi.unstubAllEnvs();
			}
		});
	});

	describe("Enhanced Handler Creation - Error Handling", () => {
		const createMockRequest = () =>
			({
				url: "https://example.com/api/test",
				headers: {
					get: vi.fn(() => null),
				},
			}) as unknown as NextRequest;

		it("should handle thrown errors and return appropriate response", async () => {
			const manager = getEnhancedAPIManager();
			const error = new Error("Test error");
			const mockOriginalHandler = vi.fn().mockRejectedValue(error);

			const enhancedHandler = manager.createEnhancedHandler(
				mockOriginalHandler,
				"POST",
			);
			const request = createMockRequest();

			const response = await enhancedHandler(request);

			expect(response.status).toBe(500);

			const responseBody = await response.json();
			expect(responseBody).toEqual({
				error: "Internal Server Error",
				message: expect.any(String),
				requestId: expect.stringMatching(/^req_\d+_/),
				timestamp: expect.any(String),
			});
		});

		it("should update metrics for failed requests", async () => {
			const manager = getEnhancedAPIManager();
			const mockOriginalHandler = vi
				.fn()
				.mockRejectedValue(new Error("Test error"));

			const enhancedHandler = manager.createEnhancedHandler(
				mockOriginalHandler,
				"POST",
			);
			const request = createMockRequest();

			await enhancedHandler(request);

			const metrics = manager.getMetrics();
			expect(metrics.totalRequests).toBe(1);
			expect(metrics.successfulRequests).toBe(0);
			expect(metrics.failedRequests).toBe(1);
		});

		it("should log errors with context", async () => {
			const manager = getEnhancedAPIManager();
			const error = new Error("Test error");
			const mockOriginalHandler = vi.fn().mockRejectedValue(error);

			const enhancedHandler = manager.createEnhancedHandler(
				mockOriginalHandler,
				"POST",
			);
			const request = createMockRequest();

			await enhancedHandler(request);

			// Verify the error logger was called
			expect(mockLogger.error).toHaveBeenCalled();
			const errorCall = mockLogger.error.mock.calls.find(
				(call) => typeof call[0] === "string" && call[0].includes("API Error"),
			);
			expect(errorCall).toBeDefined();
			expect(errorCall?.[1]).toMatchObject({
				errorDetails: expect.objectContaining({
					error: "Error",
					message: "Test error",
					endpoint: "/api/test",
					method: "POST",
				}),
			});
		});

		it("should add error to error log", async () => {
			const manager = getEnhancedAPIManager();
			const error = new Error("Test error");
			const mockOriginalHandler = vi.fn().mockRejectedValue(error);

			const enhancedHandler = manager.createEnhancedHandler(
				mockOriginalHandler,
				"POST",
			);
			const request = createMockRequest();

			await enhancedHandler(request);

			const recentErrors = manager.getRecentErrors();
			expect(recentErrors).toHaveLength(1);
			expect(recentErrors[0]).toEqual(
				expect.objectContaining({
					error: "Error",
					message: "Test error",
					endpoint: "/api/test",
					method: "POST",
				}),
			);
		});
	});

	describe("Metrics Management", () => {
		it("should calculate moving average response time correctly", async () => {
			const manager = getEnhancedAPIManager();

			// Create handlers that simulate different response times by using delays
			const mockHandlers = [
				vi.fn().mockImplementation(
					async () => {
						// Simulate work with delay
						await new Promise((resolve) => setTimeout(resolve, 10));
						return new Response("OK", { status: 200 });
					},
				),
				vi.fn().mockImplementation(
					async () => {
						// Simulate more work with longer delay
						await new Promise((resolve) => setTimeout(resolve, 20));
						return new Response("OK", { status: 200 });
					},
				),
				vi.fn().mockImplementation(
					async () => {
						// Simulate work before error
						await new Promise((resolve) => setTimeout(resolve, 30));
						throw new Error("Test error");
					},
				),
			];

			// Create enhanced handlers
			const enhancedHandlers = mockHandlers.map((handler, index) =>
				manager.createEnhancedHandler(handler, index < 2 ? "GET" : "POST"),
			);

			// Execute requests
			const request = new Request(
				"https://example.com/api/test",
			) as NextRequest;

			await enhancedHandlers[0](request);
			let metrics = manager.getMetrics();
			expect(metrics.successfulRequests).toBe(1);
			expect(metrics.averageResponseTime).toBeGreaterThan(0);

			await enhancedHandlers[1](request);
			metrics = manager.getMetrics();
			expect(metrics.successfulRequests).toBe(2);

			await enhancedHandlers[2](request);
			metrics = manager.getMetrics();
			expect(metrics.failedRequests).toBe(1);
			expect(metrics.totalRequests).toBe(3);
		});

		it("should handle success and failure counts accurately", async () => {
			const manager = getEnhancedAPIManager();

			// Create handlers that succeed and fail
			const successHandler = vi
				.fn()
				.mockResolvedValue(new Response("OK", { status: 200 }));
			const failHandler = vi.fn().mockRejectedValue(new Error("Test error"));

			const enhancedSuccessHandler = manager.createEnhancedHandler(
				successHandler,
				"GET",
			);
			const enhancedFailHandler = manager.createEnhancedHandler(
				failHandler,
				"POST",
			);

			const request = new Request(
				"https://example.com/api/test",
			) as NextRequest;

			// Make successful requests
			await enhancedSuccessHandler(request);
			await enhancedSuccessHandler(request);

			// Make failing requests
			await enhancedFailHandler(request);
			await enhancedFailHandler(request);

			const metrics = manager.getMetrics();
			expect(metrics.successfulRequests).toBe(2);
			expect(metrics.failedRequests).toBe(2);
			expect(metrics.totalRequests).toBe(4);
		});
	});

	describe("Error Log Management", () => {
		it("should maintain maximum error log size", async () => {
			const manager = getEnhancedAPIManager();
			const maxErrorLogSize = 100;

			// Create a handler that always fails
			const failingHandler = vi.fn().mockImplementation((_, index) => {
				return Promise.reject(new Error(`Error ${index}`));
			});

			const enhancedHandler = manager.createEnhancedHandler(
				failingHandler,
				"GET",
			);

			// Generate more errors than the maximum by making failing requests
			for (let i = 0; i < maxErrorLogSize + 10; i++) {
				const request = new Request(
					`https://example.com/api/test?index=${i}`,
				) as NextRequest;
				await enhancedHandler(request);
			}

			const recentErrors = manager.getRecentErrors(200); // Request more than max
			expect(recentErrors).toHaveLength(maxErrorLogSize);
		});

		it("should preserve most recent errors when exceeding limit", async () => {
			const manager = getEnhancedAPIManager();

			// Create a handler that always fails with numbered errors
			let errorCounter = 0;
			const failingHandler = vi.fn().mockImplementation(() => {
				const currentError = errorCounter++;
				return Promise.reject(new Error(`Error ${currentError}`));
			});

			const enhancedHandler = manager.createEnhancedHandler(
				failingHandler,
				"GET",
			);
			const request = new Request(
				"https://example.com/api/test",
			) as NextRequest;

			// Generate errors beyond limit
			for (let i = 0; i < 105; i++) {
				await enhancedHandler(request);
			}

			const recentErrors = manager.getRecentErrors(10);
			// The error log keeps the last 100 errors, so with 105 errors total:
			// - Errors 0-4 are dropped
			// - Errors 5-104 are kept (100 errors)
			// - Getting the last 10 means errors 95-104
			expect(recentErrors[0].message).toBe("Error 95");
			expect(recentErrors[9].message).toBe("Error 104");
		});
	});

	describe("Error Response Creation", () => {
		it("should detect 404 errors correctly", async () => {
			const manager = getEnhancedAPIManager();
			const error = new Error("404 Not Found");
			const mockHandler = vi.fn().mockRejectedValue(error);
			const enhancedHandler = manager.createEnhancedHandler(mockHandler, "GET");
			const request = new Request(
				"https://example.com/api/test",
			) as NextRequest;

			const response = await enhancedHandler(request);

			expect(response.status).toBe(404);
			const body = await response.json();
			expect(body.error).toBe("Not Found");
		});

		it("should detect 401 errors correctly", async () => {
			const manager = getEnhancedAPIManager();
			const error = new Error("401 Unauthorized access");
			const mockHandler = vi.fn().mockRejectedValue(error);
			const enhancedHandler = manager.createEnhancedHandler(mockHandler, "GET");
			const request = new Request(
				"https://example.com/api/test",
			) as NextRequest;

			const response = await enhancedHandler(request);

			expect(response.status).toBe(401);
			const body = await response.json();
			expect(body.error).toBe("Unauthorized");
		});

		it("should detect 403 errors correctly", async () => {
			const manager = getEnhancedAPIManager();
			const error = new Error("403 Forbidden operation");
			const mockHandler = vi.fn().mockRejectedValue(error);
			const enhancedHandler = manager.createEnhancedHandler(mockHandler, "GET");
			const request = new Request(
				"https://example.com/api/test",
			) as NextRequest;

			const response = await enhancedHandler(request);

			expect(response.status).toBe(403);
			const body = await response.json();
			expect(body.error).toBe("Forbidden");
		});

		it("should detect 400 errors correctly", async () => {
			const manager = getEnhancedAPIManager();
			const error = new Error("400 Bad Request format");
			const mockHandler = vi.fn().mockRejectedValue(error);
			const enhancedHandler = manager.createEnhancedHandler(mockHandler, "GET");
			const request = new Request(
				"https://example.com/api/test",
			) as NextRequest;

			const response = await enhancedHandler(request);

			expect(response.status).toBe(400);
			const body = await response.json();
			expect(body.error).toBe("Bad Request");
		});

		it("should default to 500 for unknown errors", async () => {
			const manager = getEnhancedAPIManager();
			const error = new Error("Some unknown error");
			const mockHandler = vi.fn().mockRejectedValue(error);
			const enhancedHandler = manager.createEnhancedHandler(mockHandler, "GET");
			const request = new Request(
				"https://example.com/api/test",
			) as NextRequest;

			const response = await enhancedHandler(request);

			expect(response.status).toBe(500);
			const body = await response.json();
			expect(body.error).toBe("Internal Server Error");
		});

		it("should include detailed messages in development", async () => {
			vi.stubEnv("NODE_ENV", "development");

			try {
				const manager = getEnhancedAPIManager();
				const error = new Error("Detailed error message");
				const mockHandler = vi.fn().mockRejectedValue(error);
				const enhancedHandler = manager.createEnhancedHandler(
					mockHandler,
					"GET",
				);
				const request = new Request(
					"https://example.com/api/test",
				) as NextRequest;

				const response = await enhancedHandler(request);

				const body = await response.json();
				expect(body.message).toBe("Detailed error message");
				expect(response.headers.get("X-Request-ID")).toMatch(/^req_\d+_/);
				expect(response.headers.get("X-Error-Type")).toBe("Error");
			} finally {
				vi.unstubAllEnvs();
			}
		});

		it("should mask error details in production", async () => {
			vi.stubEnv("NODE_ENV", "production");

			try {
				const manager = getEnhancedAPIManager();
				const error = new Error("Sensitive error details");
				const mockHandler = vi.fn().mockRejectedValue(error);
				const enhancedHandler = manager.createEnhancedHandler(
					mockHandler,
					"GET",
				);
				const request = new Request(
					"https://example.com/api/test",
				) as NextRequest;

				const response = await enhancedHandler(request);

				const body = await response.json();
				expect(body.message).toBe(
					"An error occurred while processing your request",
				);
			} finally {
				vi.unstubAllEnvs();
			}
		});
	});

	describe("Public API Methods", () => {
		it("should return complete metrics object", async () => {
			const manager = getEnhancedAPIManager();

			// Create handlers for different scenarios
			const successHandler = vi.fn().mockResolvedValue(new Response("OK"));
			const failHandler = vi.fn().mockRejectedValue(new Error("Test error"));

			const enhancedSuccessHandler = manager.createEnhancedHandler(
				successHandler,
				"GET",
			);
			const enhancedFailHandler = manager.createEnhancedHandler(
				failHandler,
				"POST",
			);

			const request = new Request(
				"https://example.com/api/test",
			) as NextRequest;

			// Make one successful and one failed request
			await enhancedSuccessHandler(request);
			await enhancedFailHandler(request);

			const metrics = manager.getMetrics();

			expect(metrics).toEqual({
				totalRequests: 2,
				successfulRequests: 1,
				failedRequests: 1,
				averageResponseTime: expect.any(Number),
				deduplicatedRequests: 0,
				lastRequestTime: expect.any(Date),
				errorCount: 1,
				recentErrors: expect.arrayContaining([
					expect.objectContaining({
						error: "Error",
						message: "Test error",
						endpoint: "/api/test",
						method: "POST",
					}),
				]),
			});
		});

		it("should return limited error list with getRecentErrors", async () => {
			const manager = getEnhancedAPIManager();

			// Create a handler that fails with numbered errors
			let errorCounter = 0;
			const failingHandler = vi.fn().mockImplementation(() => {
				const currentError = errorCounter++;
				return Promise.reject(new Error(`Error ${currentError}`));
			});

			const enhancedHandler = manager.createEnhancedHandler(
				failingHandler,
				"GET",
			);
			const request = new Request(
				"https://example.com/api/test",
			) as NextRequest;

			// Generate 5 errors
			for (let i = 0; i < 5; i++) {
				await enhancedHandler(request);
			}

			const recentErrors = manager.getRecentErrors(3);
			expect(recentErrors).toHaveLength(3);
			expect(recentErrors[0].message).toBe("Error 2"); // Last 3 errors
			expect(recentErrors[2].message).toBe("Error 4");
		});

		it("should clear error log", async () => {
			const manager = getEnhancedAPIManager();

			// Create a failing handler
			const failingHandler = vi.fn().mockRejectedValue(new Error("Test error"));
			const enhancedHandler = manager.createEnhancedHandler(
				failingHandler,
				"GET",
			);
			const request = new Request(
				"https://example.com/api/test",
			) as NextRequest;

			// Generate an error
			await enhancedHandler(request);

			expect(manager.getRecentErrors()).toHaveLength(1);

			manager.clearErrorLog();

			expect(manager.getRecentErrors()).toHaveLength(0);
			expect(mockLogger.info).toHaveBeenCalledWith("Error log cleared");
		});
	});

	describe("Module-Level Functions", () => {
		it("should return singleton instance", () => {
			const manager1 = getEnhancedAPIManager();
			const manager2 = getEnhancedAPIManager();

			expect(manager1).toBe(manager2);
		});

		it("should create enhanced Payload handlers", () => {
			const mockPayloadConfig = {};

			// Mock the REST functions to return mock handlers
			vi.mocked(REST_GET).mockReturnValue(vi.fn());
			vi.mocked(REST_POST).mockReturnValue(vi.fn());
			vi.mocked(REST_DELETE).mockReturnValue(vi.fn());
			vi.mocked(REST_PATCH).mockReturnValue(vi.fn());
			vi.mocked(REST_PUT).mockReturnValue(vi.fn());
			vi.mocked(REST_OPTIONS).mockReturnValue(vi.fn());

			const handlers = createEnhancedPayloadHandlers(mockPayloadConfig);

			expect(handlers).toHaveProperty("GET");
			expect(handlers).toHaveProperty("POST");
			expect(handlers).toHaveProperty("DELETE");
			expect(handlers).toHaveProperty("PATCH");
			expect(handlers).toHaveProperty("PUT");
			expect(handlers).toHaveProperty("OPTIONS");

			expect(REST_GET).toHaveBeenCalledWith(mockPayloadConfig);
			expect(REST_POST).toHaveBeenCalledWith(mockPayloadConfig);
			expect(REST_DELETE).toHaveBeenCalledWith(mockPayloadConfig);
			expect(REST_PATCH).toHaveBeenCalledWith(mockPayloadConfig);
			expect(REST_PUT).toHaveBeenCalledWith(mockPayloadConfig);
			expect(REST_OPTIONS).toHaveBeenCalledWith(mockPayloadConfig);
		});

		it("should export getAPIMetrics function", () => {
			const metrics = getAPIMetrics();

			expect(metrics).toEqual(
				expect.objectContaining({
					totalRequests: expect.any(Number),
					successfulRequests: expect.any(Number),
					failedRequests: expect.any(Number),
					averageResponseTime: expect.any(Number),
					deduplicatedRequests: expect.any(Number),
					lastRequestTime: expect.any(Date),
					errorCount: expect.any(Number),
					recentErrors: expect.any(Array),
				}),
			);
		});

		it("should export getRecentAPIErrors function", () => {
			const errors = getRecentAPIErrors(5);

			expect(Array.isArray(errors)).toBe(true);
		});

		it("should export clearAPIErrorLog function", () => {
			clearAPIErrorLog();

			expect(mockLogger.info).toHaveBeenCalledWith("Error log cleared");
		});
	});

	describe("Edge Cases", () => {
		it("should handle requests with malformed URLs gracefully", async () => {
			const manager = getEnhancedAPIManager();
			const mockOriginalHandler = vi
				.fn()
				.mockRejectedValue(new Error("Invalid URL"));

			const enhancedHandler = manager.createEnhancedHandler(
				mockOriginalHandler,
				"GET",
			);

			// Use a proper URL but make the handler fail to test error handling
			const request = {
				url: "https://example.com/api/test",
				headers: {
					get: vi.fn(() => null),
				},
			} as unknown as NextRequest;

			const response = await enhancedHandler(request);
			expect(response).toBeInstanceOf(NextResponse);
			expect(response.status).toBe(500);
		});

		it("should handle non-Error thrown objects", async () => {
			const manager = getEnhancedAPIManager();
			const mockOriginalHandler = vi.fn().mockRejectedValue("String error");

			const enhancedHandler = manager.createEnhancedHandler(
				mockOriginalHandler,
				"POST",
			);
			const request = {
				url: "https://example.com/api/test",
				headers: {
					get: vi.fn(() => null),
				},
			} as unknown as NextRequest;

			const response = await enhancedHandler(request);

			expect(response.status).toBe(500);

			const body = await response.json();
			expect(body.error).toBe("Internal Server Error");
			expect(body.message).toBe(
				"An error occurred while processing your request",
			);
		});
	});
});
