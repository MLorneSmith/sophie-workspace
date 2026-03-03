import { RequestContext } from "@mastra/core/request-context";
import type { ZodSchema } from "zod";
import { LAUNCH_AGENTS } from "../agents/registry";
import { researchAgent } from "../agents/research-agent";
import {
	type AgentName,
	getModelFallbackChain,
	type ModelOverrides,
	resolveModel,
	type TaskType,
} from "../config/model-routing";
import { CircuitBreaker } from "./circuit-breaker";
import { RateLimiter } from "./rate-limiter";
import { withRetry } from "./retry";

export interface RunAgentOptions {
	agentId: AgentName;
	taskType?: TaskType;
	messages: Array<{ role: string; content: string }>;
	structuredOutput?: { schema: ZodSchema };
	overrides?: ModelOverrides;
}

export interface RunAgentResult<T> {
	result: T;
	modelUsed: string;
	attempts: number;
	totalDurationMs: number;
	tokenUsage?: {
		promptTokens?: number;
		completionTokens?: number;
		totalTokens?: number;
	};
}

type AgentRunner = {
	generate: (
		messages: Array<{ role: string; content: string }>,
		options?: unknown,
	) => Promise<{
		object?: unknown;
		text?: unknown;
		totalUsage?: Promise<unknown>;
	}>;
};

/**
 * Module-level singletons for resilience state.
 *
 * NOTE: These persist for the process lifetime. In serverless/edge environments,
 * they reset on cold starts, reducing effectiveness. For serverless deployments,
 * consider externalizing circuit breaker state or using dependency injection.
 */
const MODEL_CIRCUIT_BREAKERS = new Map<string, CircuitBreaker>();
const SHARED_RATE_LIMITER = new RateLimiter();

function getCircuitBreaker(modelId: string): CircuitBreaker {
	let circuitBreaker = MODEL_CIRCUIT_BREAKERS.get(modelId);

	if (!circuitBreaker) {
		circuitBreaker = new CircuitBreaker(`model:${modelId}`);
		MODEL_CIRCUIT_BREAKERS.set(modelId, circuitBreaker);
	}

	return circuitBreaker;
}

function resolveAgentRunner(agentId: AgentName): AgentRunner {
	switch (agentId) {
		case "research":
		case "brief-generator":
			return researchAgent as unknown as AgentRunner;
		case "storyboard-generator":
			// Until a dedicated storyboard agent is registered, use the editor agent path.
			return LAUNCH_AGENTS.editor as unknown as AgentRunner;
		case "partner":
			return LAUNCH_AGENTS.partner as unknown as AgentRunner;
		case "validator":
			return LAUNCH_AGENTS.validator as unknown as AgentRunner;
		case "whisperer":
			return LAUNCH_AGENTS.whisperer as unknown as AgentRunner;
		case "editor":
			return LAUNCH_AGENTS.editor as unknown as AgentRunner;
		default:
			return assertNever(agentId);
	}
}

function assertNever(value: never): never {
	throw new Error(`Unhandled agent id: ${String(value)}`);
}

function estimatePromptTokens(
	messages: Array<{ role: string; content: string }>,
): number {
	const textCharacters = messages.reduce(
		(total, message) => total + message.role.length + message.content.length,
		0,
	);

	return Math.max(1, Math.ceil(textCharacters / 4));
}

function getErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}

	return String(error);
}

function toFiniteNumber(value: unknown): number | undefined {
	if (typeof value === "number" && Number.isFinite(value)) {
		return value;
	}

	return undefined;
}

function normalizeTokenUsage(
	usage: unknown,
): RunAgentResult<unknown>["tokenUsage"] {
	if (!usage || typeof usage !== "object") {
		return undefined;
	}

	const usageRecord = usage as Record<string, unknown>;
	const promptTokens =
		toFiniteNumber(usageRecord.promptTokens) ??
		toFiniteNumber(usageRecord.inputTokens);
	const completionTokens =
		toFiniteNumber(usageRecord.completionTokens) ??
		toFiniteNumber(usageRecord.outputTokens);
	const totalTokens = toFiniteNumber(usageRecord.totalTokens);

	if (
		promptTokens === undefined &&
		completionTokens === undefined &&
		totalTokens === undefined
	) {
		return undefined;
	}

	return {
		promptTokens,
		completionTokens,
		totalTokens,
	};
}

async function executeAgentCall<T>(params: {
	agent: AgentRunner;
	modelId: string;
	messages: RunAgentOptions["messages"];
	structuredOutput?: RunAgentOptions["structuredOutput"];
	agentId: AgentName;
	taskType: TaskType;
	sessionId: string;
}): Promise<{ result: T; tokenUsage?: RunAgentResult<unknown>["tokenUsage"] }> {
	const requestContext = new RequestContext();
	requestContext.set("modelId", params.modelId);

	// Set agent metadata for potential future Langfuse trace headers via gateway
	requestContext.set("agentName", params.agentId);
	requestContext.set("taskType", params.taskType);
	requestContext.set("sessionId", params.sessionId);

	const generationOptions: Record<string, unknown> = {
		requestContext,
	};

	// Pass Langfuse trace headers through generation options for gateway
	generationOptions["headers"] = {
		"x-langfuse-trace-name": params.agentId,
		"x-langfuse-session-id": params.sessionId,
		"x-langfuse-metadata": JSON.stringify({
			taskType: params.taskType,
			agentName: params.agentId,
		}),
	};

	if (params.structuredOutput) {
		generationOptions.structuredOutput = {
			schema: params.structuredOutput.schema,
		};
	}

	const output = await params.agent.generate(
		params.messages,
		generationOptions,
	);

	const result = params.structuredOutput
		? output.object !== undefined
			? (params.structuredOutput.schema.parse(output.object) as T)
			: (() => {
					throw new Error(
						`Structured output requested but model "${params.modelId}" returned no object`,
					);
				})()
		: (output.text as T);

	const tokenUsage = output.totalUsage
		? normalizeTokenUsage(await output.totalUsage)
		: undefined;

	return {
		result,
		tokenUsage,
	};
}

export async function runAgentWithResilience<T>(
	options: RunAgentOptions,
): Promise<RunAgentResult<T>> {
	const startedAtMs = Date.now();
	const agent = resolveAgentRunner(options.agentId);

	const primaryModel = resolveModel(
		options.agentId,
		options.taskType,
		options.overrides,
	);
	const fallbackChain = getModelFallbackChain(
		options.agentId,
		options.taskType ?? "default",
	);
	const modelChain = [...new Set([primaryModel, ...fallbackChain])];

	const estimatedTokens = estimatePromptTokens(options.messages);
	let attempts = 0;
	let lastError: unknown;

	// Generate a session ID for this agent run (used for Langfuse traces via Bifrost)
	const sessionId = `${options.agentId}-${startedAtMs}-${Math.random().toString(36).slice(2, 9)}`;

	for (const modelId of modelChain) {
		const circuitBreaker = getCircuitBreaker(modelId);

		// Check if circuit is open before consuming rate limiter tokens
		if (circuitBreaker.state === "open") {
			continue; // Skip to next model in chain
		}

		try {
			await SHARED_RATE_LIMITER.acquire(estimatedTokens);
			const outcome = await withRetry(async () => {
				attempts += 1;
				return circuitBreaker.execute(async () =>
					executeAgentCall<T>({
						agent,
						modelId,
						messages: options.messages,
						structuredOutput: options.structuredOutput,
						agentId: options.agentId,
						taskType: options.taskType ?? "default",
						sessionId,
					}),
				);
			});

			return {
				result: outcome.result,
				modelUsed: modelId,
				attempts,
				totalDurationMs: Date.now() - startedAtMs,
				tokenUsage: outcome.tokenUsage,
			};
		} catch (error) {
			lastError = error;
		}
	}

	if (attempts === 0) {
		throw new Error(
			`All circuit breakers open for agent "${options.agentId}". ` +
				`Models skipped: ${modelChain.join(", ")}. ` +
				"No requests attempted.",
		);
	}

	const errorMessage = [
		`All model attempts failed for agent "${options.agentId}".`,
		`Models tried: ${modelChain.join(", ")}.`,
		`Attempts: ${attempts}.`,
		`Last error: ${getErrorMessage(lastError)}.`,
	].join(" ");

	throw new Error(errorMessage);
}
