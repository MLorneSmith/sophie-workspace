import { expect, type Page } from "@playwright/test";
import { TOTP } from "totp-generator";

import { Mailbox } from "../utils/mailbox";
import { waitForPageReady } from "../utils/wait-helpers";

export class AuthPageObject {
	private readonly page: Page;
	private readonly mailbox: Mailbox;

	constructor(page: Page) {
		this.page = page;
		this.mailbox = new Mailbox(page);
	}

	goToSignIn() {
		return this.page.goto("/auth/sign-in");
	}

	goToSignUp() {
		return this.page.goto("/auth/sign-up");
	}

	async signOut() {
		await this.page.click('[data-testid="account-dropdown"]');
		await this.page.click('[data-test="account-dropdown-sign-out"]');
	}

	async signIn(params: { email: string; password: string }) {
		await this.page.waitForTimeout(500);

		// Wait for email input with increased timeout and visibility check
		await this.page.waitForSelector('[data-testid="sign-in-email"]', {
			timeout: 30000,
			state: "visible",
		});
		await this.page.fill('[data-testid="sign-in-email"]', params.email);

		// Wait for password input to ensure form is fully loaded
		await this.page.waitForSelector('[data-testid="sign-in-password"]', {
			timeout: 10000,
			state: "visible",
		});
		await this.page.fill('[data-testid="sign-in-password"]', params.password);

		// Wait for submit button to be enabled
		await this.page.waitForSelector(
			'[data-testid="sign-in-button"]:not([disabled])',
			{
				timeout: 10000,
			},
		);
		await this.page.click('[data-testid="sign-in-button"]');
	}

	async signUp(params: {
		email: string;
		password: string;
		repeatPassword: string;
	}) {
		await this.page.waitForTimeout(500);

		// Wait for email input with increased timeout and visibility check
		await this.page.waitForSelector('[data-testid="sign-up-email"]', {
			timeout: 30000,
			state: "visible",
		});

		await this.page.fill('[data-testid="sign-up-email"]', params.email);

		// Wait for password input to ensure form is fully loaded
		await this.page.waitForSelector('[data-testid="sign-up-password"]', {
			timeout: 10000,
			state: "visible",
		});
		await this.page.fill('[data-testid="sign-up-password"]', params.password);

		// Wait for repeat password input
		await this.page.waitForSelector('[data-testid="sign-up-repeat-password"]', {
			timeout: 10000,
			state: "visible",
		});
		await this.page.fill(
			'[data-testid="sign-up-repeat-password"]',
			params.repeatPassword,
		);

		// Wait for submit button to be enabled
		await this.page.waitForSelector(
			'[data-testid="sign-up-button"]:not([disabled])',
			{
				timeout: 10000,
			},
		);
		await this.page.click('[data-testid="sign-up-button"]');
	}

	async submitMFAVerification(key: string) {
		const period = 30;

		const { otp } = TOTP.generate(key, {
			period,
		});

		// Only log in debug mode to avoid Biome linting errors
		if (process.env.DEBUG) {
			process.stdout.write(`OTP ${otp} code, period: ${period}\n`);
		}

		await this.page.fill("[data-input-otp]", otp);
		await this.page.click('[data-test="submit-mfa-button"]');
	}

	async visitConfirmEmailLink(
		email: string,
		params: {
			deleteAfter: boolean;
			subject?: string;
		} = {
			deleteAfter: true,
		},
	) {
		// Check if we're in local development with autoconfirm
		// In test environment, we're always using local Supabase at 127.0.0.1:54321
		const isLocal =
			process.env.NODE_ENV === "test" ||
			process.env.CI === "true" ||
			this.page.url().includes("localhost:3000") ||
			this.page.url().includes("127.0.0.1");

		if (isLocal) {
			// In local Supabase, autoconfirm is enabled by default
			// Wait a bit for the redirect to happen
			await this.page.waitForTimeout(2000);

			// Check if user is already logged in (redirected to onboarding)
			const currentUrl = this.page.url();
			if (currentUrl.includes("/onboarding") || currentUrl.includes("/home")) {
				if (process.env.DEBUG) {
					process.stdout.write(
						`User ${email} auto-confirmed (local Supabase)\n`,
					);
				}
				return;
			}

			// If still on auth page, autoconfirm might not be working
			if (currentUrl.includes("/auth/")) {
				if (process.env.DEBUG) {
					process.stdout.write(
						"Warning: Still on auth page after sign-up. Autoconfirm may not be enabled.\n",
					);
				}
			}
		}

		// Log when we start waiting for email
		if (process.env.DEBUG) {
			process.stdout.write(`Waiting for confirmation email for ${email}...\n`);
		}

		const startTime = Date.now();

		return expect(async () => {
			const res = await this.mailbox.visitMailbox(email, params);

			expect(res).not.toBeNull();

			// Log how long it took to receive the email
			if (process.env.DEBUG) {
				const elapsed = Date.now() - startTime;
				process.stdout.write(`Email received after ${elapsed}ms\n`);
			}
		}).toPass({
			timeout: process.env.CI ? 60000 : 30000, // 60 seconds for CI, 30 for local
			intervals: [500, 1000, 2000, 3000, 5000], // Start with faster retries
		});
	}

	createRandomEmail() {
		const value = Math.random() * 10000000000000;
		const timestamp = Date.now();

		// Check if we're in a test environment that supports auto-confirm
		const baseUrl = this.page.url() || process.env.BASE_URL || "";
		const isLocalTest =
			baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1");

		if (isLocalTest) {
			// For local testing with InBucket, emails don't actually bounce
			return `test-${timestamp}-${value.toFixed(0)}@slideheroes.com`;
		} else {
			// For deployed environments, use a pattern that won't bounce
			// This requires either email autoconfirm or a valid test inbox
			return `e2e-test-${timestamp}@slideheroes.com`;
		}
	}

	async signUpFlow(path: string) {
		const email = this.createRandomEmail();

		await this.page.goto(`/auth/sign-up?next=${path}`);

		await this.signUp({
			email,
			password: "password",
			repeatPassword: "password",
		});

		// Check if we're in local development with autoconfirm
		// In test environment, we're always using local Supabase at 127.0.0.1:54321
		const isLocal =
			process.env.NODE_ENV === "test" ||
			process.env.CI === "true" ||
			this.page.url().includes("localhost:3000") ||
			this.page.url().includes("127.0.0.1");

		if (isLocal) {
			// In local development with autoconfirm, wait for redirect after sign-up
			if (process.env.DEBUG) {
				process.stdout.write(
					"Local environment detected, waiting for auto-redirect after sign-up...\n",
				);
			}

			// Wait for navigation away from sign-up page or success status
			await this.page
				.waitForURL(
					(url) =>
						!url.href.includes("/auth/sign-up") ||
						url.href.includes("status=success"),
					{ timeout: 10000 },
				)
				.catch(() => {
					// If redirect doesn't happen, try manual navigation
					if (process.env.DEBUG) {
						process.stdout.write(
							`Redirect timeout, attempting manual navigation to ${path}\n`,
						);
					}
				});

			// Check current URL after sign-up
			const currentUrl = this.page.url();
			if (process.env.DEBUG) {
				process.stdout.write(`After sign-up, current URL: ${currentUrl}\n`);
			}

			// If we're on sign-up page with success status, handle the confirmation flow
			if (
				currentUrl.includes("/auth/sign-up") &&
				currentUrl.includes("status=success")
			) {
				if (process.env.DEBUG) {
					process.stdout.write(
						"Sign-up successful, but confirmation required. Checking for auto-login...\n",
					);
				}

				// In local dev with autoconfirm, the user should be logged in already
				// Try navigating directly to the target path
				await this.page.goto(path);
				// Use the safer waitForPageReady instead of networkidle
				await waitForPageReady(this.page, {
					timeout: 10000,
					debug: process.env.DEBUG === "true"
				});

				// Check if we're redirected back to auth (not logged in)
				const afterNavUrl = this.page.url();
				if (afterNavUrl.includes("/auth/")) {
					// Not logged in, need to handle email confirmation
					await this.visitConfirmEmailLink(email);
				}
			} else if (currentUrl.includes("/auth/sign-up")) {
				// Still on sign-up page without success, there's an issue
				throw new Error(
					`Sign-up failed - still on sign-up page: ${currentUrl}`,
				);
			}
		} else {
			// Non-local environment, handle email confirmation
			// Try to visit confirmation link with OTP expiration handling
			const maxRetries = 2;
			let attempt = 0;

			while (attempt < maxRetries) {
				try {
					await this.visitConfirmEmailLink(email);

					// Check if we got redirected to an error page with OTP expired
					const currentUrl = this.page.url();
					if (
						currentUrl.includes("error") &&
						currentUrl.includes("otp_expired")
					) {
						if (attempt < maxRetries - 1) {
							if (process.env.DEBUG) {
								process.stdout.write(
									`OTP expired, requesting new one (attempt ${attempt + 2}/${maxRetries})...\n`,
								);
							}
							// Go back to sign-up and request a new OTP
							await this.page.goto(`/auth/sign-up?next=${path}`);
							await this.signUp({
								email,
								password: "password",
								repeatPassword: "password",
							});
							attempt++;
							continue;
						}
					}
					break; // Success or final attempt
				} catch (error) {
					if (attempt < maxRetries - 1) {
						attempt++;
						continue;
					}
					throw error;
				}
			}
		}

		return {
			email,
		};
	}

	async updatePassword(password: string) {
		await this.page.fill('[name="password"]', password);
		await this.page.fill('[name="repeatPassword"]', password);
		await this.page.click('[type="submit"]');
	}
}
