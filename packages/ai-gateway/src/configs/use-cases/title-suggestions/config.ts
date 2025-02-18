import { createSpeedOptimizedConfig } from '../../templates/speed-optimized';
import { type Config } from '../../types';
import { type CacheNamespaceOptions } from '../../utils/cache-namespace';

/**
 * Configuration for title suggestions
 * Extends speed-optimized config with title-specific adjustments
 *
 * Modifications from base speed config:
 * - Higher temperature (0.8) for more creative titles
 * - JSON output format for structured suggestions
 * - Slightly longer token limit (200) for multiple suggestions
 * - Keeps fast response time priority
 *
 * Use Case:
 * - Part of interactive form flow
 * - Needs quick, creative title suggestions
 * - Requires structured output for UI rendering
 */
export function createTitleSuggestionsConfig(
  namespaceOptions: CacheNamespaceOptions,
  contentVersion?: string,
): Config {
  // Get base speed-optimized config
  const baseConfig = createSpeedOptimizedConfig(
    namespaceOptions,
    contentVersion,
  );

  // Override specific parameters for title generation
  baseConfig.targets = baseConfig.targets.map(
    (target: Config['targets'][number]) => ({
      ...target,
      override_params: {
        ...target.override_params,
        temperature: 0.8, // Increase creativity
        max_tokens: 200, // Allow for multiple suggestions
        response_format: { type: 'json' }, // Structured output
      },
    }),
  );

  return baseConfig;
}

export default createTitleSuggestionsConfig;
