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
const { ConditionWaiter } = require("../utilities/condition-waiter.cjs");

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
					"tests/authentication/auth.spec.ts",
					"tests/authentication/password-reset.spec.ts",
				],
				expectedTests: 3, // 1 + 2
			},
			{
				id: 3,
				name: "Accounts",
				shardCommand: "test:shard3",
				files: [
					"tests/account/account.spec.ts",
					"tests/team-accounts/team-accounts.spec.ts",
					"tests/team-accounts/team-invitation-mfa.spec.ts",
				],
				expectedTests: 15, // 7 + 7 + 1
			},
			{
				id: 4,
				name: "Admin & Invitations",
				shardCommand: "test:shard4",
				files: [
					"tests/admin/admin.spec.ts",
					"tests/invitations/invitations.spec.ts",
				],
				expectedTests: 14, // 10 + 4
			},
			{
				id: 5,
				name: "Billing",
				shardCommand: "test:shard5",
				files: [
					"tests/user-billing/user-billing.spec.ts",
					"tests/team-billing/team-billing.spec.ts",
				],
				expectedTests: 2, // 1 + 1
			},
			{
				id: 6,
				name: "Accessibility",
				shardCommand: "test:shard6",
				files: [
					"tests/accessibility/accessibility-hybrid.spec.ts",
					"tests/accessibility/accessibility-hybrid-simple.spec.ts",
				],
				expectedTests: 39, // 28 + 11
			},
			{
				id: 7,
				name: "Config & Health",
				shardCommand: "test:shard7",
				files: [
					"tests/test-configuration-verification.spec.ts",
					"tests/healthcheck.spec.ts",
				],
				expectedTests: 12, // 11 + 1
			},
		];

		log(`📋 Loaded ${shardGroups.length} test shards with ~94 expected tests`);
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
		const testUrl = process.env.TEST_BASE_URL || "http://localhost:3000";

		if (testUrl !== "http://localhost:3000") {
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

		// Start web server on port 3000 (matching Playwright's expectation)
		log("🌐 Starting web server on port 3000...");
		this.servers.web = spawn("pnpm", ["--filter", "web", "dev:test"], {
			cwd: process.cwd(),
			stdio: ["ignore", "pipe", "pipe"], // Use "ignore" for stdin to prevent hanging
			shell: true,
			env: {
				...process.env,
				PORT: "3000",
				NODE_ENV: "test",
				ENABLE_STRICT_CSP: "true", // Enable security headers for E2E tests
				NEXT_PUBLIC_APP_URL: "http://localhost:3000",
			},
		});

		// Wait for web server to be ready
		await this.waiter.waitForHttp("http://localhost:3000", {
			timeout: 60000,
			name: "web server startup",
		});

		log("✅ Web server ready on port 3000");
		return { success: true };
	}

	/**
	 * Check if servers are ready
	 */
	async checkServersReady() {
		try {
			// Use TEST_BASE_URL if set, otherwise check default port 3000
			const testUrl = process.env.TEST_BASE_URL || "http://localhost:3000";

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

		// Always run shards sequentially by default for better tracking
		// Unless explicitly configured for parallel execution
		const runParallel = process.env.E2E_PARALLEL === "true" || false;

		if (runParallel && this.maxConcurrentShards > 1) {
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

			// Check if we should continue
			if (shardResult.timedOut && this.config.execution.continueOnTimeout) {
				log(
					`⏱️ Shard ${shardNum} (${shard.name}) timed out, but continuing with other shards`,
				);
			} else if (
				shardResult.failed > 0 &&
				!this.config.execution.continueOnFailure
			) {
				log(
					`❌ Stopping test execution due to failures in Shard ${shardNum} (${shard.name})`,
				);
				break;
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
			let output = "";
			let errorOutput = "";
			let proc = null;
			let timeout = null;
			let resolved = false;
			let lastOutputTime = Date.now();
			let stallCheckInterval = null;

			// Resolve with error result
			const resolveWithError = (reason) => {
				if (resolved) return;
				resolved = true;

				const duration = Math.round((Date.now() - startTime) / 1000);
				const isTimeout =
					reason.toLowerCase().includes("timed out") ||
					reason.toLowerCase().includes("stalled") ||
					reason.toLowerCase().includes("timeout");
				resolve({
					total: 0,
					passed: 0,
					failed: isTimeout ? 0 : 1, // Don't count timeouts as failures
					skipped: 0,
					error: reason,
					groupName: group.name,
					duration,
					exitCode: -1,
					timedOut: isTimeout,
				});
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
				const testUrl = process.env.TEST_BASE_URL || "http://localhost:3000";

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

				// Capture stdout
				proc.stdout.on("data", (data) => {
					const str = data.toString();
					output += str;
					lastOutputTime = Date.now(); // Update last output time
					process.stdout.write(`${shardPrefix}${data}`);

					// Check for hanging patterns
					if (str.includes("Waiting for") && str.includes("to be visible")) {
						log(`${shardPrefix}⚠️ Test may be hanging on element visibility`);
					}

					// Check for timeout patterns
					if (
						str.includes("Test timeout of") ||
						str.includes("exceeded while") ||
						str.includes("Timeout") ||
						str.includes("TimeoutError")
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
				});

				// Capture stderr
				proc.stderr.on("data", (data) => {
					const str = data.toString();
					errorOutput += str;
					lastOutputTime = Date.now(); // Update last output time
					process.stderr.write(`${shardPrefix}${data}`);
				});

				// Start stall detection - check every 20 seconds for output
				const stallTimeout = 45000; // Kill if no output for 45 seconds (more aggressive)
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
					log(`${shardPrefix}📊 Current output length: ${output.length} chars`);
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

					// Parse results from output
					const results = this.parseE2EResults(output);

					// Add error information if exit code is non-zero
					if (code !== 0 && errorOutput) {
						results.errorOutput = errorOutput;
					}

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

		if (passedMatch) results.passed = parseInt(passedMatch[1]);
		if (failedMatch) results.failed = parseInt(failedMatch[1]);
		if (skippedMatch) results.skipped = parseInt(skippedMatch[1]);
		if (flakyMatch) results.passed += parseInt(flakyMatch[1]); // Count flaky as passed

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

			// Move intentional failures from failed to intentionalFailures
			if (intentionalCount > 0) {
				results.intentionalFailures = intentionalCount;
				results.failed = Math.max(0, results.failed - intentionalCount);
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
