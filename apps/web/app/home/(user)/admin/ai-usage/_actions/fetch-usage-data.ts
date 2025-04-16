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

export const fetchUsageDataAction = enhanceAction(
  async function (data, user) {
    try {
      const supabase = getSupabaseServerClient();
      const { timeRange, userId, teamId } = data;

      // Determine time interval based on the requested time range
      let timeInterval: string;
      switch (timeRange) {
        case '24h':
          timeInterval = '1 day';
          break;
        case '7d':
          timeInterval = '7 days';
          break;
        case '30d':
          timeInterval = '30 days';
          break;
        case '90d':
          timeInterval = '90 days';
          break;
        default:
          timeInterval = '7 days';
      }

      // Base query
      let query = supabase
        .from('ai_request_logs')
        .select('*')
        .gte('request_timestamp', `now() - interval '${timeInterval}'`);

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
    // Only admin users can access this endpoint
    authorize: (_, user) => {
      return hasAdminRole(user);
    },
  },
);

// Function to process logs into statistics
function processLogsToStats(logs: any[]): UsageStats {
  // Calculate total cost and tokens
  const totalCost = logs.reduce((sum, log) => sum + (log.cost || 0), 0);
  const totalTokens = logs.reduce(
    (sum, log) => sum + (log.total_tokens || 0),
    0,
  );

  // Group logs by day for the chart
  const usageByDay = groupLogsByDay(logs);

  // Group logs by model
  const usageByModel = groupLogsByField(logs, 'model');

  // Group logs by feature
  const usageByFeature = groupLogsByField(logs, 'feature');

  // Group logs by user
  const usageByUser = groupLogsByField(logs, 'user_id');

  // Sort and limit to top 10 users
  const mostActiveUsers = Object.entries(usageByUser)
    .map(([user, { cost, tokens }]) => ({
      user,
      cost,
      tokens,
    }))
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 10);

  return {
    totalCost,
    totalTokens,
    averageCost: logs.length ? totalCost / logs.length : 0,
    averageTokens: logs.length ? totalTokens / logs.length : 0,
    usageByDay,
    usageByModel: Object.entries(usageByModel).map(
      ([model, { cost, tokens }]) => ({
        model: model || 'unknown',
        cost,
        tokens,
      }),
    ),
    usageByFeature: Object.entries(usageByFeature).map(
      ([feature, { cost, tokens }]) => ({
        feature: feature || 'unknown',
        cost,
        tokens,
      }),
    ),
    mostActiveUsers,
  };
}

// Group logs by day for time-series chart
function groupLogsByDay(
  logs: any[],
): { date: string; cost: number; tokens: number }[] {
  const dayMap: Record<string, { cost: number; tokens: number }> = {};

  // Group by day
  for (const log of logs) {
    const date = new Date(log.request_timestamp).toISOString().split('T')[0]; // Get YYYY-MM-DD
    if (!dayMap[date]) {
      dayMap[date] = { cost: 0, tokens: 0 };
    }
    dayMap[date].cost += log.cost || 0;
    dayMap[date].tokens += log.total_tokens || 0;
  }

  // Convert to array and sort by date
  return Object.entries(dayMap)
    .map(([date, stats]) => ({
      date,
      cost: stats.cost,
      tokens: stats.tokens,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// Group logs by a specific field
function groupLogsByField(
  logs: any[],
  field: string,
): Record<string, { cost: number; tokens: number }> {
  const result: Record<string, { cost: number; tokens: number }> = {};

  for (const log of logs) {
    const key = log[field] || 'unknown';
    if (!result[key]) {
      result[key] = { cost: 0, tokens: 0 };
    }
    result[key].cost += log.cost || 0;
    result[key].tokens += log.total_tokens || 0;
  }

  return result;
}

// Check if user has admin role
function hasAdminRole(user: any): boolean {
  // Implement your admin role check logic here
  // This is a placeholder - you should replace with your actual admin role check
  return user.email?.endsWith('@slideheroes.com') || false;
}
