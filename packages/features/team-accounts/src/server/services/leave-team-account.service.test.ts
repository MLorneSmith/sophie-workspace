/**
 * Unit tests for LeaveTeamAccountService
 * Tests the service for leaving a team account
 */

import type { Database } from "@kit/supabase/database";
import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";
import { createLeaveTeamAccountService } from "./leave-team-account.service";

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
	const matchMock = vi.fn().mockReturnValue(finalPromise);

	return {
		delete: vi.fn().mockReturnValue({
			match: matchMock,
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
			if (table === "accounts_memberships") {
				return mockBuilder;
			}
			return createMockDeleteBuilder();
		}),
		auth: {} as any,
		rpc: vi.fn() as any,
	} as unknown as SupabaseClient<Database>;
}

describe("LeaveTeamAccountService", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Factory Function", () => {
		it("should create an instance of LeaveTeamAccountService", () => {
			const client = createMockAdminClient();
			const service = createLeaveTeamAccountService(client);

			expect(service).toBeDefined();
		});

		it("should return a new instance each time", () => {
			const client = createMockAdminClient();
			const service1 = createLeaveTeamAccountService(client);
			const service2 = createLeaveTeamAccountService(client);

			expect(service1).not.toBe(service2);
		});

		it("should have leaveTeamAccount method", () => {
			const client = createMockAdminClient();
			const service = createLeaveTeamAccountService(client);

			expect(typeof service.leaveTeamAccount).toBe("function");
		});
	});

	describe("leaveTeamAccount", () => {
		describe("Successful Leave", () => {
			it("should leave team account successfully", async () => {
				const client = createMockAdminClient();
				const service = createLeaveTeamAccountService(client);

				await service.leaveTeamAccount({
					accountId: "550e8400-e29b-41d4-a716-446655440000",
					userId: "550e8400-e29b-41d4-a716-446655440001",
				});

				expect(client.from).toHaveBeenCalledWith("accounts_memberships");
			});

			it("should call delete with correct match parameters", async () => {
				const client = createMockAdminClient();
				const service = createLeaveTeamAccountService(client);

				const accountId = "550e8400-e29b-41d4-a716-446655440000";
				const userId = "550e8400-e29b-41d4-a716-446655440001";

				await service.leaveTeamAccount({ accountId, userId });

				const mockBuilder = client.from("accounts_memberships") as any;
				expect(mockBuilder.delete).toHaveBeenCalled();
				const deleteResult = mockBuilder.delete();
				expect(deleteResult.match).toHaveBeenCalledWith({
					account_id: accountId,
					user_id: userId,
				});
			});

			it("should log info messages on successful leave", async () => {
				const { getLogger } = await import("@kit/shared/logger");
				const mockLogger = {
					info: vi.fn(),
					error: vi.fn(),
					warn: vi.fn(),
					debug: vi.fn(),
					fatal: vi.fn(),
				};
				vi.mocked(getLogger).mockResolvedValue(mockLogger);

				const client = createMockAdminClient();
				const service = createLeaveTeamAccountService(client);

				await service.leaveTeamAccount({
					accountId: "550e8400-e29b-41d4-a716-446655440000",
					userId: "550e8400-e29b-41d4-a716-446655440001",
				});

				expect(mockLogger.info).toHaveBeenCalledWith(
					expect.any(Object),
					"Leaving team account...",
				);
				expect(mockLogger.info).toHaveBeenCalledWith(
					expect.any(Object),
					"Successfully left team account",
				);
			});

			it("should not return any value on successful leave", async () => {
				const client = createMockAdminClient();
				const service = createLeaveTeamAccountService(client);

				const result = await service.leaveTeamAccount({
					accountId: "550e8400-e29b-41d4-a716-446655440000",
					userId: "550e8400-e29b-41d4-a716-446655440001",
				});

				expect(result).toBeUndefined();
			});
		});

		describe("Input Validation", () => {
			it("should reject invalid account ID (not UUID)", async () => {
				const client = createMockAdminClient();
				const service = createLeaveTeamAccountService(client);

				await expect(
					service.leaveTeamAccount({
						accountId: "not-a-uuid",
						userId: "550e8400-e29b-41d4-a716-446655440001",
					}),
				).rejects.toThrow(ZodError);
			});

			it("should reject invalid user ID (not UUID)", async () => {
				const client = createMockAdminClient();
				const service = createLeaveTeamAccountService(client);

				await expect(
					service.leaveTeamAccount({
						accountId: "550e8400-e29b-41d4-a716-446655440000",
						userId: "not-a-uuid",
					}),
				).rejects.toThrow(ZodError);
			});

			it("should reject empty account ID", async () => {
				const client = createMockAdminClient();
				const service = createLeaveTeamAccountService(client);

				await expect(
					service.leaveTeamAccount({
						accountId: "",
						userId: "550e8400-e29b-41d4-a716-446655440001",
					}),
				).rejects.toThrow(ZodError);
			});

			it("should reject empty user ID", async () => {
				const client = createMockAdminClient();
				const service = createLeaveTeamAccountService(client);

				await expect(
					service.leaveTeamAccount({
						accountId: "550e8400-e29b-41d4-a716-446655440000",
						userId: "",
					}),
				).rejects.toThrow(ZodError);
			});
		});

		describe("Error Handling", () => {
			it("should throw error when delete operation fails", async () => {
				const client = createMockAdminClient({
					deleteError: new Error("Delete failed"),
				});
				const service = createLeaveTeamAccountService(client);

				await expect(
					service.leaveTeamAccount({
						accountId: "550e8400-e29b-41d4-a716-446655440000",
						userId: "550e8400-e29b-41d4-a716-446655440001",
					}),
				).rejects.toThrow("Failed to leave team account");
			});

			it("should throw error with database error", async () => {
				const client = createMockAdminClient({
					deleteError: { message: "Database connection failed", code: "08001" },
				});
				const service = createLeaveTeamAccountService(client);

				await expect(
					service.leaveTeamAccount({
						accountId: "550e8400-e29b-41d4-a716-446655440000",
						userId: "550e8400-e29b-41d4-a716-446655440001",
					}),
				).rejects.toThrow("Failed to leave team account");
			});

			it("should log error when leave operation fails", async () => {
				const { getLogger } = await import("@kit/shared/logger");
				const mockLogger = {
					info: vi.fn(),
					error: vi.fn(),
					warn: vi.fn(),
					debug: vi.fn(),
					fatal: vi.fn(),
				};
				vi.mocked(getLogger).mockResolvedValue(mockLogger);

				const deleteError = new Error("Delete failed");
				const client = createMockAdminClient({ deleteError });
				const service = createLeaveTeamAccountService(client);

				await expect(
					service.leaveTeamAccount({
						accountId: "550e8400-e29b-41d4-a716-446655440000",
						userId: "550e8400-e29b-41d4-a716-446655440001",
					}),
				).rejects.toThrow();

				expect(mockLogger.error).toHaveBeenCalledWith(
					expect.objectContaining({
						error: deleteError,
					}),
					"Failed to leave team account",
				);
			});
		});

		describe("Edge Cases", () => {
			it("should handle valid UUID formats", async () => {
				const client = createMockAdminClient();
				const service = createLeaveTeamAccountService(client);

				// Various valid UUID formats
				const validUUIDs = [
					"550e8400-e29b-41d4-a716-446655440000",
					"6ba7b810-9dad-11d1-80b4-00c04fd430c8",
					"f47ac10b-58cc-4372-a567-0e02b2c3d479",
				];

				for (const accountId of validUUIDs) {
					await service.leaveTeamAccount({
						accountId,
						userId: "550e8400-e29b-41d4-a716-446655440001",
					});
				}

				expect(client.from).toHaveBeenCalledTimes(validUUIDs.length);
			});
		});

		describe("Multiple Operations", () => {
			it("should handle multiple sequential leave operations", async () => {
				const client = createMockAdminClient();
				const service = createLeaveTeamAccountService(client);

				await service.leaveTeamAccount({
					accountId: "550e8400-e29b-41d4-a716-446655440001",
					userId: "550e8400-e29b-41d4-a716-446655440000",
				});
				await service.leaveTeamAccount({
					accountId: "550e8400-e29b-41d4-a716-446655440002",
					userId: "550e8400-e29b-41d4-a716-446655440000",
				});

				expect(client.from).toHaveBeenCalledTimes(2);
			});
		});
	});
});
