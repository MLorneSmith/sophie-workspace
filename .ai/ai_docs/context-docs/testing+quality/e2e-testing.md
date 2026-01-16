---
id: "e2e-testing-fundamentals"
title: "End-to-End Testing Fundamentals"
version: "3.1.0"
category: "standards"

description: "Comprehensive E2E testing guidance with Playwright, including patterns, troubleshooting, and ROI optimization"
tags: ["e2e", "playwright", "testing", "integration", "automation", "quality", "docker", "supabase"]

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
  - id: "docker-setup"
    type: "related"
    description: "Docker configuration for test environment"

created: "2025-01-10"
last_updated: "2025-12-09"
author: "create-context"
---

# End-to-End Testing Fundamentals

## Overview

End-to-End (E2E) testing validates complete user workflows across all system layers, from the UI through APIs to the database. E2E tests occupy the smallest layer of the testing pyramid (10-20% of total tests) but provide the highest confidence that critical business flows work correctly. Modern frameworks like Playwright enable reliable, fast E2E testing with features like auto-waiting, parallel execution, and cross-browser support.

## Architecture Overview

### Port Mapping (Dev vs Test)

SlideHeroes uses a **single Supabase instance** shared between dev and test environments, but **separate application servers** to enable parallel development and testing:

| Component | Dev Port | Test Port | Notes |
|-----------|----------|-----------|-------|
| **Supabase API** | 54521 | 54521 | Single Docker instance, shared |
| **Supabase DB** | 54522 | 54522 | Single PostgreSQL instance |
| **Supabase Inbucket** | 54524 | 54524 | Email testing (shared) |
| **Next.js (web)** | 3000 | 3001 | Separate server processes |
| **Payload CMS** | 3020 | 3021 | Separate server processes |

### Why This Architecture?

1. **Single Database**: Ensures test data seeding and RLS policies are consistent
2. **Separate App Servers**: Allows running E2E tests while developing without interference
3. **Docker Isolation**: Test servers run in Docker containers with controlled environment variables

### Environment Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Supabase (Docker)                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ API :54521  │  │ DB :54522   │  │ Inbucket    │             │
│  │             │  │ PostgreSQL  │  │ :54524      │             │
│  └──────┬──────┘  └──────┬──────┘  └─────────────┘             │
└─────────┼────────────────┼──────────────────────────────────────┘
          │                │
    ┌─────┴────────────────┴─────┐
    │                            │
┌───┴───┐                    ┌───┴───┐
│  DEV  │                    │ TEST  │
├───────┤                    ├───────┤
│Web    │                    │Web    │
│:3000  │                    │:3001  │ ◄── docker-compose.test.yml
├───────┤                    ├───────┤
│Payload│                    │Payload│
│:3020  │                    │:3021  │
└───────┘                    └───────┘
    │                            │
    ▼                            ▼
 pnpm dev                   E2E Tests (Playwright)
```

## Implementation Details

### Project Structure (SlideHeroes)

```typescript
// apps/e2e/playwright.config.ts
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  globalSetup: "./global-setup.ts",
  forbidOnly: !!process.env.CI,
  retries: 1,
  // Worker configuration:
  // CI: 3 workers for 4-core runners (1 core reserved for OS/overhead)
  // Local: 4 workers with updated .wslconfig (24GB RAM, 16 processors)
  workers: process.env.CI ? 3 : 4,
  reporter: "html",
  use: {
    // Default to test server port (3001), not dev server (3000)
    baseURL: process.env.PLAYWRIGHT_BASE_URL ||
             process.env.TEST_BASE_URL ||
             process.env.BASE_URL ||
             "http://localhost:3001",

    // Vercel protection bypass for deployed environments
    extraHTTPHeaders: process.env.VERCEL_AUTOMATION_BYPASS_SECRET
      ? {
          "x-vercel-protection-bypass": process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
          "x-vercel-set-bypass-cookie": "samesitenone",
        }
      : {},

    screenshot: "only-on-failure",
    trace: "on-first-retry",
    navigationTimeout: process.env.CI ? 90 * 1000 : 45 * 1000,
  },
  // Test timeout: 2 min CI, 90s local (reduced from 3min/2min for faster failure detection)
  timeout: process.env.CI ? 120 * 1000 : 90 * 1000,
  expect: {
    timeout: process.env.CI ? 15 * 1000 : 10 * 1000,
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: ".auth/test1@slideheroes.com.json",
      },
      // Exclude Payload tests - they use a separate project
      testIgnore: [/.*\.setup\.ts/, /.*payload.*/],
    },
    {
      name: "payload",
      use: {
        ...devices["Desktop Chrome"],
        storageState: ".auth/payload-admin.json",
        baseURL: process.env.PAYLOAD_PUBLIC_SERVER_URL || "http://localhost:3021",
      },
      testMatch: /.*payload.*\.spec\.ts/,
      testIgnore: /.*\.setup\.ts/,
    },
  ],
});
```

### Test Organization

**Structure**: `tests/` contains: `smoke/`, `authentication/`, `account/`, `team-accounts/`, `admin/`, `invitations/`, `accessibility/`, `payload/`, `user-billing/`, `team-billing/`, `helpers/`, `utils/`

### Docker Test Environment

The test environment is defined in `docker-compose.test.yml` at the project root. It runs:

- **app-test**: Next.js web app on port 3001
- **payload-test**: Payload CMS on port 3021
- **stripe-webhook** (optional): For billing tests

**Starting the Test Environment:**

```bash
# Start test servers
docker-compose -f docker-compose.test.yml up -d

# Wait for health checks to pass
curl http://localhost:3001/api/health  # Web app
curl http://localhost:3021/api/health  # Payload CMS

# Run E2E tests
pnpm --filter e2e test
```

**Cookie Naming Issue (Critical):**

Supabase auth cookies are named based on the hostname:
- `http://127.0.0.1:54521` → `sb-127-auth-token`
- `http://host.docker.internal:54521` → `sb-host-auth-token`

The Docker test containers use `host.docker.internal` to reach Supabase on the host machine. The global setup handles this by using separate URLs for authentication vs cookie naming:

```typescript
// For actual authentication (works on host)
const supabaseAuthUrl = "http://127.0.0.1:54521";

// For cookie naming (must match what server expects)
const supabaseCookieUrl = process.env.CI === "true"
  ? supabaseAuthUrl  // CI uses same URL
  : "http://host.docker.internal:54521";  // Docker needs different cookie name
```

**Warning**: Running E2E tests against the dev server (port 3000) will likely fail due to cookie name mismatches. Always use the test server (port 3001).

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

Tests are organized into 15 shards for parallel CI execution:

```json
{
  "scripts": {
    "test:shard1": "playwright test tests/smoke/smoke.spec.ts --config=playwright.smoke.config.ts",
    "test:shard2": "playwright test tests/authentication/auth-simple.spec.ts tests/authentication/auth.spec.ts tests/authentication/password-reset.spec.ts --config=playwright.auth.config.ts",
    "test:shard3": "playwright test tests/account/account.spec.ts tests/account/account-simple.spec.ts",
    "test:shard4": "playwright test tests/admin/admin.spec.ts tests/invitations/invitations.spec.ts",
    "test:shard5": "playwright test tests/accessibility/accessibility-hybrid.spec.ts tests/accessibility/accessibility-hybrid-simple.spec.ts",
    "test:shard6": "playwright test tests/healthcheck.spec.ts",
    "test:shard7": "PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3021 playwright test tests/payload/payload-auth.spec.ts --project=payload",
    "test:shard8": "PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3021 playwright test tests/payload/payload-collections.spec.ts --project=payload",
    "test:shard9": "PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3021 playwright test tests/payload/payload-database.spec.ts --project=payload",
    "test:shard10": "playwright test tests/user-billing/user-billing.spec.ts --config=playwright.billing.config.ts",
    "test:shard11": "playwright test tests/team-billing/team-billing.spec.ts --config=playwright.billing.config.ts",
    "test:shard12": "playwright test tests/test-configuration-verification.spec.ts",
    "test:shard13": "playwright test tests/team-accounts/team-accounts.spec.ts tests/team-accounts/team-invitation-mfa.spec.ts",
    "test:shard14": "PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3021 playwright test tests/payload/seeding.spec.ts --project=payload",
    "test:shard15": "PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3021 playwright test tests/payload/seeding-performance.spec.ts --project=payload"
  }
}
```

**Shard Groups for Logical Execution:**

| Group | Shards | Tests |
|-------|--------|-------|
| Smoke & Config | 1, 6, 12 | Basic health checks, configuration verification |
| Authentication | 2 | Sign-in, sign-up, password reset, MFA |
| Accounts | 3, 13 | Personal accounts, team accounts |
| Admin & Invitations | 4 | Admin panel, team invitations |
| Accessibility | 5 | A11y compliance (axe-core) |
| Payload CMS | 7, 8, 9, 14, 15 | CMS auth, collections, database, seeding |
| Billing | 10, 11 | User billing, team billing (requires Stripe) |

## Related Files

### Configuration Files

- `/apps/e2e/playwright.config.ts`: Main Playwright configuration
- `/apps/e2e/playwright.smoke.config.ts`: Smoke test configuration
- `/apps/e2e/playwright.auth.config.ts`: Auth test configuration
- `/apps/e2e/playwright.billing.config.ts`: Billing test configuration
- `/apps/e2e/global-setup.ts`: Global setup for authenticated browser states (critical)
- `/apps/e2e/package.json`: Test scripts and dependencies
- `/apps/e2e/.env.local`: Local environment variables
- `/docker-compose.test.yml`: Docker test environment definition

### Test Implementation

- `/apps/e2e/tests/**/*.spec.ts`: Test specifications
- `/apps/e2e/tests/helpers/`: Shared test utilities and Page Objects
- `/apps/e2e/tests/utils/credential-validator.ts`: Credential validation for test users
- `/apps/e2e/tests/utils/server-health-check.ts`: Health check utilities
- `/apps/e2e/tests/utils/e2e-validation.ts`: Pre-flight validation

### Authentication States

Pre-authenticated browser storage states (gitignored, created by global-setup.ts):

- `/apps/e2e/.auth/test1@slideheroes.com.json`: Default test user state
- `/apps/e2e/.auth/test2@slideheroes.com.json`: Owner user state
- `/apps/e2e/.auth/michael@slideheroes.com.json`: Super-admin user state (with AAL2/MFA)
- `/apps/e2e/.auth/payload-admin.json`: Payload CMS admin state

### Documentation

- `/apps/e2e/CLAUDE.md`: E2E-specific Claude instructions
- `/apps/e2e/E2E-FIX-PLAN.md`: Current issues and improvement plan

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
workers: process.env.CI ? 3 : 4, // 3 workers in CI (4-core runners), 4 local
retries: 1, // Single retry for flaky tests
timeout: process.env.CI ? 120 * 1000 : 90 * 1000, // 2 min in CI, 90s local
navigationTimeout: process.env.CI ? 90 * 1000 : 45 * 1000, // Account for cold starts
extraHTTPHeaders: process.env.VERCEL_AUTOMATION_BYPASS_SECRET
  ? {
      "x-vercel-protection-bypass": process.env.VERCEL_AUTOMATION_BYPASS_SECRET,
      "x-vercel-set-bypass-cookie": "samesitenone",
    }
  : {},
```

**Key optimizations**:

- **3 CI workers**: Balance between speed and stability on 4-core runners
- **Vercel bypass headers**: Prevent authentication challenges in deployed environments
- **Extended timeouts**: Handle cold starts and network latency
- **Global setup**: Eliminates authentication race conditions (see Advanced Patterns section)

### Health Check Failures

**Problem**: Tests fail immediately with "Supabase unreachable" or "Next.js unreachable"

The global setup runs health checks before creating auth states. If services are down, tests fail fast with clear error messages.

**Health Check Flow:**

```typescript
// apps/e2e/tests/utils/server-health-check.ts
const [supabaseHealth, nextJsHealth, payloadHealth] = await Promise.all([
  checkSupabaseHealth(),   // Required - tests won't run without it
  checkNextJsHealth(),     // Required - tests won't run without it
  checkPayloadHealth(),    // Optional - only needed for Payload shards (7-8)
]);
```

**Solution:**

```bash
# Check Supabase is running
curl http://127.0.0.1:54521/rest/v1/

# Check test server is running
curl http://localhost:3001/api/health

# Check Payload (if running Payload tests)
curl http://localhost:3021/api/access

# If services are down, start them:
pnpm supabase:web:start  # Start Supabase
docker-compose -f docker-compose.test.yml up -d  # Start test servers
```

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

Global setup (`apps/e2e/global-setup.ts`) runs **once** before all tests to create authenticated browser states via API. Benefits: 3-5x faster than UI auth, no race conditions, scales to 4+ workers.

**Key Features:**
- Health checks first (fails fast if Supabase/Next.js unhealthy)
- Dual URL strategy for Docker cookie compatibility
- MFA/AAL2 support for super-admin users
- Payload CMS authentication for Payload tests
- Uses `@supabase/ssr` for proper cookie encoding

**Auth States Created:**

| Role | Storage State File |
|------|-------------------|
| Test User | `.auth/test1@slideheroes.com.json` |
| Owner | `.auth/test2@slideheroes.com.json` |
| Super Admin (AAL2) | `.auth/michael@slideheroes.com.json` |
| Payload Admin | `.auth/payload-admin.json` |

### Cookie Naming (Critical)

Cookie names are derived from Supabase URL hostname:
```typescript
// http://host.docker.internal:54521 → sb-host-auth-token
// http://127.0.0.1:54521 → sb-127-auth-token
const cookieName = `sb-${new URL(supabaseUrl).hostname.split(".")[0]}-auth-token`;
```

Docker containers use `host.docker.internal`, so global-setup uses separate URLs for auth vs cookie naming to ensure compatibility.

### Vercel Protection Bypass

For deployed environments, set `VERCEL_AUTOMATION_BYPASS_SECRET` in CI:

```yaml
# .github/workflows/e2e.yml
env:
  VERCEL_AUTOMATION_BYPASS_SECRET: ${{ secrets.VERCEL_AUTOMATION_BYPASS_SECRET }}
  PLAYWRIGHT_BASE_URL: ${{ steps.deploy.outputs.preview_url }}
```

The config adds `x-vercel-protection-bypass` and `x-vercel-set-bypass-cookie` headers automatically.

## Best Practices

**Do:**
- Focus on critical user journeys (auth, payments, core features)
- Use Page Object Model, `data-testid` selectors, proper wait strategies
- Run tests in parallel with isolation
- Use global setup for authentication

**Don't:**
- Test every scenario with E2E (use unit/integration tests)
- Use fragile CSS selectors or ignore flaky tests
- Authenticate in individual tests when storage states exist
- Share test data without cleanup
