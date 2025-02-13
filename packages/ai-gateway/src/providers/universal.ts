import type {
  AICompletionOptions,
  AICompletionResponse,
  AIMessage,
  AIProviderClient,
} from '../types';

export class UniversalProvider implements AIProviderClient {
  async complete(options: AICompletionOptions): Promise<AICompletionResponse> {
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: options.messages,
          model: options.model,
          provider: options.provider,
          temperature: options.temperature,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          `AI Gateway Error: ${error.message || 'Unknown error'}`,
        );
      }

      const data = await response.json();
      return {
        content: data.choices[0]?.message?.content || '',
        model: options.model,
        provider: 'universal',
      };
    } catch (error) {
      console.error('AI Gateway Error:', error);
      throw error;
    }
  }

  async *streamComplete(
    options: AICompletionOptions,
  ): AsyncIterable<AICompletionResponse> {
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: options.messages,
          model: options.model,
          provider: options.provider,
          temperature: options.temperature,
          stream: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          `AI Gateway Error: ${error.message || 'Unknown error'}`,
        );
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean);

        for (const line of lines) {
          if (line === 'data: [DONE]') continue;
          if (!line.startsWith('data: ')) continue;

          try {
            const data = JSON.parse(line.slice(6));
            const content = data.choices[0]?.delta?.content;
            if (content) {
              yield {
                content,
                model: options.model,
                provider: 'universal',
              };
            }
          } catch (e) {
            console.error('Error parsing SSE message:', e);
          }
        }
      }
    } catch (error) {
      console.error('AI Gateway Error:', error);
      throw error;
    }
  }
}
