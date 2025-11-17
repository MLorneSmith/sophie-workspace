# Quiz Questions Relationship Fix Plan

## Issue Analysis

We've identified issues with the quiz questions relationship in our Payload CMS implementation. The specific problems are:

1. In payload, in the course quiz collection, the 'Questions' field is not being populated with questions from the quiz questions collection.
2. In the web app, on a lesson page (`apps/web/app/home/(user)/course/lessons/[slug]/page.tsx`), we're seeing 404 errors when trying to fetch quiz data and empty questions arrays in the database.

## Root Cause Analysis

After examining the codebase and logs, we've determined:

### 1. Architecture Design Change

- The system has been changed to use a **unidirectional relationship model** where:
  - `CourseQuizzes` have a `questions` field that references `QuizQuestions`
  - `QuizQuestions` no longer have a reference back to quizzes (the `quiz_id` field has been removed)
  - The QuizQuestions schema comments explicitly note: _"'quiz_id' field removed - using unidirectional relationship model"_

### 2. Content Migration Issues

- Our content migration system is not properly populating the relationship tables that link quizzes to questions
- The unidirectional fix script may not be working correctly

### 3. Frontend Fallback Mechanism Failure

- When a quiz is found, it has an empty `questions` array
- The fallback mechanism in `LessonDataProvider.tsx` tries to fetch questions using:

  ```typescript
  const questionsResponse = await callPayloadAPI(
    `quiz_questions?where[quiz_id][equals]=${quiz.id}&sort=order&depth=0`,
  );
  ```

- This fails because `quiz_questions` no longer have a `quiz_id` field due to the unidirectional relationship model

## Implementation Plan

We'll address this issue in two parts:

### 1. Fix Content Migration System

#### a. Update or verify the unidirectional quiz question repair script

1. Locate and review the existing `fix:unidirectional-quiz-questions` script
2. Ensure it correctly:
   - Identifies all quizzes and their associated questions (possibly using lesson data as a reference)
   - Creates entries in the relationship tables that connect quizzes to their questions
   - Validates that each quiz has the appropriate questions linked

#### b. Run the updated migration script

```powershell
pnpm --filter @kit/content-migrations run fix:unidirectional-quiz-questions
```

#### c. Verify the relationship structure

- Query the database to confirm the relationship tables are properly populated
- Perform a test fetch through Payload to confirm quizzes return with their questions

### 2. Fix Frontend Retrieval Code

Update the `LessonDataProvider.tsx` to work with the unidirectional relationship model:

#### a. Remove/replace the invalid fallback query

Current problematic code:

```typescript
// This will fail because quiz_id is no longer in QuizQuestions
const questionsResponse = await callPayloadAPI(
  `quiz_questions?where[quiz_id][equals]=${quiz.id}&sort=order&depth=0`,
);
```

#### b. Update Quiz Fetching with proper depth

Modify the quiz fetching code to ensure we retrieve the questions:

```typescript
// Use an appropriate depth parameter to include questions
const quiz = await getQuiz(quizId, 2); // Ensure depth is sufficient to populate relationships
```

#### c. Implement a corrected fallback mechanism

If questions are still empty, use an endpoint that respects the unidirectional relationship:

```typescript
// Use the relationship endpoint instead
const questionsResponse = await callPayloadAPI(
  `course_quizzes/${quiz.id}/questions?depth=1`,
);
```

#### d. Add direct database query as a last resort

For maximum resilience, add a direct database query similar to the `findCourseForQuiz` helper:

```typescript
// Function to find questions for a quiz using direct DB access
async function findQuestionsForQuiz(
  payload: Payload,
  quizId: string,
): Promise<any[]> {
  try {
    const client = new Client({
      connectionString:
        process.env.DATABASE_URI ||
        'postgresql://postgres:postgres@localhost:54322/postgres',
    });

    await client.connect();

    try {
      // Query the relationship table
      const result = await client.query(
        `
        SELECT quiz_questions_id 
        FROM payload.course_quizzes_questions_rels 
        WHERE _parent_id = $1 AND field = 'questions'
        ORDER BY order ASC
        `,
        [quizId],
      );

      if (result.rows?.length > 0) {
        // Map to array of question IDs
        const questionIds = result.rows.map((row) => row.quiz_questions_id);

        // Fetch the actual questions if needed
        // ...

        return questionIds;
      }

      return [];
    } finally {
      await client.end();
    }
  } catch (error) {
    console.error('Error finding questions for quiz:', error);
    return [];
  }
}
```

## Testing Strategy

1. Run the content migration system to verify relationship fixes

2. Test quiz loading in development:

   - Navigate to a lesson with a quiz
   - Verify in browser console that quiz data loads with questions
   - Validate that quiz rendering works correctly

3. Check database directly:
   - Verify relationship tables are populated
   - Ensure quiz questions relationship is properly established

## Conclusion

This approach maintains the unidirectional relationship model while fixing the issues in both content migration and frontend retrieval. The solution:

1. Respects the architectural decision to use unidirectional relationships
2. Ensures proper relationship table population during content migration
3. Updates frontend code to work with the relationship model
4. Provides appropriate fallback mechanisms for resilience

Once implemented, quizzes should load successfully with their questions, and the 404 errors in the logs will be resolved.
