'use server';

import { z } from 'zod';

import { enhanceAction } from '@kit/next/actions';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import type { UsageStats } from '../_lib/types';

const UsageDataQuerySchema = z.object({
  timeRange: z.enum(['24h', '7d', '30d', '90d']),
  userId: z.string().optional(),
  teamId: z.string().optional(),
});

// Define the type for the data parameter
type UsageDataQuery = z.infer<typeof UsageDataQuerySchema>;

export const fetchUsageDataAction = enhanceAction(
  async function (data: UsageDataQuery, user) {
    try {
      const supabase = getSupabaseServerClient();
      const { timeRange, userId, teamId } = data;

      // Calculate date range based on the requested time range
      const now = new Date();
      let fromDate: Date;

      switch (timeRange) {
        case '24h':
          fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          fromDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }

      // Format date for the database query
      const fromDateStr = fromDate.toISOString();
      console.log(`Fetching usage data from ${fromDateStr} to now`);

      // Base query - using schema.from to address the table name issue
      // The ai_request_logs table is likely in the public schema
      let query = supabase
        .schema('public')
        .from('ai_request_logs')
        .select('*')
        .gte('request_timestamp', fromDateStr);

      // Add filters if specified
      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (teamId) {
        query = query.eq('team_id', teamId);
      }

      // Execute query
      const { data: logs, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch AI usage data: ${error.message}`);
      }

      // Process the data to generate statistics
      const stats: UsageStats = processLogsToStats(logs || []);

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      console.error('Error fetching AI usage data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
  {
    auth: true,
    schema: UsageDataQuerySchema,
    // The AdminGuard component wrapping the page will handle the super admin check
  },
);

// Function to process logs into statistics
function processLogsToStats(logs: any[]): UsageStats {
  // Type guards for log objects
  function isValidLog(log: any): log is { cost: number; total_tokens: number } {
    return (
      log &&
      typeof log === 'object' &&
      (typeof log.cost === 'number' || typeof log.cost === 'string') &&
      typeof log.total_tokens === 'number'
    );
  }

  // Extract numbers safely
  function getNumericValue(value: any): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }

  // Calculate total cost and tokens
  let totalCost = 0;
  let totalTokens = 0;

  for (const log of logs) {
    if (isValidLog(log)) {
      totalCost += getNumericValue(log.cost);
      totalTokens += log.total_tokens;
    }
  }

  // Group data by different dimensions
  const usageByDay = groupByDay(logs);

  // @ts-ignore: Type 'string | undefined' is not assignable to parameter of type 'string'
  const usageByModel = groupByField(logs, 'model');
  // @ts-ignore: Type 'string | undefined' is not assignable to parameter of type 'string'
  const usageByFeature = groupByField(logs, 'feature');
  // @ts-ignore: Type 'string | undefined' is not assignable to parameter of type 'string'
  const userUsageMap = groupByField(logs, 'user_id');

  // Convert user usage to sorted array
  const mostActiveUsers = Object.entries(userUsageMap)
    .map(([user, data]) => ({
      user,
      cost: data.cost,
      tokens: data.tokens,
    }))
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 10);

  return {
    totalCost,
    totalTokens,
    averageCost: logs.length ? totalCost / logs.length : 0,
    averageTokens: logs.length ? totalTokens / logs.length : 0,
    usageByDay,
    usageByModel: Object.entries(usageByModel).map(([model, data]) => ({
      model: model || 'unknown',
      cost: data.cost,
      tokens: data.tokens,
    })),
    usageByFeature: Object.entries(usageByFeature).map(([feature, data]) => ({
      feature: feature || 'unknown',
      cost: data.cost,
      tokens: data.tokens,
    })),
    mostActiveUsers,
  };
}

// Group logs by day for time-series chart
function groupByDay(
  logs: any[],
): { date: string; cost: number; tokens: number }[] {
  const dayMap = new Map<string, { cost: number; tokens: number }>();
  const today = new Date().toISOString().split('T')[0];

  for (const log of logs) {
    // Safely extract date
    let date = today;

    if (log && typeof log === 'object' && log.request_timestamp) {
      try {
        date = new Date(log.request_timestamp).toISOString().split('T')[0];
      } catch (e) {
        console.error('Invalid timestamp format:', log.request_timestamp);
      }
    }

    // Get or create entry for this date
    let entry = dayMap.get(date);
    if (!entry) {
      entry = { cost: 0, tokens: 0 };
      dayMap.set(date, entry);
    }

    // Add cost and tokens
    const cost =
      log && typeof log === 'object'
        ? typeof log.cost === 'number'
          ? log.cost
          : typeof log.cost === 'string'
            ? parseFloat(log.cost) || 0
            : 0
        : 0;

    const tokens =
      log && typeof log === 'object' && typeof log.total_tokens === 'number'
        ? log.total_tokens
        : 0;

    entry.cost += cost;
    entry.tokens += tokens;
  }

  // Convert to array and sort by date
  return Array.from(dayMap.entries())
    .map(([date, data]) => ({
      date,
      cost: data.cost,
      tokens: data.tokens,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// Group logs by a specific field
function groupByField(
  logs: any[],
  fieldName: string,
): Record<string, { cost: number; tokens: number }> {
  const groups: Record<string, { cost: number; tokens: number }> = {};

  for (const log of logs) {
    if (!log || typeof log !== 'object') continue;

    // Determine the key
    let key = 'unknown';

    // Safely check if fieldName exists and if the log has that field
    if (fieldName && typeof fieldName === 'string' && fieldName in log) {
      // Safely convert the field value to a string
      const fieldValue = log[fieldName];
      if (fieldValue !== null && fieldValue !== undefined) {
        key = String(fieldValue);
      }
    }

    // Create entry if it doesn't exist
    if (!groups[key]) {
      groups[key] = { cost: 0, tokens: 0 };
    }

    // Add cost and tokens - since we check for the existence of 'key' above
    // and initialize if not present, we can safely assert non-null here
    const costValue =
      typeof log.cost === 'number'
        ? log.cost
        : typeof log.cost === 'string'
          ? parseFloat(log.cost) || 0
          : 0;

    const tokensValue =
      typeof log.total_tokens === 'number' ? log.total_tokens : 0;

    groups[key]!.cost += costValue;
    groups[key]!.tokens += tokensValue;
  }

  return groups;
}
