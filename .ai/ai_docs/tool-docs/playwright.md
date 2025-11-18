# Playwright E2E Testing - SlideHeroes Reference

**Purpose**: Project-specific Playwright patterns, commands, and workflows for SlideHeroes E2E testing.

**Related Files**:

- `apps/e2e/playwright.config.ts` - Playwright configuration
- `apps/e2e/tests/` - E2E test suites
- `.github/workflows/test-e2e.yml` - E2E CI/CD pipeline
- `CLAUDE.md` - Testing philosophy and standards

## SlideHeroes Test Commands

```bash
# Run E2E tests (from project root)
pnpm test:e2e

# Run specific E2E suite
pnpm --filter web-e2e test

# Run with specific shard (used in CI)
pnpm --filter web-e2e test:shard1
pnpm --filter web-e2e test:shard2
pnpm --filter web-e2e test:shard3
pnpm --filter web-e2e test:shard4

# Debug mode
pnpm --filter web-e2e playwright test --debug

# UI mode (interactive)
pnpm --filter web-e2e playwright test --ui

# Update snapshots
pnpm --filter web-e2e playwright test --update-snapshots

# Headed mode (visible browser)
pnpm --filter web-e2e playwright test --headed
```

## Project Configuration Pattern

**apps/e2e/playwright.config.ts**:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,

  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['html', { open: 'on-failure' }]],

  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],

  webServer: {
    command: 'pnpm --filter web dev:test',
    url: 'http://localhost:3000',
    timeout: 120000,
    reuseExistingServer: !process.env.CI,
  },
});
```

## Authentication Pattern (Project-Specific)

**auth.setup.ts** - Runs once, saves state for all tests:

```typescript
import { test as setup, expect } from '@playwright/test';

const authFile = '.auth/user.json';

setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Username').fill(process.env.TEST_USER_EMAIL!);
  await page.getByLabel('Password').fill(process.env.TEST_USER_PASSWORD!);
  await page.getByRole('button', { name: 'Sign in' }).click();

  // Wait for authentication - adjust selector to match project
  await expect(page.getByText('Dashboard')).toBeVisible();

  // Save authentication state
  await page.context().storageState({ path: authFile });
});
```

All tests automatically use `.auth/user.json` via `storageState` configuration.

## Locator Priority (The Playwright Way)

**Always prefer in this order**:

1. **Role-based** (most resilient): `page.getByRole('button', { name: 'Submit' })`
2. **Label-based**: `page.getByLabel('Email')`
3. **Test ID**: `page.getByTestId('submit-button')`
4. **CSS/XPath** (last resort): `page.locator('.btn-primary')`

**Common pattern for SlideHeroes**:

```typescript
// Good - semantic, resilient
await page.getByRole('button', { name: 'New Presentation' }).click();
await page.getByLabel('Title').fill('Q4 Results');

// Add data-testid for complex cases
// <button data-testid="create-presentation">Create</button>
await page.getByTestId('create-presentation').click();
```

## Page Object Pattern (SlideHeroes Standard)

```typescript
import type { Page, Locator } from '@playwright/test';

export class PresentationPage {
  readonly page: Page;
  readonly createButton: Locator;
  readonly titleInput: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.createButton = page.getByRole('button', { name: 'New Presentation' });
    this.titleInput = page.getByLabel('Title');
    this.saveButton = page.getByRole('button', { name: 'Save' });
  }

  async goto() {
    await this.page.goto('/dashboard/presentations');
  }

  async create(title: string) {
    await this.createButton.click();
    await this.titleInput.fill(title);
    await this.saveButton.click();
  }
}
```

**Usage**:

```typescript
test('create presentation', async ({ page }) => {
  const presentations = new PresentationPage(page);
  await presentations.goto();
  await presentations.create('Q4 Results');
  await expect(page.getByText('Presentation created')).toBeVisible();
});
```

## Critical Testing Principles (From CLAUDE.md)

### When Tests Fail, Fix the Code

**Never modify tests to make them pass.** Failing tests reveal:

1. **Real bugs** - The code doesn't work as expected
2. **Missing features** - Functionality isn't implemented
3. **Broken assumptions** - Requirements changed

```typescript
// If this test fails, DON'T change the test
test('user can delete presentation', async ({ page }) => {
  await page.getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByText('Presentation deleted')).toBeVisible();
});

// Instead, investigate:
// - Is the delete button missing?
// - Is the delete functionality broken?
// - Is the success message wrong?
```

### Test Real Functionality

```typescript
// Bad - always passes, tests nothing
test('button exists', async ({ page }) => {
  expect(true).toBe(true);
});

// Good - tests actual behavior
test('user can save presentation', async ({ page }) => {
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Saved successfully')).toBeVisible();
});
```

## Debugging Workflow

### 1. Use UI Mode for Development

```bash
pnpm --filter web-e2e playwright test --ui
```

**Features**:
- Watch mode (auto-rerun on changes)
- Time travel debugging
- Pick locator tool
- View DOM snapshots

### 2. Pause Execution

```typescript
test('debug test', async ({ page }) => {
  await page.goto('/dashboard');

  await page.pause(); // Opens Playwright Inspector

  await page.getByRole('button', { name: 'Create' }).click();
});
```

### 3. Trace Viewer (Post-Mortem)

```bash
# Traces auto-saved on failure (configured in playwright.config.ts)
pnpm --filter web-e2e playwright show-report
```

**Trace shows**:
- Timeline of all actions
- DOM snapshots at each step
- Network activity
- Console logs
- Screenshots

## Common Patterns for SlideHeroes

### Waiting for Navigation

```typescript
// After action that navigates
await page.getByRole('button', { name: 'Create' }).click();
await page.waitForURL(/\/presentations\/[a-z0-9-]+/);

// Or use expect
await expect(page).toHaveURL(/\/presentations\//);
```

### Handling Supabase Auth

```typescript
// Tests use saved auth state (.auth/user.json)
// To test unauthenticated flow:
test.use({ storageState: { cookies: [], origins: [] } });

test('login redirects to dashboard', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL('/login'); // Redirected
});
```

### Testing Forms with Validation

```typescript
test('form shows validation errors', async ({ page }) => {
  await page.goto('/settings');

  // Trigger validation by submitting empty form
  await page.getByRole('button', { name: 'Save' }).click();

  // Check for validation messages
  await expect(page.getByText('Email is required')).toBeVisible();

  // Fill valid data
  await page.getByLabel('Email').fill('user@example.com');
  await page.getByRole('button', { name: 'Save' }).click();

  // Should succeed
  await expect(page.getByText('Settings saved')).toBeVisible();
});
```

### Network Mocking for API Responses

```typescript
test('handles API errors gracefully', async ({ page }) => {
  // Mock API to return error
  await page.route('**/api/presentations', route => {
    route.fulfill({
      status: 500,
      json: { error: 'Server error' }
    });
  });

  await page.goto('/dashboard');
  await expect(page.getByText('Failed to load presentations')).toBeVisible();
});
```

### Testing Real-Time Features

```typescript
test('live collaboration updates', async ({ page, context }) => {
  // Open second tab to simulate another user
  const page2 = await context.newPage();

  await page.goto('/presentation/123/edit');
  await page2.goto('/presentation/123/edit');

  // Edit in first tab
  await page.getByLabel('Title').fill('Updated Title');

  // Should appear in second tab (via Supabase Realtime)
  await expect(page2.getByLabel('Title')).toHaveValue('Updated Title', {
    timeout: 5000
  });
});
```

## CI/CD Integration (SlideHeroes Pattern)

**.github/workflows/test-e2e.yml**:

```yaml
name: E2E Tests
on:
  workflow_call:
    inputs:
      shard:
        required: true
        type: string
jobs:
  e2e-test:
    runs-on: runs-on,runner=8cpu-linux-x64,family=c7a+m7a,hdd=50,image=ubuntu22-full-x64,run-id=${{ github.run_id }}
    timeout-minutes: 20
    env:
      SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
      SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
      PLAYWRIGHT_TEST_BASE_URL: http://localhost:3000
    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Install Playwright
        run: pnpm --filter web-e2e exec playwright install --with-deps chromium

      - name: Run E2E tests
        run: pnpm --filter web-e2e test:${{ inputs.shard }}

      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report-${{ inputs.shard }}
          path: apps/e2e/playwright-report/
          retention-days: 30
```

**Sharding**: Tests split into 4 shards for parallel execution in CI.

## Best Practices (SlideHeroes Standard)

### 1. Use Auto-Waiting Assertions

```typescript
// Good - auto-waits up to timeout
await expect(page.getByText('Success')).toBeVisible();

// Bad - no auto-waiting, flaky
expect(await page.getByText('Success').isVisible()).toBe(true);
```

### 2. Avoid Hard Waits

```typescript
// Bad
await page.waitForTimeout(5000);

// Good - wait for specific condition
await expect(page.getByText('Loaded')).toBeVisible();
await page.waitForLoadState('networkidle');
```

### 3. Test Isolation

```typescript
// Each test must be independent
test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
});
```

### 4. Tag Tests for Selective Execution

```typescript
test('critical user flow @smoke @critical', async ({ page }) => {
  // Test implementation
});

test('slow integration test @slow', async ({ page }) => {
  // Test implementation
});
```

```bash
# Run only smoke tests
pnpm --filter web-e2e playwright test --grep @smoke

# Exclude slow tests
pnpm --filter web-e2e playwright test --grep-invert @slow
```

### 5. Block Unnecessary Requests

```typescript
test.beforeEach(async ({ page }) => {
  // Speed up tests by blocking analytics
  await page.route('**/google-analytics.com/**', route => route.abort());
  await page.route('**/facebook.com/tr', route => route.abort());
});
```

## Troubleshooting

### Test Timeouts

```typescript
// Increase timeout for specific test
test('slow test', async ({ page }) => {
  test.setTimeout(120000); // 2 minutes
  await page.goto('/slow-page');
});

// Or in config (playwright.config.ts)
timeout: 30000,
expect: { timeout: 10000 },
```

### Flaky Tests

```typescript
// Retry flaky tests
test.describe.configure({ retries: 2 });

// Wait for stable state
await page.waitForLoadState('networkidle');
await page.waitForLoadState('domcontentloaded');

// Increase specific assertion timeout
await expect(page.getByText('Slow')).toBeVisible({ timeout: 10000 });
```

### Element Not Found

```typescript
// Check if element exists (for optional elements)
const count = await page.getByText('Optional').count();
if (count > 0) {
  await page.getByText('Optional').click();
}

// Wait for element
await page.waitForSelector('.my-element', { state: 'visible' });
```

### CI Failures

**Common issues**:

1. **Browsers not installed**: Ensure `playwright install --with-deps chromium` runs
2. **Wrong base URL**: Set `PLAYWRIGHT_TEST_BASE_URL` in CI
3. **Timeout too short**: Increase `timeout-minutes` in workflow
4. **Auth state missing**: Verify setup project runs before tests

## Quick Reference

### Most Used Commands

```bash
# Run tests
pnpm --filter web-e2e test
pnpm --filter web-e2e playwright test --debug
pnpm --filter web-e2e playwright test --ui
pnpm --filter web-e2e playwright test --headed

# Generate tests (codegen)
npx playwright codegen http://localhost:3000

# View reports
pnpm --filter web-e2e playwright show-report

# Update snapshots
pnpm --filter web-e2e playwright test --update-snapshots
```

### Most Used Locators

```typescript
page.getByRole('button', { name: 'Submit' })
page.getByLabel('Email')
page.getByPlaceholder('Enter email')
page.getByText('Welcome')
page.getByTestId('submit-button')
```

### Most Used Assertions

```typescript
await expect(locator).toBeVisible()
await expect(locator).toHaveText('text')
await expect(locator).toBeEnabled()
await expect(locator).toHaveCount(5)
await expect(page).toHaveURL(/pattern/)
await expect(page).toHaveTitle('title')
```

### Most Used Actions

```typescript
await page.goto('/')
await locator.click()
await locator.fill('text')
await locator.press('Enter')
await locator.check()
await page.screenshot({ path: 'screenshot.png' })
await page.pause()
```

## Related Documentation

- **Playwright Official Docs**: https://playwright.dev
- **E2E Testing Guide**: `.ai/ai_docs/context-docs/testing/e2e-testing.md`
- **Testing Fundamentals**: `.ai/ai_docs/context-docs/testing/fundamentals.md`
- **SlideHeroes Testing Philosophy**: `CLAUDE.md` - Testing section
- **CI/CD Pipeline**: `.github/workflows/test-e2e.yml`
