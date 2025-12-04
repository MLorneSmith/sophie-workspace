/**
 * Unit tests for PasswordSchema
 * Tests the base password validation schema used across auth flows
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { PasswordSchema, refineRepeatPassword } from "./password.schema";

// Store original env values to restore after tests
const originalEnv = {
	NEXT_PUBLIC_PASSWORD_REQUIRE_SPECIAL_CHARS:
		process.env.NEXT_PUBLIC_PASSWORD_REQUIRE_SPECIAL_CHARS,
	NEXT_PUBLIC_PASSWORD_REQUIRE_NUMBERS:
		process.env.NEXT_PUBLIC_PASSWORD_REQUIRE_NUMBERS,
	NEXT_PUBLIC_PASSWORD_REQUIRE_UPPERCASE:
		process.env.NEXT_PUBLIC_PASSWORD_REQUIRE_UPPERCASE,
};

describe("PasswordSchema", () => {
	describe("Basic Validation", () => {
		it("should accept valid password with minimum length", () => {
			const password = "password"; // 8 characters (minimum)
			const result = PasswordSchema.safeParse(password);

			expect(result.success).toBe(true);
		});

		it("should accept valid password with more than minimum length", () => {
			const password = "longerpassword123"; // 17 characters
			const result = PasswordSchema.safeParse(password);

			expect(result.success).toBe(true);
		});

		it("should accept password at maximum length (99 characters)", () => {
			const password = "a".repeat(99);
			const result = PasswordSchema.safeParse(password);

			expect(result.success).toBe(true);
		});

		it("should reject password below minimum length", () => {
			const password = "short"; // 5 characters, less than 8
			const result = PasswordSchema.safeParse(password);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0]?.code).toBe("too_small");
			}
		});

		it("should reject password exceeding maximum length", () => {
			const password = "a".repeat(100);
			const result = PasswordSchema.safeParse(password);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0]?.code).toBe("too_big");
			}
		});

		it("should reject empty password", () => {
			const password = "";
			const result = PasswordSchema.safeParse(password);

			expect(result.success).toBe(false);
		});

		it("should reject password with only 7 characters (edge case)", () => {
			const password = "1234567"; // 7 characters
			const result = PasswordSchema.safeParse(password);

			expect(result.success).toBe(false);
		});

		it("should accept password with exactly 8 characters (edge case)", () => {
			const password = "12345678"; // 8 characters
			const result = PasswordSchema.safeParse(password);

			expect(result.success).toBe(true);
		});
	});

	describe("Special Characters Handling", () => {
		it("should accept password with special characters", () => {
			const password = "pass!@#$word";
			const result = PasswordSchema.safeParse(password);

			expect(result.success).toBe(true);
		});

		it("should accept password with unicode characters", () => {
			const password = "pässwörd😀";
			const result = PasswordSchema.safeParse(password);

			expect(result.success).toBe(true);
		});

		it("should accept password with spaces", () => {
			const password = "pass word with spaces";
			const result = PasswordSchema.safeParse(password);

			expect(result.success).toBe(true);
		});

		it("should accept password with leading/trailing spaces", () => {
			const password = "  password  ";
			const result = PasswordSchema.safeParse(password);

			expect(result.success).toBe(true);
		});
	});

	describe("Type Validation", () => {
		it("should reject non-string values - number", () => {
			const password = 12345678 as unknown as string;
			const result = PasswordSchema.safeParse(password);

			expect(result.success).toBe(false);
		});

		it("should reject non-string values - object", () => {
			const password = { password: "test" } as unknown as string;
			const result = PasswordSchema.safeParse(password);

			expect(result.success).toBe(false);
		});

		it("should reject null", () => {
			const result = PasswordSchema.safeParse(null);

			expect(result.success).toBe(false);
		});

		it("should reject undefined", () => {
			const result = PasswordSchema.safeParse(undefined);

			expect(result.success).toBe(false);
		});
	});
});

describe("refineRepeatPassword", () => {
	// Create a schema that uses the refineRepeatPassword function
	const TestSchema = z
		.object({
			password: z.string(),
			repeatPassword: z.string(),
		})
		.superRefine(refineRepeatPassword);

	it("should pass when passwords match", () => {
		const data = {
			password: "mypassword123",
			repeatPassword: "mypassword123",
		};
		const result = TestSchema.safeParse(data);

		expect(result.success).toBe(true);
	});

	it("should fail when passwords do not match", () => {
		const data = {
			password: "mypassword123",
			repeatPassword: "differentpassword",
		};
		const result = TestSchema.safeParse(data);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0]?.message).toBe(
				"auth:errors.passwordsDoNotMatch",
			);
			expect(result.error.issues[0]?.path).toEqual(["repeatPassword"]);
		}
	});

	it("should fail when repeat password is empty and password is not", () => {
		const data = {
			password: "mypassword123",
			repeatPassword: "",
		};
		const result = TestSchema.safeParse(data);

		expect(result.success).toBe(false);
	});

	it("should pass when both passwords are empty", () => {
		const data = {
			password: "",
			repeatPassword: "",
		};
		// Both empty means they match (validation of length handled separately)
		const result = TestSchema.safeParse(data);

		expect(result.success).toBe(true);
	});

	it("should be case sensitive", () => {
		const data = {
			password: "MyPassword123",
			repeatPassword: "mypassword123",
		};
		const result = TestSchema.safeParse(data);

		expect(result.success).toBe(false);
	});

	it("should be sensitive to whitespace", () => {
		const data = {
			password: "password ",
			repeatPassword: "password",
		};
		const result = TestSchema.safeParse(data);

		expect(result.success).toBe(false);
	});
});

describe("RefinedPasswordSchema with environment requirements", () => {
	const originalEnvState = { ...process.env };

	afterEach(() => {
		// Restore original environment
		process.env = { ...originalEnvState };
		// Reset modules to clear cached imports
		vi.resetModules();
	});

	describe("Special Characters Requirement", () => {
		beforeEach(() => {
			vi.resetModules();
			process.env.NEXT_PUBLIC_PASSWORD_REQUIRE_SPECIAL_CHARS = "true";
			process.env.NEXT_PUBLIC_PASSWORD_REQUIRE_NUMBERS = "false";
			process.env.NEXT_PUBLIC_PASSWORD_REQUIRE_UPPERCASE = "false";
		});

		it("should fail when special chars required but password has none", async () => {
			const { RefinedPasswordSchema } = await import("./password.schema");
			const password = "password1234"; // No special chars
			const result = RefinedPasswordSchema.safeParse(password);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0]?.message).toBe(
					"auth:errors.minPasswordSpecialChars",
				);
			}
		});

		it("should pass when special chars required and password has one", async () => {
			const { RefinedPasswordSchema } = await import("./password.schema");
			const password = "password!"; // Has special char
			const result = RefinedPasswordSchema.safeParse(password);

			expect(result.success).toBe(true);
		});

		it("should pass when special chars required and password has multiple", async () => {
			const { RefinedPasswordSchema } = await import("./password.schema");
			const password = "p@ss!word#"; // Has multiple special chars
			const result = RefinedPasswordSchema.safeParse(password);

			expect(result.success).toBe(true);
		});
	});

	describe("Numbers Requirement", () => {
		beforeEach(() => {
			vi.resetModules();
			process.env.NEXT_PUBLIC_PASSWORD_REQUIRE_SPECIAL_CHARS = "false";
			process.env.NEXT_PUBLIC_PASSWORD_REQUIRE_NUMBERS = "true";
			process.env.NEXT_PUBLIC_PASSWORD_REQUIRE_UPPERCASE = "false";
		});

		it("should fail when numbers required but password has none", async () => {
			const { RefinedPasswordSchema } = await import("./password.schema");
			const password = "password!"; // No numbers
			const result = RefinedPasswordSchema.safeParse(password);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0]?.message).toBe(
					"auth:errors.minPasswordNumbers",
				);
			}
		});

		it("should pass when numbers required and password has one", async () => {
			const { RefinedPasswordSchema } = await import("./password.schema");
			const password = "password1"; // Has number
			const result = RefinedPasswordSchema.safeParse(password);

			expect(result.success).toBe(true);
		});

		it("should pass when numbers required and password has multiple", async () => {
			const { RefinedPasswordSchema } = await import("./password.schema");
			const password = "p4ssw0rd123"; // Has multiple numbers
			const result = RefinedPasswordSchema.safeParse(password);

			expect(result.success).toBe(true);
		});
	});

	describe("Uppercase Requirement", () => {
		beforeEach(() => {
			vi.resetModules();
			process.env.NEXT_PUBLIC_PASSWORD_REQUIRE_SPECIAL_CHARS = "false";
			process.env.NEXT_PUBLIC_PASSWORD_REQUIRE_NUMBERS = "false";
			process.env.NEXT_PUBLIC_PASSWORD_REQUIRE_UPPERCASE = "true";
		});

		it("should fail when uppercase required but password has none", async () => {
			const { RefinedPasswordSchema } = await import("./password.schema");
			const password = "password123"; // No uppercase
			const result = RefinedPasswordSchema.safeParse(password);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0]?.message).toBe(
					"auth:errors.uppercasePassword",
				);
			}
		});

		it("should pass when uppercase required and password has one", async () => {
			const { RefinedPasswordSchema } = await import("./password.schema");
			const password = "Password123"; // Has uppercase
			const result = RefinedPasswordSchema.safeParse(password);

			expect(result.success).toBe(true);
		});

		it("should pass when uppercase required and password has multiple", async () => {
			const { RefinedPasswordSchema } = await import("./password.schema");
			const password = "PaSSWord123"; // Has multiple uppercase
			const result = RefinedPasswordSchema.safeParse(password);

			expect(result.success).toBe(true);
		});
	});

	describe("Combined Requirements", () => {
		beforeEach(() => {
			vi.resetModules();
			process.env.NEXT_PUBLIC_PASSWORD_REQUIRE_SPECIAL_CHARS = "true";
			process.env.NEXT_PUBLIC_PASSWORD_REQUIRE_NUMBERS = "true";
			process.env.NEXT_PUBLIC_PASSWORD_REQUIRE_UPPERCASE = "true";
		});

		it("should fail when all requirements enabled but none met", async () => {
			const { RefinedPasswordSchema } = await import("./password.schema");
			const password = "password"; // No special chars, numbers, or uppercase
			const result = RefinedPasswordSchema.safeParse(password);

			expect(result.success).toBe(false);
			if (!result.success) {
				// Should have 3 issues, one for each requirement
				expect(result.error.issues.length).toBe(3);
			}
		});

		it("should fail when only special chars present", async () => {
			const { RefinedPasswordSchema } = await import("./password.schema");
			const password = "pass!word"; // Only special chars
			const result = RefinedPasswordSchema.safeParse(password);

			expect(result.success).toBe(false);
			if (!result.success) {
				// Should have 2 issues (missing numbers and uppercase)
				expect(result.error.issues.length).toBe(2);
			}
		});

		it("should fail when only numbers present", async () => {
			const { RefinedPasswordSchema } = await import("./password.schema");
			const password = "pass1word"; // Only numbers
			const result = RefinedPasswordSchema.safeParse(password);

			expect(result.success).toBe(false);
			if (!result.success) {
				// Should have 2 issues (missing special chars and uppercase)
				expect(result.error.issues.length).toBe(2);
			}
		});

		it("should fail when only uppercase present", async () => {
			const { RefinedPasswordSchema } = await import("./password.schema");
			const password = "Passworrd"; // Only uppercase
			const result = RefinedPasswordSchema.safeParse(password);

			expect(result.success).toBe(false);
			if (!result.success) {
				// Should have 2 issues (missing special chars and numbers)
				expect(result.error.issues.length).toBe(2);
			}
		});

		it("should pass when all requirements met", async () => {
			const { RefinedPasswordSchema } = await import("./password.schema");
			const password = "Password1!"; // Has all: uppercase P, number 1, special !
			const result = RefinedPasswordSchema.safeParse(password);

			expect(result.success).toBe(true);
		});

		it("should pass with complex password meeting all requirements", async () => {
			const { RefinedPasswordSchema } = await import("./password.schema");
			const password = "MyP@ssw0rd!123"; // Complex password
			const result = RefinedPasswordSchema.safeParse(password);

			expect(result.success).toBe(true);
		});
	});

	describe("No Requirements (all disabled)", () => {
		beforeEach(() => {
			vi.resetModules();
			process.env.NEXT_PUBLIC_PASSWORD_REQUIRE_SPECIAL_CHARS = "false";
			process.env.NEXT_PUBLIC_PASSWORD_REQUIRE_NUMBERS = "false";
			process.env.NEXT_PUBLIC_PASSWORD_REQUIRE_UPPERCASE = "false";
		});

		it("should pass with simple password when no extra requirements", async () => {
			const { RefinedPasswordSchema } = await import("./password.schema");
			const password = "simplepassword"; // Just meets length
			const result = RefinedPasswordSchema.safeParse(password);

			expect(result.success).toBe(true);
		});
	});
});
