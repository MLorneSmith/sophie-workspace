#!/usr/bin/env node

/**
 * CCPM Dashboard Data Loader
 * Reads and aggregates data from .claude/tracking/ directories
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";
import yaml from "yaml";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths relative to the dashboards directory
const TRACKING_ROOT = path.join(__dirname, "../../tracking");
const IMPLEMENTATIONS_DIR = path.join(TRACKING_ROOT, "implementations");
const SPECS_DIR = path.join(TRACKING_ROOT, "specs");
const _ISSUES_DIR = path.join(TRACKING_ROOT, "issues");

class DataLoader {
	constructor() {
		this.data = {
			features: [],
			tasks: [],
			specs: [],
			issues: [],
			metrics: {
				totalFeatures: 0,
				totalTasks: 0,
				completedTasks: 0,
				inProgressTasks: 0,
				blockedTasks: 0,
				pendingTasks: 0,
				velocity: [],
				agentDistribution: {},
				priorityDistribution: {
					high: 0,
					medium: 0,
					low: 0,
				},
				complexityDistribution: {
					high: 0,
					medium: 0,
					low: 0,
				},
			},
			timeline: [],
		};
	}

	/**
	 * Parse markdown file with YAML frontmatter
	 */
	parseMarkdownFile(filePath) {
		try {
			const content = fs.readFileSync(filePath, "utf-8");
			const parts = content.split("---").filter(Boolean);

			if (parts.length >= 2) {
				// Parse frontmatter
				const frontmatter = yaml.parse(parts[0]) || {};

				// Parse markdown body
				const markdownBody = parts.slice(1).join("---");
				const htmlBody = marked.parse(markdownBody);

				return {
					...frontmatter,
					content: markdownBody,
					htmlContent: htmlBody,
					filePath,
				};
			}

			// No frontmatter, return content as is
			return {
				content: content,
				htmlContent: marked.parse(content),
				filePath,
			};
		} catch (_error) {
			return null;
		}
	}

	/**
	 * Load all features and their tasks
	 */
	async loadFeatures() {
		if (!fs.existsSync(IMPLEMENTATIONS_DIR)) {
			return;
		}

		const features = fs
			.readdirSync(IMPLEMENTATIONS_DIR)
			.filter((dir) =>
				fs.statSync(path.join(IMPLEMENTATIONS_DIR, dir)).isDirectory(),
			);

		for (const featureName of features) {
			const featurePath = path.join(IMPLEMENTATIONS_DIR, featureName);
			const feature = {
				name: featureName,
				tasks: [],
				plan: null,
				status: "pending",
				progress: 0,
			};

			// Load plan.md if exists
			const planPath = path.join(featurePath, "plan.md");
			if (fs.existsSync(planPath)) {
				feature.plan = this.parseMarkdownFile(planPath);
			}

			// Load all task files (001.md, 002.md, etc.)
			const taskFiles = fs
				.readdirSync(featurePath)
				.filter((file) => /^\d{3}\.md$/.test(file))
				.sort();

			for (const taskFile of taskFiles) {
				const taskPath = path.join(featurePath, taskFile);
				const taskData = this.parseMarkdownFile(taskPath);

				if (taskData) {
					taskData.featureName = featureName;
					taskData.taskId = path.basename(taskFile, ".md");
					feature.tasks.push(taskData);
					this.data.tasks.push(taskData);

					// Update metrics
					this.updateMetrics(taskData);
				}
			}

			// Calculate feature progress
			if (feature.tasks.length > 0) {
				const completed = feature.tasks.filter(
					(t) => t.status === "completed",
				).length;
				feature.progress = Math.round((completed / feature.tasks.length) * 100);

				// Determine feature status
				if (completed === feature.tasks.length) {
					feature.status = "completed";
				} else if (feature.tasks.some((t) => t.status === "in_progress")) {
					feature.status = "in_progress";
				} else if (feature.tasks.some((t) => t.status === "blocked")) {
					feature.status = "blocked";
				}
			}

			this.data.features.push(feature);
		}

		this.data.metrics.totalFeatures = this.data.features.length;
		this.data.metrics.totalTasks = this.data.tasks.length;
	}

	/**
	 * Update metrics based on task data
	 */
	updateMetrics(task) {
		// Status distribution
		switch (task.status) {
			case "completed":
				this.data.metrics.completedTasks++;
				break;
			case "in_progress":
				this.data.metrics.inProgressTasks++;
				break;
			case "blocked":
				this.data.metrics.blockedTasks++;
				break;
			default:
				this.data.metrics.pendingTasks++;
		}

		// Priority distribution
		if (
			task.priority &&
			this.data.metrics.priorityDistribution[task.priority] !== undefined
		) {
			this.data.metrics.priorityDistribution[task.priority]++;
		}

		// Complexity distribution
		if (
			task.complexity &&
			this.data.metrics.complexityDistribution[task.complexity] !== undefined
		) {
			this.data.metrics.complexityDistribution[task.complexity]++;
		}

		// Agent distribution
		if (task.agent) {
			this.data.metrics.agentDistribution[task.agent] =
				(this.data.metrics.agentDistribution[task.agent] || 0) + 1;
		}

		// Timeline events
		if (task.created) {
			this.data.timeline.push({
				date: task.created,
				type: "created",
				task: task.name || task.taskId,
				feature: task.featureName,
			});
		}

		if (task.updated && task.status === "completed") {
			this.data.timeline.push({
				date: task.updated,
				type: "completed",
				task: task.name || task.taskId,
				feature: task.featureName,
			});
		}
	}

	/**
	 * Load specification files
	 */
	async loadSpecs() {
		if (!fs.existsSync(SPECS_DIR)) {
			return;
		}

		const specFiles = fs
			.readdirSync(SPECS_DIR)
			.filter((file) => file.endsWith(".md"));

		for (const specFile of specFiles) {
			const specPath = path.join(SPECS_DIR, specFile);
			const specData = this.parseMarkdownFile(specPath);

			if (specData) {
				specData.specName = path.basename(specFile, ".md");
				this.data.specs.push(specData);
			}
		}
	}

	/**
	 * Calculate velocity metrics (tasks completed per day)
	 */
	calculateVelocity() {
		// Group completed tasks by date
		const completedByDate = {};

		this.data.timeline
			.filter((event) => event.type === "completed")
			.forEach((event) => {
				const date = event.date.split("T")[0]; // Get date part only
				completedByDate[date] = (completedByDate[date] || 0) + 1;
			});

		// Convert to array for charting
		this.data.metrics.velocity = Object.entries(completedByDate)
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([date, count]) => ({ date, count }));
	}

	/**
	 * Calculate overall progress percentage
	 */
	calculateOverallProgress() {
		if (this.data.metrics.totalTasks === 0) return 0;

		return Math.round(
			(this.data.metrics.completedTasks / this.data.metrics.totalTasks) * 100,
		);
	}

	/**
	 * Load all data
	 */
	async loadAll() {
		await this.loadFeatures();
		await this.loadSpecs();

		this.calculateVelocity();
		this.data.metrics.overallProgress = this.calculateOverallProgress();

		// Sort timeline by date
		this.data.timeline.sort(
			(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
		);

		return this.data;
	}

	/**
	 * Get summary statistics
	 */
	getSummary() {
		return {
			features: {
				total: this.data.metrics.totalFeatures,
				completed: this.data.features.filter((f) => f.status === "completed")
					.length,
				inProgress: this.data.features.filter((f) => f.status === "in_progress")
					.length,
				blocked: this.data.features.filter((f) => f.status === "blocked")
					.length,
			},
			tasks: {
				total: this.data.metrics.totalTasks,
				completed: this.data.metrics.completedTasks,
				inProgress: this.data.metrics.inProgressTasks,
				blocked: this.data.metrics.blockedTasks,
				pending: this.data.metrics.pendingTasks,
			},
			progress: this.data.metrics.overallProgress,
			velocity: this.data.metrics.velocity.slice(-7), // Last 7 days
			topAgents: Object.entries(this.data.metrics.agentDistribution)
				.sort(([, a], [, b]) => b - a)
				.slice(0, 5)
				.map(([agent, count]) => ({ agent, count })),
		};
	}
}

// Export for use in other modules
export default DataLoader;

// Allow direct execution for testing
if (import.meta.url === `file://${process.argv[1]}`) {
	const loader = new DataLoader();
	const data = await loader.loadAll();

	// Save data to JSON for debugging
	const outputPath = path.join(__dirname, "../output/data.json");
	fs.mkdirSync(path.dirname(outputPath), { recursive: true });
	fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
}
