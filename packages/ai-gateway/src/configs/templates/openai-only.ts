/**
 * OpenAI-Only Configuration
 *
 * This configuration uses only OpenAI models to avoid authentication issues
 * with other providers. It maintains the correct configuration structure
 * for compatibility with Portkey's API.
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

export function createOpenAIOnlyConfig(
	namespaceOptions: CacheNamespaceOptions,
	contentVersion?: string,
): Config {
	// Base configuration with proper structure
	const baseConfig: Config = {
		strategy: {
			mode: "single", // Single strategy for OpenAI only
		},
		targets: [
			{
				provider: "openai",
				override_params: {
					model: "gpt-4",
					temperature: 0.7,
					max_tokens: 300,
				},
			},
		],
		cache: {
			mode: "simple",
			max_age: 1800, // 30 minutes cache
		},
		retry: {
			attempts: 2,
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
		// });
	}

	return withForceRefresh(withNamespace, conditions);
}
