/**
 * Unit tests for enhanceAction
 * Tests the server action wrapper for validation, auth, and captcha checks
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

// Set up mocks before imports - mocks must be defined inline
vi.mock("@kit/supabase/require-user", () => ({
	requireUser: vi.fn(),
}));

vi.mock("@kit/auth/captcha/server", () => ({
	verifyCaptchaToken: vi.fn(),
}));

vi.mock("next/navigation", () => ({
	redirect: vi.fn((url: string) => {
		throw new Error(`NEXT_REDIRECT:${url}`);
	}),
}));

// Import the mocked modules
import { verifyCaptchaToken } from "@kit/auth/captcha/server";
import { requireUser } from "@kit/supabase/require-user";
import { redirect } from "next/navigation";

// Import after mocks are set up
import { enhanceAction } from "./index";

// Type the mocks
const mockRequireUser = requireUser as ReturnType<typeof vi.fn>;
const mockVerifyCaptchaToken = verifyCaptchaToken as ReturnType<typeof vi.fn>;
const mockRedirect = redirect as unknown as ReturnType<typeof vi.fn>;

describe("enhanceAction", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Schema Validation", () => {
		it("should validate and pass data when schema is valid", async () => {
			const schema = z.object({
				name: z.string(),
				age: z.number(),
			});

			mockRequireUser.mockResolvedValue({
				data: { id: "user-123", email: "test@example.com" },
				error: null,
				redirectTo: null,
			});

			const handler = vi.fn().mockReturnValue({ success: true });

			const action = enhanceAction(handler, {
				auth: true,
				schema,
			});

			const result = await action({ name: "John", age: 30 });

			expect(handler).toHaveBeenCalledWith(
				{ name: "John", age: 30 },
				expect.objectContaining({ id: "user-123" }),
			);
			expect(result).toEqual({ success: true });
		});

		it("should throw error when schema validation fails", async () => {
			const schema = z.object({
				name: z.string(),
				age: z.number(),
			});

			const handler = vi.fn();

			const action = enhanceAction(handler, {
				auth: false,
				schema,
			});

			await expect(
				action({ name: "John", age: "not-a-number" } as unknown as {
					name: string;
					age: number;
				}),
			).rejects.toThrow("Invalid data:");

			expect(handler).not.toHaveBeenCalled();
		});

		it("should pass data unchanged when no schema is provided", async () => {
			mockRequireUser.mockResolvedValue({
				data: { id: "user-123", email: "test@example.com" },
				error: null,
				redirectTo: null,
			});

			const handler = vi.fn().mockReturnValue({ success: true });

			const action = enhanceAction(handler, {
				auth: true,
			});

			const input = { customData: "test" };
			await action(input);

			expect(handler).toHaveBeenCalledWith(
				{ customData: "test" },
				expect.objectContaining({ id: "user-123" }),
			);
		});
	});

	describe("Authentication", () => {
		it("should enforce authentication by default (auth: true)", async () => {
			mockRequireUser.mockResolvedValue({
				data: { id: "user-456", email: "user@test.com", aal: "aal1" },
				error: null,
				redirectTo: null,
			});

			const handler = vi.fn().mockReturnValue({ success: true });

			const action = enhanceAction(handler, {});

			await action({});

			expect(mockRequireUser).toHaveBeenCalled();
			expect(handler).toHaveBeenCalledWith(
				{},
				expect.objectContaining({ id: "user-456" }),
			);
		});

		it("should redirect when user is not authenticated", async () => {
			mockRequireUser.mockResolvedValue({
				data: null,
				error: { message: "Not authenticated" },
				redirectTo: "/auth/login",
			});

			const handler = vi.fn();

			const action = enhanceAction(handler, {
				auth: true,
			});

			await expect(action({})).rejects.toThrow("NEXT_REDIRECT:/auth/login");

			expect(mockRedirect).toHaveBeenCalledWith("/auth/login");
			expect(handler).not.toHaveBeenCalled();
		});

		it("should skip authentication when auth: false", async () => {
			const handler = vi.fn().mockReturnValue({ success: true });

			const action = enhanceAction(handler, {
				auth: false,
			});

			await action({});

			expect(mockRequireUser).not.toHaveBeenCalled();
			expect(handler).toHaveBeenCalledWith({}, undefined);
		});

		it("should pass user data to handler when authenticated", async () => {
			const userData = {
				id: "user-789",
				email: "authenticated@test.com",
				aal: "aal2",
				is_anonymous: false,
				phone: "",
				app_metadata: {},
				user_metadata: {},
			};

			mockRequireUser.mockResolvedValue({
				data: userData,
				error: null,
				redirectTo: null,
			});

			const handler = vi.fn().mockReturnValue({ success: true });

			const action = enhanceAction(handler, {
				auth: true,
			});

			await action({});

			expect(handler).toHaveBeenCalledWith({}, userData);
		});
	});

	describe("Captcha Verification", () => {
		it("should skip captcha by default (captcha: false)", async () => {
			mockRequireUser.mockResolvedValue({
				data: { id: "user-123" },
				error: null,
				redirectTo: null,
			});

			const handler = vi.fn().mockReturnValue({ success: true });

			const action = enhanceAction(handler, {
				auth: true,
			});

			await action({});

			expect(mockVerifyCaptchaToken).not.toHaveBeenCalled();
		});

		it("should verify captcha when enabled", async () => {
			mockRequireUser.mockResolvedValue({
				data: { id: "user-123" },
				error: null,
				redirectTo: null,
			});
			mockVerifyCaptchaToken.mockResolvedValue(true);

			const schema = z.object({
				name: z.string(),
				captchaToken: z.string(),
			});

			const handler = vi.fn().mockReturnValue({ success: true });

			const action = enhanceAction(handler, {
				auth: true,
				captcha: true,
				schema,
			});

			await action({ name: "John", captchaToken: "valid-token-123" });

			expect(mockVerifyCaptchaToken).toHaveBeenCalledWith("valid-token-123");
			expect(handler).toHaveBeenCalled();
		});

		it("should throw error when captcha verification fails", async () => {
			mockVerifyCaptchaToken.mockRejectedValue(
				new Error("Invalid captcha token"),
			);

			const schema = z.object({
				name: z.string(),
				captchaToken: z.string(),
			});

			const handler = vi.fn();

			const action = enhanceAction(handler, {
				auth: false,
				captcha: true,
				schema,
			});

			await expect(
				action({ name: "John", captchaToken: "invalid-token" }),
			).rejects.toThrow("Invalid captcha token");

			expect(handler).not.toHaveBeenCalled();
		});
	});

	describe("Error Handling", () => {
		it("should propagate errors from the handler function", async () => {
			mockRequireUser.mockResolvedValue({
				data: { id: "user-123" },
				error: null,
				redirectTo: null,
			});

			const handler = vi.fn().mockRejectedValue(new Error("Handler error"));

			const action = enhanceAction(handler, {
				auth: true,
			});

			await expect(action({})).rejects.toThrow("Handler error");
		});

		it("should handle async handlers correctly", async () => {
			mockRequireUser.mockResolvedValue({
				data: { id: "user-123" },
				error: null,
				redirectTo: null,
			});

			const handler = vi.fn().mockImplementation(async () => {
				await new Promise((resolve) => setTimeout(resolve, 10));
				return { success: true, delayed: true };
			});

			const action = enhanceAction(handler, {
				auth: true,
			});

			const result = await action({});

			expect(result).toEqual({ success: true, delayed: true });
		});
	});

	describe("Combined Scenarios", () => {
		it("should validate schema, verify auth, and call handler in order", async () => {
			const callOrder: string[] = [];

			const schema = z.object({
				email: z.string().email(),
			});

			mockRequireUser.mockImplementation(async () => {
				callOrder.push("requireUser");
				return {
					data: { id: "user-123" },
					error: null,
					redirectTo: null,
				};
			});

			const handler = vi.fn().mockImplementation(() => {
				callOrder.push("handler");
				return { success: true };
			});

			const action = enhanceAction(handler, {
				auth: true,
				schema,
			});

			await action({ email: "test@example.com" });

			// Schema validation happens first (synchronously during parsing)
			// Then requireUser is called
			// Then handler is called
			expect(callOrder).toEqual(["requireUser", "handler"]);
		});

		it("should handle all options together: schema + auth + captcha", async () => {
			const schema = z.object({
				message: z.string().min(1),
				captchaToken: z.string(),
			});

			mockRequireUser.mockResolvedValue({
				data: { id: "user-123" },
				error: null,
				redirectTo: null,
			});
			mockVerifyCaptchaToken.mockResolvedValue(true);

			const handler = vi.fn().mockReturnValue({ success: true });

			const action = enhanceAction(handler, {
				auth: true,
				captcha: true,
				schema,
			});

			await action({ message: "Hello", captchaToken: "token-123" });

			expect(mockVerifyCaptchaToken).toHaveBeenCalledWith("token-123");
			expect(mockRequireUser).toHaveBeenCalled();
			expect(handler).toHaveBeenCalledWith(
				{ message: "Hello", captchaToken: "token-123" },
				expect.objectContaining({ id: "user-123" }),
			);
		});
	});

	describe("Edge Cases", () => {
		it("should handle empty object input", async () => {
			mockRequireUser.mockResolvedValue({
				data: { id: "user-123" },
				error: null,
				redirectTo: null,
			});

			const handler = vi.fn().mockReturnValue({ success: true });

			const action = enhanceAction(handler, {
				auth: true,
			});

			const result = await action({});

			expect(result).toEqual({ success: true });
		});

		it("should handle null return from handler", async () => {
			mockRequireUser.mockResolvedValue({
				data: { id: "user-123" },
				error: null,
				redirectTo: null,
			});

			const handler = vi.fn().mockReturnValue(null);

			const action = enhanceAction(handler, {
				auth: true,
			});

			const result = await action({});

			expect(result).toBeNull();
		});

		it("should handle undefined return from handler", async () => {
			mockRequireUser.mockResolvedValue({
				data: { id: "user-123" },
				error: null,
				redirectTo: null,
			});

			const handler = vi.fn().mockReturnValue(undefined);

			const action = enhanceAction(handler, {
				auth: true,
			});

			const result = await action({});

			expect(result).toBeUndefined();
		});
	});
});
