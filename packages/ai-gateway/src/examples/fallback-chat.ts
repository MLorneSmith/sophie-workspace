import { ConfigManager } from '../configs/manager';
import { fallbackConfig } from '../configs/templates';
import {
  type ChatCompletionOptions,
  type ChatMessage,
  getChatCompletion,
} from '../index';

async function fallbackChatExample() {
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: 'You are a helpful assistant.',
    },
    {
      role: 'user',
      content: 'Write a short story about resilience.',
    },
  ];

  try {
    // Use the fallback config template which automatically retries
    // with a backup model if the primary model fails
    const config = ConfigManager.normalizeConfig(fallbackConfig);

    const options: ChatCompletionOptions = {
      config,
    } as ChatCompletionOptions;

    const response = await getChatCompletion(messages, options);

    console.log('Response:', response);
  } catch (error) {
    console.error('Error:', error);
  }
}

export { fallbackChatExample };
