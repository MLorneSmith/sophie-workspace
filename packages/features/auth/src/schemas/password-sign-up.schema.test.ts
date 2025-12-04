/**
 * Unit tests for PasswordSignUpSchema
 * Tests the sign-up validation schema for email/password registration
 */

import { describe, expect, it } from "vitest";
import { PasswordSignUpSchema } from "./password-sign-up.schema";

describe("PasswordSignUpSchema", () => {
	describe("Valid Input", () => {
		it("should accept valid email and matching passwords", () => {
			const input = {
				email: "user@example.com",
				password: "validpassword123",
				repeatPassword: "validpassword123",
			};
			const result = PasswordSignUpSchema.safeParse(input);

			expect(result.success).toBe(true);
		});

		it("should accept email with subdomain", () => {
			const input = {
				email: "user@mail.example.com",
				password: "validpassword123",
				repeatPassword: "validpassword123",
			};
			const result = PasswordSignUpSchema.safeParse(input);

			expect(result.success).toBe(true);
		});

		it("should accept email with plus sign", () => {
			const input = {
				email: "user+signup@example.com",
				password: "validpassword123",
				repeatPassword: "validpassword123",
			};
			const result = PasswordSignUpSchema.safeParse(input);

			expect(result.success).toBe(true);
		});

		it("should accept minimum length password (8 characters)", () => {
			const input = {
				email: "user@example.com",
				password: "12345678",
				repeatPassword: "12345678",
			};
			const result = PasswordSignUpSchema.safeParse(input);

			expect(result.success).toBe(true);
		});

		it("should accept password with special characters", () => {
			const input = {
				email: "user@example.com",
				password: "p@ss!word#123",
				repeatPassword: "p@ss!word#123",
			};
			const result = PasswordSignUpSchema.safeParse(input);

			expect(result.success).toBe(true);
		});
	});

	describe("Email Validation", () => {
		it("should reject missing email", () => {
			const input = {
				password: "validpassword123",
				repeatPassword: "validpassword123",
			};
			const result = PasswordSignUpSchema.safeParse(input);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0]?.path).toContain("email");
			}
		});

		it("should reject empty email", () => {
			const input = {
				email: "",
				password: "validpassword123",
				repeatPassword: "validpassword123",
			};
			const result = PasswordSignUpSchema.safeParse(input);

			expect(result.success).toBe(false);
		});

		it("should reject invalid email format", () => {
			const input = {
				email: "notanemail",
				password: "validpassword123",
				repeatPassword: "validpassword123",
			};
			const result = PasswordSignUpSchema.safeParse(input);

			expect(result.success).toBe(false);
		});

		it("should reject email without TLD", () => {
			const input = {
				email: "user@example",
				password: "validpassword123",
				repeatPassword: "validpassword123",
			};
			const result = PasswordSignUpSchema.safeParse(input);

			expect(result.success).toBe(false);
		});
	});

	describe("Password Confirmation", () => {
		it("should reject non-matching passwords", () => {
			const input = {
				email: "user@example.com",
				password: "validpassword123",
				repeatPassword: "differentpassword",
			};
			const result = PasswordSignUpSchema.safeParse(input);

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
				email: "user@example.com",
				password: "ValidPassword123",
				repeatPassword: "validpassword123",
			};
			const result = PasswordSignUpSchema.safeParse(input);

			expect(result.success).toBe(false);
		});

		it("should reject passwords with different whitespace", () => {
			const input = {
				email: "user@example.com",
				password: "password123 ",
				repeatPassword: "password123",
			};
			const result = PasswordSignUpSchema.safeParse(input);

			expect(result.success).toBe(false);
		});

		it("should reject missing repeatPassword", () => {
			const input = {
				email: "user@example.com",
				password: "validpassword123",
			};
			const result = PasswordSignUpSchema.safeParse(input);

			expect(result.success).toBe(false);
		});

		it("should reject empty repeatPassword", () => {
			const input = {
				email: "user@example.com",
				password: "validpassword123",
				repeatPassword: "",
			};
			const result = PasswordSignUpSchema.safeParse(input);

			expect(result.success).toBe(false);
		});
	});

	describe("Password Requirements", () => {
		it("should reject password below minimum length", () => {
			const input = {
				email: "user@example.com",
				password: "short", // 5 characters
				repeatPassword: "short",
			};
			const result = PasswordSignUpSchema.safeParse(input);

			expect(result.success).toBe(false);
		});

		it("should reject password of 7 characters (edge case)", () => {
			const input = {
				email: "user@example.com",
				password: "1234567",
				repeatPassword: "1234567",
			};
			const result = PasswordSignUpSchema.safeParse(input);

			expect(result.success).toBe(false);
		});

		it("should reject password exceeding maximum length", () => {
			const longPassword = "a".repeat(100);
			const input = {
				email: "user@example.com",
				password: longPassword,
				repeatPassword: longPassword,
			};
			const result = PasswordSignUpSchema.safeParse(input);

			expect(result.success).toBe(false);
		});

		it("should accept password at maximum length (99 characters)", () => {
			const maxPassword = "a".repeat(99);
			const input = {
				email: "user@example.com",
				password: maxPassword,
				repeatPassword: maxPassword,
			};
			const result = PasswordSignUpSchema.safeParse(input);

			expect(result.success).toBe(true);
		});
	});

	describe("Edge Cases", () => {
		it("should reject all empty fields", () => {
			const input = {
				email: "",
				password: "",
				repeatPassword: "",
			};
			const result = PasswordSignUpSchema.safeParse(input);

			expect(result.success).toBe(false);
		});

		it("should handle unicode characters in password", () => {
			const input = {
				email: "user@example.com",
				password: "pässwörd😀123",
				repeatPassword: "pässwörd😀123",
			};
			const result = PasswordSignUpSchema.safeParse(input);

			expect(result.success).toBe(true);
		});

		it("should handle long email addresses", () => {
			const longLocalPart = "a".repeat(64);
			const input = {
				email: `${longLocalPart}@example.com`,
				password: "validpassword123",
				repeatPassword: "validpassword123",
			};
			const result = PasswordSignUpSchema.safeParse(input);

			expect(result.success).toBe(true);
		});

		it("should reject null input", () => {
			const result = PasswordSignUpSchema.safeParse(null);

			expect(result.success).toBe(false);
		});

		it("should reject undefined input", () => {
			const result = PasswordSignUpSchema.safeParse(undefined);

			expect(result.success).toBe(false);
		});
	});

	describe("Type Validation", () => {
		it("should reject non-string email", () => {
			const input = {
				email: 12345 as unknown as string,
				password: "validpassword123",
				repeatPassword: "validpassword123",
			};
			const result = PasswordSignUpSchema.safeParse(input);

			expect(result.success).toBe(false);
		});

		it("should reject non-string password", () => {
			const input = {
				email: "user@example.com",
				password: 12345678 as unknown as string,
				repeatPassword: "12345678",
			};
			const result = PasswordSignUpSchema.safeParse(input);

			expect(result.success).toBe(false);
		});

		it("should reject non-string repeatPassword", () => {
			const input = {
				email: "user@example.com",
				password: "validpassword123",
				repeatPassword: 12345678 as unknown as string,
			};
			const result = PasswordSignUpSchema.safeParse(input);

			expect(result.success).toBe(false);
		});
	});
});
