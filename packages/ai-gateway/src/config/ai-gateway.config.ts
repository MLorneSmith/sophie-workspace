import { z } from 'zod';

import type { AIGatewayConfig, AIModel, AIProvider } from '../types';

const envSchema = z.object({
  // Cloudflare AI Gateway Configuration
  CLOUDFLARE_ACCOUNT_ID: z.string().min(1),
  CLOUDFLARE_GATEWAY_ID: z.string().min(1),
  CLOUDFLARE_API_TOKEN: z.string().min(1),

  // Provider API Keys
  OPENAI_API_KEY: z.string().min(1),
  GROQ_API_KEY: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().min(1),
  GOOGLE_AI_API_KEY: z.string().min(1),
  OPENROUTER_API_KEY: z.string().min(1),

  // Default Configuration
  DEFAULT_AI_PROVIDER: z
    .enum(['openai', 'groq', 'anthropic', 'google-ai', 'openrouter'])
    .default('openai'),
  DEFAULT_AI_MODEL: z
    .enum([
      // OpenAI Models
      'gpt-4',
      'gpt-4-32k',
      'gpt-4-turbo',
      'gpt-3.5-turbo',
      'gpt-3.5-turbo-16k',
      // Anthropic Models
      'claude-3-opus',
      'claude-3-sonnet',
      'claude-3-haiku',
      // Google AI Models
      'gemini-ultra',
      'gemini-pro',
      // Groq Models
      'mixtral-8x7b',
      'llama2-70b',
      // OpenRouter Models
      'openrouter/neural-chat',
      'openrouter/mistral-medium',
      'openrouter/mistral-large',
      'openrouter/claude-3-opus',
      'openrouter/claude-3-sonnet',
      'openrouter/gpt-4-turbo',
      'openrouter/gemini-pro',
      'openrouter/mixtral-8x7b',
    ])
    .default('gpt-4'),
});

export const getAIGatewayConfig = (): AIGatewayConfig => {
  const env = envSchema.parse({
    CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
    CLOUDFLARE_GATEWAY_ID: process.env.CLOUDFLARE_GATEWAY_ID,
    CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN,
    // Provider API Keys
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    GOOGLE_AI_API_KEY: process.env.GOOGLE_AI_API_KEY,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    // Default Configuration
    DEFAULT_AI_PROVIDER: process.env.DEFAULT_AI_PROVIDER,
    DEFAULT_AI_MODEL: process.env.DEFAULT_AI_MODEL,
  });

  return {
    accountId: env.CLOUDFLARE_ACCOUNT_ID,
    gatewayId: env.CLOUDFLARE_GATEWAY_ID,
    apiToken: env.CLOUDFLARE_API_TOKEN,
    defaultProvider: env.DEFAULT_AI_PROVIDER as AIProvider,
    defaultModel: env.DEFAULT_AI_MODEL as AIModel,
  };
};

export const getProviderConfig = (provider: AIProvider) => {
  const config = getAIGatewayConfig();
  const baseURL = `https://gateway.ai.cloudflare.com/v1/${config.accountId}/${config.gatewayId}/${provider}`;

  return {
    baseURL,
    headers: {
      'cf-aig-authorization': `Bearer ${config.apiToken}`,
    },
  };
};
