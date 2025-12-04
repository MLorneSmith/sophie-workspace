import { expect, test } from "@playwright/test";

import { UserBillingPageObject } from "./user-billing.po";

test.describe("User Billing @billing @integration", () => {
	test("user can subscribe to a plan", async ({ page }) => {
		const po = new UserBillingPageObject(page);

		// Add debugging to track navigation issues
		console.log("Starting billing test, current URL:", page.url());

		// Try a two-step navigation approach - first to home, then to billing
		console.log("Navigating to /home first...");
		await page.goto("/home", { waitUntil: "domcontentloaded", timeout: 15000 });
		console.log("At /home, URL:", page.url());

		// Now navigate to billing
		console.log("Navigating to /home/billing...");
		await page.goto("/home/billing", {
			waitUntil: "networkidle", // Wait for full page load including API calls
			timeout: 30000,
		});
		console.log("At /home/billing, URL:", page.url());

		// Check if user already has an active subscription (test idempotency)
		// This handles cases where the test ran previously and the subscription persists
		const hasExistingSubscription = await po.billing.hasActiveSubscription();

		if (hasExistingSubscription) {
			console.log(
				"User already has an active subscription - verifying existing state",
			);
			// Verify the existing subscription is active
			await expect(po.billing.getStatus()).toContainText("Active", {
				timeout: 5000,
			});
			await expect(po.billing.manageBillingButton()).toBeVisible();
			console.log("Existing subscription verified successfully");
			return; // Test passes - subscription already exists
		}

		// No existing subscription - proceed with checkout flow
		console.log("No existing subscription found - proceeding with checkout");
		await po.billing.selectPlan(0);
		await po.billing.proceedToCheckout();

		await po.billing.stripe.waitForForm();
		await po.billing.stripe.fillForm();
		await po.billing.stripe.submitForm();

		await expect(po.billing.successStatus()).toBeVisible({
			timeout: 25_000,
		});

		await po.billing.returnToBilling();

		// Wait for subscription status to update after webhook processing
		// Stripe webhook events (checkout.session.completed, customer.subscription.created)
		// are forwarded by stripe-webhook container and processed by the billing webhook handler.
		// This can take 2-10 seconds depending on Stripe's event delivery timing.
		await expect(async () => {
			// Reload to get fresh subscription status from the database
			await page.reload({ waitUntil: "domcontentloaded" });
			await expect(po.billing.getStatus()).toContainText("Active", {
				timeout: 5000,
			});
		}).toPass({
			// Use exponential backoff intervals: 2s, 4s, 6s, 8s, 10s
			intervals: [2000, 4000, 6000, 8000, 10000],
			timeout: 45_000, // Total timeout: 45 seconds for webhook delivery + processing
		});

		await expect(po.billing.manageBillingButton()).toBeVisible();
	});
});
