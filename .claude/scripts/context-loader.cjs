#!/usr/bin/env node

/**
 * Dynamic Context Loading System
 *
 * Intelligently selects relevant documentation based on task requirements.
 * Separates command-critical "essential docs" from query-specific "relevant docs".
 *
 * Usage:
 *   node context-loader.js --command="debug-issue" --query="database error" --max-results=3
 *   node context-loader.js --command="test" --query="unit testing hooks" --token-budget=4000
 *
 * @author Claude Code Assistant
 * @version 1.0.0
 */

const fs = require("node:fs").promises;
const path = require("node:path");
// Fuse will be loaded dynamically to support ESM

class ContextLoader {
	constructor(inventoryPath = ".claude/data/context-inventory.json") {
		this.inventoryPath = inventoryPath;
		this.inventory = null;
		this.cache = new Map();
		this.fuseCache = new Map();
		this.commandWeights = this.getCommandWeights();
		this.Fuse = null; // Will be loaded dynamically
	}

	/**
	 * Initialize the context loader by loading the inventory
	 */
	async initialize() {
		try {
			// Dynamically import fuse.js (ESM module)
			const fuseModule = await import("fuse.js");
			this.Fuse = fuseModule.default;

			const data = await fs.readFile(this.inventoryPath, "utf8");
			this.inventory = JSON.parse(data);
			this.initializeFuseInstances();
		} catch (error) {
			console.error(`Error loading inventory: ${error.message}`);
			throw error;
		}
	}

	/**
	 * Initialize Fuse.js instances for intelligent fuzzy searching
	 */
	initializeFuseInstances() {
		// Create a combined list of all documents with category info
		const allDocuments = [];

		for (const [categoryName, category] of Object.entries(
			this.inventory.categories,
		)) {
			for (const doc of category.documents) {
				allDocuments.push({
					...doc,
					category: categoryName,
					// Combine all searchable text fields for better matching
					searchableContent: [
						doc.name,
						doc.description,
						...(doc.topics || []),
						...(doc.keywords || []),
					]
						.join(" ")
						.toLowerCase(),
				});
			}
		}

		// Add database documents if present
		if (this.inventory.database?.documents) {
			for (const doc of this.inventory.database.documents) {
				allDocuments.push({
					...doc,
					category: "database",
					searchableContent: [
						doc.name,
						doc.description,
						...(doc.topics || []),
						...(doc.keywords || []),
					]
						.join(" ")
						.toLowerCase(),
				});
			}
		}

		// Configure Fuse with weighted fields for optimal document matching
		const fuseOptions = {
			keys: [
				{ name: "keywords", weight: 0.35 }, // Highest weight for keywords
				{ name: "topics", weight: 0.3 }, // High weight for topics
				{ name: "name", weight: 0.2 }, // Medium weight for document name
				{ name: "description", weight: 0.15 }, // Lower weight for description
			],
			threshold: 0.4, // Fuzzy matching threshold (0 = perfect match, 1 = match anything)
			includeScore: true,
			useExtendedSearch: true, // Enable logical operators
			ignoreLocation: true, // Search anywhere in the text
			minMatchCharLength: 2, // Minimum character length to match
			shouldSort: true,
			findAllMatches: false,
			// Configure fuzzy matching parameters
			distance: 100, // Maximum distance for fuzzy matches
			maxPatternLength: 32,
		};

		// Create global Fuse instance
		this.globalFuse = new this.Fuse(allDocuments, fuseOptions);

		// Create category-specific Fuse instances for targeted searches
		this.categoryFuses = {};
		for (const [categoryName, category] of Object.entries(
			this.inventory.categories,
		)) {
			if (category.documents && category.documents.length > 0) {
				this.categoryFuses[categoryName] = new this.Fuse(
					category.documents.map((doc) => ({
						...doc,
						category: categoryName,
					})),
					fuseOptions,
				);
			}
		}

		// Add database category if present
		if (
			this.inventory.database?.documents &&
			this.inventory.database.documents.length > 0
		) {
			this.categoryFuses.database = new this.Fuse(
				this.inventory.database.documents.map((doc) => ({
					...doc,
					category: "database",
				})),
				fuseOptions,
			);
		}
	}

	/**
	 * Command-specific weight profiles for relevance scoring
	 */
	getCommandWeights() {
		return {
			"debug-issue": {
				topic: 0.5, // Topics are critical for debugging
				text: 0.3, // Specific error keywords matter
				category: 0.1, // Category less important
				recency: 0.1, // Recent changes might be relevant
			},
			test: {
				topic: 0.3,
				text: 0.4, // Test-specific keywords crucial
				category: 0.2, // Testing category highly relevant
				recency: 0.1,
			},
			feature: {
				topic: 0.4,
				text: 0.2,
				category: 0.3, // Architecture/design categories important
				recency: 0.1,
			},
			performance: {
				topic: 0.3,
				text: 0.3,
				category: 0.3,
				recency: 0.1,
			},
			refactor: {
				topic: 0.3,
				text: 0.2,
				category: 0.4,
				recency: 0.1,
			},
			default: {
				topic: 0.4,
				text: 0.3,
				category: 0.2,
				recency: 0.1,
			},
		};
	}

	/**
	 * Extract keywords from a query string
	 */
	extractKeywords(query) {
		if (!query) return [];

		// Convert to lowercase and split by word boundaries
		const words = query
			.toLowerCase()
			.split(/\W+/)
			.filter((w) => w.length > 2);

		// Filter out common stop words
		const stopWords = new Set([
			"the",
			"and",
			"for",
			"with",
			"from",
			"not",
			"but",
			"are",
			"was",
			"has",
			"had",
			"been",
		]);

		return words.filter((w) => !stopWords.has(w));
	}

	/**
	 * Calculate topic overlap score between document topics and query keywords
	 */
	calculateTopicOverlap(documentTopics = [], queryKeywords = []) {
		if (!documentTopics.length || !queryKeywords.length) return 0;

		const docTopicsLower = documentTopics.map((t) => t.toLowerCase());
		let matches = 0;
		let partialMatches = 0;

		for (const keyword of queryKeywords) {
			for (const topic of docTopicsLower) {
				if (topic.includes(keyword)) {
					if (topic === keyword) {
						matches += 1;
					} else {
						partialMatches += 0.5;
					}
				}
			}
		}

		const totalScore = matches + partialMatches;
		const maxPossible = Math.max(queryKeywords.length, documentTopics.length);

		return Math.min(totalScore / maxPossible, 1.0);
	}

	/**
	 * Calculate text match score for document name and description
	 */
	calculateTextMatch(document, queryKeywords) {
		if (!queryKeywords.length) return 0;

		const searchText = `${document.name} ${document.description}`.toLowerCase();
		let matches = 0;

		for (const keyword of queryKeywords) {
			if (searchText.includes(keyword)) {
				matches += 1;
			}
		}

		return Math.min(matches / queryKeywords.length, 1.0);
	}

	/**
	 * Get category relevance score based on command context
	 */
	getCategoryRelevance(category, commandType) {
		const categoryPreferences = {
			"debug-issue": {
				roles: 0.9, // Debug roles very relevant
				architecture: 0.7,
				standards: 0.6,
				systems: 0.5,
				core: 0.8,
				tools: 0.4,
				design: 0.3,
			},
			test: {
				standards: 0.9, // Testing standards crucial
				tools: 0.8, // Testing tools important
				architecture: 0.5,
				roles: 0.4,
				systems: 0.3,
				core: 0.6,
				design: 0.2,
			},
			feature: {
				architecture: 0.9,
				core: 0.8,
				design: 0.7,
				standards: 0.6,
				systems: 0.5,
				roles: 0.4,
				tools: 0.3,
			},
			performance: {
				systems: 0.9,
				architecture: 0.8,
				tools: 0.7,
				standards: 0.6,
				core: 0.5,
				roles: 0.3,
				design: 0.2,
			},
		};

		const prefs = categoryPreferences[commandType] || {};
		return prefs[category] || 0.5;
	}

	/**
	 * Calculate recency score based on last updated date
	 */
	calculateRecencyScore(lastUpdated) {
		if (!lastUpdated) return 0.5;

		const now = new Date();
		const updated = new Date(lastUpdated);
		const daysDiff =
			(now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24);

		if (daysDiff < 7) return 1.0; // Very recent
		if (daysDiff < 30) return 0.8; // Recent
		if (daysDiff < 90) return 0.6; // Somewhat recent
		if (daysDiff < 180) return 0.4; // Older
		return 0.2; // Very old
	}

	/**
	 * Perform Fuse.js search with enhanced query processing
	 */
	performFuseSearch(query, _commandType = "default") {
		// Process query for better Fuse.js matching
		const processedQuery = this.processQueryForFuse(query);

		// Perform global search
		const fuseResults = this.globalFuse.search(processedQuery);

		// Map Fuse results with additional scoring
		return fuseResults.map((result) => ({
			...result.item,
			fuseScore: 1 - (result.score || 0), // Convert Fuse score (0 = perfect) to our scale (1 = perfect)
			refIndex: result.refIndex,
		}));
	}

	/**
	 * Process query for optimal Fuse.js matching
	 */
	processQueryForFuse(query) {
		// Check if query contains logical operators
		if (query.includes("'") || query.includes("|") || query.includes("!")) {
			// User is using extended search syntax, return as-is
			return query;
		}

		// Extract important keywords
		const keywords = this.extractKeywords(query);

		// Build Fuse.js extended search query
		// Use fuzzy matching for each keyword to handle typos
		if (keywords.length === 0) {
			return query;
		}

		// Create an OR query with all keywords for broad matching
		// Each keyword is wrapped for fuzzy matching
		return keywords.map((keyword) => keyword).join(" ");
	}

	/**
	 * Calculate relevance score for a document (enhanced with Fuse score)
	 */
	calculateRelevanceScore(
		document,
		queryKeywords,
		commandType,
		category,
		fuseScore = null,
	) {
		const weights =
			this.commandWeights[commandType] || this.commandWeights.default;

		// If we have a Fuse score, use it as the primary text/topic score
		let topicScore, textScore;

		if (fuseScore !== null) {
			// Fuse already handles topic and text matching with fuzzy logic
			// Split the Fuse score between topic and text based on weights
			const combinedFuseWeight = weights.topic + weights.text;
			topicScore = fuseScore * (weights.topic / combinedFuseWeight);
			textScore = fuseScore * (weights.text / combinedFuseWeight);
		} else {
			// Fallback to original scoring if no Fuse score
			topicScore = this.calculateTopicOverlap(document.topics, queryKeywords);
			textScore = this.calculateTextMatch(document, queryKeywords);
		}

		const categoryScore = this.getCategoryRelevance(category, commandType);
		const recencyScore = this.calculateRecencyScore(document.lastUpdated);

		// Apply weights and calculate final score
		const relevanceScore =
			weights.topic * topicScore +
			weights.text * textScore +
			weights.category * categoryScore +
			weights.recency * recencyScore;

		return {
			relevance: relevanceScore,
			topicScore,
			textScore,
			categoryScore,
			recencyScore,
			fuseScore: fuseScore || 0,
		};
	}

	/**
	 * Calculate importance score for ranking
	 */
	calculateImportanceScore(document, category) {
		// Core category documents get priority
		const categoryPriority = category === "core" ? 2.0 : 1.0;

		// Recency factor
		const recencyScore = this.calculateRecencyScore(document.lastUpdated);

		// Comprehensive topics indicate thorough documentation
		const topicDepth = Math.min((document.topics?.length || 0) / 5, 1.0);

		return categoryPriority * (recencyScore * 0.3 + topicDepth * 0.7);
	}

	/**
	 * Estimate token count for a document (simple heuristic)
	 */
	estimateTokens(document) {
		// If tokens field exists, use it
		if (document.tokens) return document.tokens;

		// Otherwise estimate based on typical doc size
		// This is a rough estimate: assume average doc is 1000-3000 tokens
		const hasLongTopics = (document.topics?.length || 0) > 5;
		const isCore =
			document.path?.includes("core") ||
			document.path?.includes("architecture");

		if (isCore || hasLongTopics) return 2500;
		return 1500;
	}

	/**
	 * Process rich command metadata to enhance relevance scoring
	 */
	processCommandMetadata(metadata) {
		if (!metadata) return null;

		const enhancedSignals = {
			agents: [],
			technologies: [],
			phases: [],
			fileTypes: [],
			contextFiles: []
		};

		// Extract agent specialists
		if (metadata.agents?.specialists) {
			enhancedSignals.agents = metadata.agents.specialists;
		}
		if (metadata.tools?.task) {
			enhancedSignals.agents.push(...metadata.tools.task);
		}

		// Extract technologies and frameworks
		if (metadata.codePatterns?.technologies) {
			enhancedSignals.technologies = metadata.codePatterns.technologies;
		}
		if (metadata.codePatterns?.frameworks) {
			enhancedSignals.technologies.push(...metadata.codePatterns.frameworks);
		}

		// Extract active workflow phases
		if (metadata.phases) {
			for (const [phase, active] of Object.entries(metadata.phases)) {
				if (active === true && phase !== 'activeCount') {
					enhancedSignals.phases.push(phase);
				}
			}
		}

		// Extract file types being worked with
		if (metadata.codePatterns?.fileTypes) {
			enhancedSignals.fileTypes = metadata.codePatterns.fileTypes;
		}

		// Extract already referenced context files
		if (metadata.contextPatterns?.essentialFiles) {
			enhancedSignals.contextFiles = metadata.contextPatterns.essentialFiles;
		}

		return enhancedSignals;
	}

	/**
	 * Boost document scores based on command metadata
	 */
	applyMetadataBoost(document, metadata) {
		if (!metadata) return 1.0;

		let boost = 1.0;

		// Boost if document mentions agents used in the command
		if (metadata.agents?.length) {
			for (const agent of metadata.agents) {
				if (document.keywords?.includes(agent) ||
				    document.description?.toLowerCase().includes(agent)) {
					boost *= 1.3;
				}
			}
		}

		// Boost if document relates to technologies used
		if (metadata.technologies?.length) {
			for (const tech of metadata.technologies) {
				if (document.keywords?.includes(tech) ||
				    document.topics?.some(t => t.toLowerCase().includes(tech))) {
					boost *= 1.25;
				}
			}
		}

		// Boost if document matches workflow phases
		if (metadata.phases?.length) {
			for (const phase of metadata.phases) {
				if (document.keywords?.includes(phase) ||
				    document.description?.toLowerCase().includes(phase)) {
					boost *= 1.2;
				}
			}
		}

		// Penalize if document was already in essential context
		if (metadata.contextFiles?.length) {
			for (const file of metadata.contextFiles) {
				if (document.path === file) {
					boost *= 0.5; // Already loaded, reduce priority
				}
			}
		}

		return Math.min(boost, 2.5); // Cap maximum boost
	}

	/**
	 * Main method to find relevant context
	 */
	async findRelevantContext(query, options = {}) {
		const {
			commandType = "default",
			maxResults = 3,
			tokenBudget = 4000,
			includeScores = false,
			verbose = false,
			useFuse = true, // Enable Fuse.js by default
			commandMetadata = null, // NEW: Rich metadata from command analyzer
		} = options;

		if (!this.inventory) {
			await this.initialize();
		}

		// Check cache
		const cacheKey = `${commandType}:${query}:${maxResults}:${useFuse}`;
		if (this.cache.has(cacheKey)) {
			if (verbose) console.error("Cache hit for query");
			return this.cache.get(cacheKey);
		}

		// Process command metadata if provided
		const enhancedSignals = this.processCommandMetadata(commandMetadata);
		if (verbose && enhancedSignals) {
			console.error("Using rich command metadata for enhanced scoring");
			console.error(`Agents: ${enhancedSignals.agents.join(", ") || "none"}`);
			console.error(`Technologies: ${enhancedSignals.technologies.join(", ") || "none"}`);
			console.error(`Phases: ${enhancedSignals.phases.join(", ") || "none"}`);
		}

		// Extract keywords from query (still needed for fallback and supplementary logic)
		const queryKeywords = this.extractKeywords(query);
		if (verbose) {
			console.error(`Query keywords: ${queryKeywords.join(", ")}`);
			if (useFuse) {
				console.error("Using Fuse.js for intelligent fuzzy matching");
			}
		}

		// Score all documents
		const scoredDocs = [];

		if (useFuse && this.globalFuse) {
			// Use Fuse.js for intelligent fuzzy searching
			const fuseResults = this.performFuseSearch(query, commandType);

			// Process Fuse results with additional scoring
			for (const fuseDoc of fuseResults) {
				const scores = this.calculateRelevanceScore(
					fuseDoc,
					queryKeywords,
					commandType,
					fuseDoc.category,
					fuseDoc.fuseScore,
				);
				const importance = this.calculateImportanceScore(
					fuseDoc,
					fuseDoc.category,
				);

				// Apply metadata boost if available
				const metadataBoost = this.applyMetadataBoost(fuseDoc, enhancedSignals);
				const boostedRelevance = scores.relevance * metadataBoost;

				scoredDocs.push({
					path: fuseDoc.path,
					name: fuseDoc.name,
					description: fuseDoc.description,
					category: fuseDoc.category,
					tokens: this.estimateTokens(fuseDoc),
					relevance: boostedRelevance,
					importance: importance,
					combinedScore: boostedRelevance * importance,
					metadataBoost: metadataBoost,
					...scores,
				});
			}

			// If Fuse returns few results, fall back to category-based search for supplementary docs
			if (fuseResults.length < maxResults) {
				const missingCount = maxResults - fuseResults.length;
				const existingPaths = new Set(fuseResults.map((d) => d.path));

				// Search in high-priority categories
				for (const categoryName of ["core", "standards", "architecture"]) {
					const category = this.inventory.categories[categoryName];
					if (!category) continue;

					for (const doc of category.documents) {
						if (existingPaths.has(doc.path)) continue;

						const scores = this.calculateRelevanceScore(
							doc,
							queryKeywords,
							commandType,
							categoryName,
						);
						const importance = this.calculateImportanceScore(doc, categoryName);

						// Apply metadata boost if available
						const metadataBoost = this.applyMetadataBoost(doc, enhancedSignals);
						const boostedRelevance = scores.relevance * metadataBoost;

						scoredDocs.push({
							path: doc.path,
							name: doc.name,
							description: doc.description,
							category: categoryName,
							tokens: this.estimateTokens(doc),
							relevance: boostedRelevance,
							importance: importance,
							combinedScore: boostedRelevance * importance,
							metadataBoost: metadataBoost,
							...scores,
						});

						if (scoredDocs.length >= maxResults * 2) break;
					}
				}
			}
		} else {
			// Fallback to original keyword-based scoring
			for (const [categoryName, category] of Object.entries(
				this.inventory.categories,
			)) {
				for (const doc of category.documents) {
					const scores = this.calculateRelevanceScore(
						doc,
						queryKeywords,
						commandType,
						categoryName,
					);
					const importance = this.calculateImportanceScore(doc, categoryName);

					scoredDocs.push({
						path: doc.path,
						name: doc.name,
						description: doc.description,
						category: categoryName,
						tokens: this.estimateTokens(doc),
						relevance: scores.relevance,
						importance: importance,
						combinedScore: scores.relevance * importance,
						...scores,
					});
				}
			}

			// Add database documents if present
			if (this.inventory.database?.documents) {
				for (const doc of this.inventory.database.documents) {
					const scores = this.calculateRelevanceScore(
						doc,
						queryKeywords,
						commandType,
						"database",
					);
					const importance = this.calculateImportanceScore(doc, "database");

					scoredDocs.push({
						path: doc.path,
						name: doc.name,
						description: doc.description,
						category: "database",
						tokens: this.estimateTokens(doc),
						relevance: scores.relevance,
						importance: importance,
						combinedScore: scores.relevance * importance,
						...scores,
					});
				}
			}
		}

		// Sort by combined score
		scoredDocs.sort((a, b) => b.combinedScore - a.combinedScore);

		// Select top documents within token budget
		const selected = [];
		let tokenCount = 0;

		for (const doc of scoredDocs) {
			if (tokenCount + doc.tokens <= tokenBudget) {
				selected.push(doc);
				tokenCount += doc.tokens;

				if (selected.length >= maxResults) break;
			}
		}

		// Format results
		const results = selected.map((doc) => {
			const result = {
				path: path.join(this.inventory.basePath, doc.path),
				name: doc.name,
				category: doc.category,
				tokens: doc.tokens,
			};

			if (includeScores) {
				result.scores = {
					relevance: doc.relevance.toFixed(3),
					importance: doc.importance.toFixed(3),
					combined: doc.combinedScore.toFixed(3),
					topic: doc.topicScore.toFixed(3),
					text: doc.textScore.toFixed(3),
					category: doc.categoryScore.toFixed(3),
					recency: doc.recencyScore.toFixed(3),
				};
				if (doc.metadataBoost) {
					result.scores.metadataBoost = doc.metadataBoost.toFixed(2);
				}
			}

			return result;
		});

		// Cache the results
		this.cache.set(cacheKey, results);

		return results;
	}

	/**
	 * Get supplementary context if token budget allows
	 */
	async getSupplementaryContext(alreadySelected = [], options = {}) {
		const { tokenBudget = 1000, commandType = "default" } = options;

		if (!this.inventory) {
			await this.initialize();
		}

		const selectedPaths = new Set(alreadySelected.map((d) => d.path));
		const supplementary = [];
		let tokenCount = 0;

		// Priority categories for supplementary docs
		const priorityCategories = ["core", "standards", "architecture"];

		for (const categoryName of priorityCategories) {
			const category = this.inventory.categories[categoryName];
			if (!category) continue;

			for (const doc of category.documents) {
				const fullPath = path.join(this.inventory.basePath, doc.path);
				if (selectedPaths.has(fullPath)) continue;

				const tokens = this.estimateTokens(doc);
				if (tokenCount + tokens <= tokenBudget) {
					supplementary.push({
						path: fullPath,
						name: doc.name,
						category: categoryName,
						tokens: tokens,
					});
					tokenCount += tokens;
				}

				if (tokenCount >= tokenBudget * 0.9) break;
			}
		}

		return supplementary;
	}
}

/**
 * CLI Interface
 */
async function main() {
	const args = process.argv.slice(2);
	const options = {};

	// Parse command line arguments
	for (const arg of args) {
		const [key, value] = arg.split("=");
		const cleanKey = key.replace(/^--/, "");

		// Parse numeric values
		if (value && !Number.isNaN(Number(value))) {
			options[cleanKey] = parseInt(value, 10);
		} else if (value === "true") {
			options[cleanKey] = true;
		} else if (value === "false") {
			options[cleanKey] = false;
		} else {
			options[cleanKey] = value || true;
		}
	}

	// Validate required arguments
	if (!options.query && !options.help) {
		console.error("Error: --query parameter is required");
		console.error(
			'Usage: node context-loader.js --query="your search query" [options]',
		);
		console.error("Options:");
		console.error(
			"  --command=TYPE         Command type (debug-issue, test, feature, etc.)",
		);
		console.error(
			"  --max-results=N        Maximum results to return (default: 3)",
		);
		console.error(
			"  --token-budget=N       Token budget limit (default: 4000)",
		);
		console.error(
			"  --include-scores       Include relevance scores in output",
		);
		console.error(
			"  --format=FORMAT        Output format (json, paths, readable)",
		);
		console.error("  --verbose              Show debug information");
		process.exit(1);
	}

	if (options.help) {
		console.log("Dynamic Context Loader - Usage Guide");
		console.log("====================================");
		console.log("");
		console.log(
			'Usage: node context-loader.js --query="your search query" [options]',
		);
		console.log("");
		console.log("Options:");
		console.log("  --query=STRING         Search query (required)");
		console.log(
			"  --command=TYPE         Command type (debug-issue, test, feature, etc.)",
		);
		console.log(
			"  --max-results=N        Maximum results to return (default: 3)",
		);
		console.log("  --token-budget=N       Token budget limit (default: 4000)");
		console.log("  --include-scores       Include relevance scores in output");
		console.log(
			"  --format=FORMAT        Output format (json, paths, readable)",
		);
		console.log("  --verbose              Show debug information");
		console.log("  --supplementary        Also return supplementary docs");
		console.log(
			"  --no-fuse              Disable Fuse.js fuzzy matching (use legacy keyword matching)",
		);
		console.log("  --metadata=JSON        Command metadata from AST analysis (JSON or file path)");
		console.log("");
		console.log("Examples:");
		console.log(
			'  node context-loader.js --query="database error" --command=debug-issue',
		);
		console.log(
			'  node context-loader.js --query="unit testing" --command=test --include-scores',
		);
		console.log(
			'  node context-loader.js --query="performance" --format=paths --max-results=5',
		);
		process.exit(0);
	}

	try {
		const loader = new ContextLoader();

		// Parse command metadata if provided
		let commandMetadata = null;
		if (options.metadata) {
			try {
				// Metadata can be JSON string or file path
				if (options.metadata.startsWith('{')) {
					commandMetadata = JSON.parse(options.metadata);
				} else if (options.metadata.endsWith('.json')) {
					const metadataContent = await fs.readFile(options.metadata, 'utf8');
					commandMetadata = JSON.parse(metadataContent);
				}
			} catch (error) {
				console.error(`Warning: Could not parse metadata: ${error.message}`);
			}
		}

		// Find relevant context
		const results = await loader.findRelevantContext(options.query, {
			commandType: options.command || options.commandType,
			maxResults: options["max-results"] || options.maxResults || 3,
			tokenBudget: options["token-budget"] || options.tokenBudget || 4000,
			includeScores:
				options["include-scores"] || options.includeScores || false,
			verbose: options.verbose || false,
			useFuse: !options["no-fuse"],
			commandMetadata: commandMetadata,
		});

		// Get supplementary docs if requested
		let supplementary = [];
		if (options.supplementary) {
			const remainingBudget =
				(options["token-budget"] || 4000) -
				results.reduce((sum, doc) => sum + doc.tokens, 0);

			if (remainingBudget > 500) {
				supplementary = await loader.getSupplementaryContext(results, {
					tokenBudget: remainingBudget,
					commandType: options.command || options.commandType,
				});
			}
		}

		// Format output based on requested format
		const format = options.format || "json";

		switch (format) {
			case "paths":
				// Output just the file paths for easy reading
				results.forEach((doc) => console.log(`Read ${doc.path}`));
				if (supplementary.length) {
					console.log("\n# Supplementary (if token budget allows):");
					supplementary.forEach((doc) => console.log(`Read ${doc.path}`));
				}
				break;

			case "readable":
				// Human-readable format
				console.log("Relevant Context Documents");
				console.log("==========================");
				results.forEach((doc, i) => {
					console.log(`\n${i + 1}. ${doc.name}`);
					console.log(`   Path: ${doc.path}`);
					console.log(`   Category: ${doc.category}`);
					console.log(`   Tokens: ~${doc.tokens}`);
					if (doc.scores) {
						console.log(`   Relevance: ${doc.scores.relevance}`);
					}
				});
				if (supplementary.length) {
					console.log("\nSupplementary Documents");
					console.log("======================");
					supplementary.forEach((doc, i) => {
						console.log(`\n${i + 1}. ${doc.name}`);
						console.log(`   Path: ${doc.path}`);
						console.log(`   Tokens: ~${doc.tokens}`);
					});
				}
				break;

			default: {
				// JSON output (default)
				const output = {
					query: options.query,
					command: options.command || "default",
					results: results,
					tokenUsage: results.reduce((sum, doc) => sum + doc.tokens, 0),
				};
				if (supplementary.length) {
					output.supplementary = supplementary;
				}
				console.log(JSON.stringify(output, null, 2));
				break;
			}
		}

		if (options.verbose) {
			console.error(
				`\nTotal tokens: ${results.reduce((sum, doc) => sum + doc.tokens, 0)}`,
			);
			console.error(`Documents selected: ${results.length}`);
		}
	} catch (error) {
		console.error(`Error: ${error.message}`);
		process.exit(1);
	}
}

// Run if called directly
if (require.main === module) {
	main();
}

module.exports = ContextLoader;
