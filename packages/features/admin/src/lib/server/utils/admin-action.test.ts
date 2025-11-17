/**
 * Unit tests for admin-action.ts
 * Tests the admin access control wrapper for server actions
 */

import { notFound } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { adminAction } from "./admin-action";

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
	notFound: vi.fn(() => {
		throw new Error("NEXT_NOT_FOUND");
	}),
}));

// Mock Supabase server client
const mockSupabaseClient = {
	rpc: vi.fn(),
};

vi.mock("@kit/supabase/server-client", () => ({
	getSupabaseServerClient: vi.fn(() => mockSupabaseClient),
}));

// Mock isSuperAdmin
vi.mock("./is-super-admin", () => ({
	isSuperAdmin: vi.fn(),
}));

import { isSuperAdmin } from "./is-super-admin";

describe("adminAction", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Authorization", () => {
		it("should execute the wrapped function when user is super admin", async () => {
			// Arrange
			vi.mocked(isSuperAdmin).mockResolvedValue(true);
			const mockFn = vi.fn().mockResolvedValue({ success: true });
			const protectedAction = adminAction(mockFn);
			const params = { test: "data" };

			// Act
			const result = await protectedAction(params);

			// Assert
			expect(isSuperAdmin).toHaveBeenCalledWith(mockSupabaseClient);
			expect(mockFn).toHaveBeenCalledWith(params);
			expect(result).toEqual({ success: true });
		});

		it("should call notFound when user is not super admin", async () => {
			// Arrange
			vi.mocked(isSuperAdmin).mockResolvedValue(false);
			const mockFn = vi.fn();
			const protectedAction = adminAction(mockFn);
			const params = { test: "data" };

			// Act & Assert
			await expect(protectedAction(params)).rejects.toThrow("NEXT_NOT_FOUND");
			expect(isSuperAdmin).toHaveBeenCalledWith(mockSupabaseClient);
			expect(mockFn).not.toHaveBeenCalled();
			expect(notFound).toHaveBeenCalled();
		});

		it("should call notFound when isSuperAdmin returns false due to error", async () => {
			// Arrange
			vi.mocked(isSuperAdmin).mockResolvedValue(false);
			const mockFn = vi.fn();
			const protectedAction = adminAction(mockFn);

			// Act & Assert
			await expect(protectedAction({})).rejects.toThrow("NEXT_NOT_FOUND");
			expect(mockFn).not.toHaveBeenCalled();
			expect(notFound).toHaveBeenCalled();
		});
	});

	describe("Function Wrapping", () => {
		it("should preserve the return value of the wrapped function", async () => {
			// Arrange
			vi.mocked(isSuperAdmin).mockResolvedValue(true);
			const expectedResult = { id: 1, name: "test", data: [1, 2, 3] };
			const mockFn = vi.fn().mockResolvedValue(expectedResult);
			const protectedAction = adminAction(mockFn);

			// Act
			const result = await protectedAction({});

			// Assert
			expect(result).toEqual(expectedResult);
		});

		it("should pass through parameters correctly to wrapped function", async () => {
			// Arrange
			vi.mocked(isSuperAdmin).mockResolvedValue(true);
			const complexParams = {
				id: "123",
				nested: { value: 456 },
				array: [1, 2, 3],
				optional: undefined,
			};
			const mockFn = vi.fn().mockResolvedValue("ok");
			const protectedAction = adminAction(mockFn);

			// Act
			await protectedAction(complexParams);

			// Assert
			expect(mockFn).toHaveBeenCalledWith(complexParams);
			expect(mockFn).toHaveBeenCalledTimes(1);
		});

		it("should handle synchronous wrapped functions", async () => {
			// Arrange
			vi.mocked(isSuperAdmin).mockResolvedValue(true);
			const syncFn = vi.fn().mockReturnValue("sync result");
			const protectedAction = adminAction(syncFn);

			// Act
			const result = await protectedAction({ sync: true });

			// Assert
			expect(result).toBe("sync result");
			expect(syncFn).toHaveBeenCalledWith({ sync: true });
		});

		it("should handle async wrapped functions", async () => {
			// Arrange
			vi.mocked(isSuperAdmin).mockResolvedValue(true);
			const asyncFn = vi.fn().mockImplementation(async (params) => {
				await new Promise((resolve) => setTimeout(resolve, 10));
				return { async: true, ...params };
			});
			const protectedAction = adminAction(asyncFn);

			// Act
			const result = await protectedAction({ test: "async" });

			// Assert
			expect(result).toEqual({ async: true, test: "async" });
		});
	});

	describe("Error Handling", () => {
		it("should propagate errors from the wrapped function", async () => {
			// Arrange
			vi.mocked(isSuperAdmin).mockResolvedValue(true);
			const error = new Error("Function error");
			const errorFn = vi.fn().mockRejectedValue(error);
			const protectedAction = adminAction(errorFn);

			// Act & Assert
			await expect(protectedAction({})).rejects.toThrow("Function error");
			expect(errorFn).toHaveBeenCalled();
		});

		it("should handle errors from isSuperAdmin check", async () => {
			// Arrange
			vi.mocked(isSuperAdmin).mockRejectedValue(new Error("Auth check failed"));
			const mockFn = vi.fn();
			const protectedAction = adminAction(mockFn);

			// Act & Assert
			await expect(protectedAction({})).rejects.toThrow("Auth check failed");
			expect(mockFn).not.toHaveBeenCalled();
		});

		it("should handle thrown errors from synchronous wrapped functions", async () => {
			// Arrange
			vi.mocked(isSuperAdmin).mockResolvedValue(true);
			const throwingFn = vi.fn().mockImplementation(() => {
				throw new Error("Sync error");
			});
			const protectedAction = adminAction(throwingFn);

			// Act & Assert
			await expect(protectedAction({})).rejects.toThrow("Sync error");
		});
	});

	describe("Type Safety", () => {
		it("should maintain type safety for wrapped function parameters", async () => {
			// Arrange
			vi.mocked(isSuperAdmin).mockResolvedValue(true);

			interface TestParams {
				id: string;
				name: string;
				age?: number;
			}

			interface TestResponse {
				success: boolean;
				data: TestParams;
			}

			const typedFn = vi
				.fn<(params: TestParams) => Promise<TestResponse>>()
				.mockResolvedValue({
					success: true,
					data: { id: "1", name: "test", age: 25 },
				});

			const protectedAction = adminAction(typedFn);

			// Act
			const result = await protectedAction({ id: "1", name: "test" });

			// Assert
			expect(result.success).toBe(true);
			expect(result.data.id).toBe("1");
		});
	});

	describe("Edge Cases", () => {
		it("should handle null parameters", async () => {
			// Arrange
			vi.mocked(isSuperAdmin).mockResolvedValue(true);
			const mockFn = vi.fn().mockResolvedValue("handled null");
			const protectedAction = adminAction(mockFn);

			// Act
			const result = await protectedAction(null as any);

			// Assert
			expect(mockFn).toHaveBeenCalledWith(null);
			expect(result).toBe("handled null");
		});

		it("should handle undefined parameters", async () => {
			// Arrange
			vi.mocked(isSuperAdmin).mockResolvedValue(true);
			const mockFn = vi.fn().mockResolvedValue("handled undefined");
			const protectedAction = adminAction(mockFn);

			// Act
			const result = await protectedAction(undefined as any);

			// Assert
			expect(mockFn).toHaveBeenCalledWith(undefined);
			expect(result).toBe("handled undefined");
		});

		it("should handle empty object parameters", async () => {
			// Arrange
			vi.mocked(isSuperAdmin).mockResolvedValue(true);
			const mockFn = vi.fn().mockResolvedValue("handled empty");
			const protectedAction = adminAction(mockFn);

			// Act
			const result = await protectedAction({});

			// Assert
			expect(mockFn).toHaveBeenCalledWith({});
			expect(result).toBe("handled empty");
		});

		it("should handle functions that return undefined", async () => {
			// Arrange
			vi.mocked(isSuperAdmin).mockResolvedValue(true);
			const voidFn = vi.fn().mockResolvedValue(undefined);
			const protectedAction = adminAction(voidFn);

			// Act
			const result = await protectedAction({});

			// Assert
			expect(result).toBeUndefined();
			expect(voidFn).toHaveBeenCalled();
		});

		it("should handle functions that return null", async () => {
			// Arrange
			vi.mocked(isSuperAdmin).mockResolvedValue(true);
			const nullFn = vi.fn().mockResolvedValue(null);
			const protectedAction = adminAction(nullFn);

			// Act
			const result = await protectedAction({});

			// Assert
			expect(result).toBeNull();
			expect(nullFn).toHaveBeenCalled();
		});
	});

	describe("Multiple Invocations", () => {
		it("should check authorization on every invocation", async () => {
			// Arrange
			vi.mocked(isSuperAdmin).mockResolvedValue(true);
			const mockFn = vi.fn().mockResolvedValue("success");
			const protectedAction = adminAction(mockFn);

			// Act
			await protectedAction({ call: 1 });
			await protectedAction({ call: 2 });
			await protectedAction({ call: 3 });

			// Assert
			expect(isSuperAdmin).toHaveBeenCalledTimes(3);
			expect(mockFn).toHaveBeenCalledTimes(3);
			expect(mockFn).toHaveBeenNthCalledWith(1, { call: 1 });
			expect(mockFn).toHaveBeenNthCalledWith(2, { call: 2 });
			expect(mockFn).toHaveBeenNthCalledWith(3, { call: 3 });
		});

		it("should handle changing authorization status between invocations", async () => {
			// Arrange
			vi.mocked(isSuperAdmin)
				.mockResolvedValueOnce(true)
				.mockResolvedValueOnce(false)
				.mockResolvedValueOnce(true);

			const mockFn = vi.fn().mockResolvedValue("success");
			const protectedAction = adminAction(mockFn);

			// Act & Assert
			// First call - authorized
			const result1 = await protectedAction({ call: 1 });
			expect(result1).toBe("success");
			expect(mockFn).toHaveBeenCalledTimes(1);

			// Second call - not authorized
			await expect(protectedAction({ call: 2 })).rejects.toThrow(
				"NEXT_NOT_FOUND",
			);
			expect(mockFn).toHaveBeenCalledTimes(1); // Still 1, not called again

			// Third call - authorized again
			const result3 = await protectedAction({ call: 3 });
			expect(result3).toBe("success");
			expect(mockFn).toHaveBeenCalledTimes(2);
		});
	});

	describe("Performance", () => {
		it("should not call wrapped function if authorization fails", async () => {
			// Arrange
			vi.mocked(isSuperAdmin).mockResolvedValue(false);
			const expensiveFn = vi.fn().mockImplementation(async () => {
				// Simulate expensive operation
				await new Promise((resolve) => setTimeout(resolve, 1000));
				return "expensive result";
			});
			const protectedAction = adminAction(expensiveFn);

			// Act & Assert
			await expect(protectedAction({})).rejects.toThrow("NEXT_NOT_FOUND");
			expect(expensiveFn).not.toHaveBeenCalled();
		});
	});
});
