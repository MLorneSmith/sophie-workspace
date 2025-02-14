'use server';

import { type ChatMessage, getChatCompletion } from '../index';

export type AIResponse = {
  message: string | null;
  error: string | null;
};

/**
 * Example server action that uses the AI Gateway to generate a response.
 * This demonstrates:
 * 1. Server-side only execution
 * 2. Proper error handling
 * 3. Type-safe responses
 */
export async function generateAIResponse(
  state: AIResponse,
): Promise<AIResponse> {
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: 'You are a helpful assistant.',
    },
    {
      role: 'user',
      content:
        'Hello! Please provide a brief response to test the integration.',
    },
  ];

  try {
    const response = await getChatCompletion(messages);
    return { message: response, error: null };
  } catch (err) {
    console.error('Error generating AI response:', err);
    return {
      message: null,
      error: err instanceof Error ? err.message : 'An error occurred',
    };
  }
}
