---
# Identity
id: "integration-testing-patterns"
title: "Integration Testing Patterns"
version: "1.0.0"
category: "pattern"

# Discovery
description: "Common integration testing patterns including authentication, payment processing, AI services, and data flow validation"
tags: ["testing", "patterns", "authentication", "payments", "ai-services", "best-practices"]

# Relationships
dependencies: ["integration-testing-fundamentals"]
cross_references:
  - id: "integration-testing-examples"
    type: "related"
    description: "Detailed code implementations"
  - id: "integration-testing-troubleshooting"
    type: "related"
    description: "Solutions for common issues"

# Maintenance
created: "2025-09-15"
last_updated: "2025-09-15"
author: "create-context"
---

# Integration Testing Patterns

## Overview

This document provides reusable patterns for testing common integration scenarios in the SlideHeroes platform, including authentication flows, payment processing, AI service integration, and complex data workflows.

## Key Concepts

Integration testing patterns follow these principles:
- **Isolation**: Each test runs in a clean environment
- **Predictability**: Mock external services for consistent results
- **Performance**: Parallel execution where possible
- **Completeness**: Test happy paths and error scenarios

## Implementation Details

### Pattern 1: Authentication & Authorization Flow

```typescript
// Pattern: Complete authentication lifecycle
const authenticationPattern = {
  setup: async () => {
    const user = await createTestUser({
      email: `test-${Date.now()}@example.com`,
      role: 'instructor'
    });
    return user;
  },

  authenticate: async (user) => {
    const response = await request.post('/api/auth/signin', {
      data: { email: user.email, password: user.password }
    });
    return response.json();
  },

  testAuthorization: async (token, endpoint, expectedStatus) => {
    const response = await request.get(endpoint, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    expect(response.status()).toBe(expectedStatus);
  },

  cleanup: async (userId) => {
    await deleteTestUser(userId);
  }
};
```

### Pattern 2: AI Service Integration

```typescript
// Pattern: Mock AI services with predictable responses
const aiServicePattern = {
  mockSetup: async (page) => {
    await page.route('**/api/ai/**', async route => {
      const endpoint = route.request().url();

      if (endpoint.includes('generate-ideas')) {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({
            ideas: mockIdeas,
            usage: { tokens: 100, cost: 0.002 }
          })
        });
      }
    });
  },

  testCostTracking: async (sessionId) => {
    const response = await request.get(`/api/ai-usage/session-cost/${sessionId}`);
    const data = await response.json();
    expect(data.totalCost).toBeGreaterThan(0);
  }
};
```

### Pattern 3: Payment Processing

```typescript
// Pattern: Stripe webhook integration
const paymentPattern = {
  mockWebhook: (eventType, data) => ({
    type: eventType,
    data: { object: data },
    created: Math.floor(Date.now() / 1000)
  }),

  testSubscription: async (userId) => {
    // Create subscription
    const sub = await createSubscription(userId, 'price_professional');

    // Simulate payment success
    await sendWebhook('invoice.payment_succeeded', {
      subscription: sub.id,
      amount_paid: 2900
    });

    // Verify user status
    const user = await getUser(userId);
    expect(user.subscription.status).toBe('active');
  }
};
```

### Pattern 4: Database Transaction Testing

```typescript
// Pattern: Test transaction rollback
const transactionPattern = {
  testRollback: async () => {
    try {
      await db.$transaction(async (tx) => {
        await tx.course.create({ data: validData });
        await tx.lesson.create({ data: invalidData }); // Fails
      });
    } catch (error) {
      // Transaction rolled back
    }

    // Verify no partial data
    const count = await db.course.count();
    expect(count).toBe(0);
  }
};
```

### Pattern 5: File Upload & Storage

```typescript
// Pattern: Test file upload with validation
const fileUploadPattern = {
  testUpload: async (file, expectedStatus) => {
    const response = await request.post('/api/upload', {
      multipart: {
        file: {
          name: file.name,
          mimeType: file.type,
          buffer: file.buffer
        }
      }
    });

    expect(response.status()).toBe(expectedStatus);

    if (response.ok()) {
      const data = await response.json();
      expect(data.url).toMatch(/^https:\/\//);
      return data.fileId;
    }
  },

  cleanup: async (fileId) => {
    await request.delete(`/api/files/${fileId}`);
  }
};
```

## Common Patterns

### Parallel Test Execution Strategy

```typescript
test.describe.configure({ mode: 'parallel' });

// Group independent tests
test.describe('Independent Operations', () => {
  test('operation A', async () => {});
  test('operation B', async () => {});
  test('operation C', async () => {});
});

// Sequential for dependent tests
test.describe.configure({ mode: 'serial' });
test.describe('Dependent Operations', () => {
  test('step 1', async () => {});
  test('step 2 depends on 1', async () => {});
});
```

### Test Data Factory Pattern

```typescript
class TestDataFactory {
  static async createUser(overrides = {}) {
    const defaults = {
      email: `test-${Date.now()}@example.com`,
      name: 'Test User',
      role: 'user'
    };
    return createUser({ ...defaults, ...overrides });
  }

  static async createCourse(instructorId, overrides = {}) {
    const defaults = {
      title: `Test Course ${Date.now()}`,
      lessons: []
    };
    return createCourse(instructorId, { ...defaults, ...overrides });
  }
}
```

### Error Scenario Testing

```typescript
const errorPatterns = {
  testTimeout: async () => {
    const response = await request.post('/api/slow-endpoint', {
      timeout: 1000 // 1 second timeout
    });
    expect(response.status()).toBe(408); // Request Timeout
  },

  testRateLimit: async () => {
    const requests = Array(100).fill(null).map(() =>
      request.get('/api/rate-limited')
    );
    const responses = await Promise.all(requests);
    const rateLimited = responses.filter(r => r.status() === 429);
    expect(rateLimited.length).toBeGreaterThan(0);
  },

  testCircuitBreaker: async () => {
    // Simulate multiple failures
    for (let i = 0; i < 5; i++) {
      await request.post('/api/flaky-service');
    }

    // Circuit should be open
    const response = await request.post('/api/flaky-service');
    expect(response.status()).toBe(503); // Service Unavailable
  }
};
```

## Troubleshooting

### Pattern: Debug Helper
```typescript
const debug = {
  logRequest: async (response) => {
    console.log({
      url: response.url(),
      status: response.status(),
      headers: await response.headers(),
      body: await response.text()
    });
  },

  captureState: async (context) => {
    return {
      timestamp: Date.now(),
      database: await db.$queryRaw`SELECT COUNT(*) FROM users`,
      cache: await redis.keys('*')
    };
  }
};
```

## See Also

- [[integration-testing-fundamentals]]: Core concepts and setup
- [[integration-testing-examples]]: Full implementation examples
- [[integration-testing-troubleshooting]]: Detailed debugging strategies
- [[test-data-management]]: Test data creation and cleanup
- [[mock-service-patterns]]: External service mocking strategies