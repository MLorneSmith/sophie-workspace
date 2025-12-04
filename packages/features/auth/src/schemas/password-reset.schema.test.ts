/**
 * Unit tests for PasswordResetSchema
 * Tests the password reset validation schema
 */

import { describe, expect, it } from "vitest";
import { PasswordResetSchema } from "./password-reset.schema";

describe("PasswordResetSchema", () => {
	describe("Valid Input", () => {
		it("should accept valid matching passwords", () => {
			const input = {
				password: "newpassword123",
				repeatPassword: "newpassword123",
			};
			const result = PasswordResetSchema.safeParse(input);

			expect(result.success).toBe(true);
		});

		it("should accept minimum length password (8 characters)", () => {
			const input = {
				password: "12345678",
				repeatPassword: "12345678",
			};
			const result = PasswordResetSchema.safeParse(input);

			expect(result.success).toBe(true);
		});

		it("should accept password with special characters", () => {
			const input = {
				password: "p@ss!word#123",
				repeatPassword: "p@ss!word#123",
			};
			const result = PasswordResetSchema.safeParse(input);

			expect(result.success).toBe(true);
		});

		it("should accept password with unicode characters", () => {
			const input = {
				password: "pässwörd😀123",
				repeatPassword: "pässwörd😀123",
			};
			const result = PasswordResetSchema.safeParse(input);

			expect(result.success).toBe(true);
		});

		it("should accept password at maximum length (99 characters)", () => {
			const maxPassword = "a".repeat(99);
			const input = {
				password: maxPassword,
				repeatPassword: maxPassword,
			};
			const result = PasswordResetSchema.safeParse(input);

			expect(result.success).toBe(true);
		});
	});

	describe("Password Confirmation Validation", () => {
		it("should reject non-matching passwords", () => {
			const input = {
				password: "newpassword123",
				repeatPassword: "differentpassword",
			};
			const result = PasswordResetSchema.safeParse(input);

			expect(result.success).toBe(false);
			if (!result.success) {
				const passwordMismatchError = result.error.issues.find(
					(issue) =>
						issue.message === "auth:errors.passwordsDoNotMatch" ||
						issue.path.includes("repeatPassword"),
				);
				expect(passwordMismatchError).toBeDefined();
			}
		});

		it("should reject case-mismatched passwords", () => {
			const input = {
				password: "NewPassword123",
				repeatPassword: "newpassword123",
			};
			const result = PasswordResetSchema.safeParse(input);

			expect(result.success).toBe(false);
		});

		it("should reject passwords with different whitespace", () => {
			const input = {
				password: "password123 ",
				repeatPassword: "password123",
			};
			const result = PasswordResetSchema.safeParse(input);

			expect(result.success).toBe(false);
		});

		it("should reject passwords with leading whitespace difference", () => {
			const input = {
				password: " password123",
				repeatPassword: "password123",
			};
			const result = PasswordResetSchema.safeParse(input);

			expect(result.success).toBe(false);
		});
	});

	describe("Password Length Validation", () => {
		it("should reject password below minimum length", () => {
			const input = {
				password: "short", // 5 characters
				repeatPassword: "short",
			};
			const result = PasswordResetSchema.safeParse(input);

			expect(result.success).toBe(false);
		});

		it("should reject password of 7 characters (edge case)", () => {
			const input = {
				password: "1234567",
				repeatPassword: "1234567",
			};
			const result = PasswordResetSchema.safeParse(input);

			expect(result.success).toBe(false);
		});

		it("should reject password exceeding maximum length", () => {
			const longPassword = "a".repeat(100);
			const input = {
				password: longPassword,
				repeatPassword: longPassword,
			};
			const result = PasswordResetSchema.safeParse(input);

			expect(result.success).toBe(false);
		});

		it("should reject empty password", () => {
			const input = {
				password: "",
				repeatPassword: "",
			};
			const result = PasswordResetSchema.safeParse(input);

			expect(result.success).toBe(false);
		});
	});

	describe("Missing Fields", () => {
		it("should reject missing password field", () => {
			const input = {
				repeatPassword: "validpassword123",
			};
			const result = PasswordResetSchema.safeParse(input);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0]?.path).toContain("password");
			}
		});

		it("should reject missing repeatPassword field", () => {
			const input = {
				password: "validpassword123",
			};
			const result = PasswordResetSchema.safeParse(input);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0]?.path).toContain("repeatPassword");
			}
		});

		it("should reject empty object", () => {
			const input = {};
			const result = PasswordResetSchema.safeParse(input);

			expect(result.success).toBe(false);
		});
	});

	describe("Type Validation", () => {
		it("should reject null input", () => {
			const result = PasswordResetSchema.safeParse(null);

			expect(result.success).toBe(false);
		});

		it("should reject undefined input", () => {
			const result = PasswordResetSchema.safeParse(undefined);

			expect(result.success).toBe(false);
		});

		it("should reject non-string password", () => {
			const input = {
				password: 12345678 as unknown as string,
				repeatPassword: "12345678",
			};
			const result = PasswordResetSchema.safeParse(input);

			expect(result.success).toBe(false);
		});

		it("should reject non-string repeatPassword", () => {
			const input = {
				password: "validpassword123",
				repeatPassword: 12345678 as unknown as string,
			};
			const result = PasswordResetSchema.safeParse(input);

			expect(result.success).toBe(false);
		});

		it("should reject array input", () => {
			const result = PasswordResetSchema.safeParse([
				"password123",
				"password123",
			]);

			expect(result.success).toBe(false);
		});
	});

	describe("Edge Cases", () => {
		it("should handle password with only spaces (short)", () => {
			const input = {
				password: "        ", // 8 spaces
				repeatPassword: "        ",
			};
			const result = PasswordResetSchema.safeParse(input);

			// Should pass length validation (8 chars) since this is just the base schema
			expect(result.success).toBe(true);
		});

		it("should handle password with mixed whitespace", () => {
			const input = {
				password: "pass word123",
				repeatPassword: "pass word123",
			};
			const result = PasswordResetSchema.safeParse(input);

			expect(result.success).toBe(true);
		});

		it("should handle password with newline characters", () => {
			const input = {
				password: "password\n123",
				repeatPassword: "password\n123",
			};
			const result = PasswordResetSchema.safeParse(input);

			expect(result.success).toBe(true);
		});

		it("should handle password with tab characters", () => {
			const input = {
				password: "password\t123",
				repeatPassword: "password\t123",
			};
			const result = PasswordResetSchema.safeParse(input);

			expect(result.success).toBe(true);
		});
	});
});
