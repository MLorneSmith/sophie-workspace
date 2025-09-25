import { expect, test } from "@playwright/test";

import { UserBillingPageObject } from "./user-billing.po";

test.describe("User Billing", () => {
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
			waitUntil: "domcontentloaded",
			timeout: 15000,
		});
		console.log("At /home/billing, URL:", page.url());

		await po.billing.selectPlan(0);
		await po.billing.proceedToCheckout();

		await po.billing.stripe.waitForForm();
		await po.billing.stripe.fillForm();
		await po.billing.stripe.submitForm();

		await expect(po.billing.successStatus()).toBeVisible({
			timeout: 25_000,
		});

		await po.billing.returnToBilling();

		await expect(po.billing.getStatus()).toContainText("Active");
		await expect(po.billing.manageBillingButton()).toBeVisible();
	});
});
