import { OpenAI } from 'openai';
import { z } from 'zod';

import openai from './config';

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
}

/**
 * Get a chat completion from the AI model
 * @param messages Array of chat messages
 * @param options Configuration options for the chat completion
 * @returns The AI model's response text
 */
export async function getChatCompletion(
  messages: ChatMessage[],
  options: ChatCompletionOptions = {},
): Promise<string> {
  try {
    // Validate messages
    ChatMessagesSchema.parse(messages);

    const { model = 'gpt-3.5-turbo', temperature = 0.7 } = options;

    const response = await openai.chat.completions.create({
      messages,
      model,
      temperature,
    });

    if (!response.choices?.[0]?.message?.content) {
      throw new Error('No response content received from AI model');
    }

    return response.choices[0].message.content;
  } catch (error) {
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

    const { model = 'gpt-3.5-turbo', temperature = 0.7 } = options;

    const stream = await openai.chat.completions.create({
      messages,
      model,
      temperature,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  } catch (error) {
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
