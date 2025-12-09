# Bug Diagnosis: Course progress bar shows 0 of 23 lessons completed despite completed lessons

**ID**: ISSUE-1029
**Created**: 2025-12-09T12:00:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The course progress bar on `/home/course` route displays "0 of 23 lessons completed" even after lessons have been marked as complete. The progress bar should update to reflect lesson completion status.

## Environment

- **Application Version**: Latest (dev branch)
- **Environment**: Development
- **Browser**: Not specified
- **Node Version**: Not specified
- **Database**: PostgreSQL (Supabase local)
- **Last Working**: Unknown

## Reproduction Steps

1. Navigate to `/home/course`
2. Observe progress bar shows "0 of 23 lessons completed"
3. Click on a lesson
4. Complete the lesson (via quiz or "Mark as Completed" button)
5. Navigate back to `/home/course`
6. Observe progress bar still shows "0 of 23 lessons completed"

## Expected Behavior

After marking a lesson as complete, the progress bar should update to show "1 of 23 lessons completed" (or the appropriate count).

## Actual Behavior

Progress bar remains at "0 of 23 lessons completed" regardless of how many lessons are completed.

## Diagnostic Data

### Code Analysis

**Data Flow Trace:**

1. **Course page (`page.tsx`)**: Fetches `lessonProgress` from Supabase filtered by `course_id`:
   ```typescript
   const { data: lessonProgress } = await supabase
       .from("lesson_progress")
       .select("*")
       .eq("user_id", user.id)
       .eq("course_id", decksForDecisionMakersCourse.id);
   ```

2. **CourseDashboardClient**: Calculates `completedLessons` by counting lessons where `getLessonCompletionStatus()` returns true.

3. **getLessonCompletionStatus**: Matches `lessonProgress` entries by `lesson_id`.

4. **Lesson completion flow**: When a lesson is completed:
   - `LessonViewClient` calls `updateLessonProgressAction()` with `courseId` from `getCourseId()`
   - `server-actions.ts` inserts/updates `lesson_progress` record

### Critical Bug Found

In `server-actions.ts` line 183:
```typescript
const courseData = await getCourseBySlug(data.courseId);
```

**Problem**: `getCourseBySlug()` queries by **slug** (`courses?where[slug][equals]=...`), but `data.courseId` is a **UUID** (like `"123e4567-e89b-12d3-a456-426614174000"`).

**Result**: The query never finds a match because no course has a slug equal to a UUID. This causes:
- The entire course progress update block (lines 185-250) to be skipped
- `course_progress.completion_percentage` is never updated

However, `lesson_progress` records ARE created correctly (lines 158-169), so the progress bar calculation should still work...

### Secondary Issue Hypothesis

The `lessonProgress` array returned from the Supabase query may be empty because the `course_id` stored in `lesson_progress` records doesn't match `decksForDecisionMakersCourse.id`.

**Possible causes:**
1. `lesson.course?.id` in lesson page returns a different value than `decksForDecisionMakersCourse.id` from `getCourses()`
2. ID format mismatch (string vs number, or different UUID representations)
3. The `lesson.course` relationship isn't being properly expanded by Payload API depth=2

### Database Analysis

The `lesson_progress` table schema:
```sql
course_id TEXT NOT NULL  -- stores the course ID from Payload
lesson_id TEXT NOT NULL  -- stores the lesson ID from Payload
```

The filter on `course_id` must exactly match what's stored.

## Error Stack Traces

No explicit errors - the bug is a silent failure where `getCourseBySlug()` returns no results, causing code paths to be skipped.

## Related Code

- **Affected Files**:
  - `apps/web/app/home/(user)/course/page.tsx:71-83` (lessonProgress query)
  - `apps/web/app/home/(user)/course/_components/CourseDashboardClient.tsx:174-204` (getLessonCompletionStatus)
  - `apps/web/app/home/(user)/course/_components/CourseDashboardClient.tsx:237-249` (CourseProgressBar props)
  - `apps/web/app/home/(user)/course/_lib/server/server-actions.ts:183` (getCourseBySlug bug)
  - `apps/web/app/home/(user)/course/lessons/[slug]/_components/LessonViewClient.tsx:251-280` (getCourseId)
  - `packages/cms/payload/src/api/course.ts:32-42` (getCourseBySlug function)

- **Recent Changes**:
  - `e7aa6737f` fix(tooling): use max lesson_number for range validation
  - `288bfa367` fix(tooling): replace hardcoded course ID with dynamic lookup

- **Suspected Functions**:
  - `getCourseBySlug()` - called with wrong parameter type
  - `getCourseId()` - may return unexpected value
  - `getLessonCompletionStatus()` - matching logic may fail

## Related Issues & Context

### Historical Context

This appears to be a regression or long-standing bug in the course progress calculation logic.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The `server-actions.ts` `updateLessonProgressAction()` function calls `getCourseBySlug(data.courseId)` with a UUID instead of a slug, causing course lookup to fail and course progress updates to be silently skipped.

**Detailed Explanation**:

1. When a lesson is completed, `updateLessonProgressAction()` is called with `courseId` (a UUID like `"123e4567-e89b-12d3-a456-426614174000"`)

2. On line 183, this UUID is passed to `getCourseBySlug(data.courseId)`

3. `getCourseBySlug()` in `packages/cms/payload/src/api/course.ts` queries:
   ```
   courses?where[slug][equals]=${slug}
   ```

4. Since no course has a slug equal to a UUID, `courseData?.docs?.[0]` is undefined

5. The condition `if (courseData?.docs?.[0])` on line 185 fails

6. The entire course progress calculation block (lines 185-250) is skipped

7. `updateCourseProgressAction()` is never called with the completion percentage

**Additionally**, for the progress bar to show 0:
- The `lessonProgress` query in `page.tsx` must be returning empty results
- This suggests the `course_id` stored in `lesson_progress` may not match the `course_id` used in the query filter

### Supporting Evidence

- File: `apps/web/app/home/(user)/course/_lib/server/server-actions.ts:183`
  ```typescript
  const courseData = await getCourseBySlug(data.courseId);  // BUG: courseId is UUID, not slug
  ```

- File: `packages/cms/payload/src/api/course.ts:37-38`
  ```typescript
  return callPayloadAPI(
      `courses?where[slug][equals]=${slug}&depth=1`,  // Queries by slug, not ID
  ```

### How This Causes the Observed Behavior

1. User completes a lesson
2. `lesson_progress` record IS created (this works)
3. Course progress calculation fails silently (the bug)
4. `course_progress.completion_percentage` is never updated
5. When user navigates to `/home/course`:
   - If `lessonProgress` query matches records: should show correct count
   - If `lessonProgress` query returns empty: shows 0

The fact that it shows 0 suggests either:
- The `course_id` filter doesn't match stored records
- OR there's an additional issue with ID matching between lessons and progress

### Confidence Level

**Confidence**: High

**Reasoning**:
- The `getCourseBySlug(data.courseId)` call with a UUID is definitely wrong
- This bug causes silent failure of course progress updates
- The "0 of 23" display confirms matching is completely failing

## Fix Approach (High-Level)

1. **Primary fix**: In `server-actions.ts`, change line 183 from:
   ```typescript
   const courseData = await getCourseBySlug(data.courseId);
   ```
   To use a function that queries by ID:
   ```typescript
   const courseData = await getCourseById(data.courseId);
   ```
   (Need to create `getCourseById()` function in `packages/cms/payload/src/api/course.ts`)

2. **Secondary investigation**: Verify that the `course_id` stored in `lesson_progress` matches the course ID used in the page query. Add logging to confirm ID values.

3. **Consider adding error handling**: Log when `getCourseBySlug` returns no results to make this type of bug more visible.

## Diagnosis Determination

The root cause is a bug in `server-actions.ts` where `getCourseBySlug()` is called with a course UUID instead of a course slug. This causes the Payload API query to fail silently (no course found with slug equal to a UUID), which skips the entire course progress calculation logic.

The fix requires either:
1. Creating and using a `getCourseById()` function that queries by ID
2. Or fetching the course slug first and then using `getCourseBySlug()`

## Additional Context

The `REQUIRED_LESSON_NUMBERS` array contains 23 lesson numbers, matching the "0 of 23" display. The progress bar calculation counts completed lessons that match both:
- Are in `REQUIRED_LESSON_NUMBERS`
- Have a matching `lesson_progress` record with `completed_at` set

---
*Generated by Claude Debug Assistant*
*Tools Used: Grep, Read, Glob, Bash*
