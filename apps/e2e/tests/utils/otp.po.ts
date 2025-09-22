import { createServiceLogger } from "@kit/shared/logger";
import { expect, type Page } from "@playwright/test";
import { Mailbox } from "./mailbox";

// Initialize service logger
const { getLogger: _getLogger } = createServiceLogger("OTP_PO");

export class OtpPo {
	private readonly page: Page;
	private readonly mailbox: Mailbox;

	constructor(page: Page) {
		this.page = page;
		this.mailbox = new Mailbox(page);
	}

	/**
	 * Completes the OTP verification process
	 * @param email The email address to send the OTP to
	 */
	async completeOtpVerification(email: string) {
		// Check auth state before attempting OTP operations
		await this.verifyAuthSession();

		// Click the "Send Verification Code" button
		await this.page.click('[data-test="otp-send-verification-button"]');

		// wait for the OTP to be sent
		await this.page.waitForTimeout(500);

		// Get the OTP code from the email with retries (max 30s)
		let otpCode = null;
		let attempts = 0;
		const maxAttempts = 6; // 30 seconds total (6 * 5s)

		while (!otpCode && attempts < maxAttempts) {
			try {
				otpCode = await this.getOtpCodeFromEmail(email);
				if (otpCode) break;
			} catch (error) {
				console.log(
					`OTP attempt ${attempts + 1}/${maxAttempts} failed, retrying...`,
				);
			}

			attempts++;
			if (attempts < maxAttempts) {
				await this.page.waitForTimeout(5000); // Wait 5 seconds between attempts
			}
		}

		expect(otpCode).not.toBeNull();

		// Enter the OTP code
		await this.enterOtpCode(otpCode);

		// Click the "Verify Code" button
		await this.page.click('[data-test="otp-verify-button"]');
	}

	/**
	 * Retrieves the OTP code from an email
	 * @param email The email address to check for the OTP
	 * @returns The OTP code
	 */
	async getOtpCodeFromEmail(email: string) {
		// Get the OTP from the email
		const otpCode = await this.mailbox.getOtpFromEmail(email);

		if (!otpCode) {
			throw new Error("Failed to retrieve OTP code from email");
		}

		return otpCode;
	}

	/**
	 * Enters the OTP code into the input fields
	 * @param otpCode The 6-digit OTP code
	 */
	async enterOtpCode(otpCode: string) {
		// TODO: Async logger needed
		// (await getLogger()).info(`Entering OTP code: ${otpCode}`);
		await this.page.fill("[data-input-otp]", otpCode);
	}

	/**
	 * Verifies that the user has a valid auth session before OTP operations
	 */
	async verifyAuthSession() {
		// Check if we can access authenticated endpoints
		const response = await this.page.evaluate(async () => {
			try {
				const res = await fetch("/api/auth/user", {
					credentials: "include",
				});
				return {
					status: res.status,
					ok: res.ok,
					url: res.url,
				};
			} catch (err) {
				return { error: err.message };
			}
		});

		// If we're not authenticated, the page might need a refresh or re-authentication
		if (!response.ok && response.status === 401) {
			console.warn(
				"Auth session not found before OTP operation. Current URL:",
				this.page.url(),
			);

			// Wait a bit and try again - sometimes the session takes time to establish
			await this.page.waitForTimeout(1000);

			// Check if we're on an auth page - if so, we might need to complete authentication first
			const currentUrl = this.page.url();
			if (currentUrl.includes("/auth/")) {
				throw new Error(
					"User not authenticated - still on auth page before OTP operation",
				);
			}

			// Try refreshing the page to ensure session is loaded
			await this.page.reload({ waitUntil: "networkidle" });
			await this.page.waitForTimeout(1000);
		}

		console.log("Auth session verified before OTP operation");
	}
}
