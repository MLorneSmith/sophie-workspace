# Unit Testing Patterns

This document outlines the standard patterns and practices for unit testing in the SlideHeroes project.

## Testing Framework

We use Vitest as our test runner for unit tests as specified in the project standards. Our testing stack includes:

- **Vitest**: Test runner and assertion library
- **@testing-library/react**: For testing React components
- **MSW (Mock Service Worker)**: For mocking API requests
- **@testing-library/user-event**: For simulating user interactions

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

## Testing Server Actions

Test Next.js server actions wrapped with `enhanceAction`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { myAction } from './server-actions';
import { enhanceAction } from '@kit/next/actions';

// Mock the enhanceAction wrapper
vi.mock('@kit/next/actions', () => ({
  enhanceAction: vi.fn((fn, options) => {
    return async (data: any) => {
      // Validate with schema if provided
      if (options?.schema) {
        const result = options.schema.safeParse(data);
        if (!result.success) {
          return { error: 'Validation failed' };
        }
      }
      // Call the actual function with validated data and mock user
      const mockUser = { id: '123', email: 'test@example.com' };
      return fn(result.data, mockUser);
    };
  }),
}));

describe('myAction', () => {
  it('should process valid data', async () => {
    const result = await myAction({ name: 'Test' });
    expect(result).toEqual({ success: true, data: expect.any(Object) });
  });

  it('should handle validation errors', async () => {
    const result = await myAction({ invalid: 'data' });
    expect(result).toEqual({ error: 'Validation failed' });
  });
});
```

## Testing with Supabase

### Testing Database Queries

```typescript
import { describe, it, expect, vi } from 'vitest';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { getCourses } from './courses';

vi.mock('@kit/supabase/server-client', () => ({
  getSupabaseServerClient: vi.fn(() => ({
    from: vi.fn((table: string) => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 1, title: 'Test Course' },
        error: null,
      }),
      throwOnError: vi.fn().mockReturnThis(),
    })),
  })),
}));

describe('getCourses', () => {
  it('should fetch courses from database', async () => {
    const courses = await getCourses();
    expect(courses).toHaveLength(1);
    expect(courses[0].title).toBe('Test Course');
  });
});
```

### Testing RLS Policies

RLS policies should be tested using the Supabase test framework:

```bash
pnpm supabase:web:test
```

Example RLS test file (`supabase/tests/database/courses.test.sql`):

```sql
begin;
select plan(3);

-- Test that users can only see their own courses
select tests.authenticate_as('user1');
select is(
  (select count(*) from courses where user_id = auth.uid()),
  2,
  'User can see their own courses'
);

select tests.authenticate_as('user2');
select is(
  (select count(*) from courses where user_id = 'user1_id'),
  0,
  'User cannot see other users courses'
);

select * from finish();
rollback;
```

## Testing React Server Components

```typescript
import { render } from '@testing-library/react';
import { CoursePage } from './page';

// Mock server-side data fetching
vi.mock('@/lib/courses', () => ({
  getCourse: vi.fn().mockResolvedValue({
    id: 1,
    title: 'Test Course',
    description: 'Test Description',
  }),
}));

describe('CoursePage', () => {
  it('should render course information', async () => {
    const { findByText } = render(await CoursePage({ params: { id: '1' } }));
    
    expect(await findByText('Test Course')).toBeInTheDocument();
    expect(await findByText('Test Description')).toBeInTheDocument();
  });
});
```

## Testing with React Query

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { useCoursesQuery } from './use-courses-query';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useCoursesQuery', () => {
  it('should fetch courses', async () => {
    const { result } = renderHook(() => useCoursesQuery(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toHaveLength(2);
  });
});
```

## Testing Forms with Zod Validation

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CourseForm } from './CourseForm';
import { z } from 'zod';

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
});

describe('CourseForm', () => {
  it('should show validation errors', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    
    render(<CourseForm onSubmit={onSubmit} />);
    
    // Submit empty form
    await user.click(screen.getByRole('button', { name: /submit/i }));
    
    // Check validation messages
    expect(await screen.findByText('Title is required')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('should submit valid data', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    
    render(<CourseForm onSubmit={onSubmit} />);
    
    // Fill form
    await user.type(screen.getByLabelText(/title/i), 'Test Course');
    await user.type(screen.getByLabelText(/description/i), 'This is a test description');
    
    // Submit form
    await user.click(screen.getByRole('button', { name: /submit/i }));
    
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        title: 'Test Course',
        description: 'This is a test description',
      });
    });
  });
});
```

## Testing i18n with Trans Component

```typescript
import { render } from '@testing-library/react';
import { Trans } from '@kit/ui/trans';

// Mock the translation provider
vi.mock('@kit/ui/trans', () => ({
  Trans: ({ i18nKey, defaults, values }: any) => {
    let text = defaults || i18nKey;
    if (values) {
      Object.entries(values).forEach(([key, value]) => {
        text = text.replace(`{{${key}}}`, value);
      });
    }
    return <span>{text}</span>;
  },
}));

describe('Component with translations', () => {
  it('should render translated text with interpolation', () => {
    const { getByText } = render(
      <Trans
        i18nKey="welcome.message"
        defaults="Welcome, {{name}}!"
        values={{ name: 'John' }}
      />
    );
    
    expect(getByText('Welcome, John!')).toBeInTheDocument();
  });
});
```

## Testing Authentication

```typescript
import { describe, it, expect, vi } from 'vitest';
import { requireUser } from '@kit/supabase/require-user';
import { redirect } from 'next/navigation';

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

vi.mock('@kit/supabase/server-client', () => ({
  getSupabaseServerClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: '123', email: 'test@example.com' } },
        error: null,
      }),
    },
  })),
}));

describe('requireUser', () => {
  it('should return user when authenticated', async () => {
    const user = await requireUser();
    expect(user).toEqual({ id: '123', email: 'test@example.com' });
  });

  it('should redirect when not authenticated', async () => {
    vi.mocked(getSupabaseServerClient).mockReturnValueOnce({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    });

    await requireUser();
    expect(redirect).toHaveBeenCalledWith('/auth/sign-in');
  });
});
```

## Continuous Integration

All tests are run in CI on every pull request. PRs with failing tests cannot be merged.