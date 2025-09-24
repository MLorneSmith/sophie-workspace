import test, { expect, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

import type { AUTH_STATES } from "../utils/auth-state";
import { Mailbox } from "../utils/mailbox";

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
		return this.page.goto(`/auth/sign-in${next ? `?next=${next}` : ""}`);
	}

	goToSignUp(next?: string) {
		return this.page.goto(`/auth/sign-up${next ? `?next=${next}` : ""}`);
	}

	async signOut() {
		await this.page.click('[data-test="account-dropdown-trigger"]');
		await this.page.click('[data-test="account-dropdown-sign-out"]');
	}

	async signIn(params: { email: string; password: string }) {
		await this.page.waitForTimeout(100);

		await this.page.fill('input[name="email"]', params.email);
		await this.page.fill('input[name="password"]', params.password);
		await this.page.click('button[type="submit"]');
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
		email?: string;
		password?: string;
		next?: string;
	}) {
		await this.loginAsUser({
			email:
				params.email ||
				process.env.E2E_ADMIN_EMAIL ||
				"michael@slideheroes.com",
			password:
				params.password || process.env.E2E_ADMIN_PASSWORD || "aiesec1992",
			next: "/auth/verify",
		});

		// Check if we're on MFA page and complete verification if needed
		try {
			// Wait for either MFA form or redirect to final destination
			await expect(async () => {
				const currentUrl = this.page.url();

				// If we're on the verify page, submit MFA
				if (currentUrl.includes("/auth/verify")) {
					// Check if MFA form is present
					const mfaInput = await this.page.locator("[data-input-otp]").count();
					if (mfaInput > 0) {
						await this.submitMFAVerification(MFA_KEY);
					}
				}

				// Wait for final navigation
				await this.page.waitForURL(params.next ?? "/home", {
					timeout: 10000,
					waitUntil: "domcontentloaded",
				});
			}).toPass({
				intervals: [500, 1000, 2000, 3000, 5000],
				timeout: 15000,
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
		password?: string;
		name: string;
	}) {
		const client = createClient(
			process.env.E2E_SUPABASE_URL || "http://127.0.0.1:55321",
			process.env.E2E_SUPABASE_SERVICE_ROLE_KEY ||
				"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU",
		);

		const { data, error } = await client.auth.admin.createUser({
			email,
			password: password || "testingpassword",
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
		password?: string;
		next?: string;
	}) {
		await this.goToSignIn(params.next);

		await this.signIn({
			email: params.email,
			password: params.password || "testingpassword",
		});

		// Wait for navigation with increased timeout and more flexible pattern
		// The auth component uses window.location.href which causes a hard navigation
		await this.page.waitForURL(params.next ?? "**/home", {
			timeout: 30000, // Increase timeout to 30s to account for session establishment polling
			waitUntil: "domcontentloaded", // Use domcontentloaded to avoid networkidle hanging issues (#286)
		});
	}
}
