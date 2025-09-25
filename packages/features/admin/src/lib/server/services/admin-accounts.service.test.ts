/**
 * Unit tests for AdminAccountsService
 * Tests the admin account management functionality
 */

import type { Database } from "@kit/supabase/database";
import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAdminAccountsService } from "./admin-accounts.service";

// Helper to create mock query builder for delete operations
function createMockDeleteBuilder(options?: { error?: any }) {
	// Create the final promise that will be returned by eq()
	const finalPromise = Promise.resolve({ error: options?.error ?? null });

	// Create the eq mock that will be returned by delete()
	const eqMock = vi.fn().mockReturnValue(finalPromise);

	// Create the object that delete() will return
	const deleteResult = {
		eq: eqMock,
	};

	// Create the delete mock that will be returned by from()
	const deleteMock = vi.fn().mockReturnValue(deleteResult);

	// Return the builder with delete method and the result for testing
	return {
		delete: deleteMock,
		_deleteResult: deleteResult, // For test assertions
	};
}

// Helper to create mock Supabase client
function createMockSupabaseClient(config?: {
	deleteError?: any;
}): SupabaseClient<Database> {
	// Create the mock builder once so it's reused across calls
	const mockBuilder = createMockDeleteBuilder({
		error: config?.deleteError,
	});

	return {
		from: vi.fn((table: string) => {
			if (table === "accounts") {
				return mockBuilder;
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

describe("AdminAccountsService", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Factory Function", () => {
		it("should create an instance of AdminAccountsService", () => {
			const mockClient = createMockSupabaseClient();
			const service = createAdminAccountsService(mockClient);

			expect(service).toBeDefined();
			expect(service).toHaveProperty("deleteAccount");
		});

		it("should return a new instance each time", () => {
			const mockClient = createMockSupabaseClient();
			const service1 = createAdminAccountsService(mockClient);
			const service2 = createAdminAccountsService(mockClient);

			expect(service1).not.toBe(service2);
		});
	});

	describe("deleteAccount", () => {
		describe("Successful Deletion", () => {
			it("should delete an account successfully", async () => {
				// Arrange
				const mockClient = createMockSupabaseClient();
				const service = createAdminAccountsService(mockClient);
				const accountId = "acc_123456789";

				// Act
				await service.deleteAccount(accountId);

				// Assert
				expect(mockClient.from).toHaveBeenCalledWith("accounts");
				expect(mockClient.from).toHaveBeenCalledTimes(1);
				const mockBuilder = mockClient.from("accounts") as any;
				expect(mockBuilder.delete).toHaveBeenCalled();
				const deleteResult = mockBuilder.delete();
				expect(deleteResult.eq).toHaveBeenCalledWith("id", accountId);
			});

			it("should handle UUID format account IDs", async () => {
				// Arrange
				const mockClient = createMockSupabaseClient();
				const service = createAdminAccountsService(mockClient);
				const accountId = "550e8400-e29b-41d4-a716-446655440000";

				// Act
				await service.deleteAccount(accountId);

				// Assert
				const mockBuilder = mockClient.from("accounts") as any;
				const deleteResult = mockBuilder.delete();
				expect(deleteResult.eq).toHaveBeenCalledWith("id", accountId);
			});

			it("should handle numeric string account IDs", async () => {
				// Arrange
				const mockClient = createMockSupabaseClient();
				const service = createAdminAccountsService(mockClient);
				const accountId = "12345";

				// Act
				await service.deleteAccount(accountId);

				// Assert
				const mockBuilder = mockClient.from("accounts") as any;
				const deleteResult = mockBuilder.delete();
				expect(deleteResult.eq).toHaveBeenCalledWith("id", accountId);
			});

			it("should not return any value on successful deletion", async () => {
				// Arrange
				const mockClient = createMockSupabaseClient();
				const service = createAdminAccountsService(mockClient);

				// Act
				const result = await service.deleteAccount("acc_123");

				// Assert
				expect(result).toBeUndefined();
			});
		});

		describe("Error Handling", () => {
			it("should throw error when deletion fails", async () => {
				// Arrange
				const error = new Error("Database connection failed");
				const mockClient = createMockSupabaseClient({
					deleteError: error,
				});
				const service = createAdminAccountsService(mockClient);

				// Act & Assert
				await expect(service.deleteAccount("acc_123")).rejects.toThrow(
					"Database connection failed",
				);
			});

			it("should throw error with constraint violation", async () => {
				// Arrange
				const error = new Error("violates foreign key constraint");
				const mockClient = createMockSupabaseClient({
					deleteError: error,
				});
				const service = createAdminAccountsService(mockClient);

				// Act & Assert
				await expect(service.deleteAccount("acc_123")).rejects.toThrow(
					"violates foreign key constraint",
				);
			});

			it("should throw error when account not found", async () => {
				// Arrange
				const error = new Error("Account not found");
				const mockClient = createMockSupabaseClient({
					deleteError: error,
				});
				const service = createAdminAccountsService(mockClient);

				// Act & Assert
				await expect(service.deleteAccount("non_existent")).rejects.toThrow(
					"Account not found",
				);
			});

			it("should throw error with permission denied", async () => {
				// Arrange
				const error = new Error("Permission denied");
				const mockClient = createMockSupabaseClient({
					deleteError: error,
				});
				const service = createAdminAccountsService(mockClient);

				// Act & Assert
				await expect(service.deleteAccount("acc_123")).rejects.toThrow(
					"Permission denied",
				);
			});

			it("should throw the exact error object from Supabase", async () => {
				// Arrange
				const customError = {
					message: "Custom error",
					code: "42P01",
					details: "Table does not exist",
				};
				const mockClient = createMockSupabaseClient({
					deleteError: customError,
				});
				const service = createAdminAccountsService(mockClient);

				// Act & Assert
				await expect(service.deleteAccount("acc_123")).rejects.toEqual(
					customError,
				);
			});
		});

		describe("Edge Cases", () => {
			it("should handle empty string account ID", async () => {
				// Arrange
				const mockClient = createMockSupabaseClient();
				const service = createAdminAccountsService(mockClient);

				// Act
				await service.deleteAccount("");

				// Assert
				const mockBuilder = mockClient.from("accounts") as any;
				const deleteResult = mockBuilder.delete();
				expect(deleteResult.eq).toHaveBeenCalledWith("id", "");
			});

			it("should handle special characters in account ID", async () => {
				// Arrange
				const mockClient = createMockSupabaseClient();
				const service = createAdminAccountsService(mockClient);
				const accountId = "acc_!@#$%^&*()";

				// Act
				await service.deleteAccount(accountId);

				// Assert
				const mockBuilder = mockClient.from("accounts") as any;
				const deleteResult = mockBuilder.delete();
				expect(deleteResult.eq).toHaveBeenCalledWith("id", accountId);
			});

			it("should handle very long account IDs", async () => {
				// Arrange
				const mockClient = createMockSupabaseClient();
				const service = createAdminAccountsService(mockClient);
				const accountId = "a".repeat(1000);

				// Act
				await service.deleteAccount(accountId);

				// Assert
				const mockBuilder = mockClient.from("accounts") as any;
				const deleteResult = mockBuilder.delete();
				expect(deleteResult.eq).toHaveBeenCalledWith("id", accountId);
			});

			it("should handle null error from Supabase", async () => {
				// Arrange
				const mockClient = createMockSupabaseClient({
					deleteError: null,
				});
				const service = createAdminAccountsService(mockClient);

				// Act & Assert
				await expect(service.deleteAccount("acc_123")).resolves.toBeUndefined();
			});

			it("should handle undefined error from Supabase", async () => {
				// Arrange
				const mockClient = createMockSupabaseClient({
					deleteError: undefined,
				});
				const service = createAdminAccountsService(mockClient);

				// Act & Assert
				await expect(service.deleteAccount("acc_123")).resolves.toBeUndefined();
			});
		});

		describe("Multiple Operations", () => {
			it("should handle multiple sequential deletions", async () => {
				// Arrange
				const mockClient = createMockSupabaseClient();
				const service = createAdminAccountsService(mockClient);

				// Act
				await service.deleteAccount("acc_1");
				await service.deleteAccount("acc_2");
				await service.deleteAccount("acc_3");

				// Assert
				expect(mockClient.from).toHaveBeenCalledTimes(3);
			});

			it("should handle concurrent deletions", async () => {
				// Arrange
				const mockClient = createMockSupabaseClient();
				const service = createAdminAccountsService(mockClient);

				// Act
				const promises = [
					service.deleteAccount("acc_1"),
					service.deleteAccount("acc_2"),
					service.deleteAccount("acc_3"),
				];
				await Promise.all(promises);

				// Assert
				expect(mockClient.from).toHaveBeenCalledTimes(3);
			});

			it("should maintain isolation between operations", async () => {
				// Arrange
				const mockClient = createMockSupabaseClient();
				const service = createAdminAccountsService(mockClient);
				let callCount = 0;
				vi.spyOn(mockClient, "from").mockImplementation(((_table: string) => {
					callCount++;
					if (callCount === 2) {
						// Second call fails
						return createMockDeleteBuilder({
							error: new Error("Second deletion failed"),
						});
					}
					return createMockDeleteBuilder();
				}) as any);

				// Act
				await service.deleteAccount("acc_1"); // Should succeed
				await expect(service.deleteAccount("acc_2")).rejects.toThrow(
					"Second deletion failed",
				);
				await service.deleteAccount("acc_3"); // Should succeed

				// Assert
				expect(mockClient.from).toHaveBeenCalledTimes(3);
			});
		});

		describe("Client Validation", () => {
			it("should handle client without from method", async () => {
				// Arrange
				const mockClient = {
					from: undefined,
				} as unknown as SupabaseClient<Database>;
				const service = createAdminAccountsService(mockClient);

				// Act & Assert
				await expect(service.deleteAccount("acc_123")).rejects.toThrow();
			});

			it("should handle client that returns undefined", async () => {
				// Arrange
				const mockClient = {
					from: vi.fn().mockReturnValue(undefined),
				} as unknown as SupabaseClient<Database>;
				const service = createAdminAccountsService(mockClient);

				// Act & Assert
				await expect(service.deleteAccount("acc_123")).rejects.toThrow();
			});

			it("should handle malformed delete builder", async () => {
				// Arrange
				const mockClient = {
					from: vi.fn().mockReturnValue({
						delete: vi.fn().mockReturnValue(null),
					}),
				} as unknown as SupabaseClient<Database>;
				const service = createAdminAccountsService(mockClient);

				// Act & Assert
				await expect(service.deleteAccount("acc_123")).rejects.toThrow();
			});
		});
	});
});
