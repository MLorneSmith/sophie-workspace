# Bifrost AI Gateway Integration

This package provides a secure and type-safe integration with the Bifrost AI Gateway
for AI provider routing, combined with Langfuse for prompt management and observability.

## Architecture

The AI integration uses a dual-layer architecture:

1. **Bifrost Gateway** (<https://bifrost.gateway.slideheroes.com>)
   - Provider routing layer for AI API calls
   - Model transformation (e.g., `gpt-4o` → `openai/gpt-4o`)
   - Cloudflare Access authentication
   - Falls back to direct OpenAI API calls when not configured

2. **Langfuse** (optional)
   - Prompt management and versioning
   - Observability and tracing
   - Falls back to local prompt templates when not configured

## Environment Variables

### Bifrost Gateway (Required for production)

```env
# Gateway URL for AI provider routing
BIFROST_GATEWAY_URL=https://bifrost.gateway.slideheroes.com
# Cloudflare Access credentials for authenticated gateway access
BIFROST_CF_ACCESS_CLIENT_ID=your_cf_access_client_id
BIFROST_CF_ACCESS_CLIENT_SECRET=your_cf_access_client_secret
```

### Langfuse (Optional)

```env
# Langfuse public key for client-side analytics
LANGFUSE_PUBLIC_KEY=pk-your-public-key
# Langfuse secret key for server-side operations
LANGFUSE_SECRET_KEY=sk-your-secret-key
# Langfuse host URL (defaults to cloud if not specified)
LANGFUSE_HOST=https://cloud.langfuse.com
```

### OpenAI (Fallback)

When Bifrost is not configured, the system falls back to direct OpenAI API calls:

```env
OPENAI_API_KEY=your_openai_api_key
```

## Key Implementation Choices

1. **Server-Side Only Access**

   - All AI calls are made server-side to ensure API key security
   - Uses Next.js 15 Server Actions for handling AI requests
   - Client components never have direct access to API keys or the AI gateway

2. **OpenAI SDK with Bifrost Configuration**

   - Leverages OpenAI's SDK configured to use Bifrost gateway
   - Maintains familiar OpenAI SDK interface while adding routing capabilities
   - Automatic model name transformation for provider compatibility

3. **Type Safety**

   - Full TypeScript support for requests and responses
   - Zod validation for chat messages
   - Proper error handling and type definitions

4. **Fallback Behavior**

   - If `BIFROST_GATEWAY_URL` is not set, uses direct OpenAI API
   - If Langfuse is not configured, uses local prompt templates
   - Graceful degradation ensures functionality without external services

## Usage

### Basic Usage

```typescript
import { getChatCompletion } from '@kit/ai-gateway';
import { createBalancedOptimizedConfig } from '@kit/ai-gateway/configs/templates';

const messages = [
  { role: 'system', content: 'You are a helpful assistant.' },
  { role: 'user', content: 'Hello!' },
];

// Create a balanced configuration with cache namespacing
const config = createBalancedOptimizedConfig({
  userId: 'user-123',
  teamId: 'team-456',
});

const response = await getChatCompletion(messages, { config });
```

### With Server Actions

See the example implementation in `example.tsx` for a complete pattern using Next.js Server Actions.

## Configuration and Prompt Management System

### Configuration System

1. **Directory Structure**

   ```text
   src/configs/
   ├── templates/       # Optimization-focused config templates
   ├── use-cases/      # Task-specific configs
   ├── utils/          # Cache and force refresh utilities
   ├── manager.ts      # Config management utilities
   └── types.ts        # Type definitions
   ```

2. **Optimization-Focused Templates**

   ```typescript
   import {
     createBalancedOptimizedConfig,
     createQualityOptimizedConfig,
     createReasoningOptimizedConfig,
     createSpeedOptimizedConfig,
   } from '@kit/ai-gateway/configs/templates';

   // Speed-optimized for quick responses
   const speedConfig = createSpeedOptimizedConfig({
     userId: 'user-123',
     teamId: 'team-456',
     context: 'quick-suggestions',
   });

   // Quality-optimized with content versioning
   const qualityConfig = createQualityOptimizedConfig(
     {
       userId: 'user-123',
       teamId: 'team-456',
     },
     'content-version-1',
   );

   const response = await getChatCompletion(messages, {
     config: qualityConfig,
   });
   ```

   Available templates:

   - `speedOptimized`: Fast responses optimized for speed and low cost
     - Uses Groq with llama-3.1-8b-instant
     - Short token limits and higher temperature
     - Quick cache refresh cycles
     - Best for: Quick suggestions, real-time completions
   - `qualityOptimized`: High-quality responses with structured output
     - Uses GPT-4 with Claude-3-Opus fallback
     - Low temperature for precision
     - JSON output format
     - Best for: Critical content, structured data needs
   - `reasoningOptimized`: Balanced reasoning capabilities
     - Uses o3-mini with Claude-3-Sonnet fallback
     - Balanced temperature settings
     - Longer token limits for detailed analysis
     - Best for: Complex transformations, logical analysis
   - `balancedOptimized`: Optimal speed/quality balance
     - Uses llama-3.3-70b with Claude-3-Haiku fallback
     - Moderate settings for general use
     - Efficient cache and retry strategies
     - Best for: General-purpose use, interactive features

   Use-case specific configurations:

   - `outlineGeneration`: Optimized for presentation outline creation

3. **Cache Namespacing and Force Refresh**

   ```typescript
   // Cache namespacing options
   type CacheNamespaceOptions = {
     userId: string;
     teamId?: string;
     presentationId?: string;
     context?: string;
   };

   // Force refresh conditions
   const config = createQualityOptimizedConfig(
     {
       userId: 'user-123',
       teamId: 'team-456',
     },
     'content-version-2', // Content version for force refresh
   );
   ```

   Features:

   - **Cache Namespacing**
     - User-specific cache isolation
     - Team-level cache partitioning
     - Context-aware caching
     - Presentation-specific caching

   - **Force Refresh Conditions**
     - Time-based refresh (hourly/daily)
     - Content version changes
     - User-requested refresh
     - Custom refresh triggers

### Prompt Management System

1. **Directory Structure**

   ```text
   src/prompts/
   ├── messages/          # Message components
   │   ├── system/       # System role definitions
   │   └── user/         # User message templates
   ├── templates/        # Combined message templates
   └── prompt-manager.ts # Prompt management utilities
   ```

2. **Message-Based Architecture**

   ```typescript
   // 1. System Message (messages/system/test-outline-creator.ts)
   const testOutlineCreatorSystem = `You are an expert presentation outline creator.
   Your role is to create well-structured, professional outlines that:
   - Follow hierarchical organization
   - Use impactful headings
   - Consider audience: {{target_audience}}
   - Adapt to duration: {{duration}} minutes`;

   // 2. User Message (messages/user/test-outline-request.ts)
   const testOutlineRequestUser = `Create an outline for:
   Topic: {{topic}}
   Context: {{context}}
   Requirements: {{specific_requirements}}`;

   // 3. Combined Template (templates/test-outline.ts)
   const testOutlineTemplate: ChatMessage[] = [
     { role: 'system', content: testOutlineCreatorSystem },
     { role: 'user', content: testOutlineRequestUser },
   ];
   ```

3. **Using Message Templates**

   ```typescript
   import {
     compileTemplate,
     loadTemplate,
   } from '@kit/ai-gateway/prompts/prompt-manager';

   // Load and compile the template
   const template = loadTemplate('test-outline');
   const compiledMessages = template.map((message) => ({
     ...message,
     content: compileTemplate(message.content, {
       topic: 'AI in Business',
       target_audience: 'Executives',
       duration: '30',
       context: 'Strategy Meeting',
       specific_requirements: 'Focus on ROI',
     }),
   }));

   // Use with chat completion
   const response = await getChatCompletion(compiledMessages, { config });
   ```

4. **Key Benefits**

   - **Clear Role Separation**: System messages define behavior, user messages handle specifics
   - **Reusable Components**: Messages can be mixed and matched for different use cases
   - **Maintainable Structure**: Each message type has its own directory
   - **Type Safety**: Full TypeScript support for message roles and content
   - **Variable Validation**: Automatic checking of required variables
   - **Versioning**: Support for message and template versioning

5. **Best Practices**

   - System messages define the AI's role and behavior
   - User messages contain specific task requirements
   - Templates combine messages in the correct order
   - Variables use consistent naming across messages
   - Each message focuses on a single responsibility

## Streaming Support

1. **Basic Streaming**

   ```typescript
   import { getStreamingChatCompletion } from '@kit/ai-gateway';
   import { createBalancedOptimizedConfig } from '@kit/ai-gateway/configs/templates';

   const messages = [
     { role: 'system', content: 'You are a helpful assistant.' },
     { role: 'user', content: 'Tell me a story.' },
   ];

   const config = createBalancedOptimizedConfig({
     userId: 'user-123',
   });

   for await (const chunk of getStreamingChatCompletion(messages, { config })) {
     process.stdout.write(chunk);
   }
   ```

## Future Improvements

1. Add support for function calling
2. Implement semantic search capabilities
3. Add support for additional AI providers
4. Enhance monitoring and analytics
5. Add more optimization-focused templates for specific use cases
6. Implement automatic model selection based on input characteristics
