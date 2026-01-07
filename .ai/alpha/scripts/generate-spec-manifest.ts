#!/usr/bin/env tsx

/**
 * Generate Spec Manifest
 *
 * Aggregates all initiatives and features under a spec into a single
 * spec-manifest.json for the Alpha orchestrator.
 *
 * Usage:
 *   tsx generate-spec-manifest.ts <spec-id>
 *   tsx generate-spec-manifest.ts 1362
 *
 * Output:
 *   Creates .ai/alpha/specs/<spec-dir>/spec-manifest.json
 */

import * as fs from "node:fs";
import * as path from "node:path";

// ============================================================================
// Types
// ============================================================================

interface TasksJson {
	metadata: {
		feature_id: number;
		feature_name: string;
		feature_slug?: string;
		initiative_id: number;
		spec_id: number;
	};
	tasks: Array<{
		id: string;
		name: string;
		status: string;
		estimated_hours: number;
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
	id: number;
	initiative_id: number;
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
	dependencies: number[]; // Feature IDs this is blocked by
	github_issue: number | null;
	assigned_sandbox?: string;
	error?: string;
}

interface InitiativeEntry {
	id: number;
	name: string;
	slug: string;
	priority: number;
	status: "pending" | "in_progress" | "completed" | "failed" | "partial";
	initiative_dir: string;
	feature_count: number;
	features_completed: number;
	dependencies: number[]; // Initiative IDs this is blocked by
}

interface SpecManifest {
	metadata: {
		spec_id: number;
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
		next_feature_id: number | null;
		last_completed_feature_id: number | null;
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

function findSpecDir(projectRoot: string, specId: number): string | null {
	const specsDir = path.join(projectRoot, ".ai", "alpha", "specs");

	if (!fs.existsSync(specsDir)) {
		return null;
	}

	const specDirs = fs.readdirSync(specsDir);

	for (const specDir of specDirs) {
		const match = specDir.match(/^(\d+)-Spec-/);
		if (match && parseInt(match[1], 10) === specId) {
			return path.join(specsDir, specDir);
		}
	}

	return null;
}

function findInitiativeDirectories(specDir: string): string[] {
	const initDirs: string[] = [];

	const contents = fs.readdirSync(specDir);
	for (const item of contents) {
		const itemPath = path.join(specDir, item);
		if (!fs.statSync(itemPath).isDirectory()) continue;

		// Match pattern: <id>-Initiative-<name>
		if (item.match(/^\d+-Initiative-/)) {
			initDirs.push(itemPath);
		}
	}

	// Sort by initiative ID
	return initDirs.sort((a, b) => {
		const idA = parseInt(path.basename(a).match(/^(\d+)/)?.[1] || "0", 10);
		const idB = parseInt(path.basename(b).match(/^(\d+)/)?.[1] || "0", 10);
		return idA - idB;
	});
}

function findFeatureDirectories(initDir: string): string[] {
	const featureDirs: string[] = [];

	const contents = fs.readdirSync(initDir);
	for (const item of contents) {
		const itemPath = path.join(initDir, item);
		if (!fs.statSync(itemPath).isDirectory()) continue;

		// Match pattern: <id>-Feature-<name>
		if (item.match(/^\d+-Feature-/)) {
			const tasksFile = path.join(itemPath, "tasks.json");
			if (fs.existsSync(tasksFile)) {
				featureDirs.push(itemPath);
			}
		}
	}

	// Sort by feature ID
	return featureDirs.sort((a, b) => {
		const idA = parseInt(path.basename(a).match(/^(\d+)/)?.[1] || "0", 10);
		const idB = parseInt(path.basename(b).match(/^(\d+)/)?.[1] || "0", 10);
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
 * Extract feature dependencies from feature.md file.
 * Looks for "Blocked By:" section with issue numbers.
 */
function extractFeatureDependencies(featureDir: string): number[] {
	const featureFile = path.join(featureDir, "feature.md");
	if (!fs.existsSync(featureFile)) return [];

	try {
		const content = fs.readFileSync(featureFile, "utf-8");
		const deps: number[] = [];

		// Look for "Blocked By" section (handle various formats)
		const patterns = [
			/### Blocked By\s*\n([^#]*)/i,
			/\*\*Blocked By\*\*:?\s*([^\n]*)/i,
			/Blocked By:?\s*([^\n]*)/i,
		];

		for (const pattern of patterns) {
			const match = content.match(pattern);
			if (match) {
				const issueMatches = match[1].match(/#(\d+)/g);
				if (issueMatches) {
					for (const issueMatch of issueMatches) {
						const issueNum = parseInt(issueMatch.slice(1), 10);
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
 * Extract initiative dependencies from initiative.md file.
 */
function extractInitiativeDependencies(initDir: string): number[] {
	const initFile = path.join(initDir, "initiative.md");
	if (!fs.existsSync(initFile)) return [];

	try {
		const content = fs.readFileSync(initFile, "utf-8");
		const deps: number[] = [];

		// Look for "Blocked By" section
		const patterns = [
			/### Blocked By\s*\n([^#]*)/i,
			/\*\*Blocked By\*\*:?\s*([^\n]*)/i,
			/Blocked By:?\s*([^\n]*)/i,
		];

		for (const pattern of patterns) {
			const match = content.match(pattern);
			if (match) {
				const issueMatches = match[1].match(/#(\d+)/g);
				if (issueMatches) {
					for (const issueMatch of issueMatches) {
						const issueNum = parseInt(issueMatch.slice(1), 10);
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
		if (match) {
			return parseInt(match[1], 10);
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
		if (match) {
			return parseInt(match[1], 10);
		}

		return 999;
	} catch {
		return 999;
	}
}

// ============================================================================
// Main Function
// ============================================================================

async function main() {
	const args = process.argv.slice(2);
	const specId = parseInt(args[0], 10);

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

	const specName = path
		.basename(specDir)
		.replace(/^\d+-Spec-/, "")
		.replace(/-/g, " ");

	// Find all initiative directories
	const initDirs = findInitiativeDirectories(specDir);
	console.log(`Found ${initDirs.length} initiatives`);

	if (initDirs.length === 0) {
		console.error("No initiatives found under spec");
		process.exit(1);
	}

	// Process initiatives and features
	const initiatives: InitiativeEntry[] = [];
	const featureQueue: FeatureEntry[] = [];
	let totalTasks = 0;
	let totalTasksCompleted = 0;

	for (const initDir of initDirs) {
		const initDirName = path.basename(initDir);
		const initIdMatch = initDirName.match(/^(\d+)/);
		const initId = initIdMatch ? parseInt(initIdMatch[1], 10) : 0;
		const initName = initDirName
			.replace(/^\d+-Initiative-/, "")
			.replace(/-/g, " ");
		const initSlug = initDirName.replace(/^\d+-Initiative-/, "");

		const initPriority = extractInitiativePriority(initDir);
		const initDeps = extractInitiativeDependencies(initDir);

		// Find features in this initiative
		const featureDirs = findFeatureDirectories(initDir);

		const initiativeFeatures: FeatureEntry[] = [];

		for (const featureDir of featureDirs) {
			const tasksJson = loadTasksJson(featureDir);
			if (!tasksJson) continue;

			const featureId = tasksJson.metadata.feature_id;
			const featureDirName = path.basename(featureDir);
			const relativePath = path.relative(
				specDir,
				path.join(featureDir, "tasks.json"),
			);
			const featureDeps = extractFeatureDependencies(featureDir);
			const featurePriority = extractFeaturePriority(featureDir);

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

			initiativeFeatures.push({
				id: featureId,
				initiative_id: initId,
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
				dependencies: featureDeps,
				github_issue: tasksJson.github?.feature_tasks_issue || null,
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

	let nextFeatureId: number | null = null;
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
	const lastCompletedFeatureId =
		completedFeatures.length > 0
			? completedFeatures[completedFeatures.length - 1].id
			: null;

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
			spec_id: specId,
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
	console.log(`   SPEC #${specId}: ${specName.toUpperCase()}`);
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
				? ` (blocked by: ${init.dependencies.map((d) => `#${d}`).join(", ")})`
				: "";
		console.log(
			`   ${statusIcon} #${init.id}: ${init.name} [P${init.priority}] - ${init.features_completed}/${init.feature_count} features${depsStr}`,
		);
	}

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
				? ` [blocked by: ${feature.dependencies.map((d) => `#${d}`).join(", ")}]`
				: "";
		const nextMarker = feature.id === nextFeatureId ? " ← NEXT" : "";
		console.log(
			`   ${statusIcon} [${feature.global_priority}] #${feature.id}: ${feature.title}${depsStr}${nextMarker}`,
		);
	}

	if (nextFeatureId) {
		console.log(`\n🎯 Next feature to implement: #${nextFeatureId}`);
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
