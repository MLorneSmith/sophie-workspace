/**
 * Unit tests for PasswordSignInSchema
 * Tests the sign-in validation schema for email/password authentication
 */

import { describe, expect, it } from "vitest";
import { PasswordSignInSchema } from "./password-sign-in.schema";

describe("PasswordSignInSchema", () => {
	describe("Valid Input", () => {
		it("should accept valid email and password", () => {
			const input = {
				email: "user@example.com",
				password: "validpassword123",
			};
			const result = PasswordSignInSchema.safeParse(input);

			expect(result.success).toBe(true);
		});

		it("should accept email with subdomain", () => {
			const input = {
				email: "user@mail.example.com",
				password: "validpassword123",
			};
			const result = PasswordSignInSchema.safeParse(input);

			expect(result.success).toBe(true);
		});

		it("should accept email with plus sign", () => {
			const input = {
				email: "user+tag@example.com",
				password: "validpassword123",
			};
			const result = PasswordSignInSchema.safeParse(input);

			expect(result.success).toBe(true);
		});

		it("should accept email with dots in local part", () => {
			const input = {
				email: "first.last@example.com",
				password: "validpassword123",
			};
			const result = PasswordSignInSchema.safeParse(input);

			expect(result.success).toBe(true);
		});

		it("should accept email with uppercase letters", () => {
			const input = {
				email: "User@Example.COM",
				password: "validpassword123",
			};
			const result = PasswordSignInSchema.safeParse(input);

			expect(result.success).toBe(true);
		});

		it("should accept minimum length password (8 characters)", () => {
			const input = {
				email: "user@example.com",
				password: "12345678",
			};
			const result = PasswordSignInSchema.safeParse(input);

			expect(result.success).toBe(true);
		});
	});

	describe("Invalid Email", () => {
		it("should reject missing email", () => {
			const input = {
				password: "validpassword123",
			};
			const result = PasswordSignInSchema.safeParse(input);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0]?.path).toContain("email");
			}
		});

		it("should reject empty email", () => {
			const input = {
				email: "",
				password: "validpassword123",
			};
			const result = PasswordSignInSchema.safeParse(input);

			expect(result.success).toBe(false);
		});

		it("should reject email without @ symbol", () => {
			const input = {
				email: "userexample.com",
				password: "validpassword123",
			};
			const result = PasswordSignInSchema.safeParse(input);

			expect(result.success).toBe(false);
		});

		it("should reject email without domain", () => {
			const input = {
				email: "user@",
				password: "validpassword123",
			};
			const result = PasswordSignInSchema.safeParse(input);

			expect(result.success).toBe(false);
		});

		it("should reject email without TLD", () => {
			const input = {
				email: "user@example",
				password: "validpassword123",
			};
			const result = PasswordSignInSchema.safeParse(input);

			expect(result.success).toBe(false);
		});

		it("should reject email with spaces", () => {
			const input = {
				email: "user @example.com",
				password: "validpassword123",
			};
			const result = PasswordSignInSchema.safeParse(input);

			expect(result.success).toBe(false);
		});

		it("should reject email with multiple @ symbols", () => {
			const input = {
				email: "user@@example.com",
				password: "validpassword123",
			};
			const result = PasswordSignInSchema.safeParse(input);

			expect(result.success).toBe(false);
		});
	});

	describe("Invalid Password", () => {
		it("should reject missing password", () => {
			const input = {
				email: "user@example.com",
			};
			const result = PasswordSignInSchema.safeParse(input);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0]?.path).toContain("password");
			}
		});

		it("should reject empty password", () => {
			const input = {
				email: "user@example.com",
				password: "",
			};
			const result = PasswordSignInSchema.safeParse(input);

			expect(result.success).toBe(false);
		});

		it("should reject password below minimum length", () => {
			const input = {
				email: "user@example.com",
				password: "short", // 5 characters
			};
			const result = PasswordSignInSchema.safeParse(input);

			expect(result.success).toBe(false);
		});

		it("should reject password of 7 characters (edge case)", () => {
			const input = {
				email: "user@example.com",
				password: "1234567",
			};
			const result = PasswordSignInSchema.safeParse(input);

			expect(result.success).toBe(false);
		});

		it("should reject password exceeding maximum length", () => {
			const input = {
				email: "user@example.com",
				password: "a".repeat(100),
			};
			const result = PasswordSignInSchema.safeParse(input);

			expect(result.success).toBe(false);
		});
	});

	describe("Edge Cases", () => {
		it("should reject both missing email and password", () => {
			const input = {};
			const result = PasswordSignInSchema.safeParse(input);

			expect(result.success).toBe(false);
		});

		it("should handle unicode characters in password", () => {
			const input = {
				email: "user@example.com",
				password: "pässwörd123",
			};
			const result = PasswordSignInSchema.safeParse(input);

			expect(result.success).toBe(true);
		});

		it("should handle special characters in password", () => {
			const input = {
				email: "user@example.com",
				password: "p@ss!word#123$",
			};
			const result = PasswordSignInSchema.safeParse(input);

			expect(result.success).toBe(true);
		});

		it("should handle password with leading spaces", () => {
			const input = {
				email: "user@example.com",
				password: "  password123",
			};
			const result = PasswordSignInSchema.safeParse(input);

			expect(result.success).toBe(true);
		});

		it("should handle password with trailing spaces", () => {
			const input = {
				email: "user@example.com",
				password: "password123  ",
			};
			const result = PasswordSignInSchema.safeParse(input);

			expect(result.success).toBe(true);
		});
	});

	describe("Type Validation", () => {
		it("should reject null values", () => {
			const result = PasswordSignInSchema.safeParse(null);

			expect(result.success).toBe(false);
		});

		it("should reject array input", () => {
			const result = PasswordSignInSchema.safeParse([
				"user@example.com",
				"password123",
			]);

			expect(result.success).toBe(false);
		});

		it("should reject email as number", () => {
			const input = {
				email: 12345 as unknown as string,
				password: "validpassword123",
			};
			const result = PasswordSignInSchema.safeParse(input);

			expect(result.success).toBe(false);
		});

		it("should reject password as number", () => {
			const input = {
				email: "user@example.com",
				password: 12345678 as unknown as string,
			};
			const result = PasswordSignInSchema.safeParse(input);

			expect(result.success).toBe(false);
		});
	});
});
