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

   const messages = [
     { role: 'system', content: 'You are a helpful assistant.' },
     { role: 'user', content: 'Hello!' },
   ];

   const response = await getChatCompletion(messages);
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

## Configuration System

1. **Predefined Templates**

   ```typescript
   import { configTemplates, getChatCompletion } from '@kit/ai-gateway';

   // Use reliable configuration with retries and fallbacks
   const response = await getChatCompletion(messages, {
     config: configTemplates.reliableConfig,
   });
   ```

   Available templates:

   - `basicConfig`: Simple configuration with semantic caching and retry mechanism
   - `loadBalanceConfig`: Load balancing between multiple providers
   - `fallbackConfig`: Fallback strategy for handling errors
   - `reliableConfig`: Optimized for high reliability
   - `costOptimizedConfig`: Optimized for cost with appropriate model selection

2. **Custom Configuration**

   ```typescript
   import { Config, getChatCompletion } from '@kit/ai-gateway';

   const customConfig: Config = {
     strategy: {
       mode: 'loadbalance',
     },
     targets: [
       {
         provider: 'openai',
         weight: 0.7,
       },
       {
         provider: 'anthropic',
         weight: 0.3,
       },
     ],
     cache: {
       mode: 'semantic',
       max_age: 3600,
     },
     retry: {
       attempts: 3,
       on_status_codes: [429, 503],
     },
   };

   const response = await getChatCompletion(messages, {
     config: customConfig,
   });
   ```

3. **Configuration Features**

   - **Load Balancing**: Distribute requests across multiple providers
   - **Fallbacks**: Automatic failover to backup providers
   - **Caching**: Both simple and semantic caching options
   - **Retries**: Automatic retry with customizable attempts and status codes
   - **Provider Selection**: Support for multiple AI providers
   - **Parameter Override**: Model-specific parameter customization

## Streaming Support

1. **Basic Streaming**

   ```typescript
   import { getStreamingChatCompletion } from '@kit/ai-gateway';

   const messages = [
     { role: 'system', content: 'You are a helpful assistant.' },
     { role: 'user', content: 'Tell me a story.' },
   ];

   for await (const chunk of getStreamingChatCompletion(messages)) {
     process.stdout.write(chunk);
   }
   ```

2. **Streaming with Configuration**

   ```typescript
   import {
     configTemplates,
     getStreamingChatCompletion,
   } from '@kit/ai-gateway';

   for await (const chunk of getStreamingChatCompletion(messages, {
     config: configTemplates.reliableConfig,
     temperature: 0.7,
   })) {
     process.stdout.write(chunk);
   }
   ```

## Future Improvements

1. Add support for function calling
2. Implement semantic search capabilities
3. Add support for additional AI providers
4. Enhance monitoring and analytics
