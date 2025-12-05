import { expect, test } from "@playwright/test";

import { TeamBillingPageObject } from "./team-billing.po";

test.describe("Team Billing @billing @integration", () => {
	test.skip(
		process.env.ENABLE_BILLING_TESTS !== "true",
		"Billing tests disabled",
	);

	test("a team can subscribe to a plan", async ({ page }) => {
		const po = new TeamBillingPageObject(page);

		// Navigate to home page first - authentication is already set via global setup storageState
		// but we need to be on a page that has the team selector UI
		await page.goto("/home", { waitUntil: "domcontentloaded", timeout: 15000 });

		// Now create team and navigate to billing
		await po.teamAccounts.createTeam();
		await po.teamAccounts.goToBilling();

		await po.billing.selectPlan(0);
		await po.billing.proceedToCheckout();

		await po.billing.stripe.waitForForm();
		await po.billing.stripe.fillForm();
		await po.billing.stripe.submitForm();

		await expect(po.billing.successStatus()).toBeVisible({
			timeout: 20_000,
		});

		await po.billing.returnToBilling();

		await expect(po.billing.getStatus()).toContainText("Active");
		await expect(po.billing.manageBillingButton()).toBeVisible();
	});
});
