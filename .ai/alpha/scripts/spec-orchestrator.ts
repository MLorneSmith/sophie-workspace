#!/usr/bin/env tsx

/**

* Alpha Spec Orchestrator
*
* Manages E2B sandboxes and agent sessions (Claude by default, GPT via Codex optional) to implement all features
* across all initiatives in a spec.
*
* Key features:
* * Takes Spec ID (not Initiative ID)
* * Work queue pattern: sandboxes dynamically pull next available feature
* * Dependency-aware: features only assigned when dependencies are complete
* * Auto-resume: reads progress on startup, continues where left off
*
* Usage:
* tsx spec-orchestrator.ts <spec-id> [options]
*
* Options:
* --sandboxes <n>   Number of sandboxes (default: 3, max: 3)
* --timeout <s>     Sandbox timeout in seconds (default: 3600)
* --dry-run         Show plan without executing
*
* Examples:
* tsx spec-orchestrator.ts 1362
* tsx spec-orchestrator.ts 1362 --sandboxes 1
* tsx spec-orchestrator.ts 1362 --dry-run
 */

import * as fs from "node:fs";
import * as path from "node:path";
import process from "node:process";

// ============================================================================
// Load .env file (before any other imports that use env vars)
// ============================================================================

/**
 * Parse a single env file and set environment variables.
 * Skips gracefully if file doesn't exist.
 * Preserves existing env vars (doesn't override).
 */
function parseEnvFile(filePath: string): void {
	if (!fs.existsSync(filePath)) {
		return;
	}

	const content = fs.readFileSync(filePath, "utf-8");
	for (const line of content.split("\n")) {
		const trimmed = line.trim();
		// Skip comments and empty lines
		if (!trimmed || trimmed.startsWith("#")) continue;
		// Parse KEY=VALUE (handle values with = in them)
		const eqIndex = trimmed.indexOf("=");
		if (eqIndex > 0) {
			const key = trimmed.slice(0, eqIndex).trim();
			let value = trimmed.slice(eqIndex + 1).trim();
			// Remove surrounding quotes if present
			if (
				(value.startsWith('"') && value.endsWith('"')) ||
				(value.startsWith("'") && value.endsWith("'"))
			) {
				value = value.slice(1, -1);
			}
			// Only set if not already defined (env vars take precedence)
			if (process.env[key] === undefined) {
				process.env[key] = value;
			}
		}
	}
}

/**
 * Load environment variables from multiple env files in priority order.
 * Files loaded later can only set NEW vars (won't override earlier values).
 * Shell-set env vars always take precedence over all file values.
 */
function loadEnvFile(): void {
	// Find project root by looking for .git directory (the actual repo root)
	let currentDir = import.meta.dirname;
	let projectRoot: string | null = null;

	while (currentDir !== "/") {
		const gitPath = path.join(currentDir, ".git");
		if (fs.existsSync(gitPath)) {
			projectRoot = currentDir;
			break;
		}
		currentDir = path.dirname(currentDir);
	}

	if (!projectRoot) {
		return;
	}

	// Load env files in priority order (first file's values take precedence)
	const envFiles = [
		path.join(projectRoot, ".env"),
		path.join(projectRoot, "apps/e2e/.env.local"),
		path.join(projectRoot, "apps/web/.env.local"),
	];

	for (const envFile of envFiles) {
		parseEnvFile(envFile);
	}
}

loadEnvFile();

import { parseArgs, showHelp } from "./cli/index.js";
import { orchestrate } from "./lib/index.js";
import { releaseLock } from "./lib/lock.js";

// ============================================================================
// Global Error Handler
// ============================================================================

/**
 * Handle unhandled promise rejections.
 * Ensures lock is released even if an async error escapes all error boundaries.
 */
process.on("unhandledRejection", (reason, promise) => {
	console.error("\n❌ Unhandled promise rejection:", reason);
	if (reason instanceof Error && reason.stack) {
		console.error("Stack trace:", reason.stack);
	}
	console.error("Promise:", promise);

	// Release lock before exiting to prevent stale locks
	console.error("🔓 Releasing orchestrator lock due to unhandled rejection...");
	releaseLock(false);

	process.exit(1);
});

// ============================================================================
// Main Entry Point
// ============================================================================

async function main(): Promise<void> {
	const options = parseArgs();

	// -1 means no spec ID provided (allows spec ID 0 for debug spec)
	if (options.specId === -1 || Number.isNaN(options.specId)) {
		showHelp();
		process.exit(1);
	}

	await orchestrate(options);
}

main().catch((error) => {
	console.error("\n❌ Orchestrator error:", error);
	// Lock release is handled by try-finally in orchestrate() or signal handlers
	process.exit(1);
});
