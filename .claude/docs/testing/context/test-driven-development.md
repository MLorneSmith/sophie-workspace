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

## TDD for Next.js Server Actions

Apply TDD when creating server actions:

```typescript
// server-actions.test.ts
import { describe, it, expect, vi } from 'vitest';
import { createCourseAction } from './server-actions';

describe('createCourseAction', () => {
  it('should create a course with valid data', async () => {
    const courseData = {
      title: 'Test Course',
      description: 'A comprehensive test course',
      price: 99.99,
    };
    
    const result = await createCourseAction(courseData);
    
    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      id: expect.any(String),
      ...courseData,
    });
  });

  it('should validate required fields', async () => {
    const invalidData = { title: '' };
    
    const result = await createCourseAction(invalidData);
    
    expect(result.error).toBe('Title is required');
  });
});
```

Then implement the server action:

```typescript
// server-actions.ts
'use server';

import { enhanceAction } from '@kit/next/actions';
import { z } from 'zod';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

const courseSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.number().positive('Price must be positive'),
});

export const createCourseAction = enhanceAction(
  async (data, user) => {
    const supabase = getSupabaseServerClient();
    
    const { data: course, error } = await supabase
      .from('courses')
      .insert({
        ...data,
        user_id: user.id,
      })
      .select()
      .single();
    
    if (error) {
      return { error: error.message };
    }
    
    return { success: true, data: course };
  },
  {
    schema: courseSchema,
  }
);
```

## TDD for Database Operations and RLS

Write tests for database operations and Row Level Security:

```typescript
// courses.test.ts
import { describe, it, expect } from 'vitest';
import { getCoursesByUser, updateCourse } from './courses';

describe('Courses Database Operations', () => {
  it('should only return courses owned by the user', async () => {
    const userId = 'user-123';
    const courses = await getCoursesByUser(userId);
    
    expect(courses.every(course => course.user_id === userId)).toBe(true);
  });

  it('should not allow updating courses owned by other users', async () => {
    const userId = 'user-123';
    const otherUserCourseId = 'course-456';
    
    const result = await updateCourse(otherUserCourseId, { title: 'Hacked!' }, userId);
    
    expect(result.error).toBe('Unauthorized');
  });
});
```

RLS Policy Test (in `supabase/tests/database/courses.test.sql`):

```sql
begin;
select plan(2);

-- Test that users can only update their own courses
select tests.authenticate_as('user1');
select is(
  (update courses set title = 'Updated' where id = 'user1-course-id' returning id),
  'user1-course-id',
  'User can update their own course'
);

select tests.authenticate_as('user2');
select throws_ok(
  'update courses set title = ''Hacked'' where id = ''user1-course-id''',
  'new row violates row-level security policy',
  'User cannot update other users courses'
);

select * from finish();
rollback;
```

## TDD for API Route Handlers

Test Next.js route handlers:

```typescript
// route.test.ts
import { describe, it, expect, vi } from 'vitest';
import { GET, POST } from './route';
import { NextRequest } from 'next/server';

describe('API Route /api/courses', () => {
  it('GET should return courses list', async () => {
    const request = new NextRequest('http://localhost:3000/api/courses');
    const response = await GET(request);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(Array.isArray(data.courses)).toBe(true);
  });

  it('POST should create a new course', async () => {
    const courseData = { title: 'New Course', description: 'Test' };
    const request = new NextRequest('http://localhost:3000/api/courses', {
      method: 'POST',
      body: JSON.stringify(courseData),
    });
    
    const response = await POST(request);
    const data = await response.json();
    
    expect(response.status).toBe(201);
    expect(data.course).toMatchObject(courseData);
  });

  it('POST should validate input', async () => {
    const request = new NextRequest('http://localhost:3000/api/courses', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    
    const response = await POST(request);
    
    expect(response.status).toBe(400);
  });
});
```

## TDD for React Server Components

Test React Server Components with async rendering:

```typescript
// CoursePage.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import CoursePage from './page';

// Mock data fetching
vi.mock('./actions', () => ({
  getCourse: vi.fn().mockResolvedValue({
    id: '1',
    title: 'Test Course',
    lessons: [
      { id: '1', title: 'Lesson 1' },
      { id: '2', title: 'Lesson 2' },
    ],
  }),
}));

describe('CoursePage', () => {
  it('should display course details', async () => {
    const { findByRole, findAllByRole } = render(
      await CoursePage({ params: { courseId: '1' } })
    );
    
    expect(await findByRole('heading', { name: 'Test Course' })).toBeInTheDocument();
    
    const lessons = await findAllByRole('listitem');
    expect(lessons).toHaveLength(2);
  });
});
```

## TDD for Form Validation with react-hook-form and Zod

```typescript
// ContactForm.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContactForm } from './ContactForm';

describe('ContactForm', () => {
  it('should show validation errors for invalid email', async () => {
    const user = userEvent.setup();
    render(<ContactForm onSubmit={vi.fn()} />);
    
    await user.type(screen.getByLabelText(/email/i), 'invalid-email');
    await user.click(screen.getByRole('button', { name: /submit/i }));
    
    expect(await screen.findByText('Invalid email address')).toBeInTheDocument();
  });

  it('should submit valid form data', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();
    render(<ContactForm onSubmit={handleSubmit} />);
    
    await user.type(screen.getByLabelText(/name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');
    await user.type(screen.getByLabelText(/message/i), 'Test message');
    
    await user.click(screen.getByRole('button', { name: /submit/i }));
    
    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Test message',
      });
    });
  });
});
```

## TDD for Middleware

Test Next.js middleware:

```typescript
// middleware.test.ts
import { describe, it, expect } from 'vitest';
import { middleware } from './middleware';
import { NextRequest } from 'next/server';

describe('Authentication Middleware', () => {
  it('should redirect unauthenticated users to login', async () => {
    const request = new NextRequest('http://localhost:3000/dashboard');
    // Mock no auth cookie
    
    const response = await middleware(request);
    
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('/auth/sign-in');
  });

  it('should allow authenticated users', async () => {
    const request = new NextRequest('http://localhost:3000/dashboard');
    // Mock auth cookie
    request.cookies.set('sb-auth-token', 'valid-token');
    
    const response = await middleware(request);
    
    expect(response).toBeUndefined(); // Middleware passes through
  });
});
```

## TDD for E2E Tests with Playwright

Apply TDD principles to E2E tests:

```typescript
// courses.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Course Management', () => {
  test('should create a new course', async ({ page }) => {
    // Arrange
    await page.goto('/dashboard/courses');
    
    // Act
    await page.click('text=New Course');
    await page.fill('[name="title"]', 'E2E Test Course');
    await page.fill('[name="description"]', 'This is an E2E test course');
    await page.click('text=Create Course');
    
    // Assert
    await expect(page.locator('text=E2E Test Course')).toBeVisible();
    await expect(page.locator('text=Course created successfully')).toBeVisible();
  });

  test('should validate course form', async ({ page }) => {
    await page.goto('/dashboard/courses/new');
    
    // Submit empty form
    await page.click('text=Create Course');
    
    // Should show validation errors
    await expect(page.locator('text=Title is required')).toBeVisible();
    await expect(page.locator('text=Description is required')).toBeVisible();
  });
});
```

## Resources

- [Test-Driven Development: By Example](https://www.amazon.com/Test-Driven-Development-Kent-Beck/dp/0321146530) by Kent Beck
- [Growing Object-Oriented Software, Guided by Tests](https://www.amazon.com/Growing-Object-Oriented-Software-Guided-Tests/dp/0321503627) by Steve Freeman and Nat Pryce
- [React Testing Library Documentation](https://testing-library.com/docs/react-testing-library/intro/)
- [Vitest Documentation](https://vitest.dev/)
- [Next.js Testing Documentation](https://nextjs.org/docs/app/building-your-application/testing)
- [Playwright Documentation](https://playwright.dev/)