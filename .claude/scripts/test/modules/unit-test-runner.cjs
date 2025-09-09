/**
 * Unit Test Runner Module
 * Handles execution and monitoring of unit tests
 */

const { spawn, exec } = require("node:child_process");
const fs = require("node:fs").promises;
const path = require("node:path");
const { promisify } = require("node:util");
const execAsync = promisify(exec);

// Simple logging utility
function log(message, type = "info") {
	const timestamp = new Date().toISOString();
	process.stdout.write(`[${timestamp}] ${type.toUpperCase()}: ${message}\n`);
}

function logError(message) {
	log(message, "error");
}

class UnitTestRunner {
	constructor(config, testStatus, phaseCoordinator) {
		this.config = config;
		this.testStatus = testStatus;
		this.phaseCoordinator = phaseCoordinator;
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
	executeTests(workspaceInfo) {
		return new Promise((resolve, reject) => {
			const startTime = Date.now();
			let output = "";
			let errorOutput = "";

			// Always force fresh test runs to ensure all tests validate changed code
			const testCommand = this.config.commands.unitTest;
			const [cmd, ...args] = testCommand;

			log(`🚀 Executing: ${cmd} ${args.join(" ")}`);

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

			// Handle stdout
			proc.stdout.on("data", (data) => {
				const str = data.toString();
				output += str;
				process.stdout.write(data);

				// Real-time parsing for status updates
				this.parseRealtimeProgress(str);
			});

			// Handle stderr
			proc.stderr.on("data", (data) => {
				const str = data.toString();
				errorOutput += str;
				process.stderr.write(data);
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

				// Parse test results from output
				const results = this.parseResults(output);

				// Update test status
				await this.testStatus.updateUnitTests({
					...results,
					duration: `${duration}s`,
					exitCode: code,
				});

				// Log summary
				this.logSummary(results, duration, workspaceInfo);

				// Analyze workspace execution
				const workspaceAnalysis = this.analyzeWorkspaceResults(output);

				// Check for expected test count
				if (results.total < 100 && code === 0) {
					log(
						`⚠️ Warning: Only ${results.total} tests ran. Expected ~498 tests.`,
					);
					log("   This might indicate some workspaces failed to execute.");
				}

				resolve({
					success: code === 0,
					...results,
					duration,
					output: this.config.execution.debug ? output : undefined,
					errorOutput: errorOutput.length > 0 ? errorOutput : undefined,
					workspaceInfo,
					workspaceAnalysis,
				});
			});
		});
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

		// Parse test results from each workspace
		const testLines = output.match(/Tests\s+.*\d+.*/gi) || [];

		testLines.forEach((line) => {
			// Parse passed tests
			const passedInLine = line.match(/(\d+)\s+passed/);
			if (passedInLine) {
				results.passed += parseInt(passedInLine[1]);
			}

			// Parse failed tests
			const failedInLine = line.match(/(\d+)\s+failed/);
			if (failedInLine) {
				results.failed += parseInt(failedInLine[1]);
			}

			// Parse skipped/todo tests
			const skippedInLine = line.match(/(\d+)\s+(skipped|todo)/gi) || [];
			skippedInLine.forEach((skip) => {
				const num = skip.match(/(\d+)/);
				if (num) {
					results.skipped += parseInt(num[1]);
				}
			});
		});

		// Parse failed test details if any
		if (results.failed > 0) {
			results.failedTests = this.parseFailedTests(output);
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
			const passed = passedMatch ? parseInt(passedMatch[1]) : 0;
			const failed = failedMatch ? parseInt(failedMatch[1]) : 0;
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
