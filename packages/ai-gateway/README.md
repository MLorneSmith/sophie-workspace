# Portkey AI Gateway Integration

This package provides a secure and type-safe integration with the Portkey AI Gateway, allowing server-side access to various AI providers through a unified interface.

## Key Implementation Choices

1. **Virtual Keys System**

   - Using Portkey's virtual keys system for secure API key management
   - API keys are stored in Portkey's vault, not exposed in our codebase
   - Environment variables:
     - `PORTKEY_API_KEY`: Our Portkey API key
     - `PORTKEY_VIRTUAL_KEY`: Virtual key that securely references provider keys

2. **Server-Side Only Access**

   - All AI calls are made server-side to ensure API key security
   - Uses Next.js 15 Server Actions for handling AI requests
   - Client components never have direct access to API keys or the AI gateway

3. **OpenAI SDK with Portkey Configuration**

   - Leverages OpenAI's SDK configured to use Portkey's gateway
   - Maintains familiar OpenAI SDK interface while adding Portkey capabilities
   - Supports all OpenAI-compatible providers through Portkey's universal API

4. **Type Safety**
   - Full TypeScript support for requests and responses
   - Zod validation for chat messages
   - Proper error handling and type definitions

## Usage

1. **Environment Setup**

   ```env
   PORTKEY_API_KEY=your-portkey-api-key
   PORTKEY_VIRTUAL_KEY=your-virtual-key
   ```

2. **Basic Usage**

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

3. **With Server Actions**
   See the example implementation in `example.tsx` for a complete pattern using Next.js Server Actions.

## Benefits

1. **Security**

   - Provider API keys are securely stored in Portkey's vault
   - No sensitive credentials in our codebase or client-side
   - Server-side only access prevents unauthorized usage

2. **Flexibility**

   - Easy to switch between AI providers using virtual keys
   - Support for multiple providers through one interface
   - Unified API for all AI operations

3. **Monitoring & Control**

   - Built-in request logging through Portkey
   - Cost tracking and budget controls
   - Usage analytics and monitoring

4. **Performance**
   - Server-side execution for better performance
   - Proper error handling and recovery
   - Type safety to prevent runtime errors

## Configuration and Prompt Management System

### Configuration System

1. **Directory Structure**

   ```
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

   ```
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
