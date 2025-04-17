import { NextResponse } from 'next/server';

import { z } from 'zod';

import { enhanceRouteHandler } from '@kit/next/routes';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

// Define the response schema
const SessionCostResponseSchema = z.object({
  sessionId: z.string().optional(),
  timeframe: z.enum(['session', 'day', 'week', 'month']).optional(),
});

export const GET = enhanceRouteHandler(
  async function ({ user, request }) {
    try {
      const url = new URL(request.url);
      const sessionId = url.searchParams.get('sessionId');
      const timeframe = url.searchParams.get('timeframe') || 'session';

      // Get Supabase client
      const supabase = getSupabaseServerClient();

      // Build query based on parameters
      let query = supabase
        .from('ai_request_logs')
        .select('cost')
        .eq('user_id', user.id);

      // Add session_id filter if provided
      if (sessionId) {
        query = query.eq('session_id', sessionId);
      } else {
        // If no session ID, apply time-based filter
        const now = new Date();
        let startTime: Date;

        switch (timeframe) {
          case 'day':
            startTime = new Date(now.setDate(now.getDate() - 1));
            break;
          case 'week':
            startTime = new Date(now.setDate(now.getDate() - 7));
            break;
          case 'month':
            startTime = new Date(now.setMonth(now.getMonth() - 1));
            break;
          default: // session - default to last hour as approximation
            startTime = new Date(now.setHours(now.getHours() - 1));
        }

        query = query.gte('request_timestamp', startTime.toISOString());
      }

      // Execute the query
      const { data, error } = await query;

      if (error) {
        console.error('Error fetching session costs:', error);
        return NextResponse.json({
          success: false,
          error: 'Failed to fetch costs',
        });
      }

      // Calculate total cost
      const totalCost = data
        ? data.reduce((sum, record) => {
            const cost =
              typeof record.cost === 'string'
                ? parseFloat(record.cost)
                : Number(record.cost);
            return sum + (isNaN(cost) ? 0 : cost);
          }, 0)
        : 0;

      return NextResponse.json({
        success: true,
        cost: totalCost,
      });
    } catch (error) {
      console.error('Error in session-cost API route:', error);
      return NextResponse.json({
        success: false,
        error: 'Internal server error',
      });
    }
  },
  {
    auth: true,
  },
);
