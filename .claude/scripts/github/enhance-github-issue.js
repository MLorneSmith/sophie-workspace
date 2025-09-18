#!/usr/bin/env node

/**
 * Enhanced GitHub Issue Generator for CCPM
 *
 * This script transforms basic CCPM implementation plans into rich,
 * actionable GitHub issues with comprehensive content and metadata.
 *
 * Usage:
 *   node enhance-github-issue.js <feature-name> [options]
 *
 * Options:
 *   --type <feature|task>  Issue type (default: feature)
 *   --output <path>        Output file path (default: stdout)
 *   --repo <owner/name>    GitHub repository (auto-detected if not provided)
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

// Configuration
const CONFIG = {
	baseDir: ".claude/tracking",
	templatesDir: ".claude/templates",
	defaultComplexity: 5,
	defaultPriority: "normal",
};

/**
 * Content extraction utilities
 */
class ContentExtractor {
	constructor(content) {
		this.content = content;
		this.frontmatter = this.extractFrontmatter();
		this.body = this.extractBody();
	}

	extractFrontmatter() {
		const match = this.content.match(/^---\n([\s\S]*?)\n---/);
		if (!match) return {};

		const frontmatter = {};
		const lines = match[1].split("\n");

		for (const line of lines) {
			const [key, ...valueParts] = line.split(":");
			if (key && valueParts.length) {
				const value = valueParts.join(":").trim();
				frontmatter[key.trim()] = this.parseValue(value);
			}
		}

		return frontmatter;
	}

	parseValue(value) {
		// Handle arrays
		if (value.startsWith("[") && value.endsWith("]")) {
			return value
				.slice(1, -1)
				.split(",")
				.map((v) => v.trim());
		}
		// Handle numbers
		if (/^\d+$/.test(value)) {
			return parseInt(value, 10);
		}
		// Handle booleans
		if (value === "true" || value === "false") {
			return value === "true";
		}
		return value;
	}

	extractBody() {
		return this.content.replace(/^---[\s\S]*?---\n/, "").trim();
	}

	extractSection(sectionName, fallback = "") {
		const patterns = [
			new RegExp(
				`^#{1,3}\\s+${sectionName}\\s*\\n([\\s\\S]*?)(?=\\n#{1,3}\\s+|\\z)`,
				"im",
			),
			new RegExp(
				`^#{1,3}\\s+.*${sectionName}.*\\s*\\n([\\s\\S]*?)(?=\\n#{1,3}\\s+|\\z)`,
				"im",
			),
		];

		for (const pattern of patterns) {
			const match = this.body.match(pattern);
			if (match) return match[1].trim();
		}

		return fallback;
	}

	extractBulletList(sectionName) {
		const sectionContent = this.extractSection(sectionName);
		if (!sectionContent) return [];

		const bullets = sectionContent.match(/^\s*[-*]\s+(.+)$/gm) || [];
		return bullets.map((b) => b.replace(/^\s*[-*]\s+/, "").trim());
	}
}

/**
 * Task processor for analyzing task files
 */
class TaskProcessor {
	constructor(implementationDir) {
		this.dir = implementationDir;
		this.tasks = this.loadTasks();
	}

	loadTasks() {
		const tasks = [];
		const taskFiles = fs
			.readdirSync(this.dir)
			.filter((f) => /^\d{3}\.md$/.test(f))
			.sort();

		for (const file of taskFiles) {
			const content = fs.readFileSync(path.join(this.dir, file), "utf-8");
			const extractor = new ContentExtractor(content);

			tasks.push({
				id: file.replace(".md", ""),
				name: extractor.frontmatter.name || `Task ${file.replace(".md", "")}`,
				type: extractor.frontmatter.type || "task",
				size: extractor.frontmatter.size || "medium",
				effort: extractor.frontmatter.effort || "2-4 hours",
				depends_on: extractor.frontmatter.depends_on || [],
				conflicts_with: extractor.frontmatter.conflicts_with || [],
				parallel_group: extractor.frontmatter.parallel_group,
				description: extractor.extractSection(
					"Description",
					extractor.body.split("\n")[0],
				),
			});
		}

		return tasks;
	}

	getParallelStreams() {
		const streams = {};

		for (const task of this.tasks) {
			const group = task.parallel_group || "default";
			if (!streams[group]) {
				streams[group] = {
					name: group === "default" ? "Main Stream" : `Stream ${group}`,
					tasks: [],
				};
			}
			streams[group].tasks.push(task);
		}

		return Object.values(streams);
	}

	getSequentialTasks() {
		return this.tasks.filter((t) => t.depends_on.length > 0);
	}

	generateDependencyGraph() {
		const lines = ["graph TD"];

		for (const task of this.tasks) {
			const label = `${task.id}["${task.name}<br/>${task.effort}"]`;
			lines.push(`  ${label}`);

			for (const dep of task.depends_on) {
				lines.push(`  ${dep} --> ${task.id}`);
			}
		}

		return lines.join("\n");
	}

	calculateTotalEffort() {
		let totalHours = 0;

		for (const task of this.tasks) {
			const effortMatch = task.effort.match(/(\d+)-?(\d*)/);
			if (effortMatch) {
				const min = parseInt(effortMatch[1], 10);
				const max = effortMatch[2] ? parseInt(effortMatch[2], 10) : min;
				totalHours += (min + max) / 2;
			}
		}

		const days = Math.ceil(totalHours / 8);
		return {
			hours: totalHours,
			days: days,
			display: days > 5 ? `${Math.ceil(days / 5)} weeks` : `${days} days`,
		};
	}
}

/**
 * Metadata generator for labels and assignments
 */
class MetadataGenerator {
	constructor(content, taskCount) {
		this.content = content;
		this.taskCount = taskCount;
	}

	generateLabels(featureName) {
		const labels = ["feature", "implementation"];

		if (featureName) {
			labels.push(`feature:${featureName}`);
		}

		// Priority
		const priority = this.detectPriority();
		labels.push(`priority:${priority}`);

		// Complexity
		const complexity = this.calculateComplexity();
		labels.push(`complexity:${complexity}`);

		// Size
		const size = this.calculateSize();
		labels.push(`size:${size}`);

		// Type
		const type = this.detectType();
		if (type) labels.push(`type:${type}`);

		// Status
		labels.push("status:ready");

		return labels;
	}

	detectPriority() {
		const highPriorityKeywords =
			/\b(critical|urgent|blocker|asap|emergency)\b/i;
		const mediumPriorityKeywords = /\b(important|needed|required|should)\b/i;

		if (highPriorityKeywords.test(this.content)) return "high";
		if (mediumPriorityKeywords.test(this.content)) return "medium";
		return "normal";
	}

	calculateComplexity() {
		let score = CONFIG.defaultComplexity;

		// Adjust based on task count
		if (this.taskCount > 15) score += 3;
		else if (this.taskCount > 10) score += 2;
		else if (this.taskCount > 5) score += 1;

		// Adjust based on keywords
		if (/\b(complex|difficult|challenging|intricate)\b/i.test(this.content)) {
			score += 2;
		}
		if (/\b(simple|basic|straightforward|trivial)\b/i.test(this.content)) {
			score -= 2;
		}

		// Normalize to low/medium/high
		if (score >= 8) return "high";
		if (score >= 5) return "medium";
		return "low";
	}

	calculateSize() {
		if (this.taskCount > 10) return "xl";
		if (this.taskCount > 7) return "l";
		if (this.taskCount > 4) return "m";
		if (this.taskCount > 1) return "s";
		return "xs";
	}

	detectType() {
		const typePatterns = {
			bugfix: /\b(bug|fix|repair|patch|issue)\b/i,
			enhancement: /\b(enhance|improve|optimize|upgrade)\b/i,
			refactor: /\b(refactor|restructure|reorganize|cleanup)\b/i,
			documentation: /\b(document|docs|documentation|readme)\b/i,
			performance: /\b(performance|speed|optimize|fast)\b/i,
			security: /\b(security|vulnerability|auth|permission)\b/i,
		};

		for (const [type, pattern] of Object.entries(typePatterns)) {
			if (pattern.test(this.content)) return type;
		}

		return null;
	}

	recommendSpecialists() {
		const specialists = [];

		// Analyze content for specialist recommendations
		if (/\b(react|component|jsx|tsx|hook)\b/i.test(this.content)) {
			specialists.push({
				role: "react-expert",
				reason: "React components and hooks detected",
			});
		}
		if (/\b(node|express|api|server|backend)\b/i.test(this.content)) {
			specialists.push({
				role: "nodejs-expert",
				reason: "Backend/API implementation required",
			});
		}
		if (/\b(database|sql|postgres|migration|rls)\b/i.test(this.content)) {
			specialists.push({
				role: "postgres-expert",
				reason: "Database changes detected",
			});
		}
		if (/\b(css|style|tailwind|design|ui)\b/i.test(this.content)) {
			specialists.push({
				role: "css-expert",
				reason: "Styling and UI work required",
			});
		}
		if (/\b(test|jest|vitest|e2e|playwright)\b/i.test(this.content)) {
			specialists.push({
				role: "testing-expert",
				reason: "Testing implementation needed",
			});
		}

		return specialists;
	}
}

/**
 * Main issue generator
 */
class EnhancedIssueGenerator {
	constructor(featureName, options = {}) {
		this.featureName = featureName;
		this.options = options;
		this.implementationDir = path.join(
			CONFIG.baseDir,
			"implementations",
			featureName,
		);
		this.specFile = path.join(CONFIG.baseDir, "specs", `${featureName}.md`);

		this.validate();
		this.loadContent();
		this.processContent();
	}

	validate() {
		if (!fs.existsSync(this.implementationDir)) {
			throw new Error(
				`Implementation directory not found: ${this.implementationDir}`,
			);
		}

		const planFile = path.join(this.implementationDir, "plan.md");
		if (!fs.existsSync(planFile)) {
			throw new Error(`Implementation plan not found: ${planFile}`);
		}
	}

	loadContent() {
		// Load implementation plan
		const planFile = path.join(this.implementationDir, "plan.md");
		const planContent = fs.readFileSync(planFile, "utf-8");
		this.planExtractor = new ContentExtractor(planContent);

		// Load specification if exists
		if (fs.existsSync(this.specFile)) {
			const specContent = fs.readFileSync(this.specFile, "utf-8");
			this.specExtractor = new ContentExtractor(specContent);
		}

		// Process tasks
		this.taskProcessor = new TaskProcessor(this.implementationDir);

		// Generate metadata
		this.metadataGenerator = new MetadataGenerator(
			planContent,
			this.taskProcessor.tasks.length,
		);
	}

	processContent() {
		this.data = {
			// Basic info
			FEATURE_ID: this.featureName,
			FEATURE_TITLE: this.generateTitle(),
			ISSUE_TYPE: "Feature",

			// Content sections
			EXECUTIVE_SUMMARY: this.extractExecutiveSummary(),
			PROBLEM_STATEMENT: this.extractProblemStatement(),
			CURRENT_STATE_DESCRIPTION: this.extractCurrentState(),
			DESIRED_STATE_DESCRIPTION: this.extractDesiredState(),
			BUSINESS_VALUE: this.extractBusinessValue(),
			ACCEPTANCE_CRITERIA: this.extractAcceptanceCriteria(),
			ARCHITECTURE_OVERVIEW: this.extractArchitecture(),
			IMPLEMENTATION_STRATEGY: this.extractImplementationStrategy(),
			KEY_COMPONENTS: this.extractKeyComponents(),

			// Task information
			TOTAL_TASKS: this.taskProcessor.tasks.length,
			PARALLEL_STREAMS: this.taskProcessor.getParallelStreams(),
			SEQUENTIAL_TASKS: this.taskProcessor.getSequentialTasks(),
			TASK_DEPENDENCY_GRAPH: this.taskProcessor.generateDependencyGraph(),

			// Metrics
			ESTIMATED_DURATION: this.taskProcessor.calculateTotalEffort().display,
			TOTAL_EFFORT: `${this.taskProcessor.calculateTotalEffort().hours} hours`,
			COMPLEXITY_SCORE:
				this.metadataGenerator.calculateComplexity() === "high"
					? 8
					: this.metadataGenerator.calculateComplexity() === "medium"
						? 5
						: 3,
			COMPLEXITY: this.metadataGenerator.calculateComplexity(),
			PRIORITY: this.metadataGenerator.detectPriority(),

			// Implementation details
			FILES_TO_MODIFY: this.extractFilesToModify(),
			NEW_FILES: this.extractNewFiles(),
			DATABASE_CHANGES: this.extractDatabaseChanges(),
			IMPLEMENTATION_PHASES: this.extractImplementationPhases(),

			// Dependencies
			TECHNICAL_DEPENDENCIES: this.extractTechnicalDependencies(),
			DEPENDS_ON_ISSUES: this.extractDependsOnIssues(),
			BLOCKS_ISSUES: this.extractBlocksIssues(),
			RELATED_ISSUES: this.extractRelatedIssues(),

			// Success metrics
			PERFORMANCE_TARGETS: this.extractPerformanceTargets(),
			QUALITY_GATES: this.extractQualityGates(),

			// Team
			LEAD_ASSIGNEE: this.extractLeadAssignee(),
			REVIEWERS: this.extractReviewers(),
			STAKEHOLDERS: this.extractStakeholders(),
			RECOMMENDED_SPECIALISTS: this.metadataGenerator.recommendSpecialists(),

			// Resources
			SPEC_URL: this.getSpecUrl(),
			PLAN_URL: this.getPlanUrl(),
			EXTERNAL_RESOURCES: this.extractExternalResources(),
			RELATED_DOCS: this.extractRelatedDocs(),

			// Notes and metadata
			IMPLEMENTATION_NOTES: this.extractImplementationNotes(),
			CREATED_DATE: new Date().toISOString(),
			UPDATED_DATE: new Date().toISOString(),
			STATUS: "ready",
			TARGET_RELEASE: this.extractTargetRelease(),

			// Labels
			LABELS: this.metadataGenerator.generateLabels(this.featureName),
		};
	}

	// Extraction methods
	generateTitle() {
		const title =
			this.planExtractor.frontmatter.title ||
			this.planExtractor.frontmatter.name ||
			this.featureName
				.replace(/-/g, " ")
				.replace(/\b\w/g, (l) => l.toUpperCase());
		return title;
	}

	extractExecutiveSummary() {
		return this.planExtractor.extractSection(
			"Summary",
			this.planExtractor.extractSection(
				"Overview",
				this.planExtractor.body.split("\n\n")[0] ||
					"Feature implementation as specified in the implementation plan.",
			),
		);
	}

	extractProblemStatement() {
		return (
			this.specExtractor?.extractSection("Problem Statement") ||
			this.planExtractor.extractSection(
				"Problem Statement",
				this.planExtractor.extractSection(
					"Background",
					"Problem statement to be defined during implementation.",
				),
			)
		);
	}

	extractCurrentState() {
		return this.planExtractor.extractSection(
			"Current State",
			"Current functionality to be enhanced or replaced.",
		);
	}

	extractDesiredState() {
		return this.planExtractor.extractSection(
			"Desired State",
			this.planExtractor.extractSection(
				"Goals",
				"Target state after implementation is complete.",
			),
		);
	}

	extractBusinessValue() {
		return this.planExtractor.extractSection(
			"Business Value",
			this.planExtractor.extractSection(
				"Value Proposition",
				"Improved user experience and system efficiency.",
			),
		);
	}

	extractAcceptanceCriteria() {
		const criteria =
			this.specExtractor?.extractBulletList("Acceptance Criteria") ||
			this.planExtractor.extractBulletList("Acceptance Criteria") ||
			this.planExtractor.extractBulletList("Success Criteria");

		if (criteria.length > 0) return criteria;

		// Default criteria
		return [
			"All specified functionality implemented",
			"Unit tests written and passing (>80% coverage)",
			"Integration tests passing",
			"Documentation updated",
			"Code review approved",
			"No critical bugs or security issues",
		];
	}

	extractArchitecture() {
		return this.planExtractor.extractSection(
			"Architecture",
			this.planExtractor.extractSection(
				"Technical Architecture",
				"Component-based architecture following established patterns.",
			),
		);
	}

	extractImplementationStrategy() {
		return this.planExtractor.extractSection(
			"Implementation Strategy",
			this.planExtractor.extractSection(
				"Approach",
				"Phased implementation with incremental delivery.",
			),
		);
	}

	extractKeyComponents() {
		const componentsSection = this.planExtractor.extractSection(
			"Components",
			this.planExtractor.extractSection("Key Components", ""),
		);

		if (!componentsSection) {
			return [
				{ name: "Frontend", description: "User interface components" },
				{ name: "Backend", description: "Server-side logic and APIs" },
				{ name: "Database", description: "Data models and persistence" },
			];
		}

		// Parse component list
		const components = [];
		const lines = componentsSection.split("\n");
		for (const line of lines) {
			const match = line.match(/^\s*[-*]\s*\*\*(.+?)\*\*:?\s*(.+)$/);
			if (match) {
				components.push({
					name: match[1].trim(),
					description: match[2].trim(),
				});
			}
		}

		return components.length > 0
			? components
			: [{ name: "Core", description: componentsSection }];
	}

	extractFilesToModify() {
		const files = [];
		const content = this.planExtractor.body + (this.specExtractor?.body || "");

		// Look for file paths in backticks
		const fileMatches =
			content.match(/`([^`]+\.(tsx?|jsx?|css|md|json|sql))`/g) || [];
		for (const match of fileMatches) {
			const path = match.replace(/`/g, "");
			if (!files.some((f) => f.path === path)) {
				files.push({
					path,
					changes: "Updates as per implementation requirements",
				});
			}
		}

		return files.length > 0
			? files
			: [
					{
						path: "TBD",
						changes: "Files to be determined during implementation",
					},
				];
	}

	extractNewFiles() {
		const newFilesSection = this.planExtractor.extractSection(
			"New Files",
			this.planExtractor.extractSection("Files to Create", ""),
		);

		if (!newFilesSection) return [];

		const files = [];
		const lines = newFilesSection.split("\n");
		for (const line of lines) {
			const match = line.match(/^\s*[-*]\s*`?([^`]+)`?:?\s*(.*)$/);
			if (match?.[1].includes(".")) {
				files.push({
					path: match[1].trim(),
					purpose: match[2].trim() || "New component/module",
				});
			}
		}

		return files;
	}

	extractDatabaseChanges() {
		return this.planExtractor.extractSection(
			"Database Changes",
			this.planExtractor.extractSection("Database Migrations", null),
		);
	}

	extractImplementationPhases() {
		const phasesSection = this.planExtractor.extractSection(
			"Implementation Phases",
			this.planExtractor.extractSection("Phases", ""),
		);

		if (!phasesSection) {
			// Generate default phases based on tasks
			const taskCount = this.taskProcessor.tasks.length;
			const phases = [];

			if (taskCount > 0) {
				phases.push({
					number: 1,
					name: "Foundation",
					duration: "1-2 days",
					objective: "Set up base infrastructure and dependencies",
					tasks: [
						"Initial setup",
						"Dependency installation",
						"Base configuration",
					],
					deliverables: "Development environment ready",
				});

				phases.push({
					number: 2,
					name: "Core Implementation",
					duration: `${Math.ceil(taskCount / 3)} days`,
					objective: "Implement main functionality",
					tasks: ["Core features", "Business logic", "Data layer"],
					deliverables: "Functional implementation",
				});

				phases.push({
					number: 3,
					name: "Testing & Polish",
					duration: "2-3 days",
					objective: "Ensure quality and completeness",
					tasks: ["Unit testing", "Integration testing", "Bug fixes"],
					deliverables: "Production-ready code",
				});
			}

			return phases;
		}

		// Parse phases from content
		const phases = [];
		const phaseMatches =
			phasesSection.match(
				/###?\s+Phase\s+(\d+)[:\s]+(.+?)\n([\s\S]*?)(?=###?\s+Phase|z)/gi,
			) || [];

		for (const match of phaseMatches) {
			const parsed = match.match(/###?\s+Phase\s+(\d+)[:\s]+(.+?)\n([\s\S]*)/i);
			if (parsed) {
				phases.push({
					number: parseInt(parsed[1], 10),
					name: parsed[2].trim(),
					duration: "TBD",
					objective: "See details",
					tasks: ["Implementation tasks"],
					deliverables: "Phase deliverables",
				});
			}
		}

		return phases;
	}

	extractTechnicalDependencies() {
		const deps = [];
		const depsSection = this.planExtractor.extractSection(
			"Dependencies",
			this.planExtractor.extractSection("Technical Dependencies", ""),
		);

		if (!depsSection) return [];

		const lines = depsSection.split("\n");
		for (const line of lines) {
			const match = line.match(
				/^\s*[-*]\s*(.+?)(?:\s+\((.+?)\))?(?::?\s+(.+))?$/,
			);
			if (match) {
				deps.push({
					name: match[1].trim(),
					version: match[2] || "latest",
					purpose: match[3] || "Required dependency",
				});
			}
		}

		return deps;
	}

	extractDependsOnIssues() {
		const depends = this.planExtractor.frontmatter.depends_on || [];
		return depends.map((d) => `#${d}`).join(", ") || "None";
	}

	extractBlocksIssues() {
		const blocks = this.planExtractor.frontmatter.blocks || [];
		return blocks.map((b) => `#${b}`).join(", ") || "None";
	}

	extractRelatedIssues() {
		const related = this.planExtractor.frontmatter.related || [];
		return related.map((r) => `#${r}`).join(", ") || "None";
	}

	extractPerformanceTargets() {
		const targets = [];
		const perfSection = this.planExtractor.extractSection(
			"Performance",
			this.planExtractor.extractSection("Performance Targets", ""),
		);

		if (!perfSection) {
			return [
				{ metric: "Page Load Time", target: "< 2 seconds" },
				{ metric: "API Response Time", target: "< 200ms" },
				{ metric: "Test Coverage", target: "> 80%" },
			];
		}

		const lines = perfSection.split("\n");
		for (const line of lines) {
			const match = line.match(/^\s*[-*]\s*(.+?):\s*(.+)$/);
			if (match) {
				targets.push({
					metric: match[1].trim(),
					target: match[2].trim(),
				});
			}
		}

		return targets;
	}

	extractQualityGates() {
		const gates =
			this.planExtractor.extractBulletList("Quality Gates") ||
			this.planExtractor.extractBulletList("Quality Criteria");

		if (gates.length > 0) return gates;

		return [
			"All tests passing",
			"No TypeScript errors",
			"Linting rules satisfied",
			"Documentation complete",
			"Security scan passed",
		];
	}

	extractLeadAssignee() {
		return this.planExtractor.frontmatter.assignee || "@me";
	}

	extractReviewers() {
		const reviewers = this.planExtractor.frontmatter.reviewers || [];
		return reviewers.join(", ") || "@team";
	}

	extractStakeholders() {
		const stakeholders = this.planExtractor.frontmatter.stakeholders || [];
		return stakeholders.join(", ") || "Product Team";
	}

	extractImplementationNotes() {
		return this.planExtractor.extractSection(
			"Notes",
			this.planExtractor.extractSection(
				"Implementation Notes",
				"See implementation plan for detailed notes.",
			),
		);
	}

	extractTargetRelease() {
		return (
			this.planExtractor.frontmatter.target_release ||
			this.planExtractor.frontmatter.milestone ||
			"Next Release"
		);
	}

	extractExternalResources() {
		const resources = [];
		const content = this.planExtractor.body + (this.specExtractor?.body || "");

		// Extract markdown links
		const linkMatches = content.match(/\[([^\]]+)\]\(([^)]+)\)/g) || [];
		for (const match of linkMatches) {
			const parsed = match.match(/\[([^\]]+)\]\(([^)]+)\)/);
			if (parsed?.[2].startsWith("http")) {
				resources.push({
					title: parsed[1],
					url: parsed[2],
					description: "External resource",
				});
			}
		}

		return resources;
	}

	extractRelatedDocs() {
		return this.extractExternalResources().filter(
			(r) => r.url.includes("docs") || r.url.includes("documentation"),
		);
	}

	getSpecUrl() {
		const repo = this.getGitHubRepo();
		const branch = "main"; // Or detect current branch
		return `https://github.com/${repo}/blob/${branch}/.claude/tracking/specs/${this.featureName}.md`;
	}

	getPlanUrl() {
		const repo = this.getGitHubRepo();
		const branch = "main";
		return `https://github.com/${repo}/blob/${branch}/.claude/tracking/implementations/${this.featureName}/plan.md`;
	}

	getGitHubRepo() {
		try {
			const remoteUrl = execSync("git remote get-url origin", {
				encoding: "utf-8",
			}).trim();
			const match = remoteUrl.match(/github\.com[:/](.+?)(?:\.git)?$/);
			return match ? match[1] : "owner/repo";
		} catch {
			return "owner/repo";
		}
	}

	generate() {
		// Build the enhanced issue content
		const sections = [];

		// Title and type
		sections.push(`# ${this.data.ISSUE_TYPE}: ${this.data.FEATURE_TITLE}`);
		sections.push("");

		// Executive Summary
		sections.push("## 📋 Executive Summary");
		sections.push(this.data.EXECUTIVE_SUMMARY);
		sections.push("");

		// Problem Statement
		sections.push("## 🎯 Problem Statement");
		sections.push(this.data.PROBLEM_STATEMENT);
		sections.push("");

		if (
			this.data.CURRENT_STATE_DESCRIPTION &&
			this.data.CURRENT_STATE_DESCRIPTION !==
				"Current functionality to be enhanced or replaced."
		) {
			sections.push("### Current State");
			sections.push(this.data.CURRENT_STATE_DESCRIPTION);
			sections.push("");
		}

		if (
			this.data.DESIRED_STATE_DESCRIPTION &&
			this.data.DESIRED_STATE_DESCRIPTION !==
				"Target state after implementation is complete."
		) {
			sections.push("### Desired State");
			sections.push(this.data.DESIRED_STATE_DESCRIPTION);
			sections.push("");
		}

		if (
			this.data.BUSINESS_VALUE &&
			this.data.BUSINESS_VALUE !==
				"Improved user experience and system efficiency."
		) {
			sections.push("### Business Value");
			sections.push(this.data.BUSINESS_VALUE);
			sections.push("");
		}

		// Acceptance Criteria
		sections.push("## ✅ Acceptance Criteria");
		for (const criterion of this.data.ACCEPTANCE_CRITERIA) {
			sections.push(`- [ ] ${criterion}`);
		}
		sections.push("");

		// Technical Approach
		sections.push("## 🛠 Technical Approach");
		sections.push("");

		sections.push("### Architecture Overview");
		sections.push(this.data.ARCHITECTURE_OVERVIEW);
		sections.push("");

		sections.push("### Implementation Strategy");
		sections.push(this.data.IMPLEMENTATION_STRATEGY);
		sections.push("");

		if (this.data.KEY_COMPONENTS.length > 0) {
			sections.push("### Key Components");
			for (const component of this.data.KEY_COMPONENTS) {
				sections.push(`- **${component.name}**: ${component.description}`);
			}
			sections.push("");
		}

		// Task Breakdown
		sections.push("## 📊 Task Breakdown");
		sections.push("");

		sections.push("### Summary Metrics");
		sections.push(`- **Total Tasks**: ${this.data.TOTAL_TASKS}`);
		sections.push(
			`- **Parallel Streams**: ${this.data.PARALLEL_STREAMS.length}`,
		);
		sections.push(`- **Estimated Duration**: ${this.data.ESTIMATED_DURATION}`);
		sections.push(`- **Complexity Score**: ${this.data.COMPLEXITY_SCORE}/10`);
		sections.push("");

		if (this.data.TASK_DEPENDENCY_GRAPH) {
			sections.push("### Task Dependency Graph");
			sections.push("```mermaid");
			sections.push(this.data.TASK_DEPENDENCY_GRAPH);
			sections.push("```");
			sections.push("");
		}

		if (this.data.PARALLEL_STREAMS.length > 0) {
			sections.push("### Parallel Task Streams");
			for (let i = 0; i < this.data.PARALLEL_STREAMS.length; i++) {
				const stream = this.data.PARALLEL_STREAMS[i];
				sections.push(`#### Stream ${i + 1}: ${stream.name}`);
				for (const task of stream.tasks) {
					sections.push(`- [ ] **${task.id}**: ${task.name} (~${task.effort})`);
				}
				sections.push("");
			}
		}

		if (this.data.SEQUENTIAL_TASKS.length > 0) {
			sections.push("### Sequential Dependencies");
			for (let i = 0; i < this.data.SEQUENTIAL_TASKS.length; i++) {
				const task = this.data.SEQUENTIAL_TASKS[i];
				sections.push(
					`${i + 1}. [ ] **${task.id}**: ${task.name} (~${task.effort})`,
				);
				if (task.depends_on.length > 0) {
					sections.push(`   - Depends on: ${task.depends_on.join(", ")}`);
				}
			}
			sections.push("");
		}

		// Dependencies
		sections.push("## 📦 Dependencies & Prerequisites");
		sections.push("");

		if (this.data.TECHNICAL_DEPENDENCIES.length > 0) {
			sections.push("### Technical Dependencies");
			for (const dep of this.data.TECHNICAL_DEPENDENCIES) {
				sections.push(`- **${dep.name}** (${dep.version}): ${dep.purpose}`);
			}
			sections.push("");
		}

		sections.push("### Related Issues");
		sections.push(`- Depends on: ${this.data.DEPENDS_ON_ISSUES}`);
		sections.push(`- Blocks: ${this.data.BLOCKS_ISSUES}`);
		sections.push(`- Related to: ${this.data.RELATED_ISSUES}`);
		sections.push("");

		// Implementation Details
		sections.push("## 📁 Implementation Details");
		sections.push("");

		if (this.data.FILES_TO_MODIFY.length > 0) {
			sections.push("### Files to Modify");
			for (const file of this.data.FILES_TO_MODIFY) {
				sections.push(`- \`${file.path}\`: ${file.changes}`);
			}
			sections.push("");
		}

		if (this.data.NEW_FILES.length > 0) {
			sections.push("### New Files to Create");
			for (const file of this.data.NEW_FILES) {
				sections.push(`- \`${file.path}\`: ${file.purpose}`);
			}
			sections.push("");
		}

		if (this.data.DATABASE_CHANGES) {
			sections.push("### Database Changes");
			sections.push(this.data.DATABASE_CHANGES);
			sections.push("");
		}

		// Implementation Phases
		if (this.data.IMPLEMENTATION_PHASES.length > 0) {
			sections.push("## 🚀 Implementation Phases");
			sections.push("");

			for (const phase of this.data.IMPLEMENTATION_PHASES) {
				sections.push(`### Phase ${phase.number}: ${phase.name}`);
				sections.push(`**Duration**: ${phase.duration}`);
				sections.push(`**Objective**: ${phase.objective}`);
				sections.push("");
				sections.push("Tasks:");
				for (const task of phase.tasks) {
					sections.push(`- ${task}`);
				}
				sections.push("");
				sections.push(`**Deliverables**: ${phase.deliverables}`);
				sections.push("");
			}
		}

		// Success Metrics
		sections.push("## 📈 Success Metrics");
		sections.push("");

		if (this.data.PERFORMANCE_TARGETS.length > 0) {
			sections.push("### Performance Targets");
			for (const target of this.data.PERFORMANCE_TARGETS) {
				sections.push(`- ${target.metric}: ${target.target}`);
			}
			sections.push("");
		}

		sections.push("### Quality Gates");
		for (const gate of this.data.QUALITY_GATES) {
			sections.push(`- [ ] ${gate}`);
		}
		sections.push("");

		// Team & Resources
		sections.push("## 👥 Team & Resources");
		sections.push("");

		sections.push("### Recommended Assignees");
		sections.push(`- **Lead**: ${this.data.LEAD_ASSIGNEE}`);
		sections.push(`- **Reviewers**: ${this.data.REVIEWERS}`);
		sections.push(`- **Stakeholders**: ${this.data.STAKEHOLDERS}`);
		sections.push("");

		if (this.data.RECOMMENDED_SPECIALISTS.length > 0) {
			sections.push("### Recommended Specialists");
			for (const specialist of this.data.RECOMMENDED_SPECIALISTS) {
				sections.push(`- **${specialist.role}**: ${specialist.reason}`);
			}
			sections.push("");
		}

		// Resources
		sections.push("## 🔗 Resources & Documentation");
		sections.push("");

		sections.push("### Specifications");
		sections.push(`- [Feature Specification](${this.data.SPEC_URL})`);
		sections.push(`- [Implementation Plan](${this.data.PLAN_URL})`);
		sections.push("");

		if (this.data.EXTERNAL_RESOURCES.length > 0) {
			sections.push("### External Resources");
			for (const resource of this.data.EXTERNAL_RESOURCES) {
				sections.push(
					`- [${resource.title}](${resource.url}): ${resource.description}`,
				);
			}
			sections.push("");
		}

		// Implementation Notes
		if (
			this.data.IMPLEMENTATION_NOTES &&
			this.data.IMPLEMENTATION_NOTES !==
				"See implementation plan for detailed notes."
		) {
			sections.push("## 📝 Implementation Notes");
			sections.push("");
			sections.push(this.data.IMPLEMENTATION_NOTES);
			sections.push("");
		}

		// Metadata
		sections.push("## 🏷 Metadata");
		sections.push("");
		sections.push(`- **Feature ID**: \`${this.data.FEATURE_ID}\``);
		sections.push(`- **Created**: ${this.data.CREATED_DATE}`);
		sections.push(`- **Last Updated**: ${this.data.UPDATED_DATE}`);
		sections.push(`- **Status**: ${this.data.STATUS}`);
		sections.push(`- **Priority**: ${this.data.PRIORITY}`);
		sections.push(`- **Complexity**: ${this.data.COMPLEXITY}`);
		sections.push(`- **Estimated Effort**: ${this.data.TOTAL_EFFORT}`);
		sections.push(`- **Target Release**: ${this.data.TARGET_RELEASE}`);
		sections.push("");

		// Footer
		sections.push("---");
		sections.push(
			"*This issue was generated from CCPM Implementation Plan using the enhanced tracking system.*",
		);
		sections.push(
			`*Source: \`.claude/tracking/implementations/${this.data.FEATURE_ID}/\`*`,
		);

		return sections.join("\n");
	}

	getLabels() {
		return this.data.LABELS.join(",");
	}
}

/**
 * Main execution
 */
function main() {
	const args = process.argv.slice(2);

	if (args.length === 0) {
		console.error(
			"Usage: node enhance-github-issue.js <feature-name> [options]",
		);
		console.error("Options:");
		console.error("  --type <feature|task>  Issue type (default: feature)");
		console.error(
			"  --output <path>        Output file path (default: stdout)",
		);
		console.error("  --labels-only         Output only the labels");
		process.exit(1);
	}

	const featureName = args[0];
	const options = {};

	// Parse options
	for (let i = 1; i < args.length; i++) {
		if (args[i] === "--type" && i + 1 < args.length) {
			options.type = args[++i];
		} else if (args[i] === "--output" && i + 1 < args.length) {
			options.output = args[++i];
		} else if (args[i] === "--labels-only") {
			options.labelsOnly = true;
		}
	}

	try {
		const generator = new EnhancedIssueGenerator(featureName, options);

		if (options.labelsOnly) {
			console.log(generator.getLabels());
		} else {
			const content = generator.generate();

			if (options.output) {
				fs.writeFileSync(options.output, content, "utf-8");
				console.log(`Enhanced issue saved to: ${options.output}`);
				console.log(`Labels: ${generator.getLabels()}`);
			} else {
				console.log(content);
			}
		}
	} catch (error) {
		console.error(`Error: ${error.message}`);
		process.exit(1);
	}
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
	main();
}

export {
	ContentExtractor,
	TaskProcessor,
	MetadataGenerator,
	EnhancedIssueGenerator,
};
