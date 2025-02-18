import { type Config } from '../types';

/**
 * Types of conditions that can trigger a force refresh
 */
export type ForceRefreshConditionType =
  | 'time'
  | 'content_change'
  | 'user_request';

/**
 * Condition for determining when to force refresh
 */
export type ForceRefreshCondition = {
  type: ForceRefreshConditionType;
  value?: number | string;
};

/**
 * Context for evaluating force refresh conditions
 */
export type ForceRefreshContext = {
  lastRefreshTime?: number;
  contentVersion?: string;
  userRequested?: boolean;
};

/**
 * Configuration with force refresh capability
 */
export type ConfigWithForceRefresh = Config & {
  shouldForceRefresh: (context: ForceRefreshContext) => boolean;
};

/**
 * Adds force refresh capability to a configuration
 * @param config Base configuration
 * @param conditions Array of conditions that can trigger a force refresh
 * @returns Configuration with force refresh capability
 */
export function withForceRefresh(
  config: Config,
  conditions: ForceRefreshCondition[],
): ConfigWithForceRefresh {
  return {
    ...config,
    shouldForceRefresh: (context: ForceRefreshContext): boolean => {
      return conditions.some((condition) => {
        switch (condition.type) {
          case 'time':
            return (
              context.lastRefreshTime &&
              Date.now() - context.lastRefreshTime > (condition.value as number)
            );
          case 'content_change':
            return context.contentVersion !== condition.value;
          case 'user_request':
            return context.userRequested;
          default:
            return false;
        }
      });
    },
  };
}

/**
 * Common time-based force refresh conditions
 */
export const TimeBasedConditions = {
  HOURLY: { type: 'time' as const, value: 3600000 }, // 1 hour
  DAILY: { type: 'time' as const, value: 86400000 }, // 24 hours
  WEEKLY: { type: 'time' as const, value: 604800000 }, // 7 days
};

/**
 * Creates a content change condition
 * @param version Content version to compare against
 * @returns Force refresh condition for content changes
 */
export function createContentChangeCondition(
  version: string,
): ForceRefreshCondition {
  return {
    type: 'content_change',
    value: version,
  };
}

/**
 * User request condition for force refresh
 */
export const UserRequestCondition: ForceRefreshCondition = {
  type: 'user_request',
};
