#!/usr/bin/env node

/**
 * Command Inventory Manager
 *
 * Manages the .claude/data/commands-inventory.json file
 * Extracted from command-optimizer.md for reusability and performance
 *
 * Usage:
 *   node inventory-manager.js add --command "/foo" --description "Does foo" [--category "utilities"] [--optimized]
 *   node inventory-manager.js update --command "/foo" [--description "New desc"] [--optimized]
 *   node inventory-manager.js find --command "/foo"
 *   node inventory-manager.js list [--category "utilities"]
 */

const fs = require("node:fs");
const path = require("node:path");

// Constants
const INVENTORY_PATH = path.join(
	__dirname,
	"../../data/commands-inventory.json",
);
const DEFAULT_CATEGORY = "utilities";

// Category patterns for automatic classification
const CATEGORY_PATTERNS = {
	agentManagement: [/^\/agents-md\//, /^\/create-subagent$/],
	featureDevelopment: [/^\/feature\//],
	developmentWorkflow: [
		/^\/code-review$/,
		/^\/codecheck$/,
		/^\/write-tests$/,
		/^\/validate-and-fix$/,
		/^\/workflow$/,
	],
	gitOperations: [/^\/git\//],
	checkpointManagement: [/^\/checkpoint\//],
	taskIssueManagement: [
		/^\/do-task$/,
		/^\/log-task$/,
		/^\/log-issue$/,
		/^\/research$/,
	],
	specificationManagement: [/^\/spec\//],
	cicdDeployment: [/^\/cicd-debug$/, /^\/pr$/, /^\/promote-to-/],
	infrastructureConfiguration: [
		/^\/db-healthcheck$/,
		/^\/config\//,
		/^\/dev\//,
		/^\/update-/,
	],
	debuggingTesting: [/^\/debug-issue$/, /^\/test$/],
	utilities: [/^\/create-command$/, /^\/command-optimizer$/],
};

/**
 * Determine category based on command name patterns
 */
function determineCategory(commandName) {
	for (const [category, patterns] of Object.entries(CATEGORY_PATTERNS)) {
		for (const pattern of patterns) {
			if (pattern.test(commandName)) {
				return category;
			}
		}
	}
	return DEFAULT_CATEGORY;
}

/**
 * Read the current inventory
 */
function readInventory() {
	try {
		if (!fs.existsSync(INVENTORY_PATH)) {
			console.error(`Inventory file not found at: ${INVENTORY_PATH}`);
			return null;
		}
		const content = fs.readFileSync(INVENTORY_PATH, "utf8");
		return JSON.parse(content);
	} catch (error) {
		console.error(`Error reading inventory: ${error.message}`);
		return null;
	}
}

/**
 * Write the updated inventory
 */
function writeInventory(inventory) {
	try {
		const content = JSON.stringify(inventory, null, 2);
		fs.writeFileSync(INVENTORY_PATH, content, "utf8");
		return true;
	} catch (error) {
		console.error(`Error writing inventory: ${error.message}`);
		return false;
	}
}

/**
 * Find a command in the inventory
 */
function findCommand(inventory, commandName) {
	for (const category of Object.values(inventory.categories)) {
		const command = category.commands.find(
			(cmd) => cmd.command === commandName,
		);
		if (command) {
			return { command, category };
		}
	}
	return null;
}

/**
 * Add a new command to the inventory
 */
function addCommand(
	inventory,
	{ command, description, category, optimized = true },
) {
	// Determine category if not provided
	const targetCategory = category || determineCategory(command);

	// Check if command already exists
	const existing = findCommand(inventory, command);
	if (existing) {
		console.log(
			`Command already exists in category: ${existing.category.name}`,
		);
		return false;
	}

	// Ensure category exists
	if (!inventory.categories[targetCategory]) {
		console.error(`Unknown category: ${targetCategory}`);
		return false;
	}

	// Add the command
	const newCommand = {
		command,
		description,
		category: targetCategory,
		optimized,
	};

	inventory.categories[targetCategory].commands.push(newCommand);
	inventory.categories[targetCategory].commandCount++;
	inventory.metadata.totalCommands++;

	// Sort commands alphabetically
	inventory.categories[targetCategory].commands.sort((a, b) =>
		a.command.localeCompare(b.command),
	);

	return true;
}

/**
 * Update an existing command
 */
function updateCommand(inventory, { command, description, optimized }) {
	const result = findCommand(inventory, command);
	if (!result) {
		console.log(`Command not found: ${command}`);
		return false;
	}

	const { command: cmdObj } = result;

	// Update fields if provided
	if (description !== undefined) {
		cmdObj.description = description;
	}
	if (optimized !== undefined) {
		cmdObj.optimized = optimized;
	}

	return true;
}

/**
 * Update metadata
 */
function updateMetadata(inventory) {
	inventory.metadata.lastUpdated = new Date().toISOString();
}

/**
 * Parse command line arguments
 */
function parseArgs() {
	const args = process.argv.slice(2);
	const result = {
		operation: args[0],
		options: {},
	};

	for (let i = 1; i < args.length; i++) {
		if (args[i].startsWith("--")) {
			const key = args[i].slice(2);
			const value =
				args[i + 1] && !args[i + 1].startsWith("--") ? args[++i] : true;
			result.options[key] = value;
		}
	}

	return result;
}

/**
 * Main execution
 */
function main() {
	const { operation, options } = parseArgs();

	if (!operation) {
		console.log("Usage: inventory-manager.js <operation> [options]");
		console.log("Operations: add, update, find, list");
		process.exit(1);
	}

	// Read inventory
	const inventory = readInventory();
	if (!inventory) {
		process.exit(1);
	}

	let success = false;

	switch (operation) {
		case "add":
			if (!options.command || !options.description) {
				console.error("Required: --command and --description");
				process.exit(1);
			}
			success = addCommand(inventory, {
				command: options.command,
				description: options.description,
				category: options.category,
				optimized: options.optimized !== false,
			});
			if (success) {
				updateMetadata(inventory);
				writeInventory(inventory);
				console.log(`✓ Added command: ${options.command}`);
			}
			break;

		case "update":
			if (!options.command) {
				console.error("Required: --command");
				process.exit(1);
			}
			success = updateCommand(inventory, {
				command: options.command,
				description: options.description,
				optimized: options.optimized,
			});
			if (success) {
				updateMetadata(inventory);
				writeInventory(inventory);
				console.log(`✓ Updated command: ${options.command}`);
			}
			break;

		case "find": {
			if (!options.command) {
				console.error("Required: --command");
				process.exit(1);
			}
			const result = findCommand(inventory, options.command);
			if (result) {
				console.log(JSON.stringify(result.command, null, 2));
			} else {
				console.log("Command not found");
			}
			success = true; // Find operation completed successfully regardless of result
			break;
		}

		case "list":
			if (options.category) {
				const category = inventory.categories[options.category];
				if (category) {
					console.log(`Category: ${category.name}`);
					category.commands.forEach((cmd) => {
						console.log(`  ${cmd.command}: ${cmd.description}`);
					});
					success = true;
				} else {
					console.error(`Category not found: ${options.category}`);
					// Don't set success = true for invalid category
				}
			} else {
				// List all commands
				for (const [key, category] of Object.entries(inventory.categories)) {
					console.log(`\n${category.name} (${category.commandCount}):`);
					category.commands.forEach((cmd) => {
						const opt = cmd.optimized ? "✓" : "✗";
						console.log(`  [${opt}] ${cmd.command}: ${cmd.description}`);
					});
				}
				console.log(`\nTotal commands: ${inventory.metadata.totalCommands}`);
				success = true;
			}
			break;

		default:
			console.error(`Unknown operation: ${operation}`);
			process.exit(1);
	}

	process.exit(success ? 0 : 1);
}

// Run if executed directly
if (require.main === module) {
	main();
}

// Export functions for use as a module
module.exports = {
	determineCategory,
	readInventory,
	writeInventory,
	findCommand,
	addCommand,
	updateCommand,
	updateMetadata,
};
