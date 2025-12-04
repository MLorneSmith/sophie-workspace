/**
 * Unit tests for last-auth-method utilities
 * Tests localStorage-based auth method persistence
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	_clearLastAuthMethod,
	_getLastAuthMethod,
	type AuthMethod,
	type LastAuthMethod,
	saveLastAuthMethod,
} from "./last-auth-method";

// Mock localStorage
const localStorageMock = (() => {
	let store: Record<string, string> = {};
	return {
		getItem: vi.fn((key: string) => store[key] || null),
		setItem: vi.fn((key: string, value: string) => {
			store[key] = value;
		}),
		removeItem: vi.fn((key: string) => {
			delete store[key];
		}),
		clear: () => {
			store = {};
		},
	};
})();

// Mock @kit/shared/utils
vi.mock("@kit/shared/utils", () => ({
	isBrowser: vi.fn(() => true),
}));

describe("last-auth-method utilities", () => {
	beforeEach(() => {
		// Clear mocks and localStorage before each test
		vi.clearAllMocks();
		localStorageMock.clear();

		// Set up global localStorage mock
		Object.defineProperty(global, "localStorage", {
			value: localStorageMock,
			writable: true,
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("saveLastAuthMethod", () => {
		it("should save password auth method to localStorage", () => {
			const authMethod: LastAuthMethod = {
				method: "password",
				email: "user@example.com",
				timestamp: Date.now(),
			};

			saveLastAuthMethod(authMethod);

			expect(localStorageMock.setItem).toHaveBeenCalledWith(
				"auth_last_method",
				JSON.stringify(authMethod),
			);
		});

		it("should save OTP auth method to localStorage", () => {
			const authMethod: LastAuthMethod = {
				method: "otp",
				email: "user@example.com",
				timestamp: Date.now(),
			};

			saveLastAuthMethod(authMethod);

			expect(localStorageMock.setItem).toHaveBeenCalledWith(
				"auth_last_method",
				JSON.stringify(authMethod),
			);
		});

		it("should save magic_link auth method to localStorage", () => {
			const authMethod: LastAuthMethod = {
				method: "magic_link",
				email: "user@example.com",
				timestamp: Date.now(),
			};

			saveLastAuthMethod(authMethod);

			expect(localStorageMock.setItem).toHaveBeenCalledWith(
				"auth_last_method",
				JSON.stringify(authMethod),
			);
		});

		it("should save OAuth auth method with provider to localStorage", () => {
			const authMethod: LastAuthMethod = {
				method: "oauth",
				provider: "google",
				email: "user@example.com",
				timestamp: Date.now(),
			};

			saveLastAuthMethod(authMethod);

			expect(localStorageMock.setItem).toHaveBeenCalledWith(
				"auth_last_method",
				JSON.stringify(authMethod),
			);
		});

		it("should save auth method without email", () => {
			const authMethod: LastAuthMethod = {
				method: "oauth",
				provider: "github",
				timestamp: Date.now(),
			};

			saveLastAuthMethod(authMethod);

			expect(localStorageMock.setItem).toHaveBeenCalledWith(
				"auth_last_method",
				JSON.stringify(authMethod),
			);
		});

		it("should handle localStorage errors gracefully", () => {
			localStorageMock.setItem.mockImplementationOnce(() => {
				throw new Error("QuotaExceededError");
			});

			const authMethod: LastAuthMethod = {
				method: "password",
				timestamp: Date.now(),
			};

			// Should not throw
			expect(() => saveLastAuthMethod(authMethod)).not.toThrow();
		});
	});

	describe("_getLastAuthMethod", () => {
		it("should return null when localStorage is empty", () => {
			const result = _getLastAuthMethod();

			expect(result).toBeNull();
		});

		it("should return stored auth method when valid", () => {
			const authMethod: LastAuthMethod = {
				method: "password",
				email: "user@example.com",
				timestamp: Date.now(),
			};
			localStorageMock.setItem("auth_last_method", JSON.stringify(authMethod));
			localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(authMethod));

			const result = _getLastAuthMethod();

			expect(result).toEqual(authMethod);
		});

		it("should return null and clear expired auth method (older than 30 days)", () => {
			const thirtyOneDaysAgo = Date.now() - 31 * 24 * 60 * 60 * 1000;
			const authMethod: LastAuthMethod = {
				method: "password",
				email: "user@example.com",
				timestamp: thirtyOneDaysAgo,
			};
			localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(authMethod));

			const result = _getLastAuthMethod();

			expect(result).toBeNull();
			expect(localStorageMock.removeItem).toHaveBeenCalledWith(
				"auth_last_method",
			);
		});

		it("should keep auth method that is exactly 30 days old", () => {
			const exactlyThirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000 + 1000; // Just under 30 days
			const authMethod: LastAuthMethod = {
				method: "password",
				email: "user@example.com",
				timestamp: exactlyThirtyDaysAgo,
			};
			localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(authMethod));

			const result = _getLastAuthMethod();

			expect(result).toEqual(authMethod);
			expect(localStorageMock.removeItem).not.toHaveBeenCalled();
		});

		it("should return null when not in browser environment", async () => {
			const { isBrowser } = await import("@kit/shared/utils");
			vi.mocked(isBrowser).mockReturnValueOnce(false);

			const result = _getLastAuthMethod();

			expect(result).toBeNull();
			expect(localStorageMock.getItem).not.toHaveBeenCalled();
		});

		it("should handle invalid JSON gracefully", () => {
			localStorageMock.getItem.mockReturnValueOnce("not valid json");

			const result = _getLastAuthMethod();

			expect(result).toBeNull();
		});

		it("should handle localStorage errors gracefully", () => {
			localStorageMock.getItem.mockImplementationOnce(() => {
				throw new Error("SecurityError");
			});

			const result = _getLastAuthMethod();

			expect(result).toBeNull();
		});

		it("should return OAuth method with provider", () => {
			const authMethod: LastAuthMethod = {
				method: "oauth",
				provider: "google",
				email: "user@google.com",
				timestamp: Date.now(),
			};
			localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(authMethod));

			const result = _getLastAuthMethod();

			expect(result).toEqual(authMethod);
			expect(result?.provider).toBe("google");
		});
	});

	describe("_clearLastAuthMethod", () => {
		it("should remove auth method from localStorage", () => {
			_clearLastAuthMethod();

			expect(localStorageMock.removeItem).toHaveBeenCalledWith(
				"auth_last_method",
			);
		});

		it("should handle localStorage errors gracefully", () => {
			localStorageMock.removeItem.mockImplementationOnce(() => {
				throw new Error("SecurityError");
			});

			// Should not throw
			expect(() => _clearLastAuthMethod()).not.toThrow();
		});
	});

	describe("AuthMethod type", () => {
		it("should support all valid auth method types", () => {
			const methods: AuthMethod[] = ["password", "otp", "magic_link", "oauth"];

			for (const method of methods) {
				const authMethod: LastAuthMethod = {
					method,
					timestamp: Date.now(),
				};
				expect(authMethod.method).toBe(method);
			}
		});
	});

	describe("Integration scenarios", () => {
		it("should handle save then retrieve flow", () => {
			const authMethod: LastAuthMethod = {
				method: "password",
				email: "user@example.com",
				timestamp: Date.now(),
			};

			saveLastAuthMethod(authMethod);
			localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(authMethod));

			const result = _getLastAuthMethod();

			expect(result).toEqual(authMethod);
		});

		it("should handle save then clear flow", () => {
			const authMethod: LastAuthMethod = {
				method: "password",
				email: "user@example.com",
				timestamp: Date.now(),
			};

			saveLastAuthMethod(authMethod);
			_clearLastAuthMethod();

			expect(localStorageMock.removeItem).toHaveBeenCalledWith(
				"auth_last_method",
			);
		});

		it("should overwrite previous auth method on save", () => {
			const firstMethod: LastAuthMethod = {
				method: "password",
				email: "first@example.com",
				timestamp: Date.now() - 1000,
			};
			const secondMethod: LastAuthMethod = {
				method: "oauth",
				provider: "github",
				email: "second@example.com",
				timestamp: Date.now(),
			};

			saveLastAuthMethod(firstMethod);
			saveLastAuthMethod(secondMethod);

			expect(localStorageMock.setItem).toHaveBeenLastCalledWith(
				"auth_last_method",
				JSON.stringify(secondMethod),
			);
		});
	});
});
