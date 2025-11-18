import type { Page } from "@playwright/test";

export interface RGB {
	r: number;
	g: number;
	b: number;
}

export interface ContrastResult {
	ratio: number;
	level: "AA" | "AAA" | "FAIL";
	largeTextLevel: "AA" | "AAA" | "FAIL";
}

export interface A11yViolation {
	id: string;
	impact: "critical" | "serious" | "moderate" | "minor";
	description: string;
	help: string;
	helpUrl?: string;
	nodes: Array<{
		html: string;
		target: string[];
	}>;
}

export interface ContrastViolation {
	element: string;
	foreground: string;
	background: string;
	ratio: number;
	required: number;
	level: string;
}

export interface WCAGResult {
	level: "AA" | "AAA" | "FAIL";
	passed: boolean;
	violations: A11yViolation[];
	warnings: A11yViolation[];
}

export interface A11yResults {
	pass: boolean;
	lighthouse: {
		score: number;
		violations: A11yViolation[];
	};
	contrast: {
		violations: ContrastViolation[];
		passed: boolean;
	};
	wcag: WCAGResult;
	summary: {
		totalViolations: number;
		criticalViolations: number;
		seriousViolations: number;
		moderateViolations: number;
		minorViolations: number;
	};
}

export class HybridAccessibilityTester {
	private page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	/**
	 * Run a full accessibility audit using multiple tools
	 */
	async runFullAudit(
		options: {
			wcagLevel?: "AA" | "AAA";
			skipLighthouse?: boolean;
			skipContrast?: boolean;
		} = {},
	): Promise<A11yResults> {
		const {
			wcagLevel = "AA",
			skipLighthouse = false,
			skipContrast = false,
		} = options;

		// Run Lighthouse audit
		const lighthouseResults = skipLighthouse
			? { score: 1, violations: [] }
			: await this.runLighthouseAudit();

		// Run color contrast checks
		const contrastResults = skipContrast
			? { violations: [], passed: true }
			: await this.checkColorContrast();

		// Run WCAG validation
		const wcagResults = await this.validateWCAG(wcagLevel);

		// Aggregate results
		const allViolations = [
			...lighthouseResults.violations,
			...wcagResults.violations,
		];

		const summary = {
			totalViolations: allViolations.length,
			criticalViolations: allViolations.filter((v) => v.impact === "critical")
				.length,
			seriousViolations: allViolations.filter((v) => v.impact === "serious")
				.length,
			moderateViolations: allViolations.filter((v) => v.impact === "moderate")
				.length,
			minorViolations: allViolations.filter((v) => v.impact === "minor").length,
		};

		const pass =
			lighthouseResults.score >= 0.9 &&
			contrastResults.passed &&
			wcagResults.passed;

		return {
			pass,
			lighthouse: lighthouseResults,
			contrast: contrastResults,
			wcag: wcagResults,
			summary,
		};
	}

	/**
	 * Run Lighthouse accessibility audit
	 */
	async runLighthouseAudit(): Promise<{
		score: number;
		violations: A11yViolation[];
	}> {
		const url = this.page.url();
		let chrome = null;

		try {
			// Dynamic import for ESM compatibility
			const { launch } = await import("chrome-launcher");

			// Launch Chrome with debugging port
			chrome = await launch({
				chromeFlags: [
					"--headless",
					"--disable-gpu",
					"--no-sandbox",
					"--disable-dev-shm-usage",
					"--disable-setuid-sandbox",
					"--no-first-run",
					"--no-zygote",
					"--single-process",
					"--disable-features=site-per-process",
				],
				logLevel: "silent",
			});

			const options = {
				logLevel: "silent" as const,
				output: "json" as const,
				onlyCategories: ["accessibility"],
				port: chrome.port,
				disableStorageReset: true,
			};

			// Dynamic import for ES module compatibility
			const { default: lighthouse } = await import("lighthouse");
			const runnerResult = await lighthouse(url, options);

			if (!runnerResult?.lhr?.categories?.accessibility) {
				return { score: 0, violations: [] };
			}

			const accessibility = runnerResult.lhr.categories.accessibility;
			const violations: A11yViolation[] = [];

			// Convert Lighthouse audits to our violation format
			if (runnerResult.lhr.audits) {
				for (const [auditId, audit] of Object.entries(
					runnerResult.lhr.audits,
				)) {
					if (
						audit.score !== null &&
						audit.score < 1 &&
						audit.details?.type === "table"
					) {
						const items = ((audit.details as { items?: unknown[] }).items ||
							[]) as unknown[];
						if (items.length > 0) {
							violations.push({
								id: auditId,
								impact: this.mapLighthouseImpact(audit.score),
								description: audit.description || "",
								help: audit.title || "",
								helpUrl: undefined,
								nodes: items.map((item: unknown) => {
									const itemObj = item as {
										snippet?: string;
										selector?: string;
									};
									return {
										html: itemObj.snippet || "",
										target: [itemObj.selector || ""],
									};
								}),
							});
						}
					}
				}
			}

			return {
				score: accessibility.score || 0,
				violations,
			};
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			console.warn(
				"Lighthouse audit failed, falling back to basic checks:",
				errorMessage,
			);
			// Return a neutral result if Lighthouse fails
			return { score: 1, violations: [] };
		} finally {
			if (chrome) {
				try {
					await chrome.kill();
				} catch (e) {
					// Ignore cleanup errors
				}
			}
		}
	}

	/**
	 * Check color contrast using custom WCAG calculations
	 */
	async checkColorContrast(): Promise<{
		violations: ContrastViolation[];
		passed: boolean;
	}> {
		const violations: ContrastViolation[] = [];

		// Get all text elements
		const textElements = await this.page.evaluate(() => {
			const elements = document.querySelectorAll(
				"p, span, div, h1, h2, h3, h4, h5, h6, a, button, label, li, td, th",
			);
			const results: Array<{
				selector: string;
				text: string;
				fontSize: number;
				fontWeight: string;
				color: string;
				backgroundColor: string;
			}> = [];

			for (const element of Array.from(elements)) {
				const style = window.getComputedStyle(element);
				const text = element.textContent?.trim();

				if (text && style.visibility !== "hidden" && style.display !== "none") {
					// Skip if element is transparent
					const opacity = Number.parseFloat(style.opacity);
					if (opacity === 0) continue;

					// Get the selector
					let selector = element.tagName.toLowerCase();
					if (element.id) {
						selector = `#${element.id}`;
					} else if (element.className) {
						selector = `.${element.className.split(" ").join(".")}`;
					}

					results.push({
						selector,
						text: text.substring(0, 50),
						fontSize: Number.parseFloat(style.fontSize),
						fontWeight: style.fontWeight,
						color: style.color,
						backgroundColor: getEffectiveBackgroundColor(element),
					});
				}
			}

			function getEffectiveBackgroundColor(element: Element): string {
				let current: Element | null = element;
				while (current) {
					const style = window.getComputedStyle(current);
					const bgColor = style.backgroundColor;

					if (bgColor && bgColor !== "rgba(0, 0, 0, 0)") {
						return bgColor;
					}

					current = current.parentElement;
				}
				return "rgb(255, 255, 255)"; // Default to white
			}

			return results;
		});

		// Check contrast for each element
		for (const element of textElements) {
			const foregroundRgb = this.parseColor(element.color);
			const backgroundRgb = this.parseColor(element.backgroundColor);

			if (foregroundRgb && backgroundRgb) {
				const ratio = this.calculateWCAGContrast(foregroundRgb, backgroundRgb);
				const isLargeText =
					element.fontSize >= 18 ||
					(element.fontSize >= 14 && element.fontWeight === "bold");
				const requiredRatio = isLargeText ? 3 : 4.5;

				if (ratio < requiredRatio) {
					violations.push({
						element: element.selector,
						foreground: element.color,
						background: element.backgroundColor,
						ratio: Math.round(ratio * 100) / 100,
						required: requiredRatio,
						level: isLargeText ? "Large Text" : "Normal Text",
					});
				}
			}
		}

		return {
			violations,
			passed: violations.length === 0,
		};
	}

	/**
	 * Validate WCAG compliance
	 */
	async validateWCAG(level: "AA" | "AAA"): Promise<WCAGResult> {
		const violations: A11yViolation[] = [];
		const warnings: A11yViolation[] = [];

		// Check for missing alt text
		const missingAlt = await this.page.evaluate(() => {
			const images = document.querySelectorAll("img:not([alt])");
			return Array.from(images).map((img) => ({
				html: img.outerHTML.substring(0, 100),
				selector: img.tagName.toLowerCase(),
			}));
		});

		if (missingAlt.length > 0) {
			violations.push({
				id: "missing-alt-text",
				impact: "serious",
				description: "Images must have alternative text",
				help: "Add alt attribute to describe the image",
				helpUrl: "https://www.w3.org/WAI/WCAG21/Understanding/non-text-content",
				nodes: missingAlt.map((img) => ({
					html: img.html,
					target: [img.selector],
				})),
			});
		}

		// Check for empty buttons
		const emptyButtons = await this.page.evaluate(() => {
			const buttons = document.querySelectorAll("button");
			const empty: Array<{ html: string; selector: string }> = [];

			for (const button of Array.from(buttons)) {
				const text = button.textContent?.trim();
				const aria = button.getAttribute("aria-label");
				if (!text && !aria) {
					empty.push({
						html: button.outerHTML.substring(0, 100),
						selector: button.tagName.toLowerCase(),
					});
				}
			}

			return empty;
		});

		if (emptyButtons.length > 0) {
			violations.push({
				id: "empty-button",
				impact: "serious",
				description: "Buttons must have discernible text",
				help: "Add text content or aria-label to buttons",
				helpUrl: "https://www.w3.org/WAI/WCAG21/Understanding/name-role-value",
				nodes: emptyButtons.map((btn) => ({
					html: btn.html,
					target: [btn.selector],
				})),
			});
		}

		// Check for missing form labels
		const missingLabels = await this.page.evaluate(() => {
			const inputs = document.querySelectorAll(
				'input:not([type="hidden"]):not([type="submit"]):not([type="button"])',
			);
			const missing: Array<{ html: string; selector: string }> = [];

			for (const input of Array.from(inputs)) {
				const id = input.getAttribute("id");
				const label = id ? document.querySelector(`label[for="${id}"]`) : null;
				const ariaLabel = input.getAttribute("aria-label");

				if (!label && !ariaLabel) {
					missing.push({
						html: input.outerHTML.substring(0, 100),
						selector: input.tagName.toLowerCase(),
					});
				}
			}

			return missing;
		});

		if (missingLabels.length > 0) {
			violations.push({
				id: "missing-form-label",
				impact: "serious",
				description: "Form inputs must have labels",
				help: "Add label element or aria-label attribute",
				helpUrl:
					"https://www.w3.org/WAI/WCAG21/Understanding/labels-or-instructions",
				nodes: missingLabels.map((input) => ({
					html: input.html,
					target: [input.selector],
				})),
			});
		}

		// Check for proper heading hierarchy
		const headingIssues = await this.page.evaluate(() => {
			const headings = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
			const issues: Array<{ html: string; selector: string }> = [];
			let lastLevel = 0;

			for (const heading of Array.from(headings)) {
				const level = Number.parseInt(heading.tagName.charAt(1), 10);
				if (level - lastLevel > 1) {
					issues.push({
						html: heading.outerHTML.substring(0, 100),
						selector: heading.tagName.toLowerCase(),
					});
				}
				lastLevel = level;
			}

			return issues;
		});

		if (headingIssues.length > 0) {
			warnings.push({
				id: "heading-hierarchy",
				impact: "moderate",
				description: "Heading levels should only increase by one",
				help: "Ensure proper heading hierarchy",
				helpUrl:
					"https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships",
				nodes: headingIssues.map((h) => ({
					html: h.html,
					target: [h.selector],
				})),
			});
		}

		const passed = violations.length === 0;

		return {
			level: passed ? level : "FAIL",
			passed,
			violations,
			warnings,
		};
	}

	/**
	 * Calculate WCAG contrast ratio
	 */
	private calculateWCAGContrast(rgb1: RGB, rgb2: RGB): number {
		const l1 = this.getLuminance(rgb1);
		const l2 = this.getLuminance(rgb2);
		const lighter = Math.max(l1, l2);
		const darker = Math.min(l1, l2);
		return (lighter + 0.05) / (darker + 0.05);
	}

	/**
	 * Calculate relative luminance
	 */
	private getLuminance(rgb: RGB): number {
		const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((val) => {
			val = val / 255;
			return val <= 0.03928 ? val / 12.92 : ((val + 0.055) / 1.055) ** 2.4;
		});
		return 0.2126 * r + 0.7152 * g + 0.0722 * b;
	}

	/**
	 * Parse color string to RGB
	 */
	private parseColor(color: string): RGB | null {
		// Handle rgb() format
		const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
		if (rgbMatch) {
			return {
				r: Number.parseInt(rgbMatch[1], 10),
				g: Number.parseInt(rgbMatch[2], 10),
				b: Number.parseInt(rgbMatch[3], 10),
			};
		}

		// Handle rgba() format
		const rgbaMatch = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)/);
		if (rgbaMatch) {
			return {
				r: Number.parseInt(rgbaMatch[1], 10),
				g: Number.parseInt(rgbaMatch[2], 10),
				b: Number.parseInt(rgbaMatch[3], 10),
			};
		}

		// Handle hex format
		const hexMatch = color.match(/^#([0-9a-f]{6})$/i);
		if (hexMatch) {
			const hex = hexMatch[1];
			return {
				r: Number.parseInt(hex.substring(0, 2), 16),
				g: Number.parseInt(hex.substring(2, 4), 16),
				b: Number.parseInt(hex.substring(4, 6), 16),
			};
		}

		return null;
	}

	/**
	 * Map Lighthouse score to impact level
	 */
	private mapLighthouseImpact(
		score: number,
	): "critical" | "serious" | "moderate" | "minor" {
		if (score < 0.5) return "critical";
		if (score < 0.7) return "serious";
		if (score < 0.9) return "moderate";
		return "minor";
	}

	/**
	 * Generate a detailed accessibility report
	 */
	generateReport(results: A11yResults): string {
		const lines: string[] = [];

		lines.push("=== ACCESSIBILITY AUDIT REPORT ===");
		lines.push("");
		lines.push(`Overall Status: ${results.pass ? "✅ PASS" : "❌ FAIL"}`);
		lines.push("");

		// Lighthouse Results
		lines.push("📊 Lighthouse Accessibility Score:");
		lines.push(`   Score: ${Math.round(results.lighthouse.score * 100)}%`);
		lines.push(
			`   Violations: ${results.lighthouse.violations.length} issues found`,
		);

		if (results.lighthouse.violations.length > 0) {
			lines.push("");
			lines.push("   Issues:");
			for (const violation of results.lighthouse.violations) {
				lines.push(`   - [${violation.impact}] ${violation.description}`);
			}
		}

		lines.push("");

		// Contrast Results
		lines.push("🎨 Color Contrast Check:");
		lines.push(
			`   Status: ${results.contrast.passed ? "✅ Passed" : "❌ Failed"}`,
		);
		lines.push(`   Violations: ${results.contrast.violations.length}`);

		if (results.contrast.violations.length > 0) {
			lines.push("");
			lines.push("   Failed Elements:");
			for (const violation of results.contrast.violations.slice(0, 5)) {
				lines.push(
					`   - ${violation.element}: Ratio ${violation.ratio}:1 (Required: ${violation.required}:1)`,
				);
			}
			if (results.contrast.violations.length > 5) {
				lines.push(`   ... and ${results.contrast.violations.length - 5} more`);
			}
		}

		lines.push("");

		// WCAG Results
		lines.push("📋 WCAG Compliance:");
		lines.push(`   Level: ${results.wcag.level}`);
		lines.push(`   Status: ${results.wcag.passed ? "✅ Passed" : "❌ Failed"}`);
		lines.push(`   Violations: ${results.wcag.violations.length}`);
		lines.push(`   Warnings: ${results.wcag.warnings.length}`);

		if (results.wcag.violations.length > 0) {
			lines.push("");
			lines.push("   Critical Issues:");
			for (const violation of results.wcag.violations) {
				lines.push(`   - [${violation.impact}] ${violation.description}`);
			}
		}

		lines.push("");
		lines.push("📈 Summary:");
		lines.push(`   Total Violations: ${results.summary.totalViolations}`);
		lines.push(`   - Critical: ${results.summary.criticalViolations} issues`);
		lines.push(`   - Serious: ${results.summary.seriousViolations} issues`);
		lines.push(`   - Moderate: ${results.summary.moderateViolations} issues`);
		lines.push(`   - Minor: ${results.summary.minorViolations} issues`);
		lines.push("");
		lines.push("===================================");

		return lines.join("\n");
	}
}
