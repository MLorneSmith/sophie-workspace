# Portkey AI Gateway Integration

## Overview

We use Portkey AI Gateway as an abstraction layer for AI service providers. This provides:

1. Unified API for multiple AI providers
2. Automatic provider selection based on model
3. Fallback mechanisms between providers
4. Caching and rate limiting
5. Usage tracking and cost management
6. Prompt management and versioning

## Architecture

We use OpenAI SDK with Portkey's proxy URL rather than Portkey's SDK directly. This gives us:
- Better TypeScript support
- Consistent API interface
- Custom header-based configuration

## Basic Usage

```tsx
import { createGatewayClient } from '@kit/ai-gateway';

async function generateContent(prompt: string) {
  // Client automatically selects provider based on model
  const client = createGatewayClient({
    model: 'gpt-4-turbo', // OpenAI provider
    // model: 'claude-3-opus-20240229', // Anthropic provider
    // model: 'llama-3-70b', // Groq provider
  });

  const response = await client.chat.completions.create({
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: prompt }
    ],
    model: 'gpt-4-turbo',
    max_tokens: 500,
  });
  
  return response.choices[0].message.content;
}
```

## Server Actions Integration

Always use server actions for AI calls:

```tsx
'use server';

import { createGatewayClient } from '@kit/ai-gateway';
import { enhanceAction } from '@kit/next/actions';
import { z } from 'zod';

export const generateContentAction = enhanceAction(
  async (data: { prompt: string }, user) => {
    const client = createGatewayClient({
      userId: user.id,
      model: 'gpt-4-turbo',
      feature: 'content-generation',
    });

    const response = await client.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: data.prompt }
      ],
      model: 'gpt-4-turbo',
      max_tokens: 500,
    });
    
    return response.choices[0].message.content;
  },
  {
    schema: z.object({
      prompt: z.string().min(1).max(1000),
    }),
  }
);
```

## Using getChatCompletion Helper

For simpler use cases, use the `getChatCompletion` helper:

```tsx
import { getChatCompletion } from '@kit/ai-gateway';

const result = await getChatCompletion(
  [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: prompt }
  ],
  {
    model: 'gpt-4-turbo',
    temperature: 0.7,
    userId: user.id,
    teamId: team.id,
    feature: 'chat-assistant',
  }
);

console.log(result.content);
console.log(result.metadata.cost); // Track costs
```

## Provider Auto-Selection

The gateway automatically selects the correct provider based on model name:

- `gpt-*` models → OpenAI
- `claude-*` models → Anthropic  
- `llama-*` models → Groq

## Configuration & Fallbacks

Pass Portkey configs for advanced features:

```tsx
const client = createGatewayClient({
  model: 'gpt-4-turbo',
  config: {
    strategy: {
      mode: 'fallback',
    },
    targets: [
      { provider: 'openai', model: 'gpt-4-turbo' },
      { provider: 'anthropic', model: 'claude-3-opus-20240229' }
    ]
  }
});
```

## Error Handling

The gateway includes built-in error handling and fallbacks:

```tsx
try {
  const result = await getChatCompletion(messages, {
    model: 'gpt-4-turbo',
    userId: user.id,
  });
  
  return result.content;
} catch (error) {
  if (error instanceof AiUsageLimitError) {
    // Handle usage limit exceeded
    return 'Usage limit exceeded. Please upgrade your plan.';
  }
  
  console.error('AI service error:', error);
  return 'Sorry, I was unable to generate content at this time.';
}
```

## Streaming Responses

Use streaming for better user experience:

```tsx
import { getStreamingChatCompletion } from '@kit/ai-gateway';

const stream = getStreamingChatCompletion(
  messages,
  { 
    model: 'gpt-4-turbo', 
    userId: user.id,
    feature: 'streaming-chat'
  }
);

for await (const chunk of stream) {
  // Process each chunk
  process.stdout.write(chunk);
}
```

## Usage Tracking

The gateway automatically tracks:
- User ID and Team ID for billing
- Feature name for cost attribution
- Session ID for request grouping
- Token usage and costs
- Request IDs for debugging

Tracked data includes:
- Prompt tokens
- Completion tokens
- Total cost calculation
- Provider and model used

## Environment Variables

Required:
- `PORTKEY_API_KEY` - Your Portkey API key
- `PORTKEY_VIRTUAL_KEY` - Virtual key for provider access
- `OPENAI_API_KEY` - OpenAI API key (can be empty with virtual keys)

Optional:
- `CHECK_AI_USAGE_LIMITS` - Enable usage limit checking (default: false)
- `BYPASS_AI_CREDITS` - Bypass credit deduction (default: true)
- `AI_USAGE_DEBUG` - Enable verbose debug logging (default: false)
- `INITIALIZE_DATABASE` - Initialize AI gateway database tables (default: true)