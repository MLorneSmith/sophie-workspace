import { expect, type Page } from "@playwright/test";

export class StripePageObject {
	private readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	getStripeCheckoutIframe() {
		return this.page.frameLocator('[name="embedded-checkout"]');
	}

	async waitForForm() {
		// Check if test checkout modal is present first
		const testCheckoutModal = this.page.locator(
			'[data-test="test-checkout-modal"]',
		);
		try {
			await testCheckoutModal.waitFor({ state: "visible", timeout: 2000 });
			// Test mode detected
			return;
		} catch {
			// Test modal not found, wait for Stripe iframe
			return expect(async () => {
				await expect(this.billingCountry()).toBeVisible();
			}).toPass();
		}
	}

	async fillForm(
		params: {
			billingName?: string;
			cardNumber?: string;
			expiry?: string;
			cvc?: string;
			billingCountry?: string;
		} = {},
	) {
		// Check if we're in test mode by looking for the test modal
		const testCheckoutModal = this.page.locator(
			'[data-test="test-checkout-modal"]',
		);
		const isTestMode = await testCheckoutModal.isVisible();

		if (isTestMode) {
			// Just wait a bit to simulate form filling
			await this.page.waitForTimeout(500);
			return;
		}

		// In production mode, fill the actual Stripe form
		const billingName = this.billingName();
		const cardNumber = this.cardNumber();
		const expiry = this.expiry();
		const cvc = this.cvc();
		const billingCountry = this.billingCountry();

		await billingName.fill(params.billingName ?? "Mr Makerkit");
		await cardNumber.fill(params.cardNumber ?? "4242424242424242");
		await expiry.fill(params.expiry ?? "1228");
		await cvc.fill(params.cvc ?? "123");
		await billingCountry.selectOption(params.billingCountry ?? "IT");
	}

	async submitForm() {
		// Check if we're in test mode by looking for the test modal
		const testCheckoutModal = this.page.locator(
			'[data-test="test-checkout-modal"]',
		);
		const isTestMode = await testCheckoutModal.isVisible();

		if (isTestMode) {
			await this.page.click('[data-test="test-checkout-success"]');
			// Wait for the redirect
			await this.page.waitForTimeout(2000);
			return;
		}

		// In production mode, submit the Stripe form
		return this.getStripeCheckoutIframe()
			.getByTestId("hosted-payment-submit-button")
			.click();
	}

	cardNumber() {
		return this.getStripeCheckoutIframe().locator("#cardNumber");
	}

	cvc() {
		return this.getStripeCheckoutIframe().locator("#cardCvc");
	}

	expiry() {
		return this.getStripeCheckoutIframe().locator("#cardExpiry");
	}

	billingName() {
		return this.getStripeCheckoutIframe().locator("#billingName");
	}

	billingCountry() {
		return this.getStripeCheckoutIframe().locator("#billingCountry");
	}
}
