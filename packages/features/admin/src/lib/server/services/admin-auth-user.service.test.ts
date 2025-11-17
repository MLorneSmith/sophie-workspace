/**
 * Unit tests for AdminAuthUserService
 * Tests the admin user management functionality
 */

import type { Database } from "@kit/supabase/database";
import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAdminAuthUserService } from "./admin-auth-user.service";

// Mock fetch globally
global.fetch = vi.fn();

// Mock process.env
vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");

// Helper to create mock auth admin API
function createMockAuthAdmin(config?: {
	getUserById?: { user?: any; error?: any };
	deleteUser?: { error?: any };
	updateUserById?: { error?: any };
	generateLink?: { data?: any; error?: any };
}) {
	return {
		getUserById: vi.fn().mockResolvedValue({
			data: {
				user: config?.getUserById?.user ?? {
					id: "user_123",
					email: "user@example.com",
				},
			},
			error: config?.getUserById?.error ?? null,
		}),
		deleteUser: vi.fn().mockResolvedValue({
			data: null,
			error: config?.deleteUser?.error ?? null,
		}),
		updateUserById: vi.fn().mockResolvedValue({
			data: null,
			error: config?.updateUserById?.error ?? null,
		}),
		generateLink: vi.fn().mockResolvedValue({
			data: config?.generateLink?.data ?? {
				properties: {
					action_link: "https://example.com/auth/v1/verify",
				},
			},
			error: config?.generateLink?.error ?? null,
		}),
	};
}

// Helper to create mock auth API
function createMockAuth(config?: {
	getUser?: { user?: any; error?: any };
	resetPasswordForEmail?: { error?: any };
}) {
	return {
		getUser: vi.fn().mockResolvedValue({
			data: { user: config?.getUser?.user ?? { id: "current_user_123" } },
			error: config?.getUser?.error ?? null,
		}),
		resetPasswordForEmail: vi.fn().mockResolvedValue({
			data: null,
			error: config?.resetPasswordForEmail?.error ?? null,
		}),
		admin: createMockAuthAdmin(),
	};
}

// Helper to create mock Supabase clients
function createMockClients(config?: {
	client?: {
		getUser?: { user?: any; error?: any };
	};
	adminClient?: {
		getUserById?: { user?: any; error?: any };
		deleteUser?: { error?: any };
		updateUserById?: { error?: any };
		generateLink?: { data?: any; error?: any };
		resetPasswordForEmail?: { error?: any };
	};
}) {
	const clientAuth = createMockAuth(config?.client);
	const adminAuth = createMockAuth(config?.adminClient);

	if (config?.adminClient) {
		adminAuth.admin = createMockAuthAdmin(config.adminClient);
	}

	const client = {
		auth: clientAuth,
	} as unknown as SupabaseClient<Database>;

	const adminClient = {
		auth: adminAuth,
	} as unknown as SupabaseClient<Database>;

	return { client, adminClient };
}

describe("AdminAuthUserService", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(global.fetch).mockReset();
	});

	describe("Factory Function", () => {
		it("should create an instance of AdminAuthUserService", () => {
			const { client, adminClient } = createMockClients();
			const service = createAdminAuthUserService(client, adminClient);

			expect(service).toBeDefined();
			expect(service).toHaveProperty("deleteUser");
			expect(service).toHaveProperty("banUser");
			expect(service).toHaveProperty("reactivateUser");
			expect(service).toHaveProperty("impersonateUser");
			expect(service).toHaveProperty("resetPassword");
		});
	});

	describe("deleteUser", () => {
		it("should delete a user successfully", async () => {
			const { client, adminClient } = createMockClients();
			const service = createAdminAuthUserService(client, adminClient);

			await service.deleteUser("user_to_delete");

			expect(adminClient.auth.admin.deleteUser).toHaveBeenCalledWith(
				"user_to_delete",
			);
		});

		it("should throw error if trying to delete current user", async () => {
			const { client, adminClient } = createMockClients({
				client: { getUser: { user: { id: "same_user" } } },
			});
			const service = createAdminAuthUserService(client, adminClient);

			await expect(service.deleteUser("same_user")).rejects.toThrow(
				"You cannot perform a destructive action on your own account as a Super Admin",
			);
		});

		it("should throw error if trying to delete super admin", async () => {
			const { client, adminClient } = createMockClients({
				adminClient: {
					getUserById: {
						user: { id: "super_admin", app_metadata: { role: "super-admin" } },
					},
				},
			});
			const service = createAdminAuthUserService(client, adminClient);

			await expect(service.deleteUser("super_admin")).rejects.toThrow(
				"You cannot perform a destructive action on a Super Admin account",
			);
		});

		it("should throw error if deletion fails", async () => {
			const { client, adminClient } = createMockClients({
				adminClient: {
					deleteUser: { error: new Error("Deletion failed") },
				},
			});
			const service = createAdminAuthUserService(client, adminClient);

			await expect(service.deleteUser("user_123")).rejects.toThrow(
				"Error deleting user record or auth record",
			);
		});
	});

	describe("banUser", () => {
		it("should ban a user successfully", async () => {
			const { client, adminClient } = createMockClients();
			const service = createAdminAuthUserService(client, adminClient);

			await service.banUser("user_to_ban");

			expect(adminClient.auth.admin.updateUserById).toHaveBeenCalledWith(
				"user_to_ban",
				{ ban_duration: "876600h" },
			);
		});

		it("should throw error if trying to ban current user", async () => {
			const { client, adminClient } = createMockClients({
				client: { getUser: { user: { id: "same_user" } } },
			});
			const service = createAdminAuthUserService(client, adminClient);

			await expect(service.banUser("same_user")).rejects.toThrow(
				"You cannot perform a destructive action on your own account as a Super Admin",
			);
		});

		it("should throw error if trying to ban super admin", async () => {
			const { client, adminClient } = createMockClients({
				adminClient: {
					getUserById: {
						user: { id: "super_admin", app_metadata: { role: "super-admin" } },
					},
				},
			});
			const service = createAdminAuthUserService(client, adminClient);

			await expect(service.banUser("super_admin")).rejects.toThrow(
				"You cannot perform a destructive action on a Super Admin account",
			);
		});
	});

	describe("reactivateUser", () => {
		it("should reactivate a user successfully", async () => {
			const { client, adminClient } = createMockClients();
			const service = createAdminAuthUserService(client, adminClient);

			await service.reactivateUser("user_to_reactivate");

			expect(adminClient.auth.admin.updateUserById).toHaveBeenCalledWith(
				"user_to_reactivate",
				{ ban_duration: "none" },
			);
		});

		it("should throw error if trying to reactivate current user", async () => {
			const { client, adminClient } = createMockClients({
				client: { getUser: { user: { id: "same_user" } } },
			});
			const service = createAdminAuthUserService(client, adminClient);

			await expect(service.reactivateUser("same_user")).rejects.toThrow(
				"You cannot perform a destructive action on your own account as a Super Admin",
			);
		});
	});

	describe("impersonateUser", () => {
		it("should impersonate a user successfully", async () => {
			const { client, adminClient } = createMockClients({
				adminClient: {
					getUserById: { user: { id: "user_123", email: "user@example.com" } },
					generateLink: {
						data: {
							properties: {
								action_link: "https://example.com/auth/v1/verify",
							},
						},
					},
				},
			});

			// Mock fetch response
			vi.mocked(global.fetch).mockResolvedValue({
				headers: new Headers({
					Location:
						"https://example.com/#access_token=token123&refresh_token=refresh123",
				}),
			} as Response);

			const service = createAdminAuthUserService(client, adminClient);

			const result = await service.impersonateUser("user_123");

			expect(result).toEqual({
				accessToken: "token123",
				refreshToken: "refresh123",
			});

			expect(adminClient.auth.admin.generateLink).toHaveBeenCalledWith({
				type: "magiclink",
				email: "user@example.com",
				options: { redirectTo: "/" },
			});
		});

		it("should throw error if user has no email", async () => {
			const { client, adminClient } = createMockClients({
				adminClient: {
					getUserById: { user: { id: "user_123", email: null } },
				},
			});
			const service = createAdminAuthUserService(client, adminClient);

			await expect(service.impersonateUser("user_123")).rejects.toThrow(
				"User has no email. Cannot impersonate",
			);
		});

		it("should throw error if getUserById fails", async () => {
			const { client, adminClient } = createMockClients({
				adminClient: {
					getUserById: { error: new Error("User not found") },
				},
			});
			const service = createAdminAuthUserService(client, adminClient);

			await expect(service.impersonateUser("user_123")).rejects.toThrow(
				"Error fetching user",
			);
		});

		it("should throw error if generateLink fails", async () => {
			const { client, adminClient } = createMockClients({
				adminClient: {
					generateLink: { error: new Error("Link generation failed") },
				},
			});
			const service = createAdminAuthUserService(client, adminClient);

			await expect(service.impersonateUser("user_123")).rejects.toThrow(
				"Error generating magic link",
			);
		});

		it("should throw error if location header not found", async () => {
			const { client, adminClient } = createMockClients();

			// Mock fetch response without Location header
			vi.mocked(global.fetch).mockResolvedValue({
				headers: new Headers({}),
			} as Response);

			const service = createAdminAuthUserService(client, adminClient);

			await expect(service.impersonateUser("user_123")).rejects.toThrow(
				"Error generating magic link. Location header not found",
			);
		});

		it("should throw error if tokens not found in URL", async () => {
			const { client, adminClient } = createMockClients();

			// Mock fetch response with incomplete URL
			vi.mocked(global.fetch).mockResolvedValue({
				headers: new Headers({
					Location: "https://example.com/#access_token=token123",
				}),
			} as Response);

			const service = createAdminAuthUserService(client, adminClient);

			await expect(service.impersonateUser("user_123")).rejects.toThrow(
				"Error generating magic link. Tokens not found in URL hash",
			);
		});

		it("should throw error if trying to impersonate current user", async () => {
			const { client, adminClient } = createMockClients({
				client: { getUser: { user: { id: "same_user" } } },
			});
			const service = createAdminAuthUserService(client, adminClient);

			await expect(service.impersonateUser("same_user")).rejects.toThrow(
				"You cannot perform a destructive action on your own account as a Super Admin",
			);
		});
	});

	describe("resetPassword", () => {
		it("should reset password successfully", async () => {
			const { client, adminClient } = createMockClients({
				adminClient: {
					getUserById: { user: { id: "user_123", email: "user@example.com" } },
				},
			});
			const service = createAdminAuthUserService(client, adminClient);

			const result = await service.resetPassword("user_123");

			expect(result).toEqual({ success: true });
			expect(adminClient.auth.resetPasswordForEmail).toHaveBeenCalledWith(
				"user@example.com",
				{ redirectTo: "https://example.com/update-password" },
			);
		});

		it("should throw error if user has no email", async () => {
			const { client, adminClient } = createMockClients({
				adminClient: {
					getUserById: { user: { id: "user_123", email: null } },
				},
			});
			const service = createAdminAuthUserService(client, adminClient);

			await expect(service.resetPassword("user_123")).rejects.toThrow(
				"User has no email. Cannot reset password",
			);
		});

		it("should throw error if getUserById fails", async () => {
			const { client, adminClient } = createMockClients({
				adminClient: {
					getUserById: { error: new Error("User not found") },
				},
			});
			const service = createAdminAuthUserService(client, adminClient);

			await expect(service.resetPassword("user_123")).rejects.toThrow(
				"Error fetching user",
			);
		});

		it("should throw error if reset email fails", async () => {
			const { client, adminClient } = createMockClients({
				adminClient: {
					resetPasswordForEmail: { error: { message: "Email service down" } },
				},
			});
			const service = createAdminAuthUserService(client, adminClient);

			await expect(service.resetPassword("user_123")).rejects.toThrow(
				"Error sending password reset email: Email service down",
			);
		});

		it("should throw error if trying to reset password for current user", async () => {
			const { client, adminClient } = createMockClients({
				client: { getUser: { user: { id: "same_user" } } },
			});
			const service = createAdminAuthUserService(client, adminClient);

			await expect(service.resetPassword("same_user")).rejects.toThrow(
				"You cannot perform a destructive action on your own account as a Super Admin",
			);
		});

		it("should throw error if environment variable is invalid", async () => {
			// Temporarily override the env variable with an invalid URL
			vi.stubEnv("NEXT_PUBLIC_SITE_URL", "not-a-url");

			const { client, adminClient } = createMockClients();
			const service = createAdminAuthUserService(client, adminClient);

			await expect(service.resetPassword("user_123")).rejects.toThrow();

			// Restore valid URL
			vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");
		});
	});

	describe("Edge Cases", () => {
		it("should handle missing current user ID", async () => {
			const { client, adminClient } = createMockClients({
				client: { getUser: { user: null } },
			});
			const service = createAdminAuthUserService(client, adminClient);

			// This should actually succeed as deleteUser doesn't check if user is null
			// It only checks if currentUserId is null
			await expect(service.deleteUser("user_123")).resolves.toBeUndefined();
		});

		it("should handle getUser returning user without id", async () => {
			const { client, adminClient } = createMockClients({
				client: { getUser: { user: { email: "test@example.com" } } }, // user without id
			});
			const service = createAdminAuthUserService(client, adminClient);

			await expect(service.deleteUser("user_123")).rejects.toThrow(
				"Error fetching user",
			);
		});

		it("should handle user with undefined app_metadata", async () => {
			const { client, adminClient } = createMockClients({
				adminClient: {
					getUserById: { user: { id: "user_123", app_metadata: undefined } },
				},
			});
			const service = createAdminAuthUserService(client, adminClient);

			// Should not throw as user is not super-admin
			await expect(service.deleteUser("user_123")).resolves.toBeUndefined();
		});
	});
});
