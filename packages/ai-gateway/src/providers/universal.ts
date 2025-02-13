import type {
  AICompletionOptions,
  AICompletionResponse,
  AIGatewayProviderConfig,
  AIMessage,
  AIProviderClient,
  AIProviderConfig,
} from '../types';

export class UniversalProvider implements AIProviderClient {
  private accountId: string = '';
  private gatewayId: string = '';
  private apiToken: string = '';
  private groqApiKey: string = '';
  private baseURL: string = '';

  constructor(config?: AIGatewayProviderConfig) {
    if (config) {
      this.configure(config);
    }
  }

  configure(config: AIGatewayProviderConfig): void {
    this.accountId = config.accountId ?? '';
    this.gatewayId = config.gatewayId ?? '';
    this.apiToken = config.apiToken ?? '';
    this.groqApiKey = config.groqApiKey ?? '';
    this.baseURL = `https://gateway.ai.cloudflare.com/v1/${this.accountId}/${this.gatewayId}`;
  }

  private validateConfig() {
    if (!this.accountId || !this.gatewayId || !this.apiToken) {
      throw new Error('Missing required Cloudflare configuration');
    }
    if (!this.groqApiKey) {
      throw new Error('Missing required Groq API key');
    }
  }

  private createProviderConfig(
    options: AICompletionOptions,
  ): AIProviderConfig[] {
    this.validateConfig();
    const config: AIProviderConfig = {
      provider: options.provider ?? 'groq',
      endpoint: options.endpoint ?? 'chat/completions',
      headers: {
        Authorization: `Bearer ${this.groqApiKey}`,
        'Content-Type': 'application/json',
      },
      query: {
        messages: options.messages,
        model: options.model,
        temperature: options.temperature,
        stream: options.stream,
      },
    };

    return [config];
  }

  async complete(options: AICompletionOptions): Promise<AICompletionResponse> {
    try {
      const configs = this.createProviderConfig(options);

      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiToken}`,
        },
        body: JSON.stringify(configs),
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
      const configs = this.createProviderConfig({
        ...options,
        stream: true,
      });

      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiToken}`,
        },
        body: JSON.stringify(configs),
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
