# Portkey AI Gateway Implementation

**Purpose**: This document provides a comprehensive guide to the Portkey AI Gateway implementation in SlideHeroes, covering architecture, configuration management, prompt systems, and best practices for secure, type-safe AI service integration with automatic provider selection, fallback mechanisms, and usage tracking.

## Overview

Our AI Gateway implementation provides a secure, type-safe abstraction layer for AI service providers with:

1. **Unified API** for multiple AI providers (OpenAI, Anthropic, Groq)
2. **Automatic provider selection** based on model
3. **Fallback mechanisms** between providers
4. **Caching and rate limiting** capabilities
5. **Usage tracking and cost management**
6. **Virtual keys system** for secure API key management
7. **Server-side only access** for enhanced security

## Architecture

### Key Implementation Choices

1. **OpenAI SDK with Portkey Configuration**
   - Uses OpenAI SDK configured with Portkey's proxy URL
   - Provides better TypeScript support than Portkey SDK
   - Maintains familiar OpenAI SDK interface
   - Custom header-based configuration

2. **Virtual Keys System**
   - API keys stored securely in Portkey's vault
   - No direct API key exposure in codebase
   - Environment variables:

     ```env
     PORTKEY_API_KEY=your-portkey-api-key
     PORTKEY_VIRTUAL_KEY=your-virtual-key
     OPENAI_API_KEY=placeholder-or-empty
     ```

3. **Server-Side Only Access**
   - All AI calls made through Next.js 15 Server Actions
   - Client components never have direct API access
   - Uses `enhanceAction` wrapper for all server actions

### Directory Structure

```
packages/ai-gateway/
├── src/
│   ├── configs/          # Configuration management
│   │   ├── templates/    # Optimization-focused templates
│   │   ├── use-cases/    # Task-specific configs
│   │   ├── utils/        # Cache and utilities
│   │   ├── manager.ts    # Config management
│   │   └── types.ts      # Type definitions
│   ├── prompts/          # Prompt management
│   │   ├── messages/     # Message components
│   │   ├── templates/    # Combined templates
│   │   └── manager.ts    # Prompt utilities
│   └── utils/            # Core utilities
│       ├── usage-tracking.ts
│       ├── db-init.ts
│       └── supabase-client.ts
```

## Basic Usage

### Creating a Gateway Client

```typescript
import { createGatewayClient } from '@kit/ai-gateway';

// Basic usage with model-based provider selection
const client = createGatewayClient({
  model: 'gpt-4-turbo',        // OpenAI provider
  // model: 'claude-3-opus-20240229',  // Anthropic provider
  // model: 'llama-3-70b',             // Groq provider
  userId: user.id,
  feature: 'content-generation',
});
```

### Using getChatCompletion Helper

For simpler use cases:

```typescript
import { getChatCompletion } from '@kit/ai-gateway';

const result = await getChatCompletion(
  [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: prompt },
  ],
  {
    model: 'gpt-4-turbo',
    temperature: 0.7,
    userId: user.id,
    teamId: team.id,
    feature: 'chat-assistant',
  },
);

console.log(result.content);
console.log(result.metadata.cost); // Track costs
```

### Server Actions Integration

Always use server actions for AI calls:

```typescript
'use server';

import { z } from 'zod';
import { createGatewayClient } from '@kit/ai-gateway';
import { enhanceAction } from '@kit/next/actions';

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
        { role: 'user', content: data.prompt },
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
  },
);
```

## Configuration System

### Configuration Types

1. **Strategy Configuration**

   ```typescript
   {
     mode: 'single' | 'loadbalance' | 'fallback';
     on_status_codes?: number[];
   }
   ```

2. **Cache Configuration**

   ```typescript
   {
     mode: 'simple' | 'semantic';
     max_age?: number;
   }
   ```

3. **Retry Configuration**

   ```typescript
   {
     attempts: number;
     on_status_codes?: number[];
   }
   ```

### Optimization-Focused Templates

1. **Quality Optimized** (`quality-optimized`)
   - Models: GPT-4 with Claude-3-Opus fallback
   - Temperature: 0.3 (low for precision)
   - Cache: Semantic with 2-hour duration
   - Best for: Critical content, structured data generation

2. **Speed Optimized** (`speed-optimized`)
   - Models: Groq with llama-3.1-8b-instant
   - Temperature: Higher for quick responses
   - Cache: Simple with short duration
   - Best for: Quick suggestions, real-time completions

3. **Balanced Optimized** (`balanced-optimized`)
   - Models: llama-3.3-70b with Claude-3-Haiku fallback
   - Temperature: Moderate settings
   - Cache: Efficient strategies
   - Best for: General-purpose features

### Advanced Configuration

```typescript
const client = createGatewayClient({
  model: 'gpt-4-turbo',
  config: {
    strategy: {
      mode: 'fallback',
    },
    targets: [
      { provider: 'openai', model: 'gpt-4-turbo' },
      { provider: 'anthropic', model: 'claude-3-opus-20240229' },
    ],
    cache: {
      mode: 'semantic',
      max_age: 7200,
    },
    retry: {
      attempts: 3,
      on_status_codes: [429, 500, 502, 503, 504],
    },
  },
});
```

### Cache Management

1. **Namespace Options**

   ```typescript
   type CacheNamespaceOptions = {
     userId: string;
     teamId?: string;
     presentationId?: string;
     context?: string;
   };
   ```

2. **Force Refresh Conditions**
   - Time-based (hourly/daily)
   - Content version changes
   - User-requested refresh
   - Custom triggers

## Prompt Management

### Two Distinct Approaches

#### 1. Standard Template Approach

Used for standalone operations with simple context requirements:

```typescript
// Define templates in src/prompts/templates/
const testOutlineTemplate: ChatMessage[] = [
  {
    role: 'system',
    content: testOutlineCreatorSystem,
  },
  {
    role: 'user',
    content: testOutlineRequestUser,
  },
];

// Use with PromptManager
const messages = PromptManager.getTemplate('test-outline');
```

#### 2. Partial-Based Canvas Approach

Used for complex operations requiring SCQA framework and rich context:

```typescript
// Compose prompts from partials
const messages: ChatMessage[] = [
  {
    role: 'system',
    content: `${baseInstructions}\n\n${ideasCreatorSystem}`,
  },
  {
    role: 'user',
    content: `${presentationContext
      .replace('{{title}}', submission.title)
      .replace('{{audience}}', submission.audience)}
    ${improvementFormat}`,
  },
];
```

### When to Use Each Approach

| Feature | Standard Template | Partial-Based |
|---------|------------------|---------------|
| Complexity | Simple, fixed format | Complex, dynamic |
| Context | Limited | Rich SCQA framework |
| Use Cases | Title generation, basic outlines | Canvas editor, improvements |
| Flexibility | Low | High |

## Streaming Responses

For better user experience with long responses:

```typescript
import { getStreamingChatCompletion } from '@kit/ai-gateway';

const stream = getStreamingChatCompletion(messages, {
  model: 'gpt-4-turbo',
  userId: user.id,
  feature: 'streaming-chat',
});

for await (const chunk of stream) {
  // Process each chunk
  process.stdout.write(chunk);
}
```

## Error Handling

```typescript
import { AiUsageLimitError } from '@kit/ai-gateway';

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

## Usage Tracking

The gateway automatically tracks:

- **User Identification**: User ID and Team ID for billing
- **Feature Attribution**: Feature name for cost allocation
- **Session Tracking**: Session ID for request grouping
- **Token Usage**: Prompt, completion, and total tokens
- **Cost Calculation**: Based on model and token usage
- **Request Metadata**: Request IDs for debugging

### Tracked Metrics

```typescript
interface UsageMetadata {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  provider: string;
  model: string;
  feature: string;
  requestId: string;
}
```

## Environment Variables

### Required

- `PORTKEY_API_KEY` - Your Portkey API key
- `PORTKEY_VIRTUAL_KEY` - Virtual key for provider access
- `OPENAI_API_KEY` - Can be empty when using virtual keys

### Optional

- `CHECK_AI_USAGE_LIMITS` - Enable usage limit checking (default: false)
- `BYPASS_AI_CREDITS` - Bypass credit deduction (default: true)
- `AI_USAGE_DEBUG` - Enable verbose debug logging (default: false)
- `INITIALIZE_DATABASE` - Initialize AI gateway database tables (default: true)

## Best Practices

### 1. Configuration

- Choose the right optimization template for your use case
- Implement proper cache namespacing for multi-tenant scenarios
- Configure force refresh conditions based on content volatility
- Set appropriate retry attempts based on criticality

### 2. Security

- Always use server actions for AI calls
- Never expose API keys to client-side code
- Validate all user inputs with Zod schemas
- Implement proper authentication checks

### 3. Prompts

- Keep system messages focused on role and behavior
- Use clear, specific user message templates
- Implement proper variable substitution
- Validate all required fields before API calls

### 4. Error Handling

- Implement comprehensive try/catch blocks
- Log errors with sufficient context
- Provide meaningful user-facing error messages
- Handle rate limits and implement backoff strategies

### 5. Performance

- Use streaming for long responses
- Implement appropriate caching strategies
- Monitor token usage and costs
- Consider using speed-optimized models for real-time features

## Future Improvements

1. **Function Calling Support** - Add support for OpenAI function calling
2. **Semantic Search** - Implement vector database integration
3. **Additional Providers** - Support for more AI providers
4. **Enhanced Monitoring** - Better analytics and observability
5. **Model Auto-Selection** - Automatic model selection based on task
6. **Prompt Versioning** - Version control for prompts
7. **A/B Testing** - Built-in prompt testing capabilities

## Related Files

- `/packages/ai-gateway/src/` - Gateway implementation
- `/packages/ai-gateway/src/configs/` - Configuration templates
- `/packages/ai-gateway/src/prompts/` - Prompt templates
- `/apps/web/app/*/server-actions.ts` - Server action implementations

## See Also

- **MCP Servers**: `.claude/docs/tools/mcp-servers.md` - AI service integrations
- **Server Actions**: `CLAUDE.md` - Server action patterns
- **Type Safety**: `.claude/docs/development/typescript.md` - TypeScript guidelines
