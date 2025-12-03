import type { Database } from "@kit/supabase/database";
import { getSupabaseServerAdminClient } from "@kit/supabase/server-admin-client";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Test billing gateway for E2E testing
 * This gateway simulates successful payments without actual Stripe interaction
 */
export class TestBillingGateway {
	constructor(private client: SupabaseClient<Database>) {}

	async retrieveCheckoutSession({ sessionId }: { sessionId: string }) {
		// Handle test sessions
		if (sessionId.startsWith("test_")) {
			// For test sessions, create a subscription if it doesn't exist
			await this.ensureTestSubscriptionExists(sessionId);

			return {
				status: "complete" as const,
				isSessionOpen: false,
				checkoutToken: null,
				customer: {
					email: "test@example.com",
				},
			};
		}

		// For non-test sessions, return null
		return null;
	}

	async createCheckoutSession(_params: any) {
		// Return a test checkout token
		return {
			checkoutToken: `test_checkout_${Date.now()}`,
			sessionId: `test_session_${Date.now()}`,
		};
	}

	async cancelSubscription(_params: any) {
		return { success: true };
	}

	async updateSubscriptionItem(_params: any) {
		return { success: true };
	}

	async createBillingPortalSession(_params: any) {
		return {
			url: "/test-billing-portal",
		};
	}

	async retrieveSubscription(_params: any) {
		return {
			id: "test_subscription",
			status: "active",
			currency: "usd",
			cancelAtPeriodEnd: false,
			interval: "month",
			intervalCount: 1,
			createdAt: new Date().toISOString(),
			periodStartsAt: new Date().toISOString(),
			periodEndsAt: new Date(
				Date.now() + 30 * 24 * 60 * 60 * 1000,
			).toISOString(),
			trialStartsAt: null,
			trialEndsAt: null,
			lineItems: [],
		};
	}

	async getProduct(_params: any) {
		return {
			id: "test_product",
			name: "Test Product",
			description: "Test product description",
			active: true,
			image: null,
			marketing_features: [],
		};
	}

	async getPlanById(planId: string) {
		return {
			id: planId,
			name: `Test Plan ${planId}`,
			description: `Test plan for ${planId}`,
			amount: 999,
			interval: "month" as const,
			type: "subscription" as const,
		};
	}

	private async ensureTestSubscriptionExists(sessionId: string) {
		try {
			// Extract account information from the session
			// For test sessions, we'll need to find the account that initiated the checkout
			// Since we can't easily get this from the session ID alone, we'll look for
			// the most recently created account that doesn't have a subscription
			const { data: accounts } = await this.client
				.from("accounts")
				.select("id, name")
				.order("created_at", { ascending: false })
				.limit(5);

			if (!accounts || accounts.length === 0) {
				return;
			}

			// Check which accounts don't have subscriptions and pick the most recent team account
			for (const account of accounts) {
				const { data: existingSubscription } = await this.client
					.from("subscriptions")
					.select("id")
					.eq("account_id", account.id)
					.single();

				// If no subscription exists and it's a team account, create one
				if (!existingSubscription && account.name?.startsWith("Team-Name-")) {
					await this.createTestSubscription(account.id, sessionId);
					break;
				}
			}
		} catch (error) {
			// Silent fail for test scenarios
			console.warn("Failed to create test subscription:", error);
		}
	}

	private async createTestSubscription(accountId: string, sessionId: string) {
		try {
			// Use admin client for operations requiring service_role permissions
			const adminClient = getSupabaseServerAdminClient<Database>();

			// First create or get billing customer
			const customerId = `test_customer_${accountId}`;
			const { data: billingCustomer } = await adminClient
				.from("billing_customers")
				.upsert(
					{
						account_id: accountId,
						provider: "stripe",
						customer_id: customerId,
					},
					{
						onConflict: "account_id, provider, customer_id",
					},
				)
				.select("id")
				.single();

			if (!billingCustomer) {
				console.error("Failed to create billing customer");
				return;
			}

			// Create subscription directly in the database
			const subscriptionId = `test_sub_${sessionId}`;
			const { data: subscription, error } = await adminClient
				.from("subscriptions")
				.upsert(
					{
						id: subscriptionId,
						account_id: accountId,
						billing_customer_id: billingCustomer.id,
						status: "active",
						active: true,
						billing_provider: "stripe",
						cancel_at_period_end: false,
						currency: "usd",
						period_starts_at: new Date().toISOString(),
						period_ends_at: new Date(
							Date.now() + 30 * 24 * 60 * 60 * 1000,
						).toISOString(),
						trial_starts_at: null,
						trial_ends_at: null,
					},
					{
						onConflict: "id",
					},
				)
				.select()
				.single();

			if (error) {
				console.error("Failed to create subscription:", error);
			} else {
				console.log("Test subscription created successfully:", subscription);

				// Create subscription item
				await adminClient.from("subscription_items").upsert(
					{
						id: "test_line_item_1",
						subscription_id: subscriptionId,
						product_id: "starter",
						variant_id: "price_1SaNS32RkIMsD46QcyA0Y9oJ",
						type: "flat",
						price_amount: 999,
						quantity: 1,
						interval: "month",
						interval_count: 1,
					},
					{
						onConflict: "id",
					},
				);
			}
		} catch (error) {
			console.error("Exception creating test subscription:", error);
		}
	}
}
