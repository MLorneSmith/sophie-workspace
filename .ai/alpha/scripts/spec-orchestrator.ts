#!/usr/bin/env tsx

/**

* Alpha Spec Orchestrator
*
* Manages E2B sandboxes and Claude Code sessions to implement all features
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

function loadEnvFile(): void {
	// Find project root by looking for .git directory (the actual repo root)
	// This ensures we load from the main project root, not subdirectories with their own package.json
	let currentDir = import.meta.dirname;
	while (currentDir !== "/") {
		// Look for .git to identify the actual project root
		const gitPath = path.join(currentDir, ".git");
		if (fs.existsSync(gitPath)) {
			const envPath = path.join(currentDir, ".env");
			if (fs.existsSync(envPath)) {
				const content = fs.readFileSync(envPath, "utf-8");
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
			return;
		}
		currentDir = path.dirname(currentDir);
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

	if (!options.specId) {
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
