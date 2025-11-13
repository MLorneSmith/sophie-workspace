#!/usr/bin/env node

/**
 * Command Analyzer using AST-grep
 *
 * Extracts rich metadata from Claude Code command files to provide
 * enhanced context signals for the context loading system.
 *
 * Features:
 * - Tool usage pattern extraction (Task, Read, Write, etc.)
 * - Agent dependency detection (subagent_type references)
 * - Workflow phase identification (initialization, validation, etc.)
 * - Import statement and library analysis
 * - Command structure analysis
 *
 * @author Claude Implementation Assistant
 * @version 1.0.0
 */

const fs = require("node:fs").promises;
const path = require("node:path");
const { parse } = require("@ast-grep/napi");

class CommandAnalyzer {
	constructor() {
		this.cache = new Map();
	}

	/**
	 * Analyze a command file and extract rich metadata
	 * @param {string} filePath - Path to the command file
	 * @returns {Promise<Object>} Extracted metadata
	 */
	async analyzeCommand(filePath) {
		// Check cache
		if (this.cache.has(filePath)) {
			return this.cache.get(filePath);
		}

		try {
			const content = await fs.readFile(filePath, "utf8");

			// Extract frontmatter metadata
			const frontmatter = this.extractFrontmatter(content);

			// Extract command structure
			const structure = this.extractStructure(content);

			// Extract tool usage patterns
			const tools = this.extractToolPatterns(content);

			// Extract agent dependencies
			const agents = this.extractAgentPatterns(content);

			// Extract workflow phases
			const phases = this.extractWorkflowPhases(content);

			// Extract code patterns and libraries
			const codePatterns = this.extractCodePatterns(content);

			// Extract context requirements
			const contextPatterns = this.extractContextPatterns(content);

			// Build comprehensive metadata
			const metadata = {
				filePath,
				frontmatter,
				structure,
				tools,
				agents,
				phases,
				codePatterns,
				contextPatterns,
				searchableContent: this.buildSearchableContent({
					frontmatter,
					structure,
					tools,
					agents,
					phases,
					codePatterns,
				}),
			};

			// Cache the result
			this.cache.set(filePath, metadata);

			return metadata;
		} catch (error) {
			console.error(`Error analyzing command file: ${error.message}`);
			throw error;
		}
	}

	/**
	 * Extract frontmatter metadata
	 */
	extractFrontmatter(content) {
		const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
		if (!frontmatterMatch) return {};

		const frontmatter = {};
		const lines = frontmatterMatch[1].split("\n");

		for (const line of lines) {
			const [key, ...valueParts] = line.split(":");
			if (key && valueParts.length) {
				const value = valueParts.join(":").trim();
				frontmatter[key.trim()] = value.replace(/[[\]"']/g, "").trim();
			}
		}

		return frontmatter;
	}

	/**
	 * Extract command structure (sections, subsections)
	 */
	extractStructure(content) {
		const structure = {
			sections: [],
			hasEssentialContext: false,
			hasPrompt: false,
			hasInstructions: false,
			hasHelp: false,
			hasPatterns: false,
			hasErrorHandling: false,
		};

		// Extract major sections
		const sectionRegex = /^##+ (.+)$/gm;
		let match;
		while ((match = sectionRegex.exec(content)) !== null) {
			structure.sections.push({
				level: match[0].match(/^#+/)[0].length,
				title: match[1].trim(),
			});
		}

		// Check for specific sections
		structure.hasEssentialContext = content.includes("## Essential Context");
		structure.hasPrompt = content.includes("## Prompt");
		structure.hasInstructions = content.includes("<instructions>");
		structure.hasHelp = content.includes("<help>");
		structure.hasPatterns = content.includes("<patterns>");
		structure.hasErrorHandling = content.includes("<error_handling>");

		return structure;
	}

	/**
	 * Extract tool usage patterns
	 */
	extractToolPatterns(content) {
		const tools = {
			task: [],
			read: [],
			write: [],
			bash: [],
			other: [],
		};

		// Extract Task tool usage
		const taskRegex = /Task:\s*([a-z-]+(?:-[a-z]+)*)/gi;
		let match;
		while ((match = taskRegex.exec(content)) !== null) {
			const agentName = match[1];
			if (!tools.task.includes(agentName)) {
				tools.task.push(agentName);
			}
		}

		// Extract delegated agents from code blocks
		const delegateRegex = /subagent_type['":\s]+([a-z-]+(?:-[a-z]+)*)/gi;
		while ((match = delegateRegex.exec(content)) !== null) {
			const agentName = match[1];
			if (!tools.task.includes(agentName)) {
				tools.task.push(agentName);
			}
		}

		// Extract Read tool patterns
		const readRegex =
			/(?:Read|read)\s+([./][\w/.-]+\.(?:md|json|ts|tsx|js|jsx))/gi;
		while ((match = readRegex.exec(content)) !== null) {
			tools.read.push(match[1]);
		}

		// Extract Write tool patterns
		const writeRegex = /(?:Write|writeFile)\s*\(\s*['"`]([^'"`]+)['"`]/gi;
		while ((match = writeRegex.exec(content)) !== null) {
			tools.write.push(match[1]);
		}

		// Extract Bash commands
		const bashRegex = /(?:bash|Bash|sh)\s+-c\s+['"](.*?)['"]/gi;
		while ((match = bashRegex.exec(content)) !== null) {
			const command = match[1].split(" ")[0]; // Get command name
			if (command && !tools.bash.includes(command)) {
				tools.bash.push(command);
			}
		}

		// Count tool references
		tools.counts = {
			task: tools.task.length,
			read: tools.read.length,
			write: tools.write.length,
			bash: tools.bash.length,
		};

		return tools;
	}

	/**
	 * Extract agent patterns and dependencies
	 */
	extractAgentPatterns(content) {
		const agents = {
			specialists: [],
			patterns: [],
			delegationMatrix: {},
		};

		// Extract specialist agents mentioned
		const specialistRegex =
			/([a-z]+-(?:expert|specialist|engineer|architect|writer|reviewer|investigator|orchestrator|loader|optimizer))/gi;
		let match;
		while ((match = specialistRegex.exec(content)) !== null) {
			const agent = match[1].toLowerCase();
			if (!agents.specialists.includes(agent)) {
				agents.specialists.push(agent);
			}
		}

		// Extract delegation patterns
		const delegationRegex = /const agentSelection = \{([^}]+)\}/s;
		const delegationMatch = content.match(delegationRegex);
		if (delegationMatch) {
			// Parse the delegation matrix
			const matrixContent = delegationMatch[1];
			const entries = matrixContent.match(/(\w+):\s*\[([^\]]+)\]/g);
			if (entries) {
				for (const entry of entries) {
					const [key, value] = entry.split(":");
					const agentList = value.match(/['"]([^'"]+)['"]/g);
					if (agentList) {
						agents.delegationMatrix[key.trim()] = agentList.map((a) =>
							a.replace(/['"]/g, ""),
						);
					}
				}
			}
		}

		return agents;
	}

	/**
	 * Extract workflow phases
	 */
	extractWorkflowPhases(content) {
		const phases = {
			discovery: false,
			initialization: false,
			analysis: false,
			implementation: false,
			validation: false,
			delivery: false,
			custom: [],
		};

		// Check for standard phases
		phases.discovery = /<discovery>|## \d+\.\s*Discovery/i.test(content);
		phases.initialization = /<initialization>|## \d+\.\s*Initialization/i.test(
			content,
		);
		phases.analysis = /<(?:task_)?analysis>|## \d+\.\s*Analysis/i.test(content);
		phases.implementation = /<implementation>|## \d+\.\s*Implementation/i.test(
			content,
		);
		phases.validation = /<validation>|## \d+\.\s*Validation/i.test(content);
		phases.delivery =
			/<(?:output_)?delivery>|## \d+\.\s*(?:Output|Delivery)/i.test(content);

		// Extract custom phases
		const customPhaseRegex = /<(\w+(?:_\w+)*)>/g;
		let match;
		while ((match = customPhaseRegex.exec(content)) !== null) {
			const phase = match[1];
			const standardPhases = [
				"discovery",
				"initialization",
				"analysis",
				"implementation",
				"validation",
				"delivery",
			];
			if (!standardPhases.includes(phase) && !phases.custom.includes(phase)) {
				phases.custom.push(phase);
			}
		}

		// Count active phases
		phases.activeCount = Object.values(phases).filter((v) => v === true).length;

		return phases;
	}

	/**
	 * Extract code patterns and library references
	 */
	extractCodePatterns(content) {
		const patterns = {
			libraries: [],
			frameworks: [],
			apis: [],
			fileTypes: [],
			technologies: [],
		};

		// Extract import/require statements
		const importRegex = /(?:import|require)\s*\(?['"`]([^'"`]+)['"`]\)?/gi;
		let match;
		while ((match = importRegex.exec(content)) !== null) {
			const lib = match[1];
			if (!lib.startsWith(".") && !lib.startsWith("/")) {
				patterns.libraries.push(lib);
			}
		}

		// Detect frameworks
		const frameworkPatterns = {
			"next.js": /next\.js|nextjs|Next\.js/i,
			react: /React|useState|useEffect|jsx|tsx/,
			supabase: /supabase|createClient|auth\.uid/i,
			typescript: /TypeScript|\.tsx?|interface\s+\w+|type\s+\w+/,
			vitest: /vitest|describe\(|it\(|expect\(/,
			playwright: /playwright|page\.|browser\.|test\(/,
		};

		for (const [framework, pattern] of Object.entries(frameworkPatterns)) {
			if (pattern.test(content)) {
				patterns.frameworks.push(framework);
			}
		}

		// Extract file types mentioned
		const fileTypeRegex =
			/\.(ts|tsx|js|jsx|json|md|css|scss|sql|yaml|yml|env)/gi;
		while ((match = fileTypeRegex.exec(content)) !== null) {
			const ext = match[1].toLowerCase();
			if (!patterns.fileTypes.includes(ext)) {
				patterns.fileTypes.push(ext);
			}
		}

		// Detect technologies
		const techPatterns = {
			database: /database|postgres|sql|migration|schema|table/i,
			api: /api|endpoint|route|request|response|REST|GraphQL/i,
			auth: /auth|authentication|authorization|session|jwt|oauth/i,
			testing: /test|spec|mock|stub|coverage|assertion/i,
			"ci-cd": /github\s+actions|ci\/cd|pipeline|deployment|workflow/i,
			docker: /docker|container|dockerfile|compose/i,
		};

		for (const [tech, pattern] of Object.entries(techPatterns)) {
			if (pattern.test(content)) {
				patterns.technologies.push(tech);
			}
		}

		return patterns;
	}

	/**
	 * Extract context loading patterns
	 */
	extractContextPatterns(content) {
		const context = {
			essentialFiles: [],
			dynamicQueries: [],
			contextLoader: false,
			tokenBudget: null,
			maxResults: null,
		};

		// Extract essential context files
		const essentialRegex = /Read\s+([./][\w/.-]+\.md)/g;
		const essentialSection = content.match(
			/## Essential Context[\s\S]*?(?=##|$)/,
		);
		if (essentialSection) {
			let match;
			while ((match = essentialRegex.exec(essentialSection[0])) !== null) {
				context.essentialFiles.push(match[1]);
			}
		}

		// Check for context-loader.cjs usage
		context.contextLoader = content.includes("context-loader.cjs");

		// Extract dynamic query patterns
		const queryRegex = /--query=["']([^"']+)["']/g;
		let match;
		while ((match = queryRegex.exec(content)) !== null) {
			context.dynamicQueries.push(match[1]);
		}

		// Extract token budget
		const tokenMatch = content.match(/--token-budget=(\d+)/);
		if (tokenMatch) {
			context.tokenBudget = parseInt(tokenMatch[1]);
		}

		// Extract max results
		const maxMatch = content.match(/--max-results=(\d+)/);
		if (maxMatch) {
			context.maxResults = parseInt(maxMatch[1]);
		}

		return context;
	}

	/**
	 * Build searchable content for improved matching
	 */
	buildSearchableContent(metadata) {
		const parts = [];

		// Add frontmatter description
		if (metadata.frontmatter.description) {
			parts.push(metadata.frontmatter.description);
		}

		// Add allowed tools
		if (metadata.frontmatter["allowed-tools"]) {
			parts.push(`tools: ${metadata.frontmatter["allowed-tools"]}`);
		}

		// Add section titles
		if (metadata.structure.sections) {
			parts.push(...metadata.structure.sections.map((s) => s.title));
		}

		// Add tool usage
		if (metadata.tools.task.length) {
			parts.push(`agents: ${metadata.tools.task.join(" ")}`);
		}

		// Add agent specialists
		if (metadata.agents.specialists.length) {
			parts.push(`specialists: ${metadata.agents.specialists.join(" ")}`);
		}

		// Add active workflow phases
		const activePhases = [];
		for (const [phase, active] of Object.entries(metadata.phases)) {
			if (active === true) {
				activePhases.push(phase);
			}
		}
		if (activePhases.length) {
			parts.push(`phases: ${activePhases.join(" ")}`);
		}

		// Add technologies
		if (metadata.codePatterns.technologies.length) {
			parts.push(`tech: ${metadata.codePatterns.technologies.join(" ")}`);
		}

		return parts.join(" ").toLowerCase();
	}
}

/**
 * CLI Interface
 */
async function main() {
	const args = process.argv.slice(2);

	if (args.length === 0 || args.includes("--help")) {
		console.log("Command Analyzer - Extract rich metadata from command files");
		console.log("");
		console.log("Usage: node command-analyzer.cjs <command-file> [options]");
		console.log("");
		console.log("Options:");
		console.log("  --json          Output as JSON");
		console.log("  --summary       Output summary only");
		console.log("  --searchable    Output searchable content");
		console.log("  --help          Show this help");
		console.log("");
		console.log("Examples:");
		console.log("  node command-analyzer.cjs .claude/commands/debug-issue.md");
		console.log("  node command-analyzer.cjs enhance.md --json");
		process.exit(0);
	}

	const filePath = args[0];
	const outputJson = args.includes("--json");
	const outputSummary = args.includes("--summary");
	const outputSearchable = args.includes("--searchable");

	try {
		const analyzer = new CommandAnalyzer();
		const metadata = await analyzer.analyzeCommand(filePath);

		if (outputJson) {
			console.log(JSON.stringify(metadata, null, 2));
		} else if (outputSearchable) {
			console.log(metadata.searchableContent);
		} else if (outputSummary) {
			console.log("Command Analysis Summary");
			console.log("========================");
			console.log(`File: ${path.basename(filePath)}`);
			console.log(`Description: ${metadata.frontmatter.description || "N/A"}`);
			console.log(`Tools: ${metadata.frontmatter["allowed-tools"] || "N/A"}`);
			console.log(`Sections: ${metadata.structure.sections.length}`);
			console.log(
				`Delegated Agents: ${metadata.tools.task.join(", ") || "None"}`,
			);
			console.log(`Specialists: ${metadata.agents.specialists.length}`);
			console.log(`Active Phases: ${metadata.phases.activeCount}`);
			console.log(
				`Technologies: ${metadata.codePatterns.technologies.join(", ") || "None"}`,
			);
			console.log(
				`Essential Context: ${metadata.contextPatterns.essentialFiles.length} files`,
			);
			console.log(
				`Uses Dynamic Context: ${metadata.contextPatterns.contextLoader ? "Yes" : "No"}`,
			);
		} else {
			// Default detailed output
			console.log("Command Analysis Results");
			console.log("========================");
			console.log("");
			console.log("## Frontmatter");
			console.log(JSON.stringify(metadata.frontmatter, null, 2));
			console.log("");
			console.log("## Structure");
			console.log(
				`Sections: ${metadata.structure.sections.map((s) => s.title).join(", ")}`,
			);
			console.log(
				`Has Essential Context: ${metadata.structure.hasEssentialContext}`,
			);
			console.log(`Has Instructions: ${metadata.structure.hasInstructions}`);
			console.log("");
			console.log("## Tool Usage");
			console.log(`Task Agents: ${metadata.tools.task.join(", ") || "None"}`);
			console.log(`Read Files: ${metadata.tools.read.length}`);
			console.log(`Write Operations: ${metadata.tools.write.length}`);
			console.log(`Bash Commands: ${metadata.tools.bash.join(", ") || "None"}`);
			console.log("");
			console.log("## Agent Patterns");
			console.log(
				`Specialists: ${metadata.agents.specialists.join(", ") || "None"}`,
			);
			if (Object.keys(metadata.agents.delegationMatrix).length) {
				console.log("Delegation Matrix:");
				for (const [key, agents] of Object.entries(
					metadata.agents.delegationMatrix,
				)) {
					console.log(`  ${key}: ${agents.join(", ")}`);
				}
			}
			console.log("");
			console.log("## Workflow Phases");
			const activePhases = Object.entries(metadata.phases)
				.filter(([k, v]) => v === true && k !== "activeCount")
				.map(([k]) => k);
			console.log(`Active: ${activePhases.join(", ") || "None"}`);
			if (metadata.phases.custom.length) {
				console.log(`Custom: ${metadata.phases.custom.join(", ")}`);
			}
			console.log("");
			console.log("## Code Patterns");
			console.log(
				`Frameworks: ${metadata.codePatterns.frameworks.join(", ") || "None"}`,
			);
			console.log(
				`Technologies: ${metadata.codePatterns.technologies.join(", ") || "None"}`,
			);
			console.log(
				`File Types: ${metadata.codePatterns.fileTypes.join(", ") || "None"}`,
			);
			console.log("");
			console.log("## Context Patterns");
			console.log(
				`Essential Files: ${metadata.contextPatterns.essentialFiles.join(", ") || "None"}`,
			);
			console.log(
				`Uses Context Loader: ${metadata.contextPatterns.contextLoader}`,
			);
			if (metadata.contextPatterns.tokenBudget) {
				console.log(`Token Budget: ${metadata.contextPatterns.tokenBudget}`);
			}
		}
	} catch (error) {
		console.error(`Error: ${error.message}`);
		process.exit(1);
	}
}

// Export for use as module
module.exports = CommandAnalyzer;

// Run if called directly
if (require.main === module) {
	main();
}
