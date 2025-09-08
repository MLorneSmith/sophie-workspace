/**
 * Unit tests for is-super-admin.ts
 * Tests the super admin authorization check utility
 */

import type { Database } from "@kit/supabase/database";
import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { isSuperAdmin } from "./is-super-admin";

// Create a mock Supabase client with proper typing
function createMockSupabaseClient(rpcResponse?: {
	data?: boolean;
	error?: Error | null;
}): SupabaseClient<Database> {
	return {
		rpc: vi.fn().mockImplementation(() => {
			if (rpcResponse?.error) {
				return Promise.resolve({ data: null, error: rpcResponse.error });
			}
			return Promise.resolve({
				data: rpcResponse?.data ?? false,
				error: null,
			});
		}),
		// Add other required Supabase client methods as empty mocks
		auth: {} as any,
		from: vi.fn() as any,
		storage: {} as any,
		realtime: {} as any,
		channel: vi.fn() as any,
		removeChannel: vi.fn() as any,
		removeAllChannels: vi.fn() as any,
		getChannels: vi.fn() as any,
	} as unknown as SupabaseClient<Database>;
}

describe("isSuperAdmin", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Core Functionality", () => {
		it("should return true when user is a super admin", async () => {
			// Arrange
			const mockClient = createMockSupabaseClient({ data: true });

			// Act
			const result = await isSuperAdmin(mockClient);

			// Assert
			expect(result).toBe(true);
			expect(mockClient.rpc).toHaveBeenCalledWith("is_super_admin");
			expect(mockClient.rpc).toHaveBeenCalledTimes(1);
		});

		it("should return false when user is not a super admin", async () => {
			// Arrange
			const mockClient = createMockSupabaseClient({ data: false });

			// Act
			const result = await isSuperAdmin(mockClient);

			// Assert
			expect(result).toBe(false);
			expect(mockClient.rpc).toHaveBeenCalledWith("is_super_admin");
			expect(mockClient.rpc).toHaveBeenCalledTimes(1);
		});
	});

	describe("Error Scenarios", () => {
		it("should return false when RPC call throws an error", async () => {
			// Arrange
			const mockClient = createMockSupabaseClient({
				error: new Error("Database connection failed"),
			});

			// Act
			const result = await isSuperAdmin(mockClient);

			// Assert
			expect(result).toBe(false);
			expect(mockClient.rpc).toHaveBeenCalledWith("is_super_admin");
		});

		it("should return false when RPC call rejects", async () => {
			// Arrange
			const mockClient = {
				rpc: vi.fn().mockRejectedValue(new Error("Network error")),
			} as unknown as SupabaseClient<Database>;

			// Act
			const result = await isSuperAdmin(mockClient);

			// Assert
			expect(result).toBe(false);
			expect(mockClient.rpc).toHaveBeenCalledWith("is_super_admin");
		});

		it("should return false when Supabase returns an error object", async () => {
			// Arrange
			const mockClient = createMockSupabaseClient({
				error: new Error("Insufficient permissions"),
			});

			// Act
			const result = await isSuperAdmin(mockClient);

			// Assert
			expect(result).toBe(false);
			expect(mockClient.rpc).toHaveBeenCalledWith("is_super_admin");
		});
	});

	describe("Edge Cases", () => {
		it("should return false for null data response", async () => {
			// Arrange
			const mockClient = {
				rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
			} as unknown as SupabaseClient<Database>;

			// Act
			const result = await isSuperAdmin(mockClient);

			// Assert
			expect(result).toBe(false);
			expect(mockClient.rpc).toHaveBeenCalledWith("is_super_admin");
		});

		it("should return false for undefined data response", async () => {
			// Arrange
			const mockClient = {
				rpc: vi.fn().mockResolvedValue({ data: undefined, error: null }),
			} as unknown as SupabaseClient<Database>;

			// Act
			const result = await isSuperAdmin(mockClient);

			// Assert
			expect(result).toBe(false);
			expect(mockClient.rpc).toHaveBeenCalledWith("is_super_admin");
		});

		it("should handle RPC throwing non-Error objects", async () => {
			// Arrange
			const mockClient = {
				rpc: vi.fn().mockRejectedValue("String error"),
			} as unknown as SupabaseClient<Database>;

			// Act
			const result = await isSuperAdmin(mockClient);

			// Assert
			expect(result).toBe(false);
			expect(mockClient.rpc).toHaveBeenCalledWith("is_super_admin");
		});

		it("should handle RPC throwing null", async () => {
			// Arrange
			const mockClient = {
				rpc: vi.fn().mockRejectedValue(null),
			} as unknown as SupabaseClient<Database>;

			// Act
			const result = await isSuperAdmin(mockClient);

			// Assert
			expect(result).toBe(false);
			expect(mockClient.rpc).toHaveBeenCalledWith("is_super_admin");
		});

		it("should handle RPC throwing undefined", async () => {
			// Arrange
			const mockClient = {
				rpc: vi.fn().mockRejectedValue(undefined),
			} as unknown as SupabaseClient<Database>;

			// Act
			const result = await isSuperAdmin(mockClient);

			// Assert
			expect(result).toBe(false);
			expect(mockClient.rpc).toHaveBeenCalledWith("is_super_admin");
		});
	});

	describe("Client Validation", () => {
		it("should handle client with undefined rpc method", async () => {
			// Arrange
			const mockClient = {
				rpc: undefined,
			} as unknown as SupabaseClient<Database>;

			// Act & Assert
			await expect(isSuperAdmin(mockClient)).resolves.toBe(false);
		});

		it("should handle client with null rpc method", async () => {
			// Arrange
			const mockClient = {
				rpc: null,
			} as unknown as SupabaseClient<Database>;

			// Act & Assert
			await expect(isSuperAdmin(mockClient)).resolves.toBe(false);
		});

		it("should handle client that is not a function", async () => {
			// Arrange
			const mockClient = {
				rpc: "not a function",
			} as unknown as SupabaseClient<Database>;

			// Act & Assert
			await expect(isSuperAdmin(mockClient)).resolves.toBe(false);
		});
	});

	describe("Performance", () => {
		it("should only call RPC once per invocation", async () => {
			// Arrange
			const mockClient = createMockSupabaseClient({ data: true });

			// Act
			await isSuperAdmin(mockClient);
			await isSuperAdmin(mockClient);

			// Assert
			expect(mockClient.rpc).toHaveBeenCalledTimes(2);
			expect(mockClient.rpc).toHaveBeenNthCalledWith(1, "is_super_admin");
			expect(mockClient.rpc).toHaveBeenNthCalledWith(2, "is_super_admin");
		});

		it("should not modify the client object", async () => {
			// Arrange
			const mockClient = createMockSupabaseClient({ data: true });
			const originalRpc = mockClient.rpc;

			// Act
			await isSuperAdmin(mockClient);

			// Assert
			expect(mockClient.rpc).toBe(originalRpc);
		});
	});

	describe("Type Safety", () => {
		it("should accept a properly typed Supabase client", async () => {
			// Arrange
			const mockClient: SupabaseClient<Database> = createMockSupabaseClient({
				data: true,
			});

			// Act
			const result = await isSuperAdmin(mockClient);

			// Assert
			expect(result).toBe(true);
		});

		it("should return a boolean type", async () => {
			// Arrange
			const mockClient = createMockSupabaseClient({ data: true });

			// Act
			const result = await isSuperAdmin(mockClient);

			// Assert
			expect(typeof result).toBe("boolean");
		});
	});
});
