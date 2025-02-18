import { ConfigManager } from '../configs/manager';
import { basicConfig } from '../configs/templates';
import {
  type ChatCompletionOptions,
  type ChatMessage,
  getChatCompletion,
} from '../index';

async function basicChatExample() {
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: 'You are a helpful assistant.',
    },
    {
      role: 'user',
      content: 'What is the capital of France?',
    },
  ];

  try {
    // Use the basic config template
    const config = ConfigManager.normalizeConfig(basicConfig);

    const options: ChatCompletionOptions = {
      config,
    } as ChatCompletionOptions;

    const response = await getChatCompletion(messages, options);

    console.log('Response:', response);
  } catch (error) {
    console.error('Error:', error);
  }
}

export { basicChatExample };
