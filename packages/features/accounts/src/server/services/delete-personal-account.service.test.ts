/**
 * Unit tests for DeletePersonalAccountService
 * Tests the personal account deletion service with environment-specific behavior
 */

import type { Database } from "@kit/supabase/database";
import type { SupabaseClient } from "@supabase/supabase-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDeletePersonalAccountService } from "./delete-personal-account.service";

// Mock the logger with all required methods
vi.mock("@kit/shared/logger", () => ({
	getLogger: vi.fn().mockResolvedValue({
		info: vi.fn(),
		error: vi.fn(),
		warn: vi.fn(),
		debug: vi.fn(),
		fatal: vi.fn(),
	}),
}));

// Helper to create mock delete query builder
function createMockDeleteBuilder(options?: { error?: any; throwError?: any }) {
	// If throwError is set, the operation should throw (reject the promise)
	// If error is set, return { error } which the code might check
	const finalPromise = options?.throwError
		? Promise.reject(options.throwError)
		: Promise.resolve({ error: options?.error ?? null });
	const eqMock = vi.fn().mockReturnValue(finalPromise);

	return {
		delete: vi.fn().mockReturnValue({ eq: eqMock }),
	};
}

// Helper to create mock admin Supabase client
function createMockAdminClient(config?: {
	deleteUserError?: any;
	deleteUserData?: any;
	membershipDeleteError?: any;
	accountsDeleteError?: any;
}): SupabaseClient<Database> {
	const fromMock = vi.fn((table: string) => {
		if (table === "accounts_memberships") {
			// Use throwError to make the promise reject, triggering the catch block
			return createMockDeleteBuilder({
				throwError: config?.membershipDeleteError,
			});
		}
		if (table === "accounts") {
			return createMockDeleteBuilder({
				throwError: config?.accountsDeleteError,
			});
		}
		return createMockDeleteBuilder();
	});

	return {
		from: fromMock,
		auth: {
			admin: {
				deleteUser: vi.fn().mockResolvedValue({
					data: config?.deleteUserData ?? { user: null },
					error: config?.deleteUserError ?? null,
				}),
			},
		},
		rpc: vi.fn() as any,
	} as unknown as SupabaseClient<Database>;
}

describe("DeletePersonalAccountService", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.unstubAllEnvs();
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	describe("Factory Function", () => {
		it("should create an instance of DeletePersonalAccountService", () => {
			const service = createDeletePersonalAccountService();

			expect(service).toBeDefined();
		});

		it("should return a new instance each time", () => {
			const service1 = createDeletePersonalAccountService();
			const service2 = createDeletePersonalAccountService();

			expect(service1).not.toBe(service2);
		});

		it("should have deletePersonalAccount method", () => {
			const service = createDeletePersonalAccountService();

			expect(typeof service.deletePersonalAccount).toBe("function");
		});
	});

	describe("deletePersonalAccount", () => {
		describe("Production Environment - Successful Deletion", () => {
			beforeEach(() => {
				vi.stubEnv("NODE_ENV", "production");
				vi.stubEnv("NEXT_PUBLIC_ENVIRONMENT", "production");
				vi.stubEnv("DATABASE_URL", "postgresql://host:5432/db");
			});

			it("should delete user successfully in production", async () => {
				const adminClient = createMockAdminClient();
				const service = createDeletePersonalAccountService();

				const result = await service.deletePersonalAccount({
					adminClient,
					userId: "user-123",
					userEmail: "user@example.com",
				});

				expect(result.success).toBe(true);
				expect(adminClient.auth.admin.deleteUser).toHaveBeenCalledWith(
					"user-123",
				);
			});

			it("should not run manual cleanup in production", async () => {
				const adminClient = createMockAdminClient();
				const service = createDeletePersonalAccountService();

				await service.deletePersonalAccount({
					adminClient,
					userId: "user-123",
					userEmail: "user@example.com",
				});

				// In production, from() should not be called for manual cleanup
				expect(adminClient.from).not.toHaveBeenCalled();
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
				const service = createDeletePersonalAccountService();

				await service.deletePersonalAccount({
					adminClient,
					userId: "user-123",
					userEmail: "user@example.com",
				});

				expect(mockLogger.info).toHaveBeenCalledWith(
					expect.objectContaining({ userId: "user-123" }),
					"User requested to delete their personal account. Processing...",
				);
				expect(mockLogger.info).toHaveBeenCalledWith(
					expect.any(Object),
					"User successfully deleted!",
				);
			});
		});

		describe("Test/Development Environment - Manual Cleanup", () => {
			beforeEach(() => {
				vi.stubEnv("NODE_ENV", "test");
			});

			it("should run manual cleanup in test environment", async () => {
				const adminClient = createMockAdminClient();
				const service = createDeletePersonalAccountService();

				await service.deletePersonalAccount({
					adminClient,
					userId: "user-123",
					userEmail: "user@example.com",
				});

				expect(adminClient.from).toHaveBeenCalledWith("accounts_memberships");
				expect(adminClient.from).toHaveBeenCalledWith("accounts");
			});

			it("should run manual cleanup in development environment", async () => {
				vi.stubEnv("NODE_ENV", "development");

				const adminClient = createMockAdminClient();
				const service = createDeletePersonalAccountService();

				await service.deletePersonalAccount({
					adminClient,
					userId: "user-123",
					userEmail: "user@example.com",
				});

				expect(adminClient.from).toHaveBeenCalledWith("accounts_memberships");
				expect(adminClient.from).toHaveBeenCalledWith("accounts");
			});

			it("should detect test environment from NEXT_PUBLIC_ENVIRONMENT", async () => {
				vi.stubEnv("NODE_ENV", "production");
				vi.stubEnv("NEXT_PUBLIC_ENVIRONMENT", "test");

				const adminClient = createMockAdminClient();
				const service = createDeletePersonalAccountService();

				await service.deletePersonalAccount({
					adminClient,
					userId: "user-123",
					userEmail: "user@example.com",
				});

				expect(adminClient.from).toHaveBeenCalled();
			});

			it("should detect test environment from DATABASE_URL with port 54322", async () => {
				vi.stubEnv("NODE_ENV", "production");
				vi.stubEnv("DATABASE_URL", "postgresql://localhost:54322/postgres");

				const adminClient = createMockAdminClient();
				const service = createDeletePersonalAccountService();

				await service.deletePersonalAccount({
					adminClient,
					userId: "user-123",
					userEmail: "user@example.com",
				});

				expect(adminClient.from).toHaveBeenCalled();
			});

			it("should ignore database error in test environment when manual cleanup succeeds", async () => {
				vi.stubEnv("NODE_ENV", "test");

				const databaseError = {
					message: "Database error deleting user",
					status: 500,
				};
				const adminClient = createMockAdminClient({
					deleteUserError: databaseError,
				});
				const service = createDeletePersonalAccountService();

				const result = await service.deletePersonalAccount({
					adminClient,
					userId: "user-123",
					userEmail: "user@example.com",
				});

				expect(result.success).toBe(true);
			});

			it("should continue with auth deletion even if manual cleanup fails", async () => {
				vi.stubEnv("NODE_ENV", "test");

				const membershipError = new Error("Cleanup failed");
				const adminClient = createMockAdminClient({
					membershipDeleteError: membershipError,
				});
				const service = createDeletePersonalAccountService();

				await service.deletePersonalAccount({
					adminClient,
					userId: "user-123",
					userEmail: "user@example.com",
				});

				// Should still call auth deletion
				expect(adminClient.auth.admin.deleteUser).toHaveBeenCalledWith(
					"user-123",
				);
			});
		});

		describe("Error Handling", () => {
			beforeEach(() => {
				vi.stubEnv("NODE_ENV", "production");
			});

			it("should throw error when auth deletion fails in production", async () => {
				// Use an Error instance since the service only extracts message from Error instances
				const deleteUserError = Object.assign(
					new Error("Auth deletion failed"),
					{
						code: "auth_error",
						status: 400,
					},
				);
				const adminClient = createMockAdminClient({ deleteUserError });
				const service = createDeletePersonalAccountService();

				// Service wraps errors with "Error deleting user: {message}"
				await expect(
					service.deletePersonalAccount({
						adminClient,
						userId: "user-123",
						userEmail: "user@example.com",
					}),
				).rejects.toThrow("Error deleting user: Auth deletion failed");
			});

			it("should handle timeout errors with specific message", async () => {
				const timeoutError = new Error("Connection timed out");
				const adminClient = createMockAdminClient({
					deleteUserError: timeoutError,
				});
				const service = createDeletePersonalAccountService();

				await expect(
					service.deletePersonalAccount({
						adminClient,
						userId: "user-123",
						userEmail: "user@example.com",
					}),
				).rejects.toThrow(
					"Account deletion timed out. Please try again later.",
				);
			});

			it("should handle foreign key violation errors with specific message", async () => {
				const fkError = {
					message: "FK violation",
					code: "foreign_key_violation",
				};
				const adminClient = createMockAdminClient({ deleteUserError: fkError });
				const service = createDeletePersonalAccountService();

				await expect(
					service.deletePersonalAccount({
						adminClient,
						userId: "user-123",
						userEmail: "user@example.com",
					}),
				).rejects.toThrow(
					"Cannot delete user due to existing data dependencies. Please contact support.",
				);
			});

			it("should wrap unknown errors with descriptive message", async () => {
				const genericError = new Error("Something went wrong");
				const adminClient = createMockAdminClient({
					deleteUserError: genericError,
				});
				const service = createDeletePersonalAccountService();

				await expect(
					service.deletePersonalAccount({
						adminClient,
						userId: "user-123",
						userEmail: "user@example.com",
					}),
				).rejects.toThrow("Error deleting user: Something went wrong");
			});

			it("should log error details when deletion fails", async () => {
				const { getLogger } = await import("@kit/shared/logger");
				const mockLogger = {
					info: vi.fn(),
					error: vi.fn(),
					warn: vi.fn(),
					debug: vi.fn(),
					fatal: vi.fn(),
				};
				vi.mocked(getLogger).mockResolvedValue(mockLogger);

				const deleteUserError = {
					message: "Auth error",
					code: "auth_error",
					status: 500,
				};
				const adminClient = createMockAdminClient({ deleteUserError });
				const service = createDeletePersonalAccountService();

				await expect(
					service.deletePersonalAccount({
						adminClient,
						userId: "user-123",
						userEmail: "user@example.com",
					}),
				).rejects.toThrow();

				expect(mockLogger.error).toHaveBeenCalledWith(
					expect.objectContaining({
						error: deleteUserError,
						errorMessage: "Auth error",
						errorCode: "auth_error",
					}),
					"Supabase auth deletion returned error",
				);
			});
		});

		describe("Edge Cases", () => {
			beforeEach(() => {
				vi.stubEnv("NODE_ENV", "production");
			});

			it("should handle null userEmail", async () => {
				const adminClient = createMockAdminClient();
				const service = createDeletePersonalAccountService();

				const result = await service.deletePersonalAccount({
					adminClient,
					userId: "user-123",
					userEmail: null,
				});

				expect(result.success).toBe(true);
			});

			it("should handle UUID format user IDs", async () => {
				const adminClient = createMockAdminClient();
				const service = createDeletePersonalAccountService();

				await service.deletePersonalAccount({
					adminClient,
					userId: "550e8400-e29b-41d4-a716-446655440000",
					userEmail: "user@example.com",
				});

				expect(adminClient.auth.admin.deleteUser).toHaveBeenCalledWith(
					"550e8400-e29b-41d4-a716-446655440000",
				);
			});

			it("should include userId in logging context", async () => {
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
				const service = createDeletePersonalAccountService();

				await service.deletePersonalAccount({
					adminClient,
					userId: "user-123",
					userEmail: "user@example.com",
				});

				expect(mockLogger.info).toHaveBeenCalledWith(
					expect.objectContaining({ userId: "user-123" }),
					expect.any(String),
				);
			});
		});

		describe("Test Environment Special Handling", () => {
			beforeEach(() => {
				vi.stubEnv("NODE_ENV", "test");
			});

			it("should log manual cleanup start in test environment", async () => {
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
				const service = createDeletePersonalAccountService();

				await service.deletePersonalAccount({
					adminClient,
					userId: "user-123",
					userEmail: "user@example.com",
				});

				expect(mockLogger.info).toHaveBeenCalledWith(
					expect.any(Object),
					"Running manual cleanup for test/dev environment...",
				);
			});

			it("should log manual cleanup completion in test environment", async () => {
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
				const service = createDeletePersonalAccountService();

				await service.deletePersonalAccount({
					adminClient,
					userId: "user-123",
					userEmail: "user@example.com",
				});

				expect(mockLogger.info).toHaveBeenCalledWith(
					expect.any(Object),
					"Manual cleanup completed",
				);
			});

			it("should warn but continue when manual cleanup encounters an error", async () => {
				const { getLogger } = await import("@kit/shared/logger");
				const mockLogger = {
					info: vi.fn(),
					error: vi.fn(),
					warn: vi.fn(),
					debug: vi.fn(),
					fatal: vi.fn(),
				};
				vi.mocked(getLogger).mockResolvedValue(mockLogger);

				const cleanupError = new Error("Cleanup error");
				const adminClient = createMockAdminClient({
					membershipDeleteError: cleanupError,
				});
				const service = createDeletePersonalAccountService();

				await service.deletePersonalAccount({
					adminClient,
					userId: "user-123",
					userEmail: "user@example.com",
				});

				expect(mockLogger.warn).toHaveBeenCalledWith(
					expect.objectContaining({ error: cleanupError }),
					"Manual cleanup encountered an error, continuing with auth deletion",
				);
			});
		});
	});
});
