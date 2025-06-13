#!/usr/bin/env node

/**
 * GitHub Issues Auto-Sync Service
 * Automatically syncs GitHub issues to local cache files for search/grep functionality
 */

import { readFile, writeFile, stat, mkdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, "../..");
const ISSUES_DIR = join(PROJECT_ROOT, ".claude/issues");

// GitHub API configuration
const GITHUB_API_BASE = "https://api.github.com";
const REPO_OWNER = "MLorneSmith";
const REPO_NAME = "2025slideheroes";

/**
 * Ensures the issues directory exists
 */
async function ensureIssuesDirectory() {
	try {
		await stat(ISSUES_DIR);
	} catch (error) {
		if (error.code === "ENOENT") {
			await mkdir(ISSUES_DIR, { recursive: true });
			console.log(`📁 Created issues directory: ${ISSUES_DIR}`);
		} else {
			throw error;
		}
	}
}

/**
 * Fetches a GitHub issue by number
 */
async function fetchGitHubIssue(issueNumber) {
	const url = `${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/issues/${issueNumber}`;

	const headers = {
		Accept: "application/vnd.github.v3+json",
		"User-Agent": "Claude-Issue-Sync/1.0",
	};

	// Add authentication if token is available
	if (process.env.GITHUB_TOKEN) {
		headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
	}

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
		console.error(`❌ Failed to fetch issue #${issueNumber}:`, error.message);
		throw error;
	}
}

/**
 * Converts GitHub issue to local cache format
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
- Status: auto-sync cache (read-only)
- Source: GitHub (authoritative)`;
}

/**
 * Generates local filename for an issue
 */
function getLocalFilename(issue) {
	const datePrefix = new Date(issue.created_at).toISOString().split("T")[0];
	return join(ISSUES_DIR, `${datePrefix}-ISSUE-${issue.number}.md`);
}

/**
 * Syncs a single GitHub issue to local cache
 */
async function syncIssue(issueNumber) {
	try {
		console.log(`🔍 Fetching issue #${issueNumber} from GitHub...`);

		await ensureIssuesDirectory();

		const issue = await fetchGitHubIssue(issueNumber);
		const localContent = convertToLocalFormat(issue);
		const filename = getLocalFilename(issue);

		await writeFile(filename, localContent, "utf8");

		console.log(`✅ Synced issue #${issueNumber} to ${filename}`);

		return {
			issueNumber: issue.number,
			title: issue.title,
			filename: filename,
			synced: new Date().toISOString(),
		};
	} catch (error) {
		console.error(`❌ Failed to sync issue #${issueNumber}:`, error.message);
		throw error;
	}
}

/**
 * Checks if local cache exists and if it's stale
 */
async function checkLocalCache(issueNumber) {
	const datePrefix = new Date().toISOString().split("T")[0]; // Today's date as fallback
	const possiblePaths = [
		join(ISSUES_DIR, `*-ISSUE-${issueNumber}.md`),
		join(ISSUES_DIR, `${datePrefix}-ISSUE-${issueNumber}.md`),
	];

	// Simple check - in real implementation you'd use glob
	for (const path of possiblePaths) {
		try {
			const stats = await stat(path.replace("*", datePrefix));
			const ageInHours =
				(Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60);

			return {
				exists: true,
				path: path,
				isStale: ageInHours > 24, // Consider stale if older than 24 hours
			};
		} catch (error) {
			// File doesn't exist, continue checking
		}
	}

	return {
		exists: false,
		path: null,
		isStale: true,
	};
}

/**
 * Auto-syncs an issue if needed (main function for integration)
 */
async function autoSyncIfNeeded(issueNumber) {
	try {
		const cache = await checkLocalCache(issueNumber);

		if (!cache.exists || cache.isStale) {
			console.log(
				`🔄 Local cache ${cache.exists ? "stale" : "missing"} for issue #${issueNumber}, syncing...`,
			);
			return await syncIssue(issueNumber);
		} else {
			console.log(`✅ Local cache up-to-date for issue #${issueNumber}`);
			return { alreadyCached: true, path: cache.path };
		}
	} catch (error) {
		console.error(
			`⚠️ Auto-sync failed for issue #${issueNumber}, continuing with GitHub data:`,
			error.message,
		);
		return { error: error.message };
	}
}

/**
 * Updates sync metadata file
 */
async function updateSyncMetadata(syncResult) {
	const metadataPath = join(ISSUES_DIR, "sync-metadata.json");

	let metadata = {
		lastSync: new Date().toISOString(),
		syncedIssues: [],
		totalSyncs: 0,
	};

	// Try to read existing metadata
	try {
		const existing = await readFile(metadataPath, "utf8");
		metadata = { ...metadata, ...JSON.parse(existing) };
	} catch (error) {
		// File doesn't exist yet, use defaults
	}

	// Update metadata
	metadata.lastSync = new Date().toISOString();
	metadata.totalSyncs = (metadata.totalSyncs || 0) + 1;

	if (syncResult.issueNumber) {
		// Remove any existing entry for this issue
		metadata.syncedIssues = metadata.syncedIssues.filter(
			(issue) => issue.number !== syncResult.issueNumber,
		);

		// Add new entry
		metadata.syncedIssues.push({
			number: syncResult.issueNumber,
			title: syncResult.title,
			filename: syncResult.filename,
			synced: syncResult.synced,
		});
	}

	await writeFile(metadataPath, JSON.stringify(metadata, null, 2));
}

// Export functions for programmatic use
export {
	syncIssue,
	autoSyncIfNeeded,
	fetchGitHubIssue,
	convertToLocalFormat,
	checkLocalCache,
	updateSyncMetadata,
};

// CLI functionality
if (import.meta.url === `file://${process.argv[1]}`) {
	const args = process.argv.slice(2);

	if (args.length === 0) {
		console.log(`
Usage: node issue-sync.js <issue_number>

Examples:
  node issue-sync.js 30          # Sync issue #30
  node issue-sync.js --help      # Show this help
`);
		process.exit(1);
	}

	if (args[0] === "--help") {
		console.log("GitHub Issues Auto-Sync Service");
		console.log(
			"Syncs GitHub issues to local cache files for search functionality",
		);
		process.exit(0);
	}

	const issueNumber = Number.parseInt(args[0]);

	if (isNaN(issueNumber)) {
		console.error("❌ Issue number must be a valid integer");
		process.exit(1);
	}

	try {
		const result = await autoSyncIfNeeded(issueNumber);
		if (result.issueNumber) {
			await updateSyncMetadata(result);
		}
		console.log("🎉 Sync completed successfully!");
	} catch (error) {
		console.error("❌ Sync failed:", error.message);
		process.exit(1);
	}
}
