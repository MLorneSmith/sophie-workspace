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

## Future Improvements

1. Add support for streaming responses
2. Implement retry logic and fallbacks
3. Add caching layer for common requests
4. Expand provider support beyond OpenAI
