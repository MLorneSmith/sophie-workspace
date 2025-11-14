# Integration Testing

**Purpose**: This document provides patterns and strategies for testing service interactions, API endpoints, and data flow validation in SlideHeroes. Integration tests verify that multiple parts of the system work correctly together.

## Overview

Integration testing validates the interaction between different services, APIs, and data layers. Unlike unit tests that test isolated components, integration tests verify service boundaries, data contracts, error propagation, and complete workflows.

### Testing Scope Hierarchy

- **Unit Tests**: Fast, isolated component testing (milliseconds)
- **Integration Tests**: Service interaction validation (seconds)
- **E2E Tests**: Complete user journey validation (minutes)

### Critical Integration Points

- **Service Boundaries**: API-to-API communication
- **Data Flow**: Frontend → API → Database → Response
- **External Services**: AI providers, payment processors, email
- **Authentication**: Token validation and role authorization

## Test Organization Structure

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

## Core Testing Pattern

```typescript
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

## Test Categorization

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

## Common Patterns

### Authentication & Authorization Flow

```typescript
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

### AI Service Integration

```typescript
// Mock AI services with predictable responses
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

### Payment Processing

```typescript
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

### Database Transaction Testing

```typescript
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

### File Upload & Storage

```typescript
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

## Complete Examples

### API Integration with Database

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

### Course Completion Workflow

```typescript
test('student completes course with quiz', async ({ request }) => {
  // Setup: Create instructor and course
  const instructor = await createTestUser({ role: 'instructor' });
  const courseResponse = await request.post('/api/courses', {
    headers: { 'Authorization': `Bearer ${instructor.token}` },
    data: {
      title: 'Integration Test Course',
      lessons: [
        { title: 'Lesson 1', content: 'Introduction', order: 1 },
        { title: 'Lesson 2', content: 'Advanced', order: 2 }
      ],
      quiz: {
        questions: [{
          question: 'What is 2+2?',
          options: ['3', '4', '5'],
          correctAnswer: 1
        }],
        passingScore: 70
      }
    }
  });

  const course = await courseResponse.json();

  // Student enrolls and completes course
  const student = await createTestUser({ role: 'student' });

  // Enroll
  await request.post(`/api/courses/${course.id}/enroll`, {
    headers: { 'Authorization': `Bearer ${student.token}` }
  });

  // Complete lessons
  for (const lesson of course.lessons) {
    await request.post(`/api/courses/${course.id}/lessons/${lesson.id}/complete`, {
      headers: { 'Authorization': `Bearer ${student.token}` }
    });
  }

  // Submit quiz
  const quizResponse = await request.post(`/api/courses/${course.id}/quiz/submit`, {
    headers: { 'Authorization': `Bearer ${student.token}` },
    data: { answers: [1] } // Correct answer
  });

  const quizResult = await quizResponse.json();
  expect(quizResult.passed).toBe(true);
  expect(quizResult.certificateId).toBeDefined();

  // Cleanup
  await cleanupTestData([instructor.id, student.id, course.id]);
});
```

### Concurrent Operations Testing

```typescript
test('handles race conditions in enrollment', async ({ request }) => {
  // Create course with limited capacity
  const instructor = await createTestUser({ role: 'instructor' });
  const courseResponse = await request.post('/api/courses', {
    headers: { 'Authorization': `Bearer ${instructor.token}` },
    data: {
      title: 'Limited Course',
      maxEnrollments: 1
    }
  });

  const course = await courseResponse.json();

  // Create multiple students
  const students = await Promise.all([
    createTestUser({ role: 'student' }),
    createTestUser({ role: 'student' }),
    createTestUser({ role: 'student' })
  ]);

  // Attempt concurrent enrollments
  const enrollmentPromises = students.map(student =>
    request.post(`/api/courses/${course.id}/enroll`, {
      headers: { 'Authorization': `Bearer ${student.token}` }
    })
  );

  const responses = await Promise.all(enrollmentPromises);

  // Only one should succeed
  const successful = responses.filter(r => r.ok());
  const failed = responses.filter(r => !r.ok());

  expect(successful).toHaveLength(1);
  expect(failed).toHaveLength(2);

  // Verify error messages
  for (const failedResponse of failed) {
    const error = await failedResponse.json();
    expect(error.message).toContain('course is full');
  }

  // Cleanup
  await cleanupTestData([instructor.id, ...students.map(s => s.id), course.id]);
});
```

## Test Utilities

### Database Fixtures

```typescript
// fixtures/database.ts
export async function createTestUser(overrides = {}) {
  const user = {
    email: `test-${Date.now()}-${Math.random()}@example.com`,
    password: 'TestPass123!',
    name: 'Test User',
    role: 'user',
    ...overrides
  };

  const response = await fetch('/api/test/create-user', {
    method: 'POST',
    body: JSON.stringify(user)
  });

  const created = await response.json();

  // Get auth token
  const authResponse = await fetch('/api/auth/signin', {
    method: 'POST',
    body: JSON.stringify({
      email: user.email,
      password: user.password
    })
  });

  const { sessionToken } = await authResponse.json();

  return { ...created, token: sessionToken };
}

export async function cleanupTestData(...ids: string[]) {
  await Promise.all(
    ids.map(id =>
      fetch('/api/test/cleanup', {
        method: 'POST',
        body: JSON.stringify({ id })
      })
    )
  );
}
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

## Parallel Test Execution

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

## Mock vs Real Dependencies Decision Matrix

| Dependency | Use Real | Use Mock |
|------------|----------|----------|
| Database | ✅ Testcontainers | ❌ |
| Internal APIs | ✅ Real services | ❌ |
| External APIs | ❌ | ✅ Mock responses |
| Payment providers | ❌ | ✅ Stripe test mode |
| AI services | ❌ | ✅ Predictable mocks |

## Error Scenario Testing

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

### Flaky Tests

**Symptoms**: Tests pass/fail randomly
**Solution**: Replace fixed delays with proper wait conditions:

```typescript
// Bad: await new Promise(r => setTimeout(r, 1000));
// Good: await expect(response).toBeReady();
```

### Slow Test Execution

**Symptoms**: Tests take >5 minutes
**Solution**: Enable parallel execution and use test sharding

### Database State Pollution

**Symptoms**: Tests fail when run together but pass individually
**Solution**: Implement proper cleanup in afterEach hooks

```typescript
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

## Related Files

- `apps/web/app/home/(user)/course/_lib/server/server-actions.test.ts` - Server action testing patterns
- `packages/features/admin/src/lib/server/admin-server-actions.test.ts` - Admin API testing
- `packages/testing/fixtures/` - Shared test fixtures and utilities
- `packages/testing/mocks/` - Mock service implementations
