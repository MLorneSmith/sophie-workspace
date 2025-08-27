#!/usr/bin/env node

/**
 * Pre-flight Selector Validation Tool
 * Validates critical data-testid selectors exist before running E2E tests
 */

const fs = require("node:fs").promises;
const path = require("node:path");

// Critical selectors that should exist for E2E tests
// Note: Only includes selectors actually used by E2E tests
const CRITICAL_SELECTORS = [
	// Auth selectors (used in auth.spec.ts)
	'[data-testid="sign-in-email"]',
	'[data-testid="sign-in-password"]',
	'[data-testid="sign-in-button"]',
	'[data-testid="sign-up-email"]',
	'[data-testid="sign-up-password"]',
	'[data-testid="sign-up-button"]',

	// Common UI selectors
	'[data-testid="loading-spinner"]',

	// Account/Team selectors
	'[data-testid="account-dropdown"]',
	'[data-testid="team-selector"]',

	// Navigation selectors - NOT currently used by E2E tests
	// Uncomment these if/when tests are added that need them:
	// '[data-testid="home-link"]',
	// '[data-testid="dashboard-link"]',
	// '[data-testid="settings-link"]',
];

class SelectorValidator {
	constructor() {
		this.projectRoot = process.cwd();
		this.searchPaths = [
			path.join(this.projectRoot, "apps/web"),
			path.join(this.projectRoot, "packages"),
		];
		this.results = {
			found: [],
			missing: [],
			files: [],
			coverage: 0,
		};
	}

	async validate() {
		console.log("🔍 Pre-flight Selector Validation");
		console.log("═".repeat(40));

		// Find all React/TSX files in web app
		const files = await this.findSourceFiles();
		console.log(`📁 Found ${files.length} source files`);

		// Search for selectors
		await this.searchSelectors(files);

		// Generate report
		this.generateReport();

		return {
			passed: this.results.missing.length === 0,
			coverage: this.results.coverage,
			missing: this.results.missing,
			found: this.results.found.length,
		};
	}

	async findSourceFiles() {
		const files = [];

		async function walkDir(dir) {
			const entries = await fs.readdir(dir, { withFileTypes: true });

			for (const entry of entries) {
				const fullPath = path.join(dir, entry.name);

				if (entry.isDirectory()) {
					// Skip certain directories
					if (["node_modules", ".next", "dist"].includes(entry.name)) {
						continue;
					}
					await walkDir(fullPath);
				} else if (entry.isFile()) {
					// Include relevant file extensions
					if (
						/\.(tsx?|jsx?)$/.test(entry.name) &&
						!entry.name.includes(".test.") &&
						!entry.name.includes(".spec.")
					) {
						files.push(fullPath);
					}
				}
			}
		}

		for (const searchPath of this.searchPaths) {
			try {
				await walkDir(searchPath);
			} catch (error) {
				console.log(`⚠️ Warning: Could not scan directory: ${error.message}`);
			}
		}

		return files;
	}

	async searchSelectors(files) {
		for (const file of files) {
			try {
				const content = await fs.readFile(file, "utf8");
				this.results.files.push(file);

				// Check each critical selector
				for (const selector of CRITICAL_SELECTORS) {
					const testId = selector.match(/data-testid="([^"]+)"/)?.[1];
					if (testId && content.includes(`data-testid="${testId}"`)) {
						if (!this.results.found.includes(testId)) {
							this.results.found.push(testId);
						}
					}
				}
			} catch (error) {
				// Ignore files that can't be read
			}
		}

		// Identify missing selectors
		for (const selector of CRITICAL_SELECTORS) {
			const testId = selector.match(/data-testid="([^"]+)"/)?.[1];
			if (testId && !this.results.found.includes(testId)) {
				this.results.missing.push(testId);
			}
		}

		this.results.coverage = (
			(this.results.found.length / CRITICAL_SELECTORS.length) *
			100
		).toFixed(1);
	}

	generateReport() {
		console.log(`\n📊 Selector Coverage: ${this.results.coverage}%`);
		console.log(
			`✅ Found: ${this.results.found.length}/${CRITICAL_SELECTORS.length}`,
		);

		if (this.results.found.length > 0) {
			console.log("\n✅ Found Selectors:");
			this.results.found.forEach((selector) => {
				console.log(`   ✓ data-testid="${selector}"`);
			});
		}

		if (this.results.missing.length > 0) {
			console.log("\n❌ Missing Selectors:");
			this.results.missing.forEach((selector) => {
				console.log(`   ✗ data-testid="${selector}"`);
			});

			console.log("\n💡 Recommendations:");
			console.log("   1. Add missing data-testid attributes to UI components");
			console.log("   2. Check E2E test files for required selectors");
			console.log(
				"   3. Consider reducing E2E test scope if selectors are intentionally missing",
			);
		} else {
			console.log("\n🎉 All critical selectors found!");
		}
	}

	/**
	 * Generate actionable fix suggestions for missing selectors
	 */
	generateFixSuggestions() {
		if (this.results.missing.length === 0) return [];

		const fixes = [];

		// Group missing selectors by likely component/page
		const authSelectors = this.results.missing.filter(
			(s) => s.includes("sign-in") || s.includes("sign-up"),
		);
		const navSelectors = this.results.missing.filter(
			(s) => s.includes("link") || s.includes("dropdown"),
		);
		const buttonSelectors = this.results.missing.filter((s) =>
			s.includes("button"),
		);

		if (authSelectors.length > 0) {
			fixes.push({
				area: "Authentication Components",
				selectors: authSelectors,
				suggestedFiles: [
					"apps/web/app/auth/sign-in/page.tsx",
					"apps/web/app/auth/sign-up/page.tsx",
				],
				priority: "high",
			});
		}

		if (navSelectors.length > 0) {
			fixes.push({
				area: "Navigation Components",
				selectors: navSelectors,
				suggestedFiles: [
					"apps/web/app/_components/site-header.tsx",
					"apps/web/app/_components/site-navigation.tsx",
				],
				priority: "medium",
			});
		}

		if (buttonSelectors.length > 0) {
			fixes.push({
				area: "Common UI Components",
				selectors: buttonSelectors,
				suggestedFiles: [
					"packages/ui/src/button.tsx",
					"packages/ui/src/form.tsx",
				],
				priority: "high",
			});
		}

		return fixes;
	}
}

// Main execution
async function main() {
	const validator = new SelectorValidator();
	const result = await validator.validate();

	// Exit with appropriate code for CI/testing integration
	process.exit(result.passed ? 0 : 1);
}

if (require.main === module) {
	main().catch((error) => {
		console.error("❌ Selector validation failed:", error.message);
		process.exit(1);
	});
}

module.exports = { SelectorValidator };
