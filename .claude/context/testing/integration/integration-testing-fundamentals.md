---
# Identity
id: "integration-testing-fundamentals"
title: "Integration Testing Fundamentals"
version: "2.0.0"
category: "standards"

# Discovery
description: "Core integration testing patterns for API endpoints, service interactions, and data flow validation in SlideHeroes"
tags: ["testing", "integration", "api", "playwright", "best-practices", "services"]

# Relationships
dependencies: ["unit-testing", "e2e-testing"]
cross_references:
  - id: "integration-testing-patterns"
    type: "related"
    description: "Common integration testing patterns and strategies"
  - id: "integration-testing-examples"
    type: "related"
    description: "Code examples and implementations"
  - id: "integration-testing-troubleshooting"
    type: "related"
    description: "Debugging and fixing integration test issues"

# Maintenance
created: "2025-09-15"
last_updated: "2025-09-15"
author: "create-context"
---

# Integration Testing Fundamentals

## Overview

Integration testing validates the interaction between different services, APIs, and data layers in the SlideHeroes platform. Unlike unit tests that test isolated components, integration tests verify that multiple parts of the system work correctly together, focusing on service boundaries, data contracts, and error propagation.

## Key Concepts

### Testing Scope Hierarchy
- **Unit Tests**: Fast, isolated component testing (milliseconds)
- **Integration Tests**: Service interaction validation (seconds)
- **E2E Tests**: Complete user journey validation (minutes)

### Critical Integration Points
- **Service Boundaries**: API-to-API communication
- **Data Flow**: Frontend → API → Database → Response
- **External Services**: AI providers, payment processors, email
- **Authentication**: Token validation and role authorization

## Implementation Details

### Test Organization Structure

```typescript
tests/
├── integration/
│   ├── api/              # API endpoint tests
│   ├── database/         # Database integration
│   ├── services/         # Service-to-service
│   └── external/         # Third-party integrations
├── fixtures/             # Shared test utilities
└── config/              # Test configurations
```

### Core Testing Pattern

```typescript
// Integration test template
import { test, expect } from '@playwright/test';
import { createTestContext, cleanupTestData } from '../fixtures';

test.describe('Service Integration', () => {
  let context: TestContext;

  test.beforeEach(async () => {
    context = await createTestContext();
  });

  test.afterEach(async () => {
    await cleanupTestData(context);
  });

  test('complete workflow', async ({ request }) => {
    // 1. Authenticate
    const auth = await context.authenticate();

    // 2. Execute service calls
    const response = await request.post('/api/endpoint', {
      headers: { 'Authorization': `Bearer ${auth.token}` },
      data: { /* payload */ }
    });

    // 3. Validate results
    expect(response.ok()).toBe(true);
    const data = await response.json();
    expect(data).toMatchObject(expectedPattern);
  });
});
```

### Test Categorization

Use tags for organizing test execution:

```typescript
test.describe('@api @critical Authentication Flow', () => {
  test('@smoke login endpoint', async () => {});
  test('@regression token refresh', async () => {});
});
```

Tags enable selective execution:
- `@critical` - Must pass before deployment
- `@smoke` - Quick health checks
- `@regression` - Full test suite
- `@external` - Tests with external dependencies

## Code Examples

### Minimal API Integration Test

```typescript
test('API integration with database', async ({ request }) => {
  // Create test data
  const testUser = await createUser({ role: 'instructor' });

  // Test API endpoint
  const response = await request.post('/api/courses', {
    headers: { 'Authorization': `Bearer ${testUser.token}` },
    data: {
      title: 'Integration Test Course',
      lessons: [{ title: 'Lesson 1', order: 1 }]
    }
  });

  // Verify response
  expect(response.status()).toBe(201);
  const course = await response.json();

  // Verify database state
  const dbCourse = await db.course.findUnique({
    where: { id: course.id },
    include: { lessons: true }
  });

  expect(dbCourse.lessons).toHaveLength(1);
});
```

## Related Files

### Test Implementations
- `apps/web/app/home/(user)/course/_lib/server/server-actions.test.ts` - Server action testing patterns
- `packages/features/admin/src/lib/server/admin-server-actions.test.ts` - Admin API testing
- `apps/web/app/home/(user)/ai/canvas/_actions/*.test.ts` - AI service integration tests

### Test Utilities
- `packages/testing/fixtures/` - Shared test fixtures and utilities
- `packages/testing/mocks/` - Mock service implementations

## Common Patterns

### Parallel Test Execution
Execute independent tests concurrently for 3-5x speed improvement:
```typescript
test.describe.configure({ mode: 'parallel' });
```

### Test Data Isolation
Each test creates unique data to prevent conflicts:
```typescript
const uniqueId = `test-${Date.now()}-${Math.random()}`;
```

### Mock vs Real Dependencies Decision Matrix
| Dependency | Use Real | Use Mock |
|------------|----------|----------|
| Database | ✅ Testcontainers | ❌ |
| Internal APIs | ✅ Real services | ❌ |
| External APIs | ❌ | ✅ Mock responses |
| Payment providers | ❌ | ✅ Stripe test mode |
| AI services | ❌ | ✅ Predictable mocks |

## Troubleshooting

### Issue: Flaky Tests
**Symptoms**: Tests pass/fail randomly
**Solution**: Replace fixed delays with proper wait conditions:
```typescript
// ❌ Bad: await new Promise(r => setTimeout(r, 1000));
// ✅ Good: await expect(response).toBeReady();
```

### Issue: Slow Test Execution
**Symptoms**: Tests take >5 minutes
**Solution**: Enable parallel execution and use test sharding

### Issue: Database State Pollution
**Symptoms**: Tests fail when run together but pass individually
**Solution**: Implement proper cleanup in afterEach hooks

## See Also

- [[integration-testing-patterns]]: Common patterns and strategies
- [[integration-testing-examples]]: Comprehensive code examples
- [[integration-testing-troubleshooting]]: Detailed debugging guide
- [[playwright-config]]: Test runner configuration
- [[unit-testing]]: Component-level testing
- [[e2e-testing]]: End-to-end testing strategies