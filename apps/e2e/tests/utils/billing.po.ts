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
		return this.page.locator('[data-testid="manage-billing-redirect-button"]');
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
		return this.page.locator('[data-testid="current-plan-card-status-badge"]');
	}
}
