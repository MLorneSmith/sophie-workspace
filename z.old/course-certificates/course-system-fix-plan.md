# Course System Fix Plan

## Overview

This document outlines the plan for fixing various issues with the course system in our Makerkit-based Next.js 15 application with Payload CMS integration.

## Current Issues

1. **Missing Quiz Relationships**: Several lessons don't have their corresponding quizzes linked to them in the database, despite the quizzes existing.
2. **Navigation After Lesson Completion**: When a lesson without a quiz is marked as completed, the user should be automatically navigated to the next lesson, but this isn't happening.
3. **Multiple Correct Answers in Quizzes**: Some quizzes have multiple correct answers, but the UI only allows selecting one answer.
4. **Line Spacing in Quiz Container**: The line spacing in the Quiz container is not optimal, with lines appearing squished together.
5. **Certificate Generation**: The certificate generation process is not working correctly when completing the course.

## Root Cause Analysis

### 1. Missing Quiz Relationships

The following lessons don't have their corresponding quizzes linked:

- **"The Why: Building the Introduction"** (lesson_number: 203) should be linked to **"The Why (Introductions) Quiz"** (slug: introductions-quiz)
- **"The Why: Next Steps"** (lesson_number: 204) should be linked to **"The Why (Next Steps) Quiz"** (slug: why-next-steps-quiz)
- **"Tables vs. Graphs"** should be linked to **"Tables vs Graphs Quiz"** (slug: tables-vs-graphs-quiz)
- **"Preparation and Practice"** (lesson_number: 701) should be linked to **"Perparation & Practice Quiz"** (slug: preparation-practice-quiz) - note the typo in "Perparation"

The `fix_lesson_quiz_relationships` migration script was supposed to match these lessons to quizzes based on title similarity, but it failed to match these specific lessons, likely due to:

1. Title differences (e.g., "The Why: Building the Introduction" vs "The Why (Introductions) Quiz")
2. The typo in "Perparation & Practice Quiz"

### 2. Navigation After Lesson Completion

The issue is in the `LessonViewClient.tsx` component:

- The `markLessonAsCompleted` function updates the lesson progress but doesn't navigate to the next lesson
- The "Next Lesson" button only appears after the lesson is already marked as completed

### 3. Multiple Correct Answers in Quizzes

Some quizzes have multiple correct answers (as seen in the "The Why (Introductions) Quiz"), but the UI only allows selecting one answer. This is because:

- The quiz schema in `QuizQuestions.ts` supports multiple correct answers via the `isCorrect` checkbox in the options array
- However, the `QuizComponent.tsx` is treating all quizzes as single-answer quizzes

### 4. Line Spacing in Quiz Container

The line spacing issue in the Quiz container is a CSS styling problem.

### 5. Certificate Generation

The certificate generation process is not working correctly when completing the course. This could be due to:

- The course completion logic not properly triggering certificate generation
- Issues with the PDF.co API integration
- Problems with the Supabase storage bucket for certificates

## Implementation Plan

### 1. Fix Quiz Relationships

Create a SQL migration script to manually link the missing quizzes to their corresponding lessons:

```sql
-- Update lesson-quiz relationships
UPDATE payload.course_lessons
SET quiz_id = 'a42f601d-f968-4d08-8b46-46bb62a43ad4', -- The Why (Introductions) Quiz
    quiz_id_id = 'a42f601d-f968-4d08-8b46-46bb62a43ad4'
WHERE title = 'The Why: Building the Introduction';

UPDATE payload.course_lessons
SET quiz_id = '98025e2d-2d8f-4a49-960b-e9985c5fa992', -- The Why (Next Steps) Quiz
    quiz_id_id = '98025e2d-2d8f-4a49-960b-e9985c5fa992'
WHERE title = 'The Why: Next Steps';

UPDATE payload.course_lessons
SET quiz_id = 'a9c824c9-9ce1-4c48-a742-91d31bbb77ea', -- Tables vs Graphs Quiz
    quiz_id_id = 'a9c824c9-9ce1-4c48-a742-91d31bbb77ea'
WHERE title = 'Tables vs. Graphs';

UPDATE payload.course_lessons
SET quiz_id = '22fa2e61-c1e4-4a25-9ea8-26ef03cf3b38', -- Perparation & Practice Quiz
    quiz_id_id = '22fa2e61-c1e4-4a25-9ea8-26ef03cf3b38'
WHERE title = 'Preparation and Practice';

-- Create bidirectional relationships
INSERT INTO payload.course_lessons_rels (id, _parent_id, field, value, created_at, updated_at)
SELECT
  gen_random_uuid(),
  cl.id,
  'quiz_id',
  cl.quiz_id,
  NOW(),
  NOW()
FROM payload.course_lessons cl
WHERE cl.quiz_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM payload.course_lessons_rels
  WHERE _parent_id = cl.id
  AND field = 'quiz_id'
  AND value = cl.quiz_id
);

INSERT INTO payload.course_quizzes_rels (id, _parent_id, field, value, created_at, updated_at)
SELECT
  gen_random_uuid(),
  cl.quiz_id,
  'lesson',
  cl.id,
  NOW(),
  NOW()
FROM payload.course_lessons cl
WHERE cl.quiz_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM payload.course_quizzes_rels
  WHERE _parent_id = cl.quiz_id
  AND field = 'lesson'
  AND value = cl.id
);
```

### 2. Fix Navigation After Lesson Completion

Modify the `markLessonAsCompleted` function in `LessonViewClient.tsx` to navigate to the next lesson after marking a lesson as completed:

```typescript
const markLessonAsCompleted = () => {
  setIsMarkingCompleted(true);

  startTransition(async () => {
    try {
      await updateLessonProgressAction({
        courseId,
        lessonId: lesson.id,
        completionPercentage: 100,
        completed: true,
      });

      toast.success('Lesson marked as completed!');
      setIsMarkingCompleted(false);

      // Navigate to the next lesson automatically
      navigateToNextLesson();
    } catch (error) {
      toast.error('Failed to mark lesson as completed. Please try again.');
      setIsMarkingCompleted(false);
    }
  });
};
```

### 3. Fix Multiple Correct Answers in Quizzes

Update the `QuizComponent.tsx` to handle multiple correct answers:

1. Add a state variable to track multiple selections
2. Modify the answer selection logic to allow multiple selections when appropriate
3. Update the quiz submission logic to handle multiple correct answers

```typescript
// Example implementation for multiple answer support
const [selectedAnswers, setSelectedAnswers] = useState<
  Record<string, Set<string>>
>({});

// Determine if a question allows multiple answers
const allowsMultipleAnswers = (question: any) => {
  return question.questiontype === 'multi-answer';
};

// Handle answer selection
const handleAnswerSelect = (questionId: string, answerId: string) => {
  setSelectedAnswers((prev) => {
    const currentSelections = prev[questionId] || new Set();
    const newSelections = new Set(currentSelections);

    if (allowsMultipleAnswers(questions.find((q) => q.id === questionId))) {
      // For multiple-answer questions, toggle the selection
      if (newSelections.has(answerId)) {
        newSelections.delete(answerId);
      } else {
        newSelections.add(answerId);
      }
    } else {
      // For single-answer questions, replace the selection
      newSelections.clear();
      newSelections.add(answerId);
    }

    return {
      ...prev,
      [questionId]: newSelections,
    };
  });
};
```

### 4. Fix Line Spacing in Quiz Container

Add CSS fixes to improve line spacing in the Quiz component:

```css
.quiz-question-text {
  line-height: 1.5;
  margin-bottom: 1rem;
}

.quiz-answer-option {
  margin-bottom: 0.75rem;
  line-height: 1.4;
}
```

### 5. Fix Certificate Generation

1. Verify the certificate template path and ensure it exists
2. Add comprehensive logging to the certificate generation process
3. Ensure the Supabase storage bucket exists and has the correct permissions
4. Fix the course completion logic to properly trigger certificate generation

```typescript
// Example improvements to certificate generation
export async function generateCertificate({
  userId,
  courseId,
  fullName,
}: GenerateCertificateParams) {
  console.log(
    `Starting certificate generation for user ${userId}, course ${courseId}`,
  );

  // 1. Get PDF.co API key from environment variables
  const pdfCoApiKey = process.env.PDF_CO_API_KEY;

  if (!pdfCoApiKey) {
    console.error('PDF_CO_API_KEY is not defined in environment variables');
    throw new Error('PDF_CO_API_KEY is not defined in environment variables');
  }

  // 2. Verify the certificate template path
  const fs = require('fs');
  const path = require('path');
  const appDir = path.join(process.cwd(), 'apps', 'web');
  const templatePath = path.join(
    appDir,
    'public',
    'certificates',
    'ddm_certificate_form.pdf',
  );

  console.log(`Checking certificate template at: ${templatePath}`);
  if (!fs.existsSync(templatePath)) {
    console.error(`Certificate template not found at: ${templatePath}`);
    throw new Error(`Certificate template not found at: ${templatePath}`);
  }

  // Rest of the certificate generation process with added logging
  // ...
}
```

## Implementation Steps

1. **Create a Database Migration Script**

   - Create a new migration file in `apps/payload/src/migrations/` to fix the quiz relationships
   - Run the migration to update the database

2. **Update the LessonViewClient Component**

   - Modify the `markLessonAsCompleted` function to navigate to the next lesson
   - Test with lessons that don't have quizzes

3. **Update the QuizComponent**

   - Modify the component to handle multiple correct answers
   - Test with quizzes that have multiple correct answers

4. **Fix CSS Styling**

   - Add CSS fixes to improve line spacing in the Quiz component
   - Test with different quiz questions

5. **Fix Certificate Generation**
   - Verify the certificate template path
   - Add comprehensive logging
   - Ensure the Supabase storage bucket exists
   - Fix the course completion logic
   - Test the complete certificate generation process

## Testing Plan

1. **Test Quiz Relationships**

   - Verify that all lessons have their corresponding quizzes linked
   - Test each of the previously problematic lessons

2. **Test Navigation**

   - Complete a lesson without a quiz and verify it navigates to the next lesson
   - Complete a lesson with a quiz and verify it navigates to the next lesson after passing the quiz

3. **Test Multiple Answers**

   - Test quizzes with multiple correct answers
   - Verify that multiple answers can be selected
   - Verify that the quiz is scored correctly

4. **Test Line Spacing**

   - Verify that line spacing in the quiz container is improved

5. **Test Certificate Generation**
   - Complete all required lessons
   - Verify that the certificate is generated
   - Verify that the certificate can be viewed and downloaded

## Conclusion

By implementing these fixes, we will resolve the issues with the course system, ensuring that:

1. All lessons are properly linked to their corresponding quizzes
2. Users are automatically navigated to the next lesson after completing a lesson
3. Quizzes with multiple correct answers work correctly
4. The Quiz container has proper line spacing
5. Certificates are generated correctly when the course is completed

This will provide a smoother and more consistent user experience for course participants.
