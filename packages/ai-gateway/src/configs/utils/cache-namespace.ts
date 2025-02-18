import { type Config } from '../types';

/**
 * Options for cache namespace configuration
 */
export type CacheNamespaceOptions = {
  userId: string;
  context?: string;
  presentationId?: string;
  teamId?: string;
};

/**
 * Adds a cache namespace to a configuration
 * @param config Base configuration
 * @param options Namespace options including userId and optional context
 * @returns Configuration with added cache namespace
 */
export function addCacheNamespace(
  config: Config,
  options: CacheNamespaceOptions,
): Config & { cacheNamespace: string } {
  const { userId, context, presentationId, teamId } = options;

  // Build namespace parts
  const namespaceParts = [
    `user-${userId}`,
    teamId && `team-${teamId}`,
    presentationId && `pres-${presentationId}`,
    context && `ctx-${context}`,
  ].filter(Boolean);

  return {
    ...config,
    cacheNamespace: namespaceParts.join('-'),
  };
}
