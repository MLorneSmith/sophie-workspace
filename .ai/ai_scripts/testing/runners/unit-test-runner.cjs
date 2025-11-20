/**
 * Unit Test Runner Module
 * Handles execution and monitoring of unit tests
 */

const { spawn, exec } = require("node:child_process");
const fs = require("node:fs").promises;
const path = require("node:path");
const { promisify } = require("node:util");
const execAsync = promisify(exec);
const { OutputFilter } = require("../utilities/output-filter.cjs");

// Simple logging utility
function log(message, type = "info") {
	const timestamp = new Date().toISOString();
	process.stdout.write(`[${timestamp}] ${type.toUpperCase()}: ${message}\n`);
}

function logError(message) {
	log(message, "error");
}

/**
 * Strip ANSI escape codes from a string
 * These codes break regex parsing of test output
 */
function stripAnsi(str) {
	// Match all ANSI escape sequences including:
	// - CSI sequences: ESC [ ... letter
	// - OSC sequences: ESC ] ... BEL/ST
	// - Simple escapes: ESC letter
	return str.replace(
		/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
		""
	);
}

class UnitTestRunner {
	constructor(config, testStatus, phaseCoordinator) {
		this.config = config;
		this.testStatus = testStatus;
		this.phaseCoordinator = phaseCoordinator;

		// Initialize output filter
		this.outputFilter = null;
	}

	/**
	 * Run unit tests with proper timeout and monitoring
	 */
	async run() {
		log("\n📦 Running unit tests...");
		await this.testStatus.setPhase("unit_tests");

		// Pre-flight workspace verification
		const workspaceInfo = await this.verifyWorkspaces();
		log(`🔍 Workspace verification: ${workspaceInfo.total} workspaces found`);
		log(`   With tests: ${workspaceInfo.withTests}`);
		log(`   Cached: ${workspaceInfo.cached}`);

		// Execute tests within phase timeout
		const result = await this.phaseCoordinator.transitionTo(
			"unit_tests",
			() => this.executeTests(workspaceInfo),
			{ timeout: this.config.timeouts.unitTests },
		);

		if (result.success) {
			return result.result;
		} else {
			throw new Error(`Unit tests failed: ${result.error}`);
		}
	}

	/**
	 * Execute the unit tests
	 */
	async executeTests(workspaceInfo) {
		// Initialize output filter before Promise
		this.outputFilter = new OutputFilter(this.config.output || {});
		await this.outputFilter.initFileOutput();

		log(`📊 Output mode: ${this.outputFilter.mode}`);
		if (this.outputFilter.fileConfig.enabled) {
			log(`📝 Logging to: ${this.outputFilter.fileConfig.path}`);
		}

		return new Promise((resolve, reject) => {
			const startTime = Date.now();

			// Streaming parser: only keep bounded buffers and structured data
			const MAX_BUFFER_SIZE = 100000; // 100KB for final analysis
			let outputBuffer = ""; // Bounded buffer for final parsing
			let errorBuffer = ""; // Bounded buffer for errors
			let stdoutLineBuffer = ""; // Incomplete line buffer
			let stderrLineBuffer = ""; // Incomplete line buffer

			// Structured results parsed incrementally
			const results = {
				total: 0,
				passed: 0,
				failed: 0,
				skipped: 0,
				failedTests: [],
				workspaces: {
					executed: [],
					cached: [],
				},
			};

			// Check if coverage is enabled
			const collectCoverage =
				this.config.execution.collectCoverage ||
				process.env.TEST_COVERAGE === "true";

			// Choose the appropriate test command
			const testCommand = collectCoverage
				? this.config.commands.unitTestCoverage
				: this.config.commands.unitTest;
			const [cmd, ...args] = testCommand;

			log(`🚀 Executing: ${cmd} ${args.join(" ")}`);
			if (collectCoverage) {
				log("📊 Coverage collection enabled");
			}

			const proc = spawn(cmd, args, {
				cwd: this.config.paths.projectRoot,
				stdio: ["ignore", "pipe", "pipe"],
				shell: true,
				env: {
					...process.env,
					...this.config.environment,
					TURBO_FORCE: "true", // Always bypass cache for comprehensive testing
				},
			});

			// Set a timeout to prevent infinite hanging
			const timeout = setTimeout(() => {
				logError(
					`Unit tests timed out after ${this.config.timeouts.unitTests / 1000}s`,
				);
				proc.kill("SIGKILL");
			}, this.config.timeouts.unitTests);

			// Handle stdout with streaming line parser and output filter
			proc.stdout.on("data", (data) => {
				// Add to bounded buffer (for final parsing)
				outputBuffer += data.toString();
				if (outputBuffer.length > MAX_BUFFER_SIZE) {
					outputBuffer = outputBuffer.slice(-MAX_BUFFER_SIZE);
				}

				// Parse line-by-line for incremental results
				stdoutLineBuffer += data.toString();
				const lines = stdoutLineBuffer.split("\n");
				stdoutLineBuffer = lines.pop() || ""; // Keep incomplete line

				// Process each complete line
				for (const line of lines) {
					// Parse test results
					this.parseTestLine(line, results);
					this.parseWorkspaceLine(line, results.workspaces);

					// Filter and stream output
					if (this.outputFilter.processLine(line, "stdout")) {
						const truncated = this.outputFilter.truncateLine(line);
						process.stdout.write(`${truncated}\n`);
					}
				}

				// Real-time progress updates
				this.testStatus.updateStatusLine(
					"unit_tests",
					results.passed,
					results.failed,
					results.passed + results.failed,
				);
			});

			// Handle stderr with streaming line parser and output filter
			proc.stderr.on("data", (data) => {
				// Add to bounded buffer
				errorBuffer += data.toString();
				if (errorBuffer.length > MAX_BUFFER_SIZE) {
					errorBuffer = errorBuffer.slice(-MAX_BUFFER_SIZE);
				}

				// Parse error lines
				stderrLineBuffer += data.toString();
				const lines = stderrLineBuffer.split("\n");
				stderrLineBuffer = lines.pop() || "";

				for (const line of lines) {
					// Parse errors
					this.parseErrorLine(line, results);

					// Filter and stream errors (always show errors)
					if (this.outputFilter.processLine(line, "stderr")) {
						const truncated = this.outputFilter.truncateLine(line);
						process.stderr.write(`${truncated}\n`);
					}
				}
			});

			// Handle process errors
			proc.on("error", (error) => {
				logError(`Process error: ${error.message}`);
				reject(error);
			});

			// Handle process exit
			proc.on("close", async (code) => {
				clearTimeout(timeout); // Clear the timeout
				const duration = Math.round((Date.now() - startTime) / 1000);

				// Calculate total from incremental results
				results.total = results.passed + results.failed + results.skipped;

				// Final pass: parse any remaining data from bounded buffer
				this.finalizeResults(outputBuffer, results);

				// Update test status
				await this.testStatus.updateUnitTests({
					...results,
					duration: `${duration}s`,
					exitCode: code,
				});

				// Log summary
				this.logSummary(results, duration, workspaceInfo);

				// Analyze workspace execution from results
				const workspaceAnalysis = {
					total: results.workspaces.executed.length,
					skipped: results.workspaces.cached.length,
					executed: results.workspaces.executed,
					cached: results.workspaces.cached,
				};

				// Check for expected test count
				if (results.total < 100 && code === 0) {
					log(
						`⚠️ Warning: Only ${results.total} tests ran. Expected ~498 tests.`,
					);
					log("   This might indicate some workspaces failed to execute.");
				}

				const collectCoverage =
					this.config.execution.collectCoverage ||
					process.env.TEST_COVERAGE === "true";

				// Parse coverage information if enabled
				let coverageData = null;
				if (collectCoverage && code === 0) {
					coverageData = this.parseCoverage(outputBuffer);
				}

				// Print output filter summary and cleanup
				if (this.outputFilter) {
					this.outputFilter.printSummary();
					this.outputFilter.cleanup();
				}

				resolve({
					success: code === 0,
					...results,
					duration,
					coverage: coverageData,
					output: this.config.execution.debug ? outputBuffer : undefined,
					errorOutput: errorBuffer.length > 0 ? errorBuffer : undefined,
					workspaceInfo,
					workspaceAnalysis,
				});
			});
		});
	}

	/**
	 * Parse a single test line for incremental results
	 * IMPORTANT: Test output shows cumulative totals, not increments
	 * Use Math.max() to track the highest value seen
	 */
	parseTestLine(line, results) {
		// Strip ANSI codes before parsing - vitest output contains color codes
		// that break regex matching (e.g., "[32m3 passed[39m")
		const cleanLine = stripAnsi(line);

		// Parse test result lines (e.g., "Tests  5 passed (5)")
		const testMatch = cleanLine.match(/Tests\s+(\d+)\s+passed/);
		if (testMatch) {
			const passed = parseInt(testMatch[1], 10);
			// Use max to avoid double-counting cumulative totals
			results.passed = Math.max(results.passed, passed);
		}

		// Parse failed tests
		const failedMatch = cleanLine.match(/(\d+)\s+failed/);
		if (failedMatch) {
			const failed = parseInt(failedMatch[1], 10);
			results.failed = Math.max(results.failed, failed);
		}

		// Parse skipped/todo tests
		const skippedMatch = cleanLine.match(/(\d+)\s+(skipped|todo)/i);
		if (skippedMatch) {
			const skipped = parseInt(skippedMatch[1], 10);
			results.skipped = Math.max(results.skipped, skipped);
		}

		// Parse FAIL lines for failed test details
		const failLine = cleanLine.match(/FAIL\s+(.+)/);
		if (failLine) {
			const filePath = failLine[1].trim();
			if (!results.failedTests.some((t) => t.file === filePath)) {
				results.failedTests.push({
					file: filePath,
					type: "test_failure",
				});
			}
		}
	}

	/**
	 * Parse workspace execution lines
	 */
	parseWorkspaceLine(line, workspaces) {
		// Parse Turbo workspace execution (e.g., "@kit/auth: RUN")
		const runMatch = line.match(/(@[\w-]+\/[\w-]+|[\w-]+):\s+RUN\s/);
		if (runMatch) {
			const workspace = runMatch[1];
			if (!workspaces.executed.includes(workspace)) {
				workspaces.executed.push(workspace);
			}
		}

		// Parse cached workspaces (shouldn't happen with --force)
		const cachedMatch = line.match(/(@[\w-]+\/[\w-]+|[\w-]+):\s+CACHED\s/);
		if (cachedMatch) {
			const workspace = cachedMatch[1];
			if (!workspaces.cached.includes(workspace)) {
				workspaces.cached.push(workspace);
			}
		}
	}

	/**
	 * Parse error lines for error details
	 */
	parseErrorLine(line, results) {
		// Parse AssertionError
		if (line.includes("AssertionError:")) {
			const error = line.trim();
			if (!results.failedTests.some((t) => t.error === error)) {
				results.failedTests.push({
					error: error,
					type: "assertion_error",
				});
			}
		}

		// Parse TypeScript errors
		const tsError = line.match(/TS\d+:.+/);
		if (tsError) {
			const error = tsError[0].trim();
			if (!results.failedTests.some((t) => t.error === error)) {
				results.failedTests.push({
					error: error,
					type: "typescript_error",
				});
			}
		}
	}

	/**
	 * Finalize results with any remaining buffer data
	 */
	finalizeResults(buffer, results) {
		// Strip ANSI codes from buffer before parsing
		const cleanBuffer = stripAnsi(buffer);

		// Do a final parse of the bounded buffer to catch any summary lines
		// This is safe because we only keep the last 100KB
		// Look for Tests summary line (may be on separate line from Test Files)
		const summaryMatch = cleanBuffer.match(/Tests\s+(\d+)\s+passed/);
		if (summaryMatch) {
			// Use the final summary if available (it's more accurate)
			const totalPassed = parseInt(summaryMatch[1], 10);
			if (totalPassed > results.passed) {
				results.passed = totalPassed;
			}
		}
	}

	/**
	 * Parse test results from output
	 */
	parseResults(output) {
		const results = {
			total: 0,
			passed: 0,
			failed: 0,
			skipped: 0,
			failedTests: [],
		};

		// Strip ANSI codes before parsing
		const cleanOutput = stripAnsi(output);

		// Parse test results from each workspace
		const testLines = cleanOutput.match(/Tests\s+.*\d+.*/gi) || [];

		testLines.forEach((line) => {
			// Parse passed tests
			const passedInLine = line.match(/(\d+)\s+passed/);
			if (passedInLine) {
				results.passed += parseInt(passedInLine[1], 10);
			}

			// Parse failed tests
			const failedInLine = line.match(/(\d+)\s+failed/);
			if (failedInLine) {
				results.failed += parseInt(failedInLine[1], 10);
			}

			// Parse skipped/todo tests
			const skippedInLine = line.match(/(\d+)\s+(skipped|todo)/gi) || [];
			skippedInLine.forEach((skip) => {
				const num = skip.match(/(\d+)/);
				if (num) {
					results.skipped += parseInt(num[1], 10);
				}
			});
		});

		// Parse failed test details if any
		if (results.failed > 0) {
			results.failedTests = this.parseFailedTests(cleanOutput);
		}

		results.total = results.passed + results.failed + results.skipped;

		return results;
	}

	/**
	 * Parse details of failed tests
	 */
	parseFailedTests(output) {
		const failedTests = [];

		// Look for the "Failed Tests" section in vitest output
		const failedSection = output.match(
			/⎯+ Failed Tests .+?⎯+[\s\S]*?(?=\n\s*Test Files|\n\s*Tests:|$)/,
		);

		if (failedSection) {
			// Parse individual FAIL lines
			const failLines = failedSection[0].match(/FAIL\s+.+/g) || [];

			failLines.forEach((line) => {
				const match = line.match(/FAIL\s+(.+)/);
				if (match) {
					const filePath = match[1].trim();
					failedTests.push({
						file: filePath,
						type: "test_failure",
					});
				}
			});
		}

		// Also look for AssertionError patterns
		const assertionErrors = output.match(/AssertionError:.+/g) || [];
		assertionErrors.forEach((error) => {
			if (!failedTests.some((t) => error.includes(t.file))) {
				failedTests.push({
					error: error.trim(),
					type: "assertion_error",
				});
			}
		});

		// Look for TypeScript errors
		const tsErrors = output.match(/TS\d+:.+/g) || [];
		tsErrors.forEach((error) => {
			failedTests.push({
				error: error.trim(),
				type: "typescript_error",
			});
		});

		return failedTests;
	}

	/**
	 * Parse real-time progress updates
	 */
	parseRealtimeProgress(output) {
		// Update status line for real-time progress
		const passedMatch = output.match(/(\d+)\s+passed/);
		const failedMatch = output.match(/(\d+)\s+failed/);

		if (passedMatch || failedMatch) {
			const passed = passedMatch ? parseInt(passedMatch[1], 10) : 0;
			const failed = failedMatch ? parseInt(failedMatch[1], 10) : 0;
			const total = passed + failed;

			this.testStatus.updateStatusLine("unit_tests", passed, failed, total);
		}
	}

	/**
	 * Verify which workspaces have test scripts
	 */
	async verifyWorkspaces() {
		try {
			const { stdout } = await execAsync("pnpm list --recursive --json");
			const workspaces = JSON.parse(stdout);

			let total = 0;
			let withTests = 0;

			// Count workspaces that could have tests (excluding e2e)
			for (const workspace of workspaces) {
				if (workspace.name === "web-e2e" || workspace.name === "slideheroes") {
					continue;
				}

				total++;

				// Check if workspace has test scripts
				try {
					const packageJsonPath = path.join(workspace.path, "package.json");
					const packageContent = await fs.readFile(packageJsonPath, "utf8");
					const packageJson = JSON.parse(packageContent);

					if (
						packageJson.scripts &&
						(packageJson.scripts.test || packageJson.scripts["test:unit"])
					) {
						withTests++;
					}
				} catch {
					// Ignore workspace if can't read package.json
				}
			}

			return {
				total,
				withTests,
				cached: 0, // Will be updated during test execution
			};
		} catch (error) {
			logError(`Failed to verify workspaces: ${error.message}`);
			return { total: 0, withTests: 0, cached: 0 };
		}
	}

	/**
	 * Analyze which workspaces actually ran
	 */
	analyzeWorkspaceResults(output) {
		const analysis = {
			total: 0,
			skipped: 0,
			executed: [],
			cached: [],
		};

		// Look for Turbo workspace execution patterns
		const workspacePattern = /(@[\w-]+\/[\w-]+|[\w-]+):\s+RUN\s/g;
		const cachedPattern = /(@[\w-]+\/[\w-]+|[\w-]+):\s+CACHED\s/g;

		let match;

		// Count executed workspaces
		while ((match = workspacePattern.exec(output)) !== null) {
			const workspace = match[1];
			if (!analysis.executed.includes(workspace)) {
				analysis.executed.push(workspace);
				analysis.total++;
			}
		}

		// Count cached workspaces (shouldn't happen with --force)
		while ((match = cachedPattern.exec(output)) !== null) {
			const workspace = match[1];
			if (!analysis.cached.includes(workspace)) {
				analysis.cached.push(workspace);
				analysis.skipped++;
			}
		}

		return analysis;
	}

	/**
	 * Log test execution summary
	 */
	logSummary(results, duration, workspaceInfo) {
		log(`\n📊 Unit tests completed in ${duration}s`);
		log(`   Total Tests: ${results.total}`);
		log(`   ✅ Passed: ${results.passed}`);

		if (results.failed > 0) {
			log(`   ❌ Failed: ${results.failed}`);

			// Show which tests failed
			if (results.failedTests && results.failedTests.length > 0) {
				log("\n❌ Failed Test Details:");
				results.failedTests.forEach((test, index) => {
					if (test.file) {
						log(`   ${index + 1}. ${test.file}`);
					} else if (test.error) {
						log(`   ${index + 1}. ${test.error}`);
					}
				});
			}
		}

		if (results.skipped > 0) {
			log(`   ⏭️  Skipped/Todo: ${results.skipped}`);
		}

		// Important note about caching
		log("\n📝 Test Execution Details:");
		log(`   Workspaces with tests: ${workspaceInfo.withTests}`);
		log("   🔄 Cache bypassed: All tests run fresh (--force flag enabled)");

		// Check test count expectations
		if (results.total > 400) {
			log(
				"\n✨ Full test suite discovered! All ~498 unit tests were executed.",
			);
		} else if (results.total < 100) {
			log(
				`\n⚠️  Warning: Only ${results.total} tests ran. Expected ~498 tests.`,
			);
			log("   This might indicate some workspaces failed to execute.");
		}
	}

	/**
	 * Parse coverage information from test output
	 */
	parseCoverage(output) {
		const coverage = {
			enabled: true,
			summary: null,
			files: [],
		};

		// Look for coverage summary table
		const coverageMatch = output.match(
			/% Coverage report from v8[\s\S]*?All files\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)/,
		);

		if (coverageMatch) {
			coverage.summary = {
				statements: parseFloat(coverageMatch[1]),
				branches: parseFloat(coverageMatch[2]),
				functions: parseFloat(coverageMatch[3]),
				lines: parseFloat(coverageMatch[4]),
			};
		}

		// Look for coverage threshold warnings
		const thresholdWarnings =
			output.match(/Coverage threshold for .+ not met/g) || [];
		if (thresholdWarnings.length > 0) {
			coverage.warnings = thresholdWarnings;
		}

		// Check if coverage files exist
		try {
			const fs = require("node:fs");
			if (fs.existsSync("coverage")) {
				coverage.reportPath = "coverage/lcov-report/index.html";
			}
		} catch {
			// Ignore errors
		}

		return coverage;
	}

	/**
	 * Clean up any hanging test processes
	 */
	async cleanup() {
		try {
			await execAsync("pkill -f 'vitest' || true");
			await execAsync("pkill -f 'jest' || true");
			log("🧹 Cleaned up test processes");
		} catch (error) {
			logError(`Cleanup error: ${error.message}`);
		}
	}
}

module.exports = { UnitTestRunner };
