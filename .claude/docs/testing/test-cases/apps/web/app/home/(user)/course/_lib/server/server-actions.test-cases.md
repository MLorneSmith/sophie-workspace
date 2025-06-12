# Test Cases: server-actions.ts

## Status Summary

- **Created**: 2025-01-06
- **Last Updated**: 2025-01-06
- **Test Implementation Status**: Planned
- **Total Test Cases**: 28
- **Completed Test Cases**: 0
- **Coverage**: 0%

## File: `apps/web/app/home/(user)/course/_lib/server/server-actions.ts`

### Overview

This file contains critical server actions for course and lesson progress management:

1. `updateCourseProgressAction` - Manages overall course progress and certificate generation
2. `updateLessonProgressAction` - Handles individual lesson completion and course progress calculation
3. `submitQuizAttemptAction` - Records quiz attempts and triggers lesson completion

### Test Setup

```typescript
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  submitQuizAttemptAction,
  updateCourseProgressAction,
  updateLessonProgressAction,
} from './server-actions';

// Mock dependencies
vi.mock('@kit/next/actions', () => ({
  enhanceAction: vi.fn((fn, options) => {
    return async (data: any) => {
      // Validate with schema if provided
      if (options?.schema) {
        const result = options.schema.safeParse(data);
        if (!result.success) {
          return { error: 'Validation failed' };
        }
        data = result.data;
      }

      // Mock authenticated user
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        aud: 'authenticated',
      };

      return fn(data, mockUser);
    };
  }),
}));

vi.mock('@kit/supabase/server-client', () => ({
  getSupabaseServerClient: vi.fn(() => ({
    from: vi.fn((table) => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      // Chain methods for complex queries
    })),
  })),
}));

vi.mock('~/lib/certificates/certificate-service', () => ({
  generateCertificate: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('~/lib/course/course-config', () => ({
  REQUIRED_LESSON_NUMBERS: ['1', '2', '3', '4', '5'],
  TOTAL_REQUIRED_LESSONS: 5,
}));

vi.mock('@kit/cms/payload', () => ({
  getCourseBySlug: vi.fn(),
  getCourseLessons: vi.fn(),
}));

describe('Course Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test cases below
});
```

## Test Cases Checklist

### updateCourseProgressAction

#### Core Functionality

- [ ] **Test Case**: Creates new course progress record for new user

  - **Input**: `{ courseId: 'course-1', currentLessonId: 'lesson-1', completionPercentage: 25 }`
  - **Expected Output**: `{ success: true }` and database insert called
  - **Status**: ❌ Not Started
  - **Notes**: Test initial course enrollment flow

- [ ] **Test Case**: Updates existing course progress record

  - **Input**: `{ courseId: 'course-1', currentLessonId: 'lesson-2', completionPercentage: 50 }`
  - **Expected Output**: `{ success: true }` and database update called
  - **Status**: ❌ Not Started
  - **Notes**: Verify existing record is updated, not duplicated

- [ ] **Test Case**: Handles course completion and certificate generation

  - **Input**: `{ courseId: 'course-1', completed: true, completionPercentage: 100 }`
  - **Expected Output**: `{ success: true }`, completion timestamp set, certificate generated
  - **Status**: ❌ Not Started
  - **Notes**: Critical business logic for course completion

- [ ] **Test Case**: Avoids duplicate certificate generation
  - **Input**: Course completion when certificate already exists
  - **Expected Output**: No duplicate certificate generation
  - **Status**: ❌ Not Started
  - **Notes**: Prevent certificate spam

#### Schema Validation

- [ ] **Test Case**: Validates courseId transformation (string/number to string)

  - **Input**: `{ courseId: 123 }` and `{ courseId: "course-1" }`
  - **Expected Output**: Both transformed to strings
  - **Status**: ❌ Not Started
  - **Notes**: Zod transformation handling

- [ ] **Test Case**: Validates completion percentage bounds
  - **Input**: `{ completionPercentage: -10 }` and `{ completionPercentage: 150 }`
  - **Expected Output**: Validation errors
  - **Status**: ❌ Not Started
  - **Notes**: Ensure 0-100 range enforcement

#### Error Handling

- [ ] **Test Case**: Handles certificate generation failure gracefully

  - **Input**: Valid completion data but certificate service fails
  - **Expected Output**: Course progress still updated, error logged
  - **Status**: ❌ Not Started
  - **Notes**: Certificate failure shouldn't block progress

- [ ] **Test Case**: Handles database errors
  - **Input**: Valid data but database throws error
  - **Expected Output**: Appropriate error propagation
  - **Status**: ❌ Not Started
  - **Notes**: Database resilience

### updateLessonProgressAction

#### Core Functionality

- [ ] **Test Case**: Creates new lesson progress record

  - **Input**: `{ courseId: 'course-1', lessonId: 'lesson-1', completionPercentage: 100, completed: true }`
  - **Expected Output**: `{ success: true }` and database insert called
  - **Status**: ❌ Not Started
  - **Notes**: First-time lesson completion

- [ ] **Test Case**: Updates existing lesson progress

  - **Input**: Updated progress for already started lesson
  - **Expected Output**: `{ success: true }` and database update called
  - **Status**: ❌ Not Started
  - **Notes**: Progress tracking for in-progress lessons

- [ ] **Test Case**: Calculates overall course progress correctly

  - **Input**: Lesson completion that affects course progress
  - **Expected Output**: Course progress action called with correct percentage
  - **Status**: ❌ Not Started
  - **Notes**: Complex business logic - required lesson counting

- [ ] **Test Case**: Triggers course completion when all required lessons done
  - **Input**: Final required lesson completion
  - **Expected Output**: Course marked as 100% complete
  - **Status**: ❌ Not Started
  - **Notes**: Course completion detection logic

#### Progress Calculation Logic

- [ ] **Test Case**: Counts only required lessons for progress

  - **Input**: Mix of required and optional lesson completions
  - **Expected Output**: Progress calculated based only on required lessons
  - **Status**: ❌ Not Started
  - **Notes**: Critical business rule - only required lessons count

- [ ] **Test Case**: Handles missing lesson data gracefully

  - **Input**: Progress for lesson not found in CMS
  - **Expected Output**: Graceful handling, no crash
  - **Status**: ❌ Not Started
  - **Notes**: Data consistency between DB and CMS

- [ ] **Test Case**: Calculates correct progress percentage
  - **Input**: Various completion scenarios (2/5, 4/5, 5/5 required lessons)
  - **Expected Output**: Correct percentages (40%, 80%, 100%)
  - **Status**: ❌ Not Started
  - **Notes**: Math verification

#### Schema Validation

- [ ] **Test Case**: Validates courseId and lessonId transformation
  - **Input**: Numeric and string IDs
  - **Expected Output**: All transformed to strings
  - **Status**: ❌ Not Started
  - **Notes**: Consistent ID handling

#### Integration Points

- [ ] **Test Case**: Integrates with CMS for course/lesson data
  - **Input**: Valid lesson completion
  - **Expected Output**: CMS functions called correctly
  - **Status**: ❌ Not Started
  - **Notes**: External service integration

### submitQuizAttemptAction

#### Core Functionality

- [ ] **Test Case**: Records quiz attempt successfully

  - **Input**: `{ courseId: 'course-1', lessonId: 'lesson-1', quizId: 'quiz-1', answers: {}, score: 85, passed: true }`
  - **Expected Output**: `{ success: true }` and database insert called
  - **Status**: ❌ Not Started
  - **Notes**: Basic quiz submission flow

- [ ] **Test Case**: Triggers lesson completion on passing quiz

  - **Input**: Quiz attempt with passed: true
  - **Expected Output**: Lesson progress updated to completed
  - **Status**: ❌ Not Started
  - **Notes**: Integration with lesson progress system

- [ ] **Test Case**: Does not complete lesson on failing quiz
  - **Input**: Quiz attempt with passed: false
  - **Expected Output**: No lesson progress update triggered
  - **Status**: ❌ Not Started
  - **Notes**: Conditional lesson completion logic

#### Schema Validation

- [ ] **Test Case**: Handles complex quizId transformation

  - **Input**: String, number, and object formats for quizId
  - **Expected Output**: All transformed to strings correctly
  - **Status**: ❌ Not Started
  - **Notes**: Complex Zod transformation logic

- [ ] **Test Case**: Validates score bounds (0-100)

  - **Input**: Invalid scores (-10, 150)
  - **Expected Output**: Validation errors
  - **Status**: ❌ Not Started
  - **Notes**: Score validation

- [ ] **Test Case**: Validates answers structure
  - **Input**: Various answer formats
  - **Expected Output**: Proper handling of record structure
  - **Status**: ❌ Not Started
  - **Notes**: Quiz answer data integrity

#### Error Scenarios

- [ ] **Test Case**: Handles database insertion errors
  - **Input**: Valid quiz data but database fails
  - **Expected Output**: Error propagation
  - **Status**: ❌ Not Started
  - **Notes**: Database resilience

### Integration Tests

#### Cross-Action Integration

- [ ] **Test Case**: Complete quiz → lesson progress → course progress flow

  - **Input**: Passing quiz that completes final required lesson
  - **Expected Output**: Quiz recorded, lesson completed, course completed, certificate generated
  - **Status**: ❌ Not Started
  - **Notes**: End-to-end business flow

- [ ] **Test Case**: Partial course completion flow
  - **Input**: Multiple lesson completions not reaching course completion
  - **Expected Output**: Correct progress percentages, no course completion
  - **Status**: ❌ Not Started
  - **Notes**: Incremental progress tracking

### Edge Cases

#### Data Consistency

- [ ] **Test Case**: Handles concurrent progress updates

  - **Input**: Simultaneous lesson completions
  - **Expected Output**: Consistent final state
  - **Status**: ❌ Not Started
  - **Notes**: Race condition handling

- [ ] **Test Case**: Handles CMS data availability issues
  - **Input**: Progress update when CMS is unavailable
  - **Expected Output**: Graceful degradation
  - **Status**: ❌ Not Started
  - **Notes**: External dependency resilience

#### Boundary Conditions

- [ ] **Test Case**: Handles zero lesson course

  - **Input**: Course with no lessons
  - **Expected Output**: Appropriate handling
  - **Status**: ❌ Not Started
  - **Notes**: Edge case data validation

- [ ] **Test Case**: Handles very large lesson numbers
  - **Input**: Course with 100+ lessons
  - **Expected Output**: Performance and correctness maintained
  - **Status**: ❌ Not Started
  - **Notes**: Scalability considerations

### Dependencies to Mock

- `@kit/next/actions` (enhanceAction wrapper)
- `@kit/supabase/server-client` (database operations)
- `~/lib/certificates/certificate-service` (certificate generation)
- `~/lib/course/course-config` (course configuration constants)
- `@kit/cms/payload` (CMS integration)

### Implementation Priority

1. **High Priority**: Core functionality tests (progress tracking, completion logic)
2. **Medium Priority**: Schema validation and error handling
3. **Lower Priority**: Edge cases and performance scenarios

### Coverage Goals

- Lines: 90%+
- Branches: 85%+ (many conditional paths)
- Functions: 100%
- Statements: 90%+

### Time Estimate

- **Planning**: 1 hour ✅
- **Implementation**: 4-5 hours
- **Refinement**: 1 hour
- **Total**: 6-7 hours

### Special Testing Considerations

1. **Complex Supabase Mocking**: Need to mock chained database operations
2. **Zod Schema Testing**: Multiple transformation scenarios
3. **Business Logic Complexity**: Progress calculation algorithms
4. **External Dependencies**: CMS integration and certificate service
5. **Async Operations**: All actions are async with database operations
