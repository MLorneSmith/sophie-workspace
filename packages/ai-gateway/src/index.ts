import { OpenAI } from 'openai';
import { z } from 'zod';

// Mock function for the Supabase client to resolve TypeScript errors
// Will be replaced with actual implementation when integrated with the app

import { createGatewayClient } from './enhanced-gateway-client';
import {
  calculateCost,
  checkUsageLimits,
  extractCostFromHeaders,
  recordApiUsage,
} from './utils/usage-tracking';

// Simple wrapper around getSupabaseServerClient for usage in this module
async function getSupabaseClient() {
  try {
    // Import dynamically to avoid circular dependencies
    return getSupabaseServerClient();
  } catch (error) {
    console.error('Error getting Supabase client:', error);
    // Return a mock client for environments where Supabase isn't available
    return {
      from: () => ({
        insert: () => ({
          select: () => ({ single: () => ({ data: null, error: null }) }),
        }),
      }),
      rpc: () => ({ data: null, error: null }),
    };
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

    // Check usage limits if required
    if (shouldCheckLimits && (userId || teamId)) {
      const limitExceeded = await checkUsageLimits(userId, teamId);
      if (limitExceeded) {
        throw new AiUsageLimitError(
          'Usage limit exceeded. Please contact support to increase your limit.',
        );
      }
    }

    // Create client with tracking metadata
    const client = createGatewayClient({
      userId,
      teamId,
      feature,
      sessionId,
    });

    // Use the config object if provided
    const requestOptions: any = {
      messages,
      model,
      temperature,
    };

    if (config) {
      requestOptions.config = config;
    }

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

    // Get the Supabase client for recording usage
    const supabase = await getSupabaseClient();

    // If no cost in headers, calculate based on token usage
    if (cost === 0) {
      // Calculate cost based on token usage and model pricing
      cost = await calculateCost(
        supabase,
        'openai', // For now, assume OpenAI. Could be extracted from headers in future
        model,
        usage.prompt_tokens,
        usage.completion_tokens,
      );
    }

    // Record usage
    if (userId || teamId) {
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
        bypassCredits,
      });
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

    // Check usage limits if required
    if (shouldCheckLimits && (userId || teamId)) {
      const limitExceeded = await checkUsageLimits(userId, teamId);
      if (limitExceeded) {
        throw new AiUsageLimitError(
          'Usage limit exceeded. Please contact support to increase your limit.',
        );
      }
    }

    // Create client with tracking metadata
    const client = createGatewayClient({
      userId,
      teamId,
      feature,
      sessionId,
    });

    // Use the config object if provided
    const requestOptions: any = {
      messages,
      model,
      temperature,
      stream: true,
    };

    if (config) {
      requestOptions.config = config;
    }

    // Get the streaming response
    const stream = await client.chat.completions.create(requestOptions);

    // We'll collect token counts as they stream to calculate total usage
    let promptTokens = 0;
    let completionTokens = 0;
    let responseId = '';

    // Process the stream
    for await (const chunk of stream) {
      // Extract usage information from chunk when available
      if (chunk.usage) {
        promptTokens = chunk.usage.prompt_tokens;
        completionTokens = chunk.usage.completion_tokens;
      }

      // Try to get request ID
      if (!responseId && chunk.id) {
        responseId = chunk.id;
      }

      // Yield the delta content
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }

    const totalTokens = promptTokens + completionTokens;

    // Record usage after streaming completes
    if ((userId || teamId) && responseId) {
      // Calculate cost based on token usage
      const cost = await calculateCost(
        'openai',
        model,
        promptTokens,
        completionTokens,
      );

      await recordApiUsage({
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
        bypassCredits,
      });
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
