/**
 * Unit tests for contact email schema validation
 * Tests Zod schema for contact form including name, email, and message fields
 */

import { describe, expect, it } from "vitest";

import { ContactEmailSchema } from "./contact-email.schema";

describe("ContactEmailSchema", () => {
	describe("Valid Input", () => {
		it("should accept valid contact form data", () => {
			const validData = {
				name: "John Doe",
				email: "john.doe@example.com",
				message: "Hello, I have a question about your service.",
			};

			const result = ContactEmailSchema.parse(validData);
			expect(result).toEqual(validData);
		});

		it("should accept minimum length values", () => {
			const minData = {
				name: "J",
				email: "a@b.co",
				message: "H",
			};

			expect(() => ContactEmailSchema.parse(minData)).not.toThrow();
		});

		it("should accept maximum length values", () => {
			const maxData = {
				name: "A".repeat(200),
				email: "test@example.com",
				message: "B".repeat(5000),
			};

			expect(() => ContactEmailSchema.parse(maxData)).not.toThrow();
		});

		it("should accept various valid email formats", () => {
			const validEmails = [
				"user@example.com",
				"user.name@example.com",
				"user+tag@example.com",
				"user@subdomain.example.com",
				"user@example.co.uk",
				"user123@example.org",
				"USER@EXAMPLE.COM",
			];

			for (const email of validEmails) {
				const data = { name: "Test", email, message: "Test message" };
				expect(() => ContactEmailSchema.parse(data)).not.toThrow();
			}
		});
	});

	describe("Name Validation", () => {
		it("should reject empty name", () => {
			const data = {
				name: "",
				email: "test@example.com",
				message: "Hello",
			};

			expect(() => ContactEmailSchema.parse(data)).toThrow();
		});

		it("should reject name exceeding 200 characters", () => {
			const data = {
				name: "A".repeat(201),
				email: "test@example.com",
				message: "Hello",
			};

			expect(() => ContactEmailSchema.parse(data)).toThrow();
		});

		it("should reject missing name field", () => {
			const data = {
				email: "test@example.com",
				message: "Hello",
			};

			expect(() => ContactEmailSchema.parse(data)).toThrow();
		});

		it("should accept name at exactly 200 characters", () => {
			const data = {
				name: "A".repeat(200),
				email: "test@example.com",
				message: "Hello",
			};

			expect(() => ContactEmailSchema.parse(data)).not.toThrow();
		});

		it("should accept name with special characters", () => {
			const specialNames = [
				"María García",
				"François Müller",
				"李明",
				"O'Connor",
				"Anne-Marie",
				"Dr. Smith Jr.",
			];

			for (const name of specialNames) {
				const data = { name, email: "test@example.com", message: "Hello" };
				expect(() => ContactEmailSchema.parse(data)).not.toThrow();
			}
		});

		it("should accept name with numbers", () => {
			const data = {
				name: "User123",
				email: "test@example.com",
				message: "Hello",
			};

			expect(() => ContactEmailSchema.parse(data)).not.toThrow();
		});
	});

	describe("Email Validation", () => {
		it("should reject invalid email formats", () => {
			const invalidEmails = [
				"notanemail",
				"@example.com",
				"user@",
				"user@.com",
				"user@example",
				"user name@example.com",
				"user@exam ple.com",
			];

			for (const email of invalidEmails) {
				const data = { name: "Test", email, message: "Hello" };
				expect(() => ContactEmailSchema.parse(data)).toThrow();
			}
		});

		it("should reject empty email", () => {
			const data = {
				name: "Test",
				email: "",
				message: "Hello",
			};

			expect(() => ContactEmailSchema.parse(data)).toThrow();
		});

		it("should reject missing email field", () => {
			const data = {
				name: "Test",
				message: "Hello",
			};

			expect(() => ContactEmailSchema.parse(data)).toThrow();
		});

		it("should reject email with multiple @ symbols", () => {
			const data = {
				name: "Test",
				email: "user@@example.com",
				message: "Hello",
			};

			expect(() => ContactEmailSchema.parse(data)).toThrow();
		});

		it("should reject email without domain extension", () => {
			const data = {
				name: "Test",
				email: "user@localhost",
				message: "Hello",
			};

			// Some validators may accept this, but most strict validators reject it
			// The z.string().email() in Zod should handle this
			expect(() => ContactEmailSchema.parse(data)).toThrow();
		});
	});

	describe("Message Validation", () => {
		it("should reject empty message", () => {
			const data = {
				name: "Test",
				email: "test@example.com",
				message: "",
			};

			expect(() => ContactEmailSchema.parse(data)).toThrow();
		});

		it("should reject message exceeding 5000 characters", () => {
			const data = {
				name: "Test",
				email: "test@example.com",
				message: "A".repeat(5001),
			};

			expect(() => ContactEmailSchema.parse(data)).toThrow();
		});

		it("should reject missing message field", () => {
			const data = {
				name: "Test",
				email: "test@example.com",
			};

			expect(() => ContactEmailSchema.parse(data)).toThrow();
		});

		it("should accept message at exactly 5000 characters", () => {
			const data = {
				name: "Test",
				email: "test@example.com",
				message: "A".repeat(5000),
			};

			expect(() => ContactEmailSchema.parse(data)).not.toThrow();
		});

		it("should accept message with newlines", () => {
			const data = {
				name: "Test",
				email: "test@example.com",
				message: "Line 1\nLine 2\nLine 3",
			};

			expect(() => ContactEmailSchema.parse(data)).not.toThrow();
		});

		it("should accept message with special characters", () => {
			const data = {
				name: "Test",
				email: "test@example.com",
				message: "Special chars: !@#$%^&*()_+{}|:\"<>?[]\\;',./`~",
			};

			expect(() => ContactEmailSchema.parse(data)).not.toThrow();
		});

		it("should accept message with Unicode characters", () => {
			const data = {
				name: "Test",
				email: "test@example.com",
				message: "Unicode: 日本語 中文 한국어 العربية 🎉 ™ © ®",
			};

			expect(() => ContactEmailSchema.parse(data)).not.toThrow();
		});

		it("should accept message with HTML-like content (as string)", () => {
			const data = {
				name: "Test",
				email: "test@example.com",
				message: "<p>This looks like HTML</p> <script>alert('test')</script>",
			};

			// Schema should accept it as string, sanitization happens elsewhere
			expect(() => ContactEmailSchema.parse(data)).not.toThrow();
		});
	});

	describe("Type Coercion and Edge Cases", () => {
		it("should reject non-string name", () => {
			const data = {
				name: 123,
				email: "test@example.com",
				message: "Hello",
			};

			expect(() => ContactEmailSchema.parse(data)).toThrow();
		});

		it("should reject non-string email", () => {
			const data = {
				name: "Test",
				email: 123,
				message: "Hello",
			};

			expect(() => ContactEmailSchema.parse(data)).toThrow();
		});

		it("should reject non-string message", () => {
			const data = {
				name: "Test",
				email: "test@example.com",
				message: 123,
			};

			expect(() => ContactEmailSchema.parse(data)).toThrow();
		});

		it("should reject null values", () => {
			const nullName = { name: null, email: "test@example.com", message: "Hi" };
			const nullEmail = { name: "Test", email: null, message: "Hi" };
			const nullMessage = {
				name: "Test",
				email: "test@example.com",
				message: null,
			};

			expect(() => ContactEmailSchema.parse(nullName)).toThrow();
			expect(() => ContactEmailSchema.parse(nullEmail)).toThrow();
			expect(() => ContactEmailSchema.parse(nullMessage)).toThrow();
		});

		it("should reject undefined values", () => {
			const undefinedName = {
				name: undefined,
				email: "test@example.com",
				message: "Hi",
			};
			const undefinedEmail = { name: "Test", email: undefined, message: "Hi" };
			const undefinedMessage = {
				name: "Test",
				email: "test@example.com",
				message: undefined,
			};

			expect(() => ContactEmailSchema.parse(undefinedName)).toThrow();
			expect(() => ContactEmailSchema.parse(undefinedEmail)).toThrow();
			expect(() => ContactEmailSchema.parse(undefinedMessage)).toThrow();
		});

		it("should ignore extra fields", () => {
			const data = {
				name: "Test",
				email: "test@example.com",
				message: "Hello",
				extraField: "should be ignored",
			};

			const result = ContactEmailSchema.parse(data);
			expect(result).not.toHaveProperty("extraField");
		});

		it("should preserve whitespace in message", () => {
			const data = {
				name: "Test",
				email: "test@example.com",
				message: "  Hello  World  ",
			};

			const result = ContactEmailSchema.parse(data);
			expect(result.message).toBe("  Hello  World  ");
		});
	});

	describe("Boundary Conditions", () => {
		it("should accept name at exactly 1 character", () => {
			const data = {
				name: "A",
				email: "test@example.com",
				message: "Hello",
			};

			expect(() => ContactEmailSchema.parse(data)).not.toThrow();
		});

		it("should accept message at exactly 1 character", () => {
			const data = {
				name: "Test",
				email: "test@example.com",
				message: "H",
			};

			expect(() => ContactEmailSchema.parse(data)).not.toThrow();
		});

		it("should reject name at 0 characters", () => {
			const data = {
				name: "",
				email: "test@example.com",
				message: "Hello",
			};

			expect(() => ContactEmailSchema.parse(data)).toThrow();
		});

		it("should reject message at 0 characters", () => {
			const data = {
				name: "Test",
				email: "test@example.com",
				message: "",
			};

			expect(() => ContactEmailSchema.parse(data)).toThrow();
		});
	});

	describe("SafeParse Method", () => {
		it("should return success for valid data", () => {
			const data = {
				name: "Test",
				email: "test@example.com",
				message: "Hello",
			};

			const result = ContactEmailSchema.safeParse(data);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data).toEqual(data);
			}
		});

		it("should return error for invalid data", () => {
			const data = {
				name: "",
				email: "invalid",
				message: "",
			};

			const result = ContactEmailSchema.safeParse(data);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues.length).toBeGreaterThan(0);
			}
		});

		it("should provide meaningful error messages", () => {
			const data = {
				name: "",
				email: "test@example.com",
				message: "Hello",
			};

			const result = ContactEmailSchema.safeParse(data);
			expect(result.success).toBe(false);
			if (!result.success) {
				const nameError = result.error.issues.find(
					(issue) => issue.path[0] === "name",
				);
				expect(nameError).toBeDefined();
			}
		});
	});
});
