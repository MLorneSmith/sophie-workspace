import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("Color Contrast Test", () => {
	test("Check color contrast specifically", async ({ page }) => {
		await page.goto("/");

		// Wait for page to load
		await page.waitForLoadState("networkidle");

		// Run axe specifically for color contrast
		const accessibilityScanResults = await new AxeBuilder({ page })
			.withRules(["color-contrast"])
			.analyze();

		// Print any violations for debugging
		if (accessibilityScanResults.violations.length > 0) {
			console.log("Color contrast violations found:");
			accessibilityScanResults.violations.forEach((violation) => {
				console.log(`- ${violation.help}`);
				violation.nodes.forEach((node) => {
					console.log(`  Element: ${node.html}`);
					console.log(`  Impact: ${node.impact}`);
					console.log(`  Summary: ${node.failureSummary}`);
				});
			});
		}

		expect(accessibilityScanResults.violations).toEqual([]);
	});
});
