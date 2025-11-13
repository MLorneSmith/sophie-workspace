#!/usr/bin/env node

/**
 * Comprehensive context inventory synchronization script
 * - Adds new files found in .claude/context
 * - Removes deleted files from inventory
 * - Updates token counts using token-counter.cjs
 * - Maintains category organization
 */

const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");
const { rebuildGraph } = require("./rebuild-context-graph.cjs");

const PROJECT_ROOT = path.join(__dirname, "..", "..", "..", "..");
const CONTEXT_DIR = path.join(PROJECT_ROOT, ".claude", "context");
const INVENTORY_PATH = path.join(
	PROJECT_ROOT,
	".claude",
	"data",
	"context-inventory.json",
);
const TOKEN_COUNTER_PATH = path.join(
	PROJECT_ROOT,
	".claude",
	"scripts",
	"analysis",
	"token-counter.cjs",
);

// Category mapping based on file paths
const CATEGORY_MAPPINGS = {
	core: [
		"constraints.md",
		"current-focus.md",
		"database-schema.md",
		"development-flow.md",
		"project-overview.md",
		"INDEX.md",
	],
	design: ["design/"],
	roles: ["roles/"],
	standards: ["standards/"],
	systems: ["systems/"],
	architecture: ["architecture/"],
	tools: ["tools/"],
	workflow: ["workflow/"],
	rules: ["rules/"],
	guides: ["guides/"],
	agents: ["agents/"],
	technical: ["technical/"],
};

/**
 * Determines category for a file based on its path
 */
function determineCategory(filePath) {
	for (const [category, patterns] of Object.entries(CATEGORY_MAPPINGS)) {
		for (const pattern of patterns) {
			if (pattern.endsWith("/")) {
				// Directory pattern
				if (filePath.startsWith(pattern)) return category;
			} else {
				// File pattern
				if (filePath === pattern) return category;
			}
		}
	}
	// Default category for unmapped files
	return "general";
}

/**
 * Get all markdown files recursively
 */
function getAllMarkdownFiles(dir, baseDir = dir) {
	const files = [];
	const entries = fs.readdirSync(dir, { withFileTypes: true });

	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			files.push(...getAllMarkdownFiles(fullPath, baseDir));
		} else if (
			entry.isFile() &&
			(entry.name.endsWith(".md") || entry.name.endsWith(".xml"))
		) {
			// Store relative path from context directory
			const relativePath = path.relative(baseDir, fullPath);
			files.push(relativePath);
		}
	}

	return files;
}

/**
 * Get token count using token-counter.cjs
 */
function getTokenCount(filePath) {
	try {
		const fullPath = path.join(CONTEXT_DIR, filePath);
		if (!fs.existsSync(fullPath)) {
			return 0;
		}

		// Use the actual token counter script
		const output = execSync(`node "${TOKEN_COUNTER_PATH}" "${fullPath}"`, {
			encoding: "utf-8",
			stdio: ["pipe", "pipe", "pipe"],
		});

		// Parse JSON output
		try {
			const result = JSON.parse(output);
			return result.tokens || 0;
		} catch {
			// Fallback to regex if not JSON
			const match = output.match(/(\d+)\s+tokens?/i);
			return match ? parseInt(match[1], 10) : 0;
		}
	} catch (error) {
		console.error(
			`⚠️  Could not count tokens for ${filePath}: ${error.message}`,
		);
		// Fallback to simple estimation
		try {
			const fullPath = path.join(CONTEXT_DIR, filePath);
			const content = fs.readFileSync(fullPath, "utf8");
			return Math.ceil(content.length / 4);
		} catch {
			return 0;
		}
	}
}

/**
 * Extract metadata from file content
 */
function extractMetadata(filePath, existingDoc = null) {
	const fullPath = path.join(CONTEXT_DIR, filePath);

	try {
		const content = fs.readFileSync(fullPath, "utf-8");

		// Extract title from first heading or filename
		const titleMatch = content.match(/^#\s+(.+)$/m);
		const title = titleMatch
			? titleMatch[1]
			: path
					.basename(filePath, path.extname(filePath))
					.replace(/-/g, " ")
					.replace(/\b\w/g, (l) => l.toUpperCase());

		// Extract description from frontmatter or first paragraph
		let description = "";
		const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
		if (frontmatterMatch) {
			const descMatch = frontmatterMatch[1].match(/description:\s*(.+)$/m);
			description = descMatch ? descMatch[1].trim() : "";
		}

		if (!description) {
			// Try to get first non-heading paragraph
			const paragraphMatch = content.match(/^(?!#)(?!\s*$)(.+)$/m);
			description = paragraphMatch ? paragraphMatch[1].trim() : "";
		}

		// Determine topics based on content analysis
		const topics = [];
		const pathParts = filePath.split(path.sep);

		// Add path-based topics
		if (filePath.includes("test")) topics.push("Testing");
		if (filePath.includes("api")) topics.push("API");
		if (filePath.includes("database") || filePath.includes("schema"))
			topics.push("Database");
		if (filePath.includes("auth")) topics.push("Authentication");
		if (filePath.includes("cicd") || filePath.includes("CI_CD"))
			topics.push("CI/CD");
		if (filePath.includes("docker")) topics.push("Docker");
		if (filePath.includes("security")) topics.push("Security");

		// Extract keywords for search
		const keywords = new Set();
		const words = (title + " " + description)
			.toLowerCase()
			.replace(/[^a-z0-9\s]/g, " ")
			.split(/\s+/)
			.filter(
				(word) =>
					word.length > 4 &&
					!["about", "this", "that", "with", "from", "have"].includes(word),
			);

		words.forEach((word) => keywords.add(word));

		// Determine priority
		let priority = "supplementary";
		if (
			filePath.includes("constraints") ||
			filePath.includes("security") ||
			filePath.includes("standards")
		) {
			priority = "essential";
		} else if (
			filePath.includes("overview") ||
			filePath.includes("index") ||
			filePath.includes("architecture")
		) {
			priority = "important";
		}

		// Initialize relationship fields - preserve existing or create empty
		const relatedCommands = existingDoc?.relatedCommands || [];
		const dependencies = existingDoc?.dependencies || [];
		const antiPatterns = existingDoc?.antiPatterns || [];
		const pairings = existingDoc?.pairings || [];

		// If no existing relationships, try to infer some basic ones
		if (!existingDoc) {
			// Infer related commands based on file path and content
			if (filePath.includes("test")) relatedCommands.push("/write-tests");
			if (filePath.includes("debug") || filePath.includes("troubleshoot"))
				relatedCommands.push("/debug-issue");
			if (filePath.includes("feature") || filePath.includes("implementation"))
				relatedCommands.push("/feature", "/do-task");

			// Infer dependencies based on file structure
			if (filePath.includes("implementation") && filePath.includes("auth")) {
				dependencies.push("auth/overview.md");
			}
			if (filePath.includes("troubleshooting")) {
				const basePath = path.dirname(filePath);
				dependencies.push(`${basePath}/overview.md`);
			}

			// Infer anti-patterns
			if (filePath.includes("backend") || filePath.includes("server")) {
				antiPatterns.push("frontend-only", "client-side-only");
			}
			if (filePath.includes("database") || filePath.includes("supabase")) {
				antiPatterns.push("no-database", "static-site");
			}
		}

		return {
			name: title,
			description:
				description.substring(0, 200) || `Documentation for ${title}`,
			lastUpdated: new Date().toISOString().split("T")[0],
			topics: topics.length > 0 ? topics.slice(0, 5) : ["Documentation"],
			priority,
			keywords: Array.from(keywords).slice(0, 10),
			relatedCommands,
			dependencies,
			antiPatterns,
			pairings,
		};
	} catch (error) {
		console.error(
			`⚠️  Could not extract metadata for ${filePath}: ${error.message}`,
		);
		return {
			name: path.basename(filePath, path.extname(filePath)),
			description: "Documentation file",
			lastUpdated: new Date().toISOString().split("T")[0],
			topics: ["Documentation"],
			priority: "supplementary",
			keywords: [],
			relatedCommands: existingDoc?.relatedCommands || [],
			dependencies: existingDoc?.dependencies || [],
			antiPatterns: existingDoc?.antiPatterns || [],
			pairings: existingDoc?.pairings || [],
		};
	}
}

/**
 * Load existing inventory
 */
function loadInventory() {
	try {
		const content = fs.readFileSync(INVENTORY_PATH, "utf-8");
		return JSON.parse(content);
	} catch (error) {
		console.error("⚠️  Could not load inventory, starting fresh");
		return {
			version: "1.1",
			lastUpdated: new Date().toISOString().split("T")[0],
			description:
				"Complete inventory of all context documentation files in .claude/context",
			basePath: ".claude/context",
			categories: {},
			features: ["token-counts", "priority-levels", "keyword-extraction"],
			schema: {
				version: "1.1",
				fields: {
					path: "Relative path from .claude/context/",
					name: "Human-readable document name",
					description: "Brief description of document contents",
					lastUpdated: "Date of last update (YYYY-MM-DD)",
					topics: "Array of main topics covered",
					tokens: "Estimated token count for the document",
					priority: "Priority level: essential | important | supplementary",
					keywords: "Array of extracted keywords for improved matching",
				},
			},
		};
	}
}

/**
 * Main synchronization function
 */
async function syncInventory() {
	console.log("🔄 Starting context inventory synchronization...\n");

	// Load existing inventory
	const inventory = loadInventory();

	// Get all markdown files from context directory
	const contextFiles = getAllMarkdownFiles(CONTEXT_DIR);
	console.log(`📁 Found ${contextFiles.length} files in .claude/context/\n`);

	// Build map of existing files by path
	const existingFiles = new Map();
	for (const [categoryKey, category] of Object.entries(inventory.categories)) {
		for (const doc of category.documents || []) {
			existingFiles.set(doc.path, { category: categoryKey, doc });
		}
	}

	// Track changes
	const added = [];
	const updated = [];
	const removed = [];

	// Process each file in context directory
	for (const filePath of contextFiles) {
		const existing = existingFiles.get(filePath);

		if (existing) {
			// Update existing file - preserve relationship fields
			const tokenCount = getTokenCount(filePath);
			const shouldUpdate = existing.doc.tokens !== tokenCount;

			if (shouldUpdate) {
				// Extract fresh metadata while preserving relationships
				const metadata = extractMetadata(filePath, existing.doc);

				// Update document while preserving manual relationship data
				existing.doc = {
					...existing.doc,
					...metadata,
					tokens: tokenCount,
					// Explicitly preserve relationship fields
					relatedCommands:
						existing.doc.relatedCommands || metadata.relatedCommands || [],
					dependencies:
						existing.doc.dependencies || metadata.dependencies || [],
					antiPatterns:
						existing.doc.antiPatterns || metadata.antiPatterns || [],
					pairings: existing.doc.pairings || metadata.pairings || [],
				};

				updated.push(filePath);
				console.log(`🔄 Updated ${filePath}: ${tokenCount} tokens`);
			}
		} else {
			// Add new file
			console.log(`➕ Adding new file: ${filePath}`);
			const metadata = extractMetadata(filePath, null);
			const tokenCount = getTokenCount(filePath);
			const category = determineCategory(filePath);

			const newDoc = {
				path: filePath,
				...metadata,
				tokens: tokenCount,
			};

			// Ensure category exists
			if (!inventory.categories[category]) {
				inventory.categories[category] = {
					name:
						category.charAt(0).toUpperCase() +
						category.slice(1) +
						" Documentation",
					description: `Documentation for ${category}`,
					documents: [],
				};
			}

			// Add to category
			inventory.categories[category].documents.push(newDoc);
			added.push(filePath);
			console.log(
				`   ✓ Added to category '${category}' with ${tokenCount} tokens\n`,
			);
		}
	}

	// Check for removed files
	for (const [filePath, existing] of existingFiles) {
		if (!contextFiles.includes(filePath)) {
			console.log(`➖ Removing deleted file: ${filePath}`);
			const category = inventory.categories[existing.category];
			if (category?.documents) {
				category.documents = category.documents.filter(
					(doc) => doc.path !== filePath,
				);
				if (category.documents.length === 0) {
					// Remove empty category
					delete inventory.categories[existing.category];
				}
			}
			removed.push(filePath);
		}
	}

	// Sort documents within each category
	for (const category of Object.values(inventory.categories)) {
		if (category.documents) {
			category.documents.sort((a, b) => {
				// Sort by priority first, then alphabetically
				const priorityOrder = { essential: 0, important: 1, supplementary: 2 };
				const aPriority = priorityOrder[a.priority] ?? 2;
				const bPriority = priorityOrder[b.priority] ?? 2;

				if (aPriority !== bPriority) {
					return aPriority - bPriority;
				}
				return a.path.localeCompare(b.path);
			});
		}
	}

	// Update inventory metadata
	inventory.lastUpdated = new Date().toISOString().split("T")[0];
	inventory.version = "1.1";

	// Calculate total tokens
	let totalTokens = 0;
	let totalDocs = 0;
	for (const category of Object.values(inventory.categories)) {
		for (const doc of category.documents || []) {
			totalTokens += doc.tokens || 0;
			totalDocs++;
		}
	}

	// Write updated inventory
	fs.writeFileSync(INVENTORY_PATH, JSON.stringify(inventory, null, "\t"));

	// Print summary
	console.log("\n" + "=".repeat(60));
	console.log("📊 SYNCHRONIZATION SUMMARY");
	console.log("=".repeat(60));
	console.log(`✅ Added:     ${added.length} files`);
	console.log(`🔄 Updated:   ${updated.length} files`);
	console.log(`➖ Removed:   ${removed.length} files`);
	console.log(`📁 Total:     ${totalDocs} files`);
	console.log(`🎯 Tokens:    ${totalTokens.toLocaleString()}`);
	console.log("=".repeat(60));

	// Run biome formatter on the output
	try {
		execSync(`npx biome check --write "${INVENTORY_PATH}"`, {
			stdio: "ignore",
		});
		console.log("\n✨ Formatted inventory with Biome");
	} catch {
		// Ignore formatting errors
	}

	// Rebuild the context graph to stay synchronized
	console.log("\n🔄 Updating context graph...");
	try {
		const graphResult = await rebuildGraph(true); // Run silently
		if (graphResult.success) {
			console.log("✅ Context graph updated successfully");
			if (graphResult.stats?.changes) {
				const { nodesAdded, edgesAdded } = graphResult.stats.changes;
				if (nodesAdded !== 0 || edgesAdded !== 0) {
					console.log(
						`   ${nodesAdded > 0 ? "+" : ""}${nodesAdded} nodes, ${
							edgesAdded > 0 ? "+" : ""
						}${edgesAdded} edges`,
					);
				}
			}
		} else {
			console.warn("⚠️  Context graph update failed:", graphResult.error);
			console.warn("   Run 'node rebuild-context-graph.cjs' manually to fix");
		}
	} catch (error) {
		console.warn("⚠️  Could not update context graph:", error.message);
	}

	console.log("\n✅ Context inventory synchronized successfully!");

	return {
		added: added.length,
		updated: updated.length,
		removed: removed.length,
		total: totalDocs,
		totalTokens,
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
