import { getAIGatewayConfig } from '../config/ai-gateway.config';
import type { AIProvider, AIProviderClient } from '../types';
import { AnthropicProvider } from './anthropic';
import { GoogleAIProvider } from './google-ai';
import { GroqProvider } from './groq';
import { OpenAIProvider } from './openai';
import { OpenRouterProvider } from './openrouter';

const providers = new Map<AIProvider, AIProviderClient>();

export const getAIProvider = (provider?: AIProvider): AIProviderClient => {
  const config = getAIGatewayConfig();
  const selectedProvider = provider || config.defaultProvider;

  // Return cached provider if available
  const cachedProvider = providers.get(selectedProvider);
  if (cachedProvider) {
    return cachedProvider;
  }

  // Create new provider instance
  let newProvider: AIProviderClient;
  switch (selectedProvider) {
    case 'openai':
      newProvider = new OpenAIProvider();
      break;
    case 'groq':
      newProvider = new GroqProvider();
      break;
    case 'anthropic':
      newProvider = new AnthropicProvider();
      break;
    case 'google-ai':
      newProvider = new GoogleAIProvider();
      break;
    case 'openrouter':
      newProvider = new OpenRouterProvider();
      break;
    default:
      throw new Error(`Unsupported AI provider: ${selectedProvider}`);
  }

  // Cache the provider instance
  providers.set(selectedProvider, newProvider);
  return newProvider;
};
