# Mocking Strategies

This document outlines the mocking strategies used in the SlideHeroes project for effective unit testing.

## Why Mock?

Mocking is essential for unit testing because it allows us to:

1. **Isolate the code being tested**: Test components in isolation without dependencies
2. **Control test conditions**: Simulate specific scenarios, including edge cases
3. **Speed up tests**: Avoid slow external dependencies like databases or APIs
4. **Test error handling**: Simulate errors from dependencies
5. **Test hard-to-reproduce scenarios**: Create conditions that are difficult to set up with real dependencies

## Types of Test Doubles

We use several types of test doubles in our testing strategy:

1. **Stubs**: Return fixed values, replacing real implementations
2. **Spies**: Record calls to functions without changing their behavior
3. **Mocks**: Pre-programmed with expectations about calls they should receive
4. **Fakes**: Working implementations that take shortcuts (e.g., in-memory database)
5. **Dummies**: Passed around but never actually used

## Mocking Tools

### Vitest Mocking

Vitest provides built-in mocking capabilities:

```typescript
import { vi } from 'vitest';

// Mock a function
const mockFn = vi.fn();
mockFn.mockReturnValue('mocked value');

// Mock a module
vi.mock('./path/to/module', () => ({
  someFunction: vi.fn().mockReturnValue('mocked value'),
  someValue: 'mocked value'
}));

// Spy on a method
const spy = vi.spyOn(object, 'method');
```

### MSW (Mock Service Worker)

For API mocking, we use MSW to intercept network requests:

```typescript
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.get('/api/users', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json([
      { id: 1, name: 'John' },
      { id: 2, name: 'Jane' }
    ]));
  }),
  
  rest.post('/api/users', (req, res, ctx) => {
    return res(ctx.status(201), ctx.json({ id: 3, name: 'New User' }));
  }),
  
  rest.get('/api/error', (req, res, ctx) => {
    return res(ctx.status(500), ctx.json({ message: 'Server error' }));
  })
);

// Start the server before tests
beforeAll(() => server.listen());

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Close the server after all tests
afterAll(() => server.close());
```

### Testing Library

For React component testing, we use Testing Library's utilities:

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock context providers
const MockProvider = ({ children }) => (
  <ThemeContext.Provider value={{ theme: 'light' }}>
    {children}
  </ThemeContext.Provider>
);

test('component uses theme from context', () => {
  render(<MyComponent />, { wrapper: MockProvider });
  // Test component with mocked context
});
```

## Mocking Strategies by Type

### Mocking Functions

```typescript
// Basic function mock
const mockFunction = vi.fn();
mockFunction.mockReturnValue('mocked result');

// Mock implementation
const mockWithImplementation = vi.fn().mockImplementation((a, b) => a + b);

// Mock resolved/rejected promises
const mockPromise = vi.fn();
mockPromise.mockResolvedValue({ data: 'success' });
mockPromise.mockRejectedValue(new Error('failure'));

// Mock return values for specific calls
const mockSequence = vi.fn()
  .mockReturnValueOnce('first call')
  .mockReturnValueOnce('second call')
  .mockReturnValue('subsequent calls');
```

### Mocking Modules

```typescript
// Mock an entire module
vi.mock('./utils', () => ({
  formatDate: vi.fn().mockReturnValue('2023-01-01'),
  calculateTotal: vi.fn().mockReturnValue(100),
  isValid: vi.fn().mockReturnValue(true)
}));

// Mock specific exports while keeping others
vi.mock('./utils', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    formatDate: vi.fn().mockReturnValue('2023-01-01')
  };
});

// Mock default export
vi.mock('./Component', () => ({
  default: () => <div data-testid="mocked-component" />
}));
```

### Mocking React Hooks

```typescript
// Mock useState
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useState: vi.fn().mockImplementation((initial) => [initial, vi.fn()])
  };
});

// Mock useContext
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useContext: vi.fn().mockReturnValue({ theme: 'dark', toggleTheme: vi.fn() })
  };
});

// Mock custom hooks
vi.mock('./useAuth', () => ({
  useAuth: vi.fn().mockReturnValue({
    user: { id: 1, name: 'Test User' },
    isAuthenticated: true,
    login: vi.fn(),
    logout: vi.fn()
  })
}));
```

### Mocking API Requests

#### Using MSW

```typescript
// Define handlers
const handlers = [
  rest.get('/api/users', (req, res, ctx) => {
    const query = req.url.searchParams.get('query');
    if (query === 'error') {
      return res(ctx.status(500), ctx.json({ message: 'Server error' }));
    }
    return res(ctx.status(200), ctx.json([
      { id: 1, name: 'John' },
      { id: 2, name: 'Jane' }
    ]));
  }),
  
  rest.post('/api/users', async (req, res, ctx) => {
    const { name } = await req.json();
    if (!name) {
      return res(ctx.status(400), ctx.json({ message: 'Name is required' }));
    }
    return res(ctx.status(201), ctx.json({ id: 3, name }));
  })
];

// Setup server
const server = setupServer(...handlers);

// Use in tests
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Override handlers for specific tests
test('handles error response', () => {
  server.use(
    rest.get('/api/users', (req, res, ctx) => {
      return res(ctx.status(500), ctx.json({ message: 'Server error' }));
    })
  );
  
  // Test error handling
});
```

#### Using Fetch Mock

```typescript
// Mock fetch globally
global.fetch = vi.fn();

// Mock successful response
global.fetch.mockResolvedValue({
  ok: true,
  json: async () => ({ data: 'mocked data' })
});

// Mock error response
global.fetch.mockResolvedValue({
  ok: false,
  status: 500,
  statusText: 'Internal Server Error',
  json: async () => ({ message: 'Server error' })
});

// Reset between tests
beforeEach(() => {
  global.fetch.mockClear();
});
```

### Mocking Browser APIs

```typescript
// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock window.location
delete window.location;
window.location = {
  href: 'https://example.com',
  pathname: '/test',
  search: '?query=test',
  hash: '#hash',
  assign: vi.fn(),
  replace: vi.fn()
};

// Mock navigator
Object.defineProperty(window, 'navigator', {
  value: {
    userAgent: 'test-agent',
    language: 'en-US',
    clipboard: {
      writeText: vi.fn().mockResolvedValue(undefined)
    }
  }
});
```

### Mocking Third-Party Libraries

```typescript
// Mock axios
vi.mock('axios', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: 'mocked data' }),
    post: vi.fn().mockResolvedValue({ data: 'mocked response' })
  }
}));

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  ...vi.importActual('react-router-dom'),
  useParams: vi.fn().mockReturnValue({ id: '123' }),
  useNavigate: vi.fn().mockReturnValue(vi.fn()),
  useLocation: vi.fn().mockReturnValue({
    pathname: '/test',
    search: '?query=test',
    hash: '#hash'
  })
}));

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          data: [{ id: 1, name: 'Test' }],
          error: null
        }))
      })),
      insert: vi.fn(() => ({
        data: { id: 2, name: 'New Test' },
        error: null
      })),
      update: vi.fn(() => ({
        data: { id: 1, name: 'Updated Test' },
        error: null
      })),
      delete: vi.fn(() => ({
        data: null,
        error: null
      }))
    })),
    auth: {
      signIn: vi.fn().mockResolvedValue({
        data: { user: { id: 1, email: 'test@example.com' } },
        error: null
      }),
      signOut: vi.fn().mockResolvedValue({ error: null })
    }
  }))
}));
```

## Advanced Mocking Techniques

### Partial Mocking

```typescript
// Partially mock a module
vi.mock('./utils', async () => {
  const actual = await vi.importActual('./utils');
  return {
    ...actual,
    formatDate: vi.fn().mockReturnValue('2023-01-01')
  };
});

// Spy on a method without replacing the implementation
const spy = vi.spyOn(object, 'method');
// The original implementation will still be called
```

### Mocking Class Implementations

```typescript
// Mock a class
class MockedClass {
  constructor() {
    this.property = 'mocked';
  }
  
  method() {
    return 'mocked method';
  }
}

vi.mock('./MyClass', () => ({
  MyClass: MockedClass
}));

// Mock specific methods on a class instance
const instance = new MyClass();
vi.spyOn(instance, 'method').mockReturnValue('mocked result');
```

### Dynamic Mocking

```typescript
// Dynamically change mock implementation based on arguments
const mockFunction = vi.fn().mockImplementation((arg) => {
  if (arg === 'special') {
    return 'special result';
  }
  return 'default result';
});

// Dynamically change mock implementation for different tests
beforeEach(() => {
  vi.resetAllMocks();
});

test('test case 1', () => {
  mockFunction.mockImplementation(() => 'implementation for test 1');
  // Test with this implementation
});

test('test case 2', () => {
  mockFunction.mockImplementation(() => 'implementation for test 2');
  // Test with this implementation
});
```

## Best Practices

### When to Mock

- **External Dependencies**: APIs, databases, third-party services
- **Browser APIs**: localStorage, fetch, geolocation
- **Complex Components**: When testing a component that uses other complex components
- **Side Effects**: Functions with side effects like network requests or file operations
- **Random or Time-Based Behavior**: Functions that use random numbers or current time

### When Not to Mock

- **Pure Functions**: Functions without side effects that only depend on their inputs
- **Simple Components**: Components with minimal logic
- **Core Business Logic**: Critical business logic should be tested with real implementations
- **Integration Points**: Some tests should verify that components work together correctly

### Mocking Guidelines

1. **Mock at the Right Level**: Mock at the boundary of your system, not internal implementation details
2. **Keep Mocks Simple**: Mocks should return the minimum data needed for the test
3. **Verify Mock Calls**: Check that mocks are called with the expected arguments
4. **Reset Mocks Between Tests**: Ensure tests don't affect each other
5. **Don't Over-Mock**: Too many mocks can make tests brittle and less valuable
6. **Test Both Success and Failure Paths**: Mock both successful and error responses
7. **Keep Mocks in Sync with Real Implementations**: Update mocks when the real implementation changes
8. **Document Complex Mocks**: Add comments explaining the purpose of complex mocks

## Troubleshooting Common Mocking Issues

### Mock Not Working

- Ensure the mock is defined before the module is imported
- Check that the mock path exactly matches the import path
- Verify that the mock is reset between tests if necessary

### Mock Called with Unexpected Arguments

- Use `mockFn.mock.calls` to inspect the arguments passed to the mock
- Add console.log statements to debug the actual arguments

### Mock Not Being Called

- Verify that the function is actually being called in the code
- Check for conditional logic that might prevent the function from being called
- Ensure the mock is properly exported and imported

### Test Interference

- Reset mocks between tests with `beforeEach(() => vi.resetAllMocks())`
- Use `vi.restoreAllMocks()` to restore original implementations

## Examples from Our Codebase

### Mocking Supabase Queries

```typescript
// Mock Supabase query for fetching courses
vi.mock('@/lib/supabase', () => ({
  supabaseClient: {
    from: vi.fn().mockImplementation((table) => {
      if (table === 'courses') {
        return {
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnValue({
            data: [
              { id: 1, title: 'Course 1', description: 'Description 1' },
              { id: 2, title: 'Course 2', description: 'Description 2' }
            ],
            error: null
          })
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue({ data: [], error: null })
      };
    })
  }
}));
```

### Mocking Authentication Context

```typescript
// Mock authentication context
const mockAuthContext = {
  user: { id: 1, email: 'test@example.com', name: 'Test User' },
  isAuthenticated: true,
  isLoading: false,
  signIn: vi.fn(),
  signOut: vi.fn(),
  signUp: vi.fn()
};

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn().mockReturnValue(mockAuthContext)
}));
```

### Mocking API Endpoints

```typescript
// Mock API endpoints using MSW
const handlers = [
  rest.get('/api/courses', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json([
      { id: 1, title: 'Course 1', description: 'Description 1' },
      { id: 2, title: 'Course 2', description: 'Description 2' }
    ]));
  }),
  
  rest.get('/api/courses/:id', (req, res, ctx) => {
    const { id } = req.params;
    if (id === '1') {
      return res(ctx.status(200), ctx.json({
        id: 1,
        title: 'Course 1',
        description: 'Description 1',
        modules: [
          { id: 1, title: 'Module 1' },
          { id: 2, title: 'Module 2' }
        ]
      }));
    }
    return res(ctx.status(404), ctx.json({ message: 'Course not found' }));
  })
];

const server = setupServer(...handlers);
```

## Conclusion

Effective mocking is essential for writing maintainable and reliable tests. By following the strategies outlined in this document, you can create tests that are fast, reliable, and focused on the behavior you want to verify. Remember to use mocks judiciously and keep them in sync with the real implementations they replace.
