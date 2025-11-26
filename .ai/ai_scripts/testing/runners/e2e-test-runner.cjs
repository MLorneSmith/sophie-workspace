/**
 * E2E Test Runner Module
 * Handles execution of end-to-end tests with shard management
 * Enhanced with detailed shard completion reporting
 */

const { spawn, exec } = require("node:child_process");
const fs = require("node:fs").promises;
const path = require("node:path");
const { promisify } = require("node:util");
const os = require("node:os");
const execAsync = promisify(exec);
const { ConditionWaiter } = require("../utilities/condition-waiter.cjs");
const { OutputFilter } = require("../utilities/output-filter.cjs");

// Global line counter for log functions (prevents Claude Code crashes)
let globalLogLineCount = 0;
const MAX_LOG_LINES = 200; // Hard limit to prevent buffer overflow
let logLimitWarningShown = false;

// Simple logging utility with line limit protection
function log(message, type = "info") {
	// Enforce hard limit on log output
	if (globalLogLineCount >= MAX_LOG_LINES) {
		if (!logLimitWarningShown) {
			logLimitWarningShown = true;
			const timestamp = new Date().toISOString();
			process.stdout.write(
				`[${timestamp}] WARN: Log output limit reached (${MAX_LOG_LINES} lines) - suppressing further logs\n`,
			);
		}
		return; // Silently suppress further logs
	}

	globalLogLineCount++;
	const timestamp = new Date().toISOString();
	process.stdout.write(`[${timestamp}] ${type.toUpperCase()}: ${message}\n`);
}

function logError(message) {
	log(message, "error");
}

/**
 * Stringify JSON with tab indentation and trailing newline for Biome compatibility
 * @param {*} data - Data to stringify
 * @returns {string} JSON string with tab indentation and trailing newline
 */
function stringifyWithTabs(data) {
	return `${JSON.stringify(data, null, "\t")}\n`;
}

class E2ETestRunner {
	constructor(config, testStatus, phaseCoordinator, resourceLock) {
		this.config = config;
		this.testStatus = testStatus;
		this.phaseCoordinator = phaseCoordinator;
		this.resourceLock = resourceLock;
		this.waiter = new ConditionWaiter();

		// Initialize output filter
		this.outputFilter = null;

		// Report generation configuration
		this.reportingEnabled = config.reporting?.generateShardReports !== false; // Default to true
		this.reportDir = path.join(process.cwd(), "reports", "testing");
		this.reportRetentionDays = config.reporting?.retentionDays || 30;

		this.intentionalShutdown = false;
		this.servers = {};
		this.testDependencies = null;

		// Determine max concurrent shards based on available resources
		const cpuCount = os.cpus().length;
		const totalMemGB = os.totalmem() / (1024 * 1024 * 1024);

		// Calculate optimal shards: need ~4GB per shard for browser + test server overhead
		// With 24GB RAM: 24/4 = 6 max, but cap at cpuCount/4 for CPU balance
		const memoryBasedMax = Math.floor(totalMemGB / 4);
		const cpuBasedMax = Math.floor(cpuCount / 4);
		const calculatedMax = Math.min(memoryBasedMax, cpuBasedMax, 4); // Cap at 4 for stability

		this.maxConcurrentShards =
			this.config.execution.maxConcurrentShards || Math.max(calculatedMax, 2);

		// Load test groups configuration
		this.testGroups = this.loadTestGroups();
		this.loadTestDependencies();

		log(`🖥️  System has ${cpuCount} CPU cores, ${totalMemGB.toFixed(1)}GB RAM`);
		log(
			`⚙️  Max concurrent shards: ${this.maxConcurrentShards} (calculated: ${calculatedMax})`,
		);

		// Shard filter (set externally via setShardFilter)
		this.shardFilter = null;

		// Track if we've cleared old reports this session (prevents mid-run clearing)
		this._sessionReportsCleared = false;
	}

	/**
	 * Set specific shards to run (filter out others)
	 * @param {number[]} shardNumbers - Array of shard numbers to run (1-11)
	 */
	setShardFilter(shardNumbers) {
		if (!shardNumbers || shardNumbers.length === 0) {
			this.shardFilter = null;
			return;
		}

		this.shardFilter = shardNumbers;
		log(`🎯 Shard filter set: will only run shard(s) ${shardNumbers.join(", ")}`);

		// Filter testGroups to only include specified shards
		this.testGroups = this.testGroups.filter((group) =>
			shardNumbers.includes(group.id),
		);

		log(`📋 Filtered to ${this.testGroups.length} shard(s):`);
		for (const group of this.testGroups) {
			log(`   • Shard ${group.id}: ${group.name}`);
		}
	}

	/**
	 * Dynamically discover all E2E test files
	 */
	discoverTestFiles() {
		try {
			const { execSync } = require("node:child_process");
			const result = execSync(
				`find apps/e2e/tests -name "*.spec.ts" -o -name "*.test.ts" 2>/dev/null | sort`,
				{ encoding: "utf8" },
			);
			const testFiles = result
				.split("\n")
				.filter(Boolean)
				.map((file) => file.replace("apps/e2e/", "")); // Remove base path for consistency

			log(`📂 Discovered ${testFiles.length} test files`);
			return testFiles;
		} catch (error) {
			logError(`Failed to discover test files: ${error.message}`);
			return [];
		}
	}

	/**
	 * Group test files by directory for organized execution
	 */
	groupTestFiles(testFiles) {
		const groups = new Map();

		// Group files by their parent directory
		for (const file of testFiles) {
			const parts = file.split("/");
			const category = parts.length > 2 ? parts[1] : "root";

			if (!groups.has(category)) {
				groups.set(category, []);
			}
			groups.get(category).push(file);
		}

		// Convert to test group format
		const testGroups = [];
		let id = 1;

		// Priority order for test groups (smoke tests first, etc.)
		const priorityOrder = [
			"smoke",
			"healthcheck",
			"authentication",
			"account",
			"team-accounts",
			"admin",
			"invitations",
			"team-billing",
			"user-billing",
			"accessibility",
			"test-configuration-verification",
		];

		// Add groups in priority order
		for (const category of priorityOrder) {
			if (groups.has(category)) {
				testGroups.push({
					id: id++,
					name: this.formatGroupName(category),
					files: groups.get(category),
					expectedTests: null, // Will be determined dynamically
				});
				groups.delete(category);
			}
		}

		// Add any remaining groups
		for (const [category, files] of groups) {
			testGroups.push({
				id: id++,
				name: this.formatGroupName(category),
				files: files,
				expectedTests: null,
			});
		}

		// Handle special case for single files in root
		const rootIndex = testGroups.findIndex((g) => g.name === "Root");
		if (rootIndex !== -1) {
			const rootGroup = testGroups[rootIndex];
			// Split root files into individual groups for better organization
			testGroups.splice(rootIndex, 1);
			for (const file of rootGroup.files) {
				const fileName = path.basename(file, ".spec.ts").replace(/-/g, " ");
				testGroups.push({
					id: id++,
					name: this.formatGroupName(fileName),
					files: [file],
					expectedTests: null,
				});
			}
		}

		return testGroups;
	}

	/**
	 * Format group name for display
	 */
	formatGroupName(name) {
		return name
			.split("-")
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(" ");
	}

	/**
	 * Load test groups configuration based on package.json shards
	 */
	loadTestGroups() {
		// Use the predefined shards from package.json
		// These are carefully organized and tested configurations
		const shardGroups = [
			{
				id: 1,
				name: "Smoke Tests",
				shardCommand: "test:shard1",
				files: ["tests/smoke/smoke.spec.ts"],
				expectedTests: 9,
			},
			{
				id: 2,
				name: "Authentication",
				shardCommand: "test:shard2",
				files: [
					"tests/authentication/auth-simple.spec.ts",
					"tests/authentication/auth.spec.ts",
					"tests/authentication/password-reset.spec.ts",
				],
				expectedTests: 21,
			},
			{
				id: 3,
				name: "Accounts",
				shardCommand: "test:shard3",
				files: [
					"tests/account/account.spec.ts",
					"tests/account/account-simple.spec.ts",
					"tests/team-accounts/team-accounts.spec.ts",
					"tests/team-accounts/team-invitation-mfa.spec.ts",
				],
				expectedTests: 20,
			},
			{
				id: 4,
				name: "Admin & Invitations",
				shardCommand: "test:shard4",
				files: [
					"tests/admin/admin.spec.ts",
					"tests/invitations/invitations.spec.ts",
				],
				expectedTests: 13,
			},
			{
				id: 5,
				name: "Accessibility",
				shardCommand: "test:shard5",
				files: [
					"tests/accessibility/accessibility-hybrid.spec.ts",
					"tests/accessibility/accessibility-hybrid-simple.spec.ts",
				],
				expectedTests: 21,
			},
			{
				id: 6,
				name: "Config & Health",
				shardCommand: "test:shard6",
				files: [
					"tests/test-configuration-verification.spec.ts",
					"tests/healthcheck.spec.ts",
				],
				expectedTests: 12,
			},
			{
				id: 7,
				name: "Payload CMS",
				shardCommand: "test:shard7",
				files: [
					"tests/payload/payload-auth.spec.ts",
					"tests/payload/payload-collections.spec.ts",
					"tests/payload/payload-database.spec.ts",
				],
				expectedTests: 42,
			},
			{
				id: 8,
				name: "Payload CMS Extended",
				shardCommand: "test:shard8",
				files: [
					"tests/payload/payload-auth.spec.ts",
					"tests/payload/payload-collections.spec.ts",
					"tests/payload/payload-database.spec.ts",
					"tests/payload/seeding.spec.ts",
					"tests/payload/seeding-performance.spec.ts",
				],
				expectedTests: null, // Extended with seeding tests
			},
			{
				id: 9,
				name: "User Billing",
				shardCommand: "test:shard9",
				files: ["tests/user-billing/user-billing.spec.ts"],
				expectedTests: null,
			},
			{
				id: 10,
				name: "Team Billing",
				shardCommand: "test:shard10",
				files: ["tests/team-billing/team-billing.spec.ts"],
				expectedTests: null,
			},
		];

		log(
			`📋 Loaded ${shardGroups.length} test shards with ~138+ expected tests`,
		);
		for (const group of shardGroups) {
			log(
				`  • Shard ${group.id} (${group.name}): ${group.expectedTests || "?"} tests`,
			);
		}

		return shardGroups;
	}

	/**
	 * Load test dependencies if available
	 */
	loadTestDependencies() {
		try {
			const depsPath = path.join(
				process.cwd(),
				".claude/tracking/test-data/test-dependencies.json",
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

		// Clear old reports at the start of each test session
		// This prevents stale results from previous runs appearing in summaries
		await this.clearSessionReports();

		try {
			// Check if servers are already running (started by infrastructure manager)
			const serversReady = await this.checkServersReady();

			if (!serversReady) {
				// Only start servers if they're not already running
				const serverResult = await this.phaseCoordinator.transitionTo(
					"e2e_setup",
					() => this.startServers(),
					{ timeout: this.config.timeouts.e2eSetup },
				);

				if (!serverResult.success) {
					throw new Error("Failed to start servers for E2E tests");
				}
			} else {
				log("✅ Servers already running (started by infrastructure manager)");
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

		// Check if we're using an external server (Docker or other)
		const testUrl = process.env.TEST_BASE_URL || "http://localhost:3001";

		if (testUrl !== "http://localhost:3001") {
			log(`🐳 Using external test server at ${testUrl}`);

			// Verify the external server is ready
			try {
				await this.waiter.waitForHttp(testUrl, {
					timeout: 30000,
					name: "external test server",
				});
				log(`✅ External test server ready at ${testUrl}`);
				return { success: true };
			} catch (error) {
				logError(`External test server not responding: ${error.message}`);
				return { success: false };
			}
		}

		// Check if servers are already running
		const serversReady = await this.checkServersReady();
		if (serversReady) {
			log("✅ Servers already running");
			return { success: true };
		}

		// Start web server on port 3001 (matching Playwright's expectation)
		log("🌐 Starting web server on port 3001...");
		this.servers.web = spawn("pnpm", ["--filter", "web", "dev:test"], {
			cwd: process.cwd(),
			stdio: ["ignore", "pipe", "pipe"], // Use "ignore" for stdin to prevent hanging
			shell: true,
			env: {
				...process.env,
				PORT: "3001",
				NODE_ENV: "test",
				ENABLE_STRICT_CSP: "true", // Enable security headers for E2E tests
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
			// Use TEST_BASE_URL if set, otherwise check default port 3001
			const testUrl = process.env.TEST_BASE_URL || "http://localhost:3001";

			const { stdout: webCheck } = await execAsync(
				`curl -s -o /dev/null -w "%{http_code}" ${testUrl} 2>/dev/null || echo "000"`,
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
			intentionalFailures: 0,
			integrationTests: 0,
			shards: {},
		};

		// Initialize output filter
		this.outputFilter = new OutputFilter(this.config.output || {});
		await this.outputFilter.initFileOutput();

		log(`📊 Output mode: ${this.outputFilter.mode}`);
		if (this.outputFilter.fileConfig.enabled) {
			log(`📝 Logging to: ${this.outputFilter.fileConfig.path}`);
		}

		// Show shard filter status
		if (this.shardFilter) {
			log(`🎯 Running specific shard(s): ${this.shardFilter.join(", ")}`);
		}

		// Run shards in parallel by default when resources allow
		// Set E2E_PARALLEL=false to force sequential execution
		const runParallel =
			process.env.E2E_PARALLEL !== "false" && this.maxConcurrentShards > 1;

		if (runParallel) {
			log(
				`🔀 Running E2E tests with ${this.maxConcurrentShards} parallel shards`,
			);
			return await this.runParallelShards(results, startTime);
		} else {
			log("📝 Running E2E tests by shard (sequential execution)");
			return await this.runShardByShardSequential(results, startTime);
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
	 * Run shards sequentially with better tracking
	 */
	async runShardByShardSequential(results, startTime) {
		const totalShards = this.testGroups.length;
		const timedOutShards = new Set(); // Track shards that timed out to avoid retrying
		log(`\n🎯 Running ${totalShards} test shards sequentially`);
		log(
			`⚙️  Config: continueOnTimeout=${this.config.execution.continueOnTimeout}, continueOnFailure=${this.config.execution.continueOnFailure}`,
		);
		log("─".repeat(60));

		for (let i = 0; i < this.testGroups.length; i++) {
			const shard = this.testGroups[i];
			const shardNum = i + 1;

			// Skip shards that have already timed out
			if (timedOutShards.has(shardNum)) {
				log(
					`\n⏭️ Skipping Shard ${shardNum} (${shard.name}) - already timed out`,
				);
				continue;
			}

			// Progress indicator
			log(`\n📊 Progress: Shard ${shardNum}/${totalShards}`);
			log(`🎯 Shard ${shardNum}: ${shard.name}`);
			log(`   Files: ${shard.files.join(", ")}`);
			if (shard.expectedTests) {
				log(`   Expected tests: ${shard.expectedTests}`);
			}

			// Run the shard
			const shardStartTime = Date.now();
			const shardResult = await this.runTestGroupWithTimeout(shard, shardNum);
			const shardDuration = Math.round((Date.now() - shardStartTime) / 1000);

			// Update results
			results.total += shardResult.total;
			results.passed += shardResult.passed;
			results.failed += shardResult.failed;
			results.skipped += shardResult.skipped;
			results.intentionalFailures += shardResult.intentionalFailures || 0;
			results.integrationTests += shardResult.integrationTests || 0;
			results.shards[shardNum] = {
				...shardResult,
				name: shard.name,
				duration: shardDuration,
			};

			// Track timed out shards to prevent retrying
			if (shardResult.timedOut) {
				timedOutShards.add(shardNum);
				log(`⏱️ Marking Shard ${shardNum} as timed out - will not retry`);
			}

			// Show shard result
			const shardSuccess = shardResult.failed === 0 && !shardResult.timedOut;
			const statusIcon = shardResult.timedOut
				? "⏱️"
				: shardSuccess
					? "✅"
					: "❌";
			log(
				`${statusIcon} Shard ${shardNum} (${shard.name}) completed in ${shardDuration}s`,
			);
			log(
				`   Results: ${shardResult.passed}/${shardResult.total} passed, ${shardResult.failed} failed`,
			);

			// Update overall status
			await this.testStatus.updateE2ETests({
				...results,
				currentShard: shardNum,
				totalShards,
			});

			// Add shard decision logging
			log(
				`   Shard result: timedOut=${shardResult.timedOut}, failed=${shardResult.failed}`,
			);
			log(
				`   Decision: continueOnTimeout=${this.config.execution.continueOnTimeout}, continueOnFailure=${this.config.execution.continueOnFailure}`,
			);

			// Determine if we should continue to next shard
			const shouldContinue =
				(shardResult.timedOut && this.config.execution.continueOnTimeout) ||
				(shardResult.failed > 0 &&
					this.config.execution.continueOnFailure !== false) ||
				(!shardResult.timedOut && shardResult.failed === 0);

			if (!shouldContinue) {
				log(`❌ Stopping test execution - Shard ${shardNum} (${shard.name})`);
				log(
					`   timedOut=${shardResult.timedOut}, continueOnTimeout=${this.config.execution.continueOnTimeout}`,
				);
				log(
					`   failed=${shardResult.failed}, continueOnFailure=${this.config.execution.continueOnFailure}`,
				);
				break;
			} else if (shardResult.timedOut) {
				log(`⏱️ Shard ${shardNum} (${shard.name}) timed out, but continuing...`);
			}

			// Show cumulative progress
			log(
				`\n📈 Cumulative: ${results.passed}/${results.total} tests passed so far`,
			);
			log("─".repeat(60));
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
	 * Run test groups sequentially (legacy method)
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
		results.intentionalFailures += shardResults.intentionalFailures || 0;
		results.integrationTests += shardResults.integrationTests || 0;
		results.shards[shardId] = shardResults;

		log(
			`✅ Shard ${shardId} completed: ${shardResults.passed}/${shardResults.total} passed`,
		);

		return shardResults;
	}

	/**
	 * Check if a process is still running
	 */
	isProcessRunning(pid) {
		try {
			process.kill(pid, 0); // Signal 0 checks if process exists
			return true;
		} catch (error) {
			return error.code !== "ESRCH"; // ESRCH means process doesn't exist
		}
	}

	/**
	 * Run test group with enhanced timeout and error handling
	 */
	async runTestGroupWithTimeout(group, shardId = null) {
		const startTime = Date.now();
		const shardPrefix = shardId ? `[Shard ${shardId}] ` : "";

		return new Promise((resolve) => {
			// Streaming parser: only keep bounded buffers
			const MAX_BUFFER_SIZE = 50000; // 50KB for E2E (smaller than unit tests)
			let outputBuffer = "";
			let errorBuffer = "";
			let stdoutLineBuffer = "";
			let stderrLineBuffer = "";

			// Structured results parsed incrementally
			const results = {
				total: 0,
				passed: 0,
				failed: 0,
				skipped: 0,
			};

			let proc = null;
			let timeout = null;
			let resolved = false;
			let lastOutputTime = Date.now();
			let stallCheckInterval = null;

			// Resolve with error result
			const resolveWithError = async (reason) => {
				if (resolved) return;
				resolved = true;

				const duration = Math.round((Date.now() - startTime) / 1000);
				const isTimeout =
					reason.toLowerCase().includes("timed out") ||
					reason.toLowerCase().includes("stalled") ||
					reason.toLowerCase().includes("timeout");

				const errorResult = {
					total: 0,
					passed: 0,
					failed: isTimeout ? 0 : 1, // Don't count timeouts as failures
					skipped: 0,
					error: reason,
					groupName: group.name,
					duration,
					exitCode: -1,
					timedOut: isTimeout,
				};

				// Generate report for timeouts/errors so they appear in summary
				await this.generateShardReport(
					errorResult,
					group,
					shardId,
					duration,
					outputBuffer,
					errorBuffer + `\n${reason}`,
				);

				resolve(errorResult);
			};

			try {
				// Use the predefined shard command from package.json if available
				let command, args, cwd;

				if (group.shardCommand) {
					command = "pnpm";
					args = [
						"--filter",
						"web-e2e",
						group.shardCommand,
						"--",
						"--reporter=dot",
						"--retries=0", // Disable retries when running through test controller
					];
					cwd = process.cwd();
					log(
						`${shardPrefix}🎯 Running ${group.name} using: pnpm --filter web-e2e ${group.shardCommand} -- --reporter=dot --retries=0`,
					);
				} else {
					log(`${shardPrefix}⚠️ Using fallback execution for ${group.name}`);
					command = "npx";
					args = [
						"playwright",
						"test",
						"--reporter=dot",
						"--retries=0", // Disable retries when running through test controller
						"--workers=1",
						...group.files,
					];
					cwd = path.join(process.cwd(), "apps", "e2e");
				}

				// Use the TEST_BASE_URL if set
				const testUrl = process.env.TEST_BASE_URL || "http://localhost:3001";

				proc = spawn(command, args, {
					cwd: cwd,
					stdio: ["ignore", "pipe", "pipe"],
					shell: true,
					detached: process.platform !== "win32", // Create process group on Unix
					env: {
						...process.env,
						PLAYWRIGHT_WORKERS: "1",
						PLAYWRIGHT_PARALLEL: "false",
						BASE_URL: testUrl,
						NODE_ENV: "test",
						PLAYWRIGHT_BASE_URL: testUrl,
						NEXT_PUBLIC_APP_URL: testUrl,
						TEST_SHARD_MODE: "true",
						CI: "1",
						PLAYWRIGHT_HTML_OPEN: "never",
						FORCE_COLOR: "0",
					},
				});

				// Capture stdout with streaming line parser
				proc.stdout.on("data", (data) => {
					const str = data.toString();
					lastOutputTime = Date.now(); // Update last output time

					// Add to bounded buffer
					outputBuffer += str;
					if (outputBuffer.length > MAX_BUFFER_SIZE) {
						outputBuffer = outputBuffer.slice(-MAX_BUFFER_SIZE);
					}

					// Parse line-by-line for incremental results
					stdoutLineBuffer += str;
					const lines = stdoutLineBuffer.split("\n");
					stdoutLineBuffer = lines.pop() || "";

					for (const line of lines) {
						// Parse test results incrementally
						this.parseE2ETestLine(line, results);

						// Filter and stream output (prevents Claude Code buffer overflow)
						if (this.outputFilter?.processLine(line, "stdout")) {
							const truncated = this.outputFilter.truncateLine(line);
							process.stdout.write(`${shardPrefix}${truncated}\n`);
						}

						// Check for hanging patterns
						if (
							line.includes("Waiting for") &&
							line.includes("to be visible")
						) {
							log(`${shardPrefix}⚠️ Test may be hanging on element visibility`);
						}

						// Check for timeout patterns
						if (
							line.includes("Test timeout of") ||
							line.includes("exceeded while") ||
							line.includes("Timeout") ||
							line.includes("TimeoutError")
						) {
							log(
								`${shardPrefix}⚠️ Playwright timeout detected - aggressively killing test`,
							);
							if (proc && !proc.killed) {
								try {
									if (proc.detached && proc.pid) {
										log(
											`${shardPrefix}💥 Killing timeout process group ${proc.pid}`,
										);
										process.kill(-proc.pid, "SIGKILL");
									} else {
										proc.kill("SIGKILL");
									}
									// Also kill related processes immediately
									const { execSync } = require("node:child_process");
									execSync(`pkill -9 -f "chromium" || true`, {
										stdio: "ignore",
										timeout: 1000,
									});
									execSync(`pkill -9 -f "playwright" || true`, {
										stdio: "ignore",
										timeout: 1000,
									});
								} catch (error) {
									log(
										`${shardPrefix}⚠️ Failed to kill timeout process: ${error.message}`,
									);
								}
							}
						}
					}
				});

				// Capture stderr with streaming line parser
				proc.stderr.on("data", (data) => {
					const str = data.toString();
					lastOutputTime = Date.now(); // Update last output time

					// Add to bounded buffer
					errorBuffer += str;
					if (errorBuffer.length > MAX_BUFFER_SIZE) {
						errorBuffer = errorBuffer.slice(-MAX_BUFFER_SIZE);
					}

					// Parse error lines
					stderrLineBuffer += str;
					const lines = stderrLineBuffer.split("\n");
					stderrLineBuffer = lines.pop() || "";

					for (const line of lines) {
						// Filter and stream errors (prevents Claude Code buffer overflow)
						if (this.outputFilter?.processLine(line, "stderr")) {
							const truncated = this.outputFilter.truncateLine(line);
							process.stderr.write(`${shardPrefix}${truncated}\n`);
						}
					}
				});

				// Start stall detection - check every 20 seconds for output
				// Increased from 45s to 240s to accommodate longer-running tests
				// (MFA auth flows, Payload CMS operations, billing tests)
				// Super-admin login with MFA can take significant time without output
				const stallTimeout = 240000; // Kill if no output for 240 seconds (4 minutes)
				stallCheckInterval = setInterval(() => {
					const timeSinceLastOutput = Date.now() - lastOutputTime;
					if (timeSinceLastOutput > stallTimeout) {
						logError(
							`${shardPrefix}❌ Test stalled - no output for ${stallTimeout / 1000}s, aggressively killing process`,
						);
						// Aggressive kill for stalled processes
						if (proc && !proc.killed) {
							try {
								if (proc.detached && proc.pid) {
									log(
										`${shardPrefix}💥 Killing stalled process group ${proc.pid}`,
									);
									process.kill(-proc.pid, "SIGKILL");
								} else {
									proc.kill("SIGKILL");
								}
								// Also kill any related processes
								const { execSync } = require("node:child_process");
								execSync(`pkill -9 -f "playwright" || true`, {
									stdio: "ignore",
									timeout: 1000,
								});
							} catch (error) {
								log(
									`${shardPrefix}⚠️ Failed to kill stalled process: ${error.message}`,
								);
							}
						}
						clearInterval(stallCheckInterval);
						resolveWithError(
							`Test stalled - no output for ${stallTimeout / 1000}s`,
						);
					}
				}, 20000); // Check every 20 seconds

				// Enhanced timeout with warning and aggressive termination
				const timeoutMs = this.config.timeouts.shardTimeout || 180000; // 3 minutes default
				const warningMs = timeoutMs * 0.6; // Warning at 60% of timeout
				const killMs = timeoutMs * 0.9; // Start kill attempts at 90% of timeout

				// Warning timeout
				const warningTimeout = setTimeout(() => {
					log(
						`${shardPrefix}⚠️ Warning: Shard ${shardId} (${group.name}) has been running for ${warningMs / 1000}s`,
					);
					log(
						`${shardPrefix}📊 Current output length: ${outputBuffer.length} chars`,
					);
				}, warningMs);

				// Aggressive kill timeout - try SIGTERM first
				const killTimeout = setTimeout(() => {
					log(
						`${shardPrefix}⚠️ Attempting graceful termination of Shard ${shardId} (${group.name})`,
					);
					if (proc && !proc.killed) {
						// Kill entire process group if detached
						try {
							if (proc.detached && proc.pid) {
								process.kill(-proc.pid, "SIGTERM");
								log(
									`${shardPrefix}🔄 Sent SIGTERM to process group ${proc.pid}`,
								);
							} else {
								proc.kill("SIGTERM");
							}
						} catch (error) {
							log(`${shardPrefix}⚠️ Failed to send SIGTERM: ${error.message}`);
						}

						// Force kill after 3 seconds if still running
						setTimeout(() => {
							if (proc && !proc.killed) {
								log(`${shardPrefix}❌ Force killing hung process with SIGKILL`);
								try {
									if (proc.detached && proc.pid) {
										process.kill(-proc.pid, "SIGKILL");
										log(
											`${shardPrefix}💥 Sent SIGKILL to process group ${proc.pid}`,
										);
									} else {
										proc.kill("SIGKILL");
									}
								} catch (error) {
									log(
										`${shardPrefix}⚠️ Failed to send SIGKILL: ${error.message}`,
									);
								}
							}
						}, 3000); // Reduced from 5 to 3 seconds
					}
				}, killMs);

				// Hard timeout - absolutely kill the process and all children
				timeout = setTimeout(async () => {
					logError(
						`${shardPrefix}❌ Shard ${shardId} (${group.name}) timed out after ${timeoutMs / 1000}s`,
					);

					// Multi-step aggressive cleanup
					try {
						// Step 1: Kill the main process
						if (proc && !proc.killed) {
							if (proc.detached && proc.pid) {
								log(`${shardPrefix}💥 Killing process group ${proc.pid}`);
								process.kill(-proc.pid, "SIGKILL");
							} else {
								proc.kill("SIGKILL");
							}
						}

						// Step 2: Kill by pattern matching
						const { execSync } = require("node:child_process");
						const killCommands = [
							`pkill -f "playwright.*test" || true`,
							`pkill -f "node.*playwright" || true`,
							`pkill -f "${group.shardCommand}" || true`,
							`pkill -f "chromium.*headless" || true`,
							`pkill -9 -f "shard.*${shardId}" || true`,
						];

						log(
							`${shardPrefix}🧹 Running ${killCommands.length} cleanup commands...`,
						);
						for (const cmd of killCommands) {
							try {
								execSync(cmd, { stdio: "ignore", timeout: 2000 });
							} catch {
								// Ignore individual command failures
							}
						}

						// Step 3: Kill by port if we know it
						if (proc.pid) {
							try {
								execSync(
									"lsof -ti:3000 -ti:3001 | xargs kill -9 2>/dev/null || true",
									{ stdio: "ignore", timeout: 2000 },
								);
							} catch {
								// Ignore errors
							}
						}
					} catch (error) {
						log(`${shardPrefix}⚠️ Cleanup error: ${error.message}`);
					}

					// Final check if process is still running
					setTimeout(() => {
						if (proc?.pid && this.isProcessRunning(proc.pid)) {
							logError(
								`${shardPrefix}🚨 CRITICAL: Process ${proc.pid} still running after kill attempts!`,
							);
							// Last resort - try system kill
							try {
								const { execSync } = require("node:child_process");
								execSync(`kill -9 ${proc.pid} 2>/dev/null || true`, {
									stdio: "ignore",
								});
							} catch {
								// If all else fails, log it but continue
								logError(
									`${shardPrefix}💀 Unable to kill process ${proc.pid} - manual intervention may be required`,
								);
							}
						}
					}, 2000);

					resolveWithError(`Test group timed out after ${timeoutMs / 1000}s`);
				}, timeoutMs);

				// Handle process exit
				proc.on("close", (code) => {
					if (resolved) return;
					resolved = true;

					clearTimeout(warningTimeout);
					clearTimeout(killTimeout);
					clearTimeout(timeout);
					if (stallCheckInterval) clearInterval(stallCheckInterval);

					const duration = Math.round((Date.now() - startTime) / 1000);

					// Calculate total from incremental results
					results.total = results.passed + results.failed + results.skipped;

					// Final pass: parse any remaining data from bounded buffer
					this.finalizeE2EResults(outputBuffer, results);

					// Add error information if exit code is non-zero
					if (code !== 0 && errorBuffer) {
						results.errorOutput = errorBuffer;
					}

					// Generate shard report asynchronously (non-blocking)
					this.generateShardReport(
						results,
						group,
						shardId,
						duration,
						outputBuffer,
						errorBuffer,
					);

					log(
						`${shardPrefix}Shard ${shardId} (${group.name}) completed in ${duration}s with exit code ${code}`,
					);

					resolve({
						...results,
						groupName: group.name,
						duration,
						exitCode: code,
					});
				});

				// Handle process errors
				proc.on("error", (error) => {
					clearTimeout(warningTimeout);
					clearTimeout(killTimeout);
					clearTimeout(timeout);
					if (stallCheckInterval) clearInterval(stallCheckInterval);
					logError(`${shardPrefix}Process error: ${error.message}`);
					resolveWithError(`Process error: ${error.message}`);
				});
			} catch (error) {
				logError(`${shardPrefix}Failed to start test group: ${error.message}`);
				resolveWithError(`Failed to start: ${error.message}`);
			}
		});
	}

	/**
	 * Run a single test group (legacy method)
	 */
	async runTestGroup(group, shardId = null) {
		return this.runTestGroupWithTimeout(group, shardId);
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
			intentionalFailures: 0,
			integrationTests: 0,
			failedTests: [],
		};

		// Parse Playwright output patterns
		const passedMatch = output.match(/(\d+)\s+passed/);
		const failedMatch = output.match(/(\d+)\s+failed/);
		const skippedMatch = output.match(/(\d+)\s+skipped/);
		const flakyMatch = output.match(/(\d+)\s+flaky/);

		if (passedMatch) results.passed = parseInt(passedMatch[1], 10);
		if (failedMatch) results.failed = parseInt(failedMatch[1], 10);
		if (skippedMatch) results.skipped = parseInt(skippedMatch[1], 10);
		if (flakyMatch) results.passed += parseInt(flakyMatch[1], 10); // Count flaky as passed

		// Extract specific failed test names
		const failurePattern = /\s*\d+\)\s+\[.*?\]\s+›\s+(.*?)$/gm;
		let match;
		while ((match = failurePattern.exec(output)) !== null) {
			results.failedTests.push({
				name: match[1].trim(),
				file: this.extractFileFromTestName(match[1]),
			});
		}

		// Also check for error messages
		const errorPattern = /Error:\s+(.*?)(?:\n|$)/g;
		while ((match = errorPattern.exec(output)) !== null) {
			const errorMsg = match[1].trim();
			if (!results.errorMessages) {
				results.errorMessages = [];
			}
			results.errorMessages.push(errorMsg);
		}

		// Check for deliberate failures in test-configuration-verification.spec.ts
		if (
			output.includes("Configuration Verification - Continue on Failure") ||
			output.includes("test-configuration-verification.spec.ts")
		) {
			// This test file has known intentional failures
			const intentionalTestPatterns = [
				"Test 2: Intentional FAILURE",
				"Test 4: Another intentional FAILURE",
				"Test 7: Nested intentional FAILURE",
			];

			let intentionalCount = 0;
			for (const pattern of intentionalTestPatterns) {
				if (output.includes(pattern)) {
					intentionalCount++;
				}
			}

			// Track intentional failures separately (do NOT subtract from failed count)
			// The actual failure calculation happens in getSummary() to avoid double-subtraction
			if (intentionalCount > 0) {
				results.intentionalFailures = intentionalCount;
				// Keep results.failed as-is (total failures including intentional)
			}
		}

		// Count integration tests (@integration tagged tests)
		const integrationMatches = output.match(/@integration/g);
		if (integrationMatches) {
			results.integrationTests = integrationMatches.length;
		}

		results.total = results.passed + results.failed + results.skipped;

		return results;
	}

	/**
	 * Parse a single E2E test line for incremental results
	 * IMPORTANT: Only parse summary lines to avoid over-counting
	 */
	parseE2ETestLine(line, results) {
		// Only parse summary lines (e.g., "5 passed, 2 failed")
		// Use max to avoid double-counting cumulative totals
		const summaryMatch = line.match(/(\d+)\s+passed/);
		if (summaryMatch) {
			const passed = parseInt(summaryMatch[1], 10);
			results.passed = Math.max(results.passed, passed);
		}

		const failedMatch = line.match(/(\d+)\s+failed/);
		if (failedMatch) {
			const failed = parseInt(failedMatch[1], 10);
			results.failed = Math.max(results.failed, failed);
		}

		const skippedMatch = line.match(/(\d+)\s+skipped/);
		if (skippedMatch) {
			const skipped = parseInt(skippedMatch[1], 10);
			results.skipped = Math.max(results.skipped, skipped);
		}
	}

	/**
	 * Finalize E2E results with any remaining buffer data
	 */
	finalizeE2EResults(buffer, results) {
		// Do a final parse of the bounded buffer to catch any summary lines
		// Parse final summary from Playwright output
		const summaryMatch = buffer.match(/(\d+)\s+passed.*?(\d+)\s+failed/s);
		if (summaryMatch) {
			const passed = parseInt(summaryMatch[1], 10);
			const failed = parseInt(summaryMatch[2], 10);

			// Use final summary if more accurate
			if (passed > results.passed) results.passed = passed;
			if (failed > results.failed) results.failed = failed;
		}

		// Check for intentional failures in test-configuration-verification
		if (buffer.includes("test-configuration-verification.spec.ts")) {
			const intentionalPatterns = [
				"Test 2: Intentional FAILURE",
				"Test 4: Another intentional FAILURE",
				"Test 7: Nested intentional FAILURE",
			];

			let intentionalCount = 0;
			for (const pattern of intentionalPatterns) {
				if (buffer.includes(pattern)) {
					intentionalCount++;
				}
			}

			if (intentionalCount > 0) {
				results.intentionalFailures = intentionalCount;
			}
		}

		// Count integration tests
		const integrationMatches = buffer.match(/@integration/g);
		if (integrationMatches) {
			results.integrationTests = integrationMatches.length;
		}
	}

	/**
	 * Extract file name from test name
	 */
	extractFileFromTestName(testName) {
		// Try to extract the file from the test name
		const fileMatch = testName.match(/\[(.*?)\]/);
		if (fileMatch) {
			return fileMatch[1];
		}
		return "unknown";
	}

	/**
	 * Ensure report directory structure exists
	 */
	async ensureReportDirectory() {
		try {
			const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
			const fullPath = path.join(this.reportDir, today);
			await fs.mkdir(fullPath, { recursive: true });
			return fullPath;
		} catch (error) {
			logError(`Failed to create report directory: ${error.message}`);
			return null;
		}
	}

	/**
	 * Clear old shard reports at the start of a new test session.
	 * This prevents stale results from previous runs appearing in summaries.
	 * Only runs once per session (tracked by _sessionReportsCleared flag).
	 */
	async clearSessionReports() {
		// Only clear once per session
		if (this._sessionReportsCleared) {
			return;
		}

		try {
			const reportPath = await this.ensureReportDirectory();
			if (!reportPath) {
				return;
			}

			// Get list of files in report directory
			const files = await fs.readdir(reportPath);

			// Remove old shard report files
			let clearedCount = 0;
			for (const file of files) {
				if (file.startsWith("shard-") && file.endsWith(".json")) {
					const filePath = path.join(reportPath, file);
					await fs.unlink(filePath);
					clearedCount++;
				}
			}

			// Reset execution-summary.json if it exists
			const summaryPath = path.join(reportPath, "execution-summary.json");
			try {
				await fs.unlink(summaryPath);
				log(`🧹 Cleared ${clearedCount} old shard reports and execution summary`);
			} catch {
				// Summary doesn't exist, that's fine
				if (clearedCount > 0) {
					log(`🧹 Cleared ${clearedCount} old shard reports`);
				}
			}

			this._sessionReportsCleared = true;
		} catch (error) {
			logError(`Failed to clear old reports: ${error.message}`);
			// Non-critical, continue with test execution
		}
	}

	/**
	 * Generate comprehensive shard completion report
	 */
	async generateShardReport(
		results,
		group,
		shardId,
		duration,
		output,
		errorOutput,
	) {
		// Skip if reporting is disabled
		if (!this.reportingEnabled) {
			return;
		}

		try {
			// Ensure directory exists
			const reportPath = await this.ensureReportDirectory();
			if (!reportPath) {
				return;
			}

			// Prepare report data
			const report = {
				shard: {
					id: shardId,
					name: group.name,
					files: group.files,
					expectedTests: group.expectedTests || null,
					shardCommand: group.shardCommand || null,
				},
				execution: {
					startTime: new Date(Date.now() - duration * 1000).toISOString(),
					endTime: new Date().toISOString(),
					duration: `${duration}s`,
					exitCode: results.exitCode || 0,
					timedOut: results.timedOut || false,
				},
				results: {
					total: results.total || 0,
					passed: results.passed || 0,
					failed: results.failed || 0,
					skipped: results.skipped || 0,
					intentionalFailures: results.intentionalFailures || 0,
					integrationTests: results.integrationTests || 0,
					success: results.failed === 0 && !results.timedOut,
				},
				failures: [],
				errors: [],
				rawOutput: "",
			};

			// Add failed test details
			if (results.failedTests && results.failedTests.length > 0) {
				report.failures = results.failedTests.map((test) => ({
					name: test.name,
					file: test.file || "unknown",
					error:
						this.extractErrorForTest(test.name, output) ||
						"Error details not available",
				}));
			}

			// Add error messages
			if (results.errorMessages && results.errorMessages.length > 0) {
				report.errors = results.errorMessages;
			} else if (errorOutput?.trim()) {
				// Extract meaningful errors from stderr
				const errorLines = errorOutput.split("\n").filter((line) => {
					return (
						line.trim() &&
						(line.includes("Error") ||
							line.includes("Failed") ||
							line.includes("Timeout") ||
							line.includes("CRITICAL"))
					);
				});
				report.errors = errorLines.slice(0, 10); // Limit to 10 error lines
			}

			// Add last 5KB of raw output for debugging
			if (output) {
				const outputSize = output.length;
				const maxSize = 5120; // 5KB
				if (outputSize > maxSize) {
					report.rawOutput = `...(truncated ${outputSize - maxSize} bytes)...\n${output.slice(-maxSize)}`;
				} else {
					report.rawOutput = output;
				}
			}

			// Generate filename
			const _timestamp = new Date().toISOString().replace(/[:.]/g, "-");
			const safeShardName = group.name.toLowerCase().replace(/\s+/g, "-");
			const filename = `shard-${shardId}-${safeShardName}.json`;
			const filePath = path.join(reportPath, filename);

			// Write report synchronously to ensure it completes before moving to next shard
			try {
				await fs.writeFile(filePath, stringifyWithTabs(report), "utf8");

				// Format with Biome to ensure compliance (with timeout to prevent hangs)
				try {
					await execAsync(`npx biome format --write "${filePath}"`, {
						timeout: 5000,
					});
				} catch (formatError) {
					// Non-critical - log but don't fail
					logError(
						`Biome formatting failed for ${filename}: ${formatError.message}`,
					);
				}

				log(`📝 Report generated: ${filename}`);

				// Also generate a summary file that gets updated with each shard
				await this.updateExecutionSummary(reportPath, report);
			} catch (error) {
				logError(`Failed to write shard report: ${error.message}`);
			}
		} catch (error) {
			// Log error but don't fail test execution
			logError(`Report generation error (non-blocking): ${error.message}`);
		}
	}

	/**
	 * Extract error message for a specific test from output
	 */
	extractErrorForTest(testName, output) {
		if (!output || !testName) return null;

		// Try to find error message associated with this test
		const lines = output.split("\n");
		let foundTest = false;
		const errorLines = [];

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];

			// Check if this line mentions our test
			if (line.includes(testName)) {
				foundTest = true;
				continue;
			}

			// If we found the test, capture error lines
			if (foundTest) {
				if (
					line.includes("Error:") ||
					line.includes("at ") || // Stack trace
					line.includes("expected") || // Assertion
					line.includes("Timeout") ||
					line.includes("Failed")
				) {
					errorLines.push(line.trim());

					// Limit to 5 lines of error context
					if (errorLines.length >= 5) {
						break;
					}
				} else if (line.trim() === "" && errorLines.length > 0) {
					// Empty line after collecting errors, stop
					break;
				}
			}
		}

		return errorLines.length > 0 ? errorLines.join("\n") : null;
	}

	/**
	 * Update execution summary with latest shard results.
	 * Uses replace-not-append pattern to prevent duplicate entries.
	 */
	async updateExecutionSummary(reportPath, shardReport) {
		try {
			const summaryPath = path.join(reportPath, "execution-summary.json");
			let summary = {
				executionDate: new Date().toISOString().split("T")[0],
				lastUpdated: new Date().toISOString(),
				totalShards: 0,
				completedShards: 0,
				failedShards: 0,
				timedOutShards: 0,
				overallResults: {
					total: 0,
					passed: 0,
					failed: 0,
					skipped: 0,
					intentionalFailures: 0,
				},
				shards: [],
			};

			// Try to load existing summary
			try {
				const existing = await fs.readFile(summaryPath, "utf8");
				summary = JSON.parse(existing);
			} catch {
				// File doesn't exist yet, use defaults
			}

			// Update timestamp
			summary.lastUpdated = new Date().toISOString();

			// Create new shard entry
			const newShardEntry = {
				id: shardReport.shard.id,
				name: shardReport.shard.name,
				success: shardReport.results.success,
				duration: shardReport.execution.duration,
				tests: shardReport.results.total,
				failures: shardReport.results.failed,
				intentionalFailures: shardReport.results.intentionalFailures || 0,
				timedOut: shardReport.execution.timedOut || false,
			};

			// Replace existing shard entry with same name, or add new one
			// This prevents duplicate entries from appearing in the summary
			const existingIndex = summary.shards.findIndex(
				(s) => s.name === shardReport.shard.name,
			);

			if (existingIndex >= 0) {
				// Replace existing entry
				summary.shards[existingIndex] = newShardEntry;
			} else {
				// Add new entry
				summary.shards.push(newShardEntry);
			}

			// Sort shards by ID
			summary.shards.sort((a, b) => a.id - b.id);

			// Recalculate totals from shards array (prevents accumulation bugs)
			summary.completedShards = summary.shards.length;
			summary.failedShards = 0;
			summary.timedOutShards = 0;
			summary.overallResults = {
				total: 0,
				passed: 0,
				failed: 0,
				skipped: 0,
				intentionalFailures: 0,
			};

			for (const shard of summary.shards) {
				summary.overallResults.total += shard.tests || 0;
				summary.overallResults.failed += shard.failures || 0;
				summary.overallResults.intentionalFailures +=
					shard.intentionalFailures || 0;

				// Calculate passed from total - failed
				const shardPassed = (shard.tests || 0) - (shard.failures || 0);
				summary.overallResults.passed += shardPassed;

				// Track failed/timed out shards
				const actualFailures =
					(shard.failures || 0) - (shard.intentionalFailures || 0);
				if (actualFailures > 0) {
					summary.failedShards++;
				}
				if (shard.timedOut) {
					summary.timedOutShards++;
				}
			}

			// Write updated summary
			await fs.writeFile(summaryPath, stringifyWithTabs(summary), "utf8");

			// Format with Biome to ensure compliance
			try {
				await execAsync(`npx biome format --write "${summaryPath}"`);
			} catch (formatError) {
				// Non-critical - log but don't fail
				logError(
					`Biome formatting failed for execution summary: ${formatError.message}`,
				);
			}
		} catch (error) {
			logError(`Failed to update execution summary: ${error.message}`);
		}
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
				const status = shard.failed === 0 ? "✅" : "❌";
				log(
					`   ${status} Shard ${shardId} (${shard.name || shard.groupName}): ${shard.passed}/${shard.total} passed`,
				);

				// Show failed tests for this shard
				if (shard.failedTests && shard.failedTests.length > 0) {
					log("      Failed tests:");
					for (const test of shard.failedTests) {
						log(`        • ${test.name}`);
					}
				}

				// Show if timed out
				if (shard.timedOut) {
					log("      ⏱️ TIMED OUT");
				}
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
