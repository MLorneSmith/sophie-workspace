/**
 * CLI Module
 *
 * Command-line argument parsing and help output for the spec and refine orchestrators.
 */

import process from "node:process";

import type { OrchestratorOptions, RefineOptions } from "../types/index.js";

// ============================================================================
// Argument Parsing
// ============================================================================

/**

* Parse command-line arguments into orchestrator options.
*
* @returns Parsed options
 */
export function parseArgs(): OrchestratorOptions {
	const args = process.argv.slice(2);
	const options: OrchestratorOptions = {
		specId: -1, // -1 means "not provided" - allows spec ID 0 (debug spec)
		sandboxCount: 3,
		timeout: 3600, // 1 hour (E2B maximum)
		dryRun: false,
		forceUnlock: false,
		skipDbReset: false,
		skipDbSeed: false,
		ui: true,
		minimalUi: false,
		reset: false,
		skipToCompletion: false,
	};

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];
		if (!arg) continue;

		const nextArg = args[i + 1];
		if ((arg === "--sandboxes" || arg === "-s") && nextArg) {
			options.sandboxCount = Math.min(parseInt(nextArg, 10), 3);
			i++;
		} else if (arg === "--timeout" && nextArg) {
			// E2B enforces 1 hour (3600s) maximum
			options.timeout = Math.min(parseInt(nextArg, 10), 3600);
			i++;
		} else if (arg === "--dry-run") {
			options.dryRun = true;
		} else if (arg === "--force-unlock") {
			options.forceUnlock = true;
		} else if (arg === "--reset") {
			options.reset = true;
		} else if (arg === "--skip-db-reset") {
			options.skipDbReset = true;
		} else if (arg === "--skip-db-seed") {
			options.skipDbSeed = true;
		} else if (arg === "--ui" || arg === "--ui-mode") {
			options.ui = true;
		} else if (arg === "--no-ui") {
			options.ui = false;
		} else if (arg === "--minimal-ui") {
			options.ui = true;
			options.minimalUi = true;
		} else if (arg === "--skip-to-completion") {
			options.skipToCompletion = true;
		} else if (
			!arg.startsWith("--") &&
			!arg.startsWith("-") &&
			options.specId === -1
		) {
			options.specId = parseInt(arg, 10);
		}
	}

	return options;
}

// ============================================================================
// Help Output
// ============================================================================

/**

* Print help message.
 */
export function showHelp(): void {
	console.log(`
Alpha Spec Orchestrator

Usage:
  tsx spec-orchestrator.ts <spec-id> [options]

Options:
  --sandboxes <n>, -s   Number of sandboxes (default: 3, max: 3)
  --timeout <s>         Sandbox timeout in seconds (default: 3600, max: 3600)
  --dry-run             Show execution plan without running
  --force-unlock        Force release any existing orchestrator lock
  --reset               Reset manifest state (delete and regenerate)
  --skip-db-reset       Skip sandbox database reset at startup
  --skip-db-seed        Skip Payload CMS seeding after reset
  --skip-to-completion  Skip work loop, jump to completion (debugging)
  --no-ui               Disable Ink dashboard UI (uses console output)
  --minimal-ui          Use minimal dashboard (for narrow terminals)

Features:

* Takes Spec ID (not Initiative ID)
* Work queue: sandboxes dynamically pull next available feature
* Dependency-aware: respects feature and initiative dependencies
* Auto-resume: continues from where it left off
* Progress polling: real-time visibility during feature execution
* Stall detection: auto-detects hung Claude sessions
* Sandbox database: resets dedicated Supabase project per run
* Database seeding: auto-seeds Payload CMS with test data
* Orchestrator lock: prevents concurrent runs

Examples:
  tsx spec-orchestrator.ts 1362              # Run with 3 sandboxes
  tsx spec-orchestrator.ts 1362 --dry-run    # Preview execution plan
  tsx spec-orchestrator.ts 1362 -s 1         # Single sandbox mode
  tsx spec-orchestrator.ts 1362 -s 2         # Two sandbox mode
  tsx spec-orchestrator.ts 1362 --force-unlock  # Override stale lock
  tsx spec-orchestrator.ts 1362 --reset         # Reset manifest state
  tsx spec-orchestrator.ts 1362 --reset --force-unlock  # Full recovery
  tsx spec-orchestrator.ts 1362 --skip-db-seed  # Resume without re-seeding
  tsx spec-orchestrator.ts 0                    # Run debug spec
  tsx spec-orchestrator.ts 1362 --skip-to-completion  # Debug completion sequence

Environment Variables (for sandbox database):
  SUPABASE_SANDBOX_PROJECT_REF   Sandbox project reference ID
  SUPABASE_SANDBOX_URL           Sandbox project URL
  SUPABASE_SANDBOX_ANON_KEY      Sandbox anon key
  SUPABASE_SANDBOX_SERVICE_ROLE_KEY  Sandbox service role key
  SUPABASE_SANDBOX_DB_URL        Sandbox database connection URL
  SUPABASE_ACCESS_TOKEN          CLI access token for linking

Environment Variables (for Payload CMS seeding):
  PAYLOAD_SECRET                 Payload CMS secret key
  SEED_USER_PASSWORD             Password for seeded test users
  R2_ACCESS_KEY_ID               Cloudflare R2 access key
  R2_SECRET_ACCESS_KEY           Cloudflare R2 secret key
  R2_ACCOUNT_ID                  Cloudflare R2 account ID
  PAYLOAD_PUBLIC_MEDIA_BASE_URL  R2 media bucket URL
  PAYLOAD_PUBLIC_DOWNLOADS_BASE_URL  R2 downloads bucket URL

Prerequisites:

  1. Complete task decomposition for all features
  2. Generate spec manifest:
     tsx generate-spec-manifest.ts <spec-id>
`);
}

// ============================================================================
// Refine Argument Parsing
// ============================================================================

/**
 * Parse command-line arguments for the refine orchestrator.
 *
 * @returns Parsed refine options
 */
export function parseRefineArgs(): RefineOptions {
	const args = process.argv.slice(2);
	const options: RefineOptions = {
		specId: "",
		timeout: 3600, // 1 hour (E2B maximum)
		interactive: false,
		reconnect: false,
		forceNew: false,
		dryRun: false,
	};

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];
		if (!arg) continue;

		const nextArg = args[i + 1];

		if (arg === "--issue" && nextArg) {
			options.issue = nextArg;
			i++;
		} else if (arg === "--feature" && nextArg) {
			options.featureId = nextArg;
			i++;
		} else if (arg === "--timeout" && nextArg) {
			options.timeout = Math.min(parseInt(nextArg, 10), 3600);
			i++;
		} else if (arg === "--interactive") {
			options.interactive = true;
		} else if (arg === "--reconnect") {
			options.reconnect = true;
		} else if (arg === "--force-new") {
			options.forceNew = true;
		} else if (arg === "--dry-run") {
			options.dryRun = true;
		} else if (arg === "--help" || arg === "-h") {
			showRefineHelp();
			process.exit(0);
		} else if (
			!arg.startsWith("--") &&
			!arg.startsWith("-") &&
			!options.specId
		) {
			// Parse spec ID - handle both S1362 and 1362 formats
			options.specId = arg.replace(/^S/i, "");
		}
	}

	return options;
}

/**
 * Print help message for refine orchestrator.
 */
export function showRefineHelp(): void {
	console.log(`
Alpha Refine Orchestrator

Usage:
  tsx refine-orchestrator.ts <spec-id> [options]

Options:
  --issue "description"    Issue description to fix
  --feature <S#.I#.F#>     Scope refinement to specific feature
  --timeout <seconds>      Sandbox timeout (default: 3600, max: 3600)
  --interactive            Keep sandbox alive for iterative fixes
  --reconnect              Reconnect to existing sandbox if available
  --force-new              Force create new sandbox (ignore existing)
  --dry-run                Show what would happen without executing

Features:
  * Lightweight single-sandbox orchestrator
  * Reconnects to existing sandbox if still alive
  * Invokes /alpha:refine with issue context
  * Interactive mode for iterative debugging
  * Tracks refinement history in spec-manifest.json

Examples:
  tsx refine-orchestrator.ts 1362 --issue "Login button doesn't render"
  tsx refine-orchestrator.ts S1362 --issue "Slow page load" --feature S1362.I1.F2
  tsx refine-orchestrator.ts 1362 --reconnect --interactive
  tsx refine-orchestrator.ts 1362 --dry-run
`);
}
