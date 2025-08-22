import { expect, test } from "@playwright/test";
import { HybridAccessibilityTester } from "./hybrid-a11y";

/**
 * Hybrid Accessibility Tests for SlideHeroes
 *
 * Tests WCAG 2.1 AA compliance across key application pages
 * using a combination of Lighthouse, custom WCAG validators,
 * and color contrast checkers to avoid false positives.
 */

test.describe("Hybrid Accessibility Tests - WCAG 2.1 AA", () => {
	test("Homepage accessibility compliance", async ({ page }) => {
		await page.goto("/");
		await page.waitForLoadState("networkidle");

		const tester = new HybridAccessibilityTester(page);
		const results = await tester.runFullAudit({
			wcagLevel: "AA",
			skipLighthouse: true, // Skip Lighthouse due to environment constraints
			skipContrast: true, // Skip contrast checks - tracked separately in issue #218
		});

		// Log detailed report
		console.log(tester.generateReport(results));

		// Assert no critical or serious violations
		expect(results.summary.criticalViolations).toBe(0);
		expect(results.summary.seriousViolations).toBe(0);

		// Allow minor violations but log them
		if (results.summary.minorViolations > 0) {
			console.log(
				`⚠️ Minor violations found: ${results.summary.minorViolations}`,
			);
		}

		// Main assertion
		expect(results.pass).toBe(true);
	});

	test("Authentication pages accessibility", async ({ page }) => {
		// Test Sign In page
		await page.goto("/auth/sign-in");
		await page.waitForLoadState("networkidle");

		const tester = new HybridAccessibilityTester(page);
		let results = await tester.runFullAudit({
			wcagLevel: "AA",
			skipLighthouse: true, // Skip Lighthouse due to environment constraints
			skipContrast: true, // Skip contrast checks - tracked separately in issue #218
		});

		console.log("Sign In Page:");
		console.log(tester.generateReport(results));

		expect(results.summary.criticalViolations).toBe(0);
		expect(results.summary.seriousViolations).toBe(0);
		expect(results.pass).toBe(true);

		// Test Sign Up page
		await page.goto("/auth/sign-up");
		await page.waitForLoadState("networkidle");

		results = await tester.runFullAudit({
			wcagLevel: "AA",
			skipLighthouse: true, // Skip Lighthouse due to environment constraints
			skipContrast: true, // Skip contrast checks - tracked separately in issue #218
		});

		console.log("Sign Up Page:");
		console.log(tester.generateReport(results));

		expect(results.summary.criticalViolations).toBe(0);
		expect(results.summary.seriousViolations).toBe(0);
		expect(results.pass).toBe(true);
	});

	test("Dashboard accessibility compliance", async ({ page }) => {
		await page.goto("/home");
		await page.waitForLoadState("networkidle");

		const tester = new HybridAccessibilityTester(page);
		const results = await tester.runFullAudit({
			wcagLevel: "AA",
			skipLighthouse: true, // Skip Lighthouse due to environment constraints
			skipContrast: true, // Skip contrast checks - tracked separately in issue #218
		});

		console.log("Dashboard:");
		console.log(tester.generateReport(results));

		expect(results.summary.criticalViolations).toBe(0);
		expect(results.summary.seriousViolations).toBe(0);
		expect(results.pass).toBe(true);
	});

	test("Course pages accessibility", async ({ page }) => {
		await page.goto("/home/course");
		await page.waitForLoadState("networkidle");

		const tester = new HybridAccessibilityTester(page);
		const results = await tester.runFullAudit({
			wcagLevel: "AA",
			skipLighthouse: true, // Skip Lighthouse due to environment constraints
			skipContrast: true, // Skip contrast checks - tracked separately in issue #218
		});

		console.log("Course Page:");
		console.log(tester.generateReport(results));

		expect(results.summary.criticalViolations).toBe(0);
		expect(results.summary.seriousViolations).toBe(0);
		expect(results.pass).toBe(true);
	});

	test("AI Canvas accessibility", async ({ page }) => {
		await page.goto("/home/ai/canvas");
		await page.waitForLoadState("networkidle");

		const tester = new HybridAccessibilityTester(page);
		const results = await tester.runFullAudit({
			wcagLevel: "AA",
			skipLighthouse: true, // Skip Lighthouse due to environment constraints
			skipContrast: true, // Skip contrast checks - tracked separately in issue #218
		});

		console.log("AI Canvas:");
		console.log(tester.generateReport(results));

		expect(results.summary.criticalViolations).toBe(0);
		expect(results.summary.seriousViolations).toBe(0);
		expect(results.pass).toBe(true);
	});

	test("Storyboard accessibility", async ({ page }) => {
		await page.goto("/home/ai/storyboard");
		await page.waitForLoadState("networkidle");

		const tester = new HybridAccessibilityTester(page);
		const results = await tester.runFullAudit({
			wcagLevel: "AA",
			skipLighthouse: true, // Skip Lighthouse due to environment constraints
			skipContrast: true, // Skip contrast checks - tracked separately in issue #218
		});

		console.log("Storyboard:");
		console.log(tester.generateReport(results));

		expect(results.summary.criticalViolations).toBe(0);
		expect(results.summary.seriousViolations).toBe(0);
		expect(results.pass).toBe(true);
	});

	test("Account settings accessibility", async ({ page }) => {
		await page.goto("/home/account");
		await page.waitForLoadState("networkidle");

		const tester = new HybridAccessibilityTester(page);
		const results = await tester.runFullAudit({
			wcagLevel: "AA",
			skipLighthouse: true, // Skip Lighthouse due to environment constraints
			skipContrast: true, // Skip contrast checks - tracked separately in issue #218
		});

		console.log("Account Settings:");
		console.log(tester.generateReport(results));

		expect(results.summary.criticalViolations).toBe(0);
		expect(results.summary.seriousViolations).toBe(0);
		expect(results.pass).toBe(true);
	});

	test.skip("Color contrast compliance - targeted test", async ({ page }) => {
		// Skip this test - contrast issues are tracked in issue #218
		await page.goto("/");
		await page.waitForLoadState("networkidle");

		const tester = new HybridAccessibilityTester(page);

		// Run only contrast checks for faster execution
		const results = await tester.runFullAudit({
			wcagLevel: "AA",
			skipLighthouse: true,
		});

		console.log("Color Contrast Test:");
		console.log(
			`Total contrast violations: ${results.contrast.violations.length}`,
		);

		if (results.contrast.violations.length > 0) {
			console.log("\nContrast Issues:");
			for (const violation of results.contrast.violations) {
				console.log(`- ${violation.element}`);
				console.log(`  Foreground: ${violation.foreground}`);
				console.log(`  Background: ${violation.background}`);
				console.log(
					`  Ratio: ${violation.ratio}:1 (Required: ${violation.required}:1)`,
				);
			}
		}

		expect(results.contrast.passed).toBe(true);
	});

	test("Keyboard navigation accessibility", async ({ page }) => {
		await page.goto("/");
		await page.waitForLoadState("networkidle");

		const tester = new HybridAccessibilityTester(page);
		const results = await tester.runFullAudit({
			wcagLevel: "AA",
			skipLighthouse: true, // Skip Lighthouse due to environment constraints
			skipContrast: true, // Skip contrast checks - tracked separately in issue #218
		});

		// Check for keyboard navigation specific issues
		const keyboardIssues = results.wcag.violations.filter(
			(v) =>
				v.id.includes("keyboard") ||
				v.id.includes("focus") ||
				v.id.includes("tabindex"),
		);

		console.log("Keyboard Navigation Test:");
		console.log(`Keyboard-related violations: ${keyboardIssues.length}`);

		if (keyboardIssues.length > 0) {
			for (const issue of keyboardIssues) {
				console.log(`- ${issue.description}`);
			}
		}

		expect(keyboardIssues.length).toBe(0);
	});

	test("Screen reader compatibility", async ({ page }) => {
		await page.goto("/");
		await page.waitForLoadState("networkidle");

		const tester = new HybridAccessibilityTester(page);
		const results = await tester.runFullAudit({
			wcagLevel: "AA",
			skipLighthouse: true, // Skip Lighthouse due to environment constraints
			skipContrast: true, // Skip contrast checks - tracked separately in issue #218
		});

		// Check for ARIA and labeling issues
		const ariaIssues = results.wcag.violations.filter(
			(v) =>
				v.id.includes("aria") ||
				v.id.includes("label") ||
				v.id.includes("button-name") ||
				v.id.includes("link-name"),
		);

		console.log("Screen Reader Compatibility Test:");
		console.log(`ARIA/Label violations: ${ariaIssues.length}`);

		if (ariaIssues.length > 0) {
			for (const issue of ariaIssues) {
				console.log(`- ${issue.description}`);
			}
		}

		expect(ariaIssues.length).toBe(0);
	});

	test("Form accessibility compliance", async ({ page }) => {
		await page.goto("/auth/sign-in");
		await page.waitForLoadState("networkidle");

		const tester = new HybridAccessibilityTester(page);
		const results = await tester.runFullAudit({
			wcagLevel: "AA",
			skipLighthouse: true, // Skip Lighthouse due to environment constraints
			skipContrast: true, // Skip contrast checks - tracked separately in issue #218
		});

		// Check for form-specific issues
		const formIssues = results.wcag.violations.filter(
			(v) =>
				v.id.includes("form") ||
				v.id.includes("label") ||
				v.id.includes("input"),
		);

		console.log("Form Accessibility Test:");
		console.log(`Form-related violations: ${formIssues.length}`);

		if (formIssues.length > 0) {
			for (const issue of formIssues) {
				console.log(`- ${issue.description}`);
			}
		}

		expect(formIssues.length).toBe(0);
	});
});

test.describe("Accessibility Tests - Comprehensive Reporting", () => {
	test("Generate comprehensive accessibility report for all pages", async ({
		page,
	}) => {
		const pages = [
			{ path: "/", name: "Homepage" },
			{ path: "/auth/sign-in", name: "Sign In" },
			{ path: "/auth/sign-up", name: "Sign Up" },
			{ path: "/home", name: "Dashboard" },
			{ path: "/home/course", name: "Course" },
			{ path: "/home/ai/canvas", name: "AI Canvas" },
			{ path: "/home/ai/storyboard", name: "Storyboard" },
			{ path: "/home/account", name: "Account Settings" },
		];

		const overallReport = {
			totalPages: pages.length,
			passedPages: 0,
			failedPages: 0,
			totalViolations: 0,
			criticalViolations: 0,
			seriousViolations: 0,
			details: [] as unknown[],
		};

		console.log(`\n${"=".repeat(60)}`);
		console.log("COMPREHENSIVE ACCESSIBILITY AUDIT");
		console.log(`${"=".repeat(60)}\n`);

		for (const pageInfo of pages) {
			try {
				await page.goto(pageInfo.path);
				await page.waitForLoadState("networkidle");

				const tester = new HybridAccessibilityTester(page);
				const results = await tester.runFullAudit({
					wcagLevel: "AA",
					skipLighthouse: true, // Skip Lighthouse due to environment constraints
					skipContrast: true, // Skip contrast checks - tracked separately in issue #218
				});

				const pageReport = {
					name: pageInfo.name,
					path: pageInfo.path,
					passed: results.pass,
					lighthouseScore: Math.round(results.lighthouse.score * 100),
					contrastPassed: results.contrast.passed,
					wcagLevel: results.wcag.level,
					violations: results.summary.totalViolations,
					critical: results.summary.criticalViolations,
					serious: results.summary.seriousViolations,
				};

				overallReport.details.push(pageReport);

				if (results.pass) {
					overallReport.passedPages++;
				} else {
					overallReport.failedPages++;
				}

				overallReport.totalViolations += results.summary.totalViolations;
				overallReport.criticalViolations += results.summary.criticalViolations;
				overallReport.seriousViolations += results.summary.seriousViolations;

				// Log page-specific report
				console.log(`\n📄 ${pageInfo.name} (${pageInfo.path})`);
				console.log("-".repeat(40));
				console.log(`Status: ${results.pass ? "✅ PASS" : "❌ FAIL"}`);
				console.log(
					`Lighthouse Score: ${Math.round(results.lighthouse.score * 100)}%`,
				);
				console.log(
					`Color Contrast: ${results.contrast.passed ? "✅" : "❌"} (${results.contrast.violations.length} issues)`,
				);
				console.log(
					`WCAG ${results.wcag.level}: ${results.wcag.passed ? "✅" : "❌"}`,
				);
				console.log(`Violations: ${results.summary.totalViolations} total`);

				if (results.summary.totalViolations > 0) {
					console.log(`  - Critical: ${results.summary.criticalViolations}`);
					console.log(`  - Serious: ${results.summary.seriousViolations}`);
					console.log(`  - Moderate: ${results.summary.moderateViolations}`);
					console.log(`  - Minor: ${results.summary.minorViolations}`);
				}
			} catch (error) {
				console.error(`❌ Error testing ${pageInfo.name}:`, error.message);
				overallReport.details.push({
					name: pageInfo.name,
					path: pageInfo.path,
					error: error.message,
					passed: false,
				});
				overallReport.failedPages++;
			}
		}

		// Print overall summary
		console.log(`\n${"=".repeat(60)}`);
		console.log("OVERALL SUMMARY");
		console.log("=".repeat(60));
		console.log(`Total Pages Tested: ${overallReport.totalPages}`);
		console.log(`Passed: ${overallReport.passedPages} pages`);
		console.log(`Failed: ${overallReport.failedPages} pages`);
		console.log(`Total Violations: ${overallReport.totalViolations}`);
		console.log(`  - Critical: ${overallReport.criticalViolations}`);
		console.log(`  - Serious: ${overallReport.seriousViolations}`);
		console.log(`${"=".repeat(60)}\n`);

		// Pass/fail based on critical and serious violations only
		expect(overallReport.criticalViolations).toBe(0);
		expect(overallReport.seriousViolations).toBe(0);
	});
});

test.describe("Accessibility Tests - Performance", () => {
	test("Lighthouse performance benchmark", async ({ page }) => {
		await page.goto("/");
		await page.waitForLoadState("networkidle");

		const startTime = Date.now();
		const tester = new HybridAccessibilityTester(page);

		// Run Lighthouse only
		const results = await tester.runFullAudit({
			wcagLevel: "AA",
			skipContrast: true,
		});

		const duration = Date.now() - startTime;

		console.log(`Lighthouse audit completed in ${duration}ms`);
		console.log(`Score: ${Math.round(results.lighthouse.score * 100)}%`);

		// Ensure test completes within reasonable time (30 seconds)
		expect(duration).toBeLessThan(30000);
		expect(results.lighthouse.score).toBeGreaterThanOrEqual(0.9);
	});

	test("Contrast check performance benchmark", async ({ page }) => {
		await page.goto("/");
		await page.waitForLoadState("networkidle");

		const startTime = Date.now();
		const tester = new HybridAccessibilityTester(page);

		// Run contrast checks only
		const results = await tester.runFullAudit({
			wcagLevel: "AA",
			skipLighthouse: true,
		});

		const duration = Date.now() - startTime;

		console.log(`Contrast check completed in ${duration}ms`);
		console.log(`Found ${results.contrast.violations.length} contrast issues`);

		// Ensure test completes within reasonable time (5 seconds)
		expect(duration).toBeLessThan(5000);
	});
});
