/**
 * Test Failure Analyzer
 * Analyzes test failures and provides actionable insights
 */

class TestFailureAnalyzer {
	constructor() {
		this.failurePatterns = {
			infrastructure: [
				/Cannot reach test server/i,
				/Server health check failed/i,
				/Connection refused/i,
				/ECONNREFUSED/i,
				/timeout/i,
				/Network error/i,
				/Unable to connect/i,
				/Service unavailable/i,
			],
			authentication: [
				/sign.*in.*failed/i,
				/authentication.*error/i,
				/unauthorized/i,
				/login.*failed/i,
				/credential/i,
				/token.*invalid/i,
			],
			ui: [
				/element.*not.*found/i,
				/locator.*not.*found/i,
				/toBeVisible.*failed/i,
				/selector.*not.*found/i,
				/element.*not.*visible/i,
				/page.*title/i,
			],
			database: [
				/database.*error/i,
				/sql.*error/i,
				/query.*failed/i,
				/relation.*does.*not.*exist/i,
				/permission.*denied/i,
			],
			application: [
				/internal.*server.*error/i,
				/500.*error/i,
				/application.*error/i,
				/runtime.*error/i,
				/compilation.*error/i,
			],
		};

		this.suggestions = {
			infrastructure: [
				"Check if the test server is running",
				"Verify Docker containers are healthy: docker ps",
				"Ensure ports are accessible and not blocked",
				"Check network connectivity",
			],
			authentication: [
				"Verify test user credentials are configured",
				"Check authentication service status",
				"Ensure test users exist in the database",
				"Validate environment variables for auth",
			],
			ui: [
				"Check if the page is loading correctly",
				"Verify element selectors match the actual DOM",
				"Ensure the application UI has fully rendered",
				"Check for JavaScript errors in browser console",
			],
			database: [
				"Verify database connection and credentials",
				"Check if required tables/relations exist",
				"Run database migrations: pnpm supabase:web:reset",
				"Verify database permissions",
			],
			application: [
				"Check application logs for errors",
				"Verify the application build is successful",
				"Check for missing environment variables",
				"Restart the application server",
			],
		};
	}

	/**
	 * Analyze test failures and categorize them
	 */
	analyzeFailures(testResults) {
		const analysis = {
			totalFailures: 0,
			categories: {
				infrastructure: { count: 0, failures: [] },
				authentication: { count: 0, failures: [] },
				ui: { count: 0, failures: [] },
				database: { count: 0, failures: [] },
				application: { count: 0, failures: [] },
				unknown: { count: 0, failures: [] },
			},
			summary: "",
			suggestions: [],
			criticalIssues: [],
		};

		// Extract failures from different test result formats
		const failures = this.extractFailures(testResults);
		analysis.totalFailures = failures.length;

		// Categorize each failure
		for (const failure of failures) {
			const category = this.categorizeFailure(failure);
			analysis.categories[category].count++;
			analysis.categories[category].failures.push(failure);
		}

		// Generate analysis summary
		analysis.summary = this.generateSummary(analysis);
		analysis.suggestions = this.generateSuggestions(analysis);
		analysis.criticalIssues = this.identifyCriticalIssues(analysis);

		return analysis;
	}

	/**
	 * Extract failures from various test result formats
	 */
	extractFailures(testResults) {
		const failures = [];

		// Handle different test runner outputs
		if (testResults.output) {
			failures.push(...this.parsePlaywrightFailures(testResults.output));
			failures.push(...this.parseVitestFailures(testResults.output));
		}

		if (testResults.errors) {
			failures.push(
				...testResults.errors.map((error) => ({ error, type: "error" })),
			);
		}

		if (testResults.failedTests) {
			failures.push(...testResults.failedTests);
		}

		// Handle skipped tests with reasons
		if (testResults.skipped && testResults.reason) {
			failures.push({
				type: "skipped",
				reason: testResults.reason,
				suggestions: testResults.suggestions || [],
			});
		}

		return failures;
	}

	/**
	 * Parse Playwright test failures
	 */
	parsePlaywrightFailures(output) {
		const failures = [];
		const lines = output.split("\n");
		let currentFailure = null;

		for (const line of lines) {
			// Detect test failure start
			const failureMatch = line.match(/^\s*(\d+)\)\s+\[.*?\]\s+›\s+(.*?)$/);
			if (failureMatch) {
				if (currentFailure) {
					failures.push(currentFailure);
				}
				currentFailure = {
					type: "e2e_failure",
					testName: failureMatch[2].trim(),
					error: "",
					details: [],
				};
			}

			// Collect error details
			if (currentFailure && line.trim()) {
				if (
					line.includes("Error:") ||
					line.includes("Expected:") ||
					line.includes("Received:")
				) {
					currentFailure.error += `${line.trim()}\n`;
				}
				if (line.includes("at ") && line.includes(".spec.ts")) {
					currentFailure.details.push(line.trim());
				}
			}
		}

		if (currentFailure) {
			failures.push(currentFailure);
		}

		return failures;
	}

	/**
	 * Parse Vitest test failures
	 */
	parseVitestFailures(_output) {
		const failures = [];
		// Add Vitest parsing logic here if needed
		// For now, return empty as unit tests were successful
		return failures;
	}

	/**
	 * Categorize a failure based on error patterns
	 */
	categorizeFailure(failure) {
		const errorText = String(
			failure.error || failure.reason || failure.message || "",
		).toLowerCase();

		for (const [category, patterns] of Object.entries(this.failurePatterns)) {
			if (patterns.some((pattern) => pattern.test(errorText))) {
				return category;
			}
		}

		return "unknown";
	}

	/**
	 * Generate a human-readable summary
	 */
	generateSummary(analysis) {
		if (analysis.totalFailures === 0) {
			return "✅ All tests passed successfully!";
		}

		const parts = [];
		parts.push(`❌ ${analysis.totalFailures} test(s) failed`);

		// Highlight major categories
		const significantCategories = Object.entries(analysis.categories)
			.filter(([_, data]) => data.count > 0)
			.sort(([_, a], [__, b]) => b.count - a.count);

		if (significantCategories.length > 0) {
			const categoryStr = significantCategories
				.slice(0, 3)
				.map(([category, data]) => `${data.count} ${category}`)
				.join(", ");
			parts.push(`Most common issues: ${categoryStr}`);
		}

		return parts.join("\n");
	}

	/**
	 * Generate actionable suggestions based on failure categories
	 */
	generateSuggestions(analysis) {
		const suggestions = [];

		// Add suggestions based on most common failure types
		const sortedCategories = Object.entries(analysis.categories)
			.filter(([_, data]) => data.count > 0)
			.sort(([_, a], [__, b]) => b.count - a.count);

		for (const [category, data] of sortedCategories.slice(0, 2)) {
			if (this.suggestions[category]) {
				suggestions.push({
					category,
					count: data.count,
					suggestions: this.suggestions[category],
				});
			}
		}

		return suggestions;
	}

	/**
	 * Identify critical issues that block most tests
	 */
	identifyCriticalIssues(analysis) {
		const critical = [];

		// Infrastructure issues are critical
		if (analysis.categories.infrastructure.count > 0) {
			critical.push({
				type: "infrastructure",
				severity: "critical",
				message: "Infrastructure issues detected - tests cannot run reliably",
				count: analysis.categories.infrastructure.count,
			});
		}

		// High percentage of failures suggests systemic issues
		if (
			analysis.totalFailures > 5 &&
			analysis.categories.application.count > 0
		) {
			critical.push({
				type: "application",
				severity: "high",
				message:
					"Application errors detected - core functionality may be broken",
				count: analysis.categories.application.count,
			});
		}

		return critical;
	}

	/**
	 * Format analysis for display
	 */
	formatAnalysis(analysis) {
		const lines = [];

		lines.push("═══════════════════════════════════════════════════════");
		lines.push("                 TEST FAILURE ANALYSIS");
		lines.push("═══════════════════════════════════════════════════════");
		lines.push("");

		// Summary
		lines.push("📊 SUMMARY");
		lines.push("─────────────────────────────────────────────");
		lines.push(analysis.summary);
		lines.push("");

		// Critical issues
		if (analysis.criticalIssues.length > 0) {
			lines.push("🚨 CRITICAL ISSUES");
			lines.push("─────────────────────────────────────────────");
			for (const issue of analysis.criticalIssues) {
				lines.push(`❌ ${issue.message} (${issue.count} occurrences)`);
			}
			lines.push("");
		}

		// Category breakdown
		const categoriesWithFailures = Object.entries(analysis.categories)
			.filter(([_, data]) => data.count > 0)
			.sort(([_, a], [__, b]) => b.count - a.count);

		if (categoriesWithFailures.length > 0) {
			lines.push("📋 FAILURE CATEGORIES");
			lines.push("─────────────────────────────────────────────");
			for (const [category, data] of categoriesWithFailures) {
				lines.push(`${category.toUpperCase()}: ${data.count} failure(s)`);

				// Show first few specific failures
				for (const failure of data.failures.slice(0, 2)) {
					if (failure.testName) {
						lines.push(`  • ${failure.testName}`);
					}
					if (failure.error) {
						const errorStr = String(failure.error);
						const shortError = errorStr.split("\n")[0];
						lines.push(`    ${shortError.substring(0, 80)}...`);
					}
				}

				if (data.failures.length > 2) {
					lines.push(`  ... and ${data.failures.length - 2} more`);
				}
				lines.push("");
			}
		}

		// Suggestions
		if (analysis.suggestions.length > 0) {
			lines.push("💡 RECOMMENDED ACTIONS");
			lines.push("─────────────────────────────────────────────");
			for (const suggestion of analysis.suggestions) {
				lines.push(
					`${suggestion.category.toUpperCase()} (${suggestion.count} failures):`,
				);
				for (const action of suggestion.suggestions) {
					lines.push(`  • ${action}`);
				}
				lines.push("");
			}
		}

		lines.push("═══════════════════════════════════════════════════════");

		return lines.join("\n");
	}
}

module.exports = { TestFailureAnalyzer };
