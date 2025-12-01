# Bug Diagnosis: Course Dashboard Fails to Load Lessons - Payload API 404 Error

**ID**: ISSUE-pending (GitHub issue to be created)
**Created**: 2025-12-01T17:45:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The course dashboard at `/home/course` fails to display lesson information because the Payload CMS API calls use underscore-separated endpoint names (`course_lessons`) while the actual collection slugs use hyphen-separated names (`course-lessons`). This causes 404 errors for all lesson-related API calls. Additionally, there's a secondary 406 error when querying `course_progress` from Supabase, which is a non-fatal error caused by `.single()` returning no rows for a new user.

## Environment

- **Application Version**: dev branch (commit f217602b2)
- **Environment**: development
- **Browser**: N/A (server-side issue)
- **Node Version**: 20.x
- **Database**: PostgreSQL 15 (Supabase local)
- **Last Working**: Unknown - likely never worked with current endpoint naming

## Reproduction Steps

1. Start the development server with `pnpm dev`
2. Log in as any user
3. Navigate to `/home/course`
4. Observe that the page loads but shows no lessons
5. Check server console for 404 errors

## Expected Behavior

The course dashboard should display all lessons from the "Decks for Decision Makers" course with their completion status, quiz scores, and navigation links.

## Actual Behavior

The dashboard shows the course title and progress bar, but no lessons are displayed. The server logs show repeated 404 errors:

```
GET /api/course_lessons?where[course_id][equals]=... 404
```

## Diagnostic Data

### Console Output

```
payload:dev:  GET /api/course_lessons?where[course_id][equals]=914cf082-5eec-4835-8c08-77fbe3be9e4a&sort=lesson_number&depth=2&limit=100 404 in 18ms

web:dev: [PAYLOAD-API-ERROR] API Error: course_lessons?where[course_id][equals]=...
web:dev:   error: Error: Failed to call Payload API (course_lessons...): 404 Not Found
web:dev:       at callPayloadAPI (../../packages/cms/payload/src/api/payload-api.ts:99:11)

web:dev:  GET /api/courses/914cf082-5eec-4835-8c08-77fbe3be9e4a/lessons 500 in 774ms
```

Additionally, there's a 406 error for `course_progress`:
```
GET http://127.0.0.1:54521/rest/v1/course_progress?select=*&user_id=eq...&course_id=eq... 406 in 5ms
```

### Network Analysis

| Endpoint | Status | Issue |
|----------|--------|-------|
| `/api/courses` | 200 | Works (courses collection uses correct slug) |
| `/api/course_lessons` | 404 | Wrong endpoint name (should be `course-lessons`) |
| `/rest/v1/course_progress` | 406 | Non-fatal: `.single()` returns no row for new user |
| `/rest/v1/lesson_progress` | 200 | Works |
| `/rest/v1/quiz_attempts` | 200 | Works |

### Screenshots
N/A - Server-side error

## Error Stack Traces

```
Error: Failed to call Payload API (course_lessons?where[course_id][equals]=914cf082-5eec-4835-8c08-77fbe3be9e4a&sort=lesson_number&depth=2&limit=100): 404 Not Found
    at callPayloadAPI (../../packages/cms/payload/src/api/payload-api.ts:99:11)
    at async GET.auth (app/api/courses/[courseId]/lessons/route.ts:26:20)
```

## Related Code

- **Affected Files**:
  - `packages/cms/payload/src/api/course.ts:57` - `getCourseLessons()` uses wrong endpoint
  - `packages/cms/payload/src/api/course.ts:76` - `getLessonBySlug()` uses wrong endpoint
  - `packages/cms/payload/src/api/course.ts:161` - `getQuiz()` uses wrong endpoint
  - `packages/cms/payload/src/api/course.ts:203` - Quiz questions uses wrong endpoint
  - `apps/payload/src/collections/CourseLessons.ts:6` - Defines correct slug as `course-lessons`
  - `apps/payload/src/collections/CourseQuizzes.ts:4` - Defines correct slug as `course-quizzes`
  - `apps/payload/src/collections/QuizQuestions.ts:5` - Defines correct slug as `quiz-questions`
- **Recent Changes**: Schema evolution and seeding infrastructure overhaul (ca244bc86, 0f89d1456)
- **Suspected Functions**: `getCourseLessons()`, `getLessonBySlug()`, `getQuiz()`

## Related Issues & Context

### Direct Predecessors
None found - this appears to be a new issue introduced during schema evolution.

### Related Infrastructure Issues
- #519 (CLOSED): "R2 File Access Failure During Seeding: 61 Records Failed (Downloads, Courses, Lessons)" - Related to course/lesson infrastructure

### Historical Context
The mismatch between underscore and hyphen naming likely occurred when the Payload collections were updated to use hyphenated slugs (Payload convention) but the API wrapper functions in `course.ts` were not updated to match.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The Payload API wrapper functions in `packages/cms/payload/src/api/course.ts` use underscore-separated endpoint names (`course_lessons`, `course_quizzes`, `quiz_questions`) while the actual Payload collection slugs use hyphen-separated names (`course-lessons`, `course-quizzes`, `quiz-questions`).

**Detailed Explanation**:

Payload CMS generates REST API endpoints based on collection slugs. The collections are correctly defined with hyphenated slugs:

```typescript
// apps/payload/src/collections/CourseLessons.ts:6
slug: "course-lessons"

// apps/payload/src/collections/CourseQuizzes.ts:4
slug: "course-quizzes"

// apps/payload/src/collections/QuizQuestions.ts:5
slug: "quiz-questions"
```

However, the API wrapper functions in `course.ts` use underscore naming:

```typescript
// packages/cms/payload/src/api/course.ts:57
`course_lessons?where[course_id][equals]=${courseId}...`

// packages/cms/payload/src/api/course.ts:76
`course_lessons?where[slug][equals]=${slug}...`

// packages/cms/payload/src/api/course.ts:161
`course_quizzes/${actualQuizId}?depth=1`

// packages/cms/payload/src/api/course.ts:203
`quiz_questions?${idQueryParams}&sort=order`
```

This causes all requests to return 404 because Payload has no endpoints matching the underscore-separated names.

**Supporting Evidence**:
- Server logs clearly show: `GET /api/course_lessons... 404`
- Collection slug definition: `slug: "course-lessons"` (CourseLessons.ts:6)
- API call uses: `course_lessons` (course.ts:57)

### How This Causes the Observed Behavior

1. User navigates to `/home/course`
2. `CourseDashboardClient` makes fetch to `/api/courses/${course.id}/lessons`
3. Route handler calls `getCourseLessons(params.courseId)`
4. `getCourseLessons()` calls Payload API with `course_lessons?...`
5. Payload CMS returns 404 (endpoint doesn't exist - should be `course-lessons`)
6. Route handler catches error and returns 500
7. Dashboard shows no lessons

### Secondary Issue: course_progress 406 Error

The 406 (Not Acceptable) error on `course_progress` is a non-fatal issue caused by:
- `page.tsx:71-76` queries `course_progress` with `.single()`
- For new users or courses, no row exists
- Supabase returns 406 when `.single()` finds 0 rows
- The code handles this gracefully (`courseProgress || null`)

### Confidence Level

**Confidence**: High

**Reasoning**: The evidence is conclusive - the collection slugs and API endpoint names are directly observable and clearly mismatched. The 404 error directly correlates with the naming discrepancy.

## Fix Approach (High-Level)

Update `packages/cms/payload/src/api/course.ts` to use hyphen-separated endpoint names that match the actual Payload collection slugs:

1. Change `course_lessons` to `course-lessons` (lines 57, 76)
2. Change `course_quizzes` to `course-quizzes` (lines 112, 161)
3. Change `quiz_questions` to `quiz-questions` (line 203)

Optional improvement: Update `course_progress` query to use `.maybeSingle()` instead of `.single()` to avoid the 406 error for new users.

## Diagnosis Determination

The root cause is definitively identified as a naming convention mismatch between:
- **Payload collection slugs**: Use hyphens (`course-lessons`)
- **API wrapper functions**: Use underscores (`course_lessons`)

This is a straightforward fix requiring string replacements in `course.ts`. No architectural changes or complex debugging needed.

## Additional Context

- The `courses` collection works correctly because it uses a simple slug (`courses`) with no delimiter
- All course-related functionality (progress tracking, quiz attempts) will be broken until this is fixed
- The fix is low-risk - only 5 string changes in a single file

---
*Generated by Claude Debug Assistant*
*Tools Used: Glob, Grep, Read, Bash (git log, gh issue list)*
