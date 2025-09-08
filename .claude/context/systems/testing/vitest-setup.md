# Vitest Testing Setup

## Overview

This monorepo uses Vitest as the primary testing framework, orchestrated through Turbo for parallel execution across packages.

## Architecture

### 1. Root Configuration (`/vitest.config.ts`)

The root vitest config uses the projects feature to handle multiple packages:

```typescript
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

### 2. Base Configuration (`/packages/vitest.config.base.ts`)

Provides shared configuration for Node.js packages:

```typescript
export const createPackageConfig = (packageDir: string) => {
  return defineProject({
    test: {
      environment: "node",
      globals: true,
      // Standard test patterns
      include: ["**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}"],
    },
  });
};
```

### 3. Package-Specific Configuration

Each package requires its own `vitest.config.ts`:

**IMPORTANT: Coverage configuration is NOT allowed at the package level when using `defineProject`. Coverage must be configured only at the root level in the main `vitest.config.ts`. The `ProjectConfig` type used by `defineProject` intentionally excludes the `coverage` property.**

#### React/UI Packages
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
    // ❌ DO NOT add coverage here - it will cause TypeScript errors
    // Coverage is configured at the root level only
    server: {
      deps: {
        external: ["server-only"], // Handle Next.js server modules
      },
    },
  },
});
```

#### Node.js/Service Packages
```typescript
// packages/shared/vitest.config.ts
import { createPackageConfig } from "../vitest.config.base";

export default createPackageConfig(__dirname);
```

## Package Setup Requirements

### 1. Package.json Scripts

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

### 2. Required Dependencies

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

### 3. Test Setup File

For packages testing React components or Next.js features:

```typescript
// src/test/setup.ts
import { vi } from "vitest";

// Mock Next.js modules
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/",
  redirect: vi.fn(),
  notFound: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));
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

## Coverage Requirements

### Global Thresholds (Root)
- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

### Package-Specific Thresholds
**Note: While individual packages may have different coverage requirements conceptually, all coverage configuration must be done at the root `vitest.config.ts` level. The `defineProject` function does not support coverage configuration.**

To apply different thresholds to specific packages, you would need to:
1. Use separate test runs with different configs
2. Or maintain a single global threshold that meets your strictest requirements

## Common Patterns

### Mocking Supabase Client
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

## Troubleshooting

### Common Issues

1. **Module Resolution Errors**
   - Ensure `vite-tsconfig-paths` is installed and configured
   - Check that TypeScript paths are correctly defined in `tsconfig.json`

2. **Server-Only Module Errors**
   - Add to vitest config: `server: { deps: { external: ["server-only"] } }`

3. **React Testing Library Setup**
   - Ensure `jsdom` environment is configured
   - Install all React Testing Library packages

4. **Turbo Cache Issues**
   - Clear cache: `turbo test --force`
   - Check `outputs` configuration in `turbo.json`

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

## CI/CD Integration

Tests are automatically run in CI pipelines:
- Pull requests require all tests to pass
- Coverage reports are generated and tracked
- Failed tests block deployment
- Turbo caching speeds up CI test runs