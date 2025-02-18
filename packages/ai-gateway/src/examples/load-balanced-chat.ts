import { ConfigManager } from '../configs/manager';
import { loadBalanceConfig } from '../configs/templates';
import {
  type ChatCompletionOptions,
  type ChatMessage,
  getChatCompletion,
} from '../index';

async function loadBalancedChatExample() {
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: 'You are a helpful assistant.',
    },
    {
      role: 'user',
      content: 'Explain quantum computing in simple terms.',
    },
  ];

  try {
    // Use the load balance config template which distributes traffic
    // between GPT-3.5 and GPT-4 based on weights
    const config = ConfigManager.normalizeConfig(loadBalanceConfig);

    const options: ChatCompletionOptions = {
      config,
    } as ChatCompletionOptions;

    const response = await getChatCompletion(messages, options);

    console.log('Response:', response);
  } catch (error) {
    console.error('Error:', error);
  }
}

export { loadBalancedChatExample };
