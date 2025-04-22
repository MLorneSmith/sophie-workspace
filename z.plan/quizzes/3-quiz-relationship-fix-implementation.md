# Quiz Relationship Fix Implementation

## 1. Problem Summary

The application was experiencing issues with quizzes not displaying properly:

1. **Empty Quizzes**: Multiple quizzes weren't displaying any content in the admin UI or on lesson pages
2. **Missing Course IDs**: All quizzes had `course_id_id = NULL` despite being marked as required in the schema
3. **Broken Relationships**: The bidirectional relationship between quizzes and quiz questions was not properly maintained

## 2. Root Causes Analysis

After investigating the database schema, collection configuration, and migration logs, we identified several root causes:

1. **Schema vs. Application Mismatch**: The Payload CMS collection schemas defined relationships correctly, but the database state didn't match these definitions.

2. **Migration Script Limitations**: The existing scripts `fix-invalid-quiz-references.ts` and `fix-quiz-question-relationships.ts` had logic issues:

   - The course lookup in `fix-invalid-quiz-references.ts` was failing silently
   - The question relationship script wasn't properly updating the questions array in quizzes

3. **Silent Failures**: The migration process continued despite relationship update failures, so issues were masked in logs but persisted in the database.

## 3. Solution Implemented

We implemented a comprehensive direct SQL approach to fix the quiz relationships:

### 3.1 Direct SQL Fix Script

Created a new script at `packages/content-migrations/src/scripts/fix/direct-quiz-fix.sql` that performs the following operations:

1. **Update Course IDs**: Sets the `course_id_id` field to the main course ID for all quizzes
2. **Fix Relationship Tables**: Ensures all bidirectional relationships exist between:

   - Quizzes and their course
   - Quizzes and their questions
   - Lessons and their quizzes

3. **Array Field Updates**: Updates the questions array in each quiz to match the associated questions

### 3.2 TypeScript Runner

Created `packages/content-migrations/src/scripts/fix/run-direct-quiz-fix.ts` that:

- Loads the SQL script
- Executes each statement in a transaction
- Provides comprehensive error handling and reporting
- Verifies the changes with summary queries

### 3.3 Integration with Migration Process

Updated the orchestration script in `scripts/orchestration/phases/loading.ps1` to:

- Run our new direct fix before the existing quiz fixes
- Keep running the original scripts for backward compatibility
- Provide clear logging of the process

### 3.4 NPM Script Registration

Added a new script to `package.json`:

```json
"fix:direct-quiz-fix": "tsx src/scripts/fix/run-direct-quiz-fix.ts"
```

## 4. Testing

The solution was tested by:

1. Running a full database migration with `./reset-and-migrate.ps1`
2. Verifying that quizzes have the correct course ID in the database
3. Checking that quiz questions appear in the quizzes in the admin interface
4. Confirming that lesson pages display the "Take Quiz" button when appropriate

## 5. Benefits of This Approach

1. **Transaction Safety**: The entire fix runs within a transaction, ensuring database consistency
2. **Direct Data Manipulation**: By using SQL directly, we bypass potential issues in the Payload API
3. **Verification Included**: The script includes verification queries to confirm success
4. **Maintains Compatibility**: Works alongside existing scripts without breaking them
5. **Self-Contained**: All the fix logic is in a single SQL file for easy review and maintenance

## 6. Future Considerations

While this fix resolves the immediate issues, some long-term considerations include:

1. **Collection Definition Review**: Consider checking if the collection definitions match expectations
2. **Constraint Enforcement**: Add appropriate database constraints to prevent invalid references
3. **Automated Testing**: Create tests to verify quiz relationships remain intact

## 7. Technical Implementation Details

### 7.1 Course Reference Fix

```sql
-- Update all course_quizzes to have the correct course_id_id
UPDATE payload.course_quizzes
SET course_id_id = '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8'
WHERE course_id_id IS NULL;
```

### 7.2 Quiz-Question Relationship Fix

```sql
-- Update the questions array in course_quizzes based on quiz_questions
WITH quiz_questions_by_quiz AS (
  SELECT
    quiz_id,
    ARRAY_AGG(id) as question_ids
  FROM payload.quiz_questions
  WHERE quiz_id IS NOT NULL
  GROUP BY quiz_id
)
-- Then update each quiz with its questions array
UPDATE payload.course_quizzes cq
SET questions = qq.question_ids
FROM quiz_questions_by_quiz qq
WHERE cq.id = qq.quiz_id;
```

### 7.3 Bidirectional Relationship Maintenance

```sql
-- Ensure all quiz-question relationships exist in course_quizzes_rels
INSERT INTO payload.course_quizzes_rels (id, _parent_id, field, value, created_at, updated_at, quiz_questions_id)
SELECT
  gen_random_uuid() as id,
  qq.quiz_id as _parent_id,
  'questions' as field,
  qq.id as value,
  NOW() as created_at,
  NOW() as updated_at,
  qq.id as quiz_questions_id
FROM payload.quiz_questions qq
WHERE quiz_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM payload.course_quizzes_rels rel
  WHERE rel._parent_id = qq.quiz_id
  AND rel.field = 'questions'
  AND rel.value = qq.id::text
);
```
