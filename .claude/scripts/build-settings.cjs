#!/usr/bin/env node

/**
 * Build script to merge split configuration files into settings.local.json
 * This addresses security concern ISSUE-310 by allowing separate management
 * of sensitive configurations while maintaining Claude Code compatibility.
 */

const fs = require("node:fs");
const path = require("node:path");

const CLAUDE_DIR = path.join(__dirname, "..");
const SETTINGS_DIR = path.join(CLAUDE_DIR, "settings");
const OUTPUT_FILE = path.join(CLAUDE_DIR, "settings.local.json");

// Configuration files to merge (in order of precedence)
const CONFIG_FILES = ["environment.json", "permissions.json", "mcp.json"];

function loadJsonFile(filepath) {
	try {
		const content = fs.readFileSync(filepath, "utf8");
		return JSON.parse(content);
	} catch (error) {
		console.error(`Error loading ${filepath}:`, error.message);
		return null;
	}
}

function mergeConfigs() {
	let mergedConfig = {};

	// Load and merge each config file
	for (const configFile of CONFIG_FILES) {
		const filepath = path.join(SETTINGS_DIR, configFile);

		if (!fs.existsSync(filepath)) {
			console.warn(`Warning: ${configFile} not found, skipping...`);
			continue;
		}

		const config = loadJsonFile(filepath);
		if (config) {
			// Remove _comment fields as they're not part of the schema
			delete config._comment;

			// Deep merge the configurations
			mergedConfig = { ...mergedConfig, ...config };
		}
	}

	return mergedConfig;
}

function main() {
	console.log("Building settings.local.json from split configuration files...");

	// Check if settings directory exists
	if (!fs.existsSync(SETTINGS_DIR)) {
		console.error(`Error: Settings directory not found at ${SETTINGS_DIR}`);
		process.exit(1);
	}

	// Merge configurations
	const mergedConfig = mergeConfigs();

	// Write merged configuration
	try {
		fs.writeFileSync(OUTPUT_FILE, JSON.stringify(mergedConfig, null, 2));
		console.log(`✅ Successfully created ${OUTPUT_FILE}`);

		// Verify the structure
		const expectedKeys = [
			"env",
			"permissions",
			"enableAllProjectMcpServers",
			"enabledMcpjsonServers",
		];
		const actualKeys = Object.keys(mergedConfig);
		const missingKeys = expectedKeys.filter((key) => !actualKeys.includes(key));

		if (missingKeys.length > 0) {
			console.warn(
				`⚠️  Warning: Missing expected keys: ${missingKeys.join(", ")}`,
			);
		}

		console.log("\nMerged configuration summary:");
		console.log(
			`  - Environment variables: ${Object.keys(mergedConfig.env || {}).length}`,
		);
		console.log(
			`  - Permission rules: ${(mergedConfig.permissions?.allow || []).length} allow, ${(mergedConfig.permissions?.deny || []).length} deny`,
		);
		console.log(
			`  - MCP servers: ${(mergedConfig.enabledMcpjsonServers || []).length} enabled`,
		);
	} catch (error) {
		console.error("Error writing settings.local.json:", error.message);
		process.exit(1);
	}
}

// Run if called directly
if (require.main === module) {
	main();
}
