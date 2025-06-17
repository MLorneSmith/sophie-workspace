/**
 * Speed-Optimized Configuration
 *
 * This configuration prioritizes fast response times and low cost over absolute quality.
 *
 * Key Optimizations:
 * - Uses Groq with llama-3.1-8b-instant for fastest possible responses
 * - Short token limit (150) to minimize processing time
 * - Higher temperature (0.7) since perfect accuracy isn't critical
 * - Short cache duration (30 mins) for fresh responses
 * - Simple text output format for speed
 *
 * Fallback Strategy:
 * - Falls back to GPT-3.5-turbo which balances speed and reliability
 *
 * Best Used For:
 * - Quick block suggestions
 * - Real-time completions
 * - Situations where speed > perfect accuracy
 * - High-volume, low-complexity requests
 *
 * Cache Strategy:
 * - Short cache duration to maintain responsiveness
 * - Semantic caching to maximize hit rates
 * - User-specific namespacing to prevent conflicts
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

export function createSpeedOptimizedConfig(
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
					model: "llama-3.1-8b-instant",
					temperature: 0.7,
					max_tokens: 150,
					response_format: { type: "text" },
				},
			},
			{
				// Fallback to a reliable model if primary fails
				provider: "openai",
				override_params: {
					model: "gpt-3.5-turbo",
					temperature: 0.7,
					max_tokens: 150,
				},
			},
		],
		cache: {
			mode: "semantic",
			max_age: 1800, // 30 minutes
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
