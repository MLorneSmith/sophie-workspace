/**
 * Pre-Flight Check Module
 *
 * Interactive pre-flight check for environment variable requirements.
 * Displays a table of required credentials and prompts user for action.
 */

import process from "node:process";
import * as readline from "node:readline";

import type { SpecManifest } from "../types/index.js";

import { validateDependencyGraph } from "./cycle-detector.js";
import { validateRequiredEnvVars } from "./env-requirements.js";

// ============================================================================
// Types
// ============================================================================

/**
 * Result of a pre-flight check.
 */
export interface PreFlightResult {
	/** Whether the orchestrator should proceed */
	proceed: boolean;
	/** Environment variables that were set during the check */
	envVarsSet: Record<string, string>;
	/** Whether the check was skipped by user */
	skipped: boolean;
}

// ============================================================================
// Table Formatting
// ============================================================================

/**
 * Print a formatted table with headers and rows.
 */
function printTable(
	log: (...args: unknown[]) => void,
	headers: string[],
	rows: string[][],
): void {
	// Calculate column widths
	const colWidths = headers.map((h, i) =>
		Math.max(h.length, ...rows.map((r) => r[i]?.length || 0)),
	);

	// Print header
	log("   " + headers.map((h, i) => h.padEnd(colWidths[i] ?? 0)).join(" │ "));
	log("   " + colWidths.map((w) => "─".repeat(w)).join("─┼─"));

	// Print rows
	for (const row of rows) {
		log(
			"   " + row.map((cell, i) => cell.padEnd(colWidths[i] ?? 0)).join(" │ "),
		);
	}
	log("");
}

/**
 * Truncate a string to a maximum length with ellipsis.
 */
function truncate(str: string, maxLen: number): string {
	if (str.length <= maxLen) return str;
	return str.slice(0, maxLen - 3) + "...";
}

// ============================================================================
// Interactive Prompt
// ============================================================================

/**
 * Create a readline interface for user input.
 */
function createReadline(): readline.Interface {
	return readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});
}

/**
 * Prompt the user for input.
 */
async function prompt(
	rl: readline.Interface,
	question: string,
): Promise<string> {
	return new Promise((resolve) => {
		rl.question(question, (answer) => {
			resolve(answer);
		});
	});
}

// ============================================================================
// Pre-Flight Check
// ============================================================================

/**
 * Run the pre-flight check for environment variables.
 * Displays missing credentials and prompts user for action.
 *
 * @param manifest - The spec manifest with required_env_vars
 * @param log - Logger function for output
 * @returns PreFlightResult indicating whether to proceed
 */
export async function runPreFlightCheck(
	manifest: SpecManifest,
	log: (...args: unknown[]) => void,
): Promise<PreFlightResult> {
	// Get required env vars from manifest
	const required = manifest.metadata.required_env_vars || [];

	if (required.length === 0) {
		log("   ✅ No external service requirements detected");
		return { proceed: true, envVarsSet: {}, skipped: false };
	}

	const missing = validateRequiredEnvVars(required);

	if (missing.length === 0) {
		log(
			`   ✅ All ${required.length} required environment variable(s) are set`,
		);
		return { proceed: true, envVarsSet: {}, skipped: false };
	}

	// Display pre-flight check header
	log(
		"\n══════════════════════════════════════════════════════════════════════════════",
	);
	log("   ALPHA SPEC ORCHESTRATOR - PRE-FLIGHT CHECK");
	log(
		"══════════════════════════════════════════════════════════════════════════════",
	);
	log(`\n📋 Spec ${manifest.metadata.spec_id}: ${manifest.metadata.spec_name}`);
	log(`   Features: ${manifest.feature_queue.length}`);
	log("\n🔑 Required Environment Variables:\n");

	// Build table data
	const headers = ["Variable", "Status", "Features Using", "Source"];
	const rows = missing.map((v) => [
		v.name,
		"❌ Missing",
		truncate(
			v.features.slice(0, 2).join(", ") +
				(v.features.length > 2 ? ` (+${v.features.length - 2})` : ""),
			25,
		),
		truncate(v.source, 30),
	]);

	printTable(log, headers, rows);

	log(
		`⚠️  Missing ${missing.length} required credential${missing.length > 1 ? "s" : ""}.\n`,
	);

	// Interactive prompt
	const rl = createReadline();

	try {
		const answer = await prompt(
			rl,
			`Options:
  1. Enter values now (interactive)
  2. Add to .env file and re-run
  3. Continue without (features may fail)
  4. Skip this check (--skip-pre-flight)

Choice [1-4]: `,
		);

		switch (answer.trim()) {
			case "1": {
				// Interactively prompt for each missing var
				const envVars: Record<string, string> = {};
				for (const v of missing) {
					const value = await prompt(
						rl,
						`Enter ${v.name} (${truncate(v.source, 40)}): `,
					);
					if (value.trim()) {
						envVars[v.name] = value.trim();
						process.env[v.name] = value.trim();
					}
				}
				rl.close();
				log("\n✅ Environment variables set, proceeding...\n");
				return { proceed: true, envVarsSet: envVars, skipped: false };
			}

			case "2": {
				rl.close();
				log("\nAdd these to your .env file:\n");
				for (const v of missing) {
					log(`  ${v.name}=<value>  # ${v.description}`);
				}
				log("\nThen re-run the orchestrator.\n");
				return { proceed: false, envVarsSet: {}, skipped: false };
			}

			case "3": {
				rl.close();
				log(
					"\n⚠️  Proceeding without env vars. Features requiring them may fail.\n",
				);
				return { proceed: true, envVarsSet: {}, skipped: false };
			}

			case "4": {
				rl.close();
				log("\n⏭️  Skipping pre-flight check.\n");
				return { proceed: true, envVarsSet: {}, skipped: true };
			}

			default: {
				rl.close();
				log("\n❌ Invalid choice. Aborting.\n");
				return { proceed: false, envVarsSet: {}, skipped: false };
			}
		}
	} catch {
		rl.close();
		log("\n❌ Error reading input. Aborting.\n");
		return { proceed: false, envVarsSet: {}, skipped: false };
	}
}

/**
 * Run a non-interactive pre-flight check.
 * Just validates and logs status without prompting.
 *
 * @param manifest - The spec manifest with required_env_vars
 * @param log - Logger function for output
 * @returns true if all required vars are set, false otherwise
 */
export function checkPreFlightSilent(
	manifest: SpecManifest,
	log: (...args: unknown[]) => void,
): boolean {
	const required = manifest.metadata.required_env_vars || [];

	if (required.length === 0) {
		log("   ✅ No external service requirements detected");
		return true;
	}

	const missing = validateRequiredEnvVars(required);

	if (missing.length === 0) {
		log(
			`   ✅ All ${required.length} required environment variable(s) are set`,
		);
		return true;
	}

	log(`   ⚠️  Missing ${missing.length} required environment variable(s):`);
	for (const v of missing.slice(0, 5)) {
		log(`      - ${v.name}`);
	}
	if (missing.length > 5) {
		log(`      ... and ${missing.length - 5} more`);
	}

	return false;
}

/**
 * Format environment variables for dry-run display.
 *
 * @param manifest - The spec manifest with required_env_vars
 * @returns Formatted string for dry-run output
 */
export function formatPreFlightForDryRun(manifest: SpecManifest): string {
	const required = manifest.metadata.required_env_vars || [];

	if (required.length === 0) {
		return "   No external service requirements detected\n";
	}

	const missing = validateRequiredEnvVars(required);
	const lines: string[] = [];

	lines.push(`   Environment Variables: ${required.length} required`);

	if (missing.length === 0) {
		lines.push("   Status: ✅ All set");
	} else {
		lines.push(`   Status: ⚠️  Missing ${missing.length}:`);
		for (const v of missing) {
			lines.push(`     - ${v.name} (${truncate(v.source, 30)})`);
		}
	}

	return lines.join("\n") + "\n";
}

// ============================================================================
// Feature Task Count Pre-Flight Check
// ============================================================================

/**
 * Result of the feature task count pre-flight check.
 */
export interface FeatureTaskCountCheckResult {
	/** Whether to proceed with orchestration (always true - warning only) */
	proceed: boolean;
	/** Number of features exceeding the task count limit */
	oversizedCount: number;
}

/**
 * Run pre-flight check for feature task counts in the manifest.
 *
 * Warns about features that exceed 12 tasks per feature. This is a
 * soft check (warning only) -- it does not block orchestration.
 *
 * Chore #1962: Enforce max 12 tasks per feature
 *
 * @param manifest - The spec manifest to validate
 * @param log - Logger function for output
 * @returns FeatureTaskCountCheckResult
 */
export function checkFeatureTaskCounts(
	manifest: SpecManifest,
	log: (...args: unknown[]) => void,
): FeatureTaskCountCheckResult {
	log("   Validating feature task counts...");
	const MAX_TASKS_PER_FEATURE = 12;
	let oversizedCount = 0;

	for (const feature of manifest.feature_queue) {
		if (feature.task_count > MAX_TASKS_PER_FEATURE) {
			log(`   ⚠️ Feature ${feature.id} has ${feature.task_count} tasks (max: ${MAX_TASKS_PER_FEATURE})`);
			oversizedCount++;
		}
	}

	if (oversizedCount > 0) {
		log(`   ⚠️ ${oversizedCount} feature(s) exceed ${MAX_TASKS_PER_FEATURE} tasks. Consider splitting.`);
	} else {
		log("   ✅ All features within task count limits");
	}

	// Warning only - don't block execution
	return { proceed: true, oversizedCount };
}

// ============================================================================
// Circular Dependency Pre-Flight Check
// ============================================================================

/**
 * Result of the dependency cycle pre-flight check.
 */
export interface DependencyCycleCheckResult {
	/** Whether to proceed with orchestration */
	proceed: boolean;
	/** Number of cycles detected */
	cycleCount: number;
}

/**
 * Run pre-flight check for circular dependencies in the manifest.
 *
 * This is a critical validation that catches circular dependencies before
 * orchestration begins, preventing the orchestrator from hanging indefinitely.
 *
 * Bug fix #1916: Alpha Orchestrator Circular Dependency Hang
 *
 * @param manifest - The spec manifest to validate
 * @param log - Logger function for output
 * @returns DependencyCycleCheckResult indicating whether to proceed
 */
export function checkDependencyCycles(
	manifest: SpecManifest,
	log: (...args: unknown[]) => void,
): DependencyCycleCheckResult {
	log("   Validating dependency graph for circular dependencies...");

	const result = validateDependencyGraph(manifest.feature_queue, log);

	if (result.hasCycles) {
		log("");
		log("❌ DEPENDENCY VALIDATION FAILED");
		log("   Fix your feature.md files and regenerate the manifest.");
		log("   See above for details on which dependencies to fix.");
		log("");
		return { proceed: false, cycleCount: result.cycles.length };
	}

	log("   ✅ No circular dependencies detected");
	return { proceed: true, cycleCount: 0 };
}
