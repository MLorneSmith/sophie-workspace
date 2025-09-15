#!/usr/bin/env node

/**
 * Context Graph Manager using graph-data-structure
 *
 * Manages document relationships and provides second-order relevance
 * through graph traversal and learning mechanisms.
 */

const gds = require("graph-data-structure");
const Graph = gds.Graph;
const fs = require("node:fs");
const path = require("node:path");

const PROJECT_ROOT = path.join(__dirname, "..");
const INVENTORY_PATH = path.join(
	PROJECT_ROOT,
	"data",
	"context-inventory.json",
);
const GRAPH_DATA_PATH = path.join(PROJECT_ROOT, "data", "context-graph.json");
const LEARNING_PATH = path.join(PROJECT_ROOT, "data", "context-learning.json");

class ContextGraphManager {
	constructor(dataPath = GRAPH_DATA_PATH) {
		this.dataPath = dataPath;
		this.graph = new Graph();
		this.metadata = new Map(); // Store document metadata
		this.commandRelations = new Map(); // Store command-document relations
		this.learningData = new Map(); // Store usage and learning metrics
		this.initialized = false;
	}

	/**
	 * Initialize the graph manager
	 */
	async initialize() {
		try {
			// Create data directory if it doesn't exist
			const dataDir = path.dirname(this.dataPath);
			if (!fs.existsSync(dataDir)) {
				fs.mkdirSync(dataDir, { recursive: true });
			}

			// Load existing graph data if available
			if (fs.existsSync(this.dataPath)) {
				this.loadFromFile();
			}

			// Load learning data if available
			if (fs.existsSync(LEARNING_PATH)) {
				this.loadLearningData();
			}

			this.initialized = true;
			console.log("✅ Graph manager initialized");

			return true;
		} catch (error) {
			console.error("❌ Failed to initialize graph manager:", error);
			return false;
		}
	}

	/**
	 * Load graph from JSON file
	 */
	loadFromFile() {
		try {
			const data = JSON.parse(fs.readFileSync(this.dataPath, "utf-8"));

			// Recreate graph from serialized data
			if (data.nodes && data.edges) {
				// Add nodes
				for (const node of data.nodes) {
					this.graph.addNode(node);
				}

				// Add edges
				for (const edge of data.edges) {
					this.graph.addEdge(edge.from, edge.to);
				}
			}

			// Load metadata
			if (data.metadata) {
				this.metadata = new Map(Object.entries(data.metadata));
			}

			// Load command relations
			if (data.commandRelations) {
				this.commandRelations = new Map(Object.entries(data.commandRelations));
			}

			console.log(`✅ Loaded graph with ${data.nodes?.length || 0} nodes`);
		} catch (error) {
			console.error("Failed to load graph from file:", error);
		}
	}

	/**
	 * Save graph to JSON file
	 */
	saveToFile() {
		try {
			const data = {
				nodes: Array.from(this.graph.nodes),
				edges: this.getAllEdges(),
				metadata: Object.fromEntries(this.metadata),
				commandRelations: Object.fromEntries(this.commandRelations),
				lastUpdated: new Date().toISOString(),
			};

			fs.writeFileSync(this.dataPath, JSON.stringify(data, null, 2));
			console.log("✅ Graph saved to file");
		} catch (error) {
			console.error("Failed to save graph:", error);
		}
	}

	/**
	 * Get all edges from the graph
	 */
	getAllEdges() {
		const edges = [];
		for (const node of this.graph.nodes) {
			for (const adjacent of this.graph.adjacent(node)) {
				edges.push({ from: node, to: adjacent });
			}
		}
		return edges;
	}

	/**
	 * Load learning data
	 */
	loadLearningData() {
		try {
			const data = JSON.parse(fs.readFileSync(LEARNING_PATH, "utf-8"));
			this.learningData = new Map(Object.entries(data));
		} catch (error) {
			// Learning data might not exist yet
		}
	}

	/**
	 * Save learning data
	 */
	saveLearningData() {
		try {
			const data = Object.fromEntries(this.learningData);
			fs.writeFileSync(LEARNING_PATH, JSON.stringify(data, null, 2));
		} catch (error) {
			console.error("Failed to save learning data:", error);
		}
	}

	/**
	 * Build graph from context inventory
	 */
	async buildFromInventory() {
		try {
			const inventory = JSON.parse(fs.readFileSync(INVENTORY_PATH, "utf-8"));
			let docCount = 0;
			let relCount = 0;

			// Clear existing graph
			this.graph = new Graph();
			this.metadata.clear();
			this.commandRelations.clear();

			// First pass: Create all document nodes and store metadata
			for (const [categoryKey, category] of Object.entries(
				inventory.categories,
			)) {
				for (const doc of category.documents || []) {
					this.graph.addNode(doc.path);

					// Store document metadata
					this.metadata.set(doc.path, {
						name: doc.name,
						category: categoryKey,
						priority: doc.priority || "supplementary",
						tokens: doc.tokens || 0,
						keywords: doc.keywords || [],
						topics: doc.topics || [],
					});

					docCount++;
				}
			}

			// Second pass: Create relationships
			for (const category of Object.values(inventory.categories)) {
				for (const doc of category.documents || []) {
					// Add command relationships
					if (doc.relatedCommands?.length > 0) {
						for (const cmd of doc.relatedCommands) {
							this.addCommandRelation(doc.path, cmd);
							relCount++;
						}
					}

					// Add dependencies
					if (doc.dependencies?.length > 0) {
						for (const dep of doc.dependencies) {
							// Only add edge if both nodes exist
							if (this.graph.nodes.has(dep)) {
								this.graph.addEdge(doc.path, dep);
								relCount++;
							}
						}
					}

					// Add pairings (bidirectional)
					if (doc.pairings?.length > 0) {
						for (const pair of doc.pairings) {
							if (this.graph.nodes.has(pair)) {
								// Add both directions for pairings
								this.graph.addEdge(doc.path, pair);
								this.graph.addEdge(pair, doc.path);
								relCount += 2;
							}
						}
					}

					// Store anti-patterns in metadata
					if (doc.antiPatterns?.length > 0) {
						const meta = this.metadata.get(doc.path);
						if (meta) {
							meta.antiPatterns = doc.antiPatterns;
						}
					}
				}
			}

			// Save the built graph
			this.saveToFile();

			console.log(
				`✅ Built graph: ${docCount} documents, ${relCount} relationships`,
			);
			return { documents: docCount, relationships: relCount };
		} catch (error) {
			console.error("❌ Failed to build graph:", error);
			throw error;
		}
	}

	/**
	 * Add command relationship
	 */
	addCommandRelation(docPath, commandName) {
		if (!this.commandRelations.has(commandName)) {
			this.commandRelations.set(commandName, []);
		}
		const docs = this.commandRelations.get(commandName);
		if (!docs.includes(docPath)) {
			docs.push(docPath);
		}
	}

	/**
	 * Find related documents using graph traversal
	 */
	async findRelatedDocuments(docPath, maxDepth = 2) {
		try {
			// Check if document exists in graph
			if (!this.graph.nodes.has(docPath)) {
				return {
					direct: { dependencies: [], pairings: [] },
					secondOrder: { dependencies: [], pairings: [] },
				};
			}

			// Get direct neighbors (dependencies)
			const directDeps = Array.from(this.graph.adjacent(docPath) || []);

			// Get nodes that point to this document (reverse dependencies/pairings)
			const directPairs = [];
			for (const node of Array.from(this.graph.nodes)) {
				if (this.graph.adjacent(node).has(docPath)) {
					directPairs.push(node);
				}
			}

			// Get second-order relationships if needed
			const secondOrderDeps = [];
			const secondOrderPairs = [];

			if (maxDepth > 1) {
				// Second-order dependencies (dependencies of dependencies)
				for (const dep of directDeps) {
					const depDeps = Array.from(this.graph.adjacent(dep) || []);
					for (const secondDep of depDeps) {
						if (secondDep !== docPath && !directDeps.includes(secondDep)) {
							secondOrderDeps.push(secondDep);
						}
					}
				}

				// Second-order pairings
				for (const pair of directPairs) {
					const pairNeighbors = Array.from(this.graph.adjacent(pair) || []);
					for (const secondPair of pairNeighbors) {
						if (secondPair !== docPath && !directPairs.includes(secondPair)) {
							secondOrderPairs.push(secondPair);
						}
					}
				}
			}

			return {
				direct: {
					dependencies: [...new Set(directDeps)],
					pairings: [...new Set(directPairs)],
				},
				secondOrder: {
					dependencies: [...new Set(secondOrderDeps)],
					pairings: [...new Set(secondOrderPairs)],
				},
			};
		} catch (error) {
			console.error("Failed to find related documents:", error);
			return {
				direct: { dependencies: [], pairings: [] },
				secondOrder: { dependencies: [], pairings: [] },
			};
		}
	}

	/**
	 * Get documents used by a command
	 */
	async getDocumentsForCommand(commandName) {
		const docs = this.commandRelations.get(commandName) || [];
		return docs.map((path) => {
			const meta = this.metadata.get(path);
			return {
				path,
				priority: meta?.priority || "supplementary",
			};
		});
	}

	/**
	 * Update learning metrics based on usage
	 */
	async updateUsageMetrics(docPath, wasUseful = true) {
		try {
			// Initialize learning data for document if not exists
			if (!this.learningData.has(docPath)) {
				this.learningData.set(docPath, {
					usageCount: 0,
					successRate: 0.5,
				});
			}

			const data = this.learningData.get(docPath);
			data.usageCount++;

			// Update success rate using exponential moving average
			const alpha = 0.1; // Learning rate
			data.successRate =
				data.successRate * (1 - alpha) + (wasUseful ? 1 : 0) * alpha;

			this.saveLearningData();
		} catch (error) {
			console.error("Failed to update usage metrics:", error);
		}
	}

	/**
	 * Strengthen or weaken a relationship based on usage
	 */
	async adjustRelationshipStrength(fromPath, toPath, increase = true) {
		// For graph-data-structure, we track this in learning data
		const key = `${fromPath}->${toPath}`;

		if (!this.learningData.has(key)) {
			this.learningData.set(key, { strength: 1.0 });
		}

		const data = this.learningData.get(key);
		const delta = increase ? 0.1 : -0.1;
		data.strength = Math.max(0, Math.min(2, data.strength + delta));

		this.saveLearningData();
	}

	/**
	 * Get graph statistics
	 */
	async getStatistics() {
		try {
			const stats = {
				documents: Array.from(this.graph.nodes).length,
				commands: this.commandRelations.size,
				relationships: {
					total: 0,
					dependencies: 0,
					pairings: 0,
				},
				mostConnected: [],
			};

			// Count edges and find most connected nodes
			const connectionCount = new Map();

			for (const node of Array.from(this.graph.nodes)) {
				const adjacent = Array.from(this.graph.adjacent(node) || []);
				const incomingCount = Array.from(this.graph.nodes).filter((n) =>
					this.graph.adjacent(n).has(node),
				).length;

				const totalConnections = adjacent.length + incomingCount;
				connectionCount.set(node, totalConnections);
				stats.relationships.total += adjacent.length;
			}

			// Get top 5 most connected documents
			const sorted = Array.from(connectionCount.entries())
				.sort((a, b) => b[1] - a[1])
				.slice(0, 5);

			stats.mostConnected = sorted.map(([path, connections]) => ({
				path,
				connections,
			}));

			return stats;
		} catch (error) {
			console.error("Failed to get statistics:", error);
			return null;
		}
	}

	/**
	 * Export graph for visualization
	 */
	async exportForVisualization() {
		try {
			const nodes = Array.from(this.graph.nodes).map((node) => {
				const meta = this.metadata.get(node) || {};
				return {
					id: node,
					label: meta.name || node,
					group: meta.category || "unknown",
				};
			});

			const edges = [];
			for (const from of Array.from(this.graph.nodes)) {
				for (const to of this.graph.adjacent(from)) {
					const learningKey = `${from}->${to}`;
					const strength = this.learningData.get(learningKey)?.strength || 1.0;
					edges.push({
						source: from,
						target: to,
						weight: strength,
					});
				}
			}

			return { nodes, edges };
		} catch (error) {
			console.error("Failed to export graph:", error);
			return { nodes: [], edges: [] };
		}
	}

	/**
	 * Get topological sort for dependency resolution
	 */
	getLoadingOrder() {
		try {
			return this.graph.topologicalSort();
		} catch (error) {
			// Graph might have cycles
			console.warn("Graph has cycles, returning unsorted nodes");
			return Array.from(this.graph.nodes);
		}
	}
}

// Main execution when run directly
async function main() {
	const manager = new ContextGraphManager();

	console.log("🚀 Initializing Context Graph Manager...\n");

	// Initialize manager
	await manager.initialize();

	// Build from inventory
	console.log("\n📊 Building graph from inventory...");
	await manager.buildFromInventory();

	// Show statistics
	console.log("\n📈 Graph Statistics:");
	const stats = await manager.getStatistics();
	if (stats) {
		console.log(`  Documents: ${stats.documents}`);
		console.log(`  Commands: ${stats.commands}`);
		console.log(`  Total Relationships: ${stats.relationships.total}`);
		console.log("\n  Most Connected Documents:");
		for (const doc of stats.mostConnected || []) {
			console.log(`    ${doc.path}: ${doc.connections} connections`);
		}
	}

	// Test traversal
	console.log("\n🔍 Testing graph traversal:");
	const testDoc = "auth/overview.md";
	const related = await manager.findRelatedDocuments(testDoc, 2);
	console.log(`  Related to ${testDoc}:`);
	console.log(`    Direct dependencies: ${related.direct.dependencies.length}`);
	console.log(`    Direct pairings: ${related.direct.pairings.length}`);
	console.log(
		`    Second-order deps: ${related.secondOrder.dependencies.length}`,
	);
	console.log(`    Second-order pairs: ${related.secondOrder.pairings.length}`);
}

// Export for use as module
module.exports = ContextGraphManager;

// Run if executed directly
if (require.main === module) {
	main().catch(console.error);
}
