# Unit Testing Patterns

This document outlines the standard patterns and practices for unit testing in the SlideHeroes project.

## Testing Framework

We use Vite for unit tests as specified in the project standards. Our testing stack includes:

- **Vitest**: Test runner and assertion library
- **Testing Library**: For testing React components
- **MSW**: For mocking API requests
- **Sinon**: For spies, stubs, and mocks

## Directory Structure

Unit tests should be co-located with the code they test:

```
src/
  components/
    Button/
      Button.tsx
      Button.test.tsx
  utils/
    format.ts
    format.test.ts
```

## Naming Conventions

- Test files should have the same name as the file they test, with a `.test.ts` or `.test.tsx` extension
- Test suites should be named after the component or function they test
- Test cases should clearly describe the behavior being tested

## Test Structure

Follow the Arrange-Act-Assert (AAA) pattern:

```typescript
import { describe, it, expect } from 'vitest';
import { formatCurrency } from './format';

describe('formatCurrency', () => {
  it('should format a number as USD currency', () => {
    // Arrange
    const amount = 1234.56;
    
    // Act
    const result = formatCurrency(amount);
    
    // Assert
    expect(result).toBe('$1,234.56');
  });
});
```

## Component Testing

For React components, use Testing Library to test from a user's perspective:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('should call onClick when clicked', () => {
    // Arrange
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    // Act
    fireEvent.click(screen.getByText('Click me'));
    
    // Assert
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

## Mocking

### API Requests

Use MSW to mock API requests:

```typescript
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.get('/api/users', (req, res, ctx) => {
    return res(ctx.json([{ id: 1, name: 'John' }]));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Dependencies

Use Vitest's mocking capabilities for dependencies:

```typescript
import { vi } from 'vitest';
import { formatDate } from './date';
import { displayUserInfo } from './user';

vi.mock('./date', () => ({
  formatDate: vi.fn().mockReturnValue('2023-01-01')
}));

test('displayUserInfo formats the date', () => {
  const result = displayUserInfo({ name: 'John', date: new Date() });
  expect(formatDate).toHaveBeenCalled();
  expect(result).toContain('2023-01-01');
});
```

## Testing Hooks

Use `renderHook` from Testing Library to test custom hooks:

```typescript
import { renderHook, act } from '@testing-library/react';
import { useCounter } from './useCounter';

test('useCounter increments count', () => {
  const { result } = renderHook(() => useCounter());
  
  act(() => {
    result.current.increment();
  });
  
  expect(result.current.count).toBe(1);
});
```

## Testing Async Code

Use `async/await` for testing asynchronous code:

```typescript
test('fetchUserData returns user data', async () => {
  const userData = await fetchUserData(1);
  expect(userData).toEqual({ id: 1, name: 'John' });
});
```

## Error Testing

Always test error scenarios:

```typescript
test('throws an error for invalid input', () => {
  expect(() => validateEmail('')).toThrow('Email is required');
});
```

## Snapshot Testing

Use snapshot testing sparingly and only for stable components:

```typescript
test('matches snapshot', () => {
  const { container } = render(<Button>Click me</Button>);
  expect(container).toMatchSnapshot();
});
```

## Test Coverage

Aim for high test coverage of critical code paths. Run coverage reports regularly:

```bash
pnpm test --coverage
```

## Best Practices

1. **Test behavior, not implementation**: Focus on what the code does, not how it does it
2. **Keep tests simple**: Each test should verify one specific behavior
3. **Use descriptive test names**: Test names should clearly describe the behavior being tested
4. **Avoid test interdependence**: Tests should not depend on each other
5. **Clean up after tests**: Reset state between tests to avoid interference
6. **Test edge cases**: Consider boundary conditions and error scenarios
7. **Avoid testing third-party code**: Focus on testing your own code
8. **Keep tests fast**: Slow tests discourage frequent testing
9. **Use test doubles judiciously**: Only mock what you need to
10. **Refactor tests when needed**: Tests should be maintained like production code

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
```

## Continuous Integration

All tests are run in CI on every pull request. PRs with failing tests cannot be merged.