#!/usr/bin/env tsx

/**
 * Analyze Task Parallelism
 *
 * Analyzes a tasks.json file to determine which tasks within the same
 * execution group can safely run in parallel (no file conflicts).
 *
 * Usage:
 *   tsx analyze-task-parallelism.ts <tasks.json>
 *   tsx analyze-task-parallelism.ts .ai/alpha/specs/.../tasks.json
 *
 * Output:
 *   - Prints analysis summary to console
 *   - Optionally updates tasks.json with parallel_batches (--update flag)
 */

import * as fs from "node:fs";
import * as path from "node:path";

// Types
interface TaskOutput {
	type: "new" | "modified" | "deleted";
	path: string;
	description?: string;
}

interface Task {
	id: string;
	type: string;
	name: string;
	status: string;
	estimated_hours: number;
	group: number;
	outputs?: TaskOutput[];
	dependencies?: {
		blocked_by?: string[];
		blocks?: string[];
	};
}

interface ExecutionGroup {
	id: number;
	name: string;
	task_ids: string[];
	depends_on_groups?: number[];
	estimated_hours: number;
	parallel_hours: number;
	parallel_batches?: ParallelBatch[];
	sequential_tasks?: string[];
	parallelization_analysis?: ParallelizationAnalysis;
}

interface ParallelBatch {
	batch_id: number;
	task_ids: string[];
	max_hours: number;
	reason: string;
}

interface FileConflict {
	task_a: string;
	task_b: string;
	conflicting_file: string;
}

interface ParallelizationAnalysis {
	total_tasks: number;
	parallelizable_count: number;
	sequential_count: number;
	file_conflicts: FileConflict[];
	speedup_potential: number;
}

interface TasksJson {
	metadata: {
		feature_id: number;
		feature_name: string;
		[key: string]: unknown;
	};
	tasks: Task[];
	execution: {
		groups: ExecutionGroup[];
		critical_path: {
			task_ids: string[];
			total_hours: number;
		};
		duration: {
			sequential: number;
			parallel: number;
			time_saved_percent?: number;
		};
	};
	validation: unknown;
	github?: unknown;
}

/**
 * Extract all output file paths from a task
 */
function getTaskOutputFiles(task: Task): string[] {
	if (!task.outputs || task.outputs.length === 0) {
		return [];
	}
	return task.outputs.map((o) => o.path);
}

/**
 * Check if two tasks have overlapping output files
 */
function hasFileConflict(taskA: Task, taskB: Task): string | null {
	const filesA = new Set(getTaskOutputFiles(taskA));
	const filesB = getTaskOutputFiles(taskB);

	for (const file of filesB) {
		if (filesA.has(file)) {
			return file;
		}
	}
	return null;
}

/**
 * Build conflict graph for tasks in a group
 */
function buildConflictGraph(tasks: Task[]): Map<string, Set<string>> {
	const conflicts = new Map<string, Set<string>>();

	// Initialize empty sets for all tasks
	for (const task of tasks) {
		conflicts.set(task.id, new Set());
	}

	// Find all pairwise conflicts
	for (let i = 0; i < tasks.length; i++) {
		for (let j = i + 1; j < tasks.length; j++) {
			const conflict = hasFileConflict(tasks[i], tasks[j]);
			if (conflict) {
				conflicts.get(tasks[i].id)?.add(tasks[j].id);
				conflicts.get(tasks[j].id)?.add(tasks[i].id);
			}
		}
	}

	return conflicts;
}

/**
 * Get all file conflicts as an array
 */
function getFileConflicts(tasks: Task[]): FileConflict[] {
	const conflicts: FileConflict[] = [];

	for (let i = 0; i < tasks.length; i++) {
		for (let j = i + 1; j < tasks.length; j++) {
			const conflictingFile = hasFileConflict(tasks[i], tasks[j]);
			if (conflictingFile) {
				conflicts.push({
					task_a: tasks[i].id,
					task_b: tasks[j].id,
					conflicting_file: conflictingFile,
				});
			}
		}
	}

	return conflicts;
}

/**
 * Graph coloring algorithm to find parallel batches
 * Tasks with the same color can run in parallel
 */
function colorGraph(
	tasks: Task[],
	conflicts: Map<string, Set<string>>,
): Map<string, number> {
	const colors = new Map<string, number>();
	const taskMap = new Map(tasks.map((t) => [t.id, t]));

	// Sort tasks by number of conflicts (most constrained first)
	const sortedIds = [...tasks]
		.sort((a, b) => {
			const conflictsA = conflicts.get(a.id)?.size || 0;
			const conflictsB = conflicts.get(b.id)?.size || 0;
			return conflictsB - conflictsA;
		})
		.map((t) => t.id);

	for (const taskId of sortedIds) {
		const taskConflicts = conflicts.get(taskId) || new Set();
		const usedColors = new Set<number>();

		// Find colors used by conflicting tasks
		for (const conflictId of taskConflicts) {
			const color = colors.get(conflictId);
			if (color !== undefined) {
				usedColors.add(color);
			}
		}

		// Assign the lowest available color
		let color = 0;
		while (usedColors.has(color)) {
			color++;
		}
		colors.set(taskId, color);
	}

	return colors;
}

/**
 * Create parallel batches from graph coloring
 */
function createParallelBatches(
	tasks: Task[],
	colors: Map<string, number>,
): ParallelBatch[] {
	const taskMap = new Map(tasks.map((t) => [t.id, t]));
	const batchMap = new Map<number, string[]>();

	// Group tasks by color
	for (const [taskId, color] of colors) {
		if (!batchMap.has(color)) {
			batchMap.set(color, []);
		}
		batchMap.get(color)?.push(taskId);
	}

	// Convert to batches
	const batches: ParallelBatch[] = [];
	const sortedColors = [...batchMap.keys()].sort((a, b) => a - b);

	for (const color of sortedColors) {
		const taskIds = batchMap.get(color) || [];
		const maxHours = Math.max(
			...taskIds.map((id) => taskMap.get(id)?.estimated_hours || 0),
		);

		batches.push({
			batch_id: color + 1, // 1-based
			task_ids: taskIds,
			max_hours: maxHours,
			reason:
				taskIds.length === 1 ? "Single task" : "No file overlaps between tasks",
		});
	}

	return batches;
}

/**
 * Analyze parallelization for a single execution group
 */
export function analyzeGroup(
	group: ExecutionGroup,
	allTasks: Task[],
): {
	parallel_batches: ParallelBatch[];
	sequential_tasks: string[];
	analysis: ParallelizationAnalysis;
} {
	// Get tasks in this group
	const groupTasks = group.task_ids
		.map((id) => allTasks.find((t) => t.id === id))
		.filter((t): t is Task => t !== undefined);

	if (groupTasks.length === 0) {
		return {
			parallel_batches: [],
			sequential_tasks: [],
			analysis: {
				total_tasks: 0,
				parallelizable_count: 0,
				sequential_count: 0,
				file_conflicts: [],
				speedup_potential: 1.0,
			},
		};
	}

	// Check which tasks have outputs defined
	const tasksWithOutputs = groupTasks.filter(
		(t) => t.outputs && t.outputs.length > 0,
	);
	const tasksWithoutOutputs = groupTasks.filter(
		(t) => !t.outputs || t.outputs.length === 0,
	);

	// Build conflict graph for tasks with outputs
	const conflicts = buildConflictGraph(tasksWithOutputs);
	const fileConflicts = getFileConflicts(tasksWithOutputs);

	// Color the graph
	const colors = colorGraph(tasksWithOutputs, conflicts);

	// Create parallel batches
	const batches = createParallelBatches(tasksWithOutputs, colors);

	// Tasks without outputs must run sequentially (we can't verify they don't conflict)
	const sequentialTasks = tasksWithoutOutputs.map((t) => t.id);

	// If there are tasks without outputs, add them as individual batches
	for (const task of tasksWithoutOutputs) {
		batches.push({
			batch_id: batches.length + 1,
			task_ids: [task.id],
			max_hours: task.estimated_hours,
			reason: "No outputs defined - must run sequentially",
		});
	}

	// Calculate speedup potential
	const sequentialHours = groupTasks.reduce(
		(sum, t) => sum + t.estimated_hours,
		0,
	);
	const parallelHours = batches.reduce((sum, b) => sum + b.max_hours, 0);
	const speedupPotential =
		parallelHours > 0 ? sequentialHours / parallelHours : 1.0;

	// Count parallelizable tasks (batches with >1 task)
	const parallelizableCount = batches
		.filter((b) => b.task_ids.length > 1)
		.reduce((sum, b) => sum + b.task_ids.length, 0);

	return {
		parallel_batches: batches,
		sequential_tasks: sequentialTasks,
		analysis: {
			total_tasks: groupTasks.length,
			parallelizable_count: parallelizableCount,
			sequential_count: groupTasks.length - parallelizableCount,
			file_conflicts: fileConflicts,
			speedup_potential: Math.round(speedupPotential * 100) / 100,
		},
	};
}

/**
 * Analyze all execution groups in a tasks.json
 */
export function analyzeTasksJson(tasksJson: TasksJson): TasksJson {
	const updatedGroups: ExecutionGroup[] = [];

	for (const group of tasksJson.execution.groups) {
		const { parallel_batches, sequential_tasks, analysis } = analyzeGroup(
			group,
			tasksJson.tasks,
		);

		updatedGroups.push({
			...group,
			parallel_batches,
			sequential_tasks,
			parallelization_analysis: analysis,
		});
	}

	// Calculate overall speedup
	const totalSequential = updatedGroups.reduce(
		(sum, g) => sum + g.estimated_hours,
		0,
	);
	const totalParallel = updatedGroups.reduce((sum, g) => {
		const batchHours =
			g.parallel_batches?.reduce((s, b) => s + b.max_hours, 0) ||
			g.parallel_hours;
		return sum + batchHours;
	}, 0);

	return {
		...tasksJson,
		execution: {
			...tasksJson.execution,
			groups: updatedGroups,
			duration: {
				...tasksJson.execution.duration,
				sequential: totalSequential,
				parallel: totalParallel,
				time_saved_percent:
					totalSequential > 0
						? Math.round((1 - totalParallel / totalSequential) * 100)
						: 0,
			},
		},
	};
}

/**
 * Print analysis summary
 */
function printSummary(tasksJson: TasksJson): void {
	console.log("\n📊 Task Parallelization Analysis");
	console.log("=".repeat(50));
	console.log(`Feature: ${tasksJson.metadata.feature_name}`);
	console.log(`Feature ID: #${tasksJson.metadata.feature_id}`);
	console.log("");

	let totalParallelizable = 0;
	let totalSequential = 0;
	let totalConflicts = 0;

	for (const group of tasksJson.execution.groups) {
		const analysis = group.parallelization_analysis;
		if (!analysis) continue;

		console.log(`\n📦 Group ${group.id}: ${group.name}`);
		console.log(`   Tasks: ${analysis.total_tasks}`);
		console.log(`   Parallelizable: ${analysis.parallelizable_count}`);
		console.log(`   Sequential: ${analysis.sequential_count}`);
		console.log(`   Speedup: ${analysis.speedup_potential}x`);

		if (analysis.file_conflicts.length > 0) {
			console.log("   File Conflicts:");
			for (const conflict of analysis.file_conflicts) {
				console.log(
					`     - ${conflict.task_a} ↔ ${conflict.task_b}: ${conflict.conflicting_file}`,
				);
			}
		}

		if (group.parallel_batches && group.parallel_batches.length > 0) {
			console.log("   Parallel Batches:");
			for (const batch of group.parallel_batches) {
				const parallel = batch.task_ids.length > 1 ? "⚡" : "  ";
				console.log(
					`     ${parallel} Batch ${batch.batch_id}: [${batch.task_ids.join(", ")}] (${batch.max_hours}h)`,
				);
			}
		}

		totalParallelizable += analysis.parallelizable_count;
		totalSequential += analysis.sequential_count;
		totalConflicts += analysis.file_conflicts.length;
	}

	console.log("\n" + "=".repeat(50));
	console.log("📈 Overall Summary");
	console.log(`   Total Parallelizable Tasks: ${totalParallelizable}`);
	console.log(`   Total Sequential Tasks: ${totalSequential}`);
	console.log(`   File Conflicts Found: ${totalConflicts}`);
	console.log(
		`   Duration: ${tasksJson.execution.duration.sequential}h → ${tasksJson.execution.duration.parallel}h`,
	);
	console.log(
		`   Time Saved: ${tasksJson.execution.duration.time_saved_percent}%`,
	);
}

// Main function
async function main() {
	const args = process.argv.slice(2);
	const updateFlag = args.includes("--update");
	const tasksPath = args.find((a) => !a.startsWith("--"));

	if (!tasksPath) {
		console.error(
			"Usage: tsx analyze-task-parallelism.ts <tasks.json> [--update]",
		);
		console.error(
			"  --update: Update the tasks.json file with analysis results",
		);
		process.exit(1);
	}

	// Resolve path
	const fullPath = path.resolve(tasksPath);
	if (!fs.existsSync(fullPath)) {
		console.error(`File not found: ${fullPath}`);
		process.exit(1);
	}

	// Load tasks.json
	let tasksJson: TasksJson;
	try {
		const content = fs.readFileSync(fullPath, "utf-8");
		tasksJson = JSON.parse(content) as TasksJson;
	} catch (error) {
		console.error(`Failed to parse ${fullPath}:`, error);
		process.exit(1);
	}

	// Analyze
	const analyzed = analyzeTasksJson(tasksJson);

	// Print summary
	printSummary(analyzed);

	// Update file if requested
	if (updateFlag) {
		fs.writeFileSync(fullPath, JSON.stringify(analyzed, null, "\t"));
		console.log(`\n✅ Updated ${fullPath}`);
	} else {
		console.log("\nRun with --update to save analysis to file");
	}

	return analyzed;
}

// Export for use as module
export { analyzeTasksJson as analyze };

// Run if executed directly (not imported)
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
	main().catch((error) => {
		console.error("Error:", error);
		process.exit(1);
	});
}
