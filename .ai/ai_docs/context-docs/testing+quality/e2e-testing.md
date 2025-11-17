---
id: "e2e-testing-fundamentals"
title: "End-to-End Testing Fundamentals"
version: "2.2.0"
category: "standards"

description: "Comprehensive E2E testing guidance with Playwright, including patterns, troubleshooting, and ROI optimization"
tags: ["e2e", "playwright", "testing", "integration", "automation", "quality"]

dependencies: ["testing-strategy", "ci-cd-integration"]
cross_references:
  - id: "integration-testing-fundamentals"
    type: "related"
    description: "Integration testing complements E2E testing at lower levels"
  - id: "performance-testing-fundamentals"
    type: "related"
    description: "Performance testing can be integrated with E2E tests"
  - id: "accessibility-testing-fundamentals"
    type: "related"
    description: "Accessibility testing through E2E workflows"

created: "2025-01-10"
last_updated: "2025-11-15"
author: "create-context"
---

# End-to-End Testing Fundamentals

## Overview

End-to-End (E2E) testing validates complete user workflows across all system layers, from the UI through APIs to the database. E2E tests occupy the smallest layer of the testing pyramid (10-20% of total tests) but provide the highest confidence that critical business flows work correctly. Modern frameworks like Playwright enable reliable, fast E2E testing with features like auto-waiting, parallel execution, and cross-browser support.

## Key Concepts

### Testing Pyramid Position

- **Unit Tests**: 70% - Fast, isolated component testing
- **Integration Tests**: 20% - Module interaction testing
- **E2E Tests**: 10% - Complete user journey validation

### E2E vs Other Test Types

- **Scope**: Full system vs isolated components
- **Speed**: Slowest but most comprehensive
- **Maintenance**: Higher cost but critical value
- **Confidence**: Highest for user-facing functionality

### ROI Framework

```
ROI = (Benefits - Costs) / Costs × 100%
Target: >150% ROI achievable with proper implementation
```

### Critical Success Metrics

- **Defect Escape Rate**: <5% target
- **Test Stability**: >95% pass rate
- **Critical Path Coverage**: >80% of business-critical flows
- **Execution Time**: <30 minutes for full suite

## Implementation Details

### Project Structure (SlideHeroes)

```typescript
// apps/e2e/playwright.config.ts
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  // Global setup runs once before all tests to create authenticated browser states
  globalSetup: "./global-setup.ts",
  forbidOnly: !!process.env.CI,
  retries: 1, // Actual: 1 retry (not 3)
  // Limit parallel tests on CI to prevent resource contention
  workers: process.env.CI ? 2 : undefined, // Actual: 2 workers in CI (not 1)
  reporter: "html",
  use: {
    // Multiple fallback URLs for flexibility
    baseURL: process.env.PLAYWRIGHT_BASE_URL ||
             process.env.TEST_BASE_URL ||
             process.env.BASE_URL ||
             "http://localhost:3000",

    // Add Vercel protection bypass headers for deployed environments
    // x-vercel-protection-bypass: For direct API/HTTP requests
    // x-vercel-set-bypass-cookie: Sets browser cookie for navigation/auth flows
    extraHTTPHeaders: process.env.VERCEL_AUTOMATION_BYPASS_SECRET
      ? {
          "x-vercel-protection-bypass": process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
          "x-vercel-set-bypass-cookie": process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
        }
      : {},

    screenshot: "only-on-failure",
    trace: "on-first-retry",
    // Increased navigation timeout for deployed environments
    // Accounts for: Vercel cold starts, network latency, edge function initialization
    navigationTimeout: process.env.CI ? 90 * 1000 : 45 * 1000, // Actual: 90s CI, 45s local
  },
  // Test timeout increased for CI to handle deployed environment latency
  // Setup tests need more time for authentication flows
  timeout: process.env.CI ? 180 * 1000 : 120 * 1000, // 3 min in CI, 2 min local
  expect: {
    // Expect timeout for assertions
    timeout: process.env.CI ? 15 * 1000 : 10 * 1000, // 15s in CI, 10s local
  },
  // Configure projects with pre-authenticated states
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Use pre-authenticated state from global setup
        // This eliminates per-test authentication and enables true parallel execution
        storageState: ".auth/test@slideheroes.com.json",
      },
      testIgnore: /.*\.setup\.ts/, // Skip setup files - handled by global setup
    },
  ],
});
```

### Test Organization

**Structure**: `tests/` contains: `smoke/`, `authentication/`, `account/`, `team-accounts/`, `accessibility/`, `helpers/`

## Code Examples

### AAA Pattern Test Structure

```typescript
test('should complete critical user journey', async ({ page }) => {
  // Arrange - Pre-authenticated state loaded from global setup via storageState
  // No manual login needed - session injected into browser storage

  // Act - Navigate and perform user actions
  await page.goto('/home');
  await page.waitForLoadState('domcontentloaded');

  // User is already authenticated from global setup
  await page.locator('[data-testid="create-project-button"]').click();
  await page.locator('[data-testid="project-name"]').fill('Test Project');
  await page.locator('[data-testid="submit-button"]').click();

  // Assert - Verify expected outcomes
  await page.waitForURL('**/projects/**', { timeout: 15000 });
  await expect(page.getByText('Test Project')).toBeVisible();
});
```

### Page Object Model (POM)

```typescript
export class AuthPageObject {
  constructor(private page: Page) {}

  async goToSignIn() {
    await this.page.goto('/auth/sign-in');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async signIn({ email, password }: { email: string; password: string }) {
    await this.page.locator('[data-testid="sign-in-email"]').fill(email);
    await this.page.locator('[data-testid="sign-in-password"]').fill(password);
    await this.page.locator('[data-testid="sign-in-button"]').click();
  }

  async signOut() {
    await this.page.goto('/api/auth/signout', { method: 'POST' });
  }
}
```

### Test Data Management

```typescript
export const TEST_USERS = {
  user1: { email: 'test.user1@example.com', password: 'SecurePass123!', role: 'user' },
  admin: { email: 'test.admin@example.com', password: 'AdminPass456!', role: 'admin' }
};

// Environment-specific test data
const baseEmail = process.env.CI ? `ci.${Date.now()}@test.com` : 'local.test@example.com';
```

### Parallel Test Execution (Sharding)

```json
{
  "scripts": {
    "test:shard1": "playwright test tests/smoke/*.spec.ts",
    "test:shard2": "playwright test tests/authentication/*.spec.ts",
    "test:shard3": "playwright test tests/account/*.spec.ts tests/team-accounts/*.spec.ts"
    // ... 4 more shards for admin, billing, accessibility, config
  }
}
```

## Related Files

### Configuration Files

- `/apps/e2e/playwright.config.ts`: Main Playwright configuration
- `/apps/e2e/global-setup.ts`: Global setup for authenticated browser states (critical)
- `/apps/e2e/package.json`: Test scripts and dependencies
- `/apps/e2e/.env.example`: Environment variables template

### Test Implementation

- `/apps/e2e/tests/**/*.spec.ts`: Test specifications
- `/apps/e2e/tests/helpers/`: Shared test utilities
- `/apps/e2e/tests/utils/credential-validator.ts`: Credential validation for test users
- `/apps/e2e/supabase/seeds/01-e2e-test-data.sql`: Test data seeding

### Authentication States

- `/apps/e2e/.auth/`: Pre-authenticated browser storage states (gitignored)
- `/apps/e2e/.auth/test@slideheroes.com.json`: Default test user state
- `/apps/e2e/.auth/owner@slideheroes.com.json`: Owner user state
- `/apps/e2e/.auth/super-admin@slideheroes.com.json`: Admin user state

### Documentation

- `/apps/e2e/E2E-FIX-PLAN.md`: Current issues and improvement plan
- `/apps/e2e/README-e2e-matrix.md`: Test coverage matrix

## Common Patterns

### Selector Strategies

**Priority**: `data-testid` > ARIA roles > Labels > Text content > ❌ Avoid: CSS classes/XPath

### Wait Strategies

```typescript
// ✅ GOOD - Wait for specific conditions
await expect(page.getByText('Data loaded')).toBeVisible();
await page.waitForResponse(resp => resp.url().includes('/api/data'));
await page.waitForLoadState('networkidle');

// ❌ BAD - Arbitrary timeouts
await page.waitForTimeout(5000);
```

### Authentication State Management (Deprecated Pattern)

**NOTE**: This pattern has been replaced by global setup (see "Advanced Patterns > Global Setup Pattern" below). The old per-worker setup pattern is shown here for reference only.

```typescript
// OLD PATTERN - DO NOT USE
// tests/auth.setup.ts - Setup once per worker (slower, race conditions)
const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  await page.goto('/auth/sign-in');
  await page.getByLabel('Email').fill('test@example.com');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL('/home');
  await page.context().storageState({ path: authFile });
});

// Use in config
projects: [
  { name: 'setup', testMatch: /.*\.setup\.ts/ },
  { name: 'authenticated', use: { storageState: authFile }, dependencies: ['setup'] }
]
```

**Use global setup instead** - See "Advanced Patterns > Global Setup Pattern" section for the recommended approach.

### API Mocking

```typescript
test('handle external API failures', async ({ page }) => {
  await page.route('**/api/external/**', route => {
    route.fulfill({ status: 500, body: JSON.stringify({ error: 'Service unavailable' }) });
  });
  await page.goto('/features/external-integration');
  await expect(page.getByText('Service temporarily unavailable')).toBeVisible();
});
```

## Troubleshooting

### Portal UI Components & Timing Issues

**Problem**: Tests hang with Radix UI dropdowns or fail intermittently in CI
**Solution**: Use direct API calls (`await page.goto('/api/auth/signout', { method: 'POST' })`) and proper wait conditions (`waitForResponse`, `waitForLoadState`)

### Slow Execution & Test Data Conflicts

**Problem**: Tests take >30min or fail when run together
**Solution**: Enable parallel execution (`fullyParallel: true`), use unique test data (`test.${Date.now()}@example.com`), implement cleanup in `afterEach`

### CI/CD Failures

**Problem**: Tests pass locally but fail in CI
**Solution**: CI-specific config with optimized workers, retries, and timeouts:

```typescript
// Actual SlideHeroes configuration
workers: process.env.CI ? 2 : undefined, // 2 workers in CI prevents resource contention
retries: 1, // Single retry for flaky tests
timeout: process.env.CI ? 180 * 1000 : 120 * 1000, // 3 min in CI, 2 min local
navigationTimeout: process.env.CI ? 90 * 1000 : 45 * 1000, // Account for cold starts
extraHTTPHeaders: process.env.VERCEL_AUTOMATION_BYPASS_SECRET
  ? {
      "x-vercel-protection-bypass": process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
      "x-vercel-set-bypass-cookie": process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
    }
  : {},
```

**Key optimizations**:

- **2 CI workers**: Balance between speed and stability
- **Vercel bypass headers**: Prevent authentication challenges in deployed environments
- **Extended timeouts**: Handle cold starts and network latency
- **Global setup**: Eliminates authentication race conditions (see Advanced Patterns section)

## Performance Optimization

### Execution Speed

- **Parallel Execution**: Run independent tests concurrently
- **Test Sharding**: Distribute tests across multiple runners
- **Selective Testing**: Run only affected tests based on changes
- **Resource Optimization**: Reuse browser contexts and authentication

### Maintenance

- **Page Object Model**: Centralize UI element management
- **Data-driven Tests**: Parameterize test scenarios
- **Smart Selectors**: Use stable, semantic selectors
- **Regular Cleanup**: Remove obsolete tests and refactor duplicates

## Advanced Patterns

### Global Setup Pattern

Playwright's global setup runs **once** before all tests (not per-worker) to create authenticated browser states using API-based authentication. This pattern provides significant performance and reliability benefits over UI-based authentication in individual tests.

**Benefits**:

- 3-5x faster than UI-based per-test authentication
- No race conditions from multiple workers authenticating simultaneously
- Bypasses UI timing issues entirely
- Production-proven Playwright pattern
- Scales efficiently to 4+ workers

**Implementation** (`apps/e2e/global-setup.ts`):

```typescript
import { chromium, type FullConfig } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

async function globalSetup(config: FullConfig) {
  console.log("\n🔧 Global Setup: Creating authenticated browser states via API...\n");

  const baseURL = config.projects[0]?.use?.baseURL || "http://localhost:3001";
  const supabaseUrl = process.env.E2E_SUPABASE_URL || "http://127.0.0.1:54321";
  const supabaseAnonKey = process.env.E2E_SUPABASE_ANON_KEY || "...";

  // Define auth states to create
  const authStates = [
    {
      name: "test user",
      role: "test" as const,
      filePath: join(authDir, "test@slideheroes.com.json"),
    },
    {
      name: "owner user",
      role: "owner" as const,
      filePath: join(authDir, "owner@slideheroes.com.json"),
    },
    {
      name: "super-admin user",
      role: "admin" as const,
      filePath: join(authDir, "super-admin@slideheroes.com.json"),
    },
  ];

  const browser = await chromium.launch();

  // Authenticate all users sequentially via API
  for (const authState of authStates) {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Sign in via API
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error || !data.session) {
      throw error || new Error("No session returned from Supabase");
    }

    // Create browser context and inject session
    const context = await browser.newContext({ baseURL });
    const page = await context.newPage();
    await page.goto("/");

    // Inject Supabase session into local storage
    await page.evaluate(
      ({ session, supabaseUrl }) => {
        const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
        const key = `sb-${projectRef}-auth-token`;
        localStorage.setItem(key, JSON.stringify(session));
      },
      { session: data.session, supabaseUrl }
    );

    // Save authenticated state
    await context.storageState({ path: authState.filePath });
    await context.close();
  }

  await browser.close();
}

export default globalSetup;
```

**Configuration** (`playwright.config.ts`):

```typescript
export default defineConfig({
  globalSetup: "./global-setup.ts", // Run once before all tests
  projects: [
    {
      name: "chromium",
      use: {
        storageState: ".auth/test@slideheroes.com.json", // Use pre-authenticated state
      },
      testIgnore: /.*\.setup\.ts/, // Skip setup files
    },
  ],
});
```

### Auth Storage States Pattern

Pre-authenticated storage states eliminate the need for per-test authentication, enabling true parallel execution and reducing test execution time by 60-80%.

**Storage State Structure**:

```json
// .auth/test@slideheroes.com.json
{
  "cookies": [...],
  "origins": [
    {
      "origin": "http://localhost:3001",
      "localStorage": [
        {
          "name": "sb-abcdefgh-auth-token",
          "value": "{\"access_token\":\"...\",\"refresh_token\":\"...\"}"
        }
      ]
    }
  ]
}
```

**Key Implementation Details**:

1. **Project Reference Extraction**: The Supabase storage key must match the format Supabase expects:

   ```typescript
   // Extract project ref from Supabase URL
   const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
   const key = `sb-${projectRef}-auth-token`;
   ```

2. **Storage State Reuse**: Tests automatically load the pre-authenticated state:

   ```typescript
   // playwright.config.ts
   projects: [
     {
       name: "chromium",
       use: {
         storageState: ".auth/test@slideheroes.com.json",
       },
     },
   ]
   ```

3. **Multiple User Roles**: Create separate storage states for different user types:
   - `.auth/test@slideheroes.com.json` - Standard user
   - `.auth/owner@slideheroes.com.json` - Account owner
   - `.auth/super-admin@slideheroes.com.json` - Admin user

**Performance Impact**:

- Without storage states: ~5-10 seconds per test for authentication
- With storage states: ~0 seconds (authentication already complete)
- On a 100-test suite: Saves 8-16 minutes of execution time

### Vercel Protection Bypass Pattern

Vercel's Deployment Protection prevents unauthorized access to preview deployments. E2E tests require special bypass headers to access protected environments.

**Configuration** (`playwright.config.ts`):

```typescript
export default defineConfig({
  use: {
    // Add Vercel protection bypass headers for deployed environments
    // x-vercel-protection-bypass: For direct API/HTTP requests
    // x-vercel-set-bypass-cookie: Sets browser cookie for navigation/auth flows
    extraHTTPHeaders: process.env.VERCEL_AUTOMATION_BYPASS_SECRET
      ? {
          "x-vercel-protection-bypass":
            process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
          "x-vercel-set-bypass-cookie":
            process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
        }
      : {},
  },
});
```

**Global Setup Integration** (`global-setup.ts`):

```typescript
// Create browser context with Vercel bypass headers
const context = await browser.newContext({
  baseURL,
  extraHTTPHeaders: process.env.VERCEL_AUTOMATION_BYPASS_SECRET
    ? {
        "x-vercel-protection-bypass":
          process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
        "x-vercel-set-bypass-cookie":
          process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
      }
    : {},
});

// Explicitly set Vercel bypass cookie
if (process.env.VERCEL_AUTOMATION_BYPASS_SECRET) {
  const domain = new URL(baseURL).hostname;
  await context.addCookies([
    {
      name: "_vercel_jwt",
      value: process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
      domain,
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
    },
  ]);

  // Reload page to ensure bypass cookie is active
  await page.reload({ waitUntil: "load" });
}
```

**Environment Setup**:

```bash
# Get your bypass secret from Vercel project settings
VERCEL_AUTOMATION_BYPASS_SECRET=your-secret-here

# Required for deployed environment testing
PLAYWRIGHT_BASE_URL=https://your-preview-deployment.vercel.app
```

**Why Both Headers Are Needed**:

- `x-vercel-protection-bypass`: Works for direct HTTP requests and API calls
- `x-vercel-set-bypass-cookie`: Sets the `_vercel_jwt` cookie for browser navigation and authentication flows
- Both are required because some requests go through different paths (client-side navigation vs. server-side redirects)

**CI/CD Integration**:

```yaml
# .github/workflows/e2e.yml
env:
  VERCEL_AUTOMATION_BYPASS_SECRET: ${{ secrets.VERCEL_AUTOMATION_BYPASS_SECRET }}
  PLAYWRIGHT_BASE_URL: ${{ steps.deploy.outputs.preview_url }}
```

## Best Practices

- ✅ Focus on critical user journeys (auth, payments, core features)
- ✅ Use POM for maintainability, proper wait strategies, data-testid selectors
- ✅ Run tests in parallel with isolation, mock external services
- ✅ Track metrics: stability >95%, execution <30min, coverage >80%
- ✅ Use global setup for authentication, storage states for performance, bypass headers for protected deployments
- ❌ Don't test every scenario with E2E, use fragile selectors, or ignore flaky tests
- ❌ Avoid shared test data without cleanup or testing implementation details
- ❌ Never authenticate in individual tests when storage states are available

## See Also

- [integration-testing.md](./integration-testing.md) - Lower-level testing strategies
- [ci-cd-complete.md](../infrastructure/ci-cd-complete.md) - Continuous integration setup for E2E tests
- [performance-testing.md](./performance-testing.md) - Performance validation through E2E tests
- [accessibility-testing.md](./accessibility-testing.md) - A11y testing integration with E2E workflows
