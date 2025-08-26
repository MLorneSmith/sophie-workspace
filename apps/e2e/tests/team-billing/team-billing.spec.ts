import { expect, type Page, test } from "@playwright/test";

import { TeamBillingPageObject } from "./team-billing.po";

test.describe("Team Billing @integration", () => {
	let page: Page;
	let po: TeamBillingPageObject;

	test.beforeAll(async ({ browser }) => {
		page = await browser.newPage();
		po = new TeamBillingPageObject(page);
	});

	test("a team can subscribe to a plan", async () => {
		await po.setup();
		await po.teamAccounts.goToBilling();

		// Wait for plans to be loaded
		await expect(po.billing.plans().first()).toBeVisible({ timeout: 10000 });

		await po.billing.selectPlan(0);
		await po.billing.proceedToCheckout();

		// Add timeout and error handling for Stripe form loading
		await expect(async () => {
			await po.billing.stripe.waitForForm();
		}).toPass({
			timeout: 30000,
			intervals: [1000, 2000, 3000, 5000],
		});

		await po.billing.stripe.fillForm();
		await po.billing.stripe.submitForm();

		await expect(po.billing.successStatus()).toBeVisible({
			timeout: 30_000, // Increased timeout for payment processing
		});

		await po.billing.returnToBilling();

		await expect(po.billing.getStatus()).toContainText("Active");
		await expect(po.billing.manageBillingButton()).toBeVisible();
	});
});
