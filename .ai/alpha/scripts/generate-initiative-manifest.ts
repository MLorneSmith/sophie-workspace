#!/usr/bin/env tsx

/**
 * Generate Initiative Manifest
 *
 * Aggregates all tasks.json files from feature directories into a single
 * initiative-manifest.json for the Alpha orchestrator.
 *
 * Usage:
 *   tsx generate-initiative-manifest.ts <initiative-id>
 *   tsx generate-initiative-manifest.ts 1363
 *
 * Output:
 *   Creates .ai/alpha/specs/<spec-dir>/<init-dir>/initiative-manifest.json
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { analyzeTasksJson } from "./analyze-task-parallelism";

// Types
interface TasksJson {
	metadata: {
		feature_id: number;
		feature_name: string;
		feature_slug?: string;
		initiative_id: number;
		spec_id: number;
		complexity: {
			score: number;
			level: string;
		};
	};
	tasks: Array<{
		id: string;
		type: string;
		name: string;
		status: string;
		estimated_hours: number;
		group: number;
		dependencies?: {
			blocked_by?: string[];
		};
	}>;
	execution: {
		groups: Array<{
			id: number;
			name: string;
			task_ids: string[];
			parallel_hours: number;
			estimated_hours: number;
			parallel_batches?: Array<{
				batch_id: number;
				task_ids: string[];
				max_hours: number;
				reason: string;
			}>;
			sequential_tasks?: string[];
			parallelization_analysis?: {
				total_tasks: number;
				parallelizable_count: number;
				sequential_count: number;
				speedup_potential: number;
			};
		}>;
		duration: {
			sequential: number;
			parallel: number;
			time_saved_percent?: number;
		};
	};
	github?: {
		issues_created: boolean;
		feature_tasks_issue?: number;
	};
}

interface FeatureEntry {
	id: number;
	title: string;
	slug?: string;
	priority: number;
	status:
		| "pending"
		| "in_progress"
		| "completed"
		| "failed"
		| "blocked"
		| "partial";
	tasks_file: string;
	feature_dir: string;
	task_count: number;
	tasks_completed: number;
	sequential_hours: number;
	parallel_hours: number;
	dependencies: number[];
	github_issue: number | null;
	task_parallelism: {
		parallelizable_tasks: number;
		sequential_tasks: number;
		groups_with_parallel_batches: number;
		estimated_speedup: number;
	};
}

interface InitiativeManifest {
	metadata: {
		initiative_id: number;
		spec_id: number;
		initiative_name: string;
		generated_at: string;
		spec_dir: string;
		init_dir: string;
		research_dir: string;
	};
	features: FeatureEntry[];
	execution_plan: {
		parallel_groups: Array<{
			group: number;
			feature_ids: number[];
			description: string;
		}>;
		total_tasks: number;
		total_features: number;
		duration: {
			sequential_hours: number;
			parallel_hours: number;
			time_saved_percent: number;
		};
	};
	progress: {
		status: "pending" | "in_progress" | "completed" | "failed" | "partial";
		features_completed: number;
		features_total: number;
		tasks_completed: number;
		tasks_total: number;
		current_feature: number | null;
		current_group: number;
		started_at: string | null;
		completed_at: string | null;
		last_checkpoint: string | null;
	};
	sandbox: {
		sandbox_id: string | null;
		branch_name: string | null;
		vscode_url: string | null;
		dev_server_url: string | null;
		created_at: string | null;
	};
}

// Find project root
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

// Find initiative directory by ID
function findInitiativeDir(
	projectRoot: string,
	initiativeId: number,
): string | null {
	const specsDir = path.join(projectRoot, ".ai", "alpha", "specs");

	if (!fs.existsSync(specsDir)) {
		return null;
	}

	// Search for initiative directory
	const specDirs = fs.readdirSync(specsDir);

	for (const specDir of specDirs) {
		const specPath = path.join(specsDir, specDir);
		if (!fs.statSync(specPath).isDirectory()) continue;

		// Look for initiative directories
		const contents = fs.readdirSync(specPath);
		for (const item of contents) {
			// Match pattern: <id>-Initiative-<name>
			const match = item.match(/^(\d+)-Initiative-/);
			if (match && parseInt(match[1], 10) === initiativeId) {
				return path.join(specPath, item);
			}
		}
	}

	return null;
}

// Extract spec ID from directory path
function extractSpecId(initDir: string): number {
	const specDir = path.dirname(initDir);
	const specDirName = path.basename(specDir);
	const match = specDirName.match(/^(\d+)-Spec-/);
	return match ? parseInt(match[1], 10) : 0;
}

// Find all feature directories with tasks.json
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

// Load and parse tasks.json, running parallelization analysis
function loadTasksJson(featureDir: string): TasksJson | null {
	const tasksFile = path.join(featureDir, "tasks.json");
	try {
		const content = fs.readFileSync(tasksFile, "utf-8");
		const tasksJson = JSON.parse(content) as TasksJson;
		// Run parallelization analysis
		return analyzeTasksJson(tasksJson);
	} catch (error) {
		console.error(`Failed to load ${tasksFile}:`, error);
		return null;
	}
}

// Extract dependencies from feature.md if exists
function extractFeatureDependencies(featureDir: string): number[] {
	const featureFile = path.join(featureDir, "feature.md");
	if (!fs.existsSync(featureFile)) return [];

	try {
		const content = fs.readFileSync(featureFile, "utf-8");
		const deps: number[] = [];

		// Look for "Blocked By:" section
		const blockedByMatch = content.match(/Blocked By:([^\n]+)/i);
		if (blockedByMatch) {
			const issueMatches = blockedByMatch[1].match(/#(\d+)/g);
			if (issueMatches) {
				for (const match of issueMatches) {
					deps.push(parseInt(match.slice(1), 10));
				}
			}
		}

		return deps;
	} catch {
		return [];
	}
}

// Build parallel execution groups for features
function buildParallelGroups(features: FeatureEntry[]): Array<{
	group: number;
	feature_ids: number[];
	description: string;
}> {
	const groups: Array<{
		group: number;
		feature_ids: number[];
		description: string;
	}> = [];

	const assigned = new Set<number>();
	let groupNum = 0;

	while (assigned.size < features.length) {
		const groupFeatures: number[] = [];

		for (const feature of features) {
			if (assigned.has(feature.id)) continue;

			// Check if all dependencies are assigned to previous groups
			const depsResolved = feature.dependencies.every((dep) =>
				assigned.has(dep),
			);
			if (depsResolved) {
				groupFeatures.push(feature.id);
			}
		}

		if (groupFeatures.length === 0) {
			// Circular dependency or error - break to avoid infinite loop
			console.warn("Warning: Could not resolve all feature dependencies");
			break;
		}

		// Add all features in this group to assigned
		for (const id of groupFeatures) {
			assigned.add(id);
		}

		const groupTitles = groupFeatures
			.map((id) => features.find((f) => f.id === id)?.title || `Feature #${id}`)
			.slice(0, 3);

		groups.push({
			group: groupNum,
			feature_ids: groupFeatures,
			description:
				groupNum === 0
					? "Foundation features - no dependencies"
					: `Group ${groupNum}: ${groupTitles.join(", ")}${groupFeatures.length > 3 ? "..." : ""}`,
		});

		groupNum++;
	}

	return groups;
}

// Main function
async function main() {
	const args = process.argv.slice(2);
	const initiativeId = parseInt(args[0], 10);

	if (Number.isNaN(initiativeId)) {
		console.error("Usage: tsx generate-initiative-manifest.ts <initiative-id>");
		console.error("Example: tsx generate-initiative-manifest.ts 1363");
		process.exit(1);
	}

	const projectRoot = findProjectRoot();
	console.log(`Project root: ${projectRoot}`);

	// Find initiative directory
	const initDir = findInitiativeDir(projectRoot, initiativeId);
	if (!initDir) {
		console.error(`Initiative #${initiativeId} not found in .ai/alpha/specs/`);
		process.exit(1);
	}

	console.log(`Initiative directory: ${initDir}`);

	const specDir = path.dirname(initDir);
	const specId = extractSpecId(initDir);
	const initiativeName = path
		.basename(initDir)
		.replace(/^\d+-Initiative-/, "")
		.replace(/-/g, " ");

	// Find all feature directories
	const featureDirs = findFeatureDirectories(initDir);
	console.log(`Found ${featureDirs.length} features with tasks.json`);

	if (featureDirs.length === 0) {
		console.error("No features found with tasks.json files");
		process.exit(1);
	}

	// Load all tasks.json files
	const features: FeatureEntry[] = [];
	let totalTasks = 0;
	let totalSequentialHours = 0;
	let totalParallelHours = 0;

	for (const featureDir of featureDirs) {
		const tasksJson = loadTasksJson(featureDir);
		if (!tasksJson) continue;

		const featureId = tasksJson.metadata.feature_id;
		const featureDirName = path.basename(featureDir);
		const relativePath = path.relative(
			initDir,
			path.join(featureDir, "tasks.json"),
		);
		const dependencies = extractFeatureDependencies(featureDir);

		const completedTasks = tasksJson.tasks.filter(
			(t) => t.status === "completed",
		).length;

		// Calculate task parallelism metrics from groups
		const parallelizableTasks = tasksJson.execution.groups.reduce(
			(sum, g) => sum + (g.parallelization_analysis?.parallelizable_count || 0),
			0,
		);
		const sequentialTasks = tasksJson.execution.groups.reduce(
			(sum, g) => sum + (g.parallelization_analysis?.sequential_count || 0),
			0,
		);
		const groupsWithParallelBatches = tasksJson.execution.groups.filter((g) =>
			g.parallel_batches?.some((b) => b.task_ids.length > 1),
		).length;
		const estimatedSpeedup =
			tasksJson.execution.duration.sequential > 0
				? tasksJson.execution.duration.sequential /
					tasksJson.execution.duration.parallel
				: 1.0;

		features.push({
			id: featureId,
			title: tasksJson.metadata.feature_name,
			slug: tasksJson.metadata.feature_slug,
			priority: features.length + 1, // Default priority by discovery order
			status:
				completedTasks === tasksJson.tasks.length ? "completed" : "pending",
			tasks_file: relativePath,
			feature_dir: featureDir,
			task_count: tasksJson.tasks.length,
			tasks_completed: completedTasks,
			sequential_hours: tasksJson.execution.duration.sequential,
			parallel_hours: tasksJson.execution.duration.parallel,
			dependencies,
			github_issue: tasksJson.github?.feature_tasks_issue || null,
			task_parallelism: {
				parallelizable_tasks: parallelizableTasks,
				sequential_tasks: sequentialTasks,
				groups_with_parallel_batches: groupsWithParallelBatches,
				estimated_speedup: Math.round(estimatedSpeedup * 100) / 100,
			},
		});

		totalTasks += tasksJson.tasks.length;
		totalSequentialHours += tasksJson.execution.duration.sequential;
		totalParallelHours += tasksJson.execution.duration.parallel;
	}

	// Build parallel groups
	const parallelGroups = buildParallelGroups(features);

	// Calculate group-level parallel duration
	let groupParallelHours = 0;
	for (const group of parallelGroups) {
		const groupFeatures = features.filter((f) =>
			group.feature_ids.includes(f.id),
		);
		const maxHours = Math.max(...groupFeatures.map((f) => f.parallel_hours));
		groupParallelHours += maxHours;
	}

	const timeSavedPercent =
		totalSequentialHours > 0
			? Math.round((1 - groupParallelHours / totalSequentialHours) * 100)
			: 0;

	// Build manifest
	const manifest: InitiativeManifest = {
		metadata: {
			initiative_id: initiativeId,
			spec_id: specId,
			initiative_name: initiativeName,
			generated_at: new Date().toISOString(),
			spec_dir: specDir,
			init_dir: initDir,
			research_dir: path.join(specDir, "research-library"),
		},
		features,
		execution_plan: {
			parallel_groups: parallelGroups,
			total_tasks: totalTasks,
			total_features: features.length,
			duration: {
				sequential_hours: totalSequentialHours,
				parallel_hours: groupParallelHours,
				time_saved_percent: timeSavedPercent,
			},
		},
		progress: {
			status: "pending",
			features_completed: features.filter((f) => f.status === "completed")
				.length,
			features_total: features.length,
			tasks_completed: features.reduce((sum, f) => sum + f.tasks_completed, 0),
			tasks_total: totalTasks,
			current_feature: null,
			current_group: 0,
			started_at: null,
			completed_at: null,
			last_checkpoint: null,
		},
		sandbox: {
			sandbox_id: null,
			branch_name: null,
			vscode_url: null,
			dev_server_url: null,
			created_at: null,
		},
	};

	// Write manifest
	const manifestPath = path.join(initDir, "initiative-manifest.json");
	fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, "\t"));

	console.log(`\n✅ Initiative manifest generated: ${manifestPath}`);
	console.log("\n📊 Summary:");
	console.log(`   Features: ${features.length}`);
	console.log(`   Total Tasks: ${totalTasks}`);
	console.log(`   Sequential Hours: ${totalSequentialHours}`);
	console.log(`   Parallel Hours: ${groupParallelHours}`);
	console.log(`   Time Saved: ${timeSavedPercent}%`);

	// Task parallelism summary
	const totalParallelizable = features.reduce(
		(sum, f) => sum + f.task_parallelism.parallelizable_tasks,
		0,
	);
	const totalSequentialTasks = features.reduce(
		(sum, f) => sum + f.task_parallelism.sequential_tasks,
		0,
	);
	console.log("\n⚡ Task-Level Parallelism:");
	console.log(`   Parallelizable Tasks: ${totalParallelizable}/${totalTasks}`);
	console.log(`   Sequential Tasks: ${totalSequentialTasks}`);
	for (const feature of features) {
		const p = feature.task_parallelism;
		if (p.groups_with_parallel_batches > 0) {
			console.log(
				`   #${feature.id}: ${p.parallelizable_tasks} parallelizable, ${p.groups_with_parallel_batches} groups, ${p.estimated_speedup}x speedup`,
			);
		}
	}

	console.log("\n📦 Feature Parallel Groups:");
	for (const group of parallelGroups) {
		console.log(
			`   Group ${group.group}: ${group.feature_ids.map((id) => `#${id}`).join(", ")}`,
		);
	}

	return manifest;
}

main().catch((error) => {
	console.error("Error:", error);
	process.exit(1);
});
