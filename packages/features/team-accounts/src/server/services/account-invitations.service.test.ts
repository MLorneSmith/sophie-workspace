/**
 * Unit tests for AccountInvitationsService
 * Tests the invitation management service for team accounts
 */

import type { Database } from "@kit/supabase/database";
import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAccountInvitationsService } from "./account-invitations.service";

// Mock the logger
vi.mock("@kit/shared/logger", () => ({
	getLogger: vi.fn().mockResolvedValue({
		info: vi.fn(),
		error: vi.fn(),
		warn: vi.fn(),
		debug: vi.fn(),
	}),
}));

// Mock date-fns
vi.mock("date-fns", () => ({
	addDays: vi.fn((date: Date, days: number) => {
		const result = new Date(date);
		result.setDate(result.getDate() + days);
		return result;
	}),
	formatISO: vi.fn((date: Date) => date.toISOString()),
}));

// Helper to create mock query builder
function createMockQueryBuilder(options?: { data?: any; error?: any }) {
	const finalPromise = Promise.resolve({
		data: options?.data ?? null,
		error: options?.error ?? null,
	});

	const matchMock = vi.fn().mockReturnValue(finalPromise);
	const eqMock = vi
		.fn()
		.mockReturnValue({ single: vi.fn().mockResolvedValue(finalPromise) });

	return {
		delete: vi.fn().mockReturnValue({ match: matchMock }),
		update: vi.fn().mockReturnValue({ match: matchMock }),
		select: vi.fn().mockReturnThis(),
		eq: eqMock,
		single: vi.fn().mockResolvedValue(finalPromise),
	};
}

// Helper to create mock Supabase client
function createMockSupabaseClient(config?: {
	deleteError?: any;
	updateError?: any;
	selectData?: any;
	selectError?: any;
	rpcData?: any;
	rpcError?: any;
	membersData?: any[];
}): SupabaseClient<Database> {
	return {
		from: vi.fn((table: string) => {
			if (table === "invitations") {
				return createMockQueryBuilder({
					error: config?.deleteError || config?.updateError,
				});
			}
			if (table === "accounts") {
				return {
					select: vi.fn().mockReturnThis(),
					eq: vi.fn().mockReturnThis(),
					single: vi.fn().mockResolvedValue({
						data: config?.selectData ?? { name: "Test Account" },
						error: config?.selectError ?? null,
					}),
				};
			}
			return createMockQueryBuilder();
		}),
		rpc: vi.fn((fn: string) => {
			if (fn === "get_account_members") {
				return Promise.resolve({
					data: config?.membersData ?? [],
					error: null,
				});
			}
			if (fn === "add_invitations_to_account") {
				return Promise.resolve({
					data: config?.rpcData ?? [{ id: 1, email: "invited@example.com" }],
					error: config?.rpcError ?? null,
				});
			}
			if (fn === "accept_invitation") {
				return Promise.resolve({
					data: config?.rpcData ?? { slug: "test-team" },
					error: config?.rpcError ?? null,
				});
			}
			return Promise.resolve({ data: null, error: null });
		}),
		auth: {} as any,
	} as unknown as SupabaseClient<Database>;
}

describe("AccountInvitationsService", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Factory Function", () => {
		it("should create an instance of AccountInvitationsService", () => {
			const client = createMockSupabaseClient();
			const service = createAccountInvitationsService(client);

			expect(service).toBeDefined();
		});

		it("should return a new instance each time", () => {
			const client = createMockSupabaseClient();
			const service1 = createAccountInvitationsService(client);
			const service2 = createAccountInvitationsService(client);

			expect(service1).not.toBe(service2);
		});

		it("should have all required methods", () => {
			const client = createMockSupabaseClient();
			const service = createAccountInvitationsService(client);

			expect(typeof service.deleteInvitation).toBe("function");
			expect(typeof service.updateInvitation).toBe("function");
			expect(typeof service.validateInvitation).toBe("function");
			expect(typeof service.sendInvitations).toBe("function");
			expect(typeof service.acceptInvitationToTeam).toBe("function");
			expect(typeof service.renewInvitation).toBe("function");
		});
	});

	describe("deleteInvitation", () => {
		describe("Successful Deletion", () => {
			it("should delete an invitation successfully", async () => {
				const client = createMockSupabaseClient();
				const service = createAccountInvitationsService(client);

				await service.deleteInvitation({ invitationId: 123 });

				expect(client.from).toHaveBeenCalledWith("invitations");
			});

			it("should call from with invitations table", async () => {
				const client = createMockSupabaseClient();
				const service = createAccountInvitationsService(client);

				await service.deleteInvitation({ invitationId: 456 });

				// Verify the client.from was called with the invitations table
				expect(client.from).toHaveBeenCalledWith("invitations");
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

				const client = createMockSupabaseClient();
				const service = createAccountInvitationsService(client);

				await service.deleteInvitation({ invitationId: 123 });

				expect(mockLogger.info).toHaveBeenCalledWith(
					expect.any(Object),
					"Removing invitation...",
				);
				expect(mockLogger.info).toHaveBeenCalledWith(
					expect.any(Object),
					"Invitation successfully removed",
				);
			});
		});

		describe("Error Handling", () => {
			it("should throw error when deletion fails", async () => {
				const deleteError = new Error("Delete failed");
				const client = createMockSupabaseClient({ deleteError });
				const service = createAccountInvitationsService(client);

				await expect(
					service.deleteInvitation({ invitationId: 123 }),
				).rejects.toThrow(deleteError);
			});
		});
	});

	describe("updateInvitation", () => {
		describe("Successful Update", () => {
			it("should update an invitation successfully", async () => {
				const client = createMockSupabaseClient();
				const service = createAccountInvitationsService(client);

				await service.updateInvitation({
					invitationId: 123,
					role: "admin",
				});

				expect(client.from).toHaveBeenCalledWith("invitations");
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
				const service = createAccountInvitationsService(client);

				await service.updateInvitation({
					invitationId: 123,
					role: "member",
				});

				expect(mockLogger.info).toHaveBeenCalledWith(
					expect.any(Object),
					"Updating invitation...",
				);
				expect(mockLogger.info).toHaveBeenCalledWith(
					expect.any(Object),
					"Invitation successfully updated",
				);
			});
		});

		describe("Error Handling", () => {
			it("should throw error when update fails", async () => {
				const updateError = new Error("Update failed");
				const client = createMockSupabaseClient({ updateError });
				const service = createAccountInvitationsService(client);

				await expect(
					service.updateInvitation({
						invitationId: 123,
						role: "admin",
					}),
				).rejects.toThrow(updateError);
			});
		});
	});

	describe("validateInvitation", () => {
		it("should pass when user is not already a member", async () => {
			const client = createMockSupabaseClient({
				membersData: [{ email: "existing@example.com" }],
			});
			const service = createAccountInvitationsService(client);

			await expect(
				service.validateInvitation(
					{ email: "new@example.com", role: "member" },
					"test-account",
				),
			).resolves.not.toThrow();
		});

		it("should throw error when user is already a member", async () => {
			const client = createMockSupabaseClient({
				membersData: [{ email: "existing@example.com" }],
			});
			const service = createAccountInvitationsService(client);

			await expect(
				service.validateInvitation(
					{ email: "existing@example.com", role: "member" },
					"test-account",
				),
			).rejects.toThrow("User already member of the team");
		});

		it("should call RPC with correct account slug", async () => {
			const client = createMockSupabaseClient();
			const service = createAccountInvitationsService(client);

			await service.validateInvitation(
				{ email: "new@example.com", role: "member" },
				"my-team",
			);

			expect(client.rpc).toHaveBeenCalledWith("get_account_members", {
				account_slug: "my-team",
			});
		});
	});

	describe("sendInvitations", () => {
		describe("Successful Sending", () => {
			it("should send invitations successfully", async () => {
				const client = createMockSupabaseClient();
				const service = createAccountInvitationsService(client);

				const result = await service.sendInvitations({
					accountSlug: "test-team",
					invitations: [{ email: "invite@example.com", role: "member" }],
				});

				expect(result).toBeDefined();
			});

			it("should validate all invitations before sending", async () => {
				const client = createMockSupabaseClient();
				const service = createAccountInvitationsService(client);

				await service.sendInvitations({
					accountSlug: "test-team",
					invitations: [
						{ email: "user1@example.com", role: "member" },
						{ email: "user2@example.com", role: "admin" },
					],
				});

				// get_account_members should be called for each invitation during validation
				expect(client.rpc).toHaveBeenCalledWith("get_account_members", {
					account_slug: "test-team",
				});
			});

			it("should call RPC to add invitations", async () => {
				const client = createMockSupabaseClient();
				const service = createAccountInvitationsService(client);

				await service.sendInvitations({
					accountSlug: "test-team",
					invitations: [{ email: "invite@example.com", role: "member" }],
				});

				expect(client.rpc).toHaveBeenCalledWith("add_invitations_to_account", {
					invitations: [{ email: "invite@example.com", role: "member" }],
					account_slug: "test-team",
				});
			});

			it("should log info messages on successful send", async () => {
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
				const service = createAccountInvitationsService(client);

				await service.sendInvitations({
					accountSlug: "test-team",
					invitations: [{ email: "invite@example.com", role: "member" }],
				});

				expect(mockLogger.info).toHaveBeenCalledWith(
					expect.any(Object),
					"Storing invitations...",
				);
			});
		});

		describe("Error Handling", () => {
			it("should throw error when account not found", async () => {
				// Create a custom mock that specifically returns null for account data
				const mockClient = {
					from: vi.fn((table: string) => {
						if (table === "accounts") {
							return {
								select: vi.fn().mockReturnThis(),
								eq: vi.fn().mockReturnThis(),
								single: vi.fn().mockResolvedValue({
									data: null,
									error: null,
								}),
							};
						}
						return createMockQueryBuilder();
					}),
					rpc: vi.fn((fn: string) => {
						if (fn === "get_account_members") {
							return Promise.resolve({ data: [], error: null });
						}
						return Promise.resolve({ data: null, error: null });
					}),
				} as unknown as SupabaseClient<Database>;

				const service = createAccountInvitationsService(mockClient);

				await expect(
					service.sendInvitations({
						accountSlug: "non-existent",
						invitations: [{ email: "invite@example.com", role: "member" }],
					}),
				).rejects.toThrow("Account not found");
			});

			it("should throw error when RPC fails", async () => {
				const rpcError = new Error("RPC failed");
				const client = createMockSupabaseClient({ rpcError });
				const service = createAccountInvitationsService(client);

				await expect(
					service.sendInvitations({
						accountSlug: "test-team",
						invitations: [{ email: "invite@example.com", role: "member" }],
					}),
				).rejects.toThrow(rpcError);
			});

			it("should throw error when user is already a member", async () => {
				const client = createMockSupabaseClient({
					membersData: [{ email: "existing@example.com" }],
				});
				const service = createAccountInvitationsService(client);

				await expect(
					service.sendInvitations({
						accountSlug: "test-team",
						invitations: [{ email: "existing@example.com", role: "member" }],
					}),
				).rejects.toThrow("User already member of the team");
			});
		});
	});

	describe("acceptInvitationToTeam", () => {
		describe("Successful Acceptance", () => {
			it("should accept invitation successfully", async () => {
				const client = createMockSupabaseClient();
				const adminClient = createMockSupabaseClient();
				const service = createAccountInvitationsService(client);

				const result = await service.acceptInvitationToTeam(adminClient, {
					userId: "user-123",
					inviteToken: "token-abc",
				});

				expect(result).toBeDefined();
			});

			it("should call RPC with correct parameters", async () => {
				const client = createMockSupabaseClient();
				const adminClient = createMockSupabaseClient();
				const service = createAccountInvitationsService(client);

				await service.acceptInvitationToTeam(adminClient, {
					userId: "user-123",
					inviteToken: "token-abc",
				});

				expect(adminClient.rpc).toHaveBeenCalledWith("accept_invitation", {
					token: "token-abc",
					user_id: "user-123",
				});
			});

			it("should log info messages on successful acceptance", async () => {
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
				const service = createAccountInvitationsService(client);

				await service.acceptInvitationToTeam(adminClient, {
					userId: "user-123",
					inviteToken: "token-abc",
				});

				expect(mockLogger.info).toHaveBeenCalledWith(
					expect.any(Object),
					"Accepting invitation to team",
				);
				expect(mockLogger.info).toHaveBeenCalledWith(
					expect.any(Object),
					"Successfully accepted invitation to team",
				);
			});
		});

		describe("Error Handling", () => {
			it("should throw error when acceptance fails", async () => {
				const client = createMockSupabaseClient();
				const rpcError = new Error("Invalid token");
				const adminClient = createMockSupabaseClient({ rpcError });
				const service = createAccountInvitationsService(client);

				await expect(
					service.acceptInvitationToTeam(adminClient, {
						userId: "user-123",
						inviteToken: "invalid-token",
					}),
				).rejects.toThrow(rpcError);
			});
		});
	});

	describe("renewInvitation", () => {
		describe("Successful Renewal", () => {
			it("should renew invitation successfully", async () => {
				const client = createMockSupabaseClient();
				const service = createAccountInvitationsService(client);

				await service.renewInvitation(123);

				expect(client.from).toHaveBeenCalledWith("invitations");
			});

			it("should log info messages on successful renewal", async () => {
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
				const service = createAccountInvitationsService(client);

				await service.renewInvitation(123);

				expect(mockLogger.info).toHaveBeenCalledWith(
					expect.any(Object),
					"Renewing invitation...",
				);
				expect(mockLogger.info).toHaveBeenCalledWith(
					expect.any(Object),
					"Invitation successfully renewed",
				);
			});
		});

		describe("Error Handling", () => {
			it("should throw error when renewal fails", async () => {
				const updateError = new Error("Renewal failed");
				const client = createMockSupabaseClient({ updateError });
				const service = createAccountInvitationsService(client);

				await expect(service.renewInvitation(123)).rejects.toThrow(updateError);
			});
		});
	});
});
