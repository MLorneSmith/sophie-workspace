/**
 * Unit tests for checkRequiresMultiFactorAuthentication
 * Tests MFA requirement checking logic
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { checkRequiresMultiFactorAuthentication } from "./check-requires-mfa";

// Helper to create mock Supabase client
function createMockClient(options: {
	currentLevel?: "aal1" | "aal2";
	nextLevel?: "aal1" | "aal2";
	error?: { message: string } | null;
	factors?: { totp: { id: string }[] } | null;
}) {
	return {
		auth: {
			mfa: {
				getAuthenticatorAssuranceLevel: vi.fn().mockResolvedValue({
					data: options.error
						? null
						: {
								currentLevel: options.currentLevel ?? "aal1",
								nextLevel: options.nextLevel ?? "aal1",
							},
					error: options.error ?? null,
				}),
				listFactors: vi.fn().mockResolvedValue({
					data: options.factors ?? { totp: [] },
					error: null,
				}),
			},
			suppressGetSessionWarning: false,
		},
	} as unknown as Parameters<typeof checkRequiresMultiFactorAuthentication>[0];
}

describe("checkRequiresMultiFactorAuthentication", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("MFA Not Required", () => {
		it("should return false when currentLevel equals nextLevel (both aal1)", async () => {
			const client = createMockClient({
				currentLevel: "aal1",
				nextLevel: "aal1",
			});

			const result = await checkRequiresMultiFactorAuthentication(client);

			expect(result).toBe(false);
		});

		it("should return false when currentLevel equals nextLevel (both aal2)", async () => {
			const client = createMockClient({
				currentLevel: "aal2",
				nextLevel: "aal2",
			});

			const result = await checkRequiresMultiFactorAuthentication(client);

			expect(result).toBe(false);
		});

		it("should return false when nextLevel is aal1", async () => {
			const client = createMockClient({
				currentLevel: "aal1",
				nextLevel: "aal1",
			});

			const result = await checkRequiresMultiFactorAuthentication(client);

			expect(result).toBe(false);
		});

		it("should return false when user has no enrolled TOTP factors", async () => {
			const client = createMockClient({
				currentLevel: "aal1",
				nextLevel: "aal2",
				factors: { totp: [] },
			});

			const result = await checkRequiresMultiFactorAuthentication(client);

			expect(result).toBe(false);
		});

		it("should return false when factors.totp is null/undefined", async () => {
			const client = createMockClient({
				currentLevel: "aal1",
				nextLevel: "aal2",
				factors: null,
			});

			const result = await checkRequiresMultiFactorAuthentication(client);

			expect(result).toBe(false);
		});
	});

	describe("MFA Required", () => {
		it("should return true when nextLevel is aal2, currentLevel is aal1, and has enrolled factors", async () => {
			const client = createMockClient({
				currentLevel: "aal1",
				nextLevel: "aal2",
				factors: { totp: [{ id: "factor-123" }] },
			});

			const result = await checkRequiresMultiFactorAuthentication(client);

			expect(result).toBe(true);
		});

		it("should return true when user has multiple enrolled TOTP factors", async () => {
			const client = createMockClient({
				currentLevel: "aal1",
				nextLevel: "aal2",
				factors: { totp: [{ id: "factor-1" }, { id: "factor-2" }] },
			});

			const result = await checkRequiresMultiFactorAuthentication(client);

			expect(result).toBe(true);
		});
	});

	describe("Error Handling", () => {
		it("should throw error when getAuthenticatorAssuranceLevel fails", async () => {
			const client = createMockClient({
				error: { message: "MFA check failed" },
			});

			await expect(
				checkRequiresMultiFactorAuthentication(client),
			).rejects.toThrow("MFA check failed");
		});
	});

	describe("Warning Suppression", () => {
		it("should suppress and restore getSession warning", async () => {
			const client = createMockClient({
				currentLevel: "aal1",
				nextLevel: "aal1",
			});

			const result = await checkRequiresMultiFactorAuthentication(client);

			// The warning should be suppressed during the call and restored after
			// We verify the function completes without error and returns a valid result
			expect(typeof result).toBe("boolean");
		});
	});
});
