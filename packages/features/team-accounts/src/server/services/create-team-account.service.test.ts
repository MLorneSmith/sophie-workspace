/**
 * Unit tests for CreateTeamAccountService
 * Tests the team account creation service
 */

import type { Database } from "@kit/supabase/database";
import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createCreateTeamAccountService } from "./create-team-account.service";

// Mock the logger
vi.mock("@kit/shared/logger", () => ({
	getLogger: vi.fn().mockResolvedValue({
		info: vi.fn(),
		error: vi.fn(),
		warn: vi.fn(),
		debug: vi.fn(),
	}),
}));

// Helper to create mock Supabase client
function createMockSupabaseClient(config?: {
	rpcData?: any;
	rpcError?: any;
}): SupabaseClient<Database> {
	return {
		rpc: vi.fn().mockResolvedValue({
			data: config?.rpcData ?? { id: "team-123", slug: "new-team" },
			error: config?.rpcError ?? null,
		}),
		from: vi.fn(),
		auth: {} as any,
	} as unknown as SupabaseClient<Database>;
}

describe("CreateTeamAccountService", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Factory Function", () => {
		it("should create an instance of CreateTeamAccountService", () => {
			const client = createMockSupabaseClient();
			const service = createCreateTeamAccountService(client);

			expect(service).toBeDefined();
		});

		it("should return a new instance each time", () => {
			const client = createMockSupabaseClient();
			const service1 = createCreateTeamAccountService(client);
			const service2 = createCreateTeamAccountService(client);

			expect(service1).not.toBe(service2);
		});

		it("should have createNewOrganizationAccount method", () => {
			const client = createMockSupabaseClient();
			const service = createCreateTeamAccountService(client);

			expect(typeof service.createNewOrganizationAccount).toBe("function");
		});
	});

	describe("createNewOrganizationAccount", () => {
		describe("Successful Creation", () => {
			it("should create a team account successfully", async () => {
				const mockData = { id: "team-123", slug: "acme-corp" };
				const client = createMockSupabaseClient({ rpcData: mockData });
				const service = createCreateTeamAccountService(client);

				const result = await service.createNewOrganizationAccount({
					name: "Acme Corp",
					userId: "user-123",
				});

				expect(result.data).toEqual(mockData);
				expect(result.error).toBeNull();
			});

			it("should call RPC with correct account_name parameter", async () => {
				const client = createMockSupabaseClient();
				const service = createCreateTeamAccountService(client);

				await service.createNewOrganizationAccount({
					name: "Test Team",
					userId: "user-123",
				});

				expect(client.rpc).toHaveBeenCalledWith("create_team_account", {
					account_name: "Test Team",
				});
			});

			it("should handle team name with special characters", async () => {
				const client = createMockSupabaseClient();
				const service = createCreateTeamAccountService(client);

				await service.createNewOrganizationAccount({
					name: "O'Reilly & Associates",
					userId: "user-123",
				});

				expect(client.rpc).toHaveBeenCalledWith("create_team_account", {
					account_name: "O'Reilly & Associates",
				});
			});

			it("should handle team name with unicode characters", async () => {
				const client = createMockSupabaseClient();
				const service = createCreateTeamAccountService(client);

				await service.createNewOrganizationAccount({
					name: "日本チーム",
					userId: "user-123",
				});

				expect(client.rpc).toHaveBeenCalledWith("create_team_account", {
					account_name: "日本チーム",
				});
			});

			it("should handle team name with emojis", async () => {
				const client = createMockSupabaseClient();
				const service = createCreateTeamAccountService(client);

				await service.createNewOrganizationAccount({
					name: "🚀 Startup Team",
					userId: "user-123",
				});

				expect(client.rpc).toHaveBeenCalledWith("create_team_account", {
					account_name: "🚀 Startup Team",
				});
			});

			it("should log info messages on successful creation", async () => {
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
				const service = createCreateTeamAccountService(client);

				await service.createNewOrganizationAccount({
					name: "Test Team",
					userId: "user-123",
				});

				expect(mockLogger.info).toHaveBeenCalledWith(
					expect.objectContaining({
						name: "Test Team",
						userId: "user-123",
					}),
					"Creating new team account...",
				);
				expect(mockLogger.info).toHaveBeenCalledWith(
					expect.any(Object),
					"Team account created successfully",
				);
			});
		});

		describe("Error Handling", () => {
			it("should throw error when RPC fails", async () => {
				const client = createMockSupabaseClient({
					rpcError: new Error("RPC failed"),
				});
				const service = createCreateTeamAccountService(client);

				await expect(
					service.createNewOrganizationAccount({
						name: "Test Team",
						userId: "user-123",
					}),
				).rejects.toThrow("Error creating team account");
			});

			it("should throw error with database constraint violation", async () => {
				const client = createMockSupabaseClient({
					rpcError: { message: "unique_violation", code: "23505" },
				});
				const service = createCreateTeamAccountService(client);

				await expect(
					service.createNewOrganizationAccount({
						name: "Existing Team",
						userId: "user-123",
					}),
				).rejects.toThrow("Error creating team account");
			});

			it("should log error when RPC fails", async () => {
				const { getLogger } = await import("@kit/shared/logger");
				const mockLogger = {
					info: vi.fn(),
					error: vi.fn(),
					warn: vi.fn(),
					debug: vi.fn(),
					fatal: vi.fn(),
				};
				vi.mocked(getLogger).mockResolvedValue(mockLogger);

				const rpcError = new Error("Database connection failed");
				const client = createMockSupabaseClient({ rpcError });
				const service = createCreateTeamAccountService(client);

				await expect(
					service.createNewOrganizationAccount({
						name: "Test Team",
						userId: "user-123",
					}),
				).rejects.toThrow();

				expect(mockLogger.error).toHaveBeenCalledWith(
					expect.objectContaining({
						error: rpcError,
					}),
					"Error creating team account",
				);
			});
		});

		describe("Edge Cases", () => {
			it("should handle empty team name", async () => {
				const client = createMockSupabaseClient();
				const service = createCreateTeamAccountService(client);

				await service.createNewOrganizationAccount({
					name: "",
					userId: "user-123",
				});

				expect(client.rpc).toHaveBeenCalledWith("create_team_account", {
					account_name: "",
				});
			});

			it("should handle very long team name", async () => {
				const longName = "A".repeat(500);
				const client = createMockSupabaseClient();
				const service = createCreateTeamAccountService(client);

				await service.createNewOrganizationAccount({
					name: longName,
					userId: "user-123",
				});

				expect(client.rpc).toHaveBeenCalledWith("create_team_account", {
					account_name: longName,
				});
			});

			it("should handle team name with leading/trailing whitespace", async () => {
				const client = createMockSupabaseClient();
				const service = createCreateTeamAccountService(client);

				await service.createNewOrganizationAccount({
					name: "  Team Name  ",
					userId: "user-123",
				});

				expect(client.rpc).toHaveBeenCalledWith("create_team_account", {
					account_name: "  Team Name  ",
				});
			});
		});
	});
});
