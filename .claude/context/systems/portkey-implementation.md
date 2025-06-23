# Portkey AI Gateway Implementation

This document explains our implementation of the Portkey AI Gateway, including configuration management, prompt systems, and best practices.

## Overview

Our AI Gateway implementation provides:

- Secure, type-safe integration with multiple AI providers
- Server-side only access for enhanced security
- Virtual keys system for secure API key management
- Flexible configuration management
- Two distinct prompt management approaches

### Key Implementation Choices

1. **Virtual Keys System**

   - Uses Portkey's virtual keys for secure API key management
   - API keys stored in Portkey's vault, not exposed in codebase
   - Environment variables:

     ```env
     PORTKEY_API_KEY=your-portkey-api-key
     PORTKEY_VIRTUAL_KEY=your-virtual-key
     ```

2. **Server-Side Only Access**

   - All AI calls made server-side for security
   - Uses Next.js 15 Server Actions for handling AI requests
   - Client components never have direct access to API keys

3. **OpenAI SDK with Portkey Configuration**
   - Leverages OpenAI's SDK configured to use Portkey's gateway
   - Maintains familiar OpenAI SDK interface
   - Supports all OpenAI-compatible providers

## Configuration System

### Directory Structure

```
src/configs/
├── templates/       # Optimization-focused config templates
├── use-cases/      # Task-specific configs
├── utils/          # Cache and force refresh utilities
├── manager.ts      # Config management utilities
└── types.ts        # Type definitions
```

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

1. **Quality Optimized**

   - Uses GPT-4 with Claude-3-Opus fallback
   - Low temperature (0.3) for precision
   - Semantic caching with 2-hour duration
   - Best for: Critical content, structured data

2. **Speed Optimized**

   - Uses Groq with llama-3.1-8b-instant
   - Higher temperature for quick responses
   - Simple caching with short duration
   - Best for: Quick suggestions, real-time completions

3. **Balanced Optimized**
   - Uses llama-3.3-70b with Claude-3-Haiku fallback
   - Moderate settings for general use
   - Efficient cache strategies
   - Best for: General-purpose features

### Cache Management

1. **Namespacing Options**

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

Our implementation uses two distinct approaches for prompt management:

### 1. Standard Template Approach

Used for standalone operations that don't require complex context. Directory structure:

```
src/prompts/
├── messages/          # Message components
│   ├── system/       # System role definitions
│   └── user/         # User message templates
├── templates/        # Combined message templates
└── prompt-manager.ts # Management utilities
```

Example template:

```typescript
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
```

### 2. Partial-Based Canvas Approach

Used for complex operations requiring SCQA framework integration and rich context. Implements a modular system of prompt partials:

1. **Base Instructions**

   - Core instructions for all improvements
   - SCQA framework guidelines
   - Analysis principles

2. **Improvement Format**

   - Structured JSON output format
   - Specific field requirements
   - Validation rules

3. **Presentation Context**
   - Complete SCQA framework context
   - Audience and goal information
   - Section-specific focus

Example usage:

```typescript
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

## Implementation Patterns

### When to Use Each Approach

1. **Standard Template Approach**

   - Simple, standalone operations
   - Fixed input/output formats
   - Limited context requirements
   - Example: Title generation, basic outlines

2. **Partial-Based Approach**
   - Complex operations requiring SCQA framework
   - Rich context requirements
   - Structured improvement suggestions
   - Example: Canvas editor operations

### Best Practices

1. **Configuration**

   - Use appropriate optimization template for the task
   - Implement proper cache namespacing
   - Configure force refresh conditions
   - Set appropriate retry attempts

2. **Prompts**

   - Keep system messages focused on role/behavior
   - Use clear, specific user messages
   - Implement proper variable substitution
   - Validate all required fields

3. **Error Handling**

   - Implement proper try/catch blocks
   - Log errors with context
   - Provide meaningful error messages
   - Handle rate limits and retries

4. **Response Parsing**
   - Validate JSON structure
   - Parse improvements consistently
   - Handle malformed responses
   - Maintain type safety

## Future Improvements

1. Add support for function calling
2. Implement semantic search capabilities
3. Add support for additional AI providers
4. Enhance monitoring and analytics
5. Add more optimization-focused templates
6. Implement automatic model selection
