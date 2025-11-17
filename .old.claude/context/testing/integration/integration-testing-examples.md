---
# Identity
id: "integration-testing-examples"
title: "Integration Testing Examples"
version: "1.0.0"
category: "reference"

# Discovery
description: "Practical integration test examples for authentication, courses, AI services, and payment workflows in SlideHeroes"
tags: ["testing", "examples", "code", "playwright", "implementation"]

# Relationships
dependencies: ["integration-testing-fundamentals", "integration-testing-patterns"]
cross_references:
  - id: "integration-testing-troubleshooting"
    type: "related"
    description: "Debugging failed tests"
  - id: "playwright-config"
    type: "prerequisite"
    description: "Test runner configuration"

# Maintenance
created: "2025-09-15"
last_updated: "2025-09-15"
author: "create-context"
---

# Integration Testing Examples

## Overview

This document provides complete, working integration test examples that can be directly used or adapted for testing SlideHeroes features. Each example demonstrates best practices and common patterns.

## Key Concepts

Examples follow these conventions:

- **Self-contained**: Each test includes setup and cleanup
- **Realistic**: Based on actual SlideHeroes features
- **Documented**: Clear comments explain the approach
- **Runnable**: Can be copied and executed

## Implementation Examples

### Example 1: Complete Authentication Flow

```typescript
// tests/integration/api/authentication.test.ts
import { test, expect } from '@playwright/test';
import { createTestUser, cleanupTestData } from '../../fixtures/database';

test.describe('Authentication API Integration', () => {
  let testData: { userId?: string; email?: string };

  test.afterEach(async () => {
    if (testData.userId) {
      await cleanupTestData(testData.userId);
    }
  });

  test('complete signup and verification flow', async ({ request }) => {
    const email = `test-${Date.now()}@example.com`;
    testData.email = email;

    // 1. Sign up new user
    const signupResponse = await request.post('/api/auth/signup', {
      data: {
        email,
        password: 'SecurePass123!',
        name: 'Test User'
      }
    });

    expect(signupResponse.ok()).toBe(true);
    const { userId, verificationToken } = await signupResponse.json();
    testData.userId = userId;

    // 2. Verify email
    const verifyResponse = await request.post('/api/auth/verify-email', {
      data: { token: verificationToken, userId }
    });

    expect(verifyResponse.ok()).toBe(true);

    // 3. Sign in with verified account
    const signinResponse = await request.post('/api/auth/signin', {
      data: { email, password: 'SecurePass123!' }
    });

    expect(signinResponse.ok()).toBe(true);
    const { sessionToken, user } = await signinResponse.json();
    expect(user.emailVerified).toBe(true);

    // 4. Access protected resource
    const profileResponse = await request.get('/api/user/profile', {
      headers: { 'Authorization': `Bearer ${sessionToken}` }
    });

    expect(profileResponse.ok()).toBe(true);
  });

  test('role-based access control', async ({ request }) => {
    // Create users with different roles
    const users = await Promise.all([
      createTestUser({ role: 'student' }),
      createTestUser({ role: 'instructor' }),
      createTestUser({ role: 'admin' })
    ]);

    // Test each role's permissions
    for (const user of users) {
      const response = await request.post('/api/courses', {
        headers: { 'Authorization': `Bearer ${user.token}` },
        data: { title: 'Test Course' }
      });

      // Only instructors and admins can create courses
      if (user.role === 'student') {
        expect(response.status()).toBe(403);
      } else {
        expect(response.ok()).toBe(true);
      }
    }

    // Cleanup
    await Promise.all(users.map(u => cleanupTestData(u.id)));
  });
});
```

### Example 2: Course Management with Progress Tracking

```typescript
// tests/integration/api/course-progress.test.ts
test.describe('Course Progress Integration', () => {
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
});
```

### Example 3: AI Service Integration with Cost Tracking

```typescript
// tests/integration/external/ai-services.test.ts
test.describe('AI Service Integration', () => {
  test('AI canvas workflow with mocked responses', async ({ request, page }) => {
    const sessionId = `test-session-${Date.now()}`;

    // Mock AI service endpoints
    await page.route('**/api/ai/generate-ideas', async route => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          ideas: [
            { title: 'AI in Education', content: 'How AI transforms learning' },
            { title: 'Future of Work', content: 'AI impact on employment' }
          ],
          usage: { tokens: 150, cost: 0.003 }
        })
      });
    });

    const user = await createTestUser();

    // Generate ideas
    const ideasResponse = await request.post('/api/ai/generate-ideas', {
      headers: { 'Authorization': `Bearer ${user.token}` },
      data: { prompt: 'Create presentation about AI', sessionId }
    });

    const { ideas, usage } = await ideasResponse.json();
    expect(ideas).toHaveLength(2);

    // Check cost tracking
    const costResponse = await request.get(`/api/ai-usage/session-cost/${sessionId}`, {
      headers: { 'Authorization': `Bearer ${user.token}` }
    });

    const costData = await costResponse.json();
    expect(costData.totalCost).toBe(0.003);
    expect(costData.totalTokens).toBe(150);

    await cleanupTestData(user.id);
  });
});
```

### Example 4: Payment Processing with Webhooks

```typescript
// tests/integration/external/payments.test.ts
test.describe('Payment Integration', () => {
  test('subscription lifecycle with webhook handling', async ({ request }) => {
    const user = await createTestUser();

    // Create subscription
    const subResponse = await request.post('/api/billing/create-subscription', {
      headers: { 'Authorization': `Bearer ${user.token}` },
      data: {
        priceId: 'price_test_professional',
        paymentMethodId: 'pm_test_visa'
      }
    });

    const { subscriptionId } = await subResponse.json();

    // Simulate successful payment webhook
    const webhookResponse = await request.post('/api/webhooks/stripe', {
      headers: { 'stripe-signature': 'test-sig' },
      data: {
        type: 'invoice.payment_succeeded',
        data: {
          object: {
            subscription: subscriptionId,
            amount_paid: 2900,
            status: 'paid'
          }
        }
      }
    });

    expect(webhookResponse.ok()).toBe(true);

    // Verify subscription activated
    const profileResponse = await request.get('/api/user/profile', {
      headers: { 'Authorization': `Bearer ${user.token}` }
    });

    const profile = await profileResponse.json();
    expect(profile.subscription.status).toBe('active');
    expect(profile.subscription.plan).toBe('professional');

    await cleanupTestData(user.id);
  });
});
```

### Example 5: Concurrent Operations Testing

```typescript
// tests/integration/database/concurrency.test.ts
test.describe('Concurrent Operations', () => {
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

### Mock Helpers

```typescript
// fixtures/mocks.ts
export function mockStripeWebhook(event: string, data: any) {
  return {
    type: event,
    data: { object: data },
    created: Date.now() / 1000
  };
}

export function mockAIResponse(type: 'ideas' | 'outline') {
  const responses = {
    ideas: {
      ideas: [
        { title: 'Mock Idea 1', content: 'Content 1' },
        { title: 'Mock Idea 2', content: 'Content 2' }
      ],
      usage: { tokens: 100, cost: 0.002 }
    },
    outline: {
      outline: {
        title: 'Mock Presentation',
        sections: [
          { title: 'Introduction', content: 'Intro content' },
          { title: 'Main Points', content: 'Main content' }
        ]
      },
      usage: { tokens: 150, cost: 0.003 }
    }
  };

  return responses[type];
}
```

## See Also

- [[integration-testing-fundamentals]]: Core concepts
- [[integration-testing-patterns]]: Reusable patterns
- [[integration-testing-troubleshooting]]: Debug failed tests
- [[playwright-config]]: Test runner setup
- [[test-data-management]]: Data creation strategies
