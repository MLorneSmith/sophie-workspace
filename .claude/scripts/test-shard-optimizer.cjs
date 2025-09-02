#!/usr/bin/env node

/**
 * Test Shard Optimizer
 * Dynamically analyzes and distributes tests across shards for optimal performance
 */

const fs = require("node:fs").promises;
const path = require("node:path");
const { execSync } = require("node:child_process");

// Helper function to glob files
async function glob(_pattern) {
	try {
		const result = execSync(
			`find apps/e2e/tests -name "*.spec.ts" 2>/dev/null`,
			{ encoding: "utf8" },
		);
		return result.split("\n").filter(Boolean);
	} catch (error) {
		return [];
	}
}

class ShardOptimizer {
	constructor() {
		this.metricsFile = path.join(
			process.cwd(),
			".claude/data/test-metrics.json",
		);
		this.configFile = path.join(
			process.cwd(),
			".claude/data/shard-config.json",
		);
		this.metrics = null;
		this.tests = [];
	}

	/**
	 * Analyze test files to understand their distribution and complexity
	 */
	async analyzeTests() {
		const testFiles = await glob();
		const testAnalysis = [];

		for (const file of testFiles) {
			const content = await fs.readFile(file, "utf8");
			const analysis = this.analyzeTestFile(content, file);
			testAnalysis.push(analysis);
		}

		this.tests = testAnalysis;
		return testAnalysis;
	}

	/**
	 * Analyze a single test file to extract metrics
	 */
	analyzeTestFile(content, filePath) {
		const fileName = path.basename(filePath);
		const category = this.getCategoryFromPath(filePath);

		// Count test blocks
		const testMatches = content.match(/test\s*\(/g) || [];
		const testDescribeMatches = content.match(/test\.describe\s*\(/g) || [];
		const testSkipMatches = content.match(/test\.skip\s*\(/g) || [];

		// Estimate complexity based on certain patterns
		const hasBeforeEach = content.includes("test.beforeEach");
		const hasAfterEach = content.includes("test.afterEach");
		const waitForPatterns = (content.match(/waitFor/g) || []).length;
		const expectPatterns = (content.match(/expect\(/g) || []).length;
		const pageGotoPatterns = (content.match(/page\.goto/g) || []).length;

		// Calculate complexity score (higher = more complex/slower)
		let complexityScore = testMatches.length * 10;
		complexityScore += testDescribeMatches.length * 5;
		complexityScore += waitForPatterns * 2;
		complexityScore += expectPatterns;
		complexityScore += pageGotoPatterns * 3;
		if (hasBeforeEach) complexityScore += 5;
		if (hasAfterEach) complexityScore += 5;

		// Get historical execution time if available
		const historicalTime = this.getHistoricalTime(fileName);

		return {
			file: fileName,
			path: filePath,
			category,
			testCount: testMatches.length,
			suiteCount: testDescribeMatches.length,
			skippedCount: testSkipMatches.length,
			activeTests: testMatches.length - testSkipMatches.length,
			complexity: complexityScore,
			estimatedTime: historicalTime || complexityScore * 100, // ms
			hasSetup: hasBeforeEach || hasAfterEach,
		};
	}

	/**
	 * Get category from file path
	 */
	getCategoryFromPath(filePath) {
		const parts = filePath.split("/");
		const testsIndex = parts.indexOf("tests");
		if (testsIndex >= 0 && testsIndex < parts.length - 1) {
			const category = parts[testsIndex + 1];
			// If the category is a test file directly under tests/, use 'general'
			return category.endsWith(".spec.ts") ? "general" : category;
		}
		return "unknown";
	}

	/**
	 * Load historical metrics if available
	 */
	async loadMetrics() {
		try {
			const data = await fs.readFile(this.metricsFile, "utf8");
			this.metrics = JSON.parse(data);
			return true;
		} catch (error) {
			// No metrics file yet, will create one
			this.metrics = {
				history: [],
				averages: {},
				lastUpdated: null,
			};
			return false;
		}
	}

	/**
	 * Get historical execution time for a test file
	 */
	getHistoricalTime(fileName) {
		if (!this.metrics || !this.metrics.averages) return null;
		return this.metrics.averages[fileName] || null;
	}

	/**
	 * Update metrics with new execution data
	 */
	async updateMetrics(executionData) {
		if (!this.metrics) {
			await this.loadMetrics();
		}

		// Add to history (keep last 10 runs)
		this.metrics.history.unshift(executionData);
		if (this.metrics.history.length > 10) {
			this.metrics.history = this.metrics.history.slice(0, 10);
		}

		// Recalculate averages
		const fileTimings = {};
		for (const run of this.metrics.history) {
			for (const shard of run.shards) {
				for (const test of shard.tests) {
					if (!fileTimings[test.file]) {
						fileTimings[test.file] = [];
					}
					fileTimings[test.file].push(test.duration);
				}
			}
		}

		// Calculate averages
		this.metrics.averages = {};
		for (const [file, times] of Object.entries(fileTimings)) {
			const avg = times.reduce((a, b) => a + b, 0) / times.length;
			this.metrics.averages[file] = Math.round(avg);
		}

		this.metrics.lastUpdated = new Date().toISOString();

		// Save metrics
		await this.saveMetrics();
	}

	/**
	 * Save metrics to file
	 */
	async saveMetrics() {
		const dir = path.dirname(this.metricsFile);
		await fs.mkdir(dir, { recursive: true });
		await fs.writeFile(this.metricsFile, JSON.stringify(this.metrics, null, 2));
	}

	/**
	 * Generate optimal shard configuration
	 */
	async generateShardConfig(options = {}) {
		const {
			shardCount = 9,
			strategy = "balanced", // 'balanced', 'category', 'complexity'
			maxTestsPerShard = 15,
			minTestsPerShard = 5,
		} = options;

		// Ensure tests are analyzed
		if (this.tests.length === 0) {
			await this.analyzeTests();
		}

		// Filter out skipped tests
		const activeTests = this.tests.filter((t) => t.activeTests > 0);

		console.log(
			`📊 Analyzing ${activeTests.length} test files with ${activeTests.reduce((sum, t) => sum + t.activeTests, 0)} active tests`,
		);

		let shards;
		switch (strategy) {
			case "category":
				shards = this.distributeByCategory(activeTests, shardCount);
				break;
			case "complexity":
				shards = this.distributeByComplexity(activeTests, shardCount);
				break;
			default:
				shards = this.distributeBalanced(activeTests, shardCount);
				break;
		}

		// Validate shard distribution
		const validation = this.validateShards(
			shards,
			maxTestsPerShard,
			minTestsPerShard,
		);

		const config = {
			strategy,
			shardCount: shards.length,
			totalTests: activeTests.reduce((sum, t) => sum + t.activeTests, 0),
			generated: new Date().toISOString(),
			shards,
			validation,
			profiles: this.generateProfiles(activeTests),
		};

		// Save configuration
		await this.saveConfig(config);

		return config;
	}

	/**
	 * Distribute tests evenly by count and complexity
	 */
	distributeBalanced(tests, shardCount) {
		// Sort tests by complexity (highest first)
		const sortedTests = [...tests].sort((a, b) => b.complexity - a.complexity);

		// Initialize shards
		const shards = [];
		for (let i = 0; i < shardCount; i++) {
			shards.push({
				id: i + 1,
				name: `Shard ${i + 1}`,
				tests: [],
				totalTests: 0,
				totalComplexity: 0,
				estimatedTime: 0,
				categories: new Set(),
			});
		}

		// Distribute tests using a greedy algorithm
		// Always assign to the shard with lowest total complexity
		for (const test of sortedTests) {
			// Find shard with lowest complexity
			const targetShard = shards.reduce((min, shard) =>
				shard.totalComplexity < min.totalComplexity ? shard : min,
			);

			targetShard.tests.push(test.file);
			targetShard.totalTests += test.activeTests;
			targetShard.totalComplexity += test.complexity;
			targetShard.estimatedTime += test.estimatedTime;
			targetShard.categories.add(test.category);
		}

		// Convert sets to arrays and generate names
		return shards.map((shard) => ({
			...shard,
			categories: Array.from(shard.categories),
			name: this.generateShardName(shard),
			estimatedTime: Math.round(shard.estimatedTime / 1000), // Convert to seconds
		}));
	}

	/**
	 * Distribute tests by category
	 */
	distributeByCategory(tests, shardCount) {
		// Group tests by category
		const categories = {};
		for (const test of tests) {
			if (!categories[test.category]) {
				categories[test.category] = [];
			}
			categories[test.category].push(test);
		}

		// Create shards based on categories
		const shards = [];
		let shardIndex = 0;

		for (const [category, categoryTests] of Object.entries(categories)) {
			if (shards[shardIndex] === undefined) {
				shards[shardIndex] = {
					id: shardIndex + 1,
					name: `Shard ${shardIndex + 1}`,
					tests: [],
					totalTests: 0,
					totalComplexity: 0,
					estimatedTime: 0,
					categories: new Set(),
				};
			}

			const shard = shards[shardIndex];
			for (const test of categoryTests) {
				shard.tests.push(test.file);
				shard.totalTests += test.activeTests;
				shard.totalComplexity += test.complexity;
				shard.estimatedTime += test.estimatedTime;
				shard.categories.add(test.category);
			}

			// Move to next shard if current is getting large
			if (shard.totalTests > 10) {
				shardIndex = (shardIndex + 1) % shardCount;
			}
		}

		// Convert sets to arrays and generate names
		return shards.map((shard) => ({
			...shard,
			categories: Array.from(shard.categories),
			name: this.generateShardName(shard),
			estimatedTime: Math.round(shard.estimatedTime / 1000),
		}));
	}

	/**
	 * Distribute tests purely by complexity
	 */
	distributeByComplexity(tests, shardCount) {
		// Sort by complexity and distribute using round-robin
		const sortedTests = [...tests].sort((a, b) => b.complexity - a.complexity);

		const shards = [];
		for (let i = 0; i < shardCount; i++) {
			shards.push({
				id: i + 1,
				name: `Shard ${i + 1}`,
				tests: [],
				totalTests: 0,
				totalComplexity: 0,
				estimatedTime: 0,
				categories: new Set(),
			});
		}

		// Round-robin distribution of complexity-sorted tests
		sortedTests.forEach((test, index) => {
			const shard = shards[index % shardCount];
			shard.tests.push(test.file);
			shard.totalTests += test.activeTests;
			shard.totalComplexity += test.complexity;
			shard.estimatedTime += test.estimatedTime;
			shard.categories.add(test.category);
		});

		// Convert sets to arrays
		return shards.map((shard) => ({
			...shard,
			categories: Array.from(shard.categories),
			name: this.generateShardName(shard),
			estimatedTime: Math.round(shard.estimatedTime / 1000),
		}));
	}

	/**
	 * Generate a descriptive name for a shard based on its contents
	 */
	generateShardName(shard) {
		if (shard.categories.size === 1) {
			const category = Array.from(shard.categories)[0];
			return `${category.charAt(0).toUpperCase() + category.slice(1)} Tests`;
		} else if (shard.categories.size === 2) {
			const cats = Array.from(shard.categories);
			return `${cats[0]} + ${cats[1]}`;
		} else if (shard.totalComplexity > 200) {
			return `Heavy Tests (Shard ${shard.id})`;
		} else if (shard.totalComplexity < 100) {
			return `Light Tests (Shard ${shard.id})`;
		} else {
			return `Mixed Tests (Shard ${shard.id})`;
		}
	}

	/**
	 * Validate shard distribution
	 */
	validateShards(shards, maxTests, minTests) {
		const issues = [];
		const stats = {
			avgTests: 0,
			avgComplexity: 0,
			avgTime: 0,
			maxDeviation: 0,
		};

		// Calculate averages
		const totalTests = shards.reduce((sum, s) => sum + s.totalTests, 0);
		const totalComplexity = shards.reduce(
			(sum, s) => sum + s.totalComplexity,
			0,
		);
		const totalTime = shards.reduce((sum, s) => sum + s.estimatedTime, 0);

		stats.avgTests = Math.round(totalTests / shards.length);
		stats.avgComplexity = Math.round(totalComplexity / shards.length);
		stats.avgTime = Math.round(totalTime / shards.length);

		// Check each shard
		for (const shard of shards) {
			if (shard.totalTests > maxTests) {
				issues.push(
					`Shard ${shard.id} has too many tests (${shard.totalTests} > ${maxTests})`,
				);
			}
			if (shard.totalTests < minTests && shard.totalTests > 0) {
				issues.push(
					`Shard ${shard.id} has too few tests (${shard.totalTests} < ${minTests})`,
				);
			}

			// Calculate deviation from average
			const deviation =
				(Math.abs(shard.estimatedTime - stats.avgTime) / stats.avgTime) * 100;
			stats.maxDeviation = Math.max(stats.maxDeviation, deviation);
		}

		// Check balance (allow higher deviation for realistic test distribution)
		if (stats.maxDeviation > 100) {
			issues.push(
				`Shards are imbalanced (max deviation: ${stats.maxDeviation.toFixed(1)}%)`,
			);
		}

		return {
			valid: issues.length === 0,
			issues,
			stats,
		};
	}

	/**
	 * Generate configuration profiles
	 */
	generateProfiles(tests) {
		const totalTests = tests.reduce((sum, t) => sum + t.activeTests, 0);

		return {
			light: {
				shards: 3,
				testsPerShard: Math.ceil(totalTests / 3),
				description: "Quick validation (3 shards)",
				estimatedTime: "2-3 minutes",
			},
			normal: {
				shards: 6,
				testsPerShard: Math.ceil(totalTests / 6),
				description: "Standard testing (6 shards)",
				estimatedTime: "3-4 minutes",
			},
			heavy: {
				shards: 9,
				testsPerShard: Math.ceil(totalTests / 9),
				description: "Full parallel execution (9 shards)",
				estimatedTime: "2-3 minutes",
			},
			sequential: {
				shards: 1,
				testsPerShard: totalTests,
				description: "Sequential execution (1 shard)",
				estimatedTime: "10-15 minutes",
			},
		};
	}

	/**
	 * Save configuration to file
	 */
	async saveConfig(config) {
		const dir = path.dirname(this.configFile);
		await fs.mkdir(dir, { recursive: true });
		await fs.writeFile(this.configFile, JSON.stringify(config, null, 2));
		console.log(`✅ Configuration saved to ${this.configFile}`);
	}

	/**
	 * Generate optimized Playwright configuration
	 */
	async generatePlaywrightConfig(config) {
		const shardConfig = config.shards.map((shard) => ({
			id: shard.id,
			name: shard.name,
			testMatch: shard.tests.map((file) => `**/${file}`),
			timeout: Math.max(30000, shard.estimatedTime * 1.5), // 50% buffer
		}));

		console.log("\n📋 Playwright Configuration:");
		console.log("Add this to your playwright.config.ts:\n");
		console.log(JSON.stringify(shardConfig, null, 2));

		return shardConfig;
	}

	/**
	 * Analyze current test execution and suggest improvements
	 */
	async analyzeExecution(resultFile) {
		try {
			const results = JSON.parse(await fs.readFile(resultFile, "utf8"));
			const analysis = {
				suggestions: [],
				metrics: {},
				optimizations: [],
			};

			// Analyze E2E shards
			if (results.e2e?.shards) {
				const shardTimes = [];
				const shardFailures = [];

				for (const [shardKey, shard] of Object.entries(results.e2e.shards)) {
					const time = parseInt(shard.duration);
					shardTimes.push(time);
					if (shard.failed > 0) {
						shardFailures.push({
							name: shard.name,
							failed: shard.failed,
							total: shard.total,
						});
					}
				}

				// Calculate imbalance
				const avgTime =
					shardTimes.reduce((a, b) => a + b, 0) / shardTimes.length;
				const maxTime = Math.max(...shardTimes);
				const minTime = Math.min(...shardTimes);
				const imbalance = ((maxTime - minTime) / avgTime) * 100;

				analysis.metrics = {
					avgShardTime: avgTime,
					maxShardTime: maxTime,
					minShardTime: minTime,
					imbalance: imbalance.toFixed(1) + "%",
				};

				// Generate suggestions
				if (imbalance > 30) {
					analysis.suggestions.push(
						"Shards are imbalanced. Consider redistributing tests.",
					);
					analysis.optimizations.push({
						action: "rebalance",
						reason: `${imbalance.toFixed(1)}% imbalance detected`,
						command:
							"node .claude/scripts/test-shard-optimizer.cjs --rebalance",
					});
				}

				if (shardFailures.length > 0) {
					analysis.suggestions.push(
						`${shardFailures.length} shards had failures. Consider adding retry logic.`,
					);
					for (const failure of shardFailures) {
						analysis.optimizations.push({
							action: "investigate",
							shard: failure.name,
							failureRate: `${((failure.failed / failure.total) * 100).toFixed(1)}%`,
						});
					}
				}
			}

			return analysis;
		} catch (error) {
			console.error(`Failed to analyze execution: ${error.message}`);
			return null;
		}
	}
}

// Command-line interface
async function main() {
	const optimizer = new ShardOptimizer();
	const args = process.argv.slice(2);
	const command = args[0] || "optimize";

	console.log("🚀 Test Shard Optimizer");
	console.log("─".repeat(40));

	// Load historical metrics
	await optimizer.loadMetrics();

	switch (command) {
		case "analyze": {
			// Analyze test distribution
			const tests = await optimizer.analyzeTests();
			console.log("\n📊 Test Analysis:");
			console.log(`Total files: ${tests.length}`);
			console.log(
				`Total tests: ${tests.reduce((sum, t) => sum + t.activeTests, 0)}`,
			);
			console.log("\nBy category:");
			const byCategory = {};
			for (const test of tests) {
				byCategory[test.category] =
					(byCategory[test.category] || 0) + test.activeTests;
			}
			for (const [cat, count] of Object.entries(byCategory)) {
				console.log(`  ${cat}: ${count} tests`);
			}
			break;
		}

		case "optimize":
		case "rebalance": {
			// Generate optimal configuration
			const strategy = args[1] || "balanced";
			const shardCount = parseInt(args[2]) || 9;

			console.log(
				`\n🔧 Generating ${strategy} configuration with ${shardCount} shards...`,
			);
			const config = await optimizer.generateShardConfig({
				strategy,
				shardCount,
			});

			console.log("\n✅ Configuration generated:");
			console.log(`  Strategy: ${config.strategy}`);
			console.log(`  Shards: ${config.shardCount}`);
			console.log(`  Total tests: ${config.totalTests}`);

			if (config.validation.valid) {
				console.log("  ✅ Validation: PASSED");
			} else {
				console.log("  ⚠️ Validation issues:");
				for (const issue of config.validation.issues) {
					console.log(`    - ${issue}`);
				}
			}

			console.log("\n📊 Shard distribution:");
			for (const shard of config.shards) {
				console.log(`  Shard ${shard.id} (${shard.name}):`);
				console.log(`    Tests: ${shard.totalTests}`);
				console.log(`    Categories: ${shard.categories.join(", ")}`);
				console.log(`    Est. time: ${shard.estimatedTime}s`);
			}

			console.log("\n📋 Recommended profiles:");
			for (const [name, profile] of Object.entries(config.profiles)) {
				console.log(
					`  ${name}: ${profile.description} - ${profile.estimatedTime}`,
				);
			}
			break;
		}

		case "analyze-results": {
			// Analyze execution results
			const resultFile = args[1] || "/tmp/.claude_test_results.json";
			console.log(`\n📈 Analyzing results from ${resultFile}...`);
			const analysis = await optimizer.analyzeExecution(resultFile);

			if (analysis) {
				console.log("\n📊 Execution Metrics:");
				for (const [key, value] of Object.entries(analysis.metrics)) {
					console.log(`  ${key}: ${value}`);
				}

				if (analysis.suggestions.length > 0) {
					console.log("\n💡 Suggestions:");
					for (const suggestion of analysis.suggestions) {
						console.log(`  - ${suggestion}`);
					}
				}

				if (analysis.optimizations.length > 0) {
					console.log("\n🔧 Recommended optimizations:");
					for (const opt of analysis.optimizations) {
						console.log(`  - ${opt.action}: ${opt.reason || opt.shard}`);
						if (opt.command) {
							console.log(`    Run: ${opt.command}`);
						}
					}
				}
			}
			break;
		}

		case "update-metrics": {
			// Update metrics from test results
			const dataFile = args[1] || "/tmp/.claude_test_results.json";
			console.log(`\n📊 Updating metrics from ${dataFile}...`);
			try {
				const data = JSON.parse(await fs.readFile(dataFile, "utf8"));
				await optimizer.updateMetrics(data);
				console.log("✅ Metrics updated successfully");
			} catch (error) {
				console.error(`❌ Failed to update metrics: ${error.message}`);
			}
			break;
		}

		default:
			console.log("\nUsage: node test-shard-optimizer.cjs [command] [options]");
			console.log("\nCommands:");
			console.log("  analyze              - Analyze test distribution");
			console.log("  optimize [strategy]  - Generate optimal shard config");
			console.log("  rebalance           - Rebalance based on metrics");
			console.log("  analyze-results     - Analyze test execution results");
			console.log("  update-metrics      - Update historical metrics");
			console.log("\nStrategies: balanced, category, complexity");
	}
}

// Run if executed directly
if (require.main === module) {
	main().catch(console.error);
}

module.exports = { ShardOptimizer };
