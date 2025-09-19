#!/usr/bin/env node

/**
 * Adjust category assignments in context inventory
 * Usage: node adjust-inventory-category.cjs <file-path> <new-category>
 * Example: node adjust-inventory-category.cjs "systems/test.md" "testing"
 */

const fs = require("node:fs");
const path = require("node:path");

const INVENTORY_PATH = path.join(
	__dirname,
	"..",
	"data",
	"context-inventory.json",
);

function moveFileToCategory(filePath, newCategory) {
	try {
		// Load inventory
		const inventory = JSON.parse(fs.readFileSync(INVENTORY_PATH, "utf-8"));

		// Find the file in current categories
		let fileDoc = null;
		let currentCategory = null;

		for (const [catKey, category] of Object.entries(inventory.categories)) {
			const docIndex = (category.documents || []).findIndex(
				(doc) => doc.path === filePath,
			);
			if (docIndex !== -1) {
				fileDoc = category.documents[docIndex];
				currentCategory = catKey;
				// Remove from current category
				category.documents.splice(docIndex, 1);
				// Remove empty category
				if (category.documents.length === 0) {
					delete inventory.categories[catKey];
				}
				break;
			}
		}

		if (!fileDoc) {
			console.error(`❌ File not found in inventory: ${filePath}`);
			return false;
		}

		if (currentCategory === newCategory) {
			console.log(`ℹ️  File is already in category: ${newCategory}`);
			return true;
		}

		// Create new category if it doesn't exist
		if (!inventory.categories[newCategory]) {
			inventory.categories[newCategory] = {
				name:
					newCategory.charAt(0).toUpperCase() +
					newCategory.slice(1) +
					" Documentation",
				description: `Documentation for ${newCategory}`,
				documents: [],
			};
		}

		// Add to new category
		inventory.categories[newCategory].documents.push(fileDoc);

		// Sort documents in new category
		inventory.categories[newCategory].documents.sort((a, b) => {
			const priorityOrder = { essential: 0, important: 1, supplementary: 2 };
			const aPriority = priorityOrder[a.priority] ?? 2;
			const bPriority = priorityOrder[b.priority] ?? 2;

			if (aPriority !== bPriority) {
				return aPriority - bPriority;
			}
			return a.path.localeCompare(b.path);
		});

		// Save updated inventory
		fs.writeFileSync(INVENTORY_PATH, JSON.stringify(inventory, null, "\t"));

		console.log(
			`✅ Moved "${filePath}" from "${currentCategory}" to "${newCategory}"`,
		);
		return true;
	} catch (error) {
		console.error(`❌ Error adjusting category: ${error.message}`);
		return false;
	}
}

// CLI usage
if (require.main === module) {
	const [filePath, newCategory] = process.argv.slice(2);

	if (!filePath || !newCategory) {
		console.log(
			"Usage: node adjust-inventory-category.cjs <file-path> <new-category>",
		);
		console.log(
			'Example: node adjust-inventory-category.cjs "systems/test.md" "testing"',
		);
		console.log("\nAvailable categories:");
		console.log("  core, design, roles, standards, systems, architecture,");
		console.log("  tools, workflow, rules, guides, agents, technical");
		process.exit(1);
	}

	const success = moveFileToCategory(filePath, newCategory);
	process.exit(success ? 0 : 1);
}

module.exports = { moveFileToCategory };
