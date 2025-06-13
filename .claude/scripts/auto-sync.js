#!/usr/bin/env node

/**
 * Auto-sync integration wrapper
 * Simple interface for auto-syncing GitHub issues during debug workflows
 */

import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
	autoSyncIfNeeded,
	convertToLocalFormat,
	fetchGitHubIssue,
} from "./issue-sync.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, "../..");
const ISSUES_DIR = join(PROJECT_ROOT, ".claude/issues");

/**
 * Auto-sync for debug-issue command
 * Returns the local file path for the issue
 */
async function autoSyncForDebug(issueReference) {
	// Parse different reference formats
	let issueNumber = null;

	if (/^\d+$/.test(issueReference)) {
		// Plain number: "123"
		issueNumber = Number.parseInt(issueReference);
	} else if (issueReference.startsWith("ISSUE-")) {
		// ISSUE format: "ISSUE-123"
		const match = issueReference.match(/^ISSUE-(\d+)$/);
		if (match) {
			issueNumber = Number.parseInt(match[1]);
		}
	} else if (issueReference.startsWith("#")) {
		// Hash format: "#123"
		issueNumber = Number.parseInt(issueReference.slice(1));
	} else if (issueReference.startsWith("http")) {
		// URL format: extract issue number
		const match = issueReference.match(/\/issues\/(\d+)/);
		if (match) {
			issueNumber = Number.parseInt(match[1]);
		}
	}

	if (!issueNumber) {
		throw new Error(`Cannot parse issue reference: ${issueReference}`);
	}

	console.log(`🔧 Debug auto-sync: Processing issue #${issueNumber}`);

	try {
		// Attempt auto-sync
		const result = await autoSyncIfNeeded(issueNumber);

		if (result.error) {
			console.log("⚠️ Auto-sync failed, fetching directly from GitHub...");
			// Fallback: fetch from GitHub without caching
			const issue = await fetchGitHubIssue(issueNumber);
			return {
				issueData: issue,
				localPath: null,
				source: "github-direct",
			};
		}

		if (result.alreadyCached) {
			console.log(`✅ Using cached local file: ${result.path}`);
			return {
				issueData: null,
				localPath: result.path,
				source: "local-cache",
			};
		}

		if (result.filename) {
			console.log(`✅ Auto-synced to: ${result.filename}`);
			return {
				issueData: null,
				localPath: result.filename,
				source: "auto-synced",
			};
		}
	} catch (error) {
		console.log(`⚠️ Auto-sync error: ${error.message}`);
		console.log("🔄 Falling back to direct GitHub fetch...");

		// Final fallback: direct fetch
		try {
			const issue = await fetchGitHubIssue(issueNumber);
			return {
				issueData: issue,
				localPath: null,
				source: "github-fallback",
			};
		} catch (githubError) {
			throw new Error(
				`Both auto-sync and GitHub fallback failed: ${githubError.message}`,
			);
		}
	}
}

/**
 * Create temporary local file for immediate use
 */
async function createTempLocalFile(issueData) {
	const localContent = convertToLocalFormat(issueData);
	const datePrefix = new Date(issueData.created_at).toISOString().split("T")[0];
	const tempPath = join(
		ISSUES_DIR,
		`${datePrefix}-ISSUE-${issueData.number}.md`,
	);

	await writeFile(tempPath, localContent, "utf8");
	console.log(`📝 Created temporary local file: ${tempPath}`);

	return tempPath;
}

/**
 * Main integration function for debug workflows
 */
async function debugIntegration(issueReference) {
	try {
		const result = await autoSyncForDebug(issueReference);

		if (result.localPath) {
			// We have a local file to work with
			return {
				success: true,
				localPath: result.localPath,
				source: result.source,
				message: `Ready to debug using ${result.source} data`,
			};
		}
		if (result.issueData) {
			// We have GitHub data, create temp local file
			const tempPath = await createTempLocalFile(result.issueData);
			return {
				success: true,
				localPath: tempPath,
				source: result.source,
				message: `Created temporary local file from ${result.source}`,
			};
		}

		throw new Error("Unexpected result from auto-sync");
	} catch (error) {
		return {
			success: false,
			error: error.message,
			message: `Failed to auto-sync issue: ${error.message}`,
		};
	}
}

// Export for programmatic use
export { autoSyncForDebug, debugIntegration, createTempLocalFile };

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
	const args = process.argv.slice(2);

	if (args.length === 0) {
		console.log(`
Usage: node auto-sync.js <issue_reference>

Examples:
  node auto-sync.js 30           # Auto-sync issue #30
  node auto-sync.js ISSUE-30     # Auto-sync ISSUE-30
  node auto-sync.js "#30"        # Auto-sync issue #30
`);
		process.exit(1);
	}

	const issueReference = args[0];

	try {
		const result = await debugIntegration(issueReference);

		if (result.success) {
			console.log(`✅ ${result.message}`);
			console.log(`📁 Local file: ${result.localPath}`);
			console.log(`📊 Source: ${result.source}`);
		} else {
			console.error(`❌ ${result.message}`);
			process.exit(1);
		}
	} catch (error) {
		console.error("❌ Integration failed:", error.message);
		process.exit(1);
	}
}
