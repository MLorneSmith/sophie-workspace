---
# Identity
id: "integration-testing-troubleshooting"
title: "Integration Testing Troubleshooting"
version: "1.0.0"
category: "troubleshooting"

# Discovery
description: "Comprehensive troubleshooting guide for common integration testing issues including flaky tests, performance problems, and debugging strategies"
tags: ["testing", "troubleshooting", "debugging", "performance", "flaky-tests"]

# Relationships
dependencies: ["integration-testing-fundamentals"]
cross_references:
  - id: "integration-testing-patterns"
    type: "related"
    description: "Common testing patterns"
  - id: "integration-testing-examples"
    type: "related"
    description: "Working code examples"

# Maintenance
created: "2025-09-15"
last_updated: "2025-09-15"
author: "create-context"
---

# Integration Testing Troubleshooting

## Overview

This guide provides solutions for common integration testing problems, debugging strategies, and performance optimization techniques for the SlideHeroes test suite.

## Key Concepts

Troubleshooting integration tests requires understanding:
- **Test isolation**: How tests affect each other
- **Timing issues**: Race conditions and async operations
- **Resource management**: Database connections, file handles
- **External dependencies**: API availability and network issues

## Common Issues and Solutions

### Issue: Flaky Tests

**Symptoms**: Tests pass sometimes but fail randomly without code changes

**Cause**: Race conditions, timing dependencies, or shared state

**Solution**:
```typescript
// ❌ Bad: Fixed delay
await new Promise(resolve => setTimeout(resolve, 1000));

// ✅ Good: Wait for condition
await expect(async () => {
  const response = await request.get('/api/status');
  const data = await response.json();
  expect(data.ready).toBe(true);
}).toPass({ timeout: 5000 });

// ✅ Good: Use Playwright's built-in waits
await page.waitForResponse(response =>
  response.url().includes('/api/data') && response.status() === 200
);
```

### Issue: Database State Pollution

**Symptoms**: Tests fail when run together but pass individually

**Cause**: Tests not cleaning up data properly

**Solution**:
```typescript
// Implement proper cleanup
test.describe('Database Tests', () => {
  const createdIds: string[] = [];

  test.afterEach(async () => {
    // Clean up in reverse order (handle foreign keys)
    for (const id of createdIds.reverse()) {
      await db.delete(id);
    }
    createdIds.length = 0;
  });

  test('creates data', async () => {
    const result = await createData();
    createdIds.push(result.id);
    // Test continues...
  });
});
```

### Issue: Slow Test Execution

**Symptoms**: Test suite takes >5 minutes to complete

**Cause**: Sequential execution, unnecessary waits, heavy setup

**Solution**:
```typescript
// Enable parallel execution
test.describe.configure({ mode: 'parallel' });

// Use test sharding in CI
// playwright.config.ts
export default {
  workers: process.env.CI ? 4 : undefined,
  fullyParallel: true,
  projects: [
    { name: 'api', testMatch: '**/api/*.test.ts' },
    { name: 'db', testMatch: '**/database/*.test.ts' }
  ]
};

// Run specific shards
// npm run test -- --shard=1/4
```

### Issue: External Service Failures

**Symptoms**: Tests fail due to third-party API issues

**Cause**: External services down or rate limited

**Solution**:
```typescript
// Implement retry logic
async function withRetry(fn: () => Promise<any>, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
    }
  }
}

// Mock external services
test.beforeEach(async ({ page }) => {
  await page.route('https://api.external.com/**', route => {
    route.fulfill({
      status: 200,
      body: JSON.stringify({ mocked: true })
    });
  });
});
```

### Issue: Authentication Token Expiry

**Symptoms**: Tests fail midway with 401 errors

**Cause**: Auth tokens expire during long test runs

**Solution**:
```typescript
class AuthManager {
  private token: string;
  private expiry: Date;

  async getToken(): Promise<string> {
    if (!this.token || new Date() > this.expiry) {
      await this.refreshToken();
    }
    return this.token;
  }

  private async refreshToken() {
    const response = await request.post('/api/auth/refresh');
    const data = await response.json();
    this.token = data.token;
    this.expiry = new Date(Date.now() + data.expiresIn * 1000);
  }
}
```

### Issue: Memory Leaks in Tests

**Symptoms**: Tests consume increasing memory, eventually crash

**Cause**: Unclosed connections, event listeners not removed

**Solution**:
```typescript
test.describe('Memory Safe Tests', () => {
  let resources: any[] = [];

  test.afterEach(async () => {
    // Clean up all resources
    for (const resource of resources) {
      if (resource.close) await resource.close();
      if (resource.removeAllListeners) resource.removeAllListeners();
    }
    resources = [];
  });

  test('uses resources safely', async () => {
    const connection = await createConnection();
    resources.push(connection);
    // Test logic...
  });
});
```

## Debugging Strategies

### Strategy 1: Enhanced Logging

```typescript
// Add debug logging
const debug = process.env.DEBUG === 'true';

test('complex flow', async ({ request }) => {
  if (debug) console.log('Starting test...');

  const response = await request.post('/api/endpoint', {
    data: payload
  });

  if (debug) {
    console.log('Response:', {
      status: response.status(),
      headers: await response.headers(),
      body: await response.text()
    });
  }

  expect(response.ok()).toBe(true);
});
```

### Strategy 2: Test Isolation

```typescript
// Run single test in isolation
test.only('problematic test', async () => {
  // This test runs alone
});

// Skip problematic tests temporarily
test.skip('flaky test', async () => {
  // This test is skipped
});

// Run with specific configuration
test.use({
  baseURL: 'http://localhost:3001',
  trace: 'on-first-retry'
});
```

### Strategy 3: Visual Debugging

```typescript
// Use Playwright's trace viewer
// Run: npx playwright test --trace on
test('visual debugging', async ({ page }) => {
  await page.goto('/');
  await page.screenshot({ path: 'debug-1.png' });

  await page.click('button');
  await page.screenshot({ path: 'debug-2.png' });
});

// Generate trace on failure
export default {
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  }
};
```

## Performance Optimization

### Database Optimization

```typescript
// Use transactions for bulk operations
test('bulk data creation', async () => {
  await db.$transaction(async (tx) => {
    const users = await tx.user.createMany({ data: userData });
    const courses = await tx.course.createMany({ data: courseData });
    return { users, courses };
  });
});

// Use connection pooling
const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});
```

### Parallel Data Setup

```typescript
test.beforeAll(async () => {
  // Setup test data in parallel
  const [users, courses, lessons] = await Promise.all([
    createTestUsers(10),
    createTestCourses(5),
    createTestLessons(20)
  ]);
});
```

### Caching Test Data

```typescript
// Cache expensive setup data
let cachedUser: User | null = null;

async function getTestUser() {
  if (!cachedUser) {
    cachedUser = await createExpensiveUser();
  }
  return cachedUser;
}

test.afterAll(async () => {
  if (cachedUser) {
    await cleanupUser(cachedUser.id);
    cachedUser = null;
  }
});
```

## CI/CD Specific Issues

### Issue: Tests Pass Locally but Fail in CI

**Common Causes**:
- Different environment variables
- Timezone differences
- Resource constraints
- Network restrictions

**Solution**:
```typescript
// Match CI environment locally
// .env.test.local
DATABASE_URL=postgresql://test:test@localhost:5432/test
NODE_ENV=test
TZ=UTC

// Run with CI configuration
npm run test:ci

// Add CI-specific timeouts
test.setTimeout(process.env.CI ? 30000 : 10000);
```

### Issue: Random Port Conflicts

**Solution**:
```typescript
// Use dynamic port allocation
import getPort from 'get-port';

test.beforeAll(async () => {
  const port = await getPort();
  process.env.TEST_PORT = String(port);
  // Start server on dynamic port
});
```

## Monitoring and Reporting

### Test Metrics Collection

```typescript
// Track test performance
test.afterEach(async ({}, testInfo) => {
  console.log(`Test "${testInfo.title}" took ${testInfo.duration}ms`);

  if (testInfo.duration > 5000) {
    console.warn(`Slow test detected: ${testInfo.title}`);
  }
});

// Generate reports
export default {
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results.json' }],
    ['junit', { outputFile: 'junit.xml' }]
  ]
};
```

## See Also

- [[integration-testing-fundamentals]]: Core concepts
- [[integration-testing-patterns]]: Common patterns
- [[integration-testing-examples]]: Code examples
- [[playwright-debugging]]: Playwright-specific debugging
- [[test-performance]]: Performance optimization strategies