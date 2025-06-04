# Test-Driven Development

This document outlines the Test-Driven Development (TDD) approach used in the SlideHeroes project.

## What is TDD?

Test-Driven Development is a software development process that relies on the repetition of a very short development cycle:

1. Write a failing test that defines a desired improvement or new function
2. Run the test to verify that it fails
3. Write the minimum amount of code necessary to make the test pass
4. Run the test to verify that it passes
5. Refactor the code while ensuring the test still passes
6. Repeat

## The TDD Cycle: Red-Green-Refactor

### Red: Write a Failing Test

Start by writing a test that defines the functionality you want to implement. The test should fail because the functionality doesn't exist yet.

```typescript
// formatCurrency.test.ts
import { describe, it, expect } from 'vitest';
import { formatCurrency } from './formatCurrency';

describe('formatCurrency', () => {
  it('should format a number as USD currency', () => {
    const amount = 1234.56;
    const result = formatCurrency(amount);
    expect(result).toBe('$1,234.56');
  });
});
```

### Green: Make the Test Pass

Write the minimum amount of code necessary to make the test pass. Don't worry about code quality or optimization at this stage.

```typescript
// formatCurrency.ts
export function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
```

### Refactor: Improve the Code

Once the test passes, refactor the code to improve its quality while ensuring the test still passes.

```typescript
// formatCurrency.ts
export function formatCurrency(amount: number, currency = 'USD', locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}
```

## Benefits of TDD in Our Project

1. **Improved Code Quality**: Writing tests first forces you to think about the design of your code before implementing it.
2. **Better Documentation**: Tests serve as documentation for how your code should behave.
3. **Faster Feedback**: You get immediate feedback on whether your code works as expected.
4. **Reduced Debugging Time**: When a test fails, you know exactly what broke and where.
5. **Confidence in Refactoring**: Tests provide a safety net when refactoring code.
6. **Focus on Requirements**: Writing tests first helps you focus on what the code needs to do.

## When to Use TDD

TDD is particularly valuable in the following scenarios:

1. **Complex Business Logic**: When implementing complex business rules or algorithms
2. **Bug Fixes**: When fixing bugs, write a test that reproduces the bug first
3. **API Development**: When defining and implementing APIs
4. **Refactoring**: When refactoring existing code, ensure tests are in place first
5. **Performance Optimization**: When optimizing code, ensure tests verify the same behavior

## TDD for React Components

TDD can also be applied to React components:

```typescript
// Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('should render with the provided text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByText('Click me')).toBeDisabled();
  });
});
```

Then implement the component to make the tests pass:

```tsx
// Button.tsx
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function Button({ children, ...props }: ButtonProps) {
  return <button {...props}>{children}</button>;
}
```

## TDD for Custom Hooks

TDD can also be applied to custom hooks:

```typescript
// useCounter.test.ts
import { renderHook, act } from '@testing-library/react';
import { useCounter } from './useCounter';

describe('useCounter', () => {
  it('should initialize with the provided initial value', () => {
    const { result } = renderHook(() => useCounter(5));
    expect(result.current.count).toBe(5);
  });

  it('should increment the count', () => {
    const { result } = renderHook(() => useCounter());
    act(() => {
      result.current.increment();
    });
    expect(result.current.count).toBe(1);
  });

  it('should decrement the count', () => {
    const { result } = renderHook(() => useCounter(5));
    act(() => {
      result.current.decrement();
    });
    expect(result.current.count).toBe(4);
  });

  it('should not decrement below 0', () => {
    const { result } = renderHook(() => useCounter(0));
    act(() => {
      result.current.decrement();
    });
    expect(result.current.count).toBe(0);
  });
});
```

Then implement the hook to make the tests pass:

```typescript
// useCounter.ts
import { useState } from 'react';

export function useCounter(initialValue = 0) {
  const [count, setCount] = useState(initialValue);

  const increment = () => setCount((c) => c + 1);
  const decrement = () => setCount((c) => Math.max(0, c - 1));

  return { count, increment, decrement };
}
```

## Common TDD Pitfalls and How to Avoid Them

1. **Writing Too Many Tests**: Focus on testing behavior, not implementation details.
2. **Testing the Wrong Things**: Test the public API, not private implementation details.
3. **Brittle Tests**: Avoid testing implementation details that might change.
4. **Slow Tests**: Keep tests fast to maintain the TDD flow.
5. **Incomplete Test Coverage**: Ensure you test edge cases and error scenarios.
6. **Overreliance on Mocks**: Use real implementations when possible.
7. **Ignoring Refactoring**: Don't skip the refactoring step.

## TDD Workflow in Our Project

1. **Identify the Feature**: Clearly define what you're building.
2. **Write a Failing Test**: Start with a test that defines the expected behavior.
3. **Run the Test**: Verify that it fails for the expected reason.
4. **Implement the Feature**: Write the minimum code to make the test pass.
5. **Run the Test Again**: Verify that it passes.
6. **Refactor**: Improve the code while keeping the tests passing.
7. **Commit**: Commit your changes with a descriptive message.
8. **Repeat**: Move on to the next feature or edge case.

## Resources

- [Test-Driven Development: By Example](https://www.amazon.com/Test-Driven-Development-Kent-Beck/dp/0321146530) by Kent Beck
- [Growing Object-Oriented Software, Guided by Tests](https://www.amazon.com/Growing-Object-Oriented-Software-Guided-Tests/dp/0321503627) by Steve Freeman and Nat Pryce
- [React Testing Library Documentation](https://testing-library.com/docs/react-testing-library/intro/)
- [Vitest Documentation](https://vitest.dev/)