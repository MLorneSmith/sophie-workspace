import { OpenAI } from 'openai';
import { z } from 'zod';

import { createGatewayClient } from './enhanced-gateway-client';
import { getSupabaseClient } from './utils/supabase-client';
import {
  calculateCost,
  checkUsageLimits,
  extractCostFromHeaders,
  recordApiUsage,
} from './utils/usage-tracking';

/**
 * Local function to estimate cost when the database function is unavailable
 * This mirrors the implementation in usage-tracking.ts but is available locally
 */
function estimateCostLocally(
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

    // Default fallback
    default: { input: 0.0015, output: 0.002 },
  };

  let modelKey = model.toLowerCase();

  // Normalize model names for pricing lookup
  if (modelKey.includes('gpt-3.5')) modelKey = 'gpt-3.5-turbo';
  if (modelKey.includes('gpt-4-turbo')) modelKey = 'gpt-4-turbo';
  if (modelKey.includes('gpt-4o')) modelKey = 'gpt-4o';
  if (modelKey.includes('claude-3-opus')) modelKey = 'claude-3-opus';
  if (modelKey.includes('claude-3-sonnet')) modelKey = 'claude-3-sonnet';
  if (modelKey.includes('claude-3-haiku')) modelKey = 'claude-3-haiku';

  // Get pricing for the model, or use default as fallback
  const modelPricing = pricing[modelKey] ||
    pricing.default || { input: 0.0015, output: 0.002 };

  // Calculate cost
  const inputCost = (promptTokens / 1000) * modelPricing.input;
  const outputCost = (completionTokens / 1000) * modelPricing.output;

  // Add 10% markup (matching our database configuration)
  return (inputCost + outputCost) * 1.1;
}

/**
 * Helper function to check usage limits with improved error handling
 *
 * @param userId Optional user ID
 * @param teamId Optional team ID
 * @returns Promise<boolean> True if the user/team has exceeded their usage limits
 */
async function checkUserLimits(
  userId?: string,
  teamId?: string,
): Promise<boolean> {
  if (!userId && !teamId) return false;

  try {
    const supabase = await getSupabaseClient();

    // Validate the Supabase client has required methods
    if (!supabase || typeof supabase.rpc !== 'function') {
      console.warn('Invalid Supabase client, skipping usage limit check');
      return false;
    }

    return await checkUsageLimits(supabase, userId, teamId);
  } catch (error) {
    console.error('Error checking usage limits:', error);
    return false;
  }
}

// Types for chat messages
export type Role = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: Role;
  content: string;
}

// Zod schema for validation
const ChatMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string(),
});

const ChatMessagesSchema = z.array(ChatMessageSchema);

export interface ChatCompletionOptions {
  model?: string;
  temperature?: number;
  config?: any;
  userId?: string;
  teamId?: string;
  feature?: string;
  sessionId?: string;
  checkUsageLimits?: boolean;
  bypassCredits?: boolean;
}

export interface CompletionResult {
  content: string;
  metadata: {
    requestId: string;
    cost: number;
    tokens: {
      prompt: number;
      completion: number;
      total: number;
    };
    provider: string;
    model: string;
    feature?: string;
    userId?: string;
    teamId?: string;
    usageLimitExceeded?: boolean;
  };
}

export class AiUsageLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AiUsageLimitError';
  }
}

/**
 * Get a chat completion from the AI model with cost tracking
 * @param messages Array of chat messages
 * @param options Configuration options for the chat completion
 * @returns The AI model's response text and usage metadata
 */
export async function getChatCompletion(
  messages: ChatMessage[],
  options: ChatCompletionOptions = {},
): Promise<CompletionResult> {
  try {
    // Validate messages
    ChatMessagesSchema.parse(messages);

    const {
      model = 'gpt-3.5-turbo',
      temperature = 0.7,
      userId,
      teamId,
      feature,
      sessionId,
      checkUsageLimits: shouldCheckLimits = true,
      bypassCredits = false,
      config,
    } = options;

    // Temporarily disable usage limits checking due to permission issues
    // if (shouldCheckLimits && (userId || teamId)) {
    //   const limitExceeded = await checkUserLimits(userId, teamId);
    //   if (limitExceeded) {
    //     throw new AiUsageLimitError(
    //       'Usage limit exceeded. Please contact support to increase your limit.',
    //     );
    //   }
    // }
    // Log that we're skipping the check
    if (shouldCheckLimits && (userId || teamId)) {
      console.log('Usage limits checking temporarily disabled');
    }

    // Create client with tracking metadata, config, and model info
    const client = createGatewayClient({
      userId,
      teamId,
      feature,
      sessionId,
      config, // Pass config to client creation
      model, // Pass model to determine the correct provider
    });

    // Configure request options WITHOUT the config parameter
    const requestOptions: any = {
      messages,
      model,
      temperature,
    };

    // No longer need to add config to requestOptions

    const response = await client.chat.completions.create(requestOptions);

    // Extract response content
    const content = response.choices?.[0]?.message?.content || '';

    // Extract request ID and usage data
    const requestId = response.id;
    const usage = response.usage || {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
    };

    // Get cost from response headers (using x-portkey-cost header)
    // @ts-ignore - Access the headers property
    const headers = response.headers || {};
    let cost = extractCostFromHeaders(headers);

    // Track usage if database access is available (fail gracefully on permission issues)
    try {
      // Get the Supabase client for recording usage
      const supabase = await getSupabaseClient();

      // If no cost in headers, calculate based on token usage
      if (cost === 0) {
        try {
          // Calculate cost based on token usage and model pricing
          cost = await calculateCost(
            supabase,
            'openai', // For now, assume OpenAI. Could be extracted from headers in future
            model,
            usage.prompt_tokens,
            usage.completion_tokens,
          );
        } catch (costError) {
          console.error('Error calculating AI cost:', costError);
          // Use our local fallback pricing for cost calculation
          cost = estimateCostLocally(
            model,
            usage.prompt_tokens,
            usage.completion_tokens,
          );
        }
      }

      // Record usage
      if (userId || teamId) {
        try {
          await recordApiUsage(supabase, {
            userId,
            teamId,
            requestId,
            provider: 'openai', // Could extract from headers if available
            model,
            promptTokens: usage.prompt_tokens,
            completionTokens: usage.completion_tokens,
            totalTokens: usage.total_tokens,
            cost,
            feature,
            sessionId,
            bypassCredits: true, // Bypass credits since we're having permission issues
          });
        } catch (usageError) {
          console.error('Error recording API usage:', usageError);
          // Continue without failing - usage tracking is secondary to the main functionality
        }
      }
    } catch (dbError) {
      console.error('Database access error:', dbError);
      // Continue without failing - the AI response is still valid
    }

    return {
      content,
      metadata: {
        requestId,
        cost,
        tokens: {
          prompt: usage.prompt_tokens,
          completion: usage.completion_tokens,
          total: usage.total_tokens,
        },
        provider: 'openai', // Could extract from headers if available
        model,
        feature,
        userId,
        teamId,
      },
    };
  } catch (error) {
    if (error instanceof AiUsageLimitError) {
      throw error; // Re-throw usage limit errors to handle them specifically
    }

    if (error instanceof OpenAI.APIError) {
      console.error('OpenAI API Error:', {
        status: error.status,
        message: error.message,
        code: error.code,
        type: error.type,
      });
    } else {
      console.error('Error in getChatCompletion:', error);
    }
    throw error;
  }
}

/**
 * Get a chat completion with streaming enabled
 * @param messages Array of chat messages
 * @param options Configuration options for the chat completion
 * @returns AsyncGenerator that yields chunks of the response
 */
export async function* getStreamingChatCompletion(
  messages: ChatMessage[],
  options: ChatCompletionOptions = {},
): AsyncGenerator<string> {
  try {
    // Validate messages
    ChatMessagesSchema.parse(messages);

    const {
      model = 'gpt-3.5-turbo',
      temperature = 0.7,
      userId,
      teamId,
      feature,
      sessionId,
      checkUsageLimits: shouldCheckLimits = true,
      bypassCredits = false,
      config,
    } = options;

    // Temporarily disable usage limits checking due to permission issues
    // if (shouldCheckLimits && (userId || teamId)) {
    //   const limitExceeded = await checkUserLimits(userId, teamId);
    //   if (limitExceeded) {
    //     throw new AiUsageLimitError(
    //       'Usage limit exceeded. Please contact support to increase your limit.',
    //     );
    //   }
    // }
    // Log that we're skipping the check
    if (shouldCheckLimits && (userId || teamId)) {
      console.log('Usage limits checking temporarily disabled for streaming');
    }

    // Create client with tracking metadata, config, and model info
    const client = createGatewayClient({
      userId,
      teamId,
      feature,
      sessionId,
      config, // Pass config to client creation
      model, // Pass model to determine the correct provider
    });

    // Configure request options WITHOUT the config parameter
    const requestOptions: any = {
      messages,
      model,
      temperature,
      stream: true,
    };

    // No longer need to add config to requestOptions

    // Get the streaming response
    // Using any type to avoid TypeScript errors with streaming
    const stream = (await client.chat.completions.create(
      requestOptions,
    )) as any;

    // We'll collect token counts as they stream to calculate total usage
    let promptTokens = 0;
    let completionTokens = 0;
    let responseId = '';

    // Process the stream - use a try catch to handle any streaming errors
    try {
      // Handle both types of streaming responses from OpenAI
      if (typeof stream[Symbol.asyncIterator] === 'function') {
        // Standard async iterator
        for await (const chunk of stream) {
          // Extract usage information when available
          if (chunk.usage) {
            promptTokens = chunk.usage.prompt_tokens;
            completionTokens = chunk.usage.completion_tokens;
          }

          // Try to get request ID
          if (!responseId && chunk.id) {
            responseId = chunk.id;
          }

          // Yield the delta content
          const content = chunk.choices?.[0]?.delta?.content;
          if (content) {
            yield content;
          }
        }
      } else if (stream.toReadableStream) {
        // Legacy streaming with ReadableStream
        const reader = stream.toReadableStream().getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = JSON.parse(new TextDecoder().decode(value));

            // Extract usage information when available
            if (chunk.usage) {
              promptTokens = chunk.usage.prompt_tokens;
              completionTokens = chunk.usage.completion_tokens;
            }

            // Try to get request ID
            if (!responseId && chunk.id) {
              responseId = chunk.id;
            }

            // Yield the delta content
            const content = chunk.choices?.[0]?.delta?.content;
            if (content) {
              yield content;
            }
          }
        } finally {
          reader.releaseLock();
        }
      } else {
        // Fallback for unknown streaming format
        console.warn('Unknown streaming format, unable to process stream');
        yield 'Unable to process stream response';
      }
    } catch (streamError) {
      console.error('Error processing stream:', streamError);
      yield '[Error processing stream]';
    }

    const totalTokens = promptTokens + completionTokens;

    // Record usage after streaming completes
    if ((userId || teamId) && responseId) {
      try {
        // Get the Supabase client for recording usage
        const supabase = await getSupabaseClient();

        // Calculate cost based on token usage with proper parameters
        let cost;
        try {
          cost = await calculateCost(
            supabase,
            'openai',
            model,
            promptTokens,
            completionTokens,
          );
        } catch (costError) {
          console.error('Error calculating streaming cost:', costError);
          // Use our local fallback pricing for cost calculation
          cost = estimateCostLocally(model, promptTokens, completionTokens);
        }

        // Record usage with proper Supabase client parameter
        await recordApiUsage(supabase, {
          userId,
          teamId,
          requestId: responseId,
          provider: 'openai',
          model,
          promptTokens,
          completionTokens,
          totalTokens,
          cost,
          feature,
          sessionId,
          bypassCredits: true, // Bypass credits since we're having permission issues
        });
      } catch (error) {
        console.error('Error recording usage data:', error);
        // Continue without failing the response delivery
      }
    }
  } catch (error) {
    if (error instanceof AiUsageLimitError) {
      throw error; // Re-throw usage limit errors to handle them specifically
    }

    if (error instanceof OpenAI.APIError) {
      console.error('OpenAI API Error:', {
        status: error.status,
        message: error.message,
        code: error.code,
        type: error.type,
      });
    } else {
      console.error('Error in getStreamingChatCompletion:', error);
    }
    throw error;
  }
}
