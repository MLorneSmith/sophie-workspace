/**
 * Unit tests for enhanceRouteHandler
 * Tests the route handler wrapper for validation, auth, and captcha checks
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

// Set up mocks before imports - mocks must be defined inline
vi.mock("@kit/supabase/require-user", () => ({
	requireUser: vi.fn(),
}));

vi.mock("@kit/supabase/server-client", () => ({
	getSupabaseServerClient: vi.fn(() => ({
		auth: {
			getUser: vi.fn(),
		},
	})),
}));

vi.mock("@kit/auth/captcha/server", () => ({
	verifyCaptchaToken: vi.fn(),
}));

vi.mock("next/navigation", () => ({
	redirect: vi.fn((url: string) => {
		// Return a Response-like object for route handler context
		return new Response(null, {
			status: 302,
			headers: { Location: url },
		});
	}),
}));

// Import the mocked modules
import { verifyCaptchaToken } from "@kit/auth/captcha/server";
import { requireUser } from "@kit/supabase/require-user";
import { redirect } from "next/navigation";

// Import after mocks are set up
import { enhanceRouteHandler } from "./index";

// Type the mocks
const mockRequireUser = requireUser as ReturnType<typeof vi.fn>;
const mockVerifyCaptchaToken = verifyCaptchaToken as ReturnType<typeof vi.fn>;
const mockRedirect = redirect as unknown as ReturnType<typeof vi.fn>;

// Helper to create mock NextRequest
function createMockRequest(
	options: {
		method?: string;
		body?: unknown;
		headers?: Record<string, string>;
		url?: string;
	} = {},
): Request {
	const {
		method = "POST",
		body,
		headers = {},
		url = "http://localhost:3000/api/test",
	} = options;

	const requestInit: RequestInit = {
		method,
		headers: {
			"content-type": "application/json",
			...headers,
		},
	};

	if (body !== undefined) {
		requestInit.body = JSON.stringify(body);
	}

	return new Request(url, requestInit);
}

// Helper to create route params
function createRouteParams(params: Record<string, string> = {}): {
	params: Promise<Record<string, string>>;
} {
	return {
		params: Promise.resolve(params),
	};
}

describe("enhanceRouteHandler", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Basic Handler Execution", () => {
		it("should call handler and return response", async () => {
			mockRequireUser.mockResolvedValue({
				data: { id: "user-123" },
				error: null,
				redirectTo: null,
			});

			const handler = vi.fn().mockReturnValue(
				new Response(JSON.stringify({ success: true }), {
					status: 200,
					headers: { "content-type": "application/json" },
				}),
			);

			const routeHandler = enhanceRouteHandler(handler, {
				auth: true,
			});

			const request = createMockRequest({ body: {} });
			const response = await routeHandler(
				request as unknown as Parameters<typeof routeHandler>[0],
				createRouteParams(),
			);

			expect(handler).toHaveBeenCalled();
			expect(response).toBeInstanceOf(Response);
			expect(response.status).toBe(200);
		});

		it("should pass request object to handler", async () => {
			mockRequireUser.mockResolvedValue({
				data: { id: "user-123" },
				error: null,
				redirectTo: null,
			});

			const handler = vi.fn().mockReturnValue(new Response("OK"));

			const routeHandler = enhanceRouteHandler(handler, {
				auth: true,
			});

			const request = createMockRequest({
				url: "http://localhost:3000/api/test?query=value",
			});
			await routeHandler(
				request as unknown as Parameters<typeof routeHandler>[0],
				createRouteParams(),
			);

			expect(handler).toHaveBeenCalledWith(
				expect.objectContaining({
					request: expect.any(Object),
				}),
			);
		});

		it("should pass route params to handler", async () => {
			mockRequireUser.mockResolvedValue({
				data: { id: "user-123" },
				error: null,
				redirectTo: null,
			});

			const handler = vi.fn().mockReturnValue(new Response("OK"));

			const routeHandler = enhanceRouteHandler(handler, {
				auth: true,
			});

			const request = createMockRequest();
			await routeHandler(
				request as unknown as Parameters<typeof routeHandler>[0],
				createRouteParams({ id: "123", slug: "test-slug" }),
			);

			expect(handler).toHaveBeenCalledWith(
				expect.objectContaining({
					params: { id: "123", slug: "test-slug" },
				}),
			);
		});
	});

	describe("Schema Validation", () => {
		it("should validate body when schema is provided", async () => {
			mockRequireUser.mockResolvedValue({
				data: { id: "user-123" },
				error: null,
				redirectTo: null,
			});

			const schema = z.object({
				name: z.string(),
				email: z.string().email(),
			});

			const handler = vi.fn().mockReturnValue(new Response("OK"));

			const routeHandler = enhanceRouteHandler(handler, {
				auth: true,
				schema,
			});

			const request = createMockRequest({
				body: { name: "John", email: "john@example.com" },
			});
			await routeHandler(
				request as unknown as Parameters<typeof routeHandler>[0],
				createRouteParams(),
			);

			expect(handler).toHaveBeenCalledWith(
				expect.objectContaining({
					body: { name: "John", email: "john@example.com" },
				}),
			);
		});

		it("should throw error when body validation fails", async () => {
			mockRequireUser.mockResolvedValue({
				data: { id: "user-123" },
				error: null,
				redirectTo: null,
			});

			const schema = z.object({
				name: z.string(),
				email: z.string().email(),
			});

			const handler = vi.fn();

			const routeHandler = enhanceRouteHandler(handler, {
				auth: true,
				schema,
			});

			const request = createMockRequest({
				body: { name: "John", email: "invalid-email" },
			});

			await expect(
				routeHandler(
					request as unknown as Parameters<typeof routeHandler>[0],
					createRouteParams(),
				),
			).rejects.toThrow("Invalid data:");

			expect(handler).not.toHaveBeenCalled();
		});

		it("should pass undefined body when no schema is provided", async () => {
			mockRequireUser.mockResolvedValue({
				data: { id: "user-123" },
				error: null,
				redirectTo: null,
			});

			const handler = vi.fn().mockReturnValue(new Response("OK"));

			const routeHandler = enhanceRouteHandler(handler, {
				auth: true,
			});

			const request = createMockRequest();
			await routeHandler(
				request as unknown as Parameters<typeof routeHandler>[0],
				createRouteParams(),
			);

			expect(handler).toHaveBeenCalledWith(
				expect.objectContaining({
					body: undefined,
				}),
			);
		});
	});

	describe("Authentication", () => {
		it("should enforce authentication by default", async () => {
			mockRequireUser.mockResolvedValue({
				data: { id: "user-123", email: "user@test.com" },
				error: null,
				redirectTo: null,
			});

			const handler = vi.fn().mockReturnValue(new Response("OK"));

			const routeHandler = enhanceRouteHandler(handler, {});

			const request = createMockRequest();
			await routeHandler(
				request as unknown as Parameters<typeof routeHandler>[0],
				createRouteParams(),
			);

			expect(mockRequireUser).toHaveBeenCalled();
			expect(handler).toHaveBeenCalledWith(
				expect.objectContaining({
					user: expect.objectContaining({ id: "user-123" }),
				}),
			);
		});

		it("should redirect when user is not authenticated", async () => {
			mockRequireUser.mockResolvedValue({
				data: null,
				error: { message: "Not authenticated" },
				redirectTo: "/auth/login",
			});

			const handler = vi.fn();

			const routeHandler = enhanceRouteHandler(handler, {
				auth: true,
			});

			const request = createMockRequest();
			const response = await routeHandler(
				request as unknown as Parameters<typeof routeHandler>[0],
				createRouteParams(),
			);

			expect(mockRedirect).toHaveBeenCalledWith("/auth/login");
			expect(handler).not.toHaveBeenCalled();
			// redirect returns a Response
			expect(response).toBeInstanceOf(Response);
		});

		it("should skip authentication when auth: false", async () => {
			const handler = vi.fn().mockReturnValue(new Response("OK"));

			const routeHandler = enhanceRouteHandler(handler, {
				auth: false,
			});

			const request = createMockRequest();
			await routeHandler(
				request as unknown as Parameters<typeof routeHandler>[0],
				createRouteParams(),
			);

			expect(mockRequireUser).not.toHaveBeenCalled();
			expect(handler).toHaveBeenCalledWith(
				expect.objectContaining({
					user: undefined,
				}),
			);
		});

		it("should pass user data to handler when authenticated", async () => {
			const userData = {
				id: "user-789",
				email: "authenticated@test.com",
				aal: "aal2",
			};

			mockRequireUser.mockResolvedValue({
				data: userData,
				error: null,
				redirectTo: null,
			});

			const handler = vi.fn().mockReturnValue(new Response("OK"));

			const routeHandler = enhanceRouteHandler(handler, {
				auth: true,
			});

			const request = createMockRequest();
			await routeHandler(
				request as unknown as Parameters<typeof routeHandler>[0],
				createRouteParams(),
			);

			expect(handler).toHaveBeenCalledWith(
				expect.objectContaining({
					user: userData,
				}),
			);
		});
	});

	describe("Captcha Verification", () => {
		it("should skip captcha by default", async () => {
			mockRequireUser.mockResolvedValue({
				data: { id: "user-123" },
				error: null,
				redirectTo: null,
			});

			const handler = vi.fn().mockReturnValue(new Response("OK"));

			const routeHandler = enhanceRouteHandler(handler, {
				auth: true,
			});

			const request = createMockRequest();
			await routeHandler(
				request as unknown as Parameters<typeof routeHandler>[0],
				createRouteParams(),
			);

			expect(mockVerifyCaptchaToken).not.toHaveBeenCalled();
		});

		it("should verify captcha from x-captcha-token header when enabled", async () => {
			mockRequireUser.mockResolvedValue({
				data: { id: "user-123" },
				error: null,
				redirectTo: null,
			});
			mockVerifyCaptchaToken.mockResolvedValue(true);

			const handler = vi.fn().mockReturnValue(new Response("OK"));

			const routeHandler = enhanceRouteHandler(handler, {
				auth: true,
				captcha: true,
			});

			const request = createMockRequest({
				headers: { "x-captcha-token": "valid-token-123" },
			});
			await routeHandler(
				request as unknown as Parameters<typeof routeHandler>[0],
				createRouteParams(),
			);

			expect(mockVerifyCaptchaToken).toHaveBeenCalledWith("valid-token-123");
		});

		it("should return 400 when captcha is required but token is missing", async () => {
			const handler = vi.fn();

			const routeHandler = enhanceRouteHandler(handler, {
				auth: false,
				captcha: true,
			});

			const request = createMockRequest(); // No x-captcha-token header
			const response = await routeHandler(
				request as unknown as Parameters<typeof routeHandler>[0],
				createRouteParams(),
			);

			expect(response.status).toBe(400);
			const text = await response.text();
			expect(text).toBe("Captcha token is required");
			expect(handler).not.toHaveBeenCalled();
		});

		it("should throw error when captcha verification fails", async () => {
			mockVerifyCaptchaToken.mockRejectedValue(
				new Error("Invalid captcha token"),
			);

			const handler = vi.fn();

			const routeHandler = enhanceRouteHandler(handler, {
				auth: false,
				captcha: true,
			});

			const request = createMockRequest({
				headers: { "x-captcha-token": "invalid-token" },
			});

			await expect(
				routeHandler(
					request as unknown as Parameters<typeof routeHandler>[0],
					createRouteParams(),
				),
			).rejects.toThrow("Invalid captcha token");

			expect(handler).not.toHaveBeenCalled();
		});
	});

	describe("HTTP Methods", () => {
		it("should handle GET requests", async () => {
			mockRequireUser.mockResolvedValue({
				data: { id: "user-123" },
				error: null,
				redirectTo: null,
			});

			const handler = vi.fn().mockReturnValue(new Response("GET response"));

			const routeHandler = enhanceRouteHandler(handler, {
				auth: true,
			});

			const request = createMockRequest({ method: "GET" });
			const response = await routeHandler(
				request as unknown as Parameters<typeof routeHandler>[0],
				createRouteParams(),
			);

			expect(response).toBeInstanceOf(Response);
			const text = await response.text();
			expect(text).toBe("GET response");
		});

		it("should handle POST requests with body", async () => {
			mockRequireUser.mockResolvedValue({
				data: { id: "user-123" },
				error: null,
				redirectTo: null,
			});

			const schema = z.object({
				data: z.string(),
			});

			const handler = vi.fn().mockReturnValue(new Response("POST response"));

			const routeHandler = enhanceRouteHandler(handler, {
				auth: true,
				schema,
			});

			const request = createMockRequest({
				method: "POST",
				body: { data: "test-data" },
			});
			await routeHandler(
				request as unknown as Parameters<typeof routeHandler>[0],
				createRouteParams(),
			);

			expect(handler).toHaveBeenCalledWith(
				expect.objectContaining({
					body: { data: "test-data" },
				}),
			);
		});

		it("should handle PUT requests", async () => {
			mockRequireUser.mockResolvedValue({
				data: { id: "user-123" },
				error: null,
				redirectTo: null,
			});

			const schema = z.object({
				id: z.string(),
				name: z.string(),
			});

			const handler = vi.fn().mockReturnValue(new Response("PUT response"));

			const routeHandler = enhanceRouteHandler(handler, {
				auth: true,
				schema,
			});

			const request = createMockRequest({
				method: "PUT",
				body: { id: "123", name: "Updated" },
			});
			await routeHandler(
				request as unknown as Parameters<typeof routeHandler>[0],
				createRouteParams(),
			);

			expect(handler).toHaveBeenCalledWith(
				expect.objectContaining({
					body: { id: "123", name: "Updated" },
				}),
			);
		});

		it("should handle DELETE requests", async () => {
			mockRequireUser.mockResolvedValue({
				data: { id: "user-123" },
				error: null,
				redirectTo: null,
			});

			const handler = vi.fn().mockReturnValue(new Response("DELETE response"));

			const routeHandler = enhanceRouteHandler(handler, {
				auth: true,
			});

			const request = createMockRequest({ method: "DELETE" });
			const response = await routeHandler(
				request as unknown as Parameters<typeof routeHandler>[0],
				createRouteParams(),
			);

			const text = await response.text();
			expect(text).toBe("DELETE response");
		});
	});

	describe("Async Handlers", () => {
		it("should handle async handler functions", async () => {
			mockRequireUser.mockResolvedValue({
				data: { id: "user-123" },
				error: null,
				redirectTo: null,
			});

			const handler = vi.fn().mockImplementation(async () => {
				await new Promise((resolve) => setTimeout(resolve, 10));
				return new Response(JSON.stringify({ delayed: true }));
			});

			const routeHandler = enhanceRouteHandler(handler, {
				auth: true,
			});

			const request = createMockRequest();
			const response = await routeHandler(
				request as unknown as Parameters<typeof routeHandler>[0],
				createRouteParams(),
			);

			expect(response).toBeInstanceOf(Response);
			const json = await response.json();
			expect(json).toEqual({ delayed: true });
		});
	});

	describe("Combined Scenarios", () => {
		it("should handle schema + auth + captcha together", async () => {
			mockRequireUser.mockResolvedValue({
				data: { id: "user-123" },
				error: null,
				redirectTo: null,
			});
			mockVerifyCaptchaToken.mockResolvedValue(true);

			const schema = z.object({
				message: z.string().min(1),
			});

			const handler = vi
				.fn()
				.mockReturnValue(new Response(JSON.stringify({ success: true })));

			const routeHandler = enhanceRouteHandler(handler, {
				auth: true,
				captcha: true,
				schema,
			});

			const request = createMockRequest({
				body: { message: "Hello" },
				headers: { "x-captcha-token": "token-123" },
			});
			await routeHandler(
				request as unknown as Parameters<typeof routeHandler>[0],
				createRouteParams(),
			);

			expect(mockVerifyCaptchaToken).toHaveBeenCalledWith("token-123");
			expect(mockRequireUser).toHaveBeenCalled();
			expect(handler).toHaveBeenCalledWith(
				expect.objectContaining({
					body: { message: "Hello" },
					user: expect.objectContaining({ id: "user-123" }),
				}),
			);
		});
	});

	describe("Edge Cases", () => {
		it("should handle empty route params", async () => {
			mockRequireUser.mockResolvedValue({
				data: { id: "user-123" },
				error: null,
				redirectTo: null,
			});

			const handler = vi.fn().mockReturnValue(new Response("OK"));

			const routeHandler = enhanceRouteHandler(handler, {
				auth: true,
			});

			const request = createMockRequest();
			await routeHandler(
				request as unknown as Parameters<typeof routeHandler>[0],
				createRouteParams({}),
			);

			expect(handler).toHaveBeenCalledWith(
				expect.objectContaining({
					params: {},
				}),
			);
		});

		it("should handle handler returning different response types", async () => {
			mockRequireUser.mockResolvedValue({
				data: { id: "user-123" },
				error: null,
				redirectTo: null,
			});

			// Return a plain Response (not NextResponse)
			const handler = vi.fn().mockReturnValue(
				new Response("Plain response", {
					status: 201,
					headers: { "x-custom": "header" },
				}),
			);

			const routeHandler = enhanceRouteHandler(handler, {
				auth: true,
			});

			const request = createMockRequest();
			const response = await routeHandler(
				request as unknown as Parameters<typeof routeHandler>[0],
				createRouteParams(),
			);

			expect(response.status).toBe(201);
			expect(response.headers.get("x-custom")).toBe("header");
		});
	});
});
