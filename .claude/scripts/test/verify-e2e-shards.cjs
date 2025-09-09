#!/usr/bin/env node
/**
 * Verify E2E test shard configuration
 * This script verifies that all test shards are properly configured
 */

const { execSync } = require("node:child_process");
const fs = require("node:fs");

function log(message) {
	console.log(`[${new Date().toISOString()}] ${message}`);
}

function verifyShards() {
	log("🔍 Verifying E2E test shard configuration...\n");

	// Expected shard configuration based on package.json
	const shards = [
		{ id: 1, name: "Smoke", command: "test:shard1", expectedFiles: 1 },
		{ id: 2, name: "Authentication", command: "test:shard2", expectedFiles: 2 },
		{ id: 3, name: "Accounts", command: "test:shard3", expectedFiles: 3 },
		{
			id: 4,
			name: "Admin & Invitations",
			command: "test:shard4",
			expectedFiles: 2,
		},
		{ id: 5, name: "Billing", command: "test:shard5", expectedFiles: 2 },
		{ id: 6, name: "Accessibility", command: "test:shard6", expectedFiles: 2 },
		{
			id: 7,
			name: "Config & Health",
			command: "test:shard7",
			expectedFiles: 2,
		},
	];

	let totalTests = 0;
	let totalFiles = 0;

	log("📋 Shard Configuration Summary:");
	log("================================\n");

	for (const shard of shards) {
		try {
			// Check if the shard command exists in package.json
			const packageJsonPath = "apps/e2e/package.json";
			const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
			const script = packageJson.scripts[shard.command];

			if (!script) {
				log(
					`❌ Shard ${shard.id} (${shard.name}): Command '${shard.command}' not found in package.json`,
				);
				continue;
			}

			// Extract test files from the command
			const filesMatch = script.match(/playwright test (.+?)(?:\s+--|\s*$)/);
			if (filesMatch) {
				const files = filesMatch[1]
					.split(" ")
					.filter((f) => f.includes(".spec.ts"));
				const fileCount = files.length;
				totalFiles += fileCount;

				// Count actual tests in each file
				let shardTestCount = 0;
				for (const file of files) {
					const filePath = `apps/e2e/${file}`;
					if (fs.existsSync(filePath)) {
						const content = fs.readFileSync(filePath, "utf8");
						const testMatches = content.match(/(?:test|it)\s*\(/g);
						const testCount = testMatches ? testMatches.length : 0;
						shardTestCount += testCount;
					}
				}
				totalTests += shardTestCount;

				log(`✅ Shard ${shard.id} (${shard.name}):`);
				log(`   Command: ${shard.command}`);
				log(`   Files: ${fileCount} (expected: ${shard.expectedFiles})`);
				log(`   Tests: ${shardTestCount}`);
				log(`   Script: ${script.substring(0, 80)}...`);
			} else {
				log(
					`⚠️ Shard ${shard.id} (${shard.name}): Could not parse test files from command`,
				);
			}
		} catch (error) {
			log(`❌ Shard ${shard.id} (${shard.name}): Error - ${error.message}`);
		}
		log("");
	}

	// Summary
	log("📊 Summary:");
	log("===========");
	log(`Total Shards: ${shards.length}`);
	log(`Total Test Files: ${totalFiles}`);
	log(`Total Tests: ${totalTests}`);

	// Check for all test files
	try {
		const allTestFiles = execSync(
			`find apps/e2e/tests -name "*.spec.ts" 2>/dev/null | wc -l`,
			{ encoding: "utf8" },
		).trim();
		log(`\n📁 Test files in apps/e2e/tests: ${allTestFiles}`);

		// Count all tests
		const allTestCount = execSync(
			`grep -E "test\\(|it\\(" apps/e2e/tests/**/*.spec.ts 2>/dev/null | wc -l`,
			{ encoding: "utf8" },
		).trim();
		log(`🧪 Total tests found by grep: ${allTestCount}`);

		if (parseInt(allTestCount) > totalTests) {
			log(
				`\n⚠️ Warning: Found ${allTestCount} tests by grep but only ${totalTests} in configured shards`,
			);
			log("Some tests may not be included in any shard!");
		}
	} catch (error) {
		log(`\n⚠️ Could not verify all test files: ${error.message}`);
	}

	return {
		shardCount: shards.length,
		fileCount: totalFiles,
		testCount: totalTests,
	};
}

// Run verification
const results = verifyShards();

log("\n✅ Verification complete!");
log(
	`The E2E test suite has ${results.testCount} tests across ${results.fileCount} files in ${results.shardCount} shards.`,
);
