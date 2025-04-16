// Import the SupabaseClient type from our utility module
import { SupabaseClient } from './supabase-client';

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
 * Enhanced with better error handling and validation
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
    // Validate the Supabase client has required methods
    if (!supabase || typeof supabase.from !== 'function') {
      console.warn('Invalid Supabase client, skipping usage recording');
      return;
    }

    // 1. Record the request in ai_request_logs
    try {
      const { error: logError } = await supabase
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
      }
    } catch (insertError) {
      console.error('Exception in AI request log insertion:', insertError);
    }

    // 2. Skip credit deduction if bypassing credits
    if (bypassCredits) {
      return;
    }

    // 3. Deduct credits if a user or team is specified
    if (userId || teamId) {
      try {
        // Determine whether to use user or team credits
        const entityType = userId ? 'user' : 'team';
        const entityId = userId || teamId;

        if (entityId && typeof supabase.rpc === 'function') {
          // Call the stored procedure to deduct credits
          const { error: deductError } = await supabase.rpc(
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
      } catch (deductError) {
        console.error('Exception in credit deduction:', deductError);
      }
    }
  } catch (error) {
    console.error('Fatal error in recordApiUsage:', error);
    // Continue execution to prevent breaking the main functionality
  }
}

/**
 * Extracts cost information from Portkey response headers
 * Enhanced with better error handling
 *
 * @param headers Response headers from Portkey
 * @returns number Cost value or 0 if not found
 */
export function extractCostFromHeaders(
  headers: Record<string, string>,
): number {
  if (!headers) {
    console.warn('No headers provided to extractCostFromHeaders');
    return 0;
  }

  const costHeader = headers['x-portkey-cost'];
  if (costHeader) {
    try {
      const cost = parseFloat(costHeader);
      if (isNaN(cost) || cost < 0) {
        console.warn(`Invalid cost value in header: ${costHeader}`);
        return 0;
      }
      return cost;
    } catch (e) {
      console.error('Error parsing cost header:', e);
    }
  }
  return 0;
}

/**
 * Calculates the cost based on token usage and model pricing
 * Enhanced with better error handling and validation
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
  // Validate inputs
  if (!provider || !model) {
    console.warn('Missing provider or model in calculateCost');
    return estimateCost(
      provider || 'openai',
      model || 'gpt-3.5-turbo',
      promptTokens,
      completionTokens,
    );
  }

  if (promptTokens < 0 || completionTokens < 0) {
    console.warn(
      `Invalid token counts: prompt=${promptTokens}, completion=${completionTokens}`,
    );
    return 0;
  }

  try {
    // Validate Supabase client
    if (!supabase || typeof supabase.rpc !== 'function') {
      console.warn('Invalid Supabase client in calculateCost, using estimate');
      return estimateCost(provider, model, promptTokens, completionTokens);
    }

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

    // Validate the returned cost
    const cost = data as number;
    if (typeof cost !== 'number' || isNaN(cost) || cost < 0) {
      console.warn(`Invalid cost returned from database: ${cost}`);
      return estimateCost(provider, model, promptTokens, completionTokens);
    }

    return cost;
  } catch (error) {
    console.error('Exception in calculateCost:', error);
    return estimateCost(provider, model, promptTokens, completionTokens);
  }
}

/**
 * Estimates cost based on token usage when the database function is unavailable
 * Enhanced with additional model pricing and better validation
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
  // Validate inputs
  if (promptTokens < 0) promptTokens = 0;
  if (completionTokens < 0) completionTokens = 0;

  // Default pricing (per 1K tokens)
  const pricing: Record<string, { input: number; output: number }> = {
    // OpenAI models
    'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
    'gpt-4': { input: 0.03, output: 0.06 },
    'gpt-4-turbo': { input: 0.01, output: 0.03 },
    'gpt-4o': { input: 0.01, output: 0.03 },

    // Anthropic models
    'claude-3-opus': { input: 0.015, output: 0.075 },
    'claude-3-sonnet': { input: 0.003, output: 0.015 },
    'claude-3-haiku': { input: 0.00025, output: 0.00125 },

    // Mistral models
    'mistral-large': { input: 0.008, output: 0.024 },
    'mistral-medium': { input: 0.002, output: 0.006 },
    'mistral-small': { input: 0.0008, output: 0.0024 },

    // Google models
    'gemini-pro': { input: 0.00025, output: 0.00125 },
    'gemini-1.5-pro': { input: 0.0005, output: 0.0015 },
  };

  let modelKey = model.toLowerCase();

  // Normalize model names for pricing lookup
  if (modelKey.includes('gpt-3.5')) modelKey = 'gpt-3.5-turbo';
  if (modelKey.includes('gpt-4-turbo')) modelKey = 'gpt-4-turbo';
  if (modelKey.includes('gpt-4o')) modelKey = 'gpt-4o';
  if (modelKey.includes('claude-3-opus')) modelKey = 'claude-3-opus';
  if (modelKey.includes('claude-3-sonnet')) modelKey = 'claude-3-sonnet';
  if (modelKey.includes('claude-3-haiku')) modelKey = 'claude-3-haiku';

  // Get pricing for the model, or use GPT-3.5 Turbo as default
  const modelPricing = pricing[modelKey] ||
    pricing['gpt-3.5-turbo'] || { input: 0.0015, output: 0.002 };

  // Calculate cost
  const inputCost = (promptTokens / 1000) * modelPricing.input;
  const outputCost = (completionTokens / 1000) * modelPricing.output;

  // Add 10% markup (matching our database configuration)
  return (inputCost + outputCost) * 1.1;
}

/**
 * Checks if user has exceeded usage limits
 * Enhanced with better error handling and validation
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
  // Validate inputs
  if (!userId && !teamId) return false;

  const entityType = userId ? 'user' : 'team';
  const entityId = userId || teamId;

  if (!entityId) return false;

  try {
    // Validate Supabase client
    if (!supabase || typeof supabase.rpc !== 'function') {
      console.warn('Invalid Supabase client in checkUsageLimits');
      return false;
    }

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
    } catch (rpcError) {
      console.error('Exception in RPC call to check usage limits:', rpcError);
      return false;
    }
  } catch (error) {
    console.error('Fatal error in checkUsageLimits:', error);
    return false;
  }
}
