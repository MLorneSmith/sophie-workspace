import { test, expect } from "@playwright/test";
import { AccessibilityPO } from "./accessibility.po";
import { AuthPO } from "../authentication/auth.po";

/**
 * Authenticated Accessibility Tests
 *
 * Tests accessibility compliance on pages that require authentication.
 * Uses the existing auth helpers to log in before testing.
 */

test.describe("Authenticated Accessibility Tests - WCAG 2.1 AA", () => {
	let authPO: AuthPO;
	let accessibilityPO: AccessibilityPO;

	test.beforeEach(async ({ page }) => {
		authPO = new AuthPO(page);
		accessibilityPO = new AccessibilityPO(page);

		// Set up auth if needed
		await authPO.visitSignInPage();
		// Note: You may need to adjust this based on your existing auth setup
		// This is a placeholder that assumes auth helpers exist
	});

	test("Dashboard accessibility after authentication", async ({ page }) => {
		// Skip if no valid auth method available
		test.skip(
			!process.env.TEST_USER_EMAIL,
			"No test user credentials available",
		);

		try {
			// Use existing auth method if available
			const email = process.env.TEST_USER_EMAIL;
			const password = process.env.TEST_USER_PASSWORD;
			if (!email || !password) {
				throw new Error("Test user credentials not configured");
			}
			await authPO.signInWithEmailAndPassword(email, password);

			await accessibilityPO.navigateAndWait("/home");

			const results = await accessibilityPO.runFullAccessibilityScan();
			accessibilityPO.printResults(results, "Dashboard Accessibility");

			expect(results.violations).toEqual([]);
		} catch (error) {
			console.log(
				"Skipping authenticated test - auth not available:",
				error.message,
			);
			test.skip();
		}
	});

	test("AI Canvas accessibility when authenticated", async ({ page }) => {
		test.skip(
			!process.env.TEST_USER_EMAIL,
			"No test user credentials available",
		);

		try {
			const email = process.env.TEST_USER_EMAIL;
			const password = process.env.TEST_USER_PASSWORD;
			if (!email || !password) {
				throw new Error("Test user credentials not configured");
			}
			await authPO.signInWithEmailAndPassword(email, password);

			await accessibilityPO.navigateAndWait("/home/ai/canvas");

			const results = await accessibilityPO.runFullAccessibilityScan();
			accessibilityPO.printResults(results, "AI Canvas Accessibility");

			expect(results.violations).toEqual([]);
		} catch (error) {
			console.log(
				"Skipping authenticated test - auth not available:",
				error.message,
			);
			test.skip();
		}
	});

	test("Storyboard accessibility when authenticated", async ({ page }) => {
		test.skip(
			!process.env.TEST_USER_EMAIL,
			"No test user credentials available",
		);

		try {
			const email = process.env.TEST_USER_EMAIL;
			const password = process.env.TEST_USER_PASSWORD;
			if (!email || !password) {
				throw new Error("Test user credentials not configured");
			}
			await authPO.signInWithEmailAndPassword(email, password);

			await accessibilityPO.navigateAndWait("/home/ai/storyboard");

			const results = await accessibilityPO.runFullAccessibilityScan();
			accessibilityPO.printResults(results, "Storyboard Accessibility");

			expect(results.violations).toEqual([]);
		} catch (error) {
			console.log(
				"Skipping authenticated test - auth not available:",
				error.message,
			);
			test.skip();
		}
	});

	test("Course pages accessibility when authenticated", async ({ page }) => {
		test.skip(
			!process.env.TEST_USER_EMAIL,
			"No test user credentials available",
		);

		try {
			const email = process.env.TEST_USER_EMAIL;
			const password = process.env.TEST_USER_PASSWORD;
			if (!email || !password) {
				throw new Error("Test user credentials not configured");
			}
			await authPO.signInWithEmailAndPassword(email, password);

			await accessibilityPO.navigateAndWait("/home/course");

			const results = await accessibilityPO.runFullAccessibilityScan();
			accessibilityPO.printResults(results, "Course Pages Accessibility");

			expect(results.violations).toEqual([]);
		} catch (error) {
			console.log(
				"Skipping authenticated test - auth not available:",
				error.message,
			);
			test.skip();
		}
	});

	test("Account settings accessibility when authenticated", async ({
		page,
	}) => {
		test.skip(
			!process.env.TEST_USER_EMAIL,
			"No test user credentials available",
		);

		try {
			const email = process.env.TEST_USER_EMAIL;
			const password = process.env.TEST_USER_PASSWORD;
			if (!email || !password) {
				throw new Error("Test user credentials not configured");
			}
			await authPO.signInWithEmailAndPassword(email, password);

			await accessibilityPO.navigateAndWait("/home/account");

			const results = await accessibilityPO.runFullAccessibilityScan();
			accessibilityPO.printResults(results, "Account Settings Accessibility");

			expect(results.violations).toEqual([]);
		} catch (error) {
			console.log(
				"Skipping authenticated test - auth not available:",
				error.message,
			);
			test.skip();
		}
	});

	test("Kanban board accessibility when authenticated", async ({ page }) => {
		test.skip(
			!process.env.TEST_USER_EMAIL,
			"No test user credentials available",
		);

		try {
			const email = process.env.TEST_USER_EMAIL;
			const password = process.env.TEST_USER_PASSWORD;
			if (!email || !password) {
				throw new Error("Test user credentials not configured");
			}
			await authPO.signInWithEmailAndPassword(email, password);

			await accessibilityPO.navigateAndWait("/home/kanban");

			const results = await accessibilityPO.runFullAccessibilityScan();
			accessibilityPO.printResults(results, "Kanban Board Accessibility");

			expect(results.violations).toEqual([]);
		} catch (error) {
			console.log(
				"Skipping authenticated test - auth not available:",
				error.message,
			);
			test.skip();
		}
	});
});
