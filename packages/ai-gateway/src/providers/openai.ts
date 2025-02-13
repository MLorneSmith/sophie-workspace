import OpenAI from 'openai';

import { getProviderConfig } from '../config/ai-gateway.config';
import type {
  AICompletionOptions,
  AICompletionResponse,
  AIMessage,
  AIProviderClient,
  OpenAIMessage,
} from '../types';

export class OpenAIProvider implements AIProviderClient {
  private client: OpenAI;

  constructor() {
    const config = getProviderConfig('openai');
    this.client = new OpenAI({
      baseURL: config.baseURL,
      defaultHeaders: config.headers,
    });
  }

  private convertToOpenAIMessages(messages: AIMessage[]): OpenAIMessage[] {
    return messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));
  }

  async complete(options: AICompletionOptions): Promise<AICompletionResponse> {
    const response = await this.client.chat.completions.create({
      model: options.model,
      messages: this.convertToOpenAIMessages(options.messages),
      temperature: options.temperature,
      max_tokens: options.maxTokens,
      stream: false,
    });

    return {
      content: response.choices[0]?.message?.content || '',
      model: options.model,
      provider: 'openai',
    };
  }

  async *streamComplete(
    options: AICompletionOptions,
  ): AsyncIterable<AICompletionResponse> {
    const stream = await this.client.chat.completions.create({
      model: options.model,
      messages: this.convertToOpenAIMessages(options.messages),
      temperature: options.temperature,
      max_tokens: options.maxTokens,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield {
          content,
          model: options.model,
          provider: 'openai',
        };
      }
    }
  }
}
