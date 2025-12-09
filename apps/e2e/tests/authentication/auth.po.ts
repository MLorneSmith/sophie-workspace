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
		// Use domcontentloaded for reliable testing with analytics scripts
		return this.page.goto(`/auth/sign-in${next ? `?next=${next}` : ""}`, {
			waitUntil: "domcontentloaded",
		});
	}

	goToSignUp(next?: string) {
		// Use configured navigation timeout instead of hardcoded value
		// Use domcontentloaded for reliable testing with analytics scripts
		return this.page.goto(`/auth/sign-up${next ? `?next=${next}` : ""}`, {
			waitUntil: "domcontentloaded",
		});
	}

	async signOut() {
		// Wait for user session to load and dropdown to be visible
		// This handles the race condition where navigation completes before
		// the useUser() hook validates the session from localStorage
		const dropdownTrigger = this.page.locator(
			'[data-testid="account-dropdown"]',
		);
		await expect(dropdownTrigger).toBeVisible({ timeout: 15000 });

		await dropdownTrigger.click();
		await this.page.click('[data-testid="account-dropdown-sign-out"]');
	}

	async signIn(params: { email: string; password: string }) {
		// Phase 1: Wait for React hydration
		// The form uses React Hook Form which requires client-side hydration
		// to attach event handlers and validation logic
		console.log("[Sign-in Phase 1] Waiting for React hydration...");

		// Wait for the form to be present in DOM
		await this.page.waitForSelector("form", { state: "visible" });

		// Wait for React to hydrate by checking for React-specific attributes
		// React Hook Form adds data attributes and sets up form state
		await this.page.waitForFunction(
			() => {
				const form = document.querySelector("form");
				// Check if React has hydrated by verifying form has event listeners
				// and the submit button is present with proper attributes
				const submitButton = document.querySelector('button[type="submit"]');
				return form && submitButton && !submitButton.hasAttribute("disabled");
			},
			{ timeout: 5000 },
		);

		// CRITICAL: Wait for React Query client to be initialized
		// The signInMutation hook requires React Query provider to be hydrated
		// Without this check, mutateAsync() silently fails and Supabase API is never called
		console.log(
			"[Sign-in Phase 1.5] Waiting for React Query client initialization...",
		);
		await this.page
			.waitForFunction(
				() => {
					// Check if React Query context is available by looking for data-rq-* attributes
					// or checking if window has the QueryClient instance
					const hasReactQuery =
						document.querySelector("[data-rq-client]") !== null ||
						(window as any).__REACT_QUERY__ !== undefined ||
						// Alternative: check if any mutation is registered
						document
							.querySelector('form button[type="submit"]')
							?.getAttribute("aria-busy") !== undefined;

					// Also verify Supabase client is initialized
					const hasSupabase =
						(window as any).supabase !== undefined ||
						sessionStorage.getItem("supabase.auth.token") !== null ||
						// Check for any auth-related data structures
						Object.keys(sessionStorage).some((key) => key.includes("supabase"));

					return hasReactQuery || hasSupabase;
				},
				{ timeout: 5000 },
			)
			.catch(() => {
				// If we can't detect React Query, add a small delay to allow initialization
				// This is a fallback to prevent the race condition
				console.log(
					"[Sign-in Phase 1.5] React Query detection timeout, using fallback delay...",
				);
				return this.page.waitForTimeout(1000);
			});

		console.log(
			"[Sign-in Phase 2] Waiting for form inputs to be interactive...",
		);

		// Phase 2: Wait for inputs to be truly interactive (not just visible)
		// Note: The sign-in form uses "sign-in-email" and "sign-in-password" data-testids
		const emailInput = this.page.locator('[data-testid="sign-in-email"]');
		const passwordInput = this.page.locator('[data-testid="sign-in-password"]');

		// Use Playwright's built-in interactivity checks
		// These automatically wait for: visible, stable, enabled, not obscured
		await emailInput.waitFor({ state: "visible" });
		await passwordInput.waitFor({ state: "visible" });

		// Additional check: ensure inputs are editable (React has attached handlers)
		await expect(emailInput).toBeEditable({ timeout: 5000 });
		await expect(passwordInput).toBeEditable({ timeout: 5000 });

		console.log(`[Sign-in Phase 3] Filling credentials for: ${params.email}`);

		// Phase 3: Fill form fields with React Hook Form reliability
		// Use Playwright's toPass() to handle React Hook Form's asynchronous state updates
		await expect(async () => {
			// Clear and fill email field
			await emailInput.clear();
			await emailInput.fill(params.email);

			// Wait for React Hook Form to process the change and verify
			await this.page.waitForFunction(
				(expectedEmail) => {
					const input = document.querySelector(
						'[data-testid="sign-in-email"]',
					) as HTMLInputElement;
					return input && input.value === expectedEmail;
				},
				params.email,
				{ timeout: 2000 },
			);

			// Verify the value stuck
			const emailValue = await emailInput.inputValue();
			expect(emailValue).toBe(params.email);
		}).toPass({ timeout: 10000, intervals: [100, 500, 1000, 2000] });

		console.log("[Sign-in Phase 3] Email field filled successfully");

		// Fill password field with same reliability pattern
		await expect(async () => {
			await passwordInput.clear();
			await passwordInput.fill(params.password);

			// Wait for React Hook Form to process the password change
			await this.page.waitForFunction(
				(expectedPassword) => {
					const input = document.querySelector(
						'[data-testid="sign-in-password"]',
					) as HTMLInputElement;
					return input && input.value === expectedPassword;
				},
				params.password,
				{ timeout: 2000 },
			);

			// Verify the value stuck
			const passwordValue = await passwordInput.inputValue();
			expect(passwordValue).toBe(params.password);
		}).toPass({ timeout: 10000, intervals: [100, 500, 1000, 2000] });

		console.log("[Sign-in Phase 3] Password field filled successfully");

		// Phase 4: Wait for form validation to complete
		// React Hook Form validates asynchronously after field changes
		console.log("[Sign-in Phase 4] Waiting for form validation...");

		await this.page.waitForFunction(
			() => {
				const submitButton = document.querySelector(
					'button[type="submit"]',
				) as HTMLButtonElement;

				// Check that button is enabled and not showing loading state
				const isEnabled = submitButton && !submitButton.disabled;
				const isNotLoading = !submitButton?.textContent
					?.toLowerCase()
					.includes("signing in");

				return isEnabled && isNotLoading;
			},
			{ timeout: 5000 },
		);

		console.log(
			"[Sign-in Phase 5] Form ready. Submitting authentication request...",
		);

		// Phase 5: Submit form
		await this.page.click('button[type="submit"]');

		console.log("[Sign-in Phase 5] Form submitted. Waiting for navigation...");
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
					'[data-testid="submit-mfa-button"]',
				);
				const isEnabled = button && !button.hasAttribute("disabled");
				return isEnabled;
			},
			{ timeout: 10000 },
		);

		console.log("Form validation complete, button enabled. Clicking submit...");

		await this.page.click('[data-testid="submit-mfa-button"]');
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
		}).toPass({
			timeout: 60000,
			intervals: [1000, 2000, 5000, 10000, 15000],
		});
	}

	createRandomEmail() {
		const value = Math.random() * 10000000000000;

		return `${value.toFixed(0)}@slideheroes.com`;
	}

	async signUpFlow(path: string) {
		const email = this.createRandomEmail();

		await this.page.goto(`/auth/sign-up?next=${path}`, {
			waitUntil: "domcontentloaded",
		});

		// Wait for form to be loaded
		await this.page.waitForSelector('input[name="email"]', {
			state: "visible",
			timeout: 10000,
		});

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
		// CRITICAL: Super-admin users with MFA enrolled will be automatically
		// redirected to /auth/verify after sign-in by the auth middleware
		// We don't pass a 'next' parameter to loginAsUser because:
		// 1. The redirect to /auth/verify happens automatically
		// 2. After MFA verification, the verify page redirects to the original intended destination
		const finalDestination = params.next ?? "/home";

		// Sign in without specifying 'next' - let the auth flow handle MFA redirect
		await this.goToSignIn(finalDestination);

		const startTime = Date.now();

		// Wait for auth API response
		// Use "long" timeout for super-admin login as it involves MFA flow
		const authTimeout = testConfig.getTimeout("long");
		console.log("[Super-Admin Auth] Waiting for Supabase auth API response...");

		const authResponsePromise = this.page.waitForResponse(
			(response) => {
				const url = response.url();
				const isAuthToken = url.includes("auth/v1/token");
				if (isAuthToken) {
					console.log(
						`[Super-Admin Auth] Auth API response: ${response.status()}`,
					);
				}
				return isAuthToken && response.status() === 200;
			},
			{ timeout: authTimeout },
		);

		// Submit sign-in form
		await this.signIn({
			email: params.email,
			password: params.password,
		});

		// Wait for auth API response
		try {
			await authResponsePromise;
			console.log(
				`[Super-Admin Auth] ✅ Auth API responded (${Date.now() - startTime}ms)`,
			);
		} catch (error) {
			console.error(
				`[Super-Admin Auth] ❌ Auth API timeout after ${authTimeout}ms`,
			);
			throw error;
		}

		// Use configurable timeouts for MFA verification
		// Super-admin login with MFA requires extended timeouts due to:
		// - MFA form rendering and initialization
		// - TOTP token generation and validation
		// - Multiple navigation steps (login → MFA → final destination)
		const longTimeout = testConfig.getTimeout("long");
		const mfaRetryIntervals = testConfig.getRetryIntervals("auth");

		// Wait for navigation to verify page and complete MFA
		console.log("[Super-Admin Auth] Waiting for redirect to /auth/verify...");

		// Check if we're on MFA page and complete verification if needed
		try {
			// Wait for either MFA form or redirect to final destination
			await expect(async () => {
				const pageUrl = this.page.url();
				console.log(`[Super-Admin Auth] Current URL: ${pageUrl}`);

				// If we're on the verify page, submit MFA
				if (pageUrl.includes("/auth/verify")) {
					console.log(
						"[Super-Admin Auth] On verify page, checking for MFA form...",
					);
					// Check if MFA form is present
					const mfaInput = await this.page
						.locator('[name="verificationCode"]')
						.count();
					console.log(`[Super-Admin Auth] MFA input count: ${mfaInput}`);

					if (mfaInput > 0) {
						console.log("[Super-Admin Auth] Submitting MFA verification...");
						await this.submitMFAVerification(MFA_KEY);
						console.log(
							"[Super-Admin Auth] MFA submitted, waiting for post-MFA redirect...",
						);
						// Wait a moment for the redirect to process
						await this.page.waitForTimeout(1000);
					}
				}

				// Check if we've reached the final destination
				// IMPORTANT: Use pathname check, not URL string includes, to avoid false positives
				// from query parameters (e.g., "/auth/sign-in?next=/home" would match "/home")
				const currentUrl = new URL(pageUrl);
				const atDestination =
					currentUrl.pathname === finalDestination ||
					currentUrl.pathname.startsWith(`${finalDestination}/`);
				console.log(
					`[Super-Admin Auth] At destination (${finalDestination})? ${atDestination} (pathname: ${currentUrl.pathname})`,
				);

				if (!atDestination) {
					throw new Error(
						`Not yet at destination. Currently at: ${currentUrl.pathname}, expected: ${finalDestination}`,
					);
				}
			}).toPass({
				intervals: mfaRetryIntervals,
				timeout: longTimeout + 5000, // Add buffer for retry logic
			});

			console.log(
				"[Super-Admin Auth] ✅ Successfully authenticated and reached destination",
			);
		} catch (error) {
			const currentUrl = this.page.url();
			console.error(
				`[Super-Admin Auth] ❌ Error: Current URL: ${currentUrl}, Expected: ${finalDestination}`,
			);
			throw error;
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
			process.env.E2E_SUPABASE_URL || "http://127.0.0.1:54521",
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
		const startTime = Date.now();
		const targetUrl = params.next ?? "/home";
		const authTimeout = testConfig.getTimeout("medium");

		console.log(
			`[loginAsUser] Starting login for ${params.email}, target: ${targetUrl}`,
		);

		// Use toPass() with exponential backoff to handle React Query hydration race condition
		// This pattern sets up response listener BEFORE form submission, then retries
		// the entire operation if the auth API isn't called (indicating hydration wasn't ready)
		//
		// Timing budget uses environment-aware config from testConfig:
		// - CI environments use longer timeouts and more aggressive retry intervals
		// - Local environments use shorter timeouts for faster feedback
		// - Per-attempt timeout is derived from "short" timeout config
		const perAttemptTimeout = testConfig.getTimeout("short");
		const authIntervals = testConfig.getRetryIntervals("auth");

		await expect(async () => {
			// Navigate to sign-in page for each attempt (fresh state)
			await this.goToSignIn(params.next);

			// Wait for form to be visible and interactive
			const emailInput = this.page.locator('[data-testid="sign-in-email"]');
			await emailInput.waitFor({
				state: "visible",
				timeout: perAttemptTimeout,
			});

			// Hydration wait guard 1: Ensure Supabase auth is initialized
			// waitForLoadState('networkidle') ensures auth SDK and React Query are fully hydrated
			console.log(
				"[loginAsUser] Waiting for network idle to ensure Supabase auth initialization...",
			);
			await this.page.waitForLoadState("networkidle");

			// Hydration wait guard 2: Safety timeout for JavaScript execution context
			// Allows async effects and React state updates to settle (150ms buffer)
			console.log("[loginAsUser] 150ms safety timeout for React hydration...");
			await this.page.waitForTimeout(150);

			// Set up response listener BEFORE any form interaction
			// This is the key fix: listener is ready before React Query could fire
			const authResponsePromise = this.page.waitForResponse(
				(response) => {
					const url = response.url();
					const isAuthToken = url.includes("auth/v1/token");
					if (isAuthToken) {
						console.log(
							`[loginAsUser] Auth API response: ${response.status()}`,
						);
					}
					// Accept both 200 (success) and 400/401 (invalid credentials)
					return isAuthToken && response.status() < 500;
				},
				{ timeout: perAttemptTimeout }, // Per-attempt auth timeout from config; toPass handles retries
			);

			// Fill form fields with clear/fill pattern for reliability
			await emailInput.clear();
			await emailInput.fill(params.email);

			const passwordInput = this.page.locator(
				'[data-testid="sign-in-password"]',
			);
			await passwordInput.clear();
			await passwordInput.fill(params.password);

			// Submit form
			await this.page.click('button[type="submit"]');
			console.log("[loginAsUser] Form submitted, waiting for auth API...");

			// Wait for auth API response - this is the critical check
			// If React Query wasn't hydrated, no request will be made and this times out
			const response = await authResponsePromise;
			const status = response.status();

			console.log(
				`[loginAsUser] Auth API responded with ${status} (${Date.now() - startTime}ms)`,
			);

			// For valid credentials, expect 200; for invalid, handle gracefully
			if (status === 200) {
				// Success - wait for navigation
				await this.page.waitForURL(
					(url) => {
						const urlStr = url.toString();
						const leftSignIn = !urlStr.includes("/auth/sign-in");
						const reachedTarget =
							urlStr.includes(targetUrl) || urlStr.includes("/onboarding");
						return leftSignIn && reachedTarget;
					},
					{ timeout: perAttemptTimeout },
				);
			} else if (status === 400 || status === 401) {
				// Invalid credentials - this is expected for some test cases
				// The test caller will handle the error state
				console.log(
					`[loginAsUser] Auth returned ${status} - invalid credentials`,
				);
			}
		}).toPass({
			// Use environment-aware retry intervals from testConfig
			// CI environments get longer intervals for network latency resilience
			intervals: authIntervals,
			timeout: authTimeout,
		});

		console.log(
			`[loginAsUser] ✅ Login complete (${Date.now() - startTime}ms). Final URL: ${this.page.url()}`,
		);
	}
}
