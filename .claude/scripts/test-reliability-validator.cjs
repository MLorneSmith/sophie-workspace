#!/usr/bin/env node

/**
 * Test Reliability Validator
 * Runs comprehensive reliability tests to ensure test infrastructure meets quality standards
 */

const { spawn } = require("node:child_process");
const { exec } = require("node:child_process");
const { promisify } = require("node:util");
const fs = require("node:fs").promises;
const path = require("node:path");
const execAsync = promisify(exec);

class TestReliabilityValidator {
	constructor() {
		this.results = {
			iterations: 0,
			successful: 0,
			failed: 0,
			infrastructureFailures: 0,
			timeouts: 0,
			portConflicts: 0,
			successRate: 0,
			averageDuration: 0,
			failurePatterns: {},
			startTime: null,
			endTime: null,
		};

		this.targetSuccessRate = 95; // Target 95% success rate
		this.maxIterations = 10; // Default to 10 test runs
	}

	/**
	 * Run reliability validation
	 * @param {number} iterations - Number of test iterations to run
	 * @param {string} testType - Type of tests to run (all, unit, e2e)
	 */
	async validate(iterations = 10, testType = "all") {
		console.log("🔬 Starting Test Reliability Validation");
		console.log(`   Target: ${this.targetSuccessRate}% success rate`);
		console.log(`   Iterations: ${iterations}`);
		console.log(`   Test Type: ${testType}`);
		console.log(`${"═".repeat(50)}\n`);

		this.maxIterations = iterations;
		this.results.startTime = new Date().toISOString();

		for (let i = 1; i <= iterations; i++) {
			console.log(`\n📝 Iteration ${i}/${iterations}`);
			console.log(`${"─".repeat(30)}`);

			const iterationResult = await this.runTestIteration(testType);
			this.analyzeIterationResult(iterationResult, i);

			// Calculate running success rate
			this.results.successRate = (this.results.successful / i) * 100;

			console.log("\n📊 Running Stats:");
			console.log(`   Success Rate: ${this.results.successRate.toFixed(1)}%`);
			console.log(`   Successful: ${this.results.successful}`);
			console.log(`   Failed: ${this.results.failed}`);

			// Early exit if success rate is too low
			if (i >= 3 && this.results.successRate < 50) {
				console.error(
					`\n❌ Stopping early: Success rate too low (${this.results.successRate.toFixed(1)}%)`,
				);
				break;
			}

			// Cool down between iterations to avoid resource exhaustion
			if (i < iterations) {
				console.log("\n⏳ Cooling down for 10 seconds...");
				await new Promise((resolve) => setTimeout(resolve, 10000));
			}
		}

		this.results.endTime = new Date().toISOString();
		this.results.iterations = Math.min(
			iterations,
			this.results.successful + this.results.failed,
		);

		// Generate final report
		await this.generateReport();

		// Return success/failure based on target
		return this.results.successRate >= this.targetSuccessRate;
	}

	/**
	 * Run a single test iteration
	 * @param {string} testType - Type of tests to run
	 */
	async runTestIteration(testType) {
		const startTime = Date.now();
		const result = {
			success: false,
			duration: 0,
			output: "",
			errors: [],
			type: testType,
		};

		// Build test command
		const testArgs = ["node", ".claude/scripts/test-controller.cjs"];
		if (testType === "unit") testArgs.push("--unit");
		else if (testType === "e2e") testArgs.push("--e2e");

		return new Promise((resolve) => {
			const proc = spawn(testArgs[0], testArgs.slice(1), {
				cwd: process.cwd(),
				stdio: ["inherit", "pipe", "pipe"],
				shell: true,
			});

			proc.stdout.on("data", (data) => {
				result.output += data.toString();
			});

			proc.stderr.on("data", (data) => {
				const error = data.toString();
				result.output += error;
				result.errors.push(error);
			});

			// Set timeout (30 minutes for full test suite)
			const timeout = setTimeout(
				() => {
					console.error("❌ Test iteration timed out");
					proc.kill("SIGKILL");
					result.timeout = true;
				},
				30 * 60 * 1000,
			);

			proc.on("close", (code) => {
				clearTimeout(timeout);
				result.duration = Math.round((Date.now() - startTime) / 1000);
				result.success = code === 0;
				result.exitCode = code;

				// Analyze output for specific failure patterns
				result.infrastructureFailure = this.detectInfrastructureFailure(
					result.output,
				);
				result.portConflict = this.detectPortConflict(result.output);
				result.timeoutError = this.detectTimeout(result.output);

				resolve(result);
			});
		});
	}

	/**
	 * Detect infrastructure failure patterns in output
	 */
	detectInfrastructureFailure(output) {
		const patterns = [
			"WebServer.*Timed out",
			"ECONNREFUSED",
			"Supabase.*failed",
			"Cannot connect to database",
			"Port.*already in use",
		];

		return patterns.some((pattern) => new RegExp(pattern, "i").test(output));
	}

	/**
	 * Detect port conflict patterns in output
	 */
	detectPortConflict(output) {
		const patterns = [
			"EADDRINUSE",
			"Port.*is already in use",
			"address already in use",
			"listen EADDRINUSE",
		];

		return patterns.some((pattern) => new RegExp(pattern, "i").test(output));
	}

	/**
	 * Detect timeout patterns in output
	 */
	detectTimeout(output) {
		const patterns = [
			"Timeout.*exceeded",
			"Test timeout",
			"timed out",
			"TIMEOUT",
		];

		return patterns.some((pattern) => new RegExp(pattern, "i").test(output));
	}

	/**
	 * Analyze iteration result and update statistics
	 */
	analyzeIterationResult(result, iteration) {
		if (result.success) {
			this.results.successful++;
			console.log(`   ✅ Iteration ${iteration} passed (${result.duration}s)`);
		} else {
			this.results.failed++;
			console.log(`   ❌ Iteration ${iteration} failed (${result.duration}s)`);

			// Track failure patterns
			if (result.infrastructureFailure) {
				this.results.infrastructureFailures++;
				this.trackFailurePattern("infrastructure");
			}
			if (result.portConflict) {
				this.results.portConflicts++;
				this.trackFailurePattern("port_conflict");
			}
			if (result.timeoutError || result.timeout) {
				this.results.timeouts++;
				this.trackFailurePattern("timeout");
			}

			// Log failure details
			console.log(`      Failure Type: ${this.getFailureType(result)}`);
		}

		// Update average duration
		const totalRuns = this.results.successful + this.results.failed;
		this.results.averageDuration =
			(this.results.averageDuration * (totalRuns - 1) + result.duration) /
			totalRuns;
	}

	/**
	 * Get failure type from result
	 */
	getFailureType(result) {
		const types = [];
		if (result.infrastructureFailure) types.push("Infrastructure");
		if (result.portConflict) types.push("Port Conflict");
		if (result.timeoutError || result.timeout) types.push("Timeout");
		if (types.length === 0) types.push("Test Failure");
		return types.join(", ");
	}

	/**
	 * Track failure pattern frequency
	 */
	trackFailurePattern(pattern) {
		if (!this.results.failurePatterns[pattern]) {
			this.results.failurePatterns[pattern] = 0;
		}
		this.results.failurePatterns[pattern]++;
	}

	/**
	 * Generate comprehensive reliability report
	 */
	async generateReport() {
		const report = [];

		report.push("\n" + "═".repeat(50));
		report.push("TEST RELIABILITY VALIDATION REPORT");
		report.push("═".repeat(50));

		// Summary
		report.push("\n📊 SUMMARY");
		report.push("─".repeat(30));
		report.push(`Total Iterations: ${this.results.iterations}`);
		report.push(`Successful: ${this.results.successful}`);
		report.push(`Failed: ${this.results.failed}`);
		report.push(`Success Rate: ${this.results.successRate.toFixed(1)}%`);
		report.push(`Target Rate: ${this.targetSuccessRate}%`);
		report.push(
			`Status: ${this.results.successRate >= this.targetSuccessRate ? "✅ PASSED" : "❌ FAILED"}`,
		);

		// Performance
		report.push("\n⏱️ PERFORMANCE");
		report.push("─".repeat(30));
		report.push(
			`Average Duration: ${this.results.averageDuration.toFixed(0)}s`,
		);
		const totalTime = Math.round(
			(new Date(this.results.endTime) - new Date(this.results.startTime)) /
				1000,
		);
		report.push(`Total Time: ${totalTime}s`);

		// Failure Analysis
		if (this.results.failed > 0) {
			report.push("\n❌ FAILURE ANALYSIS");
			report.push("─".repeat(30));
			report.push(
				`Infrastructure Failures: ${this.results.infrastructureFailures}`,
			);
			report.push(`Port Conflicts: ${this.results.portConflicts}`);
			report.push(`Timeouts: ${this.results.timeouts}`);

			if (Object.keys(this.results.failurePatterns).length > 0) {
				report.push("\nFailure Patterns:");
				for (const [pattern, count] of Object.entries(
					this.results.failurePatterns,
				)) {
					const percentage = ((count / this.results.failed) * 100).toFixed(1);
					report.push(`  ${pattern}: ${count} (${percentage}% of failures)`);
				}
			}
		}

		// Recommendations
		report.push("\n💡 RECOMMENDATIONS");
		report.push("─".repeat(30));

		if (this.results.successRate < this.targetSuccessRate) {
			if (this.results.infrastructureFailures > 0) {
				report.push("• Fix infrastructure stability issues");
				report.push("  - Ensure Supabase containers are healthy");
				report.push("  - Implement better process cleanup");
				report.push("  - Add retry logic for service startup");
			}

			if (this.results.portConflicts > 0) {
				report.push("• Address port conflict issues");
				report.push("  - Implement resource locking");
				report.push("  - Enhance port cleanup between runs");
				report.push("  - Use dynamic port allocation");
			}

			if (this.results.timeouts > 0) {
				report.push("• Optimize test performance");
				report.push("  - Increase timeout values");
				report.push("  - Reduce test complexity");
				report.push("  - Improve parallel execution");
			}
		} else {
			report.push("✅ Test infrastructure meets reliability standards!");
			report.push(
				`   Achieved ${this.results.successRate.toFixed(1)}% success rate`,
			);
		}

		// Output report
		const reportText = report.join("\n");
		console.log(reportText);

		// Save report to file
		const reportPath = path.join(
			process.cwd(),
			".claude/test-reliability-report.txt",
		);
		await fs.writeFile(reportPath, reportText + "\n");
		console.log(`\n📁 Report saved to: ${reportPath}`);

		// Save JSON results
		const jsonPath = path.join(
			process.cwd(),
			".claude/test-reliability-results.json",
		);
		await fs.writeFile(jsonPath, JSON.stringify(this.results, null, 2));
		console.log(`📁 JSON results saved to: ${jsonPath}`);
	}

	/**
	 * Run a quick health check
	 */
	async quickCheck() {
		console.log("🏥 Running Quick Health Check...\n");

		const checks = [
			{
				name: "Supabase Status",
				cmd: 'cd apps/e2e && npx supabase status 2>&1 | grep -E "(running|API URL)" | head -1',
			},
			{ name: "Port 3000", cmd: 'lsof -ti:3000 || echo "Free"' },
			{ name: "Port 3020", cmd: 'lsof -ti:3020 || echo "Free"' },
			{
				name: "Playwright Processes",
				cmd: 'pgrep -f playwright || echo "None"',
			},
			{
				name: "Lock Files",
				cmd: "ls /tmp/.claude_test_locks 2>/dev/null | wc -l",
			},
		];

		for (const check of checks) {
			try {
				const { stdout } = await execAsync(check.cmd);
				const status = stdout.trim();
				const isHealthy =
					!status.includes("error") && !status.includes("failed");
				console.log(
					`${isHealthy ? "✅" : "❌"} ${check.name}: ${status.substring(0, 50)}`,
				);
			} catch (error) {
				console.log(`❌ ${check.name}: Check failed`);
			}
		}

		console.log(
			"\n💡 Run with --validate for comprehensive reliability testing",
		);
	}
}

// Export for use in other modules
module.exports = { TestReliabilityValidator };

// CLI interface
if (require.main === module) {
	const args = process.argv.slice(2);
	const validator = new TestReliabilityValidator();

	(async () => {
		if (args.includes("--validate") || args.includes("-v")) {
			const iterations = parseInt(
				args.find((a) => a.startsWith("--iterations="))?.split("=")[1] || "10",
			);
			const testType =
				args.find((a) => ["--unit", "--e2e"].includes(a))?.replace("--", "") ||
				"all";

			const success = await validator.validate(iterations, testType);
			process.exit(success ? 0 : 1);
		} else if (args.includes("--quick") || args.includes("-q")) {
			await validator.quickCheck();
		} else {
			console.log("Test Reliability Validator");
			console.log("");
			console.log("Usage:");
			console.log("  test-reliability-validator.cjs --validate [options]");
			console.log("  test-reliability-validator.cjs --quick");
			console.log("");
			console.log("Options:");
			console.log("  --validate, -v        Run comprehensive validation");
			console.log("  --quick, -q          Run quick health check");
			console.log(
				"  --iterations=N       Number of test iterations (default: 10)",
			);
			console.log("  --unit              Test unit tests only");
			console.log("  --e2e               Test E2E tests only");
			console.log("");
			console.log("Examples:");
			console.log(
				"  node test-reliability-validator.cjs --validate --iterations=5",
			);
			console.log("  node test-reliability-validator.cjs --quick");
		}
	})();
}
