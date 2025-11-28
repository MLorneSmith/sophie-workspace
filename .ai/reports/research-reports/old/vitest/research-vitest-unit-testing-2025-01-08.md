# Comprehensive Research: Vitest Unit Testing

**Research Date:** January 8, 2025  
**Research Scope:** Core concepts, best practices, mocking strategies, testing patterns, configuration, and common pitfalls  
**Target Audience:** AI agents and developers implementing Vitest unit testing

## Executive Summary

Vitest is a modern, Vite-native testing framework that provides a Jest-compatible API with superior performance and TypeScript integration. This research covers comprehensive strategies for effective unit testing, emphasizing the importance of proper mocking techniques, structured test organization, and performance optimization.

**Key Findings:**

- **vi.mock** for complete module replacement and isolation
- **vi.fn** for standalone mock functions with full behavioral control
- **vi.spyOn** for observing existing methods while preserving original behavior
- AAA (Arrange-Act-Assert) pattern as the gold standard for test structure
- Critical importance of mock cleanup and test isolation
- Performance optimization through configuration tuning

## Table of Contents

1. [Core Vitest Features](#1-core-vitest-features)
2. [Mocking Strategies](#2-mocking-strategies)
3. [Testing Patterns and Structure](#3-testing-patterns-and-structure)
4. [Configuration Best Practices](#4-configuration-best-practices)
5. [Performance Optimization](#5-performance-optimization)
6. [Common Pitfalls and Anti-patterns](#6-common-pitfalls-and-anti-patterns)
7. [Testing Utilities and Helpers](#7-testing-utilities-and-helpers)
8. [Integration with TypeScript and React Testing Library](#8-integration-with-typescript-and-react-testing-library)

---

## 1. Core Vitest Features

### 1.1 Essential APIs

**vi.mock** - Complete module replacement

```javascript
vi.mock('./api-client', () => ({
  fetchData: vi.fn().mockResolvedValue({ data: 'mocked' })
}))
```

**vi.fn** - Standalone mock function creation

```javascript
const mockCallback = vi.fn(x => x * 2)
expect(mockCallback).toHaveBeenCalledWith(2)
```

**vi.spyOn** - Method observation and optional replacement

```javascript
const spy = vi.spyOn(obj, 'method')
spy.mockImplementation(() => 'mocked')
spy.mockRestore() // Restores original
```

### 1.2 Mock Management

**Critical Cleanup Patterns:**

```javascript
// Option 1: Configuration-based
export default defineConfig({
  test: {
    clearMocks: true,    // Clear call history
    mockReset: true,     // Reset implementations
    restoreMocks: true,  // Full restoration
  }
})

// Option 2: Manual cleanup
afterEach(() => {
  vi.clearAllMocks()    // or vi.resetAllMocks() or vi.restoreAllMocks()
})
```

### 1.3 When to Use Each Approach

| Method | Use Case | Scope | Restoration |
|--------|----------|-------|-------------|
| `vi.mock` | Full module isolation, avoiding side effects | Entire module | Manual unmocking |
| `vi.fn` | Standalone functions, callbacks | Single function | N/A |
| `vi.spyOn` | Observing real behavior, temporary mocking | Object methods | Automatic with mockRestore() |

---

## 2. Mocking Strategies

### 2.1 Module-Level Mocking

**Complete Module Replacement:**

```javascript
// Hoisted - executes before imports
vi.mock('@/services/api', () => ({
  ApiClient: vi.fn().mockImplementation(() => ({
    get: vi.fn(),
    post: vi.fn()
  }))
}))

// With factory function for dynamic behavior
vi.mock('./user-service', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    getCurrentUser: vi.fn().mockResolvedValue({ id: 1, name: 'Test User' })
  }
})
```

**Partial Module Mocking:**

```javascript
vi.mock('./utils', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    // Only mock specific functions
    formatDate: vi.fn().mockReturnValue('2025-01-08')
  }
})
```

### 2.2 Class Mocking Strategies

### Method 1: Constructor Mocking

```javascript
vi.mock('./DatabaseClient', () => {
  const DatabaseClient = vi.fn()
  DatabaseClient.prototype.connect = vi.fn()
  DatabaseClient.prototype.query = vi.fn()
  DatabaseClient.prototype.disconnect = vi.fn()
  return { DatabaseClient }
})
```

### Method 2: Spy on Class Methods

```javascript
import * as mod from './DatabaseClient'

const MockedClient = vi.fn()
MockedClient.prototype.query = vi.fn()

vi.spyOn(mod, 'DatabaseClient').mockImplementation(MockedClient)
```

### 2.3 Advanced Mocking Patterns

**Time and Date Mocking:**

```javascript
describe('time-sensitive functions', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  
  afterEach(() => {
    vi.useRealTimers()
  })
  
  it('handles business hours', () => {
    vi.setSystemTime(new Date(2025, 0, 8, 14)) // 2 PM
    expect(isBusinessHours()).toBe(true)
  })
})
```

**Environment Variables:**

```javascript
it('handles different environments', () => {
  vi.stubEnv('NODE_ENV', 'production')
  expect(getApiUrl()).toBe('https://api.prod.com')
})
```

**Global Objects:**

```javascript
vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ data: 'mocked' })
}))
```

---

## 3. Testing Patterns and Structure

### 3.1 AAA Pattern (Arrange-Act-Assert)

**Gold Standard Structure:**

```javascript
describe('UserService', () => {
  describe('createUser', () => {
    it('should create user with valid data', async () => {
      // ARRANGE
      const userData = { name: 'John', email: 'john@test.com' }
      const expectedUser = { id: 1, ...userData }
      const mockCreate = vi.fn().mockResolvedValue(expectedUser)
      vi.spyOn(database, 'users').mockReturnValue({ create: mockCreate })
      
      // ACT
      const result = await userService.createUser(userData)
      
      // ASSERT
      expect(result).toEqual(expectedUser)
      expect(mockCreate).toHaveBeenCalledWith(userData)
      expect(mockCreate).toHaveBeenCalledTimes(1)
    })
  })
})
```

**Benefits of AAA Pattern:**

- **Clarity**: Each phase has a distinct purpose
- **Maintainability**: Easy to modify individual phases
- **Debugging**: Problems isolated to specific phases
- **Consistency**: Uniform structure across test suite

### 3.2 Test Organization

**Hierarchical Structure:**

```javascript
describe('PaymentProcessor', () => {
  // Setup common to all tests
  beforeEach(() => {
    vi.clearAllMocks()
  })
  
  describe('processPayment', () => {
    describe('when payment is valid', () => {
      it('should process successfully', () => {})
      it('should send confirmation email', () => {})
    })
    
    describe('when payment fails', () => {
      it('should throw PaymentError', () => {})
      it('should log error details', () => {})
    })
  })
  
  describe('refundPayment', () => {
    // Refund-specific tests
  })
})
```

**File Organization:**

```bash
src/
├── components/
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.test.tsx
│   │   └── Button.integration.test.tsx
│   └── UserProfile/
│       ├── UserProfile.tsx
│       ├── UserProfile.test.tsx
│       └── __mocks__/
│           └── api.ts
```

### 3.3 Descriptive Test Names

**Best Practices:**

```javascript
// ❌ Bad: Vague, technical
it('should work', () => {})
it('tests the function', () => {})

// ✅ Good: Clear, specific, business-focused
it('should return user data when valid ID is provided', () => {})
it('should throw ValidationError when email format is invalid', () => {})
it('should send welcome email after successful user registration', () => {})
```

---

## 4. Configuration Best Practices

### 4.1 TypeScript + Vitest Setup

**vitest.config.ts:**

```typescript
/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Global test functions
    globals: true,
    
    // DOM environment for React testing
    environment: 'jsdom',
    
    // Setup files
    setupFiles: ['./src/test/setup.ts'],
    
    // Mock management
    clearMocks: true,
    restoreMocks: true,
    
    // Performance optimizations
    isolate: false,  // For pure functions without side effects
    
    // Coverage
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*'
      ]
    }
  }
})
```

**tsconfig.json:**

```json
{
  "compilerOptions": {
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  }
}
```

**Setup File (setup.ts):**

```typescript
import '@testing-library/jest-dom'
import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

// Extend expect with jest-dom matchers
expect.extend(matchers)

// Cleanup after each test
afterEach(() => {
  cleanup()
})
```

### 4.2 React Testing Library Integration

**Component Testing Setup:**

```typescript
// Component test example
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from './Button'

describe('Button', () => {
  it('should call onClick when clicked', () => {
    // ARRANGE
    const mockOnClick = vi.fn()
    render(<Button onClick={mockOnClick}>Click me</Button>)
    
    // ACT
    fireEvent.click(screen.getByRole('button'))
    
    // ASSERT
    expect(mockOnClick).toHaveBeenCalledTimes(1)
  })
})
```

---

## 5. Performance Optimization

### 5.1 Configuration Tuning

**Speed Optimizations:**

```typescript
export default defineConfig({
  test: {
    // Disable isolation for pure functions
    isolate: false,
    
    // Use threads pool (faster than forks)
    pool: 'threads',
    
    // Disable file parallelism for faster startup on small suites
    fileParallelism: false,
    
    // Optimize watch mode
    watch: {
      exclude: ['node_modules/**', 'dist/**']
    }
  }
})
```

### 5.2 Test Sharding

**For Large Test Suites:**

```bash
# Split tests across multiple processes
vitest --shard=1/3  # Run 1st third of tests
vitest --shard=2/3  # Run 2nd third of tests  
vitest --shard=3/3  # Run 3rd third of tests
```

### 5.3 Mock Performance

**Efficient Mock Patterns:**

```javascript
// ❌ Slow: Creating mocks in each test
it('test 1', () => {
  const mock = vi.fn().mockImplementation(/* complex logic */)
})

// ✅ Fast: Shared mock with reset
describe('MyModule', () => {
  const sharedMock = vi.fn()
  
  beforeEach(() => {
    sharedMock.mockClear()
  })
})
```

---

## 6. Common Pitfalls and Anti-patterns

### 6.1 Mock Management Issues

### ❌ Anti-pattern: Not cleaning up mocks

```javascript
// This will cause test pollution
it('test 1', () => {
  vi.spyOn(api, 'get').mockResolvedValue(data1)
})

it('test 2', () => {
  // Still using mocked version from test 1!
})
```

### ✅ Correct: Proper cleanup

```javascript
describe('API Tests', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })
})
```

### 6.2 Over-Mocking

### ❌ Anti-pattern: Mocking everything

```javascript
// Over-mocking internal implementation
vi.mock('./utils/formatters')
vi.mock('./utils/validators')  
vi.mock('./utils/helpers')
// Testing becomes meaningless
```

### ✅ Correct: Mock external dependencies only

```javascript
// Only mock external services
vi.mock('@/services/api')
vi.mock('@/services/email')
// Keep internal utilities real
```

### 6.3 Testing Implementation Details

### ❌ Anti-pattern: Testing internals

```javascript
it('should call helper function', () => {
  const helperSpy = vi.spyOn(utils, 'helperFunction')
  component.doSomething()
  expect(helperSpy).toHaveBeenCalled() // Testing implementation
})
```

### ✅ Correct: Testing behavior

```javascript
it('should produce correct output', () => {
  const result = component.doSomething()
  expect(result).toBe(expectedOutput) // Testing behavior
})
```

### 6.4 Flaky Tests

**Common Causes and Solutions:**

**Asynchronous Operations:**

```javascript
// ❌ Flaky: Not awaiting async operations
it('fetches data', () => {
  api.getData()
  expect(result).toBe(expected) // Race condition!
})

// ✅ Stable: Proper async handling
it('fetches data', async () => {
  const result = await api.getData()
  expect(result).toBe(expected)
})
```

**Time Dependencies:**

```javascript
// ❌ Flaky: Dependent on real time
it('shows timestamp', () => {
  expect(getTimestamp()).toBe('2025-01-08') // Will fail tomorrow!
})

// ✅ Stable: Mock time
it('shows timestamp', () => {
  vi.setSystemTime(new Date('2025-01-08'))
  expect(getTimestamp()).toBe('2025-01-08')
})
```

---

## 7. Testing Utilities and Helpers

### 7.1 Custom Matchers

**Creating Domain-Specific Matchers:**

```typescript
// test/matchers.ts
export const customMatchers = {
  toBeValidUser(received: any) {
    const pass = received.id && received.email && received.name
    return {
      message: () => `expected ${received} to be a valid user`,
      pass
    }
  }
}

// In setup
expect.extend(customMatchers)

// Usage
expect(user).toBeValidUser()
```

### 7.2 Test Factories

**Reducing Test Setup Duplication:**

```typescript
// test/factories.ts
export const createUser = (overrides = {}) => ({
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  ...overrides
})

export const createMockApi = () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn()
})

// Usage
const user = createUser({ name: 'John Doe' })
const mockApi = createMockApi()
```

### 7.3 Mock Service Worker (MSW) Integration

**For API Testing:**

```javascript
// test/mocks/handlers.js
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('/api/users', () => {
    return HttpResponse.json([
      { id: 1, name: 'John' },
      { id: 2, name: 'Jane' }
    ])
  })
]

// test/setup.ts
import { setupServer } from 'msw/node'
import { handlers } from './mocks/handlers'

const server = setupServer(...handlers)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

---

## 8. Integration with TypeScript and React Testing Library

### 8.1 Type-Safe Mocking

**Strongly Typed Mocks:**

```typescript
// Type-safe API mocking
interface ApiClient {
  get<T>(url: string): Promise<T>
  post<T>(url: string, data: any): Promise<T>
}

const mockApiClient: ApiClient = {
  get: vi.fn(),
  post: vi.fn()
}

// Type assertion for mock functions
const mockGet = mockApiClient.get as MockedFunction<typeof mockApiClient.get>
mockGet.mockResolvedValue({ data: 'test' })
```

**Using vi.mocked Helper:**

```typescript
import { vi } from 'vitest'
import { apiClient } from './api'

vi.mock('./api')
const mockedApi = vi.mocked(apiClient)

mockedApi.get.mockResolvedValue({ data: 'test' })
```

### 8.2 React Component Testing

**Complete Component Test Example:**

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UserProfile } from './UserProfile'

// Mock API module
vi.mock('@/services/userApi', () => ({
  getUserById: vi.fn(),
  updateUser: vi.fn()
}))

describe('UserProfile', () => {
  const mockUser = {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com'
  }

  beforeEach(() => {
    vi.mocked(userApi.getUserById).mockResolvedValue(mockUser)
  })

  it('should display user information', async () => {
    // ARRANGE
    render(<UserProfile userId={1} />)
    
    // ACT & ASSERT
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('john@example.com')).toBeInTheDocument()
    })
  })

  it('should handle user updates', async () => {
    // ARRANGE
    const user = userEvent.setup()
    vi.mocked(userApi.updateUser).mockResolvedValue({ ...mockUser, name: 'Jane Doe' })
    
    render(<UserProfile userId={1} />)
    
    // ACT
    const nameInput = await screen.findByDisplayValue('John Doe')
    await user.clear(nameInput)
    await user.type(nameInput, 'Jane Doe')
    await user.click(screen.getByRole('button', { name: /save/i }))
    
    // ASSERT
    await waitFor(() => {
      expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    })
    expect(userApi.updateUser).toHaveBeenCalledWith(1, { ...mockUser, name: 'Jane Doe' })
  })
})
```

---

## Key Takeaways for AI Agents

### 1. **Mocking Strategy Decision Tree**

- **External dependencies/APIs** → Use `vi.mock`
- **Tracking function calls** → Use `vi.spyOn`
- **Standalone function behavior** → Use `vi.fn`

### 2. **Always Clean Up Mocks**

- Configure `restoreMocks: true` or use cleanup hooks
- Prevents test pollution and false positives

### 3. **Follow AAA Pattern**

- Structure tests with clear Arrange-Act-Assert phases
- Improves readability and maintainability

### 4. **Test Behavior, Not Implementation**

- Focus on what the code does, not how it does it
- Mock external dependencies, keep internal logic real

### 5. **Performance Considerations**

- Use `isolate: false` for pure functions
- Consider `pool: 'threads'` for better performance
- Implement test sharding for large suites

### 6. **Avoid Common Pitfalls**

- Don't over-mock internal utilities
- Handle async operations properly
- Use fake timers for time-dependent tests
- Clean up mocks between tests

---

## Sources and Citations

1. **Vitest Official Documentation** - <https://vitest.dev/guide/mocking>
2. **Mock vs. SpyOn in Vitest with TypeScript** - dev.to/axsh
3. **Advanced Guide to Vitest Testing and Mocking** - LogRocket Blog
4. **Vitest Best Practices and Coding Standards** - projectrules.ai
5. **AAA Pattern in Unit Test Automation** - Semaphore CI
6. **Common Mistakes with React Testing Library** - Kent C. Dodds
7. **Improving Performance** - Vitest Official Guide
8. **Flaky Tests in Vitest** - Trunk.io Blog

**Full detailed documentation with examples and additional resources available in official Vitest documentation and community resources.**
