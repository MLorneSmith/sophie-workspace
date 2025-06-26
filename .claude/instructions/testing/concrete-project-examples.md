# Concrete Testing Examples from SlideHeroes

## Server Actions with enhanceAction

### Testing Zod Schema Validation (generate-ideas.test.ts)

```typescript
import { errorResult, successResult } from '@/test/test-helpers';
import type { ActionResult } from '@/test/test-types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

// Create a test wrapper that mimics enhanceAction behavior
const createTestAction = (schema: z.ZodSchema) => {
  return async (data: unknown): Promise<ActionResult<{ message: string }>> => {
    const result = schema.safeParse(data);
    if (!result.success) {
      return errorResult('Validation failed');
    }
    return successResult({ message: 'Action completed successfully' });
  };
};

const IdeasSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  submissionId: z.string().min(1, 'Submission ID is required'),
  type: z.enum(['situation', 'complication', 'answer', 'outline']),
  sessionId: z.string().optional(),
});

describe('Generate Ideas Schema Validation', () => {
  it('should accept valid input data', async () => {
    const testAction = createTestAction(IdeasSchema);
    const validInput = {
      content: 'Test content for ideas',
      submissionId: 'test-submission-id',
      type: 'situation',
      sessionId: 'test-session-id',
    };

    const result = await testAction(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data?.message).toBe('Action completed successfully');
    }
  });

  it('should validate all supported type enums', async () => {
    const testAction = createTestAction(IdeasSchema);
    const types = ['situation', 'complication', 'answer', 'outline'];

    for (const type of types) {
      const input = {
        content: `Test content for ${type}`,
        submissionId: 'test-submission-id',
        type,
      };
      const result = await testAction(input);
      expect(result.success).toBe(true);
    }
  });
});
```

## Enhanced API Wrapper Testing (enhanced-api-wrapper.test.ts)

### Mocking Complex Dependencies

```typescript
import { type NextRequest, NextResponse } from 'next/server';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock environment logger with full interface
class MockEnvironmentLogger {
  config = {
    enableLogging: true,
    logLevel: 'info' as const,
    environment: 'test',
    serviceName: 'test-service',
  };
  levels = { debug: 0, info: 1, warn: 2, error: 3 };
  info = vi.fn();
  error = vi.fn();
  warn = vi.fn();
  debug = vi.fn();
}

// Mock complex request objects
const createMockRequest = (headers: Record<string, string> = {}) => {
  const mockHeaders = new Map(Object.entries(headers));
  return {
    headers: {
      get: vi.fn((name: string) => mockHeaders.get(name) || null),
    },
    url: 'https://example.com/api/test',
  } as unknown as NextRequest;
};

describe('EnhancedAPIManager', () => {
  let mockLogger: MockEnvironmentLogger;

  beforeEach(() => {
    vi.clearAllMocks();
    mockLogger = new MockEnvironmentLogger();
    vi.mocked(createEnvironmentLogger).mockReturnValue(mockLogger);
  });

  it('should handle requests with various client headers', async () => {
    const manager = getEnhancedAPIManager();
    const mockHandler = vi.fn().mockResolvedValue(new Response('OK'));
    const enhancedHandler = manager.createEnhancedHandler(mockHandler, 'GET');

    const request = createMockRequest({
      'x-forwarded-for': '192.168.1.1',
      'user-agent': 'Test Browser',
      referer: 'https://example.com',
    });

    const response = await enhancedHandler(request);
    expect(response.status).toBe(200);
    expect(mockHandler).toHaveBeenCalledWith(request);
  });
});
```

### Testing Error Handling and Metrics

```typescript
describe('Error Log Management', () => {
  it('should maintain maximum error log size', async () => {
    const manager = getEnhancedAPIManager();
    const maxErrorLogSize = 100;

    // Create a handler that always fails
    const failingHandler = vi.fn().mockImplementation((_, index) => {
      return Promise.reject(new Error(`Error ${index}`));
    });

    const enhancedHandler = manager.createEnhancedHandler(
      failingHandler,
      'GET',
    );

    // Generate more errors than the maximum
    for (let i = 0; i < maxErrorLogSize + 10; i++) {
      const request = new Request(`https://example.com/api/test?index=${i}`);
      await enhancedHandler(request);
    }

    const recentErrors = manager.getRecentErrors(200);
    expect(recentErrors).toHaveLength(maxErrorLogSize);
  });

  it('should detect specific HTTP errors', async () => {
    const manager = getEnhancedAPIManager();
    const error = new Error('404 Not Found');
    const mockHandler = vi.fn().mockRejectedValue(error);
    const enhancedHandler = manager.createEnhancedHandler(mockHandler, 'GET');
    const request = new Request('https://example.com/api/test');

    const response = await enhancedHandler(request);

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe('Not Found');
  });
});
```

## React Component Testing (QuizComponent.test.tsx)

### Mocking UI Components

```typescript
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock UI library components
vi.mock("@kit/ui/button", () => ({
  Button: ({
    children,
    onClick,
    disabled,
    variant,
    className,
    ...props
  }: React.ComponentProps<"button"> & { variant?: string }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      data-variant={variant}
      className={className}
      {...props}
    >
      {children}
    </button>
  ),
}));

vi.mock("@kit/ui/card", () => ({
  Card: ({ children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) => (
    <div data-testid="card" {...props}>
      {children}
    </div>
  ),
  CardContent: ({ children, ...props }: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) => (
    <div data-testid="card-content" {...props}>
      {children}
    </div>
  ),
}));
```

## Supabase Testing Patterns

### Creating Type-Safe Supabase Mocks

```typescript
import type { SupabaseClient } from '@supabase/supabase-js';

function createMockSupabaseClient(): SupabaseClient {
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
      insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
      update: vi.fn(() => Promise.resolve({ data: null, error: null })),
      delete: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
    auth: {
      getUser: vi.fn(() =>
        Promise.resolve({ data: { user: null }, error: null }),
      ),
    },
    // ... implement other required methods
  } as unknown as SupabaseClient;
}
```

## Environment Variable Testing

### Using Vitest's Environment Stubs

```typescript
describe('Environment-dependent tests', () => {
  it('should include detailed messages in development', async () => {
    vi.stubEnv('NODE_ENV', 'development');

    try {
      const manager = getEnhancedAPIManager();
      const error = new Error('Detailed error message');
      const mockHandler = vi.fn().mockRejectedValue(error);
      const enhancedHandler = manager.createEnhancedHandler(mockHandler, 'GET');
      const request = new Request('https://example.com/api/test');

      const response = await enhancedHandler(request);

      const body = await response.json();
      expect(body.message).toBe('Detailed error message');
      expect(response.headers.get('X-Request-ID')).toMatch(/^req_\d+_/);
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
```

## Test Utilities and Helpers

### Type-Safe Test Helpers

```typescript
export function createMockAction<T>(
  implementation: (data: unknown) => Promise<ActionResult<T>>,
) {
  return vi.fn(implementation);
}

export function expectSuccess<T>(
  result: ActionResult<T>,
): asserts result is SuccessResult<T> {
  expect(result.success).toBe(true);
  expect(result.data).toBeDefined();
}

export function expectError(
  result: ActionResult<unknown>,
): asserts result is ErrorResult {
  expect(result.success).toBe(false);
  expect(result.error).toBeDefined();
}
```

### Test Data Factories

```typescript
export function createTestUser(overrides?: Partial<User>): User {
  return {
    id: 'test-id',
    email: 'test@example.com',
    name: 'Test User',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

// Usage in tests
const user = createTestUser({ email: 'custom@example.com' });
```

## Edge Case Testing

### Handling Malformed Data

```typescript
it('should handle null and undefined values gracefully', async () => {
  const invalidInputs = [
    null,
    undefined,
    {},
    { content: null, submissionId: 'test', type: 'situation' },
    { content: 'test', submissionId: null, type: 'situation' },
    { content: 'test', submissionId: 'test', type: null },
  ];

  for (const input of invalidInputs) {
    const result = await testAction(input);
    expect(result.error).toBe('Validation failed');
  }
});
```

### Special Characters and Unicode

```typescript
it('should accept content with special characters', async () => {
  const specialContent =
    'Content with émojis 🚀, special chars: @#$%^&*()_+{}|:"<>?[], and unicode: ñáéíóú';
  const input = {
    content: specialContent,
    submissionId: 'test-submission-id',
    type: 'answer',
  };

  const result = await testAction(input);
  expect(result.success).toBe(true);
});
```

## Performance Testing

### Response Time Metrics

```typescript
it('should calculate moving average response time correctly', async () => {
  const manager = getEnhancedAPIManager();

  // Create handlers that simulate different response times
  const mockHandlers = [
    vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve(new Response('OK', { status: 200 })), 100);
        }),
    ),
    vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve(new Response('OK', { status: 200 })), 200);
        }),
    ),
  ];

  const enhancedHandlers = mockHandlers.map((handler, index) =>
    manager.createEnhancedHandler(handler, 'GET'),
  );

  const request = new Request('https://example.com/api/test');

  await enhancedHandlers[0](request);
  let metrics = manager.getMetrics();
  expect(metrics.successfulRequests).toBe(1);
  expect(metrics.averageResponseTime).toBeGreaterThan(0);
});
```
