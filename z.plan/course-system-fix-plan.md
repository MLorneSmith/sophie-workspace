# Course System Fix Plan

## Introduction

This document outlines the plan to fix several issues with the course system in our Makerkit-based Next.js 15 application with Payload CMS integration. The issues include missing lesson durations, automatic redirection from quiz summary pages, missing quizzes for certain lessons, lack of support for multiple correct answers in quizzes, and incorrect quiz progress bar calculation.

## Content Migration System Overview

The project uses a comprehensive content migration system managed by the `reset-and-migrate.ps1` script. This script orchestrates the entire database reset and migration process through these key steps:

1. **Reset Supabase database and run web app migrations**
2. **Reset Payload schema**
3. **Run Payload migrations**
4. **Process raw data if needed** (using `pnpm run process:raw-data`)
5. **Run content migrations via Payload migrations**
6. **Check and execute SQL seed files if needed**
7. **Perform comprehensive database verification**

The content migration system works as follows:

1. **Raw Data Processing**:

   - The `process-raw-data.ts` script processes raw data from `packages/content-migrations/src/data/raw`
   - It generates SQL seed files using `generate-sql-seed-files-fixed.ts`
   - These SQL files are stored in both the Payload seed directory and the processed directory

2. **SQL Seed Generation**:

   - The `generate-sql-seed-files-fixed.ts` script reads raw .mdoc files
   - It generates SQL files for courses, lessons, quizzes, questions, surveys, etc.
   - It handles relationships between entities (e.g., lessons to quizzes)

3. **Database Population**:
   - The SQL seed files are executed during the migration process to populate the database

## Issues and Solutions

### 1. Missing Lesson Duration

#### Issue:

All lessons have a `lessonLength` field in their raw `.mdoc` files, but the `estimated_duration` field in the database is `null` for all lessons.

#### Root Cause:

- The migration script (`migrate-course-lessons-direct.ts`) correctly maps `data.lessonLength` to `estimated_duration`
- However, there appears to be a field name mismatch between the database (`estimated_duration`) and the Payload CMS collection (`estimatedDuration`)

#### Solution:

1. Update the database with the correct duration values from the raw lesson data
2. Ensure the field name mapping is consistent between the database and the CMS

#### Implementation:

```typescript
// SQL script to update estimated_duration from raw lesson data
async function updateLessonDurations() {
  // For each lesson in the raw data, update the database
  const lessons = [
    { slug: 'what-is-structure', duration: 22 },
    { slug: 'before-we-begin', duration: 3 },
    // Add all lessons with their durations
  ];

  for (const lesson of lessons) {
    await client.query(
      `UPDATE payload.course_lessons 
       SET estimated_duration = $1 
       WHERE slug = $2`,
      [lesson.duration, lesson.slug],
    );
  }
}
```

### 2. Automatic Redirection from Quiz Summary

#### Issue:

When a user completes a quiz, they are automatically redirected to the next lesson without having a chance to review the quiz summary.

#### Root Cause:

In `LessonViewClient.tsx`, the `handleQuizSubmit` function automatically calls `navigateToNextLesson()` when a quiz is passed, bypassing the "Next Lesson" button in the quiz summary.

#### Solution:

Remove the automatic navigation after quiz completion and rely on the user clicking the "Next Lesson" button in the quiz summary.

#### Implementation:

```typescript
// In LessonViewClient.tsx, modify handleQuizSubmit
const handleQuizSubmit = (
  answers: Record<string, any>,
  score: number,
  passed: boolean,
) => {
  startTransition(async () => {
    try {
      await submitQuizAttemptAction({
        courseId,
        lessonId: lesson.id,
        quizId: quiz.id,
        answers,
        score,
        passed,
      });

      setQuizCompleted(passed);

      // If quiz is passed, mark lesson as completed but DON'T navigate automatically
      if (passed) {
        await updateLessonProgressAction({
          courseId,
          lessonId: lesson.id,
          completionPercentage: 100,
          completed: true,
        });

        // Remove this line to prevent automatic navigation
        // navigateToNextLesson();
      }
    } catch (error) {
      toast.error('Failed to submit quiz. Please try again.');
    }
  });
};
```

### 3. Missing Quizzes for Certain Lessons

#### Issue:

Several lessons don't have associated quizzes:

- "The Why: Building Introductions" (lesson_number: 203)
- "The Why: Next Steps" (lesson_number: 204)
- "Tables vs. Graphs" (lesson_number: 602)
- "Preparation and Practice" (lesson_number: 701)

#### Root Cause:

The current quiz-lesson association is done during the migration process in `migrate-course-lessons-direct.ts`. The script tries to find quizzes by slug derived from the `data.quiz` field in the lesson file, which may be missing or inconsistent.

#### Solution:

1. Create a hard-coded mapping file for lesson-quiz associations
2. Update the migration script to use this mapping
3. Update the database with the correct quiz associations

#### Implementation:

```typescript
// Create a new file: apps/web/lib/course/lesson-quiz-mapping.ts
export const lessonQuizMapping = {
  // Format: lessonSlug: quizSlug
  'our-process': 'our-process-quiz',
  'the-who': 'the-who-quiz',
  'the-why-introductions': 'introductions-quiz', // Add missing mapping
  'the-why-next-steps': 'why-next-steps-quiz', // Add missing mapping
  'idea-generation': 'idea-generation-quiz',
  'what-is-structure': 'structure-quiz',
  'using-stories': 'using-stories-quiz',
  'storyboards-film': 'storyboards-in-film-quiz',
  'storyboards-presentations': 'storyboards-in-presentations-quiz',
  'visual-perception': 'visual-perception-quiz',
  'fundamental-design-overview': 'overview-elements-of-design-quiz',
  'fundamental-design-detail': 'elements-of-design-detail-quiz',
  'gestalt-principles': 'gestalt-principles-quiz',
  'slide-composition': 'slide-composition-quiz',
  'tables-vs-graphs': 'tables-vs-graphs-quiz', // Add missing mapping
  'basic-graphs': 'basic-graphs-quiz',
  'fact-based-persuasion': 'fact-persuasion-quiz',
  'specialist-graphs': 'specialist-graphs-quiz',
  'preparation-practice': 'preparation-practice-quiz', // Add missing mapping
  performance: 'performance-quiz',
};
```

### 4. Multiple Correct Answers in Quizzes

#### Issue:

Some quizzes have questions with multiple correct answers, but the UI only allows selecting one answer.

#### Root Cause:

The `QuizComponent.tsx` has code to handle both single-answer and multi-answer questions, but it's not correctly identifying or handling multi-answer questions.

#### Solution:

Fix the `QuizComponent.tsx` to properly handle multi-answer questions and ensure the question type is correctly passed from the database to the component.

#### Implementation:

```typescript
// In QuizComponent.tsx, update the isMultiAnswerQuestion function
const isMultiAnswerQuestion = (question: any): boolean => {
  // Check if the question type is multi-answer or if it has multiple correct answers
  if (question?.questiontype === 'multi-answer') {
    return true;
  }

  // Count correct options
  const correctOptions = (question?.options || []).filter(
    (option: any) => option.isCorrect,
  );

  // If more than one correct option, treat as multi-answer
  return correctOptions.length > 1;
};
```

### 5. Quiz Progress Bar Calculation

#### Issue:

The progress bar in quizzes shows progress for the current question even before it's answered.

#### Root Cause:

In `QuizComponent.tsx`, the progress bar calculation is based on `((currentQuestionIndex + 1) / totalQuestions) * 100`, which includes the current question in the progress.

#### Solution:

Update the progress calculation to use only completed questions by changing the formula to `(currentQuestionIndex / totalQuestions) * 100`.

#### Implementation:

```typescript
// In QuizComponent.tsx, update the progress bar calculation
<div className="mb-6">
  <div className="flex justify-between text-sm">
    <span>
      Question {currentQuestionIndex + 1} of {totalQuestions}
    </span>
    <span>
      {/* Change from currentQuestionIndex + 1 to currentQuestionIndex */}
      {Math.round((currentQuestionIndex / totalQuestions) * 100)}%
    </span>
  </div>
  <Progress
    {/* Change from currentQuestionIndex + 1 to currentQuestionIndex */}
    value={(currentQuestionIndex / totalQuestions) * 100}
    className="h-2"
  />
</div>
```

## Implementation Steps

1. **Update Lesson Durations**:

   - Create a script to update the estimated_duration field for all lessons
   - Run the script to populate the missing durations

2. **Fix Quiz Summary Navigation**:

   - Modify the LessonViewClient.tsx file to remove automatic navigation
   - Ensure the "Next Lesson" button works correctly

3. **Implement Lesson-Quiz Mapping**:

   - Create the lesson-quiz-mapping.ts file
   - Update the LessonDataProvider.tsx to use this mapping
   - Run a database update script to fix the missing quiz associations

4. **Fix Multiple Correct Answers**:

   - Update the QuizComponent.tsx to properly handle multi-answer questions
   - Test with quizzes that have multiple correct answers

5. **Fix Progress Bar Calculation**:
   - Update the progress calculation in QuizComponent.tsx
   - Test the progress bar behavior

## Testing Plan

1. **Lesson Duration**:

   - Verify that all lessons show the correct duration on the lesson page
   - Check that the duration is displayed in the course dashboard

2. **Quiz Summary Navigation**:

   - Complete a quiz and verify that you stay on the summary page
   - Click the "Next Lesson" button and verify navigation works

3. **Lesson-Quiz Mapping**:

   - Verify that all lessons have the correct associated quizzes
   - Test the lessons that previously had missing quizzes

4. **Multiple Correct Answers**:

   - Test quizzes with multiple correct answers
   - Verify that you can select multiple options
   - Verify that the quiz is only passed when all correct options are selected

5. **Progress Bar Calculation**:
   - Start a quiz and verify the progress bar starts at 0%
   - Answer questions and verify the progress increases correctly

## Conclusion

This plan addresses all the identified issues with the course system. By implementing these changes, we will improve the user experience and ensure that the course system functions as expected. The changes are focused on specific areas of the codebase and should not affect other parts of the application.
