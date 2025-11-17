# Mocking and TypeScript Testing Guide

This document consolidates all mocking strategies and TypeScript-specific testing patterns for the SlideHeroes codebase.

## Core Principles

1. **No `any` types** - Always use proper types or type assertions
2. **Complete mocks** - Mock all required properties to prevent TypeScript errors
3. **Mock at boundaries** - Mock external dependencies, not internal modules
4. **Test public APIs** - Don't test private methods or implementation details

## Essential Vitest Mocking

### Basic Module Mocking

```typescript
// Mock entire module
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

// Mock with factory function
vi.mock('@/lib/logger', () => {
  return {
    logger: {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
    },
  };
});

// Partial module mocking
vi.mock('next/navigation', async () => {
  const actual = await vi.importActual('next/navigation');
  return {
    ...actual,
    useRouter: vi.fn(() => mockRouter),
  };
});
```

### Hoisted Mocks

```typescript
// These run before imports
vi.mock('server-only', () => ({}));
vi.mock('@/lib/database', () => ({
  db: mockDb,
}));
```

## TypeScript-Safe Mock Patterns

### Complete Type Mocks with Helpers

```typescript
// ❌ Bad - Incomplete mock causes TS errors
const mockUser = { id: '123', email: 'test@example.com' };

// ✅ Good - Complete mock with helper
function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-123',
    email: 'test@example.com',
    aud: 'authenticated',
    role: 'authenticated',
    created_at: '2023-01-01T00:00:00.000Z',
    updated_at: '2023-01-01T00:00:00.000Z',
    email_confirmed_at: '2023-01-01T00:00:00.000Z',
    phone: null,
    confirmed_at: '2023-01-01T00:00:00.000Z',
    last_sign_in_at: '2023-01-01T00:00:00.000Z',
    app_metadata: {},
    user_metadata: {},
    identities: [],
    factors: [],
    ...overrides,
  } satisfies User;
}
```

### React Query Mock Helper

```typescript
// ✅ Complete UseQueryResult mock
function createMockUseQueryResult<T>(
  data: T | null,
  overrides: Partial<UseQueryResult<T, Error>> = {},
): UseQueryResult<T, Error> {
  return {
    data: data ?? undefined,
    error: null,
    isError: false,
    isPending: data === null,
    isLoading: false,
    isSuccess: data !== null,
    isStale: false,
    isFetched: true,
    isFetchedAfterMount: true,
    isFetching: false,
    isRefetching: false,
    isLoadingError: false,
    isPlaceholderData: false,
    isRefetchError: false,
    isInitialLoading: false,
    status: data !== null ? 'success' : 'pending',
    fetchStatus: 'idle',
    refetch: vi.fn(),
    remove: vi.fn(),
    dataUpdatedAt: Date.now(),
    errorUpdatedAt: 0,
    failureCount: 0,
    failureReason: null,
    errorUpdateCount: 0,
    promise: Promise.resolve(data as T),
    ...overrides,
  } satisfies UseQueryResult<T, Error>;
}
```

### Vitest Function Mocks

```typescript
// ❌ Bad - Too many generics
const mockFn = vi.fn<[RequestData], Promise<ResponseData>>();

// ✅ Good - Single generic for parameters
const mockFn = vi.fn<[RequestData]>();
mockFn.mockResolvedValue(responseData);

// ✅ Good - Type assertion for return value
const mockFn = vi.fn().mockResolvedValue(responseData as ResponseData);
```

## Project-Specific Mocks

### Supabase Client Mock

```typescript
import type { SupabaseClient } from '@supabase/supabase-js';

export function createMockSupabaseClient(): SupabaseClient {
  const mockAuth = {
    getUser: vi.fn().mockResolvedValue({
      data: { user: null },
      error: null,
    }),
    getSession: vi.fn().mockResolvedValue({
      data: { session: null },
      error: null,
    }),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    })),
  };

  const mockFrom = (table: string) => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  });

  const mockStorage = {
    from: vi.fn((bucket: string) => ({
      upload: vi
        .fn()
        .mockResolvedValue({ data: { path: 'test-path' }, error: null }),
      getPublicUrl: vi
        .fn()
        .mockReturnValue({ data: { publicUrl: 'https://test.com/file' } }),
      download: vi.fn(),
      remove: vi.fn(),
    })),
  };

  return {
    auth: mockAuth,
    from: mockFrom,
    storage: mockStorage,
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  } as unknown as SupabaseClient;
}
```

### Server Action Testing

```typescript
// Mock enhanceAction utility
vi.mock('@/lib/enhanceAction', () => ({
  enhanceAction: vi.fn((handler) => handler),
}));

// Test server action
describe('createStoryboardAction', () => {
  it('should validate input and create storyboard', async () => {
    const mockSupabase = createMockSupabaseClient();
    vi.mocked(createClient).mockReturnValue(mockSupabase);

    const result = await createStoryboardAction({
      title: 'Test Storyboard',
      description: 'Test Description',
    });

    expect(result).toEqual({
      success: true,
      data: expect.objectContaining({
        id: expect.any(String),
        title: 'Test Storyboard',
      }),
    });
  });
});
```

### Next.js Utilities

```typescript
// Navigation mocks
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  prefetch: vi.fn(),
};

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/test-path',
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
}));

// Headers mock
vi.mock('next/headers', () => ({
  headers: () => new Headers(),
  cookies: () => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  }),
}));

// Cache mock
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));
```

### Portkey AI Gateway Mock

```typescript
const mockPortkey = {
  completions: {
    create: vi.fn().mockResolvedValue({
      choices: [
        {
          message: {
            content: 'AI generated response',
            tool_calls: [],
          },
        },
      ],
    }),
  },
  generations: {
    create: vi.fn(),
  },
};

vi.mock('portkey-ai', () => ({
  Portkey: vi.fn(() => mockPortkey),
}));
```

## TypeScript Compilation Fixes

### Handle Underscore Variables

```typescript
// ❌ Bad - Unused var error
const [open, _setOpen] = useState(false);

// ✅ Good - Prefix with underscore
const [open, _setOpen] = useState(false);
// Then use: _ = _setOpen; // if needed to suppress warning
```

### Safe Property Access

```typescript
// ❌ Bad - Unsafe access
expect(result.content[0].type).toBe('paragraph');

// ✅ Good - Optional chaining
expect(result.content?.[0]?.type).toBe('paragraph');

// ✅ Good - With assertion
expect(result.content).toHaveLength(1);
expect(result.content[0]?.type).toBe('paragraph');
```

### Complex Type Casting

```typescript
// ❌ Bad - Direct incompatible cast
const jsonData: Json = complexObject;

// ✅ Good - Double cast for safety
const jsonData = complexObject as unknown as Json;

// ✅ Good - With validation
const jsonData = JSON.parse(JSON.stringify(complexObject)) as Json;
```

## Mock Factories

### Test Data Factory Pattern

```typescript
// factories/user.factory.ts
export const userFactory = {
  build: (overrides?: Partial<User>): User => ({
    id: `user_${Date.now()}`,
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }),

  buildList: (count: number, overrides?: Partial<User>): User[] =>
    Array.from({ length: count }, (_, i) =>
      userFactory.build({
        id: `user_${i}`,
        email: `test${i}@example.com`,
        ...overrides,
      }),
    ),

  buildAdmin: (overrides?: Partial<User>): User =>
    userFactory.build({ role: 'admin', ...overrides }),
};
```

## Environment Variable Mocking

```typescript
describe('Config Service', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      NODE_ENV: 'test',
      NEXT_PUBLIC_API_URL: 'https://test-api.com',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should use test environment', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });
});
```

## MSW Setup for API Mocking

```typescript
// mocks/handlers.ts
import { HttpResponse, http } from 'msw';
// Setup in test
import { setupServer } from 'msw/node';

export const handlers = [
  http.get('/api/user/:id', ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      name: 'Test User',
      email: 'test@example.com',
    });
  }),

  http.post('/api/storyboard', async ({ request }) => {
    const data = await request.json();
    return HttpResponse.json({
      success: true,
      data: { id: '123', ...data },
    });
  }),

  // Error response
  http.get('/api/error', () => {
    return HttpResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }),
];

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## Common Testing Pitfalls

### 1. Incomplete Mock Returns

```typescript
// ❌ Bad - Missing required properties
mockUseUser.mockReturnValue({ data: null });

// ✅ Good - Complete return value
mockUseUser.mockReturnValue(createMockUseQueryResult(null));
```

### 2. Wrong Mock Scope

```typescript
// ❌ Bad - Mocking internal implementation
vi.mock('./internal-helper');

// ✅ Good - Mock at the boundary
vi.mock('@/lib/external-service');
```

### 3. Type Safety in Assertions

```typescript
// ❌ Bad - Loses type safety
expect(result).toEqual(expect.any(Object));

// ✅ Good - Type-safe assertion
expect(result).toEqual<ApiResponse>({
  success: true,
  data: expect.objectContaining({
    id: expect.any(String),
    title: 'Test',
  }),
});
```

## Quick Reference

### Essential Commands

```bash
# Run tests
pnpm test

# Type check
pnpm typecheck

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage
```

### Mock Checklist

- [ ] All external dependencies mocked
- [ ] Mock returns complete types
- [ ] No `any` types in test code
- [ ] Server/client boundary respected
- [ ] Environment variables handled
- [ ] Async operations properly awaited
- [ ] Error cases tested
