/**
 * Simplified OpenAI Configuration
 *
 * This configuration uses only OpenAI models to avoid authentication issues
 * with other providers. It's a temporary solution until proper API keys
 * are configured for all providers.
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

export function createSimplifiedConfig(
	namespaceOptions: CacheNamespaceOptions,
	contentVersion?: string,
): Config {
	// Base configuration with a more stable model
	// Note: We're not specifying provider here since it will be
	// determined by the createGatewayClient based on the model name
	const baseConfig: Config = {
		override_params: {
			model: "gpt-4", // More stable model
			temperature: 0.7,
			max_tokens: 300,
		},
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
		});
	}

	return withForceRefresh(withNamespace, conditions);
}
