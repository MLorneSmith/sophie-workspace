/**
 * Unit tests for Team Account Invitation Policies
 * Tests the core policy evaluation logic for subscription and billing constraints
 */

import { describe, expect, it } from "vitest";
import type { FeaturePolicyInvitationContext } from "./feature-policy-invitation-context";
import {
	invitationPolicyRegistry,
	paddleBillingInvitationsPolicy,
	subscriptionRequiredInvitationsPolicy,
} from "./policies";

// Helper to create a mock invitation context
function createMockContext(
	overrides: Partial<FeaturePolicyInvitationContext> = {},
): FeaturePolicyInvitationContext {
	return {
		timestamp: new Date().toISOString(),
		metadata: {
			accountSlug: "test-account",
			invitationCount: 1,
			invitingUserEmail: "inviter@example.com",
		},
		accountSlug: "test-account",
		accountId: "acc-123",
		currentMemberCount: 2,
		invitations: [{ email: "invited@example.com", role: "member" }],
		invitingUser: {
			id: "user-123",
			email: "inviter@example.com",
		},
		...overrides,
	};
}

// Helper to create subscription data
function createMockSubscription(
	overrides: Partial<
		NonNullable<FeaturePolicyInvitationContext["subscription"]>
	> = {},
): NonNullable<FeaturePolicyInvitationContext["subscription"]> {
	return {
		id: "sub-123",
		status: "active",
		provider: "stripe",
		active: true,
		items: [],
		...overrides,
	};
}

// Helper to evaluate a policy with context
async function evaluatePolicy(
	policy: typeof subscriptionRequiredInvitationsPolicy,
	context: FeaturePolicyInvitationContext,
) {
	return policy.create(context).evaluate();
}

describe("subscriptionRequiredInvitationsPolicy", () => {
	describe("Policy Definition", () => {
		it("should have correct policy ID", () => {
			expect(subscriptionRequiredInvitationsPolicy.id).toBe(
				"subscription-required",
			);
		});

		it("should be configured for preliminary and submission stages", () => {
			expect(subscriptionRequiredInvitationsPolicy.stages).toContain(
				"preliminary",
			);
			expect(subscriptionRequiredInvitationsPolicy.stages).toContain(
				"submission",
			);
		});

		it("should have a create method", () => {
			expect(typeof subscriptionRequiredInvitationsPolicy.create).toBe(
				"function",
			);
		});
	});

	describe("Allow Cases", () => {
		it("should allow when subscription exists and is active", async () => {
			const context = createMockContext({
				subscription: createMockSubscription({ active: true }),
			});

			const result = await evaluatePolicy(
				subscriptionRequiredInvitationsPolicy,
				context,
			);

			expect(result.allowed).toBe(true);
		});

		it("should allow with trialing subscription that is active", async () => {
			const context = createMockContext({
				subscription: createMockSubscription({
					status: "trialing",
					active: true,
				}),
			});

			const result = await evaluatePolicy(
				subscriptionRequiredInvitationsPolicy,
				context,
			);

			expect(result.allowed).toBe(true);
		});

		it("should allow with active subscription regardless of provider", async () => {
			const providers = ["stripe", "paddle", "lemon-squeezy"] as const;

			for (const provider of providers) {
				const context = createMockContext({
					subscription: createMockSubscription({
						provider,
						active: true,
					}),
				});

				const result = await evaluatePolicy(
					subscriptionRequiredInvitationsPolicy,
					context,
				);

				expect(result.allowed).toBe(true);
			}
		});
	});

	describe("Deny Cases", () => {
		it("should deny when no subscription exists", async () => {
			const context = createMockContext({
				subscription: undefined,
			});

			const result = await evaluatePolicy(
				subscriptionRequiredInvitationsPolicy,
				context,
			);

			expect(result.allowed).toBe(false);
			expect(result.metadata?.code).toBe("SUBSCRIPTION_REQUIRED");
			expect(result.reason).toBe("teams:policyErrors.subscriptionRequired");
			expect(result.metadata?.remediation).toBe(
				"teams:policyRemediation.subscriptionRequired",
			);
		});

		it("should deny when subscription is inactive", async () => {
			const context = createMockContext({
				subscription: createMockSubscription({ active: false }),
			});

			const result = await evaluatePolicy(
				subscriptionRequiredInvitationsPolicy,
				context,
			);

			expect(result.allowed).toBe(false);
			expect(result.metadata?.code).toBe("SUBSCRIPTION_REQUIRED");
		});

		it("should deny when subscription status is canceled but active is false", async () => {
			const context = createMockContext({
				subscription: createMockSubscription({
					status: "canceled",
					active: false,
				}),
			});

			const result = await evaluatePolicy(
				subscriptionRequiredInvitationsPolicy,
				context,
			);

			expect(result.allowed).toBe(false);
			expect(result.metadata?.code).toBe("SUBSCRIPTION_REQUIRED");
		});

		it("should deny when subscription status is past_due and active is false", async () => {
			const context = createMockContext({
				subscription: createMockSubscription({
					status: "past_due",
					active: false,
				}),
			});

			const result = await evaluatePolicy(
				subscriptionRequiredInvitationsPolicy,
				context,
			);

			expect(result.allowed).toBe(false);
		});
	});

	describe("Edge Cases", () => {
		it("should handle context with multiple invitations", async () => {
			const context = createMockContext({
				subscription: createMockSubscription({ active: true }),
				invitations: [
					{ email: "user1@example.com", role: "member" },
					{ email: "user2@example.com", role: "admin" },
					{ email: "user3@example.com", role: "member" },
				],
			});

			const result = await evaluatePolicy(
				subscriptionRequiredInvitationsPolicy,
				context,
			);

			expect(result.allowed).toBe(true);
		});

		it("should handle subscription with empty items array", async () => {
			const context = createMockContext({
				subscription: createMockSubscription({
					active: true,
					items: [],
				}),
			});

			const result = await evaluatePolicy(
				subscriptionRequiredInvitationsPolicy,
				context,
			);

			expect(result.allowed).toBe(true);
		});
	});
});

describe("paddleBillingInvitationsPolicy", () => {
	describe("Policy Definition", () => {
		it("should have correct policy ID", () => {
			expect(paddleBillingInvitationsPolicy.id).toBe("paddle-billing");
		});

		it("should be configured for preliminary and submission stages", () => {
			expect(paddleBillingInvitationsPolicy.stages).toContain("preliminary");
			expect(paddleBillingInvitationsPolicy.stages).toContain("submission");
		});

		it("should have a create method", () => {
			expect(typeof paddleBillingInvitationsPolicy.create).toBe("function");
		});
	});

	describe("Allow Cases", () => {
		it("should allow when no subscription exists", async () => {
			const context = createMockContext({
				subscription: undefined,
			});

			const result = await evaluatePolicy(
				paddleBillingInvitationsPolicy,
				context,
			);

			expect(result.allowed).toBe(true);
		});

		it("should allow when subscription is not Paddle provider", async () => {
			const context = createMockContext({
				subscription: createMockSubscription({
					provider: "stripe",
					status: "trialing",
					items: [
						{
							id: "item-1",
							type: "per_seat",
							quantity: 1,
							product_id: "prod-1",
							variant_id: "var-1",
						},
					],
				}),
			});

			const result = await evaluatePolicy(
				paddleBillingInvitationsPolicy,
				context,
			);

			expect(result.allowed).toBe(true);
		});

		it("should allow when Paddle subscription is not trialing", async () => {
			const context = createMockContext({
				subscription: createMockSubscription({
					provider: "paddle",
					status: "active",
					items: [
						{
							id: "item-1",
							type: "per_seat",
							quantity: 1,
							product_id: "prod-1",
							variant_id: "var-1",
						},
					],
				}),
			});

			const result = await evaluatePolicy(
				paddleBillingInvitationsPolicy,
				context,
			);

			expect(result.allowed).toBe(true);
		});

		it("should allow when Paddle trialing but no per_seat items", async () => {
			const context = createMockContext({
				subscription: createMockSubscription({
					provider: "paddle",
					status: "trialing",
					items: [
						{
							id: "item-1",
							type: "flat",
							quantity: 1,
							product_id: "prod-1",
							variant_id: "var-1",
						},
					],
				}),
			});

			const result = await evaluatePolicy(
				paddleBillingInvitationsPolicy,
				context,
			);

			expect(result.allowed).toBe(true);
		});

		it("should allow when Paddle trialing with empty items array", async () => {
			const context = createMockContext({
				subscription: createMockSubscription({
					provider: "paddle",
					status: "trialing",
					items: [],
				}),
			});

			const result = await evaluatePolicy(
				paddleBillingInvitationsPolicy,
				context,
			);

			expect(result.allowed).toBe(true);
		});

		it("should allow when lemon-squeezy provider with per_seat items trialing", async () => {
			const context = createMockContext({
				subscription: createMockSubscription({
					provider: "lemon-squeezy",
					status: "trialing",
					items: [
						{
							id: "item-1",
							type: "per_seat",
							quantity: 1,
							product_id: "prod-1",
							variant_id: "var-1",
						},
					],
				}),
			});

			const result = await evaluatePolicy(
				paddleBillingInvitationsPolicy,
				context,
			);

			expect(result.allowed).toBe(true);
		});
	});

	describe("Deny Cases", () => {
		it("should deny when Paddle trialing with per_seat items", async () => {
			const context = createMockContext({
				subscription: createMockSubscription({
					provider: "paddle",
					status: "trialing",
					items: [
						{
							id: "item-1",
							type: "per_seat",
							quantity: 1,
							product_id: "prod-1",
							variant_id: "var-1",
						},
					],
				}),
			});

			const result = await evaluatePolicy(
				paddleBillingInvitationsPolicy,
				context,
			);

			expect(result.allowed).toBe(false);
			expect(result.metadata?.code).toBe("PADDLE_TRIAL_RESTRICTION");
			expect(result.reason).toBe("teams:policyErrors.paddleTrialRestriction");
			expect(result.metadata?.remediation).toBe(
				"teams:policyRemediation.paddleTrialRestriction",
			);
		});

		it("should deny when Paddle trialing with multiple items including per_seat", async () => {
			const context = createMockContext({
				subscription: createMockSubscription({
					provider: "paddle",
					status: "trialing",
					items: [
						{
							id: "item-1",
							type: "flat",
							quantity: 1,
							product_id: "prod-1",
							variant_id: "var-1",
						},
						{
							id: "item-2",
							type: "per_seat",
							quantity: 2,
							product_id: "prod-2",
							variant_id: "var-2",
						},
					],
				}),
			});

			const result = await evaluatePolicy(
				paddleBillingInvitationsPolicy,
				context,
			);

			expect(result.allowed).toBe(false);
			expect(result.metadata?.code).toBe("PADDLE_TRIAL_RESTRICTION");
		});
	});

	describe("Edge Cases", () => {
		it("should handle subscription with metered items", async () => {
			const context = createMockContext({
				subscription: createMockSubscription({
					provider: "paddle",
					status: "trialing",
					items: [
						{
							id: "item-1",
							type: "metered",
							quantity: 0,
							product_id: "prod-1",
							variant_id: "var-1",
						},
					],
				}),
			});

			const result = await evaluatePolicy(
				paddleBillingInvitationsPolicy,
				context,
			);

			expect(result.allowed).toBe(true);
		});

		it("should handle mixed flat and metered items without per_seat", async () => {
			const context = createMockContext({
				subscription: createMockSubscription({
					provider: "paddle",
					status: "trialing",
					items: [
						{
							id: "item-1",
							type: "flat",
							quantity: 1,
							product_id: "prod-1",
							variant_id: "var-1",
						},
						{
							id: "item-2",
							type: "metered",
							quantity: 100,
							product_id: "prod-2",
							variant_id: "var-2",
						},
					],
				}),
			});

			const result = await evaluatePolicy(
				paddleBillingInvitationsPolicy,
				context,
			);

			expect(result.allowed).toBe(true);
		});
	});
});

describe("invitationPolicyRegistry", () => {
	it("should be defined", () => {
		expect(invitationPolicyRegistry).toBeDefined();
	});

	it("should be a valid policy registry object", () => {
		expect(typeof invitationPolicyRegistry).toBe("object");
	});
});
