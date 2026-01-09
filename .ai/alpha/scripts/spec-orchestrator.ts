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

import process from "node:process";

import { parseArgs, showHelp } from "./cli/index.js";
import { orchestrate } from "./lib/index.js";

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
	process.exit(1);
});
