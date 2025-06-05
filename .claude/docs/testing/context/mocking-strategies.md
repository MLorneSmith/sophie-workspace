# Mocking Strategies

This document outlines the mocking strategies for unit testing in the SlideHeroes project.

## Core Concepts

### Why Mock?
- **Isolate** code being tested from dependencies
- **Control** test conditions and edge cases
- **Speed up** tests by avoiding external dependencies
- **Test** error handling and hard-to-reproduce scenarios

### Types of Test Doubles
- **Stub**: Returns fixed values
- **Spy**: Records calls without changing behavior
- **Mock**: Pre-programmed with call expectations
- **Fake**: Working implementation with shortcuts

## Vitest Mocking Essentials

```typescript
import { vi } from 'vitest';

// Function mocks
const mockFn = vi.fn();
mockFn.mockReturnValue('value');
mockFn.mockResolvedValue({ data: 'async' });
mockFn.mockImplementation((a, b) => a + b);

// Module mocks
vi.mock('./module', () => ({
  myFunction: vi.fn().mockReturnValue('mocked')
}));

// Partial mocks
vi.mock('./utils', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, specificFn: vi.fn() };
});

// Spies
const spy = vi.spyOn(object, 'method');
```

## MSW for API Mocking

```typescript
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.get('/api/users', (req, res, ctx) => 
    res(ctx.json([{ id: 1, name: 'John' }]))
  ),
  rest.post('/api/users', async (req, res, ctx) => {
    const { name } = await req.json();
    return res(ctx.status(201), ctx.json({ id: 2, name }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## Project-Specific Mocks

### Supabase Client

```typescript
vi.mock('@kit/supabase/server-client', () => ({
  getSupabaseServerClient: vi.fn(() => ({
    from: vi.fn((table) => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      throwOnError: vi.fn().mockReturnThis(),
      data: null,
      error: null,
    })),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: '123', email: 'test@example.com' } },
        error: null,
      }),
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ data: { path: 'file.pdf' }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/file.pdf' } }),
      })),
    },
  })),
}));
```

### Server Actions (enhanceAction)

```typescript
vi.mock('@kit/next/actions', () => ({
  enhanceAction: vi.fn((fn, options) => {
    return async (data) => {
      // Validate with schema if provided
      if (options?.schema) {
        const result = options.schema.safeParse(data);
        if (!result.success) {
          return { error: 'Validation failed' };
        }
        data = result.data;
      }
      
      // Mock authenticated user
      const mockUser = { 
        id: '123', 
        email: 'test@example.com',
        aud: 'authenticated',
      };
      
      return fn(data, mockUser);
    };
  }),
}));
```

### Portkey AI Gateway

```typescript
vi.mock('@kit/ai-gateway', () => ({
  createAIGatewayClient: vi.fn((options) => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          id: 'chatcmpl-123',
          model: 'gpt-4',
          choices: [{
            message: {
              role: 'assistant',
              content: 'Mocked AI response',
            },
            finish_reason: 'stop',
          }],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 20,
            total_tokens: 30,
          },
        }),
      },
    },
  })),
}));
```

### Next.js Utilities

```typescript
// Navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  })),
  useParams: vi.fn(() => ({ id: '123' })),
  useSearchParams: vi.fn(() => new URLSearchParams('?query=test')),
  usePathname: vi.fn(() => '/test'),
  redirect: vi.fn(),
}));

// Headers
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn((name) => ({ name, value: 'mocked-value' })),
    set: vi.fn(),
  })),
  headers: vi.fn(() => new Headers({ 'x-test': 'mocked' })),
}));

// Cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));
```

### Common Browser APIs

```typescript
// localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// fetch
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ data: 'mocked' })
});
```

## Testing Patterns

### Testing with Mocked Supabase

```typescript
test('fetches courses', async () => {
  const mockClient = getSupabaseServerClient();
  mockClient.from.mockReturnValue({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnValue({
      data: [{ id: 1, title: 'Test Course' }],
      error: null
    })
  });

  const courses = await getCourses();
  expect(courses).toHaveLength(1);
  expect(mockClient.from).toHaveBeenCalledWith('courses');
});
```

### Testing Server Actions

```typescript
test('creates project with valid data', async () => {
  const result = await createProjectAction({ 
    name: 'Test Project',
    description: 'Test Description' 
  });
  
  expect(result.success).toBe(true);
  expect(result.data).toMatchObject({ name: 'Test Project' });
});

test('validates input', async () => {
  const result = await createProjectAction({ invalid: 'data' });
  expect(result.error).toBe('Validation failed');
});
```

### Testing with MSW

```typescript
test('handles API errors', async () => {
  server.use(
    rest.get('/api/users', (req, res, ctx) => 
      res(ctx.status(500), ctx.json({ message: 'Server error' }))
    )
  );

  await expect(fetchUsers()).rejects.toThrow('Server error');
});
```

## Best Practices

### When to Mock
- External APIs and databases
- Browser APIs (localStorage, fetch)
- Complex dependencies in unit tests
- Time-based or random behavior

### When NOT to Mock
- Pure functions
- Simple utilities
- Core business logic
- Integration tests

### Guidelines
1. **Mock at boundaries** - External services, not internal logic
2. **Keep mocks simple** - Minimum data needed for the test
3. **Verify calls** - Check arguments passed to mocks
4. **Reset between tests** - Use `beforeEach(() => vi.resetAllMocks())`
5. **Test error paths** - Mock both success and failure scenarios

### TypeScript Support

```typescript
import { type Mock } from 'vitest';
import { type SupabaseClient } from '@supabase/supabase-js';

// Type-safe mock creation
const createMockSupabaseClient = (): SupabaseClient => {
  return {
    from: vi.fn(),
    auth: { getUser: vi.fn() },
  } as unknown as SupabaseClient;
};
```

## Quick Reference

```typescript
// Reset all mocks
beforeEach(() => {
  vi.resetAllMocks();
});

// Restore original implementations
afterEach(() => {
  vi.restoreAllMocks();
});

// Clear mock history
mockFn.mockClear();

// Check mock calls
expect(mockFn).toHaveBeenCalledWith('arg');
expect(mockFn).toHaveBeenCalledTimes(2);
expect(mockFn.mock.calls[0][0]).toBe('first call arg');
```
