import { expect, type Page } from "@playwright/test";

import { StripePageObject } from "./stripe.po";

export class BillingPageObject {
	public readonly stripe: StripePageObject;

	constructor(private readonly page: Page) {
		this.stripe = new StripePageObject(page);
	}

	plans() {
		return this.page.locator("[data-test-plan]");
	}

	async selectPlan(index = 0) {
		await expect(async () => {
			const plans = this.plans();
			const plan = plans.nth(index);

			// Wait for the plan element to be visible with proper timeout
			await expect(plan).toBeVisible({ timeout: 15000 });

			await this.page.waitForTimeout(500);

			await plan.click();
		}).toPass({
			intervals: [500, 1000, 2000, 5000],
			timeout: 20000,
		});
	}

	manageBillingButton() {
		// Primary: data-testid, Fallback: button with "Visit Billing Portal" text
		return this.page
			.locator('[data-testid="manage-billing-redirect-button"]')
			.or(this.page.getByRole("button", { name: "Visit Billing Portal" }));
	}

	successStatus() {
		return this.page.locator('[data-testid="payment-return-success"]');
	}

	async returnToBilling() {
		// wait a bit for the webhook to be processed
		await this.page.waitForTimeout(1000);

		return this.page
			.locator('[data-testid="checkout-success-back-link"]')
			.click();
	}

	proceedToCheckout() {
		return this.page.click('[data-testid="checkout-submit-button"]');
	}

	getStatus() {
		// Primary: use data-testid
		// Fallback: find the status badge by looking for text within the plan card
		// The badge is near the "Starter" product name in "Your Plan" section
		const primaryLocator = this.page.locator(
			'[data-testid="current-plan-card-status-badge"]',
		);
		const fallbackLocator = this.page
			.locator('h3:has-text("Your Plan")')
			.locator("..")
			.locator("..")
			.getByText(/^(Active|Trialing|Past Due|Canceled|Paused)$/);

		// Use .or() to try primary first, then fallback
		return primaryLocator.or(fallbackLocator);
	}

	/**
	 * Wait for the billing page to be fully loaded and ready
	 * Waits for either subscription view OR plan selection to appear
	 */
	async waitForBillingPageReady(): Promise<void> {
		// Wait for either the subscription card OR plan selection cards to be visible
		// This handles both states: user with subscription and user without
		const subscriptionIndicator = this.page.locator('h3:has-text("Your Plan")');
		const planSelectionIndicator = this.page.locator("[data-test-plan]").first();

		// Wait for either to appear with a generous timeout for SSR hydration
		await expect(subscriptionIndicator.or(planSelectionIndicator)).toBeVisible({
			timeout: 15000,
		});
	}

	/**
	 * Check if user already has an active subscription
	 * Used for test idempotency - handles cases where test ran previously
	 */
	async hasActiveSubscription(): Promise<boolean> {
		// First, wait for the billing page to be fully ready
		await this.waitForBillingPageReady();

		// Now check which state we're in - subscription exists or plan selection
		const yourPlanHeading = this.page.locator('h3:has-text("Your Plan")');
		const hasYourPlan = await yourPlanHeading.isVisible().catch(() => false);

		if (!hasYourPlan) {
			return false;
		}

		// Also verify the subscription shows as "Active" (or other valid status)
		const statusBadge = this.getStatus();
		const hasActiveStatus = await statusBadge.isVisible({ timeout: 2000 }).catch(() => false);

		return hasActiveStatus;
	}
}
