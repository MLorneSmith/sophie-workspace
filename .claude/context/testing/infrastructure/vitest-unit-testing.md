---
# Identity
id: "vitest-unit-testing"
title: "Vitest Unit Testing Context"
version: "1.0.0"
category: "tools"

# Discovery
description: "Comprehensive guidance for writing Vitest unit tests including project infrastructure, patterns, helpers, and mocking strategies"
tags: ["vitest", "unit-testing", "mocking", "test-helpers", "test-patterns", "coverage"]

# Relationships
dependencies: []
cross_references:
  - id: "testing-fundamentals"
    type: "related"
    description: "Core testing principles and philosophies"
  - id: "enhanced-logger"
    type: "related"
    description: "Logging utilities used in tests"

# Maintenance
created: "2025-09-08"
last_updated: "2025-09-08"
author: "create-context"
---

# Vitest Unit Testing Context

## Overview

This context provides comprehensive guidance for writing Vitest unit tests in the SlideHeroes project. It covers the project's testing infrastructure, patterns, helpers, mocking strategies, and best practices based on actual project implementation.

## Key Concepts

- **Vitest**: Fast, native ESM test runner with Jest-compatible API
- **vi.mock**: Complete module replacement for isolation
- **vi.fn**: Standalone mock functions with behavioral control
- **vi.spyOn**: Method observation while preserving original behavior
- **AAA Pattern**: Arrange-Act-Assert structure for test clarity
- **enhanceAction**: Project-specific wrapper for server actions
- **Test Helpers**: Custom utilities for common testing needs

## Project Testing Infrastructure

### Base Configuration

The project uses a hierarchical configuration approach:

```typescript
// packages/vitest.config.base.ts
export const createPackageConfig = (packageDir: string) => {
  return defineProject({
    test: {
      environment: "node",
      globals: true,
      include: ["**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}"],
      exclude: ["**/node_modules/**", "**/dist/**", "**/coverage/**"],
      testTimeout: 10000,
      hookTimeout: 10000,
      coverage: {
        provider: "v8",
        reporter: ["text", "json"],
        thresholds: {
          global: { branches: 70, functions: 70, lines: 70, statements: 70 }
        }
      },
      reporters: ["verbose"]
    }
  });
};
```

### Web Application Configuration

```typescript
// apps/web/vitest.config.ts
export default defineProject({
  plugins: [
    react({ jsxImportSource: "react" }),
    tsconfigPaths()
  ],
  test: {
    name: "web",
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    exclude: ["**/node_modules/**", "**/.next/**", "**/e2e/**"],
    poolOptions: {
      threads: { isolate: true, singleThread: false }
    }
  }
});
```

## Test Setup and Global Mocks

### Standard Setup File

```typescript
// vitest.setup.ts
import { beforeEach, vi } from "vitest";
import "@testing-library/jest-dom";

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

// Mock Supabase client
vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      throwOnError: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  })),
}));

// Mock server-only package
vi.mock("server-only", () => ({}));

// Setup cleanup between tests
beforeEach(() => {
  vi.clearAllMocks();
});
```

## Test Helpers and Utilities

### Core Test Helpers

```typescript
// test/test-helpers.ts

// Cast unknown result to ActionResult with runtime validation
export function castActionResult<T>(result: unknown): ActionResult<T> {
  // Validation logic...
  return result as ActionResult<T>;
}

// Create a mock Supabase client with proper typing
export function createMockSupabaseClient(): MockSupabaseClient {
  const mockFrom = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    // ... other chainable methods
    then: vi.fn((onResolve) => onResolve({ data: null, error: null })),
  });
  
  return {
    from: mockFrom,
    auth: mockAuth,
    storage: mockStorage,
  } as unknown as MockSupabaseClient;
}

// Create a mock enhanced action
export function createMockAction<TInput, TOutput>(
  implementation?: (data: TInput) => Promise<ActionResult<TOutput>>,
): EnhancedAction<TInput, TOutput> {
  const defaultImplementation = async (): Promise<ActionResult<TOutput>> => ({
    success: true,
    data: undefined,
  });
  return vi.fn(implementation || defaultImplementation);
}

// Result helpers
export function successResult<T>(data?: T): ActionResult<T> {
  return { success: true, data };
}

export function errorResult(error: string): ActionResult<never> {
  return { success: false, error };
}

export function expectSuccess<T>(result: ActionResult<T>): T | undefined {
  if (!result.success) {
    throw new Error(`Expected success but got error: ${result.error}`);
  }
  return result.data;
}

export function expectError(result: ActionResult<unknown>): string {
  if (result.success) {
    throw new Error("Expected error but got success");
  }
  return result.error;
}
```

## Common Mocking Patterns

### Mock enhanceAction (Server Actions)

```typescript
vi.mock("@kit/next/actions", () => ({
  enhanceAction: vi.fn((fn, options) => {
    return async (data: unknown) => {
      // Validate with schema if provided
      if (options?.schema) {
        const result = options.schema.safeParse(data);
        if (!result.success) {
          return { success: false, error: "Validation failed" } as const;
        }
      }
      // Mock authenticated user
      const mockUser = { id: "123", email: "test@example.com" };
      return fn(data, mockUser);
    };
  }),
}));
```

### Mock AI Gateway

```typescript
vi.mock("@kit/ai-gateway", () => ({
  getChatCompletion: vi.fn(),
  createReasoningOptimizedConfig: vi.fn(),
  PromptManager: {
    compileTemplate: vi.fn(),
  },
}));

// In test setup:
function createMockCompletionResult(content: string) {
  return {
    content,
    metadata: {
      requestId: "test-request-id",
      cost: 0.001,
      tokens: { prompt: 100, completion: 50, total: 150 },
      provider: "openai",
      model: "gpt-4",
      feature: "text-simplification",
    },
  };
}
```

### Mock Supabase Method Chaining

```typescript
const createMockSupabaseChain = () => {
  const chain = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    eq: vi.fn(),
    single: vi.fn(),
  };
  
  // Make all methods return the chain for proper chaining
  chain.select.mockReturnValue(chain);
  chain.insert.mockReturnValue(chain);
  chain.update.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  chain.single.mockResolvedValue({ data: null, error: null });
  
  return chain;
};
```

## Test Structure Patterns

### Standard Test Structure

```typescript
describe("FeatureName", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Setup default mocks
  });

  describe("Schema Validation", () => {
    it("should validate required fields are present", async () => {
      // Arrange
      const validInput = { /* ... */ };
      
      // Act
      const result = await action(validInput);
      
      // Assert
      expect(result.success).toBe(true);
    });

    it("should reject missing required field", async () => {
      // Arrange
      const invalidInput = { /* missing field */ };
      
      // Act
      const result = await action(invalidInput);
      
      // Assert
      expect(expectError(result)).toBe("Validation failed");
    });
  });

  describe("Core Functionality", () => {
    it("should perform primary operation", async () => {
      // Test main happy path
    });
  });

  describe("Error Scenarios", () => {
    it("should handle service failures", async () => {
      // Mock service failure
      vi.mocked(externalService).mockRejectedValue(new Error("Service unavailable"));
      
      // Test error handling
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty input", async () => {
      // Test boundary conditions
    });
  });
});
```

## Mocking Decision Tree

### When to Use Each Mock Type

```typescript
// vi.mock - Complete module replacement
vi.mock("@kit/ai-gateway", () => ({
  // Replace entire module
}));

// vi.fn - Standalone mock function
const mockFunction = vi.fn();
mockFunction.mockResolvedValue(result);

// vi.spyOn - Observe existing method
const spy = vi.spyOn(object, 'method');
spy.mockImplementation(() => customResult);

// vi.mocked - Type-safe mock access
vi.mocked(getChatCompletion).mockResolvedValue(result);
```

## Testing Server Actions

### Pattern for Testing Enhanced Actions

```typescript
describe("serverAction", () => {
  it("should validate schema and execute action", async () => {
    // Arrange
    const input = {
      field1: "value1",
      field2: "value2",
      userId: "user-123",
    };
    
    // Mock external dependencies
    vi.mocked(externalService).mockResolvedValue(expectedResult);
    
    // Act
    const result = await serverAction(input);
    
    // Assert
    expect(result).toEqual({
      success: true,
      data: expectedData,
    });
    
    // Verify service was called correctly
    expect(externalService).toHaveBeenCalledWith(
      expect.objectContaining({
        field1: "value1",
        field2: "value2",
      })
    );
  });
});
```

## Testing React Components

### Component Testing Pattern

```typescript
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

describe("Component", () => {
  it("should handle user interaction", async () => {
    // Arrange
    const user = userEvent.setup();
    const mockHandler = vi.fn();
    
    render(<Component onAction={mockHandler} />);
    
    // Act
    const button = screen.getByRole("button", { name: /submit/i });
    await user.click(button);
    
    // Assert
    await waitFor(() => {
      expect(mockHandler).toHaveBeenCalledWith(
        expect.objectContaining({ /* expected data */ })
      );
    });
  });
});
```

## Coverage Best Practices

### Target Coverage Metrics

```yaml
coverage:
  thresholds:
    global:
      branches: 70
      functions: 70
      lines: 70
      statements: 70
```

### Running Coverage

```bash
# Run coverage for specific test
npx vitest run --coverage --coverage.reporter=text,json-summary [test-file]

# Run all tests with coverage
pnpm test:coverage

# Run coverage for a specific package
pnpm --filter web test:coverage
```

## Common Testing Patterns

### Testing Async Operations

```typescript
it("should handle async operations", async () => {
  // Use async/await for clarity
  const result = await asyncOperation();
  expect(result).toBeDefined();
  
  // Or use resolves/rejects matchers
  await expect(asyncOperation()).resolves.toEqual(expectedValue);
  await expect(failingOperation()).rejects.toThrow("Expected error");
});
```

### Testing Error Boundaries

```typescript
it("should handle errors gracefully", async () => {
  // Arrange
  const error = new Error("Test error");
  vi.mocked(service).mockRejectedValue(error);
  
  // Act
  const result = await action(input);
  
  // Assert
  expect(result).toEqual({
    success: false,
    error: "Test error",
  });
});
```

### Testing with Time

```typescript
it("should handle time-based operations", async () => {
  // Use fake timers
  vi.useFakeTimers();
  
  // Trigger time-based operation
  const promise = delayedOperation();
  
  // Advance time
  vi.advanceTimersByTime(5000);
  
  // Assert
  await expect(promise).resolves.toBe(expectedResult);
  
  // Cleanup
  vi.useRealTimers();
});
```

## Troubleshooting

### Issue: Mock Not Working
**Symptoms**: Module not being mocked properly
**Cause**: Mock defined after import
**Solution**: Ensure mocks are defined before imports

```typescript
// ✅ CORRECT - Mock before import
vi.mock("@kit/ai-gateway");
import { getChatCompletion } from "@kit/ai-gateway";

// ❌ WRONG - Import before mock
import { getChatCompletion } from "@kit/ai-gateway";
vi.mock("@kit/ai-gateway");
```

### Issue: Type Errors with Mocks
**Symptoms**: TypeScript errors with mocked functions
**Cause**: Missing type information
**Solution**: Use vi.mocked for type safety

```typescript
// ✅ Type-safe mock access
vi.mocked(getChatCompletion).mockResolvedValue(result);

// ❌ No type information
(getChatCompletion as any).mockResolvedValue(result);
```

### Issue: Flaky Tests
**Symptoms**: Tests pass/fail inconsistently
**Cause**: Race conditions or timing issues
**Solution**: Use proper async patterns and waitFor

```typescript
// ✅ Wait for async operations
await waitFor(() => {
  expect(screen.getByText("Success")).toBeInTheDocument();
});

// ❌ No waiting for async
expect(screen.getByText("Success")).toBeInTheDocument();
```

## See Also

- [[testing-fundamentals]]: Core testing principles
- [[enhanced-logger]]: Logging utilities for tests
- [[server-actions]]: Server action patterns
- [[typescript-patterns]]: TypeScript testing patterns