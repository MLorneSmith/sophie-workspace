/**
 * Type definitions for the Alpha Refine Workflow
 *
 * This module contains types for the post-implementation refinement workflow
 * that enables targeted debugging and fine-tuning after human review.
 */

// ============================================================================
// Refine Issue Types
// ============================================================================

/**
 * Classification of refinement issue types.
 * Used to determine which skills to invoke for diagnosis and fix.
 */
export type RefineIssueType =
	| "visual" // Visual/UI bugs (rendering, layout, CSS)
	| "functional" // Functional behavior issues
	| "performance" // Performance problems (slow, timeout)
	| "polish" // Minor UI polish and refinements
	| "accessibility" // Accessibility issues
	| "responsive"; // Responsive design issues

/**
 * Keywords that trigger specific issue type detection.
 */
export const ISSUE_TYPE_KEYWORDS: Record<RefineIssueType, string[]> = {
	visual: [
		"rendering",
		"layout",
		"css",
		"doesn't show",
		"not visible",
		"display",
		"hidden",
		"overlap",
		"alignment",
		"spacing",
		"color",
		"style",
	],
	functional: [
		"doesn't work",
		"broken",
		"error",
		"bug",
		"crash",
		"fails",
		"incorrect",
		"wrong",
		"missing",
		"state",
		"props",
	],
	performance: [
		"slow",
		"loading",
		"timeout",
		"performance",
		"lag",
		"freeze",
		"memory",
		"cpu",
	],
	polish: [
		"polish",
		"refine",
		"improve",
		"tweak",
		"adjust",
		"minor",
		"small",
		"detail",
	],
	accessibility: [
		"accessibility",
		"a11y",
		"screen reader",
		"keyboard",
		"aria",
		"contrast",
		"focus",
	],
	responsive: [
		"responsive",
		"mobile",
		"tablet",
		"breakpoint",
		"media query",
		"viewport",
	],
};

// ============================================================================
// Skill Mapping
// ============================================================================

/**
 * Maps issue types to the skills that should be invoked.
 */
export type RefineSkillMapping = {
	[K in RefineIssueType]: string[];
};

/**
 * Default skill mapping for issue types.
 */
export const DEFAULT_SKILL_MAPPING: RefineSkillMapping = {
	visual: ["frontend-debugging"],
	functional: ["react-best-practices"],
	performance: ["frontend-debugging"],
	polish: ["frontend-design"],
	accessibility: ["frontend-debugging"],
	responsive: ["frontend-design"],
};

// ============================================================================
// Refinement Entry
// ============================================================================

/**
 * Tracks an individual refinement applied to a spec.
 * Stored in spec-manifest.json for history tracking.
 */
export interface RefinementEntry {
	/** Unique ID for this refinement (auto-generated) */
	id: string;

	/** ISO timestamp when refinement was applied */
	timestamp: string;

	/** Issue description from user */
	issue_description: string;

	/** Detected issue type */
	issue_type: RefineIssueType;

	/** Feature ID if refinement was scoped to a feature (optional) */
	feature_id?: string;

	/** Skills that were invoked */
	skills_invoked: string[];

	/** Files that were modified */
	files_modified: string[];

	/** Commit hash if changes were committed */
	commit_hash?: string;

	/** Status of the refinement */
	status: "completed" | "failed" | "partial";

	/** Error message if status is failed */
	error?: string;

	/** Duration of the refinement in seconds */
	duration_seconds?: number;
}

// ============================================================================
// Refine Options
// ============================================================================

/**
 * Command-line options for the refine orchestrator.
 */
export interface RefineOptions {
	/** Spec ID (semantic: S1362 or numeric: 1362) */
	specId: string;

	/** Issue description from user */
	issue?: string;

	/** Feature ID to scope refinement (optional) */
	featureId?: string;

	/** Timeout in seconds for the sandbox */
	timeout: number;

	/** Run in interactive mode (keep sandbox alive) */
	interactive: boolean;

	/** Skip sandbox creation, connect to existing */
	reconnect: boolean;

	/** Force create new sandbox even if one exists */
	forceNew: boolean;

	/** Dry run - show what would happen without executing */
	dryRun: boolean;
}

// ============================================================================
// Refine Context
// ============================================================================

/**
 * Context loaded for a refinement session.
 */
export interface RefineContext {
	/** Spec manifest */
	specId: string;
	specName: string;
	specDir: string;

	/** Branch name for implementation */
	branchName: string;

	/** Research library path */
	researchDir: string;

	/** Feature context if scoped */
	feature?: {
		id: string;
		title: string;
		tasksFile: string;
		featureDir: string;
	};

	/** Verification commands from tasks.json */
	verificationCommands: string[];
}

// ============================================================================
// Refine Progress
// ============================================================================

/**
 * Progress tracking for a refinement session.
 */
export interface RefineProgress {
	/** Status of the refinement */
	status:
		| "loading"
		| "diagnosing"
		| "fixing"
		| "verifying"
		| "completed"
		| "failed";

	/** Current phase description */
	phase: string;

	/** Issue being addressed */
	issue: {
		description: string;
		type: RefineIssueType;
	};

	/** Skills that have been invoked */
	skillsInvoked: string[];

	/** Files modified so far */
	filesModified: string[];

	/** Verification results */
	verificationResults?: {
		command: string;
		passed: boolean;
		output?: string;
	}[];

	/** Timestamps */
	startedAt: string;
	lastHeartbeat: string;
}
