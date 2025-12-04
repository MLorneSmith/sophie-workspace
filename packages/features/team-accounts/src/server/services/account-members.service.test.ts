/**
 * Unit tests for AccountMembersService
 * Tests the member management service for team accounts
 */

import type { Database } from "@kit/supabase/database";
import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAccountMembersService } from "./account-members.service";

// Mock the logger
vi.mock("@kit/shared/logger", () => ({
	getLogger: vi.fn().mockResolvedValue({
		info: vi.fn(),
		error: vi.fn(),
		warn: vi.fn(),
		debug: vi.fn(),
	}),
}));

// Mock the per-seat billing service
vi.mock("./account-per-seat-billing.service", () => ({
	createAccountPerSeatBillingService: vi.fn(() => ({
		decreaseSeats: vi.fn().mockResolvedValue(undefined),
		increaseSeats: vi.fn().mockResolvedValue(undefined),
	})),
}));

// Helper to create mock query builder for delete/update operations
function createMockQueryBuilder(options?: {
	data?: any;
	error?: any;
	rpcData?: any;
	rpcError?: any;
}) {
	const finalPromise = Promise.resolve({
		data: options?.data ?? null,
		error: options?.error ?? null,
	});

	const matchMock = vi.fn().mockReturnValue(finalPromise);

	return {
		delete: vi.fn().mockReturnValue({ match: matchMock }),
		update: vi.fn().mockReturnValue({ match: matchMock }),
		select: vi.fn().mockReturnThis(),
		eq: vi.fn().mockReturnThis(),
		single: vi.fn().mockResolvedValue({
			data: options?.data ?? null,
			error: options?.error ?? null,
		}),
	};
}

// Helper to create mock Supabase client
function createMockSupabaseClient(config?: {
	deleteError?: any;
	updateError?: any;
	rpcData?: any;
	rpcError?: any;
}): SupabaseClient<Database> {
	return {
		from: vi.fn((table: string) => {
			if (table === "accounts_memberships") {
				return createMockQueryBuilder({
					error: config?.deleteError || config?.updateError,
				});
			}
			return createMockQueryBuilder();
		}),
		rpc: vi.fn((fn: string) => {
			if (fn === "can_action_account_member") {
				return Promise.resolve({
					data: config?.rpcData ?? true,
					error: config?.rpcError ?? null,
				});
			}
			if (fn === "transfer_team_account_ownership") {
				return Promise.resolve({
					data: config?.rpcData ?? true,
					error: config?.rpcError ?? null,
				});
			}
			return Promise.resolve({ data: null, error: null });
		}),
		auth: {} as any,
	} as unknown as SupabaseClient<Database>;
}

describe("AccountMembersService", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Factory Function", () => {
		it("should create an instance of AccountMembersService", () => {
			const client = createMockSupabaseClient();
			const service = createAccountMembersService(client);

			expect(service).toBeDefined();
		});

		it("should return a new instance each time", () => {
			const client = createMockSupabaseClient();
			const service1 = createAccountMembersService(client);
			const service2 = createAccountMembersService(client);

			expect(service1).not.toBe(service2);
		});

		it("should have removeMemberFromAccount method", () => {
			const client = createMockSupabaseClient();
			const service = createAccountMembersService(client);

			expect(typeof service.removeMemberFromAccount).toBe("function");
		});

		it("should have updateMemberRole method", () => {
			const client = createMockSupabaseClient();
			const service = createAccountMembersService(client);

			expect(typeof service.updateMemberRole).toBe("function");
		});

		it("should have transferOwnership method", () => {
			const client = createMockSupabaseClient();
			const service = createAccountMembersService(client);

			expect(typeof service.transferOwnership).toBe("function");
		});
	});

	describe("removeMemberFromAccount", () => {
		describe("Successful Removal", () => {
			it("should remove a member successfully", async () => {
				const client = createMockSupabaseClient();
				const service = createAccountMembersService(client);

				await service.removeMemberFromAccount({
					accountId: "team-123",
					userId: "user-456",
				});

				expect(client.from).toHaveBeenCalledWith("accounts_memberships");
			});

			it("should call from with accounts_memberships table", async () => {
				const client = createMockSupabaseClient();
				const service = createAccountMembersService(client);

				await service.removeMemberFromAccount({
					accountId: "team-123",
					userId: "user-456",
				});

				// Verify the client.from was called with the memberships table
				expect(client.from).toHaveBeenCalledWith("accounts_memberships");
			});

			it("should call billing service to decrease seats", async () => {
				const { createAccountPerSeatBillingService } = await import(
					"./account-per-seat-billing.service"
				);
				const mockBillingService = {
					decreaseSeats: vi.fn().mockResolvedValue(undefined),
					increaseSeats: vi.fn(),
				};
				vi.mocked(createAccountPerSeatBillingService).mockReturnValue(
					mockBillingService as any,
				);

				const client = createMockSupabaseClient();
				const service = createAccountMembersService(client);

				await service.removeMemberFromAccount({
					accountId: "team-123",
					userId: "user-456",
				});

				expect(mockBillingService.decreaseSeats).toHaveBeenCalledWith(
					"team-123",
				);
			});

			it("should log info messages on successful removal", async () => {
				const { getLogger } = await import("@kit/shared/logger");
				const mockLogger = {
					info: vi.fn(),
					error: vi.fn(),
					warn: vi.fn(),
					debug: vi.fn(),
					fatal: vi.fn(),
				};
				vi.mocked(getLogger).mockResolvedValue(mockLogger);

				const client = createMockSupabaseClient();
				const service = createAccountMembersService(client);

				await service.removeMemberFromAccount({
					accountId: "team-123",
					userId: "user-456",
				});

				expect(mockLogger.info).toHaveBeenCalledWith(
					expect.any(Object),
					"Removing member from account...",
				);
				expect(mockLogger.info).toHaveBeenCalledWith(
					expect.any(Object),
					"Successfully removed member from account. Verifying seat count...",
				);
			});
		});

		describe("Error Handling", () => {
			it("should throw error when deletion fails", async () => {
				const deleteError = new Error("Delete failed");
				const client = createMockSupabaseClient({ deleteError });
				const service = createAccountMembersService(client);

				await expect(
					service.removeMemberFromAccount({
						accountId: "team-123",
						userId: "user-456",
					}),
				).rejects.toThrow(deleteError);
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

				const deleteError = new Error("Delete failed");
				const client = createMockSupabaseClient({ deleteError });
				const service = createAccountMembersService(client);

				await expect(
					service.removeMemberFromAccount({
						accountId: "team-123",
						userId: "user-456",
					}),
				).rejects.toThrow();

				expect(mockLogger.error).toHaveBeenCalledWith(
					expect.objectContaining({
						error: deleteError,
					}),
					"Failed to remove member from account",
				);
			});
		});
	});

	describe("updateMemberRole", () => {
		describe("Successful Update", () => {
			it("should update member role successfully", async () => {
				const client = createMockSupabaseClient();
				const adminClient = createMockSupabaseClient();
				const service = createAccountMembersService(client);

				await service.updateMemberRole(
					{
						accountId: "team-123",
						userId: "user-456",
						role: "admin",
					},
					adminClient,
				);

				expect(client.rpc).toHaveBeenCalledWith("can_action_account_member", {
					target_user_id: "user-456",
					target_team_account_id: "team-123",
				});
			});

			it("should use admin client for the update", async () => {
				const client = createMockSupabaseClient();
				const adminClient = createMockSupabaseClient();
				const service = createAccountMembersService(client);

				await service.updateMemberRole(
					{
						accountId: "team-123",
						userId: "user-456",
						role: "member",
					},
					adminClient,
				);

				expect(adminClient.from).toHaveBeenCalledWith("accounts_memberships");
			});

			it("should log info messages on successful update", async () => {
				const { getLogger } = await import("@kit/shared/logger");
				const mockLogger = {
					info: vi.fn(),
					error: vi.fn(),
					warn: vi.fn(),
					debug: vi.fn(),
					fatal: vi.fn(),
				};
				vi.mocked(getLogger).mockResolvedValue(mockLogger);

				const client = createMockSupabaseClient();
				const adminClient = createMockSupabaseClient();
				const service = createAccountMembersService(client);

				await service.updateMemberRole(
					{
						accountId: "team-123",
						userId: "user-456",
						role: "admin",
					},
					adminClient,
				);

				expect(mockLogger.info).toHaveBeenCalledWith(
					expect.any(Object),
					"Validating permissions to update member role...",
				);
			});
		});

		describe("Permission Validation", () => {
			it("should throw error when user lacks permission", async () => {
				const client = createMockSupabaseClient({
					rpcData: false,
				});
				const adminClient = createMockSupabaseClient();
				const service = createAccountMembersService(client);

				await expect(
					service.updateMemberRole(
						{
							accountId: "team-123",
							userId: "user-456",
							role: "admin",
						},
						adminClient,
					),
				).rejects.toThrow(
					"Failed to validate permissions to update member role",
				);
			});

			it("should throw error when permission check fails", async () => {
				const client = createMockSupabaseClient({
					rpcError: new Error("Permission check failed"),
				});
				const adminClient = createMockSupabaseClient();
				const service = createAccountMembersService(client);

				await expect(
					service.updateMemberRole(
						{
							accountId: "team-123",
							userId: "user-456",
							role: "admin",
						},
						adminClient,
					),
				).rejects.toThrow(
					"Failed to validate permissions to update member role",
				);
			});
		});

		describe("Error Handling", () => {
			it("should throw error when update fails", async () => {
				const client = createMockSupabaseClient();
				const updateError = new Error("Update failed");
				const adminClient = createMockSupabaseClient({ updateError });
				const service = createAccountMembersService(client);

				await expect(
					service.updateMemberRole(
						{
							accountId: "team-123",
							userId: "user-456",
							role: "admin",
						},
						adminClient,
					),
				).rejects.toThrow(updateError);
			});
		});
	});

	describe("transferOwnership", () => {
		describe("Successful Transfer", () => {
			it("should transfer ownership successfully", async () => {
				const client = createMockSupabaseClient();
				const adminClient = createMockSupabaseClient();
				const service = createAccountMembersService(client);

				await service.transferOwnership(
					{
						accountId: "team-123",
						userId: "new-owner-456",
						otp: "123456",
					},
					adminClient,
				);

				expect(adminClient.rpc).toHaveBeenCalledWith(
					"transfer_team_account_ownership",
					{
						target_account_id: "team-123",
						new_owner_id: "new-owner-456",
					},
				);
			});

			it("should log info messages on successful transfer", async () => {
				const { getLogger } = await import("@kit/shared/logger");
				const mockLogger = {
					info: vi.fn(),
					error: vi.fn(),
					warn: vi.fn(),
					debug: vi.fn(),
					fatal: vi.fn(),
				};
				vi.mocked(getLogger).mockResolvedValue(mockLogger);

				const client = createMockSupabaseClient();
				const adminClient = createMockSupabaseClient();
				const service = createAccountMembersService(client);

				await service.transferOwnership(
					{
						accountId: "team-123",
						userId: "new-owner-456",
						otp: "123456",
					},
					adminClient,
				);

				expect(mockLogger.info).toHaveBeenCalledWith(
					expect.any(Object),
					"Transferring ownership of account...",
				);
				expect(mockLogger.info).toHaveBeenCalledWith(
					expect.any(Object),
					"Successfully transferred ownership of account",
				);
			});
		});

		describe("Error Handling", () => {
			it("should throw error when transfer fails", async () => {
				const client = createMockSupabaseClient();
				const rpcError = new Error("Transfer failed");
				const adminClient = createMockSupabaseClient({ rpcError });
				const service = createAccountMembersService(client);

				await expect(
					service.transferOwnership(
						{
							accountId: "team-123",
							userId: "new-owner-456",
							otp: "123456",
						},
						adminClient,
					),
				).rejects.toThrow(rpcError);
			});

			it("should log error when transfer fails", async () => {
				const { getLogger } = await import("@kit/shared/logger");
				const mockLogger = {
					info: vi.fn(),
					error: vi.fn(),
					warn: vi.fn(),
					debug: vi.fn(),
					fatal: vi.fn(),
				};
				vi.mocked(getLogger).mockResolvedValue(mockLogger);

				const client = createMockSupabaseClient();
				const rpcError = new Error("Transfer failed");
				const adminClient = createMockSupabaseClient({ rpcError });
				const service = createAccountMembersService(client);

				await expect(
					service.transferOwnership(
						{
							accountId: "team-123",
							userId: "new-owner-456",
							otp: "123456",
						},
						adminClient,
					),
				).rejects.toThrow();

				expect(mockLogger.error).toHaveBeenCalledWith(
					expect.objectContaining({ error: rpcError }),
					"Failed to transfer ownership of account",
				);
			});
		});
	});
});
