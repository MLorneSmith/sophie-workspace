# Bug Diagnosis: REQUIRED_LESSON_NUMBERS config uses outdated numbering scheme causing 0% progress

**ID**: ISSUE-1033
**Created**: 2025-12-09T20:15:00Z
**Reporter**: user/system
**Severity**: high
**Status**: new
**Type**: regression

## Summary

The course progress bar displays "0 of 23 lessons completed" despite having 22 completed lessons in the database. This occurs because the `REQUIRED_LESSON_NUMBERS` configuration array uses an outdated lesson numbering scheme ("101", "103", "201", etc.) that does not match the current database lesson numbers (6, 8, 9, 10, 11...29).

## Environment

- **Application Version**: 2.13.1
- **Environment**: development
- **Node Version**: 20.x
- **Database**: PostgreSQL (via Supabase)
- **Last Working**: Unknown - may never have worked with current lesson numbering

## Reproduction Steps

1. Navigate to `/home/course`
2. Observe progress bar shows "0 of 23 lessons completed"
3. Complete a lesson via quiz
4. Navigate back to `/home/course`
5. Progress bar still shows "0 of 23 lessons completed"

## Expected Behavior

Progress bar should show the actual count of completed lessons (e.g., "22 of 23 lessons completed" based on current database state).

## Actual Behavior

Progress bar always shows "0 of 23 lessons completed" regardless of how many lessons are completed in the database.

## Diagnostic Data

### REQUIRED_LESSON_NUMBERS Configuration
```typescript
// apps/web/lib/course/course-config.ts
export const REQUIRED_LESSON_NUMBERS = [
  "101", "103", "104", "201", "202", "203", "204",
  "301", "302", "401", "402", "403", "501", "502",
  "503", "504", "511", "602", "603", "604", "611",
  "701", "702"
]; // 23 lessons expected
```

### Actual Lesson Numbers in Database
```sql
SELECT lesson_number, title FROM payload.course_lessons ORDER BY lesson_number::int;

 lesson_number |                     title
---------------+------------------------------------------------
             6 | Welcome to DDM
             8 | Before we begin...
             9 | Presentation Tools & Course Resources
            10 | Our Process
            11 | The Who
            12 | The Why: Building the Introduction
            13 | The Why: Next Steps
            14 | Idea Generation
            15 | What is Structure?
            16 | Using Stories
            17 | Storyboards in Film
            18 | Storyboards in Presentations
            19 | Visual Perception and Communication
            20 | Overview of the Fundamental Elements of Design
            21 | The Fundamental Elements of Design in Detail
            22 | Gestalt Principles of Visual Perception
            23 | Slide Composition
            24 | Overview of Fact-based Persuasion
            25 | Tables vs. Graphs
            26 | Standard Graphs
            27 | Specialist Graphs
            28 | Preparation and Practice
            29 | Performance
            30 | Congratulations
            31 | Before you go...
```

### Lesson Progress Records Exist
```sql
-- 22 completed lessons exist with correct course_id
SELECT COUNT(*) FROM public.lesson_progress WHERE completed_at IS NOT NULL;
-- Result: 22 rows

-- Course progress record exists with 88% completion
SELECT completion_percentage FROM public.course_progress;
-- Result: 88
```

### Filter Logic Always Returns 0
```typescript
// CourseDashboardClient.tsx:144-149
const completedRequiredLessons = lessons.filter(
  (lesson) =>
    REQUIRED_LESSON_NUMBERS.includes(String(lesson.lesson_number || "")) &&
    getLessonCompletionStatus(lesson.id, lesson.lesson_number || 0)
);
// Result: [] (empty array) because no lesson_number matches "101", "103", etc.
```

## Error Stack Traces

No errors thrown - this is a silent data mismatch issue.

## Related Code
- **Affected Files**:
  - `apps/web/lib/course/course-config.ts` - Root cause: outdated REQUIRED_LESSON_NUMBERS
  - `apps/web/app/home/(user)/course/_components/CourseDashboardClient.tsx:144-149` - Frontend progress calculation
  - `apps/web/app/home/(user)/course/_components/CourseDashboardClient.tsx:239-248` - Progress bar rendering
  - `apps/web/app/home/(user)/course/_lib/server/server-actions.ts:200-224` - Backend progress calculation
  - `apps/web/app/home/(user)/course/_lib/server/server-actions.test.ts:86` - Test mock uses same wrong values
  - `scripts/testing/test-certificate-generation.ts:23-49` - Script has its own copy of wrong values

- **Recent Changes**: The lesson numbering scheme appears to have been changed from hierarchical (101, 103, 201, etc.) to sequential (6, 8, 9, 10, etc.) but `course-config.ts` was never updated.

- **Suspected Functions**:
  - `REQUIRED_LESSON_NUMBERS.includes(String(lesson.lesson_number))` - Called in multiple places

## Related Issues & Context

### Direct Predecessors
- #1029 (CLOSED): "Course progress bar shows 0 of 23 lessons completed" - Original diagnosis
- #1030 (CLOSED): "Course progress bar fails to update due to getCourseBySlug called with UUID" - Partial fix addressing UUID lookup

### Related Infrastructure Issues
- #1027, #1028 (CLOSED): "update-test-user script" issues with lesson number validation
- #1023, #1024 (CLOSED): Array index vs lesson_number mismatch in testing scripts

### Historical Context
The fix in #1030 resolved the `getCourseById` issue, which allowed the server-side progress calculation to run. However, the calculation still produces 0% because no lesson numbers match the required list. This is a **separate root cause** from the original diagnosis.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `REQUIRED_LESSON_NUMBERS` array in `course-config.ts` contains outdated lesson numbers ("101", "103", etc.) that do not exist in the current database schema (which uses 6, 8, 9, 10, etc.).

**Detailed Explanation**:
At some point, the lesson numbering scheme was changed from a hierarchical format (101, 103, 201, 202, etc.) to a simpler sequential format (6, 8, 9, 10, 11...29). The database and Payload CMS were updated, but `course-config.ts` was never updated to reflect this change. As a result:

1. When `updateLessonProgressAction` calculates course progress (line 200-210), it filters lessons using `REQUIRED_LESSON_NUMBERS.includes(String(lesson.lesson_number))` which always returns 0 matches
2. When `CourseDashboardClient` calculates completed lessons (line 144-149), it uses the same filter and gets 0 matches
3. The progress bar always shows "0 of 23 lessons completed"

**Supporting Evidence**:
- SQL query shows zero overlap between required numbers and actual lesson numbers
- Database has 22 completed lesson_progress records but frontend shows 0 completed
- The course_progress table shows 88% but this was likely set by an older code path or manual update

### How This Causes the Observed Behavior

1. User completes a lesson -> `updateLessonProgressAction` inserts into `lesson_progress` table (works)
2. Server action queries lessons from Payload CMS -> gets lessons with numbers 6, 8, 9, 10, etc.
3. Server action filters using `REQUIRED_LESSON_NUMBERS.includes("10")` -> false (expects "101")
4. `completedRequiredLessons` count = 0
5. `courseCompletionPercentage` = 0 / 23 * 100 = 0%
6. Frontend displays "0 of 23 lessons completed"

### Confidence Level

**Confidence**: High

**Reasoning**:
- SQL evidence definitively shows the mismatch between config values and database values
- The filter logic is straightforward: `includes()` returns false for all actual lesson numbers
- No other code path could produce the observed 0% progress when 22 lessons are completed

## Fix Approach (High-Level)

Update `REQUIRED_LESSON_NUMBERS` in `apps/web/lib/course/course-config.ts` to use the actual lesson numbers from the database:

```typescript
// Old (wrong):
export const REQUIRED_LESSON_NUMBERS = ["101", "103", "104", ...];

// New (correct):
export const REQUIRED_LESSON_NUMBERS = [
  "6",  "8",  "9",  "10", "11", "12", "13", "14",
  "15", "16", "17", "18", "19", "20", "21", "22",
  "23", "24", "25", "26", "27", "28", "29"
]; // Exclude 30, 31 (Congratulations, Before you go)
```

Also update:
- `apps/web/app/home/(user)/course/_lib/server/server-actions.test.ts` - Update test mocks
- `scripts/testing/test-certificate-generation.ts` - Update script's copy

## Diagnosis Determination

The root cause is a configuration mismatch between `REQUIRED_LESSON_NUMBERS` and actual database lesson numbers. The fix in #1030 was necessary but insufficient - it fixed the UUID lookup but the underlying lesson number mismatch prevents progress from ever being calculated correctly.

## Additional Context

The previous diagnosis (#1029) correctly identified that progress wasn't updating, but attributed it entirely to the `getCourseBySlug` vs `getCourseById` issue. That fix allowed the server-side code to execute, but the progress calculation still fails due to this separate configuration issue.

---
*Generated by Claude Debug Assistant*
*Tools Used: psql (database queries), grep (code search), gh CLI (GitHub issues)*
