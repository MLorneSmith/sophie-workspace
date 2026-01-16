# Bug Diagnosis: Lesson 31 'Before you go...' not displaying feedback survey

**ID**: ISSUE-pending
**Created**: 2025-12-10T12:00:00Z
**Reporter**: user
**Severity**: high
**Status**: new
**Type**: bug

## Summary

The "Before you go..." lesson (lesson_number 31, slug: `before-you-go`) is not displaying the "Course Feedback" survey (slug: `feedback`). The survey should appear automatically when users navigate to this lesson, allowing them to provide course feedback before completing the course.

## Environment

- **Application Version**: dev branch (commit a61e0a960)
- **Environment**: development
- **Node Version**: 20.x
- **Database**: PostgreSQL (via Supabase/Payload CMS)
- **Last Working**: Never - this survey was never linked to the lesson

## Reproduction Steps

1. Log in to the application
2. Navigate to `/home/course/lessons/before-you-go`
3. Observe that the lesson shows "different content" instead of the feedback survey
4. Expected: The "Course Feedback" survey should be displayed automatically

## Expected Behavior

When visiting the "Before you go..." lesson page, the "Course Feedback" survey should be displayed, allowing users to provide feedback on the course.

## Actual Behavior

The lesson content is displayed but the survey is not shown. The user sees different content instead of the expected feedback survey.

## Diagnostic Data

### Seed Data Analysis

**Lesson "before-you-go"** (`apps/payload/src/seed/seed-data/course-lessons.json:4413-4432`):
```json
{
  "_ref": "before-you-go",
  "id": "before-you-go",
  "slug": "before-you-go",
  "title": "Before you go...",
  "description": "Feedback",
  "lesson_number": 31,
  "course_id": "{ref:courses:decks-for-decision-makers}",
  "_status": "published"
  // NO survey_id field exists!
}
```

**Survey "feedback"** (`apps/payload/src/seed/seed-data/surveys.json:1-21`):
```json
{
  "id": "feedback",
  "slug": "feedback",
  "title": "Course Feedback",
  "lesson": "{ref:course-lessons:before-you-go}"  // Survey points to lesson
  // But lesson doesn't point back to survey!
}
```

### Code Analysis

The `LessonDataProviderEnhanced` component at `apps/web/app/home/(user)/course/lessons/[slug]/_components/LessonDataProvider-enhanced.tsx:240-347` handles survey data fetching:

```typescript
// Line 242 - Check for survey relationship
const surveyId = (lesson as any).survey_id || lesson.survey_id_id;

if (surveyId) {
  // ... survey fetching logic (never executes - surveyId is undefined)
}
```

The code checks for `survey_id` or `survey_id_id` on the lesson, but neither exists in the seed data.

**Fallback Logic** (lines 265-278):
```typescript
// Determine slug based on lesson number as a fallback
let surveySlug = "";
if (lesson.lesson_number === 8) {
  surveySlug = "three-quick-questions";
} else if (lesson.lesson_number === 31) {
  surveySlug = "feedback";  // Correct fallback for lesson 31
}
```

However, this fallback code is **inside** the `if (surveyId)` block, so it **never executes** when `surveyId` is undefined.

### Historical Context - Regression

A similar issue was fixed previously for the "before-we-begin" lesson:
- **Issue #840/#841**: Fixed "Survey not displayed on 'Before we begin' lesson page"
- **Fix commit**: `f907509e3` - Added `survey_id` to before-we-begin lesson
- **Regression commit**: `5885661d4` (2025-12-08) - "consolidate migrations and refresh seed data" overwrote the fix

The diff from commit `5885661d4` shows the `survey_id` field was removed:
```diff
-    "publishedAt": "2024-09-06T00:00:00.000Z",
-    "survey_id": "{ref:surveys:three-quick-questions}"
+    "publishedAt": "2024-09-06T00:00:00.000Z"
```

The "before-you-go" lesson **never had** a `survey_id` field added - only the fallback logic was updated.

## Error Stack Traces

No errors - the issue is a silent failure due to missing data relationships.

## Related Code

- **Affected Files**:
  - `apps/payload/src/seed/seed-data/course-lessons.json` - Missing `survey_id` on before-you-go lesson
  - `apps/payload/src/seed/seed-data/surveys.json` - Survey has lesson reference but it's unidirectional
  - `apps/web/app/home/(user)/course/lessons/[slug]/_components/LessonDataProvider-enhanced.tsx:242` - Requires `survey_id` on lesson
  - `apps/web/app/home/(user)/course/lessons/[slug]/_components/LessonDataProvider.tsx:241` - Same issue
- **Recent Changes**: Commit `5885661d4` refreshed seed data and regressed the "before-we-begin" fix
- **Suspected Functions**: `LessonDataProviderEnhanced` survey fetching logic

## Related Issues & Context

### Direct Predecessors
- #840 (CLOSED): "Bug Diagnosis: Survey not displayed on 'Before we begin' lesson page" - Same root cause
- #841 (CLOSED): "Bug Fix: Survey not displayed on 'Before we begin' lesson page" - Fix was applied but regressed

### Same Component
- #835 (CLOSED): "Bug Fix: Survey Slug Mismatch Causes Survey Not Found Error"
- #833 (CLOSED): "Bug Diagnosis: Self-Assessment Survey Not Found on Assessment Page"

### Historical Context
This is a **partial regression** combined with an **incomplete fix**:
1. The fix for #841 added `survey_id` to "before-we-begin" but not to "before-you-go"
2. Commit `5885661d4` removed the "before-we-begin" fix when refreshing seed data
3. Neither lesson currently has the required `survey_id` field

## Root Cause Analysis

### Identified Root Cause

**Summary**: The "before-you-go" lesson is missing the `survey_id` field that links it to the "feedback" survey. The data model requires lessons to have a `survey_id` field pointing to their survey, but only the survey has a `lesson` field pointing back.

**Detailed Explanation**:

The issue stems from a **bidirectional relationship requirement** that is only **unidirectionally configured**:

1. **Payload CMS Schema** (`CourseLessons.ts:189-197`):
   ```typescript
   {
     name: "survey_id",
     type: "relationship",
     relationTo: "surveys",
     hasMany: false,
   }
   ```
   The schema defines `survey_id` on lessons, but it's not populated in seed data.

2. **Survey Seed Data** (`surveys.json:20`):
   ```json
   "lesson": "{ref:course-lessons:before-you-go}"
   ```
   The survey references the lesson, but this field isn't used by the code.

3. **Code Expectation** (`LessonDataProvider-enhanced.tsx:242`):
   ```typescript
   const surveyId = (lesson as any).survey_id || lesson.survey_id_id;
   if (surveyId) { ... }  // Never true - surveyId is undefined
   ```
   The code requires `survey_id` on the lesson, which doesn't exist.

**Supporting Evidence**:

- Git diff shows `survey_id` was added to "before-we-begin" in commit `f907509e3` but later removed
- Grep confirms no lessons currently have `survey_id` field
- The fallback logic at lines 273-276 correctly identifies lesson 31 should show "feedback" survey, but it's unreachable because it's inside the `if (surveyId)` block

### How This Causes the Observed Behavior

1. User navigates to `/home/course/lessons/before-you-go`
2. `LessonDataProviderEnhanced` fetches the lesson data via `getLessonBySlug`
3. The lesson object lacks `survey_id` and `survey_id_id` fields
4. Line 242: `const surveyId = lesson.survey_id || lesson.survey_id_id;` evaluates to `undefined`
5. Line 244: `if (surveyId)` check fails (falsy)
6. The entire survey fetching block (lines 244-347) is skipped
7. `survey` remains `null`
8. Line 254-255 in `LessonViewClient.tsx`: `hasSurvey` evaluates to `false`
9. No survey component is rendered

### Confidence Level

**Confidence**: High

**Reasoning**:
- Direct code tracing through the entire flow
- Confirmed by grep that no lessons have `survey_id`
- Historical evidence from git history showing regression
- Same root cause as previously diagnosed issue #840

## Fix Approach (High-Level)

Two changes needed:

1. **Add `survey_id` to both survey lessons** in `course-lessons.json`:
   - "before-we-begin" lesson: Add `"survey_id": "{ref:surveys:three-quick-questions}"`
   - "before-you-go" lesson: Add `"survey_id": "{ref:surveys:feedback}"`

2. **After updating seed data**: Run `pnpm supabase:web:reset` or database seed to apply changes

Alternative approach (if seed data regeneration is frequent):
- Modify the seed data converter to automatically populate `survey_id` on lessons based on survey's `lesson` field

## Diagnosis Determination

The root cause is definitively identified as missing `survey_id` fields in the lesson seed data. The data model uses a unidirectional relationship from survey to lesson, but the code expects the reverse (lesson to survey) via the `survey_id` field. This same issue was previously fixed (#841) but regressed when seed data was refreshed.

## Additional Context

- The Payload CMS collection schema does define `survey_id` on lessons (lines 189-197 in `CourseLessons.ts`)
- The surveys collection does NOT define a `lesson` field in its schema, but the seed data includes one
- This suggests the relationship should flow from lesson to survey, but seed data generation doesn't populate it

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Grep, Glob, Bash (git), file analysis*
