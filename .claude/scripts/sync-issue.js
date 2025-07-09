#!/usr/bin/env node

/**
 * GitHub Issue Sync Service
 * Fetches GitHub issues and caches them locally for debugging workflows
 *
 * Usage: node sync-issue.js <issue_reference>
 *
 * Supported formats:
 *   - Issue number: 30
 *   - ISSUE format: ISSUE-30
 *   - Hash format: #30
 *   - GitHub URL: https://github.com/MLorneSmith/2025slideheroes/issues/30
 */

import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, "../..");
const ISSUES_DIR = join(PROJECT_ROOT, ".claude/z.archive/issues");

// Load environment variables from .env.local
async function loadEnvLocal() {
	try {
		const envPath = join(PROJECT_ROOT, ".env.local");
		const envContent = await readFile(envPath, "utf8");

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

// Load environment variables immediately
await loadEnvLocal();

// GitHub API configuration
const GITHUB_API_BASE = "https://api.github.com";
const REPO_OWNER = "MLorneSmith";
const REPO_NAME = "2025slideheroes";

// Cache settings
const CACHE_DURATION_MS = 3600000; // 1 hour

/**
 * Ensures the issues directory exists
 */
async function ensureIssuesDirectory() {
	try {
		await stat(ISSUES_DIR);
	} catch (error) {
		if (error.code === "ENOENT") {
			await mkdir(ISSUES_DIR, { recursive: true });
			process.stdout.write(`📁 Created issues directory: ${ISSUES_DIR}\n`);
		} else {
			throw error;
		}
	}
}

/**
 * Parses various issue reference formats into issue number
 */
function parseIssueReference(reference) {
	// Plain number: "123"
	if (/^\d+$/.test(reference)) {
		return parseInt(reference);
	}

	// ISSUE format: "ISSUE-123"
	if (reference.startsWith("ISSUE-")) {
		const match = reference.match(/^ISSUE-(\d+)$/);
		return match ? parseInt(match[1]) : null;
	}

	// Hash format: "#123"
	if (reference.startsWith("#")) {
		return parseInt(reference.slice(1));
	}

	// URL format: extract issue number
	if (reference.includes("github.com")) {
		const match = reference.match(/\/issues\/(\d+)/);
		return match ? parseInt(match[1]) : null;
	}

	return null;
}

/**
 * Fetches a GitHub issue by number
 */
async function fetchGitHubIssue(issueNumber) {
	const url = `${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/issues/${issueNumber}`;

	const headers = {
		Accept: "application/vnd.github.v3+json",
		"User-Agent": "Claude-Issue-Sync/2.0",
	};

	// Add authentication if token is available
	if (process.env.GITHUB_TOKEN) {
		headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
	}

	process.stdout.write(`🔍 Fetching issue #${issueNumber} from GitHub...\n`);

	try {
		const response = await fetch(url, { headers });

		if (!response.ok) {
			if (response.status === 404) {
				throw new Error(`Issue #${issueNumber} not found`);
			}
			throw new Error(
				`GitHub API error: ${response.status} ${response.statusText}`,
			);
		}

		return await response.json();
	} catch (error) {
		process.stderr.write(
			`❌ Failed to fetch issue #${issueNumber}: ${error.message}\n`,
		);
		throw error;
	}
}

/**
 * Converts GitHub issue to local markdown format
 */
function convertToLocalFormat(issue) {
	const labels = issue.labels.map((l) => l.name).join(", ");

	return `# Issue: ${issue.title}

**ID**: ISSUE-${issue.number}
**Created**: ${issue.created_at}
**Updated**: ${issue.updated_at}
**Reporter**: ${issue.user.login}
**Status**: ${issue.state}
**Labels**: ${labels}

## GitHub Issue Content

${issue.body || "No description provided."}

---
**Auto-Generated Local Cache**
- GitHub Issue: #${issue.number}
- GitHub URL: ${issue.html_url}
- Cached: ${new Date().toISOString()}
`;
}

/**
 * Gets the local file path for an issue
 */
function getLocalFilePath(issueNumber, createdAt) {
	const datePrefix = new Date(createdAt).toISOString().split("T")[0];
	return join(ISSUES_DIR, `${datePrefix}-ISSUE-${issueNumber}.md`);
}

/**
 * Checks if local cache exists and is fresh
 */
async function checkLocalCache(issueNumber) {
	try {
		// Try to find existing file
		const files = await require("node:fs").promises.readdir(ISSUES_DIR);
		const issueFile = files.find((f) => f.includes(`ISSUE-${issueNumber}.md`));

		if (!issueFile) {
			return { exists: false };
		}

		const filePath = join(ISSUES_DIR, issueFile);
		const stats = await stat(filePath);
		const age = Date.now() - stats.mtime.getTime();

		return {
			exists: true,
			path: filePath,
			fresh: age < CACHE_DURATION_MS,
			age: Math.round(age / 1000 / 60), // age in minutes
		};
	} catch {
		return { exists: false };
	}
}

/**
 * Main sync function
 */
async function syncIssue(issueReference) {
	// Parse issue reference
	const issueNumber = parseIssueReference(issueReference);
	if (!issueNumber) {
		throw new Error(`Cannot parse issue reference: ${issueReference}`);
	}

	process.stdout.write(`🔧 Processing issue #${issueNumber}\n`);

	// Ensure directory exists
	await ensureIssuesDirectory();

	// Check local cache
	const cache = await checkLocalCache(issueNumber);

	if (cache.exists && cache.fresh) {
		process.stdout.write(
			`✅ Using cached file (${cache.age} minutes old): ${cache.path}\n`,
		);
		return {
			success: true,
			localPath: cache.path,
			source: "cache",
			issueNumber,
		};
	}

	if (cache.exists && !cache.fresh) {
		process.stdout.write(
			`♻️  Cache expired (${cache.age} minutes old), refreshing...\n`,
		);
	}

	// Fetch from GitHub
	try {
		const issue = await fetchGitHubIssue(issueNumber);
		const localContent = convertToLocalFormat(issue);
		const localPath = getLocalFilePath(issueNumber, issue.created_at);

		// Write to local file
		await writeFile(localPath, localContent, "utf8");
		process.stdout.write(`✅ Synced to local file: ${localPath}\n`);

		return {
			success: true,
			localPath,
			source: "github",
			issueNumber,
		};
	} catch (error) {
		// If fetch fails but we have stale cache, use it
		if (cache.exists) {
			process.stdout.write(
				`⚠️  GitHub fetch failed, using stale cache: ${cache.path}\n`,
			);
			return {
				success: true,
				localPath: cache.path,
				source: "stale-cache",
				issueNumber,
			};
		}
		throw error;
	}
}

/**
 * CLI interface
 */
async function main() {
	const args = process.argv.slice(2);

	if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
		process.stdout.write(`
GitHub Issue Sync Service v2.0

Usage: node sync-issue.js <issue_reference>

Supported formats:
  node sync-issue.js 30           # Issue number
  node sync-issue.js ISSUE-30     # ISSUE format
  node sync-issue.js "#30"        # Hash format
  node sync-issue.js https://github.com/MLorneSmith/2025slideheroes/issues/30

Environment variables:
  GITHUB_TOKEN     GitHub personal access token for API authentication

Cache behavior:
  - Issues are cached locally for 1 hour
  - Fresh cache is used without fetching from GitHub
  - Expired cache is refreshed automatically
  - Stale cache is used as fallback if GitHub is unavailable

Output:
  The script outputs the path to the local file for use in debugging workflows.
`);
		process.exit(0);
	}

	const issueReference = args[0];

	try {
		const result = await syncIssue(issueReference);

		// Output for script integration
		process.stdout.write("\n📊 Summary:\n");
		process.stdout.write(`  Issue: #${result.issueNumber}\n`);
		process.stdout.write(`  Source: ${result.source}\n`);
		process.stdout.write(`  Path: ${result.localPath}\n`);

		// Exit successfully
		process.exit(0);
	} catch (error) {
		process.stderr.write(`\n❌ Error: ${error.message}\n`);
		process.exit(1);
	}
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
	main();
}

// Export for potential future use
export { syncIssue, parseIssueReference, fetchGitHubIssue };
