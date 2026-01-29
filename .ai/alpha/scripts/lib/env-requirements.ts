/**
 * Environment Requirements Module
 *
 * Extracts and validates environment variable requirements from research files.
 * Used by the orchestrator to perform pre-flight checks before sandbox execution.
 */

import * as fs from "node:fs";
import * as path from "node:path";

import type { RequiredEnvVar, SpecManifest } from "../types/index.js";

// ============================================================================
// Types
// ============================================================================

/**
 * Raw environment variable extracted from a single research file.
 * Features field is added during aggregation.
 */
export interface RawEnvVar {
	name: string;
	description: string;
	source: string;
	required: boolean;
	scope: "client" | "server" | "both";
}

/**
 * Missing environment variable info for pre-flight display.
 */
export interface MissingEnvVar {
	name: string;
	description: string;
	source: string;
	scope: "client" | "server" | "both";
	features: string[];
}

// ============================================================================
// Environment Variable Extraction
// ============================================================================

/**
 * Extract required environment variables from a research directory.
 * Searches for "## Environment Variables Required" section in markdown files.
 *
 * @param researchDir - Path to the research-library directory
 * @returns Array of raw environment variables found
 */
export function extractEnvRequirementsFromResearch(
	researchDir: string,
): RawEnvVar[] {
	const vars: RawEnvVar[] = [];

	if (!fs.existsSync(researchDir)) {
		return vars;
	}

	const researchFiles = fs
		.readdirSync(researchDir)
		.filter((f) => f.endsWith(".md"));

	for (const file of researchFiles) {
		const filePath = path.join(researchDir, file);
		const content = fs.readFileSync(filePath, "utf-8");

		// Match "## Environment Variables Required" section with env block
		const match = content.match(
			/## Environment Variables Required\s*\n+```(?:env|bash)?\n([\s\S]*?)\n```/i,
		);
		if (!match?.[1]) continue;

		const envBlock = match[1];
		const lines = envBlock
			.split("\n")
			.filter((l) => l.trim() && !l.trim().startsWith("#"));

		for (const line of lines) {
			const eqIndex = line.indexOf("=");
			if (eqIndex <= 0) continue;

			const name = line.slice(0, eqIndex).trim();
			const rest = line.slice(eqIndex + 1).trim();

			// Validate env var name format
			if (!name.match(/^[A-Z][A-Z0-9_]*$/)) continue;

			// Extract description from comment if present, or use value as hint
			const isPlaceholder =
				rest.includes("your_") ||
				rest.includes("YOUR_") ||
				rest.includes("<") ||
				rest === "";
			const description = isPlaceholder
				? `Required by ${path.basename(file, ".md")}`
				: rest;

			vars.push({
				name,
				description,
				source: `See research: ${file}`,
				required: true, // All env vars from research are required by default
				scope: name.startsWith("NEXT_PUBLIC_") ? "client" : "server",
			});
		}
	}

	return vars;
}

/**
 * Extract required environment variables from a tasks.json file.
 *
 * @param tasksFilePath - Path to tasks.json file
 * @returns Array of raw environment variables from metadata
 */
export function extractEnvRequirementsFromTasks(
	tasksFilePath: string,
): RawEnvVar[] {
	if (!fs.existsSync(tasksFilePath)) {
		return [];
	}

	try {
		const content = fs.readFileSync(tasksFilePath, "utf-8");
		const tasks = JSON.parse(content) as {
			metadata?: {
				required_env_vars?: Array<{
					name: string;
					description: string;
					source: string;
					required?: boolean;
					scope?: "client" | "server" | "both";
				}>;
			};
		};

		const envVars = tasks.metadata?.required_env_vars || [];

		return envVars.map((v) => ({
			name: v.name,
			description: v.description,
			source: v.source,
			required: v.required ?? true,
			scope:
				v.scope ?? (v.name.startsWith("NEXT_PUBLIC_") ? "client" : "server"),
		}));
	} catch {
		return [];
	}
}

// ============================================================================
// Environment Variable Aggregation
// ============================================================================

/**
 * Aggregate all required environment variables from a spec manifest.
 * De-duplicates variables and tracks which features require each.
 *
 * @param manifest - The spec manifest to process
 * @returns Array of aggregated environment variables with feature associations
 */
export function aggregateRequiredEnvVars(
	manifest: SpecManifest,
): RequiredEnvVar[] {
	const varsMap = new Map<string, RequiredEnvVar>();

	// First, extract from research directory if it exists
	if (
		manifest.metadata.research_dir &&
		fs.existsSync(manifest.metadata.research_dir)
	) {
		const researchVars = extractEnvRequirementsFromResearch(
			manifest.metadata.research_dir,
		);
		for (const v of researchVars) {
			varsMap.set(v.name, {
				...v,
				features: ["research-library"],
			});
		}
	}

	// Then, extract from each feature's tasks.json
	for (const feature of manifest.feature_queue) {
		const tasksPath = path.join(manifest.metadata.spec_dir, feature.tasks_file);
		const featureVars = extractEnvRequirementsFromTasks(tasksPath);

		for (const v of featureVars) {
			if (varsMap.has(v.name)) {
				// Add feature to existing var
				const existing = varsMap.get(v.name);
				if (!existing) continue;
				if (!existing.features.includes(feature.id)) {
					existing.features.push(feature.id);
				}
				// Update description if more specific
				if (
					v.description &&
					!v.description.startsWith("Required by") &&
					existing.description.startsWith("Required by")
				) {
					existing.description = v.description;
				}
				// Update source if more specific
				if (
					v.source &&
					!v.source.startsWith("See research:") &&
					existing.source.startsWith("See research:")
				) {
					existing.source = v.source;
				}
			} else {
				varsMap.set(v.name, {
					...v,
					features: [feature.id],
				});
			}
		}
	}

	// Sort by name for consistent output
	return Array.from(varsMap.values()).sort((a, b) =>
		a.name.localeCompare(b.name),
	);
}

// ============================================================================
// Environment Variable Validation
// ============================================================================

/**
 * Validate that required environment variables are present.
 * Returns list of missing variables with their metadata.
 *
 * @param required - Array of required environment variables
 * @returns Array of missing environment variables
 */
export function validateRequiredEnvVars(
	required: RequiredEnvVar[],
): MissingEnvVar[] {
	return required
		.filter((v) => v.required && !process.env[v.name])
		.map((v) => ({
			name: v.name,
			description: v.description,
			source: v.source,
			scope: v.scope,
			features: v.features,
		}));
}

/**
 * Check if all required environment variables are present.
 *
 * @param required - Array of required environment variables
 * @returns true if all required vars are set, false otherwise
 */
export function hasAllRequiredEnvVars(required: RequiredEnvVar[]): boolean {
	return validateRequiredEnvVars(required).length === 0;
}

/**
 * Get a summary of environment variable status for logging.
 *
 * @param required - Array of required environment variables
 * @returns Human-readable status summary
 */
export function getEnvVarStatusSummary(required: RequiredEnvVar[]): string {
	if (required.length === 0) {
		return "No external service requirements detected";
	}

	const missing = validateRequiredEnvVars(required);
	if (missing.length === 0) {
		return `All ${required.length} required environment variable(s) are set`;
	}

	return `Missing ${missing.length} of ${required.length} required environment variable(s)`;
}
