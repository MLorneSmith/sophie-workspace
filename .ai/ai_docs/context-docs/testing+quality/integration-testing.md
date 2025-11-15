# Integration Testing

**Purpose**: This document provides patterns and strategies for testing server actions, service interactions, and data flow validation in SlideHeroes. Integration tests verify that multiple components work correctly together.

## Overview

Integration testing validates the interaction between server actions, services, database operations, and external APIs. Unlike unit tests that test isolated functions, integration tests verify service boundaries, data contracts, error propagation, and complete workflows.

### Testing Scope Hierarchy

- **Unit Tests**: Fast, isolated function testing (milliseconds) - Schema validation, utility functions
- **Integration Tests**: Server action and service testing (seconds) - Database operations, external API calls
- **E2E Tests**: Complete user journey validation (minutes) - Full application workflows via Playwright

### Critical Integration Points

- **Server Actions**: Next.js server actions with enhanceAction wrapper
- **Database Operations**: Supabase queries, RLS validation, transactions
- **Service Boundaries**: Service-to-service communication, API clients
- **External Services**: AI providers (OpenAI), payment processors, CMS (Payload)
- **Authentication**: Session validation, user context, RLS enforcement

## Test Organization Structure

SlideHeroes follows a co-located testing pattern:

```
Feature/Action Location → Test Location
apps/web/app/home/(user)/course/_lib/server/server-actions.ts
  → apps/web/app/home/(user)/course/_lib/server/server-actions.test.ts

apps/web/app/home/(user)/ai/canvas/_actions/generate-ideas.ts
  → apps/web/app/home/(user)/ai/canvas/_actions/generate-ideas.test.ts

packages/features/admin/src/lib/server/admin-server-actions.ts
  → packages/features/admin/src/lib/server/admin-server-actions.test.ts

apps/payload/src/seed/seed-engine/core/seed-orchestrator.ts
  → apps/payload/src/seed/seed-engine/__tests__/integration/full-workflow.test.ts
```

**Pattern**: Place `.test.ts` files alongside the code they test for discoverability.

## Server Action Testing Pattern

### Basic Server Action Test Structure

Server actions use `enhanceAction` wrapper which provides schema validation and error handling. Testing requires mocking this wrapper and the Supabase client.

```typescript
/**
 * Unit tests for server action
 * Tests schema validation and database operations
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { myServerAction } from "./server-actions";

// Mock enhanceAction to preserve schema validation
vi.mock("@kit/next/actions", () => ({
  enhanceAction: vi.fn((fn, options) => {
    return async (data: unknown) => {
      // Validate with schema if provided
      let validatedData = data;
      if (options?.schema) {
        const result = options.schema.safeParse(data);
        if (!result.success) {
          return { success: false, error: "Validation failed" } as const;
        }
        validatedData = result.data;
      }

      // Mock authenticated user
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        aud: "authenticated",
      };

      return fn(validatedData, mockUser);
    };
  }),
}));

// Mock Supabase client with proper method chaining
const createMockSupabaseChain = () => {
  const chain = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    eq: vi.fn(),
    single: vi.fn(),
  };

  // Make all methods return the chain for proper chaining
  chain.select.mockReturnValue(chain);
  chain.insert.mockReturnValue(chain);
  chain.update.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  chain.single.mockResolvedValue({ data: null, error: null });

  return chain;
};

const mockSupabaseClient = {
  from: vi.fn(() => createMockSupabaseChain()),
};

vi.mock("@kit/supabase/server-client", () => ({
  getSupabaseServerClient: vi.fn(() => mockSupabaseClient),
}));

describe("MyServerAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabaseClient.from.mockImplementation(() => createMockSupabaseChain());
  });

  describe("Schema Validation", () => {
    it("should accept valid input data", async () => {
      const input = {
        field1: "value",
        field2: 123,
      };

      const result = await myServerAction(input);
      expect(result).toEqual({ success: true });
    });

    it("should reject invalid input", async () => {
      const input = {
        field1: "", // Invalid - empty string
      };

      const result = await myServerAction(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Validation failed");
      }
    });
  });

  describe("Database Operations", () => {
    it("should create new record", async () => {
      const chain = createMockSupabaseChain();
      chain.single.mockResolvedValue({ data: null, error: null });
      mockSupabaseClient.from.mockReturnValue(chain);

      const input = {
        field1: "test",
        field2: 456,
      };

      const result = await myServerAction(input);

      expect(result).toEqual({ success: true });
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("table_name");
      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: "user-123",
          field1: "test",
          field2: 456,
        }),
      );
    });

    it("should handle database errors", async () => {
      const chain = createMockSupabaseChain();
      chain.single.mockRejectedValue(new Error("Database connection error"));
      mockSupabaseClient.from.mockReturnValue(chain);

      const input = { field1: "test" };

      await expect(myServerAction(input)).rejects.toThrow(
        "Database connection error",
      );
    });
  });
});
```

### Real Example: Course Progress Action

From `apps/web/app/home/(user)/course/_lib/server/server-actions.test.ts`:

```typescript
describe("updateCourseProgressAction", () => {
  describe("Core Functionality - New Progress Record", () => {
    it("should create new course progress record", async () => {
      // Mock no existing progress record
      const chain = createMockSupabaseChain();
      chain.single.mockResolvedValue({ data: null, error: null });
      mockSupabaseClient.from.mockReturnValue(chain);

      const input = {
        courseId: "course-123",
        currentLessonId: "lesson-456",
        completionPercentage: 25,
      };

      const result = await updateCourseProgressAction(input);

      expect(result).toEqual({ success: true });
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("course_progress");
      expect(chain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: "user-123",
          course_id: "course-123",
          current_lesson_id: "lesson-456",
          completion_percentage: 25,
          started_at: expect.any(String),
          last_accessed_at: expect.any(String),
          completed_at: null,
        }),
      );
    });
  });

  describe("Certificate Generation", () => {
    it("should generate certificate when course completed", async () => {
      const existingProgress = {
        id: "progress-123",
        user_id: "user-123",
        course_id: "course-123",
        certificate_generated: false,
      };

      // Mock multiple from() calls for different tables
      let callCount = 0;
      mockSupabaseClient.from.mockImplementation((table: string) => {
        const chain = createMockSupabaseChain();

        if (table === "course_progress" && callCount === 0) {
          chain.single.mockResolvedValue({
            data: existingProgress,
            error: null,
          });
        } else if (table === "accounts") {
          chain.single.mockResolvedValue({
            data: { name: "John Doe" },
            error: null,
          });
        }

        callCount++;
        return chain;
      });

      const input = {
        courseId: "course-123",
        completed: true,
      };

      await updateCourseProgressAction(input);

      const { generateCertificate } = await import(
        "~/lib/certificates/certificate-service"
      );
      expect(generateCertificate).toHaveBeenCalledWith({
        userId: "user-123",
        courseId: "course-123",
        fullName: "John Doe",
      });
    });
  });
});
```

**File**: `apps/web/app/home/(user)/course/_lib/server/server-actions.test.ts`

## Admin Server Actions Testing

Admin actions require additional security testing for authorization checks.

### Authorization Testing Pattern

From `packages/features/admin/src/lib/server/admin-server-actions.test.ts`:

```typescript
// Mock isSuperAdmin
vi.mock("./utils/is-super-admin", () => ({
  isSuperAdmin: vi.fn(),
}));

import { isSuperAdmin } from "./utils/is-super-admin";

describe("Security: adminAction wrapper", () => {
  it("should throw Not Found error when user is not super admin", async () => {
    (isSuperAdmin as any).mockResolvedValue(false);
    mockSupabaseClient.rpc.mockResolvedValue({ data: false, error: null });

    const validUserId = "123e4567-e89b-12d3-a456-426614174000";

    await expect(
      banUserAction({ userId: validUserId, confirmation: "CONFIRM" }),
    ).rejects.toThrow("Not Found");

    expect(mockAdminAuthService.banUser).not.toHaveBeenCalled();
  });

  it("should allow action execution when user is super admin", async () => {
    (isSuperAdmin as any).mockResolvedValue(true);
    const validUserId = "123e4567-e89b-12d3-a456-426614174000";
    mockAdminAuthService.banUser.mockResolvedValue({ data: {}, error: null });

    const result = await banUserAction({
      userId: validUserId,
      confirmation: "CONFIRM",
    });

    expect(result).toEqual({ success: true });
    expect(mockAdminAuthService.banUser).toHaveBeenCalledWith(validUserId);
  });
});
```

### Logging Verification

```typescript
// Mock Logger
const mockLogger = {
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
};

vi.mock("@kit/shared/logger", () => ({
  getLogger: vi.fn(() => Promise.resolve(mockLogger)),
}));

describe("Logging and Audit Trail", () => {
  it("should log all steps of user ban operation", async () => {
    const userId = "123e4567-e89b-12d3-a456-426614174000";
    mockAdminAuthService.banUser.mockResolvedValue({ data: {}, error: null });

    await banUserAction({ userId, confirmation: "CONFIRM" });

    expect(mockLogger.info).toHaveBeenCalledTimes(2);
    expect(mockLogger.info).toHaveBeenNthCalledWith(
      1,
      { userId },
      "Super Admin is banning user...",
    );
    expect(mockLogger.info).toHaveBeenNthCalledWith(
      2,
      { userId },
      "Super Admin has successfully banned user",
    );
  });
});
```

**File**: `packages/features/admin/src/lib/server/admin-server-actions.test.ts`

## Service Integration Testing

### Testing Services with External Dependencies

```typescript
// Mock external service
const mockCmsService = {
  getCourseBySlug: vi.fn(),
  getCourseLessons: vi.fn(),
};

vi.mock("@kit/cms/payload", () => ({
  getCourseBySlug: mockCmsService.getCourseBySlug,
  getCourseLessons: mockCmsService.getCourseLessons,
}));

describe("Integration Points", () => {
  it("should integrate with CMS for course/lesson data", async () => {
    const input = {
      courseId: "course-123",
      lessonId: "lesson-456",
      completed: true,
    };

    // Mock CMS responses
    mockCmsService.getCourseBySlug.mockResolvedValueOnce({
      docs: [{ id: "course-123", title: "Test Course" }],
    });
    mockCmsService.getCourseLessons.mockResolvedValueOnce({
      docs: [
        { id: "lesson-456", lesson_number: "101", title: "Test Lesson" },
      ],
    });

    await updateLessonProgressAction(input);

    expect(mockCmsService.getCourseBySlug).toHaveBeenCalledWith("course-123");
    expect(mockCmsService.getCourseLessons).toHaveBeenCalledWith("course-123");
  });

  it("should handle missing course data gracefully", async () => {
    // Mock CMS returning no course data
    mockCmsService.getCourseBySlug.mockResolvedValueOnce({
      docs: [],
    });

    const input = {
      courseId: "nonexistent-course",
      lessonId: "lesson-456",
      completed: true,
    };

    // Should not throw error
    const result = await updateLessonProgressAction(input);
    expect(result).toEqual({ success: true });
  });
});
```

## Full Workflow Integration Tests

For complex multi-step workflows, use comprehensive integration tests.

### Seed Engine Example

From `apps/payload/src/seed/seed-engine/__tests__/integration/full-workflow.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SeedOrchestrator } from '../../core/seed-orchestrator';
import { resetPayloadInstance } from '../../core/payload-initializer';
import type { SeedOptions } from '../../types';

describe('Integration: Full Seeding Workflow', () => {
  let orchestrator: SeedOrchestrator;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    resetPayloadInstance();

    // Set up test environment
    process.env.DATABASE_URI = 'postgresql://test:test@localhost:5432/test?sslmode=disable';
    process.env.PAYLOAD_SECRET = 'test-secret-key';
    process.env.SEED_USER_PASSWORD = 'test-password';

    orchestrator = new SeedOrchestrator();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    resetPayloadInstance();
  });

  describe('Complete Workflow', () => {
    it('should successfully complete full seeding workflow in dry-run mode', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: [],
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      // Verify successful completion
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();

      // Verify summary structure
      expect(result.summary).toBeDefined();
      expect(result.summary.totalRecords).toBeGreaterThan(0);
      expect(result.summary.successCount).toBeGreaterThan(0);
      expect(result.summary.failureCount).toBe(0);
      expect(result.summary.totalDuration).toBeGreaterThan(0);
    });

    it('should maintain correct dependency order', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: [],
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      expect(result.success).toBe(true);

      const collectionNames = result.summary.collectionResults.map((r) => r.collection);

      // Verify critical dependency relationships
      const verifyOrder = (before: string, after: string) => {
        const beforeIndex = collectionNames.indexOf(before);
        const afterIndex = collectionNames.indexOf(after);

        if (beforeIndex >= 0 && afterIndex >= 0) {
          expect(beforeIndex).toBeLessThan(afterIndex);
        }
      };

      // Verify dependency order
      verifyOrder('media', 'posts');
      verifyOrder('downloads', 'courses');
      verifyOrder('courses', 'course-lessons');
      verifyOrder('courses', 'course-quizzes');
      verifyOrder('course-quizzes', 'quiz-questions');
    });
  });

  describe('Reference Resolution', () => {
    it('should resolve references across collections', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: ['media', 'downloads', 'courses', 'course-lessons'],
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      expect(result.success).toBe(true);

      // Both collections should succeed with all records
      const coursesResult = result.summary.collectionResults.find(
        (r) => r.collection === 'courses'
      );
      const lessonsResult = result.summary.collectionResults.find(
        (r) => r.collection === 'course-lessons'
      );

      expect(coursesResult).toBeDefined();
      expect(lessonsResult).toBeDefined();

      // All records should succeed (references resolved)
      expect(coursesResult!.failureCount).toBe(0);
      expect(lessonsResult!.failureCount).toBe(0);
    });

    it('should fail gracefully when dependencies are missing', async () => {
      const options: SeedOptions = {
        dryRun: true,
        verbose: false,
        collections: ['course-lessons'], // Missing 'courses' dependency
        maxRetries: 3,
        timeout: 120000,
      };

      const result = await orchestrator.run(options);

      // Should fail validation due to unresolved references
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('validation failed');
    });
  });
});
```

**File**: `apps/payload/src/seed/seed-engine/__tests__/integration/full-workflow.test.ts`

## Common Testing Patterns

### 1. Schema Validation Testing

Always test both valid and invalid inputs:

```typescript
describe("Schema Validation", () => {
  it("should accept valid input data", async () => {
    const validInput = {
      content: "Test content for ideas",
      submissionId: "test-submission-id",
      type: "situation",
    };

    const result = await testAction(validInput);
    expect(result.success).toBe(true);
  });

  it("should reject empty required fields", async () => {
    const invalidInput = {
      content: "",
      submissionId: "test-submission-id",
      type: "situation",
    };

    const result = await testAction(invalidInput);
    expect(result.success).toBe(false);
  });

  it("should reject invalid enum values", async () => {
    const invalidTypes = ["invalid-type", "random", "unknown"];

    for (const type of invalidTypes) {
      const input = {
        content: "Test content",
        submissionId: "test-submission-id",
        type,
      };

      const result = await testAction(input);
      expect(result.success).toBe(false);
    }
  });
});
```

### 2. Error Handling Testing

Test all error scenarios:

```typescript
describe("Error Handling", () => {
  it("should handle database errors gracefully", async () => {
    const chain = createMockSupabaseChain();
    chain.single.mockRejectedValue(new Error("Database connection error"));
    mockSupabaseClient.from.mockReturnValue(chain);

    const input = { courseId: "course-123" };

    await expect(updateCourseProgressAction(input)).rejects.toThrow(
      "Database connection error",
    );
  });

  it("should handle service errors", async () => {
    const error = new Error("External service unavailable");
    mockExternalService.method.mockRejectedValue(error);

    await expect(myServerAction(input)).rejects.toThrow(
      "External service unavailable",
    );
  });
});
```

### 3. Concurrent Operations Testing

Test race conditions and concurrent access:

```typescript
describe("Concurrent Operations", () => {
  it("should handle concurrent operations on same resource", async () => {
    const userId = "user-123";
    mockService.operation.mockResolvedValue({ success: true });

    const results = await Promise.all([
      myAction({ userId }),
      myAction({ userId }),
    ]);

    expect(results).toHaveLength(2);
    expect(results[0]).toEqual({ success: true });
    expect(results[1]).toEqual({ success: true });
    expect(mockService.operation).toHaveBeenCalledTimes(2);
  });

  it("should handle concurrent operations on different resources", async () => {
    const [result1, result2] = await Promise.all([
      action1({ id: "resource-1" }),
      action2({ id: "resource-2" }),
    ]);

    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
  });
});
```

### 4. Boundary Value Testing

Test edge cases and limits:

```typescript
describe("Boundary Value Testing", () => {
  it("should handle very long content strings", async () => {
    const longContent = "A".repeat(10000);
    const input = {
      content: longContent,
      submissionId: "test-id",
      type: "situation",
    };

    const result = await testAction(input);
    expect(result.success).toBe(true);
  });

  it("should handle special characters", async () => {
    const specialContent =
      'Content with emojis 🚀, special chars: @#$%^&*(), and unicode: ñáéíóú';
    const input = {
      content: specialContent,
      submissionId: "test-id",
      type: "answer",
    };

    const result = await testAction(input);
    expect(result.success).toBe(true);
  });

  it("should reject malformed UUIDs", async () => {
    const invalidUserId = "not-a-uuid";

    await expect(
      myAction({ userId: invalidUserId }),
    ).rejects.toThrow();
  });
});
```

## Test Helpers and Utilities

### Test Helper Functions

From `apps/web/test/test-helpers.ts`:

```typescript
/**
 * Helper function to create success result
 */
export function successResult<T>(data: T): ActionResult<T> {
  return { success: true, data } as const;
}

/**
 * Helper function to create error result
 */
export function errorResult(error: string): ActionResult<never> {
  return { success: false, error } as const;
}

/**
 * Helper to extract error from result
 */
export function expectError(result: ActionResult<unknown>): string | undefined {
  if (!result.success) {
    return result.error;
  }
  return undefined;
}
```

### Supabase Mock Factory

```typescript
/**
 * Create a mock Supabase client with chainable methods
 */
export const createMockSupabaseChain = () => {
  const chain = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    eq: vi.fn(),
    neq: vi.fn(),
    gt: vi.fn(),
    gte: vi.fn(),
    lt: vi.fn(),
    lte: vi.fn(),
    in: vi.fn(),
    is: vi.fn(),
    or: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    single: vi.fn(),
    maybeSingle: vi.fn(),
  };

  // Make all methods return the chain for proper chaining
  Object.keys(chain).forEach((key) => {
    if (key !== 'single' && key !== 'maybeSingle') {
      chain[key as keyof typeof chain].mockReturnValue(chain);
    }
  });

  chain.single.mockResolvedValue({ data: null, error: null });
  chain.maybeSingle.mockResolvedValue({ data: null, error: null });

  return chain;
};
```

## Performance Testing

### Timing Validation

```typescript
describe('Performance Metrics', () => {
  it('should complete seeding within reasonable time', async () => {
    const options: SeedOptions = {
      dryRun: true,
      collections: [],
      maxRetries: 3,
      timeout: 120000,
    };

    const startTime = Date.now();
    const result = await orchestrator.run(options);
    const duration = Date.now() - startTime;

    expect(result.success).toBe(true);

    // Dry-run should complete quickly (< 10 seconds)
    expect(duration).toBeLessThan(10000);
  });

  it('should maintain acceptable processing speed', async () => {
    const result = await orchestrator.run(options);

    expect(result.success).toBe(true);

    // Should process at least 10 records per second in dry-run
    expect(result.summary.averageSpeed).toBeGreaterThan(10);
  });
});
```

## Best Practices

### DO ✅

1. **Test actual behavior**, not implementation details
2. **Mock external dependencies** (Supabase, external APIs, CMS)
3. **Test error paths** comprehensively
4. **Use descriptive test names** that explain what is being tested
5. **Test edge cases** and boundary conditions
6. **Verify logging** for audit trails
7. **Test authorization** for admin actions
8. **Clean up test data** in afterEach hooks

### DON'T ❌

1. **Don't test framework code** (enhanceAction, Supabase client)
2. **Don't make real database calls** in unit tests
3. **Don't skip error scenarios**
4. **Don't test too many things** in one test
5. **Don't use production data**
6. **Don't ignore async/await** - always await promises
7. **Don't forget to mock external services**

## Debugging Integration Tests

### Enable Verbose Logging

```typescript
it('should process with detailed logging', async () => {
  const options: SeedOptions = {
    dryRun: true,
    verbose: true, // Enable detailed console output
    collections: ['courses'],
  };

  const result = await orchestrator.run(options);
  expect(result.success).toBe(true);
});
```

### Inspect Mock Call Arguments

```typescript
it('should call service with correct parameters', async () => {
  await myServerAction(input);

  // Inspect what the mock was called with
  console.log('Insert called with:', chain.insert.mock.calls[0]);

  expect(chain.insert).toHaveBeenCalledWith(
    expect.objectContaining({
      user_id: "user-123",
      // ... other fields
    }),
  );
});
```

### Check Mock Call Count

```typescript
it('should call database exactly once', async () => {
  await myServerAction(input);

  expect(mockSupabaseClient.from).toHaveBeenCalledTimes(1);
  expect(chain.insert).toHaveBeenCalledTimes(1);
});
```

## Related Files

- **Test helpers**: `/apps/web/test/test-helpers.ts`
- **Vitest config**: `/vitest.config.ts`, `/packages/vitest.config.base.ts`
- **Server action examples**:
  - `/apps/web/app/home/(user)/course/_lib/server/server-actions.test.ts`
  - `/apps/web/app/home/(user)/ai/canvas/_actions/generate-ideas.test.ts`
  - `/packages/features/admin/src/lib/server/admin-server-actions.test.ts`
- **Full workflow examples**:
  - `/apps/payload/src/seed/seed-engine/__tests__/integration/full-workflow.test.ts`
  - `/apps/payload/src/seed/seed-engine/__tests__/integration/error-scenarios.test.ts`
  - `/apps/payload/src/seed/seed-engine/__tests__/integration/idempotency.test.ts`

## Running Integration Tests

```bash
# Run all tests
pnpm test

# Run specific integration test file
pnpm vitest apps/web/app/home/(user)/course/_lib/server/server-actions.test.ts

# Run tests in watch mode
pnpm vitest --watch

# Run with coverage
pnpm test:coverage

# Run all admin tests
pnpm vitest packages/features/admin/src/lib/server/

# Run all seed engine integration tests
pnpm vitest apps/payload/src/seed/seed-engine/__tests__/integration/
```

## Summary

Integration testing in SlideHeroes focuses on:

1. **Server Actions**: Testing Next.js server actions with enhanceAction wrapper and schema validation
2. **Database Operations**: Mocking Supabase client for insert/update/select operations
3. **Service Integration**: Testing interactions between services, CMS, and external APIs
4. **Authorization**: Verifying RLS, admin checks, and permission enforcement
5. **Error Handling**: Comprehensive testing of failure scenarios
6. **Full Workflows**: End-to-end testing of complex multi-step processes

All integration tests follow co-located patterns, use Vitest for test execution, and emphasize realistic behavior testing over implementation details.
