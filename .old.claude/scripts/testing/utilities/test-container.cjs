#!/usr/bin/env node

/**
 * Test Container Wrapper
 *
 * This script ensures the test server container is running on port 3001
 * and then executes tests against it, allowing parallel development on port 3000.
 *
 * Usage:
 *   node .claude/scripts/test/test-container.cjs [options]
 *
 * Options:
 *   --quick    Run quick smoke tests only
 *   --unit     Run only unit tests
 *   --e2e      Run only E2E tests
 *   --debug    Enable debug output
 *   --no-container  Skip container management (use existing server)
 */

const { execSync, spawn } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");

// Configuration
const TEST_PORT = 3001;
const CONTAINER_NAME = "slideheroes-app-test";
const COMPOSE_FILE = "docker-compose.test.yml";
const TEST_URL = `http://localhost:${TEST_PORT}`;
const HEALTH_CHECK_URL = `${TEST_URL}/api/health`;

// Parse arguments
const args = process.argv.slice(2);
const options = {
	quick: args.includes("--quick"),
	unit: args.includes("--unit"),
	e2e: args.includes("--e2e"),
	debug: args.includes("--debug"),
	noContainer: args.includes("--no-container"),
};

// Logging functions
const log = (msg) => console.log(`[${new Date().toISOString()}] ${msg}`);
const logError = (msg) =>
	console.error(`[${new Date().toISOString()}] ERROR: ${msg}`);
const debug = (msg) =>
	options.debug && console.log(`[${new Date().toISOString()}] DEBUG: ${msg}`);

/**
 * Check if test container is running
 */
function isContainerRunning() {
	try {
		const result = execSync(
			`docker ps --format "{{.Names}}" | grep -q "^${CONTAINER_NAME}$"`,
			{
				stdio: "pipe",
			},
		);
		return true;
	} catch {
		return false;
	}
}

/**
 * Check if test server is healthy
 */
async function isServerHealthy() {
	try {
		const response = await fetch(HEALTH_CHECK_URL);
		const data = await response.json();
		return data.status === "ready";
	} catch (error) {
		debug(`Health check failed: ${error.message}`);
		return false;
	}
}

/**
 * Wait for server to be healthy
 */
async function waitForServer(maxRetries = 60, retryDelay = 1000) {
	log(`⏳ Waiting for test server at ${TEST_URL}...`);

	for (let i = 0; i < maxRetries; i++) {
		if (await isServerHealthy()) {
			log("✅ Test server is healthy");
			return true;
		}

		if (i % 10 === 0 && i > 0) {
			log(`   Still waiting... (${i}/${maxRetries})`);
		}

		await new Promise((resolve) => setTimeout(resolve, retryDelay));
	}

	logError(`Test server failed to become healthy after ${maxRetries} retries`);
	return false;
}

/**
 * Start test container
 */
async function startTestContainer() {
	log("🚀 Starting test container...");

	// Check if container is already running
	if (isContainerRunning()) {
		log("✅ Test container is already running");
		return await waitForServer();
	}

	// Check if docker-compose.test.yml exists
	if (!fs.existsSync(COMPOSE_FILE)) {
		logError(
			`${COMPOSE_FILE} not found. Please ensure you're in the project root.`,
		);
		process.exit(1);
	}

	try {
		// Start the container
		log("📦 Starting container with docker-compose...");
		execSync(`docker-compose -f ${COMPOSE_FILE} up -d`, {
			stdio: options.debug ? "inherit" : "pipe",
		});

		// Wait for server to be ready
		return await waitForServer();
	} catch (error) {
		logError(`Failed to start test container: ${error.message}`);
		return false;
	}
}

/**
 * Stop test container
 */
function stopTestContainer() {
	log("🛑 Stopping test container...");
	try {
		execSync(`docker-compose -f ${COMPOSE_FILE} down`, {
			stdio: options.debug ? "inherit" : "pipe",
		});
		log("✅ Test container stopped");
	} catch (error) {
		logError(`Failed to stop test container: ${error.message}`);
	}
}

/**
 * Run tests with modified configuration
 */
function runTests() {
	log("🧪 Running tests against containerized server...");

	// Build test controller arguments
	const testArgs = [];
	if (options.quick) testArgs.push("--quick");
	if (options.unit) testArgs.push("--unit");
	if (options.e2e) testArgs.push("--e2e");
	if (options.debug) testArgs.push("--debug");

	// Set environment variables to use port 3001
	const env = {
		...process.env,
		TEST_BASE_URL: TEST_URL,
		NEXT_PUBLIC_SITE_URL: TEST_URL,
		PORT: TEST_PORT.toString(),
		// Tell the test controller not to start its own dev server
		SKIP_DEV_SERVER: "true",
	};

	// Run the test controller
	const testProcess = spawn(
		"node",
		[path.join(__dirname, "test-controller.cjs"), ...testArgs],
		{
			env,
			stdio: "inherit",
		},
	);

	return new Promise((resolve) => {
		testProcess.on("exit", (code) => {
			resolve(code === 0);
		});
	});
}

/**
 * Main execution
 */
async function main() {
	log("🎯 Test Container Wrapper Started");
	log(`📋 Configuration: Port=${TEST_PORT}, Container=${!options.noContainer}`);

	let success = false;

	try {
		// Step 1: Ensure test container is running (unless --no-container)
		if (!options.noContainer) {
			const containerReady = await startTestContainer();
			if (!containerReady) {
				logError("Failed to start test container");
				process.exit(1);
			}
		} else {
			log("⚠️ Skipping container management (--no-container flag)");
			// Still check if server is healthy
			if (!(await isServerHealthy())) {
				logError(`No server responding at ${TEST_URL}`);
				process.exit(1);
			}
		}

		// Step 2: Run tests
		success = await runTests();

		// Step 3: Report results
		if (success) {
			log("✅ All tests completed successfully!");
		} else {
			logError("❌ Some tests failed");
		}
	} catch (error) {
		logError(`Unexpected error: ${error.message}`);
		if (options.debug) {
			console.error(error.stack);
		}
		success = false;
	} finally {
		// Optionally stop container (you might want to keep it running)
		// if (!options.noContainer && process.env.STOP_CONTAINER_AFTER_TEST === "true") {
		//     stopTestContainer();
		// }

		process.exit(success ? 0 : 1);
	}
}

// Handle signals
process.on("SIGINT", () => {
	log("\n🛑 Received SIGINT, cleaning up...");
	// You might want to stop the container here
	process.exit(130);
});

process.on("SIGTERM", () => {
	log("\n🛑 Received SIGTERM, cleaning up...");
	process.exit(143);
});

// Run main
main().catch((error) => {
	logError(`Fatal error: ${error.message}`);
	process.exit(1);
});
