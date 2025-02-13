import { GoogleGenerativeAI } from '@google/generative-ai';

import { getProviderConfig } from '../config/ai-gateway.config';
import type {
  AICompletionOptions,
  AICompletionResponse,
  AIMessage,
  AIProviderClient,
  GoogleAIMessage,
} from '../types';

export class GoogleAIProvider implements AIProviderClient {
  private client: GoogleGenerativeAI;

  constructor() {
    const config = getProviderConfig('google-ai');
    this.client = new GoogleGenerativeAI({
      baseURL: config.baseURL,
      headers: config.headers,
    });
  }

  private convertToGoogleAIMessages(messages: AIMessage[]): GoogleAIMessage[] {
    // Google AI doesn't support system messages directly
    // We'll combine system messages with the following user message
    let systemMessage = '';
    const convertedMessages: GoogleAIMessage[] = [];

    for (const msg of messages) {
      if (msg.role === 'system') {
        systemMessage += msg.content + '\n';
      } else {
        if (msg.role === 'user' && systemMessage) {
          convertedMessages.push({
            role: 'user',
            content: systemMessage + msg.content,
          });
          systemMessage = '';
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
    const messages = this.convertToGoogleAIMessages(options.messages);
    const model = this.client.getGenerativeModel({
      model: options.model,
      generationConfig: {
        temperature: options.temperature,
        maxOutputTokens: options.maxTokens,
      },
    });

    const chat = model.startChat({
      history: messages.map((msg) => ({
        role: msg.role,
        parts: [{ text: msg.content }],
      })),
    });

    const result = await chat.sendMessage('');

    return {
      content: result.response.text(),
      model: options.model,
      provider: 'google-ai',
    };
  }

  async *streamComplete(
    options: AICompletionOptions,
  ): AsyncIterable<AICompletionResponse> {
    const messages = this.convertToGoogleAIMessages(options.messages);
    const model = this.client.getGenerativeModel({
      model: options.model,
      generationConfig: {
        temperature: options.temperature,
        maxOutputTokens: options.maxTokens,
      },
    });

    const chat = model.startChat({
      history: messages.map((msg) => ({
        role: msg.role,
        parts: [{ text: msg.content }],
      })),
    });

    const result = await chat.sendMessageStream('');

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        yield {
          content: text,
          model: options.model,
          provider: 'google-ai',
        };
      }
    }
  }
}
