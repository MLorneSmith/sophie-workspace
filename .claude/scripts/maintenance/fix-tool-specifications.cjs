#!/usr/bin/env node

/**
 * fix-tool-specifications.cjs
 * Automatically adds missing tool specifications to agent frontmatter
 * by parsing tool mentions in the agent body text
 */

const fs = require("node:fs");
const path = require("node:path");
const yaml = require("js-yaml");

// Agents that need tool specifications fixed, with their detected tools
const agentsToFix = {
	"cicd-investigator": "*",
	"research-agent":
		"Bash, Glob, Grep, LS, Read, Edit, MultiEdit, Write, NotebookEdit, WebFetch, TodoWrite, WebSearch, BashOutput, KillShell, ListMcpResourcesTool, ReadMcpResourceTool, mcp__context7__resolve-library-id, mcp__context7__get-library-docs, mcp__exa__exa_search, mcp__perplexity-ask__perplexity_ask",
	"vitest-testing-expert": "*",
	"git-expert": "*",
	"code-search-expert": "Read, Bash, Grep, Glob",
	"log-issue": "*",
	"ai-sdk-expert": "*",
	"test-suite-architect": "*",
	"cicd-orchestrator": "*",
	"devops-expert": "*",
	"infrastructure-docker-expert": "*",
	"typescript-expert": "*",
};

// Map of agent names to their file paths
const agentPaths = {
	"test-analysis-agent": "./.claude/agents/testwriters/test-analysis-agent.md",
	"cicd-investigator": "./.claude/agents/cicd-investigator.md",
	"research-agent": "./.claude/agents/research-agent.md",
	"vitest-testing-expert": "./.claude/agents/testing/vitest-testing-expert.md",
	"git-expert": "./.claude/agents/git/git-expert.md",
	"code-search-expert": "./.claude/agents/code-search-expert.md",
	"log-issue": "./.claude/agents/log-issue.md",
	"ai-sdk-expert": "./.claude/agents/ai-sdk-expert.md",
	"test-suite-architect": "./.claude/agents/test-suite-architect.md",
	"cicd-orchestrator": "./.claude/agents/cicd-orchestrator.md",
	"devops-expert": "./.claude/agents/devops/devops-expert.md",
	"infrastructure-docker-expert":
		"./.claude/agents/infrastructure/infrastructure-docker-expert.md",
	"typescript-expert": "./.claude/agents/typescript/typescript-expert.md",
};

function extractToolsFromBody(body) {
	const toolPatterns = [
		/Tools:\s*([^\n]+)/gi,
		/\(Tools:\s*([^)]+)\)/gi,
		/allowed-tools:\s*\[([^\]]+)\]/gi,
		/using the (\w+) tool/gi,
		/Use the (\w+) tool/gi,
		/with the (\w+) tool/gi,
	];

	const detectedTools = new Set();

	for (const pattern of toolPatterns) {
		let match;
		while ((match = pattern.exec(body)) !== null) {
			const toolString = match[1];
			// Split by common delimiters and clean up
			const tools = toolString
				.split(/[,;|\s]+/)
				.map((t) => t.trim())
				.filter((t) => t && t.length > 1 && /^[A-Z]/.test(t));

			tools.forEach((tool) => {
				// Clean up tool names
				const cleanTool = tool.replace(/[^a-zA-Z0-9_*:]/g, "");
				if (
					cleanTool &&
					!["The", "Use", "With", "Tools", "For"].includes(cleanTool)
				) {
					detectedTools.add(cleanTool);
				}
			});
		}
	}

	return Array.from(detectedTools);
}

function updateAgentFile(agentName, filePath, tools) {
	const fullPath = path.join(process.cwd(), filePath);

	if (!fs.existsSync(fullPath)) {
		console.error(`❌ File not found: ${fullPath}`);
		return false;
	}

	const content = fs.readFileSync(fullPath, "utf-8");

	// Check if file has frontmatter
	const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

	let updatedContent;

	if (frontmatterMatch) {
		// Parse existing frontmatter - but handle special cases
		const frontmatterContent = frontmatterMatch[1];

		// For agents with problematic YAML (multiline descriptions), handle manually
		if (
			[
				"cicd-investigator",
				"research-agent",
				"log-issue",
				"test-suite-architect",
				"cicd-orchestrator",
			].includes(agentName)
		) {
			// Just add tools field manually without parsing YAML
			if (!frontmatterContent.includes("tools:")) {
				const toolsLine =
					tools === "*"
						? 'tools: "*"'
						: `tools: [${tools
								.split(",")
								.map((t) => `"${t.trim()}"`)
								.join(", ")}]`;
				const updatedFrontmatter = frontmatterContent + "\n" + toolsLine;
				updatedContent = content.replace(
					/^---\n[\s\S]*?\n---/,
					`---\n${updatedFrontmatter}\n---`,
				);
			} else {
				console.log(`ℹ️  ${agentName} already has tools specified, skipping`);
				return false;
			}
		} else {
			// Normal YAML parsing for other agents
			let frontmatter;

			try {
				frontmatter = yaml.load(frontmatterContent) || {};
			} catch (e) {
				console.error(`❌ Failed to parse YAML for ${agentName}:`, e.message);
				return false;
			}

			// Add or update tools field
			if (
				!frontmatter.tools ||
				(typeof frontmatter.tools === "string" &&
					frontmatter.tools.trim() === "")
			) {
				if (tools === "*") {
					frontmatter.tools = "*";
				} else {
					frontmatter.tools = tools
						.split(",")
						.map((t) => t.trim())
						.filter((t) => t);
				}

				// Convert back to YAML
				const newFrontmatter = yaml.dump(frontmatter, {
					lineWidth: -1,
					noRefs: true,
					quotingType: '"',
					flowLevel: -1,
				});

				// Replace frontmatter in content
				updatedContent = content.replace(
					/^---\n[\s\S]*?\n---/,
					`---\n${newFrontmatter.trim()}\n---`,
				);
			} else {
				console.log(`ℹ️  ${agentName} already has tools specified, skipping`);
				return false;
			}
		}
	} else {
		// No frontmatter, create it
		const frontmatter = {
			name: agentName,
			tools:
				tools === "*"
					? "*"
					: tools
							.split(",")
							.map((t) => t.trim())
							.filter((t) => t),
		};

		const newFrontmatter = yaml.dump(frontmatter, {
			lineWidth: -1,
			noRefs: true,
			quotingType: '"',
			flowLevel: -1,
		});

		updatedContent = `---\n${newFrontmatter.trim()}\n---\n\n${content}`;
	}

	// Write updated content back
	fs.writeFileSync(fullPath, updatedContent);
	console.log(
		`✅ Updated ${agentName} with tools: ${tools === "*" ? "all (*)" : tools}`,
	);
	return true;
}

function main() {
	console.log("🔧 Fixing Tool Specifications in Agent Files\n");

	let successCount = 0;
	let skipCount = 0;
	let errorCount = 0;

	for (const [agentName, tools] of Object.entries(agentsToFix)) {
		const filePath = agentPaths[agentName];

		if (!filePath) {
			console.error(`❌ No file path defined for ${agentName}`);
			errorCount++;
			continue;
		}

		// If tools is not specified, try to detect from body
		let toolsToAdd = tools;
		if (!tools || tools === "detect") {
			const fullPath = path.join(process.cwd(), filePath);
			if (fs.existsSync(fullPath)) {
				const content = fs.readFileSync(fullPath, "utf-8");
				const detectedTools = extractToolsFromBody(content);
				if (detectedTools.length > 0) {
					toolsToAdd = detectedTools.join(", ");
					console.log(`🔍 Detected tools for ${agentName}: ${toolsToAdd}`);
				} else {
					toolsToAdd = "*"; // Default to all tools if can't detect
					console.log(
						`⚠️  Could not detect tools for ${agentName}, using * (all tools)`,
					);
				}
			}
		}

		const result = updateAgentFile(agentName, filePath, toolsToAdd);
		if (result) {
			successCount++;
		} else {
			skipCount++;
		}
	}

	console.log("\n📊 Summary:");
	console.log(`✅ Successfully updated: ${successCount} agents`);
	console.log(`⏭️  Skipped (already has tools): ${skipCount} agents`);
	console.log(`❌ Errors: ${errorCount} agents`);

	if (successCount > 0) {
		console.log("\n🎉 Tool specifications have been fixed!");
		console.log(
			"📝 Next step: Run the quality evaluator to verify improvements",
		);
	}
}

// Run the script
main();
