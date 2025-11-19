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
			'[data-test="account-dropdown-trigger"]',
		);
		await expect(dropdownTrigger).toBeVisible({ timeout: 15000 });

		await dropdownTrigger.click();
		await this.page.click('[data-test="account-dropdown-sign-out"]');
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
		const emailInput = this.page.locator('[data-test="email-input"]');
		const passwordInput = this.page.locator('[data-test="password-input"]');

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
						'[data-test="email-input"]',
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
						'[data-test="password-input"]',
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
		const authTimeout = testConfig.getTimeout("medium");
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
		// Use test-config for consistent timeout values (imported at top of file)
		const authTimeout = testConfig.getTimeout("medium");

		console.log(
			`[Phase 1] Waiting for Supabase auth/v1/token API response (timeout: ${authTimeout}ms)...`,
		);

		// Set up comprehensive network logging to diagnose response detection issues
		const capturedRequests: Array<{ url: string; method: string }> = [];
		const capturedResponses: Array<{ url: string; status: number }> = [];

		const requestHandler = (request: any) => {
			const url = request.url();
			if (url.includes("auth") || url.includes("supabase")) {
				capturedRequests.push({ url, method: request.method() });
				console.log(`[Network] Request: ${request.method()} ${url}`);
			}
		};

		const responseHandler = (response: any) => {
			const url = response.url();
			if (url.includes("auth") || url.includes("supabase")) {
				capturedResponses.push({ url, status: response.status() });
				console.log(`[Network] Response: ${response.status()} ${url}`);
			}
		};

		this.page.on("request", requestHandler);
		this.page.on("response", responseHandler);

		// Use Promise.all to ensure response listener is ready before form submission
		// This prevents race condition where API responds before listener is attached
		try {
			await Promise.all([
				this.page.waitForResponse(
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
				),
				// Submit form - listener is guaranteed to be ready
				this.signIn({
					email: params.email,
					password: params.password,
				}),
			]);

			console.log(
				`[Phase 1] ✅ Auth API responded (${Date.now() - startTime}ms)`,
			);
		} catch (error) {
			console.error(`[Phase 1] ❌ Auth API timeout after ${authTimeout}ms`);
			console.error(`Current URL: ${this.page.url()}`);
			console.error(`Credentials: ${params.email}`);

			// Log all captured network activity for diagnosis
			console.error("\n[Diagnostics] Captured Auth Requests:");
			capturedRequests.forEach((req) => {
				console.error(`  ${req.method} ${req.url}`);
			});

			console.error("\n[Diagnostics] Captured Auth Responses:");
			capturedResponses.forEach((res) => {
				console.error(`  ${res.status} ${res.url}`);
			});

			// Capture additional diagnostics
			try {
				const networkErrors = await this.page.evaluate(() => {
					return (window as any).__networkErrors || [];
				});
				if (networkErrors.length > 0) {
					console.error("\n[Diagnostics] Network errors:", networkErrors);
				}
			} catch (e) {
				// Ignore diagnostics failure
			}

			throw error;
		} finally {
			// Clean up event listeners to prevent memory leaks
			this.page.off("request", requestHandler);
			this.page.off("response", responseHandler);
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
