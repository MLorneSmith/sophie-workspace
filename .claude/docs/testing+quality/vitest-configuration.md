# Vitest Configuration

**Purpose**: This document provides comprehensive guidance for configuring and using Vitest in the SlideHeroes monorepo, including workspace setup, test patterns, and common troubleshooting.

## Overview

SlideHeroes uses Vitest as the primary testing framework, orchestrated through Turbo for parallel execution across packages. Vitest provides a fast, native ESM test runner with Jest-compatible API and first-class TypeScript support.

## Architecture

### Root Configuration

The root vitest config uses the projects feature to handle multiple packages:

```typescript
// /vitest.config.ts
export default defineConfig({
  test: {
    projects: [
      "apps/web",
      "apps/payload",
      "packages/monitoring/newrelic",
      "packages/shared",
      "packages/features/admin",
      // Add new packages here
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70,
        },
      },
    },
  },
});
```

### Base Configuration

Provides shared configuration for Node.js packages:

```typescript
// /packages/vitest.config.base.ts
export const createPackageConfig = (packageDir: string) => {
  return defineProject({
    test: {
      environment: "node",
      globals: true,
      include: ["**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}"],
      exclude: ["**/node_modules/**", "**/dist/**", "**/coverage/**"],
      testTimeout: 10000,
      hookTimeout: 10000,
      reporters: ["verbose"]
    },
  });
};
```

## Package-Specific Configuration

### React/UI Packages

```typescript
// packages/features/admin/vitest.config.ts
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineProject } from "vitest/config";

export default defineProject({
  plugins: [
    react({ jsxImportSource: "react" }),
    tsconfigPaths(), // Resolves TypeScript path aliases
  ],
  test: {
    name: "admin",
    environment: "jsdom", // Required for React components
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    server: {
      deps: {
        external: ["server-only"], // Handle Next.js server modules
      },
    },
  },
});
```

**IMPORTANT**: Coverage configuration is NOT allowed at the package level when using `defineProject`. Coverage must be configured only at the root level in the main `vitest.config.ts`.

### Node.js/Service Packages

```typescript
// packages/shared/vitest.config.ts
import { createPackageConfig } from "../vitest.config.base";

export default createPackageConfig(__dirname);
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

## Test Setup

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

## Package Setup Requirements

### Package.json Scripts

Every testable package needs these scripts:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest watch",
    "test:coverage": "vitest run --coverage"
  }
}
```

### Required Dependencies

#### For React/UI Testing

```json
{
  "devDependencies": {
    "@testing-library/jest-dom": "^6.8.0",
    "@testing-library/react": "^16.2.0",
    "@testing-library/user-event": "^14.5.2",
    "@vitejs/plugin-react": "^5.0.2",
    "jsdom": "^26.0.0",
    "vite-tsconfig-paths": "^5.1.4",
    "vitest": "^3.2.4"
  }
}
```

#### For Node.js/Service Testing

```json
{
  "devDependencies": {
    "vitest": "^3.2.4"
  }
}
```

## Running Tests

### Root Level Commands

```bash
# Run all tests (except E2E)
pnpm test

# Run tests for specific package
pnpm test --filter @kit/admin

# Run tests with coverage
pnpm test:coverage

# Run unit tests only
pnpm test:unit
```

### Package Level Commands

```bash
# From package directory
pnpm test
pnpm test:watch
pnpm test:coverage
```

### Turbo Integration

Tests are orchestrated through Turbo for:

- Parallel execution across packages
- Caching of test results
- Dependency-aware test ordering

## Test Organization

### File Structure

```
packages/[package-name]/
├── src/
│   ├── components/
│   │   ├── __tests__/        # Component tests
│   │   │   └── Component.test.tsx
│   │   └── Component.tsx
│   ├── lib/
│   │   ├── server/
│   │   │   ├── __tests__/    # Server-side tests
│   │   │   │   └── service.test.ts
│   │   │   └── service.ts
│   │   └── utils.test.ts     # Co-located tests
│   └── test/
│       └── setup.ts           # Test setup file
└── vitest.config.ts
```

### Test Naming Conventions

- Unit tests: `*.test.ts` or `*.spec.ts`
- Component tests: `*.test.tsx` or `*.spec.tsx`
- Integration tests: `*.integration.test.ts`

## Core Concepts

### vi.mock - Complete Module Replacement

```typescript
vi.mock("@kit/ai-gateway", () => ({
  getChatCompletion: vi.fn(),
  createReasoningOptimizedConfig: vi.fn(),
  PromptManager: {
    compileTemplate: vi.fn(),
  },
}));
```

### vi.fn - Standalone Mock Function

```typescript
const mockFunction = vi.fn();
mockFunction.mockResolvedValue(result);

// Typed mock
const mockFn = vi.fn<[InputType], Promise<OutputType>>();
```

### vi.spyOn - Observe Existing Method

```typescript
const spy = vi.spyOn(object, 'method');
spy.mockImplementation(() => customResult);
```

### vi.mocked - Type-Safe Mock Access

```typescript
vi.mocked(getChatCompletion).mockResolvedValue(result);
```

## Common Patterns

### Supabase Client Mock

```typescript
const mockSupabaseClient = {
  rpc: vi.fn(),
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  })),
};

vi.mock("@kit/supabase/server-client", () => ({
  getSupabaseServerClient: vi.fn(() => mockSupabaseClient),
}));
```

### Testing React Components

```typescript
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

describe("Component", () => {
  it("should handle user interaction", async () => {
    const user = userEvent.setup();
    render(<Component />);

    await user.click(screen.getByRole("button"));
    expect(screen.getByText("Result")).toBeInTheDocument();
  });
});
```

### Testing Server Actions

```typescript
import { enhanceAction } from "@kit/next/actions";

vi.mock("@kit/next/actions", () => ({
  enhanceAction: vi.fn((fn, config) => {
    return async (params: any) => {
      // Simulate schema validation if needed
      return fn(params, mockUser);
    };
  }),
}));
```

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

## Coverage Requirements

### Global Thresholds

- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

### Running Coverage

```bash
# Run coverage for specific test
npx vitest run --coverage --coverage.reporter=text,json-summary [test-file]

# Run all tests with coverage
pnpm test:coverage

# Run coverage for a specific package
pnpm --filter web test:coverage
```

## Troubleshooting

### Module Resolution Errors

- Ensure `vite-tsconfig-paths` is installed and configured
- Check that TypeScript paths are correctly defined in `tsconfig.json`

### Server-Only Module Errors

Add to vitest config:

```typescript
server: { deps: { external: ["server-only"] } }
```

### React Testing Library Setup

- Ensure `jsdom` environment is configured
- Install all React Testing Library packages

### Turbo Cache Issues

```bash
# Clear cache
turbo test --force

# Check outputs configuration in turbo.json
```

### Mock Not Working

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

### Type Errors with Mocks

**Cause**: Missing type information
**Solution**: Use vi.mocked for type safety

```typescript
// ✅ Type-safe mock access
vi.mocked(getChatCompletion).mockResolvedValue(result);

// ❌ No type information
(getChatCompletion as any).mockResolvedValue(result);
```

### Flaky Tests

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

## Adding Tests to New Packages

1. Add package to root `vitest.config.ts` projects array
2. Create package `vitest.config.ts` (use base config or custom)
3. Add test scripts to package `package.json`
4. Install required dependencies
5. Create test setup file if needed
6. Write tests following established patterns
7. Run `pnpm install` at root to update dependencies
8. Verify with `pnpm test --filter [package-name]`

## Best Practices

1. **Co-locate tests** with the code they test when possible
2. **Use descriptive test names** that explain the expected behavior
3. **Mock external dependencies** to keep tests fast and isolated
4. **Test user behavior** rather than implementation details
5. **Maintain high coverage** for security-critical code
6. **Use setup files** to centralize common test configuration
7. **Leverage Turbo caching** for faster test runs
8. **Run tests in CI** with coverage reporting

## Related Files

- `/vitest.config.ts` - Root configuration
- `/packages/vitest.config.base.ts` - Base configuration
- `/apps/web/test/test-helpers.ts` - Test utilities
- `/turbo.json` - Turbo orchestration configuration
