import { randomUUID } from "node:crypto";

import type { Mastra } from "@mastra/core";
import { EntityType, SpanType } from "@mastra/core/observability";
import { z } from "zod";

const ModelUsageSchema = z
	.object({
		inputTokens: z.number().nonnegative().optional(),
		outputTokens: z.number().nonnegative().optional(),
		promptTokens: z.number().nonnegative().optional(),
		completionTokens: z.number().nonnegative().optional(),
		totalTokens: z.number().nonnegative().optional(),
	})
	.passthrough();

const RunTokenUsageSchema = z.object({
	promptTokens: z.number().nonnegative(),
	completionTokens: z.number().nonnegative(),
	totalTokens: z.number().nonnegative(),
	estimatedCost: z.number().nonnegative(),
});

type TraceContext = {
	traceId: string;
	rootSpanId: string;
};

const RUN_TRACE_CACHE = new Map<string, TraceContext>();
const RUN_USAGE_CACHE = new Map<
	string,
	{ promptTokens: number; completionTokens: number; totalTokens: number }
>();

// Spike-only cost estimate (USD per 1k tokens).
const PROMPT_COST_PER_1K = 0.005;
const COMPLETION_COST_PER_1K = 0.015;

type ModelUsageInput = z.input<typeof ModelUsageSchema>;

export type RunTokenUsage = z.infer<typeof RunTokenUsageSchema>;

type RecordModelUsageSpanInput = {
	mastra: Mastra;
	runId: string;
	workflowId: string;
	stepId: string;
	model: string;
	usage: ModelUsageInput;
};

async function getObservabilityStore(mastra: Mastra) {
	const storage = mastra.getStorage();
	if (!storage) return null;

	return storage.getStore("observability");
}

function normalizeUsage(usage: ModelUsageInput): {
	promptTokens: number;
	completionTokens: number;
	totalTokens: number;
} {
	const parsed = ModelUsageSchema.parse(usage);
	const promptTokens = parsed.promptTokens ?? parsed.inputTokens ?? 0;
	const completionTokens = parsed.completionTokens ?? parsed.outputTokens ?? 0;
	const totalTokens = parsed.totalTokens ?? promptTokens + completionTokens;

	return {
		promptTokens,
		completionTokens,
		totalTokens,
	};
}

function getUsageFromAttributes(
	attributes: Record<string, unknown> | null | undefined,
): { promptTokens: number; completionTokens: number; totalTokens: number } {
	if (!attributes) {
		return { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
	}

	const usageValue = attributes.usage;
	if (!usageValue) {
		return { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
	}

	if (typeof usageValue === "string") {
		try {
			return normalizeUsage(JSON.parse(usageValue));
		} catch {
			return { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
		}
	}

	if (typeof usageValue === "object") {
		return normalizeUsage(usageValue as Record<string, unknown>);
	}

	return { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
}

async function ensureTraceContext(
	mastra: Mastra,
	runId: string,
	workflowId: string,
): Promise<TraceContext | null> {
	const cached = RUN_TRACE_CACHE.get(runId);
	if (cached) {
		return cached;
	}

	const observabilityStore = await getObservabilityStore(mastra);
	if (!observabilityStore) {
		return null;
	}

	const existing = await observabilityStore.listTraces({
		filters: { runId },
		page: 0,
		perPage: 20,
	});

	const existingSpans = existing.spans as Array<{
		parentSpanId?: string | null;
		traceId: string;
		spanId: string;
	}>;
	const existingRoot = existingSpans.find((span) => !span.parentSpanId);
	if (existingRoot) {
		const context: TraceContext = {
			traceId: existingRoot.traceId,
			rootSpanId: existingRoot.spanId,
		};
		RUN_TRACE_CACHE.set(runId, context);
		return context;
	}

	const traceId = randomUUID();
	const rootSpanId = randomUUID();

	await observabilityStore.createSpan({
		span: {
			traceId,
			spanId: rootSpanId,
			name: `${workflowId}.run`,
			spanType: SpanType.WORKFLOW_RUN,
			isEvent: false,
			startedAt: new Date(),
			runId,
			entityType: EntityType.WORKFLOW_RUN,
			entityId: workflowId,
			entityName: workflowId,
			metadata: {
				spike: true,
			},
		},
	});

	const context: TraceContext = { traceId, rootSpanId };
	RUN_TRACE_CACHE.set(runId, context);

	return context;
}

export async function recordModelUsageSpan(
	input: RecordModelUsageSpanInput,
): Promise<void> {
	const normalizedUsage = normalizeUsage(input.usage);
	const cachedUsage = RUN_USAGE_CACHE.get(input.runId) ?? {
		promptTokens: 0,
		completionTokens: 0,
		totalTokens: 0,
	};
	RUN_USAGE_CACHE.set(input.runId, {
		promptTokens: cachedUsage.promptTokens + normalizedUsage.promptTokens,
		completionTokens:
			cachedUsage.completionTokens + normalizedUsage.completionTokens,
		totalTokens: cachedUsage.totalTokens + normalizedUsage.totalTokens,
	});

	const observabilityStore = await getObservabilityStore(input.mastra);
	if (!observabilityStore) {
		return;
	}

	const context = await ensureTraceContext(
		input.mastra,
		input.runId,
		input.workflowId,
	);
	if (!context) {
		return;
	}

	await observabilityStore.createSpan({
		span: {
			traceId: context.traceId,
			spanId: randomUUID(),
			parentSpanId: context.rootSpanId,
			name: `${input.workflowId}.${input.stepId}.model`,
			spanType: SpanType.MODEL_GENERATION,
			isEvent: false,
			startedAt: new Date(),
			endedAt: new Date(),
			runId: input.runId,
			entityType: EntityType.WORKFLOW_STEP,
			entityId: input.stepId,
			entityName: input.stepId,
			attributes: {
				model: input.model,
				usage: normalizedUsage,
			},
		},
	});
}

export async function finalizeRunTrace(args: {
	mastra: Mastra;
	runId: string;
	workflowId: string;
}): Promise<void> {
	const observabilityStore = await getObservabilityStore(args.mastra);
	if (!observabilityStore) {
		return;
	}

	const context = await ensureTraceContext(
		args.mastra,
		args.runId,
		args.workflowId,
	);
	if (!context) {
		return;
	}

	await observabilityStore.updateSpan({
		traceId: context.traceId,
		spanId: context.rootSpanId,
		updates: {
			endedAt: new Date(),
		},
	});
}

export async function getRunTokenUsage(
	runId: string,
	mastra: Mastra,
): Promise<RunTokenUsage> {
	const cachedUsage = RUN_USAGE_CACHE.get(runId) ?? {
		promptTokens: 0,
		completionTokens: 0,
		totalTokens: 0,
	};

	const observabilityStore = await getObservabilityStore(mastra);
	if (!observabilityStore) {
		const cachedEstimatedCost =
			(cachedUsage.promptTokens / 1000) * PROMPT_COST_PER_1K +
			(cachedUsage.completionTokens / 1000) * COMPLETION_COST_PER_1K;

		return {
			promptTokens: cachedUsage.promptTokens,
			completionTokens: cachedUsage.completionTokens,
			totalTokens:
				cachedUsage.totalTokens ||
				cachedUsage.promptTokens + cachedUsage.completionTokens,
			estimatedCost: Number(cachedEstimatedCost.toFixed(6)),
		};
	}

	const traces = await observabilityStore.listTraces({
		filters: { runId },
		page: 0,
		perPage: 50,
	});
	const scopedTraceSpans =
		traces.spans.length > 0
			? traces.spans
			: (
					await observabilityStore.listTraces({
						page: 0,
						perPage: 200,
					})
				).spans.filter(
					(span: { runId?: string | null }) => span.runId === runId,
				);

	let promptTokens = 0;
	let completionTokens = 0;
	let totalTokens = 0;

	for (const trace of scopedTraceSpans) {
		const fullTrace = await observabilityStore.getTrace({
			traceId: trace.traceId,
		});
		if (!fullTrace) {
			continue;
		}

		for (const span of fullTrace.spans) {
			if (span.spanType !== SpanType.MODEL_GENERATION) {
				continue;
			}

			const usage = getUsageFromAttributes(span.attributes);
			promptTokens += usage.promptTokens;
			completionTokens += usage.completionTokens;
			totalTokens += usage.totalTokens;
		}
	}

	if (scopedTraceSpans.length === 0) {
		promptTokens = cachedUsage.promptTokens;
		completionTokens = cachedUsage.completionTokens;
		totalTokens =
			cachedUsage.totalTokens ||
			cachedUsage.promptTokens + cachedUsage.completionTokens;
	}

	const estimatedCost =
		(promptTokens / 1000) * PROMPT_COST_PER_1K +
		(completionTokens / 1000) * COMPLETION_COST_PER_1K;

	return RunTokenUsageSchema.parse({
		promptTokens,
		completionTokens,
		totalTokens: totalTokens || promptTokens + completionTokens,
		estimatedCost: Number(estimatedCost.toFixed(6)),
	});
}
