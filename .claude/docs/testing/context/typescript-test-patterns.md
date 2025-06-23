# TypeScript Test Patterns for SlideHeroes

This document provides comprehensive TypeScript patterns for fixing test file compilation errors based on the codebase's specific requirements and common error patterns.

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

// ✅ GOOD - Use proper types
const mockData: TestData = { test: true };
```

### 2. No Underscore Prefixes for Used Variables

```typescript
// ❌ BAD - Variable is used but prefixed
const _response = await getResponse();
console.log(_response); // TS error: Cannot find name '_response'

// ✅ GOOD - Remove underscore when variable is used
const response = await getResponse();
console.log(response);

// ✅ GOOD - Keep underscore only for truly unused variables
const [value, _setValue] = useState(0); // _setValue not used
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

// ✅ GOOD - Type assertion with helper
import type { ActionResult } from '@/test/test-types';

const result = await someAction(input) as ActionResult<DataType>;
expect(result.success).toBe(true);
if (result.success) {
  expect(result.data?.someProperty).toBe(expected);
}

// ✅ GOOD - Using test helpers
import { expectSuccess, expectError } from '@/test/test-helpers';

const result = await someAction(input);
expectSuccess(result);
expectError(result, 'Expected error message');
```

### Pattern 2: Missing Type Imports

**Error**: `Cannot find module '@/lib/database.types'`

```typescript
// ❌ BAD - Missing or incorrect import path
import type { Database } from '@/lib/database.types';

// ✅ GOOD - Use correct import paths
import type { Database } from '@/lib/supabase/database.types';
import type { Tables } from '@/lib/supabase/types';

// ✅ GOOD - Import from payload types
import type { PayloadQuiz, PayloadLesson } from '@/../apps/payload/payload-types';
```

### Pattern 3: Property Name Mismatches

**Error**: `Property 'isCorrect' does not exist. Did you mean 'iscorrect'?`

```typescript
// ❌ BAD - Wrong property name
option.isCorrect; // TS error

// ✅ GOOD - Use correct property name from type definition
option.iscorrect;

// ✅ GOOD - Map to expected format if needed
const formattedOption = {
  ...option,
  isCorrect: option.iscorrect, // Transform for consistency
};
```

### Pattern 4: Object Possibly Undefined

**Error**: `Object is possibly 'undefined'`

```typescript
// ❌ BAD - Direct access without null check
result.data.property; // TS error if data could be undefined

// ✅ GOOD - Optional chaining
result.data?.property;

// ✅ GOOD - Type narrowing
if (result.data) {
  expect(result.data.property).toBe(expected);
}

// ✅ GOOD - Non-null assertion (when certain)
result.data!.property; // Use sparingly, only when guaranteed
```

## Action Result Type Patterns

### Standard ActionResult Type Definition

```typescript
// test/test-types.d.ts
export type ActionResult<T = unknown> =
  | { success: true; data?: T }
  | { success: false; error: string };

export type EnhancedAction<TInput, TOutput> = (
  input: TInput,
) => Promise<ActionResult<TOutput>>;
```

### Mock enhanceAction Pattern

```typescript
// ✅ CORRECT - Mock with proper discriminated union
vi.mock('@kit/next/actions', () => ({
  enhanceAction: vi.fn((fn, options) => {
    return async (data: unknown) => {
      if (options?.schema) {
        const result = options.schema.safeParse(data);
        if (!result.success) {
          return { success: false, error: 'Validation failed' } as const;
        }
      }
      return fn(data, mockUser);
    };
  }),
}));
```

### Testing Action Results

```typescript
describe('Server Actions', () => {
  it('should handle success case', async () => {
    const result = (await createItemAction({
      name: 'Test',
    })) as ActionResult<Item>;

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data?.name).toBe('Test');
    }
  });

  it('should handle error case', async () => {
    const result = (await createItemAction({ name: '' })) as ActionResult<Item>;

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('required');
    }
  });
});
```

## Mock Type Patterns

### Complete Mock Factory Pattern

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

export function createMockQuizQuestion(
  overrides: Partial<QuizQuestion> = {},
): QuizQuestion {
  return {
    id: 'q_123',
    question: 'Test question?',
    questiontype: 'multiple_choice',
    options: [
      { id: 'opt_1', text: 'Option 1', iscorrect: true },
      { id: 'opt_2', text: 'Option 2', iscorrect: false },
    ],
    ...overrides,
  };
}
```

### React Component Props Pattern

```typescript
// ❌ BAD - Incomplete props causing TS errors
const props = {
  quiz: mockQuiz,
  onSubmit: vi.fn(),
};

// ✅ GOOD - Complete props satisfying interface
const defaultProps: QuizComponentProps = {
  quiz: createMockQuiz(),
  onSubmit: vi.fn(),
  previousAttempts: [],
  courseId: 'course_123',
  currentLessonId: 'lesson_123',
  currentLessonNumber: 1,
  // Add all required props
};

// Usage in tests
render(<QuizComponent {...defaultProps} />);
```

## Component Testing Patterns

### Type-Safe Component Testing

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('QuizComponent', () => {
  const createProps = (overrides: Partial<QuizComponentProps> = {}): QuizComponentProps => ({
    quiz: createMockQuiz(),
    onSubmit: vi.fn(),
    previousAttempts: [],
    courseId: 'course_123',
    currentLessonId: 'lesson_123',
    currentLessonNumber: 1,
    ...overrides,
  });

  it('should handle quiz submission', async () => {
    const onSubmit = vi.fn();
    const props = createProps({ onSubmit });

    render(<QuizComponent {...props} />);

    // Type-safe event handling
    const submitButton = screen.getByRole('button', { name: /submit/i });
    await userEvent.click(submitButton);

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        answers: expect.any(Object),
        score: expect.any(Number),
        passed: expect.any(Boolean),
      })
    );
  });
});
```

### Event Type Conversion Pattern

```typescript
// ❌ BAD - Type mismatch
const keyboardEvent = new KeyboardEvent('keydown');
fireEvent.click(element, keyboardEvent); // TS error

// ✅ GOOD - Proper event type or conversion
const mouseEvent = new MouseEvent('click');
fireEvent.click(element, mouseEvent);

// ✅ GOOD - Using userEvent (recommended)
await userEvent.click(element);
```

## Supabase Mock Patterns

### Recursive Query Builder Mock

```typescript
export function createMockSupabaseClient(): SupabaseClient {
  const createQueryBuilder = (): any => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    containedBy: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    then: vi.fn((onResolve: any) => onResolve({ data: null, error: null })),
  });

  return {
    from: vi.fn(() => createQueryBuilder()),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      getSession: vi
        .fn()
        .mockResolvedValue({ data: { session: null }, error: null }),
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi
          .fn()
          .mockResolvedValue({ data: { path: 'test' }, error: null }),
        getPublicUrl: vi
          .fn()
          .mockReturnValue({ data: { publicUrl: 'https://test.com' } }),
      })),
    },
  } as any; // Strategic any for complex external library
}
```

### Type Assertion for Supabase Results

```typescript
// ❌ BAD - Direct cast losing type safety
const result = mockSupabase.from.mockReturnValue(data);

// ✅ GOOD - Proper mock setup
vi.mocked(mockSupabase.from).mockReturnValue({
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({
    data: { id: '123', name: 'Test' } as Tables<'items'>,
    error: null,
  }),
} as any);
```

## Error Handling Patterns

### Discriminated Union Access

```typescript
// ❌ BAD - Direct error access
const result = await action(input);
expect(result.error).toBe('Error message'); // TS error

// ✅ GOOD - Type narrowing
const result = await action(input) as ActionResult;
expect(result.success).toBe(false);
if (!result.success) {
  expect(result.error).toBe('Error message');
}

// ✅ GOOD - Helper function
import { expectError } from '@/test/test-helpers';
const result = await action(input);
expectError(result, 'Error message');
```

### Try-Catch Type Safety

```typescript
// ❌ BAD - Unknown error type
try {
  await riskyOperation();
} catch (error) {
  expect(error.message).toBe('Failed'); // TS error
}

// ✅ GOOD - Type guard
try {
  await riskyOperation();
} catch (error) {
  expect(error).toBeInstanceOf(Error);
  if (error instanceof Error) {
    expect(error.message).toBe('Failed');
  }
}

// ✅ GOOD - Type assertion
catch (error) {
  const err = error as Error;
  expect(err.message).toBe('Failed');
}
```

## Type Assertion Patterns

### Double Casting for Complex Types

```typescript
// ❌ BAD - Direct incompatible cast
const data: SpecificType = complexObject; // TS error

// ✅ GOOD - Double cast through unknown
const data = complexObject as unknown as SpecificType;

// ✅ GOOD - With runtime validation
const data = validateAndCast<SpecificType>(complexObject);
```

### Mock Function Return Types

```typescript
// ❌ BAD - Losing type information
const mockFn = vi.fn();

// ✅ GOOD - Typed mock function
const mockFn = vi.fn<[InputType], Promise<OutputType>>();

// ✅ GOOD - With implementation
const mockFn = vi.fn().mockImplementation(
  async (input: InputType): Promise<OutputType> => {
    return { success: true, data: mockData };
  }
);
```

## Environment & Configuration

### Vitest Environment Variables

```typescript
// ❌ BAD - Direct assignment (fails in Vitest)
process.env.NODE_ENV = 'test';

// ✅ GOOD - Using vi.stubEnv
beforeEach(() => {
  vi.stubEnv('NODE_ENV', 'test');
  vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://test-api.com');
});

afterEach(() => {
  vi.unstubAllEnvs();
});
```

### Import Path Resolution

```typescript
// vitest.config.ts
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@/test': path.resolve(__dirname, './test'),
    },
  },
});
```

## Best Practices

### 1. Create Comprehensive Test Helpers

```typescript
// test/test-helpers.ts
export function castActionResult<T>(result: unknown): ActionResult<T> {
  if (!result || typeof result !== 'object') {
    throw new Error('Invalid action result');
  }
  return result as ActionResult<T>;
}

export function expectSuccess<T>(
  result: unknown,
): asserts result is { success: true; data?: T } {
  expect(result).toMatchObject({ success: true });
}

export function expectError(
  result: unknown,
  errorMessage?: string,
): asserts result is { success: false; error: string } {
  expect(result).toMatchObject({ success: false });
  if (errorMessage) {
    expect((result as any).error).toContain(errorMessage);
  }
}
```

### 2. Use Factory Functions for Test Data

```typescript
// Usage in tests
import { createMockQuiz, createMockUser } from '@/test/factories';

// test/factories/index.ts
export * from './quiz.factory';
export * from './user.factory';
export * from './course.factory';

const quiz = createMockQuiz({ title: 'Custom Quiz' });
const user = createMockUser({ role: 'admin' });
```

### 3. Type-Safe Mock Utilities

```typescript
// test/mocks/supabase.ts
export const mockSupabaseClient = createMockSupabaseClient();
export const mockSupabaseAdmin = createMockSupabaseClient();

// Re-export for convenience
export function setupSupabaseMocks() {
  vi.mock('@/lib/supabase/client', () => ({
    createClient: () => mockSupabaseClient,
  }));

  vi.mock('@/lib/supabase/admin', () => ({
    createAdminClient: () => mockSupabaseAdmin,
  }));
}
```

### 4. Consistent Error Patterns

```typescript
// Always use the same pattern for error handling
describe('Error Handling', () => {
  it('should handle validation errors', async () => {
    const result = (await action({ invalid: true })) as ActionResult;

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/validation/i);
    }
  });
});
```

### 5. Avoid Anti-Patterns

```typescript
// ❌ AVOID - Testing implementation details
expect(mockDb.query).toHaveBeenCalledWith('SELECT * FROM users');

// ✅ PREFER - Testing behavior
const users = await service.getUsers();
expect(users).toHaveLength(2);
expect(users[0]).toMatchObject({ name: 'Test User' });

// ❌ AVOID - Using any for everything
const mock = vi.fn() as any;

// ✅ PREFER - Proper typing with strategic any
const mock = vi.fn<[string], Promise<User>>()
  .mockResolvedValue(createMockUser());
```

## Summary

Key takeaways for TypeScript test patterns:

1. **Never use `any` types** - Use `unknown` with type assertions or proper types
2. **Remove underscore prefixes** from variables that are actually used
3. **Use type assertions** for action results: `as ActionResult<T>`
4. **Create comprehensive mocks** with all required properties
5. **Use factory functions** for consistent test data
6. **Handle discriminated unions** with type narrowing
7. **Mock at boundaries** (external dependencies, not internal code)
8. **Test public APIs** rather than private implementations
9. **Use test helpers** for common patterns
10. **Maintain type safety** throughout tests

These patterns ensure TypeScript compilation succeeds while maintaining test quality and readability.
