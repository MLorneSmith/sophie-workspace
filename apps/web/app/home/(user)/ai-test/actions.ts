'use server';

import { type ChatMessage, getChatCompletion } from '@kit/ai-gateway';

export type AIResponse = {
  message: string | null;
  error: string | null;
};

export async function testAI(state: AIResponse): Promise<AIResponse> {
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
    console.error('Error testing AI:', err);
    return {
      message: null,
      error: err instanceof Error ? err.message : 'An error occurred',
    };
  }
}
