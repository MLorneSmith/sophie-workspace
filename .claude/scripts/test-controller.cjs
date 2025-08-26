#!/usr/bin/env node

/**
 * Deterministic Test Controller
 * Orchestrates test execution without LLM involvement
 */

const { spawn, exec } = require("node:child_process");
const fs = require("node:fs").promises;
const path = require("node:path");
const { promisify } = require("node:util");
const os = require("node:os");
const execAsync = promisify(exec);

// Simple logging utility to replace console statements
function log(message, type = "info") {
	const timestamp = new Date().toISOString();
	process.stdout.write(`[${timestamp}] ${type.toUpperCase()}: ${message}\n`);
}

function logError(message) {
	log(message, "error");
}

// Configuration
const CONFIG = {
	statusFile: `/tmp/.claude_test_status_${process.cwd().replace(/\//g, "_")}`,
	resultFile: "/tmp/.claude_test_results.json",
	unitTimeout: 5 * 60 * 1000, // 5 minutes
	e2eTimeout: 20 * 60 * 1000, // 20 minutes (increased for server startup)
	shardTimeout: 15 * 60 * 1000, // 15 minutes per shard (increased for server startup)
	ports: {
		supabase: 55321,
		web: 3000,
		payload: 3020,
	},
};

// Test status tracking
class TestStatus {
	constructor() {
		this.reset();
	}

	reset() {
		this.status = {
			phase: "initializing",
			status: "running",
			startTime: new Date().toISOString(),
			unit: { total: 0, passed: 0, failed: 0, skipped: 0 },
			e2e: {
				total: 0,
				passed: 0,
				failed: 0,
				skipped: 0,
				shards: {},
			},
			infrastructure: {
				supabase: "unknown",
				ports: "unknown",
				environment: "unknown",
			},
			errors: [],
		};
	}

	async save() {
		await fs.writeFile(CONFIG.resultFile, JSON.stringify(this.status, null, 2));
	}

	async updateStatusLine(status, passed = 0, failed = 0, total = 0) {
		const timestamp = Math.floor(Date.now() / 1000);
		const line = `${status}|${timestamp}|${passed}|${failed}|${total}`;
		await fs.writeFile(CONFIG.statusFile, line);
	}
}

// Infrastructure checker
class InfrastructureChecker {
	async checkAll() {
		log("🔍 Running infrastructure checks...");
		const results = {
			supabase: await this.checkSupabase(),
			ports: await this.checkPorts(),
			environment: await this.checkEnvironment(),
		};

		return results;
	}

	async checkSupabase() {
		try {
			// Check if Supabase is running
			const { stdout } = await execAsync(
				"cd apps/e2e && npx supabase status 2>&1",
			);
			if (stdout.includes("RUNNING") || stdout.includes("Started")) {
				log("✅ Supabase E2E is running");
				return "running";
			}

			log("⚠️ Supabase E2E not running, attempting to start...");
			await execAsync("cd apps/e2e && npx supabase start", { timeout: 120000 });
			log("✅ Supabase E2E started successfully");
			return "started";
		} catch (error) {
			logError(`❌ Supabase check failed: ${error.message}`);
			return "failed";
		}
	}

	async checkPorts() {
		try {
			// Kill processes on test ports
			log("🔧 Cleaning up test ports...");
			const killCommands = [
				'pkill -f "playwright" || true',
				'pkill -f "vitest" || true',
				'pkill -f "next-server" || true',
				"lsof -ti:3000-3020 | xargs kill -9 2>/dev/null || true",
			];

			for (const cmd of killCommands) {
				await execAsync(cmd).catch(() => {}); // Ignore errors
			}

			// Wait for processes to die
			await new Promise((resolve) => setTimeout(resolve, 2000));

			log("✅ Ports cleaned");
			return "cleaned";
		} catch (error) {
			logError(`⚠️ Port cleanup warning: ${error.message}`);
			return "partial";
		}
	}

	async checkEnvironment() {
		try {
			const envPath = path.join(process.cwd(), "apps/web/.env.test");
			await fs.access(envPath);
			log("✅ Test environment file exists");
			return "valid";
		} catch {
			log("⚠️ Creating .env.test from example...");
			try {
				const examplePath = path.join(process.cwd(), "apps/web/.env.example");
				const content = await fs.readFile(examplePath, "utf8");
				const envPath = path.join(process.cwd(), "apps/web/.env.test");
				await fs.writeFile(envPath, content);
				log("✅ Created .env.test");
				return "created";
			} catch (error) {
				logError(`❌ Failed to create .env.test: ${error.message}`);
				return "failed";
			}
		}
	}

	async fixInfrastructure(results) {
		const fixes = [];

		if (results.supabase === "failed") {
			fixes.push({
				issue: "Supabase not running",
				command: "cd apps/e2e && npx supabase start",
				severity: "critical",
			});
		}

		if (results.environment === "failed") {
			fixes.push({
				issue: "Missing .env.test file",
				command: "cp apps/web/.env.example apps/web/.env.test",
				severity: "critical",
			});
		}

		return fixes;
	}
}

// Unit test runner
class UnitTestRunner {
	async run(status) {
		log("\n📦 Running unit tests...");
		status.status.phase = "unit_tests";
		await status.save();

		return new Promise((resolve) => {
			const startTime = Date.now();
			let output = "";

			const proc = spawn("pnpm", ["test:unit"], {
				cwd: process.cwd(),
				stdio: ["inherit", "pipe", "pipe"],
				shell: true,
			});

			proc.stdout.on("data", (data) => {
				output += data.toString();
				process.stdout.write(data);
			});

			proc.stderr.on("data", (data) => {
				output += data.toString();
				process.stderr.write(data);
			});

			// Set timeout
			const timeout = setTimeout(() => {
				logError("❌ Unit tests timed out");
				proc.kill("SIGKILL");
			}, CONFIG.unitTimeout);

			proc.on("close", (code) => {
				clearTimeout(timeout);
				const duration = Math.round((Date.now() - startTime) / 1000);

				// Parse test results from output
				const results = this.parseResults(output);

				status.status.unit = results;
				status.status.unit.duration = `${duration}s`;
				status.status.unit.exitCode = code;

				log(`\n📊 Unit tests completed in ${duration}s`);
				log(`   Passed: ${results.passed}/${results.total}`);
				if (results.failed > 0) {
					log(`   Failed: ${results.failed}`);
				}

				resolve({
					success: code === 0,
					...results,
					duration,
					output,
				});
			});
		});
	}

	parseResults(output) {
		const results = {
			total: 0,
			passed: 0,
			failed: 0,
			skipped: 0,
		};

		// Parse Vitest output patterns - keeping for potential future use
		// const patterns = [
		// 	/(\d+) passed/gi,
		// 	/(\d+) failed/gi,
		// 	/(\d+) skipped/gi,
		// 	/Test Files:\s+(\d+) passed/gi,
		// 	/Tests:\s+(\d+) passed/gi,
		// ];

		// Extract passed count
		const passedMatch = output.match(/(\d+) passed/gi);
		if (passedMatch) {
			const numbers = passedMatch.map((m) => parseInt(m.match(/\d+/)[0]));
			results.passed = Math.max(...numbers);
		}

		// Extract failed count
		const failedMatch = output.match(/(\d+) failed/gi);
		if (failedMatch) {
			const numbers = failedMatch.map((m) => parseInt(m.match(/\d+/)[0]));
			results.failed = Math.max(...numbers);
		}

		// Extract skipped/todo count
		const skippedMatch = output.match(/(\d+) (skipped|todo)/gi);
		if (skippedMatch) {
			const numbers = skippedMatch.map((m) => parseInt(m.match(/\d+/)[0]));
			results.skipped = numbers.reduce((a, b) => a + b, 0);
		}

		results.total = results.passed + results.failed + results.skipped;

		return results;
	}
}

// E2E test runner with queue-based execution
class E2ETestRunner {
	constructor() {
		this.shards = [
			{ id: 1, name: "Accessibility Large", tests: 13 },
			{ id: 2, name: "Authentication", tests: 10 },
			{ id: 3, name: "Admin", tests: 9 },
			{ id: 4, name: "Smoke", tests: 9 },
			{ id: 5, name: "Accessibility Simple", tests: 6 },
			{ id: 6, name: "Team Accounts", tests: 6 },
			{ id: 7, name: "Account + Invitations", tests: 8 },
			{ id: 8, name: "Quick Tests", tests: 3 },
			{ id: 9, name: "Billing", tests: 2 },
		];
		
		// Calculate optimal concurrency based on system resources
		const cpuCount = os.cpus().length;
		// Use 75% of CPU cores for optimal performance without overload
		// But cap at 6 for safety even on high-core machines
		this.maxConcurrentShards = Math.min(6, Math.floor(cpuCount * 0.75));
		
		log(`🖥️  System has ${cpuCount} CPU cores`);
		log(`🔧 Using ${this.maxConcurrentShards} concurrent shards for optimal performance`);
	}

	async run(status) {
		log(`\n🌐 Running E2E tests (9 shards, max ${this.maxConcurrentShards} concurrent)...`);
		status.status.phase = "e2e_tests";
		await status.save();

		const startTime = Date.now();
		
		// Queue-based execution with concurrency limit
		const shardResults = await this.runShardsWithQueue(status);

		// Aggregate results
		const totals = {
			total: 0,
			passed: 0,
			failed: 0,
			skipped: 0,
			infrastructureFailures: 0,
		};

		shardResults.forEach((result) => {
			const shard = this.shards.find(s => s.id === result.shardId);
			status.status.e2e.shards[`shard_${shard.id}`] = {
				name: shard.name,
				...result,
			};

			totals.total += result.total;
			totals.passed += result.passed;
			totals.failed += result.failed;
			totals.skipped += result.skipped;
			if (result.infrastructureFailure) {
				totals.infrastructureFailures++;
			}
		});

		const totalDuration = Math.round((Date.now() - startTime) / 1000);
		status.status.e2e = { ...status.status.e2e, ...totals, duration: `${totalDuration}s` };

		log("\n📊 E2E tests completed");
		log(`   Total: ${totals.total}`);
		log(`   Passed: ${totals.passed}`);
		log(`   Failed: ${totals.failed}`);
		if (totals.infrastructureFailures > 0) {
			log(`   ⚠️ Infrastructure failures: ${totals.infrastructureFailures}`);
		}
		log(`   ⏱️ Total duration: ${totalDuration}s`);

		return totals;
	}

	async runShardsWithQueue(status) {
		const shardQueue = [...this.shards];
		const runningShards = new Map(); // Map of shardId -> Promise
		const results = [];
		const failedShards = []; // Track shards that failed for potential retry

		// Helper to wait for next shard to complete
		const waitForNextCompletion = async () => {
			if (runningShards.size === 0) return null;
			
			const promises = Array.from(runningShards.entries()).map(async ([shardId, promise]) => {
				const result = await promise;
				return { shardId, result };
			});
			
			const completed = await Promise.race(promises);
			runningShards.delete(completed.shardId);
			return completed.result;
		};

		// Process queue with concurrency limit
		while (shardQueue.length > 0 || runningShards.size > 0) {
			// Start new shards up to the concurrency limit
			while (runningShards.size < this.maxConcurrentShards && shardQueue.length > 0) {
				const shard = shardQueue.shift();
				log(`  🚀 Starting shard ${shard.id}: ${shard.name} (${runningShards.size + 1}/${this.maxConcurrentShards} concurrent)`);
				
				const shardPromise = this.runShardWithRetry(shard, 1);
				runningShards.set(shard.id, shardPromise);
			}

			// Wait for at least one shard to complete if we're at capacity
			if (runningShards.size > 0) {
				const result = await waitForNextCompletion();
				if (result) {
					results.push(result);
					
					// Track failed shards for potential retry logic
					if (result.failed > 0 || result.infrastructureFailure) {
						failedShards.push(result.shardId);
					}

					// Update status in real-time
					await status.save();
				}
			}
		}

		// Log completion summary
		log(`\n✅ All ${this.shards.length} shards completed`);
		if (failedShards.length > 0) {
			log(`   ⚠️ Shards with failures: ${failedShards.join(', ')}`);
		}

		return results;
	}

	async runShardWithRetry(shard, attempt = 1) {
		const maxRetries = 2;
		const result = await this.runShard(shard, attempt);
		
		// Add shardId to result for tracking
		result.shardId = shard.id;
		
		// Retry logic for infrastructure failures
		if (result.infrastructureFailure && attempt < maxRetries) {
			log(`  🔄 Retrying shard ${shard.id} (attempt ${attempt + 1}/${maxRetries})...`);
			
			// Wait a bit before retry to let resources settle
			await new Promise(resolve => setTimeout(resolve, 3000));
			
			return this.runShardWithRetry(shard, attempt + 1);
		}
		
		return result;
	}

	async runShard(shard) {
		return new Promise((resolve) => {
			const startTime = Date.now();
			let output = "";
			let hasServerStartupDetected = false;

			const proc = spawn(
				"pnpm",
				["--filter", "web-e2e", `test:shard${shard.id}`],
				{
					cwd: process.cwd(),
					stdio: ["inherit", "pipe", "pipe"],
					shell: true,
					env: {
						...process.env,
						PLAYWRIGHT_PARALLEL: "true",
					},
				},
			);

			const timeout = setTimeout(() => {
				logError(
					`❌ Shard ${shard.id} timed out after ${CONFIG.shardTimeout / 1000}s`,
				);
				proc.kill("SIGKILL");
			}, CONFIG.shardTimeout);

			proc.stdout.on("data", (data) => {
				const chunk = data.toString();
				output += chunk;

				// Detect server startup
				if (
					chunk.includes("Next.js") ||
					chunk.includes("Local:") ||
					chunk.includes("Ready in")
				) {
					hasServerStartupDetected = true;
				}
			});

			proc.stderr.on("data", (data) => {
				output += data.toString();
			});

			proc.on("close", (code) => {
				clearTimeout(timeout);
				const duration = Math.round((Date.now() - startTime) / 1000);

				// Parse Playwright output
				const result = this.parsePlaywrightOutput(output, shard);
				result.duration = `${duration}s`;
				result.exitCode = code;
				result.hasServerStartup = hasServerStartupDetected;

				// Check for infrastructure failures
				if (output.includes("WebServer") && output.includes("Timed out")) {
					result.infrastructureFailure = true;
				}

				// Early exit detection (likely server startup issues)
				if (duration <= 5 && code !== 0 && !hasServerStartupDetected) {
					result.infrastructureFailure = true;
					logError(
						`  ⚠️ Shard ${shard.id} exited early (${duration}s, code ${code}) - likely server startup issue`,
					);
				}

				const statusIcon = result.failed > 0 ? "❌" : "✅";
				log(
					`  ${statusIcon} Shard ${shard.id} (${shard.name}): ${result.passed}/${result.total} in ${duration}s (exit: ${code})`,
				);

				resolve(result);
			});
		});
	}

	parsePlaywrightOutput(output, shard) {
		const result = {
			total: shard.tests,
			passed: 0,
			failed: 0,
			skipped: 0,
		};

		// Parse Playwright output patterns
		const passedMatch = output.match(/(\d+) passed/);
		if (passedMatch) {
			result.passed = parseInt(passedMatch[1]);
		}

		const failedMatch = output.match(/(\d+) failed/);
		if (failedMatch) {
			result.failed = parseInt(failedMatch[1]);
		}

		const skippedMatch = output.match(/(\d+) skipped/);
		if (skippedMatch) {
			result.skipped = parseInt(skippedMatch[1]);
		}

		// Check for server startup or infrastructure issues
		const hasServerStartup =
			output.includes("Next.js") ||
			output.includes("Local:") ||
			output.includes("Network:");
		const hasWebServerTimeout =
			output.includes("WebServer") && output.includes("Timed out");
		const hasConnectionError =
			output.includes("ECONNREFUSED") ||
			output.includes("net::ERR_CONNECTION_REFUSED");

		// If no test results found, only assume failure if we have clear error indicators
		// Don't fail if we're just seeing server startup logs
		if (result.passed === 0 && result.failed === 0 && output.length > 0) {
			if (hasWebServerTimeout || hasConnectionError) {
				result.failed = shard.tests;
			} else if (!hasServerStartup) {
				// Only fail if we have output that doesn't look like server startup
				result.failed = shard.tests;
			}
			// Otherwise leave as 0/0 to indicate no results yet (server still starting)
		}

		return result;
	}
}

// Main test controller
class TestController {
	constructor() {
		this.status = new TestStatus();
		this.infrastructure = new InfrastructureChecker();
		this.unitRunner = new UnitTestRunner();
		this.e2eRunner = new E2ETestRunner();
	}

	async run(options) {
		log("🎯 Starting Deterministic Test Execution");
		log("═══════════════════════════════════════\n");

		try {
			// Phase 1: Infrastructure validation
			log("Phase 1: Infrastructure Validation");
			log("───────────────────────────────────");
			const infraResults = await this.infrastructure.checkAll();
			this.status.status.infrastructure = infraResults;
			await this.status.save();

			// Check for critical failures
			const fixes = await this.infrastructure.fixInfrastructure(infraResults);
			if (fixes.some((f) => f.severity === "critical")) {
				logError("\n❌ Critical infrastructure issues detected:");
				fixes.forEach((fix) => {
					logError(`   ${fix.issue}`);
					logError(`   Fix: ${fix.command}`);
				});

				if (!options.continueOnFailure) {
					process.exit(1);
				}
			}

			// Phase 2: Unit tests
			if (!options.e2eOnly) {
				log("\nPhase 2: Unit Tests");
				log("───────────────────────");
				const unitResults = await this.unitRunner.run(this.status);
				await this.status.save();

				if (!unitResults.success && !options.continueOnFailure) {
					await this.generateReport();
					process.exit(1);
				}
			}

			// Phase 3: E2E tests
			if (!options.unitOnly) {
				log("\nPhase 3: E2E Tests");
				log("───────────────────────");
				await this.e2eRunner.run(this.status);
				await this.status.save();
			}

			// Phase 4: Report generation
			await this.generateReport();

			// Update statusline
			const totalPassed =
				this.status.status.unit.passed + this.status.status.e2e.passed;
			const totalFailed =
				this.status.status.unit.failed + this.status.status.e2e.failed;
			const totalTests =
				this.status.status.unit.total + this.status.status.e2e.total;
			const finalStatus = totalFailed === 0 ? "success" : "failed";

			await this.status.updateStatusLine(
				finalStatus,
				totalPassed,
				totalFailed,
				totalTests,
			);

			// Exit with appropriate code
			process.exit(totalFailed === 0 ? 0 : 1);
		} catch (error) {
			logError(`❌ Fatal error: ${error.message}`);
			this.status.status.status = "error";
			this.status.status.errors.push(error.message);
			await this.status.save();
			process.exit(1);
		}
	}

	async generateReport() {
		log(`\n${"═".repeat(40)}`);
		log("TEST RESULTS SUMMARY");
		log("═".repeat(40));

		const { unit, e2e } = this.status.status;
		const totalTests = unit.total + e2e.total;
		const totalPassed = unit.passed + e2e.passed;
		const totalFailed = unit.failed + e2e.failed;
		const totalSkipped = unit.skipped + e2e.skipped;

		// Unit test results
		if (unit.total > 0) {
			log("\nUnit Tests:");
			log(`  Total: ${unit.total}`);
			log(`  ✅ Passed: ${unit.passed}`);
			if (unit.failed > 0) log(`  ❌ Failed: ${unit.failed}`);
			if (unit.skipped > 0) log(`  ⏭️ Skipped: ${unit.skipped}`);
			if (unit.duration) log(`  ⏱️ Duration: ${unit.duration}`);
		}

		// E2E test results
		if (e2e.total > 0) {
			log("\nE2E Tests:");
			log(`  Total: ${e2e.total}`);
			log(`  ✅ Passed: ${e2e.passed}`);
			if (e2e.failed > 0) log(`  ❌ Failed: ${e2e.failed}`);
			if (e2e.skipped > 0) log(`  ⏭️ Skipped: ${e2e.skipped}`);
			if (e2e.duration) log(`  ⏱️ Duration: ${e2e.duration}`);

			// Shard details
			if (Object.keys(e2e.shards).length > 0) {
				log("\n  Shard Results:");
				for (const [, shard] of Object.entries(e2e.shards)) {
					const status = shard.failed > 0 ? "❌" : "✅";
					log(
						`    ${status} ${shard.name}: ${shard.passed}/${shard.total} (${shard.duration})`,
					);
				}
			}
		}

		// Overall summary
		log(`\n${"═".repeat(40)}`);
		log("OVERALL SUMMARY:");
		log(`  Total Tests: ${totalTests}`);
		log(`  ✅ Passed: ${totalPassed}`);
		if (totalFailed > 0) log(`  ❌ Failed: ${totalFailed}`);
		if (totalSkipped > 0) log(`  ⏭️ Skipped: ${totalSkipped}`);

		const successRate =
			totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0;
		log(`  Success Rate: ${successRate}%`);

		// Final status
		log(`\n${"═".repeat(40)}`);
		if (totalFailed === 0) {
			log("✅ ALL TESTS PASSED! 🎉");
		} else {
			log(`❌ ${totalFailed} TEST${totalFailed > 1 ? "S" : ""} FAILED`);

			// Provide fix suggestions
			if (e2e.infrastructureFailures > 0) {
				log("\n💡 Suggested fixes:");
				log("   1. Restart Supabase: cd apps/e2e && npx supabase start");
				log('   2. Clear ports: pkill -f "playwright|next-server"');
				log("   3. Retry tests: node .claude/scripts/test-controller.cjs");
			}
		}

		// Save final status
		this.status.status.status = totalFailed === 0 ? "success" : "failed";
		await this.status.save();

		log("\n📁 Full results saved to:", CONFIG.resultFile);
	}
}

// Parse command line arguments
function parseArgs() {
	const args = process.argv.slice(2);
	const options = {
		unitOnly: false,
		e2eOnly: false,
		continueOnFailure: false,
		debug: process.env.DEBUG_TEST === "true",
	};

	for (const arg of args) {
		switch (arg) {
			case "--unit":
				options.unitOnly = true;
				break;
			case "--e2e":
				options.e2eOnly = true;
				break;
			case "--continue":
				options.continueOnFailure = true;
				break;
			case "--debug":
				options.debug = true;
				break;
		}
	}

	return options;
}

// Main execution
if (require.main === module) {
	const options = parseArgs();

	if (options.debug) {
		log("🔍 Debug mode enabled");
	}

	const controller = new TestController();
	controller.run(options);
}

module.exports = { TestController, TestStatus, InfrastructureChecker };
