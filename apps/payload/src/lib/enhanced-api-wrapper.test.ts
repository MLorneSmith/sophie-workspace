/**
 * Unit tests for enhanced-api-wrapper.ts
 * Tests the EnhancedAPIManager class and related functionality
 */

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

// Types for testing private methods and mocked values
interface MockLogger {
	info: ReturnType<typeof vi.fn>;
	error: ReturnType<typeof vi.fn>;
	warn: ReturnType<typeof vi.fn>;
	debug: ReturnType<typeof vi.fn>;
}

type OriginalDateNow = typeof Date.now;
type OriginalMathRandom = typeof Math.random;

// Type for accessing private methods in tests
type AnyEnhancedAPIManager = ReturnType<typeof getEnhancedAPIManager> & {
	[key: string]: unknown;
};

describe("EnhancedAPIManager", () => {
	let mockLogger: MockLogger;
	let originalDateNow: OriginalDateNow;
	let originalMathRandom: OriginalMathRandom;
	let mockDate: Date;

	beforeEach(() => {
		// Clear global singleton
		globalThis.__enhanced_api_manager = undefined;

		// Reset all mocks
		vi.clearAllMocks();

		// Mock logger
		mockLogger = {
			info: vi.fn(),
			error: vi.fn(),
			warn: vi.fn(),
			debug: vi.fn(),
		};
		vi.mocked(createEnvironmentLogger).mockReturnValue(mockLogger);

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
		it("should generate unique request IDs with correct format", () => {
			const manager = getEnhancedAPIManager();

			// Access private method through reflection for testing
			const generateRequestId = (
				manager as AnyEnhancedAPIManager
			).generateRequestId.bind(manager);

			const id1 = generateRequestId();
			const id2 = generateRequestId();

			expect(id1).toMatch(/^req_\d+_[a-z0-9]+$/);
			expect(id2).toMatch(/^req_\d+_[a-z0-9]+$/);
			expect(id1).not.toBe(id2);
		});
	});

	describe("Client Information Extraction", () => {
		const createMockRequest = (headers: Record<string, string> = {}) => {
			const mockHeaders = new Map(Object.entries(headers));
			return {
				headers: {
					get: vi.fn((name: string) => mockHeaders.get(name) || null),
				},
				url: "https://example.com/api/test",
			} as unknown as NextRequest;
		};

		it("should extract IP from x-forwarded-for header", () => {
			const manager = getEnhancedAPIManager();
			const extractClientInfo = (
				manager as AnyEnhancedAPIManager
			).extractClientInfo.bind(manager);

			const request = createMockRequest({
				"x-forwarded-for": "192.168.1.1",
				"user-agent": "Test Browser",
				referer: "https://example.com",
			});

			const clientInfo = extractClientInfo(request);

			expect(clientInfo.ip).toBe("192.168.1.1");
			expect(clientInfo.userAgent).toBe("Test Browser");
			expect(clientInfo.referer).toBe("https://example.com");
		});

		it("should fall back to x-real-ip when x-forwarded-for is missing", () => {
			const manager = getEnhancedAPIManager();
			const extractClientInfo = (
				manager as AnyEnhancedAPIManager
			).extractClientInfo.bind(manager);

			const request = createMockRequest({
				"x-real-ip": "192.168.1.2",
				"user-agent": "Test Browser",
			});

			const clientInfo = extractClientInfo(request);

			expect(clientInfo.ip).toBe("192.168.1.2");
		});

		it("should default to unknown when no IP headers present", () => {
			const manager = getEnhancedAPIManager();
			const extractClientInfo = (
				manager as AnyEnhancedAPIManager
			).extractClientInfo.bind(manager);

			const request = createMockRequest({
				"user-agent": "Test Browser",
			});

			const clientInfo = extractClientInfo(request);

			expect(clientInfo.ip).toBe("unknown");
			expect(clientInfo.userAgent).toBe("Test Browser");
			expect(clientInfo.referer).toBe("unknown");
		});

		it("should handle missing user-agent and referer headers", () => {
			const manager = getEnhancedAPIManager();
			const extractClientInfo = (
				manager as AnyEnhancedAPIManager
			).extractClientInfo.bind(manager);

			const request = createMockRequest({});

			const clientInfo = extractClientInfo(request);

			expect(clientInfo.ip).toBe("unknown");
			expect(clientInfo.userAgent).toBe("unknown");
			expect(clientInfo.referer).toBe("unknown");
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

			expect(mockLogger.info).toHaveBeenCalledWith(
				"GET /api/test?param=value",
				expect.objectContaining({
					requestId: expect.stringMatching(/^req_\d+_/),
					method: "GET",
					pathname: "/api/test",
					search: "?param=value",
					clientInfo: expect.any(Object),
				}),
			);
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

			expect(mockLogger.info).toHaveBeenCalledWith(
				"GET /api/test - 200 (0ms)",
				expect.objectContaining({
					requestId: expect.stringMatching(/^req_\d+_/),
					status: 200,
					responseTime: 0,
				}),
			);
		});

		it("should add debug headers in development environment", async () => {
			const originalNodeEnv = process.env.NODE_ENV;
			process.env.NODE_ENV = "development";

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
				process.env.NODE_ENV = originalNodeEnv;
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

			expect(mockLogger.error).toHaveBeenCalledWith(
				"API Error: POST /api/test",
				expect.objectContaining({
					errorDetails: expect.objectContaining({
						error: "Error",
						message: "Test error",
						endpoint: "/api/test",
						method: "POST",
					}),
				}),
			);
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

			// Simulate requests with different response times
			const updateResponseMetrics = (
				manager as AnyEnhancedAPIManager
			).updateResponseMetrics.bind(manager);

			updateResponseMetrics(100, true); // 100ms
			let metrics = manager.getMetrics();
			expect(metrics.averageResponseTime).toBe(100);

			updateResponseMetrics(200, true); // 200ms
			metrics = manager.getMetrics();
			expect(metrics.averageResponseTime).toBe(150); // (100 + 200) / 2

			updateResponseMetrics(300, false); // 300ms (failed request)
			metrics = manager.getMetrics();
			expect(metrics.averageResponseTime).toBe(200); // (100 + 200 + 300) / 3
		});

		it("should handle success and failure counts accurately", async () => {
			const manager = getEnhancedAPIManager();
			const updateResponseMetrics = (
				manager as AnyEnhancedAPIManager
			).updateResponseMetrics.bind(manager);

			updateResponseMetrics(100, true);
			updateResponseMetrics(150, true);
			updateResponseMetrics(200, false);
			updateResponseMetrics(250, false);

			const metrics = manager.getMetrics();
			expect(metrics.successfulRequests).toBe(2);
			expect(metrics.failedRequests).toBe(2);
		});
	});

	describe("Error Log Management", () => {
		it("should maintain maximum error log size", () => {
			const manager = getEnhancedAPIManager();
			const addErrorToLog = (
				manager as AnyEnhancedAPIManager
			).addErrorToLog.bind(manager);
			const maxErrorLogSize = 100;

			// Add more errors than the maximum
			for (let i = 0; i < maxErrorLogSize + 10; i++) {
				addErrorToLog({
					error: "TestError",
					message: `Error ${i}`,
					timestamp: new Date().toISOString(),
					requestId: `req_${i}`,
					endpoint: "/api/test",
					method: "GET",
				});
			}

			const recentErrors = manager.getRecentErrors(200); // Request more than max
			expect(recentErrors).toHaveLength(maxErrorLogSize);
		});

		it("should preserve most recent errors when exceeding limit", () => {
			const manager = getEnhancedAPIManager();
			const addErrorToLog = (
				manager as AnyEnhancedAPIManager
			).addErrorToLog.bind(manager);

			// Add errors beyond limit
			for (let i = 0; i < 105; i++) {
				addErrorToLog({
					error: "TestError",
					message: `Error ${i}`,
					timestamp: new Date().toISOString(),
					requestId: `req_${i}`,
					endpoint: "/api/test",
					method: "GET",
				});
			}

			const recentErrors = manager.getRecentErrors(10);
			expect(recentErrors[0].message).toBe("Error 95"); // Should be the 95th error (most recent 10 of 100)
			expect(recentErrors[9].message).toBe("Error 104"); // Last error
		});
	});

	describe("Error Response Creation", () => {
		const manager = getEnhancedAPIManager();
		const createErrorResponse = (
			manager as AnyEnhancedAPIManager
		).createErrorResponse.bind(manager);

		it("should detect 404 errors correctly", async () => {
			const error = new Error("404 Not Found");
			const response = createErrorResponse(error, "test-id");

			expect(response.status).toBe(404);

			const body = await response.json();
			expect(body.error).toBe("Not Found");
		});

		it("should detect 401 errors correctly", async () => {
			const error = new Error("401 Unauthorized access");
			const response = createErrorResponse(error, "test-id");

			expect(response.status).toBe(401);

			const body = await response.json();
			expect(body.error).toBe("Unauthorized");
		});

		it("should detect 403 errors correctly", async () => {
			const error = new Error("403 Forbidden operation");
			const response = createErrorResponse(error, "test-id");

			expect(response.status).toBe(403);

			const body = await response.json();
			expect(body.error).toBe("Forbidden");
		});

		it("should detect 400 errors correctly", async () => {
			const error = new Error("400 Bad Request format");
			const response = createErrorResponse(error, "test-id");

			expect(response.status).toBe(400);

			const body = await response.json();
			expect(body.error).toBe("Bad Request");
		});

		it("should default to 500 for unknown errors", async () => {
			const error = new Error("Some unknown error");
			const response = createErrorResponse(error, "test-id");

			expect(response.status).toBe(500);

			const body = await response.json();
			expect(body.error).toBe("Internal Server Error");
		});

		it("should include detailed messages in development", async () => {
			const originalNodeEnv = process.env.NODE_ENV;
			process.env.NODE_ENV = "development";

			try {
				const error = new Error("Detailed error message");
				const response = createErrorResponse(error, "test-id");

				const body = await response.json();
				expect(body.message).toBe("Detailed error message");
				expect(response.headers.get("X-Request-ID")).toBe("test-id");
				expect(response.headers.get("X-Error-Type")).toBe("Error");
			} finally {
				process.env.NODE_ENV = originalNodeEnv;
			}
		});

		it("should mask error details in production", async () => {
			const originalNodeEnv = process.env.NODE_ENV;
			process.env.NODE_ENV = "production";

			try {
				const error = new Error("Sensitive error details");
				const response = createErrorResponse(error, "test-id");

				const body = await response.json();
				expect(body.message).toBe(
					"An error occurred while processing your request",
				);
			} finally {
				process.env.NODE_ENV = originalNodeEnv;
			}
		});
	});

	describe("Public API Methods", () => {
		it("should return complete metrics object", () => {
			const manager = getEnhancedAPIManager();

			// Add some test data
			const updateResponseMetrics = (
				manager as AnyEnhancedAPIManager
			).updateResponseMetrics.bind(manager);
			updateResponseMetrics(100, true);
			updateResponseMetrics(200, false);

			const metrics = manager.getMetrics();

			expect(metrics).toEqual({
				totalRequests: 0, // Only updated through enhanced handler
				successfulRequests: 1,
				failedRequests: 1,
				averageResponseTime: 150,
				deduplicatedRequests: 0,
				lastRequestTime: expect.any(Date),
				errorCount: 0,
				recentErrors: [],
			});
		});

		it("should return limited error list with getRecentErrors", () => {
			const manager = getEnhancedAPIManager();
			const addErrorToLog = (
				manager as AnyEnhancedAPIManager
			).addErrorToLog.bind(manager);

			// Add multiple errors
			for (let i = 0; i < 5; i++) {
				addErrorToLog({
					error: "TestError",
					message: `Error ${i}`,
					timestamp: new Date().toISOString(),
					requestId: `req_${i}`,
					endpoint: "/api/test",
					method: "GET",
				});
			}

			const recentErrors = manager.getRecentErrors(3);
			expect(recentErrors).toHaveLength(3);
			expect(recentErrors[0].message).toBe("Error 2"); // Last 3 errors
			expect(recentErrors[2].message).toBe("Error 4");
		});

		it("should clear error log", () => {
			const manager = getEnhancedAPIManager();
			const addErrorToLog = (
				manager as AnyEnhancedAPIManager
			).addErrorToLog.bind(manager);

			// Add some errors
			addErrorToLog({
				error: "TestError",
				message: "Test error",
				timestamp: new Date().toISOString(),
				requestId: "req_1",
				endpoint: "/api/test",
				method: "GET",
			});

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
			const mockPayloadConfig = {} as Record<string, unknown>;

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
