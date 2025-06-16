#!/usr/bin/env node

/**
 * GitHub Issues Auto-Sync Service
 * Automatically syncs GitHub issues to local cache files for search/grep functionality
 */

import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

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
			// Inform user that issues directory was created
			process.stdout.write(`📁 Created issues directory: ${ISSUES_DIR}\n`);
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
		headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
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
		// Fetch error reporting
		process.stderr.write(
			`❌ Failed to fetch issue #${issueNumber}: ${error.message}\n`,
		);
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
		// Fetch progress notification
		process.stdout.write(`🔍 Fetching issue #${issueNumber} from GitHub...\n`);

		await ensureIssuesDirectory();

		const issue = await fetchGitHubIssue(issueNumber);
		const localContent = convertToLocalFormat(issue);
		const filename = getLocalFilename(issue);

		await writeFile(filename, localContent, "utf8");

		// Sync success notification
		process.stdout.write(`✅ Synced issue #${issueNumber} to ${filename}\n`);

		return {
			issueNumber: issue.number,
			title: issue.title,
			filename: filename,
			synced: new Date().toISOString(),
		};
	} catch (error) {
		// Sync error reporting
		process.stderr.write(
			`❌ Failed to sync issue #${issueNumber}: ${error.message}\n`,
		);
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
		} catch (_error) {
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
			// Cache status notification
			process.stdout.write(
				`🔄 Local cache ${cache.exists ? "stale" : "missing"} for issue #${issueNumber}, syncing...\n`,
			);
			return await syncIssue(issueNumber);
		}
		// Cache up-to-date notification
		process.stdout.write(
			`✅ Local cache up-to-date for issue #${issueNumber}\n`,
		);
		return { alreadyCached: true, path: cache.path };
	} catch (error) {
		// Auto-sync failure warning
		process.stderr.write(
			`⚠️ Auto-sync failed for issue #${issueNumber}, continuing with GitHub data: ${error.message}\n`,
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
	} catch (_error) {
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
		// Usage instructions output
		process.stdout.write(`
Usage: node issue-sync.js <issue_number>

Examples:
  node issue-sync.js 30          # Sync issue #30
  node issue-sync.js --help      # Show this help
`);
		process.exit(1);
	}

	if (args[0] === "--help") {
		// Help message output
		process.stdout.write("GitHub Issues Auto-Sync Service\n");
		process.stdout.write(
			"Syncs GitHub issues to local cache files for search functionality\n",
		);
		process.exit(0);
	}

	const issueNumber = Number.parseInt(args[0]);

	if (Number.isNaN(issueNumber)) {
		// Validation error output
		process.stderr.write("❌ Issue number must be a valid integer\n");
		process.exit(1);
	}

	try {
		const result = await autoSyncIfNeeded(issueNumber);
		if (result.issueNumber) {
			await updateSyncMetadata(result);
		}
		// Success completion output
		process.stdout.write("🎉 Sync completed successfully!\n");
	} catch (error) {
		// Failure output
		process.stderr.write(`❌ Sync failed: ${error.message}\n`);
		process.exit(1);
	}
}
