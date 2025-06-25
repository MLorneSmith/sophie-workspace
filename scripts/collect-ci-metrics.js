#!/usr/bin/env node

/**
 * CI Metrics Collection Script
 * Collects and sends CI/CD metrics to New Relic
 */

import https from "node:https";
import { execSync } from "node:child_process";

// Environment variables
const NEW_RELIC_ACCOUNT_ID = process.env.NEW_RELIC_ACCOUNT_ID;
const NEW_RELIC_INSERT_KEY = process.env.NEW_RELIC_INSERT_KEY;
const GITHUB_REPOSITORY =
	process.env.GITHUB_REPOSITORY || "MLorneSmith/2025slideheroes";
const GITHUB_SHA = process.env.GITHUB_SHA || "unknown";
const GITHUB_REF_NAME = process.env.GITHUB_REF_NAME || "unknown";
const GITHUB_ACTOR = process.env.GITHUB_ACTOR || "unknown";
const GITHUB_WORKFLOW = process.env.GITHUB_WORKFLOW || "unknown";

function sendToNewRelic(events) {
	return new Promise((resolve, reject) => {
		const data = JSON.stringify(events);
		const options = {
			hostname: "insights-collector.newrelic.com",
			port: 443,
			path: `/v1/accounts/${NEW_RELIC_ACCOUNT_ID}/events`,
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-Insert-Key": NEW_RELIC_INSERT_KEY,
				"Content-Length": data.length,
			},
		};

		const req = https.request(options, (res) => {
			let responseData = "";
			res.on("data", (chunk) => {
				responseData += chunk;
			});
			res.on("end", () => {
				if (res.statusCode === 200) {
					console.log("✅ Metrics sent to New Relic successfully");
					resolve(responseData);
				} else {
					console.error(
						`❌ Failed to send metrics: ${res.statusCode} ${responseData}`,
					);
					reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
				}
			});
		});

		req.on("error", (error) => {
			console.error("❌ Error sending metrics to New Relic:", error);
			reject(error);
		});

		req.write(data);
		req.end();
	});
}

function getWorkflowMetrics() {
	const timestamp = Math.floor(Date.now() / 1000);

	// Get git information
	let branchName = GITHUB_REF_NAME;
	let commitHash = GITHUB_SHA;
	let commitMessage = "unknown";

	try {
		if (!GITHUB_SHA || GITHUB_SHA === "unknown") {
			commitHash = execSync("git rev-parse HEAD").toString().trim();
		}
		if (!GITHUB_REF_NAME || GITHUB_REF_NAME === "unknown") {
			branchName = execSync("git branch --show-current").toString().trim();
		}
		commitMessage = execSync(`git log -1 --pretty=format:"%s" ${commitHash}`)
			.toString()
			.trim();
	} catch (error) {
		console.warn("⚠️ Could not retrieve git information:", error.message);
	}

	// Calculate approximate build duration (placeholder - would need actual start time)
	const buildDuration = process.env.BUILD_DURATION || 0;

	return {
		eventType: "CIBuildEvent",
		timestamp,
		repository: GITHUB_REPOSITORY,
		branch: branchName,
		commit_sha: commitHash,
		commit_message: commitMessage,
		workflow: GITHUB_WORKFLOW,
		actor: GITHUB_ACTOR,
		build_duration_seconds: parseInt(buildDuration, 10),
		node_version: process.version,
		platform: process.platform,
		arch: process.arch,
	};
}

function getTestMetrics() {
	const timestamp = Math.floor(Date.now() / 1000);

	// Placeholder for test metrics - would need actual test results
	return {
		eventType: "CITestEvent",
		timestamp,
		repository: GITHUB_REPOSITORY,
		branch: GITHUB_REF_NAME,
		commit_sha: GITHUB_SHA,
		workflow: GITHUB_WORKFLOW,
		total_tests: parseInt(process.env.TEST_COUNT || "0", 10),
		passed_tests: parseInt(process.env.PASSED_TESTS || "0", 10),
		failed_tests: parseInt(process.env.FAILED_TESTS || "0", 10),
		test_duration_seconds: parseInt(process.env.TEST_DURATION || "0", 10),
		coverage_percentage: parseFloat(process.env.COVERAGE_PERCENTAGE || "0"),
	};
}

async function main() {
	console.log("📊 Collecting CI/CD metrics...");

	if (!NEW_RELIC_ACCOUNT_ID || !NEW_RELIC_INSERT_KEY) {
		console.error("❌ Missing required New Relic environment variables:");
		console.error("   - NEW_RELIC_ACCOUNT_ID");
		console.error("   - NEW_RELIC_INSERT_KEY");
		process.exit(1);
	}

	try {
		const events = [];

		// Collect build metrics
		const buildMetrics = getWorkflowMetrics();
		events.push(buildMetrics);
		console.log("📈 Collected build metrics");

		// Collect test metrics if available
		if (process.env.TEST_COUNT) {
			const testMetrics = getTestMetrics();
			events.push(testMetrics);
			console.log("🧪 Collected test metrics");
		}

		// Send all events to New Relic
		await sendToNewRelic(events);
		console.log(`✅ Successfully sent ${events.length} metrics to New Relic`);
	} catch (error) {
		console.error("❌ Failed to collect/send metrics:", error);
		process.exit(1);
	}
}

// Run main function if this is the main module
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (import.meta.url === `file://${process.argv[1]}`) {
	main();
}

export { sendToNewRelic, getWorkflowMetrics, getTestMetrics };
