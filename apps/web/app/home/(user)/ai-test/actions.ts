'use server';

import {
  type ChatCompletionOptions,
  type ChatMessage,
  getChatCompletion,
} from '@kit/ai-gateway';
import { ConfigManager } from '@kit/ai-gateway/src/configs/manager';
import {
  basicConfig,
  costOptimizedConfig,
  fallbackConfig,
  loadBalanceConfig,
  reliableConfig,
} from '@kit/ai-gateway/src/configs/templates';
import { type Config } from '@kit/ai-gateway/src/configs/types';

export type AIResponse = {
  message: string | null;
  error: string | null;
  configType?: string;
};

const testMessages: ChatMessage[] = [
  {
    role: 'system',
    content: 'You are a helpful assistant.',
  },
  {
    role: 'user',
    content: 'Hello! Please provide a brief response to test the integration.',
  },
];

export type ConfigType =
  | 'basic'
  | 'loadBalance'
  | 'fallback'
  | 'reliable'
  | 'costOptimized';

function getConfigForType(type: ConfigType): Config {
  switch (type) {
    case 'basic':
      return basicConfig;
    case 'loadBalance':
      return loadBalanceConfig;
    case 'fallback':
      return fallbackConfig;
    case 'reliable':
      return reliableConfig;
    case 'costOptimized':
      return costOptimizedConfig;
    default:
      return basicConfig;
  }
}

export async function testAI(
  state: AIResponse,
  formData: FormData,
): Promise<AIResponse> {
  const configType = formData.get('configType') as ConfigType;

  if (!configType) {
    return {
      message: null,
      error: 'Config type is required',
      configType: undefined,
    };
  }

  try {
    const config = getConfigForType(configType);
    const normalizedConfig = ConfigManager.normalizeConfig(config);

    if (!normalizedConfig) {
      throw new Error('Failed to normalize config');
    }

    const response = await getChatCompletion(testMessages, {
      config: normalizedConfig,
    } as ChatCompletionOptions);

    return {
      message: response,
      error: null,
      configType,
    };
  } catch (err) {
    console.error('Error testing AI:', err);
    return {
      message: null,
      error: err instanceof Error ? err.message : 'An error occurred',
      configType,
    };
  }
}
