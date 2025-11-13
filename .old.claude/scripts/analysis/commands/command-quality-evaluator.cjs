#!/usr/bin/env node

/**
 * Command Quality Evaluator
 * Analyzes Claude Code slash commands for quality based on PRIME framework and best practices
 */

const fs = require("node:fs");
const path = require("node:path");
const yaml = require("js-yaml");

class CommandQualityEvaluator {
	constructor() {
		this.baseDir = path.join(process.cwd(), ".claude/commands");
		this.primePhases = ["purpose", "role", "inputs", "method", "expectations"];
		this.actionVerbs = [
			"execute",
			"create",
			"analyze",
			"generate",
			"implement",
			"deploy",
			"fix",
			"optimize",
			"validate",
			"parse",
			"transform",
			"build",
			"construct",
			"process",
			"apply",
			"gather",
			"load",
			"collect",
			"extract",
			"retrieve",
			"define",
			"establish",
			"determine",
			"specify",
			"configure",
			"validate",
			"verify",
			"deliver",
			"present",
			"report",
			"handle",
			"catch",
			"recover",
			"retry",
			"fallback",
		];
		this.advisoryPhrases = [
			"should",
			"would",
			"could",
			"might",
			"consider",
			"recommend",
			"suggest",
			"maybe",
			"perhaps",
			"possibly",
		];
		this.availableAgents = this.loadAvailableAgents();
		this.mcpServers = [
			"context7",
			"exa",
			"perplexity",
			"newrelic",
			"postgres",
			"code-reasoning",
			"docs-mcp",
		];
		this.commandPatterns = {
			dynamicContext: /context-loader\.cjs|command-analyzer\.cjs/i,
			userClarification: /clarification|question.*round|interactive/i,
			parallelExecution: /parallel|simultaneously|concurrent|batch/i,
			agentDelegation: /Task tool|subagent_type|delegate.*agent/i,
			progressTracking: /TodoWrite|progress.*tracking/i,
			validation: /validation.*check|verify.*output|quality.*assurance/i,
			errorHandling: /error.*handling|catch|fallback|retry/i,
		};
	}

	loadAvailableAgents() {
		try {
			const inventoryPath = path.join(
				process.cwd(),
				".claude/data/agents-inventory.json",
			);
			if (fs.existsSync(inventoryPath)) {
				const inventory = JSON.parse(fs.readFileSync(inventoryPath, "utf8"));
				const agents = [];
				for (const category of Object.values(inventory.categories || {})) {
					for (const agent of category.agents || []) {
						agents.push(agent.name || agent.id);
					}
				}
				return agents;
			}
		} catch (error) {
			console.warn("Warning: Could not load agent inventory:", error.message);
		}
		// Fallback to known critical agents
		return [
			"typescript-expert",
			"refactoring-expert",
			"testing-expert",
			"nodejs-expert",
			"react-expert",
			"database-expert",
			"code-search-expert",
			"cicd-investigator",
			"test-suite-architect",
		];
	}

	async evaluateAllCommands() {
		const results = [];
		const commandFiles = this.findCommandFiles(this.baseDir);

		for (const filePath of commandFiles) {
			// Skip backup files and templates
			if (filePath.includes(".backup") || filePath.includes("template"))
				continue;

			const evaluation = await this.evaluateCommand(filePath);
			results.push(evaluation);
		}

		return this.generateSummary(results);
	}

	findCommandFiles(dir, files = []) {
		const items = fs.readdirSync(dir);

		for (const item of items) {
			const fullPath = path.join(dir, item);
			const stat = fs.statSync(fullPath);

			if (stat.isDirectory()) {
				// Skip agents subdirectory as those aren't commands
				if (item === "agents") continue;
				this.findCommandFiles(fullPath, files);
			} else if (item.endsWith(".md")) {
				files.push(fullPath);
			}
		}

		return files;
	}

	async evaluateCommand(filePath) {
		const content = fs.readFileSync(filePath, "utf8");
		const { frontmatter, body } = this.parseFrontmatter(content);
		const relativePath = path.relative(this.baseDir, filePath);
		const commandName = this.extractCommandName(
			relativePath,
			frontmatter,
			body,
		);

		const scores = {
			frontmatter: this.evaluateFrontmatter(frontmatter, body),
			primeCompliance: this.evaluatePrimeCompliance(body, frontmatter),
			actionFirstDesign: this.evaluateActionFirstDesign(body),
			integration: this.evaluateIntegration(body, frontmatter, commandName),
			patterns: this.evaluatePatterns(body, frontmatter),
			documentation: this.evaluateDocumentation(body, frontmatter),
		};

		const totalScore = Object.values(scores).reduce(
			(sum, category) => sum + category.score,
			0,
		);

		return {
			name: commandName,
			path: filePath.replace(process.cwd(), "."),
			relativePath,
			frontmatter,
			scores,
			totalScore,
			grade: this.calculateGrade(totalScore),
			issues: this.consolidateIssues(scores),
			recommendations: this.generateRecommendations(scores, frontmatter, body),
		};
	}

	parseFrontmatter(content) {
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

	extractCommandName(relativePath, frontmatter, body) {
		// Try frontmatter first
		if (frontmatter.command) {
			return frontmatter.command;
		}
		if (frontmatter.name) {
			return frontmatter.name;
		}

		// Try to extract from body
		const commandMatch = body.match(/^#\s*(\/[\w:-]+)/m);
		if (commandMatch) {
			return commandMatch[1];
		}

		// Derive from file path
		return "/" + relativePath.replace(/\.md$/, "").replace(/\\/g, "/");
	}

	evaluateFrontmatter(frontmatter, body) {
		const issues = [];
		let score = 15;

		// Complete frontmatter fields (5 pts)
		if (!frontmatter.description && !frontmatter.name) {
			score -= 2;
			issues.push("Missing description in frontmatter");
		}

		if (!frontmatter["allowed-tools"] && body.includes("tool")) {
			score -= 2;
			issues.push("Tools used but not specified in frontmatter");
		}

		// Appropriate tool permissions (5 pts)
		const tools = frontmatter["allowed-tools"] || frontmatter.tools;
		if (tools) {
			const toolList = Array.isArray(tools) ? tools : [tools];

			// Check for overly broad permissions
			if (toolList.includes("*") || toolList.includes('"*"')) {
				score -= 3;
				issues.push("Uses wildcard (*) tools - should be specific");
			}

			// Check for appropriate MCP tools when needed
			const needsMcp = this.checkIfNeedsMcp(body);
			const hasMcp = toolList.some(
				(t) => typeof t === "string" && t.includes("mcp__"),
			);
			if (needsMcp && !hasMcp) {
				score -= 2;
				issues.push("Should include MCP tools for this domain");
			}
		}

		// Clear description & argument hints (5 pts)
		if (frontmatter["argument-hint"]) {
			// Good - has argument hints
		} else if (body.includes("arguments") || body.includes("$ARGUMENTS")) {
			score -= 2;
			issues.push("Uses arguments but missing argument-hint");
		}

		if (frontmatter.description) {
			const desc = frontmatter.description.toLowerCase();
			// Check for action-oriented description
			const hasActionVerb = this.actionVerbs.some((v) => desc.includes(v));
			if (!hasActionVerb) {
				score -= 1;
				issues.push("Description should be action-oriented");
			}
		}

		return { score: Math.max(0, score), issues };
	}

	evaluatePrimeCompliance(body, _frontmatter) {
		const issues = [];
		let score = 30;
		const bodyLower = body.toLowerCase();

		// Check for PRIME phase presence
		const phaseScores = {
			purpose: 6,
			role: 6,
			inputs: 6,
			method: 6,
			expectations: 6,
		};

		for (const [phase, phaseScore] of Object.entries(phaseScores)) {
			// Check multiple patterns for each phase
			const patterns = this.getPrimePhasePatterns(phase);
			const hasPhase = patterns.some((pattern) =>
				new RegExp(pattern, "i").test(body),
			);

			if (!hasPhase) {
				score -= phaseScore;
				issues.push(`Missing PRIME ${phase.toUpperCase()} phase`);
			} else {
				// Check phase quality
				const phaseQuality = this.evaluatePhaseQuality(phase, body);
				if (phaseQuality < 0.5) {
					score -= phaseScore * 0.5;
					issues.push(`Weak ${phase.toUpperCase()} phase implementation`);
				}
			}
		}

		// Check PRIME sequence order (bonus/penalty)
		const phaseOrder = this.checkPrimeSequence(body);
		if (!phaseOrder.correct && phaseOrder.found > 2) {
			issues.push("PRIME phases not in correct P→R→I→M→E sequence");
		}

		return { score: Math.max(0, score), issues };
	}

	getPrimePhasePatterns(phase) {
		const patterns = {
			purpose: [
				"purpose",
				"objective",
				"success criteria",
				"goal",
				"outcome",
				"what.*achiev",
			],
			role: [
				"role",
				"expertise",
				"you are",
				"specialist",
				"expert",
				"authority",
				"persona",
			],
			inputs: [
				"input",
				"gather",
				"collect",
				"context",
				"materials",
				"requirements",
				"load.*context",
			],
			method: [
				"method",
				"workflow",
				"process",
				"execute",
				"implementation",
				"steps",
				"procedure",
			],
			expectations: [
				"expectation",
				"output",
				"deliverable",
				"result",
				"validation",
				"success",
				"completion",
			],
		};
		return patterns[phase] || [];
	}

	evaluatePhaseQuality(phase, body) {
		// Simple quality check - presence of key indicators
		const qualityIndicators = {
			purpose: ["clear", "measurable", "specific"],
			role: ["expertise", "authority", "approach"],
			inputs: ["essential", "dynamic", "context"],
			method: ["step", "action", "execute"],
			expectations: ["validate", "deliver", "quality"],
		};

		const indicators = qualityIndicators[phase] || [];
		const foundCount = indicators.filter((ind) =>
			body.toLowerCase().includes(ind),
		).length;

		return indicators.length > 0 ? foundCount / indicators.length : 0.5;
	}

	checkPrimeSequence(body) {
		const positions = {};
		let found = 0;

		for (const phase of this.primePhases) {
			const patterns = this.getPrimePhasePatterns(phase);
			for (const pattern of patterns) {
				const match = body.match(new RegExp(`#+.*${pattern}`, "i"));
				if (match) {
					positions[phase] = body.indexOf(match[0]);
					found++;
					break;
				}
			}
		}

		// Check if phases appear in correct order
		const orderedPositions = this.primePhases
			.filter((p) => positions[p] !== undefined)
			.map((p) => positions[p]);

		const correct = orderedPositions.every(
			(pos, i) => i === 0 || pos >= orderedPositions[i - 1],
		);

		return { correct, found };
	}

	evaluateActionFirstDesign(body) {
		const issues = [];
		let score = 15;
		const bodyLower = body.toLowerCase();

		// Count action verbs vs advisory phrases
		const actionCount = this.actionVerbs.filter((v) =>
			bodyLower.includes(v),
		).length;

		const advisoryCount = this.advisoryPhrases.filter((p) =>
			bodyLower.includes(p),
		).length;

		// Action verb usage ratio (10 pts)
		const ratio =
			actionCount > 0
				? advisoryCount / actionCount
				: advisoryCount > 0
					? 10
					: 1;

		if (ratio > 2) {
			score -= 8;
			issues.push("Too many advisory phrases - needs action-first conversion");
		} else if (ratio > 1) {
			score -= 4;
			issues.push("More advisory phrases than action verbs");
		} else if (actionCount < 5) {
			score -= 3;
			issues.push("Insufficient action verbs throughout command");
		}

		// Check instructions start with action verbs (5 pts)
		const instructionPattern = /^[-*]\s*(\w+)/gm;
		const instructions = body.match(instructionPattern) || [];
		const actionStartCount = instructions.filter((inst) => {
			const firstWord = inst
				.replace(/^[-*]\s*/, "")
				.split(" ")[0]
				.toLowerCase();
			return this.actionVerbs.some((v) => firstWord.startsWith(v));
		}).length;

		if (instructions.length > 0) {
			const actionStartRatio = actionStartCount / instructions.length;
			if (actionStartRatio < 0.5) {
				score -= 5;
				issues.push("Most instructions don't start with action verbs");
			} else if (actionStartRatio < 0.8) {
				score -= 2;
				issues.push("Some instructions don't start with action verbs");
			}
		}

		return { score: Math.max(0, score), issues };
	}

	evaluateIntegration(body, frontmatter, commandName) {
		const issues = [];
		let score = 15;
		const bodyLower = body.toLowerCase();

		// Appropriate agent delegation (8 pts)
		const mentionsTask =
			bodyLower.includes("task tool") || bodyLower.includes("subagent_type");
		const shouldDelegate = this.checkIfShouldDelegate(commandName, body);

		if (shouldDelegate && !mentionsTask) {
			score -= 5;
			issues.push("Should delegate to specialized agents");

			// Suggest specific agents
			const suggestedAgents = this.suggestAgents(body);
			if (suggestedAgents.length > 0) {
				issues.push(
					`Consider using: ${suggestedAgents.slice(0, 3).join(", ")}`,
				);
			}
		} else if (mentionsTask) {
			// Check if using correct agent names
			const validAgents = this.availableAgents.filter((a) =>
				bodyLower.includes(a),
			);
			if (validAgents.length === 0) {
				score -= 3;
				issues.push("References agents but doesn't specify valid agent names");
			}
		}

		// MCP server utilization (7 pts)
		const needsMcp = this.checkIfNeedsMcp(body);
		if (needsMcp) {
			const mcpMentioned = this.mcpServers.some((s) => bodyLower.includes(s));
			if (!mcpMentioned) {
				score -= 5;
				issues.push("Should integrate MCP servers for this domain");

				// Suggest specific MCP servers
				const suggestedMcp = this.suggestMcpServers(body);
				if (suggestedMcp.length > 0) {
					issues.push(`Consider: ${suggestedMcp.join(", ")}`);
				}
			}

			// Check tool permissions
			const tools = frontmatter["allowed-tools"] || frontmatter.tools || [];
			const toolList = Array.isArray(tools) ? tools : [tools];
			const hasMcpTools = toolList.some(
				(t) => typeof t === "string" && t.includes("mcp__"),
			);
			if (!hasMcpTools && needsMcp) {
				score -= 2;
				issues.push("Missing MCP tool permissions in frontmatter");
			}
		}

		return { score: Math.max(0, score), issues };
	}

	checkIfShouldDelegate(_commandName, body) {
		const bodyLower = body.toLowerCase();

		// Keywords suggesting delegation opportunity
		const delegationKeywords = [
			"complex",
			"specialized",
			"expert",
			"analysis",
			"multiple",
			"parallel",
			"concurrent",
			"optimize",
			"refactor",
			"test",
			"validate",
			"search",
		];

		const keywordCount = delegationKeywords.filter((k) =>
			bodyLower.includes(k),
		).length;

		// Check complexity indicators
		const hasMultipleSteps =
			(body.match(/step \d+|phase \d+/gi) || []).length > 3;
		const hasComplexWorkflow =
			bodyLower.includes("workflow") && body.length > 3000;

		return keywordCount >= 2 || hasMultipleSteps || hasComplexWorkflow;
	}

	suggestAgents(body) {
		const bodyLower = body.toLowerCase();
		const suggestions = [];

		const agentMapping = {
			"typescript-expert": ["typescript", "types", "interface", "generic"],
			"refactoring-expert": ["refactor", "optimize", "clean", "improve"],
			"testing-expert": ["test", "spec", "coverage", "unit", "e2e"],
			"nodejs-expert": ["node", "npm", "package", "async", "stream"],
			"react-expert": ["react", "component", "hooks", "state"],
			"database-expert": ["database", "query", "sql", "postgres", "mongo"],
			"code-search-expert": ["search", "find", "locate", "grep"],
			"cicd-investigator": ["pipeline", "ci", "cd", "github actions"],
			"test-suite-architect": ["test suite", "coverage", "test plan"],
		};

		for (const [agent, keywords] of Object.entries(agentMapping)) {
			if (this.availableAgents.includes(agent)) {
				const matches = keywords.filter((k) => bodyLower.includes(k)).length;
				if (matches > 0) {
					suggestions.push(agent);
				}
			}
		}

		return suggestions;
	}

	checkIfNeedsMcp(body) {
		const bodyLower = body.toLowerCase();

		const mcpKeywords = {
			documentation: ["docs", "documentation", "api reference", "library"],
			search: ["search", "find", "discover", "research"],
			database: ["postgres", "sql", "database", "query"],
			monitoring: ["newrelic", "monitoring", "trace", "error"],
			reasoning: ["reason", "think", "analyze", "complex"],
		};

		for (const keywords of Object.values(mcpKeywords)) {
			const matches = keywords.filter((k) => bodyLower.includes(k)).length;
			if (matches >= 2) return true;
		}

		return false;
	}

	suggestMcpServers(body) {
		const bodyLower = body.toLowerCase();
		const suggestions = [];

		const mcpMapping = {
			context7: ["documentation", "library", "api", "docs"],
			exa: ["search", "web", "research", "find"],
			perplexity: ["ask", "question", "research", "explain"],
			postgres: ["postgres", "sql", "database", "query"],
			newrelic: ["monitoring", "trace", "error", "performance"],
			"code-reasoning": ["reason", "think", "analyze", "complex"],
			"docs-mcp": ["documentation", "docs", "manual", "reference"],
		};

		for (const [server, keywords] of Object.entries(mcpMapping)) {
			const matches = keywords.filter((k) => bodyLower.includes(k)).length;
			if (matches > 0) {
				suggestions.push(server);
			}
		}

		return suggestions;
	}

	evaluatePatterns(body, _frontmatter) {
		const issues = [];
		let score = 15;
		const maxPointsPerPattern = 5;
		const patterns = [
			{
				name: "Dynamic context loading",
				pattern: this.commandPatterns.dynamicContext,
			},
			{ name: "Error handling", pattern: this.commandPatterns.errorHandling },
			{ name: "Validation checks", pattern: this.commandPatterns.validation },
		];

		for (const { name, pattern } of patterns) {
			if (!pattern.test(body)) {
				score -= maxPointsPerPattern;
				issues.push(`Missing ${name} pattern`);
			} else {
				// Check quality of implementation
				const quality = this.evaluatePatternQuality(name, body);
				if (quality < 0.5) {
					score -= maxPointsPerPattern * 0.5;
					issues.push(`Weak ${name} implementation`);
				}
			}
		}

		// Check for optional beneficial patterns
		const optionalPatterns = [
			{
				name: "user clarification",
				pattern: this.commandPatterns.userClarification,
			},
			{
				name: "parallel execution",
				pattern: this.commandPatterns.parallelExecution,
			},
			{
				name: "progress tracking",
				pattern: this.commandPatterns.progressTracking,
			},
		];

		const hasOptional = optionalPatterns.filter((p) =>
			p.pattern.test(body),
		).length;

		// Bonus for optional patterns (not counted in base score)
		if (hasOptional === 0 && body.length > 2000) {
			issues.push("Consider adding optional patterns for complex commands");
		}

		return { score: Math.max(0, score), issues };
	}

	evaluatePatternQuality(patternName, body) {
		const qualityIndicators = {
			"Dynamic context loading": [
				"context-loader.cjs",
				"command-analyzer.cjs",
				"token-budget",
				"query",
			],
			"Error handling": [
				"try",
				"catch",
				"fallback",
				"retry",
				"error",
				"fail",
				"recover",
			],
			"Validation checks": [
				"validate",
				"verify",
				"check",
				"assert",
				"ensure",
				"confirm",
				"test",
			],
		};

		const indicators = qualityIndicators[patternName] || [];
		const foundCount = indicators.filter((ind) =>
			body.toLowerCase().includes(ind),
		).length;

		return indicators.length > 0 ? foundCount / indicators.length : 0.5;
	}

	evaluateDocumentation(body, _frontmatter) {
		const issues = [];
		let score = 10;
		const bodyLower = body.toLowerCase();

		// Examples provided (3 pts)
		if (!bodyLower.includes("example") && !bodyLower.includes("```")) {
			score -= 3;
			issues.push("Missing examples");
		} else {
			// Check quality of examples
			const codeBlocks = (body.match(/```[\s\S]*?```/g) || []).length;
			if (codeBlocks === 0) {
				score -= 1;
				issues.push("Examples should include code blocks");
			}
		}

		// Clear usage instructions (3 pts)
		if (!bodyLower.includes("usage") && !bodyLower.includes("how to")) {
			score -= 3;
			issues.push("Missing usage instructions");
		} else {
			// Check if usage shows actual command syntax
			const hasCommandSyntax = /\/\w+[:\w]*/.test(body);
			if (!hasCommandSyntax) {
				score -= 1;
				issues.push("Usage should show command syntax");
			}
		}

		// Success criteria defined (4 pts)
		const hasSuccessCriteria =
			bodyLower.includes("success") ||
			bodyLower.includes("completion") ||
			bodyLower.includes("expected") ||
			bodyLower.includes("output");

		if (!hasSuccessCriteria) {
			score -= 4;
			issues.push("Missing success/completion criteria");
		} else {
			// Check if criteria are measurable
			const hasMeasurable =
				bodyLower.includes("validate") ||
				bodyLower.includes("verify") ||
				bodyLower.includes("ensure") ||
				bodyLower.includes("must");

			if (!hasMeasurable) {
				score -= 2;
				issues.push("Success criteria should be measurable");
			}
		}

		return { score: Math.max(0, score), issues };
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
			allIssues.push(...(category.issues || []));
		}
		return allIssues;
	}

	generateRecommendations(scores, frontmatter, body) {
		const recommendations = [];
		const bodyLower = body.toLowerCase();

		// Frontmatter recommendations
		if (scores.frontmatter.score < 10) {
			if (!frontmatter["allowed-tools"]) {
				recommendations.push("Add allowed-tools to frontmatter");
			}
			if (!frontmatter["argument-hint"] && body.includes("$ARGUMENTS")) {
				recommendations.push("Add argument-hint to frontmatter");
			}
		}

		// PRIME recommendations
		if (scores.primeCompliance.score < 20) {
			recommendations.push(
				"Restructure command following PRIME sequence: Purpose → Role → Inputs → Method → Expectations",
			);
			if (!bodyLower.includes("purpose")) {
				recommendations.push(
					"Add PURPOSE phase with clear objectives and success criteria",
				);
			}
			if (!bodyLower.includes("role")) {
				recommendations.push("Add ROLE phase defining expertise and authority");
			}
		}

		// Action-first recommendations
		if (scores.actionFirstDesign.score < 10) {
			recommendations.push("Convert advisory language to action verbs");
			recommendations.push(
				"Start all instructions with action verbs from the reference bank",
			);
		}

		// Integration recommendations
		if (scores.integration.score < 10) {
			const suggestedAgents = this.suggestAgents(body);
			if (suggestedAgents.length > 0) {
				recommendations.push(
					`Consider delegating to: ${suggestedAgents.slice(0, 3).join(", ")}`,
				);
			}

			const suggestedMcp = this.suggestMcpServers(body);
			if (suggestedMcp.length > 0) {
				recommendations.push(
					`Consider MCP servers: ${suggestedMcp.slice(0, 2).join(", ")}`,
				);
			}
		}

		// Pattern recommendations
		if (scores.patterns.score < 10) {
			if (!this.commandPatterns.dynamicContext.test(body)) {
				recommendations.push(
					"Implement dynamic context loading pattern for adaptability",
				);
			}
			if (!this.commandPatterns.errorHandling.test(body)) {
				recommendations.push("Add comprehensive error handling for each phase");
			}
			if (!this.commandPatterns.validation.test(body)) {
				recommendations.push("Add validation checks in expectations phase");
			}
		}

		// Documentation recommendations
		if (scores.documentation.score < 7) {
			if (!bodyLower.includes("example")) {
				recommendations.push("Add concrete examples with code blocks");
			}
			if (!bodyLower.includes("usage")) {
				recommendations.push(
					"Add clear usage instructions with command syntax",
				);
			}
		}

		// Limit recommendations to most important
		return recommendations.slice(0, 5);
	}

	generateSummary(results) {
		const totalCommands = results.length;
		const totalScore = results.reduce((sum, r) => sum + r.totalScore, 0);
		const averageScore = totalCommands > 0 ? totalScore / totalCommands : 0;

		// Grade distribution
		const gradeDistribution = {};
		for (const grade of ["A", "B", "C", "D", "F"]) {
			gradeDistribution[grade] = results.filter(
				(r) => r.grade === grade,
			).length;
		}

		// Category analysis
		const categoryAnalysis = {};
		const categoryNames = {
			frontmatter: "Frontmatter & Metadata",
			primeCompliance: "PRIME Framework Compliance",
			actionFirstDesign: "Action-First Design",
			integration: "Agent & MCP Integration",
			patterns: "Pattern Implementation",
			documentation: "Documentation Quality",
		};

		for (const categoryKey of Object.keys(categoryNames)) {
			const scores = results.map((r) => r.scores[categoryKey].score);
			const maxPossible =
				results[0]?.scores[categoryKey]?.score !== undefined
					? this.getCategoryMaxScore(categoryKey)
					: 0;

			categoryAnalysis[categoryKey] = {
				name: categoryNames[categoryKey],
				average:
					scores.length > 0
						? scores.reduce((sum, s) => sum + s, 0) / scores.length
						: 0,
				maxPossible,
				percentageOfMax:
					maxPossible > 0
						? Math.round(
								(scores.reduce((sum, s) => sum + s, 0) /
									scores.length /
									maxPossible) *
									100,
							)
						: 0,
			};
		}

		// Sort by total score
		results.sort((a, b) => b.totalScore - a.totalScore);

		// Bottom quartile and top performers
		const bottomQuartileCount = Math.ceil(totalCommands * 0.25);
		const topPerformerThreshold = 85;

		const bottomQuartile = results.slice(-bottomQuartileCount);
		const topPerformers = results.filter(
			(r) => r.totalScore >= topPerformerThreshold,
		);

		// Most common issues
		const issueFrequency = {};
		for (const result of results) {
			for (const issue of result.issues) {
				issueFrequency[issue] = (issueFrequency[issue] || 0) + 1;
			}
		}

		const commonIssues = Object.entries(issueFrequency)
			.sort((a, b) => b[1] - a[1])
			.slice(0, 10)
			.map(([issue, count]) => ({
				issue,
				count,
				percentage: Math.round((count / totalCommands) * 100),
			}));

		return {
			results,
			summary: {
				totalCommands,
				averageScore,
				gradeDistribution,
				categoryAnalysis,
				bottomQuartile,
				topPerformers,
				commonIssues,
			},
		};
	}

	getCategoryMaxScore(category) {
		const maxScores = {
			frontmatter: 15,
			primeCompliance: 30,
			actionFirstDesign: 15,
			integration: 15,
			patterns: 15,
			documentation: 10,
		};
		return maxScores[category] || 0;
	}

	async evaluateSingleCommand(commandPath) {
		const fullPath = path.isAbsolute(commandPath)
			? commandPath
			: path.join(this.baseDir, commandPath);

		if (!fs.existsSync(fullPath)) {
			throw new Error(`Command file not found: ${fullPath}`);
		}

		return this.evaluateCommand(fullPath);
	}
}

// Export for use as module
module.exports = CommandQualityEvaluator;

// Run if called directly
if (require.main === module) {
	const evaluator = new CommandQualityEvaluator();

	// Check for single command evaluation
	const args = process.argv.slice(2);
	if (args.length > 0) {
		evaluator
			.evaluateSingleCommand(args[0])
			.then((result) => {
				console.log(JSON.stringify(result, null, 2));
			})
			.catch((error) => {
				console.error("Error:", error.message);
				process.exit(1);
			});
	} else {
		evaluator
			.evaluateAllCommands()
			.then(({ summary }) => {
				console.log(JSON.stringify(summary, null, 2));
			})
			.catch((error) => {
				console.error("Error:", error.message);
				process.exit(1);
			});
	}
}
