/**
 * Reasoning-Optimized Configuration
 *
 * This configuration balances reasoning capabilities with performance.
 * It's designed for tasks that require logical analysis and structured thinking,
 * while maintaining reasonable response times and costs.
 *
 * Key Optimizations:
 * - Uses o3-mini for efficient reasoning capabilities
 * - Balanced temperature (0.4) for creative yet logical outputs
 * - Longer token limit (1000) for detailed reasoning
 * - Medium cache duration (1 hour) balancing freshness and efficiency
 * - JSON output format for structured reasoning steps
 *
 * Fallback Strategy:
 * - Falls back to Claude-3-Sonnet known for strong reasoning
 * - Both models excel at:
 *   - Step-by-step analysis
 *   - Logical deductions
 *   - Structured explanations
 *
 * Best Used For:
 * - Answer rewrites requiring logic
 * - Complex transformations
 * - Tasks needing balanced creativity/logic
 * - Multi-step reasoning processes
 *
 * Cache Strategy:
 * - Medium cache duration for balanced freshness
 * - Semantic caching to leverage similar reasoning patterns
 * - Namespace isolation to maintain context relevance
 */
import type { Config } from "../types";
import {
	type CacheNamespaceOptions,
	addCacheNamespace,
} from "../utils/cache-namespace";
import {
	type ForceRefreshCondition,
	TimeBasedConditions,
	UserRequestCondition,
	withForceRefresh,
} from "../utils/force-refresh";

export function createReasoningOptimizedConfig(
	namespaceOptions: CacheNamespaceOptions,
	contentVersion?: string,
): Config {
	// Base configuration
	const baseConfig: Config = {
		strategy: {
			mode: "fallback",
		},
		targets: [
			{
				provider: "openai",
				override_params: {
					model: "o3-mini",
					temperature: 0.4, // Balance between creativity and precision
					max_tokens: 1000, // Longer responses for detailed reasoning
					response_format: { type: "json" },
				},
			},
			{
				// Fallback to Claude for strong reasoning capabilities
				provider: "anthropic",
				override_params: {
					model: "claude-3-sonnet",
					temperature: 0.4,
					max_tokens: 1000,
				},
			},
		],
		cache: {
			mode: "semantic",
			max_age: 3600, // 1 hour cache
		},
		retry: {
			attempts: 3,
			on_status_codes: [429, 503], // Retry on rate limits and service unavailable
		},
	};

	// Add cache namespace
	const withNamespace = addCacheNamespace(baseConfig, namespaceOptions);

	// Build force refresh conditions
	const conditions: ForceRefreshCondition[] = [
		TimeBasedConditions.HOURLY, // Hourly refresh for reasoning tasks
		UserRequestCondition,
	];

	// Add content version condition if provided
	if (contentVersion) {
		conditions.push({
			type: "content_change",
			value: contentVersion,
		});
	}

	return withForceRefresh(withNamespace, conditions);
}
