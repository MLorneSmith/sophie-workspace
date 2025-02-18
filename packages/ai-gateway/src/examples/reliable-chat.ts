import { ConfigManager } from '../configs/manager';
import { reliableConfig } from '../configs/templates';
import {
  type ChatCompletionOptions,
  type ChatMessage,
  getChatCompletion,
} from '../index';

async function reliableChatExample() {
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: 'You are a helpful assistant.',
    },
    {
      role: 'user',
      content: 'What are the benefits of semantic caching?',
    },
  ];

  try {
    // Use the reliable config template which includes semantic caching
    // and automatic retries for enhanced reliability
    const config = ConfigManager.normalizeConfig(reliableConfig);

    const options: ChatCompletionOptions = {
      config,
    } as ChatCompletionOptions;

    const response = await getChatCompletion(messages, options);

    console.log('Response:', response);
  } catch (error) {
    console.error('Error:', error);
  }
}

export { reliableChatExample };
