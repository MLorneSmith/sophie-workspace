/**
 * Test Reporter Module
 * Generates test execution reports in various formats
 */

const fs = require("node:fs").promises;
const path = require("node:path");
const { TestFailureAnalyzer } = require("./test-failure-analyzer.cjs");

// Simple logging utility
function log(message, type = "info") {
	const timestamp = new Date().toISOString();
	process.stdout.write(`[${timestamp}] ${type.toUpperCase()}: ${message}\n`);
}

/**
 * Stringify JSON with tab indentation for Biome compatibility
 * @param {*} data - Data to stringify
 * @returns {string} JSON string with tab indentation
 */
function stringifyWithTabs(data) {
	return JSON.stringify(data, null, "\t");
}

function logError(message) {
	log(message, "error");
}

class TestReporter {
	constructor(config, testStatus) {
		this.config = config;
		this.testStatus = testStatus;
		this.failureAnalyzer = new TestFailureAnalyzer();
	}

	/**
	 * Generate complete test report
	 */
	async generateReport() {
		log("\n📊 Generating test report...");

		const status = this.testStatus.getStatus();
		const summary = this.testStatus.getSummary();

		const report = {
			timestamp: new Date().toISOString(),
			duration: summary.duration,
			summary: {
				total: summary.total,
				passed: summary.passed,
				failed: summary.failed,
				skipped: summary.skipped,
				success: summary.success,
			},
			unit: status.unit,
			e2e: status.e2e,
			infrastructure: status.infrastructure,
			errors: status.errors,
			environment: {
				node: process.version,
				platform: process.platform,
				cwd: process.cwd(),
			},
		};

		// Generate reports in multiple formats
		const formats = this.config.reporting.formats;

		if (formats.includes("console")) {
			this.generateConsoleReport(report);
		}

		if (formats.includes("json")) {
			await this.generateJsonReport(report);
		}

		if (formats.includes("html")) {
			await this.generateHtmlReport(report);
		}

		if (formats.includes("markdown")) {
			await this.generateMarkdownReport(report);
		}

		return report;
	}

	/**
	 * Generate console report
	 */
	generateConsoleReport(report) {
		const { summary, unit, e2e } = report;

		console.log("\n" + "=".repeat(60));
		console.log("                TEST EXECUTION REPORT");
		console.log("=".repeat(60));

		console.log("\n📊 OVERALL SUMMARY");
		console.log("─".repeat(40));
		console.log(`Total Tests:    ${summary.total}`);
		console.log(`✅ Passed:      ${summary.passed}`);
		console.log(`❌ Failed:      ${summary.failed}`);
		console.log(`⏭️  Skipped:     ${summary.skipped}`);
		console.log(`Duration:       ${report.duration}s`);
		console.log(
			`Status:         ${summary.success ? "✅ SUCCESS" : "❌ FAILED"}`,
		);

		// Unit test details
		if (unit.total > 0) {
			console.log("\n📦 UNIT TESTS");
			console.log("─".repeat(40));
			console.log(`Total Tests:    ${unit.total}`);
			console.log(`✅ Passed:      ${unit.passed}`);
			console.log(`❌ Failed:      ${unit.failed}`);
			console.log(`⏭️  Skipped:     ${unit.skipped}`);
			console.log(`Duration:       ${unit.duration || "N/A"}`);

			if (unit.failedTests && unit.failedTests.length > 0) {
				console.log("\n❌ Failed Unit Tests:");
				unit.failedTests.forEach((test, index) => {
					console.log(`  ${index + 1}. ${test.file || test.error}`);
				});
			}
		}

		// E2E test details
		if (e2e.total > 0) {
			console.log("\n🌐 E2E TESTS");
			console.log("─".repeat(40));
			console.log(`Total Tests:    ${e2e.total}`);
			console.log(`✅ Passed:      ${e2e.passed}`);
			console.log(`❌ Failed:      ${e2e.failed}`);
			if (e2e.intentionalFailures > 0) {
				console.log(
					`🎯 Deliberate:   ${e2e.intentionalFailures} (intentional failures)`,
				);
			}
			console.log(`⏭️  Skipped:     ${e2e.skipped}`);
			if (e2e.integrationTests > 0) {
				console.log(`🔗 Integration:  ${e2e.integrationTests} tests`);
			}
			console.log(`Duration:       ${e2e.duration || "N/A"}`);

			// Show actual vs expected failures
			const actualFailures = e2e.failed;
			const expectedFailures = e2e.intentionalFailures || 0;
			if (actualFailures > 0 || expectedFailures > 0) {
				console.log("\n📊 Failure Analysis:");
				console.log(`  Expected failures: ${expectedFailures}`);
				console.log(`  Actual failures:   ${actualFailures}`);
				console.log(
					`  Unexpected failures: ${Math.max(0, actualFailures - expectedFailures)}`,
				);
			}

			// Shard details
			if (Object.keys(e2e.shards).length > 0) {
				console.log("\n📈 Test Group Results:");
				for (const [shardId, shard] of Object.entries(e2e.shards)) {
					const groupName = shard.groupName || `Group ${shardId}`;
					console.log(`  ${groupName}: ${shard.passed}/${shard.total} passed`);
					if (shard.intentionalFailures > 0) {
						console.log(
							`    └─ ${shard.intentionalFailures} deliberate failures`,
						);
					}
				}
			}
		}

		// Enhanced failure analysis for all tests
		this.generateAndDisplayFailureAnalysis(report);

		// Infrastructure status
		console.log("\n🔧 INFRASTRUCTURE");
		console.log("─".repeat(40));
		console.log(
			`Supabase:       ${this.formatStatus(report.infrastructure.supabase)}`,
		);
		console.log(
			`Database:       ${this.formatStatus(report.infrastructure.database)}`,
		);
		console.log(
			`Ports:          ${this.formatStatus(report.infrastructure.ports)}`,
		);
		console.log(
			`Environment:    ${this.formatStatus(report.infrastructure.environment)}`,
		);

		// Errors
		if (report.errors && report.errors.length > 0) {
			console.log("\n⚠️ ERRORS");
			console.log("─".repeat(40));
			report.errors.forEach((error, index) => {
				console.log(`${index + 1}. [${error.phase}] ${error.message}`);
			});
		}

		console.log("\n" + "=".repeat(60));
	}

	/**
	 * Generate JSON report
	 */
	async generateJsonReport(report) {
		const outputPath = path.join(
			this.config.reporting.outputDir,
			`test-report-${Date.now()}.json`,
		);

		await this.ensureDir(path.dirname(outputPath));
		await fs.writeFile(outputPath, stringifyWithTabs(report));

		log(`📄 JSON report saved to: ${outputPath}`);

		// Also save to the standard result file
		await fs.writeFile(this.config.paths.resultFile, stringifyWithTabs(report));
	}

	/**
	 * Generate HTML report
	 */
	async generateHtmlReport(report) {
		const html = `
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Test Report - ${new Date().toLocaleDateString()}</title>
	<style>
		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
			margin: 0;
			padding: 20px;
			background: #f5f5f5;
		}
		.container {
			max-width: 1200px;
			margin: 0 auto;
			background: white;
			border-radius: 8px;
			box-shadow: 0 2px 4px rgba(0,0,0,0.1);
			padding: 30px;
		}
		h1 {
			color: #333;
			border-bottom: 2px solid #e1e1e1;
			padding-bottom: 10px;
		}
		.summary {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
			gap: 20px;
			margin: 20px 0;
		}
		.summary-card {
			background: #f8f9fa;
			padding: 15px;
			border-radius: 6px;
			border-left: 4px solid #007bff;
		}
		.summary-card.success { border-left-color: #28a745; }
		.summary-card.failure { border-left-color: #dc3545; }
		.summary-card.warning { border-left-color: #ffc107; }
		.metric {
			font-size: 24px;
			font-weight: bold;
			color: #333;
		}
		.label {
			color: #666;
			font-size: 14px;
			margin-top: 5px;
		}
		.section {
			margin: 30px 0;
		}
		.section h2 {
			color: #555;
			font-size: 20px;
			margin-bottom: 15px;
		}
		table {
			width: 100%;
			border-collapse: collapse;
		}
		th, td {
			padding: 12px;
			text-align: left;
			border-bottom: 1px solid #e1e1e1;
		}
		th {
			background: #f8f9fa;
			font-weight: 600;
		}
		.status {
			display: inline-block;
			padding: 4px 8px;
			border-radius: 4px;
			font-size: 12px;
			font-weight: 600;
		}
		.status.passed { background: #d4edda; color: #155724; }
		.status.failed { background: #f8d7da; color: #721c24; }
		.status.skipped { background: #fff3cd; color: #856404; }
		.error {
			background: #f8d7da;
			border: 1px solid #f5c6cb;
			border-radius: 4px;
			padding: 10px;
			margin: 10px 0;
			color: #721c24;
		}
	</style>
</head>
<body>
	<div class="container">
		<h1>Test Execution Report</h1>
		<p>Generated: ${report.timestamp}</p>
		
		<div class="summary">
			<div class="summary-card ${report.summary.success ? "success" : "failure"}">
				<div class="metric">${report.summary.success ? "✅ PASSED" : "❌ FAILED"}</div>
				<div class="label">Overall Status</div>
			</div>
			<div class="summary-card">
				<div class="metric">${report.summary.total}</div>
				<div class="label">Total Tests</div>
			</div>
			<div class="summary-card">
				<div class="metric">${report.summary.passed}</div>
				<div class="label">Passed</div>
			</div>
			<div class="summary-card">
				<div class="metric">${report.summary.failed}</div>
				<div class="label">Failed</div>
			</div>
			<div class="summary-card">
				<div class="metric">${report.duration}s</div>
				<div class="label">Duration</div>
			</div>
		</div>
		
		<div class="section">
			<h2>Test Results</h2>
			<table>
				<thead>
					<tr>
						<th>Test Suite</th>
						<th>Total</th>
						<th>Passed</th>
						<th>Failed</th>
						<th>Skipped</th>
						<th>Duration</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>Unit Tests</td>
						<td>${report.unit.total}</td>
						<td><span class="status passed">${report.unit.passed}</span></td>
						<td><span class="status failed">${report.unit.failed}</span></td>
						<td><span class="status skipped">${report.unit.skipped}</span></td>
						<td>${report.unit.duration || "N/A"}</td>
					</tr>
					<tr>
						<td>E2E Tests</td>
						<td>${report.e2e.total}</td>
						<td><span class="status passed">${report.e2e.passed}</span></td>
						<td><span class="status failed">${report.e2e.failed}</span></td>
						<td><span class="status skipped">${report.e2e.skipped}</span></td>
						<td>${report.e2e.duration || "N/A"}</td>
					</tr>
				</tbody>
			</table>
		</div>
		
		${
			report.errors && report.errors.length > 0
				? `
		<div class="section">
			<h2>Errors</h2>
			${report.errors
				.map(
					(error) => `
				<div class="error">
					<strong>Phase:</strong> ${error.phase}<br>
					<strong>Message:</strong> ${error.message}
				</div>
			`,
				)
				.join("")}
		</div>
		`
				: ""
		}
	</div>
</body>
</html>
		`;

		const outputPath = path.join(
			this.config.reporting.outputDir,
			`test-report-${Date.now()}.html`,
		);

		await this.ensureDir(path.dirname(outputPath));
		await fs.writeFile(outputPath, html);

		log(`📄 HTML report saved to: ${outputPath}`);
	}

	/**
	 * Generate Markdown report
	 */
	async generateMarkdownReport(report) {
		const markdown = `
# Test Execution Report

**Generated:** ${report.timestamp}  
**Duration:** ${report.duration}s  
**Status:** ${report.summary.success ? "✅ SUCCESS" : "❌ FAILED"}

## Summary

| Metric | Value |
|--------|-------|
| Total Tests | ${report.summary.total} |
| Passed | ${report.summary.passed} |
| Failed | ${report.summary.failed} |
| Skipped | ${report.summary.skipped} |

## Test Results

### Unit Tests
- **Total:** ${report.unit.total}
- **Passed:** ${report.unit.passed}
- **Failed:** ${report.unit.failed}
- **Skipped:** ${report.unit.skipped}
- **Duration:** ${report.unit.duration || "N/A"}

${
	report.unit.failedTests && report.unit.failedTests.length > 0
		? `
#### Failed Unit Tests
${report.unit.failedTests.map((test, i) => `${i + 1}. ${test.file || test.error}`).join("\n")}
`
		: ""
}

### E2E Tests
- **Total:** ${report.e2e.total}
- **Passed:** ${report.e2e.passed}
- **Failed:** ${report.e2e.failed}
- **Skipped:** ${report.e2e.skipped}
- **Duration:** ${report.e2e.duration || "N/A"}

${
	Object.keys(report.e2e.shards).length > 0
		? `
#### Shard Results
${Object.entries(report.e2e.shards)
	.map(([id, shard]) => `- Shard ${id}: ${shard.passed}/${shard.total} passed`)
	.join("\n")}
`
		: ""
}

## Infrastructure Status

| Component | Status |
|-----------|--------|
| Supabase | ${report.infrastructure.supabase} |
| Database | ${report.infrastructure.database} |
| Ports | ${report.infrastructure.ports} |
| Environment | ${report.infrastructure.environment} |

${
	report.errors && report.errors.length > 0
		? `
## Errors

${report.errors
	.map((error, i) => `${i + 1}. **[${error.phase}]** ${error.message}`)
	.join("\n")}
`
		: ""
}

---
*Report generated by Test Controller*
		`;

		const outputPath = path.join(
			this.config.reporting.outputDir,
			`test-report-${Date.now()}.md`,
		);

		await this.ensureDir(path.dirname(outputPath));
		await fs.writeFile(outputPath, markdown.trim());

		log(`📄 Markdown report saved to: ${outputPath}`);
	}

	/**
	 * Format status for display
	 */
	formatStatus(status) {
		const statusMap = {
			healthy: "✅ Healthy",
			ready: "✅ Ready",
			started: "✅ Started",
			loaded: "✅ Loaded",
			created: "✅ Created",
			cleaned: "✅ Cleaned",
			not_running: "❌ Not Running",
			failed: "❌ Failed",
			missing: "⚠️ Missing",
			unknown: "❓ Unknown",
		};

		return statusMap[status] || status;
	}

	/**
	 * Ensure directory exists
	 */
	async ensureDir(dir) {
		try {
			await fs.access(dir);
		} catch {
			await fs.mkdir(dir, { recursive: true });
		}
	}

	/**
	 * Generate and display comprehensive failure analysis
	 */
	generateAndDisplayFailureAnalysis(report) {
		const hasFailures = report.summary.failed > 0;
		const hasSkipped = report.e2e.skipped > 0;
		const hasInfrastructureIssues =
			report.infrastructure.supabase !== "healthy" ||
			report.infrastructure.database !== "healthy";

		// Only show detailed analysis if there are issues to analyze
		if (!hasFailures && !hasSkipped && !hasInfrastructureIssues) {
			return;
		}

		// Combine all test results for analysis
		const testResults = {
			unit: report.unit,
			e2e: report.e2e,
			infrastructure: report.infrastructure,
			errors: report.errors || [],
			output: this.combineTestOutput(report),
		};

		// Analyze failures
		const analysis = this.failureAnalyzer.analyzeFailures(testResults);

		if (analysis.totalFailures > 0 || analysis.suggestions.length > 0) {
			console.log("\n" + this.failureAnalyzer.formatAnalysis(analysis));
		}
	}

	/**
	 * Combine test output from various sources for analysis
	 */
	combineTestOutput(report) {
		let output = "";

		// Add unit test output if available
		if (report.unit.output) {
			output += `UNIT TESTS:\n${report.unit.output}\n\n`;
		}

		// Add E2E test output if available
		if (report.e2e.output) {
			output += `E2E TESTS:\n${report.e2e.output}\n\n`;
		}

		// Add error information
		if (report.errors && report.errors.length > 0) {
			output += "ERRORS:\n";
			report.errors.forEach((error) => {
				output += `[${error.phase}] ${error.message}\n`;
			});
		}

		return output;
	}

	/**
	 * Generate failure analysis (legacy method - kept for compatibility)
	 */
	generateFailureAnalysis(report) {
		const analysis = {
			criticalFailures: [],
			warnings: [],
			recommendations: [],
		};

		// Analyze unit test failures
		if (report.unit.failed > 0) {
			analysis.criticalFailures.push({
				type: "unit_test_failure",
				count: report.unit.failed,
				impact: "Build will fail in CI",
			});

			analysis.recommendations.push(
				"Fix failing unit tests before proceeding",
				"Run 'pnpm test:unit' locally to reproduce",
			);
		}

		// Analyze E2E test failures
		if (report.e2e.failed > 0) {
			analysis.criticalFailures.push({
				type: "e2e_test_failure",
				count: report.e2e.failed,
				impact: "User-facing features may be broken",
			});

			analysis.recommendations.push(
				"Review E2E test failures for regression",
				"Check if test environment was properly configured",
			);
		}

		// Analyze infrastructure issues
		if (report.infrastructure.supabase !== "healthy") {
			analysis.warnings.push({
				type: "infrastructure",
				component: "supabase",
				status: report.infrastructure.supabase,
			});

			analysis.recommendations.push(
				"Ensure Supabase is running: 'npx supabase start'",
			);
		}

		return analysis;
	}
}

module.exports = { TestReporter };
