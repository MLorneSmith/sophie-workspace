#!/usr/bin/env node

const fs = require("node:fs").promises;
const path = require("node:path");
const { exec } = require("node:child_process");
const { promisify } = require("node:util");
const execAsync = promisify(exec);

// Configuration
const AGENTS_DIR = path.join(__dirname, "..", "..", "agents");
const OUTPUT_FILE = path.join(
	__dirname,
	"..",
	"..",
	"data",
	"agents-inventory.json",
);
const CCPM_AGENTS_DIR = "/home/msmith/projects/ccpm/.claude/agents";
const CLAUDEKIT_DIR = "/home/msmith/projects/claudekit/src/agents";
const CLAUDEKIT_REPO = "https://github.com/carlrannaberg/claudekit";

// Known agents from various sources - will be dynamically detected
const KNOWN_SOURCES = {
	ccpm: ["code-analyzer", "parallel-worker", "file-analyzer", "test-runner"],
	claudekit: [], // Will be populated dynamically
	anthropic: ["test-suite-architect"], // Only truly anthropic agents
};

async function parseYamlFrontmatter(content) {
	const match = content.match(/^---\n([\s\S]*?)\n---/);
	if (!match) return {};

	const yamlContent = match[1];
	const metadata = {};

	// Simple YAML parser for our needs
	const lines = yamlContent.split("\n");
	for (const line of lines) {
		if (line.includes(":")) {
			const [key, ...valueParts] = line.split(":");
			let value = valueParts.join(":").trim();

			// Handle multi-line descriptions
			if (value.startsWith(">-") || value.startsWith("|")) {
				value = "";
				const indent = line.indexOf(key[0]);
				const nextLineIndex = lines.indexOf(line) + 1;
				for (let i = nextLineIndex; i < lines.length; i++) {
					const nextLine = lines[i];
					if (nextLine.trim() && !nextLine.startsWith(" ".repeat(indent + 2))) {
						break;
					}
					value += nextLine.trim() + " ";
				}
			}

			// Handle arrays
			if (value.startsWith("[") && value.endsWith("]")) {
				value = value
					.slice(1, -1)
					.split(",")
					.map((v) => v.trim());
			}

			metadata[key.trim()] = value;
		}
	}

	return metadata;
}

async function analyzeAgentContent(content) {
	const lines = content.split("\n");
	const fileSize = Buffer.byteLength(content, "utf8");
	const lineCount = lines.length;

	// Check for quality indicators
	const hasExamples =
		content.includes("## Example") || content.includes("<example>");
	const hasTests = content.includes("test") || content.includes("Test");
	const hasStepByStep =
		content.includes("## Step") || content.includes("Step 1:");
	const hasTools = content.includes("tools:") || content.includes("Tools:");
	const hasRouting =
		content.includes("routing") || content.includes("recommend switching");

	// Calculate quality score
	let qualityScore = 0;
	if (hasExamples) qualityScore += 2;
	if (hasTests) qualityScore += 1;
	if (hasStepByStep) qualityScore += 2;
	if (hasTools) qualityScore += 1;
	if (hasRouting) qualityScore += 1;
	if (lineCount > 100) qualityScore += 1;
	if (lineCount > 300) qualityScore += 1;

	let quality = "untested";
	if (qualityScore >= 7) quality = "excellent";
	else if (qualityScore >= 5) quality = "good";
	else if (qualityScore >= 3) quality = "needs-improvement";

	return {
		fileSize,
		lineCount,
		hasExamples,
		hasTests,
		hasStepByStep,
		hasTools,
		hasRouting,
		quality,
		qualityScore,
	};
}

async function findClaudekitAgent(fileName, filePath) {
	// Try to find the agent in claudekit directory structure
	const possiblePaths = [
		path.join(CLAUDEKIT_DIR, fileName),
		path.join(CLAUDEKIT_DIR, path.basename(path.dirname(filePath)), fileName),
	];

	// Also check all subdirectories
	try {
		const { stdout } = await execAsync(
			`find "${CLAUDEKIT_DIR}" -name "${fileName}" -type f 2>/dev/null`,
		);
		if (stdout.trim()) {
			return stdout.trim().split("\n")[0]; // Return first match
		}
	} catch {}

	// Check explicit paths
	for (const checkPath of possiblePaths) {
		try {
			await fs.access(checkPath);
			return checkPath;
		} catch {}
	}

	return null;
}

async function checkIfExactMatch(file1, file2) {
	try {
		const content1 = await fs.readFile(file1, "utf-8");
		const content2 = await fs.readFile(file2, "utf-8");
		return content1 === content2;
	} catch {
		return false;
	}
}

async function determineSource(agentName, filePath) {
	const fileName = path.basename(filePath);

	// Check known sources
	for (const [source, agents] of Object.entries(KNOWN_SOURCES)) {
		if (agents.includes(agentName)) {
			return { source, status: "original" };
		}
	}

	// Check if exists in claudekit
	const claudekitPath = await findClaudekitAgent(fileName, filePath);
	if (claudekitPath) {
		const isExact = await checkIfExactMatch(filePath, claudekitPath);
		return { source: "claudekit", status: isExact ? "exact" : "modified" };
	}

	// Check if exists in ccpm
	try {
		await fs.access(path.join(CCPM_AGENTS_DIR, `${agentName}.md`));
		return { source: "ccpm", status: "original" };
	} catch {}

	// Default to custom
	return { source: "custom", status: "original" };
}

async function findOverlappingAgents(agents) {
	const overlaps = {};

	// Group by category
	const categories = {};
	for (const agent of agents) {
		const cat = agent.category || "uncategorized";
		if (!categories[cat]) categories[cat] = [];
		categories[cat].push(agent);
	}

	// Find overlaps within categories
	for (const [category, catAgents] of Object.entries(categories)) {
		for (const agent of catAgents) {
			const similar = catAgents.filter(
				(a) =>
					a.id !== agent.id &&
					(a.name.includes(agent.name.split("-")[0]) ||
						agent.name.includes(a.name.split("-")[0])),
			);
			if (similar.length > 0) {
				overlaps[agent.id] = similar.map((a) => a.id);
			}
		}
	}

	return overlaps;
}

async function processAgent(filePath, category) {
	const content = await fs.readFile(filePath, "utf-8");
	const metadata = await parseYamlFrontmatter(content);
	const analysis = await analyzeAgentContent(content);
	const fileName = path.basename(filePath, ".md");
	const sourceInfo = await determineSource(fileName, filePath);

	// Determine status based on various factors
	let status = "active";
	if (fileName === "oracle" || fileName === "clarification-loop-engine") {
		status = "needs-review";
	}
	if (analysis.quality === "untested") {
		status = "needs-review";
	}

	return {
		id: fileName,
		name: metadata.name || fileName,
		displayName: metadata.displayName || metadata.name || fileName,
		path: path.relative(AGENTS_DIR, filePath),
		description: metadata.description || "",
		category: category || metadata.category || "uncategorized",

		// Triage fields
		status,
		quality: analysis.quality,
		improvementStatus:
			analysis.quality === "excellent" ? "complete" : "planned",
		lastReviewed: new Date().toISOString().split("T")[0],

		// Source tracking
		source: sourceInfo.source,
		sourceStatus: sourceInfo.status,
		sourceUrl: sourceInfo.source === "claudekit" ? CLAUDEKIT_REPO : null,
		originalAuthor:
			sourceInfo.source === "custom" ? "internal" : sourceInfo.source,

		// Usage metrics
		usageFrequency: "unknown",
		lastUsed: null,
		knownIssues: [],

		// Technical metadata
		tools: metadata.tools || [],
		bundle: metadata.bundle || [],
		dependencies: [],
		overlappingAgents: [], // Will be filled later

		// Content metrics
		...analysis,

		// Triage decisions
		triageDecision: "pending",
		triageNotes: "",
		priority:
			analysis.quality === "excellent"
				? "essential"
				: analysis.quality === "good"
					? "important"
					: "nice-to-have",
	};
}

async function getAllAgentFiles() {
	const agents = [];

	async function scanDirectory(dir, category = null) {
		const entries = await fs.readdir(dir, { withFileTypes: true });

		for (const entry of entries) {
			const fullPath = path.join(dir, entry.name);

			if (entry.isDirectory()) {
				// Use directory name as category
				await scanDirectory(fullPath, entry.name);
			} else if (entry.isFile() && entry.name.endsWith(".md")) {
				agents.push({ path: fullPath, category });
			}
		}
	}

	await scanDirectory(AGENTS_DIR);
	return agents;
}

async function generateInventory() {
	console.log("🔍 Scanning agents directory...");
	const agentFiles = await getAllAgentFiles();
	console.log(`📁 Found ${agentFiles.length} agent files`);

	console.log("📊 Analyzing agents...");
	const agents = [];
	const categories = {};

	for (const { path: filePath, category } of agentFiles) {
		const agent = await processAgent(filePath, category);
		agents.push(agent);

		// Group by category
		const cat = agent.category;
		if (!categories[cat]) {
			categories[cat] = {
				name: cat.charAt(0).toUpperCase() + cat.slice(1),
				description: `${cat} related agents`,
				agentCount: 0,
				agents: [],
			};
		}
		categories[cat].agents.push(agent);
		categories[cat].agentCount++;
	}

	console.log("🔗 Finding overlapping agents...");
	const overlaps = await findOverlappingAgents(agents);
	for (const agent of agents) {
		agent.overlappingAgents = overlaps[agent.id] || [];
	}

	// Generate summary statistics
	const summary = {
		byStatus: {},
		byQuality: {},
		bySource: {},
		duplicates: [],
		unusedAgents: [],
	};

	for (const agent of agents) {
		// Status counts
		summary.byStatus[agent.status] = (summary.byStatus[agent.status] || 0) + 1;

		// Quality counts
		summary.byQuality[agent.quality] =
			(summary.byQuality[agent.quality] || 0) + 1;

		// Source counts
		summary.bySource[agent.source] = (summary.bySource[agent.source] || 0) + 1;

		// Find duplicates
		if (agent.overlappingAgents.length > 0) {
			const existing = summary.duplicates.find(
				(d) =>
					d.agents.includes(agent.id) ||
					d.agents.some((a) => agent.overlappingAgents.includes(a)),
			);
			if (existing) {
				if (!existing.agents.includes(agent.id)) {
					existing.agents.push(agent.id);
				}
			} else {
				summary.duplicates.push({
					agents: [agent.id, ...agent.overlappingAgents],
					recommendation: `Consider merging ${agent.id} with ${agent.overlappingAgents[0]}`,
				});
			}
		}

		// Identify unused agents
		if (agent.id === "oracle" || agent.id === "clarification-loop-engine") {
			summary.unusedAgents.push(agent.id);
		}
	}

	// Create final inventory
	const inventory = {
		version: "1.0.0",
		lastUpdated: new Date().toISOString().split("T")[0],
		description: "Agent inventory for triage and quality assessment",
		basePath: ".claude/agents",
		totalAgents: agents.length,
		categories,
		summary,
	};

	// Write inventory to file
	console.log("💾 Writing inventory to file...");
	await fs.writeFile(OUTPUT_FILE, JSON.stringify(inventory, null, 2));
	console.log(`✅ Agent inventory created: ${OUTPUT_FILE}`);

	// Print summary
	console.log("\n📈 Summary:");
	console.log(`  Total agents: ${agents.length}`);
	console.log(`  Categories: ${Object.keys(categories).length}`);
	console.log("  Quality distribution:");
	for (const [quality, count] of Object.entries(summary.byQuality)) {
		console.log(`    - ${quality}: ${count}`);
	}
	console.log("  Source distribution:");
	for (const [source, count] of Object.entries(summary.bySource)) {
		console.log(`    - ${source}: ${count}`);
	}
	console.log(`  Potential duplicates: ${summary.duplicates.length} groups`);

	return inventory;
}

// Run the script
generateInventory().catch(console.error);
