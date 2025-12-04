/**
 * Unit tests for requireUser
 * Tests user authentication requirement and MFA verification
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the check-requires-mfa module
vi.mock("./check-requires-mfa", () => ({
	checkRequiresMultiFactorAuthentication: vi.fn(),
}));

import { checkRequiresMultiFactorAuthentication } from "./check-requires-mfa";
import { MultiFactorAuthError, requireUser } from "./require-user";

// Type the mock
const mockCheckRequiresMFA =
	checkRequiresMultiFactorAuthentication as ReturnType<typeof vi.fn>;

// Helper to create mock Supabase client
function createMockClient(options: {
	claims?: Record<string, unknown> | null;
	error?: { message: string } | null;
}) {
	return {
		auth: {
			getClaims: vi.fn().mockResolvedValue({
				data: options.claims ? { claims: options.claims } : null,
				error: options.error ?? null,
			}),
		},
	} as unknown as Parameters<typeof requireUser>[0];
}

describe("requireUser", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Successful Authentication", () => {
		it("should return user data when authenticated and no MFA required", async () => {
			const mockClaims = {
				sub: "user-123",
				email: "user@example.com",
				phone: "+1234567890",
				aal: "aal1",
				is_anonymous: false,
				app_metadata: { provider: "email" },
				user_metadata: { name: "Test User" },
			};

			const client = createMockClient({ claims: mockClaims });
			mockCheckRequiresMFA.mockResolvedValue(false);

			const result = await requireUser(client);

			expect(result.error).toBeNull();
			expect(result.data).toEqual({
				id: "user-123",
				email: "user@example.com",
				phone: "+1234567890",
				aal: "aal1",
				is_anonymous: false,
				app_metadata: { provider: "email" },
				user_metadata: { name: "Test User" },
			});
		});

		it("should skip MFA check when verifyMfa is false", async () => {
			const mockClaims = {
				sub: "user-456",
				email: "user@test.com",
				phone: "",
				aal: "aal1",
				is_anonymous: false,
				app_metadata: {},
				user_metadata: {},
			};

			const client = createMockClient({ claims: mockClaims });

			const result = await requireUser(client, { verifyMfa: false });

			expect(mockCheckRequiresMFA).not.toHaveBeenCalled();
			expect(result.error).toBeNull();
			expect(result.data).toBeTruthy();
		});

		it("should verify MFA by default", async () => {
			const mockClaims = {
				sub: "user-789",
				email: "user@test.com",
				phone: "",
				aal: "aal2",
				is_anonymous: false,
				app_metadata: {},
				user_metadata: {},
			};

			const client = createMockClient({ claims: mockClaims });
			mockCheckRequiresMFA.mockResolvedValue(false);

			await requireUser(client);

			expect(mockCheckRequiresMFA).toHaveBeenCalledWith(client);
		});
	});

	describe("Authentication Failure", () => {
		it("should return error when no claims exist", async () => {
			const client = createMockClient({ claims: null });

			const result = await requireUser(client);

			expect(result.error).toBeTruthy();
			expect(result.data).toBeNull();
			if (result.error) {
				expect(result.redirectTo).toBe("/auth/sign-in");
			}
		});

		it("should return error when getClaims returns error", async () => {
			const client = createMockClient({
				claims: null,
				error: { message: "Invalid token" },
			});

			const result = await requireUser(client);

			expect(result.error).toBeTruthy();
			expect(result.data).toBeNull();
			if (result.error) {
				expect(result.redirectTo).toBe("/auth/sign-in");
			}
		});

		it("should include next parameter in redirect when provided", async () => {
			const client = createMockClient({ claims: null });

			const result = await requireUser(client, { next: "/dashboard" });

			if (result.error) {
				expect(result.redirectTo).toBe("/auth/sign-in?next=/dashboard");
			}
		});
	});

	describe("MFA Verification", () => {
		it("should return MFA error when MFA is required", async () => {
			const mockClaims = {
				sub: "user-123",
				email: "user@example.com",
				phone: "",
				aal: "aal1",
				is_anonymous: false,
				app_metadata: {},
				user_metadata: {},
			};

			const client = createMockClient({ claims: mockClaims });
			mockCheckRequiresMFA.mockResolvedValue(true);

			const result = await requireUser(client);

			expect(result.error).toBeInstanceOf(MultiFactorAuthError);
			expect(result.data).toBeNull();
			if (result.error) {
				expect(result.redirectTo).toBe("/auth/verify");
			}
		});

		it("should include next parameter in MFA redirect", async () => {
			const mockClaims = {
				sub: "user-123",
				email: "user@example.com",
				phone: "",
				aal: "aal1",
				is_anonymous: false,
				app_metadata: {},
				user_metadata: {},
			};

			const client = createMockClient({ claims: mockClaims });
			mockCheckRequiresMFA.mockResolvedValue(true);

			const result = await requireUser(client, { next: "/protected" });

			if (result.error) {
				expect(result.redirectTo).toBe("/auth/verify?next=/protected");
			}
		});

		it("should pass user through when MFA is satisfied (aal2)", async () => {
			const mockClaims = {
				sub: "user-123",
				email: "user@example.com",
				phone: "",
				aal: "aal2",
				is_anonymous: false,
				app_metadata: {},
				user_metadata: {},
			};

			const client = createMockClient({ claims: mockClaims });
			mockCheckRequiresMFA.mockResolvedValue(false);

			const result = await requireUser(client);

			expect(result.error).toBeNull();
			expect(result.data?.aal).toBe("aal2");
		});
	});

	describe("Edge Cases", () => {
		it("should handle anonymous users", async () => {
			const mockClaims = {
				sub: "anon-user-123",
				email: "",
				phone: "",
				aal: "aal1",
				is_anonymous: true,
				app_metadata: {},
				user_metadata: {},
			};

			const client = createMockClient({ claims: mockClaims });
			mockCheckRequiresMFA.mockResolvedValue(false);

			const result = await requireUser(client);

			expect(result.error).toBeNull();
			expect(result.data?.is_anonymous).toBe(true);
		});

		it("should handle users with phone but no email", async () => {
			const mockClaims = {
				sub: "phone-user-123",
				email: "",
				phone: "+1234567890",
				aal: "aal1",
				is_anonymous: false,
				app_metadata: {},
				user_metadata: {},
			};

			const client = createMockClient({ claims: mockClaims });
			mockCheckRequiresMFA.mockResolvedValue(false);

			const result = await requireUser(client);

			expect(result.error).toBeNull();
			expect(result.data?.email).toBe("");
			expect(result.data?.phone).toBe("+1234567890");
		});

		it("should handle complex app_metadata and user_metadata", async () => {
			const mockClaims = {
				sub: "user-123",
				email: "user@example.com",
				phone: "",
				aal: "aal1",
				is_anonymous: false,
				app_metadata: {
					provider: "google",
					roles: ["admin", "user"],
					custom: { nested: "value" },
				},
				user_metadata: {
					full_name: "Test User",
					avatar_url: "https://example.com/avatar.png",
				},
			};

			const client = createMockClient({ claims: mockClaims });
			mockCheckRequiresMFA.mockResolvedValue(false);

			const result = await requireUser(client);

			expect(result.error).toBeNull();
			expect(result.data?.app_metadata).toEqual(mockClaims.app_metadata);
			expect(result.data?.user_metadata).toEqual(mockClaims.user_metadata);
		});
	});
});
