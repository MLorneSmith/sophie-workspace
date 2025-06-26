# Integration Testing Fundamentals

This document provides comprehensive guidance for writing integration tests that validate API endpoints, service interactions, and data flow in the SlideHeroes platform.

## Core Integration Testing Principles

### 1. Service Interaction Focus
- Test how different services communicate with each other
- Validate data contracts between API layers
- Ensure proper error propagation across service boundaries
- Verify authentication and authorization flows

### 2. Data Flow Validation
- Test complete user workflows from frontend to database
- Validate data transformations between layers
- Ensure data consistency across service boundaries
- Test transaction handling and rollback scenarios

### 3. External Service Integration
- Mock external APIs (AI services, payment processors, email)
- Test integration points with third-party services
- Validate error handling for external service failures
- Test rate limiting and retry mechanisms

## Integration Test Structure

### Test Organization Pattern

```typescript
// tests/integration/course-management.test.ts
import { test, expect } from '@playwright/test';
import { createTestUser, createTestCourse, cleanupTestData } from '../fixtures/database';
import { mockStripeWebhook, mockAIService } from '../fixtures/mocks';

test.describe('Course Management Integration', () => {
  let testUser: User;
  let testCourse: Course;

  test.beforeEach(async () => {
    // Set up test data
    testUser = await createTestUser({
      email: 'integration@test.com',
      role: 'instructor'
    });
    
    testCourse = await createTestCourse({
      instructorId: testUser.id,
      title: 'Integration Test Course'
    });
  });

  test.afterEach(async () => {
    await cleanupTestData();
  });

  test('complete course creation workflow', async ({ request }) => {
    // Test API endpoints in sequence
    await testCourseCreationFlow(request, testUser);
  });
});
```

### API Testing with Playwright Request

```typescript
test('course API endpoints integration', async ({ request }) => {
  // Authenticate user
  const authResponse = await request.post('/api/auth/signin', {
    data: {
      email: 'instructor@test.com',
      password: 'testpassword'
    }
  });
  
  expect(authResponse.ok()).toBe(true);
  const { sessionToken } = await authResponse.json();

  // Create course via API
  const createResponse = await request.post('/api/courses', {
    headers: {
      'Authorization': `Bearer ${sessionToken}`
    },
    data: {
      title: 'API Integration Test Course',
      description: 'Test course for integration testing',
      lessons: [
        {
          title: 'Introduction',
          content: 'Welcome to the course',
          order: 1
        }
      ]
    }
  });

  expect(createResponse.ok()).toBe(true);
  const course = await createResponse.json();
  expect(course.id).toBeDefined();

  // Retrieve course via API
  const getResponse = await request.get(`/api/courses/${course.id}`, {
    headers: {
      'Authorization': `Bearer ${sessionToken}`
    }
  });

  expect(getResponse.ok()).toBe(true);
  const retrievedCourse = await getResponse.json();
  expect(retrievedCourse.title).toBe('API Integration Test Course');
  expect(retrievedCourse.lessons).toHaveLength(1);

  // Update course via API
  const updateResponse = await request.patch(`/api/courses/${course.id}`, {
    headers: {
      'Authorization': `Bearer ${sessionToken}`
    },
    data: {
      title: 'Updated Course Title',
      lessons: [
        ...retrievedCourse.lessons,
        {
          title: 'Advanced Topics',
          content: 'Advanced course content',
          order: 2
        }
      ]
    }
  });

  expect(updateResponse.ok()).toBe(true);
  const updatedCourse = await updateResponse.json();
  expect(updatedCourse.title).toBe('Updated Course Title');
  expect(updatedCourse.lessons).toHaveLength(2);
});
```

## Critical Integration Scenarios

### 1. Authentication & Authorization Flow

```typescript
test.describe('Authentication Integration', () => {
  test('complete user authentication flow', async ({ request, page }) => {
    // Test sign-up flow
    const signupResponse = await request.post('/api/auth/signup', {
      data: {
        email: 'newuser@test.com',
        password: 'SecurePass123!',
        name: 'Test User'
      }
    });

    expect(signupResponse.ok()).toBe(true);
    const { userId, verificationToken } = await signupResponse.json();

    // Test email verification
    const verifyResponse = await request.post('/api/auth/verify-email', {
      data: {
        token: verificationToken,
        userId: userId
      }
    });

    expect(verifyResponse.ok()).toBe(true);

    // Test sign-in after verification
    const signinResponse = await request.post('/api/auth/signin', {
      data: {
        email: 'newuser@test.com',
        password: 'SecurePass123!'
      }
    });

    expect(signinResponse.ok()).toBe(true);
    const { sessionToken, user } = await signinResponse.json();
    expect(user.emailVerified).toBe(true);

    // Test protected route access
    const protectedResponse = await request.get('/api/user/profile', {
      headers: {
        'Authorization': `Bearer ${sessionToken}`
      }
    });

    expect(protectedResponse.ok()).toBe(true);
    const profile = await protectedResponse.json();
    expect(profile.email).toBe('newuser@test.com');
  });

  test('role-based authorization', async ({ request }) => {
    // Create users with different roles
    const studentToken = await createAuthenticatedUser('student');
    const instructorToken = await createAuthenticatedUser('instructor');
    const adminToken = await createAuthenticatedUser('admin');

    // Test student permissions
    const studentCourseCreate = await request.post('/api/courses', {
      headers: { 'Authorization': `Bearer ${studentToken}` },
      data: { title: 'Student Course' }
    });
    expect(studentCourseCreate.status()).toBe(403); // Forbidden

    // Test instructor permissions
    const instructorCourseCreate = await request.post('/api/courses', {
      headers: { 'Authorization': `Bearer ${instructorToken}` },
      data: { title: 'Instructor Course' }
    });
    expect(instructorCourseCreate.ok()).toBe(true);

    // Test admin permissions
    const adminUsersList = await request.get('/api/admin/users', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    expect(adminUsersList.ok()).toBe(true);

    // Students and instructors shouldn't access admin endpoints
    const studentAdminAccess = await request.get('/api/admin/users', {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    expect(studentAdminAccess.status()).toBe(403);
  });
});
```

### 2. AI Service Integration

```typescript
test.describe('AI Service Integration', () => {
  test('AI canvas workflow with mocked AI services', async ({ request, page }) => {
    // Mock AI service responses
    await page.route('**/api/ai/generate-ideas', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ideas: [
            {
              title: 'AI in Healthcare',
              content: 'Explore how AI transforms medical diagnosis',
              tags: ['healthcare', 'technology']
            },
            {
              title: 'Machine Learning Basics',
              content: 'Introduction to fundamental ML concepts',
              tags: ['education', 'ml']
            }
          ],
          usage: {
            tokens: 150,
            cost: 0.003
          }
        })
      });
    });

    await page.route('**/api/ai/generate-outline', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          outline: {
            title: 'AI in Healthcare',
            sections: [
              { title: 'Introduction', content: 'Overview of AI in healthcare' },
              { title: 'Current Applications', content: 'Existing AI medical tools' },
              { title: 'Future Prospects', content: 'Emerging AI technologies' }
            ]
          },
          usage: {
            tokens: 200,
            cost: 0.004
          }
        })
      });
    });

    const authToken = await createAuthenticatedUser();

    // Test AI idea generation
    const ideaResponse = await request.post('/api/ai/generate-ideas', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        prompt: 'Create a presentation about AI',
        sessionId: 'test-session-123'
      }
    });

    expect(ideaResponse.ok()).toBe(true);
    const { ideas, usage } = await ideaResponse.json();
    expect(ideas).toHaveLength(2);
    expect(usage.cost).toBe(0.003);

    // Test outline generation from selected idea
    const outlineResponse = await request.post('/api/ai/generate-outline', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        idea: ideas[0],
        sessionId: 'test-session-123'
      }
    });

    expect(outlineResponse.ok()).toBe(true);
    const { outline } = await outlineResponse.json();
    expect(outline.sections).toHaveLength(3);

    // Test cost tracking
    const costResponse = await request.get('/api/ai-usage/session-cost/test-session-123', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    expect(costResponse.ok()).toBe(true);
    const costData = await costResponse.json();
    expect(costData.totalCost).toBe(0.007); // 0.003 + 0.004
  });

  test('AI service error handling', async ({ request, page }) => {
    // Mock AI service failure
    await page.route('**/api/ai/generate-ideas', async route => {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'AI service temporarily unavailable',
          retryAfter: 60
        })
      });
    });

    const authToken = await createAuthenticatedUser();

    const ideaResponse = await request.post('/api/ai/generate-ideas', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        prompt: 'Create a presentation',
        sessionId: 'test-session-456'
      }
    });

    expect(ideaResponse.status()).toBe(503);
    const errorData = await ideaResponse.json();
    expect(errorData.error).toContain('temporarily unavailable');
    expect(errorData.retryAfter).toBe(60);
  });
});
```

### 3. Payment Processing Integration

```typescript
test.describe('Payment Integration', () => {
  test('subscription upgrade workflow', async ({ request, page }) => {
    // Mock Stripe webhook
    await page.route('**/api/webhooks/stripe', async route => {
      const body = await route.request().postData();
      const webhookData = JSON.parse(body || '{}');

      if (webhookData.type === 'invoice.payment_succeeded') {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ received: true })
        });
      }
    });

    const authToken = await createAuthenticatedUser();

    // Create subscription
    const subscriptionResponse = await request.post('/api/billing/create-subscription', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        priceId: 'price_test_professional',
        paymentMethodId: 'pm_test_card_visa'
      }
    });

    expect(subscriptionResponse.ok()).toBe(true);
    const { subscriptionId, clientSecret } = await subscriptionResponse.json();

    // Simulate successful payment webhook
    const webhookResponse = await request.post('/api/webhooks/stripe', {
      headers: {
        'stripe-signature': 'test-signature'
      },
      data: {
        type: 'invoice.payment_succeeded',
        data: {
          object: {
            subscription: subscriptionId,
            amount_paid: 2900, // $29.00
            status: 'paid'
          }
        }
      }
    });

    expect(webhookResponse.ok()).toBe(true);

    // Verify subscription status updated
    const userResponse = await request.get('/api/user/profile', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    expect(userResponse.ok()).toBe(true);
    const userData = await userResponse.json();
    expect(userData.subscription.status).toBe('active');
    expect(userData.subscription.plan).toBe('professional');
  });

  test('payment failure handling', async ({ request, page }) => {
    await page.route('**/api/webhooks/stripe', async route => {
      const body = await route.request().postData();
      const webhookData = JSON.parse(body || '{}');

      if (webhookData.type === 'invoice.payment_failed') {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ received: true })
        });
      }
    });

    const authToken = await createAuthenticatedUser();

    // Simulate failed payment webhook
    const webhookResponse = await request.post('/api/webhooks/stripe', {
      headers: {
        'stripe-signature': 'test-signature'
      },
      data: {
        type: 'invoice.payment_failed',
        data: {
          object: {
            subscription: 'sub_test_failed',
            attempt_count: 1
          }
        }
      }
    });

    expect(webhookResponse.ok()).toBe(true);

    // Verify user is notified of payment failure
    const notificationsResponse = await request.get('/api/user/notifications', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    expect(notificationsResponse.ok()).toBe(true);
    const notifications = await notificationsResponse.json();
    expect(notifications.some((n: any) => n.type === 'payment_failed')).toBe(true);
  });
});
```

### 4. Course Progress & Analytics Integration

```typescript
test.describe('Course Progress Integration', () => {
  test('complete learning journey with progress tracking', async ({ request }) => {
    const studentToken = await createAuthenticatedUser('student');
    const instructorToken = await createAuthenticatedUser('instructor');

    // Instructor creates course
    const courseResponse = await request.post('/api/courses', {
      headers: { 'Authorization': `Bearer ${instructorToken}` },
      data: {
        title: 'Complete Integration Course',
        lessons: [
          { title: 'Lesson 1', content: 'Introduction', order: 1 },
          { title: 'Lesson 2', content: 'Advanced topics', order: 2 },
          { title: 'Lesson 3', content: 'Final project', order: 3 }
        ],
        quiz: {
          questions: [
            {
              question: 'What is integration testing?',
              options: ['Unit testing', 'Service testing', 'UI testing'],
              correctAnswer: 1
            }
          ],
          passingScore: 70
        }
      }
    });

    const course = await courseResponse.json();

    // Student enrolls in course
    const enrollResponse = await request.post(`/api/courses/${course.id}/enroll`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });

    expect(enrollResponse.ok()).toBe(true);

    // Complete lessons sequentially
    for (const lesson of course.lessons) {
      const progressResponse = await request.post(`/api/courses/${course.id}/lessons/${lesson.id}/complete`, {
        headers: { 'Authorization': `Bearer ${studentToken}` }
      });

      expect(progressResponse.ok()).toBe(true);

      // Verify progress tracking
      const statusResponse = await request.get(`/api/courses/${course.id}/progress`, {
        headers: { 'Authorization': `Bearer ${studentToken}` }
      });

      const progress = await statusResponse.json();
      expect(progress.completedLessons).toContain(lesson.id);
    }

    // Take quiz
    const quizResponse = await request.post(`/api/courses/${course.id}/quiz/submit`, {
      headers: { 'Authorization': `Bearer ${studentToken}` },
      data: {
        answers: [1] // Correct answer
      }
    });

    expect(quizResponse.ok()).toBe(true);
    const quizResult = await quizResponse.json();
    expect(quizResult.score).toBeGreaterThanOrEqual(70);
    expect(quizResult.passed).toBe(true);

    // Verify course completion
    const completionResponse = await request.get(`/api/courses/${course.id}/progress`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });

    const finalProgress = await completionResponse.json();
    expect(finalProgress.completed).toBe(true);
    expect(finalProgress.completionDate).toBeDefined();
    expect(finalProgress.certificateId).toBeDefined();

    // Instructor can view analytics
    const analyticsResponse = await request.get(`/api/courses/${course.id}/analytics`, {
      headers: { 'Authorization': `Bearer ${instructorToken}` }
    });

    expect(analyticsResponse.ok()).toBe(true);
    const analytics = await analyticsResponse.json();
    expect(analytics.totalEnrollments).toBe(1);
    expect(analytics.completionRate).toBe(100);
  });
});
```

### 5. File Upload & Storage Integration

```typescript
test.describe('File Storage Integration', () => {
  test('course material upload workflow', async ({ request }) => {
    const instructorToken = await createAuthenticatedUser('instructor');

    // Upload course material
    const uploadResponse = await request.post('/api/upload/course-material', {
      headers: { 'Authorization': `Bearer ${instructorToken}` },
      multipart: {
        file: {
          name: 'course-material.pdf',
          mimeType: 'application/pdf',
          buffer: Buffer.from('Mock PDF content')
        },
        courseId: 'course-123',
        materialType: 'handout'
      }
    });

    expect(uploadResponse.ok()).toBe(true);
    const uploadResult = await uploadResponse.json();
    expect(uploadResult.fileId).toBeDefined();
    expect(uploadResult.url).toMatch(/^https:\/\//);

    // Verify file can be retrieved
    const fileResponse = await request.get(uploadResult.url);
    expect(fileResponse.ok()).toBe(true);

    // Test file deletion
    const deleteResponse = await request.delete(`/api/files/${uploadResult.fileId}`, {
      headers: { 'Authorization': `Bearer ${instructorToken}` }
    });

    expect(deleteResponse.ok()).toBe(true);

    // Verify file is no longer accessible
    const deletedFileResponse = await request.get(uploadResult.url);
    expect(deletedFileResponse.status()).toBe(404);
  });

  test('file upload security and validation', async ({ request }) => {
    const userToken = await createAuthenticatedUser();

    // Test malicious file upload
    const maliciousUpload = await request.post('/api/upload/avatar', {
      headers: { 'Authorization': `Bearer ${userToken}` },
      multipart: {
        file: {
          name: 'malicious.exe',
          mimeType: 'application/x-executable',
          buffer: Buffer.from('Malicious content')
        }
      }
    });

    expect(maliciousUpload.status()).toBe(400);
    const error = await maliciousUpload.json();
    expect(error.message).toContain('file type not allowed');

    // Test file size limit
    const largeFileUpload = await request.post('/api/upload/avatar', {
      headers: { 'Authorization': `Bearer ${userToken}` },
      multipart: {
        file: {
          name: 'large-image.jpg',
          mimeType: 'image/jpeg',
          buffer: Buffer.alloc(10 * 1024 * 1024) // 10MB
        }
      }
    });

    expect(largeFileUpload.status()).toBe(413);
    const sizeError = await largeFileUpload.json();
    expect(sizeError.message).toContain('file too large');
  });
});
```

## Database Integration Testing

```typescript
test.describe('Database Integration', () => {
  test('transaction handling and rollback', async ({ request }) => {
    const authToken = await createAuthenticatedUser();

    // Start a complex operation that might fail
    const complexOperationResponse = await request.post('/api/complex-operation', {
      headers: { 'Authorization': `Bearer ${authToken}` },
      data: {
        steps: [
          { type: 'create_course', data: { title: 'Test Course' } },
          { type: 'create_lessons', data: { count: 5 } },
          { type: 'invalid_operation', data: {} } // This should cause rollback
        ]
      }
    });

    expect(complexOperationResponse.status()).toBe(400);

    // Verify no partial data was created
    const coursesResponse = await request.get('/api/courses', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const courses = await coursesResponse.json();
    expect(courses.filter((c: any) => c.title === 'Test Course')).toHaveLength(0);
  });

  test('concurrent user operations', async ({ request }) => {
    const user1Token = await createAuthenticatedUser();
    const user2Token = await createAuthenticatedUser();

    // Both users try to enroll in a limited capacity course simultaneously
    const courseResponse = await request.post('/api/courses', {
      headers: { 'Authorization': `Bearer ${user1Token}` },
      data: {
        title: 'Limited Capacity Course',
        maxEnrollments: 1
      }
    });

    const course = await courseResponse.json();

    // Simultaneous enrollment attempts
    const [enrollment1, enrollment2] = await Promise.all([
      request.post(`/api/courses/${course.id}/enroll`, {
        headers: { 'Authorization': `Bearer ${user1Token}` }
      }),
      request.post(`/api/courses/${course.id}/enroll`, {
        headers: { 'Authorization': `Bearer ${user2Token}` }
      })
    ]);

    // One should succeed, one should fail
    const responses = [enrollment1, enrollment2];
    const successCount = responses.filter(r => r.ok()).length;
    const failureCount = responses.filter(r => !r.ok()).length;

    expect(successCount).toBe(1);
    expect(failureCount).toBe(1);
  });
});
```

## Performance Integration Testing

```typescript
test.describe('Performance Integration', () => {
  test('API response times under load', async ({ request }) => {
    const authToken = await createAuthenticatedUser();

    // Create test data
    const coursePromises = Array.from({ length: 10 }, (_, i) =>
      request.post('/api/courses', {
        headers: { 'Authorization': `Bearer ${authToken}` },
        data: { title: `Performance Test Course ${i}` }
      })
    );

    await Promise.all(coursePromises);

    // Test API performance
    const startTime = Date.now();
    
    const listResponse = await request.get('/api/courses', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const responseTime = Date.now() - startTime;

    expect(listResponse.ok()).toBe(true);
    expect(responseTime).toBeLessThan(1000); // Should respond within 1 second

    const courses = await listResponse.json();
    expect(courses.length).toBeGreaterThanOrEqual(10);
  });

  test('database query optimization', async ({ request }) => {
    const authToken = await createAuthenticatedUser();

    // Test N+1 query prevention
    const startTime = Date.now();
    
    const analyticsResponse = await request.get('/api/analytics/course-summary', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const queryTime = Date.now() - startTime;

    expect(analyticsResponse.ok()).toBe(true);
    expect(queryTime).toBeLessThan(2000); // Complex analytics should still be fast

    const analytics = await analyticsResponse.json();
    expect(analytics.totalCourses).toBeDefined();
    expect(analytics.averageCompletionRate).toBeDefined();
  });
});
```

## Test Utilities and Fixtures

```typescript
// fixtures/database.ts
export async function createTestUser(overrides: Partial<User> = {}): Promise<User> {
  const userData = {
    email: `test-${Date.now()}@example.com`,
    name: 'Test User',
    role: 'user',
    ...overrides
  };

  const response = await fetch('/api/test/create-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });

  return response.json();
}

export async function createAuthenticatedUser(role: string = 'user'): Promise<string> {
  const user = await createTestUser({ role });
  
  const authResponse = await fetch('/api/auth/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: user.email,
      password: 'testpassword'
    })
  });

  const { sessionToken } = await authResponse.json();
  return sessionToken;
}

export async function cleanupTestData(): Promise<void> {
  await fetch('/api/test/cleanup', { method: 'POST' });
}

// fixtures/mocks.ts
export function mockStripeWebhook(eventType: string, data: any) {
  return {
    type: eventType,
    data: { object: data },
    created: Math.floor(Date.now() / 1000)
  };
}

export function mockAIServiceResponse(type: 'ideas' | 'outline' | 'error', data?: any) {
  switch (type) {
    case 'ideas':
      return {
        ideas: data?.ideas || [
          { title: 'Mock Idea 1', content: 'Mock content 1' },
          { title: 'Mock Idea 2', content: 'Mock content 2' }
        ],
        usage: { tokens: 100, cost: 0.002 }
      };
    case 'outline':
      return {
        outline: data?.outline || {
          title: 'Mock Outline',
          sections: [
            { title: 'Section 1', content: 'Content 1' },
            { title: 'Section 2', content: 'Content 2' }
          ]
        },
        usage: { tokens: 150, cost: 0.003 }
      };
    case 'error':
      return {
        error: 'AI service error',
        code: 'SERVICE_UNAVAILABLE'
      };
  }
}
```

## Best Practices Summary

### 1. Test Scope
- **Focus on service boundaries**: Test how services communicate
- **End-to-end workflows**: Test complete user journeys through APIs
- **Error propagation**: Ensure errors are handled properly across layers
- **Data consistency**: Verify data integrity across operations

### 2. Test Data Management
- **Isolated test data**: Each test should have its own data
- **Cleanup after tests**: Remove test data to avoid pollution
- **Realistic data**: Use data that resembles production scenarios
- **Edge cases**: Test with boundary values and error conditions

### 3. External Service Handling
- **Mock external APIs**: Don't make real calls to third-party services
- **Test error scenarios**: Mock service failures and timeouts
- **Rate limiting**: Test how your app handles API limits
- **Authentication**: Test service authentication and token refresh

### 4. Performance Considerations
- **Response time limits**: Set expectations for API response times
- **Concurrent operations**: Test how your app handles simultaneous requests
- **Database performance**: Monitor query execution times
- **Memory usage**: Ensure tests don't consume excessive resources

Integration tests bridge the gap between unit tests and E2E tests, focusing on how different parts of your system work together. They're essential for catching issues that only surface when services interact.