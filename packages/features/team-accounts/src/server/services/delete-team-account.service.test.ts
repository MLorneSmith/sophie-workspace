/**
 * Unit tests for DeleteTeamAccountService
 * Tests the team account deletion service
 */

import type { Database } from "@kit/supabase/database";
import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDeleteTeamAccountService } from "./delete-team-account.service";

// Mock the logger
vi.mock("@kit/shared/logger", () => ({
	getLogger: vi.fn().mockResolvedValue({
		info: vi.fn(),
		error: vi.fn(),
		warn: vi.fn(),
		debug: vi.fn(),
	}),
}));

// Helper to create mock delete query builder
function createMockDeleteBuilder(options?: { error?: any }) {
	const finalPromise = Promise.resolve({ error: options?.error ?? null });
	const eqMock = vi.fn().mockReturnValue(finalPromise);

	return {
		delete: vi.fn().mockReturnValue({
			eq: eqMock,
		}),
	};
}

// Helper to create mock admin Supabase client
function createMockAdminClient(config?: {
	deleteError?: any;
}): SupabaseClient<Database> {
	const mockBuilder = createMockDeleteBuilder({ error: config?.deleteError });

	return {
		from: vi.fn((table: string) => {
			if (table === "accounts") {
				return mockBuilder;
			}
			return createMockDeleteBuilder();
		}),
		auth: {} as any,
		rpc: vi.fn() as any,
	} as unknown as SupabaseClient<Database>;
}

describe("DeleteTeamAccountService", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Factory Function", () => {
		it("should create an instance of DeleteTeamAccountService", () => {
			const service = createDeleteTeamAccountService();

			expect(service).toBeDefined();
		});

		it("should return a new instance each time", () => {
			const service1 = createDeleteTeamAccountService();
			const service2 = createDeleteTeamAccountService();

			expect(service1).not.toBe(service2);
		});

		it("should have deleteTeamAccount method", () => {
			const service = createDeleteTeamAccountService();

			expect(typeof service.deleteTeamAccount).toBe("function");
		});
	});

	describe("deleteTeamAccount", () => {
		describe("Successful Deletion", () => {
			it("should delete a team account successfully", async () => {
				const adminClient = createMockAdminClient();
				const service = createDeleteTeamAccountService();

				await service.deleteTeamAccount(adminClient, {
					accountId: "team-123",
					userId: "user-456",
				});

				expect(adminClient.from).toHaveBeenCalledWith("accounts");
			});

			it("should call delete with correct account ID", async () => {
				const adminClient = createMockAdminClient();
				const service = createDeleteTeamAccountService();

				await service.deleteTeamAccount(adminClient, {
					accountId: "team-123",
					userId: "user-456",
				});

				const mockBuilder = adminClient.from("accounts") as any;
				expect(mockBuilder.delete).toHaveBeenCalled();
				const deleteResult = mockBuilder.delete();
				expect(deleteResult.eq).toHaveBeenCalledWith("id", "team-123");
			});

			it("should handle UUID format account IDs", async () => {
				const adminClient = createMockAdminClient();
				const service = createDeleteTeamAccountService();

				await service.deleteTeamAccount(adminClient, {
					accountId: "550e8400-e29b-41d4-a716-446655440000",
					userId: "user-456",
				});

				const mockBuilder = adminClient.from("accounts") as any;
				const deleteResult = mockBuilder.delete();
				expect(deleteResult.eq).toHaveBeenCalledWith(
					"id",
					"550e8400-e29b-41d4-a716-446655440000",
				);
			});

			it("should log info messages on successful deletion", async () => {
				const { getLogger } = await import("@kit/shared/logger");
				const mockLogger = {
					info: vi.fn(),
					error: vi.fn(),
					warn: vi.fn(),
					debug: vi.fn(),
					fatal: vi.fn(),
				};
				vi.mocked(getLogger).mockResolvedValue(mockLogger);

				const adminClient = createMockAdminClient();
				const service = createDeleteTeamAccountService();

				await service.deleteTeamAccount(adminClient, {
					accountId: "team-123",
					userId: "user-456",
				});

				expect(mockLogger.info).toHaveBeenCalledWith(
					expect.objectContaining({
						accountId: "team-123",
						userId: "user-456",
					}),
					"Requested team account deletion. Processing...",
				);
				expect(mockLogger.info).toHaveBeenCalledWith(
					expect.any(Object),
					"Successfully deleted team account",
				);
			});

			it("should not return any value on successful deletion", async () => {
				const adminClient = createMockAdminClient();
				const service = createDeleteTeamAccountService();

				const result = await service.deleteTeamAccount(adminClient, {
					accountId: "team-123",
					userId: "user-456",
				});

				expect(result).toBeUndefined();
			});
		});

		describe("Error Handling", () => {
			it("should throw error when deletion fails", async () => {
				const adminClient = createMockAdminClient({
					deleteError: new Error("Deletion failed"),
				});
				const service = createDeleteTeamAccountService();

				await expect(
					service.deleteTeamAccount(adminClient, {
						accountId: "team-123",
						userId: "user-456",
					}),
				).rejects.toThrow("Failed to delete team account");
			});

			it("should throw error with foreign key violation", async () => {
				const adminClient = createMockAdminClient({
					deleteError: { message: "foreign_key_violation", code: "23503" },
				});
				const service = createDeleteTeamAccountService();

				await expect(
					service.deleteTeamAccount(adminClient, {
						accountId: "team-123",
						userId: "user-456",
					}),
				).rejects.toThrow("Failed to delete team account");
			});

			it("should throw error when account not found", async () => {
				const adminClient = createMockAdminClient({
					deleteError: new Error("Account not found"),
				});
				const service = createDeleteTeamAccountService();

				await expect(
					service.deleteTeamAccount(adminClient, {
						accountId: "non-existent",
						userId: "user-456",
					}),
				).rejects.toThrow("Failed to delete team account");
			});

			it("should throw error with permission denied", async () => {
				const adminClient = createMockAdminClient({
					deleteError: new Error("Permission denied"),
				});
				const service = createDeleteTeamAccountService();

				await expect(
					service.deleteTeamAccount(adminClient, {
						accountId: "team-123",
						userId: "user-456",
					}),
				).rejects.toThrow("Failed to delete team account");
			});

			it("should log error when deletion fails", async () => {
				const { getLogger } = await import("@kit/shared/logger");
				const mockLogger = {
					info: vi.fn(),
					error: vi.fn(),
					warn: vi.fn(),
					debug: vi.fn(),
					fatal: vi.fn(),
				};
				vi.mocked(getLogger).mockResolvedValue(mockLogger);

				const deleteError = new Error("Database error");
				const adminClient = createMockAdminClient({ deleteError });
				const service = createDeleteTeamAccountService();

				await expect(
					service.deleteTeamAccount(adminClient, {
						accountId: "team-123",
						userId: "user-456",
					}),
				).rejects.toThrow();

				expect(mockLogger.error).toHaveBeenCalledWith(
					expect.objectContaining({
						error: deleteError,
					}),
					"Failed to delete team account",
				);
			});
		});

		describe("Edge Cases", () => {
			it("should handle empty string account ID", async () => {
				const adminClient = createMockAdminClient();
				const service = createDeleteTeamAccountService();

				await service.deleteTeamAccount(adminClient, {
					accountId: "",
					userId: "user-456",
				});

				const mockBuilder = adminClient.from("accounts") as any;
				const deleteResult = mockBuilder.delete();
				expect(deleteResult.eq).toHaveBeenCalledWith("id", "");
			});

			it("should handle special characters in account ID", async () => {
				const adminClient = createMockAdminClient();
				const service = createDeleteTeamAccountService();
				const accountId = "team_!@#$%^&*()";

				await service.deleteTeamAccount(adminClient, {
					accountId,
					userId: "user-456",
				});

				const mockBuilder = adminClient.from("accounts") as any;
				const deleteResult = mockBuilder.delete();
				expect(deleteResult.eq).toHaveBeenCalledWith("id", accountId);
			});
		});

		describe("Multiple Operations", () => {
			it("should handle multiple sequential deletions", async () => {
				const adminClient = createMockAdminClient();
				const service = createDeleteTeamAccountService();

				await service.deleteTeamAccount(adminClient, {
					accountId: "team-1",
					userId: "user-456",
				});
				await service.deleteTeamAccount(adminClient, {
					accountId: "team-2",
					userId: "user-456",
				});
				await service.deleteTeamAccount(adminClient, {
					accountId: "team-3",
					userId: "user-456",
				});

				expect(adminClient.from).toHaveBeenCalledTimes(3);
			});
		});
	});
});
