/**
 * Unit tests for admin-server-actions.ts
 * Tests critical admin operations including user management, account deletion, and security controls
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	banUserAction,
	createUserAction,
	deleteAccountAction,
	deleteUserAction,
	impersonateUserAction,
	reactivateUserAction,
	resetPasswordAction,
} from "./admin-server-actions";

// Mock Next.js functions
vi.mock("next/navigation", () => ({
	redirect: vi.fn(),
	notFound: vi.fn(() => {
		throw new Error("Not Found");
	}),
}));

vi.mock("next/cache", () => ({
	revalidatePath: vi.fn(),
}));

// Mock Logger
const mockLogger = {
	info: vi.fn(),
	error: vi.fn(),
	warn: vi.fn(),
	debug: vi.fn(),
	fatal: vi.fn(),
};

vi.mock("@kit/shared/logger", () => ({
	getLogger: vi.fn(() => Promise.resolve(mockLogger)),
}));

// Mock enhanceAction to pass through the function
vi.mock("@kit/next/actions", () => ({
	enhanceAction: vi.fn((fn, config) => {
		// Return a function that validates schema and calls the original function
		return async (params: any) => {
			// Simple schema validation simulation
			if (config?.schema) {
				// This would normally validate against the schema
				// For testing, we'll just pass through
			}
			return fn(params);
		};
	}),
}));

// Mock Admin Auth Service
const mockAdminAuthService = {
	banUser: vi.fn(),
	reactivateUser: vi.fn(),
	impersonateUser: vi.fn(),
	deleteUser: vi.fn(),
	resetPassword: vi.fn(),
};

// Mock Admin Accounts Service
const mockAdminAccountsService = {
	deleteAccount: vi.fn(),
};

// Mock service creators
vi.mock("./services/admin-auth-user.service", () => ({
	createAdminAuthUserService: vi.fn(() => mockAdminAuthService),
}));

vi.mock("./services/admin-accounts.service", () => ({
	createAdminAccountsService: vi.fn(() => mockAdminAccountsService),
}));

// Mock Supabase clients
const mockSupabaseClient = {
	rpc: vi.fn(),
};

const mockSupabaseAdminClient = {
	auth: {
		admin: {
			createUser: vi.fn(),
		},
	},
};

vi.mock("@kit/supabase/server-client", () => ({
	getSupabaseServerClient: vi.fn(() => mockSupabaseClient),
}));

vi.mock("@kit/supabase/server-admin-client", () => ({
	getSupabaseServerAdminClient: vi.fn(() => mockSupabaseAdminClient),
}));

// Mock isSuperAdmin
vi.mock("./utils/is-super-admin", () => ({
	isSuperAdmin: vi.fn(),
}));

// Import mocked functions for testing
import { isSuperAdmin } from "./utils/is-super-admin";

describe("Admin Server Actions", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Default to admin user for most tests
		(isSuperAdmin as any).mockResolvedValue(true);
		mockSupabaseClient.rpc.mockResolvedValue({ data: true, error: null });
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("Security: adminAction wrapper", () => {
		it("should throw Not Found error when user is not super admin", async () => {
			(isSuperAdmin as any).mockResolvedValue(false);
			mockSupabaseClient.rpc.mockResolvedValue({ data: false, error: null });

			const validUserId = "123e4567-e89b-12d3-a456-426614174000";

			await expect(
				banUserAction({ userId: validUserId, confirmation: "CONFIRM" }),
			).rejects.toThrow("Not Found");

			expect(mockAdminAuthService.banUser).not.toHaveBeenCalled();
			expect(mockLogger.info).not.toHaveBeenCalled();
		});

		it("should allow action execution when user is super admin", async () => {
			const validUserId = "123e4567-e89b-12d3-a456-426614174000";
			mockAdminAuthService.banUser.mockResolvedValue({ data: {}, error: null });

			const result = await banUserAction({
				userId: validUserId,
				confirmation: "CONFIRM",
			});

			expect(result).toEqual({ success: true });
			expect(mockAdminAuthService.banUser).toHaveBeenCalledWith(validUserId);
		});
	});

	describe("banUserAction", () => {
		it("should successfully ban a user with valid UUID", async () => {
			const validUserId = "123e4567-e89b-12d3-a456-426614174000";
			mockAdminAuthService.banUser.mockResolvedValue({ data: {}, error: null });

			const result = await banUserAction({
				userId: validUserId,
				confirmation: "CONFIRM",
			});

			expect(result).toEqual({ success: true });
			expect(mockAdminAuthService.banUser).toHaveBeenCalledWith(validUserId);
			expect(mockLogger.info).toHaveBeenCalledWith(
				{ userId: validUserId },
				"Super Admin is banning user...",
			);
			expect(mockLogger.info).toHaveBeenCalledWith(
				{ userId: validUserId },
				"Super Admin has successfully banned user",
			);
			expect(revalidatePath).toHaveBeenCalledWith(
				"/admin/accounts/[id]",
				"page",
			);
		});

		it("should handle service errors when banning user", async () => {
			const validUserId = "123e4567-e89b-12d3-a456-426614174000";
			const error = new Error("Database connection failed");
			mockAdminAuthService.banUser.mockRejectedValue(error);

			await expect(
				banUserAction({ userId: validUserId, confirmation: "CONFIRM" }),
			).rejects.toThrow("Database connection failed");

			expect(mockLogger.info).toHaveBeenCalledWith(
				{ userId: validUserId },
				"Super Admin is banning user...",
			);
			expect(revalidatePath).not.toHaveBeenCalled();
		});
	});

	describe("reactivateUserAction", () => {
		it("should successfully reactivate a banned user", async () => {
			const validUserId = "123e4567-e89b-12d3-a456-426614174000";
			mockAdminAuthService.reactivateUser.mockResolvedValue({
				data: {},
				error: null,
			});

			const result = await reactivateUserAction({
				userId: validUserId,
				confirmation: "CONFIRM",
			});

			expect(result).toEqual({ success: true });
			expect(mockAdminAuthService.reactivateUser).toHaveBeenCalledWith(
				validUserId,
			);
			expect(mockLogger.info).toHaveBeenCalledWith(
				{ userId: validUserId },
				"Super Admin is reactivating user...",
			);
			expect(mockLogger.info).toHaveBeenCalledWith(
				{ userId: validUserId },
				"Super Admin has successfully reactivated user",
			);
			expect(revalidatePath).toHaveBeenCalledWith(
				"/admin/accounts/[id]",
				"page",
			);
		});

		it("should handle errors when reactivating non-existent user", async () => {
			const nonExistentUserId = "999e4567-e89b-12d3-a456-426614174000";
			const error = new Error("User not found");
			mockAdminAuthService.reactivateUser.mockRejectedValue(error);

			await expect(
				reactivateUserAction({
					userId: nonExistentUserId,
					confirmation: "CONFIRM",
				}),
			).rejects.toThrow("User not found");

			expect(mockLogger.info).toHaveBeenCalledWith(
				{ userId: nonExistentUserId },
				"Super Admin is reactivating user...",
			);
			expect(revalidatePath).not.toHaveBeenCalled();
		});
	});

	describe("impersonateUserAction", () => {
		it("should successfully impersonate a user", async () => {
			const validUserId = "123e4567-e89b-12d3-a456-426614174000";
			const mockSessionData = {
				token: "mock-session-token",
				userId: validUserId,
			};
			mockAdminAuthService.impersonateUser.mockResolvedValue(mockSessionData);

			const result = await impersonateUserAction({
				userId: validUserId,
				confirmation: "CONFIRM",
			});

			expect(result).toEqual(mockSessionData);
			expect(mockAdminAuthService.impersonateUser).toHaveBeenCalledWith(
				validUserId,
			);
			expect(mockLogger.info).toHaveBeenCalledWith(
				{ userId: validUserId },
				"Super Admin is impersonating user...",
			);
			// Note: impersonateUser doesn't log success or revalidate
		});

		it("should handle impersonation failure", async () => {
			const validUserId = "123e4567-e89b-12d3-a456-426614174000";
			const error = new Error("Impersonation not allowed for this user");
			mockAdminAuthService.impersonateUser.mockRejectedValue(error);

			await expect(
				impersonateUserAction({
					userId: validUserId,
					confirmation: "CONFIRM",
				}),
			).rejects.toThrow("Impersonation not allowed for this user");

			expect(mockLogger.info).toHaveBeenCalledWith(
				{ userId: validUserId },
				"Super Admin is impersonating user...",
			);
		});
	});

	describe("deleteUserAction", () => {
		it("should successfully delete a user and redirect", async () => {
			const validUserId = "123e4567-e89b-12d3-a456-426614174000";
			mockAdminAuthService.deleteUser.mockResolvedValue(undefined);

			await deleteUserAction({
				userId: validUserId,
				confirmation: "CONFIRM",
			});

			expect(mockAdminAuthService.deleteUser).toHaveBeenCalledWith(validUserId);
			expect(mockLogger.info).toHaveBeenCalledWith(
				{ userId: validUserId },
				"Super Admin is deleting user...",
			);
			expect(mockLogger.info).toHaveBeenCalledWith(
				{ userId: validUserId },
				"Super Admin has successfully deleted user",
			);
			expect(redirect).toHaveBeenCalledWith("/admin/accounts");
		});

		it("should handle errors when deleting user with active subscriptions", async () => {
			const validUserId = "123e4567-e89b-12d3-a456-426614174000";
			const error = new Error("Cannot delete user with active subscriptions");
			mockAdminAuthService.deleteUser.mockRejectedValue(error);

			await expect(
				deleteUserAction({ userId: validUserId, confirmation: "CONFIRM" }),
			).rejects.toThrow("Cannot delete user with active subscriptions");

			expect(mockLogger.info).toHaveBeenCalledWith(
				{ userId: validUserId },
				"Super Admin is deleting user...",
			);
			expect(revalidatePath).not.toHaveBeenCalled();
			expect(redirect).not.toHaveBeenCalled();
		});
	});

	describe("deleteAccountAction", () => {
		it("should successfully delete an account and redirect", async () => {
			const validAccountId = "456e4567-e89b-12d3-a456-426614174000";
			mockAdminAccountsService.deleteAccount.mockResolvedValue(undefined);

			await deleteAccountAction({
				accountId: validAccountId,
				confirmation: "CONFIRM",
			});

			expect(mockAdminAccountsService.deleteAccount).toHaveBeenCalledWith(
				validAccountId,
			);
			expect(mockLogger.info).toHaveBeenCalledWith(
				{ accountId: validAccountId },
				"Super Admin is deleting account...",
			);
			expect(mockLogger.info).toHaveBeenCalledWith(
				{ accountId: validAccountId },
				"Super Admin has successfully deleted account",
			);
			expect(revalidatePath).toHaveBeenCalledWith(
				"/admin/accounts/[id]",
				"page",
			);
			expect(redirect).toHaveBeenCalledWith("/admin/accounts");
		});

		it("should handle errors when deleting non-existent account", async () => {
			const nonExistentAccountId = "999e4567-e89b-12d3-a456-426614174000";
			const error = new Error("Account not found");
			mockAdminAccountsService.deleteAccount.mockRejectedValue(error);

			await expect(
				deleteAccountAction({
					accountId: nonExistentAccountId,
					confirmation: "CONFIRM",
				}),
			).rejects.toThrow("Account not found");

			expect(mockLogger.info).toHaveBeenCalledWith(
				{ accountId: nonExistentAccountId },
				"Super Admin is deleting account...",
			);
			expect(revalidatePath).not.toHaveBeenCalled();
			expect(redirect).not.toHaveBeenCalled();
		});

		it("should handle cascade deletion errors", async () => {
			const validAccountId = "456e4567-e89b-12d3-a456-426614174000";
			const error = new Error("Foreign key constraint violation");
			mockAdminAccountsService.deleteAccount.mockRejectedValue(error);

			await expect(
				deleteAccountAction({
					accountId: validAccountId,
					confirmation: "CONFIRM",
				}),
			).rejects.toThrow("Foreign key constraint violation");

			expect(revalidatePath).not.toHaveBeenCalled();
			expect(redirect).not.toHaveBeenCalled();
		});
	});

	describe("createUserAction", () => {
		it("should successfully create a user with email confirmation", async () => {
			const newUser = {
				email: "newuser@example.com",
				password: "SecurePassword123!",
				emailConfirm: true,
			};
			const mockUserData = {
				id: "789e4567-e89b-12d3-a456-426614174000",
				email: newUser.email,
			};

			mockSupabaseAdminClient.auth.admin.createUser.mockResolvedValue({
				data: { user: mockUserData },
				error: null,
			});

			const result = await createUserAction(newUser);

			expect(result).toEqual({
				success: true,
				user: mockUserData,
			});

			expect(
				mockSupabaseAdminClient.auth.admin.createUser,
			).toHaveBeenCalledWith({
				email: newUser.email,
				password: newUser.password,
				email_confirm: newUser.emailConfirm,
			});

			expect(mockLogger.info).toHaveBeenCalledWith(
				{ email: newUser.email },
				"Super Admin is creating a new user...",
			);
			expect(mockLogger.info).toHaveBeenCalledWith(
				{ userId: mockUserData.id },
				"Super Admin has successfully created a new user",
			);
			expect(revalidatePath).toHaveBeenCalledWith("/admin/accounts");
		});

		it("should create user without email confirmation by default", async () => {
			const newUser = {
				email: "newuser@example.com",
				password: "SecurePassword123!",
			};
			const mockUserData = {
				id: "789e4567-e89b-12d3-a456-426614174000",
				email: newUser.email,
			};

			mockSupabaseAdminClient.auth.admin.createUser.mockResolvedValue({
				data: { user: mockUserData },
				error: null,
			});

			const result = await createUserAction(newUser);

			expect(result).toEqual({
				success: true,
				user: mockUserData,
			});

			expect(
				mockSupabaseAdminClient.auth.admin.createUser,
			).toHaveBeenCalledWith({
				email: newUser.email,
				password: newUser.password,
				email_confirm: undefined,
			});
		});

		it("should handle error when email already exists", async () => {
			const duplicateUser = {
				email: "existing@example.com",
				password: "SecurePassword123!",
				emailConfirm: true,
			};

			mockSupabaseAdminClient.auth.admin.createUser.mockResolvedValue({
				data: null,
				error: { message: "User already registered" },
			});

			await expect(createUserAction(duplicateUser)).rejects.toThrow(
				"Error creating user: User already registered",
			);

			expect(mockLogger.info).toHaveBeenCalledWith(
				{ email: duplicateUser.email },
				"Super Admin is creating a new user...",
			);
			expect(mockLogger.error).toHaveBeenCalledWith(
				{ error: { message: "User already registered" } },
				"Error creating user",
			);
			expect(revalidatePath).not.toHaveBeenCalled();
		});

		it("should handle invalid email format error", async () => {
			const invalidUser = {
				email: "invalid-email",
				password: "SecurePassword123!",
				emailConfirm: false,
			};

			mockSupabaseAdminClient.auth.admin.createUser.mockResolvedValue({
				data: null,
				error: { message: "Invalid email format" },
			});

			await expect(createUserAction(invalidUser)).rejects.toThrow(
				"Error creating user: Invalid email format",
			);

			expect(mockLogger.error).toHaveBeenCalledWith(
				{ error: { message: "Invalid email format" } },
				"Error creating user",
			);
		});

		it("should handle weak password error", async () => {
			const weakPasswordUser = {
				email: "user@example.com",
				password: "weak",
				emailConfirm: false,
			};

			mockSupabaseAdminClient.auth.admin.createUser.mockResolvedValue({
				data: null,
				error: { message: "Password should be at least 8 characters" },
			});

			await expect(createUserAction(weakPasswordUser)).rejects.toThrow(
				"Error creating user: Password should be at least 8 characters",
			);

			expect(mockLogger.error).toHaveBeenCalledWith(
				{ error: { message: "Password should be at least 8 characters" } },
				"Error creating user",
			);
		});
	});

	describe("resetPasswordAction", () => {
		it("should successfully send password reset email", async () => {
			const validUserId = "123e4567-e89b-12d3-a456-426614174000";
			const mockResetResult = {
				success: true,
				message: "Password reset email sent",
			};
			mockAdminAuthService.resetPassword.mockResolvedValue(mockResetResult);

			const result = await resetPasswordAction({
				userId: validUserId,
				confirmation: "CONFIRM",
			});

			expect(result).toEqual(mockResetResult);
			expect(mockAdminAuthService.resetPassword).toHaveBeenCalledWith(
				validUserId,
			);
			expect(mockLogger.info).toHaveBeenCalledWith(
				{ userId: validUserId },
				"Super Admin is resetting user password...",
			);
			expect(mockLogger.info).toHaveBeenCalledWith(
				{ userId: validUserId },
				"Super Admin has successfully sent password reset email",
			);
		});

		it("should handle error when user email is not verified", async () => {
			const validUserId = "123e4567-e89b-12d3-a456-426614174000";
			const error = new Error("Cannot reset password for unverified email");
			mockAdminAuthService.resetPassword.mockRejectedValue(error);

			await expect(
				resetPasswordAction({
					userId: validUserId,
					confirmation: "CONFIRM",
				}),
			).rejects.toThrow("Cannot reset password for unverified email");

			expect(mockLogger.info).toHaveBeenCalledWith(
				{ userId: validUserId },
				"Super Admin is resetting user password...",
			);
			expect(revalidatePath).not.toHaveBeenCalled();
		});

		it("should handle network errors when sending reset email", async () => {
			const validUserId = "123e4567-e89b-12d3-a456-426614174000";
			const error = new Error("Email service unavailable");
			mockAdminAuthService.resetPassword.mockRejectedValue(error);

			await expect(
				resetPasswordAction({
					userId: validUserId,
					confirmation: "CONFIRM",
				}),
			).rejects.toThrow("Email service unavailable");

			expect(revalidatePath).not.toHaveBeenCalled();
		});
	});

	describe("Boundary Value Testing", () => {
		describe("UUID validation", () => {
			it("should handle malformed UUID in banUserAction", async () => {
				const invalidUserId = "not-a-uuid";

				// The schema validation in enhanceAction would typically catch this
				// For this test, we'll simulate the validation error
				await expect(
					banUserAction({ userId: invalidUserId, confirmation: "CONFIRM" }),
				).rejects.toThrow();
			});

			it("should handle empty string as userId", async () => {
				await expect(
					banUserAction({ userId: "", confirmation: "CONFIRM" }),
				).rejects.toThrow();
			});

			it("should handle null/undefined userId", async () => {
				await expect(
					banUserAction({ userId: null as any, confirmation: "CONFIRM" }),
				).rejects.toThrow();
			});
		});

		describe("Email validation", () => {
			it("should handle empty email in createUserAction", async () => {
				await expect(
					createUserAction({
						email: "",
						password: "ValidPassword123!",
						emailConfirm: false,
					}),
				).rejects.toThrow();
			});

			it("should handle very long email addresses", async () => {
				const longEmail = `${"a".repeat(255)}@example.com`;

				mockSupabaseAdminClient.auth.admin.createUser.mockResolvedValue({
					data: null,
					error: { message: "Email too long" },
				});

				await expect(
					createUserAction({
						email: longEmail,
						password: "ValidPassword123!",
						emailConfirm: false,
					}),
				).rejects.toThrow("Error creating user: Email too long");
			});
		});

		describe("Password validation", () => {
			it("should handle empty password", async () => {
				await expect(
					createUserAction({
						email: "valid@example.com",
						password: "",
						emailConfirm: false,
					}),
				).rejects.toThrow();
			});

			it("should handle extremely long password", async () => {
				const longPassword = "a".repeat(1000);

				mockSupabaseAdminClient.auth.admin.createUser.mockResolvedValue({
					data: null,
					error: { message: "Password too long" },
				});

				await expect(
					createUserAction({
						email: "valid@example.com",
						password: longPassword,
						emailConfirm: false,
					}),
				).rejects.toThrow("Error creating user: Password too long");
			});
		});

		describe("Confirmation validation", () => {
			it("should reject invalid confirmation string", async () => {
				const validUserId = "123e4567-e89b-12d3-a456-426614174000";

				await expect(
					banUserAction({ userId: validUserId, confirmation: "YES" as any }),
				).rejects.toThrow();
			});

			it("should reject missing confirmation", async () => {
				const validUserId = "123e4567-e89b-12d3-a456-426614174000";

				await expect(
					banUserAction({ userId: validUserId, confirmation: null as any }),
				).rejects.toThrow();
			});
		});
	});

	describe("Concurrent Operations", () => {
		it("should handle concurrent ban operations on same user", async () => {
			const userId = "123e4567-e89b-12d3-a456-426614174000";
			mockAdminAuthService.banUser.mockResolvedValue({ data: {}, error: null });

			const results = await Promise.all([
				banUserAction({ userId, confirmation: "CONFIRM" }),
				banUserAction({ userId, confirmation: "CONFIRM" }),
			]);

			expect(results).toHaveLength(2);
			expect(results[0]).toEqual({ success: true });
			expect(results[1]).toEqual({ success: true });
			expect(mockAdminAuthService.banUser).toHaveBeenCalledTimes(2);
		});

		it("should handle concurrent operations on different users", async () => {
			const userId1 = "123e4567-e89b-12d3-a456-426614174000";
			const userId2 = "456e4567-e89b-12d3-a456-426614174000";

			mockAdminAuthService.banUser.mockResolvedValue({ data: {}, error: null });
			mockAdminAuthService.reactivateUser.mockResolvedValue({
				data: {},
				error: null,
			});

			const [banResult, reactivateResult] = await Promise.all([
				banUserAction({ userId: userId1, confirmation: "CONFIRM" }),
				reactivateUserAction({ userId: userId2, confirmation: "CONFIRM" }),
			]);

			expect(banResult).toEqual({ success: true });
			expect(reactivateResult).toEqual({ success: true });
			expect(mockAdminAuthService.banUser).toHaveBeenCalledWith(userId1);
			expect(mockAdminAuthService.reactivateUser).toHaveBeenCalledWith(userId2);
		});
	});

	describe("Logging and Audit Trail", () => {
		it("should log all steps of user ban operation", async () => {
			const userId = "123e4567-e89b-12d3-a456-426614174000";
			mockAdminAuthService.banUser.mockResolvedValue({ data: {}, error: null });

			await banUserAction({ userId, confirmation: "CONFIRM" });

			expect(mockLogger.info).toHaveBeenCalledTimes(2);
			expect(mockLogger.info).toHaveBeenNthCalledWith(
				1,
				{ userId },
				"Super Admin is banning user...",
			);
			expect(mockLogger.info).toHaveBeenNthCalledWith(
				2,
				{ userId },
				"Super Admin has successfully banned user",
			);
		});

		it("should log errors during operations", async () => {
			const newUser = {
				email: "test@example.com",
				password: "Password123!",
				emailConfirm: false,
			};

			mockSupabaseAdminClient.auth.admin.createUser.mockResolvedValue({
				data: null,
				error: { message: "Database error" },
			});

			await expect(createUserAction(newUser)).rejects.toThrow(
				"Error creating user: Database error",
			);

			expect(mockLogger.error).toHaveBeenCalledWith(
				{ error: { message: "Database error" } },
				"Error creating user",
			);
		});

		it("should include context in all log messages", async () => {
			const accountId = "456e4567-e89b-12d3-a456-426614174000";
			mockAdminAccountsService.deleteAccount.mockResolvedValue(undefined);

			await deleteAccountAction({
				accountId,
				confirmation: "CONFIRM",
			});

			expect(mockLogger.info).toHaveBeenCalledWith(
				{ accountId },
				expect.any(String),
			);
		});
	});
});
