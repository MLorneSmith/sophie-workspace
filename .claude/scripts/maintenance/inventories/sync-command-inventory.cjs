#!/usr/bin/env node

/**
 * Comprehensive command inventory synchronization script
 * - Discovers all commands in .claude/commands/
 * - Extracts metadata from command files
 * - Updates inventory with new/changed commands
 * - Removes deleted commands
 * - Maintains category organization
 */

const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

const PROJECT_ROOT = path.join(__dirname, "..", "..", "..");
const COMMANDS_DIR = path.join(PROJECT_ROOT, ".claude", "commands");
const INVENTORY_PATH = path.join(
	PROJECT_ROOT,
	".claude",
	"data",
	"commands-inventory.json",
);

// Category patterns for automatic classification
const CATEGORY_PATTERNS = {
	agentManagement: [/^agents-md\//, /^agent-mgmt\//, /create-subagent/],
	featureDevelopment: [/^feature\//],
	developmentWorkflow: [
		/code-review/,
		/codecheck/,
		/write-tests/,
		/validate-and-fix/,
		/workflow/,
	],
	gitOperations: [/^git\//],
	checkpointManagement: [/^checkpoint\//],
	taskIssueManagement: [/do-task/, /log-task/, /log-issue/, /research/],
	specificationManagement: [/^spec\//],
	cicdDeployment: [/cicd-debug/, /^pr/, /promote-to-/],
	infrastructureConfiguration: [
		/db-healthcheck/,
		/^config\//,
		/^dev\//,
		/^update\//,
	],
	debuggingTesting: [/debug-issue/, /^test(?:writers)?\//],
	utilities: [
		/create-command/,
		/command-optimizer/,
		/create-context/,
		/claude-md-optimizer/,
		/^command\//,
	],
};

/**
 * Determine category based on command path patterns
 */
function determineCategory(commandPath) {
	// Remove .md extension for pattern matching
	const pathWithoutExt = commandPath.replace(/\.md$/, "");

	for (const [category, patterns] of Object.entries(CATEGORY_PATTERNS)) {
		for (const pattern of patterns) {
			if (pattern.test(pathWithoutExt)) {
				return category;
			}
		}
	}
	return "utilities";
}

/**
 * Get all markdown files recursively
 */
function getAllCommandFiles(dir, baseDir = dir) {
	const files = [];

	try {
		const entries = fs.readdirSync(dir, { withFileTypes: true });

		for (const entry of entries) {
			const fullPath = path.join(dir, entry.name);
			if (entry.isDirectory()) {
				// Skip the agents subdirectory as those are agent definitions, not commands
				if (entry.name === "agents") continue;
				files.push(...getAllCommandFiles(fullPath, baseDir));
			} else if (entry.isFile() && entry.name.endsWith(".md")) {
				// Store relative path from commands directory
				const relativePath = path.relative(baseDir, fullPath);
				files.push(relativePath);
			}
		}
	} catch (error) {
		console.error(`⚠️  Error reading directory ${dir}: ${error.message}`);
	}

	return files;
}

/**
 * Extract command metadata from file content
 */
function extractCommandMetadata(filePath) {
	const fullPath = path.join(COMMANDS_DIR, filePath);

	try {
		const content = fs.readFileSync(fullPath, "utf-8");

		// Extract command name from path or content
		let commandName = "";

		// Try to extract from YAML frontmatter
		const yamlMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
		if (yamlMatch) {
			const commandMatch = yamlMatch[1].match(/command:\s*(.+)$/m);
			if (commandMatch) {
				commandName = commandMatch[1].trim();
			}
		}

		// If no YAML command, try to extract from content patterns
		if (!commandName) {
			// Look for patterns like "Command: /feature/spec" or "## /feature/spec"
			const patterns = [
				/^Command:\s*(.+)$/m,
				/^##?\s+(\/[\w-]+(?:\/[\w-]+)*)/m,
				/^Name:\s*(.+)$/m,
			];

			for (const pattern of patterns) {
				const match = content.match(pattern);
				if (match) {
					commandName = match[1].trim();
					break;
				}
			}
		}

		// If still no command name, derive from file path
		if (!commandName) {
			// Convert path to command format: feature/spec.md -> /feature/spec
			commandName = "/" + filePath.replace(/\.md$/, "").replace(/\\/g, "/");
		}

		// Extract description
		let description = "";

		// Try YAML frontmatter first
		if (yamlMatch) {
			const descMatch = yamlMatch[1].match(/description:\s*(.+)$/m);
			if (descMatch) {
				description = descMatch[1].trim().replace(/^["']|["']$/g, "");
			}
		}

		// Try to find description in content
		if (!description) {
			const patterns = [
				/^Description:\s*(.+)$/m,
				/^Purpose:\s*(.+)$/m,
				/^##?\s+(?:Description|Purpose|Overview)\s*\n+(.+)$/m,
			];

			for (const pattern of patterns) {
				const match = content.match(pattern);
				if (match) {
					description = match[1].trim();
					break;
				}
			}
		}

		// If still no description, try first paragraph after first heading
		if (!description) {
			const paragraphMatch = content.match(
				/^##?[^\n]+\n+([^#\n-].+?)(?:\n|$)/m,
			);
			if (paragraphMatch) {
				description = paragraphMatch[1].trim();
			}
		}

		// Check if optimized (has certain quality indicators)
		const hasExamples =
			content.includes("## Example") || content.includes("<example>");
		const hasUsage = content.includes("## Usage") || content.includes("Usage:");
		const hasParameters =
			content.includes("## Parameters") || content.includes("Parameters:");
		const hasWorkflow =
			content.includes("## Workflow") || content.includes("workflow");
		const isWellStructured = hasExamples || (hasUsage && hasParameters);
		const optimized = isWellStructured || hasWorkflow;

		// Determine file size for stats
		const stats = fs.statSync(fullPath);
		const fileSize = stats.size;
		const lineCount = content.split("\n").length;

		return {
			command: commandName,
			description: description || "No description available",
			optimized,
			path: filePath,
			fileSize,
			lineCount,
			hasExamples,
			hasUsage,
			hasParameters,
		};
	} catch (error) {
		console.error(
			`⚠️  Could not extract metadata for ${filePath}: ${error.message}`,
		);

		// Return minimal metadata
		const commandName = "/" + filePath.replace(/\.md$/, "").replace(/\\/g, "/");
		return {
			command: commandName,
			description: "Command file",
			optimized: false,
			path: filePath,
			fileSize: 0,
			lineCount: 0,
		};
	}
}

/**
 * Load existing inventory with proper structure
 */
function loadInventory() {
	try {
		const content = fs.readFileSync(INVENTORY_PATH, "utf-8");
		const inventory = JSON.parse(content);

		// Ensure proper structure
		if (!inventory.categories) {
			inventory.categories = {};
		}
		if (!inventory.metadata) {
			inventory.metadata = {
				totalCommands: 0,
				lastUpdated: new Date().toISOString(),
				version: "1.0.0",
			};
		}

		return inventory;
	} catch (error) {
		console.log("📝 Creating new inventory...");

		// Create default structure with all categories
		const categories = {};
		const categoryNames = {
			agentManagement: "Agent Management",
			featureDevelopment: "Feature Development",
			developmentWorkflow: "Development Workflow",
			gitOperations: "Git Operations",
			checkpointManagement: "Checkpoint Management",
			taskIssueManagement: "Task & Issue Management",
			specificationManagement: "Specification Management",
			cicdDeployment: "CI/CD & Deployment",
			infrastructureConfiguration: "Infrastructure & Configuration",
			debuggingTesting: "Debugging & Testing",
			utilities: "Utilities",
		};

		for (const [key, name] of Object.entries(categoryNames)) {
			categories[key] = {
				name,
				commandCount: 0,
				commands: [],
			};
		}

		return {
			metadata: {
				totalCommands: 0,
				lastUpdated: new Date().toISOString(),
				version: "1.0.0",
			},
			categories,
		};
	}
}

/**
 * Main synchronization function
 */
async function syncInventory() {
	console.log("🔄 Starting command inventory synchronization...\n");

	// Load existing inventory
	const inventory = loadInventory();

	// Get all command files
	const commandFiles = getAllCommandFiles(COMMANDS_DIR);
	console.log(
		`📁 Found ${commandFiles.length} command files in .claude/commands/\n`,
	);

	// Track existing commands for removal detection
	const existingCommands = new Set();
	for (const category of Object.values(inventory.categories)) {
		for (const cmd of category.commands) {
			existingCommands.add(cmd.command);
		}
	}

	// Clear existing commands in preparation for rebuild
	for (const category of Object.values(inventory.categories)) {
		category.commands = [];
		category.commandCount = 0;
	}

	// Track changes
	const added = [];
	const updated = [];
	const discovered = new Set();

	// Process each command file
	for (const filePath of commandFiles) {
		console.log(`📄 Processing: ${filePath}`);

		// Extract metadata
		const metadata = extractCommandMetadata(filePath);
		const category = determineCategory(filePath);

		// Track discovered command
		discovered.add(metadata.command);

		// Check if this is new or updated
		if (existingCommands.has(metadata.command)) {
			updated.push(metadata.command);
			console.log(`   🔄 Updated: ${metadata.command}`);
		} else {
			added.push(metadata.command);
			console.log(`   ➕ New: ${metadata.command}`);
		}

		// Add to appropriate category
		if (!inventory.categories[category]) {
			console.warn(`   ⚠️  Unknown category: ${category}`);
			continue;
		}

		inventory.categories[category].commands.push({
			command: metadata.command,
			description: metadata.description,
			category,
			optimized: metadata.optimized,
			path: metadata.path,
		});

		inventory.categories[category].commandCount++;
		console.log(
			`   ✓ Added to category: ${inventory.categories[category].name}\n`,
		);
	}

	// Find removed commands
	const removed = [];
	for (const cmd of existingCommands) {
		if (!discovered.has(cmd)) {
			removed.push(cmd);
		}
	}

	// Sort commands within each category
	for (const category of Object.values(inventory.categories)) {
		category.commands.sort((a, b) => a.command.localeCompare(b.command));
	}

	// Update metadata
	inventory.metadata.totalCommands = discovered.size;
	inventory.metadata.lastUpdated = new Date().toISOString();

	// Write updated inventory
	fs.writeFileSync(INVENTORY_PATH, JSON.stringify(inventory, null, "\t"));

	// Print summary
	console.log("\n" + "=".repeat(60));
	console.log("📊 SYNCHRONIZATION SUMMARY");
	console.log("=".repeat(60));
	console.log(`✅ New commands:      ${added.length}`);
	console.log(`🔄 Updated commands:  ${updated.length}`);
	console.log(`➖ Removed commands:  ${removed.length}`);
	console.log(`📁 Total commands:    ${discovered.size}`);
	console.log("=".repeat(60));

	if (added.length > 0) {
		console.log("\n➕ New commands added:");
		for (const cmd of added) {
			console.log(`   - ${cmd}`);
		}
	}

	if (removed.length > 0) {
		console.log("\n➖ Commands removed:");
		for (const cmd of removed) {
			console.log(`   - ${cmd}`);
		}
	}

	// Category summary
	console.log("\n📊 Commands by category:");
	for (const [key, category] of Object.entries(inventory.categories)) {
		if (category.commandCount > 0) {
			const optimizedCount = category.commands.filter(
				(c) => c.optimized,
			).length;
			console.log(
				`   ${category.name}: ${category.commandCount} commands (${optimizedCount} optimized)`,
			);
		}
	}

	// Try to format with Biome
	try {
		execSync(`npx biome check --write "${INVENTORY_PATH}"`, {
			stdio: "ignore",
		});
		console.log("\n✨ Formatted inventory with Biome");
	} catch {
		// Ignore formatting errors
	}

	console.log("\n✅ Command inventory synchronized successfully!");

	return {
		added: added.length,
		updated: updated.length,
		removed: removed.length,
		total: discovered.size,
	};
}

// Run if called directly
if (require.main === module) {
	syncInventory()
		.then(() => process.exit(0))
		.catch((error) => {
			console.error("❌ Error:", error);
			process.exit(1);
		});
}

module.exports = { syncInventory };
