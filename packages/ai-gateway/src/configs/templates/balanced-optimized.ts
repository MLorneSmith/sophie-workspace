/**
 * Balanced-Optimized Configuration
 *
 * This configuration achieves an optimal balance between speed, quality, and cost.
 * It's designed for scenarios where we need good quality output but can't afford
 * the latency of top-tier models or the inconsistency of fastest models.
 *
 * Key Optimizations:
 * - Uses Groq with llama-3.3-70b-specdec for good speed/quality ratio
 * - Moderate temperature (0.6) balancing creativity and consistency
 * - Medium token limit (300) for reasonable responses
 * - Limited retries (2) prioritizing responsiveness
 * - Simple text output for flexibility
 *
 * Fallback Strategy:
 * - Falls back to Claude-3-Haiku which maintains the speed/quality balance
 * - Both models provide:
 *   - Consistent quality
 *   - Fast inference times
 *   - Cost-effective processing
 *
 * Best Used For:
 * - Canvas suggestions
 * - Interactive features
 * - General-purpose completions
 * - Real-time collaborative features
 *
 * Cache Strategy:
 * - Short cache duration (30 mins) for interactive freshness
 * - Semantic caching for response consistency
 * - Efficient namespace management for context preservation
 */
import type { Config } from "../types";
import {
	addCacheNamespace,
	type CacheNamespaceOptions,
} from "../utils/cache-namespace";
import {
	type ForceRefreshCondition,
	TimeBasedConditions,
	UserRequestCondition,
	withForceRefresh,
} from "../utils/force-refresh";

export function createBalancedOptimizedConfig(
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
				provider: "groq",
				override_params: {
					model: "llama-3.3-70b-specdec",
					temperature: 0.6, // Balance between quality and creativity
					max_tokens: 300,
					response_format: { type: "text" },
				},
			},
			{
				// Fallback to fast but high-quality model
				provider: "anthropic",
				override_params: {
					model: "claude-3-haiku",
					temperature: 0.6,
					max_tokens: 300,
				},
			},
		],
		cache: {
			mode: "semantic",
			max_age: 1800, // 30 minutes cache
		},
		retry: {
			attempts: 2, // Fewer retries since speed is important
			on_status_codes: [429, 503],
		},
	};

	// Add cache namespace
	const withNamespace = addCacheNamespace(baseConfig, namespaceOptions);

	// Build force refresh conditions
	const conditions: ForceRefreshCondition[] = [
		TimeBasedConditions.HOURLY,
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
