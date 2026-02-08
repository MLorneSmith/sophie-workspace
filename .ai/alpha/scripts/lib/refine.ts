/**
 * Refine Utilities Library
 *
 * Utilities for the post-implementation refinement workflow.
 * Provides context loading, issue type detection, skill selection,
 * and refinement history management.
 */

import * as fs from "node:fs";
import * as path from "node:path";

import {
	DEFAULT_SKILL_MAPPING,
	ISSUE_TYPE_KEYWORDS,
	type RefineContext,
	type RefineIssueType,
	type RefinementEntry,
	type SpecManifest,
} from "../types/index.js";
import { findSpecDir, loadManifest, saveManifest } from "./manifest.js";

// ============================================================================
// Context Loading
// ============================================================================

/**
 * Load refinement context from a spec manifest.
 *
 * @param projectRoot - The project root directory
 * @param specId - The spec ID (numeric)
 * @returns RefineContext with spec and optional feature information
 */
export function loadRefinementContext(
	projectRoot: string,
	specId: number,
	featureId?: string,
): RefineContext | null {
	// Find spec directory
	const specDir = findSpecDir(projectRoot, specId);
	if (!specDir) {
		console.error(`Spec directory not found for ID: ${specId}`);
		return null;
	}

	// Load manifest
	const manifest = loadManifest(specDir);
	if (!manifest) {
		console.error(`Manifest not found in: ${specDir}`);
		return null;
	}

	// Build base context
	const context: RefineContext = {
		specId: manifest.metadata.spec_id,
		specName: manifest.metadata.spec_name,
		specDir: manifest.metadata.spec_dir,
		branchName: manifest.sandbox.branch_name || `alpha/spec-S${specId}`,
		researchDir: manifest.metadata.research_dir,
		verificationCommands: [],
	};

	// Load feature context if scoped
	if (featureId) {
		const feature = manifest.feature_queue.find((f) => f.id === featureId);
		if (feature) {
			context.feature = {
				id: feature.id,
				title: feature.title,
				tasksFile: feature.tasks_file,
				featureDir: feature.feature_dir,
			};

			// Load verification commands from tasks.json
			const tasksPath = path.join(specDir, feature.tasks_file);
			if (fs.existsSync(tasksPath)) {
				try {
					const tasksContent = fs.readFileSync(tasksPath, "utf-8");
					const tasks = JSON.parse(tasksContent) as {
						tasks: Array<{ verification_command?: string }>;
					};
					context.verificationCommands = tasks.tasks
						.filter((t) => t.verification_command)
						.map((t) => t.verification_command as string);
				} catch {
					// Ignore parse errors
				}
			}
		}
	}

	return context;
}

// ============================================================================
// Issue Type Detection
// ============================================================================

/**
 * Detect issue type from a description string.
 * Uses keyword matching to classify the issue.
 *
 * @param description - The issue description from user
 * @returns Detected issue type, defaults to 'functional' if no match
 */
export function detectIssueType(description: string): RefineIssueType {
	const lowerDesc = description.toLowerCase();
	let bestMatch: RefineIssueType = "functional";
	let maxMatches = 0;

	for (const [issueType, keywords] of Object.entries(ISSUE_TYPE_KEYWORDS)) {
		const matches = keywords.filter((keyword) =>
			lowerDesc.includes(keyword.toLowerCase()),
		).length;
		if (matches > maxMatches) {
			maxMatches = matches;
			bestMatch = issueType as RefineIssueType;
		}
	}

	return bestMatch;
}

// ============================================================================
// Skill Selection
// ============================================================================

/**
 * Select skills to invoke based on issue type.
 *
 * @param issueType - The detected issue type
 * @returns Array of skill names to invoke
 */
export function selectSkillsForIssue(issueType: RefineIssueType): string[] {
	return DEFAULT_SKILL_MAPPING[issueType] || ["frontend-debugging"];
}

/**
 * Get all skills for multiple issue types.
 * Useful when an issue spans multiple categories.
 *
 * @param issueTypes - Array of issue types
 * @returns Deduplicated array of skill names
 */
export function selectSkillsForMultipleIssues(
	issueTypes: RefineIssueType[],
): string[] {
	const skills = new Set<string>();
	for (const issueType of issueTypes) {
		for (const skill of selectSkillsForIssue(issueType)) {
			skills.add(skill);
		}
	}
	return [...skills];
}

// ============================================================================
// Refinement History Management
// ============================================================================

/**
 * Generate a unique refinement ID.
 *
 * @returns Unique ID in format 'R-YYYYMMDD-HHMMSS-XXX'
 */
export function generateRefinementId(): string {
	const now = new Date();
	const date = now.toISOString().slice(0, 10).replace(/-/g, "");
	const time = now.toTimeString().slice(0, 8).replace(/:/g, "");
	const random = Math.random().toString(36).slice(2, 5).toUpperCase();
	return `R-${date}-${time}-${random}`;
}

/**
 * Save a refinement entry to the spec manifest.
 *
 * @param specDir - The spec directory
 * @param entry - The refinement entry to save
 */
export function saveRefinementEntry(
	specDir: string,
	entry: RefinementEntry,
): void {
	const manifest = loadManifest(specDir);
	if (!manifest) {
		console.error(`Cannot save refinement: manifest not found in ${specDir}`);
		return;
	}

	// Initialize refinements array if not present
	if (!manifest.refinements) {
		manifest.refinements = [];
	}

	// Add entry
	manifest.refinements.push(entry);

	// Save manifest
	saveManifest(manifest);
}

/**
 * Create a new refinement entry.
 *
 * @param issueDescription - Description of the issue being fixed
 * @param issueType - Detected issue type
 * @param featureId - Optional feature ID scope
 * @returns New RefinementEntry with generated ID and timestamp
 */
export function createRefinementEntry(
	issueDescription: string,
	issueType: RefineIssueType,
	featureId?: string,
): RefinementEntry {
	return {
		id: generateRefinementId(),
		timestamp: new Date().toISOString(),
		issue_description: issueDescription,
		issue_type: issueType,
		feature_id: featureId,
		skills_invoked: [],
		files_modified: [],
		status: "completed",
	};
}

// ============================================================================
// Branch Helpers
// ============================================================================

/**
 * Get the implementation branch name from a manifest.
 *
 * @param manifest - The spec manifest
 * @returns Branch name or default based on spec ID
 */
export function getBranchFromManifest(manifest: SpecManifest): string {
	if (manifest.sandbox.branch_name) {
		return manifest.sandbox.branch_name;
	}

	// Construct default branch name from spec ID
	const specId = manifest.metadata.spec_id;
	// Handle both S1362 and 1362 formats
	const numericId = specId.replace(/^S/, "");
	return `alpha/spec-S${numericId}`;
}

/**
 * Check if a manifest has an active sandbox that could be reused.
 *
 * @param manifest - The spec manifest
 * @returns True if sandbox IDs are present and created_at is recent
 */
export function hasActiveSandbox(manifest: SpecManifest): boolean {
	const { sandbox_ids, created_at } = manifest.sandbox;

	if (!sandbox_ids || sandbox_ids.length === 0 || !created_at) {
		return false;
	}

	// Check if sandbox is less than 50 minutes old (E2B max is 60 min)
	const createdTime = new Date(created_at).getTime();
	const now = Date.now();
	const ageMinutes = (now - createdTime) / (1000 * 60);

	return ageMinutes < 50;
}

// ============================================================================
// Verification Command Extraction
// ============================================================================

/**
 * Extract verification commands from a tasks.json file.
 *
 * @param tasksPath - Path to the tasks.json file
 * @returns Array of verification commands
 */
export function extractVerificationCommands(tasksPath: string): string[] {
	if (!fs.existsSync(tasksPath)) {
		return [];
	}

	try {
		const content = fs.readFileSync(tasksPath, "utf-8");
		const tasks = JSON.parse(content) as {
			tasks: Array<{ verification_command?: string }>;
		};

		return tasks.tasks
			.filter((t) => t.verification_command)
			.map((t) => t.verification_command as string);
	} catch {
		return [];
	}
}

/**
 * Get common verification commands for a spec.
 * These are always safe to run regardless of which feature is being refined.
 *
 * @returns Array of common verification commands
 */
export function getCommonVerificationCommands(): string[] {
	return ["pnpm typecheck", "pnpm lint"];
}
