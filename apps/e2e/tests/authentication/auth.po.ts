import test, { expect, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

import type { AUTH_STATES } from "../utils/auth-state";
import { Mailbox } from "../utils/mailbox";
import { testConfig } from "../utils/test-config";

const MFA_KEY = "NHOHJVGPO3R3LKVPRMNIYLCDMBHUM2SE";

export class AuthPageObject {
	private readonly page: Page;
	private readonly mailbox: Mailbox;

	static MFA_KEY = MFA_KEY;

	constructor(page: Page) {
		this.page = page;
		this.mailbox = new Mailbox(page);
	}

	static setupSession(user: (typeof AUTH_STATES)[keyof typeof AUTH_STATES]) {
		test.use({ storageState: user });
	}

	goToSignIn(next?: string) {
		// Use configured navigation timeout instead of hardcoded value
		// Defaults to 45s in CI environments to handle network latency
		return this.page.goto(`/auth/sign-in${next ? `?next=${next}` : ""}`, {
			waitUntil: "domcontentloaded",
		});
	}

	goToSignUp(next?: string) {
		// Use configured navigation timeout instead of hardcoded value
		return this.page.goto(`/auth/sign-up${next ? `?next=${next}` : ""}`, {
			waitUntil: "domcontentloaded",
		});
	}

	async signOut() {
		await this.page.click('[data-test="account-dropdown-trigger"]');
		await this.page.click('[data-test="account-dropdown-sign-out"]');
	}

	async signIn(params: { email: string; password: string }) {
		await this.page.waitForTimeout(100);

		// Wait for form elements to be ready
		await this.page.waitForSelector('[data-test="email-input"]', {
			state: "visible",
		});
		await this.page.waitForSelector('[data-test="password-input"]', {
			state: "visible",
		});

		// Fill in credentials with debugging
		console.log(`Filling email: ${params.email}`);
		await this.page.fill('[data-test="email-input"]', params.email);

		console.log(`Filling password: ${params.password ? "***" : "empty"}`);
		await this.page.fill('[data-test="password-input"]', params.password);

		// Verify fields were filled
		const emailValue = await this.page.inputValue('[data-test="email-input"]');
		const passwordValue = await this.page.inputValue(
			'[data-test="password-input"]',
		);
		console.log(`Email field value after fill: ${emailValue}`);
		console.log(`Password field has value: ${passwordValue ? "yes" : "no"}`);

		// Check for any console errors before submitting
		this.page.on("console", (msg) => {
			if (msg.type() === "error") {
				console.log(`Console error: ${msg.text()}`);
			}
		});

		await this.page.click('button[type="submit"]');
		console.log("Form submitted, waiting for navigation...");
	}

	async signUp(params: {
		email: string;
		password: string;
		repeatPassword: string;
	}) {
		await this.page.waitForTimeout(100);

		await this.page.fill('input[name="email"]', params.email);
		await this.page.fill('input[name="password"]', params.password);
		await this.page.fill('input[name="repeatPassword"]', params.repeatPassword);

		await this.page.click('button[type="submit"]');
	}

	async submitMFAVerification(key: string) {
		const period = 30;

		const { TOTP } = await import("totp-generator");

		const { otp } = await TOTP.generate(key, {
			period,
		});

		console.log(`OTP ${otp} code`, {
			period,
		});

		// Wait for the OTP input to be visible and focused
		const otpInput = this.page.locator('[name="verificationCode"]');
		await otpInput.waitFor({ state: "visible" });

		// Use pressSequentially to simulate actual typing which triggers form validation
		await otpInput.pressSequentially(otp, { delay: 50 });

		console.log("OTP entered, waiting for form validation to complete...");

		// Wait for form validation to complete by checking if button is enabled
		// React Hook Form validates asynchronously, so we need to wait for formState.isValid
		await this.page.waitForFunction(
			() => {
				const button = document.querySelector(
					'[data-test="submit-mfa-button"]',
				);
				const isEnabled = button && !button.hasAttribute("disabled");
				return isEnabled;
			},
			{ timeout: 10000 },
		);

		console.log("Form validation complete, button enabled. Clicking submit...");

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
		return expect(async () => {
			const res = await this.mailbox.visitMailbox(email, params);

			expect(res).not.toBeNull();
		}).toPass();
	}

	createRandomEmail() {
		const value = Math.random() * 10000000000000;

		return `${value.toFixed(0)}@slideheroes.com`;
	}

	async signUpFlow(path: string) {
		const email = this.createRandomEmail();

		await this.page.goto(`/auth/sign-up?next=${path}`);

		await this.signUp({
			email,
			password: "password",
			repeatPassword: "password",
		});

		await this.visitConfirmEmailLink(email);

		return {
			email,
		};
	}

	async updatePassword(password: string) {
		await this.page.fill('[name="password"]', password);
		await this.page.fill('[name="repeatPassword"]', password);
		await this.page.click('[type="submit"]');
	}

	async loginAsSuperAdmin(params: {
		email: string;
		password: string;
		next?: string;
	}) {
		await this.loginAsUser({
			email: params.email,
			password: params.password,
			next: "/auth/verify",
		});

		// Use configurable timeouts for MFA verification
		// Super-admin login with MFA requires extended timeouts due to:
		// - MFA form rendering and initialization
		// - TOTP token generation and validation
		// - Multiple navigation steps (login → MFA → final destination)
		const longTimeout = testConfig.getTimeout("long");
		const mfaRetryIntervals = testConfig.getRetryIntervals("auth");

		// Check if we're on MFA page and complete verification if needed
		try {
			// Wait for either MFA form or redirect to final destination
			await expect(async () => {
				const currentUrl = this.page.url();

				// If we're on the verify page, submit MFA
				if (currentUrl.includes("/auth/verify")) {
					// Check if MFA form is present
					const mfaInput = await this.page
						.locator('[name="verificationCode"]')
						.count();
					if (mfaInput > 0) {
						await this.submitMFAVerification(MFA_KEY);
					}
				}

				// Wait for final navigation with increased timeout
				await this.page.waitForURL(params.next ?? "/home", {
					timeout: longTimeout,
					waitUntil: "domcontentloaded",
				});
			}).toPass({
				intervals: mfaRetryIntervals,
				timeout: longTimeout + 5000, // Add buffer for retry logic
			});
		} catch (error) {
			// If we're already on the expected page, that's fine
			const currentUrl = this.page.url();
			if (!currentUrl.includes(params.next ?? "/home")) {
				throw error;
			}
		}
	}

	async bootstrapUser({
		email,
		password,
		name,
	}: {
		email: string;
		password: string;
		name: string;
	}) {
		const client = createClient(
			process.env.E2E_SUPABASE_URL || "http://127.0.0.1:54321",
			process.env.E2E_SUPABASE_SERVICE_ROLE_KEY ||
				"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU",
		);

		const { data, error } = await client.auth.admin.createUser({
			email,
			password: password,
			email_confirm: true,
			user_metadata: {
				name,
			},
		});

		if (error) {
			throw new Error(`Failed to create user: ${error.message}`);
		}

		return data;
	}

	async loginAsUser(params: {
		email: string;
		password: string;
		next?: string;
	}) {
		await this.goToSignIn(params.next);

		const startTime = Date.now();
		const targetUrl = params.next ?? "/home";

		// Phase 1: Wait for Supabase auth API response
		// Use test-config timeouts (90s in CI, 30s local) to handle:
		// - Vercel cold starts
		// - Network latency
		// - API gateway overhead
		// - Cloudflare routing
		const isCI = process.env.CI === "true";
		// Import test-config for consistent timeout values
		const { testConfig } = await import("../utils/test-config");
		const authTimeout = testConfig.getTimeout("medium");

		console.log(
			`[Phase 1] Waiting for Supabase auth/v1/token API response (timeout: ${authTimeout}ms)...`,
		);
		const authResponsePromise = this.page.waitForResponse(
			(response) => {
				const url = response.url();
				const isAuthToken = url.includes("auth/v1/token");
				if (isAuthToken) {
					console.log(
						`[Phase 1] Auth API response detected: ${response.status()}`,
					);
				}
				return isAuthToken && response.status() === 200;
			},
			{ timeout: authTimeout },
		);

		// Submit form
		await this.signIn({
			email: params.email,
			password: params.password,
		});

		// Wait for auth API response
		try {
			await authResponsePromise;
			console.log(
				`[Phase 1] ✅ Auth API responded (${Date.now() - startTime}ms)`,
			);
		} catch (error) {
			console.error(`[Phase 1] ❌ Auth API timeout after ${authTimeout}ms`);
			console.error(`Current URL: ${this.page.url()}`);
			console.error(`Credentials: ${params.email}`);

			// Capture additional diagnostics
			try {
				const networkErrors = await this.page.evaluate(() => {
					return (window as any).__networkErrors || [];
				});
				if (networkErrors.length > 0) {
					console.error("Network errors:", networkErrors);
				}
			} catch (e) {
				// Ignore diagnostics failure
			}

			throw error;
		}

		// Phase 2: Wait for navigation with flexible URL matching
		// Use test-config timeout (90s CI, 45s local) to account for:
		// - Server-side redirects
		// - Middleware processing
		// - Session establishment
		const navigationTimeout = testConfig.getTimeout("medium");

		console.log(
			`[Phase 2] Waiting for navigation to: ${targetUrl} (timeout: ${navigationTimeout}ms)`,
		);

		try {
			await this.page.waitForURL(
				(url) => {
					const urlStr = url.toString();
					console.log(`[Phase 2] Current: ${urlStr}, Target: ${targetUrl}`);

					// Accept if we've left sign-in page AND reached either target or onboarding
					const leftSignIn = !urlStr.includes("/auth/sign-in");
					const reachedTarget =
						urlStr.includes(targetUrl) || urlStr.includes("/onboarding");

					return leftSignIn && reachedTarget;
				},
				{
					timeout: navigationTimeout,
				},
			);

			console.log(
				`[Phase 2] ✅ Navigation complete (${Date.now() - startTime}ms total). Final URL: ${this.page.url()}`,
			);
		} catch (error) {
			// Graceful fallback: Check if we're already at a valid post-auth page
			const currentUrl = this.page.url();
			const isPostAuth =
				currentUrl.includes(targetUrl) || currentUrl.includes("/onboarding");

			if (isPostAuth) {
				console.log(
					`[Phase 2] ✅ Already at valid post-auth page: ${currentUrl}`,
				);
			} else {
				console.error(
					`[Phase 2] ❌ Navigation timeout. Current: ${currentUrl}`,
				);
				throw error;
			}
		}
	}
}
