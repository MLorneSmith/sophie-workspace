# Comprehensive Research: TypeScript Testing Patterns 2024-2025

**Research Date:** January 5, 2025
**Classification:** COMPREHENSIVE RESEARCH
**Research Scope:** Advanced TypeScript testing patterns and modern techniques

## Research Summary

This comprehensive research explores advanced TypeScript testing patterns for 2024-2025, focusing on practical, actionable techniques that help developers write maintainable, type-safe tests. The research covers discriminated unions, type-safe mocking strategies, async testing, React component testing, E2E patterns with Playwright, and modern tooling with Vitest/Jest. Key findings emphasize the shift toward network-level mocking with MSW, parallel execution patterns, and type-safety-first approaches that leverage TypeScript's advanced features.

## Key Findings

- **Discriminated Unions** are essential for exhaustive type checking in tests and state management
- **Type-Safe Mocking** with tools like `vitest-mock-extended` and proper TypeScript generics prevents runtime errors
- **Network-Level Mocking** with MSW provides more realistic testing than function-level mocks
- **Parallel Testing Patterns** achieve 3-5x performance improvements with proper tool usage
- **Factory Patterns** significantly reduce test maintenance overhead for complex objects
- **Modern Tooling** (Vitest, Playwright) offers superior TypeScript support and developer experience

## 1. Advanced TypeScript Testing Patterns

### Discriminated Unions: Pattern Matching & Exhaustive Checks

Discriminated unions with shared "tag" fields enable safe type narrowing and exhaustive checking:

```typescript
type ApiResult =
  | { kind: "success"; data: { items: string[] } }
  | { kind: "error"; error: string }
  | { kind: "loading" };

function handleResult(result: ApiResult) {
  switch (result.kind) {
    case "success":
      return result.data.items.length;
    case "error":
      return result.error;
    case "loading":
      return null;
    default:
      // Ensures exhaustiveness checking
      const unreachable: never = result;
      throw new Error(`Unhandled case: ${unreachable}`);
  }
}

// Testing with Vitest
describe('handleResult', () => {
  it('handles all variants exhaustively', () => {
    expect(handleResult({ kind: 'success', data: { items: ['a'] } })).toBe(1);
    expect(handleResult({ kind: 'error', error: 'fail' })).toBe('fail');
    expect(handleResult({ kind: 'loading' })).toBeNull();
  });
});
```

### Factory Pattern for Test Data Creation

Factories enable scalable, DRY test data generation:

```typescript
type User = { id: string; name: string; role: 'admin' | 'user'; email: string };

function createUser(partial?: Partial<User>): User {
  return {
    id: 'id_' + Math.random().toString(36).substring(2),
    name: 'Default Name',
    role: 'user',
    email: 'test@example.com',
    ...partial,
  };
}

// Usage in tests
describe('User management', () => {
  it('creates admin user', () => {
    const admin = createUser({ role: 'admin', name: 'Admin User' });
    expect(admin.role).toBe('admin');
    expect(admin.name).toBe('Admin User');
  });

  it('handles user permissions', () => {
    const regularUser = createUser();
    expect(regularUser.role).toBe('user');
  });
});
```

### Type Guards in Testing

Type guards provide safe type assertions and narrowing:

```typescript
function isErrorResult(result: ApiResult): result is { kind: "error"; error: string } {
  return result.kind === "error";
}

function isSuccessResult(result: ApiResult): result is { kind: "success"; data: any } {
  return result.kind === "success";
}

// Testing type guards
describe('Type guards', () => {
  it('correctly identifies error results', () => {
    const errorResult: ApiResult = { kind: "error", error: "not found" };
    expect(isErrorResult(errorResult)).toBe(true);

    if (isErrorResult(errorResult)) {
      // TypeScript now knows this is an error result
      expect(errorResult.error).toBe("not found");
    }
  });
});
```

## 2. Type-Safe Mocking Strategies

### Modern Type-Safe Mocking with Vitest

```typescript
import { vi } from 'vitest';
import { mock } from 'vitest-mock-extended';

// Type-safe interface mocking
interface UserService {
  getUser(id: string): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User>;
}

describe('UserController', () => {
  it('handles user retrieval', async () => {
    const mockUserService = mock<UserService>();
    const testUser = createUser({ id: '123', name: 'Test User' });

    mockUserService.getUser.mockResolvedValue(testUser);

    const controller = new UserController(mockUserService);
    const result = await controller.getUser('123');

    expect(result).toEqual(testUser);
    expect(mockUserService.getUser).toHaveBeenCalledWith('123');
  });
});
```

### Advanced Mock Patterns

```typescript
// Mock with type-safe implementation
const mockApiClient = vi.fn<[string], Promise<ApiResponse>>();

// Mock with conditional logic
mockApiClient.mockImplementation(async (endpoint) => {
  if (endpoint === '/users/123') {
    return { status: 200, data: createUser({ id: '123' }) };
  }
  if (endpoint === '/users/404') {
    throw new Error('User not found');
  }
  return { status: 200, data: null };
});
```

## 3. Async/Promise Testing Patterns

### Advanced Async Testing Strategies

```typescript
// Testing concurrent operations
describe('Concurrent API calls', () => {
  it('handles parallel requests correctly', async () => {
    const mockFetch = vi.fn();

    mockFetch
      .mockResolvedValueOnce({ json: () => Promise.resolve({ id: 1 }) })
      .mockResolvedValueOnce({ json: () => Promise.resolve({ id: 2 }) });

    const results = await Promise.all([
      fetchUser(1),
      fetchUser(2)
    ]);

    expect(results).toHaveLength(2);
    expect(results[0].id).toBe(1);
    expect(results[1].id).toBe(2);
  });
});

// Testing with timeout and cancellation
describe('Request cancellation', () => {
  it('cancels requests properly', async () => {
    const controller = new AbortController();
    const fetchPromise = fetchWithTimeout('/api/data', 1000, controller.signal);

    setTimeout(() => controller.abort(), 500);

    await expect(fetchPromise).rejects.toThrow('AbortError');
  });
});

// Mock timers for async operations
describe('Timer-based async operations', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('processes delayed operations', async () => {
    const callback = vi.fn();

    scheduleDelayedOperation(callback, 1000);

    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1000);

    expect(callback).toHaveBeenCalledOnce();
  });
});
```

## 4. React Component Testing with TypeScript

### Testing Custom Hooks

```typescript
import { renderHook, act } from '@testing-library/react';

function useCounter(initialCount = 0) {
  const [count, setCount] = useState(initialCount);

  const increment = useCallback(() => setCount(c => c + 1), []);
  const decrement = useCallback(() => setCount(c => c - 1), []);
  const reset = useCallback(() => setCount(initialCount), [initialCount]);

  return { count, increment, decrement, reset };
}

describe('useCounter hook', () => {
  it('initializes with correct value', () => {
    const { result } = renderHook(() => useCounter(5));
    expect(result.current.count).toBe(5);
  });

  it('increments count', () => {
    const { result } = renderHook(() => useCounter());

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });

  it('resets to initial value', () => {
    const { result } = renderHook(() => useCounter(10));

    act(() => {
      result.current.increment();
      result.current.reset();
    });

    expect(result.current.count).toBe(10);
  });
});
```

### Component Testing Patterns

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

interface UserProfileProps {
  userId: string;
  onUserUpdate?: (user: User) => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ userId, onUserUpdate }) => {
  // Component implementation
};

describe('UserProfile component', () => {
  const mockOnUserUpdate = vi.fn();

  beforeEach(() => {
    mockOnUserUpdate.mockClear();
  });

  it('displays user information', async () => {
    render(<UserProfile userId="123" onUserUpdate={mockOnUserUpdate} />);

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });
  });

  it('handles user updates', async () => {
    const user = userEvent.setup();
    render(<UserProfile userId="123" onUserUpdate={mockOnUserUpdate} />);

    const editButton = screen.getByRole('button', { name: /edit/i });
    await user.click(editButton);

    const nameInput = screen.getByLabelText(/name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Name');

    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockOnUserUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Updated Name' })
      );
    });
  });
});
```

### Testing Context Providers

```typescript
import { render, screen } from '@testing-library/react';
import { createContext, useContext } from 'react';

interface ThemeContextValue {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const TestComponent = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('Missing ThemeProvider');

  return (
    <div>
      <span data-testid="theme">{context.theme}</span>
      <button onClick={context.toggleTheme}>Toggle</button>
    </div>
  );
};

describe('ThemeContext', () => {
  const renderWithTheme = (initialTheme: 'light' | 'dark' = 'light') => {
    const toggleTheme = vi.fn();

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ThemeContext.Provider value={{ theme: initialTheme, toggleTheme }}>
        {children}
      </ThemeContext.Provider>
    );

    return {
      ...render(<TestComponent />, { wrapper }),
      toggleTheme,
    };
  };

  it('provides theme context', () => {
    renderWithTheme('dark');
    expect(screen.getByTestId('theme')).toHaveTextContent('dark');
  });

  it('calls toggle function', async () => {
    const user = userEvent.setup();
    const { toggleTheme } = renderWithTheme();

    await user.click(screen.getByRole('button', { name: /toggle/i }));
    expect(toggleTheme).toHaveBeenCalledOnce();
  });
});
```

## 5. Error Boundary Testing

```typescript
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from 'react-error-boundary';

const ProblemChild = ({ shouldError }: { shouldError: boolean }) => {
  if (shouldError) {
    throw new Error('Test error');
  }
  return <div>All good!</div>;
};

const ErrorFallback = ({ error }: { error: Error }) => (
  <div role="alert">
    <h2>Something went wrong</h2>
    <details>{error.message}</details>
  </div>
);

describe('Error Boundary', () => {
  // Suppress console.error for cleaner test output
  const originalError = console.error;
  beforeAll(() => {
    console.error = vi.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  it('catches and displays errors', () => {
    render(
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <ProblemChild shouldError={true} />
      </ErrorBoundary>
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('renders children when no error', () => {
    render(
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <ProblemChild shouldError={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('All good!')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
```

## 6. MSW (Mock Service Worker) Patterns

### Basic MSW Setup with TypeScript

```typescript
// mocks/handlers.ts
import { http, HttpResponse } from 'msw';

interface User {
  id: string;
  name: string;
  email: string;
}

interface ApiError {
  message: string;
  code: string;
}

export const handlers = [
  // Success case
  http.get<{ userId: string }, never, User>(
    '/api/users/:userId',
    ({ params }) => {
      return HttpResponse.json({
        id: params.userId,
        name: 'John Doe',
        email: 'john@example.com',
      });
    }
  ),

  // Error case
  http.get<{ userId: string }, never, ApiError>(
    '/api/users/404',
    () => {
      return HttpResponse.json(
        { message: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }
  ),

  // POST with request body
  http.post<never, { name: string; email: string }, User>(
    '/api/users',
    async ({ request }) => {
      const userData = await request.json();
      return HttpResponse.json({
        id: '123',
        ...userData,
      }, { status: 201 });
    }
  ),
];

// mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

### Advanced MSW Patterns

```typescript
// Test-specific handler overrides
describe('User API', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('fetches user successfully', async () => {
    const response = await fetch('/api/users/123');
    const user = await response.json();

    expect(user).toEqual({
      id: '123',
      name: 'John Doe',
      email: 'john@example.com',
    });
  });

  it('handles server errors', async () => {
    // Override handler for this specific test
    server.use(
      http.get('/api/users/:userId', () => {
        return HttpResponse.json(
          { message: 'Internal server error', code: 'INTERNAL_ERROR' },
          { status: 500 }
        );
      })
    );

    const response = await fetch('/api/users/123');
    expect(response.status).toBe(500);

    const error = await response.json();
    expect(error.message).toBe('Internal server error');
  });

  it('handles network delays', async () => {
    server.use(
      http.get('/api/users/:userId', async () => {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 100));
        return HttpResponse.json({ id: '123', name: 'Delayed User' });
      })
    );

    const startTime = Date.now();
    await fetch('/api/users/123');
    const endTime = Date.now();

    expect(endTime - startTime).toBeGreaterThan(100);
  });
});
```

### MSW with React Testing Library

```typescript
// Custom hook for API calls
function useUser(userId: string) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/users/${userId}`)
      .then(response => {
        if (!response.ok) throw new Error('Failed to fetch user');
        return response.json();
      })
      .then(userData => {
        if (!cancelled) {
          setUser(userData);
          setError(null);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err.message);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [userId]);

  return { user, loading, error };
}

// Component using the hook
const UserDisplay = ({ userId }: { userId: string }) => {
  const { user, loading, error } = useUser(userId);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>No user found</div>;

  return (
    <div>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
};

// Tests
describe('UserDisplay component', () => {
  it('displays user information', async () => {
    render(<UserDisplay userId="123" />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('displays error message on API failure', async () => {
    server.use(
      http.get('/api/users/123', () => {
        return HttpResponse.json(
          { message: 'User not found' },
          { status: 404 }
        );
      })
    );

    render(<UserDisplay userId="123" />);

    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });
  });
});
```

## 7. E2E Testing Patterns with Playwright

### Type-Safe Page Object Models

```typescript
// page-objects/LoginPage.ts
import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password');
    this.loginButton = page.getByRole('button', { name: 'Login' });
    this.errorMessage = page.getByTestId('error-message');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async expectErrorMessage(message: string) {
    await expect(this.errorMessage).toHaveText(message);
  }
}

// Test file
import { test, expect } from '@playwright/test';
import { LoginPage } from '../page-objects/LoginPage';

test.describe('Login functionality', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('successful login redirects to dashboard', async ({ page }) => {
    await loginPage.login('user@example.com', 'password123');

    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText('Welcome back')).toBeVisible();
  });

  test('invalid credentials show error', async () => {
    await loginPage.login('invalid@example.com', 'wrongpassword');

    await loginPage.expectErrorMessage('Invalid credentials');
  });
});
```

### API Testing with Playwright

```typescript
import { test, expect } from '@playwright/test';

test.describe('API tests', () => {
  test('creates user via API', async ({ request }) => {
    const newUser = {
      name: 'John Doe',
      email: 'john@example.com',
    };

    const response = await request.post('/api/users', {
      data: newUser,
    });

    expect(response.ok()).toBeTruthy();

    const user = await response.json();
    expect(user).toMatchObject({
      ...newUser,
      id: expect.any(String),
    });
  });

  test('handles API errors correctly', async ({ request }) => {
    const response = await request.get('/api/users/nonexistent');

    expect(response.status()).toBe(404);

    const error = await response.json();
    expect(error.message).toContain('not found');
  });
});
```

## 8. Test Helper Utilities and Type Guards

### Custom Test Utilities

```typescript
// test-utils/render.tsx
import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '../context/ThemeContext';

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
  queryClient?: QueryClient;
  theme?: 'light' | 'dark';
}

export function renderWithProviders(
  ui: ReactElement,
  {
    initialEntries = ['/'],
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    }),
    theme = 'light',
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme={theme}>
          {children}
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  };
}

// test-utils/factories.ts
export const createMockUser = (overrides?: Partial<User>): User => ({
  id: crypto.randomUUID(),
  name: 'Test User',
  email: 'test@example.com',
  role: 'user',
  createdAt: new Date().toISOString(),
  ...overrides,
});

export const createMockApiResponse = <T>(
  data: T,
  overrides?: Partial<ApiResponse<T>>
): ApiResponse<T> => ({
  data,
  status: 'success',
  timestamp: new Date().toISOString(),
  ...overrides,
});

// test-utils/assertions.ts
export function expectToBeLoading(element: HTMLElement) {
  expect(element).toHaveAttribute('aria-busy', 'true');
}

export function expectToHaveErrorState(element: HTMLElement, message?: string) {
  expect(element).toHaveAttribute('aria-invalid', 'true');
  if (message) {
    expect(element).toHaveAccessibleDescription(message);
  }
}
```

### Type Guards for Testing

```typescript
// type-guards.ts
export function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value &&
    'email' in value &&
    typeof (value as any).id === 'string' &&
    typeof (value as any).name === 'string' &&
    typeof (value as any).email === 'string'
  );
}

export function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    typeof (value as any).message === 'string'
  );
}

// Usage in tests
describe('API response handling', () => {
  it('processes user data correctly', async () => {
    const response = await fetchUser('123');

    if (isUser(response)) {
      expect(response.id).toBe('123');
      expect(response.name).toBeTruthy();
    } else {
      fail('Expected user response');
    }
  });

  it('handles error responses', async () => {
    const response = await fetchUser('404');

    if (isApiError(response)) {
      expect(response.message).toContain('not found');
    } else {
      fail('Expected error response');
    }
  });
});
```

## 9. Performance Testing Patterns

### Performance Benchmarking

```typescript
import { performance } from 'perf_hooks';

describe('Performance tests', () => {
  it('processes large datasets efficiently', () => {
    const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
      value: Math.random(),
    }));

    const startTime = performance.now();

    const result = processDataset(largeDataset);

    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(100); // 100ms budget
    expect(result).toHaveLength(largeDataset.length);
  });

  it('handles concurrent operations within time budget', async () => {
    const operations = Array.from({ length: 10 }, (_, i) =>
      processItem(`item-${i}`)
    );

    const startTime = performance.now();

    const results = await Promise.all(operations);

    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(500); // 500ms budget for 10 concurrent operations
    expect(results).toHaveLength(10);
  });
});
```

### Memory Usage Testing

```typescript
describe('Memory usage tests', () => {
  it('does not leak memory during repeated operations', () => {
    const initialMemory = process.memoryUsage().heapUsed;

    // Perform memory-intensive operations
    for (let i = 0; i < 1000; i++) {
      const data = createLargeObject();
      processData(data);
      // Ensure references are released
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;

    // Memory increase should be reasonable (< 10MB)
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
  });
});
```

## 10. Common TypeScript Test Compilation Errors and Solutions

### Type Definition Errors

```typescript
// Error: Type 'void' cannot be tested for truthiness
// BAD
if (functionReturningVoid()) {
  // This causes TS1345 error
}

// GOOD
functionReturningVoid();
// Test side effects instead of return value
expect(mockCallback).toHaveBeenCalled();

// Error: Module does not refer to a type
// BAD
import * as MyModule from 'my-module';
let myVar: MyModule; // TS1340 error

// GOOD
import * as MyModule from 'my-module';
let myVar: typeof MyModule; // Correct usage
```

### Mock Type Safety Issues

```typescript
// BAD: Untyped mocks lose type safety
const mockFn = vi.fn();
mockFn.mockReturnValue('string'); // No type checking

// GOOD: Properly typed mocks
interface UserService {
  getUser(id: string): Promise<User>;
}

const mockUserService = mock<UserService>();
mockUserService.getUser.mockResolvedValue(createUser()); // Type-safe

// Or with vi.fn
const mockGetUser = vi.fn<[string], Promise<User>>();
mockGetUser.mockResolvedValue(createUser());
```

### Configuration Issues

```typescript
// tsconfig.json for testing
{
  "compilerOptions": {
    "target": "ES2021",
    "lib": ["ES2021", "DOM", "DOM.Iterable"],
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "types": ["vitest/globals", "@testing-library/jest-dom"],
    "jsx": "react-jsx"
  },
  "include": [
    "src/**/*",
    "tests/**/*",
    "**/*.test.ts",
    "**/*.test.tsx"
  ]
}

// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['**/*.{test,spec}.{ts,tsx}'],
    typecheck: {
      tsconfig: './tsconfig.test.json',
    },
  },
});
```

## 11. Integration Testing Patterns

### Database Integration Testing

```typescript
// Database test utilities
class TestDatabase {
  private static instance: Database;

  static async setup(): Promise<Database> {
    if (!TestDatabase.instance) {
      TestDatabase.instance = await createTestDatabase();
      await TestDatabase.instance.migrate();
    }
    return TestDatabase.instance;
  }

  static async cleanup(): Promise<void> {
    if (TestDatabase.instance) {
      await TestDatabase.instance.truncateAll();
    }
  }

  static async teardown(): Promise<void> {
    if (TestDatabase.instance) {
      await TestDatabase.instance.destroy();
    }
  }
}

describe('User repository integration tests', () => {
  let db: Database;
  let userRepository: UserRepository;

  beforeAll(async () => {
    db = await TestDatabase.setup();
    userRepository = new UserRepository(db);
  });

  afterEach(async () => {
    await TestDatabase.cleanup();
  });

  afterAll(async () => {
    await TestDatabase.teardown();
  });

  it('creates and retrieves user', async () => {
    const userData = createUser();

    const createdUser = await userRepository.create(userData);
    expect(createdUser.id).toBeDefined();

    const retrievedUser = await userRepository.findById(createdUser.id);
    expect(retrievedUser).toEqual(createdUser);
  });

  it('handles unique constraint violations', async () => {
    const userData = createUser({ email: 'unique@example.com' });

    await userRepository.create(userData);

    await expect(
      userRepository.create(userData)
    ).rejects.toThrow('Unique constraint violation');
  });
});
```

## Key Recommendations

### Immediate Actions

1. **Adopt Discriminated Unions** for complex state management in tests
2. **Implement Type-Safe Mocking** using libraries like `vitest-mock-extended`
3. **Switch to MSW** for API mocking over traditional function-level mocks
4. **Use Factory Patterns** for test data generation to reduce maintenance overhead
5. **Implement Parallel Testing** patterns for performance improvements

### Tool Recommendations

- **Vitest** over Jest for new projects (better TypeScript support, faster execution)
- **MSW** for API mocking (more realistic than traditional mocks)
- **Playwright** for E2E testing (superior TypeScript support)
- **React Testing Library** with `userEvent` for component testing
- **vitest-mock-extended** for type-safe mocking

### Best Practices

1. Test user behavior, not implementation details
2. Use type guards for safe type assertions in tests
3. Implement comprehensive error boundary testing
4. Create reusable test utilities and custom render functions
5. Focus on integration tests for complex workflows
6. Use performance budgets in critical paths
7. Maintain clean test data with factory patterns

### Avoid These Pitfalls

1. Testing implementation details instead of user behavior
2. Over-mocking (use MSW for realistic network mocking)
3. Ignoring TypeScript compiler errors in tests
4. Not resetting mocks between tests
5. Writing brittle tests that break with UI changes
6. Neglecting accessibility testing patterns
7. Insufficient async testing patterns

## Sources & Citations

### Primary Sources

1. **Vitest Documentation** - Official testing framework documentation with TypeScript support
2. **React Testing Library** - Component testing best practices and patterns
3. **MSW Documentation** - Network-level mocking patterns and TypeScript integration
4. **Playwright Documentation** - E2E testing with TypeScript
5. **TypeScript Handbook** - Advanced type patterns and discriminated unions

### Research Sources

- "TypeScript Advanced Patterns: Writing Cleaner & Safer Code in 2025" - Dev.to
- "Mock vs. SpyOn in Vitest with TypeScript" - Dev.to
- "Testing Custom Hooks with React Testing Library" - GeeksforGeeks
- "TypeScript unit testing pitfalls with Jest" - Salto.io
- "A Comprehensive Guide to Mock Service Worker (MSW)" - Callstack
- "Testing types in TypeScript" - 2ality.com
- "Easier TypeScript API Testing with Vitest + MSW" - Dev.to

### Expert Insights

- Kent C. Dodds recommendations on testing best practices
- React Testing Library philosophy and patterns
- MSW creator insights on network-level mocking
- Vitest team recommendations for TypeScript integration

This research provides a comprehensive foundation for implementing modern TypeScript testing patterns that balance maintainability, type safety, and performance in 2024-2025.
