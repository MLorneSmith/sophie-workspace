# Payload CMS Course Lessons and Quizzes Relationships Fix

## Overview

This document outlines the implementation of a solution to fix the relationships between course lessons and quizzes in our Payload CMS integration. We identified that lessons were not properly linked to their corresponding quizzes, and quiz questions were not properly linked to quizzes, causing the Payload admin UI to show "select a value" for these fields.

## Issues Addressed

1. **Missing Quiz Relationships in Course Lessons**:

   - The `course_lessons` table has `quiz_id` and `quiz_id_id` columns, but both were NULL for all lessons
   - Many lessons should have associated quizzes based on their titles (e.g., "Standard Graphs" lesson should be linked to "Standard Graphs Quiz")

2. **Missing Bidirectional Relationships**:

   - No entries in the `course_quizzes_rels` table for the `lesson` field
   - The bidirectional relationship between lessons and quizzes was not established

3. **Missing Quiz Questions Relationships**:
   - The `quiz_questions_id` field in the `course_quizzes_rels` table was NULL for all entries with `field = 'questions'`
   - This caused the Payload admin UI to show "select a value" for the questions field in quizzes

## Root Cause Analysis

The root cause was threefold:

1. **Data Population Issue**: The initial data seeding in `02-lessons.sql` didn't establish the relationships between lessons and quizzes
2. **Bidirectional Relationship Issue**: Payload CMS requires relationships to be established in both directions (lesson → quiz and quiz → lesson)
3. **Relationship ID Issue**: Payload CMS requires the `quiz_questions_id` field to be populated in the `course_quizzes_rels` table for the questions to appear in the admin UI

## Solution Implemented

We created a new migration file `20250404_100000_fix_lesson_quiz_relationships.ts` that:

1. **Matches Lessons to Quizzes by Title**:

   - Identifies lessons that should have quizzes based on title similarity
   - Uses both exact matching (removing "Quiz" from quiz title) and fuzzy matching (checking if one title contains the other)

2. **Updates the Quiz ID Fields**:

   - Sets both `quiz_id` and `quiz_id_id` fields in the `course_lessons` table for matched lessons

3. **Creates Bidirectional Relationships**:

   - Adds entries to the `course_lessons_rels` table for lesson → quiz relationships
   - Adds entries to the `course_quizzes_rels` table for quiz → lesson relationships

4. **Fixes Quiz Questions Relationships**:

   - Updates the `quiz_questions_id` field in the `course_quizzes_rels` table to match the `value` field
   - This ensures that quiz questions appear in the Payload admin UI

5. **Verifies Relationships**:
   - Checks that all lessons with a quiz have corresponding entries in both relationship tables
   - Checks that all quiz questions relationships have the `quiz_questions_id` field populated
   - Logs detailed information about the fixed relationships

## Implementation Details

### 1. Matching Algorithm

The migration uses a two-step matching algorithm:

```typescript
// First, try exact title match (removing "Quiz" from quiz title)
for (const quiz of quizzes) {
  const quizTitleWithoutQuiz = quiz.title.replace(' Quiz', '');

  if (lesson.title === quizTitleWithoutQuiz) {
    matchedQuiz = quiz;
    console.log(
      `Found exact match: Lesson "${lesson.title}" -> Quiz "${quiz.title}"`,
    );
    break;
  }
}

// If no exact match, try fuzzy match
if (!matchedQuiz) {
  for (const quiz of quizzes) {
    const quizTitleWithoutQuiz = quiz.title.replace(' Quiz', '');

    // Check if lesson title contains quiz title or vice versa
    if (
      lesson.title.includes(quizTitleWithoutQuiz) ||
      quizTitleWithoutQuiz.includes(lesson.title)
    ) {
      matchedQuiz = quiz;
      console.log(
        `Found fuzzy match: Lesson "${lesson.title}" -> Quiz "${quiz.title}"`,
      );
      break;
    }
  }
}
```

### 2. Updating Quiz ID Fields

For each matched lesson-quiz pair, the migration updates both `quiz_id` and `quiz_id_id` fields:

```typescript
const { rowCount } = await db.execute(sql`
  UPDATE payload.course_lessons
  SET 
    quiz_id = ${match.quizId},
    quiz_id_id = ${match.quizId}
  WHERE id = ${match.lessonId}
  AND (quiz_id IS NULL OR quiz_id_id IS NULL);
`);
```

### 3. Creating Bidirectional Relationships

The migration creates entries in both relationship tables:

```typescript
// Create relationships from lessons to quizzes (course_lessons_rels)
const { rowCount: lessonRelsAdded } = await db.execute(sql`
  WITH lessons_to_link AS (
    SELECT id as lesson_id, quiz_id
    FROM payload.course_lessons
    WHERE quiz_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM payload.course_lessons_rels
      WHERE _parent_id = id
      AND field = 'quiz_id'
      AND value = quiz_id
    )
  )
  INSERT INTO payload.course_lessons_rels (id, _parent_id, field, value, created_at, updated_at)
  SELECT 
    gen_random_uuid(), 
    lesson_id, 
    'quiz_id', 
    quiz_id,
    NOW(),
    NOW()
  FROM lessons_to_link;
`);

// Create relationships from quizzes to lessons (course_quizzes_rels)
const { rowCount: quizRelsAdded } = await db.execute(sql`
  WITH quizzes_to_link AS (
    SELECT id as lesson_id, quiz_id
    FROM payload.course_lessons
    WHERE quiz_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM payload.course_quizzes_rels
      WHERE _parent_id = quiz_id
      AND field = 'lesson'
      AND value = id
    )
  )
  INSERT INTO payload.course_quizzes_rels (id, _parent_id, field, value, created_at, updated_at)
  SELECT 
    gen_random_uuid(), 
    quiz_id, 
    'lesson', 
    lesson_id,
    NOW(),
    NOW()
  FROM quizzes_to_link;
`);
```

### 4. Fixing Quiz Questions Relationships

The migration updates the `quiz_questions_id` field in the `course_quizzes_rels` table:

```typescript
// Fix quiz_questions_id field in course_quizzes_rels table
const { rowCount: updatedQuizQuestionsRels } = await db.execute(sql`
  UPDATE payload.course_quizzes_rels
  SET quiz_questions_id = value
  WHERE field = 'questions'
  AND quiz_questions_id IS NULL
  AND EXISTS (
    SELECT 1 FROM payload.quiz_questions
    WHERE id = value
  );
`);

console.log(
  `Updated quiz_questions_id for ${updatedQuizQuestionsRels} quiz question relationships`,
);
```

### 5. Verification

The migration verifies that all relationships are properly established:

```typescript
const { rows: verificationResult } = await db.execute<{
  lessons_with_quiz: string;
  lesson_rels: string;
  quiz_rels: string;
  quiz_questions_rels: string;
  quiz_questions_rels_with_id: string;
}>(sql`
  SELECT 
    (SELECT COUNT(*) FROM payload.course_lessons WHERE quiz_id IS NOT NULL) as lessons_with_quiz,
    (SELECT COUNT(*) FROM payload.course_lessons_rels WHERE field = 'quiz_id') as lesson_rels,
    (SELECT COUNT(*) FROM payload.course_quizzes_rels WHERE field = 'lesson') as quiz_rels,
    (SELECT COUNT(*) FROM payload.course_quizzes_rels WHERE field = 'questions') as quiz_questions_rels,
    (SELECT COUNT(*) FROM payload.course_quizzes_rels WHERE field = 'questions' AND quiz_questions_id IS NOT NULL) as quiz_questions_rels_with_id;
`);

const lessonsWithQuiz = parseInt(verificationResult[0].lessons_with_quiz);
const lessonRels = parseInt(verificationResult[0].lesson_rels);
const quizRels = parseInt(verificationResult[0].quiz_rels);
const quizQuestionsRels = parseInt(verificationResult[0].quiz_questions_rels);
const quizQuestionsRelsWithId = parseInt(
  verificationResult[0].quiz_questions_rels_with_id,
);

// Verify lesson-quiz relationships
if (lessonsWithQuiz !== lessonRels || lessonsWithQuiz !== quizRels) {
  console.warn(`Warning: Not all lesson-quiz relationships are bidirectional`);
  console.warn(`- Lessons with quiz: ${lessonsWithQuiz}`);
  console.warn(`- Lesson relationships: ${lessonRels}`);
  console.warn(`- Quiz relationships: ${quizRels}`);
} else {
  console.log('✅ All lesson-quiz relationships are properly bidirectional');
}

// Verify quiz-questions relationships
if (quizQuestionsRels !== quizQuestionsRelsWithId) {
  console.warn(
    `Warning: Not all quiz-questions relationships have quiz_questions_id set`,
  );
  console.warn(`- Quiz questions relationships: ${quizQuestionsRels}`);
  console.warn(
    `- Quiz questions relationships with ID: ${quizQuestionsRelsWithId}`,
  );
} else {
  console.log('✅ All quiz-questions relationships have quiz_questions_id set');
}
```

## How to Test

Run the reset-and-migrate.ps1 script, which will:

1. Reset the database
2. Run all migrations, including our new migration
3. Verify that all relationships are properly established

After running the script, you should be able to see:

- Course lessons with proper quiz values in the Payload admin UI
- Course quizzes with their associated lessons in the Payload admin UI
- Course quizzes with their associated questions in the Payload admin UI

## Future Recommendations

1. **Update Seed Files**: Modify the `02-lessons.sql` file to include quiz relationships from the start
2. **Enhance Collection Definitions**: Consider adding more explicit relationship definitions in the collection files
3. **Improve Migration Process**: Consolidate relationship fixes into a single migration file
4. **Add Validation**: Add validation to ensure relationships are properly established during content creation

## Conclusion

This implementation successfully addresses the relationship issues between course lessons and quizzes in our Payload CMS integration. By using a combination of title matching and bidirectional relationship creation, we've ensured that lessons are properly linked to their corresponding quizzes, and vice versa. This will improve the user experience in the Payload admin UI and ensure data integrity in the application.
