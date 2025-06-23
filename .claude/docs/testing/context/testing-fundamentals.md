# Testing Fundamentals

This document contains the essential testing principles and patterns for the SlideHeroes codebase.

## Core Testing Principles

### Tests Should Be

- **Fast** - Run in milliseconds, not seconds
- **Isolated** - No dependencies on external services or other tests
- **Deterministic** - Same input always produces same output
- **Focused** - Test one specific behavior per test
- **Readable** - Clear intent without needing to read implementation

## AAA Pattern (Arrange-Act-Assert)

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
// ✅ Good - Descriptive suite names
describe('UserAuthenticationService', () => {
describe('PricingCalculator - discount application', () => {

// ❌ Bad - Vague or redundant names
describe('Tests', () => {
describe('Service', () => {
```

### Test Case Names

```typescript
// ✅ Good - Behavior-focused descriptions
it('should return null when user is not found', () => {
it('should throw ValidationError for invalid email format', () => {
it('should calculate price including tax for Canadian users', () => {

// ❌ Bad - Implementation-focused or vague
it('test null', () => {
it('works correctly', () => {
it('calls database.findOne', () => {
```

### Common Anti-Patterns to Avoid

1. **Testing Implementation Details**

```typescript
// ❌ Bad - Tests internal implementation
it('should call database.findOne with correct parameters', () => {
  service.getUser('123');
  expect(mockDb.findOne).toHaveBeenCalledWith({ id: '123' });
});

// ✅ Good - Tests behavior
it('should return user data for valid ID', async () => {
  const user = await service.getUser('123');
  expect(user).toEqual({ id: '123', name: 'Test User' });
});
```

2. **Multiple Assertions Without Clear Purpose**

```typescript
// ❌ Bad - Too many unrelated assertions
it('should handle user creation', () => {
  const user = createUser(data);
  expect(user).toBeDefined();
  expect(user.id).toBeDefined();
  expect(user.email).toBe('test@example.com');
  expect(user.createdAt).toBeDefined();
  expect(mockDb.save).toHaveBeenCalled();
  expect(logger.info).toHaveBeenCalled();
});

// ✅ Good - Focused assertions
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
// ❌ Bad - Loses type safety
const mockResponse: any = { data: 'test' };

// ✅ Good - Type-safe mock
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
// ✅ Always use async/await for clarity
it('should fetch user data', async () => {
  const userData = await fetchUser('123');
  expect(userData.name).toBe('Test User');
});

// ✅ Test rejected promises
it('should throw when user not found', async () => {
  await expect(fetchUser('invalid')).rejects.toThrow('User not found');
});
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

### Testing React Components (Basic Pattern)

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

## Test Utilities

### Creating Test Fixtures

```typescript
// test-utils/fixtures.ts
export const fixtures = {
  user: (overrides?: Partial<User>): User => ({
    id: 'usr_test123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
    createdAt: new Date('2024-01-01'),
    ...overrides,
  }),

  order: (overrides?: Partial<Order>): Order => ({
    id: 'ord_test123',
    userId: 'usr_test123',
    items: [],
    total: 0,
    status: 'pending',
    ...overrides,
  }),
};
```

### Type-Safe Test Assertions

```typescript
// Custom matchers for domain objects
expect.extend({
  toBeValidUser(received: unknown) {
    const pass =
      typeof received === 'object' &&
      received !== null &&
      'id' in received &&
      'email' in received &&
      typeof received.email === 'string' &&
      received.email.includes('@');

    return {
      pass,
      message: () =>
        pass
          ? `Expected ${received} not to be a valid user`
          : `Expected ${received} to be a valid user`,
    };
  },
});

// Usage
it('should return valid user', async () => {
  const user = await createUser(data);
  expect(user).toBeValidUser();
});
```

## Environment Handling

```typescript
// Mock environment variables
describe('ConfigService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should use production API URL', () => {
    process.env.NODE_ENV = 'production';
    process.env.API_URL = 'https://api.production.com';

    const config = new ConfigService();
    expect(config.apiUrl).toBe('https://api.production.com');
  });
});
```

## Summary

Focus on writing tests that:

1. Verify behavior, not implementation
2. Are easy to understand and maintain
3. Run quickly and reliably
4. Provide clear feedback when they fail
5. Follow consistent patterns across the codebase

Remember: The goal is to build confidence that the code works as intended, not to achieve 100% coverage.
