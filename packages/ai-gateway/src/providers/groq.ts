import OpenAI from 'openai';

import { getProviderConfig } from '../config/ai-gateway.config';
import type {
  AICompletionOptions,
  AICompletionResponse,
  AIMessage,
  AIProviderClient,
  GroqMessage,
} from '../types';

export class GroqProvider implements AIProviderClient {
  private client: OpenAI;

  constructor() {
    const config = getProviderConfig('groq');
    this.client = new OpenAI({
      baseURL: config.baseURL,
      defaultHeaders: config.headers,
    });
  }

  private convertToGroqMessages(messages: AIMessage[]): GroqMessage[] {
    return messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));
  }

  async complete(options: AICompletionOptions): Promise<AICompletionResponse> {
    // Groq uses OpenAI-compatible API, so we can use the OpenAI client
    const response = await this.client.chat.completions.create({
      model:
        options.model === 'mixtral-8x7b' ? 'mixtral-8x7b-32768' : options.model,
      messages: this.convertToGroqMessages(options.messages),
      temperature: options.temperature,
      max_tokens: options.maxTokens,
      stream: false,
    });

    return {
      content: response.choices[0]?.message?.content || '',
      model: options.model,
      provider: 'groq',
    };
  }

  async *streamComplete(
    options: AICompletionOptions,
  ): AsyncIterable<AICompletionResponse> {
    const stream = await this.client.chat.completions.create({
      model:
        options.model === 'mixtral-8x7b' ? 'mixtral-8x7b-32768' : options.model,
      messages: this.convertToGroqMessages(options.messages),
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
          provider: 'groq',
        };
      }
    }
  }
}
