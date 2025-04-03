# Course System Field Naming Fixes

## Overview

The course system in our application was experiencing issues with lesson cards not displaying properly and slow loading times. After investigation, we identified field naming mismatches between the Payload CMS collection definitions and the database schema as the root cause.

## Issues Identified

1. **Lesson Number Field Mismatch**
   - In the Payload CMS collection definition (`CourseLessons.ts`), the field was defined as `lessonNumber` (camelCase)
   - In the database, the column was stored as `lesson_number` (snake_case)
   - This naming mismatch caused the field to be `undefined` in the API response
   - Without proper lesson numbers, lessons couldn't be sorted correctly

2. **Quiz ID Field References**
   - References to a non-existent `quiz_id_id` field in debug output
   - Confusion between `quiz_id` and `quiz_id_id` fields
   - These references were causing noise in the logs and potential confusion in the code

## Root Cause Analysis

The root cause of these issues was a mismatch between how Payload CMS defines fields and how they are stored in the database:

1. **Payload CMS Field Naming**: Payload CMS allows fields to be defined using camelCase in the collection definition.

2. **Database Column Naming**: The database schema uses snake_case for column names.

3. **Missing Mapping**: There was no explicit mapping between the two naming conventions, causing the fields to be undefined in the API response.

## Server Logs Before Fix

```
web:dev: API - Lessons data: {
  count: 26,
  sampleLesson: {
    id: '3d5d6508-1671-4342-be1f-b2a03dc01afe',
    title: 'Before we begin...',
    lesson_number: undefined,
    quiz_id: null,
    quiz_id_id: undefined
  }
}
```

## Solution Implementation

### 1. Update Collection Definition

We updated the Payload CMS collection definition to use `lesson_number` instead of `lessonNumber`, aligning it with the database column name:

**Before:**
```typescript
// In apps/payload/src/collections/CourseLessons.ts
admin: {
  useAsTitle: 'title',
  defaultColumns: ['title', 'lessonNumber', 'course_id'],
  description: 'Lessons for courses in the learning management system',
},
// ...
{
  name: 'lessonNumber',
  type: 'number',
  required: true,
  min: 1,
  admin: {
    description: 'Order in which this lesson appears in the course',
  },
},
```

**After:**
```typescript
// In apps/payload/src/collections/CourseLessons.ts
admin: {
  useAsTitle: 'title',
  defaultColumns: ['title', 'lesson_number', 'course_id'],
  description: 'Lessons for courses in the learning management system',
},
// ...
{
  name: 'lesson_number',
  type: 'number',
  required: true,
  min: 1,
  admin: {
    description: 'Order in which this lesson appears in the course',
  },
},
```

### 2. Remove References to `quiz_id_id`

We removed references to the non-existent `quiz_id_id` field from the API route and client component:

**Before (API Route):**
```typescript
// In apps/web/app/api/courses/[courseId]/lessons/route.ts
console.log('API - Lessons data:', {
  count: lessons.docs?.length || 0,
  sampleLesson: lessons.docs?.[0]
    ? {
        id: lessons.docs[0].id,
        title: lessons.docs[0].title,
        lesson_number: lessons.docs[0].lesson_number,
        quiz_id: lessons.docs[0].quiz_id,
        quiz_id_id: lessons.docs[0].quiz_id_id,
      }
    : null,
});
```

**After (API Route):**
```typescript
// In apps/web/app/api/courses/[courseId]/lessons/route.ts
console.log('API - Lessons data:', {
  count: lessons.docs?.length || 0,
  sampleLesson: lessons.docs?.[0]
    ? {
        id: lessons.docs[0].id,
        title: lessons.docs[0].title,
        lesson_number: lessons.docs[0].lesson_number,
        quiz_id: lessons.docs[0].quiz_id,
      }
    : null,
});
```

**Before (Client Component):**
```typescript
// In apps/web/app/home/(user)/course/_components/CourseDashboardClient.tsx
console.log('CourseDashboardClient - Lessons data:', {
  lessonCount: lessonsData.docs?.length || 0,
  lessons: lessonsData.docs?.map((l: any) => ({
    id: l.id,
    title: l.title,
    lesson_number: l.lesson_number,
    quiz_id: l.quiz_id,
    quiz_id_id: l.quiz_id_id,
  })),
});
```

**After (Client Component):**
```typescript
// In apps/web/app/home/(user)/course/_components/CourseDashboardClient.tsx
console.log('CourseDashboardClient - Lessons data:', {
  lessonCount: lessonsData.docs?.length || 0,
  lessons: lessonsData.docs?.map((l: any) => ({
    id: l.id,
    title: l.title,
    lesson_number: l.lesson_number,
    quiz_id: l.quiz_id,
  })),
});
```

## Testing and Verification

After implementing the changes, we verified that the issues were resolved:

1. **Lesson Numbers Now Working**: The API response now correctly includes the `lesson_number` field with proper values.

2. **Removed `quiz_id_id` References**: The `quiz_id_id` field is no longer being referenced in the API response or client component.

## Server Logs After Fix

```
web:dev: API - Lessons data: {
  count: 26,
  sampleLesson: {
    id: 'f928c064-02e2-4f54-8e00-7c32652eb770',
    title: 'Welcome to DDM',
    lesson_number: 101,
    quiz_id: null
  }
}
```

## Lessons Learned

1. **Consistent Naming Conventions**: Ensure consistent naming conventions between Payload CMS collection definitions and database schema.

2. **Field Mapping**: When using Payload CMS with an existing database schema, make sure to map field names correctly.

3. **Debug Output**: Be careful with debug output that references fields that might not exist, as it can cause confusion.

## Related Issues

This fix is related to previous work on quiz relationships:

1. **Quiz ID Column Issue**: See `z.plan/payload-quiz-id-column-issue.md` for details on the quiz ID column issue.

2. **Course Lesson Quiz Relationship Fix**: See `z.plan/course-lesson-quiz-relationship-fix.md` for details on the relationship fix.

## Remaining Minor Issues

There's still a 404 error for the placeholder SVG:
```
web:dev: GET /placeholder.svg?height=155&width=275 404 in 911ms
```

This is a minor issue with a missing asset file that could be addressed by:
1. Creating a placeholder SVG file in the public directory
2. Updating the client component to use a different placeholder image

## Future Recommendations

1. **Audit Field Names**: Conduct a comprehensive audit of field names across all collection definitions to ensure consistency with the database schema.

2. **Standardize Naming Conventions**: Establish a standard naming convention for both Payload CMS fields and database columns to avoid similar issues in the future.

3. **Add Placeholder Assets**: Add missing placeholder assets to prevent 404 errors.
