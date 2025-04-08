# Course System Fix Implementation Plan

## Overview

This document outlines the implementation plan to fix three issues with the course system:

1. Missing lesson duration
2. Missing quizzes for certain lessons
3. Incorrect formatting of multi-answer quiz questions

## Issues and Solutions

### 1. Missing Lesson Duration

#### Issue:

- All lessons have a `lessonLength` field in their raw `.mdoc` files, but the `estimated_duration` field in the database is `null` for all lessons.

#### Root Cause:

- The `generate-sql-seed-files-fixed.ts` script correctly includes the `lessonLength` field when generating the SQL for lessons.
- However, there might be an issue with how the SQL is being executed or how the field is being handled in the database.

#### Solution:

- Verify that the `generateLessonsSql` function in `generate-sql-seed-files-fixed.ts` is correctly including the `estimated_duration` field in the SQL INSERT statement.
- Ensure that the `lessonLength` value from the raw data is properly mapped to the `estimated_duration` field in the SQL.

### 2. Missing Quizzes for Certain Lessons

#### Issue:

- Several lessons don't have associated quizzes:
  - "The Why: Building Introductions" (lesson_number: 203)
  - "The Why: Next Steps" (lesson_number: 204)
  - "Tables vs. Graphs" (lesson_number: 602)
  - "Preparation and Practice" (lesson_number: 701)

#### Root Cause:

- The `lessonQuizMapping.ts` file contains mappings between lesson slugs and quiz slugs.
- However, the mappings for the specific lessons mentioned above are commented out with "Add missing mapping" comments.
- The SQL generation script uses this mapping to set the `quiz_id` and `quiz_id_id` fields in the SQL for lessons.

#### Solution:

- Uncomment and properly implement the mappings in the `lessonQuizMapping.ts` file for the missing lessons:
  - "the-why-introductions" -> "introductions-quiz"
  - "the-why-next-steps" -> "why-next-steps-quiz"
  - "tables-vs-graphs" -> "tables-vs-graphs-quiz"
  - "preparation-practice" -> "preparation-practice-quiz"

### 3. Multiple Correct Answers in Quizzes

#### Issue:

- When a question has multiple correct answers, the full line of the answer should be selectable, not just the checkbox.

#### Root Cause:

- The current implementation in `QuizComponent.tsx` has the click handler on the div containing both the checkbox and the label.
- However, it may not be visually clear that the entire row is clickable, or the styling might not be optimal for this interaction.

#### Solution:

- Modify the `QuizComponent.tsx` file to improve the styling and interaction for multi-answer questions.
- Wrap the checkbox and label in a container that makes it visually clear the entire row is clickable.
- Ensure the click event properly toggles the checkbox state.

## Implementation Steps

### Step 1: Fix Lesson Duration in SQL Generation

In `packages/content-migrations/src/scripts/sql/generate-sql-seed-files-fixed.ts`, ensure the `estimated_duration` field is properly included in the SQL INSERT statement:

```typescript
// In the generateLessonsSql function, ensure the estimated_duration field is included
sql += `-- Insert lesson: ${data.title}
INSERT INTO payload.course_lessons (
  id,
  title,
  slug,
  description,
  content,
  lesson_number,
  estimated_duration, // Ensure this field is included
  course_id,
  ${mediaId ? 'featured_image_id,' : ''}
  ${quizId ? 'quiz_id,' : ''}
  ${quizId ? 'quiz_id_id,' : ''}
  created_at,
  updated_at
) VALUES (
  '${lessonId}', -- Generated UUID for the lesson
  '${data.title.replace(/'/g, "''")}',
  '${lessonSlug}',
  '${(data.description || '').replace(/'/g, "''")}',
  '${lexicalContent.replace(/'/g, "''")}',
  ${data.lessonNumber || data.order || 0},
  ${data.lessonLength || 0}, // Ensure this value is properly set
  '${COURSE_ID}', -- Course ID
  ${mediaId ? `'${mediaId}',` : ''}
  ${quizId ? `'${quizId}',` : ''}
  ${quizId ? `'${quizId}',` : ''}
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING; -- Skip if the lesson already exists
`;
```

### Step 2: Fix Missing Quiz Associations

In `packages/content-migrations/src/data/mappings/lesson-quiz-mappings.ts`, uncomment and properly implement the mappings:

```typescript
/**
 * Hard-coded mapping between lesson slugs and quiz slugs
 * This ensures consistent relationships between lessons and quizzes
 * even if the raw data doesn't have explicit quiz references
 */

export const lessonQuizMapping: Record<string, string> = {
  // Format: lessonSlug: quizSlug
  'our-process': 'our-process-quiz',
  'the-who': 'the-who-quiz',
  'the-why-introductions': 'introductions-quiz', // Uncomment this line
  'the-why-next-steps': 'why-next-steps-quiz', // Uncomment this line
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
  'tables-vs-graphs': 'tables-vs-graphs-quiz', // Uncomment this line
  'basic-graphs': 'basic-graphs-quiz',
  'fact-based-persuasion': 'fact-persuasion-quiz',
  'specialist-graphs': 'specialist-graphs-quiz',
  'preparation-practice': 'preparation-practice-quiz', // Uncomment this line
  performance: 'performance-quiz',
};
```

### Step 3: Fix Multi-Answer Question UI

In `apps/web/app/home/(user)/course/lessons/[slug]/_components/QuizComponent.tsx`, modify the multi-answer question rendering:

```tsx
// Replace the current multi-answer question rendering with this improved version
{
  isMultiAnswerQuestion(currentQuestion) ? (
    // Render checkboxes for multi-answer questions
    <div className="space-y-4">
      {(currentQuestion?.options || []).map(
        (option: any, optionIndex: number) => {
          return (
            <div
              key={optionIndex}
              className="hover:bg-accent flex cursor-pointer items-start rounded-md p-3 transition-colors"
              onClick={() =>
                handleMultiAnswerSelect(
                  optionIndex,
                  !isOptionSelected(optionIndex),
                )
              }
            >
              <div className="flex w-full items-center space-x-3">
                <Checkbox
                  id={`q${currentQuestionIndex}-o${optionIndex}`}
                  checked={isOptionSelected(optionIndex)}
                  onCheckedChange={(checked) =>
                    handleMultiAnswerSelect(optionIndex, checked === true)
                  }
                  className="mt-0.5"
                />
                <Label
                  htmlFor={`q${currentQuestionIndex}-o${optionIndex}`}
                  className="flex-1 cursor-pointer leading-6"
                  onClick={(e) => {
                    // Prevent the default behavior to avoid conflicts with the parent onClick
                    e.preventDefault();
                    handleMultiAnswerSelect(
                      optionIndex,
                      !isOptionSelected(optionIndex),
                    );
                  }}
                >
                  {option.text}
                </Label>
              </div>
            </div>
          );
        },
      )}
    </div>
  ) : (
    // Render radio buttons for single-answer questions (unchanged)
    <RadioGroup
      key={`question-${currentQuestionIndex}`}
      value={
        selectedAnswers[currentQuestionIndex]?.length > 0
          ? String(selectedAnswers[currentQuestionIndex][0])
          : undefined
      }
      onValueChange={(value) => handleSingleAnswerSelect(parseInt(value))}
      className="space-y-4"
    >
      {/* ... existing radio button code ... */}
    </RadioGroup>
  );
}
```

## Testing Plan

After implementing the changes, we'll test the system by:

1. Running the `reset-and-migrate.ps1` script to reset the database and run the migrations with the fixed files.

2. Verifying that lessons display the correct duration:

   - Check that the `estimated_duration` field is populated in the database.
   - Verify that the duration is displayed correctly in the UI.

3. Verifying that the previously missing quizzes are now associated with their lessons:

   - Check that the `quiz_id` and `quiz_id_id` fields are populated in the database for the previously missing lessons.
   - Verify that the quizzes are accessible from the lesson pages.

4. Verifying that multi-answer questions have the entire row clickable:
   - Test the quiz UI to ensure that clicking anywhere on the answer row toggles the checkbox.
   - Verify that the visual styling makes it clear that the entire row is clickable.

## Conclusion

By implementing these changes, we will fix the three issues with the course system:

1. Lessons will display the correct duration.
2. All lessons will have their associated quizzes.
3. Multi-answer questions will have the entire row clickable, improving the user experience.
