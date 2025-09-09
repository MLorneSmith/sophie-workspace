/**
 * E2E Test Runner Module
 * Handles execution of end-to-end tests with shard management
 */

const { spawn, exec } = require("node:child_process");
const fs = require("node:fs").promises;
const path = require("node:path");
const { promisify } = require("node:util");
const os = require("node:os");
const execAsync = promisify(exec);
const { ConditionWaiter } = require("../utils/condition-waiter.cjs");

// Simple logging utility
function log(message, type = "info") {
	const timestamp = new Date().toISOString();
	process.stdout.write(`[${timestamp}] ${type.toUpperCase()}: ${message}\n`);
}

function logError(message) {
	log(message, "error");
}

class E2ETestRunner {
	constructor(config, testStatus, phaseCoordinator, resourceLock) {
		this.config = config;
		this.testStatus = testStatus;
		this.phaseCoordinator = phaseCoordinator;
		this.resourceLock = resourceLock;
		this.waiter = new ConditionWaiter();

		this.intentionalShutdown = false;
		this.servers = {};
		this.testDependencies = null;

		// Determine max concurrent shards
		const cpuCount = os.cpus().length;
		this.maxConcurrentShards =
			this.config.execution.maxConcurrentShards || (cpuCount > 4 ? 4 : 2);

		// Load test groups configuration
		this.testGroups = this.loadTestGroups();
		this.loadTestDependencies();

		log(`🖥️  System has ${cpuCount} CPU cores`);
		log(`⚙️  Max concurrent shards: ${this.maxConcurrentShards}`);
	}

	/**
	 * Load test groups configuration
	 */
	loadTestGroups() {
		return [
			{
				id: 1,
				name: "Smoke Tests",
				files: ["tests/smoke/smoke.spec.ts"],
				expectedTests: 10,
			},
			{
				id: 2,
				name: "Authentication",
				files: [
					"tests/authentication/auth-simple.spec.ts",
					"tests/authentication/auth.spec.ts",
					"tests/authentication/password-reset.spec.ts",
				],
				expectedTests: 12,
			},
			{
				id: 3,
				name: "Account Management",
				files: [
					"tests/account/account-simple.spec.ts",
					"tests/account/account.spec.ts",
					"tests/team-accounts/team-accounts.spec.ts",
				],
				expectedTests: 17,
			},
			{
				id: 4,
				name: "Admin & Invitations",
				files: [
					"tests/admin/admin.spec.ts",
					"tests/invitations/team-invitations.spec.ts",
				],
				expectedTests: 6,
			},
			{
				id: 5,
				name: "Teams & Billing",
				files: [
					"tests/team/team.spec.ts",
					"tests/billing/team-billing.spec.ts",
				],
				expectedTests: 3,
			},
		];
	}

	/**
	 * Load test dependencies if available
	 */
	loadTestDependencies() {
		try {
			const depsPath = path.join(
				process.cwd(),
				".claude/rules/test-dependencies.json",
			);
			if (require("node:fs").existsSync(depsPath)) {
				this.testDependencies = require(depsPath);
				log("📋 Test dependencies loaded successfully");
			}
		} catch (error) {
			log(`⚠️ Could not load test dependencies: ${error.message}`);
		}
	}

	/**
	 * Main E2E test execution
	 */
	async run() {
		log("\n🌐 Starting E2E tests...");
		await this.testStatus.setPhase("e2e_tests");

		try {
			// Start servers within phase timeout
			const serverResult = await this.phaseCoordinator.transitionTo(
				"e2e_setup",
				() => this.startServers(),
				{ timeout: this.config.timeouts.e2eSetup },
			);

			if (!serverResult.success) {
				throw new Error("Failed to start servers for E2E tests");
			}

			// Run E2E tests
			const testResult = await this.phaseCoordinator.transitionTo(
				"e2e_tests",
				() => this.executeE2ETests(),
				{ timeout: this.config.timeouts.e2eTests },
			);

			return testResult.result;
		} finally {
			// Always cleanup
			await this.cleanup();
		}
	}

	/**
	 * Start required servers for E2E tests
	 */
	async startServers() {
		log("🚀 Starting E2E test servers...");

		// Check if servers are already running
		const serversReady = await this.checkServersReady();
		if (serversReady) {
			log("✅ Servers already running");
			return { success: true };
		}

		// Start web server
		log("🌐 Starting web server on port 3001...");
		this.servers.web = spawn("pnpm", ["--filter", "web", "dev:test"], {
			cwd: process.cwd(),
			stdio: ["pipe", "pipe", "pipe"],
			shell: true,
			env: {
				...process.env,
				PORT: "3001",
				NEXT_PUBLIC_APP_URL: "http://localhost:3001",
			},
		});

		// Wait for web server to be ready
		await this.waiter.waitForHttp("http://localhost:3001", {
			timeout: 60000,
			name: "web server startup",
		});

		log("✅ Web server ready on port 3001");
		return { success: true };
	}

	/**
	 * Check if servers are ready
	 */
	async checkServersReady() {
		try {
			const { stdout: webCheck } = await execAsync(
				'curl -s -o /dev/null -w "%{http_code}" http://localhost:3001 2>/dev/null || echo "000"',
			);

			return webCheck.trim() === "200";
		} catch {
			return false;
		}
	}

	/**
	 * Execute E2E tests
	 */
	async executeE2ETests() {
		const startTime = Date.now();
		const results = {
			total: 0,
			passed: 0,
			failed: 0,
			skipped: 0,
			shards: {},
		};

		// Determine execution strategy
		if (this.maxConcurrentShards > 1) {
			log(
				`🔀 Running E2E tests with ${this.maxConcurrentShards} parallel shards`,
			);
			return await this.runParallelShards(results, startTime);
		} else {
			log("📝 Running E2E tests sequentially");
			return await this.runSequentialGroups(results, startTime);
		}
	}

	/**
	 * Run test groups in parallel shards
	 */
	async runParallelShards(results, startTime) {
		const shardPromises = [];
		const availableGroups = [...this.testGroups];
		let shardId = 1;

		// Create shards up to max concurrent limit
		while (availableGroups.length > 0 && shardId <= this.maxConcurrentShards) {
			const shardGroups = [];

			// Distribute groups evenly across shards
			const groupsPerShard = Math.ceil(
				availableGroups.length / (this.maxConcurrentShards - shardId + 1),
			);

			for (let i = 0; i < groupsPerShard && availableGroups.length > 0; i++) {
				shardGroups.push(availableGroups.shift());
			}

			if (shardGroups.length > 0) {
				const shardPromise = this.runShard(shardId, shardGroups, results);
				shardPromises.push(shardPromise);
				shardId++;
			}
		}

		// Wait for all shards to complete
		const shardResults = await Promise.allSettled(shardPromises);

		// Aggregate results
		let allSuccess = true;
		shardResults.forEach((result, index) => {
			if (result.status === "rejected") {
				logError(`Shard ${index + 1} failed: ${result.reason}`);
				allSuccess = false;
			}
		});

		const duration = Math.round((Date.now() - startTime) / 1000);

		// Update test status
		await this.testStatus.updateE2ETests({
			...results,
			duration: `${duration}s`,
		});

		this.logE2ESummary(results, duration);

		return {
			success: allSuccess && results.failed === 0,
			...results,
			duration,
		};
	}

	/**
	 * Run test groups sequentially
	 */
	async runSequentialGroups(results, startTime) {
		for (const group of this.testGroups) {
			log(`\n📁 Running ${group.name} (${group.files.length} files)`);

			const groupResult = await this.runTestGroup(group);

			// Aggregate results
			results.total += groupResult.total;
			results.passed += groupResult.passed;
			results.failed += groupResult.failed;
			results.skipped += groupResult.skipped;

			// Update status after each group
			await this.testStatus.updateE2ETests(results);

			if (groupResult.failed > 0 && !this.config.execution.continueOnFailure) {
				log(`❌ Stopping due to failures in ${group.name}`);
				break;
			}
		}

		const duration = Math.round((Date.now() - startTime) / 1000);
		this.logE2ESummary(results, duration);

		return {
			success: results.failed === 0,
			...results,
			duration,
		};
	}

	/**
	 * Run a single shard with assigned groups
	 */
	async runShard(shardId, groups, results) {
		log(`🎯 Shard ${shardId}: Starting with ${groups.length} groups`);

		const shardResults = {
			shardId,
			total: 0,
			passed: 0,
			failed: 0,
			skipped: 0,
			groups: [],
		};

		for (const group of groups) {
			const groupResult = await this.runTestGroup(group, shardId);

			shardResults.total += groupResult.total;
			shardResults.passed += groupResult.passed;
			shardResults.failed += groupResult.failed;
			shardResults.skipped += groupResult.skipped;
			shardResults.groups.push(group.name);

			// Update shard status
			await this.testStatus.updateShard(shardId, shardResults);
		}

		// Update overall results
		results.total += shardResults.total;
		results.passed += shardResults.passed;
		results.failed += shardResults.failed;
		results.skipped += shardResults.skipped;
		results.shards[shardId] = shardResults;

		log(
			`✅ Shard ${shardId} completed: ${shardResults.passed}/${shardResults.total} passed`,
		);

		return shardResults;
	}

	/**
	 * Run a single test group
	 */
	async runTestGroup(group, shardId = null) {
		const startTime = Date.now();
		const shardPrefix = shardId ? `[Shard ${shardId}] ` : "";

		return new Promise((resolve) => {
			let output = "";
			const testFiles = group.files.join(" ");

			const proc = spawn(
				"pnpm",
				["--filter", "web-e2e", "playwright", "test", ...group.files],
				{
					cwd: process.cwd(),
					stdio: ["pipe", "pipe", "pipe"],
					shell: true,
					env: {
						...process.env,
						PLAYWRIGHT_WORKERS: "1", // Run tests sequentially within group
						BASE_URL: "http://localhost:3001",
					},
				},
			);

			proc.stdout.on("data", (data) => {
				const str = data.toString();
				output += str;
				process.stdout.write(`${shardPrefix}${data}`);
			});

			proc.stderr.on("data", (data) => {
				const str = data.toString();
				output += str;
				process.stderr.write(`${shardPrefix}${data}`);
			});

			// Set timeout for this group
			const timeout = setTimeout(() => {
				logError(`${shardPrefix}Group '${group.name}' timed out`);
				proc.kill("SIGKILL");
			}, this.config.timeouts.shardTimeout);

			proc.on("close", (code) => {
				clearTimeout(timeout);
				const duration = Math.round((Date.now() - startTime) / 1000);

				// Parse results from output
				const results = this.parseE2EResults(output);

				log(`${shardPrefix}Group '${group.name}' completed in ${duration}s`);

				resolve({
					...results,
					groupName: group.name,
					duration,
					exitCode: code,
				});
			});
		});
	}

	/**
	 * Parse E2E test results from output
	 */
	parseE2EResults(output) {
		const results = {
			total: 0,
			passed: 0,
			failed: 0,
			skipped: 0,
		};

		// Parse Playwright output patterns
		const passedMatch = output.match(/(\d+)\s+passed/);
		const failedMatch = output.match(/(\d+)\s+failed/);
		const skippedMatch = output.match(/(\d+)\s+skipped/);
		const flakyMatch = output.match(/(\d+)\s+flaky/);

		if (passedMatch) results.passed = parseInt(passedMatch[1]);
		if (failedMatch) results.failed = parseInt(failedMatch[1]);
		if (skippedMatch) results.skipped = parseInt(skippedMatch[1]);
		if (flakyMatch) results.passed += parseInt(flakyMatch[1]); // Count flaky as passed

		results.total = results.passed + results.failed + results.skipped;

		return results;
	}

	/**
	 * Log E2E test summary
	 */
	logE2ESummary(results, duration) {
		log(`\n📊 E2E tests completed in ${duration}s`);
		log(`   Total Tests: ${results.total}`);
		log(`   ✅ Passed: ${results.passed}`);

		if (results.failed > 0) {
			log(`   ❌ Failed: ${results.failed}`);
		}

		if (results.skipped > 0) {
			log(`   ⏭️  Skipped: ${results.skipped}`);
		}

		if (Object.keys(results.shards).length > 0) {
			log("\n📈 Shard Summary:");
			for (const [shardId, shard] of Object.entries(results.shards)) {
				log(`   Shard ${shardId}: ${shard.passed}/${shard.total} passed`);
			}
		}
	}

	/**
	 * Cleanup servers and resources
	 */
	async cleanup() {
		log("\n🧹 Cleaning up E2E test resources...");

		this.intentionalShutdown = true;

		// Kill servers
		for (const [name, proc] of Object.entries(this.servers)) {
			if (proc && !proc.killed) {
				log(`   Stopping ${name} server...`);
				proc.kill("SIGTERM");
			}
		}

		// Kill any hanging Playwright processes
		try {
			await execAsync("pkill -f playwright || true");
		} catch {
			// Ignore errors
		}

		// Clear test artifacts
		try {
			await execAsync("rm -rf test-results playwright-report");
		} catch {
			// Ignore errors
		}

		// Wait for cleanup to complete
		await this.waiter.delay(2000, "cleanup completion");

		log("✅ E2E cleanup complete");
	}

	/**
	 * Check if a test group can run based on dependencies
	 */
	canRunGroup(groupName) {
		if (!this.testDependencies || !this.testDependencies.dependencies) {
			return true;
		}

		const deps = this.testDependencies.dependencies[groupName];
		if (!deps || deps.length === 0) {
			return true;
		}

		// Check if all dependencies have passed
		// This would need to be implemented based on actual test results
		return true;
	}
}

module.exports = { E2ETestRunner };
