#!/usr/bin/env node

/**
 * Rebuild Context Graph from Inventory
 *
 * This script rebuilds the context graph database from the context inventory.
 * It can be run standalone or called from other scripts like sync-context-inventory.cjs
 * to ensure the graph stays synchronized with inventory changes.
 */

const path = require("node:path");
const fs = require("node:fs");

// Import the graph manager
const ContextGraphManager = require("../context-graph.cjs");

const PROJECT_ROOT = path.join(__dirname, "..", "..", "..");
const INVENTORY_PATH = path.join(
	PROJECT_ROOT,
	".claude",
	"data",
	"context-inventory.json",
);
const GRAPH_PATH = path.join(
	PROJECT_ROOT,
	".claude",
	"data",
	"context-graph.json",
);

/**
 * Rebuild the context graph from inventory
 * @param {boolean} silent - If true, suppress console output
 * @returns {Promise<{success: boolean, stats?: object, error?: string}>}
 */
async function rebuildGraph(silent = false) {
	const log = silent ? () => {} : console.log;
	const error = silent ? () => {} : console.error;

	try {
		// Check if inventory exists
		if (!fs.existsSync(INVENTORY_PATH)) {
			error("❌ Context inventory not found. Run sync-context-inventory.cjs first.");
			return { success: false, error: "Inventory not found" };
		}

		log("🔄 Rebuilding context graph from inventory...\n");

		// Initialize graph manager
		const graphManager = new ContextGraphManager(GRAPH_PATH);
		await graphManager.initialize();

		// Get current stats before rebuild
		const beforeStats = await graphManager.getStatistics();
		const beforeRelCount = beforeStats?.relationships?.total || 0;
		log(`📊 Current graph: ${beforeStats.documents || 0} nodes, ${beforeRelCount} edges`);

		// Rebuild from inventory
		const result = await graphManager.buildFromInventory();

		// Get new stats
		const afterStats = await graphManager.getStatistics();
		const afterRelCount = afterStats?.relationships?.total || 0;

		// Calculate changes
		const changes = {
			nodesAdded: afterStats.documents - (beforeStats.documents || 0),
			edgesAdded: afterRelCount - beforeRelCount,
		};

		log(`\n✅ Graph rebuilt successfully!`);
		log(`📊 New graph: ${afterStats.documents} nodes, ${afterRelCount} edges`);
		if (afterStats.commands > 0) {
			log(`📌 Command relationships: ${afterStats.commands} commands linked to documents`);
		}

		if (changes.nodesAdded !== 0 || changes.edgesAdded !== 0) {
			log(`\n📈 Changes:`);
			if (changes.nodesAdded > 0) {
				log(`  ➕ ${changes.nodesAdded} nodes added`);
			} else if (changes.nodesAdded < 0) {
				log(`  ➖ ${Math.abs(changes.nodesAdded)} nodes removed`);
			}
			if (changes.edgesAdded > 0) {
				log(`  ➕ ${changes.edgesAdded} edges added`);
			} else if (changes.edgesAdded < 0) {
				log(`  ➖ ${Math.abs(changes.edgesAdded)} edges removed`);
			}
		} else {
			log(`\n✨ No changes needed - graph was already up to date`);
		}

		// Verify file was written
		if (fs.existsSync(GRAPH_PATH)) {
			const stats = fs.statSync(GRAPH_PATH);
			log(`\n📁 Graph saved: ${GRAPH_PATH}`);
			log(`   Size: ${(stats.size / 1024).toFixed(1)} KB`);
			log(`   Updated: ${stats.mtime.toISOString()}`);
		}

		return {
			success: true,
			stats: {
				before: beforeStats,
				after: afterStats,
				changes: changes
			}
		};

	} catch (err) {
		error(`\n❌ Failed to rebuild graph: ${err.message}`);
		return { success: false, error: err.message };
	}
}

/**
 * Main function when run as standalone script
 */
async function main() {
	const args = process.argv.slice(2);
	const silent = args.includes("--silent");
	const help = args.includes("--help") || args.includes("-h");

	if (help) {
		console.log(`
Context Graph Rebuilder
=======================

Rebuilds the context graph database from the context inventory.

Usage:
  node rebuild-context-graph.cjs [options]

Options:
  --silent    Suppress console output
  --help, -h  Show this help message

Examples:
  # Rebuild with output
  node rebuild-context-graph.cjs

  # Rebuild silently (for use in other scripts)
  node rebuild-context-graph.cjs --silent

This script is automatically called by sync-context-inventory.cjs
to keep the graph synchronized with inventory changes.
`);
		process.exit(0);
	}

	const result = await rebuildGraph(silent);
	process.exit(result.success ? 0 : 1);
}

// Export for use by other scripts
module.exports = { rebuildGraph };

// Run if called directly
if (require.main === module) {
	main().catch((err) => {
		console.error("Fatal error:", err);
		process.exit(1);
	});
}