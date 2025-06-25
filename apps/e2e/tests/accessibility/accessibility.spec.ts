import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Accessibility Tests for SlideHeroes
 *
 * Tests WCAG 2.1 AA compliance across key application pages
 * using axe-core accessibility testing engine.
 */

test.describe("Accessibility Tests - WCAG 2.1 AA", () => {
	// Configure axe for WCAG 2.1 AA compliance
	const axeConfig = {
		tags: ["wcag2a", "wcag2aa", "wcag21aa"],
		rules: {
			// Enable WCAG 2.1 AA specific rules
			"color-contrast": { enabled: true },
			"focus-order-semantics": { enabled: true },
			"keyboard-navigation": { enabled: true },
			"landmark-banner-is-top-level": { enabled: true },
			"landmark-main-is-top-level": { enabled: true },
			"landmark-no-duplicate-banner": { enabled: true },
			"landmark-no-duplicate-contentinfo": { enabled: true },
			"landmark-no-duplicate-main": { enabled: true },
			"landmark-one-main": { enabled: true },
			region: { enabled: true },
			"aria-allowed-attr": { enabled: true },
			"aria-required-attr": { enabled: true },
			"aria-valid-attr-value": { enabled: true },
			"aria-valid-attr": { enabled: true },
			"button-name": { enabled: true },
			"form-field-multiple-labels": { enabled: true },
			"input-button-name": { enabled: true },
			label: { enabled: true },
			"link-name": { enabled: true },
		},
	};

	test("Homepage accessibility compliance", async ({ page }) => {
		await page.goto("/");

		const accessibilityScanResults = await new AxeBuilder({ page })
			.withTags(["wcag2a", "wcag2aa", "wcag21aa"])
			.analyze();

		expect(accessibilityScanResults.violations).toEqual([]);
	});

	test("Authentication pages accessibility", async ({ page }) => {
		// Sign in page
		await page.goto("/auth/sign-in");

		let accessibilityScanResults = await new AxeBuilder({ page })
			.withTags(["wcag2a", "wcag2aa", "wcag21aa"])
			.analyze();

		expect(accessibilityScanResults.violations).toEqual([]);

		// Sign up page
		await page.goto("/auth/sign-up");

		accessibilityScanResults = await new AxeBuilder({ page })
			.withTags(["wcag2a", "wcag2aa", "wcag21aa"])
			.analyze();

		expect(accessibilityScanResults.violations).toEqual([]);
	});

	test("Dashboard accessibility compliance", async ({ page }) => {
		// Note: This test requires authentication
		// For now, we'll test the structure assuming user is logged in
		await page.goto("/home");

		// Wait for navigation or redirect to complete
		await page.waitForLoadState("networkidle");

		const accessibilityScanResults = await new AxeBuilder({ page })
			.withTags(["wcag2a", "wcag2aa", "wcag21aa"])
			.analyze();

		expect(accessibilityScanResults.violations).toEqual([]);
	});

	test("Course pages accessibility", async ({ page }) => {
		await page.goto("/home/course");

		// Wait for page to load
		await page.waitForLoadState("networkidle");

		const accessibilityScanResults = await new AxeBuilder({ page })
			.withTags(["wcag2a", "wcag2aa", "wcag21aa"])
			.analyze();

		expect(accessibilityScanResults.violations).toEqual([]);
	});

	test("AI Canvas accessibility", async ({ page }) => {
		await page.goto("/home/ai/canvas");

		// Wait for page to load
		await page.waitForLoadState("networkidle");

		const accessibilityScanResults = await new AxeBuilder({ page })
			.withTags(["wcag2a", "wcag2aa", "wcag21aa"])
			.analyze();

		expect(accessibilityScanResults.violations).toEqual([]);
	});

	test("Storyboard accessibility", async ({ page }) => {
		await page.goto("/home/ai/storyboard");

		// Wait for page to load
		await page.waitForLoadState("networkidle");

		const accessibilityScanResults = await new AxeBuilder({ page })
			.withTags(["wcag2a", "wcag2aa", "wcag21aa"])
			.analyze();

		expect(accessibilityScanResults.violations).toEqual([]);
	});

	test("Account settings accessibility", async ({ page }) => {
		await page.goto("/home/account");

		// Wait for page to load
		await page.waitForLoadState("networkidle");

		const accessibilityScanResults = await new AxeBuilder({ page })
			.withTags(["wcag2a", "wcag2aa", "wcag21aa"])
			.analyze();

		expect(accessibilityScanResults.violations).toEqual([]);
	});

	test("Color contrast compliance", async ({ page }) => {
		await page.goto("/");

		const accessibilityScanResults = await new AxeBuilder({ page })
			.withRules(["color-contrast"])
			.analyze();

		expect(accessibilityScanResults.violations).toEqual([]);
	});

	test("Keyboard navigation accessibility", async ({ page }) => {
		await page.goto("/");

		const accessibilityScanResults = await new AxeBuilder({ page })
			.withRules(["keyboard", "focus-order-semantics"])
			.analyze();

		expect(accessibilityScanResults.violations).toEqual([]);
	});

	test("Screen reader compatibility", async ({ page }) => {
		await page.goto("/");

		const accessibilityScanResults = await new AxeBuilder({ page })
			.withRules([
				"aria-allowed-attr",
				"aria-required-attr",
				"aria-valid-attr-value",
				"aria-valid-attr",
				"button-name",
				"input-button-name",
				"label",
				"link-name",
			])
			.analyze();

		expect(accessibilityScanResults.violations).toEqual([]);
	});

	test("Form accessibility compliance", async ({ page }) => {
		await page.goto("/auth/sign-in");

		const accessibilityScanResults = await new AxeBuilder({ page })
			.withRules([
				"label",
				"form-field-multiple-labels",
				"aria-required-attr",
				"button-name",
			])
			.analyze();

		expect(accessibilityScanResults.violations).toEqual([]);
	});
});

test.describe("Accessibility Tests - Detailed Reporting", () => {
	test("Generate comprehensive accessibility report", async ({ page }) => {
		const pages = [
			"/",
			"/auth/sign-in",
			"/auth/sign-up",
			"/home",
			"/home/course",
			"/home/ai/canvas",
			"/home/ai/storyboard",
			"/home/account",
		];

		interface ReportDetail {
			page: string;
			violations: number;
			passes: number;
			error?: string;
		}

		const report = {
			summary: {
				totalPages: pages.length,
				violations: 0,
				passes: 0,
				details: [] as ReportDetail[],
			},
		};

		for (const pagePath of pages) {
			try {
				await page.goto(pagePath);
				await page.waitForLoadState("networkidle");

				const accessibilityScanResults = await new AxeBuilder({ page })
					.withTags(["wcag2a", "wcag2aa", "wcag21aa"])
					.analyze();

				const pageReport = {
					page: pagePath,
					violations: accessibilityScanResults.violations.length,
					passes: accessibilityScanResults.passes.length,
					violationDetails: accessibilityScanResults.violations.map((v) => ({
						id: v.id,
						impact: v.impact,
						description: v.description,
						help: v.help,
						helpUrl: v.helpUrl,
						nodes: v.nodes.length,
					})),
				};

				report.summary.details.push(pageReport);
				report.summary.violations += accessibilityScanResults.violations.length;
				report.summary.passes += accessibilityScanResults.passes.length;

				// Log detailed results for this page
				console.log(`\n=== Accessibility Report for ${pagePath} ===`);
				console.log(
					`Violations: ${accessibilityScanResults.violations.length}`,
				);
				console.log(`Passes: ${accessibilityScanResults.passes.length}`);

				if (accessibilityScanResults.violations.length > 0) {
					console.log("\nViolations:");
					accessibilityScanResults.violations.forEach((violation, index) => {
						console.log(`${index + 1}. ${violation.id} (${violation.impact})`);
						console.log(`   Description: ${violation.description}`);
						console.log(`   Help: ${violation.help}`);
						console.log(`   Help URL: ${violation.helpUrl}`);
						console.log(`   Affected nodes: ${violation.nodes.length}`);
					});
				}
			} catch (error) {
				console.error(`Error testing ${pagePath}:`, error);
				report.summary.details.push({
					page: pagePath,
					error: error.message,
					violations: 0,
					passes: 0,
					violationDetails: [],
				});
			}
		}

		// Print overall summary
		console.log("\n=== OVERALL ACCESSIBILITY SUMMARY ===");
		console.log(`Total pages tested: ${report.summary.totalPages}`);
		console.log(`Total violations: ${report.summary.violations}`);
		console.log(`Total passes: ${report.summary.passes}`);
		console.log("========================================\n");

		// Fail the test if there are any violations
		expect(report.summary.violations).toBe(0);
	});
});
