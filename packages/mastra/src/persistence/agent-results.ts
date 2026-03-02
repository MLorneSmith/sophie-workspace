import "server-only";

import { z } from "zod";

type SupabaseResult<TData> = {
	data: TData | null;
	error: unknown | null;
};

type SupabaseQuery<TData> = {
	select(columns: string): SupabaseQuery<TData>;
	insert(
		values: Record<string, unknown> | Array<Record<string, unknown>>,
	): SupabaseQuery<TData>;
	update(values: Record<string, unknown>): SupabaseQuery<TData>;
	eq(column: string, value: string): SupabaseQuery<TData>;
	order(
		column: string,
		options?: {
			ascending?: boolean;
		},
	): SupabaseQuery<TData>;
	limit(count: number): SupabaseQuery<TData>;
	single(): Promise<SupabaseResult<TData>>;
	then<TResult1 = SupabaseResult<TData>, TResult2 = never>(
		onfulfilled?:
			| ((value: SupabaseResult<TData>) => TResult1 | PromiseLike<TResult1>)
			| null,
		onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
	): PromiseLike<TResult1 | TResult2>;
};

export interface SupabaseClientLike {
	from(table: string): SupabaseQuery<unknown>;
}

export const AgentIdSchema = z.enum([
	"partner",
	"validator",
	"whisperer",
	"editor",
]);

export const AgentRunStatusSchema = z.enum([
	"pending",
	"running",
	"completed",
	"failed",
]);

export const AgentSuggestionTypeSchema = z.enum([
	"narrative",
	"factual",
	"delivery",
	"structural",
]);

export const AgentSuggestionPrioritySchema = z.enum(["high", "medium", "low"]);

export const AgentSuggestionStatusSchema = z.enum([
	"pending",
	"accepted",
	"rejected",
	"applied",
]);

export const AgentRunTokenUsageSchema = z
	.object({
		promptTokens: z.number().nonnegative().optional(),
		completionTokens: z.number().nonnegative().optional(),
		totalTokens: z.number().nonnegative().optional(),
	})
	.passthrough();

const AgentRunRowSchema = z.object({
	id: z.string().uuid(),
	presentation_id: z.string().uuid(),
	user_id: z.string().uuid(),
	account_id: z.string().uuid(),
	agent_id: AgentIdSchema,
	status: AgentRunStatusSchema,
	input_snapshot: z.unknown(),
	result: z.unknown().nullable(),
	error: z.string().nullable(),
	model_id: z.string().nullable(),
	token_usage: AgentRunTokenUsageSchema.nullable(),
	duration_ms: z.number().int().nullable(),
	storyboard_version: z.number().int().positive(),
	created_at: z.string().min(1),
	updated_at: z.string().min(1),
});

const AgentSuggestionRowSchema = z.object({
	id: z.string().uuid(),
	agent_run_id: z.string().uuid(),
	presentation_id: z.string().uuid(),
	user_id: z.string().uuid(),
	account_id: z.string().uuid(),
	agent_id: AgentIdSchema,
	slide_id: z.string().min(1),
	type: AgentSuggestionTypeSchema,
	summary: z.string().min(1),
	priority: AgentSuggestionPrioritySchema,
	status: AgentSuggestionStatusSchema,
	detail: z.unknown().nullable(),
	created_at: z.string().min(1),
	updated_at: z.string().min(1),
	// Joined from agent_runs table for staleness detection
	agent_runs: z
		.object({
			storyboard_version: z.number().int().positive(),
		})
		.nullable()
		.optional(),
});

export const AgentRunSchema = z.object({
	id: z.string().uuid(),
	presentationId: z.string().uuid(),
	userId: z.string().uuid(),
	accountId: z.string().uuid(),
	agentId: AgentIdSchema,
	status: AgentRunStatusSchema,
	inputSnapshot: z.unknown(),
	result: z.unknown().nullable(),
	error: z.string().nullable(),
	modelId: z.string().nullable(),
	tokenUsage: AgentRunTokenUsageSchema.nullable(),
	durationMs: z.number().int().nullable(),
	storyboardVersion: z.number().int().positive(),
	createdAt: z.string().min(1),
	updatedAt: z.string().min(1),
});

export const AgentSuggestionSchema = z.object({
	id: z.string().uuid(),
	agentRunId: z.string().uuid(),
	presentationId: z.string().uuid(),
	userId: z.string().uuid(),
	accountId: z.string().uuid(),
	agentId: AgentIdSchema,
	slideId: z.string().min(1),
	type: AgentSuggestionTypeSchema,
	summary: z.string().min(1),
	priority: AgentSuggestionPrioritySchema,
	status: AgentSuggestionStatusSchema,
	detail: z.unknown().nullable(),
	createdAt: z.string().min(1),
	updatedAt: z.string().min(1),
	// Storyboard version from parent agent run for staleness detection
	storyboardVersion: z.number().int().positive().nullable().optional(),
});

export type AgentId = z.infer<typeof AgentIdSchema>;
export type AgentRunStatus = z.infer<typeof AgentRunStatusSchema>;
export type AgentSuggestionType = z.infer<typeof AgentSuggestionTypeSchema>;
export type AgentSuggestionPriority = z.infer<
	typeof AgentSuggestionPrioritySchema
>;
export type AgentSuggestionStatus = z.infer<typeof AgentSuggestionStatusSchema>;
export type AgentRunTokenUsage = z.infer<typeof AgentRunTokenUsageSchema>;
export type AgentRun = z.infer<typeof AgentRunSchema>;
export type AgentSuggestion = z.infer<typeof AgentSuggestionSchema>;

export interface CreateAgentRunInput {
	presentationId: string;
	userId: string;
	accountId: string;
	agentId: AgentId;
	inputSnapshot: unknown;
	storyboardVersion: number;
	modelId?: string | null;
}

export interface UpdateAgentRunInput {
	status: AgentRunStatus;
	result?: unknown | null;
	error?: string | null;
	tokenUsage?: AgentRunTokenUsage | null;
	durationMs?: number | null;
}

export interface CreateAgentSuggestionInput {
	slideId: string;
	type: AgentSuggestionType;
	summary: string;
	priority?: AgentSuggestionPriority;
	status?: AgentSuggestionStatus;
	detail?: unknown;
}

export interface GetSuggestionsFilters {
	agentId?: AgentId;
	slideId?: string;
	status?: AgentSuggestionStatus;
	runId?: string;
	limit?: number;
}

const AgentRunRowsSchema = z.array(AgentRunRowSchema);
const AgentSuggestionRowsSchema = z.array(AgentSuggestionRowSchema);
const CreateAgentSuggestionsInputSchema = z.array(
	z.object({
		slideId: z.string().min(1),
		type: AgentSuggestionTypeSchema,
		summary: z.string().min(1),
		priority: AgentSuggestionPrioritySchema.optional(),
		status: AgentSuggestionStatusSchema.optional(),
		detail: z.unknown().optional(),
	}),
);

function agentRunsTable(supabase: SupabaseClientLike) {
	// NOTE: We intentionally keep the client untyped here so this code does not
	// depend on running `supabase typegen` locally for new tables.
	return supabase.from("agent_runs");
}

function agentSuggestionsTable(supabase: SupabaseClientLike) {
	// NOTE: We intentionally keep the client untyped here so this code does not
	// depend on running `supabase typegen` locally for new tables.
	return supabase.from("agent_suggestions");
}

function mapAgentRun(rowInput: unknown): AgentRun {
	const row = AgentRunRowSchema.parse(rowInput);

	return AgentRunSchema.parse({
		id: row.id,
		presentationId: row.presentation_id,
		userId: row.user_id,
		accountId: row.account_id,
		agentId: row.agent_id,
		status: row.status,
		inputSnapshot: row.input_snapshot,
		result: row.result,
		error: row.error,
		modelId: row.model_id,
		tokenUsage: row.token_usage,
		durationMs: row.duration_ms,
		storyboardVersion: row.storyboard_version,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	});
}

function mapAgentSuggestion(rowInput: unknown): AgentSuggestion {
	const row = AgentSuggestionRowSchema.parse(rowInput);

	return AgentSuggestionSchema.parse({
		id: row.id,
		agentRunId: row.agent_run_id,
		presentationId: row.presentation_id,
		userId: row.user_id,
		accountId: row.account_id,
		agentId: row.agent_id,
		slideId: row.slide_id,
		type: row.type,
		summary: row.summary,
		priority: row.priority,
		status: row.status,
		detail: row.detail,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
		// Extract storyboard version from joined agent_runs
		storyboardVersion: row.agent_runs?.storyboard_version ?? null,
	});
}

export async function createAgentRun(
	supabase: SupabaseClientLike,
	input: CreateAgentRunInput,
): Promise<AgentRun> {
	const { data, error } = await agentRunsTable(supabase)
		.insert({
			presentation_id: input.presentationId,
			user_id: input.userId,
			account_id: input.accountId,
			agent_id: input.agentId,
			input_snapshot: input.inputSnapshot,
			storyboard_version: input.storyboardVersion,
			model_id: input.modelId,
		})
		.select("*")
		.single();

	if (error) {
		throw error;
	}

	return mapAgentRun(data);
}

export async function updateAgentRun(
	supabase: SupabaseClientLike,
	runId: string,
	input: UpdateAgentRunInput,
): Promise<AgentRun> {
	const updatePayload: Record<string, unknown> = {
		status: input.status,
		updated_at: new Date().toISOString(),
	};

	if ("result" in input) {
		updatePayload.result = input.result ?? null;
	}

	if ("error" in input) {
		updatePayload.error = input.error ?? null;
	}

	if ("tokenUsage" in input) {
		updatePayload.token_usage = input.tokenUsage ?? null;
	}

	if ("durationMs" in input) {
		updatePayload.duration_ms = input.durationMs ?? null;
	}

	const { data, error } = await agentRunsTable(supabase)
		.update(updatePayload)
		.eq("id", runId)
		.select("*")
		.single();

	if (error) {
		throw error;
	}

	return mapAgentRun(data);
}

export async function getLatestRuns(
	supabase: SupabaseClientLike,
	presentationId: string,
): Promise<AgentRun[]> {
	const { data, error } = await agentRunsTable(supabase)
		.select("*")
		.eq("presentation_id", presentationId)
		.order("created_at", { ascending: false });

	if (error) {
		throw error;
	}

	const rows = AgentRunRowsSchema.parse(data ?? []);
	const seen = new Set<AgentId>();
	const latestRuns: AgentRun[] = [];

	for (const row of rows) {
		if (seen.has(row.agent_id)) {
			continue;
		}

		seen.add(row.agent_id);
		latestRuns.push(mapAgentRun(row));
	}

	return latestRuns;
}

export async function getRunHistory(
	supabase: SupabaseClientLike,
	presentationId: string,
	agentId: AgentId,
	limit = 20,
): Promise<AgentRun[]> {
	const { data, error } = await agentRunsTable(supabase)
		.select("*")
		.eq("presentation_id", presentationId)
		.eq("agent_id", agentId)
		.order("created_at", { ascending: false })
		.limit(limit);

	if (error) {
		throw error;
	}

	return AgentRunRowsSchema.parse(data ?? []).map(mapAgentRun);
}

export async function createSuggestions(
	supabase: SupabaseClientLike,
	runId: string,
	suggestions: CreateAgentSuggestionInput[],
): Promise<AgentSuggestion[]> {
	const validatedSuggestions =
		CreateAgentSuggestionsInputSchema.parse(suggestions);

	if (validatedSuggestions.length === 0) {
		return [];
	}

	const { data: runData, error: runError } = await agentRunsTable(supabase)
		.select("id, presentation_id, user_id, account_id, agent_id")
		.eq("id", runId)
		.single();

	if (runError) {
		throw runError;
	}

	const run = z
		.object({
			id: z.string().uuid(),
			presentation_id: z.string().uuid(),
			user_id: z.string().uuid(),
			account_id: z.string().uuid(),
			agent_id: AgentIdSchema,
		})
		.parse(runData);

	const payload = validatedSuggestions.map((suggestion) => ({
		agent_run_id: run.id,
		presentation_id: run.presentation_id,
		user_id: run.user_id,
		account_id: run.account_id,
		agent_id: run.agent_id,
		slide_id: suggestion.slideId,
		type: suggestion.type,
		summary: suggestion.summary,
		priority: suggestion.priority ?? "medium",
		status: suggestion.status ?? "pending",
		detail: suggestion.detail ?? null,
	}));

	// Include storyboard_version from agent_runs join for consistent shape
	const { data, error } = await agentSuggestionsTable(supabase)
		.insert(payload)
		.select("*, agent_runs(storyboard_version)");

	if (error) {
		throw error;
	}

	return AgentSuggestionRowsSchema.parse(data ?? []).map(mapAgentSuggestion);
}

export async function updateSuggestionStatus(
	supabase: SupabaseClientLike,
	suggestionId: string,
	status: AgentSuggestionStatus,
): Promise<AgentSuggestion> {
	const { data, error } = await agentSuggestionsTable(supabase)
		.update({
			status,
			updated_at: new Date().toISOString(),
		})
		.eq("id", suggestionId)
		.select("*")
		.single();

	if (error) {
		throw error;
	}

	return mapAgentSuggestion(data);
}

export async function getSuggestions(
	supabase: SupabaseClientLike,
	presentationId: string,
	filters: GetSuggestionsFilters = {},
): Promise<AgentSuggestion[]> {
	// Use Supabase join syntax to include storyboard_version from agent_runs
	let query = agentSuggestionsTable(supabase)
		.select("*, agent_runs(storyboard_version)")
		.eq("presentation_id", presentationId)
		.order("created_at", { ascending: false });

	if (filters.agentId) {
		query = query.eq("agent_id", filters.agentId);
	}

	if (filters.slideId) {
		query = query.eq("slide_id", filters.slideId);
	}

	if (filters.status) {
		query = query.eq("status", filters.status);
	}

	if (filters.runId) {
		query = query.eq("agent_run_id", filters.runId);
	}

	if (typeof filters.limit === "number") {
		query = query.limit(filters.limit);
	}

	const { data, error } = await query;

	if (error) {
		throw error;
	}

	return AgentSuggestionRowsSchema.parse(data ?? []).map(mapAgentSuggestion);
}

/**
 * Check if a storyboard version is older than the current version
 */
function isOlderStoryboardVersion(
	sourceVersion: number,
	currentVersion: number,
): boolean {
	return sourceVersion < currentVersion;
}

export function isStale(run: AgentRun, currentVersion: number): boolean {
	return isOlderStoryboardVersion(run.storyboardVersion, currentVersion);
}

/**
 * Check if a suggestion's results are stale (storyboard was edited after the run)
 * @param suggestion - The suggestion to check
 * @param currentStoryboardVersion - The current storyboard version
 * @returns true if the suggestion is stale, false otherwise
 */
export function isSuggestionStale(
	suggestion: AgentSuggestion,
	currentStoryboardVersion: number,
): boolean {
	if (suggestion.storyboardVersion == null) {
		return false; // If no version info, assume not stale
	}
	return isOlderStoryboardVersion(
		suggestion.storyboardVersion,
		currentStoryboardVersion,
	);
}
