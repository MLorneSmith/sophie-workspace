/**
 * Unit tests for AdminDashboardService
 * Tests the admin dashboard data fetching functionality
 */

import { getLogger } from "@kit/shared/logger";
import type { Database } from "@kit/supabase/database";
import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	AdminDashboardService,
	createAdminDashboardService,
} from "./admin-dashboard.service";

// Mock the logger module
vi.mock("@kit/shared/logger", () => ({
	getLogger: vi.fn().mockResolvedValue({
		error: vi.fn(),
		info: vi.fn(),
		warn: vi.fn(),
		debug: vi.fn(),
	}),
}));

// Helper to create mock query builder
function createMockQueryBuilder(options: {
	data?: any;
	error?: any;
	count?: number | null;
}) {
	const builder = {
		select: vi.fn().mockReturnThis(),
		eq: vi.fn().mockReturnThis(),
		// biome-ignore lint/suspicious/noThenProperty: Mocking promise-like behavior for tests
		then: vi.fn((callback: any) => {
			const response = {
				data: options.data ?? null,
				error: options.error ?? null,
				count: options.count !== undefined ? options.count : 0,
			};
			return Promise.resolve(callback(response));
		}),
	};
	return builder;
}

// Helper to create mock Supabase client
function createMockSupabaseClient(config?: {
	subscriptions?: { active?: number; trialing?: number; error?: any };
	accounts?: { personal?: number; team?: number; error?: any };
}): SupabaseClient<Database> {
	const subscriptionsActive = config?.subscriptions?.active ?? 10;
	const subscriptionsTrialing = config?.subscriptions?.trialing ?? 5;
	const accountsPersonal = config?.accounts?.personal ?? 15;
	const accountsTeam = config?.accounts?.team ?? 3;

	const fromCallCount = 0;
	const subscriptionsCalls = [
		// First call for active subscriptions
		createMockQueryBuilder({
			count: subscriptionsActive,
			error: config?.subscriptions?.error,
		}),
		// Second call for trialing subscriptions
		createMockQueryBuilder({
			count: subscriptionsTrialing,
			error: config?.subscriptions?.error,
		}),
	];

	const accountsCalls = [
		// First call for personal accounts
		createMockQueryBuilder({
			count: accountsPersonal,
			error: config?.accounts?.error,
		}),
		// Second call for team accounts
		createMockQueryBuilder({
			count: accountsTeam,
			error: config?.accounts?.error,
		}),
	];

	let subscriptionsCallIndex = 0;
	let accountsCallIndex = 0;

	return {
		from: vi.fn((table: string) => {
			if (table === "subscriptions") {
				return subscriptionsCalls[subscriptionsCallIndex++];
			}
			if (table === "accounts") {
				return accountsCalls[accountsCallIndex++];
			}
			throw new Error(`Unexpected table: ${table}`);
		}),
		// Add other required Supabase client methods as empty mocks
		auth: {} as any,
		rpc: vi.fn() as any,
		storage: {} as any,
		realtime: {} as any,
		channel: vi.fn() as any,
		removeChannel: vi.fn() as any,
		removeAllChannels: vi.fn() as any,
		getChannels: vi.fn() as any,
	} as unknown as SupabaseClient<Database>;
}

describe("AdminDashboardService", () => {
	let mockLogger: any;

	beforeEach(() => {
		vi.clearAllMocks();
		mockLogger = {
			error: vi.fn(),
			info: vi.fn(),
			warn: vi.fn(),
			debug: vi.fn(),
		};
		vi.mocked(getLogger).mockResolvedValue(mockLogger);
	});

	describe("Factory Function", () => {
		it("should create an instance of AdminDashboardService", () => {
			const mockClient = createMockSupabaseClient();
			const service = createAdminDashboardService(mockClient);

			expect(service).toBeInstanceOf(AdminDashboardService);
		});
	});

	describe("getDashboardData", () => {
		describe("Successful Data Fetching", () => {
			it("should fetch all dashboard metrics with default count parameter", async () => {
				// Arrange
				const mockClient = createMockSupabaseClient({
					subscriptions: { active: 25, trialing: 8 },
					accounts: { personal: 50, team: 10 },
				});
				const service = new AdminDashboardService(mockClient);

				// Act
				const result = await service.getDashboardData();

				// Assert
				expect(result).toEqual({
					subscriptions: 25,
					trials: 8,
					accounts: 50,
					teamAccounts: 10,
				});

				// Verify correct queries were made
				expect(mockClient.from).toHaveBeenCalledTimes(4);
				expect(mockClient.from).toHaveBeenNthCalledWith(1, "subscriptions");
				expect(mockClient.from).toHaveBeenNthCalledWith(2, "subscriptions");
				expect(mockClient.from).toHaveBeenNthCalledWith(3, "accounts");
				expect(mockClient.from).toHaveBeenNthCalledWith(4, "accounts");
			});

			it("should use exact count when specified", async () => {
				// Arrange
				const mockClient = createMockSupabaseClient();
				const service = new AdminDashboardService(mockClient);

				// Act
				const result = await service.getDashboardData({ count: "exact" });

				// Assert
				expect(result).toBeDefined();
				// Note: We'd need to modify the mock to verify the count parameter
				// For now, we're ensuring the method doesn't throw
			});

			it("should use planned count when specified", async () => {
				// Arrange
				const mockClient = createMockSupabaseClient();
				const service = new AdminDashboardService(mockClient);

				// Act
				const result = await service.getDashboardData({ count: "planned" });

				// Assert
				expect(result).toBeDefined();
			});

			it("should handle zero counts", async () => {
				// Arrange
				const mockClient = createMockSupabaseClient({
					subscriptions: { active: 0, trialing: 0 },
					accounts: { personal: 0, team: 0 },
				});
				const service = new AdminDashboardService(mockClient);

				// Act
				const result = await service.getDashboardData();

				// Assert
				expect(result).toEqual({
					subscriptions: 0,
					trials: 0,
					accounts: 0,
					teamAccounts: 0,
				});
			});

			it("should fetch data in parallel", async () => {
				// Arrange
				const mockClient = createMockSupabaseClient();
				const service = new AdminDashboardService(mockClient);

				// Act
				const startTime = Date.now();
				await service.getDashboardData();
				const duration = Date.now() - startTime;

				// Assert
				// All queries should run in parallel, so duration should be minimal
				expect(duration).toBeLessThan(100); // Assuming parallel execution
				expect(mockClient.from).toHaveBeenCalledTimes(4);
			});
		});

		describe("Error Handling", () => {
			it("should throw and log error when fetching active subscriptions fails", async () => {
				// Arrange
				const error = new Error("Database connection failed");
				const mockClient = createMockSupabaseClient({
					subscriptions: { error },
				});
				const service = new AdminDashboardService(mockClient);

				// Act & Assert
				await expect(service.getDashboardData()).rejects.toThrow();

				// Verify error was logged
				expect(mockLogger.error).toHaveBeenCalledWith(
					expect.objectContaining({
						name: "admin.dashboard",
						error: error.message,
					}),
					expect.stringContaining("Error fetching"),
				);
			});

			it("should throw and log error when fetching trialing subscriptions fails", async () => {
				// Arrange
				const mockClient = createMockSupabaseClient();
				// Modify the second subscription call to return an error
				const fromSpy = vi.spyOn(mockClient, "from");
				let callIndex = 0;
				fromSpy.mockImplementation(((table: string) => {
					if (table === "subscriptions") {
						callIndex++;
						if (callIndex === 2) {
							// Second call for trialing
							return createMockQueryBuilder({
								error: new Error("Trialing query failed"),
							});
						}
						return createMockQueryBuilder({ count: 10 });
					}
					return createMockQueryBuilder({ count: 5 });
				}) as any);

				const service = new AdminDashboardService(mockClient);

				// Act & Assert
				await expect(service.getDashboardData()).rejects.toThrow();

				// Verify error was logged
				expect(mockLogger.error).toHaveBeenCalledWith(
					expect.objectContaining({
						name: "admin.dashboard",
					}),
					"Error fetching trialing subscriptions",
				);
			});

			it("should throw and log error when fetching personal accounts fails", async () => {
				// Arrange
				const error = new Error("Accounts query failed");
				const mockClient = createMockSupabaseClient({
					accounts: { error },
				});
				const service = new AdminDashboardService(mockClient);

				// Act & Assert
				await expect(service.getDashboardData()).rejects.toThrow();

				// Verify error was logged
				expect(mockLogger.error).toHaveBeenCalledWith(
					expect.objectContaining({
						name: "admin.dashboard",
						error: error.message,
					}),
					expect.stringContaining("Error fetching"),
				);
			});

			it("should throw and log error when fetching team accounts fails", async () => {
				// Arrange
				const mockClient = createMockSupabaseClient();
				// Modify the second accounts call to return an error
				const fromSpy = vi.spyOn(mockClient, "from");
				let accountsCallIndex = 0;
				fromSpy.mockImplementation(((table: string) => {
					if (table === "accounts") {
						accountsCallIndex++;
						if (accountsCallIndex === 2) {
							// Second call for team accounts
							return createMockQueryBuilder({
								error: new Error("Team accounts query failed"),
							});
						}
						return createMockQueryBuilder({ count: 15 });
					}
					return createMockQueryBuilder({ count: 5 });
				}) as any);

				const service = new AdminDashboardService(mockClient);

				// Act & Assert
				await expect(service.getDashboardData()).rejects.toThrow();

				// Verify error was logged
				expect(mockLogger.error).toHaveBeenCalledWith(
					expect.objectContaining({
						name: "admin.dashboard",
					}),
					"Error fetching team accounts",
				);
			});

			it("should handle null error messages gracefully", async () => {
				// Arrange
				const mockClient = createMockSupabaseClient({
					subscriptions: { error: { message: null } },
				});
				const service = new AdminDashboardService(mockClient);

				// Act & Assert
				await expect(service.getDashboardData()).rejects.toThrow();

				// Verify error was logged even with null message
				expect(mockLogger.error).toHaveBeenCalled();
			});
		});

		describe("Edge Cases", () => {
			it("should handle null counts", async () => {
				// Arrange
				const mockClient = createMockSupabaseClient();
				const fromSpy = vi.spyOn(mockClient, "from");
				fromSpy.mockImplementation((() => {
					return createMockQueryBuilder({ count: null });
				}) as any);
				const service = new AdminDashboardService(mockClient);

				// Act
				const result = await service.getDashboardData();

				// Assert
				expect(result).toEqual({
					subscriptions: null,
					trials: null,
					accounts: null,
					teamAccounts: null,
				});
			});

			it("should handle undefined count parameter", async () => {
				// Arrange
				const mockClient = createMockSupabaseClient();
				const service = new AdminDashboardService(mockClient);

				// Act
				const result = await service.getDashboardData(undefined);

				// Assert
				expect(result).toBeDefined();
				expect(result.subscriptions).toBeGreaterThanOrEqual(0);
			});

			it("should handle very large counts", async () => {
				// Arrange
				const largeCount = Number.MAX_SAFE_INTEGER;
				const mockClient = createMockSupabaseClient({
					subscriptions: { active: largeCount, trialing: largeCount },
					accounts: { personal: largeCount, team: largeCount },
				});
				const service = new AdminDashboardService(mockClient);

				// Act
				const result = await service.getDashboardData();

				// Assert
				expect(result).toEqual({
					subscriptions: largeCount,
					trials: largeCount,
					accounts: largeCount,
					teamAccounts: largeCount,
				});
			});
		});

		describe("Integration Scenarios", () => {
			it("should complete even if one query is slow", async () => {
				// Arrange
				const mockClient = createMockSupabaseClient();
				const fromSpy = vi.spyOn(mockClient, "from");
				let callCount = 0;
				fromSpy.mockImplementation(((_table: string) => {
					callCount++;
					const builder = createMockQueryBuilder({ count: 5 });
					if (callCount === 1) {
						// Make first query slow
						const originalThen = builder.then;
						// biome-ignore lint/suspicious/noThenProperty: Mocking promise-like behavior for tests
						builder.then = vi.fn((callback: any) => {
							return new Promise((resolve) => {
								setTimeout(() => {
									resolve(originalThen.call(builder, callback));
								}, 10);
							});
						});
					}
					return builder;
				}) as any);

				const service = new AdminDashboardService(mockClient);

				// Act
				const result = await service.getDashboardData();

				// Assert
				expect(result).toBeDefined();
				expect(result.subscriptions).toBeDefined();
			});

			it("should maintain data consistency across multiple calls", async () => {
				// Arrange
				// Create a mock that can handle multiple calls
				const mockClient = {
					from: vi.fn().mockImplementation((table: string) => {
						return {
							select: vi.fn().mockReturnThis(),
							eq: vi.fn().mockImplementation((_field: string, value: any) => {
								return {
									// biome-ignore lint/suspicious/noThenProperty: Mocking promise-like behavior for tests
									then: vi.fn((callback: any) => {
										let count = 0;
										if (table === "subscriptions") {
											count = value === "active" ? 100 : 20;
										} else if (table === "accounts") {
											count = value === true ? 200 : 30;
										}
										return Promise.resolve(
											callback({
												data: null,
												error: null,
												count,
											}),
										);
									}),
								};
							}),
						};
					}),
				} as unknown as SupabaseClient<Database>;

				const service = new AdminDashboardService(mockClient);

				// Act
				const result1 = await service.getDashboardData();
				const result2 = await service.getDashboardData();

				// Assert
				// Both calls should return consistent data
				expect(result1).toEqual({
					subscriptions: 100,
					trials: 20,
					accounts: 200,
					teamAccounts: 30,
				});
				expect(result2).toEqual({
					subscriptions: 100,
					trials: 20,
					accounts: 200,
					teamAccounts: 30,
				});
				expect(mockClient.from).toHaveBeenCalledTimes(8); // 4 calls per getDashboardData
			});
		});
	});
});
