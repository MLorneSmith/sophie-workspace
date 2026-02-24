/**
 * Agent-level model routing policy.
 *
 * Each agent has a default model and optional overrides for specific task types.
 * Models use Mastra's native format: "<provider>/<model>"
 *
 * The routing policy is the single source of truth for which model an agent uses.
 * It can be overridden per-request via Mastra's RequestContext for A/B testing
 * or user preference.
 *
 * TODO(#503): When Portkey gateway is wired, model IDs will route through
 * Portkey for cost tracking and fallbacks.
 */

export type AgentName =
	| "research"
	| "partner"
	| "validator"
	| "whisperer"
	| "editor"
	| "brief-generator"
	| "storyboard-generator";

export type TaskType = "default" | "reasoning" | "fast" | "creative";

export type CostTier = "low" | "medium" | "high" | "premium";

export interface ModelPolicy {
	default: string;
	reasoning?: string;
	fast?: string;
	creative?: string;
	fallbacks?: string[];
}

export type ModelOverrides = Partial<Record<AgentName, string>>;

const DEFAULT_FALLBACK_MODEL = "openai/gpt-4o-mini";

export const MODEL_COST_TIERS: Record<string, CostTier> = {
	"openai/gpt-4o-mini": "low",
	"openai/gpt-4o": "medium",
	"anthropic/claude-sonnet-4-20250514": "high",
	"anthropic/claude-opus-4-20250514": "premium",
};

/**
 * Model routing table — maps agent + task type → model ID.
 *
 * Model IDs use Mastra's native format: "<provider>/<model>".
 * Mastra resolves these via its built-in provider registry.
 */
export const AGENT_MODEL_POLICY: Record<AgentName, ModelPolicy> = {
	// Research agent — profile lookups, company research, data synthesis
	research: {
		default: "openai/gpt-4o",
		reasoning: "openai/gpt-4o",
		fast: "openai/gpt-4o-mini",
		fallbacks: ["anthropic/claude-sonnet-4-20250514", "openai/gpt-4o-mini"],
	},

	// Brief generator — audience + company brief synthesis
	"brief-generator": {
		default: "openai/gpt-4o",
		reasoning: "anthropic/claude-sonnet-4-20250514",
		fast: "openai/gpt-4o-mini",
		fallbacks: ["anthropic/claude-sonnet-4-20250514", "openai/gpt-4o-mini"],
	},

	// Storyboard generator — slide layout and content design
	"storyboard-generator": {
		default: "openai/gpt-4o",
		reasoning: "anthropic/claude-sonnet-4-20250514",
		creative: "openai/gpt-4o",
		fallbacks: ["anthropic/claude-sonnet-4-20250514", "openai/gpt-4o-mini"],
	},

	// Partner agent — senior consulting partner narrative review
	partner: {
		default: "anthropic/claude-sonnet-4-20250514",
		reasoning: "anthropic/claude-sonnet-4-20250514",
		fast: "openai/gpt-4o-mini",
		fallbacks: ["openai/gpt-4o", "openai/gpt-4o-mini"],
	},

	// Validator agent — verifies evidence quality and factual support
	validator: {
		default: "anthropic/claude-sonnet-4-20250514",
		reasoning: "anthropic/claude-sonnet-4-20250514",
		fast: "openai/gpt-4o-mini",
		fallbacks: ["openai/gpt-4o", "openai/gpt-4o-mini"],
	},

	// Whisperer agent — audience-specific communication coaching
	whisperer: {
		default: "openai/gpt-4o",
		reasoning: "openai/gpt-4o",
		creative: "openai/gpt-4o",
		fast: "openai/gpt-4o-mini",
		fallbacks: ["anthropic/claude-sonnet-4-20250514", "openai/gpt-4o-mini"],
	},

	// Editor agent — copy editing, consistency, formatting
	editor: {
		default: "openai/gpt-4o-mini",
		reasoning: "openai/gpt-4o",
		fast: "openai/gpt-4o-mini",
		fallbacks: ["openai/gpt-4o", "anthropic/claude-sonnet-4-20250514"],
	},
};

/**
 * Get the model ID for an agent + task type combination.
 * Falls back to agent default → hardcoded fallback.
 */
export function getModelForAgent(
	agent: AgentName,
	taskType: TaskType = "default",
): string {
	const policy = AGENT_MODEL_POLICY[agent];
	if (!policy) return DEFAULT_FALLBACK_MODEL;

	return policy[taskType] ?? policy.default;
}

/**
 * Get the ordered model fallback chain for an agent + task type.
 * The chain is [primary, ...fallbacks] with duplicates removed.
 */
export function getModelFallbackChain(
	agent: AgentName,
	taskType: TaskType = "default",
): string[] {
	const primary = getModelForAgent(agent, taskType);
	const fallbacks = AGENT_MODEL_POLICY[agent]?.fallbacks ?? [];

	return [...new Set([primary, ...fallbacks])];
}

/**
 * Get the cost tier for a model ID.
 * Unknown models default to "medium".
 */
export function getModelCostTier(modelId: string): CostTier {
	return MODEL_COST_TIERS[modelId] ?? "medium";
}

/**
 * Get the cost tier for an agent + task type route.
 */
export function getAgentCostTier(
	agent: AgentName,
	taskType: TaskType = "default",
): CostTier {
	return getModelCostTier(getModelForAgent(agent, taskType));
}

/**
 * Resolve model for a run with optional per-agent overrides.
 * Overrides have higher priority than the routing table.
 */
export function resolveModel(
	agent: AgentName,
	taskType?: TaskType,
	overrides?: ModelOverrides,
): string {
	const override = overrides?.[agent];
	if (override) return override;

	return getModelForAgent(agent, taskType ?? "default");
}

/**
 * Create a dynamic model resolver for an agent that supports runtime overrides
 * via Mastra's runtimeContext.
 *
 * When passed as `model` to a Mastra Agent constructor, this function is called
 * on each `agent.generate()` invocation. If `runtimeContext` contains a "modelId"
 * key, that model is used instead of the agent's default.
 *
 * This enables the resilient-agent-runner to swap models during fallback without
 * reconstructing the agent.
 *
 * Usage in agent definition:
 *   model: createDynamicModelForAgent("partner")
 *
 * At call time (in resilient-agent-runner):
 *   const requestContext = new RequestContext();
 *   requestContext.set("modelId", fallbackModelId);
 *   agent.generate(messages, { requestContext });
 */
export function createDynamicModelForAgent(
	agent: AgentName,
	taskType: TaskType = "default",
) {
	return ({
		requestContext,
	}: {
		requestContext?: { get: (key: string) => string | undefined };
	} = {}) => {
		const override = requestContext?.get("modelId");
		if (override) return override;

		return getModelForAgent(agent, taskType);
	};
}
