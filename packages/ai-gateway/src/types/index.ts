import { type ChatCompletionCreateParams } from 'openai/resources/chat/completions';

export type OpenAIModel =
  | 'gpt-4'
  | 'gpt-4-32k'
  | 'gpt-4-turbo'
  | 'gpt-3.5-turbo'
  | 'gpt-3.5-turbo-16k';

export type AnthropicModel =
  | 'claude-3-opus'
  | 'claude-3-sonnet'
  | 'claude-3-haiku';

export type GoogleAIModel = 'gemini-ultra' | 'gemini-pro';

export type GroqModel = 'mixtral-8x7b' | 'llama2-70b';

export type OpenRouterModel =
  | 'openrouter/neural-chat'
  | 'openrouter/mistral-medium'
  | 'openrouter/mistral-large'
  | 'openrouter/claude-3-opus'
  | 'openrouter/claude-3-sonnet'
  | 'openrouter/gpt-4-turbo'
  | 'openrouter/gemini-pro'
  | 'openrouter/mixtral-8x7b';

export type AIModel =
  | OpenAIModel
  | AnthropicModel
  | GoogleAIModel
  | GroqModel
  | OpenRouterModel;

export type AIProvider =
  | 'openai'
  | 'anthropic'
  | 'google-ai'
  | 'groq'
  | 'openrouter'
  | 'universal';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AICompletionOptions {
  messages: AIMessage[];
  model: AIModel;
  provider?: AIProvider;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface AICompletionResponse {
  content: string;
  model: AIModel;
  provider: AIProvider;
}

export interface AIGatewayConfig {
  accountId: string;
  gatewayId: string;
  apiToken: string;
  defaultProvider: AIProvider;
  defaultModel: AIModel;
}

export interface AIProviderClient {
  complete(options: AICompletionOptions): Promise<AICompletionResponse>;
  streamComplete(
    options: AICompletionOptions,
  ): AsyncIterable<AICompletionResponse>;
}

export interface BaseMessage {
  role: string;
  content: string;
}

export type OpenAIMessage = ChatCompletionCreateParams['messages'][number];

export interface GroqMessage extends BaseMessage {
  role: 'system' | 'user' | 'assistant';
}

export interface AnthropicMessage extends BaseMessage {
  role: 'user' | 'assistant';
}

export interface GoogleAIMessage extends BaseMessage {
  role: 'user' | 'assistant';
}

export interface OpenRouterMessage extends BaseMessage {
  role: 'system' | 'user' | 'assistant';
}

// Provider-specific message types for internal use
export type ProviderMessage =
  | OpenAIMessage
  | GroqMessage
  | AnthropicMessage
  | GoogleAIMessage
  | OpenRouterMessage
  | AIMessage;
