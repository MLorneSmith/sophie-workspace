/**
 * Unit tests for createInvitationsPolicyEvaluator
 * Tests the invitation policy evaluator factory and its methods
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { createInvitationsPolicyEvaluator } from "./invitation-policies";

// Mock the @kit/policies module
vi.mock("@kit/policies", () => ({
	createPoliciesEvaluator: vi.fn(() => ({
		hasPoliciesForStage: vi.fn(),
		evaluate: vi.fn(),
	})),
}));

// Mock the policies module
vi.mock("./policies", () => ({
	invitationPolicyRegistry: {
		policies: [],
	},
}));

describe("createInvitationsPolicyEvaluator", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Factory Function", () => {
		it("should create an evaluator instance", () => {
			const evaluator = createInvitationsPolicyEvaluator();

			expect(evaluator).toBeDefined();
		});

		it("should return an object with hasPoliciesForStage method", () => {
			const evaluator = createInvitationsPolicyEvaluator();

			expect(typeof evaluator.hasPoliciesForStage).toBe("function");
		});

		it("should return an object with canInvite method", () => {
			const evaluator = createInvitationsPolicyEvaluator();

			expect(typeof evaluator.canInvite).toBe("function");
		});

		it("should return a new instance each time", () => {
			const evaluator1 = createInvitationsPolicyEvaluator();
			const evaluator2 = createInvitationsPolicyEvaluator();

			expect(evaluator1).not.toBe(evaluator2);
		});
	});

	describe("hasPoliciesForStage", () => {
		it("should call evaluator.hasPoliciesForStage with correct stage", async () => {
			const { createPoliciesEvaluator } = await import("@kit/policies");
			const mockHasPoliciesForStage = vi.fn().mockResolvedValue(true);
			vi.mocked(createPoliciesEvaluator).mockReturnValue({
				hasPoliciesForStage: mockHasPoliciesForStage,
				evaluate: vi.fn(),
			} as any);

			const evaluator = createInvitationsPolicyEvaluator();
			await evaluator.hasPoliciesForStage("preliminary");

			expect(mockHasPoliciesForStage).toHaveBeenCalled();
		});

		it("should return true when there are policies for preliminary stage", async () => {
			const { createPoliciesEvaluator } = await import("@kit/policies");
			vi.mocked(createPoliciesEvaluator).mockReturnValue({
				hasPoliciesForStage: vi.fn().mockResolvedValue(true),
				evaluate: vi.fn(),
			} as any);

			const evaluator = createInvitationsPolicyEvaluator();
			const result = await evaluator.hasPoliciesForStage("preliminary");

			expect(result).toBe(true);
		});

		it("should return true when there are policies for submission stage", async () => {
			const { createPoliciesEvaluator } = await import("@kit/policies");
			vi.mocked(createPoliciesEvaluator).mockReturnValue({
				hasPoliciesForStage: vi.fn().mockResolvedValue(true),
				evaluate: vi.fn(),
			} as any);

			const evaluator = createInvitationsPolicyEvaluator();
			const result = await evaluator.hasPoliciesForStage("submission");

			expect(result).toBe(true);
		});

		it("should return false when no policies for stage", async () => {
			const { createPoliciesEvaluator } = await import("@kit/policies");
			vi.mocked(createPoliciesEvaluator).mockReturnValue({
				hasPoliciesForStage: vi.fn().mockResolvedValue(false),
				evaluate: vi.fn(),
			} as any);

			const evaluator = createInvitationsPolicyEvaluator();
			const result = await evaluator.hasPoliciesForStage("preliminary");

			expect(result).toBe(false);
		});
	});

	describe("canInvite", () => {
		const mockContext = {
			timestamp: new Date().toISOString(),
			metadata: {
				accountSlug: "test-account",
				invitationCount: 1,
				invitingUserEmail: "inviter@example.com",
			},
			accountSlug: "test-account",
			accountId: "acc-123",
			subscription: {
				id: "sub-123",
				status: "active" as const,
				provider: "stripe" as const,
				active: true,
				items: [],
			},
			currentMemberCount: 2,
			invitations: [{ email: "invited@example.com", role: "member" }],
			invitingUser: {
				id: "user-123",
				email: "inviter@example.com",
			},
		};

		it("should call evaluate with context and preliminary stage", async () => {
			const { createPoliciesEvaluator } = await import("@kit/policies");
			const mockEvaluate = vi.fn().mockResolvedValue({ allowed: true });
			vi.mocked(createPoliciesEvaluator).mockReturnValue({
				hasPoliciesForStage: vi.fn(),
				evaluate: mockEvaluate,
			} as any);

			const evaluator = createInvitationsPolicyEvaluator();
			await evaluator.canInvite(mockContext, "preliminary");

			expect(mockEvaluate).toHaveBeenCalled();
		});

		it("should call evaluate with context and submission stage", async () => {
			const { createPoliciesEvaluator } = await import("@kit/policies");
			const mockEvaluate = vi.fn().mockResolvedValue({ allowed: true });
			vi.mocked(createPoliciesEvaluator).mockReturnValue({
				hasPoliciesForStage: vi.fn(),
				evaluate: mockEvaluate,
			} as any);

			const evaluator = createInvitationsPolicyEvaluator();
			await evaluator.canInvite(mockContext, "submission");

			expect(mockEvaluate).toHaveBeenCalled();
		});

		it("should return allow result when all policies pass", async () => {
			const { createPoliciesEvaluator } = await import("@kit/policies");
			vi.mocked(createPoliciesEvaluator).mockReturnValue({
				hasPoliciesForStage: vi.fn(),
				evaluate: vi.fn().mockResolvedValue({ allowed: true }),
			} as any);

			const evaluator = createInvitationsPolicyEvaluator();
			const result = await evaluator.canInvite(mockContext, "preliminary");

			expect(result.allowed).toBe(true);
		});

		it("should return deny result when a policy fails", async () => {
			const { createPoliciesEvaluator } = await import("@kit/policies");
			vi.mocked(createPoliciesEvaluator).mockReturnValue({
				hasPoliciesForStage: vi.fn(),
				evaluate: vi.fn().mockResolvedValue({
					allowed: false,
					code: "SUBSCRIPTION_REQUIRED",
					message: "teams:policyErrors.subscriptionRequired",
				}),
			} as any);

			const evaluator = createInvitationsPolicyEvaluator();
			const result = await evaluator.canInvite(mockContext, "submission");

			expect(result.allowed).toBe(false);
			expect((result as any).code).toBe("SUBSCRIPTION_REQUIRED");
		});
	});
});
