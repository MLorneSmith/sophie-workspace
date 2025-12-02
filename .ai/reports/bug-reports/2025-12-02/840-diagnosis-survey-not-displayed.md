# Bug Diagnosis: Survey not displayed on 'Before we begin' lesson page

**ID**: ISSUE-840
**Created**: 2025-12-02T18:30:00Z
**Reporter**: user
**Severity**: medium
**Status**: new
**Type**: bug

## Summary

The "Three Quick Questions" survey is not being displayed on the lesson page at `/home/course/lessons/before-we-begin`. The survey should appear automatically when the user visits this lesson, similar to how the self-assessment survey appears on the `/home/assessment` page.

## Environment

- **Application Version**: dev branch (commit bfda18fd8)
- **Environment**: development
- **Node Version**: 20.x
- **Database**: PostgreSQL (via Supabase/Payload CMS)
- **Last Working**: Unknown - feature may have never worked correctly

## Reproduction Steps

1. Log in to the application
2. Navigate to `/home/course/lessons/before-we-begin`
3. Observe that the survey "Three Quick Questions" is not displayed
4. Expected: Survey should be displayed automatically (like on `/home/assessment`)

## Expected Behavior

When visiting the "Before we begin" lesson page, the "Three Quick Questions" survey should be displayed, allowing users to complete it as part of the lesson.

## Actual Behavior

The survey is not displayed. The lesson content is shown without any survey component.

## Diagnostic Data

### Code Analysis

The `LessonDataProviderEnhanced` component at `apps/web/app/home/(user)/course/lessons/[slug]/_components/LessonDataProvider-enhanced.tsx:236-345` handles survey data fetching.

**Critical logic at lines 240-276:**
```typescript
// Check for survey relationship - use survey_id_id (correct column name)
const surveyId = lesson.survey_id_id;

if (surveyId) {
  // ... survey fetching logic ...

  // Determine slug based on lesson number as a fallback
  let surveySlug = "";
  if (lesson.lesson_number === 103) {        // <-- WRONG LESSON NUMBER
    surveySlug = "three-quick-questions";
    // ...
  }
}
```

### Seed Data Analysis

**Lesson "before-we-begin"** (`apps/payload/src/seed/seed-data/course-lessons.json:39-74`):
- `lesson_number`: **8** (NOT 103)
- **Missing**: `survey_id` field - no survey relationship defined

**Survey "three-quick-questions"** (`apps/payload/src/seed/seed-data/surveys.json:63-81`):
- Linked to: `"{ref:course-lessons:lesson-0}"` (WRONG - should be `before-we-begin`)
- Should be linked to: `before-we-begin`

## Error Stack Traces

No errors - the issue is silent failure due to missing data relationships.

## Related Code

- **Affected Files**:
  - `apps/payload/src/seed/seed-data/course-lessons.json` - Missing `survey_id` on before-we-begin lesson
  - `apps/payload/src/seed/seed-data/surveys.json` - Survey linked to wrong lesson
  - `apps/web/app/home/(user)/course/lessons/[slug]/_components/LessonDataProvider-enhanced.tsx:265` - Hardcoded lesson_number check
  - `apps/web/app/home/(user)/course/lessons/[slug]/_components/LessonDataProvider.tsx:268` - Hardcoded lesson_number check
- **Recent Changes**: Recent commit `bfda18fd8` fixed survey slug field, indicating ongoing work in this area
- **Suspected Functions**: `LessonDataProviderEnhanced` survey fetching logic

## Related Issues & Context

### Similar Symptoms
- Issue #835 appears related to survey slug handling based on file search results

### Historical Context
This appears to be a configuration/data issue rather than a regression. The seed data has been inconsistent between lessons and surveys.

## Root Cause Analysis

### Identified Root Cause

**Summary**: The survey is not displayed because: (1) the lesson seed data lacks a `survey_id` field pointing to the survey, (2) the survey seed data references the wrong lesson (`lesson-0` instead of `before-we-begin`), and (3) the hardcoded fallback logic uses the wrong `lesson_number` (103 instead of 8).

**Detailed Explanation**:

There are **three independent data/code issues** causing this bug:

1. **Missing `survey_id` on lesson** (`course-lessons.json:39-74`):
   - The "before-we-begin" lesson does NOT have a `survey_id` field
   - Compare with lessons that have quizzes - they have `"quiz_id": "{ref:course-quizzes:...}"`
   - The lesson needs: `"survey_id": "{ref:surveys:three-quick-questions}"`

2. **Survey references wrong lesson** (`surveys.json:63-81`):
   - The "three-quick-questions" survey has `"lesson": "{ref:course-lessons:lesson-0}"`
   - This should be `"lesson": "{ref:course-lessons:before-we-begin}"`
   - This is a bidirectional relationship issue

3. **Hardcoded lesson_number fallback is wrong** (`LessonDataProvider-enhanced.tsx:265`):
   - Code checks: `if (lesson.lesson_number === 103)`
   - The actual `lesson_number` for "before-we-begin" is **8**, not 103
   - This fallback was likely meant as a temporary workaround but used wrong value

**Supporting Evidence**:

From `course-lessons.json` (lines 39-74):
```json
{
  "_ref": "before-we-begin",
  "id": "before-we-begin",
  "slug": "before-we-begin",
  "title": "Before we begin...",
  "lesson_number": 8,  // <-- Lesson number is 8
  // NO survey_id field exists here!
}
```

From `surveys.json` (lines 63-81):
```json
{
  "id": "three-quick-questions",
  "slug": "three-quick-questions",
  "title": "Three Quick Questions",
  "lesson": "{ref:course-lessons:lesson-0}"  // <-- Wrong lesson reference!
}
```

From `LessonDataProvider-enhanced.tsx` (line 265):
```typescript
if (lesson.lesson_number === 103) {  // <-- Checking for 103, but lesson_number is 8
  surveySlug = "three-quick-questions";
}
```

### How This Causes the Observed Behavior

1. User navigates to `/home/course/lessons/before-we-begin`
2. `LessonDataProviderEnhanced` fetches the lesson data
3. `lesson.survey_id_id` is `null`/`undefined` (not set in seed data)
4. The `if (surveyId)` check fails, skipping primary survey fetch
5. The fallback check `lesson.lesson_number === 103` also fails (actual value is 8)
6. `survey` remains `null`, `hasSurvey` is `false`
7. No survey is rendered

### Confidence Level

**Confidence**: High

**Reasoning**:
- Direct code tracing from the lesson page through data provider to seed data
- Clear mismatch between expected values (103) and actual values (8)
- Missing relationship field is plainly visible in seed data
- Consistent findings across multiple files

## Fix Approach (High-Level)

Three changes needed:

1. **Update `course-lessons.json`**: Add `"survey_id": "{ref:surveys:three-quick-questions}"` to the "before-we-begin" lesson entry

2. **Update `surveys.json`**: Change the "three-quick-questions" survey's `"lesson"` field from `"{ref:course-lessons:lesson-0}"` to `"{ref:course-lessons:before-we-begin}"`

3. **Fix hardcoded fallback** in both `LessonDataProvider.tsx` and `LessonDataProvider-enhanced.tsx`: Change `lesson.lesson_number === 103` to `lesson.lesson_number === 8` (or better, remove hardcoded fallback entirely once proper relationships are established)

After fixing, run database reset/seed to apply changes.

## Diagnosis Determination

The root cause has been definitively identified as a data configuration issue in the seed files combined with incorrect hardcoded fallback logic. The survey relationship is not properly established between the "before-we-begin" lesson and the "three-quick-questions" survey, and the fallback mechanism uses an incorrect lesson number.

## Additional Context

- The assessment page (`/home/assessment`) works because it fetches the survey directly by slug ("self-assessment") rather than relying on lesson-survey relationships
- The lesson page implementation relies on `lesson.survey_id_id` to determine if a survey should be displayed
- This appears to be a configuration oversight rather than a code logic bug

---
*Generated by Claude Debug Assistant*
*Tools Used: Read, Grep, Glob, file analysis*
