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

interface ModelPolicy {
	default: string;
	reasoning?: string;
	fast?: string;
	creative?: string;
}

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
	},

	// Brief generator — audience + company brief synthesis
	"brief-generator": {
		default: "openai/gpt-4o",
		reasoning: "anthropic/claude-sonnet-4-20250514",
		fast: "openai/gpt-4o-mini",
	},

	// Storyboard generator — slide layout and content design
	"storyboard-generator": {
		default: "openai/gpt-4o",
		reasoning: "anthropic/claude-sonnet-4-20250514",
		creative: "openai/gpt-4o",
	},

	// Partner agent — senior consulting partner narrative review
	partner: {
		default: "openai/gpt-4o",
		reasoning: "anthropic/claude-sonnet-4-20250514",
		fast: "openai/gpt-4o-mini",
	},

	// Validator agent — verifies evidence quality and factual support
	validator: {
		default: "anthropic/claude-sonnet-4-20250514",
		reasoning: "anthropic/claude-sonnet-4-20250514",
		fast: "openai/gpt-4o-mini",
	},

	// Whisperer agent — audience-specific communication coaching
	whisperer: {
		default: "openai/gpt-4o",
		reasoning: "openai/gpt-4o",
		fast: "openai/gpt-4o-mini",
	},

	// Editor agent — copy editing, consistency, formatting
	editor: {
		default: "openai/gpt-4o-mini",
		reasoning: "openai/gpt-4o",
		fast: "openai/gpt-4o-mini",
	},
};

/**
 * Get the model ID for an agent + task type combination.
 * Falls back to agent default → research default → hardcoded fallback.
 */
export function getModelForAgent(
	agent: AgentName,
	taskType: TaskType = "default",
): string {
	const policy = AGENT_MODEL_POLICY[agent];
	if (!policy) return "openai/gpt-4o";

	return policy[taskType] ?? policy.default;
}
