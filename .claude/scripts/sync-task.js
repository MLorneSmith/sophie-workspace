#!/usr/bin/env node

/**
 * Task Sync Script
 *
 * Syncs GitHub task issues to local files for the do-task command.
 * Handles various input formats and maintains a 1-hour cache.
 *
 * Usage:
 *   node sync-task.js 124                    # GitHub issue #124
 *   node sync-task.js TASK-124               # TASK-124 format
 *   node sync-task.js "#124"                 # Hash format
 *   node sync-task.js "https://..."          # Full GitHub URL
 */

import { exec } from "node:child_process";
import { promises as fs } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
async function loadEnvLocal() {
	try {
		const envPath = join(__dirname, "../../.env.local");
		const envContent = await fs.readFile(envPath, "utf8");

		envContent
			.split("\n")
			.filter((line) => line.trim() && !line.startsWith("#"))
			.forEach((line) => {
				const [key, ...valueParts] = line.split("=");
				if (key && valueParts.length > 0) {
					const value = valueParts.join("=").trim();
					// Only set if not already present (don't override existing env vars)
					if (!process.env[key.trim()]) {
						process.env[key.trim()] = value;
					}
				}
			});
	} catch (error) {
		// Silently fail if .env.local doesn't exist - it's optional
	}
}

// Configuration
const GITHUB_OWNER = "MLorneSmith";
const GITHUB_REPO = "2025slideheroes";
const TASKS_DIR = join(__dirname, "../../.claude/z.archive/tasks");
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

// Ensure tasks directory exists
async function ensureTasksDir() {
	try {
		await fs.mkdir(TASKS_DIR, { recursive: true });
	} catch (error) {
		console.error("Failed to create tasks directory:", error);
	}
}

// Parse various input formats to extract issue number
function parseTaskReference(input) {
	if (!input) {
		throw new Error("No task reference provided");
	}

	// Remove quotes if present
	input = input.replace(/^["']|["']$/g, "");

	// Direct number: 124
	if (/^\d+$/.test(input)) {
		return parseInt(input);
	}

	// TASK-124 format
	const taskMatch = input.match(/^TASK-(\d+)$/i);
	if (taskMatch) {
		return parseInt(taskMatch[1]);
	}

	// #124 format
	const hashMatch = input.match(/^#(\d+)$/);
	if (hashMatch) {
		return parseInt(hashMatch[1]);
	}

	// GitHub URL format
	const urlMatch = input.match(/github\.com\/[^/]+\/[^/]+\/issues\/(\d+)/);
	if (urlMatch) {
		return parseInt(urlMatch[1]);
	}

	// Legacy local format (not synced, just return as-is)
	if (/^TASK-\d+-\w+$/.test(input)) {
		return null; // Indicates local-only task
	}

	throw new Error(`Invalid task reference format: ${input}`);
}

// Check if local cache exists and is fresh
async function checkLocalCache(issueNumber) {
	try {
		// Find files matching the pattern
		const files = await fs.readdir(TASKS_DIR);
		const pattern = new RegExp(`-TASK-${issueNumber}\\.md$`);
		const matchingFile = files.find((f) => pattern.test(f));

		if (!matchingFile) {
			return { exists: false };
		}

		const filePath = join(TASKS_DIR, matchingFile);
		const stats = await fs.stat(filePath);
		const age = Date.now() - stats.mtime.getTime();

		return {
			exists: true,
			path: filePath,
			fresh: age < CACHE_DURATION,
			age: Math.floor(age / 1000 / 60), // age in minutes
		};
	} catch (error) {
		return { exists: false };
	}
}

// Fetch task from GitHub
async function fetchFromGitHub(issueNumber) {
	console.log(`📥 Fetching task #${issueNumber} from GitHub...`);

	try {
		// Fetch issue details
		const { stdout: issueJson } = await execAsync(
			`gh issue view ${issueNumber} --repo ${GITHUB_OWNER}/${GITHUB_REPO} --json number,title,body,state,labels,assignees,createdAt,milestone`,
		);

		const issue = JSON.parse(issueJson);

		// Fetch comments
		const { stdout: commentsJson } = await execAsync(
			`gh issue view ${issueNumber} --repo ${GITHUB_OWNER}/${GITHUB_REPO} --json comments`,
		);

		const { comments } = JSON.parse(commentsJson);

		return { issue, comments };
	} catch (error) {
		throw new Error(`Failed to fetch task from GitHub: ${error.message}`);
	}
}

// Convert GitHub issue to task format
function formatAsTask(issue, comments) {
	const labels = issue.labels.map((l) => l.name);
	const priority =
		labels.find((l) => ["critical", "high", "medium", "low"].includes(l)) ||
		"medium";
	const taskType =
		labels.find((l) =>
			[
				"feature",
				"enhancement",
				"refactor",
				"documentation",
				"testing",
				"infrastructure",
			].includes(l),
		) || "feature";

	// Extract sections from the issue body
	const body = issue.body || "";
	const sections = extractSections(body);

	// Look for progress updates in comments
	const progressComments = comments.filter(
		(c) =>
			c.body.includes("IMPLEMENTATION PROGRESS UPDATE") ||
			c.body.includes("Phase Completed"),
	);

	let content = `# Task: ${issue.title}

**ID**: TASK-${issue.number}
**Created**: ${issue.createdAt}
**Assignee**: ${issue.assignees.map((a) => a.login).join(", ") || "Unassigned"}
**Priority**: ${priority}
**Status**: ${issue.state}
**Type**: ${taskType}
**GitHub URL**: https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/issues/${issue.number}

${body}`;

	// Add progress section if there are updates
	if (progressComments.length > 0) {
		content += "\n\n## 📊 Implementation Progress\n\n";
		content += `**Latest Update**: ${progressComments[0].createdAt}\n\n`;

		// Include the most recent progress comment
		const latestProgress = progressComments[0].body;
		content += latestProgress;
	}

	// Add all comments for reference
	if (comments.length > 0) {
		content += "\n\n## 💬 GitHub Comments\n\n";
		comments.forEach((comment, index) => {
			content += `### Comment ${index + 1} by @${comment.author.login} (${comment.createdAt})\n\n`;
			content += comment.body + "\n\n";
		});
	}

	// Add sync metadata
	content += "\n---\n**Sync Metadata**\n";
	content += `- Synced: ${new Date().toISOString()}\n`;
	content += `- Source: GitHub Issue #${issue.number}\n`;
	content += "- Cache Duration: 1 hour\n";

	return content;
}

// Extract sections from issue body
function extractSections(body) {
	const sections = {};
	const sectionRegex = /^##\s+(.+)$/gm;
	let match;
	let lastSection = null;
	let lastIndex = 0;

	while ((match = sectionRegex.exec(body)) !== null) {
		if (lastSection) {
			sections[lastSection] = body.substring(lastIndex, match.index).trim();
		}
		lastSection = match[1].trim();
		lastIndex = match.index + match[0].length;
	}

	if (lastSection) {
		sections[lastSection] = body.substring(lastIndex).trim();
	}

	return sections;
}

// Save task to local file
async function saveToLocal(issueNumber, content) {
	const date = new Date().toISOString().split("T")[0];
	const filename = `${date}-TASK-${issueNumber}.md`;
	const filepath = join(TASKS_DIR, filename);

	await fs.writeFile(filepath, content, "utf8");
	console.log(`💾 Saved to: ${filepath}`);

	return filepath;
}

// Clean up old cache files for the same task
async function cleanupOldCache(issueNumber) {
	try {
		const files = await fs.readdir(TASKS_DIR);
		const pattern = new RegExp(`-TASK-${issueNumber}\\.md$`);
		const matchingFiles = files.filter((f) => pattern.test(f));

		// Sort by date (newest first)
		matchingFiles.sort().reverse();

		// Keep only the newest file
		for (let i = 1; i < matchingFiles.length; i++) {
			const oldFile = join(TASKS_DIR, matchingFiles[i]);
			await fs.unlink(oldFile);
			console.log(`🗑️  Removed old cache: ${matchingFiles[i]}`);
		}
	} catch (error) {
		console.error("Error cleaning up old cache:", error);
	}
}

// Main sync function
async function syncTask(taskReference) {
	// Load environment variables first
	await loadEnvLocal();
	await ensureTasksDir();

	// Parse input
	const issueNumber = parseTaskReference(taskReference);

	if (!issueNumber) {
		console.log(`ℹ️  Local task format detected: ${taskReference}`);
		console.log("📁 Please use the local file directly");
		return;
	}

	console.log(`🔍 Syncing task #${issueNumber}...`);

	// Check local cache
	const cache = await checkLocalCache(issueNumber);

	if (cache.exists && cache.fresh) {
		console.log(
			`✅ Using cached file (${cache.age} minutes old): ${cache.path}`,
		);
		return cache.path;
	}

	if (cache.exists && !cache.fresh) {
		console.log(`🔄 Cache expired (${cache.age} minutes old), refreshing...`);
	}

	// Fetch from GitHub
	try {
		const { issue, comments } = await fetchFromGitHub(issueNumber);

		// Format as task
		const content = formatAsTask(issue, comments);

		// Save locally
		const filepath = await saveToLocal(issueNumber, content);

		// Clean up old cache files
		await cleanupOldCache(issueNumber);

		console.log("✅ Task synced successfully!");
		console.log(`📋 Title: ${issue.title}`);
		console.log(`🏷️  Labels: ${issue.labels.map((l) => l.name).join(", ")}`);
		console.log(`💬 Comments: ${comments.length}`);

		return filepath;
	} catch (error) {
		console.error("❌ Sync failed:", error.message);

		if (cache.exists) {
			console.log(`⚠️  Using stale cache: ${cache.path}`);
			return cache.path;
		}

		process.exit(1);
	}
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
	const taskRef = process.argv[2];

	if (!taskRef) {
		console.error("Usage: node sync-task.js <task_reference>");
		console.error("Examples:");
		console.error("  node sync-task.js 124");
		console.error("  node sync-task.js TASK-124");
		console.error('  node sync-task.js "#124"');
		console.error(
			'  node sync-task.js "https://github.com/MLorneSmith/2025slideheroes/issues/124"',
		);
		process.exit(1);
	}

	syncTask(taskRef).catch((error) => {
		console.error("Fatal error:", error);
		process.exit(1);
	});
}

export { syncTask, parseTaskReference };
