/**
 * Zod Runtime Validation Schemas for Progress Files
 *
 * Provides runtime validation at JSON I/O boundaries where external agents
 * (Claude Code, GPT/Codex) write progress data. TypeScript types are erased
 * at runtime, so these schemas catch malformed data at parse time.
 *
 * Feature #2066: Prevents ~80% of GPT-agent-related orchestrator failures.
 */

import { z } from "zod";

// ============================================================================
// Shared Field Schemas
// ============================================================================

/**
 * Loose status schema that accepts any string.
 * We accept any string here because validateProgressStatus() handles
 * remapping non-standard statuses (e.g., "blocked" -> "failed").
 */
const LooseStatusSchema = z.string().optional();

// ============================================================================
// ProgressFileData Schema (progress-file.ts — sandbox -> orchestrator)
// ============================================================================

const ProgressFileCurrentTaskSchema = z
	.object({
		id: z.string().default("Unknown"),
		name: z.string().default("Working..."),
		status: z.string().default("in_progress"),
		started_at: z.string().optional(),
	})
	.loose();

/**
 * Schema for ProgressFileData (used by readProgressFile / PTY recovery).
 * All fields optional with safe defaults so malformed data degrades gracefully.
 */
export const ProgressFileDataSchema = z
	.object({
		status: z.string().default("in_progress"),
		phase: z.string().default("executing"),
		completed_tasks: z.array(z.string()).default([]),
		failed_tasks: z.array(z.string()).optional(),
		total_tasks: z.number().optional(),
		last_heartbeat: z.string().default(""),
		context_usage_percent: z.number().optional(),
		feature_id: z.string().optional(),
		current_task: ProgressFileCurrentTaskSchema.optional(),
	})
	.loose();

// ============================================================================
// SandboxProgress Schema (orchestrator.types.ts — polling reads)
// ============================================================================

const SandboxProgressFeatureSchema = z
	.object({
		issue_number: z.string().default("Unknown"),
		title: z.string().default("Feature"),
	})
	.loose();

const SandboxProgressCurrentTaskSchema = z
	.object({
		id: z.string().default("Unknown"),
		name: z.string().default("Working..."),
		status: z.string().default("in_progress"),
		started_at: z.string().optional(),
		verification_attempts: z.number().optional(),
	})
	.loose();

const SandboxProgressCurrentGroupSchema = z
	.object({
		id: z.number().default(0),
		name: z.string().default("Group"),
		tasks_total: z.number().default(0),
		tasks_completed: z.number().default(0),
	})
	.loose();

/**
 * Schema for SandboxProgress (used by startProgressPolling / health checks).
 * Mirrors the SandboxProgress interface from orchestrator.types.ts.
 */
export const SandboxProgressSchema = z
	.object({
		feature: SandboxProgressFeatureSchema.optional(),
		current_task: SandboxProgressCurrentTaskSchema.optional(),
		completed_tasks: z.array(z.string()).optional(),
		failed_tasks: z.array(z.string()).optional(),
		current_group: SandboxProgressCurrentGroupSchema.optional(),
		context_usage_percent: z.number().optional(),
		status: LooseStatusSchema,
		last_commit: z.string().optional(),
		last_heartbeat: z.string().optional(),
		last_tool: z.string().optional(),
		phase: z.string().optional(),
		recent_output: z.array(z.string()).optional(),
	})
	.loose();

// ============================================================================
// SandboxProgressFile Schema (ui/types.ts — disk -> UI)
// ============================================================================

const SandboxProgressFileCurrentGroupSchema = z
	.object({
		id: z.number().default(0),
		name: z.string().default("Group"),
		tasks_total: z.number().default(0),
		tasks_completed: z.number().default(0),
		batch: z
			.object({
				batch_id: z.number().default(0),
				task_ids: z.array(z.string()).default([]),
				status: z.string().default("pending"),
			})
			.optional(),
		execution_mode: z.string().optional(),
	})
	.loose();

/**
 * Schema for SandboxProgressFile (used by UI progress readers).
 * Mirrors the SandboxProgressFile interface from ui/types.ts.
 * Uses loose() to preserve unknown fields from GPT agents.
 */
export const SandboxProgressFileSchema = z
	.object({
		feature: SandboxProgressFeatureSchema.optional(),
		current_task: SandboxProgressCurrentTaskSchema.optional(),
		current_group: SandboxProgressFileCurrentGroupSchema.optional(),
		completed_tasks: z.array(z.string()).optional(),
		failed_tasks: z.array(z.string()).optional(),
		context_usage_percent: z.number().optional(),
		status: LooseStatusSchema,
		phase: z.string().optional(),
		last_heartbeat: z.string().optional(),
		last_tool: z.string().optional(),
		tool_counts: z.record(z.string(), z.number()).optional(),
		tool_count: z.number().optional(),
		last_commit: z.string().optional(),
		session_id: z.string().optional(),
		waiting_reason: z.string().optional(),
		blocked_by: z.array(z.union([z.number(), z.string()])).optional(),
		subagent_count: z.number().optional(),
		last_subagent_stop: z.string().optional(),
		checkpoint_type: z
			.enum(["pre_task", "post_task", "pre_group", "post_group"])
			.optional(),
		last_checkpoint: z.string().optional(),
		parallel_execution: z
			.object({
				mode: z.enum(["parallel", "sequential"]).default("sequential"),
				batch_started_at: z.string().optional(),
				agents: z.record(z.string(), z.unknown()).optional(),
				completed: z.array(z.string()).optional(),
				pending: z.array(z.string()).optional(),
			})
			.optional(),
		entries: z
			.array(
				z.object({
					timestamp: z.string(),
					type: z.string(),
					message: z.string(),
				}),
			)
			.optional(),
		recent_output: z.array(z.string()).optional(),
		runId: z.string().optional(),
	})
	.loose();

// ============================================================================
// OverallProgressFile Schema (useProgressPoller.ts — disk -> UI)
// ============================================================================

const ReviewUrlFileSchema = z
	.object({
		label: z.string().default(""),
		vscode: z.string().default(""),
		devServer: z.string().default(""),
	})
	.loose();

/**
 * Schema for OverallProgressFile (used by readOverallProgress).
 * Written by the orchestrator itself, so lower risk of malformation.
 */
export const OverallProgressFileSchema = z
	.object({
		specId: z.string().default(""),
		specName: z.string().default(""),
		status: z.string().default("pending"),
		initiativesCompleted: z.number().default(0),
		initiativesTotal: z.number().default(0),
		featuresCompleted: z.number().default(0),
		featuresTotal: z.number().default(0),
		tasksCompleted: z.number().default(0),
		tasksTotal: z.number().default(0),
		lastCheckpoint: z.string().default(""),
		branchName: z.string().nullish(),
		reviewUrls: z.array(ReviewUrlFileSchema).optional(),
	})
	.loose();

// ============================================================================
// Safe Parse Utility
// ============================================================================

/**
 * Safely parse and validate JSON data against a Zod schema.
 *
 * On success: returns validated (and defaulted) data.
 * On failure: logs a warning with details and returns a default object.
 *
 * This replaces raw `JSON.parse() as T` patterns that caused 5+ crashes
 * when GPT agents wrote malformed progress files.
 *
 * @param schema - Zod schema to validate against
 * @param raw - Raw parsed JSON data (from JSON.parse)
 * @param label - Human-readable label for log messages
 * @returns Validated data with defaults applied
 */
export function safeParseProgress<T extends z.ZodType>(
	schema: T,
	raw: unknown,
	label: string,
): z.output<T> {
	const result = schema.safeParse(raw);

	if (result.success) {
		return result.data;
	}

	// Log validation failure with details for debugging
	const issues = result.error.issues
		.slice(0, 5)
		.map((issue) => `${issue.path.join(".")}: ${issue.message}`)
		.join("; ");

	console.warn(
		`[VALIDATION_WARN] ${label}: ${issues}${result.error.issues.length > 5 ? ` (+${result.error.issues.length - 5} more)` : ""}`,
	);

	// Return defaults by parsing an empty object
	try {
		return schema.parse({});
	} catch {
		// If even the empty object fails (shouldn't happen with .default()),
		// return the raw data as-is to avoid breaking the system
		console.warn(
			`[VALIDATION_WARN] ${label}: Failed to generate defaults, using raw data`,
		);
		return raw as z.output<T>;
	}
}
