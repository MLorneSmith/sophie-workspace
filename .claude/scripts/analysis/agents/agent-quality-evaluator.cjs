#!/usr/bin/env node

/**
 * Agent Quality Evaluator
 * Analyzes Claude Code subagents for quality based on best practices
 */

const fs = require("node:fs");
const path = require("node:path");
const yaml = require("js-yaml");

class AgentQualityEvaluator {
	constructor() {
		this.baseDir = path.join(process.cwd(), ".claude/agents");
		this.bestPractices = this.loadBestPractices();
		this.mcpServers = [
			"context7",
			"exa",
			"perplexity",
			"newrelic",
			"postgres",
			"code-reasoning",
		];
		this.customAgents = [
			"code-search-expert",
			"cicd-investigator",
			"cicd-orchestrator",
			"test-analysis-agent",
		];
	}

	loadBestPractices() {
		return {
			actionVerbs: [
				"execute",
				"create",
				"analyze",
				"generate",
				"implement",
				"deploy",
				"fix",
				"optimize",
				"validate",
			],
			advisoryPhrases: [
				"should",
				"would",
				"could",
				"might",
				"consider",
				"recommend",
				"suggest",
			],
			reactPatterns: ["observation", "thought", "action", "verification"],
			executionProtocols: [
				"phase",
				"step",
				"protocol",
				"stopping criteria",
				"success criteria",
			],
			parallelPatterns: ["parallel", "simultaneously", "concurrent", "batch"],
			delegationPatterns: [
				"delegate",
				"hand off",
				"use.*agent",
				"invoke.*expert",
			],
		};
	}

	async evaluateAllAgents() {
		const results = [];
		const agentFiles = this.findAgentFiles(this.baseDir);

		for (const filePath of agentFiles) {
			if (filePath.includes("_archive")) continue;

			const evaluation = await this.evaluateAgent(filePath);
			results.push(evaluation);
		}

		return this.generateSummary(results);
	}

	findAgentFiles(dir, files = []) {
		const items = fs.readdirSync(dir);

		for (const item of items) {
			const fullPath = path.join(dir, item);
			const stat = fs.statSync(fullPath);

			if (stat.isDirectory()) {
				this.findAgentFiles(fullPath, files);
			} else if (item.endsWith(".md")) {
				files.push(fullPath);
			}
		}

		return files;
	}

	async evaluateAgent(filePath) {
		const content = fs.readFileSync(filePath, "utf8");
		const { frontmatter, body } = this.parseFrontmatter(content);
		const agentName = path.basename(filePath, ".md");

		const scores = {
			structure: this.evaluateStructure(frontmatter, body),
			bestPractices: this.evaluateBestPractices(body, frontmatter),
			mcpIntegration: this.evaluateMcpIntegration(body, frontmatter),
			orchestration: this.evaluateOrchestration(body),
			contentQuality: this.evaluateContentQuality(body),
		};

		const totalScore = Object.values(scores).reduce(
			(sum, category) => sum + category.score,
			0,
		);

		return {
			name: agentName,
			path: filePath.replace(process.cwd(), "."),
			frontmatter,
			scores,
			totalScore,
			grade: this.calculateGrade(totalScore),
			issues: this.consolidateIssues(scores),
			recommendations: this.generateRecommendations(scores, frontmatter, body),
		};
	}

	parseFrontmatter(content) {
		// Handle both Unix (\n) and Windows (\r\n) line endings
		const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
		if (!match) {
			return { frontmatter: {}, body: content };
		}

		try {
			const frontmatter = yaml.load(match[1]);
			return { frontmatter, body: match[2] };
		} catch (e) {
			return { frontmatter: {}, body: content };
		}
	}

	evaluateStructure(frontmatter, body) {
		const issues = [];
		let score = 20;

		// Check frontmatter completeness (5 pts)
		if (!frontmatter.name) {
			score -= 2;
			issues.push("Missing name in frontmatter");
		}
		if (!frontmatter.description) {
			score -= 1;
			issues.push("Missing description in frontmatter");
		}
		if (!frontmatter.tools && body.includes("tool")) {
			score -= 2;
			issues.push("Tools mentioned but not specified in frontmatter");
		}

		// Check model selection appropriateness (5 pts)
		if (frontmatter.model) {
			const complexity = this.assessComplexity(body);
			const modelFit = this.checkModelFit(frontmatter.model, complexity);
			if (!modelFit.appropriate) {
				score -= 3;
				issues.push(`Model mismatch: ${modelFit.reason}`);
			}
		}

		// Tool specification clarity (5 pts)
		if (frontmatter.tools) {
			const tools = Array.isArray(frontmatter.tools)
				? frontmatter.tools
				: frontmatter.tools.split(",").map((t) => t.trim());
			if (tools.length === 0 || tools.some((t) => !t)) {
				score -= 2;
				issues.push("Invalid tools specification");
			}
		}

		// Category and metadata (5 pts)
		if (!frontmatter.category && !frontmatter.displayName) {
			score -= 2;
			issues.push("Missing category or displayName");
		}

		return { score, issues };
	}

	evaluateBestPractices(body, _frontmatter) {
		const issues = [];
		let score = 30;
		const bodyLower = body.toLowerCase();

		// Action-first design (10 pts)
		const actionCount = this.bestPractices.actionVerbs.filter((v) =>
			bodyLower.includes(v),
		).length;
		const advisoryCount = this.bestPractices.advisoryPhrases.filter((p) =>
			bodyLower.includes(p),
		).length;

		if (advisoryCount > actionCount * 2) {
			score -= 7;
			issues.push("Advisory mode detected - needs action-first conversion");
		} else if (advisoryCount > actionCount) {
			score -= 3;
			issues.push("Too many advisory phrases compared to action verbs");
		}

		// Clear role definition (5 pts)
		if (!bodyLower.includes("you are") && !bodyLower.includes("role")) {
			score -= 3;
			issues.push("Missing clear role definition");
		}

		// Success criteria (5 pts)
		if (
			!bodyLower.includes("success") &&
			!bodyLower.includes("complete") &&
			!bodyLower.includes("criteria")
		) {
			score -= 4;
			issues.push("Missing success/completion criteria");
		}

		// ReAct or execution protocol (5 pts)
		const hasReact = this.bestPractices.reactPatterns.some((p) =>
			bodyLower.includes(p),
		);
		const hasProtocol = this.bestPractices.executionProtocols.some((p) =>
			bodyLower.includes(p),
		);

		if (!hasReact && !hasProtocol) {
			score -= 4;
			issues.push("Missing ReAct pattern or execution protocol");
		}

		// Stopping criteria (5 pts)
		if (
			!bodyLower.includes("stop") &&
			!bodyLower.includes("complete") &&
			!bodyLower.includes("finish")
		) {
			score -= 3;
			issues.push("Missing stopping/completion criteria");
		}

		return { score, issues };
	}

	evaluateMcpIntegration(body, frontmatter) {
		const issues = [];
		let score = 15;
		const bodyLower = body.toLowerCase();

		// Check if MCP servers are relevant
		const needsMcp = this.checkMcpRelevance(frontmatter.name, body);

		if (needsMcp) {
			// Uses available MCP tools (10 pts)
			const mcpMentioned = this.mcpServers.some((s) => bodyLower.includes(s));
			if (!mcpMentioned) {
				score -= 8;
				issues.push("Should integrate MCP servers for this domain");
			}

			// Proper tool permissions (5 pts)
			const tools = frontmatter.tools;
			if (tools && typeof tools === "string" && tools.includes("mcp__")) {
				// Good - has MCP tools
			} else if (Array.isArray(tools)) {
				const hasMcp = tools.some((t) => t.includes("mcp__"));
				if (!hasMcp && needsMcp) {
					score -= 3;
					issues.push("Missing MCP tool permissions");
				}
			}
		}

		return { score, issues };
	}

	evaluateOrchestration(body) {
		const issues = [];
		let score = 15;
		const bodyLower = body.toLowerCase();

		// Delegation patterns (5 pts)
		const hasDelegation = this.bestPractices.delegationPatterns.some((p) =>
			new RegExp(p).test(bodyLower),
		);

		if (!hasDelegation && bodyLower.includes("complex")) {
			score -= 3;
			issues.push("Complex agent should delegate to specialists");
		}

		// Parallel execution (5 pts)
		const hasParallel = this.bestPractices.parallelPatterns.some((p) =>
			bodyLower.includes(p),
		);
		if (
			!hasParallel &&
			(bodyLower.includes("multiple") || bodyLower.includes("search"))
		) {
			score -= 4;
			issues.push("Should implement parallel execution patterns");
		}

		// Custom project agents (5 pts)
		const mentionsCustom = this.customAgents.some((a) => bodyLower.includes(a));
		if (!mentionsCustom && bodyLower.includes("search")) {
			score -= 3;
			issues.push(
				"Should reference custom project agents like code-search-expert",
			);
		}

		return { score, issues };
	}

	evaluateContentQuality(body) {
		const issues = [];
		let score = 20;
		const bodyLower = body.toLowerCase();

		// Examples (5 pts)
		if (!bodyLower.includes("example") && !bodyLower.includes("e.g.")) {
			score -= 4;
			issues.push("Missing concrete examples");
		}

		// Error handling (5 pts)
		if (
			!bodyLower.includes("error") &&
			!bodyLower.includes("fail") &&
			!bodyLower.includes("exception")
		) {
			score -= 4;
			issues.push("Missing error handling documentation");
		}

		// Output format (5 pts)
		if (
			!bodyLower.includes("output") &&
			!bodyLower.includes("return") &&
			!bodyLower.includes("format")
		) {
			score -= 3;
			issues.push("Missing output format specification");
		}

		// Conciseness (5 pts)
		const lineCount = body.split("\n").length;
		if (lineCount > 500) {
			score -= 3;
			issues.push("Too verbose - needs condensing");
		} else if (lineCount < 50) {
			score -= 2;
			issues.push("Too brief - needs more detail");
		}

		return { score, issues };
	}

	assessComplexity(body) {
		const indicators = {
			high: [
				"architecture",
				"orchestrat",
				"complex",
				"multi-step",
				"analysis",
				"synthesis",
			],
			medium: ["implement", "debug", "test", "develop", "build", "create"],
			low: ["format", "simple", "basic", "check", "validate", "log"],
		};

		const bodyLower = body.toLowerCase();

		const scores = {
			high: indicators.high.filter((i) => bodyLower.includes(i)).length * 3,
			medium: indicators.medium.filter((i) => bodyLower.includes(i)).length * 2,
			low: indicators.low.filter((i) => bodyLower.includes(i)).length,
		};

		if (scores.high > scores.medium && scores.high > scores.low) return "high";
		if (scores.low > scores.medium) return "low";
		return "medium";
	}

	checkModelFit(model, complexity) {
		const modelComplexityMap = {
			opus: ["high"],
			sonnet: ["medium", "high"],
			haiku: ["low", "medium"],
			inherit: ["low", "medium", "high"],
		};

		if (modelComplexityMap[model]?.includes(complexity)) {
			return { appropriate: true };
		}

		return {
			appropriate: false,
			reason: `${model} model doesn't match ${complexity} complexity`,
		};
	}

	checkMcpRelevance(name, body) {
		const mcpRelevantKeywords = [
			"research",
			"search",
			"web",
			"documentation",
			"database",
			"postgres",
			"mongodb",
			"sql",
			"monitoring",
			"observability",
			"metrics",
			"reasoning",
			"analysis",
		];

		const nameLower = (name || "").toLowerCase();
		const bodyLower = (body || "").toLowerCase();

		return mcpRelevantKeywords.some(
			(keyword) => nameLower.includes(keyword) || bodyLower.includes(keyword),
		);
	}

	calculateGrade(score) {
		if (score >= 90) return "A";
		if (score >= 80) return "B";
		if (score >= 70) return "C";
		if (score >= 60) return "D";
		return "F";
	}

	consolidateIssues(scores) {
		const allIssues = [];
		for (const category of Object.values(scores)) {
			allIssues.push(...category.issues);
		}
		return allIssues;
	}

	generateRecommendations(scores, frontmatter, body) {
		const recommendations = [];

		// Based on issues, generate specific recommendations
		const allIssues = this.consolidateIssues(scores);

		if (
			allIssues.includes(
				"Advisory mode detected - needs action-first conversion",
			)
		) {
			recommendations.push(
				"Convert to action-first design pattern with clear execution steps",
			);
		}

		if (allIssues.includes("Missing ReAct pattern or execution protocol")) {
			recommendations.push("Add ReAct cycle or structured execution protocol");
		}

		if (allIssues.includes("Should integrate MCP servers for this domain")) {
			recommendations.push(
				"Add relevant MCP server integration (context7, perplexity, etc.)",
			);
		}

		if (allIssues.includes("Should implement parallel execution patterns")) {
			recommendations.push(
				"Add parallel search/execution patterns for better performance",
			);
		}

		if (
			allIssues.includes("Tools mentioned but not specified in frontmatter")
		) {
			recommendations.push(
				"Add tools array to frontmatter with specific tool names",
			);
		}

		if (!frontmatter.model) {
			const complexity = this.assessComplexity(body);
			const modelMap = { high: "opus", medium: "sonnet", low: "haiku" };
			recommendations.push(
				`Add model: ${modelMap[complexity]} based on complexity`,
			);
		}

		return recommendations;
	}

	generateSummary(results) {
		// Sort by total score
		results.sort((a, b) => a.totalScore - b.totalScore);

		const summary = {
			totalAgents: results.length,
			averageScore:
				results.reduce((sum, r) => sum + r.totalScore, 0) / results.length,
			gradeDistribution: {},
			bottomQuartile: results.slice(0, Math.ceil(results.length / 4)),
			topPerformers: results.slice(-5).reverse(),
			commonIssues: this.findCommonIssues(results),
			categoryAnalysis: this.analyzeByCategoryScores(results),
		};

		// Calculate grade distribution
		for (const result of results) {
			summary.gradeDistribution[result.grade] =
				(summary.gradeDistribution[result.grade] || 0) + 1;
		}

		return { results, summary };
	}

	findCommonIssues(results) {
		const issueCount = {};

		for (const result of results) {
			for (const issue of result.issues) {
				issueCount[issue] = (issueCount[issue] || 0) + 1;
			}
		}

		return Object.entries(issueCount)
			.sort((a, b) => b[1] - a[1])
			.slice(0, 10)
			.map(([issue, count]) => ({
				issue,
				count,
				percentage: ((count / results.length) * 100).toFixed(1),
			}));
	}

	analyzeByCategoryScores(results) {
		const categories = [
			"structure",
			"bestPractices",
			"mcpIntegration",
			"orchestration",
			"contentQuality",
		];
		const analysis = {};

		for (const category of categories) {
			const scores = results.map((r) => r.scores[category].score);
			const maxPossible =
				category === "structure" || category === "contentQuality"
					? 20
					: category === "bestPractices"
						? 30
						: 15;

			analysis[category] = {
				average: scores.reduce((sum, s) => sum + s, 0) / scores.length,
				maxPossible,
				percentageOfMax: (
					(scores.reduce((sum, s) => sum + s, 0) /
						scores.length /
						maxPossible) *
					100
				).toFixed(1),
			};
		}

		return analysis;
	}
}

// Main execution
async function main() {
	console.log("🔍 Starting Agent Quality Evaluation...\n");

	const evaluator = new AgentQualityEvaluator();
	const { results, summary } = await evaluator.evaluateAllAgents();

	// Save detailed results
	const outputDir = path.join(
		process.cwd(),
		"reports",
		new Date().toISOString().split("T")[0],
	);
	if (!fs.existsSync(outputDir)) {
		fs.mkdirSync(outputDir, { recursive: true });
	}

	const outputPath = path.join(outputDir, "agent-quality-evaluation.json");
	fs.writeFileSync(outputPath, JSON.stringify({ results, summary }, null, 2));

	// Print summary to console
	console.log("📊 Evaluation Summary:");
	console.log(`   Total Agents: ${summary.totalAgents}`);
	console.log(`   Average Score: ${summary.averageScore.toFixed(1)}/100`);
	console.log("\n📈 Grade Distribution:");
	for (const [grade, count] of Object.entries(summary.gradeDistribution)) {
		console.log(`   ${grade}: ${count} agents`);
	}

	console.log("\n⚠️  Bottom Quartile (Need Immediate Attention):");
	for (const agent of summary.bottomQuartile.slice(0, 5)) {
		console.log(
			`   - ${agent.name} (${agent.totalScore.toFixed(1)}/100, Grade: ${agent.grade})`,
		);
	}

	console.log("\n✨ Top Performers:");
	for (const agent of summary.topPerformers) {
		console.log(
			`   - ${agent.name} (${agent.totalScore.toFixed(1)}/100, Grade: ${agent.grade})`,
		);
	}

	console.log("\n🔧 Most Common Issues:");
	for (const issue of summary.commonIssues.slice(0, 5)) {
		console.log(
			`   - ${issue.issue} (${issue.count} agents, ${issue.percentage}%)`,
		);
	}

	console.log(`\n✅ Full results saved to: ${outputPath}`);
}

// Run if executed directly
if (require.main === module) {
	main().catch(console.error);
}

module.exports = { AgentQualityEvaluator };
