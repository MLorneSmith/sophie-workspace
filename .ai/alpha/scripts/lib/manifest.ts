/**

* Manifest Management Module
*
* Handles loading, saving, finding, and generating spec manifests and directories.
* Also manages the overall progress file for UI consumption.
 */

import * as fs from "node:fs";
import * as path from "node:path";

import {
	ARCHIVE_DIR,
	LOGS_DIR,
	MAX_ARCHIVED_RUNS,
	UI_PROGRESS_DIR,
} from "../config/index.js";
import type {
	FeatureEntry,
	InitiativeEntry,
	SpecManifest,
} from "../types/index.js";
import { aggregateRequiredEnvVars } from "./env-requirements.js";
import { getProjectRoot } from "./lock.js";
import { autoGeneratePhases } from "./phase.js";

// ============================================================================
// Types for Manifest Generation
// ============================================================================

interface TasksJson {
	metadata: {
		feature_id: string;
		feature_name: string;
		feature_slug?: string;
		initiative_id: string;
		spec_id: string;
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

interface RawDependency {
	type: "issue" | "internal" | "semantic";
	value: string;
}

// ============================================================================
// Circular Dependency Detection (#1820)
// ============================================================================

/**
 * Detect circular dependencies in feature queue.
 * Local implementation to avoid import cycles.
 *
 * @param featureQueue - Array of feature entries to check
 * @returns Array of cycles (each cycle is an array of feature IDs)
 */
function detectCircularDependenciesLocal(
	featureQueue: FeatureEntry[],
): string[][] {
	const cycles: string[][] = [];
	const visited = new Set<string>();
	const recursionStack = new Set<string>();
	const featureIds = new Set(featureQueue.map((f) => f.id));

	function dfs(featureId: string, path: string[]): void {
		if (recursionStack.has(featureId)) {
			// Found a cycle - extract the cycle from the path
			const cycleStart = path.indexOf(featureId);
			const cycle = [...path.slice(cycleStart), featureId];
			cycles.push(cycle);
			return;
		}

		if (visited.has(featureId)) {
			return;
		}

		visited.add(featureId);
		recursionStack.add(featureId);

		const feature = featureQueue.find((f) => f.id === featureId);
		if (feature) {
			for (const depId of feature.dependencies) {
				// Only follow feature-level dependencies for cycle detection
				if (featureIds.has(depId)) {
					dfs(depId, [...path, featureId]);
				}
			}
		}

		recursionStack.delete(featureId);
	}

	for (const feature of featureQueue) {
		if (!visited.has(feature.id)) {
			dfs(feature.id, []);
		}
	}

	return cycles;
}

// ============================================================================
// Manifest Generation Helper Functions
// ============================================================================

/**
 * Find initiative directories under a spec.
 * Supports both old and new naming conventions:
 * - Old: 1365-Initiative-slug/
 * - New: S1362.I1-Initiative-slug/
 */
function findInitiativeDirectories(specDir: string): string[] {
	const initDirs: string[] = [];

	const contents = fs.readdirSync(specDir);
	for (const item of contents) {
		const itemPath = path.join(specDir, item);
		if (!fs.statSync(itemPath).isDirectory()) continue;

		if (item.match(/^(S\d+\.I\d+|\d+)-Initiative-/)) {
			initDirs.push(itemPath);
		}
	}

	return initDirs.sort((a, b) => {
		const nameA = path.basename(a);
		const nameB = path.basename(b);

		const newMatchA = nameA.match(/^S\d+\.I(\d+)-/);
		const newMatchB = nameB.match(/^S\d+\.I(\d+)-/);

		if (newMatchA?.[1] && newMatchB?.[1]) {
			return parseInt(newMatchA[1], 10) - parseInt(newMatchB[1], 10);
		}

		const oldMatchA = nameA.match(/^(\d+)-/);
		const oldMatchB = nameB.match(/^(\d+)-/);

		const idA = oldMatchA?.[1] ? parseInt(oldMatchA[1], 10) : 0;
		const idB = oldMatchB?.[1] ? parseInt(oldMatchB[1], 10) : 0;
		return idA - idB;
	});
}

/**
 * Find feature directories under an initiative.
 * Supports both old and new naming conventions:
 * - Old: 1367-Feature-slug/
 * - New: S1362.I1.F1-Feature-slug/
 */
function findFeatureDirectories(initDir: string): string[] {
	const featureDirs: string[] = [];

	const contents = fs.readdirSync(initDir);
	for (const item of contents) {
		const itemPath = path.join(initDir, item);
		if (!fs.statSync(itemPath).isDirectory()) continue;

		if (item.match(/^(S\d+\.I\d+\.F\d+|\d+)-Feature-/)) {
			const tasksFile = path.join(itemPath, "tasks.json");
			if (fs.existsSync(tasksFile)) {
				featureDirs.push(itemPath);
			}
		}
	}

	return featureDirs.sort((a, b) => {
		const nameA = path.basename(a);
		const nameB = path.basename(b);

		const newMatchA = nameA.match(/^S\d+\.I\d+\.F(\d+)-/);
		const newMatchB = nameB.match(/^S\d+\.I\d+\.F(\d+)-/);

		if (newMatchA?.[1] && newMatchB?.[1]) {
			return parseInt(newMatchA[1], 10) - parseInt(newMatchB[1], 10);
		}

		const oldMatchA = nameA.match(/^(\d+)-/);
		const oldMatchB = nameB.match(/^(\d+)-/);

		const idA = oldMatchA?.[1] ? parseInt(oldMatchA[1], 10) : 0;
		const idB = oldMatchB?.[1] ? parseInt(oldMatchB[1], 10) : 0;
		return idA - idB;
	});
}

/**
 * Load tasks.json from a feature directory.
 */
function loadTasksJson(featureDir: string): TasksJson | null {
	const tasksFile = path.join(featureDir, "tasks.json");
	try {
		const content = fs.readFileSync(tasksFile, "utf-8");
		return JSON.parse(content) as TasksJson;
	} catch {
		return null;
	}
}

/**
 * Extract raw feature dependencies from feature.md file.
 */
function extractFeatureDependenciesRaw(featureDir: string): RawDependency[] {
	const featureFile = path.join(featureDir, "feature.md");
	if (!fs.existsSync(featureFile)) return [];

	try {
		const content = fs.readFileSync(featureFile, "utf-8");
		const deps: RawDependency[] = [];

		const patterns = [
			/### Blocked By\s*\n([^#]*)/i,
			/\*\*Blocked By\*\*:?\s*([^\n]*)/i,
			/Blocked By:?\s*([^\n]*)/i,
		];

		for (const pattern of patterns) {
			const match = content.match(pattern);
			if (!match?.[1]) continue;
			const section: string = match[1];

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

			const issueMatches = section.match(/#(\d+)/g);
			if (issueMatches) {
				for (const issueMatch of issueMatches) {
					const issueNum = issueMatch.slice(1);
					if (!deps.some((d) => d.type === "issue" && d.value === issueNum)) {
						deps.push({ type: "issue", value: issueNum });
					}
				}
			}

			const internalMatches = section.match(/(?<!\.)\bF(\d+)\b/g);
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
 */
function resolveFeatureDependencies(
	rawDeps: RawDependency[],
	initiativeId: string,
	featurePriorityMap: Map<string, string>,
): string[] {
	const resolved: string[] = [];

	for (const dep of rawDeps) {
		if (dep.type === "semantic") {
			if (!resolved.includes(dep.value)) {
				resolved.push(dep.value);
			}
		} else if (dep.type === "issue") {
			if (!resolved.includes(dep.value)) {
				resolved.push(dep.value);
			}
		} else if (dep.type === "internal") {
			const key = `${initiativeId}-${dep.value}`;
			const featureId = featurePriorityMap.get(key);
			if (featureId && !resolved.includes(featureId)) {
				resolved.push(featureId);
			}
		}
	}

	return resolved;
}

/**
 * Extract initiative dependencies from initiative.md file.
 */
function extractInitiativeDependencies(initDir: string): string[] {
	const initFile = path.join(initDir, "initiative.md");
	if (!fs.existsSync(initFile)) return [];

	try {
		const content = fs.readFileSync(initFile, "utf-8");
		const deps: string[] = [];

		const patterns = [
			/### Blocked By\s*\n([^#]*)/i,
			/\*\*Blocked By\*\*:?\s*([^\n]*)/i,
			/Blocked By:?\s*([^\n]*)/i,
		];

		for (const pattern of patterns) {
			const match = content.match(pattern);
			const section = match?.[1];
			if (section) {
				const semanticMatches = section.match(/\bS\d+\.I\d+\b/g);
				if (semanticMatches) {
					for (const semanticMatch of semanticMatches) {
						if (!deps.includes(semanticMatch)) {
							deps.push(semanticMatch);
						}
					}
				}

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
 */
function extractFeatureFNumber(featureDir: string): string | null {
	const featureFile = path.join(featureDir, "feature.md");
	if (!fs.existsSync(featureFile)) return null;

	try {
		const content = fs.readFileSync(featureFile, "utf-8");

		const newMatch = content.match(
			/\|\s*\*\*Feature ID\*\*\s*\|\s*S\d+\.I\d+\.F(\d+)\s*\|/i,
		);
		if (newMatch?.[1]) {
			return newMatch[1];
		}

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
// Spec Directory Discovery
// ============================================================================

/**
 * Find the spec directory for a given spec ID.
 * Searches .ai/alpha/specs/ for directories matching the pattern `{id}-Spec-*`
 * Supports both old (1362-Spec-) and new (S1362-Spec-) naming conventions.
 *
 * @param projectRoot - The project root directory
 * @param specId - The spec ID to find (numeric)
 * @returns The spec directory path, or null if not found
 */
export function findSpecDir(
	projectRoot: string,
	specId: number,
): string | null {
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

// ============================================================================
// Manifest Generation
// ============================================================================

/**
 * Generate a spec manifest by scanning the spec directory for initiatives,
 * features, and tasks. This is called automatically by the orchestrator
 * when the manifest doesn't exist or is stale.
 *
 * @param projectRoot - The project root directory
 * @param specId - The spec ID (numeric)
 * @param specDir - The spec directory path
 * @param silent - If true, suppress console output (default: false)
 * @returns The generated manifest, or null if generation failed
 */
export function generateSpecManifest(
	_projectRoot: string,
	specId: number,
	specDir: string,
	silent: boolean = false,
): SpecManifest | null {
	const log = silent ? () => {} : console.log;

	log(`\n🔄 Generating spec manifest for #${specId}...`);

	// Extract spec name from directory
	const specName = path
		.basename(specDir)
		.replace(/^S?\d+-Spec-/, "")
		.replace(/-/g, " ");

	const specSemanticId = `S${specId}`;

	// Find all initiative directories
	const initDirs = findInitiativeDirectories(specDir);
	log(`   Found ${initDirs.length} initiatives`);

	if (initDirs.length === 0) {
		console.error("   ❌ No initiatives found under spec");
		return null;
	}

	// Two-pass processing
	const initiatives: InitiativeEntry[] = [];
	const featureQueue: FeatureEntry[] = [];
	let totalTasks = 0;
	let totalTasksCompleted = 0;

	const featurePriorityMap = new Map<string, string>();
	const rawDependenciesMap = new Map<string, RawDependency[]>();

	// Pass 1: Collect all features and build the priority map
	log("   Pass 1: Collecting features...");

	for (const initDir of initDirs) {
		const initDirName = path.basename(initDir);

		let initId: string;
		let initPriorityNum: number;

		const newInitMatch = initDirName.match(/^(S\d+\.I(\d+))-Initiative-/);
		const oldInitMatch = initDirName.match(/^(\d+)-Initiative-/);

		if (newInitMatch?.[1] && newInitMatch[2]) {
			initId = newInitMatch[1];
			initPriorityNum = parseInt(newInitMatch[2], 10);
		} else if (oldInitMatch?.[1]) {
			initId = oldInitMatch[1];
			initPriorityNum = extractInitiativePriority(initDir);
		} else {
			initId = "0";
			initPriorityNum = 999;
		}

		const initName = initDirName
			.replace(/^(S\d+\.I\d+|\d+)-Initiative-/, "")
			.replace(/-/g, " ");
		const initSlug = initDirName.replace(/^(S\d+\.I\d+|\d+)-Initiative-/, "");

		const initPriority = newInitMatch
			? initPriorityNum
			: extractInitiativePriority(initDir);
		const initDeps = extractInitiativeDependencies(initDir);

		const featureDirs = findFeatureDirectories(initDir);
		const initiativeFeatures: FeatureEntry[] = [];

		for (const featureDir of featureDirs) {
			const tasksJson = loadTasksJson(featureDir);
			if (!tasksJson) continue;

			const featureId = tasksJson.metadata.feature_id;
			const relativePath = path.relative(
				specDir,
				path.join(featureDir, "tasks.json"),
			);
			const featurePriority = extractFeaturePriority(featureDir);

			const rawDeps = extractFeatureDependenciesRaw(featureDir);
			rawDependenciesMap.set(featureId, rawDeps);

			const fNumber = extractFeatureFNumber(featureDir);
			if (fNumber !== null) {
				const fKey = `${initId}-${fNumber}`;
				featurePriorityMap.set(fKey, featureId);
			}

			const completedTasks = tasksJson.tasks.filter(
				(t) => t.status === "completed",
			).length;
			const taskCount = tasksJson.tasks.length;

			if (taskCount > 12) {
				log(
					`   ⚠️ Feature ${featureId} has ${taskCount} tasks (max recommended: 12). Consider splitting.`,
				);
			}

			totalTasks += taskCount;
			totalTasksCompleted += completedTasks;

			const featureStatus =
				completedTasks === taskCount
					? "completed"
					: completedTasks > 0
						? "in_progress"
						: "pending";

			const requiresDatabase =
				tasksJson.metadata.requires_database ||
				tasksJson.tasks.some((t) => t.requires_database === true);
			const databaseTaskCount =
				tasksJson.metadata.database_tasks?.length ||
				tasksJson.tasks.filter((t) => t.requires_database === true).length;

			const featureInitiativeId = tasksJson.metadata.initiative_id;

			initiativeFeatures.push({
				id: featureId,
				initiative_id: featureInitiativeId,
				title: tasksJson.metadata.feature_name,
				slug: tasksJson.metadata.feature_slug,
				priority: featurePriority,
				global_priority: 0,
				status: featureStatus,
				tasks_file: relativePath,
				feature_dir: featureDir,
				task_count: taskCount,
				tasks_completed: completedTasks,
				sequential_hours: tasksJson.execution.duration.sequential,
				parallel_hours: tasksJson.execution.duration.parallel,
				dependencies: [],
				github_issue: tasksJson.github?.feature_tasks_issue || null,
				requires_database: requiresDatabase,
				database_task_count: databaseTaskCount,
			});
		}

		initiativeFeatures.sort((a, b) => a.priority - b.priority);
		featureQueue.push(...initiativeFeatures);

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

	// Pass 2: Resolve internal F# references
	log("   Pass 2: Resolving dependencies...");

	for (const feature of featureQueue) {
		const rawDeps = rawDependenciesMap.get(feature.id);
		if (rawDeps && rawDeps.length > 0) {
			feature.dependencies = resolveFeatureDependencies(
				rawDeps,
				feature.initiative_id,
				featurePriorityMap,
			);
		}
	}

	// Pass 3: Propagate initiative-level dependencies to features (with optimization)
	// This ensures the work queue respects initiative dependency hierarchy
	// OPTIMIZATION (#1820): Only propagate if feature doesn't already have feature-level deps
	// from that initiative. This enables better parallelism.
	log("   Pass 3: Propagating initiative dependencies to features...");

	for (const initiative of initiatives) {
		if (initiative.dependencies.length > 0) {
			for (const feature of featureQueue) {
				if (feature.initiative_id === initiative.id) {
					// Check if feature already has feature-level deps from the blocking initiative
					// If so, skip the initiative-level propagation (feature-level is more granular)
					const hasFeatureLevelDeps = feature.dependencies.some((depId) => {
						// Check each initiative dependency
						for (const initDepId of initiative.dependencies) {
							// If feature already has deps from this initiative (S#.I#.F# format)
							if (depId.startsWith(initDepId) && depId.includes(".F")) {
								return true;
							}
						}
						return false;
					});

					if (hasFeatureLevelDeps) {
						// Feature has explicit feature-level deps, skip initiative propagation
						// This enables better parallelism (#1820)
						continue;
					}

					// No feature-level deps - propagate initiative dependencies
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

	// Sort feature queue by initiative priority, then feature priority
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

	// Find next feature
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

	// Build manifest (first pass - without required_env_vars)
	const manifest: SpecManifest = {
		metadata: {
			spec_id: specSemanticId,
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

	// Aggregate required environment variables from research files and tasks.json
	log("   Pass 4: Aggregating environment requirements...");
	const requiredEnvVars = aggregateRequiredEnvVars(manifest);
	if (requiredEnvVars.length > 0) {
		manifest.metadata.required_env_vars = requiredEnvVars;
		log(`   Found ${requiredEnvVars.length} required environment variable(s)`);
	}

	// Pass 5: Auto-generate execution phases (#1961)
	log("   Pass 5: Generating execution phases...");
	const phases = autoGeneratePhases(manifest);
	manifest.phases = phases;
	log(
		`   Generated ${phases.length} phase(s): ${phases.map((p) => `${p.id} (${p.feature_count} features)`).join(", ")}`,
	);

	// Pass 6: Validate dependencies - check for circular references (#1820)
	log("   Pass 6: Validating dependency graph...");
	const circularDeps = detectCircularDependenciesLocal(featureQueue);
	if (circularDeps.length > 0) {
		console.error("   ⚠️ Circular dependencies detected:");
		for (const cycle of circularDeps) {
			console.error(`      ${cycle.join(" → ")}`);
		}
		// Don't fail - just warn (existing manifests might have issues)
	} else {
		log("   ✓ No circular dependencies detected");
	}

	// Write manifest
	const manifestPath = path.join(specDir, "spec-manifest.json");
	fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, "\t"));

	log(`   ✅ Spec manifest generated: ${manifestPath}`);
	log(
		`   📊 ${initiatives.length} initiatives, ${featureQueue.length} features, ${totalTasks} tasks`,
	);

	return manifest;
}

// ============================================================================
// Manifest Loading & Saving
// ============================================================================

/**

* Load a spec manifest from a spec directory.
*
* @param specDir - The spec directory containing spec-manifest.json
* @returns The loaded manifest, or null if not found/invalid
 */
export function loadManifest(specDir: string): SpecManifest | null {
	const manifestPath = path.join(specDir, "spec-manifest.json");

	if (!fs.existsSync(manifestPath)) {
		return null;
	}

	try {
		const content = fs.readFileSync(manifestPath, "utf-8");
		return JSON.parse(content) as SpecManifest;
	} catch (error) {
		console.error(`Failed to load manifest: ${error}`);
		return null;
	}
}

/**

* Save a spec manifest to its directory.
* Updates the last_checkpoint timestamp and writes overall progress for UI.
*
* @param manifest - The manifest to save
* @param reviewUrls - Optional review URLs to include in progress (for completion)
* @param runId - Optional run ID for this orchestrator session
 */
export function saveManifest(
	manifest: SpecManifest,
	reviewUrls?: ReviewUrlForUI[],
	runId?: string,
): void {
	const manifestPath = path.join(
		manifest.metadata.spec_dir,
		"spec-manifest.json",
	);
	manifest.progress.last_checkpoint = new Date().toISOString();
	fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, "\t"));

	// Also write overall progress for UI consumption
	// Pass through reviewUrls and runId to ensure they're written atomically with status
	writeOverallProgress(manifest, reviewUrls, runId);
}

// ============================================================================
// Overall Progress (for UI)
// ============================================================================

/**

* Ensure the UI progress directory exists.
 */
export function ensureUIProgressDir(): string {
	const progressDir = path.join(getProjectRoot(), UI_PROGRESS_DIR);
	if (!fs.existsSync(progressDir)) {
		fs.mkdirSync(progressDir, { recursive: true });
	}
	return progressDir;
}

/**

* Review URL for UI display
 */
export interface ReviewUrlForUI {
	label: string;
	vscode: string;
	devServer: string;
}

/**

* Write overall progress to local file for UI consumption.
* This provides authoritative counts from the manifest since sandbox
* progress files only contain current feature info.
*
* IMPORTANT: Counts are now calculated from manifest state instead of using
* stored increment values. This prevents counts from exceeding totals when
* features are retried or fail and restart.
*
* @param manifest - The manifest to extract progress from
* @param reviewUrls - Optional review URLs to include (for completion screen)
* @param runId - Optional run ID for this orchestrator session
 */
export function writeOverallProgress(
	manifest: SpecManifest,
	reviewUrls?: ReviewUrlForUI[],
	runId?: string,
): void {
	const progressDir = ensureUIProgressDir();
	const filePath = path.join(progressDir, "overall-progress.json");

	// Calculate features completed by counting status from manifest state
	// This prevents counts from exceeding totals when features are retried
	const featuresCompleted = manifest.feature_queue.filter(
		(f) => f.status === "completed",
	).length;

	// Calculate tasks completed by summing from ALL features (completed and in-progress)
	// Fix for issue #1688: Previously only counted tasks from completed features,
	// causing mismatch between Overall Progress (101/101) and sandbox progress (18/19).
	// Now includes tasks_completed from in-progress features to provide accurate real-time counts.
	const tasksCompleted = manifest.feature_queue.reduce(
		(sum, f) => sum + (f.tasks_completed || 0),
		0,
	);

	// Calculate initiatives completed by counting status from manifest state
	const initiativesCompleted = manifest.initiatives.filter(
		(i) => i.status === "completed",
	).length;

	// Cap at totals to prevent > 100% display in case of any edge cases
	const cappedFeaturesCompleted = Math.min(
		featuresCompleted,
		manifest.progress.features_total,
	);
	const cappedTasksCompleted = Math.min(
		tasksCompleted,
		manifest.progress.tasks_total,
	);
	const cappedInitiativesCompleted = Math.min(
		initiativesCompleted,
		manifest.progress.initiatives_total,
	);

	// Update manifest.progress with calculated values for consistency
	manifest.progress.features_completed = cappedFeaturesCompleted;
	manifest.progress.tasks_completed = cappedTasksCompleted;
	manifest.progress.initiatives_completed = cappedInitiativesCompleted;

	const overallProgress: Record<string, unknown> = {
		specId: manifest.metadata.spec_id,
		specName: manifest.metadata.spec_name,
		status: manifest.progress.status,
		initiativesCompleted: cappedInitiativesCompleted,
		initiativesTotal: manifest.progress.initiatives_total,
		featuresCompleted: cappedFeaturesCompleted,
		featuresTotal: manifest.progress.features_total,
		tasksCompleted: cappedTasksCompleted,
		tasksTotal: manifest.progress.tasks_total,
		lastCheckpoint: new Date().toISOString(),
		branchName: manifest.sandbox.branch_name,
		runId,
	};

	// Include review URLs if provided
	if (reviewUrls && reviewUrls.length > 0) {
		overallProgress.reviewUrls = reviewUrls;
	}

	try {
		fs.writeFileSync(filePath, JSON.stringify(overallProgress, null, "\t"));
	} catch {
		// Ignore write errors
	}
}

/**
 * Archive and clear previous run data.
 * Moves old progress files and logs to timestamped archive directory
 * instead of deleting them, then cleans up archives beyond MAX_ARCHIVED_RUNS.
 *
 * @param runId - The new run ID (for logging purposes)
 */
export function archiveAndClearPreviousRun(_runId: string): void {
	const projectRoot = getProjectRoot();
	const archiveDir = path.join(projectRoot, ARCHIVE_DIR);
	const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
	const archivePath = path.join(archiveDir, timestamp);

	const progressDir = path.join(projectRoot, UI_PROGRESS_DIR);
	const logsDir = path.join(projectRoot, LOGS_DIR);

	// Check if there's anything to archive
	const hasProgressFiles =
		fs.existsSync(progressDir) &&
		fs.readdirSync(progressDir).some((f) => f.endsWith("-progress.json"));
	const hasLogFiles =
		fs.existsSync(logsDir) &&
		fs
			.readdirSync(logsDir)
			.some(
				(f) =>
					(f.startsWith("sbx-") && f.endsWith(".log")) || f.startsWith("run-"),
			);

	if (!hasProgressFiles && !hasLogFiles) {
		// Nothing to archive
		return;
	}

	// Create archive directory
	try {
		fs.mkdirSync(archivePath, { recursive: true });
	} catch {
		// If we can't create archive, fall back to clearing files
		clearProgressAndLogs(progressDir, logsDir);
		return;
	}

	// Archive progress files
	if (fs.existsSync(progressDir)) {
		const progressArchive = path.join(archivePath, "progress");
		fs.mkdirSync(progressArchive, { recursive: true });

		for (const file of fs.readdirSync(progressDir)) {
			if (file.endsWith("-progress.json")) {
				try {
					const src = path.join(progressDir, file);
					const dest = path.join(progressArchive, file);
					fs.copyFileSync(src, dest);
					fs.unlinkSync(src);
				} catch {
					// Ignore individual file errors
				}
			}
		}
	}

	// Archive log files/directories
	if (fs.existsSync(logsDir)) {
		const logsArchive = path.join(archivePath, "logs");
		fs.mkdirSync(logsArchive, { recursive: true });

		for (const entry of fs.readdirSync(logsDir)) {
			const srcPath = path.join(logsDir, entry);
			const destPath = path.join(logsArchive, entry);

			try {
				const stat = fs.statSync(srcPath);
				if (stat.isDirectory()) {
					// Copy directory recursively (run-specific log directories)
					copyDirRecursive(srcPath, destPath);
					removeDirRecursive(srcPath);
				} else if (entry.startsWith("sbx-") && entry.endsWith(".log")) {
					// Copy individual log files (legacy format)
					fs.copyFileSync(srcPath, destPath);
					fs.unlinkSync(srcPath);
				}
			} catch {
				// Ignore individual file errors
			}
		}
	}

	// Clean up old archives if exceeding MAX_ARCHIVED_RUNS
	cleanupOldArchives(archiveDir);
}

/**
 * Clear progress and log files without archiving (fallback).
 */
function clearProgressAndLogs(progressDir: string, logsDir: string): void {
	if (fs.existsSync(progressDir)) {
		for (const file of fs.readdirSync(progressDir)) {
			if (file.endsWith("-progress.json")) {
				try {
					fs.unlinkSync(path.join(progressDir, file));
				} catch {
					// Ignore deletion errors
				}
			}
		}
	}

	if (fs.existsSync(logsDir)) {
		for (const entry of fs.readdirSync(logsDir)) {
			const entryPath = path.join(logsDir, entry);
			try {
				const stat = fs.statSync(entryPath);
				if (stat.isDirectory()) {
					removeDirRecursive(entryPath);
				} else if (entry.startsWith("sbx-") && entry.endsWith(".log")) {
					fs.unlinkSync(entryPath);
				}
			} catch {
				// Ignore deletion errors
			}
		}
	}
}

/**
 * Copy a directory recursively.
 */
function copyDirRecursive(src: string, dest: string): void {
	fs.mkdirSync(dest, { recursive: true });
	for (const entry of fs.readdirSync(src)) {
		const srcPath = path.join(src, entry);
		const destPath = path.join(dest, entry);
		const stat = fs.statSync(srcPath);
		if (stat.isDirectory()) {
			copyDirRecursive(srcPath, destPath);
		} else {
			fs.copyFileSync(srcPath, destPath);
		}
	}
}

/**
 * Remove a directory recursively.
 */
function removeDirRecursive(dir: string): void {
	if (fs.existsSync(dir)) {
		for (const entry of fs.readdirSync(dir)) {
			const entryPath = path.join(dir, entry);
			const stat = fs.statSync(entryPath);
			if (stat.isDirectory()) {
				removeDirRecursive(entryPath);
			} else {
				fs.unlinkSync(entryPath);
			}
		}
		fs.rmdirSync(dir);
	}
}

/**
 * Clean up old archives beyond MAX_ARCHIVED_RUNS.
 */
function cleanupOldArchives(archiveDir: string): void {
	if (!fs.existsSync(archiveDir)) {
		return;
	}

	const archives = fs
		.readdirSync(archiveDir)
		.filter((d) => {
			const fullPath = path.join(archiveDir, d);
			return fs.statSync(fullPath).isDirectory();
		})
		.sort()
		.reverse(); // Most recent first

	// Remove archives beyond the limit
	for (let i = MAX_ARCHIVED_RUNS; i < archives.length; i++) {
		const archiveName = archives[i];
		if (!archiveName) continue;
		const archivePath = path.join(archiveDir, archiveName);
		try {
			removeDirRecursive(archivePath);
		} catch {
			// Ignore cleanup errors
		}
	}
}

/**
 * @deprecated Use archiveAndClearPreviousRun instead.
 * Clear all UI progress files and log files.
 * Called at orchestration start to clean up stale data.
 */
export function clearUIProgress(): void {
	const projectRoot = getProjectRoot();
	const progressDir = path.join(projectRoot, UI_PROGRESS_DIR);
	const logsDir = path.join(projectRoot, LOGS_DIR);
	clearProgressAndLogs(progressDir, logsDir);
}
