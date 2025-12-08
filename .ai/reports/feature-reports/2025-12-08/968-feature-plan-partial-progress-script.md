# Feature: Partial Course Progress Utility Script

## Feature Description

Modify the existing `update-test-user-progress.ts` script to support partial course completion for a different test user (`test1@slideheroes.com`). The script should mark lessons 6-28 (by Payload `lesson_number` field) as completed, leaving lessons 1-5 and 29 incomplete. This enables testing of course completion logic by allowing the developer to log in and manually complete lesson 29 to trigger the completion flow.

## User Story

As a developer
I want to easily set up a test user with partial course progress (lessons 6-28 completed)
So that I can quickly test the course completion logic by only needing to mark lesson 29 as complete

## Problem Statement

Testing the course completion logic currently requires manually completing all 28 lessons before lesson 29 or using the existing script which marks ALL lessons complete. There's no easy way to set up a "near-complete" state where only the final lesson remains, which is the ideal state for testing completion triggers.

## Solution Statement

Modify the existing `update-test-user-progress.ts` script to accept command-line arguments that allow:
1. Specifying a different target user (defaulting to test1@slideheroes.com)
2. Specifying a range of lessons to mark complete (defaulting to lessons 6-28 by lesson_number)
3. Leaving specified lessons incomplete for testing completion triggers

## Relevant Files

Use these files to implement the feature:

- `scripts/testing/update-test-user-progress.ts` - The existing script to be modified. Currently marks all lessons except 801/802 as complete for test2@slideheroes.com.
- `scripts/testing/load-test-env.ts` - Environment loader utility used by the script.
- `apps/web/lib/course/course-config.ts` - Contains `REQUIRED_LESSON_NUMBERS` array defining which lessons count toward completion.
- `apps/payload/src/collections/CourseLessons.ts` - Payload CMS collection defining the `lesson_number` field (sequential 1-29).
- `.env.test` - Test environment configuration file with required credentials.

## Impact Analysis

### Dependencies Affected

- No new dependencies required
- Existing script already imports all necessary packages (`@supabase/supabase-js`, `node-fetch`, `@kit/shared/logger`, `dotenv`)

### Risk Assessment

**Low Risk**:
- Modifying an existing utility script with no production impact
- Changes isolated to development/testing tooling
- No database schema changes
- No changes to application code

### Backward Compatibility

- The script modification should maintain backward compatibility by using default values
- Existing behavior can be preserved if no arguments are provided (or via a flag)

### Performance Impact

- None - this is a development utility script

### Security Considerations

- Script uses service role key (already in use)
- No new security concerns as this modifies existing patterns
- Only affects test users in local/test environments

## Pre-Feature Checklist

Before starting implementation:
- [x] Verify that you have read the recommended context documents
- [ ] Create feature branch: `feature/partial-progress-script`
- [x] Review existing similar features for patterns - reviewed `update-test-user-progress.ts`
- [x] Identify all integration points - Payload API, Supabase database
- [x] Define success metrics - Script successfully marks lessons 6-28 as complete
- [x] Confirm feature doesn't duplicate existing functionality - modifying existing script
- [x] Verify all required dependencies are available - all present

## Documentation Updates Required

- Update script header comments to document new command-line options
- Add usage examples in script comments

## Rollback Plan

- Git revert to previous version of the script
- No database migrations involved

## Implementation Plan

### Phase 1: Foundation

Add command-line argument parsing to support configurable options for user email and lesson range.

### Phase 2: Core Implementation

Modify the lesson filtering logic to mark only lessons within the specified `lesson_number` range as complete, while leaving lessons outside the range (1-5 and 29) incomplete.

### Phase 3: Integration

Test the script with both default options and custom configurations to verify correct behavior.

## Step by Step Tasks

### Step 1: Add command-line argument parsing

- Add argument parsing for `--user` (target email) and `--range` (lesson range)
- Set defaults: `--user=test1@slideheroes.com`, `--range=6-28`
- Parse range format as `start-end` (e.g., `6-28`)

### Step 2: Modify lesson filtering logic

- Update the script to filter lessons by `lesson_number` field from Payload
- Only mark lessons where `lesson_number >= start && lesson_number <= end` as complete
- Remove hardcoded `EXCLUDED_LESSONS` array, replace with range-based filtering

### Step 3: Update course progress calculation

- Ensure the course completion percentage reflects only the lessons marked complete
- The script should NOT set `completed_at` on course_progress since not all lessons are done

### Step 4: Update logging and output

- Log which lessons are being marked complete vs skipped
- Add summary output showing:
  - Total lessons processed
  - Lessons marked complete
  - Lessons left incomplete
  - Resulting completion percentage

### Step 5: Test the script

- Run with defaults: `npx tsx scripts/testing/update-test-user-progress.ts`
- Verify test1@slideheroes.com has lessons 6-28 complete, 1-5 and 29 incomplete
- Verify course_progress shows correct percentage (~79% for 23/29 lessons or based on required lessons)

### Step 6: Run validation commands

- Execute all validation commands to ensure no regressions

## Testing Strategy

### Unit Tests

Not applicable - this is a utility script, not production code.

### Integration Tests

Manual testing by running the script and verifying database state:
1. Run script with default options
2. Query `lesson_progress` table for test1@slideheroes.com
3. Verify only lessons with `lesson_number` 6-28 have `completed_at` set
4. Verify `course_progress` has correct `completion_percentage`

### E2E Tests

Manual E2E verification:
1. Run the script
2. Log in as test1@slideheroes.com in the application
3. Navigate to the course dashboard
4. Verify lessons 1-5 show as incomplete
5. Verify lessons 6-28 show as complete
6. Verify lesson 29 shows as incomplete
7. Complete lesson 29 and verify course completion triggers

### Edge Cases

- Script run when user has no existing progress (should create new records)
- Script run when user already has partial progress (should update existing records)
- Invalid range format provided (should show helpful error message)
- User email not found (should show helpful error message)

## Acceptance Criteria

- [ ] Script accepts `--user` argument to specify target user email
- [ ] Script accepts `--range` argument to specify lesson range (e.g., `6-28`)
- [ ] Default behavior marks lessons 6-28 complete for test1@slideheroes.com
- [ ] Lessons outside the range (1-5 and 29) remain incomplete
- [ ] Course progress percentage is correctly calculated
- [ ] Course is NOT marked as completed (since not all required lessons done)
- [ ] Script outputs clear summary of actions taken
- [ ] Script handles errors gracefully with helpful messages

## Validation Commands

Execute every command to validate the feature works correctly with zero regressions.

- `pnpm typecheck` - Run type checking to validate the feature works with zero type errors
- `npx tsx scripts/testing/update-test-user-progress.ts --help` - Verify help output shows new options
- `npx tsx scripts/testing/update-test-user-progress.ts` - Run with defaults and verify output
- Verify in Supabase that lesson_progress records are correct for test1@slideheroes.com

## Notes

### Lesson Numbering Context

The system uses two different lesson number schemes:
1. **Payload `lesson_number`**: Sequential 1-29 stored in `course_lessons` table
2. **Web app `REQUIRED_LESSON_NUMBERS`**: 3-digit codes (101, 103, 201, etc.) used for completion tracking

This script operates on the Payload `lesson_number` field (1-29).

### Why Lessons 6-28?

This range leaves:
- Lessons 1-5 incomplete at the start (for potential early-course testing)
- Lesson 29 incomplete at the end (the trigger for course completion)

This setup allows the developer to:
1. Run the script
2. Log in as test1@slideheroes.com
3. Mark lesson 29 as complete
4. Observe course completion logic trigger

### Future Considerations

Consider adding additional options:
- `--dry-run` flag to preview changes without writing
- `--reset` flag to clear all progress before applying
- `--course` flag to specify different courses
