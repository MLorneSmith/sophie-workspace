#!/usr/bin/env tsx

/**

* Generate Spec Manifest
*
* Aggregates all initiatives and features under a spec into a single
* spec-manifest.json for the Alpha orchestrator.
*
* Usage:
* tsx generate-spec-manifest.ts <spec-id>
* tsx generate-spec-manifest.ts 1362
*
* Output:
* Creates .ai/alpha/specs/<spec-dir>/spec-manifest.json
 */

import * as fs from "node:fs";
import * as path from "node:path";

import { validateDependencyGraph } from "./lib/cycle-detector.js";

// ============================================================================
// Types
// ============================================================================

interface TasksJson {
	metadata: {
		feature_id: string; // Semantic ID: S1362.I1.F1 or legacy: 1367
		feature_name: string;
		feature_slug?: string;
		initiative_id: string; // Semantic ID: S1362.I1 or legacy: 1365
		spec_id: string; // Semantic ID: S1362 or legacy: 1362
		requires_database?: boolean;
		database_tasks?: string[];
	};
	tasks: Array<{
		id: string;
		name: string;
		status: string;
		estimated_hours: number;
		requires_database?: boolean;
	}>;
	execution: {
		duration: {
			sequential: number;
			parallel: number;
		};
	};
	github?: {
		feature_tasks_issue?: number;
	};
}

interface FeatureEntry {
	id: string; // Semantic ID: S1362.I1.F1 or legacy: 1367
	initiative_id: string; // Semantic ID: S1362.I1 or legacy: 1365
	title: string;
	slug?: string;
	priority: number;
	global_priority: number; // Priority across all initiatives
	status: "pending" | "in_progress" | "completed" | "failed" | "blocked";
	tasks_file: string;
	feature_dir: string;
	task_count: number;
	tasks_completed: number;
	sequential_hours: number;
	parallel_hours: number;
	dependencies: string[]; // Feature IDs this is blocked by (semantic or legacy)
	github_issue: number | null;
	assigned_sandbox?: string;
	error?: string;
	requires_database: boolean; // True if any task requires DB access
	database_task_count: number; // Count of tasks requiring DB access
}

interface InitiativeEntry {
	id: string; // Semantic ID: S1362.I1 or legacy: 1365
	name: string;
	slug: string;
	priority: number;
	status: "pending" | "in_progress" | "completed" | "failed" | "partial";
	initiative_dir: string;
	feature_count: number;
	features_completed: number;
	dependencies: string[]; // Initiative IDs this is blocked by (semantic or legacy)
}

interface SpecManifest {
	metadata: {
		spec_id: string; // Semantic ID: S1362 or legacy: 1362
		spec_name: string;
		generated_at: string;
		spec_dir: string;
		research_dir: string;
	};
	initiatives: InitiativeEntry[];
	feature_queue: FeatureEntry[];
	progress: {
		status: "pending" | "in_progress" | "completed" | "failed" | "partial";
		initiatives_completed: number;
		initiatives_total: number;
		features_completed: number;
		features_total: number;
		tasks_completed: number;
		tasks_total: number;
		next_feature_id: string | null; // Semantic ID: S1362.I1.F1 or legacy: 1367
		last_completed_feature_id: string | null;
		started_at: string | null;
		completed_at: string | null;
		last_checkpoint: string | null;
	};
	sandbox: {
		sandbox_ids: string[];
		branch_name: string | null;
		created_at: string | null;
	};
}

// ============================================================================
// Utility Functions
// ============================================================================

function findProjectRoot(): string {
	let dir = process.cwd();
	while (dir !== "/") {
		if (fs.existsSync(path.join(dir, ".git"))) {
			return dir;
		}
		dir = path.dirname(dir);
	}
	return process.cwd();
}

/**
 * Find spec directory by ID. Supports both old and new naming conventions:
 * - Old: 1362-Spec-slug/
 * - New: S1362-Spec-slug/
 */
function findSpecDir(projectRoot: string, specId: number): string | null {
	const specsDir = path.join(projectRoot, ".ai", "alpha", "specs");

	if (!fs.existsSync(specsDir)) {
		return null;
	}

	const specDirs = fs.readdirSync(specsDir);

	for (const specDir of specDirs) {
		// Match both: S1362-Spec- (new) and 1362-Spec- (old)
		const match = specDir.match(/^S?(\d+)-Spec-/);
		const idStr = match?.[1];
		if (idStr && parseInt(idStr, 10) === specId) {
			return path.join(specsDir, specDir);
		}
	}

	return null;
}

/**
 * Find initiative directories under a spec. Supports both old and new naming conventions:
 * - Old: 1365-Initiative-slug/
 * - New: S1362.I1-Initiative-slug/
 */
function findInitiativeDirectories(specDir: string): string[] {
	const initDirs: string[] = [];

	const contents = fs.readdirSync(specDir);
	for (const item of contents) {
		const itemPath = path.join(specDir, item);
		if (!fs.statSync(itemPath).isDirectory()) continue;

		// Match both: S1362.I1-Initiative- (new) and 1365-Initiative- (old)
		if (item.match(/^(S\d+\.I\d+|\d+)-Initiative-/)) {
			initDirs.push(itemPath);
		}
	}

	// Sort by initiative priority (I# for new, numeric ID for old)
	return initDirs.sort((a, b) => {
		const nameA = path.basename(a);
		const nameB = path.basename(b);

		// Try new format first: S1362.I1-Initiative-
		const newMatchA = nameA.match(/^S\d+\.I(\d+)-/);
		const newMatchB = nameB.match(/^S\d+\.I(\d+)-/);

		if (newMatchA?.[1] && newMatchB?.[1]) {
			return parseInt(newMatchA[1], 10) - parseInt(newMatchB[1], 10);
		}

		// Fall back to old format: 1365-Initiative-
		const oldMatchA = nameA.match(/^(\d+)-/);
		const oldMatchB = nameB.match(/^(\d+)-/);

		const idA = oldMatchA?.[1] ? parseInt(oldMatchA[1], 10) : 0;
		const idB = oldMatchB?.[1] ? parseInt(oldMatchB[1], 10) : 0;
		return idA - idB;
	});
}

/**
 * Find feature directories under an initiative. Supports both old and new naming conventions:
 * - Old: 1367-Feature-slug/
 * - New: S1362.I1.F1-Feature-slug/
 */
function findFeatureDirectories(initDir: string): string[] {
	const featureDirs: string[] = [];

	const contents = fs.readdirSync(initDir);
	for (const item of contents) {
		const itemPath = path.join(initDir, item);
		if (!fs.statSync(itemPath).isDirectory()) continue;

		// Match both: S1362.I1.F1-Feature- (new) and 1367-Feature- (old)
		if (item.match(/^(S\d+\.I\d+\.F\d+|\d+)-Feature-/)) {
			const tasksFile = path.join(itemPath, "tasks.json");
			if (fs.existsSync(tasksFile)) {
				featureDirs.push(itemPath);
			}
		}
	}

	// Sort by feature priority (F# for new, numeric ID for old)
	return featureDirs.sort((a, b) => {
		const nameA = path.basename(a);
		const nameB = path.basename(b);

		// Try new format first: S1362.I1.F1-Feature-
		const newMatchA = nameA.match(/^S\d+\.I\d+\.F(\d+)-/);
		const newMatchB = nameB.match(/^S\d+\.I\d+\.F(\d+)-/);

		if (newMatchA?.[1] && newMatchB?.[1]) {
			return parseInt(newMatchA[1], 10) - parseInt(newMatchB[1], 10);
		}

		// Fall back to old format: 1367-Feature-
		const oldMatchA = nameA.match(/^(\d+)-/);
		const oldMatchB = nameB.match(/^(\d+)-/);

		const idA = oldMatchA?.[1] ? parseInt(oldMatchA[1], 10) : 0;
		const idB = oldMatchB?.[1] ? parseInt(oldMatchB[1], 10) : 0;
		return idA - idB;
	});
}

function loadTasksJson(featureDir: string): TasksJson | null {
	const tasksFile = path.join(featureDir, "tasks.json");
	try {
		const content = fs.readFileSync(tasksFile, "utf-8");
		return JSON.parse(content) as TasksJson;
	} catch (error) {
		console.error(`Failed to load ${tasksFile}:`, error);
		return null;
	}
}

/**
 * Raw dependency reference - can be either a GitHub issue number, internal F# reference,
 * or a semantic ID reference (S#.I#.F#).
 */
interface RawDependency {
	type: "issue" | "internal" | "semantic";
	value: string; // Issue number, F# number, or semantic ID (e.g., S1362.I1.F1)
}

/**
 * Extract feature dependencies from feature.md file.
 * Looks for "Blocked By:" section with:
 * - Issue numbers (#123)
 * - Internal references (F1, F2)
 * - Semantic IDs (S1362.I1.F1)
 * Returns raw references that need to be resolved after all features are loaded.
 */
function extractFeatureDependenciesRaw(featureDir: string): RawDependency[] {
	const featureFile = path.join(featureDir, "feature.md");
	if (!fs.existsSync(featureFile)) return [];

	try {
		const content = fs.readFileSync(featureFile, "utf-8");
		const deps: RawDependency[] = [];

		// Look for "Blocked By" section (handle various formats)
		const patterns = [
			/### Blocked By\s*\n([^#]*)/i,
			/\*\*Blocked By\*\*:?\s*([^\n]*)/i,
			/Blocked By:?\s*([^\n]*)/i,
		];

		for (const pattern of patterns) {
			const match = content.match(pattern);
			if (!match?.[1]) continue;
			const section: string = match[1];

			// Match semantic IDs first: S1362.I1.F1
			const semanticMatches = section.match(/\bS\d+\.I\d+\.F\d+\b/g);
			if (semanticMatches) {
				for (const semanticMatch of semanticMatches) {
					if (
						!deps.some(
							(d) => d.type === "semantic" && d.value === semanticMatch,
						)
					) {
						deps.push({ type: "semantic", value: semanticMatch });
					}
				}
			}

			// Match GitHub issue numbers: #1234
			const issueMatches = section.match(/#(\d+)/g);
			if (issueMatches) {
				for (const issueMatch of issueMatches) {
					const issueNum = issueMatch.slice(1);
					if (!deps.some((d) => d.type === "issue" && d.value === issueNum)) {
						deps.push({ type: "issue", value: issueNum });
					}
				}
			}

			// Match internal feature references: F1, F2, F3, etc.
			// Pattern: F1: or F1 or F1, - captures the number after F
			// Skip if it's part of a semantic ID (preceded by .) or range notation (preceded by -)
			const internalMatches = section.match(/(?<![.-])\bF(\d+)\b/g);
			if (internalMatches) {
				for (const internalMatch of internalMatches) {
					const fNum = internalMatch.slice(1);
					if (!deps.some((d) => d.type === "internal" && d.value === fNum)) {
						deps.push({ type: "internal", value: fNum });
					}
				}
			}
		}

		return deps;
	} catch {
		return [];
	}
}

/**
 * Resolve raw dependencies to actual feature IDs.
 * Internal F# references are resolved within the same initiative based on priority.
 *
 * @param rawDeps - Raw dependencies from extractFeatureDependenciesRaw
 * @param initiativeId - The initiative this feature belongs to (semantic or legacy)
 * @param featurePriorityMap - Map of "initiative_id-F#" -> feature_id (string)
 */
function resolveFeatureDependencies(
	rawDeps: RawDependency[],
	currentFeatureId: string,
	initiativeId: string,
	featurePriorityMap: Map<string, string>,
): string[] {
	const resolved: string[] = [];

	for (const dep of rawDeps) {
		if (dep.type === "semantic") {
			// Semantic ID (S1362.I1.F1) - use directly, filter self-references
			if (dep.value !== currentFeatureId && !resolved.includes(dep.value)) {
				resolved.push(dep.value);
			}
		} else if (dep.type === "issue") {
			// GitHub issue number - use directly as string
			if (!resolved.includes(dep.value)) {
				resolved.push(dep.value);
			}
		} else if (dep.type === "internal") {
			// Internal F# reference - resolve within same initiative
			// F1 = priority 1, F2 = priority 2, etc.
			const key = `${initiativeId}-${dep.value}`;
			const featureId = featurePriorityMap.get(key);
			// Filter self-references
			if (
				featureId &&
				featureId !== currentFeatureId &&
				!resolved.includes(featureId)
			) {
				resolved.push(featureId);
			}
		}
	}

	return resolved;
}

/**
 * Extract initiative dependencies from initiative.md file.
 * Supports both legacy issue numbers (#123) and semantic IDs (S1362.I1).
 */
function extractInitiativeDependencies(initDir: string): string[] {
	const initFile = path.join(initDir, "initiative.md");
	if (!fs.existsSync(initFile)) return [];

	try {
		const content = fs.readFileSync(initFile, "utf-8");
		const deps: string[] = [];

		// Look for "Blocked By" section
		const patterns = [
			/### Blocked By\s*\n([^#]*)/i,
			/\*\*Blocked By\*\*:?\s*([^\n]*)/i,
			/Blocked By:?\s*([^\n]*)/i,
		];

		for (const pattern of patterns) {
			const match = content.match(pattern);
			const section = match?.[1];
			if (section) {
				// Match semantic IDs first: S1362.I1
				const semanticMatches = section.match(/\bS\d+\.I\d+\b/g);
				if (semanticMatches) {
					for (const semanticMatch of semanticMatches) {
						if (!deps.includes(semanticMatch)) {
							deps.push(semanticMatch);
						}
					}
				}

				// Match GitHub issue numbers: #1234
				const issueMatches = section.match(/#(\d+)/g);
				if (issueMatches) {
					for (const issueMatch of issueMatches) {
						const issueNum = issueMatch.slice(1);
						if (!deps.includes(issueNum)) {
							deps.push(issueNum);
						}
					}
				}
			}
		}

		return deps;
	} catch {
		return [];
	}
}

/**

* Extract initiative priority from initiative.md metadata table.
 */
function extractInitiativePriority(initDir: string): number {
	const initFile = path.join(initDir, "initiative.md");
	if (!fs.existsSync(initFile)) return 999;

	try {
		const content = fs.readFileSync(initFile, "utf-8");

		// Look for Priority in metadata table: | **Priority** | 1 |
		const match = content.match(/\|\s*\*\*Priority\*\*\s*\|\s*(\d+)\s*\|/i);
		const priorityStr = match?.[1];
		if (priorityStr) {
			return parseInt(priorityStr, 10);
		}

		return 999;
	} catch {
		return 999;
	}
}

/**

* Extract feature priority from feature.md metadata table.
 */
function extractFeaturePriority(featureDir: string): number {
	const featureFile = path.join(featureDir, "feature.md");
	if (!fs.existsSync(featureFile)) return 999;

	try {
		const content = fs.readFileSync(featureFile, "utf-8");

		// Look for Priority in metadata table: | **Priority** | 1 |
		const match = content.match(/\|\s*\*\*Priority\*\*\s*\|\s*(\d+)\s*\|/i);
		const priorityStr = match?.[1];
		if (priorityStr) {
			return parseInt(priorityStr, 10);
		}

		return 999;
	} catch {
		return 999;
	}
}

/**
 * Extract the F# number from Feature ID in feature.md metadata table.
 * Supports both old and new formats:
 * - Old: "1365-F1" -> returns "1"
 * - New: "S1362.I1.F1" -> returns "1"
 * This is used for mapping internal F# references.
 */
function extractFeatureFNumber(featureDir: string): string | null {
	const featureFile = path.join(featureDir, "feature.md");
	if (!fs.existsSync(featureFile)) return null;

	try {
		const content = fs.readFileSync(featureFile, "utf-8");

		// Look for Feature ID in metadata table:
		// New format: | **Feature ID** | S1362.I1.F1 |
		const newMatch = content.match(
			/\|\s*\*\*Feature ID\*\*\s*\|\s*S\d+\.I\d+\.F(\d+)\s*\|/i,
		);
		if (newMatch?.[1]) {
			return newMatch[1];
		}

		// Old format: | **Feature ID** | 1365-F1 |
		const oldMatch = content.match(
			/\|\s*\*\*Feature ID\*\*\s*\|\s*\d+-F(\d+)\s*\|/i,
		);
		if (oldMatch?.[1]) {
			return oldMatch[1];
		}

		return null;
	} catch {
		return null;
	}
}

// ============================================================================
// Main Function
// ============================================================================

async function main() {
	const args = process.argv.slice(2);
	const specIdArg = args[0];
	const specId = specIdArg ? parseInt(specIdArg, 10) : NaN;

	if (Number.isNaN(specId)) {
		console.error("Usage: tsx generate-spec-manifest.ts <spec-id>");
		console.error("Example: tsx generate-spec-manifest.ts 1362");
		process.exit(1);
	}

	const projectRoot = findProjectRoot();
	console.log(`Project root: ${projectRoot}`);

	// Find spec directory
	const specDir = findSpecDir(projectRoot, specId);
	if (!specDir) {
		console.error(`Spec #${specId} not found in .ai/alpha/specs/`);
		process.exit(1);
	}

	console.log(`Spec directory: ${specDir}`);

	// Extract spec name from directory (supports both old and new formats)
	const specName = path
		.basename(specDir)
		.replace(/^S?\d+-Spec-/, "")
		.replace(/-/g, " ");

	// Construct semantic spec ID
	const specSemanticId = `S${specId}`;

	// Find all initiative directories
	const initDirs = findInitiativeDirectories(specDir);
	console.log(`Found ${initDirs.length} initiatives`);

	if (initDirs.length === 0) {
		console.error("No initiatives found under spec");
		process.exit(1);
	}

	// =========================================================================
	// Two-pass processing:
	// Pass 1: Collect all features and build priority map
	// Pass 2: Resolve internal F# references to actual feature IDs
	// =========================================================================

	const initiatives: InitiativeEntry[] = [];
	const featureQueue: FeatureEntry[] = [];
	let totalTasks = 0;
	let totalTasksCompleted = 0;

	// Map: "initiative_id-F#" -> feature_id (string)
	// Used to resolve F1, F2, etc. references within an initiative
	const featurePriorityMap = new Map<string, string>();

	// Temporary storage for raw dependencies (before resolution)
	const rawDependenciesMap = new Map<string, RawDependency[]>();

	// Pass 1: Collect all features and build the priority map
	console.log("\n📦 Pass 1: Collecting features...");

	for (const initDir of initDirs) {
		const initDirName = path.basename(initDir);

		// Extract initiative ID - supports both old and new formats:
		// Old: 1365-Initiative-slug -> "1365"
		// New: S1362.I1-Initiative-slug -> "S1362.I1"
		let initId: string;
		let initPriorityNum: number;

		const newInitMatch = initDirName.match(/^(S\d+\.I(\d+))-Initiative-/);
		const oldInitMatch = initDirName.match(/^(\d+)-Initiative-/);

		if (newInitMatch?.[1] && newInitMatch[2]) {
			initId = newInitMatch[1]; // e.g., "S1362.I1"
			initPriorityNum = parseInt(newInitMatch[2], 10); // Extract I# for priority
		} else if (oldInitMatch?.[1]) {
			initId = oldInitMatch[1]; // e.g., "1365"
			initPriorityNum = extractInitiativePriority(initDir);
		} else {
			// Fallback
			initId = "0";
			initPriorityNum = 999;
		}

		const initName = initDirName
			.replace(/^(S\d+\.I\d+|\d+)-Initiative-/, "")
			.replace(/-/g, " ");
		const initSlug = initDirName.replace(/^(S\d+\.I\d+|\d+)-Initiative-/, "");

		// Use initPriorityNum for sorting but use extractInitiativePriority for fallback
		const initPriority = newInitMatch
			? initPriorityNum
			: extractInitiativePriority(initDir);
		const initDeps = extractInitiativeDependencies(initDir);

		// Find features in this initiative
		const featureDirs = findFeatureDirectories(initDir);

		const initiativeFeatures: FeatureEntry[] = [];

		for (const featureDir of featureDirs) {
			const tasksJson = loadTasksJson(featureDir);
			if (!tasksJson) continue;

			// Feature ID from tasks.json (already a string in new format)
			const featureId = tasksJson.metadata.feature_id;
			const relativePath = path.relative(
				specDir,
				path.join(featureDir, "tasks.json"),
			);
			const featurePriority = extractFeaturePriority(featureDir);

			// Extract raw dependencies (will resolve in Pass 2)
			const rawDeps = extractFeatureDependenciesRaw(featureDir);
			rawDependenciesMap.set(featureId, rawDeps);

			// Build F# map: initiative_id-F# -> feature_id
			// Uses Feature ID (e.g., "S1362.I1.F1") not Priority for correct mapping
			// This allows us to resolve "F1" -> feature with Feature ID "S1362.I1.F1"
			const fNumber = extractFeatureFNumber(featureDir);
			if (fNumber !== null) {
				const fKey = `${initId}-${fNumber}`;
				featurePriorityMap.set(fKey, featureId);
			}

			const completedTasks = tasksJson.tasks.filter(
				(t) => t.status === "completed",
			).length;
			const taskCount = tasksJson.tasks.length;

			totalTasks += taskCount;
			totalTasksCompleted += completedTasks;

			const featureStatus =
				completedTasks === taskCount
					? "completed"
					: completedTasks > 0
						? "in_progress"
						: "pending";

			// Aggregate database flags from tasks.json
			const requiresDatabase =
				tasksJson.metadata.requires_database ||
				tasksJson.tasks.some((t) => t.requires_database === true);
			const databaseTaskCount =
				tasksJson.metadata.database_tasks?.length ||
				tasksJson.tasks.filter((t) => t.requires_database === true).length;

			// Initiative ID from tasks.json (already a string)
			const featureInitiativeId = tasksJson.metadata.initiative_id;

			initiativeFeatures.push({
				id: featureId,
				initiative_id: featureInitiativeId,
				title: tasksJson.metadata.feature_name,
				slug: tasksJson.metadata.feature_slug,
				priority: featurePriority,
				global_priority: 0, // Will be calculated after sorting
				status: featureStatus,
				tasks_file: relativePath,
				feature_dir: featureDir,
				task_count: taskCount,
				tasks_completed: completedTasks,
				sequential_hours: tasksJson.execution.duration.sequential,
				parallel_hours: tasksJson.execution.duration.parallel,
				dependencies: [], // Will be resolved in Pass 2
				github_issue: tasksJson.github?.feature_tasks_issue || null,
				requires_database: requiresDatabase,
				database_task_count: databaseTaskCount,
			});
		}

		// Sort features within initiative by priority
		initiativeFeatures.sort((a, b) => a.priority - b.priority);

		// Add to global queue
		featureQueue.push(...initiativeFeatures);

		// Calculate initiative status
		const completedFeatures = initiativeFeatures.filter(
			(f) => f.status === "completed",
		).length;
		const initStatus: InitiativeEntry["status"] =
			completedFeatures === initiativeFeatures.length
				? "completed"
				: completedFeatures > 0
					? "in_progress"
					: "pending";

		initiatives.push({
			id: initId,
			name: initName,
			slug: initSlug,
			priority: initPriority,
			status: initStatus,
			initiative_dir: initDir,
			feature_count: initiativeFeatures.length,
			features_completed: completedFeatures,
			dependencies: initDeps,
		});
	}

	// =========================================================================
	// Pass 2: Resolve internal F# references to actual feature IDs
	// =========================================================================
	console.log("🔗 Pass 2: Resolving dependencies...");

	for (const feature of featureQueue) {
		const rawDeps = rawDependenciesMap.get(feature.id);
		if (rawDeps && rawDeps.length > 0) {
			feature.dependencies = resolveFeatureDependencies(
				rawDeps,
				feature.id,
				feature.initiative_id,
				featurePriorityMap,
			);

			if (feature.dependencies.length > 0) {
				console.log(
					`   ${feature.title}: depends on [${feature.dependencies.join(", ")}]`,
				);
			}
		}
	}

	// =========================================================================
	// Pass 2b: Validate dependency graph for circular dependencies
	// Bug fix #1916: Prevent circular dependencies from causing orchestrator hang
	// =========================================================================
	console.log("🔍 Pass 2b: Validating dependency graph...");

	const cycleResult = validateDependencyGraph(featureQueue, console.log);
	if (cycleResult.hasCycles) {
		console.error(
			"\n❌ MANIFEST GENERATION FAILED: Circular dependencies detected",
		);
		console.error(
			"   Fix the dependencies in feature.md files and regenerate the manifest.",
		);
		process.exit(1);
	}
	console.log("   ✅ No circular dependencies found");

	// =========================================================================
	// Pass 3: Propagate initiative-level dependencies to features
	// This ensures the work queue respects initiative dependency hierarchy
	// =========================================================================
	console.log("🔗 Pass 3: Propagating initiative dependencies to features...");

	for (const initiative of initiatives) {
		if (initiative.dependencies.length > 0) {
			for (const feature of featureQueue) {
				if (feature.initiative_id === initiative.id) {
					// Prepend initiative dependencies, then existing feature dependencies
					// Use Set to avoid duplicates
					const combinedDeps = new Set([
						...initiative.dependencies,
						...feature.dependencies,
					]);
					feature.dependencies = [...combinedDeps];
				}
			}
		}
	}

	// Sort initiatives by priority
	initiatives.sort((a, b) => a.priority - b.priority);

	// Sort feature queue: first by initiative priority, then by feature priority
	featureQueue.sort((a, b) => {
		const initA = initiatives.find((i) => i.id === a.initiative_id);
		const initB = initiatives.find((i) => i.id === b.initiative_id);
		const initPriorityA = initA?.priority || 999;
		const initPriorityB = initB?.priority || 999;

		if (initPriorityA !== initPriorityB) {
			return initPriorityA - initPriorityB;
		}
		return a.priority - b.priority;
	});

	// Assign global priorities
	featureQueue.forEach((f, index) => {
		f.global_priority = index + 1;
	});

	// Find next feature (first pending with satisfied dependencies)
	const completedFeatureIds = new Set(
		featureQueue.filter((f) => f.status === "completed").map((f) => f.id),
	);

	let nextFeatureId: string | null = null;
	for (const feature of featureQueue) {
		if (feature.status === "pending") {
			const depsComplete = feature.dependencies.every((depId) =>
				completedFeatureIds.has(depId),
			);
			if (depsComplete) {
				nextFeatureId = feature.id;
				break;
			}
		}
	}

	// Find last completed feature
	const completedFeatures = featureQueue.filter(
		(f) => f.status === "completed",
	);
	const lastCompletedFeature = completedFeatures[completedFeatures.length - 1];
	const lastCompletedFeatureId = lastCompletedFeature?.id ?? null;

	// Calculate overall status
	const featuresCompleted = featureQueue.filter(
		(f) => f.status === "completed",
	).length;
	const initiativesCompleted = initiatives.filter(
		(i) => i.status === "completed",
	).length;

	let overallStatus: SpecManifest["progress"]["status"] = "pending";
	if (featuresCompleted === featureQueue.length) {
		overallStatus = "completed";
	} else if (featuresCompleted > 0) {
		overallStatus = "in_progress";
	}

	// Build manifest
	const manifest: SpecManifest = {
		metadata: {
			spec_id: specSemanticId, // e.g., "S1362"
			spec_name: specName,
			generated_at: new Date().toISOString(),
			spec_dir: specDir,
			research_dir: path.join(specDir, "research-library"),
		},
		initiatives,
		feature_queue: featureQueue,
		progress: {
			status: overallStatus,
			initiatives_completed: initiativesCompleted,
			initiatives_total: initiatives.length,
			features_completed: featuresCompleted,
			features_total: featureQueue.length,
			tasks_completed: totalTasksCompleted,
			tasks_total: totalTasks,
			next_feature_id: nextFeatureId,
			last_completed_feature_id: lastCompletedFeatureId,
			started_at: null,
			completed_at: null,
			last_checkpoint: null,
		},
		sandbox: {
			sandbox_ids: [],
			branch_name: null,
			created_at: null,
		},
	};

	// Write manifest
	const manifestPath = path.join(specDir, "spec-manifest.json");
	fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, "\t"));

	// Print summary
	console.log(`\n✅ Spec manifest generated: ${manifestPath}`);
	console.log("\n" + "═".repeat(60));
	console.log(`   SPEC ${specSemanticId}: ${specName.toUpperCase()}`);
	console.log("═".repeat(60));

	console.log("\n📊 Summary:");
	console.log(`   Initiatives: ${initiatives.length}`);
	console.log(`   Features: ${featureQueue.length}`);
	console.log(`   Tasks: ${totalTasks}`);
	console.log(
		`   Completed: ${featuresCompleted}/${featureQueue.length} features`,
	);

	console.log("\n📋 Initiatives:");
	for (const init of initiatives) {
		const statusIcon =
			init.status === "completed"
				? "✅"
				: init.status === "in_progress"
					? "🔄"
					: "⏳";
		const depsStr =
			init.dependencies.length > 0
				? ` (blocked by: ${init.dependencies.join(", ")})`
				: "";
		console.log(
			`   ${statusIcon} ${init.id}: ${init.name} [P${init.priority}] - ${init.features_completed}/${init.feature_count} features${depsStr}`,
		);
	}

	// Count DB features
	const dbFeatureCount = featureQueue.filter((f) => f.requires_database).length;

	console.log("\n📦 Feature Queue:");
	for (const feature of featureQueue) {
		const statusIcon =
			feature.status === "completed"
				? "✅"
				: feature.status === "in_progress"
					? "🔄"
					: "⏳";
		const depsStr =
			feature.dependencies.length > 0
				? ` [blocked by: ${feature.dependencies.join(", ")}]`
				: "";
		const dbMarker = feature.requires_database ? " 🗄️" : "";
		const nextMarker = feature.id === nextFeatureId ? " ← NEXT" : "";
		console.log(
			`   ${statusIcon} [${feature.global_priority}] ${feature.id}: ${feature.title}${dbMarker}${depsStr}${nextMarker}`,
		);
	}

	if (dbFeatureCount > 0) {
		console.log(
			`\n🗄️  Database Features: ${dbFeatureCount} features require database access`,
		);
		console.log("   (These will be serialized to prevent migration conflicts)");
	}

	if (nextFeatureId) {
		console.log(`\n🎯 Next feature to implement: ${nextFeatureId}`);
	} else if (overallStatus === "completed") {
		console.log("\n🎉 All features completed!");
	} else {
		console.log("\n⚠️ No features available (check dependencies)");
	}

	console.log("\n" + "═".repeat(60));

	return manifest;
}

main().catch((error) => {
	console.error("Error:", error);
	process.exit(1);
});
