// Typings for database related operations
// Using type any for now until we have proper database types defined
type SupabaseClient = any;

interface UsageTrackingParams {
  userId?: string;
  teamId?: string;
  requestId: string;
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  feature?: string;
  sessionId?: string;
  bypassCredits?: boolean;
}

/**
 * Records API usage in the database for cost tracking and analytics
 *
 * @param supabase Supabase client instance
 * @param params UsageTrackingParams
 * @returns Promise<void>
 */
export async function recordApiUsage(
  supabase: SupabaseClient,
  params: UsageTrackingParams,
): Promise<void> {
  const {
    userId,
    teamId,
    requestId,
    provider,
    model,
    promptTokens,
    completionTokens,
    totalTokens,
    cost,
    feature,
    sessionId,
    bypassCredits = false,
  } = params;

  try {
    // 1. Record the request in ai_request_logs
    const { data: logData, error: logError } = await supabase
      .from('ai_request_logs')
      .insert({
        user_id: userId,
        team_id: teamId,
        request_id: requestId,
        provider,
        model,
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: totalTokens,
        cost,
        feature,
        session_id: sessionId,
      })
      .select('id')
      .single();

    if (logError) {
      console.error('Error recording AI request log:', logError);
      return;
    }

    // 2. Skip credit deduction if bypassing credits
    if (bypassCredits) {
      return;
    }

    // 3. Deduct credits if a user or team is specified
    if (userId || teamId) {
      // Determine whether to use user or team credits
      const entityType = userId ? 'user' : 'team';
      const entityId = userId || teamId;

      if (entityId) {
        // Call the stored procedure to deduct credits
        const { data: deductData, error: deductError } = await supabase.rpc(
          'deduct_ai_credits',
          {
            p_entity_type: entityType,
            p_entity_id: entityId,
            p_amount: cost,
            p_feature: feature || 'unknown',
            p_request_id: requestId,
          },
        );

        if (deductError) {
          console.error('Error deducting AI credits:', deductError);
        }
      }
    }
  } catch (error) {
    console.error('Error in recordApiUsage:', error);
  }
}

/**
 * Extracts cost information from Portkey response headers
 *
 * @param headers Response headers from Portkey
 * @returns number Cost value or 0 if not found
 */
export function extractCostFromHeaders(
  headers: Record<string, string>,
): number {
  const costHeader = headers['x-portkey-cost'];
  if (costHeader) {
    try {
      return parseFloat(costHeader);
    } catch (e) {
      console.error('Error parsing cost header:', e);
    }
  }
  return 0;
}

/**
 * Calculates the cost based on token usage and model pricing
 *
 * @param supabase Supabase client instance
 * @param provider AI provider (e.g., 'openai', 'anthropic')
 * @param model Model name (e.g., 'gpt-4', 'claude-3-opus')
 * @param promptTokens Number of prompt tokens
 * @param completionTokens Number of completion tokens
 * @returns Promise<number> Calculated cost
 */
export async function calculateCost(
  supabase: SupabaseClient,
  provider: string,
  model: string,
  promptTokens: number,
  completionTokens: number,
): Promise<number> {
  try {
    // Call the database function to calculate cost
    const { data, error } = await supabase.rpc('calculate_ai_cost', {
      p_provider: provider,
      p_model: model,
      p_prompt_tokens: promptTokens,
      p_completion_tokens: completionTokens,
    });

    if (error) {
      console.error('Error calculating AI cost:', error);
      return estimateCost(provider, model, promptTokens, completionTokens);
    }

    return data as number;
  } catch (error) {
    console.error('Error in calculateCost:', error);
    return estimateCost(provider, model, promptTokens, completionTokens);
  }
}

/**
 * Estimates cost based on token usage when the database function is unavailable
 * This serves as a fallback mechanism
 *
 * @param provider AI provider
 * @param model Model name
 * @param promptTokens Number of prompt tokens
 * @param completionTokens Number of completion tokens
 * @returns number Estimated cost
 */
function estimateCost(
  provider: string,
  model: string,
  promptTokens: number,
  completionTokens: number,
): number {
  // Default pricing (per 1K tokens)
  const pricing: Record<string, { input: number; output: number }> = {
    'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
    'gpt-4': { input: 0.03, output: 0.06 },
    'gpt-4-turbo': { input: 0.01, output: 0.03 },
    'claude-3-opus': { input: 0.015, output: 0.075 },
    'claude-3-sonnet': { input: 0.003, output: 0.015 },
    'claude-3-haiku': { input: 0.00025, output: 0.00125 },
  };

  // Get pricing for the model, or use GPT-3.5 Turbo as default
  const modelPricing = pricing[model] ||
    pricing['gpt-3.5-turbo'] || { input: 0.0015, output: 0.002 };

  // Calculate cost
  const inputCost = (promptTokens / 1000) * modelPricing.input;
  const outputCost = (completionTokens / 1000) * modelPricing.output;

  // Add 10% markup (matching our database configuration)
  return (inputCost + outputCost) * 1.1;
}

/**
 * Checks if user has exceeded usage limits
 *
 * @param supabase Supabase client instance
 * @param userId User ID
 * @param teamId Team ID
 * @returns Promise<boolean> True if limits exceeded
 */
export async function checkUsageLimits(
  supabase: SupabaseClient,
  userId?: string,
  teamId?: string,
): Promise<boolean> {
  if (!userId && !teamId) return false;
  const entityType = userId ? 'user' : 'team';
  const entityId = userId || teamId;

  if (!entityId) return false;

  try {
    const { data, error } = await supabase.rpc('check_ai_usage_limits', {
      p_entity_type: entityType,
      p_entity_id: entityId,
      p_cost: 0, // We're just checking if any limits are already exceeded
      p_tokens: 0,
    });

    if (error) {
      console.error('Error checking usage limits:', error);
      return false;
    }

    return data && data.length > 0 && data[0].limit_exceeded;
  } catch (error) {
    console.error('Error in checkUsageLimits:', error);
    return false;
  }
}
