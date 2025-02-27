'use server';

import {
  type ChatCompletionOptions,
  type ChatMessage,
  getChatCompletion,
} from '@kit/ai-gateway';
import { ConfigManager } from '@kit/ai-gateway/src/configs/config-manager';
import {
  createBalancedOptimizedConfig,
  createQualityOptimizedConfig,
  createReasoningOptimizedConfig,
  createSpeedOptimizedConfig,
} from '@kit/ai-gateway/src/configs/templates';
import { type Config } from '@kit/ai-gateway/src/configs/types';
import outlineGenerationConfig from '@kit/ai-gateway/src/configs/use-cases/outline-generation/config';
import { PromptManager } from '@kit/ai-gateway/src/prompts/prompt-manager';

export type AIResponse = {
  message: string | null;
  error: string | null;
  configType?: string;
  testType?: string;
};

export type ConfigType =
  | 'speedOptimized'
  | 'qualityOptimized'
  | 'reasoningOptimized'
  | 'balancedOptimized'
  | 'outlineGeneration';

export type TestType = 'simple' | 'outline';

const simpleTestMessages: ChatMessage[] = [
  {
    role: 'system',
    content: 'You are a helpful assistant.',
  },
  {
    role: 'user',
    content: 'Hello! Please provide a brief response to test the integration.',
  },
];

function getConfigForType(type: ConfigType): Config {
  // Create namespace options for cache isolation
  const namespaceOptions = {
    userId: 'test-user', // TODO: Get from auth context
  };

  switch (type) {
    case 'speedOptimized':
      return createSpeedOptimizedConfig(namespaceOptions);
    case 'qualityOptimized':
      return createQualityOptimizedConfig(namespaceOptions);
    case 'reasoningOptimized':
      return createReasoningOptimizedConfig(namespaceOptions);
    case 'balancedOptimized':
      return createBalancedOptimizedConfig(namespaceOptions);
    case 'outlineGeneration':
      return outlineGenerationConfig;
    default:
      return createBalancedOptimizedConfig(namespaceOptions);
  }
}

function getTestMessages(
  testType: TestType,
  formData: FormData,
): ChatMessage[] {
  let messages: ChatMessage[];

  switch (testType) {
    case 'outline':
      // Load the message-based template
      messages = PromptManager.loadTemplate('test-outline');

      // Compile each message's content
      return messages.map((message: ChatMessage) => ({
        ...message,
        content: PromptManager.compile(message.content, {
          topic: (formData.get('topic') as string) || 'AI Technology',
          presentation_goal: 'Technical Overview',
          target_audience: 'Technical Team',
          duration: '30',
          tone: 'professional',
          specific_requirements:
            'include technical details and implementation considerations',
          context: 'Team planning session',
        }),
      }));

    case 'simple':
    default:
      return simpleTestMessages;
  }
}

export async function testAI(
  state: AIResponse,
  formData: FormData,
): Promise<AIResponse> {
  const configType = formData.get('configType') as ConfigType;
  const testType = (formData.get('testType') as TestType) || 'simple';

  if (!configType) {
    return {
      message: null,
      error: 'Config type is required',
      configType: undefined,
      testType,
    };
  }

  try {
    const config = getConfigForType(configType);
    const normalizedConfig = ConfigManager.normalizeConfig(config);

    if (!normalizedConfig) {
      throw new Error('Failed to normalize config');
    }

    const messages = getTestMessages(testType, formData);
    const response = await getChatCompletion(messages, {
      config: normalizedConfig,
    } as ChatCompletionOptions);

    return {
      message: response,
      error: null,
      configType,
      testType,
    };
  } catch (err) {
    console.error('Error testing AI:', err);
    return {
      message: null,
      error: err instanceof Error ? err.message : 'An error occurred',
      configType,
      testType,
    };
  }
}
