---
id: typescript-test-patterns
title: TypeScript Test Patterns for SlideHeroes
version: 2.1.0
category: pattern
description: TypeScript-specific testing patterns, type safety strategies, and compilation error solutions for the SlideHeroes codebase
tags: ["typescript", "testing", "vitest", "patterns", "mocking", "type-safety"]
dependencies: []
cross_references:
  - id: testing-fundamentals
    type: prerequisite
    description: Core testing principles and philosophy
  - id: e2e-testing-fundamentals
    type: related
    description: E2E testing with Playwright
  - id: performance-testing-fundamentals
    type: related
    description: Performance testing patterns
created: 2025-01-05
last_updated: 2025-09-15
author: create-context
---

# TypeScript Test Patterns for SlideHeroes

This document provides TypeScript-specific testing patterns for fixing compilation errors and maintaining type safety in tests, based on the codebase's actual implementation.

## Table of Contents

1. [Core Principles](#core-principles)
2. [Common Error Patterns & Solutions](#common-error-patterns--solutions)
3. [Action Result Type Patterns](#action-result-type-patterns)
4. [Mock Type Patterns](#mock-type-patterns)
5. [Component Testing Patterns](#component-testing-patterns)
6. [Supabase Mock Patterns](#supabase-mock-patterns)
7. [Error Handling Patterns](#error-handling-patterns)
8. [Type Assertion Patterns](#type-assertion-patterns)
9. [Environment & Configuration](#environment--configuration)
10. [Best Practices](#best-practices)

## Core Principles

### 1. No `any` Types (Biome Rule)

```typescript
// ❌ BAD - Biome error
const mockData: any = { test: true };

// ✅ GOOD - Use unknown with type assertion
const mockData: unknown = { test: true };
const typedData = mockData as SpecificType;

// ✅ GOOD - Strategic any for complex external libraries
// biome-ignore lint/suspicious/noExplicitAny: External library mock
const complexMock = createMockBuilder() as any;
```

### 2. No Underscore Prefixes for Used Variables

```typescript
// ❌ BAD - Variable is used but prefixed
const _response = await getResponse();
console.log(_response); // TS error

// ✅ GOOD - Remove underscore when used
const response = await getResponse();
console.log(response);
```

### 3. Test Public APIs, Not Private Methods

```typescript
// ❌ BAD - Testing private implementation
expect((service as any)._privateMethod()).toBe(true);

// ✅ GOOD - Test through public interface
const result = await service.publicMethod();
expect(result).toBe(true);
```

## Common Error Patterns & Solutions

### Pattern 1: ActionResult Type Mismatches

**Error**: `'result' is of type 'unknown'`

```typescript
// ❌ BAD - Unknown result type
const result = await someAction(input);
expect(result.success).toBe(true); // TS error

// ✅ GOOD - From codebase: /apps/web/test/test-helpers.ts
import type { ActionResult } from '@/test/test-types';
import { castActionResult, expectSuccess } from '@/test/test-helpers';

const result = castActionResult<DataType>(await someAction(input));
const data = expectSuccess(result); // Throws if not success
```

### Pattern 2: Missing Type Imports

```typescript
// ✅ CORRECT - Import paths from codebase
import type { Database } from '@kit/supabase/database.types';
import type { Tables } from '@kit/supabase/types';
import type { PayloadQuiz } from '@/../apps/payload/payload-types';
```

### Pattern 3: Property Name Mismatches

```typescript
// Database uses lowercase: iscorrect not isCorrect
option.iscorrect; // ✅ Matches database schema

// Transform if needed for consistency
const formatted = { ...option, isCorrect: option.iscorrect };
```

### Pattern 4: Object Possibly Undefined

```typescript
// ✅ Solutions
result.data?.property; // Optional chaining

if (result.data) {
  expect(result.data.property).toBe(expected); // Type narrowing
}

result.data!.property; // Non-null assertion (when certain)
```

## Action Result Type Patterns

### Type Definitions (from /apps/web/test/test-types.d.ts)

```typescript
export type ActionResult<T = unknown> =
  | { success: true; data?: T }
  | { success: false; error: string };

export type EnhancedAction<TInput, TOutput> = (
  input: TInput,
) => Promise<ActionResult<TOutput>>;
```

### Mock enhanceAction Pattern

```typescript
// From codebase test files
vi.mock('@kit/next/actions', () => ({
  enhanceAction: vi.fn((fn, options) => {
    return async (data: unknown) => {
      if (options?.schema) {
        const result = options.schema.safeParse(data);
        if (!result.success) {
          return { success: false, error: 'Validation failed' };
        }
      }
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      return fn(data, mockUser);
    };
  }),
}));
```

### Testing Action Results

```typescript
describe('Server Actions', () => {
  it('should handle success case', async () => {
    const result = await action(input) as ActionResult<Item>;

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data?.name).toBe('Test');
    }
  });

  it('should handle error case', async () => {
    const result = await action(input) as ActionResult;

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('validation');
    }
  });
});
```

## Mock Type Patterns

### Factory Pattern (from codebase)

```typescript
// test/factories/quiz.factory.ts
export function createMockQuiz(
  overrides: Partial<PayloadQuiz> = {},
): PayloadQuiz {
  return {
    id: 'quiz_123',
    title: 'Test Quiz',
    passingScore: 70,
    questions: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}
```

### Component Props Factory

```typescript
const createProps = (
  overrides: Partial<ComponentProps> = {}
): ComponentProps => ({
  quiz: createMockQuiz(),
  onSubmit: vi.fn(),
  courseId: 'course_123',
  ...overrides,
});

// Usage
render(<Component {...createProps()} />);
```

## Component Testing Patterns

### Type-Safe Testing

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('Component', () => {
  it('should handle user interaction', async () => {
    const onSubmit = vi.fn();
    const props = createProps({ onSubmit });

    render(<Component {...props} />);

    const button = screen.getByRole('button', { name: /submit/i });
    await userEvent.click(button);

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        score: expect.any(Number),
        passed: expect.any(Boolean),
      })
    );
  });
});
```

## Supabase Mock Patterns

### From /apps/web/test/test-helpers.ts

```typescript
export function createMockSupabaseClient(): MockSupabaseClient {
  const mockFrom = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    // biome-ignore lint/suspicious/noThenProperty: Mock thenable
    then: vi.fn((onResolve) => onResolve({ data: null, error: null })),
  });

  const mockAuth = {
    getUser: vi.fn().mockResolvedValue({
      data: { user: { id: 'test-id', email: 'test@example.com' }},
      error: null,
    }),
  };

  return { from: mockFrom, auth: mockAuth } as unknown as MockSupabaseClient;
}
```

### Usage in Tests

```typescript
const mockClient = createMockSupabaseClient();
vi.mocked(getSupabaseServerClient).mockReturnValue(mockClient);

mockClient.from = vi.fn(() => ({
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({
    data: { id: 'user-123', name: 'Test User' },
    error: null,
  }),
}));
```

## Error Handling Patterns

### Discriminated Union Type Narrowing

```typescript
// From codebase helpers
import { expectError, isErrorResult } from '@/test/test-helpers';

const result = await action(input);

// Type guard approach
if (isErrorResult(result)) {
  expect(result.error).toContain('validation');
}

// Helper function approach
const errorMessage = expectError(result);
expect(errorMessage).toContain('validation');
```

### Try-Catch Type Safety

```typescript
try {
  await riskyOperation();
} catch (error) {
  // Type guard
  if (error instanceof Error) {
    expect(error.message).toBe('Failed');
  }

  // Or type assertion
  const err = error as Error;
  expect(err.message).toBe('Failed');
}
```

## Type Assertion Patterns

### Mock Function Typing

```typescript
// ❌ BAD - Loses type information
const mockFn = vi.fn();

// ✅ GOOD - Typed mock
const mockFn = vi.fn<[InputType], Promise<OutputType>>();

// ✅ GOOD - With implementation
const mockFn = vi.fn().mockImplementation(
  async (input: InputType): Promise<OutputType> => {
    return { success: true, data: mockData };
  }
);
```

### Double Casting for Complex Types

```typescript
// When types are incompatible
const data = complexObject as unknown as SpecificType;

// Type predicate for runtime safety
function isSpecificType(obj: unknown): obj is SpecificType {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'requiredProp' in obj
  );
}
```

## Environment & Configuration

### Vitest Environment Setup

```typescript
// ✅ Use vi.stubEnv for environment variables
beforeEach(() => {
  vi.stubEnv('NODE_ENV', 'test');
  vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://test-api.com');
});

afterEach(() => {
  vi.unstubAllEnvs();
});
```

### Import Path Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@/test': path.resolve(__dirname, './test'),
      '@kit': path.resolve(__dirname, '../../packages'),
    },
  },
});
```

## Best Practices

### Test Helpers (from /apps/web/test/test-helpers.ts)

```typescript
export function castActionResult<T>(result: unknown): ActionResult<T> {
  if (!result || typeof result !== 'object') {
    throw new Error('Invalid action result');
  }
  // Runtime validation...
  return result as ActionResult<T>;
}

export function expectSuccess<T>(result: ActionResult<T>): T | undefined {
  if (!result.success) {
    throw new Error(`Expected success but got error: ${result.error}`);
  }
  return result.data;
}

export function expectError(result: ActionResult<unknown>): string {
  if (result.success) {
    throw new Error('Expected error but got success');
  }
  return result.error;
}

export function isSuccessResult<T>(
  result: ActionResult<T>
): result is { success: true; data?: T } {
  return result.success === true;
}
```

### Key Patterns to Follow

1. **Never use `any` types** - Use `unknown` with type assertions
2. **Use type assertions** for action results: `as ActionResult<T>`
3. **Create factory functions** for consistent test data
4. **Handle discriminated unions** with type narrowing
5. **Mock at boundaries** (external dependencies only)
6. **Use existing test helpers** from `/apps/web/test/test-helpers.ts`
7. **Follow import conventions** from the codebase (`@kit/*`, `@/test/*`)
8. **Test behavior, not implementation** details

## Related Files

Key test files in the codebase:
- `/apps/web/test/test-helpers.ts` - Core test utilities
- `/apps/web/test/test-types.d.ts` - Type definitions
- `/apps/web/app/**/**.test.ts` - Example test implementations
- `/packages/features/admin/**/*.test.ts` - Service testing patterns

## Summary

Focus on TypeScript-specific challenges:
- Type safety in mocks and assertions
- Discriminated union handling
- Import path resolution
- Runtime vs compile-time type checking
- Reusable factory patterns
- Proper error type handling

For E2E testing patterns, see `e2e-testing-fundamentals.md`.
For performance testing, see `performance-testing-fundamentals.md`.