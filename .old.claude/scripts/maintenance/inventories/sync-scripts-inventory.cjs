#!/usr/bin/env node

/**
 * Comprehensive scripts inventory synchronization script
 * - Discovers all scripts in .claude/scripts/
 * - Extracts metadata from script files
 * - Updates inventory with new/changed scripts
 * - Removes deleted scripts
 * - Maintains category organization based on directory structure
 */

const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

const PROJECT_ROOT = path.join(__dirname, "..", "..", "..", "..");
const SCRIPTS_DIR = path.join(PROJECT_ROOT, ".claude", "scripts");
const INVENTORY_PATH = path.join(
	PROJECT_ROOT,
	".claude",
	"data",
	"scripts-inventory.json",
);

// Script file extensions to include
const SCRIPT_EXTENSIONS = [".sh", ".cjs", ".js", ".ts", ".mjs"];

// Category mapping based on directory structure
const CATEGORY_MAPPING = {
	testing: {
		name: "Testing Infrastructure",
		description:
			"Scripts for test execution, infrastructure management, and quality assurance",
		subcategories: ["infrastructure", "runners", "utilities", "config", "core"],
	},
	analysis: {
		name: "Code Analysis & Quality",
		description:
			"Scripts for analyzing code quality, agents, commands, and generating reports",
		subcategories: ["agents", "commands"],
	},
	development: {
		name: "Development Workflow",
		description: "Core development workflow and debugging scripts",
	},
	build: {
		name: "Build & Configuration",
		description: "Build system and configuration management scripts",
	},
	git: {
		name: "Git Operations",
		description: "Git workflow and version control management scripts",
		subcategories: ["worktree", "conflict-resolution"],
	},
	integration: {
		name: "External Integration",
		description: "Scripts for integrating with external tools and services",
		subcategories: ["github"],
	},
	database: {
		name: "Database Management",
		description: "Database setup, reset, and management scripts",
	},
	maintenance: {
		name: "System Maintenance",
		description:
			"System maintenance, inventory management, and enhancement scripts",
		subcategories: ["inventories"],
	},
};

/**
 * Determine category and subcategory based on script path
 */
function determineCategory(scriptPath) {
	const pathParts = scriptPath.split(path.sep);
	const category = pathParts[0];
	const subcategory = pathParts.length > 2 ? pathParts[1] : null;

	if (CATEGORY_MAPPING[category]) {
		return { category, subcategory };
	}

	// Default to utilities if not in known categories
	return { category: "utilities", subcategory: null };
}

/**
 * Get all script files recursively, excluding config files
 */
function getAllScriptFiles(dir, baseDir = dir) {
	const files = [];

	try {
		const entries = fs.readdirSync(dir, { withFileTypes: true });

		for (const entry of entries) {
			const fullPath = path.join(dir, entry.name);
			if (entry.isDirectory()) {
				// Skip node_modules and context directories
				if (entry.name === "node_modules" || entry.name === "context") continue;
				files.push(...getAllScriptFiles(fullPath, baseDir));
			} else if (
				entry.isFile() &&
				SCRIPT_EXTENSIONS.some((ext) => entry.name.endsWith(ext))
			) {
				// Skip config files in root
				if (
					dir === baseDir &&
					(entry.name === "package.json" || entry.name === "tsconfig.json")
				) {
					continue;
				}

				// Store relative path from scripts directory
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
 * Extract script metadata from file content
 */
function extractScriptMetadata(filePath) {
	const fullPath = path.join(SCRIPTS_DIR, filePath);
	const fileName = path.basename(filePath);
	const extension = path.extname(filePath);

	try {
		const content = fs.readFileSync(fullPath, "utf-8");
		const lines = content.split("\n");

		// Extract script name (without extension)
		const scriptName = fileName.replace(extension, "");

		// Extract description from comments at the top
		let description = "";
		const features = [];
		const dependencies = [];

		// Look for description in first 20 lines of comments
		for (let i = 0; i < Math.min(20, lines.length); i++) {
			const line = lines[i].trim();

			// Skip shebang and empty lines
			if (line.startsWith("#!") || line === "") continue;

			// Extract from comments
			if (
				line.startsWith("#") ||
				line.startsWith("//") ||
				line.startsWith("*")
			) {
				const commentText = line.replace(/^[#/*\s]+/, "").trim();

				// Look for specific patterns
				if (commentText.match(/^(Script|Purpose|Description):/i)) {
					description = commentText.replace(
						/^(Script|Purpose|Description):\s*/i,
						"",
					);
				} else if (
					commentText.match(/^(What|This script|This)/i) &&
					!description
				) {
					description = commentText;
				} else if (
					commentText.length > 10 &&
					!description &&
					commentText.includes(" ")
				) {
					// Use first substantial comment as description
					description = commentText;
				}
			}

			// Stop at first non-comment content
			if (
				!line.startsWith("#") &&
				!line.startsWith("//") &&
				!line.startsWith("*") &&
				line.length > 0
			) {
				break;
			}
		}

		// Extract dependencies from imports/requires
		const importPatterns = [
			/require\(["']([^"']+)["']\)/g,
			/import.*from\s+["']([^"']+)["']/g,
			/import\s+["']([^"']+)["']/g,
		];

		for (const pattern of importPatterns) {
			let match;
			while ((match = pattern.exec(content)) !== null) {
				const dep = match[1];
				// Only include external dependencies (not relative paths)
				if (!dep.startsWith(".") && !dep.startsWith("/")) {
					dependencies.push(dep);
				}
			}
		}

		// Extract features from special comments
		const featurePattern = /(?:Features?|Capabilities?):\s*(.+)/gi;
		let featureMatch;
		while ((featureMatch = featurePattern.exec(content)) !== null) {
			const featureText = featureMatch[1];
			features.push(featureText);
		}

		// Determine script type from extension
		const scriptType = extension.slice(1); // Remove the dot

		// Check for security-related content
		const hasSecurity =
			content.toLowerCase().includes("security") ||
			content.toLowerCase().includes("validate") ||
			content.toLowerCase().includes("issue-310");

		// Determine file size for stats
		const stats = fs.statSync(fullPath);
		const fileSize = stats.size;
		const lineCount = lines.length;

		return {
			name: scriptName,
			path: filePath,
			description:
				description ||
				`${scriptName.charAt(0).toUpperCase() + scriptName.slice(1)} script`,
			type: scriptType,
			dependencies: [...new Set(dependencies)], // Remove duplicates
			features: features.length > 0 ? features : undefined,
			security: hasSecurity ? true : undefined,
			fileSize,
			lineCount,
		};
	} catch (error) {
		console.error(
			`⚠️  Could not extract metadata for ${filePath}: ${error.message}`,
		);

		// Return minimal metadata
		const scriptName = fileName.replace(extension, "");
		return {
			name: scriptName,
			path: filePath,
			description: `${scriptName} script`,
			type: extension.slice(1),
			dependencies: [],
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
				totalScripts: 0,
				lastUpdated: new Date().toISOString(),
				version: "1.0.0",
			};
		}

		return inventory;
	} catch (error) {
		console.log("📝 Creating new inventory...");

		// Create default structure with all categories
		const categories = {};

		for (const [key, config] of Object.entries(CATEGORY_MAPPING)) {
			categories[key] = {
				name: config.name,
				description: config.description,
				scriptCount: 0,
				scripts: [],
			};
		}

		return {
			version: "1.0.0",
			name: "Scripts Inventory",
			description:
				"Complete inventory of all Claude Code utility scripts organized by functional category",
			lastUpdated: new Date().toISOString(),
			totalScripts: 0,
			categories,
			organization: {
				restructured: "2025-09-19",
				previousStructure: "Flat and disorganized root structure",
				currentStructure: "Hierarchical organization by functional domain",
				benefits: [
					"Logical grouping by function",
					"Clear hierarchy for related scripts",
					"Intuitive navigation for developers",
					"Scalability for new scripts",
				],
			},
			scriptTypes: {},
			metadata: {
				infrastructure: {
					totalFiles: 0,
					configFiles: 2,
					deprecated: 0,
					securityFocused: 0,
				},
				notes: [
					"Scripts organized by functional domain after 2025-09-19 restructuring",
					"Modular design emphasized to replace monolithic scripts",
					"Security validation integrated throughout",
					"Multi-environment support (local, remote, test) is standard",
				],
			},
		};
	}
}

/**
 * Main synchronization function
 */
async function syncInventory() {
	console.log("🔄 Starting scripts inventory synchronization...\n");

	// Load existing inventory
	const inventory = loadInventory();

	// Get all script files
	const scriptFiles = getAllScriptFiles(SCRIPTS_DIR);
	console.log(
		`📁 Found ${scriptFiles.length} script files in .claude/scripts/\n`,
	);

	// Track existing scripts for removal detection
	const existingScripts = new Set();
	for (const category of Object.values(inventory.categories)) {
		for (const script of category.scripts || []) {
			existingScripts.add(script.path);
		}
	}

	// Clear existing scripts in preparation for rebuild
	for (const category of Object.values(inventory.categories)) {
		category.scripts = [];
		category.scriptCount = 0;
	}

	// Track changes
	const added = [];
	const updated = [];
	const discovered = new Set();
	const scriptTypes = {};

	// Process each script file
	for (const filePath of scriptFiles) {
		console.log(`📄 Processing: ${filePath}`);

		// Extract metadata
		const metadata = extractScriptMetadata(filePath);
		const { category, subcategory } = determineCategory(filePath);

		// Track discovered script
		discovered.add(filePath);

		// Track script types
		scriptTypes[metadata.type] = (scriptTypes[metadata.type] || 0) + 1;

		// Check if this is new or updated
		if (existingScripts.has(filePath)) {
			updated.push(filePath);
			console.log(`   🔄 Updated: ${metadata.name}`);
		} else {
			added.push(filePath);
			console.log(`   ➕ New: ${metadata.name}`);
		}

		// Add to appropriate category
		if (!inventory.categories[category]) {
			console.warn(`   ⚠️  Unknown category: ${category}`);
			continue;
		}

		const scriptEntry = {
			name: metadata.name,
			path: metadata.path,
			category,
			description: metadata.description,
			type: metadata.type,
		};

		// Add optional fields
		if (subcategory) scriptEntry.subcategory = subcategory;
		if (metadata.dependencies.length > 0)
			scriptEntry.dependencies = metadata.dependencies;
		if (metadata.features) scriptEntry.features = metadata.features;
		if (metadata.security) scriptEntry.security = metadata.security;

		inventory.categories[category].scripts.push(scriptEntry);
		inventory.categories[category].scriptCount++;

		console.log(
			`   ✓ Added to category: ${inventory.categories[category].name}\n`,
		);
	}

	// Find removed scripts
	const removed = [];
	for (const scriptPath of existingScripts) {
		if (!discovered.has(scriptPath)) {
			removed.push(scriptPath);
		}
	}

	// Sort scripts within each category
	for (const category of Object.values(inventory.categories)) {
		if (category.scripts) {
			category.scripts.sort((a, b) => a.name.localeCompare(b.name));
		}
	}

	// Update top-level metadata
	inventory.totalScripts = discovered.size;
	inventory.lastUpdated = new Date().toISOString();

	// Update script types
	inventory.scriptTypes = {};
	for (const [type, count] of Object.entries(scriptTypes)) {
		inventory.scriptTypes[type] = {
			count,
			description: getTypeDescription(type),
		};
	}

	// Update metadata stats
	inventory.metadata.infrastructure.totalFiles = discovered.size;
	const securityCount = scriptFiles.filter((f) => {
		const metadata = extractScriptMetadata(f);
		return metadata.security;
	}).length;
	inventory.metadata.infrastructure.securityFocused = securityCount;

	// Write updated inventory
	fs.writeFileSync(INVENTORY_PATH, JSON.stringify(inventory, null, "\t"));

	// Print summary
	console.log("\n" + "=".repeat(60));
	console.log("📊 SYNCHRONIZATION SUMMARY");
	console.log("=".repeat(60));
	console.log(`✅ New scripts:       ${added.length}`);
	console.log(`🔄 Updated scripts:   ${updated.length}`);
	console.log(`➖ Removed scripts:   ${removed.length}`);
	console.log(`📁 Total scripts:     ${discovered.size}`);
	console.log("=".repeat(60));

	if (added.length > 0) {
		console.log("\n➕ New scripts added:");
		for (const scriptPath of added) {
			console.log(`   - ${scriptPath}`);
		}
	}

	if (removed.length > 0) {
		console.log("\n➖ Scripts removed:");
		for (const scriptPath of removed) {
			console.log(`   - ${scriptPath}`);
		}
	}

	// Category summary
	console.log("\n📊 Scripts by category:");
	for (const [key, category] of Object.entries(inventory.categories)) {
		if (category.scriptCount > 0) {
			console.log(`   ${category.name}: ${category.scriptCount} scripts`);
		}
	}

	// Script type summary
	console.log("\n📊 Scripts by type:");
	for (const [type, info] of Object.entries(scriptTypes)) {
		console.log(`   ${type}: ${info} scripts`);
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

	console.log("\n✅ Scripts inventory synchronized successfully!");

	return {
		added: added.length,
		updated: updated.length,
		removed: removed.length,
		total: discovered.size,
	};
}

/**
 * Get description for script type
 */
function getTypeDescription(type) {
	const descriptions = {
		cjs: "CommonJS modules for Node.js execution",
		sh: "Shell scripts for system operations",
		ts: "TypeScript files",
		js: "JavaScript ES modules",
		mjs: "JavaScript ES modules",
	};
	return descriptions[type] || `${type.toUpperCase()} files`;
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
