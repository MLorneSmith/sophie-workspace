# Unit Testing Naming Convention and Best Practices

This document outlines the recommended naming conventions and best practices for unit tests in the SlideHeroes project using Vitest as the testing framework.

## File Naming Conventions

### Test File Extensions
- **Unit Tests (Vitest)**: Use `.test.ts` or `.test.tsx` extension
- **E2E Tests (Playwright)**: Use `.spec.ts` extension
- **Integration Tests**: Use `.integration.test.ts` extension

### Test File Location
```
src/
├── components/
│   ├── button.tsx
│   └── button.test.tsx          # Co-located with source
├── utils/
│   ├── format-date.ts
│   └── format-date.test.ts      # Co-located with source
└── __tests__/                   # Alternative: centralized tests
    └── complex-integration.test.ts
```

## Test Suite and Case Naming

### Describe Blocks
Use `describe()` to group related tests. Follow this pattern:
- **Component tests**: `describe('ComponentName', () => {})`
- **Function tests**: `describe('functionName', () => {})`
- **Feature tests**: `describe('Feature: Description', () => {})`

### Test Case Naming
Use `test()` or `it()` with descriptive names following these patterns:

#### State/Behavior Pattern
```typescript
test('renders loading state when data is fetching', () => {});
test('displays error message when API call fails', () => {});
test('submits form when all fields are valid', () => {});
```

#### Given-When-Then Pattern
```typescript
test('given valid credentials, when user submits login, then redirects to dashboard', () => {});
```

#### Should Pattern
```typescript
test('should calculate tax correctly for international orders', () => {});
test('should throw error when invalid email is provided', () => {});
```

## Naming Examples

### Component Tests
```typescript
// button.test.tsx
describe('Button', () => {
  test('renders with default props', () => {});
  test('displays loading spinner when isLoading is true', () => {});
  test('calls onClick handler when clicked', () => {});
  test('is disabled when disabled prop is true', () => {});
  
  describe('variants', () => {
    test('applies primary styles when variant="primary"', () => {});
    test('applies secondary styles when variant="secondary"', () => {});
  });
});
```

### Hook Tests
```typescript
// use-debounce.test.ts
describe('useDebounce', () => {
  test('returns initial value immediately', () => {});
  test('debounces value changes by specified delay', () => {});
  test('cancels pending updates on unmount', () => {});
});
```

### Utility Function Tests
```typescript
// format-date.test.ts
describe('formatDate', () => {
  test('formats date in default locale', () => {});
  test('formats date in specified locale', () => {});
  test('returns "Invalid Date" for invalid input', () => {});
  
  describe('edge cases', () => {
    test('handles null values', () => {});
    test('handles undefined values', () => {});
    test('handles timestamp strings', () => {});
  });
});
```

### Server Action Tests
```typescript
// server-actions.test.ts
describe('createProject server action', () => {
  test('creates project with valid data', () => {});
  test('validates required fields', () => {});
  test('enforces user permissions', () => {});
  test('returns error for duplicate project names', () => {});
});
```

## Core Testing Principles

### 1. Tests Should Be Fast
- Keep tests simple and focused
- Mock external dependencies (databases, APIs, file systems)
- Avoid complex setup or teardown operations
- Each test should run in milliseconds, not seconds

### 2. Tests Should Be Isolated
- Each test must be independent and not rely on other tests
- Don't test external dependencies directly
- Focus on testing behavior, not implementation details
- Avoid testing side effects - test the outcomes instead

### 3. Tests Should Be Deterministic
- Tests must produce the same result every time they run
- Avoid dependencies on:
  - Current date/time (mock it)
  - Random values (use seeds)
  - Network calls (mock them)
  - File system state
  - Environment variables (provide test values)

### 4. Use the Arrange-Act-Assert Pattern
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

## Best Practices

### 1. Descriptive Test Names
- Be specific about what is being tested
- Include the condition and expected outcome
- Use descriptive variable names in tests
- Avoid generic names like "works correctly" or "test 1"

### 2. Consistent Structure
```typescript
describe('ComponentName', () => {
  // Setup
  beforeEach(() => {
    // Common setup
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

### 3. Keep Tests Simple and Maintainable
- Write tests with low cyclomatic complexity
- Don't duplicate implementation logic in tests
- Test the right amount - not too much, not too little
- Avoid testing framework internals or third-party libraries

### 4. Test Doubles and Mocking
```typescript
// Use appropriate test doubles
import { vi } from 'vitest';

// Stub: Provides canned responses
const fetchStub = vi.fn().mockResolvedValue({ data: 'test' });

// Spy: Records how it was called
const logSpy = vi.spyOn(console, 'log');

// Mock: Combines stub and spy capabilities
const apiMock = vi.mock('./api', () => ({
  fetchUser: vi.fn().mockResolvedValue({ id: 1, name: 'Test' })
}));
```

### 5. Ensure Tests Can Fail
Always verify that your test is capable of failing:
```typescript
// Bad: This test will always pass
test('validates email', () => {
  const isValid = validateEmail('test@example.com');
  expect(isValid).toBe(isValid); // Always true!
});

// Good: This test can fail
test('validates email format', () => {
  const isValid = validateEmail('test@example.com');
  expect(isValid).toBe(true);
});
```

### 6. Naming Don'ts and Do's
❌ Avoid:
- `test('test button click', () => {})`
- `test('it works', () => {})`
- `test('component test', () => {})`
- `test('1', () => {})`

✅ Prefer:
- `test('emits onClick event with button id when clicked', () => {})`
- `test('validates email format before submission', () => {})`
- `test('displays placeholder text when value is empty', () => {})`

### 7. Special Test Categories
```typescript
// Performance tests
test('[PERF] renders 1000 items without lag', () => {});

// Accessibility tests
test('[A11Y] has proper ARIA labels for screen readers', () => {});

// Security tests
test('[SEC] sanitizes user input to prevent XSS', () => {});
```

### 8. Async Test Naming
```typescript
// For async operations, be clear about the async nature
test('loads user data after component mounts', async () => {});
test('waits for debounce before calling API', async () => {});
test('retries failed requests up to 3 times', async () => {});
```

## Test Organization

### Feature-Based Structure
```
features/
├── authentication/
│   ├── components/
│   │   ├── login-form.tsx
│   │   └── login-form.test.tsx
│   └── hooks/
│       ├── use-auth.ts
│       └── use-auth.test.ts
```

### Type-Based Structure
```
src/
├── components/
│   └── __tests__/
├── hooks/
│   └── __tests__/
├── utils/
│   └── __tests__/
└── services/
    └── __tests__/
```

## Integration with CI/CD

### Build Process Integration
- Ensure tests are part of the build process (`pnpm test`)
- Tests should fail the build if they don't pass
- Use `turbo test` to run tests across all packages
- Set up pre-commit hooks to run relevant tests

### Test Tagging
Use consistent naming for test filtering:
```typescript
// Skip in CI
test.skip('[FLAKY] intermittent network test', () => {});

// Only run in specific environments
test.runIf(process.env.NODE_ENV === 'test')('[INT] database integration', () => {});
```

### Coverage Requirements
Name tests to clearly indicate what code paths they cover:
```typescript
describe('ErrorBoundary', () => {
  test('catches and displays render errors', () => {});
  test('catches and displays async errors', () => {});
  test('resets error state when location changes', () => {});
  test('logs errors to monitoring service', () => {});
});
```

## Writing Effective Tests

### Example: Testing a React Component
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { Button } from './button';

describe('Button', () => {
  // Arrange: Set up mocks once
  const mockOnClick = vi.fn();
  
  beforeEach(() => {
    mockOnClick.mockClear();
  });
  
  test('renders button text correctly', () => {
    // Act
    render(<Button onClick={mockOnClick}>Click me</Button>);
    
    // Assert
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });
  
  test('calls onClick handler when clicked', () => {
    // Arrange
    render(<Button onClick={mockOnClick}>Click me</Button>);
    const button = screen.getByRole('button');
    
    // Act
    fireEvent.click(button);
    
    // Assert
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });
});
```

### Example: Testing a Utility Function
```typescript
import { vi } from 'vitest';
import { formatRelativeTime } from './format-relative-time';

describe('formatRelativeTime', () => {
  beforeEach(() => {
    // Mock current time for deterministic tests
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T12:00:00Z'));
  });
  
  afterEach(() => {
    vi.useRealTimers();
  });
  
  test('formats time less than a minute ago as "just now"', () => {
    const thirtySecondsAgo = new Date('2024-01-01T11:59:30Z');
    expect(formatRelativeTime(thirtySecondsAgo)).toBe('just now');
  });
  
  test('formats time in hours for same day', () => {
    const twoHoursAgo = new Date('2024-01-01T10:00:00Z');
    expect(formatRelativeTime(twoHoursAgo)).toBe('2 hours ago');
  });
});
```

## Summary

Following these naming conventions and best practices ensures:

### Benefits
1. **Discoverability**: Easy to find tests for specific features
2. **Clarity**: Clear understanding of what each test validates
3. **Maintainability**: Consistent patterns make tests easier to update
4. **Documentation**: Test names serve as living documentation
5. **Debugging**: Failed test names immediately indicate the problem
6. **Reliability**: Tests that are fast, isolated, and deterministic
7. **Confidence**: Tests that actually verify behavior and can fail

### Key Takeaways
- Use Vitest for unit testing with `.test.ts` extension
- Write fast, isolated, and deterministic tests
- Follow the Arrange-Act-Assert pattern
- Use descriptive names that explain the behavior being tested
- Mock external dependencies appropriately
- Ensure tests are part of the build process
- Keep tests simple and focused on behavior, not implementation

Remember: Test names should tell a story about what your code does and why it matters. Good tests give you confidence to refactor and improve your code without fear of breaking functionality.