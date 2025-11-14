# Testing Fundamentals

**Purpose**: This document consolidates core testing principles, TypeScript patterns, and mocking strategies essential for writing reliable, type-safe tests in the SlideHeroes codebase.

## Core Testing Principles

### Tests Should Be

- **Fast** - Run in milliseconds, not seconds
- **Isolated** - No dependencies on external services or other tests
- **Deterministic** - Same input always produces same output
- **Focused** - Test one specific behavior per test
- **Readable** - Clear intent without needing to read implementation

### AAA Pattern (Arrange-Act-Assert)

Every test should follow this structure:

```typescript
it('should calculate total price with discount', () => {
  // Arrange - Set up test data
  const items = [{ price: 100 }, { price: 50 }];
  const discount = 0.1;

  // Act - Execute the behavior
  const total = calculateTotal(items, discount);

  // Assert - Verify the outcome
  expect(total).toBe(135); // (100 + 50) * 0.9
});
```

## Naming Conventions

### Test Suite Names

```typescript
// Good - Descriptive suite names
describe('UserAuthenticationService', () => {
describe('PricingCalculator - discount application', () => {

// Bad - Vague or redundant names
describe('Tests', () => {
describe('Service', () => {
```

### Test Case Names

```typescript
// Good - Behavior-focused descriptions
it('should return null when user is not found', () => {
it('should throw ValidationError for invalid email format', () => {
it('should calculate price including tax for Canadian users', () => {

// Bad - Implementation-focused or vague
it('test null', () => {
it('works correctly', () => {
it('calls database.findOne', () => {
```

## Common Anti-Patterns to Avoid

### Testing Implementation Details

```typescript
// Bad - Tests internal implementation
it('should call database.findOne with correct parameters', () => {
  service.getUser('123');
  expect(mockDb.findOne).toHaveBeenCalledWith({ id: '123' });
});

// Good - Tests behavior
it('should return user data for valid ID', async () => {
  const user = await service.getUser('123');
  expect(user).toEqual({ id: '123', name: 'Test User' });
});
```

### Multiple Unrelated Assertions

```typescript
// Bad - Too many unrelated assertions
it('should handle user creation', () => {
  const user = createUser(data);
  expect(user).toBeDefined();
  expect(user.id).toBeDefined();
  expect(user.email).toBe('test@example.com');
  expect(user.createdAt).toBeDefined();
  expect(mockDb.save).toHaveBeenCalled();
  expect(logger.info).toHaveBeenCalled();
});

// Good - Focused assertions
it('should create user with provided data', () => {
  const user = createUser({ email: 'test@example.com' });
  expect(user).toMatchObject({
    email: 'test@example.com',
    status: 'active',
  });
});

it('should generate unique ID for new user', () => {
  const user = createUser(data);
  expect(user.id).toMatch(/^usr_[a-z0-9]{16}$/);
});
```

## TypeScript Best Practices

### Avoid `any` Types

```typescript
// Bad - Loses type safety
const mockResponse: any = { data: 'test' };

// Good - Type-safe mock
const mockResponse: ApiResponse = {
  data: 'test',
  status: 200,
  headers: new Headers()
};
```

### Use Partial Types for Test Data

```typescript
// Helper function for creating test data
function createTestUser(overrides: Partial<User> = {}): User {
  return {
    id: 'test-id',
    email: 'test@example.com',
    name: 'Test User',
    createdAt: new Date('2024-01-01'),
    ...overrides,
  };
}

// Usage in tests
it('should format user display name', () => {
  const user = createTestUser({ name: 'John Doe' });
  expect(formatDisplayName(user)).toBe('John D.');
});
```

### Handle Async Operations

```typescript
// Always use async/await for clarity
it('should fetch user data', async () => {
  const userData = await fetchUser('123');
  expect(userData.name).toBe('Test User');
});

// Test rejected promises
it('should throw when user not found', async () => {
  await expect(fetchUser('invalid')).rejects.toThrow('User not found');
});
```

## Type-Safe Mocking

### Complete Type Mocks with Helpers

```typescript
// Bad - Incomplete mock causes TS errors
const mockUser = { id: '123', email: 'test@example.com' };

// Good - Complete mock with helper
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

### Mock Function Typing

```typescript
// Bad - Loses type information
const mockFn = vi.fn();

// Good - Typed mock
const mockFn = vi.fn<[InputType], Promise<OutputType>>();

// Good - With implementation
const mockFn = vi.fn().mockImplementation(
  async (input: InputType): Promise<OutputType> => {
    return { success: true, data: mockData };
  }
);
```

## Essential Testing Patterns

### Testing Pure Functions

```typescript
describe('formatCurrency', () => {
  it('should format USD amounts correctly', () => {
    expect(formatCurrency(1234.56, 'USD')).toBe('$1,234.56');
  });

  it('should handle zero amounts', () => {
    expect(formatCurrency(0, 'USD')).toBe('$0.00');
  });

  it('should round to 2 decimal places', () => {
    expect(formatCurrency(10.999, 'USD')).toBe('$11.00');
  });
});
```

### Testing Error Scenarios

```typescript
describe('validateEmail', () => {
  it('should throw ValidationError for invalid format', () => {
    expect(() => validateEmail('not-an-email')).toThrow(ValidationError);
    expect(() => validateEmail('not-an-email')).toThrow('Invalid email format');
  });

  it('should throw for empty string', () => {
    expect(() => validateEmail('')).toThrow('Email is required');
  });
});
```

### Testing React Components

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('Button', () => {
  it('should call onClick handler when clicked', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    await userEvent.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when loading', () => {
    render(<Button loading>Submit</Button>);

    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### Testing Server Actions

```typescript
describe('createUserAction', () => {
  it('should validate input data', async () => {
    const result = await createUserAction({
      email: 'invalid-email',
      name: '',
    });

    expect(result).toEqual({
      success: false,
      error: 'Validation failed',
      fieldErrors: {
        email: 'Invalid email format',
        name: 'Name is required',
      },
    });
  });

  it('should create user with valid data', async () => {
    const result = await createUserAction({
      email: 'test@example.com',
      name: 'Test User',
    });

    expect(result).toEqual({
      success: true,
      data: expect.objectContaining({
        id: expect.any(String),
        email: 'test@example.com',
      }),
    });
  });
});
```

## Vitest Mocking

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

## Project-Specific Patterns

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
  };

  const mockFrom = (table: string) => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  });

  return {
    auth: mockAuth,
    from: mockFrom,
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
```

## Test Utilities

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

### Environment Variable Mocking

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

## Test Organization

### Group Related Tests

```typescript
describe('UserService', () => {
  describe('authentication', () => {
    it('should authenticate valid credentials', () => {});
    it('should reject invalid password', () => {});
    it('should lock account after 5 failed attempts', () => {});
  });

  describe('profile management', () => {
    it('should update user profile', () => {});
    it('should validate profile data', () => {});
  });
});
```

### Use `beforeEach` for Common Setup

```typescript
describe('OrderService', () => {
  let service: OrderService;
  let mockDb: MockDatabase;

  beforeEach(() => {
    mockDb = createMockDatabase();
    service = new OrderService(mockDb);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create order', async () => {
    // Test uses fresh service instance
  });
});
```

## Key Patterns to Follow

1. **Never use `any` types** - Use `unknown` with type assertions
2. **Use type assertions** for action results: `as ActionResult<T>`
3. **Create factory functions** for consistent test data
4. **Handle discriminated unions** with type narrowing
5. **Mock at boundaries** (external dependencies only)
6. **Test behavior, not implementation** details

## Related Files

- `/apps/web/test/test-helpers.ts` - Core test utilities
- `/apps/web/test/test-types.d.ts` - Type definitions
- `/packages/vitest.config.base.ts` - Base Vitest configuration

## Summary

Focus on writing tests that:

1. Verify behavior, not implementation
2. Are easy to understand and maintain
3. Run quickly and reliably
4. Provide clear feedback when they fail
5. Follow consistent patterns across the codebase

Remember: The goal is to build confidence that the code works as intended, not to achieve 100% coverage.
