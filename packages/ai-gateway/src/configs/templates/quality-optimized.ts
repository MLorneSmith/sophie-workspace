/**
 * Quality-Optimized Configuration
 *
 * This configuration prioritizes output quality and accuracy over speed or cost.
 *
 * Key Optimizations:
 * - Uses GPT-4 for highest quality responses
 * - Low temperature (0.3) for consistent, precise outputs
 * - Structured JSON output for reliable parsing
 * - Longer cache duration (2 hours) for stable suggestions
 * - Multiple retry attempts for reliability
 *
 * Fallback Strategy:
 * - Falls back to Claude-3-Opus which matches GPT-4's quality
 * - Both models excel at structured output and reasoning
 *
 * Best Used For:
 * - Block improvements
 * - Critical content generation
 * - Situations requiring high accuracy
 * - Structured data outputs
 *
 * Cache Strategy:
 * - Longer cache duration (2 hours) as quality improvements are less time-sensitive
 * - Semantic caching to leverage similar past improvements
 * - Content version tracking to ensure freshness
 */
import { type Config } from '../types';
import {
  type CacheNamespaceOptions,
  addCacheNamespace,
} from '../utils/cache-namespace';
import {
  type ForceRefreshCondition,
  TimeBasedConditions,
  UserRequestCondition,
  withForceRefresh,
} from '../utils/force-refresh';

export function createQualityOptimizedConfig(
  namespaceOptions: CacheNamespaceOptions,
  contentVersion?: string,
): Config {
  // Base configuration
  const baseConfig: Config = {
    strategy: {
      mode: 'fallback',
    },
    targets: [
      {
        provider: 'openai',
        override_params: {
          model: 'gpt-4',
          temperature: 0.3, // Lower temperature for more precise output
          max_tokens: 500,
          response_format: { type: 'json' },
        },
      },
      {
        // Fallback to Claude which also handles JSON well
        provider: 'anthropic',
        override_params: {
          model: 'claude-3-opus',
          temperature: 0.3,
          max_tokens: 500,
        },
      },
    ],
    cache: {
      mode: 'semantic',
      max_age: 7200, // 2 hours cache, improvements are less time-sensitive
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
    TimeBasedConditions.DAILY, // Daily refresh for improvements
    UserRequestCondition,
  ];

  // Add content version condition if provided
  if (contentVersion) {
    conditions.push({
      type: 'content_change',
      value: contentVersion,
    });
  }

  return withForceRefresh(withNamespace, conditions);
}
