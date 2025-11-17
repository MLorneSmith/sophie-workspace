import type { Database } from "@kit/supabase/database";
import type { SupabaseClient } from "@supabase/supabase-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
	type AdminDashboardLoaderDeps,
	AdminDashboardLoaderError,
	createTestableAdminDashboardLoader,
} from "./admin-dashboard.loader";

// Mock the external dependencies
vi.mock("@kit/shared/logger");
vi.mock("@kit/supabase/server-client");
vi.mock("../services/admin-dashboard.service");

describe("AdminDashboardLoader", () => {
	const mockLogger = {
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
		debug: vi.fn(),
		fatal: vi.fn(),
	};

	const mockClient = {} as SupabaseClient<Database>;

	const mockServiceData = {
		subscriptions: 42,
		trials: 13,
		accounts: 156,
		teamAccounts: 89,
	};

	const mockService = {
		getDashboardData: vi.fn(),
	} as any; // Use any for simplicity in tests

	const mockCreateService = vi.fn(() => mockService);

	beforeEach(() => {
		vi.clearAllMocks();
		mockService.getDashboardData.mockResolvedValue(mockServiceData);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("Successful data loading", () => {
		it("should load dashboard data successfully", async () => {
			const testableLoader = createTestableAdminDashboardLoader({
				client: mockClient,
				logger: mockLogger,
				createService: mockCreateService,
			});

			const result = await testableLoader();

			expect(result).toEqual(mockServiceData);
			expect(mockCreateService).toHaveBeenCalledWith(mockClient);
			expect(mockService.getDashboardData).toHaveBeenCalledWith();
			expect(mockLogger.info).toHaveBeenCalledWith(
				expect.objectContaining({
					name: "admin-dashboard-loader",
					operation: "load_dashboard_data",
				}),
				"Loading admin dashboard data",
			);
		});

		it("should log successful data loading", async () => {
			const testableLoader = createTestableAdminDashboardLoader({
				client: mockClient,
				logger: mockLogger,
				createService: mockCreateService,
			});

			await testableLoader();

			expect(mockLogger.info).toHaveBeenCalledWith(
				expect.objectContaining({
					name: "admin-dashboard-loader",
					operation: "load_dashboard_data",
					data: mockServiceData,
				}),
				"Admin dashboard data loaded successfully",
			);
		});
	});

	describe("Error handling and fallbacks", () => {
		it("should throw error in development mode", async () => {
			const originalEnv = process.env.NODE_ENV;
			process.env.NODE_ENV = "development";

			try {
				const error = new Error("Database connection failed");
				mockService.getDashboardData.mockRejectedValue(error);

				const testableLoader = createTestableAdminDashboardLoader({
					client: mockClient,
					logger: mockLogger,
					createService: mockCreateService,
				});

				await expect(testableLoader()).rejects.toThrow(
					AdminDashboardLoaderError,
				);
			} finally {
				process.env.NODE_ENV = originalEnv;
			}
		});

		it("should return fallback data in production mode", async () => {
			const originalEnv = process.env.NODE_ENV;
			process.env.NODE_ENV = "production";

			try {
				const error = new Error("Database connection failed");
				mockService.getDashboardData.mockRejectedValue(error);

				const testableLoader = createTestableAdminDashboardLoader({
					client: mockClient,
					logger: mockLogger,
					createService: mockCreateService,
				});

				const result = await testableLoader();

				expect(result).toEqual({
					subscriptions: 0,
					trials: 0,
					accounts: 0,
					teamAccounts: 0,
				});

				expect(mockLogger.error).toHaveBeenCalledWith(
					expect.objectContaining({
						name: "admin-dashboard-loader",
						operation: "load_dashboard_data",
						error,
					}),
					"Failed to load admin dashboard data, returning fallback",
				);

				expect(mockLogger.warn).toHaveBeenCalledWith(
					expect.objectContaining({
						name: "admin-dashboard-loader",
						operation: "load_dashboard_data",
						fallback: {
							subscriptions: 0,
							trials: 0,
							accounts: 0,
							teamAccounts: 0,
						},
					}),
					"Returning fallback dashboard data",
				);
			} finally {
				process.env.NODE_ENV = originalEnv;
			}
		});

		it("should properly construct AdminDashboardLoaderError", () => {
			const cause = new Error("Original error");
			const loaderError = new AdminDashboardLoaderError(
				"Test error",
				cause,
				"TEST_ERROR",
			);

			expect(loaderError.message).toBe("Test error");
			expect(loaderError.cause).toBe(cause);
			expect(loaderError.code).toBe("TEST_ERROR");
			expect(loaderError.name).toBe("AdminDashboardLoaderError");
		});
	});

	describe("Retry logic", () => {
		it("should retry on network errors", async () => {
			const networkError = new Error("Network timeout occurred");
			mockService.getDashboardData
				.mockRejectedValueOnce(networkError)
				.mockResolvedValueOnce(mockServiceData);

			const testableLoader = createTestableAdminDashboardLoader({
				client: mockClient,
				logger: mockLogger,
				createService: mockCreateService,
			});

			const result = await testableLoader();

			expect(result).toEqual(mockServiceData);
			expect(mockService.getDashboardData).toHaveBeenCalledTimes(2);
			expect(mockLogger.warn).toHaveBeenCalledWith(
				expect.objectContaining({
					attempt: 1,
					delay: 1000,
					error: networkError,
				}),
				expect.stringContaining(
					"Dashboard load attempt 1 failed, retrying in 1000ms",
				),
			);
		});

		it("should not retry on non-retryable errors", async () => {
			const authError = new Error("Authentication failed");
			mockService.getDashboardData.mockRejectedValue(authError);

			const originalEnv = process.env.NODE_ENV;
			process.env.NODE_ENV = "production";

			try {
				const testableLoader = createTestableAdminDashboardLoader({
					client: mockClient,
					logger: mockLogger,
					createService: mockCreateService,
				});

				const result = await testableLoader();

				expect(result).toEqual({
					subscriptions: 0,
					trials: 0,
					accounts: 0,
					teamAccounts: 0,
				});

				// Should only call once, no retries for auth errors
				expect(mockService.getDashboardData).toHaveBeenCalledTimes(1);
			} finally {
				process.env.NODE_ENV = originalEnv;
			}
		});

		it("should fail after max retry attempts", async () => {
			const networkError = new Error("Network connection lost");
			mockService.getDashboardData.mockRejectedValue(networkError);

			const originalEnv = process.env.NODE_ENV;
			process.env.NODE_ENV = "production";

			try {
				const testableLoader = createTestableAdminDashboardLoader({
					client: mockClient,
					logger: mockLogger,
					createService: mockCreateService,
				});

				const result = await testableLoader();

				expect(result).toEqual({
					subscriptions: 0,
					trials: 0,
					accounts: 0,
					teamAccounts: 0,
				});

				// Should retry the configured number of times (2 attempts total)
				expect(mockService.getDashboardData).toHaveBeenCalledTimes(2);
			} finally {
				process.env.NODE_ENV = originalEnv;
			}
		});
	});

	describe("Dependency injection", () => {
		it("should allow mocking all dependencies", async () => {
			const customLogger = {
				info: vi.fn(),
				warn: vi.fn(),
				error: vi.fn(),
				debug: vi.fn(),
				fatal: vi.fn(),
			};

			const customClient = {
				custom: "client",
			} as unknown as SupabaseClient<Database>;
			const customService = {
				getDashboardData: vi.fn().mockResolvedValue({ custom: "data" }),
			} as any;
			const customCreateService = vi.fn(() => customService);

			const testableLoader = createTestableAdminDashboardLoader({
				client: customClient,
				logger: customLogger,
				createService: customCreateService,
			});

			const result = await testableLoader();

			expect(result).toEqual({ custom: "data" });
			expect(customCreateService).toHaveBeenCalledWith(customClient);
			expect(customLogger.info).toHaveBeenCalled();
		});

		it("should work with partial dependency injection", async () => {
			const customLogger = {
				info: vi.fn(),
				warn: vi.fn(),
				error: vi.fn(),
				debug: vi.fn(),
				fatal: vi.fn(),
			};

			const testableLoader = createTestableAdminDashboardLoader({
				logger: customLogger,
				createService: mockCreateService,
			});

			await testableLoader();

			expect(customLogger.info).toHaveBeenCalled();
			expect(mockCreateService).toHaveBeenCalled();
		});
	});

	describe("Type safety", () => {
		it("should maintain type safety for loader dependencies", () => {
			// This test primarily ensures TypeScript compilation
			const deps: AdminDashboardLoaderDeps = {
				client: mockClient,
				logger: mockLogger,
				createService: mockCreateService,
			};

			const testableLoader = createTestableAdminDashboardLoader(deps);
			expect(typeof testableLoader).toBe("function");
		});

		it("should return correct types for dashboard data", async () => {
			const testableLoader = createTestableAdminDashboardLoader({
				client: mockClient,
				logger: mockLogger,
				createService: mockCreateService,
			});

			const result = await testableLoader();

			// TypeScript should infer the correct types
			expect(typeof result.subscriptions).toBe("number");
			expect(typeof result.trials).toBe("number");
			expect(typeof result.accounts).toBe("number");
			expect(typeof result.teamAccounts).toBe("number");
		});
	});
});
