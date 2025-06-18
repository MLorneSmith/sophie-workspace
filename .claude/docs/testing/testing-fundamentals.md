# Testing Fundamentals

This document consolidates the essential testing principles and patterns for the SlideHeroes project using Vitest.

## Core Testing Principles

### 1. Fast, Isolated, and Deterministic

**Fast**: Tests should execute in milliseconds, not seconds

- Mock external dependencies (databases, APIs, file systems)
- Avoid complex setup/teardown operations
- Keep tests focused and simple

**Isolated**: Each test must be independent

- No shared state between tests
- No dependencies on test execution order
- Clean up after each test

**Deterministic**: Same result every time

- Mock date/time with `vi.useFakeTimers()`
- Use seeds for random values
- Mock network calls and external services
- Provide test-specific environment variables

### 2. Test Behavior, Not Implementation

Focus on what the code does, not how it does it:

- Test through public APIs
- Avoid testing private methods directly
- Don't test framework internals or third-party libraries
- Verify outcomes, not internal state

### 3. The Right Amount of Testing

- Write enough tests to be confident
- Focus on critical paths and business logic
- Test edge cases and error scenarios
- Avoid testing trivial code

## The AAA Pattern (Arrange-Act-Assert)

Every test should follow this clear structure:

```typescript
test('calculates discount correctly for premium users', () => {
  // Arrange: Set up test data and conditions
  const user = { isPremium: true };
  const price = 100;

  // Act: Execute the code being tested
  const finalPrice = calculateDiscount(price, user);

  // Assert: Verify the outcome
  expect(finalPrice).toBe(80); // 20% discount
});
```

## Test Structure and Organization

### File Naming Conventions

```
src/
├── components/
│   ├── button.tsx
│   └── button.test.tsx          # Co-located unit tests
├── utils/
│   ├── format-date.ts
│   └── format-date.test.ts      # Co-located unit tests
└── __tests__/                   # Complex integration tests
    └── api-integration.test.ts
```

- **Unit Tests**: `.test.ts` or `.test.tsx`
- **Integration Tests**: `.integration.test.ts`
- **E2E Tests (Playwright)**: `.spec.ts`

### Test Suite Structure

```typescript
describe('ComponentName', () => {
  // Setup
  beforeEach(() => {
    // Common setup for all tests
  });

  afterEach(() => {
    // Cleanup after each test
  });

  // Basic functionality
  test('renders without crashing', () => {});

  // Props and state
  describe('props', () => {
    test('accepts and renders children', () => {});
  });

  // User interactions
  describe('user interactions', () => {
    test('handles click events', () => {});
  });

  // Edge cases
  describe('edge cases', () => {
    test('handles empty data gracefully', () => {});
  });
});
```

## Naming Conventions

### Test Suite Names

- **Components**: `describe('ComponentName', () => {})`
- **Functions**: `describe('functionName', () => {})`
- **Features**: `describe('Feature: Description', () => {})`

### Test Case Names

Use descriptive names that explain the behavior being tested:

```typescript
// State/Behavior Pattern
test('renders loading state when data is fetching', () => {});
test('displays error message when API call fails', () => {});

// Should Pattern
test('should calculate tax correctly for international orders', () => {});
test('should throw error when invalid email is provided', () => {});

// Given-When-Then Pattern (for complex scenarios)
test('given valid credentials, when user submits login, then redirects to dashboard', () => {});
```

### Naming Don'ts and Do's

❌ **Avoid:**

- `test('test button click', () => {})`
- `test('it works', () => {})`
- `test('component test', () => {})`
- `test('1', () => {})`

✅ **Prefer:**

- `test('emits onClick event with button id when clicked', () => {})`
- `test('validates email format before submission', () => {})`
- `test('displays placeholder text when value is empty', () => {})`

## TypeScript Best Practices

### Never Use `any` Type

```typescript
// ❌ Bad
const result = (await myAction(data)) as any;

// ✅ Good
const result = await myAction(data);
const validatedResult = ResultSchema.parse(result);
```

### Test Through Public Interfaces

```typescript
// ❌ Bad: Testing private methods
const result = (instance as any)._privateMethod();

// ✅ Good: Test through public API
const result = instance.doSomething(); // calls private method internally
```

### Proper Environment Variable Handling

```typescript
// ❌ Bad
process.env.NODE_ENV = 'development';

// ✅ Good
beforeEach(() => {
  vi.stubEnv('NODE_ENV', 'development');
});

afterEach(() => {
  vi.unstubAllEnvs();
});
```

## Essential Test Patterns

### Testing React Components

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';

describe('Button', () => {
  const mockOnClick = vi.fn();

  beforeEach(() => {
    mockOnClick.mockClear();
  });

  test('renders button text correctly', () => {
    render(<Button onClick={mockOnClick}>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  test('calls onClick handler when clicked', () => {
    render(<Button onClick={mockOnClick}>Click me</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });
});
```

### Testing Async Operations

```typescript
test('loads user data after component mounts', async () => {
  const userData = await fetchUserData(1);
  expect(userData).toEqual({ id: 1, name: 'John' });
});

// With React Testing Library
test('displays data after loading', async () => {
  render(<UserProfile userId="123" />);
  expect(await screen.findByText('John Doe')).toBeInTheDocument();
});
```

### Testing Error Scenarios

```typescript
test('throws an error for invalid input', () => {
  expect(() => validateEmail('')).toThrow('Email is required');
});

test('handles API errors gracefully', async () => {
  server.use(
    rest.get('/api/users', (req, res, ctx) => {
      return res(ctx.status(500), ctx.json({ error: 'Server error' }));
    })
  );

  render(<UserList />);
  expect(await screen.findByText('Failed to load users')).toBeInTheDocument();
});
```

### Testing Server Actions

```typescript
import { enhanceAction } from '@kit/next/actions';

// Mock the enhanceAction wrapper
vi.mock('@kit/next/actions', () => ({
  enhanceAction: vi.fn((fn, options) => {
    return async (data: any) => {
      if (options?.schema) {
        const result = options.schema.safeParse(data);
        if (!result.success) {
          return { error: 'Validation failed' };
        }
        data = result.data;
      }
      const mockUser = { id: '123', email: 'test@example.com' };
      return fn(data, mockUser);
    };
  }),
}));

test('should process valid data', async () => {
  const result = await myAction({ name: 'Test' });
  expect(result).toEqual({ success: true, data: expect.any(Object) });
});
```

## Test Utilities and Helpers

### Creating Test Fixtures

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

// Usage
const user = createTestUser({ email: 'custom@example.com' });
```

### Type-Safe Assertions

```typescript
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

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run a specific test file
pnpm test path/to/file.test.ts

# Run tests matching a pattern
pnpm test Button
```

## Key Takeaways

1. **Write Fast Tests**: Mock external dependencies, keep tests simple
2. **Ensure Isolation**: No shared state, clean up after tests
3. **Be Deterministic**: Mock time, random values, and external calls
4. **Follow AAA Pattern**: Arrange, Act, Assert
5. **Use Descriptive Names**: Test names should explain behavior
6. **Test Behavior**: Focus on public APIs, not implementation
7. **Handle TypeScript Properly**: No `any` types, test through interfaces
8. **Create Helpers**: Build reusable test utilities and fixtures

Remember: Good tests give you confidence to refactor and improve your code without fear of breaking functionality. Test names should tell a story about what your code does and why it matters.
