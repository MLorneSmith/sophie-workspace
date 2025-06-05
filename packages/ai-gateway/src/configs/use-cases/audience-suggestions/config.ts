import { createSpeedOptimizedConfig } from "../../templates/speed-optimized";
import type { Config } from "../../types";
import type { CacheNamespaceOptions } from "../../utils/cache-namespace";

/**
 * Configuration for audience suggestions
 * Extends speed-optimized config with audience-specific adjustments
 *
 * Modifications from base speed config:
 * - Moderate temperature (0.7) for focused yet varied suggestions
 * - Shorter token limit (150) for concise audience descriptions
 * - Keeps fast response time priority
 *
 * Use Case:
 * - Part of interactive form flow
 * - Needs quick, relevant audience suggestions
 * - Outputs numbered list format for easy parsing
 */
export function createAudienceSuggestionsConfig(
	namespaceOptions: CacheNamespaceOptions,
	contentVersion?: string,
): Config {
	// Get base speed-optimized config
	const baseConfig = createSpeedOptimizedConfig(
		namespaceOptions,
		contentVersion,
	);

	// Override specific parameters for audience suggestions
	baseConfig.targets = baseConfig.targets.map(
		(target: Config["targets"][number]) => ({
			...target,
			override_params: {
				...target.override_params,
				temperature: 0.7, // Balanced between creativity and focus
				max_tokens: 150, // Shorter responses for audience suggestions
				format: "text", // Use plain text format for numbered lists
			},
		}),
	);

	return baseConfig;
}

export default createAudienceSuggestionsConfig;
