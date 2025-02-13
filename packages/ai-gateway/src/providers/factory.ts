import { type AIProvider, type AIProviderClient } from '../types';
import { AnthropicProvider } from './anthropic';
import { GoogleAIProvider } from './google-ai';
import { GroqProvider } from './groq';
import { OpenAIProvider } from './openai';
import { OpenRouterProvider } from './openrouter';
import { UniversalProvider } from './universal';

export function getAIProvider(provider?: AIProvider): AIProviderClient {
  switch (provider) {
    case 'openai':
      return new OpenAIProvider();
    case 'anthropic':
      return new AnthropicProvider();
    case 'google-ai':
      return new GoogleAIProvider();
    case 'groq':
      return new GroqProvider();
    case 'openrouter':
      return new OpenRouterProvider();
    case 'universal':
      return new UniversalProvider();
    default:
      // Default to universal provider if none specified
      return new UniversalProvider();
  }
}
