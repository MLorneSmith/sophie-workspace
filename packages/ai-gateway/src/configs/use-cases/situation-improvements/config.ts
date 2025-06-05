import { createQualityOptimizedConfig } from "../../templates/quality-optimized";
import type { Config } from "../../types";
import {
	type CacheNamespaceOptions,
	addCacheNamespace,
} from "../../utils/cache-namespace";

/**
 * Configuration for generating situation improvements
 *
 * Uses quality-optimized base config to ensure:
 * - High quality responses with GPT-4
 * - Structured JSON output
 * - Semantic caching for similar improvements
 * - Content version tracking
 *
 * @param userId - User ID for cache namespacing
 * @param teamId - Optional team ID for cache namespacing
 * @param contentVersion - Optional content version for cache invalidation
 */
export function createSituationImprovementsConfig(
	userId: string,
	teamId?: string,
	contentVersion?: string,
): Config {
	return createQualityOptimizedConfig(
		{
			userId,
			teamId,
			context: "situation-improvements",
		},
		contentVersion,
	);
}
