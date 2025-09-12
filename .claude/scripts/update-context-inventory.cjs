#!/usr/bin/env node

/**
 * Updates context-inventory.json with token counts and optional fields for dynamic loading
 *
 * Usage: node update-context-inventory.cjs
 */

const fs = require("node:fs");
const path = require("node:path");

// Simple token estimation (approximately 4 characters per token)
function estimateTokens(text) {
	return Math.ceil(text.length / 4);
}

// Load the inventory
const inventoryPath = path.join(__dirname, "../data/context-inventory.json");
const inventory = JSON.parse(fs.readFileSync(inventoryPath, "utf8"));

// Base path for context files
const contextBasePath = path.join(__dirname, "../context");

// Update each document with token count
let totalDocuments = 0;
let documentsUpdated = 0;

for (const categoryKey of Object.keys(inventory.categories)) {
	const category = inventory.categories[categoryKey];

	for (const doc of category.documents) {
		totalDocuments++;

		// Build full path
		const fullPath = path.join(contextBasePath, doc.path);

		try {
			// Read file and estimate tokens
			if (fs.existsSync(fullPath)) {
				const content = fs.readFileSync(fullPath, "utf8");
				const tokens = estimateTokens(content);

				// Add token count
				doc.tokens = tokens;

				// Add optional priority (essential docs get higher priority)
				if (
					doc.path.includes("constraints") ||
					doc.path.includes("standards") ||
					doc.path.includes("security")
				) {
					doc.priority = "essential";
				} else if (
					doc.path.includes("overview") ||
					doc.path.includes("index")
				) {
					doc.priority = "important";
				} else {
					doc.priority = "supplementary";
				}

				// Extract keywords from topics and description
				const keywords = new Set();

				// Add words from topics
				if (doc.topics) {
					doc.topics.forEach((topic) => {
						topic
							.toLowerCase()
							.split(/\s+/)
							.forEach((word) => {
								if (word.length > 3) keywords.add(word);
							});
					});
				}

				// Add significant words from description
				doc.description
					.toLowerCase()
					.split(/\s+/)
					.forEach((word) => {
						if (
							word.length > 4 &&
							!["including", "documentation", "provides", "defines"].includes(
								word,
							)
						) {
							keywords.add(word);
						}
					});

				// Add keywords array if we found any
				if (keywords.size > 0) {
					doc.keywords = Array.from(keywords).slice(0, 10); // Limit to 10 keywords
				}

				documentsUpdated++;
				console.log(
					`✅ Updated ${doc.path}: ${tokens} tokens, priority: ${doc.priority}`,
				);
			} else {
				console.log(`⚠️  File not found: ${fullPath}`);
				// Add default values for missing files
				doc.tokens = 0;
				doc.priority = "supplementary";
			}
		} catch (error) {
			console.error(`❌ Error processing ${doc.path}:`, error.message);
			// Add default values on error
			doc.tokens = 0;
			doc.priority = "supplementary";
		}
	}
}

// Update metadata
inventory.version = "1.1";
inventory.lastUpdated = new Date().toISOString().split("T")[0];
inventory.features = inventory.features || [];
if (!inventory.features.includes("token-counts")) {
	inventory.features.push("token-counts");
}
if (!inventory.features.includes("priority-levels")) {
	inventory.features.push("priority-levels");
}
if (!inventory.features.includes("keyword-extraction")) {
	inventory.features.push("keyword-extraction");
}

// Add schema information
inventory.schema = {
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
};

// Write updated inventory
fs.writeFileSync(inventoryPath, JSON.stringify(inventory, null, "\t"), "utf8");

console.log("\n📊 Summary:");
console.log(`   Total documents: ${totalDocuments}`);
console.log(`   Documents updated: ${documentsUpdated}`);
console.log(`   Inventory version: ${inventory.version}`);
console.log(`   New features: ${inventory.features.join(", ")}`);
console.log("\n✅ Context inventory updated successfully!");
