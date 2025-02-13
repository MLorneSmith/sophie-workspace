import Anthropic from '@anthropic-ai/sdk';

import { getProviderConfig } from '../config/ai-gateway.config';
import type {
  AICompletionOptions,
  AICompletionResponse,
  AIMessage,
  AIProviderClient,
  AnthropicMessage,
} from '../types';

export class AnthropicProvider implements AIProviderClient {
  private client: Anthropic;

  constructor() {
    const config = getProviderConfig('anthropic');
    this.client = new Anthropic({
      baseURL: config.baseURL,
      defaultHeaders: config.headers,
    });
  }

  private convertToAnthropicMessages(
    messages: AIMessage[],
  ): AnthropicMessage[] {
    // Anthropic doesn't support system messages directly, so we'll prepend them to the first user message
    let systemMessage = '';
    const convertedMessages: AnthropicMessage[] = [];

    for (const msg of messages) {
      if (msg.role === 'system') {
        systemMessage += msg.content + '\n';
      } else {
        if (msg.role === 'user' && systemMessage) {
          convertedMessages.push({
            role: 'user',
            content: systemMessage + msg.content,
          });
          systemMessage = ''; // Clear system message after using it
        } else {
          convertedMessages.push({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.content,
          });
        }
      }
    }

    return convertedMessages;
  }

  async complete(options: AICompletionOptions): Promise<AICompletionResponse> {
    const messages = this.convertToAnthropicMessages(options.messages);
    const response = await this.client.messages.create({
      model: options.model,
      messages,
      temperature: options.temperature,
      max_tokens: options.maxTokens,
      stream: false,
    });

    return {
      content: response.content[0].text,
      model: options.model,
      provider: 'anthropic',
    };
  }

  async *streamComplete(
    options: AICompletionOptions,
  ): AsyncIterable<AICompletionResponse> {
    const messages = this.convertToAnthropicMessages(options.messages);
    const stream = await this.client.messages.create({
      model: options.model,
      messages,
      temperature: options.temperature,
      max_tokens: options.maxTokens,
      stream: true,
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.text) {
        yield {
          content: chunk.delta.text,
          model: options.model,
          provider: 'anthropic',
        };
      }
    }
  }
}
