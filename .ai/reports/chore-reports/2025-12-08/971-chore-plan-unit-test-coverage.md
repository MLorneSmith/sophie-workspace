# Chore: Improve Unit Test Coverage for apps/web

## Chore Description

Review the current unit test coverage of the `apps/web` application and address the most critical gaps. The current coverage shows **85.91% statement coverage** but only **18 test files** exist across the application. Analysis reveals that **77% of core business logic files lack tests**, with particularly low coverage in:

- **Server Actions**: 41% coverage (7/17 tested)
- **Services**: 57% coverage (4/7 tested)
- **Schemas**: 20% coverage (1/5 tested)
- **Hooks**: 17% coverage (1/6 tested)
- **Utilities**: 10% coverage (1/10 tested)

This chore will create unit tests for the **highest priority gaps** focusing on critical business logic that handles data mutations, user interactions, and core functionality.

## Relevant Files

### Files to Test (Priority Order)

#### High Priority - Server Actions with Database Mutations

1. **`apps/web/app/home/(user)/kanban/_lib/server/server-actions.ts`**
   - 7 server actions: createTaskAction, updateTaskAction, updateTaskStatusAction, deleteTaskAction, updateSubtaskAction, resetTasksAction, seedDefaultTasksAction
   - Handles task CRUD operations with Supabase
   - Includes image upload/delete integration
   - ~500 lines of business logic

2. **`apps/web/app/home/(user)/assessment/_lib/server/server-actions.ts`**
   - 2 server actions: saveResponseAction, completeSurveyAction
   - Handles survey response persistence
   - Complex category scoring logic
   - Progress calculation and upsert operations

3. **`apps/web/app/home/(user)/ai/storyboard/_lib/actions/powerpoint-actions.ts`**
   - 1 server action: generatePowerPointAction
   - Integrates with PptxGenerator service
   - Handles base64 encoding for transport
   - Error handling for generation failures

#### Medium Priority - Validation Schemas

4. **`apps/web/app/(marketing)/contact/_lib/contact-email.schema.ts`**
   - Contact form validation
   - Email format validation
   - Required field validation

5. **`apps/web/app/onboarding/_lib/onboarding-form.schema.ts`**
   - User onboarding validation
   - Multi-step form validation

#### Medium Priority - React Hooks

6. **`apps/web/app/home/(user)/kanban/_lib/hooks/use-tasks.ts`**
   - Task state management
   - CRUD operations wrapper
   - Error handling

### Reference Files (Existing Test Patterns)

- **`apps/web/app/home/(user)/course/_lib/server/server-actions.test.ts`** - Server action test pattern with enhanceAction mocking
- **`apps/web/app/home/(user)/kanban/_lib/schema/task.schema.test.ts`** - Schema validation test pattern
- **`apps/web/app/home/(user)/ai/canvas/_lib/hooks/use-action-with-cost.test.ts`** - Hook testing pattern

### New Files to Create

1. `apps/web/app/home/(user)/kanban/_lib/server/server-actions.test.ts`
2. `apps/web/app/home/(user)/assessment/_lib/server/server-actions.test.ts`
3. `apps/web/app/home/(user)/ai/storyboard/_lib/actions/powerpoint-actions.test.ts`
4. `apps/web/app/(marketing)/contact/_lib/contact-email.schema.test.ts`
5. `apps/web/app/onboarding/_lib/onboarding-form.schema.test.ts`
6. `apps/web/app/home/(user)/kanban/_lib/hooks/use-tasks.test.ts`

## Impact Analysis

### Dependencies Affected

- **Test infrastructure**: Vitest, @testing-library/react
- **Mock dependencies**: @kit/next/actions, @kit/supabase/server-client, next/cache
- **No production code changes** - only adding test files

### Risk Assessment

**Low Risk**:
- Adding tests only, no production code modifications
- Well-established testing patterns exist in the codebase
- Tests are isolated and won't affect runtime behavior
- All tests run in CI pipeline with turbo caching

### Backward Compatibility

- No backward compatibility concerns
- Tests are additive only
- No changes to existing APIs or interfaces

## Pre-Chore Checklist

Before starting implementation:
- [ ] Create feature branch: `chore/unit-test-coverage`
- [ ] Review existing test patterns in `apps/web/app/home/(user)/course/_lib/server/server-actions.test.ts`
- [ ] Verify test infrastructure is working: `pnpm --filter web test`
- [ ] Identify all mock dependencies needed for each test file

## Documentation Updates Required

- No documentation updates needed for test additions
- Tests serve as documentation for the code they test

## Rollback Plan

- Delete the new test files
- No database or configuration changes to rollback

## Step by Step Tasks

### Step 1: Create Kanban Server Actions Tests

Create comprehensive tests for the kanban task management server actions.

**File**: `apps/web/app/home/(user)/kanban/_lib/server/server-actions.test.ts`

**Test Cases**:
- `createTaskAction`
  - Should create task with valid input
  - Should handle image upload during creation
  - Should create subtasks when provided
  - Should reject invalid input (missing title)
  - Should handle database errors gracefully

- `updateTaskAction`
  - Should update existing task
  - Should handle image upload/replacement
  - Should handle image deletion
  - Should update subtasks (delete old, insert new)
  - Should reject invalid task ID

- `updateTaskStatusAction`
  - Should update task status
  - Should validate status enum values
  - Should verify user ownership

- `deleteTaskAction`
  - Should delete task and associated image
  - Should handle tasks without images
  - Should verify user ownership

- `updateSubtaskAction`
  - Should update subtask completion status
  - Should verify parent task ownership
  - Should reject invalid subtask ID

- `resetTasksAction`
  - Should delete all user tasks
  - Should delete associated images
  - Should seed default tasks
  - Should handle empty task list

- `seedDefaultTasksAction`
  - Should insert default tasks for new user
  - Should handle batch insertion
  - Should create subtasks for tasks that have them

### Step 2: Create Assessment Server Actions Tests

Create tests for survey response handling.

**File**: `apps/web/app/home/(user)/assessment/_lib/server/server-actions.test.ts`

**Test Cases**:
- `saveResponseAction`
  - Should create new survey response record
  - Should update existing response with new answers
  - Should calculate category scores correctly
  - Should update progress percentage
  - Should validate total questions against CMS
  - Should handle CMS errors gracefully
  - Should reject invalid survey ID

- `completeSurveyAction`
  - Should mark survey as completed
  - Should save final category scores
  - Should set highest/lowest scoring categories
  - Should reject invalid response ID

### Step 3: Create PowerPoint Actions Tests

Create tests for PowerPoint generation server action.

**File**: `apps/web/app/home/(user)/ai/storyboard/_lib/actions/powerpoint-actions.test.ts`

**Test Cases**:
- `generatePowerPointAction`
  - Should generate PowerPoint from valid storyboard
  - Should return base64 encoded data
  - Should handle generator errors
  - Should handle empty storyboard
  - Should handle storyboard with multiple slides

### Step 4: Create Contact Email Schema Tests

Create validation tests for contact form schema.

**File**: `apps/web/app/(marketing)/contact/_lib/contact-email.schema.test.ts`

**Test Cases**:
- Email validation
  - Should accept valid email formats
  - Should reject invalid email formats
  - Should require email field
- Name validation
  - Should accept valid names
  - Should reject empty names
- Message validation
  - Should accept valid messages
  - Should reject empty messages
  - Should handle message length limits

### Step 5: Create Onboarding Form Schema Tests

Create validation tests for onboarding form schema.

**File**: `apps/web/app/onboarding/_lib/onboarding-form.schema.test.ts`

**Test Cases**:
- Required field validation
- Field format validation
- Multi-step validation (if applicable)
- Edge cases and boundary values

### Step 6: Create use-tasks Hook Tests

Create tests for the kanban tasks hook.

**File**: `apps/web/app/home/(user)/kanban/_lib/hooks/use-tasks.test.ts`

**Test Cases**:
- Initial state loading
- Task creation flow
- Task update flow
- Task deletion flow
- Error state handling
- Loading state management

### Step 7: Run Full Test Suite and Validate Coverage

Execute all tests and verify coverage improvement.

```bash
# Run all unit tests
pnpm --filter web test

# Run tests with coverage
pnpm --filter web test:coverage

# Verify no regressions
pnpm test:unit
```

## Validation Commands

Execute every command to validate the chore is complete with zero regressions.

```bash
# 1. Run all unit tests in apps/web
pnpm --filter web test

# 2. Run tests with coverage report
pnpm --filter web test:coverage

# 3. Run full monorepo unit tests
pnpm test:unit

# 4. Type check to ensure no type errors in tests
pnpm --filter web typecheck

# 5. Lint check for test files
pnpm --filter web lint
```

**Success Criteria**:
- All tests pass (0 failures)
- No type errors in test files
- No lint errors in test files
- Coverage improved from current baseline (85.91% statements)
- New test files follow existing patterns

## Notes

### Testing Patterns to Follow

Based on analysis of existing tests, use these patterns:

1. **Mock enhanceAction** to preserve schema validation while providing mock user:
```typescript
vi.mock("@kit/next/actions", () => ({
  enhanceAction: vi.fn((fn, options) => {
    return async (data: unknown) => {
      if (options?.schema) {
        const result = options.schema.safeParse(data);
        if (!result.success) {
          return { success: false, error: "Validation failed" };
        }
        data = result.data;
      }
      const mockUser = { id: "user-123", email: "test@example.com" };
      return fn(data, mockUser);
    };
  }),
}));
```

2. **Mock Supabase client** with chainable methods:
```typescript
const createMockSupabaseChain = () => {
  const chain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
  return chain;
};
```

3. **Group tests by functionality** using describe blocks:
   - Schema Validation
   - Core Functionality
   - Error Handling
   - Integration Points

### Estimated Test Counts

| File | Estimated Tests |
|------|----------------|
| kanban/server-actions.test.ts | ~45 tests |
| assessment/server-actions.test.ts | ~20 tests |
| powerpoint-actions.test.ts | ~10 tests |
| contact-email.schema.test.ts | ~15 tests |
| onboarding-form.schema.test.ts | ~15 tests |
| use-tasks.test.ts | ~20 tests |
| **Total** | **~125 new tests** |

This will increase the test count from 446 to approximately 571 tests in apps/web.
